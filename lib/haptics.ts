export type HapticFeedback = "light" | "medium" | "success"

const HAPTIC_PATTERNS: Record<HapticFeedback, number | number[]> = {
  light: 10,
  medium: 22,
  success: [12, 28, 18],
}

/**
 * Triggers a short vibration when the platform supports the Vibration API.
 * Unsupported browsers and embedding contexts fail silently.
 */
export function triggerHaptic(feedback: HapticFeedback): boolean {
  try {
    if (typeof navigator === "undefined" || typeof navigator.vibrate !== "function") {
      return false
    }

    return navigator.vibrate(HAPTIC_PATTERNS[feedback])
  } catch {
    return false
  }
}
