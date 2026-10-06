// Tiny synthesized sound effects for the mökki. Muted unless the player has
// turned game sounds on (shared with the betting sounds).
const SOUND_KEY = "kymppijape_sound_enabled";

let ctx: AudioContext | null = null;

function audio(): AudioContext | null {
  if (typeof window === "undefined" || localStorage.getItem(SOUND_KEY) !== "true") return null;
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  ctx = ctx ?? new Ctor();
  return ctx;
}

function knock(ac: AudioContext, at: number) {
  // Low wooden thump
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = "triangle";
  osc.frequency.setValueAtTime(220, at);
  osc.frequency.exponentialRampToValueAtTime(70, at + 0.12);
  gain.gain.setValueAtTime(0.5, at);
  gain.gain.exponentialRampToValueAtTime(0.001, at + 0.16);
  osc.connect(gain).connect(ac.destination);
  osc.start(at);
  osc.stop(at + 0.17);

  // Short noise click for the hammer head
  const buffer = ac.createBuffer(1, Math.floor(ac.sampleRate * 0.04), ac.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
  const noise = ac.createBufferSource();
  noise.buffer = buffer;
  const filter = ac.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = 1800;
  const ng = ac.createGain();
  ng.gain.value = 0.35;
  noise.connect(filter).connect(ng).connect(ac.destination);
  noise.start(at);
}

/** Three hammer knocks: a piece of the mökki is finished. */
export function playHammer() {
  const ac = audio();
  if (!ac) return;
  const now = ac.currentTime + 0.02;
  [0, 0.22, 0.44].forEach((d) => knock(ac, now + d));
}

/** Soft hiss of löyly hitting the kiuas. */
export function playLoyly() {
  const ac = audio();
  if (!ac) return;
  const now = ac.currentTime + 0.02;
  const buffer = ac.createBuffer(1, Math.floor(ac.sampleRate * 1.4), ac.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  const src = ac.createBufferSource();
  src.buffer = buffer;
  const filter = ac.createBiquadFilter();
  filter.type = "highpass";
  filter.frequency.value = 2500;
  const gain = ac.createGain();
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.25, now + 0.08);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.3);
  src.connect(filter).connect(gain).connect(ac.destination);
  src.start(now);
}
