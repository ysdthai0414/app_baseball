import { LEVEL_TABLE, SkillCategory } from "@/lib/levelTable";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";

type Props = {
  category: SkillCategory;
  currentLevel: number;
  title?: string;
};

export function CurrentLevelCard({
  category,
  currentLevel,
  title = "現在のレベル",
}: Props) {
  const current = LEVEL_TABLE[category].find((l) => l.level === currentLevel);
  const next = LEVEL_TABLE[category].find((l) => l.level === currentLevel - 1);

  return (
    // ✅ 白背景にするなら、ここで text を固定して親の影響を遮断
    <Card className="rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base text-slate-900">{title}</CardTitle>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* 現在 */}
        <div>
          <div className="text-sm font-semibold text-slate-900">
            {category.toUpperCase()}：{currentLevel}級
          </div>
          <div className="mt-1 text-sm text-slate-700">
            {current?.description}
          </div>
        </div>

        {/* 次 */}
        {next && (
          <div className="border-t border-slate-200 pt-3">
            <div className="text-sm font-semibold text-slate-900">
              次のレベル（{next.level}級）に向けて
            </div>
            <div className="mt-1 text-sm text-slate-600">
              {next.description}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
