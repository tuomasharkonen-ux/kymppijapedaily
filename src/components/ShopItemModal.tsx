import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { ShopItem } from "@/lib/shopItems";

interface ShopItemModalProps {
  item: ShopItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ShopItemModal = ({ item, isOpen, onClose }: ShopItemModalProps) => {
  if (!item) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <span className="text-2xl" aria-hidden="true">{item.emoji}</span>
            {item.name}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Details about {item.name}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* In-game preview */}
          <div className="bg-muted rounded-lg p-6 flex items-center justify-center">
            <div className="text-center">
              <div className="text-6xl mb-2" aria-hidden="true">{item.emoji}</div>
              <p className="text-xs text-muted-foreground">In-game preview</p>
            </div>
          </div>
          
          {/* Long description */}
          <div className="space-y-2">
            <p className="text-sm text-foreground leading-relaxed">
              {item.longDescription}
            </p>
          </div>
          
          {/* Category badge */}
          <div className="flex items-center gap-2">
            <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">
              {item.category === 'skin' ? '🎨 Dice Skin' : '🎬 Special Action'}
            </span>
          </div>
          
          {/* Price and action */}
          <div className="flex items-center justify-between pt-2 border-t">
            <div className="text-lg font-bold text-foreground">
              {item.price} credits
            </div>
            <Button disabled variant="secondary">
              Coming Soon
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
