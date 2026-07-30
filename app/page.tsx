"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
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
  ChevronDown,
  ArrowLeft,
  ArrowRight,
  Info,
  Menu,
  Layers,
  CreditCard,
  Zap,
  ShieldAlert,
  Percent,
  Target,
  Flame,
  Snowflake,
  Calculator,
  Scale,
  DollarSign,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Sliders,
  BarChart3,
  Check,
  Edit3,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import {
  RecurringTransaction,
  TransactionOverride,
  ForecastDay,
  generateForecast,
  DEFAULT_TRANSACTIONS,
  SAMPLE_TRANSACTIONS,
  formatDateLocal,
  parseDateLocal,
  getMonthlyEquivalent,
  getQuarterlyEquivalent,
  getYearlyEquivalent,
  getFrequencySubtext,
  getOccurrencesInMonth,
  getOccurrencesInQuarter,
  getActualMonthlyTotal,
  getActualQuarterlyTotal,
  calculatePayoffDetails,
  simulateLiabilityPayoff,
  Account,
  SAMPLE_ACCOUNTS,
} from "@/lib/forecast";

function generateId(): string {
  return (
    "t_" +
    String(new Date().getTime()) +
    "_" +
    String(Math.floor(Math.random() * 1000))
  );
}

function getMondayOfWeek(d: Date): Date {
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const result = new Date(d);
  result.setDate(diff);
  return result;
}

export default function Home() {
  const [mounted, setMounted] = useState<boolean>(false);

  // Navigation State
  const [activeTab, setActiveTab] = useState<
    "dashboard" | "accounts" | "income" | "expenses" | "liabilities"
  >("dashboard");
  const [expenseSubTab, setExpenseSubTab] = useState<
    "all" | "fixed" | "subscriptions" | "savings"
  >("all");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  // Core Data State
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<RecurringTransaction[]>([]);
  const [launchDateStr, setLaunchDateStr] = useState<string>("2026-07-28");

  // Custom non-blocking confirmation dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

  // Custom non-blocking alert dialog state
  const [alertMessage, setAlertMessage] = useState<string | null>(null);

  // Derive initial balance dynamically as net sum of checking + savings + other cash, minus credit card outstanding liabilities
  const initialBalance = useMemo(() => {
    return accounts.reduce((acc, curr) => {
      if (curr.type === "credit-card") {
        return acc - curr.balance;
      }
      return acc + curr.balance;
    }, 0);
  }, [accounts]);

  // Selected account filter for dashboard timeline (empty string means show Net Cash Balance)
  const [dashboardAccountFilter, setDashboardAccountFilter] =
    useState<string>("");

  // Sub-view mode for the dashboard (defaults to calendar, but can switch to analytics)
  const [dashboardViewMode, setDashboardViewMode] =
    useState<"calendar" | "analytics">("calendar");

  // Timeframe View Filter for the Dashboard
  const [forecastRange, setForecastRange] = useState<
    "week" | "two-weeks" | "month" | "quarter"
  >("month");

  // Interactive Day Selection State
  const [selectedDay, setSelectedDay] = useState<ForecastDay | null>(null);
  const [isAddingTransaction, setIsAddingTransaction] =
    useState<boolean>(false);
  const [formCategory, setFormCategory] = useState<
    "income" | "fixed-expense" | "subscription" | "liability" | "savings" | "transfer"
  >("income");

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
  const [formAccountId, setFormAccountId] = useState<string>("");
  const [formFundingAccountId, setFormFundingAccountId] = useState<string>("");
  const [formTargetAccountId, setFormTargetAccountId] = useState<string>("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [wizardStep, setWizardStep] = useState<number>(1);
  const [wizardError, setWizardError] = useState<string | null>(null);

  // Liability specific form state
  const [formLiabilityType, setFormLiabilityType] = useState<string>("credit_card");
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

  // Payoff Strategy Planner state
  const [isPayoffPlannerOpen, setIsPayoffPlannerOpen] = useState<boolean>(false);
  const [payoffStrategy, setPayoffStrategy] = useState<"avalanche" | "snowball">("avalanche");
  const [payoffExtraBudget, setPayoffExtraBudget] = useState<number>(200);

  // Main Accounts tab form state
  const [accFormName, setAccFormName] = useState<string>("");
  const [accFormType, setAccFormType] = useState<
    "checking" | "savings" | "credit-card" | "other"
  >("checking");
  const [accFormCustomType, setAccFormCustomType] = useState<string>("");
  const [accFormBalance, setAccFormBalance] = useState<string>("");
  const [accFormStartDate, setAccFormStartDate] = useState<string>("");
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);
  const [isAddingAccount, setIsAddingAccount] = useState<boolean>(false);
  const [accFormError, setAccFormError] = useState<string | null>(null);
  const [deletingAccount, setDeletingAccount] = useState<Account | null>(null);
  const [deleteAccountTransferTargetId, setDeleteAccountTransferTargetId] = useState<string>("");
  const [deleteActionChoice, setDeleteActionChoice] = useState<"transfer" | "archive">("transfer");
  const [selectedDetailTransaction, setSelectedDetailTransaction] = useState<RecurringTransaction | null>(null);

  // Onboarding liability input states
  const [wizLiabilityType, setWizLiabilityType] = useState<string>("credit_card");
  const [wizCurrentBalance, setWizCurrentBalance] = useState<string>("");
  const [wizInterestRate, setWizInterestRate] = useState<string>("");
  const [wizMinimumPayment, setWizMinimumPayment] = useState<string>("");
  const [wizHasCreditLimit, setWizHasCreditLimit] = useState<boolean>(false);
  const [wizCreditLimit, setWizCreditLimit] = useState<string>("");

  // Stop/End dates for recurring transactions
  const [formEndDate, setFormEndDate] = useState<string>("");
  const [wizEndDate, setWizEndDate] = useState<string>("");

  // Day-specific transaction overrides (e.g. marking as paid, skipping, or modifying an instance)
  const [transactionOverrides, setTransactionOverrides] = useState<TransactionOverride[]>([]);
  const [overrideEditingTxId, setOverrideEditingTxId] = useState<string | null>(null);
  const [overrideCustomAmountInput, setOverrideCustomAmountInput] = useState<string>("");

  // Onboarding full-screen wizard state
  const [wizActiveStep, setWizActiveStep] = useState<number>(0);
  const [wizAccounts, setWizAccounts] = useState<Account[]>([]);
  const [wizTransactions, setWizTransactions] = useState<
    RecurringTransaction[]
  >([]);
  const [wizError, setWizError] = useState<string | null>(null);

  // Wizard Accounts input state
  const [wizAccName, setWizAccName] = useState<string>("");
  const [wizAccType, setWizAccType] = useState<
    "checking" | "savings" | "credit-card" | "other"
  >("checking");
  const [wizAccCustomType, setWizAccCustomType] = useState<string>("");
  const [wizAccBalance, setWizAccBalance] = useState<string>("");

  // Wizard Transaction inline form states
  const [wizTitle, setWizTitle] = useState<string>("");
  const [wizAmount, setWizAmount] = useState<string>("");
  const [wizStartDate, setWizStartDate] = useState<string>("");
  const [wizFrequency, setWizFrequency] = useState<string>("monthly");
  const [wizSemiDays, setWizSemiDays] = useState<string>("1,15");
  const [wizExpenseType, setWizExpenseType] = useState<
    "fixed-expense" | "subscription"
  >("fixed-expense");
  const [wizAccountId, setWizAccountId] = useState<string>("");
  const [wizFundingAccountId, setWizFundingAccountId] = useState<string>("");
  const [wizTargetAccountId, setWizTargetAccountId] = useState<string>("");

  // Summary Savings states
  const [wizSavingsTitle, setWizSavingsTitle] = useState<string>(
    "General Savings Contribution",
  );
  const [wizSavingsAmount, setWizSavingsAmount] = useState<string>("200");
  const [wizSavingsFrequency, setWizSavingsFrequency] =
    useState<string>("monthly");
  const [wizSavingsStartDate, setWizSavingsStartDate] = useState<string>("");
  const [wizSavingsEnabled, setWizSavingsEnabled] = useState<boolean>(true);
  const [wizSavingsAccountId, setWizSavingsAccountId] = useState<string>(""); // Target Savings account for savings routing
  const [wizSavingsFundingId, setWizSavingsFundingId] = useState<string>(""); // Funding account for savings transfer

  // Client hydration effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(true);
      if (typeof window !== "undefined") {
        const todayStr = formatDateLocal(new Date());

        const storedTx = localStorage.getItem("personal_forecast_transactions");
        if (storedTx) {
          try {
            setTransactions(JSON.parse(storedTx));
          } catch (e) {}
        } else {
          // Fallback migration from old storage keys
          const legacyTx = localStorage.getItem("futureflow_transactions");
          if (legacyTx) {
            try {
              setTransactions(JSON.parse(legacyTx));
            } catch (e) {}
          }
        }

        const storedAccounts = localStorage.getItem(
          "personal_forecast_accounts",
        );
        if (storedAccounts) {
          try {
            setAccounts(JSON.parse(storedAccounts));
          } catch (e) {}
        } else {
          // Backward compatibility migration: create a primary checking account with initial balance
          const storedBal = localStorage.getItem("futureflow_initial_balance");
          const balanceNum =
            storedBal !== null && storedBal !== undefined
              ? Number(storedBal)
              : 0;
          setAccounts([
            {
              id: "acc_checking",
              name: "Primary Checking",
              type: "checking",
              balance: balanceNum,
            },
          ]);
        }

        const storedLaunch = localStorage.getItem("futureflow_launch_date");
        const activeLaunchStr = storedLaunch || todayStr;
        setLaunchDateStr(activeLaunchStr);
        setFormStartDate(activeLaunchStr);
        setWizStartDate(activeLaunchStr);
        setWizSavingsStartDate(activeLaunchStr);

        const storedOverrides = localStorage.getItem("personal_forecast_overrides");
        if (storedOverrides) {
          try {
            setTransactionOverrides(JSON.parse(storedOverrides));
          } catch (e) {}
        }

        const d = parseDateLocal(activeLaunchStr);
        setCalendarYear(d.getFullYear());
        setCalendarMonth(d.getMonth());
      }
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // Save state helper
  const saveToStorage = (
    updatedTx: RecurringTransaction[],
    updatedDate: string,
    updatedAccounts: Account[],
    updatedOverrides?: TransactionOverride[],
  ) => {
    if (typeof window !== "undefined") {
      localStorage.setItem(
        "personal_forecast_transactions",
        JSON.stringify(updatedTx),
      );
      localStorage.setItem("personal_forecast_launch_date", updatedDate);
      localStorage.setItem(
        "personal_forecast_accounts",
        JSON.stringify(updatedAccounts),
      );
      localStorage.setItem(
        "personal_forecast_overrides",
        JSON.stringify(updatedOverrides || transactionOverrides),
      );
    }
  };

  const updateTransactions = (newTx: RecurringTransaction[]) => {
    setTransactions(newTx);
    saveToStorage(newTx, launchDateStr, accounts, transactionOverrides);
  };

  const updateAccountsState = (newAccs: Account[]) => {
    setAccounts(newAccs);
    saveToStorage(transactions, launchDateStr, newAccs, transactionOverrides);
  };

  const updateLaunchDate = (dateStr: string) => {
    setLaunchDateStr(dateStr);
    saveToStorage(transactions, dateStr, accounts, transactionOverrides);

    // Auto-adjust traditional calendar view to match the selected Starting Date
    const d = parseDateLocal(dateStr);
    setCalendarYear(d.getFullYear());
    setCalendarMonth(d.getMonth());
  };

  const updateOverrides = (newOverrides: TransactionOverride[]) => {
    setTransactionOverrides(newOverrides);
    saveToStorage(transactions, launchDateStr, accounts, newOverrides);
  };

  const handleClearData = () => {
    setConfirmDialog({
      isOpen: true,
      title: "Clear All Data",
      message:
        "Are you sure you want to clear all transactions and reset data to start fresh?",
      onConfirm: () => {
        setTransactions([]);
        setTransactionOverrides([]);
        const defaultAccs: Account[] = [
          {
            id: "acc_checking",
            name: "Primary Checking",
            type: "checking",
            balance: 0,
          },
        ];
        setAccounts(defaultAccs);
        saveToStorage([], launchDateStr, defaultAccs, []);
      },
    });
  };

  const handleLoadSampleData = () => {
    setTransactions(SAMPLE_TRANSACTIONS);
    setAccounts(SAMPLE_ACCOUNTS);
    setTransactionOverrides([]);
    saveToStorage(SAMPLE_TRANSACTIONS, launchDateStr, SAMPLE_ACCOUNTS, []);
  };

  const handleToggleVerifyOverride = (transactionId: string, dateStr: string) => {
    const existingIndex = transactionOverrides.findIndex(
      (o) => o.transactionId === transactionId && o.dateStr === dateStr
    );

    let newOverrides = [...transactionOverrides];
    if (existingIndex > -1) {
      const existing = transactionOverrides[existingIndex];
      if (existing.status === 'verified') {
        newOverrides.splice(existingIndex, 1);
      } else {
        newOverrides[existingIndex] = {
          ...existing,
          status: 'verified',
          customAmount: undefined,
        };
      }
    } else {
      newOverrides.push({
        id: generateId(),
        transactionId,
        dateStr,
        status: 'verified',
      });
    }
    updateOverrides(newOverrides);
    
    if (selectedDay) {
      const activeTimeline = generateForecast({
        startDate: parseDateLocal(launchDateStr),
        numberOfDays: 120,
        accounts,
        transactions,
        overrides: newOverrides,
      });
      const updatedDay = activeTimeline.find(d => d.dateStr === selectedDay.dateStr);
      setSelectedDay(updatedDay || null);
    }
  };

  const handleSkipOverride = (transactionId: string, dateStr: string) => {
    const existingIndex = transactionOverrides.findIndex(
      (o) => o.transactionId === transactionId && o.dateStr === dateStr
    );

    let newOverrides = [...transactionOverrides];
    if (existingIndex > -1) {
      const existing = transactionOverrides[existingIndex];
      if (existing.status === 'skipped') {
        newOverrides.splice(existingIndex, 1);
      } else {
        newOverrides[existingIndex] = {
          ...existing,
          status: 'skipped',
          customAmount: undefined,
        };
      }
    } else {
      newOverrides.push({
        id: generateId(),
        transactionId,
        dateStr,
        status: 'skipped',
      });
    }
    updateOverrides(newOverrides);
    
    if (selectedDay) {
      const activeTimeline = generateForecast({
        startDate: parseDateLocal(launchDateStr),
        numberOfDays: 120,
        accounts,
        transactions,
        overrides: newOverrides,
      });
      const updatedDay = activeTimeline.find(d => d.dateStr === selectedDay.dateStr);
      setSelectedDay(updatedDay || null);
    }
  };

  const handleModifyAmountOverride = (transactionId: string, dateStr: string, customAmt: number) => {
    const existingIndex = transactionOverrides.findIndex(
      (o) => o.transactionId === transactionId && o.dateStr === dateStr
    );

    let newOverrides = [...transactionOverrides];
    if (existingIndex > -1) {
      newOverrides[existingIndex] = {
        ...newOverrides[existingIndex],
        status: 'modified',
        customAmount: customAmt,
      };
    } else {
      newOverrides.push({
        id: generateId(),
        transactionId,
        dateStr,
        status: 'modified',
        customAmount: customAmt,
      });
    }
    updateOverrides(newOverrides);
    setOverrideEditingTxId(null);
    setOverrideCustomAmountInput("");
    
    if (selectedDay) {
      const activeTimeline = generateForecast({
        startDate: parseDateLocal(launchDateStr),
        numberOfDays: 120,
        accounts,
        transactions,
        overrides: newOverrides,
      });
      const updatedDay = activeTimeline.find(d => d.dateStr === selectedDay.dateStr);
      setSelectedDay(updatedDay || null);
    }
  };

  // Dynamic forecast timelines depending on the user's view selection
  const forecastTimeline = useMemo(() => {
    let start = parseDateLocal(launchDateStr);
    let days = 30;
    if (forecastRange === "week") {
      start = getMondayOfWeek(start);
      days = 7;
    } else if (forecastRange === "two-weeks") {
      const monday = getMondayOfWeek(start);
      start = new Date(monday);
      start.setDate(monday.getDate() + 7);
      days = 7;
    } else if (forecastRange === "month") {
      days = 31;
    } else if (forecastRange === "quarter") {
      days = 92;
    }

    return generateForecast({
      startDate: start,
      numberOfDays: days,
      accounts,
      transactions,
      overrides: transactionOverrides,
    });
  }, [launchDateStr, forecastRange, accounts, transactions, transactionOverrides]);

  // A 120-day period forecast timeline specifically for looking up calendar days
  const calendarForecastTimeline = useMemo(() => {
    const startOfCalendar = new Date(calendarYear, calendarMonth, 1);
    const endOfCalendar = new Date(calendarYear, calendarMonth + 3, 0); // extend for quarter rendering too
    const launchDate = parseDateLocal(launchDateStr);

    const simStart =
      launchDate < startOfCalendar ? launchDate : startOfCalendar;
    const diffTime = Math.abs(endOfCalendar.getTime() - simStart.getTime());
    const simDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 15;

    return generateForecast({
      startDate: simStart,
      numberOfDays: simDays,
      accounts,
      transactions,
      overrides: transactionOverrides,
    });
  }, [calendarYear, calendarMonth, launchDateStr, accounts, transactions, transactionOverrides]);

  // Compute daily balance dip alerts below $100 for cash accounts
  const lowBalanceAlerts = useMemo(() => {
    const alerts: {
      dateStr: string;
      accountId: string;
      accountName: string;
      balance: number;
      cause?: string;
    }[] = [];

    const todayStr = launchDateStr;
    const sortedDays = [...calendarForecastTimeline].sort((a, b) => a.dateStr.localeCompare(b.dateStr));

    for (const day of sortedDays) {
      if (day.dateStr < todayStr) continue; // Only care about future/current projected dates
      
      for (const acc of accounts) {
        if (acc.type === "credit-card") continue;
        const bal = day.accountBalances[acc.id] ?? 0;
        if (bal < 100) {
          const occurredTxs = day.transactions.filter(t => t.amount < 0);
          const hasOutgoing = occurredTxs.length > 0;
          
          if (hasOutgoing || bal < 0) {
            const causeTitles = occurredTxs.map(t => t.item.title).join(", ");
            alerts.push({
              dateStr: day.dateStr,
              accountId: acc.id,
              accountName: acc.name,
              balance: bal,
              cause: causeTitles || undefined,
            });
          } else {
            const hasPriorAlert = alerts.some(a => a.accountId === acc.id && Math.abs(new Date(a.dateStr).getTime() - new Date(day.dateStr).getTime()) < 7 * 24 * 3600 * 1000);
            if (!hasPriorAlert) {
              alerts.push({
                dateStr: day.dateStr,
                accountId: acc.id,
                accountName: acc.name,
                balance: bal,
              });
            }
          }
        }
      }
    }
    return alerts;
  }, [calendarForecastTimeline, accounts, launchDateStr]);

  // Compute a memoized map of dates that have low balance warnings for quick lookup
  const lowBalanceDatesMap = useMemo(() => {
    const map = new Map<string, typeof lowBalanceAlerts>();
    for (const alert of lowBalanceAlerts) {
      if (!map.has(alert.dateStr)) {
        map.set(alert.dateStr, []);
      }
      map.get(alert.dateStr)!.push(alert);
    }
    return map;
  }, [lowBalanceAlerts]);

  // Traditional Month Calendar Cell Grid
  const calendarCells = useMemo(() => {
    const firstDay = new Date(calendarYear, calendarMonth, 1);
    const startOfWeek = firstDay.getDay();
    const numDays = new Date(calendarYear, calendarMonth + 1, 0).getDate();

    const cells: {
      date: Date | null;
      isPadding: boolean;
      forecast?: ForecastDay;
    }[] = [];

    // Padding
    for (let i = 0; i < startOfWeek; i++) {
      cells.push({ date: null, isPadding: true });
    }

    // Month days
    for (let dayNum = 1; dayNum <= numDays; dayNum++) {
      const date = new Date(calendarYear, calendarMonth, dayNum);
      const targetStr = formatDateLocal(date);
      const forecast = calendarForecastTimeline.find(
        (d) => d.dateStr === targetStr,
      );
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
    if (
      forecastRange === "week" ||
      forecastRange === "two-weeks" ||
      forecastRange === "quarter"
    ) {
      forecastTimeline.forEach((day, idx) => {
        day.transactions.forEach((tx) => {
          const amt = Math.abs(tx.amount);
          // If filtering, only sum up if this transaction is linked to the selected account
          const matchesFilter =
            !dashboardAccountFilter ||
            tx.item.accountId === dashboardAccountFilter ||
            tx.item.fundingAccountId === dashboardAccountFilter ||
            tx.item.targetAccountId === dashboardAccountFilter;

          if (matchesFilter) {
            if (tx.item.category === "income") income += amt;
            else if (tx.item.category === "fixed-expense") fixedExpenses += amt;
            else if (tx.item.category === "subscription") subscriptions += amt;
            else if (tx.item.category === "liability") liabilities += amt;
            else if (tx.item.category === "savings") savings += amt;
          }
        });
        if (idx === forecastTimeline.length - 1) {
          endingBalance =
            dashboardAccountFilter && day.accountBalances
              ? (day.accountBalances[dashboardAccountFilter] ?? 0)
              : day.endingBalance;
        }
      });
    } else {
      // Month View: Sum up exactly across the active calendar month cells
      const activeDays = calendarCells.filter(
        (cell) => !cell.isPadding && cell.forecast,
      );
      activeDays.forEach((cell) => {
        const day = cell.forecast!;
        day.transactions.forEach((tx) => {
          const amt = Math.abs(tx.amount);
          const matchesFilter =
            !dashboardAccountFilter ||
            tx.item.accountId === dashboardAccountFilter ||
            tx.item.fundingAccountId === dashboardAccountFilter ||
            tx.item.targetAccountId === dashboardAccountFilter;

          if (matchesFilter) {
            if (tx.item.category === "income") income += amt;
            else if (tx.item.category === "fixed-expense") fixedExpenses += amt;
            else if (tx.item.category === "subscription") subscriptions += amt;
            else if (tx.item.category === "liability") liabilities += amt;
            else if (tx.item.category === "savings") savings += amt;
          }
        });
      });
      if (activeDays.length > 0) {
        const lastDay = activeDays[activeDays.length - 1].forecast!;
        endingBalance =
          dashboardAccountFilter && lastDay.accountBalances
            ? (lastDay.accountBalances[dashboardAccountFilter] ?? 0)
            : lastDay.endingBalance;
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
      endingBalance,
    };
  }, [
    forecastRange,
    forecastTimeline,
    calendarCells,
    initialBalance,
    dashboardAccountFilter,
  ]);

  // Analytical chart data derived from active forecastTimeline and account filtering
  const chartData = useMemo(() => {
    return forecastTimeline.map((day) => {
      const balance =
        dashboardAccountFilter && day.accountBalances
          ? (day.accountBalances[dashboardAccountFilter] ?? 0)
          : day.endingBalance;

      const formattedDate = new Date(day.date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });

      // Sum of daily deposits and expenses for the filtered account or net
      let dayIncome = 0;
      let dayExpenses = 0;
      day.transactions.forEach((tx) => {
        const matches =
          !dashboardAccountFilter ||
          tx.item.accountId === dashboardAccountFilter ||
          tx.item.fundingAccountId === dashboardAccountFilter ||
          tx.item.targetAccountId === dashboardAccountFilter;

        if (matches) {
          const amt = Math.abs(tx.amount);
          if (tx.item.category === "income") {
            dayIncome += amt;
          } else {
            dayExpenses += amt;
          }
        }
      });

      return {
        dateStr: day.dateStr,
        dateFormatted: formattedDate,
        Balance: balance,
        Income: dayIncome,
        Expenses: dayExpenses,
      };
    });
  }, [forecastTimeline, dashboardAccountFilter]);

  // Projections summary cards metrics
  const analyticsSummary = useMemo(() => {
    let startingBal = 0;
    if (forecastTimeline.length > 0) {
      const firstDay = forecastTimeline[0];
      startingBal =
        dashboardAccountFilter && firstDay.accountBalances
          ? (firstDay.accountBalances[dashboardAccountFilter] ?? 0) -
            firstDay.incoming +
            firstDay.outgoing
          : firstDay.startingBalance;
    }

    const netChange = activeMetrics.endingBalance - startingBal;

    return {
      startingBalance: startingBal,
      income: activeMetrics.income,
      payments:
        activeMetrics.expenses +
        activeMetrics.liabilities +
        activeMetrics.savings,
      endingBalance: activeMetrics.endingBalance,
      netChange,
    };
  }, [forecastTimeline, activeMetrics, dashboardAccountFilter]);

  // Navigation month handlers
  const handlePrevMonth = () => {
    if (calendarMonth === 0) {
      setCalendarMonth(11);
      setCalendarYear((prev) => prev - 1);
    } else {
      setCalendarMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (calendarMonth === 11) {
      setCalendarMonth(0);
      setCalendarYear((prev) => prev + 1);
    } else {
      setCalendarMonth((prev) => prev + 1);
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
      .map((s) => parseInt(s.trim()))
      .filter((num) => !isNaN(num) && num >= 1 && num <= 31);

    const transactionData: RecurringTransaction = {
      id: editingId || generateId(),
      title: formTitle.trim(),
      amount: amountNum,
      startDate: formStartDate,
      frequency: formFrequency as any,
      category: formCategory,
      semiMonthlyDays:
        formFrequency === "semimonthly" ? updatedSemiDays : undefined,
      notes: formNotes.trim(),
      accountId: formAccountId || undefined,
      fundingAccountId: formFundingAccountId || undefined,
      targetAccountId: formTargetAccountId || undefined,
      liabilityType: formCategory === "liability" ? (formLiabilityType as any) : undefined,
      interestRate: formCategory === "liability" && formInterestRate ? parseFloat(formInterestRate) : undefined,
      currentBalance: formCategory === "liability" && formCurrentBalance ? parseFloat(formCurrentBalance) : undefined,
      startingBalance: formCategory === "liability" && formStartingBalance ? parseFloat(formStartingBalance) : undefined,
      creditLimit: formCategory === "liability" && formHasCreditLimit && formCreditLimit ? parseFloat(formCreditLimit) : undefined,
      minimumPayment: formCategory === "liability" && formMinimumPayment ? parseFloat(formMinimumPayment) : undefined,
      balanceTransferFee: formCategory === "liability" && formHasBalanceTransferFee && formBalanceTransferFee ? parseFloat(formBalanceTransferFee) : undefined,
      balanceTransferFeeMin: formCategory === "liability" && formHasBalanceTransferFee && formBalanceTransferFeeMin ? parseFloat(formBalanceTransferFeeMin) : undefined,
      promoRate: formCategory === "liability" && formHasPromoPeriod && formPromoRate ? parseFloat(formPromoRate) : undefined,
      promoEndDate: formCategory === "liability" && formHasPromoPeriod && formPromoEndDate ? formPromoEndDate : undefined,
      minimumPaymentCalc: formCategory === "liability" ? (formMinPaymentCalc as any) : undefined,
      dayOfMonth: formCategory === "liability" ? formDayOfMonth : undefined,
    };

    let updatedTx: RecurringTransaction[];
    if (editingId) {
      updatedTx = transactions.map((t) =>
        t.id === editingId ? transactionData : t,
      );
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
    setFormAccountId("");
    setFormFundingAccountId("");
    setFormTargetAccountId("");
    setFormLiabilityType("credit_card");
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
    setFormAccountId(tx.accountId || "");
    setFormFundingAccountId(tx.fundingAccountId || "");
    setFormTargetAccountId(tx.targetAccountId || "");
    setFormLiabilityType(tx.liabilityType || "credit_card");
    setFormInterestRate(tx.interestRate !== undefined ? String(tx.interestRate) : "");
    setFormCurrentBalance(tx.currentBalance !== undefined ? String(tx.currentBalance) : "");
    setFormStartingBalance(tx.startingBalance !== undefined ? String(tx.startingBalance) : "");
    setFormCreditLimit(tx.creditLimit !== undefined ? String(tx.creditLimit) : "");
    setFormMinimumPayment(tx.minimumPayment !== undefined ? String(tx.minimumPayment) : "");
    setFormHasCreditLimit(tx.creditLimit !== undefined && tx.creditLimit > 0);
    setFormHasBalanceTransferFee(tx.balanceTransferFee !== undefined);
    setFormBalanceTransferFee(tx.balanceTransferFee !== undefined ? String(tx.balanceTransferFee) : "");
    setFormBalanceTransferFeeMin(tx.balanceTransferFeeMin !== undefined ? String(tx.balanceTransferFeeMin) : "");
    setFormHasPromoPeriod(tx.promoRate !== undefined || !!tx.promoEndDate);
    setFormPromoRate(tx.promoRate !== undefined ? String(tx.promoRate) : "");
    setFormPromoEndDate(tx.promoEndDate || "");
    setFormMinPaymentCalc(tx.minimumPaymentCalc || "fixed");
    setFormDayOfMonth(tx.dayOfMonth || "1");
    setWizardStep(1);
    setWizardError(null);
    setIsAddingTransaction(true);
  };

  const handleDeleteTransaction = (id: string) => {
    setConfirmDialog({
      isOpen: true,
      title: "Delete Recurring Transaction",
      message:
        "Are you sure you want to delete this recurring transaction? Your future forecast will update immediately.",
      onConfirm: () => {
        const updated = transactions.filter((t) => t.id !== id);
        updateTransactions(updated);
        setSelectedDay(null);
      },
    });
  };

  // JSON Export/Import PWA utilities
  const handleExportData = () => {
    const dataStr = JSON.stringify(
      {
        version: "1.1",
        launchDateStr,
        accounts,
        transactions,
      },
      null,
      2,
    );
    const dataUri =
      "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);
    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute("download", "forecast_registry_backup.json");
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
            const importedLaunchDate = parsed.launchDateStr || launchDateStr;
            let importedAccounts: Account[] = [];
            if (parsed.accounts && Array.isArray(parsed.accounts)) {
              importedAccounts = parsed.accounts;
            } else {
              const legacyBalance =
                typeof parsed.initialBalance === "number"
                  ? parsed.initialBalance
                  : initialBalance;
              importedAccounts = [
                {
                  id: "acc_checking",
                  name: "Primary Checking",
                  type: "checking",
                  balance: legacyBalance,
                },
              ];
            }
            setTransactions(parsed.transactions);
            setAccounts(importedAccounts);
            setLaunchDateStr(importedLaunchDate);
            saveToStorage(
              parsed.transactions,
              importedLaunchDate,
              importedAccounts,
            );
            setAlertMessage(
              "Configuration, accounts, and transactions imported successfully!",
            );
          } else {
            setAlertMessage("Invalid configuration structure.");
          }
        } catch (err) {
          setAlertMessage("Error parsing JSON file.");
        }
      };
    }
  };

  // Category filters for UI management lists
  const categorizedTransactions = useMemo(() => {
    return {
      income: transactions.filter((t) => t.category === "income"),
      fixedExpenses: transactions.filter((t) => t.category === "fixed-expense"),
      subscriptions: transactions.filter((t) => t.category === "subscription"),
      savings: transactions.filter((t) => t.category === "savings"),
      liabilities: transactions.filter((t) => t.category === "liability"),
    };
  }, [transactions]);

  // Month label format helper
  const calendarMonthLabel = useMemo(() => {
    return new Date(calendarYear, calendarMonth, 1).toLocaleDateString(
      "en-US",
      {
        month: "long",
        year: "numeric",
      },
    );
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
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#070709] text-zinc-100 font-sans relative">
      {/* RESPONSIVE TOP NAVIGATION BAR (unified for both desktop and mobile) */}
      {accounts.length > 0 && (
        <header className="sticky top-0 z-30 w-full bg-zinc-950/85 backdrop-blur-md border-b border-white/5 shrink-0">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
            {/* Logo & branding */}
            <div className="flex items-center gap-2.5">
              <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-zinc-900 border border-white/10 shadow-sm text-indigo-400 shrink-0">
                <CalendarIcon className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-sm font-bold text-white tracking-tight leading-none">
                  Financial OS
                </h1>
                <span className="text-[9px] font-mono text-zinc-500 uppercase mt-0.5 block font-medium">
                  Cash Engine
                </span>
              </div>
            </div>

            {/* Desktop Navigation Tabs (visible on md+) */}
            <nav className="hidden md:flex items-center gap-1.5 bg-zinc-900/30 border border-white/5 p-1 rounded-2xl">
              <button
                onClick={() => setActiveTab("dashboard")}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl transition-all text-xs font-semibold ${
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
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl transition-all text-xs font-semibold ${
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
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl transition-all text-xs font-semibold ${
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
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl transition-all text-xs font-semibold ${
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
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl transition-all text-xs font-semibold ${
                  activeTab === "liabilities"
                    ? "bg-zinc-900 text-white border border-white/10 shadow-sm"
                    : "text-zinc-400 hover:text-zinc-200 border border-transparent"
                }`}
              >
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>
                  Liabilities ({categorizedTransactions.liabilities.length})
                </span>
              </button>
            </nav>

            {/* Right Desktop Actions & Hamburger menu for mobile */}
            <div className="flex items-center gap-2.5">
              {/* Desktop Actions (visible on lg+) */}
              <div className="hidden lg:flex items-center gap-2">
                <button
                  onClick={handleExportData}
                  title="Export Data"
                  className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900/60 hover:bg-zinc-900 border border-white/5 text-zinc-300 hover:text-white text-xs font-medium font-mono transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export</span>
                </button>
                <label
                  title="Import Data"
                  className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900/60 hover:bg-zinc-900 border border-white/5 text-zinc-300 hover:text-white text-xs font-medium font-mono transition-colors cursor-pointer animate-none"
                >
                  <Upload className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Import</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportData}
                    className="hidden"
                  />
                </label>

                <div className="w-px h-5 bg-white/10 mx-1"></div>

                <button
                  onClick={handleClearData}
                  title="Clear Database"
                  className="flex items-center justify-center gap-1 px-3 py-1.5 rounded-xl bg-amber-950/20 hover:bg-amber-950/40 border border-amber-500/20 text-amber-400 text-xs font-medium font-mono transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear</span>
                </button>
                <button
                  onClick={handleLoadSampleData}
                  title="Load Sample Datasets"
                  className="flex items-center justify-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-950/20 hover:bg-indigo-950/40 border border-indigo-500/20 text-indigo-400 text-xs font-medium font-mono transition-all"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Sample</span>
                </button>
              </div>

              {/* Mobile / Tablet Menu Button (< md) */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2.5 rounded-xl bg-zinc-900 border border-white/10 text-zinc-300 hover:text-white transition-colors"
                aria-label="Toggle navigation menu"
              >
                {isMobileMenuOpen ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        </header>
      )}

      {/* MOBILE DRAWER MODAL MENU (< md) */}
      <AnimatePresence>
        {isMobileMenuOpen && accounts.length > 0 && (
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
                  <span className="text-base font-bold text-white">
                    Financial OS Menu
                  </span>
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
                <span className="text-xs font-mono font-bold tracking-widest text-zinc-500 uppercase px-1">
                  Navigation
                </span>
                <button
                  onClick={() => {
                    setActiveTab("dashboard");
                    setIsMobileMenuOpen(false);
                  }}
                  className={`flex items-center gap-3 p-3.5 rounded-xl text-left transition-all ${
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
                  className={`flex items-center gap-3 p-3.5 rounded-xl text-left transition-all ${
                    activeTab === "accounts"
                      ? "bg-indigo-600/25 border border-indigo-500/40 text-white font-bold"
                      : "bg-zinc-900/60 text-zinc-200 hover:text-white"
                  }`}
                >
                  <Wallet className="w-4.5 h-4.5 text-indigo-400" />
                  <span className="text-sm font-medium">
                    Accounts ({accounts.length})
                  </span>
                </button>

                <button
                  onClick={() => {
                    setActiveTab("income");
                    setIsMobileMenuOpen(false);
                  }}
                  className={`flex items-center gap-3 p-3.5 rounded-xl text-left transition-all ${
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
                  className={`flex items-center gap-3 p-3.5 rounded-xl text-left transition-all ${
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
                  className={`flex items-center gap-3 p-3.5 rounded-xl text-left transition-all ${
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
                  Actions & Data
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      handleExportData();
                      setIsMobileMenuOpen(false);
                    }}
                    className="flex items-center justify-center gap-2 p-3 rounded-xl bg-zinc-900 border border-white/10 text-zinc-200 text-xs font-mono font-semibold"
                  >
                    <Download className="w-4 h-4 text-indigo-400" />
                    <span>Export</span>
                  </button>
                  <label className="flex items-center justify-center gap-2 p-3 rounded-xl bg-zinc-900 border border-white/10 text-zinc-200 text-xs font-mono font-semibold cursor-pointer">
                    <Upload className="w-4 h-4 text-indigo-400" />
                    <span>Import</span>
                    <input
                      type="file"
                      accept=".json"
                      onChange={(e) => {
                        handleImportData(e);
                        setIsMobileMenuOpen(false);
                      }}
                      className="hidden"
                    />
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-1">
                  <button
                    onClick={() => {
                      handleClearData();
                      setIsMobileMenuOpen(false);
                    }}
                    className="flex items-center justify-center gap-2 p-3 rounded-xl bg-amber-950/30 border border-amber-500/30 text-amber-300 text-xs font-mono font-semibold"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Clear All</span>
                  </button>
                  <button
                    onClick={() => {
                      handleLoadSampleData();
                      setIsMobileMenuOpen(false);
                    }}
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

      {/* MAIN CONTENT REGION */}
      <main
        className={`flex-1 flex flex-col overflow-y-auto scrollbar-thin relative bg-[#070709] ${accounts.length === 0 ? "p-4 sm:p-6 md:p-8 items-center justify-center min-h-screen" : "p-4 sm:p-6 md:p-8 pb-24 md:pb-8"}`}
      >
        {accounts.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center w-full max-w-5xl mx-auto py-8">
            {/* Header / Brand for onboarding */}
            <div className="w-full mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-zinc-950 border border-white/10 shadow-sm text-indigo-400 shrink-0">
                  <CalendarIcon className="w-5 h-5" />
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
                  className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-950/20 hover:bg-indigo-950/40 border border-indigo-500/20 text-indigo-400 text-xs font-semibold font-mono transition-all"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Load Sample</span>
                </button>

                <label className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-900/60 hover:bg-zinc-900 border border-white/5 text-zinc-300 hover:text-white text-xs font-semibold font-mono transition-colors cursor-pointer">
                  <Upload className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Import</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportData}
                    className="hidden"
                  />
                </label>
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
                  <h3 className="text-xl font-bold text-white mt-1">
                    Configure Your Financial OS
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    {"Let's establish your forecast parameters step-by-step."}
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
                        className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold font-mono transition-all ${
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
                          className={`w-3 sm:w-6 h-[2px] ${wizActiveStep > item.step ? "bg-emerald-500/40" : "bg-zinc-800"}`}
                        />
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>

              {/* Wizard Step Content Container */}
              <div className="flex-1 py-6">
                {wizError && (
                  <div className="mb-4 bg-amber-500/10 border border-amber-500/20 px-4 py-2.5 rounded-2xl text-amber-300 text-xs flex items-center justify-between">
                    <span>{wizError}</span>
                    <button
                      onClick={() => setWizError(null)}
                      className="font-bold text-zinc-400 hover:text-white ml-2"
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
                    className="grid grid-cols-1 lg:grid-cols-12 gap-6"
                  >
                    {/* Add Account Inline Form */}
                    <div className="lg:col-span-5 bg-zinc-950/40 border border-white/5 p-5 rounded-2xl flex flex-col gap-4">
                      <div>
                        <h4 className="text-sm font-bold text-white">
                          1. Add Your Accounts
                        </h4>
                        <p className="text-[11px] text-zinc-400">
                          Establish your checking, savings, or credit cards.
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
                              <option value="credit-card">Credit Card</option>
                              <option value="other">Other</option>
                            </select>
                          </div>

                          <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-bold font-mono tracking-wider text-zinc-400 uppercase">
                              {wizAccType === "credit-card"
                                ? "Outstanding Balance ($)"
                                : "Starting Balance ($)"}
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
                            if (
                              wizAccType === "other" &&
                              !wizAccCustomType.trim()
                            ) {
                              setWizError(
                                "Account type cannot be ambiguous. Please specify the custom account type.",
                              );
                              return;
                            }
                            const bal = parseFloat(wizAccBalance) || 0;
                            const accId = "acc_" + String(new Date().getTime());
                            const newAccount: Account = {
                              id: accId,
                              name: wizAccName.trim(),
                              type: wizAccType,
                              customType:
                                wizAccType === "other"
                                  ? wizAccCustomType.trim()
                                  : undefined,
                              balance: Math.max(0, bal),
                            };

                            // Save account
                            const updatedAccounts = [
                              ...wizAccounts,
                              newAccount,
                            ];
                            setWizAccounts(updatedAccounts);

                            // If credit card, automatically pre-add liability with $0 so they configure minimum payments in Step 3
                            if (wizAccType === "credit-card") {
                              const matchingLiability: RecurringTransaction = {
                                id: "l_" + String(new Date().getTime()),
                                title: `${wizAccName.trim()} Minimum Payment`,
                                amount: 0, // Prompt for missing amount
                                startDate: launchDateStr,
                                frequency: "monthly",
                                category: "liability",
                                targetAccountId: accId,
                              };
                              setWizTransactions((prev) => [
                                ...prev,
                                matchingLiability,
                              ]);
                            }

                            // Reset form inputs
                            setWizAccName("");
                            setWizAccCustomType("");
                            setWizAccBalance("");
                            setWizError(null);
                          }}
                          className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-md mt-2"
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
                          onChange={(e) => updateLaunchDate(e.target.value)}
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
                                (sum, a) =>
                                  a.type === "credit-card"
                                    ? sum - a.balance
                                    : sum + a.balance,
                                0,
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
                                Add checking or savings accounts to establish
                                starting funds.
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
                                    <p className="text-xs font-semibold text-white">
                                      {acc.name}
                                    </p>
                                    <p className="text-[10px] text-zinc-400 capitalize font-mono">
                                      {acc.type === "other"
                                        ? acc.customType
                                        : acc.type}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <span
                                      className={`text-xs font-mono font-bold ${acc.type === "credit-card" ? "text-amber-400" : "text-emerald-400"}`}
                                    >
                                      {acc.type === "credit-card" ? "-" : ""}$
                                      {acc.balance.toLocaleString("en-US", {
                                        minimumFractionDigits: 2,
                                      })}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        // Delete account & matching auto-liabilities
                                        setWizAccounts(
                                          wizAccounts.filter(
                                            (a) => a.id !== acc.id,
                                          ),
                                        );
                                        setWizTransactions(
                                          wizTransactions.filter(
                                            (t) => t.targetAccountId !== acc.id,
                                          ),
                                        );
                                      }}
                                      className="text-[10px] text-zinc-400 hover:text-white font-bold px-2 py-1"
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

                      <div className="pt-6 flex items-center justify-between gap-4">
                        <button
                          type="button"
                          onClick={() => {
                            setTransactions(SAMPLE_TRANSACTIONS);
                            setAccounts(SAMPLE_ACCOUNTS);
                            saveToStorage(
                              SAMPLE_TRANSACTIONS,
                              launchDateStr,
                              SAMPLE_ACCOUNTS,
                            );
                          }}
                          className="text-xs font-mono font-bold text-indigo-400 hover:text-indigo-300 transition-colors"
                        >
                          Skip & Load Sample Data
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            // Validate at least one checking or cash asset account exists
                            const hasCashAcc = wizAccounts.some(
                              (a) =>
                                a.type !== "credit-card" && a.type !== "other",
                            );
                            if (!hasCashAcc) {
                              setWizError(
                                "Please register at least one Checking or Savings asset account to begin.",
                              );
                              return;
                            }
                            setWizError(null);
                            setWizActiveStep(1);
                          }}
                          className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-bold text-xs text-white flex items-center gap-1.5 shadow-lg shadow-indigo-600/15 transition-all active:scale-95"
                        >
                          <span>Next: Set Up Income</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
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
                        <h4 className="text-sm font-bold text-white">
                          Add Income
                        </h4>
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
                              <option value="semimonthly">
                                Semi-Monthly (1st & 15th)
                              </option>
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
                            onChange={(e) => setWizAccountId(e.target.value)}
                            className="bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-medium cursor-pointer"
                          >
                            <option value="">
                              Select Asset Account (Default checking)
                            </option>
                            {wizAccounts
                              .filter((a) => a.type !== "credit-card")
                              .map((acc) => (
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
                              setWizError("Please enter an income name.");
                              return;
                            }
                            const amt = parseFloat(wizAmount);
                            if (isNaN(amt) || amt <= 0) {
                              setWizError(
                                "Please enter a valid amount greater than 0.",
                              );
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
                          className="w-full py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-md mt-2"
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
                                .reduce(
                                  (acc, c) => acc + getMonthlyEquivalent(c),
                                  0,
                                )
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
                                .reduce(
                                  (acc, c) => acc + getQuarterlyEquivalent(c),
                                  0,
                                )
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
                            (t) => t.category === "income",
                          ).length === 0 ? (
                            <div className="text-center py-8 text-zinc-500 text-xs italic">
                              No income added yet. Please add at least one
                              paycheck.
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
                                      <p className="text-xs font-semibold text-white">
                                        {t.title}
                                      </p>
                                      <p className="text-[10px] text-zinc-400 capitalize font-mono mt-0.5">
                                        {t.frequency === "biweekly"
                                          ? "Bi-Weekly"
                                          : t.frequency}{" "}
                                        &bull; Next: {t.startDate}
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
                                          setWizTransactions(
                                            wizTransactions.filter(
                                              (tx) => tx.id !== t.id,
                                            ),
                                          )
                                        }
                                        className="p-1.5 text-zinc-500 hover:text-amber-400 rounded-lg hover:bg-zinc-800 transition-colors"
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
                          className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-zinc-300 font-semibold text-xs flex items-center gap-1.5 transition-all"
                        >
                          <ArrowLeft className="w-4 h-4" />
                          <span>Back</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            if (
                              wizTransactions.filter(
                                (t) => t.category === "income",
                              ).length === 0
                            ) {
                              setWizError(
                                "We highly recommend adding at least one regular income payload to build an available spend margin.",
                              );
                            }
                            setWizActiveStep(2);
                            setWizError(null);
                          }}
                          className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-bold text-xs text-white flex items-center gap-1.5 shadow-lg shadow-indigo-600/15 transition-all"
                        >
                          <span>Next: Expenses</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* STEP 2: EXPENSES SETUP (FIXED & SUBSCRIPTIONS) */}
                {wizActiveStep === 2 && (
                  <motion.div
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="grid grid-cols-1 lg:grid-cols-12 gap-6"
                  >
                    {/* Inline Form */}
                    <div className="lg:col-span-5 bg-zinc-950/40 border border-white/5 p-5 rounded-2xl flex flex-col gap-4">
                      <div>
                        <h4 className="text-sm font-bold text-white font-sans">
                          Add Recurring Expense
                        </h4>
                        <p className="text-[11px] text-zinc-400">
                          Enter housing, subscriptions, or fixed outgoings.
                        </p>
                      </div>

                      <div className="grid grid-cols-2 p-1 bg-zinc-950 rounded-xl border border-white/5">
                        <button
                          type="button"
                          onClick={() => setWizExpenseType("fixed-expense")}
                          className={`py-1.5 rounded-lg text-[10px] font-bold uppercase font-mono transition-all ${
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
                          className={`py-1.5 rounded-lg text-[10px] font-bold uppercase font-mono transition-all ${
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
                            value={wizFundingAccountId}
                            onChange={(e) =>
                              setWizFundingAccountId(e.target.value)
                            }
                            className="bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-medium cursor-pointer"
                          >
                            <option value="">
                              Select Account (Default checking)
                            </option>
                            {wizAccounts.map((acc) => (
                              <option key={acc.id} value={acc.id}>
                                {acc.name} (
                                {acc.type === "credit-card"
                                  ? "Credit Card"
                                  : acc.type === "other"
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
                              setWizError(
                                "Please enter a valid amount greater than 0.",
                              );
                              return;
                            }
                            const payload: RecurringTransaction = {
                              id: generateId(),
                              title: wizTitle.trim(),
                              amount: amt,
                              startDate: wizStartDate || launchDateStr,
                              frequency: wizFrequency as any,
                              category: wizExpenseType,
                              fundingAccountId:
                                wizFundingAccountId || undefined,
                            };
                            setWizTransactions([...wizTransactions, payload]);
                            setWizTitle("");
                            setWizAmount("");
                            setWizFrequency("monthly");
                            setWizFundingAccountId("");
                            setWizError(null);
                          }}
                          className="w-full py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-md mt-2"
                        >
                          <Plus className="w-4 h-4" />
                          <span>
                            Add{" "}
                            {wizExpenseType === "fixed-expense"
                              ? "Fixed Expense"
                              : "Subscription"}
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
                                  (t) =>
                                    t.category === "fixed-expense" ||
                                    t.category === "subscription",
                                )
                                .reduce(
                                  (acc, c) => acc + getMonthlyEquivalent(c),
                                  0,
                                )
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
                                  (t) =>
                                    t.category === "fixed-expense" ||
                                    t.category === "subscription",
                                )
                                .reduce(
                                  (acc, c) => acc + getQuarterlyEquivalent(c),
                                  0,
                                )
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
                            (t) =>
                              t.category === "fixed-expense" ||
                              t.category === "subscription",
                          ).length === 0 ? (
                            <div className="text-center py-8 text-zinc-500 text-xs italic">
                              No expenses added yet. Please add any fixed costs
                              or regular subscriptions.
                            </div>
                          ) : (
                            <div className="divide-y divide-white/5 max-h-[220px] overflow-y-auto scrollbar-thin">
                              {wizTransactions
                                .filter(
                                  (t) =>
                                    t.category === "fixed-expense" ||
                                    t.category === "subscription",
                                )
                                .map((t) => (
                                  <div
                                    key={t.id}
                                    className="flex items-center justify-between p-3.5 hover:bg-zinc-900/30 transition-colors"
                                  >
                                    <div>
                                      <div className="flex items-center gap-1.5">
                                        <p className="text-xs font-semibold text-white">
                                          {t.title}
                                        </p>
                                        <span
                                          className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase font-mono tracking-wider ${
                                            t.category === "subscription"
                                              ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/15"
                                              : "bg-zinc-800 text-zinc-400"
                                          }`}
                                        >
                                          {t.category === "subscription"
                                            ? "Sub"
                                            : "Fixed"}
                                        </span>
                                      </div>
                                      <p className="text-[10px] text-zinc-400 capitalize font-mono mt-1">
                                        {t.frequency} &bull; Next due:{" "}
                                        {t.startDate}
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
                                          setWizTransactions(
                                            wizTransactions.filter(
                                              (tx) => tx.id !== t.id,
                                            ),
                                          )
                                        }
                                        className="p-1.5 text-zinc-500 hover:text-amber-400 rounded-lg hover:bg-zinc-800 transition-colors"
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
                          className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-zinc-300 font-semibold text-xs flex items-center gap-1.5 transition-all"
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
                          className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-bold text-xs text-white flex items-center gap-1.5 shadow-lg shadow-indigo-600/15 transition-all"
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
                        <h4 className="text-sm font-bold text-white">
                          Add Obligation / Liability
                        </h4>
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
                            Obligation Category
                          </label>
                          <select
                            value={wizLiabilityType}
                            onChange={(e) => setWizLiabilityType(e.target.value)}
                            className="bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-medium cursor-pointer"
                          >
                            <option value="credit_card">Credit Card</option>
                            <option value="personal_loan">Personal Loan</option>
                            <option value="auto_loan">Auto Loan</option>
                            <option value="mortgage">Home Mortgage</option>
                            <option value="revolving_loc">Personal Line of Credit</option>
                            <option value="student_loan">Student Loan</option>
                            <option value="other">Other Contract / Lease</option>
                          </select>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-bold font-mono tracking-wider text-zinc-400 uppercase">
                              Balance Owed ($)
                            </label>
                            <input
                              type="number"
                              placeholder="0.00"
                              value={wizCurrentBalance}
                              onChange={(e) => setWizCurrentBalance(e.target.value)}
                              className="bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono font-medium"
                            />
                          </div>

                          <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-bold font-mono tracking-wider text-zinc-400 uppercase">
                              Interest Rate (APR %)
                            </label>
                            <input
                              type="number"
                              placeholder="e.g. 21.99"
                              value={wizInterestRate}
                              onChange={(e) => setWizInterestRate(e.target.value)}
                              className="bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono font-medium"
                            />
                          </div>
                        </div>

                        <div className="p-3 bg-zinc-900/60 border border-white/5 rounded-xl space-y-2">
                          <label className="flex items-center gap-2.5 cursor-pointer text-[11px] text-zinc-300 font-medium select-none">
                            <input
                              type="checkbox"
                              checked={wizHasCreditLimit}
                              onChange={(e) => {
                                setWizHasCreditLimit(e.target.checked);
                                if (!e.target.checked) setWizCreditLimit("");
                              }}
                              className="w-3.5 h-3.5 rounded border-white/20 bg-zinc-900 text-indigo-500 focus:ring-indigo-500/20 cursor-pointer"
                            />
                            <span>Has credit limit</span>
                          </label>
                          {wizHasCreditLimit && (
                            <div className="pl-6">
                              <label className="block text-[10px] font-bold font-mono tracking-wider text-zinc-500 uppercase mb-1">
                                Credit Limit ($)
                              </label>
                              <input
                                type="number"
                                placeholder="e.g. 5000"
                                value={wizCreditLimit}
                                onChange={(e) => setWizCreditLimit(e.target.value)}
                                className="bg-zinc-900 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono w-full"
                              />
                            </div>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-bold font-mono tracking-wider text-zinc-400 uppercase">
                              Paid From Account
                            </label>
                            <select
                              value={wizFundingAccountId}
                              onChange={(e) =>
                                setWizFundingAccountId(e.target.value)
                              }
                              className="bg-zinc-900 border border-white/10 rounded-xl px-2.5 py-2 text-[11px] text-white focus:outline-none focus:border-indigo-500 font-medium cursor-pointer"
                            >
                              <option value="">
                                Select Asset (Default checking)
                              </option>
                              {wizAccounts
                                .filter((a) => a.type !== "credit-card")
                                .map((acc) => (
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

                          <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-bold font-mono tracking-wider text-zinc-400 uppercase">
                              Reduces Card (Optional)
                            </label>
                            <select
                              value={wizTargetAccountId}
                              onChange={(e) =>
                                setWizTargetAccountId(e.target.value)
                              }
                              className="bg-zinc-900 border border-white/10 rounded-xl px-2.5 py-2 text-[11px] text-white focus:outline-none focus:border-indigo-500 font-medium cursor-pointer"
                            >
                              <option value="">
                                Select Credit Card (If applicable)
                              </option>
                              {wizAccounts
                                .filter((a) => a.type === "credit-card")
                                .map((acc) => (
                                  <option key={acc.id} value={acc.id}>
                                    {acc.name}
                                  </option>
                                ))}
                            </select>
                          </div>
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
                              setWizError(
                                "Please enter a valid amount greater than 0.",
                              );
                              return;
                            }
                            const payload: RecurringTransaction = {
                              id: generateId(),
                              title: wizTitle.trim(),
                              amount: amt,
                              startDate: wizStartDate || launchDateStr,
                              frequency: wizFrequency as any,
                              category: "liability",
                              fundingAccountId:
                                wizFundingAccountId || undefined,
                              targetAccountId: wizTargetAccountId || undefined,
                              liabilityType: wizLiabilityType as any,
                              currentBalance: parseFloat(wizCurrentBalance) || undefined,
                              interestRate: parseFloat(wizInterestRate) || undefined,
                              creditLimit: wizHasCreditLimit ? (parseFloat(wizCreditLimit) || undefined) : undefined,
                            };
                            setWizTransactions([...wizTransactions, payload]);
                            setWizTitle("");
                            setWizAmount("");
                            setWizFrequency("monthly");
                            setWizFundingAccountId("");
                            setWizTargetAccountId("");
                            setWizLiabilityType("credit_card");
                            setWizCurrentBalance("");
                            setWizInterestRate("");
                            setWizHasCreditLimit(false);
                            setWizCreditLimit("");
                            setWizError(null);
                          }}
                          className="w-full py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-md mt-2"
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
                                .reduce(
                                  (acc, c) => acc + getMonthlyEquivalent(c),
                                  0,
                                )
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
                                .reduce(
                                  (acc, c) => acc + getQuarterlyEquivalent(c),
                                  0,
                                )
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
                            (t) => t.category === "liability",
                          ).length === 0 ? (
                            <div className="text-center py-8 text-zinc-500 text-xs italic">
                              {
                                "No obligations added. You can skip this step if you don't have recurring liabilities."
                              }
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
                                      <p className="text-xs font-semibold text-white">
                                        {t.title}
                                      </p>
                                      <p className="text-[10px] text-zinc-400 capitalize font-mono mt-0.5">
                                        {t.frequency} &bull; Next due:{" "}
                                        {t.startDate}
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
                                          setWizTransactions(
                                            wizTransactions.filter(
                                              (tx) => tx.id !== t.id,
                                            ),
                                          )
                                        }
                                        className="p-1.5 text-zinc-500 hover:text-amber-400 rounded-lg hover:bg-zinc-800 transition-colors"
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
                          className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-zinc-300 font-semibold text-xs flex items-center gap-1.5 transition-all"
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
                          className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-bold text-xs text-white flex items-center gap-1.5 shadow-lg shadow-indigo-600/15 transition-all"
                        >
                          <span>Next: Savings Target</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* STEP 4: DEDICATED SAVINGS TARGET SETUP */}
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
                          Recurring Savings target
                        </h4>
                        <p className="text-xs text-zinc-400">
                          Set up automatic savings contributions. Money will be routed on your timeline dynamically.
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
                                placeholder="e.g. general Savings"
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
                                  .filter((a) => a.type !== "credit-card")
                                  .map((acc) => (
                                    <option key={acc.id} value={acc.id}>
                                      {acc.name} (${acc.balance.toLocaleString("en-US", { minimumFractionDigits: 2 })})
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
                                      {acc.name} (${acc.balance.toLocaleString("en-US", { minimumFractionDigits: 2 })})
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
                          className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-zinc-300 font-semibold text-xs flex items-center gap-1.5 transition-all"
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
                          className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-bold text-xs text-white flex items-center gap-1.5 shadow-lg shadow-indigo-600/15 transition-all"
                        >
                          <span>Next: Summary & Review</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* STEP 5: SUMMARY & LAUNCH OS */}
                {wizActiveStep === 5 && (
                  <motion.div
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-6"
                  >
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                      {/* Left Column: Summary Overview of Registered Accounts and Transactions */}
                      <div className="lg:col-span-6 space-y-4 max-h-[600px] overflow-y-auto pr-1 scrollbar-thin">
                        {/* Registered Accounts Review */}
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
                                <div key={acc.id} className="flex justify-between items-center text-xs p-2 rounded-xl bg-black/20 border border-white/5">
                                  <div>
                                    <p className="font-semibold text-zinc-200">{acc.name}</p>
                                    <p className="text-[10px] text-zinc-500 capitalize font-mono">{acc.type === "other" ? acc.customType || "Other" : acc.type}</p>
                                  </div>
                                  <span className="font-bold font-mono text-zinc-300">
                                    ${acc.balance.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Registered Recurring Transactions Review */}
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
                                  <div key={tx.id} className="flex justify-between items-center text-xs p-2 rounded-xl bg-black/20 border border-white/5">
                                    <div>
                                      <p className="font-semibold text-zinc-200">{tx.title}</p>
                                      <div className="flex items-center gap-1.5 mt-0.5">
                                        <span className={`text-[8px] font-bold font-mono px-1 rounded uppercase ${
                                          isInc ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/15" :
                                          isLiab ? "bg-amber-500/10 text-amber-400 border border-amber-500/15" :
                                          "bg-sky-500/10 text-sky-400 border border-sky-500/15"
                                        }`}>
                                          {tx.category === "fixed-expense" ? "Fixed" : tx.category === "subscription" ? "Sub" : tx.category}
                                        </span>
                                        <span className="text-[9px] text-zinc-500 font-mono capitalize">{tx.frequency}</span>
                                      </div>
                                    </div>
                                    <span className={`font-bold font-mono ${isInc ? "text-emerald-400" : "text-sky-400"}`}>
                                      {isInc ? "+" : "-"}${tx.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
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
                                      <span className="text-[9px] text-cyan-500 font-mono capitalize">{wizSavingsFrequency}</span>
                                    </div>
                                  </div>
                                  <span className="font-bold font-mono text-cyan-400">
                                    -${(parseFloat(wizSavingsAmount) || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                                  </span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right Column: Live Run-Sheet Preview & KPI Totals */}
                      <div className="lg:col-span-6 bg-zinc-950/20 border border-white/5 rounded-2xl p-5 space-y-4 flex flex-col justify-between">
                        <div className="space-y-3">
                          <h4 className="text-xs font-bold font-mono text-zinc-400 uppercase tracking-wider">
                            Review Configuration Metrics
                          </h4>

                          <div className="space-y-2 font-mono text-xs text-zinc-300">
                            <div className="flex justify-between items-center py-1.5 border-b border-white/5">
                              <span>Starting Cash Balance</span>
                              <span className="font-bold text-white">
                                $
                                {wizAccounts
                                  .reduce(
                                    (acc, a) =>
                                      a.type === "credit-card"
                                        ? acc - a.balance
                                        : acc + a.balance,
                                    0,
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
                                  +${wizTransactions
                                    .filter((t) => t.category === "income")
                                    .reduce(
                                      (acc, c) => acc + getMonthlyEquivalent(c),
                                      0,
                                    )
                                    .toLocaleString("en-US", {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    })}/mo
                                </span>
                                <span className="text-[10px] text-emerald-300/80 ml-2">
                                  (+${wizTransactions
                                    .filter((t) => t.category === "income")
                                    .reduce(
                                      (acc, c) => acc + getQuarterlyEquivalent(c),
                                      0,
                                    )
                                    .toLocaleString("en-US", {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    })}/qtr)
                                </span>
                              </div>
                            </div>

                            <div className="flex justify-between items-center py-1.5 border-b border-white/5">
                              <span>Recurring Expenses</span>
                              <div className="text-right">
                                <span className="font-bold text-sky-400">
                                  -${wizTransactions
                                    .filter(
                                      (t) =>
                                        t.category === "fixed-expense" ||
                                        t.category === "subscription",
                                    )
                                    .reduce(
                                      (acc, c) => acc + getMonthlyEquivalent(c),
                                      0,
                                    )
                                    .toLocaleString("en-US", {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    })}/mo
                                </span>
                                <span className="text-[10px] text-sky-300/80 ml-2">
                                  (-${wizTransactions
                                    .filter(
                                      (t) =>
                                        t.category === "fixed-expense" ||
                                        t.category === "subscription",
                                    )
                                    .reduce(
                                      (acc, c) => acc + getQuarterlyEquivalent(c),
                                      0,
                                    )
                                    .toLocaleString("en-US", {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    })}/qtr)
                                </span>
                              </div>
                            </div>

                            <div className="flex justify-between items-center py-1.5 border-b border-white/5">
                              <span>Owings & Liabilities</span>
                              <div className="text-right">
                                <span className="font-bold text-amber-400">
                                  -${wizTransactions
                                    .filter((t) => t.category === "liability")
                                    .reduce(
                                      (acc, c) => acc + getMonthlyEquivalent(c),
                                      0,
                                    )
                                    .toLocaleString("en-US", {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    })}/mo
                                </span>
                                <span className="text-[10px] text-amber-300/80 ml-2">
                                  (-${wizTransactions
                                    .filter((t) => t.category === "liability")
                                    .reduce(
                                      (acc, c) => acc + getQuarterlyEquivalent(c),
                                      0,
                                    )
                                    .toLocaleString("en-US", {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    })}/qtr)
                                </span>
                              </div>
                            </div>

                            {wizSavingsEnabled && (
                              <div className="flex justify-between items-center py-1.5 border-b border-white/5">
                                <span>Savings Contribution</span>
                                <div className="text-right">
                                  <span className="font-bold text-indigo-400">
                                    -${getMonthlyEquivalent({
                                      amount: parseFloat(wizSavingsAmount) || 0,
                                      frequency: wizSavingsFrequency as any,
                                    }).toLocaleString("en-US", {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    })}/mo
                                  </span>
                                  <span className="text-[10px] text-indigo-300/80 ml-2">
                                    (-${getQuarterlyEquivalent({
                                      amount: parseFloat(wizSavingsAmount) || 0,
                                      frequency: wizSavingsFrequency as any,
                                    }).toLocaleString("en-US", {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    })}/qtr)
                                  </span>
                                </div>
                              </div>
                            )}

                            <div className="flex justify-between items-center pt-2.5">
                              <span className="font-bold text-white text-sm">
                                Spendable Margin (Left Over)
                              </span>
                              <div className="text-right">
                                <span className="font-bold text-indigo-300 text-sm">
                                  $
                                  {(
                                    wizTransactions
                                      .filter((t) => t.category === "income")
                                      .reduce(
                                        (acc, c) => acc + getMonthlyEquivalent(c),
                                        0,
                                      ) -
                                    (wizTransactions
                                      .filter(
                                        (t) =>
                                          t.category === "fixed-expense" ||
                                          t.category === "subscription",
                                      )
                                      .reduce(
                                        (acc, c) => acc + getMonthlyEquivalent(c),
                                        0,
                                      ) +
                                      wizTransactions
                                        .filter((t) => t.category === "liability")
                                        .reduce(
                                          (acc, c) =>
                                            acc + getMonthlyEquivalent(c),
                                          0,
                                        ) +
                                      (wizSavingsEnabled
                                        ? getMonthlyEquivalent({
                                            amount:
                                              parseFloat(wizSavingsAmount) || 0,
                                            frequency: wizSavingsFrequency as any,
                                          })
                                        : 0))
                                  ).toLocaleString("en-US", {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })}/mo
                                </span>
                                <span className="text-xs text-indigo-200/80 ml-2 font-normal">
                                  (${(
                                    wizTransactions
                                      .filter((t) => t.category === "income")
                                      .reduce(
                                        (acc, c) => acc + getQuarterlyEquivalent(c),
                                        0,
                                      ) -
                                    (wizTransactions
                                      .filter(
                                        (t) =>
                                          t.category === "fixed-expense" ||
                                          t.category === "subscription",
                                      )
                                      .reduce(
                                        (acc, c) => acc + getQuarterlyEquivalent(c),
                                        0,
                                      ) +
                                      wizTransactions
                                        .filter((t) => t.category === "liability")
                                        .reduce(
                                          (acc, c) =>
                                            acc + getQuarterlyEquivalent(c),
                                          0,
                                        ) +
                                      (wizSavingsEnabled
                                        ? getQuarterlyEquivalent({
                                            amount:
                                              parseFloat(wizSavingsAmount) || 0,
                                            frequency: wizSavingsFrequency as any,
                                          })
                                        : 0))
                                  ).toLocaleString("en-US", {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })}/qtr)
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="mt-4 p-3 rounded-xl bg-zinc-900/60 border border-white/10 text-[11px] text-zinc-400 space-y-1 leading-relaxed font-sans">
                            <p className="font-semibold text-zinc-300">💡 Standardized Budgeting Baseline Note:</p>
                            <p>
                              Monthly baselines assume 2 paychecks/mo for bi-weekly ($6x/qtr) and 4 payweeks/mo for weekly ($12x/qtr).
                            </p>
                            <p>
                              The 2 extra bi-weekly paychecks and 4 extra weekly payweeks each year occur in 3-paycheck and 5-payweek months, and are dynamically calculated on those exact calendar dates in your timeline forecast.
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between gap-4 pt-6 mt-6 border-t border-white/5">
                          <button
                            type="button"
                            onClick={() => setWizActiveStep(4)}
                            className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-zinc-300 font-semibold text-xs flex items-center gap-1.5 transition-all"
                          >
                            <ArrowLeft className="w-4 h-4" />
                            <span>Back</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              const finalTransactions = [...wizTransactions];
                              if (wizSavingsEnabled && wizSavingsTitle.trim()) {
                                const svAmt = parseFloat(wizSavingsAmount);
                                if (svAmt > 0) {
                                  finalTransactions.push({
                                    id: generateId(),
                                    title: wizSavingsTitle.trim(),
                                    amount: svAmt,
                                    startDate:
                                      wizSavingsStartDate || launchDateStr,
                                    frequency: wizSavingsFrequency as any,
                                    category: "savings",
                                    accountId:
                                      wizAccounts.find(
                                        (a) => a.type === "savings",
                                      )?.id || undefined,
                                  });
                                }
                              }
                              setTransactions(finalTransactions);
                              setAccounts(wizAccounts);
                              saveToStorage(
                                finalTransactions,
                                launchDateStr,
                                wizAccounts,
                              );
                              setWizActiveStep(0);
                              setWizTransactions([]);
                              setWizError(null);
                            }}
                            className="px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 font-bold text-xs text-white flex items-center gap-2 shadow-xl shadow-indigo-600/20 transition-all active:scale-95"
                          >
                            <CheckCircle className="w-4 h-4" />
                            <span>Launch Financial OS</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          </div>
        ) : (
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
                {/* Dynamic Dashboard Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-zinc-100 flex items-center gap-2">
                      <BarChart3 className="w-6 h-6 text-indigo-400" />
                      Dashboard
                    </h2>
                  </div>

                  {/* View Controls & Filters Group */}
                  <div className="flex flex-wrap items-center gap-3">
                    {/* View Switcher Pills */}
                    <div className="flex w-fit bg-black/60 p-1 rounded-xl border border-white/10 select-none">
                      <button
                        onClick={() => {
                          setDashboardViewMode("calendar");
                          setDashboardAccountFilter("");
                        }}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                          dashboardViewMode === "calendar"
                            ? "bg-zinc-800 text-white shadow-md border border-white/10"
                            : "text-zinc-400 hover:text-zinc-200"
                        }`}
                      >
                        <CalendarIcon className="w-3.5 h-3.5 text-indigo-400" />
                        Cash Timeline
                      </button>
                      <button
                        onClick={() => setDashboardViewMode("analytics")}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                          dashboardViewMode === "analytics"
                            ? "bg-zinc-800 text-white shadow-md border border-white/10"
                            : "text-zinc-400 hover:text-zinc-200"
                        }`}
                      >
                        <BarChart3 className="w-3.5 h-3.5 text-indigo-400" />
                        Projections
                      </button>
                    </div>

                    {/* Account Dropdown Selector */}
                    {dashboardViewMode === "analytics" && (
                      <div className="relative flex items-center">
                        <select
                          value={dashboardAccountFilter}
                          onChange={(e) => setDashboardAccountFilter(e.target.value)}
                          className="appearance-none w-full sm:w-auto bg-black/60 hover:bg-black/80 text-zinc-200 text-xs font-mono font-bold pl-3 pr-8 py-2 rounded-xl border border-white/10 cursor-pointer focus:outline-none focus:ring-1 focus:ring-indigo-500/40 transition-all text-left"
                        >
                          <option value="">Net Cash Balance (All Accounts)</option>
                          {accounts.map((acc) => (
                            <option key={acc.id} value={acc.id}>
                              {acc.name} (${acc.balance.toLocaleString("en-US", { minimumFractionDigits: 2 })})
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="w-4 h-4 text-zinc-400 absolute right-2.5 pointer-events-none" />
                      </div>
                    )}
                  </div>
                </div>


                {/* DYNAMIC CALENDAR DISPLAY (Absolute focal point of page) */}
                {dashboardViewMode === "calendar" && (
                  <div className="bg-zinc-900/30 border border-white/10 rounded-[2rem] p-4 sm:p-6 flex flex-col gap-4">
                  {/* Calendar Top Row: Title & Side-by-Side Mini KPIs */}
                  <div className="flex items-center justify-between gap-4 border-b border-white/5 pb-3">
                    <h3 className="text-base font-bold text-white flex items-center gap-2 shrink-0">
                      <CalendarIcon className="w-5 h-5 text-indigo-400" />
                      Calendar
                    </h3>
                    
                    {/* Compact Top-Right aligned KPIs */}
                    <div className="flex items-center gap-4 sm:gap-6 text-xs font-mono shrink-0 select-none">
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <span className="text-zinc-400 font-medium text-[10px] sm:text-xs">Spend:</span>
                        <span className="text-indigo-400 font-bold sm:text-sm whitespace-nowrap">
                          ${activeMetrics.spending.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="w-px h-4 bg-white/10 shrink-0" />
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <span className="text-zinc-400 font-medium text-[10px] sm:text-xs">Ending:</span>
                        <span className="text-emerald-400 font-bold sm:text-sm whitespace-nowrap">
                          ${activeMetrics.endingBalance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Calendar Second Row: Range buttons & Month Nav controls */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-3">
                      {/* Projection Range Selector inside calendar div header */}
                      <div className="flex bg-black/60 p-1 rounded-xl border border-white/10 w-full sm:w-auto justify-between sm:justify-start">
                        {(
                          ["week", "two-weeks", "month", "quarter"] as const
                        ).map((range) => (
                          <button
                            key={range}
                            onClick={() => setForecastRange(range)}
                            className={`text-xs font-mono font-bold px-3 py-1.5 rounded-lg transition-all capitalize ${
                              forecastRange === range
                                ? "bg-zinc-800 text-white shadow-md border border-white/10"
                                : "text-zinc-400 hover:text-white"
                            }`}
                          >
                            {range === "two-weeks"
                              ? "Next Week"
                              : range === "week"
                                ? "This Week"
                                : range === "month"
                                  ? "Month"
                                  : "Quarter"}
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
                  {(forecastRange === "week" ||
                    forecastRange === "two-weeks") && (
                    <div className="flex flex-col gap-3 mt-2">
                      {forecastTimeline.map((day, idx) => {
                        const isSelected =
                          selectedDay && selectedDay.dateStr === day.dateStr;
                        const hasTransactions = day.transactions.length > 0;

                        return (
                          <div
                            key={day.dateStr}
                            onClick={() => setSelectedDay(day)}
                            className={`p-4 rounded-2xl border transition-all duration-200 flex flex-col gap-3 cursor-pointer ${
                              isSelected
                                ? "bg-indigo-600/15 border-indigo-500 shadow-[0_4px_16px_rgba(99,102,241,0.15)] scale-[1.01]"
                                : "bg-zinc-900/50 border-white/5 hover:border-zinc-800 hover:bg-zinc-900/70"
                            }`}
                          >
                            {/* Day Header Row */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-baseline gap-2.5">
                                <span className="text-sm font-bold text-zinc-100">
                                  {day.date.toLocaleDateString("en-US", {
                                    weekday: "long",
                                  })}
                                </span>
                                <span className="text-xs font-semibold text-zinc-400 font-mono">
                                  {day.date.toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                  })}
                                </span>
                                {lowBalanceDatesMap.has(day.dateStr) && (
                                  <span className="flex items-center gap-1 text-[10px] text-amber-400 font-bold bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 rounded-lg ml-2">
                                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                                    <span>Balance Warning</span>
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-2 text-xs font-mono font-bold bg-indigo-500/10 border border-indigo-500/20 rounded-xl px-3 py-1.5 text-indigo-300">
                                <span>Projected:</span>
                                <span className="font-bold text-white">
                                  $
                                  {Math.round(
                                    dashboardAccountFilter && day.accountBalances
                                      ? (day.accountBalances[dashboardAccountFilter] ?? 0)
                                      : day.endingBalance
                                  ).toLocaleString()}
                                </span>
                              </div>
                            </div>

                            {/* Show transactions for that day */}
                            {hasTransactions ? (
                              <div className="border-t border-white/5 pt-2.5 space-y-2">
                                {day.transactions.map((t, tIdx) => {
                                  const isIncome = t.item.category === "income";
                                  const isSavings = t.item.category === "savings";
                                  const isLiability = t.item.category === "liability";

                                  const catColorClass = isIncome
                                    ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
                                    : isSavings
                                      ? "text-cyan-400 bg-cyan-500/10 border-cyan-500/20"
                                      : isLiability
                                        ? "text-amber-400 bg-amber-500/10 border-amber-500/20"
                                        : "text-sky-400 bg-sky-500/10 border-sky-500/20";

                                  const accName = accounts.find(
                                    (a) =>
                                      a.id ===
                                      (isIncome ||
                                      t.item.category === "fixed-expense" ||
                                      t.item.category === "subscription"
                                        ? t.item.accountId
                                        : t.item.fundingAccountId)
                                  )?.name || "";

                                  return (
                                    <div
                                      key={`${day.dateStr}-${t.item.id}-${tIdx}`}
                                      className="flex items-center justify-between p-2 rounded-xl bg-black/25 border border-white/5"
                                    >
                                      <div className="flex items-center gap-2.5">
                                        <span
                                          className={`w-1.5 h-1.5 rounded-full ${
                                            isIncome
                                              ? "bg-emerald-400"
                                              : isSavings
                                                ? "bg-cyan-400"
                                                : isLiability
                                                  ? "bg-amber-400"
                                                  : "bg-sky-400"
                                          }`}
                                        />
                                        <div>
                                          <div className="text-xs font-bold text-zinc-200">
                                            {t.item.title}
                                          </div>
                                          <div className="flex items-center gap-1.5 mt-0.5">
                                            <span
                                              className={`text-[9px] font-bold font-mono tracking-wider px-1.5 py-0.5 rounded border ${catColorClass}`}
                                            >
                                              {t.item.category.replace("-", " ")}
                                            </span>
                                            {accName && (
                                              <span className="text-[9px] text-zinc-500 font-mono">
                                                ({accName})
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      </div>

                                      <div className="text-right">
                                        <span
                                          className={`text-xs font-mono font-bold ${
                                            isIncome ? "text-emerald-400" : "text-sky-400"
                                          }`}
                                        >
                                          {isIncome ? "+" : "-"}$
                                          {Math.abs(t.amount).toLocaleString("en-US")}
                                        </span>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <div className="text-[10px] text-zinc-500 italic font-mono pl-4">
                                No scheduled transfers or transactions.
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {/* TRADITIONAL MONTH GRID VIEW */}
                  {forecastRange === "month" && (
                    <div className="flex flex-col gap-1.5 mt-2">
                      <div className="grid grid-cols-7 gap-1.5 text-center">
                        {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map(
                          (day) => (
                            <div
                              key={day}
                              className="text-xs font-mono tracking-wider text-zinc-300 font-bold py-1"
                            >
                              {day}
                            </div>
                          ),
                        )}
                      </div>

                      <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
                        {calendarCells.map((cell, idx) => {
                          if (cell.isPadding || !cell.date) {
                            return (
                              <div
                                key={`pad-${idx}`}
                                className="aspect-square bg-zinc-950/20 rounded-2xl border border-transparent opacity-10"
                              ></div>
                            );
                          }

                          const dForecast = cell.forecast;
                          const dayNum = cell.date.getDate();
                          const isSelected =
                            selectedDay &&
                            selectedDay.dateStr === dForecast?.dateStr;
                          const isLaunchDay =
                            dForecast?.dateStr === launchDateStr;
                          const balance = dForecast
                            ? (dashboardAccountFilter && dForecast.accountBalances
                              ? (dForecast.accountBalances[dashboardAccountFilter] ?? 0)
                              : dForecast.endingBalance)
                            : 0;

                          const hasIncome =
                            dForecast &&
                            dForecast.transactions.some(
                              (t) => t.item.category === "income",
                            );
                          const hasExpense =
                            dForecast &&
                            dForecast.transactions.some(
                              (t) =>
                                t.item.category === "fixed-expense" ||
                                t.item.category === "subscription",
                            );
                          const hasLiability =
                            dForecast &&
                            dForecast.transactions.some(
                              (t) => t.item.category === "liability",
                            );
                          const hasSavings =
                            dForecast &&
                            dForecast.transactions.some(
                              (t) => t.item.category === "savings",
                            );

                          return (
                            <button
                              key={`cell-${idx}`}
                              onClick={() =>
                                dForecast && setSelectedDay(dForecast)
                              }
                              className={`min-h-[60px] sm:aspect-square p-1.5 sm:p-2 flex flex-col justify-between text-left rounded-2xl transition-all duration-200 border ${
                                isSelected
                                  ? "bg-indigo-600/20 border-indigo-500 shadow-[0_0_12px_rgba(99,102,241,0.3)] scale-[1.02]"
                                  : isLaunchDay
                                    ? "bg-zinc-900 border-indigo-400/80"
                                    : "bg-zinc-900/50 border-white/10 hover:border-zinc-700 hover:bg-zinc-900/80"
                              }`}
                            >
                              <div className="flex items-center justify-between w-full">
                                <span
                                  className={`text-[11px] sm:text-xs font-mono font-bold ${isLaunchDay ? "text-indigo-400" : "text-zinc-200"}`}
                                >
                                  {dayNum}
                                </span>
                                {isLaunchDay && (
                                  <span className="text-[8px] font-mono font-bold bg-indigo-500/20 text-indigo-300 px-1 rounded border border-indigo-500/30">
                                    START
                                  </span>
                                )}
                                {dForecast && lowBalanceDatesMap.has(dForecast.dateStr) && (
                                  <span title="Balance Warning" className="shrink-0">
                                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                                  </span>
                                )}
                              </div>

                              {dForecast ? (
                                <div className="flex flex-col gap-0.5 mt-auto w-full">
                                  <span className="text-[10px] sm:text-xs font-mono font-bold tracking-tight text-white truncate">
                                    ${Math.round(balance).toLocaleString()}
                                  </span>

                                  <div className="flex gap-1 h-1.5 mt-1 overflow-hidden items-center">
                                    {hasIncome && (
                                      <span
                                        className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0"
                                        title="Income"
                                      ></span>
                                    )}
                                    {hasExpense && (
                                      <span
                                        className="w-1.5 h-1.5 rounded-full bg-sky-400 shrink-0"
                                        title="Expense"
                                      ></span>
                                    )}
                                    {hasLiability && (
                                      <span
                                        className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0"
                                        title="Liability"
                                      ></span>
                                    )}
                                    {hasSavings && (
                                      <span
                                        className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0"
                                        title="Savings"
                                      ></span>
                                    )}
                                  </div>
                                </div>
                              ) : (
                                <span className="text-[10px] text-zinc-500 italic font-mono mt-auto">
                                  Empty
                                </span>
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

                        const monthName = new Date(y, m, 1).toLocaleDateString(
                          "en-US",
                          { month: "long" },
                        );
                        const firstDay = new Date(y, m, 1);
                        const startOfWeek = firstDay.getDay();
                        const numDays = new Date(y, m + 1, 0).getDate();

                        const miniCells: {
                          date: Date | null;
                          forecast?: ForecastDay;
                        }[] = [];
                        for (let i = 0; i < startOfWeek; i++) {
                          miniCells.push({ date: null });
                        }
                        for (let dayNum = 1; dayNum <= numDays; dayNum++) {
                          const date = new Date(y, m, dayNum);
                          const targetStr = formatDateLocal(date);
                          const forecast = calendarForecastTimeline.find(
                            (d) => d.dateStr === targetStr,
                          );
                          miniCells.push({ date, forecast });
                        }

                        return (
                          <div
                            key={monthOffset}
                            className="bg-black/30 border border-white/5 rounded-2xl p-4 flex flex-col gap-3"
                          >
                            <h4 className="text-xs font-bold text-zinc-400 tracking-wide uppercase font-mono border-b border-white/5 pb-1.5 text-center">
                              {monthName} {y}
                            </h4>

                            <div className="grid grid-cols-7 gap-1 text-center">
                              {["S", "M", "T", "W", "T", "F", "S"].map(
                                (lbl, i) => (
                                  <div
                                    key={i}
                                    className="text-[8px] text-zinc-600 font-bold font-mono"
                                  >
                                    {lbl}
                                  </div>
                                ),
                              )}
                            </div>

                            <div className="grid grid-cols-7 gap-1">
                              {miniCells.map((cell, idx) => {
                                if (!cell.date) {
                                  return (
                                    <div
                                      key={`mc-pad-${idx}`}
                                      className="aspect-square opacity-0"
                                    ></div>
                                  );
                                }

                                const isSelected =
                                  selectedDay &&
                                  selectedDay.dateStr ===
                                    cell.forecast?.dateStr;
                                const balance = cell.forecast
                                  ? (dashboardAccountFilter && cell.forecast.accountBalances
                                    ? (cell.forecast.accountBalances[dashboardAccountFilter] ?? 0)
                                    : cell.forecast.endingBalance)
                                  : 0;
                                const dayNum = cell.date.getDate();

                                const hasIncome =
                                  cell.forecast &&
                                  cell.forecast.transactions.some(
                                    (t) => t.item.category === "income",
                                  );
                                const hasExpense =
                                  cell.forecast &&
                                  cell.forecast.transactions.some(
                                    (t) =>
                                      t.item.category === "fixed-expense" ||
                                      t.item.category === "subscription",
                                  );
                                const hasSavings =
                                  cell.forecast &&
                                  cell.forecast.transactions.some(
                                    (t) => t.item.category === "savings",
                                  );
                                const hasLiability =
                                  cell.forecast &&
                                  cell.forecast.transactions.some(
                                    (t) => t.item.category === "liability",
                                  );

                                return (
                                  <button
                                    key={`mc-cell-${idx}`}
                                    onClick={() =>
                                      cell.forecast &&
                                      setSelectedDay(cell.forecast)
                                    }
                                    className={`aspect-square p-0.5 rounded-[6px] text-center flex flex-col justify-between transition-all duration-150 border ${
                                      isSelected
                                        ? "bg-indigo-600/30 border-indigo-400"
                                        : "bg-zinc-900/40 border-transparent hover:border-zinc-700 hover:bg-zinc-900"
                                    }`}
                                  >
                                    <div className="flex items-center justify-between w-full px-0.5">
                                      <span className="text-[8px] font-semibold text-zinc-500 font-mono scale-[0.9] block leading-none">
                                        {dayNum}
                                      </span>
                                      {cell.forecast && lowBalanceDatesMap.has(cell.forecast.dateStr) && (
                                        <span title="Balance Warning" className="shrink-0">
                                          <AlertTriangle className="w-2.5 h-2.5 text-amber-400" />
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex gap-0.5 items-center justify-center h-0.5 mt-0.5 overflow-hidden">
                                      {hasIncome && (
                                        <span className="w-0.5 h-0.5 rounded-full bg-emerald-400"></span>
                                      )}
                                      {hasExpense && (
                                        <span className="w-0.5 h-0.5 rounded-full bg-sky-400"></span>
                                      )}
                                      {hasLiability && (
                                        <span className="w-0.5 h-0.5 rounded-full bg-amber-400"></span>
                                      )}
                                      {hasSavings && (
                                        <span className="w-0.5 h-0.5 rounded-full bg-cyan-400"></span>
                                      )}
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
              )}

                {/* PROJECTIONS VIEW */}
                {dashboardViewMode === "analytics" && (
                  <motion.div
                    key="analytics-view"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.2 }}
                    className="flex flex-col gap-6"
                  >
                    {/* Projections Overview Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      {/* Starting Balance */}
                      <div className="bg-zinc-900/40 border border-white/5 rounded-2xl p-4 flex flex-col justify-between">
                        <div>
                          <span className="text-[10px] font-bold font-mono tracking-wider text-zinc-400 uppercase">
                            Starting Balance
                          </span>
                          <h4 className="text-base sm:text-lg font-bold mt-1 text-zinc-200 font-mono">
                            ${analyticsSummary.startingBalance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </h4>
                        </div>
                      </div>

                      {/* Total Deposits */}
                      <div className="bg-zinc-900/40 border border-white/5 rounded-2xl p-4 flex flex-col justify-between">
                        <div>
                          <span className="text-[10px] font-bold font-mono tracking-wider text-zinc-400 uppercase">
                            Total Deposits
                          </span>
                          <h4 className="text-base sm:text-lg font-bold mt-1 text-emerald-400 font-mono">
                            +${analyticsSummary.income.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </h4>
                        </div>
                      </div>

                      {/* Total Payments */}
                      <div className="bg-zinc-900/40 border border-white/5 rounded-2xl p-4 flex flex-col justify-between">
                        <div>
                          <span className="text-[10px] font-bold font-mono tracking-wider text-zinc-400 uppercase">
                            Total Payments
                          </span>
                          <h4 className="text-base sm:text-lg font-bold mt-1 text-sky-400 font-mono">
                            -${analyticsSummary.payments.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </h4>
                        </div>
                      </div>

                      {/* Net Period Change */}
                      <div className="bg-zinc-900/40 border border-white/5 rounded-2xl p-4 flex flex-col justify-between">
                        <div>
                          <span className="text-[10px] font-bold font-mono tracking-wider text-zinc-400 uppercase">
                            Net Period Change
                          </span>
                          <h4 className={`text-base sm:text-lg font-bold mt-1 font-mono ${analyticsSummary.netChange >= 0 ? "text-emerald-400" : "text-amber-400"}`}>
                            {analyticsSummary.netChange >= 0 ? "+" : ""}
                            ${analyticsSummary.netChange.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </h4>
                        </div>
                      </div>

                      {/* Project Ending Balance */}
                      <div className="bg-gradient-to-br from-indigo-900/20 to-zinc-900/40 border border-indigo-500/20 rounded-2xl p-4 flex flex-col justify-between col-span-2 md:col-span-1">
                        <div>
                          <span className="text-[10px] font-bold font-mono tracking-wider text-indigo-300 uppercase">
                            Projected Ending
                          </span>
                          <h4 className="text-lg sm:text-xl font-bold mt-1 text-white font-mono">
                            ${analyticsSummary.endingBalance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </h4>
                        </div>
                      </div>
                    </div>

                    {/* Chart Visualizations in Bento Layout */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                      {/* Balance Trajectory Area Chart (8 Columns on desktop) */}
                      <div className="lg:col-span-8 bg-zinc-900/30 border border-white/10 rounded-[2rem] p-5 sm:p-6 flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 group/tooltip relative">
                            <h3 className="text-base font-bold text-white flex items-center gap-2">
                              <TrendingUp className="w-4.5 h-4.5 text-indigo-400" />
                              Balance
                            </h3>
                            <div className="relative flex items-center">
                              <Info className="w-3.5 h-3.5 text-zinc-500 hover:text-zinc-300 cursor-help transition-colors" />
                              <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover/tooltip:flex flex-col items-center z-20 w-64 pointer-events-none">
                                <div className="bg-zinc-950 border border-white/10 text-zinc-300 text-[11px] py-1.5 px-2.5 rounded-lg shadow-xl text-center leading-normal">
                                  Visual representation of account balance path over the chosen forecast period.
                                </div>
                                <div className="w-2 h-2 bg-zinc-950 border-r border-b border-white/10 rotate-45 -mt-1" />
                              </div>
                            </div>
                          </div>
                          
                          {/* Period Badge */}
                          <span className="text-[10px] font-mono font-bold uppercase bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1 rounded-lg text-indigo-300">
                            {forecastRange === "week" ? "7-Day Week" : forecastRange === "two-weeks" ? "14-Day Outlook" : forecastRange === "month" ? "30-Day Outlook" : "90-Day Quarter"}
                          </span>
                        </div>

                        {/* Chart Container */}
                        <div className="h-[280px] sm:h-[320px] w-full mt-2">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart
                              data={chartData}
                              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                            >
                              <defs>
                                <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" opacity={0.4} />
                              <XAxis
                                dataKey="dateFormatted"
                                stroke="#71717a"
                                fontSize={10}
                                tickLine={false}
                                axisLine={false}
                                dy={10}
                              />
                              <YAxis
                                stroke="#71717a"
                                fontSize={10}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(val) => `$${Math.round(val).toLocaleString()}`}
                                dx={-5}
                              />
                              <Tooltip
                                content={({ active, payload }) => {
                                  if (active && payload && payload.length) {
                                    const data = payload[0].payload;
                                    return (
                                      <div className="bg-zinc-950 border border-white/10 rounded-xl p-3 shadow-2xl flex flex-col gap-1.5 font-sans">
                                        <p className="text-[10px] font-bold text-zinc-400 font-mono">{data.dateFormatted}</p>
                                        <div className="flex items-center gap-2">
                                          <div className="w-2 h-2 rounded-full bg-indigo-400" />
                                          <p className="text-xs font-bold text-white font-mono">
                                            Balance: ${Math.round(data.Balance).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                                          </p>
                                        </div>
                                      </div>
                                    );
                                  }
                                  return null;
                                }}
                              />
                              <Area
                                type="monotone"
                                dataKey="Balance"
                                stroke="#818cf8"
                                strokeWidth={2.5}
                                fillOpacity={1}
                                fill="url(#colorBalance)"
                              />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      {/* Breakdown Side Column (4 Columns on desktop) */}
                      <div className="lg:col-span-4 bg-zinc-900/30 border border-white/10 rounded-[2rem] p-5 sm:p-6 flex flex-col justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-1.5 group/tooltip relative">
                            <h3 className="text-base font-bold text-white flex items-center gap-2">
                              <BarChart3 className="w-4.5 h-4.5 text-indigo-400" />
                              Income vs. Expenses
                            </h3>
                            <div className="relative flex items-center">
                              <Info className="w-3.5 h-3.5 text-zinc-500 hover:text-zinc-300 cursor-help transition-colors" />
                              <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover/tooltip:flex flex-col items-center z-20 w-64 pointer-events-none">
                                <div className="bg-zinc-950 border border-white/10 text-zinc-300 text-[11px] py-1.5 px-2.5 rounded-lg shadow-xl text-center leading-normal">
                                  Daily income vs. expense activity throughout this forecast period.
                                </div>
                                <div className="w-2 h-2 bg-zinc-950 border-r border-b border-white/10 rotate-45 -mt-1" />
                              </div>
                            </div>
                          </div>

                          {/* Bar Chart Container */}
                          <div className="h-[200px] w-full mt-4">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart
                                data={chartData.filter(d => d.Income > 0 || d.Expenses > 0)}
                                margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                              >
                                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" opacity={0.3} />
                                <XAxis
                                  dataKey="dateFormatted"
                                  stroke="#71717a"
                                  fontSize={9}
                                  tickLine={false}
                                  axisLine={false}
                                  dy={5}
                                />
                                <YAxis
                                  stroke="#71717a"
                                  fontSize={9}
                                  tickLine={false}
                                  axisLine={false}
                                  tickFormatter={(val) => `$${Math.round(val).toLocaleString()}`}
                                />
                                <Tooltip
                                  content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                      const data = payload[0].payload;
                                      return (
                                        <div className="bg-zinc-950 border border-white/10 rounded-xl p-3 shadow-2xl flex flex-col gap-1.5 font-sans">
                                          <p className="text-[10px] font-bold text-zinc-400 font-mono">{data.dateFormatted}</p>
                                          {data.Income > 0 && (
                                            <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-mono">
                                              <span>In:</span>
                                              <span className="font-bold">+${data.Income.toLocaleString()}</span>
                                            </div>
                                          )}
                                          {data.Expenses > 0 && (
                                            <div className="flex items-center gap-1.5 text-xs text-sky-400 font-mono">
                                              <span>Paid:</span>
                                              <span className="font-bold">-${data.Expenses.toLocaleString()}</span>
                                            </div>
                                          )}
                                        </div>
                                      );
                                    }
                                    return null;
                                  }}
                                />
                                <Bar dataKey="Income" fill="#34d399" radius={[3, 3, 0, 0]} />
                                <Bar dataKey="Expenses" fill="#38bdf8" radius={[3, 3, 0, 0]} />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </div>

                        {/* Summary Insight Statement */}
                        <div className="bg-black/40 border border-white/5 rounded-2xl p-4 mt-2">
                          <h4 className="text-xs font-bold text-zinc-300 flex items-center gap-1.5 mb-1">
                            <Info className="w-3.5 h-3.5 text-indigo-400" />
                            Outlook Assessment
                          </h4>
                          <p className="text-[11px] text-zinc-400 leading-relaxed">
                            {analyticsSummary.netChange >= 0 ? (
                              <span>
                                In this {forecastRange === "quarter" ? "90-day quarter" : " outlook timeframe"}, liquid cash is projected to increase by{" "}
                                <strong className="text-emerald-400">${analyticsSummary.netChange.toLocaleString("en-US", { maximumFractionDigits: 0 })}</strong>. 
                                Excellent net-positive trajectory!
                              </span>
                            ) : (
                              <span>
                                In this {forecastRange === "quarter" ? "90-day quarter" : " outlook timeframe"}, liquid cash is projected to draw down by{" "}
                                <strong className="text-amber-400">${Math.abs(analyticsSummary.netChange).toLocaleString("en-US", { maximumFractionDigits: 0 })}</strong>. 
                                Ensure you have sufficient cushion to cover expenses.
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Timeline of active transaction items impacting this view */}
                    <div className="bg-zinc-900/30 border border-white/10 rounded-[2rem] p-5 sm:p-6 flex flex-col gap-4">
                      <div className="flex items-center gap-1.5 group/tooltip relative">
                        <h3 className="text-base font-bold text-white flex items-center gap-2">
                          <Clock className="w-4.5 h-4.5 text-indigo-400" />
                          Actively
                        </h3>
                        <div className="relative flex items-center">
                          <Info className="w-3.5 h-3.5 text-zinc-500 hover:text-zinc-300 cursor-help transition-colors" />
                          <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover/tooltip:flex flex-col items-center z-20 w-64 pointer-events-none">
                            <div className="bg-zinc-950 border border-white/10 text-zinc-300 text-[11px] py-1.5 px-2.5 rounded-lg shadow-xl text-center leading-normal">
                              Specific scheduled items affecting this {dashboardAccountFilter ? "selected account" : "net cash reserve"} during the selected forecast period.
                            </div>
                            <div className="w-2 h-2 bg-zinc-950 border-r border-b border-white/10 rotate-45 -mt-1" />
                          </div>
                        </div>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs font-sans">
                          <thead>
                            <tr className="border-b border-white/5 text-zinc-400 font-mono text-[10px] uppercase tracking-wider">
                              <th className="py-3 px-4">Item Name</th>
                              <th className="py-3 px-4">Category</th>
                              <th className="py-3 px-4">Frequency</th>
                              <th className="py-3 px-4 text-right">Amount</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5">
                            {transactions
                              .filter((tx) => {
                                return !dashboardAccountFilter ||
                                  tx.accountId === dashboardAccountFilter ||
                                  tx.fundingAccountId === dashboardAccountFilter ||
                                  tx.targetAccountId === dashboardAccountFilter;
                              })
                              .map((tx) => {
                                const isIncome = tx.category === "income";
                                const isSavings = tx.category === "savings";
                                const isLiability = tx.category === "liability";
                                return (
                                  <tr key={tx.id} className="hover:bg-white/5 transition-colors">
                                    <td className="py-3 px-4 font-semibold text-zinc-200">
                                      {tx.title}
                                    </td>
                                    <td className="py-3 px-4">
                                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-bold capitalize ${
                                        isIncome
                                          ? "bg-emerald-400/10 text-emerald-400 border border-emerald-400/20"
                                          : isSavings
                                            ? "bg-cyan-400/10 text-cyan-400 border border-cyan-400/20"
                                            : isLiability
                                              ? "bg-amber-400/10 text-amber-400 border border-amber-400/20"
                                              : "bg-sky-400/10 text-sky-400 border border-sky-400/20"
                                      }`}>
                                        {tx.category}
                                      </span>
                                    </td>
                                    <td className="py-3 px-4 font-mono text-zinc-400 capitalize">
                                      {tx.frequency}
                                    </td>
                                    <td className={`py-3 px-4 text-right font-mono font-bold ${isIncome ? "text-emerald-400" : "text-sky-400"}`}>
                                      {isIncome ? "+" : "-"}${Math.abs(tx.amount).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                                    </td>
                                  </tr>
                                );
                              })}
                            {transactions.filter((tx) => {
                              return !dashboardAccountFilter ||
                                tx.accountId === dashboardAccountFilter ||
                                tx.fundingAccountId === dashboardAccountFilter ||
                                tx.targetAccountId === dashboardAccountFilter;
                            }).length === 0 && (
                              <tr>
                                <td colSpan={4} className="py-8 text-center text-zinc-500 font-mono text-xs">
                                  No transaction items scheduled for this account filter.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </motion.div>
                )}

              </motion.div>
            )}

            {/* TAB 1.5: ACCOUNTS MANAGER SCREEN */}
            {activeTab === "accounts" && (
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
                      <span className="text-xs font-bold text-zinc-400 font-mono">
                        Net Starting Assets:
                      </span>
                      <span
                        className={`text-sm font-bold font-mono ${initialBalance >= 0 ? "text-emerald-400" : "text-amber-400"}`}
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
                        setAccFormName("");
                        setAccFormType("checking");
                        setAccFormCustomType("");
                        setAccFormBalance("");
                        setAccFormStartDate("");
                        setAccFormError(null);
                      }}
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md font-semibold"
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
                      <p className="text-sm font-bold text-zinc-300">
                        No Accounts yet
                      </p>
                      <p className="text-xs text-zinc-500 max-w-xs mt-1">
                        Add a checking or savings account to establish your asset bases and starting projection balances.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setIsAddingAccount(true);
                          setEditingAccountId(null);
                          setAccFormName("");
                          setAccFormType("checking");
                          setAccFormCustomType("");
                          setAccFormBalance("");
                          setAccFormStartDate("");
                          setAccFormError(null);
                        }}
                        className="mt-4 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md font-semibold"
                      >
                        <Plus className="w-4 h-4" />
                        Create First Account
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                      {accounts.map((acc) => {
                        // Check if this is a credit card and find its minimum payment liability
                        const linkedLiability = transactions.find(
                          (t) =>
                            t.category === "liability" &&
                            t.targetAccountId === acc.id,
                        );

                        return (
                          <div
                            key={acc.id}
                            className="bg-zinc-900/40 border border-white/10 rounded-2xl p-4.5 flex flex-col justify-between hover:border-indigo-500/40 transition-all group animate-fade-in"
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="text-sm font-bold text-white">
                                  {acc.name}
                                </h4>
                                <span
                                  className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-md inline-block mt-1 ${
                                    acc.type === "credit-card"
                                      ? "bg-amber-500/10 text-amber-400 border border-amber-500/15"
                                      : acc.type === "savings"
                                        ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/15"
                                        : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/15"
                                  }`}
                                >
                                  {acc.type === "other"
                                    ? acc.customType || "Other"
                                    : acc.type}
                                </span>
                              </div>
                              <span
                                className={`text-base font-bold font-mono ${acc.type === "credit-card" ? "text-amber-400" : "text-emerald-400"}`}
                              >
                                {acc.type === "credit-card" ? "-" : ""}$
                                {acc.balance.toLocaleString("en-US", {
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

                            {/* Additional info block */}
                            {acc.type === "credit-card" && (
                              <div className="mt-3.5 pt-3.5 border-t border-white/5">
                                {linkedLiability ? (
                                  <div className="flex justify-between items-center text-[10px] text-zinc-400">
                                    <span>Scheduled Payment:</span>
                                    <span className="font-mono font-bold text-white">
                                      ${linkedLiability.amount}/mo
                                    </span>
                                  </div>
                                ) : (
                                  <div className="p-2 bg-amber-500/5 border border-amber-500/10 rounded-xl flex flex-col gap-1">
                                    <span className="text-[10px] text-amber-400 font-bold">
                                      Needs Minimum Payment Setup
                                    </span>
                                    <span className="text-[9px] text-zinc-400">
                                      No scheduled payment found in liabilities. Add one to keep your forecast precise.
                                    </span>
                                  </div>
                                )}
                              </div>
                            )}

                            <div className="flex gap-2 justify-end mt-4 pt-3.5 border-t border-white/5 opacity-80 group-hover:opacity-100 transition-opacity">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingAccountId(acc.id);
                                  setAccFormName(acc.name);
                                  setAccFormType(acc.type);
                                  setAccFormCustomType(acc.customType || "");
                                  setAccFormBalance(String(acc.balance));
                                  setAccFormStartDate(acc.startDate || "");
                                  setAccFormError(null);
                                }}
                                className="text-xs font-semibold px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-900 text-zinc-200 hover:text-white rounded-lg transition-all border border-white/5 shadow-sm"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  const otherAccs = accounts.filter(a => a.id !== acc.id);
                                  setDeletingAccount(acc);
                                  setDeleteAccountTransferTargetId(otherAccs.length > 0 ? otherAccs[0].id : "");
                                  setDeleteActionChoice(otherAccs.length > 0 ? "transfer" : "archive");
                                }}
                                className="text-xs font-semibold px-2.5 py-1.5 bg-red-500/10 hover:bg-red-500/20 active:bg-red-500/30 text-red-400 hover:text-red-300 rounded-lg transition-all border border-red-500/20 shadow-sm"
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
                    {categorizedTransactions.income.length > 0 && (
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20 whitespace-nowrap">
                          Base: +$
                          {categorizedTransactions.income
                            .reduce(
                              (acc, c) => acc + getMonthlyEquivalent(c),
                              0,
                            )
                            .toLocaleString("en-US", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          /mo
                        </span>
                        <span className="text-xs font-mono font-bold text-emerald-300 bg-emerald-500/5 px-2.5 py-1 rounded-lg border border-emerald-500/15 whitespace-nowrap">
                          Qtr: +$
                          {categorizedTransactions.income
                            .reduce(
                              (acc, c) => acc + getQuarterlyEquivalent(c),
                              0,
                            )
                            .toLocaleString("en-US", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          /qtr
                        </span>
                      </div>
                    )}
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
                    <Coins className="w-12 h-12 text-zinc-600 mb-3" />
                    <p className="text-sm font-bold text-zinc-300">
                      No Recurring Income Registered
                    </p>
                    <p className="text-xs text-zinc-300 max-w-xs mt-1">
                      Every dynamic forecast needs at least one regular paycheck
                      payload to build an available spend margin.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {categorizedTransactions.income.map((tx) => (
                      <div
                        key={tx.id}
                        onClick={() => setSelectedDetailTransaction(tx)}
                        className="bg-zinc-900/40 border border-white/5 hover:border-zinc-500 hover:bg-zinc-900/60 active:scale-[0.99] transition-all rounded-2xl p-5 flex flex-col justify-between cursor-pointer group"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20 group-hover:bg-emerald-500/20 transition-colors">
                              <Coins className="w-5 h-5" />
                            </div>
                            <div>
                              <h4 className="text-base font-bold text-white group-hover:text-emerald-300 transition-colors">
                                {tx.title}
                              </h4>
                              <span className="text-xs font-mono font-bold text-zinc-300 uppercase bg-black/60 px-2.5 py-0.5 rounded-lg border border-white/10 inline-block mt-1">
                                {tx.frequency}
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-base font-mono font-bold text-emerald-400 block">
                              +$
                              {tx.amount.toLocaleString("en-US", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </span>
                            <span className="text-[10px] font-mono font-semibold text-zinc-500 block mt-0.5">
                              {getFrequencySubtext(tx)}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/5">
                          <span className="text-[10px] font-semibold text-zinc-500 group-hover:text-zinc-300 transition-colors flex items-center gap-1">
                            <Info className="w-3.5 h-3.5" />
                            <span>Click to view details &amp; manage</span>
                          </span>
                          <span className="text-[10px] font-mono text-zinc-500">
                            Starts {tx.startDate}
                          </span>
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
                      <TrendingDown className="w-6 h-6 text-sky-400" />
                      Expenses & Savings
                    </h2>
                    {(categorizedTransactions.fixedExpenses.length > 0 || categorizedTransactions.subscriptions.length > 0) && (
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        <span className="text-xs font-mono font-bold text-sky-400 bg-sky-500/10 px-2.5 py-1 rounded-lg border border-sky-500/20 whitespace-nowrap">
                          Base: -$
                          {(
                            categorizedTransactions.fixedExpenses.reduce((acc, c) => acc + getMonthlyEquivalent(c), 0) +
                            categorizedTransactions.subscriptions.reduce((acc, c) => acc + getMonthlyEquivalent(c), 0)
                          ).toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                          /mo
                        </span>
                        <span className="text-xs font-mono font-bold text-sky-300 bg-sky-500/5 px-2.5 py-1 rounded-lg border border-sky-500/15 whitespace-nowrap">
                          Qtr: -$
                          {(
                            categorizedTransactions.fixedExpenses.reduce((acc, c) => acc + getQuarterlyEquivalent(c), 0) +
                            categorizedTransactions.subscriptions.reduce((acc, c) => acc + getQuarterlyEquivalent(c), 0)
                          ).toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                          /qtr
                        </span>
                      </div>
                    )}
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
                      <Plus className="w-4 h-4 text-sky-400" />
                      <span>Add Expense</span>
                    </button>
                    <button
                      onClick={() => {
                        setFormCategory("savings");
                        setFormStartDate(launchDateStr);
                        setIsAddingTransaction(true);
                      }}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-500/30 text-cyan-200 font-bold text-xs transition-all shadow-sm"
                    >
                      <Plus className="w-4 h-4 text-cyan-400" />
                      <span>Add Savings</span>
                    </button>
                  </div>
                </div>

                {/* Sub tabs filtering for Expenses/Savings */}
                <div className="flex gap-2 p-1 bg-zinc-900/50 border border-white/10 rounded-xl self-start flex-wrap">
                  {(["all", "fixed", "subscriptions", "savings"] as const).map(
                    (sub) => (
                      <button
                        key={sub}
                        onClick={() => setExpenseSubTab(sub)}
                        className={`text-xs font-mono font-bold px-3.5 py-1.5 rounded-lg transition-all capitalize ${
                          expenseSubTab === sub
                            ? "bg-zinc-800 text-white border border-white/10 shadow-sm"
                            : "text-zinc-400 hover:text-white"
                        }`}
                      >
                        {sub === "all"
                          ? "All Items"
                          : sub === "fixed"
                            ? "Fixed Expenses"
                            : sub === "subscriptions"
                              ? "Subscriptions"
                              : "Savings"}
                      </button>
                    ),
                  )}
                </div>

                {/* Grid lists of Expenses */}
                <div className="flex flex-col gap-6">
                  {/* Fixed Expenses Section */}
                  {(expenseSubTab === "all" || expenseSubTab === "fixed") && (
                    <div className="flex flex-col gap-3">
                      <h3 className="text-xs font-bold tracking-wider text-zinc-300 uppercase font-mono px-1">
                        Fixed Expenses
                      </h3>
                      {categorizedTransactions.fixedExpenses.length === 0 ? (
                        <div className="p-8 bg-zinc-900/20 border border-dashed border-white/10 rounded-2xl text-center text-zinc-400 text-xs font-medium">
                          No fixed bills, rent, or scheduled payments
                          registered.
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {categorizedTransactions.fixedExpenses.map((tx) => (
                            <div
                              key={tx.id}
                              onClick={() => setSelectedDetailTransaction(tx)}
                              className="bg-zinc-900/40 border border-white/5 hover:border-zinc-500 hover:bg-zinc-900/60 active:scale-[0.99] transition-all rounded-2xl p-4.5 flex flex-col justify-between cursor-pointer group"
                            >
                              <div className="flex items-start justify-between">
                                <div>
                                  <h4 className="text-base font-bold text-white group-hover:text-sky-300 transition-colors">
                                    {tx.title}
                                  </h4>
                                  <span className="text-xs font-mono font-bold text-zinc-300 uppercase bg-black/60 px-2.5 py-0.5 rounded-lg border border-white/10 inline-block mt-1">
                                    {tx.frequency}
                                  </span>
                                </div>
                                <div className="text-right">
                                  <span className="text-base font-mono font-bold text-sky-400 block">
                                    -$
                                    {tx.amount.toLocaleString("en-US", {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    })}
                                  </span>
                                  <span className="text-[10px] font-mono font-semibold text-zinc-500 block mt-0.5">
                                    {getFrequencySubtext(tx)}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/5">
                                <span className="text-[10px] font-semibold text-zinc-500 group-hover:text-zinc-300 transition-colors flex items-center gap-1">
                                  <Info className="w-3.5 h-3.5" />
                                  <span>Click to view details</span>
                                </span>
                                <span className="text-[10px] font-mono text-zinc-500">
                                  Starts {tx.startDate}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Subscriptions Section */}
                  {(expenseSubTab === "all" ||
                    expenseSubTab === "subscriptions") && (
                    <div className="flex flex-col gap-3">
                      <h3 className="text-xs font-bold tracking-wider text-zinc-300 uppercase font-mono px-1">
                        Digital Subscriptions
                      </h3>
                      {categorizedTransactions.subscriptions.length === 0 ? (
                        <div className="p-8 bg-zinc-900/20 border border-dashed border-white/10 rounded-2xl text-center text-zinc-400 text-xs font-medium">
                          No recurring SaaS services, media, or tech plans
                          logged.
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {categorizedTransactions.subscriptions.map((tx) => (
                            <div
                              key={tx.id}
                              onClick={() => setSelectedDetailTransaction(tx)}
                              className="bg-zinc-900/40 border border-white/5 hover:border-zinc-500 hover:bg-zinc-900/60 active:scale-[0.99] transition-all rounded-2xl p-4.5 flex flex-col justify-between cursor-pointer group"
                            >
                              <div className="flex items-start justify-between">
                                <div>
                                  <h4 className="text-base font-bold text-white group-hover:text-violet-300 transition-colors">
                                    {tx.title}
                                  </h4>
                                  <span className="text-xs font-mono font-bold text-zinc-300 uppercase bg-black/60 px-2.5 py-0.5 rounded-lg border border-white/10 inline-block mt-1">
                                    {tx.frequency}
                                  </span>
                                </div>
                                <div className="text-right">
                                  <span className="text-base font-mono font-bold text-violet-400 block">
                                    -$
                                    {tx.amount.toLocaleString("en-US", {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    })}
                                  </span>
                                  <span className="text-[10px] font-mono font-semibold text-zinc-500 block mt-0.5">
                                    {getFrequencySubtext(tx)}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/5">
                                <span className="text-[10px] font-semibold text-zinc-500 group-hover:text-zinc-300 transition-colors flex items-center gap-1">
                                  <Info className="w-3.5 h-3.5" />
                                  <span>Click to view details</span>
                                </span>
                                <span className="text-[10px] font-mono text-zinc-500">
                                  Starts {tx.startDate}
                                </span>
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
                      <h3 className="text-xs font-bold tracking-wider text-zinc-300 uppercase font-mono px-1">
                        Automated Savings Plans
                      </h3>
                      {categorizedTransactions.savings.length === 0 ? (
                        <div className="p-8 bg-zinc-900/20 border border-dashed border-white/10 rounded-2xl text-center text-zinc-400 text-xs font-medium">
                          No recurring deposits, safety reservoir plans, or
                          savings plans.
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {categorizedTransactions.savings.map((tx) => (
                            <div
                              key={tx.id}
                              onClick={() => setSelectedDetailTransaction(tx)}
                              className="bg-zinc-900/40 border border-white/5 hover:border-zinc-500 hover:bg-zinc-900/60 active:scale-[0.99] transition-all rounded-2xl p-4.5 flex flex-col justify-between cursor-pointer group"
                            >
                              <div className="flex items-start justify-between">
                                <div>
                                  <h4 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors">
                                    {tx.title}
                                  </h4>
                                  <span className="text-xs font-mono font-bold text-zinc-300 uppercase bg-black/60 px-2.5 py-0.5 rounded-lg border border-white/10 inline-block mt-1">
                                    {tx.frequency}
                                  </span>
                                </div>
                                <div className="text-right">
                                  <span className="text-base font-mono font-bold text-cyan-400 block">
                                    +$
                                    {tx.amount.toLocaleString("en-US", {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    })}
                                  </span>
                                  <span className="text-[10px] font-mono font-semibold text-zinc-500 block mt-0.5">
                                    {getFrequencySubtext(tx)}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/5">
                                <span className="text-[10px] font-semibold text-zinc-500 group-hover:text-zinc-300 transition-colors flex items-center gap-1">
                                  <Info className="w-3.5 h-3.5" />
                                  <span>Click to view details</span>
                                </span>
                                <span className="text-[10px] font-mono text-zinc-500">
                                  Starts {tx.startDate}
                                </span>
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
                {/* Header & Main Stats Bar */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                      <Clock className="w-6 h-6 text-amber-400" />
                      Liabilities
                    </h2>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5">
                    <button
                      onClick={() => setIsPayoffPlannerOpen(true)}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500/20 to-amber-600/20 border border-amber-500/40 text-amber-300 font-bold text-xs hover:from-amber-500/30 hover:to-amber-600/30 transition-all shadow-md shadow-amber-950/30"
                    >
                      <Zap className="w-4 h-4 text-amber-400" />
                      <span>Payoff Strategy Planner</span>
                    </button>

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
                </div>

                {/* Aggregated Liabilities Summary Ribbon */}
                {categorizedTransactions.liabilities.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-zinc-900/60 border border-white/10 rounded-2xl">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
                        <DollarSign className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-[10px] font-mono text-zinc-400 uppercase">Total Amount Owed</div>
                        <div className="text-base font-bold font-mono text-white">
                          ${categorizedTransactions.liabilities
                            .reduce((acc, t) => acc + (t.currentBalance || 0), 0)
                            .toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
                        <CalendarIcon className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-[10px] font-mono text-zinc-400 uppercase">Monthly Payments</div>
                        <div className="text-base font-bold font-mono text-amber-400">
                          ${categorizedTransactions.liabilities
                            .reduce((acc, c) => acc + getMonthlyEquivalent(c), 0)
                            .toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          <span className="text-xs text-zinc-400 font-normal"> /mo</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
                        <Percent className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-[10px] font-mono text-zinc-400 uppercase">Avg. Interest Rate</div>
                        <div className="text-base font-bold font-mono text-zinc-200">
                          {(() => {
                            const activeLias = categorizedTransactions.liabilities.filter((t) => (t.currentBalance || 0) > 0);
                            if (activeLias.length === 0) return "0.0%";
                            const totalBal = activeLias.reduce((acc, t) => acc + (t.currentBalance || 0), 0);
                            if (totalBal === 0) return "0.0%";
                            const weightedApr = activeLias.reduce((acc, t) => acc + (t.currentBalance || 0) * (t.interestRate || 0), 0) / totalBal;
                            return `${weightedApr.toFixed(1)}% APR`;
                          })()}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Liability Cards Listing */}
                {categorizedTransactions.liabilities.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 bg-zinc-900/20 border border-dashed border-white/10 rounded-3xl text-center">
                    <Clock className="w-12 h-12 text-zinc-500 mb-3" />
                    <p className="text-sm font-bold text-white">
                      No Recurring Liabilities Registered
                    </p>
                    <p className="text-xs text-zinc-300 max-w-xs mt-1">
                      Track credit cards, auto loans, mortgages, or personal liabilities with interest accrual and payoff timelines.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {categorizedTransactions.liabilities.map((tx) => {
                      const details = calculatePayoffDetails(tx);
                      const bal = tx.currentBalance !== undefined ? tx.currentBalance : 0;
                      const limit = tx.creditLimit || 0;
                      const utilization = limit > 0 ? Math.round((bal / limit) * 100) : 0;
                      const isPaidOff = bal === 0;

                      return (
                        <div
                          key={tx.id}
                          onClick={() => setSelectedDetailTransaction(tx)}
                          className={`bg-zinc-900/40 border hover:border-zinc-500 hover:bg-zinc-900/60 active:scale-[0.99] transition-all rounded-2xl p-5 flex flex-col justify-between cursor-pointer group ${
                            isPaidOff
                              ? "border-emerald-500/30 bg-emerald-950/5 hover:border-emerald-500/50"
                              : "border-white/5"
                          }`}
                        >
                          <div>
                            {/* Card Header: Type Badge & Title */}
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-3">
                                <div className={`p-2.5 rounded-xl border ${
                                  isPaidOff
                                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                    : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                                }`}>
                                  {tx.liabilityType === "credit_card" ? (
                                    <CreditCard className="w-5 h-5" />
                                  ) : (
                                    <Clock className="w-5 h-5" />
                                  )}
                                </div>
                                <div>
                                  <h4 className="text-base font-bold text-white group-hover:text-amber-300 transition-colors">
                                    {tx.title}
                                  </h4>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-[10px] font-mono font-semibold text-zinc-300 uppercase bg-black/60 px-2 py-0.5 rounded border border-white/10">
                                      {tx.liabilityType === "credit_card"
                                        ? "Credit Card"
                                        : tx.liabilityType === "revolving_loc"
                                        ? "Line of Credit"
                                        : tx.liabilityType === "auto_loan"
                                        ? "Auto Loan"
                                        : tx.liabilityType === "mortgage"
                                        ? "Mortgage"
                                        : tx.liabilityType === "personal_loan"
                                        ? "Personal Loan"
                                        : tx.liabilityType === "student_loan"
                                        ? "Student Loan"
                                        : "Liability"}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Payoff Status Badge */}
                              {isPaidOff ? (
                                <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 rounded-lg flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3" />
                                  PAID OFF
                                </span>
                              ) : details.monthsToPayoff !== null ? (
                                <span className="text-[10px] font-mono font-bold text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-lg">
                                  Payoff: {details.payoffDateStr}
                                </span>
                              ) : (
                                <span className="text-[10px] font-mono font-bold text-orange-400 bg-orange-500/15 border border-orange-500/30 px-2 py-0.5 rounded-lg">
                                  Neg. Amort.
                                </span>
                              )}
                            </div>

                            {/* Core Financial Numbers Box */}
                            <div className="grid grid-cols-2 gap-3 mt-4 p-3 bg-black/30 rounded-xl border border-white/5">
                              <div>
                                <div className="text-[9px] font-mono text-zinc-500 uppercase">Current Owed</div>
                                <div className="text-base font-bold font-mono text-white">
                                  ${bal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </div>
                              </div>

                              <div>
                                <div className="text-[9px] font-mono text-zinc-500 uppercase">Monthly Payment</div>
                                <div className="text-base font-bold font-mono text-amber-400">
                                  ${tx.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Footer action trigger hint */}
                          <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/5">
                            <span className="text-[10px] font-semibold text-zinc-500 group-hover:text-zinc-300 transition-colors flex items-center gap-1">
                              <Info className="w-3.5 h-3.5" />
                              <span>Click to analyze &amp; manage</span>
                            </span>
                            <span className="text-[10px] font-mono text-zinc-500">
                              Starts {tx.startDate}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        )}
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
                    : "border-sky-500/30"
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
                      onClick={resetForm}
                      className="p-2 hover:bg-zinc-800 rounded-xl text-zinc-400 hover:text-white transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Step Progress Bar */}
                  <div className="px-6 pt-3 pb-3 bg-black/40 border-b border-white/5 flex items-center gap-2">
                    <div
                      className={`flex-1 h-1.5 rounded-full transition-all ${wizardStep >= 1 ? "bg-emerald-500" : "bg-zinc-800"}`}
                    />
                    <div
                      className={`flex-1 h-1.5 rounded-full transition-all ${wizardStep >= 2 ? "bg-emerald-500" : "bg-zinc-800"}`}
                    />
                    <div
                      className={`flex-1 h-1.5 rounded-full transition-all ${wizardStep >= 3 ? "bg-emerald-500" : "bg-zinc-800"}`}
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
                          className="text-amber-400 font-bold ml-2"
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
                            placeholder="e.g. Primary Salary, Client Retainer, Side Gig"
                            value={formTitle}
                            onChange={(e) => {
                              setFormTitle(e.target.value);
                              if (wizardError) setWizardError(null);
                            }}
                            className="block w-full px-3.5 py-2.5 text-xs bg-black/40 border border-white/10 rounded-xl focus:outline-none focus:border-emerald-500 text-zinc-100 transition-colors"
                          />
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
                                setWizardError(
                                  "Please enter an Income Source Name.",
                                );
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
                            <option value="biweekly">
                              Bi-Weekly (Every 2 Weeks / Payday)
                            </option>
                            <option value="semimonthly">
                              Semi-Monthly (Specific Days e.g. 1st & 15th)
                            </option>
                            <option value="monthly">Monthly Salary</option>
                            <option value="weekly">
                              Weekly Direct Deposit
                            </option>
                            <option value="quarterly">
                              Quarterly Dividend / Bonus
                            </option>
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
                                setWizardError(
                                  "Please enter a valid amount greater than $0.",
                                );
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
                      <form
                        onSubmit={handleSaveTransaction}
                        className="space-y-4"
                      >
                        <div>
                          <label className="block text-[10px] font-mono tracking-widest text-zinc-400 uppercase mb-1.5">
                            Deposit to Account
                          </label>
                          <select
                            value={formAccountId}
                            onChange={(e) => setFormAccountId(e.target.value)}
                            className="block w-full px-3.5 py-2.5 text-xs bg-black/40 border border-white/10 rounded-xl focus:outline-none focus:border-emerald-500 text-zinc-100 transition-colors cursor-pointer"
                          >
                            <option value="">
                              Select Asset Account (Default checking)
                            </option>
                            {accounts
                              .filter((a) => a.type !== "credit-card")
                              .map((acc) => (
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
                          <div className="text-[10px] font-mono uppercase text-emerald-400 font-bold tracking-wider">
                            Income Summary Review
                          </div>
                          <div className="flex justify-between text-zinc-300">
                            <span>Source:</span>
                            <span className="font-semibold text-white">
                              {formTitle}
                            </span>
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
                              {accounts.find((a) => a.id === formAccountId)
                                ?.name || "Default checking"}
                            </span>
                          </div>
                          <div className="flex justify-between text-zinc-300">
                            <span>First Deposit:</span>
                            <span className="font-semibold text-white font-mono">
                              {formStartDate}
                            </span>
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
                            <span>
                              {editingId
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

              {/* ==================== 2. SEPARATE EXPENSES WIZARD ==================== */}
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
                          {editingId
                            ? "Edit Expense Wizard"
                            : "Expenses Wizard"}
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
                      onClick={resetForm}
                      className="p-2 hover:bg-zinc-800 rounded-xl text-zinc-400 hover:text-white transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Step Progress Bar */}
                  <div className="px-6 pt-3 pb-3 bg-black/40 border-b border-white/5 flex items-center gap-2">
                    <div
                      className={`flex-1 h-1.5 rounded-full transition-all ${wizardStep >= 1 ? "bg-sky-500" : "bg-zinc-800"}`}
                    />
                    <div
                      className={`flex-1 h-1.5 rounded-full transition-all ${wizardStep >= 2 ? "bg-sky-500" : "bg-zinc-800"}`}
                    />
                    <div
                      className={`flex-1 h-1.5 rounded-full transition-all ${wizardStep >= 3 ? "bg-sky-500" : "bg-zinc-800"}`}
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
                          className="text-amber-400 font-bold ml-2"
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
                              className={`text-[10px] font-mono font-bold py-2 rounded-lg transition-all text-center ${
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
                              className={`text-[10px] font-mono font-bold py-2 rounded-lg transition-all text-center ${
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
                              className={`text-[10px] font-mono font-bold py-2 rounded-lg transition-all text-center ${
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
                            placeholder={
                              formCategory === "fixed-expense"
                                ? "e.g. Rent, Electricity, Grocery Budget"
                                : formCategory === "subscription"
                                  ? "e.g. Netflix, Spotify, iCloud Storage"
                                  : "e.g. Liquid Reserve, High-Yield Savings"
                            }
                            value={formTitle}
                            onChange={(e) => {
                              setFormTitle(e.target.value);
                              if (wizardError) setWizardError(null);
                            }}
                            className="block w-full px-3.5 py-2.5 text-xs bg-black/40 border border-white/10 rounded-xl focus:outline-none focus:border-sky-500 text-zinc-100 transition-colors"
                          />
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
                            className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs transition-colors shadow-lg shadow-sky-950/50 flex items-center gap-1.5"
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
                                setWizardError(
                                  "Please enter a valid amount greater than $0.",
                                );
                                return;
                              }
                              setWizardError(null);
                              setWizardStep(3);
                            }}
                            className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs transition-colors shadow-lg shadow-sky-950/50 flex items-center gap-1.5"
                          >
                            <span>Next: Due Date & Review</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Step 3: Due Date & Final Review */}
                    {wizardStep === 3 && (
                      <form
                        onSubmit={handleSaveTransaction}
                        className="space-y-4"
                      >
                        {formCategory === "savings" ? (
                          <>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <label className="block text-[10px] font-mono tracking-widest text-zinc-400 uppercase mb-1.5">
                                  From
                                </label>
                                <select
                                  value={formFundingAccountId}
                                  onChange={(e) =>
                                    setFormFundingAccountId(e.target.value)
                                  }
                                  className="block w-full px-3.5 py-2.5 text-xs bg-black/40 border border-white/10 rounded-xl focus:outline-none focus:border-cyan-500 text-zinc-100 transition-colors cursor-pointer"
                                >
                                  <option value="">
                                    Select Account (Default checking)
                                  </option>
                                  {accounts
                                    .filter((a) => a.type !== "credit-card")
                                    .map((acc) => (
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

                              <div>
                                <label className="block text-[10px] font-mono tracking-widest text-zinc-400 uppercase mb-1.5">
                                  To
                                </label>
                                <select
                                  value={formTargetAccountId}
                                  onChange={(e) =>
                                    setFormTargetAccountId(e.target.value)
                                  }
                                  className="block w-full px-3.5 py-2.5 text-xs bg-black/40 border border-white/10 rounded-xl focus:outline-none focus:border-cyan-500 text-zinc-100 transition-colors cursor-pointer"
                                >
                                  <option value="">
                                    Select Account (Default savings)
                                  </option>
                                  {accounts
                                    .filter((a) => a.type !== "credit-card")
                                    .map((acc) => (
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
                            </div>
                          </>
                        ) : (
                          <div>
                            <label className="block text-[10px] font-mono tracking-widest text-zinc-400 uppercase mb-1.5">
                              Paid From Account
                            </label>
                            <select
                              value={formFundingAccountId}
                              onChange={(e) =>
                                setFormFundingAccountId(e.target.value)
                              }
                              className="block w-full px-3.5 py-2.5 text-xs bg-black/40 border border-white/10 rounded-xl focus:outline-none focus:border-sky-500 text-zinc-100 transition-colors cursor-pointer"
                            >
                              <option value="">
                                Select Account (Default checking)
                              </option>
                              {accounts.map((acc) => (
                                <option key={acc.id} value={acc.id}>
                                  {acc.name} (
                                  {acc.type === "credit-card"
                                    ? "Credit Card"
                                    : acc.type === "other"
                                      ? acc.customType || "Other"
                                      : acc.type}
                                  )
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
                            <span className="font-semibold text-white">
                              {formTitle}
                            </span>
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
                                  {accounts.find(
                                    (a) => a.id === formFundingAccountId,
                                  )?.name || "Default checking"}
                                </span>
                              </div>
                              <div className="flex justify-between text-zinc-300">
                                <span>To:</span>
                                <span className="font-semibold text-white font-mono">
                                  {accounts.find(
                                    (a) => a.id === formTargetAccountId,
                                  )?.name || "Default savings"}
                                </span>
                              </div>
                            </>
                          ) : (
                            <div className="flex justify-between text-zinc-300">
                              <span>Paid From:</span>
                              <span className="font-semibold text-white">
                                {accounts.find(
                                  (a) => a.id === formFundingAccountId,
                                )?.name || "Default checking"}
                              </span>
                            </div>
                          )}
                          <div className="flex justify-between text-zinc-300">
                            <span>Next Due Date:</span>
                            <span className="font-semibold text-white font-mono">
                              {formStartDate}
                            </span>
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
                            className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs transition-colors shadow-lg shadow-sky-950/50 flex items-center gap-1.5"
                          >
                            <TrendingDown className="w-3.5 h-3.5" />
                            <span>
                              {editingId
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

              {/* ==================== 3. SEPARATE LIABILITIES WIZARD ==================== */}
              {formCategory === "liability" && (
                <div className="flex flex-col">
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
                        <p className="text-xs text-zinc-400 font-medium">
                          Step {wizardStep} of 4
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
                    <div
                      className={`flex-1 h-1.5 rounded-full transition-all ${wizardStep >= 1 ? "bg-amber-500" : "bg-zinc-800"}`}
                    />
                    <div
                      className={`flex-1 h-1.5 rounded-full transition-all ${wizardStep >= 2 ? "bg-amber-500" : "bg-zinc-800"}`}
                    />
                    <div
                      className={`flex-1 h-1.5 rounded-full transition-all ${wizardStep >= 3 ? "bg-amber-500" : "bg-zinc-800"}`}
                    />
                    <div
                      className={`flex-1 h-1.5 rounded-full transition-all ${wizardStep >= 4 ? "bg-amber-500" : "bg-zinc-800"}`}
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
                          className="text-amber-400 font-bold ml-2"
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
                            <option value="credit_card">Credit Card</option>
                            <option value="personal_loan">Personal Loan</option>
                            <option value="auto_loan">Auto Loan</option>
                            <option value="mortgage">Home Mortgage</option>
                            <option value="revolving_loc">Personal Line of Credit</option>
                            <option value="student_loan">Student Loan</option>
                            <option value="other">Other Contract / Lease</option>
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
                            className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 text-xs font-semibold transition-colors"
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
                            className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs transition-colors shadow-lg shadow-amber-950/50 flex items-center gap-1.5"
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
                            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 text-xs font-mono font-bold">$</span>
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

                        {/* Annual Percentage Rate */}
                        <div>
                          <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                            Annual Percentage Rate *
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
                            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 text-xs font-mono font-bold">%</span>
                          </div>
                        </div>

                        {/* Optional Features Toggles / Checkboxes */}
                        <div className="space-y-3 pt-2">
                          {/* Has credit limit */}
                          <div className="p-3 bg-zinc-950/60 border border-white/5 rounded-xl space-y-2">
                            <label className="flex items-center gap-2.5 cursor-pointer text-xs text-zinc-200 font-medium">
                              <input
                                type="checkbox"
                                checked={formHasCreditLimit}
                                onChange={(e) => {
                                  setFormHasCreditLimit(e.target.checked);
                                  if (!e.target.checked) setFormCreditLimit("");
                                }}
                                className="w-4 h-4 rounded border-white/20 bg-zinc-900 text-amber-500 focus:ring-amber-500/20"
                              />
                              <span>Has credit limit</span>
                            </label>
                            {formHasCreditLimit && (
                              <div className="pt-2 pl-6">
                                <label className="block text-xs font-medium text-zinc-400 mb-1">
                                  Credit limit *
                                </label>
                                <div className="relative">
                                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-xs font-mono">$</span>
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

                          {/* Has balance transfer fee */}
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
                                className="w-4 h-4 rounded border-white/20 bg-zinc-900 text-amber-500 focus:ring-amber-500/20"
                              />
                              <span>Has balance transfer fee</span>
                            </label>
                            {formHasBalanceTransferFee && (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 pl-6">
                                <div>
                                  <label className="block text-xs font-medium text-zinc-400 mb-1">
                                    Balance transfer fee *
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
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 text-xs font-mono">%</span>
                                  </div>
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-zinc-400 mb-1">
                                    Balance transfer fee minimum *
                                  </label>
                                  <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-xs font-mono">$</span>
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

                          {/* Promo period */}
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
                                className="w-4 h-4 rounded border-white/20 bg-zinc-900 text-amber-500 focus:ring-amber-500/20"
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
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 text-xs font-mono">%</span>
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
                            className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 text-xs font-semibold transition-colors flex items-center gap-1.5"
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
                            className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs transition-colors shadow-lg shadow-amber-950/50 flex items-center gap-1.5"
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
                        {/* Minimum Payment Calculation */}
                        <div>
                          <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                            Minimum payment calculation
                          </label>
                          <select
                            value={formMinPaymentCalc}
                            onChange={(e) => setFormMinPaymentCalc(e.target.value)}
                            className="block w-full px-3.5 py-2.5 text-xs bg-zinc-950 border border-white/10 rounded-xl focus:outline-none focus:border-amber-500 text-zinc-100 transition-colors cursor-pointer font-medium"
                          >
                            <option value="fixed">Fixed amount</option>
                            <option value="percent_principal">Percent of principal</option>
                            <option value="percent_principal_interest">Percent of principal + interest</option>
                          </select>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {/* Minimum Payment */}
                          <div>
                            <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                              Minimum payment *
                            </label>
                            <div className="relative">
                              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 text-xs font-mono font-bold">$</span>
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

                          {/* Scheduled Payment Amount */}
                          <div>
                            <label className="block text-xs font-medium text-amber-400 font-bold mb-1.5">
                              Scheduled payment amount ($) *
                            </label>
                            <div className="relative">
                              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-amber-400 text-xs font-mono font-bold">$</span>
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

                        {/* Payment Frequency */}
                        <div>
                          <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                            Payment frequency *
                          </label>
                          <select
                            value={formFrequency}
                            onChange={(e) => setFormFrequency(e.target.value as any)}
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

                        {/* Day of the month Grid Picker */}
                        <div>
                          <label className="block text-xs font-medium text-zinc-300 mb-2">
                            Day of the month *
                          </label>
                          <div className="grid grid-cols-7 sm:grid-cols-10 gap-1.5 p-3 bg-zinc-950 border border-white/10 rounded-2xl">
                            {Array.from({ length: 30 }, (_, i) => String(i + 1)).concat(["Last"]).map((day) => {
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
                                  className={`h-9 rounded-xl text-xs font-mono font-bold transition-all flex items-center justify-center ${
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

                        {/* Next payment due date */}
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
                              onChange={(e) => setFormFundingAccountId(e.target.value)}
                              className="block w-full px-3.5 py-2.5 text-xs bg-zinc-950 border border-white/10 rounded-xl focus:outline-none focus:border-amber-500 text-zinc-100 transition-colors cursor-pointer font-medium"
                            >
                              <option value="">Select Account (Default checking)</option>
                              {accounts
                                .filter((a) => a.type !== "credit-card")
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
                            className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 text-xs font-semibold transition-colors flex items-center gap-1.5"
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
                              setWizardError(null);
                              setWizardStep(4);
                            }}
                            className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs transition-colors shadow-lg shadow-amber-950/50 flex items-center gap-1.5"
                          >
                            <span>Next: Review</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Step 4: Review & Payoff */}
                    {wizardStep === 4 && (
                      <form onSubmit={handleSaveTransaction} className="space-y-4">
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
                                    {formLiabilityType.replace("_", " ")}
                                  </span>
                                </div>

                                <div className="grid grid-cols-2 gap-3 text-zinc-300">
                                  <div>
                                    <span className="text-zinc-500 block text-[10px] uppercase font-mono">Current Balance</span>
                                    <span className="font-mono font-bold text-white text-sm">${bal.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                                  </div>
                                  <div>
                                    <span className="text-zinc-500 block text-[10px] uppercase font-mono">Interest Rate</span>
                                    <span className="font-mono font-bold text-amber-400 text-sm">{apr}% APR</span>
                                  </div>
                                  <div>
                                    <span className="text-zinc-500 block text-[10px] uppercase font-mono">Scheduled Payment</span>
                                    <span className="font-mono font-bold text-amber-300 text-sm">${pmt.toFixed(2)} ({formFrequency})</span>
                                  </div>
                                  <div>
                                    <span className="text-zinc-500 block text-[10px] uppercase font-mono">Next Due Date</span>
                                    <span className="font-mono font-bold text-zinc-200 text-sm">{formStartDate || "Not set"}</span>
                                  </div>
                                </div>

                                {formFundingAccountId && (
                                  <div className="pt-2 border-t border-white/5 flex justify-between text-zinc-400 text-xs">
                                    <span>Payment Source:</span>
                                    <span className="text-zinc-200 font-medium">
                                      {accounts.find((a) => a.id === formFundingAccountId)?.name || "Checking Account"}
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
                                      ${details ? details.dailyInterestAccrual.toFixed(2) : "0.00"} / day
                                    </div>
                                  </div>
                                  <div className="bg-black/40 p-2.5 rounded-xl border border-white/5">
                                    <div className="text-[10px] text-zinc-400 font-mono">Monthly Interest</div>
                                    <div className="text-sm font-bold text-amber-300 font-mono">
                                      ${details ? details.monthlyInterestAccrual.toFixed(2) : "0.00"} / mo
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
                                            ${details.totalInterestPaid.toLocaleString("en-US", {
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
                                          Scheduled payment (${pmt.toFixed(2)}) is less than or equal to monthly interest (${details.monthlyInterestAccrual.toFixed(2)}). The liability will not pay down!
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>

                              <div className="flex justify-between items-center pt-4 border-t border-white/5 mt-4">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setWizardError(null);
                                    setWizardStep(3);
                                  }}
                                  className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 text-xs font-semibold transition-colors flex items-center gap-1.5"
                                >
                                  <ArrowLeft className="w-3.5 h-3.5" />
                                  <span>Back</span>
                                </button>
                                <button
                                  type="submit"
                                  className="px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs transition-colors shadow-lg shadow-amber-950/50 flex items-center gap-1.5"
                                >
                                  <Clock className="w-3.5 h-3.5" />
                                  <span>
                                    {editingId
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
                      {selectedDay.date.toLocaleDateString("en-US", {
                        weekday: "long",
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
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
                  <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider block">
                    Projected Day Balance
                  </span>
                  <span className="text-lg font-bold text-indigo-400 font-mono">
                    $
                    {dashboardAccountFilter && selectedDay.accountBalances
                      ? (selectedDay.accountBalances[dashboardAccountFilter] ?? 0).toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                        })
                      : selectedDay.endingBalance.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                        })}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider block">
                    Net Change
                  </span>
                  <span
                    className={`text-md font-mono font-bold block mt-0.5 ${selectedDay.incoming - selectedDay.outgoing >= 0 ? "text-emerald-400" : "text-sky-400"}`}
                  >
                    {selectedDay.incoming - selectedDay.outgoing >= 0
                      ? "+"
                      : "-"}
                    $
                    {Math.abs(
                      selectedDay.incoming - selectedDay.outgoing,
                    ).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Day Balance Warning Row */}
              {lowBalanceDatesMap.has(selectedDay.dateStr) && (
                <div className="px-6 py-3.5 bg-amber-500/10 border-b border-white/5 flex flex-col gap-1.5">
                  <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    <span>Balance Warning</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    {lowBalanceDatesMap.get(selectedDay.dateStr)!.map((alert, alertIdx) => (
                      <p key={alertIdx} className="text-[11px] text-zinc-300 leading-normal">
                        Account <span className="font-semibold text-white">{alert.accountName}</span> is projected to drop to <span className="font-mono font-bold text-amber-400">${alert.balance.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>{alert.cause ? ` due to ${alert.cause}` : ""}.
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {/* Scheduled Transactions List */}
              <div className="p-6 max-h-[300px] overflow-y-auto scrollbar-thin flex flex-col gap-3">
                <span className="text-[10px] font-mono font-bold tracking-widest text-zinc-500 uppercase">
                  Scheduled Day Transactions
                </span>

                {selectedDay.transactions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-zinc-500 italic text-xs text-center">
                    <CheckCircle className="w-8 h-8 text-zinc-600 mb-2 opacity-50" />
                    <p>No transactions scheduled on this date.</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {selectedDay.transactions.map((t, idx) => {
                      const isEditing = overrideEditingTxId === t.item.id;
                      return (
                        <div
                          key={idx}
                          className="flex flex-col p-3 rounded-2xl bg-black/20 border border-white/5 gap-2"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <span
                                className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                                  t.item.category === "income"
                                    ? "bg-emerald-400"
                                    : t.item.category === "savings"
                                      ? "bg-cyan-400"
                                      : t.item.category === "liability"
                                        ? "bg-amber-400"
                                        : "bg-sky-400"
                                }`}
                              ></span>
                              <div>
                                <div className="text-xs font-semibold text-zinc-100 flex items-center gap-1.5 flex-wrap">
                                  <span>{t.item.title}</span>
                                  {t.status === "verified" && (
                                    <span className="px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 text-[9px] rounded-md font-bold uppercase tracking-wider">
                                      Verified ✓
                                    </span>
                                  )}
                                  {t.status === "modified" && (
                                    <span className="px-1.5 py-0.5 bg-indigo-500/10 text-indigo-400 text-[9px] rounded-md font-bold uppercase tracking-wider">
                                      Modified
                                    </span>
                                  )}
                                </div>
                                <div className="text-[9px] text-zinc-500 uppercase font-mono mt-0.5 flex items-center gap-2">
                                  <span>{t.item.category}</span>
                                  <span>•</span>
                                  <span>{t.item.frequency}</span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="text-right">
                              <span
                                className={`text-xs font-mono font-bold ${
                                  t.item.category === "income"
                                    ? "text-emerald-400"
                                    : t.item.category === "savings"
                                      ? "text-cyan-400"
                                      : t.item.category === "liability"
                                        ? "text-amber-400"
                                        : "text-sky-400"
                                }`}
                              >
                                {t.item.category === "income" ? "+" : "-"}$
                                {Math.abs(t.amount).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                              </span>
                            </div>
                          </div>

                          {/* Inline Modification Input */}
                          {isEditing ? (
                            <div className="flex items-center gap-2 mt-1 bg-zinc-950/40 p-1.5 rounded-xl border border-white/5">
                              <span className="text-[10px] font-mono text-zinc-400 pl-1.5">$</span>
                              <input
                                type="number"
                                step="any"
                                value={overrideCustomAmountInput}
                                onChange={(e) => setOverrideCustomAmountInput(e.target.value)}
                                className="bg-transparent text-xs font-mono text-white focus:outline-none flex-1 py-0.5"
                                placeholder="0.00"
                                autoFocus
                              />
                              <button
                                onClick={() => {
                                  const num = parseFloat(overrideCustomAmountInput);
                                  if (!isNaN(num)) {
                                    handleModifyAmountOverride(t.item.id, selectedDay.dateStr, num);
                                  }
                                }}
                                className="px-2 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-semibold rounded-lg transition-all"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => {
                                  setOverrideEditingTxId(null);
                                  setOverrideCustomAmountInput("");
                                }}
                                className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 text-[10px] font-semibold rounded-lg transition-all"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            /* Actions row */
                            <div className="flex items-center gap-1.5 mt-1 border-t border-white/5 pt-2 justify-end">
                              <button
                                onClick={() => handleToggleVerifyOverride(t.item.id, selectedDay.dateStr)}
                                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all ${
                                  t.status === "verified"
                                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                    : "bg-zinc-800/40 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-transparent"
                                }`}
                                title="Mark as Cleared / Verified"
                              >
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                                <span>{t.status === "verified" ? "Verified" : "Verify"}</span>
                              </button>
                              
                              <button
                                onClick={() => {
                                  setOverrideEditingTxId(t.item.id);
                                  setOverrideCustomAmountInput(Math.abs(t.amount).toString());
                                }}
                                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-zinc-800/40 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-transparent transition-all"
                                title="Change amount for this day only"
                              >
                                <Edit3 className="w-3.5 h-3.5 text-indigo-400" />
                                <span>Change Amount</span>
                              </button>

                              <button
                                onClick={() => handleSkipOverride(t.item.id, selectedDay.dateStr)}
                                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-zinc-800/40 hover:bg-red-950/40 text-zinc-400 hover:text-red-400 border border-transparent hover:border-red-500/20 transition-all"
                                title="Skip this specific transaction instance"
                              >
                                <X className="w-3.5 h-3.5 text-red-400" />
                                <span>Skip</span>
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
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

      {/* PAYOFF STRATEGY PLANNER MODAL */}
      <AnimatePresence>
        {isPayoffPlannerOpen && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-zinc-950 border border-amber-500/30 rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl my-8 flex flex-col"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-white/10 flex items-center justify-between bg-zinc-900/80">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
                    <Zap className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                      Payoff Strategy Planner
                    </h3>
                    <p className="text-xs text-zinc-300">
                      Compare Avalanche vs. Snowball payoff methods with custom monthly acceleration budgets.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setIsPayoffPlannerOpen(false)}
                  className="p-2 hover:bg-zinc-800 rounded-xl text-zinc-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-6 overflow-y-auto max-h-[75vh]">
                {(() => {
                  const liabilities = categorizedTransactions.liabilities;
                  if (liabilities.length === 0) {
                    return (
                      <div className="text-center py-12 text-zinc-400 space-y-2">
                        <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto" />
                        <p className="text-sm font-bold text-white">No Active Liabilities Found</p>
                        <p className="text-xs">Add one or more liabilities with current balances to run strategy simulations.</p>
                      </div>
                    );
                  }

                  const baselineSim = simulateLiabilityPayoff(liabilities, 0, "avalanche");
                  const activeSim = simulateLiabilityPayoff(liabilities, payoffExtraBudget, payoffStrategy);

                  const baseScheduled = liabilities.reduce((acc, c) => acc + getMonthlyEquivalent(c), 0);
                  const totalMonthlyBudget = baseScheduled + payoffExtraBudget;

                  const monthsSaved =
                    baselineSim.totalMonths !== null && activeSim.totalMonths !== null
                      ? baselineSim.totalMonths - activeSim.totalMonths
                      : 0;

                  const interestSaved = Math.max(0, baselineSim.totalInterestPaid - activeSim.totalInterestPaid);

                  return (
                    <div className="space-y-6">
                      {/* Strategy Selection & Budget Controls */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Strategy Switcher */}
                        <div className="bg-zinc-900/60 p-4 rounded-2xl border border-white/10 space-y-3">
                          <label className="block text-[10px] font-mono tracking-widest text-amber-400 font-bold uppercase">
                            Payoff Strategy Method
                          </label>

                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => setPayoffStrategy("avalanche")}
                              className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                                payoffStrategy === "avalanche"
                                  ? "bg-amber-500/20 border-amber-500/50 text-white"
                                  : "bg-black/30 border-white/10 text-zinc-400 hover:text-white"
                              }`}
                            >
                              <div className="flex items-center gap-1.5 font-bold text-xs">
                                <Flame className="w-4 h-4 text-amber-400" />
                                <span>Avalanche</span>
                              </div>
                              <div className="text-[10px] text-zinc-400 mt-1 leading-tight">
                                Highest APR First (Saves Most Money)
                              </div>
                            </button>

                            <button
                              type="button"
                              onClick={() => setPayoffStrategy("snowball")}
                              className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                                payoffStrategy === "snowball"
                                  ? "bg-sky-500/20 border-sky-500/50 text-white"
                                  : "bg-black/30 border-white/10 text-zinc-400 hover:text-white"
                              }`}
                            >
                              <div className="flex items-center gap-1.5 font-bold text-xs">
                                <Snowflake className="w-4 h-4 text-sky-400" />
                                <span>Snowball</span>
                              </div>
                              <div className="text-[10px] text-zinc-400 mt-1 leading-tight">
                                Lowest Balance First (Quick Wins)
                              </div>
                            </button>
                          </div>
                        </div>

                        {/* Extra Monthly Payment Slider */}
                        <div className="bg-zinc-900/60 p-4 rounded-2xl border border-white/10 space-y-3">
                          <div className="flex justify-between items-center">
                            <label className="block text-[10px] font-mono tracking-widest text-amber-400 font-bold uppercase">
                              Extra Monthly Acceleration
                            </label>
                            <span className="text-sm font-bold font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-lg border border-emerald-500/20">
                              +${payoffExtraBudget} / mo
                            </span>
                          </div>

                          <input
                            type="range"
                            min="0"
                            max="2000"
                            step="25"
                            value={payoffExtraBudget}
                            onChange={(e) => setPayoffExtraBudget(parseFloat(e.target.value) || 0)}
                            className="w-full accent-amber-500 cursor-pointer"
                          />

                          <div className="flex justify-between text-[11px] font-mono text-zinc-400">
                            <span>Base Scheduled: ${baseScheduled.toFixed(0)}/mo</span>
                            <span className="text-amber-300 font-bold">Total Budget: ${totalMonthlyBudget.toFixed(0)}/mo</span>
                          </div>
                        </div>
                      </div>

                      {/* Simulation Results Comparison Banner */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-gradient-to-r from-amber-950/30 via-zinc-900 to-amber-950/30 border border-amber-500/30 rounded-2xl">
                        <div className="space-y-1">
                          <div className="text-[10px] font-mono text-zinc-400 uppercase">Est. Fully Paid Date</div>
                          <div className="text-base font-bold font-mono text-emerald-400">
                            {activeSim.fullyPaidDateStr}
                          </div>
                          <div className="text-[10px] text-zinc-400">
                            {activeSim.totalMonths !== null ? `${activeSim.totalMonths} months total` : "N/A"}
                          </div>
                        </div>

                        <div className="space-y-1">
                          <div className="text-[10px] font-mono text-zinc-400 uppercase">Time Saved</div>
                          <div className="text-base font-bold font-mono text-amber-300">
                            {monthsSaved > 0 ? `${monthsSaved} Months Faster` : "Baseline Pace"}
                          </div>
                          <div className="text-[10px] text-zinc-400">
                            vs minimum scheduled payments
                          </div>
                        </div>

                        <div className="space-y-1">
                          <div className="text-[10px] font-mono text-zinc-400 uppercase">Est. Interest Saved</div>
                          <div className="text-base font-bold font-mono text-emerald-300">
                            ${interestSaved.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </div>
                          <div className="text-[10px] text-zinc-400">
                            Total interest: ${activeSim.totalInterestPaid.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                          </div>
                        </div>
                      </div>

                      {/* Elimination Sequence Table */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
                            <Target className="w-4 h-4 text-amber-400" />
                            Target Account Elimination Order ({payoffStrategy === "avalanche" ? "Highest APR First" : "Lowest Balance First"})
                          </h4>
                          <span className="text-[10px] font-mono text-zinc-400">
                            {activeSim.payoffOrder.length} Liabilities Simulated
                          </span>
                        </div>

                        <div className="space-y-2 max-h-[250px] overflow-y-auto scrollbar-thin">
                          {activeSim.payoffOrder.map((item, idx) => (
                            <div
                              key={item.id}
                              className="p-3.5 bg-black/40 border border-white/5 rounded-xl flex items-center justify-between hover:border-amber-500/20 transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                <span className="w-6 h-6 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-400 font-mono font-bold text-xs flex items-center justify-center shrink-0">
                                  #{idx + 1}
                                </span>
                                <div>
                                  <div className="text-xs font-bold text-white">{item.title}</div>
                                  <div className="text-[10px] font-mono text-zinc-400">
                                    Start Balance: ${item.currentBalance.toLocaleString("en-US")} &bull; {item.interestRate}% APR
                                  </div>
                                </div>
                              </div>

                              <div className="text-right">
                                <div className="text-xs font-mono font-bold text-emerald-400">
                                  {item.payoffDateStr}
                                </div>
                                <div className="text-[10px] font-mono text-zinc-400">
                                  Month {item.monthEliminated} &bull; Est. Interest: ${item.interestPaid.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Modal Footer */}
              <div className="p-4 bg-zinc-900/60 border-t border-white/10 flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsPayoffPlannerOpen(false)}
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs transition-colors shadow-lg shadow-amber-950/50"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CUSTOM CONFIRMATION DIALOG */}
      <AnimatePresence>
        {confirmDialog.isOpen && (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              transition={{ duration: 0.15 }}
              className="bg-zinc-950 border border-white/10 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl"
            >
              <div className="p-6">
                <h3 className="text-sm font-bold font-sans text-zinc-100 uppercase tracking-wider mb-2">
                  {confirmDialog.title}
                </h3>
                <p className="text-xs text-zinc-400 font-medium leading-relaxed">
                  {confirmDialog.message}
                </p>
              </div>
              <div className="px-6 py-4 bg-zinc-900/45 border-t border-white/5 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setConfirmDialog((prev) => ({ ...prev, isOpen: false }))
                  }
                  className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-zinc-300 font-semibold text-xs transition-all"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    confirmDialog.onConfirm();
                    setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
                  }}
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs transition-all shadow-md"
                >
                  Confirm
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* PREMIUM POPUP WIZARD FOR ADDING/EDITING ACCOUNTS */}
      <AnimatePresence>
        {(isAddingAccount || editingAccountId !== null) && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              transition={{ duration: 0.15 }}
              className="bg-zinc-950 border border-white/10 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col"
            >
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
                  onClick={() => {
                    setIsAddingAccount(false);
                    setEditingAccountId(null);
                    setAccFormName("");
                    setAccFormType("checking");
                    setAccFormCustomType("");
                    setAccFormBalance("");
                    setAccFormStartDate("");
                    setAccFormError(null);
                  }}
                  className="p-1.5 rounded-lg hover:bg-white/5 text-zinc-400 hover:text-white transition-colors"
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
                    placeholder="e.g. Primary Checking"
                    value={accFormName}
                    onChange={(e) => {
                      setAccFormName(e.target.value);
                      setAccFormError(null);
                    }}
                    className="bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-medium w-full"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold font-mono tracking-wider text-zinc-400 uppercase">
                      Balance ($)
                    </label>
                    <input
                      type="number"
                      placeholder="0.00"
                      value={accFormBalance}
                      onChange={(e) => {
                        setAccFormBalance(e.target.value);
                        setAccFormError(null);
                      }}
                      className="bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono font-medium w-full"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold font-mono tracking-wider text-zinc-400 uppercase">
                      Account Type
                    </label>
                    <select
                      value={accFormType}
                      onChange={(e) => {
                        setAccFormType(e.target.value as any);
                        setAccFormError(null);
                      }}
                      className="bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-medium cursor-pointer w-full"
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
                      placeholder="e.g. Cash Safe, Brokerage"
                      value={accFormCustomType}
                      onChange={(e) => {
                        setAccFormCustomType(e.target.value);
                        setAccFormError(null);
                      }}
                      className="bg-zinc-900 border border-amber-500/30 focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none font-medium w-full"
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
                    value={accFormStartDate}
                    onChange={(e) => {
                      setAccFormStartDate(e.target.value);
                      setAccFormError(null);
                    }}
                    className="bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-medium font-mono w-full cursor-pointer"
                  />
                  <span className="text-[10px] text-zinc-500 leading-normal">
                    This account&apos;s balance only starts to factor into your projection timeline from this date onward. Leave empty to start immediately.
                  </span>
                </div>
              </div>

              <div className="p-6 bg-zinc-900/40 border-t border-white/5 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingAccount(false);
                    setEditingAccountId(null);
                    setAccFormName("");
                    setAccFormCustomType("");
                    setAccFormBalance("");
                    setAccFormStartDate("");
                    setAccFormError(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-zinc-300 font-semibold text-xs transition-all"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={() => {
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
                    const balanceNum = parseFloat(accFormBalance) || 0;

                    if (editingAccountId) {
                      const updated = accounts.map((a) =>
                        a.id === editingAccountId
                          ? {
                              ...a,
                              name: accFormName.trim(),
                              type: accFormType,
                              customType:
                                accFormType === "other"
                                  ? accFormCustomType.trim()
                                  : undefined,
                              balance: Math.max(0, balanceNum),
                              startDate: accFormStartDate.trim() || undefined,
                            }
                          : a
                      );
                      setAccounts(updated);
                      saveToStorage(transactions, launchDateStr, updated);
                      setEditingAccountId(null);
                    } else {
                      const newId = "acc_" + String(new Date().getTime());
                      const newAcc: Account = {
                        id: newId,
                        name: accFormName.trim(),
                        type: accFormType,
                        customType:
                          accFormType === "other"
                            ? accFormCustomType.trim()
                            : undefined,
                        balance: Math.max(0, balanceNum),
                        startDate: accFormStartDate.trim() || undefined,
                      };

                      const updated = [...accounts, newAcc];
                      setAccounts(updated);

                      // If credit card, automatically create a liability minimum payment placeholder
                      let updatedTx = [...transactions];
                      if (accFormType === "credit-card") {
                        const matchingLiability: RecurringTransaction = {
                          id: "l_" + String(new Date().getTime()),
                          title: `${accFormName.trim()} Minimum Payment`,
                          amount: 0, // Ask user to configure in liabilities
                          startDate: launchDateStr,
                          frequency: "monthly",
                          category: "liability",
                          targetAccountId: newId,
                        };
                        updatedTx.push(matchingLiability);
                        setTransactions(updatedTx);
                      }

                      saveToStorage(updatedTx, launchDateStr, updated);
                      setIsAddingAccount(false);
                    }

                    // Reset form states
                    setAccFormName("");
                    setAccFormCustomType("");
                    setAccFormBalance("");
                    setAccFormStartDate("");
                    setAccFormError(null);
                  }}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all shadow-md font-semibold"
                >
                  {editingAccountId ? "Save Changes" : "Register Account"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ADVANCED ACCOUNT DELETION & REASSIGNMENT WIZARD */}
      <AnimatePresence>
        {deletingAccount && (() => {
          const affectedTxs = transactions.filter(
            (t) =>
              t.accountId === deletingAccount.id ||
              t.fundingAccountId === deletingAccount.id ||
              t.targetAccountId === deletingAccount.id
          );
          const remainingAccs = accounts.filter((a) => a.id !== deletingAccount.id);

          return (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
              <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 15 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 15 }}
                transition={{ duration: 0.15 }}
                className="bg-zinc-950 border border-white/10 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col"
              >
                {/* Header */}
                <div className="p-6 border-b border-white/5 flex justify-between items-center bg-zinc-900/20">
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <Trash2 className="w-5 h-5 text-red-400" />
                      Delete Account: {deletingAccount.name}
                    </h3>
                    <p className="text-xs text-zinc-400 mt-1">
                      Determine how to handle scheduled future transactions tied to this account.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDeletingAccount(null)}
                    className="p-1.5 rounded-lg hover:bg-white/5 text-zinc-400 hover:text-white transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-5 overflow-y-auto max-h-[60vh] scrollbar-thin">
                  {/* Warning summary */}
                  <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
                    <span className="text-xs text-amber-300 font-medium leading-relaxed block">
                      You are about to delete <span className="font-bold text-white">{deletingAccount.name}</span>. 
                      {affectedTxs.length > 0 ? (
                        <> There are <span className="font-bold text-white">{affectedTxs.length} scheduled transaction(s)</span> directly dependent on this account.</>
                      ) : (
                        <> No active scheduled transactions will be affected by this deletion.</>
                      )}
                    </span>
                  </div>

                  {affectedTxs.length > 0 && (
                    <>
                      {/* List of Affected Transactions */}
                      <div className="space-y-2">
                        <span className="text-[10px] font-bold font-mono tracking-wider text-zinc-400 uppercase">
                          Dependent Transactions
                        </span>
                        <div className="bg-zinc-900/40 border border-white/5 rounded-2xl overflow-hidden divide-y divide-white/5 max-h-[160px] overflow-y-auto scrollbar-thin">
                          {affectedTxs.map((t) => (
                            <div key={t.id} className="p-3 flex justify-between items-center text-xs">
                              <div className="flex flex-col gap-0.5">
                                <span className="font-semibold text-white">{t.title}</span>
                                <span className="text-[10px] text-zinc-500 capitalize">
                                  {t.category.replace("-", " ")} &bull; {t.frequency}
                                </span>
                              </div>
                              <span className="font-mono font-bold text-zinc-200">
                                ${t.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Deletion / Reassignment choices */}
                      <div className="space-y-3">
                        <span className="text-[10px] font-bold font-mono tracking-wider text-zinc-400 uppercase">
                          Choose Action for Transactions
                        </span>

                        <div className="grid grid-cols-1 gap-3">
                          {remainingAccs.length > 0 ? (
                            <label
                              className={`flex flex-col p-4 rounded-2xl border cursor-pointer transition-all ${
                                deleteActionChoice === "transfer"
                                  ? "bg-indigo-500/10 border-indigo-500 text-white"
                                  : "bg-zinc-900/30 border-white/5 hover:border-white/10 text-zinc-300"
                              }`}
                            >
                              <div className="flex items-center gap-2.5">
                                <input
                                  type="radio"
                                  name="deleteActionChoice"
                                  checked={deleteActionChoice === "transfer"}
                                  onChange={() => setDeleteActionChoice("transfer")}
                                  className="accent-indigo-500 cursor-pointer"
                                />
                                <span className="text-xs font-bold">Transfer to another account</span>
                              </div>
                              <p className="text-[11px] text-zinc-400 mt-1.5 ml-6 leading-relaxed">
                                Safely reassign these scheduled transactions to another active account of your choosing.
                              </p>

                              {deleteActionChoice === "transfer" && (
                                <div className="mt-3 ml-6">
                                  <label className="text-[9px] font-bold font-mono tracking-wider text-zinc-400 uppercase block mb-1">
                                    Target Destination Account
                                  </label>
                                  <select
                                    value={deleteAccountTransferTargetId}
                                    onChange={(e) => setDeleteAccountTransferTargetId(e.target.value)}
                                    className="bg-zinc-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-medium cursor-pointer w-full"
                                  >
                                    {remainingAccs.map((a) => (
                                      <option key={a.id} value={a.id}>
                                        {a.name} ({a.type})
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              )}
                            </label>
                          ) : (
                            <div className="p-4 bg-zinc-900/30 border border-white/5 rounded-2xl text-zinc-400 text-xs flex flex-col gap-1">
                              <span className="font-bold text-zinc-300">No other active accounts</span>
                              <p className="text-[11px] text-zinc-500 leading-normal">
                                Since you are deleting your only remaining account, these future scheduled transactions cannot be transferred and will be archived.
                              </p>
                            </div>
                          )}

                          <label
                            className={`flex flex-col p-4 rounded-2xl border cursor-pointer transition-all ${
                              deleteActionChoice === "archive"
                                ? "bg-red-500/10 border-red-500/30 text-white"
                                : "bg-zinc-900/30 border-white/5 hover:border-white/10 text-zinc-300"
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <input
                                type="radio"
                                name="deleteActionChoice"
                                checked={deleteActionChoice === "archive"}
                                onChange={() => setDeleteActionChoice("archive")}
                                className="accent-red-500 cursor-pointer"
                              />
                              <span className="text-xs font-bold">Archive &amp; remove transactions</span>
                            </div>
                            <p className="text-[11px] text-zinc-400 mt-1.5 ml-6 leading-relaxed">
                              Permanently stop and delete these future recurring transactions from your calendar and forecasting models.
                            </p>
                          </label>
                        </div>
                      </div>
                    </>
                  )}

                  {affectedTxs.length === 0 && (
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      This account has no scheduled transactions linked to it. It can be safely deleted without any transaction transfer or reassignment overhead.
                    </p>
                  )}
                </div>

                {/* Footer buttons */}
                <div className="p-6 bg-zinc-900/40 border-t border-white/5 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setDeletingAccount(null)}
                    className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-zinc-300 font-semibold text-xs transition-all"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const updatedAccs = accounts.filter((a) => a.id !== deletingAccount.id);
                      let updatedTxs = [...transactions];

                      if (affectedTxs.length > 0) {
                        if (deleteActionChoice === "transfer" && deleteAccountTransferTargetId) {
                          updatedTxs = transactions.map((t) => {
                            const newT = { ...t };
                            if (t.accountId === deletingAccount.id) {
                              newT.accountId = deleteAccountTransferTargetId;
                            }
                            if (t.fundingAccountId === deletingAccount.id) {
                              newT.fundingAccountId = deleteAccountTransferTargetId;
                            }
                            if (t.targetAccountId === deletingAccount.id) {
                              newT.targetAccountId = deleteAccountTransferTargetId;
                            }
                            return newT;
                          });
                        } else if (deleteActionChoice === "archive") {
                          updatedTxs = transactions.filter(
                            (t) =>
                              t.accountId !== deletingAccount.id &&
                              t.fundingAccountId !== deletingAccount.id &&
                              t.targetAccountId !== deletingAccount.id
                          );
                        }
                      }

                      setAccounts(updatedAccs);
                      setTransactions(updatedTxs);
                      saveToStorage(updatedTxs, launchDateStr, updatedAccs);

                      if (editingAccountId === deletingAccount.id) {
                        setEditingAccountId(null);
                        setAccFormName("");
                        setAccFormCustomType("");
                        setAccFormBalance("");
                        setAccFormStartDate("");
                      }

                      setDeletingAccount(null);
                    }}
                    className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs transition-all shadow-md font-semibold"
                  >
                    Confirm Deletion
                  </button>
                </div>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>

      {/* TRANSACTION DETAILS MODAL */}
      <AnimatePresence>
        {selectedDetailTransaction && (() => {
          const tx = selectedDetailTransaction;
          const isInc = tx.category === "income";
          const isLia = tx.category === "liability";
          const isSav = tx.category === "savings";
          const isSub = tx.category === "subscription";
          const isExp = tx.category === "fixed-expense";

          // Find linked account
          const linkedAccId = tx.accountId || tx.fundingAccountId || tx.targetAccountId;
          const linkedAcc = accounts.find(a => a.id === linkedAccId);

          const payoff = isLia ? calculatePayoffDetails(tx) : null;
          const bal = tx.currentBalance !== undefined ? tx.currentBalance : 0;
          const limit = tx.creditLimit || 0;
          const utilization = limit > 0 ? Math.round((bal / limit) * 100) : 0;
          const isPaidOff = isLia && bal === 0;

          return (
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
                    <div className={`p-3 rounded-2xl border ${
                      isInc 
                        ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/20"
                        : isLia
                        ? "bg-amber-500/15 text-amber-400 border-amber-500/20"
                        : isSav
                        ? "bg-cyan-500/15 text-cyan-400 border-cyan-500/20"
                        : isSub
                        ? "bg-violet-500/15 text-violet-400 border-violet-500/20"
                        : "bg-sky-500/15 text-sky-400 border-sky-500/20"
                    }`}>
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
                      <h3 className="text-base font-bold text-white leading-snug">
                        {tx.title}
                      </h3>
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
                      <span className="text-[10px] font-mono text-zinc-500 uppercase">Amount &amp; Frequency</span>
                      <div className={`text-xl font-mono font-bold mt-0.5 ${isInc || isSav ? "text-emerald-400" : "text-zinc-200"}`}>
                        {isInc || isSav ? "+" : "-"}${tx.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
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
                      <span className="text-xs font-mono font-bold text-zinc-300 mt-1 block">{tx.startDate}</span>
                    </div>
                    <div className="p-3.5 bg-zinc-900/20 border border-white/5 rounded-xl">
                      <span className="text-[9px] font-mono text-zinc-500 uppercase block">Linked Account</span>
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
                            <span className={`font-bold ${
                              utilization > 70
                                ? "text-orange-400"
                                : utilization > 30
                                ? "text-amber-400"
                                : "text-emerald-400"
                            }`}>
                              {utilization}% (${bal.toLocaleString("en-US")} / ${limit.toLocaleString("en-US")})
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
                            ${bal.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div>
                          <span className="text-[9px] font-mono text-zinc-500 block">Minimum Due</span>
                          <span className="text-sm font-bold font-mono text-zinc-300">
                            ${tx.minimumPayment ? tx.minimumPayment.toLocaleString("en-US", { minimumFractionDigits: 2 }) : "$0.00"}
                          </span>
                        </div>
                      </div>

                      {/* Interest accretion details */}
                      {tx.interestRate !== undefined && tx.interestRate > 0 && !isPaidOff && (
                        <div className="text-xs space-y-2 bg-amber-950/10 p-3.5 rounded-2xl border border-amber-500/15">
                          <div className="flex justify-between text-zinc-300">
                            <span>Annual Rate:</span>
                            <span className="font-mono font-bold text-amber-400">{tx.interestRate}% APR</span>
                          </div>
                          <div className="flex justify-between text-zinc-300">
                            <span>Daily Interest Volume:</span>
                            <span className="font-mono text-zinc-200">${payoff.dailyInterestAccrual.toFixed(2)} / day</span>
                          </div>
                          <div className="flex justify-between text-zinc-300">
                            <span>Monthly Interest Volume:</span>
                            <span className="font-mono text-zinc-200">${payoff.monthlyInterestAccrual.toFixed(2)} / mo</span>
                          </div>
                          {payoff.monthsToPayoff !== null && (
                            <div className="flex justify-between text-zinc-300 pt-1.5 border-t border-amber-500/10">
                              <span>Total Est. Interest Cost:</span>
                              <span className="font-mono font-bold text-amber-300">
                                ${payoff.totalInterestPaid.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                      onClick={() => {
                        handleEditTransaction(tx);
                        setSelectedDetailTransaction(null);
                      }}
                      className="flex-1 px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-zinc-200 hover:text-white font-bold text-xs transition-all text-center"
                    >
                      Edit Details
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        handleDeleteTransaction(tx.id);
                        setSelectedDetailTransaction(null);
                      }}
                      className="flex-1 px-4 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 hover:text-red-300 font-bold text-xs transition-all text-center"
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
                      className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500/20 to-amber-600/20 border border-amber-500/40 text-amber-300 font-bold text-xs hover:from-amber-500/30 hover:to-amber-600/30 transition-all flex items-center justify-center gap-1.5 shadow-md shadow-amber-950/30"
                    >
                      <Zap className="w-4 h-4 text-amber-400" />
                      <span>Planner</span>
                    </button>
                  )}
                </div>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>

      {/* CUSTOM ALERT DIALOG */}
      <AnimatePresence>
        {alertMessage && (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              transition={{ duration: 0.15 }}
              className="bg-zinc-950 border border-white/10 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl p-6"
            >
              <p className="text-sm font-medium text-zinc-200 mb-5 leading-relaxed">
                {alertMessage}
              </p>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setAlertMessage(null)}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all shadow-md"
                >
                  OK
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
