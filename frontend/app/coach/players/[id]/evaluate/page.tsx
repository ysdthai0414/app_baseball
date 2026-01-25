"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";

type Level = { score: number; label: string };
type Category = { key: string; label: string; levels: Level[] };
type Rubric = { categories: Category[] };

// 末尾の / を除去して揺れを吸収（本番は env、ローカルは localhost）
const API_BASE =
  (process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ??
    "http://localhost:8000");

const EXPECTED_KEYS = ["batting", "throwing", "catching", "running", "iq"] as const;
type ExpectedKey = (typeof EXPECTED_KEYS)[number];

export default function CoachEvaluatePage() {
  const params = useParams<{ id: string }>();
  const playerId = params?.id;

  const [rubric, setRubric] = useState<Rubric | null>(null);

  // values は rubric の key をそのまま持つ（batting/throwing/catching/running/iq）
  const [values, setValues] = useState<Record<string, number>>({});

  // 画面のテキスト入力（いったん memo にまとめて保存）
  const [good, setGood] = useState("");
  const [nextAction, setNextAction] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // rubric取得
  useEffect(() => {
    const run = async () => {
      try {
        setError("");
        const res = await fetch(`${API_BASE}/rubric`, { cache: "no-store" });
        if (!res.ok) throw new Error("rubricの取得に失敗しました");

        // backend が {"rubric": {...}} で返すケースと、Rubric直返し両対応
        const raw = await res.json();
        const data: Rubric =
          raw?.categories ? (raw as Rubric) : (raw?.rubric as Rubric);

        setRubric(data);
      } catch (e: any) {
        setError(e?.message ?? "エラーが発生しました");
      }
    };
    run();
  }, []);

  const categories = useMemo(() => {
    return (rubric?.categories ?? []).map((c) => ({
      ...c,
      levels: [...c.levels].sort((a, b) => a.score - b.score),
    }));
  }, [rubric]);

  // 5項目(batting/throwing/catching/running/iq)が全部選ばれてるかチェック
  const allSelected =
    EXPECTED_KEYS.every((k) => values[k] != null) &&
    EXPECTED_KEYS.every((k) => typeof values[k] === "number");

  const save = async () => {
    if (!playerId) return;

    if (!allSelected) {
      alert("すべての項目（打つ/投げる/捕る/走る/IQ）を選択してください");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const memo =
        `良かった点：${good || "（未入力）"}\n` +
        `次回の意識ポイント：${nextAction || "（未入力）"}`;

      // ✅ backend の EvaluationCreate に合わせる
      const payload = {
        child_id: Number(playerId),
        values: {
          batting: values["batting"],
          throwing: values["throwing"],
          catching: values["catching"],
          running: values["running"],
          iq: values["iq"],
        },
        memo,
        // evaluated_at は省略OK（backendで now にする想定）
      };

      const res = await fetch(`${API_BASE}/players/${playerId}/evaluations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const t = await res.text().catch(() => "");
        throw new Error(`保存に失敗しました: ${t}`);
      }

      alert("保存しました");
      window.location.href = `/coach/players/${playerId}`;
    } catch (e: any) {
      setError(e?.message ?? "保存時にエラーが発生しました");
    } finally {
      setSaving(false);
    }
  };

  // params がまだ取れない瞬間ガード
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
        <Link href={`/coach/players/${playerId}`}>← 詳細へ戻る</Link>
        <Link href="/coach/players">一覧</Link>
        <Link href="/coach">ダッシュボード</Link>
      </div>

      <h1 style={{ fontSize: 24, marginTop: 12 }}>現状評価（5項目）</h1>
      <p style={{ color: "#666", marginTop: 4 }}>player_id: {playerId}</p>

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

      {!rubric && !error && <p style={{ marginTop: 16 }}>rubricを読み込み中...</p>}

      {categories.map((cat) => (
        <section
          key={cat.key}
          style={{
            border: "1px solid #ddd",
            borderRadius: 12,
            padding: 16,
            marginTop: 16,
          }}
        >
          <h2 style={{ marginTop: 0 }}>{cat.label}</h2>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {cat.levels.map((lv) => (
              <label
                key={lv.score}
                style={{
                  border: "1px solid #ccc",
                  borderRadius: 999,
                  padding: "6px 10px",
                  cursor: "pointer",
                  userSelect: "none",
                }}
              >
                <input
                  type="radio"
                  name={cat.key}
                  checked={values[cat.key] === lv.score}
                  onChange={() =>
                    setValues((prev) => ({ ...prev, [cat.key]: lv.score }))
                  }
                />
                <span style={{ marginLeft: 6 }}>
                  {lv.score}: {lv.label}
                </span>
              </label>
            ))}
          </div>
        </section>
      ))}

      <section style={{ marginTop: 16 }}>
        <h3>良かった点（メモ）</h3>
        <textarea
          value={good}
          onChange={(e) => setGood(e.target.value)}
          rows={3}
          style={{
            width: "100%",
            padding: 12,
            borderRadius: 12,
            border: "1px solid #ccc",
          }}
          placeholder="例：最後までボールから目を切らずに打てた"
        />
      </section>

      <section style={{ marginTop: 16 }}>
        <h3>次回の意識ポイント（メモ）</h3>
        <textarea
          value={nextAction}
          onChange={(e) => setNextAction(e.target.value)}
          rows={3}
          style={{
            width: "100%",
            padding: 12,
            borderRadius: 12,
            border: "1px solid #ccc",
          }}
          placeholder="例：踏み込み足の向きを固定してからスイング"
        />
      </section>

      <button
        onClick={save}
        disabled={!allSelected || saving}
        style={{
          marginTop: 16,
          padding: "10px 14px",
          borderRadius: 12,
          border: "1px solid #333",
          background: !allSelected || saving ? "#aaa" : "#111",
          color: "#fff",
          cursor: !allSelected || saving ? "not-allowed" : "pointer",
        }}
      >
        {saving ? "保存中..." : "保存"}
      </button>

      {!allSelected && rubric && (
        <p style={{ marginTop: 8, color: "#666" }}>
          ※ すべての項目（打つ/投げる/捕る/走る/IQ）を選択すると保存できます
        </p>
      )}
    </main>
  );
}
