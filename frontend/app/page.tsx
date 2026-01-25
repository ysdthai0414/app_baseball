"use client";

import Link from "next/link";

export default function HomePage() {
  return (
    <main className="relative min-h-screen w-full flex flex-col items-center justify-center overflow-hidden font-['M_PLUS_Rounded_1c'] bg-gradient-to-b from-[#7dd3fc] via-[#bae6fd] to-[#e0f2fe]">
      
      {/* 🌟 背景アニメーション：流れる雲 */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="cloud-1 absolute top-[15%] left-[-10%] w-32 h-12 bg-white/60 blur-xl rounded-full animate-cloud" />
        <div className="cloud-2 absolute top-[40%] right-[-10%] w-48 h-16 bg-white/70 blur-xl rounded-full animate-cloud-slow" />
        <div className="cloud-3 absolute bottom-[20%] left-[-15%] w-64 h-20 bg-white/50 blur-xl rounded-full animate-cloud-reverse" />
        
        {/* 🌟 浮かぶ野球アイテム */}
        <div className="absolute top-[20%] right-[15%] text-6xl animate-bounce-slow opacity-80">⚾️</div>
        <div className="absolute bottom-[25%] left-[10%] text-7xl animate-bounce-slower opacity-70">🧢</div>
      </div>

      {/* 🌟 メインコンテンツ */}
      <div className="relative z-10 w-[90%] max-w-md bg-white/80 backdrop-blur-md p-10 rounded-[48px] shadow-2xl shadow-blue-200 text-center border border-white/50">
        <div className="mb-6">
          <span className="inline-block text-7xl mb-4 animate-float">🏟️</span>
          <h1 className="text-4xl font-black text-blue-900 tracking-tighter">コレプラ</h1>
          <p className="text-sm font-bold text-slate-500 mt-2">未来のスターを育てる野球ノート</p>
        </div>

        <div className="space-y-4 mt-8">
          {/* 1. 選手・保護者はこちらへ */}
          <Link href="/parent" className="group flex items-center justify-between w-full p-6 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white rounded-[24px] shadow-lg shadow-blue-200 transition-all active:scale-95">
            <div className="flex items-center gap-4">
              <span className="text-3xl">👪</span>
              <div className="text-left">
                <div className="text-lg font-black">選手・保護者</div>
                <div className="text-[10px] opacity-80 font-bold">日報を書く・記録を見る</div>
              </div>
            </div>
            <span className="text-2xl group-hover:translate-x-2 transition-transform">👉</span>
          </Link>

          <div className="py-2 flex items-center gap-4">
            <div className="h-[1px] flex-1 bg-slate-200" />
            <span className="text-[10px] text-slate-400 font-bold">チーム運営</span>
            <div className="h-[1px] flex-1 bg-slate-200" />
          </div>

          {/* 2. 監督用ボタン */}
          <Link href="/coach" className="flex items-center justify-center w-full p-4 border-2 border-blue-100 bg-white hover:bg-blue-50 text-blue-600 rounded-[20px] transition-all active:scale-95 font-black text-sm">
            👨‍🏫 監督・コーチ用ページ
          </Link>
        </div>

        <p className="mt-8 text-[10px] text-slate-400 font-bold tracking-widest uppercase">
          © 2026 Core-Pra Baseball App
        </p>
      </div>

      {/* 🌟 CSSアニメーション */}
      <style jsx>{`
        @keyframes cloud {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100vw); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-15px); }
        }
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0) rotate(0); }
          50% { transform: translateY(-20px) rotate(10deg); }
        }
        .animate-cloud { animation: cloud 40s linear infinite; }
        .animate-cloud-slow { animation: cloud 60s linear infinite; }
        .animate-cloud-reverse { animation: cloud 50s linear infinite reverse; }
        .animate-float { animation: float 3s ease-in-out infinite; }
        .animate-bounce-slow { animation: bounce-slow 4s ease-in-out infinite; }
        .animate-bounce-slower { animation: bounce-slow 6s ease-in-out infinite; }
      `}</style>
    </main>
  );
}