import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Coins } from "lucide-react";
import {
  getPieceDef,
  isPieceBuilt,
  MOKKI_ERAS,
  MOKKI_LANES,
  MOKKI_PIECES,
  pathToPiece,
  type MokkiPieceId,
  type OwnedPieceRecord,
} from "@/lib/mokki";
import { NodeDetail } from "./NodeDetail";
import {
  edgePath,
  edgeState,
  laneColor,
  METRICS_MOBILE,
  METRICS_WIDE,
  nodePos,
  nodeState,
  statusText,
  treeGeometry,
  type NodeState,
} from "./treeLayout";

const SEEN_KEY = "kymppijape_tree_seen_built";

const STYLES = `
@keyframes rk-flow { to { stroke-dashoffset: -28; } }
@keyframes rk-pulse { 0% { box-shadow: 0 0 0 0 rgba(5,148,103,.45); } 70% { box-shadow: 0 0 0 10px rgba(5,148,103,0); } 100% { box-shadow: 0 0 0 0 rgba(5,148,103,0); } }
@keyframes rk-pop { 0% { transform: scale(.6); } 60% { transform: scale(1.15); } 100% { transform: scale(1); } }
.rk-flow { animation: rk-flow 1s linear infinite; }
.rk-pulse { animation: rk-pulse 1.8s infinite; }
.rk-pop { animation: rk-pop .7s cubic-bezier(.3,1.6,.5,1) .25s both; }
@media (prefers-reduced-motion: reduce) { .rk-flow, .rk-pulse, .rk-pop { animation: none; } }
`;

function useIsWide() {
  const query = "(min-width: 900px)";
  const [wide, setWide] = useState(() => typeof window !== "undefined" && window.matchMedia(query).matches);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const onChange = () => setWide(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return wide;
}

function readSeen(): string[] | null {
  try {
    const raw = localStorage.getItem(SEEN_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

interface TechTreeProps {
  owned: OwnedPieceRecord[];
  gamesPlayed: number;
  credits: number;
  onBuy: (pieceId: string, dog?: { breed: string; name: string }) => Promise<boolean>;
  onClose: () => void;
}

/** Full-screen Civilization-style build tree: eras as columns, branches as lanes. */
export const TechTree = ({ owned, gamesPlayed, credits, onBuy, onClose }: TechTreeProps) => {
  const wide = useIsWide();
  const m = wide ? METRICS_WIDE : METRICS_MOBILE;
  const g = useMemo(() => treeGeometry(m), [m]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const [selected, setSelected] = useState<MokkiPieceId | null>(null);
  const [buying, setBuying] = useState(false);
  const [popIds, setPopIds] = useState<Set<string>>(new Set());

  const states = useMemo(
    () => new Map<MokkiPieceId, NodeState>(MOKKI_PIECES.map((p) => [p.id, nodeState(p, owned, gamesPlayed)])),
    [owned, gamesPlayed],
  );
  const builtCount = MOKKI_PIECES.filter((p) => states.get(p.id)?.kind === "built").length;

  const scrollToNode = useCallback(
    (id: MokkiPieceId, smooth = true, toLaneTop = false) => {
      const el = scrollRef.current;
      const def = getPieceDef(id);
      if (!el || !def) return;
      const { x, y } = nodePos(def, m, g);
      const top = toLaneTop ? g.laneTop[def.lane] - 8 : y - 16;
      el.scrollTo({ left: Math.max(0, x - m.left - 16), top: Math.max(0, top), behavior: smooth ? "smooth" : "auto" });
    },
    [m, g],
  );

  // On open: focus, jump to the frontier, pop pieces that finished since last time
  useEffect(() => {
    closeRef.current?.focus();
    const frontier = [...MOKKI_PIECES]
      .sort((a, b) => a.col - b.col || MOKKI_LANES.findIndex((l) => l.id === a.lane) - MOKKI_LANES.findIndex((l) => l.id === b.lane))
      .find((p) => states.get(p.id)?.kind === "available");
    if (frontier) scrollToNode(frontier.id, false, true);
    const built = MOKKI_PIECES.filter((p) => states.get(p.id)?.kind === "built").map((p) => p.id);
    const seen = readSeen();
    if (seen) setPopIds(new Set(built.filter((id) => !seen.includes(id))));
    localStorage.setItem(SEEN_KEY, JSON.stringify(built));
    // Only on open
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // A node that changes state while the tree is open (e.g. just bought) pops too
  const prevStates = useRef(states);
  useEffect(() => {
    const changed = MOKKI_PIECES.filter((p) => prevStates.current.get(p.id)?.kind !== states.get(p.id)?.kind).map((p) => p.id);
    prevStates.current = states;
    if (changed.length > 0) setPopIds(new Set(changed));
  }, [states]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || document.querySelector("[role=alertdialog]")) return;
      if (selected) setSelected(null);
      else onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected, onClose]);

  const select = (id: MokkiPieceId) => setSelected(id);

  // After render, so the bottom spacer for the mobile sheet already exists
  useEffect(() => {
    if (selected) scrollToNode(selected);
  }, [selected, scrollToNode]);

  const handleBuy = async (pieceId: string, dog?: { breed: string; name: string }) => {
    setBuying(true);
    const ok = await onBuy(pieceId, dog);
    setBuying(false);
    return ok;
  };

  // Highlight the route to the selected node when it isn't built yet
  const selectedState = selected ? states.get(selected) : undefined;
  const path = useMemo(
    () => (selected && selectedState?.kind !== "built" && selectedState?.kind !== "building" ? new Set(pathToPiece(selected, owned).map((p) => p.id)) : null),
    [selected, selectedState, owned],
  );
  const showPath = !!path && path.size > 1;
  const selectedDef = selected ? getPieceDef(selected) : undefined;
  const sheetOpen = !!selectedDef && !wide;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Rakennuspuu build tree"
      className="fixed inset-0 z-50 flex flex-col bg-background text-foreground"
    >
      <style>{STYLES}</style>

      {/* Header */}
      <div className="shrink-0 border-b border-border bg-card/95 px-3 pb-2 pt-3 backdrop-blur">
        <div className="flex items-center gap-2">
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-foreground hover:bg-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring"
            aria-label="Close the build tree"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h2 className="flex-1 truncate text-lg font-bold">🌳 Rakennuspuu</h2>
          <span className="rounded-full border border-border bg-background px-2.5 py-1 text-xs text-foreground/70">
            {builtCount}/{MOKKI_PIECES.length} built
          </span>
          <span className="flex items-center gap-1 rounded-full border border-border bg-background px-2.5 py-1 text-sm font-bold">
            <Coins className="h-4 w-4 text-primary" aria-hidden="true" />
            {credits}
          </span>
        </div>
        <nav className="mt-2 flex gap-1.5 overflow-x-auto pb-0.5" aria-label="Eras">
          {MOKKI_ERAS.map((era) => {
            const locked = gamesPlayed < era.minDaysPlayed;
            return (
              <button
                key={era.roman}
                type="button"
                onClick={() => scrollRef.current?.scrollTo({ left: era.cols[0] * m.colW, behavior: "smooth" })}
                className={`shrink-0 rounded-full border px-3 py-1 text-xs ${locked ? "border-border text-foreground/50" : "border-primary/50 text-primary"} hover:bg-accent`}
              >
                {era.roman} {era.name} {locked ? `🔒 ${gamesPlayed}/${era.minDaysPlayed} d` : "✓"}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="flex min-h-0 flex-1">
        {/* Tree */}
        <div ref={scrollRef} className="relative min-w-0 flex-1 overflow-auto overscroll-contain">
          <div style={{ width: g.width }}>
            {/* Era header, sticky to the top */}
            <div className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur" style={{ height: m.header, width: g.width }}>
              <div className="sticky left-0 z-10 h-full bg-background" style={{ width: m.left }} />
              {MOKKI_ERAS.map((era) => {
                const locked = gamesPlayed < era.minDaysPlayed;
                return (
                  <div
                    key={era.roman}
                    className="absolute top-0 flex h-full flex-col justify-center border-l border-dashed border-border pl-3"
                    style={{ left: m.left + era.cols[0] * m.colW, width: era.cols.length * m.colW }}
                  >
                    <b className="text-[13px] leading-tight">
                      {era.roman} · {era.name} {locked && "🔒"}
                    </b>
                    <span className="text-[11px] text-foreground/60">
                      {era.minDaysPlayed} days played{locked && ` · you: ${gamesPlayed}`}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="relative" style={{ height: g.height }}>
              {/* Lanes with sticky labels */}
              {MOKKI_LANES.map((lane) => (
                <div
                  key={lane.id}
                  className="absolute left-0 border-t border-foreground/10"
                  style={{ top: g.laneTop[lane.id] - 4, height: lane.rows * m.rowH + 8, width: g.width }}
                >
                  <div
                    className="sticky left-0 z-10 flex h-full items-center bg-gradient-to-r from-background via-background/95 to-transparent"
                    style={{ width: m.left }}
                  >
                    <span className="ml-2 h-3/5 w-1 shrink-0 rounded" style={{ background: lane.color }} aria-hidden="true" />
                    {wide ? (
                      <span className="ml-2 text-[13px] font-semibold">
                        {lane.emoji} {lane.name}
                      </span>
                    ) : (
                      <span className="ml-1 flex flex-col items-center text-[10px] font-semibold [writing-mode:vertical-rl]" title={lane.name}>
                        <span className="rotate-180">{lane.name}</span>
                      </span>
                    )}
                  </div>
                </div>
              ))}

              {/* Edges */}
              <svg className="pointer-events-none absolute inset-0 overflow-visible" width={g.width} height={g.height} aria-hidden="true">
                {MOKKI_PIECES.flatMap((child) =>
                  child.requires.map((pid) => {
                    const parent = getPieceDef(pid)!;
                    const state = edgeState(parent, states.get(child.id)!, owned, gamesPlayed);
                    const onPath = showPath && path!.has(child.id) && (path!.has(pid) || isPieceBuilt(owned, pid, gamesPlayed));
                    const stroke = onPath ? "hsl(var(--foreground))" : state === "done" ? laneColor(child.lane) : state === "ready" ? "hsl(var(--primary))" : "hsl(var(--border))";
                    return (
                      <path
                        key={`${pid}-${child.id}`}
                        d={edgePath(parent, child, m, g)}
                        fill="none"
                        stroke={stroke}
                        strokeWidth={onPath ? 3.5 : state === "done" ? 3 : 2.2}
                        strokeDasharray={onPath || state === "done" ? undefined : state === "ready" ? "8 6" : "3 5"}
                        className={state === "ready" && !onPath ? "rk-flow" : undefined}
                        style={{
                          opacity: showPath && !onPath ? 0.18 : 1,
                                                  }}
                      />
                    );
                  }),
                )}
              </svg>

              {/* Nodes */}
              {MOKKI_PIECES.map((def) => {
                const state = states.get(def.id)!;
                const { x, y } = nodePos(def, m, g);
                const color = laneColor(def.lane);
                const isSel = def.id === selected;
                const faded = showPath && !path!.has(def.id) && !isSel;
                const onPath = showPath && path!.has(def.id);
                const base = "absolute flex items-center gap-2 rounded-xl border-2 px-2 text-left transition-[opacity,filter,background-color,border-color] duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";
                const look =
                  state.kind === "built"
                    ? ""
                    : state.kind === "building"
                      ? "border-amber-500 bg-amber-50"
                      : state.kind === "available"
                        ? "rk-pulse border-primary bg-card"
                        : state.kind === "soon"
                          ? "border-dashed border-foreground/25 bg-card/60"
                          : "border-border bg-card";
                const dim = (state.kind === "locked" || state.kind === "soon") && !onPath && !isSel;
                const meta =
                  state.kind === "built"
                    ? "✓ Built"
                    : state.kind === "building"
                      ? `🔨 ${state.remainingDays} day${state.remainingDays === 1 ? "" : "s"} left`
                      : state.kind === "soon"
                        ? "Tulossa"
                        : `${def.price} cr · ${def.buildDays}d`;
                return (
                  <button
                    key={def.id}
                    type="button"
                    onClick={() => select(def.id)}
                    aria-pressed={isSel}
                    aria-label={`${def.name}. ${statusText(state)}. ${def.price} credits.`}
                    className={`${base} ${look} ${popIds.has(def.id) ? "rk-pop" : ""} ${isSel ? "z-[3] outline outline-[3px] outline-offset-2 outline-foreground" : "z-[2]"}`}
                    style={{
                      left: x,
                      top: y,
                      width: m.nodeW,
                      height: m.nodeH,
                      opacity: faded ? 0.25 : dim ? (state.kind === "soon" ? 0.5 : 0.6) : 1,
                      filter: dim ? "grayscale(0.85)" : undefined,
                      ...(state.kind === "built"
                        ? { borderColor: color, backgroundColor: "hsl(var(--card))", backgroundImage: `linear-gradient(${color}33, ${color}1f)` }
                        : {}),
                      ...(onPath && !isSel ? { boxShadow: "0 0 0 3px rgba(23,23,23,.18)" } : {}),
                    }}
                  >
                    {def.wonder && (
                      <span className="absolute -top-2 left-2 rounded-full bg-foreground px-1.5 text-[9px] font-bold leading-4 text-background">★ Wonder</span>
                    )}
                    {state.kind === "soon" && (
                      <span className="absolute -top-2 right-2 rounded-full bg-foreground/45 px-1.5 text-[9px] font-bold leading-4 text-white">Tulossa</span>
                    )}
                    {state.kind === "built" && state.grandfathered && (
                      <span className="absolute -bottom-2 right-2 rounded-full bg-pink-200 px-1.5 text-[9px] font-bold leading-4 text-pink-900">
                        🏃 ahead of its time
                      </span>
                    )}
                    {state.kind === "building" ? (
                      <BuildRing emoji={def.emoji} fraction={1 - state.remainingDays / Math.max(1, state.buildDays)} />
                    ) : (
                      <span className={`w-7 shrink-0 text-center ${wide ? "text-2xl" : "text-xl"}`} aria-hidden="true">
                        {state.kind === "soon" ? <span className="opacity-60 grayscale">{def.emoji}</span> : def.emoji}
                      </span>
                    )}
                    <span className="min-w-0">
                      <span className={`block truncate font-semibold leading-tight text-foreground ${wide ? "text-[13.5px]" : "text-[12.5px]"}`}>{def.name}</span>
                      <span className={`mt-0.5 block truncate ${wide ? "text-[11px]" : "text-[10.5px]"} ${state.kind === "built" ? "font-semibold text-foreground" : "text-foreground/60"}`}>
                        {meta}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
            {/* Room to scroll the bottom rows above the mobile detail sheet */}
            {sheetOpen && <div style={{ height: "58vh" }} aria-hidden="true" />}
          </div>
        </div>

        {/* Desktop side panel */}
        {wide && selectedDef && (
          <aside className="flex w-[360px] shrink-0 flex-col border-l border-border bg-card" aria-label={`${selectedDef.name} details`}>
            <NodeDetail
              key={selectedDef.id}
              def={selectedDef}
              state={states.get(selectedDef.id)!}
              owned={owned}
              credits={credits}
              buying={buying}
              onSelect={select}
              onClose={() => setSelected(null)}
              onBuy={handleBuy}
            />
          </aside>
        )}
      </div>

      {/* Mobile bottom sheet */}
      {sheetOpen && (
        <div
          className="absolute inset-x-0 bottom-0 z-30 flex max-h-[62dvh] flex-col overflow-hidden rounded-t-2xl border-t border-border bg-card shadow-[0_-12px_40px_rgba(0,0,0,.15)]"
          aria-label={`${selectedDef.name} details`}
          role="region"
        >
          <div className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-foreground/20" aria-hidden="true" />
          <NodeDetail
            key={selectedDef.id}
            def={selectedDef}
            state={states.get(selectedDef.id)!}
            owned={owned}
            credits={credits}
            buying={buying}
            onSelect={select}
            onClose={() => setSelected(null)}
            onBuy={handleBuy}
          />
        </div>
      )}
    </div>
  );
};

const BuildRing = ({ emoji, fraction }: { emoji: string; fraction: number }) => {
  const r = 12;
  const c = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 30 30" className="h-8 w-8 shrink-0" aria-hidden="true">
      <circle cx="15" cy="15" r={r} stroke="#fde7c8" strokeWidth="4" fill="none" />
      <circle
        cx="15"
        cy="15"
        r={r}
        stroke="#f0973c"
        strokeWidth="4"
        fill="none"
        strokeDasharray={`${c * Math.max(0.04, fraction)} ${c}`}
        transform="rotate(-90 15 15)"
      />
      <text x="15" y="19.5" fontSize="12" textAnchor="middle">
        {emoji}
      </text>
    </svg>
  );
};

export default TechTree;
