import { ArrowSquareOut, Package, Plus } from "@phosphor-icons/react/dist/ssr";
import Image from "next/image";
import Link from "next/link";
import { OrbitPageHeader } from "@/components/admin/orbit-page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getAdminProducts } from "@/lib/catalog/queries";
import { formatDateTime } from "@/lib/utils";

export const metadata = {
  title: "Products - Zencino Admin",
};

interface SearchParams {
  category?: string;
  status?: "draft" | "published" | "archived";
}

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const resolvedParams = await searchParams;
  const statusFilter = resolvedParams.status;
  const categoryFilter = resolvedParams.category;

  const products = await getAdminProducts({
    status: statusFilter,
    categoryId: categoryFilter,
  });

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <OrbitPageHeader
          description="Manage multi-variant products, channel availability (Website & Amazon), and media."
          eyebrow="Catalog"
          title="Products"
        />
        <Button asChild className="self-start sm:self-auto" size="sm">
          <Link href="/admin/products/new">
            <Plus className="mr-1.5" size={14} /> New Product
          </Link>
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className="mb-6 flex flex-wrap items-center gap-2 border-b border-border pb-3">
        <Link
          className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-ui transition-colors ${
            statusFilter
              ? "text-muted-foreground hover:text-foreground"
              : "bg-primary text-primary-foreground"
          }`}
          href="/admin/products"
        >
          All
        </Link>
        <Link
          className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-ui transition-colors ${
            statusFilter === "published"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
          href="/admin/products?status=published"
        >
          Published
        </Link>
        <Link
          className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-ui transition-colors ${
            statusFilter === "draft"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
          href="/admin/products?status=draft"
        >
          Drafts
        </Link>
        <Link
          className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-ui transition-colors ${
            statusFilter === "archived"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
          href="/admin/products?status=archived"
        >
          Archived
        </Link>
      </div>

      {/* Product Table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Catalog Items ({products.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {products.length === 0 ? (
            <div className="p-12 text-center">
              <Package
                className="mx-auto mb-3 text-muted-foreground/50"
                size={36}
              />
              <p className="font-semibold text-sm">No products found</p>
              <p className="mt-1 text-muted-foreground text-xs">
                {statusFilter
                  ? `No products with status "${statusFilter}".`
                  : "Start by creating your first product."}
              </p>
              <Button asChild className="mt-4" size="sm">
                <Link href="/admin/products/new">Create Product</Link>
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Image</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Variants</TableHead>
                  <TableHead>Channels</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="p-2">
                      <div className="relative size-12 overflow-hidden border border-border bg-muted flex items-center justify-center">
                        {p.primaryImage ? (
                          <Image
                            alt={p.name}
                            className="object-cover"
                            fill
                            sizes="48px"
                            src={p.primaryImage}
                          />
                        ) : (
                          <Package
                            className="text-muted-foreground/40"
                            size={20}
                          />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Link
                        className="font-semibold text-sm hover:underline"
                        href={`/admin/products/${p.id}`}
                      >
                        {p.name}
                      </Link>
                      <p className="font-mono text-2xs text-muted-foreground">
                        /{p.slug}
                      </p>
                    </TableCell>
                    <TableCell className="text-xs">
                      {p.primaryCategoryName || (
                        <span className="text-muted-foreground">
                          Unassigned
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs font-mono">
                      {p.variantCount}{" "}
                      {p.variantCount === 1 ? "variant" : "variants"}
                      {p.minPriceMinor !== null && (
                        <span className="block text-2xs text-muted-foreground">
                          From ₹
                          {(p.minPriceMinor / 100).toLocaleString("en-IN")}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {p.hasWebsiteChannel && (
                          <span className="bg-blue-500/10 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 text-2xs font-semibold uppercase tracking-ui">
                            Website
                          </span>
                        )}
                        {p.hasAmazonChannel && (
                          <span className="bg-amber-500/10 text-amber-700 dark:text-amber-400 px-1.5 py-0.5 text-2xs font-semibold uppercase tracking-ui">
                            Amazon
                          </span>
                        )}
                        {!p.hasWebsiteChannel && !p.hasAmazonChannel && (
                          <span className="text-muted-foreground text-2xs">
                            None
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          p.status === "published" ? "text-success" : ""
                        }
                        variant={
                          p.status === "published" ? "default" : "secondary"
                        }
                      >
                        {p.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDateTime(p.updatedAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button asChild size="sm" variant="ghost">
                        <Link href={`/admin/products/${p.id}`}>
                          Edit <ArrowSquareOut className="ml-1" size={13} />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
