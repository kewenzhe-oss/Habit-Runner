"use client"

import * as React from "react"
import { TodayItemDTO } from "@/types"

import { cn } from "@/lib/utils"
import { useI18n } from "@/lib/i18n"
import { EmptyPlaceholder } from "@/components/empty-placeholder"
import { Icons } from "@/components/icons"

import { CategoryManagerModal } from "./category-manager-modal"
import { HabitItem } from "./habit-item"
import { QuickAddHabitModal } from "./quick-add-habit-modal"
import { RecordActionModal } from "./record-action-modal"
import { TodayCompassCard } from "./today-compass-card"
import { EnergyLevel } from "@/types"

interface Category {
  id: string
  name: string
  colorCode?: string | null
}

interface HabitListProps {
  initialItems: TodayItemDTO[]
  dailyEnergy?: EnergyLevel | null
  dailyEnergyNote?: string | null
  dateStr?: string
}

export function HabitList({ initialItems, dailyEnergy, dailyEnergyNote, dateStr }: HabitListProps) {
  const { dict, format } = useI18n()
  const secDict = dict.dashboard.sections
  const [items, setItems] = React.useState<TodayItemDTO[]>(initialItems)
  const [categories, setCategories] = React.useState<Category[]>([])
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
    fetchCategories()
  }, [])

  // Filter items by category
  const categoryFiltered = items.filter((item) => {
    if (selectedCategory !== "ALL") {
      const cat = item.customCategory || item.layer
      if (cat !== selectedCategory) return false
    }
    return true
  })

  // Separate Habits from TODOs
  const activeHabits = categoryFiltered.filter(
    (i) => i.type === "HABIT" || i.type === "QUIT_HABIT"
  )
  const pendingTodos = categoryFiltered.filter(
    (i) => i.type === "TODO" && i.status !== "COMPLETED"
  )
  const completedTodos = categoryFiltered.filter(
    (i) => i.type === "TODO" && i.status === "COMPLETED"
  )

  const habitsCount = items.filter((i) => i.type === "HABIT").length
  const quitsCount = items.filter((i) => i.type === "QUIT_HABIT").length
  const todosCount = items.filter(
    (i) => i.type === "TODO" && i.status !== "COMPLETED"
  ).length

  return (
    <div className="space-y-6">
      {/* 0. Today & Weekly Progress Compass Card (includes inline energy selector) */}
      <TodayCompassCard
        items={items}
        dailyEnergy={dailyEnergy}
        dateStr={dateStr}
        initialEnergy={dailyEnergy}
        initialNote={dailyEnergyNote}
      />

      {/* 1. Toolbar: Quick Add + Category Filter */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        {/* Category pills — only visible when there are named categories */}
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

        <div className="ml-auto">
          <QuickAddHabitModal onSuccess={refreshItems} />
        </div>
      </div>

      {/* 2. Daily Routines — divider list */}
      <section>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xs font-medium text-muted-foreground">
            {secDict.habitsTitle}
            {activeHabits.length > 0 && (
              <span className="ml-1.5 font-normal opacity-60">({activeHabits.length})</span>
            )}
          </h2>
        </div>

        {activeHabits.length === 0 ? (
          <div className="rounded-xl border border-dashed py-8 text-center text-xs text-muted-foreground">
            <p>{secDict.noHabits}</p>
          </div>
        ) : (
          <div className="rounded-xl border border-border/50 bg-card px-4">
            {activeHabits.map((item) => (
              <HabitItem
                key={item.id}
                item={item}
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
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xs font-medium text-muted-foreground">
              {secDict.todosTitle}
              <span className="ml-1.5 font-normal opacity-60">({pendingTodos.length})</span>
            </h2>
          </div>

          <div className="rounded-xl border border-border/50 bg-card px-4">
            {pendingTodos.map((item) => (
              <HabitItem
                key={item.id}
                item={item}
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

      {/* 4. Completed TODOs — collapsible, subtle */}
      {completedTodos.length > 0 && (
        <section>
          <button
            type="button"
            onClick={() => setCompletedTodosOpen(!completedTodosOpen)}
            className="flex w-full items-center gap-2 py-2 text-xs text-muted-foreground/60 transition-colors hover:text-muted-foreground"
          >
            <Icons.check className="h-3 w-3" />
            <span>{secDict.completedTodosTitle} ({completedTodos.length})</span>
            <Icons.down
              className={cn(
                "ml-auto h-3 w-3 transition-transform",
                completedTodosOpen && "rotate-180"
              )}
            />
          </button>

          {completedTodosOpen && (
            <div className="rounded-xl border border-border/30 bg-card px-4 opacity-60">
              {completedTodos.map((item) => (
                <HabitItem
                  key={item.id}
                  item={item}
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
    </div>
  )
}
