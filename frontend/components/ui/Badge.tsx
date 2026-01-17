import React from "react";

export function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border bg-neutral-50 px-2 py-0.5 text-xs text-neutral-700">
      {children}
    </span>
  );
}
