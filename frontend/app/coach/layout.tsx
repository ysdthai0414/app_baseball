import React from "react";

export default function PlayerLayout({ children }: { children: React.ReactNode }) {
  // 選手画面専用のダークテーマレイアウト
  return (
    <div className="min-h-screen bg-[#070B14] text-slate-100 font-sans">
      {children}
    </div>
  );
}