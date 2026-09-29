const SITE_URL = (process.env.SITE_URL || "https://suraj-portfolio-phi-six.vercel.app").replace(/\/$/, "");
const INDEXNOW_KEY = "bdc4b682ccb84e4c81619115412809a0";
const KEY_LOCATION = `${SITE_URL}/${INDEXNOW_KEY}.txt`;
const SITEMAP_URL = `${SITE_URL}/sitemap.xml`;

function decodeXml(value) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

async function fetchSitemapUrls() {
  const response = await fetch(SITEMAP_URL, {
    headers: { "user-agent": "SURAJ.WEB-IndexNow/1.0" },
  });
  if (!response.ok) throw new Error(`Sitemap request failed with ${response.status}`);

  const xml = await response.text();
  const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)]
    .map((match) => decodeXml(match[1].trim()))
    .filter((url) => {
      try {
        return new URL(url).host === new URL(SITE_URL).host;
      } catch {
        return false;
      }
    });

  return [...new Set(urls)].slice(0, 10000);
}

async function submit() {
  const urlList = await fetchSitemapUrls();
  if (!urlList.length) throw new Error("No indexable URLs found in sitemap");

  const response = await fetch("https://api.indexnow.org/IndexNow", {
    method: "POST",
    headers: { "content-type": "application/json; charset=utf-8" },
    body: JSON.stringify({
      host: new URL(SITE_URL).host,
      key: INDEXNOW_KEY,
      keyLocation: KEY_LOCATION,
      urlList,
    }),
  });

  if (![200, 202].includes(response.status)) {
    const body = await response.text().catch(() => "");
    throw new Error(`IndexNow returned ${response.status}: ${body.slice(0, 300)}`);
  }

  console.log(`IndexNow accepted ${urlList.length} URLs with status ${response.status}.`);
}

submit().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
