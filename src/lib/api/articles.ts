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

// Data access for public content. Editorial content changes rarely, so it is
// cached with "use cache" and tagged for targeted revalidation. Trending and
// breaking news are intentionally NOT cached: the API randomises them per request.

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
  "use cache";
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
  "use cache";
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
  "use cache";
  cacheLife("days");
  cacheTag("categories");

  const { data } = await apiRequest("/categories", z.array(CategorySchema));
  return data;
}

/**
 * Latest breaking news, fetched per request (uncached on purpose): the API
 * returns a randomly selected item on each call, and the spec asks for a
 * dynamic banner. The home page streams it in behind <Suspense>.
 */
export async function getBreakingNews(): Promise<BreakingNews | null> {
  try {
    const { data } = await apiRequest("/breaking-news", BreakingNewsSchema);
    return data;
  } catch {
    // The banner is non-critical: hide it rather than break the page.
    return null;
  }
}

/** Random trending articles, fetched per request (uncached on purpose). */
export async function getTrendingArticles(
  excludeId?: string,
): Promise<ArticleSummary[]> {
  const params = excludeId ? `?exclude=${encodeURIComponent(excludeId)}` : "";
  const { data } = await apiRequest(
    `/articles/trending${params}`,
    z.array(ArticleSchema),
  );
  return data.map(toSummary);
}
