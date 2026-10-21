# Habit Runner：DESIGN.md 对照审查与移动端分工

审查基线：e171931。日期：2026-10-21。以当前源码为依据；本机 localhost:3000 未响应，本文不声称已经完成浏览器验收。

## 参考与边界

- [Awesome DESIGN.md](https://github.com/VoltAgent/awesome-design-md)：品牌设计分析集合，不是统一的可访问性标准。
- [Linear](https://github.com/VoltAgent/awesome-design-md/blob/main/design-md/linear.app/DESIGN.md)：参考层级、有限强调色、响应式布局与触控尺寸。
- [Notion](https://github.com/VoltAgent/awesome-design-md/blob/main/design-md/notion/DESIGN.md)：参考内容优先和轻量界面。
- [Cal.com](https://github.com/VoltAgent/awesome-design-md/blob/main/design-md/cal/DESIGN.md)：参考清晰主操作与简单表单。

这些文件主要分析营销站；不直接照搬大标题、品牌配色或首页卡片到习惯工具。保留 Habit Runner 红色品牌、二选一目标表达、常开展示每日灵感、热图横滑和固定星期轴。

## 按优先级优化建议

| 优先级 | 观察证据（基线文件） | 建议 | 验收条件 |
| --- | --- | --- | --- |
| P1 | components/items/habit-trend-chart.tsx:1134、1147、1186：双列网格中进度占满两列，后置百分比单独落行 | 第一行日期与百分比，第二行进度和记录天数；桌面维持三列 | 手机百分比不拉成整行；数据完整；打开不挤大背景卡片 |
| P1 | components/items/item-detail-view.tsx:256–275：标题、说明、记录数共享横排，说明11px、数量10px | 手机标题+不换行数量，说明独立行；正文和说明建立14/12px层级 | 中英文长标题、三位数数量在320px可读，不溢出 |
| P1 | components/history/global-activity-heatmap.tsx:257、377：周期按钮36px，格子32px | 独立周期按钮提高44px；密集日期网格优先评估间距与日期详情替代入口，避免盲目扩大整张热图 | 周期可准确点击；网格不增加整页横滚；详情可键盘使用 |
| P2 | 多处text-[10px]/text-[11px]；habit-list归档链接低透明度 | 核心正文14–16px，辅助信息至少12px；测量实际对比度再调整 | 浅深色实测普通文本对比度；不依赖透明度表达唯一状态 |
| P2 | weekly Dialog内部60vh加全局Dialog外层overflow-y-auto | 优先单一滚动区域、dvh视口限制；表单另测键盘出现时保存按钮可达性 | 375×667及横屏可关闭、滚动到底；焦点返回入口 |
| P2 | habit-list低能量筛选、类别、已完成归档等并列信息 | 首页首屏以今日目标和记录操作为主；筛选简化成轻量工具条 | 每日灵感继续常开；筛选可发现且无匹配时可恢复 |

P1前两项是可定位的布局问题；首页信息减量与配色属于需视觉验证的设计建议，不等同于已证实故障。

## Magpie 分工

| 名称 | 模型/通道 | 范围 |
| --- | --- | --- |
| Supervisor / Hume | Gemini 3.8 Flash，antigravity，经Magpie | 对照设计资料，复核方向与优先级，输出独立审查报告 |
| Code-Worker-A / Rawls | Gemini 3.8 Flash，antigravity，经Magpie | 仅周度弹窗行布局、字号、视口高度及相关验证 |
| Code-Worker-B / Banach | Gemini 3.8 Flash，antigravity，经Magpie | 仅心流日志标题和正文层级及相关验证 |
| QA-Inspector / Cicero | Gemini 3.8 Flash，antigravity，经Magpie | 移动端证据审计、可运行时截图验收；不将源码推测报告为浏览器结果 |

工具初始模型目录未列出WorkBuddy；用户补充授权后，直接指定 workbuddy-ai/deepseek-v4.1-flash 派发成功。基础任务已转交WorkBuddy，Gemini保留设计审查与QA职责。两位代码代理写入范围分离；最终统一复核差异和测试。未自动提交或推送。

## 验收矩阵

320 / 375 / 390 / 768px；中文与英文；浅色与深色；无记录、长标题、数量较大、已记录与未记录。
检查：整页无横向溢出、独立按钮44px、日期详情可读、弹窗关闭和焦点回归、键盘遮挡、reduced-motion、记录数据与状态映射不变。

最终报告需分别列出：已实施、仅建议、测试通过、尚未完成的浏览器验收。

## 第一批实施结果

- WorkBuddy / Beauvoir：热图周期按钮提升44px；相关7项测试通过。
- WorkBuddy / Hypatia：周度弹窗手机两行布局、紧凑百分比、14/12px文字、60dvh内部高度；相关测试和TypeScript检查通过。
- WorkBuddy / Plato：日志标题和记录数首排，说明独立行；相关测试和TypeScript检查通过。
- 主代理集成复核：百分比徽章垂直不拉伸、日志数量提升12px。
- Gemini Supervisor独立审查已返回，主代理纠正未测对比度与实现归属；QA静态报告已返回；浏览器矩阵仍待完成。

## 下一批新增发现

QA发现已记录的戒除事项点击状态按钮会进入通用习惯记录弹窗，保存走habit checkin API而非quit状态API；需优先统一二选一调整入口，防止无效请求和409。该链路为静态证据，尚未浏览器复现或修复。性能定位见 performance-next-actions-2026-10-21.md。
