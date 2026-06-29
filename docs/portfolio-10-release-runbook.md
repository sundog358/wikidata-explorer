# Portfolio 10/10 Release Runbook

Last reviewed: June 29, 2026

This runbook is the operator path from the current 9.8/10 state to a defensible 10/10 portfolio release. It assumes the public AI-off site already passes production proof at `https://www.wikidataexplorer.com`; the remaining proof is hosted workspace/observability plus an intentionally AI-enabled AG2 demo.

## Required Hosted Targets

- Public app URL: `https://www.wikidataexplorer.com` or a separate AI-enabled Next.js app URL.
- Hosted AG2 service URL: an HTTPS `AG2_SERVICE_URL` backed by `agents/Dockerfile` with its `/health` container healthcheck passing.
- Durable workspace store: `WORKSPACE_STORE_DIR` mounted on the hosted Next.js target.
- Durable observability receiver: `API_OBSERVABILITY_STORE_DIR` mounted on the hosted Next.js target.

The AG2 service and the Next.js app must share the same 32+ character `AG2_SERVICE_TOKEN`. The built-in observability receiver must be protected by `API_OBSERVABILITY_RECEIVER_TOKEN`, and the project workspace route must be protected by `WORKSPACE_STORE_TOKEN`.

## GitHub Actions Secrets

Configure these repository secrets before dispatching the final proof workflow:

```powershell
gh secret set PRODUCTION_WORKSPACE_STORE_TOKEN --repo sundog358/wikidata-explorer
gh secret set PRODUCTION_OBSERVABILITY_RECEIVER_TOKEN --repo sundog358/wikidata-explorer
gh secret set AG2_DEMO_SERVICE_TOKEN --repo sundog358/wikidata-explorer
gh secret set AG2_DEMO_OBSERVABILITY_RECEIVER_TOKEN --repo sundog358/wikidata-explorer
```

Do not paste secret values into logs, issues, docs, or proof artifacts. The preflight checks only the secret names and never prints values.

## Hosted App Environment

The AI-enabled Next.js target needs these non-secret and secret settings:

```powershell
NEXT_PUBLIC_ENABLE_AI_AGENTS=true
ENABLE_AI_AGENTS=true
NEXT_PUBLIC_SITE_URL=https://www.wikidataexplorer.com
AG2_SERVICE_URL=https://your-hosted-ag2-service.example
AG2_SERVICE_TOKEN=<same-32-plus-character-token-as-the-ag2-service>
AG2_ENABLE_DOCS=false
AI_AGENT_RATE_LIMIT_MAX=20
AI_AGENT_RATE_LIMIT_WINDOW_MS=60000
API_OBSERVABILITY_RECEIVER_TOKEN=<shared-monitor-token>
API_OBSERVABILITY_STORE_DIR=/mnt/wikidata-observability
API_OBSERVABILITY_WEBHOOK_URL=https://www.wikidataexplorer.com/api/observability/events
API_OBSERVABILITY_WEBHOOK_TOKEN=<shared-monitor-token>
WORKSPACE_STORE_DIR=/mnt/wikidata-workspaces
WORKSPACE_STORE_TOKEN=<shared-workspace-token>
```

If the AI demo uses a separate app URL, use that URL for `NEXT_PUBLIC_SITE_URL`, `AG2_DEMO_BASE_URL`, `API_OBSERVABILITY_WEBHOOK_URL`, and workflow inputs. Keep the public AI-off demo available if the AI-enabled target is private or temporary.

## Preflight

Run the GitHub metadata preflight before spending a workflow run:

```powershell
npm run portfolio:hosted:preflight -- --github --app-base-url=https://www.wikidataexplorer.com --ag2-service-url=https://your-hosted-ag2-service.example
```

Run the local proof environment preflight when executing proof commands from a terminal with the real environment loaded:

```powershell
$env:HOSTED_OPS_BASE_URL = "https://www.wikidataexplorer.com"
$env:AG2_DEMO_BASE_URL = "https://www.wikidataexplorer.com"
$env:AG2_SERVICE_URL = "https://your-hosted-ag2-service.example"
npm run portfolio:hosted:preflight
```

A passing preflight does not prove the release is 10/10. It only proves the final hosted proof run has the required non-secret URLs and secret wiring.
If preflight fails, it prints `NEXT hosted proof setup actions` with redacted `gh secret set` commands, the final `Production Proof` dispatch shape, and the downloaded-artifact `portfolio:10:check -- --require-check-log` command. Those commands intentionally use placeholders for secret values and hosted URLs.

## Final Proof Workflow

The manual workflows run the same scoped preflights before hosted proof steps, so missing secrets and placeholder URLs fail before the longer proof commands. Dispatch the manual `Production Proof` workflow with hosted proofs enabled:

```powershell
gh workflow run production-proof.yml `
  --repo sundog358/wikidata-explorer `
  -f base_url=https://www.wikidataexplorer.com `
  -f skip_browser=false `
  -f run_ops_proof=true `
  -f run_ag2_proof=true `
  -f ai_app_base_url=https://www.wikidataexplorer.com `
  -f ag2_service_url=https://your-hosted-ag2-service.example `
  -f require_ag2_durable_monitor=true
```

If the AI-enabled app is separate from the public AI-off portfolio URL, set `ai_app_base_url` to that AI-enabled Next.js URL while keeping `base_url` pointed at the public portfolio URL.

When both hosted proof toggles are enabled, the workflow runs `npm run portfolio:10:check -- --dir=.` after `portfolio:evidence` and before artifact upload, then captures that output in `portfolio-10-check.log`. All proof-log `tee` captures are pipefail-protected, so a failing proof command cannot be hidden by successful log capture. That means a green workflow has already validated the combined logs, downloaded Markdown summary, JSON summary, and SHA-256 digests once inside GitHub Actions.

Wait for completion:

```powershell
gh run list --repo sundog358/wikidata-explorer --workflow production-proof.yml --limit 5
gh run watch <run-id> --repo sundog358/wikidata-explorer --exit-status
```

Download the artifact and run the final gate:

```powershell
New-Item -ItemType Directory -Force .tmp\portfolio-10-proof
gh run download <run-id> --repo sundog358/wikidata-explorer --name production-proof-log --dir .tmp\portfolio-10-proof
npm run portfolio:10:check -- --dir=.tmp\portfolio-10-proof --require-check-log
```

The release is 10/10 only when `portfolio:10:check` passes with all of these files already present in the downloaded artifact:

- `production-proof.log`
- `hosted-ops-proof.log`
- `ag2-hosted-proof.log`
- `portfolio-10-check.log`
- `portfolio-evidence-summary.md`
- `portfolio-evidence-summary.json`

The downloaded summary must classify the bundle as `Portfolio 10/10 ready` with grade `10/10`.
It must include a `Hosted Targets` table showing the public app URL, hosted ops app URL, and hosted AG2 app/service URL pair; the final gate checks that table and the JSON target fields against the current proof logs.
It must also include an `Artifact Digests` table with byte counts and `SHA-256` values for each proof log. The final gate checks those existing JSON/Markdown summaries against the current log files before writing any refreshed local summary, so a bundle with missing or stale summaries is not accepted.
The final gate also compares `PASS hosted-ops-target app=...` and `PASS hosted-ag2-targets app=... service=...` against the final hosted proof PASS lines and rejects placeholder targets.
The `--require-check-log` flag also checks that `portfolio-10-check.log` exists, contains the final release-readiness grade, GitHub Actions provenance line, target evidence lines, artifact digest lines, and `PASS portfolio 10/10 readiness evidence` line, and does not contain failure lines or secret-shaped text.
For downloaded final artifacts, the summary must include `Provenance` fields for repository, workflow, run id, `Run URL`, ref, and commit SHA, and the run URL must point to the recorded run id so the artifact can be traced back to the exact proof run.
The downloaded artifact summaries are preserved during validation; any refreshed local summaries from the final check are written under `portfolio-10-local-check` unless `--out-dir` is passed.

## Expected Pass Lines

The proof bundle must include these evidence lines:

- `PASS production proof checks`
- `Production proof target: ...`
- `PASS hosted-ops-target app=...`
- `PASS workspace-store account=... isolated=true tasks=1 agentRuns=1`
- `PASS observability-receiver durable=true`
- `PASS hosted AG2 proof`
- `PASS hosted-ag2-targets app=... service=...`
- `PASS ag2-demo-readiness`
- `PASS grounded-entity-summary`
- `PASS observability-delivery durable=true`

`portfolio:evidence` and `portfolio:10:check` also reject common secret-shaped text such as provider keys, bearer tokens, and token assignments.

## If The Proof Fails

- Missing GitHub secrets: rerun `gh secret list --repo sundog358/wikidata-explorer` and confirm the four required secret names.
- Placeholder AG2 URL: replace `https://your-hosted-ag2-service.example` with the real HTTPS service URL.
- AG2 health failure: verify the AG2 service `/health` route, Docker health status, `AG2_SERVICE_TOKEN`, provider credentials, and `AG2_ENABLE_DOCS=false`.
- Workspace proof failure: verify `WORKSPACE_STORE_TOKEN`, `WORKSPACE_STORE_DIR`, and that `/api/workspaces` is deployed on the proof target.
- Observability durability failure: verify `API_OBSERVABILITY_RECEIVER_TOKEN` and `API_OBSERVABILITY_STORE_DIR` on the proof target.

Keep the goal open until the downloaded proof bundle passes `npm run portfolio:10:check -- --dir=<artifact-dir> --require-check-log`.
