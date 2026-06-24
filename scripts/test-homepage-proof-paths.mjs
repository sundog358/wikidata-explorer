import { chromium } from "playwright-core";

const baseUrl = process.env.E2E_BASE_URL || "http://localhost:3000";
const chromePath = process.env.CHROME_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe";
const q42ProofPathPath = "/search?q=Q42&gkind=item&gprop=P31&gevidence=referenced&gfocus=Q5";

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
  await page.waitForURL(new URL(q42ProofPathPath, baseUrl).toString());
  await waitForSelectedEntity(page, "Q42");
  await page.getByTestId("graph-filters").waitFor({ state: "visible" });
  await page.getByTestId("recruiter-proof-path").waitFor({ state: "visible" });

  const proofPathText = await page.getByTestId("recruiter-proof-path").innerText();
  if (!proofPathText.includes("Graph context") || !proofPathText.includes("Evidence depth") || !proofPathText.includes("Safe exports") || !proofPathText.includes("AI boundary")) {
    throw new Error(`Expected recruiter proof path to cover graph, evidence, exports, and AI boundary, got ${proofPathText}`);
  }

  await page.getByTestId("graph-path-export").waitFor({ state: "visible" });
  const graphPathSummary = await page.getByTestId("graph-path-export-summary").innerText();
  if (!graphPathSummary.includes("Douglas Adams") || !graphPathSummary.includes("P31") || !graphPathSummary.includes("human")) {
    throw new Error(`Expected seeded graph path export to summarize Q42 -> Q5, got ${graphPathSummary}`);
  }

  const aiBoundaryText = await page.getByTestId("proof-path-ai-boundary").innerText();
  if (!aiBoundaryText.includes("AI boundary") || !aiBoundaryText.includes("Safety gated")) {
    throw new Error(`Expected proof path AI boundary to be visible, got ${aiBoundaryText}`);
  }

  await page.getByTestId("proof-path-review").click();
  await page.waitForFunction(() => new URL(window.location.href).searchParams.get("tab") === "review");

  await page.goto(new URL("/", baseUrl).toString(), { waitUntil: "commit" });
  await page.getByTestId("home-proof-path-review").click();
  await page.waitForURL(new URL("/search?q=Q42&tab=review", baseUrl).toString());
  await waitForSelectedEntity(page, "Q42");

  await page.waitForFunction(() => {
    const text = document.body.innerText;
    return text.includes("Bot-ready draft exports") || text.includes("No active review flags");
  });

  console.log("PASS homepage graph proof path opens the seeded Q42 graph edge");
  console.log("PASS recruiter proof path covers graph, evidence, exports, and AI boundary");
  console.log("PASS homepage evidence proof path opens the Q42 review queue");
} finally {
  await browser.close().catch(() => {});
}