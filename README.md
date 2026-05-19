# bestemeraldcoast-agency

Multi-site media + agency monorepo for the Best Emerald Coast network (8 editorial domains, an ops console, a newsletter app, and a local Claude Code agent runtime).

This README is intentionally minimal. The operating contract, ADRs, and per-commit plan live under `docs/dev/`:

- `docs/dev/claude/CLAUDE.md` — operating contract (read first)
- `docs/dev/MASTER-bec-architecture-decisions.md` — 41 ADRs (the *what* and *why*)
- `docs/dev/MASTER-bec-project-plan.md` — Phase 0–6 implementation plan
- `docs/dev/status/next-step.md` — current Phase + Commit handoff

## Quick start

```bash
nvm use            # Node 22 LTS (see .nvmrc)
pnpm install
pnpm turbo build
```

## Agent runtime session

To run the local Claude Code agent runtime (Scout, Diagnoser, `/scout`, etc.),
**always launch via the helper** — never plain `claude`:

```bash
./scripts/dev-session.sh    # works from anywhere in the repo
```

It reads `.env` from the repo root (splitting on the first `=` so the `&` in
the Neon connection strings can't truncate `DATABASE_URL_UNPOOLED`), validates
the Scout-required vars, then launches Claude scoped to `agency/` so
`agency/.mcp.json` (`postgres-ro`, `google-maps`), the `/scout` command, and
the agent subagents actually load. Launching plain `claude` from the repo root
silently loses all three. See `docs/dev/claude/CLAUDE.md` § Session Launch.

## Workspace layout

- `apps/` — `editorial`, `ops-console`, `newsletter-public` (Next.js apps)
- `packages/` — shared libraries (`db`, `ui`, `email`, `content`, `agents`, `analytics`, `storage`, `logger`, `config`, `config-eslint`, `config-tsconfig`)
- `agency/` — Claude Code agent runtime (local Mac; see ADR-004)
- `infra/` — Vercel + Docker Compose configs
- `docs/` — ADRs, project plan, runbooks, status files
