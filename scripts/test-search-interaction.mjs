import { chromium } from "playwright-core";
import { aiAgentsEnabled } from "../lib/ai-feature-flags.mjs";

const baseUrl = process.env.E2E_BASE_URL || "http://localhost:3000";
const chromePath = process.env.CHROME_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe";
const aiEnabled = aiAgentsEnabled(process.env);

async function assertSelectControl(page, id, expectedLabel, expectedOptions) {
  const control = page.locator(`#${id}`);
  await control.waitFor({ state: "visible" });
  const labelText = await control.evaluate((select) => select.closest("label")?.querySelector("span")?.textContent?.trim() || "");
  if (labelText !== expectedLabel) {
    throw new Error(`Expected ${id} to be labelled "${expectedLabel}", got "${labelText}"`);
  }
  const optionText = await control.locator("option").allInnerTexts();
  for (const expectedOption of expectedOptions) {
    if (!optionText.includes(expectedOption)) {
      throw new Error(`Expected ${id} to include option "${expectedOption}", got ${optionText.join(", ")}`);
    }
  }
}

const browser = await chromium.launch({
  executablePath: chromePath,
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});

try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  page.setDefaultTimeout(30000);
  const projectWorkspaceSlots = [];
  const projectTaskSummary = () => {
    const tasks = projectWorkspaceSlots.flatMap((slot) => slot.snapshot?.review?.curationTasks || []);
    return {
      total: tasks.length,
      open: tasks.filter((task) => task.status !== "resolved").length,
      entities: new Set(tasks.map((task) => task.entityId).filter(Boolean)).size,
      properties: new Set(tasks.map((task) => task.propertyId).filter(Boolean)).size,
      workspaces: projectWorkspaceSlots.length,
      statusCounts: {
        needs_review: tasks.filter((task) => task.status === "needs_review").length,
        checking_sources: tasks.filter((task) => task.status === "checking_sources").length,
        ready_to_draft: tasks.filter((task) => task.status === "ready_to_draft").length,
        resolved: tasks.filter((task) => task.status === "resolved").length,
      },
      severityCounts: {
        high: tasks.filter((task) => task.severity === "high").length,
        medium: tasks.filter((task) => task.severity === "medium").length,
      },
    };
  };
  const projectCurationTasks = () => projectWorkspaceSlots.flatMap((slot) => (slot.snapshot?.review?.curationTasks || []).map((task) => ({
    ...task,
    workspaceSlotId: slot.id,
    workspaceSlotLabel: slot.label,
    workspaceEntityId: slot.entityId,
    workspaceEntityLabel: slot.entityLabel,
    workspaceUpdatedAt: slot.updatedAt,
  })));
  const projectAgentRuns = () => projectWorkspaceSlots.flatMap((slot) => (slot.snapshot?.agentRuns || []).map((run) => ({
    ...run,
    workspaceSlotId: slot.id,
    workspaceSlotLabel: slot.label,
    workspaceEntityId: slot.entityId,
    workspaceEntityLabel: slot.entityLabel,
    workspaceUpdatedAt: slot.updatedAt,
  })));
  const projectAgentSummary = () => {
    const runs = projectAgentRuns();
    return {
      total: runs.length,
      entities: new Set(runs.map((run) => run.entityId).filter(Boolean)).size,
      workspaces: new Set(runs.map((run) => run.workspaceSlotId).filter(Boolean)).size,
      lastRunAt: runs[0]?.createdAt || null,
      actionCounts: {
        research: runs.filter((run) => run.action === "research").length,
        graph: runs.filter((run) => run.action === "graph").length,
        suggest: runs.filter((run) => run.action === "suggest").length,
        verify: runs.filter((run) => run.action === "verify").length,
        compare: runs.filter((run) => run.action === "compare").length,
        report: runs.filter((run) => run.action === "report").length,
      },
    };
  };

  await page.route("**/api/workspaces**", async (route) => {
    const request = route.request();
    const authorization = request.headers().authorization || "";
    if (authorization !== "Bearer project-token") {
      await route.fulfill({
        status: 401,
        contentType: "application/json",
        body: JSON.stringify({ error: "Workspace store is unavailable.", reason: "unauthorized" }),
      });
      return;
    }

    if (request.method() === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ projectId: "review-team", slots: projectWorkspaceSlots, curationTasks: projectCurationTasks(), taskSummary: projectTaskSummary(), agentRuns: projectAgentRuns(), agentSummary: projectAgentSummary() }),
      });
      return;
    }

    const body = request.postDataJSON();
    if (request.method() === "POST") {
      projectWorkspaceSlots.splice(0, projectWorkspaceSlots.length, body.slot, ...projectWorkspaceSlots.filter((slot) => slot.id !== body.slot.id));
      await route.fulfill({
        status: 202,
        contentType: "application/json",
        body: JSON.stringify({ projectId: body.projectId, slots: projectWorkspaceSlots, curationTasks: projectCurationTasks(), taskSummary: projectTaskSummary(), agentRuns: projectAgentRuns(), agentSummary: projectAgentSummary() }),
      });
      return;
    }

    if (request.method() === "DELETE") {
      projectWorkspaceSlots.splice(0, projectWorkspaceSlots.length, ...projectWorkspaceSlots.filter((slot) => slot.id !== body.slotId));
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ projectId: body.projectId, slots: projectWorkspaceSlots, curationTasks: projectCurationTasks(), taskSummary: projectTaskSummary(), agentRuns: projectAgentRuns(), agentSummary: projectAgentSummary() }),
      });
      return;
    }

    await route.fallback();
  });

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
  const workspaceSnapshot = JSON.parse(await page.getByTestId("workspace-snapshot-json").inputValue());
  if (workspaceSnapshot.artifactType !== "wikidata-explorer-workspace" || workspaceSnapshot.entity.id !== "Q42") {
    throw new Error(`Expected workspace snapshot export for Q42, got ${JSON.stringify(workspaceSnapshot)}`);
  }
  if (!Object.values(workspaceSnapshot.review.taskStatuses).includes("ready_to_draft")) {
    throw new Error(`Expected workspace snapshot to include persisted review task status, got ${JSON.stringify(workspaceSnapshot.review.taskStatuses)}`);
  }
  if (!workspaceSnapshot.review.curationTasks?.some((task) => task.entityId === "Q42" && task.propertyId && task.title && task.status === "ready_to_draft")) {
    throw new Error(`Expected workspace snapshot to include persisted curation task details, got ${JSON.stringify(workspaceSnapshot.review.curationTasks)}`);
  }
  await page.getByTestId("workspace-slot-name").fill("Q42 reviewer workspace");
  await page.getByTestId("save-workspace-slot").click();
  const savedWorkspaceSlotsText = await page.getByTestId("saved-workspace-slots").innerText();
  if (!savedWorkspaceSlotsText.includes("Q42 reviewer workspace") || !savedWorkspaceSlotsText.includes("Douglas Adams (Q42)")) {
    throw new Error(`Expected saved browser workspace slot for Q42, got ${savedWorkspaceSlotsText}`);
  }
  const savedWorkspaceSlots = await page.evaluate(() => JSON.parse(window.localStorage.getItem("wikidata-explorer.workspaceSlots.v1") || "[]"));
  if (savedWorkspaceSlots[0]?.snapshot?.entity?.id !== "Q42" || !Object.values(savedWorkspaceSlots[0]?.snapshot?.review?.taskStatuses || {}).includes("ready_to_draft")) {
    throw new Error(`Expected browser workspace slot to persist Q42 review state, got ${JSON.stringify(savedWorkspaceSlots)}`);
  }
  await page.getByTestId("project-workspace-id").fill("review-team");
  await page.getByTestId("project-workspace-token").fill("project-token");
  await page.getByTestId("save-project-workspace").click();
  await page.waitForFunction(() => document.querySelector('[data-testid="workspace-snapshot-message"]')?.textContent?.includes("Saved project workspace"));
  if (projectWorkspaceSlots[0]?.snapshot?.entity?.id !== "Q42" || !Object.values(projectWorkspaceSlots[0]?.snapshot?.review?.taskStatuses || {}).includes("ready_to_draft")) {
    throw new Error(`Expected project workspace save to include Q42 review state, got ${JSON.stringify(projectWorkspaceSlots)}`);
  }
  if (!projectWorkspaceSlots[0]?.snapshot?.review?.curationTasks?.some((task) => task.entityId === "Q42" && task.status === "ready_to_draft")) {
    throw new Error(`Expected project workspace save to include curation task details, got ${JSON.stringify(projectWorkspaceSlots)}`);
  }
  const projectSummaryText = await page.getByTestId("project-workspace-task-summary").innerText();
  const expectedProjectSummary = projectTaskSummary();
  if (!projectSummaryText.includes(`${expectedProjectSummary.open} open`) || !projectSummaryText.includes("1 ready") || !projectSummaryText.includes("1 workspaces")) {
    throw new Error(`Expected project workspace task summary after save, got ${projectSummaryText}`);
  }
  const projectTaskPreviewText = await page.getByTestId("project-workspace-task-preview").innerText();
  if (!projectTaskPreviewText.toLowerCase().includes("project review backlog") || !projectTaskPreviewText.includes("Ready to draft") || !projectTaskPreviewText.includes("Deprecated statement needs review")) {
    throw new Error(`Expected project workspace task preview after save, got ${projectTaskPreviewText}`);
  }
  const savedProjectBrief = await page.getByTestId("project-workspace-brief-markdown").inputValue();
  if (!savedProjectBrief.includes("# Wikidata Explorer project brief") || !savedProjectBrief.includes("Project: review-team") || !savedProjectBrief.includes("## Review backlog") || !savedProjectBrief.includes("Ready to draft")) {
    throw new Error(`Expected project workspace brief after save, got ${savedProjectBrief}`);
  }
  const projectAgentSummaryText = await page.getByTestId("project-workspace-agent-summary").innerText();
  if (!projectAgentSummaryText.includes("0 agent runs") || !projectAgentSummaryText.includes("No saved runs")) {
    throw new Error(`Expected empty project workspace agent summary after save, got ${projectAgentSummaryText}`);
  }
  await page.getByRole("button", { name: "Delete Project" }).click();
  await page.waitForFunction(() => document.querySelector('[data-testid="workspace-snapshot-message"]')?.textContent?.includes("Removed project workspace slot"));
  if (projectWorkspaceSlots.length !== 0) {
    throw new Error(`Expected project workspace delete to remove slot, got ${JSON.stringify(projectWorkspaceSlots)}`);
  }
  const emptyProjectSummaryText = await page.getByTestId("project-workspace-task-summary").innerText();
  if (!emptyProjectSummaryText.includes("0 open") || !emptyProjectSummaryText.includes("0 saved tasks")) {
    throw new Error(`Expected project workspace task summary after delete, got ${emptyProjectSummaryText}`);
  }
  const emptyProjectAgentSummaryText = await page.getByTestId("project-workspace-agent-summary").innerText();
  if (!emptyProjectAgentSummaryText.includes("0 agent runs")) {
    throw new Error(`Expected empty project workspace agent summary after delete, got ${emptyProjectAgentSummaryText}`);
  }
  if (await page.getByTestId("project-workspace-task-preview").count() !== 0 || await page.getByTestId("project-workspace-agent-preview").count() !== 0) {
    throw new Error("Expected project workspace previews to clear after project slot delete.");
  }
  projectWorkspaceSlots.push({
    ...savedWorkspaceSlots[0],
    label: "Project loaded workspace",
    updatedAt: "2026-06-25T22:40:00.000Z",
    snapshot: {
      ...savedWorkspaceSlots[0].snapshot,
      agentRuns: [{
        id: "loaded-run-1",
        entityId: "Q42",
        entityLabel: "Douglas Adams",
        action: "verify",
        title: "Verifier",
        result: "Grounded verification result",
        createdAt: "2026-06-25T22:39:00.000Z",
      }],
    },
  });
  await page.getByTestId("load-project-workspace").click();
  await page.waitForFunction(() => document.querySelector('[data-testid="workspace-snapshot-message"]')?.textContent?.includes("Loaded 1 project workspace slot"));
  const loadedProjectSlotsText = await page.getByTestId("saved-workspace-slots").innerText();
  if (!loadedProjectSlotsText.includes("Project loaded workspace")) {
    throw new Error(`Expected loaded project workspace slot to appear locally, got ${loadedProjectSlotsText}`);
  }
  const loadedProjectSummaryText = await page.getByTestId("project-workspace-task-summary").innerText();
  const expectedLoadedSummary = projectTaskSummary();
  if (!loadedProjectSummaryText.includes(`${expectedLoadedSummary.open} open`) || !loadedProjectSummaryText.includes("1 ready")) {
    throw new Error(`Expected loaded project workspace task summary, got ${loadedProjectSummaryText}`);
  }
  const loadedAgentSummaryText = await page.getByTestId("project-workspace-agent-summary").innerText();
  if (!loadedAgentSummaryText.includes("1 agent run") || !loadedAgentSummaryText.includes("1 verify") || !loadedAgentSummaryText.includes("1 entities")) {
    throw new Error(`Expected loaded project workspace agent summary, got ${loadedAgentSummaryText}`);
  }
  const loadedAgentPreviewText = await page.getByTestId("project-workspace-agent-preview").innerText();
  if (!loadedAgentPreviewText.toLowerCase().includes("project agent history") || !loadedAgentPreviewText.includes("Verifier") || !loadedAgentPreviewText.includes("Douglas Adams")) {
    throw new Error(`Expected loaded project workspace agent preview, got ${loadedAgentPreviewText}`);
  }
  const loadedProjectBrief = await page.getByTestId("project-workspace-brief-markdown").inputValue();
  if (!loadedProjectBrief.includes("## Saved AG2 history") || !loadedProjectBrief.includes("verify: Verifier") || !loadedProjectBrief.includes("Saved runs: 1")) {
    throw new Error(`Expected project workspace brief to include saved AG2 history, got ${loadedProjectBrief}`);
  }

  await page.getByRole("tab", { name: /Statements/ }).click();
  const statementBadges = await page.getByTestId("statement-evidence-badges").allInnerTexts();
  const statementBadgeText = statementBadges.join(" ").toLowerCase();
  if (!statementBadgeText.includes("referenced") || !statementBadgeText.includes("unreferenced")) {
    throw new Error(`Expected Statements tab to show referenced and unreferenced badges, got ${statementBadgeText}`);
  }
  const firstStatementDetail = page.getByTestId("statement-detail-view").first();
  await firstStatementDetail.locator("summary").click();
  const statementsTabDetailText = await firstStatementDetail.innerText();
  const statementsTabDetailLower = statementsTabDetailText.toLowerCase();
  if (!statementsTabDetailLower.includes("statement id") || !statementsTabDetailLower.includes("evidence status") || !statementsTabDetailLower.includes("source hints") || !statementsTabDetailLower.includes("stated in")) {
    throw new Error(`Expected statement detail view to include ID, evidence status, and source hints, got ${statementsTabDetailText}`);
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
  await page.getByTestId("view-comparison-json-export").click();
  const comparisonExportUrl = new URL(page.url());
  if (comparisonExportUrl.searchParams.get("export") !== "comparison-json") {
    throw new Error(`Expected comparison JSON export view in URL, got ${page.url()}`);
  }
  const comparisonExportView = await page.getByTestId("shareable-export-view").innerText();
  if (!comparisonExportView.includes("Shareable comparison export view") || !comparisonExportView.includes("Q42") || !comparisonExportView.includes("Q80")) {
    throw new Error(`Expected shareable comparison export panel, got ${comparisonExportView}`);
  }
  await page.getByRole("tab", { name: /Graph/ }).click();
  await page.getByTestId("graph-filters").waitFor({ state: "visible" });
  await assertSelectControl(page, "graph-depth-filter", "Depth", ["1-hop statements", "2-hop evidence", "Selected property"]);
  await assertSelectControl(page, "graph-layout-filter", "Layout", ["Radial", "Grouped by property", "Timeline evidence"]);
  await assertSelectControl(page, "graph-kind-filter", "Target type", ["All targets", "Items only", "Properties only"]);
  await assertSelectControl(page, "graph-rank-filter", "Rank", ["All ranks", "Preferred", "Normal", "Deprecated"]);
  await assertSelectControl(page, "graph-property-filter", "Relationship", ["All relationships"]);
  await assertSelectControl(page, "graph-evidence-filter", "Evidence", ["All evidence", "Referenced", "Unreferenced", "Has qualifiers"]);
  const clearGraphFiltersLabel = await page.getByTestId("clear-graph-filters").getAttribute("aria-label");
  if (clearGraphFiltersLabel !== "Clear graph filters") {
    throw new Error(`Expected graph filter reset control to expose an aria-label, got ${clearGraphFiltersLabel}`);
  }
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
  const restoredQ5GraphNode = page.getByTestId("graph-node-Q5").first();
  await restoredQ5GraphNode.waitFor({ state: "visible" });
  await restoredQ5GraphNode.focus();
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
  if (!statementDetailText.includes("statement detail drawer") || !statementDetailText.includes("statement id") || !statementDetailText.includes("value") || !statementDetailText.includes("data type") || !statementDetailText.includes("context") || !statementDetailText.includes("qualifiers") || !statementDetailText.includes("references")) {
    throw new Error(`Expected selected graph detail drawer to include statement and reference details, got ${statementDetailDrawer}`);
  }
  await page.getByTestId("pin-graph-relationship").focus();
  const focusedPinControl = await page.evaluate(() => document.activeElement?.getAttribute("data-testid"));
  if (focusedPinControl !== "pin-graph-relationship") {
    throw new Error(`Expected keyboard focus to reach the pin relationship control, got ${focusedPinControl}`);
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
  await page.getByTestId("clear-pinned-relationships").focus();
  const focusedPinnedControl = await page.evaluate(() => document.activeElement?.getAttribute("data-testid"));
  if (focusedPinnedControl !== "clear-pinned-relationships") {
    throw new Error(`Expected keyboard focus to reach the clear pinned relationships control, got ${focusedPinnedControl}`);
  }
  const clearPinnedLabel = await page.getByTestId("clear-pinned-relationships").getAttribute("aria-label");
  if (clearPinnedLabel !== "Clear pinned relationship history") {
    throw new Error(`Expected clear pinned relationships control to expose an aria-label, got ${clearPinnedLabel}`);
  }
  const pinnedComparison = await page.getByTestId("pinned-relationship-comparison").innerText();
  const pinnedComparisonText = pinnedComparison.toLowerCase();
  if (!pinnedComparisonText.includes("pinned comparison") || !pinnedComparisonText.includes("2 edges") || !pinnedComparisonText.includes("relationships") || !pinnedComparisonText.includes("ranks") || !pinnedComparisonText.includes("strongest edge")) {
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
  await page.getByTestId("view-graph-json-export").click();
  const graphExportUrl = new URL(page.url());
  if (graphExportUrl.searchParams.get("export") !== "graph-json" || graphExportUrl.searchParams.get("gfocus") !== "Q5") {
    throw new Error(`Expected graph JSON export view and selected focus in URL, got ${page.url()}`);
  }
  const graphExportView = await page.getByTestId("shareable-export-view").innerText();
  if (!graphExportView.includes("Shareable graph export view") || !graphExportView.includes("P31")) {
    throw new Error(`Expected shareable graph export panel, got ${graphExportView}`);
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

  const directPidPage = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  directPidPage.setDefaultTimeout(30000);
  await directPidPage.goto(new URL("/search?q=P31", baseUrl).toString(), {
    waitUntil: "commit",
  });
  await directPidPage.waitForFunction(() => {
    const node = document.querySelector('[data-testid="selected-entity-id"]');
    return node?.textContent?.trim() === "P31";
  });

  const selectedProperty = await directPidPage.getByTestId("selected-entity-id").innerText();
  if (selectedProperty.trim() !== "P31") {
    throw new Error(`Expected direct PID lookup to select P31, got ${selectedProperty}`);
  }
  await directPidPage.close();

  console.log("PASS search data quality summary renders for Q42");
  console.log("PASS search review queue status persists in the workbench");
  console.log("PASS statements tab exposes evidence badges and source hints");
  console.log("PASS AI-off comparison workflow summarizes Q42 against Q80");
  console.log("PASS comparison target URL state restores shared comparisons");
  console.log("PASS comparison Markdown export includes shared-property sections");
  console.log("PASS comparison JSON export includes structured handoff metadata");
  console.log("PASS comparison export view URL restores structured handoff");
  console.log("PASS search tab and graph filter state update the URL");
  console.log("PASS graph depth controls support selected-property expansion");
  console.log("PASS grouped-by-property graph layout updates URL state");
  console.log("PASS timeline graph layout updates URL state");
  console.log("PASS graph filter controls expose labels and expected options");
  console.log("PASS graph nodes expose accessible relationship labels and keyboard focus");
  console.log("PASS graph filters keep predictable tab order and reduced-motion nodes disable transitions");
  console.log("PASS search graph focus URL state restores AG2 context");
  console.log("PASS search graph filters keep Q5 reachable from Q42");
  console.log(aiEnabled ? "PASS search graph focus grounds AG2 agent panel" : "PASS public mode hides AG2 graph focus panel");
  console.log("PASS selected graph statement detail drawer shows references");
  console.log("PASS selected graph detail drawer and pinned controls are keyboard reachable");
  console.log("PASS richer graph node previews include secondary descriptions");
  console.log("PASS pinned relationship history keeps selected graph edges");
  console.log("PASS pinned relationship comparison summarizes multiple edges");
  console.log("PASS selected graph edge evidence shows concrete references");
  console.log("PASS selected graph path export includes evidence details");
  console.log("PASS selected graph path export summarizes the chosen edge");
  console.log("PASS graph export view URL restores selected path handoff");
  console.log("PASS search graph interaction selects Q5 from Q42");
  console.log("PASS direct PID lookup selects P31");
} finally {
  await browser.close().catch(() => {});
}
