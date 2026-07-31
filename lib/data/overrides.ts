import { SupabaseClient } from "@supabase/supabase-js";
import { TransactionOverride } from "@/lib/forecast";

export function mapOverrideFromDb(row: any): TransactionOverride {
  return {
    id: row.id,
    transactionId: row.transaction_id,
    dateStr: row.date_str,
    status: row.status,
    customAmount: row.custom_amount !== null && row.custom_amount !== undefined ? Number(row.custom_amount) : undefined,
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
    .select("*")
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
    .select()
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
