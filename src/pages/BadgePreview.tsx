import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BadgeModal } from "@/components/BadgeModal";
import { BadgeUnlockModal } from "@/components/BadgeUnlockModal";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { getBadgeIcon } from "@/lib/badgeIcons";
import { ArrowLeft, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import type { Badge } from "@/hooks/useBadges";

const rarityOrder = ["Legendary", "Epic", "Rare", "Uncommon", "Common"];

const rarityStyles: Record<string, string> = {
  Common: "border-muted-foreground/30 hover:border-muted-foreground/50",
  Uncommon: "border-green-500/30 hover:border-green-500/60",
  Rare: "border-blue-500/30 hover:border-blue-500/60",
  Epic: "border-purple-500/30 hover:border-purple-500/60",
  Legendary: "border-amber-500/30 hover:border-amber-500/60",
};

const rarityTextColors: Record<string, string> = {
  Common: "text-muted-foreground",
  Uncommon: "text-green-600 dark:text-green-400",
  Rare: "text-blue-600 dark:text-blue-400",
  Epic: "text-purple-600 dark:text-purple-400",
  Legendary: "text-amber-600 dark:text-amber-400",
};

interface PendingBadge {
  badge: Badge;
  earnedAt: string;
}

const BadgePreview = () => {
  const [badges, setBadges] = useState<Badge[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showUnlockModal, setShowUnlockModal] = useState(true);
  
  // For BadgeModal (details view)
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);
  
  // For BadgeUnlockModal (celebration view)
  const [pendingBadges, setPendingBadges] = useState<PendingBadge[]>([]);

  useEffect(() => {
    const fetchBadges = async () => {
      const { data, error } = await supabase
        .from("badges")
        .select("*")
        .order("rarity");
      
      if (!error && data) {
        setBadges(data);
      }
      setIsLoading(false);
    };
    
    fetchBadges();
  }, []);

  const handleBadgeClick = (badge: Badge) => {
    if (showUnlockModal) {
      setPendingBadges([{ badge, earnedAt: new Date().toISOString() }]);
    } else {
      setSelectedBadge(badge);
    }
  };

  const handleDismissUnlock = () => {
    setPendingBadges((prev) => prev.slice(1));
  };

  const handleQueueByRarity = (rarity: string) => {
    const rarityBadges = badges.filter((b) => b.rarity === rarity);
    const pending = rarityBadges.map((badge) => ({
      badge,
      earnedAt: new Date().toISOString(),
    }));
    setPendingBadges(pending);
  };

  const handleQueueAll = () => {
    const sortedBadges = [...badges].sort(
      (a, b) => rarityOrder.indexOf(a.rarity) - rarityOrder.indexOf(b.rarity)
    );
    const pending = sortedBadges.map((badge) => ({
      badge,
      earnedAt: new Date().toISOString(),
    }));
    setPendingBadges(pending);
  };

  // Group badges by rarity
  const badgesByRarity = rarityOrder.reduce((acc, rarity) => {
    acc[rarity] = badges.filter((b) => b.rarity === rarity);
    return acc;
  }, {} as Record<string, Badge[]>);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading badges...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Game</span>
          </Link>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Badge Preview</h1>
          <p className="text-muted-foreground">
            Test badge modals without earning them. Click any badge to preview.
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-4 p-4 bg-muted/30 rounded-lg border border-border">
          <div className="flex items-center gap-2">
            <Switch
              id="modal-type"
              checked={showUnlockModal}
              onCheckedChange={setShowUnlockModal}
            />
            <Label htmlFor="modal-type" className="cursor-pointer">
              {showUnlockModal ? (
                <span className="flex items-center gap-1">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  Unlock Modal (with confetti)
                </span>
              ) : (
                "Details Modal"
              )}
            </Label>
          </div>
          
          <div className="flex-1" />
          
          <Button variant="outline" size="sm" onClick={handleQueueAll}>
            Queue All Badges
          </Button>
        </div>

        {/* Quick queue buttons */}
        <div className="flex flex-wrap gap-2">
          {rarityOrder.map((rarity) => {
            const count = badgesByRarity[rarity]?.length || 0;
            if (count === 0) return null;
            return (
              <Button
                key={rarity}
                variant="outline"
                size="sm"
                onClick={() => handleQueueByRarity(rarity)}
                className={`${rarityStyles[rarity]} ${rarityTextColors[rarity]}`}
              >
                Queue {rarity} ({count})
              </Button>
            );
          })}
        </div>

        {/* Badge grid by rarity */}
        {rarityOrder.map((rarity) => {
          const rarityBadges = badgesByRarity[rarity];
          if (!rarityBadges?.length) return null;

          return (
            <div key={rarity} className="space-y-3">
              <h2 className={`text-lg font-semibold ${rarityTextColors[rarity]}`}>
                {rarity} ({rarityBadges.length})
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {rarityBadges.map((badge) => {
                  const IconComponent = getBadgeIcon(badge.id);
                  return (
                    <button
                      key={badge.id}
                      onClick={() => handleBadgeClick(badge)}
                      className={`
                        p-4 rounded-lg border-2 transition-all duration-200
                        bg-background hover:bg-muted/50
                        ${rarityStyles[badge.rarity]}
                        flex flex-col items-center gap-2 text-center
                      `}
                    >
                      <IconComponent className={`w-8 h-8 ${rarityTextColors[badge.rarity]}`} />
                      <span className="text-sm font-medium truncate w-full">
                        {badge.name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        +{badge.prize_credits} credits
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modals */}
      <BadgeModal
        badge={selectedBadge}
        earnedAt={selectedBadge ? new Date().toISOString() : null}
        isOpen={!!selectedBadge}
        onClose={() => setSelectedBadge(null)}
      />

      <BadgeUnlockModal
        pendingBadges={pendingBadges}
        onDismiss={handleDismissUnlock}
      />
    </div>
  );
};

export default BadgePreview;
