import { chromium } from "playwright-core";

const baseUrl = process.env.E2E_BASE_URL || "http://localhost:3000";
const chromePath = process.env.CHROME_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe";

async function waitForSelectedEntity(page, expectedId) {
  await page.getByTestId("selected-entity-id").waitFor({ state: "visible" });
  await page.waitForFunction((id) => {
    const node = document.querySelector('[data-testid="selected-entity-id"]');
    return node?.textContent?.trim() === id;
  }, expectedId);
}

const browser = await chromium.launch({
  executablePath: chromePath,
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});

try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  page.setDefaultTimeout(30000);

  await page.goto(new URL("/", baseUrl).toString(), { waitUntil: "commit" });
  await page.getByText("Proof paths", { exact: true }).waitFor({ state: "visible" });

  await page.getByTestId("home-proof-path-graph").click();
  await page.waitForURL(new URL("/search?q=Q42", baseUrl).toString());
  await waitForSelectedEntity(page, "Q42");
  await page.getByTestId("graph-filters").waitFor({ state: "visible" });

  await page.goto(new URL("/", baseUrl).toString(), { waitUntil: "commit" });
  await page.getByTestId("home-proof-path-review").click();
  await page.waitForURL(new URL("/search?q=Q42&tab=review", baseUrl).toString());
  await waitForSelectedEntity(page, "Q42");

  await page.waitForFunction(() => {
    const text = document.body.innerText;
    return text.includes("Bot-ready draft exports") || text.includes("No active review flags");
  });

  console.log("PASS homepage graph proof path opens the Q42 graph workbench");
  console.log("PASS homepage evidence proof path opens the Q42 review queue");
} finally {
  await browser.close().catch(() => {});
}
