"use client";

import React from "react";
import { motion } from "motion/react";
import { Coins, Plus, Info } from "lucide-react";
import { useFinancialData } from "./FinancialOSContext";
import {
  getMonthlyEquivalent,
  getQuarterlyEquivalent,
  getFrequencySubtext,
} from "@/lib/forecast";

export const IncomeTab: React.FC = () => {
  const {
    categorizedTransactions,
    setFormCategory,
    setIsAddingTransaction,
    setSelectedDetailTransaction,
    activeTab,
  } = useFinancialData();

  if (activeTab !== "income") return null;

  const incomeItems = categorizedTransactions.income;

  return (
    <motion.div
      key="income"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      className="flex flex-col gap-6 max-w-5xl w-full mx-auto"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
        <div>
          <h2 className="text-2xl font-bold text-zinc-100 flex items-center gap-2">
            <Coins className="w-6 h-6 text-emerald-400" />
            Income
          </h2>
          {incomeItems.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20 whitespace-nowrap">
                Base: +$
                {incomeItems
                  .reduce((acc, c) => acc + getMonthlyEquivalent(c), 0)
                  .toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                /mo
              </span>
              <span className="text-xs font-mono font-bold text-emerald-300 bg-emerald-500/5 px-2.5 py-1 rounded-lg border border-emerald-500/15 whitespace-nowrap">
                Qtr: +$
                {incomeItems
                  .reduce((acc, c) => acc + getQuarterlyEquivalent(c), 0)
                  .toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                /qtr
              </span>
            </div>
          )}
        </div>

        <button
          onClick={() => {
            setFormCategory("income");
            setIsAddingTransaction(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-zinc-100 font-semibold text-xs transition-all shadow-sm cursor-pointer animate-fade-in"
        >
          <Plus className="w-4 h-4 text-emerald-400" />
          <span>Add Income</span>
        </button>
      </div>

      {incomeItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-zinc-900/15 border border-dashed border-white/5 rounded-3xl text-center">
          <Coins className="w-12 h-12 text-zinc-600 mb-3" />
          <p className="text-sm font-bold text-zinc-300">No Recurring Income Registered</p>
          <p className="text-xs text-zinc-300 max-w-xs mt-1">
            Every dynamic forecast needs at least one regular paycheck payload to build an available
            spend margin.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {incomeItems.map((tx) => (
            <div
              key={tx.id}
              onClick={() => setSelectedDetailTransaction(tx)}
              className="bg-zinc-900/40 border border-white/5 hover:border-zinc-500 hover:bg-zinc-900/60 active:scale-[0.99] transition-all rounded-2xl p-5 flex flex-col justify-between cursor-pointer group animate-fade-in"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20 group-hover:bg-emerald-500/20 transition-colors">
                    <Coins className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-white group-hover:text-emerald-300 transition-colors">
                      {tx.title}
                    </h4>
                    <span className="text-xs font-mono font-bold text-zinc-300 uppercase bg-black/60 px-2.5 py-0.5 rounded-lg border border-white/10 inline-block mt-1">
                      {tx.frequency}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-base font-mono font-bold text-emerald-400 block">
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
                  <span>Click to view details &amp; manage</span>
                </span>
                <span className="text-[10px] font-mono text-zinc-500">Starts {tx.startDate}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
};
export default IncomeTab;
