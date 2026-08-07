"use client";

import React, { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "motion/react";
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Plus,
  Trash2,
  CheckCircle,
  TrendingDown,
  Clock,
  Target,
  Coins,
} from "lucide-react";
import { useFinancialData } from "./FinancialOSContext";
import {
  Account,
  RecurringTransaction,
  SAMPLE_ACCOUNTS,
  SAMPLE_TRANSACTIONS,
  getMonthlyEquivalent,
  getQuarterlyEquivalent,
  getFrequencySubtext,
} from "@/lib/forecast";

const generateId = () => "tx_" + Math.random().toString(36).substring(2, 11);

export const OnboardingWizard: React.FC = () => {
  const { completeOnboarding, launchDateStr, updateLaunchDateInDb, isSaving } = useFinancialData();

  const [wizActiveStep, setWizActiveStep] = useState<number>(0);
  const [wizError, setWizError] = useState<string | null>(null);

  // Lists of items configured during onboarding
  const [wizAccounts, setWizAccounts] = useState<Account[]>([]);
  const [wizTransactions, setWizTransactions] = useState<RecurringTransaction[]>([]);

  // Accounts step form inputs
  const [wizAccName, setWizAccName] = useState<string>("");
  const [wizAccType, setWizAccType] = useState<"checking" | "savings" | "other">(
    "checking"
  );
  const [wizAccCustomType, setWizAccCustomType] = useState<string>("");
  const [wizAccBalance, setWizAccBalance] = useState<string>("");

  // Income & Expenses steps form inputs
  const [wizTitle, setWizTitle] = useState<string>("");
  const [wizAmount, setWizAmount] = useState<string>("");
  const [wizFrequency, setWizFrequency] = useState<string>("monthly");
  const [wizSemiDays, setWizSemiDays] = useState<string>("1,15");
  const [wizStartDate, setWizStartDate] = useState<string>("");
  const [wizAccountId, setWizAccountId] = useState<string>("");
  const [wizFundingAccountId, setWizFundingAccountId] = useState<string>("");


  // Expense classification
  const [wizExpenseType, setWizExpenseType] = useState<"fixed-expense" | "subscription">(
    "fixed-expense"
  );

  // Liabilities step form inputs
  const [wizDayOfMonth, setWizDayOfMonth] = useState<string>("1");
  const [wizMovableDueDate, setWizMovableDueDate] = useState<boolean>(false);

  // Savings step form inputs
  const [wizSavingsEnabled, setWizSavingsEnabled] = useState<boolean>(false);
  const [wizSavingsTitle, setWizSavingsTitle] = useState<string>("General Savings");
  const [wizSavingsAmount, setWizSavingsAmount] = useState<string>("");
  const [wizSavingsFrequency, setWizSavingsFrequency] = useState<string>("monthly");
  const [wizSavingsStartDate, setWizSavingsStartDate] = useState<string>("");
  const [wizSavingsFundingId, setWizSavingsFundingId] = useState<string>("");
  const [wizSavingsAccountId, setWizSavingsAccountId] = useState<string>("");

  const handleLoadSampleData = async () => {
    setWizError(null);
    await completeOnboarding(SAMPLE_ACCOUNTS, SAMPLE_TRANSACTIONS, false, "", "", "monthly", "", "", "");
  };

  const handleFinishOnboarding = async () => {
    const success = await completeOnboarding(
      wizAccounts,
      wizTransactions,
      wizSavingsEnabled,
      wizSavingsTitle,
      wizSavingsAmount,
      wizSavingsFrequency,
      wizSavingsStartDate,
      wizSavingsFundingId,
      wizSavingsAccountId
    );
    if (!success) {
      setWizError("An error occurred while establishing your workspace. Please try again.");
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center w-full max-w-5xl mx-auto py-8">
      {/* Header / Brand for onboarding */}
      <div className="w-full mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-zinc-950 border border-white/10 shadow-sm shrink-0">
            <Image src="/icon-mark.png" alt="" width={96} height={96} className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white tracking-tight leading-none">
              Financial OS
            </h1>
            <span className="text-[10px] font-mono tracking-widest text-zinc-500 uppercase mt-0.5 block font-medium">
              Cash Engine
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleLoadSampleData}
            disabled={isSaving}
            className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-950/20 hover:bg-indigo-950/40 border border-indigo-500/20 text-indigo-400 text-xs font-semibold font-mono transition-all cursor-pointer disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Load Sample</span>
          </button>
        </div>
      </div>

      {/* The onboarding setup wizard container */}
      <div className="w-full bg-zinc-950 border border-white/10 rounded-3xl p-6 md:p-8 flex flex-col min-h-[500px] shadow-2xl relative overflow-hidden">
        {/* Progress Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/5">
          <div>
            <div className="flex items-center gap-2 text-indigo-400 font-mono text-xs font-semibold uppercase tracking-wider">
              <Sparkles className="w-4 h-4 animate-pulse" />
              <span>Interactive Onboarding Setup</span>
            </div>
            <h3 className="text-xl font-bold text-white mt-1">Configure Your Financial OS</h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Let&apos;s establish your forecast parameters step-by-step.
            </p>
          </div>

          {/* Progress Indicator */}
          <div className="flex items-center gap-2 bg-zinc-900/40 border border-white/5 px-4 py-2 rounded-2xl">
            {[
              { step: 0, label: "Start" },
              { step: 1, label: "Income" },
              { step: 2, label: "Expenses" },
              { step: 3, label: "Liabilities" },
              { step: 4, label: "Savings" },
              { step: 5, label: "Summary" },
            ].map((item, idx) => (
              <React.Fragment key={item.step}>
                <button
                  onClick={() => {
                    if (item.step <= Math.max(wizActiveStep, 1)) {
                      setWizActiveStep(item.step);
                      setWizError(null);
                    }
                  }}
                  className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold font-mono transition-all cursor-pointer ${
                    wizActiveStep === item.step
                      ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/20"
                      : wizActiveStep > item.step
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                      : "bg-zinc-900 text-zinc-500 border border-white/5"
                  }`}
                >
                  {item.step === 5 ? "✓" : item.step}
                </button>
                {idx < 5 && (
                  <div
                    className={`w-3 sm:w-6 h-[2px] ${
                      wizActiveStep > item.step ? "bg-emerald-500/40" : "bg-zinc-800"
                    }`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Wizard Step Content Container */}
        <div className="flex-1 py-6">
          {wizError && (
            <div className="mb-4 bg-amber-500/10 border border-amber-500/20 px-4 py-2.5 rounded-2xl text-amber-300 text-xs flex items-center justify-between animate-fade-in">
              <span>{wizError}</span>
              <button
                onClick={() => setWizError(null)}
                className="font-bold text-zinc-400 hover:text-white ml-2 cursor-pointer"
              >
                ×
              </button>
            </div>
          )}

          {/* STEP 0: ACCOUNTS SETUP */}
          {wizActiveStep === 0 && (
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex flex-col gap-5"
            >
              {/* Product framing — shown once at the very start */}
              <div className="bg-indigo-500/8 border border-indigo-500/20 rounded-2xl px-5 py-4">
                <p className="text-sm font-semibold text-indigo-200 leading-snug">
                  Financial OS forecasts your recurring bills, income, and planned one-time expenses
                  — it doesn&apos;t track every purchase.
                </p>
                <p className="text-xs text-indigo-300/70 mt-1.5 leading-relaxed">
                  Tell it what&apos;s scheduled, and it shows you what&apos;s left to spend freely — before
                  the next bill hits.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Add Account Inline Form */}
              <div className="lg:col-span-5 bg-zinc-950/40 border border-white/5 p-5 rounded-2xl flex flex-col gap-4">
                <div>
                  <h4 className="text-sm font-bold text-white">1. Add Your Accounts</h4>
                  <p className="text-[11px] text-zinc-400">
                    Establish your checking, savings, or other accounts.
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold font-mono tracking-wider text-zinc-400 uppercase">
                      Account Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Chase Checking, High-Yield Savings"
                      value={wizAccName}
                      onChange={(e) => {
                        setWizAccName(e.target.value);
                        setWizError(null);
                      }}
                      className="bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-medium"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold font-mono tracking-wider text-zinc-400 uppercase">
                        Account Type
                      </label>
                      <select
                        value={wizAccType}
                        onChange={(e) => {
                          setWizAccType(e.target.value as any);
                          setWizError(null);
                        }}
                        className="bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-medium cursor-pointer"
                      >
                        <option value="checking">Checking</option>
                        <option value="savings">Savings</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold font-mono tracking-wider text-zinc-400 uppercase">
                        Starting Balance ($)
                      </label>
                      <input
                        type="number"
                        placeholder="0.00"
                        value={wizAccBalance}
                        onChange={(e) => {
                          setWizAccBalance(e.target.value);
                          setWizError(null);
                        }}
                        className="bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono font-medium"
                      />
                    </div>
                  </div>

                  {wizAccType === "other" && (
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold font-mono tracking-wider text-amber-400 uppercase block">
                        Specify Account Type
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Brokerage, Cash Envelope"
                        value={wizAccCustomType}
                        onChange={(e) => {
                          setWizAccCustomType(e.target.value);
                          setWizError(null);
                        }}
                        className="bg-zinc-900 border border-amber-500/30 focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none font-medium"
                      />
                      <span className="text-[9px] text-zinc-500 italic block">
                        Please enter an account type to avoid ambiguity.
                      </span>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      if (!wizAccName.trim()) {
                        setWizError("Please enter an account name.");
                        return;
                      }
                      if (wizAccType === "other" && !wizAccCustomType.trim()) {
                        setWizError(
                          "Account type cannot be ambiguous. Please specify the custom account type."
                        );
                        return;
                      }
                      const bal = parseFloat(wizAccBalance) || 0;
                      const accId = "acc_" + String(new Date().getTime());
                      const newAccount: Account = {
                        id: accId,
                        name: wizAccName.trim(),
                        type: wizAccType,
                        customType: wizAccType === "other" ? wizAccCustomType.trim() : undefined,
                        balance: Math.max(0, bal),
                      };

                      const updatedAccounts = [...wizAccounts, newAccount];
                      setWizAccounts(updatedAccounts);

                      // Reset form inputs
                      setWizAccName("");
                      setWizAccCustomType("");
                      setWizAccBalance("");
                      setWizError(null);
                    }}
                    className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-md mt-2 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Account</span>
                  </button>
                </div>

                <div className="border-t border-white/5 pt-3">
                  <label className="text-[10px] font-bold font-mono tracking-wider text-zinc-400 uppercase block mb-1">
                    Starting Date
                  </label>
                  <input
                    type="date"
                    value={launchDateStr}
                    onChange={(e) => updateLaunchDateInDb(e.target.value)}
                    className="bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono w-full cursor-pointer"
                  />
                  <span className="text-[9px] text-zinc-500 block mt-1">
                    Forecast timeline projections begin here.
                  </span>
                </div>
              </div>

              {/* List Area */}
              <div className="lg:col-span-7 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h5 className="text-xs font-bold font-mono uppercase tracking-wider text-zinc-400">
                      Accounts
                    </h5>
                    <span className="text-xs font-bold text-indigo-400">
                      Net Assets: $
                      {wizAccounts
                        .reduce(
                          (sum, a) => sum + a.balance,
                          0
                        )
                        .toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                        })}
                    </span>
                  </div>

                  <div className="bg-zinc-950/20 border border-white/5 rounded-2xl overflow-hidden min-h-[180px] flex flex-col justify-center">
                    {wizAccounts.length === 0 ? (
                      <div className="text-center py-8 text-zinc-500 text-xs italic space-y-1.5">
                        <p>No accounts registered yet.</p>
                        <p className="text-[10px] text-zinc-600">
                          Add checking or savings accounts to establish starting funds.
                        </p>
                      </div>
                    ) : (
                      <div className="divide-y divide-white/5 max-h-[220px] overflow-y-auto scrollbar-thin">
                        {wizAccounts.map((acc) => (
                          <div
                            key={acc.id}
                            className="flex items-center justify-between p-3 hover:bg-zinc-900/30 transition-colors"
                          >
                            <div>
                              <p className="text-xs font-semibold text-white">{acc.name}</p>
                              <p className="text-[10px] text-zinc-400 capitalize font-mono">
                                {acc.type === "other" ? acc.customType : acc.type}
                              </p>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-xs font-mono font-bold text-emerald-400">
                                ${acc.balance.toLocaleString("en-US", {
                                  minimumFractionDigits: 2,
                                })}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  setWizAccounts(wizAccounts.filter((a) => a.id !== acc.id));
                                  setWizTransactions(
                                    wizTransactions.filter((t) => t.targetAccountId !== acc.id)
                                  );
                                }}
                                className="text-[10px] text-zinc-400 hover:text-white font-bold px-2 py-1 cursor-pointer font-semibold"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-6 flex items-center justify-between gap-4 border-t border-white/5 mt-6">
                  <button
                    type="button"
                    onClick={handleLoadSampleData}
                    className="text-xs font-mono font-bold text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer"
                  >
                    Skip & Load Sample Data
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const hasCashAcc = wizAccounts.some(
                        (a) => a.type !== "other"
                      );
                      if (!hasCashAcc) {
                        setWizError(
                          "Please register at least one Checking or Savings asset account to begin."
                        );
                        return;
                      }
                      setWizError(null);
                      setWizActiveStep(1);
                    }}
                    className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-bold text-xs text-white flex items-center gap-1.5 shadow-lg shadow-indigo-600/15 transition-all active:scale-95 cursor-pointer"
                  >
                    <span>Next: Set Up Income</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
              </div>{/* end grid wrapper */}
            </motion.div>
          )}

          {/* STEP 1: INCOME SETUP */}
          {wizActiveStep === 1 && (
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-6"
            >
              {/* Inline Form */}
              <div className="lg:col-span-5 bg-zinc-950/40 border border-white/5 p-5 rounded-2xl flex flex-col gap-4">
                <div>
                  <h4 className="text-sm font-bold text-white">Add Income</h4>
                  <p className="text-[11px] text-zinc-400">
                    Register paycheck, wages, or periodic deposits.
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold font-mono tracking-wider text-zinc-400 uppercase">
                      Income Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Work Paycheck"
                      value={wizTitle}
                      onChange={(e) => {
                        setWizTitle(e.target.value);
                        setWizError(null);
                      }}
                      className="bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-medium"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold font-mono tracking-wider text-zinc-400 uppercase">
                        Amount ($)
                      </label>
                      <input
                        type="number"
                        placeholder="0.00"
                        value={wizAmount}
                        onChange={(e) => {
                          setWizAmount(e.target.value);
                          setWizError(null);
                        }}
                        className="bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono font-medium"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold font-mono tracking-wider text-zinc-400 uppercase">
                        Frequency
                      </label>
                      <select
                        value={wizFrequency}
                        onChange={(e) => setWizFrequency(e.target.value)}
                        className="bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-medium cursor-pointer"
                      >
                        <option value="weekly">Weekly</option>
                        <option value="biweekly">Bi-Weekly</option>
                        <option value="semimonthly">Semi-Monthly (1st & 15th)</option>
                        <option value="monthly">Monthly</option>
                        <option value="quarterly">Quarterly</option>
                        <option value="yearly">Yearly</option>
                      </select>
                    </div>
                  </div>

                  {wizFrequency === "semimonthly" && (
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold font-mono tracking-wider text-zinc-400 uppercase">
                        Semi-Monthly Pay Days
                      </label>
                      <input
                        type="text"
                        value={wizSemiDays}
                        onChange={(e) => setWizSemiDays(e.target.value)}
                        placeholder="e.g. 1,15"
                        className="bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                      />
                    </div>
                  )}

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold font-mono tracking-wider text-zinc-400 uppercase">
                      First Pay Date
                    </label>
                    <input
                      type="date"
                      value={wizStartDate || launchDateStr}
                      onChange={(e) => setWizStartDate(e.target.value)}
                      className="bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono cursor-pointer"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold font-mono tracking-wider text-zinc-400 uppercase">
                      Deposit to Account
                    </label>
                    <select
                      value={wizAccountId}
                      required
                      onChange={(e) => setWizAccountId(e.target.value)}
                      className="bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-medium cursor-pointer"
                    >
                      <option value="">Select an account...</option>
                      {wizAccounts
                        .map((acc) => (
                          <option key={acc.id} value={acc.id}>
                            {acc.name} ({acc.type === "other" ? acc.customType || "Other" : acc.type})
                          </option>
                        ))}
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (!wizTitle.trim()) {
                        setWizError("Please enter an income name.");
                        return;
                      }
                      const amt = parseFloat(wizAmount);
                      if (isNaN(amt) || amt <= 0) {
                        setWizError("Please enter a valid amount greater than 0.");
                        return;
                      }
                      if (!wizAccountId) {
                        setWizError("Please select an account to deposit this income into.");
                        return;
                      }
                      const payload: RecurringTransaction = {
                        id: generateId(),
                        title: wizTitle.trim(),
                        amount: amt,
                        startDate: wizStartDate || launchDateStr,
                        frequency: wizFrequency as any,
                        category: "income",
                        accountId: wizAccountId || undefined,
                        semiMonthlyDays:
                          wizFrequency === "semimonthly"
                            ? wizSemiDays
                                .split(",")
                                .map(Number)
                                .filter((n) => !isNaN(n))
                            : undefined,
                      };
                      setWizTransactions([...wizTransactions, payload]);
                      setWizTitle("");
                      setWizAmount("");
                      setWizFrequency("monthly");
                      setWizSemiDays("1,15");
                      setWizAccountId("");
                      setWizError(null);
                    }}
                    className="w-full py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-md mt-2 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Income</span>
                  </button>
                </div>
              </div>

              {/* List Area */}
              <div className="lg:col-span-7 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h5 className="text-xs font-bold font-mono uppercase tracking-wider text-zinc-400">
                      Your Income Summary
                    </h5>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[11px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/20">
                        Base: +$
                        {wizTransactions
                          .filter((t) => t.category === "income")
                          .reduce((acc, c) => acc + getMonthlyEquivalent(c), 0)
                          .toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        /mo
                      </span>
                      <span className="text-[11px] font-mono font-bold text-emerald-300 bg-emerald-500/5 px-2 py-0.5 rounded-lg border border-emerald-500/15">
                        Qtr: +$
                        {wizTransactions
                          .filter((t) => t.category === "income")
                          .reduce((acc, c) => acc + getQuarterlyEquivalent(c), 0)
                          .toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        /qtr
                      </span>
                    </div>
                  </div>

                  <div className="bg-zinc-950/20 border border-white/5 rounded-2xl overflow-hidden min-h-[160px] flex flex-col justify-center">
                    {wizTransactions.filter((t) => t.category === "income").length === 0 ? (
                      <div className="text-center py-8 text-zinc-500 text-xs italic">
                        No income added yet. Please add at least one paycheck.
                      </div>
                    ) : (
                      <div className="divide-y divide-white/5 max-h-[220px] overflow-y-auto scrollbar-thin">
                        {wizTransactions
                          .filter((t) => t.category === "income")
                          .map((t) => (
                            <div
                              key={t.id}
                              className="flex items-center justify-between p-3.5 hover:bg-zinc-900/30 transition-colors"
                            >
                              <div>
                                <p className="text-xs font-semibold text-white">{t.title}</p>
                                <p className="text-[10px] text-zinc-400 capitalize font-mono mt-0.5">
                                  {t.frequency === "biweekly" ? "Bi-Weekly" : t.frequency} &bull;
                                  Next: {t.startDate}
                                </p>
                              </div>
                              <div className="flex items-center gap-3">
                                <div className="text-right">
                                  <p className="text-xs font-mono font-bold text-emerald-400">
                                    +$
                                    {t.amount.toLocaleString("en-US", {
                                      minimumFractionDigits: 2,
                                    })}
                                  </p>
                                  <p className="text-[9px] font-mono text-zinc-400 mt-0.5">
                                    {getFrequencySubtext(t)}
                                  </p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setWizTransactions(wizTransactions.filter((tx) => tx.id !== t.id))
                                  }
                                  className="p-1.5 text-zinc-500 hover:text-amber-400 rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-6 border-t border-white/5 mt-6">
                  <button
                    type="button"
                    onClick={() => setWizActiveStep(0)}
                    className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-zinc-300 font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (wizTransactions.filter((t) => t.category === "income").length === 0) {
                        setWizError(
                          "We highly recommend adding at least one regular income source so the forecast can show what's left to spend."
                        );
                      }
                      setWizActiveStep(2);
                      setWizError(null);
                    }}
                    className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-bold text-xs text-white flex items-center gap-1.5 shadow-lg shadow-indigo-600/15 transition-all cursor-pointer"
                  >
                    <span>Next: Expenses</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 2: EXPENSES SETUP */}
          {wizActiveStep === 2 && (
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-6"
            >
              {/* Inline Form */}
              <div className="lg:col-span-5 bg-zinc-950/40 border border-white/5 p-5 rounded-2xl flex flex-col gap-4">
                <div>
                  <h4 className="text-sm font-bold text-white font-sans">Add Recurring Expense</h4>
                  <p className="text-[11px] text-zinc-400">
                    Enter housing, subscriptions, or fixed outgoings.
                  </p>
                </div>

                <div className="grid grid-cols-2 p-1 bg-zinc-950 rounded-xl border border-white/5">
                  <button
                    type="button"
                    onClick={() => setWizExpenseType("fixed-expense")}
                    className={`py-1.5 rounded-lg text-[10px] font-bold uppercase font-mono transition-all cursor-pointer ${
                      wizExpenseType === "fixed-expense"
                        ? "bg-zinc-800 text-white shadow-sm"
                        : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    Fixed Expense
                  </button>
                  <button
                    type="button"
                    onClick={() => setWizExpenseType("subscription")}
                    className={`py-1.5 rounded-lg text-[10px] font-bold uppercase font-mono transition-all cursor-pointer ${
                      wizExpenseType === "subscription"
                        ? "bg-zinc-800 text-white shadow-sm"
                        : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    Subscription
                  </button>
                </div>

                <div className="space-y-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold font-mono tracking-wider text-zinc-400 uppercase">
                      Expense Name
                    </label>
                    <input
                      type="text"
                      placeholder={
                        wizExpenseType === "fixed-expense"
                          ? "e.g. Rent, Car Insurance"
                          : "e.g. Netflix, Spotify, Gym"
                      }
                      value={wizTitle}
                      onChange={(e) => {
                        setWizTitle(e.target.value);
                        setWizError(null);
                      }}
                      className="bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-medium"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold font-mono tracking-wider text-zinc-400 uppercase">
                        Amount ($)
                      </label>
                      <input
                        type="number"
                        placeholder="0.00"
                        value={wizAmount}
                        onChange={(e) => {
                          setWizAmount(e.target.value);
                          setWizError(null);
                        }}
                        className="bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono font-medium"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold font-mono tracking-wider text-zinc-400 uppercase">
                        Frequency
                      </label>
                      <select
                        value={wizFrequency}
                        onChange={(e) => setWizFrequency(e.target.value)}
                        className="bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-medium cursor-pointer"
                      >
                        <option value="weekly">Weekly</option>
                        <option value="biweekly">Bi-Weekly</option>
                        <option value="monthly">Monthly</option>
                        <option value="quarterly">Quarterly</option>
                        <option value="yearly">Yearly</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold font-mono tracking-wider text-zinc-400 uppercase">
                      Next Due Date
                    </label>
                    <input
                      type="date"
                      value={wizStartDate || launchDateStr}
                      onChange={(e) => setWizStartDate(e.target.value)}
                      className="bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono cursor-pointer"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold font-mono tracking-wider text-zinc-400 uppercase">
                      Paid From Account
                    </label>
                    <select
                      value={wizAccountId}
                      required
                      onChange={(e) => setWizAccountId(e.target.value)}
                      className="bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-medium cursor-pointer"
                    >
                      <option value="">Select an account...</option>
                      {wizAccounts.map((acc) => (
                        <option key={acc.id} value={acc.id}>
                          {acc.name} (
                          {acc.type === "other"
                            ? acc.customType || "Other"
                            : acc.type}
                          )
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (!wizTitle.trim()) {
                        setWizError("Please enter an expense name.");
                        return;
                      }
                      const amt = parseFloat(wizAmount);
                      if (isNaN(amt) || amt <= 0) {
                        setWizError("Please enter a valid amount greater than 0.");
                        return;
                      }
                      if (!wizAccountId) {
                        setWizError("Please select an account to pay this from.");
                        return;
                      }
                      const payload: RecurringTransaction = {
                        id: generateId(),
                        title: wizTitle.trim(),
                        amount: amt,
                        startDate: wizStartDate || launchDateStr,
                        frequency: wizFrequency as any,
                        category: wizExpenseType,
                        accountId: wizAccountId || undefined,
                      };
                      setWizTransactions([...wizTransactions, payload]);
                      setWizTitle("");
                      setWizAmount("");
                      setWizFrequency("monthly");
                      setWizAccountId("");
                      setWizError(null);
                    }}
                    className="w-full py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-md mt-2 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>
                      Add {wizExpenseType === "fixed-expense" ? "Fixed Expense" : "Subscription"}
                    </span>
                  </button>
                </div>
              </div>

              {/* List Area */}
              <div className="lg:col-span-7 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h5 className="text-xs font-bold font-mono uppercase tracking-wider text-zinc-400">
                      Registered Expenses
                    </h5>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[11px] font-mono font-bold text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-lg border border-sky-500/20">
                        Base: -$
                        {wizTransactions
                          .filter(
                            (t) => t.category === "fixed-expense" || t.category === "subscription"
                          )
                          .reduce((acc, c) => acc + getMonthlyEquivalent(c), 0)
                          .toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        /mo
                      </span>
                      <span className="text-[11px] font-mono font-bold text-sky-300 bg-sky-500/5 px-2 py-0.5 rounded-lg border border-sky-500/15">
                        Qtr: -$
                        {wizTransactions
                          .filter(
                            (t) => t.category === "fixed-expense" || t.category === "subscription"
                          )
                          .reduce((acc, c) => acc + getQuarterlyEquivalent(c), 0)
                          .toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        /qtr
                      </span>
                    </div>
                  </div>

                  <div className="bg-zinc-950/20 border border-white/5 rounded-2xl overflow-hidden min-h-[160px] flex flex-col justify-center">
                    {wizTransactions.filter(
                      (t) => t.category === "fixed-expense" || t.category === "subscription"
                    ).length === 0 ? (
                      <div className="text-center py-8 text-zinc-500 text-xs italic">
                        No expenses added yet. Please add any fixed costs or regular subscriptions.
                      </div>
                    ) : (
                      <div className="divide-y divide-white/5 max-h-[220px] overflow-y-auto scrollbar-thin">
                        {wizTransactions
                          .filter(
                            (t) => t.category === "fixed-expense" || t.category === "subscription"
                          )
                          .map((t) => (
                            <div
                              key={t.id}
                              className="flex items-center justify-between p-3.5 hover:bg-zinc-900/30 transition-colors"
                            >
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <p className="text-xs font-semibold text-white">{t.title}</p>
                                  <span
                                    className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase font-mono tracking-wider ${
                                      t.category === "subscription"
                                        ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/15"
                                        : "bg-zinc-800 text-zinc-400"
                                    }`}
                                  >
                                    {t.category === "subscription" ? "Sub" : "Fixed"}
                                  </span>
                                </div>
                                <p className="text-[10px] text-zinc-400 capitalize font-mono mt-1">
                                  {t.frequency} &bull; Next due: {t.startDate}
                                </p>
                              </div>
                              <div className="flex items-center gap-3">
                                <div className="text-right">
                                  <p className="text-xs font-mono font-bold text-sky-400">
                                    -$
                                    {t.amount.toLocaleString("en-US", {
                                      minimumFractionDigits: 2,
                                    })}
                                  </p>
                                  <p className="text-[9px] font-mono text-zinc-400 mt-0.5">
                                    {getFrequencySubtext(t)}
                                  </p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setWizTransactions(wizTransactions.filter((tx) => tx.id !== t.id))
                                  }
                                  className="p-1.5 text-zinc-500 hover:text-amber-400 rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-6 border-t border-white/5 mt-6">
                  <button
                    type="button"
                    onClick={() => setWizActiveStep(1)}
                    className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-zinc-300 font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setWizActiveStep(3);
                      setWizError(null);
                    }}
                    className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-bold text-xs text-white flex items-center gap-1.5 shadow-lg shadow-indigo-600/15 transition-all cursor-pointer"
                  >
                    <span>Next: Liabilities</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 3: LIABILITIES SETUP */}
          {wizActiveStep === 3 && (
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-6"
            >
              {/* Inline Form */}
              <div className="lg:col-span-5 bg-zinc-950/40 border border-white/5 p-5 rounded-2xl flex flex-col gap-4">
                <div>
                  <h4 className="text-sm font-bold text-white">Add Obligation / Liability</h4>
                  <p className="text-[11px] text-zinc-400">
                    Register loans, payments, or monthly obligations.
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold font-mono tracking-wider text-zinc-400 uppercase">
                      Obligation Title
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Student Loan, Auto Lease"
                      value={wizTitle}
                      onChange={(e) => {
                        setWizTitle(e.target.value);
                        setWizError(null);
                      }}
                      className="bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-medium"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold font-mono tracking-wider text-zinc-400 uppercase">
                        Amount ($)
                      </label>
                      <input
                        type="number"
                        placeholder="0.00"
                        value={wizAmount}
                        onChange={(e) => {
                          setWizAmount(e.target.value);
                          setWizError(null);
                        }}
                        className="bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono font-medium"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold font-mono tracking-wider text-zinc-400 uppercase">
                        Frequency
                      </label>
                      <select
                        value={wizFrequency}
                        onChange={(e) => setWizFrequency(e.target.value)}
                        className="bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-medium cursor-pointer"
                      >
                        <option value="weekly">Weekly</option>
                        <option value="biweekly">Bi-Weekly</option>
                        <option value="monthly">Monthly</option>
                        <option value="quarterly">Quarterly</option>
                        <option value="yearly">Yearly</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold font-mono tracking-wider text-zinc-400 uppercase">
                      Next Due Date
                    </label>
                    <input
                      type="date"
                      value={wizStartDate || launchDateStr}
                      onChange={(e) => setWizStartDate(e.target.value)}
                      className="bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono cursor-pointer"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold font-mono tracking-wider text-zinc-400 uppercase">
                      Day of the Month
                    </label>
                    <select
                      value={wizDayOfMonth}
                      onChange={(e) => setWizDayOfMonth(e.target.value)}
                      className="bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono font-medium cursor-pointer"
                    >
                      {Array.from({ length: 30 }, (_, i) => String(i + 1))
                        .concat(["Last"])
                        .map((day) => (
                          <option key={day} value={day}>
                            {day}
                          </option>
                        ))}
                    </select>
                  </div>

                  <label className="flex items-center gap-2.5 cursor-pointer text-[11px] text-zinc-300 font-medium select-none p-3 bg-zinc-900/60 border border-white/5 rounded-xl">
                    <input
                      type="checkbox"
                      checked={wizMovableDueDate}
                      onChange={(e) => setWizMovableDueDate(e.target.checked)}
                      className="w-3.5 h-3.5 rounded border-white/20 bg-zinc-900 text-indigo-500 focus:ring-indigo-500/20 cursor-pointer"
                    />
                    <span>This due date can be moved a few days if needed</span>
                  </label>

                  <div className="flex flex-col gap-1.5 font-sans">
                    <label className="text-[10px] font-bold font-mono tracking-wider text-zinc-400 uppercase">
                      Paid From Account
                    </label>
                    <select
                      value={wizFundingAccountId}
                      required
                      onChange={(e) => setWizFundingAccountId(e.target.value)}
                      className="bg-zinc-900 border border-white/10 rounded-xl px-2.5 py-2 text-[11px] text-white focus:outline-none focus:border-indigo-500 font-medium cursor-pointer"
                    >
                      <option value="">Select an account...</option>
                      {wizAccounts
                        .map((acc) => (
                          <option key={acc.id} value={acc.id}>
                            {acc.name} ({acc.type === "other" ? acc.customType || "Other" : acc.type})
                          </option>
                        ))}
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (!wizTitle.trim()) {
                        setWizError("Please enter an obligation name.");
                        return;
                      }
                      const amt = parseFloat(wizAmount);
                      if (isNaN(amt) || amt <= 0) {
                        setWizError("Please enter a valid amount greater than 0.");
                        return;
                      }
                      if (!wizFundingAccountId) {
                        setWizError("Please select an account to pay this from.");
                        return;
                      }
                      const payload: RecurringTransaction = {
                        id: generateId(),
                        title: wizTitle.trim(),
                        amount: amt,
                        startDate: wizStartDate || launchDateStr,
                        frequency: wizFrequency as any,
                        category: "liability",
                        fundingAccountId: wizFundingAccountId || undefined,
                        dayOfMonth: wizDayOfMonth || undefined,
                        movableDueDate: wizMovableDueDate,
                      };
                      setWizTransactions([...wizTransactions, payload]);
                      setWizTitle("");
                      setWizAmount("");
                      setWizFrequency("monthly");
                      setWizFundingAccountId("");
                      setWizDayOfMonth("1");
                      setWizMovableDueDate(false);
                      setWizError(null);
                    }}
                    className="w-full py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-md mt-2 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Obligation</span>
                  </button>
                </div>
              </div>

              {/* List Area */}
              <div className="lg:col-span-7 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h5 className="text-xs font-bold font-mono uppercase tracking-wider text-zinc-400">
                      Your Liabilities & Obligations
                    </h5>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[11px] font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/20">
                        Base: -$
                        {wizTransactions
                          .filter((t) => t.category === "liability")
                          .reduce((acc, c) => acc + getMonthlyEquivalent(c), 0)
                          .toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        /mo
                      </span>
                      <span className="text-[11px] font-mono font-bold text-amber-300 bg-amber-500/5 px-2 py-0.5 rounded-lg border border-amber-500/15">
                        Qtr: -$
                        {wizTransactions
                          .filter((t) => t.category === "liability")
                          .reduce((acc, c) => acc + getQuarterlyEquivalent(c), 0)
                          .toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        /qtr
                      </span>
                    </div>
                  </div>

                  <div className="bg-zinc-950/20 border border-white/5 rounded-2xl overflow-hidden min-h-[160px] flex flex-col justify-center">
                    {wizTransactions.filter((t) => t.category === "liability").length === 0 ? (
                      <div className="text-center py-8 text-zinc-500 text-xs italic">
                        No obligations added. You can skip this step if you don&apos;t have recurring
                        liabilities.
                      </div>
                    ) : (
                      <div className="divide-y divide-white/5 max-h-[220px] overflow-y-auto scrollbar-thin">
                        {wizTransactions
                          .filter((t) => t.category === "liability")
                          .map((t) => (
                            <div
                              key={t.id}
                              className="flex items-center justify-between p-3.5 hover:bg-zinc-900/30 transition-colors"
                            >
                              <div>
                                <p className="text-xs font-semibold text-white">{t.title}</p>
                                <p className="text-[10px] text-zinc-400 capitalize font-mono mt-0.5">
                                  {t.frequency} &bull; Next due: {t.startDate}
                                </p>
                              </div>
                              <div className="flex items-center gap-3">
                                <div className="text-right">
                                  <p className="text-xs font-mono font-bold text-amber-400">
                                    -$
                                    {t.amount.toLocaleString("en-US", {
                                      minimumFractionDigits: 2,
                                    })}
                                  </p>
                                  <p className="text-[9px] font-mono text-zinc-400 mt-0.5">
                                    {getFrequencySubtext(t)}
                                  </p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setWizTransactions(wizTransactions.filter((tx) => tx.id !== t.id))
                                  }
                                  className="p-1.5 text-zinc-500 hover:text-amber-400 rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-6 border-t border-white/5 mt-6">
                  <button
                    type="button"
                    onClick={() => setWizActiveStep(2)}
                    className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-zinc-300 font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setWizActiveStep(4);
                      setWizError(null);
                    }}
                    className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-bold text-xs text-white flex items-center gap-1.5 shadow-lg shadow-indigo-600/15 transition-all cursor-pointer"
                  >
                    <span>Next: Savings Target</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 4: SAVINGS TARGET SETUP */}
          {wizActiveStep === 4 && (
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div className="max-w-2xl mx-auto bg-zinc-950/40 border border-white/5 p-6 rounded-3xl space-y-4">
                <div>
                  <h4 className="text-base font-bold text-white flex items-center gap-2">
                    <Target className="w-5 h-5 text-cyan-400" />
                    Recurring Savings Target
                  </h4>
                  <p className="text-xs text-zinc-400">
                    Set up automatic savings contributions. Money will be routed on your timeline
                    dynamically.
                  </p>
                </div>

                <div className="flex items-center gap-3 bg-black/20 p-3 rounded-xl border border-white/5">
                  <label className="flex items-center gap-2.5 text-xs font-bold text-white cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={wizSavingsEnabled}
                      onChange={(e) => setWizSavingsEnabled(e.target.checked)}
                      className="rounded bg-zinc-900 border-white/15 text-indigo-500 focus:ring-0 focus:ring-offset-0 w-4 h-4 cursor-pointer"
                    />
                    <span>Enable Recurring Savings targets contribution</span>
                  </label>
                </div>

                {wizSavingsEnabled && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="space-y-4 pt-2"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-bold font-mono tracking-wider text-zinc-400 uppercase">
                          Savings Target Name
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. General Savings"
                          value={wizSavingsTitle}
                          onChange={(e) => setWizSavingsTitle(e.target.value)}
                          className="bg-zinc-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-medium"
                        />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-bold font-mono tracking-wider text-zinc-400 uppercase">
                          Contribution Amount ($)
                        </label>
                        <input
                          type="number"
                          placeholder="0.00"
                          value={wizSavingsAmount}
                          onChange={(e) => setWizSavingsAmount(e.target.value)}
                          className="bg-zinc-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono font-medium"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-bold font-mono tracking-wider text-zinc-400 uppercase">
                          Contribution Frequency
                        </label>
                        <select
                          value={wizSavingsFrequency}
                          onChange={(e) => setWizSavingsFrequency(e.target.value)}
                          className="bg-zinc-900 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-medium cursor-pointer w-full"
                        >
                          <option value="weekly">Weekly</option>
                          <option value="biweekly">Bi-Weekly</option>
                          <option value="monthly">Monthly</option>
                          <option value="quarterly">Quarterly</option>
                          <option value="yearly">Yearly</option>
                        </select>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-bold font-mono tracking-wider text-zinc-400 uppercase">
                          First Contribution Date
                        </label>
                        <input
                          type="date"
                          value={wizSavingsStartDate || launchDateStr}
                          onChange={(e) => setWizSavingsStartDate(e.target.value)}
                          className="bg-zinc-900 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono cursor-pointer"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-bold font-mono tracking-wider text-zinc-400 uppercase">
                          From Account (Source)
                        </label>
                        <select
                          value={wizSavingsFundingId}
                          onChange={(e) => setWizSavingsFundingId(e.target.value)}
                          className="bg-zinc-900 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-medium cursor-pointer"
                        >
                          <option value="">Select cash asset account</option>
                          {wizAccounts
                            .map((acc) => (
                              <option key={acc.id} value={acc.id}>
                                {acc.name} ($
                                {acc.balance.toLocaleString("en-US", { minimumFractionDigits: 2 })})
                              </option>
                            ))}
                        </select>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-bold font-mono tracking-wider text-zinc-400 uppercase">
                          To Account (Destination)
                        </label>
                        <select
                          value={wizSavingsAccountId}
                          onChange={(e) => setWizSavingsAccountId(e.target.value)}
                          className="bg-zinc-900 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-medium cursor-pointer"
                        >
                          <option value="">Select savings target account</option>
                          {wizAccounts
                            .filter((a) => a.type === "savings")
                            .map((acc) => (
                              <option key={acc.id} value={acc.id}>
                                {acc.name} ($
                                {acc.balance.toLocaleString("en-US", { minimumFractionDigits: 2 })})
                              </option>
                            ))}
                        </select>
                      </div>
                    </div>
                  </motion.div>
                )}

                <div className="flex items-center justify-between gap-4 pt-6 mt-4 border-t border-white/5">
                  <button
                    type="button"
                    onClick={() => setWizActiveStep(3)}
                    className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-zinc-300 font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (wizSavingsEnabled) {
                        const svAmt = parseFloat(wizSavingsAmount);
                        if (isNaN(svAmt) || svAmt <= 0) {
                          setWizError("Please enter a valid savings amount.");
                          return;
                        }
                      }
                      setWizError(null);
                      setWizActiveStep(5);
                    }}
                    className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-bold text-xs text-white flex items-center gap-1.5 shadow-lg shadow-indigo-600/15 transition-all cursor-pointer"
                  >
                    <span>Next: Summary & Review</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 5: SUMMARY & LAUNCH */}
          {wizActiveStep === 5 && (
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left Column: Summary Lists */}
                <div className="lg:col-span-6 space-y-4 max-h-[600px] overflow-y-auto pr-1 scrollbar-thin">
                  <div className="bg-zinc-950/40 border border-white/5 p-4 rounded-2xl space-y-3">
                    <h4 className="text-xs font-bold font-mono text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                      Registered Accounts
                    </h4>
                    {wizAccounts.length === 0 ? (
                      <p className="text-xs text-zinc-500 italic">No accounts registered yet.</p>
                    ) : (
                      <div className="space-y-1.5">
                        {wizAccounts.map((acc) => (
                          <div
                            key={acc.id}
                            className="flex justify-between items-center text-xs p-2 rounded-xl bg-black/20 border border-white/5 animate-fade-in"
                          >
                            <div>
                              <p className="font-semibold text-zinc-200">{acc.name}</p>
                              <p className="text-[10px] text-zinc-500 capitalize font-mono">
                                {acc.type === "other" ? acc.customType || "Other" : acc.type}
                              </p>
                            </div>
                            <span className="font-bold font-mono text-zinc-300">
                              ${acc.balance.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="bg-zinc-950/40 border border-white/5 p-4 rounded-2xl space-y-3">
                    <h4 className="text-xs font-bold font-mono text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                      Registered Recurring Items
                    </h4>
                    {wizTransactions.length === 0 && !wizSavingsEnabled ? (
                      <p className="text-xs text-zinc-500 italic">No recurring items registered yet.</p>
                    ) : (
                      <div className="space-y-1.5">
                        {wizTransactions.map((tx) => {
                          const isInc = tx.category === "income";
                          const isLiab = tx.category === "liability";
                          return (
                            <div
                              key={tx.id}
                              className="flex justify-between items-center text-xs p-2 rounded-xl bg-black/20 border border-white/5 animate-fade-in"
                            >
                              <div>
                                <p className="font-semibold text-zinc-200">{tx.title}</p>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <span
                                    className={`text-[8px] font-bold font-mono px-1 rounded uppercase ${
                                      isInc
                                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/15"
                                        : isLiab
                                        ? "bg-amber-500/10 text-amber-400 border border-amber-500/15"
                                        : "bg-sky-500/10 text-sky-400 border border-sky-500/15"
                                    }`}
                                  >
                                    {tx.category === "fixed-expense"
                                      ? "Fixed"
                                      : tx.category === "subscription"
                                      ? "Sub"
                                      : tx.category}
                                  </span>
                                  <span className="text-[9px] text-zinc-500 font-mono capitalize">
                                    {tx.frequency}
                                  </span>
                                </div>
                              </div>
                              <span
                                className={`font-bold font-mono ${
                                  isInc ? "text-emerald-400" : "text-sky-400"
                                }`}
                              >
                                {isInc ? "+" : "-"}$
                                {tx.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                              </span>
                            </div>
                          );
                        })}

                        {wizSavingsEnabled && wizSavingsTitle.trim() && (
                          <div className="flex justify-between items-center text-xs p-2 rounded-xl bg-cyan-950/20 border border-cyan-500/10">
                            <div>
                              <p className="font-semibold text-cyan-300">{wizSavingsTitle.trim()}</p>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="text-[8px] font-bold font-mono px-1 rounded uppercase bg-cyan-500/10 text-cyan-400 border border-cyan-500/15">
                                  Savings Target
                                </span>
                                <span className="text-[9px] text-cyan-500 font-mono capitalize">
                                  {wizSavingsFrequency}
                                </span>
                              </div>
                            </div>
                            <span className="font-bold font-mono text-cyan-400">
                              -$
                              {(parseFloat(wizSavingsAmount) || 0).toLocaleString("en-US", {
                                minimumFractionDigits: 2,
                              })}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Column: Calculations & Submit */}
                <div className="lg:col-span-6 bg-zinc-950/20 border border-white/5 rounded-2xl p-5 space-y-4 flex flex-col justify-between">
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold font-mono text-zinc-400 uppercase tracking-wider">
                      Configuration Metrics
                    </h4>

                    <div className="space-y-2 font-mono text-xs text-zinc-300">
                      <div className="flex justify-between items-center py-1.5 border-b border-white/5">
                        <span>Starting Cash Balance</span>
                        <span className="font-bold text-white">
                          $
                          {wizAccounts
                            .reduce(
                              (acc, a) => acc + a.balance,
                              0
                            )
                            .toLocaleString("en-US", {
                              minimumFractionDigits: 2,
                            })}
                        </span>
                      </div>

                      <div className="flex justify-between items-center py-1.5 border-b border-white/5">
                        <span>Total Income</span>
                        <div className="text-right">
                          <span className="font-bold text-emerald-400">
                            +$
                            {wizTransactions
                              .filter((t) => t.category === "income")
                              .reduce((acc, c) => acc + getMonthlyEquivalent(c), 0)
                              .toLocaleString("en-US", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            /mo
                          </span>
                          <span className="text-[10px] text-emerald-300/80 ml-2">
                            (+$
                            {wizTransactions
                              .filter((t) => t.category === "income")
                              .reduce((acc, c) => acc + getQuarterlyEquivalent(c), 0)
                              .toLocaleString("en-US", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            /qtr)
                          </span>
                        </div>
                      </div>

                      <div className="flex justify-between items-center py-1.5 border-b border-white/5">
                        <span>Recurring Expenses</span>
                        <div className="text-right">
                          <span className="font-bold text-sky-400">
                            -$
                            {wizTransactions
                              .filter(
                                (t) =>
                                  t.category === "fixed-expense" || t.category === "subscription"
                              )
                              .reduce((acc, c) => acc + getMonthlyEquivalent(c), 0)
                              .toLocaleString("en-US", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            /mo
                          </span>
                          <span className="text-[10px] text-sky-300/80 ml-2">
                            (-$
                            {wizTransactions
                              .filter(
                                (t) =>
                                  t.category === "fixed-expense" || t.category === "subscription"
                              )
                              .reduce((acc, c) => acc + getQuarterlyEquivalent(c), 0)
                              .toLocaleString("en-US", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            /qtr)
                          </span>
                        </div>
                      </div>

                      <div className="flex justify-between items-center py-1.5 border-b border-white/5">
                        <span>Liabilities & obligations</span>
                        <div className="text-right">
                          <span className="font-bold text-amber-400">
                            -$
                            {wizTransactions
                              .filter((t) => t.category === "liability")
                              .reduce((acc, c) => acc + getMonthlyEquivalent(c), 0)
                              .toLocaleString("en-US", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            /mo
                          </span>
                          <span className="text-[10px] text-amber-300/80 ml-2">
                            (-$
                            {wizTransactions
                              .filter((t) => t.category === "liability")
                              .reduce((acc, c) => acc + getQuarterlyEquivalent(c), 0)
                              .toLocaleString("en-US", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            /qtr)
                          </span>
                        </div>
                      </div>

                      {wizSavingsEnabled && (
                        <div className="flex justify-between items-center py-1.5 border-b border-white/5">
                          <span>Savings Contribution</span>
                          <div className="text-right">
                            <span className="font-bold text-indigo-400">
                              -$
                              {getMonthlyEquivalent({
                                amount: parseFloat(wizSavingsAmount) || 0,
                                frequency: wizSavingsFrequency as any,
                              }).toLocaleString("en-US", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                              /mo
                            </span>
                            <span className="text-[10px] text-indigo-300/80 ml-2">
                              (-$
                              {getQuarterlyEquivalent({
                                amount: parseFloat(wizSavingsAmount) || 0,
                                frequency: wizSavingsFrequency as any,
                              }).toLocaleString("en-US", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                              /qtr)
                            </span>
                          </div>
                        </div>
                      )}

                      <div className="flex justify-between items-center pt-2.5">
                        <span className="font-bold text-white text-sm">Spendable Margin (Left Over)</span>
                        <div className="text-right">
                          <span className="font-bold text-indigo-300 text-sm">
                            $
                            {(
                              wizTransactions
                                .filter((t) => t.category === "income")
                                .reduce((acc, c) => acc + getMonthlyEquivalent(c), 0) -
                              (wizTransactions
                                .filter(
                                  (t) =>
                                    t.category === "fixed-expense" || t.category === "subscription"
                                )
                                .reduce((acc, c) => acc + getMonthlyEquivalent(c), 0) +
                                wizTransactions
                                  .filter((t) => t.category === "liability")
                                  .reduce((acc, c) => acc + getMonthlyEquivalent(c), 0) +
                                (wizSavingsEnabled
                                  ? getMonthlyEquivalent({
                                      amount: parseFloat(wizSavingsAmount) || 0,
                                      frequency: wizSavingsFrequency as any,
                                    })
                                  : 0))
                            ).toLocaleString("en-US", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                            /mo
                          </span>
                          <span className="text-xs text-indigo-200/80 ml-2 font-normal">
                            ($
                            {(
                              wizTransactions
                                .filter((t) => t.category === "income")
                                .reduce((acc, c) => acc + getQuarterlyEquivalent(c), 0) -
                              (wizTransactions
                                .filter(
                                  (t) =>
                                    t.category === "fixed-expense" || t.category === "subscription"
                                )
                                .reduce((acc, c) => acc + getQuarterlyEquivalent(c), 0) +
                                wizTransactions
                                  .filter((t) => t.category === "liability")
                                  .reduce((acc, c) => acc + getQuarterlyEquivalent(c), 0) +
                                (wizSavingsEnabled
                                  ? getQuarterlyEquivalent({
                                      amount: parseFloat(wizSavingsAmount) || 0,
                                      frequency: wizSavingsFrequency as any,
                                    })
                                  : 0))
                            ).toLocaleString("en-US", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                            /qtr)
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 p-3 rounded-xl bg-zinc-900/60 border border-white/10 text-[11px] text-zinc-400 space-y-1 leading-relaxed font-sans font-medium">
                      <p className="font-semibold text-zinc-300">💡 Standardized Budgeting Baseline Note:</p>
                      <p>
                        Monthly baselines assume 2 paychecks/mo for bi-weekly and 4 payweeks/mo for
                        weekly.
                      </p>
                      <p>
                        Extra bi-weekly paydays and weekly payweeks are dynamically calculated on
                        exact calendar dates in your timeline forecast.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-4 pt-6 mt-6 border-t border-white/5">
                    <button
                      type="button"
                      disabled={isSaving}
                      onClick={() => setWizActiveStep(4)}
                      className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-zinc-300 font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>Back</span>
                    </button>

                    <button
                      type="button"
                      disabled={isSaving}
                      onClick={handleFinishOnboarding}
                      className="px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 font-bold text-xs text-white flex items-center gap-2 shadow-xl shadow-indigo-600/20 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>{isSaving ? "Establishing engine..." : "Launch Financial OS"}</span>
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};
export default OnboardingWizard;
