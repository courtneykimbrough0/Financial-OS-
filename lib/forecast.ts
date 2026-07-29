// Data model and helpers for recurring transactions and forecasting
import { getDaysInRange } from "@/lib/utils";

export type TransactionCategory = 'income' | 'fixed-expense' | 'subscription' | 'liability' | 'savings';
export type TransactionFrequency = 'daily' | 'weekly' | 'biweekly' | 'semimonthly' | 'monthly' | 'quarterly' | 'yearly';

export interface Account {
  id: string;
  name: string;
  type: 'checking' | 'savings' | 'credit-card' | 'other';
  customType?: string; // Must be filled if type is 'other'
  balance: number; // For cash accounts, current cash. For credit cards, outstanding balance (amount owed).
}

export interface RecurringTransaction {
  id: string;
  title: string;
  amount: number;
  startDate: string; // YYYY-MM-DD
  frequency: TransactionFrequency;
  category: TransactionCategory;
  semiMonthlyDays?: number[]; // e.g. [1, 15]
  notes?: string;
  accountId?: string; // Primary account connected (for income, fixed-expense, subscription)
  fundingAccountId?: string; // Funding source (checking/savings) for liability/savings payments
  targetAccountId?: string; // Destination account (e.g., credit-card outstanding balance or savings account)
}

export interface ForecastDay {
  date: Date;
  dateStr: string; // YYYY-MM-DD
  startingBalance: number; // Net total cash reserve (all cash accounts - credit card liabilities)
  incoming: number;
  outgoing: number; // Fixed, Subscriptions, Liabilities, Savings
  endingBalance: number; // Net total cash reserve at end of day
  transactions: {
    item: RecurringTransaction;
    amount: number;
  }[];
  accountBalances: Record<string, number>; // Individual account balances at the end of the day
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
  initialBalance = 0,
  accounts = [],
  transactions,
}: {
  startDate: Date;
  numberOfDays: number;
  initialBalance?: number;
  accounts?: Account[];
  transactions: RecurringTransaction[];
}): ForecastDay[] {
  const forecast: ForecastDay[] = [];
  
  // Backwards compatibility check
  let activeAccounts = [...accounts];
  if (activeAccounts.length === 0) {
    activeAccounts = [
      {
        id: "acc_checking",
        name: "Primary Checking",
        type: "checking",
        balance: initialBalance,
      }
    ];
  }

  // Clone current account balances to simulate their progression
  const currentBalances: Record<string, number> = {};
  for (const acc of activeAccounts) {
    currentBalances[acc.id] = acc.balance;
  }
  
  const end = new Date(startDate);
  end.setDate(startDate.getDate() + numberOfDays - 1);
  
  const days = getDaysInRange(startDate, end);
  
  for (const day of days) {
    let incoming = 0;
    let outgoing = 0;
    const dayTransactions: { item: RecurringTransaction; amount: number }[] = [];
    
    // Store starting balances for this day
    const dayStartingBalances = { ...currentBalances };
    
    for (const t of transactions) {
      if (isTransactionOccurring(day, t)) {
        const amt = t.amount;
        
        if (t.category === 'income') {
          incoming += amt;
          dayTransactions.push({ item: t, amount: amt });
          
          // Deposit into connected account
          const accId = t.accountId || (activeAccounts.find(a => a.type === 'checking')?.id) || (activeAccounts[0]?.id);
          if (accId && currentBalances[accId] !== undefined) {
            currentBalances[accId] += amt;
          }
        } else {
          outgoing += amt;
          dayTransactions.push({ item: t, amount: -amt });
          
          if (t.category === 'liability') {
            // Paid from funding account (checking/savings)
            const fundAccId = t.fundingAccountId || (activeAccounts.find(a => a.type === 'checking')?.id) || (activeAccounts[0]?.id);
            if (fundAccId && currentBalances[fundAccId] !== undefined) {
              currentBalances[fundAccId] -= amt;
            }
            // Reduce target credit liability account outstanding balance (bringing it closer to zero)
            const targetAccId = t.targetAccountId;
            if (targetAccId && currentBalances[targetAccId] !== undefined) {
              currentBalances[targetAccId] = Math.max(0, currentBalances[targetAccId] - amt);
            }
          } else if (t.category === 'savings') {
            // Transfer from checking to savings
            const fundAccId = t.fundingAccountId || (activeAccounts.find(a => a.type === 'checking')?.id) || (activeAccounts[0]?.id);
            if (fundAccId && currentBalances[fundAccId] !== undefined) {
              currentBalances[fundAccId] -= amt;
            }
            const targetAccId = t.targetAccountId || (activeAccounts.find(a => a.type === 'savings')?.id);
            if (targetAccId && currentBalances[targetAccId] !== undefined) {
              currentBalances[targetAccId] += amt;
            }
          } else {
            // Fixed expense or subscription paid from account
            const accId = t.accountId || (activeAccounts.find(a => a.type === 'checking')?.id) || (activeAccounts[0]?.id);
            if (accId && currentBalances[accId] !== undefined) {
              currentBalances[accId] -= amt;
            }
          }
        }
      }
    }
    
    // Net cash total is sum of cash accounts minus outstanding credit card balances
    let totalCashSum = 0;
    for (const acc of activeAccounts) {
      const bal = currentBalances[acc.id];
      if (acc.type === 'credit-card') {
        totalCashSum -= bal;
      } else {
        totalCashSum += bal;
      }
    }
    
    // Day starting net cash total
    let totalStartCashSum = 0;
    for (const acc of activeAccounts) {
      const bal = dayStartingBalances[acc.id];
      if (acc.type === 'credit-card') {
        totalStartCashSum -= bal;
      } else {
        totalStartCashSum += bal;
      }
    }
    
    forecast.push({
      date: day,
      dateStr: formatDateLocal(day),
      startingBalance: totalStartCashSum,
      incoming,
      outgoing,
      endingBalance: totalCashSum,
      transactions: dayTransactions,
      accountBalances: { ...currentBalances },
    });
  }
  
  return forecast;
}

// Default starting transactions is clean / empty for real user data
export const DEFAULT_TRANSACTIONS: RecurringTransaction[] = [];

// Sample Accounts
export const SAMPLE_ACCOUNTS: Account[] = [
  {
    id: "acc_checking",
    name: "Primary Checking",
    type: "checking",
    balance: 3500,
  },
  {
    id: "acc_savings",
    name: "Security Pot",
    type: "savings",
    balance: 1500,
  },
  {
    id: "acc_credit",
    name: "Reserve Card",
    type: "credit-card",
    balance: 450,
  }
];

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
    accountId: "acc_checking",
    notes: "Primary salary deposit.",
  },
  {
    id: "t2",
    title: "Apartment Rental Payment",
    amount: 1400,
    startDate: "2026-07-01",
    frequency: "monthly",
    category: "fixed-expense",
    accountId: "acc_checking",
    notes: "Monthly apartment lease rent.",
  },
  {
    id: "t3",
    title: "Entertainment Subscription",
    amount: 24,
    startDate: "2026-07-05",
    frequency: "monthly",
    category: "subscription",
    accountId: "acc_checking",
    notes: "Premium media bundle.",
  },
  {
    id: "t4",
    title: "Reserve Card Minimum Payment",
    amount: 35,
    startDate: "2026-07-20",
    frequency: "monthly",
    category: "liability",
    fundingAccountId: "acc_checking",
    targetAccountId: "acc_credit",
    notes: "Minimum payment for credit account.",
  }
];


