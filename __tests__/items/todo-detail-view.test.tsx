import { render, screen } from "@testing-library/react"
import { TodoDetailView } from "@/components/items/todo-detail-view"
import { ItemDetailDTO } from "@/types"
import { getDictionary } from "@/lib/i18n"

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: jest.fn(),
  }),
}))

describe("TodoDetailView", () => {
  const dict = getDictionary("zh")
  const mockTodo: ItemDetailDTO = {
    id: "todo_1",
    userId: "user_1",
    title: "缴纳本季度物业费",
    whyPrompt: "避免产生滞纳金",
    type: "TODO",
    layer: "LIFE",
    customCategory: "生活琐事",
    status: "ACTIVE",
    colorCode: "#3B82F6",
    frequencyDays: null,
    targetPerWeek: null,
    unitType: null,
    targetAmount: null,
    unitLabel: null,
    dueDate: "2026-09-01",
    recommendedAction: null,
    actionPresets: [],
    toolLinks: [],
    createdAt: new Date("2026-08-20T10:00:00.000Z"),
    updatedAt: new Date("2026-08-20T10:00:00.000Z"),
    checkIns: [],
  }

  test("renders task title, category, due date and completion button", () => {
    render(<TodoDetailView item={mockTodo} />)

    expect(screen.getByText("缴纳本季度物业费")).toBeInTheDocument()
    expect(screen.getByText("生活琐事")).toBeInTheDocument()
    expect(screen.getByText("待办中")).toBeInTheDocument()
    expect(screen.getByText("标记为已办结")).toBeInTheDocument()
  })

  test("does not render streak cards or heatmap charts", () => {
    render(<TodoDetailView item={mockTodo} />)

    expect(screen.queryByText(/当前连续/)).toBeNull()
    expect(screen.queryByText(/节律连续/)).toBeNull()
    expect(screen.queryByText(/统计区间/)).toBeNull()
  })
})
