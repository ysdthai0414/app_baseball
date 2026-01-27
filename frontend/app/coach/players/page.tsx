"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
type Player = { id: string; name: string; grade?: number; position?: string };
type LatestEval = {
  id: number;
  child_id: number;
  evaluated_at: string; // ISO
  values: {
    batting?: number | null;
    defense?: number | null; // catching を defense として表示してる変換
    running?: number | null;
  };
  memo?: string | null; // ここに good/next を文字列で持たせてる想定（今のDB構造）
} | null;
// 末尾の / を除去して揺れを吸収（本番は env、ローカルは localhost）
const API_BASE =
  (process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ??
    "http://localhost:8000");
function fmtDatetime(s?: string | null) {
  if (!s) return "-";
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return String(s);
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()} ${String(
    d.getHours()
  ).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:${String(
    d.getSeconds()
  ).padStart(2, "0")}`;
}
export default function CoachPlayersPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [latestMap, setLatestMap] = useState<Record<string, LatestEval>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const refresh = async () => {
    try {
      setLoading(true);
      setError("");
      // 1) players 一覧
      const r = await fetch(`${API_BASE}/players`, { cache: "no-store" });
      if (!r.ok) throw new Error(`players取得に失敗: ${await r.text()}`);
      const list = (await r.json()) as Player[];
      setPlayers(list);
      // 2) 最新評価を並列取得（一覧に表示したいので）
      const results = await Promise.all(
        list.map(async (p) => {
          try {
            const rr = await fetch(
              `${API_BASE}/players/${p.id}/evaluations/latest`,
              { cache: "no-store" }
            );
            if (!rr.ok) return [p.id, null] as const;
            const data = (await rr.json()) as LatestEval;
            return [p.id, data] as const;
          } catch {
            return [p.id, null] as const;
          }
        })
      );
      const m: Record<string, LatestEval> = {};
      for (const [id, ev] of results) m[id] = ev;
      setLatestMap(m);
    } catch (e: any) {
      setError(e?.message ?? "エラーが発生しました");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const rows = useMemo(() => {
    return players.map((p) => {
      const ev = latestMap[p.id] ?? null;
      return { p, ev };
    });
  }, [players, latestMap]);
  return (
    <main style={{ padding: 24, fontFamily: "sans-serif", maxWidth: 960 }}>
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <Link href="/coach">← ダッシュボード</Link>
        <button
          onClick={refresh}
          style={{
            marginLeft: "auto",
            padding: "8px 12px",
            borderRadius: 12,
            border: "1px solid #333",
            background: loading ? "#aaa" : "#111",
            color: "#fff",
            cursor: loading ? "not-allowed" : "pointer",
          }}
          disabled={loading}
        >
          {loading ? "更新中..." : "更新"}
        </button>
      </div>
      <h1 style={{ fontSize: 24, marginTop: 12 }}>選手一覧</h1>
      <p style={{ color: "#666", marginTop: 4 }}>
        クリックでメンバー詳細へ。最新評価（打つ/守る/走る）を表示します。
      </p>
      {error && (
        <div
          style={{
            marginTop: 12,
            padding: 12,
            border: "1px solid #f99",
            borderRadius: 12,
            background: "#FFF5F5",
          }}
        >
          <b style={{ color: "#c00" }}>Error:</b>{" "}
          <span style={{ color: "#c00" }}>{error}</span>
        </div>
      )}
      <div style={{ marginTop: 16 }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "120px 1fr 140px 1fr",
            gap: 12,
            padding: "10px 12px",
            borderBottom: "1px solid #ddd",
            color: "#666",
            fontSize: 12,
          }}
        >
          <div>ID</div>
          <div>名前</div>
          <div>学年</div>
          <div>最新評価（打つ/守る/走る・日時）</div>
        </div>
        {rows.map(({ p, ev }) => (
          <Link
            key={p.id}
            href={`/coach/players/${p.id}`}
            style={{
              display: "grid",
              gridTemplateColumns: "120px 1fr 140px 1fr",
              gap: 12,
              padding: "12px 12px",
              borderBottom: "1px solid #eee",
              textDecoration: "none",
              color: "inherit",
              alignItems: "center",
            }}
          >
            <div style={{ color: "#333" }}>{p.id}</div>
            <div style={{ fontWeight: 600 }}>{p.name}</div>
            <div style={{ color: "#333" }}>{p.grade ? `${p.grade}年` : "-"}</div>
            {!ev ? (
              <div style={{ color: "#999" }}>（まだ評価がありません）</div>
            ) : (
              <div style={{ color: "#333" }}>
                打つ:{ev.values?.batting ?? "-"} / 守る:{ev.values?.defense ?? "-"}{" "}
                / 走る:{ev.values?.running ?? "-"}{" "}
                <span style={{ color: "#666" }}>
                  （{fmtDatetime(ev.evaluated_at)}）
                </span>
              </div>
            )}
          </Link>
        ))}
        {players.length === 0 && !loading && !error && (
          <p style={{ marginTop: 12, color: "#666" }}>
            選手がいません（children テーブルを確認してください）
          </p>
        )}
      </div>
    </main>
  );
}

