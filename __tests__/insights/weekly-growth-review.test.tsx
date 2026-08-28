import { render, screen } from "@testing-library/react"

import { enumerateCalendarDates } from "@/lib/domain/date"
import { buildLayerGrowthMatrix } from "@/lib/domain/layer-growth"
import { WeeklyGrowthReview } from "@/components/insights/weekly-growth-review"

describe("WeeklyGrowthReview", () => {
  it("leads with a growth narrative instead of connection percentages", () => {
    const previousDates = enumerateCalendarDates("2026-07-02", "2026-07-31")
    const currentDates = enumerateCalendarDates("2026-08-01", "2026-08-30")
    const data = buildLayerGrowthMatrix({
      asOfDate: "2026-08-30",
      items: [
        {
          id: "body-rhythm",
          layer: "BODY",
          type: "HABIT",
          status: "ACTIVE",
          createdDate: "2026-06-01",
          frequencyDays: "0,1,2,3,4,5,6",
          targetPerWeek: 7,
        },
      ],
      checkIns: [
        ...previousDates.slice(0, 12).map((date) => ({
          itemId: "body-rhythm",
          date,
          status: "COMPLETED" as const,
        })),
        ...currentDates.slice(0, 18).map((date) => ({
          itemId: "body-rhythm",
          date,
          status: "COMPLETED" as const,
        })),
      ],
    })

    render(<WeeklyGrowthReview data={data} />)

    expect(
      screen.getByRole("heading", {
        name: "这段时间，你主要把生活放在了哪里？",
      })
    ).toBeInTheDocument()
    expect(screen.getByText("你的行动主要落在身体与能量。")).toBeInTheDocument()
    expect(screen.getByText(/集中扎根中/)).toBeInTheDocument()
    expect(screen.getByText("正在慢慢长出来")).toBeInTheDocument()
    expect(screen.getByText("继续守住")).toBeInTheDocument()
    expect(screen.queryByText(/\d+%/)).not.toBeInTheDocument()
  })

  it("uses settling language when the sample is still forming", () => {
    const data = buildLayerGrowthMatrix({
      asOfDate: "2026-08-30",
      items: [
        {
          id: "new-habit",
          layer: "SIGNAL",
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

    render(<WeeklyGrowthReview data={data} />)

    expect(screen.getAllByText("数据沉淀中").length).toBeGreaterThan(0)
    expect(screen.getByText("正在沉淀的节律")).toBeInTheDocument()
    expect(screen.queryByText("稳定扎根")).not.toBeInTheDocument()
  })
})
