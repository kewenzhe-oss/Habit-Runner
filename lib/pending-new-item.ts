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
