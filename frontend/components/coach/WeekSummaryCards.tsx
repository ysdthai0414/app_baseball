import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { TeamWeekSummary } from "@/lib/types";

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border bg-white p-4">
      <div className="text-xs text-neutral-600">{label}</div>
      <div className="mt-1 text-xl font-semibold">{value}</div>
    </div>
  );
}

export function WeekSummaryCards({ summary }: { summary: TeamWeekSummary }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>今週の家庭練サマリ</CardTitle>
        <div className="mt-1 text-sm text-neutral-600">{summary.weekLabel}</div>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="実施率" value={`${summary.teamPracticeRate}%`} />
        <Stat label="総練習時間" value={`${summary.totalMinutes}分`} />
        <Stat label="平均回数" value={`${summary.avgCount}回/人`} />
        <Stat label="記録なし" value={`${summary.noLogPlayers}人`} />
      </CardContent>
    </Card>
  );
}
