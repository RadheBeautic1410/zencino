"use client";

import Link from "next/link";
import { type FormEvent, useState } from "react";
import { AuthShell } from "@/app/(auth)/_components/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      await authClient.requestPasswordReset({
        email,
        redirectTo: "/reset-password",
      });
      setSent(true);
    } catch {
      setError("Could not connect. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthShell
      description={
        sent
          ? "If that email has an account, a reset link is on its way."
          : "Enter your email and we'll send you a reset link."
      }
      title={sent ? "Check your email" : "Reset your password"}
    >
      {sent ? (
        <div className="space-y-4">
          <p className="rounded-none bg-success-subtle p-3 text-success-foreground text-sm">
            Password reset instructions sent to <strong>{email}</strong>.
          </p>
          <Button
            className="w-full"
            onClick={() => setSent(false)}
            type="button"
            variant="secondary"
          >
            Use a different email
          </Button>
        </div>
      ) : (
        <form className="space-y-4" onSubmit={onSubmit}>
          <label className="block" htmlFor="email">
            <span className="mb-2 block font-semibold text-foreground text-sm">
              Email
            </span>
            <Input
              autoComplete="email"
              id="email"
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              required
              type="email"
              value={email}
            />
          </label>
          {error && (
            <p className="rounded-none bg-destructive/10 p-3 text-destructive text-sm">
              {error}
            </p>
          )}
          <Button className="w-full" disabled={submitting} type="submit">
            {submitting ? "Sending..." : "Send reset link"}
          </Button>
        </form>
      )}
      <p className="mt-6 text-center text-muted-foreground text-xs">
        <Link className="font-semibold text-foreground" href="/login">
          Back to sign in
        </Link>
      </p>
    </AuthShell>
  );
}
