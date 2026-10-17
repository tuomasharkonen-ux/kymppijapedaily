import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { getOpeningDice, helsinkiDate } from "@/lib/kymppijape";
import { loadGame, saveGame } from "@/lib/gameState";
import { C } from "../../palette";
import { SKIN_DIE } from "../Porch";
import { Block, Burst, Cyl } from "../primitives";
import { Bubble, HitBox, Tappable, useSay } from "./interact";
import { playClick, playDiceRoll, playKymppi } from "./sounds";
import type { PorchDailyGame } from "./types";

type Vec3 = [number, number, number];

// Ten real-size dice on the porch table.
// - Today's game (your own island, not played yet): the real Kymppijape. Tap a die to lock it, tap the table
//   to throw the rest. Shares the saved game with the main board and saves the result the same way.
// - Otherwise free play: tap anywhere and the most common number is kept automatically.
const COUNT = 10;
const SIZE = 0.032;
const TOP = 0.36; // table top (table-local)
const REST_Y = TOP + SIZE / 2;
const NAMES = ["ones", "twos", "threes", "fours", "fives", "sixes"];

// Box faces in three.js order (+x, -x, +y, -y, +z, -z) and the number printed on each (opposites sum to 7)
const FACE_NUMBERS = [3, 4, 1, 6, 2, 5];
const PIPS: Record<number, [number, number][]> = {
  1: [[0.5, 0.5]],
  2: [[0.27, 0.27], [0.73, 0.73]],
  3: [[0.27, 0.27], [0.5, 0.5], [0.73, 0.73]],
  4: [[0.27, 0.27], [0.73, 0.27], [0.27, 0.73], [0.73, 0.73]],
  5: [[0.27, 0.27], [0.73, 0.27], [0.5, 0.5], [0.27, 0.73], [0.73, 0.73]],
  6: [[0.27, 0.25], [0.73, 0.25], [0.27, 0.5], [0.73, 0.5], [0.27, 0.75], [0.73, 0.75]],
};

/** Rotation that brings face `value` to the top. */
const FACE_UP: Record<number, THREE.Quaternion> = {
  1: new THREE.Quaternion(),
  6: new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI),
  2: new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI / 2),
  5: new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI / 2),
  3: new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI / 2),
  4: new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), -Math.PI / 2),
};
const UP = new THREE.Vector3(0, 1, 0);
const restingQuat = (value: number, yaw: number) => new THREE.Quaternion().setFromAxisAngle(UP, yaw).multiply(FACE_UP[value]);

function diceGeometry() {
  const g = new THREE.BoxGeometry(SIZE, SIZE, SIZE);
  const uv = g.attributes.uv as THREE.BufferAttribute;
  // Each face's 4 UVs → that number's cell in a 3×2 atlas
  for (let face = 0; face < 6; face++) {
    const n = FACE_NUMBERS[face];
    const col = (n - 1) % 3;
    const row = Math.floor((n - 1) / 3);
    for (let i = face * 4; i < face * 4 + 4; i++) uv.setXY(i, (col + uv.getX(i)) / 3, (1 - row) / 2 + uv.getY(i) / 2);
  }
  return g;
}

function diceTexture(body: string, pip: string) {
  const cell = 64;
  const canvas = document.createElement("canvas");
  canvas.width = cell * 3;
  canvas.height = cell * 2;
  const ctx = canvas.getContext("2d")!;
  for (let n = 1; n <= 6; n++) {
    const x0 = ((n - 1) % 3) * cell;
    const y0 = Math.floor((n - 1) / 3) * cell;
    ctx.fillStyle = body;
    ctx.fillRect(x0, y0, cell, cell);
    ctx.fillStyle = pip;
    for (const [px, py] of PIPS[n]) {
      ctx.beginPath();
      ctx.arc(x0 + px * cell, y0 + py * cell, cell * 0.09, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

/** Little tent card on the table: "today's game is here". */
function signTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#fbf6e6";
  ctx.fillRect(0, 0, 256, 128);
  ctx.strokeStyle = "#c0392b";
  ctx.lineWidth = 8;
  ctx.strokeRect(6, 6, 244, 116);
  ctx.fillStyle = "#1f1f1f";
  ctx.textAlign = "center";
  ctx.font = "bold 34px system-ui, sans-serif";
  ctx.fillText("Today's game", 128, 56);
  ctx.font = "26px system-ui, sans-serif";
  ctx.fillText("tap to play", 128, 96);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

interface DieState {
  value: number;
  locked: boolean;
  /** Was locked when the last throw was made (unlocking it counts as "unlocked any"). */
  committed: boolean;
  pos: THREE.Vector3;
  quat: THREE.Quaternion;
  anim: { from: THREE.Vector3; fromQ: THREE.Quaternion; start: number; dur: number; hop: number; spins: number; axis: THREE.Vector3 } | null;
}

const roll = () => 1 + Math.floor(Math.random() * 6);
const lineSpot = (i: number) => new THREE.Vector3(-0.19 + i * 0.042, REST_Y, 0.135);
const LINE_Z = 0.11;

/** A free spot for a loose die, away from the cup and the other loose dice. */
function freeSpot(taken: THREE.Vector3[]) {
  for (let tries = 0; tries < 200; tries++) {
    const p = new THREE.Vector3(-0.07 + Math.random() * 0.29, REST_Y, -0.15 + Math.random() * 0.2);
    if (taken.every((s) => s.distanceTo(p) > SIZE * 1.6)) return p;
  }
  return new THREE.Vector3(0.05, REST_Y, -0.05);
}

export const PorchDice = ({ skin, daily }: { skin: string; daily?: PorchDailyGame }) => {
  const look = SKIN_DIE[skin] ?? SKIN_DIE.default;
  const geometry = useMemo(diceGeometry, []);
  const texture = useMemo(() => diceTexture(look.body, look.pip), [look.body, look.pip]);
  const sign = useMemo(signTexture, []);
  useEffect(() => () => geometry.dispose(), [geometry]);
  useEffect(() => () => texture.dispose(), [texture]);
  useEffect(() => () => sign.dispose(), [sign]);

  const meshes = useRef<(THREE.Mesh | null)[]>([]);
  const dice = useRef<DieState[]>([]);
  const clock = useRef(0);
  const [msg, say] = useSay(3200);
  const [party, setParty] = useState(0);
  // Free play
  const free = useRef({ throws: 0, done: false });
  // Today's game (mirrors lib/gameState's SavedGame)
  const gameDate = useMemo(() => helsinkiDate(), []);
  const game = useRef({ throwCount: 0, throwLog: [] as number[][], unlockedAny: false, usedAction: false, complete: false, saving: false });
  const [dailyActive, setDailyActive] = useState(!!daily);

  // Lay out the dice once, continuing today's game if one is in progress
  if (dice.current.length === 0) {
    const saved = daily ? loadGame(daily.userId, gameDate) : null;
    const started = !!saved && saved.throwCount > 0;
    const taken: THREE.Vector3[] = [];
    let line = 0;
    dice.current = Array.from({ length: COUNT }, (_, i) => {
      const d = started ? saved.dice[i] : null;
      const value = d?.value || roll();
      const locked = !!d?.isLocked;
      const pos = locked ? lineSpot(line++) : freeSpot(taken);
      if (!locked) taken.push(pos);
      return { value, locked, committed: !!d?.isCommitted, pos, quat: restingQuat(value, locked ? 0 : Math.random() * Math.PI * 2), anim: null };
    });
    if (started) {
      game.current = { ...game.current, throwCount: saved.throwCount, throwLog: saved.throwLog, unlockedAny: saved.unlockedAny, usedAction: saved.usedAction };
    }
  }

  // Once today's game is saved this table turns into free play
  useEffect(() => {
    if (!daily) setDailyActive(false);
  }, [daily]);

  const persist = () => {
    if (!daily) return;
    const g = game.current;
    saveGame(daily.userId, gameDate, {
      dice: dice.current.map((d) => ({ value: d.value, isLocked: d.locked, isCommitted: d.committed })),
      throwCount: g.throwCount,
      throwLog: g.throwLog,
      unlockedAny: g.unlockedAny,
      usedAction: g.usedAction,
      // Betting happens on the main board; keep whatever it decided
      bettingClosed: loadGame(daily.userId, gameDate)?.bettingClosed ?? false,
    });
  };

  /**
   * Locked dice line up at the front edge; loose ones stay put unless `thrown` (bounce to a new spot) or
   * just unlocked from the line (slide back onto the table).
   */
  const relayout = (thrown: Set<DieState>) => {
    const now = clock.current;
    let line = 0;
    const taken = dice.current.filter((d) => !d.locked && !thrown.has(d) && d.pos.z < LINE_Z).map((d) => d.pos);
    for (const d of dice.current) {
      if (d.locked) {
        const to = lineSpot(line++);
        if (d.pos.distanceTo(to) > 1e-3) {
          d.anim = { from: d.pos.clone(), fromQ: d.quat.clone(), start: now, dur: 0.35, hop: 0.02, spins: 0, axis: UP };
          d.pos = to;
          d.quat = restingQuat(d.value, 0);
        }
        continue;
      }
      if (thrown.has(d)) {
        const to = freeSpot(taken);
        taken.push(to);
        d.anim = {
          from: d.pos.clone(),
          fromQ: d.quat.clone(),
          start: now + Math.random() * 0.08,
          dur: 0.7 + Math.random() * 0.2,
          hop: 0.1 + Math.random() * 0.08,
          spins: 1 + Math.floor(Math.random() * 2),
          axis: new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize(),
        };
        d.pos = to;
        d.quat = restingQuat(d.value, Math.random() * Math.PI * 2);
      } else if (d.pos.z > LINE_Z) {
        const to = freeSpot(taken);
        taken.push(to);
        d.anim = { from: d.pos.clone(), fromQ: d.quat.clone(), start: now, dur: 0.35, hop: 0.03, spins: 0, axis: UP };
        d.pos = to;
      }
    }
  };

  /** Throws every unlocked die (to the given values, or random). */
  const throwLoose = (values: number[] | null) => {
    const loose = new Set(dice.current.filter((d) => !d.locked));
    dice.current.forEach((d, i) => {
      if (d.locked) {
        d.committed = true;
        return;
      }
      d.value = values ? values[i] : roll();
      d.committed = false;
    });
    relayout(loose);
    playDiceRoll(loose.size);
  };

  const counts = () => {
    const c = [0, 0, 0, 0, 0, 0, 0];
    dice.current.forEach((d) => c[d.value]++);
    return c;
  };

  // ---------------------------------------------------------------- today's game
  const dailyThrow = () => {
    const g = game.current;
    if (g.complete || g.saving || !daily) return;
    if (g.throwCount > 0 && dice.current.every((d) => d.locked)) {
      say("All dice are locked: unlock one to throw again");
      return;
    }
    const opening = g.throwCount === 0 ? getOpeningDice(gameDate) : null;
    if (opening) dice.current.forEach((d) => (d.locked = false));
    throwLoose(opening);
    g.throwCount++;
    g.throwLog = [...g.throwLog, dice.current.map((d) => d.value)];
    persist();
    window.setTimeout(
      () =>
        say(
          opening
            ? "🎲 Today's opening throw! Tap dice to lock them, tap the table to throw"
            : `🎲 Throw ${g.throwCount} · ${dice.current.filter((d) => d.locked).length} locked`,
        ),
      750,
    );
  };

  const dailyToggle = (d: DieState) => {
    const g = game.current;
    if (!daily || g.complete || g.saving) return;
    if (g.throwCount === 0) {
      dailyThrow();
      return;
    }
    if (d.anim) return;
    if (d.locked && d.committed) g.unlockedAny = true;
    d.locked = !d.locked;
    d.committed = false;
    playClick();
    relayout(new Set());
    persist();

    const first = dice.current[0].value;
    if (!dice.current.every((x) => x.locked && x.value === first)) return;
    g.complete = true;
    g.saving = true;
    setParty((p) => p + 1);
    playKymppi();
    say(`🎉 KYMPPI! Ten ${NAMES[first - 1]} in ${g.throwCount} ${g.throwCount === 1 ? "throw" : "throws"} · saving…`);
    daily
      .onComplete(g.throwCount, first, { throwLog: g.throwLog, unlockedAny: g.unlockedAny })
      .then(() => say(`🎉 KYMPPI in ${g.throwCount}! Saved to your daily run`))
      .catch((e: unknown) => {
        g.complete = false;
        say(`Couldn't save: ${e instanceof Error ? e.message : "try again"}`);
      })
      .finally(() => {
        g.saving = false;
      });
  };

  // ---------------------------------------------------------------- free play
  const freeThrow = () => {
    const f = free.current;
    if (f.done || f.throws === 0) {
      f.throws = 0;
      f.done = false;
      dice.current.forEach((d) => (d.locked = false));
    }
    // Keep the most common number (ties → the higher one), re-roll everything else
    if (f.throws > 0) {
      const c = counts();
      let keep = 0;
      for (let v = 1; v <= 6; v++) if (c[v] >= c[keep]) keep = v;
      dice.current.forEach((d) => (d.locked = d.value === keep));
    }
    f.throws++;
    throwLoose(null);
    const c = counts();
    const best = c.indexOf(Math.max(...c));
    if (c[best] === COUNT) {
      f.done = true;
      window.setTimeout(() => {
        say(`🎉 KYMPPI! Ten ${NAMES[best - 1]} in ${f.throws} ${f.throws === 1 ? "throw" : "throws"}`);
        setParty((p) => p + 1);
        playKymppi();
      }, 800);
    } else {
      window.setTimeout(() => say(`🎲 Throw ${f.throws} · ${c[best]} ${NAMES[best - 1]}${f.throws === 1 ? " · tap to keep rolling" : ""}`), 750);
    }
  };

  const playingToday = dailyActive && !!daily;
  const onTable = () => (playingToday ? dailyThrow() : freeThrow());
  const onDie = (i: number) => (playingToday ? dailyToggle(dice.current[i]) : freeThrow());

  const q = useMemo(() => new THREE.Quaternion(), []);
  const spin = useMemo(() => new THREE.Quaternion(), []);
  useFrame(({ clock: c }) => {
    clock.current = c.getElapsedTime();
    const now = clock.current;
    dice.current.forEach((d, i) => {
      const m = meshes.current[i];
      if (!m) return;
      const a = d.anim;
      if (!a || now >= a.start + a.dur) {
        d.anim = null;
        m.position.copy(d.pos);
        m.quaternion.copy(d.quat);
        return;
      }
      const t = Math.max(0, (now - a.start) / a.dur);
      const e = 1 - Math.pow(1 - t, 3);
      m.position.lerpVectors(a.from, d.pos, e);
      // Big hop, then a little bounce on landing
      m.position.y = REST_Y + (t < 0.8 ? a.hop * Math.sin((Math.PI * t) / 0.8) : a.hop * 0.15 * Math.sin((Math.PI * (t - 0.8)) / 0.2));
      q.slerpQuaternions(a.fromQ, d.quat, e);
      spin.setFromAxisAngle(a.axis, a.spins * Math.PI * 2 * e);
      m.quaternion.copy(spin).multiply(q);
    });
  });

  return (
    <group>
      <Tappable onTap={onTable}>
        <Block size={[0.5, 0.04, 0.36]} position={[0, 0.34, 0]} color={C.plank} />
        {[
          [-0.21, -0.14],
          [0.21, -0.14],
          [-0.21, 0.14],
          [0.21, 0.14],
        ].map(([x, z], i) => (
          <Block key={i} size={[0.035, 0.32, 0.035]} position={[x, 0.16, z]} color={C.plankDark} />
        ))}
        <Cyl radiusTop={0.035} radiusBottom={0.03} height={0.07} segments={8} position={[-0.14, 0.395, 0.06]} color={C.white} />
        {/* Thin tap target over the table top (the dice sit above it, so tapping a die hits the die) */}
        <HitBox size={[0.54, 0.012, 0.4]} position={[0, TOP + 0.006, 0]} />
        {playingToday && (
          <group position={[-0.17, TOP + 0.022, -0.11]} rotation={[0, 0.5, 0]}>
            {[1, -1].map((s) => (
              <mesh key={s} position={[0, 0, s * 0.008]} rotation={[-s * 0.35, s === 1 ? 0 : Math.PI, 0]}>
                <planeGeometry args={[0.1, 0.05]} />
                <meshStandardMaterial map={sign} roughness={0.8} />
              </mesh>
            ))}
          </group>
        )}
      </Tappable>
      {Array.from({ length: COUNT }, (_, i) => (
        <Tappable key={i} onTap={() => onDie(i)}>
          <mesh ref={(el) => (meshes.current[i] = el)} geometry={geometry}>
            {/* No environment map to reflect, so keep metal skins only slightly metallic or they go dark */}
            <meshStandardMaterial map={texture} metalness={Math.min(look.metal ?? 0, 0.3)} roughness={look.metal ? 0.35 : 0.55} />
            {/* Bigger than the die: they're small to hit with a finger */}
            <HitBox size={[0.05, 0.05, 0.05]} />
          </mesh>
        </Tappable>
      ))}
      <Burst position={[0.02, TOP + 0.02, 0] as Vec3} trigger={party} color={C.coin} count={18} radius={0.28} rise={0.35} duration={1.4} size={0.035} />
      <Bubble position={[0, 0.62, 0]} msg={msg} />
    </group>
  );
};
