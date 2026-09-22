import { Skeleton } from "@/components/ui/skeleton";

export default function AccountLoading() {
  return (
    <div className="mx-auto max-w-7xl px-6 py-10 md:py-16 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-28 rounded-full" />
        <Skeleton className="h-9 w-64 rounded-2xl" />
        <Skeleton className="h-4 w-96 max-w-full rounded-full" />
      </div>

      {/* Quick Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div
            className="rounded-2xl border border-border/80 bg-card p-5 space-y-2 shadow-xs"
            key={i}
          >
            <Skeleton className="h-5 w-36 rounded-full" />
            <Skeleton className="h-4 w-full rounded-full" />
            <Skeleton className="h-4 w-2/3 rounded-full" />
          </div>
        ))}
      </div>

      {/* Recent Orders Card */}
      <div className="rounded-2xl border border-border/80 bg-card p-6 space-y-4 shadow-xs">
        <Skeleton className="h-6 w-36 rounded-full" />
        <div className="space-y-3 pt-2">
          {[1, 2, 3].map((i) => (
            <div
              className="flex items-center justify-between py-3 border-b border-border/60"
              key={i}
            >
              <div className="space-y-1">
                <Skeleton className="h-4 w-32 rounded-full" />
                <Skeleton className="h-3 w-48 rounded-full" />
              </div>
              <Skeleton className="h-7 w-20 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
