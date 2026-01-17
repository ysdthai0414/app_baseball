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
  const current = LEVEL_TABLE[category].find(
    (l) => l.level === currentLevel
  );
  const next = LEVEL_TABLE[category].find(
    (l) => l.level === currentLevel - 1
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* 現在 */}
        <div>
          <div className="text-sm font-semibold">
            {category.toUpperCase()}：{currentLevel}級
          </div>
          <div className="mt-1 text-sm text-neutral-700">
            {current?.description}
          </div>
        </div>

        {/* 次 */}
        {next && (
          <div className="border-t pt-3">
            <div className="text-sm font-semibold">
              次のレベル（{next.level}級）に向けて
            </div>
            <div className="mt-1 text-sm text-neutral-600">
              {next.description}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
