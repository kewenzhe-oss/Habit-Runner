"use client"

import * as React from "react"
import Link from "next/link"
import { EnergyLevel, TodayItemDTO } from "@/types"

import { isTodoCompleted, recommendForEnergy } from "@/lib/domain/dashboard"
import { sortWithinStatusGroup } from "@/lib/domain/item-order"
import { useI18n } from "@/lib/i18n"
import { cn } from "@/lib/utils"
import { useDashboardItems } from "@/hooks/use-dashboard-items"
import { useLocalMigration } from "@/hooks/use-local-migration"
import { Icons } from "@/components/icons"
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

const EMPTY_CATEGORIES: Category[] = []

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
  initialCategories = EMPTY_CATEGORIES,
  dailyEnergy,
  dailyEnergyNote,
  dateStr,
  userEmail,
}: HabitListProps) {
  const { dict, format } = useI18n()
  const secDict = dict.dashboard.sections
  const {
    items: savedItems,
    setItems,
    pendingIds,
    mutateItem,
  } = useDashboardItems(initialItems)
  const [energy, setEnergy] = React.useState(dailyEnergy)
  const [showAllEnergy, setShowAllEnergy] = React.useState(false)
  const items = React.useMemo(
    () =>
      savedItems.map((item) => recommendForEnergy(item, energy || "NORMAL")),
    [savedItems, energy]
  )
  const [categories, setCategories] =
    React.useState<Category[]>(initialCategories)
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
      const query = dateStr ? `?date=${encodeURIComponent(dateStr)}` : ""
      const res = await fetch(`/api/dashboard/today${query}`)
      if (res.ok) {
        const data = await res.json()
        setItems(data.items || [])
      }
    } catch (e) {
      console.error("Failed to refresh items", e)
    }
  }

  React.useEffect(() => {
    setCategories(initialCategories)
  }, [initialCategories])

  React.useEffect(() => {
    setEnergy(dailyEnergy)
  }, [dailyEnergy])

  const hasHabits = items.some(
    (item) => item.type === "HABIT" || item.type === "QUIT_HABIT"
  )

  // Low / Rest energy mode — only P0 + QUIT_HABIT survive
  const isLowEnergyMode = energy === "LOW" || energy === "REST"

  // Filter items by category
  const categoryFiltered = items.filter((item) => {
    if (selectedCategory !== "ALL") {
      const cat = item.customCategory || item.layer
      if (cat !== selectedCategory) return false
    }
    return true
  })

  // Energy gate: in Low/Rest mode keep only P0 habits and all QUIT_HABIT
  const energyFiltered =
    isLowEnergyMode && !showAllEnergy
      ? categoryFiltered.filter(
          (i) =>
            i.type === "QUIT_HABIT" ||
            (i.type === "HABIT" && i.priority === "HIGH")
        )
      : categoryFiltered

  // Separate Habits from TODOs, then split by check-in state
  const allHabits = sortWithinStatusGroup(
    energyFiltered.filter((i) => i.type === "HABIT" || i.type === "QUIT_HABIT")
  )
  // Pending habits float to top; checked-in (done / rest / lapsed) sink to bottom
  const pendingHabits = allHabits.filter((i) => !i.todayCheckIn)
  const checkedHabits = allHabits.filter((i) => !!i.todayCheckIn)
  // Combined ordered list used for the count badge
  const activeHabits = [...pendingHabits, ...checkedHabits]
  const pendingTodos = sortWithinStatusGroup(
    // TODOs: in low-energy mode, only P0 TODOs
    isLowEnergyMode && !showAllEnergy
      ? categoryFiltered.filter(
          (i) =>
            i.type === "TODO" && i.priority === "HIGH" && !isTodoCompleted(i)
        )
      : categoryFiltered.filter((i) => i.type === "TODO" && !isTodoCompleted(i))
  )
  // Sort completed TODOs by completion/updated date descending (newest completed first)
  const completedTodos = React.useMemo(() => {
    return categoryFiltered
      .filter((i) => i.type === "TODO" && isTodoCompleted(i))
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
  const archivedCompletedCount = Math.max(
    0,
    completedTodos.length - MAX_COMPLETED_TODOS
  )

  // Count hidden items in low-energy mode for the banner
  const hiddenHabitsCount = isLowEnergyMode
    ? categoryFiltered.filter(
        (i) =>
          (i.type === "HABIT" && i.priority !== "HIGH") ||
          (i.type === "TODO" && i.priority !== "HIGH" && !isTodoCompleted(i))
      ).length
    : 0

  const migration = useLocalMigration({
    userEmail,
    onSuccess: refreshItems,
  })

  return (
    <div className="space-y-5">
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
        dailyEnergy={energy}
        dateStr={dateStr}
        initialEnergy={energy}
        onEnergyChange={setEnergy}
        initialNote={dailyEnergyNote}
      />

      {/* Low / Rest energy mode banner */}
      {isLowEnergyMode && hiddenHabitsCount > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-sm text-amber-800 dark:text-amber-300">
          <span className="text-base leading-none">
            {energy === "REST" ? "☕" : "🌿"}
          </span>
          <span className="flex-1">
            {showAllEnergy
              ? dict.dashboard.actions.allEnergyNote
              : energy === "REST"
                ? format(dict.dashboard.actions.restEnergyNote, {
                    count: hiddenHabitsCount,
                  })
                : format(dict.dashboard.actions.lowEnergyNote, {
                    count: hiddenHabitsCount,
                  })}
          </span>
          <button
            type="button"
            onClick={() => setShowAllEnergy((value) => !value)}
            className="min-h-11 shrink-0 rounded-md px-2 text-sm font-medium underline underline-offset-4"
          >
            {showAllEnergy
              ? dict.dashboard.actions.showCore
              : dict.dashboard.actions.showAll}
          </button>
        </div>
      )}

      {/* 1. Category Filter Toolbar */}
      {categories.length > 0 && (
        <div className="flex min-w-0 items-center gap-2">
          <div
            role="group"
            aria-label={dict.dashboard.categories.allCategories}
            className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto py-1 [scrollbar-width:thin]"
          >
            <button
              type="button"
              onClick={() => setSelectedCategory("ALL")}
              aria-pressed={selectedCategory === "ALL"}
              className={cn(
                "min-h-11 shrink-0 whitespace-nowrap rounded-full border px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
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
                aria-pressed={selectedCategory === cat.name}
                className={cn(
                  "flex min-h-11 shrink-0 items-center gap-2 whitespace-nowrap rounded-full border px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
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
          </div>
          <button
            type="button"
            onClick={() => setCategoryModalOpen(true)}
            aria-label={dict.dashboard.actions.manageCategories}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border text-muted-foreground hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Icons.settings className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* 2. Daily Routines — divider list */}
      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">
            {secDict.habitsTitle}
            {activeHabits.length > 0 && (
              <span className="ml-1.5 font-normal text-muted-foreground">
                ({activeHabits.length})
              </span>
            )}
          </h2>
        </div>

        {activeHabits.length === 0 ? (
          <div className="rounded-xl border border-dashed py-8 text-center text-xs text-muted-foreground">
            <p className="text-sm">
              {hasHabits ? secDict.noMatchingHabits : secDict.noHabits}
            </p>
            {hasHabits ? (
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory("ALL")
                  setShowAllEnergy(true)
                }}
                className="mt-3 min-h-11 rounded-lg border px-4 py-2 text-sm font-medium"
              >
                {dict.dashboard.actions.resetFilters}
              </button>
            ) : null}
            <Link
              href="/items/new"
              className="mt-4 inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
            >
              <Icons.add className="h-4 w-4" />
              {dict.dashboard.actions.newAction}
            </Link>
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
                onMutate={mutateItem}
                isPending={pendingIds.has(item.id)}
                dateStr={dateStr}
              />
            ))}

            {/* Divider between pending and done — only when both groups exist */}
            {pendingHabits.length > 0 && checkedHabits.length > 0 && (
              <div className="flex items-center gap-2 py-1">
                <div className="h-px flex-1 bg-border/40" />
                <span className="text-xs text-muted-foreground">
                  {format(secDict.completedCount, {
                    count: checkedHabits.length,
                  })}
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
                onMutate={mutateItem}
                isPending={pendingIds.has(item.id)}
                dateStr={dateStr}
              />
            ))}
          </div>
        )}
      </section>

      {/* 3. Pending TODOs — divider list */}
      {pendingTodos.length > 0 && (
        <section>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">
              {secDict.todosTitle}
              <span className="ml-1.5 font-normal text-muted-foreground">
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
                onMutate={mutateItem}
                isPending={pendingIds.has(item.id)}
                dateStr={dateStr}
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
            aria-expanded={completedTodosOpen}
            className="flex min-h-11 w-full items-center gap-2 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <Icons.check className="h-3 w-3" />
            <span>
              {secDict.completedTodosTitle} ({completedTodos.length})
            </span>
            {archivedCompletedCount > 0 && !showAllCompleted && (
              <span className="text-xs font-normal text-muted-foreground">
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
              <div className="rounded-xl border border-border/30 bg-card px-4">
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
                    onMutate={mutateItem}
                    isPending={pendingIds.has(item.id)}
                    dateStr={dateStr}
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
        onMutate={mutateItem}
        dateStr={dateStr}
      />

      {/* 7. Category Manager Modal */}
      <CategoryManagerModal
        open={categoryModalOpen}
        onOpenChange={setCategoryModalOpen}
        categories={categories}
        onRefresh={() => {
          void Promise.all([fetchCategories(), refreshItems()])
        }}
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
