import { useState } from "react";
import { Coins, Loader2, X } from "lucide-react";
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
import {
  DOG_BREEDS,
  DOG_NAME_MAX,
  findOwned,
  getPieceDef,
  MOKKI_ERAS,
  MOKKI_LANES,
  pathToPiece,
  pieceChildren,
  validateDogName,
  type DogBreedId,
  type MokkiBenefitKind,
  type MokkiPieceDef,
  type MokkiPieceId,
  type OwnedPieceRecord,
} from "@/lib/mokki";
import { DogPortrait } from "./DogPortrait";
import { laneColor, plural, statusText, type NodeState } from "./treeLayout";

const KIND_STYLE: Record<MokkiBenefitKind, { label: string; className: string }> = {
  chore: { label: "Chore", className: "bg-emerald-600" },
  social: { label: "Social", className: "bg-sky-600" },
  prank: { label: "Cheeky", className: "bg-fuchsia-600" },
  perk: { label: "Perk", className: "bg-amber-600" },
  cosmetic: { label: "Looks", className: "bg-slate-500" },
};

const Chip = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <span className={`inline-flex items-center gap-1 rounded-full border border-border bg-background px-2.5 py-0.5 text-xs text-foreground/80 ${className}`}>
    {children}
  </span>
);

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <p className="mt-4 text-[11px] font-semibold uppercase tracking-wider text-foreground/60">{children}</p>
);

interface NodeDetailProps {
  def: MokkiPieceDef;
  state: NodeState;
  owned: OwnedPieceRecord[];
  credits: number;
  buying: boolean;
  onSelect: (id: MokkiPieceId) => void;
  onClose: () => void;
  onBuy: (pieceId: string, dog?: { breed: string; name: string }) => Promise<boolean>;
}

export const NodeDetail = ({ def, state, owned, credits, buying, onSelect, onClose, onBuy }: NodeDetailProps) => {
  const [confirming, setConfirming] = useState(false);
  const [breed, setBreed] = useState<DogBreedId>("puudeli");
  const [dogName, setDogName] = useState("");
  const [nameError, setNameError] = useState<string | null>(null);

  const era = MOKKI_ERAS[def.era];
  const lane = MOKKI_LANES.find((l) => l.id === def.lane)!;
  const children = pieceChildren(def.id);
  const isDog = def.id === "koira";
  const canBuild = state.kind === "available";
  const affordable = credits >= def.price;
  const path = state.kind === "locked" ? pathToPiece(def.id, owned) : [];
  const pathCost = path.reduce((sum, p) => sum + p.price, 0);
  const breedDef = DOG_BREEDS.find((b) => b.id === breed)!;

  const startBuild = () => {
    if (isDog) {
      const check = validateDogName(dogName);
      if (check.ok === false) {
        setNameError(check.reason);
        return;
      }
      setNameError(null);
      setDogName(check.name);
    }
    setConfirming(true);
  };

  const confirm = async () => {
    setConfirming(false);
    const ok = await onBuy(def.id, isDog ? { breed, name: dogName.trim() } : undefined);
    if (ok && isDog) setDogName("");
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-start gap-3 border-b border-border p-4">
        <span className="text-4xl leading-none" aria-hidden="true">
          {def.emoji}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-lg font-bold leading-tight text-foreground">
            {def.name}
            {def.wonder && <span className="ml-2 rounded-full bg-foreground px-1.5 py-0.5 align-middle text-[10px] font-bold text-background">★ Wonder</span>}
          </h3>
          <p className="mt-0.5 text-sm font-medium text-primary">{statusText(state)}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full p-1.5 text-foreground/60 hover:bg-accent hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring"
          aria-label="Close details"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4">
        <div className="mt-3 flex flex-wrap gap-1.5">
          <Chip>Era {era.roman} · {era.name}</Chip>
          <Chip>
            <span className="h-2 w-2 rounded-full" style={{ background: lane.color }} aria-hidden="true" />
            {lane.emoji} {lane.name}
          </Chip>
          <Chip>
            <Coins className="h-3 w-3 text-primary" aria-hidden="true" />
            {def.price} cr
          </Chip>
          <Chip>🔨 {plural(def.buildDays, "day")}</Chip>
        </div>

        <p className="mt-3 text-sm leading-relaxed text-foreground/80">{def.description}</p>
        {state.kind === "built" && state.grandfathered && (
          <p className="mt-2 rounded-lg border border-pink-200 bg-pink-50 px-3 py-2 text-xs text-pink-900">
            🏃 You built this before the tree existed. It still counts as unlocked, and you can fill in the earlier builds later.
          </p>
        )}

        {path.length > 0 && (
          <div className="mt-3 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-950">
            🧭 <b>Path:</b> {plural(path.length, "build")} · {pathCost.toLocaleString("fi")} cr
            <div className="mt-1 flex flex-wrap items-center gap-1 text-xs text-amber-900">
              {path.map((p, i) => (
                <span key={p.id} className="flex items-center gap-1">
                  {i > 0 && <span aria-hidden="true">→</span>}
                  <button type="button" className="underline-offset-2 hover:underline" onClick={() => onSelect(p.id)}>
                    {p.emoji} {p.name}
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

        <SectionLabel>Gives</SectionLabel>
        <ul className="mt-1.5 space-y-1.5">
          {def.gives.map((g) => (
            <li key={g.title} className="flex gap-2 rounded-xl border border-border bg-background px-3 py-2 text-sm leading-snug text-foreground/80">
              <span className={`mt-0.5 h-fit shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase text-white ${KIND_STYLE[g.kind].className}`}>
                {KIND_STYLE[g.kind].label}
              </span>
              <span>
                <b className="text-foreground">
                  {g.emoji} {g.title}
                </b>{" "}
                — {g.text}
              </span>
            </li>
          ))}
        </ul>

        <SectionLabel>Requires</SectionLabel>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {def.requires.length === 0 ? (
            <span className="text-xs text-foreground/60">Nothing — a starting build</span>
          ) : (
            def.requires.map((r) => {
              const parent = getPieceDef(r)!;
              const have = !!findOwned(owned, r);
              return (
                <button
                  key={r}
                  type="button"
                  onClick={() => onSelect(r)}
                  className={`rounded-full border bg-background px-2.5 py-0.5 text-xs text-foreground hover:bg-accent ${have ? "border-emerald-500" : "border-red-400"}`}
                >
                  {have ? "✓" : "✗"} {parent.emoji} {parent.name}
                </button>
              );
            })
          )}
        </div>

        <SectionLabel>Leads to</SectionLabel>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {children.length === 0 ? (
            <span className="text-xs text-foreground/60">End of the branch</span>
          ) : (
            children.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => onSelect(c.id)}
                className="rounded-full border border-border bg-background px-2.5 py-0.5 text-xs text-foreground hover:bg-accent"
                style={{ borderColor: laneColor(c.lane) }}
              >
                {c.emoji} {c.name}
              </button>
            ))
          )}
        </div>

        {isDog && canBuild && (
          <>
            <SectionLabel>Choose your dog</SectionLabel>
            <div className="mt-1.5 grid grid-cols-1 gap-2 sm:grid-cols-3" role="radiogroup" aria-label="Dog breed">
              {DOG_BREEDS.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  role="radio"
                  aria-checked={breed === b.id}
                  onClick={() => setBreed(b.id)}
                  className={`flex gap-2 rounded-xl border-2 bg-background p-2 text-left transition-colors sm:flex-col ${breed === b.id ? "border-primary" : "border-border hover:border-foreground/30"}`}
                >
                  <DogPortrait breed={b.id} className="h-16 w-28 shrink-0 rounded-lg sm:h-auto sm:w-full" />
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold leading-tight text-foreground">{b.name}</span>
                    <span className="block text-[11px] text-foreground/60">{b.english}</span>
                    <span className="mt-1 block text-[11px] leading-snug text-foreground/80">
                      <b className="text-primary">{b.trick}:</b> {b.trickText}
                    </span>
                  </span>
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-foreground/60">{breedDef.look}</p>
            <label htmlFor="dog-name" className="mt-3 block text-xs font-semibold text-foreground/80">
              Name your dog
            </label>
            <input
              id="dog-name"
              value={dogName}
              maxLength={DOG_NAME_MAX}
              onChange={(e) => {
                setDogName(e.target.value);
                setNameError(null);
              }}
              placeholder="Pörrö, Musti, Halli…"
              aria-invalid={!!nameError}
              aria-describedby={nameError ? "dog-name-error" : undefined}
              className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-foreground/40 focus:border-primary focus:outline-none focus:ring-1 focus:ring-ring"
            />
            {nameError && (
              <p id="dog-name-error" className="mt-1 text-xs text-destructive">
                {nameError}
              </p>
            )}
          </>
        )}
      </div>

      {(state.kind === "available" || state.kind === "locked") && (
        <div className="border-t border-border p-4">
          <button
            type="button"
            disabled={!canBuild || !affordable || buying}
            onClick={startBuild}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-base font-bold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-foreground/10 disabled:text-foreground/50"
          >
            {buying ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> : null}
            {buying ? "Building…" : `Rakennetaan! 🔨 · ${def.price} cr`}
          </button>
          {canBuild && !affordable && (
            <p className="mt-1.5 text-center text-xs text-foreground/60">Need {def.price - credits} more credits</p>
          )}
        </div>
      )}

      <AlertDialog open={confirming} onOpenChange={setConfirming}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {def.emoji} Build {def.name}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This costs {def.price} credits. Builders arrive right away, and it's finished after {plural(def.buildDays, "day")} that you play
              Kymppijape.
              {isDog && ` ${dogName.trim()} the ${breedDef.english.toLowerCase()} moves in when the doghouse is done.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Not yet</AlertDialogCancel>
            <AlertDialogAction onClick={confirm}>Rakennetaan! 🔨</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
