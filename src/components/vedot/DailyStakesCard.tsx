import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { betConditions, betTitle, formatOdds, type DailyBoard } from "@/lib/vedot";
import { JackpotMeter } from "./JackpotMeter";
import { Kiulu } from "./Kiulu";

/** Today's stakes for licence owners: jackpot, pot and (after betting) the bet slip. */
export const DailyStakesCard = ({ board }: { board: DailyBoard }) => {
  const { pot, jackpot, myBets } = board;

  return (
    <Card className="overflow-hidden border-[#f7d774]/30 bg-gradient-to-br from-[#3a2414] to-[#1b1009] text-white">
      <CardContent className="space-y-3 p-4">
        <JackpotMeter balance={jackpot.balance} />
        <div className="flex items-center gap-3">
          <Kiulu fill={Math.min(1, pot.total / 400)} size={56} />
          <div className="min-w-0 flex-1">
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#f7d774]/80">Pot of the Day</div>
            <div className="font-display text-2xl leading-none">
              {pot.total} <span className="text-sm text-white/50">cr</span>
            </div>
            <div className="truncate text-xs text-white/60">
              {pot.entrants.length === 0
                ? "Nobody in yet"
                : `${pot.entrants.map((e) => e.username).join(", ")}${pot.joined ? " (incl. you)" : ""}`}
            </div>
          </div>
        </div>
        {jackpot.lastWin && (
          <p className="text-[11px] text-white/45">
            Last jackpot: {jackpot.lastWin.username} took {jackpot.lastWin.amount} cr in {jackpot.lastWin.throwsCount} throws
          </p>
        )}
        {myBets.length > 0 && (
          <ul className="space-y-1 border-t border-white/10 pt-2">
            {myBets.map((bet) => (
              <li key={bet.id} className="flex items-center justify-between text-sm">
                <span>
                  {betTitle(bet)} <span className="text-xs text-white/50">{betConditions(bet)}</span>
                </span>
                <span
                  className={
                    bet.status === "won" ? "font-semibold text-emerald-300" : bet.status === "lost" ? "text-white/40 line-through" : "text-[#f7d774]"
                  }
                >
                  {bet.status === "won" ? `+${bet.payout}` : bet.status === "void" ? "refunded" : `${bet.stake} @ ×${formatOdds(Number(bet.odds))}`}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
};

/** Nudge for players without the betting licence (only once they've played a few games). */
export const VedotTeaser = ({ board }: { board: DailyBoard }) => (
  <Link
    to="/shop"
    className="flex items-center gap-3 rounded-xl border border-[#f7d774]/30 bg-gradient-to-r from-[#3a2414] to-[#1b1009] px-4 py-3 text-white transition-transform hover:scale-[1.01]"
  >
    <Kiulu fill={Math.min(1, board.pot.total / 400)} size={40} />
    <div className="min-w-0 flex-1 text-sm">
      <div className="font-semibold">
        {board.pot.entrants.length > 0
          ? `🪙 ${board.pot.entrants.length} player${board.pot.entrants.length === 1 ? "" : "s"} in today's Pot of the Day`
          : "🪙 Bets & Pot of the Day"}
      </div>
      <div className="text-xs text-white/60">Jackpot {board.jackpot.balance} cr · get a Betting License in the shop →</div>
    </div>
  </Link>
);
