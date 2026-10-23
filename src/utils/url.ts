/**
 * Vite 的 BASE_URL 在 Astro 的 trailingSlash: 'never' 下可能不带尾斜杠
 * （例如 /sub），直接拼接会得到 /subsearch。统一通过 withBase 处理。
 */
const rawBase = import.meta.env.BASE_URL ?? "/";
const root = rawBase.replace(/\/+$/, "");

export function withBase(path = ""): string {
  const clean = path.replace(/^\/+/, "");
  return clean ? `${root}/${clean}` : `${root}/`;
}
