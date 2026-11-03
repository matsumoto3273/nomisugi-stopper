export const MIN_DRINKS = 1;
export const MAX_DRINKS = 30;
/** 何杯ごとにお水を挟むか */
export const WATER_EVERY = 3;

export type SlotKind = 'drink' | 'water';
export type Slot = { kind: SlotKind; drinkNo?: number };

/** 🍺🍺🍺💧🍺🍺🍺💧… の並びを作る（最後の1杯の後ろには水を置かない） */
export function buildSlots(max: number): Slot[] {
  const slots: Slot[] = [];
  for (let i = 1; i <= max; i++) {
    slots.push({ kind: 'drink', drinkNo: i });
    if (i % WATER_EVERY === 0 && i < max) slots.push({ kind: 'water' });
  }
  return slots;
}

export function countKind(slots: Slot[], filled: number, kind: SlotKind): number {
  return slots.slice(0, filled).filter((s) => s.kind === kind).length;
}

/**
 * 危険度レベル
 * 0: まだ0杯 / 1: 〜20% / 2: 〜40% / 3: 〜60% / 4: 〜80% / 5: 〜100%未満 / 6: 上限到達
 */
export function getLevel(drinks: number, max: number): number {
  if (drinks <= 0) return 0;
  if (drinks >= max) return 6;
  // 浮動小数の誤差を避けるため整数で比較
  if (drinks * 5 <= max * 1) return 1;
  if (drinks * 5 <= max * 2) return 2;
  if (drinks * 5 <= max * 3) return 3;
  if (drinks * 5 <= max * 4) return 4;
  return 5;
}

export const LEVEL_MESSAGES: string[] = [
  '最初の1杯を注文したら、\nジョッキをタップしてください。',
  '飲み会スタートですね。\n楽しんでください。',
  '進んできましたね。\n少しペースを落としましょう。',
  'そろそろ気をつけてください。',
  '危険水域です。\nこの辺でやめておきましょう。',
  '限界が近いです。\n次の1杯で本当に最後にしましょう。',
  '今日の上限に到達しました。\nここで終了しましょう！',
];

export type Theme = { bg: string; accent: string; card: string };

export const LEVEL_THEMES: Theme[] = [
  { bg: '#DFF4FB', accent: '#2196C3', card: '#FFFFFF' }, // 水色
  { bg: '#DFF4FB', accent: '#2196C3', card: '#FFFFFF' }, // 水色
  { bg: '#E3F5D8', accent: '#3E9B3A', card: '#FFFFFF' }, // 薄緑
  { bg: '#FFF4C4', accent: '#D49A00', card: '#FFFFFF' }, // 黄色
  { bg: '#FFDDB8', accent: '#E8701A', card: '#FFFFFF' }, // オレンジ
  { bg: '#FFC9C2', accent: '#D93A2E', card: '#FFFFFF' }, // 赤
  { bg: '#FFB0A6', accent: '#B71C1C', card: '#FFFFFF' }, // 濃い赤
];
