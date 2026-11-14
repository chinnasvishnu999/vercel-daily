import { SubscriptionToggle } from "@/components/subscription-toggle";
import { isSubscribed } from "@/lib/subscription";

type Props = {
  title?: string;
  description?: string;
};

/** Subscribe call-to-action, shown only to visitors who aren't subscribed. */
export async function SubscribeCta({
  title = "Get every story in full",
  description = "Subscribe to Vercel Daily for unlimited access to every article. It's free, anonymous and takes one click.",
}: Props) {
  if (await isSubscribed()) return null;

  return (
    <section
      aria-labelledby="subscribe-cta-heading"
      className="my-10 flex flex-col items-start gap-4 rounded-2xl border border-border bg-surface p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8"
    >
      <div className="max-w-xl">
        <h2
          id="subscribe-cta-heading"
          className="font-bold text-xl tracking-tight"
        >
          {title}
        </h2>
        <p className="mt-1 text-muted">{description}</p>
      </div>
      <SubscriptionToggle subscribed={false} variant="cta" />
    </section>
  );
}
