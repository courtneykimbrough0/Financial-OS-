# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

"FutureFlow" (internal package name `ai-studio-applet`, product name in `metadata.json`: "Recurring Transactions Forecast") is a client-heavy Next.js PWA for forecasting personal cash flow. Users register recurring income, fixed expenses, subscriptions, liabilities, and savings transfers; the app projects a daily running balance forward from a starting date/balance. It was scaffolded/is deployed via Google AI Studio (see `metadata.json`, `assets/.aistudio/`), which auto-injects `GEMINI_API_KEY` and `APP_URL` env vars at runtime — note the `@google/genai` dependency is currently unused in app code (no API routes exist yet).

## Commands

```bash
npm run dev     # start Next.js dev server
npm run build   # production build
npm run start   # run production build
npm run lint    # eslint (flat config in eslint.config.mjs, extends eslint-config-next)
npm run clean   # next clean
```

There is no test suite/framework configured in this repo (no test script, no Jest/Vitest/Playwright dependency).

## Architecture

This is a Next.js App Router project, but nearly all logic lives in two files:

- **`lib/forecast.ts`** — the forecasting domain model and engine. Defines `RecurringTransaction` (category: `income | fixed-expense | subscription | liability | savings`; frequency: `daily | weekly | biweekly | semimonthly | monthly | quarterly | yearly`) and `ForecastDay`. `generateForecast({ startDate, numberOfDays, initialBalance, transactions })` walks each calendar day, uses `isTransactionOccurring` (which dispatches to per-frequency matchers like `isMonthlyMatch`/`isQuarterlyMatch`/`isYearlyMatch`) to decide which transactions fire that day, and accumulates a running balance into an array of `ForecastDay`. All dates are handled as local `YYYY-MM-DD` strings via `formatDateLocal`/`parseDateLocal` (not UTC/ISO) to avoid timezone drift — always use these helpers rather than `Date#toISOString()` when working with transaction dates.

- **`app/page.tsx`** — a single ~2600-line client component (`"use client"`) that is the entire application UI: navigation (desktop sidebar / mobile drawer+bottom nav), the dashboard (KPI cards + calendar), and three management screens for Income, Expenses & Savings, and Liabilities, plus the add/edit transaction form. It's organized as one large `Home()` component with clearly commented sections (search for `TAB 1: DASHBOARD`, `TAB 2: INCOME MANAGER`, `TAB 3: EXPENSES & SAVINGS MANAGER`, `TAB 4: LIABILITIES MANAGER`) rather than split into subcomponents — when editing a specific screen, jump to its comment marker instead of reading top to bottom.

  Key state/data flow in `page.tsx`:
  - All persistence is `localStorage` only (keys `futureflow_transactions`, `futureflow_initial_balance`, `futureflow_launch_date`) — there is no backend/database. `saveToStorage`/`updateTransactions`/`updateInitialBalance`/`updateLaunchDate` are the single write path; state is hydrated from `localStorage` in a `useEffect` gated by a `mounted` flag (SSR renders a loading state to avoid hydration mismatches).
  - Two independent forecast timelines are computed via `generateForecast` and memoized: `forecastTimeline` (short ranges: week/two-weeks/month/quarter, driven by `forecastRange`) and `calendarForecastTimeline` (a wider ~3-month window purely to back the traditional month-grid calendar lookup by `dateStr`). Don't conflate them — the month grid always reads from `calendarForecastTimeline`/`calendarCells`, not `forecastTimeline`.
  - `activeMetrics` (income/expenses/savings/liabilities/spending/endingBalance) is derived differently depending on `forecastRange`: for week/two-weeks/quarter it sums across `forecastTimeline`, for month it sums across the currently-visible `calendarCells` — keep this branch in sync if you change either timeline.
  - JSON export/import (`handleExportData`/`handleImportData`) round-trips `{ version, initialBalance, launchDateStr, transactions }` as the backup file format.

- **`hooks/use-mobile.ts`** and **`lib/utils.ts`** (`cn` clsx/tailwind-merge helper, `getDaysInRange`) are the only other non-trivial modules.

## Conventions

- Styling is Tailwind CSS v4 (config lives in `app/globals.css` via `@theme`/`@utility`, not a `tailwind.config` file) with a dark, "space-age" zinc/indigo aesthetic; `lucide-react` for icons and `motion/react` (Motion, formerly Framer Motion) for transitions.
- Fonts: Sora (`--font-sora`, display font) and Outfit (`--font-outfit`, sans/body) loaded via `next/font/google` in `app/layout.tsx`.
- Path alias `@/*` maps to the repo root (see `tsconfig.json`).
- `next.config.ts` sets `output: 'standalone'` and disables ESLint during builds (`eslint.ignoreDuringBuilds: true`), but keeps TypeScript build errors enabled — `npm run build` will still fail on type errors, so type-check changes even though lint isn't build-blocking.
