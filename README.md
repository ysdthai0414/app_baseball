# app_baseball

野球チーム向け 成長可視化・日報アプリ（プロト）

## 構成
- backend: FastAPI
- frontend: Next.js (App Router)

## 起動方法

### Backend
cd backend
pip install -r requirements.txt
uvicorn app:app --reload

### Frontend
cd frontend
npm install
npm run dev

## URL
- Player画面: http://localhost:3000/player/1
