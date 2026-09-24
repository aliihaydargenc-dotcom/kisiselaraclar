import { defineConfig } from "vite";

function normalizeBasePath(value = "/") {
  let base = String(value || "/").trim() || "/";
  if (!base.startsWith("/")) base = `/${base}`;
  if (!base.endsWith("/")) base = `${base}/`;
  return base;
}

export default defineConfig({
  base: normalizeBasePath(process.env.BASE_PATH || "/")
});
