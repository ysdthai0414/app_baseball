"use client";
import { useState } from "react";
import Link from "next/link";

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: "",
    name_kana: "",
    dob: "",
    number: "",
    throwing: "右",
    batting: "右",
    parent_name: "",
    email: "",
  });

  // 日本の学年計算ロジック（4月1日基準）
  const calculateGrade = (dobString: string) => {
    if (!dobString) return "---";
    const dob = new Date(dobString);
    const today = new Date();
    
    // 現在の年度を判定（4月以降なら今年の年、3月以前なら去年の年）
    const currentFiscalYear = today.getMonth() + 1 >= 4 ? today.getFullYear() : today.getFullYear() - 1;
    
    // 生年月日による年度判定（4/2以降生まれならその年、4/1以前なら前年扱い）
    let birthYear = dob.getFullYear();
    if (dob.getMonth() + 1 < 4 || (dob.getMonth() + 1 === 4 && dob.getDate() === 1)) {
      birthYear--;
    }

    const ageAtStartOfFiscalYear = currentFiscalYear - birthYear;
    const grade = ageAtStartOfFiscalYear - 6; // 小1を1とする

    if (grade <= 0) return "未就学児";
    if (grade <= 6) return `小学${grade}年生`;
    if (grade <= 9) return `中学${grade - 6}年生`;
    return "高校生以上";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("http://localhost:8000/players", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        alert("メンバーの登録に成功しました！");
        // 成功したらフォームを空にする（任意）
      } else {
        alert("登録に失敗しました。サーバーを確認してください。");
      }
    } catch (error) {
      alert("通信エラーが発生しました。");
    }
  };

  return (
    <div style={{ padding: "40px", maxWidth: "600px", margin: "0 auto", fontFamily: "sans-serif" }}>
      <h1 style={{ borderBottom: "2px solid #333", paddingBottom: "10px" }}>新規メンバー登録</h1>
      
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px", marginTop: "20px" }}>
        <div>
          <label style={{ display: "block", fontWeight: "bold" }}>氏名</label>
          <input type="text" required style={{ width: "100%", padding: "8px" }}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
        </div>

        <div>
          <label style={{ display: "block", fontWeight: "bold" }}>ふりがな</label>
          <input type="text" required style={{ width: "100%", padding: "8px" }}
            onChange={(e) => setFormData({ ...formData, name_kana: e.target.value })} />
        </div>

        <div>
          <label style={{ display: "block", fontWeight: "bold" }}>生年月日</label>
          <input type="date" required style={{ width: "100%", padding: "8px" }}
            onChange={(e) => setFormData({ ...formData, dob: e.target.value })} />
          <p style={{ color: "#0066cc", fontSize: "0.9rem", marginTop: "5px" }}>
            判定：<strong>{calculateGrade(formData.dob)}</strong>
          </p>
        </div>

        <div>
          <label style={{ display: "block", fontWeight: "bold" }}>背番号</label>
          <input type="number" required style={{ width: "100%", padding: "8px" }}
            onChange={(e) => setFormData({ ...formData, number: e.target.value })} />
        </div>

        <div style={{ display: "flex", gap: "20px" }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: "block", fontWeight: "bold" }}>投げ方</label>
            <select style={{ width: "100%", padding: "8px" }} onChange={(e) => setFormData({ ...formData, throwing: e.target.value })}>
              <option value="右">右</option>
              <option value="左">左</option>
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ display: "block", fontWeight: "bold" }}>打ち方</label>
            <select style={{ width: "100%", padding: "8px" }} onChange={(e) => setFormData({ ...formData, batting: e.target.value })}>
              <option value="右">右</option>
              <option value="左">左</option>
              <option value="両">両</option>
            </select>
          </div>
        </div>

        <div>
          <label style={{ display: "block", fontWeight: "bold" }}>保護者名</label>
          <input type="text" required style={{ width: "100%", padding: "8px" }}
            onChange={(e) => setFormData({ ...formData, parent_name: e.target.value })} />
        </div>

        <div>
          <label style={{ display: "block", fontWeight: "bold" }}>メールアドレス</label>
          <input type="email" required style={{ width: "100%", padding: "8px" }}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
        </div>

        <button type="submit" style={{
          backgroundColor: "#0070f3", color: "white", padding: "12px", border: "none",
          borderRadius: "5px", fontSize: "1rem", cursor: "pointer", fontWeight: "bold"
        }}>
          メンバーを登録する
        </button>
      </form>

      <div style={{ marginTop: "30px" }}>
        <Link href="/" style={{ color: "#666" }}>← トップページへ戻る</Link>
      </div>
    </div>
  );
}