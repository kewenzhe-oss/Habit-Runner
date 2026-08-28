import {
  Category as PrismaCategory,
  CheckIn as PrismaCheckIn,
  DailyEnergyState as PrismaDailyEnergyState,
  EnergyActionPreset as PrismaEnergyActionPreset,
  Item as PrismaItem,
  ToolLink as PrismaToolLink,
} from "@prisma/client"

import { IconKeys } from "@/components/icons"

export type ItemType = "HABIT" | "QUIT_HABIT" | "TODO"

export type Layer =
  | "BODY"
  | "CRAFT"
  | "SIGNAL"
  | "MEMORY"
  | "JUDGMENT"
  | "CONTEMPLATION"
  | "LIFE"

export type EnergyLevel = "HIGH" | "NORMAL" | "LOW" | "REST"

export type ItemStatus = "ACTIVE" | "PAUSED" | "COMPLETED" | "ARCHIVED"

export type CheckInStatus = "COMPLETED" | "KEPT" | "LAPSED" | "REST" | "SKIPPED"

export type SiteConfig = {
  name: string
  author: string
  description: string
  keywords: Array<string>
  url: {
    base: string
    author: string
  }
  links: {
    github: string
  }
  ogImage: string
}

export type NavItem = {
  title: string
  disabled?: boolean
  external?: boolean
  icon?: IconKeys
  href: string
}

export type Navigation = {
  data: NavItem[]
}

// ----------------------------------------------------
// Enriched Domain Types
// ----------------------------------------------------
export type ItemWithDetails = PrismaItem & {
  category?: PrismaCategory | null
  actionPresets: PrismaEnergyActionPreset[]
  toolLinks: PrismaToolLink[]
  checkIns?: PrismaCheckIn[]
  _count?: {
    checkIns: number
  }
}

export type ItemDetailDTO = ItemWithDetails

export type TodayItemDTO = {
  id: string
  title: string
  whyPrompt?: string | null
  type: ItemType
  layer: Layer
  customCategory?: string | null
  status: ItemStatus
  colorCode?: string | null
  dueDate?: string | null

  // Unit metadata
  unitType?: string | null
  targetAmount?: number | null
  unitLabel?: string | null

  // Action recommendation & presets
  recommendedAction?: string | null
  actionPresets: PrismaEnergyActionPreset[]
  recommendedTool?: PrismaToolLink | null
  toolLinks: PrismaToolLink[]

  // Today checkin status
  todayCheckIn?: {
    id: string
    status: CheckInStatus
    actualEnergy?: EnergyLevel | null
    actionText?: string | null
    actualAmount?: number | null
    completionRate?: number | null
    restReasonTag?: string | null
    notes?: string | null
  } | null

  // Streak & stats summary
  actionStreak: number
  rhythmStreak: number
  maintainedDays?: number // For QUIT_HABIT

  // Recent 7-day mini trace
  recent7Days?: ItemRecentDayStatus[]
}

export type ItemRecentDayStatus = {
  date: string
  status: CheckInStatus | null
  actualEnergy?: EnergyLevel | null
  isScheduled?: boolean
  dayOfWeek?: number
  isToday?: boolean
  isFuture?: boolean
}

export type TodayDashboardData = {
  date: string // YYYY-MM-DD
  dailyEnergy: EnergyLevel | null
  dailyEnergyNote?: string | null
  items: TodayItemDTO[]
  stats: {
    totalActiveHabits: number
    totalActiveQuits: number
    totalPendingTodos: number
    completedTodayCount: number
    restTodayCount: number
  }
}

export type LayerInfo = {
  key: Layer
  label: string
  zhLabel: string
  description: string
  color: string
}

export type DateRange = {
  from: string
  to: string
}

export type WeeklyInsightsData = {
  dateRange: { from: string; to: string }
  energyDistribution: {
    HIGH: number
    NORMAL: number
    LOW: number
    REST: number
    UNLOGGED: number
  }
  layerDistribution: Array<{
    layer: Layer
    label: string
    color: string
    completedCount: number
    totalCheckIns: number
    opportunityCount: number
    connectionRate: number
  }>
  descriptiveInsight: string
  completionSummary: {
    habitActionsCompleted: number
    restDaysChosen: number
    quitsMaintainedDays: number
    todosFinished: number
  }
}

export type LayerGrowthSampleState =
  | "NO_PLAN"
  | "FORMING"
  | "PRELIMINARY"
  | "SUFFICIENT"
  | "NO_COMPARISON"

export type LayerGrowthPhase =
  | "NO_PLAN"
  | "DATA_FORMING"
  | "PRELIMINARY"
  | "NEW_LAYER"
  | "GROWING"
  | "STABLE_ROOTED"
  | "KEEPING_RHYTHM"
  | "RECONNECTING"
  | "TEMPORARILY_QUIET"

export type LayerGrowthWeeklyPoint = {
  from: string
  to: string
  score: number | null
  connectedCount: number
  opportunityCount: number
  hasConnection: boolean
}

export type LayerGrowthRow = {
  layer: Layer
  label: string
  color: string
  itemCount: number
  foundation: {
    score: number | null
    connectedCount: number
    opportunityCount: number
    sampleState: LayerGrowthSampleState
  }
  momentum: {
    currentScore: number | null
    previousScore: number | null
    deltaPercentagePoints: number | null
    comparableItemCount: number
    sampleState: LayerGrowthSampleState
  }
  stability: {
    connectedWeeks: number
    eligibleWeeks: number
    currentConnectedRun: number
    weeklySeries: LayerGrowthWeeklyPoint[]
  }
  phase: LayerGrowthPhase
}

export type LayerGrowthMatrixData = {
  periods: {
    current30: DateRange
    previous30: DateRange
    stability12Weeks: DateRange
  }
  dataBasis: {
    planBasis: "CURRENT_PLAN_ESTIMATE"
    historyComplete: false
  }
  layers: LayerGrowthRow[]
}
