// Lock in the day's bets and/or the Pot of the Day entry.
// Odds are always priced here from the shared rules, never taken from the client.
import {
  BETTING_LICENSE_ID,
  type BetSpec,
  computePersonalLines,
  getOpeningDice,
  helsinkiDate,
  POT_BUY_IN,
  priceSlip,
} from "../_shared/kymppijape.ts";
import { authenticate, corsHeaders, hasPurchase, json, previousThrows } from "../_shared/http.ts";

interface PlaceBetsRequest {
  bets?: BetSpec[];
  joinPot?: boolean;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const auth = await authenticate(req);
    if (auth instanceof Response) return auth;
    const { user, service } = auth;

    if (!(await hasPurchase(service, user.id, BETTING_LICENSE_ID))) {
      return json({ error: "You need a Betting License to bet" }, 403);
    }

    const body: PlaceBetsRequest = await req.json();
    const specs = Array.isArray(body.bets) ? body.bets : [];
    const joinPot = body.joinPot === true;

    if (specs.length === 0 && !joinPot) {
      return json({ error: "Nothing to place" }, 400);
    }

    const gameDate = helsinkiDate();
    const opening = getOpeningDice(gameDate);
    const personal = computePersonalLines(await previousThrows(service, user.id, gameDate));

    const sanitized: BetSpec[] = specs.map((s) => ({
      type: s.type,
      tier: s.tier,
      lukitut: s.lukitut === true,
      stake: s.stake,
    }));
    const priced = priceSlip(sanitized, opening, personal);
    if (priced.ok === false) {
      return json({ error: priced.error }, 400);
    }

    const { data: newBalance, error } = await service.rpc("place_daily_bets", {
      p_user_id: user.id,
      p_game_date: gameDate,
      p_bets: priced.bets,
      p_join_pot: joinPot,
      p_buy_in: POT_BUY_IN,
    });

    if (error) {
      console.error("place_daily_bets failed:", error.message);
      const known = ["Insufficient credits", "Bets already placed today", "Game already finished", "Pot is closed"]
        .find((m) => error.message.includes(m));
      return json({ error: known ?? "Failed to place bets" }, known ? 400 : 500);
    }

    const { data: myBets } = await service
      .from("bets")
      .select("*")
      .eq("user_id", user.id)
      .eq("game_date", gameDate)
      .order("created_at");

    return json({ success: true, newBalance, bets: myBets ?? [], joinedPot: joinPot });
  } catch (error) {
    console.error("Unexpected error:", error);
    return json({ error: "Internal server error" }, 500);
  }
});
