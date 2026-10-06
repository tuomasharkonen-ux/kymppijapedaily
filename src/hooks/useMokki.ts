import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface MokkiOwnedPiece {
  piece_id: string;
  build_days: number;
  played_days_at_purchase: number;
  purchased_at: string;
}

export interface MokkiData {
  ownerName: string | null;
  ownsPlot: boolean;
  gamesPlayed: number;
  playedToday: boolean;
  pieces: MokkiOwnedPiece[];
  /** Usernames of friends whose löyly the owner hasn't seen yet (own island only). */
  loylyFrom: string[];
  /** Viewer already sent löyly to this island today (visits only). */
  loylySentToday: boolean;
}

export interface MokkiActionResult {
  success: boolean;
  error?: string;
  newBalance?: number;
}

const EMPTY: MokkiData = {
  ownerName: null,
  ownsPlot: false,
  gamesPlayed: 0,
  playedToday: false,
  pieces: [],
  loylyFrom: [],
  loylySentToday: false,
};

function helsinkiToday(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Helsinki" }).format(new Date());
}

/**
 * Loads a mökki island. `ownerId` is whose island; `viewerId` is the signed-in
 * player (defaults to the owner, i.e. your own island).
 */
export const useMokki = (ownerId: string | null, viewerId?: string | null) => {
  const [data, setData] = useState<MokkiData>(EMPTY);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isOwn = !viewerId || viewerId === ownerId;

  const fetchMokki = useCallback(async () => {
    if (!ownerId) {
      setData(EMPTY);
      setIsLoading(false);
      return;
    }
    try {
      const [ownerRes, piecesRes] = await Promise.all([
        supabase.rpc("get_mokki_owner", { p_user_id: ownerId }),
        supabase
          .from("mokki_pieces")
          .select("piece_id, build_days, played_days_at_purchase, purchased_at")
          .eq("user_id", ownerId),
      ]);
      if (ownerRes.error) throw ownerRes.error;
      if (piecesRes.error) throw piecesRes.error;
      const owner = ownerRes.data?.[0];

      let loylyFrom: string[] = [];
      let loylySentToday = false;
      if (isOwn) {
        const { data: unseen } = await supabase
          .from("mokki_loylyt")
          .select("from_user_id")
          .eq("to_user_id", ownerId)
          .is("seen_at", null);
        const senders = [...new Set((unseen ?? []).map((l) => l.from_user_id))];
        if (senders.length > 0) {
          const { data: profiles } = await supabase.from("profiles").select("user_id, username").in("user_id", senders);
          loylyFrom = senders.map((id) => profiles?.find((p) => p.user_id === id)?.username ?? "A friend");
        }
      } else if (viewerId) {
        const { data: sent } = await supabase
          .from("mokki_loylyt")
          .select("id")
          .eq("from_user_id", viewerId)
          .eq("to_user_id", ownerId)
          .eq("sent_date", helsinkiToday())
          .maybeSingle();
        loylySentToday = !!sent;
      }

      setData({
        ownerName: owner?.username ?? null,
        ownsPlot: !!owner?.owns_plot,
        gamesPlayed: owner?.games_played ?? 0,
        playedToday: !!owner?.played_today,
        pieces: piecesRes.data ?? [],
        loylyFrom,
        loylySentToday,
      });
      setError(null);
    } catch (e) {
      console.error("Error loading mökki:", e);
      setError(e instanceof Error ? e.message : "Failed to load mökki");
    } finally {
      setIsLoading(false);
    }
  }, [ownerId, viewerId, isOwn]);

  useEffect(() => {
    setIsLoading(true);
    fetchMokki();
  }, [fetchMokki]);

  const buyPiece = useCallback(
    async (pieceId: string): Promise<MokkiActionResult> => {
      try {
        const { data: res, error: fnError } = await supabase.functions.invoke("buy-mokki-piece", { body: { pieceId } });
        if (fnError) return { success: false, error: fnError.message || "Purchase failed" };
        if (res?.error) return { success: false, error: res.error };
        await fetchMokki();
        return { success: true, newBalance: res?.newBalance };
      } catch (e) {
        console.error("buy-mokki-piece failed:", e);
        return { success: false, error: "Purchase failed" };
      }
    },
    [fetchMokki],
  );

  const sendLoyly = useCallback(async (): Promise<MokkiActionResult> => {
    if (!ownerId) return { success: false };
    const { data: sent, error: rpcError } = await supabase.rpc("send_mokki_loyly", { p_to_user_id: ownerId });
    if (rpcError) return { success: false, error: rpcError.message };
    setData((d) => ({ ...d, loylySentToday: true }));
    return { success: true, error: sent ? undefined : "Already sent today" };
  }, [ownerId]);

  const markLoylySeen = useCallback(async () => {
    if (!isOwn) return;
    const { error: rpcError } = await supabase.rpc("mark_mokki_loylyt_seen");
    if (rpcError) console.error("mark_mokki_loylyt_seen failed:", rpcError);
    else setData((d) => ({ ...d, loylyFrom: [] }));
  }, [isOwn]);

  return { data, isLoading, error, refetch: fetchMokki, buyPiece, sendLoyly, markLoylySeen };
};
