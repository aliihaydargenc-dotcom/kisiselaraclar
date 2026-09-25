import { test, expect } from "@playwright/test";

test("desktop Figma düzeni hero içinde çalışma merkezi kullanır", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name.includes("mobile"), "Desktop projede çalışır.");
  await page.goto("./");
  await expect(page.locator("#desktopHomeView #p17Workspace")).toBeVisible();
  await expect(page.locator("#homeView #p17Workspace")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Aracını bul." })).toBeVisible();

  const hero = await page.locator(".site-hero").boundingBox();
  const home = await page.locator("#desktopHomeView").boundingBox();
  expect(hero).not.toBeNull();
  expect(home).not.toBeNull();
  expect(home.x).toBeGreaterThan(hero.x + hero.width * 0.42);
});

test("Yeni not kısayolu gerçek editöre odaklanır", async ({ page }) => {
  await page.goto("./");
  await page.locator('.p17-action[data-tool="quick-note"]').first().click();
  await expect(page.locator("#p16NoteText")).toBeVisible();
  await expect(page.locator("#p16NoteText")).toBeFocused();
});

test("Görev ekle kısayolu görev başlığına odaklanır", async ({ page }) => {
  await page.goto("./");
  await page.locator('.p17-action[data-tool="tasks-calendar"]').first().click();
  await expect(page.locator("#p16TaskTitle")).toBeVisible();
  await expect(page.locator("#p16TaskTitle")).toBeFocused();
});

test("arama düğmesi arama alanını odaklar", async ({ page }) => {
  await page.goto("./");
  await page.locator("#headerSearchButton").click();
  await expect(page.locator("#toolSearch")).toBeFocused();
});

test("@mobile mobil Figma düzeni çalışma merkezi ve kompakt keşif kullanır", async ({ page }) => {
  await page.goto("./");
  await expect(page.locator("#mobileDock")).toBeVisible();
  await expect(page.locator("#homeView #p17Workspace")).toBeVisible();
  await expect(page.locator("#desktopHomeView #p17Workspace")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Aracını bul." })).toBeVisible();
  await expect(page.locator(".smart-router.is-empty")).toBeHidden();

  const headingSize = await page.locator(".tool-browser-head h2").evaluate((el) =>
    Number.parseFloat(getComputedStyle(el).fontSize)
  );
  expect(headingSize).toBeLessThanOrEqual(30);

  await page.locator("#smartFileInput").setInputFiles({
    name: "ornek.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from("%PDF-1.4\n")
  });
  await expect(page.locator(".smart-router.has-files")).toBeVisible();

  await page.locator('[data-mobile-action="today"]').click();
  await expect(page.locator("#p17Workspace")).toBeVisible();
});
