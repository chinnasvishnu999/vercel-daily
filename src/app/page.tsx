import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { ArticleCard, ArticleGrid } from "@/components/article-card";
import {
  BreakingNewsBanner,
  BreakingNewsSkeleton,
} from "@/components/breaking-news-banner";
import { SubscribeCta } from "@/components/subscribe-cta";
import { getArticles, getRecentArticles } from "@/lib/api/articles";
import type { ArticleSummary } from "@/lib/api/schemas";
import { formatDate, humanizeSlug } from "@/lib/format";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: { absolute: `${site.name}: News from the Vercel ecosystem` },
  description: site.description,
  alternates: { canonical: "/" },
  openGraph: {
    title: site.name,
    description: site.description,
    url: "/",
  },
};

const FEATURED_COUNT = 6;

/**
 * Lead story for the hero plus at least 6 featured articles for the grid.
 * The hero story is excluded from the grid so nothing appears twice; recent
 * articles fill any gap.
 */
async function getHomeContent() {
  const [recent, featured] = await Promise.all([
    getRecentArticles(12),
    getArticles({ featured: true, limit: 12 }),
  ]);
  const lead = recent[0];
  const grid: ArticleSummary[] = [];
  for (const article of [...featured, ...recent]) {
    if (grid.length === FEATURED_COUNT) break;
    if (article.id === lead?.id || grid.some((a) => a.id === article.id)) {
      continue;
    }
    grid.push(article);
  }
  return { lead, grid };
}

export default async function HomePage() {
  const { lead, grid } = await getHomeContent();

  return (
    <>
      <Suspense fallback={<BreakingNewsSkeleton />}>
        <BreakingNewsBanner />
      </Suspense>

      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* Hero */}
        <section className="grid items-center gap-8 py-10 sm:py-14 lg:grid-cols-2 lg:gap-12">
          <div className="flex flex-col gap-5">
            <p className="font-medium text-accent text-sm uppercase tracking-wider">
              The Vercel Daily
            </p>
            <h1 className="text-balance font-bold text-4xl tracking-tight sm:text-5xl">
              News and insights from the teams shipping the web
            </h1>
            <p className="max-w-xl text-lg text-muted">
              Product updates, engineering deep dives and customer stories from
              across the Vercel ecosystem, curated every day.
            </p>
            <div className="flex flex-wrap gap-3">
              {lead && (
                <Link
                  href={`/articles/${lead.slug}`}
                  className="inline-flex h-11 items-center rounded-full bg-foreground px-6 font-medium text-background transition-opacity hover:opacity-90"
                >
                  Read the lead story
                </Link>
              )}
              <Link
                href="/search"
                className="inline-flex h-11 items-center rounded-full border border-border px-6 font-medium transition-colors hover:bg-surface"
              >
                Browse articles
              </Link>
            </div>
          </div>

          {lead && (
            <Link
              href={`/articles/${lead.slug}`}
              className="group overflow-hidden rounded-2xl border border-border"
            >
              <div className="relative aspect-[16/9] bg-surface">
                <Image
                  src={lead.image}
                  alt=""
                  fill
                  preload
                  sizes="(min-width: 1152px) 552px, (min-width: 1024px) 48vw, 100vw"
                  className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                />
              </div>
              <div className="flex flex-col gap-1 p-4">
                <p className="text-muted text-xs">
                  <span className="font-medium text-accent uppercase tracking-wide">
                    {humanizeSlug(lead.category)}
                  </span>{" "}
                  · {formatDate(lead.publishedAt)}
                </p>
                <p className="font-semibold text-lg leading-snug group-hover:underline">
                  {lead.title}
                </p>
              </div>
            </Link>
          )}
        </section>

        {/* Featured articles */}
        <section aria-labelledby="featured-heading" className="py-6">
          <div className="mb-6 flex items-end justify-between gap-4">
            <h2
              id="featured-heading"
              className="font-bold text-2xl tracking-tight"
            >
              Featured
            </h2>
            <Link
              href="/search"
              className="text-muted text-sm hover:text-foreground"
            >
              View all →
            </Link>
          </div>
          <ArticleGrid>
            {grid.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </ArticleGrid>
        </section>

        <Suspense fallback={null}>
          <SubscribeCta />
        </Suspense>
      </div>
    </>
  );
}
