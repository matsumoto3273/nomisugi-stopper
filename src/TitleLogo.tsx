import { StyleSheet, Text, TextStyle, useWindowDimensions, View } from 'react-native';

/** 画面幅に収まる範囲で、できるだけ大きい文字サイズ（chars: 文字数） */
function useFitFontSize(chars: number, max: number) {
  const { width } = useWindowDimensions();
  return Math.min(max, Math.floor((Math.min(width, 480) - 56) / chars));
}

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

/** 終了画面の見出し：丸い極太の書体（M PLUS Rounded 1c）、クリーム白に焦げ茶のフチと影 */
export function HeadingLogo({ text, color = '#FFF3D6' }: { text: string; color?: string }) {
  const fontSize = useFitFontSize(text.length + 0.6, 40);
  return (
    <OutlinedText
      text={text}
      style={{ fontFamily: 'MPLUSRounded1c_900Black', fontSize, color }}
      outline={INK}
      width={3.5}
      shadow={{ color: INK, dy: 4 }}
    />
  );
}

/** 冒頭画面のタイトル：終了画面の見出しと同じ丸い極太の書体（M PLUS Rounded 1c）。「飲みすぎ」黄 ×「ストッパー」赤 */
export function TitleLogo() {
  const fontSize = useFitFontSize(9.6, 44);
  return (
    <OutlinedText
      text="飲みすぎストッパー"
      parts={[
        { text: '飲みすぎ', color: '#FFD23F' },
        { text: 'ストッパー', color: '#E8382F' },
      ]}
      style={{ fontFamily: 'MPLUSRounded1c_900Black', fontSize }}
      outline={INK}
      width={3.5}
      shadow={{ color: INK, dy: 4 }}
    />
  );
}

const styles = StyleSheet.create({
  layer: { position: 'absolute', left: 0, top: 0 },
});
