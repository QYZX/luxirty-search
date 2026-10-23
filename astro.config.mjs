import { defineConfig } from "astro/config";
import vue from "@astrojs/vue";
import { loadEnv } from "vite";
import { fileURLToPath, URL } from "node:url";

const env = loadEnv(process.env.NODE_ENV ?? "production", process.cwd(), "");

/** 归一化为 Astro 要求的 / 或 /sub/ 形式 */
function normalizeBase(value = "/") {
  if (!value || value === "/" || value === "./") {
    return "/";
  }
  return `/${value.replace(/^\/+|\/+$/g, "")}/`;
}

if (!env.PUBLIC_GOOGLE_CSE_CX) {
  console.warn(
    "[luxirty-search] 未设置 PUBLIC_GOOGLE_CSE_CX，构建产物中的搜索框将无法工作。",
  );
}

// https://astro.build/config
export default defineConfig({
  site: env.SITE_URL || "https://search.luxirty.com",
  base: normalizeBase(env.BASE_PATH),
  integrations: [vue()],
  // /search -> search.html，保持无尾斜杠的干净 URL
  build: { format: "file" },
  trailingSlash: "never",
  vite: {
    envPrefix: ["PUBLIC_"],
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
      },
    },
  },
});
