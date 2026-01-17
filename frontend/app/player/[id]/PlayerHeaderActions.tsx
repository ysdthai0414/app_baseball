"use client";

import React from "react";
import { useRouter } from "next/navigation";

export default function PlayerHeaderActions({ playerId }: { playerId: string }) {
  const router = useRouter();

  return (
    <div className="flex w-full items-start justify-between gap-3">
      <button
        type="button"
        className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/90 hover:bg-white/10"
        onClick={() => router.back()}
      >
        ← 戻る
      </button>

      <div className="flex items-center gap-2">
        <button
          type="button"
          className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10"
          onClick={() => router.push(`/daily-report/new?playerId=${playerId}`)}
        >
          日報提出
        </button>

        <button
          type="button"
          className="inline-flex items-center rounded-full bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-white/90"
          onClick={() => router.refresh()}
        >
          更新
        </button>
      </div>
    </div>
  );
}
