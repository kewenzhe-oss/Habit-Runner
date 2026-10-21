import { PrismaClient } from "@prisma/client"

const connection = new URL(process.env.DATABASE_URL || "")
if (
  !["localhost", "127.0.0.1"].includes(connection.hostname) ||
  connection.pathname !== "/habit_runner_perf"
) {
  throw new Error(
    "This seed only runs against the local habit_runner_perf database."
  )
}

const db = new PrismaClient()
const timezone = "America/New_York"
const parts = Object.fromEntries(
  new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .formatToParts(new Date())
    .map((part) => [part.type, part.value])
)
const today = `${parts.year}-${parts.month}-${parts.day}`
const day = (offset) => {
  const date = new Date(`${today}T12:00:00.000Z`)
  date.setUTCDate(date.getUTCDate() + offset)
  return date.toISOString().slice(0, 10)
}

try {
  const user = await db.user.upsert({
    where: { email: "demo@habitrunner.dev" },
    update: {},
    create: {
      email: "demo@habitrunner.dev",
      name: "Local Demo Runner",
      timezone,
    },
  })
  const categorySpecs = [
    ["身体与健康", "#10B981"],
    ["学习与输入", "#8B5CF6"],
    ["技能与创造", "#F59E0B"],
    ["生活日常", "#3B82F6"],
  ]
  const categories = []
  for (const [sortOrder, [name, colorCode]] of categorySpecs.entries()) {
    categories.push(
      await db.category.upsert({
        where: { userId_name: { userId: user.id, name } },
        update: {},
        create: { userId: user.id, name, colorCode, sortOrder },
      })
    )
  }

  const habits = [
    ["read", "每日深度阅读", 1, "COUNT", 10, "页", "HIGH"],
    ["walk", "晨间散步", 0, "TIME", 20, "分钟", "HIGH"],
    ["water", "规律喝水", 0, "COUNT", 8, "杯", "NORMAL"],
    ["english", "英文听力练习", 1, "TIME", 15, "分钟", "NORMAL"],
    ["stretch", "肩颈舒展", 0, "TIME", 10, "分钟", "NORMAL"],
    ["journal", "写一句日记", 2, "BINARY", 1, "次", "LOW"],
    ["desk", "整理工作桌面", 3, "BINARY", 1, "次", "LOW"],
    ["focus", "专注工作一轮", 2, "TIME", 25, "分钟", "NORMAL"],
    ["phone", "睡前不刷短视频", 3, null, null, null, "NORMAL"],
    ["sugar", "少喝含糖饮料", 0, null, null, null, "NORMAL"],
  ]
  const recurring = []
  for (const [
    index,
    [slug, title, categoryIndex, unitType, targetAmount, unitLabel, priority],
  ] of habits.entries()) {
    const category = categories[categoryIndex]
    const type = index < 8 ? "HABIT" : "QUIT_HABIT"
    const item = await db.item.upsert({
      where: { id: `local_perf_${slug}` },
      update: {},
      create: {
        id: `local_perf_${slug}`,
        userId: user.id,
        categoryId: category.id,
        customCategory: category.name,
        colorCode: category.colorCode,
        title,
        type,
        priority,
        sortOrder: index,
        unitType,
        targetAmount,
        unitLabel,
        layer:
          categoryIndex === 0
            ? "BODY"
            : categoryIndex === 1
              ? "SIGNAL"
              : "LIFE",
        whyPrompt: "本机测试数据：用小行动保持生活节律。",
        createdAt: new Date(`${day(-120)}T12:00:00.000Z`),
        actionPresets:
          type === "HABIT"
            ? {
                create: [
                  { energyLevel: "HIGH", actionText: `深入完成：${title}` },
                  {
                    energyLevel: "NORMAL",
                    actionText: `按日常节奏完成：${title}`,
                  },
                  { energyLevel: "LOW", actionText: `只做最小一步：${title}` },
                  { energyLevel: "REST", actionText: "有意识休整，明天再继续" },
                ],
              }
            : undefined,
      },
    })
    recurring.push(item)
  }

  const records = []
  for (let ago = 119; ago >= 1; ago--) {
    for (const [index, item] of recurring.entries()) {
      if ((ago + index) % 6 === 0) continue
      const rest = item.type === "HABIT" && (ago + index) % 13 === 0
      records.push({
        userId: user.id,
        itemId: item.id,
        date: day(-ago),
        status:
          item.type === "QUIT_HABIT"
            ? (ago + index) % 17 === 0
              ? "LAPSED"
              : "KEPT"
            : rest
              ? "REST"
              : "COMPLETED",
        actualEnergy: rest
          ? "REST"
          : (ago + index) % 4 === 0
            ? "LOW"
            : "NORMAL",
        actualAmount: rest ? 0 : item.targetAmount,
        completionRate: rest ? 0 : 100,
        actionText: rest ? "主动休整" : `完成：${item.title}`,
        nextIntent: ago === 1 && index === 0 ? "继续阅读下一章" : undefined,
      })
    }
  }
  await db.checkIn.createMany({ data: records, skipDuplicates: true })

  const tasks = [
    "预约牙医",
    "整理本周工作笔记",
    "购买本周食材",
    "完成项目复盘",
    "给家人打电话",
    "每周整理一次资料",
    "提交上周周报",
    "归档上月账单",
    "安排一次户外活动",
  ]
  for (const [index, title] of tasks.entries()) {
    const completed = index >= 6
    const item = await db.item.upsert({
      where: { id: `local_perf_todo_${index}` },
      update: {},
      create: {
        id: `local_perf_todo_${index}`,
        userId: user.id,
        categoryId: categories[3].id,
        customCategory: categories[3].name,
        title,
        type: "TODO",
        status: completed ? "COMPLETED" : "ACTIVE",
        priority: index === 0 ? "HIGH" : "NORMAL",
        dueDate: day(index - 1),
        todoRecurrence: index === 5 ? "WEEKLY" : "ONCE",
        sortOrder: index,
        createdAt: new Date(`${day(-7)}T12:00:00.000Z`),
      },
    })
    if (completed) {
      await db.checkIn.upsert({
        where: { itemId_date: { itemId: item.id, date: day(-1) } },
        update: {},
        create: {
          userId: user.id,
          itemId: item.id,
          date: day(-1),
          status: "COMPLETED",
          actualEnergy: "NORMAL",
          completionRate: 100,
        },
      })
    }
  }
  await db.dailyEnergyState.upsert({
    where: { userId_date: { userId: user.id, date: today } },
    update: {},
    create: {
      userId: user.id,
      date: today,
      energyLevel: "NORMAL",
      note: "本机效能测试",
    },
  })
  const [itemCount, checkInCount] = await Promise.all([
    db.item.count({ where: { userId: user.id } }),
    db.checkIn.count({ where: { userId: user.id } }),
  ])
  console.log(
    JSON.stringify({
      database: "habit_runner_perf",
      date: today,
      items: itemCount,
      checkIns: checkInCount,
    })
  )
} finally {
  await db.$disconnect()
}
