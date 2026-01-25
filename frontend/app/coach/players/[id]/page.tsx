"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

const API_BASE =
  (process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ??
    "http://localhost:8000");

type Player = { id: string; name: string; grade?: number; position?: string };

type Evaluation = {
  id: number;
  child_id: number;
  evaluated_at: string;
  values: {
    batting?: number;
    throwing?: number;
    catching?: number;
    running?: number;
    iq?: number;
  };
  memo?: string | null;
} | null;

type RecRes = { recommendations: string[] };

const valOrDash = (v: unknown) =>
  typeof v === "number" && Number.isFinite(v) ? String(v) : "-";

export default function CoachPlayerDetail() {
  const params = useParams<{ id: string }>();
  const playerId = params?.id;

  const [player, setPlayer] = useState<Player | null>(null);
  const [latest, setLatest] = useState<Evaluation>(null);
  const [recs, setRecs] = useState<string[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!playerId) return;

    const run = async () => {
      try {
        setError("");

        // player
        const rPlayer = await fetch(`${API_BASE}/players/${playerId}`, {
          cache: "no-store",
        });
        if (rPlayer.ok) {
          const data = await rPlayer.json();
          // APIが {player:{...}} の可能性も吸収
          setPlayer((data?.player ?? data) as Player);
        } else {
          setPlayer(null);
        }

        // latest evaluation
        const rEval = await fetch(
          `${API_BASE}/players/${playerId}/evaluations/latest`,
          { cache: "no-store" }
        );
        if (rEval.ok) {
          const data = await rEval.json();
          setLatest(data ?? null);
        } else {
          setLatest(null);
        }

        // recommendations（存在しない場合もあるので落とさない）
        const rRec = await fetch(
          `${API_BASE}/players/${playerId}/recommendation/latest`,
          { cache: "no-store" }
        );
        if (rRec.ok) {
          const d: RecRes = await rRec.json();
          setRecs(d?.recommendations ?? []);
        } else {
          setRecs([]);
        }
      } catch (e: any) {
        setError(e?.message ?? "エラーが発生しました");
      }
    };

    run();
  }, [playerId]);

  if (!playerId) {
    return (
      <main style={{ padding: 24, fontFamily: "sans-serif", maxWidth: 720 }}>
        <p>Loading...</p>
      </main>
    );
  }

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
        <p style={{ color: "#666", marginTop: 4 }}>
          {player.grade ? `${player.grade}年` : ""}{" "}
          {player.position ? ` / ${player.position}` : ""}
        </p>
      )}

      {error && (
        <div
          style={{
            marginTop: 12,
            padding: 12,
            border: "1px solid #f99",
            borderRadius: 12,
            background: "#fff5f5",
          }}
        >
          <b style={{ color: "#c00" }}>Error:</b>{" "}
          <span style={{ color: "#c00" }}>{error}</span>
        </div>
      )}

      {/* 最新の評価 */}
      <section
        style={{
          border: "1px solid #ddd",
          borderRadius: 12,
          padding: 16,
          marginTop: 16,
        }}
      >
        <h2 style={{ marginTop: 0 }}>最新の評価</h2>

        {!latest && <p style={{ color: "#666" }}>まだ評価がありません。</p>}

        {latest && (
          <>
            <p style={{ color: "#666" }}>日時: {latest.evaluated_at}</p>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 10,
                marginTop: 10,
                background: "#f7f7f7",
                padding: 12,
                borderRadius: 12,
              }}
            >
              <div>打つ：{valOrDash(latest.values?.batting)}</div>
              <div>投げる：{valOrDash(latest.values?.throwing)}</div>
              <div>捕る：{valOrDash(latest.values?.catching)}</div>
              <div>走る：{valOrDash(latest.values?.running)}</div>
              <div>野球IQ：{valOrDash(latest.values?.iq)}</div>
            </div>

            <h3 style={{ marginTop: 14 }}>メモ</h3>
            <p style={{ whiteSpace: "pre-wrap", marginTop: 6 }}>
              {latest.memo ?? "（なし）"}
            </p>
          </>
        )}

        <div style={{ marginTop: 12 }}>
          <Link href={`/coach/players/${playerId}/evaluate`}>
            評価・フィードバックを書く →
          </Link>
        </div>
      </section>

      {/* 次におすすめの練習 */}
      <section
        style={{
          border: "1px solid #ddd",
          borderRadius: 12,
          padding: 16,
          marginTop: 16,
        }}
      >
        <h2 style={{ marginTop: 0 }}>次におすすめの練習</h2>
        {recs.length === 0 ? (
          <p style={{ color: "#666" }}>（recommendations未定義 or 該当なし）</p>
        ) : (
          <ul style={{ paddingLeft: 16 }}>
            {recs.map((t, i) => (
              <li key={i}>{t}</li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
