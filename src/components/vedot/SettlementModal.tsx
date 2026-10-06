import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AnimatedNumber } from "@/components/motion";
import { betConditions, betTitle, formatOdds, type Settlement } from "@/lib/vedot";
import { buzz, playSound } from "@/lib/sound";
import { coinBurst, goldRain } from "./coinBurst";

interface SettlementModalProps {
  settlement: Settlement;
  inPot: boolean;
  onClose: () => void;
}

const STEP_MS = 900;

/** After the game: bets resolve one by one, then the credits roll in. */
export const SettlementModal = ({ settlement, inPot, onClose }: SettlementModalProps) => {
  const hasJackpot = settlement.jackpot > 0;
  const [phase, setPhase] = useState<"jackpot" | "bets">(hasJackpot ? "jackpot" : "bets");
  const [revealed, setRevealed] = useState(0);

  const bets = settlement.bets;
  const totalPayout = bets.reduce((sum, b) => sum + (b.status === "won" || b.status === "void" ? b.payout : 0), 0) + settlement.jackpot;
  const totalStaked = bets.reduce((sum, b) => sum + b.stake, 0);
  const done = phase === "bets" && revealed >= bets.length;

  // Jackpot takeover first
  useEffect(() => {
    if (phase !== "jackpot") return;
    playSound("fanfare");
    buzz([80, 40, 80, 40, 200]);
    goldRain(3000);
  }, [phase]);

  // Then each bet, one at a time
  useEffect(() => {
    if (phase !== "bets" || revealed >= bets.length) return;
    const timer = setTimeout(() => {
      const bet = bets[revealed];
      if (bet.status === "won") {
        playSound("coins");
        coinBurst({ x: 0.5, y: 0.45 }, 50);
      } else if (bet.status === "lost") {
        playSound("hiss");
      }
      setRevealed((r) => r + 1);
    }, revealed === 0 ? 500 : STEP_MS);
    return () => clearTimeout(timer);
  }, [phase, revealed, bets]);

  return (
    <motion.div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/70 p-4 sm:items-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      role="dialog"
      aria-label="Bet results"
    >
      <AnimatePresence mode="wait">
        {phase === "jackpot" ? (
          <motion.div
            key="jackpot"
            className="w-full max-w-sm rounded-3xl border-2 border-yellow-300 bg-gradient-to-b from-[#5a3608] to-[#1f1203] p-8 text-center text-white shadow-[0_0_60px_rgba(250,204,21,0.5)]"
            initial={{ scale: 0.3, rotate: -8, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            exit={{ scale: 1.2, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 15 }}
          >
            <motion.div
              className="text-7xl"
              animate={{ rotate: [0, -10, 10, -6, 6, 0], scale: [1, 1.2, 1] }}
              transition={{ duration: 1, repeat: Infinity, repeatDelay: 0.6 }}
              aria-hidden="true"
            >
              🏆
            </motion.div>
            <h2 className="mt-2 font-display text-6xl tracking-widest text-yellow-300 drop-shadow-[0_0_12px_rgba(250,204,21,0.8)]">JACKPOT!</h2>
            <div className="mt-3 font-display text-5xl text-white">
              +<AnimatedNumber value={settlement.jackpot} />
            </div>
            <p className="mt-2 text-sm text-yellow-100/80">A Kymppijape in 5 throws or less. Legendary.</p>
            <button
              type="button"
              onClick={() => setPhase("bets")}
              className="mt-6 w-full rounded-xl bg-yellow-300 py-3 font-display text-xl text-black"
            >
              {bets.length ? "And your bets…" : "Nice!"}
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="bets"
            className="w-full max-w-sm rounded-3xl border border-[#f7d774]/40 bg-gradient-to-b from-[#3a2414] to-[#1b1009] p-5 text-white shadow-2xl"
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 26 }}
          >
            <h2 className="text-center font-display text-3xl tracking-wide text-[#f7d774]">Results</h2>
            <p className="mb-4 text-center text-xs text-white/50">Settling today's bets</p>

            <ul className="space-y-2">
              {bets.map((bet, i) => {
                const shown = i < revealed;
                return (
                  <li key={bet.id} className="relative overflow-hidden rounded-xl border border-white/10 bg-black/30 px-3 py-2">
                    <div className="flex items-center gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold">{betTitle(bet)}</div>
                        <div className="text-[11px] text-white/50">
                          {betConditions(bet)} · {bet.stake} cr @ ×{formatOdds(Number(bet.odds))}
                        </div>
                      </div>
                      <AnimatePresence>
                        {shown ? (
                          <motion.div
                            initial={{ scale: 2.2, opacity: 0, rotate: -15 }}
                            animate={{ scale: 1, opacity: 1, rotate: 0 }}
                            transition={{ type: "spring", stiffness: 500, damping: 20 }}
                            className={`text-right font-display text-xl ${
                              bet.status === "won" ? "text-emerald-300" : bet.status === "void" ? "text-white/60" : "text-red-300/80"
                            }`}
                          >
                            {bet.status === "won" ? `+${bet.payout}` : bet.status === "void" ? "refund" : "♨️ tssss"}
                          </motion.div>
                        ) : (
                          <motion.div className="font-display text-xl text-white/30" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 0.8, repeat: Infinity }}>
                            …
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                    {shown && bet.status === "lost" && (
                      <motion.div
                        aria-hidden="true"
                        className="pointer-events-none absolute right-6 top-1 h-6 w-6 rounded-full bg-white/40 blur-sm"
                        initial={{ opacity: 0.8, y: 0, scale: 0.6 }}
                        animate={{ opacity: 0, y: -30, scale: 2 }}
                        transition={{ duration: 1.2 }}
                      />
                    )}
                  </li>
                );
              })}
              {settlement.jackpot > 0 && (
                <li className="rounded-xl border border-yellow-300/60 bg-yellow-500/10 px-3 py-2 text-sm">
                  🏆 Jackpot <span className="float-right font-display text-xl text-yellow-300">+{settlement.jackpot}</span>
                </li>
              )}
            </ul>

            <motion.div
              className="mt-4 flex items-end justify-between border-t border-white/10 pt-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: done ? 1 : 0.3 }}
            >
              <div className="text-xs text-white/50">
                Staked {totalStaked} · Won <span className="text-emerald-300">{done ? totalPayout : "…"}</span>
              </div>
              {settlement.newBalance !== null && (
                <div className="text-right">
                  <div className="text-[10px] uppercase tracking-wider text-white/40">Balance</div>
                  <div className="font-display text-3xl text-[#f7d774]">
                    <AnimatedNumber value={done ? settlement.newBalance : settlement.newBalance - totalPayout} />
                  </div>
                </div>
              )}
            </motion.div>

            {inPot && done && (
              <motion.p initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="mt-3 rounded-lg bg-white/5 p-2 text-center text-xs text-white/70">
                ♨️ The Pot of the Day is revealed after midnight. Sleep tight! 🌙
              </motion.p>
            )}

            <button
              type="button"
              onClick={onClose}
              disabled={!done}
              className="mt-4 w-full rounded-xl bg-gradient-to-b from-[#ffe28a] to-[#e2b53a] py-3 font-display text-xl text-black shadow-[0_3px_0_#8a6510] disabled:opacity-40"
            >
              Nice!
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
