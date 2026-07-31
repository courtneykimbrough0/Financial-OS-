"use client";

import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { useFinancialData } from "./FinancialOSContext";

export const ConfirmAlertDialogs: React.FC = () => {
  const { confirmDialog, setConfirmDialog, alertMessage, setAlertMessage } = useFinancialData();

  return (
    <>
      {/* CUSTOM CONFIRMATION DIALOG */}
      <AnimatePresence>
        {confirmDialog.isOpen && (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              transition={{ duration: 0.15 }}
              className="bg-zinc-950 border border-white/10 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl"
            >
              <div className="p-6">
                <h3 className="text-sm font-bold font-sans text-zinc-100 uppercase tracking-wider mb-2">
                  {confirmDialog.title}
                </h3>
                <p className="text-xs text-zinc-400 font-medium leading-relaxed">
                  {confirmDialog.message}
                </p>
              </div>
              <div className="px-6 py-4 bg-zinc-900/45 border-t border-white/5 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setConfirmDialog((prev) => ({ ...prev, isOpen: false }))
                  }
                  className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-zinc-300 font-semibold text-xs transition-all"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    confirmDialog.onConfirm();
                    setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
                  }}
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs transition-all shadow-md"
                >
                  Confirm
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CUSTOM ALERT DIALOG */}
      <AnimatePresence>
        {alertMessage && (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              transition={{ duration: 0.15 }}
              className="bg-zinc-950 border border-white/10 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl p-6"
            >
              <p className="text-sm font-medium text-zinc-200 mb-5 leading-relaxed">
                {alertMessage}
              </p>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setAlertMessage(null)}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all shadow-md"
                >
                  OK
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
