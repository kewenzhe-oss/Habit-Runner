"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { ItemDetailDTO, ItemPriority, Layer } from "@/types"

import { LAYER_LIST } from "@/config/layers"
import { categoryLabel } from "@/lib/category-label"
import { getDefaultDomainExample } from "@/lib/defaultDomainExamples"
import { buildQuickAddItemPayload } from "@/lib/domain/quick-add-item"
import { useI18n } from "@/lib/i18n"
import {
  clearPendingNewItem,
  clearQuickAddTransfer,
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
import { ItemPrioritySelector } from "@/components/items/item-priority-selector"
import { RecommendedToolUrlField } from "@/components/items/recommended-tool-url-field"

interface Category {
  id: string
  name: string
  icon?: string | null
}

export type HabitUnitType = "TIME" | "COUNT" | "BINARY"

interface ItemFormProps {
  initialDraft?: PendingNewItemPayload
  initialCustomCategory?: string
  initialItem?: ItemDetailDTO
  mode: "create" | "edit"
}

function frequencyFromDays(frequencyDays?: string | null) {
  if (frequencyDays === "1,2,3,4,5") return "WEEKDAYS" as const
  if (frequencyDays === "3_4_DAYS") return "3_4_TIMES" as const
  if (frequencyDays === "0,6") return "WEEKENDS" as const
  return "DAILY" as const
}

export function ItemForm({
  initialDraft,
  initialItem,
  mode,
  initialCustomCategory = "",
}: ItemFormProps) {
  const router = useRouter()
  const { dict, locale } = useI18n()
  const [type, setType] = React.useState<"HABIT" | "QUIT_HABIT" | "TODO">(
    initialItem?.type || initialDraft?.type || "HABIT"
  )
  const [isLoading, setIsLoading] = React.useState(false)

  // 1. Shared Fields
  const [priority, setPriority] = React.useState<ItemPriority>(
    initialItem?.priority ?? initialDraft?.priority ?? "NORMAL"
  )
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
  const [customCatInput, setCustomCatInput] = React.useState(
    initialCustomCategory
  )
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
          source.unitLabel ||
          (source.unitType === "TIME"
            ? locale === "zh"
              ? "分钟"
              : "minutes"
            : locale === "zh"
              ? "个"
              : "items"),
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
      unitLabel: locale === "zh" ? "分钟" : "minutes",
    }
  }, [initialDraft, initialItem, locale])

  const [unitType, setUnitType] = React.useState<HabitUnitType>(
    initialUnitConfig.unitType
  )
  const [targetAmount, setTargetAmount] = React.useState(
    String(initialUnitConfig.targetAmount)
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
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load categories")
        return res.json()
      })
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
      return toast({
        title: dict.common.notifications.titleRequired,
        variant: "destructive",
      })
    }

    if (
      type === "HABIT" &&
      unitType !== "BINARY" &&
      (!targetAmount ||
        !Number.isFinite(Number(targetAmount)) ||
        Number(targetAmount) <= 0)
    ) {
      return toast({
        title:
          locale === "zh"
            ? "请填写有效的目标量数值"
            : "Please enter a valid target amount",
        variant: "destructive",
      })
    }

    if (toolUrl.trim() && !toolUrl.startsWith("https://")) {
      return toast({
        title:
          locale === "zh"
            ? "关联工具网址必须以 https:// 开头"
            : "Tool URL must start with https://",
        variant: "destructive",
      })
    }

    setIsLoading(true)
    try {
      const finalCat =
        customCatInput.trim() ||
        selectedCategoryName.trim() ||
        (locale === "zh" ? "生活日常" : "Daily Life")
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

      const payload = buildQuickAddItemPayload({
        locale,
        priority,
        title,
        whyPrompt,
        type,
        layer,
        finalCategory: finalCat,
        categoryId,
        unitType,
        targetAmount: Number(targetAmount),
        unitLabel,
        targetFrequency,
        triggerCue,
        contextTags,
        highRiskWindow,
        dueDate,
        todoRecurring,
        toolUrl,
      })

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
        title:
          locale === "zh"
            ? mode === "edit"
              ? "事项设置已更新"
              : "新事项已创建"
            : mode === "edit"
              ? "Item updated"
              : "Item created",
        description:
          locale === "zh"
            ? `“${title.trim()}” 已成功保存。`
            : `“${title.trim()}” has been saved.`,
      })

      if (mode === "create") {
        clearPendingNewItem()
        clearQuickAddTransfer()
      }
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
                aria-pressed={type === "HABIT"}
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
                <span className="mt-0.5 block text-xs font-normal opacity-75">
                  {dict.form.types.habit.sub}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setType("QUIT_HABIT")}
                aria-pressed={type === "QUIT_HABIT"}
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
                <span className="mt-0.5 block text-xs font-normal opacity-75">
                  {dict.form.types.quitHabit.sub}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setType("TODO")}
                aria-pressed={type === "TODO"}
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
                <span className="mt-0.5 block text-xs font-normal opacity-75">
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
              required
              maxLength={64}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={
                type === "HABIT"
                  ? dict.form.fields.habitPlaceholder
                  : type === "QUIT_HABIT"
                    ? dict.form.fields.quitPlaceholder
                    : dict.form.fields.todoPlaceholder
              }
              className="text-base sm:text-sm"
            />
          </div>

          <ItemPrioritySelector
            value={priority}
            onChange={setPriority}
            disabled={isLoading}
          />

          {/* 这是为了什么（可选） */}
          {type !== "TODO" && (
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label htmlFor="item-why" className="text-xs font-semibold">
                  {dict.form.fields.whyTitle}
                </Label>
                <span className="text-xs text-muted-foreground">
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
                className="text-base sm:text-sm"
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
                  <span className="text-xs text-muted-foreground">
                    {dict.form.fields.triggerTag}
                  </span>
                </div>
                <Input
                  id="item-trigger"
                  value={triggerCue}
                  onChange={(e) => setTriggerCue(e.target.value)}
                  placeholder={dict.form.fields.triggerPlaceholder}
                  className="bg-background text-base sm:text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-emerald-900 dark:text-emerald-200">
                  {dict.form.fields.freqTitle}
                </Label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
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
                      aria-pressed={targetFrequency === f.id}
                      className={cn(
                        "min-h-11 rounded-md border p-2 text-center text-sm font-medium transition-all",
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
                        if (u.id === "TIME")
                          setUnitLabel(locale === "zh" ? "分钟" : "minutes")
                        if (u.id === "COUNT")
                          setUnitLabel(locale === "zh" ? "个" : "items")
                      }}
                      aria-pressed={unitType === u.id}
                      className={cn(
                        "min-h-11 rounded-lg border p-2 text-center text-sm font-medium transition-all",
                        unitType === u.id
                          ? "shadow-xs border-emerald-600 bg-emerald-600 font-semibold text-white"
                          : "border-border bg-background text-muted-foreground hover:bg-muted"
                      )}
                    >
                      <div>{u.label}</div>
                      <span className="mt-0.5 block text-xs opacity-80">
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
                        min="0.01"
                        max="1000000"
                        step="any"
                        required
                        value={targetAmount}
                        onChange={(e) => setTargetAmount(e.target.value)}
                        placeholder="例如：20"
                        className="bg-background text-base sm:text-sm"
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
                        className="bg-background text-base sm:text-sm"
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
                  <span className="text-xs text-muted-foreground">
                    {dict.form.fields.quitContextTag}
                  </span>
                </div>
                <Input
                  id="item-context"
                  value={contextTags}
                  onChange={(e) => setContextTags(e.target.value)}
                  placeholder={dict.form.fields.quitContextPlaceholder}
                  className="bg-background text-base sm:text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="item-risk"
                  className="text-xs font-semibold text-amber-900 dark:text-amber-200"
                >
                  {dict.form.fields.quitRiskWindowTitle}
                </Label>
                <p className="text-xs leading-relaxed text-amber-900/80 dark:text-amber-200/80">
                  {dict.form.fields.quitRiskWindowSub}
                </p>
                <Input
                  id="item-risk"
                  value={highRiskWindow}
                  onChange={(e) => setHighRiskWindow(e.target.value)}
                  placeholder={dict.form.fields.quitRiskWindowPlaceholder}
                  className="bg-background text-base sm:text-sm"
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
                  className="bg-background text-base sm:text-sm"
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
                      aria-pressed={todoRecurring === r.id}
                      className={cn(
                        "min-h-11 rounded-md border p-2 text-center text-sm font-medium transition-all",
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
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {LAYER_LIST.map((l) => (
                <button
                  key={l.key}
                  type="button"
                  onClick={() => setLayer(l.key as Layer)}
                  aria-pressed={layer === l.key}
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
                  <span className="w-full break-words font-semibold">
                    {locale === "zh" ? l.zhLabel : l.label}
                  </span>
                </button>
              ))}
            </div>

            <div className="space-y-1.5 pt-2">
              <Label
                htmlFor="item-custom-category"
                className="text-sm font-semibold"
              >
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
                      aria-pressed={
                        selectedCategoryName === c.name && !customCatInput
                      }
                      className={cn(
                        "min-h-11 rounded-md border px-2.5 py-2 text-sm transition-colors",
                        selectedCategoryName === c.name && !customCatInput
                          ? "border-primary bg-primary font-semibold text-primary-foreground"
                          : "border-border text-muted-foreground hover:bg-muted"
                      )}
                    >
                      {categoryLabel(c, locale)}
                    </button>
                  ))}
                </div>
              )}
              <Input
                id="item-custom-category"
                maxLength={32}
                value={customCatInput}
                onChange={(e) => setCustomCatInput(e.target.value)}
                placeholder={dict.form.fields.customCategoryPlaceholder}
                className="text-base sm:text-sm"
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
          className="min-h-11"
        >
          {dict.common.actions.cancel}
        </Button>
        <Button type="submit" disabled={isLoading} className="min-h-11">
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
