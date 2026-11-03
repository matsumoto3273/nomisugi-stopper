import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Ellipse, Path, Rect } from 'react-native-svg';

const PLANK_HEIGHT = 76;
const PLANK_COLORS = ['#B97E49', '#C48B55', '#AE7240', '#BF8550'];
const GRAIN = '#7E4D26';
const SEAM = '#5E3819';

/** 毎回同じ木目になるよう、固定シードの乱数を使う */
function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/** 居酒屋のカウンター／壁のような横張りの木目 */
export function WoodBackground() {
  const [size, setSize] = useState({ w: 0, h: 0 });

  const planks = useMemo(() => {
    const rand = seeded(42);
    const count = Math.ceil(size.h / PLANK_HEIGHT);
    return Array.from({ length: count }, (_, i) => {
      const top = i * PLANK_HEIGHT;
      const grains = Array.from({ length: 5 }, (_, g) => {
        const baseY = top + 10 + g * 13 + rand() * 6;
        const amp = 1.5 + rand() * 3;
        const period = 50 + rand() * 80;
        const phase = rand() * Math.PI * 2;
        let d = `M0 ${baseY.toFixed(1)}`;
        for (let x = 20; x <= size.w + 20; x += 20) {
          d += ` L${x} ${(baseY + amp * Math.sin(x / period + phase)).toFixed(1)}`;
        }
        return { d, width: 1 + rand() * 1.5, opacity: 0.18 + rand() * 0.2 };
      });
      const knot =
        rand() < 0.45
          ? { cx: rand() * size.w, cy: top + 20 + rand() * (PLANK_HEIGHT - 40), rx: 9 + rand() * 8 }
          : null;
      return { top, color: PLANK_COLORS[i % PLANK_COLORS.length], grains, knot };
    });
  }, [size]);

  return (
    <View
      style={[StyleSheet.absoluteFill, { backgroundColor: PLANK_COLORS[0] }]}
      onLayout={(e) => setSize({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}
      pointerEvents="none"
    >
      {size.w > 0 && (
        <Svg width={size.w} height={size.h}>
          {planks.map((p, i) => (
            <Rect key={`p${i}`} x={0} y={p.top} width={size.w} height={PLANK_HEIGHT} fill={p.color} />
          ))}
          {planks.map((p, i) =>
            p.grains.map((g, j) => (
              <Path
                key={`g${i}-${j}`}
                d={g.d}
                stroke={GRAIN}
                strokeWidth={g.width}
                strokeOpacity={g.opacity}
                fill="none"
              />
            )),
          )}
          {planks.map((p, i) =>
            p.knot ? (
              <Ellipse
                key={`k${i}`}
                cx={p.knot.cx}
                cy={p.knot.cy}
                rx={p.knot.rx}
                ry={p.knot.rx * 0.45}
                fill={GRAIN}
                fillOpacity={0.25}
                stroke={GRAIN}
                strokeOpacity={0.35}
                strokeWidth={1.5}
              />
            ) : null,
          )}
          {planks.map((p, i) => (
            <Rect key={`s${i}`} x={0} y={p.top + PLANK_HEIGHT - 3} width={size.w} height={3} fill={SEAM} opacity={0.55} />
          ))}
          {planks.map((p, i) => (
            <Rect key={`h${i}`} x={0} y={p.top} width={size.w} height={1.5} fill="#FFFFFF" opacity={0.18} />
          ))}
        </Svg>
      )}
    </View>
  );
}
