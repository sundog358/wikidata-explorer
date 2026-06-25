import { chromium } from "playwright-core";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { fixtureEntities, fixtureSearchWikidata } from "./fixtures/wikidata-fixtures.mjs";

const baseUrl = process.env.E2E_BASE_URL || "http://localhost:3000";
const chromePath = process.env.CHROME_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe";

function registryFromFixtures() {
  const registry = new Map();

  function add(id, label, description = "") {
    if (!/^[PQ]\d+$/.test(String(id || ""))) return;
    const current = registry.get(id) || {};
    registry.set(id, {
      label: label || current.label || id,
      description: description || current.description || `Fixture term for ${label || id}`,
    });
  }

  for (const entity of Object.values(fixtureEntities)) {
    add(entity.id, entity.labels.en, entity.descriptions.en);
    for (const statements of Object.values(entity.statements || {})) {
      for (const statement of statements) {
        add(statement.property.id, statement.property.label, `Fixture property ${statement.property.id}`);
        add(statement.value.content?.id, statement.value.content?.label);
        for (const qualifier of statement.qualifiers || []) {
          add(qualifier.property.id, qualifier.property.label, `Fixture property ${qualifier.property.id}`);
          add(qualifier.value.content?.id, qualifier.value.content?.label);
        }
        for (const reference of statement.references || []) {
          for (const part of reference.parts || []) {
            add(part.property.id, part.property.label, `Fixture property ${part.property.id}`);
            add(part.value.content?.id, part.value.content?.label);
          }
        }
      }
    }
  }

  return registry;
}

const termRegistry = registryFromFixtures();
const fixtureLanguages = {
  en: { code: "en", name: "English" },
  fr: { code: "fr", name: "French" },
};
const fixtureCommonsMedia = {
  "File:Douglas adams portrait cropped.jpg": {
    mediatype: "BITMAP",
    mime: "image/jpeg",
    url: "https://upload.wikimedia.org/wikipedia/commons/fixture/Douglas_adams_portrait_cropped.jpg",
    size: 424242,
    width: 640,
    height: 420,
  },
};

function rawTerm(language, value) {
  return { language, value };
}

function rawLanguageMap(values = {}) {
  return Object.fromEntries(Object.entries(values).map(([language, value]) => [language, rawTerm(language, value)]));
}

function rawAliases(values = {}) {
  return Object.fromEntries(
    Object.entries(values).map(([language, aliases]) => [
      language,
      aliases.map((value) => rawTerm(language, value)),
    ]),
  );
}

function datavalueFromNormalized(value = {}) {
  const content = value.content || {};
  if (content.id) return { type: "wikibase-entityid", value: { id: content.id } };
  if (content.time) return { type: "time", value: { time: content.time, precision: content.precision || 11 } };
  return { type: value.type || "string", value: content.value ?? "" };
}

function rawSnak(property, value) {
  return {
    snaktype: "value",
    property: property.id,
    datatype: property.data_type || value?.type || "string",
    datavalue: datavalueFromNormalized(value),
  };
}

function groupSnaks(parts = []) {
  const grouped = {};
  for (const part of parts) {
    grouped[part.property.id] = grouped[part.property.id] || [];
    grouped[part.property.id].push(rawSnak(part.property, part.value));
  }
  return grouped;
}

function rawClaims(statements = {}) {
  return Object.fromEntries(
    Object.entries(statements).map(([propertyId, rows]) => [
      propertyId,
      rows.map((statement) => ({
        id: statement.id,
        rank: statement.rank || "normal",
        mainsnak: rawSnak(statement.property, statement.value),
        qualifiers: groupSnaks(statement.qualifiers || []),
        references: (statement.references || []).map((reference) => ({
          hash: reference.hash,
          snaks: groupSnaks(reference.parts || []),
        })),
      })),
    ]),
  );
}

function fixtureOrTermEntity(id) {
  const fixture = fixtureEntities[id];
  if (fixture) return fixture;

  const term = termRegistry.get(id) || { label: id, description: `Fixture term for ${id}` };
  return {
    id,
    type: id.startsWith("P") ? "property" : "item",
    labels: { en: term.label },
    descriptions: { en: term.description },
    aliases: { en: [] },
    sitelinks: {},
    statements: {},
  };
}

function rawEntity(id, props = "") {
  if (id === "Q999999999") {
    return {
      id,
      missing: true,
    };
  }

  const entity = fixtureOrTermEntity(id);
  const raw = {
    id: entity.id,
    type: entity.type,
    title: entity.id,
  };

  if (props.includes("labels")) raw.labels = rawLanguageMap(entity.labels);
  if (props.includes("descriptions")) raw.descriptions = rawLanguageMap(entity.descriptions);
  if (props.includes("aliases")) raw.aliases = rawAliases(entity.aliases);
  if (props.includes("sitelinks")) raw.sitelinks = entity.sitelinks;
  if (props.includes("claims")) raw.claims = rawClaims(entity.statements);

  return raw;
}

function wikidataApiResponse(url) {
  const params = url.searchParams;
  const action = params.get("action");

  if (action === "query" && params.get("meta") === "wbcontentlanguages") {
    return {
      query: {
        wbcontentlanguages: fixtureLanguages,
      },
    };
  }

  if (action === "wbsearchentities") {
    return {
      search: fixtureSearchWikidata(params.get("search")).map((entity) => ({
        id: entity.id,
        title: entity.id,
        label: entity.labels.en,
        description: entity.descriptions.en,
        aliases: entity.aliases.en,
      })),
    };
  }

  if (action === "wbgetentities") {
    const props = params.get("props") || "labels";
    const ids = (params.get("ids") || "").split("|").filter(Boolean);
    return {
      entities: Object.fromEntries(ids.map((id) => [id, rawEntity(id, props)])),
    };
  }

  return {};
}

export async function installFixtureRoutes(page, options = {}) {
  const wikidataOutageActions = new Set(options.wikidataOutageActions || []);

  await page.route("https://www.wikidata.org/w/api.php?**", async (route) => {
    const url = new URL(route.request().url());
    const action = url.searchParams.get("action");

    if (wikidataOutageActions.has(action)) {
      await route.fulfill({
        status: 503,
        contentType: "application/json",
        body: JSON.stringify({ error: { info: "Fixture Wikidata outage" } }),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(wikidataApiResponse(url)),
    });
  });

  await page.route("https://commons.wikimedia.org/w/api.php?**", async (route) => {
    if (options.commonsOutage) {
      await route.fulfill({
        status: 503,
        contentType: "application/json",
        body: JSON.stringify({ error: { info: "Fixture Commons outage" } }),
      });
      return;
    }

    const url = new URL(route.request().url());
    const titles = (url.searchParams.get("titles") || "").split("|").filter(Boolean);
    const pages = Object.fromEntries(
      titles.map((title, index) => [
        String(index + 1),
        {
          pageid: index + 1,
          ns: 6,
          title,
          imageinfo: fixtureCommonsMedia[title] ? [fixtureCommonsMedia[title]] : [],
        },
      ]),
    );

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ query: { pages } }),
    });
  });
}

async function assertWikidataOutageStates(browser) {
  const searchOutagePage = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  searchOutagePage.setDefaultTimeout(30000);
  await installFixtureRoutes(searchOutagePage, { wikidataOutageActions: ["wbsearchentities"] });
  await searchOutagePage.goto(new URL("/search?q=Douglas", baseUrl).toString(), {
    waitUntil: "commit",
  });
  await searchOutagePage.getByText("Search failed: Service Unavailable").waitFor({ state: "visible" });
  await searchOutagePage.close();

  const entityOutagePage = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  entityOutagePage.setDefaultTimeout(30000);
  await installFixtureRoutes(entityOutagePage, { wikidataOutageActions: ["wbgetentities"] });
  await entityOutagePage.goto(new URL("/search?q=Q42", baseUrl).toString(), {
    waitUntil: "commit",
  });
  await entityOutagePage.getByText("Failed to fetch entity Q42: Service Unavailable").waitFor({ state: "visible" });
  await entityOutagePage.close();
}

async function assertMetadataOutageStates(browser) {
  const commonsOutagePage = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  commonsOutagePage.setDefaultTimeout(30000);
  await installFixtureRoutes(commonsOutagePage, { commonsOutage: true });
  await commonsOutagePage.goto(new URL("/search?q=Q42", baseUrl).toString(), {
    waitUntil: "commit",
  });
  await commonsOutagePage.getByTestId("selected-entity-id").waitFor({ state: "visible" });
  await commonsOutagePage.getByRole("tab", { name: /Media/ }).click();
  await commonsOutagePage.getByText("Commons media metadata could not be loaded. Try again later.").waitFor({ state: "visible" });
  await commonsOutagePage.close();

  const languageOutagePage = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  languageOutagePage.setDefaultTimeout(30000);
  await installFixtureRoutes(languageOutagePage, { wikidataOutageActions: ["query"] });
  await languageOutagePage.goto(new URL("/search?q=Q42", baseUrl).toString(), {
    waitUntil: "commit",
  });
  await languageOutagePage.getByTestId("selected-entity-id").waitFor({ state: "visible" });
  await languageOutagePage.getByRole("tab", { name: /Languages/ }).click();
  const languagePanel = await languageOutagePage.getByRole("tabpanel").filter({ hasText: "Douglas Adams" }).first().innerText();
  if (!languagePanel.includes("en") || !languagePanel.includes("fr") || !languagePanel.includes("Douglas Adams")) {
    throw new Error(`Expected language outage to fall back to language codes, got ${languagePanel}`);
  }
  await languageOutagePage.close();
}

async function runFixtureFlow() {
  const browser = await chromium.launch({
    executablePath: chromePath,
    headless: true,
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });

  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    page.setDefaultTimeout(30000);
    await installFixtureRoutes(page);

    await page.goto(new URL("/search?q=Q42&tab=graph&gdepth=property&gprop=P31", baseUrl).toString(), {
      waitUntil: "commit",
    });

    await page.getByTestId("selected-entity-id").waitFor({ state: "visible" });
    const selectedEntity = (await page.getByTestId("selected-entity-id").innerText()).trim();
    if (selectedEntity !== "Q42") {
      throw new Error(`Expected fixture route to select Q42, got ${selectedEntity}`);
    }

    await page.getByTestId("graph-node-Q5").waitFor({ state: "visible" });
    const q5AccessibleName = await page.getByTestId("graph-node-Q5").getAttribute("aria-label");
    if (!q5AccessibleName?.includes("human (Q5)") || !q5AccessibleName.includes("instance of (P31)")) {
      throw new Error(`Expected mocked Q42 graph to expose Q5 instance-of context, got ${q5AccessibleName}`);
    }

    const graphSummary = await page.getByTestId("graph-filter-summary").innerText();
    if (!graphSummary.includes("Douglas Adams")) {
      throw new Error(`Expected fixture graph summary to mention Douglas Adams, got ${graphSummary}`);
    }

    await page.getByRole("tab", { name: /Media/ }).click();
    await page.getByText("File:Douglas adams portrait cropped.jpg").waitFor({ state: "visible" });
    const mediaPanel = await page.getByRole("tabpanel").filter({ hasText: "image/jpeg" }).first().innerText();
    if (!mediaPanel.includes("image/jpeg")) {
      throw new Error(`Expected mocked Commons media to render image metadata, got ${mediaPanel}`);
    }

    await page.getByRole("tab", { name: /Languages/ }).click();
    const languagesPanel = await page.getByRole("tabpanel").filter({ hasText: "French" }).first().innerText();
    if (!languagesPanel.includes("English") || !languagesPanel.includes("French") || !languagesPanel.includes("Douglas Adams")) {
      throw new Error(`Expected mocked language metadata to render English and French rows, got ${languagesPanel}`);
    }

    await page.getByRole("tab", { name: /Compare/ }).click();
    await page.getByTestId("comparison-panel").getByRole("button", { name: "Compare" }).click();
    await page.getByTestId("comparison-summary").waitFor({ state: "visible" });
    const comparisonJson = JSON.parse(await page.getByTestId("comparison-json-export").inputValue());
    if (comparisonJson.source.id !== "Q42" || comparisonJson.target.id !== "Q80" || comparisonJson.summary.sharedPropertyCount !== 2) {
      throw new Error(`Expected fixture comparison JSON for Q42/Q80 with two shared properties, got ${JSON.stringify(comparisonJson)}`);
    }

    await page.goto(new URL("/search?q=P31", baseUrl).toString(), {
      waitUntil: "commit",
    });
    await page.waitForFunction(() => document.querySelector('[data-testid="selected-entity-id"]')?.textContent?.trim() === "P31");

    await page.goto(new URL("/search?q=NoSuchFixtureTerm", baseUrl).toString(), {
      waitUntil: "commit",
    });
    await page.getByText("No Wikidata entities matched that search.").waitFor({ state: "visible" });

    await page.goto(new URL("/search?q=Q999999999", baseUrl).toString(), {
      waitUntil: "commit",
    });
    await page.getByText("No Wikidata entity found for Q999999999").waitFor({ state: "visible" });

    await assertWikidataOutageStates(browser);
    await assertMetadataOutageStates(browser);

    console.log("PASS fixture-backed search selects Q42 without live Wikidata");
    console.log("PASS fixture-backed graph renders Q42 instance-of context");
    console.log("PASS fixture-backed Commons media renders image metadata");
    console.log("PASS fixture-backed language metadata renders labels");
    console.log("PASS fixture-backed comparison exports Q42/Q80 JSON");
    console.log("PASS fixture-backed direct PID lookup selects P31");
    console.log("PASS fixture-backed empty search shows no-result error");
    console.log("PASS fixture-backed missing entity shows not-found error");
    console.log("PASS fixture-backed Wikidata outage states show search and entity errors");
    console.log("PASS fixture-backed Commons and language outage states stay usable");
  } finally {
    await browser.close().catch(() => {});
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  await runFixtureFlow();
}
