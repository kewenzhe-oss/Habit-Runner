"use client"

import type { LayerGrowthMatrixData } from "@/types"

import { useI18n } from "@/lib/i18n"
import { Card } from "@/components/ui/card"
import { Icons } from "@/components/icons"
import { LayerGrowthMatrix } from "@/components/insights/layer-growth-matrix"

interface FullGrowthRecordProps {
  data: LayerGrowthMatrixData
}

export function FullGrowthRecord({ data }: FullGrowthRecordProps) {
  const { dict: fullDict, format } = useI18n()
  const dict = fullDict.insights.fullRecord

  return (
    <Card className="overflow-hidden bg-muted/10">
      <details className="group">
        <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 px-4 py-3 text-left outline-none transition-colors hover:bg-muted/30 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring sm:px-6 [&::-webkit-details-marker]:hidden">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <Icons.layers className="h-4 w-4" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-sm font-semibold text-foreground">
                  {dict.title}
                </h2>
                <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                  {dict.tag}
                </span>
              </div>
              <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                {format(dict.description, { count: data.layers.length })}
              </p>
            </div>
          </div>
          <Icons.next
            className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 group-open:rotate-90"
            aria-hidden="true"
          />
        </summary>

        <div className="border-t">
          <LayerGrowthMatrix data={data} embedded />
        </div>
      </details>
    </Card>
  )
}
