"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// 環境変数があればそれを使い、なければローカル(127.0.0.1)を使う
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";

// 型定義
type Child = { id: string; name: string; grade: string; values?: any };
type PracticeLog = { id: number; child_id: string; practice_date: string; today_practice?: string; coach_said?: string; };
type DiagnosticResult = { batting: number; throwing: number; catching: number; running: number; iq: number };

export default function ParentPage() {
  const router = useRouter();
  const [view, setView] = useState<string>("mode_select");
  const [targetMode, setTargetMode] = useState<"player" | "parent" | null>(null);
  const [children, setChildren] = useState<Child[]>([]);
  const [myChild, setMyChild] = useState<Child | null>(null);
  const [newProfile, setNewProfile] = useState({ name: "", grade: "" });

  // データ取得
  const fetchData = async () => {
    try {
      const res = await fetch(`${API_BASE}/players`);
      if (res.ok) {
        const data = await res.json();
        setChildren(data);
      }
    } catch (e) { 
      console.error("Fetch error", e); 
    }
  };

  useEffect(() => { fetchData(); }, []);

  // 診断完了時の処理
  const handleDiagnosticComplete = async (results: DiagnosticResult) => {
    // IDを現在時刻から生成
    const newId = Date.now(); 
    const newKid = { id: String(newId), name: newProfile.name, grade: newProfile.grade };

    try {
      console.log("送信開始:", API_BASE); // デバッグ用

      // 1. 選手データを保存
      const resPlayer = await fetch(`${API_BASE}/players`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: newId, name: newKid.name, grade: newKid.grade }),
      });

      if (!resPlayer.ok) throw new Error("選手の保存に失敗");

      // 2. 診断結果を保存
      const resEval = await fetch(`${API_BASE}/evaluations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ child_id: newId, values: results }),
      });

      if (!resEval.ok) throw new Error("診断結果の保存に失敗");

      // 3. 成功したら画面更新
      await fetchData(); 
      setMyChild({ ...newKid, values: results });
      setView("parent_dashboard");
      setNewProfile({ name: "", grade: "" });

    } catch (e: any) {
      alert(`保存できませんでした💦\nサーバー(黒い画面)が動いているか確認してください。\n\nエラー: ${e.message}`);
      console.error(e);
    }
  };

  // モード選択
  const handleModeSelect = (mode: "player" | "parent") => {
    setTargetMode(mode);
    setView("select_child");
  };

  // 選手選択後の動き
  const handleChildSelect = (child: Child) => {
    if (targetMode === "player") {
      router.push(`/player/${child.id}`);
    } else {
      setMyChild(child);
      setView("parent_dashboard");
    }
  };

  return (
    <main className="min-h-screen bg-[#f0f9ff] font-sans text-slate-800 pb-20">
      <div className="h-2 bg-blue-500 w-full mb-6" />

      <div className="max-w-md mx-auto px-4">
        {/* 1. TOP */}
        {view === "mode_select" && (
          <div className="pt-10 space-y-8">
            <h1 className="text-3xl font-black text-center text-blue-600 mb-10">⚾️ コレプラ</h1>
            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => handleModeSelect("player")} className="bg-white p-8 rounded-3xl shadow-xl text-center active:scale-95 transition-all">
                <div className="text-5xl mb-4">🧢</div>
                <div className="font-black text-slate-700">せんしゅ</div>
              </button>
              <button onClick={() => handleModeSelect("parent")} className="bg-white p-8 rounded-3xl shadow-xl text-center active:scale-95 transition-all">
                <div className="text-5xl mb-4">👪</div>
                <div className="font-black text-slate-700">保護者</div>
              </button>
            </div>
          </div>
        )}

        {/* 2. 名簿 */}
        {view === "select_child" && (
          <div className="space-y-6 pt-6">
            <div className="flex justify-between items-center px-2">
              <h2 className="text-xl font-black text-blue-900">{targetMode === "player" ? "きみはだれ？" : "お子様を選んでね"}</h2>
              <button onClick={() => setView("create_profile")} className="bg-green-500 text-white px-4 py-2 rounded-full font-bold text-xs shadow-lg">＋ 追加</button>
            </div>
            {children.length === 0 ? (
                <div className="text-center py-10 text-slate-400">まだ登録がありません。<br/>「追加」ボタンから登録してね！</div>
            ) : (
                <div className="grid grid-cols-2 gap-4">
                {children.map(child => (
                    <div key={child.id} onClick={() => handleChildSelect(child)} className="bg-white p-6 rounded-3xl shadow-md text-center border-2 border-white hover:border-blue-200 cursor-pointer transition-all">
                    <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center text-3xl font-black mx-auto mb-3">{child.name.charAt(0)}</div>
                    <div className="font-black text-slate-700">{child.name}</div>
                    </div>
                ))}
                </div>
            )}
            <button onClick={() => setView("mode_select")} className="w-full py-6 text-slate-400 font-bold text-sm">🏠 戻る</button>
          </div>
        )}

        {/* 3. ダッシュボード */}
        {view === "parent_dashboard" && myChild && (
          <div className="space-y-6 pt-6">
            <div className="bg-white p-6 rounded-3xl shadow-xl border-b-4 border-blue-500">
              <div className="text-xs text-slate-400 font-bold">保護者ページ</div>
              <h2 className="text-2xl font-black text-slate-800">{myChild.name} 選手の記録</h2>
              <div className="mt-2 text-sm text-slate-500">ID: {myChild.id}</div>
            </div>
            
            <div className="bg-blue-50 p-6 rounded-3xl text-center">
               <p className="font-bold text-blue-800">✅ 登録完了！</p>
               <p className="text-sm text-blue-600 mt-2">
                 ここから先はまだ作成中です。<br/>
                 「選手モード」に戻って、日報を送ってみましょう！
               </p>
            </div>

            <button onClick={() => setView("select_child")} className="w-full py-8 text-slate-400 font-bold">👤 選手を切り替える</button>
          </div>
        )}

        {/* 4. 新規登録 */}
        {view === "create_profile" && (
          <div className="bg-white p-8 rounded-[40px] shadow-2xl space-y-6">
            <h2 className="text-2xl font-black text-center text-slate-800">選手を新しく登録</h2>
            <div className="space-y-4">
              <input type="text" className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none" placeholder="名前：例 しょうへい" value={newProfile.name} onChange={e => setNewProfile({...newProfile, name: e.target.value})} />
              <select className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none" value={newProfile.grade} onChange={e => setNewProfile({...newProfile, grade: e.target.value})}>
                <option value="">学年を選んでね</option>
                {["小1","小2","小3","小4","小5","小6"].map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <button 
                onClick={() => {
                    if(!newProfile.name || !newProfile.grade) return alert("名前と学年を入れてね");
                    setView("diagnostic");
                }} 
                className="w-full bg-blue-600 text-white p-5 rounded-2xl font-black shadow-lg"
            >
                実力診断へ 🚀
            </button>
            <button onClick={() => setView("select_child")} className="w-full text-slate-400 font-bold">キャンセル</button>
          </div>
        )}

        {/* 5. 診断 */}
        {view === "diagnostic" && (
          <DiagnosticWizard name={newProfile.name} onComplete={handleDiagnosticComplete} />
        )}
      </div>
    </main>
  );
}

// 診断コンポーネント
function DiagnosticWizard({ name, onComplete }: { name: string, onComplete: (res: DiagnosticResult) => void }) {
  const [step, setStep] = useState(0);
  const qList = [
    { cat: "batting", q: "バットを振ってボールに当てられる？" },
    { cat: "throwing", q: "狙ったところにボールを投げられる？" },
    { cat: "catching", q: "フライをキャッチできる？" },
    { cat: "running", q: "塁間を全力で走れる？" },
    { cat: "iq", q: "野球のルールがわかる？" }
  ];
  const [ans, setAns] = useState<DiagnosticResult>({ batting: 1, throwing: 1, catching: 1, running: 1, iq: 1 });

  const next = (yes: boolean) => {
    const curCat = qList[step].cat as keyof DiagnosticResult;
    setAns(prev => ({ ...prev, [curCat]: yes ? 3 : 1 })); 
    
    if (step < qList.length - 1) {
        setStep(step + 1);
    } else {
        onComplete({ ...ans, [curCat]: yes ? 3 : 1 });
    }
  };

  return (
    <div className="bg-white p-10 rounded-[40px] shadow-2xl text-center space-y-8">
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