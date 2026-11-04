import type { Metadata } from "next";
import type { ReactNode } from "react";

// The contact page is a client component, so its metadata lives here.
export const metadata: Metadata = {
  alternates: { canonical: "/contact" },
  title: "Contact Us",
  description:
    "Contact Zencino for help with orders, delivery, returns or product questions.",
};

export default function ContactLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return children;
}
