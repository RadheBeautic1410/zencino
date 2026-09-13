import { StoreShell } from "@/components/store/store-shell";
import { ProductGridSkeleton } from "@/components/store/store-skeletons";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProductsLoading() {
  return (
    <StoreShell>
      <div className="mx-auto max-w-7xl px-6 py-10 md:py-16">
        {/* Header Skeleton */}
        <div className="border-b border-border/80 pb-8 space-y-3">
          <Skeleton className="h-4 w-32 rounded-full" />
          <Skeleton className="h-10 w-64 rounded-2xl" />
          <Skeleton className="h-4 w-96 max-w-full rounded-full" />
        </div>

        {/* Categories Bar & Sort Skeleton */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-b border-border/80 pb-4">
          <div className="flex flex-wrap items-center gap-2">
            <Skeleton className="h-8 w-28 rounded-full" />
            <Skeleton className="h-8 w-36 rounded-full" />
            <Skeleton className="h-8 w-32 rounded-full" />
            <Skeleton className="h-8 w-36 rounded-full" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-12 rounded-full" />
            <Skeleton className="h-4 w-36 rounded-full" />
          </div>
        </div>

        {/* Product Grid Skeleton */}
        <div className="mt-8">
          <ProductGridSkeleton count={8} />
        </div>
      </div>
    </StoreShell>
  );
}
