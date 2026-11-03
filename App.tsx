import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Modal,
  Pressable,
  ScrollView,
  type ScrollViewInstance,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import { MugIcon, WaterIcon } from './src/Icons';
import { WoodBackground } from './src/WoodBackground';
import { TitleLogo } from './src/TitleLogo';
import { useFonts } from 'expo-font';
import { MPLUSRounded1c_900Black } from '@expo-google-fonts/m-plus-rounded-1c/900Black';

import {
  buildSequence,
  buildSlots,
  countKind,
  getOverMessage,
  getOverTint,
  OVER_ACCENT,
  getLevel,
  getLevelMessage,
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
  // タイトル用フォント。読み込みを待たずに画面を出し、読み込めたら差し替わる
  useFonts({ MPLUSRounded1c_900Black });
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
      <StatusBar style="light" />
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
    <View style={styles.screen}>
      <WoodBackground />
      <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.setupContent}>
        <View style={styles.logoRow}>
          <MugIcon size={64} filled />
          <WaterIcon size={56} filled />
        </View>
        <TitleLogo />

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
    </View>
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
  // 上限までの並び（枠の中に表示する分）
  const slots = useMemo(() => buildSlots(max), [max]);
  // 超過分も含めた並び（超過分はお酒のみ）
  const seq = useMemo(() => buildSequence(max, Math.max(0, filled - slots.length)), [max, filled, slots.length]);
  const drinks = countKind(seq, filled, 'drink');
  const waters = countKind(seq, filled, 'water');
  const over = Math.max(0, drinks - max);
  const level = getLevel(drinks, max);
  const accent = over > 0 ? OVER_ACCENT : LEVEL_THEMES[level].accent;
  const waterPending = seq[filled]?.kind === 'water';
  const reachedLimit = filled >= slots.length;

  // 枠の外に並べる超過分
  const overItems = seq.slice(slots.length, filled).map((slot, k) => ({ slot, index: slots.length + k }));

  const [finishModal, setFinishModal] = useState(false);
  const scrollRef = useRef<ScrollViewInstance>(null);

  const tapSlot = (index: number) => {
    // 埋められるのは次の1つだけ（お水が先なら、お水を埋めるまで次のジョッキには進めない）
    if (index !== filled) return;
    onChangeFilled(filled + 1);
  };

  // 上限を超えて追加する（水ロックなし）
  const addOver = () => onChangeFilled(filled + 1);

  useEffect(() => {
    if (overItems.length > 0) setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
  }, [overItems.length]);

  const undo = () => {
    if (filled > 0) onChangeFilled(filled - 1);
  };

  let message = getLevelMessage(drinks, max);
  if (over > 0) message = getOverMessage(over);
  else if (waterPending) message = 'お水タイムです。\nお水を頼んだらコップをタップ！';

  return (
    <View style={styles.screen}>
      <WoodBackground />
      {over > 0 && <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: getOverTint(over) }]} />}
      <SafeAreaView style={styles.screen}>
        {/* ヘッダー */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>飲みすぎストッパー</Text>
          <View style={[styles.counterRow, styles.board]}>
            <Text style={[styles.counterBig, { color: accent }]}>{drinks}</Text>
            <Text style={styles.counterSmall}> / {max} 杯</Text>
            {over > 0 && <Text style={styles.counterOver}> +{over}</Text>}
            <Text style={styles.counterWater}>　💧 {waters}</Text>
          </View>
        </View>

        {/* 文言 */}
        <View style={[styles.messageCard, { borderColor: accent }, over > 0 && styles.messageCardOver]}>
          <Text style={[styles.messageText, over > 0 && { color: OVER_ACCENT }]}>{message}</Text>
        </View>

        {/* ジョッキ一覧 */}
        <ScrollView ref={scrollRef} contentContainerStyle={styles.gridWrap}>
          <View style={[styles.board, styles.grid]}>
            {slots.map((slot, i) => (
              <SlotButton
                key={i}
                kind={slot.kind}
                label={slot.kind === 'drink' ? `${slot.drinkNo}` : '水'}
                filled={i < filled}
                isNext={i === filled}
                locked={i > filled && waterPending && slot.kind === 'drink'}
                accent={accent}
                onPress={() => tapSlot(i)}
              />
            ))}
          </View>

          {/* 上限超過分（枠の外） */}
          {overItems.length > 0 && (
            <View style={styles.overArea}>
              <Text style={styles.overLabel}>上限オーバー +{over}杯</Text>
              <View style={styles.overGrid}>
                {overItems.map(({ slot, index }) => (
                  <SlotButton
                    key={index}
                    kind={slot.kind}
                    label={slot.kind === 'drink' ? `+${(slot.drinkNo ?? 0) - max}` : '水'}
                    filled={index < filled}
                    isNext={index === filled}
                    locked={false}
                    danger
                    accent={OVER_ACCENT}
                    onPress={() => tapSlot(index)}
                  />
                ))}
              </View>
            </View>
          )}
        </ScrollView>

        {/* 下部ボタン */}
        <View style={styles.footer}>
          <View style={styles.subButtonColumn}>
            {/* 上限到達後だけ、目立たないように「1つ戻す」の上に出す */}
            {reachedLimit && (
              <Pressable onPress={addOver} style={[styles.subButton, styles.addOverButton]}>
                <Text style={[styles.subButtonText, { color: '#FFFFFF' }]}>追加する</Text>
              </Pressable>
            )}
            <Pressable
              onPress={undo}
              disabled={filled === 0}
              style={[styles.subButton, filled === 0 && { opacity: 0.4 }]}
            >
              <Text style={styles.subButtonText}>1つ戻す</Text>
            </Pressable>
          </View>
          <Pressable onPress={() => setFinishModal(true)} style={[styles.finishButton, { backgroundColor: accent }]}>
            <Text style={styles.finishButtonText}>飲み会終了</Text>
          </Pressable>
        </View>
      </SafeAreaView>

      {/* 終了確認 */}
      <PopupModal visible={finishModal} onClose={() => setFinishModal(false)}>
        <Text style={styles.modalTitle}>飲み会を終了しますか？</Text>
        <Text style={styles.modalText}>今日は {drinks} 杯で終わりにします。</Text>
        <BigButton
          label="終了する"
          color={accent}
          onPress={() => {
            setFinishModal(false);
            onFinish();
          }}
        />
        <Pressable onPress={() => setFinishModal(false)} style={{ padding: 12 }}>
          <Text style={styles.linkText}>まだ続ける</Text>
        </Pressable>
      </PopupModal>
    </View>
  );
}

function SlotButton({
  kind,
  label,
  filled,
  isNext,
  locked,
  danger,
  accent,
  onPress,
}: {
  kind: 'drink' | 'water';
  label: string;
  filled: boolean;
  isNext: boolean;
  locked: boolean;
  danger?: boolean;
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
        <Icon size={50} filled={filled} locked={locked} danger={danger} />
      </Animated.View>
      <Text style={[styles.slotLabel, kind === 'water' && { color: '#2196C3' }, danger && styles.slotLabelOver]}>{label}</Text>
    </Pressable>
  );
}

/* ───────────── 終了 ───────────── */

function DoneScreen({ max, filled, onRestart }: { max: number; filled: number; onRestart: () => void }) {
  const seq = useMemo(() => buildSequence(max, Math.max(0, filled - buildSlots(max).length)), [max, filled]);
  const drinks = countKind(seq, filled, 'drink');
  const waters = countKind(seq, filled, 'water');
  const over = Math.max(0, drinks - max);

  return (
    <View style={styles.screen}>
      <WoodBackground />
      <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.setupContent}>
        <Text style={styles.doneEmoji}>{over > 0 ? '🌙' : '🎉'}</Text>
        <Text style={styles.appTitle}>お疲れ様でした</Text>
        <View style={styles.card}>
          {over > 0 ? (
            <View style={{ alignItems: 'center' }}>
              <Text style={styles.doneMain}>
                今日は{'\n'}<Text style={{ color: OVER_ACCENT }}>{over}杯オーバー</Text>でした。
              </Text>
              <Text style={[styles.doneMain, { fontSize: 20 }]} numberOfLines={1}>
                次は約束を守りましょう。
              </Text>
            </View>
          ) : (
            <Text style={styles.doneMain}>自分との約束を{'\n'}守れましたね。</Text>
          )}
          <View style={styles.doneStats}>
            <View style={styles.doneStat}>
              <MugIcon size={48} filled danger={over > 0} />
              <Text style={[styles.doneStatText, over > 0 && { color: OVER_ACCENT }]}>
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
        <BigButton label="最初の画面に戻る" color={over > 0 ? OVER_ACCENT : LEVEL_THEMES[2].accent} onPress={onRestart} />
      </ScrollView>
      </SafeAreaView>
    </View>
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
  appTitle: {
    fontSize: 30,
    fontWeight: '900',
    color: '#FFF8E7',
    letterSpacing: 1,
    textShadowColor: INK,
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 0,
  },
  board: {
    ...outline,
    ...popShadow,
    backgroundColor: '#FFF8E7',
    borderRadius: 18,
  },
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
  headerTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFF8E7',
    marginBottom: 6,
    textShadowColor: INK,
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 0,
  },
  counterRow: { flexDirection: 'row', alignItems: 'baseline', paddingHorizontal: 22, paddingVertical: 2 },
  counterBig: { fontSize: 52, fontWeight: '900' },
  counterSmall: { fontSize: 22, fontWeight: '800', color: INK },
  counterOver: { fontSize: 22, fontWeight: '900', color: OVER_ACCENT },
  counterWater: { fontSize: 18, fontWeight: '800', color: '#2196C3' },
  messageCard: {
    ...popShadow,
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 4,
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
  gridWrap: { padding: 12, paddingBottom: 24 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 6,
    padding: 10,
    width: '100%',
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
  slotLabelOver: {
    color: '#FFE3DE',
    textShadowColor: '#3B2A20',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 0,
  },
  messageCardOver: { backgroundColor: '#FFF0EE' },
  overArea: { width: '100%', maxWidth: 480, alignSelf: 'center', marginTop: 16, alignItems: 'center' },
  overLabel: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFE3DE',
    marginBottom: 6,
    textShadowColor: '#3B2A20',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 0,
  },
  overGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 6,
    padding: 8,
    borderRadius: 18,
    borderWidth: 3,
    borderStyle: 'dashed',
    borderColor: '#E0483B',
    width: '100%',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
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
  subButtonColumn: { gap: 8 },
  addOverButton: { backgroundColor: '#111111' },
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
