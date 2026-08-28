import { render, screen } from "@testing-library/react"

import { buildLayerGrowthMatrix } from "@/lib/domain/layer-growth"
import { LayerGrowthMatrix } from "@/components/insights/layer-growth-matrix"

describe("LayerGrowthMatrix", () => {
  function buildNewHabitData() {
    return buildLayerGrowthMatrix({
      asOfDate: "2026-08-30",
      items: [
        {
          id: "new-habit",
          layer: "BODY",
          type: "HABIT",
          status: "ACTIVE",
          createdDate: "2026-08-29",
          frequencyDays: "0,1,2,3,4,5,6",
          targetPerWeek: 7,
        },
      ],
      checkIns: [
        { itemId: "new-habit", date: "2026-08-29", status: "COMPLETED" },
      ],
    })
  }

  it("prioritizes the current state and keeps methodology collapsed", () => {
    const data = buildNewHabitData()

    render(<LayerGrowthMatrix data={data} />)

    expect(screen.getByText("领域成长矩阵")).toBeInTheDocument()
    expect(
      screen.getByRole("columnheader", { name: "领域与当前状态" })
    ).toBeInTheDocument()
    expect(
      screen.getByRole("columnheader", { name: "30 天连接与趋势" })
    ).toBeInTheDocument()
    expect(
      screen.getByRole("columnheader", { name: "12 周连续轨迹" })
    ).toBeInTheDocument()
    expect(screen.getAllByText("数据沉淀中").length).toBeGreaterThan(0)
    expect(screen.getAllByText("暂无可比阶段").length).toBeGreaterThan(0)

    const methodologySummary = screen
      .getByText("查看计算口径")
      .closest("summary")
    const methodology = methodologySummary?.closest("details")
    expect(methodologySummary).toBeInTheDocument()
    expect(methodology).not.toHaveAttribute("open")
    expect(screen.getByText("CURRENT_PLAN_ESTIMATE")).toBeInTheDocument()
    expect(screen.getByText("false")).toBeInTheDocument()
    expect(screen.getByText(/事项，再以相同权重合并/)).toBeInTheDocument()
    expect(screen.getAllByText("0 个共同事项").length).toBeGreaterThan(0)
    expect(
      screen.queryByText(/成长最快|最弱领域|综合成长/)
    ).not.toBeInTheDocument()
  })

  it("keeps stage change expressed in percentage points", () => {
    const baseData = buildNewHabitData()
    const data = buildLayerGrowthMatrix({
      asOfDate: "2026-08-30",
      items: [],
      checkIns: [],
    })
    data.layers = baseData.layers.map((row) =>
      row.layer === "BODY"
        ? {
            ...row,
            foundation: {
              ...row.foundation,
              score: 72,
              sampleState: "SUFFICIENT" as const,
            },
            momentum: {
              currentScore: 72,
              previousScore: 60,
              deltaPercentagePoints: 12,
              comparableItemCount: 1,
              sampleState: "SUFFICIENT" as const,
            },
            phase: "GROWING" as const,
          }
        : row
    )

    render(<LayerGrowthMatrix data={data} />)

    expect(screen.getAllByText("+12 个百分点").length).toBeGreaterThan(0)
    expect(screen.queryByText("+12%")).not.toBeInTheDocument()
  })
})
