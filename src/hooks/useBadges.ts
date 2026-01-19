import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";

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

interface GameContext {
  throws: number;
  winningNumber: number;
  initialDice: number[];
  currentStreak: number;
  isFirstGame: boolean;
  lockedNumbers?: number[];
  featureUsed?: string;
  playDate: string;
}

export const useBadges = (userId: string | null) => {
  const [userBadges, setUserBadges] = useState<UserBadge[]>([]);
  const [allBadges, setAllBadges] = useState<Badge[]>([]);
  const [userCredits, setUserCredits] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

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

  const showBadgeToast = (badge: Badge) => {
    toast.success(`🏆 Badge Unlocked: ${badge.name} (+${badge.prize_credits} credits)`, {
      duration: 5000,
      position: "bottom-center",
    });
  };

  const checkAndAwardBadges = useCallback(async (context: Omit<GameContext, "playDate">) => {
    if (!userId) return;

    const playDate = format(new Date(), "MM-dd");
    const fullContext: GameContext = { ...context, playDate };

    try {
      const { data, error } = await supabase.functions.invoke("check-achievements", {
        body: fullContext,
      });

      if (error) {
        console.error("Error checking achievements:", error);
        return;
      }

      // Show toast for each new badge
      if (data?.newBadges && data.newBadges.length > 0) {
        data.newBadges.forEach((badge: Badge) => {
          showBadgeToast(badge);
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
      const playDate = format(new Date(), "MM-dd");
      const { data, error } = await supabase.functions.invoke("check-achievements", {
        body: {
          throws: 0,
          winningNumber: 0,
          initialDice: [],
          currentStreak: 0,
          isFirstGame: false,
          featureUsed: "share",
          playDate,
        },
      });

      if (error) {
        console.error("Error checking share achievement:", error);
        return;
      }

      if (data?.newBadges && data.newBadges.length > 0) {
        data.newBadges.forEach((badge: Badge) => {
          showBadgeToast(badge);
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
  };
};
