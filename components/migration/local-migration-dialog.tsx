"use client"

import * as React from "react"
import { ItemType } from "@/types"

import { useI18n } from "@/lib/i18n"
import {
  ConflictItemAnalysis,
  MigrationPlan,
} from "@/lib/migration/conflict-resolver"
import { MigrationAction } from "@/lib/validations/migration"
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
import { Icons } from "@/components/icons"
import { ScrollArea } from "@/components/ui/scroll-area"

interface LocalMigrationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  email: string
  isAnalyzing: boolean
  isMerging: boolean
  step: "idle" | "review" | "merging" | "completed"
  migrationPlan: MigrationPlan | null
  mergeStats: {
    merged: number
    overwritten: number
    skipped: number
  } | null
  onUpdateItemAction: (localId: string, action: MigrationAction) => void
  onBatchResolve: (action: "keep_both" | "overwrite" | "keep_cloud") => void
  onExecuteMerge: () => void
  onDismiss: () => void
  onCleanLocalData: () => void
  onKeepLocalBackup: () => void
}

function getItemTypeBadge(type: ItemType) {
  switch (type) {
    case "HABIT":
      return (
        <span className="inline-flex items-center rounded-md bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
          日常习惯
        </span>
      )
    case "QUIT_HABIT":
      return (
        <span className="inline-flex items-center rounded-md bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-600 dark:text-amber-400">
          行为戒除
        </span>
      )
    case "TODO":
      return (
        <span className="inline-flex items-center rounded-md bg-blue-500/10 px-2 py-0.5 text-[11px] font-medium text-blue-600 dark:text-blue-400">
          单次待办
        </span>
      )
  }
}

export function LocalMigrationDialog({
  open,
  onOpenChange,
  email,
  isAnalyzing,
  isMerging,
  step,
  migrationPlan,
  mergeStats,
  onUpdateItemAction,
  onBatchResolve,
  onExecuteMerge,
  onDismiss,
  onCleanLocalData,
  onKeepLocalBackup,
}: LocalMigrationDialogProps) {
  const { dict, format, locale } = useI18n()
  const migDict = dict.dashboard.migration

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] max-w-2xl flex flex-col p-0 sm:max-h-[85vh]">
        <DialogHeader className="border-b px-6 py-4">
          <DialogTitle className="text-base font-semibold text-foreground">
            {migDict.modalTitle}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {format(migDict.modalDescription, { email })}
          </DialogDescription>
        </DialogHeader>

        {/* 1. Loading / Analyzing State */}
        {isAnalyzing && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Icons.spinner className="h-8 w-8 animate-spin text-primary" />
            <p className="mt-3 text-xs text-muted-foreground">
              {migDict.merging}
            </p>
          </div>
        )}

        {/* 2. Merging In Progress State */}
        {isMerging && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Icons.spinner className="h-8 w-8 animate-spin text-primary" />
            <p className="mt-3 text-sm font-semibold text-foreground">
              {migDict.merging}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              请稍候，正在将数据同步写入云端数据库...
            </p>
          </div>
        )}

        {/* 3. Completed State */}
        {step === "completed" && mergeStats && (
          <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Icons.check className="h-6 w-6" />
            </div>
            <h3 className="mt-3 text-base font-semibold text-foreground">
              {migDict.successTitle}
            </h3>
            <p className="mt-1 max-w-md text-xs text-muted-foreground">
              {format(migDict.successDescription, mergeStats)}
            </p>

            <div className="my-6 w-full rounded-lg border border-border bg-muted/40 p-4 text-left">
              <h4 className="text-xs font-semibold text-foreground">
                {migDict.cleanupPromptTitle}
              </h4>
              <p className="mt-1 text-xs text-muted-foreground">
                {migDict.cleanupPromptDesc}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={onCleanLocalData}
                  className="text-xs"
                >
                  {migDict.cleanupBtn}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={onKeepLocalBackup}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  {migDict.keepLocalBackupBtn}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* 4. Conflict Review State */}
        {!isAnalyzing && !isMerging && step === "review" && migrationPlan && (
          <div className="flex flex-1 flex-col overflow-hidden">
            <ScrollArea className="flex-1 px-6 py-4">
              {/* If no conflicts */}
              {migrationPlan.conflictCount === 0 ? (
                <div className="space-y-4 py-2">
                  <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                    <h4 className="text-xs font-semibold text-primary">
                      {migDict.noConflictTitle}
                    </h4>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {format(migDict.noConflictDesc, {
                        count: migrationPlan.totalLocalCount,
                      })}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <span className="text-xs font-semibold text-muted-foreground">
                      待同步事项清单（共 {migrationPlan.analyses.length} 项）
                    </span>
                    <div className="divide-y rounded-lg border">
                      {migrationPlan.analyses.map((analysis) => (
                        <div
                          key={analysis.localId}
                          className="flex items-center justify-between p-3"
                        >
                          <div className="flex items-center gap-2">
                            {getItemTypeBadge(analysis.localItem.payload.type)}
                            <span className="text-xs font-medium text-foreground">
                              {analysis.localItem.payload.title}
                            </span>
                          </div>
                          <span className="text-[11px] text-muted-foreground">
                            {analysis.localItem.payload.targetAmount
                              ? `${analysis.localItem.payload.targetAmount} ${
                                  analysis.localItem.payload.unitLabel || "次"
                                }`
                              : "标准记录"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                /* Has conflicts */
                <div className="space-y-4 py-1">
                  <div className="flex flex-col gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h4 className="text-xs font-semibold text-amber-900 dark:text-amber-300">
                        {format(migDict.conflictTitle, {
                          count: migrationPlan.conflictCount,
                        })}
                      </h4>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        {migDict.conflictDescription}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-1.5 pt-1 sm:pt-0">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => onBatchResolve("keep_both")}
                        className="h-7 text-[11px]"
                      >
                        {migDict.batchKeepBoth}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => onBatchResolve("overwrite")}
                        className="h-7 text-[11px]"
                      >
                        {migDict.batchOverwrite}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => onBatchResolve("keep_cloud")}
                        className="h-7 text-[11px]"
                      >
                        {migDict.batchKeepCloud}
                      </Button>
                    </div>
                  </div>

                  {/* Conflicting Items Cards */}
                  <div className="space-y-3">
                    {migrationPlan.analyses.map((analysis) => {
                      if (analysis.status !== "conflict") return null
                      return (
                        <ConflictItemCard
                          key={analysis.localId}
                          analysis={analysis}
                          locale={locale}
                          migDict={migDict}
                          onSelectAction={(action) =>
                            onUpdateItemAction(analysis.localId, action)
                          }
                        />
                      )
                    })}
                  </div>

                  {/* Non-conflicting list note */}
                  {migrationPlan.localOnlyCount > 0 && (
                    <div className="rounded-md bg-muted/40 px-3 py-2 text-[11px] text-muted-foreground">
                      💡 另有 {migrationPlan.localOnlyCount}{" "}
                      条本地独有事项将直接作为新记录合并。
                    </div>
                  )}
                </div>
              )}
            </ScrollArea>

            <DialogFooter className="border-t px-6 py-3">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onDismiss}
                className="text-xs"
              >
                {migDict.cancel}
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={onExecuteMerge}
                className="bg-primary text-xs font-semibold text-primary-foreground"
              >
                {migDict.confirmMerge}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

interface ConflictItemCardProps {
  analysis: ConflictItemAnalysis
  locale: string
  migDict: any
  onSelectAction: (action: MigrationAction) => void
}

function ConflictItemCard({
  analysis,
  locale,
  migDict,
  onSelectAction,
}: ConflictItemCardProps) {
  const local = analysis.localItem.payload
  const cloud = analysis.cloudItem

  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {getItemTypeBadge(local.type)}
          <span className="text-xs font-semibold text-foreground">
            {local.title}
          </span>
        </div>
        <span className="text-[10px] text-muted-foreground">内容存在差异</span>
      </div>

      {/* Difference comparison grid */}
      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="rounded-md border border-border/80 bg-muted/20 p-2.5 space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-semibold text-muted-foreground">
            <span>☁️ {migDict.cloudVersion}</span>
          </div>
          <div className="space-y-1 text-[11px] text-foreground">
            <p>
              目标量:{" "}
              {cloud?.targetAmount
                ? `${cloud.targetAmount} ${cloud.unitLabel || ""}`
                : "未指定"}
            </p>
            {cloud?.frequencyDays && <p>频次: {cloud.frequencyDays}</p>}
            {cloud?.whyPrompt && <p className="truncate">初衷: {cloud.whyPrompt}</p>}
          </div>
        </div>

        <div className="rounded-md border border-primary/20 bg-primary/5 p-2.5 space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-semibold text-primary">
            <span>💻 {migDict.localVersion}</span>
          </div>
          <div className="space-y-1 text-[11px] text-foreground">
            <p>
              目标量:{" "}
              {local.targetAmount
                ? `${local.targetAmount} ${local.unitLabel || ""}`
                : "未指定"}
            </p>
            {local.frequencyDays && <p>频次: {local.frequencyDays}</p>}
            {local.whyPrompt && <p className="truncate">初衷: {local.whyPrompt}</p>}
          </div>
        </div>
      </div>

      {/* Action Selection Buttons */}
      <div className="flex flex-wrap items-center gap-1.5 pt-1">
        <button
          type="button"
          onClick={() => onSelectAction("skip")}
          className={cn(
            "rounded-md border px-2.5 py-1 text-xs font-medium transition-all",
            analysis.selectedAction === "skip"
              ? "border-primary bg-primary text-primary-foreground font-semibold"
              : "border-border text-muted-foreground hover:bg-muted"
          )}
        >
          {migDict.keepCloud}
        </button>

        <button
          type="button"
          onClick={() => onSelectAction("overwrite")}
          className={cn(
            "rounded-md border px-2.5 py-1 text-xs font-medium transition-all",
            analysis.selectedAction === "overwrite"
              ? "border-primary bg-primary text-primary-foreground font-semibold"
              : "border-border text-muted-foreground hover:bg-muted"
          )}
        >
          {migDict.overwriteCloud}
        </button>

        <button
          type="button"
          onClick={() => onSelectAction("keep_both")}
          className={cn(
            "rounded-md border px-2.5 py-1 text-xs font-medium transition-all",
            analysis.selectedAction === "keep_both"
              ? "border-primary bg-primary text-primary-foreground font-semibold"
              : "border-border text-muted-foreground hover:bg-muted"
          )}
        >
          {migDict.keepBoth}
        </button>
      </div>
    </div>
  )
}
