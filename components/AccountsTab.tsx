"use client";

import React from "react";
import { motion } from "motion/react";
import { CreditCard, Plus, Calendar as CalendarIcon } from "lucide-react";
import { useFinancialData } from "./FinancialOSContext";

export const AccountsTab: React.FC = () => {
  const {
    accounts,
    transactions,
    initialBalance,
    setIsAddingAccount,
    setEditingAccountId,
    setDeletingAccount,
    setDeleteAccountTransferTargetId,
    setDeleteActionChoice,
    activeTab,
  } = useFinancialData();

  if (activeTab !== "accounts") return null;

  return (
    <motion.div
      key="accounts"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      className="flex flex-col gap-6 max-w-5xl w-full mx-auto"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
        <div>
          <h2 className="text-2xl font-bold text-zinc-100 flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-indigo-400" />
            Accounts
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-bold text-zinc-400 font-mono">Net Starting Assets:</span>
            <span
              className={`text-sm font-bold font-mono ${
                initialBalance >= 0 ? "text-emerald-400" : "text-amber-400"
              }`}
            >
              $
              {initialBalance.toLocaleString("en-US", {
                minimumFractionDigits: 2,
              })}
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              setIsAddingAccount(true);
              setEditingAccountId(null);
            }}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md font-semibold cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add Account
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-xs font-bold font-mono tracking-wider text-zinc-400 uppercase">
            Registered Accounts
          </h3>
        </div>
        {accounts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-zinc-900/15 border border-dashed border-white/5 rounded-3xl text-center">
            <CreditCard className="w-12 h-12 text-zinc-600 mb-3" />
            <p className="text-sm font-bold text-zinc-300">No Accounts yet</p>
            <p className="text-xs text-zinc-500 max-w-xs mt-1">
              Add a checking or savings account to establish your asset bases and starting projection
              balances.
            </p>
            <button
              type="button"
              onClick={() => {
                setIsAddingAccount(true);
                setEditingAccountId(null);
              }}
              className="mt-4 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md font-semibold cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Create First Account
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {accounts.map((acc) => {

              return (
                <div
                  key={acc.id}
                  className="bg-zinc-900/40 border border-white/10 rounded-2xl p-4.5 flex flex-col justify-between hover:border-indigo-500/40 transition-all group animate-fade-in"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-sm font-bold text-white">{acc.name}</h4>
                      <span
                        className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-md inline-block mt-1 ${
                          acc.type === "savings"
                            ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/15"
                            : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/15"
                        }`}
                      >
                        {acc.type === "other" ? acc.customType || "Other" : acc.type}
                      </span>
                    </div>
                    <span className="text-base font-bold font-mono text-emerald-400">
                      ${acc.balance.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                  </div>

                  {acc.startDate && (
                    <div className="mt-2.5 py-1 px-2 bg-white/5 rounded-lg flex items-center gap-1.5 w-fit">
                      <CalendarIcon className="w-3.5 h-3.5 text-indigo-400" />
                      <span className="text-[10px] text-zinc-400 font-mono font-medium">
                        Active from: {acc.startDate}
                      </span>
                    </div>
                  )}



                  <div className="flex gap-2 justify-end mt-4 pt-3.5 border-t border-white/5 opacity-80 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingAccountId(acc.id);
                        setIsAddingAccount(true);
                      }}
                      className="text-xs font-semibold px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-900 text-zinc-200 hover:text-white rounded-lg transition-all border border-white/5 shadow-sm cursor-pointer"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const otherAccs = accounts.filter((a) => a.id !== acc.id);
                        setDeletingAccount(acc);
                        setDeleteAccountTransferTargetId(
                          otherAccs.length > 0 ? otherAccs[0].id : ""
                        );
                        setDeleteActionChoice(otherAccs.length > 0 ? "transfer" : "archive");
                      }}
                      className="text-xs font-semibold px-2.5 py-1.5 bg-red-500/10 hover:bg-red-500/20 active:bg-red-500/30 text-red-400 hover:text-red-300 rounded-lg transition-all border border-red-500/20 shadow-sm cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
};
export default AccountsTab;
