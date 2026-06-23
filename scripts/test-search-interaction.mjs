import { chromium } from "playwright-core";

const baseUrl = process.env.E2E_BASE_URL || "http://localhost:3000";
const chromePath = process.env.CHROME_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe";

const browser = await chromium.launch({
  executablePath: chromePath,
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});

try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  page.setDefaultTimeout(30000);

  await page.goto(new URL("/search?q=Q42", baseUrl).toString(), {
    waitUntil: "commit",
  });

  await page.getByTestId("selected-entity-id").waitFor({ state: "visible" });
  const initialEntity = await page.getByTestId("selected-entity-id").innerText();

  if (initialEntity.trim() !== "Q42") {
    throw new Error(`Expected Q42 to be selected initially, got ${initialEntity}`);
  }

  await page.getByTestId("graph-filters").waitFor({ state: "visible" });
  await page.getByLabel("Target type").selectOption("item");
  const filterSummary = await page.getByTestId("graph-filter-summary").innerText();
  if (!filterSummary.includes("Showing")) {
    throw new Error(`Expected graph filter summary after item filter, got ${filterSummary}`);
  }

  const graphTarget = page
    .locator('button[title*="human"]')
    .filter({ hasText: "Q5" })
    .first();

  await graphTarget.click();
  await page.getByTestId("selected-entity-id").waitFor({ state: "visible" });
  await page.waitForFunction(() => {
    const node = document.querySelector('[data-testid="selected-entity-id"]');
    return node?.textContent?.trim() === "Q5";
  });

  const selectedEntity = await page.getByTestId("selected-entity-id").innerText();
  if (selectedEntity.trim() !== "Q5") {
    throw new Error(`Expected graph click to select Q5, got ${selectedEntity}`);
  }

  await page.goto(new URL("/search?q=P31", baseUrl).toString(), {
    waitUntil: "commit",
  });
  await page.waitForFunction(() => {
    const node = document.querySelector('[data-testid="selected-entity-id"]');
    return node?.textContent?.trim() === "P31";
  });

  const selectedProperty = await page.getByTestId("selected-entity-id").innerText();
  if (selectedProperty.trim() !== "P31") {
    throw new Error(`Expected direct PID lookup to select P31, got ${selectedProperty}`);
  }

  console.log("PASS search graph filters keep Q5 reachable from Q42");
  console.log("PASS search graph interaction selects Q5 from Q42");
  console.log("PASS direct PID lookup selects P31");
} finally {
  await browser.close().catch(() => {});
}