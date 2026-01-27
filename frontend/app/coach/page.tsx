"use client";

import Link from "next/link";

export default function CoachDashboardPage() {
  return (
    <main style={{ padding: 24, fontFamily: "sans-serif", maxWidth: 960 }}>
      <h1 style={{ fontSize: 24, marginTop: 0 }}>監督ダッシュボード</h1>
      <p style={{ color: "#666", marginTop: 6 }}>
        選手を選んで、休日練習の評価・フィードバックを行います。
      </p>

      <div style={{ display: "grid", gap: 12, marginTop: 16 }}>
        <Link
          href="/coach/players"
          style={{
            padding: 14,
            border: "1px solid #ddd",
            borderRadius: 12,
            textDecoration: "none",
            color: "inherit",
          }}
        >
          ▶ 選手一覧へ（選手を選んで評価へ）
        </Link>
      </div>
    </main>
  );
}
