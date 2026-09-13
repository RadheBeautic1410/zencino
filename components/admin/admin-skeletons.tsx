import { Skeleton } from "@/components/ui/skeleton";

export function AdminOverviewSkeleton() {
  return (
    <div className="space-y-8 p-6 md:p-10">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-60 rounded-xl" />
        <Skeleton className="h-4 w-96 rounded-full" />
      </div>

      {/* Metric Cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-2xl border border-border/80 bg-card p-6 space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-24 rounded-full" />
              <Skeleton className="size-8 rounded-lg" />
            </div>
            <Skeleton className="h-8 w-28 rounded-xl" />
            <Skeleton className="h-3 w-36 rounded-full" />
          </div>
        ))}
      </div>

      {/* Orders Table */}
      <div className="rounded-2xl border border-border/80 bg-card p-6 space-y-4 shadow-xs">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-36 rounded-full" />
          <Skeleton className="h-8 w-24 rounded-full" />
        </div>
        <div className="space-y-3 pt-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center justify-between py-3 border-b border-border/60">
              <div className="flex items-center gap-3">
                <Skeleton className="h-4 w-28 rounded-full" />
                <Skeleton className="h-4 w-36 rounded-full" />
              </div>
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-4 w-16 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function AdminTableSkeleton() {
  return (
    <div className="space-y-6 p-6 md:p-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48 rounded-xl" />
          <Skeleton className="h-4 w-72 rounded-full" />
        </div>
        <Skeleton className="h-10 w-36 rounded-full" />
      </div>

      {/* Filter / Search Bar */}
      <div className="flex gap-4">
        <Skeleton className="h-10 w-72 rounded-xl" />
        <Skeleton className="h-10 w-32 rounded-xl" />
      </div>

      {/* Table Rows */}
      <div className="rounded-2xl border border-border/80 bg-card p-6 space-y-3 shadow-xs">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="flex items-center justify-between py-3 border-b border-border/60">
            <Skeleton className="h-4 w-1/4 rounded-full" />
            <Skeleton className="h-4 w-1/4 rounded-full" />
            <Skeleton className="h-4 w-1/6 rounded-full" />
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
