import { ArticleBody } from "@/components/article-body";
import { SubscriptionToggle } from "@/components/subscription-toggle";
import { getArticle } from "@/lib/api/articles";
import { renderInline } from "@/lib/inline-markdown";
import { isSubscribed } from "@/lib/subscription";

/**
 * The paywall gate. Runs at request time (reads the subscription cookie that
 * proxy.ts has already verified) and only ever renders the full body for
 * subscribers: non-subscribers receive the teaser, never the content.
 *
 * It looks the article up by slug (a cache hit) instead of receiving it as a
 * prop, so the full body is never passed through the page's render tree for
 * visitors who can't read it.
 */
export async function ArticleAccess({ slug }: { slug: string }) {
  const [subscribed, article] = await Promise.all([
    isSubscribed(),
    getArticle(slug),
  ]);
  if (!article) return null;

  if (subscribed) {
    return <ArticleBody blocks={article.content} />;
  }

  const teaser = article.content.find((block) => block.type === "paragraph");

  return (
    <div>
      {teaser && (
        <div className="relative">
          <p className="text-lg leading-8">{renderInline(teaser.text)}</p>
          {/* Fade the teaser into the paywall */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-b from-transparent to-background"
          />
        </div>
      )}

      <section
        aria-labelledby="paywall-heading"
        className="mt-8 flex flex-col items-center gap-4 rounded-2xl border border-border bg-surface px-6 py-10 text-center"
      >
        <p className="font-medium text-accent text-sm uppercase tracking-wider">
          Subscriber exclusive
        </p>
        <h2
          id="paywall-heading"
          className="text-balance font-bold text-2xl tracking-tight"
        >
          Subscribe to keep reading
        </h2>
        <p className="max-w-md text-muted">
          This article is available to Vercel Daily subscribers. Subscribing is
          free and anonymous, and unlocks every story instantly.
        </p>
        <SubscriptionToggle subscribed={false} variant="cta" />
      </section>
    </div>
  );
}

export function ArticleBodySkeleton() {
  return (
    <div className="space-y-4" aria-hidden="true">
      {["w-full", "w-11/12", "w-full", "w-4/5", "w-full", "w-2/3"].map(
        (width, i) => (
          <div
            // biome-ignore lint/suspicious/noArrayIndexKey: static placeholders
            key={i}
            className={`h-5 animate-pulse rounded bg-surface ${width}`}
          />
        ),
      )}
    </div>
  );
}
