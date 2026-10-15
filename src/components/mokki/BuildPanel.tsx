import { useState } from "react";
import { ChevronUp, Coins } from "lucide-react";
import { canBuyPiece, findOwned, MOKKI_PIECES, pieceProgress } from "@/lib/mokki";
import type { MokkiOwnedPiece } from "@/hooks/useMokki";
import { TechTree } from "./tree/TechTree";

interface BuildPanelProps {
  owned: MokkiOwnedPiece[];
  gamesPlayed: number;
  credits: number;
  /** Resolves true when the purchase went through. The dog comes with a breed and a name. */
  onBuy: (pieceId: string, dog?: { breed: string; name: string }) => Promise<boolean>;
  initialOpen?: boolean;
  /** Controlled open state of the full-screen build tree. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

/** Bottom bar on your own island; opens the full-screen Rakennuspuu. */
export const BuildPanel = ({ owned, gamesPlayed, credits, onBuy, initialOpen = false, open: openProp, onOpenChange }: BuildPanelProps) => {
  const [openState, setOpenState] = useState(initialOpen);
  const open = openProp ?? openState;
  const setOpen = (value: boolean) => {
    setOpenState(value);
    onOpenChange?.(value);
  };

  let built = 0;
  let building = 0;
  let available = 0;
  for (const piece of MOKKI_PIECES) {
    const record = findOwned(owned, piece.id);
    if (record) {
      if (pieceProgress(record, gamesPlayed).complete) built++;
      else building++;
    } else if (canBuyPiece(piece.id, owned, gamesPlayed).ok) {
      available++;
    }
  }

  return (
    <>
      <div className="absolute inset-x-0 bottom-0 z-10 mx-auto max-w-lg px-3 pb-3">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-haspopup="dialog"
          aria-expanded={open}
          className="flex h-14 w-full items-center justify-between gap-3 rounded-2xl bg-background/95 px-4 text-left shadow-2xl ring-1 ring-black/10 backdrop-blur"
        >
          <div className="min-w-0">
            <p className="font-semibold leading-tight text-foreground">🌳 Rakennuspuu</p>
            <p className="truncate text-xs text-muted-foreground">
              {built}/{MOKKI_PIECES.length} built
              {building > 0 && ` · 🔨 ${building} building`}
              {available > 0 && <span className="font-semibold text-primary"> · {available} available</span>}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <span className="flex items-center gap-1 text-sm font-bold text-foreground">
              <Coins className="h-4 w-4 text-primary" aria-hidden="true" />
              {credits}
            </span>
            <ChevronUp className="h-5 w-5" aria-hidden="true" />
          </div>
        </button>
      </div>

      {open && <TechTree owned={owned} gamesPlayed={gamesPlayed} credits={credits} onBuy={onBuy} onClose={() => setOpen(false)} />}
    </>
  );
};
