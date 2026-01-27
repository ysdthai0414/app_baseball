// BUILD_MARK: 2026-01-25 player-page updated

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

const API_BASE =
  (process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ??
    "http://localhost:8000");

type Evaluation = {
  id: number;
  child_id: number;
  evaluated_at: string;
  values: Record<string, number>;
  memo?: string | null;
};

type PracticeLog = {
  id: number;
  child_id: number;
  practice_date: string;
  // いま backend は content を返さない可能性があるので optional
  content?: string | null;

  ai_feedback?: string | null;
  coach_comment?: string | null;
  created_at: string;
  practice_type: string;

  mood?: number | null;
  fatigue?: number | null;

  today_practice?: string | null;
  coach_said?: string | null;
  next_goal?: string | null;
  free_note?: string | null;
};

type RecRes = { recommendations: string[] };

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

function todayYYYYMMDD() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function toChildId(playerId: string): number {
  const n = Number(playerId);
  if (Number.isFinite(n) && n > 0) return n;

  const digits = playerId.replace(/\D/g, "");
  const nn = Number(digits);
  if (Number.isFinite(nn) && nn > 0) return nn;

  throw new Error("選手IDが数値ではありません。URLを /player/1 のようにしてください。");
}

function renderLatestLogText(log: PracticeLog | null) {
  if (!log) return "（日報なし）";

  // backendが content を返さない場合に備えて組み立て
  if (log.content) return log.content;

  const lines = [
    "【今日練習したこと】",
    log.today_practice ?? "（未入力）",
    "",
    "【今日 監督・コーチから言われたこと】",
    log.coach_said ?? "（未入力）",
    "",
    "【次にできるようになりたいこと（目標）】",
    log.next_goal ?? "（未入力）",
    "",
    "【自由記述】",
    log.free_note ?? "（未入力）",
  ];
  return lines.join("\n");
}


export default function PlayerPage() {
  const params = useParams<{ id: string }>();
  const playerId = params?.id ?? "1";

  const [latest, setLatest] = useState<Evaluation | null>(null);
  const [latestLog, setLatestLog] = useState<PracticeLog | null>(null);

  // 休日練習後の入力（①〜④）
  const [didToday, setDidToday] = useState("");
  const [coachSaid, setCoachSaid] = useState("");
  const [goalNext, setGoalNext] = useState("");
  const [freeNote, setFreeNote] = useState("");

  const [mood, setMood] = useState<number>(3);
  const [fatigue, setFatigue] = useState<number>(3);

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

      const childId = toChildId(playerId);

      const [rEval, rLog] = await Promise.all([
        fetch(`${API_BASE}/players/${playerId}/evaluations/latest`, {
          cache: "no-store",
        }),
        fetch(
          `${API_BASE}/practice-logs/latest?child_id=${childId}&practice_type=weekend`,
          {
            cache: "no-store",
          }
        ),
      ]);

      if (!rEval.ok) throw new Error("評価取得に失敗");

      // latest log
      if (rLog.ok) {
        const data = (await rLog.json()) as PracticeLog | null;
        setLatestLog(data ?? null);
      } else {
        setLatestLog(null);
      }

      // latest eval
      const evalData = (await rEval.json()) as Evaluation | null;
      setLatest(evalData ?? null);
    } catch (e: any) {
      setError(e?.message ?? "エラーが発生しました");
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const submitWeekendReport = async () => {
    try {
      setSaving(true);
      setError("");
      setSavedMsg("");

      const childId = toChildId(playerId);

      const hasAny =
        didToday.trim().length > 0 ||
        coachSaid.trim().length > 0 ||
        goalNext.trim().length > 0 ||
        freeNote.trim().length > 0;

      if (!hasAny) throw new Error("入力が空です。何か1つでも書いてください。");

      const payload = {
        child_id: childId,
        practice_date: todayYYYYMMDD(),
        practice_type: "weekend", // backend側で weekend→team にマップされる想定
        mood,
        fatigue,
        today_practice: didToday.trim(),
        coach_said: coachSaid.trim(),
        next_goal: goalNext.trim(),
        free_note: freeNote.trim() || null,
      };

      const r = await fetch(`${API_BASE}/practice-logs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!r.ok) {
        const t = await r.text();
        throw new Error(t || "日報（休日練習）の保存に失敗しました");
      }

      setDidToday("");
      setCoachSaid("");
      setGoalNext("");
      setFreeNote("");
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

  const textareaClass =
    "mt-2 w-full rounded-2xl border border-slate-300 bg-white p-3 text-sm text-slate-900 " +
    "placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500";

  const labelClass = "text-sm font-semibold text-slate-900 flex items-center gap-2";
  const hintClass = "text-sm text-slate-600";

  return (
    <main className="min-h-screen bg-[#070B14] text-slate-100 px-4 py-6 pb-28">
      <div className="mx-auto w-full max-w-3xl space-y-6">
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
          <Card className="rounded-3xl border border-slate-200 bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-base text-slate-900">
                まだ評価がありません
              </CardTitle>
              <div className="mt-1 text-sm text-slate-700">
                監督が休日練習後に評価を保存すると、ここに表示されます。
              </div>
            </CardHeader>
            <CardContent className="text-sm text-slate-800">
              ヒント：監督画面で評価を保存 → この画面で「更新」。
            </CardContent>
          </Card>
        ) : (
          <>
            <section className="space-y-3">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-slate-100">スキル成長</div>
                  <div className="text-xs text-slate-400">1〜10級（数字が小さいほど上達）</div>
                </div>
                <div className="text-xs text-slate-400">
                  更新: {latest?.evaluated_at ?? "-"}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {(
                  ["batting", "throwing", "catching", "running", "iq"] as SkillCategory[]
                ).map((cat) => (
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
                ))}
              </div>

              <Card className="rounded-3xl border border-slate-200 bg-white shadow-sm text-slate-900">
                <CardHeader>
                  <CardTitle className="text-base text-slate-900">
                    きょうのおすすめ練習
                  </CardTitle>
                  <div className="mt-1 text-sm text-slate-600">
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
                          isFocus ? "border-blue-400 bg-blue-50" : "border-slate-200 bg-slate-50",
                        ].join(" ")}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="text-sm font-semibold text-slate-900">
                            {SKILL_LABEL[cat]}
                          </div>
                          <Badge className="bg-white text-slate-900 border border-slate-300">
                            {lv}級
                          </Badge>
                        </div>

                        {menu ? (
                          <>
                            <div className="mt-2 text-sm text-slate-800">{menu.title}</div>
                            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
                              {menu.items.map((it) => (
                                <li key={it}>{it}</li>
                              ))}
                            </ul>
                          </>
                        ) : (
                          <div className="mt-2 text-sm text-slate-500">
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

        {/* Weekend report */}
        <section ref={reportRef} className="space-y-3">
          <div>
            <div className="text-sm font-semibold text-white">休日練習後の「日報」</div>
            <div className="text-xs text-slate-300">
              できたこと・言われたこと・目標を、監督に送ろう
            </div>
          </div>

          {savedMsg && (
            <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-4 text-sm text-emerald-200">
              {savedMsg}
            </div>
          )}

          <Card className="rounded-3xl border border-slate-200 bg-white shadow-sm text-slate-900">
            <CardHeader>
              <CardTitle className="text-base text-slate-900">日報を送る</CardTitle>
              <div className={hintClass}>休日練習のふりかえり（①〜④ + きぶん/つかれ）</div>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="text-sm font-semibold text-slate-900">きぶん</div>
                  <div className="mt-2 flex items-center gap-3">
                    <input
                      type="range"
                      min={1}
                      max={5}
                      value={mood}
                      onChange={(e) => setMood(Number(e.target.value))}
                      className="w-full accent-blue-600"
                    />
                    <Badge className="bg-white text-slate-900 border border-slate-200">
                      {mood}/5
                    </Badge>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="text-sm font-semibold text-slate-900">つかれ</div>
                  <div className="mt-2 flex items-center gap-3">
                    <input
                      type="range"
                      min={1}
                      max={5}
                      value={fatigue}
                      onChange={(e) => setFatigue(Number(e.target.value))}
                      className="w-full accent-blue-600"
                    />
                    <Badge className="bg-white text-slate-900 border border-slate-200">
                      {fatigue}/5
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <div className={labelClass}>
                    <span className="inline-block h-2 w-2 rounded-full bg-blue-600" />
                    ① 今日練習したこと
                  </div>
                  <textarea
                    value={didToday}
                    onChange={(e) => setDidToday(e.target.value)}
                    rows={2}
                    placeholder="例）ティーバッティング30回、ゴロ捕球、送球"
                    className={textareaClass}
                  />
                </div>

                <div>
                  <div className={labelClass}>
                    <span className="inline-block h-2 w-2 rounded-full bg-blue-600" />
                    ② 今日 監督・コーチから言われたこと
                  </div>
                  <textarea
                    value={coachSaid}
                    onChange={(e) => setCoachSaid(e.target.value)}
                    rows={2}
                    placeholder="例）最後までボールを見る／ステップを小さく"
                    className={textareaClass}
                  />
                </div>

                <div>
                  <div className={labelClass}>
                    <span className="inline-block h-2 w-2 rounded-full bg-blue-600" />
                    ③ 次にできるようになりたいこと（目標）
                  </div>
                  <textarea
                    value={goalNext}
                    onChange={(e) => setGoalNext(e.target.value)}
                    rows={2}
                    placeholder="例）送球をまっすぐ投げる／ミート率を上げる"
                    className={textareaClass}
                  />
                </div>

                <div>
                  <div className={labelClass}>
                    <span className="inline-block h-2 w-2 rounded-full bg-blue-600" />
                    ④ 自由記述
                  </div>
                  <textarea
                    value={freeNote}
                    onChange={(e) => setFreeNote(e.target.value)}
                    rows={3}
                    placeholder="例）今日は声が出せた。次は守備のときの準備を早くしたい。"
                    className={textareaClass}
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={submitWeekendReport}
                  disabled={
                    saving ||
                    (didToday.trim().length === 0 &&
                      coachSaid.trim().length === 0 &&
                      goalNext.trim().length === 0 &&
                      freeNote.trim().length === 0)
                  }
                >
                  {saving ? "送信中..." : "監督に送る"}
                </Button>

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setDidToday("");
                    setCoachSaid("");
                    setGoalNext("");
                    setFreeNote("");
                    setMood(3);
                    setFatigue(3);
                  }}
                >
                  クリア
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border border-slate-200 bg-white shadow-sm text-slate-900">
            <CardHeader>
              <CardTitle className="text-base text-slate-900">
                最新の日報（自分の送信内容）
              </CardTitle>
              <div className={hintClass}>送った内容がここで確認できます</div>
            </CardHeader>

            <CardContent className="space-y-2">
              {!latestLog ? (
                <div className="text-sm text-slate-600">まだ日報がありません。</div>
              ) : (
                <>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className="bg-white text-slate-900 border border-slate-200">
                      気分: {latestLog.mood ?? "-"}
                    </Badge>
                    <Badge className="bg-white text-slate-900 border border-slate-200">
                      つかれ: {latestLog.fatigue ?? "-"}
                    </Badge>
                    <Badge className="bg-slate-100 text-slate-800 border border-slate-200">
                      {latestLog.created_at}
                    </Badge>
                    <Badge className="bg-slate-100 text-slate-800 border border-slate-200">
                      {latestLog.practice_type}
                    </Badge>
                  </div>

                  <div className="text-sm text-slate-900 whitespace-pre-wrap">
                    {renderLatestLogText(latestLog)}
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
                <div className="text-xs text-slate-300 truncate">
                  できたこと・言われたこと・目標を、監督に送ろう
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
                    else submitWeekendReport();
                  }}
                  disabled={
                    saving ||
                    (didToday.trim().length === 0 &&
                      coachSaid.trim().length === 0 &&
                      goalNext.trim().length === 0 &&
                      freeNote.trim().length === 0)
                  }
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
