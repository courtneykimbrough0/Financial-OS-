"use client";

import React from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Coins,
  CreditCard,
  Target,
  Clock,
  X,
  Zap,
  CheckCircle2,
  Calendar as CalendarIcon,
  AlertTriangle,
} from "lucide-react";
import { useFinancialData } from "./FinancialOSContext";
import {
  calculatePayoffDetails,
  getFrequencySubtext,
  RecurringTransaction,
} from "@/lib/forecast";

export const TransactionDetailModal: React.FC = () => {
  const {
    selectedDetailTransaction,
    setSelectedDetailTransaction,
    accounts,
    setEditingId,
    setFormCategory,
    setIsAddingTransaction,
    setConfirmDialog,
    deleteTransactionById,
    setSelectedDay,
    setIsPayoffPlannerOpen,
  } = useFinancialData();

  if (!selectedDetailTransaction) return null;

  const tx = selectedDetailTransaction;
  const isInc = tx.category === "income";
  const isLia = tx.category === "liability";
  const isSav = tx.category === "savings";
  const isSub = tx.category === "subscription";

  // Find linked account
  const linkedAccId = tx.accountId || tx.fundingAccountId || tx.targetAccountId;
  const linkedAcc = accounts.find((a) => a.id === linkedAccId);

  const payoff = isLia ? calculatePayoffDetails(tx) : null;
  const bal = tx.currentBalance !== undefined ? tx.currentBalance : 0;
  const limit = tx.creditLimit || 0;
  const utilization = limit > 0 ? Math.round((bal / limit) * 100) : 0;
  const isPaidOff = isLia && bal === 0;

  const handleEditClick = () => {
    setEditingId(tx.id);
    setFormCategory(tx.category);
    setIsAddingTransaction(true);
    setSelectedDetailTransaction(null);
  };

  const handleDeleteClick = () => {
    setConfirmDialog({
      isOpen: true,
      title: "Remove Transaction",
      message: "Are you sure you want to permanently delete this recurring transaction?",
      onConfirm: () => {
        deleteTransactionById(tx.id);
        setSelectedDay(null);
      },
    });
    setSelectedDetailTransaction(null);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 15 }}
          transition={{ duration: 0.15 }}
          className="bg-zinc-950 border border-white/10 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col"
        >
          {/* Header */}
          <div className="p-6 border-b border-white/5 flex justify-between items-start bg-zinc-900/20">
            <div className="flex items-center gap-3">
              <div
                className={`p-3 rounded-2xl border ${
                  isInc
                    ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/20"
                    : isLia
                    ? "bg-amber-500/15 text-amber-400 border-amber-500/20"
                    : isSav
                    ? "bg-cyan-500/15 text-cyan-400 border-cyan-500/20"
                    : isSub
                    ? "bg-violet-500/15 text-violet-400 border-violet-500/20"
                    : "bg-sky-500/15 text-sky-400 border-sky-500/20"
                }`}
              >
                {isInc ? (
                  <Coins className="w-5 h-5" />
                ) : isLia ? (
                  <CreditCard className="w-5 h-5" />
                ) : isSav ? (
                  <Target className="w-5 h-5" />
                ) : (
                  <Clock className="w-5 h-5" />
                )}
              </div>
              <div>
                <h3 className="text-base font-bold text-white leading-snug">{tx.title}</h3>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400 mt-1 block">
                  {tx.category.replace("-", " ")}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSelectedDetailTransaction(null)}
              className="p-1.5 rounded-lg hover:bg-white/5 text-zinc-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-5 overflow-y-auto max-h-[60vh] scrollbar-thin">
            {/* Amount / Frequency */}
            <div className="p-4 bg-zinc-900/40 border border-white/5 rounded-2xl flex justify-between items-center">
              <div>
                <span className="text-[10px] font-mono text-zinc-500 uppercase">
                  Amount &amp; Frequency
                </span>
                <div
                  className={`text-xl font-mono font-bold mt-0.5 ${
                    isInc ? "text-emerald-400" : "text-zinc-200"
                  }`}
                >
                  {isInc ? "+" : "-"}${tx.amount.toLocaleString("en-US")}
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-mono font-bold text-zinc-300 uppercase bg-black/60 px-2.5 py-1 rounded-lg border border-white/10 inline-block">
                  {tx.frequency}
                </span>
                <span className="text-[10px] text-zinc-400 block mt-1 font-mono">
                  {getFrequencySubtext(tx)}
                </span>
              </div>
            </div>

            {/* Date and Account Mappings */}
            <div className="grid grid-cols-2 gap-3.5">
              <div className="p-3.5 bg-zinc-900/20 border border-white/5 rounded-xl">
                <span className="text-[9px] font-mono text-zinc-500 uppercase block">Starts On</span>
                <span className="text-xs font-mono font-bold text-zinc-300 mt-1 block">
                  {tx.startDate}
                </span>
              </div>
              <div className="p-3.5 bg-zinc-900/20 border border-white/5 rounded-xl">
                <span className="text-[9px] font-mono text-zinc-500 uppercase block">
                  Linked Account
                </span>
                <span className="text-xs font-bold text-zinc-300 mt-1 block truncate">
                  {linkedAcc ? linkedAcc.name : "Unassigned / All Accounts"}
                </span>
              </div>
            </div>

            {/* Liability-Specific Advanced Details */}
            {isLia && payoff && (
              <div className="space-y-4 border-t border-white/5 pt-4">
                <span className="text-[10px] font-bold font-mono tracking-wider text-zinc-400 uppercase">
                  Liability Payoff Analysis
                </span>

                {/* Payoff Status Alert banner */}
                {isPaidOff ? (
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-center text-xs font-bold text-emerald-400 flex items-center justify-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>This liability is fully paid off!</span>
                  </div>
                ) : payoff.monthsToPayoff !== null ? (
                  <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-center text-xs font-bold text-amber-300 flex items-center justify-center gap-1.5">
                    <CalendarIcon className="w-4 h-4" />
                    <span>Projected Payoff: {payoff.payoffDateStr}</span>
                  </div>
                ) : (
                  <div className="p-3 bg-orange-500/10 border border-orange-500/20 rounded-xl text-center text-xs font-bold text-orange-400 flex items-center justify-center gap-1.5 animate-pulse">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Warning: Negative Amortization</span>
                  </div>
                )}

                {/* Credit card utilization details */}
                {limit > 0 && (
                  <div className="space-y-1.5 p-3.5 bg-zinc-900/30 border border-white/5 rounded-xl">
                    <div className="flex justify-between text-[10px] font-mono">
                      <span className="text-zinc-400">Credit Utilization</span>
                      <span
                        className={`font-bold ${
                          utilization > 70
                            ? "text-orange-400"
                            : utilization > 30
                            ? "text-amber-400"
                            : "text-emerald-400"
                        }`}
                      >
                        {utilization}% (${bal.toLocaleString("en-US")} / ${limit.toLocaleString(
                          "en-US"
                        )})
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-black/60 rounded-full overflow-hidden border border-white/5">
                      <div
                        className={`h-full rounded-full transition-all ${
                          utilization > 70
                            ? "bg-orange-500"
                            : utilization > 30
                            ? "bg-amber-500"
                            : "bg-emerald-500"
                        }`}
                        style={{ width: `${Math.min(utilization, 100)}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Financial values box */}
                <div className="grid grid-cols-2 gap-3 p-3 bg-zinc-900/30 border border-white/5 rounded-xl">
                  <div>
                    <span className="text-[9px] font-mono text-zinc-500 block">Current Owed</span>
                    <span className="text-sm font-bold font-mono text-white">
                      ${bal.toLocaleString("en-US")}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] font-mono text-zinc-500 block">Minimum Due</span>
                    <span className="text-sm font-bold font-mono text-zinc-300">
                      ${tx.minimumPayment ? tx.minimumPayment.toLocaleString("en-US") : "$0.00"}
                    </span>
                  </div>
                </div>

                {/* Interest accretion details */}
                {tx.interestRate !== undefined && tx.interestRate > 0 && !isPaidOff && (
                  <div className="text-xs space-y-2 bg-amber-950/10 p-3.5 rounded-2xl border border-amber-500/15">
                    <div className="flex justify-between text-zinc-300">
                      <span>Annual Rate:</span>
                      <span className="font-mono font-bold text-amber-400">
                        {tx.interestRate}% APR
                      </span>
                    </div>
                    <div className="flex justify-between text-zinc-300">
                      <span>Daily Interest Volume:</span>
                      <span className="font-mono text-zinc-200">
                        ${payoff.dailyInterestAccrual.toFixed(2)} / day
                      </span>
                    </div>
                    <div className="flex justify-between text-zinc-300">
                      <span>Monthly Interest Volume:</span>
                      <span className="font-mono text-zinc-200">
                        ${payoff.monthlyInterestAccrual.toFixed(2)} / day
                      </span>
                    </div>
                    {payoff.monthsToPayoff !== null && (
                      <div className="flex justify-between text-zinc-300 pt-1.5 border-t border-amber-500/10">
                        <span>Total Est. Interest Cost:</span>
                        <span className="font-mono font-bold text-amber-300">
                          ${payoff.totalInterestPaid.toLocaleString("en-US")}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Notes Section */}
            {tx.notes && (
              <div className="space-y-1.5 border-t border-white/5 pt-4">
                <span className="text-[10px] font-bold font-mono tracking-wider text-zinc-400 uppercase">
                  Notes
                </span>
                <p className="text-xs text-zinc-300 bg-black/40 p-3 rounded-xl border border-white/5 leading-relaxed">
                  {tx.notes}
                </p>
              </div>
            )}
          </div>

          {/* Footer Buttons */}
          <div className="p-6 bg-zinc-900/40 border-t border-white/5 flex flex-col sm:flex-row gap-3">
            <div className="flex gap-2 w-full">
              <button
                type="button"
                onClick={handleEditClick}
                className="flex-1 px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-zinc-200 hover:text-white font-bold text-xs transition-all text-center cursor-pointer"
              >
                Edit Details
              </button>
              <button
                type="button"
                onClick={handleDeleteClick}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 hover:text-red-300 font-bold text-xs transition-all text-center cursor-pointer"
              >
                Remove
              </button>
            </div>
            {isLia && (
              <button
                type="button"
                onClick={() => {
                  setIsPayoffPlannerOpen(true);
                  setSelectedDetailTransaction(null);
                }}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500/20 to-amber-600/20 border border-amber-500/40 text-amber-300 font-bold text-xs hover:from-amber-500/30 hover:to-amber-600/30 transition-all flex items-center justify-center gap-1.5 shadow-md shadow-amber-950/30 cursor-pointer"
              >
                <Zap className="w-4 h-4 text-amber-400" />
                <span>Planner</span>
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
