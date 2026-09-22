"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { type FormEvent, Suspense, useEffect, useState } from "react";
import { AuthShell } from "@/app/(auth)/_components/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { signUp, useSession } from "@/lib/auth-client";
import { safeReturnPath } from "@/lib/auth-redirect";

export function SignupForm() {
  return (
    <Suspense fallback={null}>
      <SignupFormInner />
    </Suspense>
  );
}

function SignupFormInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, isPending } = useSession();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (session) {
      router.replace(safeReturnPath(searchParams.get("next")));
    }
  }, [router, session, searchParams]);

  if (isPending || session) {
    return null;
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    try {
      const callbackURL = safeReturnPath(searchParams.get("next"));
      const result = await signUp.email({
        callbackURL,
        email,
        name,
        password,
      });
      if (result.error) {
        setError(result.error.message ?? "Failed to create account.");
      }
    } catch {
      setError("Could not connect. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthShell
      description="Enter your details to create a Zencino account."
      title="Create account"
    >
      <form className="space-y-4" onSubmit={onSubmit}>
        <label className="block" htmlFor="name">
          <span className="mb-2 block font-semibold text-foreground text-sm">
            Name
          </span>
          <Input
            autoComplete="name"
            id="name"
            onChange={(event) => setName(event.target.value)}
            required
            value={name}
          />
        </label>
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
        <label className="block" htmlFor="password">
          <span className="mb-2 block font-semibold text-foreground text-sm">
            Password
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
            Confirm password
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
          {submitting ? "Creating account..." : "Create account"}
        </Button>
      </form>
      <p className="mt-6 text-center text-muted-foreground text-xs">
        Already have an account?{" "}
        <Link className="font-semibold text-foreground" href="/login">
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}
