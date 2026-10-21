import { spawn } from "node:child_process"
import { writeFileSync, existsSync, mkdirSync } from "node:fs"
import { createRequire } from "node:module"
import { PrismaClient } from "@prisma/client"

const require = createRequire(import.meta.url)
const { encode } = require("next-auth/jwt")

const screenshotDir = "/Users/grangerfdad/.codex/visualizations/2026/10/21/01a15c20-129c-7f30-8094-0f78e9efe790"
if (!existsSync(screenshotDir)) {
  mkdirSync(screenshotDir, { recursive: true })
}

// 1. Generate NextAuth Token
const db = new PrismaClient()
const user = await db.user.findUniqueOrThrow({
  where: { email: "demo@habitrunner.dev" },
})
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
await db.$disconnect()
console.log("NextAuth JWT generated successfully for demo@habitrunner.dev")

// 2. Launch Chrome Headless with Remote Debugging
const chromeProc = spawn(
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  [
    "--headless=new",
    "--disable-gpu",
    "--remote-debugging-port=9222",
    "--user-data-dir=/tmp/qa-chrome-profile",
    "about:blank",
  ],
  { stdio: "ignore" }
)

const cleanup = () => {
  try {
    chromeProc.kill()
  } catch {}
}
process.on("exit", cleanup)
process.on("SIGINT", cleanup)

await new Promise((resolve) => setTimeout(resolve, 1500))

// 3. Connect to CDP via WebSocket
const versionRes = await fetch("http://127.0.0.1:9222/json/list")
const targets = await versionRes.json()
const pageTarget = targets.find((t) => t.type === "page") || targets[0]
if (!pageTarget) throw new Error("No page target found from Chrome CDP")

const ws = new WebSocket(pageTarget.webSocketDebuggerUrl)
await new Promise((resolve, reject) => {
  ws.onopen = resolve
  ws.onerror = reject
})

let msgId = 1
const callbacks = new Map()
ws.onmessage = (event) => {
  const data = JSON.parse(event.data)
  if (data.id && callbacks.has(data.id)) {
    const { resolve, reject } = callbacks.get(data.id)
    callbacks.delete(data.id)
    if (data.error) reject(data.error)
    else resolve(data.result)
  }
}

function sendCDP(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = msgId++
    callbacks.set(id, { resolve, reject })
    ws.send(JSON.stringify({ id, method, params }))
  })
}

// Enable necessary domains
await sendCDP("Page.enable")
await sendCDP("DOM.enable")
await sendCDP("Runtime.enable")
await sendCDP("Network.enable")

async function setSessionCookie() {
  await sendCDP("Network.setCookie", {
    name: "next-auth.session-token",
    value: token,
    domain: "localhost",
    path: "/",
    httpOnly: true,
    secure: false,
    sameSite: "Lax",
  })
}

async function setLocaleCookie(locale) {
  await sendCDP("Network.setCookie", {
    name: "habit_runner_locale",
    value: locale,
    domain: "localhost",
    path: "/",
    secure: false,
    sameSite: "Lax",
  })
}

async function setViewport(width, height) {
  await sendCDP("Emulation.setDeviceMetricsOverride", {
    width,
    height,
    deviceScaleFactor: 2,
    mobile: true,
    screenOrientation: { angle: 0, type: "portraitPrimary" },
  })
}

async function navigate(url) {
  await sendCDP("Page.navigate", { url })
  await new Promise((resolve) => {
    const handler = (event) => {
      const data = JSON.parse(event.data)
      if (data.method === "Page.loadEventFired") {
        ws.removeEventListener("message", handler)
        resolve()
      }
    }
    ws.addEventListener("message", handler)
  })
  await new Promise((resolve) => setTimeout(resolve, 800))
}

async function evaluate(expression) {
  const res = await sendCDP("Runtime.evaluate", {
    expression,
    returnByValue: true,
    awaitPromise: true,
  })
  if (res.exceptionDetails) {
    throw new Error(JSON.stringify(res.exceptionDetails))
  }
  return res.result.value
}

async function takeScreenshot(filePath, fullPage = false) {
  const params = { format: "png" }
  if (fullPage) {
    params.captureBeyondViewport = true
  }
  const result = await sendCDP("Page.captureScreenshot", params)
  const buffer = Buffer.from(result.data, "base64")
  writeFileSync(filePath, buffer)
  console.log(`Saved screenshot: ${filePath} (${buffer.length} bytes)`)
}

const report = {
  gate1: { pass: true, findings: [] },
  gate2: { pass: true, findings: [] },
  screenshots: [],
}

try {
  await setSessionCookie()
  await setLocaleCookie("zh")

  // ============================================================
  // Gate 1: 375px Viewport & Dashboard Ergonomics
  // ============================================================
  console.log("\n--- Testing 375px Viewport (Dashboard) ---")
  await setViewport(375, 812)
  await navigate("http://localhost:3000/dashboard")

  const overflow375 = await evaluate(`(() => {
    const docWidth = document.documentElement.clientWidth;
    const scrollWidth = document.documentElement.scrollWidth;
    return { docWidth, scrollWidth, hasOverflow: scrollWidth > docWidth };
  })()`)
  console.log("375px Overflow Check:", overflow375)

  const dash375Screenshot = `${screenshotDir}/habit-mobile-dashboard-contrast.png`
  await takeScreenshot(dash375Screenshot)
  report.screenshots.push(dash375Screenshot)

  // ============================================================
  // Gate 1: 320px Viewport & Dashboard Ergonomics
  // ============================================================
  console.log("\n--- Testing 320px Viewport (Dashboard) ---")
  await setViewport(320, 640)
  await navigate("http://localhost:3000/dashboard")

  const overflow320 = await evaluate(`(() => {
    const docWidth = document.documentElement.clientWidth;
    const scrollWidth = document.documentElement.scrollWidth;
    return { docWidth, scrollWidth, hasOverflow: scrollWidth > docWidth };
  })()`)
  console.log("320px Overflow Check:", overflow320)

  const dash320Screenshot = `${screenshotDir}/habit-mobile-320px-dashboard.png`
  await takeScreenshot(dash320Screenshot)
  report.screenshots.push(dash320Screenshot)

  // ============================================================
  // Gate 1 & 2: Insights Page (Heatmap, Popover, A11y, WCAG 1.4.1)
  // ============================================================
  console.log("\n--- Testing Insights Page (/insights) ---")
  await setViewport(375, 812)
  await navigate("http://localhost:3000/insights")

  const insightsA11y = await evaluate(`(() => {
    // Exact selector for heatmap cells grid
    const cellButtons = Array.from(document.querySelectorAll('.grid.grid-flow-col.grid-rows-7 button'));
    const semanticCheck = cellButtons.length > 0 && cellButtons.every(b => b.tagName === 'BUTTON' && b.type === 'button');

    // aria-label check
    const ariaLabels = cellButtons.map(b => b.getAttribute('aria-label') || '');
    const sampleLabel = ariaLabels[0] || '';
    const hasFullAria = cellButtons.every(b => {
      const l = b.getAttribute('aria-label') || '';
      return l.length > 0 && l.includes('·');
    });

    // Check WCAG 1.4.1 non-color signals in heatmap
    const stars = document.querySelectorAll('svg.lucide-star');
    const rests = document.querySelectorAll('svg.lucide-moon, svg.lucide-bed-double, [class*="repeating-linear-gradient"]');
    const checks = document.querySelectorAll('svg.lucide-check');

    // Cell touch target sizes
    const buttonSizes = cellButtons.slice(0, 5).map(b => {
      const r = b.getBoundingClientRect();
      return { width: Math.round(r.width), height: Math.round(r.height) };
    });

    return {
      semanticCheck,
      cellButtonCount: cellButtons.length,
      sampleLabel,
      hasFullAria,
      nonColorSignals: {
        starsCount: stars.length,
        restsCount: rests.length,
        checksCount: checks.length
      },
      buttonSizes
    };
  })()`)
  console.log("Insights Heatmap Inspection:", insightsA11y)

  if (!insightsA11y.semanticCheck) {
    report.gate1.pass = false
    report.gate1.findings.push("GlobalActivityHeatmap cells are not semantic <button type=\"button\">")
  }
  if (!insightsA11y.hasFullAria) {
    report.gate2.pass = false
    report.gate2.findings.push("GlobalActivityHeatmap cells do not have complete date & status aria-label")
  }

  // Trigger Popover on 375px
  console.log("Opening Popover on Heatmap in 375px...")
  const popoverTriggerResult = await evaluate(`(() => {
    const cellButtons = Array.from(document.querySelectorAll('.grid.grid-flow-col.grid-rows-7 button'));
    // Find a button with check-ins (e.g. index 10 or 15)
    const target = cellButtons.find(b => {
      const l = b.getAttribute('aria-label') || '';
      return l.includes('完成') || l.includes('充沛') || l.includes('常规') || l.includes('休整');
    }) || cellButtons[10];

    if (target) {
      target.scrollIntoView({ block: 'center' });
      target.click();
      return { clicked: true, label: target.getAttribute('aria-label') };
    }
    return { clicked: false };
  })()`)
  console.log("Clicked Heatmap Cell:", popoverTriggerResult)

  await new Promise(r => setTimeout(r, 500))

  const popoverMetrics375 = await evaluate(`(() => {
    const popover = document.querySelector('[data-radix-popper-content-wrapper]');
    if (!popover) return { error: "Popover not found" };
    const content = popover.firstElementChild;
    const rect = content.getBoundingClientRect();
    const docWidth = document.documentElement.clientWidth;
    return {
      found: true,
      rect: {
        width: Math.round(rect.width),
        left: Math.round(rect.left),
        right: Math.round(rect.right),
        top: Math.round(rect.top),
        bottom: Math.round(rect.bottom)
      },
      docWidth,
      hasOverflow: rect.left < 0 || rect.right > docWidth,
      maxWidthStyle: window.getComputedStyle(content).maxWidth
    };
  })()`)
  console.log("Popover 375px Metrics:", popoverMetrics375)

  if (popoverMetrics375.hasOverflow) {
    report.gate1.pass = false
    report.gate1.findings.push(`Heatmap Popover overflows 375px: ${JSON.stringify(popoverMetrics375)}`)
  }

  const popover375Screenshot = `${screenshotDir}/habit-mobile-heatmap-popover-375.png`
  await takeScreenshot(popover375Screenshot)
  report.screenshots.push(popover375Screenshot)

  // Trigger Popover on 320px
  console.log("Opening Popover on Heatmap in 320px...")
  await setViewport(320, 640)
  await navigate("http://localhost:3000/insights")
  await evaluate(`(() => {
    const cellButtons = Array.from(document.querySelectorAll('.grid.grid-flow-col.grid-rows-7 button'));
    const target = cellButtons.find(b => {
      const l = b.getAttribute('aria-label') || '';
      return l.includes('完成') || l.includes('充沛') || l.includes('常规') || l.includes('休整');
    }) || cellButtons[10];
    if (target) {
      target.scrollIntoView({ block: 'center' });
      target.click();
    }
  })()`)
  await new Promise(r => setTimeout(r, 500))

  const popoverMetrics320 = await evaluate(`(() => {
    const popover = document.querySelector('[data-radix-popper-content-wrapper]');
    if (!popover) return { error: "Popover not found" };
    const content = popover.firstElementChild;
    const rect = content.getBoundingClientRect();
    const docWidth = document.documentElement.clientWidth;
    return {
      found: true,
      rect: {
        width: Math.round(rect.width),
        left: Math.round(rect.left),
        right: Math.round(rect.right),
      },
      docWidth,
      hasOverflow: rect.left < 0 || rect.right > docWidth,
      maxWidthStyle: window.getComputedStyle(content).maxWidth
    };
  })()`)
  console.log("Popover 320px Metrics:", popoverMetrics320)

  if (popoverMetrics320.hasOverflow) {
    report.gate1.pass = false
    report.gate1.findings.push(`Heatmap Popover overflows 320px: ${JSON.stringify(popoverMetrics320)}`)
  }

  const popover320Screenshot = `${screenshotDir}/habit-mobile-heatmap-popover-320.png`
  await takeScreenshot(popover320Screenshot)
  report.screenshots.push(popover320Screenshot)

  // ============================================================
  // Gate 1 & 2: Habit Detail Page & HabitTrendChart Popover
  // ============================================================
  console.log("\n--- Testing Item Detail Page (/items/local_perf_read) ---")
  await setLocaleCookie("en")
  await setViewport(375, 812)
  await navigate("http://localhost:3000/items/local_perf_read")

  // Scroll to HabitTrendChart and trigger Popover
  const trendPopoverMetrics = await evaluate(`(() => {
    const trendCells = Array.from(document.querySelectorAll('button[aria-label*="2026-"]'));
    const target = trendCells.find(b => b.getAttribute('aria-label')?.includes('action')) || trendCells[10];
    if (target) {
      target.scrollIntoView({ block: 'center' });
      target.click();
      return { clicked: true, label: target.getAttribute('aria-label') };
    }
    return { clicked: false };
  })()`)
  console.log("Trend Chart Popover Click:", trendPopoverMetrics)
  await new Promise(r => setTimeout(r, 500))

  const trendPopoverState = await evaluate(`(() => {
    const popover = document.querySelector('[data-radix-popper-content-wrapper]');
    if (!popover) return { error: "Trend Popover not found" };
    const content = popover.firstElementChild;
    const rect = content.getBoundingClientRect();
    const docWidth = document.documentElement.clientWidth;
    return {
      found: true,
      rect: {
        width: Math.round(rect.width),
        left: Math.round(rect.left),
        right: Math.round(rect.right),
      },
      docWidth,
      hasOverflow: rect.left < 0 || rect.right > docWidth,
      maxWidthStyle: window.getComputedStyle(content).maxWidth
    };
  })()`)
  console.log("Trend Chart Popover Metrics:", trendPopoverState)

  const trendPopoverScreenshot = `${screenshotDir}/habit-mobile-trend-popover-375.png`
  await takeScreenshot(trendPopoverScreenshot)
  report.screenshots.push(trendPopoverScreenshot)

  // Scroll to Journal & Tomorrow Intent in ItemDetail
  await evaluate(`(() => {
    window.scrollTo(0, document.body.scrollHeight);
  })()`)
  await new Promise(r => setTimeout(r, 400))

  const journalAudit = await evaluate(`(() => {
    const bodyText = document.body.innerText;
    return {
      hasJournalTitle: bodyText.includes("Habit Footprint & Flow Journal"),
      hasTomorrowLabel: bodyText.includes("Tomorrow:"),
      hasRecordsCount: bodyText.includes("records")
    };
  })()`)
  console.log("Journal & Tomorrow Audit (EN):", journalAudit)

  const journalScreenshot = `${screenshotDir}/habit-mobile-item-journal-en.png`
  await takeScreenshot(journalScreenshot)
  report.screenshots.push(journalScreenshot)

  // ============================================================
  // Gate 2: English Dashboard Divider & Tomorrow Intent
  // ============================================================
  console.log("\n--- Testing English Dashboard Divider ---")
  await navigate("http://localhost:3000/dashboard")
  await evaluate(`(() => {
    window.scrollTo(0, 450);
  })()`)
  await new Promise(r => setTimeout(r, 400))

  const dividerAudit = await evaluate(`(() => {
    const bodyText = document.body.innerText;
    // Look for separator text, e.g. "2 completed"
    const hasCompletedSeparator = /[0-9]+\\s+completed/i.test(bodyText);
    return {
      hasCompletedSeparator,
      previewText: bodyText.slice(bodyText.indexOf("Daily Routines"), bodyText.indexOf("Daily Routines") + 500)
    };
  })()`)
  console.log("Dashboard Divider Audit (EN):", dividerAudit)

  const dashDividerScreenshot = `${screenshotDir}/habit-mobile-dashboard-divider-en.png`
  await takeScreenshot(dashDividerScreenshot)
  report.screenshots.push(dashDividerScreenshot)

} finally {
  cleanup()
}

console.log("\n============================================================")
console.log("FINAL QA EVALUATION SUMMARY")
console.log("============================================================")
console.log(JSON.stringify(report, null, 2))
