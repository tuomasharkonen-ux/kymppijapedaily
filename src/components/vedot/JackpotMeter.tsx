import { motion } from "framer-motion";
import { AnimatedNumber } from "@/components/motion";
import { JACKPOT_MAX_THROWS } from "@/lib/kymppijape";

interface JackpotMeterProps {
  balance: number;
  compact?: boolean;
}

/** Glowing jackpot counter. Shimmers harder past round numbers. */
export const JackpotMeter = ({ balance, compact = false }: JackpotMeterProps) => {
  const big = balance >= 500;

  return (
    <motion.div
      className={`relative overflow-hidden rounded-xl border border-yellow-400/50 bg-gradient-to-br from-[#3b2205] via-[#5a3608] to-[#2b1803] ${compact ? "px-3 py-1.5" : "px-4 py-2"} text-center`}
      animate={{
        boxShadow: [
          "0 0 6px rgba(250,204,21,0.25)",
          `0 0 ${big ? 22 : 14}px rgba(250,204,21,${big ? 0.65 : 0.45})`,
          "0 0 6px rgba(250,204,21,0.25)",
        ],
      }}
      transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
    >
      {/* Shimmer sweep */}
      <motion.div
        className="pointer-events-none absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-yellow-100/25 to-transparent"
        animate={{ x: ["-120%", "320%"] }}
        transition={{ duration: big ? 1.8 : 3.2, repeat: Infinity, repeatDelay: 1.2, ease: "easeInOut" }}
      />
      <div className={`font-semibold uppercase tracking-[0.2em] text-yellow-200/80 ${compact ? "text-[9px]" : "text-[10px]"}`}>
        <span aria-hidden="true">🏆</span> Jackpot
      </div>
      <div className={`font-display font-bold text-yellow-300 drop-shadow-[0_0_6px_rgba(250,204,21,0.6)] ${compact ? "text-xl leading-none" : "text-3xl leading-none"}`}>
        <AnimatedNumber value={balance} />
      </div>
      {!compact && (
        <div className="mt-0.5 text-[10px] text-yellow-100/70">Win in ≤ {JACKPOT_MAX_THROWS} throws with a ticket</div>
      )}
    </motion.div>
  );
};
