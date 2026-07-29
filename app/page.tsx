"use client";

import React, { useState, useEffect, useMemo } from "react";
import { 
  motion, 
  AnimatePresence 
} from "motion/react";
import { 
  Calendar as CalendarIcon, 
  Plus, 
  Trash2, 
  Coins, 
  Clock, 
  Sparkles, 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  CalendarCheck,
  CheckCircle,
  Download,
  Upload,
  RefreshCw,
  X,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  ArrowRight,
  Info,
  Menu,
  Layers
} from "lucide-react";
import { 
  RecurringTransaction, 
  ForecastDay, 
  generateForecast, 
  DEFAULT_TRANSACTIONS, 
  SAMPLE_TRANSACTIONS,
  formatDateLocal, 
  parseDateLocal 
} from "@/lib/forecast";

function generateId(): string {
  return "t_" + String(new Date().getTime()) + "_" + String(Math.floor(Math.random() * 1000));
}

export default function Home() {
  const [mounted, setMounted] = useState<boolean>(false);

  // Navigation State
  const [activeTab, setActiveTab] = useState<"dashboard" | "income" | "expenses" | "liabilities">("dashboard");
  const [expenseSubTab, setExpenseSubTab] = useState<"all" | "fixed" | "subscriptions" | "savings">("all");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  // Core Data State
  const [transactions, setTransactions] = useState<RecurringTransaction[]>([]);
  const [initialBalance, setInitialBalance] = useState<number>(0);
  const [launchDateStr, setLaunchDateStr] = useState<string>("2026-07-28");

  // Timeframe View Filter for the Dashboard
  const [forecastRange, setForecastRange] = useState<"week" | "two-weeks" | "month" | "quarter">("month");
  
  // Interactive Day Selection State
  const [selectedDay, setSelectedDay] = useState<ForecastDay | null>(null);
  const [isAddingTransaction, setIsAddingTransaction] = useState<boolean>(false);
  const [formCategory, setFormCategory] = useState<"income" | "fixed-expense" | "subscription" | "liability" | "savings">("income");
  
  // Traditional Calendar Month State
  const [calendarYear, setCalendarYear] = useState<number>(2026);
  const [calendarMonth, setCalendarMonth] = useState<number>(6);

  // Transaction Form State
  const [formTitle, setFormTitle] = useState<string>("");
  const [formAmount, setFormAmount] = useState<string>("");
  const [formStartDate, setFormStartDate] = useState<string>("2026-07-28");
  const [formFrequency, setFormFrequency] = useState<string>("monthly");
  const [formSemiDays, setFormSemiDays] = useState<string>("1,15");
  const [formNotes, setFormNotes] = useState<string>("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3>(1);
  const [wizardError, setWizardError] = useState<string | null>(null);

  // Client hydration effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(true);
      if (typeof window !== "undefined") {
        const todayStr = formatDateLocal(new Date());
        
        const storedTx = localStorage.getItem("futureflow_transactions");
        if (storedTx) {
          try {
            setTransactions(JSON.parse(storedTx));
          } catch (e) {}
        }

        const storedBal = localStorage.getItem("futureflow_initial_balance");
        if (storedBal !== null && storedBal !== undefined) {
          setInitialBalance(Number(storedBal));
        }

        const storedLaunch = localStorage.getItem("futureflow_launch_date");
        const activeLaunchStr = storedLaunch || todayStr;
        setLaunchDateStr(activeLaunchStr);
        setFormStartDate(activeLaunchStr);

        const d = parseDateLocal(activeLaunchStr);
        setCalendarYear(d.getFullYear());
        setCalendarMonth(d.getMonth());
      }
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // Save state helper
  const saveToStorage = (updatedTx: RecurringTransaction[], updatedBal: number, updatedDate: string) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("futureflow_transactions", JSON.stringify(updatedTx));
      localStorage.setItem("futureflow_initial_balance", String(updatedBal));
      localStorage.setItem("futureflow_launch_date", updatedDate);
    }
  };

  const updateTransactions = (newTx: RecurringTransaction[]) => {
    setTransactions(newTx);
    saveToStorage(newTx, initialBalance, launchDateStr);
  };

  const updateInitialBalance = (bal: number) => {
    setInitialBalance(bal);
    saveToStorage(transactions, bal, launchDateStr);
  };

  const updateLaunchDate = (dateStr: string) => {
    setLaunchDateStr(dateStr);
    saveToStorage(transactions, initialBalance, dateStr);
    
    // Auto-adjust traditional calendar view to match the selected Starting Date
    const d = parseDateLocal(dateStr);
    setCalendarYear(d.getFullYear());
    setCalendarMonth(d.getMonth());
  };

  const handleClearData = () => {
    if (confirm("Clear all transactions and reset data to start fresh?")) {
      setTransactions([]);
      setInitialBalance(0);
      saveToStorage([], 0, launchDateStr);
    }
  };

  const handleLoadSampleData = () => {
    setTransactions(SAMPLE_TRANSACTIONS);
    setInitialBalance(5000);
    saveToStorage(SAMPLE_TRANSACTIONS, 5000, launchDateStr);
  };

  // Dynamic forecast timelines depending on the user's view selection
  const forecastTimeline = useMemo(() => {
    const start = parseDateLocal(launchDateStr);
    let days = 30;
    if (forecastRange === "week") days = 7;
    else if (forecastRange === "two-weeks") days = 14;
    else if (forecastRange === "month") days = 31;
    else if (forecastRange === "quarter") days = 92;

    return generateForecast({
      startDate: start,
      numberOfDays: days,
      initialBalance,
      transactions,
    });
  }, [launchDateStr, forecastRange, initialBalance, transactions]);

  // A 120-day horizon forecast timeline specifically for looking up calendar days
  const calendarForecastTimeline = useMemo(() => {
    const startOfCalendar = new Date(calendarYear, calendarMonth, 1);
    const endOfCalendar = new Date(calendarYear, calendarMonth + 3, 0); // extend for quarter rendering too
    const launchDate = parseDateLocal(launchDateStr);
    
    const simStart = launchDate < startOfCalendar ? launchDate : startOfCalendar;
    const diffTime = Math.abs(endOfCalendar.getTime() - simStart.getTime());
    const simDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 15;
    
    return generateForecast({
      startDate: simStart,
      numberOfDays: simDays,
      initialBalance,
      transactions,
    });
  }, [calendarYear, calendarMonth, launchDateStr, initialBalance, transactions]);

  // Traditional Month Calendar Cell Grid
  const calendarCells = useMemo(() => {
    const firstDay = new Date(calendarYear, calendarMonth, 1);
    const startOfWeek = firstDay.getDay();
    const numDays = new Date(calendarYear, calendarMonth + 1, 0).getDate();
    
    const cells: { date: Date | null; isPadding: boolean; forecast?: ForecastDay }[] = [];
    
    // Padding
    for (let i = 0; i < startOfWeek; i++) {
      cells.push({ date: null, isPadding: true });
    }
    
    // Month days
    for (let dayNum = 1; dayNum <= numDays; dayNum++) {
      const date = new Date(calendarYear, calendarMonth, dayNum);
      const targetStr = formatDateLocal(date);
      const forecast = calendarForecastTimeline.find(d => d.dateStr === targetStr);
      cells.push({ date, isPadding: false, forecast });
    }
    
    return cells;
  }, [calendarYear, calendarMonth, calendarForecastTimeline]);

  // Dynamic metrics tied 100% to what is actively displayed on the calendar view
  const activeMetrics = useMemo(() => {
    let income = 0;
    let fixedExpenses = 0;
    let subscriptions = 0;
    let liabilities = 0;
    let savings = 0;
    let endingBalance = initialBalance;

    // Based on the selected timeframe view
    if (forecastRange === "week" || forecastRange === "two-weeks" || forecastRange === "quarter") {
      forecastTimeline.forEach((day, idx) => {
        day.transactions.forEach(tx => {
          const amt = Math.abs(tx.amount);
          if (tx.item.category === "income") income += amt;
          else if (tx.item.category === "fixed-expense") fixedExpenses += amt;
          else if (tx.item.category === "subscription") subscriptions += amt;
          else if (tx.item.category === "liability") liabilities += amt;
          else if (tx.item.category === "savings") savings += amt;
        });
        if (idx === forecastTimeline.length - 1) {
          endingBalance = day.endingBalance;
        }
      });
    } else {
      // Month View: Sum up exactly across the active calendar month cells
      const activeDays = calendarCells.filter(cell => !cell.isPadding && cell.forecast);
      activeDays.forEach(cell => {
        const day = cell.forecast!;
        day.transactions.forEach(tx => {
          const amt = Math.abs(tx.amount);
          if (tx.item.category === "income") income += amt;
          else if (tx.item.category === "fixed-expense") fixedExpenses += amt;
          else if (tx.item.category === "subscription") subscriptions += amt;
          else if (tx.item.category === "liability") liabilities += amt;
          else if (tx.item.category === "savings") savings += amt;
        });
      });
      if (activeDays.length > 0) {
        endingBalance = activeDays[activeDays.length - 1].forecast!.endingBalance;
      }
    }

    const expenses = fixedExpenses + subscriptions;
    const spending = income - (expenses + liabilities + savings);

    return {
      income,
      expenses,
      liabilities,
      savings,
      spending,
      endingBalance
    };
  }, [forecastRange, forecastTimeline, calendarCells, initialBalance]);

  // Navigation month handlers
  const handlePrevMonth = () => {
    if (calendarMonth === 0) {
      setCalendarMonth(11);
      setCalendarYear(prev => prev - 1);
    } else {
      setCalendarMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (calendarMonth === 11) {
      setCalendarMonth(0);
      setCalendarYear(prev => prev + 1);
    } else {
      setCalendarMonth(prev => prev + 1);
    }
  };

  // Form Handlers
  const handleSaveTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;
    const amountNum = parseFloat(formAmount);
    if (isNaN(amountNum) || amountNum <= 0) return;

    const updatedSemiDays = formSemiDays
      .split(",")
      .map(s => parseInt(s.trim()))
      .filter(num => !isNaN(num) && num >= 1 && num <= 31);

    const transactionData: RecurringTransaction = {
      id: editingId || generateId(),
      title: formTitle.trim(),
      amount: amountNum,
      startDate: formStartDate,
      frequency: formFrequency as any,
      category: formCategory,
      semiMonthlyDays: formFrequency === "semimonthly" ? updatedSemiDays : undefined,
      notes: formNotes.trim(),
    };

    let updatedTx: RecurringTransaction[];
    if (editingId) {
      updatedTx = transactions.map(t => t.id === editingId ? transactionData : t);
    } else {
      updatedTx = [...transactions, transactionData];
    }

    updateTransactions(updatedTx);
    resetForm();
  };

  const resetForm = () => {
    setFormTitle("");
    setFormAmount("");
    setFormStartDate(launchDateStr);
    setFormFrequency("monthly");
    setFormSemiDays("1,15");
    setFormNotes("");
    setEditingId(null);
    setWizardStep(1);
    setWizardError(null);
    setIsAddingTransaction(false);
  };

  const handleEditTransaction = (tx: RecurringTransaction) => {
    setEditingId(tx.id);
    setFormTitle(tx.title);
    setFormAmount(String(tx.amount));
    setFormStartDate(tx.startDate);
    setFormFrequency(tx.frequency);
    setFormCategory(tx.category);
    setFormSemiDays(tx.semiMonthlyDays?.join(",") || "1,15");
    setFormNotes(tx.notes || "");
    setWizardStep(1);
    setWizardError(null);
    setIsAddingTransaction(true);
  };

  const handleDeleteTransaction = (id: string) => {
    if (confirm("Are you sure you want to delete this recurring transaction? Your future forecast will update immediately.")) {
      const updated = transactions.filter(t => t.id !== id);
      updateTransactions(updated);
      setSelectedDay(null);
    }
  };

  // JSON Export/Import PWA utilities
  const handleExportData = () => {
    const dataStr = JSON.stringify({
      version: "1.0",
      initialBalance,
      launchDateStr,
      transactions
    }, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', 'forecast_registry_backup.json');
    linkElement.click();
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], "UTF-8");
      fileReader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (parsed.transactions && Array.isArray(parsed.transactions)) {
            setTransactions(parsed.transactions);
            if (parsed.initialBalance) setInitialBalance(Number(parsed.initialBalance));
            if (parsed.launchDateStr) setLaunchDateStr(parsed.launchDateStr);
            saveToStorage(parsed.transactions, parsed.initialBalance || initialBalance, parsed.launchDateStr || launchDateStr);
            alert("Transactions and parameters imported successfully!");
          } else {
            alert("Invalid configuration structure.");
          }
        } catch (err) {
          alert("Error parsing JSON file.");
        }
      };
    }
  };

  // Category filters for UI management lists
  const categorizedTransactions = useMemo(() => {
    return {
      income: transactions.filter(t => t.category === "income"),
      fixedExpenses: transactions.filter(t => t.category === "fixed-expense"),
      subscriptions: transactions.filter(t => t.category === "subscription"),
      savings: transactions.filter(t => t.category === "savings"),
      liabilities: transactions.filter(t => t.category === "liability"),
    };
  }, [transactions]);

  // Month label format helper
  const calendarMonthLabel = useMemo(() => {
    return new Date(calendarYear, calendarMonth, 1).toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });
  }, [calendarYear, calendarMonth]);

  if (!mounted) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen bg-[#070709] text-zinc-400 font-mono text-xs">
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-zinc-900/60 border border-white/5">
          <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <span>Loading Cash Engine...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col md:flex-row h-full overflow-hidden bg-[#070709] text-zinc-100 font-sans relative">
      
      {/* MOBILE TOP NAVIGATION BAR (< md) */}
      <header className="md:hidden sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-zinc-950/95 backdrop-blur-md border-b border-white/10 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-zinc-900 border border-white/15 shadow-sm text-indigo-400">
            <CalendarIcon className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white leading-none">ForecastPWA</h1>
            <span className="text-xs font-mono text-zinc-300 uppercase mt-0.5 block font-medium">Cash Engine</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setFormCategory("income");
              setFormStartDate(launchDateStr);
              setIsAddingTransaction(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add</span>
          </button>

          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2.5 rounded-xl bg-zinc-900 border border-white/15 text-zinc-200 hover:text-white transition-colors"
            aria-label="Toggle navigation menu"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* MOBILE DRAWER MODAL MENU (< md) */}
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
                    <CalendarIcon className="w-4 h-4" />
                  </div>
                  <span className="text-base font-bold text-white">Forecast Engine Menu</span>
                </div>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 rounded-xl bg-zinc-900 text-zinc-300 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Navigation Tabs List */}
              <div className="flex flex-col gap-2">
                <span className="text-xs font-mono font-bold tracking-widest text-zinc-300 uppercase px-1">
                  Navigation
                </span>
                <button
                  onClick={() => {
                    setActiveTab("dashboard");
                    setIsMobileMenuOpen(false);
                  }}
                  className={`flex items-center gap-3 p-3.5 rounded-xl text-left transition-all ${
                    activeTab === "dashboard" ? "bg-indigo-600/25 border border-indigo-500/40 text-white font-bold" : "bg-zinc-900/60 text-zinc-200 hover:text-white"
                  }`}
                >
                  <CalendarIcon className="w-4 h-4 text-indigo-400" />
                  <span className="text-sm font-medium">Dashboard</span>
                </button>

                <button
                  onClick={() => {
                    setActiveTab("income");
                    setIsMobileMenuOpen(false);
                  }}
                  className={`flex items-center gap-3 p-3.5 rounded-xl text-left transition-all ${
                    activeTab === "income" ? "bg-emerald-600/25 border border-emerald-500/40 text-white font-bold" : "bg-zinc-900/60 text-zinc-200 hover:text-white"
                  }`}
                >
                  <Coins className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm font-medium">Income Registry ({categorizedTransactions.income.length})</span>
                </button>

                <button
                  onClick={() => {
                    setActiveTab("expenses");
                    setExpenseSubTab("all");
                    setIsMobileMenuOpen(false);
                  }}
                  className={`flex items-center gap-3 p-3.5 rounded-xl text-left transition-all ${
                    activeTab === "expenses" ? "bg-rose-600/25 border border-rose-500/40 text-white font-bold" : "bg-zinc-900/60 text-zinc-200 hover:text-white"
                  }`}
                >
                  <TrendingDown className="w-4 h-4 text-rose-400" />
                  <span className="text-sm font-medium">Expenses & Savings ({categorizedTransactions.fixedExpenses.length + categorizedTransactions.subscriptions.length + categorizedTransactions.savings.length})</span>
                </button>

                <button
                  onClick={() => {
                    setActiveTab("liabilities");
                    setIsMobileMenuOpen(false);
                  }}
                  className={`flex items-center gap-3 p-3.5 rounded-xl text-left transition-all ${
                    activeTab === "liabilities" ? "bg-amber-600/25 border border-amber-500/40 text-white font-bold" : "bg-zinc-900/60 text-zinc-200 hover:text-white"
                  }`}
                >
                  <Clock className="w-4 h-4 text-amber-400" />
                  <span className="text-sm font-medium">Liabilities ({categorizedTransactions.liabilities.length})</span>
                </button>
              </div>

              {/* Data Tools */}
              <div className="pt-3 border-t border-white/10 flex flex-col gap-2">
                <span className="text-xs font-mono font-bold tracking-widest text-zinc-300 uppercase px-1">
                  Actions & Data
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={handleExportData}
                    className="flex items-center justify-center gap-2 p-3 rounded-xl bg-zinc-900 border border-white/10 text-zinc-200 text-xs font-mono font-semibold"
                  >
                    <Download className="w-4 h-4 text-indigo-400" />
                    <span>Export</span>
                  </button>
                  <label className="flex items-center justify-center gap-2 p-3 rounded-xl bg-zinc-900 border border-white/10 text-zinc-200 text-xs font-mono font-semibold cursor-pointer">
                    <Upload className="w-4 h-4 text-indigo-400" />
                    <span>Import</span>
                    <input type="file" accept=".json" onChange={handleImportData} className="hidden" />
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-1">
                  <button
                    onClick={handleClearData}
                    className="flex items-center justify-center gap-2 p-3 rounded-xl bg-rose-950/30 border border-rose-500/30 text-rose-300 text-xs font-mono font-semibold"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Clear All</span>
                  </button>
                  <button
                    onClick={handleLoadSampleData}
                    className="flex items-center justify-center gap-2 p-3 rounded-xl bg-indigo-950/30 border border-indigo-500/30 text-indigo-300 text-xs font-mono font-semibold"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Sample Data</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DESKTOP SIDEBAR NAVIGATION (hidden on mobile, visible on >= md) */}
      <aside className="hidden md:flex w-72 flex-col bg-zinc-950/40 border-r border-white/5 shrink-0">
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-2xl bg-zinc-900 border border-white/10 shadow-sm">
              <CalendarIcon className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h1 className="text-lg font-semibold tracking-tight text-zinc-100 leading-none">
                ForecastPWA
              </h1>
              <span className="text-[10px] tracking-widest text-zinc-500 font-mono block mt-1 uppercase">
                TRANSACTION ENGINE
              </span>
            </div>
          </div>
        </div>

        <nav className="p-4 flex-1 flex flex-col gap-1.5 overflow-y-auto scrollbar-none">
          <span className="px-3 py-1.5 text-[10px] font-semibold font-mono tracking-widest text-zinc-500 uppercase">
            Menu
          </span>
          
          <button
            id="nav-tab-dashboard"
            onClick={() => setActiveTab("dashboard")}
            className={`flex items-center gap-3.5 px-4 py-3 rounded-2xl transition-all text-left ${
              activeTab === "dashboard"
                ? "bg-zinc-900 text-zinc-100 border border-white/10 shadow-lg"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/30 border border-transparent"
            }`}
          >
            <CalendarIcon className="w-4.5 h-4.5 text-indigo-400" />
            <div>
              <div className="font-semibold text-xs tracking-wide">Dashboard</div>
              <div className="text-[9px] text-zinc-500 font-mono uppercase mt-0.5">Timeframe & Calendar</div>
            </div>
          </button>

          <button
            id="nav-tab-income"
            onClick={() => setActiveTab("income")}
            className={`flex items-center gap-3.5 px-4 py-3 rounded-2xl transition-all text-left ${
              activeTab === "income"
                ? "bg-zinc-900 text-zinc-100 border border-white/10 shadow-lg"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/30 border border-transparent"
            }`}
          >
            <Coins className="w-4.5 h-4.5 text-emerald-400" />
            <div>
              <div className="font-semibold text-xs tracking-wide">Income</div>
              <div className="text-[9px] text-zinc-500 font-mono uppercase mt-0.5">Recurring Inflows ({categorizedTransactions.income.length})</div>
            </div>
          </button>

          <button
            id="nav-tab-expenses"
            onClick={() => {
              setActiveTab("expenses");
              setExpenseSubTab("all");
            }}
            className={`flex items-center gap-3.5 px-4 py-3 rounded-2xl transition-all text-left ${
              activeTab === "expenses"
                ? "bg-zinc-900 text-zinc-100 border border-white/10 shadow-lg"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/30 border border-transparent"
            }`}
          >
            <TrendingDown className="w-4.5 h-4.5 text-rose-400" />
            <div>
              <div className="font-semibold text-xs tracking-wide">Expenses</div>
              <div className="text-[9px] text-zinc-500 font-mono uppercase mt-0.5">Bills, Subs & Savings</div>
            </div>
          </button>

          <button
            id="nav-tab-liabilities"
            onClick={() => setActiveTab("liabilities")}
            className={`flex items-center gap-3.5 px-4 py-3 rounded-2xl transition-all text-left ${
              activeTab === "liabilities"
                ? "bg-zinc-900 text-zinc-100 border border-white/10 shadow-lg"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/30 border border-transparent"
            }`}
          >
            <Clock className="w-4.5 h-4.5 text-amber-400" />
            <div>
              <div className="font-semibold text-xs tracking-wide">Liabilities</div>
              <div className="text-[9px] text-zinc-500 font-mono uppercase mt-0.5">Obligations & Leases</div>
            </div>
          </button>
        </nav>

        <div className="p-4 border-t border-white/5 bg-black/10 flex flex-col gap-2">
          <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 px-2">
            <span>REGISTRY COUNT</span>
            <span className="text-zinc-300 font-bold">{transactions.length} items</span>
          </div>
          
          <div className="grid grid-cols-2 gap-2 mt-1">
            <button
              onClick={handleExportData}
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-900/40 hover:bg-zinc-900/60 border border-white/5 text-zinc-300 hover:text-zinc-100 text-[11px] font-mono transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export</span>
            </button>
            <label
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-900/40 hover:bg-zinc-900/60 border border-white/5 text-zinc-300 hover:text-zinc-100 text-[11px] font-mono transition-colors cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Import</span>
              <input type="file" accept=".json" onChange={handleImportData} className="hidden" />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-1">
            <button
              onClick={handleClearData}
              className="flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-xl bg-rose-950/20 hover:bg-rose-950/40 border border-rose-500/20 text-rose-400 text-[10px] font-mono transition-all"
            >
              <Trash2 className="w-3 h-3" />
              <span>Clear Data</span>
            </button>
            <button
              onClick={handleLoadSampleData}
              className="flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-xl bg-indigo-950/20 hover:bg-indigo-950/40 border border-indigo-500/20 text-indigo-400 text-[10px] font-mono transition-all"
            >
              <Sparkles className="w-3 h-3" />
              <span>Load Sample</span>
            </button>
          </div>
        </div>
      </aside>

      {/* MOBILE STICKY BOTTOM NAVBAR (< md) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-zinc-950/95 backdrop-blur-md border-t border-white/10 px-2 py-1.5 flex justify-around items-center">
        <button
          onClick={() => setActiveTab("dashboard")}
          className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all ${
            activeTab === "dashboard" ? "text-indigo-400 font-bold" : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <CalendarIcon className="w-5 h-5" />
          <span className="text-[10px] font-mono">Dashboard</span>
        </button>

        <button
          onClick={() => setActiveTab("income")}
          className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all ${
            activeTab === "income" ? "text-emerald-400 font-bold" : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <Coins className="w-5 h-5" />
          <span className="text-[10px] font-mono">Income</span>
        </button>

        <button
          onClick={() => {
            setActiveTab("expenses");
            setExpenseSubTab("all");
          }}
          className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all ${
            activeTab === "expenses" ? "text-rose-400 font-bold" : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <TrendingDown className="w-5 h-5" />
          <span className="text-[10px] font-mono">Expenses</span>
        </button>

        <button
          onClick={() => setActiveTab("liabilities")}
          className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all ${
            activeTab === "liabilities" ? "text-amber-400 font-bold" : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <Clock className="w-5 h-5" />
          <span className="text-[10px] font-mono">Liabilities</span>
        </button>
      </nav>

      {/* MAIN CONTENT REGION */}
      <main className="flex-1 flex flex-col overflow-y-auto scrollbar-thin relative bg-[#070709] p-4 sm:p-6 md:p-8 pb-24 md:pb-8">
        
        <AnimatePresence mode="wait">
          
          {/* TAB 1: DASHBOARD VIEW - KPIs and Calendar */}
          {activeTab === "dashboard" && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }}
              className="flex flex-col gap-6 max-w-7xl w-full mx-auto"
            >
              
              {/* Dynamic Header & Starting Parameters Console Panel */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-zinc-900/30 p-5 border border-white/5 rounded-3xl">
                <div>
                  <h2 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
                    Dashboard
                  </h2>
                  <p className="text-xs text-zinc-500">Center your cash timeline projection by picking starting metrics.</p>
                </div>

                {/* Inline Starting Parameter Inputs - Kept completely clean of sidebar */}
                <div className="flex flex-wrap items-center gap-5">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-semibold font-mono tracking-wider text-zinc-300 uppercase">Starting Balance</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-semibold text-zinc-300">$</span>
                      <input 
                        type="number"
                        value={initialBalance}
                        onChange={(e) => updateInitialBalance(Math.max(0, parseFloat(e.target.value) || 0))}
                        className="w-28 bg-transparent border-b border-white/20 hover:border-white/40 focus:border-indigo-400 font-mono text-sm text-white focus:outline-none pb-0.5 transition-colors font-medium"
                      />
                    </div>
                  </div>

                  <div className="w-px h-8 bg-white/10 hidden sm:block"></div>

                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-semibold font-mono tracking-wider text-zinc-300 uppercase">Starting Date</span>
                    <input 
                      type="date"
                      value={launchDateStr}
                      onChange={(e) => updateLaunchDate(e.target.value)}
                      className="bg-transparent border-b border-white/20 hover:border-white/40 focus:border-indigo-400 font-mono text-sm text-white focus:outline-none pb-0.5 cursor-pointer transition-colors font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* EMPTY STATE HERO - GUIDANCE TO ADD REAL DATA */}
              {transactions.length === 0 && (
                <div className="bg-gradient-to-br from-indigo-950/40 via-zinc-900/50 to-zinc-950 border border-indigo-500/30 rounded-3xl p-6 sm:p-8 text-center flex flex-col items-center justify-center my-1 shadow-xl">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-3">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-white">
                    Build Your Real Financial Forecast
                  </h3>
                  <p className="text-xs sm:text-sm text-zinc-300 max-w-md mt-1.5 leading-relaxed">
                    Dummy data removed. Start by registering your real salary, rent, subscriptions, or savings targets to see your exact cash balance projected over time.
                  </p>

                  <div className="flex flex-wrap items-center justify-center gap-2.5 mt-5 w-full max-w-lg">
                    <button
                      onClick={() => {
                        setFormCategory("income");
                        setFormStartDate(launchDateStr);
                        setIsAddingTransaction(true);
                      }}
                      className="flex-1 min-w-[130px] px-3.5 py-2.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
                    >
                      <Plus className="w-4 h-4 text-emerald-400" />
                      <span>+ Income</span>
                    </button>

                    <button
                      onClick={() => {
                        setFormCategory("fixed-expense");
                        setFormStartDate(launchDateStr);
                        setIsAddingTransaction(true);
                      }}
                      className="flex-1 min-w-[130px] px-3.5 py-2.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
                    >
                      <Plus className="w-4 h-4 text-rose-400" />
                      <span>+ Fixed Expense</span>
                    </button>

                    <button
                      onClick={() => {
                        setFormCategory("subscription");
                        setFormStartDate(launchDateStr);
                        setIsAddingTransaction(true);
                      }}
                      className="flex-1 min-w-[130px] px-3.5 py-2.5 rounded-xl bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/30 text-indigo-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
                    >
                      <Plus className="w-4 h-4 text-indigo-400" />
                      <span>+ Subscription</span>
                    </button>

                    <button
                      onClick={() => {
                        setFormCategory("liability");
                        setFormStartDate(launchDateStr);
                        setIsAddingTransaction(true);
                      }}
                      className="flex-1 min-w-[130px] px-3.5 py-2.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
                    >
                      <Plus className="w-4 h-4 text-amber-400" />
                      <span>+ Liability</span>
                    </button>
                  </div>

                  <div className="mt-5 pt-3 border-t border-white/10 flex items-center gap-2">
                    <span className="text-xs text-zinc-300">Want to preview with sample data?</span>
                    <button
                      onClick={handleLoadSampleData}
                      className="text-xs font-mono font-bold text-indigo-300 hover:text-indigo-200 underline underline-offset-4"
                    >
                      Load Sample Template
                    </button>
                  </div>
                </div>
              )}

              {/* DYNAMIC KPI METRICS BENTO GRID - Moved to top, sleek & premium */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
                
                {/* 1. INCOME CARD */}
                <div className="bg-zinc-900/50 border border-white/10 rounded-2xl p-4 flex flex-col justify-between hover:bg-zinc-900/70 transition-colors">
                  <div>
                    <span className="text-xs font-bold font-mono tracking-wider text-zinc-300 uppercase">Income</span>
                    <h3 className="text-xl md:text-2xl font-bold mt-1 text-white">
                      ${activeMetrics.income.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </h3>
                  </div>
                  <div className="w-full bg-zinc-800/80 h-1.5 rounded-full mt-3">
                    <div className="bg-emerald-400 h-full rounded-full" style={{ width: activeMetrics.income > 0 ? "100%" : "0%" }}></div>
                  </div>
                </div>

                {/* 2. EXPENSES CARD */}
                <div className="bg-zinc-900/50 border border-white/10 rounded-2xl p-4 flex flex-col justify-between hover:bg-zinc-900/70 transition-colors">
                  <div>
                    <span className="text-xs font-bold font-mono tracking-wider text-zinc-300 uppercase">Expenses</span>
                    <h3 className="text-xl md:text-2xl font-bold mt-1 text-white">
                      ${activeMetrics.expenses.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </h3>
                  </div>
                  <div className="w-full bg-zinc-800/80 h-1.5 rounded-full mt-3">
                    <div className="bg-rose-400 h-full rounded-full" style={{ width: activeMetrics.income > 0 ? `${Math.min(100, (activeMetrics.expenses / activeMetrics.income) * 100)}%` : "30%" }}></div>
                  </div>
                </div>

                {/* 3. SAVINGS CARD */}
                <div className="bg-zinc-900/50 border border-white/10 rounded-2xl p-4 flex flex-col justify-between hover:bg-zinc-900/70 transition-colors">
                  <div>
                    <span className="text-xs font-bold font-mono tracking-wider text-zinc-300 uppercase">Savings</span>
                    <h3 className="text-xl md:text-2xl font-bold mt-1 text-white">
                      ${activeMetrics.savings.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </h3>
                  </div>
                  <div className="w-full bg-zinc-800/80 h-1.5 rounded-full mt-3">
                    <div className="bg-indigo-400 h-full rounded-full" style={{ width: activeMetrics.income > 0 ? `${Math.min(100, (activeMetrics.savings / activeMetrics.income) * 100)}%` : "15%" }}></div>
                  </div>
                </div>

                {/* 4. LIABILITIES CARD */}
                <div className="bg-zinc-900/50 border border-white/10 rounded-2xl p-4 flex flex-col justify-between hover:bg-zinc-900/70 transition-colors">
                  <div>
                    <span className="text-xs font-bold font-mono tracking-wider text-zinc-300 uppercase">Liabilities</span>
                    <h3 className="text-xl md:text-2xl font-bold mt-1 text-white">
                      ${activeMetrics.liabilities.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </h3>
                  </div>
                  <div className="w-full bg-zinc-800/80 h-1.5 rounded-full mt-3">
                    <div className="bg-amber-400 h-full rounded-full" style={{ width: activeMetrics.income > 0 ? `${Math.min(100, (activeMetrics.liabilities / activeMetrics.income) * 100)}%` : "10%" }}></div>
                  </div>
                </div>

                {/* 5. SPEND (WHAT'S LEFT OVER) CARD */}
                <div className="bg-gradient-to-br from-indigo-900/35 to-zinc-950 border border-indigo-500/30 rounded-2xl p-4 flex flex-col justify-between">
                  <div>
                    <span className="text-xs font-bold font-mono tracking-wider text-indigo-200 uppercase">Spend (Left Over)</span>
                    <h3 className="text-xl md:text-2xl font-bold mt-1 text-indigo-300">
                      ${activeMetrics.spending.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </h3>
                  </div>
                  <div className="w-full bg-indigo-950 h-1.5 rounded-full mt-3">
                    <div className="bg-indigo-400 h-full rounded-full shadow-[0_0_8px_rgba(99,102,241,0.5)]" style={{ width: "100%" }}></div>
                  </div>
                </div>

                {/* 6. ENDING BALANCE CARD */}
                <div className="bg-zinc-900/50 border border-white/10 rounded-2xl p-4 flex flex-col justify-between hover:bg-zinc-900/70 transition-colors">
                  <div>
                    <span className="text-xs font-bold font-mono tracking-wider text-zinc-300 uppercase">Ending Balance</span>
                    <h3 className="text-xl md:text-2xl font-bold mt-1 text-white font-mono">
                      ${activeMetrics.endingBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </h3>
                  </div>
                  <div className="w-full bg-zinc-800/80 h-1.5 rounded-full mt-3">
                    <div className={`h-full rounded-full ${activeMetrics.endingBalance >= initialBalance ? "bg-emerald-400" : "bg-orange-400"}`} style={{ width: "100%" }}></div>
                  </div>
                </div>

              </div>

              {/* DYNAMIC CALENDAR DISPLAY (Absolute focal point of page) */}
              <div className="bg-zinc-900/30 border border-white/10 rounded-[2rem] p-4 sm:p-6 flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <CalendarIcon className="w-5 h-5 text-indigo-400" />
                      Calendar
                    </h3>
                    <p className="text-xs text-zinc-300 font-medium">
                      {forecastRange === "week" && "Showing detailed 7-day layout starting from your custom date."}
                      {forecastRange === "two-weeks" && "Showing detailed 14-day projection layout."}
                      {forecastRange === "month" && `Month layout for ${calendarMonthLabel}. Navigate months below.`}
                      {forecastRange === "quarter" && "Quarter View: Full 90-day trajectory."}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    {/* Projection Range Selector inside calendar div header */}
                    <div className="flex bg-black/60 p-1 rounded-xl border border-white/10 w-full sm:w-auto justify-between sm:justify-start">
                      {(["week", "two-weeks", "month", "quarter"] as const).map((range) => (
                        <button
                          key={range}
                          onClick={() => setForecastRange(range)}
                          className={`text-xs font-mono font-bold px-3 py-1.5 rounded-lg transition-all capitalize ${
                            forecastRange === range
                              ? "bg-zinc-800 text-white shadow-md border border-white/10"
                              : "text-zinc-400 hover:text-white"
                          }`}
                        >
                          {range === "two-weeks" ? "Next Week" : range === "week" ? "This Week" : range === "month" ? "Month" : "Quarter"}
                        </button>
                      ))}
                    </div>

                    {/* Navigation controls only needed when displaying full month grids */}
                    {forecastRange === "month" && (
                      <div className="flex items-center justify-between gap-1.5 bg-black/60 p-1 border border-white/10 rounded-xl w-full sm:w-auto">
                        <button
                          onClick={handlePrevMonth}
                          className="p-1.5 hover:bg-zinc-800 rounded-lg text-zinc-300 hover:text-white transition-colors"
                          title="Previous Month"
                        >
                          <ChevronLeft className="w-5 h-5" />
                        </button>
                        <span className="text-xs font-bold px-2 text-white min-w-[100px] text-center">
                          {calendarMonthLabel}
                        </span>
                        <button
                          onClick={handleNextMonth}
                          className="p-1.5 hover:bg-zinc-800 rounded-lg text-zinc-300 hover:text-white transition-colors"
                          title="Next Month"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* WEEK & TWO WEEKS VIEWS - Render as a beautiful sequence of daily cards */}
                {(forecastRange === "week" || forecastRange === "two-weeks") && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3 mt-2">
                    {forecastTimeline.map((day, idx) => {
                      const isSelected = selectedDay && selectedDay.dateStr === day.dateStr;
                      const hasIncome = day.transactions.some(t => t.item.category === "income");
                      const hasExpense = day.transactions.some(t => t.item.category === "fixed-expense" || t.item.category === "subscription");
                      const hasSavings = day.transactions.some(t => t.item.category === "savings");
                      const hasLiability = day.transactions.some(t => t.item.category === "liability");

                      return (
                        <button
                          key={day.dateStr}
                          onClick={() => setSelectedDay(day)}
                          className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between aspect-[4/5] transition-all duration-200 relative ${
                            isSelected
                              ? "bg-indigo-600/15 border-indigo-500 shadow-[0_0_12px_rgba(99,102,241,0.25)] scale-[1.03]"
                              : "bg-zinc-900/50 border-white/10 hover:border-zinc-700 hover:bg-zinc-900/80"
                          }`}
                        >
                          <div className="flex flex-col gap-0.5">
                            <span className="text-xs font-mono text-zinc-300 uppercase font-bold">
                              {day.date.toLocaleDateString("en-US", { weekday: "short" })}
                            </span>
                            <span className="text-base font-bold text-white">
                              {day.date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                            </span>
                          </div>

                          <div className="mt-auto pt-2">
                            <span className="text-sm font-mono font-bold text-indigo-300">
                              ${Math.round(day.endingBalance).toLocaleString()}
                            </span>
                            
                            <div className="flex gap-1 h-1.5 mt-1.5 overflow-hidden">
                              {hasIncome && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" title="Income"></span>}
                              {hasExpense && <span className="w-1.5 h-1.5 rounded-full bg-rose-400" title="Expense"></span>}
                              {hasLiability && <span className="w-1.5 h-1.5 rounded-full bg-amber-400" title="Liability"></span>}
                              {hasSavings && <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" title="Savings"></span>}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* TRADITIONAL MONTH GRID VIEW */}
                {forecastRange === "month" && (
                  <div className="flex flex-col gap-1.5 mt-2">
                    <div className="grid grid-cols-7 gap-1.5 text-center">
                      {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map(day => (
                        <div key={day} className="text-xs font-mono tracking-wider text-zinc-300 font-bold py-1">
                          {day}
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
                      {calendarCells.map((cell, idx) => {
                        if (cell.isPadding || !cell.date) {
                          return (
                            <div key={`pad-${idx}`} className="aspect-square bg-zinc-950/20 rounded-2xl border border-transparent opacity-10"></div>
                          );
                        }

                        const dForecast = cell.forecast;
                        const dayNum = cell.date.getDate();
                        const isSelected = selectedDay && selectedDay.dateStr === dForecast?.dateStr;
                        const isLaunchDay = dForecast?.dateStr === launchDateStr;
                        const balance = dForecast?.endingBalance ?? 0;

                        const hasIncome = dForecast && dForecast.transactions.some(t => t.item.category === "income");
                        const hasExpense = dForecast && dForecast.transactions.some(t => t.item.category === "fixed-expense" || t.item.category === "subscription");
                        const hasLiability = dForecast && dForecast.transactions.some(t => t.item.category === "liability");
                        const hasSavings = dForecast && dForecast.transactions.some(t => t.item.category === "savings");

                        return (
                          <button
                            key={`cell-${idx}`}
                            onClick={() => dForecast && setSelectedDay(dForecast)}
                            className={`aspect-square p-1.5 sm:p-2 flex flex-col justify-between text-left rounded-2xl transition-all duration-250 border ${
                              isSelected
                                ? "bg-indigo-600/20 border-indigo-500 shadow-[0_0_12px_rgba(99,102,241,0.3)] scale-[1.03]"
                                : isLaunchDay
                                ? "bg-zinc-900 border-indigo-400/80"
                                : "bg-zinc-900/50 border-white/10 hover:border-zinc-700 hover:bg-zinc-900/80"
                            }`}
                          >
                            <div className="flex items-center justify-between w-full">
                              <span className={`text-xs font-mono font-bold ${isLaunchDay ? "text-indigo-400" : "text-zinc-200"}`}>
                                {dayNum}
                              </span>
                              {isLaunchDay && (
                                <span className="text-[9px] font-mono font-bold bg-indigo-500/20 text-indigo-300 px-1 rounded border border-indigo-500/30">
                                  START
                                </span>
                              )}
                            </div>

                            {dForecast ? (
                              <div className="flex flex-col gap-0.5 mt-auto">
                                <span className="text-xs sm:text-xs font-mono font-bold tracking-tight text-white">
                                  ${Math.round(balance).toLocaleString()}
                                </span>

                                <div className="flex gap-1 h-1 mt-1 overflow-hidden">
                                  {hasIncome && <span className="w-1 h-1 rounded-full bg-emerald-400 shrink-0" title="Income"></span>}
                                  {hasExpense && <span className="w-1 h-1 rounded-full bg-rose-400 shrink-0" title="Expense"></span>}
                                  {hasLiability && <span className="w-1 h-1 rounded-full bg-amber-400 shrink-0" title="Liability"></span>}
                                  {hasSavings && <span className="w-1 h-1 rounded-full bg-indigo-400 shrink-0" title="Savings"></span>}
                                </div>
                              </div>
                            ) : (
                              <span className="text-[10px] text-zinc-500 italic font-mono mt-auto">Empty</span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* QUARTER GRID VIEW: RENDERS 3 MINI-MONTH CALENDARS */}
                {forecastRange === "quarter" && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-2">
                    {[0, 1, 2].map((monthOffset) => {
                      // Get target month & year
                      let m = calendarMonth + monthOffset;
                      let y = calendarYear;
                      if (m > 11) {
                        m = m - 12;
                        y = y + 1;
                      }

                      const monthName = new Date(y, m, 1).toLocaleDateString("en-US", { month: "long" });
                      const firstDay = new Date(y, m, 1);
                      const startOfWeek = firstDay.getDay();
                      const numDays = new Date(y, m + 1, 0).getDate();

                      const miniCells: { date: Date | null; forecast?: ForecastDay }[] = [];
                      for (let i = 0; i < startOfWeek; i++) {
                        miniCells.push({ date: null });
                      }
                      for (let dayNum = 1; dayNum <= numDays; dayNum++) {
                        const date = new Date(y, m, dayNum);
                        const targetStr = formatDateLocal(date);
                        const forecast = calendarForecastTimeline.find(d => d.dateStr === targetStr);
                        miniCells.push({ date, forecast });
                      }

                      return (
                        <div key={monthOffset} className="bg-black/30 border border-white/5 rounded-2xl p-4 flex flex-col gap-3">
                          <h4 className="text-xs font-bold text-zinc-400 tracking-wide uppercase font-mono border-b border-white/5 pb-1.5 text-center">
                            {monthName} {y}
                          </h4>

                          <div className="grid grid-cols-7 gap-1 text-center">
                            {["S", "M", "T", "W", "T", "F", "S"].map((lbl, i) => (
                              <div key={i} className="text-[8px] text-zinc-600 font-bold font-mono">
                                {lbl}
                              </div>
                            ))}
                          </div>

                          <div className="grid grid-cols-7 gap-1">
                            {miniCells.map((cell, idx) => {
                              if (!cell.date) {
                                return <div key={`mc-pad-${idx}`} className="aspect-square opacity-0"></div>;
                              }

                              const isSelected = selectedDay && selectedDay.dateStr === cell.forecast?.dateStr;
                              const balance = cell.forecast?.endingBalance ?? 0;
                              const dayNum = cell.date.getDate();

                              const hasIncome = cell.forecast && cell.forecast.transactions.some(t => t.item.category === "income");
                              const hasExpense = cell.forecast && cell.forecast.transactions.some(t => t.item.category === "fixed-expense" || t.item.category === "subscription");
                              const hasSavings = cell.forecast && cell.forecast.transactions.some(t => t.item.category === "savings");
                              const hasLiability = cell.forecast && cell.forecast.transactions.some(t => t.item.category === "liability");

                              return (
                                <button
                                  key={`mc-cell-${idx}`}
                                  onClick={() => cell.forecast && setSelectedDay(cell.forecast)}
                                  className={`aspect-square p-0.5 rounded-[6px] text-center flex flex-col justify-between transition-all duration-150 border ${
                                    isSelected
                                      ? "bg-indigo-600/30 border-indigo-400"
                                      : "bg-zinc-900/40 border-transparent hover:border-zinc-700 hover:bg-zinc-900"
                                  }`}
                                >
                                  <span className="text-[8px] font-semibold text-zinc-500 font-mono scale-[0.9] block text-center leading-none">
                                    {dayNum}
                                  </span>
                                  <div className="flex gap-0.5 items-center justify-center h-0.5 mt-0.5 overflow-hidden">
                                    {hasIncome && <span className="w-0.5 h-0.5 rounded-full bg-emerald-400"></span>}
                                    {hasExpense && <span className="w-0.5 h-0.5 rounded-full bg-rose-400"></span>}
                                    {hasLiability && <span className="w-0.5 h-0.5 rounded-full bg-amber-400"></span>}
                                    {hasSavings && <span className="w-0.5 h-0.5 rounded-full bg-indigo-400"></span>}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </motion.div>
          )}

          {/* TAB 2: INCOME MANAGER SCREEN */}
          {activeTab === "income" && (
            <motion.div
              key="income"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="flex flex-col gap-6 max-w-5xl w-full mx-auto"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
                <div>
                  <h2 className="text-2xl font-bold text-zinc-100 flex items-center gap-2">
                    <Coins className="w-6 h-6 text-emerald-400" />
                    Income
                  </h2>
                  <p className="text-xs text-zinc-500">
                    Register and edit your recurring paychecks, freelance streams, or basic salary events.
                  </p>
                </div>

                <button
                  onClick={() => {
                    setFormCategory("income");
                    setFormStartDate(launchDateStr);
                    setIsAddingTransaction(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-zinc-100 font-semibold text-xs transition-all shadow-sm"
                >
                  <Plus className="w-4 h-4 text-emerald-400" />
                  <span>Add Income</span>
                </button>
              </div>

              {categorizedTransactions.income.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 bg-zinc-900/15 border border-dashed border-white/5 rounded-3xl text-center">
                  <Coins className="w-12 h-12 text-zinc-650 mb-3" />
                  <p className="text-sm font-bold text-zinc-300">No Recurring Income Registered</p>
                  <p className="text-xs text-zinc-300 max-w-xs mt-1">
                    Every dynamic forecast needs at least one regular paycheck payload to build an available spend margin.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {categorizedTransactions.income.map(tx => (
                    <div key={tx.id} className="bg-zinc-900/50 border border-white/10 rounded-2xl p-5 flex flex-col justify-between hover:border-zinc-700 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-3 bg-emerald-500/15 text-emerald-400 rounded-xl border border-emerald-500/20">
                            <Coins className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="text-base font-bold text-white">{tx.title}</h4>
                            <span className="text-xs font-mono font-bold text-zinc-200 uppercase bg-black/60 px-2.5 py-1 rounded-lg border border-white/10 inline-block mt-1">
                              {tx.frequency}
                            </span>
                          </div>
                        </div>
                        <span className="text-base font-mono font-bold text-emerald-400">
                          +${tx.amount.toLocaleString("en-US")}
                        </span>
                      </div>

                      {tx.notes && (
                        <p className="text-xs text-zinc-300 mt-3 bg-black/40 p-2.5 rounded-xl border border-white/10">
                          {tx.notes}
                        </p>
                      )}

                      <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/10">
                        <span className="text-xs font-mono font-semibold text-zinc-300">
                          STARTS {tx.startDate}
                        </span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditTransaction(tx)}
                            className="text-xs font-bold px-3 py-1 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-zinc-200 hover:text-white transition-colors"
                          >
                            Modify
                          </button>
                          <button
                            onClick={() => handleDeleteTransaction(tx.id)}
                            className="text-xs font-bold px-3 py-1 bg-rose-950/30 hover:bg-rose-900/40 text-rose-300 hover:text-rose-200 rounded-lg transition-colors border border-rose-500/20"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* TAB 3: EXPENSES & SAVINGS MANAGER SCREEN */}
          {activeTab === "expenses" && (
            <motion.div
              key="expenses"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="flex flex-col gap-6 max-w-5xl w-full mx-auto"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
                <div>
                  <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <TrendingDown className="w-6 h-6 text-rose-400" />
                    Expenses
                  </h2>
                  <p className="text-xs text-zinc-300 font-medium">
                    Log and configure regular fixed expenses, digital subscriptions, or automated safety savings.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setFormCategory("fixed-expense");
                      setFormStartDate(launchDateStr);
                      setIsAddingTransaction(true);
                    }}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/15 text-white font-bold text-xs transition-all shadow-sm"
                  >
                    <Plus className="w-4 h-4 text-rose-400" />
                    <span>Add Expense</span>
                  </button>
                  <button
                    onClick={() => {
                      setFormCategory("savings");
                      setFormStartDate(launchDateStr);
                      setIsAddingTransaction(true);
                    }}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-950/60 hover:bg-indigo-900/60 border border-indigo-500/30 text-indigo-200 font-bold text-xs transition-all shadow-sm"
                  >
                    <Plus className="w-4 h-4 text-indigo-400" />
                    <span>Add Savings</span>
                  </button>
                </div>
              </div>

              {/* Sub tabs filtering for Expenses/Savings */}
              <div className="flex gap-2 p-1 bg-zinc-900/50 border border-white/10 rounded-xl self-start flex-wrap">
                {(["all", "fixed", "subscriptions", "savings"] as const).map(sub => (
                  <button
                    key={sub}
                    onClick={() => setExpenseSubTab(sub)}
                    className={`text-xs font-mono font-bold px-3.5 py-1.5 rounded-lg transition-all capitalize ${
                      expenseSubTab === sub
                        ? "bg-zinc-800 text-white border border-white/10 shadow-sm"
                        : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    {sub === "all" ? "All Items" : sub === "fixed" ? "Fixed Expenses" : sub === "subscriptions" ? "Subscriptions" : "Savings"}
                  </button>
                ))}
              </div>

              {/* Grid lists of Expenses */}
              <div className="flex flex-col gap-6">
                
                {/* Fixed Expenses Section */}
                {(expenseSubTab === "all" || expenseSubTab === "fixed") && (
                  <div className="flex flex-col gap-3">
                    <h3 className="text-xs font-bold tracking-wider text-zinc-300 uppercase font-mono px-1">Fixed Expenses</h3>
                    {categorizedTransactions.fixedExpenses.length === 0 ? (
                      <div className="p-8 bg-zinc-900/20 border border-dashed border-white/10 rounded-2xl text-center text-zinc-400 text-xs font-medium">
                        No fixed bills, rent, or scheduled payments registered.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {categorizedTransactions.fixedExpenses.map(tx => (
                          <div key={tx.id} className="bg-zinc-900/50 border border-white/10 rounded-2xl p-4.5 flex flex-col justify-between">
                            <div className="flex items-start justify-between">
                              <div>
                                <h4 className="text-base font-bold text-white">{tx.title}</h4>
                                <span className="text-xs font-mono font-bold text-zinc-200 uppercase bg-black/60 px-2.5 py-0.5 rounded-lg border border-white/10 inline-block mt-1">{tx.frequency}</span>
                              </div>
                              <span className="text-base font-mono font-bold text-rose-400">-${tx.amount.toLocaleString()}</span>
                            </div>
                            {tx.notes && <p className="text-xs text-zinc-300 mt-2 bg-black/40 p-2.5 rounded-xl border border-white/10">{tx.notes}</p>}
                            <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/10">
                              <span className="text-xs font-mono font-semibold text-zinc-300">STARTS {tx.startDate}</span>
                              <div className="flex gap-2">
                                <button onClick={() => handleEditTransaction(tx)} className="text-xs font-bold px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-zinc-200 hover:text-white transition-colors">Modify</button>
                                <button onClick={() => handleDeleteTransaction(tx.id)} className="text-xs font-bold px-2.5 py-1 bg-rose-950/30 hover:bg-rose-900/40 text-rose-300 hover:text-rose-200 rounded-lg transition-colors border border-rose-500/20">Terminate</button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Subscriptions Section */}
                {(expenseSubTab === "all" || expenseSubTab === "subscriptions") && (
                  <div className="flex flex-col gap-3">
                    <h3 className="text-xs font-bold tracking-wider text-zinc-300 uppercase font-mono px-1">Digital Subscriptions</h3>
                    {categorizedTransactions.subscriptions.length === 0 ? (
                      <div className="p-8 bg-zinc-900/20 border border-dashed border-white/10 rounded-2xl text-center text-zinc-400 text-xs font-medium">
                        No recurring SaaS services, media, or tech plans logged.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {categorizedTransactions.subscriptions.map(tx => (
                          <div key={tx.id} className="bg-zinc-900/50 border border-white/10 rounded-2xl p-4.5 flex flex-col justify-between">
                            <div className="flex items-start justify-between">
                              <div>
                                <h4 className="text-base font-bold text-white">{tx.title}</h4>
                                <span className="text-xs font-mono font-bold text-zinc-200 uppercase bg-black/60 px-2.5 py-0.5 rounded-lg border border-white/10 inline-block mt-1">{tx.frequency}</span>
                              </div>
                              <span className="text-base font-mono font-bold text-rose-400">-${tx.amount.toLocaleString()}</span>
                            </div>
                            {tx.notes && <p className="text-xs text-zinc-300 mt-2 bg-black/40 p-2.5 rounded-xl border border-white/10">{tx.notes}</p>}
                            <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/10">
                              <span className="text-xs font-mono font-semibold text-zinc-300">STARTS {tx.startDate}</span>
                              <div className="flex gap-2">
                                <button onClick={() => handleEditTransaction(tx)} className="text-xs font-bold px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-zinc-200 hover:text-white transition-colors">Modify</button>
                                <button onClick={() => handleDeleteTransaction(tx.id)} className="text-xs font-bold px-2.5 py-1 bg-rose-950/30 hover:bg-rose-900/40 text-rose-300 hover:text-rose-200 rounded-lg transition-colors border border-rose-500/20">Terminate</button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Savings Section */}
                {(expenseSubTab === "all" || expenseSubTab === "savings") && (
                  <div className="flex flex-col gap-3">
                    <h3 className="text-xs font-bold tracking-wider text-zinc-300 uppercase font-mono px-1">Automated Savings Plans</h3>
                    {categorizedTransactions.savings.length === 0 ? (
                      <div className="p-8 bg-zinc-900/20 border border-dashed border-white/10 rounded-2xl text-center text-zinc-400 text-xs font-medium">
                        No recurring deposits, safety reservoir plans, or vault triggers.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {categorizedTransactions.savings.map(tx => (
                          <div key={tx.id} className="bg-zinc-900/50 border border-white/10 rounded-2xl p-4.5 flex flex-col justify-between">
                            <div className="flex items-start justify-between">
                              <div>
                                <h4 className="text-base font-bold text-white">{tx.title}</h4>
                                <span className="text-xs font-mono font-bold text-zinc-200 uppercase bg-black/60 px-2.5 py-0.5 rounded-lg border border-white/10 inline-block mt-1">{tx.frequency}</span>
                              </div>
                              <span className="text-base font-mono font-bold text-indigo-400">-${tx.amount.toLocaleString()}</span>
                            </div>
                            {tx.notes && <p className="text-xs text-zinc-300 mt-2 bg-black/40 p-2.5 rounded-xl border border-white/10">{tx.notes}</p>}
                            <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/10">
                              <span className="text-xs font-mono font-semibold text-zinc-300">STARTS {tx.startDate}</span>
                              <div className="flex gap-2">
                                <button onClick={() => handleEditTransaction(tx)} className="text-xs font-bold px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-zinc-200 hover:text-white transition-colors">Modify</button>
                                <button onClick={() => handleDeleteTransaction(tx.id)} className="text-xs font-bold px-2.5 py-1 bg-rose-950/30 hover:bg-rose-900/40 text-rose-300 hover:text-rose-200 rounded-lg transition-colors border border-rose-500/20">Terminate</button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

              </div>
            </motion.div>
          )}

          {/* TAB 4: LIABILITIES MANAGER SCREEN */}
          {activeTab === "liabilities" && (
            <motion.div
              key="liabilities"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="flex flex-col gap-6 max-w-5xl w-full mx-auto"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
                <div>
                  <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <Clock className="w-6 h-6 text-amber-400" />
                    Liabilities
                  </h2>
                  <p className="text-xs text-zinc-300 font-medium">
                    Log and configure regular lease terms, contract payment schedules, or active liabilities.
                  </p>
                </div>

                <button
                  onClick={() => {
                    setFormCategory("liability");
                    setFormStartDate(launchDateStr);
                    setIsAddingTransaction(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/15 text-white font-bold text-xs transition-all shadow-sm"
                >
                  <Plus className="w-4 h-4 text-amber-400" />
                  <span>Add Liability</span>
                </button>
              </div>

              {categorizedTransactions.liabilities.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 bg-zinc-900/20 border border-dashed border-white/10 rounded-3xl text-center">
                  <Clock className="w-12 h-12 text-zinc-500 mb-3" />
                  <p className="text-sm font-bold text-white">No Recurring Liabilities Registered</p>
                  <p className="text-xs text-zinc-300 max-w-xs mt-1">
                    Keep track of installment payment schedules or active vehicle lease terms cleanly here.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {categorizedTransactions.liabilities.map(tx => (
                    <div key={tx.id} className="bg-zinc-900/50 border border-white/10 rounded-2xl p-5 flex flex-col justify-between hover:border-zinc-700 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-3 bg-amber-500/15 text-amber-400 rounded-xl border border-amber-500/20">
                            <Clock className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="text-base font-bold text-white">{tx.title}</h4>
                            <span className="text-xs font-mono font-bold text-zinc-200 uppercase bg-black/60 px-2.5 py-0.5 rounded-lg border border-white/10 inline-block mt-1">
                              {tx.frequency}
                            </span>
                          </div>
                        </div>
                        <span className="text-base font-mono font-bold text-amber-400">
                          -${tx.amount.toLocaleString("en-US")}
                        </span>
                      </div>

                      {tx.notes && (
                        <p className="text-xs text-zinc-300 mt-3 bg-black/40 p-2.5 rounded-xl border border-white/10">
                          {tx.notes}
                        </p>
                      )}

                      <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/10">
                        <span className="text-xs font-mono font-semibold text-zinc-300">
                          STARTS {tx.startDate}
                        </span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditTransaction(tx)}
                            className="text-xs font-semibold px-2.5 py-1 hover:bg-zinc-800 rounded-lg text-zinc-355 transition-colors"
                          >
                            Modify
                          </button>
                          <button
                            onClick={() => handleDeleteTransaction(tx.id)}
                            className="text-xs font-semibold px-2.5 py-1 hover:bg-red-955/10 text-zinc-500 hover:text-red-400 rounded-lg transition-colors"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

        </AnimatePresence>

      </main>

      {/* 3 SEPARATE MULTI-STEP TRANSACTION WIZARDS */}
      <AnimatePresence>
        {isAddingTransaction && (
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
                  : "border-rose-500/30"
              }`}
            >

              {/* ==================== 1. SEPARATE INCOME WIZARD ==================== */}
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
                          Step {wizardStep} of 3 &bull; {wizardStep === 1 ? "Source Title" : wizardStep === 2 ? "Paycheck & Schedule" : "First Pay Date & Review"}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={resetForm}
                      className="p-2 hover:bg-zinc-800 rounded-xl text-zinc-400 hover:text-white transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Step Progress Bar */}
                  <div className="px-6 pt-3 pb-3 bg-black/40 border-b border-white/5 flex items-center gap-2">
                    <div className={`flex-1 h-1.5 rounded-full transition-all ${wizardStep >= 1 ? "bg-emerald-500" : "bg-zinc-800"}`} />
                    <div className={`flex-1 h-1.5 rounded-full transition-all ${wizardStep >= 2 ? "bg-emerald-500" : "bg-zinc-800"}`} />
                    <div className={`flex-1 h-1.5 rounded-full transition-all ${wizardStep >= 3 ? "bg-emerald-500" : "bg-zinc-800"}`} />
                  </div>

                  {/* Wizard Form Content */}
                  <div className="p-6">
                    {wizardError && (
                      <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center justify-between">
                        <span>{wizardError}</span>
                        <button type="button" onClick={() => setWizardError(null)} className="text-rose-400 font-bold ml-2">x</button>
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
                            placeholder="e.g. Primary Salary, Client Retainer, Side Revenue"
                            value={formTitle}
                            onChange={(e) => {
                              setFormTitle(e.target.value);
                              if (wizardError) setWizardError(null);
                            }}
                            className="block w-full px-3.5 py-2.5 text-xs bg-black/40 border border-white/10 rounded-xl focus:outline-none focus:border-emerald-500 text-zinc-100 transition-colors"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-mono tracking-widest text-zinc-500 uppercase mb-2">
                            Quick Presets
                          </label>
                          <div className="flex flex-wrap gap-1.5">
                            {["Primary Salary", "Client Retainer", "Rental Earnings", "Dividends", "Side Business"].map(preset => (
                              <button
                                key={preset}
                                type="button"
                                onClick={() => {
                                  setFormTitle(preset);
                                  if (wizardError) setWizardError(null);
                                }}
                                className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-emerald-950/40 border border-white/5 hover:border-emerald-500/30 text-zinc-400 hover:text-emerald-300 text-[10px] font-medium transition-all"
                              >
                                + {preset}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t border-white/5 mt-4">
                          <button
                            type="button"
                            onClick={resetForm}
                            className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 text-xs font-semibold transition-colors"
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
                            className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors shadow-lg shadow-emerald-950/50 flex items-center gap-1.5"
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
                            <option value="semimonthly">Semi-Monthly (Specific Days e.g. 1st & 15th)</option>
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
                            className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 text-xs font-semibold transition-colors flex items-center gap-1.5"
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
                            className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors shadow-lg shadow-emerald-950/50 flex items-center gap-1.5"
                          >
                            <span>Next: First Date & Review</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Step 3: First Date & Final Review */}
                    {wizardStep === 3 && (
                      <form onSubmit={handleSaveTransaction} className="space-y-4">
                        <div>
                          <label className="block text-[10px] font-mono tracking-widest text-zinc-400 uppercase mb-1.5">
                            First Pay Date
                          </label>
                          <input
                            type="date"
                            required
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
                            placeholder="e.g. Direct deposit after tax withholdings..."
                            value={formNotes}
                            onChange={(e) => setFormNotes(e.target.value)}
                            className="block w-full px-3.5 py-2.5 text-xs bg-black/40 border border-white/10 rounded-xl focus:outline-none focus:border-emerald-500 text-zinc-100 transition-colors"
                          />
                        </div>

                        {/* Summary Card */}
                        <div className="p-3.5 bg-emerald-950/20 border border-emerald-500/20 rounded-2xl flex flex-col gap-1.5 text-xs">
                          <div className="text-[10px] font-mono uppercase text-emerald-400 font-bold tracking-wider">Income Summary Review</div>
                          <div className="flex justify-between text-zinc-300">
                            <span>Source:</span>
                            <span className="font-semibold text-white">{formTitle}</span>
                          </div>
                          <div className="flex justify-between text-zinc-300">
                            <span>Amount & Cycle:</span>
                            <span className="font-semibold text-emerald-400 font-mono">${formAmount} ({formFrequency})</span>
                          </div>
                          <div className="flex justify-between text-zinc-300">
                            <span>First Deposit:</span>
                            <span className="font-semibold text-white font-mono">{formStartDate}</span>
                          </div>
                        </div>

                        <div className="flex justify-between items-center pt-4 border-t border-white/5 mt-4">
                          <button
                            type="button"
                            onClick={() => {
                              setWizardError(null);
                              setWizardStep(2);
                            }}
                            className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 text-xs font-semibold transition-colors flex items-center gap-1.5"
                          >
                            <ArrowLeft className="w-3.5 h-3.5" />
                            <span>Back</span>
                          </button>
                          <button
                            type="submit"
                            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors shadow-lg shadow-emerald-950/50 flex items-center gap-1.5"
                          >
                            <Coins className="w-3.5 h-3.5" />
                            <span>{editingId ? "Save Changes" : "Complete & Save Income"}</span>
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                </div>
              )}


              {/* ==================== 2. SEPARATE EXPENSES WIZARD ==================== */}
              {(formCategory === "fixed-expense" || formCategory === "subscription" || formCategory === "savings") && (
                <div className="flex flex-col">
                  {/* Expense Header */}
                  <div className="p-5 border-b border-white/5 flex items-center justify-between gap-3 bg-zinc-900/60">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
                        <TrendingDown className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-zinc-100 flex items-center gap-2">
                          {editingId ? "Edit Expense Wizard" : "Expenses Wizard"}
                        </h3>
                        <p className="text-xs text-zinc-400">
                          Step {wizardStep} of 3 &bull; {wizardStep === 1 ? "Classification & Name" : wizardStep === 2 ? "Amount & Billing Cycle" : "Next Due Date & Review"}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={resetForm}
                      className="p-2 hover:bg-zinc-800 rounded-xl text-zinc-400 hover:text-white transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Step Progress Bar */}
                  <div className="px-6 pt-3 pb-3 bg-black/40 border-b border-white/5 flex items-center gap-2">
                    <div className={`flex-1 h-1.5 rounded-full transition-all ${wizardStep >= 1 ? "bg-rose-500" : "bg-zinc-800"}`} />
                    <div className={`flex-1 h-1.5 rounded-full transition-all ${wizardStep >= 2 ? "bg-rose-500" : "bg-zinc-800"}`} />
                    <div className={`flex-1 h-1.5 rounded-full transition-all ${wizardStep >= 3 ? "bg-rose-500" : "bg-zinc-800"}`} />
                  </div>

                  {/* Wizard Form Content */}
                  <div className="p-6">
                    {wizardError && (
                      <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center justify-between">
                        <span>{wizardError}</span>
                        <button type="button" onClick={() => setWizardError(null)} className="text-rose-400 font-bold ml-2">x</button>
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
                              className={`text-[10px] font-mono font-bold py-2 rounded-lg transition-all text-center ${
                                formCategory === "fixed-expense"
                                  ? "bg-rose-600/30 text-rose-200 border border-rose-500/30 shadow-sm"
                                  : "text-zinc-500 hover:text-zinc-300"
                              }`}
                            >
                              Fixed Bill
                            </button>
                            <button
                              type="button"
                              onClick={() => setFormCategory("subscription")}
                              className={`text-[10px] font-mono font-bold py-2 rounded-lg transition-all text-center ${
                                formCategory === "subscription"
                                  ? "bg-rose-600/30 text-rose-200 border border-rose-500/30 shadow-sm"
                                  : "text-zinc-500 hover:text-zinc-300"
                              }`}
                            >
                              Subscription
                            </button>
                            <button
                              type="button"
                              onClick={() => setFormCategory("savings")}
                              className={`text-[10px] font-mono font-bold py-2 rounded-lg transition-all text-center ${
                                formCategory === "savings"
                                  ? "bg-indigo-600/30 text-indigo-200 border border-indigo-500/30 shadow-sm"
                                  : "text-zinc-500 hover:text-zinc-300"
                              }`}
                            >
                              Savings Vault
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
                            placeholder={
                              formCategory === "fixed-expense"
                                ? "e.g. Rent, Electricity, Grocery Budget"
                                : formCategory === "subscription"
                                ? "e.g. Netflix, Spotify, iCloud Storage"
                                : "e.g. Emergency Reservoir, High-Yield Savings"
                            }
                            value={formTitle}
                            onChange={(e) => {
                              setFormTitle(e.target.value);
                              if (wizardError) setWizardError(null);
                            }}
                            className="block w-full px-3.5 py-2.5 text-xs bg-black/40 border border-white/10 rounded-xl focus:outline-none focus:border-rose-500 text-zinc-100 transition-colors"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-mono tracking-widest text-zinc-500 uppercase mb-2">
                            Quick Presets
                          </label>
                          <div className="flex flex-wrap gap-1.5">
                            {(formCategory === "subscription"
                              ? ["Netflix", "Spotify", "Amazon Prime", "iCloud", "Gym"]
                              : formCategory === "savings"
                              ? ["Emergency Fund", "Travel Vault", "Investment Reserve", "Tax Buffer"]
                              : ["Apartment Rent", "Electric Utility", "Water & Sewage", "Internet Fiber", "Groceries"]
                            ).map(preset => (
                              <button
                                key={preset}
                                type="button"
                                onClick={() => {
                                  setFormTitle(preset);
                                  if (wizardError) setWizardError(null);
                                }}
                                className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-rose-950/40 border border-white/5 hover:border-rose-500/30 text-zinc-400 hover:text-rose-300 text-[10px] font-medium transition-all"
                              >
                                + {preset}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t border-white/5 mt-4">
                          <button
                            type="button"
                            onClick={resetForm}
                            className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 text-xs font-semibold transition-colors"
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
                            className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs transition-colors shadow-lg shadow-rose-950/50 flex items-center gap-1.5"
                          >
                            <span>Next: Amount & Cycle</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Step 2: Amount & Cycle */}
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
                            className="block w-full px-3.5 py-2.5 text-xs bg-black/40 border border-white/10 rounded-xl focus:outline-none focus:border-rose-500 text-zinc-100 font-mono transition-colors"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-mono tracking-widest text-zinc-400 uppercase mb-1.5">
                            Billing Cycle Frequency
                          </label>
                          <select
                            value={formFrequency}
                            onChange={(e) => setFormFrequency(e.target.value)}
                            className="block w-full px-3.5 py-2.5 text-xs bg-black/40 border border-white/10 rounded-xl focus:outline-none focus:border-rose-500 text-zinc-100 transition-colors cursor-pointer"
                          >
                            <option value="monthly">Monthly Cycle</option>
                            <option value="weekly">Weekly Cycle</option>
                            <option value="biweekly">Bi-Weekly Cycle</option>
                            <option value="quarterly">Quarterly Cycle</option>
                            <option value="yearly">Yearly Cycle</option>
                          </select>
                        </div>

                        <div className="flex justify-between items-center pt-4 border-t border-white/5 mt-4">
                          <button
                            type="button"
                            onClick={() => {
                              setWizardError(null);
                              setWizardStep(1);
                            }}
                            className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 text-xs font-semibold transition-colors flex items-center gap-1.5"
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
                            className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs transition-colors shadow-lg shadow-rose-950/50 flex items-center gap-1.5"
                          >
                            <span>Next: Due Date & Review</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Step 3: Due Date & Final Review */}
                    {wizardStep === 3 && (
                      <form onSubmit={handleSaveTransaction} className="space-y-4">
                        <div>
                          <label className="block text-[10px] font-mono tracking-widest text-zinc-400 uppercase mb-1.5">
                            Next Due Date
                          </label>
                          <input
                            type="date"
                            required
                            value={formStartDate}
                            onChange={(e) => setFormStartDate(e.target.value)}
                            className="block w-full px-3.5 py-2.5 text-xs bg-black/40 border border-white/10 rounded-xl focus:outline-none focus:border-rose-500 text-zinc-100 font-mono transition-colors"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-mono tracking-widest text-zinc-400 uppercase mb-1.5">
                            Notes (Optional)
                          </label>
                          <textarea
                            rows={2}
                            placeholder="e.g. Auto-pay configured on checking account..."
                            value={formNotes}
                            onChange={(e) => setFormNotes(e.target.value)}
                            className="block w-full px-3.5 py-2.5 text-xs bg-black/40 border border-white/10 rounded-xl focus:outline-none focus:border-rose-500 text-zinc-100 transition-colors"
                          />
                        </div>

                        {/* Summary Card */}
                        <div className="p-3.5 bg-rose-950/20 border border-rose-500/20 rounded-2xl flex flex-col gap-1.5 text-xs">
                          <div className="text-[10px] font-mono uppercase text-rose-400 font-bold tracking-wider">Expense Summary Review</div>
                          <div className="flex justify-between text-zinc-300">
                            <span>Type:</span>
                            <span className="font-semibold text-white capitalize">{formCategory.replace("-", " ")}</span>
                          </div>
                          <div className="flex justify-between text-zinc-300">
                            <span>Expense:</span>
                            <span className="font-semibold text-white">{formTitle}</span>
                          </div>
                          <div className="flex justify-between text-zinc-300">
                            <span>Amount & Cycle:</span>
                            <span className="font-semibold text-rose-400 font-mono">${formAmount} ({formFrequency})</span>
                          </div>
                          <div className="flex justify-between text-zinc-300">
                            <span>Next Due Date:</span>
                            <span className="font-semibold text-white font-mono">{formStartDate}</span>
                          </div>
                        </div>

                        <div className="flex justify-between items-center pt-4 border-t border-white/5 mt-4">
                          <button
                            type="button"
                            onClick={() => {
                              setWizardError(null);
                              setWizardStep(2);
                            }}
                            className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 text-xs font-semibold transition-colors flex items-center gap-1.5"
                          >
                            <ArrowLeft className="w-3.5 h-3.5" />
                            <span>Back</span>
                          </button>
                          <button
                            type="submit"
                            className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs transition-colors shadow-lg shadow-rose-950/50 flex items-center gap-1.5"
                          >
                            <TrendingDown className="w-3.5 h-3.5" />
                            <span>{editingId ? "Save Changes" : "Complete & Save Expense"}</span>
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                </div>
              )}


              {/* ==================== 3. SEPARATE LIABILITIES WIZARD ==================== */}
              {formCategory === "liability" && (
                <div className="flex flex-col">
                  {/* Liability Header */}
                  <div className="p-5 border-b border-white/5 flex items-center justify-between gap-3 bg-zinc-900/60">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                        <Clock className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-zinc-100 flex items-center gap-2">
                          {editingId ? "Edit Liability Wizard" : "Liabilities Wizard"}
                        </h3>
                        <p className="text-xs text-zinc-400">
                          Step {wizardStep} of 3 &bull; {wizardStep === 1 ? "Obligation Title" : wizardStep === 2 ? "Payment & Schedule" : "First Due Date & Terms"}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={resetForm}
                      className="p-2 hover:bg-zinc-800 rounded-xl text-zinc-400 hover:text-white transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Step Progress Bar */}
                  <div className="px-6 pt-3 pb-3 bg-black/40 border-b border-white/5 flex items-center gap-2">
                    <div className={`flex-1 h-1.5 rounded-full transition-all ${wizardStep >= 1 ? "bg-amber-500" : "bg-zinc-800"}`} />
                    <div className={`flex-1 h-1.5 rounded-full transition-all ${wizardStep >= 2 ? "bg-amber-500" : "bg-zinc-800"}`} />
                    <div className={`flex-1 h-1.5 rounded-full transition-all ${wizardStep >= 3 ? "bg-amber-500" : "bg-zinc-800"}`} />
                  </div>

                  {/* Wizard Form Content */}
                  <div className="p-6">
                    {wizardError && (
                      <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center justify-between">
                        <span>{wizardError}</span>
                        <button type="button" onClick={() => setWizardError(null)} className="text-rose-400 font-bold ml-2">x</button>
                      </div>
                    )}

                    {/* Step 1: Obligation Title */}
                    {wizardStep === 1 && (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-[10px] font-mono tracking-widest text-zinc-400 uppercase mb-1.5">
                            Liability / Lease Name
                          </label>
                          <input
                            type="text"
                            required
                            autoFocus
                            placeholder="e.g. Vehicle Lease, Equipment Installment, Contract Payment"
                            value={formTitle}
                            onChange={(e) => {
                              setFormTitle(e.target.value);
                              if (wizardError) setWizardError(null);
                            }}
                            className="block w-full px-3.5 py-2.5 text-xs bg-black/40 border border-white/10 rounded-xl focus:outline-none focus:border-amber-500 text-zinc-100 transition-colors"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-mono tracking-widest text-zinc-500 uppercase mb-2">
                            Quick Presets
                          </label>
                          <div className="flex flex-wrap gap-1.5">
                            {["Vehicle Lease", "Equipment Loan", "Office Lease", "Contract Payment"].map(preset => (
                              <button
                                key={preset}
                                type="button"
                                onClick={() => {
                                  setFormTitle(preset);
                                  if (wizardError) setWizardError(null);
                                }}
                                className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-amber-950/40 border border-white/5 hover:border-amber-500/30 text-zinc-400 hover:text-amber-300 text-[10px] font-medium transition-all"
                              >
                                + {preset}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t border-white/5 mt-4">
                          <button
                            type="button"
                            onClick={resetForm}
                            className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 text-xs font-semibold transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (!formTitle.trim()) {
                                setWizardError("Please enter a Liability / Lease Name.");
                                return;
                              }
                              setWizardError(null);
                              setWizardStep(2);
                            }}
                            className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs transition-colors shadow-lg shadow-amber-950/50 flex items-center gap-1.5"
                          >
                            <span>Next: Payment & Schedule</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Step 2: Payment & Schedule */}
                    {wizardStep === 2 && (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-[10px] font-mono tracking-widest text-zinc-400 uppercase mb-1.5">
                            Payment Amount ($)
                          </label>
                          <input
                            type="number"
                            required
                            min="0.01"
                            step="any"
                            autoFocus
                            placeholder="e.g. 380"
                            value={formAmount}
                            onChange={(e) => {
                              setFormAmount(e.target.value);
                              if (wizardError) setWizardError(null);
                            }}
                            className="block w-full px-3.5 py-2.5 text-xs bg-black/40 border border-white/10 rounded-xl focus:outline-none focus:border-amber-500 text-zinc-100 font-mono transition-colors"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-mono tracking-widest text-zinc-400 uppercase mb-1.5">
                            Payment Schedule
                          </label>
                          <select
                            value={formFrequency}
                            onChange={(e) => setFormFrequency(e.target.value)}
                            className="block w-full px-3.5 py-2.5 text-xs bg-black/40 border border-white/10 rounded-xl focus:outline-none focus:border-amber-500 text-zinc-100 transition-colors cursor-pointer"
                          >
                            <option value="monthly">Monthly Due Date</option>
                            <option value="biweekly">Bi-Weekly Installments</option>
                            <option value="semimonthly">Semi-Monthly Schedule</option>
                            <option value="quarterly">Quarterly Installment</option>
                            <option value="yearly">Yearly Obligation</option>
                          </select>
                        </div>

                        {formFrequency === "semimonthly" && (
                          <div className="p-3 bg-amber-950/20 border border-amber-500/20 rounded-xl">
                            <label className="block text-[9px] font-mono text-amber-400 uppercase mb-1 font-bold">
                              Payment Days of Month (Comma Separated)
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. 1, 15"
                              value={formSemiDays}
                              onChange={(e) => setFormSemiDays(e.target.value)}
                              className="block w-full px-2.5 py-1.5 text-xs bg-zinc-950 border border-amber-500/30 rounded-lg focus:outline-none focus:border-amber-400 text-zinc-100 font-mono transition-colors"
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
                            className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 text-xs font-semibold transition-colors flex items-center gap-1.5"
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
                            className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs transition-colors shadow-lg shadow-amber-950/50 flex items-center gap-1.5"
                          >
                            <span>Next: First Due Date & Terms</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Step 3: First Due Date & Final Terms Review */}
                    {wizardStep === 3 && (
                      <form onSubmit={handleSaveTransaction} className="space-y-4">
                        <div>
                          <label className="block text-[10px] font-mono tracking-widest text-zinc-400 uppercase mb-1.5">
                            First Due Date
                          </label>
                          <input
                            type="date"
                            required
                            value={formStartDate}
                            onChange={(e) => setFormStartDate(e.target.value)}
                            className="block w-full px-3.5 py-2.5 text-xs bg-black/40 border border-white/10 rounded-xl focus:outline-none focus:border-amber-500 text-zinc-100 font-mono transition-colors"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-mono tracking-widest text-zinc-400 uppercase mb-1.5">
                            Contract Terms / Notes
                          </label>
                          <textarea
                            rows={2}
                            placeholder="e.g. 36-month lease term ending November 2028..."
                            value={formNotes}
                            onChange={(e) => setFormNotes(e.target.value)}
                            className="block w-full px-3.5 py-2.5 text-xs bg-black/40 border border-white/10 rounded-xl focus:outline-none focus:border-amber-500 text-zinc-100 transition-colors"
                          />
                        </div>

                        {/* Summary Card */}
                        <div className="p-3.5 bg-amber-950/20 border border-amber-500/20 rounded-2xl flex flex-col gap-1.5 text-xs">
                          <div className="text-[10px] font-mono uppercase text-amber-400 font-bold tracking-wider">Liability Summary Review</div>
                          <div className="flex justify-between text-zinc-300">
                            <span>Obligation:</span>
                            <span className="font-semibold text-white">{formTitle}</span>
                          </div>
                          <div className="flex justify-between text-zinc-300">
                            <span>Payment & Cycle:</span>
                            <span className="font-semibold text-amber-400 font-mono">${formAmount} ({formFrequency})</span>
                          </div>
                          <div className="flex justify-between text-zinc-300">
                            <span>First Due Date:</span>
                            <span className="font-semibold text-white font-mono">{formStartDate}</span>
                          </div>
                        </div>

                        <div className="flex justify-between items-center pt-4 border-t border-white/5 mt-4">
                          <button
                            type="button"
                            onClick={() => {
                              setWizardError(null);
                              setWizardStep(2);
                            }}
                            className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 text-xs font-semibold transition-colors flex items-center gap-1.5"
                          >
                            <ArrowLeft className="w-3.5 h-3.5" />
                            <span>Back</span>
                          </button>
                          <button
                            type="submit"
                            className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs transition-colors shadow-lg shadow-amber-950/50 flex items-center gap-1.5"
                          >
                            <Clock className="w-3.5 h-3.5" />
                            <span>{editingId ? "Save Changes" : "Complete & Save Liability"}</span>
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                </div>
              )}

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DAILY TRANSACTIONS POPUP MODAL */}
      <AnimatePresence>
        {selectedDay && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedDay(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            
            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", duration: 0.3 }}
              className="relative w-full max-w-lg bg-zinc-900 border border-white/10 rounded-3xl shadow-2xl overflow-hidden z-10"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-white/5">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-xl">
                    <CalendarCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-md font-bold text-zinc-100">
                      Transactions
                    </h3>
                    <p className="text-xs text-zinc-400 font-mono mt-0.5">
                      {selectedDay.date.toLocaleDateString("en-US", { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedDay(null)}
                  className="p-2 hover:bg-zinc-800 rounded-xl text-zinc-400 hover:text-zinc-200 transition-colors"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Day Balance Summary Row */}
              <div className="px-6 py-4 bg-zinc-950/40 border-b border-white/5 grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider block">Projected Day Balance</span>
                  <span className="text-lg font-bold text-indigo-400 font-mono">
                    ${selectedDay.endingBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider block">Net Change</span>
                  <span className={`text-md font-mono font-bold block mt-0.5 ${(selectedDay.incoming - selectedDay.outgoing) >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                    {(selectedDay.incoming - selectedDay.outgoing) >= 0 ? "+" : "-"}
                    ${Math.abs(selectedDay.incoming - selectedDay.outgoing).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Scheduled Transactions List */}
              <div className="p-6 max-h-[300px] overflow-y-auto scrollbar-thin flex flex-col gap-3">
                <span className="text-[10px] font-mono font-bold tracking-widest text-zinc-500 uppercase">
                  Scheduled Day Transactions
                </span>

                {selectedDay.transactions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-zinc-500 italic text-xs text-center">
                    <CheckCircle className="w-8 h-8 text-zinc-650 mb-2 opacity-50" />
                    <p>No transactions scheduled on this date.</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {selectedDay.transactions.map((t, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 rounded-2xl bg-black/20 border border-white/5">
                        <div className="flex items-center gap-3">
                          <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                            t.item.category === "income" ? "bg-emerald-400" :
                            t.item.category === "savings" ? "bg-indigo-400" :
                            t.item.category === "liability" ? "bg-amber-400" : "bg-rose-400"
                          }`}></span>
                          <div>
                            <div className="text-xs font-semibold text-zinc-100">{t.item.title}</div>
                            <div className="text-[9px] text-zinc-500 uppercase font-mono mt-0.5">{t.item.category}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`text-xs font-mono font-bold ${t.item.category === "income" ? "text-emerald-400" : "text-rose-400"}`}>
                            {t.item.category === "income" ? "+" : "-"}${t.amount.toLocaleString("en-US")}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer action button */}
              <div className="p-4 bg-zinc-950/20 border-t border-white/5 flex justify-end">
                <button
                  onClick={() => setSelectedDay(null)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-zinc-100 text-xs font-semibold transition-all"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
