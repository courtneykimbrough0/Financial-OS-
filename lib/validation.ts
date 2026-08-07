import { RecurringTransaction } from "./forecast";

export function validateTransactionInput(
  input: {
    title: string;
    amount: string;
    startDate: string;
    frequency: string;
    category: string;
    semiMonthlyDays?: string | number[];
    notes?: string;
    dayOfMonth?: string;
    movableDueDate?: boolean;
  }
): { success: true; data: Omit<RecurringTransaction, "id"> & { id?: string } } | { success: false; error: string } {
  if (!input.title.trim()) {
    let typeName = "transaction";
    if (input.category === "income") typeName = "income";
    else if (input.category === "liability") typeName = "obligation";
    else if (
      input.category === "fixed-expense" ||
      input.category === "subscription" ||
      input.category === "savings"
    )
      typeName = "expense";
    return { success: false, error: `Please enter a ${typeName} name.` };
  }

  const amountNum = parseFloat(input.amount);
  if (isNaN(amountNum) || amountNum <= 0) {
    return { success: false, error: "Please enter a valid amount greater than 0." };
  }

  let semiMonthlyDays: number[] | undefined;
  if (input.frequency === "semimonthly") {
    if (typeof input.semiMonthlyDays === "string") {
      semiMonthlyDays = input.semiMonthlyDays
        .split(",")
        .map((s) => parseInt(s.trim()))
        .filter((num) => !isNaN(num) && num >= 1 && num <= 31);
    } else if (Array.isArray(input.semiMonthlyDays)) {
      semiMonthlyDays = input.semiMonthlyDays.filter(
        (num) => !isNaN(num) && num >= 1 && num <= 31
      );
    }
    if (!semiMonthlyDays || semiMonthlyDays.length === 0) {
      return {
        success: false,
        error: "Please specify valid days for semi-monthly frequency (e.g. 1,15).",
      };
    }
  }

  const tx: Omit<RecurringTransaction, "id"> & { id?: string } = {
    title: input.title.trim(),
    amount: amountNum,
    startDate: input.startDate,
    frequency: input.frequency as any,
    category: input.category as any,
    semiMonthlyDays,
    notes: input.notes?.trim() || undefined,
  };

  if (input.category === "liability") {
    tx.dayOfMonth = input.dayOfMonth || undefined;
    tx.movableDueDate = input.movableDueDate;
  }

  return { success: true, data: tx };
}
