// Run: node --env-file=.env.local scripts/test-performance-2026-10-21.mjs [--smoke]
// Uses only the isolated local demo DB. Never starts/stops Next or PostgreSQL.
import { spawn } from "node:child_process"
import { createHash, randomUUID } from "node:crypto"
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { createRequire } from "node:module"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { PrismaClient } from "@prisma/client"

const require = createRequire(import.meta.url)
const { encode } = require("next-auth/jwt")
const WebSocket = require("next/dist/compiled/ws")
const connection = new URL(process.env.DATABASE_URL || "")
if (
  !["localhost", "127.0.0.1"].includes(connection.hostname) ||
  connection.pathname !== "/habit_runner_perf"
) {
  throw Error(
    "Refusing DB access: localhost/127.0.0.1 habit_runner_perf is required"
  )
}
if (!process.env.NEXTAUTH_SECRET) throw Error("NEXTAUTH_SECRET required")
const smoke = process.argv.includes("--smoke")
const throttledOnly = process.argv.includes("--throttled-only")
const base = "http://localhost:3000"
const port = 9242
const output = `docs/testing-performance-2026-10-21${smoke ? "-smoke" : throttledOnly ? "-throttled" : ""}.json`
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const assert = (value, message) => {
  if (!value) throw Error(message)
}
const rounded = (v) => (typeof v === "number" ? +v.toFixed(2) : v)
const buildFingerprint = () => {
  const paths = [
    ".next/BUILD_ID",
    ".next/server/app/(app)/dashboard/page.js",
    ".next/server/app/(app)/insights/page.js",
    ".next/server/app/(app)/settings/page.js",
  ]
  return {
    buildId: readFileSync(".next/BUILD_ID", "utf8").trim(),
    artifacts: Object.fromEntries(
      paths.map((path) => [
        path,
        createHash("sha256").update(readFileSync(path)).digest("hex"),
      ])
    ),
  }
}
const buildAtStart = buildFingerprint()
const digest = (value) =>
  createHash("sha256").update(JSON.stringify(value)).digest("hex")
const stats = (values) => {
  const a = values.filter((v) => typeof v === "number").sort((a, b) => a - b)
  return {
    n: a.length,
    medianMs: rounded(
      a.length % 2
        ? a[(a.length - 1) / 2]
        : (a[a.length / 2 - 1] + a[a.length / 2]) / 2
    ),
    maxMs: rounded(a.at(-1)),
    ...(a.length >= 20
      ? { p95Ms: rounded(a[Math.ceil(a.length * 0.95) - 1]) }
      : {}),
  }
}
const result = {
  startedAt: new Date().toISOString(),
  smoke,
  buildAtStart,
  validForFinalResults: false,
  environment: {
    origin: base,
    database: "habit_runner_perf",
    host: connection.hostname,
    cdpPort: port,
    viewport: { width: 375, height: 812, deviceScaleFactor: 2 },
    user: "demo@habitrunner.dev",
  },
  definitions: {
    feedback:
      "Trusted CDP mouse click event to next animation frame after pending spinner, active nav, or optimistic pressed-state/disabled buttons appears; rendering proxy, not measured screen presentation/INP.",
    navigation:
      "Trusted click to next animation frame with destination pathname, active bottom nav and destination h1 text present. Does not assert pixel presentation or every chart has finished rendering.",
    cold: "Separate cache-bypassed dashboard document navigation; browser HTTP cache disabled, server/OS/connection caches uncontrolled. Never pooled with warmed SPA clicks.",
    quitResponse:
      "CDP requestWillBeSent -> responseReceived (headers); bodyComplete uses loadingFinished; clickToResponse also recorded. Server-Timing is verbatim auth/save_and_streaks, not pure SQL.",
    throttle:
      "CDP emulated network latency/throughput and CPU rate; not a real mobile network or hardware benchmark.",
  },
  coldDocuments: [],
  warmups: [],
  navigations: [],
  quits: [],
  checks: [],
  errors: [],
  cleanup: {},
}
const db = new PrismaClient()
let chrome, ws, profileDir, user, tempItem, baseline
let nextId = 1
const callbacks = new Map(),
  listeners = new Map(),
  requests = new Map()
let stopRequested = false,
  cleaningUp = false
process.on("SIGINT", () => {
  stopRequested = true
  for (const c of callbacks.values())
    c.reject(Error("User interrupted sampling"))
  callbacks.clear()
})
process.on("SIGTERM", () => {
  stopRequested = true
  for (const c of callbacks.values())
    c.reject(Error("User interrupted sampling"))
  callbacks.clear()
})
let activeMutation = null
let intercept = null
let requestSequence = 0
const routeNetwork = []
const allNetwork = new Map()
function on(method, callback) {
  listeners.set(method, [...(listeners.get(method) || []), callback])
}
function send(method, params = {}) {
  if (stopRequested && !cleaningUp)
    return Promise.reject(Error("Sampling stopped by signal"))
  return new Promise((resolve, reject) => {
    const id = nextId++
    const timer = setTimeout(() => {
      callbacks.delete(id)
      reject(Error(`CDP timeout: ${method}`))
    }, 45000)
    callbacks.set(id, {
      resolve: (v) => {
        clearTimeout(timer)
        resolve(v)
      },
      reject: (e) => {
        clearTimeout(timer)
        reject(e)
      },
    })
    ws.send(JSON.stringify({ id, method, params }))
  })
}
async function evaluate(expression) {
  const r = await send("Runtime.evaluate", {
    expression,
    returnByValue: true,
    awaitPromise: true,
  })
  if (r.exceptionDetails)
    throw Error(`Browser evaluation failed: ${r.exceptionDetails.text}`)
  return r.result.value
}
async function until(expression, timeout = 30000) {
  const deadline = Date.now() + timeout
  while (Date.now() < deadline) {
    const value = await evaluate(expression)
    if (value) return value
    await sleep(30)
  }
  throw Error(`Timed out waiting: ${expression.slice(0, 160)}`)
}
async function snapshot() {
  // Complete scalar snapshots include checkIns, energy, existing item/user updatedAt.
  const [checkIns, energy, items, currentUser] = await Promise.all([
    db.checkIn.findMany({
      where: {
        userId: user.id,
        ...(tempItem ? { itemId: { not: tempItem.id } } : {}),
      },
      orderBy: { id: "asc" },
    }),
    db.dailyEnergyState.findMany({
      where: { userId: user.id },
      orderBy: { id: "asc" },
    }),
    db.item.findMany({
      where: {
        userId: user.id,
        ...(tempItem ? { id: { not: tempItem.id } } : {}),
      },
      orderBy: { id: "asc" },
    }),
    db.user.findUniqueOrThrow({ where: { id: user.id } }),
  ])
  return { checkIns, energy, items, user: currentUser }
}
const itemJS = () =>
  `Array.from(document.querySelectorAll('article')).find(e=>e.textContent.includes(${JSON.stringify(tempItem.title)}))`
const buttonsJS = () =>
  `(${itemJS()})?.querySelectorAll('button[aria-pressed]')`
async function arm(kind, target, heading) {
  await evaluate(`(() => {
    window.__perfObserver?.disconnect(); window.__perfCancel = true;
    const state = window.__perf = {kind:${JSON.stringify(kind)},target:${JSON.stringify(target)},start:null,feedbackMs:null,readyMs:null};
    const find = () => ${kind === "nav" ? `Array.from(document.querySelectorAll('nav.fixed a')).find(a=>a.getAttribute('href')===state.target)` : `Array.from(${buttonsJS()} || [])[state.target==='KEPT'?0:1]`};
    const old = window.__perfClickListener;if(old)document.removeEventListener('click',old,true);
    window.__perfClickListener = e => { const el=find();if(el && (el===e.target || el.contains(e.target)) && state.start===null){state.start=performance.now();state.trusted=e.isTrusted;} };
    document.addEventListener('click',window.__perfClickListener,true);
    const test = () => {
      if(state.start===null)return;
      const el=find();
      const feedback = ${kind === "nav" ? `(el?.querySelector('.animate-spin') || el?.getAttribute('aria-current')==='page')` : `(el?.getAttribute('aria-pressed')==='true' && el?.disabled)`};
      const ready = ${kind === "nav" ? `(location.pathname===state.target && el?.getAttribute('aria-current')==='page' && document.querySelector('h1')?.textContent.trim()===${JSON.stringify(heading)})` : `(el?.getAttribute('aria-pressed')==='true' && !el?.disabled)`};
      if(feedback && state.feedbackMs===null)requestAnimationFrame(()=>{if(state.feedbackMs===null)state.feedbackMs=performance.now()-state.start;});
      if(ready && state.readyMs===null)requestAnimationFrame(()=>{if(state.readyMs===null)state.readyMs=performance.now()-state.start;});
    };
    window.__perfObserver=new MutationObserver(test);window.__perfObserver.observe(document.documentElement,{subtree:true,attributes:true,childList:true});
    test();return true;
  })()`)
}
async function click(expression) {
  await until(
    `(() => {const e=${expression};if(!e)return false;return Object.keys(e).some(k=>k.startsWith('__reactProps$') && typeof e[k]?.onClick==='function')})()`
  )
  await evaluate(
    `(${expression})?.scrollIntoView({block:'center',behavior:'instant'})`
  )
  await sleep(150)
  let p = await evaluate(
    `(() => {const e=${expression};if(!e)return null;const r=e.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2,disabled:!!e.disabled}})()`
  )
  for (let retry = 0; retry < 3 && p && (p.y <= 64 || p.y >= 750); retry++) {
    await evaluate(
      `(${expression})?.scrollIntoView({block:'center',behavior:'instant'})`
    )
    await sleep(180)
    p = await evaluate(
      `(() => {const e=${expression};if(!e)return null;const r=e.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2,disabled:!!e.disabled}})()`
    )
  }
  assert(
    p && p.x > 0 && p.y > 0 && p.y < 812 && !p.disabled,
    `Click target missing, disabled, or outside viewport: ${JSON.stringify(p)}`
  )
  await send("Input.dispatchMouseEvent", {
    type: "mousePressed",
    x: p.x,
    y: p.y,
    button: "left",
    clickCount: 1,
  })
  await send("Input.dispatchMouseEvent", {
    type: "mouseReleased",
    x: p.x,
    y: p.y,
    button: "left",
    clickCount: 1,
  })
}
async function documentLoad(profile) {
  const previousTimeOrigin = await evaluate("performance.timeOrigin")
  await send("Network.setCacheDisabled", { cacheDisabled: true })
  await send("Page.navigate", { url: base + "/dashboard" })
  await until(
    `performance.timeOrigin!==${previousTimeOrigin} && document.readyState==='complete' && performance.getEntriesByType('navigation')[0]?.loadEventEnd>0 && location.pathname==='/dashboard' && !!document.querySelector('h1') && !!(${itemJS()})`
  )
  await sleep(250)
  const timing = await evaluate(
    `(() => {const n=performance.getEntriesByType('navigation')[0];return {h1:document.querySelector('h1')?.textContent.trim(),responseStartMs:n.responseStart,responseEndMs:n.responseEnd,domContentLoadedMs:n.domContentLoadedEventEnd,loadMs:n.loadEventEnd}})()`
  )
  result.coldDocuments.push({ profile, ...timing })
  await send("Network.setCacheDisabled", { cacheDisabled: false })
}
async function navigate(path, profile, phase = "measured") {
  const from = await evaluate("location.pathname")
  const heading = headings[path]
  await arm("nav", path, heading)
  const reqStart = routeNetwork.length
  await click(
    `Array.from(document.querySelectorAll('nav.fixed a')).find(a=>a.getAttribute('href')===${JSON.stringify(path)})`
  )
  await until(
    `!!window.__perf && window.__perf.readyMs!==null && window.__perf.start!==null`
  )
  const measurement = await evaluate("window.__perf")
  assert(measurement.trusted, "Untrusted navigation click")
  const row = {
    profile,
    from,
    to: path,
    ...measurement,
    routeRequestsDuringClickPreparationAndNavigation:
      routeNetwork.slice(reqStart),
  }
  for (const k of ["feedbackMs", "readyMs"]) row[k] = rounded(row[k])
  if (phase === "measured") result.navigations.push(row)
  else result.warmups.push(row)
  await sleep(180)
  return row
}
async function quit(status, profile, mode = "success") {
  const index = status === "KEPT" ? 0 : 1
  await arm("quit", status)
  activeMutation = { profile, status, mode, network: [], intercepted: 0 }
  intercept =
    mode === "delayed"
      ? { delayMs: 1200, fail: false }
      : mode === "failure"
        ? { delayMs: 600, fail: true }
        : null
  const started = Date.now()
  await click(`Array.from(${buttonsJS()} || [])[${index}]`)
  await until("window.__perf.start!==null && window.__perf.feedbackMs!==null")
  if (mode !== "success") {
    await until(
      `Array.from(${buttonsJS()} || []).length===2 && Array.from(${buttonsJS()} || []).every(b=>b.disabled)`
    )
    // Physical pointer attempts while both controls are disabled, plus synchronous DOM clicks.
    const p = await evaluate(
      `(() => {const b=Array.from(${buttonsJS()} || [])[${1 - index}],r=b.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()`
    )
    for (let i = 0; i < 3; i++) {
      await send("Input.dispatchMouseEvent", {
        type: "mousePressed",
        ...p,
        button: "left",
        clickCount: 1,
      })
      await send("Input.dispatchMouseEvent", {
        type: "mouseReleased",
        ...p,
        button: "left",
        clickCount: 1,
      })
    }
    await evaluate(
      `Array.from(${buttonsJS()} || []).forEach(b=>{b.click();b.click()})`
    )
  }
  await until(
    `Array.from(${buttonsJS()} || []).length===2 && Array.from(${buttonsJS()} || []).every(b=>!b.disabled)`
  )
  // Wait for CDP loadingFinished and capture rendered completion without mixing polling delay into UI latency.
  await sleep(180)
  const ui = await evaluate("window.__perf")
  const row = {
    ...activeMutation,
    feedbackMs: rounded(ui.feedbackMs),
    readyMs: rounded(ui.readyMs),
    trusted: ui.trusted,
    elapsedHarnessMs: Date.now() - started,
  }
  for (const network of row.network) {
    if (network.responseEpochMs && ui.start !== null)
      network.clickToResponseMs = rounded(network.responseEpochMs - ui.start)
    delete network.responseEpochMs
  }
  assert(ui.trusted, "Untrusted quit click")
  assert(
    row.network.length === 1,
    `Expected exactly one quit POST, got ${row.network.length}`
  )
  assert(
    row.network[0].status === (mode === "failure" ? 503 : 200),
    "Unexpected quit response"
  )
  const pressed = await evaluate(
    `Array.from(${buttonsJS()} || []).map(b=>b.getAttribute('aria-pressed'))`
  )
  row.pressedAfter = pressed
  const saved = await db.checkIn.findMany({ where: { itemId: tempItem.id } })
  row.persistedStatuses = saved.map((x) => ({ date: x.date, status: x.status }))
  if (mode === "failure")
    assert(
      pressed[1 - index] === "true" && saved.every((x) => x.status !== status),
      "Rollback failed"
    )
  else
    assert(
      pressed[index] === "true" &&
        saved.length === 1 &&
        saved[0].status === status,
      "Save failed"
    )
  if (mode !== "failure")
    assert(
      row.network[0].serverTiming?.includes("save_and_streaks"),
      "Server-Timing missing"
    )
  result.quits.push(row)
  activeMutation = null
  intercept = null
  if (mode !== "failure") {
    const before = requestSequence
    await click(`Array.from(${buttonsJS()} || [])[${index}]`)
    await sleep(200)
    assert(
      requestSequence === before,
      "Clicking selected quit choice sent a request"
    )
    row.repeatSelectedRequestCount = requestSequence - before
  }
  await send("Page.reload", { ignoreCache: true })
  await until(
    `!!(${itemJS()}) && Array.from(${buttonsJS()} || []).length===2 && Array.from(${buttonsJS()} || []).every(b=>!b.disabled)`
  )
  await sleep(150)
  const reloaded = await evaluate(
    `Array.from(${buttonsJS()} || []).map(b=>b.getAttribute('aria-pressed'))`
  )
  row.reloadPressed = reloaded
  row.reloadConsistent = JSON.stringify(pressed) === JSON.stringify(reloaded)
  assert(row.reloadConsistent, "Reload state inconsistent")
  console.log(
    JSON.stringify({
      stage: "quit",
      profile,
      status,
      mode,
      feedbackMs: row.feedbackMs,
      responseMs: row.network[0].responseMs,
      reloadConsistent: row.reloadConsistent,
    })
  )
  return row
}
const headings = {}
try {
  user = await db.user.findUniqueOrThrow({
    where: { email: "demo@habitrunner.dev" },
  })
  baseline = await snapshot()
  result.safety = {
    baselineHashes: Object.fromEntries(
      Object.entries(baseline).map(([k, v]) => [k, digest(v)])
    ),
    baselineCounts: {
      checkIns: baseline.checkIns.length,
      energy: baseline.energy.length,
      items: baseline.items.length,
    },
  }
  tempItem = await db.item.create({
    data: {
      id: `qa_perf_20261021_${randomUUID()}`,
      userId: user.id,
      title: `QA performance temporary ${randomUUID().slice(0, 8)}`,
      type: "QUIT_HABIT",
      priority: "HIGH",
      sortOrder: -10000,
      whyPrompt: "Temporary browser QA fixture; deleted in finally",
    },
  })
  result.safety.fixtureId = tempItem.id
  // Require a free independent port; never reuse or stop another agent's browser.
  let occupied = false
  try {
    await fetch(`http://127.0.0.1:${port}/json/version`)
    occupied = true
  } catch {}
  assert(!occupied, "CDP port 9242 is occupied")
  profileDir = mkdtempSync(join(tmpdir(), "habit-performance-9242-"))
  chrome = spawn(
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    [
      "--headless=new",
      "--disable-gpu",
      "--no-first-run",
      "--no-default-browser-check",
      `--remote-debugging-port=${port}`,
      `--user-data-dir=${profileDir}`,
      "about:blank",
    ],
    { stdio: "ignore" }
  )
  let targets
  for (let i = 0; i < 70; i++) {
    try {
      targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()
      if (targets.some((t) => t.type === "page")) break
    } catch {}
    await sleep(100)
  }
  const target = targets?.find((t) => t.type === "page")
  assert(target, "Headless CDP unavailable")
  ws = new WebSocket(target.webSocketDebuggerUrl)
  await new Promise((resolve, reject) => {
    ws.once("open", resolve)
    ws.once("error", reject)
  })
  ws.on("message", (data) => {
    const event = JSON.parse(data)
    if (event.id) {
      const c = callbacks.get(event.id)
      if (c) {
        callbacks.delete(event.id)
        event.error
          ? c.reject(Error(event.error.message))
          : c.resolve(event.result)
      }
    } else
      for (const fn of listeners.get(event.method) || [])
        Promise.resolve(fn(event.params)).catch((e) =>
          result.errors.push({ stage: "CDP-event", message: e.message })
        )
  })
  on("Network.requestWillBeSent", (p) => {
    if (p.request.url.startsWith(base)) {
      const u = new URL(p.request.url)
      if (["/dashboard", "/insights", "/settings"].includes(u.pathname)) {
        const h = p.request.headers
        const rec = {
          path: u.pathname,
          type: p.type,
          rsc: Object.entries(h).some(
            ([k, v]) => k.toLowerCase() === "rsc" && v === "1"
          ),
          prefetch: Object.entries(h).some(
            ([k, v]) => k.toLowerCase() === "next-router-prefetch" && v === "1"
          ),
          startTimestamp: p.timestamp,
        }
        routeNetwork.push(rec)
        allNetwork.set(p.requestId, rec)
      }
    }
    if (
      p.request.url === `${base}/api/items/${tempItem.id}/quit-status` &&
      p.request.method === "POST"
    ) {
      requestSequence++
      const record = {
        requestId: p.requestId,
        startTimestamp: p.timestamp,
        requestEpochMs: p.wallTime * 1000,
        method: "POST",
      }
      requests.set(p.requestId, record)
      activeMutation?.network.push(record)
    }
  })
  on("Network.responseReceived", async (p) => {
    const route = allNetwork.get(p.requestId)
    if (route) {
      route.status = p.response.status
      route.responseMs = rounded((p.timestamp - route.startTimestamp) * 1000)
      route.fromDiskCache = !!p.response.fromDiskCache
    }
    const record = requests.get(p.requestId)
    if (!record) return
    const headers = p.response.headers
    record.responseMs = rounded((p.timestamp - record.startTimestamp) * 1000)
    record.status = p.response.status
    record.serverTiming =
      Object.entries(headers).find(
        ([k]) => k.toLowerCase() === "server-timing"
      )?.[1] || null
    record.cacheControl =
      Object.entries(headers).find(
        ([k]) => k.toLowerCase() === "cache-control"
      )?.[1] || null
    const clock = await evaluate(
      "({now:performance.now(),timeOrigin:performance.timeOrigin})"
    )
    record.responseEpochMs =
      record.requestEpochMs + record.responseMs - clock.timeOrigin
  })
  on("Network.loadingFinished", (p) => {
    const r = requests.get(p.requestId)
    if (r) r.bodyCompleteMs = rounded((p.timestamp - r.startTimestamp) * 1000)
  })
  on("Fetch.requestPaused", async (p) => {
    if (intercept) {
      activeMutation.intercepted++
      const rule = { ...intercept }
      await sleep(rule.delayMs)
      if (rule.fail) {
        await send("Fetch.fulfillRequest", {
          requestId: p.requestId,
          responseCode: 503,
          responseHeaders: [{ name: "Content-Type", value: "text/plain" }],
          body: Buffer.from("QA injected failure").toString("base64"),
        })
        return
      }
    }
    await send("Fetch.continueRequest", { requestId: p.requestId })
  })
  for (const method of ["Page.enable", "Runtime.enable", "Network.enable"])
    await send(method)
  result.environment.browser = (await send("Browser.getVersion")).product
  console.log(
    JSON.stringify({
      stage: "start",
      buildId: buildAtStart.buildId,
      startedAt: result.startedAt,
      profiles: throttledOnly
        ? "throttled-only"
        : smoke
          ? "smoke"
          : "normal+throttled",
    })
  )
  await send("Emulation.setDeviceMetricsOverride", {
    width: 375,
    height: 812,
    deviceScaleFactor: 2,
    mobile: true,
  })
  await send("Emulation.setTouchEmulationEnabled", { enabled: true })
  const token = await encode({
    secret: process.env.NEXTAUTH_SECRET,
    maxAge: 3600,
    token: {
      id: user.id,
      name: user.name,
      email: user.email,
      picture: user.image,
    },
  })
  await send("Network.setCookie", {
    name: "next-auth.session-token",
    value: token,
    domain: "localhost",
    path: "/",
    httpOnly: true,
    sameSite: "Lax",
  })
  await send("Network.setCookie", {
    name: "habit_runner_locale",
    value: "zh",
    domain: "localhost",
    path: "/",
    sameSite: "Lax",
  })
  await send("Fetch.enable", {
    patterns: [
      {
        urlPattern: `${base}/api/items/${tempItem.id}/quit-status`,
        requestStage: "Request",
      },
    ],
  })
  const profiles = [
    ...(!throttledOnly
      ? [
          {
            name: "normal",
            latency: 0,
            downloadThroughput: -1,
            uploadThroughput: -1,
            cpu: 1,
          },
        ]
      : []),
    ...(smoke
      ? []
      : [
          {
            name: "latency150_cpu4",
            latency: 150,
            downloadThroughput: 200000,
            uploadThroughput: 93750,
            cpu: 4,
          },
        ]),
  ]
  result.profiles = profiles
  for (const p of profiles) {
    await send("Network.emulateNetworkConditions", {
      offline: false,
      latency: p.latency,
      downloadThroughput: p.downloadThroughput,
      uploadThroughput: p.uploadThroughput,
    })
    await send("Emulation.setCPUThrottlingRate", { rate: p.cpu })
    await documentLoad(p.name)
    headings["/dashboard"] = await evaluate(
      "document.querySelector('h1').textContent.trim()"
    )
    // First real navigation before broadening the run; discover destination heading after it completes.
    const firstStart = Date.now()
    await click(
      `Array.from(document.querySelectorAll('nav.fixed a')).find(a=>a.getAttribute('href')==='/insights')`
    )
    await until(
      "location.pathname==='/insights' && !!document.querySelector('h1')"
    )
    await sleep(200)
    headings["/insights"] = await evaluate(
      "document.querySelector('h1').textContent.trim()"
    )
    result.checks.push({
      profile: p.name,
      check: "initial real navigation dashboard to insights",
      ok: true,
      harnessElapsedMs: Date.now() - firstStart,
    })
    console.log(
      JSON.stringify({ stage: "first-navigation", profile: p.name, ok: true })
    )
    await click(
      `Array.from(document.querySelectorAll('nav.fixed a')).find(a=>a.getAttribute('href')==='/settings')`
    )
    await until(
      "location.pathname==='/settings' && !!document.querySelector('h1')"
    )
    await sleep(150)
    headings["/settings"] = await evaluate(
      "document.querySelector('h1').textContent.trim()"
    )
    await navigate("/dashboard", p.name, "warmup")
    // Prove an actual write and reload before extending to 5 samples / throttling.
    await quit("KEPT", p.name)
    if (smoke) {
      await navigate("/insights", p.name)
      break
    }
    await navigate("/insights", p.name, "warmup")
    await navigate("/settings", p.name, "warmup")
    await navigate("/dashboard", p.name, "warmup")
    for (let cycle = 0; cycle < 5; cycle++) {
      for (const path of ["/insights", "/settings", "/dashboard"])
        await navigate(path, p.name)
      console.log(
        JSON.stringify({
          stage: "navigation-cycle",
          profile: p.name,
          cycle: cycle + 1,
        })
      )
    }
    for (const status of ["LAPSED", "KEPT", "LAPSED", "KEPT"])
      await quit(status, p.name)
    if (p.name === "normal") {
      await quit("LAPSED", p.name, "delayed")
      await quit("KEPT", p.name, "failure")
    }
  }
  result.summaries = { navigation: [], quit: [] }
  for (const p of profiles) {
    for (const to of ["/insights", "/settings", "/dashboard"]) {
      const rows = result.navigations.filter(
        (r) => r.profile === p.name && r.to === to
      )
      if (rows.length)
        result.summaries.navigation.push({
          profile: p.name,
          from: rows[0].from,
          to,
          feedback: stats(rows.map((r) => r.feedbackMs)),
          contentReady: stats(rows.map((r) => r.readyMs)),
        })
    }
    const rows = result.quits.filter(
      (r) => r.profile === p.name && r.mode === "success"
    )
    result.summaries.quit.push({
      profile: p.name,
      feedback: stats(rows.map((r) => r.feedbackMs)),
      response: stats(rows.map((r) => r.network[0]?.responseMs)),
      clickToResponse: stats(rows.map((r) => r.network[0]?.clickToResponseMs)),
      bodyComplete: stats(rows.map((r) => r.network[0]?.bodyCompleteMs)),
    })
  }
  result.status = "passed"
} catch (error) {
  result.status = "failed"
  result.errors.push({ stage: "run", message: error.message, activeMutation })
  process.exitCode = 1
  try {
    const screenshot = await send("Page.captureScreenshot", { format: "png" })
    writeFileSync(
      output.replace(".json", "-failure.png"),
      Buffer.from(screenshot.data, "base64")
    )
  } catch {}
} finally {
  cleaningUp = true
  intercept = null
  try {
    // Abort/settle intercepted requests before deleting the fixture. CDP browser is private to this script.
    if (ws?.readyState === WebSocket.OPEN) {
      await send("Fetch.disable")
      await send("Page.navigate", { url: "about:blank" })
      await sleep(300)
    }
    if (tempItem) {
      await db.item.deleteMany({ where: { id: tempItem.id, userId: user.id } })
      result.cleanup.fixtureDeleted =
        (await db.item.count({ where: { id: tempItem.id } })) === 0
      result.cleanup.fixtureCheckInsDeleted =
        (await db.checkIn.count({ where: { itemId: tempItem.id } })) === 0
    }
    if (baseline) {
      const after = await snapshot()
      result.cleanup.afterHashes = Object.fromEntries(
        Object.entries(after).map(([k, v]) => [k, digest(v)])
      )
      result.cleanup.unchanged = Object.fromEntries(
        Object.entries(baseline).map(([k, v]) => [
          k,
          digest(v) === digest(after[k]),
        ])
      )
      assert(
        Object.values(result.cleanup.unchanged).every(Boolean),
        "Existing demo state changed; see cleanup hashes"
      )
    }
  } catch (error) {
    result.errors.push({ stage: "cleanup", message: error.message })
    result.status = "failed"
    process.exitCode = 1
  }
  try {
    ws?.close()
    if (chrome) {
      chrome.kill()
      await new Promise((resolve) => {
        if (chrome.exitCode !== null) return resolve()
        chrome.once("exit", resolve)
        setTimeout(resolve, 1500)
      })
    }
    if (profileDir) rmSync(profileDir, { recursive: true, force: true })
  } catch (error) {
    result.errors.push({ stage: "browser-cleanup", message: error.message })
  }
  await db.$disconnect()
  // Never serialize cookies/JWT, request headers, response bodies, notes, or full DB snapshots.
  for (const row of result.quits)
    for (const r of row.network) {
      delete r.requestEpochMs
      delete r.startTimestamp
      delete r.requestId
    }
  try {
    result.buildAtEnd = buildFingerprint()
    result.fixedBuild =
      JSON.stringify(result.buildAtStart) === JSON.stringify(result.buildAtEnd)
  } catch {
    result.fixedBuild = false
  }
  result.validForFinalResults =
    result.status === "passed" && result.fixedBuild && !stopRequested
  if (!result.fixedBuild) {
    result.status = "failed"
    result.errors.push({
      stage: "build",
      message: "Build artifacts changed during sampling; exclude run",
    })
    process.exitCode = 1
  }
  result.finishedAt = new Date().toISOString()
  writeFileSync(output, JSON.stringify(result, null, 2) + "\n")
  console.log(
    JSON.stringify({
      status: result.status,
      output,
      navigations: result.navigations.length,
      quits: result.quits.length,
      cleanup: result.cleanup,
      errors: result.errors,
    })
  )
}
