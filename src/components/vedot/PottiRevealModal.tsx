import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { format, parseISO } from "date-fns";
import { Crown } from "lucide-react";
import type { PotReveal } from "@/lib/vedot";
import { buzz, playSound } from "@/lib/sound";
import { Kiulu } from "./Kiulu";
import { coinBurst } from "./coinBurst";

interface PottiRevealModalProps {
  reveal: PotReveal;
  onClose: () => void;
}

const FLIP_MS = 1100;

/** "Yesterday's Pot": cards flip worst to best, then the kiulu tips over for the winner. */
export const PottiRevealModal = ({ reveal, onClose }: PottiRevealModalProps) => {
  // Did-not-finish first, then most throws → fewest throws (the winner flips last)
  const order = useMemo(
    () =>
      [...reveal.entries].sort((a, b) => {
        if (a.throwsCount === null) return -1;
        if (b.throwsCount === null) return 1;
        return b.throwsCount - a.throwsCount;
      }),
    [reveal.entries],
  );
  const [flipped, setFlipped] = useState(0);
  const allFlipped = flipped >= order.length;
  const me = reveal.entries.find((e) => e.isMe);
  const iWon = !!me && me.payout > 0 && reveal.status === "settled";
  const refunded = reveal.status === "refunded";

  useEffect(() => {
    playSound("drumroll");
  }, []);

  useEffect(() => {
    if (allFlipped) {
      if (iWon || refunded) {
        playSound("coins");
        coinBurst({ x: 0.5, y: 0.35 }, 90);
        buzz([60, 40, 120]);
      }
      return;
    }
    const timer = setTimeout(() => {
      playSound("flip");
      setFlipped((f) => f + 1);
    }, flipped === 0 ? 1400 : FLIP_MS);
    return () => clearTimeout(timer);
  }, [flipped, allFlipped, iWon, refunded]);

  const dateLabel = format(parseISO(reveal.gameDate), "EEEE d.M.");

  return (
    <motion.div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/75 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      role="dialog"
      aria-label="Pot of the Day results"
    >
      <motion.div
        className="w-full max-w-sm rounded-3xl border border-[#f7d774]/40 bg-gradient-to-b from-[#3a2414] to-[#1b1009] p-5 text-white shadow-2xl"
        initial={{ scale: 0.85, y: 30 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 240, damping: 22 }}
      >
        <div className="text-center">
          <div className="text-[11px] uppercase tracking-[0.25em] text-white/70">{dateLabel}</div>
          <h2 className="font-display text-4xl tracking-wide text-[#f7d774]">Yesterday's Pot</h2>
        </div>

        <div className="my-3 flex justify-center">
          <Kiulu fill={Math.min(1, reveal.total / 400)} size={88} tipped={allFlipped && reveal.status === "settled"} />
        </div>
        <p className="mb-3 text-center text-sm text-white/70">
          {reveal.total} cr in the pot · {reveal.entries.length} player{reveal.entries.length === 1 ? "" : "s"}
        </p>

        <ul className="space-y-2 [perspective:800px]">
          {order.map((entry, i) => {
            const isFlipped = i < flipped;
            const isWinner = reveal.status === "settled" && entry.payout > 0;
            return (
              <li key={entry.userId} className="relative h-12">
                <motion.div
                  className="absolute inset-0 [transform-style:preserve-3d]"
                  animate={{ rotateX: isFlipped ? 180 : 0 }}
                  transition={{ duration: 0.55, ease: "easeInOut" }}
                >
                  {/* Face down */}
                  <div className="absolute inset-0 flex items-center justify-between rounded-xl border border-white/10 bg-[repeating-linear-gradient(45deg,#4a2c14_0_8px,#3a2210_8px_16px)] px-3 [backface-visibility:hidden]">
                    <span className="font-semibold">{entry.username}{entry.isMe ? " (you)" : ""}</span>
                    <span className="font-display text-xl text-white/70">?</span>
                  </div>
                  {/* Face up */}
                  <div
                    className={`absolute inset-0 flex items-center justify-between rounded-xl border px-3 [backface-visibility:hidden] [transform:rotateX(180deg)] ${
                      isWinner ? "border-yellow-300 bg-yellow-500/20 shadow-[0_0_20px_rgba(250,204,21,0.35)]" : "border-white/10 bg-black/40"
                    }`}
                  >
                    <span className="flex items-center gap-1.5 font-semibold">
                      {isWinner && <Crown className="h-4 w-4 text-yellow-300" aria-label="Winner" />}
                      {entry.username}{entry.isMe ? " (you)" : ""}
                    </span>
                    <span className="text-right">
                      <span className="font-display text-xl">{entry.throwsCount ?? "DNF"}</span>
                      {entry.throwsCount !== null && <span className="ml-1 text-xs text-white/70">throws</span>}
                      {entry.payout > 0 && <span className="ml-2 font-display text-lg text-emerald-300">+{entry.payout}</span>}
                    </span>
                  </div>
                </motion.div>
              </li>
            );
          })}
        </ul>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: allFlipped ? 1 : 0 }} className="mt-4 text-center">
          <p className="font-display text-2xl">
            {refunded ? "Nobody joined you — buy-in refunded." : iWon ? `You won ${me?.payout} cr! 🎉` : "Better luck tonight! ♨️"}
          </p>
        </motion.div>

        <button
          type="button"
          onClick={onClose}
          disabled={!allFlipped}
          className="mt-4 w-full rounded-xl bg-gradient-to-b from-[#ffe28a] to-[#e2b53a] py-3 font-display text-xl text-black shadow-[0_3px_0_#8a6510] disabled:opacity-40"
        >
          Continue
        </button>
      </motion.div>
    </motion.div>
  );
};
