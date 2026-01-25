from __future__ import annotations

import os
import json
import certifi
from pathlib import Path
from datetime import date, datetime
from typing import Optional, List, Literal

from dotenv import load_dotenv
from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, field_validator

from sqlalchemy import (
    create_engine,
    Column,
    Integer,
    Text,
    Date,
    DateTime,
    Enum as SAEnum,
    text,
)
from sqlalchemy.exc import OperationalError, ProgrammingError
from sqlalchemy.orm import sessionmaker, declarative_base, Session


# =========================
# Paths / Env
# =========================
BASE_DIR = Path(__file__).resolve().parent


def _get_env(name: str, default: Optional[str] = None) -> Optional[str]:
    v = os.getenv(name, default)
    return v if (v is not None and str(v).strip() != "") else None


# Azure(App Service)では .env を基本使わず、Application settings を使う
# ローカル開発時だけ .env を読む
if not os.getenv("WEBSITE_INSTANCE_ID"):
    load_dotenv(BASE_DIR / ".env")


DB_HOST = _get_env("DB_HOST")
DB_PORT = _get_env("DB_PORT", "3306") or "3306"
DB_USER = _get_env("DB_USER")
DB_PASSWORD = _get_env("DB_PASSWORD")
DB_NAME = _get_env("DB_NAME")

# SSL CA: 指定があればそれを使い、なければ certifi にフォールバック
DB_SSL_CA = _get_env("DB_SSL_CA")  # 任意
ca_path = None
if DB_SSL_CA:
    p = (BASE_DIR / DB_SSL_CA).resolve()
    if p.exists():
        ca_path = str(p)
if ca_path is None:
    ca_path = certifi.where()

# 重要：DBが遅い/死んでてもアプリが巻き込まれて落ちないようにする
connect_args = {
    "ssl": {"ca": ca_path},
    "connect_timeout": 5,  # MySQL接続が長引いても5秒で諦める
}


# =========================
# SQLAlchemy
# =========================
DATABASE_URL = None
if all([DB_HOST, DB_USER, DB_PASSWORD, DB_NAME]):
    DATABASE_URL = f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

engine = None
SessionLocal = None

if DATABASE_URL:
    engine = create_engine(
        DATABASE_URL,
        pool_pre_ping=True,
        pool_recycle=300,
        connect_args=connect_args,
    )
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db() -> Session:
    """
    DB未設定/接続不可でも FastAPI 自体は生かす設計。
    DBが必要なエンドポイントだけ503/500にする。
    """
    if SessionLocal is None:
        raise HTTPException(status_code=503, detail="DB is not configured")
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# =========================
# Models
# =========================
class PracticeLog(Base):
    __tablename__ = "practice_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    child_id = Column(Integer, nullable=False, index=True)

    # DB側 enum('individual','team') 想定
    practice_type = Column(
        SAEnum("individual", "team", name="practice_type_enum"),
        nullable=False,
    )

    practice_date = Column(Date, nullable=False, index=True)

    mood = Column(Integer, nullable=False)
    fatigue = Column(Integer, nullable=False)

    today_practice = Column(Text, nullable=False)
    coach_said = Column(Text, nullable=False)
    next_goal = Column(Text, nullable=False)
    free_note = Column(Text, nullable=True)

    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)


# children：監督画面の選手一覧の土台
# 安全のため、存在が確実な列だけモデル化
class Child(Base):
    __tablename__ = "children"

    id = Column(Integer, primary_key=True)
    name = Column(Text, nullable=False)
    grade = Column(Integer, nullable=True)


# =========================
# Schemas
# =========================
PracticeTypeIn = Literal["weekday", "weekend", "individual", "team"]


class EvaluationValues(BaseModel):
    batting: int = Field(..., ge=1, le=10)
    throwing: int = Field(..., ge=1, le=10)
    catching: int = Field(..., ge=1, le=10)
    running: int = Field(..., ge=1, le=10)
    iq: int = Field(..., ge=1, le=10)


class EvaluationCreate(BaseModel):
    child_id: int = Field(..., ge=1)
    evaluated_at: Optional[datetime] = None
    values: EvaluationValues
    memo: Optional[str] = None


class PracticeLogCreate(BaseModel):
    child_id: int = Field(..., ge=1)
    practice_type: PracticeTypeIn
    practice_date: date
    mood: int = Field(..., ge=1, le=5)
    fatigue: int = Field(..., ge=1, le=5)
    today_practice: str
    coach_said: str
    next_goal: str
    free_note: Optional[str] = None

    @field_validator("practice_type")
    @classmethod
    def _normalize_practice_type(cls, v: str) -> str:
        """
        フロントの weekday/weekend とDB enum individual/team を合わせる
        weekday -> individual
        weekend -> team
        """
        mapping = {
            "weekday": "individual",
            "weekend": "team",
            "individual": "individual",
            "team": "team",
        }
        if v not in mapping:
            raise ValueError("practice_type must be one of: weekday, weekend, individual, team")
        return mapping[v]


class PracticeLogRead(BaseModel):
    id: int
    child_id: int
    practice_type: Literal["individual", "team"]
    practice_date: date
    mood: int
    fatigue: int
    today_practice: str
    coach_said: str
    next_goal: str
    free_note: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


# =========================
# App
# =========================
app = FastAPI(title="app_baseball API", version="1.0.3")

from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    # 🔴 これが一番おすすめ（SWAのURLは毎回変わる）
    allow_origin_regex=r"^https://.*\.azurestaticapps\.net$",

    # ↓ もし個別指定したいならこっち
    # allow_origins=[
    #     "https://mango-stone-057f8b70f2.azurestaticapps.net",
    # ],

    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 開発用。本番は絞るのが理想
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup():
    """
    DB接続チェックはここでは行わない（Azureで落ちる原因になりがち）
    """
    missing = [k for k in ["DB_HOST", "DB_USER", "DB_PASSWORD", "DB_NAME"] if not os.getenv(k)]
    if missing:
        print("Missing DB env vars:", missing)
    else:
        print("DB env vars exist (connection will be checked only when endpoints are called).")


# =========================
# Utility Endpoints
# =========================
@app.get("/")
def root():
    return {"status": "ok"}


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/db/ping")
def db_ping(db: Session = Depends(get_db)):
    try:
        db.execute(text("SELECT 1"))
        return {"db": "ok"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"db ping failed: {e}")


# =========================
# Rubric (任意)
# =========================
RUBRIC_PATH = BASE_DIR / "config" / "skill_rubric.json"


@app.get("/rubric")
def get_rubric():
    if not RUBRIC_PATH.exists():
        return {"rubric": []}
    try:
        return {"rubric": json.loads(RUBRIC_PATH.read_text(encoding="utf-8-sig"))}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"rubric load failed: {e}")


# =========================
# players (監督画面の土台)  ※ children を公開する
# =========================
@app.get("/players")
def list_players(db: Session = Depends(get_db)):
    """
    監督画面用：選手一覧
    フロントは Player = { id: string; name: string; grade?: number; position?: string }
    """
    try:
        rows = db.query(Child).order_by(Child.id.asc()).all()
        return [
            {
                "id": str(r.id),  # フロントは string を期待
                "name": r.name,
                "grade": r.grade,
                "position": None,
            }
            for r in rows
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"players load failed: {e}")


@app.get("/players/{player_id}")
def get_player(player_id: int, db: Session = Depends(get_db)):
    """
    将来用：選手詳細（暫定）
    """
    row = db.execute(
        text("SELECT id, name, grade FROM children WHERE id = :id"),
        {"id": player_id},
    ).mappings().first()
    if not row:
        raise HTTPException(status_code=404, detail="player not found")
    return {
        "player": {
            "id": str(row["id"]),
            "name": row["name"],
            "grade": row.get("grade"),
        }
    }


# =========================
# evaluations (監督の現状評価)
# =========================
@app.get("/players/{player_id}/evaluations/latest")
def get_latest_evaluation(player_id: int, db: Session = Depends(get_db)):
    """
    最新評価を1件返す（未登録→null）
    values: batting/throwing/catching/running/iq の5項目を返す
    """
    try:
        row = db.execute(
            text(
                "SELECT id, child_id, evaluated_at, values_json, memo "
                "FROM evaluations "
                "WHERE child_id = :cid "
                "ORDER BY evaluated_at DESC, id DESC "
                "LIMIT 1"
            ),
            {"cid": player_id},
        ).mappings().first()

        if not row:
            return None

        values = json.loads(row["values_json"] or "{}")

        return {
            "id": row["id"],
            "child_id": row["child_id"],
            "evaluated_at": row["evaluated_at"],
            "values": {
                "batting": values.get("batting"),
                "throwing": values.get("throwing"),
                "catching": values.get("catching"),
                "running": values.get("running"),
                "iq": values.get("iq"),
            },
            "memo": row.get("memo"),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"latest evaluation failed: {e}")



@app.post("/players/{player_id}/evaluations")
def create_player_evaluation(
    player_id: int,
    payload: EvaluationCreate,
    db: Session = Depends(get_db),
):
    """
    監督が現状評価（5項目）を保存する
    """
    if payload.child_id != player_id:
        raise HTTPException(status_code=400, detail="child_id mismatch")

    try:
        values_json = json.dumps(payload.values.model_dump(), ensure_ascii=False)

        db.execute(
            text(
                "INSERT INTO evaluations (child_id, evaluated_at, values_json, memo, created_at) "
                "VALUES (:cid, :evaluated_at, :values_json, :memo, :created_at)"
            ),
            {
                "cid": payload.child_id,
                "evaluated_at": payload.evaluated_at or datetime.utcnow(),
                "values_json": values_json,
                "memo": payload.memo,
                "created_at": datetime.utcnow(),
            },
        )
        db.commit()
        return {"status": "ok"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"create evaluation failed: {e}")


# =========================
# practice_logs (latest)
# =========================
@app.get("/practice-logs/latest")
def get_latest_practice_log(
    child_id: int = Query(...),
    practice_type: str = Query(...),
    db: Session = Depends(get_db),
):
    """
    フロント用：最新の日報を1件返す（未登録→null）
    """
    try:
        row = db.execute(
            text(
                "SELECT * FROM practice_logs "
                "WHERE child_id = :cid AND practice_type = :ptype "
                "ORDER BY practice_date DESC, id DESC LIMIT 1"
            ),
            {"cid": child_id, "ptype": practice_type},
        ).mappings().first()

        return row if row else None
    except Exception as e:
        print("get_latest_practice_log error:", e)
        return None


# =========================
# practice_logs (メイン)
# =========================
@app.post("/practice-logs", response_model=PracticeLogRead)
def create_practice_log(payload: PracticeLogCreate, db: Session = Depends(get_db)):
    try:
        row = PracticeLog(
            child_id=payload.child_id,
            practice_type=payload.practice_type,  # validatorで individual/team に正規化済み
            practice_date=payload.practice_date,
            mood=payload.mood,
            fatigue=payload.fatigue,
            today_practice=payload.today_practice,
            coach_said=payload.coach_said,
            next_goal=payload.next_goal,
            free_note=payload.free_note,
            created_at=datetime.utcnow(),
        )
        db.add(row)
        db.commit()
        db.refresh(row)
        return row
    except (OperationalError, ProgrammingError) as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"db error: {e}")
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"create failed: {e}")


@app.get("/practice-logs", response_model=List[PracticeLogRead])
def list_practice_logs(
    child_id: Optional[int] = Query(None, description="絞り込み: child_id"),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
):
    try:
        q = db.query(PracticeLog)
        if child_id is not None:
            q = q.filter(PracticeLog.child_id == child_id)
        rows = q.order_by(PracticeLog.practice_date.desc(), PracticeLog.id.desc()).limit(limit).all()
        return rows
    except (OperationalError, ProgrammingError) as e:
        raise HTTPException(status_code=500, detail=f"db error: {e}")


# =========================
# coach summary (壊さない用)
# =========================
@app.get("/coach/summary")
def coach_summary(db: Session = Depends(get_db)):
    # ざっくり集計（テーブルが無ければ空）
    try:
        row = db.execute(
            text(
                "SELECT COUNT(*) AS total_reports, MAX(practice_date) AS latest_date "
                "FROM daily_reports"
            )
        ).mappings().first()
        return {"summary": row}
    except Exception:
        return {"summary": {"total_reports": 0, "latest_date": None}}
