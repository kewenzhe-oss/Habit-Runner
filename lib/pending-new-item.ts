import { z } from "zod"

import { itemCreateSchema } from "@/lib/validations/item"

export const PENDING_NEW_ITEM_KEY = "pending_new_item"
export const PENDING_NEW_ITEM_TTL_MS = 30 * 60 * 1000

export type PendingNewItemPayload = z.infer<typeof itemCreateSchema>

const pendingNewItemSchema = z.object({
  version: z.literal(1),
  createdAt: z.number().int().nonnegative(),
  expiresAt: z.number().int().positive(),
  payload: itemCreateSchema,
})

export type PendingNewItem = z.infer<typeof pendingNewItemSchema>

export type PendingNewItemReadResult =
  | { status: "valid"; value: PendingNewItem }
  | { status: "missing" | "expired" | "invalid" }

function browserStorage(): Storage | null {
  if (typeof window === "undefined") return null
  try {
    return window.localStorage
  } catch {
    return null
  }
}

function removePendingKey(storage: Storage): void {
  try {
    storage.removeItem(PENDING_NEW_ITEM_KEY)
  } catch {
    // Storage access can be blocked independently of reading it.
  }
}

export function createPendingNewItem(
  payload: PendingNewItemPayload,
  now = Date.now()
): PendingNewItem {
  return pendingNewItemSchema.parse({
    version: 1,
    createdAt: now,
    expiresAt: now + PENDING_NEW_ITEM_TTL_MS,
    payload,
  })
}

export function savePendingNewItem(
  payload: PendingNewItemPayload,
  storage: Storage | null = browserStorage(),
  now = Date.now()
): boolean {
  if (!storage) return false
  try {
    storage.setItem(
      PENDING_NEW_ITEM_KEY,
      JSON.stringify(createPendingNewItem(payload, now))
    )
    return true
  } catch {
    return false
  }
}

export function readPendingNewItem(
  storage: Storage | null = browserStorage(),
  now = Date.now()
): PendingNewItemReadResult {
  if (!storage) return { status: "missing" }

  try {
    const raw = storage.getItem(PENDING_NEW_ITEM_KEY)
    if (!raw) return { status: "missing" }
    const parsed = pendingNewItemSchema.safeParse(JSON.parse(raw))
    if (!parsed.success) {
      removePendingKey(storage)
      return { status: "invalid" }
    }
    if (parsed.data.expiresAt <= now) {
      removePendingKey(storage)
      return { status: "expired" }
    }
    return { status: "valid", value: parsed.data }
  } catch {
    removePendingKey(storage)
    return { status: "invalid" }
  }
}

export function clearPendingNewItem(
  storage: Storage | null = browserStorage()
): void {
  if (storage) removePendingKey(storage)
}

// A separate, tab-scoped draft lets the full form open without submitting it.
const TRANSFER_DRAFT_KEY = "quick_add_transfer_draft"
const transferDraftSchema = itemCreateSchema.extend({
  title: z.string().max(64),
})

export function saveQuickAddTransfer(
  payload: PendingNewItemPayload,
  customCategoryInput = ""
): boolean {
  try {
    const parsed = transferDraftSchema.safeParse(payload)
    if (!parsed.success) return false
    window.sessionStorage.setItem(
      TRANSFER_DRAFT_KEY,
      JSON.stringify({ payload: parsed.data, customCategoryInput })
    )
    return true
  } catch {
    return false
  }
}

export function readQuickAddTransfer(): {
  payload: PendingNewItemPayload
  customCategoryInput: string
} | null {
  try {
    const raw = window.sessionStorage.getItem(TRANSFER_DRAFT_KEY)
    if (!raw) return null
    const stored = JSON.parse(raw)
    const parsed = transferDraftSchema.safeParse(stored.payload)
    if (
      !parsed.success ||
      typeof stored.customCategoryInput !== "string" ||
      stored.customCategoryInput.length > 32
    )
      return null
    return {
      payload: parsed.data,
      customCategoryInput: stored.customCategoryInput,
    }
  } catch {
    return null
  }
}

export function clearQuickAddTransfer(): void {
  try {
    window.sessionStorage.removeItem(TRANSFER_DRAFT_KEY)
  } catch {
    // Storage access may be blocked.
  }
}
