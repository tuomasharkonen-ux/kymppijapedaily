import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import { findOwned, isPieceBuilt, MOKKI_ACTIONS, type FlagId, type MokkiActionDef } from "@/lib/mokki";
import type { MokkiActionResult, MokkiData } from "@/hooks/useMokki";
import { choreCheck, sceneFlag } from "./mokkiActions";
import { FlagPicker } from "./FlagPicker";

interface ChoresTrayProps {
  data: MokkiData;
  onDo: (actionId: string, payload?: Record<string, unknown>) => Promise<MokkiActionResult>;
  /** Called after a reward lands (e.g. to refresh the credit balance). */
  onRewarded?: () => void;
  className?: string;
}

interface Pop {
  key: number;
  text: string;
}

const CHORES = MOKKI_ACTIONS.filter((a) => a.kind === "chore");

/** Today's chores on your own island: one tap each, once a day, after you've played. */
export const ChoresTray = ({ data, onDo, onRewarded, className = "" }: ChoresTrayProps) => {
  const [busy, setBusy] = useState<string | null>(null);
  const [pops, setPops] = useState<Pop[]>([]);
  const [flagOpen, setFlagOpen] = useState(false);
  const pieces = data.viewer.pieces;
  const dog = findOwned(pieces, "koira");

  const visible = CHORES.filter((a) => {
    if (!a.requiresPiece || !findOwned(pieces, a.requiresPiece)) return false;
    return !a.requiresBreed || dog?.variant === a.requiresBreed;
  });
  const flagBuilt = isPieceBuilt(pieces, "lipputanko", data.viewer.gamesPlayed);

  const run = async (def: MokkiActionDef) => {
    const check = choreCheck(def, data);
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
    const { reward, label } = res.outcome;
    const text = reward > 0 ? `+${reward} cr · ${label}` : label;
    setPops((p) => [...p, { key: Date.now(), text }]);
    toast.success(text);
    if (reward > 0) onRewarded?.();
  };

  const pickFlag = async (flag: FlagId) => {
    const res = await onDo("set_flag", { flag });
    if (!res.success) toast.error(res.error ?? "Couldn't change the flag");
    return res.success;
  };

  if (visible.length === 0 && !flagBuilt) {
    return (
      <div className={`pointer-events-none flex justify-center px-3 ${className}`}>
        <p className="rounded-full bg-black/55 px-3 py-1 text-center text-[11px] text-white backdrop-blur">
          Build a Nuotiopaikka or Onkipaikka to unlock daily chores
        </p>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Reward pops float up from the tray */}
      <div className="pointer-events-none absolute inset-x-0 -top-2 flex justify-center">
        <AnimatePresence>
          {pops.map((p) => (
            <motion.div
              key={p.key}
              initial={{ opacity: 0, y: 10, scale: 0.8 }}
              animate={{ opacity: 1, y: -36, scale: 1 }}
              exit={{ opacity: 0, y: -60 }}
              transition={{ duration: 0.6 }}
              onAnimationComplete={() => setTimeout(() => setPops((all) => all.filter((x) => x.key !== p.key)), 900)}
              className="absolute whitespace-nowrap rounded-full bg-amber-300 px-3 py-1 text-sm font-bold text-amber-950 shadow-lg"
            >
              {p.text}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="relative mx-auto max-w-lg">
        <ul className="flex gap-2 overflow-x-auto px-3 pb-1 [scrollbar-width:none]" aria-label="Today's chores">
          {visible.map((def) => {
            const done = data.doneToday.includes(def.id);
            const check = choreCheck(def, data);
            const locked = !done && check.ok === false;
            return (
              <li key={def.id} className="shrink-0">
                <button
                  type="button"
                  onClick={() => (done ? toast(`${def.emoji} ${def.name}: done for today`) : run(def))}
                  disabled={busy !== null}
                  aria-label={`${def.name}${done ? ", done today" : locked && check.ok === false ? `, ${check.reason}` : ""}`}
                  className={`flex min-w-[4.5rem] flex-col items-center rounded-2xl px-3 py-1.5 text-center shadow-md ring-1 ring-black/10 backdrop-blur transition active:scale-95 ${
                    done ? "bg-emerald-100/95 text-emerald-900" : locked ? "bg-white/75 text-slate-500" : "bg-white/95 text-slate-900"
                  }`}
                >
                  <span className={`text-lg leading-none ${busy === def.id ? "animate-bounce" : ""}`} aria-hidden="true">
                    {def.emoji}
                  </span>
                  <span className="mt-0.5 text-[11px] font-semibold leading-tight">{def.name}</span>
                  <span className="text-[10px] leading-tight opacity-80">
                    {done ? "✓ Done" : locked && check.ok === false ? `🔒 ${check.reason}` : def.verb}
                  </span>
                </button>
              </li>
            );
          })}
          {flagBuilt && (
            <li className="shrink-0">
              <button
                type="button"
                onClick={() => setFlagOpen(true)}
                className="flex min-w-[4.5rem] flex-col items-center rounded-2xl bg-white/95 px-3 py-1.5 text-center text-slate-900 shadow-md ring-1 ring-black/10 backdrop-blur active:scale-95"
              >
                <span className="text-lg leading-none" aria-hidden="true">🏳️</span>
                <span className="mt-0.5 text-[11px] font-semibold leading-tight">Lippu</span>
                <span className="text-[10px] leading-tight opacity-80">Change</span>
              </button>
            </li>
          )}
        </ul>
      </div>

      <FlagPicker open={flagOpen} onOpenChange={setFlagOpen} current={sceneFlag(pieces)} onPick={pickFlag} />
    </div>
  );
};
