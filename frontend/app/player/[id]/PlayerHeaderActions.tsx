"use client";

import React from "react";
import { useRouter } from "next/navigation";

interface PlayerHeaderActionsProps {
  playerId: string;
  onRefresh: () => Promise<void>;
}

export default function PlayerHeaderActions({ 
  playerId, 
  onRefresh 
}: PlayerHeaderActionsProps) {
  const router = useRouter();

  return (
    <div className="flex w-full items-start justify-between gap-3">
      {/* 戻るボタン */}
      <button
        type="button"
        className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/90 hover:bg-white/10"
        onClick={() => router.back()}
      >
        ← 戻る
      </button>

      <div className="flex items-center gap-2">
        {/* ⚠️ ここにあった「日報提出」ボタンは不要なので削除しました */}

        {/* 更新ボタン */}
        <button
          type="button"
          className="inline-flex items-center rounded-full bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-white/90"
          onClick={() => onRefresh()}
        >
          更新
        </button>
      </div>
    </div>
  );
}