import { getCurrentUser } from "@/lib/session"
import AdaptiveRhythmSection from "@/components/pages/adaptive-rhythm-section"
import Hero from "@/components/pages/hero"
import OpenSource from "@/components/pages/opensource"
import TraceHistorySection from "@/components/pages/trace-history-section"
import { PWARedirect } from "@/components/pwa-redirect"

export default async function Home() {
  const user = await getCurrentUser()

  return (
    <main>
      {/* 1. Hero: Today Action Workspace (Visual 1) */}
      <Hero isAuthenticated={Boolean(user?.id)} />

      {/* 2. Differentiator: Adaptive 4-Tier Energy & Micro-Actions (Visual 2) */}
      <AdaptiveRhythmSection />

      {/* 3. Proof of Time: 4-Week Rhythm Matrix & Trace History (Visual 3) */}
      <TraceHistorySection />

      {/* 4. Open Source & Philosophy */}
      <OpenSource />

      <PWARedirect />
    </main>
  )
}
