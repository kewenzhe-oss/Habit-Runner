"use client"

import * as React from "react"
import Link from "next/link"
import { Layer } from "@/types"

import { LAYER_LIST } from "@/config/layers"
import { cn } from "@/lib/utils"
import { useI18n } from "@/lib/i18n"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"
import { Icons } from "@/components/icons"

interface Category {
  id: string
  name: string
  colorCode?: string | null
}

export type HabitUnitType = "TIME" | "COUNT" | "BINARY"

interface QuickAddHabitModalProps {
  onSuccess: () => void
  trigger?: React.ReactNode
}

export function QuickAddHabitModal({
  onSuccess,
  trigger,
}: QuickAddHabitModalProps) {
  const { dict, locale } = useI18n()
  const [open, setOpen] = React.useState(false)
  const [type, setType] = React.useState<"HABIT" | "QUIT_HABIT" | "TODO">("HABIT")
  const [isLoading, setIsLoading] = React.useState(false)

  // 1. Core Quick Add Fields (Primary Visual Weight)
  const [title, setTitle] = React.useState("")
  const [unitType, setUnitType] = React.useState<HabitUnitType>("TIME")
  const [targetAmount, setTargetAmount] = React.useState<number>(20)
  const [dueDate, setDueDate] = React.useState("")
  const [selectedLayer, setSelectedLayer] = React.useState<Layer>("LIFE")

  // 2. Advanced / Optional Fields (Deferred to Collapsible Accordion or Advanced Page)
  const [whyPrompt, setWhyPrompt] = React.useState("")
  const [triggerCue, setTriggerCue] = React.useState("")
  const [targetFrequency, setTargetFrequency] = React.useState<
    "DAILY" | "WEEKDAYS" | "3_4_TIMES" | "WEEKENDS"
  >("DAILY")
  const [unitLabel, setUnitLabel] = React.useState("分钟")
  const [contextTags, setContextTags] = React.useState("")
  const [highRiskWindow, setHighRiskWindow] = React.useState("")
  const [todoRecurring, setTodoRecurring] = React.useState<
    "ONCE" | "WEEKLY" | "MONTHLY"
  >("ONCE")
  const [categories, setCategories] = React.useState<Category[]>([])
  const [selectedCategoryName, setSelectedCategoryName] = React.useState("")
  const [customCatInput, setCustomCatInput] = React.useState("")
  const [toolUrl, setToolUrl] = React.useState("")

  // Fetch categories when opening modal
  const fetchCategories = React.useCallback(async () => {
    try {
      const res = await fetch("/api/categories")
      if (res.ok) {
        const data = await res.json()
        setCategories(data)
        if (data.length > 0 && !selectedCategoryName) {
          setSelectedCategoryName(data[0].name)
        }
      }
    } catch (e) {
      console.error("Failed to load categories", e)
    }
  }, [selectedCategoryName])

  React.useEffect(() => {
    if (open) {
      fetchCategories()
    }
  }, [fetchCategories, open])

  // Reset form state
  const resetForm = () => {
    setTitle("")
    setWhyPrompt("")
    setSelectedLayer("LIFE")
    setSelectedCategoryName(categories[0]?.name || "")
    setCustomCatInput("")
    setToolUrl("")
    setTriggerCue("")
    setTargetFrequency("DAILY")
    setUnitType("TIME")
    setTargetAmount(20)
    setUnitLabel("分钟")
    setContextTags("")
    setHighRiskWindow("")
    setDueDate("")
    setTodoRecurring("ONCE")
  }

  // Quick Date presets for Todo
  const setQuickDate = (daysFromToday: number) => {
    const d = new Date()
    d.setDate(d.getDate() + daysFromToday)
    setDueDate(d.toISOString().split("T")[0])
  }

  // Handle Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) {
      return toast({
        title: dict.common.notifications.titleRequired,
        variant: "destructive",
      })
    }

    if (
      type === "HABIT" &&
      unitType !== "BINARY" &&
      (!targetAmount || targetAmount <= 0)
    ) {
      return toast({
        title: locale === "zh" ? "请填写有效的目标量数值" : "Please enter a valid target amount",
        variant: "destructive",
      })
    }

    if (toolUrl.trim() && !toolUrl.startsWith("https://")) {
      return toast({
        title: locale === "zh" ? "关联工具网址必须以 https:// 开头" : "Tool URL must start with https://",
        variant: "destructive",
      })
    }

    setIsLoading(true)
    try {
      // Determine final category
      const finalCat =
        customCatInput.trim() || selectedCategoryName.trim() || (locale === "zh" ? "生活日常" : "Daily Life")
      let categoryId = categories.find(
        (category) => category.name === finalCat
      )?.id

      if (customCatInput.trim()) {
        try {
          const categoryResponse = await fetch("/api/categories", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: customCatInput.trim() }),
          })
          if (categoryResponse.ok) {
            const category = await categoryResponse.json()
            categoryId = category.id
          }
        } catch (e) {
          // Non-blocking
        }
      }

      // Base payload
      const payload: any = {
        title: title.trim(),
        whyPrompt: whyPrompt.trim() || undefined,
        type,
        layer: selectedLayer,
        customCategory: finalCat,
        categoryId,
        colorCode:
          type === "QUIT_HABIT"
            ? "#EA580C"
            : type === "TODO"
              ? "#2563EB"
              : "#10B981",
      }

      // Type-specific field mapping & preset generation
      if (type === "HABIT") {
        const freqMap: Record<string, { days: string; target: number }> = {
          DAILY: { days: "0,1,2,3,4,5,6", target: 7 },
          WEEKDAYS: { days: "1,2,3,4,5", target: 5 },
          "3_4_TIMES": { days: "3_4_DAYS", target: 4 },
          WEEKENDS: { days: "0,6", target: 2 },
        }
        const freqConfig = freqMap[targetFrequency] || freqMap.DAILY
        payload.frequencyDays = freqConfig.days
        payload.targetPerWeek = freqConfig.target
        payload.triggerCue = triggerCue.trim() || null

        // Direct DB Columns
        payload.unitType = unitType
        payload.targetAmount =
          unitType === "BINARY" ? null : Number(targetAmount) || 1
        payload.unitLabel =
          unitType === "BINARY"
            ? null
            : unitLabel.trim() || (unitType === "TIME" ? "分钟" : "个")

        const triggerPrefix = triggerCue.trim()
          ? `[触发：${triggerCue.trim()}] `
          : ""

        const effectiveUnitLabel = payload.unitLabel || (unitType === "TIME" ? "分钟" : "个")
        const unitConfig = {
          unitType,
          targetAmount: payload.targetAmount,
          unitLabel: effectiveUnitLabel,
        }
        const unitMetaStr = JSON.stringify(unitConfig)

        const highTarget =
          unitType === "BINARY"
            ? "深度完成"
            : `${Math.round((targetAmount || 20) * 1.2)} ${effectiveUnitLabel}`
        const normalTarget =
          unitType === "BINARY"
            ? "标准完成"
            : `${targetAmount || 20} ${effectiveUnitLabel}`
        const lowTarget =
          unitType === "BINARY"
            ? "3分钟微行动"
            : `${Math.max(1, Math.round((targetAmount || 20) * 0.3))} ${effectiveUnitLabel}`

        payload.actionPresets = [
          {
            energyLevel: "HIGH",
            actionText: `${triggerPrefix}充沛推进：${title.trim()} (${highTarget})`,
            description: unitMetaStr,
          },
          {
            energyLevel: "NORMAL",
            actionText: `${triggerPrefix}标准执行：${title.trim()} (${normalTarget})`,
            description: unitMetaStr,
          },
          {
            energyLevel: "LOW",
            actionText: `微小连接：${title.trim()} (${lowTarget})`,
            description: unitMetaStr,
          },
          {
            energyLevel: "REST",
            actionText: "有意识休整恢复与蓄能",
            description: unitMetaStr,
          },
        ]
      } else if (type === "QUIT_HABIT") {
        payload.quitContext = contextTags.trim() || null
        payload.highRiskWindow = highRiskWindow.trim() || null
        const contextDesc = contextTags.trim()
          ? `情境诱因：${contextTags.trim()}`
          : ""
        const windowDesc = highRiskWindow.trim()
          ? `高风险时段：${highRiskWindow.trim()}`
          : ""

        payload.actionPresets = [
          { energyLevel: "HIGH", actionText: "全天平稳自律，无冲动发生" },
          {
            energyLevel: "NORMAL",
            actionText: windowDesc
              ? `重点注意 ${windowDesc}`
              : "识别诱因并主动远离",
          },
          {
            energyLevel: "LOW",
            actionText: contextDesc
              ? `在 ${contextDesc} 中保持觉察与停顿`
              : "觉察当下冲动，深呼吸暂停",
          },
          { energyLevel: "REST", actionText: "身心放松与主动减压" },
        ]
      } else if (type === "TODO") {
        payload.dueDate = dueDate || undefined
        payload.todoRecurrence = todoRecurring
      }

      if (toolUrl.trim()) {
        payload.toolLinks = [{ title: "打开关联工具", url: toolUrl.trim() }]
      }

      const res = await fetch("/api/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!res.ok) throw new Error(dict.common.notifications.saveFailed)

      toast({
        title: locale === "zh" ? "已创建新事项" : "Item Created",
        description: `“${title.trim()}” ${locale === "zh" ? "已加入你的行动列表。" : "has been added to your actions."}`,
      })

      resetForm()
      setOpen(false)
      onSuccess()
    } catch (err: any) {
      toast({
        title: dict.common.notifications.saveFailed,
        description: err.message,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button size="sm" className="gap-1.5 shadow-sm">
            <Icons.add className="h-4 w-4" />
            <span>{dict.nav.actions.addItem}</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-[460px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader className="space-y-1 pb-2">
            <DialogTitle className="text-base font-bold">
              {dict.form.fields.quickAddTitle}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {dict.form.fields.quickAddSubtitle}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 py-2">
            {/* 1. Item Type Selector (Compact Segmented Controls) */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">
                {dict.form.fields.itemType}
              </Label>
              <div className="grid grid-cols-3 gap-1.5 rounded-lg border bg-muted/30 p-1">
                <button
                  type="button"
                  onClick={() => setType("HABIT")}
                  className={cn(
                    "flex items-center justify-center gap-1.5 rounded-md py-2 text-xs font-semibold transition-all",
                    type === "HABIT"
                      ? "border border-emerald-500/40 bg-background text-emerald-800 shadow-xs ring-1 ring-emerald-500/30 dark:text-emerald-300"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icons.habit className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>{dict.form.types.habit.title}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setType("QUIT_HABIT")}
                  className={cn(
                    "flex items-center justify-center gap-1.5 rounded-md py-2 text-xs font-semibold transition-all",
                    type === "QUIT_HABIT"
                      ? "border border-amber-500/40 bg-background text-amber-800 shadow-xs ring-1 ring-amber-500/30 dark:text-amber-300"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icons.quitHabit className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                  <span>{dict.form.types.quitHabit.title}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setType("TODO")}
                  className={cn(
                    "flex items-center justify-center gap-1.5 rounded-md py-2 text-xs font-semibold transition-all",
                    type === "TODO"
                      ? "border border-blue-500/40 bg-background text-blue-800 shadow-xs ring-1 ring-blue-500/30 dark:text-blue-300"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icons.todo className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                  <span>{dict.form.types.todo.title}</span>
                </button>
              </div>
            </div>

            {/* 2. Title Input (Primary Focus) */}
            <div className="space-y-1.5">
              <Label htmlFor="quick-item-title" className="text-xs font-semibold text-foreground">
                {type === "HABIT"
                  ? dict.form.fields.habitName
                  : type === "QUIT_HABIT"
                    ? dict.form.fields.quitName
                    : dict.form.fields.todoName}
              </Label>
              <Input
                id="quick-item-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={
                  type === "HABIT"
                    ? dict.form.fields.habitPlaceholder
                    : type === "QUIT_HABIT"
                      ? dict.form.fields.quitPlaceholder
                      : dict.form.fields.todoPlaceholder
                }
                autoFocus
                className="text-xs"
              />
            </div>

            {/* 3. TYPE-SPECIFIC MINIMUM FIELDS */}

            {/* A. HABIT: Unit Type + Target Amount */}
            {type === "HABIT" && (
              <div className="space-y-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold text-emerald-950 dark:text-emerald-200">
                    {dict.form.fields.unitTypeTitle}
                  </Label>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { id: "TIME", label: dict.form.fields.unitTypeTime },
                    { id: "COUNT", label: dict.form.fields.unitTypeCount },
                    { id: "BINARY", label: dict.form.fields.unitTypeBinary },
                  ].map((u) => (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => {
                        setUnitType(u.id as HabitUnitType)
                        if (u.id === "TIME") setUnitLabel("分钟")
                        if (u.id === "COUNT") setUnitLabel("个")
                      }}
                      className={cn(
                        "rounded-md border py-1.5 text-center text-xs font-medium transition-all",
                        unitType === u.id
                          ? "border-emerald-600 bg-emerald-600 font-semibold text-white shadow-xs"
                          : "border-border bg-background text-muted-foreground hover:bg-muted"
                      )}
                    >
                      {u.label}
                    </button>
                  ))}
                </div>

                {/* Target Amount Row for Time/Count */}
                {unitType !== "BINARY" && (
                  <div className="flex items-center gap-2 pt-1">
                    <Label
                      htmlFor="quick-target-amount"
                      className="whitespace-nowrap text-xs font-semibold text-emerald-950 dark:text-emerald-200"
                    >
                      {dict.form.fields.targetAmount}
                    </Label>
                    <div className="relative flex-1">
                      <Input
                        id="quick-target-amount"
                        type="number"
                        min="1"
                        value={targetAmount}
                        onChange={(e) =>
                          setTargetAmount(Number(e.target.value) || 0)
                        }
                        className="h-8 bg-background pr-12 text-xs font-semibold"
                      />
                      <span className="absolute right-2.5 top-1.5 text-xs text-muted-foreground">
                        {unitType === "TIME" ? (locale === "zh" ? "分钟" : "mins") : (locale === "zh" ? "个" : "items")}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* B. TODO: Due Date + Quick Presets */}
            {type === "TODO" && (
              <div className="space-y-2 rounded-lg border border-blue-500/20 bg-blue-500/5 p-3">
                <div className="flex items-center justify-between">
                  <Label
                    htmlFor="quick-due-date"
                    className="text-xs font-semibold text-blue-950 dark:text-blue-200"
                  >
                    {dict.form.fields.dueDate}
                  </Label>
                </div>
                <Input
                  id="quick-due-date"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="h-8 bg-background text-xs"
                />
                <div className="flex flex-wrap gap-1 pt-0.5">
                  <button
                    type="button"
                    onClick={() => setQuickDate(0)}
                    className="rounded bg-blue-500/15 px-2 py-0.5 text-[10px] font-medium text-blue-900 transition-colors hover:bg-blue-500/25 dark:text-blue-200"
                  >
                    {dict.form.fields.quickToday}
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickDate(1)}
                    className="rounded bg-blue-500/15 px-2 py-0.5 text-[10px] font-medium text-blue-900 transition-colors hover:bg-blue-500/25 dark:text-blue-200"
                  >
                    {dict.form.fields.quickTomorrow}
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickDate(3)}
                    className="rounded bg-blue-500/15 px-2 py-0.5 text-[10px] font-medium text-blue-900 transition-colors hover:bg-blue-500/25 dark:text-blue-200"
                  >
                    {dict.form.fields.quick3Days}
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickDate(7)}
                    className="rounded bg-blue-500/15 px-2 py-0.5 text-[10px] font-medium text-blue-900 transition-colors hover:bg-blue-500/25 dark:text-blue-200"
                  >
                    {dict.form.fields.quick1Week}
                  </button>
                </div>
              </div>
            )}

            {/* 4. Life Layer (Optional, De-emphasized Compact Selector) */}
            <div className="space-y-1.5 pt-0.5">
              <div className="flex items-center justify-between text-xs">
                <Label className="font-normal text-muted-foreground">
                  {dict.form.fields.layerTitle}
                </Label>
                <span className="text-[10px] text-muted-foreground/70">
                  {dict.form.fields.optionalTag}
                </span>
              </div>
              <div className="flex flex-wrap gap-1">
                {LAYER_LIST.map((l) => (
                  <button
                    key={l.key}
                    type="button"
                    onClick={() => setSelectedLayer(l.key as Layer)}
                    className={cn(
                      "flex items-center gap-1 rounded-md border px-2 py-1 text-[10px] font-medium transition-colors",
                      selectedLayer === l.key
                        ? "border-primary bg-primary/10 font-semibold text-primary ring-1 ring-primary/40"
                        : "border-border/70 bg-background text-muted-foreground hover:bg-muted"
                    )}
                  >
                    <span
                      className="h-1.5 w-1.5 shrink-0 rounded-full"
                      style={{ backgroundColor: l.color }}
                    />
                    <span>{locale === "zh" ? l.zhLabel : l.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 5. ADVANCED / OPTIONAL SECTION (Collapsed Accordion) */}
            <details className="group rounded-lg border border-border/70 bg-muted/15 text-xs transition-all">
              <summary className="flex cursor-pointer list-none items-center justify-between px-3 py-2 font-medium text-muted-foreground transition-colors hover:text-foreground">
                <div className="flex items-center gap-1.5">
                  <Icons.settings className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>{dict.form.fields.moreOptionsTitle}</span>
                </div>
                <Icons.next className="h-3.5 w-3.5 transition-transform duration-200 group-open:rotate-90" />
              </summary>

              <div className="space-y-3 border-t border-border/50 p-3 pt-2.5">
                {/* Motivation / Why Prompt */}
                <div className="space-y-1">
                  <Label htmlFor="advanced-why" className="text-[11px] font-medium text-foreground">
                    {dict.form.fields.whyTitle}
                  </Label>
                  <Input
                    id="advanced-why"
                    value={whyPrompt}
                    onChange={(e) => setWhyPrompt(e.target.value)}
                    placeholder={
                      type === "HABIT"
                        ? dict.form.fields.whyHabitPlaceholder
                        : dict.form.fields.whyQuitPlaceholder
                    }
                    className="h-8 text-xs"
                  />
                </div>

                {/* HABIT Specific Advanced Options */}
                {type === "HABIT" && (
                  <>
                    <div className="space-y-1">
                      <Label htmlFor="advanced-trigger" className="text-[11px] font-medium text-foreground">
                        {dict.form.fields.triggerTitle}
                      </Label>
                      <Input
                        id="advanced-trigger"
                        value={triggerCue}
                        onChange={(e) => setTriggerCue(e.target.value)}
                        placeholder={dict.form.fields.triggerPlaceholder}
                        className="h-8 text-xs"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-[11px] font-medium text-foreground">
                        {dict.form.fields.freqTitle}
                      </Label>
                      <div className="grid grid-cols-4 gap-1">
                        {[
                          { id: "DAILY", label: dict.form.fields.freqDaily },
                          { id: "WEEKDAYS", label: dict.form.fields.freqWeekdays },
                          { id: "3_4_TIMES", label: dict.form.fields.freqTimes },
                          { id: "WEEKENDS", label: dict.form.fields.freqWeekends },
                        ].map((f) => (
                          <button
                            key={f.id}
                            type="button"
                            onClick={() => setTargetFrequency(f.id as any)}
                            className={cn(
                              "rounded border px-1 py-1 text-center text-[10px] font-medium transition-all",
                              targetFrequency === f.id
                                ? "border-primary bg-primary font-semibold text-primary-foreground"
                                : "border-border bg-background text-muted-foreground hover:bg-muted"
                            )}
                          >
                            {f.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {unitType !== "BINARY" && (
                      <div className="space-y-1">
                        <Label htmlFor="advanced-unit-label" className="text-[11px] font-medium text-foreground">
                          {dict.form.fields.unitLabel}
                        </Label>
                        <Input
                          id="advanced-unit-label"
                          value={unitLabel}
                          onChange={(e) => setUnitLabel(e.target.value)}
                          placeholder={
                            unitType === "TIME"
                              ? dict.form.fields.unitLabelTimePlaceholder
                              : dict.form.fields.unitLabelCountPlaceholder
                          }
                          className="h-8 text-xs"
                        />
                      </div>
                    )}
                  </>
                )}

                {/* QUIT_HABIT Specific Advanced Options */}
                {type === "QUIT_HABIT" && (
                  <>
                    <div className="space-y-1">
                      <Label htmlFor="advanced-context-tags" className="text-[11px] font-medium text-foreground">
                        {dict.form.fields.quitContextTitle}
                      </Label>
                      <Input
                        id="advanced-context-tags"
                        value={contextTags}
                        onChange={(e) => setContextTags(e.target.value)}
                        placeholder={dict.form.fields.quitContextPlaceholder}
                        className="h-8 text-xs"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="advanced-risk-window" className="text-[11px] font-medium text-foreground">
                        {dict.form.fields.quitRiskWindowTitle}
                      </Label>
                      <Input
                        id="advanced-risk-window"
                        value={highRiskWindow}
                        onChange={(e) => setHighRiskWindow(e.target.value)}
                        placeholder={dict.form.fields.quitRiskWindowPlaceholder}
                        className="h-8 text-xs"
                      />
                    </div>
                  </>
                )}

                {/* TODO Specific Advanced Options */}
                {type === "TODO" && (
                  <div className="space-y-1">
                    <Label className="text-[11px] font-medium text-foreground">
                      {dict.form.fields.todoRecurring}
                    </Label>
                    <div className="grid grid-cols-3 gap-1">
                      {[
                        { id: "ONCE", label: dict.form.fields.recurOnce },
                        { id: "WEEKLY", label: dict.form.fields.recurWeekly },
                        { id: "MONTHLY", label: dict.form.fields.recurMonthly },
                      ].map((r) => (
                        <button
                          key={r.id}
                          type="button"
                          onClick={() => setTodoRecurring(r.id as any)}
                          className={cn(
                            "rounded border px-2 py-1 text-center text-[10px] font-medium transition-all",
                            todoRecurring === r.id
                              ? "border-primary bg-primary font-semibold text-primary-foreground"
                              : "border-border bg-background text-muted-foreground hover:bg-muted"
                          )}
                        >
                          {r.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Category Selection */}
                <div className="space-y-1">
                  <Label className="text-[11px] font-medium text-foreground">
                    {dict.form.fields.customCategoryTitle}
                  </Label>
                  {categories.length > 0 && (
                    <div className="flex flex-wrap gap-1 pb-1">
                      {categories.map((cat) => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => {
                            setSelectedCategoryName(cat.name)
                            setCustomCatInput("")
                          }}
                          className={cn(
                            "rounded-md border px-2 py-0.5 text-[10px] transition-colors",
                            selectedCategoryName === cat.name && !customCatInput
                              ? "border-primary bg-primary font-semibold text-primary-foreground"
                              : "border-border bg-background text-muted-foreground hover:bg-muted"
                          )}
                        >
                          {cat.name}
                        </button>
                      ))}
                    </div>
                  )}
                  <Input
                    value={customCatInput}
                    onChange={(e) => setCustomCatInput(e.target.value)}
                    placeholder={dict.form.fields.customCategoryPlaceholder}
                    className="h-8 text-xs"
                  />
                </div>

                {/* Tool URL */}
                <div className="space-y-1">
                  <Label htmlFor="advanced-tool-url" className="text-[11px] font-medium text-foreground">
                    {dict.form.fields.toolUrlTitle}
                  </Label>
                  <Input
                    id="advanced-tool-url"
                    value={toolUrl}
                    onChange={(e) => setToolUrl(e.target.value)}
                    placeholder={dict.form.fields.toolUrlPlaceholder}
                    className="h-8 text-xs"
                  />
                </div>
              </div>
            </details>
          </div>

          <DialogFooter className="flex flex-row items-center justify-between border-t pt-3">
            <Link
              href="/items/new"
              onClick={() => setOpen(false)}
              className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              {dict.form.fields.linkAdvancedPage}
            </Link>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setOpen(false)}
                disabled={isLoading}
              >
                {dict.common.actions.cancel}
              </Button>
              <Button type="submit" size="sm" disabled={isLoading}>
                {isLoading && (
                  <Icons.spinner className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                )}
                <span>{dict.form.fields.saveImmediate}</span>
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
