import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import type { Badge as BadgeType } from "@/hooks/useBadges";

interface BadgeModalProps {
  badge: BadgeType | null;
  earnedAt: string | null;
  isOpen: boolean;
  onClose: () => void;
}

const rarityConfig: Record<string, { color: string; borderColor: string }> = {
  Common: { 
    color: "text-muted-foreground", 
    borderColor: "border-muted-foreground/30"
  },
  Uncommon: { 
    color: "text-green-600 dark:text-green-400", 
    borderColor: "border-green-500/30"
  },
  Rare: { 
    color: "text-blue-600 dark:text-blue-400", 
    borderColor: "border-blue-500/30"
  },
  Epic: { 
    color: "text-purple-600 dark:text-purple-400", 
    borderColor: "border-purple-500/30"
  },
  Legendary: { 
    color: "text-amber-600 dark:text-amber-400", 
    borderColor: "border-amber-500/30"
  },
};

const triggerTypeLabels: Record<string, string> = {
  streak_add: "Play daily to maintain your streak",
  win_game: "Complete a game",
  winning_number: "Win with a specific number",
  daily_streak: "Maintain a streak milestone",
  starter_match: "Get matching dice on first throw",
  winning_throw_count: "Win with a specific throw count",
  feature_used: "Use a game feature",
  date_match: "Play on a special date",
  locked_numbers: "Lock specific numbers before rolling",
};

export const BadgeModal = ({ badge, earnedAt, isOpen, onClose }: BadgeModalProps) => {
  if (!badge) return null;

  const rarity = rarityConfig[badge.rarity] || rarityConfig.Common;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`bg-background border ${rarity.borderColor}`}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-3xl">🏆</span>
            <span className={rarity.color}>{badge.name}</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <p className="text-foreground">{badge.description}</p>
          
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className={rarity.color}>
              {badge.rarity}
            </Badge>
            <Badge variant="secondary">
              +{badge.prize_credits} credits
            </Badge>
          </div>

          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              <span className="font-medium">How to earn:</span>{" "}
              {triggerTypeLabels[badge.trigger_type] || badge.trigger_type}
            </p>
            
            {earnedAt && (
              <p>
                <span className="font-medium">Earned:</span>{" "}
                {format(new Date(earnedAt), "MMMM d, yyyy 'at' h:mm a")}
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
