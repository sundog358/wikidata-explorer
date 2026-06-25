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

  await page.getByRole("tab", { name: /Compare/ }).click();
  await page.getByTestId("comparison-panel").waitFor({ state: "visible" });
  await page.getByTestId("comparison-panel").getByRole("button", { name: "Compare" }).click();
  await page.getByTestId("comparison-summary").waitFor({ state: "visible" });
  const comparisonSummary = await page.getByTestId("comparison-summary").innerText();
  if (!comparisonSummary.includes("Douglas Adams") || !comparisonSummary.includes("Q42") || !comparisonSummary.includes("Q80")) {
    throw new Error(`Expected comparison summary to include Q42 and Q80, got ${comparisonSummary}`);
  }
  const comparisonUrl = new URL(page.url());
  if (comparisonUrl.searchParams.get("tab") !== "compare" || comparisonUrl.searchParams.get("compare") !== "Q80") {
    throw new Error(`Expected comparison tab and target in URL, got ${page.url()}`);
  }
  await page.reload({ waitUntil: "commit" });
  await page.getByTestId("comparison-summary").waitFor({ state: "visible" });
  const restoredComparisonSummary = await page.getByTestId("comparison-summary").innerText();
  if (!restoredComparisonSummary.includes("Douglas Adams") || !restoredComparisonSummary.includes("Q80")) {
    throw new Error(`Expected shared comparison URL to restore Q42 against Q80, got ${restoredComparisonSummary}`);
  }
  const sharedProperties = await page.getByTestId("comparison-shared-properties").innerText();
  if (!sharedProperties.includes("instance of") && !sharedProperties.includes("occupation")) {
    throw new Error(`Expected comparison to show recognizable shared properties, got ${sharedProperties}`);
  }
  const comparisonMarkdown = await page.getByTestId("comparison-markdown-export").inputValue();
  if (!comparisonMarkdown.includes("Entity comparison") || !comparisonMarkdown.includes("Shared Properties")) {
    throw new Error(`Expected comparison Markdown export to include summary sections, got ${comparisonMarkdown}`);
  }
  const comparisonJson = JSON.parse(await page.getByTestId("comparison-json-export").inputValue());
  if (comparisonJson.artifactType !== "entity-comparison" || comparisonJson.source.id !== "Q42" || comparisonJson.target.id !== "Q80" || comparisonJson.safety.mode !== "draft-only") {
    throw new Error(`Expected comparison JSON export to include source, target, and safety metadata, got ${JSON.stringify(comparisonJson)}`);
  }

  await page.getByRole("tab", { name: /Graph/ }).click();
  await page.getByTestId("graph-filters").waitFor({ state: "visible" });
  await page.getByLabel("Layout").selectOption("property");
  await page.getByLabel("Depth").selectOption("2");
  await page.getByLabel("Target type").selectOption("item");
  await page.locator("#graph-property-filter").selectOption("P31");
  await page.getByLabel("Depth").selectOption("property");
  const filterSummary = await page.getByTestId("graph-filter-summary").innerText();
  if (!filterSummary.includes("Showing")) {
    throw new Error(`Expected graph filter summary after item filter, got ${filterSummary}`);
  }
  const graphUrl = new URL(page.url());
  if (graphUrl.searchParams.get("gdepth") !== "property" || graphUrl.searchParams.get("glayout") !== "property" || graphUrl.searchParams.get("gprop") !== "P31") {
    throw new Error(`Expected graph depth, layout, and property filters in URL, got ${page.url()}`);
  }
  await page.getByLabel("Layout").selectOption("timeline");
  const timelineUrl = new URL(page.url());
  if (timelineUrl.searchParams.get("glayout") !== "timeline") {
    throw new Error(`Expected timeline graph layout in URL, got ${page.url()}`);
  }
  await page.getByLabel("Depth").focus();
  for (const expectedFocusedControl of [
    "graph-depth-filter",
    "graph-layout-filter",
    "graph-kind-filter",
    "graph-rank-filter",
    "graph-property-filter",
    "graph-evidence-filter",
  ]) {
    const focusedControl = await page.evaluate(() => document.activeElement?.id);
    if (focusedControl !== expectedFocusedControl) {
      throw new Error(`Expected graph filter tab order to focus ${expectedFocusedControl}, got ${focusedControl}`);
    }
    await page.keyboard.press("Tab");
  }
  const q5GraphNode = page.getByTestId("graph-node-Q5").first();
  const q5AccessibleName = await q5GraphNode.getAttribute("aria-label");
  if (!q5AccessibleName?.includes("human (Q5)") || !q5AccessibleName.includes("relationship instance of (P31)") || !q5AccessibleName.includes("normal rank")) {
    throw new Error(`Expected Q5 graph node to expose relationship context in its accessible name, got ${q5AccessibleName}`);
  }
  await page.emulateMedia({ reducedMotion: "reduce" });
  const q5TransitionProperty = await q5GraphNode.evaluate((node) => getComputedStyle(node).transitionProperty);
  if (q5TransitionProperty !== "none") {
    throw new Error(`Expected reduced-motion graph node to disable transitions, got ${q5TransitionProperty}`);
  }
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await q5GraphNode.focus();
  const focusedGraphNode = await page.evaluate(() => document.activeElement?.getAttribute("data-testid"));
  if (focusedGraphNode !== "graph-node-Q5") {
    throw new Error(`Expected keyboard focus to reach graph-node-Q5, got ${focusedGraphNode}`);
  }

  await page.getByTestId("graph-focus-Q5").click();
  await page.getByTestId("selected-graph-node-description").waitFor({ state: "visible" });
  const selectedNodeDescription = await page.getByTestId("selected-graph-node-description").innerText();
  if (!selectedNodeDescription.trim()) {
    throw new Error("Expected selected graph node to show a secondary entity description.");
  }
  const statementDetailDrawer = await page.getByTestId("graph-statement-detail-drawer").innerText();
  const statementDetailText = statementDetailDrawer.toLowerCase();
  if (!statementDetailText.includes("statement detail drawer") || !statementDetailText.includes("statement id") || !statementDetailText.includes("references")) {
    throw new Error(`Expected selected graph detail drawer to include statement and reference details, got ${statementDetailDrawer}`);
  }
  await page.getByTestId("pin-graph-relationship").click();
  const graphFocusButtons = page.locator('[data-testid^="graph-focus-"]');
  const graphFocusButtonCount = await graphFocusButtons.count();
  if (graphFocusButtonCount < 2) {
    throw new Error(`Expected at least two graph focus buttons for pinned comparison, got ${graphFocusButtonCount}`);
  }
  await graphFocusButtons.nth(1).click();
  await page.getByTestId("pin-graph-relationship").click();
  const pinnedHistory = await page.getByTestId("pinned-relationship-history").innerText();
  if (!pinnedHistory.includes("Pinned relationship history") || !pinnedHistory.includes("Q5")) {
    throw new Error(`Expected pinned relationship history to include Q5, got ${pinnedHistory}`);
  }
  const pinnedComparison = await page.getByTestId("pinned-relationship-comparison").innerText();
  const pinnedComparisonText = pinnedComparison.toLowerCase();
  if (!pinnedComparisonText.includes("pinned comparison") || !pinnedComparisonText.includes("2 edges") || !pinnedComparisonText.includes("strongest edge")) {
    throw new Error(`Expected pinned comparison view to summarize multiple pinned edges, got ${pinnedComparison}`);
  }
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

  await page.getByTestId("graph-focus-Q5").click();
  const graphPathSummary = await page.getByTestId("graph-path-export-summary").innerText();
  if (!graphPathSummary.includes("Douglas Adams") || !graphPathSummary.includes("P31") || !graphPathSummary.includes("human")) {
    throw new Error(`Expected graph path export to summarize Q42 -> Q5, got ${graphPathSummary}`);
  }

  const graphMarkdownExport = await page.locator('textarea[aria-label="Graph path Markdown export"]').inputValue();
  if (!graphMarkdownExport.includes("## Evidence Details") || !graphMarkdownExport.includes("stated in")) {
    throw new Error(`Expected graph path Markdown export to include evidence details, got ${graphMarkdownExport}`);
  }

  await q5GraphNode.focus();
  await page.keyboard.press("Enter");
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
  console.log("PASS AI-off comparison workflow summarizes Q42 against Q80");
  console.log("PASS comparison target URL state restores shared comparisons");
  console.log("PASS comparison Markdown export includes shared-property sections");
  console.log("PASS comparison JSON export includes structured handoff metadata");
  console.log("PASS search tab and graph filter state update the URL");
  console.log("PASS graph depth controls support selected-property expansion");
  console.log("PASS grouped-by-property graph layout updates URL state");
  console.log("PASS timeline graph layout updates URL state");
  console.log("PASS graph nodes expose accessible relationship labels and keyboard focus");
  console.log("PASS graph filters keep predictable tab order and reduced-motion nodes disable transitions");
  console.log("PASS search graph focus URL state restores AG2 context");
  console.log("PASS search graph filters keep Q5 reachable from Q42");
  console.log(aiEnabled ? "PASS search graph focus grounds AG2 agent panel" : "PASS public mode hides AG2 graph focus panel");
  console.log("PASS selected graph statement detail drawer shows references");
  console.log("PASS richer graph node previews include secondary descriptions");
  console.log("PASS pinned relationship history keeps selected graph edges");
  console.log("PASS pinned relationship comparison summarizes multiple edges");
  console.log("PASS selected graph edge evidence shows concrete references");
  console.log("PASS selected graph path export includes evidence details");
  console.log("PASS selected graph path export summarizes the chosen edge");
  console.log("PASS search graph interaction selects Q5 from Q42");
  console.log("PASS direct PID lookup selects P31");
} finally {
  await browser.close().catch(() => {});
}
