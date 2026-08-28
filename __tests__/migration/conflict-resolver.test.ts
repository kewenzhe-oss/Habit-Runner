import { ItemWithDetails } from "@/types"

import {
  analyzeConflicts,
  applyBatchResolution,
  buildMergePayload,
  extractDifferences,
  updateItemResolution,
} from "@/lib/migration/conflict-resolver"
import { LocalItemRecord } from "@/lib/migration/local-data"

describe("conflict-resolver", () => {
  const mockCloudHabit: ItemWithDetails = {
    id: "cloud_1",
    userId: "user_1",
    title: "每日阅读",
    type: "HABIT",
    layer: "CRAFT",
    status: "ACTIVE",
    targetAmount: 20,
    unitType: "TIME",
    unitLabel: "分钟",
    frequencyDays: "0,1,2,3,4,5,6",
    targetPerWeek: 7,
    whyPrompt: "拓展认知",
    triggerCue: "晚餐后",
    customCategory: "学习成长",
    categoryId: null,
    colorCode: "#10B981",
    dueDate: null,
    quitContext: null,
    highRiskWindow: null,
    todoRecurrence: null,
    sortOrder: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    archivedAt: null,
    category: null,
    actionPresets: [],
    toolLinks: [],
    _count: { checkIns: 5 },
  }

  it("extracts differences correctly when fields diverge", () => {
    const localPayload = {
      title: "每日阅读",
      type: "HABIT" as const,
      layer: "CRAFT" as const,
      targetAmount: 45, // Difference
      unitType: "TIME" as const,
      unitLabel: "分钟",
      frequencyDays: "1,2,3,4,5", // Difference
      targetPerWeek: 7,
      whyPrompt: "拓展认知",
      triggerCue: "睡前", // Difference
    }

    const diffs = extractDifferences(localPayload, mockCloudHabit)
    expect(diffs).toHaveLength(3)

    const fields = diffs.map((d) => d.field)
    expect(fields).toContain("targetAmount")
    expect(fields).toContain("frequencyDays")
    expect(fields).toContain("triggerCue")
  })

  it("returns no differences when items are identical", () => {
    const identicalPayload = {
      title: "每日阅读",
      type: "HABIT" as const,
      layer: "CRAFT" as const,
      targetAmount: 20,
      unitType: "TIME" as const,
      unitLabel: "分钟",
      frequencyDays: "0,1,2,3,4,5,6",
      targetPerWeek: 7,
      whyPrompt: "拓展认知",
      triggerCue: "晚餐后",
    }

    const diffs = extractDifferences(identicalPayload, mockCloudHabit)
    expect(diffs).toHaveLength(0)
  })

  it("analyzes mixture of local-only, identical, and conflicting items", () => {
    const localItems: LocalItemRecord[] = [
      // 1. Local only
      {
        localId: "local_1",
        payload: {
          title: "早起晨跑",
          type: "HABIT",
          layer: "BODY",
          targetAmount: 5,
          unitType: "COUNT",
          unitLabel: "公里",
        },
      },
      // 2. Identical with cloud_1
      {
        localId: "local_2",
        payload: {
          title: "每日阅读",
          type: "HABIT",
          layer: "CRAFT",
          targetAmount: 20,
          unitType: "TIME",
          unitLabel: "分钟",
          frequencyDays: "0,1,2,3,4,5,6",
          targetPerWeek: 7,
          whyPrompt: "拓展认知",
          triggerCue: "晚餐后",
        },
      },
      // 3. Conflicting with cloud_1 (different targetAmount)
      {
        localId: "local_3",
        payload: {
          title: "每日阅读",
          type: "HABIT",
          layer: "CRAFT",
          targetAmount: 60,
          unitType: "TIME",
          unitLabel: "分钟",
          whyPrompt: "深度研读",
        },
      },
    ]

    const plan = analyzeConflicts(localItems, [mockCloudHabit])

    expect(plan.totalLocalCount).toBe(3)
    expect(plan.localOnlyCount).toBe(1)
    expect(plan.identicalCount).toBe(1)
    expect(plan.conflictCount).toBe(1)

    // Check individual analysis
    const localOnly = plan.analyses.find((a) => a.localId === "local_1")
    expect(localOnly?.status).toBe("local_only")
    expect(localOnly?.selectedAction).toBe("create")

    const identical = plan.analyses.find((a) => a.localId === "local_2")
    expect(identical?.status).toBe("identical")
    expect(identical?.selectedAction).toBe("skip")

    const conflict = plan.analyses.find((a) => a.localId === "local_3")
    expect(conflict?.status).toBe("conflict")
    expect(conflict?.selectedAction).toBe("keep_both")
    expect(conflict?.differences.length).toBeGreaterThan(0)
  })

  it("applies batch resolutions properly", () => {
    const localItems: LocalItemRecord[] = [
      {
        localId: "local_c1",
        payload: {
          title: "每日阅读",
          type: "HABIT",
          layer: "CRAFT",
          targetAmount: 30,
        },
      },
    ]

    const initialPlan = analyzeConflicts(localItems, [mockCloudHabit])
    expect(initialPlan.analyses[0].selectedAction).toBe("keep_both")

    // Batch: Overwrite
    const overwritePlan = applyBatchResolution(initialPlan, "overwrite")
    expect(overwritePlan.analyses[0].selectedAction).toBe("overwrite")

    // Batch: Keep Cloud (skip)
    const keepCloudPlan = applyBatchResolution(overwritePlan, "keep_cloud")
    expect(keepCloudPlan.analyses[0].selectedAction).toBe("skip")

    // Single item update
    const customPlan = updateItemResolution(keepCloudPlan, "local_c1", "keep_both")
    expect(customPlan.analyses[0].selectedAction).toBe("keep_both")
  })

  it("builds merge payload correctly and attaches check-ins", () => {
    const localItems: LocalItemRecord[] = [
      {
        localId: "local_new",
        payload: {
          title: "冥想静心",
          type: "HABIT",
          layer: "CONTEMPLATION",
          targetAmount: 15,
        },
      },
      {
        localId: "local_conf",
        payload: {
          title: "每日阅读",
          type: "HABIT",
          layer: "CRAFT",
          targetAmount: 40,
        },
      },
    ]

    const plan = analyzeConflicts(localItems, [mockCloudHabit])
    const checkIns = [
      {
        localItemId: "local_new",
        date: "2026-08-28",
        status: "COMPLETED" as const,
        actionText: "专注呼吸 15 分钟",
      },
      {
        itemTitle: "每日阅读",
        date: "2026-08-27",
        status: "COMPLETED" as const,
      },
    ]

    const payload = buildMergePayload(plan, checkIns)

    expect(payload.operations).toHaveLength(2)

    const opNew = payload.operations.find((o) => o.localId === "local_new")
    expect(opNew?.action).toBe("create")
    expect(opNew?.checkIns).toHaveLength(1)
    expect(opNew?.checkIns?.[0].actionText).toBe("专注呼吸 15 分钟")

    const opConf = payload.operations.find((o) => o.localId === "local_conf")
    expect(opConf?.action).toBe("keep_both")
    expect(opConf?.customTitleSuffix).toBe(" (本地导入)")
    expect(opConf?.checkIns).toHaveLength(1)
  })
})
