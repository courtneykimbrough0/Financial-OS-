import { SupabaseClient } from "@supabase/supabase-js";
import { RecurringTransaction } from "@/lib/forecast";

export function mapTransactionFromDb(row: any): RecurringTransaction {
  return {
    id: row.id,
    title: row.title,
    amount: Number(row.amount),
    startDate: row.start_date,
    frequency: row.frequency,
    category: row.category,
    semiMonthlyDays: row.semi_monthly_days || undefined,
    notes: row.notes || undefined,
    accountId: row.account_id || undefined,
    fundingAccountId: row.funding_account_id || undefined,
    targetAccountId: row.target_account_id || undefined,
    liabilityType: row.liability_type || undefined,
    interestRate: row.interest_rate !== null && row.interest_rate !== undefined ? Number(row.interest_rate) : undefined,
    currentBalance: row.current_balance !== null && row.current_balance !== undefined ? Number(row.current_balance) : undefined,
    startingBalance: row.starting_balance !== null && row.starting_balance !== undefined ? Number(row.starting_balance) : undefined,
    creditLimit: row.credit_limit !== null && row.credit_limit !== undefined ? Number(row.credit_limit) : undefined,
    minimumPayment: row.minimum_payment !== null && row.minimum_payment !== undefined ? Number(row.minimum_payment) : undefined,
    balanceTransferFee: row.balance_transfer_fee !== null && row.balance_transfer_fee !== undefined ? Number(row.balance_transfer_fee) : undefined,
    balanceTransferFeeMin: row.balance_transfer_fee_min !== null && row.balance_transfer_fee_min !== undefined ? Number(row.balance_transfer_fee_min) : undefined,
    promoRate: row.promo_rate !== null && row.promo_rate !== undefined ? Number(row.promo_rate) : undefined,
    promoEndDate: row.promo_end_date || undefined,
    endDate: row.end_date || undefined,
    minimumPaymentCalc: row.minimum_payment_calc || undefined,
    dayOfMonth: row.day_of_month || undefined,
  };
}

export function mapTransactionToDb(
  tx: Omit<RecurringTransaction, "id"> & { id?: string },
  userId: string
): any {
  return {
    id: tx.id || undefined,
    user_id: userId,
    title: tx.title,
    amount: tx.amount,
    start_date: tx.startDate,
    frequency: tx.frequency,
    category: tx.category,
    semi_monthly_days: tx.semiMonthlyDays || null,
    notes: tx.notes || null,
    account_id: tx.accountId || null,
    funding_account_id: tx.fundingAccountId || null,
    target_account_id: tx.targetAccountId || null,
    liability_type: tx.liabilityType || null,
    interest_rate: tx.interestRate !== undefined && tx.interestRate !== null ? tx.interestRate : null,
    current_balance: tx.currentBalance !== undefined && tx.currentBalance !== null ? tx.currentBalance : null,
    starting_balance: tx.startingBalance !== undefined && tx.startingBalance !== null ? tx.startingBalance : null,
    credit_limit: tx.creditLimit !== undefined && tx.creditLimit !== null ? tx.creditLimit : null,
    minimum_payment: tx.minimumPayment !== undefined && tx.minimumPayment !== null ? tx.minimumPayment : null,
    balance_transfer_fee: tx.balanceTransferFee !== undefined && tx.balanceTransferFee !== null ? tx.balanceTransferFee : null,
    balance_transfer_fee_min: tx.balanceTransferFeeMin !== undefined && tx.balanceTransferFeeMin !== null ? tx.balanceTransferFeeMin : null,
    promo_rate: tx.promoRate !== undefined && tx.promoRate !== null ? tx.promoRate : null,
    promo_end_date: tx.promoEndDate || null,
    end_date: tx.endDate || null,
    minimum_payment_calc: tx.minimumPaymentCalc || null,
    day_of_month: tx.dayOfMonth || null,
  };
}

export async function fetchTransactions(
  supabase: SupabaseClient,
  userId: string
): Promise<RecurringTransaction[]> {
  const { data, error } = await supabase
    .from("transactions")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }
  return (data || []).map(mapTransactionFromDb);
}

export async function insertTransaction(
  supabase: SupabaseClient,
  tx: Omit<RecurringTransaction, "id">,
  userId: string
): Promise<RecurringTransaction> {
  const dbPayload = mapTransactionToDb(tx, userId);
  const { data, error } = await supabase
    .from("transactions")
    .insert(dbPayload)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }
  return mapTransactionFromDb(data);
}

export async function updateTransaction(
  supabase: SupabaseClient,
  tx: RecurringTransaction,
  userId: string
): Promise<RecurringTransaction> {
  const dbPayload = mapTransactionToDb(tx, userId);
  const { data, error } = await supabase
    .from("transactions")
    .update(dbPayload)
    .eq("id", tx.id)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }
  return mapTransactionFromDb(data);
}

export async function deleteTransaction(
  supabase: SupabaseClient,
  txId: string,
  userId: string
): Promise<void> {
  const { error } = await supabase
    .from("transactions")
    .delete()
    .eq("id", txId)
    .eq("user_id", userId);

  if (error) {
    throw new Error(error.message);
  }
}
