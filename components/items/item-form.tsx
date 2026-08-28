"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { ItemDetailDTO, Layer } from "@/types"

import { LAYER_LIST } from "@/config/layers"
import { getDefaultDomainExample } from "@/lib/defaultDomainExamples"
import { useI18n } from "@/lib/i18n"
import {
  clearPendingNewItem,
  PendingNewItemPayload,
} from "@/lib/pending-new-item"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"
import { Icons } from "@/components/icons"
import { RecommendedToolUrlField } from "@/components/items/recommended-tool-url-field"

interface Category {
  id: string
  name: string
}

export type HabitUnitType = "TIME" | "COUNT" | "BINARY"

interface ItemFormProps {
  initialDraft?: PendingNewItemPayload
  initialItem?: ItemDetailDTO
  mode: "create" | "edit"
}

function frequencyFromDays(frequencyDays?: string | null) {
  if (frequencyDays === "1,2,3,4,5") return "WEEKDAYS" as const
  if (frequencyDays === "3_4_DAYS") return "3_4_TIMES" as const
  if (frequencyDays === "0,6") return "WEEKENDS" as const
  return "DAILY" as const
}

export function ItemForm({ initialDraft, initialItem, mode }: ItemFormProps) {
  const router = useRouter()
  const { dict } = useI18n()
  const [type, setType] = React.useState<"HABIT" | "QUIT_HABIT" | "TODO">(
    initialItem?.type || initialDraft?.type || "HABIT"
  )
  const [isLoading, setIsLoading] = React.useState(false)

  // 1. Shared Fields
  const [title, setTitle] = React.useState(
    initialItem?.title || initialDraft?.title || ""
  )
  const [whyPrompt, setWhyPrompt] = React.useState(
    initialItem?.whyPrompt || initialDraft?.whyPrompt || ""
  )
  const [layer, setLayer] = React.useState<Layer>(
    initialItem?.layer || initialDraft?.layer || "LIFE"
  )
  const [categories, setCategories] = React.useState<Category[]>([])
  const [selectedCategoryName, setSelectedCategoryName] = React.useState(
    initialItem?.customCategory || initialDraft?.customCategory || ""
  )
  const [customCatInput, setCustomCatInput] = React.useState("")
  const [toolUrl, setToolUrl] = React.useState(
    initialItem?.toolLinks?.[0]?.url || initialDraft?.toolLinks?.[0]?.url || ""
  )

  // 2. Positive Habit (HABIT) Specific Fields
  const [triggerCue, setTriggerCue] = React.useState(
    initialItem?.triggerCue || initialDraft?.triggerCue || ""
  )
  const [targetFrequency, setTargetFrequency] = React.useState<
    "DAILY" | "WEEKDAYS" | "3_4_TIMES" | "WEEKENDS"
  >(() => {
    return frequencyFromDays(
      initialItem?.frequencyDays || initialDraft?.frequencyDays
    )
  })

  // Inferred unit type from DB or presets
  const initialUnitConfig = React.useMemo(() => {
    const source = initialItem || initialDraft
    if (source?.unitType) {
      return {
        unitType: source.unitType as HabitUnitType,
        targetAmount:
          source.targetAmount || (source.unitType === "BINARY" ? 1 : 20),
        unitLabel:
          source.unitLabel || (source.unitType === "TIME" ? "分钟" : "个"),
      }
    }
    const normalPreset = source?.actionPresets?.find(
      (p) => p.energyLevel === "NORMAL"
    )
    if (normalPreset?.description) {
      try {
        const parsed = JSON.parse(normalPreset.description)
        if (parsed.unitType) return parsed
      } catch (e) {
        // ignore
      }
    }
    return {
      unitType: "TIME" as HabitUnitType,
      targetAmount: 20,
      unitLabel: "分钟",
    }
  }, [initialDraft, initialItem])

  const [unitType, setUnitType] = React.useState<HabitUnitType>(
    initialUnitConfig.unitType
  )
  const [targetAmount, setTargetAmount] = React.useState<number>(
    initialUnitConfig.targetAmount
  )
  const [unitLabel, setUnitLabel] = React.useState(initialUnitConfig.unitLabel)

  // 3. Quit Habit (QUIT_HABIT) Specific Fields
  const [contextTags, setContextTags] = React.useState(
    initialItem?.quitContext || initialDraft?.quitContext || ""
  )
  const [highRiskWindow, setHighRiskWindow] = React.useState(
    initialItem?.highRiskWindow || initialDraft?.highRiskWindow || ""
  )

  // 4. Todo (TODO) Specific Fields
  const [dueDate, setDueDate] = React.useState(
    initialItem?.dueDate || initialDraft?.dueDate || ""
  )
  const [todoRecurring, setTodoRecurring] = React.useState<
    "ONCE" | "WEEKLY" | "MONTHLY"
  >(
    (initialItem?.todoRecurrence as "ONCE" | "WEEKLY" | "MONTHLY") ||
      initialDraft?.todoRecurrence ||
      "ONCE"
  )

  // Load Categories
  React.useEffect(() => {
    fetch("/api/categories")
      .then((res) => res.json())
      .then((data) => {
        setCategories(data)
        if (data.length > 0 && !selectedCategoryName && mode === "create") {
          setSelectedCategoryName(data[0].name)
        }
      })
      .catch((e) => console.error("Failed to load categories", e))
  }, [mode, selectedCategoryName])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) {
      return toast({ title: "请填写事项名称", variant: "destructive" })
    }

    if (
      type === "HABIT" &&
      unitType !== "BINARY" &&
      (!targetAmount || targetAmount <= 0)
    ) {
      return toast({
        title: "请填写有效的目标量数值",
        variant: "destructive",
      })
    }

    if (toolUrl.trim() && !toolUrl.startsWith("https://")) {
      return toast({
        title: "关联工具网址必须以 https:// 开头",
        variant: "destructive",
      })
    }

    setIsLoading(true)
    try {
      const finalCat =
        customCatInput.trim() || selectedCategoryName.trim() || "生活日常"
      let categoryId = categories.find((c) => c.name === finalCat)?.id

      if (customCatInput.trim()) {
        try {
          const res = await fetch("/api/categories", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: customCatInput.trim() }),
          })
          if (res.ok) {
            const cat = await res.json()
            categoryId = cat.id
          }
        } catch (e) {
          // ignore
        }
      }

      const payload: any = {
        title: title.trim(),
        whyPrompt: whyPrompt.trim() || undefined,
        type,
        layer,
        customCategory: finalCat,
        categoryId,
        colorCode:
          type === "QUIT_HABIT"
            ? "#EA580C"
            : type === "TODO"
              ? "#2563EB"
              : "#10B981",
      }

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

        // Dedicated DB Columns
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

        const unitConfig = {
          unitType,
          targetAmount: payload.targetAmount,
          unitLabel: payload.unitLabel,
        }
        const unitMetaStr = JSON.stringify(unitConfig)

        const highTarget =
          unitType === "BINARY"
            ? "深度完成"
            : `${Math.round((targetAmount || 20) * 1.2)} ${unitLabel}`
        const normalTarget =
          unitType === "BINARY"
            ? "标准完成"
            : `${targetAmount || 20} ${unitLabel}`
        const lowTarget =
          unitType === "BINARY"
            ? "3分钟微行动"
            : `${Math.max(1, Math.round((targetAmount || 20) * 0.3))} ${unitLabel}`

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

      const endpoint =
        mode === "edit" ? `/api/items/${initialItem?.id}` : "/api/items"
      const httpMethod = mode === "edit" ? "PATCH" : "POST"

      const res = await fetch(endpoint, {
        method: httpMethod,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!res.ok) throw new Error(dict.common.notifications.saveFailed)

      toast({
        title: mode === "edit" ? "事项设置已更新" : "新事项已创建",
        description: `“${title.trim()}” 已成功保存。`,
      })

      if (mode === "create") clearPendingNewItem()
      router.push("/dashboard")
      router.refresh()
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
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>
            {mode === "create"
              ? dict.item.newPage.title
              : dict.item.editPage.title}
          </CardTitle>
          <CardDescription>
            {mode === "create"
              ? dict.item.newPage.description
              : dict.item.editPage.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Item Type Selector */}
          <div className="space-y-1">
            <Label className="text-xs font-semibold">
              {dict.form.fields.itemType}
            </Label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setType("HABIT")}
                className={cn(
                  "rounded-lg border p-3 text-center text-xs font-semibold transition-all",
                  type === "HABIT"
                    ? "border-emerald-500 bg-emerald-500/10 text-emerald-800 ring-1 ring-emerald-500 dark:text-emerald-300"
                    : "border-border text-muted-foreground hover:bg-muted"
                )}
              >
                <div className="flex items-center justify-center gap-1.5">
                  <Icons.habit className="h-4 w-4" />
                  <span>{dict.form.types.habit.title}</span>
                </div>
                <span className="mt-0.5 block text-[10px] font-normal opacity-75">
                  {dict.form.types.habit.sub}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setType("QUIT_HABIT")}
                className={cn(
                  "rounded-lg border p-3 text-center text-xs font-semibold transition-all",
                  type === "QUIT_HABIT"
                    ? "border-amber-500 bg-amber-500/10 text-amber-800 ring-1 ring-amber-500 dark:text-amber-300"
                    : "border-border text-muted-foreground hover:bg-muted"
                )}
              >
                <div className="flex items-center justify-center gap-1.5">
                  <Icons.quitHabit className="h-4 w-4" />
                  <span>{dict.form.types.quitHabit.title}</span>
                </div>
                <span className="mt-0.5 block text-[10px] font-normal opacity-75">
                  {dict.form.types.quitHabit.sub}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setType("TODO")}
                className={cn(
                  "rounded-lg border p-3 text-center text-xs font-semibold transition-all",
                  type === "TODO"
                    ? "border-blue-500 bg-blue-500/10 text-blue-800 ring-1 ring-blue-500 dark:text-blue-300"
                    : "border-border text-muted-foreground hover:bg-muted"
                )}
              >
                <div className="flex items-center justify-center gap-1.5">
                  <Icons.todo className="h-4 w-4" />
                  <span>{dict.form.types.todo.title}</span>
                </div>
                <span className="mt-0.5 block text-[10px] font-normal opacity-75">
                  {dict.form.types.todo.sub}
                </span>
              </button>
            </div>
          </div>

          {/* Title */}
          <div className="space-y-1">
            <Label htmlFor="item-title" className="text-xs font-semibold">
              {type === "HABIT"
                ? dict.form.fields.habitName
                : type === "QUIT_HABIT"
                  ? dict.form.fields.quitName
                  : dict.form.fields.todoName}
            </Label>
            <Input
              id="item-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={
                type === "HABIT"
                  ? dict.form.fields.habitPlaceholder
                  : type === "QUIT_HABIT"
                    ? dict.form.fields.quitPlaceholder
                    : dict.form.fields.todoPlaceholder
              }
              className="text-xs"
            />
          </div>

          {/* 这是为了什么（可选） */}
          {type !== "TODO" && (
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label htmlFor="item-why" className="text-xs font-semibold">
                  {dict.form.fields.whyTitle}
                </Label>
                <span className="text-[10px] text-muted-foreground">
                  {dict.form.fields.whyTag}
                </span>
              </div>
              <Input
                id="item-why"
                value={whyPrompt}
                onChange={(e) => setWhyPrompt(e.target.value)}
                placeholder={
                  type === "HABIT"
                    ? dict.form.fields.whyHabitPlaceholder
                    : dict.form.fields.whyQuitPlaceholder
                }
                className="text-xs"
              />
            </div>
          )}

          {/* POSITIVE HABIT FIELDS */}
          {type === "HABIT" && (
            <div className="space-y-3 rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label
                    htmlFor="item-trigger"
                    className="text-xs font-semibold text-emerald-900 dark:text-emerald-200"
                  >
                    {dict.form.fields.triggerTitle}
                  </Label>
                  <span className="text-[10px] text-muted-foreground">
                    {dict.form.fields.triggerTag}
                  </span>
                </div>
                <Input
                  id="item-trigger"
                  value={triggerCue}
                  onChange={(e) => setTriggerCue(e.target.value)}
                  placeholder={dict.form.fields.triggerPlaceholder}
                  className="bg-background text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-emerald-900 dark:text-emerald-200">
                  {dict.form.fields.freqTitle}
                </Label>
                <div className="grid grid-cols-4 gap-2">
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
                        "rounded-md border p-2 text-center text-xs font-medium transition-all",
                        targetFrequency === f.id
                          ? "shadow-xs border-emerald-600 bg-emerald-600 font-semibold text-white"
                          : "border-border bg-background text-muted-foreground hover:bg-muted"
                      )}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Unit Type Selection */}
              <div className="space-y-2 border-t border-emerald-500/20 pt-2">
                <Label className="text-xs font-semibold text-emerald-900 dark:text-emerald-200">
                  {dict.form.fields.unitTypeTitle}
                </Label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    {
                      id: "TIME",
                      label: dict.form.fields.unitTypeTime,
                      sub: dict.form.fields.unitTypeTimeSub,
                    },
                    {
                      id: "COUNT",
                      label: dict.form.fields.unitTypeCount,
                      sub: dict.form.fields.unitTypeCountSub,
                    },
                    {
                      id: "BINARY",
                      label: dict.form.fields.unitTypeBinary,
                      sub: dict.form.fields.unitTypeBinarySub,
                    },
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
                        "rounded-lg border p-2 text-center text-xs font-medium transition-all",
                        unitType === u.id
                          ? "shadow-xs border-emerald-600 bg-emerald-600 font-semibold text-white"
                          : "border-border bg-background text-muted-foreground hover:bg-muted"
                      )}
                    >
                      <div>{u.label}</div>
                      <span className="mt-0.5 block text-[10px] opacity-80">
                        {u.sub}
                      </span>
                    </button>
                  ))}
                </div>

                {unitType !== "BINARY" && (
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div className="space-y-1">
                      <Label
                        htmlFor="form-target-amount"
                        className="text-xs font-semibold text-foreground"
                      >
                        {dict.form.fields.targetAmount}
                      </Label>
                      <Input
                        id="form-target-amount"
                        type="number"
                        min="1"
                        value={targetAmount}
                        onChange={(e) =>
                          setTargetAmount(Number(e.target.value) || 0)
                        }
                        placeholder="例如：20"
                        className="bg-background text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label
                        htmlFor="form-unit-label"
                        className="text-xs font-semibold text-foreground"
                      >
                        {dict.form.fields.unitLabel}
                      </Label>
                      <Input
                        id="form-unit-label"
                        value={unitLabel}
                        onChange={(e) => setUnitLabel(e.target.value)}
                        placeholder={
                          unitType === "TIME"
                            ? dict.form.fields.unitLabelTimePlaceholder
                            : dict.form.fields.unitLabelCountPlaceholder
                        }
                        className="bg-background text-xs"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* QUIT_HABIT FIELDS */}
          {type === "QUIT_HABIT" && (
            <div className="space-y-3 rounded-lg border border-amber-500/30 bg-amber-500/5 p-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label
                    htmlFor="item-context"
                    className="text-xs font-semibold text-amber-900 dark:text-amber-200"
                  >
                    {dict.form.fields.quitContextTitle}
                  </Label>
                  <span className="text-[10px] text-muted-foreground">
                    {dict.form.fields.quitContextTag}
                  </span>
                </div>
                <Input
                  id="item-context"
                  value={contextTags}
                  onChange={(e) => setContextTags(e.target.value)}
                  placeholder={dict.form.fields.quitContextPlaceholder}
                  className="bg-background text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="item-risk"
                  className="text-xs font-semibold text-amber-900 dark:text-amber-200"
                >
                  {dict.form.fields.quitRiskWindowTitle}
                </Label>
                <p className="text-[11px] leading-relaxed text-amber-900/80 dark:text-amber-200/80">
                  {dict.form.fields.quitRiskWindowSub}
                </p>
                <Input
                  id="item-risk"
                  value={highRiskWindow}
                  onChange={(e) => setHighRiskWindow(e.target.value)}
                  placeholder={dict.form.fields.quitRiskWindowPlaceholder}
                  className="bg-background text-xs"
                />
              </div>
            </div>
          )}

          {/* TODO FIELDS */}
          {type === "TODO" && (
            <div className="space-y-3 rounded-lg border border-blue-500/30 bg-blue-500/5 p-4">
              <div className="space-y-1.5">
                <Label
                  htmlFor="item-due"
                  className="text-xs font-semibold text-blue-900 dark:text-blue-200"
                >
                  {dict.form.fields.dueDate}
                </Label>
                <Input
                  id="item-due"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="bg-background text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-blue-900 dark:text-blue-200">
                  {dict.form.fields.todoRecurring}
                </Label>
                <div className="grid grid-cols-3 gap-2">
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
                        "rounded-md border p-2 text-center text-xs font-medium transition-all",
                        todoRecurring === r.id
                          ? "shadow-xs border-blue-600 bg-blue-600 font-semibold text-white"
                          : "border-border bg-background text-muted-foreground hover:bg-muted"
                      )}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Layer and Category */}
          <div className="space-y-2 border-t pt-2">
            <Label className="text-xs font-semibold">
              {dict.form.fields.layerTitle}
            </Label>
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
              {LAYER_LIST.map((l) => (
                <button
                  key={l.key}
                  type="button"
                  onClick={() => setLayer(l.key as Layer)}
                  className={cn(
                    "flex flex-col items-center gap-1 rounded-lg border p-2 text-center text-xs font-medium transition-all",
                    layer === l.key
                      ? "border-primary bg-primary/10 text-primary ring-1 ring-primary"
                      : "border-border text-muted-foreground hover:bg-muted"
                  )}
                >
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: l.color }}
                  />
                  <span className="w-full truncate font-semibold">
                    {l.zhLabel}
                  </span>
                </button>
              ))}
            </div>

            <div className="space-y-1.5 pt-2">
              <Label className="text-xs font-semibold">
                {dict.form.fields.customCategoryTitle}
              </Label>
              {categories.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pb-1">
                  {categories.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        setSelectedCategoryName(c.name)
                        setCustomCatInput("")
                      }}
                      className={cn(
                        "rounded-md border px-2.5 py-1 text-xs transition-colors",
                        selectedCategoryName === c.name && !customCatInput
                          ? "border-primary bg-primary font-semibold text-primary-foreground"
                          : "border-border text-muted-foreground hover:bg-muted"
                      )}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              )}
              <Input
                value={customCatInput}
                onChange={(e) => setCustomCatInput(e.target.value)}
                placeholder={dict.form.fields.customCategoryPlaceholder}
                className="text-xs"
              />
            </div>
          </div>

          {/* External Tool URL */}
          <div className="border-t pt-2">
            <RecommendedToolUrlField
              id="item-tool"
              label={dict.form.fields.toolUrlTitle}
              value={toolUrl}
              onValueChange={setToolUrl}
              recommendation={getDefaultDomainExample(layer)}
              recommendationLabel={dict.form.fields.toolUrlRecommendationLabel}
              enterHint={dict.form.fields.toolUrlEnterHint}
              appliedMessage={dict.form.fields.toolUrlApplied}
              labelClassName="text-xs font-semibold"
              inputClassName="text-xs"
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isLoading}
        >
          {dict.common.actions.cancel}
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />}
          <span>
            {mode === "edit"
              ? dict.form.fields.saveChanges
              : dict.form.fields.saveImmediate}
          </span>
        </Button>
      </div>
    </form>
  )
}
