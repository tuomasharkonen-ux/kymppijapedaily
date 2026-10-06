import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Coins, Lock, X } from "lucide-react";
import {
  type BetSpec,
  type BetType,
  MAX_BETS_PER_DAY,
  MAX_TOTAL_STAKE,
  MIN_STAKE,
  type PersonalLines,
  priceBet,
  TIERS,
  type TierId,
} from "@/lib/kymppijape";
import { BET_TYPE_META, formatOdds, potentialWin, type PotEntrant } from "@/lib/vedot";
import { playSound } from "@/lib/sound";
import { SplitFlap } from "./SplitFlap";
import { Kiulu } from "./Kiulu";
import { JackpotMeter } from "./JackpotMeter";
import { Chip, StakeChips } from "./StakeChips";
import { SoundToggle } from "./SoundToggle";

export interface BettingSheetProps {
  opening: number[];
  personal: PersonalLines | null;
  balance: number;
  jackpot: number;
  pot: { buyIn: number; total: number; entrants: PotEntrant[] };
  isPlacing: boolean;
  onLockIn: (bets: BetSpec[], joinPot: boolean) => void;
  onSkip: () => void;
}

type Selection = { type: "nopea"; tier: TierId } | { type: Exclude<BetType, "nopea"> };

const sectionTitle = "text-[11px] font-semibold uppercase tracking-[0.18em] text-[#f7d774]/80";

export const BettingSheet = ({ opening, personal, balance, jackpot, pot, isPlacing, onLockIn, onSkip }: BettingSheetProps) => {
  const [joinPot, setJoinPot] = useState(false);
  const [dropKey, setDropKey] = useState(0);
  const [selection, setSelection] = useState<Selection>({ type: "nopea", tier: "rohkea" });
  const [lukitut, setLukitut] = useState(false);
  const [stake, setStake] = useState(0);
  const [slip, setSlip] = useState<BetSpec[]>([]);

  const personalLines: PersonalLines = personal ?? { keskiarvo: null, ennatys: null };

  const slipStake = slip.reduce((a, b) => a + b.stake, 0);
  const buyIn = joinPot ? pot.buyIn : 0;
  const stakeRoom = Math.max(0, Math.min(MAX_TOTAL_STAKE - slipStake, balance - slipStake - buyIn));

  const currentSpec: BetSpec = {
    type: selection.type,
    tier: selection.type === "nopea" ? selection.tier : undefined,
    lukitut,
    stake: Math.max(stake, MIN_STAKE),
  };
  const currentPrice = priceBet(currentSpec, opening, personalLines);

  const tierPrices = TIERS.map((tier) => ({
    tier,
    price: priceBet({ type: "nopea", tier: tier.id, lukitut, stake: MIN_STAKE }, opening, personalLines),
  }));

  // Lukitut nopat is chosen for the whole slip
  const slipWithLukitut = slip.map((spec) => ({ ...spec, lukitut }));
  const pricedSlip = slipWithLukitut.map((spec) => priceBet(spec, opening, personalLines));
  const maxWin = pricedSlip.reduce((sum, p) => sum + (p.ok ? potentialWin(p.bet.stake, p.bet.odds) : 0), 0);
  const canAdd = slip.length < MAX_BETS_PER_DAY && stake >= MIN_STAKE && stake <= stakeRoom && currentPrice.ok;
  const totalCost = slipStake + buyIn;

  const addToSlip = () => {
    if (!canAdd) return;
    playSound("coins");
    setSlip((s) => [...s, currentSpec]);
    setStake(0);
  };

  const togglePot = () => {
    if (!joinPot && balance - slipStake < pot.buyIn) return;
    if (!joinPot) {
      setDropKey((k) => k + 1);
      setTimeout(() => playSound("splash"), 450);
      playSound("coin");
    }
    setJoinPot(!joinPot);
  };

  return (
    <motion.div
      className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-lg"
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      transition={{ type: "spring", stiffness: 260, damping: 30 }}
      role="dialog"
      aria-label="Bets and Pot of the Day"
    >
      <div className="flex max-h-[74vh] flex-col overflow-hidden rounded-t-3xl border-t-2 border-x border-[#f7d774]/40 bg-gradient-to-b from-[#3a2414] via-[#2a190d] to-[#1b1009] text-white shadow-[0_-12px_40px_rgba(0,0,0,0.55)]">
        {/* Grab handle + header */}
        <div className="flex items-center gap-3 px-4 pt-2 pb-3 border-b border-white/10 bg-black/15">
          <div className="absolute left-1/2 top-1.5 h-1 w-10 -translate-x-1/2 rounded-full bg-white/25" />
          <div className="mt-2 flex items-center gap-1.5 rounded-full bg-black/40 px-3 py-1 text-sm">
            <Coins className="h-4 w-4 text-[#f7d774]" aria-hidden="true" />
            <span className="font-semibold">{balance - totalCost}</span>
            <span className="text-white/70 text-xs">cr</span>
          </div>
          <h2 className="mt-2 flex-1 text-center font-display text-2xl tracking-wide text-[#f7d774]">Bets & Pot</h2>
          <SoundToggle className="mt-2" />
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-4 py-4">
          {/* Jackpot */}
          <section>
            <JackpotMeter balance={jackpot} />
          </section>

          {/* Pot of the Day */}
          <section>
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/25 p-3">
              <Kiulu fill={Math.min(1, (pot.total + buyIn) / 400)} dropKey={dropKey} size={72} />
              <div className="min-w-0 flex-1">
                <div className={sectionTitle}>Pot of the Day</div>
                <div className="font-display text-2xl leading-none">{pot.total + buyIn} <span className="text-sm text-white/70">cr</span></div>
                <div className="mt-1 flex flex-wrap gap-1">
                  {pot.entrants.map((e) => (
                    <span key={e.userId} className="rounded-full bg-white/10 px-2 py-0.5 text-[11px]" title={e.username}>
                      {e.username}
                    </span>
                  ))}
                  {joinPot && <span className="rounded-full bg-[#f7d774] px-2 py-0.5 text-[11px] font-semibold text-black">You</span>}
                  {pot.entrants.length === 0 && !joinPot && <span className="text-[11px] text-white/70">Be the first in!</span>}
                </div>
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.95 }}
                  onClick={togglePot}
                  className={`mt-2 w-full rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${
                    joinPot ? "bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-400/60" : "bg-[#f7d774] text-black hover:bg-[#ffe28a]"
                  }`}
                  aria-pressed={joinPot}
                >
                  {joinPot ? "✓ You're in" : `🪙 Join · ${pot.buyIn}`}
                </motion.button>
              </div>
            </div>
            <p className="mt-1.5 text-[11px] text-white/70">Fewest throws takes the pot. Scores stay secret until the reveal after midnight.</p>
          </section>

          {/* Quick Finish tiers */}
          <section>
            <div className="mb-2 flex items-baseline justify-between">
              <h3 className={sectionTitle}>⚡ Quick Finish</h3>
              <span className="text-[11px] text-white/70">How lucky do you feel?</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {tierPrices.map(({ tier, price }) => {
                const selected = selection.type === "nopea" && selection.tier === tier.id;
                return (
                  <motion.button
                    key={tier.id}
                    type="button"
                    onClick={() => setSelection({ type: "nopea", tier: tier.id })}
                    animate={{ y: selected ? -4 : 0, scale: selected ? 1.03 : 1 }}
                    whileTap={{ scale: 0.96 }}
                    className={`rounded-xl border-2 p-2 text-center transition-colors ${
                      selected ? "border-[#f7d774] bg-[#f7d774]/10 shadow-[0_0_18px_rgba(247,215,116,0.25)]" : "border-white/10 bg-black/25"
                    }`}
                    aria-pressed={selected}
                  >
                    <div className="text-2xl" aria-hidden="true">{tier.emoji}</div>
                    <div className="text-sm font-semibold">{tier.name}</div>
                    <div className="text-[10px] uppercase tracking-wider text-white/70">{tier.tagline}</div>
                    {price.ok && (
                      <>
                        <div className="mt-1 text-xs text-white/80">≤ {price.bet.maxThrows} throws</div>
                        <SplitFlap value={`×${formatOdds(price.bet.odds)}`} className="mt-1 text-base font-bold" />
                      </>
                    )}
                  </motion.button>
                );
              })}
            </div>

          </section>

          {/* Personal bets */}
          <section>
            <h3 className={`${sectionTitle} mb-2`}>Personal</h3>
            <div className="grid grid-cols-2 gap-2">
              {(["keskiarvo", "ennatys"] as const).map((type) => {
                const meta = BET_TYPE_META[type];
                const line = personalLines[type];
                const price = priceBet({ type, lukitut, stake: MIN_STAKE }, opening, personalLines);
                const selected = selection.type === type;
                return (
                  <motion.button
                    key={type}
                    type="button"
                    disabled={line === null}
                    onClick={() => setSelection({ type })}
                    animate={{ y: selected ? -3 : 0 }}
                    className={`rounded-xl border-2 p-2 text-left disabled:opacity-40 ${
                      selected ? "border-[#f7d774] bg-[#f7d774]/10" : "border-white/10 bg-black/25"
                    }`}
                    aria-pressed={selected}
                  >
                    <div className="text-sm font-semibold">{meta.emoji} {meta.name}</div>
                    {line !== null && price.ok ? (
                      <div className="mt-1 flex items-center justify-between">
                        <span className="text-xs text-white/70">≤ {line} throws</span>
                        <SplitFlap value={`×${formatOdds(price.bet.odds)}`} className="text-sm font-bold" />
                      </div>
                    ) : (
                      <div className="mt-1 text-[11px] text-white/70">{personal ? "Unlocks after 5 games" : "Loading…"}</div>
                    )}
                  </motion.button>
                );
              })}
            </div>
          </section>

          {/* Stake */}
          <section className="rounded-2xl border border-white/10 bg-black/25 p-3">
            <div className="mb-2 flex items-baseline justify-between">
              <h3 className={sectionTitle}>Stake</h3>
              <span className="text-[11px] text-white/70">
                max {MAX_TOTAL_STAKE} cr per day · {MAX_BETS_PER_DAY} bets
              </span>
            </div>
            <StakeChips stake={stake} max={stakeRoom} onChange={setStake} hint={stake === 0 && slip.length < MAX_BETS_PER_DAY && stakeRoom >= MIN_STAKE} />
            {stake === 0 ? (
              <p className="mt-3 rounded-xl border border-dashed border-[#f7d774]/50 py-2 text-center text-sm text-white/85">
                👆 Tap the chips to set your stake
              </p>
            ) : (
              <motion.button
                type="button"
                whileTap={{ scale: 0.97 }}
                onClick={addToSlip}
                disabled={!canAdd}
                className="mt-3 w-full rounded-xl bg-[#f7d774]/15 py-2 text-sm font-semibold text-[#f7d774] ring-1 ring-[#f7d774]/50 hover:bg-[#f7d774]/25 disabled:opacity-40"
              >
                {currentPrice.ok
                  ? `+ Add to slip · win ${potentialWin(Math.max(stake, MIN_STAKE), currentPrice.bet.odds)}`
                  : "Pick a bet"}
              </motion.button>
            )}
          </section>
        </div>

        {/* Bet slip */}
        <div className="border-t border-[#f7d774]/30 bg-black/40 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
          <AnimatePresence initial={false}>
            {slip.length > 0 && (
              <motion.ul layout className="mb-2 space-y-1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {slip.map((spec, i) => {
                  const p = pricedSlip[i];
                  if (!p.ok) return null;
                  const title =
                    spec.type === "nopea"
                      ? `${TIERS.find((t) => t.id === spec.tier)?.emoji} ${TIERS.find((t) => t.id === spec.tier)?.name}`
                      : `${BET_TYPE_META[spec.type].emoji} ${BET_TYPE_META[spec.type].name}`;
                  return (
                    <motion.li
                      key={i}
                      layout
                      initial={{ x: 60, opacity: 0, scale: 0.9 }}
                      animate={{ x: 0, opacity: 1, scale: 1 }}
                      exit={{ x: -60, opacity: 0 }}
                      className="flex items-center gap-2 rounded-lg bg-white/5 px-2 py-1 text-sm"
                    >
                      <Chip value={spec.stake} size={26} />
                      <span className="flex-1 truncate">
                        {title} <span className="text-white/70">≤{p.bet.maxThrows}</span>
                      </span>
                      <span className="font-mono text-[#f7d774]">×{formatOdds(p.bet.odds)}</span>
                      <button type="button" onClick={() => setSlip((s) => s.filter((_, j) => j !== i))} aria-label="Remove bet" className="text-white/70 hover:text-white">
                        <X className="h-4 w-4" />
                      </button>
                    </motion.li>
                  );
                })}
              </motion.ul>
            )}
          </AnimatePresence>
          {slip.length > 0 && (
            <label className="mb-2 flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-[#f7d774]/30 bg-white/5 px-3 py-2">
              <span>
                <span className="text-sm font-semibold">🔒 Lukitut nopat</span>
                <span className="block text-[11px] text-white/75">Whole slip ×1.1 · dice locked on a throw stay locked for the rest of the game</span>
              </span>
              <input type="checkbox" checked={lukitut} onChange={(e) => setLukitut(e.target.checked)} className="h-5 w-5 shrink-0 accent-[#f7d774]" />
            </label>
          )}
          <div className="flex items-center gap-3">
            <div className="text-xs leading-tight text-white/75">
              <div>
                🧾 {slip.length} bet{slip.length === 1 ? "" : "s"}{joinPot ? " + pot" : ""} · <span className="text-white">{totalCost} cr</span>
              </div>
              <div>max win <span className="font-semibold text-emerald-300">+{maxWin}</span></div>
            </div>
            <motion.button
              type="button"
              whileTap={{ scale: 0.95 }}
              disabled={isPlacing || (slip.length === 0 && !joinPot)}
              onClick={() => onLockIn(slipWithLukitut, joinPot)}
              className="ml-auto flex items-center gap-2 rounded-xl bg-gradient-to-b from-[#ffe28a] to-[#e2b53a] px-5 py-3 font-display text-xl tracking-wider text-black shadow-[0_3px_0_#8a6510] disabled:opacity-40"
            >
              <Lock className="h-4 w-4" aria-hidden="true" />
              {isPlacing ? "…" : "LOCK IN"}
            </motion.button>
          </div>
          <button type="button" onClick={onSkip} disabled={isPlacing} className="mt-2 w-full text-center text-sm text-white/75 hover:text-white">
            Not now
          </button>
        </div>
      </div>
    </motion.div>
  );
};
