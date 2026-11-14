import { test as base, expect, type Page } from "@playwright/test";

export const ARTICLE_SLUG =
  "vercel-domains-overhauled-with-instant-search-and-at-cost-pricing";

/**
 * Every test fails if the page logs a console error or throws. Allowed:
 * - the browser's own log line for an intentional 404;
 * - WebKit's message for a router prefetch (`?_rsc=`) that was cancelled
 *   because the page navigated away mid-flight. WebKit reports cancelled
 *   fetches as "due to access control checks"; Chromium and Firefox cancel
 *   the same requests silently. No response is involved, so it is not an
 *   application error.
 */
export const test = base.extend<{ consoleErrors: string[] }>({
  consoleErrors: [
    async ({ page }, use) => {
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      page.on("console", (message) => {
        if (message.type() !== "error") return;
        const text = message.text();
        if (/status of 404/.test(text)) return;
        if (/\?_rsc=\S+ due to access control checks/.test(text)) return;
        errors.push(text);
      });
      await use(errors);
      expect(errors, "console errors").toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };

/** Wait until React has hydrated the element (it's interactive). */
export async function waitForHydration(page: Page, selector: string) {
  await page.waitForFunction(
    (sel) => {
      const el = document.querySelector(sel);
      return !!el && Object.keys(el).some((k) => k.startsWith("__react"));
    },
    selector,
    { timeout: 20_000 },
  );
}

/** No horizontal scrolling at the current viewport. */
export async function expectNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  expect(overflow, "horizontal overflow in px").toBeLessThanOrEqual(0);
}
