import { StoreShell } from "@/components/store/store-shell";
import { ProductGridSkeleton } from "@/components/store/store-skeletons";
import { Skeleton } from "@/components/ui/skeleton";

export default function SearchLoading() {
  return (
    <StoreShell>
      <div className="mx-auto max-w-7xl px-6 py-10 md:py-16">
        {/* Search Input Banner Skeleton */}
        <div className="mx-auto max-w-2xl text-center space-y-3">
          <Skeleton className="mx-auto h-9 w-64 rounded-2xl" />
          <Skeleton className="mx-auto h-4 w-96 max-w-full rounded-full" />
          <Skeleton className="mx-auto h-12 w-full rounded-full" />
        </div>

        {/* Results Skeleton */}
        <div className="mt-12 border-t border-border/80 pt-8">
          <Skeleton className="h-4 w-48 rounded-full mb-6" />
          <ProductGridSkeleton count={8} />
        </div>
      </div>
    </StoreShell>
  );
}
