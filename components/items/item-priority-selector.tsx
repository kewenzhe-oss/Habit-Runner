"use client"

import { useId, useRef } from "react"
import type { ItemPriority } from "@/types"

import { useI18n } from "@/lib/i18n"
import { cn } from "@/lib/utils"

export function ItemPrioritySelector({
  value,
  onChange,
  disabled = false,
}: {
  value: ItemPriority
  onChange: (value: ItemPriority) => void
  disabled?: boolean
}) {
  const id = `priority-${useId().replace(/:/g, "")}`
  const inputs = useRef<Array<HTMLInputElement | null>>([])
  const { locale } = useI18n()
  const zh = locale === "zh"
  const options: { value: ItemPriority; label: string }[] = [
    { value: "HIGH", label: zh ? "优先" : "Priority" },
    { value: "NORMAL", label: zh ? "常规" : "Normal" },
    { value: "LOW", label: zh ? "稍后" : "Later" },
  ]
  return (
    <fieldset
      disabled={disabled}
      className="space-y-1.5"
      aria-describedby={`${id}-hint`}
    >
      <legend className="text-sm font-semibold">
        {zh ? "显示优先级" : "Display priority"}
      </legend>
      <div className="grid grid-cols-3 gap-1.5">
        {options.map((option, index) => (
          <label key={option.value} className="min-w-0 cursor-pointer">
            <input
              type="radio"
              ref={(input) => {
                inputs.current[index] = input
              }}
              name={id}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              onKeyDown={(event) => {
                const direction = {
                  ArrowLeft: -1,
                  ArrowUp: -1,
                  ArrowRight: 1,
                  ArrowDown: 1,
                }[event.key]
                if (direction === undefined) return
                event.preventDefault()
                const next =
                  (index + direction + options.length) % options.length
                onChange(options[next].value)
                inputs.current[next]?.focus()
              }}
              className="peer sr-only"
            />
            <span
              className={cn(
                "flex min-h-11 items-center justify-center rounded-md border px-1 text-sm peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2 peer-disabled:opacity-50",
                value === option.value
                  ? "border-foreground bg-muted font-semibold text-foreground"
                  : "border-border text-muted-foreground hover:bg-muted/60"
              )}
            >
              {option.label}
            </span>
          </label>
        ))}
      </div>
      <p id={`${id}-hint`} className="text-xs text-muted-foreground">
        {zh
          ? "调整同一分组内的显示顺序，同级保持原顺序。"
          : "Orders items within each group. Equal priorities keep their original order."}
      </p>
    </fieldset>
  )
}
