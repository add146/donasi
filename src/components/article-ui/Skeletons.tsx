export function HeroSkeleton() {
  return (
    <div className="rounded-2xl border p-4">
      <div className="aspect-[16/9] w-full animate-pulse rounded-xl bg-slate-200" />
      <div className="mt-4 h-6 w-3/4 animate-pulse rounded bg-slate-200" />
      <div className="mt-2 h-4 w-1/2 animate-pulse rounded bg-slate-200" />
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="rounded-2xl border p-4">
      <div className="aspect-[16/10] w-full animate-pulse rounded-xl bg-slate-200" />
      <div className="mt-3 h-5 w-5/6 animate-pulse rounded bg-slate-200" />
      <div className="mt-2 h-4 w-2/3 animate-pulse rounded bg-slate-200" />
    </div>
  );
}

export function SectionSkeleton() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-10">
      <div className="mb-6 h-6 w-40 animate-pulse rounded bg-slate-200" />
      <div className="grid gap-6 md:grid-cols-2">
        <HeroSkeleton />
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-3">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    </section>
  );
}
