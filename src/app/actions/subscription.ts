"use server";

import { refresh } from "next/cache";
import { cookies } from "next/headers";
import {
  activateSubscription,
  createSubscription,
  deactivateSubscription,
  getSubscription,
  SUBSCRIPTION_COOKIE,
  subscriptionCookieOptions,
} from "@/lib/subscription";

export type SubscriptionActionState = { error: string | null };

export async function subscribe(
  _prev: SubscriptionActionState,
  _formData: FormData,
): Promise<SubscriptionActionState> {
  const cookieStore = await cookies();
  const existing = cookieStore.get(SUBSCRIPTION_COOKIE)?.value;

  try {
    // Reuse the visitor's token if the API still knows it, else create one.
    let token = existing;
    if (!token || !(await getSubscription(token))) {
      token = await createSubscription();
    }

    const subscription = await activateSubscription(token);
    if (subscription.status !== "active") {
      return { error: "We couldn't activate your subscription. Try again." };
    }

    cookieStore.set(SUBSCRIPTION_COOKIE, token, subscriptionCookieOptions);
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
    if (token && (await getSubscription(token))) {
      await deactivateSubscription(token);
    }
  } catch (error) {
    console.error("[unsubscribe] failed:", error);
    return { error: "Unsubscribing failed. Please try again." };
  }

  cookieStore.delete(SUBSCRIPTION_COOKIE);
  refresh();
  return { error: null };
}
