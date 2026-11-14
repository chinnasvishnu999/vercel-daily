import {
  ARTICLE_SLUG,
  expect,
  expectNoHorizontalOverflow,
  test,
} from "./fixtures";

const pages = ["/", `/articles/${ARTICLE_SLUG}`, "/search"];

test.describe("shared layout", () => {
  for (const path of pages) {
    test(`header, footer and metadata on ${path}`, async ({ page }) => {
      await page.goto(path);

      const header = page.getByRole("banner");
      await expect(
        header.getByRole("link", { name: "Vercel Daily home" }),
      ).toBeVisible();
      await expect(
        header.getByRole("link", { name: "Home", exact: true }),
      ).toBeVisible();
      await expect(
        header.getByRole("link", { name: "Search", exact: true }),
      ).toBeVisible();
      await expect(
        header.getByRole("button", { name: /Subscribe/ }),
      ).toBeVisible();

      const year = String(new Date().getUTCFullYear());
      await expect(page.locator("footer")).toContainText(`© ${year}`);

      await expect(page).toHaveTitle(/Vercel Daily/);
      await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
        "content",
        /.+/,
      );
      await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
        "content",
        /^https?:\/\//,
      );

      await expectNoHorizontalOverflow(page);
    });
  }
});

test.describe("home page", () => {
  test("hero, breaking news and featured articles", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Read the lead story" }),
    ).toBeVisible();

    const banner = page.getByRole("region", { name: "Breaking news" });
    await expect(banner).toBeVisible();
    await expect(banner).toContainText(/\w{5,}/);

    const featured = page.locator(
      '[aria-labelledby="featured-heading"] article',
    );
    await expect(featured).toHaveCount(6);
    for (const card of await featured.all()) {
      await expect(card.locator("img")).toHaveCount(1);
      await expect(card.locator("time")).toHaveCount(1);
      await expect(card.getByRole("link")).toHaveAttribute(
        "href",
        /^\/articles\//,
      );
    }
  });

  test("featured card navigates client-side to the article", async ({
    page,
  }) => {
    await page.goto("/");
    await page.evaluate(() => {
      (window as unknown as { marker: string }).marker = "kept";
    });
    const link = page
      .locator('[aria-labelledby="featured-heading"] article a')
      .first();
    const href = await link.getAttribute("href");
    await link.click();
    await expect(page).toHaveURL(new RegExp(`${href}$`));
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    // Same document: the client router navigated without a full reload.
    expect(
      await page.evaluate(
        () => (window as unknown as { marker?: string }).marker,
      ),
    ).toBe("kept");
  });
});

test.describe("article page", () => {
  test("header, image, trending and paywall for visitors", async ({ page }) => {
    await page.goto(`/articles/${ARTICLE_SLUG}`);
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "Vercel Domains",
    );
    await expect(page.getByText(/^By /)).toBeVisible();
    await expect(page.locator("article time").first()).toBeVisible();
    await expect(page.locator("article img").first()).toBeVisible();

    await expect(
      page.getByRole("heading", { name: "Subscribe to keep reading" }),
    ).toBeVisible();

    const trending = page.locator(
      '[aria-labelledby="trending-heading"] article',
    );
    await expect(trending).toHaveCount(4);
    for (const href of await trending
      .getByRole("link")
      .evaluateAll((links) => links.map((l) => l.getAttribute("href")))) {
      expect(href).not.toBe(`/articles/${ARTICLE_SLUG}`);
    }
  });

  test("unknown article shows the 404 page", async ({ page }) => {
    await page.goto("/articles/this-article-does-not-exist");
    await expect(
      page.getByRole("heading", { name: /couldn’t find that page/ }),
    ).toBeVisible();
    await expect(page.getByRole("banner")).toBeVisible();
  });
});
