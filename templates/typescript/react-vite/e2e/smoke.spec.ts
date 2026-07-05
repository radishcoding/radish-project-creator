import { expect, test } from "@playwright/test"

test("加载白屏应用并切换到暗色主题", async ({ page }) => {
  await page.goto("/")
  const toggle = page.getByRole("button", { name: /切换主题|Toggle theme/ })
  await expect(toggle).toBeVisible()
  await toggle.click()
  await page.getByRole("menuitemradio", { name: /暗色|Dark/ }).click()
  await expect(page.locator("html")).toHaveClass(/dark/)
})
