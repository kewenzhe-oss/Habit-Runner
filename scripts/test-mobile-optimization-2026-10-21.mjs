// Run: node --experimental-websocket scripts/test-mobile-optimization-2026-10-21.mjs
// Independent, read-only browser QA. Does not start/stop application or PostgreSQL.
import { spawn } from "node:child_process"
import { mkdirSync, writeFileSync, mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { resolve, join } from "node:path"
import { createRequire } from "node:module"

const require = createRequire(import.meta.url)
const { encode } = require("next-auth/jwt")
process.loadEnvFile(resolve(".env.local"))
// Import Prisma after loading .env.local so its dotenv bootstrap cannot win first.
const { PrismaClient } = await import("@prisma/client")
const base = "http://localhost:3000"
const port = 9241
const outputDir = "/Users/grangerfdad/.codex/visualizations/2026/10/21/01a15c20-129c-7f30-8094-0f78e9efe790/testing-20261021"
const reportPath = resolve("docs/testing-mobile-2026-10-21.md")
mkdirSync(outputDir, { recursive: true })
const report = {
  startedAt: new Date().toISOString(), base, port, outputDir,
  methodology: "Chromium headless CDP; mobile=true, scale=1, height=900; 4 widths × 2 locales × 2 themes; read-only existing demo item; non-read HTTP methods blocked; no CPU/network throttling; sequential local warm-browser samples, not field performance or a load test",
  cases: [], errors: [], blockedWrites: [], browserErrors: [], httpErrors: [], screenshots: [],
}
let chrome, ws, profile, currentCase = "setup"
let nextId = 1
const pending = new Map()
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))
const redact = error => String(error?.message || error).replace(/postgres(?:ql)?:\/\/[^\s"']+/g, "[redacted database URL]")
async function waitUntil(fn, timeout = 15000, label = "condition") {
  const start = performance.now()
  while (performance.now() - start < timeout) {
    const value = await fn()
    if (value) return value
    await sleep(80)
  }
  throw new Error(`Timeout after ${timeout}ms: ${label}`)
}
function send(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = nextId++
    const timer = setTimeout(() => { pending.delete(id); reject(new Error(`CDP timeout: ${method}`)) }, 15000)
    pending.set(id, { resolve, reject, timer })
    ws.send(JSON.stringify({ id, method, params }))
  })
}
async function evaluate(expression) {
  const response = await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true })
  if (response.exceptionDetails) throw new Error(response.exceptionDetails.text + ": " + (response.exceptionDetails.exception?.description || ""))
  return response.result.value
}
async function frame() {
  await evaluate("new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))")
}
async function screenshot(name) {
  const path = join(outputDir, `${currentCase}-${name}.png`)
  const result = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false })
  writeFileSync(path, Buffer.from(result.data, "base64"))
  report.screenshots.push(path)
  return path
}
async function click(selectorExpression) {
  const point = await evaluate(`(() => { const e = ${selectorExpression}; if (!e) throw new Error('Click target missing'); e.scrollIntoView({block:'center',behavior:'instant'}); const r=e.getBoundingClientRect(); return {x:r.x+r.width/2,y:r.y+r.height/2}; })()`)
  await frame()
  const start = performance.now()
  await send("Input.dispatchMouseEvent", { type: "mouseMoved", ...point })
  await send("Input.dispatchMouseEvent", { type: "mousePressed", button: "left", clickCount: 1, ...point })
  await send("Input.dispatchMouseEvent", { type: "mouseReleased", button: "left", clickCount: 1, ...point })
  return start
}
async function navigate(path, selector) {
  const start = performance.now()
  await send("Page.navigate", { url: base + path })
  await waitUntil(() => evaluate(`location.pathname===${JSON.stringify(path)} && document.readyState==='complete' && Boolean(document.querySelector(${JSON.stringify(selector)}))`), 20000, `ready ${path}`)
  await evaluate("document.fonts.ready.then(() => true)")
  await frame()
  // Allow React effects to settle before physical pointer interaction.
  await sleep(250)
  return {
    readyMs: Math.round(performance.now() - start),
    ...await evaluate(`(() => {const n=performance.getEntriesByType('navigation')[0];return {ttfbMs:Math.round(n.responseStart-n.requestStart),domContentLoadedMs:Math.round(n.domContentLoadedEventEnd),loadMs:Math.round(n.loadEventEnd),theme:document.documentElement.className}})()`),
  }
}
const pageAudit = `(() => {
  const w = document.documentElement.clientWidth;
  const s = Math.max(document.documentElement.scrollWidth, document.body.scrollWidth);
  return {viewport:innerWidth,clientWidth:w,scrollWidth:s,pass:s<=w+1};
})()`
const helpers = `
  const rect=e=>{if(!e)return null;const r=e.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom}};
  const inside=(a,b)=>!!a&&!!b&&a.x>=b.x-1&&a.right<=b.right+1;
  const visible=e=>!!e&&e.getBoundingClientRect().width>0&&e.getBoundingClientRect().height>0&&!e.closest('[hidden],[aria-hidden="true"],[data-state="closed"]')&&getComputedStyle(e).visibility!=='hidden'&&getComputedStyle(e).display!=='none';
`
async function runCase(width, locale, theme) {
  currentCase = `${width}-${locale}-${theme}`
  const c = { id: currentCase, width, locale, theme, checks: {}, timing: {}, screenshots: [] }
  report.cases.push(c)
  const script = await send("Page.addScriptToEvaluateOnNewDocument", {
    source: `localStorage.setItem('theme',${JSON.stringify(theme)});localStorage.setItem('habit_runner_locale',${JSON.stringify(locale)});`,
  })
  try {
    await send("Emulation.setDeviceMetricsOverride", { width, height: 900, deviceScaleFactor: 1, mobile: true })
    await send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-color-scheme", value: theme }] })
    await send("Network.setCookie", { name: "habit_runner_locale", value: locale, url: base, path: "/", sameSite: "Lax" })

    c.timing.dashboard = await navigate("/dashboard", "#today-wisdom-title")
    c.checks.dashboardOverflow = await evaluate(pageAudit)
    c.checks.inspiration = await evaluate(`(() => {${helpers}
      const s=document.querySelector('section[aria-labelledby="today-wisdom-title"]');
      const q=s?.querySelector('blockquote');
      const collapsed=!!s?.closest('[data-state="closed"],details:not([open]),[hidden],[aria-hidden="true"]');
      return {title:s?.querySelector('h3')?.textContent,quoteLength:q?.textContent.trim().length||0,visible:visible(q),collapsed,hasCollapseTrigger:!!s?.querySelector('[aria-expanded]'),pass:visible(q)&&!!q.textContent.trim()&&!collapsed&&!s.querySelector('[aria-expanded]')};
    })()`)
    await evaluate("document.querySelector('section[aria-labelledby=\"today-wisdom-title\"]').scrollIntoView({block:'center',behavior:'instant'})")
    await frame()
    c.screenshots.push(await screenshot("inspiration"))

    c.timing.item = await navigate(`/items/${report.itemId}`, 'button[aria-haspopup="dialog"]')
    c.checks.itemOverflow = await evaluate(pageAudit)
    c.checks.journal = await evaluate(`(() => {${helpers}
      const title=[...document.querySelectorAll('h1,h2,h3')].find(e=>/Habit Footprint & Flow Journal|习惯足迹与心流日志/.test(e.textContent));
      if(!title)return {pass:false,error:'Journal heading missing'};
      title.scrollIntoView({block:'center',behavior:'instant'});
      const row=title.parentElement,badge=row.children[1],group=row.parentElement,description=group.querySelector('p');
      const tr=rect(title),br=rect(badge),rr=rect(row),dr=rect(description);
      const textRange=document.createRange();textRange.selectNodeContents(title);
      const content=[...textRange.getClientRects()].filter(r=>r.width>0).map(r=>({x:r.x,right:r.right,y:r.y,bottom:r.bottom}));
      const overlap=content.some(r=>r.x<br.right&&r.right>br.x&&r.y<br.bottom&&r.bottom>br.y);
      return {title:title.textContent.trim(),badge:badge?.textContent.trim(),titleRect:tr,badgeRect:br,rowRect:rr,descriptionRect:dr,contentRects:content,overlap,titleScrollWidth:title.scrollWidth,titleClientWidth:title.clientWidth,pass:visible(title)&&inside(tr,rr)&&inside(br,rr)&&!overlap&&dr.y>=rr.bottom-1&&title.scrollWidth<=title.clientWidth+1};
    })()`)
    await frame()
    c.screenshots.push(await screenshot("journal"))
    const trigger = `[...document.querySelectorAll('button[aria-haspopup="dialog"]')].find(e=>/每周统计|Weekly statistics/i.test(e.textContent))`
    c.checks.weeklyTrigger = await evaluate(`(() => {${helpers}
      const button=${trigger};
      if(!button)return {pass:false,error:'Weekly trigger missing'};
      button.scrollIntoView({block:'center',behavior:'instant'});
      const left=button.children[0],right=button.children[1];
      const b=rect(button),l=rect(left),r=rect(right);
      const overlaps=(a,b)=>a.x<b.right-0.5&&a.right>b.x+0.5&&a.y<b.bottom-0.5&&a.bottom>b.y+0.5;
      const contained=(a,b)=>inside(a,b)&&a.y>=b.y-1&&a.bottom<=b.bottom+1;
      const children=[...left.children].map(e=>({tag:e.tagName,text:e.textContent.trim(),...rect(e),scrollWidth:e.scrollWidth,clientWidth:e.clientWidth}));
      const textRects=[];
      const walker=document.createTreeWalker(left,NodeFilter.SHOW_TEXT);
      while(walker.nextNode()){
        const node=walker.currentNode;
        if(!node.textContent.trim())continue;
        const range=document.createRange();range.selectNodeContents(node);
        for(const t of range.getClientRects())textRects.push({text:node.textContent.trim(),x:t.x,y:t.y,right:t.right,bottom:t.bottom,width:t.width,height:t.height});
      }
      const childOverflow=children.some(c=>!contained(c,l)||c.scrollWidth>c.clientWidth+1);
      const textOverflow=textRects.some(t=>!contained(t,l));
      const textOverlapsRight=textRects.some(t=>overlaps(t,r));
      const childrenOverlap=children.some((a,i)=>children.slice(i+1).some(b=>overlaps(a,b)));
      return {buttonRect:b,leftRect:l,rightRect:r,leftScrollWidth:left.scrollWidth,leftClientWidth:left.clientWidth,children,textRects,childOverflow,textOverflow,textOverlapsRight,childrenOverlap,pass:contained(l,b)&&contained(r,b)&&l.right<=r.x+1&&left.scrollWidth<=left.clientWidth+1&&!childOverflow&&!textOverflow&&!textOverlapsRight&&!childrenOverlap};
    })()`)
    await frame()
    c.screenshots.push(await screenshot("weekly-trigger"))
    const openedAt = await click(trigger)
    await waitUntil(() => evaluate("!!document.querySelector('[role=\"dialog\"] [role=\"listitem\"]')"), 6000, "weekly dialog open after pointer click")
    await frame()
    c.timing.weeklyOpenMs = Math.round(performance.now() - openedAt)
    await sleep(250)
    c.checks.weekly = await evaluate(`(() => {${helpers}
      const d=document.querySelector('[role="dialog"]'),dr=rect(d),list=d.querySelector('[role="list"]');
      const rows=[...d.querySelectorAll('[role="listitem"]')].map(e=>{
        const date=e.children[0],progress=e.children[1],badge=e.children[2];
        const a=rect(date),b=rect(badge),p=rect(progress),r=rect(e),dateText=date.firstElementChild;
        return {date:dateText.textContent.trim(),badge:badge.textContent.trim(),dateRect:a,badgeRect:b,progressRect:p,rowRect:r,dateLines:Math.round(dateText.getBoundingClientRect().height/parseFloat(getComputedStyle(dateText).lineHeight)),dateScrollWidth:dateText.scrollWidth,dateClientWidth:dateText.clientWidth,firstRow:Math.abs(a.y-b.y)<=1,noOverlap:a.right<=b.x+1,progressPlacement:innerWidth>=640||p.y>=Math.max(a.bottom,b.bottom)-1,contained:inside(a,r)&&inside(b,r)&&inside(p,r)};
      });
      const allRowsPass=rows.length>0&&rows.every(r=>r.firstRow&&r.noOverlap&&r.progressPlacement&&r.contained&&r.dateLines===1&&r.dateScrollWidth<=r.dateClientWidth+1);
      return {title:d.querySelector('h2')?.textContent,dialogRect:dr,listClientWidth:list.clientWidth,listScrollWidth:list.scrollWidth,rowCount:rows.length,rows,pass:allRowsPass&&dr.x>=-1&&dr.right<=innerWidth+1&&list.scrollWidth<=list.clientWidth+1};
    })()`)
    c.checks.dialogOverflow = await evaluate(pageAudit)
    c.screenshots.push(await screenshot("weekly"))
    await click("document.querySelector('[role=\"dialog\"] button')")
    await waitUntil(() => evaluate("!document.querySelector('[role=\"dialog\"]')"), 5000, "weekly dialog closed")

    c.timing.insights = await navigate("/insights", '[role="group"] button[aria-pressed]')
    c.checks.heatmapButtons = await evaluate(`(() => {${helpers}
      const buttons=[...document.querySelectorAll('[role="group"] button[aria-pressed]')].filter(e=>/4|8|16/.test(e.textContent));
      const sizes=buttons.map(e=>({text:e.textContent.trim(),...rect(e)}));
      return {sizes,pass:sizes.length===3&&sizes.every(r=>r.width>=44&&r.height>=44)};
    })()`)
    c.checks.heatmapRanges = []
    for (const weeks of [4, 8, 16]) {
      const target = `[...document.querySelectorAll('[role="group"] button[aria-pressed]')].find(e=>/(^|\\D)${weeks}(\\D|$)/.test(e.textContent))`
      const clickedAt = await click(target)
      await waitUntil(() => evaluate(`(${target})?.getAttribute('aria-pressed')==='true'`), 3000, `heatmap ${weeks} selected`)
      await frame()
      c.checks.heatmapRanges.push({ weeks, updateMs: Math.round(performance.now() - clickedAt), ...await evaluate(pageAudit) })
    }
    await frame()
    c.screenshots.push(await screenshot("heatmap-16"))
    c.checks.mode = await evaluate(`({actualTheme:document.documentElement.classList.contains('dark')?'dark':'light',expectedTheme:${JSON.stringify(theme)},inspirationExpectedLocale:${JSON.stringify(locale)},pass:document.documentElement.classList.contains(${JSON.stringify(theme)})})`)
    // Locale is verified from rendered strings, not only storage or cookies.
    c.checks.locale = { renderedWeeklyTitle: c.checks.weekly.title, renderedJournalTitle: c.checks.journal.title,
      pass: locale === "en" ? /Weekly/i.test(c.checks.weekly.title || "") && /Habit Footprint/.test(c.checks.journal.title || "") : /每周/.test(c.checks.weekly.title || "") && /习惯足迹/.test(c.checks.journal.title || "") }
    c.pass = Object.values(c.checks).every(check => Array.isArray(check) ? check.every(x => x.pass) : check.pass)
  } catch (error) {
    c.error = redact(error)
    c.pass = false
    try { c.screenshots.push(await screenshot("error")) } catch {}
  } finally {
    await send("Page.removeScriptToEvaluateOnNewDocument", { identifier: script.identifier })
  }
  console.log(JSON.stringify({ case: c.id, pass: c.pass, failed: Object.entries(c.checks).filter(([,v])=>Array.isArray(v)?v.some(x=>!x.pass):!v.pass).map(([k])=>k), error: c.error }))
}
function saveReport() {
  report.finishedAt = new Date().toISOString()
  writeFileSync(join(outputDir, "results.json"), JSON.stringify(report, null, 2))
  const passed = report.cases.filter(c=>c.pass).length
  const lines = ["# 移动端浏览器实测 · 2026-10-21", "", `执行：${report.startedAt} → ${report.finishedAt}。`, "",
    `环境：${base}，Chromium ${report.browserVersion || "未连接"}，独立 CDP ${port}。${report.methodology}。`, "",
    `数据：隔离库 localhost/habit_runner_perf；demo 用户现有事项 ${report.itemId || "未读取"}。Prisma 查询在 READ ONLY 事务执行；浏览器拦截非 GET/HEAD/OPTIONS 请求。未修改产品、数据库或启停应用/PG。`, "",
    `结果：${passed}/${report.cases.length} 组合全部检查通过；目标为 16 组合。截图 ${report.screenshots.length} 张。`, "",
    "|组合|每日灵感常开|Journal 标题|Weekly 入口|Weekly 首排日期+badge|热图 44×44|页面溢出|语言/主题|结果|", "|---|---|---|---|---|---|---|---|---|"]
  const mark = v => v === undefined ? "未测" : v ? "通过" : "失败"
  for (const c of report.cases) {
    const overflow = [c.checks.dashboardOverflow,c.checks.itemOverflow,c.checks.dialogOverflow,...(c.checks.heatmapRanges||[])]
    lines.push(`|${c.id}|${mark(c.checks.inspiration?.pass)}|${mark(c.checks.journal?.pass)}|${mark(c.checks.weeklyTrigger?.pass)}|${mark(c.checks.weekly?.pass)}|${mark(c.checks.heatmapButtons?.pass)}|${mark(overflow.length===6?overflow.every(v=>v?.pass):undefined)}|${mark(c.checks.locale&&c.checks.mode?c.checks.locale.pass&&c.checks.mode.pass:undefined)}|${mark(c.pass)}|`)
  }
  lines.push("", "## 失败证据与修复定位", "")
  const failures = report.cases.filter(c=>!c.pass)
  if (!failures.length && report.cases.length === 16) lines.push("本次指定范围未发现失败。")
  for (const c of failures) {
    lines.push(`- ${c.id}: ${c.error || Object.entries(c.checks).filter(([,v])=>Array.isArray(v)?v.some(x=>!x.pass):!v.pass).map(([k])=>k).join(", ")}`)
    if (c.checks.journal && !c.checks.journal.pass) lines.push(`  - Journal: ${JSON.stringify(c.checks.journal)}；定位 components/items/item-detail-view.tsx 的日志标题首行。`)
    if (c.checks.weeklyTrigger && !c.checks.weeklyTrigger.pass) lines.push(`  - Weekly 入口: ${JSON.stringify(c.checks.weeklyTrigger)}；定位 components/items/habit-trend-chart.tsx 的 DialogTrigger 左右 span 与周数 badge。`)
    if (c.checks.weekly && !c.checks.weekly.pass) lines.push(`  - Weekly: ${JSON.stringify({dialogRect:c.checks.weekly.dialogRect,rows:c.checks.weekly.rows.filter(r=>!r.firstRow||!r.noOverlap||!r.progressPlacement||!r.contained||r.dateLines!==1||r.dateScrollWidth>r.dateClientWidth+1)})}；定位 components/items/habit-trend-chart.tsx 的 weekly listitem grid。`)
    if (c.checks.heatmapButtons && !c.checks.heatmapButtons.pass) lines.push(`  - 热图按钮: ${JSON.stringify(c.checks.heatmapButtons.sizes)}；定位 components/history/global-activity-heatmap.tsx 的周数切换按钮。`)
  }
  for (const error of report.errors) lines.push(`- 执行错误：${error}`)
  lines.push("", "## 实测响应时间（毫秒）", "", "本机单次串行样本。ready 包含文档 complete、目标元素、字体 ready、两帧与 250ms 稳定等待；不可当成纯服务耗时。weekly open 从真实 CDP 指针点击开始到列表出现并经过两帧；热图为点击到 aria-pressed 更新并经过两帧。无网络或 CPU 降速，未测打卡、导航体验、并发负载或真实手机。", "", "|组合|Dashboard TTFB / DCL / ready|Item TTFB / DCL / ready|Insights TTFB / DCL / ready|Weekly open|热图4/8/16更新|", "|---|---|---|---|---|---|")
  for (const c of report.cases) {
    const t=x=>x?`${x.ttfbMs} / ${x.domContentLoadedMs} / ${x.readyMs}`:"未测"
    lines.push(`|${c.id}|${t(c.timing.dashboard)}|${t(c.timing.item)}|${t(c.timing.insights)}|${c.timing.weeklyOpenMs??"未测"}|${c.checks.heatmapRanges?.map(x=>x.updateMs).join(" / ")||"未测"}|`)
  }
  lines.push("", "## 浏览器诊断与产物", "", `- 浏览器未捕获异常：${report.browserErrors.length}；HTTP ≥400：${report.httpErrors.length}；拦截非只读请求：${report.blockedWrites.length}。详见 results.json；此计数不代替功能检查。`, "- 布局检查包括：weekly 入口左右 span 分离、左区子元素边界/scrollWidth 与文字 Range 无越界重叠；weekly 所有已渲染周的日期单行、日期与 badge 顶部对齐、无重叠、窄屏进度第二行；Journal 标题文本与记录 badge 无重叠、描述位于独立第二行；4/8/16 按钮宽高均 ≥44px，切换三个窗口后页面无横向溢出；每日灵感无需展开即可见。", "- 未测试虚拟键盘、安全区、Safari/iOS 真机与屏幕阅读器；截图视觉复核情况在报告末尾单独记录。", "", `[原始测量与诊断](${join(outputDir,"results.json")})`, "", `[修复前首次完整测量](${join(outputDir,"before-min-width-and-trigger-fixes/results.json")})；[修复前 320px 英文入口重叠截图](${join(outputDir,"before-min-width-and-trigger-fixes/320-en-light-journal.png")})。首次 16 组合为 8 通过 / 8 英文热图尺寸失败；入口文字重叠由截图复核发现，新增入口断言后才纳入后续自动检查。`, "", "截图：", "")
  for (const path of report.screenshots) lines.push(`- [${path.split("/").at(-1)}](${path})`)
  writeFileSync(reportPath, lines.join("\n") + "\n")
}
try {
  if (typeof WebSocket === "undefined") throw new Error("Run Node 20 with --experimental-websocket")
  const url = new URL(process.env.DATABASE_URL)
  if (url.hostname !== "localhost" || url.pathname !== "/habit_runner_perf") throw new Error("Refusing unexpected database: expected localhost/habit_runner_perf")
  await waitUntil(async()=>{try{return (await fetch(base,{signal:AbortSignal.timeout(2000)})).ok}catch{return false}}, 60000, "localhost:3000 ready (no service starts)")
  const db = new PrismaClient()
  let user, item
  try {
    ;({ user, item } = await db.$transaction(async tx => {
      await tx.$executeRawUnsafe("SET TRANSACTION READ ONLY")
      const user = await tx.user.findUniqueOrThrow({ where: { email: "demo@habitrunner.dev" }, select: { id:true,name:true,email:true,image:true } })
      const item = await tx.item.findFirstOrThrow({ where: { id:"local_perf_water", userId:user.id, type:"HABIT" }, select:{id:true} })
      return { user, item }
    }))
  } finally { await db.$disconnect() }
  report.itemId = item.id
  const token = await encode({ secret:process.env.NEXTAUTH_SECRET, maxAge:3600, token:{id:user.id,name:user.name,email:user.email,picture:user.image} })
  try { await fetch(`http://127.0.0.1:${port}/json/version`, {signal:AbortSignal.timeout(500)}); throw new Error(`CDP port ${port} already occupied; refusing to reuse another browser`) }
  catch (e) { if (e.message.includes("already occupied")) throw e }
  profile = mkdtempSync(join(tmpdir(), "habit-mobile-9241-"))
  chrome = spawn("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", ["--headless=new","--disable-gpu","--disable-extensions","--no-first-run",`--remote-debugging-port=${port}`,`--user-data-dir=${profile}`,"about:blank"], {stdio:"ignore"})
  chrome.on("error", e => report.errors.push(redact(e)))
  const targets = await waitUntil(async()=>{try{const r=await fetch(`http://127.0.0.1:${port}/json/list`);return await r.json()}catch{return false}},10000,"independent Chrome CDP")
  ws = new WebSocket(targets.find(t=>t.type==="page").webSocketDebuggerUrl)
  await new Promise((resolve,reject)=>{ws.onopen=resolve;ws.onerror=reject})
  ws.onmessage = event => {
    const data=JSON.parse(event.data)
    if (data.id && pending.has(data.id)) {
      const {resolve,reject,timer}=pending.get(data.id);pending.delete(data.id);clearTimeout(timer)
      data.error?reject(new Error(data.error.message)):resolve(data.result)
    } else if (data.method==="Fetch.requestPaused") {
      const {requestId,request}=data.params
      const readOnly=["GET","HEAD","OPTIONS"].includes(request.method)
      if(!readOnly) report.blockedWrites.push({case:currentCase,method:request.method,url:request.url.split("?")[0]})
      send(readOnly?"Fetch.continueRequest":"Fetch.failRequest",readOnly?{requestId}:{requestId,errorReason:"BlockedByClient"}).catch(e=>report.errors.push(redact(e)))
    } else if(data.method==="Runtime.exceptionThrown") {
      report.browserErrors.push({case:currentCase,text:data.params.exceptionDetails.text,description:data.params.exceptionDetails.exception?.description})
    } else if(data.method==="Network.responseReceived" && data.params.response.status>=400) {
      report.httpErrors.push({case:currentCase,status:data.params.response.status,url:data.params.response.url.split("?")[0]})
    }
  }
  for(const domain of ["Page","Runtime","Network"]) await send(`${domain}.enable`)
  await send("Fetch.enable", {patterns:[{urlPattern:"*",requestStage:"Request"}]})
  report.browserVersion=(await send("Browser.getVersion")).product
  await send("Network.setCookie",{name:"next-auth.session-token",value:token,url:base,path:"/",httpOnly:true,secure:false,sameSite:"Lax"})
  for(const width of [320,375,390,768]) for(const locale of ["zh","en"]) for(const theme of ["light","dark"]) await runCase(width,locale,theme)
} catch (error) {
  report.errors.push(redact(error))
  console.error(redact(error))
} finally {
  if(ws) { try{await send("Browser.close")}catch{};ws.close() }
  if(chrome) chrome.kill()
  if(profile) { await sleep(250);try{rmSync(profile,{recursive:true,force:true})}catch{} }
  saveReport()
}
console.log(JSON.stringify({reportPath,passed:report.cases.filter(c=>c.pass).length,total:report.cases.length,screenshots:report.screenshots.length,errors:report.errors}))
process.exitCode = report.errors.length || report.cases.length!==16 || report.cases.some(c=>!c.pass) ? 1 : 0
