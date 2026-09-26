import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const appGradlePath = resolve(root, "android/app/build.gradle");
const manifestPath = resolve(root, "android/app/src/main/AndroidManifest.xml");
const colorsPath = resolve(root, "android/app/src/main/res/values/colors.xml");
const nightColorsPath = resolve(root, "android/app/src/main/res/values-night/colors.xml");
const stylesPath = resolve(root, "android/app/src/main/res/values/styles.xml");

async function replaceFile(path, transform) {
  const source = await readFile(path, "utf8");
  const next = transform(source);
  if (next !== source) await writeFile(path, next);
}

await replaceFile(appGradlePath, (source) => {
  if (source.includes('abiFilters "arm64-v8a"')) return source;
  const marker = /defaultConfig\s*\{/;
  if (!marker.test(source)) throw new Error("Android defaultConfig bulunamadı.");
  return source.replace(marker, (match) => `${match}\n        ndk {\n            abiFilters "arm64-v8a"\n        }`);
});

await replaceFile(manifestPath, (source) => {
  if (source.includes('android:windowSoftInputMode="adjustResize"')) return source;
  const mainActivity = source.indexOf('android:name=".MainActivity"');
  if (mainActivity < 0) throw new Error("MainActivity manifest içinde bulunamadı.");
  const activityStart = source.lastIndexOf("<activity", mainActivity);
  const activityEnd = source.indexOf(">", mainActivity);
  if (activityStart < 0 || activityEnd < 0) throw new Error("MainActivity etiketi çözümlenemedi.");
  const tag = source.slice(activityStart, activityEnd);
  const nextTag = `${tag}\n            android:windowSoftInputMode="adjustResize"`;
  return source.slice(0, activityStart) + nextTag + source.slice(activityEnd);
});

await replaceFile(colorsPath, (source) => source
  .replace(/<color name="colorPrimary">[^<]+<\/color>/, '<color name="colorPrimary">#1F5A43</color>')
  .replace(/<color name="colorPrimaryDark">[^<]+<\/color>/, '<color name="colorPrimaryDark">#F2EFE8</color>')
  .replace(/<color name="colorAccent">[^<]+<\/color>/, '<color name="colorAccent">#79A58A</color>'));

await mkdir(dirname(nightColorsPath), { recursive: true });
await writeFile(nightColorsPath, `<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="colorPrimary">#79A58A</color>\n    <color name="colorPrimaryDark">#11150F</color>\n    <color name="colorAccent">#9FC2A9</color>\n</resources>\n`);

await replaceFile(stylesPath, (source) => {
  let next = source.replace("Theme.AppCompat.Light.DarkActionBar", "Theme.AppCompat.DayNight.DarkActionBar");
  if (!next.includes("android:statusBarColor")) {
    next = next.replace(
      /(<style name="AppTheme"[^>]*>)/,
      `$1\n        <item name="android:statusBarColor">@color/colorPrimaryDark</item>\n        <item name="android:navigationBarColor">@color/colorPrimaryDark</item>`
    );
  }
  return next;
});

console.log("Android native config PASS: arm64-v8a, adjustResize, DayNight.");
