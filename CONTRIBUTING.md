# 参与开发

Habit Runner 的首要约束是：不能把“未知”“非计划日”或“创建前日期”计算成失败，也不能由客户端决定服务端统计结果。

## 开发流程

```bash
pnpm install
cp .env.example .env.local
pnpm prisma migrate deploy
pnpm dev
```

提交前运行：

```bash
pnpm lint
pnpm exec tsc --noEmit
pnpm test:ci -- --runInBand
pnpm format:check
pnpm audit --prod
pnpm build
```

## 领域规则

- 日期运算使用 `lib/domain/date.ts`，不得用 UTC 字符串代替用户本地日期。
- 计划机会使用 `lib/domain/schedule.ts`；固定星期和弹性周目标必须区别处理。
- 正向习惯打卡由 `lib/domain/checkin.ts` 派生状态、能量和完成率，API 不信任客户端传入的派生字段。
- 戒除事项中，无记录是未知，不是零次发生。
- Rest 保持节律连接；统计“休息天数”时按唯一日期去重。

## 数据库变更

修改 `prisma/schema.prisma` 时必须同时提交 PostgreSQL migration，并验证：

```bash
pnpm prisma validate
pnpm prisma migrate status
```

不要修改或重新启用 `prisma/mysql-migrations-legacy` 中的历史模板。

## UI 基线

- 核心触控目标至少 44px，固定导航必须预留安全区和内容底部间距。
- 图表必须提供可展开的数据表或等价文本摘要。
- 交互状态不能只依赖颜色；图标按钮必须有可读标签。
- 打卡弹窗需要在 375×667 小屏、横屏和键盘操作下可完成。

提交信息建议使用 Conventional Commits，例如 `fix: derive habit energy on server`。
