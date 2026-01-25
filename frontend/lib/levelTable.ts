export type SkillCategory =
  | "batting"
  | "throwing"
  | "catching"
  | "running"
  | "iq";

export type LevelRequirement = {
  level: number;        // 1〜10（10が初級）
  description: string;  // 判定基準
};

export type TrainingMenu = {
  minLevel: number; // inclusive
  maxLevel: number; // inclusive
  title: string;
  items: string[];
};

export const LEVEL_TABLE: Record<SkillCategory, LevelRequirement[]> = {
  batting: [
    { level: 10, description: "正しいグリップで握り、振る前に後ろを見て安全を確認できる。" },
    { level: 9, description: "置きティーを、空振りせずに10球中8球以上打てる。" },
    { level: 8, description: "斜め前からのソフトティーを、バットに当てて前に飛ばせる。" },
    { level: 7, description: "前からの指導者の手投げに対し、三振を怖がらずフルスイングできる。" },
    { level: 6, description: "ロングティーで、打球を内野定位置より遠くへ飛ばせる。" },
    { level: 5, description: "置きティーで、指定された方向に当てられる。" },
    { level: 4, description: "バントで指定方向に5球中3球殺して転がせる。" },
    { level: 3, description: "ロングティーで外野の頭を越える打球を打てる。" },
    { level: 2, description: "速球に振り遅れずセンターへ打ち返せる。" },
    { level: 1, description: "10球中8球以上、芯で捉えた快音の打球を打てる。" },
  ],

  throwing: [
    { level: 10, description: "縫い目に指をかけた正しい握りができる。" },
    { level: 9, description: "3m先に肘を下げずに投げられる。" },
    { level: 8, description: "足を踏み出して投げられる。" },
    { level: 7, description: "10mで胸に5回連続で投げられる。" },
    { level: 6, description: "投げ終わりにバランスよく立てる。" },
    { level: 5, description: "15mを直線的に投げられる。" },
    { level: 4, description: "捕球から1秒以内に投げられる。" },
    { level: 3, description: "25〜30mを低く強く投げられる。" },
    { level: 2, description: "16mで半分以上ストライクに入る。" },
    { level: 1, description: "30m以上をワンバウンドで胸に投げられる。" },
  ],

  catching: [
    { level: 10, description: "正しい構えで目を離さず捕球できる。" },
    { level: 9, description: "手転がしゴロを両手で捕れる。" },
    { level: 8, description: "手投げフライを捕れる。" },
    { level: 7, description: "緩いゴロに正面で入れる。" },
    { level: 6, description: "フライの落下点に先回りできる。" },
    { level: 5, description: "横のゴロを片手で止められる。" },
    { level: 4, description: "速いゴロを体で止められる。" },
    { level: 3, description: "頭上フライを背走で捕れる。" },
    { level: 2, description: "ゲッツー動作ができる。" },
    { level: 1, description: "指示に即反応し捕って投げられる。" },
  ],

  running: [
    { level: 10, description: "打ったら全力で一塁へ走る。" },
    { level: 9, description: "一塁を駆け抜けて戻れる。" },
    { level: 8, description: "ベース角を踏んで回れる。" },
    { level: 7, description: "正しいスライディングができる。" },
    { level: 6, description: "ベース間を目標タイムで走れる。" },
    { level: 5, description: "ゴロGO／フライBACKを判断できる。" },
    { level: 4, description: "コーチ指示に即反応できる。" },
    { level: 3, description: "リードから素早く帰塁できる。" },
    { level: 2, description: "タッグアップができる。" },
    { level: 1, description: "進塁判断を自分でできる。" },
  ],

  iq: [
    { level: 10, description: "挨拶・整理整頓ができる。" },
    { level: 9, description: "自分の道具を管理できる。" },
    { level: 8, description: "BSOと3アウト交代を理解している。" },
    { level: 7, description: "攻守交代で全力移動できる。" },
    { level: 6, description: "守備位置とアウトの取り方を説明できる。" },
    { level: 5, description: "フォースとタッチの違いを説明できる。" },
    { level: 4, description: "審判・道具に礼儀正しく振る舞える。" },
    { level: 3, description: "自発的にベンチワークができる。" },
    { level: 2, description: "難しいルールを理解している。" },
    { level: 1, description: "下級生に教えられる。" },
  ],
};
