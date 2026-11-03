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

/**
 * 上限を超えた分も含めた並び。上限までは buildSlots(max) と同じで、
 * 超過分はお酒だけが続く（超過中は水ロックなし）。
 */
export function buildSequence(max: number, overCount: number): Slot[] {
  const slots = buildSlots(max);
  for (let i = 1; i <= overCount; i++) slots.push({ kind: 'drink', drinkNo: max + i });
  return slots;
}

export function countKind(slots: Slot[], filled: number, kind: SlotKind): number {
  return slots.slice(0, filled).filter((s) => s.kind === kind).length;
}

/**
 * 危険度レベル
 * 0: まだ0杯 / 1: 〜20% / 2: 〜40% / 3: 〜60% / 4: 〜80% / 5: 〜100%未満 / 6: 上限到達
 * （各区切りの杯数は四捨五入）
 */
export function getLevel(drinks: number, max: number): number {
  if (drinks <= 0) return 0;
  if (drinks >= max) return 6;
  // 区切りの杯数は四捨五入（例: 上限8杯の20% = 1.6杯 → 2杯目までは段階1）
  // max×k/5 の端数は .2/.4/.6/.8 のどれかなので、ちょうど .5 になることはない
  for (let k = 1; k <= 4; k++) {
    if (drinks <= Math.round((max * k) / 5)) return k;
  }
  return 5;
}

export const LEVEL_MESSAGES: string[] = [
  '飲み会スタートですね。\n楽しんでください。',
  'まだまだ大丈夫です。\nこのペースで楽しみましょう。',
  '進んできましたね。\n少しペースを落としましょう。',
  'そろそろ気をつけてください。',
  '上限が近づいています。\nこの辺でやめておきましょう。',
  '限界が近いです。\n次の1杯で本当に最後にしましょう。',
  '今日の上限に到達しました。\nここで終了しましょう！',
];

/**
 * 杯数に応じた文言（上限超過は除く）。
 * タップは「1杯飲み干したら」なので、drinks は飲み終わった杯数。
 */
export function getLevelMessage(drinks: number, max: number): string {
  return LEVEL_MESSAGES[getLevel(drinks, max)];
}

export type Theme = { accent: string };

export const LEVEL_THEMES: Theme[] = [
  { accent: '#2196C3' }, // 水色
  { accent: '#2196C3' }, // 水色
  { accent: '#3E9B3A' }, // 薄緑
  { accent: '#D49A00' }, // 黄色
  { accent: '#E8701A' }, // オレンジ
  { accent: '#D93A2E' }, // 赤
  { accent: '#B71C1C' }, // 濃い赤
];

/** 上限超過時の文言（+1杯, +2杯, +3杯, +4杯以降） */
export const OVER_MESSAGES: string[] = [
  '大変なことになりますよ？',
  '明日の自分が泣いています',
  '記憶、残ってますか？',
  'もう知りません',
];

export function getOverMessage(over: number): string {
  return OVER_MESSAGES[Math.min(over, OVER_MESSAGES.length) - 1];
}

/** 上限超過中、木目の上に重ねる色（暗い赤 → くすんだ色へ） */
export const OVER_TINTS: string[] = [
  'rgba(130, 10, 10, 0.30)', // +1
  'rgba(110, 10, 15, 0.45)', // +2
  'rgba(80, 25, 30, 0.58)', // +3
  'rgba(45, 35, 40, 0.70)', // +4〜
];

export function getOverTint(over: number): string {
  return OVER_TINTS[Math.min(over, OVER_TINTS.length) - 1];
}

/** 上限超過中の強調色 */
export const OVER_ACCENT = '#8E1B1B';
