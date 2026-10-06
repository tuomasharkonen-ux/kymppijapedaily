// Shared Kymppijape rules: game day, opening dice, bet pricing and settlement.
// Imported by edge functions (Deno, with .ts extension) and by the web client
// (via src/lib/kymppijape.ts). Must stay dependency-free.

export const DICE_COUNT = 10;

// Economy
export const RETURN_TO_PLAYER = 0.88;
export const MIN_ODDS = 1.05;
export const MAX_ODDS = 100;
export const MAX_BETS_PER_DAY = 3;
export const MIN_STAKE = 10;
export const MAX_TOTAL_STAKE = 300;
export const MAX_PAYOUT_PER_BET = 10000;
export const LUKITUT_MULTIPLIER = 1.1;
export const PERSONAL_BETS_MIN_GAMES = 5;
export const POT_BUY_IN = 50;
export const JACKPOT_MAX_THROWS = 5;

// Shop features
export const BETTING_LICENSE_ID = "betting_license";
export const MOKKI_PLOT_ID = "mokki_plot";

// ---------------------------------------------------------------------------
// Game day (Europe/Helsinki)
// ---------------------------------------------------------------------------

/** YYYY-MM-DD of the given instant in Finnish time. */
export function helsinkiDate(at: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Helsinki",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(at);
}

/** Add whole days to a YYYY-MM-DD string. */
export function shiftDate(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

// ---------------------------------------------------------------------------
// Opening dice: same for every player on a given day, later throws are random
// ---------------------------------------------------------------------------

// Seeded random number generator using mulberry32 algorithm
export function seededRandom(seed: string): () => number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }

  return function () {
    let t = hash += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

export function getOpeningDice(gameDate: string): number[] {
  const rng = seededRandom(`kymppijape_${gameDate}`);
  return Array.from({ length: DICE_COUNT }, () => Math.floor(rng() * 6) + 1);
}

/** counts[face] for face 1..6 (index 0 unused). */
export function countFaces(dice: number[]): number[] {
  const counts = [0, 0, 0, 0, 0, 0, 0];
  for (const v of dice) counts[v]++;
  return counts;
}

export function bestCount(opening: number[]): number {
  return Math.max(...countFaces(opening).slice(1));
}

// ---------------------------------------------------------------------------
// Pricing
// ---------------------------------------------------------------------------

/**
 * Probability of finishing within `n` total throws (opening included) when
 * chasing a number that has `k` dice in the opening and locking every hit.
 * Each remaining die independently needs a geometric(1/6) number of re-rolls,
 * so P(T <= n) = (1 - (5/6)^(n-1))^(10-k).
 */
export function probFinishWithin(n: number, k: number): number {
  if (k >= DICE_COUNT) return n >= 1 ? 1 : 0;
  if (n <= 1) return 0;
  return Math.pow(1 - Math.pow(5 / 6, n - 1), DICE_COUNT - k);
}

export type TierId = "varma" | "rohkea" | "hullu";

export const TIERS: { id: TierId; name: string; emoji: string; tagline: string; target: number }[] = [
  { id: "varma", name: "Safe", emoji: "🙂", tagline: "~50% chance", target: 0.5 },
  { id: "rohkea", name: "Bold", emoji: "😬", tagline: "~20% chance", target: 0.2 },
  { id: "hullu", name: "Crazy", emoji: "🤯", tagline: "~5% chance", target: 0.05 },
];

/** Max-throws line for each Quick Finish tier, chosen so the tier lands near its target chance. */
export function computeTierLines(opening: number[]): Record<TierId, number> {
  const k = bestCount(opening);
  const lineFor = (target: number) => {
    let best = 2;
    let bestDiff = Infinity;
    for (let n = 2; n <= 80; n++) {
      const diff = Math.abs(probFinishWithin(n, k) - target);
      if (diff < bestDiff) {
        best = n;
        bestDiff = diff;
      }
    }
    return best;
  };
  const varma = Math.max(4, lineFor(0.5));
  const rohkea = Math.max(3, Math.min(lineFor(0.2), varma - 1));
  const hullu = Math.max(2, Math.min(lineFor(0.05), rohkea - 1));
  return { varma, rohkea, hullu };
}

/** Betting makes no sense when the opening is already a Kymppijape. */
export function isBettingDisabled(opening: number[]): boolean {
  return bestCount(opening) >= DICE_COUNT;
}

export function oddsForProbability(p: number, multiplier = 1): number {
  if (p <= 0) return MAX_ODDS;
  const raw = (RETURN_TO_PLAYER / p) * multiplier;
  return Math.round(Math.min(MAX_ODDS, Math.max(MIN_ODDS, raw)) * 100) / 100;
}

export type BetType = "nopea" | "keskiarvo" | "ennatys";

export interface BetSpec {
  type: BetType;
  tier?: TierId;
  /** Lukitut nopat: locked dice can never be unlocked. */
  lukitut?: boolean;
  stake: number;
}

export interface PricedBet {
  type: BetType;
  tier: TierId | null;
  lukitut: boolean;
  stake: number;
  maxThrows: number;
  probability: number;
  odds: number;
}

/** Max-throws lines for the personal bets; null when not available. */
export interface PersonalLines {
  keskiarvo: number | null;
  ennatys: number | null;
}

/** Personal lines from previous games (today's game excluded). */
export function computePersonalLines(previousThrows: number[]): PersonalLines {
  if (previousThrows.length < PERSONAL_BETS_MIN_GAMES) {
    return { keskiarvo: null, ennatys: null };
  }
  const avg = previousThrows.reduce((a, b) => a + b, 0) / previousThrows.length;
  // Beat the average = strictly fewer throws than the average
  const keskiarvo = Math.ceil(avg) - 1;
  // Record Chase = tie or beat the personal best
  const ennatys = Math.min(...previousThrows);
  return {
    keskiarvo: keskiarvo >= 2 ? keskiarvo : null,
    ennatys: ennatys >= 2 ? ennatys : null,
  };
}

export type PriceResult = { ok: true; bet: PricedBet } | { ok: false; error: string };

export function priceBet(spec: BetSpec, opening: number[], personal: PersonalLines): PriceResult {
  const kBest = bestCount(opening);
  const lukitut = !!spec.lukitut;
  const multiplier = lukitut ? LUKITUT_MULTIPLIER : 1;

  if (!Number.isInteger(spec.stake) || spec.stake < MIN_STAKE) {
    return { ok: false, error: `Minimum stake is ${MIN_STAKE}` };
  }

  if (spec.type === "nopea") {
    const tier = TIERS.find((t) => t.id === spec.tier);
    if (!tier) return { ok: false, error: "Unknown tier" };
    const maxThrows = computeTierLines(opening)[tier.id];
    const p = probFinishWithin(maxThrows, kBest);
    return {
      ok: true,
      bet: { type: "nopea", tier: tier.id, lukitut, stake: spec.stake, maxThrows, probability: p, odds: oddsForProbability(p, multiplier) },
    };
  }

  if (spec.type === "keskiarvo" || spec.type === "ennatys") {
    const maxThrows = personal[spec.type];
    if (maxThrows === null) return { ok: false, error: "Personal bets unlock after 5 games" };
    const p = probFinishWithin(maxThrows, kBest);
    return {
      ok: true,
      bet: { type: spec.type, tier: null, lukitut, stake: spec.stake, maxThrows, probability: p, odds: oddsForProbability(p, multiplier) },
    };
  }

  return { ok: false, error: "Unknown bet type" };
}

export type SlipResult = { ok: true; bets: PricedBet[] } | { ok: false; error: string };

export function priceSlip(specs: BetSpec[], opening: number[], personal: PersonalLines): SlipResult {
  if (isBettingDisabled(opening)) return { ok: false, error: "No betting on a perfect opening" };
  if (specs.length > MAX_BETS_PER_DAY) return { ok: false, error: `At most ${MAX_BETS_PER_DAY} bets per day` };
  const bets: PricedBet[] = [];
  for (const spec of specs) {
    const priced = priceBet(spec, opening, personal);
    if (priced.ok === false) return { ok: false, error: priced.error };
    bets.push(priced.bet);
  }
  const total = bets.reduce((a, b) => a + b.stake, 0);
  if (total > MAX_TOTAL_STAKE) return { ok: false, error: `Total stake is limited to ${MAX_TOTAL_STAKE}` };
  return { ok: true, bets };
}

// ---------------------------------------------------------------------------
// Settlement
// ---------------------------------------------------------------------------

export interface GameOutcome {
  throws: number;
  winningNumber: number;
  unlockedAny: boolean;
}

export function betWins(
  bet: { maxThrows: number; lukitut: boolean },
  outcome: GameOutcome,
): boolean {
  if (outcome.throws > bet.maxThrows) return false;
  if (bet.lukitut && outcome.unlockedAny) return false;
  return true;
}

export function betPayout(stake: number, odds: number): number {
  return Math.min(MAX_PAYOUT_PER_BET, Math.floor(stake * odds));
}

/**
 * Light sanity check for a client-reported game: one entry per throw, the first
 * entry is the day's opening and the last entry is the Kymppijape.
 * Not cheat-proof by design.
 */
export function isThrowLogConsistent(
  log: unknown,
  opening: number[],
  throws: number,
  winningNumber: number,
): boolean {
  if (!Array.isArray(log) || log.length !== throws || throws < 1) return false;
  for (const entry of log) {
    if (!Array.isArray(entry) || entry.length !== DICE_COUNT) return false;
    if (!entry.every((v) => Number.isInteger(v) && v >= 1 && v <= 6)) return false;
  }
  if (!opening.every((v, i) => log[0][i] === v)) return false;
  return (log[log.length - 1] as number[]).every((v) => v === winningNumber);
}

export function isJackpotThrowCount(throws: number): boolean {
  return throws >= 1 && throws <= JACKPOT_MAX_THROWS;
}
