"use client";

import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { Zap, X, AlertTriangle, Flame, Snowflake, Target } from "lucide-react";
import { useFinancialData } from "./FinancialOSContext";
import {
  simulateLiabilityPayoff,
  getMonthlyEquivalent,
} from "@/lib/forecast";

export const PayoffPlannerModal: React.FC = () => {
  const {
    isPayoffPlannerOpen,
    setIsPayoffPlannerOpen,
    categorizedTransactions,
    payoffStrategy,
    setPayoffStrategy,
    payoffExtraBudget,
    setPayoffExtraBudget,
  } = useFinancialData();

  if (!isPayoffPlannerOpen) return null;

  const liabilities = categorizedTransactions.liabilities;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="bg-zinc-950 border border-amber-500/30 rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl my-8 flex flex-col"
        >
          {/* Modal Header */}
          <div className="p-6 border-b border-white/10 flex items-center justify-between bg-zinc-900/80">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
                <Zap className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  Payoff Strategy Planner
                </h3>
                <p className="text-xs text-zinc-300">
                  Compare Avalanche vs. Snowball payoff methods with custom monthly acceleration budgets.
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsPayoffPlannerOpen(false)}
              className="p-2 hover:bg-zinc-800 rounded-xl text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-6 space-y-6 overflow-y-auto max-h-[75vh]">
            {(() => {
              if (liabilities.length === 0) {
                return (
                  <div className="text-center py-12 text-zinc-400 space-y-2">
                    <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto" />
                    <p className="text-sm font-bold text-white">No Active Liabilities Found</p>
                    <p className="text-xs">
                      Add one or more liabilities with current balances to run strategy simulations.
                    </p>
                  </div>
                );
              }

              const baselineSim = simulateLiabilityPayoff(liabilities, 0, "avalanche");
              const activeSim = simulateLiabilityPayoff(
                liabilities,
                payoffExtraBudget,
                payoffStrategy
              );

              const baseScheduled = liabilities.reduce(
                (acc, c) => acc + getMonthlyEquivalent(c),
                0
              );
              const totalMonthlyBudget = baseScheduled + payoffExtraBudget;

              const monthsSaved =
                baselineSim.totalMonths !== null && activeSim.totalMonths !== null
                  ? baselineSim.totalMonths - activeSim.totalMonths
                  : 0;

              const interestSaved = Math.max(
                0,
                baselineSim.totalInterestPaid - activeSim.totalInterestPaid
              );

              return (
                <div className="space-y-6">
                  {/* Strategy Selection & Budget Controls */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Strategy Switcher */}
                    <div className="bg-zinc-900/60 p-4 rounded-2xl border border-white/10 space-y-3">
                      <label className="block text-[10px] font-mono tracking-widest text-amber-400 font-bold uppercase">
                        Payoff Strategy Method
                      </label>

                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setPayoffStrategy("avalanche")}
                          className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                            payoffStrategy === "avalanche"
                              ? "bg-amber-500/20 border-amber-500/50 text-white"
                              : "bg-black/30 border-white/10 text-zinc-400 hover:text-white"
                          }`}
                        >
                          <div className="flex items-center gap-1.5 font-bold text-xs">
                            <Flame className="w-4 h-4 text-amber-400" />
                            <span>Avalanche</span>
                          </div>
                          <div className="text-[10px] text-zinc-400 mt-1 leading-tight">
                            Highest APR First (Saves Most Money)
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => setPayoffStrategy("snowball")}
                          className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                            payoffStrategy === "snowball"
                              ? "bg-sky-500/20 border-sky-500/50 text-white"
                              : "bg-black/30 border-white/10 text-zinc-400 hover:text-white"
                          }`}
                        >
                          <div className="flex items-center gap-1.5 font-bold text-xs">
                            <Snowflake className="w-4 h-4 text-sky-400" />
                            <span>Snowball</span>
                          </div>
                          <div className="text-[10px] text-zinc-400 mt-1 leading-tight">
                            Lowest Balance First (Quick Wins)
                          </div>
                        </button>
                      </div>
                    </div>

                    {/* Extra Monthly Payment Slider */}
                    <div className="bg-zinc-900/60 p-4 rounded-2xl border border-white/10 space-y-3">
                      <div className="flex justify-between items-center">
                        <label className="block text-[10px] font-mono tracking-widest text-amber-400 font-bold uppercase">
                          Extra Monthly Acceleration
                        </label>
                        <span className="text-sm font-bold font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-lg border border-emerald-500/20">
                          +${payoffExtraBudget} / mo
                        </span>
                      </div>

                      <input
                        type="range"
                        min="0"
                        max="2000"
                        step="25"
                        value={payoffExtraBudget}
                        onChange={(e) => setPayoffExtraBudget(parseFloat(e.target.value) || 0)}
                        className="w-full accent-amber-500 cursor-pointer"
                      />

                      <div className="flex justify-between text-[11px] font-mono text-zinc-400">
                        <span>Base Scheduled: ${baseScheduled.toFixed(0)}/mo</span>
                        <span className="text-amber-300 font-bold">
                          Total Budget: ${totalMonthlyBudget.toFixed(0)}/mo
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Simulation Results Comparison Banner */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-gradient-to-r from-amber-950/30 via-zinc-900 to-amber-950/30 border border-amber-500/30 rounded-2xl">
                    <div className="space-y-1">
                      <div className="text-[10px] font-mono text-zinc-400 uppercase">
                        Est. Fully Paid Date
                      </div>
                      <div className="text-base font-bold font-mono text-emerald-400">
                        {activeSim.fullyPaidDateStr}
                      </div>
                      <div className="text-[10px] text-zinc-400">
                        {activeSim.totalMonths !== null ? `${activeSim.totalMonths} months total` : "N/A"}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="text-[10px] font-mono text-zinc-400 uppercase">Time Saved</div>
                      <div className="text-base font-bold font-mono text-amber-300">
                        {monthsSaved > 0 ? `${monthsSaved} Months Faster` : "Baseline Pace"}
                      </div>
                      <div className="text-[10px] text-zinc-400">vs minimum scheduled payments</div>
                    </div>

                    <div className="space-y-1">
                      <div className="text-[10px] font-mono text-zinc-400 uppercase">
                        Est. Interest Saved
                      </div>
                      <div className="text-base font-bold font-mono text-emerald-300">
                        $
                        {interestSaved.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </div>
                      <div className="text-[10px] text-zinc-400">
                        Total interest: $
                        {activeSim.totalInterestPaid.toLocaleString("en-US", {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Elimination Sequence Table */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
                        <Target className="w-4 h-4 text-amber-400" />
                        Target Account Elimination Order (
                        {payoffStrategy === "avalanche" ? "Highest APR First" : "Lowest Balance First"}
                        )
                      </h4>
                      <span className="text-[10px] font-mono text-zinc-400">
                        {activeSim.payoffOrder.length} Liabilities Simulated
                      </span>
                    </div>

                    <div className="space-y-2 max-h-[250px] overflow-y-auto scrollbar-thin">
                      {activeSim.payoffOrder.map((item, idx) => (
                        <div
                          key={item.id}
                          className="p-3.5 bg-black/40 border border-white/5 rounded-xl flex items-center justify-between hover:border-amber-500/20 transition-colors animate-fade-in"
                        >
                          <div className="flex items-center gap-3">
                            <span className="w-6 h-6 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-400 font-mono font-bold text-xs flex items-center justify-center shrink-0">
                              #{idx + 1}
                            </span>
                            <div>
                              <div className="text-xs font-bold text-white">{item.title}</div>
                              <div className="text-[10px] font-mono text-zinc-400">
                                Start Balance: ${item.currentBalance.toLocaleString("en-US")} &bull;{" "}
                                {item.interestRate}% APR
                              </div>
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="text-xs font-mono font-bold text-emerald-400">
                              {item.payoffDateStr}
                            </div>
                            <div className="text-[10px] font-mono text-zinc-400">
                              Month {item.monthEliminated} &bull; Est. Interest: $
                              {item.interestPaid.toLocaleString("en-US", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Modal Footer */}
          <div className="p-4 bg-zinc-900/60 border-t border-white/10 flex justify-end">
            <button
              type="button"
              onClick={() => setIsPayoffPlannerOpen(false)}
              className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs transition-colors shadow-lg shadow-amber-950/50 cursor-pointer font-semibold"
            >
              Done
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
