import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";

interface Neighbor {
  userId: string;
  username: string;
}

interface NeighborsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  viewerId: string;
  /** Island currently on screen, highlighted in the list. */
  currentOwnerId: string | null;
  onVisit: (userId: string) => void;
}

/** List of everyone else who owns a mökki. */
export const NeighborsSheet = ({ open, onOpenChange, viewerId, currentOwnerId, onVisit }: NeighborsSheetProps) => {
  const [neighbors, setNeighbors] = useState<Neighbor[] | null>(null);

  useEffect(() => {
    if (!open || neighbors) return;
    (async () => {
      const { data: owners, error } = await supabase.rpc("get_mokki_owners");
      if (error) {
        console.error("get_mokki_owners failed:", error.message);
        setNeighbors([]);
        return;
      }
      const ids = (owners ?? []).map((o) => o.user_id).filter((id) => id !== viewerId);
      if (ids.length === 0) {
        setNeighbors([]);
        return;
      }
      const { data: profiles } = await supabase.from("profiles").select("user_id, username").in("user_id", ids);
      setNeighbors(
        ids
          .map((id) => ({ userId: id, username: profiles?.find((p) => p.user_id === id)?.username ?? "Player" }))
          .sort((a, b) => a.username.localeCompare(b.username, "fi")),
      );
    })();
  }, [open, neighbors, viewerId]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-72 overflow-y-auto">
        <SheetHeader>
          <SheetTitle>🏘️ Visit neighbors</SheetTitle>
          <SheetDescription>Peek at what others have built.</SheetDescription>
        </SheetHeader>
        <ul className="mt-4 space-y-1">
          {neighbors === null ? (
            <li className="animate-pulse text-sm text-muted-foreground">Loading…</li>
          ) : neighbors.length === 0 ? (
            <li className="text-sm text-muted-foreground">No neighbors yet — you're the only mökki on the lake.</li>
          ) : (
            neighbors.map((n) => (
              <li key={n.userId}>
                <button
                  type="button"
                  onClick={() => onVisit(n.userId)}
                  aria-current={n.userId === currentOwnerId ? "page" : undefined}
                  className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm hover:bg-accent aria-[current=page]:bg-accent aria-[current=page]:font-semibold"
                >
                  <span aria-hidden="true">🏡</span>
                  <span className="truncate">{n.username}'s mökki</span>
                </button>
              </li>
            ))
          )}
        </ul>
      </SheetContent>
    </Sheet>
  );
};
