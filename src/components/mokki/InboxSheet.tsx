import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { getActionDef } from "@/lib/mokki";
import { DOOR_NOTE, type MokkiInboxItem } from "@/hooks/useMokki";

interface InboxSheetProps {
  open: boolean;
  /** Closing the mailbox also marks everything read. */
  onOpenChange: (open: boolean) => void;
  items: MokkiInboxItem[];
  onMarkRead: () => void;
}

function timeAgo(iso: string, now = Date.now()): string {
  const minutes = Math.max(0, Math.round((now - new Date(iso).getTime()) / 60000));
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.round(hours / 24);
  return days === 1 ? "yesterday" : `${days} days ago`;
}

/** The porch mailbox: what the neighbors got up to since your last visit. */
export const InboxSheet = ({ open, onOpenChange, items, onMarkRead }: InboxSheetProps) => (
  <Sheet open={open} onOpenChange={onOpenChange}>
    <SheetContent side="bottom" className="mx-auto max-h-[80dvh] max-w-lg overflow-y-auto rounded-t-2xl">
      <SheetHeader>
        <SheetTitle>📬 Postilaatikko</SheetTitle>
        <SheetDescription>What happened at your mökki while you were away.</SheetDescription>
      </SheetHeader>
      {items.length === 0 ? (
        <p className="mt-6 text-center text-sm text-muted-foreground">📭 No new mail. The lake is quiet.</p>
      ) : (
        <>
          <ul className="mt-4 space-y-2">
            {items.map((item) => {
              const def = getActionDef(item.actionId);
              return (
                <li key={item.id} className="flex items-start gap-3 rounded-xl border p-3">
                  <span className="text-xl" aria-hidden="true">
                    {item.actionId === DOOR_NOTE ? "📝" : def?.emoji ?? "✉️"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-foreground">{item.text}</p>
                    <p className="text-xs text-muted-foreground">{timeAgo(item.createdAt)}</p>
                  </div>
                  {item.reward > 0 && <span className="shrink-0 text-sm font-bold text-primary">+{item.reward} cr</span>}
                </li>
              );
            })}
          </ul>
          <Button variant="outline" className="mt-4 w-full" onClick={onMarkRead}>
            Mark all read
          </Button>
        </>
      )}
    </SheetContent>
  </Sheet>
);
