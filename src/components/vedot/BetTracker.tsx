import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { JACKPOT_MAX_THROWS, TIERS } from "@/lib/kymppijape";
import { BET_TYPE_META, formatOdds, liveBetStatus, type BetRow, type LiveBetStatus } from "@/lib/vedot";
import { playSound } from "@/lib/sound";
import type { GameProgress } from "@/components/GameBoard";

interface BetTrackerProps {
  bets: BetRow[];
  inPot: boolean;
  progress: GameProgress;
}

const STATUS_STYLES: Record<LiveBetStatus, string> = {
  alive: "border-[#f7d774]/50 bg-[#2a190d] text-[#f7d774]",
  last_chance: "border-amber-400 bg-amber-500/20 text-amber-200",
  busted: "border-white/10 bg-black/30 text-white/35 line-through",
  won: "border-emerald-400 bg-emerald-500/20 text-emerald-200",
  lost: "border-white/10 bg-black/30 text-white/35 line-through",
  void: "border-white/10 bg-black/30 text-white/50",
};

const shortLabel = (bet: BetRow) => {
  const emoji = bet.bet_type === "nopea" ? TIERS.find((t) => t.id === bet.tier)?.emoji : BET_TYPE_META[bet.bet_type].emoji;
  return `${emoji} ≤${bet.max_throws}${bet.lukitut ? " 🔒" : ""}`;
};

const TrackerChip = ({ label, odds, status }: { label: string; odds?: string; status: LiveBetStatus }) => {
  const previous = useRef(status);

  useEffect(() => {
    if (previous.current === status) return;
    if (status === "busted" || status === "lost") playSound("hiss");
    if (status === "won") playSound("coin");
    previous.current = status;
  }, [status]);

  const dead = status === "busted" || status === "lost";

  return (
    <motion.div
      layout
      className={`relative flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-semibold ${STATUS_STYLES[status]}`}
      animate={
        status === "last_chance"
          ? { scale: [1, 1.08, 1] }
          : dead
          ? { x: [0, -3, 3, -2, 0], rotate: [0, -2, 2, 0] }
          : status === "won"
          ? { scale: [1, 1.15, 1] }
          : {}
      }
      transition={status === "last_chance" ? { duration: 0.8, repeat: Infinity } : { duration: 0.4 }}
    >
      <span>{label}</span>
      {odds && <span className="font-mono opacity-80">×{odds}</span>}
      {/* Steam puff when a bet dies on the sauna stones */}
      <AnimatePresence>
        {dead &&
          [0, 1, 2].map((i) => (
            <motion.span
              key={i}
              aria-hidden="true"
              className="pointer-events-none absolute left-1/2 top-0 h-3 w-3 rounded-full bg-white/50 blur-[2px]"
              initial={{ opacity: 0.8, y: 0, x: (i - 1) * 8, scale: 0.5 }}
              animate={{ opacity: 0, y: -26, scale: 1.8 }}
              transition={{ duration: 1.1, delay: i * 0.12 }}
            />
          ))}
      </AnimatePresence>
    </motion.div>
  );
};

/** Live status of the day's bets above the dice. */
export const BetTracker = ({ bets, inPot, progress }: BetTrackerProps) => {
  if (bets.length === 0 && !inPot) return null;

  const jackpotStatus: LiveBetStatus = progress.complete
    ? progress.throwCount <= JACKPOT_MAX_THROWS ? "won" : "lost"
    : progress.throwCount > JACKPOT_MAX_THROWS ? "busted" : progress.throwCount === JACKPOT_MAX_THROWS ? "last_chance" : "alive";

  return (
    <div className="mb-4 flex flex-wrap justify-center gap-1.5" aria-label="Your bets">
      {bets.map((bet) => (
        <TrackerChip key={bet.id} label={shortLabel(bet)} odds={formatOdds(Number(bet.odds))} status={liveBetStatus(bet, progress)} />
      ))}
      {inPot && <TrackerChip label={progress.complete ? "♨️ Pot · reveal after midnight 🌙" : "♨️ Pot"} status="alive" />}
      <TrackerChip label={`🏆 ≤${JACKPOT_MAX_THROWS}`} status={jackpotStatus} />
    </div>
  );
};
