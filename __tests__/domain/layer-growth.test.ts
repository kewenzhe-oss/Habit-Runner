import { enumerateCalendarDates } from "@/lib/domain/date"
import {
  buildLayerGrowthMatrix,
  LayerGrowthCheckInInput,
  LayerGrowthItemInput,
} from "@/lib/domain/layer-growth"

const asOfDate = "2026-08-30"

function habit(
  overrides: Partial<LayerGrowthItemInput> & Pick<LayerGrowthItemInput, "id">
): LayerGrowthItemInput {
  const { id, ...rest } = overrides
  return {
    id,
    layer: "BODY",
    type: "HABIT",
    status: "ACTIVE",
    createdDate: "2026-06-01",
    frequencyDays: "0,1,2,3,4,5,6",
    targetPerWeek: 7,
    ...rest,
  }
}

function completed(
  itemId: string,
  dates: string[],
  status: LayerGrowthCheckInInput["status"] = "COMPLETED"
): LayerGrowthCheckInInput[] {
  return dates.map((date) => ({ itemId, date, status }))
}

describe("layer growth aggregator", () => {
  it("uses equal item weighting for the connection foundation", () => {
    const daily = habit({ id: "daily" })
    const newItem = habit({ id: "new", createdDate: asOfDate })
    const currentDates = enumerateCalendarDates("2026-08-01", asOfDate)
    const data = buildLayerGrowthMatrix({
      asOfDate,
      items: [daily, newItem],
      checkIns: [
        ...completed("daily", currentDates.slice(0, 9)),
        ...completed("new", [asOfDate]),
      ],
    })

    const body = data.layers.find((layer) => layer.layer === "BODY")!
    expect(body.foundation.score).toBe(65)
    expect(body.foundation.connectedCount).toBe(10)
    expect(body.foundation.opportunityCount).toBe(31)
    expect(body.itemCount).toBe(2)
  })

  it("counts intentional rest as connection and not a quit lapse", () => {
    const restHabit = habit({ id: "rest-habit", createdDate: asOfDate })
    const quit = habit({
      id: "quit",
      type: "QUIT_HABIT",
      createdDate: asOfDate,
      frequencyDays: null,
      targetPerWeek: null,
    })
    const data = buildLayerGrowthMatrix({
      asOfDate,
      items: [restHabit, quit],
      checkIns: [
        ...completed("rest-habit", [asOfDate], "REST"),
        ...completed("quit", [asOfDate], "LAPSED"),
      ],
    })

    const body = data.layers.find((layer) => layer.layer === "BODY")!
    expect(body.foundation.connectedCount).toBe(1)
    expect(body.foundation.opportunityCount).toBe(2)
    expect(body.foundation.score).toBe(50)
  })

  it("suppresses deterministic growth output when samples are insufficient", () => {
    const newItem = habit({ id: "new", createdDate: "2026-08-29" })
    const data = buildLayerGrowthMatrix({
      asOfDate,
      items: [newItem],
      checkIns: completed("new", ["2026-08-29"]),
    })

    const body = data.layers.find((layer) => layer.layer === "BODY")!
    expect(body.foundation.sampleState).toBe("FORMING")
    expect(body.momentum.sampleState).toBe("NO_COMPARISON")
    expect(body.momentum.deltaPercentagePoints).toBeNull()
    expect(body.phase).toBe("DATA_FORMING")
  })

  it("compares sufficient shared cohorts across adjacent 30-day periods", () => {
    const stableHabit = habit({ id: "stable" })
    const previousDates = enumerateCalendarDates("2026-07-02", "2026-07-31")
    const currentDates = enumerateCalendarDates("2026-08-01", asOfDate)
    const data = buildLayerGrowthMatrix({
      asOfDate,
      items: [stableHabit],
      checkIns: [
        ...completed("stable", previousDates.slice(0, 12)),
        ...completed("stable", currentDates.slice(0, 18)),
      ],
    })

    const body = data.layers.find((layer) => layer.layer === "BODY")!
    expect(body.momentum.currentScore).toBe(60)
    expect(body.momentum.previousScore).toBe(40)
    expect(body.momentum.deltaPercentagePoints).toBe(20)
    expect(body.momentum.sampleState).toBe("SUFFICIENT")
    expect(body.phase).toBe("GROWING")
  })

  it("returns twelve natural-week points and an explicit estimate basis", () => {
    const data = buildLayerGrowthMatrix({
      asOfDate,
      items: [habit({ id: "daily" })],
      checkIns: [],
    })

    const body = data.layers.find((layer) => layer.layer === "BODY")!
    expect(body.stability.weeklySeries).toHaveLength(12)
    expect(data.dataBasis).toEqual({
      planBasis: "CURRENT_PLAN_ESTIMATE",
      historyComplete: false,
    })
    expect(data.periods.current30).toEqual({
      from: "2026-08-01",
      to: "2026-08-30",
    })
  })

  it("uses an archive date as the end of the estimated active period", () => {
    const archived = habit({
      id: "archived",
      archivedDate: "2026-08-05",
      status: "ARCHIVED",
    })
    const data = buildLayerGrowthMatrix({
      asOfDate,
      items: [archived],
      checkIns: completed("archived", ["2026-08-01"]),
    })

    const body = data.layers.find((layer) => layer.layer === "BODY")!
    expect(body.foundation.opportunityCount).toBe(5)
    expect(body.foundation.connectedCount).toBe(1)
  })

  it("estimates recurring todo opportunities without treating them as daily habits", () => {
    const weeklyTodo: LayerGrowthItemInput = {
      id: "weekly-todo",
      layer: "CRAFT",
      type: "TODO",
      status: "ACTIVE",
      createdDate: "2026-08-01",
      dueDate: "2026-08-03",
      todoRecurrence: "WEEKLY",
    }
    const data = buildLayerGrowthMatrix({
      asOfDate,
      items: [weeklyTodo],
      checkIns: completed("weekly-todo", [
        "2026-08-03",
        "2026-08-10",
        "2026-08-17",
      ]),
    })

    const craft = data.layers.find((layer) => layer.layer === "CRAFT")!
    expect(craft.foundation.opportunityCount).toBe(4)
    expect(craft.foundation.connectedCount).toBe(3)
    expect(craft.foundation.score).toBe(75)
  })

  it("keeps no-plan layers distinct from zero connection", () => {
    const data = buildLayerGrowthMatrix({
      asOfDate,
      items: [],
      checkIns: [],
    })

    const life = data.layers.find((layer) => layer.layer === "LIFE")!
    expect(life.foundation.score).toBeNull()
    expect(life.foundation.sampleState).toBe("NO_PLAN")
    expect(life.phase).toBe("NO_PLAN")
  })
})
