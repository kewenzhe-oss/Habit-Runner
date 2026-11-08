import { categoryLabel } from "@/lib/category-label"

describe("categoryLabel", () => {
  it.each([
    ["body", "身体与健康", "Body & Health"],
    ["craft", "技能与创造", "Skills & Creativity"],
    ["signal", "学习与输入", "Learning"],
    ["contemplation", "沉思与复盘", "Reflection"],
    ["life", "生活日常", "Daily Life"],
  ])("localizes the %s preset", (icon, name, english) => {
    expect(categoryLabel({ icon, name }, "en")).toBe(english)
    expect(categoryLabel({ icon, name }, "zh")).toBe(name)
  })

  it("preserves custom categories and renamed presets", () => {
    expect(categoryLabel({ name: "身体与健康", icon: null }, "en")).toBe("身体与健康")
    expect(categoryLabel({ name: "我的健康", icon: "body" }, "en")).toBe("我的健康")
  })
})
