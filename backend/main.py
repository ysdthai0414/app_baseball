from __future__ import annotations
import os
import certifi
from pathlib import Path
from datetime import date, datetime
from typing import Optional, Generator
from dotenv import load_dotenv
from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from sqlalchemy import create_engine, Column, Integer, Text, Date, DateTime, BigInteger, desc
from sqlalchemy.orm import sessionmaker, declarative_base, Session

# --- 1. 環境設定 ---
BASE_DIR = Path(__file__).resolve().parent
if not os.getenv("WEBSITE_INSTANCE_ID"):
    load_dotenv(BASE_DIR / ".env")

DB_HOST = os.getenv("DB_HOST")
DB_PORT = os.getenv("DB_PORT", "3306")
DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_NAME = os.getenv("DB_NAME")

ca_path = str(BASE_DIR / "azure-ca.pem")
if not os.path.exists(ca_path):
    ca_path = certifi.where()

# --- 2. DB接続 ---
DATABASE_URL = f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    pool_recycle=300,
    connect_args={"ssl": {"ca": ca_path}, "connect_timeout": 5}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- 3. DBモデル定義 (ここをご希望のカラム構成に合わせました) ---
class PracticeLog(Base):
    __tablename__ = "practice_logs"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    child_id = Column(BigInteger, nullable=False, index=True)
    practice_date = Column(Date, nullable=False, index=True)
    content = Column(Text, nullable=True)          # 本文
    ai_feedback = Column(Text, nullable=True)      # ★追加
    coach_comment = Column(Text, nullable=True)    # ★追加
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    practice_type = Column(Text, nullable=False)
    mood = Column(Integer, nullable=True)
    fatigue = Column(Integer, nullable=True)
    today_practice = Column(Text, nullable=True)
    coach_said = Column(Text, nullable=True)
    next_goal = Column(Text, nullable=True)
    free_note = Column(Text, nullable=True)

class Evaluation(Base):
    __tablename__ = "evaluations"
    id = Column(Integer, primary_key=True, autoincrement=True)
    child_id = Column(BigInteger, nullable=False, index=True)
    batting = Column(Integer, nullable=False)
    throwing = Column(Integer, nullable=False)
    catching = Column(Integer, nullable=False)
    running = Column(Integer, nullable=False)
    iq = Column(Integer, nullable=False)
    memo = Column(Text, nullable=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)

class Child(Base):
    __tablename__ = "children"
    id = Column(BigInteger, primary_key=True)
    name = Column(Text, nullable=False)
    grade = Column(Text, nullable=True)

# --- 4. データ型定義 (Pydantic) ---
class PracticeLogCreate(BaseModel):
    child_id: int
    practice_date: str
    practice_type: str
    mood: int = 3
    fatigue: int = 3
    today_practice: str = ""
    free_note: str = ""
    # 以下、省略可能にする（フロントから来ない場合も空文字を入れる）
    content: str = ""
    coach_said: str = ""
    next_goal: str = ""
    ai_feedback: str = ""
    coach_comment: str = ""

class PlayerCreate(BaseModel):
    id: int
    name: str
    grade: str

class EvaluationCreate(BaseModel):
    child_id: int
    values: dict

# --- 5. APIエンドポイント ---
app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)

@app.post("/practice-logs")
def create_log(log: PracticeLogCreate, db: Session = Depends(get_db)):
    try:
        p_date = datetime.strptime(log.practice_date, "%Y-%m-%d").date()
    except:
        p_date = datetime.utcnow().date()

    # コンテンツの自動補完（free_noteがあればそれをcontentにも入れる）
    final_content = log.content if log.content else log.free_note

    row = PracticeLog(
        child_id=log.child_id,
        practice_date=p_date,
        practice_type=log.practice_type,
        mood=log.mood,
        fatigue=log.fatigue,
        today_practice=log.today_practice,
        free_note=log.free_note,
        content=final_content,        # 互換性確保
        coach_said=log.coach_said,
        next_goal=log.next_goal,
        ai_feedback=log.ai_feedback,  # 新項目
        coach_comment=log.coach_comment, # 新項目
        created_at=datetime.utcnow()
    )
    db.add(row)
    db.commit()
    return {"status": "ok"}

@app.get("/practice-logs/latest")
def get_log(child_id: int, practice_type: str = "weekend", db: Session = Depends(get_db)):
    ptype = "team" if practice_type == "weekend" else "individual"
    row = db.query(PracticeLog).filter(PracticeLog.child_id == child_id, PracticeLog.practice_type == ptype).order_by(PracticeLog.practice_date.desc()).first()
    if not row:
        raise HTTPException(status_code=404, detail="Not found")
    return row

# 選手・評価系のAPI（変更なしだが維持）
@app.get("/players")
def list_players(db: Session = Depends(get_db)):
    rows = db.query(Child).order_by(Child.id.asc()).all()
    return [{"id": str(r.id), "name": r.name, "grade": r.grade} for r in rows]

@app.post("/players")
def create_player(p: PlayerCreate, db: Session = Depends(get_db)):
    existing = db.query(Child).filter(Child.id == p.id).first()
    if existing:
        existing.name = p.name
        existing.grade = p.grade
    else:
        db.add(Child(id=p.id, name=p.name, grade=p.grade))
    db.commit()
    return {"status": "ok"}

@app.post("/evaluations")
def create_evaluation(e: EvaluationCreate, db: Session = Depends(get_db)):
    db.add(Evaluation(child_id=e.child_id, batting=e.values.get("batting",1), throwing=e.values.get("throwing",1), catching=e.values.get("catching",1), running=e.values.get("running",1), iq=e.values.get("iq",1)))
    db.commit()
    return {"status": "ok"}

@app.get("/players/{player_id}/evaluations/latest")
def get_latest_evaluation(player_id: str, db: Session = Depends(get_db)):
    try: pid = int(player_id)
    except: return {}
    row = db.query(Evaluation).filter(Evaluation.child_id == pid).order_by(Evaluation.created_at.desc()).first()
    if not row: return {}
    return {"id": row.id, "player_id": str(row.child_id), "values": {"batting": row.batting, "throwing": row.throwing, "catching": row.catching, "running": row.running, "iq": row.iq}}