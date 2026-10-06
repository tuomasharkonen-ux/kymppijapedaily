import { motion } from "framer-motion";
import { Ticket } from "lucide-react";
import { AnimatedNumber } from "@/components/motion";
import { JACKPOT_MAX_THROWS } from "@/lib/kymppijape";

interface BettingPromoProps {
  jackpot: number;
  onPlaceBets: () => void;
}

/** Shown above the dice after the opening throw, until the first die is locked. */
export const BettingPromo = ({ jackpot, onPlaceBets }: BettingPromoProps) => (
  <motion.section
    initial={{ opacity: 0, y: -8, scale: 0.98 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    exit={{ opacity: 0, y: -8, scale: 0.98 }}
    transition={{ type: "spring", stiffness: 300, damping: 26 }}
    className="mb-4 overflow-hidden rounded-2xl border border-[#f7d774]/40 bg-gradient-to-b from-[#3a2414] to-[#1b1009] text-white shadow-lg"
    aria-label="Betting slip"
  >
    {/* Today's jackpot */}
    <div className="relative flex items-center gap-3 overflow-hidden border-b border-[#f7d774]/25 bg-gradient-to-r from-[#5a3608] via-[#3b2205] to-[#5a3608] px-4 py-2">
      <motion.div
        className="pointer-events-none absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-yellow-100/20 to-transparent"
        animate={{ x: ["-120%", "380%"] }}
        transition={{ duration: 2.6, repeat: Infinity, repeatDelay: 1.4, ease: "easeInOut" }}
      />
      <span className="text-2xl" aria-hidden="true">🏆</span>
      <div className="min-w-0 flex-1">
        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-yellow-200">Today's jackpot</div>
        <div className="text-xs text-yellow-50/90">Win in ≤ {JACKPOT_MAX_THROWS} throws with a bet</div>
      </div>
      <div className="font-display text-3xl leading-none text-yellow-300 drop-shadow-[0_0_6px_rgba(250,204,21,0.6)]">
        <AnimatedNumber value={jackpot} />
      </div>
    </div>

    {/* Betting slip */}
    <div className="px-4 py-3">
      <div className="flex items-center gap-2">
        <Ticket className="h-4 w-4 text-[#f7d774]" aria-hidden="true" />
        <h3 className="font-display text-xl tracking-wide text-[#f7d774]">Betting slip</h3>
      </div>
      <motion.button
        type="button"
        onClick={onPlaceBets}
        whileTap={{ scale: 0.96 }}
        animate={{ boxShadow: ["0 3px 0 #8a6510, 0 0 0 rgba(247,215,116,0)", "0 3px 0 #8a6510, 0 0 18px rgba(247,215,116,0.55)", "0 3px 0 #8a6510, 0 0 0 rgba(247,215,116,0)"] }}
        transition={{ duration: 1.8, repeat: Infinity }}
        className="mt-3 w-full rounded-xl bg-gradient-to-b from-[#ffe28a] to-[#e2b53a] py-2.5 font-display text-xl tracking-wider text-black"
      >
        Place your bets
      </motion.button>
      <p className="mt-2 text-center text-[11px] text-white/75">Bets close when you lock a die or roll again.</p>
    </div>
  </motion.section>
);
