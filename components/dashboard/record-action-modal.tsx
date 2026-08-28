"use client"

import * as React from "react"
import { EnergyLevel, TodayItemDTO } from "@/types"

import { cn } from "@/lib/utils"
import { useI18n, formatLocalizedUnit } from "@/lib/i18n"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { Icons } from "@/components/icons"

interface RecordActionModalProps {
  item: TodayItemDTO | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export type HabitUnitType = "TIME" | "COUNT" | "BINARY"

export function RecordActionModal({
  item,
  open,
  onOpenChange,
  onSuccess,
}: RecordActionModalProps) {
  const { dict, format, locale } = useI18n()
  // Parse unit config from item (prioritizing new dedicated DB columns, fallback to presets/text)
  const unitConfig = React.useMemo(() => {
    if (!item)
      return {
        unitType: "TIME" as HabitUnitType,
        targetAmount: 20,
        unitLabel: "分钟",
      }

    // 1. Direct DB columns if present
    if (item.unitType) {
      return {
        unitType: item.unitType as HabitUnitType,
        targetAmount:
          item.targetAmount || (item.unitType === "BINARY" ? 1 : 20),
        unitLabel:
          item.unitLabel ||
          (item.unitType === "TIME"
            ? "分钟"
            : item.unitType === "COUNT"
              ? "个"
              : "次"),
      }
    }

    // 2. Try finding JSON metadata from presets
    const normalPreset = item.actionPresets.find(
      (p) => p.energyLevel === "NORMAL"
    )
    if (normalPreset?.description) {
      try {
        const parsed = JSON.parse(normalPreset.description)
        if (parsed.unitType) {
          return {
            unitType: parsed.unitType as HabitUnitType,
            targetAmount: parsed.targetAmount || 20,
            unitLabel:
              parsed.unitLabel || (parsed.unitType === "TIME" ? "分钟" : "个"),
          }
        }
      } catch (e) {
        // ignore
      }
    }

    // 3. Heuristic inference from actionText / title
    const text = normalPreset?.actionText || item.title || ""
    if (
      text.includes("分钟") ||
      text.includes("小时") ||
      text.includes("min")
    ) {
      const match = text.match(/(\d+)\s*(分钟|小时|min)/)
      const num = match ? parseInt(match[1]) : 20
      return {
        unitType: "TIME" as HabitUnitType,
        targetAmount: num,
        unitLabel: "分钟",
      }
    }
    if (
      text.includes("个") ||
      text.includes("组") ||
      text.includes("页") ||
      text.includes("次")
    ) {
      const match = text.match(/(\d+)\s*(个|组|页|次)/)
      const num = match ? parseInt(match[1]) : 10
      return {
        unitType: "COUNT" as HabitUnitType,
        targetAmount: num,
        unitLabel: match ? match[2] : "个",
      }
    }

    return {
      unitType: "BINARY" as HabitUnitType,
      targetAmount: 1,
      unitLabel: "次",
    }
  }, [item])

  const [actualAmount, setActualAmount] = React.useState<number>(
    unitConfig.targetAmount || 20
  )
  const [binaryDone, setBinaryDone] = React.useState<boolean>(true)
  const [restReason, setRestReason] = React.useState<string>("")
  const [customRestNote, setCustomRestNote] = React.useState<string>("")
  const [notes, setNotes] = React.useState<string>("")
  const [isLoading, setIsLoading] = React.useState(false)

  // Reset/sync state on open
  React.useEffect(() => {
    if (!item) return
    const defaultAmount = unitConfig.targetAmount || 20
    setActualAmount(defaultAmount)
    setBinaryDone(true)
    setRestReason("")
    setCustomRestNote("")
    setNotes(item.todayCheckIn?.notes || "")

    if (item.todayCheckIn?.status === "REST") {
      setActualAmount(0)
      setBinaryDone(false)
      if (item.todayCheckIn.restReasonTag) {
        setRestReason(item.todayCheckIn.restReasonTag)
      }
    } else if (
      item.todayCheckIn?.actualAmount !== null &&
      item.todayCheckIn?.actualAmount !== undefined
    ) {
      setActualAmount(item.todayCheckIn.actualAmount)
    }
  }, [item, unitConfig, open])

  if (!item) return null

  // =========================================================================
  // Automatic Energy Mapping Calculation
  // =========================================================================
  let computedEnergy: EnergyLevel = "NORMAL"
  let completionRatio = 100

  if (unitConfig.unitType === "BINARY") {
    // Binary: only Normal (done) or Rest (not done)
    computedEnergy = binaryDone ? "NORMAL" : "REST"
    completionRatio = binaryDone ? 100 : 0
  } else {
    // Numerical (TIME / COUNT)
    const target =
      unitConfig.targetAmount && unitConfig.targetAmount > 0
        ? unitConfig.targetAmount
        : 1
    completionRatio = Math.round(((actualAmount || 0) / target) * 100)

    if (actualAmount <= 0) {
      computedEnergy = "REST"
    } else if (completionRatio >= 120) {
      computedEnergy = "HIGH"
    } else if (completionRatio >= 80) {
      computedEnergy = "NORMAL"
    } else {
      computedEnergy = "LOW"
    }
  }

  const isRestMode = computedEnergy === "REST"

  // Rest Reason Preset Pills (Neutral & Non-judgmental)
  const restReasonPresets = [
    dict.action.modal.restReason.presets.sickness,
    dict.action.modal.restReason.presets.timeConflict,
    dict.action.modal.restReason.presets.lowMood,
    dict.action.modal.restReason.presets.unexpectedEvent,
    dict.action.modal.restReason.presets.intentionalEmpty,
  ]

  const handleSave = async () => {
    setIsLoading(true)
    try {
      const reasonTag = isRestMode ? restReason || dict.action.modal.mapping.restTitle : null

      // Combine user reflection notes
      let combinedNotes = notes.trim()
      if (isRestMode && customRestNote.trim()) {
        combinedNotes = combinedNotes
          ? `${customRestNote.trim()} | ${combinedNotes}`
          : customRestNote.trim()
      }

      const res = await fetch(`/api/items/${item.id}/checkin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          actualAmount:
            unitConfig.unitType === "BINARY"
              ? isRestMode
                ? 0
                : 1
              : actualAmount,
          restReasonTag: reasonTag,
          notes: combinedNotes || undefined,
        }),
      })

      if (!res.ok) throw new Error(dict.common.notifications.saveFailed)

      toast({
        title:
          computedEnergy === "REST"
            ? dict.action.modal.toast.restTitle
            : computedEnergy === "LOW"
              ? dict.action.modal.toast.lowTitle
              : computedEnergy === "HIGH"
                ? dict.action.modal.toast.highTitle
                : dict.action.modal.toast.normalTitle,
        description:
          computedEnergy === "REST"
            ? dict.action.modal.toast.restDesc
            : computedEnergy === "LOW"
              ? format(dict.action.modal.toast.lowDesc, {
                  amount: actualAmount,
                  unit: formatLocalizedUnit(actualAmount, unitConfig.unitLabel, locale),
                })
              : format(dict.action.modal.toast.generalDesc, {
                  title: item.title,
                }),
      })

      onOpenChange(false)
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-base font-bold">
              {item.title}
            </DialogTitle>
          </div>
          {item.whyPrompt && (
            <DialogDescription className="text-xs font-normal text-muted-foreground">
              “{item.whyPrompt}”
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* External Tool Launch */}
          {item.toolLinks.length > 0 && (
            <div className="flex items-center justify-between rounded-lg bg-muted/40 p-2.5 text-xs">
              <span className="text-muted-foreground">{dict.action.modal.toolLinkPrefix}</span>
              <div className="flex gap-2">
                {item.toolLinks.map((tool) => (
                  <a
                    key={tool.id}
                    href={tool.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-semibold text-primary hover:underline"
                  >
                    <span>{tool.title}</span>
                    <Icons.externalLink className="h-3 w-3" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* MODE A: NUMERICAL HABIT (TIME / COUNT) */}
          {unitConfig.unitType !== "BINARY" && (
            <div className="space-y-3">
              {/* Target info and input */}
              <div className="flex items-center justify-between">
                <Label
                  htmlFor="actual-input"
                  className="text-xs font-semibold text-foreground"
                >
                  {dict.action.modal.actualAmountLabel}
                </Label>
                <span className="text-xs text-muted-foreground">
                  {dict.action.modal.targetBaselinePrefix}
                  <span className="font-semibold text-foreground">
                    {unitConfig.targetAmount} {formatLocalizedUnit(unitConfig.targetAmount, unitConfig.unitLabel, locale)}
                  </span>
                </span>
              </div>

              {/* Number Input with unit */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Input
                    id="actual-input"
                    type="number"
                    min="0"
                    value={actualAmount === 0 && isRestMode ? 0 : actualAmount}
                    onChange={(e) =>
                      setActualAmount(Math.max(0, Number(e.target.value)))
                    }
                    className="pr-14 text-base font-bold"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground">
                    {formatLocalizedUnit(actualAmount, unitConfig.unitLabel, locale)}
                  </span>
                </div>
              </div>

              {/* Quick shortcut pills */}
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {[
                  {
                    label: dict.action.modal.shortcuts.half,
                    amt: Math.round(unitConfig.targetAmount * 0.5),
                  },
                  {
                    label: dict.action.modal.shortcuts.base,
                    amt: Math.round(unitConfig.targetAmount * 0.8),
                  },
                  { label: dict.action.modal.shortcuts.target, amt: unitConfig.targetAmount },
                  {
                    label: dict.action.modal.shortcuts.high,
                    amt: Math.round(unitConfig.targetAmount * 1.2),
                  },
                  { label: dict.action.modal.shortcuts.rest, amt: 0 },
                ].map((p) => (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => setActualAmount(p.amt)}
                    className={cn(
                      "min-h-11 rounded-md border px-3 py-2 text-xs font-medium transition-colors",
                      actualAmount === p.amt
                        ? "border-primary bg-primary font-semibold text-primary-foreground"
                        : "border-border bg-muted/40 text-muted-foreground hover:bg-muted"
                    )}
                  >
                    {p.label} ({p.amt}{" "}
                    {formatLocalizedUnit(p.amt, unitConfig.unitLabel, locale)})
                  </button>
                ))}
              </div>

              {/* Live Automatic Energy Mapping Banner */}
              <div
                className={cn(
                  "space-y-1 rounded-lg border p-3 text-xs transition-all",
                  computedEnergy === "HIGH"
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-900 dark:text-emerald-200"
                    : computedEnergy === "NORMAL"
                      ? "border-blue-500/30 bg-blue-500/10 text-blue-900 dark:text-blue-200"
                      : computedEnergy === "LOW"
                        ? "border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-200"
                        : "border-purple-500/30 bg-purple-500/10 text-purple-900 dark:text-purple-200"
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold">
                    {computedEnergy === "HIGH" && (
                      <Icons.highEnergy className="h-4 w-4 text-emerald-600" />
                    )}
                    {computedEnergy === "NORMAL" && (
                      <Icons.normalEnergy className="h-4 w-4 text-blue-600" />
                    )}
                    {computedEnergy === "LOW" && (
                      <Icons.lowEnergy className="h-4 w-4 text-amber-600" />
                    )}
                    {computedEnergy === "REST" && (
                      <Icons.rest className="h-4 w-4 text-purple-600" />
                    )}
                    <span>
                      {computedEnergy === "HIGH"
                        ? format(dict.action.modal.mapping.highTitle, { ratio: completionRatio })
                        : computedEnergy === "NORMAL"
                          ? format(dict.action.modal.mapping.normalTitle, { ratio: completionRatio })
                          : computedEnergy === "LOW"
                            ? format(dict.action.modal.mapping.lowTitle, { ratio: completionRatio })
                            : dict.action.modal.mapping.restTitle}
                    </span>
                  </div>
                  <span className="text-[10px] font-semibold opacity-80">
                    {dict.action.modal.mapping.autoMappingTag}
                  </span>
                </div>
                <p className="text-[11px] leading-relaxed opacity-90">
                  {computedEnergy === "HIGH"
                    ? dict.action.modal.mapping.highDesc
                    : computedEnergy === "NORMAL"
                      ? dict.action.modal.mapping.normalDesc
                      : computedEnergy === "LOW"
                        ? dict.action.modal.mapping.lowDesc
                        : dict.action.modal.mapping.restDesc}
                </p>
              </div>
            </div>
          )}

          {/* MODE B: BINARY HABIT */}
          {unitConfig.unitType === "BINARY" && (
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-foreground">
                {dict.action.modal.binary.stateLabel}
              </Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setBinaryDone(true)}
                  className={cn(
                    "flex min-h-14 flex-col items-start rounded-lg border p-3 text-left transition-colors",
                    binaryDone
                      ? "border-blue-500 bg-blue-500/10 text-blue-900 ring-1 ring-blue-500 dark:text-blue-200"
                      : "border-border text-muted-foreground hover:bg-muted"
                  )}
                >
                  <div className="flex items-center gap-1.5 text-xs font-bold">
                    <Icons.check className="h-4 w-4 text-blue-600" />
                    <span>{dict.action.modal.binary.doneTitle}</span>
                  </div>
                  <span className="mt-0.5 text-[10px] opacity-75">
                    {dict.action.modal.binary.doneSub}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setBinaryDone(false)}
                  className={cn(
                    "flex min-h-14 flex-col items-start rounded-lg border p-3 text-left transition-colors",
                    !binaryDone
                      ? "border-purple-500 bg-purple-500/10 text-purple-900 ring-1 ring-purple-500 dark:text-purple-200"
                      : "border-border text-muted-foreground hover:bg-muted"
                  )}
                >
                  <div className="flex items-center gap-1.5 text-xs font-bold">
                    <Icons.rest className="h-4 w-4 text-purple-600" />
                    <span>{dict.action.modal.binary.restTitle}</span>
                  </div>
                  <span className="mt-0.5 text-[10px] opacity-75">
                    {dict.action.modal.binary.restSub}
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* REST REASON MECHANISM */}
          {isRestMode && (
            <div className="space-y-2.5 rounded-lg border border-purple-500/30 bg-purple-500/5 p-3 text-xs">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-1.5 text-xs font-semibold text-purple-900 dark:text-purple-200">
                  <Icons.rest className="h-3.5 w-3.5" />
                  <span>{dict.action.modal.restReason.label}</span>
                </Label>
              </div>

              {/* Quick neutral preset pills */}
              <div className="flex flex-wrap gap-1.5">
                {restReasonPresets.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRestReason(r)}
                    className={cn(
                      "min-h-11 rounded-md border px-3 py-2 text-xs font-medium transition-colors",
                      restReason === r
                        ? "shadow-xs border-purple-600 bg-purple-600 font-semibold text-white"
                        : "border-purple-500/30 bg-background text-purple-900 hover:bg-purple-500/15 dark:text-purple-200"
                    )}
                  >
                    {r}
                  </button>
                ))}
              </div>

              {/* Optional custom rest note */}
              <div className="space-y-1 pt-1">
                <Input
                  value={customRestNote}
                  onChange={(e) => setCustomRestNote(e.target.value)}
                  placeholder={dict.action.modal.restReason.customPlaceholder}
                  className="bg-background text-xs"
                />
              </div>
            </div>
          )}

          {/* Optional Reflection Note */}
          <div className="space-y-1">
            <Label
              htmlFor="action-notes"
              className="text-xs font-semibold text-foreground"
            >
              {dict.action.modal.reflection.label}
            </Label>
            <Textarea
              id="action-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={dict.action.modal.reflection.placeholder}
              rows={2}
              className="resize-none text-xs"
            />
          </div>
        </div>

        <DialogFooter className="sticky bottom-0 -mx-4 -mb-4 flex items-stretch justify-between gap-2 border-t bg-background px-4 pb-4 pt-3 sm:static sm:mx-0 sm:mb-0 sm:items-center sm:px-0 sm:pb-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            {dict.common.actions.cancel}
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleSave}
            disabled={isLoading}
          >
            {isLoading && (
              <Icons.spinner className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            )}
            <span>{dict.action.modal.confirmButton}</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
