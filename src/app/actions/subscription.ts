"use server";

import { refresh } from "next/cache";
import { cookies } from "next/headers";
import { ApiError } from "@/lib/api/client";
import {
  activateSubscription,
  createSubscription,
  deactivateSubscription,
  SUBSCRIPTION_COOKIE,
  subscriptionCookieOptions,
} from "@/lib/subscription";
import {
  createProof,
  PROOF_COOKIE,
  proofCookieOptions,
} from "@/lib/subscription-proof";

export type SubscriptionActionState = { error: string | null };

const isNotFound = (error: unknown) =>
  error instanceof ApiError && error.status === 404;

/** Activate `token`; if the API no longer knows it, start a new one. */
async function activateOrCreate(existing: string | undefined) {
  if (existing) {
    try {
      return await activateSubscription(existing);
    } catch (error) {
      if (!isNotFound(error)) throw error; // expired: fall through
    }
  }
  const token = await createSubscription();
  return activateSubscription(token);
}

export async function subscribe(
  _prev: SubscriptionActionState,
  _formData: FormData,
): Promise<SubscriptionActionState> {
  const cookieStore = await cookies();

  try {
    const subscription = await activateOrCreate(
      cookieStore.get(SUBSCRIPTION_COOKIE)?.value,
    );
    if (subscription.status !== "active") {
      return { error: "We couldn't activate your subscription. Try again." };
    }

    cookieStore.set(
      SUBSCRIPTION_COOKIE,
      subscription.token,
      subscriptionCookieOptions,
    );
    // Just verified with the API: issue the proof so the next article view
    // doesn't need another round trip in the proxy.
    const proof = await createProof(subscription.token);
    if (proof) cookieStore.set(PROOF_COOKIE, proof, proofCookieOptions);
  } catch (error) {
    console.error("[subscribe] failed:", error);
    return { error: "Subscribing failed. Please try again." };
  }

  // Re-render the current page on the server so the paywall and header
  // reflect the new state immediately (read-your-own-writes).
  refresh();
  return { error: null };
}

export async function unsubscribe(
  _prev: SubscriptionActionState,
  _formData: FormData,
): Promise<SubscriptionActionState> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SUBSCRIPTION_COOKIE)?.value;

  try {
    if (token) await deactivateSubscription(token);
  } catch (error) {
    // Already gone on the API side is fine; anything else is a real failure.
    if (!isNotFound(error)) {
      console.error("[unsubscribe] failed:", error);
      return { error: "Unsubscribing failed. Please try again." };
    }
  }

  cookieStore.delete(SUBSCRIPTION_COOKIE);
  cookieStore.delete(PROOF_COOKIE);
  refresh();
  return { error: null };
}
