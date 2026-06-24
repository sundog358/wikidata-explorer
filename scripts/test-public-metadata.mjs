const baseUrl = process.env.METADATA_BASE_URL || "http://localhost:3000";

async function fetchText(path) {
  const response = await fetch(new URL(path, baseUrl));
  const body = await response.text();
  return { response, body };
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function includesAll(body, expected, label) {
  for (const item of expected) {
    assert(body.includes(item), `${label} expected ${JSON.stringify(item)}`);
  }
}

const home = await fetchText("/");
assert(home.response.status === 200, `home metadata returned ${home.response.status}`);
const expectedImagePath = "/opengraph-image";
const expectedFaviconPath = "/favicon.ico";
const expectedSiteIconPath = "/images/8sprocket.jpg";
includesAll(home.body, [
  "Wikidata Explorer | Evidence-first linked-data research",
  "Search Wikidata, inspect references and qualifiers",
  'property="og:title"',
  'property="og:description"',
  'property="og:image"',
  'property="og:image:width"',
  'property="og:image:height"',
  expectedImagePath,
  'name="twitter:card"',
  'name="twitter:image"',
  'rel="icon"',
  expectedFaviconPath,
  expectedSiteIconPath,
  'rel="canonical"',
], "home metadata");

const robots = await fetchText("/robots.txt");
assert(robots.response.status === 200, `robots.txt returned ${robots.response.status}`);
includesAll(robots.body, ["User-Agent: *", "Allow: /", "Sitemap:"], "robots.txt");

const sitemap = await fetchText("/sitemap.xml");
assert(sitemap.response.status === 200, `sitemap.xml returned ${sitemap.response.status}`);
includesAll(sitemap.body, ["<loc>", "/search", "/docs", "/about"], "sitemap.xml");

const imageResponse = await fetch(new URL(expectedImagePath, baseUrl));
assert(imageResponse.status === 200, `social preview image returned ${imageResponse.status}`);
const contentType = imageResponse.headers.get("content-type") || "";
assert(contentType.includes("image/jpeg"), `social preview image content-type was ${contentType}`);
const imageBytes = await imageResponse.arrayBuffer();
assert(imageBytes.byteLength > 1000, `social preview image was unexpectedly small: ${imageBytes.byteLength}`);

const siteIconResponse = await fetch(new URL(expectedSiteIconPath, baseUrl));
assert(siteIconResponse.status === 200, `site icon image returned ${siteIconResponse.status}`);
const siteIconType = siteIconResponse.headers.get("content-type") || "";
assert(siteIconType.includes("image/jpeg"), `site icon image content-type was ${siteIconType}`);
const siteIconBytes = await siteIconResponse.arrayBuffer();
assert(siteIconBytes.byteLength > 1000, `site icon image was unexpectedly small: ${siteIconBytes.byteLength}`);

const faviconResponse = await fetch(new URL(expectedFaviconPath, baseUrl));
assert(faviconResponse.status === 200, `favicon returned ${faviconResponse.status}`);
const faviconType = faviconResponse.headers.get("content-type") || "";
assert(faviconType.includes("image/"), `favicon content-type was ${faviconType}`);
const faviconBytes = await faviconResponse.arrayBuffer();
assert(faviconBytes.byteLength > 100, `favicon was unexpectedly small: ${faviconBytes.byteLength}`);

console.log("PASS public metadata checks");
