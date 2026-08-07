// Data model and helpers for recurring transactions and forecasting
import { getDaysInRange } from "@/lib/utils";

export type TransactionCategory = 'income' | 'fixed-expense' | 'subscription' | 'liability' | 'savings' | 'transfer';
export type TransactionFrequency = 'daily' | 'weekly' | 'biweekly' | 'semimonthly' | 'monthly' | 'quarterly' | 'yearly' | 'onetime';

export interface TransactionOverride {
  id: string;
  transactionId: string;
  dateStr: string;
  status: 'verified' | 'skipped' | 'modified' | 'split';
  customAmount?: number;
  // Populated when status === 'split'; each entry is one sub-payment landing on its own date.
  splits?: { id: string; amount: number; dateStr: string }[];
}

export interface Account {
  id: string;
  name: string;
  type: 'checking' | 'savings' | 'other';
  customType?: string; // Must be filled if type is 'other'
  balance: number; // For cash accounts, current cash. For credit cards, outstanding balance (amount owed).
  startDate?: string; // Starting date (YYYY-MM-DD) when the starting balance becomes active
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
  targetAccountId?: string; // Destination account (e.g., savings account)
  liabilityType?: 'card' | 'loan' | 'line_of_credit' | 'one_time';
  interestRate?: number; // Annual Percentage Rate (APR %) e.g. 21.99
  currentBalance?: number; // Current outstanding balance owed
  startingBalance?: number; // Original / starting balance
  creditLimit?: number; // Total credit limit (for credit cards / lines of credit)
  minimumPayment?: number; // Minimum required monthly payment
  balanceTransferFee?: number; // Fee % for balance transfer
  balanceTransferFeeMin?: number; // Minimum $ fee for balance transfer
  promoRate?: number; // Promotional APR %
  promoEndDate?: string; // Promotional APR end date (YYYY-MM-DD)
  minimumPaymentCalc?: 'fixed' | 'percent_principal' | 'percent_principal_interest';
  dayOfMonth?: string; // Due day of month (e.g. "1".."31" or "Last")
  endDate?: string; // Ending date (YYYY-MM-DD) when the recurring transaction stops occurring
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
    status?: 'verified' | 'skipped' | 'modified' | 'split';
    overrideId?: string;
    // Set when this entry is one part of a split payment: e.g. "2 of 3"
    splitLabel?: string;
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

// Helper to convert any frequency into a standard baseline monthly amount
export function getMonthlyEquivalent(t: { amount: number; frequency: TransactionFrequency; semiMonthlyDays?: number[] }): number {
  if (!t.amount || isNaN(t.amount)) return 0;
  switch (t.frequency) {
    case 'onetime':
      return 0; // One-time events are excluded from standard recurring monthly projections
    case 'daily':
      return t.amount * 30; // standard 30 days/mo baseline
    case 'weekly':
      return t.amount * 4; // standard 4 payweeks/mo baseline (e.g. 4 x $500 = $2,000)
    case 'biweekly':
      return t.amount * 2; // standard 2 pay periods/mo baseline (e.g. 2 x $2,000 = $4,000)
    case 'semimonthly': {
      const daysCount = (t.semiMonthlyDays && t.semiMonthlyDays.length > 0) ? t.semiMonthlyDays.length : 2;
      return t.amount * daysCount; // standard 2 per month
    }
    case 'monthly':
      return t.amount;
    case 'quarterly':
      return t.amount / 3; // $300 quarterly = $100/mo baseline
    case 'yearly':
      return t.amount / 12; // $1,200 yearly = $100/mo baseline
    default:
      return t.amount;
  }
}

// Helper to convert any frequency into a standard quarterly total amount (3 months)
export function getQuarterlyEquivalent(t: { amount: number; frequency: TransactionFrequency; semiMonthlyDays?: number[] }): number {
  if (!t.amount || isNaN(t.amount)) return 0;
  switch (t.frequency) {
    case 'onetime':
      return 0; // One-time events are excluded from standard recurring quarterly projections
    case 'daily':
      return t.amount * 90; // 90 days/quarter
    case 'weekly':
      return t.amount * 12; // 12 weeks/quarter baseline (4 weeks x 3 months)
    case 'biweekly':
      return t.amount * 6; // 6 biweeks/quarter baseline (2 biweeks x 3 months)
    case 'semimonthly': {
      const daysCount = (t.semiMonthlyDays && t.semiMonthlyDays.length > 0) ? t.semiMonthlyDays.length : 2;
      return t.amount * daysCount * 3;
    }
    case 'monthly':
      return t.amount * 3; // 3 months/quarter
    case 'quarterly':
      return t.amount; // 1 payment per quarter
    case 'yearly':
      return t.amount / 4; // 1/4 of annual payment per quarter
    default:
      return t.amount * 3;
  }
}

// Helper to convert any frequency into an annualized yearly total amount
export function getYearlyEquivalent(t: { amount: number; frequency: TransactionFrequency; semiMonthlyDays?: number[] }): number {
  if (!t.amount || isNaN(t.amount)) return 0;
  switch (t.frequency) {
    case 'onetime':
      return 0; // One-time events are excluded from standard recurring yearly projections
    case 'daily':
      return t.amount * 365;
    case 'weekly':
      return t.amount * 52; // 52 payweeks in a year (includes the 4 extra 5th payweeks)
    case 'biweekly':
      return t.amount * 26; // 26 biweeks in a year (includes the 2 extra 3rd paychecks)
    case 'semimonthly': {
      const daysCount = (t.semiMonthlyDays && t.semiMonthlyDays.length > 0) ? t.semiMonthlyDays.length : 2;
      return t.amount * daysCount * 12;
    }
    case 'monthly':
      return t.amount * 12;
    case 'quarterly':
      return t.amount * 4;
    case 'yearly':
      return t.amount;
    default:
      return t.amount * 12;
  }
}

// Calculate exact occurrences of a transaction in a specific calendar month
export function getOccurrencesInMonth(
  t: RecurringTransaction,
  year: number,
  monthIndex: number // 0-indexed (0 = Jan, 11 = Dec)
): number {
  if (!t.amount || isNaN(t.amount)) return 0;
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  let count = 0;
  for (let d = 1; d <= daysInMonth; d++) {
    const dayDate = new Date(year, monthIndex, d);
    if (isTransactionOccurring(dayDate, t)) {
      count++;
    }
  }
  return count;
}

// Calculate exact occurrences of a transaction in a specific calendar quarter
export function getOccurrencesInQuarter(
  t: RecurringTransaction,
  year: number,
  quarterNum: number // 1, 2, 3, or 4
): number {
  if (!t.amount || isNaN(t.amount)) return 0;
  const startMonth = (quarterNum - 1) * 3;
  let totalOccurrences = 0;
  for (let m = startMonth; m < startMonth + 3; m++) {
    totalOccurrences += getOccurrencesInMonth(t, year, m);
  }
  return totalOccurrences;
}

// Calculate actual dollar total for a specific month
export function getActualMonthlyTotal(
  t: RecurringTransaction,
  year: number,
  monthIndex: number
): number {
  return t.amount * getOccurrencesInMonth(t, year, monthIndex);
}

// Calculate actual dollar total for a specific quarter
export function getActualQuarterlyTotal(
  t: RecurringTransaction,
  year: number,
  quarterNum: number
): number {
  return t.amount * getOccurrencesInQuarter(t, year, quarterNum);
}

// Helper to get formatted breakdown text for UI item cards
export function getFrequencySubtext(t: { amount: number; frequency: TransactionFrequency; semiMonthlyDays?: number[] }): string {
  const m = getMonthlyEquivalent(t);
  const q = getQuarterlyEquivalent(t);
  const fmt = (val: number) => val.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  switch (t.frequency) {
    case 'biweekly':
      return `Base: $${fmt(m)}/mo (2x) • $${fmt(q)}/qtr (6x) • Extra 3rd paycheck in 3-paycheck months (7x/qtr)`;
    case 'weekly':
      return `Base: $${fmt(m)}/mo (4x) • $${fmt(q)}/qtr (12x) • Extra 5th paycheck in 5-payweek months (13x/qtr)`;
    case 'semimonthly':
      return `Base: $${fmt(m)}/mo (2x) • $${fmt(q)}/qtr (6x) • Semi-monthly (fixed days)`;
    case 'quarterly':
      return `Base: $${fmt(m)}/mo • $${fmt(q)}/qtr (1x per quarter)`;
    case 'yearly':
      return `Base: $${fmt(m)}/mo • $${fmt(q)}/qtr • $${fmt(getYearlyEquivalent(t))}/yr`;
    case 'daily':
      return `Base: $${fmt(m)}/mo (30d) • $${fmt(q)}/qtr (90d)`;
    case 'monthly':
    default:
      return `Base: $${fmt(m)}/mo (1x) • $${fmt(q)}/qtr (3x)`;
  }
}

// Check if a transaction occurs on a specific day
export function isTransactionOccurring(
  day: Date,
  transaction: Pick<RecurringTransaction, 'startDate' | 'frequency' | 'semiMonthlyDays' | 'endDate'>
): boolean {
  const tStart = parseDateLocal(transaction.startDate);
  
  // Truncate times for accurate date-only comparison
  const dTrunc = new Date(day.getFullYear(), day.getMonth(), day.getDate());
  const sTrunc = new Date(tStart.getFullYear(), tStart.getMonth(), tStart.getDate());
  
  if (dTrunc < sTrunc) return false; // Haven't started yet

  if (transaction.endDate) {
    const tEnd = parseDateLocal(transaction.endDate);
    const eTrunc = new Date(tEnd.getFullYear(), tEnd.getMonth(), tEnd.getDate());
    if (dTrunc > eTrunc) return false; // Already ended
  }
  
  switch (transaction.frequency) {
    case 'onetime':
      return dTrunc.getTime() === sTrunc.getTime();
      
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
      const days = (transaction.semiMonthlyDays && transaction.semiMonthlyDays.length > 0) ? transaction.semiMonthlyDays : [1, 15];
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
  overrides = [],
}: {
  startDate: Date;
  numberOfDays: number;
  initialBalance?: number;
  accounts?: Account[];
  transactions: RecurringTransaction[];
  overrides?: TransactionOverride[];
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
  const initializedAccounts = new Set<string>();
  for (const acc of activeAccounts) {
    if (acc.startDate) {
      currentBalances[acc.id] = 0;
    } else {
      currentBalances[acc.id] = acc.balance;
      initializedAccounts.add(acc.id);
    }
  }
  
  const end = new Date(startDate);
  end.setDate(startDate.getDate() + numberOfDays - 1);

  const days = getDaysInRange(startDate, end);

  // Build a date-keyed index of split sub-payments so the day loop can find
  // them in O(1) without scanning all overrides every iteration.
  const splitsByDate = new Map<string, Array<{
    tx: RecurringTransaction;
    amount: number;
    overrideId: string;
    partNum: number;
    totalParts: number;
  }>>();
  for (const override of overrides) {
    if (override.status === 'split' && override.splits && override.splits.length > 0) {
      const tx = transactions.find(t => t.id === override.transactionId);
      if (!tx) continue;
      const totalParts = override.splits.length;
      for (let i = 0; i < override.splits.length; i++) {
        const split = override.splits[i];
        const parts = splitsByDate.get(split.dateStr) ?? [];
        parts.push({ tx, amount: split.amount, overrideId: override.id, partNum: i + 1, totalParts });
        splitsByDate.set(split.dateStr, parts);
      }
    }
  }

  for (const day of days) {
    let incoming = 0;
    let outgoing = 0;
    const dayTransactions: {
      item: RecurringTransaction;
      amount: number;
      status?: 'verified' | 'skipped' | 'modified' | 'split';
      overrideId?: string;
      splitLabel?: string;
    }[] = [];
    
    const dayStr = formatDateLocal(day);

    // Activate any account starting on or before today
    for (const acc of activeAccounts) {
      if (acc.startDate && !initializedAccounts.has(acc.id) && dayStr >= acc.startDate) {
        currentBalances[acc.id] = acc.balance;
        initializedAccounts.add(acc.id);
      }
    }
    
    // Store starting balances for this day
    const dayStartingBalances = { ...currentBalances };
    
    for (const t of transactions) {
      if (isTransactionOccurring(day, t)) {
        // Look up if there is an override for this transaction on this day
        const override = overrides.find(o => o.transactionId === t.id && o.dateStr === dayStr);
        
        if (override && override.status === 'skipped') {
          continue; // Skip this transaction instance completely on this day
        }

        if (override && override.status === 'split' && override.splits && override.splits.length > 0) {
          continue; // Occurrence is replaced by split sub-payments at their own dates
        }
        
        let amt = t.amount;
        if (override && override.status === 'modified' && override.customAmount !== undefined) {
          amt = override.customAmount;
        }
        
        if (t.category === 'income') {
          incoming += amt;
          dayTransactions.push({
            item: t,
            amount: amt,
            status: override ? override.status : undefined,
            overrideId: override ? override.id : undefined,
          });
          
          // Deposit into connected account
          const accId = t.accountId;
          if (accId && currentBalances[accId] !== undefined) {
            currentBalances[accId] += amt;
          }
        } else {
          outgoing += amt;
          dayTransactions.push({
            item: t,
            amount: -amt,
            status: override ? override.status : undefined,
            overrideId: override ? override.id : undefined,
          });
          
          if (t.category === 'liability') {
            // A liability payment simply debits the funding account — same
            // shape as a fixed expense, just keyed off fundingAccountId.
            const fundAccId = t.fundingAccountId;
            if (fundAccId && currentBalances[fundAccId] !== undefined) {
              currentBalances[fundAccId] -= amt;
            }
          } else if (t.category === 'savings') {
            // Transfer from checking to savings
            const fundAccId = t.fundingAccountId;
            if (fundAccId && currentBalances[fundAccId] !== undefined) {
              currentBalances[fundAccId] -= amt;
            }
            const targetAccId = t.targetAccountId;
            if (targetAccId && currentBalances[targetAccId] !== undefined) {
              currentBalances[targetAccId] += amt;
            }
          } else if (t.category === 'transfer') {
            // General transfer between accounts
            const fundAccId = t.fundingAccountId;
            if (fundAccId && currentBalances[fundAccId] !== undefined) {
              currentBalances[fundAccId] -= amt;
            }
            const targetAccId = t.targetAccountId;
            if (targetAccId && currentBalances[targetAccId] !== undefined) {
              currentBalances[targetAccId] += amt;
            }
          } else {
            // Fixed expense or subscription paid from account
            const accId = t.accountId;
            if (accId && currentBalances[accId] !== undefined) {
              currentBalances[accId] -= amt;
            }
          }
        }
      }
    }

    // Process any split sub-payments whose date_str falls on this day.
    // Each part goes through the same category routing as a normal occurrence.
    const splitsToday = splitsByDate.get(dayStr);
    if (splitsToday) {
      for (const part of splitsToday) {
        const t = part.tx;
        const amt = part.amount;
        const splitLabel = `${part.partNum} of ${part.totalParts}`;

        if (t.category === 'income') {
          incoming += amt;
          dayTransactions.push({
            item: t,
            amount: amt,
            overrideId: part.overrideId,
            splitLabel,
          });

          const accId = t.accountId;
          if (accId && currentBalances[accId] !== undefined) {
            currentBalances[accId] += amt;
          }
          continue;
        }

        outgoing += amt;
        dayTransactions.push({
          item: t,
          amount: -amt,
          overrideId: part.overrideId,
          splitLabel,
        });

        if (t.category === 'liability') {
          const fundAccId = t.fundingAccountId;
          if (fundAccId && currentBalances[fundAccId] !== undefined) currentBalances[fundAccId] -= amt;
        } else if (t.category === 'savings') {
          const fundAccId = t.fundingAccountId;
          if (fundAccId && currentBalances[fundAccId] !== undefined) currentBalances[fundAccId] -= amt;
          const targetAccId = t.targetAccountId;
          if (targetAccId && currentBalances[targetAccId] !== undefined) currentBalances[targetAccId] += amt;
        } else if (t.category === 'transfer') {
          const fundAccId = t.fundingAccountId;
          if (fundAccId && currentBalances[fundAccId] !== undefined) currentBalances[fundAccId] -= amt;
          const targetAccId = t.targetAccountId;
          if (targetAccId && currentBalances[targetAccId] !== undefined) currentBalances[targetAccId] += amt;
        } else {
          const accId = t.accountId;
          if (accId && currentBalances[accId] !== undefined) currentBalances[accId] -= amt;
        }
      }
    }

    // Net cash total is sum of cash accounts
    let totalCashSum = 0;
    for (const acc of activeAccounts) {
      const bal = currentBalances[acc.id];
      totalCashSum += bal;
    }
    
    // Day starting net cash total
    let totalStartCashSum = 0;
    for (const acc of activeAccounts) {
      const bal = dayStartingBalances[acc.id];
      totalStartCashSum += bal;
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
    title: "Sapphire Reserve Credit Card",
    amount: 150,
    startDate: "2026-07-20",
    frequency: "monthly",
    category: "liability",
    fundingAccountId: "acc_checking",
    liabilityType: "card",
    currentBalance: 4200,
    startingBalance: 6000,
    creditLimit: 10000,
    interestRate: 22.99,
    minimumPayment: 85,
    notes: "High interest rewards credit card balance.",
  },
  {
    id: "t5",
    title: "Auto Loan Installment",
    amount: 380,
    startDate: "2026-07-12",
    frequency: "monthly",
    category: "liability",
    fundingAccountId: "acc_checking",
    liabilityType: "loan",
    currentBalance: 8500,
    startingBalance: 18000,
    interestRate: 5.49,
    minimumPayment: 380,
    notes: "Fixed rate 5-year vehicle financing.",
  }
];


