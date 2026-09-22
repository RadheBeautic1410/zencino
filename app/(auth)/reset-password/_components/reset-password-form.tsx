"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { type FormEvent, Suspense, useState } from "react";
import { AuthShell } from "@/app/(auth)/_components/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";

export function ResetPasswordForm() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordFormInner />
    </Suspense>
  );
}

function ResetPasswordFormInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const invalidToken = !token || searchParams.get("error") === "INVALID_TOKEN";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (!token) {
      return;
    }

    setSubmitting(true);
    try {
      const result = await authClient.resetPassword({
        newPassword: password,
        token,
      });
      if (result.error) {
        setError(result.error.message ?? "Failed to reset password.");
        return;
      }
      router.replace("/login?reset=success");
    } catch {
      setError("Could not connect. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (invalidToken) {
    return (
      <AuthShell
        description="This password reset link is invalid or has expired."
        title="Link expired"
      >
        <Link
          className="font-semibold text-foreground text-sm"
          href="/forgot-password"
        >
          Request a new link
        </Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      description="Choose a new password for your account."
      title="Set new password"
    >
      <form className="space-y-4" onSubmit={onSubmit}>
        <label className="block" htmlFor="password">
          <span className="mb-2 block font-semibold text-foreground text-sm">
            New password
          </span>
          <Input
            autoComplete="new-password"
            id="password"
            minLength={8}
            onChange={(event) => setPassword(event.target.value)}
            required
            type="password"
            value={password}
          />
        </label>
        <label className="block" htmlFor="confirmPassword">
          <span className="mb-2 block font-semibold text-foreground text-sm">
            Confirm new password
          </span>
          <Input
            autoComplete="new-password"
            id="confirmPassword"
            minLength={8}
            onChange={(event) => setConfirmPassword(event.target.value)}
            required
            type="password"
            value={confirmPassword}
          />
        </label>
        {error && (
          <p className="rounded-none bg-destructive/10 p-3 text-destructive text-sm">
            {error}
          </p>
        )}
        <Button className="w-full" disabled={submitting} type="submit">
          {submitting ? "Saving..." : "Reset password"}
        </Button>
      </form>
    </AuthShell>
  );
}
