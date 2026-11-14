"use client";

import { useEffect } from "react";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-xl flex-col items-center gap-4 px-4 py-24 text-center">
      <h1 className="font-bold text-3xl tracking-tight">
        Something went wrong
      </h1>
      <p className="text-muted">
        We couldn’t load this page right now. Please try again in a moment.
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-2 inline-flex h-10 items-center rounded-full bg-foreground px-5 font-medium text-background text-sm"
      >
        Try again
      </button>
    </div>
  );
}
