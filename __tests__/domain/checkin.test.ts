import { deriveHabitCheckIn } from "@/lib/domain/checkin"

const habit = {
  title: "阅读",
  unitType: "COUNT",
  targetAmount: 10,
  unitLabel: "页",
}

describe("habit check-in derivation", () => {
  it.each([
    [0, "REST", "REST", 0],
    [5, "COMPLETED", "LOW", 50],
    [8, "COMPLETED", "NORMAL", 80],
    [12, "COMPLETED", "HIGH", 120],
  ] as const)("maps %s units to %s/%s", (amount, status, energy, rate) => {
    expect(deriveHabitCheckIn(habit, { actualAmount: amount })).toMatchObject({
      status,
      actualEnergy: energy,
      completionRate: rate,
    })
  })

  it("normalizes binary records to normal or rest", () => {
    const binary = { title: "服药", unitType: "BINARY", targetAmount: 1 }
    expect(deriveHabitCheckIn(binary, { actualAmount: 9 }).actualAmount).toBe(1)
    expect(deriveHabitCheckIn(binary, { actualAmount: 0 }).actualEnergy).toBe(
      "REST"
    )
  })

  it("rejects impossible values", () => {
    expect(() => deriveHabitCheckIn(habit, { actualAmount: -1 })).toThrow(
      "Actual amount"
    )
  })
})
