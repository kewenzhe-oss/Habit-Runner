# 移动端浏览器实测 · 2026-10-21

执行：2026-10-21T10:56:42.524Z → 2026-10-21T10:57:23.457Z。

环境：http://localhost:3000，Chromium Chrome/155.0.8059.85，独立 CDP 9241。Chromium headless CDP; mobile=true, scale=1, height=900; 4 widths × 2 locales × 2 themes; read-only existing demo item; non-read HTTP methods blocked; no CPU/network throttling; sequential local warm-browser samples, not field performance or a load test。

数据：隔离库 localhost/habit_runner_perf；demo 用户现有事项 local_perf_water。Prisma 查询在 READ ONLY 事务执行；浏览器拦截非 GET/HEAD/OPTIONS 请求。未修改产品、数据库或启停应用/PG。

结果：16/16 组合全部检查通过；目标为 16 组合。截图 80 张。

修复后结论：英文 `4W`、`8W` 实测均为 44×44px，`16W` 为 45×44px；全部组合 weekly 入口左右 span、子元素及文字 Range 均无越界或重叠。320px 英文入口左右区域实测间隔 12px，周数自然换行。weekly 弹窗日期与 badge 首排、Journal 标题、每日灵感常开及页面无横向溢出全部通过。

最新截图人工复核已完成：逐组查看了全部 16 组合的入口、weekly 首条明细和 Journal 标题裁剪总览，并查看 320px 英文完整入口、弹窗和深色热图截图，未见文字重叠。总览仅由本次截图裁剪排版，原始 80 张截图保留：

- [16 组合 weekly 入口总览](/Users/grangerfdad/.codex/visualizations/2026/10/21/01a15c20-129c-7f30-8094-0f78e9efe790/testing-20261021/review-weekly-trigger-16-cases.png)
- [16 组合 weekly 明细总览](/Users/grangerfdad/.codex/visualizations/2026/10/21/01a15c20-129c-7f30-8094-0f78e9efe790/testing-20261021/review-weekly-16-cases.png)
- [16 组合 Journal 标题总览](/Users/grangerfdad/.codex/visualizations/2026/10/21/01a15c20-129c-7f30-8094-0f78e9efe790/testing-20261021/review-journal-16-cases.png)

响应摘要：本机 Dashboard/Item/Insights TTFB 中位数 14/9.5/14ms；weekly 打开中位数 51ms（51–84ms），热图切换中位数 50ms（49–51ms）。这是无降速的串行本地样本，不代表真机或负载性能。浏览器未捕获异常、HTTP ≥400 和非只读请求拦截记录均为 0。

修复前 64 张截图、原始测量、报告与脚本共 67 个文件仍保存在 `before-min-width-and-trigger-fixes` 子目录。浏览器执行已于上述结束时间完成并关闭独立 Chromium；UI QA 已结束，不再产生额外应用读取负载。

|组合|每日灵感常开|Journal 标题|Weekly 入口|Weekly 首排日期+badge|热图 44×44|页面溢出|语言/主题|结果|
|---|---|---|---|---|---|---|---|---|
|320-zh-light|通过|通过|通过|通过|通过|通过|通过|通过|
|320-zh-dark|通过|通过|通过|通过|通过|通过|通过|通过|
|320-en-light|通过|通过|通过|通过|通过|通过|通过|通过|
|320-en-dark|通过|通过|通过|通过|通过|通过|通过|通过|
|375-zh-light|通过|通过|通过|通过|通过|通过|通过|通过|
|375-zh-dark|通过|通过|通过|通过|通过|通过|通过|通过|
|375-en-light|通过|通过|通过|通过|通过|通过|通过|通过|
|375-en-dark|通过|通过|通过|通过|通过|通过|通过|通过|
|390-zh-light|通过|通过|通过|通过|通过|通过|通过|通过|
|390-zh-dark|通过|通过|通过|通过|通过|通过|通过|通过|
|390-en-light|通过|通过|通过|通过|通过|通过|通过|通过|
|390-en-dark|通过|通过|通过|通过|通过|通过|通过|通过|
|768-zh-light|通过|通过|通过|通过|通过|通过|通过|通过|
|768-zh-dark|通过|通过|通过|通过|通过|通过|通过|通过|
|768-en-light|通过|通过|通过|通过|通过|通过|通过|通过|
|768-en-dark|通过|通过|通过|通过|通过|通过|通过|通过|

## 失败证据与修复定位

本次指定范围未发现失败。

## 实测响应时间（毫秒）

本机单次串行样本。ready 包含文档 complete、目标元素、字体 ready、两帧与 250ms 稳定等待；不可当成纯服务耗时。weekly open 从真实 CDP 指针点击开始到列表出现并经过两帧；热图为点击到 aria-pressed 更新并经过两帧。无网络或 CPU 降速，未测打卡、导航体验、并发负载或真实手机。

|组合|Dashboard TTFB / DCL / ready|Item TTFB / DCL / ready|Insights TTFB / DCL / ready|Weekly open|热图4/8/16更新|
|---|---|---|---|---|---|
|320-zh-light|170 / 412 / 783|16 / 122 / 511|23 / 132 / 459|84|49 / 50 / 50|
|320-zh-dark|22 / 59 / 405|11 / 54 / 417|13 / 130 / 428|52|50 / 50 / 50|
|320-en-light|14 / 68 / 414|13 / 55 / 396|15 / 78 / 413|51|49 / 50 / 49|
|320-en-dark|15 / 42 / 366|11 / 53 / 415|13 / 75 / 412|51|49 / 50 / 50|
|375-zh-light|14 / 56 / 421|9 / 47 / 397|23 / 154 / 464|51|51 / 49 / 50|
|375-zh-dark|15 / 86 / 451|17 / 68 / 449|29 / 141 / 460|51|50 / 50 / 50|
|375-en-light|17 / 98 / 436|10 / 49 / 398|14 / 90 / 413|51|50 / 50 / 50|
|375-en-dark|11 / 47 / 385|9 / 42 / 383|12 / 71 / 411|51|50 / 50 / 51|
|390-zh-light|11 / 44 / 392|9 / 45 / 396|14 / 86 / 413|51|50 / 50 / 50|
|390-zh-dark|21 / 63 / 439|8 / 41 / 400|15 / 82 / 413|51|51 / 51 / 51|
|390-en-light|9 / 48 / 405|9 / 52 / 413|13 / 86 / 412|52|51 / 50 / 51|
|390-en-dark|10 / 46 / 403|7 / 42 / 399|13 / 72 / 413|51|50 / 51 / 50|
|768-zh-light|17 / 56 / 421|8 / 43 / 390|14 / 89 / 412|51|50 / 50 / 50|
|768-zh-dark|13 / 58 / 413|10 / 47 / 410|13 / 85 / 413|51|50 / 49 / 50|
|768-en-light|14 / 52 / 398|9 / 41 / 390|17 / 85 / 415|51|51 / 50 / 49|
|768-en-dark|13 / 55 / 397|10 / 48 / 408|12 / 81 / 412|51|50 / 50 / 50|

## 浏览器诊断与产物

- 浏览器未捕获异常：0；HTTP ≥400：0；拦截非只读请求：0。详见 results.json；此计数不代替功能检查。
- 布局检查包括：weekly 入口左右 span 分离、左区子元素边界/scrollWidth 与文字 Range 无越界重叠；weekly 所有已渲染周的日期单行、日期与 badge 顶部对齐、无重叠、窄屏进度第二行；Journal 标题文本与记录 badge 无重叠、描述位于独立第二行；4/8/16 按钮宽高均 ≥44px，切换三个窗口后页面无横向溢出；每日灵感无需展开即可见。
- 未测试虚拟键盘、安全区、Safari/iOS 真机与屏幕阅读器；截图视觉复核情况在报告末尾单独记录。

[原始测量与诊断](/Users/grangerfdad/.codex/visualizations/2026/10/21/01a15c20-129c-7f30-8094-0f78e9efe790/testing-20261021/results.json)

[修复前首次完整测量](/Users/grangerfdad/.codex/visualizations/2026/10/21/01a15c20-129c-7f30-8094-0f78e9efe790/testing-20261021/before-min-width-and-trigger-fixes/results.json)；[修复前 320px 英文入口重叠截图](/Users/grangerfdad/.codex/visualizations/2026/10/21/01a15c20-129c-7f30-8094-0f78e9efe790/testing-20261021/before-min-width-and-trigger-fixes/320-en-light-journal.png)。首次 16 组合为 8 通过 / 8 英文热图尺寸失败；入口文字重叠由截图复核发现，新增入口断言后才纳入后续自动检查。

截图：

- [320-zh-light-inspiration.png](/Users/grangerfdad/.codex/visualizations/2026/10/21/01a15c20-129c-7f30-8094-0f78e9efe790/testing-20261021/320-zh-light-inspiration.png)
- [320-zh-light-journal.png](/Users/grangerfdad/.codex/visualizations/2026/10/21/01a15c20-129c-7f30-8094-0f78e9efe790/testing-20261021/320-zh-light-journal.png)
- [320-zh-light-weekly-trigger.png](/Users/grangerfdad/.codex/visualizations/2026/10/21/01a15c20-129c-7f30-8094-0f78e9efe790/testing-20261021/320-zh-light-weekly-trigger.png)
- [320-zh-light-weekly.png](/Users/grangerfdad/.codex/visualizations/2026/10/21/01a15c20-129c-7f30-8094-0f78e9efe790/testing-20261021/320-zh-light-weekly.png)
- [320-zh-light-heatmap-16.png](/Users/grangerfdad/.codex/visualizations/2026/10/21/01a15c20-129c-7f30-8094-0f78e9efe790/testing-20261021/320-zh-light-heatmap-16.png)
- [320-zh-dark-inspiration.png](/Users/grangerfdad/.codex/visualizations/2026/10/21/01a15c20-129c-7f30-8094-0f78e9efe790/testing-20261021/320-zh-dark-inspiration.png)
- [320-zh-dark-journal.png](/Users/grangerfdad/.codex/visualizations/2026/10/21/01a15c20-129c-7f30-8094-0f78e9efe790/testing-20261021/320-zh-dark-journal.png)
- [320-zh-dark-weekly-trigger.png](/Users/grangerfdad/.codex/visualizations/2026/10/21/01a15c20-129c-7f30-8094-0f78e9efe790/testing-20261021/320-zh-dark-weekly-trigger.png)
- [320-zh-dark-weekly.png](/Users/grangerfdad/.codex/visualizations/2026/10/21/01a15c20-129c-7f30-8094-0f78e9efe790/testing-20261021/320-zh-dark-weekly.png)
- [320-zh-dark-heatmap-16.png](/Users/grangerfdad/.codex/visualizations/2026/10/21/01a15c20-129c-7f30-8094-0f78e9efe790/testing-20261021/320-zh-dark-heatmap-16.png)
- [320-en-light-inspiration.png](/Users/grangerfdad/.codex/visualizations/2026/10/21/01a15c20-129c-7f30-8094-0f78e9efe790/testing-20261021/320-en-light-inspiration.png)
- [320-en-light-journal.png](/Users/grangerfdad/.codex/visualizations/2026/10/21/01a15c20-129c-7f30-8094-0f78e9efe790/testing-20261021/320-en-light-journal.png)
- [320-en-light-weekly-trigger.png](/Users/grangerfdad/.codex/visualizations/2026/10/21/01a15c20-129c-7f30-8094-0f78e9efe790/testing-20261021/320-en-light-weekly-trigger.png)
- [320-en-light-weekly.png](/Users/grangerfdad/.codex/visualizations/2026/10/21/01a15c20-129c-7f30-8094-0f78e9efe790/testing-20261021/320-en-light-weekly.png)
- [320-en-light-heatmap-16.png](/Users/grangerfdad/.codex/visualizations/2026/10/21/01a15c20-129c-7f30-8094-0f78e9efe790/testing-20261021/320-en-light-heatmap-16.png)
- [320-en-dark-inspiration.png](/Users/grangerfdad/.codex/visualizations/2026/10/21/01a15c20-129c-7f30-8094-0f78e9efe790/testing-20261021/320-en-dark-inspiration.png)
- [320-en-dark-journal.png](/Users/grangerfdad/.codex/visualizations/2026/10/21/01a15c20-129c-7f30-8094-0f78e9efe790/testing-20261021/320-en-dark-journal.png)
- [320-en-dark-weekly-trigger.png](/Users/grangerfdad/.codex/visualizations/2026/10/21/01a15c20-129c-7f30-8094-0f78e9efe790/testing-20261021/320-en-dark-weekly-trigger.png)
- [320-en-dark-weekly.png](/Users/grangerfdad/.codex/visualizations/2026/10/21/01a15c20-129c-7f30-8094-0f78e9efe790/testing-20261021/320-en-dark-weekly.png)
- [320-en-dark-heatmap-16.png](/Users/grangerfdad/.codex/visualizations/2026/10/21/01a15c20-129c-7f30-8094-0f78e9efe790/testing-20261021/320-en-dark-heatmap-16.png)
- [375-zh-light-inspiration.png](/Users/grangerfdad/.codex/visualizations/2026/10/21/01a15c20-129c-7f30-8094-0f78e9efe790/testing-20261021/375-zh-light-inspiration.png)
- [375-zh-light-journal.png](/Users/grangerfdad/.codex/visualizations/2026/10/21/01a15c20-129c-7f30-8094-0f78e9efe790/testing-20261021/375-zh-light-journal.png)
- [375-zh-light-weekly-trigger.png](/Users/grangerfdad/.codex/visualizations/2026/10/21/01a15c20-129c-7f30-8094-0f78e9efe790/testing-20261021/375-zh-light-weekly-trigger.png)
- [375-zh-light-weekly.png](/Users/grangerfdad/.codex/visualizations/2026/10/21/01a15c20-129c-7f30-8094-0f78e9efe790/testing-20261021/375-zh-light-weekly.png)
- [375-zh-light-heatmap-16.png](/Users/grangerfdad/.codex/visualizations/2026/10/21/01a15c20-129c-7f30-8094-0f78e9efe790/testing-20261021/375-zh-light-heatmap-16.png)
- [375-zh-dark-inspiration.png](/Users/grangerfdad/.codex/visualizations/2026/10/21/01a15c20-129c-7f30-8094-0f78e9efe790/testing-20261021/375-zh-dark-inspiration.png)
- [375-zh-dark-journal.png](/Users/grangerfdad/.codex/visualizations/2026/10/21/01a15c20-129c-7f30-8094-0f78e9efe790/testing-20261021/375-zh-dark-journal.png)
- [375-zh-dark-weekly-trigger.png](/Users/grangerfdad/.codex/visualizations/2026/10/21/01a15c20-129c-7f30-8094-0f78e9efe790/testing-20261021/375-zh-dark-weekly-trigger.png)
- [375-zh-dark-weekly.png](/Users/grangerfdad/.codex/visualizations/2026/10/21/01a15c20-129c-7f30-8094-0f78e9efe790/testing-20261021/375-zh-dark-weekly.png)
- [375-zh-dark-heatmap-16.png](/Users/grangerfdad/.codex/visualizations/2026/10/21/01a15c20-129c-7f30-8094-0f78e9efe790/testing-20261021/375-zh-dark-heatmap-16.png)
- [375-en-light-inspiration.png](/Users/grangerfdad/.codex/visualizations/2026/10/21/01a15c20-129c-7f30-8094-0f78e9efe790/testing-20261021/375-en-light-inspiration.png)
- [375-en-light-journal.png](/Users/grangerfdad/.codex/visualizations/2026/10/21/01a15c20-129c-7f30-8094-0f78e9efe790/testing-20261021/375-en-light-journal.png)
- [375-en-light-weekly-trigger.png](/Users/grangerfdad/.codex/visualizations/2026/10/21/01a15c20-129c-7f30-8094-0f78e9efe790/testing-20261021/375-en-light-weekly-trigger.png)
- [375-en-light-weekly.png](/Users/grangerfdad/.codex/visualizations/2026/10/21/01a15c20-129c-7f30-8094-0f78e9efe790/testing-20261021/375-en-light-weekly.png)
- [375-en-light-heatmap-16.png](/Users/grangerfdad/.codex/visualizations/2026/10/21/01a15c20-129c-7f30-8094-0f78e9efe790/testing-20261021/375-en-light-heatmap-16.png)
- [375-en-dark-inspiration.png](/Users/grangerfdad/.codex/visualizations/2026/10/21/01a15c20-129c-7f30-8094-0f78e9efe790/testing-20261021/375-en-dark-inspiration.png)
- [375-en-dark-journal.png](/Users/grangerfdad/.codex/visualizations/2026/10/21/01a15c20-129c-7f30-8094-0f78e9efe790/testing-20261021/375-en-dark-journal.png)
- [375-en-dark-weekly-trigger.png](/Users/grangerfdad/.codex/visualizations/2026/10/21/01a15c20-129c-7f30-8094-0f78e9efe790/testing-20261021/375-en-dark-weekly-trigger.png)
- [375-en-dark-weekly.png](/Users/grangerfdad/.codex/visualizations/2026/10/21/01a15c20-129c-7f30-8094-0f78e9efe790/testing-20261021/375-en-dark-weekly.png)
- [375-en-dark-heatmap-16.png](/Users/grangerfdad/.codex/visualizations/2026/10/21/01a15c20-129c-7f30-8094-0f78e9efe790/testing-20261021/375-en-dark-heatmap-16.png)
- [390-zh-light-inspiration.png](/Users/grangerfdad/.codex/visualizations/2026/10/21/01a15c20-129c-7f30-8094-0f78e9efe790/testing-20261021/390-zh-light-inspiration.png)
- [390-zh-light-journal.png](/Users/grangerfdad/.codex/visualizations/2026/10/21/01a15c20-129c-7f30-8094-0f78e9efe790/testing-20261021/390-zh-light-journal.png)
- [390-zh-light-weekly-trigger.png](/Users/grangerfdad/.codex/visualizations/2026/10/21/01a15c20-129c-7f30-8094-0f78e9efe790/testing-20261021/390-zh-light-weekly-trigger.png)
- [390-zh-light-weekly.png](/Users/grangerfdad/.codex/visualizations/2026/10/21/01a15c20-129c-7f30-8094-0f78e9efe790/testing-20261021/390-zh-light-weekly.png)
- [390-zh-light-heatmap-16.png](/Users/grangerfdad/.codex/visualizations/2026/10/21/01a15c20-129c-7f30-8094-0f78e9efe790/testing-20261021/390-zh-light-heatmap-16.png)
- [390-zh-dark-inspiration.png](/Users/grangerfdad/.codex/visualizations/2026/10/21/01a15c20-129c-7f30-8094-0f78e9efe790/testing-20261021/390-zh-dark-inspiration.png)
- [390-zh-dark-journal.png](/Users/grangerfdad/.codex/visualizations/2026/10/21/01a15c20-129c-7f30-8094-0f78e9efe790/testing-20261021/390-zh-dark-journal.png)
- [390-zh-dark-weekly-trigger.png](/Users/grangerfdad/.codex/visualizations/2026/10/21/01a15c20-129c-7f30-8094-0f78e9efe790/testing-20261021/390-zh-dark-weekly-trigger.png)
- [390-zh-dark-weekly.png](/Users/grangerfdad/.codex/visualizations/2026/10/21/01a15c20-129c-7f30-8094-0f78e9efe790/testing-20261021/390-zh-dark-weekly.png)
- [390-zh-dark-heatmap-16.png](/Users/grangerfdad/.codex/visualizations/2026/10/21/01a15c20-129c-7f30-8094-0f78e9efe790/testing-20261021/390-zh-dark-heatmap-16.png)
- [390-en-light-inspiration.png](/Users/grangerfdad/.codex/visualizations/2026/10/21/01a15c20-129c-7f30-8094-0f78e9efe790/testing-20261021/390-en-light-inspiration.png)
- [390-en-light-journal.png](/Users/grangerfdad/.codex/visualizations/2026/10/21/01a15c20-129c-7f30-8094-0f78e9efe790/testing-20261021/390-en-light-journal.png)
- [390-en-light-weekly-trigger.png](/Users/grangerfdad/.codex/visualizations/2026/10/21/01a15c20-129c-7f30-8094-0f78e9efe790/testing-20261021/390-en-light-weekly-trigger.png)
- [390-en-light-weekly.png](/Users/grangerfdad/.codex/visualizations/2026/10/21/01a15c20-129c-7f30-8094-0f78e9efe790/testing-20261021/390-en-light-weekly.png)
- [390-en-light-heatmap-16.png](/Users/grangerfdad/.codex/visualizations/2026/10/21/01a15c20-129c-7f30-8094-0f78e9efe790/testing-20261021/390-en-light-heatmap-16.png)
- [390-en-dark-inspiration.png](/Users/grangerfdad/.codex/visualizations/2026/10/21/01a15c20-129c-7f30-8094-0f78e9efe790/testing-20261021/390-en-dark-inspiration.png)
- [390-en-dark-journal.png](/Users/grangerfdad/.codex/visualizations/2026/10/21/01a15c20-129c-7f30-8094-0f78e9efe790/testing-20261021/390-en-dark-journal.png)
- [390-en-dark-weekly-trigger.png](/Users/grangerfdad/.codex/visualizations/2026/10/21/01a15c20-129c-7f30-8094-0f78e9efe790/testing-20261021/390-en-dark-weekly-trigger.png)
- [390-en-dark-weekly.png](/Users/grangerfdad/.codex/visualizations/2026/10/21/01a15c20-129c-7f30-8094-0f78e9efe790/testing-20261021/390-en-dark-weekly.png)
- [390-en-dark-heatmap-16.png](/Users/grangerfdad/.codex/visualizations/2026/10/21/01a15c20-129c-7f30-8094-0f78e9efe790/testing-20261021/390-en-dark-heatmap-16.png)
- [768-zh-light-inspiration.png](/Users/grangerfdad/.codex/visualizations/2026/10/21/01a15c20-129c-7f30-8094-0f78e9efe790/testing-20261021/768-zh-light-inspiration.png)
- [768-zh-light-journal.png](/Users/grangerfdad/.codex/visualizations/2026/10/21/01a15c20-129c-7f30-8094-0f78e9efe790/testing-20261021/768-zh-light-journal.png)
- [768-zh-light-weekly-trigger.png](/Users/grangerfdad/.codex/visualizations/2026/10/21/01a15c20-129c-7f30-8094-0f78e9efe790/testing-20261021/768-zh-light-weekly-trigger.png)
- [768-zh-light-weekly.png](/Users/grangerfdad/.codex/visualizations/2026/10/21/01a15c20-129c-7f30-8094-0f78e9efe790/testing-20261021/768-zh-light-weekly.png)
- [768-zh-light-heatmap-16.png](/Users/grangerfdad/.codex/visualizations/2026/10/21/01a15c20-129c-7f30-8094-0f78e9efe790/testing-20261021/768-zh-light-heatmap-16.png)
- [768-zh-dark-inspiration.png](/Users/grangerfdad/.codex/visualizations/2026/10/21/01a15c20-129c-7f30-8094-0f78e9efe790/testing-20261021/768-zh-dark-inspiration.png)
- [768-zh-dark-journal.png](/Users/grangerfdad/.codex/visualizations/2026/10/21/01a15c20-129c-7f30-8094-0f78e9efe790/testing-20261021/768-zh-dark-journal.png)
- [768-zh-dark-weekly-trigger.png](/Users/grangerfdad/.codex/visualizations/2026/10/21/01a15c20-129c-7f30-8094-0f78e9efe790/testing-20261021/768-zh-dark-weekly-trigger.png)
- [768-zh-dark-weekly.png](/Users/grangerfdad/.codex/visualizations/2026/10/21/01a15c20-129c-7f30-8094-0f78e9efe790/testing-20261021/768-zh-dark-weekly.png)
- [768-zh-dark-heatmap-16.png](/Users/grangerfdad/.codex/visualizations/2026/10/21/01a15c20-129c-7f30-8094-0f78e9efe790/testing-20261021/768-zh-dark-heatmap-16.png)
- [768-en-light-inspiration.png](/Users/grangerfdad/.codex/visualizations/2026/10/21/01a15c20-129c-7f30-8094-0f78e9efe790/testing-20261021/768-en-light-inspiration.png)
- [768-en-light-journal.png](/Users/grangerfdad/.codex/visualizations/2026/10/21/01a15c20-129c-7f30-8094-0f78e9efe790/testing-20261021/768-en-light-journal.png)
- [768-en-light-weekly-trigger.png](/Users/grangerfdad/.codex/visualizations/2026/10/21/01a15c20-129c-7f30-8094-0f78e9efe790/testing-20261021/768-en-light-weekly-trigger.png)
- [768-en-light-weekly.png](/Users/grangerfdad/.codex/visualizations/2026/10/21/01a15c20-129c-7f30-8094-0f78e9efe790/testing-20261021/768-en-light-weekly.png)
- [768-en-light-heatmap-16.png](/Users/grangerfdad/.codex/visualizations/2026/10/21/01a15c20-129c-7f30-8094-0f78e9efe790/testing-20261021/768-en-light-heatmap-16.png)
- [768-en-dark-inspiration.png](/Users/grangerfdad/.codex/visualizations/2026/10/21/01a15c20-129c-7f30-8094-0f78e9efe790/testing-20261021/768-en-dark-inspiration.png)
- [768-en-dark-journal.png](/Users/grangerfdad/.codex/visualizations/2026/10/21/01a15c20-129c-7f30-8094-0f78e9efe790/testing-20261021/768-en-dark-journal.png)
- [768-en-dark-weekly-trigger.png](/Users/grangerfdad/.codex/visualizations/2026/10/21/01a15c20-129c-7f30-8094-0f78e9efe790/testing-20261021/768-en-dark-weekly-trigger.png)
- [768-en-dark-weekly.png](/Users/grangerfdad/.codex/visualizations/2026/10/21/01a15c20-129c-7f30-8094-0f78e9efe790/testing-20261021/768-en-dark-weekly.png)
- [768-en-dark-heatmap-16.png](/Users/grangerfdad/.codex/visualizations/2026/10/21/01a15c20-129c-7f30-8094-0f78e9efe790/testing-20261021/768-en-dark-heatmap-16.png)
