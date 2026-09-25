import { entityRowId, mergeEntityCollection } from "./workspace-sync.js";

const CONFIG = Object.freeze({
  endpoint: "https://fra.cloud.appwrite.io/v1",
  projectId: "6ab62a5b002fec4a3519",
  databaseId: "main",
  tableId: "sync_state",
  entityTables: Object.freeze({
    notes: "workspace_notes",
    tasks: "workspace_tasks"
  }),
  username: "alihaydar",
  loginEmail: "alihaydar@kisiselaraclar.local"
});

const PREFIX = "kisiselaraclar:";
const META_KEY = "kisiselaraclar-cloud:last-sync";
const ENTITY_META_KEY = "__ka_cloud_v2_meta";
const CHANGE_EVENT = "kisiselaraclar:local-change";
const REMOTE_CHANGE_EVENT = "kisiselaraclar:remote-change";
const NOTES_KEY = "kisiselaraclar:p16:notes";
const TASKS_KEY = "kisiselaraclar:p16:tasks";
export const CLOUD_SYNC_LIMIT = 60000;
export const SYNC_STATE_EVENT = "kisiselaraclar:sync-state";
const LIMIT = CLOUD_SYNC_LIMIT;
let user = null;
let lastHash = "";
let timer = 0;
let inFlight = null;
let entitySyncReady = false;
let periodicTimer = 0;

function sdk() {
  const kit = globalThis.Appwrite;
  if (!kit?.Client || !kit?.Account || !kit?.TablesDB) throw new Error("Appwrite SDK yüklenemedi.");
  const client = new kit.Client().setEndpoint(CONFIG.endpoint).setProject(CONFIG.projectId);
  return { kit, account: new kit.Account(client), db: new kit.TablesDB(client) };
}

function storage() {
  try { return globalThis.localStorage; } catch { return null; }
}

function bytes(value) {
  return new TextEncoder().encode(String(value ?? "")).byteLength;
}

function hash(value) {
  let result = 2166136261;
  const text = String(value ?? "");
  for (let i = 0; i < text.length; i += 1) {
    result ^= text.charCodeAt(i);
    result = Math.imul(result, 16777619);
  }
  return (result >>> 0).toString(36);
}

export function normalizeUsername(value) {
  return String(value ?? "").trim().toLocaleLowerCase("tr-TR");
}

export function usernameToEmail(value) {
  return normalizeUsername(value) === CONFIG.username ? CONFIG.loginEmail : "";
}

export function collectSyncEntries(target = storage()) {
  const entries = {};
  if (!target) return entries;
  try {
    const keys = [];
    for (let i = 0; i < Number(target.length || 0); i += 1) {
      const key = target.key(i);
      if (key?.startsWith(PREFIX)) keys.push(key);
    }
    keys.sort();
    for (const key of keys) {
      const value = target.getItem(key);
      if (typeof value === "string") entries[key] = value;
    }
  } catch {}
  return entries;
}

function collectLegacyEntries(target = storage()) {
  const entries = collectSyncEntries(target);
  if (entitySyncReady) {
    delete entries[NOTES_KEY];
    delete entries[TASKS_KEY];
  }
  return entries;
}

function readEntityMeta() {
  try {
    const value = JSON.parse(storage()?.getItem(ENTITY_META_KEY) || "null");
    return value?.schema === 2 ? value : { schema: 2, notes: {}, tasks: {} };
  } catch {
    return { schema: 2, notes: {}, tasks: {} };
  }
}

function writeEntityMeta(meta) {
  try { storage()?.setItem(ENTITY_META_KEY, JSON.stringify({ schema: 2, notes: meta.notes || {}, tasks: meta.tasks || {} })); } catch {}
}

function parseLocalArray(key) {
  try {
    const value = JSON.parse(storage()?.getItem(key) || "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function applyEntityItems(key, items) {
  const target = storage();
  if (!target) return false;
  const next = JSON.stringify(items || []);
  const previous = target.getItem(key) || "[]";
  if (previous === next) return false;
  target.setItem(key, next);
  try { globalThis.dispatchEvent?.(new CustomEvent(REMOTE_CHANGE_EVENT, { detail: { key } })); } catch {}
  return true;
}

export function syncEntriesHash(entries) {
  return hash(JSON.stringify(entries || {}));
}

function envelope(entries, updatedAt = Date.now()) {
  return { schema: 1, updatedAt, entries };
}

export function fitSyncPayload(entries, updatedAt = Date.now()) {
  const source = entries || {};
  const full = envelope(source, updatedAt);
  if (bytes(JSON.stringify(full)) <= LIMIT) return { payload: full, dropped: [] };

  const sorted = Object.keys(source).sort((a, b) => {
    const rank = (key) => key.startsWith("kisiselaraclar:p16:") ? 0 : key.startsWith("kisiselaraclar:p17:") ? 1 : 2;
    return rank(a) - rank(b) || a.localeCompare(b);
  });
  const kept = {};
  const dropped = [];
  for (const key of sorted) {
    const next = { ...kept, [key]: source[key] };
    if (bytes(JSON.stringify(envelope(next, updatedAt))) <= LIMIT) kept[key] = source[key];
    else dropped.push(key);
  }
  return { payload: envelope(kept, updatedAt), dropped };
}

export function createSyncPayload(entries, updatedAt = Date.now()) {
  const { payload, dropped } = fitSyncPayload(entries, updatedAt);
  if (!dropped.length) return payload;
  const error = new Error("Bulut senkron sınırı aşıldı; hiçbir kayıt kısmi olarak gönderilmedi.");
  error.name = "SyncPayloadLimitError";
  error.code = "SYNC_PAYLOAD_LIMIT";
  error.dropped = dropped;
  throw error;
}

function readMeta() {
  try { return JSON.parse(storage()?.getItem(META_KEY) || "null"); } catch { return null; }
}

function writeMeta(updatedAt, localHash) {
  try { storage()?.setItem(META_KEY, JSON.stringify({ updatedAt, localHash })); } catch {}
}

function parseCloud(row) {
  try {
    const value = JSON.parse(String(row?.payload || ""));
    return value?.schema === 1 && typeof value.entries === "object" ? value : null;
  } catch { return null; }
}

function applyEntries(entries, replace = false) {
  const target = storage();
  if (!target) return;
  if (replace) {
    const existing = [];
    for (let i = 0; i < Number(target.length || 0); i += 1) {
      const key = target.key(i);
      if (key?.startsWith(PREFIX)) existing.push(key);
    }
    existing.forEach((key) => {
      if ((key === NOTES_KEY || key === TASKS_KEY) && !(key in entries)) return;
      if (!(key in entries)) target.removeItem(key);
    });
  }
  Object.entries(entries || {}).forEach(([key, value]) => {
    if (key.startsWith(PREFIX) && typeof value === "string") target.setItem(key, value);
  });
}

function badge(text, title = "") {
  const node = document.querySelector("#cloudSyncBadge");
  if (node) {
    node.textContent = text;
    node.title = title;
  }
}

function setSyncState(state, text, title = "") {
  badge(text, title);
  try {
    globalThis.dispatchEvent?.(new CustomEvent(SYNC_STATE_EVENT, {
      detail: { state, text, title, at: Date.now() }
    }));
  } catch {}
}

async function listEntityRows(tableId) {
  const { db, kit } = sdk();
  const queries = kit.Query?.limit ? [kit.Query.limit(5000)] : [];
  const result = await db.listRows({
    databaseId: CONFIG.databaseId,
    tableId,
    queries
  });
  return Array.isArray(result?.rows) ? result.rows : [];
}

async function upsertEntityRow(userId, tableId, write) {
  const { db, kit } = sdk();
  const role = kit.Role.user(userId);
  await db.upsertRow({
    databaseId: CONFIG.databaseId,
    tableId,
    rowId: write.rowId || entityRowId(write.localId),
    data: {
      local_id: write.localId,
      updated_at: Number(write.updatedAt),
      deleted_at: Number(write.deletedAt || 0),
      payload: String(write.payload || "{}")
    },
    permissions: [
      kit.Permission.read(role),
      kit.Permission.update(role),
      kit.Permission.delete(role)
    ]
  });
}

async function syncEntityCollection(userId, type, key, baseline) {
  const tableId = CONFIG.entityTables[type];
  const cloudRows = await listEntityRows(tableId);
  const localItems = parseLocalArray(key);
  const result = mergeEntityCollection({
    type,
    localItems,
    cloudRows,
    baseline,
    now: Date.now()
  });
  for (const write of result.writes) {
    await upsertEntityRow(userId, tableId, write);
  }
  applyEntityItems(key, result.items);
  return result.baseline;
}

async function syncEntityCollections(userId) {
  const meta = readEntityMeta();
  const next = {
    schema: 2,
    notes: await syncEntityCollection(userId, "notes", NOTES_KEY, meta.notes),
    tasks: await syncEntityCollection(userId, "tasks", TASKS_KEY, meta.tasks)
  };
  writeEntityMeta(next);
  entitySyncReady = true;
  return next;
}

async function readCloudState(id) {
  const { db } = sdk();
  try {
    return parseCloud(await db.getRow({ databaseId: CONFIG.databaseId, tableId: CONFIG.tableId, rowId: id }));
  } catch (error) {
    if (Number(error?.code) === 404) return null;
    throw error;
  }
}

async function writeCloudState(id, entries = collectLegacyEntries()) {
  const { db, kit } = sdk();
  const payload = createSyncPayload(entries);
  const role = kit.Role.user(id);
  await db.upsertRow({
    databaseId: CONFIG.databaseId,
    tableId: CONFIG.tableId,
    rowId: id,
    data: { payload: JSON.stringify(payload) },
    permissions: [
      kit.Permission.read(role),
      kit.Permission.update(role),
      kit.Permission.delete(role)
    ]
  });
  const localHash = syncEntriesHash(collectSyncEntries());
  writeMeta(payload.updatedAt, localHash);
  lastHash = localHash;
  setSyncState("synced", "Bulut ✓", "Senkron tamamlandı");
}

async function hydrateLegacy(current) {
  const local = collectSyncEntries();
  const localHash = syncEntriesHash(local);
  const meta = readMeta();
  const cloud = await readCloudState(current.$id);

  if (!cloud) return writeCloudState(current.$id, local);

  if (!meta) {
    const localEmpty = Object.keys(local).length === 0;
    const cloudEmpty = Object.keys(cloud.entries || {}).length === 0;
    if (localEmpty && !cloudEmpty) {
      applyEntries(cloud.entries, true);
      lastHash = syncEntriesHash(cloud.entries);
      writeMeta(cloud.updatedAt, lastHash);
      return;
    }
    if (!localEmpty && cloudEmpty) return writeCloudState(current.$id, local);
    if (!localEmpty && !cloudEmpty && localHash !== syncEntriesHash(cloud.entries)) {
      const merged = { ...cloud.entries, ...local };
      applyEntries(merged);
      return writeCloudState(current.$id, merged);
    }
    lastHash = localHash;
    writeMeta(cloud.updatedAt, localHash);
    return;
  }

  const localChanged = localHash !== meta.localHash;
  const cloudChanged = Number(cloud.updatedAt || 0) > Number(meta.updatedAt || 0);
  if (cloudChanged && !localChanged) {
    applyEntries(cloud.entries, true);
    lastHash = syncEntriesHash(cloud.entries);
    writeMeta(cloud.updatedAt, lastHash);
  } else if (localChanged) {
    const next = cloudChanged ? { ...cloud.entries, ...local } : local;
    if (cloudChanged) applyEntries(next);
    await writeCloudState(current.$id, next);
  } else {
    lastHash = localHash;
    writeMeta(cloud.updatedAt, localHash);
  }
}

async function hydrate(current) {
  await hydrateLegacy(current);
  try {
    await syncEntityCollections(current.$id);
    await writeCloudState(current.$id, collectLegacyEntries());
  } catch (error) {
    entitySyncReady = false;
    console.warn("Entity senkronu devreye alınamadı; güvenli legacy mod sürüyor:", error);
  }
}

function gateCopy(title, copy) {
  const h = document.querySelector("#authTitle");
  const p = document.querySelector("#authCopy");
  if (h) h.textContent = title;
  if (p) p.textContent = copy;
}

function gateBody(html) {
  const node = document.querySelector("#authBody");
  if (node) node.innerHTML = html;
}

function gateStatus(text = "", tone = "") {
  const node = document.querySelector("#authStatus");
  if (node) {
    node.textContent = text;
    node.dataset.tone = tone;
  }
}

function passwordStrong(value) {
  return String(value || "").length >= 12 &&
    /[A-Z]/.test(value) && /[a-z]/.test(value) && /[0-9]/.test(value) && /[^A-Za-z0-9]/.test(value);
}

function passwordSetup(current, oldPassword = "") {
  document.body.classList.remove("auth-pending");
  document.body.classList.add("auth-locked");
  gateCopy("Yeni şifreni oluştur.", "Bu adımdan sonra yalnız kullanıcı adı ve kendi şifrenle giriş yapacaksın.");
  gateBody(`<form class="auth-form" id="passwordSetupForm">
    <label>Yeni şifre<input id="setupPassword" type="password" autocomplete="new-password" required></label>
    <label>Şifreyi tekrar et<input id="setupPasswordAgain" type="password" autocomplete="new-password" required></label>
    <small>En az 12 karakter · büyük/küçük harf · sayı · sembol</small>
    <button type="submit">Şifreyi kaydet <span>→</span></button>
  </form>`);
  gateStatus("");

  return new Promise((resolve) => {
    document.querySelector("#passwordSetupForm")?.addEventListener("submit", async (event) => {
      event.preventDefault();
      const first = document.querySelector("#setupPassword")?.value || "";
      const second = document.querySelector("#setupPasswordAgain")?.value || "";
      if (!passwordStrong(first)) return gateStatus("Şifre güvenlik koşullarını karşılamıyor.", "error");
      if (first !== second) return gateStatus("Şifreler aynı değil.", "error");
      gateStatus("Şifre kaydediliyor…");
      try {
        const { account } = sdk();
        await account.updatePassword({ password: first, oldPassword: oldPassword || undefined });
        await account.updatePrefs({ prefs: { ...(current.prefs || {}), forcePasswordChange: false, privateWorkspace: true } });
        resolve(await account.get());
      } catch (error) {
        gateStatus(error?.message || "Şifre kaydedilemedi.", "error");
      }
    });
  });
}

function login() {
  document.body.classList.remove("auth-pending");
  document.body.classList.add("auth-locked");
  gateCopy("Kişisel alanına gir.", "Kayıt olma kapalı. Yalnız tanımlı kullanıcı bu çalışma alanını açabilir.");
  gateBody(`<form class="auth-form" id="privateLoginForm">
    <label>Kullanıcı adı<input id="privateUsername" autocomplete="username" autocapitalize="none" spellcheck="false" required></label>
    <label>Şifre<input id="privatePassword" type="password" autocomplete="current-password" required></label>
    <button type="submit">Giriş yap <span>→</span></button>
  </form>
  <details class="auth-setup"><summary>İlk kurulum kodum var</summary>
    <form class="auth-form compact" id="setupCodeForm">
      <label>Kurulum kodu<input id="privateSetupCode" inputmode="numeric" autocomplete="one-time-code" required></label>
      <button type="submit">Şifre oluştur</button>
    </form>
  </details>`);
  gateStatus("");

  return new Promise((resolve) => {
    document.querySelector("#privateLoginForm")?.addEventListener("submit", async (event) => {
      event.preventDefault();
      const username = document.querySelector("#privateUsername")?.value || "";
      const password = document.querySelector("#privatePassword")?.value || "";
      const email = usernameToEmail(username);
      if (!email) return gateStatus("Kullanıcı adı veya şifre hatalı.", "error");
      gateStatus("Giriş yapılıyor…");
      try {
        const { account } = sdk();
        await account.createEmailPasswordSession({ email, password });
        const current = await account.get();
        resolve(current?.prefs?.forcePasswordChange ? await passwordSetup(current, password) : current);
      } catch {
        gateStatus("Kullanıcı adı veya şifre hatalı.", "error");
      }
    });

    document.querySelector("#setupCodeForm")?.addEventListener("submit", async (event) => {
      event.preventDefault();
      const code = document.querySelector("#privateSetupCode")?.value?.trim() || "";
      if (!code) return;
      gateStatus("Kurulum doğrulanıyor…");
      try {
        const { account } = sdk();
        await account.createSession({ userId: CONFIG.username, secret: code });
        resolve(await passwordSetup(await account.get()));
      } catch {
        gateStatus("Kurulum kodu geçersiz veya süresi dolmuş.", "error");
      }
    });
  });
}

function installSessionUi(current) {
  const nav = document.querySelector(".site-nav");
  if (!nav || nav.querySelector("#privateLogout")) return;
  const cloud = document.createElement("span");
  cloud.id = "cloudSyncBadge";
  cloud.className = "cloud-sync-badge";
  cloud.textContent = "Bulut ✓";
  const logout = document.createElement("button");
  logout.id = "privateLogout";
  logout.className = "private-logout";
  logout.type = "button";
  logout.textContent = "Çıkış";
  logout.title = `${current?.name || CONFIG.username} oturumunu kapat`;
  logout.addEventListener("click", async () => {
    try { await syncNow(true); } catch {}
    try { await sdk().account.deleteSession({ sessionId: "current" }); } catch {}
    try { storage()?.removeItem(META_KEY); } catch {}
    location.reload();
  });
  nav.append(cloud, logout);
}

function unlock(current) {
  user = current;
  installSessionUi(current);
  document.body.classList.remove("auth-pending", "auth-locked");
  document.body.classList.add("auth-ready");
  document.querySelector("#authGate")?.setAttribute("aria-hidden", "true");
}

function schedule(delay = 700) {
  if (!user) return;
  clearTimeout(timer);
  timer = setTimeout(() => { void syncNow(); }, delay);
}

export async function syncNow(force = false) {
  if (!user || inFlight) return inFlight;
  const entries = collectSyncEntries();
  const localHash = syncEntriesHash(entries);
  if (!force && localHash === lastHash) return;
  setSyncState("syncing", "Bulut ↑", "Senkronize ediliyor");
  inFlight = (async () => {
    if (entitySyncReady) await syncEntityCollections(user.$id);
    await writeCloudState(user.$id, entitySyncReady ? collectLegacyEntries() : entries);
  })()
    .catch((error) => {
      const limit = error?.code === "SYNC_PAYLOAD_LIMIT";
      setSyncState(
        "error",
        "Bulut !",
        limit ? "Senkron sınırı aşıldı; yerel veri korunuyor" : "Bulut erişilemiyor; yerel veri korunuyor"
      );
      console.warn("Bulut senkronu:", error);
    })
    .finally(() => { inFlight = null; });
  return inFlight;
}

async function syncEntitiesOnly() {
  if (!user || inFlight || !entitySyncReady) return;
  inFlight = syncEntityCollections(user.$id)
    .then(() => {
      lastHash = syncEntriesHash(collectSyncEntries());
    })
    .catch((error) => {
      console.warn("Arka plan entity senkronu:", error);
    })
    .finally(() => { inFlight = null; });
  return inFlight;
}

function watcher() {
  globalThis.addEventListener(CHANGE_EVENT, () => schedule());
  globalThis.addEventListener("storage", (event) => { if (event.key?.startsWith(PREFIX)) schedule(200); });
  setInterval(() => {
    if (syncEntriesHash(collectSyncEntries()) !== lastHash) schedule(200);
  }, 8000);
  clearInterval(periodicTimer);
  periodicTimer = setInterval(() => {
    if (entitySyncReady && navigator.onLine !== false) void syncEntitiesOnly();
  }, 30000);
}

export async function ensurePrivateSession() {
  if (import.meta.env?.VITE_E2E_BYPASS_AUTH === "1") {
    document.body.classList.remove("auth-pending");
    document.body.classList.add("auth-ready");
    document.querySelector("#authGate")?.setAttribute("aria-hidden", "true");
    return { $id: "e2e" };
  }

  gateStatus("Oturum kontrol ediliyor…");
  let current;
  try {
    current = await sdk().account.get();
    if (current?.prefs?.forcePasswordChange) current = await passwordSetup(current);
  } catch {
    current = await login();
  }

  gateCopy("Verilerin hazırlanıyor.", "Yerel kayıtlar ve bulut durumu karşılaştırılıyor.");
  gateStatus("Senkronize ediliyor…");
  try { await hydrate(current); }
  catch (error) {
    console.warn("İlk senkron tamamlanamadı:", error);
    const limit = error?.code === "SYNC_PAYLOAD_LIMIT";
    gateStatus(
      limit ? "Bulut sınırı aşıldı; tüm kayıtlar güvenle bu cihazda tutuluyor." : "Bulut geçici olarak erişilemiyor; yerel kayıtlarla devam ediliyor.",
      "warning"
    );
    setSyncState("error", "Bulut !", limit ? "Senkron sınırı aşıldı; yerel veri korunuyor" : "Bulut erişilemiyor; yerel veri korunuyor");
  }
  lastHash = syncEntriesHash(collectSyncEntries());
  if (!document.querySelector("#authStatus")?.dataset?.tone) setSyncState("synced", "Bulut ✓", "Senkron tamamlandı");
  unlock(current);
  watcher();
  return current;
}

export const APPWRITE_CONFIG = CONFIG;
