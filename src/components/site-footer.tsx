import { cacheLife } from "next/cache";
import Link from "next/link";
import { Logo } from "@/components/logo";

// The current year is computed inside a cached scope: Cache Components does
// not allow reading the clock while prerendering the static shell.
async function CopyrightYear() {
  "use cache";
  cacheLife("days");
  return <>{new Date().getFullYear()}</>;
}

export function SiteFooter() {
  return (
    <footer className="mt-16 border-border border-t">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 text-muted text-sm sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex items-center gap-2">
          <Logo className="size-4 text-foreground" />
          <p>
            © <CopyrightYear /> Vercel Daily. All rights reserved.
          </p>
        </div>
        <nav aria-label="Footer" className="flex gap-4">
          <Link href="/" className="hover:text-foreground">
            Home
          </Link>
          <Link href="/search" className="hover:text-foreground">
            Search
          </Link>
        </nav>
      </div>
    </footer>
  );
}
