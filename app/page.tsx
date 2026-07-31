"use client";

import React from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  Calendar as CalendarIcon,
  Coins,
  Clock,
  TrendingDown,
  Wallet,
  X,
  Menu,
  LogOut,
} from "lucide-react";

import { FinancialOSProvider, useFinancialData } from "@/components/FinancialOSContext";
import OnboardingWizard from "@/components/OnboardingWizard";
import Dashboard from "@/components/Dashboard";
import AccountsTab from "@/components/AccountsTab";
import IncomeTab from "@/components/IncomeTab";
import ExpensesSavingsTab from "@/components/ExpensesSavingsTab";
import LiabilitiesTab from "@/components/LiabilitiesTab";

// Dialog / Modal components
import { ConfirmAlertDialogs } from "@/components/ConfirmAlertDialogs";
import { TransactionDetailModal } from "@/components/TransactionDetailModal";
import { AccountDeletionWizard } from "@/components/AccountDeletionWizard";
import { AccountModal } from "@/components/AccountModal";
import { PayoffPlannerModal } from "@/components/PayoffPlannerModal";
import DayDetailModal from "@/components/DayDetailModal";
import TransactionFormModal from "@/components/TransactionFormModal";

function MainAppLayout() {
  const {
    loading,
    onboardingCompleted,
    accounts,
    activeTab,
    setActiveTab,
    expenseSubTab,
    setExpenseSubTab,
    categorizedTransactions,
    isMobileMenuOpen,
    setIsMobileMenuOpen,
    signOut,
  } = useFinancialData();

  if (loading) {
    return (
      <div className="flex-grow flex items-center justify-center min-h-screen bg-[#070709] text-zinc-400 font-mono text-xs">
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-zinc-900/60 border border-white/5 shadow-xl">
          <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <span>Loading Cash Engine...</span>
        </div>
      </div>
    );
  }

  if (!onboardingCompleted) {
    return <OnboardingWizard />;
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#070709] text-zinc-100 font-sans relative">
      {/* RESPONSIVE TOP NAVIGATION BAR */}
      <header className="sticky top-0 z-30 w-full bg-zinc-950/85 backdrop-blur-md border-b border-white/5 shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Logo & branding */}
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-zinc-900 border border-white/10 shadow-sm text-indigo-400 shrink-0">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white tracking-tight leading-none">Financial OS</h1>
              <span className="text-[9px] font-mono text-zinc-500 uppercase mt-0.5 block font-medium">
                Cash Engine
              </span>
            </div>
          </div>

          {/* Desktop Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1.5 bg-zinc-900/30 border border-white/5 p-1 rounded-2xl">
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl transition-all text-xs font-semibold cursor-pointer ${
                activeTab === "dashboard"
                  ? "bg-zinc-900 text-white border border-white/10 shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200 border border-transparent"
              }`}
            >
              <CalendarIcon className="w-3.5 h-3.5 text-indigo-400" />
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => setActiveTab("accounts")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl transition-all text-xs font-semibold cursor-pointer ${
                activeTab === "accounts"
                  ? "bg-zinc-900 text-white border border-white/10 shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200 border border-transparent"
              }`}
            >
              <Wallet className="w-3.5 h-3.5 text-indigo-400" />
              <span>Accounts ({accounts.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("income")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl transition-all text-xs font-semibold cursor-pointer ${
                activeTab === "income"
                  ? "bg-zinc-900 text-white border border-white/10 shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200 border border-transparent"
              }`}
            >
              <Coins className="w-3.5 h-3.5 text-emerald-400" />
              <span>Income ({categorizedTransactions.income.length})</span>
            </button>

            <button
              onClick={() => {
                setActiveTab("expenses");
                setExpenseSubTab("all");
              }}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl transition-all text-xs font-semibold cursor-pointer ${
                activeTab === "expenses"
                  ? "bg-zinc-900 text-white border border-white/10 shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200 border border-transparent"
              }`}
            >
              <TrendingDown className="w-3.5 h-3.5 text-sky-400" />
              <span>
                Expenses (
                {categorizedTransactions.fixedExpenses.length +
                  categorizedTransactions.subscriptions.length +
                  categorizedTransactions.savings.length}
                )
              </span>
            </button>

            <button
              onClick={() => setActiveTab("liabilities")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl transition-all text-xs font-semibold cursor-pointer ${
                activeTab === "liabilities"
                  ? "bg-zinc-900 text-white border border-white/10 shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200 border border-transparent"
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>Liabilities ({categorizedTransactions.liabilities.length})</span>
            </button>
          </nav>

          {/* Right Desktop Actions & Hamburger menu for mobile */}
          <div className="flex items-center gap-2.5">
            {/* Desktop Actions */}
            <div className="hidden md:flex items-center gap-2">
              <button
                onClick={signOut}
                title="Sign Out"
                className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900/60 hover:bg-zinc-900 border border-white/5 text-rose-400 hover:text-rose-300 text-xs font-medium font-mono transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2.5 rounded-xl bg-zinc-900 border border-white/10 text-zinc-300 hover:text-white transition-colors cursor-pointer"
              aria-label="Toggle navigation menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* MOBILE DRAWER MODAL MENU */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex flex-col">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: "-100%" }}
              animate={{ y: 0 }}
              exit={{ y: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 250 }}
              className="relative w-full bg-zinc-950 border-b border-white/15 shadow-2xl p-5 flex flex-col gap-5 z-10 max-h-[85vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2.5">
                  <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-zinc-900 border border-white/15 text-indigo-400">
                    <CalendarIcon className="w-4.5 h-4.5" />
                  </div>
                  <span className="text-base font-bold text-white">Financial OS Menu</span>
                </div>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 rounded-xl bg-zinc-900 text-zinc-300 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Navigation Tabs List */}
              <div className="flex flex-col gap-2">
                <span className="text-xs font-mono font-bold tracking-widest text-zinc-500 uppercase px-1">
                  Navigation
                </span>
                <button
                  onClick={() => {
                    setActiveTab("dashboard");
                    setIsMobileMenuOpen(false);
                  }}
                  className={`flex items-center gap-3 p-3.5 rounded-xl text-left transition-all cursor-pointer ${
                    activeTab === "dashboard"
                      ? "bg-indigo-600/25 border border-indigo-500/40 text-white font-bold"
                      : "bg-zinc-900/60 text-zinc-200 hover:text-white"
                  }`}
                >
                  <CalendarIcon className="w-4.5 h-4.5 text-indigo-400" />
                  <span className="text-sm font-medium">Dashboard</span>
                </button>

                <button
                  onClick={() => {
                    setActiveTab("accounts");
                    setIsMobileMenuOpen(false);
                  }}
                  className={`flex items-center gap-3 p-3.5 rounded-xl text-left transition-all cursor-pointer ${
                    activeTab === "accounts"
                      ? "bg-indigo-600/25 border border-indigo-500/40 text-white font-bold"
                      : "bg-zinc-900/60 text-zinc-200 hover:text-white"
                  }`}
                >
                  <Wallet className="w-4.5 h-4.5 text-indigo-400" />
                  <span className="text-sm font-medium">Accounts ({accounts.length})</span>
                </button>

                <button
                  onClick={() => {
                    setActiveTab("income");
                    setIsMobileMenuOpen(false);
                  }}
                  className={`flex items-center gap-3 p-3.5 rounded-xl text-left transition-all cursor-pointer ${
                    activeTab === "income"
                      ? "bg-emerald-600/25 border border-emerald-500/40 text-white font-bold"
                      : "bg-zinc-900/60 text-zinc-200 hover:text-white"
                  }`}
                >
                  <Coins className="w-4.5 h-4.5 text-emerald-400" />
                  <span className="text-sm font-medium">
                    Income ({categorizedTransactions.income.length})
                  </span>
                </button>

                <button
                  onClick={() => {
                    setActiveTab("expenses");
                    setExpenseSubTab("all");
                    setIsMobileMenuOpen(false);
                  }}
                  className={`flex items-center gap-3 p-3.5 rounded-xl text-left transition-all cursor-pointer ${
                    activeTab === "expenses"
                      ? "bg-sky-600/25 border border-sky-500/40 text-white font-bold"
                      : "bg-zinc-900/60 text-zinc-200 hover:text-white"
                  }`}
                >
                  <TrendingDown className="w-4.5 h-4.5 text-sky-400" />
                  <span className="text-sm font-medium">
                    Expenses & Savings (
                    {categorizedTransactions.fixedExpenses.length +
                      categorizedTransactions.subscriptions.length +
                      categorizedTransactions.savings.length}
                    )
                  </span>
                </button>

                <button
                  onClick={() => {
                    setActiveTab("liabilities");
                    setIsMobileMenuOpen(false);
                  }}
                  className={`flex items-center gap-3 p-3.5 rounded-xl text-left transition-all cursor-pointer ${
                    activeTab === "liabilities"
                      ? "bg-amber-600/25 border border-amber-500/40 text-white font-bold"
                      : "bg-zinc-900/60 text-zinc-200 hover:text-white"
                  }`}
                >
                  <Clock className="w-4.5 h-4.5 text-amber-400" />
                  <span className="text-sm font-medium">
                    Liabilities ({categorizedTransactions.liabilities.length})
                  </span>
                </button>
              </div>

              {/* Data Tools */}
              <div className="pt-3 border-t border-white/10 flex flex-col gap-2">
                <span className="text-xs font-mono font-bold tracking-widest text-zinc-500 uppercase px-1">
                  Session
                </span>
                <button
                  onClick={() => {
                    signOut();
                    setIsMobileMenuOpen(false);
                  }}
                  className="flex items-center justify-center gap-2 p-3 rounded-xl bg-zinc-900 border border-white/10 text-rose-400 text-xs font-mono font-semibold cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MAIN CONTENT REGION */}
      <main className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 sm:py-8 select-none">
        <AnimatePresence mode="wait">
          {activeTab === "dashboard" && <Dashboard />}
          {activeTab === "accounts" && <AccountsTab />}
          {activeTab === "income" && <IncomeTab />}
          {activeTab === "expenses" && <ExpensesSavingsTab />}
          {activeTab === "liabilities" && <LiabilitiesTab />}
        </AnimatePresence>
      </main>

      {/* MODALS & OVERLAYS REGION */}
      <AnimatePresence>
        <ConfirmAlertDialogs />
        <TransactionDetailModal />
        <AccountDeletionWizard />
        <AccountModal />
        <PayoffPlannerModal />
        <DayDetailModal />
        <TransactionFormModal />
      </AnimatePresence>
    </div>
  );
}

export default function Home() {
  return (
    <FinancialOSProvider>
      <MainAppLayout />
    </FinancialOSProvider>
  );
}
