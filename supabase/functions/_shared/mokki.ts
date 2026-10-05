// Shared Mökki rules: piece catalog, build progress, seasons and sun position.
// Imported by edge functions (Deno, with .ts extension) and by the web client
// (via src/lib/mokki.ts). Must stay dependency-free.

export type MokkiPieceId =
  | "huussi"
  | "lipputanko"
  | "marjapensaat"
  | "riippumatto"
  | "puuvaja"
  | "laituri"
  | "soutuvene"
  | "sauna"
  | "grillikota"
  | "palju";

export interface MokkiPieceDef {
  id: MokkiPieceId;
  name: string;
  emoji: string;
  description: string;
  price: number;
  /** Played days needed after purchase before the piece is finished. */
  buildDays: number;
  /** Total games played required before the piece can be bought. */
  minDaysPlayed: number;
  /** Pieces that must be owned first. */
  requires: MokkiPieceId[];
}

export const MOKKI_PIECES: MokkiPieceDef[] = [
  {
    id: "huussi",
    name: "Huussi",
    emoji: "🚽",
    description: "The classic outhouse, heart cut into the door. Every mökki needs one.",
    price: 150,
    buildDays: 1,
    minDaysPlayed: 0,
    requires: [],
  },
  {
    id: "lipputanko",
    name: "Lipputanko",
    emoji: "🇫🇮",
    description: "A tall white flagpole flying the siniristilippu over your island.",
    price: 200,
    buildDays: 1,
    minDaysPlayed: 0,
    requires: [],
  },
  {
    id: "marjapensaat",
    name: "Marjapensaat",
    emoji: "🫐",
    description: "Berry bushes and a little flower bed by the cabin. Mustikka, puolukka, herukka.",
    price: 250,
    buildDays: 1,
    minDaysPlayed: 0,
    requires: [],
  },
  {
    id: "riippumatto",
    name: "Riippumatto",
    emoji: "🌿",
    description: "A striped hammock strung between two birches. Peak mökki relaxation.",
    price: 250,
    buildDays: 1,
    minDaysPlayed: 0,
    requires: [],
  },
  {
    id: "puuvaja",
    name: "Puuvaja",
    emoji: "🪵",
    description: "A woodshed stacked full of birch logs for the sauna stove.",
    price: 300,
    buildDays: 2,
    minDaysPlayed: 0,
    requires: [],
  },
  {
    id: "laituri",
    name: "Laituri",
    emoji: "🛶",
    description: "A wooden dock reaching out into the lake. Perfect for jumping in after löyly.",
    price: 500,
    buildDays: 2,
    minDaysPlayed: 10,
    requires: [],
  },
  {
    id: "soutuvene",
    name: "Soutuvene",
    emoji: "🚣",
    description: "A white wooden rowing boat tied to your laituri, oars ready.",
    price: 450,
    buildDays: 2,
    minDaysPlayed: 10,
    requires: ["laituri"],
  },
  {
    id: "sauna",
    name: "Rantasauna",
    emoji: "🧖",
    description: "A log sauna on the shore with a wood-burning kiuas. The heart of every mökki.",
    price: 700,
    buildDays: 3,
    minDaysPlayed: 0,
    requires: [],
  },
  {
    id: "grillikota",
    name: "Grillikota",
    emoji: "🔥",
    description: "An eight-sided Lappish grill hut with a fire pit in the middle. Makkaraa!",
    price: 800,
    buildDays: 4,
    minDaysPlayed: 30,
    requires: [],
  },
  {
    id: "palju",
    name: "Palju",
    emoji: "♨️",
    description: "A wood-fired hot tub next to the sauna. Steaming even in the dead of winter.",
    price: 900,
    buildDays: 4,
    minDaysPlayed: 30,
    requires: ["sauna"],
  },
];

export function getPieceDef(id: string): MokkiPieceDef | undefined {
  return MOKKI_PIECES.find((p) => p.id === id);
}

export const MOKKI_CATALOG_TOTAL = MOKKI_PIECES.reduce((sum, p) => sum + p.price, 0);

export interface OwnedPieceRecord {
  piece_id: string;
  build_days: number;
  played_days_at_purchase: number;
}

export interface PieceProgress {
  complete: boolean;
  /** Played days still needed; 0 when complete. */
  remainingDays: number;
}

export function pieceProgress(owned: OwnedPieceRecord, totalGamesPlayed: number): PieceProgress {
  const played = Math.max(0, totalGamesPlayed - owned.played_days_at_purchase);
  const remainingDays = Math.max(0, owned.build_days - played);
  return { complete: remainingDays === 0, remainingDays };
}

export type BuyCheck = { ok: true } | { ok: false; reason: string };

export function canBuyPiece(id: string, ownedIds: string[], totalGamesPlayed: number): BuyCheck {
  const def = getPieceDef(id);
  if (!def) return { ok: false, reason: "Unknown piece" };
  if (ownedIds.includes(id)) return { ok: false, reason: "You already own this" };
  const missing = def.requires.filter((r) => !ownedIds.includes(r));
  if (missing.length > 0) {
    const names = missing.map((m) => getPieceDef(m)?.name ?? m).join(", ");
    return { ok: false, reason: `Requires ${names}` };
  }
  if (totalGamesPlayed < def.minDaysPlayed) {
    return { ok: false, reason: `Unlocks after ${def.minDaysPlayed} days played` };
  }
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Seasons & sun (Helsinki)
// ---------------------------------------------------------------------------

export type MokkiSeason = "spring" | "summer" | "autumn" | "winter";

interface HelsinkiParts {
  year: number;
  month: number; // 1-12
  day: number;
  weekday: number; // 0 = Sunday
}

export function helsinkiParts(at: Date): HelsinkiParts {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Europe/Helsinki",
    year: "numeric",
    month: "numeric",
    day: "numeric",
    weekday: "short",
  }).formatToParts(at);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return {
    year: Number(get("year")),
    month: Number(get("month")),
    day: Number(get("day")),
    weekday: weekdays.indexOf(get("weekday")),
  };
}

export function seasonFor(at: Date): MokkiSeason {
  const { month } = helsinkiParts(at);
  if (month === 12 || month <= 3) return "winter";
  if (month <= 5) return "spring";
  if (month <= 8) return "summer";
  return "autumn";
}

/** Juhannusaatto (Friday between June 19–25) and juhannuspäivä (the Saturday after). */
export function isJuhannus(at: Date): boolean {
  const { month, day, weekday } = helsinkiParts(at);
  if (month !== 6) return false;
  if (weekday === 5) return day >= 19 && day <= 25;
  if (weekday === 6) return day >= 20 && day <= 26;
  return false;
}

const HELSINKI_LAT = 60.17;
const HELSINKI_LON = 24.94;

/**
 * Approximate sun position over Helsinki.
 * elevation: degrees above the horizon. azimuth: radians, 0 = south, positive = west.
 */
export function sunPosition(at: Date): { elevation: number; azimuth: number } {
  const rad = Math.PI / 180;
  const start = Date.UTC(at.getUTCFullYear(), 0, 0);
  const dayOfYear = (at.getTime() - start) / 86400000;
  const declination = -23.44 * Math.cos(((2 * Math.PI) / 365) * (dayOfYear + 10)) * rad;
  const utcHours = at.getUTCHours() + at.getUTCMinutes() / 60;
  const solarTime = utcHours + HELSINKI_LON / 15;
  const hourAngle = (solarTime - 12) * 15 * rad;
  const lat = HELSINKI_LAT * rad;
  const sinEl = Math.sin(lat) * Math.sin(declination) + Math.cos(lat) * Math.cos(declination) * Math.cos(hourAngle);
  const elevation = Math.asin(sinEl) / rad;
  const azimuth = Math.atan2(
    Math.sin(hourAngle),
    Math.cos(hourAngle) * Math.sin(lat) - Math.tan(declination) * Math.cos(lat),
  );
  return { elevation, azimuth };
}

/** Northern lights season: dark months, shown on clear-enough nights. */
export function isAuroraSeason(at: Date): boolean {
  const { month } = helsinkiParts(at);
  return month >= 10 || month <= 3;
}
