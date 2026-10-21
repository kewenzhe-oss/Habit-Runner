import { spawn } from "node:child_process"
import { existsSync, mkdirSync } from "node:fs"
import { createRequire } from "node:module"
import { PrismaClient } from "@prisma/client"

const require = createRequire(import.meta.url)
const { encode } = require("next-auth/jwt")

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

const chromeProc = spawn(
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  [
    "--headless=new",
    "--disable-gpu",
    "--remote-debugging-port=9222",
    "--user-data-dir=/tmp/qa-chrome-profile-test",
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

const versionRes = await fetch("http://127.0.0.1:9222/json/list")
const targets = await versionRes.json()
const pageTarget = targets.find((t) => t.type === "page") || targets[0]
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

await sendCDP("Network.setCookie", {
  name: "next-auth.session-token",
  value: token,
  domain: "localhost",
  path: "/",
  httpOnly: true,
  secure: false,
  sameSite: "Lax",
})
await sendCDP("Network.setCookie", {
  name: "habit_runner_locale",
  value: "zh",
  domain: "localhost",
  path: "/",
  secure: false,
  sameSite: "Lax",
})
await sendCDP("Emulation.setDeviceMetricsOverride", {
  width: 375,
  height: 812,
  deviceScaleFactor: 2,
  mobile: true,
  screenOrientation: { angle: 0, type: "portraitPrimary" },
})

await sendCDP("Page.navigate", { url: "http://localhost:3000/items/local_perf_water" })
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
await new Promise((resolve) => setTimeout(resolve, 1500))

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

const inspection = await evaluate(`(() => {
  // Find trigger button
  const buttons = Array.from(document.querySelectorAll('button'));
  const trigger = buttons.find(b => b.innerText.includes('每周统计'));

  // Find HabitTrendChart card
  // It has "行动记录"
  let trendCard = null;
  const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4'));
  const recordHeading = headings.find(h => h.innerText.includes('行动记录'));
  if (recordHeading) {
    trendCard = recordHeading.closest('.rounded-2xl, .rounded-xl, .border') || recordHeading.parentElement;
  }

  // Find "习惯足迹与心流日志"
  const journalHeading = headings.find(h => h.innerText.includes('习惯足迹与心流日志'));
  const journalSection = journalHeading ? journalHeading.closest('section, div.space-y-4, div') : null;

  const triggerRect = trigger ? trigger.getBoundingClientRect() : null;
  const trendCardRect = trendCard ? trendCard.getBoundingClientRect() : null;
  const journalRect = journalHeading ? journalHeading.getBoundingClientRect() : null;

  return {
    hasTrigger: !!trigger,
    triggerText: trigger?.innerText,
    triggerAriaLabel: trigger?.getAttribute('aria-label'),
    triggerClasses: trigger?.className,
    triggerComputedMinHeight: trigger ? window.getComputedStyle(trigger).minHeight : null,
    triggerRect: triggerRect ? { top: triggerRect.top, bottom: triggerRect.bottom, height: triggerRect.height } : null,
    trendCardRect: trendCardRect ? { top: trendCardRect.top, bottom: trendCardRect.bottom, height: trendCardRect.height } : null,
    journalRect: journalRect ? { top: journalRect.top, bottom: journalRect.bottom, height: journalRect.height } : null,
    windowInnerHeight: window.innerHeight,
    scrollY: window.scrollY
  };
})()`)

console.log("Inspection result:", JSON.stringify(inspection, null, 2))

cleanup()
