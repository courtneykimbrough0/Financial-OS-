"use client";

import React from "react";
import { motion } from "motion/react";
import {
  Clock,
  Plus,
  DollarSign,
  Calendar as CalendarIcon,
  CreditCard,
  Info,
  CheckCircle,
} from "lucide-react";
import { useFinancialData } from "./FinancialOSContext";
import { getMonthlyEquivalent } from "@/lib/forecast";

export const LiabilitiesTab: React.FC = () => {
  const {
    categorizedTransactions,
    setFormCategory,
    setIsAddingTransaction,
    setSelectedDetailTransaction,
    activeTab,
  } = useFinancialData();

  if (activeTab !== "liabilities") return null;

  const liabilities = categorizedTransactions.liabilities;

  return (
    <motion.div
      key="liabilities"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      className="flex flex-col gap-6 max-w-5xl w-full mx-auto"
    >
      {/* Header & Main Stats Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Clock className="w-6 h-6 text-amber-400" />
            Liabilities
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => {
              setFormCategory("liability");
              setIsAddingTransaction(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/15 text-white font-bold text-xs transition-all shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4 text-amber-400" />
            <span>Add Liability</span>
          </button>
        </div>
      </div>

      {/* Aggregated Liabilities Summary Ribbon */}
      {liabilities.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-zinc-900/60 border border-white/10 rounded-2xl animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] font-mono text-zinc-400 uppercase">Total Amount Owed</div>
              <div className="text-base font-bold font-mono text-white">
                $
                {liabilities
                  .reduce((acc, t) => acc + (t.currentBalance || 0), 0)
                  .toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] font-mono text-zinc-400 uppercase">Monthly Payments</div>
              <div className="text-base font-bold font-mono text-amber-400">
                $
                {liabilities
                  .reduce((acc, c) => acc + getMonthlyEquivalent(c), 0)
                  .toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                <span className="text-xs text-zinc-400 font-normal"> /mo</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Liability Cards Listing */}
      {liabilities.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-zinc-900/20 border border-dashed border-white/10 rounded-3xl text-center">
          <Clock className="w-12 h-12 text-zinc-500 mb-3" />
          <p className="text-sm font-bold text-white">No Recurring Liabilities Registered</p>
          <p className="text-xs text-zinc-300 max-w-xs mt-1">
            Track what you owe and when it&apos;ll be paid off.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {liabilities.map((tx) => {
            const bal = tx.currentBalance !== undefined ? tx.currentBalance : 0;
            const limit = tx.creditLimit || 0;
            const utilization = limit > 0 ? Math.round((bal / limit) * 100) : 0;
            const isPaidOff = bal === 0;

            return (
              <div
                key={tx.id}
                onClick={() => setSelectedDetailTransaction(tx)}
                className={`bg-zinc-900/40 border hover:border-zinc-500 hover:bg-zinc-900/60 active:scale-[0.99] transition-all rounded-2xl p-5 flex flex-col justify-between cursor-pointer group animate-fade-in ${
                  isPaidOff
                    ? "border-emerald-500/30 bg-emerald-950/5 hover:border-emerald-500/50"
                    : "border-white/5"
                }`}
              >
                <div>
                  {/* Card Header: Type Badge & Title */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2.5 rounded-xl border ${
                          isPaidOff
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                        }`}
                      >
                        {tx.liabilityType === "card" || tx.liabilityType === "line_of_credit" ? (
                          <CreditCard className="w-5 h-5" />
                        ) : (
                          <Clock className="w-5 h-5" />
                        )}
                      </div>
                      <div>
                        <h4 className="text-base font-bold text-white group-hover:text-amber-300 transition-colors">
                          {tx.title}
                        </h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] font-mono font-semibold text-zinc-300 uppercase bg-black/60 px-2 py-0.5 rounded border border-white/10">
                            {tx.liabilityType === "card"
                              ? "Card"
                              : tx.liabilityType === "line_of_credit"
                              ? "Line of Credit"
                              : tx.liabilityType === "loan"
                              ? "Loan"
                              : tx.liabilityType === "one_time"
                              ? "One Time"
                              : "Liability"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Paid Off Badge */}
                    {isPaidOff && (
                      <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 rounded-lg flex items-center gap-1">
                        <CheckCircle className="w-3 h-3 text-emerald-400" />
                        PAID OFF
                      </span>
                    )}
                  </div>

                  {/* Core Financial Numbers Box */}
                  <div className="grid grid-cols-2 gap-3 mt-4 p-3 bg-black/30 rounded-xl border border-white/5">
                    <div>
                      <div className="text-[9px] font-mono text-zinc-500 uppercase">Current Owed</div>
                      <div className="text-base font-bold font-mono text-white">
                        $
                        {bal.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </div>
                    </div>

                    <div>
                      <div className="text-[9px] font-mono text-zinc-500 uppercase">Monthly Payment</div>
                      <div className="text-base font-bold font-mono text-amber-400">
                        ${tx.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer action trigger hint */}
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/5">
                  <span className="text-[10px] font-semibold text-zinc-500 group-hover:text-zinc-300 transition-colors flex items-center gap-1">
                    <Info className="w-3.5 h-3.5" />
                    <span>Click to analyze &amp; manage</span>
                  </span>
                  <span className="text-[10px] font-mono text-zinc-500">Starts {tx.startDate}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
};
export default LiabilitiesTab;
