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

// 1. Generate NextAuth Token for demo user
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
console.log("[Auth] NextAuth JWT generated successfully for demo@habitrunner.dev")

// 2. Launch Chrome Headless with Remote Debugging
const profileDir = "/tmp/qa-chrome-profile-" + Date.now()
const chromeProc = spawn(
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  [
    "--headless=new",
    "--disable-gpu",
    "--disable-extensions",
    "--disable-default-apps",
    "--no-first-run",
    "--remote-debugging-port=9222",
    "--user-data-dir=" + profileDir,
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

// 3. Connect to Chrome CDP via Page Target
const versionRes = await fetch("http://127.0.0.1:9222/json/list")
const targets = await versionRes.json()
const pageTarget = targets.find((t) => t.type === "page")
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

// Enable domains
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

async function setLocaleCookie(locale = "zh") {
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

async function takeScreenshot(filePath, clip = null) {
  const params = { format: "png" }
  if (clip) {
    params.clip = clip
  }
  const result = await sendCDP("Page.captureScreenshot", params)
  const buffer = Buffer.from(result.data, "base64")
  writeFileSync(filePath, buffer)
  console.log(`Saved screenshot: ${filePath} (${buffer.length} bytes)`)
}

const results = {
  target1: null,
  target2: null,
}

try {
  await setSessionCookie()
  await setLocaleCookie("zh")

  // ============================================================
  // 验证目标一：首页【每日灵感】（TodayCompassCard）
  // ============================================================
  console.log("\n============================================================")
  console.log("【验证目标一】：首页【每日灵感】（TodayCompassCard）在 375px")
  console.log("============================================================")
  await setViewport(375, 812)
  await navigate("http://localhost:3000/dashboard")

  // Wait for React hydration
  await new Promise((r) => setTimeout(r, 600))

  const inspirationAudit = await evaluate(`(() => {
    // 1. Locate the wisdom section
    const wisdomSection = document.querySelector('section[aria-labelledby="today-wisdom-title"]');
    if (!wisdomSection) {
      return { error: "today-wisdom section not found" };
    }

    // 2. Check accordion/collapsible traits
    const insideAccordion = !!wisdomSection.closest('[data-orientation], [data-state="closed"], [data-state="open"]');
    const hasAccordionTrigger = !!wisdomSection.querySelector('[data-state], [aria-expanded]');
    const hasDropdownArrow = !!wisdomSection.querySelector('svg.lucide-chevron-down, svg.lucide-chevron-right');

    // 3. Title check
    const titleEl = document.getElementById('today-wisdom-title');
    const titleText = titleEl ? titleEl.innerText.trim() : null;
    const titleStyle = titleEl ? window.getComputedStyle(titleEl) : null;

    // 4. Quote content check
    const quoteEl = wisdomSection.querySelector('blockquote');
    const quoteText = quoteEl ? quoteEl.innerText.trim() : null;
    const quoteStyle = quoteEl ? window.getComputedStyle(quoteEl) : null;

    // 5. Author check
    const authorEl = wisdomSection.querySelector('span.text-xs.text-muted-foreground');
    const authorText = authorEl ? authorEl.innerText.trim() : null;
    const authorStyle = authorEl ? window.getComputedStyle(authorEl) : null;

    // 6. Copy button check
    const copyBtn = wisdomSection.querySelector('button[aria-label="复制金句"], button[title="复制金句"]');
    let copyBtnMetrics = null;
    if (copyBtn) {
      const r = copyBtn.getBoundingClientRect();
      const style = window.getComputedStyle(copyBtn);
      copyBtnMetrics = {
        exists: true,
        ariaLabel: copyBtn.getAttribute('aria-label') || copyBtn.getAttribute('title'),
        width: Math.round(r.width),
        height: Math.round(r.height),
        borderRadius: style.borderRadius,
        backgroundColor: style.backgroundColor,
        hasCopyIcon: !!copyBtn.querySelector('svg')
      };
    }

    // 7. Shuffle button check
    const shuffleBtn = Array.from(wisdomSection.querySelectorAll('button')).find(
      b => (b.getAttribute('aria-label') === '换一句' || b.getAttribute('title') === '换一句' || b.innerText.includes('换一句'))
    );
    let shuffleBtnMetrics = null;
    if (shuffleBtn) {
      const r = shuffleBtn.getBoundingClientRect();
      const style = window.getComputedStyle(shuffleBtn);
      shuffleBtnMetrics = {
        exists: true,
        text: shuffleBtn.innerText.trim(),
        ariaLabel: shuffleBtn.getAttribute('aria-label') || shuffleBtn.getAttribute('title'),
        width: Math.round(r.width),
        height: Math.round(r.height),
        borderRadius: style.borderRadius,
        backgroundColor: style.backgroundColor,
        hasRefreshIcon: !!shuffleBtn.querySelector('svg')
      };
    }

    // 8. Overall Section Metrics
    const rect = wisdomSection.getBoundingClientRect();
    const computedStyle = window.getComputedStyle(wisdomSection);

    return {
      exists: true,
      isDirectlyExpanded: !insideAccordion && !hasAccordionTrigger && !hasDropdownArrow,
      insideAccordion,
      hasAccordionTrigger,
      hasDropdownArrow,
      title: {
        text: titleText,
        fontSize: titleStyle?.fontSize,
        fontWeight: titleStyle?.fontWeight,
        color: titleStyle?.color,
      },
      quote: {
        text: quoteText,
        fontSize: quoteStyle?.fontSize,
        fontWeight: quoteStyle?.fontWeight,
        lineHeight: quoteStyle?.lineHeight,
        color: quoteStyle?.color,
      },
      author: {
        text: authorText,
        fontSize: authorStyle?.fontSize,
        color: authorStyle?.color,
      },
      copyBtn: copyBtnMetrics,
      shuffleBtn: shuffleBtnMetrics,
      sectionLayout: {
        width: Math.round(rect.width),
        height: Math.round(rect.height),
        top: Math.round(rect.top),
        left: Math.round(rect.left),
        backgroundColor: computedStyle.backgroundColor,
        borderColor: computedStyle.borderColor,
        borderRadius: computedStyle.borderRadius,
      }
    };
  })()`)
  console.log("Inspiration Audit Result:\n", JSON.stringify(inspirationAudit, null, 2))
  results.target1 = inspirationAudit

  // Test "换一句" click interaction and verify quote changes
  console.log("\nTesting '换一句' button interaction...")
  const initialQuote = inspirationAudit.quote?.text
  const shuffleInteraction = await evaluate(`(() => {
    const wisdomSection = document.querySelector('section[aria-labelledby="today-wisdom-title"]');
    const shuffleBtn = Array.from(wisdomSection.querySelectorAll('button')).find(
      b => (b.getAttribute('aria-label') === '换一句' || b.innerText.includes('换一句'))
    );
    if (shuffleBtn) {
      shuffleBtn.click();
      return { clicked: true };
    }
    return { clicked: false };
  })()`)
  console.log("Shuffle clicked:", shuffleInteraction)
  await new Promise((r) => setTimeout(r, 600))

  const afterShuffleQuote = await evaluate(`(() => {
    const quoteEl = document.querySelector('section[aria-labelledby="today-wisdom-title"] blockquote');
    const authorEl = document.querySelector('section[aria-labelledby="today-wisdom-title"] span.text-xs.text-muted-foreground');
    return {
      quote: quoteEl ? quoteEl.innerText.trim() : null,
      author: authorEl ? authorEl.innerText.trim() : null
    };
  })()`)
  console.log("Initial Quote:", initialQuote)
  console.log("After Shuffle:", afterShuffleQuote.quote, afterShuffleQuote.author)
  results.target1.shuffleTest = {
    before: initialQuote,
    after: afterShuffleQuote.quote,
    newAuthor: afterShuffleQuote.author,
    changed: initialQuote !== afterShuffleQuote.quote
  }

  // Scroll card into clean view for mobile screenshot
  await evaluate(`(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  })()`)
  await new Promise((r) => setTimeout(r, 300))

  const target1Screenshot = `${screenshotDir}/mobile-dashboard-daily-inspiration-375px.png`
  await takeScreenshot(target1Screenshot)
  results.target1.screenshot = target1Screenshot

  // Card clip for close-up view
  const cardClip = await evaluate(`(() => {
    const card = document.querySelector('[data-completion-state]');
    if (!card) return null;
    const r = card.getBoundingClientRect();
    return {
      x: Math.round(r.left),
      y: Math.round(r.top),
      width: Math.round(r.width),
      height: Math.round(r.height),
      scale: 1
    };
  })()`)
  if (cardClip) {
    const cardScreenshot = `${screenshotDir}/mobile-today-compass-card-clip-375px.png`
    await takeScreenshot(cardScreenshot, cardClip)
    results.target1.cardClipScreenshot = cardScreenshot
  }

  // ============================================================
  // 验证目标二：【行动全景热图】（GlobalActivityHeatmap）移动端体验
  // ============================================================
  console.log("\n============================================================")
  console.log("【验证目标二】：【行动全景热图】（GlobalActivityHeatmap）在 375px")
  console.log("============================================================")
  await setViewport(375, 812)
  await navigate("http://localhost:3000/insights")
  await new Promise((r) => setTimeout(r, 800))

  // Switch to "近 16 周"
  console.log("Switching Heatmap range to '近 16 周'...")
  const switch16Result = await evaluate(`(() => {
    const buttons = Array.from(document.querySelectorAll('div[role="group"] button'));
    const btn16 = buttons.find(b => b.innerText.includes('16'));
    if (!btn16) return { error: "Button for 16 weeks not found", buttonTexts: buttons.map(b => b.innerText) };
    btn16.click();
    return {
      clicked: true,
      text: btn16.innerText.trim(),
      ariaPressed: btn16.getAttribute('aria-pressed')
    };
  })()`)
  console.log("Switch to 16 weeks result:", switch16Result)

  // Wait for state update and re-render
  await new Promise((r) => setTimeout(r, 600))

  const heatmapAudit = await evaluate(`(() => {
    const scrollContainer = document.querySelector('[data-testid="activity-heatmap-scroll"]');
    if (!scrollContainer) return { error: "Scroll container not found" };

    // 1. Cells check
    const cellButtons = Array.from(scrollContainer.querySelectorAll('.grid.grid-flow-col.grid-rows-7 button'));
    const totalCells = cellButtons.length;

    // 2. Heatmap denoising audit
    let checkIconCount = 0;
    let starIconCount = 0;
    let restIconCount = 0;
    let lowEnergyDotCount = 0;
    let normalSquaresCount = 0;
    let normalSquaresWithCheckIcon = 0;
    const normalColors = new Set();

    cellButtons.forEach(btn => {
      const signalSpan = btn.querySelector('[data-signal]');
      const signal = signalSpan ? signalSpan.getAttribute('data-signal') : null;
      const hasSvg = !!btn.querySelector('span[data-signal] svg');
      const hasCheck = !!btn.querySelector('svg') && btn.innerHTML.toLowerCase().includes('check');
      const hasStar = !!btn.querySelector('svg.lucide-star');
      const hasRest = !!btn.querySelector('svg.lucide-moon, svg.lucide-bed-double');
      const hasLowDot = !!btn.querySelector('span.rounded-full');

      if (hasCheck) checkIconCount++;
      if (hasStar) starIconCount++;
      if (hasRest) restIconCount++;
      if (hasLowDot) lowEnergyDotCount++;

      if (signal === 'normal') {
        normalSquaresCount++;
        if (hasCheck) normalSquaresWithCheckIcon++;
        if (signalSpan) {
          normalColors.add(window.getComputedStyle(signalSpan).backgroundColor);
        }
      }
    });

    // 3. Scroll position audit (auto rightmost)
    const scrollLeft = Math.round(scrollContainer.scrollLeft);
    const scrollWidth = Math.round(scrollContainer.scrollWidth);
    const clientWidth = Math.round(scrollContainer.clientWidth);
    const maxScrollLeft = scrollWidth - clientWidth;
    const isAtRightmost = Math.abs(scrollLeft - maxScrollLeft) <= 4;

    // 4. Last column label & Today cell visibility
    const columnHeaders = Array.from(scrollContainer.querySelector('div.mb-1.grid')?.children || []);
    const lastColumnLabel = columnHeaders.length > 0 ? columnHeaders[columnHeaders.length - 1].innerText.trim() : null;

    const todayButton = scrollContainer.querySelector('button[aria-current="date"]');
    let todayVisible = false;
    let todayLabel = null;
    if (todayButton) {
      todayLabel = todayButton.getAttribute('aria-label');
      const btnRect = todayButton.getBoundingClientRect();
      const containerRect = scrollContainer.getBoundingClientRect();
      todayVisible = btnRect.left >= containerRect.left && btnRect.right <= containerRect.right + 4;
    }

    // 5. Sticky Y-axis (Weekday scale 一、三、五、日) inspection
    const stickyCol = scrollContainer.querySelector('.sticky.left-0');
    let stickyMetrics = null;
    if (stickyCol) {
      const compStyle = window.getComputedStyle(stickyCol);
      const rect = stickyCol.getBoundingClientRect();
      const labels = Array.from(stickyCol.children).map(c => c.innerText.trim()).filter(Boolean);
      stickyMetrics = {
        position: compStyle.position,
        left: compStyle.left,
        zIndex: compStyle.zIndex,
        backgroundColor: compStyle.backgroundColor,
        labels,
        rect: {
          left: Math.round(rect.left),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        }
      };
    }

    return {
      totalCells,
      expectedCells: 16 * 7,
      denoising: {
        totalCheckIcons: checkIconCount,
        normalSquaresCount,
        normalSquaresWithCheckIcon,
        normalBackgroundColors: Array.from(normalColors),
        starIconsCount: starIconCount,
        restIconsCount: restIconCount,
        lowEnergyDotCount,
        isDenoised: normalSquaresWithCheckIcon === 0 && checkIconCount === 0
      },
      scroll: {
        scrollLeft,
        scrollWidth,
        clientWidth,
        maxScrollLeft,
        isAtRightmost,
        lastColumnLabel,
        todayVisible,
        todayLabel
      },
      sticky: stickyMetrics
    };
  })()`)
  console.log("Heatmap Audit Result:\n", JSON.stringify(heatmapAudit, null, 2))
  results.target2 = heatmapAudit

  // Scroll heatmap card into view
  await evaluate(`(() => {
    const scrollContainer = document.querySelector('[data-testid="activity-heatmap-scroll"]');
    if (scrollContainer) {
      scrollContainer.closest('.rounded-xl, .border')?.scrollIntoView({ block: 'start', behavior: 'instant' });
    }
  })()`)
  await new Promise((r) => setTimeout(r, 400))

  // Capture screenshot of 16-week heatmap at rightmost scroll position
  const target2ScreenshotRight = `${screenshotDir}/mobile-heatmap-16weeks-scrolled-right-375px.png`
  await takeScreenshot(target2ScreenshotRight)
  results.target2.screenshotRight = target2ScreenshotRight

  // Test Sticky behavior by scrolling midway (scrollLeft = 180)
  console.log("\nTesting Sticky Weekday Scale during horizontal scroll (scrollLeft = 180)...")
  const stickyTestMidway = await evaluate(`(() => {
    const scrollContainer = document.querySelector('[data-testid="activity-heatmap-scroll"]');
    if (!scrollContainer) return null;
    scrollContainer.scrollLeft = 180;
    const stickyCol = scrollContainer.querySelector('.sticky.left-0');
    const containerRect = scrollContainer.getBoundingClientRect();
    const stickyRect = stickyCol.getBoundingClientRect();
    const compStyle = window.getComputedStyle(stickyCol);

    return {
      setScrollLeft: 180,
      actualScrollLeft: Math.round(scrollContainer.scrollLeft),
      stickyLeftMatchesContainer: Math.abs(stickyRect.left - containerRect.left) <= 2,
      stickyRectLeft: Math.round(stickyRect.left),
      containerRectLeft: Math.round(containerRect.left),
      backgroundColor: compStyle.backgroundColor,
      zIndex: compStyle.zIndex
    };
  })()`)
  console.log("Sticky Test Midway Scroll:\n", JSON.stringify(stickyTestMidway, null, 2))
  results.target2.stickyTestMidway = stickyTestMidway

  // Capture screenshot showing sticky axis while scrolled midway
  const target2ScreenshotScrolled = `${screenshotDir}/mobile-heatmap-16weeks-scrolled-midway-sticky-375px.png`
  await takeScreenshot(target2ScreenshotScrolled)
  results.target2.screenshotMidway = target2ScreenshotScrolled

  // Restore scroll to rightmost
  await evaluate(`(() => {
    const scrollContainer = document.querySelector('[data-testid="activity-heatmap-scroll"]');
    if (scrollContainer) {
      scrollContainer.scrollLeft = scrollContainer.scrollWidth;
    }
  })()`)
  await new Promise((r) => setTimeout(r, 200))

} finally {
  cleanup()
}

console.log("\n============================================================")
console.log("FINAL QA TEST RESULTS SUMMARY")
console.log("============================================================")
console.log(JSON.stringify(results, null, 2))
