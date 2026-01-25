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
    // 🌟 全体の背景を一段濃いめの bg-slate-100 にして、カードの白を際立たせる
    <div className="min-h-screen bg-slate-100 font-['M_PLUS_Rounded_1c'] pb-20 relative z-10">
      
      {/* 🌟 芝生ヘッダー（境界線をはっきりさせる） */}
      <div className="h-3 bg-gradient-to-r from-green-500 to-emerald-400 w-full shadow-md border-b border-green-600/20" />

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-12">
        
        {/* --- 👑 SECTION 1: 今週のチームコンディション (ここを大幅強化) --- */}
        <section className="space-y-4">
          <div className="flex items-center gap-3 px-2">
            <span className="text-3xl drop-shadow-md">📈</span>
            <div>
              <h2 className="text-2xl font-black text-slate-900 drop-shadow-sm">今週のチームコンディション</h2>
              <p className="text-xs font-bold text-slate-500">家庭練習の実施状況まとめ</p>
            </div>
          </div>
          
          {/* 🌟 修正：不透明な白い「浮き出たボード」を作成 */}
          <div className="bg-white rounded-[40px] p-8 shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-white relative overflow-hidden">
            {/* ボードの背景にさりげなく色をつけて文字を浮かせる */}
            <div className="absolute inset-0 bg-gradient-to-br from-white via-white to-blue-50/30 pointer-events-none" />
            
            <div className="relative z-10">
              <WeekSummaryCards summary={weekSummary} />
            </div>
          </div>
        </section>

        {/* --- 📊 SECTION 2: チームスキル分析 --- */}
        <section className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
              <span className="text-2xl">📊</span>
              <h2 className="text-xl font-black text-slate-800">スキル分析レポート</h2>
            </div>
            <Badge className="bg-blue-600 text-white border-none px-4 py-1.5 font-bold shadow-lg shadow-blue-200">
              最新評価
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <CurrentLevelCard category="batting" currentLevel={mockLevels.batting} title="打つ（バッティング）" />
            <CurrentLevelCard category="throwing" currentLevel={mockLevels.throwing} title="投げる（スローイング）" />
            <CurrentLevelCard category="catching" currentLevel={mockLevels.catching} title="捕る（キャッチング）" />
            <CurrentLevelCard category="running" currentLevel={mockLevels.running} title="走る（走塁・スピード）" />
            <CurrentLevelCard category="iq" currentLevel={mockLevels.iq} title="野球IQ（ルール・マナー）" />

            {/* 戦略メモカード（背景色を濃くして読みやすく） */}
            <Card className="rounded-[32px] border-none shadow-xl bg-slate-900 text-white overflow-hidden">
              <CardHeader className="pb-2 border-b border-white/10">
                <CardTitle className="text-lg flex items-center gap-2">
                  <span className="text-yellow-400">💡</span> 戦略メモ
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm p-6 space-y-4 font-bold leading-relaxed">
                <div className="flex gap-3 items-start bg-white/10 p-4 rounded-2xl">
                  <span className="text-blue-400">●</span>
                  <span>捕球→送球を「正確さ重視」で統一</span>
                </div>
                <div className="flex gap-3 items-start bg-white/10 p-4 rounded-2xl">
                  <span className="text-blue-400">●</span>
                  <span>走塁のスタート判断を声かけで揃える</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* --- ⚡ SECTION 3: 個別フォロー & 次回メニュー --- */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-10 pt-4">
          
          <div className="space-y-4">
            <div className="flex items-center gap-2 px-4">
              <span className="text-2xl">⚠️</span>
              <h2 className="text-xl font-black text-slate-800">要フォロー選手</h2>
            </div>
            <div className="bg-white rounded-[40px] shadow-xl overflow-hidden border border-white">
              <AttentionPlayers items={attention} />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2 px-4">
              <span className="text-2xl">📋</span>
              <h2 className="text-xl font-black text-slate-800">次回の特訓案</h2>
            </div>
            
            <div className="space-y-6">
              {teamRecs.map((r) => (
                <Card key={r.id} className="rounded-[32px] border-none shadow-lg bg-white/90 backdrop-blur-sm">
                  <CardContent className="p-8">
                    <div className="flex justify-between items-start mb-4">
                      <h4 className="font-black text-slate-900 text-lg leading-tight">{r.title}</h4>
                      <div className="flex gap-1">
                        {r.reasonTags.map((t) => (
                          <Badge key={t} className="bg-orange-100 text-orange-700 border-none font-black text-[10px] px-2">
                            {t}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-slate-600 font-bold leading-relaxed mb-8">
                      {r.description}
                    </p>
                    <div className="flex items-center gap-4 pt-6 border-t border-slate-100">
                      <Button variant="secondary" className="rounded-full px-8 bg-slate-100 text-slate-900 hover:bg-slate-200 font-black text-xs h-12">
                        今回は見送り
                      </Button>
                      <Button 
                        variant="primary"
                        className="flex-1 rounded-full bg-blue-600 text-white hover:bg-blue-700 font-black text-xs h-12 shadow-lg shadow-blue-200"
                        onClick={() => setSheetOpen(true)}
                      >
                        フィードバック作成 ✍️
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </div>

      <FeedbackSheet open={sheetOpen} onClose={() => setSheetOpen(false)} />
    </div>
  );
  return (
    // 🌟 修正：不透明な背景色 (bg-slate-50) と文字色 (text-slate-900) を強制する
    <div className="min-h-screen bg-slate-50 text-slate-900 font-['M_PLUS_Rounded_1c'] pb-20 relative z-10">
      
      {/* 芝生ヘッダー */}
      <div className="h-3 bg-gradient-to-r from-green-500 to-emerald-400 w-full shadow-md" />

      {/* コンテンツ */}
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-12">
        {/* ... */}
      </div>
    </div>
  );
}

