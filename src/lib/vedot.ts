import { TIERS, type BetType, type PersonalLines, type TierId } from "@/lib/kymppijape";

/** A bet as stored in the `bets` table. */
export interface BetRow {
  id: string;
  bet_type: BetType;
  tier: TierId | null;
  lukitut: boolean;
  max_throws: number;
  stake: number;
  odds: number;
  status: "open" | "won" | "lost" | "void";
  payout: number;
}

export interface PotEntrant {
  userId: string;
  username: string;
}

export interface PotReveal {
  gameDate: string;
  status: "settled" | "refunded";
  total: number;
  winningThrows: number | null;
  prizePerWinner: number;
  entries: { userId: string; username: string; throwsCount: number | null; payout: number; isMe: boolean }[];
}

export interface DailyBoard {
  gameDate: string;
  opening: number[];
  bettingDisabled: boolean;
  tierLines: Record<TierId, number>;
  personal: PersonalLines;
  hasLicense: boolean;
  jackpot: {
    balance: number;
    lastWin: { username: string; amount: number; gameDate: string; throwsCount: number } | null;
  };
  pot: { buyIn: number; total: number; entrants: PotEntrant[]; joined: boolean };
  myBets: BetRow[];
  reveals: PotReveal[];
}

export interface Settlement {
  bets: BetRow[];
  jackpot: number;
  newBalance: number | null;
}

export const BET_TYPE_META: Record<BetType, { name: string; emoji: string; blurb: string }> = {
  nopea: { name: "Quick Finish", emoji: "⚡", blurb: "Finish fast" },
  keskiarvo: { name: "Beat Your Average", emoji: "📉", blurb: "Fewer throws than your average" },
  ennatys: { name: "Record Chase", emoji: "🏅", blurb: "Tie or beat your best" },
};

export function betTitle(bet: Pick<BetRow, "bet_type" | "tier">): string {
  if (bet.bet_type === "nopea") {
    const tier = TIERS.find((t) => t.id === bet.tier);
    return `${tier?.emoji ?? "⚡"} ${tier?.name ?? "Quick Finish"}`;
  }
  const meta = BET_TYPE_META[bet.bet_type];
  return `${meta.emoji} ${meta.name}`;
}

export function betConditions(bet: Pick<BetRow, "max_throws" | "lukitut">): string {
  const parts = [`≤ ${bet.max_throws} throws`];
  if (bet.lukitut) parts.push("🔒 Lukitut nopat");
  return parts.join(" · ");
}

export function formatOdds(odds: number): string {
  return odds >= 10 ? odds.toFixed(0) : odds.toFixed(1);
}

export function potentialWin(stake: number, odds: number): number {
  return Math.min(10000, Math.floor(stake * odds));
}

export type LiveBetStatus = "alive" | "last_chance" | "busted" | "won" | "lost" | "void";

/**
 * Bet status while the game is in progress. A game can still finish on the
 * current throw by locking the showing dice, so a bet is only busted once the
 * throw count passes its line (or the showing dice can't finish it on the line).
 */
export function liveBetStatus(
  bet: BetRow,
  game: { throwCount: number; showing: number[]; complete: boolean; winningNumber: number | null; unlockedAny: boolean },
): LiveBetStatus {
  if (bet.status !== "open") return bet.status;
  const keptLocks = !(bet.lukitut && game.unlockedAny);

  if (game.complete) {
    return game.throwCount <= bet.max_throws && keptLocks ? "won" : "lost";
  }
  if (game.throwCount > bet.max_throws) return "busted";
  if (bet.lukitut && game.unlockedAny) return "busted";
  if (game.throwCount === bet.max_throws) {
    const first = game.showing[0];
    const canFinish = game.showing.length > 0 && game.showing.every((v) => v === first) && keptLocks;
    return canFinish ? "last_chance" : "busted";
  }
  return "alive";
}
