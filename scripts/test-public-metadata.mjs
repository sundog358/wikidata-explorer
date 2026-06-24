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

console.log("PASS public metadata checks");