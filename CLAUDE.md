# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目简介

Luxirty Search — 基于 Google CSE (Custom Search Engine) 的搜索引擎前端。内置内容农场屏蔽、广告追踪移除，无广告无跟踪。

技术栈：**Astro 7（静态输出）+ Vue 3（按需 Islands）**。页面在构建时输出为静态 HTML，Google CSE 在浏览器端完成搜索 UI 和结果渲染；Vue 仅在需要交互的组件中使用。

## 开发命令

```sh
pnpm install          # 安装依赖
pnpm dev              # 本地开发（Astro dev server，热重载）
pnpm build            # 生产构建，产物输出到 dist/
pnpm preview          # 预览生产构建
```

生产构建产物在 `dist/` 目录，可直接部署到任意静态托管。

## Docker

```sh
# 构建
docker build -t luxirty-search .

# 运行（默认 80 端口）
docker run --rm -p 80:80 ghcr.io/koriiku/luxirty-search
```

Docker 构建使用多阶段：`node:26-slim` 构建 → `nginx:stable-alpine` 运行。配置文件见 `conf/nginx.conf`。

## 环境变量

通过 `.env` 文件或构建时传入：

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `PUBLIC_GOOGLE_CSE_CX` | Google CSE 引擎 ID（必填，会暴露给浏览器） | 项目默认值 |
| `BASE_PATH` | 部署基础路径，必须是 `/` 或 `/sub/` | `/` |
| `OPEN_SEARCH_SHORT_NAME` | OpenSearch 短名称（仅构建期） | Luxirty Search |
| `OPEN_SEARCH_URL_BASE` | OpenSearch URL 基础（仅构建期） | https://search.luxirty.com |

- 只有 `PUBLIC_` 前缀的变量会进入客户端产物；`OPEN_SEARCH_*` 只在构建时由 endpoint 读取。
- 若要使用自己的 CSE，在 https://programmablesearchengine.google.com/about/ 创建后设置 `PUBLIC_GOOGLE_CSE_CX`，同时需要配置标签（Refinement Labels）以实现 "For Program" 功能。

## 项目架构

Astro 负责路由、HTML 壳、SEO 和静态资源；Google CSE 负责全部搜索 UI；Vue 只在需要客户端状态时作为 island 加载。

### 目录结构

```
/
├── src/
│   ├── layouts/
│   │   └── BaseLayout.astro      # html/head、全局 CSS、#app 容器、SW 注册
│   ├── pages/
│   │   ├── index.astro           # 首页 /
│   │   ├── search.astro          # 结果页 /search?q=xxx
│   │   └── opensearch.xml.ts     # 构建时生成 /opensearch.xml
│   ├── components/
│   │   ├── HomeHero.astro        # 首页：Logo + 搜索框
│   │   ├── SearchPage.astro      # 结果页：搜索框 + CSE 结果容器
│   │   └── Footer.astro          # 共用页脚（home / results 两种样式）
│   └── styles/
│       ├── base.css              # 全局 CSS 变量（亮/暗主题色）
│       └── main.css              # Google CSE 样式覆盖（核心 UI 定制）
├── public/
│   ├── service-worker.js         # 广告请求拦截（拦截 adsense 请求）
│   ├── opensearch.bak.xml        # OpenSearch 描述文件备份
│   └── favicon.ico
├── conf/
│   └── nginx.conf                # Docker Nginx 配置（try_files 支持 /search）
├── docs/
│   └── block_list.txt            # 内容农场屏蔽域名列表
├── astro.config.mjs              # Astro 配置（base、file 输出格式、Vue 集成）
├── tsconfig.json
├── vercel.json                   # Vercel cleanUrls 配置
├── Dockerfile                    # 多阶段 Docker 构建
└── .github/workflows/
    ├── main.yml                  # CI：Docker 多架构构建并推送到 ghcr.io
    └── sync.yml                  # Fork 同步：每 6 小时同步上游仓库
```

### 核心架构要点

1. **Google CSE 驱动搜索**：搜索 UI 完全由 Google CSE 的 JS SDK 渲染。CSE `<script>` 必须放在 `.gcse-*` 容器之后（页面底部），且每个页面只加载一次。

2. **CSE 容器不要放进 Vue 岛**：Google 会向 `.gcse-searchresults` 等容器注入 DOM。如果把容器放进需要 hydration 的 Vue 组件，Vue 会把 Google 注入的节点当成多余 DOM 删除。CSE 容器始终由 Astro 静态输出；Vue 岛只放在容器旁边。

3. **结果页回调**：`src/pages/search.astro` 在 `<head>` 中用 `is:inline` 脚本注册 `window.__gcse.searchCallbacks.web.rendered`，用于移除 `data-cturl` / `data-ctorig` 并更新 `document.title`。该脚本必须出现在 `cse.js` 之前。

4. **内容农场屏蔽机制**：不是在前端（如 uBlacklist）过滤结果，而是通过 Google CSE 后台的 Annotations 配置直接在 Google 端屏蔽。`docs/block_list.txt` 记录了当前屏蔽的域名名单。

5. **广告拦截**：通过 Service Worker (`public/service-worker.js`) 在浏览器端拦截所有包含 `adsense` 的请求，返回 204 空响应。

6. **For Program 标签**：利用 Google CSE 的 Refinement Labels 功能，一键提升 GitHub、StackOverflow 等优质来源的权重。标签由 Google CSE 控制台配置，前端通过 `data-refinementStyle="link"` 渲染为可点击标签。

7. **样式覆盖**：`src/styles/main.css` 中大量使用 `!important` 覆盖 Google CSE 的默认样式。**这些选择器必须保持全局样式**（在 `BaseLayout.astro` 中 import），放进 Astro scoped `<style>` 会附加 `data-astro-*` 属性导致失效。

8. **`is:inline` 脚本不会经过 Vite 处理**：脚本内的 `import.meta.env` 不会被替换。需要构建期变量时使用 `define:vars`（如 `search.astro` 中的 `base`），或直接拼进模板属性。

### 路由与输出

`build.format: 'file'` + `trailingSlash: 'never'`：

- `/` → `dist/index.html`
- `/search?q=xxx` → `dist/search.html`
- `/opensearch.xml` → 构建时由 `src/pages/opensearch.xml.ts` 生成

### 部署注意事项

- **Nginx**：`try_files $uri $uri.html $uri/ /404.html;`，让 `/search` 命中 `search.html`。不再使用 SPA fallback。
- **Vercel**：使用 `cleanUrls: true`，不要写 `/(.*) -> /` 的 catch-all rewrite，否则 `/search` 会被改写回首页。
- **Netlify**：默认 pretty URLs 即可，不需要 SPA `_redirects`。
- **Service Worker**：`public/service-worker.js` 必须部署在站点根路径，才能获得根作用域。
- **Vue 岛**：需要交互组件时使用 `<Component client:load />`；没有岛时不会向浏览器加载 Vue runtime。
