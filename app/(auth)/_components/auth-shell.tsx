import Link from "next/link";
import type { ReactNode } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PRODUCT_NAME } from "@/config/platform";

export function AuthShell({
  children,
  description,
  title,
}: {
  children: ReactNode;
  description: string;
  title: string;
}) {
  return (
    <main className="grid min-h-screen place-items-center bg-page px-4 py-10">
      <div className="w-full max-w-md">
        <Link className="mb-6 flex items-center justify-center gap-3" href="/">
          <span className="grid size-10 place-items-center rounded-none bg-primary font-black text-primary-foreground text-xs">
            Z
          </span>
          <span className="font-black tracking-normal">{PRODUCT_NAME}</span>
        </Link>

        <Card>
          <CardHeader>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </CardHeader>
          <CardContent>{children}</CardContent>
        </Card>
      </div>
    </main>
  );
}
