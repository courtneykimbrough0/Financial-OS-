# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

FutureFlow ("Recurring Transactions Forecast") is a Next.js PWA for tracking recurring income, fixed expenses, subscriptions, liabilities, and savings, and forecasting cash balance over time. It was scaffolded via Google AI Studio (`metadata.json`, `assets/.aistudio/`) as app name `ai-studio-applet`. All data is client-side only — there is no backend, database, or auth; everything persists to `localStorage` in the browser.

## Commands

```bash
npm run dev     # start Next.js dev server
npm run build   # production build
npm run start   # run the production build
npm run lint    # eslint . (flat config via eslint.config.mjs, extends eslint-config-next)
npm run clean   # next clean
```

There is no test suite configured in this repo (no test runner/scripts in `package.json`).

## Architecture

This is a **single-page, single-component application**. Almost all logic and UI lives in one file:

- `app/page.tsx` (~2,600 lines) — the entire `Home` client component: all state, all business logic (add/edit/delete/import/export transactions), and all rendered UI (dashboard, income/expenses/liabilities tabs, calendar, add-transaction wizards). There are no sub-components extracted — new UI/logic is typically added directly into this file, following existing patterns (see below) rather than by introducing a `components/` directory unless the file's size genuinely warrants a refactor.
- `lib/forecast.ts` — the data model and pure forecasting engine, decoupled from UI:
  - Types: `RecurringTransaction`, `TransactionCategory` (`income | fixed-expense | subscription | liability | savings`), `TransactionFrequency` (`daily | weekly | biweekly | semimonthly | monthly | quarterly | yearly`), `ForecastDay`.
  - `isTransactionOccurring(day, transaction)` decides whether a given transaction fires on a given date, per frequency (special-cased handling for month-end dates in `isMonthlyMatch`, quarterly/yearly built on top of it).
  - `generateForecast({ startDate, numberOfDays, initialBalance, transactions })` walks each day in range, sums incoming/outgoing transactions, and produces a running balance (`ForecastDay[]`). This is the core output the dashboard renders.
  - Dates are represented as local `YYYY-MM-DD` strings (`formatDateLocal`/`parseDateLocal`) to avoid timezone drift — always use these helpers rather than `Date` serialization directly.
- `lib/utils.ts` — `cn()` (clsx + tailwind-merge) for conditional class names, and `getDaysInRange()`.
- `hooks/use-mobile.ts` — `useIsMobile()`, a `matchMedia`-based responsive hook (768px breakpoint) used to branch mobile vs. desktop layout in `page.tsx`.
- `app/layout.tsx` / `app/globals.css` — root layout (Sora + Outfit Google fonts, dark theme forced via `className="dark"`), Tailwind v4 theme (`@theme`) and custom utilities (`scrollbar-thin`, `glow-cyan`, `glow-emerald`, `border-glow`).

### State & persistence

`page.tsx` hydrates from `localStorage` in a `useEffect` (guarded by a `mounted` flag to avoid SSR/hydration mismatches — nothing reads `localStorage` before `mounted` is true) under these keys:
- `futureflow_transactions`
- `futureflow_initial_balance`
- `futureflow_launch_date`

`saveToStorage(...)` is the single write path; state-updating handlers (`updateTransactions`, `updateInitialBalance`, `updateLaunchDate`) call it to keep React state and `localStorage` in sync. Import/export (`handleImportData`/`handleExportData`) round-trip the same shape as JSON files.

### UI structure

- Four tabs: `dashboard`, `income`, `expenses` (with sub-tabs: `all | fixed | subscriptions | savings`), `liabilities` — driven by `activeTab`/`expenseSubTab` state, with parallel mobile (top bar + drawer) and desktop (sidebar) nav rendered conditionally via `useIsMobile()`.
- Adding a transaction goes through a 3-step wizard (`wizardStep: 1 | 2 | 3`), with separate wizard flows/step content for income, expenses, and liabilities (search `wizardStep ===` in `page.tsx` to find each).
- Category to color conventions used throughout the UI: indigo = dashboard/general, emerald = income, rose = expenses, amber = liabilities.
- Animations use `motion/react` (Framer Motion); icons from `lucide-react`.

### Gemini / AI Studio scaffolding

`package.json` includes `@google/genai`, and `metadata.json`/`.env.example` reference a `GEMINI_API_KEY` and `MAJOR_CAPABILITY_SERVER_SIDE_GEMINI_API` — this is leftover AI Studio scaffolding. No code in the repo currently calls the Gemini API; treat any AI-feature work as new integration, not a modification of an existing call site.

### Next.js config notes (`next.config.ts`)

- `output: 'standalone'`.
- ESLint errors are ignored during `next build` (`eslint.ignoreDuringBuilds: true`) but TypeScript errors are **not** (`ignoreBuildErrors: false`) — run `npm run lint` separately since it won't block a build.
- `motion` is in `transpilePackages`.
- Dev-mode file watching can be disabled via `DISABLE_HMR=true` (used by the AI Studio agent environment to prevent flicker during automated edits) — don't rely on HMR firing if this env var is set.

## Conventions

- Path alias `@/*` maps to the repo root (see `tsconfig.json`), e.g. `@/lib/forecast`, `@/lib/utils`.
- `"use client"` is required at the top of `app/page.tsx` since it's fully interactive/stateful; keep new interactive code client-side unless deliberately introducing server components.
- TypeScript `strict` mode is on — no implicit `any`.
