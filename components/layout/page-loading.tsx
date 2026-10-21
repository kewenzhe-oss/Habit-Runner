export function PageLoading() {
  return (
    <div role="status" aria-label="Loading" className="space-y-6 py-1">
      <span className="sr-only">Loading…</span>
      <div className="h-7 w-36 animate-pulse rounded-md bg-muted" />
      <div className="h-36 animate-pulse rounded-xl border bg-muted/40" />
      <div className="space-y-3" aria-hidden="true">
        {[0, 1, 2].map((row) => (
          <div
            key={row}
            className="h-16 animate-pulse rounded-lg bg-muted/50"
          />
        ))}
      </div>
    </div>
  )
}
