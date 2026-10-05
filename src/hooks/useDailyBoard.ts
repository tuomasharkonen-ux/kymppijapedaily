import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { BetSpec } from "@/lib/kymppijape";
import type { BetRow, DailyBoard, Settlement } from "@/lib/vedot";

// Edge functions answer errors with a JSON body; surface its message.
async function functionErrorMessage(error: unknown, fallback: string): Promise<string> {
  const context = (error as { context?: Response })?.context;
  if (context && typeof context.json === "function") {
    try {
      const body = await context.json();
      if (body?.error) return body.error;
    } catch {
      // not JSON
    }
  }
  return fallback;
}

export const useDailyBoard = (userId: string | null) => {
  const [board, setBoard] = useState<DailyBoard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlacing, setIsPlacing] = useState(false);

  const fetchBoard = useCallback(async () => {
    if (!userId) {
      setBoard(null);
      setIsLoading(false);
      return;
    }
    try {
      const { data, error } = await supabase.functions.invoke("get-daily-board");
      if (error) {
        console.error("Failed to load daily board:", await functionErrorMessage(error, error.message));
        return;
      }
      setBoard(data as DailyBoard);
    } catch (error) {
      console.error("Failed to load daily board:", error);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchBoard();
  }, [fetchBoard]);

  const placeBets = useCallback(
    async (bets: BetSpec[], joinPot: boolean): Promise<{ ok: true; newBalance: number } | { ok: false; error: string }> => {
      setIsPlacing(true);
      try {
        const { data, error } = await supabase.functions.invoke("place-bets", { body: { bets, joinPot } });
        if (error) return { ok: false, error: await functionErrorMessage(error, "Failed to place bets") };
        if (data?.error) return { ok: false, error: data.error };

        setBoard((prev) =>
          prev && {
            ...prev,
            myBets: data.bets as BetRow[],
            pot: joinPot ? { ...prev.pot, joined: true, total: prev.pot.total + prev.pot.buyIn } : prev.pot,
          },
        );
        // Pick up the entrant list with usernames
        if (joinPot) fetchBoard();
        return { ok: true, newBalance: data.newBalance };
      } catch {
        return { ok: false, error: "Failed to place bets" };
      } finally {
        setIsPlacing(false);
      }
    },
    [fetchBoard],
  );

  const applySettlement = useCallback((settlement: Settlement) => {
    setBoard((prev) =>
      prev && {
        ...prev,
        myBets: settlement.bets,
        jackpot: settlement.jackpot > 0 ? { ...prev.jackpot, balance: 200 } : prev.jackpot,
      },
    );
  }, []);

  const markRevealSeen = useCallback(async (gameDate: string) => {
    setBoard((prev) => prev && { ...prev, reveals: prev.reveals.filter((r) => r.gameDate !== gameDate) });
    const { error } = await supabase.rpc("mark_pot_reveal_seen", { p_game_date: gameDate });
    if (error) console.error("Failed to mark reveal seen:", error.message);
  }, []);

  return { board, isLoading, isPlacing, placeBets, applySettlement, markRevealSeen, refetchBoard: fetchBoard };
};
