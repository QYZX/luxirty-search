import type { APIRoute } from "astro";
import { withBase } from "@/utils/url";

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

export const GET: APIRoute = () => {
  const shortName =
    import.meta.env.OPEN_SEARCH_SHORT_NAME ?? "Luxirty Search";
  const siteUrl =
    import.meta.env.SITE_URL ?? "https://search.luxirty.com";
  const urlTemplateBase = (
    import.meta.env.OPEN_SEARCH_URL_BASE ?? siteUrl
  ).replace(/\/+$/, "");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<OpenSearchDescription xmlns="http://a9.com/-/spec/opensearch/1.1/" xmlns:moz="http://www.mozilla.org/2006/browser/search/">
<ShortName>${escapeXml(shortName)}</ShortName>
<Description>${escapeXml(shortName)}</Description>
<InputEncoding>UTF-8</InputEncoding>
<Image width="16" height="16" type="image/x-icon">${withBase("favicon.ico")}</Image>
<Url type="text/html" method="get" template="${escapeXml(urlTemplateBase)}/search?q={searchTerms}"/>
<moz:SearchForm>${withBase("search")}</moz:SearchForm>
</OpenSearchDescription>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
    },
  });
};
