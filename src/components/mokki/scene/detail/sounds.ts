// Little synthesized sounds for the walk-mode toys. Silent when the game's sound is muted.
import { mokkiAudio } from "../../mokkiSound";

function noise(ac: AudioContext, at: number, dur: number, freq: number, gain: number, type: BiquadFilterType = "bandpass", q = 1) {
  const buffer = ac.createBuffer(1, Math.max(1, Math.floor(ac.sampleRate * dur)), ac.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
  const src = ac.createBufferSource();
  src.buffer = buffer;
  const filter = ac.createBiquadFilter();
  filter.type = type;
  filter.frequency.value = freq;
  filter.Q.value = q;
  const g = ac.createGain();
  g.gain.value = gain;
  src.connect(filter).connect(g).connect(ac.destination);
  src.start(at);
}

function tone(ac: AudioContext, at: number, freq: number, dur: number, gain: number, type: OscillatorType = "sine", glideTo?: number) {
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, at);
  if (glideTo) osc.frequency.exponentialRampToValueAtTime(glideTo, at + dur);
  g.gain.setValueAtTime(0.0001, at);
  g.gain.exponentialRampToValueAtTime(gain, at + Math.min(0.02, dur / 4));
  g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  osc.connect(g).connect(ac.destination);
  osc.start(at);
  osc.stop(at + dur + 0.02);
}

const play = (fn: (ac: AudioContext, now: number) => void) => {
  const ac = mokkiAudio();
  if (!ac) return;
  if (ac.state === "suspended") void ac.resume();
  fn(ac, ac.currentTime + 0.02);
};

/** Dice rattling in the hand, then clacking onto the table. */
export const playDiceRoll = (count: number) =>
  play((ac, now) => {
    for (let i = 0; i < count * 2; i++) noise(ac, now + Math.random() * 0.3, 0.03, 2500 + Math.random() * 2500, 0.18, "bandpass", 4);
    for (let i = 0; i < count; i++) noise(ac, now + 0.42 + Math.random() * 0.35, 0.025, 1800 + Math.random() * 1200, 0.3, "bandpass", 3);
  });

/** All ten match: a little fanfare. */
export const playKymppi = () =>
  play((ac, now) => {
    [523, 659, 784, 1047].forEach((f, i) => tone(ac, now + i * 0.11, f, i === 3 ? 0.5 : 0.16, 0.12, "triangle"));
  });

export const playCuckoo = (times = 2) =>
  play((ac, now) => {
    for (let i = 0; i < times; i++) {
      tone(ac, now + i * 0.6, 659, 0.2, 0.18, "sine");
      tone(ac, now + i * 0.6 + 0.24, 523, 0.3, 0.18, "sine");
    }
  });

export const playCreak = () =>
  play((ac, now) => {
    [0, 0.9, 1.8].forEach((d) => {
      tone(ac, now + d, 190, 0.32, 0.035, "sawtooth", 140);
      noise(ac, now + d, 0.3, 600, 0.04, "bandpass", 8);
    });
  });

export const playClick = () =>
  play((ac, now) => {
    noise(ac, now, 0.02, 3500, 0.25, "highpass");
    tone(ac, now, 1200, 0.03, 0.05, "square");
  });

export const playSqueak = () =>
  play((ac, now) => {
    tone(ac, now, 900, 0.12, 0.1, "square", 1400);
    tone(ac, now + 0.13, 1300, 0.16, 0.08, "square", 800);
  });

export const playCrackle = () =>
  play((ac, now) => {
    for (let i = 0; i < 14; i++) noise(ac, now + Math.random() * 0.9, 0.02 + Math.random() * 0.03, 900 + Math.random() * 2500, 0.25, "bandpass", 2);
    noise(ac, now, 1.0, 400, 0.05, "lowpass");
  });

export const playSwish = () =>
  play((ac, now) => {
    [0, 0.28].forEach((d) => noise(ac, now + d, 0.22, 1800, 0.22, "bandpass", 1.5));
  });

export const playSplash = () =>
  play((ac, now) => {
    noise(ac, now, 0.35, 900, 0.18, "lowpass");
    noise(ac, now + 0.05, 0.2, 3000, 0.06, "highpass");
  });

/** A moose's low call. */
export const playMoose = () =>
  play((ac, now) => {
    tone(ac, now, 140, 0.9, 0.08, "sawtooth", 85);
    tone(ac, now, 70, 0.9, 0.06, "triangle", 50);
  });

export const playChime = () =>
  play((ac, now) => {
    [1047, 1319, 1568, 2093].forEach((f, i) => tone(ac, now + i * 0.07, f, 0.5, 0.06, "sine"));
  });

// ---------------------------------------------------------------------------
// Mökkiradio: an original little polka on a loop (melody + oom-pah)
// ---------------------------------------------------------------------------

const midi = (n: number) => 440 * Math.pow(2, (n - 69) / 12);
// [note, length in eighths]; 0 = rest
const MELODY: [number, number][] = [
  [67, 1], [72, 1], [76, 1], [72, 1],
  [79, 2], [76, 2],
  [77, 1], [74, 1], [71, 1], [74, 1],
  [79, 2], [77, 2],
  [76, 1], [79, 1], [84, 1], [79, 1],
  [81, 1], [79, 1], [77, 1], [76, 1],
  [74, 1], [77, 1], [71, 1], [74, 1],
  [72, 2], [0, 2],
];
// Per bar: bass root and the off-beat chord
const BARS: [number, number[]][] = [
  [48, [64, 67, 72]],
  [48, [64, 67, 72]],
  [43, [62, 65, 71]],
  [43, [62, 65, 71]],
  [48, [64, 67, 72]],
  [41, [65, 69, 72]],
  [43, [62, 65, 71]],
  [48, [64, 67, 72]],
];
const EIGHTH = 0.22;

export class RadioPlayer {
  private timer: number | null = null;
  private step = 0;
  private nextAt = 0;

  start() {
    const ac = mokkiAudio();
    if (!ac || this.timer !== null) return false;
    if (ac.state === "suspended") void ac.resume();
    this.step = 0;
    this.nextAt = ac.currentTime + 0.1;
    const notes: { at: number; note: number; len: number }[] = [];
    let t = 0;
    for (const [note, len] of MELODY) {
      notes.push({ at: t, note, len });
      t += len;
    }
    const loopLen = t;
    this.timer = window.setInterval(() => {
      // Schedule a little ahead, one eighth at a time
      while (this.nextAt < ac.currentTime + 0.35) {
        const pos = this.step % loopLen;
        const bar = BARS[Math.floor(pos / 4) % BARS.length];
        const beat = pos % 2;
        if (beat === 0) tone(ac, this.nextAt, midi(bar[0]), EIGHTH * 0.9, 0.07, "triangle");
        else bar[1].forEach((n) => tone(ac, this.nextAt, midi(n), EIGHTH * 0.6, 0.02, "square"));
        const hit = notes.find((n) => n.at === pos);
        if (hit && hit.note) tone(ac, this.nextAt, midi(hit.note), EIGHTH * hit.len * 0.85, 0.05, "square");
        this.step++;
        this.nextAt += EIGHTH;
      }
    }, 90);
    return true;
  }

  stop() {
    if (this.timer !== null) window.clearInterval(this.timer);
    this.timer = null;
  }
}
