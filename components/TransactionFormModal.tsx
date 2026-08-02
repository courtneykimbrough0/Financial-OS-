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
  AlertTriangle,
  Flame,
  Snowflake,
  Target,
} from "lucide-react";
import { useFinancialData } from "./FinancialOSContext";
import { calculatePayoffDetails } from "@/lib/forecast";

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
    accounts,
    transactions,
    launchDateStr,
    saveTransaction,
    isSaving,
  } = useFinancialData();

  // Form Inputs local state
  const [formTitle, setFormTitle] = useState<string>("");
  const [formAmount, setFormAmount] = useState<string>("");
  const [formStartDate, setFormStartDate] = useState<string>("");
  const [formFrequency, setFormFrequency] = useState<string>("monthly");
  const [formSemiDays, setFormSemiDays] = useState<string>("1,15");
  const [formNotes, setFormNotes] = useState<string>("");
  const [formAccountId, setFormAccountId] = useState<string>("");
  const [formFundingAccountId, setFormFundingAccountId] = useState<string>("");
  const [formTargetAccountId, setFormTargetAccountId] = useState<string>("");

  // Liability-specific inputs local state
  const [formLiabilityType, setFormLiabilityType] = useState<string>("card");
  const [formInterestRate, setFormInterestRate] = useState<string>("");
  const [formCurrentBalance, setFormCurrentBalance] = useState<string>("");
  const [formStartingBalance, setFormStartingBalance] = useState<string>("");
  const [formCreditLimit, setFormCreditLimit] = useState<string>("");
  const [formMinimumPayment, setFormMinimumPayment] = useState<string>("");
  const [formHasCreditLimit, setFormHasCreditLimit] = useState<boolean>(false);
  const [formHasBalanceTransferFee, setFormHasBalanceTransferFee] = useState<boolean>(false);
  const [formBalanceTransferFee, setFormBalanceTransferFee] = useState<string>("");
  const [formBalanceTransferFeeMin, setFormBalanceTransferFeeMin] = useState<string>("");
  const [formHasPromoPeriod, setFormHasPromoPeriod] = useState<boolean>(false);
  const [formPromoRate, setFormPromoRate] = useState<string>("");
  const [formPromoEndDate, setFormPromoEndDate] = useState<string>("");
  const [formMinPaymentCalc, setFormMinPaymentCalc] = useState<string>("fixed");
  const [formDayOfMonth, setFormDayOfMonth] = useState<string>("1");

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
          setFormAccountId(tx.accountId || "");
          setFormFundingAccountId(tx.fundingAccountId || "");
          setFormTargetAccountId(tx.targetAccountId || "");
          setFormLiabilityType(tx.liabilityType || "card");
          setFormInterestRate(tx.interestRate !== undefined ? String(tx.interestRate) : "");
          setFormCurrentBalance(tx.currentBalance !== undefined ? String(tx.currentBalance) : "");
          setFormStartingBalance(tx.startingBalance !== undefined ? String(tx.startingBalance) : "");
          setFormCreditLimit(tx.creditLimit !== undefined ? String(tx.creditLimit) : "");
          setFormMinimumPayment(tx.minimumPayment !== undefined ? String(tx.minimumPayment) : "");
          setFormHasCreditLimit(tx.creditLimit !== undefined && tx.creditLimit > 0);
          setFormHasBalanceTransferFee(tx.balanceTransferFee !== undefined);
          setFormBalanceTransferFee(
            tx.balanceTransferFee !== undefined ? String(tx.balanceTransferFee) : ""
          );
          setFormBalanceTransferFeeMin(
            tx.balanceTransferFeeMin !== undefined ? String(tx.balanceTransferFeeMin) : ""
          );
          setFormHasPromoPeriod(tx.promoRate !== undefined || !!tx.promoEndDate);
          setFormPromoRate(tx.promoRate !== undefined ? String(tx.promoRate) : "");
          setFormPromoEndDate(tx.promoEndDate || "");
          setFormMinPaymentCalc(tx.minimumPaymentCalc || "fixed");
          setFormDayOfMonth(tx.dayOfMonth || "1");
        }
      } else {
        setFormTitle("");
        setFormAmount("");
        setFormStartDate(launchDateStr);
        setFormFrequency(formCategory === "income" ? "biweekly" : "monthly");
        setFormSemiDays("1,15");
        setFormNotes("");
        setFormAccountId("");
        setFormFundingAccountId("");
        setFormTargetAccountId("");
        setFormLiabilityType("card");
        setFormInterestRate("");
        setFormCurrentBalance("");
        setFormStartingBalance("");
        setFormCreditLimit("");
        setFormMinimumPayment("");
        setFormHasCreditLimit(false);
        setFormHasBalanceTransferFee(false);
        setFormBalanceTransferFee("");
        setFormBalanceTransferFeeMin("");
        setFormHasPromoPeriod(false);
        setFormPromoRate("");
        setFormPromoEndDate("");
        setFormMinPaymentCalc("fixed");
        setFormDayOfMonth("1");
      }
      setWizardStep(1);
      setWizardError(null);
    }, 0);

    return () => clearTimeout(timer);
  }, [
    editingId,
    isAddingTransaction,
    formCategory,
    launchDateStr,
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
      accountId: formAccountId,
      fundingAccountId: formFundingAccountId,
      targetAccountId: formTargetAccountId,
      liabilityType: formLiabilityType,
      interestRate: formInterestRate,
      currentBalance: formCurrentBalance,
      startingBalance: formStartingBalance,
      creditLimit: formCreditLimit,
      minimumPayment: formMinimumPayment,
      balanceTransferFee: formBalanceTransferFee,
      balanceTransferFeeMin: formBalanceTransferFeeMin,
      promoRate: formPromoRate,
      promoEndDate: formPromoEndDate,
      minimumPaymentCalc: formMinPaymentCalc,
      dayOfMonth: formDayOfMonth,
      hasCreditLimit: formHasCreditLimit,
      hasBalanceTransferFee: formHasBalanceTransferFee,
      hasPromoPeriod: formHasPromoPeriod,
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
                        Deposit to Account
                      </label>
                      <select
                        value={formAccountId}
                        required
                        disabled={isSaving}
                        onChange={(e) => setFormAccountId(e.target.value)}
                        className="block w-full px-3.5 py-2.5 text-xs bg-black/40 border border-white/10 rounded-xl focus:outline-none focus:border-emerald-500 text-zinc-100 transition-colors cursor-pointer"
                      >
                        <option value="">Select an account...</option>
                        {accounts
                          .map((acc) => (
                            <option key={acc.id} value={acc.id}>
                              {acc.name} ({acc.type === "other" ? acc.customType || "Other" : acc.type})
                            </option>
                          ))}
                      </select>
                    </div>

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
                        <span>Deposit To:</span>
                        <span className="font-semibold text-white">
                          {accounts.find((a) => a.id === formAccountId)?.name}
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
                    {formCategory === "savings" ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-mono tracking-widest text-zinc-400 uppercase mb-1.5">
                            From
                          </label>
                          <select
                            value={formFundingAccountId}
                            required
                            disabled={isSaving}
                            onChange={(e) => setFormFundingAccountId(e.target.value)}
                            className="block w-full px-3.5 py-2.5 text-xs bg-black/40 border border-white/10 rounded-xl focus:outline-none focus:border-cyan-500 text-zinc-100 transition-colors cursor-pointer"
                          >
                            <option value="">Select an account...</option>
                            {accounts
                              .map((acc) => (
                                <option key={acc.id} value={acc.id}>
                                  {acc.name} ({acc.type === "other" ? acc.customType || "Other" : acc.type})
                                </option>
                              ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-[10px] font-mono tracking-widest text-zinc-400 uppercase mb-1.5">
                            To
                          </label>
                          <select
                            value={formTargetAccountId}
                            required
                            disabled={isSaving}
                            onChange={(e) => setFormTargetAccountId(e.target.value)}
                            className="block w-full px-3.5 py-2.5 text-xs bg-black/40 border border-white/10 rounded-xl focus:outline-none focus:border-cyan-500 text-zinc-100 transition-colors cursor-pointer"
                          >
                            <option value="">Select an account...</option>
                            {accounts
                              .map((acc) => (
                                <option key={acc.id} value={acc.id}>
                                  {acc.name} ({acc.type === "other" ? acc.customType || "Other" : acc.type})
                                </option>
                              ))}
                          </select>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <label className="block text-[10px] font-mono tracking-widest text-zinc-400 uppercase mb-1.5">
                          Paid From Account
                        </label>
                        <select
                          value={formAccountId}
                          required
                          disabled={isSaving}
                          onChange={(e) => setFormAccountId(e.target.value)}
                          className="block w-full px-3.5 py-2.5 text-xs bg-black/40 border border-white/10 rounded-xl focus:outline-none focus:border-sky-500 text-zinc-100 transition-colors cursor-pointer"
                        >
                          <option value="">Select an account...</option>
                          {accounts.map((acc) => (
                            <option key={acc.id} value={acc.id}>
                              {acc.name} ({acc.type === "other" ? acc.customType || "Other" : acc.type})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

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
                      {formCategory === "savings" ? (
                        <>
                          <div className="flex justify-between text-zinc-300">
                            <span>From:</span>
                            <span className="font-semibold text-white">
                              {accounts.find((a) => a.id === formFundingAccountId)?.name}
                            </span>
                          </div>
                          <div className="flex justify-between text-zinc-300">
                            <span>To:</span>
                            <span className="font-semibold text-white font-mono">
                              {accounts.find((a) => a.id === formTargetAccountId)?.name}
                            </span>
                          </div>
                        </>
                      ) : (
                        <div className="flex justify-between text-zinc-300">
                          <span>Paid From:</span>
                          <span className="font-semibold text-white">
                            {accounts.find((a) => a.id === formAccountId)?.name}
                          </span>
                        </div>
                      )}
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
                      {wizardStep === 1
                        ? "Loan Description"
                        : wizardStep === 2
                        ? "Terms"
                        : wizardStep === 3
                        ? "Payment Details"
                        : "Review & Payoff"}
                    </h3>
                    <p className="text-xs text-zinc-400 font-medium">Step {wizardStep} of 4</p>
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
                <div
                  className={`flex-1 h-1.5 rounded-full transition-all ${
                    wizardStep >= 4 ? "bg-amber-500" : "bg-zinc-800"
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

                {/* Step 1: Loan Description */}
                {wizardStep === 1 && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                        Category *
                      </label>
                      <select
                        value={formLiabilityType}
                        onChange={(e) => setFormLiabilityType(e.target.value)}
                        className="block w-full px-3.5 py-2.5 text-xs bg-zinc-950 border border-white/10 rounded-xl focus:outline-none focus:border-amber-500 text-zinc-100 transition-colors cursor-pointer font-medium"
                      >
                        <option value="card">Card</option>
                        <option value="loan">Loan</option>
                        <option value="line_of_credit">Line of Credit</option>
                        <option value="one_time">One Time</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                        Nickname *
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
                            setWizardError("Please enter a Nickname for this liability.");
                            return;
                          }
                          setWizardError(null);
                          setWizardStep(2);
                        }}
                        className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs transition-colors shadow-lg shadow-amber-950/50 flex items-center gap-1.5 cursor-pointer"
                      >
                        <span>Next</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 2: Terms */}
                {wizardStep === 2 && (
                  <div className="space-y-4">
                    {/* Current balance */}
                    <div>
                      <label className="block text-xs font-medium text-amber-400 mb-1.5">
                        Current balance *
                      </label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 text-xs font-mono font-bold">
                          $
                        </span>
                        <input
                          type="number"
                          min="0"
                          step="any"
                          required
                          placeholder="0.00"
                          value={formCurrentBalance}
                          onChange={(e) => {
                            setFormCurrentBalance(e.target.value);
                            if (wizardError) setWizardError(null);
                          }}
                          className="block w-full pl-8 pr-3.5 py-2.5 text-xs bg-zinc-950 border border-amber-500/40 rounded-xl focus:outline-none focus:border-amber-400 text-zinc-100 font-mono transition-colors font-medium"
                        />
                      </div>
                    </div>

                    {/* APR */}
                    <div>
                      <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                        Interest Rate (%) *
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="any"
                          required
                          placeholder="e.g. 29.99"
                          value={formInterestRate}
                          onChange={(e) => {
                            setFormInterestRate(e.target.value);
                            if (wizardError) setWizardError(null);
                          }}
                          className="block w-full pr-8 pl-3.5 py-2.5 text-xs bg-zinc-950 border border-white/10 rounded-xl focus:outline-none focus:border-amber-500 text-zinc-100 font-mono transition-colors font-medium"
                        />
                        <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 text-xs font-mono font-bold">
                          %
                        </span>
                      </div>
                    </div>

                    {/* Features Toggles */}
                    <div className="space-y-3 pt-2">
                      <div className="p-3 bg-zinc-950/60 border border-white/5 rounded-xl space-y-2">
                        <label className="flex items-center gap-2.5 cursor-pointer text-xs text-zinc-200 font-medium">
                          <input
                            type="checkbox"
                            checked={formHasCreditLimit}
                            onChange={(e) => {
                              setFormHasCreditLimit(e.target.checked);
                              if (!e.target.checked) setFormCreditLimit("");
                            }}
                            className="w-4 h-4 rounded border-white/20 bg-zinc-900 text-amber-500 focus:ring-amber-500/20 cursor-pointer"
                          />
                          <span>Has credit limit</span>
                        </label>
                        {formHasCreditLimit && (
                          <div className="pt-2 pl-6">
                            <label className="block text-xs font-medium text-zinc-400 mb-1">
                              Credit limit *
                            </label>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-xs font-mono">
                                $
                              </span>
                              <input
                                type="number"
                                min="0"
                                step="any"
                                placeholder="e.g. 6000"
                                value={formCreditLimit}
                                onChange={(e) => setFormCreditLimit(e.target.value)}
                                className="block w-full pl-7 pr-3 py-2 text-xs bg-zinc-900 border border-white/10 rounded-lg focus:outline-none focus:border-amber-500 text-zinc-100 font-mono"
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="p-3 bg-zinc-950/60 border border-white/5 rounded-xl space-y-2">
                        <label className="flex items-center gap-2.5 cursor-pointer text-xs text-zinc-200 font-medium">
                          <input
                            type="checkbox"
                            checked={formHasBalanceTransferFee}
                            onChange={(e) => {
                              setFormHasBalanceTransferFee(e.target.checked);
                              if (!e.target.checked) {
                                setFormBalanceTransferFee("");
                                setFormBalanceTransferFeeMin("");
                              }
                            }}
                            className="w-4 h-4 rounded border-white/20 bg-zinc-900 text-amber-500 focus:ring-amber-500/20 cursor-pointer"
                          />
                          <span>Has transfer fee</span>
                        </label>
                        {formHasBalanceTransferFee && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 pl-6">
                            <div>
                              <label className="block text-xs font-medium text-zinc-400 mb-1">
                                Transfer fee *
                              </label>
                              <div className="relative">
                                <input
                                  type="number"
                                  min="0"
                                  step="any"
                                  placeholder="e.g. 3"
                                  value={formBalanceTransferFee}
                                  onChange={(e) => setFormBalanceTransferFee(e.target.value)}
                                  className="block w-full pr-7 pl-3 py-2 text-xs bg-zinc-900 border border-white/10 rounded-lg focus:outline-none focus:border-amber-500 text-zinc-100 font-mono"
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 text-xs font-mono">
                                  %
                                </span>
                              </div>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-zinc-400 mb-1">
                                Minimum transfer fee *
                              </label>
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-xs font-mono">
                                  $
                                </span>
                                <input
                                  type="number"
                                  min="0"
                                  step="any"
                                  placeholder="e.g. 10"
                                  value={formBalanceTransferFeeMin}
                                  onChange={(e) => setFormBalanceTransferFeeMin(e.target.value)}
                                  className="block w-full pl-7 pr-3 py-2 text-xs bg-zinc-900 border border-white/10 rounded-lg focus:outline-none focus:border-amber-500 text-zinc-100 font-mono"
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="p-3 bg-zinc-950/60 border border-white/5 rounded-xl space-y-2">
                        <label className="flex items-center gap-2.5 cursor-pointer text-xs text-zinc-200 font-medium">
                          <input
                            type="checkbox"
                            checked={formHasPromoPeriod}
                            onChange={(e) => {
                              setFormHasPromoPeriod(e.target.checked);
                              if (!e.target.checked) {
                                setFormPromoRate("");
                                setFormPromoEndDate("");
                              }
                            }}
                            className="w-4 h-4 rounded border-white/20 bg-zinc-900 text-amber-500 focus:ring-amber-500/20 cursor-pointer"
                          />
                          <span>Promo period</span>
                        </label>
                        {formHasPromoPeriod && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 pl-6">
                            <div>
                              <label className="block text-xs font-medium text-zinc-400 mb-1">
                                Promo Annual Percentage Rate *
                              </label>
                              <div className="relative">
                                <input
                                  type="number"
                                  min="0"
                                  step="any"
                                  placeholder="e.g. 0"
                                  value={formPromoRate}
                                  onChange={(e) => setFormPromoRate(e.target.value)}
                                  className="block w-full pr-7 pl-3 py-2 text-xs bg-zinc-900 border border-white/10 rounded-lg focus:outline-none focus:border-amber-500 text-zinc-100 font-mono"
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 text-xs font-mono">
                                  %
                                </span>
                              </div>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-zinc-400 mb-1">
                                Promo end date *
                              </label>
                              <input
                                type="date"
                                value={formPromoEndDate}
                                onChange={(e) => setFormPromoEndDate(e.target.value)}
                                className="block w-full px-3 py-2 text-xs bg-zinc-900 border border-white/10 rounded-lg focus:outline-none focus:border-amber-500 text-zinc-100 font-mono"
                              />
                            </div>
                          </div>
                        )}
                      </div>
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
                          const bal = parseFloat(formCurrentBalance);
                          if (isNaN(bal) || bal < 0) {
                            setWizardError("Please enter a valid Current balance.");
                            return;
                          }
                          const apr = parseFloat(formInterestRate);
                          if (isNaN(apr) || apr < 0) {
                            setWizardError("Please enter a valid Annual Percentage Rate.");
                            return;
                          }
                          setWizardError(null);
                          setWizardStep(3);
                        }}
                        className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs transition-colors shadow-lg shadow-amber-950/50 flex items-center gap-1.5 cursor-pointer"
                      >
                        <span>Next</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 3: Payment Details */}
                {wizardStep === 3 && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                        How is the minimum payment calculated?
                      </label>
                      <select
                        value={formMinPaymentCalc}
                        onChange={(e) => setFormMinPaymentCalc(e.target.value)}
                        className="block w-full px-3.5 py-2.5 text-xs bg-zinc-950 border border-white/10 rounded-xl focus:outline-none focus:border-amber-500 text-zinc-100 transition-colors cursor-pointer font-medium"
                      >
                        <option value="fixed">Fixed amount</option>
                        <option value="percent_principal">% of balance</option>
                        <option value="percent_principal_interest">% of balance + interest</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                          Minimum payment *
                        </label>
                        <div className="relative">
                          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 text-xs font-mono font-bold">
                            $
                          </span>
                          <input
                            type="number"
                            min="0"
                            step="any"
                            required
                            placeholder="e.g. 195"
                            value={formMinimumPayment}
                            onChange={(e) => {
                              setFormMinimumPayment(e.target.value);
                              if (!formAmount || formAmount === formMinimumPayment) {
                                setFormAmount(e.target.value);
                              }
                            }}
                            className="block w-full pl-8 pr-3.5 py-2.5 text-xs bg-zinc-950 border border-white/10 rounded-xl focus:outline-none focus:border-amber-500 text-zinc-100 font-mono transition-colors font-medium"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-amber-400 font-bold mb-1.5">
                          Scheduled payment amount ($) *
                        </label>
                        <div className="relative">
                          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-amber-400 text-xs font-mono font-bold">
                            $
                          </span>
                          <input
                            type="number"
                            min="0"
                            step="any"
                            required
                            placeholder="e.g. 195"
                            value={formAmount}
                            onChange={(e) => setFormAmount(e.target.value)}
                            className="block w-full pl-8 pr-3.5 py-2.5 text-xs bg-zinc-950 border border-amber-500/40 rounded-xl focus:outline-none focus:border-amber-400 text-zinc-100 font-mono transition-colors font-bold"
                          />
                        </div>
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

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                          Next payment due date *
                        </label>
                        <input
                          type="date"
                          required
                          value={formStartDate}
                          onChange={(e) => setFormStartDate(e.target.value)}
                          className="block w-full px-3.5 py-2.5 text-xs bg-zinc-950 border border-white/10 rounded-xl focus:outline-none focus:border-amber-500 text-zinc-100 font-mono transition-colors font-medium"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                          Paid From Account
                        </label>
                        <select
                          value={formFundingAccountId}
                          required
                          onChange={(e) => setFormFundingAccountId(e.target.value)}
                          className="block w-full px-3.5 py-2.5 text-xs bg-zinc-950 border border-white/10 rounded-xl focus:outline-none focus:border-amber-500 text-zinc-100 transition-colors cursor-pointer font-medium"
                        >
                          <option value="">Select an account...</option>
                          {accounts
                            .map((acc) => (
                              <option key={acc.id} value={acc.id}>
                                {acc.name} ({acc.type === "other" ? acc.customType || "Other" : acc.type})
                              </option>
                            ))}
                        </select>
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-4 border-t border-white/5 mt-4">
                      <button
                        type="button"
                        onClick={() => {
                          setWizardError(null);
                          setWizardStep(2);
                        }}
                        className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        <span>Back</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const minPmt = parseFloat(formMinimumPayment);
                          if (isNaN(minPmt) || minPmt < 0) {
                            setWizardError("Please enter a valid Minimum payment amount.");
                            return;
                          }
                          const pmt = parseFloat(formAmount);
                          if (isNaN(pmt) || pmt <= 0) {
                            setWizardError("Please enter a valid Scheduled payment amount.");
                            return;
                          }
                          if (!formStartDate) {
                            setWizardError("Please choose a valid Next payment due date.");
                            return;
                          }
                          if (!formFundingAccountId) {
                            setWizardError("Please select an account to pay from.");
                            return;
                          }
                          setWizardError(null);
                          setWizardStep(4);
                        }}
                        className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs transition-colors shadow-lg shadow-amber-950/50 flex items-center gap-1.5 cursor-pointer"
                      >
                        <span>Next: Review</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 4: Review & Payoff */}
                {wizardStep === 4 && (
                  <form onSubmit={handleSave} className="space-y-4">
                    {(() => {
                      const bal = parseFloat(formCurrentBalance) || 0;
                      const apr = parseFloat(formInterestRate) || 0;
                      const pmt = parseFloat(formAmount) || 0;
                      const minPmt = parseFloat(formMinimumPayment) || 0;
                      const details =
                        bal > 0
                          ? calculatePayoffDetails({
                              id: "temp",
                              title: formTitle,
                              amount: pmt,
                              startDate: formStartDate,
                              frequency: formFrequency as any,
                              category: "liability",
                              currentBalance: bal,
                              interestRate: apr,
                              minimumPayment: minPmt,
                            })
                          : null;

                      return (
                        <div className="space-y-4">
                          {/* Liability Summary Box */}
                          <div className="p-4 bg-zinc-900/90 border border-white/10 rounded-2xl space-y-3 text-xs">
                            <div className="font-bold text-zinc-100 text-sm border-b border-white/5 pb-2 flex justify-between items-center">
                              <span>{formTitle || "Liability Summary"}</span>
                              <span className="text-[10px] font-mono font-normal uppercase px-2 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-md">
                                {formLiabilityType === "card"
                                  ? "Card"
                                  : formLiabilityType === "loan"
                                  ? "Loan"
                                  : formLiabilityType === "line_of_credit"
                                  ? "Line of Credit"
                                  : formLiabilityType === "one_time"
                                  ? "One Time"
                                  : formLiabilityType}
                              </span>
                            </div>

                            <div className="grid grid-cols-2 gap-3 text-zinc-300">
                              <div>
                                <span className="text-zinc-500 block text-[10px] uppercase font-mono">
                                  Current Balance
                                </span>
                                <span className="font-mono font-bold text-white text-sm">
                                  ${bal.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                                </span>
                              </div>
                              <div>
                                <span className="text-zinc-500 block text-[10px] uppercase font-mono">
                                  Interest Rate
                                </span>
                                <span className="font-mono font-bold text-amber-400 text-sm">
                                  {apr}% APR
                                </span>
                              </div>
                              <div>
                                <span className="text-zinc-500 block text-[10px] uppercase font-mono">
                                  Scheduled Payment
                                </span>
                                <span className="font-mono font-bold text-amber-300 text-sm">
                                  ${pmt.toFixed(2)} ({formFrequency})
                                </span>
                              </div>
                              <div>
                                <span className="text-zinc-500 block text-[10px] uppercase font-mono">
                                  Next Due Date
                                </span>
                                <span className="font-mono font-bold text-zinc-200 text-sm">
                                  {formStartDate || "Not set"}
                                </span>
                              </div>
                            </div>

                            {formFundingAccountId && (
                              <div className="pt-2 border-t border-white/5 flex justify-between text-zinc-400 text-xs">
                                <span>Payment Source:</span>
                                <span className="text-zinc-200 font-medium">
                                  {accounts.find((a) => a.id === formFundingAccountId)?.name}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Payoff & Interest Analysis */}
                          <div className="p-4 bg-amber-950/20 border border-amber-500/25 rounded-2xl flex flex-col gap-2.5 text-xs">
                            <div className="flex items-center justify-between text-[10px] font-mono uppercase text-amber-400 font-bold tracking-wider">
                              <span>Payoff Projection & Interest Terms</span>
                              {details && details.monthsToPayoff !== null && (
                                <span className="bg-amber-500/20 px-2.5 py-0.5 rounded-lg text-amber-300 font-semibold border border-amber-500/30">
                                  {details.monthsToPayoff} Months
                                </span>
                              )}
                            </div>

                            <div className="grid grid-cols-2 gap-2 py-1">
                              <div className="bg-black/40 p-2.5 rounded-xl border border-white/5">
                                <div className="text-[10px] text-zinc-400 font-mono">Daily Interest</div>
                                <div className="text-sm font-bold text-amber-300 font-mono">
                                  ${details ? details.dailyInterestAccrual.toFixed(2) : "0.00"} /
                                  day
                                </div>
                              </div>
                              <div className="bg-black/40 p-2.5 rounded-xl border border-white/5">
                                <div className="text-[10px] text-zinc-400 font-mono">
                                  Monthly Interest
                                </div>
                                <div className="text-sm font-bold text-amber-300 font-mono">
                                  ${details ? details.monthlyInterestAccrual.toFixed(2) : "0.00"}{" "}
                                  / mo
                                </div>
                              </div>
                            </div>

                            {details && (
                              <div className="space-y-1.5 pt-2 border-t border-amber-500/15 text-zinc-300">
                                {details.monthsToPayoff !== null ? (
                                  <>
                                    <div className="flex justify-between">
                                      <span>Projected Payoff Date:</span>
                                      <span className="font-mono font-bold text-emerald-400">
                                        {details.payoffDateStr}
                                      </span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span>Total Est. Interest Cost:</span>
                                      <span className="font-mono font-bold text-zinc-200">
                                        $
                                        {details.totalInterestPaid.toLocaleString("en-US", {
                                          minimumFractionDigits: 2,
                                          maximumFractionDigits: 2,
                                        })}
                                      </span>
                                    </div>
                                  </>
                                ) : (
                                  <div className="p-2.5 rounded-xl bg-orange-500/10 border border-orange-500/30 text-orange-300 text-[11px] flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4 text-orange-400 shrink-0" />
                                    <span>
                                      Scheduled payment (${pmt.toFixed(2)}) is less than or equal to
                                      monthly interest (${details.monthlyInterestAccrual.toFixed(2)}
                                      ). The liability will not pay down!
                                    </span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          <div className="flex justify-between items-center pt-4 border-t border-white/5 mt-4">
                            <button
                              type="button"
                              disabled={isSaving}
                              onClick={() => {
                                setWizardError(null);
                                setWizardStep(3);
                              }}
                              className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                            >
                              <ArrowLeft className="w-3.5 h-3.5" />
                              <span>Back</span>
                            </button>
                            <button
                              type="submit"
                              disabled={isSaving}
                              className="px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs transition-colors shadow-lg shadow-amber-950/50 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
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
                        </div>
                      );
                    })()}
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
