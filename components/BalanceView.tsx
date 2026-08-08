"use client";

import React, { useMemo } from "react";
import { motion } from "motion/react";
import {
  Wallet,
  ArrowDownRight,
  ArrowUpRight,
  AlertTriangle,
  Circle,
  Settings as SettingsIcon,
} from "lucide-react";
import { useFinancialData } from "./FinancialOSContext";
import { ForecastDay, formatDateLocal } from "@/lib/forecast";

function fmt(n: number) {
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtShort(dateStr: string) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ─── single-pool low-point scan ────────────────────────────────────────────

interface PoolHealth {
  currentBalance: number;
  lowPointBalance: number;
  lowPointDateStr: string;
  nextIncomeAmount: number | null;
  nextIncomeDateStr: string | null;
  signal: "green" | "amber" | "orange";
}

function computeHealth(
  timeline: ForecastDay[],
  currentBalance: number,
  lowBalanceAlert: number
): PoolHealth {
  // calendarForecastTimeline starts from the 1st of whatever month is being
  // viewed, which is frequently in the past relative to today (e.g. viewing
  // the current month on the 15th) — bound to today-forward so a dip that
  // already resolved can't get reported as the current low point.
  const todayStr = formatDateLocal(new Date());
  const relevant = timeline.filter((d) => d.dateStr >= todayStr);

  if (relevant.length === 0) {
    return {
      currentBalance,
      lowPointBalance: currentBalance,
      lowPointDateStr: "",
      nextIncomeAmount: null,
      nextIncomeDateStr: null,
      signal:
        currentBalance >= lowBalanceAlert ? "green" : currentBalance >= 0 ? "amber" : "orange",
    };
  }

  // Compute next income FIRST — used to scope the low-point scan below.
  let nextIncomeAmount: number | null = null;
  let nextIncomeDateStr: string | null = null;
  for (const day of relevant) {
    const incomeTx = day.transactions.find((t) => t.item.category === "income");
    if (incomeTx) {
      nextIncomeAmount = incomeTx.amount;
      nextIncomeDateStr = day.dateStr;
      break;
    }
  }

  // Low point: lowest projected balance strictly BEFORE the next income
  // lands. Scanning the full 3-month window would flag a distant dip that
  // doesn't affect the current pay cycle; stopping at the next income gives
  // the user the worst-case balance they'll actually face before relief
  // arrives.
  let lowPointBalance = currentBalance;
  let lowPointDateStr = relevant[0].dateStr;
  for (const day of relevant) {
    if (nextIncomeDateStr && day.dateStr >= nextIncomeDateStr) break;
    if (day.endingBalance < lowPointBalance) {
      lowPointBalance = day.endingBalance;
      lowPointDateStr = day.dateStr;
    }
  }

  const signal: PoolHealth["signal"] =
    lowPointBalance < 0 ? "orange" : lowPointBalance < lowBalanceAlert ? "amber" : "green";

  return {
    currentBalance,
    lowPointBalance,
    lowPointDateStr,
    nextIncomeAmount,
    nextIncomeDateStr,
    signal,
  };
}

interface DayEntry {
  dateStr: string;
  items: { title: string; direction: "in" | "out"; amount: number; category: string }[];
  closingBalance: number;
}

function buildActivity(timeline: ForecastDay[]): DayEntry[] {
  const todayStr = formatDateLocal(new Date());
  return timeline
    .filter((d) => d.dateStr >= todayStr && d.transactions.length > 0)
    .map((day) => ({
      dateStr: day.dateStr,
      items: day.transactions.map((t) => ({
        title: t.item.title,
        direction: t.amount >= 0 ? ("in" as const) : ("out" as const),
        amount: Math.abs(t.amount),
        category: t.item.category,
      })),
      closingBalance: day.endingBalance,
    }));
}

function SignalDot({ signal }: { signal: PoolHealth["signal"] }) {
  return (
    <span
      className={`w-2 h-2 rounded-full shrink-0 ${
        signal === "green"
          ? "bg-emerald-400"
          : signal === "amber"
          ? "bg-amber-400"
          : "bg-orange-400 animate-pulse"
      }`}
    />
  );
}

// ─── Low Balance Alert setup CTA (unset state) ─────────────────────────────

function SetUpLowBalanceAlertCard() {
  const { setActiveTab } = useFinancialData();
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-14 bg-zinc-900/40 border border-dashed border-white/10 rounded-3xl text-center px-6">
      <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
        <AlertTriangle className="w-5 h-5" />
      </div>
      <div>
        <p className="text-sm font-bold text-white">Set up your Low Balance Alert</p>
        <p className="text-xs text-zinc-400 max-w-sm mt-1">
          Pick a balance you never want to dip below, and this view will show you the lowest
          point your balance is projected to hit before your next paycheck.
        </p>
      </div>
      <button
        type="button"
        onClick={() => setActiveTab("settings")}
        className="mt-1 flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors cursor-pointer"
      >
        <SettingsIcon className="w-3.5 h-3.5" />
        <span>Go to Settings</span>
      </button>
    </div>
  );
}

// ─── main export ────────────────────────────────────────────────────────────

export const BalanceView: React.FC = () => {
  const { currentBalance, lowBalanceAlert, calendarForecastTimeline, loading } = useFinancialData();

  const health = useMemo(() => {
    if (lowBalanceAlert === null) return null;
    return computeHealth(calendarForecastTimeline, currentBalance ?? 0, lowBalanceAlert);
  }, [calendarForecastTimeline, currentBalance, lowBalanceAlert]);

  const activity = useMemo(
    () => buildActivity(calendarForecastTimeline),
    [calendarForecastTimeline]
  );

  if (loading) {
    return (
      <div className="py-16 text-center text-zinc-600 text-xs font-mono animate-pulse">
        Loading balance data…
      </div>
    );
  }

  if (!health) {
    return <SetUpLowBalanceAlertCard />;
  }

  const {
    currentBalance: bal,
    lowPointBalance,
    lowPointDateStr,
    nextIncomeAmount,
    nextIncomeDateStr,
    signal,
  } = health;

  const signalTextClass =
    signal === "orange" ? "text-orange-400" : signal === "amber" ? "text-amber-400" : "text-zinc-200";
  const signalLabel = signal === "green" ? "On Track" : signal === "amber" ? "Low" : "Shortfall";

  return (
    <motion.div
      key="balance-view"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.2 }}
      className="flex flex-col gap-4"
    >
      {/* Single-pool balance card */}
      <div className="bg-zinc-900/40 border border-white/5 rounded-3xl p-5 sm:p-6 flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Wallet className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-white">Cash Flow Outlook</h3>
          </div>
          <span
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold font-mono uppercase border ${
              signal === "green"
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                : signal === "amber"
                ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                : "bg-orange-500/10 text-orange-400 border-orange-500/20"
            }`}
          >
            <SignalDot signal={signal} />
            {signalLabel}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3.5 bg-black/20 border border-white/5 rounded-2xl">
            <div className="text-[9px] font-mono text-zinc-500 uppercase">Current Balance</div>
            <div className="text-lg font-bold font-mono text-zinc-100 mt-1">${fmt(bal)}</div>
          </div>

          <div className="p-3.5 bg-black/20 border border-white/5 rounded-2xl">
            <div className="text-[9px] font-mono text-zinc-500 uppercase">
              Low Point Before Next Income
            </div>
            <div className={`text-lg font-bold font-mono mt-1 ${signalTextClass}`}>
              ${fmt(lowPointBalance)}
            </div>
            {lowPointDateStr && (
              <div className="text-[9px] font-mono text-zinc-600 mt-0.5">
                {fmtShort(lowPointDateStr)}
              </div>
            )}
          </div>

          <div className="p-3.5 bg-black/20 border border-white/5 rounded-2xl">
            <div className="text-[9px] font-mono text-zinc-500 uppercase">Next Income</div>
            {nextIncomeAmount !== null && nextIncomeDateStr ? (
              <>
                <div className="text-lg font-bold font-mono text-emerald-400 mt-1">
                  +${fmt(nextIncomeAmount)}
                </div>
                <div className="text-[9px] font-mono text-zinc-600 mt-0.5">
                  {fmtShort(nextIncomeDateStr)}
                </div>
              </>
            ) : (
              <div className="text-sm font-mono text-zinc-600 mt-1">None scheduled</div>
            )}
          </div>
        </div>
      </div>

      {/* Upcoming activity */}
      <div className="bg-zinc-900/30 border border-white/10 rounded-[2rem] p-4 sm:p-5 flex flex-col gap-0 overflow-hidden">
        <h4 className="text-xs font-bold font-mono text-zinc-400 uppercase mb-3 px-1">
          Upcoming Activity
        </h4>
        {activity.length === 0 ? (
          <div className="py-8 text-center text-zinc-600 text-xs font-mono italic">
            No scheduled activity in this window.
          </div>
        ) : (
          <div className="flex flex-col divide-y divide-white/5 max-h-[360px] overflow-y-auto scrollbar-thin">
            {activity.map((d) => {
              const isLow = d.closingBalance < lowBalanceAlert! && d.closingBalance >= 0;
              const isNeg = d.closingBalance < 0;
              return (
                <div key={d.dateStr} className="py-3 px-1 flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold font-mono text-zinc-500 uppercase">
                      {fmtShort(d.dateStr)}
                    </span>
                    <span
                      className={`text-xs font-bold font-mono ${
                        isNeg ? "text-orange-400" : isLow ? "text-amber-400" : "text-zinc-300"
                      }`}
                    >
                      ${fmt(d.closingBalance)}
                      {(isNeg || isLow) && (
                        <AlertTriangle className="inline w-3 h-3 ml-1 align-[-1px]" />
                      )}
                    </span>
                  </div>
                  {d.items.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between pl-2 text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        {item.direction === "in" ? (
                          <ArrowUpRight className="w-3 h-3 text-emerald-400 shrink-0" />
                        ) : (
                          <ArrowDownRight className="w-3 h-3 text-zinc-500 shrink-0" />
                        )}
                        <span className="text-zinc-400 truncate">{item.title}</span>
                        <span className="text-[9px] font-mono text-zinc-500 shrink-0">
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

      <p className="text-[10px] text-zinc-600 font-mono text-center pt-1">
        <Circle className="inline w-1.5 h-1.5 mr-1 align-[1px] fill-amber-400 stroke-amber-400" />
        Amber means your balance is projected to dip below your Low Balance Alert before your next
        paycheck.
      </p>
    </motion.div>
  );
};
export default BalanceView;
