import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { findOwned, isPieceBuilt, MOKKI_ACTIONS, type MokkiActionDef } from "@/lib/mokki";
import type { MokkiActionResult, MokkiData } from "@/hooks/useMokki";
import { guestCount, neighborCheck, sceneDog } from "./mokkiActions";

interface NeighborActionsProps {
  data: MokkiData;
  onDo: (actionId: string) => Promise<MokkiActionResult>;
  onSendLoyly: () => void;
  onRewarded?: () => void;
  /** Controlled prank picker (the preview page opens it directly). */
  prankOpen?: boolean;
  onPrankOpenChange?: (open: boolean) => void;
}

const SOCIAL = MOKKI_ACTIONS.filter((a) => a.kind === "social");
const PRANKS = MOKKI_ACTIONS.filter((a) => a.kind === "prank");

/** Bottom bar on a neighbor's island: löyly, friendly visits and the 😈 prank picker. */
export const NeighborActions = ({ data, onDo, onSendLoyly, onRewarded, prankOpen, onPrankOpenChange }: NeighborActionsProps) => {
  const [busy, setBusy] = useState<string | null>(null);
  const [openState, setOpenState] = useState(false);
  const open = prankOpen ?? openState;
  const setOpen = (o: boolean) => {
    setOpenState(o);
    onPrankOpenChange?.(o);
  };
  const dogName = sceneDog(data.pieces, data.gamesPlayed)?.name;

  // Visits that make sense here: their island has the piece, and you have what it takes
  const socials = SOCIAL.filter((def) => {
    if (def.targetRequiresPiece && !isPieceBuilt(data.pieces, def.targetRequiresPiece, data.gamesPlayed)) return false;
    return !def.requiresPiece || !!findOwned(data.viewer.pieces, def.requiresPiece);
  });

  const run = async (def: MokkiActionDef) => {
    const check = neighborCheck(def, data);
    if (check.ok === false) {
      toast(check.reason);
      return;
    }
    setBusy(def.id);
    const res = await onDo(def.id);
    setBusy(null);
    if (!res.success || !res.outcome) {
      toast.error(res.error ?? "Something went wrong");
      return;
    }
    const { reward, foiled } = res.outcome;
    if (foiled) {
      toast(`🐕 ${dogName ?? "Their dog"} caught you!`, { description: "Busted. Better luck tomorrow." });
    } else {
      toast.success(`${def.emoji} ${def.name}!${reward > 0 ? ` +${reward} cr` : ""}`);
      if (reward > 0) onRewarded?.();
    }
    if (def.kind === "prank") setOpen(false);
  };

  const peaceful = data.peaceful || data.viewer.peaceful;

  return (
    <>
      <div className="absolute inset-x-0 bottom-0 z-10 pb-3">
        <div className="mx-auto flex max-w-lg gap-2 overflow-x-auto px-3 pb-1 [scrollbar-width:none]">
          <Button className="h-11 shrink-0 rounded-full px-4 shadow-xl" disabled={data.loylySentToday} onClick={onSendLoyly}>
            {data.loylySentToday ? "💨 Löyly sent" : "Send löyly 💨"}
          </Button>
          {socials.map((def) => {
            const done = data.doneToday.includes(def.id);
            const check = neighborCheck(def, data);
            const locked = !done && check.ok === false;
            return (
              <Button
                key={def.id}
                variant="secondary"
                className={`h-11 shrink-0 rounded-full bg-white px-4 text-slate-900 shadow-xl hover:bg-slate-100 ${locked ? "opacity-60" : ""}`}
                disabled={done || busy !== null}
                onClick={() => run(def)}
                title={check.ok === false ? check.reason : def.description}
              >
                {busy === def.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <span aria-hidden="true">{def.emoji}</span> {def.verb}
                    {done && " ✓"}
                    {def.maxGuestsPerDay !== undefined && (
                      <span className="text-xs opacity-70">
                        {guestCount(def, data)}/{def.maxGuestsPerDay}
                      </span>
                    )}
                  </>
                )}
              </Button>
            );
          })}
          <Button
            variant="secondary"
            className="h-11 shrink-0 rounded-full bg-white px-4 text-slate-900 shadow-xl hover:bg-slate-100"
            onClick={() => setOpen(true)}
          >
            😈 <span className="sr-only">Pranks</span>
          </Button>
        </div>
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="mx-auto max-h-[85dvh] max-w-lg overflow-y-auto rounded-t-2xl">
          <SheetHeader className="text-left">
            <SheetTitle>😈 Pranks</SheetTitle>
            <SheetDescription>
              Harmless mischief. They clean it up for +2 cr{dogName ? `, if ${dogName} doesn't catch you first` : ""}.
            </SheetDescription>
          </SheetHeader>
          {data.peaceful ? (
            <p className="mt-3 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-900">☮️ Peaceful mökki — no pranks here.</p>
          ) : data.viewer.peaceful ? (
            <p className="mt-3 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-900">
              ☮️ Your mökki is in peaceful mode. Switch it off in Customization to prank.
            </p>
          ) : null}
          <ul className="mt-4 space-y-2">
            {PRANKS.map((def) => {
              const check = neighborCheck(def, data);
              const disabled = peaceful || check.ok === false || busy !== null;
              return (
                <li key={def.id} className={`flex items-center gap-3 rounded-xl border p-3 ${check.ok === false ? "opacity-60" : ""}`}>
                  <span className="text-2xl" aria-hidden="true">
                    {def.emoji}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-foreground">{def.name}</p>
                    <p className="text-xs text-muted-foreground">{check.ok === false ? `🔒 ${check.reason}` : def.description}</p>
                  </div>
                  <Button size="sm" className="h-auto max-w-[8.5rem] shrink-0 whitespace-normal py-1.5 text-center leading-tight" disabled={disabled} onClick={() => run(def)}>
                    {busy === def.id ? <Loader2 className="h-4 w-4 animate-spin" /> : def.verb}
                  </Button>
                </li>
              );
            })}
          </ul>
        </SheetContent>
      </Sheet>
    </>
  );
};
