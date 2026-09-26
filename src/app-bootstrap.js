import * as Appwrite from "appwrite";

function stage(text, tone = "") {
  const node = document.querySelector("#authStatus");
  if (!node) return;
  node.textContent = text;
  node.dataset.tone = tone;
}

async function boot() {
  try {
    stage("P45 · Appwrite hazır.");
    globalThis.Appwrite = Appwrite;

    stage("P45 · Tema yükleniyor…");
    await import("./theme-controller.js");

    stage("P45 · Mobil davranış yükleniyor…");
    await import("./mobile-keyboard-stability.js");

    stage("P45 · Notlar açılıyor…");
    await import("./notes-workspace.js");
  } catch (error) {
    console.error("P45 bootstrap:", error);
    stage(`P45 · Bootstrap hata: ${error?.message || String(error)}`, "error");
    const title = document.querySelector("#authTitle");
    const copy = document.querySelector("#authCopy");
    if (title) title.textContent = "Uygulama başlatılamadı.";
    if (copy) copy.textContent = "Tanılama mesajını paylaş; hangi aşamada koptuğunu doğrudan görebiliriz.";
  }
}

void boot();
