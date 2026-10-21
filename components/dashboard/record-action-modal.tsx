"use client"

import * as React from "react"
import { EnergyLevel, TodayItemDTO } from "@/types"

import { deriveHabitCheckIn } from "@/lib/domain/checkin"
import { checkInPatch, type MutateDashboardItem } from "@/lib/domain/dashboard"
import { formatLocalizedUnit, useI18n } from "@/lib/i18n"
import { cn } from "@/lib/utils"
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
  onMutate?: MutateDashboardItem
  dateStr?: string
}

export type HabitUnitType = "TIME" | "COUNT" | "BINARY"

export function RecordActionModal({
  item,
  open,
  onOpenChange,
  onSuccess,
  onMutate,
  dateStr,
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
  const [notes, setNotes] = React.useState<string>("")
  const [nextIntent, setNextIntent] = React.useState<string>("")
  const [isLoading, setIsLoading] = React.useState(false)
  const [extrasOpen, setExtrasOpen] = React.useState(false)
  const titleRef = React.useRef<HTMLHeadingElement>(null)

  // Reset/sync state on open
  React.useEffect(() => {
    if (!item) return
    const defaultAmount = unitConfig.targetAmount || 20
    setActualAmount(defaultAmount)
    setBinaryDone(true)
    setRestReason("")
    setExtrasOpen(Boolean(item.todayCheckIn?.notes || item.todayCheckIn?.nextIntent || item.todayCheckIn?.restReasonTag))
    setNotes(item.todayCheckIn?.notes || "")
    setNextIntent(item.todayCheckIn?.nextIntent || "")

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
      const reasonTag = isRestMode
        ? restReason || dict.action.modal.mapping.restTitle
        : null

      const combinedNotes = notes.trim()

      const input = {
        actualAmount:
          unitConfig.unitType === "BINARY"
            ? isRestMode
              ? 0
              : 1
            : actualAmount,
        restReasonTag: reasonTag,
        notes: combinedNotes || undefined,
        nextIntent: nextIntent.trim() || undefined,
      }
      const optimistic = deriveHabitCheckIn({ ...item, ...unitConfig }, input)
      const save = async () => {
        const res = await fetch(`/api/items/${item.id}/checkin`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...input, date: dateStr }),
        })
        if (!res.ok) throw new Error(dict.common.notifications.saveFailed)
        const { streaks, ...checkIn } = await res.json()
        return checkInPatch(item, dateStr, checkIn, streaks)
      }
      if (onMutate) {
        await onMutate(
          item,
          checkInPatch(item, dateStr, {
            id: `pending-${item.id}`,
            ...optimistic,
          }),
          save
        )
      } else {
        await save()
        onSuccess()
      }

      toast({ title: dict.action.modal.saved })

      onOpenChange(false)
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

  const shortcutAmounts = Array.from(new Set([
    Math.max(1, Math.round(unitConfig.targetAmount * 0.5)),
    unitConfig.targetAmount,
    Math.max(unitConfig.targetAmount + 1, Math.round(unitConfig.targetAmount * 1.2)),
  ]))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onOpenAutoFocus={(event) => { event.preventDefault(); titleRef.current?.focus() }} className="bottom-0 top-auto flex max-h-[calc(100dvh-0.5rem)] w-full translate-y-0 flex-col overflow-hidden rounded-b-none rounded-t-2xl sm:bottom-auto sm:top-1/2 sm:w-[calc(100%-1rem)] sm:max-w-[420px] sm:-translate-y-1/2 sm:rounded-2xl">
        <DialogHeader className="shrink-0 pr-10 text-left">
          <DialogTitle ref={titleRef} tabIndex={-1} className="text-xl font-semibold leading-snug outline-none">{item.title}</DialogTitle>
          <DialogDescription className="sr-only">{dict.action.modal.description}</DialogDescription>
        </DialogHeader>
        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain py-1">
          {unitConfig.unitType !== "BINARY" ? (
            <div className="space-y-3">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <Label htmlFor="actual-input" className="text-sm font-medium">{dict.action.modal.actualAmountLabel}</Label>
                <span className="text-sm text-muted-foreground">{dict.action.modal.targetBaselinePrefix}{unitConfig.targetAmount} {formatLocalizedUnit(unitConfig.targetAmount, unitConfig.unitLabel, locale)}</span>
              </div>
              <div className="relative">
                <Input id="actual-input" type="number" inputMode="decimal" step="any" min="0" value={actualAmount} onChange={(event) => setActualAmount(Math.max(0, Number(event.target.value)))} className="h-16 appearance-none rounded-xl pr-16 text-3xl font-semibold tabular-nums focus-visible:ring-1 sm:text-3xl [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" />
                <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">{formatLocalizedUnit(actualAmount, unitConfig.unitLabel, locale)}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {shortcutAmounts.map((amount) => <button key={amount} type="button" aria-pressed={actualAmount === amount} onClick={() => setActualAmount(amount)} className={cn("min-h-11 rounded-xl border px-2 py-2 text-sm tabular-nums transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", actualAmount === amount ? "border-foreground bg-foreground font-medium text-background" : "border-input text-muted-foreground hover:bg-muted")}>
                  {amount} {formatLocalizedUnit(amount, unitConfig.unitLabel, locale)}
                </button>)}
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <button type="button" aria-pressed={isRestMode} onClick={() => setActualAmount(isRestMode ? unitConfig.targetAmount : 0)} className={cn("inline-flex min-h-11 items-center gap-2 rounded-lg px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", isRestMode ? "bg-muted font-medium text-foreground" : "text-muted-foreground hover:bg-muted")}><Icons.rest aria-hidden="true" className="h-4 w-4" />{dict.action.modal.restToggle}{isRestMode && <Icons.check aria-hidden="true" className="h-4 w-4" />}</button>
                {!isRestMode && <span className="text-xs tabular-nums text-muted-foreground">{dict.common.energy[computedEnergy.toLowerCase() as "high" | "normal" | "low" | "rest"]} · {completionRatio}%</span>}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2" role="group" aria-label={dict.action.modal.binary.stateLabel}>
              {[true, false].map((done) => <button key={String(done)} type="button" aria-pressed={binaryDone === done} onClick={() => setBinaryDone(done)} className={cn("flex min-h-14 items-center justify-center gap-2 rounded-xl border px-3 py-3 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", binaryDone === done ? "border-foreground bg-foreground text-background" : "border-input text-muted-foreground hover:bg-muted")}>
                {done ? <Icons.check aria-hidden="true" className="h-5 w-5" /> : <Icons.rest aria-hidden="true" className="h-5 w-5" />}{done ? dict.action.modal.binary.doneTitle : dict.action.modal.binary.restTitle}
              </button>)}
            </div>
          )}
          <details open={extrasOpen} onToggle={(event) => setExtrasOpen(event.currentTarget.open)} className="group border-t">
            <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 rounded-md text-sm text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden">{notes || nextIntent || restReason ? dict.action.modal.extrasFilled : dict.action.modal.extras}<Icons.down aria-hidden="true" className="h-4 w-4 transition-transform group-open:rotate-180" /></summary>
            <div className="space-y-4 pb-2 pt-2">
              {isRestMode && <div className="space-y-2"><Label className="text-sm">{dict.action.modal.restReason.label}</Label><div className="flex flex-wrap gap-2">{restReasonPresets.map((reason) => <button key={reason} type="button" aria-pressed={restReason === reason} onClick={() => setRestReason(restReason === reason ? "" : reason)} className={cn("min-h-11 rounded-lg border px-3 text-sm", restReason === reason ? "bg-muted font-medium" : "text-muted-foreground")}>{reason}</button>)}</div></div>}
              <div className="space-y-2"><Label htmlFor="action-notes" className="text-sm">{dict.action.modal.reflection.label}</Label><Textarea id="action-notes" value={notes} onChange={(event) => setNotes(event.target.value)} placeholder={dict.action.modal.reflection.placeholder} rows={2} className="rounded-xl text-base sm:text-sm" /></div>
              <div className="space-y-2"><Label htmlFor="next-intent" className="text-sm">{dict.action.modal.nextIntentLabel}</Label><Input id="next-intent" value={nextIntent} onChange={(event) => setNextIntent(event.target.value)} placeholder={dict.action.modal.nextIntentPlaceholder} maxLength={200} className="rounded-xl text-base sm:text-sm" /></div>
            </div>
          </details>
          {item.toolLinks.length > 0 && <div className="flex flex-wrap gap-2">{item.toolLinks.map((tool) => <a key={tool.id} href={tool.url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-2 rounded-lg px-2 text-sm text-muted-foreground hover:bg-muted"><Icons.externalLink aria-hidden="true" className="h-4 w-4" />{tool.title}</a>)}</div>}
        </div>
        <DialogFooter className="shrink-0 border-t pt-3 pb-[env(safe-area-inset-bottom)] sm:pb-0">
          <Button type="button" onClick={handleSave} disabled={isLoading} className="h-12 w-full rounded-xl">
            {isLoading && <Icons.spinner aria-hidden="true" className="mr-2 h-4 w-4 animate-spin" />}{isLoading ? dict.common.status.saving : isRestMode ? dict.action.modal.saveRest : dict.action.modal.confirmButton}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
