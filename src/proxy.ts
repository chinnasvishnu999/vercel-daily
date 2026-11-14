import { type NextRequest, NextResponse } from "next/server";
import {
  createProof,
  PROOF_COOKIE,
  proofCookieOptions,
  verifyProof,
} from "@/lib/subscription-proof";

const SUBSCRIPTION_COOKIE = "vd_subscription";

/**
 * Access control for paywalled content.
 *
 * Article pages decide between the full article and the paywall by reading
 * the subscription cookie. Before they render, this proxy makes sure that
 * cookie belongs to an active subscription:
 *
 * 1. A valid signed proof (see subscription-proof.ts) means the token was
 *    verified with the API in the last few minutes: no network call.
 * 2. Otherwise the token is checked with the API. Active: a fresh proof is
 *    issued. Unknown, expired (24h inactivity) or inactive: the cookie is
 *    stripped from the request, so the page renders the paywall, and cleared
 *    in the browser. A forged or stale cookie can never unlock an article.
 *
 * Runs only for article pages, and only when the visitor has a cookie.
 */
export async function proxy(request: NextRequest) {
  const token = request.cookies.get(SUBSCRIPTION_COOKIE)?.value;
  if (!token) return NextResponse.next();

  const proof = request.cookies.get(PROOF_COOKIE)?.value;
  if (proof && (await verifyProof(token, proof))) return NextResponse.next();

  const status = await checkSubscription(token);

  if (status === "active") {
    const response = NextResponse.next();
    const fresh = await createProof(token);
    if (fresh) response.cookies.set(PROOF_COOKIE, fresh, proofCookieOptions);
    return response;
  }

  if (status === "unknown") {
    // API unreachable: fail open for an existing subscriber rather than flash
    // a paywall, but don't issue a proof, so the next request re-checks.
    return NextResponse.next();
  }

  // Not a valid subscription: hide the cookies from this render...
  request.cookies.delete(SUBSCRIPTION_COOKIE);
  request.cookies.delete(PROOF_COOKIE);
  const response = NextResponse.next({ request: { headers: request.headers } });
  // ...and remove them from the browser.
  response.cookies.delete(SUBSCRIPTION_COOKIE);
  response.cookies.delete(PROOF_COOKIE);
  return response;
}

async function checkSubscription(
  token: string,
): Promise<"active" | "inactive" | "unknown"> {
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
      signal: AbortSignal.timeout(5000),
    });
    if (response.status === 404) return "inactive";
    if (!response.ok) return "unknown";
    const body = (await response.json()) as { data?: { status?: string } };
    return body.data?.status === "active" ? "active" : "inactive";
  } catch {
    return "unknown";
  }
}

export const config = {
  matcher: "/articles/:slug",
};
