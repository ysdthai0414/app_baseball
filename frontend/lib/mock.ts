import { Player, Recommendation, TeamWeekSummary } from "./types";

export const weekSummary: TeamWeekSummary = {
  weekLabel: "今週",
  teamPracticeRate: 68,
  totalMinutes: 1240,
  avgCount: 3.1,
  noLogPlayers: 4,
};

export const players: Player[] = [
  { id: "p1", name: "田中 太郎", grade: "小5", tags: ["記録なし"], weeklyPracticeCount: 0, weeklyMinutes: 0, lastLogDaysAgo: 7 },
  { id: "p2", name: "佐藤 次郎", grade: "小6", tags: ["偏りあり"], weeklyPracticeCount: 1, weeklyMinutes: 10, lastLogDaysAgo: 4 },
  { id: "p3", name: "鈴木 花子", grade: "小4", tags: ["痛み申告"], weeklyPracticeCount: 2, weeklyMinutes: 25, lastLogDaysAgo: 1 },
  { id: "p4", name: "高橋 健", grade: "小6", tags: [], weeklyPracticeCount: 5, weeklyMinutes: 90, lastLogDaysAgo: 0 },
];

export const teamRecs: Recommendation[] = [
  {
    id: "r1",
    title: "ウォームアップに捕球ドリル10分を固定",
    reasonTags: ["家庭練で捕球が不足", "週次傾向"],
    description: "今週は体幹系が多く、捕球反復が少ない。最初にゴロ→捕球→送球の型を10分入れると効果が出やすい。",
  },
  {
    id: "r2",
    title: "投球は連投回避の確認を入れる",
    reasonTags: ["痛み申告あり", "負荷管理"],
    description: "肩肘の違和感申告が出ている選手がいるため、投球量を一段落としてフォーム確認中心に寄せる。",
  },
];
