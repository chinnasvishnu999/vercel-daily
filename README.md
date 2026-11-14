# Vercel Daily

A news publication built with **Next.js 16** (App Router, Cache Components) for the Vercel Partner Certification. It has a home page with a breaking-news banner and featured stories, article pages with trending stories and a subscriber paywall, and server-side search whose state lives in the URL. Content comes from the Vercel Daily News API.

## Getting started

```bash
pnpm install
cp .env.example .env.local   # then fill in the API bypass token
pnpm dev                     # http://localhost:3000
```

| Variable | Purpose |
| --- | --- |
| `VERCEL_DAILY_API_URL` | API base URL (defaults to `https://vercel-daily-news-api.vercel.app/api`) |
| `VERCEL_DAILY_API_BYPASS_TOKEN` | Deployment Protection bypass token, sent as `x-vercel-protection-bypass`. **Server-only**: never prefixed with `NEXT_PUBLIC_`, never committed. |

Scripts: `pnpm lint` (Biome), `pnpm check-types` (route types + `tsc`), `pnpm build`, `pnpm start`.

## Routes

| Route | What it shows |
| --- | --- |
| `/` | Breaking-news banner, hero with the latest story, 6 featured articles, subscribe CTA |
| `/articles/[slug]` | Article header, cover image, full body **or** paywall, trending articles |
| `/search` | Keyword search + category filter, debounced, persisted in `?q=&category=` |

All pages share the root layout (header with navigation and subscription status, footer with the copyright year). The site also has `not-found`, `error`, a generated Open Graph image, `sitemap.xml` and `robots.txt`.

## Architecture

### Rendering and caching (Cache Components)

`cacheComponents: true` is enabled, so every route is **partially prerendered**: a static shell is served instantly and only request-specific parts stream in behind `<Suspense>`.

| Data | Strategy | Why |
| --- | --- | --- |
| Articles, article detail | `"use cache"` + `cacheLife("hours")` + `cacheTag("articles")` | Editorial content changes rarely; tags allow targeted revalidation |
| Categories | `"use cache"` + `cacheLife("days")` | Practically static |
| Breaking news | Not cached, streamed in `<Suspense>` | The API picks a random item per request, and the spec asks for a dynamic banner |
| Trending | Not cached, streamed in `<Suspense>` | The API returns a random selection per request, by design |
| Subscription status | Request time (`cookies()`), inside `<Suspense>` | Personal to each visitor; never cached |
| Copyright year | `"use cache"` component | Reading the clock isn't allowed while prerendering the shell |

All 18 articles are prerendered with `generateStaticParams`. Their header and cover image are part of the static shell, and only the access-controlled body and the trending list are dynamic.

### Subscription and paywall

- **Model:** the API identifies an anonymous subscription by a token. `subscribe` (a Server Action) creates or reuses a token, activates it through the API, and only then stores it in an **httpOnly, secure, `sameSite=lax` session cookie**. `unsubscribe` deactivates it and deletes the cookie. So a present cookie means an active subscriber, and the state survives refreshes for the browser session, as the spec asks.
- **Read-your-own-writes:** both actions call `refresh()`, so the header, the paywall and the CTAs update in the same round trip, without a manual reload.
- **Access control in `proxy.ts`:** before an article renders, the proxy verifies the cookie's token with the API. If the token is unknown, expired (24 h of inactivity) or inactive, the proxy strips the cookie from the request and clears it in the browser, so a stale or forged cookie can't unlock content. If the API itself is unreachable, it fails open for an existing subscriber rather than flashing a paywall; a definite "not found" or "inactive" always fails closed.
- **No content leakage:** the paywall decision happens on the server, in `ArticleAccess`. That component looks the article up by slug (a cache hit) instead of receiving it as a prop, so for a non-subscriber the response contains only the headline, image and first paragraph. The full body is never sent and then hidden with CSS.
- **Progressive enhancement:** the subscribe and unsubscribe forms post to Server Actions, so they work before JavaScript loads. With JavaScript, `useActionState` adds pending and error states.

### Search

- The URL is the source of truth: the server reads `searchParams`, validates them (the category must exist, the query is trimmed and length-limited) and filters through the API (`limit=5`), so a refresh or a shared link shows the same results.
- Client behaviour (`SearchForm`):
  - Typing searches automatically after **3+ characters**, with a **300 ms debounce** that resets on each keystroke.
  - **Enter** or the **Search** button searches immediately.
  - **Clearing** the input removes the stale query from the URL right away.
  - **Changing the category** applies immediately.
- **Loading feedback:** navigation runs inside `useTransition`. While results load, the previous results stay visible (dimmed) with a spinner, and screen readers get a live "Searching…" message.
- **Back/forward:** handled through `popstate`, so the form's own in-flight navigations can never overwrite what the user is typing.
- **States:** default (latest articles when there is no search), results (up to 5), and an empty-results message.

### Data layer

- `src/lib/api/client.ts` is the single, `server-only` entry point to the API. It adds the bypass header, unwraps the `{ success, data, error }` envelope and throws a typed `ApiError`.
- Every response is validated with **zod** schemas (`src/lib/api/schemas.ts`), so the UI only ever handles trusted, typed data. This caught real API quirks:
  - Some titles have leading whitespace, which is trimmed.
  - In-article image blocks currently have an empty `src`, so they're skipped instead of rendering broken images.
  - Single-item responses have no `meta`.
- Article text contains inline Markdown (links, bold, italic, code). `src/lib/inline-markdown.tsx` renders it as React elements without `dangerouslySetInnerHTML`, and only for `http(s)` links. Card excerpts and meta descriptions use a plain-text version.

### Metadata and SEO

- **Root layout:** `metadataBase`, a title template (`%s | Vercel Daily`), a default description, and default `openGraph` and `twitter` metadata.
- **Every page** exports its own metadata. Articles use `generateMetadata` with `og:type=article`, the publish time, author, section, tags and the cover image.
- A generated default social image (`opengraph-image.tsx`), plus `sitemap.xml`, `robots.txt` and canonical URLs.

### Performance and accessibility

- **Images:** `next/image` with `remotePatterns` scoped to the API's Blob store and AVIF/WebP output. The LCP image is preloaded, and fixed aspect-ratio frames give zero layout shift. The source images are up to 5186 px wide and 1.2 MB, and are served resized.
- **Fonts:** Geist via `next/font`.
- **Theming:** semantic color tokens for light and dark mode, all at WCAG AA contrast or better.
- **Accessibility:** a skip link, landmarks, `aria-current` navigation, labelled form controls, live regions for async states, and visible focus styles.
- **Lighthouse** (mobile, production build): performance 96–97, accessibility 100, best practices 100, SEO 100, CLS 0.

## Trade-offs and notes

- Article URLs use the slug (`/articles/[slug]`). The API accepts ids or slugs, and slugs are readable and stable.
- The header's subscription indicator trusts the cookie. Only article routes, where access actually matters, pay for an API check in the proxy.
- Unknown slugs render the 404 page. With Partial Prefetching on, the very first request for an unlisted slug is served the app shell (status 200, with `noindex`), and later requests return a real 404. This is standard Cache Components behaviour for unlisted params. In that case the shared header and footer are rendered by the client from the RSC payload, so they appear once JavaScript runs; unknown top-level URLs return a fully server-rendered 404.

## Testing

Verified against both a local production build (`pnpm build && pnpm start`) and the deployed site:

- **HTTP audit (51 checks):** layout and metadata on every page, the home page content, article header and image, trending (3–4 articles, current one excluded, random per request), and search (defaults, results capped at 5, server-side filtering, empty state, URL state). For the paywall it checks:
  - no full body in the HTML **or** the RSC payload for non-subscribers;
  - forged, inactive and revoked tokens all stay locked;
  - subscribers get the full article.
- **Browser checks (17):** no horizontal scrolling and no console errors on every page at 320, 390, 768, 1024 and 1440 px in light and dark mode; client-side navigation; the search loading state; and keyboard access (skip link).
- **End-to-end flows (16):**
  - Subscribing from the paywall and from the header, with pending states. The cookie is checked as `httpOnly`, `secure`, `sameSite=lax` and session-only.
  - Persistence across refreshes, and unsubscribing.
  - Search: the 3-character minimum, the debounce (one request per typing burst), the category filter, Enter, clearing, and the back button.
