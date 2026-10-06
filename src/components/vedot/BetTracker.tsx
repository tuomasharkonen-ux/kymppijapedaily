import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { JACKPOT_MAX_THROWS, TIERS } from "@/lib/kymppijape";
import { BET_TYPE_META, betConditions, betTitle, formatOdds, liveBetStatus, type BetRow, type LiveBetStatus } from "@/lib/vedot";
import { playSound } from "@/lib/sound";
import type { GameProgress } from "@/components/GameBoard";

interface BetTrackerProps {
  bets: BetRow[];
  inPot: boolean;
  progress: GameProgress;
}

// Solid colours with WCAG AA contrast on both the light and the dark game card
const STATUS_STYLES: Record<LiveBetStatus, string> = {
  alive: "border-[#f7d774]/70 bg-[#2a190d] text-[#f7d774]",
  last_chance: "border-amber-600 bg-amber-300 text-amber-950",
  busted: "border-stone-700 bg-stone-600 text-white",
  won: "border-emerald-800 bg-emerald-700 text-white",
  lost: "border-stone-700 bg-stone-600 text-white",
  void: "border-stone-400 bg-stone-200 text-stone-800",
};

const STATUS_ICON: Record<LiveBetStatus, string> = {
  alive: "",
  last_chance: "⏳",
  busted: "✗",
  won: "✓",
  lost: "✗",
  void: "↺",
};

const STATUS_TEXT: Record<LiveBetStatus, string> = {
  alive: "in play",
  last_chance: "last chance on this throw",
  busted: "lost",
  won: "won",
  lost: "lost",
  void: "refunded",
};

const shortLabel = (bet: BetRow) => {
  const emoji = bet.bet_type === "nopea" ? TIERS.find((t) => t.id === bet.tier)?.emoji : BET_TYPE_META[bet.bet_type].emoji;
  return `${emoji} ≤${bet.max_throws}${bet.lukitut ? " 🔒" : ""}`;
};

const TrackerChip = ({ label, spoken, odds, status }: { label: string; spoken: string; odds?: string; status: LiveBetStatus }) => {
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
      role="listitem"
      aria-label={`${spoken}${odds ? `, odds ${odds}` : ""}: ${STATUS_TEXT[status]}`}
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
      {STATUS_ICON[status] && <span aria-hidden="true">{STATUS_ICON[status]}</span>}
      <span aria-hidden="true">{label}</span>
      {odds && <span aria-hidden="true" className="font-mono">×{odds}</span>}
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
    <div className="mb-4 flex flex-wrap justify-center gap-1.5" role="list" aria-label="Your bets">
      {bets.map((bet) => (
        <TrackerChip
          key={bet.id}
          label={shortLabel(bet)}
          spoken={`${betTitle(bet).replace(/^\S+\s/, "")}, ${betConditions(bet)}`}
          odds={formatOdds(Number(bet.odds))}
          status={liveBetStatus(bet, progress)}
        />
      ))}
      {inPot && (
        <TrackerChip
          label={progress.complete ? "♨️ Pot · reveal after midnight 🌙" : "♨️ Pot"}
          spoken={progress.complete ? "Pot of the Day, revealed after midnight" : "Pot of the Day"}
          status="alive"
        />
      )}
      <TrackerChip label={`🏆 ≤${JACKPOT_MAX_THROWS}`} spoken={`Jackpot, ${JACKPOT_MAX_THROWS} throws or fewer`} status={jackpotStatus} />
    </div>
  );
};
