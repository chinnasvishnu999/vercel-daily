import "server-only";

import { cookies } from "next/headers";
import { ApiError, apiRequest } from "@/lib/api/client";
import { type Subscription, SubscriptionSchema } from "@/lib/api/schemas";

/**
 * Subscription model
 * - The API identifies an anonymous subscription by a token.
 * - We keep that token in an httpOnly session cookie, set ONLY by our Server
 *   Actions after the API confirmed the subscription is active, and removed
 *   on unsubscribe. So "cookie present" means "active subscriber".
 * - proxy.ts re-validates the token with the API before article pages render
 *   and clears it if it expired or was revoked (tokens expire after 24h of
 *   inactivity), so a stale or forged cookie never unlocks content.
 */
export const SUBSCRIPTION_COOKIE = "vd_subscription";

export const subscriptionCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
  // No maxAge/expires: a session cookie, as the spec asks for
  // "persists within the same browser session".
} as const;

/** Whether the current visitor is subscribed (reads the request cookie). */
export async function isSubscribed(): Promise<boolean> {
  const cookieStore = await cookies();
  return Boolean(cookieStore.get(SUBSCRIPTION_COOKIE)?.value);
}

function tokenHeader(token: string) {
  return { "x-subscription-token": token };
}

/** Creates a new (inactive) subscription and returns its token. */
export async function createSubscription(): Promise<string> {
  const { response } = await apiRequest(
    "/subscription/create",
    SubscriptionSchema,
    { method: "POST" },
  );
  const token = response.headers.get("x-subscription-token");
  if (!token) throw new Error("API did not return a subscription token");
  return token;
}

export async function activateSubscription(token: string) {
  const { data } = await apiRequest("/subscription", SubscriptionSchema, {
    method: "POST",
    headers: tokenHeader(token),
  });
  return data;
}

export async function deactivateSubscription(token: string) {
  const { data } = await apiRequest("/subscription", SubscriptionSchema, {
    method: "DELETE",
    headers: tokenHeader(token),
  });
  return data;
}

/** Current status for a token, or null when the token is unknown/expired. */
export async function getSubscription(
  token: string,
): Promise<Subscription | null> {
  try {
    const { data } = await apiRequest("/subscription", SubscriptionSchema, {
      headers: tokenHeader(token),
    });
    return data;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}
