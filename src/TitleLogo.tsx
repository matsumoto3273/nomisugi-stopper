import { StyleSheet, Text, TextStyle, View } from 'react-native';

const INK = '#3B2A20';

/** 文字を何重にもずらして描き、太いフチ取りにする（Web/iOS 共通で使える方法） */
function OutlinedText({
  text,
  style,
  outline,
  width,
  shadow,
}: {
  text: string;
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
      <Text style={style}>{text}</Text>
    </View>
  );
}

/** 冒頭画面のタイトル（看板ポップ風：黄色の丸文字＋太いフチ＋影） */
export function TitleLogo({ fontFamily = 'MochiyPopOne_400Regular' }: { fontFamily?: string }) {
  return (
    <OutlinedText
      text="飲みすぎストッパー"
      style={{ fontFamily, fontSize: 33, color: '#FFD23F' }}
      outline={INK}
      width={3.5}
      shadow={{ color: INK, dy: 4 }}
    />
  );
}

const styles = StyleSheet.create({
  layer: { position: 'absolute', left: 0, top: 0 },
});
