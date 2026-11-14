import { ARTICLE_SLUG, expect, test, waitForHydration } from "./fixtures";

const paywall = (page: import("@playwright/test").Page) =>
  page.getByRole("heading", { name: "Subscribe to keep reading" });

test("subscribe, persist across reload, unsubscribe", async ({
  page,
  context,
}) => {
  await page.goto(`/articles/${ARTICLE_SLUG}`);
  await expect(paywall(page)).toBeVisible();

  // Subscribe from the paywall CTA
  const cta = page.locator('[aria-labelledby="paywall-heading"] button');
  await waitForHydration(page, '[aria-labelledby="paywall-heading"] button');
  await cta.click();

  await expect(paywall(page)).toBeHidden({ timeout: 30_000 });
  await expect(page.getByRole("banner")).toContainText("Subscribed");
  await expect(page.getByRole("button", { name: "Unsubscribe" })).toBeVisible();

  const cookie = (await context.cookies()).find(
    (c) => c.name === "vd_subscription",
  );
  expect(cookie?.httpOnly).toBe(true);
  expect(cookie?.sameSite).toBe("Lax");
  expect(cookie?.expires).toBe(-1); // session cookie

  // Full article survives a reload
  await page.reload();
  await expect(paywall(page)).toBeHidden();
  await expect(page.getByRole("banner")).toContainText("Subscribed");

  // ...and navigating away and back
  await page.goto("/");
  await expect(page.getByRole("banner")).toContainText("Subscribed");
  await expect(
    page.getByRole("heading", { name: "Get every story in full" }),
  ).toHaveCount(0);

  // Unsubscribe from the header
  await waitForHydration(page, "header form button");
  await page
    .locator("header")
    .getByRole("button", { name: "Unsubscribe" })
    .click();
  await expect(
    page.getByRole("banner").getByRole("button", { name: "Subscribe" }),
  ).toBeVisible({
    timeout: 30_000,
  });
  expect(
    (await context.cookies()).some((c) => c.name === "vd_subscription"),
  ).toBe(false);

  await page.goto(`/articles/${ARTICLE_SLUG}`);
  await expect(paywall(page)).toBeVisible();
});

test("a forged subscription cookie never unlocks an article", async ({
  page,
  context,
  baseURL,
}) => {
  await context.addCookies([
    {
      name: "vd_subscription",
      value: "00000000-0000-4000-8000-000000000000",
      url: baseURL as string,
    },
  ]);
  await page.goto(`/articles/${ARTICLE_SLUG}`);
  await expect(paywall(page)).toBeVisible();
  await expect(
    page.getByRole("banner").getByRole("button", { name: "Subscribe" }),
  ).toBeVisible();
});
