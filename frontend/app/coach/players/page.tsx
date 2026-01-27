"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

// --- 1. 設定 & 型定義 ---

// ⚠️ 重要: ここをバックエンドのポートに合わせてください（8000 か 8001 か確認！）
const API_BASE = "http://localhost:8001"; 
// ↑ もし Uvicorn が 8000 で動いているなら、ここを 8000 に戻してください。

// スキルカテゴリ
type SkillCategory = "batting" | "throwing" | "catching" | "running" | "iq";

const SKILL_LABEL: Record<SkillCategory, string> = {
  batting: "打つ（バッティング）",
  throwing: "投げる（スローイング）",
  catching: "捕る（キャッチング）",
  running: "走る（走塁・スピード）",
  iq: "ルール・マナー（野球IQ）",
};

// レコメンド用メニュー
type Menu = { title: string; minLevel: number; maxLevel: number; items: string[] };
const TRAINING_MENU: Record<SkillCategory, Menu[]> = {
  batting: [
    { title: "バットに当てる練習", minLevel: 1, maxLevel: 3, items: ["素振り 30回", "置きティー"] },
    { title: "強い打球を打つ", minLevel: 4, maxLevel: 7, items: ["ロングティー", "トスバッティング"] },
    { title: "実戦バッティング", minLevel: 8, maxLevel: 10, items: ["変化球打ち", "コース打ち分け"] },
  ],
  throwing: [
    { title: "ボールの握りと投げ方", minLevel: 1, maxLevel: 3, items: ["手首のスナップ練習", "ネットスロー"] },
    { title: "狙ったところに投げる", minLevel: 4, maxLevel: 7, items: ["キャッチボール", "塁間送球"] },
    { title: "遠投と送球スピード", minLevel: 8, maxLevel: 10, items: ["遠投 50m〜", "クイックスロー"] },
  ],
  catching: [
    { title: "ボールを怖がらない", minLevel: 1, maxLevel: 3, items: ["柔らかいボールで手捕り", "ゴロを正面で止める"] },
    { title: "フライとゴロの基本", minLevel: 4, maxLevel: 7, items: ["フライキャッチ", "ショーバン捕球"] },
    { title: "応用守備", minLevel: 8, maxLevel: 10, items: ["逆シングル", "タッチプレー"] },
  ],
  running: [
    { title: "走るフォーム作り", minLevel: 1, maxLevel: 3, items: ["腕振り練習", "スタートダッシュ"] },
    { title: "ベースランニング", minLevel: 4, maxLevel: 7, items: ["オーバーラン", "スライディング"] },
    { title: "盗塁と判断", minLevel: 8, maxLevel: 10, items: ["リード幅の拡大", "打球判断スタート"] },
  ],
  iq: [
    { title: "道具とルールの基本", minLevel: 1, maxLevel: 3, items: ["道具を並べる", "アウトとセーフを知る"] },
    { title: "ポジションの役割", minLevel: 4, maxLevel: 7, items: ["カバーリング", "ボールカウントの理解"] },
    { title: "状況判断", minLevel: 8, maxLevel: 10, items: ["サインプレー", "次のプレーの予測"] },
  ],
};

type Evaluation = {
  id: number;
  created_at: string;
  player_id: string;
  values: Record<string, number>;
  comment?: string | { good?: string; next?: string };
} | null;

type PracticeLog = {
  id: number;
  child_id: number;
  practice_date: string;
  content?: string;
  today_practice?: string;
  coach_said?: string;
  next_goal?: string;
  free_note?: string;
  mood?: number;
  fatigue?: number;
  created_at?: string;
} | null;

function clampLevel(n: number) {
  if (!Number.isFinite(n)) return 10;
  return Math.min(10, Math.max(1, Math.floor(n)));
}

function pickMenu(category: SkillCategory, currentLevel: number) {
  const level = clampLevel(currentLevel);
  const menus = TRAINING_MENU[category] ?? [];
  return menus.find((m) => m.minLevel <= level && level <= m.maxLevel) ?? null;
}

function todayYYYYMMDD() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

function toChildId(playerId: string): number {
  const n = Number(playerId);
  if (!Number.isNaN(n) && n > 0) return n;
  const digits = playerId.replace(/\D/g, "");
  const nn = Number(digits);
  return (!Number.isNaN(nn) && nn > 0) ? nn : 0;
}

// --- メインコンポーネント ---
export default function PlayerPage() {
  const params = useParams();
  const playerId = params?.id ? String(params.id) : "1";
  
  const [latestEval, setLatestEval] = useState<Evaluation>(null);
  const [latestLog, setLatestLog] = useState<PracticeLog>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [didToday, setDidToday] = useState("");
  const [coachSaid, setCoachSaid] = useState("");
  const [goalNext, setGoalNext] = useState("");
  const [freeNote, setFreeNote] = useState("");
  const [mood, setMood] = useState<number>(3);
  const [fatigue, setFatigue] = useState<number>(3);
  const [submitting, setSubmitting] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");

  // 2. データ取得（エラーハンドリング強化版）
  const refresh = async () => {
    try {
      setLoading(true);
      setError("");
      
      const childId = toChildId(playerId);
      if (childId === 0) throw new Error("無効なプレイヤーIDです");

      // 個別にfetchして、片方が失敗しても止まらないようにする
      const fetchEval = fetch(`${API_BASE}/players/${playerId}/evaluations/latest`, { cache: "no-store" })
        .then(async (res) => {
          if (res.ok) return res.json();
          // 404の場合はデータなしとして扱う（エラーにしない）
          if (res.status === 404) return null;
          throw new Error(`評価取得エラー: ${res.status}`);
        });

      const fetchLog = fetch(`${API_BASE}/practice-logs/latest?child_id=${childId}&practice_type=weekend`, { cache: "no-store" })
        .then(async (res) => {
          if (res.ok) return res.json();
          if (res.status === 404) return null;
          throw new Error(`ログ取得エラー: ${res.status}`);
        });

      // 並列実行
      const [evalData, logData] = await Promise.all([
        fetchEval.catch(e => { console.warn(e); return null; }), // 失敗してもnullを返す
        fetchLog.catch(e => { console.warn(e); return null; })
      ]);

      setLatestEval(evalData);
      setLatestLog(logData);

      // もし両方とも通信エラー（Failed to fetch）ならエラーを表示
      if (!evalData && !logData) {
         // 簡単なチェック: もともとデータがないだけか、通信エラーか
         // ここではユーザーへの案内を優先
         console.log("データが見つかりません、または通信エラーです。");
      }

    } catch (e: any) {
      console.error(e);
      setError(`サーバーに繋がりません (${API_BASE})。サーバーが起動しているか、ポート番号が合っているか確認してください。`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playerId]);

  // 3. レコメンド計算
  const skillLevels = useMemo(() => {
    const v = latestEval?.values ?? {};
    const get = (k: string) => clampLevel(Number(v[k] ?? 1));
    return {
      batting: get("batting"),
      throwing: get("throwing"),
      catching: get("catching") || get("defense"),
      running: get("running"),
      iq: get("iq"),
    };
  }, [latestEval]);

  const focusKey = useMemo<SkillCategory | null>(() => {
    if (!latestEval) return null;
    const keys: SkillCategory[] = ["batting", "throwing", "catching", "running", "iq"];
    const sorted = [...keys].sort((a, b) => skillLevels[a] - skillLevels[b]);
    return sorted[0];
  }, [latestEval, skillLevels]);

  // 4. 日報送信
  const submitWeekendReport = async () => {
    try {
      setSubmitting(true);
      setError("");
      setSavedMsg("");

      const childId = toChildId(playerId);
      if (!didToday && !coachSaid && !goalNext && !freeNote) {
        alert("⚠️ 入力項目が空です。");
        return;
      }

      const combinedContent = [
        `【今日やった練習】\n${didToday || "なし"}`,
        `【コーチに言われたこと】\n${coachSaid || "なし"}`,
        `【次の目標】\n${goalNext || "なし"}`,
        `【自由メモ】\n${freeNote || "なし"}`
      ].join("\n\n");

      const payload = {
        child_id: childId,
        practice_date: todayYYYYMMDD(),
        practice_type: "weekend", 
        mood: mood,
        fatigue: fatigue,
        today_practice: didToday,
        coach_said: coachSaid,
        next_goal: goalNext,
        free_note: freeNote,
        content: combinedContent, 
      };

      const res = await fetch(`${API_BASE}/practice-logs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`送信失敗 (${res.status}): ${errorText}`);
      }

      alert("✅ 監督に日報を送りました！");
      setSavedMsg("監督に日報を送りました！🔥");
      
      setDidToday("");
      setCoachSaid("");
      setGoalNext("");
      setFreeNote("");
      setMood(3);
      setFatigue(3);
      await refresh();

    } catch (e: any) {
      console.error(e);
      alert(`エラーが発生しました💦\n\n${e.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const cardClass = "bg-white rounded-[24px] p-6 shadow-sm border border-slate-200";
  const labelClass = "block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2";
  const inputClass = "w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900";

  return (
    <main className="min-h-screen bg-[#0f172a] text-slate-100 pb-32 font-sans">
      <div className="max-w-3xl mx-auto px-4 pt-8 space-y-8">
        
        <div className="flex justify-between items-center">
          <div>
            <Link href="/" className="text-sm text-slate-400 hover:text-white">← トップへ戻る</Link>
            <h1 className="text-2xl font-bold mt-1">マイページ (ID: {playerId})</h1>
          </div>
          <button onClick={refresh} className="text-xs bg-slate-800 px-3 py-2 rounded-full border border-slate-700 hover:bg-slate-700">
            {loading ? "更新中..." : "データを更新"}
          </button>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-200 p-4 rounded-xl text-sm">
            <b>通信エラー:</b> {error}
          </div>
        )}

        {!latestEval ? (
          <div className={cardClass}>
            <p className="text-center text-slate-500 py-8">
              {error ? "サーバーに接続できませんでした。" : "まだ評価データがありません。"}
              <br/>
              {!error && <span className="text-xs">コーチが評価を入力すると、ここにグラフが表示されます。</span>}
            </p>
          </div>
        ) : (
          <section className="space-y-4">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <span className="text-2xl">📊</span> 現在のレベル
              <span className="text-xs font-normal text-slate-400 ml-auto">最終更新: {new Date(latestEval.created_at).toLocaleDateString()}</span>
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(Object.keys(SKILL_LABEL) as SkillCategory[]).map((cat) => {
                const level = skillLevels[cat];
                const isFocus = focusKey === cat;
                return (
                  <div key={cat} className={`relative p-5 rounded-2xl border ${isFocus ? "bg-blue-900/20 border-blue-500" : "bg-slate-800/50 border-slate-700"}`}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-bold text-slate-200">{SKILL_LABEL[cat]}</span>
                      <span className={`text-xl font-black ${isFocus ? "text-blue-400" : "text-slate-400"}`}>Lv.{level}</span>
                    </div>
                    <div className="h-2 w-full bg-slate-700 rounded-full overflow-hidden">
                      <div className={`h-full ${isFocus ? "bg-blue-500" : "bg-slate-500"}`} style={{ width: `${level * 10}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>

            {focusKey && (
              <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-[24px] p-6 text-white shadow-lg">
                <div className="text-xs font-bold bg-white/20 inline-block px-3 py-1 rounded-full mb-3">Today's Practice</div>
                <h3 className="text-xl font-bold mb-2">いまは「{SKILL_LABEL[focusKey]}」が伸び代！</h3>
                
                {pickMenu(focusKey, skillLevels[focusKey]) ? (
                  <div className="bg-white/10 rounded-xl p-4 mt-4">
                    <p className="font-bold text-lg mb-2">おすすめメニュー：{pickMenu(focusKey, skillLevels[focusKey])?.title}</p>
                    <ul className="list-disc pl-5 space-y-1 text-sm opacity-90">
                      {pickMenu(focusKey, skillLevels[focusKey])?.items.map(item => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                ) : (
                   <p className="text-sm opacity-80 mt-2">基本練習を続けよう！</p>
                )}
              </div>
            )}
          </section>
        )}

        <section className="pt-8">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <span className="text-2xl">📝</span> 休日練習の日報を送る
          </h2>

          {savedMsg && (
            <div className="bg-green-500/20 text-green-300 p-4 rounded-xl mb-4 border border-green-500/30 font-bold text-center">
              {savedMsg}
            </div>
          )}

          <div className={cardClass}>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className={labelClass}>今日のきぶん</label>
                <input type="range" min="1" max="5" value={mood} onChange={e => setMood(Number(e.target.value))} className="w-full accent-blue-600 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer" />
                <div className="text-center font-bold text-slate-600 mt-1">{mood} / 5</div>
              </div>
              <div>
                <label className={labelClass}>今日のつかれ</label>
                <input type="range" min="1" max="5" value={fatigue} onChange={e => setFatigue(Number(e.target.value))} className="w-full accent-blue-600 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer" />
                <div className="text-center font-bold text-slate-600 mt-1">{fatigue} / 5</div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className={labelClass}><span className="w-2 h-2 rounded-full bg-blue-500"></span> ① 今日やった練習</label>
                <textarea className={inputClass} rows={2} placeholder="例）素振り50回" value={didToday} onChange={e => setDidToday(e.target.value)} />
              </div>
              <div>
                <label className={labelClass}><span className="w-2 h-2 rounded-full bg-blue-500"></span> ② コーチに言われたこと</label>
                <textarea className={inputClass} rows={2} placeholder="例）もっと足を上げる" value={coachSaid} onChange={e => setCoachSaid(e.target.value)} />
              </div>
              <div>
                <label className={labelClass}><span className="w-2 h-2 rounded-full bg-blue-500"></span> ③ 次の目標</label>
                <textarea className={inputClass} rows={2} placeholder="例）フライを落とさない" value={goalNext} onChange={e => setGoalNext(e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>④ 自由メモ</label>
                <textarea className={inputClass} rows={2} placeholder="その他、気づいたこと" value={freeNote} onChange={e => setFreeNote(e.target.value)} />
              </div>
            </div>

            <button 
              onClick={submitWeekendReport}
              disabled={submitting}
              className={`w-full mt-6 py-4 rounded-xl font-bold text-white shadow-lg transition-all active:scale-95 ${submitting ? "bg-slate-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-500"}`}
            >
              {submitting ? "送信中..." : "監督に日報を送る 🚀"}
            </button>
          </div>
        </section>

        {latestLog && (
          <div className="opacity-70">
            <h3 className="text-sm font-bold text-slate-400 mb-2">最近送った日報 ({new Date(latestLog.practice_date).toLocaleDateString()})</h3>
            <div className="bg-slate-800 p-4 rounded-xl text-sm border border-slate-700 whitespace-pre-wrap leading-relaxed">
              {latestLog.today_practice || latestLog.content}
            </div>
          </div>
        )}

      </div>
    </main>
  );
}