"use client";

import React from "react";
import { motion } from "motion/react";
import { TrendingDown, Plus, Info } from "lucide-react";
import { useFinancialData } from "./FinancialOSContext";
import {
  getMonthlyEquivalent,
  getQuarterlyEquivalent,
  getFrequencySubtext,
} from "@/lib/forecast";

export const ExpensesSavingsTab: React.FC = () => {
  const {
    categorizedTransactions,
    expenseSubTab,
    setExpenseSubTab,
    setFormCategory,
    setIsAddingTransaction,
    setSelectedDetailTransaction,
    activeTab,
  } = useFinancialData();

  if (activeTab !== "expenses") return null;

  const fixedExpenses = categorizedTransactions.fixedExpenses;
  const subscriptions = categorizedTransactions.subscriptions;
  const savings = categorizedTransactions.savings;

  return (
    <motion.div
      key="expenses"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      className="flex flex-col gap-6 max-w-5xl w-full mx-auto"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <TrendingDown className="w-6 h-6 text-sky-400" />
            Expenses & Savings
          </h2>
          {(fixedExpenses.length > 0 || subscriptions.length > 0) && (
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <span className="text-xs font-mono font-bold text-sky-400 bg-sky-500/10 px-2.5 py-1 rounded-lg border border-sky-500/20 whitespace-nowrap">
                Base: -$
                {(
                  fixedExpenses.reduce((acc, c) => acc + getMonthlyEquivalent(c), 0) +
                  subscriptions.reduce((acc, c) => acc + getMonthlyEquivalent(c), 0)
                ).toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
                /mo
              </span>
              <span className="text-xs font-mono font-bold text-sky-300 bg-sky-500/5 px-2.5 py-1 rounded-lg border border-sky-500/15 whitespace-nowrap">
                Qtr: -$
                {(
                  fixedExpenses.reduce((acc, c) => acc + getQuarterlyEquivalent(c), 0) +
                  subscriptions.reduce((acc, c) => acc + getQuarterlyEquivalent(c), 0)
                ).toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
                /qtr
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setFormCategory("fixed-expense");
              setIsAddingTransaction(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/15 text-white font-bold text-xs transition-all shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4 text-sky-400" />
            <span>Add Expense</span>
          </button>
          <button
            onClick={() => {
              setFormCategory("savings");
              setIsAddingTransaction(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-500/30 text-cyan-200 font-bold text-xs transition-all shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4 text-cyan-400" />
            <span>Add Savings</span>
          </button>
        </div>
      </div>

      {/* Sub tabs filtering for Expenses/Savings */}
      <div className="flex gap-2 p-1 bg-zinc-900/50 border border-white/10 rounded-xl self-start flex-wrap">
        {(["all", "fixed", "subscriptions", "savings"] as const).map((sub) => (
          <button
            key={sub}
            onClick={() => setExpenseSubTab(sub)}
            className={`text-xs font-mono font-bold px-3.5 py-1.5 rounded-lg transition-all capitalize cursor-pointer ${
              expenseSubTab === sub
                ? "bg-zinc-800 text-white border border-white/10 shadow-sm"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            {sub === "all"
              ? "All Items"
              : sub === "fixed"
              ? "Fixed Expenses"
              : sub === "subscriptions"
              ? "Subscriptions"
              : "Savings"}
          </button>
        ))}
      </div>

      {/* Grid lists of Expenses */}
      <div className="flex flex-col gap-6">
        {/* Fixed Expenses Section */}
        {(expenseSubTab === "all" || expenseSubTab === "fixed") && (
          <div className="flex flex-col gap-3">
            <h3 className="text-xs font-bold tracking-wider text-zinc-300 uppercase font-mono px-1">
              Fixed Expenses
            </h3>
            {fixedExpenses.length === 0 ? (
              <div className="p-8 bg-zinc-900/20 border border-dashed border-white/10 rounded-2xl text-center text-zinc-400 text-xs font-medium">
                No fixed bills, rent, or scheduled payments registered.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {fixedExpenses.map((tx) => (
                  <div
                    key={tx.id}
                    onClick={() => setSelectedDetailTransaction(tx)}
                    className="bg-zinc-900/40 border border-white/5 hover:border-zinc-500 hover:bg-zinc-900/60 active:scale-[0.99] transition-all rounded-2xl p-4.5 flex flex-col justify-between cursor-pointer group animate-fade-in"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-base font-bold text-white group-hover:text-sky-300 transition-colors">
                          {tx.title}
                        </h4>
                        <span className="text-xs font-mono font-bold text-zinc-300 uppercase bg-black/60 px-2.5 py-0.5 rounded-lg border border-white/10 inline-block mt-1">
                          {tx.frequency}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-base font-mono font-bold text-sky-400 block">
                          -$
                          {tx.amount.toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                        <span className="text-[10px] font-mono font-semibold text-zinc-500 block mt-0.5">
                          {getFrequencySubtext(tx)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/5">
                      <span className="text-[10px] font-semibold text-zinc-500 group-hover:text-zinc-300 transition-colors flex items-center gap-1">
                        <Info className="w-3.5 h-3.5" />
                        <span>Click to view details</span>
                      </span>
                      <span className="text-[10px] font-mono text-zinc-500">Starts {tx.startDate}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Subscriptions Section */}
        {(expenseSubTab === "all" || expenseSubTab === "subscriptions") && (
          <div className="flex flex-col gap-3">
            <h3 className="text-xs font-bold tracking-wider text-zinc-300 uppercase font-mono px-1">
              Subscriptions
            </h3>
            {subscriptions.length === 0 ? (
              <div className="p-8 bg-zinc-900/20 border border-dashed border-white/10 rounded-2xl text-center text-zinc-400 text-xs font-medium">
                No recurring SaaS services, media, or tech plans logged.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {subscriptions.map((tx) => (
                  <div
                    key={tx.id}
                    onClick={() => setSelectedDetailTransaction(tx)}
                    className="bg-zinc-900/40 border border-white/5 hover:border-zinc-500 hover:bg-zinc-900/60 active:scale-[0.99] transition-all rounded-2xl p-4.5 flex flex-col justify-between cursor-pointer group animate-fade-in"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-base font-bold text-white group-hover:text-violet-300 transition-colors">
                          {tx.title}
                        </h4>
                        <span className="text-xs font-mono font-bold text-zinc-300 uppercase bg-black/60 px-2.5 py-0.5 rounded-lg border border-white/10 inline-block mt-1">
                          {tx.frequency}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-base font-mono font-bold text-violet-400 block">
                          -$
                          {tx.amount.toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                        <span className="text-[10px] font-mono font-semibold text-zinc-500 block mt-0.5">
                          {getFrequencySubtext(tx)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/5">
                      <span className="text-[10px] font-semibold text-zinc-500 group-hover:text-zinc-300 transition-colors flex items-center gap-1">
                        <Info className="w-3.5 h-3.5" />
                        <span>Click to view details</span>
                      </span>
                      <span className="text-[10px] font-mono text-zinc-500">Starts {tx.startDate}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Savings Section */}
        {(expenseSubTab === "all" || expenseSubTab === "savings") && (
          <div className="flex flex-col gap-3">
            <h3 className="text-xs font-bold tracking-wider text-zinc-300 uppercase font-mono px-1">
              Automated Savings Plans
            </h3>
            {savings.length === 0 ? (
              <div className="p-8 bg-zinc-900/20 border border-dashed border-white/10 rounded-2xl text-center text-zinc-400 text-xs font-medium">
                No recurring deposits, safety reservoir plans, or savings plans.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {savings.map((tx) => (
                  <div
                    key={tx.id}
                    onClick={() => setSelectedDetailTransaction(tx)}
                    className="bg-zinc-900/40 border border-white/5 hover:border-zinc-500 hover:bg-zinc-900/60 active:scale-[0.99] transition-all rounded-2xl p-4.5 flex flex-col justify-between cursor-pointer group animate-fade-in"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors">
                          {tx.title}
                        </h4>
                        <span className="text-xs font-mono font-bold text-zinc-300 uppercase bg-black/60 px-2.5 py-0.5 rounded-lg border border-white/10 inline-block mt-1">
                          {tx.frequency}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-base font-mono font-bold text-cyan-400 block">
                          +$
                          {tx.amount.toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                        <span className="text-[10px] font-mono font-semibold text-zinc-500 block mt-0.5">
                          {getFrequencySubtext(tx)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/5">
                      <span className="text-[10px] font-semibold text-zinc-500 group-hover:text-zinc-300 transition-colors flex items-center gap-1">
                        <Info className="w-3.5 h-3.5" />
                        <span>Click to view details</span>
                      </span>
                      <span className="text-[10px] font-mono text-zinc-500">Starts {tx.startDate}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};
export default ExpensesSavingsTab;
