import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Check, Loader2, Coins } from "lucide-react";
import type { ShopItem } from "@/lib/shopItems";
import { DicePreview } from "@/components/DicePreview";
import { ActionPreview } from "@/components/ActionPreview";
import { ThrowAnimationPreview } from "@/components/ThrowAnimationPreview";
import { BackgroundPreview } from "@/components/BackgroundPreview";

import type { DiceSkin } from "@/components/Dice";
import type { ThrowAnimationStyle } from "@/lib/animations";

interface PurchaseResult {
  success: boolean;
  itemId?: string;
  itemName?: string;
  newBalance?: number;
  error?: string;
}

interface ShopItemModalProps {
  item: ShopItem | null;
  isOpen: boolean;
  onClose: () => void;
  isOwned: boolean;
  canAfford: boolean;
  onPurchase: (itemId: string) => Promise<PurchaseResult>;
  isPurchasing: boolean;
  onPurchaseSuccess: (newBalance: number) => void;
}

export const ShopItemModal = ({
  item,
  isOpen,
  onClose,
  isOwned,
  canAfford,
  onPurchase,
  isPurchasing,
  onPurchaseSuccess,
}: ShopItemModalProps) => {
  const [showConfirm, setShowConfirm] = useState(false);
  

  if (!item) return null;

  const handlePurchaseClick = () => {
    setShowConfirm(true);
  };

  const handleConfirmPurchase = async () => {
    const result = await onPurchase(item.id);
    
    if (result.success) {
      onPurchaseSuccess(result.newBalance ?? 0);
      setShowConfirm(false);
      onClose();
    } else {
      toast({
        title: "Purchase failed",
        description: result.error || "Something went wrong",
        variant: "destructive",
      });
      setShowConfirm(false);
    }
  };

  const handleCancel = () => {
    setShowConfirm(false);
  };

  const handleClose = () => {
    setShowConfirm(false);
    onClose();
  };

  const renderPreview = () => {
    switch (item.category) {
      case "skin":
        return <DicePreview skin={item.id as DiceSkin} />;
      case "action":
        return <ActionPreview actionId={item.id as "shake_dice_action" | "blow_dice_action" | "insult_dice_action"} />;
      case "throw_animation":
        return <ThrowAnimationPreview animationId={item.id as ThrowAnimationStyle} />;
      case "background":
        return <BackgroundPreview backgroundId={item.id} />;
      default:
        return null;
    }
  };

  const getCategoryLabel = () => {
    switch (item.category) {
      case "skin":
        return "🎨 Dice Skin";
      case "action":
        return "🎬 Special Action";
      case "throw_animation":
        return "⚡ Throw Animation";
      case "background":
        return "🖼️ Game Background";
      default:
        return "";
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <span className="text-2xl" aria-hidden="true">{item.emoji}</span>
              {item.name}
              {isOwned && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-primary text-primary-foreground ml-2">
                  Owned
                </span>
              )}
            </DialogTitle>
            <DialogDescription className="sr-only">
              Details about {item.name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* In-game preview */}
            <div className="bg-muted/50 rounded-lg p-6 flex items-center justify-center min-h-[100px]">
              {renderPreview()}
            </div>
            
            {/* Long description */}
            <div className="space-y-2">
              <p className="text-sm text-foreground leading-relaxed">
                {item.longDescription}
              </p>
            </div>
            
            {/* Category badge */}
            <div className="flex items-center gap-2">
              <span className="text-xs px-2 py-1 rounded-full bg-muted/50 text-muted-foreground">
                {getCategoryLabel()}
              </span>
            </div>
            
            {/* Price and action */}
            <div className="flex items-center justify-between pt-2 border-t">
              {isOwned ? (
                <>
                  <div className="text-sm text-muted-foreground">
                    You own this item
                  </div>
                  <Button variant="secondary" disabled>
                    <Check className="w-4 h-4 mr-1" />
                    Owned
                  </Button>
                </>
              ) : showConfirm ? (
                <div className="flex flex-col w-full gap-3">
                  <div className="text-sm text-foreground text-center p-3 bg-muted/50 rounded-lg">
                    <p className="font-medium">Confirm Purchase</p>
                    <p className="text-muted-foreground mt-1">
                      Spend <span className="font-bold text-primary">{item.price}</span> credits on {item.name}?
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={handleCancel}
                      disabled={isPurchasing}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="default"
                      className="flex-1"
                      onClick={handleConfirmPurchase}
                      disabled={isPurchasing}
                    >
                      {isPurchasing ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                          Buying...
                        </>
                      ) : (
                        <>
                          <Coins className="w-4 h-4 mr-1" />
                          Confirm
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="text-lg font-bold text-foreground flex items-center gap-1">
                    <Coins className="w-5 h-5 text-primary" />
                    {item.price} credits
                  </div>
                  <Button
                    variant={canAfford ? "default" : "secondary"}
                    disabled={!canAfford}
                    onClick={handlePurchaseClick}
                  >
                    {canAfford ? "Unlock Now" : "Not enough credits"}
                  </Button>
                </>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <BackgroundFullPreview
        backgroundId={item.id}
        isOpen={showBgPreview}
        onClose={() => setShowBgPreview(false)}
      />
    </>
  );
};
