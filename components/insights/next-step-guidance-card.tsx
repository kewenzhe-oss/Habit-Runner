"use client"

import * as React from "react"
import { NextStepGuidance } from "@/lib/domain/growth-narrative"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Icons } from "@/components/icons"
import { useI18n } from "@/lib/i18n"

interface NextStepGuidanceCardProps {
  guidance: NextStepGuidance
}

export function NextStepGuidanceCard({ guidance }: NextStepGuidanceCardProps) {
  const { dict: fullDict } = useI18n()
  const dict = fullDict.insights.weeklyReview

  const { protect, optionalGentle, reassurance } = guidance

  return (
    <Card className="overflow-hidden border-border/80 shadow-xs">
      <CardHeader className="space-y-1 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
            <Icons.compass className="h-4 w-4" />
          </div>
          <CardTitle className="text-base font-bold tracking-tight text-foreground">
            {dict.nextTitle}
          </CardTitle>
        </div>
        <CardDescription className="text-xs text-muted-foreground">
          {dict.nextDescription}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-3 pt-1">
        <div className="grid gap-3 sm:grid-cols-1 md:grid-cols-2">
          {/* Card 1: 值得继续守住 */}
          {protect && (
            <div className="space-y-1.5 rounded-xl border border-emerald-500/25 bg-emerald-500/5 p-4">
              <div className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                  <Icons.check className="h-3 w-3" />
                </span>
                <h4 className="text-xs font-bold text-emerald-950 dark:text-emerald-200">
                  {dict.keepTitle} · {protect.label}
                </h4>
              </div>
              <p className="text-xs leading-relaxed text-emerald-900/90 dark:text-emerald-200/90">
                {protect.message}
              </p>
            </div>
          )}

          {/* Card 2: 如果还有余力 (可选) */}
          {optionalGentle ? (
            <div className="space-y-1.5 rounded-xl border border-blue-500/25 bg-blue-500/5 p-4">
              <div className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-500/20 text-blue-700 dark:text-blue-300">
                  <Icons.sparkles className="h-3 w-3" />
                </span>
                <h4 className="text-xs font-bold text-blue-950 dark:text-blue-200">
                  {dict.gentleTitle} · {optionalGentle.label}
                </h4>
              </div>
              <p className="text-xs leading-relaxed text-blue-900/90 dark:text-blue-200/90">
                {optionalGentle.message}
              </p>
            </div>
          ) : (
            <div className="flex items-center rounded-xl border border-dashed bg-muted/20 p-4 text-xs leading-relaxed text-muted-foreground">
              <p>{reassurance}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
