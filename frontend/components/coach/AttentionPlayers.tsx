import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Player } from "@/lib/types";

export function AttentionPlayers({ items }: { items: Player[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>要フォロー選手</CardTitle>
        <div className="mt-1 text-sm text-neutral-600">止まっている / 偏り / 申告あり を優先表示</div>
      </CardHeader>
      <CardContent className="space-y-2">
        {items.map((p) => (
          <div key={p.id} className="flex items-center justify-between rounded-2xl border bg-white p-3">
            <div>
              <div className="text-sm font-semibold">
                {p.name} <span className="text-xs font-normal text-neutral-600">{p.grade ?? ""}</span>
              </div>
              <div className="mt-1 flex flex-wrap gap-1">
                {(p.tags ?? []).length ? (p.tags ?? []).map((t) => <Badge key={t}>{t}</Badge>) : <span className="text-xs text-neutral-500">特記事項なし</span>}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-neutral-600">今週</div>
              <div className="text-sm font-semibold">{p.weeklyPracticeCount}回 / {p.weeklyMinutes}分</div>
              <div className="text-xs text-neutral-500">最終ログ {p.lastLogDaysAgo}日前</div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
