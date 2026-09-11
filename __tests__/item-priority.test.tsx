import { useState } from "react"
import type { ItemPriority } from "@/types"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import { sortWithinStatusGroup } from "@/lib/domain/item-order"
import { readPendingNewItem, savePendingNewItem } from "@/lib/pending-new-item"
import { itemCreateSchema, itemUpdateSchema } from "@/lib/validations/item"
import { ItemPrioritySelector } from "@/components/items/item-priority-selector"

describe("item priority", () => {
  const base = { sortOrder: 0, createdAt: "2026-08-01T00:00:00.000Z" }
  it("moves a newer high priority item first and preserves default ordering within levels", () => {
    const items = [
      { ...base, id: "low", priority: "LOW" as const },
      {
        ...base,
        id: "normal-later",
        priority: "NORMAL" as const,
        sortOrder: 2,
      },
      { ...base, id: "legacy" },
      {
        ...base,
        id: "high-new",
        priority: "HIGH" as const,
        createdAt: "2026-09-01T00:00:00.000Z",
      },
      { ...base, id: "normal-tie", priority: "NORMAL" as const },
    ]
    const original = [...items]
    expect(sortWithinStatusGroup(items).map((item) => item.id)).toEqual([
      "high-new",
      "legacy",
      "normal-tie",
      "normal-later",
      "low",
    ])
    expect(items).toEqual(original)
  })

  it("keeps PATCH omission distinct from an explicit reset and rejects unknown levels", () => {
    expect(itemUpdateSchema.parse({ title: "Updated" })).not.toHaveProperty(
      "priority"
    )
    expect(itemUpdateSchema.parse({ priority: "NORMAL" })).toEqual({
      priority: "NORMAL",
    })
    expect(
      itemCreateSchema.safeParse({
        title: "Read",
        type: "HABIT",
        priority: "URGENT",
      }).success
    ).toBe(false)
  })

  it("retains priority through sign-in drafts and accepts legacy drafts", () => {
    localStorage.clear()
    const draft = {
      title: "Read",
      type: "HABIT" as const,
      layer: "SIGNAL" as const,
    }
    savePendingNewItem({ ...draft, priority: "HIGH" }, localStorage, 1000)
    expect(readPendingNewItem(localStorage, 2000)).toMatchObject({
      status: "valid",
      value: { payload: { priority: "HIGH" } },
    })
    savePendingNewItem(draft, localStorage, 1000)
    expect(readPendingNewItem(localStorage, 2000)).toMatchObject({
      status: "valid",
      value: { payload: draft },
    })
  })

  it("supports arrow-key selection without submitting the form", async () => {
    const submit = jest.fn((event) => event.preventDefault())
    function Form() {
      const [value, setValue] = useState<ItemPriority>("NORMAL")
      return (
        <form onSubmit={submit}>
          <ItemPrioritySelector value={value} onChange={setValue} />
          <button type="submit">Save</button>
        </form>
      )
    }
    const user = userEvent.setup()
    render(<Form />)
    await user.tab()
    expect(screen.getByRole("radio", { name: "P1 · 常规" })).toHaveFocus()
    await user.keyboard("{ArrowLeft}")
    expect(screen.getByRole("radio", { name: "P0 · 优先" })).toBeChecked()
    expect(submit).not.toHaveBeenCalled()
    await user.tab()
    expect(screen.getByRole("button", { name: "Save" })).toHaveFocus()
  })
})
