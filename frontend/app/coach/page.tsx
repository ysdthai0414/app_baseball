"use client";

import React, { useMemo, useState } from "react";
import { weekSummary, players, teamRecs } from "@/lib/mock";
import { WeekSummaryCards } from "@/components/coach/WeekSummaryCards";
import { AttentionPlayers } from "@/components/coach/AttentionPlayers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { FeedbackSheet } from "@/components/coach/FeedbackSheet";
import { CurrentLevelCard } from "@/components/level/CurrentLevelCard";

/**
 * 仮：チーム全体の代表的なスキル状況（直近評価ベース）
 * → 後で API から取得する
 */
const mockLevels = {
  batting: 6,
  throwing: 7,
  catching: 5,
  running: 6,
  iq: 8,
} as const;

export default function CoachHomePage() {
  const [sheetOpen, setSheetOpen] = useState(false);

  const attention = useMemo(() => {
    return players
      .slice()
      .sort((a, b) => (b.tags?.length ?? 0) - (a.tags?.length ?? 0))
      .slice(0, 5);
  }, []);

  return (
    <div className="space-y-6">
      {/* ① 週次サマリ */}
      <WeekSummaryCards summary={weekSummary} />

      {/* ② スキルレベル（主語を明示） */}
      <section className="space-y-3">
        <div>
          <div className="text-sm font-semibold">
            チーム全体のスキル状況（直近評価ベース）
          </div>
          <div className="text-xs text-neutral-600">
            ※ 直近の評価結果をもとにした「チームの傾向」を示しています
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <CurrentLevelCard
            category="batting"
            currentLevel={mockLevels.batting}
            title="打つ（バッティング）｜チームの現在地"
          />
          <CurrentLevelCard
            category="throwing"
            currentLevel={mockLevels.throwing}
            title="投げる（スローイング）｜チームの現在地"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <CurrentLevelCard
            category="catching"
            currentLevel={mockLevels.catching}
            title="捕る（キャッチング）｜チームの現在地"
          />
          <CurrentLevelCard
            category="running"
            currentLevel={mockLevels.running}
            title="走る（走塁・スピード）｜チームの現在地"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <CurrentLevelCard
            category="iq"
            currentLevel={mockLevels.iq}
            title="ルール・マナー（野球IQ）｜チームの現在地"
          />

          {/* 余白カード（将来拡張用） */}
          <Card>
            <CardHeader>
              <CardTitle>今週の見るポイント（チーム全体）</CardTitle>
              <div className="mt-1 text-sm text-neutral-600">
                スキルレベルと家庭練の傾向から整理
              </div>
            </CardHeader>
            <CardContent className="text-sm text-neutral-700 space-y-2">
              <div className="rounded-xl border bg-white p-3">
                ・捕球→送球を「速さより正確さ」で揃える
              </div>
              <div className="rounded-xl border bg-white p-3">
                ・走塁のスタート判断を声かけで統一
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ③ 既存：要フォロー & 休日練習 */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <AttentionPlayers items={attention} />

        <Card>
          <CardHeader>
            <CardTitle>次の休日練習：おすすめ</CardTitle>
            <div className="mt-1 text-sm text-neutral-600">
              今週の家庭練状況から提案
            </div>
          </CardHeader>

          <CardContent className="space-y-3">
            {teamRecs.map((r) => (
              <div key={r.id} className="rounded-2xl border bg-white p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-sm font-semibold">{r.title}</div>
                  <div className="flex flex-wrap gap-1">
                    {r.reasonTags.map((t) => (
                      <Badge key={t}>{t}</Badge>
                    ))}
                  </div>
                </div>

                <div className="mt-2 text-sm text-neutral-700">
                  {r.description}
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <Button variant="primary" size="sm">
                    採用
                  </Button>
                  <Button variant="secondary" size="sm">
                    調整
                  </Button>
                  <Button variant="ghost" size="sm">
                    却下
                  </Button>

                  <div className="ml-auto">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setSheetOpen(true)}
                    >
                      練習後フィードバックを書く
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <FeedbackSheet open={sheetOpen} onClose={() => setSheetOpen(false)} />
    </div>
  );
}
