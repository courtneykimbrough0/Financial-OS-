import { SupabaseClient } from "@supabase/supabase-js";
import { Account } from "@/lib/forecast";

export function mapAccountFromDb(row: any): Account {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    customType: row.custom_type || undefined,
    balance: Number(row.balance),
    startDate: row.start_date || undefined,
  };
}

export function mapAccountToDb(
  account: Omit<Account, "id"> & { id?: string },
  userId: string
): any {
  return {
    id: account.id || undefined,
    user_id: userId,
    name: account.name,
    type: account.type,
    custom_type: account.customType || null,
    balance: account.balance,
    start_date: account.startDate || null,
  };
}

export async function fetchAccounts(
  supabase: SupabaseClient,
  userId: string
): Promise<Account[]> {
  const { data, error } = await supabase
    .from("accounts")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }
  return (data || []).map(mapAccountFromDb);
}

export async function insertAccount(
  supabase: SupabaseClient,
  account: Omit<Account, "id">,
  userId: string
): Promise<Account> {
  const dbPayload = mapAccountToDb(account, userId);
  const { data, error } = await supabase
    .from("accounts")
    .insert(dbPayload)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }
  return mapAccountFromDb(data);
}

export async function updateAccount(
  supabase: SupabaseClient,
  account: Account,
  userId: string
): Promise<Account> {
  const dbPayload = mapAccountToDb(account, userId);
  const { data, error } = await supabase
    .from("accounts")
    .update(dbPayload)
    .eq("id", account.id)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }
  return mapAccountFromDb(data);
}

export async function deleteAccount(
  supabase: SupabaseClient,
  accountId: string,
  userId: string
): Promise<void> {
  const { error } = await supabase
    .from("accounts")
    .delete()
    .eq("id", accountId)
    .eq("user_id", userId);

  if (error) {
    throw new Error(error.message);
  }
}
