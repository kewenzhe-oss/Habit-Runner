import { LayerGrowthMatrixData } from "@/types"

import { deriveGrowthNarrative } from "@/lib/domain/growth-narrative"

describe("Growth Narrative Domain Logic", () => {
  const mockMatrixData: LayerGrowthMatrixData = {
    periods: {
      current30: { from: "2026-07-30", to: "2026-08-28" },
      previous30: { from: "2026-06-30", to: "2026-07-29" },
      stability12Weeks: { from: "2026-06-08", to: "2026-08-28" },
    },
    dataBasis: {
      planBasis: "CURRENT_PLAN_ESTIMATE",
      historyComplete: false,
    },
    layers: [
      {
        layer: "BODY",
        label: "Body (身体与能量)",
        color: "#10B981",
        itemCount: 2,
        foundation: {
          score: 85,
          connectedCount: 22,
          opportunityCount: 26,
          sampleState: "SUFFICIENT",
        },
        momentum: {
          currentScore: 85,
          previousScore: 80,
          deltaPercentagePoints: 5,
          comparableItemCount: 2,
          sampleState: "SUFFICIENT",
        },
        stability: {
          connectedWeeks: 10,
          eligibleWeeks: 12,
          currentConnectedRun: 4,
          weeklySeries: Array.from({ length: 12 }, (_, i) => ({
            from: `2026-06-${i + 1}`,
            to: `2026-06-${i + 7}`,
            score: i >= 2 ? 100 : 0,
            connectedCount: i >= 2 ? 2 : 0,
            opportunityCount: 2,
            hasConnection: i >= 2,
          })),
        },
        phase: "STABLE_ROOTED",
      },
      {
        layer: "SIGNAL",
        label: "Signal (学习与输入)",
        color: "#3B82F6",
        itemCount: 1,
        foundation: {
          score: 60,
          connectedCount: 12,
          opportunityCount: 20,
          sampleState: "SUFFICIENT",
        },
        momentum: {
          currentScore: 60,
          previousScore: 40,
          deltaPercentagePoints: 20,
          comparableItemCount: 1,
          sampleState: "SUFFICIENT",
        },
        stability: {
          connectedWeeks: 6,
          eligibleWeeks: 12,
          currentConnectedRun: 2,
          weeklySeries: Array.from({ length: 12 }, (_, i) => ({
            from: `2026-06-${i + 1}`,
            to: `2026-06-${i + 7}`,
            score: i % 2 === 0 ? 100 : 0,
            connectedCount: i % 2 === 0 ? 2 : 0,
            opportunityCount: 2,
            hasConnection: i % 2 === 0,
          })),
        },
        phase: "GROWING",
      },
      {
        layer: "MEMORY",
        label: "Memory (笔记与整理)",
        color: "#8B5CF6",
        itemCount: 1,
        foundation: {
          score: 0,
          connectedCount: 0,
          opportunityCount: 10,
          sampleState: "SUFFICIENT",
        },
        momentum: {
          currentScore: 0,
          previousScore: 50,
          deltaPercentagePoints: -50,
          comparableItemCount: 1,
          sampleState: "SUFFICIENT",
        },
        stability: {
          connectedWeeks: 2,
          eligibleWeeks: 12,
          currentConnectedRun: 0,
          weeklySeries: Array.from({ length: 12 }, (_, i) => ({
            from: `2026-06-${i + 1}`,
            to: `2026-06-${i + 7}`,
            score: i === 0 || i === 1 ? 100 : 0,
            connectedCount: i === 0 || i === 1 ? 2 : 0,
            opportunityCount: 2,
            hasConnection: i === 0 || i === 1,
          })),
        },
        phase: "TEMPORARILY_QUIET",
      },
    ],
  }

  test("derives top focus layers and narrative summary in Chinese", () => {
    const narrative = deriveGrowthNarrative(mockMatrixData, "zh")

    expect(narrative.focusLayers.length).toBeGreaterThan(0)
    expect(narrative.focusLayers[0].layer).toBe("BODY")
    expect(narrative.summaryNarrative).toContain("身体")
    expect(narrative.overallState.title).toBeTruthy()
    expect(narrative.overallState.basis).toBeTruthy()
  })

  test("extracts growing layers with factual descriptions", () => {
    const narrative = deriveGrowthNarrative(mockMatrixData, "zh")

    expect(narrative.growingLayers.length).toBeGreaterThan(0)
    const bodyLayer = narrative.growingLayers.find((l) => l.layer === "BODY")
    expect(bodyLayer).toBeDefined()
    expect(bodyLayer?.phase).toBe("STABLE_ROOTED")
    expect(bodyLayer?.factDescription).toContain("12 周")
  })

  test("generates actionable next step guidance (keep and optional gentle)", () => {
    const narrative = deriveGrowthNarrative(mockMatrixData, "zh")

    expect(narrative.nextStepGuidance.protect).toBeDefined()
    expect(narrative.nextStepGuidance.protect?.message).toContain("守住")
    expect(narrative.nextStepGuidance.optionalGentle).toBeDefined()
    expect(narrative.nextStepGuidance.optionalGentle?.message).toContain("余力")
    expect(narrative.nextStepGuidance.reassurance).toBeTruthy()
  })

  test("supports English localization cleanly", () => {
    const narrative = deriveGrowthNarrative(mockMatrixData, "en")

    expect(narrative.summaryNarrative).toContain("Body")
    expect(narrative.overallState.title).toBeTruthy()
    expect(narrative.growingLayers[0].factDescription).toContain("weeks")
  })
})
