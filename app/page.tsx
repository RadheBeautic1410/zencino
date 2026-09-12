import { StoreShell } from "@/components/store/store-shell";

export default function HomePage() {
  return (
    <StoreShell>
      <section className="mx-auto grid max-w-7xl gap-12 px-6 py-20 md:grid-cols-2 md:items-center md:py-28">
        <div>
          <p className="mb-5 text-xs font-bold uppercase tracking-widest text-success">
            Welcome to Zencino
          </p>
          <h1 className="max-w-xl text-5xl font-bold leading-tight tracking-tight md:text-7xl">
            A little order.
            <br />A lot of possibility.
          </h1>
          <p className="mt-6 max-w-lg text-lg leading-8 text-muted-foreground">
            Discover Zencino for your home and kitchen, from acrylic essentials
            to everyday finds.
          </p>
          <a
            className="mt-8 inline-flex bg-primary px-6 py-3 font-semibold text-primary-foreground"
            href="#collections"
          >
            Explore Zencino
          </a>
        </div>
        <div className="rounded-3xl border border-border bg-background p-10 md:p-14">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Our next chapter
          </p>
          <h2 className="mt-6 text-3xl font-semibold leading-tight">
            Your favourites.
            <br />
            More ways to shop.
          </h2>
          <p className="mt-6 leading-7 text-muted-foreground">
            Our online store is taking shape. Soon, you can discover our
            products here and choose to shop with Zencino or on Amazon.
          </p>
          <p className="mt-8 border-t border-border pt-5 text-sm">
            Website ordering is not open yet.
          </p>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-6 pb-24" id="collections">
        <h2 className="mb-8 text-3xl font-semibold">
          Made for everyday spaces
        </h2>
        <div className="grid gap-6 md:grid-cols-2">
          <article className="border border-border bg-background p-8">
            <p className="mb-4 text-sm text-success">01 / Home & Kitchen</p>
            <h3 className="text-2xl font-semibold">
              Find a place for the everyday.
            </h3>
            <p className="mt-4 leading-7 text-muted-foreground">
              Explore our home and kitchen range as the catalog arrives.
            </p>
          </article>
          <article className="border border-border bg-background p-8">
            <p className="mb-4 text-sm text-success">02 / Acrylic essentials</p>
            <h3 className="text-2xl font-semibold">
              A clearer view of your space.
            </h3>
            <p className="mt-4 leading-7 text-muted-foreground">
              Our acrylic collection will be available to explore here soon.
            </p>
          </article>
        </div>
      </section>
    </StoreShell>
  );
}
