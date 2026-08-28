import { fireEvent, render, screen } from "@testing-library/react"

import { QuickAddHabitModal } from "@/components/dashboard/quick-add-habit-modal"
import { ItemForm } from "@/components/items/item-form"

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode
    href: string
  }) => <a href={href}>{children}</a>,
}))

describe("life-layer default URL examples", () => {
  beforeEach(() => {
    localStorage.clear()
    global.fetch = jest.fn(() => new Promise(() => {})) as jest.Mock
  })

  it("updates the full form example without overwriting a manual URL", () => {
    render(<ItemForm mode="create" />)

    const input = screen.getByLabelText("关联外部工具 HTTPS 网址 (可选)")
    expect(input).toHaveAttribute("placeholder", "https://205077.xyz/")

    fireEvent.click(screen.getByRole("button", { name: "学习与输入" }))
    expect(input).toHaveAttribute(
      "placeholder",
      "https://postsomabooks.qzz.io/"
    )

    fireEvent.change(input, {
      target: { value: "https://example.com/my-tool" },
    })
    expect(fireEvent.keyDown(input, { key: "Enter", code: "Enter" })).toBe(
      false
    )
    expect(input).toHaveValue("https://example.com/my-tool")

    fireEvent.click(screen.getByRole("button", { name: "身体与能量" }))
    expect(input).toHaveValue("https://example.com/my-tool")
    expect(input).toHaveAttribute(
      "placeholder",
      "https://postsoma-2050.website/"
    )
  })

  it("fills an empty full-form URL with Enter and tracks it as a recommendation", () => {
    render(<ItemForm mode="create" />)

    const input = screen.getByLabelText("关联外部工具 HTTPS 网址 (可选)")
    fireEvent.focus(input)

    expect(
      screen.getByText(/推荐链接: https:\/\/205077\.xyz\/ · 按 Enter 填入/)
    ).toHaveClass("opacity-100")
    expect(fireEvent.keyDown(input, { key: "Enter", code: "Enter" })).toBe(
      false
    )
    expect(input).toHaveValue("https://205077.xyz/")
    expect(input).toHaveClass("bg-primary/5")
    expect(screen.getByRole("status")).toHaveTextContent(
      "已填入推荐链接，可继续编辑"
    )

    fireEvent.click(screen.getByRole("button", { name: "学习与输入" }))
    expect(input).toHaveValue("https://postsomabooks.qzz.io/")
  })

  it("uses the same centralized example in the quick-add form", () => {
    render(
      <QuickAddHabitModal
        isAuthenticated={false}
        onSuccess={jest.fn()}
        trigger={<button type="button">打开快速新建</button>}
      />
    )

    fireEvent.click(screen.getByRole("button", { name: "打开快速新建" }))
    fireEvent.click(screen.getByRole("button", { name: "决策与方向" }))
    fireEvent.click(screen.getByText("更多补充配置（动机、触发提示、分类等）"))

    expect(
      screen.getByLabelText("关联外部工具 HTTPS 网址 (可选)")
    ).toHaveAttribute("placeholder", "https://www.quantbrews.win/")

    const input = screen.getByLabelText("关联外部工具 HTTPS 网址 (可选)")
    fireEvent.focus(input)
    expect(fireEvent.keyDown(input, { key: "Enter", code: "Enter" })).toBe(
      false
    )
    expect(input).toHaveValue("https://www.quantbrews.win/")
  })
})
