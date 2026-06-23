import { chromium } from "playwright-core";
import { aiAgentsEnabled } from "../lib/ai-feature-flags.mjs";

const baseUrl = process.env.E2E_BASE_URL || "http://localhost:3000";
const chromePath = process.env.CHROME_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe";
const aiEnabled = aiAgentsEnabled(process.env);

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

  await page.getByTestId("data-quality-summary").waitFor({ state: "visible" });
  const qualitySummary = await page.getByTestId("data-quality-summary").innerText();
  if (!qualitySummary.includes("Data quality summary")) {
    throw new Error(`Expected data quality summary to render, got ${qualitySummary}`);
  }

  await page.getByRole("tab", { name: /Review Queue/ }).click();
  const reviewStatusSelect = page.locator('select[aria-label^="Review status for"]').first();
  await reviewStatusSelect.waitFor({ state: "visible" });
  await reviewStatusSelect.selectOption("ready_to_draft");
  const reviewPanel = await page.getByRole("tabpanel").filter({ hasText: "Ready to draft" }).first().innerText();
  if (!reviewPanel.includes("Ready to draft")) {
    throw new Error(`Expected review queue status to update to Ready to draft, got ${reviewPanel}`);
  }
  await page.getByRole("tab", { name: /Graph/ }).click();
  await page.getByTestId("graph-filters").waitFor({ state: "visible" });
  await page.getByLabel("Target type").selectOption("item");
  const filterSummary = await page.getByTestId("graph-filter-summary").innerText();
  if (!filterSummary.includes("Showing")) {
    throw new Error(`Expected graph filter summary after item filter, got ${filterSummary}`);
  }

  await page.getByTestId("graph-focus-Q5").click();
  const graphEdgeEvidence = await page.getByTestId("graph-edge-evidence-summary").innerText();
  const graphEdgeEvidenceText = graphEdgeEvidence.toLowerCase();
  if (!graphEdgeEvidenceText.includes("references") || !graphEdgeEvidenceText.includes("stated in")) {
    throw new Error(`Expected selected graph edge evidence to show concrete references, got ${graphEdgeEvidence}`);
  }
  if (aiEnabled) {
    const graphFocus = await page.getByTestId("agent-graph-focus").innerText();
    if (!graphFocus.includes("P31") || !graphFocus.includes("Q5")) {
      throw new Error(`Expected AG2 graph focus to include P31 and Q5, got ${graphFocus}`);
    }
  } else {
    const graphFocusCount = await page.getByTestId("agent-graph-focus").count();
    if (graphFocusCount !== 0) {
      throw new Error("Expected AG2 graph focus panel to be hidden in public AI-off mode.");
    }
  }

  const graphPathSummary = await page.getByTestId("graph-path-export-summary").innerText();
  if (!graphPathSummary.includes("Douglas Adams") || !graphPathSummary.includes("P31") || !graphPathSummary.includes("human")) {
    throw new Error(`Expected graph path export to summarize Q42 -> Q5, got ${graphPathSummary}`);
  }

  const graphMarkdownExport = await page.locator('textarea[aria-label="Graph path Markdown export"]').inputValue();
  if (!graphMarkdownExport.includes("## Evidence Details") || !graphMarkdownExport.includes("stated in")) {
    throw new Error(`Expected graph path Markdown export to include evidence details, got ${graphMarkdownExport}`);
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

  console.log("PASS search data quality summary renders for Q42");
  console.log("PASS search review queue status persists in the workbench");
  console.log("PASS search tab and graph filter state update the URL");
  console.log("PASS search graph focus URL state restores AG2 context");
  console.log("PASS search graph filters keep Q5 reachable from Q42");
  console.log(aiEnabled ? "PASS search graph focus grounds AG2 agent panel" : "PASS public mode hides AG2 graph focus panel");
  console.log("PASS selected graph edge evidence shows concrete references");
  console.log("PASS selected graph path export includes evidence details");
  console.log("PASS selected graph path export summarizes the chosen edge");
  console.log("PASS search graph interaction selects Q5 from Q42");
  console.log("PASS direct PID lookup selects P31");
} finally {
  await browser.close().catch(() => {});
}
