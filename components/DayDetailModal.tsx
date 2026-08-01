"use client";

import React, { useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { CalendarCheck, X, AlertTriangle, CheckCircle, Check, Edit3 } from "lucide-react";
import { useFinancialData } from "./FinancialOSContext";

export const DayDetailModal: React.FC = () => {
  const {
    selectedDay,
    setSelectedDay,
    dashboardAccountFilter,
    lowBalanceAlerts,
    overrideEditingTxId,
    setOverrideEditingTxId,
    overrideCustomAmountInput,
    setOverrideCustomAmountInput,
    toggleVerifyOverride,
    skipOverride,
    modifyAmountOverride,
  } = useFinancialData();

  // Memoize date-specific low balance warnings map
  const lowBalanceDatesMap = useMemo(() => {
    const map = new Map<string, typeof lowBalanceAlerts>();
    for (const alert of lowBalanceAlerts) {
      if (!map.has(alert.dateStr)) {
        map.set(alert.dateStr, []);
      }
      map.get(alert.dateStr)!.push(alert);
    }
    return map;
  }, [lowBalanceAlerts]);

  if (!selectedDay) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setSelectedDay(null)}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        />

        {/* Modal Box */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", duration: 0.3 }}
          className="relative w-full max-w-lg bg-zinc-900 border border-white/10 rounded-3xl shadow-2xl overflow-hidden z-10"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-xl">
                <CalendarCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-md font-bold text-zinc-100">Transactions</h3>
                <p className="text-xs text-zinc-400 font-mono mt-0.5">
                  {selectedDay.date.toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              </div>
            </div>
            <button
              onClick={() => setSelectedDay(null)}
              className="p-2 hover:bg-zinc-800 rounded-xl text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Day Balance Summary Row */}
          <div className="px-6 py-4 bg-zinc-950/40 border-b border-white/5 grid grid-cols-2 gap-4">
            <div>
              <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider block">
                Projected Day Balance
              </span>
              <span className="text-lg font-bold text-indigo-400 font-mono">
                $
                {dashboardAccountFilter && selectedDay.accountBalances
                  ? (selectedDay.accountBalances[dashboardAccountFilter] ?? 0).toLocaleString(
                      "en-US",
                      {
                        minimumFractionDigits: 2,
                      }
                    )
                  : selectedDay.endingBalance.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                    })}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider block">
                Net Change
              </span>
              <span
                className={`text-md font-mono font-bold block mt-0.5 ${
                  selectedDay.incoming - selectedDay.outgoing >= 0
                    ? "text-emerald-400"
                    : "text-sky-400"
                }`}
              >
                {selectedDay.incoming - selectedDay.outgoing >= 0 ? "+" : "-"}$
                {Math.abs(selectedDay.incoming - selectedDay.outgoing).toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                })}
              </span>
            </div>
          </div>

          {/* Day Balance Warning Row */}
          {lowBalanceDatesMap.has(selectedDay.dateStr) && (
            <div className="px-6 py-3.5 bg-amber-500/10 border-b border-white/5 flex flex-col gap-1.5 animate-pulse">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>Balance Warning</span>
              </div>
              <div className="flex flex-col gap-1">
                {lowBalanceDatesMap.get(selectedDay.dateStr)!.map((alert, alertIdx) => (
                  <p key={alertIdx} className="text-[11px] text-zinc-300 leading-normal">
                    Account <span className="font-semibold text-white">{alert.accountName}</span>{" "}
                    is projected to drop to{" "}
                    <span className="font-mono font-bold text-amber-400">
                      ${alert.balance.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </span>
                    .
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* Scheduled Transactions List */}
          <div className="p-6 max-h-[300px] overflow-y-auto scrollbar-thin flex flex-col gap-3">
            <span className="text-[10px] font-mono font-bold tracking-widest text-zinc-500 uppercase">
              Scheduled Day Transactions
            </span>

            {selectedDay.transactions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-zinc-500 italic text-xs text-center">
                <CheckCircle className="w-8 h-8 text-zinc-600 mb-2 opacity-50" />
                <p>No transactions scheduled on this date.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {selectedDay.transactions.map((t, idx) => {
                  const isEditing = overrideEditingTxId === t.item.id;
                  return (
                    <div
                      key={idx}
                      className="flex flex-col p-3 rounded-2xl bg-black/20 border border-white/5 gap-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span
                            className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                              t.item.category === "income"
                                ? "bg-emerald-400"
                                : t.item.category === "savings"
                                ? "bg-cyan-400"
                                : t.item.category === "liability"
                                ? "bg-amber-400"
                                : "bg-sky-400"
                            }`}
                          ></span>
                          <div>
                            <div className="text-xs font-semibold text-zinc-100 flex items-center gap-1.5 flex-wrap">
                              <span>{t.item.title}</span>
                              {t.splitLabel && (
                                <span className="px-1.5 py-0.5 bg-violet-500/10 text-violet-400 text-[9px] rounded-md font-bold uppercase tracking-wider">
                                  {t.splitLabel}
                                </span>
                              )}
                              {t.status === "verified" && (
                                <span className="px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 text-[9px] rounded-md font-bold uppercase tracking-wider">
                                  Verified ✓
                                </span>
                              )}
                              {t.status === "modified" && (
                                <span className="px-1.5 py-0.5 bg-indigo-500/10 text-indigo-400 text-[9px] rounded-md font-bold uppercase tracking-wider">
                                  Modified
                                </span>
                              )}
                            </div>
                            <div className="text-[9px] text-zinc-500 uppercase font-mono mt-0.5 flex items-center gap-2">
                              <span>{t.item.category}</span>
                              <span>•</span>
                              <span>{t.item.frequency}</span>
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <span
                            className={`text-xs font-mono font-bold ${
                              t.item.category === "income"
                                ? "text-emerald-400"
                                : t.item.category === "savings"
                                ? "text-cyan-400"
                                : t.item.category === "liability"
                                ? "text-amber-400"
                                : "text-sky-400"
                            }`}
                          >
                            {t.item.category === "income" ? "+" : "-"}$
                            {Math.abs(t.amount).toLocaleString("en-US", {
                              minimumFractionDigits: 2,
                            })}
                          </span>
                        </div>
                      </div>

                      {/* Inline Modification Input */}
                      {isEditing ? (
                        <div className="flex items-center gap-2 mt-1 bg-zinc-950/40 p-1.5 rounded-xl border border-white/5">
                          <span className="text-[10px] font-mono text-zinc-400 pl-1.5">$</span>
                          <input
                            type="number"
                            step="any"
                            value={overrideCustomAmountInput}
                            onChange={(e) => setOverrideCustomAmountInput(e.target.value)}
                            className="bg-transparent text-xs font-mono text-white focus:outline-none flex-1 py-0.5"
                            placeholder="0.00"
                            autoFocus
                          />
                          <button
                            onClick={() => {
                              const num = parseFloat(overrideCustomAmountInput);
                              if (!isNaN(num)) {
                                modifyAmountOverride(t.item.id, selectedDay.dateStr, num);
                              }
                            }}
                            className="px-2 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-semibold rounded-lg transition-all cursor-pointer"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => {
                              setOverrideEditingTxId(null);
                              setOverrideCustomAmountInput("");
                            }}
                            className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 text-[10px] font-semibold rounded-lg transition-all cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        /* Actions row */
                        <div className="flex items-center gap-1.5 mt-1 border-t border-white/5 pt-2 justify-end">
                          <button
                            onClick={() => toggleVerifyOverride(t.item.id, selectedDay.dateStr)}
                            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all cursor-pointer ${
                              t.status === "verified"
                                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                : "bg-zinc-800/40 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-transparent"
                            }`}
                            title="Mark as Cleared / Verified"
                          >
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span>{t.status === "verified" ? "Verified" : "Verify"}</span>
                          </button>

                          <button
                            onClick={() => {
                              setOverrideEditingTxId(t.item.id);
                              setOverrideCustomAmountInput(Math.abs(t.amount).toString());
                            }}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-zinc-800/40 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-transparent transition-all cursor-pointer"
                            title="Change amount for this day only"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-indigo-400" />
                            <span>Change Amount</span>
                          </button>

                          <button
                            onClick={() => skipOverride(t.item.id, selectedDay.dateStr)}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-zinc-800/40 hover:bg-red-950/40 text-zinc-400 hover:text-red-400 border border-transparent hover:border-red-500/20 transition-all cursor-pointer"
                            title="Skip this specific transaction instance"
                          >
                            <X className="w-3.5 h-3.5 text-red-400" />
                            <span>Skip</span>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer action button */}
            <div className="p-4 bg-zinc-950/20 border-t border-white/5 flex justify-end">
              <button
                onClick={() => setSelectedDay(null)}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-zinc-100 text-xs font-semibold transition-all cursor-pointer"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      </AnimatePresence>
    );
};
export default DayDetailModal;
