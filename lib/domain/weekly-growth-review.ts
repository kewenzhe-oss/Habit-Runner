import type {
  LayerGrowthMatrixData,
  LayerGrowthPhase,
  LayerGrowthRow,
} from "@/types"

export type WeeklyReviewOverallState =
  | "DATA_SETTLING"
  | "FOCUSED_ROOTING"
  | "MULTI_LAYER_GROWTH"
  | "RECONNECTING"
  | "QUIET_SETTLING"

export type WeeklyGrowthReview = {
  overallState: WeeklyReviewOverallState
  focusLayers: LayerGrowthRow[]
  journeyLayers: LayerGrowthRow[]
  keepLayer: LayerGrowthRow | null
  gentleLayer: LayerGrowthRow | null
  connectedLayerCount: number
  establishedLayerCount: number
  totalConnectedCount: number
}

const ESTABLISHED_PHASES = new Set<LayerGrowthPhase>([
  "GROWING",
  "STABLE_ROOTED",
  "KEEPING_RHYTHM",
  "RECONNECTING",
])

const JOURNEY_PHASE_PRIORITY: Record<LayerGrowthPhase, number> = {
  STABLE_ROOTED: 9,
  GROWING: 8,
  RECONNECTING: 7,
  KEEPING_RHYTHM: 6,
  NEW_LAYER: 5,
  PRELIMINARY: 4,
  DATA_FORMING: 3,
  TEMPORARILY_QUIET: 2,
  NO_PLAN: 1,
}

function byRecentFocus(a: LayerGrowthRow, b: LayerGrowthRow): number {
  return (
    b.foundation.connectedCount - a.foundation.connectedCount ||
    b.stability.currentConnectedRun - a.stability.currentConnectedRun ||
    b.stability.connectedWeeks - a.stability.connectedWeeks
  )
}

function byJourneyEvidence(a: LayerGrowthRow, b: LayerGrowthRow): number {
  return (
    JOURNEY_PHASE_PRIORITY[b.phase] - JOURNEY_PHASE_PRIORITY[a.phase] ||
    b.stability.currentConnectedRun - a.stability.currentConnectedRun ||
    b.stability.connectedWeeks - a.stability.connectedWeeks ||
    b.foundation.connectedCount - a.foundation.connectedCount
  )
}

function resolveOverallState(
  layers: LayerGrowthRow[],
  connectedLayers: LayerGrowthRow[],
  establishedLayers: LayerGrowthRow[]
): WeeklyReviewOverallState {
  if (connectedLayers.length === 0) {
    return layers.some((row) => row.itemCount > 0)
      ? "QUIET_SETTLING"
      : "DATA_SETTLING"
  }

  if (establishedLayers.length === 0) return "DATA_SETTLING"

  const reconnectingCount = establishedLayers.filter(
    (row) => row.phase === "RECONNECTING"
  ).length
  const rootedCount = establishedLayers.length - reconnectingCount

  if (reconnectingCount > 0 && reconnectingCount >= rootedCount) {
    return "RECONNECTING"
  }
  if (establishedLayers.length >= 3) return "MULTI_LAYER_GROWTH"
  return "FOCUSED_ROOTING"
}

export function buildWeeklyGrowthReview(
  data: LayerGrowthMatrixData
): WeeklyGrowthReview {
  const connectedLayers = data.layers
    .filter((row) => row.foundation.connectedCount > 0)
    .sort(byRecentFocus)
  const establishedLayers = connectedLayers.filter((row) =>
    ESTABLISHED_PHASES.has(row.phase)
  )

  const journeyLayers = connectedLayers
    .filter((row) => row.stability.connectedWeeks > 0)
    .sort(byJourneyEvidence)
    .slice(0, 3)

  const keepLayer =
    journeyLayers.find(
      (row) =>
        row.stability.currentConnectedRun > 0 &&
        row.phase !== "RECONNECTING" &&
        row.phase !== "TEMPORARILY_QUIET"
    ) ||
    journeyLayers.find((row) => row.stability.currentConnectedRun > 0) ||
    null

  const gentleLayer =
    data.layers
      .filter(
        (row) =>
          row.layer !== keepLayer?.layer &&
          row.itemCount > 0 &&
          (row.phase === "RECONNECTING" || row.phase === "TEMPORARILY_QUIET")
      )
      .sort((a, b) => {
        if (a.phase !== b.phase) return a.phase === "RECONNECTING" ? -1 : 1
        return b.stability.connectedWeeks - a.stability.connectedWeeks
      })[0] || null

  return {
    overallState: resolveOverallState(
      data.layers,
      connectedLayers,
      establishedLayers
    ),
    focusLayers: connectedLayers.slice(0, 3),
    journeyLayers,
    keepLayer,
    gentleLayer,
    connectedLayerCount: connectedLayers.length,
    establishedLayerCount: establishedLayers.length,
    totalConnectedCount: connectedLayers.reduce(
      (sum, row) => sum + row.foundation.connectedCount,
      0
    ),
  }
}
