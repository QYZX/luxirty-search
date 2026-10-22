import type { APIRoute } from "astro";

export const GET: APIRoute = () => {
  const shortName = import.meta.env.OPEN_SEARCH_SHORT_NAME ?? "Luxirty Search";
  const urlTemplateBase =
    import.meta.env.OPEN_SEARCH_URL_BASE ?? "https://search.luxirty.com";

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<OpenSearchDescription xmlns="http://a9.com/-/spec/opensearch/1.1/" xmlns:moz="http://www.mozilla.org/2006/browser/search/">
<ShortName>${shortName}</ShortName>
<Description>${shortName}</Description>
<InputEncoding>UTF-8</InputEncoding>
<Image width="16" height="16" type="image/x-icon">/favicon.ico</Image>
<Url type="text/html" method="get" template="${urlTemplateBase}/search?q={searchTerms}"/>
<moz:SearchForm>/search</moz:SearchForm>
</OpenSearchDescription>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
    },
  });
};
