import * as React from "react"
import { act, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import { RecommendedToolUrlField } from "@/components/items/recommended-tool-url-field"

const RECOMMENDATION = "https://postsoma-2050.website/"

function FieldHarness({ onSubmit }: { onSubmit: jest.Mock }) {
  const [value, setValue] = React.useState("")

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        onSubmit()
      }}
    >
      <RecommendedToolUrlField
        id="tool-url"
        label="关联外部工具 HTTPS 网址 (可选)"
        value={value}
        recommendation={RECOMMENDATION}
        onValueChange={setValue}
        recommendationLabel="推荐链接"
        enterHint="按 Enter 填入"
        appliedMessage="已填入推荐链接，可继续编辑"
      />
      <button type="button">下一字段</button>
    </form>
  )
}

describe("RecommendedToolUrlField", () => {
  it("supports Tab, fills the recommendation with Enter, and keeps focus", async () => {
    const user = userEvent.setup()
    const onSubmit = jest.fn()
    render(<FieldHarness onSubmit={onSubmit} />)

    await act(async () => {
      await user.tab()
    })
    const input = screen.getByLabelText("关联外部工具 HTTPS 网址 (可选)")
    expect(input).toHaveFocus()

    await act(async () => {
      await user.keyboard("{Enter}")
    })
    expect(input).toHaveValue(RECOMMENDATION)
    expect(input).toHaveFocus()
    expect(onSubmit).not.toHaveBeenCalled()

    await act(async () => {
      await user.tab()
    })
    expect(screen.getByRole("button", { name: "下一字段" })).toHaveFocus()
  })

  it("does not overwrite manual input or submit the form on Enter", async () => {
    const user = userEvent.setup()
    const onSubmit = jest.fn()
    render(<FieldHarness onSubmit={onSubmit} />)

    const input = screen.getByLabelText("关联外部工具 HTTPS 网址 (可选)")
    await act(async () => {
      await user.click(input)
      await user.type(input, "https://example.com/my-tool")
      await user.keyboard("{Enter}")
    })

    expect(input).toHaveValue("https://example.com/my-tool")
    expect(input).toHaveFocus()
    expect(onSubmit).not.toHaveBeenCalled()
  })
})
