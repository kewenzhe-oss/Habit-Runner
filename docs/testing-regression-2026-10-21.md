# 回归测试报告（2026-10-21）

角色：Regression Tester（WorkBuddy DeepSeek V4.1 Flash）  
仓库：`/Users/grangerfdad/Desktop/habit`  
测试日期：2026-10-21  
结论：**全量 Jest、TypeScript 检查与 `git diff --check` 均通过；新增 12 个测试全部通过。退出习惯的网络失败、响应解析失败与失败后重试均已覆盖；API 错误分支仍有测试缺口。**

## 范围与限制

- 测试对象为当前工作区的 7 个已修改产品文件、3 个新增测试文件及相关既有测试。
- 本轮未修改产品代码或配置；仅补充指定测试文件并更新本报告。
- 未运行 build，未启动、停止或重启服务，未访问数据库，未执行 push。
- 工作区原有的未跟踪文档和脚本保持原状。
- 未使用 Gemini。

## 实际命令与结果

所有命令均在仓库根目录执行。

| 命令 | 退出码 | 实际结果 |
| --- | ---: | --- |
| `pnpm exec jest --ci --runInBand` | 0 | 37/37 个测试套件、129/129 个测试通过；6.926 秒。日志中有 React `act(...)` 警告，没有 `FAIL`。 |
| `pnpm exec tsc --noEmit` | 0 | 无输出、无类型错误。 |
| `git diff --check` | 0 | 无输出，无空白错误。 |
| `pnpm exec jest --ci --runInBand __tests__/dashboard/quit-habit-choice.test.tsx` | 0 | 1/1 个测试套件、7/7 个测试通过；1.156 秒。 |
| `pnpm exec jest --ci --runInBand __tests__/dashboard/quit-habit-choice.test.tsx __tests__/dashboard/habit-item.test.tsx __tests__/dashboard/optimistic-items.test.tsx __tests__/api/checkin-timing.test.ts __tests__/api/history-performance.test.ts` | 0 | 5/5 个测试套件、21/21 个测试通过；1.643 秒。 |

覆盖率补充检查使用 V8 provider：

```text
pnpm exec jest --ci --runInBand --coverage \
  --coverageProvider=v8 \
  --coverageReporters=text \
  --coverageReporters=json-summary \
  --coverageDirectory=/tmp/habit-jest-coverage-2026-10-21-b \
  __tests__/api/history-performance.test.ts \
  __tests__/api/checkin-timing.test.ts \
  __tests__/dashboard/quit-habit-choice.test.tsx
```

实际结果：3/3 个测试套件、9/9 个测试通过，退出码 0。覆盖对象包含测试间接加载的文件，主要结果如下：

| 文件 | 语句 | 分支 | 函数 | 行 |
| --- | ---: | ---: | ---: | ---: |
| `lib/api/history.ts` | 97.29% | 63.26% | 100% | 97.29% |
| `app/api/items/[itemId]/checkin/route.ts` | 78.33% | 66.66% | 100% | 78.33% |
| `app/api/items/[itemId]/quit-status/route.ts` | 76.36% | 66.66% | 100% | 76.36% |
| `components/dashboard/habit-item.tsx` | 70.59% | 46.55% | 31.25% | 70.59% |

默认覆盖率 provider 的补充运行未成功：3 个套件均在收集阶段因 `test-exclude` 抛出 `TypeError: The "original" argument must be of type function. Received an instance of Object`，实际执行测试数为 0。该结果反映插桩工具链兼容问题；同一命令改用 V8 provider 后全部通过，因此没有据此判定产品回归。相关未覆盖行包括两个 API 路由的无请求日期分支与错误分支，以及 `habit-item.tsx` 的其他非退出习惯交互。

## 新增测试覆盖核对

### `__tests__/api/history-performance.test.ts`

该文件包含 1 个用例，使用 deferred Promise 验证：

- 事项查询与 5 个独立查询立即启动，不等待事项结果。
- 事项返回后立即启动 120 天 streak 数据读取，不必等待较慢的全时段统计。
- 120 天读取使用 `userId`、过滤后的习惯 ID、正确日期窗口及选中字段。
- 最终结果保留 112 天热图、本周日期、最近行动、已完成 TODO、MATURE 阶段、有效跨度与习惯 streak 数据。

结论：**覆盖有效**。它验证了新并行调度的启动顺序、依赖边界和结果语义，而不只是检查函数是否返回。

### `__tests__/api/checkin-timing.test.ts`

该文件通过 `describe.each` 同时测试习惯与退出路由，共 4 个用例：

- 成功响应包含 `auth` 与 `save_and_streaks` 的 `Server-Timing`，不含用户 ID。
- 成功响应设置 `Cache-Control: private, no-store`。
- 习惯与退出保存分别返回预期数据。
- 未登录请求返回 401，且不会调用保存函数。

结论：**正常路径、隐私响应头和鉴权短路覆盖有效**。尚未覆盖：

- 请求体不带 `date` 时的 `user_date` 计时及 `getUserToday` 调用。
- 422 校验错误、403 越权、409 类型错误与 500 服务错误。
- 保存函数拒绝时计时记录的异常路径。

### `__tests__/dashboard/quit-habit-choice.test.tsx`

该文件包含 7 个用例：

- 已记录 `KEPT` 时切换到 `LAPSED`，验证乐观选中态、请求体和保存后结果。
- 已记录 `LAPSED` 时切换到 `KEPT`。
- 点击当前已选状态不发请求；提交中重复点击只发出一次请求。
- HTTP `ok: false` 时恢复原 `KEPT` 状态，两个按钮重新可用，且只请求一次。
- `fetch` 直接拒绝时恢复原 `KEPT` 状态，按钮解除禁用。
- HTTP 成功响应的 JSON 解析失败时恢复原 `KEPT` 状态，按钮解除禁用。
- 第一次请求失败后再次点击同一选择，第二次请求成功，最终选中态更新为 `LAPSED`，且共发出两次请求。

结论：**核心退出习惯二选一、防重、HTTP 失败、网络异常、响应解析失败及失败后重试覆盖有效**。这些用例以用户可见状态和请求次数为核心断言，不依赖 toast 文案。

## 失败回滚核对

当前实现先在 `useDashboardItems` 中写入乐观补丁，保存函数拒绝后恢复传入的原始 item。实际测试结果支持这一行为：

- 新增退出习惯用例通过，证明 `ok: false` 后选择恢复到 `KEPT`，按钮解除禁用。
- 新增用例通过，证明 `fetch` 拒绝和 JSON 解析失败均恢复原选择并解除按钮禁用。
- 新增重试用例通过，证明首次失败后的锁与 pending 状态已清理，第二次提交能够成功更新选中态。
- 既有 `__tests__/dashboard/optimistic-items.test.tsx` 通过，额外证明失败只回滚对应条目，另一条成功写入保持不变，且 pending 状态最终清空。

以下边界仍未由本次新增测试直接覆盖：

- 保存成功响应本身格式异常时，界面是否出现未处理错误。

当前测试通过的是单元级模拟网络与响应异常；本报告不声称已在真实服务或浏览器端进行网络异常验证。

## 回归裁决

| 检查项 | 结果 |
| --- | --- |
| 全量 Jest | 通过（37/37 套件，129/129 用例） |
| 新增 3 个测试文件 | 通过（3/3 套件，12/12 用例） |
| 退出习惯相关回归 | 通过（5/5 套件，21/21 用例） |
| TypeScript | 通过，0 错误 |
| `git diff --check` | 通过，0 错误 |
| 失败回滚 | HTTP 失败、网络拒绝、JSON 解析失败与失败后重试均通过 |
| 产品代码修改 | 本轮未修改 |
| build / 服务 / push | 未执行 |

总体判定：**可以接收当前改动。退出习惯失败恢复与重试路径已有直接回归覆盖；后续可补充 API 错误分支及异常成功响应格式测试。** 全量测试中的 `act(...)` 警告可作为后续测试质量清理项，不影响本次通过结论。
