// Public, non-secret site settings shared by metadata and UI.
export const site = {
  name: "Vercel Daily",
  description:
    "News, engineering deep dives and customer stories from across the Vercel ecosystem.",
  // Absolute base for metadata URLs (Open Graph, canonical).
  url: process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000",
} as const;
