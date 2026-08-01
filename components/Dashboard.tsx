"use client";

import React, { useMemo } from "react";
import { motion } from "motion/react";
import {
  BarChart3,
  Calendar as CalendarIcon,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  TrendingUp,
  Clock,
  DollarSign,
  Percent,
  Info,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart as RechartsBarChart,
  Bar,
} from "recharts";
import { useFinancialData } from "./FinancialOSContext";
import { parseDateLocal, generateForecast, formatDateLocal, ForecastDay } from "@/lib/forecast";

function getMondayOfWeek(d: Date): Date {
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const result = new Date(d);
  result.setDate(diff);
  return result;
}

export const Dashboard: React.FC = () => {
  const {
    activeTab,
    accounts,
    transactions,
    transactionOverrides,
    launchDateStr,
    loading,
    dashboardViewMode,
    setDashboardViewMode,
    dashboardAccountFilter,
    setDashboardAccountFilter,
    forecastRange,
    setForecastRange,
    calendarYear,
    setCalendarYear,
    calendarMonth,
    setCalendarMonth,
    selectedDay,
    setSelectedDay,
    lowBalanceAlerts,
    initialBalance,
    calendarForecastTimeline,
  } = useFinancialData();



  // Local helper for month names in mini calendars
  const calendarMonthLabel = useMemo(() => {
    return new Date(calendarYear, calendarMonth, 1).toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });
  }, [calendarYear, calendarMonth]);

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

  // Dynamic forecast timelines depending on the user's view selection
  const forecastTimeline = useMemo(() => {
    if (!launchDateStr || loading) return [];
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
  }, [launchDateStr, forecastRange, accounts, transactions, transactionOverrides, loading]);

  // Traditional Month Calendar Cell Grid
  const calendarCells = useMemo(() => {
    if (loading) return [];
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
      const dayForecast = calendarForecastTimeline.find((d) => d.dateStr === targetStr);
      cells.push({ date, isPadding: false, forecast: dayForecast });
    }

    return cells;
  }, [calendarYear, calendarMonth, calendarForecastTimeline, loading]);

  // Dynamic metrics tied 100% to what is actively displayed on the calendar view
  const activeMetrics = useMemo(() => {
    let income = 0;
    let fixedExpenses = 0;
    let subscriptions = 0;
    let liabilities = 0;
    let savings = 0;
    let endingBal = initialBalance;

    // Based on the selected timeframe view
    if (forecastRange === "week" || forecastRange === "two-weeks" || forecastRange === "quarter") {
      forecastTimeline.forEach((day, idx) => {
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
        if (idx === forecastTimeline.length - 1) {
          endingBal =
            dashboardAccountFilter && day.accountBalances
              ? (day.accountBalances[dashboardAccountFilter] ?? 0)
              : day.endingBalance;
        }
      });
    } else {
      // Month View: Sum up exactly across the active calendar month cells
      const activeDays = calendarCells.filter((cell) => !cell.isPadding && cell.forecast);
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
        endingBal =
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
      endingBalance: endingBal,
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
      payments: activeMetrics.expenses + activeMetrics.liabilities + activeMetrics.savings,
      endingBalance: activeMetrics.endingBalance,
      netChange,
    };
  }, [forecastTimeline, activeMetrics, dashboardAccountFilter]);

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

  if (activeTab !== "dashboard") return null;

  return (
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
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
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
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
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
                  $
                  {activeMetrics.spending.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
              <div className="w-px h-4 bg-white/10 shrink-0" />
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="text-zinc-400 font-medium text-[10px] sm:text-xs">Ending:</span>
                <span className="text-emerald-400 font-bold sm:text-sm whitespace-nowrap">
                  $
                  {activeMetrics.endingBalance.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
            </div>
          </div>

          {/* Calendar Second Row: Range buttons & Month Nav controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              {/* Projection Range Selector inside calendar div header */}
              <div className="flex bg-black/60 p-1 rounded-xl border border-white/10 w-full sm:w-auto justify-between sm:justify-start">
                {(["week", "two-weeks", "month", "quarter"] as const).map((range) => (
                  <button
                    key={range}
                    onClick={() => setForecastRange(range)}
                    className={`text-xs font-mono font-bold px-3 py-1.5 rounded-lg transition-all capitalize cursor-pointer ${
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
                    className="p-1.5 hover:bg-zinc-800 rounded-lg text-zinc-300 hover:text-white transition-colors cursor-pointer"
                    title="Previous Month"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <span className="text-xs font-bold px-2 text-white min-w-[100px] text-center">
                    {calendarMonthLabel}
                  </span>
                  <button
                    onClick={handleNextMonth}
                    className="p-1.5 hover:bg-zinc-800 rounded-lg text-zinc-300 hover:text-white transition-colors cursor-pointer"
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
            <div className="flex flex-col gap-3 mt-2">
              {forecastTimeline.map((day, idx) => {
                const isSelected = selectedDay && selectedDay.dateStr === day.dateStr;
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
                              ? day.accountBalances[dashboardAccountFilter] ?? 0
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

                          const accName =
                            accounts.find(
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
                                  <div className="text-xs font-bold text-zinc-200">{t.item.title}</div>
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
                                  {isIncome ? "+" : "-"}${Math.abs(t.amount).toLocaleString("en-US")}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-[10px] text-zinc-500 italic font-mono pl-4">
                        Nothing scheduled.
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* TRADITIONAL MONTH GRID VIEW */}
          {forecastRange === "month" && (
            <div className="flex flex-col gap-1.5 mt-2 overflow-x-auto">
              <div className="grid grid-cols-7 gap-1.5 text-center">
                {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map((day) => (
                  <div
                    key={day}
                    className="text-xs font-mono tracking-wider text-zinc-300 font-bold py-1"
                  >
                    {day}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
                {calendarCells.map((cell, idx) => {
                  if (cell.isPadding || !cell.date) {
                    return (
                      <div
                        key={`pad-${idx}`}
                        className="aspect-square bg-zinc-950/20 rounded-2xl border border-transparent opacity-10"
                      />
                    );
                  }

                  const dForecast = cell.forecast;
                  const dayNum = cell.date.getDate();
                  const isSelected = selectedDay && selectedDay.dateStr === dForecast?.dateStr;
                  const isLaunchDay = dForecast?.dateStr === launchDateStr;
                  const balance = dForecast
                    ? dashboardAccountFilter && dForecast.accountBalances
                      ? dForecast.accountBalances[dashboardAccountFilter] ?? 0
                      : dForecast.endingBalance
                    : 0;

                  const hasIncome =
                    dForecast && dForecast.transactions.some((t) => t.item.category === "income");
                  const hasExpense =
                    dForecast &&
                    dForecast.transactions.some(
                      (t) =>
                        t.item.category === "fixed-expense" || t.item.category === "subscription"
                    );
                  const hasLiability =
                    dForecast && dForecast.transactions.some((t) => t.item.category === "liability");
                  const hasSavings =
                    dForecast && dForecast.transactions.some((t) => t.item.category === "savings");

                  return (
                    <button
                      key={`cell-${idx}`}
                      onClick={() => dForecast && setSelectedDay(dForecast)}
                      className={`min-h-[60px] sm:aspect-square p-1.5 sm:p-2 flex flex-col justify-between text-left rounded-2xl transition-all duration-200 border cursor-pointer ${
                        isSelected
                          ? "bg-indigo-600/20 border-indigo-500 shadow-[0_0_12px_rgba(99,102,241,0.3)] scale-[1.02]"
                          : isLaunchDay
                          ? "bg-zinc-900 border-indigo-400/80"
                          : "bg-zinc-900/50 border-white/10 hover:border-zinc-700 hover:bg-zinc-900/80"
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span
                          className={`text-[11px] sm:text-xs font-mono font-bold ${
                            isLaunchDay ? "text-indigo-400" : "text-zinc-200"
                          }`}
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
                              />
                            )}
                            {hasExpense && (
                              <span
                                className="w-1.5 h-1.5 rounded-full bg-sky-400 shrink-0"
                                title="Expense"
                              />
                            )}
                            {hasLiability && (
                              <span
                                className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0"
                                title="Liability"
                              />
                            )}
                            {hasSavings && (
                              <span
                                className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0"
                                title="Savings"
                              />
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
                  const dayForecast = calendarForecastTimeline.find((d) => d.dateStr === targetStr);
                  miniCells.push({ date, forecast: dayForecast });
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
                      {["S", "M", "T", "W", "T", "F", "S"].map((lbl, i) => (
                        <div key={i} className="text-[8px] text-zinc-600 font-bold font-mono">
                          {lbl}
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-7 gap-1">
                      {miniCells.map((cell, idx) => {
                        if (!cell.date) {
                          return <div key={`mc-pad-${idx}`} className="aspect-square opacity-0" />;
                        }

                        const isSelected = selectedDay && selectedDay.dateStr === cell.forecast?.dateStr;
                        const balance = cell.forecast
                          ? dashboardAccountFilter && cell.forecast.accountBalances
                            ? cell.forecast.accountBalances[dashboardAccountFilter] ?? 0
                            : cell.forecast.endingBalance
                          : 0;
                        const dayNum = cell.date.getDate();

                        const hasIncome =
                          cell.forecast && cell.forecast.transactions.some((t) => t.item.category === "income");
                        const hasExpense =
                          cell.forecast &&
                          cell.forecast.transactions.some(
                            (t) =>
                              t.item.category === "fixed-expense" ||
                              t.item.category === "subscription"
                          );
                        const hasSavings =
                          cell.forecast && cell.forecast.transactions.some((t) => t.item.category === "savings");
                        const hasLiability =
                          cell.forecast && cell.forecast.transactions.some((t) => t.item.category === "liability");

                        return (
                          <button
                            key={`mc-cell-${idx}`}
                            onClick={() => cell.forecast && setSelectedDay(cell.forecast)}
                            className={`aspect-square p-0.5 rounded-[6px] text-center flex flex-col justify-between transition-all duration-150 border cursor-pointer ${
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
                              {hasIncome && <span className="w-0.5 h-0.5 rounded-full bg-emerald-400" />}
                              {hasExpense && <span className="w-0.5 h-0.5 rounded-full bg-sky-400" />}
                              {hasLiability && <span className="w-0.5 h-0.5 rounded-full bg-amber-400" />}
                              {hasSavings && <span className="w-0.5 h-0.5 rounded-full bg-cyan-400" />}
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
                  $
                  {analyticsSummary.startingBalance.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
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
                  +
                  $
                  {analyticsSummary.income.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
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
                  -
                  $
                  {analyticsSummary.payments.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </h4>
              </div>
            </div>

            {/* Net Period Change */}
            <div className="bg-zinc-900/40 border border-white/5 rounded-2xl p-4 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold font-mono tracking-wider text-zinc-400 uppercase">
                  Net Period Change
                </span>
                <h4
                  className={`text-base sm:text-lg font-bold mt-1 font-mono ${
                    analyticsSummary.netChange >= 0 ? "text-emerald-400" : "text-amber-400"
                  }`}
                >
                  {analyticsSummary.netChange >= 0 ? "+" : ""}
                  $
                  {analyticsSummary.netChange.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
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
                  $
                  {analyticsSummary.endingBalance.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
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
                        Your balance over time.
                      </div>
                      <div className="w-2 h-2 bg-zinc-950 border-r border-b border-white/10 rotate-45 -mt-1" />
                    </div>
                  </div>
                </div>

                {/* Period Badge */}
                <span className="text-[10px] font-mono font-bold uppercase bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1 rounded-lg text-indigo-300">
                  {forecastRange === "week"
                    ? "7-Day Week"
                    : forecastRange === "two-weeks"
                    ? "14-Day Outlook"
                    : forecastRange === "month"
                    ? "30-Day Outlook"
                    : "90-Day Quarter"}
                </span>
              </div>

              {/* Chart Container */}
              <div className="h-[280px] sm:h-[320px] w-full mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
                              <p className="text-[10px] font-bold text-zinc-400 font-mono">
                                {data.dateFormatted}
                              </p>
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-indigo-400" />
                                <p className="text-xs font-bold text-white font-mono">
                                  Balance:{" "}
                                  ${Math.round(data.Balance).toLocaleString("en-US", {
                                    minimumFractionDigits: 2,
                                  })}
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
                        Daily income and expenses.
                      </div>
                      <div className="w-2 h-2 bg-zinc-950 border-r border-b border-white/10 rotate-45 -mt-1" />
                    </div>
                  </div>
                </div>

                {/* Bar Chart Container */}
                <div className="h-[200px] w-full mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsBarChart
                      data={chartData.filter((d) => d.Income > 0 || d.Expenses > 0)}
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
                                <p className="text-[10px] font-bold text-zinc-400 font-mono">
                                  {data.dateFormatted}
                                </p>
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
                    </RechartsBarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Summary Insight Statement */}
              <div className="bg-black/40 border border-white/5 rounded-2xl p-4 mt-2 font-sans">
                <h4 className="text-xs font-bold text-zinc-300 flex items-center gap-1.5 mb-1">
                  <Info className="w-3.5 h-3.5 text-indigo-400" />
                  Outlook Assessment
                </h4>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  {analyticsSummary.netChange >= 0 ? (
                    <span>
                      In this {forecastRange === "quarter" ? "90-day quarter" : "outlook timeframe"},
                      liquid cash is projected to increase by{" "}
                      <strong className="text-emerald-400">
                        $
                        {analyticsSummary.netChange.toLocaleString("en-US", {
                          maximumFractionDigits: 0,
                        })}
                      </strong>
                      . Looking Good.
                    </span>
                  ) : (
                    <span>
                      In this {forecastRange === "quarter" ? "90-day quarter" : "outlook timeframe"},
                      liquid cash is projected to draw down by{" "}
                      <strong className="text-amber-400">
                        $
                        {Math.abs(analyticsSummary.netChange).toLocaleString("en-US", {
                          maximumFractionDigits: 0,
                        })}
                      </strong>
                      . Check Upcoming Events.
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
                Active Forecast Components
              </h3>
              <div className="relative flex items-center">
                <Info className="w-3.5 h-3.5 text-zinc-500 hover:text-zinc-300 cursor-help transition-colors" />
                <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover/tooltip:flex flex-col items-center z-20 w-64 pointer-events-none">
                  <div className="bg-zinc-950 border border-white/10 text-zinc-300 text-[11px] py-1.5 px-2.5 rounded-lg shadow-xl text-center leading-normal">
                    {dashboardAccountFilter
                      ? "Items affecting this account."
                      : "Items affecting this view."}
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
                      return (
                        !dashboardAccountFilter ||
                        tx.accountId === dashboardAccountFilter ||
                        tx.fundingAccountId === dashboardAccountFilter ||
                        tx.targetAccountId === dashboardAccountFilter
                      );
                    })
                    .map((tx) => {
                      const isIncome = tx.category === "income";
                      const isSavings = tx.category === "savings";
                      const isLiability = tx.category === "liability";
                      return (
                        <tr key={tx.id} className="hover:bg-white/5 transition-colors">
                          <td className="py-3 px-4 font-semibold text-zinc-200">{tx.title}</td>
                          <td className="py-3 px-4">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-bold capitalize ${
                                isIncome
                                  ? "bg-emerald-400/10 text-emerald-400 border border-emerald-400/20"
                                  : isSavings
                                  ? "bg-cyan-400/10 text-cyan-400 border border-cyan-400/20"
                                  : isLiability
                                  ? "bg-amber-400/10 text-amber-400 border border-amber-400/20"
                                  : "bg-sky-400/10 text-sky-400 border border-sky-400/20"
                              }`}
                            >
                              {tx.category.replace("-", " ")}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono text-zinc-400 capitalize">
                            {tx.frequency}
                          </td>
                          <td
                            className={`py-3 px-4 text-right font-mono font-bold ${
                              isIncome ? "text-emerald-400" : "text-sky-400"
                            }`}
                          >
                            {isIncome ? "+" : "-"}$
                            {Math.abs(tx.amount).toLocaleString("en-US", {
                              minimumFractionDigits: 2,
                            })}
                          </td>
                        </tr>
                      );
                    })}
                  {transactions.filter((tx) => {
                    return (
                      !dashboardAccountFilter ||
                      tx.accountId === dashboardAccountFilter ||
                      tx.fundingAccountId === dashboardAccountFilter ||
                      tx.targetAccountId === dashboardAccountFilter
                    );
                  }).length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-zinc-500 font-mono text-xs">
                        Nothing scheduled.
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
  );
};
export default Dashboard;
