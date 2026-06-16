const fs = require("fs");
const path = require("path");

const baseUrl = (process.env.GEO_SITE_URL || "https://2707932128-hash.github.io/geo-agent-cloud/").replace(/\/?$/, "/");

const checks = [
  { name: "home", path: "", mustInclude: "GEO Agent Cloud" },
  { name: "llms.txt", path: "llms.txt", mustInclude: "AI-readable index" },
  { name: "robots.txt", path: "robots.txt", mustInclude: "Sitemap:" },
  { name: "schema.json", path: "schema.json", mustInclude: "SoftwareApplication" },
  { name: "sitemap.xml", path: "sitemap.xml", mustInclude: "<urlset" },
];

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithRetry(url, attempts = 3) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await fetch(url, {
        headers: {
          "user-agent": "geo-agent-cloud-health-check/1.0",
        },
        signal: AbortSignal.timeout(20000),
      });
    } catch (error) {
      lastError = error;
      if (attempt < attempts) {
        await wait(1000 * attempt);
      }
    }
  }
  throw lastError;
}

async function runCheck(check) {
  const url = new URL(check.path, baseUrl).toString();
  const startedAt = Date.now();
  try {
    const response = await fetchWithRetry(url);
    const body = await response.text();
    const includesExpected = check.mustInclude ? body.includes(check.mustInclude) : true;
    const ok = response.ok && includesExpected;

    return {
      name: check.name,
      url,
      status: response.status,
      ok,
      latencyMs: Date.now() - startedAt,
      message: ok
        ? "ok"
        : `Expected HTTP 2xx and content containing "${check.mustInclude}"`,
    };
  } catch (error) {
    return {
      name: check.name,
      url,
      status: 0,
      ok: false,
      latencyMs: Date.now() - startedAt,
      message: error.message,
    };
  }
}

async function main() {
  const results = [];
  for (const check of checks) {
    results.push(await runCheck(check));
  }

  const report = {
    generatedAt: new Date().toISOString(),
    baseUrl,
    summary: {
      total: results.length,
      pass: results.filter((item) => item.ok).length,
      fail: results.filter((item) => !item.ok).length,
    },
    results,
  };

  const outDir = path.join(process.cwd(), "reports");
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, "geo-health-check.json"), JSON.stringify(report, null, 2));

  const summaryPath = process.env.GITHUB_STEP_SUMMARY;
  if (summaryPath) {
    const lines = [
      "# GEO Agent Cloud Health Check",
      "",
      `Base URL: ${baseUrl}`,
      "",
      `Pass: ${report.summary.pass}/${report.summary.total}`,
      "",
      "| Check | Status | Latency | Message |",
      "| --- | ---: | ---: | --- |",
      ...results.map((item) => `| ${item.name} | ${item.status} | ${item.latencyMs}ms | ${item.message.replace(/\|/g, "\\|")} |`),
      "",
    ];
    fs.appendFileSync(summaryPath, lines.join("\n"));
  }

  console.log(JSON.stringify(report, null, 2));

  if (report.summary.fail > 0) {
    process.exitCode = 1;
  }
}

main();
