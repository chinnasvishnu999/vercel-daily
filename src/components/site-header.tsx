import Link from "next/link";
import { Suspense } from "react";
import { Logo } from "@/components/logo";
import { NavLinks } from "@/components/nav-links";
import { SubscriptionControl } from "@/components/subscription-control";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-border border-b bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:gap-6 sm:px-6">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2 font-semibold tracking-tight"
          aria-label="Vercel Daily home"
        >
          <Logo className="size-5" />
          <span className="hidden sm:inline">Vercel Daily</span>
        </Link>

        <NavLinks />

        <div className="ml-auto">
          {/* Reads the subscription cookie at request time, so it streams in
              behind a same-size placeholder while the header stays static. */}
          <Suspense
            fallback={
              <div className="h-9 w-28 animate-pulse rounded-full bg-surface" />
            }
          >
            <SubscriptionControl />
          </Suspense>
        </div>
      </div>
    </header>
  );
}
