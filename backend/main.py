from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path
import json
from pydantic import BaseModel
from typing import Dict, Any, List, Optional
from datetime import datetime

app = FastAPI()

# フロント(Next)から叩けるようにCORS許可
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = Path(__file__).resolve().parent
RUBRIC_PATH = BASE_DIR / "config" / "skill_rubric.json"


def load_rubric() -> Dict[str, Any]:
    # BOM入りJSON対策（utf-8-sig）
    with open(RUBRIC_PATH, "r", encoding="utf-8-sig") as f:
        return json.load(f)


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/rubric")
def rubric():
    return load_rubric()


# ====== players（固定データ：プロト用） ======
PLAYERS = [
    {"id": "p1", "name": "山田 太郎", "grade": 4, "position": "内野"},
    {"id": "p2", "name": "佐藤 次郎", "grade": 5, "position": "外野"},
    {"id": "p3", "name": "鈴木 花子", "grade": 3, "position": "投手"},
]


@app.get("/players")
def list_players():
    return PLAYERS


@app.get("/players/{player_id}")
def get_player(player_id: str):
    for p in PLAYERS:
        if p["id"] == player_id:
            return p
    raise HTTPException(status_code=404, detail="player not found")


# ====== evaluations（メモリ保存：後でDBに差し替え） ======
EVALUATIONS: List[Dict[str, Any]] = []


class EvaluationIn(BaseModel):
    player_id: str
    values: Dict[str, int]
    # ★ここがA案の肝：文字列でもオブジェクトでも受けられる
    comment: Optional[Any] = None


@app.post("/evaluations")
def create_evaluation(payload: EvaluationIn):
    # valuesの最低限バリデーション（1〜5）
    for k, v in payload.values.items():
        if not (1 <= v <= 10):
            raise HTTPException(status_code=400, detail=f"{k} must be 1-10")

    item = {
        "id": len(EVALUATIONS) + 1,
        "created_at": datetime.utcnow().isoformat() + "Z",
        "player_id": payload.player_id,
        "values": payload.values,
        "comment": payload.comment,
    }
    EVALUATIONS.append(item)
    return item


@app.get("/evaluations/latest")
def latest_evaluation():
    if not EVALUATIONS:
        return None
    return EVALUATIONS[-1]


@app.get("/players/{player_id}/evaluations/latest")
def latest_by_player(player_id: str):
    for ev in reversed(EVALUATIONS):
        if ev.get("player_id") == player_id:
            return ev
    return None


# ====== recommendation（rubricのrecommendationsルールがあれば使用） ======
def build_recommendations(values: Dict[str, int]) -> List[str]:
    rubric = load_rubric()
    recs: List[str] = []

    for cat in rubric.get("categories", []):
        key = cat.get("key")
        score = values.get(key)
        if score is None:
            continue

        rules = cat.get("recommendations", [])
        text = None
        for r in rules:
            # max_score 以下に最初にマッチしたものを採用
            if score <= r.get("max_score", 10):
                text = r.get("text")
                break

        if text:
            recs.append(f"{cat.get('label')}: {text}")

    return recs

# ====== daily reports（休日練習後の日報：後でDBに差し替え） ======
DAILY_REPORTS: List[Dict[str, Any]] = []


class DailyReportIn(BaseModel):
    player_id: str
    body: str
    mood: Optional[int] = None  # 1-5 くらい想定（任意）
    fatigue: Optional[int] = None  # 1-5（任意）
    tags: Optional[List[str]] = None  # 任意（例: ["バッティング", "守備"]）


@app.post("/players/{player_id}/daily-reports")
def create_daily_report(player_id: str, payload: DailyReportIn):
    if payload.player_id != player_id:
        raise HTTPException(status_code=400, detail="player_id mismatch")

    if not payload.body or not payload.body.strip():
        raise HTTPException(status_code=400, detail="body is required")

    # 簡易バリデーション（任意）
    for k in ["mood", "fatigue"]:
        v = getattr(payload, k)
        if v is not None and not (1 <= v <= 5):
            raise HTTPException(status_code=400, detail=f"{k} must be 1-5")

    item = {
        "id": len(DAILY_REPORTS) + 1,
        "created_at": datetime.utcnow().isoformat() + "Z",
        "player_id": player_id,
        "body": payload.body,
        "mood": payload.mood,
        "fatigue": payload.fatigue,
        "tags": payload.tags or [],
    }
    DAILY_REPORTS.append(item)
    return item


@app.get("/players/{player_id}/daily-reports/latest")
def latest_daily_report_by_player(player_id: str):
    for r in reversed(DAILY_REPORTS):
        if r.get("player_id") == player_id:
            return r
    return None


@app.get("/coach/daily-reports/recent")
def recent_daily_reports(limit: int = 10):
    # 新しい順に返す
    items = DAILY_REPORTS[-limit:][::-1]
    return {"items": items}

@app.get("/recommendation/latest")
def latest_recommendation():
    latest = latest_evaluation()
    if not latest:
        return {"recommendations": []}
    recs = build_recommendations(latest["values"])
    return {"recommendations": recs}


@app.get("/players/{player_id}/recommendation/latest")
def latest_recommendation_by_player(player_id: str):
    latest = latest_by_player(player_id)
    if not latest:
        return {"recommendations": []}
    recs = build_recommendations(latest["values"])
    return {"recommendations": recs}


# ====== coach dashboard summary ======
@app.get("/coach/summary")
def coach_summary():
    total_players = len(PLAYERS)

    # 最新評価があるplayer_idを数える
    latest_ids = set()
    for ev in reversed(EVALUATIONS):
        pid = ev.get("player_id")
        if pid and pid not in latest_ids:
            latest_ids.add(pid)

    unevaluated = total_players - len(latest_ids)
    recent = EVALUATIONS[-5:][::-1]

    return {
        "total_players": total_players,
        "unevaluated_players": unevaluated,
        "recent_evaluations": recent,
    }
