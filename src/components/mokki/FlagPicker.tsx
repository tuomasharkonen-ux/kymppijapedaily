import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { FLAGS, type FlagId } from "@/lib/mokki";

interface FlagPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  current: FlagId | undefined;
  onPick: (flag: FlagId) => Promise<boolean>;
}

/** Choose what flies on your Lipputanko. */
export const FlagPicker = ({ open, onOpenChange, current, onPick }: FlagPickerProps) => {
  const [saving, setSaving] = useState<FlagId | null>(null);
  const active = current ?? "siniristi";

  const pick = async (flag: FlagId) => {
    if (flag === active) return onOpenChange(false);
    setSaving(flag);
    const ok = await onPick(flag);
    setSaving(null);
    if (ok) onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="mx-auto max-w-lg rounded-t-2xl">
        <SheetHeader>
          <SheetTitle>🏳️ Lipputanko</SheetTitle>
          <SheetDescription>Pick the flag that flies over your island.</SheetDescription>
        </SheetHeader>
        <ul className="mt-4 grid grid-cols-2 gap-2">
          {FLAGS.map((f) => (
            <li key={f.id}>
              <button
                type="button"
                onClick={() => pick(f.id)}
                disabled={saving !== null}
                aria-pressed={f.id === active}
                className="flex w-full items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-sm hover:bg-accent aria-pressed:border-primary aria-pressed:bg-primary/10 aria-pressed:font-semibold"
              >
                <span className="text-xl" aria-hidden="true">{f.emoji}</span>
                <span className="flex-1">{f.name}</span>
                {saving === f.id && <Loader2 className="h-4 w-4 animate-spin" />}
              </button>
            </li>
          ))}
        </ul>
      </SheetContent>
    </Sheet>
  );
};
