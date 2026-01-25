from __future__ import annotations

import os
import json
import certifi
from pathlib import Path
from datetime import date, datetime
from typing import Optional, List, Literal, Generator, Any

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
# 1. Paths / Env (環境設定)
# =========================
BASE_DIR = Path(__file__).resolve().parent

def _get_env(name: str, default: Optional[str] = None) -> Optional[str]:
    v = os.getenv(name, default)
    return v if (v is not None and str(v).strip() != "") else None

if not os.getenv("WEBSITE_INSTANCE_ID"):
    load_dotenv(BASE_DIR / ".env")

DB_HOST = _get_env("DB_HOST")
DB_PORT = _get_env("DB_PORT", "3306") or "3306"
DB_USER = _get_env("DB_USER")
DB_PASSWORD = _get_env("DB_PASSWORD")
DB_NAME = _get_env("DB_NAME")

# SSL設定: azure-ca.pem があれば優先的に使う
ca_path = str(BASE_DIR / "azure-ca.pem")
if not os.path.exists(ca_path):
    ca_path = certifi.where()

connect_args = {
    "ssl": {"ca": ca_path},
    "connect_timeout": 5,
}

# =========================
# 2. SQLAlchemy (DB接続)
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

def get_db() -> Generator[Session, None, None]:
    if SessionLocal is None:
        raise HTTPException(status_code=503, detail="DB is not configured")
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# =========================
# 3. Models (DBテーブル定義)
# =========================
class PracticeLog(Base):
    __tablename__ = "practice_logs"
    id = Column(Integer, primary_key=True, autoincrement=True)
    child_id = Column(Integer, nullable=False, index=True)
    practice_type = Column(SAEnum("individual", "team", name="practice_type_enum"), nullable=False)
    practice_date = Column(Date, nullable=False, index=True)
    mood = Column(Integer, nullable=True) # NULLを許容
    fatigue = Column(Integer, nullable=True)
    today_practice = Column(Text, nullable=True)
    coach_said = Column(Text, nullable=True)
    next_goal = Column(Text, nullable=True)
    free_note = Column(Text, nullable=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)

class Child(Base):
    __tablename__ = "children"
    id = Column(Integer, primary_key=True)
    name = Column(Text, nullable=False)
    grade = Column(Integer, nullable=True)


# =========================
# 4. Schemas (Pydantic / バリデーション)
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

# 🌟 POST用（登録時）のスキーマ
class PracticeLogCreate(BaseModel):
    child_id: int = Field(..., ge=1)
    practice_type: PracticeTypeIn
    practice_date: date
    mood: Optional[int] = Field(None, ge=1, le=5)
    fatigue: Optional[int] = Field(None, ge=1, le=5)
    today_practice: str
    coach_said: str
    next_goal: str
    free_note: Optional[str] = None

    @field_validator("practice_type")
    @classmethod
    def _normalize_practice_type(cls, v: str) -> str:
        mapping = {"weekday": "individual", "weekend": "team", "individual": "individual", "team": "team"}
        if v not in mapping:
            raise ValueError("practice_type invalid")
        return mapping[v]

# 🌟 GET用（読み取り時）のスキーマ。不完全なデータも許容。
class PracticeLogRead(BaseModel):
    id: int
    child_id: int
    practice_type: Literal["individual", "team"]
    practice_date: date
    mood: Optional[int] = None
    fatigue: Optional[int] = None
    today_practice: Optional[str] = None
    coach_said: Optional[str] = None
    next_goal: Optional[str] = None
    free_note: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


# =========================
# 5. App Setup & Endpoints
# =========================
app = FastAPI(title="app_baseball API", version="1.0.4")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"status": "ok"}

@app.get("/db/ping")
def db_ping(db: Session = Depends(get_db)):
    try:
        db.execute(text("SELECT 1"))
        return {"db": "ok"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"db ping failed: {e}")

@app.get("/players")
def list_players(db: Session = Depends(get_db)):
    rows = db.query(Child).order_by(Child.id.asc()).all()
    return [{"id": str(r.id), "name": r.name, "grade": r.grade, "position": None} for r in rows]

@app.get("/practice-logs", response_model=List[PracticeLogRead])
def list_practice_logs(
    child_id: Optional[int] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
):
    try:
        q = db.query(PracticeLog)
        if child_id is not None:
            q = q.filter(PracticeLog.child_id == child_id)
        return q.order_by(PracticeLog.practice_date.desc(), PracticeLog.id.desc()).limit(limit).all()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"db error: {e}")

@app.post("/practice-logs", response_model=PracticeLogRead)
def create_practice_log(payload: PracticeLogCreate, db: Session = Depends(get_db)):
    try:
        row = PracticeLog(
            child_id=payload.child_id,
            practice_type=payload.practice_type,
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
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"create failed: {e}")

# (他、必要なエンドポイントがあればここに追加)