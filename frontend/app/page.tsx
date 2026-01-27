import Link from "next/link";

export default function Home() {
  return (
    <main style={{ padding: 24, fontFamily: "sans-serif" }}>
      <h1 style={{ fontSize: 24 }}>APP_BASEBALL</h1>
      <ul>
        <li><Link href="/coach">監督ダッシュボード</Link></li>
        <li><Link href="/parent">保護者画面</Link></li>
      </ul>
    </main>
  );
}
