import * as Appwrite from "appwrite";

function stage(text, tone = "") {
  const node = document.querySelector("#authStatus");
  if (!node) return;
  node.textContent = text;
  node.dataset.tone = tone;
}

function loadMobileBehaviorLater() {
  globalThis.setTimeout(() => {
    void import("./mobile-keyboard-stability.js").catch((error) => {
      console.warn("P46 mobile behavior:", error);
    });
  }, 0);
}

async function boot() {
  try {
    stage("P46 · Appwrite hazır.");
    globalThis.Appwrite = Appwrite;

    stage("P46 · Tema yükleniyor…");
    await import("./theme-controller.js");

    stage("P46 · Oturum ekranı hazırlanıyor…");
    loadMobileBehaviorLater();

    // Auth/workspace is the critical path. Optional keyboard behavior must never
    // prevent the login form from appearing on a fresh Android install.
    await import("./notes-workspace.js");
  } catch (error) {
    console.error("P46 bootstrap:", error);
    stage(`P46 · Bootstrap hata: ${error?.message || String(error)}`, "error");
    const title = document.querySelector("#authTitle");
    const copy = document.querySelector("#authCopy");
    if (title) title.textContent = "Uygulama başlatılamadı.";
    if (copy) copy.textContent = "Tanılama mesajını paylaş; hangi aşamada koptuğunu doğrudan görebiliriz.";
  }
}

void boot();
