# Wikidata Explorer AG2 Service

This directory contains the optional containerized AG2 runtime. The public Vercel app can ship with AI disabled, then call this service later by setting `AG2_SERVICE_URL` and enabling the AI feature flags.

## Local Container

```bash
docker build -f agents/Dockerfile -t wikidata-explorer-ag2 .
docker run --rm -p 8000:8000 --env-file .env wikidata-explorer-ag2
```

Health check:

```bash
curl http://localhost:8000/health
```

Next.js integration:

```bash
NEXT_PUBLIC_ENABLE_AI_AGENTS=true
ENABLE_AI_AGENTS=true
AG2_SERVICE_URL=http://localhost:8000
```

The service keeps provider credentials in the container environment and exposes only a bounded `/run` endpoint for the validated payloads already used by the Next.js API routes.
