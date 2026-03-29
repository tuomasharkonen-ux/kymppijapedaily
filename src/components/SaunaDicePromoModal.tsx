import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { DicePreview } from "@/components/DicePreview";
import { useNavigate } from "react-router-dom";

const PROMO_KEY = "kymppijape_sauna_promo_shown";

export const getSaunaDicePromoShouldShow = (): boolean => {
  // Only show on or after 2026-03-30
  const today = new Date().toISOString().slice(0, 10);
  if (today < "2026-03-30") return false;
  return !localStorage.getItem(PROMO_KEY);
};

export const markSaunaDicePromoShown = () => {
  localStorage.setItem(PROMO_KEY, "1");
};

/** Call this to reset the promo flag (for testing) */
export const resetSaunaDicePromo = () => {
  localStorage.removeItem(PROMO_KEY);
};

interface SaunaDicePromoModalProps {
  open: boolean;
  onClose: () => void;
}

export const SaunaDicePromoModal = ({ open, onClose }: SaunaDicePromoModalProps) => {
  const navigate = useNavigate();

  const handleOpenShop = () => {
    onClose();
    navigate("/shop");
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-sm text-center">
        <DialogHeader>
          <DialogTitle className="text-2xl">🪵 New: Sauna Dice!</DialogTitle>
        </DialogHeader>

        <div className="flex justify-center my-2">
          <DicePreview skin="sauna_dice" />
        </div>

        <p className="text-sm text-muted-foreground leading-relaxed px-2">
          The sauna is open. Roll the dice and feel the heat build up — steam rises, the thermometer climbs, and if you keep going long enough, you might just hit <strong>MAXIMUM LÖYLY</strong>. Hyvää saunaa! 🧖
        </p>

        <div className="flex flex-col gap-2 mt-2">
          <Button onClick={handleOpenShop} className="w-full">
            View in Store
          </Button>
          <Button variant="ghost" onClick={onClose} className="w-full">
            Got it
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
