import Link from "next/link";
import { getArticles, getBreakingNews } from "@/lib/api/articles";

/** Latest breaking news, linked to its article when we can resolve it. */
export async function BreakingNewsBanner() {
  const [news, articles] = await Promise.all([
    getBreakingNews(),
    getArticles({ limit: 50 }),
  ]);
  if (!news) return null;

  // Breaking news references the article by id; our routes use slugs.
  const article = articles.find((a) => a.id === news.articleId);

  return (
    <section
      aria-label="Breaking news"
      className="border-border border-b bg-surface"
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-3 text-sm sm:flex-row sm:items-center sm:gap-3 sm:px-6">
        <span className="inline-flex w-fit shrink-0 items-center gap-1.5 rounded-full bg-breaking-bg px-2.5 py-0.5 font-semibold text-white text-xs uppercase tracking-wide">
          <span
            aria-hidden="true"
            className="size-1.5 animate-pulse rounded-full bg-white"
          />
          {news.urgent ? "Urgent" : "Breaking"}
        </span>
        <p className="min-w-0">
          {article ? (
            <Link
              href={`/articles/${article.slug}`}
              className="font-medium hover:underline"
            >
              {news.headline}
            </Link>
          ) : (
            <span className="font-medium">{news.headline}</span>
          )}
          <span className="hidden text-muted md:inline"> · {news.summary}</span>
        </p>
      </div>
    </section>
  );
}

export function BreakingNewsSkeleton() {
  return (
    <div className="border-border border-b bg-surface">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 sm:px-6">
        <div className="h-5 w-20 animate-pulse rounded-full bg-border" />
        <div className="h-4 w-2/3 animate-pulse rounded bg-border" />
      </div>
    </div>
  );
}
