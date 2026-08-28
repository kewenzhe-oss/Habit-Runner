"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { ItemWithDetails } from "@/types"

import {
  analyzeConflicts,
  applyBatchResolution,
  buildMergePayload,
  MigrationPlan,
  updateItemResolution,
} from "@/lib/migration/conflict-resolver"
import {
  clearLocalData,
  dismissMigration,
  getPendingLocalCheckIns,
  getPendingLocalData,
  isMigrationEligible,
  LocalCheckInRecord,
  LocalItemRecord,
  markMigrationCompleted,
} from "@/lib/migration/local-data"
import { MigrationAction } from "@/lib/validations/migration"
import { toast } from "@/components/ui/use-toast"
import { useI18n } from "@/lib/i18n"

export interface UseLocalMigrationOptions {
  userEmail?: string | null
  onSuccess?: () => void
}

export function useLocalMigration({
  userEmail,
  onSuccess,
}: UseLocalMigrationOptions) {
  const router = useRouter()
  const { dict, format } = useI18n()
  const migDict = dict.dashboard.migration

  const [isChecking, setIsChecking] = React.useState(true)
  const [isEligible, setIsEligible] = React.useState(false)
  const [pendingItems, setPendingItems] = React.useState<LocalItemRecord[]>([])
  const [pendingCheckIns, setPendingCheckIns] = React.useState<
    LocalCheckInRecord[]
  >([])

  const [isModalOpen, setIsModalOpen] = React.useState(false)
  const [isAnalyzing, setIsAnalyzing] = React.useState(false)
  const [isMerging, setIsMerging] = React.useState(false)
  const [migrationPlan, setMigrationPlan] = React.useState<MigrationPlan | null>(
    null
  )
  const [step, setStep] = React.useState<
    "idle" | "review" | "merging" | "completed"
  >("idle")
  const [mergeStats, setMergeStats] = React.useState<{
    merged: number
    overwritten: number
    skipped: number
  } | null>(null)

  const checkEligibility = React.useCallback(() => {
    if (!userEmail) {
      setIsEligible(false)
      setIsChecking(false)
      return
    }

    const eligible = isMigrationEligible(userEmail)
    const items = getPendingLocalData()
    const checkIns = getPendingLocalCheckIns()

    setPendingItems(items)
    setPendingCheckIns(checkIns)
    setIsEligible(eligible && items.length > 0)
    setIsChecking(false)
  }, [userEmail])

  React.useEffect(() => {
    checkEligibility()
  }, [checkEligibility])

  const openMigration = async () => {
    if (!userEmail || pendingItems.length === 0) return

    setIsModalOpen(true)
    setIsAnalyzing(true)
    setStep("review")

    try {
      const res = await fetch("/api/items")
      const cloudItems: ItemWithDetails[] = res.ok ? await res.json() : []
      const plan = analyzeConflicts(pendingItems, cloudItems)
      setMigrationPlan(plan)
    } catch (err) {
      console.error("Failed to analyze cloud items", err)
      const fallbackPlan = analyzeConflicts(pendingItems, [])
      setMigrationPlan(fallbackPlan)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleUpdateItemAction = (
    localId: string,
    action: MigrationAction
  ) => {
    if (!migrationPlan) return
    const updated = updateItemResolution(migrationPlan, localId, action)
    setMigrationPlan(updated)
  }

  const handleBatchResolution = (
    action: "keep_both" | "overwrite" | "keep_cloud"
  ) => {
    if (!migrationPlan) return
    const updated = applyBatchResolution(migrationPlan, action)
    setMigrationPlan(updated)
  }

  const handleExecuteMerge = async () => {
    if (!migrationPlan || !userEmail) return

    setIsMerging(true)
    setStep("merging")

    try {
      const payload = buildMergePayload(migrationPlan, pendingCheckIns)

      const response = await fetch("/api/migration/merge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error("Merge request failed")
      }

      const result = await response.json()

      // Record successful migration safely
      markMigrationCompleted(userEmail, {
        itemsCount: pendingItems.length,
      })

      const stats = {
        merged: result.mergedCount || 0,
        overwritten: result.overwrittenCount || 0,
        skipped: result.skippedCount || 0,
      }
      setMergeStats(stats)
      setStep("completed")
      setIsEligible(false)

      toast({
        title: migDict.successTitle,
        description: format(migDict.successDescription, stats),
      })

      if (onSuccess) {
        onSuccess()
      } else {
        router.refresh()
      }
    } catch (err) {
      console.error("Migration merge failed", err)
      setStep("review")
      toast({
        title: migDict.errorTitle,
        description: migDict.errorDescription,
        variant: "destructive",
      })
    } finally {
      setIsMerging(false)
    }
  }

  const handleDismiss = () => {
    if (userEmail) {
      dismissMigration(userEmail)
    }
    setIsEligible(false)
    setIsModalOpen(false)
  }

  const handleCleanLocalData = () => {
    clearLocalData()
    setIsModalOpen(false)
    toast({
      title: migDict.cleanedToastTitle,
    })
  }

  const handleKeepLocalBackup = () => {
    setIsModalOpen(false)
    toast({
      title: migDict.backupKeptToastTitle,
    })
  }

  return {
    isChecking,
    isEligible,
    pendingItems,
    pendingCount: pendingItems.length,
    isModalOpen,
    setIsModalOpen,
    isAnalyzing,
    isMerging,
    migrationPlan,
    step,
    mergeStats,
    openMigration,
    handleUpdateItemAction,
    handleBatchResolution,
    handleExecuteMerge,
    handleDismiss,
    handleCleanLocalData,
    handleKeepLocalBackup,
  }
}
