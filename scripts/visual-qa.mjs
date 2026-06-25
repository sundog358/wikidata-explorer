import { mkdir, readdir, rm } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright-core";
import { aiAgentsEnabled } from "../lib/ai-feature-flags.mjs";
import { installFixtureRoutes } from "./test-search-fixture-flow.mjs";

const baseUrl = process.env.VISUAL_QA_BASE_URL || "http://localhost:3000";
const chromePath = process.env.CHROME_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe";
const outDir = path.resolve(".tmp/visual-qa");
const aiEnabled = aiAgentsEnabled(process.env);

const checks = [
  {
    name: "01-home-desktop.png",
    path: "/",
    waitText: "Wikidata Explorer",
    viewport: { width: 1440, height: 1000 },
  },
  {
    name: "02-search-q42-graph-desktop.png",
    path: "/search?q=Q42",
    waitText: "Douglas Adams",
    waitTestId: "selected-entity-id",
    waitTestText: "Q42",
    fixtureRoutes: true,
    viewport: { width: 1440, height: 1000 },
  },
  {
    name: "03-chat-desktop.png",
    path: "/chat",
    waitText: aiEnabled ? "Wikidata Research Chat" : "Research Assistant is disabled",
    viewport: { width: 1440, height: 1000 },
  },
  {
    name: "04-agents-desktop.png",
    path: "/agents",
    waitText: aiEnabled ? "Agent Workbench" : "AI agents are disabled",
    viewport: { width: 1440, height: 1000 },
  },
  {
    name: "05-docs-desktop.png",
    path: "/docs",
    waitText: "Developer Commands",
    viewport: { width: 1440, height: 1000 },
  },
  {
    name: "06-search-q42-mobile.png",
    path: "/search?q=Q42",
    waitText: "Douglas Adams",
    waitTestId: "selected-entity-id",
    waitTestText: "Q42",
    fixtureRoutes: true,
    viewport: { width: 390, height: 844 },
  },
  {
    name: "07-agents-mobile.png",
    path: "/agents",
    waitText: aiEnabled ? "Agent Workbench" : "AI agents are disabled",
    viewport: { width: 390, height: 844 },
  },
  {
    name: "08-docs-mobile.png",
    path: "/docs",
    waitText: "Developer Commands",
    viewport: { width: 390, height: 844 },
  },
  {
    name: "09-search-q42-compare-desktop.png",
    path: "/search?q=Q42&tab=compare&compare=Q80",
    waitText: "Markdown comparison export",
    focusTestId: "comparison-panel",
    screenshotTestId: "comparison-panel",
    fixtureRoutes: true,
    viewport: { width: 1440, height: 1000 },
  },
  {
    name: "10-home-desktop-dark.png",
    path: "/",
    waitText: "Wikidata Explorer",
    colorScheme: "dark",
    viewport: { width: 1440, height: 1000 },
  },
  {
    name: "11-search-q42-graph-desktop-dark.png",
    path: "/search?q=Q42",
    waitText: "Douglas Adams",
    waitTestId: "selected-entity-id",
    waitTestText: "Q42",
    colorScheme: "dark",
    fixtureRoutes: true,
    viewport: { width: 1440, height: 1000 },
  },
  {
    name: "12-search-q42-compare-desktop-dark.png",
    path: "/search?q=Q42&tab=compare&compare=Q80",
    waitText: "Markdown comparison export",
    colorScheme: "dark",
    focusTestId: "comparison-panel",
    screenshotTestId: "comparison-panel",
    fixtureRoutes: true,
    viewport: { width: 1440, height: 1000 },
  },
  {
    name: "13-search-q42-mobile-dark.png",
    path: "/search?q=Q42",
    waitText: "Douglas Adams",
    waitTestId: "selected-entity-id",
    waitTestText: "Q42",
    colorScheme: "dark",
    fixtureRoutes: true,
    viewport: { width: 390, height: 844 },
  },
];

async function findHorizontalOverflow(page) {
  return page.evaluate(() => {
    const offenders = [];
    for (const el of Array.from(document.querySelectorAll("body *"))) {
      const rect = el.getBoundingClientRect();
      if (rect.width > window.innerWidth + 2 && rect.height > 0) {
        offenders.push({
          tag: el.tagName,
          className: String(el.className).slice(0, 120),
          width: Math.round(rect.width),
        });
      }
    }
    return offenders.slice(0, 10);
  });
}

function trackBrowserErrors(page) {
  const browserErrors = [];

  page.on("console", (message) => {
    if (message.type() !== "error") {
      return;
    }

    browserErrors.push(`console error: ${message.text()}`.slice(0, 500));
  });

  page.on("pageerror", (error) => {
    browserErrors.push(`page error: ${error.message}`.slice(0, 500));
  });

  return browserErrors;
}

await rm(outDir, { recursive: true, force: true });
await mkdir(outDir, { recursive: true });

const browser = await chromium.launch({
  executablePath: chromePath,
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});

const results = [];

try {
  for (const check of checks) {
    console.log(`START ${check.name} ${check.path}`);
    const page = await browser.newPage({
      deviceScaleFactor: 1,
      viewport: check.viewport,
    });
    page.setDefaultTimeout(20000);
    page.setDefaultNavigationTimeout(20000);
    if (check.colorScheme) {
      await page.emulateMedia({ colorScheme: check.colorScheme });
    }

    const browserErrors = trackBrowserErrors(page);

    try {
      if (check.fixtureRoutes) {
        await installFixtureRoutes(page);
      }

      await page.goto(new URL(check.path, baseUrl).toString(), {
        waitUntil: "commit",
        timeout: 20000,
      });
      if (check.waitTestId) {
        const readyElement = page.getByTestId(check.waitTestId);
        await readyElement.waitFor({
          state: "visible",
          timeout: 20000,
        });
        if (check.waitTestText) {
          await page.waitForFunction(
            ({ testId, text }) => document.querySelector(`[data-testid="${testId}"]`)?.textContent?.trim() === text,
            { testId: check.waitTestId, text: check.waitTestText },
            { timeout: 20000 },
          );
        }
      }
      await page.getByText(check.waitText, { exact: false }).first().waitFor({
        state: "visible",
        timeout: 20000,
      });
      if (check.focusTestId) {
        await page.getByTestId(check.focusTestId).scrollIntoViewIfNeeded({ timeout: 20000 });
      }
      await page.waitForTimeout(800);

      const screenshotPath = path.join(outDir, check.name);
      if (check.screenshotTestId) {
        await page.addStyleTag({ content: "header.sticky { display: none !important; }" });
        await page.getByTestId(check.screenshotTestId).screenshot({ path: screenshotPath, timeout: 20000 });
      } else {
        await page.screenshot({ path: screenshotPath, fullPage: false, timeout: 20000 });
      }

      const overflow = await findHorizontalOverflow(page);
      results.push({ ...check, file: screenshotPath, overflow, browserErrors });
      console.log(`DONE ${check.name}`);
    } finally {
      await page.close().catch(() => {});
    }
  }

  for (const result of results) {
    const hasFailures = result.overflow.length > 0 || result.browserErrors.length > 0;
    const marker = hasFailures ? "FAIL" : "PASS";
    console.log(`${marker} ${result.name} ${result.file}`);
    for (const offender of result.overflow) {
      console.log(`  overflow ${offender.tag} width=${offender.width} class=${offender.className}`);
    }
    for (const browserError of result.browserErrors) {
      console.log(`  ${browserError}`);
    }
  }

  console.log(`Saved ${results.length} screenshot(s) to ${outDir}`);
  console.log((await readdir(outDir)).join("\n"));

  if (results.some((result) => result.overflow.length > 0 || result.browserErrors.length > 0)) {
    process.exitCode = 1;
  }
} finally {
  await browser.close().catch(() => {});
}
