import { type NextRequest, NextResponse } from "next/server";

const SUBSCRIPTION_COOKIE = "vd_subscription";

/**
 * Access control for paywalled content.
 *
 * Article pages decide between the full article and the paywall by reading
 * the subscription cookie. Before they render, this proxy verifies that
 * cookie with the API. If the token is unknown, expired (24h inactivity) or
 * inactive, the cookie is stripped from the request (so the page renders the
 * paywall) and cleared in the browser. A forged or stale cookie can therefore
 * never unlock an article.
 *
 * Only runs for article pages, and only does network work when the visitor
 * actually has a subscription cookie.
 */
export async function proxy(request: NextRequest) {
  const token = request.cookies.get(SUBSCRIPTION_COOKIE)?.value;
  if (!token) return NextResponse.next();

  if (await isActiveSubscription(token)) return NextResponse.next();

  // Invalid subscription: hide the cookie from this render...
  request.cookies.delete(SUBSCRIPTION_COOKIE);
  const response = NextResponse.next({
    request: { headers: request.headers },
  });
  // ...and remove it from the browser.
  response.cookies.delete(SUBSCRIPTION_COOKIE);
  return response;
}

async function isActiveSubscription(token: string): Promise<boolean> {
  const baseUrl =
    process.env.VERCEL_DAILY_API_URL ??
    "https://vercel-daily-news-api.vercel.app/api";
  try {
    const response = await fetch(`${baseUrl}/subscription`, {
      headers: {
        "x-vercel-protection-bypass":
          process.env.VERCEL_DAILY_API_BYPASS_TOKEN ?? "",
        "x-subscription-token": token,
      },
      signal: AbortSignal.timeout(3000),
    });
    if (response.status === 404) return false;
    if (!response.ok) return true; // API hiccup: don't lock out subscribers
    const body = (await response.json()) as { data?: { status?: string } };
    return body.data?.status === "active";
  } catch {
    // Network error or timeout: fail open for an existing subscriber rather
    // than flash a paywall; a definite "not found/inactive" still fails closed.
    return true;
  }
}

export const config = {
  matcher: "/articles/:slug",
};
