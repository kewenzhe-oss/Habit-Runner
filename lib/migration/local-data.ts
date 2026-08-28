import { z } from "zod"

import { itemCreateSchema } from "@/lib/validations/item"
import {
  LocalCheckInInput,
  localCheckInSchema,
} from "@/lib/validations/migration"

export const PENDING_NEW_ITEM_KEY = "pending_new_item"
export const LOCAL_ITEMS_KEY = "habit_runner_local_items"
export const LEGACY_LOCAL_ITEMS_KEY = "local_items"
export const LOCAL_CHECKINS_KEY = "habit_runner_local_checkins"
export const LEGACY_LOCAL_CHECKINS_KEY = "local_checkins"
export const MIGRATION_STATUS_KEY = "habit_runner_migration_status"
export const MIGRATION_DISMISSED_KEY = "habit_runner_migration_dismissed"

export type LocalItemPayload = z.input<typeof itemCreateSchema>

export interface LocalItemRecord {
  localId: string
  payload: LocalItemPayload
  createdAt?: number
  migrated?: boolean
  source?: string
}

export interface LocalCheckInRecord extends LocalCheckInInput {
  localItemId?: string
  itemTitle?: string
}

export interface AccountMigrationRecord {
  migratedAt: number
  itemsCount: number
  accountEmail: string
  cleanedUp?: boolean
}

export interface MigrationStatusStore {
  accounts: Record<string, AccountMigrationRecord>
}

function browserStorage(): Storage | null {
  if (typeof window === "undefined") return null
  try {
    return window.localStorage
  } catch {
    return null
  }
}

function safeGetItem(storage: Storage, key: string): string | null {
  try {
    return storage.getItem(key)
  } catch {
    return null
  }
}

function safeSetItem(storage: Storage, key: string, value: string): boolean {
  try {
    storage.setItem(key, value)
    return true
  } catch {
    return false
  }
}

function safeRemoveItem(storage: Storage, key: string): void {
  try {
    storage.removeItem(key)
  } catch {
    // Ignore storage write errors
  }
}

/**
 * Parses and sanitizes a single item payload, safely falling back if invalid.
 */
export function sanitizeItemPayload(raw: any): LocalItemPayload | null {
  if (!raw || typeof raw !== "object") return null

  // If wrapped in payload property (e.g. pending_new_item)
  const candidate = raw.payload ? raw.payload : raw

  const result = itemCreateSchema.safeParse(candidate)
  if (result.success) {
    return result.data
  }
  return null
}

/**
 * Retrieves all pending un-migrated local items from LocalStorage across supported keys.
 */
export function getPendingLocalData(
  storage: Storage | null = browserStorage()
): LocalItemRecord[] {
  if (!storage) return []

  const records: LocalItemRecord[] = []
  const seenKeys = new Set<string>()

  // 1. Check pending_new_item draft
  try {
    const rawPending = safeGetItem(storage, PENDING_NEW_ITEM_KEY)
    if (rawPending) {
      const parsed = JSON.parse(rawPending)
      const payload = sanitizeItemPayload(parsed)
      if (payload) {
        const uniqueKey = `${payload.type}:${payload.title.trim().toLowerCase()}`
        seenKeys.add(uniqueKey)
        records.push({
          localId: `pending_${parsed.createdAt || Date.now()}`,
          payload,
          createdAt: parsed.createdAt || Date.now(),
          migrated: false,
          source: "草稿暂存",
        })
      }
    }
  } catch {
    // Ignore corrupt pending item
  }

  // 2. Check habit_runner_local_items and fallback local_items
  const listKeys = [LOCAL_ITEMS_KEY, LEGACY_LOCAL_ITEMS_KEY]
  for (const listKey of listKeys) {
    try {
      const rawList = safeGetItem(storage, listKey)
      if (rawList) {
        const parsedList = JSON.parse(rawList)
        if (Array.isArray(parsedList)) {
          for (let i = 0; i < parsedList.length; i++) {
            const rawItem = parsedList[i]
            if (rawItem?.migrated === true) continue

            const payload = sanitizeItemPayload(rawItem)
            if (payload) {
              const uniqueKey = `${payload.type}:${payload.title.trim().toLowerCase()}`
              // Avoid exact duplicate from same storage load
              const localId =
                rawItem.id ||
                rawItem.localId ||
                `local_${listKey}_${i}_${Date.now()}`
              if (!seenKeys.has(uniqueKey)) {
                seenKeys.add(uniqueKey)
                records.push({
                  localId,
                  payload,
                  createdAt: rawItem.createdAt || Date.now(),
                  migrated: false,
                  source: "本地创建",
                })
              }
            }
          }
        }
      }
    } catch {
      // Ignore corrupt list item
    }
  }

  return records
}

/**
 * Retrieves all pending local check-ins.
 */
export function getPendingLocalCheckIns(
  storage: Storage | null = browserStorage()
): LocalCheckInRecord[] {
  if (!storage) return []

  const checkIns: LocalCheckInRecord[] = []
  const keys = [LOCAL_CHECKINS_KEY, LEGACY_LOCAL_CHECKINS_KEY]

  for (const key of keys) {
    try {
      const raw = safeGetItem(storage, key)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) {
          for (const item of parsed) {
            const valid = localCheckInSchema.safeParse(item)
            if (valid.success) {
              checkIns.push({
                ...valid.data,
                localItemId: item.localItemId || item.itemId,
                itemTitle: item.itemTitle || item.title,
              })
            }
          }
        }
      }
    } catch {
      // Ignore corrupted check-in data
    }
  }

  return checkIns
}

/**
 * Reads migration store status.
 */
export function getMigrationStatus(
  storage: Storage | null = browserStorage()
): MigrationStatusStore {
  if (!storage) return { accounts: {} }

  try {
    const raw = safeGetItem(storage, MIGRATION_STATUS_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed && typeof parsed === "object") {
        return {
          accounts: parsed.accounts || {},
        }
      }
    }
  } catch {
    // fallback
  }

  return { accounts: {} }
}

/**
 * Checks if migration should be prompted for the specified user email.
 */
export function isMigrationEligible(
  userEmail?: string | null,
  storage: Storage | null = browserStorage()
): boolean {
  if (!storage || !userEmail) return false

  // Check if temporarily dismissed in current session
  try {
    const rawDismissed = safeGetItem(storage, MIGRATION_DISMISSED_KEY)
    if (rawDismissed) {
      const dismissed = JSON.parse(rawDismissed)
      if (dismissed && dismissed[userEmail.toLowerCase()]) {
        return false
      }
    }
  } catch {
    // ignore
  }

  const items = getPendingLocalData(storage)
  if (items.length === 0) return false

  const statusStore = getMigrationStatus(storage)
  const normalizedEmail = userEmail.trim().toLowerCase()
  const accountRecord = statusStore.accounts[normalizedEmail]

  // If already migrated for this account and no new items added since migration
  if (accountRecord && accountRecord.migratedAt) {
    const unmigratedNewItems = items.filter(
      (item) => item.createdAt && item.createdAt > accountRecord.migratedAt
    )
    return unmigratedNewItems.length > 0
  }

  return true
}

/**
 * Records that migration has completed successfully for the target account.
 */
export function markMigrationCompleted(
  userEmail: string,
  details: { itemsCount: number },
  storage: Storage | null = browserStorage()
): boolean {
  if (!storage || !userEmail) return false

  try {
    const normalizedEmail = userEmail.trim().toLowerCase()
    const currentStatus = getMigrationStatus(storage)

    currentStatus.accounts[normalizedEmail] = {
      migratedAt: Date.now(),
      itemsCount: details.itemsCount,
      accountEmail: normalizedEmail,
      cleanedUp: false,
    }

    safeSetItem(storage, MIGRATION_STATUS_KEY, JSON.stringify(currentStatus))

    // Clear single draft item
    safeRemoveItem(storage, PENDING_NEW_ITEM_KEY)

    // Mark items inside LOCAL_ITEMS_KEY as migrated
    const rawList = safeGetItem(storage, LOCAL_ITEMS_KEY)
    if (rawList) {
      try {
        const parsed = JSON.parse(rawList)
        if (Array.isArray(parsed)) {
          const updated = parsed.map((item) => ({ ...item, migrated: true }))
          safeSetItem(storage, LOCAL_ITEMS_KEY, JSON.stringify(updated))
        }
      } catch {
        // ignore
      }
    }

    // Reset dismissal flag
    try {
      const rawDismissed = safeGetItem(storage, MIGRATION_DISMISSED_KEY)
      if (rawDismissed) {
        const dismissed = JSON.parse(rawDismissed)
        delete dismissed[normalizedEmail]
        safeSetItem(storage, MIGRATION_DISMISSED_KEY, JSON.stringify(dismissed))
      }
    } catch {
      // ignore
    }

    return true
  } catch {
    return false
  }
}

/**
 * Temporarily dismisses migration for this session.
 */
export function dismissMigration(
  userEmail: string,
  storage: Storage | null = browserStorage()
): void {
  if (!storage || !userEmail) return

  try {
    const normalizedEmail = userEmail.trim().toLowerCase()
    let dismissed: Record<string, number> = {}
    const raw = safeGetItem(storage, MIGRATION_DISMISSED_KEY)
    if (raw) {
      dismissed = JSON.parse(raw) || {}
    }
    dismissed[normalizedEmail] = Date.now()
    safeSetItem(storage, MIGRATION_DISMISSED_KEY, JSON.stringify(dismissed))
  } catch {
    // ignore
  }
}

/**
 * Safely cleans up local items and drafts after user confirmation.
 */
export function clearLocalData(
  storage: Storage | null = browserStorage()
): void {
  if (!storage) return

  safeRemoveItem(storage, PENDING_NEW_ITEM_KEY)
  safeRemoveItem(storage, LOCAL_ITEMS_KEY)
  safeRemoveItem(storage, LEGACY_LOCAL_ITEMS_KEY)
  safeRemoveItem(storage, LOCAL_CHECKINS_KEY)
  safeRemoveItem(storage, LEGACY_LOCAL_CHECKINS_KEY)
}

/**
 * Helper to save local items (e.g. in guest / offline mode) for testing and usage.
 */
export function saveLocalItem(
  payload: LocalItemPayload,
  storage: Storage | null = browserStorage()
): boolean {
  if (!storage) return false

  try {
    const raw = safeGetItem(storage, LOCAL_ITEMS_KEY)
    let list: any[] = []
    if (raw) {
      list = JSON.parse(raw) || []
    }
    list.push({
      localId: `item_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      payload,
      createdAt: Date.now(),
      migrated: false,
    })
    return safeSetItem(storage, LOCAL_ITEMS_KEY, JSON.stringify(list))
  } catch {
    return false
  }
}
