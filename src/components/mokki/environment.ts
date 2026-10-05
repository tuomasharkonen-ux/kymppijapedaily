import { isAuroraSeason, isJuhannus, seasonFor, sunPosition, type MokkiSeason } from "@/lib/mokki";

export type TimeOfDay = "day" | "golden" | "twilight" | "night";

export interface MokkiEnvironment {
  season: MokkiSeason;
  timeOfDay: TimeOfDay;
  sunElevation: number;
  /** Unit vector towards the sun (scene: +x east, +z south, +y up), clamped to stay readable. */
  sunDirection: [number, number, number];
  sunColor: string;
  sunIntensity: number;
  hemiSky: string;
  hemiGround: string;
  hemiIntensity: number;
  skyTop: string;
  skyBottom: string;
  /** Warm window light, lanterns and stars. */
  lightsOn: boolean;
  stars: boolean;
  aurora: boolean;
  juhannus: boolean;
}

export interface EnvironmentOverrides {
  season?: MokkiSeason;
  /** Force a sun elevation in degrees. */
  elevation?: number;
  juhannus?: boolean;
  aurora?: boolean;
}

interface Stop {
  el: number;
  skyTop: string;
  skyBottom: string;
  sunColor: string;
  sunIntensity: number;
  hemiSky: string;
  hemiIntensity: number;
}

// Sky/light keyframes by sun elevation
const STOPS: Stop[] = [
  { el: -18, skyTop: "#070d24", skyBottom: "#16244a", sunColor: "#8fa6ff", sunIntensity: 0.45, hemiSky: "#41558f", hemiIntensity: 0.55 },
  { el: -9, skyTop: "#14204a", skyBottom: "#3a3f6e", sunColor: "#9db0ff", sunIntensity: 0.5, hemiSky: "#5b6aa3", hemiIntensity: 0.6 },
  { el: -3, skyTop: "#3a4c80", skyBottom: "#e9a7a0", sunColor: "#ffb39a", sunIntensity: 0.7, hemiSky: "#9aa6d6", hemiIntensity: 0.75 },
  { el: 4, skyTop: "#5d8fc4", skyBottom: "#f7c58f", sunColor: "#ffb36b", sunIntensity: 1.5, hemiSky: "#c3d3ea", hemiIntensity: 0.85 },
  { el: 14, skyTop: "#5ea6dc", skyBottom: "#d6ecf7", sunColor: "#fff0d6", sunIntensity: 2.3, hemiSky: "#d8e8f6", hemiIntensity: 1.0 },
  { el: 60, skyTop: "#4f9fdc", skyBottom: "#d4ecf8", sunColor: "#fff8ec", sunIntensity: 2.6, hemiSky: "#e4f0fa", hemiIntensity: 1.05 },
];

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function mixHex(a: string, b: string, t: number): string {
  const [ar, ag, ab] = hexToRgb(a);
  const [br, bg, bb] = hexToRgb(b);
  const c = (x: number, y: number) => Math.round(x + (y - x) * t).toString(16).padStart(2, "0");
  return `#${c(ar, br)}${c(ag, bg)}${c(ab, bb)}`;
}

function sample(el: number) {
  if (el <= STOPS[0].el) return STOPS[0];
  if (el >= STOPS[STOPS.length - 1].el) return STOPS[STOPS.length - 1];
  const i = STOPS.findIndex((s) => s.el > el);
  const a = STOPS[i - 1];
  const b = STOPS[i];
  const t = (el - a.el) / (b.el - a.el);
  return {
    el,
    skyTop: mixHex(a.skyTop, b.skyTop, t),
    skyBottom: mixHex(a.skyBottom, b.skyBottom, t),
    sunColor: mixHex(a.sunColor, b.sunColor, t),
    sunIntensity: a.sunIntensity + (b.sunIntensity - a.sunIntensity) * t,
    hemiSky: mixHex(a.hemiSky, b.hemiSky, t),
    hemiIntensity: a.hemiIntensity + (b.hemiIntensity - a.hemiIntensity) * t,
  };
}

export function computeEnvironment(at: Date = new Date(), overrides: EnvironmentOverrides = {}): MokkiEnvironment {
  const season = overrides.season ?? seasonFor(at);
  const sun = sunPosition(at);
  const elevation = overrides.elevation ?? sun.elevation;
  const s = sample(elevation);

  const timeOfDay: TimeOfDay =
    elevation < -8 ? "night" : elevation < 0 ? "twilight" : elevation < 12 ? "golden" : "day";

  // Light direction: real sun during the day, a fixed high "moon" at night.
  // Clamped so the diorama never goes completely flat or black.
  let dir: [number, number, number];
  if (elevation < -2) {
    dir = [-0.45, 0.75, 0.5];
  } else {
    const el = Math.max(18, Math.min(65, elevation)) * (Math.PI / 180);
    // Keep the sun roughly in front of the camera (south-ish) so lit faces show
    const az = Math.max(-1.1, Math.min(1.1, sun.azimuth));
    dir = [-Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el)];
  }

  const winterTint = season === "winter" ? 0.25 : 0;
  const lightsOn = elevation < 2;
  const night = timeOfDay === "night";

  return {
    season,
    timeOfDay,
    sunElevation: elevation,
    sunDirection: dir,
    sunColor: s.sunColor,
    sunIntensity: s.sunIntensity,
    hemiSky: winterTint ? mixHex(s.hemiSky, "#e8f0f8", winterTint) : s.hemiSky,
    hemiGround: night ? "#1c2033" : season === "winter" ? "#c7ced6" : "#5a5238",
    hemiIntensity: s.hemiIntensity,
    skyTop: winterTint && !night ? mixHex(s.skyTop, "#a9c4dc", winterTint) : s.skyTop,
    skyBottom: winterTint && !night ? mixHex(s.skyBottom, "#eef3f7", winterTint) : s.skyBottom,
    lightsOn,
    stars: night,
    aurora: overrides.aurora ?? (night && isAuroraSeason(at)),
    juhannus: overrides.juhannus ?? isJuhannus(at),
  };
}
