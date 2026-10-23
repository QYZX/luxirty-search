import type { APIRoute } from "astro";
import { withBase } from "@/utils/url";

export const GET: APIRoute = () => {
  const searchPath = withBase("search");
  const body = `User-agent: *
Allow: /

# 搜索结果页是动态查询，避免被索引
Disallow: ${searchPath}
`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
};
