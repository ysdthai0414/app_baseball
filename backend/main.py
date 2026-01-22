import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path
import json
from pydantic import BaseModel
from typing import Dict, Any, List, Optional
from datetime import datetime
import mysql.connector
from dotenv import load_dotenv

# .envを読み込む
load_dotenv()

app = FastAPI()

# --- データベース接続設定 ---
def get_db_connection():
    return mysql.connector.connect(
        host=os.getenv("DB_HOST"),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
        database=os.getenv("DB_NAME")
    )

# --- フロントエンドからのアクセス許可 (CORS) ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- データモデルの定義 ---
class PlayerIn(BaseModel):
    name: str
    name_kana: str
    dob: str
    number: str
    throwing: str
    batting: str
    parent_name: str
    email: str

class EvaluationIn(BaseModel):
    player_id: int  # AzureのIDに合わせてintに変更
    values: Dict[str, int]
    comment: Optional[Any] = None

# --- ルブリック(評価基準)の読み込み ---
BASE_DIR = Path(__file__).resolve().parent
RUBRIC_PATH = BASE_DIR / "config" / "skill_rubric.json"

def load_rubric() -> Dict[str, Any]:
    with open(RUBRIC_PATH, "r", encoding="utf-8-sig") as f:
        return json.load(f)

# --- APIエンドポイント ---

@app.get("/health")
def health():
    return {"status": "ok"}

@app.get("/rubric")
def rubric():
    return load_rubric()

# 選手一覧取得 (Azureから取得)
@app.get("/players")
def list_players():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM children")
    players = cursor.fetchall()
    cursor.close()
    conn.close()
    return players

# 選手登録 (Azureへ保存)
@app.post("/players")
def create_player(payload: PlayerIn):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        sql = """
        INSERT INTO children (
            name, name_kana, dob, number, throwing, batting, parent_name, email,
            user_id, current_rank_id, is_setup_completed, 
            hitting_rank_id, throwing_rank_id, catching_rank_id, running_rank_id, iq_rank_id
        )
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        values = (
            payload.name, payload.name_kana, payload.dob, payload.number,
            payload.throwing, payload.batting, payload.parent_name, payload.email,
            1, 1, 1, 1, 1, 1, 1, 1
        )
        cursor.execute(sql, values)
        conn.commit()
        new_id = cursor.lastrowid
        cursor.close()
        conn.close()
        return {"id": new_id, **payload.dict()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# 評価の保存 (Azureのデータを更新)
@app.post("/evaluations")
def create_evaluation(payload: EvaluationIn):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # childrenテーブルの各スキルランクを更新
        sql = """
        UPDATE children 
        SET hitting_rank_id = %s, throwing_rank_id = %s, catching_rank_id = %s, 
            running_rank_id = %s, iq_rank_id = %s
        WHERE id = %s
        """
        v = payload.values
        values = (
            v.get("hitting", 1), v.get("throwing", 1), v.get("catching", 1),
            v.get("running", 1), v.get("iq", 1),
            payload.player_id
        )
        cursor.execute(sql, values)
        conn.commit()
        cursor.close()
        conn.close()
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# コーチ用サマリー (Azureからリアルタイム集計)
@app.get("/coach/summary")
def coach_summary():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # 合計人数を数える
        cursor.execute("SELECT COUNT(*) FROM children")
        total_players = cursor.fetchone()[0]
        
        cursor.close()
        conn.close()

        return {
            "total_players": total_players,
            "unevaluated_players": 0,
            "recent_evaluations": []
        }
    except Exception as e:
        return {"total_players": 0, "error": str(e)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)