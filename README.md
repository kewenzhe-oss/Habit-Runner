# Habit Runner

Habit Runner 是一款以能量节律为核心的习惯运行工具。它不把每天压缩成“完成 / 失败”两个答案，而是根据实际完成量，将正向习惯映射到 High、Normal、Low、Rest 四档：半量行动仍然是连接，主动休息也不是失败。

## 产品模型

- 事项层：正向习惯、戒除行为、待办分别拥有独立的字段、打卡规则和趋势语义。
- 能量层：服务端根据实际完成量与目标量派生能量档位、完成比例和记录文本，客户端只负责输入与预览。
- 领域层：所有事项归入七个生活领域；周报以“实际连接 / 计划机会”归一化展示，避免事项较多的领域天然占优。
- 可视化：长期热力轨迹、戒除发生频次、待办完成节点、领域雷达和能量背景共同解释真实经历。

## 技术栈

- Next.js 15 App Router、React、TypeScript
- Tailwind CSS、Radix UI、Recharts
- NextAuth.js、Prisma、PostgreSQL
- Zod、Jest、Testing Library

## 本地运行

需要 Node.js 20、pnpm 10 和 PostgreSQL。

```bash
pnpm install
cp .env.example .env.local
pnpm prisma migrate deploy
pnpm prisma generate
pnpm dev
```

本地可将 `ENABLE_DEMO_LOGIN=true` 用于演示账号。免密演示 Provider 在生产环境中始终不会注册；正式部署至少配置 Google 或 GitHub OAuth 中的一种。

## 环境变量

```dotenv
DATABASE_URL=postgresql://user:password@localhost:5432/habit_runner?schema=public
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=replace-with-a-long-random-secret
NEXT_PUBLIC_APP_URL=http://localhost:3000

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=

ENABLE_DEMO_LOGIN=true
```

用户资料中的 `timezone` 决定“今天”的日期边界。新用户默认使用 UTC，建议在设置页改为自己的 IANA 时区。

## 数据库迁移

`prisma/migrations` 是当前 PostgreSQL 迁移链。旧的 MySQL 模板迁移保存在 `prisma/mysql-migrations-legacy`，仅用于历史参考，不参与部署。

```bash
pnpm prisma validate
pnpm prisma migrate status
pnpm prisma migrate deploy
```

生产环境使用 `migrate deploy`；不要使用 `db push` 替代可审计的迁移。

## 质量检查

```bash
pnpm lint
pnpm exec tsc --noEmit
pnpm test:ci -- --runInBand
pnpm format:check
pnpm audit --prod
pnpm build
```

领域规则测试位于 `__tests__/domain`，覆盖跨时区日期、DST、计划日机会和能量档位派生。

## 当前边界

- Manifest 支持安装入口与独立窗口，但项目尚未提供 Service Worker，因此不宣称离线可用。
- 周度领域机会基于当前事项状态计算；若未来需要精确还原历史计划变更，应增加事项配置版本表。
- TODO 的 WEEKLY / MONTHLY 会在完成当天写入 CheckIn 并保持事项为 ACTIVE；完整的“下一到期日自动推进”仍适合拆为独立调度能力。

## License

[MIT](LICENSE)
