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
console.log("Generated token for user:", user.email)

// 2. Launch Chrome Headless
const chromeProc = spawn(
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  [
    "--headless=new",
    "--disable-gpu",
    "--remote-debugging-port=9222",
    "--user-data-dir=/tmp/qa-chrome-profile-item-detail",
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
  // Additional wait for client hydration
  await new Promise((resolve) => setTimeout(resolve, 1500))
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

try {
  await setSessionCookie()
  await setLocaleCookie("zh")
  await setViewport(375, 812)

  console.log("Navigating to http://localhost:3000/items/local_perf_water...")
  await navigate("http://localhost:3000/items/local_perf_water")

  // Check initial page state
  const pageInfo = await evaluate(`(() => {
    return {
      title: document.title,
      url: window.location.href,
      bodyTextLength: document.body.innerText.length,
      headings: Array.from(document.querySelectorAll('h1, h2, h3, h4')).map(h => h.innerText.trim())
    };
  })()`)
  console.log("Page info:", pageInfo)

} finally {
  cleanup()
}
