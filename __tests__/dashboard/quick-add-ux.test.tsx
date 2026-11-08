import { fireEvent, render, screen } from "@testing-library/react"

import { QuickAddHabitModal } from "@/components/dashboard/quick-add-habit-modal"

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href, onClick }: any) => (
    <a href={href} onClick={onClick}>
      {children}
    </a>
  ),
}))

function openQuickAdd() {
  render(
    <QuickAddHabitModal
      isAuthenticated={false}
      onSuccess={jest.fn()}
      trigger={<button type="button">新增</button>}
    />
  )
  fireEvent.click(screen.getByRole("button", { name: "新增" }))
}

describe("quick add usability", () => {
  beforeEach(() => {
    global.fetch = jest.fn(() => new Promise(() => {})) as jest.Mock
  })

  afterEach(() => {
    jest.useRealTimers()
    jest.restoreAllMocks()
  })

  it("announces the selected item type and unit", () => {
    openQuickAdd()
    expect(screen.getByRole("button", { name: "正向习惯" })).toHaveAttribute(
      "aria-pressed",
      "true"
    )
    fireEvent.click(screen.getByRole("button", { name: "戒除行为" }))
    expect(screen.getByRole("button", { name: "戒除行为" })).toHaveAttribute(
      "aria-pressed",
      "true"
    )
    expect(screen.getByRole("button", { name: "正向习惯" })).toHaveAttribute(
      "aria-pressed",
      "false"
    )
    fireEvent.click(screen.getByRole("button", { name: "正向习惯" }))
    fireEvent.click(screen.getByRole("button", { name: /按数量/ }))
    expect(screen.getByRole("button", { name: /按数量/ })).toHaveAttribute(
      "aria-pressed",
      "true"
    )
  })

  it("allows the target to be cleared before entering a new value", () => {
    openQuickAdd()
    const target = screen.getByLabelText("目标量 *")
    fireEvent.change(target, { target: { value: "" } })
    expect(target).toHaveValue(null)
    fireEvent.change(target, { target: { value: "2222" } })
    expect(target).toHaveValue(2222)
  })

  it("uses the local calendar day for due date shortcuts", () => {
    jest.useFakeTimers().setSystemTime(new Date("2026-08-29T03:30:00Z"))
    const localDate = new Date()
    const expected = [
      localDate.getFullYear(),
      String(localDate.getMonth() + 1).padStart(2, "0"),
      String(localDate.getDate()).padStart(2, "0"),
    ].join("-")
    openQuickAdd()
    fireEvent.click(screen.getByRole("button", { name: "待办任务" }))
    fireEvent.click(screen.getByRole("button", { name: /今天截止/ }))
    expect(screen.getByLabelText("截止日期")).toHaveValue(expected)
  })

  it("carries entered data to full settings without saving it", () => {
    sessionStorage.clear()
    openQuickAdd()
    fireEvent.change(screen.getByLabelText("习惯名称 *"), {
      target: { value: "阅读" },
    })
    fireEvent.click(screen.getByRole("link", { name: /完整设置/ }))
    const draft = JSON.parse(
      sessionStorage.getItem("quick_add_transfer_draft") || "null"
    )
    expect(draft.payload).toMatchObject({ title: "阅读", type: "HABIT" })
    expect(global.fetch).toHaveBeenCalledTimes(1) // categories only
  })
})
