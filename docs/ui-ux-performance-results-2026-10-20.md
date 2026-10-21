# UI/UX 优化与真实数据库验证

日期：2026-10-20。优化基于本项目现有界面与 [awesome-design-md](https://github.com/VoltAgent/awesome-design-md) 中的层级、一致性和触屏可用性原则。

## 已实施

- 登录后页面共用 `app/(app)/layout.tsx`，保留导航与新建入口；URL 不变。增加导航进行中提示和共用加载骨架。
- 会话与事项读取在单次服务器渲染内复用；稳定 JWT 不再每次查询用户表。页面仍读取最新个人资料，各 API 保留登录与事项归属检查。
- 今日聚合的独立查询并行执行，合并本周与昨日记录读取，省略未使用的计数。详情复用已加载事项、时区与记录。
- 待办、打卡、戒除、延期等先更新列表，再合并服务器确认结果；失败时回滚。按事项锁定进行中的写入，避免重复提交；旧刷新结果不会覆盖已确认的新状态。
- 移除主要写入路径中的整份今日数据重抓和额外分类刷新。能量选择直接同步清单过滤与推荐动作，保存失败时恢复。
- 快速新增后的服务器数据会同步进列表；修复仅更新按钮却未更新推荐内容的问题。解除新建弹窗中分类选择触发重复请求的依赖。
- 强化“今日还剩几项”的视觉层级，扩大常用操作至约 44px，更多操作常显；提升完成内容与星期文字可读性。低能量模式支持显示全部，空状态提供就近新增或重置筛选入口。
- 使用统一日历日期处理写入、刷新和延期，修复美国东部时区的星期偏移；循环待办按当日记录判断完成。
- 今日 API 增加 `Server-Timing` 的 `auth` 与 `dashboard` 耗时，便于部署后区分身份读取和聚合开销。

## 真实 PostgreSQL

已安装并启动 PostgreSQL 17，使用隔离的本机数据库 `habit_runner_perf`，执行全部 4 个 Prisma 迁移。连接仅用于本地测试，现有线上数据未参与。

种子初始创建 19 个事项（8 个习惯、2 个戒除、9 个待办）、4 个分类和 995 条打卡，覆盖约 120 天。之后通过真实页面新增并完成一个待办、记录一次阅读打卡，数据库确认已持久化。

测试账号为 `demo@habitrunner.dev`（Local Demo Runner），时区 `America/New_York`。已通过项目现有开发登录入口实际登录；正式模式保持原本的登录限制，没有启用生产环境演示登录。

`.env.local`（Git 忽略）已指向本机测试库；其中凭据不纳入报告。Prisma CLI 需要显式加载此文件，避免使用 `.env` 中原先不可连接的数据库配置：

```sh
node --env-file=.env.local node_modules/prisma/build/index.js migrate deploy
pnpm seed:local
```

种子脚本仅允许 localhost/127.0.0.1 上的 `habit_runner_perf`，以 upsert/skipDuplicates 写入，不清空已有测试数据。

集群目录：`/Users/grangerfdad/.codex/local-databases/habit-runner-ui-20261020/data`。需要手动启停时：

```sh
/opt/homebrew/opt/postgresql@17/bin/pg_ctl -D /Users/grangerfdad/.codex/local-databases/habit-runner-ui-20261020/data status
/opt/homebrew/opt/postgresql@17/bin/pg_ctl -D /Users/grangerfdad/.codex/local-databases/habit-runner-ui-20261020/data -l /Users/grangerfdad/.codex/local-databases/habit-runner-ui-20261020/postgres.log start
/opt/homebrew/opt/postgresql@17/bin/pg_ctl -D /Users/grangerfdad/.codex/local-databases/habit-runner-ui-20261020/data stop -m fast
```

## 本机正式模式对照

修改前从 Git HEAD 导出到独立临时目录；修改前后分别完成 `next build`，用 `next start` 启动在 3001/3000，连接同一个真实 PostgreSQL。排除开发编译耗时，每项预热 2 次，再取 7 次样本。

| 操作                   | 修改前中位数 | 修改后中位数 |
| ---------------------- | -----------: | -----------: |
| 今日 API               |       14.5ms |       13.4ms |
| Dashboard 完整 HTML    |       28.2ms |       27.1ms |
| 历史页完整 HTML        |       40.7ms |       41.8ms |
| 设置页完整 HTML        |        9.7ms |       13.8ms |
| 事项详情完整 HTML      |       24.5ms |       22.7ms |
| 待办保存至所需数据就绪 |       16.5ms |        5.2ms |
| 能量保存至所需数据就绪 |       24.0ms |        3.1ms |

写入流程分别减少约 68% 和 87%。在几乎没有网络往返延迟的本机，读取页面的收益很小，并非每个页面都加速。Dashboard 首次加载 JS 从约 225kB 增至 228kB，本次没有实现包体积下降。

这里的“数据就绪”是按照修改前后实际代码请求依赖重建的已登录 HTTP 流程：待办旧流程为 PATCH 后 GET 今日数据，新流程只等待 PATCH；能量旧流程为 PUT 后读取 Dashboard，新流程只等待 PUT。待办每次测试前的重置不计时；旧分类请求在列表更新后发生，不计入数据就绪路径。完整 HTML 请求用于服务器对照，不等同于客户端 `router.refresh()` 的 RSC 传输大小。

这些数据不是浏览器 INP、帧绘制时间或线上测量，也没有模拟云端延迟，不能将线上曾测得的约 2.8 秒直接与本机毫秒数比较。

原始结果见 [ui-ux-performance-local.json](./ui-ux-performance-local.json)。对照服务器启动后，可重跑：

```sh
node --env-file=.env.local scripts/benchmark-local.mjs http://localhost:3001 http://localhost:3000 /tmp/habit-performance-direct.json
```

该脚本仅接受本机地址与隔离数据库，使用本机测试账号的已签名短期会话，不输出令牌。它会修改测试待办与当天能量，完成后将测试待办恢复为 ACTIVE、当天能量设为 NORMAL。

## 界面与回归验证

使用本机已登录页面和真实数据库验证：

- 快速新增待办，无手动刷新即可出现；完成后进入最近已办结，在历史页可见。
- 阅读记录写入 10 页、100% 完成，列表显示已完成 1/10、连续 6 天；数据库与历史页一致。
- Low 选中后立即收起非核心事项并显示保存中；重新载入仍保持 Low。“显示全部”恢复完整清单，随后恢复 Normal。
- 登录后的今日、历史、设置页可互相切换，历史页面加载 120 天记录；桌面和 430px 移动宽度检查布局。
- 慢请求、失败回滚、重复点击、不同事项并发、旧数据覆盖保护、循环待办和刷新后新增由组件/领域测试覆盖。另用临时延迟响应页面验证等待期间的界面反馈；该临时路由已删除，未包含于正式构建。

验证结果：30 个测试套件、109 个测试通过；TypeScript 和修改范围 ESLint 通过；修改前后正式构建均成功。

## 仍需线上确认

本次代码尚未部署。线上每次等待两三秒的完整原因仍需部署后根据浏览器请求、`Server-Timing`、服务器日志确认，尤其是应用与数据库区域、连接延迟，以及空闲后的冷启动。`minInstances: 0` 保持不变。

分类筛选和弹窗打开属于本地状态更新；本次未取得浏览器 Performance trace，不能认定其原因为数据库或某个主线程长任务，也没有声称已验证 100–200ms 的绘制指标。上述请求链和状态同步问题已有代码修复与真实数据库验证。
