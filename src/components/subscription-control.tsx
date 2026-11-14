import { SubscriptionToggle } from "@/components/subscription-toggle";
import { isSubscribed } from "@/lib/subscription";

/** Header indicator: Subscribe button, or a Subscribed badge + Unsubscribe. */
export async function SubscriptionControl() {
  const subscribed = await isSubscribed();
  return <SubscriptionToggle subscribed={subscribed} variant="header" />;
}
