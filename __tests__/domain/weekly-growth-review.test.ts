import type {
  Layer,
  LayerGrowthMatrixData,
  LayerGrowthPhase,
  LayerGrowthRow,
} from "@/types"

import { buildWeeklyGrowthReview } from "@/lib/domain/weekly-growth-review"

function row({
  layer,
  connected,
  connectedWeeks,
  currentRun,
  phase,
}: {
  layer: Layer
  connected: number
  connectedWeeks: number
  currentRun: number
  phase: LayerGrowthPhase
}): LayerGrowthRow {
  return {
    layer,
    label: layer,
    color: "#000000",
    itemCount: 1,
    foundation: {
      score: 50,
      connectedCount: connected,
      opportunityCount: 10,
      sampleState: phase === "DATA_FORMING" ? "FORMING" : "SUFFICIENT",
    },
    momentum: {
      currentScore: null,
      previousScore: null,
      deltaPercentagePoints: null,
      comparableItemCount: 0,
      sampleState: "NO_COMPARISON",
    },
    stability: {
      connectedWeeks,
      eligibleWeeks: Math.max(connectedWeeks, 1),
      currentConnectedRun: currentRun,
      weeklySeries: [],
    },
    phase,
  }
}

function data(layers: LayerGrowthRow[]): LayerGrowthMatrixData {
  return {
    periods: {
      current30: { from: "2026-08-01", to: "2026-08-30" },
      previous30: { from: "2026-07-02", to: "2026-07-31" },
      stability12Weeks: { from: "2026-06-08", to: "2026-08-30" },
    },
    dataBasis: {
      planBasis: "CURRENT_PLAN_ESTIMATE",
      historyComplete: false,
    },
    layers,
  }
}

describe("weekly growth review narrative selection", () => {
  it("uses real connection traces to select recent focus without exposing a score", () => {
    const review = buildWeeklyGrowthReview(
      data([
        row({
          layer: "BODY",
          connected: 6,
          connectedWeeks: 5,
          currentRun: 2,
          phase: "STABLE_ROOTED",
        }),
        row({
          layer: "CRAFT",
          connected: 9,
          connectedWeeks: 4,
          currentRun: 1,
          phase: "GROWING",
        }),
        row({
          layer: "SIGNAL",
          connected: 3,
          connectedWeeks: 2,
          currentRun: 1,
          phase: "DATA_FORMING",
        }),
      ])
    )

    expect(review.focusLayers.map((item) => item.layer)).toEqual([
      "CRAFT",
      "BODY",
      "SIGNAL",
    ])
    expect(review.totalConnectedCount).toBe(18)
    expect(review.overallState).toBe("FOCUSED_ROOTING")
  })

  it("prioritizes time-supported journeys and offers a gentle reconnection", () => {
    const review = buildWeeklyGrowthReview(
      data([
        row({
          layer: "BODY",
          connected: 6,
          connectedWeeks: 8,
          currentRun: 3,
          phase: "STABLE_ROOTED",
        }),
        row({
          layer: "CRAFT",
          connected: 5,
          connectedWeeks: 6,
          currentRun: 2,
          phase: "GROWING",
        }),
        row({
          layer: "SIGNAL",
          connected: 7,
          connectedWeeks: 2,
          currentRun: 1,
          phase: "DATA_FORMING",
        }),
        row({
          layer: "LIFE",
          connected: 2,
          connectedWeeks: 5,
          currentRun: 0,
          phase: "RECONNECTING",
        }),
      ])
    )

    expect(review.journeyLayers.map((item) => item.layer)).toEqual([
      "BODY",
      "CRAFT",
      "LIFE",
    ])
    expect(review.keepLayer?.layer).toBe("BODY")
    expect(review.gentleLayer?.layer).toBe("LIFE")
    expect(review.overallState).toBe("MULTI_LAYER_GROWTH")
  })

  it("keeps early records in a non-deterministic settling state", () => {
    const review = buildWeeklyGrowthReview(
      data([
        row({
          layer: "BODY",
          connected: 1,
          connectedWeeks: 1,
          currentRun: 1,
          phase: "DATA_FORMING",
        }),
      ])
    )

    expect(review.overallState).toBe("DATA_SETTLING")
    expect(review.establishedLayerCount).toBe(0)
    expect(review.journeyLayers).toHaveLength(1)
  })
})
