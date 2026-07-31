import { RecurringTransaction, Account } from "./forecast";

export function validateTransactionInput(
  input: {
    title: string;
    amount: string;
    startDate: string;
    frequency: string;
    category: string;
    semiMonthlyDays?: string | number[];
    notes?: string;
    accountId?: string;
    fundingAccountId?: string;
    targetAccountId?: string;
    liabilityType?: string;
    interestRate?: string;
    currentBalance?: string;
    startingBalance?: string;
    creditLimit?: string;
    minimumPayment?: string;
    balanceTransferFee?: string;
    balanceTransferFeeMin?: string;
    promoRate?: string;
    promoEndDate?: string;
    minimumPaymentCalc?: string;
    dayOfMonth?: string;
    hasCreditLimit?: boolean;
    hasBalanceTransferFee?: boolean;
    hasPromoPeriod?: boolean;
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
    accountId: input.accountId || undefined,
    fundingAccountId: input.fundingAccountId || undefined,
    targetAccountId: input.targetAccountId || undefined,
  };

  if (input.category === "liability") {
    tx.liabilityType = (input.liabilityType || "credit_card") as any;
    tx.interestRate = input.interestRate ? parseFloat(input.interestRate) : undefined;
    tx.currentBalance = input.currentBalance ? parseFloat(input.currentBalance) : undefined;
    tx.startingBalance = input.startingBalance ? parseFloat(input.startingBalance) : undefined;
    tx.creditLimit =
      input.hasCreditLimit && input.creditLimit ? parseFloat(input.creditLimit) : undefined;
    tx.minimumPayment = input.minimumPayment ? parseFloat(input.minimumPayment) : undefined;
    tx.balanceTransferFee =
      input.hasBalanceTransferFee && input.balanceTransferFee
        ? parseFloat(input.balanceTransferFee)
        : undefined;
    tx.balanceTransferFeeMin =
      input.hasBalanceTransferFee && input.balanceTransferFeeMin
        ? parseFloat(input.balanceTransferFeeMin)
        : undefined;
    tx.promoRate =
      input.hasPromoPeriod && input.promoRate ? parseFloat(input.promoRate) : undefined;
    tx.promoEndDate =
      input.hasPromoPeriod && input.promoEndDate ? input.promoEndDate : undefined;
    tx.minimumPaymentCalc = (input.minimumPaymentCalc || "fixed") as any;
    tx.dayOfMonth = input.dayOfMonth || undefined;
  }

  return { success: true, data: tx };
}

export function validateAccountInput(
  input: {
    name: string;
    type: string;
    customType?: string;
    balance: string;
    startDate?: string;
  }
): { success: true; data: Omit<Account, "id"> & { id?: string } } | { success: false; error: string } {
  if (!input.name.trim()) {
    return { success: false, error: "Please enter an account name." };
  }

  const balanceNum = parseFloat(input.balance);
  if (isNaN(balanceNum)) {
    return { success: false, error: "Please enter a valid balance." };
  }

  return {
    success: true,
    data: {
      name: input.name.trim(),
      type: input.type as any,
      customType: input.type === "other" ? input.customType || undefined : undefined,
      balance: balanceNum,
      startDate: input.startDate || undefined,
    },
  };
}
