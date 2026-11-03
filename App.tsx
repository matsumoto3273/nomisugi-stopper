import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import { MugIcon, WaterIcon } from './src/Icons';
import {
  buildSlots,
  countKind,
  getLevel,
  LEVEL_MESSAGES,
  LEVEL_THEMES,
  MAX_DRINKS,
  MIN_DRINKS,
  WATER_EVERY,
} from './src/logic';

type Phase = 'setup' | 'drinking' | 'done';
type Saved = { phase: Phase; max: number; filled: number };

const STORAGE_KEY = 'nomisugi-stopper/state-v1';
const INK = '#3B2A20';

async function loadState(): Promise<Saved | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as Saved;
    if (s.max >= MIN_DRINKS && s.max <= MAX_DRINKS) return s;
  } catch {}
  return null;
}

function saveState(s: Saved) {
  AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(s)).catch(() => {});
}

export default function App() {
  const [ready, setReady] = useState(false);
  const [state, setState] = useState<Saved>({ phase: 'setup', max: 10, filled: 0 });

  useEffect(() => {
    loadState().then((s) => {
      if (s) setState(s);
      setReady(true);
    });
  }, []);

  useEffect(() => {
    if (ready) saveState(state);
  }, [state, ready]);

  if (!ready) return null;

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      {state.phase === 'setup' && (
        <SetupScreen
          initial={state.max}
          onStart={(max) => setState({ phase: 'drinking', max, filled: 0 })}
        />
      )}
      {state.phase === 'drinking' && (
        <DrinkingScreen
          max={state.max}
          filled={state.filled}
          onChangeFilled={(filled) => setState((s) => ({ ...s, filled }))}
          onFinish={() => setState((s) => ({ ...s, phase: 'done' }))}
        />
      )}
      {state.phase === 'done' && (
        <DoneScreen
          max={state.max}
          filled={state.filled}
          onRestart={() => setState((s) => ({ phase: 'setup', max: s.max, filled: 0 }))}
        />
      )}
    </SafeAreaProvider>
  );
}

/* ───────────── 冒頭：最大飲酒量の申告 ───────────── */

function SetupScreen({ initial, onStart }: { initial: number; onStart: (max: number) => void }) {
  const [max, setMax] = useState(initial);
  const change = (d: number) => setMax((m) => Math.min(MAX_DRINKS, Math.max(MIN_DRINKS, m + d)));

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: LEVEL_THEMES[0].bg }]}>
      <ScrollView contentContainerStyle={styles.setupContent}>
        <View style={styles.logoRow}>
          <MugIcon size={64} filled />
          <WaterIcon size={56} filled />
        </View>
        <Text style={styles.appTitle}>飲みすぎストッパー</Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>本日の最大飲酒量</Text>
          <Text style={styles.cardNote}>
            これ以上飲むと記憶があいまいになる、{'\n'}二日酔いになる…という目安の杯数は？
          </Text>

          <View style={styles.stepper}>
            <RoundButton label="−" onPress={() => change(-1)} disabled={max <= MIN_DRINKS} />
            <View style={styles.bigNumberBox}>
              <Text style={styles.bigNumber}>{max}</Text>
              <Text style={styles.bigUnit}>杯</Text>
            </View>
            <RoundButton label="＋" onPress={() => change(1)} disabled={max >= MAX_DRINKS} />
          </View>

          {[[3, 5, 8, 10], [15, 20]].map((row) => (
            <View key={row[0]} style={styles.chips}>
              {row.map((n) => (
                <Pressable
                  key={n}
                  onPress={() => setMax(n)}
                  style={[styles.chip, n === max && styles.chipActive]}
                >
                  <Text style={[styles.chipText, n === max && styles.chipTextActive]}>{n}杯</Text>
                </Pressable>
              ))}
            </View>
          ))}
          <Text style={styles.cardNote}>
            {WATER_EVERY}杯ごとに、お水を1杯はさみます。
          </Text>
        </View>

        <BigButton label="飲み会スタート！" color={LEVEL_THEMES[0].accent} onPress={() => onStart(max)} />
      </ScrollView>
    </SafeAreaView>
  );
}

/* ───────────── 飲み会中 ───────────── */

function DrinkingScreen({
  max,
  filled,
  onChangeFilled,
  onFinish,
}: {
  max: number;
  filled: number;
  onChangeFilled: (n: number) => void;
  onFinish: () => void;
}) {
  const slots = useMemo(() => buildSlots(max), [max]);
  const drinks = countKind(slots, filled, 'drink');
  const waters = countKind(slots, filled, 'water');
  const level = getLevel(drinks, max);
  const theme = LEVEL_THEMES[level];
  const next = slots[filled];
  const waterPending = next?.kind === 'water';

  const [waterModal, setWaterModal] = useState(false);
  const [finishModal, setFinishModal] = useState(false);

  // 背景色をなめらかに変化させる
  const levelAnim = useRef(new Animated.Value(level)).current;
  useEffect(() => {
    Animated.timing(levelAnim, { toValue: level, duration: 600, useNativeDriver: false }).start();
  }, [level, levelAnim]);
  const bg = levelAnim.interpolate({
    inputRange: LEVEL_THEMES.map((_, i) => i),
    outputRange: LEVEL_THEMES.map((t) => t.bg),
  });

  const tapSlot = (index: number) => {
    if (index < filled) return;
    if (index > filled) {
      // 先に水を飲まないと次のジョッキは埋められない
      if (waterPending) setWaterModal(true);
      return;
    }
    const nextFilled = filled + 1;
    onChangeFilled(nextFilled);
    if (slots[nextFilled]?.kind === 'water') setWaterModal(true);
  };

  const undo = () => {
    if (filled > 0) onChangeFilled(filled - 1);
  };

  return (
    <Animated.View style={[styles.screen, { backgroundColor: bg }]}>
      <SafeAreaView style={{ flex: 1 }}>
        {/* ヘッダー */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>飲みすぎストッパー</Text>
          <View style={styles.counterRow}>
            <Text style={[styles.counterBig, { color: theme.accent }]}>{drinks}</Text>
            <Text style={styles.counterSmall}> / {max} 杯</Text>
            <Text style={styles.counterWater}>　💧 {waters}</Text>
          </View>
        </View>

        {/* 文言 */}
        <View style={[styles.messageCard, { borderColor: theme.accent }]}>
          <Text style={styles.messageText}>
            {waterPending ? 'お水タイムです。\nお水を頼んだらコップをタップ！' : LEVEL_MESSAGES[level]}
          </Text>
        </View>

        {/* ジョッキ一覧 */}
        <ScrollView contentContainerStyle={styles.grid}>
          {slots.map((slot, i) => (
            <SlotButton
              key={i}
              kind={slot.kind}
              label={slot.kind === 'drink' ? `${slot.drinkNo}` : '水'}
              filled={i < filled}
              isNext={i === filled}
              locked={i > filled && waterPending && slot.kind === 'drink'}
              accent={theme.accent}
              onPress={() => tapSlot(i)}
            />
          ))}
        </ScrollView>

        {/* 下部ボタン */}
        <View style={styles.footer}>
          <Pressable
            onPress={undo}
            disabled={filled === 0}
            style={[styles.subButton, filled === 0 && { opacity: 0.4 }]}
          >
            <Text style={styles.subButtonText}>1つ戻す</Text>
          </Pressable>
          <Pressable
            onPress={() => setFinishModal(true)}
            style={[styles.finishButton, { backgroundColor: theme.accent }]}
          >
            <Text style={styles.finishButtonText}>飲み会終了</Text>
          </Pressable>
        </View>
      </SafeAreaView>

      {/* お水アラート */}
      <PopupModal visible={waterModal} onClose={() => setWaterModal(false)}>
        <WaterIcon size={88} filled />
        <Text style={styles.modalTitle}>お水を注文しましょう！</Text>
        <Text style={styles.modalText}>
          {drinks}杯飲みました。{'\n'}お水を1杯頼んで、コップをタップ。{'\n'}
          飲むまで次のお酒はおあずけです。
        </Text>
        <BigButton label="お水を頼む" color="#2196C3" onPress={() => setWaterModal(false)} />
      </PopupModal>

      {/* 終了確認 */}
      <PopupModal visible={finishModal} onClose={() => setFinishModal(false)}>
        <Text style={styles.modalTitle}>飲み会を終了しますか？</Text>
        <Text style={styles.modalText}>今日は {drinks} 杯で終わりにします。</Text>
        <BigButton
          label="終了する"
          color={theme.accent}
          onPress={() => {
            setFinishModal(false);
            onFinish();
          }}
        />
        <Pressable onPress={() => setFinishModal(false)} style={{ padding: 12 }}>
          <Text style={styles.linkText}>まだ続ける</Text>
        </Pressable>
      </PopupModal>
    </Animated.View>
  );
}

function SlotButton({
  kind,
  label,
  filled,
  isNext,
  locked,
  accent,
  onPress,
}: {
  kind: 'drink' | 'water';
  label: string;
  filled: boolean;
  isNext: boolean;
  locked: boolean;
  accent: string;
  onPress: () => void;
}) {
  // 埋まった瞬間にポンッと弾ませる
  const scale = useRef(new Animated.Value(1)).current;
  const prev = useRef(filled);
  useEffect(() => {
    if (filled && !prev.current) {
      scale.setValue(0.6);
      Animated.spring(scale, { toValue: 1, friction: 4, tension: 180, useNativeDriver: true }).start();
    }
    prev.current = filled;
  }, [filled, scale]);

  const Icon = kind === 'drink' ? MugIcon : WaterIcon;
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.slot,
        isNext && { borderColor: kind === 'water' ? '#2196C3' : accent, backgroundColor: '#FFFFFFAA' },
      ]}
    >
      <Animated.View style={{ transform: [{ scale }] }}>
        <Icon size={50} filled={filled} locked={locked} />
      </Animated.View>
      <Text style={[styles.slotLabel, kind === 'water' && { color: '#2196C3' }]}>{label}</Text>
    </Pressable>
  );
}

/* ───────────── 終了 ───────────── */

function DoneScreen({ max, filled, onRestart }: { max: number; filled: number; onRestart: () => void }) {
  const slots = useMemo(() => buildSlots(max), [max]);
  const drinks = countKind(slots, filled, 'drink');
  const waters = countKind(slots, filled, 'water');

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: LEVEL_THEMES[2].bg }]}>
      <ScrollView contentContainerStyle={styles.setupContent}>
        <Text style={styles.doneEmoji}>🎉</Text>
        <Text style={styles.appTitle}>お疲れ様でした</Text>
        <View style={styles.card}>
          <Text style={styles.doneMain}>自分との約束を{'\n'}守れましたね。</Text>
          <View style={styles.doneStats}>
            <View style={styles.doneStat}>
              <MugIcon size={48} filled />
              <Text style={styles.doneStatText}>
                {drinks} <Text style={styles.doneStatUnit}>/ {max} 杯</Text>
              </Text>
            </View>
            <View style={styles.doneStat}>
              <WaterIcon size={48} filled />
              <Text style={styles.doneStatText}>
                {waters} <Text style={styles.doneStatUnit}>杯</Text>
              </Text>
            </View>
          </View>
          <Text style={styles.cardNote}>
            帰ったらお水をもう1杯。{'\n'}気をつけて帰りましょう。
          </Text>
        </View>
        <BigButton label="最初の画面に戻る" color={LEVEL_THEMES[2].accent} onPress={onRestart} />
      </ScrollView>
    </SafeAreaView>
  );
}

/* ───────────── 共通パーツ ───────────── */

function RoundButton({ label, onPress, disabled }: { label: string; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable onPress={onPress} disabled={disabled} style={[styles.roundButton, disabled && { opacity: 0.3 }]}>
      <Text style={styles.roundButtonText}>{label}</Text>
    </Pressable>
  );
}

function BigButton({ label, color, onPress }: { label: string; color: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.bigButton,
        { backgroundColor: color },
        pressed && { transform: [{ translateY: 3 }], shadowOffset: { width: 0, height: 1 } },
      ]}
    >
      <Text style={styles.bigButtonText}>{label}</Text>
    </Pressable>
  );
}

function PopupModal({
  visible,
  onClose,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>{children}</View>
      </View>
    </Modal>
  );
}

/* ───────────── スタイル ───────────── */

const outline = { borderWidth: 3, borderColor: INK };
const popShadow = {
  shadowColor: INK,
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 1,
  shadowRadius: 0,
  elevation: 4,
};

const styles = StyleSheet.create({
  screen: { flex: 1 },
  setupContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    gap: 20,
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
  },
  logoRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 4 },
  appTitle: { fontSize: 30, fontWeight: '900', color: INK, letterSpacing: 1 },
  card: {
    ...outline,
    ...popShadow,
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    gap: 14,
  },
  cardTitle: { fontSize: 20, fontWeight: '900', color: INK },
  cardNote: { fontSize: 14, color: '#5C4B40', textAlign: 'center', lineHeight: 21 },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  bigNumberBox: { flexDirection: 'row', alignItems: 'baseline', minWidth: 110, justifyContent: 'center' },
  bigNumber: { fontSize: 64, fontWeight: '900', color: INK },
  bigUnit: { fontSize: 22, fontWeight: '800', color: INK, marginLeft: 4 },
  roundButton: {
    ...outline,
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#FFF6D6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  roundButtonText: { fontSize: 28, fontWeight: '900', color: INK, lineHeight: 32 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8 },
  chip: {
    borderWidth: 2,
    borderColor: INK,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#FFFFFF',
  },
  chipActive: { backgroundColor: INK },
  chipText: { fontSize: 14, fontWeight: '800', color: INK },
  chipTextActive: { color: '#FFFFFF' },
  bigButton: {
    ...outline,
    ...popShadow,
    width: '100%',
    borderRadius: 999,
    paddingVertical: 16,
    alignItems: 'center',
  },
  bigButtonText: { fontSize: 20, fontWeight: '900', color: '#FFFFFF', letterSpacing: 1 },

  header: { alignItems: 'center', paddingTop: 12, paddingHorizontal: 16 },
  headerTitle: { fontSize: 14, fontWeight: '800', color: '#5C4B40' },
  counterRow: { flexDirection: 'row', alignItems: 'baseline' },
  counterBig: { fontSize: 52, fontWeight: '900' },
  counterSmall: { fontSize: 22, fontWeight: '800', color: INK },
  counterWater: { fontSize: 18, fontWeight: '800', color: '#2196C3' },
  messageCard: {
    ...popShadow,
    marginHorizontal: 16,
    marginTop: 4,
    marginBottom: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 3,
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 12,
    minHeight: 76,
    justifyContent: 'center',
    alignSelf: 'center',
    width: '92%',
    maxWidth: 480,
  },
  messageText: { fontSize: 18, fontWeight: '800', color: INK, textAlign: 'center', lineHeight: 26 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 6,
    padding: 12,
    paddingBottom: 24,
    maxWidth: 480,
    alignSelf: 'center',
  },
  slot: {
    width: 62,
    alignItems: 'center',
    paddingVertical: 4,
    borderRadius: 14,
    borderWidth: 3,
    borderColor: 'transparent',
  },
  slotLabel: { fontSize: 12, fontWeight: '800', color: '#5C4B40' },
  footer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
  },
  subButton: {
    ...outline,
    borderRadius: 999,
    paddingVertical: 14,
    paddingHorizontal: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  subButtonText: { fontSize: 15, fontWeight: '800', color: INK },
  finishButton: {
    ...outline,
    ...popShadow,
    flex: 1,
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: 'center',
  },
  finishButtonText: { fontSize: 18, fontWeight: '900', color: '#FFFFFF' },

  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(30,20,10,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    ...outline,
    ...popShadow,
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 22,
    alignItems: 'center',
    gap: 12,
  },
  modalTitle: { fontSize: 22, fontWeight: '900', color: INK, textAlign: 'center' },
  modalText: { fontSize: 15, color: '#5C4B40', textAlign: 'center', lineHeight: 23 },
  linkText: { fontSize: 15, fontWeight: '800', color: '#5C4B40', textDecorationLine: 'underline' },

  doneEmoji: { fontSize: 56 },
  doneMain: { fontSize: 24, fontWeight: '900', color: INK, textAlign: 'center', lineHeight: 34 },
  doneStats: { flexDirection: 'row', gap: 28 },
  doneStat: { alignItems: 'center' },
  doneStatText: { fontSize: 28, fontWeight: '900', color: INK },
  doneStatUnit: { fontSize: 15, fontWeight: '800' },
});
