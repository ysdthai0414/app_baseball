"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import type { SkillCategory } from "@/lib/levelTable";
import { getTrainingMenuForLevel } from "@/lib/trainingMenu";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";
const PLAYER_ID = "p1"; // プロト：親はp1の親として表示

type Category = { key: string; label: string; levels: { score: number; label: string }[] };
type Rubric = { categories: Category[] };
type Evaluation = {
  id: number;
  created_at: string;
  player_id: string;
  values: Record<string, number>;
  comment: any;
} | null;

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

// 保護者画面で扱うカテゴリ（rubricのkeyと一致している前提）
const SKILL_CATEGORIES: SkillCategory[] = ["batting", "throwing", "catching", "running", "iq"];

const categoryLabel: Record<SkillCategory, string> = {
  batting: "打つ（バッティング）",
  throwing: "投げる（スローイング）",
  catching: "捕る（キャッチング）",
  running: "走る（走塁・スピード）",
  iq: "ルール・マナー（野球IQ）",
};

export default function ParentPage() {
  const [rubric, setRubric] = useState<Rubric | null>(null);
  const [latest, setLatest] = useState<Evaluation>(null);
  const [recs, setRecs] = useState<string[]>([]);
  const [error, setError] = useState("");

  const refresh = async () => {
    try {
      setError("");
      const [r1, r2, r3] = await Promise.all([
        fetch(`${API_BASE}/rubric`),
        fetch(`${API_BASE}/players/${PLAYER_ID}/evaluations/latest`),
        fetch(`${API_BASE}/players/${PLAYER_ID}/recommendation/latest`),
      ]);
      if (!r1.ok) throw new Error("rubric取得に失敗");
      if (!r2.ok) throw new Error("評価取得に失敗");
      if (!r3.ok) throw new Error("recommendation取得に失敗");

      setRubric(await r1.json());
      setLatest(await r2.json());
      const recJson = await r3.json();
      setRecs(recJson.recommendations ?? []);
    } catch (e: any) {
      setError(e.message ?? "エラーが発生しました");
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  // ✅ 追加：今日の優先カテゴリ（最もレベルが高い=初心者寄り）を選ぶ
  const priority = useMemo(() => {
    if (!latest?.values) return null;

    // valuesに存在するカテゴリだけ対象にする
    const available = SKILL_CATEGORIES.filter((c) => typeof latest.values[c] === "number");
    if (available.length === 0) return null;

    // “数値が大きいほど初心者寄り” として最大を優先
    let best = available[0];
    for (const c of available) {
      if ((latest.values[c] ?? 0) > (latest.values[best] ?? 0)) best = c;
    }

    const level = latest.values[best];
    const menu = getTrainingMenuForLevel(best, level);

    return { category: best, level, menu };
  }, [latest]);

  return (
    <main style={{ padding: 24, fontFamily: "sans-serif", maxWidth: 720 }}>
      <h1 style={{ fontSize: 24, marginBottom: 8 }}>保護者：最新の評価</h1>
      <div style={{ display: "flex", gap: 12 }}>
        <Link href="/">トップ</Link>
        <button
          onClick={refresh}
          style={{
            padding: "6px 10px",
            borderRadius: 10,
            border: "1px solid #ccc",
            background: "#fff",
          }}
        >
          更新
        </button>
      </div>

      {error && <p style={{ color: "red", marginTop: 12 }}>Error: {error}</p>}

      {!latest && (
        <div style={{ marginTop: 16, padding: 12, border: "1px solid #ddd", borderRadius: 12 }}>
          <p style={{ margin: 0 }}>
            まだ評価がありません。先に <b>/coach/players/{PLAYER_ID}/evaluate</b> で保存してください。
          </p>
        </div>
      )}

      {latest && rubric && (
        <>
          {/* ✅ 追加：今日の平日練習（trainingMenuから自動表示） */}
          <div style={{ marginTop: 16, padding: 16, border: "1px solid #ddd", borderRadius: 12, background: "#fff" }}>
            <h2 style={{ marginTop: 0 }}>今日の平日練習（おすすめ）</h2>

            {!priority ? (
              <p style={{ color: "#666" }}>（評価データがありません）</p>
            ) : (
              <>
                <p style={{ color: "#666", marginTop: 0 }}>
                  優先カテゴリ：<b>{categoryLabel[priority.category]}</b>（現在 {priority.level}級）
                </p>

                {priority.menu ? (
                  <div style={{ border: "1px solid #eee", borderRadius: 12, padding: 12 }}>
                    <div style={{ fontWeight: 700, marginBottom: 8 }}>{priority.menu.title}</div>
                    <ul style={{ paddingLeft: 16, margin: 0 }}>
                      {priority.menu.items.map((t) => (
                        <li key={t}>{t}</li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <p style={{ color: "#666" }}>（該当する練習メニューが見つかりません）</p>
                )}
              </>
            )}
          </div>

          <div style={{ marginTop: 16, padding: 16, border: "1px solid #ddd", borderRadius: 12 }}>
            <h2 style={{ marginTop: 0 }}>評価（最新）</h2>
            <p style={{ color: "#666", marginTop: 0 }}>日時: {latest.created_at}</p>

            {rubric.categories.map((cat) => (
              <div key={cat.key} style={{ marginBottom: 10 }}>
                <b>{cat.label}</b>: {latest.values?.[cat.key] ?? "-"}
              </div>
            ))}

            <h3>フィードバック</h3>
            {renderComment(latest.comment)}
          </div>

          <div style={{ marginTop: 16, padding: 16, border: "1px solid #ddd", borderRadius: 12 }}>
            <h2 style={{ marginTop: 0 }}>次におすすめの練習（API）</h2>
            {recs.length === 0 ? (
              <p style={{ color: "#666" }}>（recommendations未定義 or 該当なし）</p>
            ) : (
              <ul style={{ paddingLeft: 16 }}>
                {recs.map((t, i) => (
                  <li key={i}>{t}</li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </main>
  );
}
