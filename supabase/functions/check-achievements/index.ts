import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GameContext {
  featureUsed?: string;
  usedAction?: boolean;
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

interface GameRecord {
  played_date: string;
  winning_number: number;
  throws_count: number;
}

// Seeded random number generator using mulberry32 algorithm (must match client)
function seededRandom(seed: string): () => number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  
  return function() {
    let t = hash += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

// Generate deterministic dice values for a user on a specific date (must match client)
function getSeededDice(userId: string, date: string): number[] {
  const seed = `${userId}_${date}`;
  const rng = seededRandom(seed);
  return Array(10).fill(null).map(() => Math.floor(rng() * 6) + 1);
}

// Calculate streak from played dates
function calculateStreak(playedDates: string[]): number {
  if (playedDates.length === 0) return 0;

  // Sort dates descending (most recent first)
  const sortedDates = [...playedDates].sort((a, b) => 
    new Date(b).getTime() - new Date(a).getTime()
  );

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const mostRecentDate = new Date(sortedDates[0]);
  mostRecentDate.setHours(0, 0, 0, 0);

  // Most recent game must be today or yesterday to count
  if (mostRecentDate < yesterday) {
    return 0;
  }

  let streak = 1;
  let currentDate = mostRecentDate;

  for (let i = 1; i < sortedDates.length; i++) {
    const prevDate = new Date(sortedDates[i]);
    prevDate.setHours(0, 0, 0, 0);

    const expectedPrevDate = new Date(currentDate);
    expectedPrevDate.setDate(expectedPrevDate.getDate() - 1);

    if (prevDate.getTime() === expectedPrevDate.getTime()) {
      streak++;
      currentDate = prevDate;
    } else if (prevDate.getTime() < expectedPrevDate.getTime()) {
      break;
    }
    // Skip duplicates (same day)
  }

  return streak;
}

// Check if today is Friday the 13th
function isFriday13(date: Date): boolean {
  return date.getDay() === 5 && date.getDate() === 13;
}

// Check for consecutive days with same winning number
function getConsecutiveSameWinCount(games: GameRecord[]): number {
  if (games.length < 2) return games.length;
  
  // Sort by date descending (most recent first)
  const sorted = [...games].sort((a, b) => 
    new Date(b.played_date).getTime() - new Date(a.played_date).getTime()
  );
  
  let count = 1;
  const targetNumber = sorted[0].winning_number;
  
  for (let i = 1; i < sorted.length; i++) {
    const prevDate = new Date(sorted[i - 1].played_date);
    const currDate = new Date(sorted[i].played_date);
    
    // Check if consecutive day
    const dayDiff = Math.floor((prevDate.getTime() - currDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (dayDiff === 1 && sorted[i].winning_number === targetNumber) {
      count++;
    } else {
      break;
    }
  }
  
  return count;
}

// Count how many times a specific number was won
function getWinCountForNumber(games: GameRecord[], number: number): number {
  return games.filter(g => g.winning_number === number).length;
}

// Get max wins for any single number
function getMaxWinsForAnyNumber(games: GameRecord[]): number {
  const counts: Record<number, number> = {};
  games.forEach(g => {
    counts[g.winning_number] = (counts[g.winning_number] || 0) + 1;
  });
  return Math.max(...Object.values(counts), 0);
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

    // Parse minimal client context (only used for share feature)
    const clientContext: GameContext = await req.json();
    console.log('Client context received:', clientContext);

    // Get today's date in various formats (server-side, cannot be spoofed)
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const playDateForBadges = now.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit' }).replace('/', '-');
    
    console.log('Server date:', today, 'Badge date:', playDateForBadges);

    // Fetch today's game from database (verified data)
    const { data: todayGame, error: gameError } = await supabase
      .from('game_records')
      .select('throws_count, winning_number')
      .eq('user_id', userId)
      .eq('played_date', today)
      .maybeSingle();

    if (gameError) {
      console.error('Error fetching today game:', gameError);
      throw gameError;
    }

    // Fetch all user's games for calculations
    const { data: allGames, error: allGamesError } = await supabase
      .from('game_records')
      .select('played_date, winning_number, throws_count')
      .eq('user_id', userId)
      .order('played_date', { ascending: false });

    if (allGamesError) {
      console.error('Error fetching all games:', allGamesError);
      throw allGamesError;
    }

    const typedGames: GameRecord[] = allGames || [];
    const totalGamesPlayed = typedGames.length;

    // Calculate verified values server-side
    const verifiedThrows = todayGame?.throws_count ?? 0;
    const verifiedWinningNumber = todayGame?.winning_number ?? 0;
    const verifiedStreak = calculateStreak(typedGames.map(g => g.played_date));
    const isFirstGame = typedGames.length === 1 && todayGame !== null;
    const verifiedInitialDice = getSeededDice(userId, today);
    
    // Calculate performance metrics
    const gamesExcludingToday = typedGames.filter(g => g.played_date !== today);
    const previousAverage = gamesExcludingToday.length > 0 
      ? gamesExcludingToday.reduce((sum, g) => sum + g.throws_count, 0) / gamesExcludingToday.length 
      : null;
    const previousBest = gamesExcludingToday.length > 0 
      ? Math.min(...gamesExcludingToday.map(g => g.throws_count)) 
      : null;
    
    // Check if user has won with all 6 numbers
    const allWinningNumbers = new Set(typedGames.map(g => g.winning_number));
    const hasAllSixNumbers = [1, 2, 3, 4, 5, 6].every(n => allWinningNumbers.has(n));
    
    // Consistency calculations
    const consecutiveSameWins = getConsecutiveSameWinCount(typedGames);
    const maxWinsForAnyNumber = getMaxWinsForAnyNumber(typedGames);

    console.log('Verified values:', {
      throws: verifiedThrows,
      winningNumber: verifiedWinningNumber,
      streak: verifiedStreak,
      isFirstGame,
      totalGamesPlayed,
      previousAverage,
      previousBest,
      consecutiveSameWins,
      maxWinsForAnyNumber,
    });

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

    // Fetch user purchases for shop badges
    const { data: userPurchases, error: purchasesError } = await supabase
      .from('user_purchases')
      .select('item_id')
      .eq('user_id', userId);

    if (purchasesError) {
      console.error('Error fetching purchases:', purchasesError);
    }

    const purchasedItems = userPurchases || [];
    const SKIN_ITEM_IDS = ['golden_dice', 'diamond_dice', 'german_supermarket_dice'];
    const skinCount = purchasedItems.filter(p => SKIN_ITEM_IDS.includes(p.item_id)).length;

    // Count share badges to track share count
    const shareBadgeCount = existingUserBadges?.filter(ub => ub.badge_id === 'special_share').length || 0;

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

      // Insert the badge (using service role, bypasses RLS)
      const { error: insertError } = await supabase
        .from('user_badges')
        .insert({ user_id: userId, badge_id: badgeId, earned_at: new Date().toISOString() });

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

    // Only check game-related badges if user has played today AND this call isn't
    // coming from a client feature action (like sharing).
    if (todayGame && clientContext.featureUsed !== 'share') {
      // Check first_win (first game ever)
      await checkAndAwardBadge('first_win', isFirstGame);

      // Check winning_number badges (win_1 through win_6)
      await checkAndAwardBadge(`win_${verifiedWinningNumber}`, verifiedWinningNumber >= 1 && verifiedWinningNumber <= 6);

      // Check winning_throw_count badges (throws_1 through throws_6)
      if (verifiedThrows >= 1 && verifiedThrows <= 6) {
        await checkAndAwardBadge(`throws_${verifiedThrows}`, true);
      }

      // Check starter_match badges (5-10 matching dice on first throw)
      const diceCounts: Record<number, number> = {};
      verifiedInitialDice.forEach(d => {
        diceCounts[d] = (diceCounts[d] || 0) + 1;
      });
      const maxMatch = Math.max(...Object.values(diceCounts));
      console.log('Initial dice max match:', maxMatch);
      
      // Award applicable starter badges (from highest to lowest to get all)
      for (let i = 10; i >= 5; i--) {
        if (maxMatch >= i) {
          await checkAndAwardBadge(`starter_${i}`, true);
        }
      }

      // Check daily_streak milestone badges (3, 7, 10, 30, 50, 100, 200, 365)
      const streakMilestones = [3, 7, 10, 30, 50, 100, 200, 365];
      for (const milestone of streakMilestones) {
        if (verifiedStreak >= milestone) {
          await checkAndAwardBadge(`streak_${milestone}`, true);
        }
      }

      // Check daily streak_add (repeatable daily reward, but only once per day)
      const { data: todayStreakBadge } = await supabase
        .from('user_badges')
        .select('id')
        .eq('user_id', userId)
        .eq('badge_id', 'daily_streak')
        .gte('earned_at', today)
        .maybeSingle();

      if (verifiedStreak >= 1 && !todayStreakBadge) {
        await checkAndAwardBadge('daily_streak', true, true);
      }

      // Check date_match badges
      const dateMatches: Record<string, string> = {
        '09-09': 'special_date_birthday',
        '01-01': 'special_date_ny',
        '12-25': 'special_date_xmas',
        '02-14': 'special_date_valentine',
        '03-17': 'special_date_stpatrick',
        '10-31': 'special_date_halloween',
        '02-29': 'special_date_leap',
        '06-21': 'special_date_summer',
        '12-21': 'special_date_winter',
      };
      if (dateMatches[playDateForBadges]) {
        await checkAndAwardBadge(dateMatches[playDateForBadges], true);
      }
      
      // Check Friday the 13th
      if (isFriday13(now)) {
        await checkAndAwardBadge('special_date_friday13', true);
      }

      // Check jack_of_all_dice (won with all 6 numbers)
      await checkAndAwardBadge('jack_of_all_dice', hasAllSixNumbers);

      // === MILESTONE BADGES (total games played) ===
      const gameMilestones = [10, 50, 100, 365, 1000];
      for (const milestone of gameMilestones) {
        if (totalGamesPlayed >= milestone) {
          await checkAndAwardBadge(`games_${milestone}`, true);
        }
      }

      // === PERFORMANCE BADGES ===
      // Under par: beat your average (repeatable)
      if (previousAverage !== null && verifiedThrows < previousAverage) {
        await checkAndAwardBadge('under_par', true, true);
      }
      
      // Personal record: beat your best (repeatable)
      if (previousBest !== null && verifiedThrows < previousBest) {
        await checkAndAwardBadge('personal_record', true, true);
      }

      // === CONSISTENCY BADGES ===
      // Groundhog Day: 3 consecutive days with same number
      if (consecutiveSameWins >= 3) {
        await checkAndAwardBadge('groundhog_day', true);
      }
      
      // Lucky Number: win with same number 5 times total
      if (maxWinsForAnyNumber >= 5) {
        await checkAndAwardBadge('lucky_number', true);
      }
      
      // Master of One: win with same number 10 times total
      if (maxWinsForAnyNumber >= 10) {
        await checkAndAwardBadge('master_of_one', true);
      }

      // === SHOP BADGES ===
      // First Purchase
      if (purchasedItems.length >= 1) {
        await checkAndAwardBadge('first_purchase', true);
      }
      
      // Skin Collector badges
      if (skinCount >= 3) {
        await checkAndAwardBadge('skin_collector_3', true);
      }
      if (skinCount >= 5) {
        await checkAndAwardBadge('skin_collector_5', true);
      }
      
      // === ACTION BADGES ===
      // Action Hero: won using shake or blow action
      if (clientContext.usedAction === true) {
        await checkAndAwardBadge('action_hero', true);
      }
    }

    // Check feature_used (share feature) - this is the only client-trusted value
    if (clientContext.featureUsed === 'share') {
      // Award the share badge (non-repeatable - only once)
      await checkAndAwardBadge('special_share', true, false);
      
      // Share count milestones are also non-repeatable
      if (shareBadgeCount >= 5) {
        await checkAndAwardBadge('share_5', true);
      }
      if (shareBadgeCount >= 10) {
        await checkAndAwardBadge('share_10', true);
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
