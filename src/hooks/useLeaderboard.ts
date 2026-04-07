import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface LeaderboardEntry {
  rank: number;
  user_id: string;
  username: string;
  best_throws: number;
  avg_throws: number;
  games_played: number;
  current_streak: number;
}

export const useLeaderboard = (sortBy: "best" | "average") => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLeaderboard = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase.rpc("get_leaderboard", {
        p_sort_by: sortBy,
        p_limit: 50,
      });

      if (fetchError) {
        setError(fetchError.message);
      } else {
        setLeaderboard(data || []);
      }
    } catch (err) {
      setError("Failed to fetch leaderboard");
    } finally {
      setIsLoading(false);
    }
  }, [sortBy]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  return {
    leaderboard,
    isLoading,
    error,
    refetch: fetchLeaderboard,
  };
};
