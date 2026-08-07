"use client";

import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Wallet,
  PiggyBank,
  CreditCard,
  ArrowLeft,
  ArrowDownRight,
  ArrowUpRight,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  TrendingDown,
  Circle,
} from "lucide-react";
import { useFinancialData } from "./FinancialOSContext";
import { Account, ForecastDay, formatDateLocal } from "@/lib/forecast";

const BUFFER = 100; // $100 amber threshold for both cash and available-credit signals

// ─── helpers ─────────────────────────────────────────────────────────────────

function accountIcon(acc: Account) {
  if (acc.type === "savings") return <PiggyBank className="w-4 h-4" />;
  if (acc.type === "checking") return <Wallet className="w-4 h-4" />;
  return <CreditCard className="w-4 h-4" />;
}

function fmt(n: number) {
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtShort(dateStr: string) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// Which direction does a transaction flow relative to a cash account?
function txFlow(
  t: ForecastDay["transactions"][number],
  accId: string
): { direction: "in" | "out"; amount: number } | null {
  const item = t.item;
  const amt = Math.abs(t.amount);
  if (item.category === "income" && item.accountId === accId) return { direction: "in", amount: amt };
  if (
    (item.category === "fixed-expense" || item.category === "subscription") &&
    item.accountId === accId
  )
    return { direction: "out", amount: amt };
  if (item.category === "liability" && item.fundingAccountId === accId)
    return { direction: "out", amount: amt };
  if (item.category === "savings") {
    if (item.fundingAccountId === accId) return { direction: "out", amount: amt };
    if (item.targetAccountId === accId) return { direction: "in", amount: amt };
  }
  if (item.category === "transfer") {
    if (item.fundingAccountId === accId) return { direction: "out", amount: amt };
    if (item.targetAccountId === accId) return { direction: "in", amount: amt };
  }
  return null;
}

// ─── cash account health ──────────────────────────────────────────────────────

interface AccountHealth {
  kind: "cash";
  account: Account;
  currentBalance: number;
  troughBalance: number;
  troughDateStr: string;
  nextDepositAmount: number | null;
  nextDepositDateStr: string | null;
  signal: "green" | "amber" | "red";
}

function computeHealth(acc: Account, timeline: ForecastDay[]): AccountHealth {
  // calendarForecastTimeline starts from the 1st of whatever month is being
  // viewed, which is frequently in the past relative to today (e.g. viewing
  // the current month on the 15th) — bound to today-forward so a dip that
  // already resolved can't get reported as the current trough.
  const todayStr = formatDateLocal(new Date());
  const relevant = timeline.filter(
    (d) => d.accountBalances[acc.id] !== undefined && d.dateStr >= todayStr
  );
  const currentBalance = acc.balance;

  if (relevant.length === 0) {
    return {
      kind: "cash",
      account: acc,
      currentBalance,
      troughBalance: currentBalance,
      troughDateStr: "",
      nextDepositAmount: null,
      nextDepositDateStr: null,
      signal: currentBalance >= BUFFER ? "green" : currentBalance >= 0 ? "amber" : "red",
    };
  }

  // Compute next deposit FIRST — used to scope the trough scan below.
  let nextDepositAmount: number | null = null;
  let nextDepositDateStr: string | null = null;
  for (const day of relevant) {
    for (const t of day.transactions) {
      const flow = txFlow(t, acc.id);
      if (flow && flow.direction === "in") {
        nextDepositAmount = flow.amount;
        nextDepositDateStr = day.dateStr;
        break;
      }
    }
    if (nextDepositDateStr) break;
  }

  // Trough: lowest projected balance strictly BEFORE the next deposit lands.
  // Scanning the full 3-month window would flag a distant dip that doesn't
  // affect the current pay cycle; stopping at the next deposit gives the user
  // the worst-case balance they'll actually face before relief arrives.
  let troughBalance = currentBalance;
  let troughDateStr = relevant[0].dateStr;
  for (const day of relevant) {
    if (nextDepositDateStr && day.dateStr >= nextDepositDateStr) break;
    const bal = day.accountBalances[acc.id];
    if (bal < troughBalance) {
      troughBalance = bal;
      troughDateStr = day.dateStr;
    }
  }

  const signal: AccountHealth["signal"] =
    troughBalance < 0 ? "red" : troughBalance < BUFFER ? "amber" : "green";

  return {
    kind: "cash",
    account: acc,
    currentBalance,
    troughBalance,
    troughDateStr,
    nextDepositAmount,
    nextDepositDateStr,
    signal,
  };
}

interface DayEntry {
  dateStr: string;
  items: { title: string; direction: "in" | "out"; amount: number; category: string }[];
  closingBalance: number;
}

function buildDrillDown(acc: Account, timeline: ForecastDay[]): DayEntry[] {
  return timeline
    .filter((d) => d.accountBalances[acc.id] !== undefined)
    .map((day) => {
      const items: DayEntry["items"] = [];
      for (const t of day.transactions) {
        const flow = txFlow(t, acc.id);
        if (flow) {
          items.push({
            title: t.item.title,
            direction: flow.direction,
            amount: flow.amount,
            category: t.item.category,
          });
        }
      }
      return { dateStr: day.dateStr, items, closingBalance: day.accountBalances[acc.id] };
    })
    .filter((d) => d.items.length > 0);
}

// ─── shared ───────────────────────────────────────────────────────────────────

type RowHealth = AccountHealth;

function rowId(h: RowHealth): string {
  return h.account.id;
}

function rowName(h: RowHealth): string {
  return h.account.name;
}

function SignalDot({ signal }: { signal: RowHealth["signal"] }) {
  return (
    <span
      className={`w-2 h-2 rounded-full shrink-0 ${
        signal === "green"
          ? "bg-emerald-400"
          : signal === "amber"
          ? "bg-amber-400"
          : "bg-red-400 animate-pulse"
      }`}
    />
  );
}

function ChipSwitcher({
  allRows,
  activeId,
  onSwitch,
}: {
  allRows: RowHealth[];
  activeId: string;
  onSwitch: (id: string) => void;
}) {
  return (
    <div className="flex gap-2 flex-wrap">
      {allRows.map((h) => {
        const id = rowId(h);
        return (
          <button
            key={id}
            type="button"
            onClick={() => onSwitch(id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold font-mono border transition-all cursor-pointer ${
              id === activeId
                ? "bg-zinc-800 text-white border-white/15 shadow-md"
                : "bg-black/40 text-zinc-500 border-white/5 hover:text-zinc-200 hover:border-white/10"
            }`}
          >
            <SignalDot signal={h.signal} />
            {rowName(h)}
          </button>
        );
      })}
    </div>
  );
}

// ─── cash strip row ───────────────────────────────────────────────────────────

function StripRow({ health, onClick }: { health: AccountHealth; onClick: () => void }) {
  const {
    account,
    currentBalance,
    troughBalance,
    troughDateStr,
    nextDepositAmount,
    nextDepositDateStr,
    signal,
  } = health;

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left p-4 sm:p-5 bg-zinc-900/40 border border-white/5 hover:border-white/15 hover:bg-zinc-900/60 rounded-2xl transition-all group flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-0"
    >
      {/* Account name + type */}
      <div className="flex items-center gap-3 sm:w-56 shrink-0">
        <SignalDot signal={signal} />
        <div
          className={`p-2 rounded-xl border ${
            account.type === "savings"
              ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/20"
              : account.type === "checking"
              ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
              : "bg-zinc-800 text-zinc-400 border-white/10"
          }`}
        >
          {accountIcon(account)}
        </div>
        <div>
          <div className="text-sm font-bold text-zinc-100 leading-tight">{account.name}</div>
          <div className="text-[10px] font-mono text-zinc-500 uppercase mt-0.5">{account.type}</div>
        </div>
      </div>

      {/* Current balance */}
      <div className="sm:flex-1 sm:text-center">
        <div className="text-[10px] font-mono text-zinc-500 uppercase">Now</div>
        <div className="text-sm font-bold font-mono text-zinc-200 mt-0.5">${fmt(currentBalance)}</div>
      </div>

      {/* Trough */}
      <div className="sm:flex-1 sm:text-center">
        <div className="text-[10px] font-mono text-zinc-500 uppercase">Lowest</div>
        <div
          className={`text-sm font-bold font-mono mt-0.5 ${
            signal === "red" ? "text-red-400" : signal === "amber" ? "text-amber-400" : "text-zinc-300"
          }`}
        >
          ${fmt(troughBalance)}
        </div>
        {troughDateStr && (
          <div className="text-[9px] font-mono text-zinc-600 mt-0.5">{fmtShort(troughDateStr)}</div>
        )}
      </div>

      {/* Next deposit */}
      <div className="sm:flex-1 sm:text-center">
        <div className="text-[10px] font-mono text-zinc-500 uppercase">Next In</div>
        {nextDepositAmount !== null && nextDepositDateStr ? (
          <>
            <div className="text-sm font-bold font-mono text-emerald-400 mt-0.5">
              +${fmt(nextDepositAmount)}
            </div>
            <div className="text-[9px] font-mono text-zinc-600 mt-0.5">
              {fmtShort(nextDepositDateStr)}
            </div>
          </>
        ) : (
          <div className="text-sm font-mono text-zinc-600 mt-0.5">—</div>
        )}
      </div>

      {/* Signal badge */}
      <div className="sm:w-28 sm:text-right flex sm:justify-end items-center gap-2">
        <span
          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold font-mono uppercase border ${
            signal === "green"
              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
              : signal === "amber"
              ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
              : "bg-red-500/10 text-red-400 border-red-500/20"
          }`}
        >
          {signal === "green" ? "On Track" : signal === "amber" ? "Low" : "Shortfall"}
        </span>
        <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-300 transition-colors shrink-0" />
      </div>
    </button>
  );
}

// ─── cash drill-down ──────────────────────────────────────────────────────────

function DrillDown({
  health,
  allRows,
  onBack,
  onSwitch,
}: {
  health: AccountHealth;
  allRows: RowHealth[];
  onBack: () => void;
  onSwitch: (id: string) => void;
}) {
  const { calendarForecastTimeline } = useFinancialData();
  const days = useMemo(
    () => buildDrillDown(health.account, calendarForecastTimeline),
    [health.account, calendarForecastTimeline]
  );

  const catColor = (cat: string) => {
    if (cat === "income") return "text-emerald-400";
    if (cat === "savings") return "text-cyan-400";
    if (cat === "liability") return "text-amber-400";
    return "text-sky-400";
  };

  return (
    <motion.div
      key={health.account.id}
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -24 }}
      transition={{ duration: 0.18 }}
      className="flex flex-col gap-4"
    >
      {/* Back + account name */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="p-1.5 rounded-lg hover:bg-white/5 text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-2">
          <div
            className={`p-1.5 rounded-lg border ${
              health.account.type === "savings"
                ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/20"
                : "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
            }`}
          >
            {accountIcon(health.account)}
          </div>
          <div>
            <h3 className="text-base font-bold text-white">{health.account.name}</h3>
            <div className="text-[10px] font-mono text-zinc-500 uppercase">{health.account.type}</div>
          </div>
        </div>
        <div className="ml-auto">
          <SignalDot signal={health.signal} />
        </div>
      </div>

      {/* Chip switcher — spans all accounts and credit lines */}
      <ChipSwitcher allRows={allRows} activeId={health.account.id} onSwitch={onSwitch} />

      {/* Summary strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 bg-zinc-900/40 border border-white/5 rounded-2xl">
          <div className="text-[9px] font-mono text-zinc-500 uppercase">Current</div>
          <div className="text-sm font-bold font-mono text-zinc-200 mt-1">
            ${fmt(health.currentBalance)}
          </div>
        </div>
        <div className="p-3.5 bg-zinc-900/40 border border-white/5 rounded-2xl">
          <div className="text-[9px] font-mono text-zinc-500 uppercase">Lowest Projected</div>
          <div
            className={`text-sm font-bold font-mono mt-1 ${
              health.signal === "red"
                ? "text-red-400"
                : health.signal === "amber"
                ? "text-amber-400"
                : "text-zinc-200"
            }`}
          >
            ${fmt(health.troughBalance)}
          </div>
          {health.troughDateStr && (
            <div className="text-[9px] font-mono text-zinc-600 mt-0.5">
              {fmtShort(health.troughDateStr)}
            </div>
          )}
        </div>
        <div className="p-3.5 bg-zinc-900/40 border border-white/5 rounded-2xl">
          <div className="text-[9px] font-mono text-zinc-500 uppercase">Next Deposit</div>
          {health.nextDepositAmount !== null ? (
            <div className="text-sm font-bold font-mono text-emerald-400 mt-1">
              +${fmt(health.nextDepositAmount)}
            </div>
          ) : (
            <div className="text-sm font-mono text-zinc-600 mt-1">None scheduled</div>
          )}
          {health.nextDepositDateStr && (
            <div className="text-[9px] font-mono text-zinc-600 mt-0.5">
              {fmtShort(health.nextDepositDateStr)}
            </div>
          )}
        </div>
        <div
          className={`p-3.5 rounded-2xl border ${
            health.signal === "green"
              ? "bg-emerald-500/5 border-emerald-500/15"
              : health.signal === "amber"
              ? "bg-amber-500/5 border-amber-500/15"
              : "bg-red-500/5 border-red-500/15"
          }`}
        >
          <div className="text-[9px] font-mono text-zinc-500 uppercase">Status</div>
          <div
            className={`text-sm font-bold font-mono mt-1 flex items-center gap-1.5 ${
              health.signal === "green"
                ? "text-emerald-400"
                : health.signal === "amber"
                ? "text-amber-400"
                : "text-red-400"
            }`}
          >
            {health.signal === "green" ? (
              <CheckCircle2 className="w-3.5 h-3.5" />
            ) : health.signal === "amber" ? (
              <AlertTriangle className="w-3.5 h-3.5" />
            ) : (
              <TrendingDown className="w-3.5 h-3.5" />
            )}
            {health.signal === "green"
              ? "On Track"
              : health.signal === "amber"
              ? "Running Low"
              : "Shortfall"}
          </div>
        </div>
      </div>

      {/* Day-by-day activity */}
      <div className="bg-zinc-900/30 border border-white/10 rounded-[2rem] p-4 sm:p-5 flex flex-col gap-0 overflow-hidden">
        <h4 className="text-xs font-bold font-mono text-zinc-400 uppercase mb-3 px-1">
          Upcoming Activity
        </h4>
        {days.length === 0 ? (
          <div className="py-8 text-center text-zinc-600 text-xs font-mono italic">
            No scheduled activity in this window.
          </div>
        ) : (
          <div className="flex flex-col divide-y divide-white/5">
            {days.map((d) => {
              const isLow = d.closingBalance < BUFFER && d.closingBalance >= 0;
              const isNeg = d.closingBalance < 0;
              return (
                <div key={d.dateStr} className="py-3 px-1 flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold font-mono text-zinc-500 uppercase">
                      {fmtShort(d.dateStr)}
                    </span>
                    <span
                      className={`text-xs font-bold font-mono ${
                        isNeg ? "text-red-400" : isLow ? "text-amber-400" : "text-zinc-300"
                      }`}
                    >
                      ${fmt(d.closingBalance)}
                      {(isNeg || isLow) && (
                        <AlertTriangle className="inline w-3 h-3 ml-1 align-[-1px]" />
                      )}
                    </span>
                  </div>
                  {d.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between pl-2 text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {item.direction === "in" ? (
                          <ArrowUpRight className="w-3 h-3 text-emerald-400 shrink-0" />
                        ) : (
                          <ArrowDownRight className="w-3 h-3 text-zinc-500 shrink-0" />
                        )}
                        <span className="text-zinc-400 truncate">{item.title}</span>
                        <span className={`text-[9px] font-mono shrink-0 ${catColor(item.category)}`}>
                          {item.category.replace("-", " ")}
                        </span>
                      </div>
                      <span
                        className={`font-mono font-bold shrink-0 ml-2 ${
                          item.direction === "in" ? "text-emerald-400" : "text-zinc-400"
                        }`}
                      >
                        {item.direction === "in" ? "+" : "-"}${fmt(item.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ─── main export ─────────────────────────────────────────────────────────────

export const AccountHealthView: React.FC = () => {
  const { accounts, calendarForecastTimeline, loading } = useFinancialData();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const allHealth = useMemo(
    () => accounts.map((acc) => computeHealth(acc, calendarForecastTimeline)),
    [accounts, calendarForecastTimeline]
  );

  const allRows: RowHealth[] = allHealth;

  const selectedCashHealth = selectedId
    ? (allHealth.find((h) => h.account.id === selectedId) ?? null)
    : null;

  if (loading) {
    return (
      <div className="py-16 text-center text-zinc-600 text-xs font-mono animate-pulse">
        Loading account data…
      </div>
    );
  }

  if (accounts.length === 0) {
    return (
      <div className="py-16 text-center text-zinc-600 text-xs font-mono">
        No accounts found. Add an account to see your cash flow outlook.
      </div>
    );
  }

  return (
    <motion.div
      key="flow-view"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.2 }}
      className="flex flex-col gap-4"
    >
      <AnimatePresence mode="wait">
        {selectedCashHealth ? (
          <DrillDown
            key={selectedCashHealth.account.id}
            health={selectedCashHealth}
            allRows={allRows}
            onBack={() => setSelectedId(null)}
            onSwitch={setSelectedId}
          />
        ) : (
          <motion.div
            key="strip"
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 24 }}
            transition={{ duration: 0.18 }}
            className="flex flex-col gap-3"
          >
            {/* Legend row */}
            <div className="hidden sm:flex items-center text-[9px] font-mono text-zinc-600 uppercase px-5 gap-0">
              <div className="w-56 shrink-0">Account</div>
              <div className="flex-1 text-center">Now</div>
              <div className="flex-1 text-center">Lowest</div>
              <div className="flex-1 text-center">Next Event</div>
              <div className="w-28 text-right">Status</div>
            </div>

            {/* Cash account rows */}
            {allHealth.map((h) => (
              <StripRow
                key={h.account.id}
                health={h}
                onClick={() => setSelectedId(h.account.id)}
              />
            ))}

            {/* Buffer note */}
            <p className="text-[10px] text-zinc-600 font-mono text-center pt-1">
              <Circle className="inline w-1.5 h-1.5 mr-1 align-[1px] fill-amber-400 stroke-amber-400" />
              Amber when projected balance falls below ${BUFFER.toLocaleString()} — click any row to see the full activity breakdown.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
