import { expect, test } from "@playwright/test";

test("homepage loads", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", {
      name: /build digital systems that look sharp/i,
    }),
  ).toBeVisible();
});
