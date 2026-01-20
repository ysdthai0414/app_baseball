"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

const API_BASE = "http://localhost:8000";

export default function ParentPage() {
  // --- 状態管理（データの箱） ---
  const [players, setPlayers] = useState<any[]>([]); // 選手リスト
  const [selectedId, setSelectedId] = useState("p1"); // 選択中の選手ID
  const [latest, setLatest] = useState<any>(null);    // 最新の評価データ
  const [error, setError] = useState("");

  // 1. 選手一覧（名簿）をバックエンドから取得する
  useEffect(() => {
    fetch(`${API_BASE}/players`)
      .then(res => res.json())
      .then(data => setPlayers(data))
      .catch(() => setError("名簿の取得に失敗しました"));
  }, []);

  // 2. 選択された選手が変わるたびに、その子のデータを取得し直す
  const refreshData = async () => {
    if (!selectedId) return;
    try {
      setError("");
      const res = await fetch(`${API_BASE}/players/${selectedId}/evaluations/latest`);
      if (!res.ok) throw new Error("評価データの取得に失敗");
      const data = await res.json();
      setLatest(data);
    } catch (e: any) {
      setLatest(null);
      setError("この選手の評価データはまだありません。");
    }
  };

  useEffect(() => {
    refreshData();
  }, [selectedId]);

  return (
    <main style={{ padding: 24, fontFamily: "sans-serif", maxWidth: 720, margin: "0 auto" }}>
      <h1 style={{ fontSize: 24 }}>保護者画面：お子様の最新評価</h1>
      
      {/* --- 選手選択メニュー（ここが新機能！） --- */}
      <div style={{ marginBottom: 20, padding: 15, background: "#f0f7ff", borderRadius: 10 }}>
        <label style={{ fontWeight: "bold", marginRight: 10 }}>お子様を選択：</label>
        <select 
          value={selectedId} 
          onChange={(e) => setSelectedId(e.target.value)}
          style={{ padding: "8px", borderRadius: "5px", border: "1px solid #ccc" }}
        >
          {players.map(p => (
            <option key={p.id} value={p.id}>{p.name} ({p.position})</option>
          ))}
        </select>
        <button onClick={refreshData} style={{ marginLeft: 10 }}>更新</button>
      </div>

      <Link href="/">← トップページへ</Link>
      <hr style={{ margin: "20px 0" }} />

      {/* --- 評価の表示エリア --- */}
      {error && <p style={{ color: "orange" }}>{error}</p>}

      {!latest ? (
        <div style={{ padding: 20, border: "1px dashed #ccc", textAlign: "center" }}>
          <p>まだ評価データが登録されていません。</p>
          <p style={{ fontSize: "0.8rem", color: "#666" }}>コーチ画面で評価を入力するとここに表示されます。</p>
        </div>
      ) : (
        <div style={{ padding: 16, border: "1px solid #ddd", borderRadius: 12, background: "#fff" }}>
          <h2 style={{ marginTop: 0 }}>{players.find(p => p.id === selectedId)?.name} くんの評価</h2>
          <p style={{ color: "#666" }}>判定日時: {new Date(latest.created_at).toLocaleString()}</p>
          
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            {Object.entries(latest.values || {}).map(([key, val]: any) => (
              <div key={key} style={{ padding: "10px", background: "#f9f9f9", borderRadius: 5 }}>
                <strong>{key}</strong>: <span style={{ fontSize: "1.2rem", color: "blue" }}>{val}</span>
              </div>
            ))}
          </div>

          <h3 style={{ borderTop: "1px solid #eee", paddingTop: 10 }}>コーチからのコメント</h3>
          <p style={{ whiteSpace: "pre-wrap", background: "#fffbe6", padding: 10 }}>
            {typeof latest.comment === 'string' ? latest.comment : (latest.comment?.good || "コメントなし")}
          </p>
        </div>
      )}
    </main>
  );
}