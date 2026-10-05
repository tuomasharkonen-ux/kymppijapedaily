import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  betWins,
  getOpeningDice,
  helsinkiDate,
  isJackpotThrowCount,
  isThrowLogConsistent,
} from "../_shared/kymppijape.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GameResultRequest {
  throws_count: number;
  winning_number: number;
  throw_log?: number[][];
  unlocked_any?: boolean;
}

interface BetRow {
  id: string;
  bet_type: string;
  tier: string | null;
  lucky_number: number | null;
  lukitut: boolean;
  max_throws: number;
  stake: number;
  odds: number;
}

// Settle the player's open bets and check the jackpot. Returns a summary for the
// client's settlement animation, or null when the player had nothing riding.
async function settleDay(
  service: SupabaseClient,
  userId: string,
  gameDate: string,
  outcome: { throws: number; winningNumber: number; unlockedAny: boolean; logConsistent: boolean },
) {
  const { data: openBets, error } = await service
    .from("bets")
    .select("id, bet_type, tier, lucky_number, lukitut, max_throws, stake, odds")
    .eq("user_id", userId)
    .eq("game_date", gameDate)
    .eq("status", "open");
  if (error) throw error;

  const bets = (openBets ?? []) as BetRow[];
  const results = bets.map((b) => ({
    id: b.id,
    // An inconsistent throw log voids (refunds) the bets instead of paying out
    outcome: !outcome.logConsistent
      ? "void"
      : betWins({ maxThrows: b.max_throws, number: b.lucky_number, lukitut: b.lukitut }, outcome)
      ? "won"
      : "lost",
  }));

  if (results.length > 0) {
    const { error: settleError } = await service.rpc("settle_user_bets", {
      p_user_id: userId,
      p_game_date: gameDate,
      p_results: results,
    });
    if (settleError) throw settleError;
  }

  let jackpot = 0;
  if (outcome.logConsistent && isJackpotThrowCount(outcome.throws)) {
    const { data, error: jackpotError } = await service.rpc("claim_jackpot", {
      p_user_id: userId,
      p_game_date: gameDate,
      p_throws: outcome.throws,
    });
    if (jackpotError) console.error("claim_jackpot failed:", jackpotError.message);
    jackpot = data ?? 0;
  }

  if (results.length === 0 && jackpot === 0) return null;

  const { data: settled } = await service
    .from("bets")
    .select("*")
    .eq("user_id", userId)
    .eq("game_date", gameDate)
    .order("created_at");
  const { data: credits } = await service.from("user_credits").select("balance").eq("user_id", userId).maybeSingle();

  return { bets: settled ?? [], jackpot, newBalance: credits?.balance ?? null };
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('Missing authorization header');
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with user's JWT
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // User client for authentication
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Verify user is authenticated
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      console.error('Authentication failed:', authError?.message);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`User ${user.id} attempting to save game result`);

    // Parse request body
    const body: GameResultRequest = await req.json();
    const { throws_count, winning_number, throw_log } = body;
    const unlocked_any = body.unlocked_any === true;

    // Validate throws_count (must be between 1 and 10000 - matching DB constraint)
    if (typeof throws_count !== 'number' || throws_count < 1 || throws_count > 10000 || !Number.isInteger(throws_count)) {
      console.error(`Invalid throws_count: ${throws_count}`);
      return new Response(
        JSON.stringify({ error: 'Invalid throws_count. Must be an integer between 1 and 10000.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate winning_number (must be between 1 and 6 - matching DB constraint)
    if (typeof winning_number !== 'number' || winning_number < 1 || winning_number > 6 || !Number.isInteger(winning_number)) {
      console.error(`Invalid winning_number: ${winning_number}`);
      return new Response(
        JSON.stringify({ error: 'Invalid winning_number. Must be an integer between 1 and 6.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use service role client for database operations
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

    // Get today's game day (SERVER-SIDE, Finnish calendar date)
    const today = helsinkiDate();
    const logConsistent = isThrowLogConsistent(throw_log, getOpeningDice(today), throws_count, winning_number);
    if (!logConsistent) {
      console.warn(`Throw log inconsistent for user ${user.id}`);
    }

    // Check if user already played today
    const { data: existingRecord, error: checkError } = await serviceClient
      .from('game_records')
      .select('id')
      .eq('user_id', user.id)
      .eq('played_date', today)
      .maybeSingle();

    if (checkError) {
      console.error('Error checking existing record:', checkError.message);
      return new Response(
        JSON.stringify({ error: 'Failed to check existing record' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (existingRecord) {
      console.error(`User ${user.id} already played today`);
      return new Response(
        JSON.stringify({ error: 'You have already played today. Come back tomorrow!' }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Insert the game record using service role (bypasses RLS)
    const { data: insertedRecord, error: insertError } = await serviceClient
      .from('game_records')
      .insert({
        user_id: user.id,
        throws_count: throws_count,
        winning_number: winning_number,
        played_date: today, // Server-controlled date
        throw_log: logConsistent ? throw_log : null,
        unlocked_any,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting game record:', insertError.message);
      // Handle race condition where two concurrent requests both pass the existence check
      if (insertError.code === '23505' || insertError.message.includes('unique_user_played_date')) {
        return new Response(
          JSON.stringify({ success: true, alreadySaved: true }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      return new Response(
        JSON.stringify({ error: 'Failed to save game result' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Game record saved successfully for user ${user.id}: ${throws_count} throws, winning number ${winning_number}`);

    // Vedot + jackpot. The game record is already saved, so a settlement failure
    // must not fail the request; open bets can be retried by support.
    let settlement = null;
    try {
      settlement = await settleDay(serviceClient, user.id, today, {
        throws: throws_count,
        winningNumber: winning_number,
        unlockedAny: unlocked_any,
        logConsistent,
      });
    } catch (settleError) {
      console.error('Settlement failed:', settleError);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        record: insertedRecord,
        settlement,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
