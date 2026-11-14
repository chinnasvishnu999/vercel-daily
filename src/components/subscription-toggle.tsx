"use client";

import { useActionState } from "react";
import { subscribe, unsubscribe } from "@/app/actions/subscription";

type Props = {
  subscribed: boolean;
  /** header: compact pill; cta: large button used in paywall/CTA sections */
  variant?: "header" | "cta";
};

/**
 * Subscribe / unsubscribe form. Works without JavaScript (progressive
 * enhancement: the form posts to the Server Action) and shows pending and
 * error states when JavaScript is available.
 */
export function SubscriptionToggle({ subscribed, variant = "header" }: Props) {
  const [subscribeState, subscribeAction, subscribing] = useActionState(
    subscribe,
    { error: null },
  );
  const [unsubscribeState, unsubscribeAction, unsubscribing] = useActionState(
    unsubscribe,
    { error: null },
  );
  const error = subscribed ? unsubscribeState.error : subscribeState.error;

  if (subscribed) {
    return (
      <form action={unsubscribeAction} className="flex items-center gap-2">
        {variant === "header" && (
          <span className="hidden items-center gap-1.5 rounded-full bg-surface px-3 py-1.5 font-medium text-sm sm:inline-flex">
            <span
              aria-hidden="true"
              className="size-2 rounded-full bg-green-500"
            />
            Subscribed
          </span>
        )}
        <button
          type="submit"
          disabled={unsubscribing}
          className="h-9 rounded-full border border-border px-4 text-sm transition-colors hover:bg-surface disabled:opacity-60"
        >
          {unsubscribing ? "Unsubscribing…" : "Unsubscribe"}
        </button>
        <ErrorMessage error={error} />
      </form>
    );
  }

  return (
    <form action={subscribeAction} className="flex flex-col items-start gap-2">
      <button
        type="submit"
        disabled={subscribing}
        className={
          variant === "cta"
            ? "h-11 rounded-full bg-foreground px-6 font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-60"
            : "h-9 rounded-full bg-foreground px-4 font-medium text-background text-sm transition-opacity hover:opacity-90 disabled:opacity-60"
        }
      >
        {subscribing ? "Subscribing…" : "Subscribe"}
      </button>
      <ErrorMessage error={error} />
    </form>
  );
}

function ErrorMessage({ error }: { error: string | null }) {
  return (
    <p
      role="alert"
      aria-live="polite"
      className="text-breaking text-xs empty:hidden"
    >
      {error}
    </p>
  );
}
