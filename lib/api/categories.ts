import { db } from "@/lib/db"

export const DEFAULT_CATEGORIES = [
  { name: "身体与健康", colorCode: "#10B981", icon: "body" },
  { name: "技能与创造", colorCode: "#F59E0B", icon: "craft" },
  { name: "学习与输入", colorCode: "#8B5CF6", icon: "signal" },
  { name: "沉思与复盘", colorCode: "#06B6D4", icon: "contemplation" },
  { name: "生活日常", colorCode: "#3B82F6", icon: "life" },
]

export async function getUserCategories(userId: string) {
  let categories = await db.category.findMany({
    where: { userId },
    orderBy: { sortOrder: "asc" },
  })

  // Seed default categories on first access if none exist
  if (categories.length === 0) {
    await db.category.createMany({
      data: DEFAULT_CATEGORIES.map((cat, idx) => ({
        userId,
        name: cat.name,
        colorCode: cat.colorCode,
        icon: cat.icon,
        sortOrder: idx,
      })),
    })

    categories = await db.category.findMany({
      where: { userId },
      orderBy: { sortOrder: "asc" },
    })
  }

  return categories
}

export async function createCategory(
  userId: string,
  name: string,
  colorCode?: string
) {
  const trimmed = name.trim()
  if (!trimmed) throw new Error("分类名称不能为空")

  // Check if exists
  const existing = await db.category.findUnique({
    where: {
      userId_name: {
        userId,
        name: trimmed,
      },
    },
  })

  if (existing) {
    return existing
  }

  const count = await db.category.count({ where: { userId } })

  return await db.category.create({
    data: {
      userId,
      name: trimmed,
      colorCode: colorCode || "#8B5CF6",
      sortOrder: count,
    },
  })
}

export async function updateCategory(
  categoryId: string,
  userId: string,
  data: { name?: string; colorCode?: string }
) {
  const existing = await db.category.findFirst({
    where: { id: categoryId, userId },
  })

  if (!existing) return null

  return db.$transaction(async (tx) => {
    const category = await tx.category.update({
      where: { id: categoryId },
      data: {
        name: data.name?.trim(),
        colorCode: data.colorCode,
        updatedAt: new Date(),
      },
    })
    if (data.name) {
      await tx.item.updateMany({
        where: { categoryId, userId },
        data: { customCategory: data.name.trim() },
      })
    }
    return category
  })
}

export async function deleteCategory(categoryId: string, userId: string) {
  const existing = await db.category.findFirst({
    where: { id: categoryId, userId },
  })

  if (!existing) return false

  await db.$transaction([
    db.item.updateMany({
      where: { categoryId, userId },
      data: { categoryId: null, customCategory: null },
    }),
    db.category.delete({ where: { id: categoryId } }),
  ])

  return true
}
