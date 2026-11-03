import { StyleSheet, Text, TextStyle, View } from 'react-native';

const INK = '#3B2A20';

/** 文字を何重にもずらして描き、太いフチ取りにする（Web/iOS 共通で使える方法） */
function OutlinedText({
  text,
  parts,
  style,
  outline,
  width,
  shadow,
}: {
  text: string;
  /** 文字の一部だけ色を変えたいとき（例: 飲みすぎ=黄, ストッパー=赤） */
  parts?: { text: string; color: string }[];
  style: TextStyle;
  outline: string;
  width: number;
  shadow?: { color: string; dy: number };
}) {
  const offsets: [number, number][] = [];
  const steps = 16;
  for (let i = 0; i < steps; i++) {
    const a = (i / steps) * Math.PI * 2;
    offsets.push([Math.cos(a) * width, Math.sin(a) * width]);
  }
  return (
    <View>
      {shadow &&
        offsets.map(([x, y], i) => (
          <Text
            key={`s${i}`}
            style={[style, styles.layer, { color: shadow.color, transform: [{ translateX: x }, { translateY: y + shadow.dy }] }]}
          >
            {text}
          </Text>
        ))}
      {offsets.map(([x, y], i) => (
        <Text key={`o${i}`} style={[style, styles.layer, { color: outline, transform: [{ translateX: x }, { translateY: y }] }]}>
          {text}
        </Text>
      ))}
      <Text style={style}>
        {parts ? parts.map((p) => <Text key={p.text} style={{ color: p.color }}>{p.text}</Text>) : text}
      </Text>
    </View>
  );
}

const YELLOW = '#FFD23F';
const RED = '#E8382F';
const CREAM = '#FFF3D6';
const WHITE = '#FFFFFF';
const ORANGE = '#FF9F1C';
const BLUE = '#5BC0EB';

type ColorSet = { first: string; second: string; outline: string; shadow: string };
export const TITLE_COLOR_SETS: ColorSet[] = [
  { first: YELLOW, second: YELLOW, outline: INK, shadow: INK }, // 1 黄色
  { first: WHITE, second: WHITE, outline: INK, shadow: RED }, // 2 白＋赤い影
  { first: RED, second: RED, outline: CREAM, shadow: INK }, // 3 赤＋クリームのフチ
  { first: ORANGE, second: ORANGE, outline: INK, shadow: INK }, // 4 ビール色
  { first: YELLOW, second: RED, outline: INK, shadow: INK }, // 5 黄×赤
  { first: WHITE, second: BLUE, outline: INK, shadow: INK }, // 6 白×水色
  { first: CREAM, second: YELLOW, outline: '#8B2A1E', shadow: INK }, // 7 クリーム×黄（えんじのフチ）
  { first: RED, second: YELLOW, outline: INK, shadow: INK }, // 8 赤×黄
];

/** 冒頭画面のタイトル（看板ポップ風：太い丸文字＋太いフチ＋影） */
export function TitleLogo({ fontFamily = 'MPLUSRounded1c_900Black', colorSet = 0 }: { fontFamily?: string; colorSet?: number }) {
  const c = TITLE_COLOR_SETS[colorSet] ?? TITLE_COLOR_SETS[0];
  return (
    <OutlinedText
      text="飲みすぎストッパー"
      parts={[
        { text: '飲みすぎ', color: c.first },
        { text: 'ストッパー', color: c.second },
      ]}
      style={{ fontFamily, fontSize: 33, color: c.first }}
      outline={c.outline}
      width={3.5}
      shadow={{ color: c.shadow, dy: 4 }}
    />
  );
}

const styles = StyleSheet.create({
  layer: { position: 'absolute', left: 0, top: 0 },
});
