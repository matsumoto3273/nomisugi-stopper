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

/** 終了画面の見出しなど：冒頭のタイトルと同じ書体・フチ・影（黄色） */
export function HeadingLogo({ text, fontSize = 30 }: { text: string; fontSize?: number }) {
  return (
    <OutlinedText
      text={text}
      style={{ fontFamily: 'MPLUSRounded1c_900Black', fontSize, color: '#FFD23F' }}
      outline={INK}
      width={3.5}
      shadow={{ color: INK, dy: 4 }}
    />
  );
}

/** 冒頭画面のタイトル：太い丸文字に焦げ茶のフチと影。「飲みすぎ」黄 ×「ストッパー」赤 */
export function TitleLogo() {
  return (
    <OutlinedText
      text="飲みすぎストッパー"
      parts={[
        { text: '飲みすぎ', color: '#FFD23F' },
        { text: 'ストッパー', color: '#E8382F' },
      ]}
      style={{ fontFamily: 'MPLUSRounded1c_900Black', fontSize: 33 }}
      outline={INK}
      width={3.5}
      shadow={{ color: INK, dy: 4 }}
    />
  );
}

const styles = StyleSheet.create({
  layer: { position: 'absolute', left: 0, top: 0 },
});
