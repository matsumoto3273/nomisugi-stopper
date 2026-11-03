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

export function TitleLogo({ variant }: { variant: number }) {
  const title = '飲みすぎストッパー';
  switch (variant) {
    case 1: // 看板ポップ
      return (
        <OutlinedText
          text={title}
          style={{ fontFamily: 'MochiyPopOne_400Regular', fontSize: 33, color: '#FFD23F' }}
          outline={INK}
          width={3.5}
          shadow={{ color: INK, dy: 4 }}
        />
      );
    case 2: // 提灯レッド
      return (
        <OutlinedText
          text={title}
          style={{ fontFamily: 'DelaGothicOne_400Regular', fontSize: 33, color: '#E8382F' }}
          outline="#FFF3D6"
          width={3.5}
          shadow={{ color: INK, dy: 4 }}
        />
      );
    case 3: // 暖簾
      return (
        <View style={styles.noren}>
          <Text style={{ fontFamily: 'ReggaeOne_400Regular', fontSize: 31, color: '#FFFFFF' }}>{title}</Text>
        </View>
      );
    case 4: // 立体
      return (
        <OutlinedText
          text={title}
          style={{ fontFamily: 'RampartOne_400Regular', fontSize: 35, color: '#FFF3D6' }}
          outline={INK}
          width={2}
          shadow={{ color: '#E8382F', dy: 4 }}
        />
      );
    case 5: // 黒板
      return (
        <View style={styles.boardFrame}>
          <View style={styles.chalkboard}>
            <Text style={{ fontFamily: 'YuseiMagic_400Regular', fontSize: 32, color: '#FFFFFF' }}>
              飲みすぎ<Text style={{ color: '#FFD23F' }}>ストッパー</Text>
            </Text>
          </View>
        </View>
      );
    default:
      return null;
  }
}

const styles = StyleSheet.create({
  layer: { position: 'absolute', left: 0, top: 0 },
  noren: {
    backgroundColor: '#A8231C',
    borderWidth: 3,
    borderColor: INK,
    borderRadius: 6,
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 14,
    shadowColor: INK,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  boardFrame: {
    backgroundColor: '#7A4A22',
    borderWidth: 3,
    borderColor: INK,
    borderRadius: 10,
    padding: 6,
    shadowColor: INK,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  chalkboard: { backgroundColor: '#2F4A3A', borderRadius: 4, paddingHorizontal: 16, paddingVertical: 10 },
});
