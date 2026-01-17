"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { CurrentLevelCard } from "@/components/level/CurrentLevelCard";
import type { SkillCategory } from "@/lib/levelTable";
import { TRAINING_MENU } from "@/lib/trainingMenu";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

type Evaluation = {
  id: number;
  created_at: string;
  player_id: string;
  values: Record<string, number>;
  comment: any;
} | null;

type DailyReport = {
  id: number;
  created_at: string;
  player_id: string;
  body: string;
  mood?: number | null;
  fatigue?: number | null;
  tags?: string[];
} | null;

const SKILL_LABEL: Record<SkillCategory, string> = {
  batting: "打つ（バッティング）",
  throwing: "投げる（スローイング）",
  catching: "捕る（キャッチング）",
  running: "走る（走塁・スピード）",
  iq: "ルール・マナー（野球IQ）",
};

function clampLevel(n: number) {
  if (!Number.isFinite(n)) return 10;
  return Math.min(10, Math.max(1, Math.floor(n)));
}

function pickMenu(category: SkillCategory, currentLevel: number) {
  const level = clampLevel(currentLevel);
  const menus = TRAINING_MENU[category] ?? [];
  return menus.find((m) => m.minLevel <= level && level <= m.maxLevel) ?? null;
}

export default function PlayerPage() {
  const params = useParams<{ id: string }>();
  const playerId = params?.id ?? "p1";

  const [latest, setLatest] = useState<Evaluation>(null);
  const [latestReport, setLatestReport] = useState<DailyReport>(null);

  const [body, setBody] = useState("");
  const [mood, setMood] = useState<number>(3);
  const [fatigue, setFatigue] = useState<number>(3);
  const [tags, setTags] = useState<SkillCategory[]>([]);

  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");

  const reportRef = React.useRef<HTMLDivElement | null>(null);
  const [reportOpen, setReportOpen] = useState(false);

  const openReport = () => {
    setReportOpen(true);
    requestAnimationFrame(() => {
      reportRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const refresh = async () => {
    try {
      setError("");
      setSavedMsg("");

      const [rEval, rRep] = await Promise.all([
        fetch(`${API_BASE}/players/${playerId}/evaluations/latest`, { cache: "no-store" }),
        fetch(`${API_BASE}/players/${playerId}/daily-reports/latest`, { cache: "no-store" }),
      ]);

      if (!rEval.ok) throw new Error("評価取得に失敗");
      if (!rRep.ok) throw new Error("日報取得に失敗");

      setLatest(await rEval.json());
      setLatestReport(await rRep.json());
    } catch (e: any) {
      setError(e?.message ?? "エラーが発生しました");
    }
  };

  useEffect(() => {
    refresh();
  }, [playerId]);

  const skillLevels = useMemo(() => {
    const v = latest?.values ?? {};
    const get = (k: SkillCategory) => clampLevel(Number(v[k] ?? 10));
    return {
      batting: get("batting"),
      throwing: get("throwing"),
      catching: get("catching"),
      running: get("running"),
      iq: get("iq"),
    };
  }, [latest]);

  const focusKey = useMemo<SkillCategory | null>(() => {
    if (!latest) return null;
    const keys: SkillCategory[] = ["batting", "throwing", "catching", "running", "iq"];
    let best: SkillCategory = keys[0];
    let bestLv = skillLevels[best];
    for (const k of keys) {
      const lv = skillLevels[k];
      if (lv < bestLv) {
        best = k;
        bestLv = lv;
      }
    }
    return best ?? null;
  }, [latest, skillLevels]);

  const selectedTagsText = useMemo(() => {
    if (tags.length === 0) return "（未選択）";
    return tags.map((t) => SKILL_LABEL[t]).join(" / ");
  }, [tags]);

  const submitDailyReport = async () => {
    try {
      setSaving(true);
      setError("");
      setSavedMsg("");

      const payload = {
        player_id: playerId,
        body,
        mood,
        fatigue,
        tags: tags.map((t) => SKILL_LABEL[t]),
      };

      const r = await fetch(`${API_BASE}/players/${playerId}/daily-reports`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!r.ok) {
        const t = await r.text();
        throw new Error(t || "日報の保存に失敗しました");
      }

      setBody("");
      setTags([]);
      setMood(3);
      setFatigue(3);
      setSavedMsg("送信しました！監督に届きます。");
      await refresh();
    } catch (e: any) {
      setError(e?.message ?? "日報の送信に失敗しました");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#070B14] text-slate-100 px-4 py-6 pb-28">
      <div className="mx-auto w-full max-w-3xl space-y-6">
        {/* Top bar */}
        <div className="flex items-center justify-between gap-3">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-100 hover:bg-white/10"
          >
            ← 戻る
          </Link>

          <Button variant="secondary" size="sm" onClick={refresh}>
            更新
          </Button>
        </div>

        {/* Hero */}
        <div className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-[0_10px_30px_rgba(0,0,0,0.35)] backdrop-blur">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-slate-100">
                きょうの自分
              </h1>
              <p className="mt-2 text-sm text-slate-300">
                レベルと、つぎにがんばることを見よう
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Badge className="bg-white text-black border border-white/10">
                PLAYER
              </Badge>
              <Badge className="bg-white text-black border border-white/10">
                {playerId}
              </Badge>
            </div>
          </div>

          {error && (
            <div className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
              Error: {error}
            </div>
          )}
        </div>

        {!latest ? (
          <Card className="rounded-3xl border border-slate-800 bg-[#0B1220] shadow-sm">
            <CardHeader>
              <CardTitle className="text-base text-slate-100">
                まだ評価がありません
              </CardTitle>
              <div className="mt-1 text-sm text-slate-400">
                監督が休日練習後に評価を保存すると、ここに表示されます。
              </div>
            </CardHeader>
            <CardContent className="text-sm text-slate-200">
              ヒント：監督画面で評価を保存 → この画面で「更新」。
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Skill status */}
            <section className="space-y-3">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-slate-100">
                    スキル成長
                  </div>
                  <div className="text-xs text-slate-400">
                    1〜10級（数字が小さいほど上達）
                  </div>
                </div>
                <div className="text-xs text-slate-400">
                  更新: {latest?.created_at ?? "-"}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {(["batting", "throwing", "catching", "running", "iq"] as SkillCategory[]).map(
                  (cat) => (
                    <div
                      key={cat}
                      className={[
                        "rounded-3xl border bg-[#0B1220] p-1 shadow-[0_10px_30px_rgba(0,0,0,0.35)]",
                        focusKey === cat
                          ? "border-blue-400/40 ring-2 ring-blue-500/25"
                          : "border-slate-800",
                      ].join(" ")}
                    >
                      <CurrentLevelCard
                        category={cat}
                        currentLevel={skillLevels[cat]}
                        title={SKILL_LABEL[cat]}
                      />
                    </div>
                  )
                )}
              </div>

              {/* Today menu */}
              <Card className="rounded-3xl border border-slate-800 bg-[#0B1220] shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base text-slate-100">
                    きょうのおすすめ練習
                  </CardTitle>
                  <div className="mt-1 text-sm text-slate-400">
                    いまの級に合わせた平日メニュー
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {(Object.keys(SKILL_LABEL) as SkillCategory[]).map((cat) => {
                    const lv = skillLevels[cat];
                    const menu = pickMenu(cat, lv);
                    const isFocus = focusKey === cat;

                    return (
                      <div
                        key={cat}
                        className={[
                          "rounded-2xl border p-4",
                          isFocus
                            ? "border-blue-400/30 bg-blue-500/10"
                            : "border-slate-800 bg-slate-900/40",
                        ].join(" ")}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="text-sm font-semibold text-slate-100">
                            {SKILL_LABEL[cat]}
                          </div>
                          <Badge className="bg-blue-500/15 text-blue-200 border border-blue-400/20">
                            {lv}級
                          </Badge>
                        </div>

                        {menu ? (
                          <>
                            <div className="mt-2 text-sm text-slate-200">
                              {menu.title}
                            </div>
                            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-200">
                              {menu.items.map((it) => (
                                <li key={it}>{it}</li>
                              ))}
                            </ul>
                          </>
                        ) : (
                          <div className="mt-2 text-sm text-slate-400">
                            （この級に合うメニューが未定義です）
                          </div>
                        )}
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </section>
          </>
        )}

        {/* Daily report */}
        <section ref={reportRef} className="space-y-3">
          <div>
            <div className="text-sm font-semibold text-slate-100">
              休日練習後の「日報」
            </div>
            <div className="text-xs text-slate-400">
              できたこと・つぎにがんばることを、監督に送ろう
            </div>
          </div>

          {savedMsg && (
            <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-4 text-sm text-emerald-200">
              {savedMsg}
            </div>
          )}

          <Card className="rounded-3xl border border-slate-800 bg-[#0B1220] shadow-sm">
            <CardHeader>
              <CardTitle className="text-base text-slate-100">日報を送る</CardTitle>
              <div className="mt-1 text-sm text-slate-400">
                選んだカテゴリ：{selectedTagsText}
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {(Object.keys(SKILL_LABEL) as SkillCategory[]).map((cat) => {
                  const active = tags.includes(cat);
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => {
                        setTags((prev) =>
                          prev.includes(cat)
                            ? prev.filter((x) => x !== cat)
                            : [...prev, cat]
                        );
                      }}
                      className={[
                        "rounded-full px-3 py-1 text-xs font-medium border transition",
                        active
                          ? "bg-blue-600 text-white border-blue-500"
                          : "bg-slate-900/60 text-slate-200 border-slate-700 hover:bg-slate-900",
                      ].join(" ")}
                    >
                      {SKILL_LABEL[cat]}
                    </button>
                  );
                })}
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="rounded-2xl border border-slate-700 bg-slate-900/60 p-4">
                  <div className="text-sm font-semibold text-slate-100">きぶん</div>
                  <div className="mt-2 flex items-center gap-3">
                    <input
                      type="range"
                      min={1}
                      max={5}
                      value={mood}
                      onChange={(e) => setMood(Number(e.target.value))}
                      className="w-full accent-blue-500"
                    />
                    <Badge className="bg-blue-500/15 text-blue-200 border border-blue-400/20">
                      {mood}/5
                    </Badge>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-700 bg-slate-900/60 p-4">
                  <div className="text-sm font-semibold text-slate-100">つかれ</div>
                  <div className="mt-2 flex items-center gap-3">
                    <input
                      type="range"
                      min={1}
                      max={5}
                      value={fatigue}
                      onChange={(e) => setFatigue(Number(e.target.value))}
                      className="w-full accent-blue-500"
                    />
                    <Badge className="bg-blue-500/15 text-blue-200 border border-blue-400/20">
                      {fatigue}/5
                    </Badge>
                  </div>
                </div>
              </div>

              <div>
                <div className="text-sm font-semibold text-slate-100">きょうのふりかえり</div>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={5}
                  placeholder="例）バッティングで、さいごまでボールを見られた。つぎは、足をもっとつかう。"
                  className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-900/60 p-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/60"
                />
                <div className="mt-1 text-xs text-slate-400">
                  できたこと／つぎにがんばることを書こう
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={submitDailyReport}
                  disabled={saving || body.trim().length === 0}
                >
                  {saving ? "送信中..." : "監督に送る"}
                </Button>

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setBody("");
                    setTags([]);
                    setMood(3);
                    setFatigue(3);
                  }}
                >
                  クリア
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border border-slate-800 bg-[#0B1220] shadow-sm">
            <CardHeader>
              <CardTitle className="text-base text-slate-100">
                最新の日報（自分の送信内容）
              </CardTitle>
              <div className="mt-1 text-sm text-slate-400">
                送った内容がここで確認できます
              </div>
            </CardHeader>

            <CardContent className="space-y-2">
              {!latestReport ? (
                <div className="text-sm text-slate-400">まだ日報がありません。</div>
              ) : (
                <>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className="bg-blue-500/15 text-blue-200 border border-blue-400/20">
                      気分: {latestReport.mood ?? "-"}
                    </Badge>
                    <Badge className="bg-blue-500/15 text-blue-200 border border-blue-400/20">
                      つかれ: {latestReport.fatigue ?? "-"}
                    </Badge>
                    <Badge className="bg-slate-900/60 text-slate-200 border border-slate-700">
                      {latestReport.created_at}
                    </Badge>
                  </div>

                  <div className="text-sm text-slate-100 whitespace-pre-wrap">
                    {latestReport.body}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {(latestReport.tags ?? []).map((t) => (
                      <Badge
                        key={t}
                        className="bg-slate-900/60 text-slate-200 border border-slate-700"
                      >
                        {t}
                      </Badge>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </section>

        <div className="pt-2 text-center text-xs text-slate-500">
          APP_BASEBALL（プロト）
        </div>
      </div>

      {/* Bottom fixed CTA */}
      <div className="fixed inset-x-0 bottom-0 z-50">
        <div className="mx-auto w-full max-w-3xl px-4 pb-4">
          <div className="rounded-2xl border border-slate-800 bg-[#0B1220]/90 backdrop-blur p-3 shadow-[0_10px_30px_rgba(0,0,0,0.35)]">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-sm font-semibold text-slate-100">
                  休日練習後の「日報」
                </div>
                <div className="text-xs text-slate-400 truncate">
                  できたこと・つぎにがんばることを、監督に送ろう
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Button variant="secondary" size="sm" onClick={openReport}>
                  入力へ
                </Button>

                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    if (!reportOpen) openReport();
                    else submitDailyReport();
                  }}
                  disabled={saving || body.trim().length === 0}
                >
                  {saving ? "送信中..." : "日報提出"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
