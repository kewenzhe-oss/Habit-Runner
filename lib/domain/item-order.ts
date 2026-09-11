import type { ItemPriority } from "@/types"

const PRIORITY_RANK: Record<ItemPriority, number> = {
  HIGH: 0,
  NORMAL: 1,
  LOW: 2,
}

type SortableItem = {
  priority?: ItemPriority | null
  sortOrder: number
  createdAt: string
}

export function sortWithinStatusGroup<T extends SortableItem>(
  items: readonly T[]
): T[] {
  return items
    .map((item, index) => ({ item, index }))
    .sort(
      (a, b) =>
        PRIORITY_RANK[a.item.priority ?? "NORMAL"] -
          PRIORITY_RANK[b.item.priority ?? "NORMAL"] ||
        a.item.sortOrder - b.item.sortOrder ||
        a.item.createdAt.localeCompare(b.item.createdAt) ||
        a.index - b.index
    )
    .map(({ item }) => item)
}
