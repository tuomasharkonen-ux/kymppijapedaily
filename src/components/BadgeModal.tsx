import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { getBadgeIcon } from "@/lib/badgeIcons";
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
  share_count: "Share your results multiple times",
  first_purchase: "Make your first shop purchase",
  skin_collection: "Collect dice skins from the shop",
  repeat_win: "Win with the same number on consecutive days",
  win_count_same: "Win with the same number multiple times",
  under_par: "Beat your personal average",
  personal_best: "Set a new personal best score",
  total_games: "Play a certain number of games",
  action_win: "Win using a shake or blow action",
  helldivers_stratagem: "Win with a specific number while using the Helldivers dice",
  helldivers_all_stratagems: "Win with all six numbers while using the Helldivers dice",
};

export const BadgeModal = ({ badge, earnedAt, isOpen, onClose }: BadgeModalProps) => {
  if (!badge) return null;

  const rarity = rarityConfig[badge.rarity] || rarityConfig.Common;
  const IconComponent = getBadgeIcon(badge.id);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`bg-background border ${rarity.borderColor}`}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <IconComponent className={`w-8 h-8 ${rarity.color}`} />
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
