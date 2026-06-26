const DEFAULT_PRODUCTION_BASE_URL = "https://www.wikidataexplorer.com";

function cleanUrl(value = DEFAULT_PRODUCTION_BASE_URL) {
  const raw = String(value || DEFAULT_PRODUCTION_BASE_URL).trim();
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:" && !["localhost", "127.0.0.1"].includes(url.hostname)) {
      return "";
    }
    return url.toString().replace(/\/$/, "");
  } catch {
    return "";
  }
}

export function productionProofPlan(options = {}) {
  const baseUrl = cleanUrl(options.baseUrl || process.env.PRODUCTION_BASE_URL || DEFAULT_PRODUCTION_BASE_URL);
  const includeBrowser = options.includeBrowser !== false;
  const commands = [
    {
      id: "metadata",
      label: "Public metadata, robots, sitemap, social preview, favicon, and site icon",
      command: "npm",
      args: ["run", "metadata:check"],
      env: { METADATA_BASE_URL: baseUrl },
    },
    {
      id: "smoke",
      label: "Public route and AI-off API smoke checks",
      command: "npm",
      args: ["run", "smoke"],
      env: { SMOKE_BASE_URL: baseUrl },
    },
  ];

  if (includeBrowser) {
    commands.push(
      {
        id: "homepage-proof",
        label: "Recruiter homepage proof path and seeded Q42 graph edge",
        command: "node",
        args: ["scripts/test-homepage-proof-paths.mjs"],
        env: { E2E_BASE_URL: baseUrl },
      },
      {
        id: "search-proof",
        label: "Live search, comparison, graph depth/layout/detail, previews, pins, and exports",
        command: "node",
        args: ["scripts/test-search-interaction.mjs"],
        env: { E2E_BASE_URL: baseUrl },
      },
    );
  }

  return {
    ok: Boolean(baseUrl),
    baseUrl,
    commands,
    requiredExternalEvidence: [
      "GitHub Actions CI is green for the deployed commit.",
      "Vercel deployment status is successful for the deployed commit.",
      "The production proof command passes against the public URL.",
    ],
  };
}
