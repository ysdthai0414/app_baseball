"use client";

import React, { useEffect, useMemo, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { CurrentLevelCard } from "@/components/level/CurrentLevelCard";
import PlayerHeaderActions from "./PlayerHeaderActions";
import type { SkillCategory } from "@/lib/levelTable";
import { TRAINING_MENU } from "@/lib/trainingMenu";

// 環境変数対応
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";

type Evaluation = {
  id: number;
  child_id: number;
  evaluated_at: string;
  values: Record<string, number>;
} | null;

type PracticeLog = {
  id: number;
  practice_date: string;
  mood?: number;
  fatigue?: number;
  today_practice?: string;
  free_note?: string;
  content?: string; // 追加
  ai_feedback?: string; // 追加
} | null;

const SKILL_LABEL: Record<SkillCategory, string> = {
  batting: "🚀 打つ (バッティング)",
  throwing: "🎯 投げる (スローイング)",
  catching: "🧤 捕る (キャッチング)",
  running: "⚡ 走る (走塁・スピード)",
  iq: "🧠 ルール・マナー (野球IQ)",
};
const SKILL_KEYS: SkillCategory[] = ["batting", "throwing", "catching", "running", "iq"];

function clampLevel(n: number) {
  if (!Number.isFinite(n)) return 10;
  return Math.min(10, Math.max(1, Math.floor(n)));
}

function pickMenu(category: SkillCategory, currentLevel: number) {
  const level = clampLevel(currentLevel);
  const menus = TRAINING_MENU[category] ?? [];
  return menus.find((m) => m.minLevel <= level && level <= m.maxLevel) ?? null;
}

export default function PlayerPage() {
  const params = useParams();
  const playerId = (params?.id as string) ?? "1";

  const [latest, setLatest] = useState<Evaluation>(null);
  const [latestLog, setLatestLog] = useState<PracticeLog>(null);
  const [body, setBody] = useState("");
  const [mood, setMood] = useState(3);
  const [fatigue, setFatigue] = useState(3);
  const [tags, setTags] = useState<SkillCategory[]>([]);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");

  const reportRef = useRef<HTMLDivElement | null>(null);

  const refresh = async () => {
    try {
      const childId = playerId.replace(/\D/g, "") || "1";
      const [rEval, rLog] = await Promise.all([
        fetch(`${API_BASE}/players/${playerId}/evaluations/latest`).catch(()=>({ok:false, json:async()=>null})),
        fetch(`${API_BASE}/practice-logs/latest?child_id=${childId}&practice_type=weekend`).catch(()=>({ok:false, json:async()=>null})),
      ]);
      if (rEval.ok) setLatest(await rEval.json());
      if (rLog.ok) setLatestLog(await rLog.json());
    } catch (e) { console.error(e); }
  };

  useEffect(() => { refresh(); }, [playerId]);

  const skillLevels = useMemo(() => {
    const v = latest?.values ?? {};
    return {
      batting: Math.min(10, Math.max(1, Number(v.batting ?? 10))),
      throwing: Math.min(10, Math.max(1, Number(v.throwing ?? 10))),
      catching: Math.min(10, Math.max(1, Number(v.catching ?? 10))),
      running: Math.min(10, Math.max(1, Number(v.running ?? 10))),
      iq: Math.min(10, Math.max(1, Number(v.iq ?? 10))),
    };
  }, [latest]);

  const submitDailyReport = async () => {
    if (!body.trim() && tags.length === 0) return;
    setSaving(true);
    try {
      // 🌟 ここを修正：バックエンドの新しい項目に合わせて空文字などを送る
      const payload = {
        child_id: Number(playerId.replace(/\D/g, "")),
        practice_date: new Date().toISOString().split('T')[0],
        practice_type: "weekend",
        mood, fatigue,
        today_practice: tags.map(t => SKILL_LABEL[t]).join("、"),
        free_note: body.trim(),
        content: body.trim(), // 本文として同じものを送る
        coach_said: "",       // 必要なら入力フォームを作るが一旦空
        next_goal: "",        // 必要なら入力フォームを作るが一旦空
        ai_feedback: "",      // これはサーバー側で生成するものだが、送信時は空でOK
        coach_comment: ""     // これも後でつくもの
      };
      
      const res = await fetch(`${API_BASE}/practice-logs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if(!res.ok) throw new Error(await res.text());

      setSavedMsg("ナイスバッティング！監督に送ったよ！⚾️");
      setBody(""); setTags([]); setMood(3); setFatigue(3);
      refresh();
    } catch (e) {
      console.error(e);
      setSavedMsg("エラーがおきたみたい…もういちどおしてみて！");
    } finally { setSaving(false); }
  };

  return (
    <main className="min-h-screen bg-[#f0f9ff] font-['M_PLUS_Rounded_1c'] text-slate-800 pb-32">
      <div className="h-2 bg-green-500 w-full" />
      <div className="mx-auto w-full max-w-3xl px-4 py-6 space-y-6">
        <PlayerHeaderActions playerId={playerId} onRefresh={refresh} />
        {/* ヒーローエリア */}
        <div className="rounded-[32px] bg-gradient-to-br from-blue-600 to-blue-400 p-6 text-white shadow-xl shadow-blue-200">
          <div className="flex justify-between items-center">
            <div><h1 className="text-2xl font-black">きょうの選手データ</h1><p className="opacity-90 text-sm font-bold">めざせ！未来のプロ野球せんしゅ！</p></div>
            <div className="bg-white/20 backdrop-blur-md rounded-2xl p-3 text-center border border-white/30"><div className="text-[10px] font-bold">PLAYER ID</div><div className="text-xl font-black">{playerId}</div></div>
          </div>
        </div>

        {/* スキルレベル */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 px-2"><span className="text-xl">📊</span><h2 className="text-lg font-black text-blue-900">いまのキミの実力</h2></div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {SKILL_KEYS.map((cat) => (
              <div key={cat} className="group transition-transform hover:scale-[1.02]">
                <Card className="rounded-[24px] border-none shadow-md bg-white overflow-hidden">
                  <CurrentLevelCard category={cat} currentLevel={skillLevels[cat]} title={SKILL_LABEL[cat]} />
                  <div className="h-1.5 w-full bg-slate-100"><div className="h-full bg-blue-500 transition-all" style={{ width: `${(skillLevels[cat]) * 10}%` }} /></div>
                </Card>
              </div>
            ))}
          </div>
        </section>

        {/* おすすめ練習 */}
        <Card className="rounded-[32px] border-none shadow-lg bg-white overflow-hidden">
          <div className="bg-orange-400 px-6 py-3"><CardTitle className="text-white flex items-center gap-2 text-base"><span>🔥</span> きょうの特訓メニュー</CardTitle></div>
          <CardContent className="p-6 space-y-4">
            {SKILL_KEYS.map((cat) => {
              const menu = pickMenu(cat, skillLevels[cat]);
              if (!menu) return null;
              return (
                <div key={cat} className="p-4 rounded-2xl bg-orange-50 border-2 border-orange-100">
                  <div className="flex justify-between items-center mb-2"><span className="font-black text-orange-700">{SKILL_LABEL[cat]}</span><Badge className="bg-orange-500 text-white border-none">{skillLevels[cat]}級メニュー</Badge></div>
                  <div className="text-sm font-bold text-slate-700 bg-white p-3 rounded-xl shadow-sm">{menu.title}<ul className="mt-2 text-xs text-slate-500 space-y-1 list-none">{menu.items.map((it, i) => <li key={i}>✅ {it}</li>)}</ul></div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* 日報 */}
        <section ref={reportRef} className="space-y-4 pt-4">
          <div className="flex items-center gap-2 px-2"><span className="text-xl">📝</span><h2 className="text-lg font-black text-blue-900">れんしゅう日報</h2></div>
          <Card className="rounded-[32px] border-none shadow-lg bg-white p-6 space-y-6">
            <div className="space-y-3">
              <label className="text-sm font-black text-slate-600">きょうがんばったのは？</label>
              <div className="flex flex-wrap gap-2">{SKILL_KEYS.map((cat) => (<button key={cat} onClick={() => setTags(prev => prev.includes(cat) ? prev.filter(t => t !== cat) : [...prev, cat])} className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${tags.includes(cat) ? "bg-blue-600 text-white shadow-md scale-105" : "bg-slate-100 text-slate-400 hover:bg-slate-200"}`}>{SKILL_LABEL[cat].split(" ")[0]} {SKILL_LABEL[cat].split(" ")[1]}</button>))}</div>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2"><label className="text-sm font-black text-slate-600 flex justify-between"><span>😊 きぶん</span><span className="text-blue-500">{mood}</span></label><input type="range" min="1" max="5" value={mood} onChange={e => setMood(Number(e.target.value))} className="w-full accent-blue-500" /></div>
              <div className="space-y-2"><label className="text-sm font-black text-slate-600 flex justify-between"><span>💪 つかれ</span><span className="text-blue-500">{fatigue}</span></label><input type="range" min="1" max="5" value={fatigue} onChange={e => setFatigue(Number(e.target.value))} className="w-full accent-blue-500" /></div>
            </div>
            <div className="space-y-2"><label className="text-sm font-black text-slate-600">ふりかえりメモ</label><textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="ヒットが打てた！次は守備をがんばりたい！" className="w-full min-h-[120px] bg-slate-50 border-2 border-slate-100 rounded-[24px] p-4 text-sm focus:border-blue-300 focus:ring-0 outline-none transition-all" /></div>
            <Button className="w-full h-14 rounded-full bg-green-500 hover:bg-green-600 text-white text-lg font-black shadow-lg shadow-green-100 transition-transform active:scale-95" disabled={saving || (!body.trim() && tags.length===0)} onClick={submitDailyReport}>{saving ? "送信中..." : "監督に送る！ ⚾️"}</Button>
            {savedMsg && <p className="text-center text-green-600 font-bold animate-bounce">{savedMsg}</p>}
          </Card>
        </section>
      </div>
      <div className="fixed inset-x-0 bottom-6 z-40 px-4"><button onClick={() => reportRef.current?.scrollIntoView({ behavior: "smooth" })} className="mx-auto max-w-3xl w-full h-14 rounded-full bg-blue-600 text-white font-black shadow-2xl flex items-center justify-center gap-2 hover:bg-blue-700 transition-all active:scale-95"><span>✍️</span> 日報を書く</button></div>
    </main>
  );
}