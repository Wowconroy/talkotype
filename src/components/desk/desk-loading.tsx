/** Static desk chrome shown while server bootstrap streams in. */
export function DeskLoading() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sea">
          Your desk
        </p>
        <div className="mt-3 h-9 w-80 max-w-full animate-pulse rounded-lg bg-mist" />
        <div className="mt-3 h-4 w-96 max-w-full animate-pulse rounded bg-mist/80" />
      </div>

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <aside className="flex w-full flex-col gap-5 lg:w-64 lg:shrink-0">
          <div className="rounded-2xl border border-border/80 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-sea">
              Daily limit
            </p>
            <p className="mt-1.5 font-display text-lg font-semibold text-ink">
              — of 3{" "}
              <span className="text-sm font-medium text-muted-foreground">
                transcriptions
              </span>
            </p>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-mist">
              <div className="h-full w-1/3 animate-pulse rounded-full bg-coral/50" />
            </div>
          </div>
          <div className="h-24 animate-pulse rounded-2xl bg-mist/70" />
        </aside>

        <section className="min-w-0 flex-1">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="h-7 w-36 animate-pulse rounded-lg bg-mist" />
            <div className="h-10 w-40 animate-pulse rounded-xl bg-coral/30" />
          </div>
          <div className="overflow-hidden rounded-2xl border border-border/80 bg-white">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="flex items-center gap-3 border-b border-border/60 px-4 py-4 last:border-b-0"
              >
                <div className="size-9 animate-pulse rounded-full bg-mist" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-2/5 animate-pulse rounded bg-mist" />
                  <div className="h-2.5 w-1/4 animate-pulse rounded bg-mist/80" />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
