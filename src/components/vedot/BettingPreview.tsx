import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Lock } from "lucide-react";
import { TIERS } from "@/lib/kymppijape";
import { JackpotMeter } from "./JackpotMeter";
import { Kiulu } from "./Kiulu";
import { SplitFlap } from "./SplitFlap";
import { Chip } from "./StakeChips";

// Example odds for a typical opening (four of a kind), matching the real sheet
const DEMO = [
  { lines: [13, 12, 14], odds: ["1.8", "2.1", "1.6"] },
  { lines: [9, 8, 10], odds: ["4.3", "6.3", "3.2"] },
  { lines: [6, 5, 7], odds: ["19", "46", "10"] },
];

// Scripted loop: pick a tier → join the pot → add a chip → lock in → stamp
const STEPS = ["idle", "tier", "pot", "chip", "lock", "stamp"] as const;
const STEP_MS = [1200, 1300, 1300, 1100, 700, 1600];

/** Miniature, self-playing version of the real betting sheet for the shop. */
export const BettingPreview = () => {
  const reduceMotion = useReducedMotion();
  const [step, setStep] = useState(reduceMotion ? 3 : 0);
  const [round, setRound] = useState(0);

  useEffect(() => {
    if (reduceMotion) return;
    const timer = setTimeout(() => {
      if (step === STEPS.length - 1) {
        setStep(0);
        setRound((r) => r + 1);
      } else {
        setStep(step + 1);
      }
    }, STEP_MS[step]);
    return () => clearTimeout(timer);
  }, [step, reduceMotion]);

  const at = (name: (typeof STEPS)[number]) => step >= STEPS.indexOf(name);
  const variant = round % DEMO[0].odds.length;
  const selected = at("tier") ? 1 : null;
  const joined = at("pot");
  const potTotal = 150 + (joined ? 50 : 0);
  const stake = at("chip") ? 25 : 0;
  const maxWin = Math.floor(stake * Number(DEMO[1].odds[variant]));

  return (
    <div className="relative w-[300px] select-none overflow-hidden rounded-2xl border border-[#f7d774]/40 bg-gradient-to-b from-[#3a2414] via-[#2a190d] to-[#1b1009] text-white shadow-xl" aria-hidden="true">
      <div className="border-b border-white/10 bg-black/15 py-1.5 text-center font-display text-lg tracking-wide text-[#f7d774]">Bets & Pot</div>

      <div className="space-y-2.5 p-3">
        <JackpotMeter balance={640} compact />

        <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/25 p-2">
          <Kiulu fill={potTotal / 400} dropKey={joined ? round + 1 : 0} size={44} />
          <div className="min-w-0 flex-1">
            <div className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[#f7d774]/80">Pot of the Day</div>
            <div className="font-display text-lg leading-none">{potTotal} cr</div>
          </div>
          <motion.div
            animate={joined ? { scale: [1, 0.9, 1] } : {}}
            className={`rounded-lg px-2 py-1 text-[11px] font-semibold ${joined ? "bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-400/60" : "bg-[#f7d774] text-black"}`}
          >
            {joined ? "✓ You're in" : "🪙 Join · 50"}
          </motion.div>
        </div>

        <div className="grid grid-cols-3 gap-1.5">
          {TIERS.map((tier, i) => {
            const isSelected = selected === i;
            return (
              <motion.div
                key={tier.id}
                animate={{ y: isSelected ? -3 : 0, scale: isSelected ? 1.04 : 1 }}
                className={`rounded-lg border-2 p-1.5 text-center ${isSelected ? "border-[#f7d774] bg-[#f7d774]/10 shadow-[0_0_14px_rgba(247,215,116,0.3)]" : "border-white/10 bg-black/25"}`}
              >
                <div className="text-lg leading-none">{tier.emoji}</div>
                <div className="text-[11px] font-semibold">{tier.name}</div>
                <div className="text-[9px] text-white/60">≤ {DEMO[i].lines[variant]} throws</div>
                <SplitFlap value={`×${DEMO[i].odds[variant]}`} className="mt-0.5 text-xs font-bold" silent />
              </motion.div>
            );
          })}
        </div>
      </div>

      <div className="flex items-center gap-2 border-t border-[#f7d774]/30 bg-black/40 px-3 py-2">
        <AnimatePresence>
          {stake > 0 && (
            <motion.span initial={{ y: -40, opacity: 0, rotate: -90 }} animate={{ y: 0, opacity: 1, rotate: 0 }} exit={{ opacity: 0 }}>
              <Chip value={stake} size={24} />
            </motion.span>
          )}
        </AnimatePresence>
        <div className="text-[10px] leading-tight text-white/60">
          <div>
            🧾 {stake > 0 ? 1 : 0} bet{joined ? " + pot" : ""} · <span className="text-white">{stake + (joined ? 50 : 0)} cr</span>
          </div>
          <div>
            max win <span className="font-semibold text-emerald-300">+{maxWin}</span>
          </div>
        </div>
        <motion.div
          animate={at("lock") && !at("stamp") ? { scale: [1, 0.88, 1] } : {}}
          className={`ml-auto flex items-center gap-1 rounded-lg bg-gradient-to-b from-[#ffe28a] to-[#e2b53a] px-3 py-1.5 font-display text-sm tracking-wider text-black shadow-[0_2px_0_#8a6510] ${stake > 0 || joined ? "" : "opacity-40"}`}
        >
          <Lock className="h-3 w-3" />
          LOCK IN
        </motion.div>
      </div>

      <AnimatePresence>
        {at("stamp") && (
          <motion.div
            key={`stamp-${round}`}
            className="absolute inset-0 flex items-center justify-center bg-black/30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ scale: 3, rotate: -24, opacity: 0 }}
              animate={{ scale: 1, rotate: -12, opacity: 1 }}
              transition={{ type: "spring", stiffness: 600, damping: 22 }}
              className="rounded-lg border-4 border-red-600 bg-black/20 px-3 py-1 font-display text-3xl tracking-wider text-red-500"
            >
              LOCKED IN!
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
