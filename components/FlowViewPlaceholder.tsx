"use client";

import React from "react";
import { Compass } from "lucide-react";

export const FlowViewPlaceholder: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center py-16 bg-zinc-900/20 border border-dashed border-white/10 rounded-3xl text-center">
      <Compass className="w-12 h-12 text-zinc-500 mb-3" />
      <p className="text-sm font-bold text-white">Flow view is being rebuilt</p>
      <p className="text-xs text-zinc-400 max-w-sm mt-1">
        This view is being redesigned around your single spendable pool. Use the Cash Timeline
        for now — the new Flow view is on its way.
      </p>
    </div>
  );
};
export default FlowViewPlaceholder;
