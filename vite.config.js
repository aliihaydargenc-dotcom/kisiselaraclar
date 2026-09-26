import { defineConfig } from "vite";

function normalizeBasePath(value = "/") {
  let base = String(value || "/").trim() || "/";
  if (!base.startsWith("/")) base = `/${base}`;
  if (!base.endsWith("/")) base = `${base}/`;
  return base;
}

const capacitorBuild = process.env.CAPACITOR_BUILD === "1";

export default defineConfig({
  base: capacitorBuild ? "./" : normalizeBasePath(process.env.BASE_PATH || "/"),
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (
            id.includes("/node_modules/appwrite/") ||
            id.includes("/node_modules/json-bigint/") ||
            id.includes("/node_modules/bignumber.js/")
          ) return "appwrite-vendor";
        }
      }
    }
  }
});
