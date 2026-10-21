import { spawn } from "node:child_process"
import { writeFileSync, existsSync, mkdirSync } from "node:fs"
import { createRequire } from "node:module"
import { PrismaClient } from "@prisma/client"

const require = createRequire(import.meta.url)
const { encode } = require("next-auth/jwt")

const screenshotDir = "/Users/grangerfdad/.codex/visualizations/2026/10/21/01a15c20-129c-7f30-8094-0f78e9efe790"
if (!existsSync(screenshotDir)) mkdirSync(screenshotDir, { recursive: true })

const db = new PrismaClient()
const user = await db.user.findUniqueOrThrow({ where: { email: "demo@habitrunner.dev" } })
const token = await encode({
  secret: process.env.NEXTAUTH_SECRET,
  maxAge: 3600,
  token: { id: user.id, name: user.name, email: user.email, picture: user.image },
})
await db.$disconnect()

const chromeProc = spawn("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", [
  "--headless=new", "--disable-gpu", "--remote-debugging-port=9230",
  "--user-data-dir=/tmp/qa-perf-dialog-" + Date.now(), "about:blank"
], { stdio: "ignore" })

const cleanup = () => { try { chromeProc.kill() } catch {} }
process.on("exit", cleanup)
process.on("SIGINT", cleanup)

await new Promise(r => setTimeout(r, 1500))

const versionRes = await fetch("http://127.0.0.1:9230/json/list")
const targets = await versionRes.json()
const pageTarget = targets.find(t => t.type === "page") || targets[0]
const ws = new WebSocket(pageTarget.webSocketDebuggerUrl)
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej })

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

await sendCDP("Emulation.setDeviceMetricsOverride", {
  width: 375,
  height: 812,
  deviceScaleFactor: 2,
  mobile: true,
})

await sendCDP("Page.navigate", { url: "http://localhost:3000/items/local_perf_water" })
await new Promise(r => setTimeout(r, 2000))

async function evaluate(expression) {
  const res = await sendCDP("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true })
  return res.result.value
}

async function takeScreenshot(path) {
  const shot = await sendCDP("Page.captureScreenshot", { format: "png" })
  writeFileSync(path, Buffer.from(shot.data, "base64"))
  console.log("Saved screenshot:", path)
}

// 1. Initial view: Trigger button inspection
const triggerAudit = await evaluate(`(() => {
  const btn = Array.from(document.querySelectorAll("button")).find(b => b.textContent.includes("每周统计"));
  if (btn) btn.scrollIntoView({ behavior: "instant", block: "center" });
  
  const journalHeading = Array.from(document.querySelectorAll("h2, h3, div")).find(el => el.textContent.includes("习惯足迹与心流日志"));
  return {
    hasTriggerBtn: Boolean(btn),
    btnText: btn ? btn.textContent.trim().replace(/\\s+/g, " ") : null,
    hasJournalHeading: Boolean(journalHeading),
    bodyScrollWidth: document.body.scrollWidth,
    windowWidth: window.innerWidth,
    isBodyOverflowing: document.body.scrollWidth > window.innerWidth,
  };
})()`)
console.log("Trigger audit:", triggerAudit)

await new Promise(r => setTimeout(r, 400))
await takeScreenshot(`${screenshotDir}/item-detail-compact-trigger-375px.png`)

// 2. Click trigger: Dialog inspection
await evaluate(`(() => {
  const btn = Array.from(document.querySelectorAll("button")).find(b => b.textContent.includes("每周统计"));
  if (btn) btn.click();
})()`)
await new Promise(r => setTimeout(r, 600))

const dialogAudit = await evaluate(`(() => {
  const dialog = document.querySelector('[role="dialog"]');
  const title = dialog ? dialog.querySelector("h2, .text-lg") : null;
  const desc = dialog ? dialog.querySelector("p, .text-xs") : null;
  const listItems = dialog ? dialog.querySelectorAll('[role="listitem"]') : [];
  const progressBars = dialog ? dialog.querySelectorAll('[role="progressbar"]') : [];
  const closeBtn = dialog ? dialog.querySelector("button") : null;

  return {
    hasDialog: Boolean(dialog),
    titleText: title ? title.textContent.trim() : null,
    descText: desc ? desc.textContent.trim() : null,
    listItemsCount: listItems.length,
    progressBarsCount: progressBars.length,
    hasCloseBtn: Boolean(closeBtn),
    bodyScrollWidth: document.body.scrollWidth,
    windowWidth: window.innerWidth,
    isBodyOverflowing: document.body.scrollWidth > window.innerWidth,
  };
})()`)
console.log("Dialog audit:", dialogAudit)

await takeScreenshot(`${screenshotDir}/item-detail-weekly-dialog-375px.png`)

// 3. Close Dialog
await evaluate(`(() => {
  const closeBtn = document.querySelector('[role="dialog"] button');
  if (closeBtn) closeBtn.click();
})()`)
await new Promise(r => setTimeout(r, 500))

const afterCloseAudit = await evaluate(`(() => {
  const dialog = document.querySelector('[role="dialog"]');
  return {
    isDialogClosed: !Boolean(dialog),
    bodyScrollWidth: document.body.scrollWidth,
    windowWidth: window.innerWidth,
  };
})()`)
console.log("After close audit:", afterCloseAudit)

await takeScreenshot(`${screenshotDir}/item-detail-after-close-375px.png`)
cleanup()
console.log("\nALL VERIFICATIONS FINISHED SUCCESSFULLY!")
