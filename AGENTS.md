# AGENTS.md

This is the single source of truth for any AI coding agent (Claude, Antigravity/Gemini, or otherwise) working in this repository. `CLAUDE.md` and `GEMINI.md` exist only as pointers to this file for tools that look for them by a specific name — don't duplicate instructions there. If you're updating agent instructions, update this file.

## What this is

Financial OS — a personal cash-flow forecasting app: recurring income/expenses/subscriptions/liabilities/savings, a calendar/analytics dashboard, and a debt payoff planner (avalanche/snowball). Currently being taken from a local-only prototype to a Vercel-hosted, Supabase-backed app for an unpaid alpha test.

## Stack

- Next.js 15 (App Router), React 19, TypeScript (strict mode)
- Tailwind CSS v4 (CSS-based config in `app/globals.css`, no `tailwind.config.*`)
- Recharts for charts, `motion` (Framer Motion successor) for animation, `lucide-react` for icons
- Supabase (Postgres + Auth) for the backend, being wired up now — see current state below
- Deploys on Vercel

## Package manager: bun, always

This repo standardizes on **bun**. Use `bun install`, `bun run dev`, `bun run build`, `bun run lint`. Never introduce a second lockfile (`pnpm-lock.yaml`, `package-lock.json`, `yarn.lock`) or workspace config for another package manager — Vercel auto-detects the package manager from whichever lockfile is present, and more than one makes that detection ambiguous and has already caused a build break once during this project's alpha prep.

Before opening a PR, `bun run build` and `bun run lint` must both pass with zero errors.

## Repo layout

- `app/page.tsx` — main UI. Currently a single large client component; being decomposed into components as part of the Supabase migration (see current state below) rather than as a standalone refactor.
- `lib/forecast.ts` — the forecasting engine: recurring-transaction date math, forecast generation, and debt payoff simulation (avalanche/snowball). Pure functions, no UI, no I/O — keep it that way.
- `lib/utils.ts` — small shared helpers (`cn()`, date-range helper).
- `supabase/schema.sql` — the Postgres schema + Row Level Security policies. Run this in the Supabase SQL Editor when setting up a new project; it's the source of truth for the data model.
- `docs/ALPHA_LAUNCH.md` — the phased plan for the Supabase/Vercel migration, environment variables, and workflow. Read this before starting work on auth, data persistence, or deployment.

## Current state / in-progress migration

The app has no backend yet in most respects: data lives in browser `localStorage`, there is no user concept, no auth, no network calls. This is being migrated to Supabase (Postgres + Auth, Row Level Security scoped to `auth.uid()`) and deployed on Vercel. The phased plan and its GitHub issues are the actual task tracker — see `docs/ALPHA_LAUNCH.md` and the repo's open issues for what's done and what's next. Don't assume this section is current; check the issues.

## Hard rules

- **Never use the Supabase `service_role` key anywhere in this app** — not in env files, not for convenience, not even in a script. Every table's RLS policy is scoped to `auth.uid() = user_id`, and the anon public key is sufficient and safe to expose to the browser. If a task seems to need the service role key, stop and flag it rather than using it.
- **Never commit `.env*` files** (only `.env.example`, which itself should contain no real values). `.gitignore` already excludes them — don't work around that.
- **Never embed credentials in a git remote URL** (`https://user:TOKEN@github.com/...`). Use a credential helper (e.g. `git config --global credential.helper osxkeychain` on macOS) so tokens are never printed by `git remote -v` or similar commands, and never paste a raw token into chat, logs, or command output.
- **Don't merge your own PRs.** Open the PR, then wait for review — either from a human or from another agent acting as reviewer.

## Workflow

Work is tracked as GitHub Issues, one per unit of work, with acceptance criteria and file/line pointers. To pick up a task: branch off `main`, implement against the issue's acceptance criteria, verify `bun run build` and `bun run lint` pass clean, push the branch, and open a PR against `main` with `Closes #<issue>` in the description. Don't merge your own PR — leave it for review.
