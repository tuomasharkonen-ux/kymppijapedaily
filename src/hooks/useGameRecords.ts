import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface GameRecord {
  throws_count: number;
  winning_number: number;
  played_date: string;
}

export const useGameRecords = (userId: string | null) => {
  const [todayResult, setTodayResult] = useState<GameRecord | null>(null);
  const [personalBest, setPersonalBest] = useState<number | null>(null);
  const [favoriteNumber, setFavoriteNumber] = useState<number | null>(null);
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

      // Get personal best
      const { data: bestData } = await supabase
        .from("game_records")
        .select("throws_count")
        .eq("user_id", userId)
        .order("throws_count", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (bestData) {
        setPersonalBest(bestData.throws_count);
      }

      // Get favorite number (most used)
      const { data: allRecords } = await supabase
        .from("game_records")
        .select("winning_number")
        .eq("user_id", userId);

      if (allRecords && allRecords.length > 0) {
        const numberCounts: Record<number, number> = {};
        allRecords.forEach(r => {
          numberCounts[r.winning_number] = (numberCounts[r.winning_number] || 0) + 1;
        });
        const favorite = Object.entries(numberCounts).reduce((a, b) => 
          b[1] > a[1] ? b : a
        );
        setFavoriteNumber(parseInt(favorite[0]));
      }
    } catch (error) {
      console.error("Error fetching records:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveGameResult = async (throws: number, winningNumber: number) => {
    if (!userId) return;

    try {
      const { error } = await supabase.from("game_records").insert({
        user_id: userId,
        throws_count: throws,
        winning_number: winningNumber,
        played_date: today,
      });

      if (error) throw error;

      // Refresh records after saving
      await fetchRecords();
    } catch (error) {
      console.error("Error saving game result:", error);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [userId]);

  return {
    todayResult,
    personalBest,
    favoriteNumber,
    isLoading,
    hasPlayedToday,
    saveGameResult,
  };
};
