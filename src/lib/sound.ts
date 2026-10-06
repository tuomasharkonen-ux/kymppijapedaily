// Tiny synthesized sound effects (WebAudio, no audio files). Muted by default.
// The same localStorage key is shared with the Mökki.

const SOUND_KEY = "kymppijape_sound_enabled";

export type SoundName = "coin" | "coins" | "stamp" | "hiss" | "splash" | "flip" | "drumroll" | "fanfare" | "tick";

let ctx: AudioContext | null = null;

export function isSoundEnabled(): boolean {
  try {
    return localStorage.getItem(SOUND_KEY) === "true";
  } catch {
    return false;
  }
}

export function setSoundEnabled(enabled: boolean) {
  try {
    localStorage.setItem(SOUND_KEY, enabled ? "true" : "false");
  } catch {
    // ignore storage errors (private mode)
  }
  if (enabled) getContext();
}

function getContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  ctx ??= new Ctor();
  if (ctx.state === "suspended") ctx.resume().catch(() => {});
  return ctx;
}

function tone(ac: AudioContext, freq: number, start: number, duration: number, type: OscillatorType, volume: number, slideTo?: number) {
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, start + duration);
  gain.gain.setValueAtTime(volume, start);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  osc.connect(gain).connect(ac.destination);
  osc.start(start);
  osc.stop(start + duration + 0.02);
}

function noise(ac: AudioContext, start: number, duration: number, volume: number, filterFreq: number, filterType: BiquadFilterType = "highpass") {
  const buffer = ac.createBuffer(1, Math.ceil(ac.sampleRate * duration), ac.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  const src = ac.createBufferSource();
  src.buffer = buffer;
  const filter = ac.createBiquadFilter();
  filter.type = filterType;
  filter.frequency.value = filterFreq;
  const gain = ac.createGain();
  gain.gain.setValueAtTime(volume, start);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  src.connect(filter).connect(gain).connect(ac.destination);
  src.start(start);
}

export function playSound(name: SoundName) {
  if (!isSoundEnabled()) return;
  const ac = getContext();
  if (!ac) return;
  const t = ac.currentTime;

  switch (name) {
    case "coin":
      tone(ac, 1318, t, 0.08, "square", 0.05);
      tone(ac, 1760, t + 0.07, 0.25, "square", 0.05);
      break;
    case "coins":
      for (let i = 0; i < 6; i++) tone(ac, 1400 + Math.random() * 900, t + i * 0.06, 0.12, "triangle", 0.06);
      break;
    case "stamp":
      tone(ac, 120, t, 0.25, "sine", 0.5, 40);
      noise(ac, t, 0.12, 0.25, 800, "lowpass");
      break;
    case "hiss":
      noise(ac, t, 0.9, 0.18, 3000);
      break;
    case "splash":
      noise(ac, t, 0.35, 0.2, 1200, "bandpass");
      tone(ac, 600, t, 0.15, "sine", 0.08, 200);
      break;
    case "flip":
      noise(ac, t, 0.03, 0.15, 2500);
      break;
    case "tick":
      tone(ac, 2000, t, 0.03, "square", 0.03);
      break;
    case "drumroll":
      for (let i = 0; i < 24; i++) noise(ac, t + i * 0.05, 0.05, 0.08 + i * 0.004, 400, "bandpass");
      break;
    case "fanfare":
      [523, 659, 784, 1046].forEach((f, i) => tone(ac, f, t + i * 0.12, i === 3 ? 0.6 : 0.15, "sawtooth", 0.06));
      break;
  }
}

export function buzz(pattern: number | number[]) {
  try {
    navigator.vibrate?.(pattern);
  } catch {
    // vibration not supported
  }
}
