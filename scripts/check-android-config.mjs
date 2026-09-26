import { readFile } from "node:fs/promises";

const config = JSON.parse(await readFile(new URL("../capacitor.config.json", import.meta.url), "utf8"));
const workflow = await readFile(new URL("../.github/workflows/android-apk.yml", import.meta.url), "utf8");
const nativeScript = await readFile(new URL("./configure-android.mjs", import.meta.url), "utf8");

if (config.appId !== "com.alihaydargenc.notlar") throw new Error("Android appId beklenen değer değil.");
if (config.webDir !== "dist") throw new Error("Capacitor webDir dist olmalı.");
if (config.server?.hostname !== "localhost") throw new Error("Capacitor hostname localhost olmalı.");
if (!workflow.includes("@capacitor/android@8")) throw new Error("Android workflow Capacitor 8 kullanmalı.");
if (!workflow.includes("assembleDebug")) throw new Error("Android workflow APK üretmiyor.");
if (!nativeScript.includes('abiFilters "arm64-v8a"')) throw new Error("arm64-v8a hedefi eksik.");
if (!nativeScript.includes('android:windowSoftInputMode="adjustResize"')) throw new Error("Mobil klavye adjustResize ayarı eksik.");

console.log("Android config PASS: Notlar / arm64-v8a / Capacitor 8.");
