"use client";

import React from "react";

import { AnimatePresence } from "motion/react";
import {
  Calendar as CalendarIcon,
  Coins,
  Clock,
  TrendingDown,
  Wallet,
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

const BOTTOM_TABS = [
  { id: "dashboard", label: "Dashboard", Icon: CalendarIcon, color: "text-indigo-400" },
  { id: "accounts",  label: "Accounts",  Icon: Wallet,       color: "text-indigo-400" },
  { id: "income",    label: "Income",    Icon: Coins,        color: "text-emerald-400" },
  { id: "expenses",  label: "Expenses",  Icon: TrendingDown, color: "text-sky-400" },
  { id: "liabilities", label: "Liabilities", Icon: Clock,   color: "text-amber-400" },
] as const;

function MainAppLayout() {
  const {
    loading,
    onboardingCompleted,
    accounts,
    activeTab,
    setActiveTab,
    setExpenseSubTab,
    categorizedTransactions,
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

          {/* Right Actions — Sign Out icon-only (visible on all breakpoints) */}
          <div className="flex items-center gap-2">
            <button
              onClick={signOut}
              title="Sign Out"
              aria-label="Sign Out"
              className="flex items-center justify-center w-9 h-9 rounded-xl bg-zinc-900/60 hover:bg-zinc-900 border border-white/5 text-rose-400 hover:text-rose-300 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT REGION
          pb-[calc(4rem+env(safe-area-inset-bottom))] ensures content isn't hidden
          behind the fixed bottom tab bar on mobile.
          On md+ screens the bar is hidden so we only need standard padding. */}
      <main className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 sm:py-8 pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-8 select-none">
        <AnimatePresence mode="wait">
          {activeTab === "dashboard" && <Dashboard />}
          {activeTab === "accounts" && <AccountsTab />}
          {activeTab === "income" && <IncomeTab />}
          {activeTab === "expenses" && <ExpensesSavingsTab />}
          {activeTab === "liabilities" && <LiabilitiesTab />}
        </AnimatePresence>
      </main>

      {/* FIXED BOTTOM TAB BAR — mobile only (hidden on md+) */}
      <nav
        aria-label="Bottom navigation"
        className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-zinc-950/90 backdrop-blur-md border-t border-white/10"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="flex items-stretch h-16">
          {BOTTOM_TABS.map(({ id, label, Icon, color }) => {
            const isActive = activeTab === id;
            return (
              <button
                key={id}
                onClick={() => {
                  setActiveTab(id);
                  if (id === "expenses") setExpenseSubTab("all");
                }}
                aria-label={label}
                aria-current={isActive ? "page" : undefined}
                className={`flex-1 flex flex-col items-center justify-center gap-1 transition-colors cursor-pointer ${
                  isActive ? "text-white" : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                <Icon
                  className={`w-5 h-5 transition-colors ${isActive ? color : ""}`}
                />
                <span className={`text-[10px] font-semibold leading-none tracking-tight ${isActive ? "text-white" : ""}`}>
                  {label}
                </span>
                {isActive && (
                  <span className={`absolute bottom-[env(safe-area-inset-bottom)] w-8 h-0.5 rounded-full ${color.replace("text-", "bg-")}`} />
                )}
              </button>
            );
          })}
        </div>
      </nav>

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
