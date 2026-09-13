import { StoreShell } from "@/components/store/store-shell";
import {
  CategoryCardSkeleton,
  HeroSkeleton,
  ProductGridSkeleton,
} from "@/components/store/store-skeletons";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <StoreShell>
      {/* 1. Hero Skeleton */}
      <HeroSkeleton />

      {/* 2. Categories Skeleton */}
      <section className="mx-auto max-w-7xl px-6 py-20 md:py-28">
        <div className="mb-12 space-y-2">
          <Skeleton className="h-4 w-32 rounded-full" />
          <Skeleton className="h-9 w-64 rounded-2xl" />
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <CategoryCardSkeleton />
          <CategoryCardSkeleton />
          <CategoryCardSkeleton />
        </div>
      </section>

      {/* 3. Featured Products Skeleton */}
      <section className="mx-auto max-w-7xl px-6 py-16 md:py-24 border-t border-border/80">
        <div className="mb-12 space-y-2">
          <Skeleton className="h-4 w-28 rounded-full" />
          <Skeleton className="h-9 w-56 rounded-2xl" />
        </div>
        <ProductGridSkeleton count={4} />
      </section>
    </StoreShell>
  );
}
