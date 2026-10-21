/** Per-request durations for the browser's Network panel; contains no user data. */
export function createServerTiming() {
  const durations: string[] = []
  return {
    async measure<T>(name: string, run: () => Promise<T>): Promise<T> {
      const start = performance.now()
      try {
        return await run()
      } finally {
        durations.push(`${name};dur=${(performance.now() - start).toFixed(1)}`)
      }
    },
    header: () => durations.join(", "),
  }
}
