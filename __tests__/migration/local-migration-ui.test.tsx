import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import { LocalMigrationBanner } from "@/components/migration/local-migration-banner"
import { LocalMigrationDialog } from "@/components/migration/local-migration-dialog"
import { MigrationPlan } from "@/lib/migration/conflict-resolver"

describe("LocalMigrationBanner", () => {
  it("renders count, email, and triggers action callbacks", async () => {
    const user = userEvent.setup()
    const onMergeNow = jest.fn()
    const onRemindLater = jest.fn()

    render(
      <LocalMigrationBanner
        count={3}
        email="dwsun396@gmail.com"
        onMergeNow={onMergeNow}
        onRemindLater={onRemindLater}
      />
    )

    expect(screen.getByText(/3 条本地未同步数据/)).toBeInTheDocument()
    expect(screen.getByText(/dwsun396@gmail\.com/)).toBeInTheDocument()

    const mergeBtn = screen.getByRole("button", { name: /立即合并/ })
    await user.click(mergeBtn)
    expect(onMergeNow).toHaveBeenCalledTimes(1)

    const laterBtn = screen.getByRole("button", { name: /稍后处理/ })
    await user.click(laterBtn)
    expect(onRemindLater).toHaveBeenCalledTimes(1)
  })
})

describe("LocalMigrationDialog", () => {
  const mockPlan: MigrationPlan = {
    totalLocalCount: 2,
    localOnlyCount: 1,
    identicalCount: 0,
    conflictCount: 1,
    analyses: [
      {
        localId: "loc_conf",
        status: "conflict",
        localItem: {
          localId: "loc_conf",
          payload: {
            title: "每日阅读",
            type: "HABIT",
            layer: "CRAFT",
            targetAmount: 45,
            unitLabel: "分钟",
          },
        },
        cloudItem: {
          id: "cloud_1",
          userId: "u1",
          title: "每日阅读",
          type: "HABIT",
          layer: "CRAFT",
          status: "ACTIVE",
          targetAmount: 20,
          unitLabel: "分钟",
          createdAt: new Date(),
          updatedAt: new Date(),
          category: null,
          actionPresets: [],
          toolLinks: [],
          _count: { checkIns: 0 },
        } as any,
        differences: [
          {
            field: "targetAmount",
            fieldLabelZh: "目标量",
            fieldLabelEn: "Target Amount",
            cloudValue: 20,
            localValue: 45,
          },
        ],
        selectedAction: "keep_both",
      },
    ],
  }

  it("renders conflict comparison cards and triggers batch and item selections", async () => {
    const user = userEvent.setup()
    const onUpdateItemAction = jest.fn()
    const onBatchResolve = jest.fn()
    const onExecuteMerge = jest.fn()
    const onDismiss = jest.fn()

    render(
      <LocalMigrationDialog
        open={true}
        onOpenChange={jest.fn()}
        email="dwsun396@gmail.com"
        isAnalyzing={false}
        isMerging={false}
        step="review"
        migrationPlan={mockPlan}
        mergeStats={null}
        onUpdateItemAction={onUpdateItemAction}
        onBatchResolve={onBatchResolve}
        onExecuteMerge={onExecuteMerge}
        onDismiss={onDismiss}
        onCleanLocalData={jest.fn()}
        onKeepLocalBackup={jest.fn()}
      />
    )

    expect(screen.getByText("合并本地数据到云端账号")).toBeInTheDocument()
    expect(screen.getByText("每日阅读")).toBeInTheDocument()
    expect(screen.getByText(/内容存在差异/)).toBeInTheDocument()

    // Test Batch Button
    const batchKeepBothBtn = screen.getByRole("button", {
      name: /全部保留双份/,
    })
    await user.click(batchKeepBothBtn)
    expect(onBatchResolve).toHaveBeenCalledWith("keep_both")

    // Test Item Action Button
    const overwriteBtn = screen.getByRole("button", {
      name: /使用本地覆盖/,
    })
    await user.click(overwriteBtn)
    expect(onUpdateItemAction).toHaveBeenCalledWith("loc_conf", "overwrite")

    // Test Confirm Merge
    const confirmBtn = screen.getByRole("button", { name: /确认合并/ })
    await user.click(confirmBtn)
    expect(onExecuteMerge).toHaveBeenCalledTimes(1)
  })

  it("renders completed state with cleanup choices", async () => {
    const user = userEvent.setup()
    const onCleanLocalData = jest.fn()
    const onKeepLocalBackup = jest.fn()

    render(
      <LocalMigrationDialog
        open={true}
        onOpenChange={jest.fn()}
        email="dwsun396@gmail.com"
        isAnalyzing={false}
        isMerging={false}
        step="completed"
        migrationPlan={mockPlan}
        mergeStats={{
          merged: 2,
          overwritten: 1,
          skipped: 0,
        }}
        onUpdateItemAction={jest.fn()}
        onBatchResolve={jest.fn()}
        onExecuteMerge={jest.fn()}
        onDismiss={jest.fn()}
        onCleanLocalData={onCleanLocalData}
        onKeepLocalBackup={onKeepLocalBackup}
      />
    )

    expect(screen.getByText("数据合并成功")).toBeInTheDocument()
    expect(screen.getByText(/已合并 2 条，覆盖 1 条，跳过 0 条重复项/)).toBeInTheDocument()

    const cleanBtn = screen.getByRole("button", { name: /清理本地数据/ })
    await user.click(cleanBtn)
    expect(onCleanLocalData).toHaveBeenCalledTimes(1)

    const keepBtn = screen.getByRole("button", { name: /保留本地备份/ })
    await user.click(keepBtn)
    expect(onKeepLocalBackup).toHaveBeenCalledTimes(1)
  })
})
