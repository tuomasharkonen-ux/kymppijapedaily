import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { canBuyPiece, getPieceDef } from "../_shared/mokki.ts";

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
    const pieceId = body?.pieceId;
    if (!pieceId || typeof pieceId !== "string") {
      return json({ error: "Invalid request: pieceId is required" }, 400);
    }

    // Catalog lives in _shared/mokki.ts; prices are never taken from the client
    const piece = getPieceDef(pieceId);
    if (!piece) {
      return json({ error: "Invalid piece" }, 400);
    }

    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

    // Must own the plot
    const { data: plot, error: plotError } = await serviceClient
      .from("user_purchases")
      .select("id")
      .eq("user_id", userId)
      .eq("item_id", "mokki_plot")
      .maybeSingle();
    if (plotError) {
      console.error("Error checking plot ownership:", plotError);
      return json({ error: "Failed to check mökki ownership" }, 500);
    }
    if (!plot) {
      return json({ error: "Buy a Mökkitontti first" }, 400);
    }

    // Owned pieces and days played (server-side, cannot be spoofed)
    const [{ data: ownedRows, error: ownedError }, { count: gamesPlayed, error: countError }] = await Promise.all([
      serviceClient.from("mokki_pieces").select("piece_id").eq("user_id", userId),
      serviceClient.from("game_records").select("id", { count: "exact", head: true }).eq("user_id", userId),
    ]);
    if (ownedError || countError) {
      console.error("Error loading mökki state:", ownedError ?? countError);
      return json({ error: "Failed to load your mökki" }, 500);
    }

    const ownedIds = (ownedRows ?? []).map((r: { piece_id: string }) => r.piece_id);
    const totalGames = gamesPlayed ?? 0;
    const check = canBuyPiece(pieceId, ownedIds, totalGames);
    if (check.ok === false) {
      return json({ error: check.reason }, 400);
    }

    console.log(`User ${userId} buying mökki piece ${piece.id} for ${piece.price}`);

    const { data: newBalance, error: deductError } = await serviceClient.rpc("decrement_user_credits", {
      p_user_id: userId,
      p_amount: piece.price,
    });
    if (deductError) {
      console.error("Error deducting credits:", deductError);
      if (deductError.message.includes("Insufficient credits") || deductError.message.includes("User has no credits")) {
        return json({ error: "Insufficient credits" }, 400);
      }
      return json({ error: "Failed to process purchase" }, 500);
    }

    const { data: inserted, error: insertError } = await serviceClient
      .from("mokki_pieces")
      .insert({
        user_id: userId,
        piece_id: piece.id,
        price_paid: piece.price,
        build_days: piece.buildDays,
        played_days_at_purchase: totalGames,
      })
      .select("piece_id, build_days, played_days_at_purchase, purchased_at")
      .single();

    if (insertError) {
      console.error("Error inserting mökki piece, refunding:", insertError);
      // Concurrent double-buy hits the unique constraint: give the credits back
      const { error: refundError } = await serviceClient.rpc("increment_user_credits", {
        p_user_id: userId,
        p_amount: piece.price,
      });
      if (refundError) console.error("Refund failed:", refundError);
      const duplicate = insertError.code === "23505";
      return json({ error: duplicate ? "You already own this" : "Failed to record purchase" }, duplicate ? 400 : 500);
    }

    return json({
      success: true,
      pieceId: piece.id,
      pieceName: piece.name,
      newBalance,
      piece: inserted,
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return json({ error: "Internal server error" }, 500);
  }
});
