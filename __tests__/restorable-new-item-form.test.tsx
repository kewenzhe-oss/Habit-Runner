import { render, screen, waitFor } from "@testing-library/react"

import {
  PENDING_NEW_ITEM_KEY,
  savePendingNewItem,
} from "@/lib/pending-new-item"
import { RestorableNewItemForm } from "@/components/items/restorable-new-item-form"

const mockReplace = jest.fn()
const mockRefresh = jest.fn()
const mockToast = jest.fn()

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: mockReplace,
    refresh: mockRefresh,
  }),
}))

jest.mock("@/components/ui/use-toast", () => ({
  toast: (args: unknown) => mockToast(args),
}))

jest.mock("@/components/items/item-form", () => ({
  ItemForm: ({ initialDraft }: { initialDraft?: { title: string } }) => (
    <div data-testid="item-form">{initialDraft?.title || "empty"}</div>
  ),
}))

const payload = {
  title: "登录前填写的阅读计划",
  type: "HABIT" as const,
  layer: "SIGNAL" as const,
  unitType: "TIME" as const,
  targetAmount: 20,
  unitLabel: "分钟",
  frequencyDays: "0,1,2,3,4,5,6",
  targetPerWeek: 7,
}

describe("restorable new-item flow", () => {
  beforeEach(() => {
    localStorage.clear()
    mockReplace.mockClear()
    mockRefresh.mockClear()
    mockToast.mockClear()
    global.fetch = jest.fn()
  })

  it("silently creates a valid pending item and clears the draft", async () => {
    savePendingNewItem(payload)
    ;(global.fetch as jest.Mock).mockResolvedValue({ ok: true, status: 201 })

    render(<RestorableNewItemForm restore />)

    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith("/dashboard"))
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/items",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify(payload),
      })
    )
    expect(localStorage.getItem(PENDING_NEW_ITEM_KEY)).toBeNull()
    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({ title: "已为你保存刚才填写的事项" })
    )
  })

  it("prefills the full form when server validation needs attention", async () => {
    savePendingNewItem(payload)
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 422,
      json: async () => [{ message: "目标量需要调整" }],
    })

    render(<RestorableNewItemForm restore />)

    expect(await screen.findByTestId("item-form")).toHaveTextContent(
      payload.title
    )
    expect(localStorage.getItem(PENDING_NEW_ITEM_KEY)).not.toBeNull()
    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "保存前还需要调整",
        description: "目标量需要调整",
      })
    )
  })
})
