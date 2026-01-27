"use client";

import React, { useEffect, useMemo, useState, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useRouter } from "next/navigation";

// 環境変数対応
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") || "http://127.0.0.1:8000";

// --- 型定義 ---
type SkillCategory = "batting" | "throwing" | "catching" | "running" | "iq";

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
  content?: string; 
  ai_feedback?: string; 
} | null;

type MenuData = { minLevel: number; maxLevel: number; title: string; items: string[] };

// --- 定数データ ---
const SKILL_LABEL: Record<SkillCategory, string> = {
  batting: "🚀 打つ (バッティング)",
  throwing: "🎯 投げる (スローイング)",
  catching: "🧤 捕る (キャッチング)",
  running: "⚡ 走る (走塁・スピード)",
  iq: "🧠 ルール・マナー (野球IQ)",
};
const SKILL_KEYS: SkillCategory[] = ["batting", "throwing", "catching", "running", "iq"];

const TRAINING_MENU: Record<SkillCategory, MenuData[]> = {
  batting: [
    { minLevel: 8, maxLevel: 10, title: "スイングの土台作り", items: ["鏡の前でポーズ (1分×3回)", "新聞紙ボール打ち"] },
    { minLevel: 4, maxLevel: 7, title: "フルスイング・ミート", items: ["ターゲット素振り (10回)", "スローモーション素振り"] },
    { minLevel: 1, maxLevel: 3, title: "長打・スピード対応", items: ["1分間高速素振り"] },
  ],
  throwing: [
    { minLevel: 8, maxLevel: 10, title: "コントロールと握り", items: ["くるくるポン (1日50回)", "壁立ちステップ"] },
    { minLevel: 4, maxLevel: 7, title: "正確さ・腕の振り", items: ["タオルスロー", "ターゲットネット (10球)"] },
    { minLevel: 1, maxLevel: 3, title: "強肩・投手", items: ["指先はじき (1日100回)"] },
  ],
  catching: [
    { minLevel: 8, maxLevel: 10, title: "手止め・フライ", items: ["自分フライ", "おべんとう捕球"] },
    { minLevel: 4, maxLevel: 7, title: "正面・フットワーク", items: ["壁当て (ゴムボール)", "お手玉"] },
    { minLevel: 1, maxLevel: 3, title: "逆シングル・連携", items: ["テニスボール捕球"] },
  ],
  running: [
    { minLevel: 7, maxLevel: 10, title: "全力・フォーム", items: ["腕振りダッシュ (10秒×3)", "スキップトレーニング"] },
    { minLevel: 1, maxLevel: 6, title: "スタート・ベース", items: ["リアクション・スタート", "シャトルラン"] },
  ],
  iq: [
    { minLevel: 1, maxLevel: 10, title: "野球IQアップ", items: ["プロ野球観戦ミッション", "道具みがき (毎日5分)", "ルールクイズ (3問)"] },
  ],
};

function clampLevel(n: number) {
  if (!Number.isFinite(n)) return 10;
  return Math.min(10, Math.max(1, Math.floor(n)));
}

function pickMenu(category: SkillCategory, currentLevel: number) {
  const level = clampLevel(currentLevel);
  const menus = TRAINING_MENU[category] ?? [];
  return menus.find((m) => m.minLevel <= level && level <= m.maxLevel) ?? menus[0];
}

// --- メインコンポーネント ---
export default function PlayerPage() {
  const params = useParams();
  const playerId = (params?.id as string) ?? "1";
  const router = useRouter();

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
      // @ts-ignore
      if (rEval.ok) setLatest(await rEval.json());
      // @ts-ignore
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
      const payload = {
        child_id: Number(playerId.replace(/\D/g, "")),
        practice_date: new Date().toISOString().split('T')[0],
        practice_type: "weekend",
        mood, fatigue,
        today_practice: tags.map(t => SKILL_LABEL[t]).join("、"),
        free_note: body.trim(),
        content: body.trim(),
        coach_said: "", next_goal: "", ai_feedback: "", coach_comment: ""
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
        
        {/* Topに戻るボタン */}
        <div className="flex justify-end">
          <Link href="/player" className="text-xs font-bold text-slate-400 bg-white px-3 py-1 rounded-full border border-slate-200 hover:bg-slate-50 transition-colors no-underline">
             ↩ せんしゅをえらぶ
          </Link>
        </div>

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
                <div className="rounded-[24px] border-none shadow-md bg-white overflow-hidden p-0">
                  <div className="p-4">
                     <div className="text-xs font-bold text-slate-400 mb-1">{SKILL_LABEL[cat]}</div>
                     <div className="flex items-end gap-2"><span className="text-4xl font-black text-blue-600">{skillLevels[cat]}</span><span className="text-sm font-bold text-slate-400 mb-2">級</span></div>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100"><div className="h-full bg-blue-500 transition-all" style={{ width: `${((11 - skillLevels[cat]) / 10) * 100}%` }} /></div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* おすすめ練習 */}
        <div className="rounded-[32px] border-none shadow-lg bg-white overflow-hidden">
          <div className="bg-orange-400 px-6 py-3 text-white font-bold flex items-center gap-2 text-base"><span>🔥</span> きょうの特訓メニュー</div>
          <div className="p-6 space-y-4">
            {SKILL_KEYS.map((cat) => {
              const menu = pickMenu(cat, skillLevels[cat]);
              if (!menu) return null;
              return (
                <div key={cat} className="p-4 rounded-2xl bg-orange-50 border-2 border-orange-100">
                  <div className="flex justify-between items-center mb-2"><span className="font-black text-orange-700">{SKILL_LABEL[cat]}</span><div className="bg-orange-500 text-white px-2 py-0.5 rounded text-xs font-bold">{skillLevels[cat]}級メニュー</div></div>
                  <div className="text-sm font-bold text-slate-700 bg-white p-3 rounded-xl shadow-sm">{menu.title}<ul className="mt-2 text-xs text-slate-500 space-y-1 list-none pl-0 m-0">{menu.items.map((it, i) => <li key={i}>✅ {it}</li>)}</ul></div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 日報 */}
        <section ref={reportRef} className="space-y-4 pt-4">
          <div className="flex items-center gap-2 px-2"><span className="text-xl">📝</span><h2 className="text-lg font-black text-blue-900">れんしゅう日報</h2></div>
          <div className="rounded-[32px] border-none shadow-lg bg-white p-6 space-y-6">
            <div className="space-y-3">
              <label className="text-sm font-black text-slate-600">きょうがんばったのは？</label>
              <div className="flex flex-wrap gap-2">{SKILL_KEYS.map((cat) => (<button key={cat} onClick={() => setTags(prev => prev.includes(cat) ? prev.filter(t => t !== cat) : [...prev, cat])} className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${tags.includes(cat) ? "bg-blue-600 text-white shadow-md scale-105" : "bg-slate-100 text-slate-400 hover:bg-slate-200"}`}>{SKILL_LABEL[cat].split(" ")[0]} {SKILL_LABEL[cat].split(" ")[1]}</button>))}</div>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2"><label className="text-sm font-black text-slate-600 flex justify-between"><span>😊 きぶん</span><span className="text-blue-500">{mood}</span></label><input type="range" min="1" max="5" value={mood} onChange={e => setMood(Number(e.target.value))} className="w-full accent-blue-500" /></div>
              <div className="space-y-2"><label className="text-sm font-black text-slate-600 flex justify-between"><span>💪 つかれ</span><span className="text-blue-500">{fatigue}</span></label><input type="range" min="1" max="5" value={fatigue} onChange={e => setFatigue(Number(e.target.value))} className="w-full accent-blue-500" /></div>
            </div>
            <div className="space-y-2"><label className="text-sm font-black text-slate-600">ふりかえりメモ</label><textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="ヒットが打てた！次は守備をがんばりたい！" className="w-full min-h-[120px] bg-slate-50 border-2 border-slate-100 rounded-[24px] p-4 text-sm focus:border-blue-300 focus:ring-0 outline-none transition-all" /></div>
            <button className="w-full h-14 rounded-full bg-green-500 hover:bg-green-600 text-white text-lg font-black shadow-lg shadow-green-100 transition-transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed" disabled={saving || (!body.trim() && tags.length===0)} onClick={submitDailyReport}>{saving ? "送信中..." : "監督に送る！ ⚾️"}</button>
            {savedMsg && <p className="text-center text-green-600 font-bold animate-bounce">{savedMsg}</p>}
          </div>
        </section>
      </div>
      <div className="fixed inset-x-0 bottom-6 z-40 px-4"><button onClick={() => reportRef.current?.scrollIntoView({ behavior: "smooth" })} className="mx-auto max-w-3xl w-full h-14 rounded-full bg-blue-600 text-white font-black shadow-2xl flex items-center justify-center gap-2 hover:bg-blue-700 transition-all active:scale-95"><span>✍️</span> 日報を書く</button></div>
    </main>
  );
}