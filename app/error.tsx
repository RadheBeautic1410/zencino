"use client";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <div className="mx-auto max-w-lg space-y-4 px-6 py-20">
      <h1 className="text-2xl font-bold">Something went wrong</h1>
      <p>
        Please try again. If you were submitting a request, check its status
        before retrying.
      </p>
      <button
        className="bg-primary px-5 py-3 text-primary-foreground"
        onClick={reset}
        type="button"
      >
        Try again
      </button>
    </div>
  );
}
