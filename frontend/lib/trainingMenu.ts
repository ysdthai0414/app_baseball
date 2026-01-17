import type { SkillCategory } from "./levelTable";

export type TrainingMenu = {
  minLevel: number; // inclusive
  maxLevel: number; // inclusive
  title: string;
  description?: string;
  items: string[];
};

export const TRAINING_MENU: Record<SkillCategory, TrainingMenu[]> = {
  batting: [
    {
      minLevel: 8,
      maxLevel: 10,
      title: "スイングの土台作り",
      items: [
        "鏡の前でポーズ（グリップと構えをチェック、1分×3回）",
        "新聞紙ボール打ち（芯に当てる感覚づくり）",
      ],
    },
    {
      minLevel: 4,
      maxLevel: 7,
      title: "フルスイング・ミート",
      items: [
        "ターゲット素振り（目印に向かって正確に10回）",
        "スローモーション素振り（5秒かけてバット軌道を確認）",
      ],
    },
    {
      minLevel: 1,
      maxLevel: 3,
      title: "長打・スピード対応",
      items: [
        "1分間高速素振り（限界スピードで振り続ける）",
      ],
    },
  ],

  throwing: [
    {
      minLevel: 8,
      maxLevel: 10,
      title: "コントロールと握り",
      items: [
        "『くるくるポン』（縫い目の向きに握り替え、50回）",
        "壁立ちステップ（正しい踏み出しフォーム確認）",
      ],
    },
    {
      minLevel: 4,
      maxLevel: 7,
      title: "正確さ・腕の振り",
      items: [
        "タオルスロー（肘が下がらないフォーム作り）",
        "ターゲットネット（10球狙って投げる）",
      ],
    },
    {
      minLevel: 1,
      maxLevel: 3,
      title: "強肩・投手基礎",
      items: [
        "指先はじき（回転をかける練習、100回）",
      ],
    },
  ],

  catching: [
    {
      minLevel: 8,
      maxLevel: 10,
      title: "反応と基本捕球",
      items: [
        "自分フライ（真上に投げて両手捕球）",
        "おべんとう捕球（両手で押さえる）",
      ],
    },
    {
      minLevel: 4,
      maxLevel: 7,
      title: "フットワーク",
      items: [
        "壁当て（正面捕球・左右移動）",
        "お手玉（手のひら感覚強化）",
      ],
    },
    {
      minLevel: 1,
      maxLevel: 3,
      title: "連携・逆シングル",
      items: [
        "テニスボール捕球（持ち替え反復）",
      ],
    },
  ],

  running: [
    {
      minLevel: 7,
      maxLevel: 10,
      title: "全力とフォーム",
      items: [
        "腕振りダッシュ（10秒×3）",
        "スキップトレーニング",
      ],
    },
    {
      minLevel: 1,
      maxLevel: 6,
      title: "スタートと判断",
      items: [
        "リアクションスタート（3m猛ダッシュ）",
        "シャトルラン（5m往復）",
      ],
    },
  ],

  iq: [
    {
      minLevel: 1,
      maxLevel: 10,
      title: "野球IQ・マナー",
      items: [
        "プロ野球観戦ミッション（ルール解説）",
        "道具みがき（5分）",
        "ルールクイズ（3問）",
      ],
    },
  ],
};

export function getTrainingMenuForLevel(category: SkillCategory, level: number) {
  const menus = TRAINING_MENU[category] ?? [];
  return menus.find((m) => m.minLevel <= level && level <= m.maxLevel) ?? null;
}
