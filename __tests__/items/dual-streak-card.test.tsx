import { render, screen } from "@testing-library/react"

import { DualStreakCard } from "@/components/items/dual-streak-card"
import { getDictionary } from "@/lib/i18n"

describe("DualStreakCard", () => {
  const dict = getDictionary("zh").item.streaks

  it("renders Action Streak and Rhythm Streak for Habits", () => {
    render(
      <DualStreakCard
        actionStreak={8}
        rhythmStreak={12}
        longestActionStreak={15}
        type="HABIT"
      />
    )

    expect(screen.getByText(dict.actionStreakTitle)).toBeInTheDocument()
    expect(screen.getByText("8")).toBeInTheDocument()
    expect(screen.getByText(dict.rhythmStreakTitle)).toBeInTheDocument()
    expect(screen.getByText("12")).toBeInTheDocument()
    expect(screen.getByText(dict.longestStreakTitle)).toBeInTheDocument()
    expect(screen.getByText("15")).toBeInTheDocument()
  })

  it("renders Maintained days for Quit Habits", () => {
    render(
      <DualStreakCard
        actionStreak={0}
        rhythmStreak={45}
        longestActionStreak={0}
        maintainedDays={30}
        type="QUIT_HABIT"
      />
    )

    expect(screen.getByText(dict.currentKept)).toBeInTheDocument()
    expect(screen.getByText("30")).toBeInTheDocument()
    expect(screen.getByText(dict.rhythmTitle)).toBeInTheDocument()
    expect(screen.getByText("45")).toBeInTheDocument()
  })
})
