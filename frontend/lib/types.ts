export type Player = {
  id: string;
  name: string;
  grade?: string;
  tags?: string[];
  weeklyPracticeCount: number;
  weeklyMinutes: number;
  lastLogDaysAgo: number;
};

export type TeamWeekSummary = {
  weekLabel: string;
  teamPracticeRate: number;
  totalMinutes: number;
  avgCount: number;
  noLogPlayers: number;
};

export type Recommendation = {
  id: string;
  title: string;
  reasonTags: string[];
  description: string;
};
