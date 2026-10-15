import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getActionDef, inboxLine, type ActionOutcome } from "@/lib/mokki";

export interface MokkiOwnedPiece {
  piece_id: string;
  build_days: number;
  played_days_at_purchase: number;
  purchased_at: string;
  /** Dog breed (koira) or flag (lipputanko). */
  variant: string | null;
  /** Dog name. */
  nickname: string | null;
}

/** A prank mark currently showing on the island. */
export interface MokkiEffect {
  id: string;
  actionId: string;
  fromName: string;
  visibleUntil: string;
}

export interface MokkiInboxItem {
  id: string;
  actionId: string;
  text: string;
  /** Credits the owner got from it (0 for pranks). */
  reward: number;
  createdAt: string;
}

export interface MokkiGuest {
  actionId: "paljubileet" | "grillibileet";
  userId: string;
  username: string;
}

/** The signed-in player's own island, used to check what they can do on a neighbor's island. */
export interface MokkiViewer {
  pieces: MokkiOwnedPiece[];
  gamesPlayed: number;
  playedToday: boolean;
  peaceful: boolean;
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
  /** The owner switched on peaceful mode (no pranks). */
  peaceful: boolean;
  /** Prank marks showing on the island. */
  effects: MokkiEffect[];
  /** Today's palju and grill guests. */
  guests: MokkiGuest[];
  /** Unseen mailbox lines (own island only). */
  inbox: MokkiInboxItem[];
  /** Action ids the viewer already did today: chores on their own island, visits/pranks on this one. */
  doneToday: string[];
  /** Times the viewer did each action today across all islands (for daily caps). */
  doneCountToday: Record<string, number>;
  /** The signed-in player's own island (equals the owner's data on your own island). */
  viewer: MokkiViewer;
}

export interface MokkiActionResult {
  success: boolean;
  error?: string;
  newBalance?: number;
  outcome?: ActionOutcome;
}

const EMPTY_VIEWER: MokkiViewer = { pieces: [], gamesPlayed: 0, playedToday: false, peaceful: false };

const EMPTY: MokkiData = {
  ownerName: null,
  ownsPlot: false,
  gamesPlayed: 0,
  playedToday: false,
  pieces: [],
  loylyFrom: [],
  loylySentToday: false,
  peaceful: false,
  effects: [],
  guests: [],
  inbox: [],
  doneToday: [],
  doneCountToday: {},
  viewer: EMPTY_VIEWER,
};

const PIECE_COLUMNS = "piece_id, build_days, played_days_at_purchase, purchased_at, variant, nickname";

function helsinkiToday(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Helsinki" }).format(new Date());
}

async function usernames(ids: string[]): Promise<Map<string, string>> {
  const unique = [...new Set(ids)];
  if (unique.length === 0) return new Map();
  const { data } = await supabase.from("profiles").select("user_id, username").in("user_id", unique);
  return new Map((data ?? []).map((p) => [p.user_id, p.username]));
}

interface IslandInfo {
  peaceful?: boolean;
  guests?: { action_id: MokkiGuest["actionId"]; user_id: string; username: string }[];
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
  const me = viewerId ?? ownerId;

  const fetchMokki = useCallback(async () => {
    if (!ownerId) {
      setData(EMPTY);
      setIsLoading(false);
      return;
    }
    try {
      const today = helsinkiToday();
      const nowIso = new Date().toISOString();
      const [ownerRes, piecesRes, islandRes, effectsRes, actionsRes] = await Promise.all([
        supabase.rpc("get_mokki_owner", { p_user_id: ownerId }),
        supabase.from("mokki_pieces").select(PIECE_COLUMNS).eq("user_id", ownerId),
        supabase.rpc("get_mokki_island", { p_user_id: ownerId }),
        supabase
          .from("mokki_effects")
          .select("id, action_id, from_user_id, visible_until")
          .eq("target_user_id", ownerId)
          .eq("foiled", false)
          .is("cleared_at", null)
          .gt("visible_until", nowIso),
        me
          ? supabase.from("mokki_actions").select("action_id, target_user_id").eq("user_id", me).eq("action_date", today)
          : Promise.resolve({ data: [], error: null }),
      ]);
      if (ownerRes.error) throw ownerRes.error;
      if (piecesRes.error) throw piecesRes.error;
      // New tables may not exist yet right after a deploy; the island still renders
      if (islandRes.error) console.warn("get_mokki_island unavailable:", islandRes.error.message);
      if (effectsRes.error) console.warn("mokki_effects unavailable:", effectsRes.error.message);
      if (actionsRes.error) console.warn("mokki_actions unavailable:", actionsRes.error.message);
      const owner = ownerRes.data?.[0];
      const island = (islandRes.data ?? {}) as IslandInfo;
      const myActions = actionsRes.data ?? [];

      let loylyFrom: string[] = [];
      let loylySentToday = false;
      let inbox: MokkiInboxItem[] = [];
      let viewer: MokkiViewer = EMPTY_VIEWER;
      let names = new Map<string, string>();
      const effectRows = effectsRes.data ?? [];

      if (isOwn) {
        const [{ data: unseen }, { data: unseenEffects }] = await Promise.all([
          supabase.from("mokki_loylyt").select("from_user_id").eq("to_user_id", ownerId).is("seen_at", null),
          supabase
            .from("mokki_effects")
            .select("id, action_id, from_user_id, foiled, target_reward, created_at")
            .eq("target_user_id", ownerId)
            .is("seen_at", null)
            .order("created_at", { ascending: false })
            .limit(30),
        ]);
        const senders = [...new Set((unseen ?? []).map((l) => l.from_user_id))];
        names = await usernames([...senders, ...(unseenEffects ?? []).map((e) => e.from_user_id), ...effectRows.map((e) => e.from_user_id)]);
        loylyFrom = senders.map((id) => names.get(id) ?? "A friend");
        const dogName = (piecesRes.data ?? []).find((p) => p.piece_id === "koira")?.nickname;
        inbox = (unseenEffects ?? []).flatMap((e) => {
          const def = getActionDef(e.action_id);
          if (!def) return [];
          return [{ id: e.id, actionId: e.action_id, text: inboxLine(def, names.get(e.from_user_id) ?? "Someone", e.foiled, dogName), reward: e.target_reward, createdAt: e.created_at }];
        });
        viewer = {
          pieces: piecesRes.data ?? [],
          gamesPlayed: owner?.games_played ?? 0,
          playedToday: !!owner?.played_today,
          peaceful: !!island.peaceful,
        };
      } else if (viewerId) {
        const [{ data: sent }, viewerOwner, viewerPieces, viewerIsland] = await Promise.all([
          supabase
            .from("mokki_loylyt")
            .select("id")
            .eq("from_user_id", viewerId)
            .eq("to_user_id", ownerId)
            .eq("sent_date", today)
            .maybeSingle(),
          supabase.rpc("get_mokki_owner", { p_user_id: viewerId }),
          supabase.from("mokki_pieces").select(PIECE_COLUMNS).eq("user_id", viewerId),
          supabase.rpc("get_mokki_island", { p_user_id: viewerId }),
        ]);
        loylySentToday = !!sent;
        const v = viewerOwner.data?.[0];
        viewer = {
          pieces: viewerPieces.data ?? [],
          gamesPlayed: v?.games_played ?? 0,
          playedToday: !!v?.played_today,
          peaceful: !!((viewerIsland.data ?? {}) as IslandInfo).peaceful,
        };
        names = await usernames(effectRows.map((e) => e.from_user_id));
      }

      const doneCountToday: Record<string, number> = {};
      for (const a of myActions) doneCountToday[a.action_id] = (doneCountToday[a.action_id] ?? 0) + 1;
      const doneToday = myActions
        .filter((a) => (isOwn ? a.target_user_id === null : a.target_user_id === ownerId))
        .map((a) => a.action_id);

      setData({
        ownerName: owner?.username ?? null,
        ownsPlot: !!owner?.owns_plot,
        gamesPlayed: owner?.games_played ?? 0,
        playedToday: !!owner?.played_today,
        pieces: piecesRes.data ?? [],
        loylyFrom,
        loylySentToday,
        peaceful: !!island.peaceful,
        effects: effectRows.map((e) => ({ id: e.id, actionId: e.action_id, fromName: names.get(e.from_user_id) ?? "Someone", visibleUntil: e.visible_until ?? nowIso })),
        guests: (island.guests ?? []).map((g) => ({ actionId: g.action_id, userId: g.user_id, username: g.username })),
        inbox,
        doneToday,
        doneCountToday,
        viewer,
      });
      setError(null);
    } catch (e) {
      console.error("Error loading mökki:", e);
      setError(e instanceof Error ? e.message : "Failed to load mökki");
    } finally {
      setIsLoading(false);
    }
  }, [ownerId, viewerId, isOwn, me]);

  useEffect(() => {
    setIsLoading(true);
    fetchMokki();
  }, [fetchMokki]);

  const buyPiece = useCallback(
    async (pieceId: string, dog?: { breed: string; name: string }): Promise<MokkiActionResult> => {
      try {
        const { data: res, error: fnError } = await supabase.functions.invoke("buy-mokki-piece", { body: { pieceId, ...dog } });
        if (fnError) return { success: false, error: (await functionError(fnError)) ?? "Purchase failed" };
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

  /**
   * Runs a chore, prank or visit (MOKKI_ACTIONS ids), or a setting:
   * `set_flag` { flag }, `set_dog` { breed, name }, `cleanup` { effectId }.
   * Visits and pranks target the island on screen.
   */
  const doAction = useCallback(
    async (actionId: string, payload: Record<string, unknown> = {}): Promise<MokkiActionResult> => {
      try {
        const body = { actionId, ...payload, ...(isOwn ? {} : { targetUserId: ownerId }) };
        const { data: res, error: fnError } = await supabase.functions.invoke("mokki-action", { body });
        if (fnError) return { success: false, error: (await functionError(fnError)) ?? "Something went wrong" };
        if (res?.error) return { success: false, error: res.error };
        await fetchMokki();
        return { success: true, outcome: res?.outcome, newBalance: res?.newBalance ?? undefined };
      } catch (e) {
        console.error("mokki-action failed:", e);
        return { success: false, error: "Something went wrong" };
      }
    },
    [fetchMokki, isOwn, ownerId],
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

  const markInboxSeen = useCallback(async () => {
    if (!isOwn) return;
    const { error: rpcError } = await supabase.rpc("mark_mokki_effects_seen");
    if (rpcError) console.error("mark_mokki_effects_seen failed:", rpcError);
    else setData((d) => ({ ...d, inbox: [] }));
  }, [isOwn]);

  return { data, isLoading, error, refetch: fetchMokki, buyPiece, doAction, sendLoyly, markLoylySeen, markInboxSeen };
};

/** Edge functions answer 400 with { error }; supabase-js hides it inside the response context. */
async function functionError(err: unknown): Promise<string | null> {
  const ctx = (err as { context?: Response })?.context;
  if (ctx && typeof ctx.json === "function") {
    try {
      const body = await ctx.json();
      if (body?.error) return body.error;
    } catch {
      // not JSON
    }
  }
  return (err as Error)?.message ?? null;
}
