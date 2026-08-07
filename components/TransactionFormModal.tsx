"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Coins,
  X,
  ArrowRight,
  ArrowLeft,
  TrendingDown,
  Clock,
  Zap,
  Calendar as CalendarIcon,
  CheckCircle2,
  Flame,
  Snowflake,
  Target,
} from "lucide-react";
import { useFinancialData } from "./FinancialOSContext";
import { formatDateLocal } from "@/lib/forecast";

export const TransactionFormModal: React.FC = () => {
  const {
    isAddingTransaction,
    setIsAddingTransaction,
    formCategory,
    setFormCategory,
    editingId,
    setEditingId,
    wizardStep,
    setWizardStep,
    wizardError,
    setWizardError,
    transactions,
    saveTransaction,
    markLiabilityPaidOff,
    isSaving,
  } = useFinancialData();
  const todayStr = formatDateLocal(new Date());

  // Form Inputs local state
  const [formTitle, setFormTitle] = useState<string>("");
  const [formAmount, setFormAmount] = useState<string>("");
  const [formStartDate, setFormStartDate] = useState<string>("");
  const [formFrequency, setFormFrequency] = useState<string>("monthly");
  const [formSemiDays, setFormSemiDays] = useState<string>("1,15");
  const [formNotes, setFormNotes] = useState<string>("");

  // Liability-specific inputs local state
  const [formDayOfMonth, setFormDayOfMonth] = useState<string>("1");
  const [formMovableDueDate, setFormMovableDueDate] = useState<boolean>(false);
  const [formMarkPaidOffDate, setFormMarkPaidOffDate] = useState<string>("");

  // Populate form if editing, or set defaults if creating
  useEffect(() => {
    const timer = setTimeout(() => {
      if (editingId) {
        const tx = transactions.find((t) => t.id === editingId);
        if (tx) {
          setFormTitle(tx.title);
          setFormAmount(String(tx.amount));
          setFormStartDate(tx.startDate);
          setFormFrequency(tx.frequency);
          setFormSemiDays(tx.semiMonthlyDays ? tx.semiMonthlyDays.join(",") : "1,15");
          setFormNotes(tx.notes || "");
          setFormDayOfMonth(tx.dayOfMonth || "1");
          setFormMovableDueDate(!!tx.movableDueDate);
          setFormMarkPaidOffDate(formatDateLocal(new Date()));
        }
      } else {
        setFormTitle("");
        setFormAmount("");
        setFormStartDate(todayStr);
        setFormFrequency(formCategory === "income" ? "biweekly" : "monthly");
        setFormSemiDays("1,15");
        setFormNotes("");
        setFormDayOfMonth("1");
        setFormMovableDueDate(false);
        setFormMarkPaidOffDate("");
      }
      setWizardStep(1);
      setWizardError(null);
    }, 0);

    return () => clearTimeout(timer);
  }, [
    editingId,
    isAddingTransaction,
    formCategory,
    todayStr,
    transactions,
    setWizardStep,
    setWizardError,
  ]);

  if (!isAddingTransaction) return null;

  const resetForm = () => {
    setIsAddingTransaction(false);
    setEditingId(null);
    setWizardStep(1);
    setWizardError(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setWizardError(null);

    const success = await saveTransaction({
      id: editingId || undefined,
      title: formTitle,
      amount: formAmount,
      startDate: formStartDate,
      frequency: formFrequency,
      category: formCategory,
      semiMonthlyDays: formSemiDays,
      notes: formNotes,
      dayOfMonth: formDayOfMonth,
      movableDueDate: formMovableDueDate,
    });

    if (success) {
      resetForm();
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 15 }}
          transition={{ duration: 0.2 }}
          className={`bg-zinc-950 border rounded-[2rem] w-full max-w-lg overflow-hidden shadow-2xl transition-colors ${
            formCategory === "income"
              ? "border-emerald-500/30"
              : formCategory === "liability"
              ? "border-amber-500/30"
              : "border-sky-500/30"
          }`}
        >
          {/* ==================== 1. INCOME WIZARD ==================== */}
          {formCategory === "income" && (
            <div className="flex flex-col">
              {/* Income Header */}
              <div className="p-5 border-b border-white/5 flex items-center justify-between gap-3 bg-zinc-900/60">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                    <Coins className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-zinc-100 flex items-center gap-2">
                      {editingId ? "Edit Income Wizard" : "Income Wizard"}
                    </h3>
                    <p className="text-xs text-zinc-400">
                      Step {wizardStep} of 3 &bull;{" "}
                      {wizardStep === 1
                        ? "Source Title"
                        : wizardStep === 2
                        ? "Paycheck & Schedule"
                        : "First Pay Date & Review"}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={isSaving}
                  onClick={resetForm}
                  className="p-2 hover:bg-zinc-800 rounded-xl text-zinc-400 hover:text-white transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Step Progress Bar */}
              <div className="px-6 pt-3 pb-3 bg-black/40 border-b border-white/5 flex items-center gap-2">
                <div
                  className={`flex-1 h-1.5 rounded-full transition-all ${
                    wizardStep >= 1 ? "bg-emerald-500" : "bg-zinc-800"
                  }`}
                />
                <div
                  className={`flex-1 h-1.5 rounded-full transition-all ${
                    wizardStep >= 2 ? "bg-emerald-500" : "bg-zinc-800"
                  }`}
                />
                <div
                  className={`flex-1 h-1.5 rounded-full transition-all ${
                    wizardStep >= 3 ? "bg-emerald-500" : "bg-zinc-800"
                  }`}
                />
              </div>

              {/* Wizard Form Content */}
              <div className="p-6">
                {wizardError && (
                  <div className="mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-center justify-between">
                    <span>{wizardError}</span>
                    <button
                      type="button"
                      onClick={() => setWizardError(null)}
                      className="text-amber-400 font-bold ml-2 cursor-pointer"
                    >
                      x
                    </button>
                  </div>
                )}

                {/* Step 1: Source & Title */}
                {wizardStep === 1 && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-mono tracking-widest text-zinc-400 uppercase mb-1.5">
                        Income Source Name
                      </label>
                      <input
                        type="text"
                        required
                        autoFocus
                        value={formTitle}
                        onChange={(e) => {
                          setFormTitle(e.target.value);
                          if (wizardError) setWizardError(null);
                        }}
                        placeholder="e.g. Primary Salary, Client Retainer, Side Gig"
                        className="block w-full px-3.5 py-2.5 text-xs bg-black/40 border border-white/10 rounded-xl focus:outline-none focus:border-emerald-500 text-zinc-100 transition-colors"
                      />
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-white/5 mt-4">
                      <button
                        type="button"
                        onClick={resetForm}
                        className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 text-xs font-semibold transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (!formTitle.trim()) {
                            setWizardError("Please enter an Income Source Name.");
                            return;
                          }
                          setWizardError(null);
                          setWizardStep(2);
                        }}
                        className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors shadow-lg shadow-emerald-950/50 flex items-center gap-1.5 cursor-pointer"
                      >
                        <span>Next: Amount & Schedule</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 2: Paycheck & Schedule */}
                {wizardStep === 2 && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-mono tracking-widest text-zinc-400 uppercase mb-1.5">
                        Paycheck Amount ($)
                      </label>
                      <input
                        type="number"
                        required
                        min="0.01"
                        step="any"
                        autoFocus
                        placeholder="e.g. 2500"
                        value={formAmount}
                        onChange={(e) => {
                          setFormAmount(e.target.value);
                          if (wizardError) setWizardError(null);
                        }}
                        className="block w-full px-3.5 py-2.5 text-xs bg-black/40 border border-white/10 rounded-xl focus:outline-none focus:border-emerald-500 text-zinc-100 font-mono transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono tracking-widest text-zinc-400 uppercase mb-1.5">
                        Paycheck Frequency
                      </label>
                      <select
                        value={formFrequency}
                        onChange={(e) => setFormFrequency(e.target.value)}
                        className="block w-full px-3.5 py-2.5 text-xs bg-black/40 border border-white/10 rounded-xl focus:outline-none focus:border-emerald-500 text-zinc-100 transition-colors cursor-pointer"
                      >
                        <option value="biweekly">Bi-Weekly (Every 2 Weeks / Payday)</option>
                        <option value="semimonthly">
                          Semi-Monthly (Specific Days e.g. 1st & 15th)
                        </option>
                        <option value="monthly">Monthly Salary</option>
                        <option value="weekly">Weekly Direct Deposit</option>
                        <option value="quarterly">Quarterly Dividend / Bonus</option>
                        <option value="yearly">Yearly Distribution</option>
                      </select>
                    </div>

                    {formFrequency === "semimonthly" && (
                      <div className="p-3 bg-emerald-950/20 border border-emerald-500/20 rounded-xl">
                        <label className="block text-[9px] font-mono text-emerald-400 uppercase mb-1 font-bold">
                          Pay Days of Month (Comma Separated)
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. 1, 15"
                          value={formSemiDays}
                          onChange={(e) => setFormSemiDays(e.target.value)}
                          className="block w-full px-2.5 py-1.5 text-xs bg-zinc-950 border border-emerald-500/30 rounded-lg focus:outline-none focus:border-emerald-400 text-zinc-100 font-mono transition-colors"
                        />
                      </div>
                    )}

                    <div className="flex justify-between items-center pt-4 border-t border-white/5 mt-4">
                      <button
                        type="button"
                        onClick={() => {
                          setWizardError(null);
                          setWizardStep(1);
                        }}
                        className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        <span>Back</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const amt = parseFloat(formAmount);
                          if (isNaN(amt) || amt <= 0) {
                            setWizardError("Please enter a valid amount greater than $0.");
                            return;
                          }
                          setWizardError(null);
                          setWizardStep(3);
                        }}
                        className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors shadow-lg shadow-emerald-950/50 flex items-center gap-1.5 cursor-pointer"
                      >
                        <span>Next: First Date & Review</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 3: First Date & Final Review */}
                {wizardStep === 3 && (
                  <form onSubmit={handleSave} className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-mono tracking-widest text-zinc-400 uppercase mb-1.5">
                        First Pay Date
                      </label>
                      <input
                        type="date"
                        required
                        disabled={isSaving}
                        value={formStartDate}
                        onChange={(e) => setFormStartDate(e.target.value)}
                        className="block w-full px-3.5 py-2.5 text-xs bg-black/40 border border-white/10 rounded-xl focus:outline-none focus:border-emerald-500 text-zinc-100 font-mono transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono tracking-widest text-zinc-400 uppercase mb-1.5">
                        Notes (Optional)
                      </label>
                      <textarea
                        rows={2}
                        disabled={isSaving}
                        placeholder="e.g. Direct deposit after tax withholdings..."
                        value={formNotes}
                        onChange={(e) => setFormNotes(e.target.value)}
                        className="block w-full px-3.5 py-2.5 text-xs bg-black/40 border border-white/10 rounded-xl focus:outline-none focus:border-emerald-500 text-zinc-100 transition-colors"
                      />
                    </div>

                    {/* Summary Card */}
                    <div className="p-3.5 bg-emerald-950/20 border border-emerald-500/20 rounded-2xl flex flex-col gap-1.5 text-xs">
                      <div className="text-[10px] font-mono uppercase text-emerald-400 font-bold tracking-wider">
                        Income Summary Review
                      </div>
                      <div className="flex justify-between text-zinc-300">
                        <span>Source:</span>
                        <span className="font-semibold text-white">{formTitle}</span>
                      </div>
                      <div className="flex justify-between text-zinc-300">
                        <span>Amount & Frequency:</span>
                        <span className="font-semibold text-emerald-400 font-mono">
                          ${formAmount} ({formFrequency})
                        </span>
                      </div>
                      <div className="flex justify-between text-zinc-300">
                        <span>First Deposit:</span>
                        <span className="font-semibold text-white font-mono">{formStartDate}</span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-4 border-t border-white/5 mt-4">
                      <button
                        type="button"
                        disabled={isSaving}
                        onClick={() => {
                          setWizardError(null);
                          setWizardStep(2);
                        }}
                        className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        <span>Back</span>
                      </button>
                      <button
                        type="submit"
                        disabled={isSaving}
                        className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors shadow-lg shadow-emerald-950/50 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <Coins className="w-3.5 h-3.5" />
                        <span>
                          {isSaving
                            ? "Saving..."
                            : editingId
                            ? "Save Changes"
                            : "Complete & Save Income"}
                        </span>
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          )}

          {/* ==================== 2. EXPENSES WIZARD ==================== */}
          {(formCategory === "fixed-expense" ||
            formCategory === "subscription" ||
            formCategory === "savings") && (
            <div className="flex flex-col">
              {/* Expense Header */}
              <div className="p-5 border-b border-white/5 flex items-center justify-between gap-3 bg-zinc-900/60">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-400">
                    <TrendingDown className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-zinc-100 flex items-center gap-2">
                      {editingId ? "Edit Expense Wizard" : "Expenses Wizard"}
                    </h3>
                    <p className="text-xs text-zinc-400">
                      Step {wizardStep} of 3 &bull;{" "}
                      {wizardStep === 1
                        ? "Classification & Name"
                        : wizardStep === 2
                        ? "Amount & Billing Frequency"
                        : "Next Due Date & Review"}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={isSaving}
                  onClick={resetForm}
                  className="p-2 hover:bg-zinc-800 rounded-xl text-zinc-400 hover:text-white transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Step Progress Bar */}
              <div className="px-6 pt-3 pb-3 bg-black/40 border-b border-white/5 flex items-center gap-2">
                <div
                  className={`flex-1 h-1.5 rounded-full transition-all ${
                    wizardStep >= 1 ? "bg-sky-500" : "bg-zinc-800"
                  }`}
                />
                <div
                  className={`flex-1 h-1.5 rounded-full transition-all ${
                    wizardStep >= 2 ? "bg-sky-500" : "bg-zinc-800"
                  }`}
                />
                <div
                  className={`flex-1 h-1.5 rounded-full transition-all ${
                    wizardStep >= 3 ? "bg-sky-500" : "bg-zinc-800"
                  }`}
                />
              </div>

              {/* Wizard Form Content */}
              <div className="p-6">
                {wizardError && (
                  <div className="mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-center justify-between">
                    <span>{wizardError}</span>
                    <button
                      type="button"
                      onClick={() => setWizardError(null)}
                      className="text-amber-400 font-bold ml-2 cursor-pointer"
                    >
                      x
                    </button>
                  </div>
                )}

                {/* Step 1: Type & Name */}
                {wizardStep === 1 && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-mono tracking-widest text-zinc-400 uppercase mb-1.5">
                        Expense Classification
                      </label>
                      <div className="grid grid-cols-3 gap-1.5 bg-black/40 p-1 border border-white/5 rounded-xl">
                        <button
                          type="button"
                          onClick={() => setFormCategory("fixed-expense")}
                          className={`text-[10px] font-mono font-bold py-2 rounded-lg transition-all text-center cursor-pointer ${
                            formCategory === "fixed-expense"
                              ? "bg-sky-600/30 text-sky-200 border border-sky-500/30 shadow-sm"
                              : "text-zinc-500 hover:text-zinc-300"
                          }`}
                        >
                          Fixed Bill
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormCategory("subscription")}
                          className={`text-[10px] font-mono font-bold py-2 rounded-lg transition-all text-center cursor-pointer ${
                            formCategory === "subscription"
                              ? "bg-violet-600/30 text-violet-200 border border-violet-500/30 shadow-sm"
                              : "text-zinc-500 hover:text-zinc-300"
                          }`}
                        >
                          Subscription
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormCategory("savings")}
                          className={`text-[10px] font-mono font-bold py-2 rounded-lg transition-all text-center cursor-pointer ${
                            formCategory === "savings"
                              ? "bg-cyan-600/30 text-cyan-200 border border-cyan-500/30 shadow-sm"
                              : "text-zinc-500 hover:text-zinc-300"
                          }`}
                        >
                          Savings
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono tracking-widest text-zinc-400 uppercase mb-1.5">
                        Expense Name
                      </label>
                      <input
                        type="text"
                        required
                        autoFocus
                        value={formTitle}
                        onChange={(e) => {
                          setFormTitle(e.target.value);
                          if (wizardError) setWizardError(null);
                        }}
                        placeholder={
                          formCategory === "fixed-expense"
                            ? "e.g. Rent, Electricity, Grocery Budget"
                            : formCategory === "subscription"
                            ? "e.g. Netflix, Spotify, iCloud Storage"
                            : "e.g. Liquid Reserve, High-Yield Savings"
                        }
                        className="block w-full px-3.5 py-2.5 text-xs bg-black/40 border border-white/10 rounded-xl focus:outline-none focus:border-sky-500 text-zinc-100 transition-colors"
                      />
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-white/5 mt-4">
                      <button
                        type="button"
                        onClick={resetForm}
                        className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 text-xs font-semibold transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (!formTitle.trim()) {
                            setWizardError("Please enter an Expense Name.");
                            return;
                          }
                          setWizardError(null);
                          setWizardStep(2);
                        }}
                        className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs transition-colors shadow-lg shadow-sky-950/50 flex items-center gap-1.5 cursor-pointer"
                      >
                        <span>Next: Amount & Frequency</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 2: Amount & Frequency */}
                {wizardStep === 2 && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-mono tracking-widest text-zinc-400 uppercase mb-1.5">
                        Expense Amount ($)
                      </label>
                      <input
                        type="number"
                        required
                        min="0.01"
                        step="any"
                        autoFocus
                        placeholder="e.g. 1200"
                        value={formAmount}
                        onChange={(e) => {
                          setFormAmount(e.target.value);
                          if (wizardError) setWizardError(null);
                        }}
                        className="block w-full px-3.5 py-2.5 text-xs bg-black/40 border border-white/10 rounded-xl focus:outline-none focus:border-sky-500 text-zinc-100 font-mono transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono tracking-widest text-zinc-400 uppercase mb-1.5">
                        Billing Cycle Frequency
                      </label>
                      <select
                        value={formFrequency}
                        onChange={(e) => setFormFrequency(e.target.value)}
                        className="block w-full px-3.5 py-2.5 text-xs bg-black/40 border border-white/10 rounded-xl focus:outline-none focus:border-sky-500 text-zinc-100 transition-colors cursor-pointer"
                      >
                        <option value="monthly">Monthly</option>
                        <option value="weekly">Weekly</option>
                        <option value="biweekly">Bi-Weekly</option>
                        <option value="quarterly">Quarterly</option>
                        <option value="yearly">Yearly</option>
                      </select>
                    </div>

                    <div className="flex justify-between items-center pt-4 border-t border-white/5 mt-4">
                      <button
                        type="button"
                        onClick={() => {
                          setWizardError(null);
                          setWizardStep(1);
                        }}
                        className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        <span>Back</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const amt = parseFloat(formAmount);
                          if (isNaN(amt) || amt <= 0) {
                            setWizardError("Please enter a valid amount greater than $0.");
                            return;
                          }
                          setWizardError(null);
                          setWizardStep(3);
                        }}
                        className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs transition-colors shadow-lg shadow-sky-950/50 flex items-center gap-1.5 cursor-pointer"
                      >
                        <span>Next: Due Date & Review</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 3: Due Date & Final Review */}
                {wizardStep === 3 && (
                  <form onSubmit={handleSave} className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-mono tracking-widest text-zinc-400 uppercase mb-1.5">
                        Next Due Date
                      </label>
                      <input
                        type="date"
                        required
                        disabled={isSaving}
                        value={formStartDate}
                        onChange={(e) => setFormStartDate(e.target.value)}
                        className="block w-full px-3.5 py-2.5 text-xs bg-black/40 border border-white/10 rounded-xl focus:outline-none focus:border-sky-500 text-zinc-100 font-mono transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono tracking-widest text-zinc-400 uppercase mb-1.5">
                        Notes (Optional)
                      </label>
                      <textarea
                        rows={2}
                        disabled={isSaving}
                        placeholder="e.g. Auto-pay configured on checking account..."
                        value={formNotes}
                        onChange={(e) => setFormNotes(e.target.value)}
                        className="block w-full px-3.5 py-2.5 text-xs bg-black/40 border border-white/10 rounded-xl focus:outline-none focus:border-sky-500 text-zinc-100 transition-colors"
                      />
                    </div>

                    {/* Summary Card */}
                    <div className="p-3.5 bg-sky-950/20 border border-sky-500/20 rounded-2xl flex flex-col gap-1.5 text-xs">
                      <div className="text-[10px] font-mono uppercase text-sky-400 font-bold tracking-wider">
                        Expense Summary Review
                      </div>
                      <div className="flex justify-between text-zinc-300">
                        <span>Type:</span>
                        <span className="font-semibold text-white capitalize">
                          {formCategory.replace("-", " ")}
                        </span>
                      </div>
                      <div className="flex justify-between text-zinc-300">
                        <span>Expense:</span>
                        <span className="font-semibold text-white">{formTitle}</span>
                      </div>
                      <div className="flex justify-between text-zinc-300">
                        <span>Amount & Frequency:</span>
                        <span className="font-semibold text-sky-400 font-mono">
                          ${formAmount} ({formFrequency})
                        </span>
                      </div>
                      <div className="flex justify-between text-zinc-300">
                        <span>Next Due Date:</span>
                        <span className="font-semibold text-white font-mono">{formStartDate}</span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-4 border-t border-white/5 mt-4">
                      <button
                        type="button"
                        disabled={isSaving}
                        onClick={() => {
                          setWizardError(null);
                          setWizardStep(2);
                        }}
                        className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-semibold text-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        <span>Back</span>
                      </button>
                      <button
                        type="submit"
                        disabled={isSaving}
                        className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs transition-colors shadow-lg shadow-sky-950/50 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <TrendingDown className="w-3.5 h-3.5" />
                        <span>
                          {isSaving
                            ? "Saving..."
                            : editingId
                            ? "Save Changes"
                            : "Complete & Save Expense"}
                        </span>
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          )}

          {/* ==================== 3. LIABILITIES WIZARD ==================== */}
          {formCategory === "liability" && (
            <div className="flex flex-col animate-fade-in">
              {/* Liability Header */}
              <div className="p-5 border-b border-white/10 flex items-center justify-between gap-3 bg-zinc-900/80">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-zinc-100 flex items-center gap-2">
                      {editingId ? "Edit Liability Wizard" : "Liability Wizard"}
                    </h3>
                    <p className="text-xs text-zinc-400">
                      Step {wizardStep} of 3 &bull;{" "}
                      {wizardStep === 1
                        ? "Name"
                        : wizardStep === 2
                        ? "Amount & Schedule"
                        : "Due Date & Review"}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={isSaving}
                  onClick={resetForm}
                  className="p-2 hover:bg-zinc-800 rounded-xl text-zinc-400 hover:text-white transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Step Progress Bar */}
              <div className="px-6 pt-3 pb-3 bg-black/40 border-b border-white/5 flex items-center gap-2">
                <div
                  className={`flex-1 h-1.5 rounded-full transition-all ${
                    wizardStep >= 1 ? "bg-amber-500" : "bg-zinc-800"
                  }`}
                />
                <div
                  className={`flex-1 h-1.5 rounded-full transition-all ${
                    wizardStep >= 2 ? "bg-amber-500" : "bg-zinc-800"
                  }`}
                />
                <div
                  className={`flex-1 h-1.5 rounded-full transition-all ${
                    wizardStep >= 3 ? "bg-amber-500" : "bg-zinc-800"
                  }`}
                />
              </div>

              {/* Wizard Form Content */}
              <div className="p-6 max-h-[75vh] overflow-y-auto">
                {wizardError && (
                  <div className="mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-center justify-between">
                    <span>{wizardError}</span>
                    <button
                      type="button"
                      onClick={() => setWizardError(null)}
                      className="text-amber-400 font-bold ml-2 cursor-pointer"
                    >
                      x
                    </button>
                  </div>
                )}

                {/* Step 1: Name */}
                {wizardStep === 1 && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                        Liability Name *
                      </label>
                      <input
                        type="text"
                        required
                        autoFocus
                        placeholder="e.g. Home Depot, Navy Federal, Military Star"
                        value={formTitle}
                        onChange={(e) => {
                          setFormTitle(e.target.value);
                          if (wizardError) setWizardError(null);
                        }}
                        className="block w-full px-3.5 py-2.5 text-xs bg-zinc-950 border border-white/10 rounded-xl focus:outline-none focus:border-amber-500 text-zinc-100 transition-colors font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                        Custom note (Optional)
                      </label>
                      <textarea
                        rows={3}
                        placeholder="e.g. Account number ending in 4021..."
                        value={formNotes}
                        onChange={(e) => setFormNotes(e.target.value)}
                        className="block w-full px-3.5 py-2.5 text-xs bg-zinc-950 border border-white/10 rounded-xl focus:outline-none focus:border-amber-500 text-zinc-100 transition-colors font-medium"
                      />
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-white/5 mt-4">
                      <button
                        type="button"
                        onClick={resetForm}
                        className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 text-xs font-semibold transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (!formTitle.trim()) {
                            setWizardError("Please enter a Liability Name.");
                            return;
                          }
                          setWizardError(null);
                          setWizardStep(2);
                        }}
                        className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs transition-colors shadow-lg shadow-amber-950/50 flex items-center gap-1.5 cursor-pointer"
                      >
                        <span>Next: Amount & Schedule</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 2: Amount & Schedule */}
                {wizardStep === 2 && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-amber-400 mb-1.5">
                        Scheduled payment amount ($) *
                      </label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 text-xs font-mono font-bold">
                          $
                        </span>
                        <input
                          type="number"
                          min="0.01"
                          step="any"
                          required
                          autoFocus
                          placeholder="e.g. 195"
                          value={formAmount}
                          onChange={(e) => {
                            setFormAmount(e.target.value);
                            if (wizardError) setWizardError(null);
                          }}
                          className="block w-full pl-8 pr-3.5 py-2.5 text-xs bg-zinc-950 border border-amber-500/40 rounded-xl focus:outline-none focus:border-amber-400 text-zinc-100 font-mono transition-colors font-medium"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                        Payment frequency *
                      </label>
                      <select
                        value={formFrequency}
                        onChange={(e) => setFormFrequency(e.target.value)}
                        className="block w-full px-3.5 py-2.5 text-xs bg-zinc-950 border border-white/10 rounded-xl focus:outline-none focus:border-amber-500 text-zinc-100 transition-colors cursor-pointer font-medium"
                      >
                        <option value="monthly">Once per month</option>
                        <option value="biweekly">Bi-weekly</option>
                        <option value="weekly">Weekly</option>
                        <option value="semimonthly">Semi-monthly</option>
                        <option value="quarterly">Quarterly</option>
                        <option value="yearly">Yearly</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-zinc-300 mb-2">
                        Day of the month *
                      </label>
                      <div className="grid grid-cols-7 sm:grid-cols-10 gap-1.5 p-3 bg-zinc-950 border border-white/10 rounded-2xl">
                        {Array.from({ length: 30 }, (_, i) => String(i + 1))
                          .concat(["Last"])
                          .map((day) => {
                            const isSelected = formDayOfMonth === day;
                            return (
                              <button
                                key={day}
                                type="button"
                                onClick={() => {
                                  setFormDayOfMonth(day);
                                  if (formStartDate) {
                                    const parts = formStartDate.split("-");
                                    if (parts.length === 3) {
                                      const year = parts[0];
                                      const month = parts[1];
                                      const dayNum = day === "Last" ? "28" : day.padStart(2, "0");
                                      setFormStartDate(`${year}-${month}-${dayNum}`);
                                    }
                                  }
                                }}
                                className={`h-9 rounded-xl text-xs font-mono font-bold transition-all flex items-center justify-center cursor-pointer ${
                                  isSelected
                                    ? "bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20 scale-105"
                                    : "bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-white/5"
                                }`}
                              >
                                {day}
                              </button>
                            );
                          })}
                      </div>
                    </div>

                    <label className="flex items-center gap-2.5 cursor-pointer text-xs text-zinc-200 font-medium p-3 bg-zinc-950/60 border border-white/5 rounded-xl">
                      <input
                        type="checkbox"
                        checked={formMovableDueDate}
                        onChange={(e) => setFormMovableDueDate(e.target.checked)}
                        className="w-4 h-4 rounded border-white/20 bg-zinc-900 text-amber-500 focus:ring-amber-500/20 cursor-pointer"
                      />
                      <span>This due date can be moved a few days if needed</span>
                    </label>

                    <div className="flex justify-between items-center pt-4 border-t border-white/5 mt-4">
                      <button
                        type="button"
                        onClick={() => {
                          setWizardError(null);
                          setWizardStep(1);
                        }}
                        className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        <span>Back</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const amt = parseFloat(formAmount);
                          if (isNaN(amt) || amt <= 0) {
                            setWizardError("Please enter a valid amount greater than $0.");
                            return;
                          }
                          setWizardError(null);
                          setWizardStep(3);
                        }}
                        className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs transition-colors shadow-lg shadow-amber-950/50 flex items-center gap-1.5 cursor-pointer"
                      >
                        <span>Next: Due Date & Review</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 3: Due Date & Review */}
                {wizardStep === 3 && (
                  <form onSubmit={handleSave} className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                        Next payment due date *
                      </label>
                      <input
                        type="date"
                        required
                        disabled={isSaving}
                        value={formStartDate}
                        onChange={(e) => setFormStartDate(e.target.value)}
                        className="block w-full px-3.5 py-2.5 text-xs bg-zinc-950 border border-white/10 rounded-xl focus:outline-none focus:border-amber-500 text-zinc-100 font-mono transition-colors font-medium"
                      />
                    </div>

                    {/* Liability Summary Box */}
                    <div className="p-3.5 bg-amber-950/20 border border-amber-500/20 rounded-2xl flex flex-col gap-1.5 text-xs">
                      <div className="text-[10px] font-mono uppercase text-amber-400 font-bold tracking-wider">
                        Liability Summary Review
                      </div>
                      <div className="flex justify-between text-zinc-300">
                        <span>Liability:</span>
                        <span className="font-semibold text-white">{formTitle}</span>
                      </div>
                      <div className="flex justify-between text-zinc-300">
                        <span>Amount & Frequency:</span>
                        <span className="font-semibold text-amber-400 font-mono">
                          ${formAmount} ({formFrequency})
                        </span>
                      </div>
                      <div className="flex justify-between text-zinc-300">
                        <span>Next Due Date:</span>
                        <span className="font-semibold text-white font-mono">{formStartDate}</span>
                      </div>
                      {formMovableDueDate && (
                        <div className="flex justify-between text-zinc-300">
                          <span>Movable due date:</span>
                          <span className="font-semibold text-white">Yes</span>
                        </div>
                      )}
                    </div>

                    {/* Mark Paid Off (edit only) */}
                    {editingId && (
                      <div className="p-3.5 bg-emerald-950/10 border border-emerald-500/15 rounded-2xl flex flex-col gap-2.5">
                        <span className="text-[10px] font-mono uppercase text-emerald-400 font-bold tracking-wider">
                          Close this liability
                        </span>
                        <div className="flex items-center gap-2">
                          <input
                            type="date"
                            disabled={isSaving}
                            value={formMarkPaidOffDate}
                            onChange={(e) => setFormMarkPaidOffDate(e.target.value)}
                            className="flex-1 px-3 py-2 text-xs bg-zinc-950 border border-white/10 rounded-lg focus:outline-none focus:border-emerald-500 text-zinc-100 font-mono transition-colors"
                          />
                          <button
                            type="button"
                            disabled={isSaving || !formMarkPaidOffDate}
                            onClick={async () => {
                              const ok = await markLiabilityPaidOff(editingId, formMarkPaidOffDate);
                              if (ok) resetForm();
                            }}
                            className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Mark paid off</span>
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="flex justify-between items-center pt-4 border-t border-white/5 mt-4">
                      <button
                        type="button"
                        disabled={isSaving}
                        onClick={() => {
                          setWizardError(null);
                          setWizardStep(2);
                        }}
                        className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-semibold text-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        <span>Back</span>
                      </button>
                      <button
                        type="submit"
                        disabled={isSaving}
                        className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs transition-colors shadow-lg shadow-amber-950/50 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <Clock className="w-3.5 h-3.5" />
                        <span>
                          {isSaving
                            ? "Saving..."
                            : editingId
                            ? "Save Changes"
                            : "Complete & Save Liability"}
                        </span>
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
export default TransactionFormModal;
