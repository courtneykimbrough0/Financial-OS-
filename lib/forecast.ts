// Data model and helpers for recurring transactions and forecasting
import { getDaysInRange } from "@/lib/utils";

export type TransactionCategory = 'income' | 'fixed-expense' | 'subscription' | 'liability' | 'savings';
export type TransactionFrequency = 'daily' | 'weekly' | 'biweekly' | 'semimonthly' | 'monthly' | 'quarterly' | 'yearly';

export interface RecurringTransaction {
  id: string;
  title: string;
  amount: number;
  startDate: string; // YYYY-MM-DD
  frequency: TransactionFrequency;
  category: TransactionCategory;
  semiMonthlyDays?: number[]; // e.g. [1, 15]
  notes?: string;
}

export interface ForecastDay {
  date: Date;
  dateStr: string; // YYYY-MM-DD
  startingBalance: number;
  incoming: number;
  outgoing: number; // Fixed, Subscriptions, Liabilities, Savings
  endingBalance: number;
  transactions: {
    item: RecurringTransaction;
    amount: number;
  }[];
}

// Format date helper (YYYY-MM-DD local)
export function formatDateLocal(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Parse local YYYY-MM-DD string to Date object
export function parseDateLocal(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

// Match monthly dates, accounting for end-of-month differences
export function isMonthlyMatch(day: Date, startDay: Date): boolean {
  const targetDom = startDay.getDate();
  const currentDom = day.getDate();
  
  if (currentDom === targetDom) return true;
  
  if (targetDom > 28) {
    const nextDay = new Date(day);
    nextDay.setDate(day.getDate() + 1);
    // If the next day is a different month, this day is the last day of the month
    if (nextDay.getMonth() !== day.getMonth() && currentDom < targetDom) {
      return true;
    }
  }
  return false;
}

// Match quarterly dates, every 3 months
export function isQuarterlyMatch(day: Date, startDay: Date): boolean {
  if (!isMonthlyMatch(day, startDay)) return false;
  const diffMonths = (day.getFullYear() - startDay.getFullYear()) * 12 + (day.getMonth() - startDay.getMonth());
  return diffMonths >= 0 && diffMonths % 3 === 0;
}

// Match yearly dates
export function isYearlyMatch(day: Date, startDay: Date): boolean {
  return day.getMonth() === startDay.getMonth() && isMonthlyMatch(day, startDay);
}

// Check if a transaction occurs on a specific day
export function isTransactionOccurring(day: Date, transaction: RecurringTransaction): boolean {
  const tStart = parseDateLocal(transaction.startDate);
  
  // Truncate times for accurate date-only comparison
  const dTrunc = new Date(day.getFullYear(), day.getMonth(), day.getDate());
  const sTrunc = new Date(tStart.getFullYear(), tStart.getMonth(), tStart.getDate());
  
  if (dTrunc < sTrunc) return false; // Haven't started yet
  
  switch (transaction.frequency) {
    case 'daily':
      return true;
      
    case 'weekly':
      return dTrunc.getDay() === sTrunc.getDay();
      
    case 'biweekly': {
      const diffTime = dTrunc.getTime() - sTrunc.getTime();
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
      return diffDays >= 0 && diffDays % 14 === 0;
    }
    
    case 'semimonthly': {
      const dom = dTrunc.getDate();
      const days = transaction.semiMonthlyDays || [1, 15];
      return days.includes(dom);
    }
    
    case 'monthly':
      return isMonthlyMatch(dTrunc, sTrunc);
      
    case 'quarterly':
      return isQuarterlyMatch(dTrunc, sTrunc);
      
    case 'yearly':
      return isYearlyMatch(dTrunc, sTrunc);
      
    default:
      return false;
  }
}

// Generate complete forecast list
export function generateForecast({
  startDate,
  numberOfDays,
  initialBalance,
  transactions,
}: {
  startDate: Date;
  numberOfDays: number;
  initialBalance: number;
  transactions: RecurringTransaction[];
}): ForecastDay[] {
  const forecast: ForecastDay[] = [];
  let currentBalance = initialBalance;
  
  const end = new Date(startDate);
  end.setDate(startDate.getDate() + numberOfDays - 1);
  
  const days = getDaysInRange(startDate, end);
  
  for (const day of days) {
    const startingBalance = currentBalance;
    let incoming = 0;
    let outgoing = 0;
    const dayTransactions: { item: RecurringTransaction; amount: number }[] = [];
    
    for (const t of transactions) {
      if (isTransactionOccurring(day, t)) {
        if (t.category === 'income') {
          incoming += t.amount;
          dayTransactions.push({ item: t, amount: t.amount });
        } else {
          outgoing += t.amount;
          dayTransactions.push({ item: t, amount: -t.amount });
        }
      }
    }
    
    currentBalance = startingBalance + incoming - outgoing;
    
    forecast.push({
      date: day,
      dateStr: formatDateLocal(day),
      startingBalance,
      incoming,
      outgoing,
      endingBalance: currentBalance,
      transactions: dayTransactions,
    });
  }
  
  return forecast;
}

// Default starting transactions is clean / empty for real user data
export const DEFAULT_TRANSACTIONS: RecurringTransaction[] = [];

// Optional sample template data if requested
export const SAMPLE_TRANSACTIONS: RecurringTransaction[] = [
  {
    id: "t1",
    title: "Primary Direct Earnings",
    amount: 3200,
    startDate: "2026-07-01",
    frequency: "semimonthly",
    category: "income",
    semiMonthlyDays: [1, 15],
    notes: "Primary salary transfer.",
  },
  {
    id: "t2",
    title: "Apartment Rental Payment",
    amount: 1400,
    startDate: "2026-07-01",
    frequency: "monthly",
    category: "fixed-expense",
    notes: "Monthly apartment lease rent.",
  },
  {
    id: "t3",
    title: "Entertainment Streaming Subscription",
    amount: 24,
    startDate: "2026-07-05",
    frequency: "monthly",
    category: "subscription",
    notes: "Premium streaming media bundle.",
  }
];

