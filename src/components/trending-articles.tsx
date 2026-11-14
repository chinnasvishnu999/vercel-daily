import { ArticleCard, ArticleCardSkeleton } from "@/components/article-card";
import { getTrendingArticles } from "@/lib/api/articles";

const TRENDING_COUNT = 4;

/**
 * Trending articles, fetched per request (the API returns a random selection
 * each time), excluding the article being read.
 */
export async function TrendingArticles({ excludeId }: { excludeId: string }) {
  let articles: Awaited<ReturnType<typeof getTrendingArticles>>;
  try {
    articles = await getTrendingArticles(excludeId);
  } catch {
    return (
      <p className="text-muted">Trending stories are unavailable right now.</p>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {articles.slice(0, TRENDING_COUNT).map((article) => (
        <ArticleCard
          key={article.id}
          article={article}
          sizes="(min-width: 1024px) 264px, (min-width: 640px) 50vw, 100vw"
        />
      ))}
    </div>
  );
}

export function TrendingSkeleton() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: TRENDING_COUNT }, (_, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: static placeholders
        <ArticleCardSkeleton key={i} />
      ))}
    </div>
  );
}
