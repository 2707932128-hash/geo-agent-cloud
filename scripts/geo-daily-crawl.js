const fs = require("fs");
const path = require("path");

const DEFAULT_CONFIG = path.join(process.cwd(), "data", "company-config.json");
const DEFAULT_OUT_DIR = path.join(process.cwd(), "reports");

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeBaseUrl(url) {
  return String(url || "").replace(/\/?$/, "/");
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function textBetween(source, pattern) {
  const match = source.match(pattern);
  return match ? match[1].replace(/\s+/g, " ").trim() : "";
}

function stripHtml(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function keywordList(config) {
  return String(config.keywords || "")
    .split(/[,，\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function isFetchableUrl(value) {
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) && !url.hostname.endsWith(".invalid");
  } catch {
    return false;
  }
}

async function fetchWithRetry(url, attempts = 3) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: {
          "user-agent": "geo-agent-daily-crawl/1.0",
          "accept": "text/html,application/xml,text/plain,application/json;q=0.9,*/*;q=0.8",
        },
        signal: AbortSignal.timeout(20000),
      });
      return response;
    } catch (error) {
      lastError = error;
      if (attempt < attempts) await wait(1000 * attempt);
    }
  }
  throw lastError;
}

async function readSitemapUrls(sitemapUrl, limit) {
  if (!isFetchableUrl(sitemapUrl)) return [];
  try {
    const response = await fetchWithRetry(sitemapUrl);
    if (!response.ok) return [];
    const xml = await response.text();
    return [...xml.matchAll(/<loc>\s*([^<]+)\s*<\/loc>/gi)]
      .map((match) => match[1].trim())
      .filter(isFetchableUrl)
      .slice(0, limit);
  } catch {
    return [];
  }
}

function collectTargets(config) {
  const baseUrl = normalizeBaseUrl(config.siteUrl);
  const targets = new Map();

  if (isFetchableUrl(baseUrl)) {
    targets.set(baseUrl, { name: "Home", type: "owned", url: baseUrl, required: true });
    targets.set(new URL("llms.txt", baseUrl).toString(), { name: "llms.txt", type: "geo-file", url: new URL("llms.txt", baseUrl).toString(), required: true });
    targets.set(new URL("schema.json", baseUrl).toString(), { name: "schema.json", type: "geo-file", url: new URL("schema.json", baseUrl).toString(), required: true });
  }

  for (const source of config.sources || []) {
    if (source.enabled === false || !isFetchableUrl(source.url)) continue;
    const existing = targets.get(source.url) || {};
    const sourceRequired = ["自有来源", "GEO文件", "结构化数据"].includes(source.type);
    targets.set(source.url, {
      ...existing,
      name: source.name || existing.name || source.url,
      type: source.type || existing.type || "source",
      url: source.url,
      required: Boolean(existing.required || sourceRequired),
    });
  }

  return targets;
}

async function inspectTarget(target, keywords) {
  const startedAt = Date.now();
  try {
    const response = await fetchWithRetry(target.url);
    const body = await response.text();
    const contentType = response.headers.get("content-type") || "";
    const text = stripHtml(body);
    const title = textBetween(body, /<title[^>]*>([\s\S]*?)<\/title>/i);
    const description = textBetween(body, /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["'][^>]*>/i)
      || textBetween(body, /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["'][^>]*>/i);
    const h1Count = (body.match(/<h1[\s>]/gi) || []).length;
    const keywordHits = keywords.filter((keyword) => body.includes(keyword) || text.includes(keyword));
    const ok = response.ok && (!target.required || text.length > 0);

    return {
      ...target,
      ok,
      status: response.status,
      latencyMs: Date.now() - startedAt,
      contentType,
      title,
      description,
      h1Count,
      wordCount: text ? text.split(/\s+/).length : 0,
      keywordHits,
      recommendation: ok
        ? keywordHits.length ? "内容可抓取，且命中目标关键词。" : "内容可抓取，但目标关键词覆盖偏弱。"
        : "页面不可访问或内容为空，需要检查链接、权限或 robots 策略。",
    };
  } catch (error) {
    return {
      ...target,
      ok: false,
      status: 0,
      latencyMs: Date.now() - startedAt,
      contentType: "",
      title: "",
      description: "",
      h1Count: 0,
      wordCount: 0,
      keywordHits: [],
      recommendation: error.message,
    };
  }
}

function buildMarkdown(report) {
  const lines = [
    "# GEO Daily Crawl Report",
    "",
    `Generated: ${report.generatedAt}`,
    `Company: ${report.company.name}`,
    `Site: ${report.company.siteUrl}`,
    "",
    `Summary: ${report.summary.pass}/${report.summary.total} passed, ${report.summary.warn} warnings, ${report.summary.fail} failed.`,
    "",
    "| Target | Status | Words | Keywords | Recommendation |",
    "| --- | ---: | ---: | --- | --- |",
    ...report.targets.map((item) => `| ${item.name} | ${item.status} | ${item.wordCount} | ${item.keywordHits.join(", ") || "-"} | ${item.recommendation.replace(/\|/g, "\\|")} |`),
    "",
  ];
  return lines.join("\n");
}

async function runDailyCrawl(input = {}) {
  const configPath = input.configPath || process.env.GEO_COMPANY_CONFIG || DEFAULT_CONFIG;
  const outDir = input.outDir || process.env.GEO_REPORT_DIR || DEFAULT_OUT_DIR;
  const config = input.config || readJson(configPath);
  const keywords = keywordList(config);
  const targetMap = collectTargets(config);
  const sitemapTargets = await readSitemapUrls(config.sitemapUrl, config.crawl?.maxSitemapPages || 4);

  for (const url of sitemapTargets) {
    if (!targetMap.has(url)) {
      targetMap.set(url, { name: "Sitemap Page", type: "sitemap", url, required: false });
    }
  }

  const targets = [];
  for (const target of targetMap.values()) {
    targets.push(await inspectTarget(target, keywords));
  }

  const fail = targets.filter((item) => !item.ok && item.required).length;
  const warn = targets.filter((item) => item.ok && item.keywordHits.length === 0).length
    + targets.filter((item) => !item.ok && !item.required).length;
  const pass = targets.length - fail - warn;
  const report = {
    ok: fail === 0,
    generatedAt: new Date().toISOString(),
    company: {
      name: config.companyName,
      industry: config.industry,
      siteUrl: config.siteUrl,
      sitemapUrl: config.sitemapUrl,
    },
    schedule: config.crawl?.schedule || "daily",
    keywords,
    summary: {
      total: targets.length,
      pass,
      warn,
      fail,
    },
    targets,
    nextActions: [
      "补齐未命中关键词的页面标题、FAQ 和服务说明。",
      "把通过审核的内容发布到可追踪渠道。",
      "持续检查 llms.txt、schema.json、sitemap.xml 是否保持公开可读。",
    ],
  };

  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, "geo-daily-crawl.json"), JSON.stringify(report, null, 2));
  fs.writeFileSync(path.join(outDir, "geo-daily-crawl.md"), buildMarkdown(report));

  return report;
}

if (require.main === module) {
  runDailyCrawl()
    .then((report) => {
      console.log(JSON.stringify(report, null, 2));
      if (!report.ok) process.exitCode = 1;
    })
    .catch((error) => {
      console.error(error);
      process.exitCode = 1;
    });
}

module.exports = { runDailyCrawl };
