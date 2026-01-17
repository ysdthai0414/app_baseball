"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

type Player = { id: string; name: string; grade?: number; position?: string };
type Evaluation = {
  id: number;
  created_at: string;
  player_id: string;
  values: Record<string, number>;
  comment: any;
} | null;

type RecRes = { recommendations: string[] };

const renderComment = (comment: any) => {
  if (!comment) return null;
  if (typeof comment === "string") return <p style={{ whiteSpace: "pre-wrap" }}>{comment}</p>;
  return (
    <div>
      {comment.good && (
        <>
          <h4>良かった点</h4>
          <p style={{ whiteSpace: "pre-wrap" }}>{comment.good}</p>
        </>
      )}
      {comment.next && (
        <>
          <h4>次回の意識ポイント</h4>
          <p style={{ whiteSpace: "pre-wrap" }}>{comment.next}</p>
        </>
      )}
    </div>
  );
};

export default function CoachPlayerDetail() {
  const params = useParams<{ id: string }>();
  const playerId = params.id;
  const [player, setPlayer] = useState<Player | null>(null);
  const [latest, setLatest] = useState<Evaluation>(null);
  const [recs, setRecs] = useState<string[]>([]);

  useEffect(() => {
    fetch(`${API_BASE}/players/${playerId}`).then((r) => r.json()).then(setPlayer);
    fetch(`${API_BASE}/players/${playerId}/evaluations/latest`).then((r) => r.json()).then(setLatest);
    fetch(`${API_BASE}/players/${playerId}/recommendation/latest`)
      .then((r) => r.json())
      .then((d: RecRes) => setRecs(d.recommendations ?? []));
  }, [playerId]);

  return (
    <main style={{ padding: 24, fontFamily: "sans-serif", maxWidth: 720 }}>
      <div style={{ display: "flex", gap: 12 }}>
        <Link href="/coach/players">← 一覧へ</Link>
        <Link href="/coach">ダッシュボード</Link>
      </div>

      <h1 style={{ fontSize: 24, marginTop: 12 }}>
        メンバー詳細 {player ? `：${player.name}` : ""}
      </h1>

      {player && (
        <p style={{ color: "#666" }}>
          {player.grade ? `${player.grade}年` : ""} {player.position ? ` / ${player.position}` : ""}
        </p>
      )}

      <section style={{ border: "1px solid #ddd", borderRadius: 12, padding: 16, marginTop: 16 }}>
        <h2 style={{ marginTop: 0 }}>最新の評価</h2>
        {!latest && <p style={{ color: "#666" }}>まだ評価がありません。</p>}

        {latest && (
          <>
            <p style={{ color: "#666" }}>日時: {latest.created_at}</p>
            <pre style={{ background: "#f7f7f7", padding: 12, borderRadius: 12 }}>
              {JSON.stringify(latest.values, null, 2)}
            </pre>
            <h3>フィードバック</h3>
            {renderComment(latest.comment)}
          </>
        )}

        <div style={{ marginTop: 12 }}>
          <Link href={`/coach/players/${playerId}/evaluate`}>評価・フィードバックを書く →</Link>
        </div>
      </section>

      <section style={{ border: "1px solid #ddd", borderRadius: 12, padding: 16, marginTop: 16 }}>
        <h2 style={{ marginTop: 0 }}>次におすすめの練習</h2>
        {recs.length === 0 ? <p style={{ color: "#666" }}>（recommendations未定義 or 該当なし）</p> : (
          <ul style={{ paddingLeft: 16 }}>
            {recs.map((t, i) => <li key={i}>{t}</li>)}
          </ul>
        )}
      </section>
    </main>
  );
}