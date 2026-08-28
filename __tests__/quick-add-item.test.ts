import { buildQuickAddItemPayload } from "@/lib/domain/quick-add-item"

const shared = {
  title: "  晨间阅读  ",
  whyPrompt: "  保持输入  ",
  layer: "SIGNAL" as const,
  finalCategory: "阅读",
  categoryId: undefined,
  unitType: "COUNT" as const,
  targetAmount: 12,
  unitLabel: "页",
  targetFrequency: "WEEKDAYS" as const,
  triggerCue: "早餐后",
  contextTags: "疲惫时",
  highRiskWindow: "23:00 后",
  dueDate: "2026-09-01",
  todoRecurring: "WEEKLY" as const,
  toolUrl: "https://read.example.com",
}

describe("quick-add item payload", () => {
  it("preserves every habit field needed after sign-in", () => {
    const payload = buildQuickAddItemPayload({ ...shared, type: "HABIT" })

    expect(payload).toMatchObject({
      title: "晨间阅读",
      whyPrompt: "保持输入",
      type: "HABIT",
      layer: "SIGNAL",
      customCategory: "阅读",
      unitType: "COUNT",
      targetAmount: 12,
      unitLabel: "页",
      frequencyDays: "1,2,3,4,5",
      targetPerWeek: 5,
      triggerCue: "早餐后",
      toolLinks: [{ title: "打开关联工具", url: "https://read.example.com" }],
    })
    expect(payload.actionPresets).toHaveLength(4)
  })

  it("preserves quit-habit context and risk window", () => {
    const payload = buildQuickAddItemPayload({
      ...shared,
      type: "QUIT_HABIT",
    })

    expect(payload).toMatchObject({
      type: "QUIT_HABIT",
      quitContext: "疲惫时",
      highRiskWindow: "23:00 后",
    })
  })

  it("preserves todo due date and recurrence", () => {
    const payload = buildQuickAddItemPayload({ ...shared, type: "TODO" })

    expect(payload).toMatchObject({
      type: "TODO",
      dueDate: "2026-09-01",
      todoRecurrence: "WEEKLY",
    })
  })
})
