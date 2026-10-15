import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { helsinkiDate } from "../_shared/kymppijape.ts";
import {
  canDoAction,
  findOwned,
  getActionDef,
  getDogBreed,
  helsinkiParts,
  isFlagId,
  isPieceBuilt,
  PRANK_EFFECT_HOURS,
  REWARDS,
  rollAction,
  validateDogName,
  type ActionContext,
  type OwnedPieceRecord,
} from "../_shared/mokki.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

interface Island {
  ownsPlot: boolean;
  pieces: OwnedPieceRecord[];
  gamesPlayed: number;
  playedToday: boolean;
  peaceful: boolean;
  isTestUser: boolean;
}

async function loadIsland(db: SupabaseClient, userId: string, today: string): Promise<Island> {
  const [plot, pieces, games, playedToday, settings, profile] = await Promise.all([
    db.from("user_purchases").select("id").eq("user_id", userId).eq("item_id", "mokki_plot").maybeSingle(),
    db.from("mokki_pieces").select("piece_id, build_days, played_days_at_purchase, variant, nickname").eq("user_id", userId),
    db.from("game_records").select("id", { count: "exact", head: true }).eq("user_id", userId),
    db.from("game_records").select("id", { count: "exact", head: true }).eq("user_id", userId).eq("played_date", today),
    db.from("user_settings").select("peaceful_mokki").eq("user_id", userId).maybeSingle(),
    db.from("profiles").select("is_test_user").eq("user_id", userId).maybeSingle(),
  ]);
  const failed = [plot, pieces, games, playedToday, settings, profile].find((r) => r.error);
  if (failed) throw failed.error;
  return {
    ownsPlot: !!plot.data,
    pieces: pieces.data ?? [],
    gamesPlayed: games.count ?? 0,
    playedToday: (playedToday.count ?? 0) > 0,
    peaceful: !!settings.data?.peaceful_mokki,
    isTestUser: !!profile.data?.is_test_user,
  };
}

/** Credits a player and writes the credit_ledger row. Returns the new balance. */
async function credit(db: SupabaseClient, userId: string, amount: number, reason: string, ref: string) {
  if (amount <= 0) return null;
  const { data, error } = await db.rpc("vedot_apply_credit", { p_user_id: userId, p_delta: amount, p_reason: reason, p_ref: ref });
  if (error) console.error(`Crediting ${userId} failed:`, error);
  return (data as number | null) ?? null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return json({ error: "Unauthorized" }, 401);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, supabaseAnonKey);
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await userClient.auth.getUser(token);
    if (authError || !user) {
      console.log("Failed to verify JWT:", authError?.message);
      return json({ error: "Unauthorized" }, 401);
    }
    const userId = user.id;

    const body = await req.json();
    const actionId = body?.actionId;
    if (!actionId || typeof actionId !== "string") {
      return json({ error: "Invalid request: actionId is required" }, 400);
    }

    const db = createClient(supabaseUrl, supabaseServiceKey);
    const today = helsinkiDate();
    const actor = await loadIsland(db, userId, today);
    if (!actor.ownsPlot) return json({ error: "Buy a Mökkitontti first" }, 400);

    // ---- Settings: flag, dog ------------------------------------------------
    if (actionId === "set_flag") {
      if (!isFlagId(body?.flag)) return json({ error: "Unknown flag" }, 400);
      if (!isPieceBuilt(actor.pieces, "lipputanko", actor.gamesPlayed)) return json({ error: "Build the Lipputanko first" }, 400);
      const { error } = await db.from("mokki_pieces").update({ variant: body.flag }).eq("user_id", userId).eq("piece_id", "lipputanko");
      if (error) throw error;
      return json({ success: true });
    }

    if (actionId === "set_dog") {
      if (!findOwned(actor.pieces, "koira")) return json({ error: "You don't have a dog yet" }, 400);
      const breed = getDogBreed(body?.breed);
      if (!breed) return json({ error: "Pick a breed" }, 400);
      const name = validateDogName(body?.name);
      if (name.ok === false) return json({ error: name.reason }, 400);
      const { error } = await db
        .from("mokki_pieces")
        .update({ variant: breed.id, nickname: name.name })
        .eq("user_id", userId)
        .eq("piece_id", "koira");
      if (error) throw error;
      return json({ success: true });
    }

    // ---- Clean up a prank on your own island --------------------------------
    if (actionId === "cleanup") {
      const effectId = body?.effectId;
      if (!effectId || typeof effectId !== "string") return json({ error: "Nothing to clean" }, 400);
      const { data: cleared, error } = await db
        .from("mokki_effects")
        .update({ cleared_at: new Date().toISOString(), seen_at: new Date().toISOString() })
        .eq("id", effectId)
        .eq("target_user_id", userId)
        .eq("foiled", false)
        .is("cleared_at", null)
        .gt("visible_until", new Date().toISOString())
        .select("id");
      if (error) throw error;
      if (!cleared || cleared.length === 0) return json({ error: "Already cleaned up" }, 400);
      const newBalance = await credit(db, userId, REWARDS.cleanup, "mokki_cleanup", effectId);
      return json({ success: true, outcome: { reward: REWARDS.cleanup, targetReward: 0, foiled: false, label: "🧹 All clean" }, newBalance });
    }

    // ---- Chores, pranks and visits -----------------------------------------
    const def = getActionDef(actionId);
    if (!def) return json({ error: "Unknown action" }, 400);

    let target: Island | undefined;
    const targetUserId: string | null = def.kind === "chore" ? null : body?.targetUserId ?? null;
    if (def.kind !== "chore") {
      if (!targetUserId || typeof targetUserId !== "string") return json({ error: "Pick a neighbor" }, 400);
      if (targetUserId === userId) return json({ error: "That's your own mökki" }, 400);
      target = await loadIsland(db, targetUserId, today);
      if (!target.ownsPlot) return json({ error: "That player has no mökki" }, 400);
    }

    const now = new Date().toISOString();
    const [done, doneOnTarget, guests, activeEffect] = await Promise.all([
      db.from("mokki_actions").select("id", { count: "exact", head: true }).eq("user_id", userId).eq("action_id", def.id).eq("action_date", today),
      targetUserId
        ? db.from("mokki_actions").select("id", { count: "exact", head: true }).eq("user_id", userId).eq("action_id", def.id).eq("target_user_id", targetUserId).eq("action_date", today)
        : Promise.resolve({ count: 0, error: null }),
      targetUserId && def.maxGuestsPerDay
        ? db.from("mokki_actions").select("id", { count: "exact", head: true }).eq("target_user_id", targetUserId).eq("action_id", def.id).eq("action_date", today)
        : Promise.resolve({ count: 0, error: null }),
      targetUserId && def.visibleEffect
        ? db.from("mokki_effects").select("id", { count: "exact", head: true }).eq("target_user_id", targetUserId).eq("action_id", def.id).eq("foiled", false).is("cleared_at", null).gt("visible_until", now)
        : Promise.resolve({ count: 0, error: null }),
    ]);
    const countFailed = [done, doneOnTarget, guests, activeEffect].find((r) => r.error);
    if (countFailed) throw countFailed.error;

    const ctx: ActionContext = {
      actor: { pieces: actor.pieces, gamesPlayed: actor.gamesPlayed, playedToday: actor.playedToday, peaceful: actor.peaceful },
      target: target && { pieces: target.pieces, gamesPlayed: target.gamesPlayed, peaceful: target.peaceful, isTestUser: target.isTestUser },
      month: helsinkiParts(new Date()).month,
      doneToday: done.count ?? 0,
      doneOnTargetToday: (doneOnTarget.count ?? 0) > 0,
      guestsToday: guests.count ?? 0,
      effectActiveOnTarget: (activeEffect.count ?? 0) > 0,
    };
    const check = canDoAction(def, ctx);
    if (check.ok === false) return json({ error: check.reason }, 400);

    // Every roll happens here, never on the client
    const outcome = rollAction(def, ctx, Math.random);

    const { data: row, error: insertError } = await db
      .from("mokki_actions")
      .insert({
        user_id: userId,
        action_id: def.id,
        target_user_id: targetUserId,
        action_date: today,
        reward: outcome.reward,
        target_reward: outcome.targetReward,
        foiled: outcome.foiled,
        label: outcome.label,
      })
      .select("id")
      .single();
    if (insertError) {
      // Double tap racing the daily limit
      if (insertError.code === "23505") return json({ error: def.kind === "chore" ? "Done for today" : "Already done here today" }, 400);
      throw insertError;
    }

    if (targetUserId) {
      const visibleUntil = def.visibleEffect && !outcome.foiled ? new Date(Date.now() + PRANK_EFFECT_HOURS * 3600 * 1000).toISOString() : null;
      const { error: effectError } = await db.from("mokki_effects").insert({
        target_user_id: targetUserId,
        from_user_id: userId,
        action_id: def.id,
        foiled: outcome.foiled,
        target_reward: outcome.targetReward,
        visible_until: visibleUntil,
      });
      if (effectError) console.error("Error recording mökki effect:", effectError);
    }

    const newBalance = await credit(db, userId, outcome.reward, `mokki_${def.id}`, row.id);
    if (targetUserId) await credit(db, targetUserId, outcome.targetReward, `mokki_${def.id}`, row.id);

    console.log(`User ${userId} did ${def.id}${targetUserId ? ` on ${targetUserId}` : ""}: ${outcome.label}`);
    return json({ success: true, outcome, newBalance });
  } catch (error) {
    console.error("Unexpected error:", error);
    return json({ error: "Internal server error" }, 500);
  }
});
