import Svg, { Circle, Ellipse, Path, Rect } from 'react-native-svg';

const INK = '#3B2A20';
const EMPTY_LINE = '#9AA5AB';

type Props = { size?: number; filled: boolean; locked?: boolean; danger?: boolean };

const BEER = { body: '#F6A623', light: '#FFD27A', dark: '#E08A0B', bubble: '#FFE3A3', foam: '#FFFFFF', foamShade: '#F1F1F1' };
/** 上限超過分の赤っぽいジョッキ */
const DANGER = { body: '#E0483B', light: '#F49488', dark: '#B42C22', bubble: '#F8C1B9', foam: '#FFE3DE', foamShade: '#F7C9C2' };

/** 中ジョッキ（ポップでくっきりした輪郭のイラスト） */
export function MugIcon({ size = 56, filled, locked, danger }: Props) {
  const c = danger ? DANGER : BEER;
  if (!filled) {
    return (
      <Svg width={size} height={size} viewBox="0 0 64 64">
        <Path
          d="M44 22 h6 a7 7 0 0 1 7 7 v10 a7 7 0 0 1 -7 7 h-6"
          fill="none"
          stroke={EMPTY_LINE}
          strokeWidth={3.5}
          strokeDasharray="4 4"
          strokeLinecap="round"
        />
        <Rect
          x={10}
          y={12}
          width={34}
          height={44}
          rx={5}
          fill={locked ? '#ECEFF1' : 'rgba(255,255,255,0.75)'}
          stroke={EMPTY_LINE}
          strokeWidth={3.5}
          strokeDasharray="5 4"
        />
        {locked && (
          <Path
            d="M22 34 h10 v9 h-10 z M24 34 v-3 a3 3 0 0 1 6 0 v3"
            fill="none"
            stroke={EMPTY_LINE}
            strokeWidth={2.5}
            strokeLinejoin="round"
          />
        )}
      </Svg>
    );
  }
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      {/* 取っ手 */}
      <Path
        d="M44 22 h6 a7 7 0 0 1 7 7 v10 a7 7 0 0 1 -7 7 h-6"
        fill="none"
        stroke={INK}
        strokeWidth={4}
      />
      <Path
        d="M44 22 h6 a7 7 0 0 1 7 7 v10 a7 7 0 0 1 -7 7 h-6"
        fill="none"
        stroke="#E8F1F4"
        strokeWidth={1.5}
      />
      {/* ビール本体 */}
      <Rect x={10} y={14} width={34} height={42} rx={5} fill={c.body} stroke={INK} strokeWidth={3.5} />
      <Rect x={14} y={22} width={5} height={28} rx={2.5} fill={c.light} />
      <Rect x={36} y={22} width={4} height={30} rx={2} fill={c.dark} />
      {/* 泡のつぶつぶ */}
      <Circle cx={27} cy={42} r={1.8} fill={c.bubble} />
      <Circle cx={31} cy={34} r={1.4} fill={c.bubble} />
      <Circle cx={25} cy={30} r={1.2} fill={c.bubble} />
      {/* 泡 */}
      <Path
        d="M8 18 a6 6 0 0 1 8 -8 a7 7 0 0 1 12 -2 a7 7 0 0 1 12 2 a6 6 0 0 1 6 8 a4 4 0 0 1 -4 4 h-30 a4 4 0 0 1 -4 -4 z"
        fill={c.foam}
        stroke={INK}
        strokeWidth={3.5}
        strokeLinejoin="round"
      />
      <Ellipse cx={18} cy={13} rx={3} ry={1.6} fill={c.foamShade} />
    </Svg>
  );
}

/** コップの水 */
export function WaterIcon({ size = 56, filled }: Props) {
  if (!filled) {
    return (
      <Svg width={size} height={size} viewBox="0 0 64 64">
        <Path
          d="M14 10 h36 l-4 44 a4 4 0 0 1 -4 4 h-20 a4 4 0 0 1 -4 -4 z"
          fill="rgba(255,255,255,0.75)"
          stroke="#6EC6E8"
          strokeWidth={3.5}
          strokeDasharray="5 4"
          strokeLinejoin="round"
        />
        <Path
          d="M32 24 c-5 7 -7 10 -7 13 a7 7 0 0 0 14 0 c0 -3 -2 -6 -7 -13 z"
          fill="#BDE7F7"
        />
      </Svg>
    );
  }
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      {/* 水 */}
      <Path d="M16.5 22 h31 l-3.2 32 a4 4 0 0 1 -4 4 h-17.6 a4 4 0 0 1 -4 -4 z" fill="#5BC0EB" />
      <Path d="M16.5 22 h31 l-0.4 4 h-30.2 z" fill="#9BDCF5" />
      {/* 氷 */}
      <Rect x={22} y={28} width={10} height={10} rx={2} fill="#E6F7FD" stroke="#3A9CC6" strokeWidth={1.5} transform="rotate(-12 27 33)" />
      <Rect x={33} y={36} width={9} height={9} rx={2} fill="#E6F7FD" stroke="#3A9CC6" strokeWidth={1.5} transform="rotate(10 37 40)" />
      {/* コップ */}
      <Path
        d="M14 10 h36 l-4 44 a4 4 0 0 1 -4 4 h-20 a4 4 0 0 1 -4 -4 z"
        fill="rgba(255,255,255,0.15)"
        stroke={INK}
        strokeWidth={3.5}
        strokeLinejoin="round"
      />
      <Rect x={18} y={14} width={4} height={36} rx={2} fill="#FFFFFF" opacity={0.75} />
    </Svg>
  );
}
