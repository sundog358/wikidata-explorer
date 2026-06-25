import { chromium } from "playwright-core";

const baseUrl = process.env.PERF_BASE_URL || "http://localhost:3000";
const chromePath = process.env.CHROME_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe";

const budgets = {
  q42ReadyMs: Number(process.env.PERF_Q42_READY_MS || 15000),
  graphReadyMs: Number(process.env.PERF_GRAPH_READY_MS || 20000),
  graphNodeCount: Number(process.env.PERF_GRAPH_NODE_COUNT || 24),
  domNodeCount: Number(process.env.PERF_DOM_NODE_COUNT || 3500),
};

function assertBudget(name, actual, max) {
  if (actual > max) {
    throw new Error(`${name} exceeded budget: ${actual} > ${max}`);
  }
}

const browser = await chromium.launch({
  executablePath: chromePath,
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});

try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  page.setDefaultTimeout(Math.max(budgets.graphReadyMs, budgets.q42ReadyMs) + 5000);

  const startedAt = Date.now();
  await page.goto(new URL("/search?q=Q42", baseUrl).toString(), {
    waitUntil: "commit",
  });

  await page.getByTestId("selected-entity-id").waitFor({ state: "visible" });
  const selectedEntity = (await page.getByTestId("selected-entity-id").innerText()).trim();
  if (selectedEntity !== "Q42") {
    throw new Error(`Expected Q42 to be selected for performance budget, got ${selectedEntity}`);
  }
  const q42ReadyMs = Date.now() - startedAt;

  await page.getByTestId("graph-filters").waitFor({ state: "visible" });
  await page.getByTestId("graph-node-Q5").first().waitFor({ state: "visible" });
  const graphReadyMs = Date.now() - startedAt;

  const graphNodeCount = await page.locator('[data-testid^="graph-node-"]').count();
  const domNodeCount = await page.evaluate(() => document.querySelectorAll("*").length);

  assertBudget("Q42 ready time", q42ReadyMs, budgets.q42ReadyMs);
  assertBudget("Q42 graph ready time", graphReadyMs, budgets.graphReadyMs);
  assertBudget("graph node count", graphNodeCount, budgets.graphNodeCount);
  assertBudget("DOM node count", domNodeCount, budgets.domNodeCount);

  console.log(`PASS Q42 ready time ${q42ReadyMs}ms <= ${budgets.q42ReadyMs}ms`);
  console.log(`PASS Q42 graph ready time ${graphReadyMs}ms <= ${budgets.graphReadyMs}ms`);
  console.log(`PASS graph node count ${graphNodeCount} <= ${budgets.graphNodeCount}`);
  console.log(`PASS DOM node count ${domNodeCount} <= ${budgets.domNodeCount}`);
} finally {
  await browser.close().catch(() => {});
}
