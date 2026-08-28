import {
  Layer,
  LayerGrowthMatrixData,
  LayerGrowthPhase,
  LayerGrowthRow,
  LayerGrowthWeeklyPoint,
} from "@/types"

export type OverallGrowthState =
  | "FOCUSED_ROOTING"
  | "MULTI_GROWTH"
  | "RECONNECTING"
  | "REST_CALIBRATING"
  | "DATA_FORMING"

export type GrowingLayerItem = {
  layer: Layer
  label: string
  zhLabel: string
  color: string
  phase: LayerGrowthPhase
  phaseLabel: string
  weeklySeries: LayerGrowthWeeklyPoint[]
  connectedWeeks: number
  eligibleWeeks: number
  currentRun: number
  factDescription: string
}

export type NextStepGuidance = {
  protect: {
    layer: Layer
    label: string
    message: string
  } | null
  optionalGentle: {
    layer: Layer
    label: string
    message: string
  } | null
  reassurance: string
}

export type GrowthNarrativeResult = {
  focusLayers: Array<{
    layer: Layer
    label: string
    zhLabel: string
    color: string
    connectedCount: number
    connectedWeeks: number
  }>
  summaryNarrative: string
  overallState: {
    type: OverallGrowthState
    title: string
    basis: string
  }
  growingLayers: GrowingLayerItem[]
  nextStepGuidance: NextStepGuidance
}

const LAYER_NAMES: Record<Layer, { label: string; zhLabel: string }> = {
  BODY: { label: "Body", zhLabel: "身体" },
  CRAFT: { label: "Craft", zhLabel: "工作与创造" },
  SIGNAL: { label: "Signal", zhLabel: "学习与输入" },
  MEMORY: { label: "Memory", zhLabel: "笔记与沉淀" },
  JUDGMENT: { label: "Judgment", zhLabel: "决策与方向" },
  CONTEMPLATION: { label: "Contemplation", zhLabel: "沉思与休息" },
  LIFE: { label: "Life", zhLabel: "日常生活" },
}

const PHASE_LABELS: Record<LayerGrowthPhase, { zh: string; en: string }> = {
  STABLE_ROOTED: { zh: "稳定扎根", en: "Firmly Rooted" },
  GROWING: { zh: "正在生长", en: "Growing" },
  KEEPING_RHYTHM: { zh: "保持节律", en: "Keeping Rhythm" },
  RECONNECTING: { zh: "重新连接", en: "Reconnecting" },
  NEW_LAYER: { zh: "新领域建立", en: "Newly Established" },
  TEMPORARILY_QUIET: { zh: "暂时静息", en: "Temporarily Quiet" },
  PRELIMINARY: { zh: "初步形成", en: "Preliminary" },
  DATA_FORMING: { zh: "数据沉淀中", en: "Data Forming" },
  NO_PLAN: { zh: "未设计划", en: "No Plan Set" },
}

export function deriveGrowthNarrative(
  matrixData: LayerGrowthMatrixData,
  locale: "zh" | "en" = "zh"
): GrowthNarrativeResult {
  const layers = matrixData?.layers || []

  // 1. Filter and sort layers by active connection evidence in the past 30 days
  const activeLayers = layers.filter(
    (l) => l.foundation.connectedCount > 0 || l.stability.connectedWeeks > 0
  )

  // Sort by connectedCount desc, then connectedWeeks desc
  const sortedByConnection = [...activeLayers].sort((a, b) => {
    if (b.foundation.connectedCount !== a.foundation.connectedCount) {
      return b.foundation.connectedCount - a.foundation.connectedCount
    }
    return b.stability.connectedWeeks - a.stability.connectedWeeks
  })

  // Top 2-3 focus layers
  const topFocusRows = sortedByConnection.slice(0, 3)
  const focusLayers = topFocusRows.map((r) => ({
    layer: r.layer,
    label: LAYER_NAMES[r.layer]?.label || r.label,
    zhLabel: LAYER_NAMES[r.layer]?.zhLabel || r.label,
    color: r.color,
    connectedCount: r.foundation.connectedCount,
    connectedWeeks: r.stability.connectedWeeks,
  }))

  // 2. Identify "Growing / Rooting" layers with concrete 12-week time evidence
  // Priority: STABLE_ROOTED, GROWING, KEEPING_RHYTHM, RECONNECTING, NEW_LAYER
  const validGrowthPhases: LayerGrowthPhase[] = [
    "STABLE_ROOTED",
    "GROWING",
    "KEEPING_RHYTHM",
    "RECONNECTING",
    "NEW_LAYER",
  ]

  const growthCandidateRows = layers
    .filter((l) => validGrowthPhases.includes(l.phase) && l.stability.connectedWeeks > 0)
    .sort((a, b) => {
      // Prioritize rooted and growing phases
      const phasePriority: Record<LayerGrowthPhase, number> = {
        STABLE_ROOTED: 5,
        GROWING: 4,
        KEEPING_RHYTHM: 3,
        RECONNECTING: 2,
        NEW_LAYER: 1,
        PRELIMINARY: 0,
        DATA_FORMING: 0,
        TEMPORARILY_QUIET: -1,
        NO_PLAN: -2,
      }
      const scoreDiff = (phasePriority[b.phase] || 0) - (phasePriority[a.phase] || 0)
      if (scoreDiff !== 0) return scoreDiff
      return b.stability.currentConnectedRun - a.stability.currentConnectedRun
    })
    .slice(0, 3)

  const growingLayers: GrowingLayerItem[] = growthCandidateRows.map((r) => {
    const zhName = LAYER_NAMES[r.layer]?.zhLabel || r.label
    const enName = LAYER_NAMES[r.layer]?.label || r.label
    const name = locale === "zh" ? zhName : enName
    const phaseLabel = PHASE_LABELS[r.phase]?.[locale] || r.phase

    let factDescription = ""
    if (locale === "zh") {
      if (r.phase === "STABLE_ROOTED") {
        factDescription = `过去 12 周有 ${r.stability.connectedWeeks} 周留下行动${
          r.stability.currentConnectedRun >= 2
            ? `，最近连续 ${r.stability.currentConnectedRun} 周仍在持续。`
            : "，形成了稳固的生活基底。"
        }`
      } else if (r.phase === "GROWING") {
        factDescription = `最近 30 天呈现明显的上升动量，节律正在稳步扩展。`
      } else if (r.phase === "RECONNECTING") {
        factDescription = `最近重新留下了连接痕迹，生活节律正在重新接上。`
      } else if (r.phase === "KEEPING_RHYTHM") {
        factDescription = `在过去 12 周中保持了 ${r.stability.connectedWeeks} 周的有效连接，平稳运行。`
      } else {
        factDescription = `新建立的行动领域，已连续 ${r.stability.currentConnectedRun || 1} 周形成初步轨迹。`
      }
    } else {
      if (r.phase === "STABLE_ROOTED") {
        factDescription = `Action recorded in ${r.stability.connectedWeeks} of the past 12 weeks${
          r.stability.currentConnectedRun >= 2
            ? `, maintained for ${r.stability.currentConnectedRun} consecutive weeks.`
            : ", forming a firm life foundation."
        }`
      } else if (r.phase === "GROWING") {
        factDescription = `Showing positive upward momentum over the last 30 days with expanding rhythm.`
      } else if (r.phase === "RECONNECTING") {
        factDescription = `Actions recorded again recently, reconnecting into active life rhythm.`
      } else if (r.phase === "KEEPING_RHYTHM") {
        factDescription = `Maintained steady connection across ${r.stability.connectedWeeks} weeks in the past 12 weeks.`
      } else {
        factDescription = `Newly formed domain with steady initial momentum across recent weeks.`
      }
    }

    return {
      layer: r.layer,
      label: enName,
      zhLabel: zhName,
      color: r.color,
      phase: r.phase,
      phaseLabel,
      weeklySeries: r.stability.weeklySeries,
      connectedWeeks: r.stability.connectedWeeks,
      eligibleWeeks: r.stability.eligibleWeeks,
      currentRun: r.stability.currentConnectedRun,
      factDescription,
    }
  })

  // 3. Derive Overall Phase and State
  let overallType: OverallGrowthState = "DATA_FORMING"
  let overallTitle = ""
  let overallBasis = ""

  const rootedCount = layers.filter((l) => l.phase === "STABLE_ROOTED").length
  const growingCount = layers.filter((l) => l.phase === "GROWING" || l.phase === "KEEPING_RHYTHM").length
  const reconnectingCount = layers.filter((l) => l.phase === "RECONNECTING").length
  const quietCount = layers.filter((l) => l.phase === "TEMPORARILY_QUIET").length

  if (activeLayers.length === 0) {
    overallType = "DATA_FORMING"
    overallTitle = locale === "zh" ? "数据沉淀中" : "Data Forming"
    overallBasis =
      locale === "zh"
        ? "记录尚在初期积累阶段，继续按当下节奏记录即可"
        : "Initial logs are accumulating; continue recording at your natural pace."
  } else if (rootedCount >= 2 && growingCount <= 1) {
    overallType = "FOCUSED_ROOTING"
    overallTitle = locale === "zh" ? "集中扎根中" : "Focused Rooting"
    overallBasis =
      locale === "zh"
        ? `依据：${rootedCount} 个核心领域持续深入扎根，其余领域平稳蓄能`
        : `Basis: ${rootedCount} core domains deeply rooted, other domains calmly recharging`
  } else if (rootedCount + growingCount >= 3) {
    overallType = "MULTI_GROWTH"
    overallTitle = locale === "zh" ? "多点生长中" : "Multi-Domain Growth"
    overallBasis =
      locale === "zh"
        ? `依据：${rootedCount + growingCount} 个领域同时形成连续的行动节律`
        : `Basis: ${rootedCount + growingCount} domains actively sustaining recurring rhythm`
  } else if (reconnectingCount >= 1 && rootedCount <= 1) {
    overallType = "RECONNECTING"
    overallTitle = locale === "zh" ? "重新连接中" : "Reconnecting"
    overallBasis =
      locale === "zh"
        ? `依据：曾经静息的领域最近重新接上连接，生活节奏正在唤醒`
        : `Basis: Previously quiet areas are reconnecting with fresh momentum`
  } else if (quietCount >= 2 && activeLayers.length <= 2) {
    overallType = "REST_CALIBRATING"
    overallTitle = locale === "zh" ? "休整沉淀中" : "Rest & Calibrating"
    overallBasis =
      locale === "zh"
        ? `依据：部分领域进入主动休整与蓄能阶段，保留核心底线连接`
        : `Basis: Multiple domains resting mindfully while baseline continuity is preserved`
  } else {
    overallType = "FOCUSED_ROOTING"
    overallTitle = locale === "zh" ? "平稳运行中" : "Steady Rhythm"
    overallBasis =
      locale === "zh"
        ? `依据：${activeLayers.length} 个领域保持规律连接，系统平稳运行`
        : `Basis: ${activeLayers.length} domains maintaining steady connection`
  }

  // 4. Generate Human Narrative Summary
  let summaryNarrative = ""
  if (locale === "zh") {
    if (topFocusRows.length === 0) {
      summaryNarrative = "最近 30 天正在建立最初的行动轨迹，生活系统即将逐渐显现清晰的轮廓。"
    } else {
      const names = topFocusRows
        .map((r) => LAYER_NAMES[r.layer]?.zhLabel || r.label)
        .join("、")
      const primary = topFocusRows[0]
      const primaryName = LAYER_NAMES[primary.layer]?.zhLabel || primary.label

      if (primary.phase === "STABLE_ROOTED") {
        summaryNarrative = `最近 30 天，你的行动主要落在${names}。其中${primaryName}已经形成稳固的连续节律，成为当前生活的坚实底盘。`
      } else if (primary.phase === "RECONNECTING") {
        summaryNarrative = `最近 30 天，你的行动主要落在${names}。${primaryName}正在重新接上节奏，整体生活状态温和回暖。`
      } else {
        summaryNarrative = `最近 30 天，你的行动主要落在${names}。系统在核心领域持续保持连接，稳步向前。`
      }
    }
  } else {
    if (topFocusRows.length === 0) {
      summaryNarrative = "Over the past 30 days, your initial actions are forming. Your life system will soon reveal its clear rhythm."
    } else {
      const names = topFocusRows
        .map((r) => LAYER_NAMES[r.layer]?.label || r.label)
        .join(", ")
      const primary = topFocusRows[0]
      const primaryName = LAYER_NAMES[primary.layer]?.label || primary.label

      if (primary.phase === "STABLE_ROOTED") {
        summaryNarrative = `Over the past 30 days, your actions focused mainly on ${names}. ${primaryName} has established a firm rhythm as your anchor.`
      } else if (primary.phase === "RECONNECTING") {
        summaryNarrative = `Over the past 30 days, your actions focused mainly on ${names}. ${primaryName} is reconnecting with renewed momentum.`
      } else {
        summaryNarrative = `Over the past 30 days, your actions focused mainly on ${names}, sustaining steady connection across core domains.`
      }
    }
  }

  // 5. Next Step Guidance (1 Protect + 1 Optional Gentle Connection)
  const rootedLayer = layers.find(
    (l) => l.phase === "STABLE_ROOTED" || l.stability.currentConnectedRun >= 2
  )

  const quietPlannedLayer = layers.find(
    (l) =>
      (l.phase === "TEMPORARILY_QUIET" || l.phase === "RECONNECTING") &&
      l.itemCount > 0
  )

  let protect: NextStepGuidance["protect"] = null
  if (rootedLayer) {
    const name = locale === "zh" ? LAYER_NAMES[rootedLayer.layer]?.zhLabel : LAYER_NAMES[rootedLayer.layer]?.label
    protect = {
      layer: rootedLayer.layer,
      label: name,
      message:
        locale === "zh"
          ? `继续守住：${name}领域已连续 ${rootedLayer.stability.currentConnectedRun || 2} 周保持连接，按当前最小动作维持即可，无需增加难度。`
          : `Protect rhythm: ${name} has sustained connection for ${rootedLayer.stability.currentConnectedRun || 2} weeks. Maintain your baseline action without pressure.`,
    }
  } else if (topFocusRows[0]) {
    const primary = topFocusRows[0]
    const name = locale === "zh" ? LAYER_NAMES[primary.layer]?.zhLabel : LAYER_NAMES[primary.layer]?.label
    protect = {
      layer: primary.layer,
      label: name,
      message:
        locale === "zh"
          ? `继续守住：在${name}领域保持当下的节奏，保护行动底线不中断。`
          : `Protect rhythm: Sustain current actions in ${name} to protect baseline continuity.`,
    }
  }

  let optionalGentle: NextStepGuidance["optionalGentle"] = null
  if (quietPlannedLayer && quietPlannedLayer.layer !== rootedLayer?.layer) {
    const name = locale === "zh" ? LAYER_NAMES[quietPlannedLayer.layer]?.zhLabel : LAYER_NAMES[quietPlannedLayer.layer]?.label
    optionalGentle = {
      layer: quietPlannedLayer.layer,
      label: name,
      message:
        locale === "zh"
          ? `如果还有余力：可以为${name}留下一两次轻量微行动，让它重新接上节奏。`
          : `If capacity allows: Leave a micro-action for ${name} to gently reconnect its rhythm.`,
    }
  }

  const reassurance =
    locale === "zh"
      ? "目前不需要补齐所有领域，继续守住现在的节奏就足够了。"
      : "There is no need to fill every domain. Protecting your current rhythm is already enough."

  return {
    focusLayers,
    summaryNarrative,
    overallState: {
      type: overallType,
      title: overallTitle,
      basis: overallBasis,
    },
    growingLayers,
    nextStepGuidance: {
      protect,
      optionalGentle,
      reassurance,
    },
  }
}
