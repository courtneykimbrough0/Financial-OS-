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
    dayOfMonth: row.day_of_month || undefined,
    movableDueDate: row.movable_due_date !== null && row.movable_due_date !== undefined ? Boolean(row.movable_due_date) : undefined,
    endDate: row.end_date || undefined,
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
    day_of_month: tx.dayOfMonth || null,
    movable_due_date: tx.movableDueDate !== undefined ? tx.movableDueDate : null,
    end_date: tx.endDate || null,
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
