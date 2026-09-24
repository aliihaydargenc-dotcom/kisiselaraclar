import { test, expect } from "@playwright/test";

test("ana ekran çalışma merkezi ve araç kataloğu açılır", async ({ page }) => {
  await page.goto("./");
  await expect(page.getByRole("heading", { name: "İşini buradan başlat." })).toBeVisible();
  await expect(page.locator("#toolBrowser")).toBeVisible();
  await expect(page.locator("#catalogView")).toContainText("araç");
});

test("Yeni not kısayolu gerçek editöre odaklanır", async ({ page }) => {
  await page.goto("./");
  await page.getByRole("button", { name: /Yeni not/ }).click();
  await expect(page.locator("#p16NoteText")).toBeVisible();
  await expect(page.locator("#p16NoteText")).toBeFocused();
});

test("Görev ekle kısayolu görev başlığına odaklanır", async ({ page }) => {
  await page.goto("./");
  await page.locator('.p17-action[data-tool="tasks-calendar"]').click();
  await expect(page.locator("#p16TaskTitle")).toBeVisible();
  await expect(page.locator("#p16TaskTitle")).toBeFocused();
});

test("arama düğmesi arama alanını odaklar", async ({ page }) => {
  await page.goto("./");
  await page.locator("#headerSearchButton").click();
  await expect(page.locator("#toolSearch")).toBeFocused();
});

test("@mobile mobil dock görünür ve Bugün çalışma merkezine erişir", async ({ page }) => {
  await page.goto("./");
  await expect(page.locator("#mobileDock")).toBeVisible();
  await page.locator('[data-mobile-action="today"]').click();
  await expect(page.locator("#p17Workspace")).toBeVisible();
});
