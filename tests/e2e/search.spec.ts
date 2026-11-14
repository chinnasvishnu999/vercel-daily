import { expect, test, waitForHydration } from "./fixtures";

const results = (page: import("@playwright/test").Page) =>
  page.locator("[aria-busy] article");

test.beforeEach(async ({ page }) => {
  await page.goto("/search");
  await waitForHydration(page, 'input[type="search"]');
});

test("default state shows recent articles", async ({ page }) => {
  await expect(
    page.getByRole("heading", { name: "Latest articles" }),
  ).toBeVisible();
  await expect(results(page)).toHaveCount(6);
});

test("debounced search after 3 characters, persisted in the URL", async ({
  page,
}) => {
  const input = page.getByRole("searchbox", { name: "Search articles" });

  await input.pressSequentially("ve", { delay: 50 });
  await expect(page.getByText(/at least 3 characters/)).toBeVisible();
  await page.waitForTimeout(600);
  await expect(page).toHaveURL(/\/search$/);

  const requests: string[] = [];
  page.on("request", (r) => {
    if (/[?&]q=/.test(r.url()) && r.url().includes("_rsc"))
      requests.push(r.url());
  });
  await input.pressSequentially("rcel", { delay: 50 });
  await expect(page).toHaveURL(/q=vercel/);
  await expect(
    page.getByRole("heading", { name: /results? for “vercel”/ }),
  ).toBeVisible();
  expect(await results(page).count()).toBeLessThanOrEqual(5);
  // Debounce: one navigation for the whole burst of typing
  expect(
    requests.filter((u) => u.includes("q=vercel")).length,
  ).toBeLessThanOrEqual(1);

  // Refreshing restores the same results and inputs
  await page.reload();
  await expect(page.getByRole("searchbox")).toHaveValue("vercel");
  await expect(
    page.getByRole("heading", { name: /results? for “vercel”/ }),
  ).toBeVisible();
});

test("category filter, Enter, empty state and clearing", async ({ page }) => {
  await page.getByLabel("Category").selectOption("changelog");
  await expect(page).toHaveURL(/category=changelog/);
  await expect(page.getByRole("heading", { name: /results?/ })).toBeVisible();

  const input = page.getByRole("searchbox", { name: "Search articles" });
  await input.fill("ne");
  await input.press("Enter"); // explicit submit works below 3 characters
  await expect(page).toHaveURL(/q=ne&category=changelog/);

  await input.fill("zzzqqqxyz");
  await expect(
    page.getByRole("heading", { name: "No articles found" }),
  ).toBeVisible();

  await input.fill("");
  await expect(page).not.toHaveURL(/q=/);
  await expect(page).toHaveURL(/category=changelog/);
});

test("shared URL with query and category renders the same results", async ({
  page,
}) => {
  await page.goto("/search?q=vercel&category=changelog");
  await expect(page.getByRole("searchbox")).toHaveValue("vercel");
  await expect(page.getByLabel("Category")).toHaveValue("changelog");
  await expect(
    page.getByRole("heading", { name: /results? for “vercel”/ }),
  ).toBeVisible();
});
