import { useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Coins } from "lucide-react";
import confetti from "canvas-confetti";
import type { ShopItem } from "@/lib/shopItems";
import { DicePreview } from "@/components/DicePreview";
import { ActionPreview } from "@/components/ActionPreview";
import type { DiceSkin } from "@/components/Dice";

interface PurchaseSuccessModalProps {
  item: ShopItem | null;
  isOpen: boolean;
  onClose: () => void;
  newBalance: number;
}

// Item-specific confetti colors
const itemConfettiColors: Record<string, string[]> = {
  golden_dice: ["#f59e0b", "#fbbf24", "#fcd34d", "#fef3c7"],
  diamond_dice: ["#06b6d4", "#22d3ee", "#a855f7", "#c084fc"],
  german_supermarket_dice: ["#eab308", "#3b82f6", "#ef4444"],
  shake_dice_action: ["#f97316", "#fb923c", "#fdba74"],
  blow_dice_action: ["#0ea5e9", "#38bdf8", "#7dd3fc"],
};

const triggerPurchaseConfetti = (itemId: string) => {
  const colors = itemConfettiColors[itemId] || ["#22c55e", "#86efac", "#4ade80"];

  // Initial burst from center
  confetti({
    particleCount: 60,
    spread: 70,
    origin: { y: 0.6, x: 0.5 },
    colors,
    zIndex: 9999,
  });

  // Delayed side bursts
  setTimeout(() => {
    confetti({
      particleCount: 30,
      angle: 60,
      spread: 55,
      origin: { x: 0.2, y: 0.6 },
      colors,
      zIndex: 9999,
    });
    confetti({
      particleCount: 30,
      angle: 120,
      spread: 55,
      origin: { x: 0.8, y: 0.6 },
      colors,
      zIndex: 9999,
    });
  }, 150);
};

export const PurchaseSuccessModal = ({
  item,
  isOpen,
  onClose,
  newBalance,
}: PurchaseSuccessModalProps) => {
  useEffect(() => {
    if (isOpen && item) {
      const timer = setTimeout(() => {
        triggerPurchaseConfetti(item.id);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [isOpen, item?.id]);

  if (!item) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-sm border-2 border-primary/50 shadow-[0_0_30px_hsl(var(--primary)/0.3)]">
        <DialogHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-4 rounded-xl bg-primary/10 animate-scale-in">
              {item.category === "skin" ? (
                <DicePreview skin={item.id as DiceSkin} />
              ) : (
                <ActionPreview
                  actionId={item.id as "shake_dice_action" | "blow_dice_action"}
                />
              )}
            </div>
          </div>
          <DialogTitle className="text-2xl font-bold text-center animate-fade-in">
            <span aria-hidden="true">🎉</span> Purchase Complete!
          </DialogTitle>
          <DialogDescription className="text-center space-y-2">
            <p className="text-lg font-semibold text-primary">{item.name}</p>
            <p className="text-muted-foreground">
              You've unlocked this item and can now use it in your games!
            </p>
          </DialogDescription>
        </DialogHeader>

        <div className="flex justify-center gap-2 mt-2">
          <Badge
            variant="outline"
            className="border-primary/50 text-primary"
          >
            {item.category === "skin" ? "🎨 Dice Skin" : "🎬 Action"}
          </Badge>
        </div>

        <div className="mt-4 p-3 rounded-lg bg-muted/50 flex items-center justify-between">
          <span className="text-sm text-muted-foreground">New Balance</span>
          <div className="flex items-center gap-1 font-bold text-foreground">
            <Coins className="w-4 h-4 text-primary" aria-hidden="true" />
            {newBalance} credits
          </div>
        </div>

        <div className="mt-4">
          <Button onClick={onClose} size="lg" className="w-full">
            <span aria-hidden="true">✨</span>
            <span className="ml-2">Awesome!</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
