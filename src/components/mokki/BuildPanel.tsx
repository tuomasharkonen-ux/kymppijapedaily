import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, ChevronUp, Coins, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { canBuyPiece, MOKKI_CATALOG_TOTAL, MOKKI_PIECES, pieceProgress, type MokkiPieceDef } from "@/lib/mokki";
import type { MokkiOwnedPiece } from "@/hooks/useMokki";

interface BuildPanelProps {
  owned: MokkiOwnedPiece[];
  gamesPlayed: number;
  credits: number;
  onBuy: (pieceId: string) => Promise<boolean>;
  initialOpen?: boolean;
  /** Controlled open state (the page shrinks the scene while the panel is open). */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

type PieceState =
  | { kind: "built" }
  | { kind: "building"; remainingDays: number }
  | { kind: "available" }
  | { kind: "locked"; reason: string };

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

export const BuildPanel = ({ owned, gamesPlayed, credits, onBuy, initialOpen = false, open: openProp, onOpenChange }: BuildPanelProps) => {
  const [openState, setOpenState] = useState(initialOpen);
  const open = openProp ?? openState;
  const setOpen = (next: boolean | ((o: boolean) => boolean)) => {
    const value = typeof next === "function" ? next(open) : next;
    setOpenState(value);
    onOpenChange?.(value);
  };
  const [confirm, setConfirm] = useState<MokkiPieceDef | null>(null);
  const [buying, setBuying] = useState<string | null>(null);
  const ownedIds = owned.map((p) => p.piece_id);

  const stateOf = (piece: MokkiPieceDef): PieceState => {
    const record = owned.find((p) => p.piece_id === piece.id);
    if (record) {
      const progress = pieceProgress(record, gamesPlayed);
      return progress.complete ? { kind: "built" } : { kind: "building", remainingDays: progress.remainingDays };
    }
    const check = canBuyPiece(piece.id, ownedIds, gamesPlayed);
    return check.ok === false ? { kind: "locked", reason: check.reason } : { kind: "available" };
  };

  const spent = owned.reduce((sum, p) => sum + (MOKKI_PIECES.find((m) => m.id === p.piece_id)?.price ?? 0), 0);
  const available = MOKKI_PIECES.filter((p) => stateOf(p).kind === "available").length;

  const handleConfirm = async () => {
    if (!confirm) return;
    const piece = confirm;
    setConfirm(null);
    setBuying(piece.id);
    const ok = await onBuy(piece.id);
    setBuying(null);
    if (ok) setOpen(false);
  };

  return (
    <>
      <div className="absolute inset-x-0 bottom-0 z-10 mx-auto max-w-lg px-3 pb-3">
        <div className="overflow-hidden rounded-2xl bg-background/95 shadow-2xl ring-1 ring-black/10 backdrop-blur">
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="flex w-full items-center justify-between px-4 py-3 text-left"
            aria-expanded={open}
          >
            <div>
              <p className="font-semibold text-foreground">🔨 Build your mökki</p>
              <p className="text-xs text-muted-foreground">
                {owned.length}/{MOKKI_PIECES.length} pieces · {spent} / {MOKKI_CATALOG_TOTAL} cr
                {available > 0 && ` · ${available} available`}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 text-sm font-bold text-foreground">
                <Coins className="h-4 w-4 text-primary" aria-hidden="true" />
                {credits}
              </span>
              {open ? <ChevronDown className="h-5 w-5" /> : <ChevronUp className="h-5 w-5" />}
            </div>
          </button>

          <AnimatePresence initial={false}>
            {open && (
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: "auto" }}
                exit={{ height: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 32 }}
                className="overflow-hidden"
              >
                <ul className="max-h-[50vh] space-y-2 overflow-y-auto px-3 pb-3">
                  {MOKKI_PIECES.map((piece) => {
                    const state = stateOf(piece);
                    const affordable = credits >= piece.price;
                    return (
                      <li
                        key={piece.id}
                        className={`flex items-start gap-3 rounded-xl border p-3 ${state.kind === "built" ? "border-primary/30 bg-primary/5" : "border-border"} ${state.kind === "locked" ? "opacity-60" : ""}`}
                      >
                        <span className="text-2xl" aria-hidden="true">
                          {piece.emoji}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-foreground">{piece.name}</p>
                          <p className="text-xs text-muted-foreground">{piece.description}</p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            Builds over {plural(piece.buildDays, "played day")}
                          </p>
                        </div>
                        <div className="flex shrink-0 flex-col items-end gap-1">
                          {state.kind === "built" && <span className="text-xs font-semibold text-primary">✓ Built</span>}
                          {state.kind === "building" && (
                            <span className="text-right text-xs font-semibold text-amber-600">
                              🔨 {plural(state.remainingDays, "day")} left
                            </span>
                          )}
                          {state.kind === "locked" && <span className="max-w-[7rem] text-right text-xs text-muted-foreground">🔒 {state.reason}</span>}
                          {state.kind === "available" && (
                            <Button size="sm" disabled={!affordable || buying !== null} onClick={() => setConfirm(piece)}>
                              {buying === piece.id ? <Loader2 className="h-4 w-4 animate-spin" /> : `${piece.price} cr`}
                            </Button>
                          )}
                          {state.kind === "available" && !affordable && (
                            <span className="text-[11px] text-muted-foreground">Need {piece.price - credits} more</span>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <AlertDialog open={!!confirm} onOpenChange={(o) => !o && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirm?.emoji} Build {confirm?.name}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirm && (
                <>
                  This costs {confirm.price} credits. Builders arrive right away, and it's finished after{" "}
                  {plural(confirm.buildDays, "day")} that you play Kymppijape.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Not yet</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm}>Rakennetaan! 🔨</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
