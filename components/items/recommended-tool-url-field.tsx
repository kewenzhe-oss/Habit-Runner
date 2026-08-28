"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type ToolUrlValueSource = "empty" | "recommendation" | "user"

interface RecommendedToolUrlFieldProps {
  id: string
  label: string
  value: string
  recommendation: string
  onValueChange: (value: string) => void
  recommendationLabel: string
  enterHint: string
  appliedMessage: string
  labelClassName?: string
  inputClassName?: string
}

export function RecommendedToolUrlField({
  id,
  label,
  value,
  recommendation,
  onValueChange,
  recommendationLabel,
  enterHint,
  appliedMessage,
  labelClassName,
  inputClassName,
}: RecommendedToolUrlFieldProps) {
  const [isFocused, setIsFocused] = React.useState(false)
  const [isHighlighted, setIsHighlighted] = React.useState(false)
  const [announcement, setAnnouncement] = React.useState("")
  const valueSourceRef = React.useRef<ToolUrlValueSource>(
    value.trim() ? "user" : "empty"
  )
  const lastRecommendedValueRef = React.useRef<string | null>(null)
  const previousRecommendationRef = React.useRef(recommendation)
  const highlightTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(
    null
  )

  const hintId = `${id}-recommendation-hint`
  const statusId = `${id}-recommendation-status`

  const showAppliedFeedback = React.useCallback(() => {
    setAnnouncement(appliedMessage)
    setIsHighlighted(true)

    if (highlightTimerRef.current) {
      clearTimeout(highlightTimerRef.current)
    }

    highlightTimerRef.current = setTimeout(() => {
      setIsHighlighted(false)
    }, 500)
  }, [appliedMessage])

  React.useEffect(() => {
    return () => {
      if (highlightTimerRef.current) {
        clearTimeout(highlightTimerRef.current)
      }
    }
  }, [])

  React.useEffect(() => {
    if (
      valueSourceRef.current === "recommendation" &&
      value !== lastRecommendedValueRef.current
    ) {
      valueSourceRef.current = value.trim() ? "user" : "empty"
      lastRecommendedValueRef.current = null
    }
  }, [value])

  React.useEffect(() => {
    const recommendationChanged =
      recommendation !== previousRecommendationRef.current

    if (recommendationChanged && valueSourceRef.current === "recommendation") {
      lastRecommendedValueRef.current = recommendation
      onValueChange(recommendation)
      showAppliedFeedback()
    }

    previousRecommendationRef.current = recommendation
  }, [onValueChange, recommendation, showAppliedFeedback])

  const applyRecommendation = () => {
    valueSourceRef.current = "recommendation"
    lastRecommendedValueRef.current = recommendation
    onValueChange(recommendation)
    showAppliedFeedback()
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Enter" || event.nativeEvent.isComposing) return

    // This optional URL field is not a submit trigger. Keeping Enter local
    // prevents an accidental save in both the full and quick-create forms.
    event.preventDefault()

    if (!value.trim() && recommendation) {
      applyRecommendation()
    }
  }

  return (
    <div className="space-y-1">
      <Label htmlFor={id} className={labelClassName}>
        {label}
      </Label>
      <Input
        id={id}
        type="url"
        inputMode="url"
        autoComplete="url"
        spellCheck={false}
        value={value}
        onChange={(event) => {
          valueSourceRef.current = "user"
          lastRecommendedValueRef.current = null
          setAnnouncement("")
          onValueChange(event.target.value)
        }}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onKeyDown={handleKeyDown}
        placeholder={recommendation}
        aria-describedby={`${hintId} ${statusId}`}
        className={cn(
          "transition-[background-color,border-color,box-shadow] duration-200 motion-reduce:transition-none",
          isHighlighted &&
            "border-primary bg-primary/5 ring-2 ring-primary/20 ring-offset-2",
          inputClassName
        )}
      />
      <p
        id={hintId}
        className={cn(
          "min-h-4 break-all text-[10px] leading-4 text-muted-foreground transition-opacity duration-150 motion-reduce:transition-none",
          isFocused ? "opacity-100" : "opacity-0"
        )}
      >
        {recommendationLabel}: {recommendation} · {enterHint}
      </p>
      <p
        id={statusId}
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {announcement}
      </p>
    </div>
  )
}
