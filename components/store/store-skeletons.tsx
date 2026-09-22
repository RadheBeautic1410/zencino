import { Skeleton } from "@/components/ui/skeleton";

export function ProductCardSkeleton() {
  return (
    <div className="flex flex-col rounded-2xl border border-border/80 bg-card overflow-hidden">
      {/* Aspect square image placeholder */}
      <div className="relative aspect-square w-full bg-muted/30">
        <Skeleton className="size-full rounded-none" />
      </div>

      {/* Info placeholder */}
      <div className="flex flex-1 flex-col p-5 space-y-3">
        {/* Category tag */}
        <Skeleton className="h-3 w-1/3 rounded-full" />

        {/* Title */}
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-4/5 rounded-full" />
          <Skeleton className="h-4 w-3/5 rounded-full" />
        </div>

        {/* Price & button row */}
        <div className="mt-auto pt-4 flex items-end justify-between gap-2 border-t border-border/60">
          <div className="space-y-1">
            <Skeleton className="h-5 w-20 rounded-full" />
            <Skeleton className="h-3 w-12 rounded-full" />
          </div>
          <Skeleton className="h-7 w-16 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: count }, (_, i) => `product-skeleton-${i}`).map(
        (key) => (
          <ProductCardSkeleton key={key} />
        )
      )}
    </div>
  );
}

export function CategoryCardSkeleton() {
  return (
    <div className="flex flex-col justify-between rounded-2xl border border-border/80 bg-card p-8 min-h-[220px]">
      <div className="space-y-3">
        <Skeleton className="h-5 w-10 rounded-md" />
        <Skeleton className="h-7 w-3/4 rounded-full" />
        <Skeleton className="h-4 w-full rounded-full" />
        <Skeleton className="h-4 w-2/3 rounded-full" />
      </div>
      <div className="mt-8 flex items-center gap-2">
        <Skeleton className="h-4 w-28 rounded-full" />
      </div>
    </div>
  );
}

export function HeroSkeleton() {
  return (
    <section className="relative overflow-hidden border-b border-border/80 bg-gradient-to-b from-primary/5 via-background to-page">
      <div className="mx-auto grid max-w-7xl gap-12 px-6 py-20 md:grid-cols-12 md:items-center md:py-28">
        <div className="md:col-span-7 space-y-6">
          {/* Eyebrow badge */}
          <Skeleton className="h-7 w-52 rounded-full" />

          {/* Heading lines */}
          <div className="space-y-3">
            <Skeleton className="h-12 w-4/5 rounded-2xl" />
            <Skeleton className="h-12 w-3/5 rounded-2xl" />
          </div>

          {/* Subtitle */}
          <div className="space-y-2 pt-2">
            <Skeleton className="h-4 w-full max-w-lg rounded-full" />
            <Skeleton className="h-4 w-4/5 max-w-lg rounded-full" />
          </div>

          {/* Buttons */}
          <div className="flex flex-wrap items-center gap-4 pt-4">
            <Skeleton className="h-12 w-44 rounded-full" />
            <Skeleton className="h-12 w-40 rounded-full" />
          </div>

          {/* Value highlights */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-8 border-t border-border/60">
            <Skeleton className="h-10 rounded-xl" />
            <Skeleton className="h-10 rounded-xl" />
            <Skeleton className="h-10 rounded-xl" />
          </div>
        </div>

        {/* Feature showcase */}
        <div className="md:col-span-5">
          <div className="rounded-3xl border border-border/80 bg-card p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-28 rounded-full" />
              <Skeleton className="h-4 w-16 rounded-full" />
            </div>
            <Skeleton className="aspect-square w-full rounded-2xl" />
            <div className="space-y-2 pt-2">
              <Skeleton className="h-6 w-3/4 rounded-full" />
              <Skeleton className="h-7 w-28 rounded-full" />
            </div>
            <div className="flex items-center justify-between border-t border-border/70 pt-4">
              <Skeleton className="h-4 w-32 rounded-full" />
              <Skeleton className="h-4 w-24 rounded-full" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function ProductDetailSkeleton() {
  return (
    <div className="mx-auto max-w-7xl px-6 py-8 md:py-14">
      {/* Breadcrumb */}
      <div className="mb-6 flex items-center gap-2">
        <Skeleton className="h-3 w-12 rounded-full" />
        <span className="text-muted-foreground/40">/</span>
        <Skeleton className="h-3 w-16 rounded-full" />
        <span className="text-muted-foreground/40">/</span>
        <Skeleton className="h-3 w-28 rounded-full" />
      </div>

      <div className="grid gap-12 lg:grid-cols-12 lg:items-start">
        {/* Gallery */}
        <div className="lg:col-span-7 space-y-4">
          <Skeleton className="aspect-square w-full rounded-3xl" />
          <div className="flex gap-3 pt-1">
            <Skeleton className="size-20 rounded-2xl shrink-0" />
            <Skeleton className="size-20 rounded-2xl shrink-0" />
            <Skeleton className="size-20 rounded-2xl shrink-0" />
          </div>
        </div>

        {/* Details */}
        <div className="lg:col-span-5 space-y-6">
          <Skeleton className="h-6 w-32 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-9 w-full rounded-2xl" />
            <Skeleton className="h-9 w-3/4 rounded-2xl" />
          </div>

          {/* Price */}
          <div className="border-b border-border/80 pb-5 space-y-2">
            <div className="flex items-baseline gap-3">
              <Skeleton className="h-10 w-32 rounded-full" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
            <Skeleton className="h-3 w-48 rounded-full" />
          </div>

          {/* Options */}
          <div className="space-y-3">
            <Skeleton className="h-4 w-36 rounded-full" />
            <div className="flex gap-2">
              <Skeleton className="h-10 w-28 rounded-xl" />
              <Skeleton className="h-10 w-28 rounded-xl" />
            </div>
          </div>

          {/* Action Box */}
          <div className="rounded-3xl border border-border/80 bg-card p-6 space-y-4 shadow-sm">
            <Skeleton className="h-4 w-32 rounded-full" />
            <Skeleton className="h-12 w-full rounded-full" />
            <Skeleton className="h-12 w-full rounded-full" />
          </div>

          {/* Trust badges */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <Skeleton className="h-14 rounded-2xl" />
            <Skeleton className="h-14 rounded-2xl" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function CartSkeleton() {
  return (
    <div className="mx-auto max-w-7xl px-6 py-10 md:py-16">
      <div className="border-b border-border/80 pb-6">
        <Skeleton className="h-10 w-64 rounded-2xl" />
      </div>

      {/* Free shipping meter */}
      <div className="mt-6 rounded-2xl border border-border/80 bg-card p-5 space-y-3">
        <Skeleton className="h-4 w-72 rounded-full" />
        <Skeleton className="h-2 w-full rounded-full" />
      </div>

      <div className="mt-8 grid gap-10 lg:grid-cols-12 lg:items-start">
        {/* Cart Item rows */}
        <div className="lg:col-span-8 divide-y divide-border/70 border-y border-border/80">
          {[1, 2].map((i) => (
            <div className="py-6 flex gap-5 items-start" key={i}>
              <Skeleton className="size-24 rounded-2xl shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-3/4 rounded-full" />
                <Skeleton className="h-3 w-1/3 rounded-full" />
                <div className="pt-3 flex items-center gap-4">
                  <Skeleton className="h-8 w-24 rounded-full" />
                  <Skeleton className="h-4 w-16 rounded-full" />
                </div>
              </div>
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
          ))}
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-4 rounded-3xl border border-border/80 bg-card p-6 space-y-5 shadow-sm">
          <Skeleton className="h-5 w-32 rounded-full" />
          <div className="space-y-3 border-b border-border/80 pb-4">
            <div className="flex justify-between">
              <Skeleton className="h-4 w-20 rounded-full" />
              <Skeleton className="h-4 w-16 rounded-full" />
            </div>
            <div className="flex justify-between">
              <Skeleton className="h-4 w-16 rounded-full" />
              <Skeleton className="h-4 w-12 rounded-full" />
            </div>
          </div>
          <div className="flex justify-between">
            <Skeleton className="h-6 w-28 rounded-full" />
            <Skeleton className="h-7 w-24 rounded-full" />
          </div>
          <Skeleton className="h-12 w-full rounded-full" />
        </div>
      </div>
    </div>
  );
}

export function CheckoutSkeleton() {
  return (
    <div className="mx-auto max-w-7xl px-6 py-10 md:py-16">
      <div className="mb-6 flex items-center justify-between border-b border-border/80 pb-4">
        <div className="space-y-1">
          <Skeleton className="h-9 w-64 rounded-2xl" />
          <Skeleton className="h-3 w-80 rounded-full" />
        </div>
        <Skeleton className="h-4 w-24 rounded-full" />
      </div>

      <div className="grid gap-12 lg:grid-cols-12 lg:items-start">
        <div className="lg:col-span-7 border border-border/80 bg-card p-6 md:p-8 space-y-5 rounded-3xl shadow-sm">
          <Skeleton className="h-5 w-48 rounded-full" />
          <div className="space-y-4">
            <Skeleton className="h-10 w-full rounded-xl" />
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-10 w-full rounded-xl" />
              <Skeleton className="h-10 w-full rounded-xl" />
            </div>
            <Skeleton className="h-10 w-full rounded-xl" />
            <div className="grid grid-cols-3 gap-3">
              <Skeleton className="h-10 w-full rounded-xl" />
              <Skeleton className="h-10 w-full rounded-xl" />
              <Skeleton className="h-10 w-full rounded-xl" />
            </div>
          </div>
          <Skeleton className="h-12 w-full rounded-full" />
        </div>

        <div className="lg:col-span-5 rounded-3xl border border-border/80 bg-card p-6 md:p-8 space-y-5 shadow-sm">
          <Skeleton className="h-5 w-36 rounded-full" />
          <div className="space-y-3">
            <Skeleton className="h-14 w-full rounded-xl" />
            <Skeleton className="h-14 w-full rounded-xl" />
          </div>
          <div className="border-t border-border/80 pt-4 space-y-2">
            <Skeleton className="h-4 w-full rounded-full" />
            <Skeleton className="h-4 w-full rounded-full" />
            <Skeleton className="h-7 w-full rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
