# Alpha launch plan

Reference doc for taking Financial OS from a local-only prototype (browser
`localStorage`, no accounts, no backend) to a Vercel-hosted, Supabase-backed
app ready for an unpaid alpha test. Linked from each of the GitHub issues
below — treat this file as the source of truth if an issue thread goes
stale.

## Workflow

- Claude (senior engineer) reviews the codebase and writes GitHub Issues
  with concrete acceptance criteria and file/line pointers.
- Antigravity (implementer) works from an issue, commits to a branch, and
  opens a PR referencing that issue.
- Claude reviews the PR diff on GitHub (inline comments, occasional small
  fixup commits) before it merges.
- Courtney has final merge approval.

Issues, not chat copy/paste, are the instruction hand-off — they're
versioned, diffable, and line up with the PR review tools already in use.

## Phases

1. **Bug-fix pass** — small, low-risk, fixes real correctness bugs found in
   review. Do this before touching Supabase so the migration isn't carrying
   known bugs forward.
2. **Supabase auth + schema + RLS** — apply `supabase/schema.sql`, add
   sign-in, gate the app behind a session. Security-critical; gets the
   closest review.
3. **Data-layer migration + component decomposition** — replace the
   `localStorage` read/writes with Supabase calls, and split the single
   8,000+ line `app/page.tsx` into components along the way (doing both
   together avoids migrating persistence logic twice).
4. **Vercel cleanup + deploy** — remove Google AI Studio/Cloud Run leftovers,
   set environment variables, deploy, smoke-test end to end.
5. **Alpha polish (optional)** — lightweight in-app feedback capture.

## Environment variables

Set these in Vercel (Project Settings → Environment Variables) and in a
local `.env.local` for development — never commit either:

- `NEXT_PUBLIC_SUPABASE_URL` — from Supabase Project Settings → API Keys.
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` — from the same page, the
  "Publishable key" (`sb_publishable_...`). This replaced the older "anon
  public" key naming — Supabase now shows Publishable/Secret keys by
  default, with the legacy anon/service_role keys under a "Legacy keys"
  tab. Either generation works the same way; use whichever your project
  shows as the primary key.

Do not use the Supabase Secret key (`sb_secret_...`, formerly called
`service_role`) anywhere in this app — every table is protected by Row
Level Security scoped to `auth.uid()`, so the Publishable key is
sufficient and safe to expose to the browser. The Secret key bypasses RLS
entirely and has no legitimate use here.

## Package manager

This repo standardizes on **bun** (`bun.lock` is the committed lockfile;
`bun install` / `bun run build` / `bun run lint` all pass clean as of this
writing). Do not introduce a second lockfile (e.g. `pnpm-lock.yaml`,
`package-lock.json`, `yarn.lock`) — Vercel auto-detects the package manager
from whichever lockfile is present, and more than one makes that detection
ambiguous.
