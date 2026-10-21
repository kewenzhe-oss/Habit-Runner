"use client"

import * as React from "react"
import type { TodayItemDTO } from "@/types"

import type {
  DashboardItemPatch,
  MutateDashboardItem,
} from "@/lib/domain/dashboard"

function applyPatch(
  items: TodayItemDTO[],
  id: string,
  patch: DashboardItemPatch
) {
  return patch === null
    ? items.filter((item) => item.id !== id)
    : items.map((item) => (item.id === id ? { ...item, ...patch } : item))
}

function version(item: TodayItemDTO) {
  return Math.max(
    Date.parse(item.updatedAt || "") || 0,
    Date.parse(item.todayCheckIn?.updatedAt || "") || 0
  )
}

/** Keep mutations in the list so sorting or filtering cannot lose pending state. */
export function useDashboardItems(initialItems: TodayItemDTO[]) {
  const [items, setItems] = React.useState(initialItems)
  const [pendingIds, setPendingIds] = React.useState<Set<string>>(new Set())
  const pending = React.useRef(new Map<string, DashboardItemPatch>())
  const committed = React.useRef(
    new Map<string, { patch: DashboardItemPatch; version: number }>()
  )

  const replaceItems = React.useCallback((incoming: TodayItemDTO[]) => {
    let nextItems = incoming
    committed.current.forEach((saved, id) => {
      const incomingItem = incoming.find((row) => row.id === id)
      if (
        incomingItem &&
        (saved.patch === null || version(incomingItem) < saved.version)
      ) {
        nextItems = applyPatch(nextItems, id, saved.patch)
      } else {
        committed.current.delete(id)
      }
    })
    pending.current.forEach((patch, id) => {
      nextItems = applyPatch(nextItems, id, patch)
    })
    setItems(nextItems)
  }, [])

  React.useEffect(() => {
    replaceItems(initialItems)
  }, [initialItems, replaceItems])

  const mutateItem: MutateDashboardItem = React.useCallback(
    async (item, optimistic, save) => {
      if (pending.current.has(item.id)) return
      pending.current.set(item.id, optimistic)
      setPendingIds(new Set(pending.current.keys()))
      setItems((current) => applyPatch(current, item.id, optimistic))
      try {
        const result = await save()
        const previous = committed.current.get(item.id)?.patch
        committed.current.set(item.id, {
          patch: result === null ? null : { ...previous, ...result },
          version:
            result === null ? version(item) : version({ ...item, ...result }),
        })
        setItems((current) => applyPatch(current, item.id, result))
      } catch (error) {
        setItems((current) => {
          if (current.some((row) => row.id === item.id)) {
            return current.map((row) => (row.id === item.id ? item : row))
          }
          return [...current, item]
        })
        throw error
      } finally {
        pending.current.delete(item.id)
        setPendingIds(new Set(pending.current.keys()))
      }
    },
    []
  )

  return { items, pendingIds, mutateItem, setItems: replaceItems }
}
