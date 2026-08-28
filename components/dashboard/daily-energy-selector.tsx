"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { EnergyLevel } from "@/types"

import { cn } from "@/lib/utils"
import { useI18n } from "@/lib/i18n"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "@/components/ui/use-toast"

interface DailyEnergySelectorProps {
  date: string
  initialEnergy: EnergyLevel | null
  initialNote?: string | null
}

export function DailyEnergySelector({
  date,
  initialEnergy,
  initialNote,
}: DailyEnergySelectorProps) {
  const router = useRouter()
  const { dict } = useI18n()
  const [energy, setEnergy] = React.useState<EnergyLevel | null>(initialEnergy)
  const [note, setNote] = React.useState(initialNote || "")
  const [isSaving, setIsSaving] = React.useState(false)

  const ENERGY_OPTIONS: Array<{
    value: EnergyLevel
    label: string
    hint: string
    activeClass: string
  }> = [
    {
      value: "HIGH",
      label: dict.common.energy.high,
      hint: dict.common.energyDescriptions.high,
      activeClass: "border-emerald-600 bg-emerald-600 text-white",
    },
    {
      value: "NORMAL",
      label: dict.common.energy.normal,
      hint: dict.common.energyDescriptions.normal,
      activeClass: "border-blue-600 bg-blue-600 text-white",
    },
    {
      value: "LOW",
      label: dict.common.energy.low,
      hint: dict.common.energyDescriptions.low,
      activeClass: "border-amber-600 bg-amber-600 text-white",
    },
    {
      value: "REST",
      label: dict.common.energy.rest,
      hint: dict.common.energyDescriptions.rest,
      activeClass: "border-purple-600 bg-purple-600 text-white",
    },
  ]

  const save = async (nextEnergy: EnergyLevel) => {
    const previous = energy
    setEnergy(nextEnergy)
    setIsSaving(true)
    try {
      const response = await fetch("/api/daily-energy", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date,
          energyLevel: nextEnergy,
          note: note || undefined,
        }),
      })
      if (!response.ok) throw new Error(dict.common.notifications.saveFailed)
      toast({ title: dict.dashboard.energySelector.updateSuccessToast })
      router.refresh()
    } catch (error) {
      setEnergy(previous)
      toast({
        title: dict.common.notifications.saveFailed,
        description: error instanceof Error ? error.message : dict.common.notifications.networkError,
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <section
      className="rounded-xl border bg-card p-4"
      aria-labelledby="daily-energy-title"
    >
      <div className="mb-3 space-y-1">
        <h2 id="daily-energy-title" className="text-sm font-semibold">
          {dict.dashboard.energySelector.title}{" "}
          <span className="font-normal text-muted-foreground">{dict.dashboard.energySelector.optionalTag}</span>
        </h2>
        <p className="text-xs leading-relaxed text-muted-foreground">
          {dict.dashboard.energySelector.description}
        </p>
      </div>

      <div
        className="grid grid-cols-2 gap-2 sm:grid-cols-4"
        role="group"
        aria-label={dict.dashboard.energySelector.title}
      >
        {ENERGY_OPTIONS.map((option) => {
          const selected = energy === option.value
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={selected}
              disabled={isSaving}
              onClick={() => save(option.value)}
              className={cn(
                "min-h-12 rounded-lg border px-3 py-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                selected
                  ? option.activeClass
                  : "bg-background text-foreground hover:bg-muted active:bg-muted/80"
              )}
            >
              <span className="block text-xs font-semibold">
                {option.label}
              </span>
              <span
                className={cn(
                  "mt-0.5 block text-[11px]",
                  selected ? "text-white/85" : "text-muted-foreground"
                )}
              >
                {option.hint}
              </span>
            </button>
          )
        })}
      </div>

      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <Input
          value={note}
          onChange={(event) => setNote(event.target.value)}
          maxLength={200}
          aria-label={dict.dashboard.energySelector.title}
          placeholder={dict.dashboard.energySelector.notePlaceholder}
          className="min-h-11 text-base sm:text-sm"
        />
        {energy && note !== (initialNote || "") && (
          <Button
            type="button"
            variant="outline"
            className="min-h-11"
            disabled={isSaving}
            onClick={() => save(energy)}
          >
            {dict.dashboard.energySelector.saveNoteButton}
          </Button>
        )}
      </div>
    </section>
  )
}
