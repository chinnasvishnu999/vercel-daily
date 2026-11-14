import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cache Components: static shell + cached data ("use cache") + streamed
  // request-time holes behind <Suspense>.
  cacheComponents: true,
  partialPrefetching: true,
  typedRoutes: true,
  images: {
    // Article covers are served from the API's Vercel Blob store.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "i8qy5y6gxkdgdcv9.public.blob.vercel-storage.com",
        pathname: "/news/**",
      },
    ],
    formats: ["image/avif", "image/webp"],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
