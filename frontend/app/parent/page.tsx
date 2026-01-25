"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const API_BASE = "http://localhost:8001";

// --- 型定義 ---
type Child = { id: string; name: string; grade: string; hitting: number; throwing: number; catching: number; running: number; iq: number; };
type PracticeLog = { id: number; child_id: string; practice_date: string; today_practice?: string; coach_said?: string; mood?: number; fatigue?: number; };
type DiagnosticResult = { hitting: number; throwing: number; catching: number; running: number; iq: number };

export default function ParentPage() {
  const router = useRouter();
  const [view, setView] = useState<string>("mode_select");
  const [targetMode, setTargetMode] = useState<"player" | "parent" | null>(null);
  const [children, setChildren] = useState<Child[]>([]);
  const [logs, setLogs] = useState<PracticeLog[]>([]);
  const [myChild, setMyChild] = useState<Child | null>(null);
  const [newProfile, setNewProfile] = useState({ name: "", grade: "" });

  // データ取得
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resP, resL] = await Promise.all([
          fetch(`${API_BASE}/players`),
          fetch(`${API_BASE}/practice-logs`)
        ]);
        const pData = await resP.json();
        const lData = await resL.json();
        setChildren(Array.isArray(pData) ? pData.map((p:any) => ({...p, id: String(p.id)})) : []);
        setLogs(Array.isArray(lData) ? lData.map((l:any) => ({...l, child_id: String(l.child_id)})) : []);
      } catch (e) { console.error("Fetch error", e); }
    };
    fetchData();
  }, []);

  // モード選択（せんしゅ or 保護者）
  const handleModeSelect = (mode: "player" | "parent") => {
    setTargetMode(mode);
    setView("select_child");
  };

  // 名簿から選んだあとの動き
  const handleChildSelect = (child: Child) => {
    if (targetMode === "player") {
      router.push(`/player/${child.id}`);
    } else {
      setMyChild(child);
      setView("parent_dashboard"); // 🌟 真っ青回避：ここをダッシュボードに
    }
  };

  // 診断完了
  const handleDiagnosticComplete = (results: DiagnosticResult) => {
    const newKid: Child = { id: String(Date.now()), name: newProfile.name, grade: newProfile.grade, ...results };
    setChildren(prev => [...prev, newKid]);
    setMyChild(newKid); // 🌟 追加した子をそのまま「自分の子」に設定
    setView("parent_dashboard"); // 🌟 追加後、すぐに日報画面へ
    setNewProfile({ name: "", grade: "" });
  };

  return (
    <main className="min-h-screen bg-[#f0f9ff] font-['M_PLUS_Rounded_1c'] text-slate-800 pb-20">
      <div className="h-2 bg-blue-500 w-full mb-6" />

      <div className="max-w-md mx-auto px-4">
        {/* === 1. TOP（モード選択） === */}
        {view === "mode_select" && (
          <div className="pt-10 space-y-8 animate-in fade-in duration-500">
            <h1 className="text-3xl font-black text-center text-blue-600 mb-10 tracking-tighter">⚾️ コレプラ</h1>
            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => handleModeSelect("player")} className="bg-white p-8 rounded-[32px] shadow-xl text-center active:scale-95 transition-all">
                <div className="text-5xl mb-4">🧢</div>
                <div className="font-black text-slate-700">せんしゅ</div>
              </button>
              <button onClick={() => handleModeSelect("parent")} className="bg-white p-8 rounded-[32px] shadow-xl text-center active:scale-95 transition-all">
                <div className="text-5xl mb-4">👪</div>
                <div className="font-black text-slate-700">保護者</div>
              </button>
            </div>
          </div>
        )}

        {/* === 2. 名簿（選択画面） === */}
        {view === "select_child" && (
          <div className="space-y-6 pt-6 animate-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center px-2">
              <h2 className="text-xl font-black text-blue-900">{targetMode === "player" ? "きみはだれ？" : "お子様を選んでね"}</h2>
              <button onClick={() => setView("create_profile")} className="bg-green-500 text-white px-4 py-2 rounded-full font-bold text-xs shadow-lg">＋ 追加</button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {children.map(child => (
                <div key={child.id} onClick={() => handleChildSelect(child)} className="bg-white p-6 rounded-[24px] shadow-md text-center border-2 border-white hover:border-blue-200 cursor-pointer transition-all">
                  <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center text-3xl font-black mx-auto mb-3">{child.name.charAt(0)}</div>
                  <div className="font-black text-slate-700">{child.name}</div>
                  <div className="text-[10px] text-blue-500 font-bold mt-1">タップで決定</div>
                </div>
              ))}
            </div>
            <button onClick={() => setView("mode_select")} className="w-full py-6 text-slate-400 font-bold text-sm">🏠 戻る</button>
          </div>
        )}

        {/* === 3. 保護者ダッシュボード（日報表示） === */}
        {view === "parent_dashboard" && myChild && (
          <div className="space-y-6 pt-6 animate-in fade-in duration-500">
            <div className="bg-white p-6 rounded-[32px] shadow-xl border-b-4 border-blue-500">
              <div className="text-xs text-slate-400 font-bold">保護者ページ</div>
              <h2 className="text-2xl font-black text-slate-800">{myChild.name} 選手の記録</h2>
            </div>

            <h3 className="text-lg font-black text-blue-900 px-2">📢 届いた日報</h3>
            <div className="space-y-4">
              {logs.filter(l => l.child_id === myChild.id).length > 0 ? (
                logs.filter(l => l.child_id === myChild.id).map(log => (
                  <div key={log.id} className="bg-white p-6 rounded-[24px] shadow-md border-l-8 border-blue-400">
                    <div className="text-xs text-slate-400 mb-2 font-bold">📅 {log.practice_date}</div>
                    <div className="font-bold text-slate-700 leading-relaxed">{log.today_practice || "練習内容の記載なし"}</div>
                    {log.coach_said && (
                      <div className="mt-4 p-4 bg-green-50 rounded-2xl text-green-700 text-sm italic font-bold">
                        コーチ："{log.coach_said}"
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="bg-white/50 p-10 rounded-[32px] text-center text-slate-400 font-bold border-2 border-dashed border-slate-200">
                  まだ日報がありません。<br/><span className="text-[10px]">選手ページから送ってみよう！</span>
                </div>
              )}
            </div>
            <button onClick={() => setView("select_child")} className="w-full py-8 text-slate-400 font-bold">👤 選手を切り替える</button>
          </div>
        )}

        {/* === 4. 新規登録 === */}
        {view === "create_profile" && (
          <div className="bg-white p-8 rounded-[40px] shadow-2xl space-y-6 animate-in zoom-in-95">
            <h2 className="text-2xl font-black text-center text-slate-800">選手を新しく登録</h2>
            <div className="space-y-4">
              <input type="text" className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none" placeholder="名前：例 しょうへい" value={newProfile.name} onChange={e => setNewProfile({...newProfile, name: e.target.value})} />
              <select className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none" value={newProfile.grade} onChange={e => setNewProfile({...newProfile, grade: e.target.value})}>
                <option value="">学年を選んでね</option>
                {["小1","小2","小3","小4","小5","小6"].map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <button onClick={() => setView("diagnostic")} className="w-full bg-blue-600 text-white p-5 rounded-2xl font-black shadow-lg">実力診断へ 🚀</button>
            <button onClick={() => setView("select_child")} className="w-full text-slate-400 font-bold">キャンセル</button>
          </div>
        )}

        {/* === 5. 診断ウィザード === */}
        {view === "diagnostic" && (
          <DiagnosticWizard name={newProfile.name} onComplete={handleDiagnosticComplete} />
        )}
      </div>
    </main>
  );
}

// 診断サブコンポーネント
function DiagnosticWizard({ name, onComplete }: { name: string, onComplete: (res: DiagnosticResult) => void }) {
  const [step, setStep] = useState(0);
  const qList = [
    { cat: "hitting", q: "バットを振ってボールに当てられる？" },
    { cat: "throwing", q: "狙ったところにボールを投げられる？" },
    { cat: "catching", q: "フライをキャッチできる？" },
    { cat: "running", q: "塁間を全力で走れる？" },
    { cat: "iq", q: "野球のルールがわかる？" }
  ];
  const [ans, setAns] = useState<DiagnosticResult>({ hitting: 1, throwing: 1, catching: 1, running: 1, iq: 1 });

  const next = (yes: boolean) => {
    const curCat = qList[step].cat as keyof DiagnosticResult;
    ans[curCat] = yes ? 3 : 1;
    if (step < qList.length - 1) setStep(step + 1);
    else onComplete(ans);
  };

  return (
    <div className="bg-white p-10 rounded-[40px] shadow-2xl text-center space-y-8 animate-in zoom-in">
      <div className="text-[10px] bg-blue-100 text-blue-600 inline-block px-4 py-1 rounded-full font-black uppercase">Level Check</div>
      <h2 className="text-2xl font-black text-slate-800 leading-relaxed">{name}せんしゅは、<br/>{qList[step].q}</h2>
      <div className="grid grid-cols-2 gap-4">
        <button onClick={() => next(true)} className="bg-blue-600 text-white p-6 rounded-3xl font-black text-xl shadow-lg active:scale-95 transition-transform">はい！</button>
        <button onClick={() => next(false)} className="bg-slate-100 text-slate-400 p-6 rounded-3xl font-black text-xl active:scale-95 transition-transform">まだまだ</button>
      </div>
      <div className="flex justify-center gap-2">{qList.map((_, i) => (<div key={i} className={`h-2 rounded-full ${i === step ? "w-8 bg-blue-500" : "w-2 bg-slate-200"}`} />))}</div>
    </div>
  );
}