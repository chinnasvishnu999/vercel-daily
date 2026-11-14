import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Page not found",
};

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center gap-4 px-4 py-24 text-center">
      <p className="font-mono text-muted text-sm">404</p>
      <h1 className="font-bold text-3xl tracking-tight">
        We couldn’t find that page
      </h1>
      <p className="text-muted">
        The article may have moved or never existed. Try searching for it
        instead.
      </p>
      <div className="mt-2 flex gap-3">
        <Link
          href="/"
          className="inline-flex h-10 items-center rounded-full bg-foreground px-5 font-medium text-background text-sm"
        >
          Go home
        </Link>
        <Link
          href="/search"
          className="inline-flex h-10 items-center rounded-full border border-border px-5 font-medium text-sm hover:bg-surface"
        >
          Search articles
        </Link>
      </div>
    </div>
  );
}
