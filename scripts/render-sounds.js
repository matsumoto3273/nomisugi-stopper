// src/soundSpec.json から iOS版用の wav を作る： node scripts/render-sounds.js
const fs = require('fs');
const path = require('path');
const spec = require('../src/soundSpec.json');
const RATE = 44100;
const wave = (w, ph) =>
  w === 'triangle' ? 2 / Math.PI * Math.asin(Math.sin(ph)) : w === 'square' ? Math.sign(Math.sin(ph)) * 0.6 : Math.sin(ph);
for (const [name, tones] of Object.entries(spec)) {
  if (name.startsWith('_')) continue;
  const len = Math.ceil((Math.max(...tones.map((t) => t.t + t.d)) + 0.02) * RATE);
  const buf = new Float32Array(len);
  for (const t of tones) {
    let ph = 0;
    const n = Math.round(t.d * RATE), s0 = Math.round(t.t * RATE);
    for (let i = 0; i < n; i++) {
      const x = i / n;
      const f = t.to ? t.f * Math.pow(t.to / t.f, x) : t.f; // 周波数を指数的に変化
      ph += (2 * Math.PI * f) / RATE;
      const env = Math.min(1, i / (0.005 * RATE)) * Math.pow(1 - x, 2); // すっと立ち上がり、なめらかに消える
      buf[s0 + i] += wave(t.w, ph) * t.v * env;
    }
  }
  const pcm = Buffer.alloc(44 + len * 2);
  pcm.write('RIFF', 0); pcm.writeUInt32LE(36 + len * 2, 4); pcm.write('WAVE', 8); pcm.write('fmt ', 12);
  pcm.writeUInt32LE(16, 16); pcm.writeUInt16LE(1, 20); pcm.writeUInt16LE(1, 22); pcm.writeUInt32LE(RATE, 24);
  pcm.writeUInt32LE(RATE * 2, 28); pcm.writeUInt16LE(2, 32); pcm.writeUInt16LE(16, 34); pcm.write('data', 36); pcm.writeUInt32LE(len * 2, 40);
  for (let i = 0; i < len; i++) pcm.writeInt16LE(Math.round(Math.max(-1, Math.min(1, buf[i])) * 32767), 44 + i * 2);
  fs.writeFileSync(path.join(__dirname, '..', 'assets', 'sounds', `${name}.wav`), pcm);
}
console.log('rendered', Object.keys(spec).filter((k) => !k.startsWith('_')).length, 'sounds');
