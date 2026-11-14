import { z } from "zod";

// Runtime schemas for the Vercel Daily News API. Responses are validated at
// the boundary so the rest of the app works with trusted, typed data.

export const ContentBlockSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("paragraph"), text: z.string() }),
  z.object({
    type: z.literal("heading"),
    level: z.union([z.literal(2), z.literal(3)]),
    text: z.string(),
  }),
  z.object({ type: z.literal("blockquote"), text: z.string() }),
  z.object({ type: z.literal("unordered-list"), items: z.array(z.string()) }),
  z.object({ type: z.literal("ordered-list"), items: z.array(z.string()) }),
  z.object({
    type: z.literal("image"),
    src: z.string(),
    alt: z.string(),
    caption: z.string().optional(),
  }),
]);

export const ArticleSchema = z.object({
  id: z.string(),
  // Some titles come back with leading/trailing whitespace
  title: z.string().trim(),
  slug: z.string(),
  excerpt: z.string().trim(),
  content: z.array(ContentBlockSchema),
  category: z.string(),
  author: z.object({ name: z.string(), avatar: z.string().optional() }),
  image: z.url(),
  publishedAt: z.string(),
  featured: z.boolean(),
  tags: z.array(z.string()),
});

export const CategorySchema = z.object({
  slug: z.string(),
  name: z.string(),
  articleCount: z.number(),
});

export const BreakingNewsSchema = z.object({
  id: z.string(),
  headline: z.string().trim(),
  summary: z.string().trim(),
  articleId: z.string(),
  category: z.string(),
  publishedAt: z.string(),
  urgent: z.boolean(),
});

export const SubscriptionSchema = z.object({
  token: z.string(),
  status: z.enum(["active", "inactive"]),
  subscribedAt: z.string().nullable(),
});

export const PaginationSchema = z.object({
  page: z.number(),
  limit: z.number(),
  total: z.number(),
  totalPages: z.number(),
  hasNextPage: z.boolean(),
  hasPreviousPage: z.boolean(),
});

export type ContentBlock = z.infer<typeof ContentBlockSchema>;
export type Article = z.infer<typeof ArticleSchema>;
export type ArticleSummary = Omit<Article, "content">;
export type Category = z.infer<typeof CategorySchema>;
export type BreakingNews = z.infer<typeof BreakingNewsSchema>;
export type Subscription = z.infer<typeof SubscriptionSchema>;
