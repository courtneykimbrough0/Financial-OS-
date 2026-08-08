"use client";

import React, { createContext, useContext, useState, useEffect, useMemo } from "react";
import { createClient } from "@/utils/supabase/client";
import {
  RecurringTransaction,
  TransactionOverride,
  ForecastDay,
  generateForecast,
  formatDateLocal,
} from "@/lib/forecast";
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
  upsertSplitOverride,
} from "@/lib/data/overrides";
import {
  fetchUserSettings,
  createUserSettings,
  updateOnboardingCompleted,
  updateCurrentBalance,
  updateLowBalanceAlert,
} from "@/lib/data/settings";
import { validateTransactionInput } from "@/lib/validation";

interface ConfirmDialogState {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
}

interface FinancialOSContextType {
  // Core Data
  transactions: RecurringTransaction[];
  transactionOverrides: TransactionOverride[];
  onboardingCompleted: boolean;
  userId: string | null;
  loading: boolean;
  isSaving: boolean;

  // Settings
  currentBalance: number | null;
  lowBalanceAlert: number | null;

  // View Settings
  activeTab: "dashboard" | "income" | "expenses" | "liabilities" | "settings";
  expenseSubTab: "all" | "fixed" | "subscriptions" | "savings";
  isMobileMenuOpen: boolean;
  dashboardViewMode: "calendar" | "analytics";
  forecastRange: "week" | "two-weeks" | "month" | "quarter";
  calendarYear: number;
  calendarMonth: number;

  // Selected Day Details / Modal states
  selectedDay: ForecastDay | null;
  isAddingTransaction: boolean;
  formCategory: "income" | "fixed-expense" | "subscription" | "liability" | "savings";
  editingId: string | null;
  wizardStep: number;
  wizardError: string | null;
  selectedDetailTransaction: RecurringTransaction | null;
  overrideEditingTxId: string | null;
  overrideCustomAmountInput: string;

  // Dialog Overlays
  confirmDialog: ConfirmDialogState;
  alertMessage: string | null;

  // State Setters
  setActiveTab: React.Dispatch<React.SetStateAction<"dashboard" | "income" | "expenses" | "liabilities" | "settings">>;
  setExpenseSubTab: React.Dispatch<React.SetStateAction<"all" | "fixed" | "subscriptions" | "savings">>;
  setIsMobileMenuOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setDashboardViewMode: React.Dispatch<React.SetStateAction<"calendar" | "analytics">>;
  setForecastRange: React.Dispatch<React.SetStateAction<"week" | "two-weeks" | "month" | "quarter">>;
  setCalendarYear: React.Dispatch<React.SetStateAction<number>>;
  setCalendarMonth: React.Dispatch<React.SetStateAction<number>>;
  setConfirmDialog: React.Dispatch<React.SetStateAction<ConfirmDialogState>>;
  setAlertMessage: React.Dispatch<React.SetStateAction<string | null>>;
  setSelectedDay: React.Dispatch<React.SetStateAction<ForecastDay | null>>;
  setIsAddingTransaction: React.Dispatch<React.SetStateAction<boolean>>;
  setFormCategory: React.Dispatch<
    React.SetStateAction<"income" | "fixed-expense" | "subscription" | "liability" | "savings">
  >;
  setEditingId: React.Dispatch<React.SetStateAction<string | null>>;
  setWizardStep: React.Dispatch<React.SetStateAction<number>>;
  setWizardError: React.Dispatch<React.SetStateAction<string | null>>;
  setSelectedDetailTransaction: React.Dispatch<React.SetStateAction<RecurringTransaction | null>>;
  setOverrideEditingTxId: React.Dispatch<React.SetStateAction<string | null>>;
  setOverrideCustomAmountInput: React.Dispatch<React.SetStateAction<string>>;

  // Derived calculations
  forecast: ForecastDay[];
  calendarForecastTimeline: ForecastDay[];
  lowBalanceAlerts: { dateStr: string; balance: number }[];
  categorizedTransactions: {
    income: RecurringTransaction[];
    fixedExpenses: RecurringTransaction[];
    subscriptions: RecurringTransaction[];
    savings: RecurringTransaction[];
    liabilities: RecurringTransaction[];
  };

  // Mutators
  saveTransaction: (
    txInput: Parameters<typeof validateTransactionInput>[0] & { id?: string }
  ) => Promise<boolean>;
  deleteTransactionById: (txId: string) => Promise<boolean>;
  markLiabilityPaidOff: (txId: string, asOfDateStr: string) => Promise<boolean>;
  toggleVerifyOverride: (transactionId: string, dateStr: string) => Promise<void>;
  skipOverride: (transactionId: string, dateStr: string) => Promise<void>;
  modifyAmountOverride: (transactionId: string, dateStr: string, customAmt: number) => Promise<void>;
  createSplitPayment: (transactionId: string, dueDateStr: string, parts: { amount: number; dateStr: string }[]) => Promise<boolean>;
  updateCurrentBalanceInDb: (value: number | null) => Promise<boolean>;
  updateLowBalanceAlertInDb: (value: number | null) => Promise<boolean>;
  completeOnboarding: (
    wizTxs: RecurringTransaction[],
    wizSavingsEnabled: boolean,
    wizSavingsTitle: string,
    wizSavingsAmount: string,
    wizSavingsFrequency: string,
    wizSavingsStartDate: string,
    wizSavingsTags?: string
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
  const [transactions, setTransactions] = useState<RecurringTransaction[]>([]);
  const [transactionOverrides, setTransactionOverrides] = useState<TransactionOverride[]>([]);
  const [onboardingCompleted, setOnboardingCompleted] = useState<boolean>(false);
  const [currentBalance, setCurrentBalance] = useState<number | null>(null);
  const [lowBalanceAlert, setLowBalanceAlert] = useState<number | null>(null);

  // View States
  const [activeTab, setActiveTab] = useState<
    "dashboard" | "income" | "expenses" | "liabilities" | "settings"
  >("dashboard");
  const [expenseSubTab, setExpenseSubTab] = useState<"all" | "fixed" | "subscriptions" | "savings">(
    "all"
  );
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [dashboardViewMode, setDashboardViewMode] = useState<"calendar" | "analytics">("calendar");
  const [forecastRange, setForecastRange] = useState<"week" | "two-weeks" | "month" | "quarter">(
    "month"
  );
  const now = new Date();
  const [calendarYear, setCalendarYear] = useState<number>(now.getFullYear());
  const [calendarMonth, setCalendarMonth] = useState<number>(now.getMonth());

  // Modals & Forms States
  const [selectedDay, setSelectedDay] = useState<ForecastDay | null>(null);
  const [isAddingTransaction, setIsAddingTransaction] = useState<boolean>(false);
  const [formCategory, setFormCategory] = useState<
    "income" | "fixed-expense" | "subscription" | "liability" | "savings"
  >("income");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [wizardStep, setWizardStep] = useState<number>(1);
  const [wizardError, setWizardError] = useState<string | null>(null);
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

          setOnboardingCompleted(settings.onboardingCompleted);
          setCurrentBalance(settings.currentBalance);
          setLowBalanceAlert(settings.lowBalanceAlert);

          // Fetch Core Collections
          const [txs, ovs] = await Promise.all([
            fetchTransactions(supabase, user.id),
            fetchOverrides(supabase, user.id),
          ]);

          if (active) {
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
  const forecast = useMemo(() => {
    if (loading) return [];
    const start = new Date();
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
      initialBalance: currentBalance ?? 0,
      transactions,
      overrides: transactionOverrides,
    });
  }, [forecastRange, currentBalance, transactions, transactionOverrides, loading]);

  const calendarForecastTimeline = useMemo(() => {
    if (loading) return [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endOfCalendar = new Date(calendarYear, calendarMonth + 3, 0);
    const diffTime = endOfCalendar.getTime() - today.getTime();
    const simDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 15);

    return generateForecast({
      startDate: today,
      numberOfDays: simDays,
      initialBalance: currentBalance ?? 0,
      transactions,
      overrides: transactionOverrides,
    });
  }, [calendarYear, calendarMonth, currentBalance, transactions, transactionOverrides, loading]);

  const lowBalanceAlerts = useMemo(() => {
    const alerts: { dateStr: string; balance: number }[] = [];
    if (loading || lowBalanceAlert === null) return alerts;

    for (const day of calendarForecastTimeline) {
      if (day.endingBalance < lowBalanceAlert) {
        alerts.push({ dateStr: day.dateStr, balance: day.endingBalance });
      }
    }
    return alerts.sort((a, b) => a.dateStr.localeCompare(b.dateStr)).slice(0, 5);
  }, [calendarForecastTimeline, lowBalanceAlert, loading]);

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
    const existingTx = isEdit ? transactions.find((t) => t.id === txInput.id) ?? null : null;

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
      // Rollback: restore only this transaction, not the whole array
      setTransactions((prev) =>
        existingTx ? prev.map((t) => (t.id === existingTx.id ? existingTx : t)) : prev.filter((t) => t.id !== tempId)
      );
      setAlertMessage(err.message || "Failed to save transaction to database.");
      setIsSaving(false);
      return false;
    }
  };

  const deleteTransactionById = async (txId: string): Promise<boolean> => {
    if (!userId) return false;
    setIsSaving(true);

    const existingTx = transactions.find((t) => t.id === txId) ?? null;

    // Optimistic Update
    setTransactions((prev) => prev.filter((t) => t.id !== txId));

    try {
      await deleteTransaction(supabase, txId, userId);
      setIsSaving(false);
      return true;
    } catch (err: any) {
      // Rollback: restore only this transaction, not the whole array
      setTransactions((prev) =>
        existingTx && !prev.some((t) => t.id === existingTx.id) ? [...prev, existingTx] : prev
      );
      setAlertMessage(err.message || "Failed to delete transaction from database.");
      setIsSaving(false);
      return false;
    }
  };

  const markLiabilityPaidOff = async (txId: string, asOfDateStr: string): Promise<boolean> => {
    if (!userId) return false;
    const existing = transactions.find((t) => t.id === txId);
    if (!existing) return false;

    setIsSaving(true);
    const previousTransactions = [...transactions];
    const updated: RecurringTransaction = { ...existing, endDate: asOfDateStr };

    // Optimistic Update
    setTransactions((prev) => prev.map((t) => (t.id === txId ? updated : t)));

    try {
      const saved = await updateTransaction(supabase, updated, userId);
      setTransactions((prev) => prev.map((t) => (t.id === txId ? saved : t)));
      setIsSaving(false);
      return true;
    } catch (err: any) {
      setTransactions(previousTransactions); // Rollback
      setAlertMessage(err.message || "Failed to mark liability as paid off.");
      setIsSaving(false);
      return false;
    }
  };

  const toggleVerifyOverride = async (transactionId: string, dateStr: string): Promise<void> => {
    if (!userId) return;

    const existingIndex = transactionOverrides.findIndex(
      (o) => o.transactionId === transactionId && o.dateStr === dateStr
    );
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
        startDate: new Date(),
        numberOfDays: 120,
        initialBalance: currentBalance ?? 0,
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
      // Rollback: restore only this override, not the whole array
      setTransactionOverrides((prev) =>
        existing
          ? prev.map((o) => (o.transactionId === transactionId && o.dateStr === dateStr ? existing : o))
          : prev.filter((o) => !(o.transactionId === transactionId && o.dateStr === dateStr))
      );
      setAlertMessage(err.message || "Failed to update override in database.");
    }
  };

  const skipOverride = async (transactionId: string, dateStr: string): Promise<void> => {
    if (!userId) return;

    const existingIndex = transactionOverrides.findIndex(
      (o) => o.transactionId === transactionId && o.dateStr === dateStr
    );
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
        startDate: new Date(),
        numberOfDays: 120,
        initialBalance: currentBalance ?? 0,
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
      // Rollback: restore only this override, not the whole array
      setTransactionOverrides((prev) =>
        existing
          ? prev.map((o) => (o.transactionId === transactionId && o.dateStr === dateStr ? existing : o))
          : prev.filter((o) => !(o.transactionId === transactionId && o.dateStr === dateStr))
      );
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
    let newOverrides = [...transactionOverrides];

    const isExisting = existingIndex > -1;
    const existing = isExisting ? transactionOverrides[existingIndex] : null;
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
        startDate: new Date(),
        numberOfDays: 120,
        initialBalance: currentBalance ?? 0,
        transactions,
        overrides: newOverrides,
      });
      const updatedDay = activeTimeline.find((d) => d.dateStr === selectedDay.dateStr);
      setSelectedDay(updatedDay || null);
    }

    try {
      const payload = existing
        ? { ...existing, status: "modified" as const, customAmount: customAmt }
        : { transactionId, dateStr, status: "modified" as const, customAmount: customAmt };
      const saved = await upsertOverride(supabase, payload, userId);
      setTransactionOverrides((prev) =>
        prev.map((o) => (o.transactionId === transactionId && o.dateStr === dateStr ? saved : o))
      );
    } catch (err: any) {
      // Rollback: restore only this override, not the whole array
      setTransactionOverrides((prev) =>
        existing
          ? prev.map((o) => (o.transactionId === transactionId && o.dateStr === dateStr ? existing : o))
          : prev.filter((o) => !(o.transactionId === transactionId && o.dateStr === dateStr))
      );
      setAlertMessage(err.message || "Failed to save modified amount override.");
    }
  };

  const createSplitPayment = async (
    transactionId: string,
    dueDateStr: string,
    parts: { amount: number; dateStr: string }[]
  ): Promise<boolean> => {
    if (!userId) return false;

    try {
      const saved = await upsertSplitOverride(supabase, transactionId, dueDateStr, parts, userId);

      setTransactionOverrides((prev) => {
        const without = prev.filter(
          (o) => !(o.transactionId === transactionId && o.dateStr === dueDateStr)
        );
        return [...without, saved];
      });

      if (selectedDay) {
        const activeTimeline = generateForecast({
          startDate: new Date(),
          numberOfDays: 120,
          initialBalance: currentBalance ?? 0,
          transactions,
          overrides: [...transactionOverrides.filter(
            (o) => !(o.transactionId === transactionId && o.dateStr === dueDateStr)
          ), saved],
        });
        const updatedDay = activeTimeline.find((d) => d.dateStr === selectedDay.dateStr);
        setSelectedDay(updatedDay || null);
      }

      return true;
    } catch (err: any) {
      // No optimistic write was applied before the request, so there is
      // nothing to roll back here — doing so would risk stomping an
      // unrelated concurrent update to transactionOverrides.
      setAlertMessage(err.message || "Failed to save split payment.");
      return false;
    }
  };

  const updateCurrentBalanceInDb = async (value: number | null): Promise<boolean> => {
    if (!userId) return false;
    setIsSaving(true);
    const previous = currentBalance;
    setCurrentBalance(value);
    try {
      await updateCurrentBalance(supabase, userId, value);
      setIsSaving(false);
      return true;
    } catch (err: any) {
      // Rollback only if nothing else has updated the balance since this
      // call's optimistic set — otherwise we'd stomp a newer, already-saved value.
      setCurrentBalance((current) => (current === value ? previous : current));
      setAlertMessage(err.message || "Failed to update current balance.");
      setIsSaving(false);
      return false;
    }
  };

  const updateLowBalanceAlertInDb = async (value: number | null): Promise<boolean> => {
    if (!userId) return false;
    setIsSaving(true);
    const previous = lowBalanceAlert;
    setLowBalanceAlert(value);
    try {
      await updateLowBalanceAlert(supabase, userId, value);
      setIsSaving(false);
      return true;
    } catch (err: any) {
      // Rollback only if nothing else has updated the threshold since this
      // call's optimistic set — otherwise we'd stomp a newer, already-saved value.
      setLowBalanceAlert((current) => (current === value ? previous : current));
      setAlertMessage(err.message || "Failed to update low balance alert threshold.");
      setIsSaving(false);
      return false;
    }
  };

  const completeOnboarding = async (
    wizTxs: RecurringTransaction[],
    wizSavingsEnabled: boolean,
    wizSavingsTitle: string,
    wizSavingsAmount: string,
    wizSavingsFrequency: string,
    wizSavingsStartDate: string,
    wizSavingsTags: string = ""
  ): Promise<boolean> => {
    if (!userId) return false;
    setIsSaving(true);

    try {
      const todayStr = formatDateLocal(new Date());
      const finalTxs: Omit<RecurringTransaction, "id">[] = wizTxs.map(({ id, ...txPayload }) => txPayload);

      // Add savings contributions if enabled
      if (wizSavingsEnabled && wizSavingsTitle.trim()) {
        const svAmt = parseFloat(wizSavingsAmount);
        if (svAmt > 0) {
          const tags = wizSavingsTags
            .split(",")
            .map((t) => t.trim())
            .filter((t) => t.length > 0);
          finalTxs.push({
            title: wizSavingsTitle.trim(),
            amount: svAmt,
            startDate: wizSavingsStartDate || todayStr,
            frequency: wizSavingsFrequency as any,
            category: "savings",
            tags: tags.length > 0 ? tags : undefined,
          });
        }
      }

      // Insert transactions sequentially
      for (const tx of finalTxs) {
        await insertTransaction(supabase, tx, userId);
      }

      // Update onboarding flag in settings
      await updateOnboardingCompleted(supabase, userId, true);

      // Hydrate latest data from DB
      const latestTxs = await fetchTransactions(supabase, userId);

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
      message: "Are you sure you want to clear all transactions and start fresh?",
      onConfirm: async () => {
        setIsSaving(true);
        try {
          // Clear DB tables
          await Promise.all([
            supabase.from("transaction_overrides").delete().eq("user_id", userId),
            supabase.from("transactions").delete().eq("user_id", userId),
          ]);
          await updateCurrentBalance(supabase, userId, 0);

          // Reset local states
          setTransactions([]);
          setTransactionOverrides([]);
          setCurrentBalance(0);
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
        transactions,
        transactionOverrides,
        onboardingCompleted,
        currentBalance,
        lowBalanceAlert,
        userId,
        loading,
        isSaving,

        activeTab,
        expenseSubTab,
        isMobileMenuOpen,
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
        selectedDetailTransaction,
        overrideEditingTxId,
        overrideCustomAmountInput,

        confirmDialog,
        alertMessage,

        setActiveTab,
        setExpenseSubTab,
        setIsMobileMenuOpen,
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
        setSelectedDetailTransaction,
        setOverrideEditingTxId,
        setOverrideCustomAmountInput,

        forecast,
        calendarForecastTimeline,
        lowBalanceAlerts,
        categorizedTransactions,

        saveTransaction,
        deleteTransactionById,
        markLiabilityPaidOff,
        toggleVerifyOverride,
        skipOverride,
        modifyAmountOverride,
        createSplitPayment,
        updateCurrentBalanceInDb,
        updateLowBalanceAlertInDb,
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
