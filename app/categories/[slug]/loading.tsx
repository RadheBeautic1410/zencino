import { StoreShell } from "@/components/store/store-shell";
import { ProductGridSkeleton } from "@/components/store/store-skeletons";
import { Skeleton } from "@/components/ui/skeleton";

export default function CategoryLoading() {
  return (
    <StoreShell>
      <div className="mx-auto max-w-7xl px-6 py-10 md:py-16">
        {/* Breadcrumb Skeleton */}
        <div className="mb-4 flex items-center gap-2">
          <Skeleton className="h-3 w-12 rounded-full" />
          <span className="text-muted-foreground/40">/</span>
          <Skeleton className="h-3 w-16 rounded-full" />
          <span className="text-muted-foreground/40">/</span>
          <Skeleton className="h-3 w-28 rounded-full" />
        </div>

        {/* Category Header Skeleton */}
        <div className="border-b border-border/80 pb-8 space-y-3">
          <Skeleton className="h-10 w-64 rounded-2xl" />
          <Skeleton className="h-4 w-96 max-w-full rounded-full" />
          <div className="mt-4 flex gap-2">
            <Skeleton className="h-7 w-24 rounded-full" />
            <Skeleton className="h-7 w-28 rounded-full" />
          </div>
        </div>

        {/* Product Grid Skeleton */}
        <div className="mt-10">
          <ProductGridSkeleton count={8} />
        </div>
      </div>
    </StoreShell>
  );
}
