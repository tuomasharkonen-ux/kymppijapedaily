import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GameResultRequest {
  throws_count: number;
  winning_number: number;
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
    const { throws_count, winning_number } = body;

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

    // Get today's date (SERVER-SIDE - cannot be manipulated by client)
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

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
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting game record:', insertError.message);
      return new Response(
        JSON.stringify({ error: 'Failed to save game result' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Game record saved successfully for user ${user.id}: ${throws_count} throws, winning number ${winning_number}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        record: insertedRecord 
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
