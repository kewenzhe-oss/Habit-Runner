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

// 1. Generate NextAuth JWT
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

// 2. Launch headless Chrome
const chromeProc = spawn(
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  [
    "--headless=new",
    "--disable-gpu",
    "--remote-debugging-port=9228",
    "--user-data-dir=/tmp/qa-verify-profile-" + Date.now(),
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

// 3. Connect via CDP
const versionRes = await fetch("http://127.0.0.1:9228/json/list")
const targets = await versionRes.json()
const pageTarget = targets.find((t) => t.type === "page") || targets[0]
if (!pageTarget) throw new Error("No page target found")

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

await sendCDP("Page.enable")
await sendCDP("DOM.enable")
await sendCDP("Runtime.enable")
await sendCDP("Network.enable")

// Set cookie
await sendCDP("Network.setCookie", {
  name: "next-auth.session-token",
  value: token,
  domain: "localhost",
  path: "/",
  httpOnly: true,
  secure: false,
  sameSite: "Lax",
})

// Set viewport 375x812 (mobile iPhone)
await sendCDP("Emulation.setDeviceMetricsOverride", {
  width: 375,
  height: 812,
  deviceScaleFactor: 2,
  mobile: true,
})

async function navigate(url) {
  await sendCDP("Page.navigate", { url })
  await new Promise((r) => setTimeout(r, 2000))
}

async function evaluate(expression) {
  const res = await sendCDP("Runtime.evaluate", {
    expression,
    returnByValue: true,
    awaitPromise: true,
  })
  return res.result.value
}

async function takeScreenshot(path) {
  const shot = await sendCDP("Page.captureScreenshot", { format: "png" })
  writeFileSync(path, Buffer.from(shot.data, "base64"))
  console.log("Saved screenshot:", path)
}

try {
  // 1. Dashboard: Daily Wisdom check
  console.log("\n=== Verifying Dashboard Daily Wisdom ===")
  await navigate("http://localhost:3000/dashboard")
  
  // Scroll to Daily Wisdom
  await evaluate(`(() => {
    const el = document.getElementById("today-wisdom-title");
    if (el) el.scrollIntoView({ behavior: "instant", block: "center" });
  })()`)
  await new Promise((r) => setTimeout(r, 400))

  const wisdomAudit = await evaluate(`(() => {
    const titleEl = document.getElementById("today-wisdom-title");
    const blockquote = document.querySelector("blockquote");
    const copyBtn = document.querySelector('button[aria-label="复制金句"], button[title="复制金句"]');
    const shuffleBtn = document.querySelector('button[aria-label="换一句"], button[title="换一句"]');
    const collapseChevron = document.querySelector('button[aria-controls="today-wisdom-panel"]');

    return {
      hasTitle: Boolean(titleEl),
      titleText: titleEl ? titleEl.textContent.trim() : null,
      hasQuote: Boolean(blockquote && blockquote.textContent.trim()),
      quoteText: blockquote ? blockquote.textContent.trim() : null,
      hasCopyBtn: Boolean(copyBtn),
      hasShuffleBtn: Boolean(shuffleBtn),
      hasCollapseChevron: Boolean(collapseChevron), // should be false!
    };
  })()`)
  console.log("Dashboard Wisdom Audit:", wisdomAudit)

  const wisdomScreenshotPath = `${screenshotDir}/dashboard-daily-wisdom-open-375.png`
  await takeScreenshot(wisdomScreenshotPath)

  // 2. Insights: GlobalActivityHeatmap check
  console.log("\n=== Verifying GlobalActivityHeatmap Mobile ===")
  await navigate("http://localhost:3000/insights")
  
  // Click "近 16 周" button
  await evaluate(`(() => {
    const buttons = Array.from(document.querySelectorAll("button"));
    const btn16 = buttons.find(b => b.textContent.includes("16"));
    if (btn16) btn16.click();
  })()`)
  await new Promise((r) => setTimeout(r, 800))

  // Scroll heatmap into view
  await evaluate(`(() => {
    const heatmapScroll = document.querySelector('[data-testid="activity-heatmap-scroll"]');
    if (heatmapScroll) heatmapScroll.scrollIntoView({ behavior: "instant", block: "center" });
  })()`)
  await new Promise((r) => setTimeout(r, 400))

  const heatmapAudit = await evaluate(`(() => {
    const scrollContainer = document.querySelector('[data-testid="activity-heatmap-scroll"]');
    const stickyCol = scrollContainer ? scrollContainer.querySelector('.sticky.left-0') : null;
    
    // Count normal signals and checkmarks inside normal cells
    const normalSignals = Array.from(document.querySelectorAll('[data-signal="normal"]'));
    const normalChecks = normalSignals.filter(s => s.querySelector("svg"));
    const allHeatmapSvgs = Array.from(document.querySelectorAll('[data-signal] svg'));

    return {
      hasScrollContainer: Boolean(scrollContainer),
      scrollLeft: scrollContainer ? scrollContainer.scrollLeft : 0,
      scrollWidth: scrollContainer ? scrollContainer.scrollWidth : 0,
      clientWidth: scrollContainer ? scrollContainer.clientWidth : 0,
      isScrolledToRight: scrollContainer ? (scrollContainer.scrollLeft > 0) : false,
      hasStickyCol: Boolean(stickyCol),
      bodyScrollWidth: document.body.scrollWidth,
      windowWidth: window.innerWidth,
      isBodyOverflowing: document.body.scrollWidth > window.innerWidth,
      totalSignals: document.querySelectorAll('[data-signal]').length,
      normalCellsWithSvgCheck: normalChecks.length,
      allHeatmapSvgCount: allHeatmapSvgs.length
    };
  })()`)
  console.log("Heatmap Audit:", heatmapAudit)

  const heatmapScreenshotPath = `${screenshotDir}/insights-heatmap-16weeks-clean-375.png`
  await takeScreenshot(heatmapScreenshotPath)

  console.log("\nALL VERIFICATIONS COMPLETE!")
} finally {
  cleanup()
}
