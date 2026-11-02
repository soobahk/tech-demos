# Hindsight Memory Lab

## Goal

A single-page chat where one user tells an agent about themselves across sessions, with a side panel that shows what was retained and which memories the latest recall used.

## MVP

- Chat with an explicit New session control. The transcript resets; the memory bank does not.
- Memory panel grouped by type, new items highlighted, plus a "Recalled for this reply" section.
- Offline mode (default): in-memory mock, keyword and regex extraction, and a click-through demo script. No keys and no server.
- Live mode: Vite middleware calls `@vectorize-io/hindsight-client` at `VITE_HINDSIGHT_URL` (default `http://localhost:8888`), with connection status and a clear error when the server is down.
- One `MemoryBackend` (`retain`, `recall`, `list`, and `reflect` for the reply) implemented by the mock and the live adapter.

## Out of scope

Auth, multiple users, persistence beyond the browser session (offline) or the Hindsight server (live), mental models, deployment, mobile polish, and heavy tests.

## Tasks

1. Scaffold Vite + React + TypeScript, add `bunfig.toml`, install, then shadcn. Ship the offline chat, panel, and demo script.
2. Add the live adapter, mode toggle, connection status, and the Docker notes in the app README.
3. Unit-test mock extraction and recall. Keep formatting to a Prettier check script.

## Stack

- Vite + React + TypeScript — one screen, from `bunx create-vite`, with no router.
- Bun — install, scripts, and `bun test`.
- shadcn/ui nova preset — compact neutral components, added as needed. No preset is named "minimalist"; nova is that choice.
- `@vectorize-io/hindsight-client` inside Vite middleware — official API, same-origin browser calls, server URL stays off the page.
- Prettier — `format:check` only. No monorepo git hook, because that would edit root config.

## Deferred

- Clearing or paging a live bank from the UI.
- Opinion rows in live mode. Hindsight stores world facts, experiences, and observations; entities are linked names, not a fact type. The offline mock still extracts opinions.
- Streaming replies, auth, and deploy.
