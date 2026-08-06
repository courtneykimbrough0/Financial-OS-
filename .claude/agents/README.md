# Agent roles

This directory defines the AI roles working on Financial OS, so a new session can be told "you're the X" and read one short file instead of the whole project history being re-explained in chat. This exists specifically to keep context usage down — each file is a role brief, not a project history.

## How to use this

At the start of a new session, say which role it's playing and point it at the matching file, e.g.:

> You're the Senior Engineer. Read `.claude/agents/senior-engineer.md` and go.

The role file tells that session what it owns, what it must never do, and — critically — where to look for *current* state (open issues, `AGENTS.md`, `supabase/schema.sql`) instead of relying on stale memory from an earlier conversation.

## Roles

| File | Role | Summary |
|---|---|---|
| `senior-engineer.md` | Senior Engineer | Technical lead. Writes issues, reviews and merges PRs, verifies production state directly, diagnoses incidents, owns architectural calls. The most load-bearing role — start here if unsure which role applies. |
| `implementer.md` | Implementer | Builds exactly one GitHub issue's acceptance criteria, opens a PR, stops. Doesn't design, doesn't merge. |
| `db-engineer.md` | DB Engineer | Applies exact live-Supabase migrations handed to it by the Senior Engineer. Doesn't design migrations. |

Courtney (product owner) isn't a file here — she directs priorities and tests the app; these roles exist to serve her without needing to re-explain the whole system every time.

## Design rule for these files

**Point at the current source of truth, don't embed a snapshot of it.** `AGENTS.md` is the single source of truth for stack/conventions/hard rules; GitHub issues are the source of truth for current work. These role files should stay stable and short — if you find yourself copying the banned-words list, the schema, or a phase plan into one of these files, stop and link to the real source instead. A role file that goes stale is worse than no role file, because it'll be trusted.

Keep each role file lean enough to read in one pass. If a role's responsibilities grow enough to need real elaboration, that's a sign the role should split, not that this file should get longer.
