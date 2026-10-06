import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format, subDays, parseISO, differenceInDays } from "date-fns";

interface GameRecord {
  throws_count: number;
  winning_number: number;
  played_date: string;
}

const calculateStreak = (playedDates: string[]): number => {
  if (playedDates.length === 0) return 0;

  const today = format(new Date(), "yyyy-MM-dd");
  const yesterday = format(subDays(new Date(), 1), "yyyy-MM-dd");

  // Sort dates in descending order (most recent first)
  const sortedDates = [...new Set(playedDates)].sort((a, b) => 
    parseISO(b).getTime() - parseISO(a).getTime()
  );

  // Check if the most recent game was today or yesterday
  const mostRecent = sortedDates[0];
  if (mostRecent !== today && mostRecent !== yesterday) {
    return 0; // Streak broken
  }

  let streak = 1;
  for (let i = 0; i < sortedDates.length - 1; i++) {
    const current = parseISO(sortedDates[i]);
    const next = parseISO(sortedDates[i + 1]);
    const diff = differenceInDays(current, next);

    if (diff === 1) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
};

export const useGameRecords = (userId: string | null) => {
  const [todayResult, setTodayResult] = useState<GameRecord | null>(null);
  const [personalBest, setPersonalBest] = useState<number | null>(null);
  const [personalWorst, setPersonalWorst] = useState<number | null>(null);
  const [averageThrows, setAverageThrows] = useState<number | null>(null);
  const [previousAverage, setPreviousAverage] = useState<number | null>(null);
  const [favoriteNumber, setFavoriteNumber] = useState<number | null>(null);
  const [currentStreak, setCurrentStreak] = useState<number>(0);
  const [rankByAverage, setRankByAverage] = useState<number | null>(null);
  const [rankByBest, setRankByBest] = useState<number | null>(null);
  const [totalPlayers, setTotalPlayers] = useState<number | null>(null);
  const [gamesPlayed, setGamesPlayed] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [hasPlayedToday, setHasPlayedToday] = useState(false);

  const today = format(new Date(), "yyyy-MM-dd");

  const fetchRecords = async () => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    try {
      // Get today's result
      const { data: todayData } = await supabase
        .from("game_records")
        .select("throws_count, winning_number, played_date")
        .eq("user_id", userId)
        .eq("played_date", today)
        .maybeSingle();

      if (todayData) {
        setTodayResult(todayData);
        setHasPlayedToday(true);
      }

      // Get all user's records for stats calculation
      const { data: userRecords } = await supabase
        .from("game_records")
        .select("throws_count, winning_number, played_date")
        .eq("user_id", userId);

      if (userRecords && userRecords.length > 0) {
        // Set games played count
        setGamesPlayed(userRecords.length);

        // Calculate personal best
        const best = Math.min(...userRecords.map(r => r.throws_count));
        setPersonalBest(best);

        // Calculate personal worst
        const worst = Math.max(...userRecords.map(r => r.throws_count));
        setPersonalWorst(worst);

        // Calculate average
        const sum = userRecords.reduce((acc, r) => acc + r.throws_count, 0);
        const avg = sum / userRecords.length;
        setAverageThrows(Math.round(avg * 10) / 10);

        // Calculate previous average (excluding today's result)
        if (userRecords.length > 1 && todayData) {
          const previousRecords = userRecords.filter(r => r.played_date !== today);
          if (previousRecords.length > 0) {
            const prevSum = previousRecords.reduce((acc, r) => acc + r.throws_count, 0);
            const prevAvg = prevSum / previousRecords.length;
            setPreviousAverage(Math.round(prevAvg * 10) / 10);
          } else {
            setPreviousAverage(null);
          }
        } else {
          setPreviousAverage(null);
        }

        // Calculate favorite number
        const numberCounts: Record<number, number> = {};
        userRecords.forEach(r => {
          numberCounts[r.winning_number] = (numberCounts[r.winning_number] || 0) + 1;
        });
        const favorite = Object.entries(numberCounts).reduce((a, b) => 
          b[1] > a[1] ? b : a
        );
        setFavoriteNumber(parseInt(favorite[0]));

        // Calculate streak
        const playedDates = userRecords.map(r => r.played_date);
        setCurrentStreak(calculateStreak(playedDates));

        // Fetch rankings using the secure database function
        const { data: rankingData } = await supabase
          .rpc('get_player_rankings', { p_user_id: userId });

        if (rankingData && rankingData.length > 0) {
          setRankByBest(rankingData[0].rank_by_best);
          setRankByAverage(rankingData[0].rank_by_average);
          setTotalPlayers(rankingData[0].total_players);
        }
      }
    } catch (error) {
      console.error("Error fetching records:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveGameResult = async (throws: number, winningNumber: number) => {
    if (!userId) return;

    // Save the game - this is the critical path
    const { data, error } = await supabase.functions.invoke('save-game-result', {
      body: { 
        throws_count: throws, 
        winning_number: winningNumber 
      }
    });

    if (error) throw error;
    
    // Check for application-level errors from the edge function
    if (data?.error) {
      throw new Error(data.error);
    }

    // Refresh records in the background (non-blocking)
    fetchRecords().catch(console.error);
    
    return data;
  };

  useEffect(() => {
    fetchRecords();
  }, [userId]);

  return {
    todayResult,
    personalBest,
    personalWorst,
    averageThrows,
    previousAverage,
    favoriteNumber,
    currentStreak,
    rankByAverage,
    rankByBest,
    totalPlayers,
    gamesPlayed,
    isLoading,
    hasPlayedToday,
    saveGameResult,
  };
};
