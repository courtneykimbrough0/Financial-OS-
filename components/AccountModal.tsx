"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { CreditCard, X, Calendar as CalendarIcon } from "lucide-react";
import { useFinancialData } from "./FinancialOSContext";

export const AccountModal: React.FC = () => {
  const {
    isAddingAccount,
    setIsAddingAccount,
    editingAccountId,
    setEditingAccountId,
    accounts,
    saveAccount,
    isSaving,
  } = useFinancialData();

  const [accFormName, setAccFormName] = useState<string>("");
  const [accFormType, setAccFormType] = useState<"checking" | "savings" | "credit-card" | "other">(
    "checking"
  );
  const [accFormCustomType, setAccFormCustomType] = useState<string>("");
  const [accFormBalance, setAccFormBalance] = useState<string>("");
  const [accFormStartDate, setAccFormStartDate] = useState<string>("");
  const [accFormError, setAccFormError] = useState<string | null>(null);

  // Populate form if editing
  useEffect(() => {
    const timer = setTimeout(() => {
      if (editingAccountId) {
        const acc = accounts.find((a) => a.id === editingAccountId);
        if (acc) {
          setAccFormName(acc.name);
          setAccFormType(acc.type);
          setAccFormCustomType(acc.customType || "");
          setAccFormBalance(String(acc.balance));
          setAccFormStartDate(acc.startDate || "");
        }
      } else {
        setAccFormName("");
        setAccFormType("checking");
        setAccFormCustomType("");
        setAccFormBalance("");
        setAccFormStartDate("");
      }
      setAccFormError(null);
    }, 0);
    return () => clearTimeout(timer);
  }, [editingAccountId, isAddingAccount, accounts]);

  if (!isAddingAccount && !editingAccountId) return null;

  const handleClose = () => {
    setIsAddingAccount(false);
    setEditingAccountId(null);
    setAccFormError(null);
  };

  const handleSave = async () => {
    if (!accFormName.trim()) {
      setAccFormError("Please enter an account name.");
      return;
    }
    if (accFormType === "other" && !accFormCustomType.trim()) {
      setAccFormError(
        "Account type cannot be ambiguous. Please specify custom account type."
      );
      return;
    }

    const balanceNum = accFormBalance ? parseFloat(accFormBalance) : 0;
    if (isNaN(balanceNum)) {
      setAccFormError("Please enter a valid balance amount.");
      return;
    }

    const success = await saveAccount({
      id: editingAccountId || undefined,
      name: accFormName.trim(),
      type: accFormType,
      customType: accFormType === "other" ? accFormCustomType.trim() : undefined,
      balance: accFormBalance.trim(),
      startDate: accFormStartDate.trim() || undefined,
    });

    if (success) {
      handleClose();
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 15 }}
          transition={{ duration: 0.15 }}
          className="bg-zinc-950 border border-white/10 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col"
        >
          {/* Header */}
          <div className="p-6 border-b border-white/5 flex justify-between items-center bg-zinc-900/20">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-indigo-400" />
                {editingAccountId ? "Edit Account" : "Register New Account"}
              </h3>
              <p className="text-xs text-zinc-400 mt-1">
                {editingAccountId
                  ? "Modify the parameters or outstanding balance of this account."
                  : "Establish starting balances to anchor your timeline projection."}
              </p>
            </div>
            <button
              type="button"
              disabled={isSaving}
              onClick={handleClose}
              className="p-1.5 rounded-lg hover:bg-white/5 text-zinc-400 hover:text-white transition-colors disabled:opacity-50"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {accFormError && (
            <div className="mx-6 mt-4 p-3 bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs rounded-xl flex justify-between items-center">
              <span>{accFormError}</span>
              <button
                type="button"
                onClick={() => setAccFormError(null)}
                className="font-bold text-sm"
              >
                &times;
              </button>
            </div>
          )}

          <div className="p-6 space-y-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold font-mono tracking-wider text-zinc-400 uppercase">
                Account Title
              </label>
              <input
                type="text"
                disabled={isSaving}
                placeholder="e.g. Primary Checking"
                value={accFormName}
                onChange={(e) => {
                  setAccFormName(e.target.value);
                  setAccFormError(null);
                }}
                className="bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-medium w-full disabled:opacity-50"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold font-mono tracking-wider text-zinc-400 uppercase">
                  Balance ($)
                </label>
                <input
                  type="number"
                  disabled={isSaving}
                  placeholder="0.00"
                  value={accFormBalance}
                  onChange={(e) => {
                    setAccFormBalance(e.target.value);
                    setAccFormError(null);
                  }}
                  className="bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono font-medium w-full disabled:opacity-50"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold font-mono tracking-wider text-zinc-400 uppercase">
                  Account Type
                </label>
                <select
                  value={accFormType}
                  disabled={isSaving}
                  onChange={(e) => {
                    setAccFormType(e.target.value as any);
                    setAccFormError(null);
                  }}
                  className="bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-medium cursor-pointer w-full disabled:opacity-50"
                >
                  <option value="checking">Checking</option>
                  <option value="savings">Savings</option>
                  <option value="credit-card">Credit Card</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            {accFormType === "other" && (
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold font-mono tracking-wider text-amber-400 uppercase">
                  Custom Type (Required)
                </label>
                <input
                  type="text"
                  disabled={isSaving}
                  placeholder="e.g. Cash Safe, Brokerage"
                  value={accFormCustomType}
                  onChange={(e) => {
                    setAccFormCustomType(e.target.value);
                    setAccFormError(null);
                  }}
                  className="bg-zinc-900 border border-amber-500/30 focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none font-medium w-full disabled:opacity-50"
                />
                <span className="text-[9px] text-zinc-500 italic block">
                  Please enter an account type to avoid ambiguity.
                </span>
              </div>
            )}

            <div className="flex flex-col gap-1.5 border-t border-white/5 pt-3">
              <label className="text-[10px] font-bold font-mono tracking-wider text-zinc-400 uppercase flex items-center gap-1">
                <CalendarIcon className="w-3.5 h-3.5 text-indigo-400" />
                Starting Date (Active Projection Date)
              </label>
              <input
                type="date"
                disabled={isSaving}
                value={accFormStartDate}
                onChange={(e) => {
                  setAccFormStartDate(e.target.value);
                  setAccFormError(null);
                }}
                className="bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-medium font-mono w-full cursor-pointer disabled:opacity-50"
              />
              <span className="text-[10px] text-zinc-500 leading-normal">
                This account&apos;s balance only starts to factor into your projection timeline from
                this date onward. Leave empty to start immediately.
              </span>
            </div>
          </div>

          <div className="p-6 bg-zinc-900/40 border-t border-white/5 flex justify-end gap-3">
            <button
              type="button"
              disabled={isSaving}
              onClick={handleClose}
              className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-zinc-300 font-semibold text-xs transition-all disabled:opacity-50 cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={isSaving}
              onClick={handleSave}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all shadow-md font-semibold disabled:opacity-50 cursor-pointer"
            >
              {isSaving ? "Saving..." : editingAccountId ? "Save Changes" : "Register Account"}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
