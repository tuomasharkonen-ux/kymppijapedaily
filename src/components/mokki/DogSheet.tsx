import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { DOG_BREEDS, DOG_NAME_MAX, getActionDef, getDogBreed, validateDogName, type DogBreedId } from "@/lib/mokki";
import type { MokkiActionResult, MokkiData } from "@/hooks/useMokki";
import { choreCheck } from "./mokkiActions";
import { DogPortrait } from "./tree/DogPortrait";

interface DogSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: MokkiData;
  onDo: (actionId: string, payload?: Record<string, unknown>) => Promise<MokkiActionResult>;
  onRewarded?: () => void;
}

/** Your dog: scratch it, let the lagotto dig, rename it or switch breed. */
export const DogSheet = ({ open, onOpenChange, data, onDo, onRewarded }: DogSheetProps) => {
  const record = data.viewer.pieces.find((p) => p.piece_id === "koira");
  const breed = getDogBreed(record?.variant) ?? DOG_BREEDS[0];
  const name = record?.nickname || "Koira";
  const [busy, setBusy] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [draftName, setDraftName] = useState(name);
  const [draftBreed, setDraftBreed] = useState<DogBreedId>(breed.id);

  useEffect(() => {
    if (!open) return;
    setEditing(false);
    setDraftName(name);
    setDraftBreed(breed.id);
  }, [open, name, breed.id]);

  const tricks = ["rapsuta", ...(breed.id === "lagotto" ? ["tryffeli"] : [])].flatMap((id) => {
    const def = getActionDef(id);
    return def ? [def] : [];
  });

  const run = async (actionId: string) => {
    setBusy(actionId);
    const res = await onDo(actionId);
    setBusy(null);
    if (!res.success || !res.outcome) {
      toast.error(res.error ?? "Something went wrong");
      return;
    }
    const { reward, label } = res.outcome;
    toast.success(reward > 0 ? `+${reward} cr · ${label}` : label);
    if (reward > 0) onRewarded?.();
  };

  const nameCheck = validateDogName(draftName);
  const save = async () => {
    if (nameCheck.ok === false) return;
    setBusy("set_dog");
    const res = await onDo("set_dog", { breed: draftBreed, name: nameCheck.name });
    setBusy(null);
    if (!res.success) {
      toast.error(res.error ?? "Couldn't save");
      return;
    }
    toast.success(`🐕 ${nameCheck.name} is happy`);
    setEditing(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="mx-auto max-h-[85dvh] max-w-lg overflow-y-auto rounded-t-2xl">
        <SheetHeader className="text-left">
          <SheetTitle>🐕 {name}</SheetTitle>
          <SheetDescription>
            {breed.name} · {breed.english}
          </SheetDescription>
        </SheetHeader>

        {!editing ? (
          <>
            <DogPortrait breed={breed.id} className="mt-4 h-36 w-full rounded-xl" />
            <p className="mt-3 text-sm text-foreground">{breed.look}</p>
            <p className="mt-2 rounded-xl bg-muted p-3 text-sm">
              <span className="font-semibold">✨ {breed.trick}:</span> {breed.trickText}
            </p>
            <div className="mt-4 grid gap-2">
              {tricks.map((def) => {
                const done = data.doneToday.includes(def.id);
                const check = choreCheck(def, data);
                return (
                  <Button key={def.id} size="lg" disabled={done || check.ok === false || busy !== null} onClick={() => run(def.id)}>
                    {busy === def.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : done ? (
                      `✓ ${def.name} done today`
                    ) : check.ok === false ? (
                      `${def.emoji} ${def.name} · ${check.reason}`
                    ) : (
                      `${def.emoji} ${def.id === "tryffeli" ? "Dig for mushrooms" : `${def.verb} ${name}`}`
                    )}
                  </Button>
                );
              })}
              <Button variant="outline" onClick={() => setEditing(true)}>
                Rename or switch breed
              </Button>
            </div>
          </>
        ) : (
          <div className="mt-4 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="dog-name">Name</Label>
              <Input id="dog-name" value={draftName} maxLength={DOG_NAME_MAX} onChange={(e) => setDraftName(e.target.value)} />
              {nameCheck.ok === false && <p className="text-xs text-destructive">{nameCheck.reason}</p>}
            </div>
            <fieldset className="space-y-2">
              <legend className="text-sm font-medium">Breed</legend>
              {DOG_BREEDS.map((b) => (
                <label
                  key={b.id}
                  className="flex cursor-pointer items-center gap-3 rounded-xl border p-2 has-[:checked]:border-primary has-[:checked]:bg-primary/5"
                >
                  <input type="radio" name="dog-breed" className="sr-only" checked={draftBreed === b.id} onChange={() => setDraftBreed(b.id)} />
                  <DogPortrait breed={b.id} className="h-12 w-16 shrink-0 rounded-lg" />
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold">{b.name}</span>
                    <span className="block text-xs text-muted-foreground">✨ {b.trick}</span>
                  </span>
                </label>
              ))}
            </fieldset>
            <p className="text-xs text-muted-foreground">Switching is free. The new breed's trick starts working right away.</p>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setEditing(false)}>
                Cancel
              </Button>
              <Button className="flex-1" disabled={nameCheck.ok === false || busy !== null} onClick={save}>
                {busy === "set_dog" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};
