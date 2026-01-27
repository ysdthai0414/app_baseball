"use client";
import { useEffect, useState, useMemo } from "react";
import Link from "next/link";

// 環境変数 or ローカル
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ?? "http://127.0.0.1:8000";

// === 定数・型 ===
const CATEGORIES = ["hitting", "throwing", "catching", "running", "iq"] as const;
const CAT_LABELS: Record<string, string> = { hitting: "打つ", throwing: "投げる", catching: "捕る", running: "走る", iq: "野球IQ" };
const CAT_COLORS: Record<string, string> = { hitting: "#ef4444", throwing: "#3b82f6", catching: "#10b981", running: "#f59e0b", iq: "#8b5cf6" };

type Child = {
  id: string; name: string; grade: string; has_evaluation: boolean;
  hitting_rank: number; throwing_rank: number; catching_rank: number; running_rank: number; iq_rank: number;
};
type TeamLog = { id: number; practice_date: string; content: string; };
type PracticeMenu = { target_ranks: number[]; title: string; desc: string; };

// 練習メニューDB（短縮版）
const MENU_DATABASE: Record<string, PracticeMenu[]> = {
  hitting: [
    { target_ranks: [10, 9, 8], title: "鏡の前でポーズ", desc: "グリップと構えをチェック" },
    { target_ranks: [7, 6, 5, 4], title: "ターゲット素振り", desc: "目印を決めて全力で振る" },
    { target_ranks: [3, 2, 1], title: "高速素振り", desc: "限界の速さで振る" },
  ],
  throwing: [
    { target_ranks: [10, 9, 8], title: "くるくるポン", desc: "ボールを投げ、縫い目を合わせて捕る" },
    { target_ranks: [7, 6, 5, 4], title: "タオルスロー", desc: "タオルを使ってシャドーピッチング" },
    { target_ranks: [3, 2, 1], title: "指先はじき", desc: "指先だけでボールを弾く" },
  ],
  catching: [
    { target_ranks: [10, 9, 8], title: "自分フライ", desc: "真上に投げて両手で捕る" },
    { target_ranks: [7, 6, 5, 4], title: "壁当て", desc: "壁からの跳ね返りを捕る" },
    { target_ranks: [3, 2, 1], title: "持ち替え練習", desc: "捕ってから素早く持ち替える" },
  ],
  running: [
    { target_ranks: [10, 9, 8], title: "腕振りダッシュ", desc: "その場で腕を速く振る" },
    { target_ranks: [7, 6, 5, 4, 3, 2, 1], title: "スタート練習", desc: "合図で3mダッシュ" },
  ],
  iq: [
    { target_ranks: [10, 9, 8, 7, 6, 5, 4, 3, 2, 1], title: "道具みがき", desc: "毎日グローブを磨く" },
  ]
};

export default function ParentPage() {
  const [view, setView] = useState<"list" | "register" | "detail">("list");
  const [children, setChildren] = useState<Child[]>([]);
  const [teamLogs, setTeamLogs] = useState<TeamLog[]>([]);
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  const [newProfile, setNewProfile] = useState({ name: "", grade: "" });
  const [detailTab, setDetailTab] = useState<"status" | "menu">("status");
  const [selectedMenuCategory, setSelectedMenuCategory] = useState<string>("hitting");
  const [loading, setLoading] = useState(false);

  useEffect(() => { fetchChildren(); fetchTeamLogs(); }, []);

  const fetchChildren = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/players`, { cache: "no-store" });
      if (!res.ok) return;
      const list = await res.json();
      const detailedList = await Promise.all(list.map(async (p: any) => {
        try {
          const r = await fetch(`${API_BASE}/players/${p.id}/evaluations/latest`, { cache: "no-store" });
          if (!r.ok) throw new Error();
          const d = await r.json();
          const v = d.values || {};
          return { ...p, id: String(p.id), has_evaluation: true, hitting_rank: v.batting||10, throwing_rank: v.throwing||10, catching_rank: v.catching||10, running_rank: v.running||10, iq_rank: v.iq||10 };
        } catch {
          return { ...p, id: String(p.id), has_evaluation: false, hitting_rank:10, throwing_rank:10, catching_rank:10, running_rank:10, iq_rank:10 };
        }
      }));
      setChildren(detailedList);
    } finally { setLoading(false); }
  };

  const fetchTeamLogs = async () => {
    // ダミー
    setTeamLogs([{ id: 1, practice_date: "2026-01-27", content: "【連絡】今週は検定を行います。" }]);
  };

  const registerChild = async () => {
    if (!newProfile.name || !newProfile.grade) return alert("入力してください");
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/players`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: Date.now(), name: newProfile.name, grade: newProfile.grade }),
      });
      if (res.ok) {
        await fetchChildren();
        setView("list");
        setNewProfile({ name: "", grade: "" });
      }
    } finally { setLoading(false); }
  };

  const currentMenus = useMemo(() => {
    if (!selectedChild) return [];
    const rank = selectedChild[`${selectedMenuCategory}_rank` as keyof Child] as number;
    return (MENU_DATABASE[selectedMenuCategory] || []).filter(m => m.target_ranks.includes(rank));
  }, [selectedChild, selectedMenuCategory]);

  return (
    <main style={styles.container}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=M+PLUS+Rounded+1c:wght@400;700;800&display=swap');`}</style>
      
      <div style={styles.navBar}>
        <Link href="/" style={styles.navButton}>🏠 Topへ</Link>
      </div>

      {view === "list" && (
        <div style={styles.fadeIn}>
          {/* 🌟 選手モードへの誘導リンクを追加 */}
          <Link href="/player" style={{ textDecoration: 'none' }}>
            <div className="bg-gradient-to-r from-blue-100 to-blue-50 p-4 rounded-2xl border-2 border-blue-200 mb-6 flex items-center justify-between shadow-sm cursor-pointer hover:bg-blue-100 transition-colors">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🧢</span>
                <div>
                  <div className="font-black text-blue-800 text-sm">選手の方はこちら</div>
                  <div className="text-[10px] text-blue-600 font-bold">自分のページ（日報）へ移動する</div>
                </div>
              </div>
              <span className="text-blue-400 font-bold">＞</span>
            </div>
          </Link>

          <div style={styles.sectionHeader}>
            <h2 style={styles.h2}>登録選手 (お子様)</h2>
            <button onClick={() => setView("register")} style={styles.addButton}>＋ 追加</button>
          </div>
          <div style={styles.profileGrid}>
            {children.map(c => (
              <div key={c.id} onClick={() => { setSelectedChild(c); setView("detail"); }} style={styles.profileCard}>
                <div style={styles.profileIcon}>{c.name.charAt(0)}</div>
                <div style={styles.profileName}>{c.name}</div>
                <div style={{fontSize:10, color: c.has_evaluation ? "#64748b":"#f59e0b"}}>{c.has_evaluation ? "詳細を見る" : "未評価"}</div>
              </div>
            ))}
          </div>
          <div style={styles.divider} />
          <h2 style={styles.h2}>📢 チーム掲示板</h2>
          <div style={styles.boardContainer}>
            {teamLogs.map(l => (
              <div key={l.id} style={styles.logCard}>
                <div style={styles.logHeader}><span style={styles.logDate}>{l.practice_date}</span></div>
                <div style={styles.logContent}>{l.content}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {view === "register" && (
        <div style={styles.fadeIn}>
          <h2 style={styles.h2}>新しい選手を登録</h2>
          <div style={styles.formCard}>
            <label style={styles.label}>名前 <input type="text" value={newProfile.name} onChange={e=>setNewProfile({...newProfile,name:e.target.value})} style={styles.input}/></label>
            <label style={styles.label}>学年 <select value={newProfile.grade} onChange={e=>setNewProfile({...newProfile,grade:e.target.value})} style={styles.input}>
              <option value="">選択</option>{["小1","小2","小3","小4","小5","小6"].map(g=><option key={g} value={g}>{g}</option>)}
            </select></label>
            <div style={{display:"flex",gap:12,marginTop:20}}>
              <button onClick={()=>setView("list")} style={styles.secondaryButton}>キャンセル</button>
              <button onClick={registerChild} style={styles.primaryButton}>登録</button>
            </div>
          </div>
        </div>
      )}

      {view === "detail" && selectedChild && (
        <div style={styles.fadeIn}>
          <button onClick={()=>setView("list")} style={styles.backLink}>← 一覧に戻る</button>
          <div style={styles.detailCard}>
            <div style={styles.detailHero}>
              <h2 style={{fontSize:22, fontWeight:800, color:"#334155"}}>{selectedChild.name}</h2>
              <div style={{color:"#64748b"}}>{selectedChild.grade}</div>
            </div>
            {!selectedChild.has_evaluation ? (
              <div style={{padding:40, textAlign:"center", color:"#64748b"}}>
                <p style={{fontWeight:"bold"}}>まだ評価はありません</p>
                <p style={{fontSize:12}}>検定をお待ちください</p>
              </div>
            ) : (
              <>
                <div style={styles.tabContainer}>
                  <div onClick={()=>setDetailTab("status")} style={detailTab==="status"?styles.activeTab:styles.tab}>📊 ステータス</div>
                  <div onClick={()=>setDetailTab("menu")} style={detailTab==="menu"?styles.activeTab:styles.tab}>💪 メニュー</div>
                </div>
                <div style={{padding:24}}>
                  {detailTab === "status" && (
                    <div style={{display:"grid",gap:12}}>
                      {CATEGORIES.map(cat => <SkillBar key={cat} category={cat} label={CAT_LABELS[cat]} rank={selectedChild[`${cat}_rank` as keyof Child] as number} />)}
                    </div>
                  )}
                  {detailTab === "menu" && (
                    <div>
                      <div style={styles.chipContainer}>
                        {CATEGORIES.map(cat => (
                          <button key={cat} onClick={()=>setSelectedMenuCategory(cat)} style={selectedMenuCategory===cat?{...styles.chip,background:CAT_COLORS[cat],color:"#fff"}:styles.chip}>{CAT_LABELS[cat]}</button>
                        ))}
                      </div>
                      {currentMenus.map((m,i)=>(
                        <div key={i} style={styles.questCard}>
                          <div style={{...styles.questBadge,background:CAT_COLORS[selectedMenuCategory]}}>Lv.{m.target_ranks[0]}</div>
                          <div style={{fontWeight:800,marginBottom:4}}>{m.title}</div>
                          <div style={{fontSize:13,color:"#666"}}>{m.desc}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </main>
  );
}

// サブコンポーネント
const SkillBar = ({ category, label, rank }: { category: string, label: string, rank: number }) => {
  const progress = Math.max(0, Math.min(100, ((10 - rank) / 9) * 100));
  return (
    <div style={{ display: "flex", alignItems: "center", background: "#f8fafc", padding: "8px 12px", borderRadius: 12, border: "2px solid #e2e8f0" }}>
      <span style={{ width: 60, fontWeight: "800", fontSize: 14, color: "#334155" }}>{label}</span>
      <div style={{ flex: 1, background: "#cbd5e1", height: 10, borderRadius: 5, margin: "0 10px" }}>
        <div style={{ width: `${progress}%`, background: CAT_COLORS[category], height: "100%", borderRadius: 5 }} />
      </div>
      <span style={{ fontSize: 14, fontWeight:"800", color: CAT_COLORS[category], width: 30, textAlign:"right" }}>{rank}</span>
    </div>
  );
};

// スタイル
const styles: Record<string, any> = {
  container: { padding: 20, maxWidth: 600, margin: "0 auto", background: "#f0f9ff", minHeight: "100vh", fontFamily: '"M PLUS Rounded 1c", sans-serif', color: "#333" },
  navBar: { display: "flex", justifyContent: "flex-end", marginBottom: 16 },
  navButton: { background: "#fff", padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: "bold", color: "#64748b", textDecoration: "none", border: "1px solid #ddd" },
  sectionHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  h2: { fontSize: 18, fontWeight: 800, color: "#1e3a8a", margin: 0 },
  addButton: { background: "#22c55e", color: "#fff", border: "none", padding: "6px 14px", borderRadius: 20, fontWeight: "bold", cursor: "pointer" },
  profileGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(90px, 1fr))", gap: 16 },
  profileCard: { background: "#fff", padding: 16, borderRadius: 16, textAlign: "center", cursor: "pointer", boxShadow: "0 2px 4px rgba(0,0,0,0.05)" },
  profileIcon: { width: 60, height: 60, borderRadius: 12, background: "#dbeafe", color: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, fontWeight: "bold", margin: "0 auto 8px" },
  profileName: { fontWeight: "bold", fontSize: 14 },
  boardContainer: { background: "#fff", borderRadius: 16, padding: 16, marginTop: 12 },
  logCard: { borderBottom: "1px solid #eee", paddingBottom: 8, marginBottom: 8 },
  logDate: { fontSize: 11, background: "#f1f5f9", padding: "2px 6px", borderRadius: 4, color: "#666" },
  logContent: { fontSize: 13, marginTop: 4 },
  fadeIn: { animation: "fadeIn 0.3s ease" },
  divider: { height: 4, background: "#e0f2fe", margin: "24px 0", borderRadius: 2 },
  detailCard: { background: "#fff", borderRadius: 24, overflow: "hidden", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" },
  detailHero: { background: "#f1f5f9", padding: 20, textAlign: "center", borderBottom: "1px solid #e2e8f0" },
  tabContainer: { display: "flex", background: "#f1f5f9", padding: 6, margin: 16, borderRadius: 12 },
  tab: { flex: 1, textAlign: "center", padding: 8, fontSize: 13, fontWeight: "bold", color: "#94a3b8", cursor: "pointer" },
  activeTab: { flex: 1, textAlign: "center", padding: 8, fontSize: 13, fontWeight: "bold", color: "#2563eb", background: "#fff", borderRadius: 8, boxShadow: "0 2px 4px rgba(0,0,0,0.05)" },
  chipContainer: { display: "flex", gap: 8, overflowX: "auto", paddingBottom: 12 },
  chip: { whiteSpace: "nowrap", padding: "6px 12px", borderRadius: 16, border: "1px solid #e2e8f0", background: "#fff", fontSize: 12, fontWeight: "bold", cursor: "pointer", color: "#64748b" },
  questCard: { background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 12, marginBottom: 12, boxShadow: "0 2px 0 #f1f5f9" },
  questBadge: { display: "inline-block", color: "#fff", fontSize: 10, padding: "2px 6px", borderRadius: 4, marginBottom: 4 },
  formCard: { background: "#fff", padding: 24, borderRadius: 24 },
  label: { display: "block", marginBottom: 12, fontWeight: "bold", fontSize: 14 },
  input: { width: "100%", padding: 12, borderRadius: 8, border: "1px solid #ddd", marginTop: 4, background: "#f9fafb" },
  primaryButton: { flex: 1, background: "#3b82f6", color: "#fff", padding: 12, borderRadius: 10, border: "none", fontWeight: "bold", cursor: "pointer" },
  secondaryButton: { flex: 1, background: "#fff", color: "#666", padding: 12, borderRadius: 10, border: "1px solid #ddd", fontWeight: "bold", cursor: "pointer" },
  backLink: { background: "none", border: "none", color: "#64748b", fontWeight: "bold", cursor: "pointer", marginBottom: 12 }
};