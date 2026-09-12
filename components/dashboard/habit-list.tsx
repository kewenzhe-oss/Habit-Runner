"use client"

import * as React from "react"
import Link from "next/link"
import { EnergyLevel, TodayItemDTO } from "@/types"
import { Icons } from "@/components/icons"

import { sortWithinStatusGroup } from "@/lib/domain/item-order"
import { useI18n } from "@/lib/i18n"
import { cn } from "@/lib/utils"
import { useLocalMigration } from "@/hooks/use-local-migration"
import { EmptyPlaceholder } from "@/components/empty-placeholder"
import { LocalMigrationBanner } from "@/components/migration/local-migration-banner"
import { LocalMigrationDialog } from "@/components/migration/local-migration-dialog"

import { CategoryManagerModal } from "./category-manager-modal"
import { HabitItem } from "./habit-item"
import { RecordActionModal } from "./record-action-modal"
import { TodayCompassCard } from "./today-compass-card"

interface Category {
  id: string
  name: string
  colorCode?: string | null
}

interface HabitListProps {
  initialItems: TodayItemDTO[]
  initialCategories?: Category[]
  dailyEnergy?: EnergyLevel | null
  dailyEnergyNote?: string | null
  dateStr?: string
  userEmail?: string | null
}

export function HabitList({
  initialItems,
  initialCategories = [],
  dailyEnergy,
  dailyEnergyNote,
  dateStr,
  userEmail,
}: HabitListProps) {
  const { dict, format } = useI18n()
  const secDict = dict.dashboard.sections
  const [items, setItems] = React.useState<TodayItemDTO[]>(initialItems)
  const [categories, setCategories] = React.useState<Category[]>(initialCategories)
  const [activeTypeTab, setActiveTypeTab] = React.useState<
    "ALL" | "HABIT" | "QUIT_HABIT" | "TODO"
  >("ALL")
  const [selectedCategory, setSelectedCategory] = React.useState<string>("ALL")
  const [recordingItem, setRecordingItem] = React.useState<TodayItemDTO | null>(
    null
  )
  const [recordModalOpen, setRecordModalOpen] = React.useState(false)
  const [categoryModalOpen, setCategoryModalOpen] = React.useState(false)
  const [completedTodosOpen, setCompletedTodosOpen] = React.useState(false)
  const [showAllCompleted, setShowAllCompleted] = React.useState(false)

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/categories")
      if (res.ok) {
        const data = await res.json()
        setCategories(data)
      }
    } catch (e) {
      console.error("Failed to fetch categories", e)
    }
  }

  const refreshItems = async () => {
    try {
      const todayStr = new Date().toISOString().split("T")[0]
      const res = await fetch(`/api/dashboard/today?date=${todayStr}`)
      if (res.ok) {
        const data = await res.json()
        setItems(data.items || [])
      }
    } catch (e) {
      console.error("Failed to refresh items", e)
    }
    fetchCategories()
  }

  React.useEffect(() => {
    if (initialCategories.length === 0) {
      fetchCategories()
    }
  }, [initialCategories.length])

  // Low / Rest energy mode — only P0 + QUIT_HABIT survive
  const isLowEnergyMode =
    dailyEnergy === "LOW" || dailyEnergy === "REST"

  // Filter items by category
  const categoryFiltered = items.filter((item) => {
    if (selectedCategory !== "ALL") {
      const cat = item.customCategory || item.layer
      if (cat !== selectedCategory) return false
    }
    return true
  })

  // Energy gate: in Low/Rest mode keep only P0 habits and all QUIT_HABIT
  const energyFiltered = isLowEnergyMode
    ? categoryFiltered.filter(
        (i) =>
          i.type === "QUIT_HABIT" ||
          (i.type === "HABIT" && i.priority === "HIGH")
      )
    : categoryFiltered

  // Separate Habits from TODOs, then split by check-in state
  const allHabits = sortWithinStatusGroup(
    energyFiltered.filter(
      (i) => i.type === "HABIT" || i.type === "QUIT_HABIT"
    )
  )
  // Pending habits float to top; checked-in (done / rest / lapsed) sink to bottom
  const pendingHabits = allHabits.filter(
    (i) => !i.todayCheckIn
  )
  const checkedHabits = allHabits.filter(
    (i) => !!i.todayCheckIn
  )
  // Combined ordered list used for the count badge
  const activeHabits = [...pendingHabits, ...checkedHabits]
  const pendingTodos = sortWithinStatusGroup(
    // TODOs: in low-energy mode, only P0 TODOs
    (isLowEnergyMode
      ? categoryFiltered.filter(
          (i) => i.type === "TODO" && i.priority === "HIGH" && i.status !== "COMPLETED"
        )
      : categoryFiltered.filter(
          (i) => i.type === "TODO" && i.status !== "COMPLETED"
        )
    )
  )
  // Sort completed TODOs by completion/updated date descending (newest completed first)
  const completedTodos = React.useMemo(() => {
    return categoryFiltered
      .filter((i) => i.type === "TODO" && i.status === "COMPLETED")
      .sort((a, b) => {
        const timeA = new Date(a.updatedAt || a.createdAt).getTime()
        const timeB = new Date(b.updatedAt || b.createdAt).getTime()
        return timeB - timeA
      })
  }, [categoryFiltered])

  const MAX_COMPLETED_TODOS = 5
  const visibleCompletedTodos = showAllCompleted
    ? completedTodos
    : completedTodos.slice(0, MAX_COMPLETED_TODOS)
  const archivedCompletedCount = Math.max(0, completedTodos.length - MAX_COMPLETED_TODOS)

  const habitsCount = items.filter((i) => i.type === "HABIT").length
  const quitsCount = items.filter((i) => i.type === "QUIT_HABIT").length
  const todosCount = items.filter(
    (i) => i.type === "TODO" && i.status !== "COMPLETED"
  ).length

  // Count hidden items in low-energy mode for the banner
  const hiddenHabitsCount = isLowEnergyMode
    ? categoryFiltered.filter(
        (i) =>
          (i.type === "HABIT" && i.priority !== "HIGH") ||
          (i.type === "TODO" && i.priority !== "HIGH" && i.status !== "COMPLETED")
      ).length
    : 0

  const migration = useLocalMigration({
    userEmail,
    onSuccess: refreshItems,
  })

  return (
    <div className="space-y-6">
      {/* Local Migration Banner (shown if un-migrated local items exist) */}
      {migration.isEligible && (
        <LocalMigrationBanner
          count={migration.pendingCount}
          email={userEmail || ""}
          onMergeNow={migration.openMigration}
          onRemindLater={migration.handleDismiss}
        />
      )}

      {/* 0. Today & Weekly Progress Compass Card (includes inline energy selector) */}
      <TodayCompassCard
        items={items}
        dailyEnergy={dailyEnergy}
        dateStr={dateStr}
        initialEnergy={dailyEnergy}
        initialNote={dailyEnergyNote}
      />

      {/* Low / Rest energy mode banner */}
      {isLowEnergyMode && hiddenHabitsCount > 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
          <span className="text-base leading-none">
            {dailyEnergy === "REST" ? "☕" : "🌿"}
          </span>
          <span className="flex-1">
            {dailyEnergy === "REST"
              ? `休整模式 · 已为你收起 ${hiddenHabitsCount} 项非核心事务，专注休养`
              : `低能量模式 · 已为你收起 ${hiddenHabitsCount} 项，仅显示 P0 与戒断打卡`}
          </span>
          <Icons.down className="h-3 w-3 shrink-0 opacity-50" />
        </div>
      )}

      {/* 1. Category Filter Toolbar */}
      {categories.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setSelectedCategory("ALL")}
            className={cn(
              "rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors",
              selectedCategory === "ALL"
                ? "border-foreground bg-foreground text-background"
                : "border-border text-muted-foreground hover:bg-muted"
            )}
          >
            {dict.dashboard.categories.allCategories}
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.name)}
              className={cn(
                "flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors",
                selectedCategory === cat.name
                  ? "border-foreground bg-foreground text-background"
                  : "border-border text-muted-foreground hover:bg-muted"
              )}
            >
              {cat.colorCode && (
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: cat.colorCode }}
                />
              )}
              <span>{cat.name}</span>
            </button>
          ))}
          <button
            type="button"
            onClick={() => setCategoryModalOpen(true)}
            className="ml-1 text-[11px] text-muted-foreground/60 hover:text-muted-foreground"
          >
            <Icons.settings className="h-3 w-3" />
          </button>
        </div>
      )}

      {/* 2. Daily Routines — divider list */}
      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-xs font-medium text-muted-foreground">
            {secDict.habitsTitle}
            {activeHabits.length > 0 && (
              <span className="ml-1.5 font-normal opacity-60">
                ({activeHabits.length})
              </span>
            )}
          </h2>
        </div>

        {activeHabits.length === 0 ? (
          <div className="rounded-xl border border-dashed py-8 text-center text-xs text-muted-foreground">
            <p>{secDict.noHabits}</p>
          </div>
        ) : (
          <div className="rounded-xl border border-border/50 bg-card px-4">
            {/* Pending habits — full opacity, eye goes here first */}
            {pendingHabits.map((item) => (
              <HabitItem
                key={item.id}
                item={item}
                isLowEnergyMode={isLowEnergyMode}
                onOpenRecord={(item) => {
                  setRecordingItem(item)
                  setRecordModalOpen(true)
                }}
                onRefresh={refreshItems}
              />
            ))}

            {/* Divider between pending and done — only when both groups exist */}
            {pendingHabits.length > 0 && checkedHabits.length > 0 && (
              <div className="flex items-center gap-2 py-1">
                <div className="h-px flex-1 bg-border/40" />
                <span className="text-[10px] text-muted-foreground/40">
                  {checkedHabits.length === 1
                    ? "1 项已完成"
                    : `${checkedHabits.length} 项已完成`}
                </span>
                <div className="h-px flex-1 bg-border/40" />
              </div>
            )}

            {/* Checked-in habits — dimmed, sink to bottom */}
            {checkedHabits.map((item) => (
              <HabitItem
                key={item.id}
                item={item}
                isLowEnergyMode={isLowEnergyMode}
                isDimmed
                onOpenRecord={(item) => {
                  setRecordingItem(item)
                  setRecordModalOpen(true)
                }}
                onRefresh={refreshItems}
              />
            ))}
          </div>
        )}
      </section>

      {/* 3. Pending TODOs — divider list */}
      {pendingTodos.length > 0 && (
        <section>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-xs font-medium text-muted-foreground">
              {secDict.todosTitle}
              <span className="ml-1.5 font-normal opacity-60">
                ({pendingTodos.length})
              </span>
            </h2>
          </div>

          <div className="rounded-xl border border-border/50 bg-card px-4">
            {pendingTodos.map((item) => (
              <HabitItem
                key={item.id}
                item={item}
                isLowEnergyMode={isLowEnergyMode}
                onOpenRecord={(item) => {
                  setRecordingItem(item)
                  setRecordModalOpen(true)
                }}
                onRefresh={refreshItems}
              />
            ))}
          </div>
        </section>
      )}

      {/* 4. Completed TODOs — collapsible, auto-archived after 5 items */}
      {completedTodos.length > 0 && (
        <section>
          <button
            type="button"
            onClick={() => setCompletedTodosOpen(!completedTodosOpen)}
            className="flex w-full items-center gap-2 py-2 text-xs text-muted-foreground/60 transition-colors hover:text-muted-foreground"
          >
            <Icons.check className="h-3 w-3" />
            <span>
              {secDict.completedTodosTitle} ({completedTodos.length})
            </span>
            {archivedCompletedCount > 0 && !showAllCompleted && (
              <span className="text-[10px] text-muted-foreground/50 font-normal">
                {format(secDict.completedArchiveNotice, {
                  max: MAX_COMPLETED_TODOS,
                  archived: archivedCompletedCount,
                })}
              </span>
            )}
            <Icons.down
              className={cn(
                "ml-auto h-3 w-3 transition-transform",
                completedTodosOpen && "rotate-180"
              )}
            />
          </button>

          {completedTodosOpen && (
            <div className="space-y-2">
              <div className="rounded-xl border border-border/30 bg-card px-4 opacity-60">
                {visibleCompletedTodos.map((item) => (
                  <HabitItem
                    key={item.id}
                    item={item}
                    isLowEnergyMode={isLowEnergyMode}
                    onOpenRecord={(item) => {
                      setRecordingItem(item)
                      setRecordModalOpen(true)
                    }}
                    onRefresh={refreshItems}
                  />
                ))}
              </div>

              {/* Bottom bar: Inline expand/collapse + deep archive link */}
              <div className="flex flex-wrap items-center justify-between gap-2 px-1 pt-0.5 text-[11px] text-muted-foreground/60">
                {archivedCompletedCount > 0 ? (
                  <button
                    type="button"
                    onClick={() => setShowAllCompleted(!showAllCompleted)}
                    className="inline-flex items-center gap-1 rounded-md px-2.5 py-1 font-medium transition-colors hover:bg-muted/40 hover:text-foreground"
                  >
                    {showAllCompleted ? (
                      <>
                        <span>{secDict.collapseArchived}</span>
                        <Icons.up className="h-3 w-3" />
                      </>
                    ) : (
                      <>
                        <span>
                          {format(secDict.expandArchived, {
                            count: archivedCompletedCount,
                          })}
                        </span>
                        <Icons.down className="h-3 w-3" />
                      </>
                    )}
                  </button>
                ) : (
                  <div />
                )}

                <Link
                  href="/insights"
                  className="inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-muted-foreground/50 transition-colors hover:text-foreground hover:underline"
                >
                  <span>{secDict.viewHistoryArchive}</span>
                  <Icons.next className="h-3 w-3" />
                </Link>
              </div>
            </div>
          )}
        </section>
      )}

      {/* 6. Action & Energy Recording Modal */}
      <RecordActionModal
        item={recordingItem}
        open={recordModalOpen}
        onOpenChange={setRecordModalOpen}
        onSuccess={refreshItems}
      />

      {/* 7. Category Manager Modal */}
      <CategoryManagerModal
        open={categoryModalOpen}
        onOpenChange={setCategoryModalOpen}
        categories={categories}
        onRefresh={fetchCategories}
      />

      {/* 8. Local Data Migration & Conflict Resolution Dialog */}
      <LocalMigrationDialog
        open={migration.isModalOpen}
        onOpenChange={migration.setIsModalOpen}
        email={userEmail || ""}
        isAnalyzing={migration.isAnalyzing}
        isMerging={migration.isMerging}
        step={migration.step}
        migrationPlan={migration.migrationPlan}
        mergeStats={migration.mergeStats}
        onUpdateItemAction={migration.handleUpdateItemAction}
        onBatchResolve={migration.handleBatchResolution}
        onExecuteMerge={migration.handleExecuteMerge}
        onDismiss={migration.handleDismiss}
        onCleanLocalData={migration.handleCleanLocalData}
        onKeepLocalBackup={migration.handleKeepLocalBackup}
      />
    </div>
  )
}
