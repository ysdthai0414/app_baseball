import React from "react";

export function CoachHeader() {
  return (
    <div className="sticky top-0 z-40 border-b bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-neutral-900" />
          <div>
            <div className="text-sm font-semibold">監督ダッシュボード</div>
            <div className="text-xs text-neutral-600">今週の家庭練 → 次の休日練習に反映</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="rounded-xl border px-3 py-2 text-sm hover:bg-neutral-50">通知</button>
          <button className="rounded-xl border px-3 py-2 text-sm hover:bg-neutral-50">設定</button>
        </div>
      </div>
    </div>
  );
}
