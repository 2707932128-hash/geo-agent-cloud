const STORAGE_KEY = "geo-agent-cloud-v3-mist";

const navItems = [
  ["login", "登录"],
  ["home", "首页"],
  ["wizard", "部署向导"],
  ["workspace", "工作区"],
  ["onboarding", "配置向导"],
  ["agent", "智能体"],
  ["deploy", "GEO部署"],
  ["sources", "来源池"],
  ["drafts", "草稿"],
  ["publish", "追踪"],
  ["reports", "报告"],
  ["settings", "设置"]
];

const defaultState = {
  route: "login",
  loggedIn: false,
  pendingRoute: "",
  readiness: 88,
  currentRun: null,
  tenant: {
    name: "示例科技有限公司",
    industry: "企业服务",
    region: "上海 / 北京",
    plan: "Team",
    goal: "获取咨询线索",
    customers: "中小企业老板、市场负责人、增长负责人",
    questions: "GEO 获客怎么做？\n如何让 AI 更容易推荐我的公司？",
    competitors: "https://competitor.invalid\nhttps://industry-feed.invalid"
  },
  siteConfig: {
    siteUrl: "https://2707932128-hash.github.io/geo-agent-cloud/",
    sitemapUrl: "https://2707932128-hash.github.io/geo-agent-cloud/sitemap.xml",
    githubRepo: "https://github.com/2707932128-hash/geo-agent-cloud",
    keywords: "GEO 获客, AI 搜索优化, 生成式引擎优化"
  },
  lastGeoAudit: null,
  deployPackage: {
    packageRoot: "github-pages://2707932128-hash/geo-agent-cloud",
    siteUrl: "https://2707932128-hash.github.io/geo-agent-cloud/",
    generatedAt: "2026-06-16T02:54:30Z"
  },
  deployConnected: true,
  monitorEnabled: true,
  pipeline: [
    ["公司配置", 100],
    ["来源生成", 86],
    ["信号采集", 78],
    ["草稿审核", 54],
    ["效果追踪", 32]
  ],
  sources: [
    { id: "src-owned", name: "业务官网", type: "自有来源", url: "https://2707932128-hash.github.io/geo-agent-cloud/", status: "正常", enabled: true },
    { id: "src-comp", name: "竞品官网 A", type: "竞品来源", url: "https://competitor.invalid", status: "正常", enabled: true },
    { id: "src-rss", name: "行业资讯源", type: "RSS", url: "https://industry-feed.invalid/rss", status: "正常", enabled: true },
    { id: "src-keyword", name: "关键词快照", type: "搜索意图", url: "keyword:GEO 获客", status: "待审核", enabled: true }
  ],
  drafts: [
    { id: "draft-1", title: "AI 搜索优化适合什么企业？", channel: "官网文章", status: "待审核" },
    { id: "draft-2", title: "GEO 获客工作流怎么搭建？", channel: "知乎回答", status: "需改写" },
    { id: "draft-3", title: "如何让 AI 更容易理解你的服务？", channel: "公众号", status: "已通过" }
  ],
  publishRecords: [
    { id: "pub-1", platform: "知乎", keyword: "GEO 获客", url: "https://2707932128-hash.github.io/geo-agent-cloud/", leads: 4, status: "已发布" }
  ],
  runs: [
    {
      id: "run-seed",
      date: "2026-06-13 08:00",
      status: "完成",
      sources: 12,
      signals: 36,
      drafts: 8,
      failed: 0,
      advice: "继续补充真实客户问题，并把已通过草稿发布到知乎和官网。"
    }
  ],
  reports: [
    ["2026-06-13", "生成 36 条信号、8 篇草稿、4 条线索记录。"],
    ["2026-06-12", "新增 22 条信号，发现 3 个高意图问题。"]
  ],
  geoDeploy: [
    { id: "llms", name: "llms.txt", tool: "dotenvx/llmstxt + 自研生成器", status: "已接入", score: 88, detail: "从 sitemap 和核心页面生成 AI 可读入口。" },
    { id: "markdown", name: "AI 可读 Markdown", tool: "continuedev/next-geo 思路", status: "设计中", score: 54, detail: "为 Next.js 页面提供 Markdown 版本和 AI bot 友好响应。" },
    { id: "schema", name: "Schema / JSON-LD", tool: "自研模板", status: "已接入", score: 86, detail: "为公司、服务、FAQ、文章生成结构化数据。" },
    { id: "audit", name: "GEO Audit", tool: "geo-optimizer-skill 思路", status: "已接入", score: 82, detail: "检查 AI bot、llms.txt、sitemap、schema、引用和页面可读性。" },
    { id: "actions", name: "GitHub Actions", tool: "自研 CI/CD 模板", status: "已接入", score: 88, detail: "每次发布自动生成 GEO 文件并跑审计。" }
  ]
};

let state = loadState();
const nav = document.querySelector("#nav");
const view = document.querySelector("#view");
const title = document.querySelector("#page-title");
const tenantName = document.querySelector("#tenant-name");
const tenantMeta = document.querySelector("#tenant-meta");
const toast = document.querySelector("#toast");
const isPublicMode = Boolean(window.GEO_PUBLIC_MODE);

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    return saved ? { ...clone(defaultState), ...saved } : clone(defaultState);
  } catch {
    return clone(defaultState);
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function notify(message) {
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(notify.timer);
  notify.timer = setTimeout(() => toast.classList.remove("show"), 2200);
}

function metric(label, value) {
  return `<div class="metric"><strong>${value}</strong><span>${label}</span></div>`;
}

function card(markup, size = "") {
  return `<article class="card ${size}">${markup}</article>`;
}

function fieldValue(id) {
  return document.querySelector(id)?.value.trim() || "";
}

function createPublicAuditReport() {
  const now = new Date().toISOString();
  return {
    ok: true,
    publicMode: true,
    auditedAt: now,
    siteUrl: state.siteConfig.siteUrl,
    sitemapUrl: state.siteConfig.sitemapUrl,
    score: 76,
    summary: { pass: 5, warn: 4, fail: 0 },
    checks: [
      { status: "pass", name: "首页可访问", detail: "公网预览模式：实际部署后由本地/云端 API 检测。", fix: "上线后运行真实 GEO Audit。" },
      { status: "pass", name: "llms.txt 生成", detail: "部署包会包含 public/llms.txt。", fix: "把文件部署到网站根目录。" },
      { status: "warn", name: "线上 llms.txt", detail: "公网预览不访问你的真实站点。", fix: "上线后检查 /llms.txt 是否返回 200。" },
      { status: "warn", name: "Schema / JSON-LD", detail: "部署包会包含 schema.json。", fix: "把结构化数据嵌入核心页面。" },
      { status: "warn", name: "AI 可读 Markdown", detail: "需要接入 Next.js Markdown 响应层。", fix: "为核心页面提供 .md 或 AI bot 友好响应。" }
    ],
    recommendations: [
      { item: "llms.txt", fix: "部署 public/llms.txt 到网站根目录。" },
      { item: "Schema", fix: "把 schema.json 嵌入官网首页和服务页。" },
      { item: "Markdown", fix: "为核心页面生成 AI 可读 Markdown 版本。" }
    ]
  };
}

function createPublicPackageManifest() {
  return {
    ok: true,
    publicMode: true,
    generatedAt: new Date().toISOString(),
    packageRoot: "public-preview/geo-deploy-package",
    siteUrl: state.siteConfig.siteUrl,
    sitemapUrl: state.siteConfig.sitemapUrl,
    githubRepo: state.siteConfig.githubRepo,
    keywords: state.siteConfig.keywords.split(/[,，\n]/).map((item) => item.trim()).filter(Boolean),
    files: [
      "public/llms.txt",
      "public/schema.json",
      "public/robots.txt",
      ".github/workflows/geo-audit.yml",
      "geo-audit-summary.json",
      "README.md"
    ]
  };
}

function setRoute(route) {
  if (!state.loggedIn && route !== "login") {
    state.pendingRoute = route;
    state.route = "login";
    history.replaceState(null, "", "#login");
    notify("请先登录演示账号");
  } else {
    state.route = route;
    history.replaceState(null, "", `#${route}`);
  }
  saveState();
  render();
}

function sourceStats() {
  const enabled = state.sources.filter((item) => item.enabled).length;
  const paused = state.sources.length - enabled;
  return { total: state.sources.length, enabled, paused };
}

function workspace() {
  const stats = sourceStats();
  return [
    card(`<small>WORKSPACE</small><h2>${state.tenant.name}</h2><p>${state.tenant.industry} · ${state.tenant.region} · ${state.tenant.plan}</p><div class="metrics">${metric("部署就绪", state.readiness)}${metric("启用来源", stats.enabled)}${metric("待审草稿", state.drafts.filter((item) => item.status !== "已通过").length)}${metric("累计线索", state.publishRecords.reduce((sum, item) => sum + Number(item.leads || 0), 0))}</div>`, "full"),
    card(`<small>PIPELINE</small><h3>自动部署阶段</h3><div class="pipeline">${state.pipeline.map(([label, value]) => `<div class="step"><strong>${label}</strong><div class="bar"><span style="width:${value}%"></span></div><span>${value}%</span></div>`).join("")}</div>`, "wide"),
    card(`<small>NEXT ACTION</small><h3>下一步建议</h3><p>先补齐公司配置和来源池，再运行一次智能体。第二轮测试要重点看：保存是否稳定、运行记录是否清楚、报告是否能指导整改。</p><div class="quick-actions"><button type="button" data-route="onboarding">完善配置</button><button type="button" data-route="sources">管理来源</button></div>`)
  ].join("");
}

function login() {
  return [
    card(`<small>AUTH</small><h2>登录进入 GEO 工作区</h2><p>当前是本地演示登录，不连接真实账号系统。登录后可以保存配置、管理来源、模拟运行智能体并生成报告。</p><div class="login-box"><label>邮箱<input id="login-email" value="demo@geoagent.local" /></label><label>工作区<select id="login-tenant"><option>${state.tenant.name}</option><option>本地服务公司样板</option><option>教育培训公司样板</option></select></label><button type="button" id="demo-login">进入演示工作区</button></div>`, "wide"),
    card(`<small>STATUS</small><h3>本轮整改目标</h3><div class="checklist"><span>配置可保存</span><span>来源可管理</span><span>智能体有状态</span><span>报告可追踪</span></div>`)
  ].join("");
}

function home() {
  const nodes = [
    ["wizard", "向导", "开始"],
    ["workspace", "工作区", "总览"],
    ["onboarding", "配置", "建模"],
    ["sources", "来源", "抓取"],
    ["agent", "智能体", "运行"],
    ["deploy", "部署", "GEO"],
    ["drafts", "草稿", "审核"],
    ["publish", "追踪", "线索"],
    ["reports", "报告", "复盘"],
    ["settings", "设置", "系统"]
  ];
  const stats = sourceStats();
  const leads = state.publishRecords.reduce((sum, item) => sum + Number(item.leads || 0), 0);

  return `<section class="home-stage card full">
    <div class="home-orbit" aria-label="GEO 功能首页">
      <div class="orbit-ring ring-a"></div>
      <div class="orbit-ring ring-b"></div>
      <div class="orbit-rotor">
        ${nodes.map(([route, label, sub], index) => {
          const angle = index * (360 / nodes.length);
          return `<button class="orbit-node" type="button" data-route="${route}" style="--angle:${angle}deg">
            <span class="orbit-node-inner"><strong>${label}</strong><small>${sub}</small></span>
          </button>`;
        }).join("")}
      </div>
      <div class="home-core">
        <p>GEO DEPLOY AGENT</p>
        <h2>自动部署<br />智能体</h2>
        <span>${state.tenant.industry} · ${state.readiness}% 就绪</span>
        <div class="core-actions">
          <button type="button" data-route="wizard">开始部署</button>
          <button type="button" id="home-run-agent">运行</button>
        </div>
      </div>
    </div>
    <div class="home-panel">
      <small>COMMAND CENTER</small>
      <h3>${state.tenant.name}</h3>
      <p>这里保留为网页首页：只放核心状态和功能入口，具体操作进入二级页面完成。</p>
      <div class="metrics">${metric("启用来源", stats.enabled)}${metric("待审草稿", state.drafts.filter((item) => item.status !== "已通过").length)}${metric("运行记录", state.runs.length)}${metric("线索", leads)}</div>
    </div>
  </section>`;
}

function onboarding() {
  return card(`<small>ONBOARDING</small><h2>公司 GEO 配置向导</h2><p>这里的数据会保存在当前浏览器中。下一阶段接入 Supabase 后，会变成真正的多人账号数据。</p><div class="wizard-steps"><span class="active">公司</span><span>客户</span><span>来源</span><span>目标</span></div><div class="form"><label>公司名称<input id="tenant-name-input" value="${state.tenant.name}" /></label><label>行业类型<select id="tenant-industry"><option ${state.tenant.industry === "企业服务" ? "selected" : ""}>企业服务</option><option ${state.tenant.industry === "本地服务" ? "selected" : ""}>本地服务</option><option ${state.tenant.industry === "教育培训" ? "selected" : ""}>教育培训</option><option ${state.tenant.industry === "医疗健康" ? "selected" : ""}>医疗健康</option></select></label><label>服务地区<input id="tenant-region" value="${state.tenant.region}" /></label><label>转化目标<input id="tenant-goal" value="${state.tenant.goal}" /></label><label class="full">目标客户<textarea id="tenant-customers">${state.tenant.customers}</textarea></label><label class="full">客户常问问题<textarea id="tenant-questions">${state.tenant.questions}</textarea></label><label class="full">竞品/行业来源<textarea id="tenant-competitors">${state.tenant.competitors}</textarea></label></div><div class="form-actions"><button type="button" id="save-onboarding">保存配置</button><button type="button" id="generate-workflow">生成工作流</button></div>`, "full");
}

function agent() {
  const run = state.currentRun;
  const statusMarkup = run
    ? `<div class="run-status"><strong>${run.status}</strong><div class="bar"><span style="width:${run.progress}%"></span></div><span>${run.message}</span></div>`
    : `<div class="run-status idle"><strong>等待运行</strong><div class="bar"><span style="width:0%"></span></div><span>点击右上角“运行智能体”开始一次模拟任务。</span></div>`;

  return [
    card(`<small>AGENT</small><h2>GEO 自动部署智能体</h2><p>本轮整改后，智能体不再只是加分按钮，而是有明确状态流、运行记录、草稿生成和报告输出。</p><div class="metrics">${metric("就绪", state.readiness)}${metric("启用来源", sourceStats().enabled)}${metric("运行记录", state.runs.length)}${metric("健康", "OK")}</div>${statusMarkup}`, "wide"),
    card(`<small>ACTIONS</small><h3>自动动作</h3><div class="list"><article><strong>来源扫描</strong><span>公开网站、RSS、关键词快照</span></article><article><strong>草稿生成</strong><span>结合知识库生成待审内容</span></article><article><strong>每日复盘</strong><span>输出任务状态和下一步建议</span></article></div>`),
    card(`<small>RUN LOGS</small><h3>最近运行</h3><div class="list compact">${state.runs.slice(0, 4).map((item) => `<article><strong>${item.date} · ${item.status}</strong><span>${item.signals} 条信号 / ${item.drafts} 篇草稿 / 失败 ${item.failed}</span></article>`).join("")}</div>`, "full")
  ].join("");
}

function wizardStatus(done, active) {
  if (done) return "done";
  if (active) return "active";
  return "locked";
}

function wizard() {
  const projectDone = Boolean(state.tenant.name && state.siteConfig.siteUrl);
  const auditDone = Boolean(state.lastGeoAudit);
  const packageDone = Boolean(state.deployPackage);
  const deployDone = Boolean(state.deployConnected);
  const monitorDone = Boolean(state.monitorEnabled);
  const activeIndex = [projectDone, auditDone, packageDone, deployDone, monitorDone].findIndex((item) => !item);
  const current = activeIndex === -1 ? 4 : activeIndex;
  const steps = [
    ["创建项目", "公司、官网、关键词"],
    ["检测网站", "真实 GEO Audit"],
    ["生成文件", "llms / schema / workflow"],
    ["部署上线", "提交到网站仓库"],
    ["每日监控", "持续检查和建议"]
  ];

  return `<section class="wizard-shell card full">
    <div class="wizard-hero">
      <div>
        <small>GEO AUTOPILOT</small>
        <h2>从这里开始自动部署 GEO</h2>
        <p>按 5 步走：先建项目，再检测网站，生成部署包，部署到网站，最后开启每日监控。复杂模块仍然保留，但新手只需要跟着这里操作。</p>
        ${isPublicMode ? `<div class="public-note">公网预览模式：页面可公开访问，但真实抓取、文件写入和本地执行能力不会暴露到线上。</div>` : ""}
      </div>
      <div class="wizard-score">
        <strong>${state.lastGeoAudit?.score ?? state.readiness}</strong>
        <span>${state.lastGeoAudit ? "最近 GEO 评分" : "当前就绪度"}</span>
      </div>
    </div>

    <div class="wizard-flow">
      ${steps.map(([label, sub], index) => {
        const done = [projectDone, auditDone, packageDone, deployDone, monitorDone][index];
        const status = wizardStatus(done, index === current);
        return `<div class="wizard-step ${status}">
          <b>${index + 1}</b>
          <strong>${label}</strong>
          <span>${sub}</span>
        </div>`;
      }).join("")}
    </div>

    <div class="wizard-work">
      <article class="wizard-pane">
        <small>STEP 1</small>
        <h3>创建项目</h3>
        <div class="form">
          <label>公司名称<input id="wizard-company" value="${state.tenant.name}" /></label>
          <label>行业类型<input id="wizard-industry" value="${state.tenant.industry}" /></label>
          <label>官网地址<input id="wizard-site-url" value="${state.siteConfig.siteUrl}" /></label>
          <label>sitemap 地址<input id="wizard-sitemap-url" value="${state.siteConfig.sitemapUrl}" /></label>
          <label class="full">目标关键词<textarea id="wizard-keywords">${state.siteConfig.keywords}</textarea></label>
          <label class="full">GitHub 仓库<input id="wizard-github" value="${state.siteConfig.githubRepo}" /></label>
        </div>
        <div class="form-actions">
          <button type="button" id="wizard-save-project">保存项目</button>
          <button type="button" id="wizard-run-audit">保存并检测网站</button>
        </div>
      </article>

      <article class="wizard-pane">
        <small>STEP 2</small>
        <h3>检测结果</h3>
        ${state.lastGeoAudit ? `<div class="metrics">${metric("评分", state.lastGeoAudit.score)}${metric("通过", state.lastGeoAudit.summary.pass)}${metric("警告", state.lastGeoAudit.summary.warn)}${metric("失败", state.lastGeoAudit.summary.fail)}</div><div class="mini-list">${state.lastGeoAudit.recommendations.slice(0, 4).map((item) => `<p><b>${item.item}</b><span>${item.fix}</span></p>`).join("")}</div>` : `<p class="empty-copy">还没有检测结果。先在左侧保存项目，然后运行真实 GEO Audit。</p>`}
      </article>

      <article class="wizard-pane">
        <small>STEP 3</small>
        <h3>生成部署包</h3>
        <p>部署包会生成到本机 reports 目录，包含 llms.txt、schema.json、robots.txt 建议和 GitHub Actions workflow。</p>
        <div class="form-actions">
          <button type="button" id="wizard-generate-package">生成部署包</button>
          <button type="button" data-route="deploy">查看部署模块</button>
        </div>
        ${state.deployPackage ? `<div class="package-path"><strong>已生成</strong><span>${state.deployPackage.packageRoot}</span></div>` : ""}
      </article>

      <article class="wizard-pane">
        <small>STEP 4-5</small>
        <h3>部署与监控</h3>
        <div class="deploy-checks">
          <span class="${state.deployConnected ? "ok" : "warn"}">${state.deployConnected ? "已标记部署" : "等待部署"}</span>
          <span class="${state.monitorEnabled ? "ok" : "warn"}">${state.monitorEnabled ? "每日监控已开启" : "监控未开启"}</span>
        </div>
        <div class="form-actions">
          <button type="button" id="wizard-mark-deployed">标记已部署</button>
          <button type="button" id="wizard-enable-monitor">开启每日监控</button>
        </div>
      </article>
    </div>
  </section>`;
}

function deploy() {
  const average = Math.round(state.geoDeploy.reduce((sum, item) => sum + item.score, 0) / state.geoDeploy.length);
  const ready = state.geoDeploy.filter((item) => item.status === "已接入").length;
  const audit = state.lastGeoAudit;
  return [
    card(`<small>GEO DEPLOY</small><h2>GEO 技术部署层</h2><p>这里把外部 GitHub 工具和我们的工作流合并：先把 AI 可读、可抓取、可审计、可自动部署这些确定性能力做稳，再交给智能体做长期优化。</p><div class="metrics">${metric("部署评分", audit?.score ?? average)}${metric("已接入", `${ready}/${state.geoDeploy.length}`)}${metric("通过", audit?.summary?.pass ?? "-")}${metric("待改", audit ? audit.summary.warn + audit.summary.fail : "-")}</div>`, "wide"),
    card(`<small>TOOL MERGE</small><h3>合并策略</h3><div class="list compact"><article><strong>geo-optimizer-skill</strong><span>吸收审计指标和引用监控思路</span></article><article><strong>next-geo</strong><span>吸收 Next.js Markdown 响应层</span></article><article><strong>llmstxt</strong><span>吸收 sitemap 到 llms.txt 的生成链路</span></article></div>`),
    card(`<small>SITE ONBOARDING</small><h2>网站接入向导</h2><p>填写官网、sitemap、GitHub 仓库和关键词后，可以先在本地跑真实 GEO Audit。报告会写入本机 reports 目录。</p><div class="form"><label>官网地址<input id="site-url" value="${state.siteConfig.siteUrl}" /></label><label>sitemap 地址<input id="sitemap-url" value="${state.siteConfig.sitemapUrl}" /></label><label class="full">GitHub 仓库<input id="github-repo" value="${state.siteConfig.githubRepo}" /></label><label class="full">目标关键词<textarea id="site-keywords">${state.siteConfig.keywords}</textarea></label></div><div class="form-actions"><button type="button" id="save-site-config">保存网站配置</button><button type="button" id="run-geo-audit">运行真实 GEO Audit</button><button type="button" id="mark-deploy-ready">模拟接入模块</button></div>`, "full"),
    audit ? card(`<small>LAST AUDIT</small><h2>最近检测结果</h2><p>${audit.siteUrl} · ${audit.auditedAt}</p><div class="table">${audit.checks.map((item) => `<div class="table-row audit-row"><div><strong>${item.name}</strong><span>${item.detail}</span></div><b class="${item.status === "pass" ? "ok" : item.status === "warn" ? "warn" : "danger"}">${item.status}</b><span>${item.fix}</span></div>`).join("")}</div>`, "full") : "",
    card(`<small>MODULES</small><h2>部署模块</h2><div class="table">${state.geoDeploy.map((item) => `<div class="table-row deploy-row"><div><strong>${item.name}</strong><span>${item.detail}</span></div><span>${item.tool}</span><b class="${item.status === "已接入" ? "ok" : item.status === "设计中" ? "warn" : ""}">${item.status}</b><div class="score-chip">${item.score}</div></div>`).join("")}</div>`, "full")
  ].join("");
}

function sources() {
  return card(`<small>SOURCES</small><h2>来源池</h2><p>第一阶段只抓公开内容，不绕过登录、验证码或平台限制。你可以先在这里整理每家公司自己的来源。</p><div class="source-form"><input id="source-name" placeholder="来源名称，例如 行业博客" /><select id="source-type"><option>官网</option><option>竞品来源</option><option>RSS</option><option>搜索意图</option><option>社媒公开页</option></select><input id="source-url" placeholder="URL 或 keyword:关键词" /><button type="button" id="add-source">添加来源</button></div><div class="table">${state.sources.map((item) => `<div class="table-row"><div><strong>${item.name}</strong><span>${item.url}</span></div><span>${item.type}</span><b class="${item.enabled ? "ok" : "warn"}">${item.enabled ? item.status : "已暂停"}</b><div class="row-actions"><button type="button" data-source-toggle="${item.id}">${item.enabled ? "暂停" : "启用"}</button><button type="button" data-source-delete="${item.id}">删除</button></div></div>`).join("")}</div>`, "full");
}

function drafts() {
  return card(`<small>DRAFTS</small><h2>草稿审核</h2><p>所有可发布内容都先进入审核队列，避免智能体直接替你在外部平台发布不确定内容。</p><div class="table">${state.drafts.map((item) => `<div class="table-row"><div><strong>${item.title}</strong><span>${item.channel}</span></div><b class="${item.status === "已通过" ? "ok" : item.status === "需改写" ? "warn" : ""}">${item.status}</b><div class="row-actions"><button type="button" data-draft-approve="${item.id}">通过</button><button type="button" data-draft-rewrite="${item.id}">改写</button></div></div>`).join("")}</div>`, "full");
}

function publish() {
  return card(`<small>TRACKING</small><h2>发布与效果追踪</h2><p>记录平台、链接、覆盖关键词和线索数，用于判断 GEO 内容是否真正带来获客效果。</p><div class="source-form"><input id="pub-platform" placeholder="平台，例如 知乎" /><input id="pub-keyword" placeholder="覆盖关键词" /><input id="pub-url" placeholder="发布链接" /><input id="pub-leads" type="number" min="0" placeholder="线索数" /><button type="button" id="add-publish">记录</button></div><div class="table">${state.publishRecords.map((item) => `<div class="table-row"><div><strong>${item.platform} · ${item.keyword}</strong><span>${item.url}</span></div><span>${item.status}</span><b class="ok">${item.leads} 线索</b></div>`).join("")}</div>`, "full");
}

function reports() {
  return [
    card(`<small>REPORTS</small><h2>每日报告</h2><div class="list">${state.reports.map(([date, summary]) => `<article><strong>${date}</strong><span>${summary}</span></article>`).join("")}</div>`, "wide"),
    card(`<small>RUN RESULT</small><h3>最近一次运行建议</h3><p>${state.runs[0]?.advice || "还没有运行记录。先运行一次智能体生成报告。"}</p>`),
    card(`<small>DETAILS</small><h3>运行明细</h3><div class="table mini">${state.runs.map((item) => `<div class="table-row"><div><strong>${item.date}</strong><span>${item.status}</span></div><span>${item.sources} 来源</span><span>${item.signals} 信号</span><span>${item.drafts} 草稿</span></div>`).join("")}</div>`, "full")
  ].join("");
}

function settings() {
  return [
    card(`<small>ARCHITECTURE</small><h2>上线架构</h2><p>前端使用 Next.js；登录、数据库和权限使用 Supabase；定时任务使用 Trigger.dev；本地 Agent 只处理需要本机登录态的动作。</p><div class="metrics">${metric("Auth", "Supabase")}${metric("DB", "Postgres")}${metric("Task", "Trigger")}${metric("AI", "API")}</div>`, "wide"),
    card(`<small>LOCAL DATA</small><h3>演示数据</h3><p>当前整改版使用浏览器本地存储，方便你先肉眼测试产品流程。</p><div class="quick-actions"><button type="button" id="reset-demo">重置演示数据</button><button type="button" id="logout-demo">退出登录</button></div>`)
  ].join("");
}

const views = { login, home, wizard, workspace, onboarding, agent, deploy, sources, drafts, publish, reports, settings };

function bindEvents() {
  document.querySelectorAll("[data-route]").forEach((button) => {
    button.addEventListener("click", () => setRoute(button.dataset.route));
  });

  document.querySelector("#demo-login")?.addEventListener("click", () => {
    state.loggedIn = true;
    state.route = state.pendingRoute || "home";
    state.pendingRoute = "";
    saveState();
    notify("已进入演示工作区");
    setRoute(state.route);
  });

  document.querySelector("#save-onboarding")?.addEventListener("click", () => {
    state.tenant.name = fieldValue("#tenant-name-input") || state.tenant.name;
    state.tenant.industry = fieldValue("#tenant-industry") || state.tenant.industry;
    state.tenant.region = fieldValue("#tenant-region") || state.tenant.region;
    state.tenant.goal = fieldValue("#tenant-goal") || state.tenant.goal;
    state.tenant.customers = fieldValue("#tenant-customers");
    state.tenant.questions = fieldValue("#tenant-questions");
    state.tenant.competitors = fieldValue("#tenant-competitors");
    state.readiness = Math.max(state.readiness, 82);
    state.pipeline[0][1] = 100;
    saveState();
    notify("公司配置已保存");
    render();
  });

  document.querySelector("#generate-workflow")?.addEventListener("click", () => {
    const keyword = state.tenant.industry === "本地服务" ? "本地服务 GEO 获客" : `${state.tenant.industry} GEO 获客`;
    if (!state.sources.some((item) => item.url === `keyword:${keyword}`)) {
      state.sources.unshift({ id: `src-${Date.now()}`, name: `${state.tenant.industry}关键词快照`, type: "搜索意图", url: `keyword:${keyword}`, status: "正常", enabled: true });
    }
    state.pipeline[1][1] = 92;
    state.readiness = Math.max(state.readiness, 86);
    saveState();
    notify("已生成基础 GEO 工作流");
    setRoute("sources");
  });

  document.querySelector("#add-source")?.addEventListener("click", () => {
    const name = fieldValue("#source-name");
    const type = fieldValue("#source-type");
    const url = fieldValue("#source-url");
    if (!name || !url) {
      notify("请填写来源名称和地址");
      return;
    }
    state.sources.unshift({ id: `src-${Date.now()}`, name, type, url, status: "正常", enabled: true });
    state.pipeline[1][1] = Math.min(100, state.pipeline[1][1] + 3);
    saveState();
    notify("来源已添加");
    render();
  });

  document.querySelector("#save-site-config")?.addEventListener("click", () => {
    state.siteConfig.siteUrl = fieldValue("#site-url") || state.siteConfig.siteUrl;
    state.siteConfig.sitemapUrl = fieldValue("#sitemap-url");
    state.siteConfig.githubRepo = fieldValue("#github-repo");
    state.siteConfig.keywords = fieldValue("#site-keywords");
    saveState();
    notify("网站配置已保存");
    render();
  });

  document.querySelector("#wizard-save-project")?.addEventListener("click", () => {
    state.tenant.name = fieldValue("#wizard-company") || state.tenant.name;
    state.tenant.industry = fieldValue("#wizard-industry") || state.tenant.industry;
    state.siteConfig.siteUrl = fieldValue("#wizard-site-url") || state.siteConfig.siteUrl;
    state.siteConfig.sitemapUrl = fieldValue("#wizard-sitemap-url");
    state.siteConfig.keywords = fieldValue("#wizard-keywords");
    state.siteConfig.githubRepo = fieldValue("#wizard-github");
    state.readiness = Math.max(state.readiness, 82);
    saveState();
    notify("项目已保存");
    render();
  });

  document.querySelector("#wizard-run-audit")?.addEventListener("click", async () => {
    state.tenant.name = fieldValue("#wizard-company") || state.tenant.name;
    state.tenant.industry = fieldValue("#wizard-industry") || state.tenant.industry;
    state.siteConfig.siteUrl = fieldValue("#wizard-site-url") || state.siteConfig.siteUrl;
    state.siteConfig.sitemapUrl = fieldValue("#wizard-sitemap-url");
    state.siteConfig.keywords = fieldValue("#wizard-keywords");
    state.siteConfig.githubRepo = fieldValue("#wizard-github");
    saveState();
    notify("正在检测网站");

    if (isPublicMode) {
      const report = createPublicAuditReport();
      state.lastGeoAudit = report;
      state.reports.unshift([
        new Date().toISOString().slice(0, 10),
        `公网预览检测完成：评分 ${report.score}。真实检测需要在本地工作台或后端服务中运行。`
      ]);
      state.readiness = Math.max(state.readiness, report.score);
      saveState();
      notify("公网预览检测已生成");
      render();
      return;
    }

    try {
      const response = await fetch("/api/geo-audit", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          siteUrl: state.siteConfig.siteUrl,
          sitemapUrl: state.siteConfig.sitemapUrl,
          keywords: state.siteConfig.keywords.split(/[,，\n]/).map((item) => item.trim()).filter(Boolean),
          companyName: state.tenant.name
        })
      });
      const report = await response.json();
      if (!response.ok || !report.ok) throw new Error(report.error || "GEO Audit 失败");
      state.lastGeoAudit = report;
      state.reports.unshift([
        new Date().toISOString().slice(0, 10),
        `部署向导检测完成：评分 ${report.score}，通过 ${report.summary.pass} 项，待整改 ${report.summary.warn + report.summary.fail} 项。`
      ]);
      state.readiness = Math.max(state.readiness, Math.min(94, report.score));
      saveState();
      notify("网站检测完成");
      render();
    } catch (error) {
      notify(error.message);
    }
  });

  document.querySelector("#wizard-generate-package")?.addEventListener("click", async () => {
    notify("正在生成 GEO 部署包");
    if (isPublicMode) {
      const manifest = createPublicPackageManifest();
      state.deployPackage = manifest;
      state.geoDeploy = state.geoDeploy.map((item) => {
        if (["llms", "schema", "actions"].includes(item.id)) {
          return { ...item, status: "已接入", score: Math.max(item.score, 84) };
        }
        return item;
      });
      saveState();
      notify("公网预览部署包已生成");
      render();
      return;
    }

    try {
      const response = await fetch("/api/geo-package", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          siteUrl: state.siteConfig.siteUrl,
          sitemapUrl: state.siteConfig.sitemapUrl,
          keywords: state.siteConfig.keywords,
          companyName: state.tenant.name,
          githubRepo: state.siteConfig.githubRepo
        })
      });
      const manifest = await response.json();
      if (!response.ok || !manifest.ok) throw new Error(manifest.error || "生成部署包失败");
      state.deployPackage = manifest;
      state.geoDeploy = state.geoDeploy.map((item) => {
        if (["llms", "schema", "actions"].includes(item.id)) {
          return { ...item, status: "已接入", score: Math.max(item.score, 84) };
        }
        return item;
      });
      saveState();
      notify("GEO 部署包已生成");
      render();
    } catch (error) {
      notify(error.message);
    }
  });

  document.querySelector("#wizard-mark-deployed")?.addEventListener("click", () => {
    if (!state.deployPackage) {
      notify("请先生成部署包");
      return;
    }
    state.deployConnected = true;
    state.readiness = Math.max(state.readiness, 90);
    saveState();
    notify("已标记为部署完成");
    render();
  });

  document.querySelector("#wizard-enable-monitor")?.addEventListener("click", () => {
    state.monitorEnabled = true;
    state.readiness = Math.max(state.readiness, 92);
    state.reports.unshift([
      new Date().toISOString().slice(0, 10),
      "已在向导中开启每日监控。当前为本地原型状态，后续会接入真实定时任务。"
    ]);
    saveState();
    notify("每日监控已开启");
    render();
  });

  document.querySelector("#run-geo-audit")?.addEventListener("click", async () => {
    state.siteConfig.siteUrl = fieldValue("#site-url") || state.siteConfig.siteUrl;
    state.siteConfig.sitemapUrl = fieldValue("#sitemap-url");
    state.siteConfig.githubRepo = fieldValue("#github-repo");
    state.siteConfig.keywords = fieldValue("#site-keywords");
    saveState();
    notify("正在运行真实 GEO Audit");

    if (isPublicMode) {
      const report = createPublicAuditReport();
      state.lastGeoAudit = report;
      state.reports.unshift([
        new Date().toISOString().slice(0, 10),
        `公网预览 GEO Audit 已完成：评分 ${report.score}。真实检测需要在本地工作台或后端服务中运行。`
      ]);
      state.readiness = Math.max(state.readiness, report.score);
      saveState();
      notify("公网预览 GEO Audit 已生成");
      render();
      return;
    }

    try {
      const response = await fetch("/api/geo-audit", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          siteUrl: state.siteConfig.siteUrl,
          sitemapUrl: state.siteConfig.sitemapUrl,
          keywords: state.siteConfig.keywords.split(/[,，\n]/).map((item) => item.trim()).filter(Boolean),
          companyName: state.tenant.name
        })
      });
      const report = await response.json();
      if (!response.ok || !report.ok) throw new Error(report.error || "GEO Audit 失败");

      state.lastGeoAudit = report;
      state.geoDeploy = state.geoDeploy.map((item) => {
        const next = { ...item };
        if (item.id === "audit") {
          next.status = "已接入";
          next.score = report.score;
        }
        if (item.id === "llms" && report.artifacts?.llmsGenerated) {
          next.status = "已接入";
          next.score = Math.max(item.score, 82);
        }
        if (item.id === "schema" && report.artifacts?.schemaGenerated) {
          next.status = "已接入";
          next.score = Math.max(item.score, 78);
        }
        if (item.id === "markdown") {
          next.status = report.checks.some((check) => check.name === "AI 可读 Markdown" && check.status === "pass") ? "已接入" : "设计中";
          next.score = Math.max(item.score, report.score - 12);
        }
        return next;
      });
      state.reports.unshift([
        new Date().toISOString().slice(0, 10),
        `GEO Audit 已完成：评分 ${report.score}，通过 ${report.summary.pass} 项，待整改 ${report.summary.warn + report.summary.fail} 项。`
      ]);
      state.readiness = Math.max(state.readiness, Math.min(94, report.score));
      saveState();
      notify("真实 GEO Audit 已完成");
      render();
    } catch (error) {
      notify(error.message);
    }
  });

  document.querySelector("#mark-deploy-ready")?.addEventListener("click", () => {
    const next = state.geoDeploy.find((item) => item.status !== "已接入");
    if (next) {
      next.status = "已接入";
      next.score = Math.max(next.score, 82);
      state.readiness = Math.min(96, state.readiness + 2);
      saveState();
      notify(`${next.name} 已模拟接入`);
      render();
    } else {
      notify("所有 GEO 部署模块都已接入");
    }
  });

  document.querySelectorAll("[data-source-toggle]").forEach((button) => {
    button.addEventListener("click", () => {
      const item = state.sources.find((source) => source.id === button.dataset.sourceToggle);
      if (item) item.enabled = !item.enabled;
      saveState();
      render();
    });
  });

  document.querySelectorAll("[data-source-delete]").forEach((button) => {
    button.addEventListener("click", () => {
      state.sources = state.sources.filter((source) => source.id !== button.dataset.sourceDelete);
      saveState();
      notify("来源已删除");
      render();
    });
  });

  document.querySelectorAll("[data-draft-approve]").forEach((button) => {
    button.addEventListener("click", () => {
      const item = state.drafts.find((draft) => draft.id === button.dataset.draftApprove);
      if (item) item.status = "已通过";
      state.pipeline[3][1] = Math.min(100, state.pipeline[3][1] + 8);
      saveState();
      render();
    });
  });

  document.querySelectorAll("[data-draft-rewrite]").forEach((button) => {
    button.addEventListener("click", () => {
      const item = state.drafts.find((draft) => draft.id === button.dataset.draftRewrite);
      if (item) item.status = "需改写";
      saveState();
      render();
    });
  });

  document.querySelector("#add-publish")?.addEventListener("click", () => {
    const platform = fieldValue("#pub-platform");
    const keyword = fieldValue("#pub-keyword");
    const url = fieldValue("#pub-url");
    const leads = Number(fieldValue("#pub-leads") || 0);
    if (!platform || !keyword || !url) {
      notify("请填写平台、关键词和链接");
      return;
    }
    state.publishRecords.unshift({ id: `pub-${Date.now()}`, platform, keyword, url, leads, status: "已发布" });
    state.pipeline[4][1] = Math.min(100, state.pipeline[4][1] + 12);
    saveState();
    notify("追踪记录已保存");
    render();
  });

  document.querySelector("#reset-demo")?.addEventListener("click", () => {
    localStorage.removeItem(STORAGE_KEY);
    state = clone(defaultState);
    notify("演示数据已重置");
    render();
  });

  document.querySelector("#logout-demo")?.addEventListener("click", () => {
    state.loggedIn = false;
    state.route = "login";
    saveState();
    setRoute("login");
  });

  document.querySelector("#home-run-agent")?.addEventListener("click", runAgent);
}

function render() {
  nav.innerHTML = navItems.map(([key, label]) => `<button class="${state.route === key ? "active" : ""}" type="button" data-route="${key}"><span>${label}</span><span>›</span></button>`).join("");
  title.textContent = navItems.find(([key]) => key === state.route)?.[1] || "工作区";
  tenantName.textContent = state.loggedIn ? state.tenant.name : "未登录";
  tenantMeta.textContent = state.loggedIn ? `${state.tenant.plan} · ${state.tenant.industry}` : "请先进入演示账号";
  view.innerHTML = views[state.route]();
  bindEvents();
}

function completeAgentRun(run) {
  state.currentRun = { ...run, status: "完成", progress: 100, message: "报告已生成，草稿已进入审核队列。" };
  state.readiness = Math.min(96, state.readiness + 7);
  state.pipeline[2][1] = Math.min(100, state.pipeline[2][1] + 8);
  const generatedDraft = {
    id: `draft-${Date.now()}`,
    title: `${state.tenant.industry}公司如何用 GEO 获得更多咨询？`,
    channel: "官网文章",
    status: "待审核"
  };
  state.drafts.unshift(generatedDraft);
  state.runs.unshift({
    id: run.id,
    date: new Date().toLocaleString("zh-CN", { hour12: false }),
    status: "完成",
    sources: sourceStats().enabled,
    signals: 18 + sourceStats().enabled * 2,
    drafts: 1,
    failed: 0,
    advice: "本次运行已生成 1 篇新草稿。建议先审核草稿，再把通过内容发布到一个可追踪平台。"
  });
  state.reports.unshift([
    new Date().toISOString().slice(0, 10),
    `本次运行扫描 ${sourceStats().enabled} 个来源，生成 ${18 + sourceStats().enabled * 2} 条信号和 1 篇待审草稿。`
  ]);
  saveState();
  notify("智能体运行完成");
  render();
}

function runAgent() {
  if (!state.loggedIn) {
    setRoute("login");
    return;
  }
  const run = { id: `run-${Date.now()}`, status: "排队中", progress: 12, message: "正在创建运行任务。" };
  state.currentRun = run;
  saveState();
  setRoute("agent");
  const stages = [
    ["采集中", 38, "正在扫描启用来源。"],
    ["生成草稿", 68, "正在从信号中提炼选题。"],
    ["写入报告", 88, "正在生成每日复盘。"]
  ];
  stages.forEach(([status, progress, message], index) => {
    setTimeout(() => {
      state.currentRun = { ...run, status, progress, message };
      saveState();
      render();
    }, 800 * (index + 1));
  });
  setTimeout(() => completeAgentRun(run), 3400);
}

document.querySelector("#run-agent").addEventListener("click", runAgent);

const initial = location.hash.replace("#", "");
if (navItems.some(([key]) => key === initial)) {
  if (state.loggedIn || initial === "login") {
    state.route = initial;
  } else {
    state.pendingRoute = initial;
    state.route = "login";
  }
}
window.addEventListener("hashchange", () => {
  const next = location.hash.replace("#", "");
  if (navItems.some(([key]) => key === next)) setRoute(next);
});

render();
