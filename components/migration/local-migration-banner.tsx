"use client"

import * as React from "react"

import { useI18n } from "@/lib/i18n"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Icons } from "@/components/icons"

interface LocalMigrationBannerProps {
  count: number
  email: string
  onMergeNow: () => void
  onRemindLater: () => void
  className?: string
}

export function LocalMigrationBanner({
  count,
  email,
  onMergeNow,
  onRemindLater,
  className,
}: LocalMigrationBannerProps) {
  const { dict, format } = useI18n()
  const migDict = dict.dashboard.migration

  return (
    <Card
      role="region"
      aria-label={migDict.bannerTitle}
      className={cn(
        "relative overflow-hidden border-primary/20 bg-gradient-to-r from-primary/5 via-primary/10 to-transparent shadow-xs transition-all",
        className
      )}
    >
      <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div className="flex items-start gap-3.5 sm:items-center">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Icons.arrowUpRight className="h-4 w-4" />
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold tracking-tight text-foreground">
                {format(migDict.bannerTitle, { count })}
              </span>
              <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-medium text-primary">
                未同步
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {format(migDict.bannerDescription, { email })}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-1 sm:pt-0">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onRemindLater}
            aria-label={migDict.dismissAria}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            {migDict.remindLater}
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={onMergeNow}
            className="gap-1.5 bg-primary text-xs font-semibold text-primary-foreground shadow-xs hover:bg-primary/90"
          >
            <span>{migDict.mergeNow}</span>
            <Icons.next className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
