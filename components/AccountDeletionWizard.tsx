"use client";

import React, { useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Trash2, X } from "lucide-react";
import { useFinancialData } from "./FinancialOSContext";

export const AccountDeletionWizard: React.FC = () => {
  const {
    deletingAccount,
    setDeletingAccount,
    accounts,
    transactions,
    deleteAccountTransferTargetId,
    setDeleteAccountTransferTargetId,
    deleteActionChoice,
    setDeleteActionChoice,
    deleteAccountWithStrategy,
    isSaving,
  } = useFinancialData();

  const remainingAccs = useMemo(() => {
    return deletingAccount
      ? accounts.filter((a) => a.id !== deletingAccount.id)
      : [];
  }, [deletingAccount, accounts]);

  // Set default transfer target account if not set or if it's the deleted account
  useEffect(() => {
    if (deletingAccount && remainingAccs.length > 0) {
      if (
        !deleteAccountTransferTargetId ||
        deleteAccountTransferTargetId === deletingAccount.id ||
        !remainingAccs.some((a) => a.id === deleteAccountTransferTargetId)
      ) {
        setDeleteAccountTransferTargetId(remainingAccs[0].id);
      }
    }
  }, [deletingAccount, remainingAccs, deleteAccountTransferTargetId, setDeleteAccountTransferTargetId]);

  if (!deletingAccount) return null;

  const affectedTxs = transactions.filter(
    (t) =>
      t.accountId === deletingAccount.id ||
      t.fundingAccountId === deletingAccount.id ||
      t.targetAccountId === deletingAccount.id
  );

  const handleConfirmDelete = async () => {
    const success = await deleteAccountWithStrategy(
      deletingAccount.id,
      deleteActionChoice,
      deleteAccountTransferTargetId
    );
    if (success) {
      setDeletingAccount(null);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 15 }}
          transition={{ duration: 0.15 }}
          className="bg-zinc-950 border border-white/10 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col"
        >
          {/* Header */}
          <div className="p-6 border-b border-white/5 flex justify-between items-center bg-zinc-900/20">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Trash2 className="w-5 h-5 text-red-400" />
                Delete Account: {deletingAccount.name}
              </h3>
              <p className="text-xs text-zinc-400 mt-1">
                Determine how to handle scheduled future transactions tied to this account.
              </p>
            </div>
            <button
              type="button"
              disabled={isSaving}
              onClick={() => setDeletingAccount(null)}
              className="p-1.5 rounded-lg hover:bg-white/5 text-zinc-400 hover:text-white transition-colors disabled:opacity-50"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-5 overflow-y-auto max-h-[60vh] scrollbar-thin">
            {/* Warning summary */}
            <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
              <span className="text-xs text-amber-300 font-medium leading-relaxed block">
                You are about to delete <span className="font-bold text-white">{deletingAccount.name}</span>.
                {affectedTxs.length > 0 ? (
                  <>
                    {" "}
                    There are <span className="font-bold text-white">{affectedTxs.length} scheduled transaction(s)</span> directly dependent on this account.
                  </>
                ) : (
                  <> No active scheduled transactions will be affected by this deletion.</>
                )}
              </span>
            </div>

            {affectedTxs.length > 0 && (
              <>
                {/* List of Affected Transactions */}
                <div className="space-y-2">
                  <span className="text-[10px] font-bold font-mono tracking-wider text-zinc-400 uppercase">
                    Dependent Transactions
                  </span>
                  <div className="bg-zinc-900/40 border border-white/5 rounded-2xl overflow-hidden divide-y divide-white/5 max-h-[160px] overflow-y-auto scrollbar-thin">
                    {affectedTxs.map((t) => (
                      <div key={t.id} className="p-3 flex justify-between items-center text-xs">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-semibold text-white">{t.title}</span>
                          <span className="text-[10px] text-zinc-500 capitalize">
                            {t.category.replace("-", " ")} &bull; {t.frequency}
                          </span>
                        </div>
                        <span className="font-mono font-bold text-zinc-200">
                          ${t.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Deletion / Reassignment choices */}
                <div className="space-y-3">
                  <span className="text-[10px] font-bold font-mono tracking-wider text-zinc-400 uppercase">
                    Choose Action for Transactions
                  </span>

                  <div className="grid grid-cols-1 gap-3">
                    {remainingAccs.length > 0 ? (
                      <label
                        className={`flex flex-col p-4 rounded-2xl border cursor-pointer transition-all ${
                          deleteActionChoice === "transfer"
                            ? "bg-indigo-500/10 border-indigo-500 text-white"
                            : "bg-zinc-900/30 border-white/5 hover:border-white/10 text-zinc-300"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <input
                            type="radio"
                            name="deleteActionChoice"
                            disabled={isSaving}
                            checked={deleteActionChoice === "transfer"}
                            onChange={() => setDeleteActionChoice("transfer")}
                            className="accent-indigo-500 cursor-pointer"
                          />
                          <span className="text-xs font-bold">Transfer to another account</span>
                        </div>
                        <p className="text-[11px] text-zinc-400 mt-1.5 ml-6 leading-relaxed">
                          Safely reassign these scheduled transactions to another active account of your choosing.
                        </p>

                        {deleteActionChoice === "transfer" && (
                          <div className="mt-3 ml-6">
                            <label className="text-[9px] font-bold font-mono tracking-wider text-zinc-400 uppercase block mb-1">
                              Target Destination Account
                            </label>
                            <select
                              value={deleteAccountTransferTargetId}
                              disabled={isSaving}
                              onChange={(e) => setDeleteAccountTransferTargetId(e.target.value)}
                              className="bg-zinc-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-medium cursor-pointer w-full"
                            >
                              {remainingAccs.map((a) => (
                                <option key={a.id} value={a.id}>
                                  {a.name} ({a.type})
                                </option>
                              ))}
                            </select>
                          </div>
                        )}
                      </label>
                    ) : (
                      <div className="p-4 bg-zinc-900/30 border border-white/5 rounded-2xl text-zinc-400 text-xs flex flex-col gap-1">
                        <span className="font-bold text-zinc-300">No other active accounts</span>
                        <p className="text-[11px] text-zinc-500 leading-normal">
                          Since you are deleting your only remaining account, these future scheduled transactions cannot be transferred and will be archived.
                        </p>
                      </div>
                    )}

                    <label
                      className={`flex flex-col p-4 rounded-2xl border cursor-pointer transition-all ${
                        deleteActionChoice === "archive"
                          ? "bg-red-500/10 border-red-500/30 text-white"
                          : "bg-zinc-900/30 border-white/5 hover:border-white/10 text-zinc-300"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <input
                          type="radio"
                          name="deleteActionChoice"
                          disabled={isSaving}
                          checked={deleteActionChoice === "archive"}
                          onChange={() => setDeleteActionChoice("archive")}
                          className="accent-red-500 cursor-pointer"
                        />
                        <span className="text-xs font-bold">Archive &amp; remove transactions</span>
                      </div>
                      <p className="text-[11px] text-zinc-400 mt-1.5 ml-6 leading-relaxed">
                        Permanently stop and delete these future recurring transactions from your calendar and forecasting models.
                      </p>
                    </label>
                  </div>
                </div>
              </>
            )}

            {affectedTxs.length === 0 && (
              <p className="text-xs text-zinc-400 leading-relaxed">
                This account has no scheduled transactions linked to it. It can be safely deleted without any transaction transfer or reassignment overhead.
              </p>
            )}
          </div>

          {/* Footer buttons */}
          <div className="p-6 bg-zinc-900/40 border-t border-white/5 flex justify-end gap-3">
            <button
              type="button"
              disabled={isSaving}
              onClick={() => setDeletingAccount(null)}
              className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-zinc-300 font-semibold text-xs transition-all disabled:opacity-50 cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={isSaving}
              onClick={handleConfirmDelete}
              className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs transition-all shadow-md disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
            >
              {isSaving ? "Processing..." : "Confirm Deletion"}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
