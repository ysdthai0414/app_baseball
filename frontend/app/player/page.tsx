"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ?? "http://127.0.0.1:8000";

type Child = { id: string; name: string; };

export default function PlayerSelectPage() {
  const [children, setChildren] = useState<Child[]>([]);
  const router = useRouter();

  useEffect(() => {
    fetch(`${API_BASE}/players`, { cache: "no-store" })
      .then(r => r.ok ? r.json() : [])
      .then(setChildren)
      .catch(console.error);
  }, []);

  return (
    <main style={styles.container}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=M+PLUS+Rounded+1c:wght@400;700;800&display=swap');`}</style>
      
      <div style={styles.navBar}>
        <Link href="/" style={styles.navButton}>🏠 Topへ</Link>
      </div>

      <div style={styles.fadeIn}>
        <h2 style={{...styles.h2, textAlign: "center", marginBottom: 32}}>きみはだれ？</h2>
        <div style={styles.profileGrid}>
          {children.map((child) => (
            <div key={child.id} onClick={() => router.push(`/player/${child.id}`)} style={styles.profileCard}>
              <div style={styles.profileIcon}>{child.name.charAt(0)}</div>
              <div style={styles.profileName}>{child.name}</div>
              <div style={styles.tapHint}>ここをタップ！</div>
            </div>
          ))}
        </div>
        {children.length === 0 && (
          <p style={{textAlign:"center", color:"#666", marginTop:20}}>
            まだ登録がありません。<br/>おとなのひとにいってね。
          </p>
        )}
      </div>
    </main>
  );
}

const styles = {
  container: { padding: "20px", fontFamily: '"M PLUS Rounded 1c", sans-serif', maxWidth: 600, margin: "0 auto", background: "#f0f9ff", minHeight: "100vh", color: "#333" },
  fadeIn: { animation: "fadeIn 0.3s ease-in-out" },
  h2: { fontSize: 18, margin: 0, fontWeight: 800, color: "#1e3a8a" },
  navBar: { display: "flex", justifyContent: "flex-end", marginBottom: 20 },
  navButton: { background: "#fff", border: "1px solid #ddd", borderRadius: 20, padding: "6px 14px", fontSize: 12, fontWeight: "bold", color: "#64748b", textDecoration: "none" },
  profileGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))", gap: 20 },
  profileCard: { display: "flex", flexDirection: "column" as const, alignItems: "center", cursor: "pointer", background: "#fff", padding: 16, borderRadius: 16, boxShadow: "0 2px 4px rgba(0,0,0,0.05)" },
  profileIcon: { width: 80, height: 80, borderRadius: 16, background: "linear-gradient(135deg, #60a5fa, #3b82f6)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, fontWeight: 800, marginBottom: 8, border: "3px solid #fff" },
  profileName: { fontSize: 15, fontWeight: 800, color: "#334155" },
  tapHint: { fontSize: 11, color: "#2563eb", fontWeight: "bold", marginTop: 2 },
};