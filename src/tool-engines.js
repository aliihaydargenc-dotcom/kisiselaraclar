const encoder = new TextEncoder();

function decodeUtf8Base64(input) {
  const binary = atob(input.trim());
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function encodeUtf8Base64(input) {
  const bytes = encoder.encode(input);
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}

export const engines = {
  encodeBase64(input) {
    return encodeUtf8Base64(input);
  },

  decodeBase64(input) {
    return decodeUtf8Base64(input);
  },

  encodeUrl(input) {
    return encodeURIComponent(input);
  },

  decodeUrl(input) {
    return decodeURIComponent(input);
  },

  formatJson(input) {
    return JSON.stringify(JSON.parse(input), null, 2);
  },

  minifyJson(input) {
    return JSON.stringify(JSON.parse(input));
  },

  removeDuplicateLines(input) {
    const seen = new Set();
    return input
      .split(/\r?\n/)
      .filter((line) => {
        if (seen.has(line)) return false;
        seen.add(line);
        return true;
      })
      .join("\n");
  },

  textStats(input) {
    const trimmed = input.trim();
    const words = trimmed ? trimmed.split(/\s+/).length : 0;
    const lines = input ? input.split(/\r?\n/).length : 0;
    const chars = input.length;
    const charsNoSpace = input.replace(/\s/g, "").length;
    const minutes = words === 0 ? 0 : Math.max(1, Math.ceil(words / 200));
    return [
      `Karakter: ${chars.toLocaleString("tr-TR")}`,
      `Boşluksuz karakter: ${charsNoSpace.toLocaleString("tr-TR")}`,
      `Kelime: ${words.toLocaleString("tr-TR")}`,
      `Satır: ${lines.toLocaleString("tr-TR")}`,
      `Yaklaşık okuma: ${minutes} dk`
    ].join("\n");
  },

  async sha256(input) {
    if (!globalThis.crypto?.subtle) {
      throw new Error("Bu tarayıcı SHA-256 hesaplamasını desteklemiyor.");
    }
    const digest = await globalThis.crypto.subtle.digest("SHA-256", encoder.encode(input));
    return Array.from(new Uint8Array(digest))
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");
  },

  unixToDate(input) {
    const raw = Number(input.trim());
    if (!Number.isFinite(raw)) throw new Error("Geçerli bir Unix timestamp gir.");
    const milliseconds = raw < 10_000_000_000 ? raw * 1000 : raw;
    const date = new Date(milliseconds);
    if (Number.isNaN(date.getTime())) throw new Error("Tarih dönüştürülemedi.");
    return [
      `Yerel: ${new Intl.DateTimeFormat("tr-TR", { dateStyle: "full", timeStyle: "long" }).format(date)}`,
      `ISO: ${date.toISOString()}`
    ].join("\n");
  },

  dateToUnix(input) {
    const date = new Date(input.trim());
    if (Number.isNaN(date.getTime())) {
      throw new Error("Geçerli bir tarih gir. Örnek: 2026-09-24 13:30");
    }
    return [
      `Saniye: ${Math.floor(date.getTime() / 1000)}`,
      `Milisaniye: ${date.getTime()}`,
      `ISO: ${date.toISOString()}`
    ].join("\n");
  }
};

export async function runEngine(actionId, input) {
  const engine = engines[actionId];
  if (!engine) throw new Error("Araç motoru bulunamadı.");
  return await engine(input);
}
