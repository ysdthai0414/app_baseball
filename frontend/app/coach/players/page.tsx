"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

const API_BASE =
  (process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ??
    "http://localhost:8000");

type Player = { id: string; name: string; grade?: number; position?: string };
type Evaluation = { values: Record<string, number> } | null;

export default function CoachPlayersPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [latestMap, setLatestMap] = useState<Record<string, Evaluation>>({});

  useEffect(() => {
    const run = async () => {
      const ps: Player[] = await fetch(`${API_BASE}/players`).then((r) =>
        r.json()
      );
      setPlayers(ps);

      const pairs = await Promise.all(
        ps.map(async (p) => {
          const latest: Evaluation = await fetch(
            `${API_BASE}/players/${p.id}/evaluations/latest`
          ).then((r) => r.json());
          return [p.id, latest] as const;
        })
      );

      const map: Record<string, Evaluation> = {};
      for (const [id, ev] of pairs) map[id] = ev;
      setLatestMap(map);
    };

    run();
  }, []);

  const skillLine = (ev: Evaluation) => {
    if (!ev) return <span style={{ color: "#888" }}>（未評価）</span>;
    const v = ev.values || {};
    return (
      <span style={{ color: "#444" }}>
        打撃:{v.batting ?? "-"} / 守備:{v.defense ?? "-"} / 走塁:{v.running ?? "-"}
      </span>
    );
  };

  return (
    <main style={{ padding: 24, fontFamily: "sans-serif", maxWidth: 720 }}>
      <h1 style={{ fontSize: 24, marginBottom: 8 }}>監督：メンバー一覧</h1>
      <div style={{ display: "flex", gap: 12 }}>
        <Link href="/coach">← ダッシュボード</Link>
        <Link href="/">トップ</Link>
      </div>

      <ul style={{ paddingLeft: 16, marginTop: 16 }}>
        {players.map((p) => (
          <li key={p.id} style={{ marginBottom: 14 }}>
            <div
              style={{ display: "flex", justifyContent: "space-between", gap: 12 }}
            >
              <div>
                <Link href={`/coach/players/${p.id}`}>
                  {p.name} {p.grade ? `（${p.grade}年）` : ""}{" "}
                  {p.position ? `- ${p.position}` : ""}
                </Link>
                <div style={{ marginTop: 6 }}>
                  {skillLine(latestMap[p.id] ?? null)}
                </div>
              </div>
              <div style={{ whiteSpace: "nowrap" }}>
                <Link href={`/coach/players/${p.id}/evaluate`}>評価を書く</Link>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
