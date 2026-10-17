import { useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import type { MokkiPieceId } from "@/lib/mokki";
import { C } from "../../palette";
import { WALK_SCALE } from "../FirstPerson";
import { CABIN } from "../Cabin";
import { GROUND_Y } from "../Nature";
import { PIECE_LAYOUT } from "../Pieces";
import { Burst } from "../primitives";
import { BIRCHES } from "../layout";
import type { RunWalkActivity, WalkActivity, WalkSpot } from "./types";

type Vec3 = [number, number, number];

// Chores, löyly, visits and pranks in walk mode: a tappable marker floats over each spot when you're near.
const SHOW_WITHIN = 5.5;

/** Marker anchor (world) for a spot. */
function spotPosition(spot: WalkSpot, pieces: { id: MokkiPieceId; status: string }[]): Vec3 {
  if (spot === "cabin") return [CABIN.position[0] + 0.55, 1.45, CABIN.position[2] + 1.25];
  if (spot === "birch") return [BIRCHES[0][0], GROUND_Y + 1.25, BIRCHES[0][2]];
  if (spot === "dock") {
    const hasDock = pieces.some((p) => p.id === "laituri" && p.status === "complete");
    const [x, , z] = PIECE_LAYOUT.laituri.center;
    return hasDock ? [x - 0.6, 1.15, z] : [4.5, 1.0, -1.2];
  }
  const { center, footprint } = PIECE_LAYOUT[spot];
  const height = spot === "palju" ? footprint[1] * WALK_SCALE.palju : spot === "koira" ? footprint[1] * WALK_SCALE.koppi : Math.min(footprint[1], 1.3);
  return [center[0], center[1] + height + 0.3, center[2]];
}

const SpotMarkers = ({ position, items, onRun }: { position: Vec3; items: WalkActivity[]; onRun: RunWalkActivity }) => {
  const anchor = useRef<THREE.Group>(null);
  const box = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ text: string; id: number } | null>(null);
  const [sparkle, setSparkle] = useState(0);
  const timer = useRef<number>();
  const v = useMemo(() => new THREE.Vector3(), []);

  // Only show markers you're close to (they'd clutter the view and show through walls otherwise)
  useFrame(({ camera }) => {
    if (!anchor.current || !box.current) return;
    anchor.current.getWorldPosition(v);
    const near = camera.position.distanceTo(v) < SHOW_WITHIN;
    box.current.style.opacity = near ? "1" : "0";
    box.current.style.pointerEvents = near ? "auto" : "none";
  });

  const say = (text: string) => {
    setMsg({ text, id: Date.now() });
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setMsg(null), 3200);
  };

  const tap = async (a: WalkActivity) => {
    if (busy) return;
    if (a.state === "done") return say(`${a.emoji} ${a.name}: done for today`);
    if (a.state === "locked") return say(`🔒 ${a.reason ?? "Not available right now"}`);
    setBusy(a.id);
    try {
      say(await onRun(a.id));
      setSparkle((s) => s + 1);
    } catch (e) {
      say(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(null);
    }
  };

  return (
    <group ref={anchor} position={position}>
      <Html center zIndexRange={[7, 0]}>
        <div ref={box} className="flex flex-col items-center gap-1 transition-opacity duration-300" style={{ opacity: 0 }}>
          {msg && (
            <div key={msg.id} className="mb-1 whitespace-nowrap rounded-2xl bg-white/95 px-3 py-1 text-xs font-semibold text-slate-900 shadow-md ring-1 ring-black/10">
              {msg.text}
            </div>
          )}
          <div className="flex gap-1.5">
            {items.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => void tap(a)}
                aria-label={`${a.name}${a.state === "done" ? ", done today" : a.state === "locked" ? `, ${a.reason ?? "locked"}` : ""}`}
                className={`flex min-w-[3.5rem] select-none flex-col items-center rounded-2xl px-2 py-1 shadow-lg ring-2 transition-transform active:scale-90 ${
                  a.state === "ready"
                    ? "bg-white text-slate-900 ring-amber-300 motion-safe:animate-bounce"
                    : a.state === "done"
                      ? "bg-emerald-100/90 text-emerald-900 ring-emerald-300"
                      : "bg-white/70 text-slate-500 ring-white/60"
                }`}
                style={a.state === "ready" ? { animationDuration: "1.6s" } : undefined}
              >
                <span className="text-xl leading-none" aria-hidden="true">
                  {busy === a.id ? "⏳" : a.emoji}
                </span>
                <span className="mt-0.5 text-[10px] font-semibold leading-tight">
                  {a.state === "done" ? "✓ " : a.state === "locked" ? "🔒 " : ""}
                  {a.name}
                </span>
              </button>
            ))}
          </div>
        </div>
      </Html>
      <Burst position={[0, -0.25, 0]} trigger={sparkle} color={C.coin} count={12} radius={0.3} rise={0.4} duration={1.3} size={0.022} />
    </group>
  );
};

export const WalkMarkers = ({ activities, onRun, pieces }: { activities: WalkActivity[]; onRun: RunWalkActivity; pieces: { id: MokkiPieceId; status: string }[] }) => {
  const groups = useMemo(() => {
    const bySpot = new Map<WalkSpot, WalkActivity[]>();
    for (const a of activities) bySpot.set(a.spot, [...(bySpot.get(a.spot) ?? []), a]);
    return [...bySpot.entries()];
  }, [activities]);
  return (
    <>
      {groups.map(([spot, items]) => (
        <SpotMarkers key={spot} position={spotPosition(spot, pieces)} items={items} onRun={onRun} />
      ))}
    </>
  );
};
