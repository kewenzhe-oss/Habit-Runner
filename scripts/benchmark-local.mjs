import { writeFileSync } from "node:fs"
import { createRequire } from "node:module"
import { PrismaClient } from "@prisma/client"

const require = createRequire(import.meta.url)
const { encode } = require("next-auth/jwt")
const origins = {
  before: process.argv[2] || "http://localhost:3001",
  after: process.argv[3] || "http://localhost:3000",
}
const connection = new URL(process.env.DATABASE_URL || "")
if (
  connection.pathname !== "/habit_runner_perf" ||
  !["localhost", "127.0.0.1"].includes(connection.hostname)
) {
  throw new Error(
    "Benchmark requires the isolated local habit_runner_perf database."
  )
}
for (const origin of Object.values(origins)) {
  if (!["localhost", "127.0.0.1"].includes(new URL(origin).hostname))
    throw new Error("Only loopback servers can be benchmarked.")
}
if (!process.env.NEXTAUTH_SECRET)
  throw new Error("NEXTAUTH_SECRET is required for the local test session.")

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

async function request(origin, path, body, method = "GET") {
  const start = performance.now()
  const response = await fetch(origin + path, {
    method,
    redirect: "manual",
    headers: {
      Cookie: `next-auth.session-token=${token}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const ttfb = performance.now() - start
  const text = await response.text()
  if (!response.ok)
    throw new Error(`${method} ${origin}${path}: ${response.status}`)
  return {
    ms: performance.now() - start,
    ttfb,
    text,
    timing: response.headers.get("server-timing"),
  }
}

const date = JSON.parse(
  (await request(origins.after, "/api/dashboard/today")).text
).date
const samples = 7
async function measure(run) {
  for (let index = 0; index < 2; index++) await run()
  const values = []
  for (let index = 0; index < samples; index++) {
    const start = performance.now()
    const measured = await run()
    values.push(measured?.measuredMs ?? performance.now() - start)
  }
  values.sort((a, b) => a - b)
  return {
    samples,
    medianMs: +values[Math.floor(samples / 2)].toFixed(1),
    maxMs: +values[samples - 1].toFixed(1),
  }
}

const results = {
  database: "habit_runner_perf",
  date,
  kind: "authenticated HTTP; warmed production servers",
  rows: [],
}
for (const [label, path] of [
  ["today API", `/api/dashboard/today?date=${date}`],
  ["dashboard HTML", "/dashboard"],
  ["history HTML", "/insights"],
  ["settings HTML", "/settings"],
  ["item detail HTML", "/items/local_perf_read"],
]) {
  const row = { operation: label }
  for (const [variant, origin] of Object.entries(origins)) {
    row[variant] = await measure(() => request(origin, path))
  }
  results.rows.push(row)
  console.log(JSON.stringify(row))
}

for (const operation of [
  "todo save-to-data-ready",
  "energy save-to-data-ready",
]) {
  const row = { operation }
  for (const [variant, origin] of Object.entries(origins)) {
    row[variant] = await measure(async () => {
      if (operation.startsWith("todo")) {
        // Reset is outside the reported save chain.
        await request(
          origin,
          "/api/items/local_perf_todo_4/todo-status",
          { status: "ACTIVE", date },
          "PATCH"
        )
        const start = performance.now()
        await request(
          origin,
          "/api/items/local_perf_todo_4/todo-status",
          { status: "COMPLETED", date },
          "PATCH"
        )
        if (variant === "before")
          await request(origin, `/api/dashboard/today?date=${date}`)
        return { measuredMs: performance.now() - start }
      }
      await request(
        origin,
        "/api/daily-energy",
        { date, energyLevel: "NORMAL" },
        "PUT"
      )
      if (variant === "before") await request(origin, "/dashboard")
    })
  }
  results.rows.push(row)
  console.log(JSON.stringify(row))
}
await request(
  origins.after,
  "/api/items/local_perf_todo_4/todo-status",
  { status: "ACTIVE", date },
  "PATCH"
)
if (process.argv[4])
  writeFileSync(process.argv[4], JSON.stringify(results, null, 2) + "\n")
