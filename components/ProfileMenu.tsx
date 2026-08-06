"use client";

import React, { useEffect, useRef, useState } from "react";
import { User, Settings as SettingsIcon, LogOut } from "lucide-react";
import { useFinancialData } from "./FinancialOSContext";

export const ProfileMenu: React.FC = () => {
  const { setActiveTab, signOut } = useFinancialData();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        title="Profile menu"
        aria-label="Profile menu"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        className="flex items-center justify-center w-9 h-9 rounded-xl bg-zinc-900/60 hover:bg-zinc-900 border border-white/5 text-zinc-300 hover:text-white transition-colors cursor-pointer"
      >
        <User className="w-4 h-4" />
      </button>

      {isOpen && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-2 w-44 bg-zinc-900 border border-white/10 rounded-xl shadow-xl py-1.5 z-50"
        >
          <button
            role="menuitem"
            onClick={() => {
              setActiveTab("settings");
              setIsOpen(false);
            }}
            className="flex items-center gap-2.5 w-full px-3.5 py-2 text-xs font-semibold text-zinc-300 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
          >
            <SettingsIcon className="w-3.5 h-3.5 text-zinc-400" />
            <span>Settings</span>
          </button>
          <button
            role="menuitem"
            onClick={() => {
              setIsOpen(false);
              signOut();
            }}
            className="flex items-center gap-2.5 w-full px-3.5 py-2 text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-white/5 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default ProfileMenu;
