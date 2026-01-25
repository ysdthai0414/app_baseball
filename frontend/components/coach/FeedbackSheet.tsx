"use client";

import React, { useMemo, useState } from "react";
import { Sheet } from "@/components/ui/Sheet";
import { Button } from "@/components/ui/Button";
import { players as mockPlayers } from "@/lib/mock";

export function FeedbackSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const players = useMemo(() => mockPlayers, []);
  const [playerId, setPlayerId] = useState(players[0]?.id ?? "");
  const [good, setGood] = useState("");
  const [next, setNext] = useState("");
  const [saving, setSaving] = useState(false);

  async function onSave() {
    setSaving(true);
    try {
      // TODO: FastAPIへ接続（次ステップで差し替え）
      // comment は { good, next } の object で送る前提
      await new Promise((r) => setTimeout(r, 400));
      onClose();
      setGood("");
      setNext("");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Sheet open={open} onClose={onClose} title="練習後フィードバック（監督）">
      <div className="space-y-4">
        <div>
          <div className="text-xs text-neutral-600">選手</div>
          <select
            className="mt-1 w-full rounded-xl border bg-white px-3 py-2 text-sm"
            value={playerId}
            onChange={(e) => setPlayerId(e.target.value)}
          >
            {players.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        <div>
          <div className="text-xs text-neutral-600">良かった点（Good）</div>
          <textarea
            className="mt-1 w-full rounded-xl border bg-white px-3 py-2 text-sm"
            rows={4}
            value={good}
            onChange={(e) => setGood(e.target.value)}
          />
        </div>

        <div>
          <div className="text-xs text-neutral-600">次に意識する点（Next）</div>
          <textarea
            className="mt-1 w-full rounded-xl border bg-white px-3 py-2 text-sm"
            rows={4}
            value={next}
            onChange={(e) => setNext(e.target.value)}
          />
        </div>

        <div className="flex gap-2">
          <Button variant="primary" onClick={onSave} disabled={saving || (!good && !next)}>
            {saving ? "保存中..." : "保存"}
          </Button>
          <Button variant="secondary" onClick={onClose}>キャンセル</Button>
        </div>
      </div>
    </Sheet>
  );
}
