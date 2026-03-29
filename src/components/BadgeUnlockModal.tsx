import { useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge as BadgeUI } from "@/components/ui/badge";
import { getBadgeIcon } from "@/lib/badgeIcons";
import confetti from "canvas-confetti";
import type { Badge } from "@/hooks/useBadges";

interface PendingBadge {
  badge: Badge;
  earnedAt: string;
}

interface BadgeUnlockModalProps {
  pendingBadges: PendingBadge[];
  onDismiss: () => void;
}

const rarityConfig: Record<
  string,
  {
    borderClass: string;
    glowClass: string;
    iconAnimation: string;
    bgOverlay: string;
    textColor: string;
    confettiColors: string[];
    confettiCount: number;
  }
> = {
  Common: {
    borderClass: "border-muted-foreground/50",
    glowClass: "",
    iconAnimation: "animate-pop-in",
    bgOverlay: "",
    textColor: "text-muted-foreground",
    confettiColors: [],
    confettiCount: 0,
  },
  Uncommon: {
    borderClass: "border-green-500",
    glowClass: "shadow-[0_0_20px_hsl(142,76%,36%,0.3)]",
    iconAnimation: "animate-pop-in",
    bgOverlay: "bg-background",
    textColor: "text-green-600 dark:text-green-400",
    confettiColors: ["#22c55e", "#86efac"],
    confettiCount: 30,
  },
  Rare: {
    borderClass: "border-blue-500",
    glowClass: "shadow-[0_0_30px_hsl(217,91%,60%,0.4)]",
    iconAnimation: "animate-pop-in",
    bgOverlay: "bg-background",
    textColor: "text-blue-600 dark:text-blue-400",
    confettiColors: ["#3b82f6", "#93c5fd", "#60a5fa"],
    confettiCount: 50,
  },
  Epic: {
    borderClass: "border-purple-500",
    glowClass: "shadow-[0_0_40px_hsl(270,91%,65%,0.5)]",
    iconAnimation: "animate-epic-entrance",
    bgOverlay: "bg-background",
    textColor: "text-purple-600 dark:text-purple-400",
    confettiColors: ["#a855f7", "#c084fc", "#e879f9", "#f0abfc"],
    confettiCount: 100,
  },
  Legendary: {
    borderClass: "border-amber-500",
    glowClass: "shadow-[0_0_60px_hsl(45,93%,47%,0.6)]",
    iconAnimation: "animate-legendary-entrance",
    bgOverlay: "bg-gradient-to-b from-amber-500/20 via-amber-500/5 to-transparent",
    textColor: "text-amber-600 dark:text-amber-400",
    confettiColors: ["#f59e0b", "#fbbf24", "#fcd34d", "#fef3c7", "#ffffff"],
    confettiCount: 200,
  },
};

const triggerConfetti = (rarity: string) => {
  const config = rarityConfig[rarity] || rarityConfig.Common;
  if (config.confettiCount === 0) return;

  const colors = config.confettiColors;

  if (rarity === "Legendary") {
    // Epic explosion for legendary
    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

    const randomInRange = (min: number, max: number) =>
      Math.random() * (max - min) + min;

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        clearInterval(interval);
        return;
      }

      const particleCount = 50 * (timeLeft / duration);

      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        colors,
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        colors,
      });
    }, 250);

    // Initial big burst
    confetti({
      particleCount: 150,
      spread: 100,
      origin: { y: 0.6 },
      colors,
      zIndex: 9999,
    });
  } else if (rarity === "Epic") {
    // Multiple bursts for epic
    confetti({
      particleCount: config.confettiCount / 2,
      spread: 70,
      origin: { y: 0.6 },
      colors,
      zIndex: 9999,
    });
    setTimeout(() => {
      confetti({
        particleCount: config.confettiCount / 2,
        spread: 100,
        origin: { y: 0.5 },
        colors,
        zIndex: 9999,
      });
    }, 200);
  } else {
    // Simple burst for Rare and Uncommon
    confetti({
      particleCount: config.confettiCount,
      spread: 60,
      origin: { y: 0.7 },
      colors,
      zIndex: 9999,
    });
  }
};

export const BadgeUnlockModal = ({
  pendingBadges,
  onDismiss,
}: BadgeUnlockModalProps) => {
  const currentBadge = pendingBadges[0];

  useEffect(() => {
    if (currentBadge) {
      // Small delay to let the modal render before confetti
      const timer = setTimeout(() => {
        triggerConfetti(currentBadge.badge.rarity);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [currentBadge?.badge.id]);

  if (!currentBadge) return null;

  const { badge } = currentBadge;
  const rarity = rarityConfig[badge.rarity] || rarityConfig.Common;
  const IconComponent = getBadgeIcon(badge.id);
  const remainingCount = pendingBadges.length - 1;

  return (
    <Dialog open={!!currentBadge} onOpenChange={() => onDismiss()}>
      <DialogContent
        className={`
          border-2 ${rarity.borderClass} ${rarity.glowClass}
          ${rarity.bgOverlay}
          max-w-sm
        `}
      >
        <DialogHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div
              className={`
                p-6 rounded-full
                ${badge.rarity === "Legendary" ? "bg-gradient-to-br from-amber-400/20 to-amber-600/20" : ""}
                ${badge.rarity === "Epic" ? "bg-purple-500/10" : ""}
                ${badge.rarity === "Rare" ? "bg-blue-500/10" : ""}
                ${badge.rarity === "Uncommon" ? "bg-green-500/10" : ""}
                ${badge.rarity === "Common" ? "bg-muted/30" : ""}
              `}
            >
              <IconComponent
                className={`
                  w-16 h-16 md:w-20 md:h-20
                  ${rarity.textColor}
                  ${rarity.iconAnimation}
                `}
              />
            </div>
          </div>
          <DialogTitle className="text-2xl font-bold text-center">
            <span aria-hidden="true">🏆</span> Badge Unlocked!
          </DialogTitle>
          <DialogDescription className="text-center space-y-2">
            <p className={`text-xl font-semibold ${rarity.textColor}`}>
              {badge.name}
            </p>
            <p className="text-muted-foreground">{badge.description}</p>
          </DialogDescription>
        </DialogHeader>

        <div className="flex justify-center gap-2 mt-2">
          <BadgeUI
            variant="outline"
            className={`${rarity.textColor} ${rarity.borderClass.replace("border-", "border-")}`}
          >
            {badge.rarity}
          </BadgeUI>
          {badge.prize_credits > 0 && (
            <BadgeUI className="bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30">
              +{badge.prize_credits} Credits
            </BadgeUI>
          )}
        </div>

        <div className="mt-4 flex flex-col items-center gap-2">
          <Button
            onClick={onDismiss}
            size="lg"
            className={`
              w-full max-w-[200px]
              ${badge.rarity === "Legendary" ? "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-amber-950" : ""}
              ${badge.rarity === "Epic" ? "bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700" : ""}
            `}
          >
            {remainingCount > 0 ? "Next Badge" : "Claim Reward"}
          </Button>
          {remainingCount > 0 && (
            <p className="text-sm text-muted-foreground">
              +{remainingCount} more badge{remainingCount > 1 ? "s" : ""} waiting
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
