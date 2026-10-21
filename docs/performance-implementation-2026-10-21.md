# 第一批响应速度与操作链路优化

2026-10-21。基线e171931；保留前一轮未提交的移动端修改。本轮未提交或push。

## 已实施

### 历史页读取并行

lib/api/history.ts：事项读取与五项独立查询同时启动；120天streak查询仅依赖事项列表，在items就绪后立即启动，不再等待统计查询批次结束。数据库查询数量、用户归属、112/120天窗口、连续天数计算、返回值和私有缓存策略均未改变。

不考虑客户端、连接池排队和同步计算的简化依赖路径：旧为 items + 最慢独立查询 + streak，新为 max(最慢独立查询, items + streak)。这是结构说明，不是实测耗时或速度保证；并发对数据库连接池的影响需要真实环境观察。

专属deferred测试证实items未完成时独立查询已开始，items完成后streak不被未完成统计阻塞，并检查返回统计语义。

### 戒除二选一调整

components/dashboard/habit-item.tsx：已记录与未记录保持同一个二选一入口；调整走quit-status API，避免误入habit checkin并收到409。aria-pressed表示当前选择，重复点击当前项不请求，pending期间禁用和ref防重复，保留乐观反馈、服务端确认和失败回滚。

测试覆盖KEPT/LAPSED双向切换、正确endpoint、重复点击、失败恢复。

### 打卡保存耗时

habit checkin与quit-status成功响应增加Server-Timing的auth和save_and_streaks分段；需要服务器日期时增加user_date。save_and_streaks包含写入和后续streak计算，不应当成纯SQL写入时间。计时头不包含用户信息，成功响应private,no-store。保留既有鉴权和错误状态映射。

## 验证

- 全量Jest：37套件、126项通过。
- TypeScript和Next.js生产构建通过。
- git diff --check通过。
- 当前本机数据库未运行；本轮没有重启服务、修改数据库或取得线上/手机Performance trace。
- 未声称P95、INP或页面切换加速百分比。前一轮移动端排版仍需320/375/390实际视口验收。

## 分工

- WorkBuddy DeepSeek / Bacon：戒除调整与回滚测试。
- WorkBuddy DeepSeek / Kant：历史查询依赖并行和deferred测试。
- 主代理：API分段耗时、响应头测试、合并检查及正式构建。
- Gemini 3.8 / Hegel：独立复核本轮diff，报告另存；以实际返回报告为准。

## 下一阶段测量

同一构建与账号分别测量冷/热导航、移动网络/CPU下点击至反馈、点击至API确认和刷新后一致性。关联Network/Server-Timing与数据库执行时间后，再决定是否缩小历史读取、图表按需加载或调整部署区域。每次只对已定位瓶颈做对照修改，避免缓存私有数据或省略持久化确认。
