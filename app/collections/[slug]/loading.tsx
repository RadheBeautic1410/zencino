import { StoreShell } from "@/components/store/store-shell";
import { ProductGridSkeleton } from "@/components/store/store-skeletons";
import { Skeleton } from "@/components/ui/skeleton";

export default function CollectionLoading() {
  return (
    <StoreShell>
      <div className="mx-auto max-w-7xl px-6 py-10 md:py-16">
        {/* Collection Banner Skeleton */}
        <div className="border-b border-border/80 pb-8 space-y-3">
          <Skeleton className="h-4 w-28 rounded-full" />
          <Skeleton className="h-10 w-72 rounded-2xl" />
          <Skeleton className="h-4 w-96 max-w-full rounded-full" />
        </div>

        {/* Product Grid Skeleton */}
        <div className="mt-10">
          <ProductGridSkeleton count={8} />
        </div>
      </div>
    </StoreShell>
  );
}
