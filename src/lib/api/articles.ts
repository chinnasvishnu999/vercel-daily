import "server-only";

import { cacheLife, cacheTag } from "next/cache";
import { z } from "zod";
import { ApiError, apiRequest } from "@/lib/api/client";
import {
  type Article,
  ArticleSchema,
  type ArticleSummary,
  type BreakingNews,
  BreakingNewsSchema,
  type Category,
  CategorySchema,
} from "@/lib/api/schemas";

/*
 * Data access for the Vercel Daily News API.
 *
 * The API is slow (1-3s per call), so nothing a visitor waits on should hit
 * it directly. Every function uses "use cache: remote": a cache shared by all
 * server instances, which also works for request-time renders (search
 * results, the paywalled body, the streamed banner and trending list), where
 * an instance-local in-memory cache would often miss on serverless.
 *
 * - Editorial content: long lifetimes + tags for targeted revalidation.
 * - Breaking news and trending: the API picks them at random per request.
 *   They use the "minutes" profile: refreshed every minute in the background
 *   (stale-while-revalidate), so they keep rotating while no visitor ever
 *   waits on the slow API. A shorter, request-time profile was measured to
 *   block a request on every refresh, which is the lag we want to avoid.
 */

/** Drop the article body from list views so it never reaches list UIs. */
function toSummary({ content: _content, ...summary }: Article): ArticleSummary {
  return summary;
}

type ArticleQuery = {
  search?: string;
  category?: string;
  featured?: boolean;
  limit?: number;
};

export async function getArticles({
  search,
  category,
  featured,
  limit = 20,
}: ArticleQuery = {}): Promise<ArticleSummary[]> {
  "use cache: remote";
  cacheLife("hours");
  cacheTag("articles");

  const params = new URLSearchParams({ limit: String(limit) });
  if (search) params.set("search", search);
  if (category) params.set("category", category);
  if (featured !== undefined) params.set("featured", String(featured));

  const { data } = await apiRequest(
    `/articles?${params}`,
    z.array(ArticleSchema),
  );
  return data.map(toSummary);
}

/** Most recent articles first (the API does not guarantee an order). */
export async function getRecentArticles(limit: number) {
  const articles = await getArticles({ limit: 50 });
  return articles
    .toSorted((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt))
    .slice(0, limit);
}

export async function getArticle(slug: string): Promise<Article | null> {
  "use cache: remote";
  cacheLife("hours");
  cacheTag("articles", `article:${slug}`);

  try {
    const { data } = await apiRequest(
      `/articles/${encodeURIComponent(slug)}`,
      ArticleSchema,
    );
    return data;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

export async function getCategories(): Promise<Category[]> {
  "use cache: remote";
  cacheLife("days");
  cacheTag("categories");

  const { data } = await apiRequest("/categories", z.array(CategorySchema));
  return data;
}

/** Latest breaking news (rotates: the API returns a random item per call). */
export async function getBreakingNews(): Promise<BreakingNews | null> {
  "use cache: remote";
  cacheLife("minutes");
  cacheTag("breaking-news");

  try {
    const { data } = await apiRequest("/breaking-news", BreakingNewsSchema);
    return data;
  } catch {
    // The banner is non-critical: hide it rather than break the page.
    return null;
  }
}

/** Trending articles (random per call), excluding the one being read. */
export async function getTrendingArticles(
  excludeId?: string,
): Promise<ArticleSummary[]> {
  "use cache: remote";
  cacheLife("minutes");
  cacheTag("trending");

  const params = excludeId ? `?exclude=${encodeURIComponent(excludeId)}` : "";
  const { data } = await apiRequest(
    `/articles/trending${params}`,
    z.array(ArticleSchema),
  );
  return data.map(toSummary);
}
