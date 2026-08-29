<div align="center">

# Habit Runner

**每天一点，时间会放大。**  
*A little every day, magnified over time.*

私人行动与节律系统 · 尊重能量 · 接纳起伏 · 长期运行

[![Next.js](https://img.shields.io/badge/Next.js-15.5-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8?style=flat-square&logo=tailwindcss)](https://tailwindcss.com/)
[![Prisma](https://img.shields.io/badge/Prisma-5.9-2D3748?style=flat-square&logo=prisma)](https://www.prisma.io/)
[![Firebase](https://img.shields.io/badge/Firebase-App_Hosting-FFCA28?style=flat-square&logo=firebase)](https://firebase.google.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg?style=flat-square)](LICENSE)

[在线体验](https://habits.dpdns.org/) · [快速开始](#-快速开始) · [核心特性](#-核心设计理念) · [部署指南](#-部署指南)

</div>

---

## 💡 核心设计理念

传统的习惯打卡工具往往把每一天压缩成粗暴的“1 或 0”（完成或失败），一旦断签便制造强烈的负罪感，最终导致放弃。

**Habit Runner** 是一款以**真实生活节律与自适应能量**为核心的私人行动系统：
- **今天该做什么，一眼就知道**：顶部进度罗盘统领全局，告别杂乱的清单压力。
- **允许微行动，也允许主动休整**：状态好时全力投入，状态差时做个微行动保底，累了就主动停下蓄力——生活有起伏，但节律不断。
- **每一次行动，都会在时间里留下痕迹**：不追求虚幻的连击数字，看见多周多月沉淀下来的真实生活织锦。
- **Quiet Minimal 极致克制**：去除一切噪音标签与刺眼色块，让内容本身发声。

---

## ✨ 核心特性

### 1. 🧭 今日行动罗盘 (Today Compass Surface)
- 顶部统领全局状态、剩余时间窗口与下一步行动指引。
- 内嵌极简能量状态选择器（`High / Normal / Low / Rest`），轻量记录今日状态。

### 2. ⚡ 四阶能量自适应体系 (Adaptive Rhythm)
为每个行动配置阶梯动作，适应真实生活的动态变化：
- ⚡ **High Energy（充沛状态）**：深度投入与进阶动作（例：深度阅读 45 分钟 / 高强度训练）
- 🌱 **Normal（日常节奏）**：稳定完成日常基准（例：阅读 20 分钟 / 基础训练）
- ✨ **Low Energy（微行动保底）**：低能日极小动作（例：读 1 个段落 / 5 分钟拉伸），**仍然算作真实完成，不被粗暴清零**
- ☕ **Conscious Rest（主动休整）**：有意识的暂停恢复，系统维护节律连续性而非机械断签

### 3. 🎯 多类型行动整合 (Multi-Type Action System)
- **正向日常（HABIT）**：支持每日/每周自适应打卡与 7 日微点阵。
- **戒除觉察（QUIT_HABIT）**：记录平稳保持天数与客观发生觉察。
- **单次待办（TODO）**：清晰的到期提醒与完成归档。

### 4. 📊 时间痕迹与多周节律矩阵 (4-Week Rhythm Matrix)
- 统计栏呈现累计行动、留下痕迹天数与连续走势。
- 4 周日历矩阵（28 天）直观呈现充沛、日常、微行动与休整的彩色节律织锦。

### 5. 🎨 Quiet Minimal 视觉语言
- 三层信息收敛阅读模型，去除厚重卡片外框，采用统一的分割线列表（Divider List）。
- **State Dot 纯净状态点**：未打卡轻量空心圆、已完成主题色实心圆、休整柔和圆点。
- 完美适配日间明亮（Light）与夜间深色（Dark）模式。
- 完整的中文 / 英文（i18n）双语国际化支持。

---

## 🛠️ 技术栈

| 模块 | 技术选型 |
|---|---|
| **前端框架** | [Next.js 15](https://nextjs.org/) (App Router, Server Components, Server Actions) |
| **交互与语言** | [React 18](https://react.dev/), [TypeScript 5.3+](https://www.typescriptlang.org/) |
| **样式与组件** | [Tailwind CSS 3.4](https://tailwindcss.com/), [Radix UI](https://www.radix-ui.com/), [Remix Icon](https://remixicon.com/) |
| **数据持久化** | [Prisma ORM 5.9](https://www.prisma.io/), [PostgreSQL](https://www.postgresql.org/) |
| **用户认证** | [NextAuth.js 4](https://next-auth.js.org/) (OAuth & Credentials) |
| **云端部署** | [Firebase App Hosting](https://firebase.google.com/docs/app-hosting) / [Vercel](https://vercel.com/) |
| **测试套件** | [Jest](https://jestjs.io/), [Testing Library](https://testing-library.com/) (61+ 全通过单元测试) |

---

## 🚀 快速开始

### 前置要求
- **Node.js**: 20.x 或更高
- **pnpm**: 10.x 或更高
- **PostgreSQL 数据库**（本地实例或 [Neon.tech](https://neon.tech) / [Supabase](https://supabase.com) 云端实例）

### 1. 克隆代码并安装依赖
```bash
git clone https://github.com/kewenzhe-oss/Habit-Runner.git
cd Habit-Runner
pnpm install
```

### 2. 配置环境变量
复制环境变量示例文件：
```bash
cp .env.example .env.local
```
编辑 `.env.local`：
```dotenv
# 数据库连接串 (PostgreSQL)
DATABASE_URL="postgresql://user:password@localhost:5432/habit_runner?schema=public"

# NextAuth 配置
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-custom-random-secret-key"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# 本地演示免密登录 (仅在开发环境有效)
ENABLE_DEMO_LOGIN="true"
```

### 3. 初始化数据库
```bash
# 生成 Prisma Client
pnpm prisma generate

# 执行数据库结构同步
pnpm prisma db push

# (可选) 填充初始分类与预设数据
pnpm prisma db seed
```

### 4. 启动本地开发服务
```bash
pnpm dev
```
打开浏览器访问 [http://localhost:3000](http://localhost:3000) 即可开始使用。

---

## 📦 部署指南

### 方案 A：Firebase App Hosting 部署（推荐）

本项目已内置 `apphosting.yaml` 与 `firebase.json`，可直接部署至 Google Firebase：

1. 在 [Firebase 控制台](https://console.firebase.google.com/) 进入项目（如 `habit-runner-2050`）。
2. 点击 **Build → App Hosting**，选择 **Connect with GitHub**。
3. 授权并选中仓库 `kewenzhe-oss/Habit-Runner`，分支选择 `main`。
4. 在 App Hosting 设置中添加 Secret 变量：
   - `DATABASE_URL`：你的 PostgreSQL 线上连接串
   - `NEXTAUTH_SECRET`：自定义认证密钥字符串
5. 点击部署，Firebase 将自动完成云端构建与部署上线。

### 方案 B：Vercel 部署

1. 登录 [Vercel](https://vercel.com/)，点击 **Import Project** 选中 `kewenzhe-oss/Habit-Runner`。
2. 配置环境变量：`DATABASE_URL`、`NEXTAUTH_SECRET`、`NEXTAUTH_URL`。
3. 点击 **Deploy** 即可。

---

## 🧪 自动化测试与质量保障

项目配备了严格的领域规则与组件测试，覆盖状态流转、能量判定、多时区日期计算等关键路径：

```bash
# 运行单元测试
pnpm test:ci

# 代码格式化与 Lint 检查
pnpm lint
pnpm format:check

# 生产环境构建校验
pnpm build
```

---

## 📄 开源许可

本项目基于 [MIT License](LICENSE) 开源发布。

---

<div align="center">
  <sub>Crafted with passion by <b>postsoma-2050</b> · <a href="https://github.com/kewenzhe-oss/Habit-Runner">kewenzhe-oss/Habit-Runner</a></sub>
</div>
