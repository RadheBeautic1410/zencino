"use client";

import {
  Archive,
  ArrowCounterClockwise,
  ArrowSquareOut,
  Trash,
} from "@phosphor-icons/react";
import Link from "next/link";
import { useTransition } from "react";
import { toast } from "sonner";
import {
  deleteProductAction,
  updateProductStatusAction,
} from "@/app/actions/catalog-products";
import { Button } from "@/components/ui/button";
import { useConfirm } from "@/components/ui/confirm-dialog";

interface ProductRowActionsProps {
  productId: string;
  productName: string;
  status: "draft" | "published" | "archived";
}

export function ProductRowActions({
  productId,
  productName,
  status,
}: ProductRowActionsProps) {
  const [isPending, startTransition] = useTransition();
  const [confirm, confirmDialog] = useConfirm();

  const handleArchive = async () => {
    const confirmed = await confirm({
      title: "Archive product?",
      description: `"${productName}" will be hidden from the storefront. You can restore it later.`,
      confirmLabel: "Archive",
    });
    if (!confirmed) {
      return;
    }
    startTransition(async () => {
      const res = await updateProductStatusAction(productId, "archived");
      if (res.error) {
        toast.error("Could not archive product", { description: res.error });
      } else {
        toast.success("Product archived", { description: productName });
      }
    });
  };

  const handleRestore = () => {
    startTransition(async () => {
      const res = await updateProductStatusAction(productId, "draft");
      if (res.error) {
        toast.error("Could not restore product", { description: res.error });
      } else {
        toast.success("Product restored to draft", {
          description: productName,
        });
      }
    });
  };

  const handleDelete = async () => {
    const confirmed = await confirm({
      title: "Delete product?",
      description: `"${productName}" will be permanently deleted. This cannot be undone.`,
      confirmLabel: "Delete",
      destructive: true,
    });
    if (!confirmed) {
      return;
    }
    startTransition(async () => {
      const res = await deleteProductAction(productId);
      if (res.error) {
        toast.error("Could not delete product", { description: res.error });
      } else {
        toast.success("Product deleted", { description: productName });
      }
    });
  };

  return (
    <div className="flex items-center justify-end gap-1">
      {confirmDialog}
      <Button asChild size="sm" variant="ghost">
        <Link href={`/admin/products/${productId}`}>
          Edit <ArrowSquareOut className="ml-1" size={13} />
        </Link>
      </Button>
      {status === "archived" ? (
        <Button
          aria-label="Restore to draft"
          className="w-9 px-0"
          disabled={isPending}
          onClick={handleRestore}
          size="sm"
          title="Restore to draft"
          variant="ghost"
        >
          <ArrowCounterClockwise size={15} />
        </Button>
      ) : (
        <Button
          aria-label="Archive product"
          className="w-9 px-0"
          disabled={isPending}
          onClick={handleArchive}
          size="sm"
          title="Archive product"
          variant="ghost"
        >
          <Archive size={15} />
        </Button>
      )}
      {/* Always reserve the delete slot so action columns line up across rows. */}
      {status === "draft" ? (
        <Button
          aria-label="Delete product"
          className="w-9 px-0 text-destructive hover:text-destructive"
          disabled={isPending}
          onClick={handleDelete}
          size="sm"
          title="Delete product"
          variant="ghost"
        >
          <Trash size={15} />
        </Button>
      ) : (
        <span aria-hidden="true" className="w-9" />
      )}
    </div>
  );
}
