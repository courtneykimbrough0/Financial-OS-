"use client";

import React, { useState } from "react";
import { motion } from "motion/react";
import { Settings } from "lucide-react";
import { useFinancialData } from "./FinancialOSContext";

export const SettingsTab: React.FC = () => {
  const {
    activeTab,
    currentBalance,
    lowBalanceAlert,
    updateCurrentBalanceInDb,
    updateLowBalanceAlertInDb,
    isSaving,
  } = useFinancialData();

  const [prevBalance, setPrevBalance] = useState<number | null | undefined>(undefined);
  const [balanceInput, setBalanceInput] = useState<string>("");
  const [prevAlert, setPrevAlert] = useState<number | null | undefined>(undefined);
  const [alertInput, setAlertInput] = useState<string>("");

  // Sync local input when the context value first loads (or externally changes)
  if (prevBalance !== currentBalance) {
    setPrevBalance(currentBalance);
    setBalanceInput(currentBalance !== null ? String(currentBalance) : "");
  }
  if (prevAlert !== lowBalanceAlert) {
    setPrevAlert(lowBalanceAlert);
    setAlertInput(lowBalanceAlert !== null ? String(lowBalanceAlert) : "");
  }

  if (activeTab !== "settings") return null;

  const handleBalanceSave = async () => {
    const parsed = balanceInput.trim() === "" ? null : parseFloat(balanceInput);
    if (parsed !== null && isNaN(parsed)) return;
    await updateCurrentBalanceInDb(parsed);
  };

  const handleAlertSave = async () => {
    const parsed = alertInput.trim() === "" ? null : parseFloat(alertInput);
    if (parsed !== null && isNaN(parsed)) return;
    await updateLowBalanceAlertInDb(parsed);
  };

  return (
    <motion.div
      key="settings"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      className="flex flex-col gap-6 max-w-2xl w-full mx-auto"
    >
      <div className="border-b border-white/5 pb-4">
        <h2 className="text-2xl font-bold text-zinc-100 flex items-center gap-2">
          <Settings className="w-6 h-6 text-indigo-400" />
          Settings
        </h2>
      </div>

      <div className="flex flex-col gap-4">
        {/* Current Balance */}
        <div className="bg-zinc-900/60 border border-white/5 rounded-2xl p-5 flex flex-col gap-3">
          <div>
            <label className="block text-sm font-semibold text-zinc-100 mb-0.5">
              Current Balance
            </label>
            <p className="text-xs text-zinc-500">
              Your total cash balance across all accounts right now.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-sm font-mono">
                $
              </span>
              <input
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={balanceInput}
                onChange={(e) => setBalanceInput(e.target.value)}
                onBlur={handleBalanceSave}
                onKeyDown={(e) => e.key === "Enter" && handleBalanceSave()}
                className="w-full pl-7 pr-3 py-2.5 bg-zinc-800/60 border border-white/10 rounded-xl text-sm font-mono text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/20 transition-colors"
                disabled={isSaving}
              />
            </div>
            <button
              onClick={handleBalanceSave}
              disabled={isSaving}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
            >
              Save
            </button>
          </div>
        </div>

        {/* Low Balance Alert */}
        <div className="bg-zinc-900/60 border border-white/5 rounded-2xl p-5 flex flex-col gap-3">
          <div>
            <label className="block text-sm font-semibold text-zinc-100 mb-0.5">
              Low Balance Alert
            </label>
            <p className="text-xs text-zinc-500">
              Get an alert when your balance is projected to fall below this amount.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-sm font-mono">
                $
              </span>
              <input
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={alertInput}
                onChange={(e) => setAlertInput(e.target.value)}
                onBlur={handleAlertSave}
                onKeyDown={(e) => e.key === "Enter" && handleAlertSave()}
                className="w-full pl-7 pr-3 py-2.5 bg-zinc-800/60 border border-white/10 rounded-xl text-sm font-mono text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/20 transition-colors"
                disabled={isSaving}
              />
            </div>
            <button
              onClick={handleAlertSave}
              disabled={isSaving}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default SettingsTab;
