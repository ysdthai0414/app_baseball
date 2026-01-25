"use client";

import React, { useEffect } from "react";

export function Sheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-full max-w-lg bg-white shadow-xl">
        <div className="flex items-center justify-between border-b p-4">
          <div className="text-sm font-semibold">{title}</div>
          <button className="rounded-lg px-2 py-1 text-sm hover:bg-neutral-100" onClick={onClose}>
            閉じる
          </button>
        </div>
        <div className="h-[calc(100%-57px)] overflow-auto p-4">{children}</div>
      </div>
    </div>
  );
}
