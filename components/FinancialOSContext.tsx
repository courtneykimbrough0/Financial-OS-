"use client";

import React, { createContext, useContext, useState, useEffect, useMemo } from "react";
import { createClient } from "@/utils/supabase/client";
import {
  Account,
  RecurringTransaction,
  TransactionOverride,
  ForecastDay,
  generateForecast,
  parseDateLocal,
  formatDateLocal,
} from "@/lib/forecast";
import {
  fetchAccounts,
  insertAccount,
  updateAccount,
  deleteAccount,
} from "@/lib/data/accounts";
import {
  fetchTransactions,
  insertTransaction,
  updateTransaction,
  deleteTransaction,
} from "@/lib/data/transactions";
import {
  fetchOverrides,
  upsertOverride,
  deleteOverride,
} from "@/lib/data/overrides";
import {
  fetchUserSettings,
  createUserSettings,
  updateOnboardingCompleted,
  updateLaunchDate,
} from "@/lib/data/settings";
import { validateAccountInput, validateTransactionInput } from "@/lib/validation";

interface ConfirmDialogState {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
}

interface FinancialOSContextType {
  // Core Data
  accounts: Account[];
  transactions: RecurringTransaction[];
  transactionOverrides: TransactionOverride[];
  launchDateStr: string;
  onboardingCompleted: boolean;
  userId: string | null;
  loading: boolean;
  isSaving: boolean;

  // View Settings
  activeTab: "dashboard" | "accounts" | "income" | "expenses" | "liabilities";
  expenseSubTab: "all" | "fixed" | "subscriptions" | "savings";
  isMobileMenuOpen: boolean;
  dashboardAccountFilter: string;
  dashboardViewMode: "calendar" | "analytics";
  forecastRange: "week" | "two-weeks" | "month" | "quarter";
  calendarYear: number;
  calendarMonth: number;

  // Selected Day Details / Modal states
  selectedDay: ForecastDay | null;
  isAddingTransaction: boolean;
  formCategory: "income" | "fixed-expense" | "subscription" | "liability" | "savings" | "transfer";
  editingId: string | null;
  wizardStep: number;
  wizardError: string | null;
  isPayoffPlannerOpen: boolean;
  payoffStrategy: "avalanche" | "snowball";
  payoffExtraBudget: number;
  editingAccountId: string | null;
  isAddingAccount: boolean;
  deletingAccount: Account | null;
  deleteAccountTransferTargetId: string;
  deleteActionChoice: "transfer" | "archive";
  selectedDetailTransaction: RecurringTransaction | null;
  overrideEditingTxId: string | null;
  overrideCustomAmountInput: string;

  // Dialog Overlays
  confirmDialog: ConfirmDialogState;
  alertMessage: string | null;

  // State Setters
  setActiveTab: React.Dispatch<React.SetStateAction<"dashboard" | "accounts" | "income" | "expenses" | "liabilities">>;
  setExpenseSubTab: React.Dispatch<React.SetStateAction<"all" | "fixed" | "subscriptions" | "savings">>;
  setIsMobileMenuOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setDashboardAccountFilter: React.Dispatch<React.SetStateAction<string>>;
  setDashboardViewMode: React.Dispatch<React.SetStateAction<"calendar" | "analytics">>;
  setForecastRange: React.Dispatch<React.SetStateAction<"week" | "two-weeks" | "month" | "quarter">>;
  setCalendarYear: React.Dispatch<React.SetStateAction<number>>;
  setCalendarMonth: React.Dispatch<React.SetStateAction<number>>;
  setConfirmDialog: React.Dispatch<React.SetStateAction<ConfirmDialogState>>;
  setAlertMessage: React.Dispatch<React.SetStateAction<string | null>>;
  setSelectedDay: React.Dispatch<React.SetStateAction<ForecastDay | null>>;
  setIsAddingTransaction: React.Dispatch<React.SetStateAction<boolean>>;
  setFormCategory: React.Dispatch<
    React.SetStateAction<"income" | "fixed-expense" | "subscription" | "liability" | "savings" | "transfer">
  >;
  setEditingId: React.Dispatch<React.SetStateAction<string | null>>;
  setWizardStep: React.Dispatch<React.SetStateAction<number>>;
  setWizardError: React.Dispatch<React.SetStateAction<string | null>>;
  setIsPayoffPlannerOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setPayoffStrategy: React.Dispatch<React.SetStateAction<"avalanche" | "snowball">>;
  setPayoffExtraBudget: React.Dispatch<React.SetStateAction<number>>;
  setEditingAccountId: React.Dispatch<React.SetStateAction<string | null>>;
  setIsAddingAccount: React.Dispatch<React.SetStateAction<boolean>>;
  setDeletingAccount: React.Dispatch<React.SetStateAction<Account | null>>;
  setDeleteAccountTransferTargetId: React.Dispatch<React.SetStateAction<string>>;
  setDeleteActionChoice: React.Dispatch<React.SetStateAction<"transfer" | "archive">>;
  setSelectedDetailTransaction: React.Dispatch<React.SetStateAction<RecurringTransaction | null>>;
  setOverrideEditingTxId: React.Dispatch<React.SetStateAction<string | null>>;
  setOverrideCustomAmountInput: React.Dispatch<React.SetStateAction<string>>;

  // Derived calculations
  initialBalance: number;
  forecast: ForecastDay[];
  calendarForecastTimeline: ForecastDay[];
  lowBalanceAlerts: { dateStr: string; accountName: string; balance: number }[];
  categorizedTransactions: {
    income: RecurringTransaction[];
    fixedExpenses: RecurringTransaction[];
    subscriptions: RecurringTransaction[];
    savings: RecurringTransaction[];
    liabilities: RecurringTransaction[];
  };

  // Mutators
  saveAccount: (
    accountInput: Parameters<typeof validateAccountInput>[0] & { id?: string }
  ) => Promise<boolean>;
  deleteAccountWithStrategy: (
    accountId: string,
    strategy: "transfer" | "archive",
    transferTargetId?: string
  ) => Promise<boolean>;
  saveTransaction: (
    txInput: Parameters<typeof validateTransactionInput>[0] & { id?: string }
  ) => Promise<boolean>;
  deleteTransactionById: (txId: string) => Promise<boolean>;
  toggleVerifyOverride: (transactionId: string, dateStr: string) => Promise<void>;
  skipOverride: (transactionId: string, dateStr: string) => Promise<void>;
  modifyAmountOverride: (transactionId: string, dateStr: string, customAmt: number) => Promise<void>;
  updateLaunchDateInDb: (newDate: string) => Promise<boolean>;
  completeOnboarding: (
    wizAccs: Account[],
    wizTxs: RecurringTransaction[],
    wizSavingsEnabled: boolean,
    wizSavingsTitle: string,
    wizSavingsAmount: string,
    wizSavingsFrequency: string,
    wizSavingsStartDate: string,
    wizSavingsFundingId: string,
    wizSavingsAccountId: string
  ) => Promise<boolean>;
  handleClearAllData: () => void;
  signOut: () => Promise<void>;
}

const FinancialOSContext = createContext<FinancialOSContextType | undefined>(undefined);

export const FinancialOSProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mounted, setMounted] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Auth Context
  const [userId, setUserId] = useState<string | null>(null);

  // Core Data States
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<RecurringTransaction[]>([]);
  const [transactionOverrides, setTransactionOverrides] = useState<TransactionOverride[]>([]);
  const [launchDateStr, setLaunchDateStr] = useState<string>("");
  const [onboardingCompleted, setOnboardingCompleted] = useState<boolean>(false);

  // View States
  const [activeTab, setActiveTab] = useState<
    "dashboard" | "accounts" | "income" | "expenses" | "liabilities"
  >("dashboard");
  const [expenseSubTab, setExpenseSubTab] = useState<"all" | "fixed" | "subscriptions" | "savings">(
    "all"
  );
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [dashboardAccountFilter, setDashboardAccountFilter] = useState<string>("");
  const [dashboardViewMode, setDashboardViewMode] = useState<"calendar" | "analytics">("calendar");
  const [forecastRange, setForecastRange] = useState<"week" | "two-weeks" | "month" | "quarter">(
    "month"
  );
  const [calendarYear, setCalendarYear] = useState<number>(2026);
  const [calendarMonth, setCalendarMonth] = useState<number>(6);

  // Modals & Forms States
  const [selectedDay, setSelectedDay] = useState<ForecastDay | null>(null);
  const [isAddingTransaction, setIsAddingTransaction] = useState<boolean>(false);
  const [formCategory, setFormCategory] = useState<
    "income" | "fixed-expense" | "subscription" | "liability" | "savings" | "transfer"
  >("income");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [wizardStep, setWizardStep] = useState<number>(1);
  const [wizardError, setWizardError] = useState<string | null>(null);
  const [isPayoffPlannerOpen, setIsPayoffPlannerOpen] = useState<boolean>(false);
  const [payoffStrategy, setPayoffStrategy] = useState<"avalanche" | "snowball">("avalanche");
  const [payoffExtraBudget, setPayoffExtraBudget] = useState<number>(200);
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);
  const [isAddingAccount, setIsAddingAccount] = useState<boolean>(false);
  const [deletingAccount, setDeletingAccount] = useState<Account | null>(null);
  const [deleteAccountTransferTargetId, setDeleteAccountTransferTargetId] = useState<string>("");
  const [deleteActionChoice, setDeleteActionChoice] = useState<"transfer" | "archive">("transfer");
  const [selectedDetailTransaction, setSelectedDetailTransaction] =
    useState<RecurringTransaction | null>(null);
  const [overrideEditingTxId, setOverrideEditingTxId] = useState<string | null>(null);
  const [overrideCustomAmountInput, setOverrideCustomAmountInput] = useState<string>("");

  // overlays
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });
  const [alertMessage, setAlertMessage] = useState<string | null>(null);

  const supabase = useMemo(() => createClient(), []);

  // Auth Initialization & DB Sync
  useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(true);
    }, 0);
    let active = true;

    async function initAuth() {
      try {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
          setLoading(false);
          return;
        }

        if (active) {
          setUserId(user.id);

          // Fetch Settings
          let settings = await fetchUserSettings(supabase, user.id);
          const todayStr = formatDateLocal(new Date());

          if (!settings) {
            settings = await createUserSettings(supabase, user.id, todayStr);
          }

          setLaunchDateStr(settings.launchDate || todayStr);
          setOnboardingCompleted(settings.onboardingCompleted);

          const d = parseDateLocal(settings.launchDate || todayStr);
          setCalendarYear(d.getFullYear());
          setCalendarMonth(d.getMonth());

          // Fetch Core Collections
          const [accs, txs, ovs] = await Promise.all([
            fetchAccounts(supabase, user.id),
            fetchTransactions(supabase, user.id),
            fetchOverrides(supabase, user.id),
          ]);

          if (active) {
            setAccounts(accs);
            setTransactions(txs);
            setTransactionOverrides(ovs);
            setLoading(false);
          }
        }
      } catch (err: any) {
        console.error("Auth and data loading failed:", err);
        if (active) {
          setAlertMessage(err.message || "Failed to load account data from database.");
          setLoading(false);
        }
      }
    }

    initAuth();

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [supabase]);

  // Derived Calculations
  const initialBalance = useMemo(() => {
    return accounts.reduce((acc, curr) => acc + curr.balance, 0);
  }, [accounts]);

  const forecast = useMemo(() => {
    if (!launchDateStr || loading) return [];
    const start = parseDateLocal(launchDateStr);
    let days = 31;
    if (forecastRange === "week") {
      days = 7;
    } else if (forecastRange === "two-weeks") {
      days = 14;
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
  }, [launchDateStr, forecastRange, accounts, transactions, transactionOverrides, loading]);

  const calendarForecastTimeline = useMemo(() => {
    if (!launchDateStr || loading) return [];
    const startOfCalendar = new Date(calendarYear, calendarMonth, 1);
    const endOfCalendar = new Date(calendarYear, calendarMonth + 3, 0);
    const launchDate = parseDateLocal(launchDateStr);
    const simStart = launchDate < startOfCalendar ? launchDate : startOfCalendar;
    const diffTime = Math.abs(endOfCalendar.getTime() - simStart.getTime());
    const simDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 15;

    return generateForecast({
      startDate: simStart,
      numberOfDays: simDays,
      accounts,
      transactions,
      overrides: transactionOverrides,
    });
  }, [calendarYear, calendarMonth, launchDateStr, accounts, transactions, transactionOverrides, loading]);

  const lowBalanceAlerts = useMemo(() => {
    const alerts: { dateStr: string; accountName: string; balance: number }[] = [];
    if (loading) return alerts;

    const timeline = calendarForecastTimeline;
    const cashAccounts = accounts;
    const checkedDates = new Set<string>();

    for (const day of timeline) {
      if (day.dateStr < launchDateStr) continue;
      for (const acc of cashAccounts) {
        const bal = day.accountBalances[acc.id] ?? 0;
        if (bal < 100) {
          const key = `${day.dateStr}_${acc.id}`;
          if (!checkedDates.has(key)) {
            checkedDates.add(key);
            alerts.push({
              dateStr: day.dateStr,
              accountName: acc.name,
              balance: bal,
            });
          }
        }
      }
    }
    return alerts.sort((a, b) => a.dateStr.localeCompare(b.dateStr)).slice(0, 5);
  }, [calendarForecastTimeline, accounts, launchDateStr, loading]);

  const categorizedTransactions = useMemo(() => {
    return {
      income: transactions.filter((t) => t.category === "income"),
      fixedExpenses: transactions.filter((t) => t.category === "fixed-expense"),
      subscriptions: transactions.filter((t) => t.category === "subscription"),
      savings: transactions.filter((t) => t.category === "savings"),
      liabilities: transactions.filter((t) => t.category === "liability"),
    };
  }, [transactions]);

  // MUTATORS
  const saveAccount = async (
    accountInput: Parameters<typeof validateAccountInput>[0] & { id?: string }
  ): Promise<boolean> => {
    if (!userId) return false;
    const valResult = validateAccountInput(accountInput);
    if (!valResult.success) {
      setAlertMessage(valResult.error);
      return false;
    }

    setIsSaving(true);
    const validatedData = valResult.data;
    const isEdit = !!accountInput.id;
    const previousAccounts = [...accounts];

    // Optimistic Update
    const tempId = accountInput.id || crypto.randomUUID();
    const optimisticAccount: Account = { ...validatedData, id: tempId };

    if (isEdit) {
      setAccounts((prev) => prev.map((a) => (a.id === accountInput.id ? optimisticAccount : a)));
    } else {
      setAccounts((prev) => [...prev, optimisticAccount]);
    }

    try {
      if (isEdit) {
        const updated = await updateAccount(
          supabase,
          { ...validatedData, id: accountInput.id! },
          userId
        );
        setAccounts((prev) => prev.map((a) => (a.id === accountInput.id ? updated : a)));
      } else {
        const inserted = await insertAccount(supabase, validatedData, userId);
        setAccounts((prev) => prev.map((a) => (a.id === tempId ? inserted : a)));
      }
      setIsSaving(false);
      return true;
    } catch (err: any) {
      setAccounts(previousAccounts); // Rollback
      setAlertMessage(err.message || "Failed to save the account to the database.");
      setIsSaving(false);
      return false;
    }
  };

  const deleteAccountWithStrategy = async (
    accountId: string,
    strategy: "transfer" | "archive",
    transferTargetId?: string
  ): Promise<boolean> => {
    if (!userId) return false;
    setIsSaving(true);

    const previousAccounts = [...accounts];
    const previousTransactions = [...transactions];

    // Optimistic Update
    const remainingAccs = accounts.filter((a) => a.id !== accountId);
    setAccounts(remainingAccs);

    if (strategy === "transfer" && transferTargetId) {
      setTransactions((prev) =>
        prev.map((t) => {
          const updated = { ...t };
          if (updated.accountId === accountId) updated.accountId = transferTargetId;
          if (updated.fundingAccountId === accountId) updated.fundingAccountId = transferTargetId;
          if (updated.targetAccountId === accountId) updated.targetAccountId = transferTargetId;
          return updated;
        })
      );
    } else {
      // Archive strategy: delete connected transactions
      setTransactions((prev) =>
        prev.filter(
          (t) =>
            t.accountId !== accountId &&
            t.fundingAccountId !== accountId &&
            t.targetAccountId !== accountId
        )
      );
    }

    try {
      if (strategy === "transfer" && transferTargetId) {
        // Find and update connected transactions in DB first
        const affectedTxs = transactions.filter(
          (t) =>
            t.accountId === accountId ||
            t.fundingAccountId === accountId ||
            t.targetAccountId === accountId
        );

        await Promise.all(
          affectedTxs.map((t) => {
            const updated = { ...t };
            if (updated.accountId === accountId) updated.accountId = transferTargetId;
            if (updated.fundingAccountId === accountId) updated.fundingAccountId = transferTargetId;
            if (updated.targetAccountId === accountId) updated.targetAccountId = transferTargetId;
            return updateTransaction(supabase, updated, userId);
          })
        );
      } else {
        // Archive strategy: delete connected transactions in DB
        const affectedTxs = transactions.filter(
          (t) =>
            t.accountId === accountId ||
            t.fundingAccountId === accountId ||
            t.targetAccountId === accountId
        );
        await Promise.all(affectedTxs.map((t) => deleteTransaction(supabase, t.id, userId)));
      }

      await deleteAccount(supabase, accountId, userId);
      setIsSaving(false);
      return true;
    } catch (err: any) {
      setAccounts(previousAccounts); // Rollback
      setTransactions(previousTransactions); // Rollback
      setAlertMessage(err.message || "Failed to complete account deletion.");
      setIsSaving(false);
      return false;
    }
  };

  const saveTransaction = async (
    txInput: Parameters<typeof validateTransactionInput>[0] & { id?: string }
  ): Promise<boolean> => {
    if (!userId) return false;
    const valResult = validateTransactionInput(txInput);
    if (!valResult.success) {
      setAlertMessage(valResult.error);
      return false;
    }

    setIsSaving(true);
    const validatedData = valResult.data;
    const isEdit = !!txInput.id;
    const previousTransactions = [...transactions];

    // Optimistic Update
    const tempId = txInput.id || crypto.randomUUID();
    const optimisticTx: RecurringTransaction = { ...validatedData, id: tempId };

    if (isEdit) {
      setTransactions((prev) => prev.map((t) => (t.id === txInput.id ? optimisticTx : t)));
    } else {
      setTransactions((prev) => [...prev, optimisticTx]);
    }

    try {
      if (isEdit) {
        const updated = await updateTransaction(
          supabase,
          { ...validatedData, id: txInput.id! },
          userId
        );
        setTransactions((prev) => prev.map((t) => (t.id === txInput.id ? updated : t)));
      } else {
        const inserted = await insertTransaction(supabase, validatedData, userId);
        setTransactions((prev) => prev.map((t) => (t.id === tempId ? inserted : t)));
      }
      setIsSaving(false);
      return true;
    } catch (err: any) {
      setTransactions(previousTransactions); // Rollback
      setAlertMessage(err.message || "Failed to save transaction to database.");
      setIsSaving(false);
      return false;
    }
  };

  const deleteTransactionById = async (txId: string): Promise<boolean> => {
    if (!userId) return false;
    setIsSaving(true);

    const previousTransactions = [...transactions];

    // Optimistic Update
    setTransactions((prev) => prev.filter((t) => t.id !== txId));

    try {
      await deleteTransaction(supabase, txId, userId);
      setIsSaving(false);
      return true;
    } catch (err: any) {
      setTransactions(previousTransactions); // Rollback
      setAlertMessage(err.message || "Failed to delete transaction from database.");
      setIsSaving(false);
      return false;
    }
  };

  const toggleVerifyOverride = async (transactionId: string, dateStr: string): Promise<void> => {
    if (!userId) return;

    const existingIndex = transactionOverrides.findIndex(
      (o) => o.transactionId === transactionId && o.dateStr === dateStr
    );
    const previousOverrides = [...transactionOverrides];
    let newOverrides = [...transactionOverrides];

    const isExisting = existingIndex > -1;
    const existing = isExisting ? transactionOverrides[existingIndex] : null;
    const shouldDelete = existing && existing.status === "verified";

    if (shouldDelete) {
      newOverrides.splice(existingIndex, 1);
    } else if (existing) {
      newOverrides[existingIndex] = {
        ...existing,
        status: "verified",
        customAmount: undefined,
      };
    } else {
      newOverrides.push({
        id: crypto.randomUUID(), // Temp client ID
        transactionId,
        dateStr,
        status: "verified",
      });
    }

    setTransactionOverrides(newOverrides);

    // Sync selected day detail UI if active
    if (selectedDay) {
      const activeTimeline = generateForecast({
        startDate: parseDateLocal(launchDateStr),
        numberOfDays: 120,
        accounts,
        transactions,
        overrides: newOverrides,
      });
      const updatedDay = activeTimeline.find((d) => d.dateStr === selectedDay.dateStr);
      setSelectedDay(updatedDay || null);
    }

    try {
      if (shouldDelete) {
        await deleteOverride(supabase, transactionId, dateStr, userId);
      } else {
        const payload = existing
          ? { ...existing, status: "verified" as const, customAmount: undefined }
          : { transactionId, dateStr, status: "verified" as const };
        const saved = await upsertOverride(supabase, payload, userId);
        setTransactionOverrides((prev) =>
          prev.map((o) => (o.transactionId === transactionId && o.dateStr === dateStr ? saved : o))
        );
      }
    } catch (err: any) {
      setTransactionOverrides(previousOverrides); // Rollback
      setAlertMessage(err.message || "Failed to update override in database.");
    }
  };

  const skipOverride = async (transactionId: string, dateStr: string): Promise<void> => {
    if (!userId) return;

    const existingIndex = transactionOverrides.findIndex(
      (o) => o.transactionId === transactionId && o.dateStr === dateStr
    );
    const previousOverrides = [...transactionOverrides];
    let newOverrides = [...transactionOverrides];

    const isExisting = existingIndex > -1;
    const existing = isExisting ? transactionOverrides[existingIndex] : null;
    const shouldDelete = existing && existing.status === "skipped";

    if (shouldDelete) {
      newOverrides.splice(existingIndex, 1);
    } else if (existing) {
      newOverrides[existingIndex] = {
        ...existing,
        status: "skipped",
        customAmount: undefined,
      };
    } else {
      newOverrides.push({
        id: crypto.randomUUID(),
        transactionId,
        dateStr,
        status: "skipped",
      });
    }

    setTransactionOverrides(newOverrides);

    if (selectedDay) {
      const activeTimeline = generateForecast({
        startDate: parseDateLocal(launchDateStr),
        numberOfDays: 120,
        accounts,
        transactions,
        overrides: newOverrides,
      });
      const updatedDay = activeTimeline.find((d) => d.dateStr === selectedDay.dateStr);
      setSelectedDay(updatedDay || null);
    }

    try {
      if (shouldDelete) {
        await deleteOverride(supabase, transactionId, dateStr, userId);
      } else {
        const payload = existing
          ? { ...existing, status: "skipped" as const, customAmount: undefined }
          : { transactionId, dateStr, status: "skipped" as const };
        const saved = await upsertOverride(supabase, payload, userId);
        setTransactionOverrides((prev) =>
          prev.map((o) => (o.transactionId === transactionId && o.dateStr === dateStr ? saved : o))
        );
      }
    } catch (err: any) {
      setTransactionOverrides(previousOverrides);
      setAlertMessage(err.message || "Failed to skip transaction in database.");
    }
  };

  const modifyAmountOverride = async (
    transactionId: string,
    dateStr: string,
    customAmt: number
  ): Promise<void> => {
    if (!userId) return;

    const existingIndex = transactionOverrides.findIndex(
      (o) => o.transactionId === transactionId && o.dateStr === dateStr
    );
    const previousOverrides = [...transactionOverrides];
    let newOverrides = [...transactionOverrides];

    const isExisting = existingIndex > -1;
    if (isExisting) {
      newOverrides[existingIndex] = {
        ...newOverrides[existingIndex],
        status: "modified",
        customAmount: customAmt,
      };
    } else {
      newOverrides.push({
        id: crypto.randomUUID(),
        transactionId,
        dateStr,
        status: "modified",
        customAmount: customAmt,
      });
    }

    setTransactionOverrides(newOverrides);
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
      const updatedDay = activeTimeline.find((d) => d.dateStr === selectedDay.dateStr);
      setSelectedDay(updatedDay || null);
    }

    try {
      const payload = isExisting
        ? { ...transactionOverrides[existingIndex], status: "modified" as const, customAmount: customAmt }
        : { transactionId, dateStr, status: "modified" as const, customAmount: customAmt };
      const saved = await upsertOverride(supabase, payload, userId);
      setTransactionOverrides((prev) =>
        prev.map((o) => (o.transactionId === transactionId && o.dateStr === dateStr ? saved : o))
      );
    } catch (err: any) {
      setTransactionOverrides(previousOverrides);
      setAlertMessage(err.message || "Failed to save modified amount override.");
    }
  };

  const updateLaunchDateInDb = async (newDate: string): Promise<boolean> => {
    if (!userId) return false;
    setIsSaving(true);
    const previousLaunchDate = launchDateStr;
    setLaunchDateStr(newDate);

    // Auto-adjust traditional calendar view to match the selected Starting Date
    const d = parseDateLocal(newDate);
    setCalendarYear(d.getFullYear());
    setCalendarMonth(d.getMonth());

    try {
      await updateLaunchDate(supabase, userId, newDate);
      setIsSaving(false);
      return true;
    } catch (err: any) {
      setLaunchDateStr(previousLaunchDate); // Rollback
      setAlertMessage(err.message || "Failed to update launch starting date.");
      setIsSaving(false);
      return false;
    }
  };

  const completeOnboarding = async (
    wizAccs: Account[],
    wizTxs: RecurringTransaction[],
    wizSavingsEnabled: boolean,
    wizSavingsTitle: string,
    wizSavingsAmount: string,
    wizSavingsFrequency: string,
    wizSavingsStartDate: string,
    wizSavingsFundingId: string,
    wizSavingsAccountId: string
  ): Promise<boolean> => {
    if (!userId) return false;
    setIsSaving(true);

    try {
      const accountIdMap: Record<string, string> = {};

      // 1. Insert accounts sequentially
      for (const acc of wizAccs) {
        const { id, ...payload } = acc;
        const inserted = await insertAccount(supabase, payload, userId);
        accountIdMap[id] = inserted.id;
      }

      // 2. Format and map transactions
      const finalTxs: Omit<RecurringTransaction, "id">[] = [];

      for (const tx of wizTxs) {
        const { id, ...txPayload } = tx;

        // Map Account IDs to database values
        if (txPayload.accountId && accountIdMap[txPayload.accountId]) {
          txPayload.accountId = accountIdMap[txPayload.accountId];
        }
        if (txPayload.fundingAccountId && accountIdMap[txPayload.fundingAccountId]) {
          txPayload.fundingAccountId = accountIdMap[txPayload.fundingAccountId];
        }
        if (txPayload.targetAccountId && accountIdMap[txPayload.targetAccountId]) {
          txPayload.targetAccountId = accountIdMap[txPayload.targetAccountId];
        }

        finalTxs.push(txPayload);
      }

      // Add savings contributions if enabled
      if (wizSavingsEnabled && wizSavingsTitle.trim()) {
        const svAmt = parseFloat(wizSavingsAmount);
        if (svAmt > 0 && wizSavingsFundingId && wizSavingsAccountId) {
          finalTxs.push({
            title: wizSavingsTitle.trim(),
            amount: svAmt,
            startDate: wizSavingsStartDate || launchDateStr,
            frequency: wizSavingsFrequency as any,
            category: "savings",
            fundingAccountId: accountIdMap[wizSavingsFundingId],
            targetAccountId: accountIdMap[wizSavingsAccountId],
          });
        }
      }

      // 3. Insert transactions sequentially
      for (const tx of finalTxs) {
        await insertTransaction(supabase, tx, userId);
      }

      // 4. Update onboarding flag in settings
      await updateOnboardingCompleted(supabase, userId, true);

      // 5. Hydrate latest data from DB
      const [latestAccs, latestTxs] = await Promise.all([
        fetchAccounts(supabase, userId),
        fetchTransactions(supabase, userId),
      ]);

      setAccounts(latestAccs);
      setTransactions(latestTxs);
      setOnboardingCompleted(true);
      setIsSaving(false);
      return true;
    } catch (err: any) {
      setAlertMessage(err.message || "Failed to complete the onboarding process.");
      setIsSaving(false);
      return false;
    }
  };

  const handleClearAllData = () => {
    if (!userId) return;
    setConfirmDialog({
      isOpen: true,
      title: "Clear All Data",
      message: "Are you sure you want to clear all accounts, transactions, and start fresh?",
      onConfirm: async () => {
        setIsSaving(true);
        try {
          // Clear DB tables
          await Promise.all([
            supabase.from("transaction_overrides").delete().eq("user_id", userId),
            supabase.from("transactions").delete().eq("user_id", userId),
            supabase.from("accounts").delete().eq("user_id", userId),
          ]);

          // Create a primary default Checking account
          const defaultChecking = await insertAccount(
            supabase,
            {
              name: "Primary Checking",
              type: "checking",
              balance: 0,
            },
            userId
          );

          // Reset local states
          setAccounts([defaultChecking]);
          setTransactions([]);
          setTransactionOverrides([]);
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
          setIsSaving(false);
        } catch (err: any) {
          setAlertMessage(err.message || "Failed to clear account details.");
          setIsSaving(false);
        }
      },
    });
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  if (!mounted) {
    return null;
  }

  return (
    <FinancialOSContext.Provider
      value={{
        accounts,
        transactions,
        transactionOverrides,
        launchDateStr,
        onboardingCompleted,
        userId,
        loading,
        isSaving,

        activeTab,
        expenseSubTab,
        isMobileMenuOpen,
        dashboardAccountFilter,
        dashboardViewMode,
        forecastRange,
        calendarYear,
        calendarMonth,

        selectedDay,
        isAddingTransaction,
        formCategory,
        editingId,
        wizardStep,
        wizardError,
        isPayoffPlannerOpen,
        payoffStrategy,
        payoffExtraBudget,
        editingAccountId,
        isAddingAccount,
        deletingAccount,
        deleteAccountTransferTargetId,
        deleteActionChoice,
        selectedDetailTransaction,
        overrideEditingTxId,
        overrideCustomAmountInput,

        confirmDialog,
        alertMessage,

        setActiveTab,
        setExpenseSubTab,
        setIsMobileMenuOpen,
        setDashboardAccountFilter,
        setDashboardViewMode,
        setForecastRange,
        setCalendarYear,
        setCalendarMonth,
        setConfirmDialog,
        setAlertMessage,
        setSelectedDay,
        setIsAddingTransaction,
        setFormCategory,
        setEditingId,
        setWizardStep,
        setWizardError,
        setIsPayoffPlannerOpen,
        setPayoffStrategy,
        setPayoffExtraBudget,
        setEditingAccountId,
        setIsAddingAccount,
        setDeletingAccount,
        setDeleteAccountTransferTargetId,
        setDeleteActionChoice,
        setSelectedDetailTransaction,
        setOverrideEditingTxId,
        setOverrideCustomAmountInput,

        initialBalance,
        forecast,
        calendarForecastTimeline,
        lowBalanceAlerts,
        categorizedTransactions,

        saveAccount,
        deleteAccountWithStrategy,
        saveTransaction,
        deleteTransactionById,
        toggleVerifyOverride,
        skipOverride,
        modifyAmountOverride,
        updateLaunchDateInDb,
        completeOnboarding,
        handleClearAllData,
        signOut,
      }}
    >
      {children}
    </FinancialOSContext.Provider>
  );
};

export const useFinancialData = () => {
  const context = useContext(FinancialOSContext);
  if (context === undefined) {
    throw new Error("useFinancialData must be used within a FinancialOSProvider");
  }
  return context;
};
