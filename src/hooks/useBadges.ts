import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Badge {
  id: string;
  name: string;
  description: string;
  trigger_type: string;
  trigger_value: string | null;
  prize_credits: number;
  rarity: string;
}

export interface UserBadge {
  id: string;
  badge_id: string;
  earned_at: string;
  badge: Badge;
}

interface PendingBadge {
  badge: Badge;
  earnedAt: string;
}

export const useBadges = (userId: string | null) => {
  const [userBadges, setUserBadges] = useState<UserBadge[]>([]);
  const [allBadges, setAllBadges] = useState<Badge[]>([]);
  const [userCredits, setUserCredits] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingBadges, setPendingBadges] = useState<PendingBadge[]>([]);

  const fetchBadges = useCallback(async () => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    try {
      // Fetch all badge definitions
      const { data: badgesData, error: badgesError } = await supabase
        .from("badges")
        .select("*");

      if (badgesError) throw badgesError;
      setAllBadges(badgesData || []);

      // Fetch user's earned badges
      const { data: userBadgesData, error: userBadgesError } = await supabase
        .from("user_badges")
        .select("id, badge_id, earned_at")
        .eq("user_id", userId)
        .order("earned_at", { ascending: false });

      if (userBadgesError) throw userBadgesError;

      // Combine with badge details
      const enrichedBadges: UserBadge[] = (userBadgesData || []).map((ub) => {
        const badge = badgesData?.find((b) => b.id === ub.badge_id);
        return {
          ...ub,
          badge: badge!,
        };
      }).filter(ub => ub.badge);

      setUserBadges(enrichedBadges);

      // Fetch user credits
      const { data: creditsData } = await supabase
        .from("user_credits")
        .select("balance")
        .eq("user_id", userId)
        .single();

      setUserCredits(creditsData?.balance || 0);

    } catch (error) {
      console.error("Error fetching badges:", error);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  const queueBadge = (badge: Badge) => {
    setPendingBadges((prev) => [...prev, { badge, earnedAt: new Date().toISOString() }]);
  };

  const dismissBadge = () => {
    setPendingBadges((prev) => prev.slice(1));
  };

  const checkAndAwardBadges = useCallback(async () => {
    if (!userId) return;

    try {
      // Server validates all game data from database - no client data needed
      const { data, error } = await supabase.functions.invoke("check-achievements", {
        body: {},
      });

      if (error) {
        console.error("Error checking achievements:", error);
        return;
      }

      // Queue each new badge for the unlock modal
      if (data?.newBadges && data.newBadges.length > 0) {
        data.newBadges.forEach((badge: Badge) => {
          queueBadge(badge);
        });

        // Refresh badges after earning new ones
        await fetchBadges();
      }

      return data;
    } catch (error) {
      console.error("Error in checkAndAwardBadges:", error);
    }
  }, [userId, fetchBadges]);

  const checkShareFeature = useCallback(async () => {
    if (!userId) return;

    try {
      const { data, error } = await supabase.functions.invoke("check-achievements", {
        body: {
          featureUsed: "share",
        },
      });

      if (error) {
        console.error("Error checking share achievement:", error);
        return;
      }

      if (data?.newBadges && data.newBadges.length > 0) {
        data.newBadges.forEach((badge: Badge) => {
          queueBadge(badge);
        });

        await fetchBadges();
      }
    } catch (error) {
      console.error("Error in checkShareFeature:", error);
    }
  }, [userId, fetchBadges]);

  useEffect(() => {
    fetchBadges();
  }, [fetchBadges]);

  // Get unique badges (deduplicate for badges earned multiple times)
  const uniqueBadges = userBadges.reduce((acc, current) => {
    const exists = acc.find(item => item.badge_id === current.badge_id);
    if (!exists) {
      acc.push(current);
    }
    return acc;
  }, [] as UserBadge[]);

  return {
    userBadges: uniqueBadges,
    allBadges,
    userCredits,
    isLoading,
    checkAndAwardBadges,
    checkShareFeature,
    refetchBadges: fetchBadges,
    pendingBadges,
    dismissBadge,
  };
};
