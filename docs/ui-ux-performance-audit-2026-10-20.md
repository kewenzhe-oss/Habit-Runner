# Habit Runner UI/UX 与交互性能审查

日期：2026-10-20。范围：当前项目代码，以及 `https://habits.dpdns.org` 登录后的移动宽度页面。

> 这是实施前的审查记录，其中代码路径与行号对应修改前版本。后续已实施的优化、真实 PostgreSQL 验证和测量限制见 [优化与验证结果](./ui-ux-performance-results-2026-10-20.md)。

## 结论与证据边界

已经实际复现页面切换的明显等待。当前测试账号的今日清单和历史记录为空，仍然出现秒级切页，说明本次等待不能用事项数量过多解释。

代码中可以确认三条需要优先处理的链路：页面导航重复读取登录态与数据、保存后重新聚合整个列表、服务端刷新与客户端列表状态脱节。这些都会延长或破坏操作反馈。

用户还报告分类筛选、打开弹窗也慢。这类操作主要是本地状态变更，不能全部归因于数据库；本次没有获取浏览器 Performance trace，也没有服务器查询耗时，所以不能把它们直接认定为主线程长任务，更不能给各个原因分配精确的耗时占比。

本次完成审查和界面操作，未修改业务代码、部署配置或账号中的事项、打卡、能量记录。

## 实际操作记录

所有时间为同一次工具调用内的墙钟计时，包含自动操作与观察开销；不是浏览器 INP，也不是纯接口耗时。跨工具调用、包含分析间隔的计时未作为测量结果使用。

| 操作 | 观察 | 计时范围 |
| --- | --- | --- |
| 我的行动 → 行动历史 | 约 2.81 秒，正文标题才可见 | 点击到目标正文标题可见 |
| 行动历史 → 系统设置 | 约 2.34 秒 | 点击、等待 URL 变更、读取包含设置正文的页面快照 |
| 返回我的行动 | 曾先显示导航壳，正文稍后出现 | 仅作状态观察，不报告精确耗时 |
| 分类筛选 | 分类选中态成功变化 | 点击调用约 0.48 秒，包含工具开销，不能据此认定主线程卡顿 |
| 打开新增事项 | 弹窗正常出现 | 点击调用约 1.38 秒，包含工具开销 |
| 弹窗内切换为待办任务 | 表单变为截止日期等字段 | 点击调用约 1.07 秒，包含工具开销 |

新建表单未保存，已关闭；最后回到今日页面并恢复“全部分类”。检查的浏览器日志中未看到 error/warn，但这不能排除性能问题。

截图：[今日页面](/Users/grangerfdad/.codex/visualizations/2026/10/20/01a15b9c-26b6-73e3-9c93-acb3521d08d1/habit-dashboard-audit.jpg)。

## 设计参考的使用方式

已阅读用户提供的 [awesome-design-md](https://github.com/VoltAgent/awesome-design-md) 以及其中的 [Linear](https://github.com/VoltAgent/awesome-design-md/blob/main/design-md/linear.app/DESIGN.md)、[Notion](https://github.com/VoltAgent/awesome-design-md/blob/main/design-md/notion/DESIGN.md)、[Oura](https://github.com/VoltAgent/awesome-design-md/blob/main/design-md/oura/DESIGN.md) 文档。

这些文档是第三方对品牌公开网站的分析，其中大量规范针对营销页，不能直接当作对应产品应用的交互规范。适合本项目提取的原则是：清晰的文字与表面层级、稳定的间距和组件状态、温和的健康产品气质，以及触屏上容易操作的控件。

建议保留 Habit Runner 当前的安静列表结构，以 Linear 文档的层级和组件一致性作为结构参考，借鉴 Oura 的舒缓氛围。主操作应有稳定、容易识别的强调方式；品牌配色与语义状态应整理成项目自己的规范。

## 优先级最高的交互与性能问题

### P1：切换页面反复建立应用布局，并等待动态服务器内容

证据：

- [dashboard/layout.tsx](/Users/grangerfdad/Desktop/habit/app/dashboard/layout.tsx:15)、[insights/layout.tsx](/Users/grangerfdad/Desktop/habit/app/insights/layout.tsx:14)、[settings/layout.tsx](/Users/grangerfdad/Desktop/habit/app/settings/layout.tsx:14)、[items/layout.tsx](/Users/grangerfdad/Desktop/habit/app/items/layout.tsx:14) 各自挂载 `AppLayout`。
- [AppLayout](/Users/grangerfdad/Desktop/habit/components/layout/app-layout.tsx:12) 查询当前用户，各个页面又调用 `getCurrentUser()`。
- [getCurrentUser](/Users/grangerfdad/Desktop/habit/lib/session.ts:6) 没有显式的请求内去重；[JWT 回调](/Users/grangerfdad/Desktop/habit/lib/auth.ts:119) 在常规会话读取中又查用户表。
- 目前只有 dashboard 和公开首页有 `loading.tsx`；历史、设置、详情没有独立的加载边界。dashboard 的加载态也只是一个转圈。

影响：切页要等待服务器，导航与新建弹窗等共用组件也随各自布局重建。登录后的请求比公开静态内容多出数据库依赖。缺少及时的目标页面反馈，会放大“没有点到”的感觉。

建议：把登录后的页面放入共享的应用路由布局，保持导航和共用交互组件；同一服务器渲染内去重会话读取；JWT 中稳定字段按明确的资料更新与失效策略刷新，避免每次读取会话都重新查询完整用户资料。补齐加载骨架、导航 pending 状态和合适的流式边界。权限检查仍在相应数据访问和 API 中执行。

依据：[Next.js 15 导航说明](https://nextjs.org/docs/15/app/getting-started/linking-and-navigating) 说明动态路由可能跳过预取，有 `loading.tsx` 时可以预取部分界面；[NextAuth v4 回调说明](https://next-auth.js.org/configuration/callbacks#jwt-callback) 说明 JWT 会话读取会触发 JWT 回调。

### P1：一次打卡串起保存、整页数据聚合、额外分类刷新

当前主要链路：

```mermaid
flowchart LR
    A[点击完成或保存打卡] --> B[等待保存 API]
    B --> C[GET 今日全部数据]
    C --> D[重新查询能量、事项、周记录、昨日意图、120 天记录]
    D --> E[更新列表和进度]
    E --> F[额外请求分类]
```

证据：

- [HabitItem](/Users/grangerfdad/Desktop/habit/components/dashboard/habit-item.tsx:192) 完成待办、戒除记录、延期等都在写入成功后调用 `onRefresh()`。
- [记录弹窗](/Users/grangerfdad/Desktop/habit/components/dashboard/record-action-modal.tsx:198) 等写入成功，关闭弹窗后再刷新数据。
- [refreshItems](/Users/grangerfdad/Desktop/habit/components/dashboard/habit-list.tsx:72) 拉取完整今日数据，然后再请求分类。分类请求发生在列表更新之后，通常不是首次显示新状态的直接阻塞，但增加服务器负担。
- [getTodayDashboardData](/Users/grangerfdad/Desktop/habit/lib/api/checkin.ts:290) 依次等待能量、事项、本周打卡、昨日意图、120 天打卡，共五个应用层读取阶段。事项关联可能产生更多 SQL，五阶段不能等同于五条 SQL。
- [recordHabitCheckIn](/Users/grangerfdad/Desktop/habit/lib/api/checkin.ts:258) 与 [recordCheckIn](/Users/grangerfdad/Desktop/habit/lib/api/checkin.ts:197) 还会先后读取同一事项；戒除记录也存在这条重复读取路径。

影响：用户看到的最终状态需要等待写入和再次完整读取。请求链会把网络延迟、数据库往返和查询执行时间叠加。列表按钮虽会禁用，但部分只有透明度变化；`onRefresh()` 未被等待时，按钮也可能在列表刷新结束前恢复可点。

建议：对可逆的完成状态先更新当前行和进度，显示正在同步，失败时回滚并提供重试；写入返回对应的权威更新结果；只重新验证受影响的数据，分类仅在分类改变时刷新。并发读取独立数据、合并重叠日期范围，保留现有日期与排期语义。复用已经验证归属的事项，避免再次读取。

当前 streak 计算已经使用批量预加载，不能把这里描述为仍存在“每个事项再查一次数据库”的 N+1 问题。

### P1：刷新成功后，客户端列表可能仍显示旧内容

证据：

- [HabitList](/Users/grangerfdad/Desktop/habit/components/dashboard/habit-list.tsx:46) 通过 `useState(initialItems)` 和 `useState(initialCategories)` 初始化；没有把后续服务器 props 的变化同步进对应 state。
- [Navbar](/Users/grangerfdad/Desktop/habit/components/layout/navbar.tsx:142) 的快速新建成功回调只执行 `router.refresh()`。
- [能量选择](/Users/grangerfdad/Desktop/habit/components/dashboard/today-compass-card.tsx:77) 先改变按钮自己的本地 energy，再等待写入和 `router.refresh()`。列表的低能量过滤来自外部 `dailyEnergy`，推荐动作却来自列表本地 `items`。

影响：在组件保持挂载的刷新路径中，新增后的列表可能不出现新项目；能量按钮已经变了，但清单过滤要等服务器，推荐动作还可能维持旧值。这类状态不同步会被用户感知成延迟甚至操作失效。本次没有保存新事项，因此该问题是代码与框架行为确认的缺陷路径，没有在线执行写入复现。

建议：统一 dashboard 数据与能量的状态来源，明确处理初始服务端数据、用户正在进行的本地修改、服务器返回值及并发刷新，避免用旧响应覆盖新操作。同步修复快速新增、能量切换和行内打卡。

依据：[React useState](https://react.dev/reference/react/useState#parameters) 的初始化参数不会跟随后续 render 自动更新；[Next.js 15 router.refresh](https://nextjs.org/docs/15/app/api-reference/functions/use-router#userouter) 会保留未受影响的客户端 state。

### P2：详情页有额外的重复读取和串行等待

[详情页](/Users/grangerfdad/Desktop/habit/app/items/[itemId]/page.tsx:16) 的 metadata 和正文都读取用户及事项；正文随后等待日期、streak、趋势。streak 与 [趋势函数](/Users/grangerfdad/Desktop/habit/lib/api/trends.ts:84) 又读取已有的事项或时区数据。

建议：请求内复用用户与事项，传入已加载的必要字段，让独立的数据并行；趋势图使用独立加载边界。先让用户看到标题和操作，再显示分析图表。

### P2：本地操作也慢，需要独立的浏览器性能证据

分类筛选只调用本地 `setSelectedCategory`，打开记录弹窗也只修改本地 state。这两条路径没有必须等待服务器的逻辑，不能用保存请求的链路解释持续两三秒等待。

待分析的候选包括：页面尚未完成 hydration、初始脚本下载或执行、某个长任务、重复渲染，以及设备/浏览器环境。现在没有足够证据把任何一项认定为根因。

代码中可优先核实的成本：

- [QuickAddHabitModal](/Users/grangerfdad/Desktop/habit/components/dashboard/quick-add-habit-modal.tsx:89) 的分类请求函数依赖 `selectedCategoryName`，打开弹窗的 effect 又依赖该函数，因此初次选中默认分类及修改分类时会再次请求。应解除这条不必要的依赖并共享已加载分类。
- [useLocalMigration](/Users/grangerfdad/Desktop/habit/hooks/use-local-migration.ts:63) 挂载时同步读取和校验本地数据，其中 eligibility 与后续读取会重复解析事项。大体量旧数据可能影响初次交互，但它不是每次筛选都会重新执行的 effect。
- 新建、分类、迁移等弹窗在客户端中静态导入。可以根据 bundle/Performance 结果决定延迟加载；首次打开时应提供即时容器反馈或提前预热，避免把延迟挪到第一次点击。

没有在这些本地处理函数中发现固定等待两三秒的计时器。应先记录点击到下一次绘制的过程，再决定是否需要列表渲染优化；空清单的观测不足以评估大量事项的渲染成本。

### 待验证：部署冷启动和数据库所在区域

[apphosting.yaml](/Users/grangerfdad/Desktop/habit/apphosting.yaml:1) 配置 `minInstances: 0`，允许没有常驻实例。若实际部署使用此配置，空闲后的第一次访问可能受冷启动影响。[Firebase 文档](https://firebase.google.com/docs/app-hosting/configure#configure-cloud-run-service-settings) 说明该字段控制常驻实例数量。

这不能单独解释持续操作时每次都慢。需要核实实际 Cloud Run 配置、实例启动时间、应用与数据库的区域、连接池和查询延迟；确认收益及成本后再决定是否保留一个常驻实例。

## UI/UX 优化清单

| 优先级 | 目前的问题与证据 | 建议 |
| --- | --- | --- |
| P1 | 首屏的主体是金句；最直接的“今日还剩几项”标题在 [TodayCompassCard](/Users/grangerfdad/Desktop/habit/components/dashboard/today-compass-card.tsx:215) 中被设为 `sr-only` | 将剩余事项、当前能量、下一步操作放回主要视觉层级；金句可收敛为辅助信息 |
| P1 | 空状态只有“先建一个简单的行动吧”，没有就近操作入口 | 在空白区直接提供“新增第一个行动”，并让新建成功立即出现在列表里 |
| P1 | [更多操作](/Users/grangerfdad/Desktop/habit/components/dashboard/habit-item.tsx:524) 默认 `opacity-0`，依赖 hover，且触控框只有 36×36 | 触屏设备常显；键盘 focus 时可见；扩大到约 44×44 的有效区域 |
| P1 | [能量按钮](/Users/grangerfdad/Desktop/habit/components/dashboard/today-compass-card.tsx:305) 和 [分类按钮](/Users/grangerfdad/Desktop/habit/components/dashboard/habit-list.tsx:212) 使用 11–12px 字体和极小纵向 padding；截图中低对比文字很多 | 重要操作文字采用 14px 左右，扩大有效点击范围；辅助信息至少保持可读。现有习惯打卡圆点和底部导航已经有较好的触控框，可保留 |
| P1 | 低能量模式提示会收起事项，但“收起几项”的提示本身没有展开动作 | 提供“显示全部”，明确这是显示策略，并保留用户的查看选择 |
| P2 | [HabitItem](/Users/grangerfdad/Desktop/habit/components/dashboard/habit-item.tsx:310) 对整行完成内容降透明度，部分还嵌套在低透明度容器里 | 用完成标记、文字样式和排序表达完成，保留内容与操作可读性 |
| P2 | [周记录](/Users/grangerfdad/Desktop/habit/components/dashboard/habit-item.tsx:37) 星期字只有 8px，状态主要靠小点和 title 提示 | 增加清晰的今日指示，提供可触达的状态说明；历史页已有部分图例与可访问标签，应统一到列表 |
| P2 | 部分提示直接写中文或 P0 等内部术语，能量又显示 High/Normal/Low/Rest | 统一语言和用户表达，例如“优先／常规／稍后”和“充沛／日常／微行动／休整” |
| P2 | 快速新建仍同时呈现类型、优先级、计量、目标和生活领域 | 优先保证名称与直接目标易填，其他已有默认值的设置继续渐进展开；保持现有高级配置入口 |

对比度复核：按 [globals.css](/Users/grangerfdad/Desktop/habit/app/globals.css:6) 的浅色 muted 色值与白背景计算，原色约 4.83:1；再使用 `/60` 透明度后约 2.32:1，`/40` 约 1.70:1。这是指定 token 在白背景上的理论计算，并非所有实际位置的实测结果，但足以说明不能通过不断降低透明度建立文字层级。建议用稳定的 text token 与字号、字重、间距表达主次。

## 额外发现的日期一致性问题

- [refreshItems](/Users/grangerfdad/Desktop/habit/components/dashboard/habit-list.tsx:74) 使用 UTC 的 `toISOString().split("T")[0]`，服务器首屏则按用户时区计算今天。临近日界线时，保存与刷新可能落到不同日期，造成“保存后没变化”。
- [TodayCompassCard](/Users/grangerfdad/Desktop/habit/components/dashboard/today-compass-card.tsx:125) 使用 `new Date(dateStr).getDay()`，把日期字符串的 UTC 午夜转换为浏览器本地星期。在当前美国东部时区，10 月 20 日的日期可能按 10 月 19 日的星期计算。本次历史页显示周二 10-20，而今日卡显示“本周还剩 6 天”，与这条代码路径一致。

应复用项目已有的日历日期工具及统一的用户时区语义。

## 建议的实施顺序与验收

1. 给导航、登录态读取、各组数据库查询和写入增加耗时测量，分别记录空闲后首访和连续操作；在浏览器中记录一次分类筛选与弹窗打开的 Performance trace。目标是区分服务器等待、主线程执行和下一帧绘制。
2. 优先修复列表状态同步；实现行内即时反馈、失败回滚及针对受影响数据的更新，解除每次操作都刷新分类的链路。
3. 合并共享应用布局、减少重复会话与事项读取、缩短串行聚合链，补齐各页面的加载骨架和明确的导航进行中状态。
4. 根据真实指标处理冷启动、区域和数据库连接；再调整字级、触控范围、操作可见性、空状态与首屏主次。

建议验收目标（尚未达到或验证）：本地筛选与弹窗在 hydration 后尽快反馈，常用操作约 100–200ms 内出现明确界面响应；保存中的状态可辨认、失败可恢复；快速新建成功后列表立即出现该项；能量选择、清单过滤与推荐动作一致。页面首次反馈与最终内容可见时间分别统计，不用转圈出现的速度代替数据加载速度。

回归重点：新增后刷新、能量快速切换、写入失败、慢请求乱序、分类更新、循环待办、用户时区午夜、移动端触屏与键盘操作。本次未运行构建或单元测试，因为没有实施业务代码修改。
