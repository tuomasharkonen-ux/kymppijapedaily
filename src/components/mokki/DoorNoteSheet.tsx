import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { MAX_NOTES_PER_DOOR, type MokkiActionResult, type MokkiDoorNote, type MokkiNote } from "@/hooks/useMokki";

const MAX_LENGTH = 140;
const NOTE_COLORS = ["bg-amber-100", "bg-rose-100", "bg-emerald-100"];

interface DoorNoteSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ownerName: string | null;
  myNotes: MokkiNote[];
  /** Notes other visitors pinned here that the owner hasn't read yet. */
  doorNotes: MokkiDoorNote[];
  onLeave: (body: string) => Promise<MokkiActionResult>;
}

/** The notepad on a neighbor's door: pin a short hello they'll find in their mailbox. */
export const DoorNoteSheet = ({ open, onOpenChange, ownerName, myNotes, doorNotes, onLeave }: DoorNoteSheetProps) => {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const full = myNotes.length >= MAX_NOTES_PER_DOOR;
  const body = text.trim();

  const send = async () => {
    if (!body || sending || full) return;
    setSending(true);
    const res = await onLeave(body);
    setSending(false);
    if (!res.success) {
      toast.error(res.error ?? "Couldn't pin the note");
      return;
    }
    setText("");
    toast.success(`📝 Note pinned on ${ownerName ?? "their"}'s door`);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="mx-auto max-h-[85dvh] max-w-lg overflow-y-auto rounded-t-2xl">
        <SheetHeader>
          <SheetTitle>📝 Notepad on the door</SheetTitle>
          <SheetDescription>
            {ownerName ?? "They"} {ownerName ? "isn't" : "aren't"} home. Leave a hello: it'll be waiting in their mailbox.
          </SheetDescription>
        </SheetHeader>

        {doorNotes.length > 0 && (
          <section className="mt-4">
            <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Already on the door</h3>
            <ul className="mt-2 flex flex-wrap gap-2" aria-label="Notes other players left">
              {doorNotes.map((n, i) => (
                <li key={n.id} className={`max-w-full rounded-md px-3 py-2 text-sm text-slate-800 shadow-sm ${NOTE_COLORS[(i + 1) % NOTE_COLORS.length]}`} style={{ transform: `rotate(${i % 2 ? -1.5 : 1.5}deg)` }}>
                  {n.body}
                  <span className="mt-0.5 block text-right text-xs text-slate-500">– {n.fromName}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {myNotes.length > 0 && (
          <section className="mt-4">
            <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Yours today</h3>
            <ul className="mt-2 flex flex-wrap gap-2" aria-label="Notes you left today">
              {myNotes.map((n, i) => (
                <li key={n.id} className={`max-w-full rounded-md px-3 py-2 text-sm text-slate-800 shadow-sm ${NOTE_COLORS[i % NOTE_COLORS.length]}`} style={{ transform: `rotate(${i % 2 ? 1.5 : -1.5}deg)` }}>
                  {n.body}
                </li>
              ))}
            </ul>
          </section>
        )}

        {full ? (
          <p className="mt-6 text-center text-sm text-muted-foreground">The notepad is full for today. Come back tomorrow! 🌙</p>
        ) : (
          <form
            className="mt-4 space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              void send();
            }}
          >
            <div>
              <label htmlFor="door-note" className="sr-only">
                Your note
              </label>
              <Textarea
                id="door-note"
                value={text}
                maxLength={MAX_LENGTH}
                rows={3}
                placeholder="Write a note…"
                onChange={(e) => setText(e.target.value)}
                className="resize-none"
              />
              <p className="mt-1 text-right text-xs text-muted-foreground">
                {text.length}/{MAX_LENGTH} · {MAX_NOTES_PER_DOOR - myNotes.length} left today
              </p>
            </div>
            <Button type="submit" className="w-full" disabled={!body || sending}>
              {sending ? "Pinning…" : "Pin note on the door"}
            </Button>
          </form>
        )}
      </SheetContent>
    </Sheet>
  );
};
