import { SupabaseClient } from "@supabase/supabase-js";
import { TransactionOverride } from "@/lib/forecast";

export function mapOverrideFromDb(row: any): TransactionOverride {
  const splits = Array.isArray(row.transaction_override_splits)
    ? row.transaction_override_splits.map((s: any) => ({
        id: s.id,
        amount: Number(s.amount),
        dateStr: s.date_str,
      }))
    : undefined;

  return {
    id: row.id,
    transactionId: row.transaction_id,
    dateStr: row.date_str,
    status: row.status,
    customAmount: row.custom_amount !== null && row.custom_amount !== undefined ? Number(row.custom_amount) : undefined,
    splits: splits && splits.length > 0 ? splits : undefined,
  };
}

export function mapOverrideToDb(
  override: Omit<TransactionOverride, "id"> & { id?: string },
  userId: string
): any {
  return {
    id: override.id || undefined,
    user_id: userId,
    transaction_id: override.transactionId,
    date_str: override.dateStr,
    status: override.status,
    custom_amount: override.customAmount !== undefined && override.customAmount !== null ? override.customAmount : null,
  };
}

export async function fetchOverrides(
  supabase: SupabaseClient,
  userId: string
): Promise<TransactionOverride[]> {
  const { data, error } = await supabase
    .from("transaction_overrides")
    .select("*, transaction_override_splits(id, amount, date_str)")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }
  return (data || []).map(mapOverrideFromDb);
}

export async function upsertOverride(
  supabase: SupabaseClient,
  override: Omit<TransactionOverride, "id"> & { id?: string },
  userId: string
): Promise<TransactionOverride> {
  const dbPayload = mapOverrideToDb(override, userId);
  const { data, error } = await supabase
    .from("transaction_overrides")
    .upsert(dbPayload, { onConflict: "transaction_id,date_str" })
    .select("*, transaction_override_splits(id, amount, date_str)")
    .single();

  if (error) {
    throw new Error(error.message);
  }
  return mapOverrideFromDb(data);
}

export async function deleteOverride(
  supabase: SupabaseClient,
  transactionId: string,
  dateStr: string,
  userId: string
): Promise<void> {
  const { error } = await supabase
    .from("transaction_overrides")
    .delete()
    .eq("transaction_id", transactionId)
    .eq("date_str", dateStr)
    .eq("user_id", userId);

  if (error) {
    throw new Error(error.message);
  }
}

// Create or replace a split override: marks the original occurrence as 'split',
// deletes any prior sub-rows for it, then inserts the new sub-payments.
export async function upsertSplitOverride(
  supabase: SupabaseClient,
  transactionId: string,
  dueDateStr: string,
  parts: { amount: number; dateStr: string }[],
  userId: string
): Promise<TransactionOverride> {
  // 1. Upsert parent override as status='split'
  const { data: overrideRow, error: overrideErr } = await supabase
    .from("transaction_overrides")
    .upsert(
      { user_id: userId, transaction_id: transactionId, date_str: dueDateStr, status: "split", custom_amount: null },
      { onConflict: "transaction_id,date_str" }
    )
    .select("id")
    .single();

  if (overrideErr) throw new Error(overrideErr.message);
  const overrideId: string = overrideRow.id;

  // 2. Delete any existing splits for this override (re-splitting replaces prior splits)
  const { error: delErr } = await supabase
    .from("transaction_override_splits")
    .delete()
    .eq("override_id", overrideId)
    .eq("user_id", userId);
  if (delErr) throw new Error(delErr.message);

  // 3. Insert new split parts
  const splitRows = parts.map((p) => ({
    user_id: userId,
    override_id: overrideId,
    amount: p.amount,
    date_str: p.dateStr,
  }));
  const { data: splitData, error: splitErr } = await supabase
    .from("transaction_override_splits")
    .insert(splitRows)
    .select("id, amount, date_str");
  if (splitErr) throw new Error(splitErr.message);

  return {
    id: overrideId,
    transactionId,
    dateStr: dueDateStr,
    status: "split",
    splits: (splitData || []).map((s: any) => ({
      id: s.id,
      amount: Number(s.amount),
      dateStr: s.date_str,
    })),
  };
}
