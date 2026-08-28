import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  console.log("Seeding Habit Runner demo data...")

  // Create demo user
  const user = await prisma.user.upsert({
    where: { email: "demo@habitrunner.dev" },
    update: {},
    create: {
      email: "demo@habitrunner.dev",
      name: "Demo Runner",
      timezone: "Asia/Shanghai",
    },
  })

  // Clear previous items and categories for clean seed
  await prisma.item.deleteMany({ where: { userId: user.id } })
  await prisma.category.deleteMany({ where: { userId: user.id } })

  // Seed user categories
  const catBody = await prisma.category.create({
    data: {
      userId: user.id,
      name: "身体与健康",
      colorCode: "#10B981",
      sortOrder: 0,
    },
  })
  const catCraft = await prisma.category.create({
    data: {
      userId: user.id,
      name: "创造与工作",
      colorCode: "#F59E0B",
      sortOrder: 1,
    },
  })
  const catSignal = await prisma.category.create({
    data: {
      userId: user.id,
      name: "学习与输入",
      colorCode: "#8B5CF6",
      sortOrder: 2,
    },
  })
  const catContemplation = await prisma.category.create({
    data: {
      userId: user.id,
      name: "深度思考",
      colorCode: "#06B6D4",
      sortOrder: 3,
    },
  })
  const catLife = await prisma.category.create({
    data: {
      userId: user.id,
      name: "日常生活",
      colorCode: "#3B82F6",
      sortOrder: 4,
    },
  })

  const todayStr = new Date().toISOString().split("T")[0]

  // 1. Positive Habit: 深度阅读 (Category: 学习与输入)
  await prisma.item.create({
    data: {
      userId: user.id,
      categoryId: catSignal.id,
      customCategory: catSignal.name,
      title: "每日深度阅读",
      whyPrompt: "构建长期批判性思考力，抗击碎片化信息茧房",
      type: "HABIT",
      layer: "SIGNAL",
      status: "ACTIVE",
      colorCode: "#8B5CF6",
      actionPresets: {
        create: [
          {
            energyLevel: "HIGH",
            actionText: "阅读 45 分钟并摘录 3 条核心观点到笔记",
          },
          {
            energyLevel: "NORMAL",
            actionText: "阅读 20 分钟并标记一个有启发的段落",
          },
          {
            energyLevel: "LOW",
            actionText: "读 1 段文字并划线（微小行动，绝非失败）",
          },
          { energyLevel: "REST", actionText: "今日有意识休整，不强制阅读" },
        ],
      },
      toolLinks: {
        create: [{ title: "打开 ReadSelah", url: "https://readselah.com" }],
      },
    },
  })

  // 2. Positive Habit: 力量与体态训练 (Category: 身体与健康)
  await prisma.item.create({
    data: {
      userId: user.id,
      categoryId: catBody.id,
      customCategory: catBody.name,
      title: "力量与体态恢复训练",
      whyPrompt: "保持充沛精力与身体核心稳定性",
      type: "HABIT",
      layer: "BODY",
      status: "ACTIVE",
      colorCode: "#10B981",
      actionPresets: {
        create: [
          {
            energyLevel: "HIGH",
            actionText: "完成 40 分钟全身抗阻训练 + 10 分钟拉伸",
          },
          { energyLevel: "NORMAL", actionText: "完成 15 分钟自重核心训练" },
          { energyLevel: "LOW", actionText: "站姿拉伸 3 分钟 + 30 次深蹲" },
          { energyLevel: "REST", actionText: "肌肉完全恢复与温水泡澡" },
        ],
      },
    },
  })

  // 3. Positive Habit: 写作与沉思 (Category: 深度思考)
  await prisma.item.create({
    data: {
      userId: user.id,
      categoryId: catContemplation.id,
      customCategory: catContemplation.name,
      title: "自由书写与日落复盘",
      whyPrompt: "理清日常思绪杂质，倾听内在声音",
      type: "HABIT",
      layer: "CONTEMPLATION",
      status: "ACTIVE",
      colorCode: "#06B6D4",
      actionPresets: {
        create: [
          {
            energyLevel: "HIGH",
            actionText: "写一篇完整的深度日记或思考长文 (800+ 字)",
          },
          {
            energyLevel: "NORMAL",
            actionText: "记录 3 件今天最有意义的事情与 1 点反思",
          },
          { energyLevel: "LOW", actionText: "在便签上写下此刻最真实的一句话" },
          { energyLevel: "REST", actionText: "仅闭目冥想 5 分钟，无需动笔" },
        ],
      },
    },
  })

  // 4. Quit Habit: 戒除深夜无意识刷短视频 (Category: 日常生活)
  await prisma.item.create({
    data: {
      userId: user.id,
      categoryId: catLife.id,
      customCategory: catLife.name,
      title: "睡前 1 小时不刷短视频与社交媒体",
      whyPrompt: "保护多巴胺基线，提升深度睡眠质量",
      type: "QUIT_HABIT",
      layer: "LIFE",
      status: "ACTIVE",
      colorCode: "#EF4444",
    },
  })

  // 5. Todo Item: 阶段复盘待办 (Category: 创造与工作)
  await prisma.item.create({
    data: {
      userId: user.id,
      categoryId: catCraft.id,
      customCategory: catCraft.name,
      title: "提交阶段性产品设计与架构复盘文档",
      type: "TODO",
      layer: "CRAFT",
      status: "ACTIVE",
      dueDate: todayStr,
      colorCode: "#3B82F6",
    },
  })

  console.log("Seeding completed successfully!")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
