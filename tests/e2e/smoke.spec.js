import { test, expect } from "@playwright/test";

test("desktop özel çalışma alanını pazarlama hero'su yerine öne çıkarır", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name.includes("mobile"), "Desktop projede çalışır.");
  await page.goto("./");
  await expect(page.locator("#desktopHomeView #p17Workspace")).toBeVisible();
  await expect(page.locator("#homeView #p17Workspace")).toHaveCount(0);
  await expect(page.locator("#toolBrowser")).toBeHidden();
  await expect(page.locator("#desktopToolNav")).toBeVisible();
  await expect(page.locator(".site-hero-copy")).toBeHidden();
  await expect(page.locator(".ticker")).toBeHidden();
  await expect(page.locator(".site-benefits")).toBeHidden();

  const hero = await page.locator(".site-hero").boundingBox();
  const home = await page.locator("#desktopHomeView").boundingBox();
  expect(hero).not.toBeNull();
  expect(home).not.toBeNull();
  expect(Math.abs(home.x - hero.x)).toBeLessThanOrEqual(2);
  expect(home.width).toBeGreaterThan(hero.width * 0.95);
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

test("arama düğmesi aktif cihaz aramasını odaklar", async ({ page }, testInfo) => {
  await page.goto("./");
  await page.locator("#headerSearchButton").click();
  if (testInfo.project.name.includes("mobile")) {
    await expect(page.locator("#toolSearch")).toBeFocused();
  } else {
    await expect(page.locator("[data-desktop-tool-search-input]")).toBeFocused();
  }
});

test("@mobile mobil özel çalışma alanı taşmadan açılır", async ({ page }) => {
  await page.goto("./");
  await expect(page.locator("#mobileDock")).toBeVisible();
  await expect(page.locator("#homeView #p17Workspace")).toBeVisible();
  await expect(page.locator("#desktopHomeView #p17Workspace")).toHaveCount(0);
  await expect(page.locator(".site-page")).toBeHidden();
  await expect(page.locator(".ticker")).toBeHidden();
  await expect(page.getByRole("heading", { name: "Aracını bul." })).toBeHidden();
  await expect(page.locator(".smart-router.is-empty")).toBeHidden();

  const viewport = await page.evaluate(() => ({
    inner: innerWidth,
    scroll: document.documentElement.scrollWidth
  }));
  expect(viewport.scroll).toBeLessThanOrEqual(viewport.inner + 1);

  const headingSize = await page.locator(".tool-browser-head h2").evaluate((el) =>
    Number.parseFloat(getComputedStyle(el).fontSize)
  );
  expect(headingSize).toBeLessThanOrEqual(30);

  await page.locator('[data-mobile-action="search"]').click();
  await expect(page.locator("#mobileToolsDrawer")).toHaveAttribute("aria-hidden", "false");
  await expect(page.getByRole("heading", { name: "Aracını bul." })).toBeVisible();

  await page.locator("#smartFileInput").setInputFiles({
    name: "ornek.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from("%PDF-1.4\n")
  });
  await expect(page.locator(".smart-router.has-files")).toBeVisible();
  await page.locator("#mobileToolsClose").click();
  await expect(page.locator("#mobileToolsDrawer")).toHaveAttribute("aria-hidden", "true");

  await page.locator('.p17-action[data-tool="quick-note"]').first().click();
  await expect(page.locator("#p16NoteText")).toBeVisible();
  const noteViewport = await page.evaluate(() => ({
    inner: innerWidth,
    scroll: document.documentElement.scrollWidth
  }));
  expect(noteViewport.scroll).toBeLessThanOrEqual(noteViewport.inner + 1);
});


test("P19 Hızlı Not masaüstünde geniş editör ve Markdown checklist kullanır", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name.includes("mobile"), "Desktop projede çalışır.");
  await page.goto("./");
  await page.locator('.p17-action[data-tool="quick-note"]').first().click();

  const toolWidth = await page.locator('.tool-view[data-office-mode="quick-note"]').evaluate((el) => el.getBoundingClientRect().width);
  expect(toolWidth).toBeGreaterThan(1000);

  const title = page.locator("#p16NoteTitle");
  await title.fill("Bu başlık masaüstünde yatay kaydırma oluşturmadan iki satıra kadar büyüyebilmeli ve rahatça okunabilmeli");
  const titleMetrics = await title.evaluate((el) => ({
    scrollWidth: el.scrollWidth,
    clientWidth: el.clientWidth,
    height: el.getBoundingClientRect().height
  }));
  expect(titleMetrics.scrollWidth).toBeLessThanOrEqual(titleMetrics.clientWidth + 1);
  expect(titleMetrics.height).toBeGreaterThan(54);

  const body = page.locator("#p16NoteText");
  await body.fill("Raporu gönder\nSunumu güncelle");
  await expect(page.locator('.tool-view[data-office-mode="quick-note"]')).not.toContainText("yalnız bu cihazda");
  await body.evaluate((el) => el.setSelectionRange(0, el.value.length));
  await page.locator('[data-note-format="check"]').click();
  await expect(body).toHaveValue("- [ ] Raporu gönder\n- [ ] Sunumu güncelle");

  await body.evaluate((el) => el.setSelectionRange(0, el.value.length));
  await page.locator('[data-note-format="check-done"]').click();
  await expect(body).toHaveValue("- [x] Raporu gönder\n- [x] Sunumu güncelle");

  await page.locator("#p16CompleteNote").click();
  await expect(page.locator("#p16CompleteNote")).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".p16-note-item.active")).toContainText("Tamamlandı");
});


test("P19.1 Hızlı Not takvim görünümü not tarihini gösterir", async ({ page }) => {
  await page.goto("./");
  await page.locator('.p17-action[data-tool="quick-note"]').first().click();

  const date = page.locator("#p16NoteDate");
  await date.fill("2026-09-15");
  await date.dispatchEvent("change");

  await page.locator('[data-note-view="calendar"]').click();
  await expect(page.locator("#p16NoteCalendar")).toBeVisible();
  await expect(page.locator('[data-note-date="2026-09-15"]')).toHaveClass(/selected/);
  await expect(page.locator('[data-note-date="2026-09-15"] b')).toHaveText("1");

  await page.locator('[data-note-create-date="2026-09-15"]').click();
  await expect(page.locator("#p16NoteDate")).toHaveValue("2026-09-15");
  await expect(page.locator('[data-note-date="2026-09-15"] b')).toHaveText("2");
});


test("P19.2 Hızlı Not tek tasarım dili ve sıkı editör akışı kullanır", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name.includes("mobile"), "Desktop projede çalışır.");
  await page.goto("./");
  await page.locator('.p17-action[data-tool="quick-note"]').first().click();
  await expect(page.locator('.tool-view[data-office-mode="quick-note"]')).toBeVisible();
  await expect(page.locator('#p16NoteText')).toBeVisible();

  const metrics = await page.evaluate(() => {
    const root = document.querySelector('.tool-view[data-office-mode="quick-note"]');
    const title = root.querySelector('.tool-title-row h2');
    const integration = root.querySelector('.integration-strip');
    const sidebar = root.querySelector('.p16-note-sidebar');
    const editor = root.querySelector('.p16-note-editor');
    const noteTitle = root.querySelector('#p16NoteTitle');
    const toolbar = root.querySelector('.p16-note-formatbar');
    const text = root.querySelector('#p16NoteText');
    const titleBox = noteTitle.getBoundingClientRect();
    const toolbarBox = toolbar.getBoundingClientRect();
    const textBox = text.getBoundingClientRect();
    return {
      headingSize: parseFloat(getComputedStyle(title).fontSize),
      integrationDisplay: getComputedStyle(integration).display,
      sidebarRadius: parseFloat(getComputedStyle(sidebar).borderRadius),
      editorRadius: parseFloat(getComputedStyle(editor).borderRadius),
      noteTitleRadius: parseFloat(getComputedStyle(noteTitle).borderRadius),
      toolbarRadius: parseFloat(getComputedStyle(toolbar).borderRadius),
      titleToToolbarGap: toolbarBox.top - titleBox.bottom,
      toolbarToTextGap: textBox.top - toolbarBox.bottom
    };
  });

  expect(metrics.headingSize).toBeLessThanOrEqual(54);
  expect(metrics.integrationDisplay).toBe("none");
  expect(metrics.sidebarRadius).toBeGreaterThanOrEqual(20);
  expect(metrics.editorRadius).toBeGreaterThanOrEqual(20);
  expect(metrics.noteTitleRadius).toBe(0);
  expect(metrics.toolbarRadius).toBeGreaterThanOrEqual(10);
  expect(metrics.titleToToolbarGap).toBeLessThanOrEqual(16);
  expect(metrics.toolbarToTextGap).toBeLessThanOrEqual(16);
});


test("P20 test ortamı çalışma alanını render eder", async ({ page }) => {
  await page.goto("./");
  await expect(page.locator("body")).toHaveClass(/auth-ready/);
  await expect(page.locator("#authGate")).toBeHidden();
});


test("980 px ara görünüm masaüstü kabuğuna düşmez", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name.includes("mobile"), "Desktop Chromium üzerinde ara viewport doğrulanır.");
  await page.setViewportSize({ width: 980, height: 900 });
  await page.goto("./");
  await expect(page.locator("#homeView #p17Workspace")).toBeVisible();
  await expect(page.locator("#desktopHomeView #p17Workspace")).toHaveCount(0);
  await expect(page.locator(".site-page")).toBeHidden();
  const metrics = await page.evaluate(() => ({
    inner: window.innerWidth,
    scroll: document.documentElement.scrollWidth
  }));
  expect(metrics.scroll).toBeLessThanOrEqual(metrics.inner + 1);
});


test("@mobile P25 kişisel ana ekran ve alt navigasyon çalışır", async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.includes("mobile"), "Mobil projede çalışır.");
  await page.goto("./");
  await expect(page.locator(".p25-core-grid")).toBeVisible();
  await expect(page.locator(".p25-notes")).toBeVisible();
  await expect(page.locator(".p25-voice")).toBeVisible();
  await expect(page.locator(".p25-plan")).toBeVisible();
  await expect(page.locator("#mobileDock button")).toHaveCount(4);
  await expect(page.locator('[data-mobile-action="today"]')).toContainText("Ana");
  await expect(page.locator('[data-mobile-action="note"]')).toContainText("Not");
  await expect(page.locator('[data-mobile-action="task"]')).toContainText("Görev");
  await expect(page.locator('[data-mobile-action="search"]')).toContainText("Ara");
  await expect(page.locator('[data-mobile-action="today"]')).toHaveAttribute("aria-current", "page");
  await expect(page.locator("[data-p30-connection]")).toContainText(/Çevrimiçi|Çevrimdışı/);
  const dockRows = await page.locator("#mobileDock button").evaluateAll((items) => items.map((item) => Math.round(item.getBoundingClientRect().top)));
  expect(new Set(dockRows).size).toBe(1);
  const dockFont = await page.locator("#mobileDock strong").first().evaluate((item) => parseFloat(getComputedStyle(item).fontSize));
  expect(dockFont).toBeGreaterThanOrEqual(10);

  await page.locator('[data-mobile-action="note"]').click();
  await expect(page.locator("#p16NoteText")).toBeVisible();
  await expect(page.locator("#p16NoteText")).toBeFocused();

  await page.goto("./");
  await page.locator('[data-mobile-action="task"]').click();
  await expect(page.locator("#p16TaskTitle")).toBeVisible();
  await expect(page.locator("#p16TaskTitle")).toBeFocused();
});

test("@mobile P30 farklı telefon genişliklerinde taşmadan çalışır", async ({ page }) => {
  for (const width of [360, 390, 430]) {
    await page.setViewportSize({ width, height: 820 });
    await page.goto("./");
    await expect(page.locator("#homeView #p17Workspace")).toBeVisible();
    const metrics = await page.evaluate(() => ({ inner: innerWidth, scroll: document.documentElement.scrollWidth }));
    expect(metrics.scroll).toBeLessThanOrEqual(metrics.inner + 1);
    await expect(page.locator("#mobileDock .is-active")).toHaveCount(1);
  }
});

test("@mobile P30 nottan görev oluşturur ve PWA manifesti sunar", async ({ page, request }) => {
  const manifest = await request.get("./manifest.webmanifest");
  expect(manifest.ok()).toBeTruthy();
  expect((await manifest.json()).display).toBe("standalone");

  await page.goto("./#tool=quick-note");
  await expect(page.locator("#p16NoteText")).toBeVisible();
  await expect(page.locator(".p16-note-mobile-tabs")).toBeVisible();
  await page.locator('[data-note-mobile-view="list"]').click();
  await expect(page.locator(".p16-note-sidebar")).toBeVisible();
  await expect(page.locator(".p16-note-editor")).toBeHidden();
  await page.locator('[data-note-mobile-view="editor"]').click();
  await expect(page.locator(".p16-note-editor")).toBeVisible();
  await page.locator("#p16NoteTitle").fill("Mobil P30 görevi");
  await page.locator("#p16NoteText").fill("Bu not görev listesine aktarılacak.");
  await page.locator("#p16NoteToTask").click();
  await expect(page.locator("#p16Status")).toContainText("Görev oluşturuldu");
  await page.goto("./#tool=tasks-calendar");
  await expect(page.locator("#p16TaskList")).toContainText("Mobil P30 görevi");
});


test("P23 masaüstü araç çekmecesi kategoriyi sağ flyout içinde açar", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name.includes("mobile"), "Desktop projede çalışır.");
  await page.goto("./");
  await expect(page.locator("#desktopToolNav")).toBeVisible();
  await expect(page.locator("#toolBrowser")).toBeHidden();
  await expect(page.locator(".smart-router")).toHaveCount(0);
  await expect(page.locator(".quick-section")).toHaveCount(0);

  await page.locator('[data-desktop-category="ocr"]').click();
  await expect(page.locator(".desktop-tool-flyout")).toBeVisible();
  await expect(page.locator(".desktop-tool-flyout h3")).toHaveText("OCR");
  await expect(page.locator('.desktop-tool-item[data-desktop-tool="ocr-image"]')).toBeVisible();

  await page.locator('.desktop-tool-item[data-desktop-tool="ocr-image"]').click();
  await expect(page.locator("body")).toHaveClass(/tool-open/);
  await expect(page.locator("#toolView")).toBeVisible();
});

test("P23 masaüstü başlık araması araç çekmecesi aramasını açar", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name.includes("mobile"), "Desktop projede çalışır.");
  await page.goto("./");
  await page.locator("#headerSearchButton").click();
  await expect(page.locator("[data-desktop-tool-search-input]")).toBeVisible();
  await expect(page.locator("[data-desktop-tool-search-input]")).toBeFocused();
  await page.locator("[data-desktop-tool-search-input]").fill("not");
  await expect(page.locator('.desktop-tool-item[data-desktop-tool="quick-note"]')).toBeVisible();
});


test("P24 görev ekleme render hatası vermeden kaydeder", async ({ page }) => {
  await page.goto("./#tool=tasks-calendar");
  await expect(page.locator("#p16TaskTitle")).toBeVisible();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));

  await page.locator("#p16TaskTitle").fill("P24 test görevi");
  await page.locator("#p16TaskAdd").click();

  await expect(page.locator("#p16TaskList")).toContainText("P24 test görevi");
  await expect(page.locator("#p16Status")).toContainText("Görev eklendi");
  expect(errors).toEqual([]);
});

test("P24 masaüstü menü gerçek SVG ikon ve okunabilir metin kullanır", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name.includes("mobile"), "Desktop projede çalışır.");
  await page.goto("./");
  await page.locator(".desktop-tool-toggle").click();
  await expect(page.locator('[data-desktop-category="ocr"] svg')).toBeVisible();
  const size = await page.locator('[data-desktop-category="ocr"] .desktop-tool-category-copy strong').evaluate((el) =>
    Number.parseFloat(getComputedStyle(el).fontSize)
  );
  expect(size).toBeGreaterThanOrEqual(12);
});


test("P25 ana ekran hızlı notu doğrudan kaydeder", async ({ page }) => {
  await page.goto("./");
  await expect(page.locator("#p25QuickNoteInput")).toBeVisible();
  await page.locator("#p25QuickNoteInput").fill("Ana ekrandan hızlı not");
  await page.locator("#p25QuickNoteForm button[type=submit]").click();
  await expect(page.locator(".p25-note-list")).toContainText("Ana ekrandan hızlı not");

  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem("kisiselaraclar:p16:notes") || "[]"));
  expect(stored.some((item) => item.text === "Ana ekrandan hızlı not")).toBeTruthy();
});

test("P25 ana ekran günlük plan görevi tamamlayabilir", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("kisiselaraclar:p16:tasks", JSON.stringify([{
      id: "p25-home-task",
      title: "Ana ekran görev testi",
      date: new Date().toISOString().slice(0, 10),
      time: "18:00",
      done: false,
      createdAt: Date.now()
    }]));
  });
  await page.goto("./");
  const checkbox = page.locator('[data-p25-task-toggle="p25-home-task"]');
  await expect(checkbox).toBeVisible();
  await checkbox.check();

  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem("kisiselaraclar:p16:tasks") || "[]"));
  expect(stored.find((item) => item.id === "p25-home-task")?.done).toBe(true);
});

test("P25 masaüstü ana ekranda üç ana kullanım alanı öne çıkar", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name.includes("mobile"), "Desktop projede çalışır.");
  await page.goto("./");
  await expect(page.locator(".p25-core-grid")).toBeVisible();
  await expect(page.locator(".p25-card")).toHaveCount(3);
  await expect(page.locator(".p25-notes h3")).toHaveText("Not Defteri");
  await expect(page.locator(".p25-voice h3")).toHaveText("Sesli Notlar");
  await expect(page.locator(".p25-plan h3")).toHaveText("Günlük Plan");
  await expect(page.locator(".p25-quick-actions")).toBeVisible();
});


test("P27 ana ekranda sesli not düzenlenip sonra kaydedilir", async ({ page }) => {
  await page.addInitScript(() => {
    class FakeSpeechRecognition {
      constructor() {
        window.__fakeSpeechRecognition = this;
        this.continuous = false;
        this.interimResults = false;
        this.lang = "";
      }
      start() { this.onstart?.(); }
      stop() { this.onend?.(); }
    }
    window.SpeechRecognition = FakeSpeechRecognition;
  });

  await page.goto("./");
  const recorder = page.locator("#p25VoiceRecorder");
  await recorder.click();
  await expect(page.locator("body")).not.toHaveClass(/tool-open/);
  await expect(page.locator("#p25VoiceEditor")).toBeVisible();

  await page.evaluate(() => {
    const rec = window.__fakeSpeechRecognition;
    rec.onresult?.({
      resultIndex: 0,
      results: [{ 0: { transcript: "yarın raporu kontrol et" }, isFinal: true }]
    });
  });
  await expect(page.locator("#p25VoiceTranscript")).toHaveValue("Yarın raporu kontrol et");

  await recorder.click();
  await expect(page.locator("#p25VoiceTranscript")).not.toHaveAttribute("readonly");
  await page.locator("#p25VoiceTranscript").fill("Yarın raporu kontrol et ve Zehra'ya gönder.");
  await page.locator("#p25VoiceSave").click();

  await expect(page.locator("body")).not.toHaveClass(/tool-open/);
  await expect(page.locator(".p25-voice-list")).toContainText("Yarın raporu kontrol et ve Zehra'ya gönder.");

  await page.locator("[data-p25-voice-note-id]").first().click();
  await expect(page.locator("body")).not.toHaveClass(/tool-open/);
  await expect(page.locator("#p25VoiceTranscript")).toHaveValue("Yarın raporu kontrol et ve Zehra'ya gönder.");

  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem("kisiselaraclar:p16:notes") || "[]"));
  expect(stored.some((item) => /Sesli Not/i.test(item.title) && item.text === "Yarın raporu kontrol et ve Zehra'ya gönder.")).toBeTruthy();
});

test("P27 voice-note aracı kayıtlı sesli notu boş açmaz", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("kisiselaraclar:p16:notes", JSON.stringify([{
      id: "voice-existing",
      title: "Sesli Not · 14:30",
      text: "Kayıtlı sesli not metni",
      pinned: false,
      completed: false,
      noteDate: new Date().toISOString().slice(0, 10),
      updatedAt: Date.now()
    }]));
  });
  await page.goto("./#tool=voice-note");
  await expect(page.locator("#p16VoiceText")).toHaveValue("Kayıtlı sesli not metni");
  await expect(page.locator("[data-voice-note-id=voice-existing]")).toBeVisible();
});
