import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BadgeModal } from "./BadgeModal";
import { Skeleton } from "@/components/ui/skeleton";
import type { UserBadge, Badge } from "@/hooks/useBadges";

interface BadgesSectionProps {
  userBadges: UserBadge[];
  isLoading: boolean;
  userCredits: number;
}

const rarityStyles: Record<string, string> = {
  Common: "border-muted-foreground/30 bg-muted/30 hover:bg-muted/50",
  Uncommon: "border-green-500/30 bg-green-500/10 hover:bg-green-500/20",
  Rare: "border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/20",
  Epic: "border-purple-500/30 bg-purple-500/10 hover:bg-purple-500/20",
  Legendary: "border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 animate-pulse",
};

const rarityTextColors: Record<string, string> = {
  Common: "text-muted-foreground",
  Uncommon: "text-green-600 dark:text-green-400",
  Rare: "text-blue-600 dark:text-blue-400",
  Epic: "text-purple-600 dark:text-purple-400",
  Legendary: "text-amber-600 dark:text-amber-400",
};

export const BadgesSection = ({ userBadges, isLoading, userCredits }: BadgesSectionProps) => {
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);
  const [selectedEarnedAt, setSelectedEarnedAt] = useState<string | null>(null);

  const handleBadgeClick = (userBadge: UserBadge) => {
    setSelectedBadge(userBadge.badge);
    setSelectedEarnedAt(userBadge.earned_at);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>🏆</span> Your Badges
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 md:grid-cols-5 gap-2">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="aspect-square rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (userBadges.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>🏆</span> Your Badges
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center text-muted-foreground py-6">
          <p>No badges earned yet.</p>
          <p className="text-sm">Complete games to unlock achievements!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <span>🏆</span> Your Badges
            </CardTitle>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <span>💰</span>
              <span className="font-medium text-foreground">{userCredits}</span>
              <span>credits</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 md:grid-cols-5 gap-2">
            {userBadges.map((userBadge) => {
              const rarity = userBadge.badge.rarity;
              const styles = rarityStyles[rarity] || rarityStyles.Common;
              const textColor = rarityTextColors[rarity] || rarityTextColors.Common;

              return (
                <button
                  key={userBadge.id}
                  onClick={() => handleBadgeClick(userBadge)}
                  className={`aspect-square rounded-lg border-2 p-2 flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${styles}`}
                  title={userBadge.badge.name}
                >
                  <span className="text-2xl md:text-3xl">🏆</span>
                  <span className={`text-xs font-medium truncate w-full text-center ${textColor}`}>
                    {userBadge.badge.name.length > 10 
                      ? userBadge.badge.name.substring(0, 10) + "..." 
                      : userBadge.badge.name}
                  </span>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <BadgeModal
        badge={selectedBadge}
        earnedAt={selectedEarnedAt}
        isOpen={!!selectedBadge}
        onClose={() => {
          setSelectedBadge(null);
          setSelectedEarnedAt(null);
        }}
      />
    </>
  );
};
