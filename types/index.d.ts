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
export type ItemPriority = "HIGH" | "NORMAL" | "LOW"

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
  priority: ItemPriority
  sortOrder: number
  createdAt: string
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

