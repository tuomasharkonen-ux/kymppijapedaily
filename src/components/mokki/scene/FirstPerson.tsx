import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { PerspectiveCamera } from "@react-three/drei";
import * as THREE from "three";
import type { MokkiPieceId } from "@/lib/mokki";
import type { MokkiEnvironment } from "../environment";
import type { SeasonPalette } from "../palette";
import { CABIN, PORCH_TOP_Y } from "./Cabin";
import { GROUND_Y, LAKE_RADIUS, SHORE_ROCKS } from "./Nature";
import { PIECE_LAYOUT } from "./Pieces";
import { PORCH_POSITIONS } from "./Porch";
import { BIRCHES, FENCE_POSTS, PINES } from "./layout";
import { rand } from "./primitives";
import { box, circle, seg, type Collider, type WalkExtras } from "./walk";

// Walking around the island at eye level. Scene units: the cabin walls are 1.15 tall.
const EYE_HEIGHT = 0.68;
const BODY_RADIUS = 0.13;
const WALK_SPEED = 1.5;
const RUN_SPEED = 2.9;
const TURN_SPEED = 1.9;
const MAX_PITCH = 1.25;
/** Walkable grass on the island (the shore is a little further out, but rocky). */
const ISLAND_WALK_RADIUS = 4.55;
const ISLAND_EDGE_RADIUS = 4.9;
/** On winter ice you can wander out on the lake, up to the far shore. */
const ICE_WALK_RADIUS = 7.0;
const DOCK = { x0: 4.0, x1: 7.3, z: PIECE_LAYOUT.laituri.center[2], halfWidth: 0.4, top: 0.525 };

/**
 * Overview props are drawn big so they read from far away; next to a person they'd be giants.
 * Walk mode shrinks them to real-world size (1 scene unit ≈ 2.3 m at this eye height).
 */
export const WALK_SCALE = {
  /** ~1.2 m post (overview draws it at 1.3×). */
  mailbox: 0.42,
  /** ~30 cm bucket (the model itself is drawn at 1.6×). */
  kiulu: 0.3,
  /** ~1.8 m board. */
  noticeBoard: 0.6,
  /** ~1.7 m wide, ~1.1 m tall tub. */
  palju: 0.75,
  koppi: 0.85,
};

/** Front lawn, looking at the cabin. */
const START = { x: 1.8, z: 4.1, yaw: Math.atan2(1.3, 5.3) };

export interface FirstPersonInput {
  /** Virtual joystick, -1..1 (y down = backwards). */
  joy: { x: number; y: number };
}

export const createFirstPersonInput = (): FirstPersonInput => ({ joy: { x: 0, y: 0 } });

const [CABIN_X, , CABIN_Z] = CABIN.position;
const PORCH = {
  x0: CABIN_X - CABIN.width / 2 - 0.05,
  x1: CABIN_X + CABIN.width / 2 + 0.05,
  z0: CABIN_Z + CABIN.depth / 2,
  z1: CABIN_Z + CABIN.depth / 2 + CABIN.porchDepth,
};

const CABIN_BLOCK = box(CABIN_X, CABIN_Z, CABIN.width + 0.1, CABIN.depth);

/** The porch railings and porch furniture, trees and the yard props that are always there. */
const STATIC_COLLIDERS: Collider[] = [
  // Front railing (left of the steps) and the side railings
  seg(PORCH.x0 + 0.02, PORCH.z1 - 0.03, CABIN_X - 0.27, PORCH.z1 - 0.03, 0.04),
  seg(PORCH.x0 + 0.03, PORCH.z0, PORCH.x0 + 0.03, PORCH.z1, 0.04),
  seg(PORCH.x1 - 0.03, PORCH.z0, PORCH.x1 - 0.03, PORCH.z1, 0.04),
  circle(PORCH_POSITIONS.table[0], PORCH_POSITIONS.table[2], 0.22),
  circle(PORCH_POSITIONS.noticeBoard[0], PORCH_POSITIONS.noticeBoard[2], 0.3 * WALK_SCALE.noticeBoard),
  circle(PORCH_POSITIONS.mailbox[0], PORCH_POSITIONS.mailbox[2], 0.07),
  ...BIRCHES.map(([x, , z]) => circle(x, z, 0.12)),
  ...PINES.map(([x, , z]) => circle(x, z, 0.16)),
];

/** What blocks you once a piece is on the island (building sites are fenced off by their scaffolding). */
function pieceColliders(id: MokkiPieceId): Collider[] {
  const { center, footprint } = PIECE_LAYOUT[id];
  const [x, , z] = center;
  switch (id) {
    case "laituri":
    case "riippumatto":
      return [];
    case "lipputanko":
      return [circle(x, z, 0.1)];
    case "palju":
      return [circle(x, z, 0.62 * WALK_SCALE.palju)];
    case "onkipaikka":
      return [circle(x, z, 0.3)];
    case "nuotiopaikka":
      return [circle(x, z, 0.45)];
    case "koira":
      return [circle(x, z, 0.3 * WALK_SCALE.koppi)];
    case "riukuaita":
      return FENCE_POSTS.slice(1).map(([bx, , bz], i) => seg(FENCE_POSTS[i][0], FENCE_POSTS[i][2], bx, bz, 0.06));
    default:
      return [box(x, z, footprint[0] * 0.9, footprint[2] * 0.9)];
  }
}

function pushOut(c: Collider, p: { x: number; z: number }) {
  if (c.kind === "seg") {
    const dx = c.bx - c.ax;
    const dz = c.bz - c.az;
    const len2 = dx * dx + dz * dz;
    const t = len2 > 0 ? Math.max(0, Math.min(1, ((p.x - c.ax) * dx + (p.z - c.az) * dz) / len2)) : 0;
    const qx = c.ax + dx * t;
    const qz = c.az + dz * t;
    const ox = p.x - qx;
    const oz = p.z - qz;
    const d = Math.hypot(ox, oz);
    const min = c.r + BODY_RADIUS;
    if (d >= min) return;
    if (d < 1e-6) {
      p.x += min;
      return;
    }
    p.x = qx + (ox / d) * min;
    p.z = qz + (oz / d) * min;
    return;
  }
  const hx = c.hx + BODY_RADIUS;
  const hz = c.hz + BODY_RADIUS;
  const dx = p.x - c.cx;
  const dz = p.z - c.cz;
  const px = hx - Math.abs(dx);
  const pz = hz - Math.abs(dz);
  if (px <= 0 || pz <= 0) return;
  if (px < pz) p.x = c.cx + Math.sign(dx || 1) * hx;
  else p.z = c.cz + Math.sign(dz || 1) * hz;
}

const onDock = (x: number, z: number) => x > DOCK.x0 && x < DOCK.x1 && Math.abs(z - DOCK.z) < DOCK.halfWidth;
const onPorch = (x: number, z: number) => x > PORCH.x0 && x < PORCH.x1 && z > PORCH.z0 && z < PORCH.z1;
const onSteps = (x: number, z: number) => x > CABIN_X - 0.27 && x < PORCH.x1 && z >= PORCH.z1 && z < PORCH.z1 + 0.42;

interface Walkway {
  colliders: Collider[];
  hasDock: boolean;
  hasSauna: boolean;
  frozen: boolean;
  extras?: WalkExtras | null;
}

function groundHeight(w: Walkway, x: number, z: number) {
  const inside = w.extras?.floor(x, z, w.hasSauna);
  if (inside != null) return inside;
  if (w.hasDock && onDock(x, z)) return DOCK.top;
  if (onPorch(x, z)) return PORCH_TOP_Y;
  if (onSteps(x, z)) return (PORCH_TOP_Y + GROUND_Y) / 2;
  return Math.hypot(x, z) < ISLAND_EDGE_RADIUS ? GROUND_Y : 0.02;
}

function walkable(w: Walkway, x: number, z: number) {
  const r = Math.hypot(x, z);
  if (r < (w.frozen ? ICE_WALK_RADIUS : ISLAND_WALK_RADIUS)) return true;
  return w.hasDock && onDock(x, z);
}

/** Moves towards (x, z): bumps off colliders, slides along the shoreline instead of stepping into the lake. */
function step(w: Walkway, from: { x: number; z: number }, x: number, z: number) {
  const attempt = (tx: number, tz: number) => {
    const p = { x: tx, z: tz };
    for (let i = 0; i < 2; i++) for (const c of w.colliders) pushOut(c, p);
    return walkable(w, p.x, p.z) ? p : null;
  };
  let p = attempt(x, z);
  const limit = w.frozen ? ICE_WALK_RADIUS : ISLAND_WALK_RADIUS;
  const r = Math.hypot(x, z);
  if (!p && r > 0 && Math.hypot(from.x, from.z) <= limit) p = attempt((x / r) * limit * 0.999, (z / r) * limit * 0.999);
  return p ?? attempt(x, from.z) ?? attempt(from.x, z) ?? from;
}

// ---------------------------------------------------------------------------
// Camera rig
// ---------------------------------------------------------------------------

const MOVE_KEYS = new Set(["KeyW", "KeyA", "KeyS", "KeyD", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "ShiftLeft", "ShiftRight"]);

export const FirstPersonRig = ({
  pieces,
  frozen,
  input,
  extras,
  doorClosed = false,
  onExit,
}: {
  pieces: { id: MokkiPieceId; status: string }[];
  frozen: boolean;
  input: React.MutableRefObject<FirstPersonInput>;
  /** Detailed models: open doorways and furnished interiors. */
  extras?: WalkExtras | null;
  /** Visiting: the cabin door is shut. */
  doorClosed?: boolean;
  onExit?: () => void;
}) => {
  const camera = useRef<THREE.PerspectiveCamera>(null);
  const { gl, size, scene } = useThree();

  const walkway = useMemo<Walkway>(() => {
    const hasSauna = pieces.some((p) => p.id === "sauna" && p.status === "complete");
    const colliders = [
      ...STATIC_COLLIDERS,
      ...(extras ? [...extras.cabin, ...(doorClosed ? extras.cabinDoor : [])] : [CABIN_BLOCK]),
      ...pieces.flatMap((p) => (p.id === "sauna" && hasSauna && extras ? extras.sauna : pieceColliders(p.id))),
    ];
    if (frozen) colliders.push(...SHORE_ROCKS.map((r) => circle(r.pos[0], r.pos[2], r.s * 1.1)), circle(-1.7, 6.5, 0.95));
    return { colliders, hasDock: pieces.some((p) => p.id === "laituri" && p.status === "complete"), hasSauna, frozen, extras };
  }, [pieces, frozen, extras, doorClosed]);

  const state = useRef<{ x: number; z: number; y: number; yaw: number; pitch: number; vx: number; vz: number; bob: number } | null>(null);
  if (!state.current) {
    state.current = { x: START.x, z: START.z, y: GROUND_Y + EYE_HEIGHT, yaw: START.yaw, pitch: -0.04, vx: 0, vz: 0, bob: 0 };
  }
  const keys = useRef(new Set<string>());
  // Dev only: lets the preview page (and tests) read or place the walker
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    Object.assign(window, { __mokkiWalker: state.current, __mokkiScene: scene });
  }, [scene]);

  // A piece can land on top of you: step out of it
  useEffect(() => {
    const s = state.current!;
    const p = step(walkway, s, s.x, s.z);
    s.x = p.x;
    s.z = p.z;
  }, [walkway]);

  // Keyboard: WASD/arrows to walk, left/right arrows turn, Shift runs, Esc leaves
  useEffect(() => {
    const typing = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      return !!el && (el.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName));
    };
    const down = (e: KeyboardEvent) => {
      // Typing in a field, or a sheet/dialog is open on top of the scene
      if (typing(e) || document.querySelector('[role="dialog"]')) return;
      if (e.code === "Escape") {
        onExit?.();
        return;
      }
      if (!MOVE_KEYS.has(e.code)) return;
      keys.current.add(e.code);
      if (e.code.startsWith("Arrow")) e.preventDefault();
    };
    const up = (e: KeyboardEvent) => keys.current.delete(e.code);
    const clear = () => keys.current.clear();
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", clear);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", clear);
    };
  }, [onExit]);

  // Drag anywhere on the scene to look around (one finger; the joystick is a separate element)
  useEffect(() => {
    const el = gl.domElement;
    let active: { id: number; x: number; y: number } | null = null;
    const down = (e: PointerEvent) => {
      if (active) return;
      active = { id: e.pointerId, x: e.clientX, y: e.clientY };
    };
    const move = (e: PointerEvent) => {
      if (!active || e.pointerId !== active.id) return;
      const s = state.current!;
      const k = e.pointerType === "touch" ? 0.0065 : 0.0045;
      s.yaw -= (e.clientX - active.x) * k;
      s.pitch = Math.max(-MAX_PITCH, Math.min(MAX_PITCH, s.pitch - (e.clientY - active.y) * k));
      active.x = e.clientX;
      active.y = e.clientY;
    };
    const up = (e: PointerEvent) => {
      if (active && e.pointerId === active.id) active = null;
    };
    el.addEventListener("pointerdown", down);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    return () => {
      el.removeEventListener("pointerdown", down);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
    };
  }, [gl]);

  useFrame((_, rawDelta) => {
    const cam = camera.current;
    const s = state.current!;
    if (!cam) return;
    const dt = Math.min(rawDelta, 0.05);
    const k = keys.current;
    const key = (...codes: string[]) => (codes.some((c) => k.has(c)) ? 1 : 0);

    s.yaw -= (key("ArrowRight") - key("ArrowLeft")) * TURN_SPEED * dt;
    let forward = key("KeyW", "ArrowUp") - key("KeyS", "ArrowDown") - input.current.joy.y;
    let strafe = key("KeyD") - key("KeyA") + input.current.joy.x;
    const mag = Math.hypot(forward, strafe);
    if (mag > 1) {
      forward /= mag;
      strafe /= mag;
    }
    const speed = key("ShiftLeft", "ShiftRight") ? RUN_SPEED : WALK_SPEED;
    const sin = Math.sin(s.yaw);
    const cos = Math.cos(s.yaw);
    const tvx = (-sin * forward + cos * strafe) * speed;
    const tvz = (-cos * forward - sin * strafe) * speed;
    const ease = 1 - Math.exp(-10 * dt);
    s.vx += (tvx - s.vx) * ease;
    s.vz += (tvz - s.vz) * ease;

    if (Math.abs(s.vx) + Math.abs(s.vz) > 1e-4) {
      const p = step(walkway, s, s.x + s.vx * dt, s.z + s.vz * dt);
      // Bumping into something kills the push into it
      s.vx = (p.x - s.x) / dt;
      s.vz = (p.z - s.z) / dt;
      s.x = p.x;
      s.z = p.z;
    }
    const moving = Math.hypot(s.vx, s.vz);
    s.bob += moving * dt * 7;
    const ground = groundHeight(walkway, s.x, s.z) + EYE_HEIGHT;
    s.y += (ground - s.y) * (1 - Math.exp(-14 * dt));

    cam.position.set(s.x, s.y + Math.sin(s.bob) * 0.018 * Math.min(1, moving / WALK_SPEED), s.z);
    cam.rotation.set(s.pitch, s.yaw, 0, "YXZ");
  });

  // Keep roughly an 80° horizontal view: portrait phones get a taller frustum, wide screens don't go fisheye
  const aspect = size.width / Math.max(1, size.height);
  const fov = THREE.MathUtils.clamp(THREE.MathUtils.radToDeg(2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(40)) / aspect)), 55, 90);

  return <PerspectiveCamera ref={camera} makeDefault fov={fov} near={0.08} far={220} position={[START.x, GROUND_Y + EYE_HEIGHT, START.z]} />;
};

// ---------------------------------------------------------------------------
// Horizon: the diorama's lake edge would show at eye level, so open water and a distant treeline take over
// ---------------------------------------------------------------------------

const HORIZON_RADIUS = 160;

export const Horizon = ({ env, palette }: { env: MokkiEnvironment; palette: SeasonPalette }) => {
  const forest = useRef<THREE.InstancedMesh>(null);
  const trees = useMemo(
    () =>
      Array.from({ length: 220 }, (_, i) => {
        const a = (i / 220) * Math.PI * 2 + rand(i + 900) * 0.03;
        const r = 34 + rand(i + 910) * 14;
        const h = 3.5 + rand(i + 920) * 4.5;
        return { x: Math.cos(a) * r, z: Math.sin(a) * r, h, w: h * (0.26 + rand(i + 930) * 0.08) };
      }),
    [],
  );
  useEffect(() => {
    const mesh = forest.current;
    if (!mesh) return;
    const m = new THREE.Matrix4();
    trees.forEach((t, i) => {
      m.compose(new THREE.Vector3(t.x, t.h / 2 - 0.1, t.z), new THREE.Quaternion(), new THREE.Vector3(t.w, t.h, t.w));
      mesh.setMatrixAt(i, m);
    });
    mesh.instanceMatrix.needsUpdate = true;
  }, [trees]);

  return (
    <group>
      <fog attach="fog" args={[env.skyBottom, 14, 75]} />
      {/* Open lake beyond the diorama edge */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} userData={{ noShadow: true }} raycast={() => null}>
        <ringGeometry args={[LAKE_RADIUS, 33.5, 64, 1]} />
        <meshPhongMaterial color={palette.water} specular={palette.frozen ? "#ffffff" : "#cfe9f5"} shininess={palette.frozen ? 40 : 70} flatShading />
      </mesh>
      {/* Distant shoreline: a low band of land with a spruce treeline */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]} userData={{ noShadow: true }} raycast={() => null}>
        <ringGeometry args={[33, HORIZON_RADIUS, 64, 1]} />
        <meshLambertMaterial color={palette.snow ? palette.grass : palette.pine} />
      </mesh>
      <instancedMesh ref={forest} args={[undefined, undefined, trees.length]} userData={{ noShadow: true }} raycast={() => null}>
        <coneGeometry args={[1, 1, 6]} />
        <meshLambertMaterial color={palette.pine} flatShading />
      </instancedMesh>
    </group>
  );
};

// ---------------------------------------------------------------------------
// Touch: dragging to look must never scroll, bounce or zoom the page
// ---------------------------------------------------------------------------

/**
 * While walking: cancels touch scrolling on the scene (iOS Safari ignores touch-action in places),
 * locks page scroll + pull-to-refresh, and blocks iOS pinch-zoom. Taps still click (touchstart is untouched).
 */
export function useWalkTouchLock(ref: React.RefObject<HTMLElement>, enabled: boolean) {
  useEffect(() => {
    const el = ref.current;
    if (!enabled || !el) return;
    const stop = (e: Event) => {
      if (e.cancelable) e.preventDefault();
    };
    el.addEventListener("touchmove", stop, { passive: false });
    document.addEventListener("gesturestart", stop, { passive: false });
    const html = document.documentElement.style;
    const body = document.body.style;
    const saved = [html.overflow, html.overscrollBehavior, body.overflow, body.overscrollBehavior];
    html.overflow = body.overflow = "hidden";
    html.overscrollBehavior = body.overscrollBehavior = "none";
    return () => {
      el.removeEventListener("touchmove", stop);
      document.removeEventListener("gesturestart", stop);
      [html.overflow, html.overscrollBehavior, body.overflow, body.overscrollBehavior] = saved;
    };
  }, [ref, enabled]);
}

// ---------------------------------------------------------------------------
// On-screen controls
// ---------------------------------------------------------------------------

function useCoarsePointer() {
  const [coarse, setCoarse] = useState(() => typeof window !== "undefined" && window.matchMedia?.("(pointer: coarse)").matches);
  useEffect(() => {
    const mq = window.matchMedia?.("(pointer: coarse)");
    if (!mq) return;
    const onChange = () => setCoarse(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return coarse;
}

const STICK_RADIUS = 44;

/** Touch joystick (bottom-left) plus a short how-to that fades away. */
export const FirstPersonOverlay = ({ input }: { input: React.MutableRefObject<FirstPersonInput> }) => {
  const coarse = useCoarsePointer();
  const base = useRef<HTMLDivElement>(null);
  const pointer = useRef<number | null>(null);
  const [knob, setKnob] = useState({ x: 0, y: 0 });
  const [hint, setHint] = useState(true);

  useEffect(() => {
    const t = window.setTimeout(() => setHint(false), 6000);
    return () => window.clearTimeout(t);
  }, []);
  useEffect(() => {
    const joy = input.current.joy;
    return () => {
      joy.x = 0;
      joy.y = 0;
    };
  }, [input]);

  const track = (e: React.PointerEvent) => {
    const rect = base.current!.getBoundingClientRect();
    const dx = e.clientX - (rect.left + rect.width / 2);
    const dy = e.clientY - (rect.top + rect.height / 2);
    const d = Math.hypot(dx, dy);
    const k = d > STICK_RADIUS ? STICK_RADIUS / d : 1;
    setKnob({ x: dx * k, y: dy * k });
    input.current.joy.x = (dx * k) / STICK_RADIUS;
    input.current.joy.y = (dy * k) / STICK_RADIUS;
  };
  const release = (e: React.PointerEvent) => {
    if (e.pointerId !== pointer.current) return;
    pointer.current = null;
    setKnob({ x: 0, y: 0 });
    input.current.joy.x = 0;
    input.current.joy.y = 0;
  };

  return (
    <>
      {coarse && (
        <div
          ref={base}
          role="presentation"
          className="absolute bottom-[max(2rem,env(safe-area-inset-bottom))] left-6 z-10 h-28 w-28 touch-none select-none rounded-full bg-black/20 ring-2 ring-white/60 backdrop-blur-sm"
          onPointerDown={(e) => {
            if (pointer.current !== null) return;
            pointer.current = e.pointerId;
            try {
              e.currentTarget.setPointerCapture(e.pointerId);
            } catch {
              // Pointer already gone; the move/up handlers still track it
            }
            setHint(false);
            track(e);
          }}
          onPointerMove={(e) => e.pointerId === pointer.current && track(e)}
          onPointerUp={release}
          onPointerCancel={release}
        >
          <div
            className="pointer-events-none absolute left-1/2 top-1/2 -ml-6 -mt-6 h-12 w-12 rounded-full bg-white/90 shadow-md"
            style={{ transform: `translate(${knob.x}px, ${knob.y}px)` }}
          />
        </div>
      )}
      <div
        className={`pointer-events-none absolute inset-x-0 bottom-[max(2.5rem,env(safe-area-inset-bottom))] z-10 flex justify-center px-4 transition-opacity duration-700 ${
          hint ? "opacity-100" : "opacity-0"
        } ${coarse ? "pl-36" : ""}`}
        aria-live="polite"
      >
        <p className="rounded-full bg-black/55 px-4 py-1.5 text-center text-xs text-white backdrop-blur-sm">
          {coarse ? "Stick to walk · drag to look · tap things!" : "WASD to walk · drag to look · Shift runs · click things! · Esc leaves"}
        </p>
      </div>
    </>
  );
};
