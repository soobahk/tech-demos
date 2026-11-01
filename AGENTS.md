# Agent rules

These rules apply to every cloud agent working in this repository.

## Repository

- Never create a new GitHub repo. All demos live in this monorepo.

## Where you may edit

- Only add or edit files under `apps/<kebab-slug>/`.
- Append a row to the README demo table, and update `tracking/seen-bookmarks.json`, only when told to.
- Never touch other apps, `skills/`, or root config unless explicitly asked.

## Each app is self-contained

- `cd apps/<slug> && bun install && bun run dev` must work from a clean checkout.
- No root workspace coupling. Do not add a root workspace, shared lockfile, or imports that reach outside the app.

## Runtime and scaffolding

- Runtime, package manager, and scripts: Bun.
- Every app has its own `bunfig.toml` with `[install]` `minimumReleaseAge = 259200`. Create that file before any install.
- Start from an official scaffold via `bunx create-*`. Skip its initial install, then run `bun install`.
- UI defaults to shadcn/ui with a minimalist preset, added on demand.

## Plan before building

- Before building, read `apps/<slug>/PLAN.md` (written with the in-repo `skills/project-planning/` skill).
- If `PLAN.md` is missing, run that skill first and write `PLAN.md`.

## Scope

- Build for one user, an MVP of one working screen or flow.
- Prefer prebuilt over bespoke.
- Tests only for critical logic.
- Git hooks only for formatting and fast static checks.

## Pull requests

- One PR per demo.
- The PR is not valid unless it attaches both at least one screenshot and at least one video (screen recording) of the app actually running, showing the core flow working. Both are mandatory, not optional. Embed or link them in the PR description.
- Each app has its own short `README.md` with: what it demos, the source X post URL, run instructions, and known limits.
- Leave a short note in the PR about what was cut from the MVP.
