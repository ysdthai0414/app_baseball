"use client";

import Link from "next/link";

import { useEffect, useMemo, useState } from "react";

import { useParams, useRouter } from "next/navigation";

const API_BASE =

  (process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ??

    "http://localhost:8000");

type Player = {

  id: string;

  name: string;

  grade?: number;

  position?: string;

};

type LatestEvaluation = {

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

function toChildId(playerId: string): number {

  const n = Number(playerId);

  if (Number.isFinite(n) && n > 0) return n;

  throw new Error("選手IDが数値ではありません");

}

function clamp1to10(n: number) {

  if (!Number.isFinite(n)) return 10;

  return Math.max(1, Math.min(10, Math.round(n)));

}

export default function CoachPlayerEvaluatePage() {

  const params = useParams<{ id: string }>();

  const router = useRouter();

  const playerId = params?.id ?? "";

  const [player, setPlayer] = useState<Player | null>(null);

  const [latest, setLatest] = useState<LatestEvaluation>(null);

  const [batting, setBatting] = useState(10);

  const [throwing, setThrowing] = useState(10);

  const [catching, setCatching] = useState(10);

  const [running, setRunning] = useState(10);

  const [iq, setIq] = useState(10);

  const [memo, setMemo] = useState("");

  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");

  const [savedMsg, setSavedMsg] = useState("");

  const childId = useMemo(() => {

    if (!playerId) return null;

    return toChildId(playerId);

  }, [playerId]);

  useEffect(() => {

    if (!playerId) return;

    const load = async () => {

      try {

        setError("");

        // 選手情報

        const rPlayer = await fetch(`${API_BASE}/players/${playerId}`, {

          cache: "no-store",

        });

        if (rPlayer.ok) {

          const data = await rPlayer.json();

          setPlayer((data?.player ?? data) as Player);

        }

        // 最新評価（初期値に反映）

        const rEval = await fetch(

          `${API_BASE}/players/${playerId}/evaluations/latest`,

          { cache: "no-store" }

        );

        if (rEval.ok) {

          const ev = (await rEval.json()) as LatestEvaluation;

          setLatest(ev);

          if (ev?.values) {

            setBatting(clamp1to10(ev.values.batting ?? 10));

            setThrowing(clamp1to10(ev.values.throwing ?? 10));

            setCatching(clamp1to10(ev.values.catching ?? 10));

            setRunning(clamp1to10(ev.values.running ?? 10));

            setIq(clamp1to10(ev.values.iq ?? 10));

            setMemo(ev.memo ?? "");

          }

        }

      } catch (e: any) {

        setError(e?.message ?? "読み込みに失敗しました");

      }

    };

    load();

  }, [playerId]);

  const submit = async () => {

    try {

      if (!childId) throw new Error("child_id が不正です");

      setSaving(true);

      setError("");

      setSavedMsg("");

      const payload = {

        child_id: childId,

        values: {

          batting: clamp1to10(batting),

          throwing: clamp1to10(throwing),

          catching: clamp1to10(catching),

          running: clamp1to10(running),

          iq: clamp1to10(iq),

        },

        memo: memo.trim() || null,

      };

      // 既存API想定（どちらかが通る）

      const urls = [

        `${API_BASE}/evaluations`,

        `${API_BASE}/players/${playerId}/evaluations`,

      ];

      let lastError = "";

      for (const url of urls) {

        const r = await fetch(url, {

          method: "POST",

          headers: { "Content-Type": "application/json" },

          body: JSON.stringify(payload),

        });

        if (r.ok) {

          setSavedMsg("保存しました");

          router.push(`/coach/players/${playerId}`);

          return;

        } else {

          lastError = await r.text();

        }

      }

      throw new Error(lastError || "評価の保存に失敗しました");

    } catch (e: any) {

      setError(e?.message ?? "保存に失敗しました");

    } finally {

      setSaving(false);

    }

  };

  return (

    <main style={{ padding: 24, fontFamily: "sans-serif", maxWidth: 720 }}>

      <div style={{ display: "flex", gap: 12 }}>

        <Link href={`/coach/players/${playerId}`}>← 詳細へ</Link>

        <Link href="/coach/players">一覧へ</Link>

      </div>

      <h1 style={{ fontSize: 22, marginTop: 14 }}>

        休日練習の評価 {player ? `：${player.name}` : ""}

      </h1>

      {error && (

        <div style={{ marginTop: 12, color: "#c00" }}>Error: {error}</div>

      )}

      {savedMsg && (

        <div style={{ marginTop: 12, color: "#060" }}>{savedMsg}</div>

      )}

      <section style={{ marginTop: 16 }}>

        <p style={{ color: "#666" }}>

          1〜10（数字が小さいほど上達）

        </p>

        <Field label="打つ" value={batting} onChange={setBatting} />

        <Field label="投げる" value={throwing} onChange={setThrowing} />

        <Field label="捕る" value={catching} onChange={setCatching} />

        <Field label="走る" value={running} onChange={setRunning} />

        <Field label="野球IQ" value={iq} onChange={setIq} />

        <div style={{ marginTop: 12 }}>

          <div style={{ fontWeight: 600 }}>フィードバック</div>

          <textarea

            rows={5}

            value={memo}

            onChange={(e) => setMemo(e.target.value)}

            style={{

              width: "100%",

              marginTop: 6,

              borderRadius: 8,

              padding: 10,

              border: "1px solid #ccc",

            }}

          />

        </div>

        <button

          onClick={submit}

          disabled={saving}

          style={{

            marginTop: 16,

            width: "100%",

            padding: 12,

            borderRadius: 8,

            border: "1px solid #333",

            background: "#111",

            color: "#fff",

          }}

        >

          {saving ? "保存中…" : "評価を保存"}

        </button>

      </section>

    </main>

  );

}

function Field({

  label,

  value,

  onChange,

}: {

  label: string;

  value: number;

  onChange: (n: number) => void;

}) {

  return (

    <div style={{ marginTop: 10 }}>

      <div style={{ fontWeight: 600 }}>{label}</div>

      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>

        <input

          type="range"

          min={1}

          max={10}

          value={value}

          onChange={(e) => onChange(Number(e.target.value))}

          style={{ flex: 1 }}

        />

        <span>{value}</span>

      </div>

    </div>

  );

}