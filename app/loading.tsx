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
      <section className="mx-auto max-w-7xl px-6 py-16 md:py-20">
        <div className="space-y-2">
          <Skeleton className="h-3 w-32 rounded-full" />
          <Skeleton className="h-9 w-64 rounded-2xl" />
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {["a", "b", "c", "d"].map((key) => (
            <CategoryCardSkeleton key={key} />
          ))}
        </div>
      </section>

      {/* 3. Best sellers Skeleton */}
      <section className="bg-secondary/40">
        <div className="mx-auto max-w-7xl px-6 py-16 md:py-20">
          <div className="space-y-2">
            <Skeleton className="h-3 w-28 rounded-full" />
            <Skeleton className="h-9 w-56 rounded-2xl" />
          </div>
          <div className="mt-10">
            <ProductGridSkeleton count={4} />
          </div>
        </div>
      </section>
    </StoreShell>
  );
}
