// iOS/Android版の効果音。マナーモード（消音スイッチ）中は鳴らさない。
// Web版は sound.web.ts が使われる（Metro が .web.ts を優先して読み込む）。
import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';

export type SoundName =
  | 'click' | 'start' | 'drink' | 'waterDue' | 'water' | 'locked' | 'undo' | 'limit' | 'over' | 'finishGood' | 'finishOver';

const SOURCES: Record<SoundName, number> = {
  click: require('../assets/sounds/click.wav'),
  start: require('../assets/sounds/start.wav'),
  drink: require('../assets/sounds/drink.wav'),
  waterDue: require('../assets/sounds/waterDue.wav'),
  water: require('../assets/sounds/water.wav'),
  locked: require('../assets/sounds/locked.wav'),
  undo: require('../assets/sounds/undo.wav'),
  limit: require('../assets/sounds/limit.wav'),
  over: require('../assets/sounds/over.wav'),
  finishGood: require('../assets/sounds/finishGood.wav'),
  finishOver: require('../assets/sounds/finishOver.wav'),
};

let players: Partial<Record<SoundName, AudioPlayer>> | null = null;

function init() {
  if (players) return players;
  // playsInSilentMode: false … 消音スイッチがオンなら鳴らない／オフなら鳴る
  // mixWithOthers … 店内BGMや他のアプリの音を止めない
  setAudioModeAsync({ playsInSilentMode: false, interruptionMode: 'mixWithOthers' }).catch(() => {});
  players = {};
  for (const name of Object.keys(SOURCES) as SoundName[]) players[name] = createAudioPlayer(SOURCES[name]);
  return players;
}

export function playSound(name: SoundName) {
  try {
    const p = init()[name];
    if (!p) return;
    p.seekTo(0).catch(() => {});
    p.play();
  } catch {}
}
