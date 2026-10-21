import { triggerHaptic } from "@/lib/haptics"

describe("triggerHaptic", () => {
  afterEach(() => {
    Object.defineProperty(navigator, "vibrate", {
      configurable: true,
      value: undefined,
    })
  })

  it("uses feature detection when vibration is unavailable", () => {
    expect(() => triggerHaptic("light")).not.toThrow()
    expect(triggerHaptic("success")).toBe(false)
  })

  it("maps feedback strengths to platform-safe vibration patterns", () => {
    const vibrate = jest.fn().mockReturnValue(true)
    Object.defineProperty(navigator, "vibrate", {
      configurable: true,
      value: vibrate,
    })

    expect(triggerHaptic("light")).toBe(true)
    expect(triggerHaptic("medium")).toBe(true)
    expect(triggerHaptic("success")).toBe(true)
    expect(vibrate.mock.calls).toEqual([[10], [22], [[12, 28, 18]]])
  })

  it("contains browser failures instead of leaking them into interactions", () => {
    Object.defineProperty(navigator, "vibrate", {
      configurable: true,
      value: () => {
        throw new Error("Vibration unavailable")
      },
    })

    expect(() => triggerHaptic("medium")).not.toThrow()
    expect(triggerHaptic("medium")).toBe(false)
  })
})
