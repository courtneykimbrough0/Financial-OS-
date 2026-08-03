import { SupabaseClient } from "@supabase/supabase-js";

export interface UserSettings {
  userId: string;
  launchDate: string | null;
  onboardingCompleted: boolean;
  currentBalance: number | null;
  lowBalanceAlert: number | null;
}

export function mapSettingsFromDb(row: any): UserSettings {
  return {
    userId: row.user_id,
    launchDate: row.launch_date,
    onboardingCompleted: row.onboarding_completed,
    currentBalance: row.current_balance !== null && row.current_balance !== undefined ? Number(row.current_balance) : null,
    lowBalanceAlert: row.low_balance_alert !== null && row.low_balance_alert !== undefined ? Number(row.low_balance_alert) : null,
  };
}

export async function fetchUserSettings(
  supabase: SupabaseClient,
  userId: string
): Promise<UserSettings | null> {
  const { data, error } = await supabase
    .from("user_settings")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }
  return data ? mapSettingsFromDb(data) : null;
}

export async function createUserSettings(
  supabase: SupabaseClient,
  userId: string,
  launchDate: string
): Promise<UserSettings> {
  const { data, error } = await supabase
    .from("user_settings")
    .insert({
      user_id: userId,
      launch_date: launchDate,
      onboarding_completed: false,
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }
  return mapSettingsFromDb(data);
}

export async function updateOnboardingCompleted(
  supabase: SupabaseClient,
  userId: string,
  completed: boolean
): Promise<void> {
  const { error } = await supabase
    .from("user_settings")
    .update({ onboarding_completed: completed })
    .eq("user_id", userId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function updateLaunchDate(
  supabase: SupabaseClient,
  userId: string,
  launchDate: string
): Promise<void> {
  const { error } = await supabase
    .from("user_settings")
    .update({ launch_date: launchDate })
    .eq("user_id", userId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function updateCurrentBalance(
  supabase: SupabaseClient,
  userId: string,
  value: number | null
): Promise<void> {
  const { error } = await supabase
    .from("user_settings")
    .update({ current_balance: value })
    .eq("user_id", userId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function updateLowBalanceAlert(
  supabase: SupabaseClient,
  userId: string,
  value: number | null
): Promise<void> {
  const { error } = await supabase
    .from("user_settings")
    .update({ low_balance_alert: value })
    .eq("user_id", userId);

  if (error) {
    throw new Error(error.message);
  }
}
