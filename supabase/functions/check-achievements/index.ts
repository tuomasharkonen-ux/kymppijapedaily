import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GameContext {
  throws: number;
  winningNumber: number;
  initialDice: number[];
  currentStreak: number;
  isFirstGame: boolean;
  lockedNumbers?: number[];
  featureUsed?: string;
  playDate: string; // MM-DD format
}

interface Badge {
  id: string;
  name: string;
  description: string;
  trigger_type: string;
  trigger_value: string | null;
  prize_credits: number;
  rarity: string;
}

interface EarnedBadge {
  badge: Badge;
  isNew: boolean;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create client with user's token to validate JWT
    const supabaseUser = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } }
    });
    
    // Use getClaims instead of getUser to avoid "user not found" errors
    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabaseUser.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      console.error('Auth error:', claimsError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = claimsData.claims.sub as string;
    console.log('Checking achievements for user:', userId);

    // Create admin client for badge operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const gameContext: GameContext = await req.json();
    console.log('Game context received:', gameContext);

    // Fetch all badges
    const { data: allBadges, error: badgesError } = await supabase
      .from('badges')
      .select('*');

    if (badgesError) {
      console.error('Error fetching badges:', badgesError);
      throw badgesError;
    }

    // Fetch user's existing badges
    const { data: existingUserBadges, error: existingError } = await supabase
      .from('user_badges')
      .select('badge_id')
      .eq('user_id', userId);

    if (existingError) {
      console.error('Error fetching existing badges:', existingError);
      throw existingError;
    }

    const existingBadgeIds = new Set(existingUserBadges?.map(ub => ub.badge_id) || []);
    console.log('Existing badge IDs:', Array.from(existingBadgeIds));

    const newlyEarnedBadges: EarnedBadge[] = [];
    let totalCreditsEarned = 0;

    // Helper to check and award a badge
    const checkAndAwardBadge = async (badgeId: string, condition: boolean, isRepeatable = false) => {
      const badge = allBadges?.find(b => b.id === badgeId);
      if (!badge) {
        console.log(`Badge ${badgeId} not found in database`);
        return;
      }

      if (!condition) {
        console.log(`Badge ${badgeId} condition not met`);
        return;
      }

      // For non-repeatable badges, skip if already earned
      if (!isRepeatable && existingBadgeIds.has(badgeId)) {
        console.log(`Badge ${badgeId} already earned (non-repeatable)`);
        return;
      }

      console.log(`Awarding badge: ${badgeId}`);

      // Insert the badge
      const { error: insertError } = await supabase
        .from('user_badges')
        .insert({ user_id: userId, badge_id: badgeId });

      if (insertError) {
        // Ignore duplicate errors for non-repeatable badges
        if (insertError.code !== '23505') {
          console.error(`Error inserting badge ${badgeId}:`, insertError);
        }
        return;
      }

      newlyEarnedBadges.push({ badge, isNew: true });
      totalCreditsEarned += badge.prize_credits;
    };

    // Check first_win (first game ever)
    await checkAndAwardBadge('first_win', gameContext.isFirstGame);

    // Check winning_number badges (win_1 through win_6)
    await checkAndAwardBadge(`win_${gameContext.winningNumber}`, true);

    // Check winning_throw_count badges (throws_1 through throws_6)
    if (gameContext.throws <= 6) {
      await checkAndAwardBadge(`throws_${gameContext.throws}`, true);
    }

    // Check starter_match badges (5-9 matching dice on first throw)
    if (gameContext.initialDice && gameContext.initialDice.length > 0) {
      const diceCounts: Record<number, number> = {};
      gameContext.initialDice.forEach(d => {
        diceCounts[d] = (diceCounts[d] || 0) + 1;
      });
      const maxMatch = Math.max(...Object.values(diceCounts));
      console.log('Initial dice max match:', maxMatch);
      
      // Award applicable starter badges (from highest to lowest to get all)
      for (let i = 9; i >= 5; i--) {
        if (maxMatch >= i) {
          await checkAndAwardBadge(`starter_${i}`, true);
        }
      }
    }

    // Check daily_streak milestone badges (10, 30, 50, 100, 365)
    const streakMilestones = [10, 30, 50, 100, 365];
    for (const milestone of streakMilestones) {
      if (gameContext.currentStreak >= milestone) {
        await checkAndAwardBadge(`streak_${milestone}`, true);
      }
    }

    // Check daily streak_add (repeatable daily reward)
    if (gameContext.currentStreak >= 1) {
      await checkAndAwardBadge('daily_streak', true, true);
    }

    // Check date_match badges
    const dateMatches: Record<string, string> = {
      '09-09': 'special_date_birthday',
      '01-01': 'special_date_ny',
      '25-12': 'special_date_xmas',
    };
    if (dateMatches[gameContext.playDate]) {
      await checkAndAwardBadge(dateMatches[gameContext.playDate], true);
    }

    // Check feature_used (share feature)
    if (gameContext.featureUsed === 'share') {
      await checkAndAwardBadge('special_share', true);
    }

    // Check locked_numbers (special straight 1-5)
    if (gameContext.lockedNumbers && gameContext.lockedNumbers.length === 5) {
      const sorted = [...gameContext.lockedNumbers].sort((a, b) => a - b);
      if (sorted.join(';') === '1;2;3;4;5') {
        await checkAndAwardBadge('special_straight', true);
      }
    }

    // Update user credits atomically if any badges were earned
    if (totalCreditsEarned > 0) {
      console.log('Total credits earned:', totalCreditsEarned);
      
      // Use atomic increment function to prevent race conditions
      const { error: creditError } = await supabase.rpc('increment_user_credits', {
        p_user_id: userId,
        p_amount: totalCreditsEarned
      });

      if (creditError) {
        console.error('Error updating credits:', creditError);
      }
    }

    console.log('Newly earned badges:', newlyEarnedBadges.map(b => b.badge.id));

    return new Response(
      JSON.stringify({
        newBadges: newlyEarnedBadges.map(eb => eb.badge),
        creditsEarned: totalCreditsEarned,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in check-achievements:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
