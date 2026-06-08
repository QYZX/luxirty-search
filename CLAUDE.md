# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目简介

Luxirty Search — 基于 Google CSE (Custom Search Engine) 的搜索引擎前端。内置内容农场屏蔽、广告追踪移除，无广告无跟踪。

## 开发命令

```sh
pnpm install          # 安装依赖
pnpm dev              # 本地开发（热重载）
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

Docker 构建使用多阶段：`node:20-slim` 构建 → `nginx:stable-alpine` 运行。配置文件见 `conf/nginx.conf`。

## 环境变量

通过 `.env` 文件或构建时传入（Vite 原生支持）：

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `VITE_GOOGLE_CSE_CX` | Google CSE 引擎 ID（必填） | 项目默认值 |
| `VITE_BASE_URL` | 部署基础路径 | `./` |
| `VITE_OPEN_SEARCH_ShortName` | OpenSearch 短名称 | Luxirty Search |
| `VITE_OPEN_SEARCH_UrlTemplateBase` | OpenSearch URL 基础 | https://search.luxirty.com |

若要使用自己的 CSE，在 https://programmablesearchengine.google.com/about/ 创建后设置 `VITE_GOOGLE_CSE_CX`，同时需要配置标签（Refinement Labels）以实现"For Program"功能。

## 项目架构

高度简化的 Vue 3 + Vite 项目，核心依赖只有 `vue` 和 `vue-router`。

### 目录结构

```
/
├── src/
│   ├── main.js                   # 入口：创建 Vue 实例、注册 Service Worker
│   ├── App.vue                   # 根组件，仅包含 <RouterView />
│   ├── router/index.js           # 路由：/ (Home) 和 /search (Results)
│   ├── components/
│   │   ├── Home.vue              # 首页：Logo + 搜索框 + 页脚
│   │   └── Results.vue           # 搜索结果页：搜索框 + Google CSE 结果 + 页脚
│   └── assets/
│       ├── base.css              # 全局 CSS 变量（亮/暗主题色）
│       └── main.css              # Google CSE 样式覆盖（核心 UI 定制）
├── public/
│   ├── service-worker.js         # 广告请求拦截（拦截 adsense 请求）
│   ├── opensearch.bak.xml        # OpenSearch 描述文件备份
│   └── _redirects                # Netlify SPA 路由重定向（所有路径 → /）
├── scripts/
│   └── vite-plugin-generate-opensearch.js  # Vite 插件：构建时生成 opensearch.xml
├── conf/
│   └── nginx.conf                # Docker Nginx 配置（SPA fallback）
├── docs/
│   └── block_list.txt            # 内容农场屏蔽域名列表
├── index.html                    # HTML 模板（注入 Google CSE script）
├── vite.config.js                # Vite 配置
├── vercel.json                   # Vercel SPA 路由重写
├── Dockerfile                    # 多阶段 Docker 构建
└── .github/workflows/
    ├── main.yml                  # CI：Docker 多架构构建并推送到 ghcr.io
    └── sync.yml                  # Fork 同步：每 6 小时同步上游仓库
```

### 核心架构要点

1. **Google CSE 驱动的搜索**：搜索功能完全依赖 Google CSE 的 JS SDK。首页加载 `cse.js` 后，Google 会自动渲染搜索框和结果。项目通过 `data-resultsUrl="search"` 配置将结果页指向 `/search`。

2. **内容农场屏蔽机制**：不是在前端（如 uBlacklist）过滤结果，而是通过 Google CSE 后台的 Annotations 配置直接在 Google 端屏蔽。`docs/block_list.txt` 记录了当前屏蔽的域名名单。

3. **广告拦截**：通过 Service Worker (`public/service-worker.js`) 在浏览器端拦截所有包含 `adsense` 的请求，返回 204 空响应。

4. **For Program 标签**：利用 Google CSE 的 Refinement Labels 功能，一键提升 GitHub、StackOverflow 等优质来源的权重。标签由 Google CSE 控制台配置，前端通过 `data-refinementStyle="link"` 渲染为可点击标签。

5. **样式覆盖**：`main.css` 中大量使用 `!important` 覆盖 Google CSE 的默认样式，实现统一的暗黑模式、响应式布局、自定义颜色主题。CSS 变量定义在 `base.css` 中。

### 路由

两条路由 — `vue-router` history 模式：
- `/` → Home.vue（搜索首页）
- `/search?q=xxx` → Results.vue（搜索结果页）

### 部署注意事项

- **SPA history 路由 fallback**：Vercel 用 `vercel.json` 的 rewrites、Netlify 用 `public/_redirects`、Docker/Nginx 用 `conf/nginx.conf` 的 `try_files` 均需将所有路径指向 `index.html`。
- **Google CSE script** 加载是异步的，在 Home 和 Results 组件各自的 `mounted` 钩子中动态插入 `<script>` 标签。
