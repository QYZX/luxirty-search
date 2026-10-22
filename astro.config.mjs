import { defineConfig } from "astro/config";
import vue from "@astrojs/vue";
import { loadEnv } from "vite";
import { fileURLToPath, URL } from "node:url";

const env = loadEnv(process.env.NODE_ENV ?? "production", process.cwd(), "");

// https://astro.build/config
export default defineConfig({
  site: "https://search.luxirty.com",
  // 必须是 / 或 /sub/，不能是相对路径。子路径部署时设置 BASE_PATH=/sub/
  base: env.BASE_PATH || "/",
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
