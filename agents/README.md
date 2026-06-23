# Wikidata Explorer AG2 Service

This directory contains the optional containerized AG2 runtime. The public Vercel app can ship with AI disabled, then call this service later by setting `AG2_SERVICE_URL`, `AG2_SERVICE_TOKEN`, and the AI feature flags.

## Local Container

Use a random shared token of at least 32 characters. The same value must be present in the Next.js environment and in the AG2 service environment.

```bash
AG2_SERVICE_TOKEN="replace-with-a-random-32-plus-character-secret"
docker build -f agents/Dockerfile -t wikidata-explorer-ag2 .
docker run --rm -p 8000:8000 --env-file .env -e AG2_SERVICE_TOKEN="$AG2_SERVICE_TOKEN" wikidata-explorer-ag2
```

Health check:

```bash
curl http://localhost:8000/health
```

Authenticated run requests must include the bearer token:

```bash
curl -X POST http://localhost:8000/run \
  -H "authorization: Bearer $AG2_SERVICE_TOKEN" \
  -H "content-type: application/json" \
  -d '{"payload":{"mode":"chat","messages":[{"role":"user","content":"hello"}]}}'
```

Next.js integration:

```bash
NEXT_PUBLIC_ENABLE_AI_AGENTS=true
ENABLE_AI_AGENTS=true
AG2_SERVICE_URL=http://localhost:8000
AG2_SERVICE_TOKEN=replace-with-a-random-32-plus-character-secret
```

## Production Notes

- Keep `OPENAI_API_KEY` only in the AG2 service host when using `AG2_SERVICE_URL`.
- Keep `AG2_SERVICE_TOKEN` secret and shared only between Vercel and the AG2 host.
- Prefer private networking between Vercel and the container host when available.
- Keep `AG2_ENABLE_DOCS=false` unless intentionally debugging a private deployment.
- Set `AI_AGENT_RATE_LIMIT_MAX` and `AI_AGENT_RATE_LIMIT_WINDOW_MS` on the Next.js deployment for public AI-enabled demos.

The service keeps provider credentials in the container environment, runs as a non-root user, disables FastAPI docs by default, and exposes only a bounded, bearer-token-protected `/run` endpoint for the validated payloads already used by the Next.js API routes.

## Contract Proof

Run the mocked remote bridge contract without provider credentials:

```bash
node scripts/test-ag2-remote-service.mjs
```