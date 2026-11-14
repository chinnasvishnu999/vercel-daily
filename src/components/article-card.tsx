import Image from "next/image";
import Link from "next/link";
import type { ArticleSummary } from "@/lib/api/schemas";
import { formatDate, humanizeSlug } from "@/lib/format";
import { stripInline } from "@/lib/inline-markdown";

type Props = {
  article: ArticleSummary;
  /** Preload the image when the card is the page's LCP candidate. */
  priority?: boolean;
  sizes?: string;
};

export function ArticleCard({
  article,
  priority = false,
  sizes = "(min-width: 1024px) 352px, (min-width: 640px) 50vw, 100vw",
}: Props) {
  return (
    <article className="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-background transition-colors hover:bg-surface">
      <div className="relative aspect-[16/9] overflow-hidden bg-surface">
        <Image
          src={article.image}
          alt=""
          fill
          sizes={sizes}
          preload={priority}
          className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
        />
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-center gap-2 text-muted text-xs">
          <span className="font-medium text-accent uppercase tracking-wide">
            {humanizeSlug(article.category)}
          </span>
          <span aria-hidden="true">·</span>
          <time dateTime={article.publishedAt}>
            {formatDate(article.publishedAt)}
          </time>
        </div>
        <h3 className="font-semibold text-lg leading-snug">
          {/* The whole card is clickable through this link's ::after overlay */}
          <Link
            href={`/articles/${article.slug}`}
            className="after:absolute after:inset-0 focus-visible:outline-none focus-visible:after:rounded-xl focus-visible:after:ring-2 focus-visible:after:ring-accent"
          >
            {article.title}
          </Link>
        </h3>
        <p className="line-clamp-2 text-muted text-sm">
          {stripInline(article.excerpt)}
        </p>
      </div>
    </article>
  );
}

export function ArticleCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <div className="aspect-[16/9] animate-pulse bg-surface" />
      <div className="space-y-3 p-4">
        <div className="h-3 w-1/3 animate-pulse rounded bg-surface" />
        <div className="h-5 w-5/6 animate-pulse rounded bg-surface" />
        <div className="h-4 w-full animate-pulse rounded bg-surface" />
      </div>
    </div>
  );
}

export function ArticleGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{children}</div>
  );
}
