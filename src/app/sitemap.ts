import type { MetadataRoute } from "next";
import { getArticles } from "@/lib/api/articles";
import { site } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const articles = await getArticles({ limit: 50 });
  return [
    { url: site.url, changeFrequency: "daily", priority: 1 },
    { url: `${site.url}/search`, changeFrequency: "weekly", priority: 0.5 },
    ...articles.map((article) => ({
      url: `${site.url}/articles/${article.slug}`,
      lastModified: article.publishedAt,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ];
}
