# Hindsight Memory Lab

A single-page chat that shows [Hindsight](https://github.com/vectorize-io/hindsight) retain, recall, and reflect. One person tells an agent about themselves across sessions. The side panel lists what was kept (facts, experiences, opinions, entities) and which memories the latest recall used.

Source post: https://x.com/HermesWatcher/status/2114492238659305561

## Run offline (default)

No API key and no Docker.

```bash
cd apps/hindsight-memory-lab
bun install
bun run dev
```

Open http://localhost:5173. Leave the toggle on Offline and click **Play demo script**. The script talks through two sessions. The bank stays put when the transcript clears.

```bash
bun test
bun run format:check
```

## Run live

Live mode calls a local Hindsight server through `@vectorize-io/hindsight-client`. The browser only talks to this app (`/api/memory/*`). The dev server reads `VITE_HINDSIGHT_URL` (default `http://localhost:8888`). Copy `.env.example` to `.env` to change it.

The server needs an LLM key. Docker, from the [install docs](https://hindsight.vectorize.io/developer/installation):

```bash
export OPENAI_API_KEY=sk-xxx
docker run -it --pull always --name hindsight --restart unless-stopped --shm-size=1g \
  -p 8888:8888 -p 9999:9999 \
  -e HINDSIGHT_API_LLM_API_KEY=$OPENAI_API_KEY \
  -v hindsight-data:/home/hindsight/.pg0 \
  ghcr.io/vectorize-io/hindsight:latest
```

API on http://localhost:8888, control UI on http://localhost:9999. Then flip the toggle to Live. The badge shows the API version when the server answers, and a banner when it does not. The demo bank id is `memory-lab`.

## Known limits

- Offline mode is an in-memory keyword and regex mock. It resets on refresh.
- Opinions are an offline extraction. Live Hindsight stores world facts, experiences, and observations. Entities are names linked to those memories.
- The demo script always runs in offline mode.
- Live replies can include markdown, shown as plain text.
- One user, no auth, no deploy, no mental models or knowledge pages.
