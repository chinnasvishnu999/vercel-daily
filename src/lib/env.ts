import "server-only";

import { z } from "zod";

// Server-only configuration. Validated once, so a missing variable fails with
// a clear message instead of an opaque 403 from the API.
const EnvSchema = z.object({
  VERCEL_DAILY_API_URL: z
    .url()
    .default("https://vercel-daily-news-api.vercel.app/api"),
  VERCEL_DAILY_API_BYPASS_TOKEN: z
    .string()
    .min(1, "VERCEL_DAILY_API_BYPASS_TOKEN is not set (see .env.example)"),
});

export const env = EnvSchema.parse({
  VERCEL_DAILY_API_URL: process.env.VERCEL_DAILY_API_URL || undefined,
  VERCEL_DAILY_API_BYPASS_TOKEN: process.env.VERCEL_DAILY_API_BYPASS_TOKEN,
});
