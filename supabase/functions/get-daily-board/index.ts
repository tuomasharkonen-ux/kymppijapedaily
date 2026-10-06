// Today's betting board: opening, tier lines, personal lines, jackpot, pot status,
// the caller's bets, and any settled Pot of the Day results they haven't seen yet.
// Also settles pots from previous days (lazy settlement, idempotent).
import {
  BETTING_LICENSE_ID,
  computePersonalLines,
  computeTierLines,
  getOpeningDice,
  helsinkiDate,
  isBettingDisabled,
  POT_BUY_IN,
} from "../_shared/kymppijape.ts";
import { authenticate, corsHeaders, hasPurchase, json, previousThrows } from "../_shared/http.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const auth = await authenticate(req);
    if (auth instanceof Response) return auth;
    const { user, service } = auth;

    const { error: settleError } = await service.rpc("settle_due_pots");
    if (settleError) console.error("Pot settlement failed:", settleError.message);

    const gameDate = helsinkiDate();
    const opening = getOpeningDice(gameDate);

    const [hasLicense, throwsBefore, jackpotRes, lastWinRes, potRes, entriesRes, betsRes, myEntriesRes] = await Promise.all([
      hasPurchase(service, user.id, BETTING_LICENSE_ID),
      previousThrows(service, user.id, gameDate),
      service.from("jackpot").select("balance").eq("id", 1).maybeSingle(),
      service.from("jackpot_wins").select("user_id, amount, game_date, throws_count").order("created_at", { ascending: false }).limit(1).maybeSingle(),
      service.from("pots").select("total, buy_in, status").eq("game_date", gameDate).maybeSingle(),
      service.from("pot_entries").select("user_id, created_at").eq("game_date", gameDate).order("created_at"),
      service.from("bets").select("*").eq("user_id", user.id).eq("game_date", gameDate).order("created_at"),
      service.from("pot_entries").select("game_date").eq("user_id", user.id).is("reveal_seen_at", null).lt("game_date", gameDate),
    ]);

    // Settled pots this player entered but hasn't watched the reveal for yet
    const revealDates = (myEntriesRes.data ?? []).map((e: { game_date: string }) => e.game_date);
    const revealPotsRes = revealDates.length
      ? await service.from("pots").select("*").in("game_date", revealDates).neq("status", "open").order("game_date")
      : { data: [] };
    const revealEntriesRes = revealDates.length
      ? await service.from("pot_entries").select("game_date, user_id, throws_count, payout").in("game_date", revealDates)
      : { data: [] };

    // Usernames for everyone we mention
    const userIds = new Set<string>();
    (entriesRes.data ?? []).forEach((e: { user_id: string }) => userIds.add(e.user_id));
    (revealEntriesRes.data ?? []).forEach((e: { user_id: string }) => userIds.add(e.user_id));
    if (lastWinRes.data) userIds.add(lastWinRes.data.user_id);
    const { data: profiles } = userIds.size
      ? await service.from("profiles").select("user_id, username").in("user_id", [...userIds])
      : { data: [] };
    const nameOf = (id: string) =>
      (profiles ?? []).find((p: { user_id: string }) => p.user_id === id)?.username ?? "Mystery player";

    type EntryRow = { game_date: string; user_id: string; throws_count: number | null; payout: number };
    const reveals = (revealPotsRes.data ?? []).map((pot: Record<string, unknown>) => ({
      gameDate: pot.game_date,
      status: pot.status,
      total: pot.total,
      winningThrows: pot.winning_throws,
      prizePerWinner: pot.prize_per_winner,
      entries: ((revealEntriesRes.data ?? []) as EntryRow[])
        .filter((e) => e.game_date === pot.game_date)
        .map((e) => ({
          userId: e.user_id,
          username: nameOf(e.user_id),
          throwsCount: e.throws_count,
          payout: e.payout,
          isMe: e.user_id === user.id,
        })),
    }));

    const entrants = (entriesRes.data ?? []).map((e: { user_id: string }) => ({
      userId: e.user_id,
      username: nameOf(e.user_id),
    }));

    return json({
      gameDate,
      opening,
      bettingDisabled: isBettingDisabled(opening),
      tierLines: computeTierLines(opening),
      personal: computePersonalLines(throwsBefore),
      hasLicense,
      jackpot: {
        balance: jackpotRes.data?.balance ?? 0,
        lastWin: lastWinRes.data
          ? {
            username: nameOf(lastWinRes.data.user_id),
            amount: lastWinRes.data.amount,
            gameDate: lastWinRes.data.game_date,
            throwsCount: lastWinRes.data.throws_count,
          }
          : null,
      },
      pot: {
        buyIn: potRes.data?.buy_in ?? POT_BUY_IN,
        total: potRes.data?.total ?? 0,
        entrants,
        joined: entrants.some((e: { userId: string }) => e.userId === user.id),
      },
      myBets: betsRes.data ?? [],
      reveals,
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return json({ error: "Internal server error" }, 500);
  }
});
