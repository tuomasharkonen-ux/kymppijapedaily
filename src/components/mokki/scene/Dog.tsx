import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import type { DogBreedId } from "@/lib/mokki";
import { PORCH_TOP_Y } from "./Cabin";
import { DOG_PATH } from "./layout";
import { GROUND_Y } from "./Nature";
import { Mat, rand } from "./primitives";

type Vec3 = [number, number, number];

// One rig for every breed: forward is +x, origin on the ground under the body
interface Rig {
  bodyLen: number;
  bodyR: number;
  legLen: number;
  legR: number;
  headR: number;
  /** Extra neck height (poodles hold their heads high). */
  neck: number;
  snoutLen: number;
  snoutR: number;
  coat: string;
  speed: number;
  /** Leg swing (radians) and how much the body bounces per step. */
  stride: number;
  bounce: number;
}

const RIGS: Record<DogBreedId, Rig> = {
  puudeli: { bodyLen: 0.26, bodyR: 0.075, legLen: 0.2, legR: 0.02, headR: 0.068, neck: 0.1, snoutLen: 0.09, snoutR: 0.025, coat: "#7b4a2d", speed: 0.55, stride: 0.75, bounce: 0.025 },
  aussi: { bodyLen: 0.4, bodyR: 0.11, legLen: 0.19, legR: 0.033, headR: 0.09, neck: 0.04, snoutLen: 0.09, snoutR: 0.04, coat: "#1d1d22", speed: 0.72, stride: 0.55, bounce: 0.012 },
  lagotto: { bodyLen: 0.36, bodyR: 0.11, legLen: 0.18, legR: 0.034, headR: 0.095, neck: 0.04, snoutLen: 0.07, snoutR: 0.045, coat: "#8a5a3b", speed: 0.6, stride: 0.55, bounce: 0.015 },
};

const WHITE = "#f4f1ea";
const NOSE = "#151212";

/** Clump of small curls (lagotto coat, poodle pom-poms). */
const Curls = ({
  count,
  radius,
  size,
  color,
  dark,
  seed,
  scale = [1, 1, 1],
  openFace = false,
}: {
  count: number;
  radius: number;
  size: number;
  color: string;
  dark?: string;
  seed: number;
  scale?: Vec3;
  /** Leave the front (+x) lower half bare so eyes and muzzle show. */
  openFace?: boolean;
}) => (
  <group scale={scale}>
    {Array.from({ length: count }, (_, i) => {
      // Points spread over a sphere (golden spiral) with a little jitter
      const y = 1 - ((i + 0.5) / count) * 2;
      const r = Math.sqrt(1 - y * y);
      const a = i * 2.39996 + seed;
      const j = 0.85 + rand(seed + i) * 0.3;
      if (openFace && Math.cos(a) * r > 0.25 && y < 0.55) return null;
      return (
        <mesh key={i} position={[Math.cos(a) * r * radius * j, y * radius * j, Math.sin(a) * r * radius * j]} rotation={[rand(i + seed) * 3, rand(i + seed + 1) * 3, 0]}>
          <icosahedronGeometry args={[size * (0.8 + rand(seed + i * 3) * 0.4), 0]} />
          <Mat color={dark && i % 3 === 0 ? dark : color} roughness={1} />
        </mesh>
      );
    })}
  </group>
);

const Ball = ({ r, color, position, scale }: { r: number; color: string; position?: Vec3; scale?: Vec3 }) => (
  <mesh position={position} scale={scale}>
    <icosahedronGeometry args={[r, 1]} />
    <Mat color={color} />
  </mesh>
);

// ---------------------------------------------------------------------------
// Breed looks
// ---------------------------------------------------------------------------

const Body = ({ breed, rig }: { breed: DogBreedId; rig: Rig }) => {
  const { bodyLen: L, bodyR: R, coat } = rig;
  if (breed === "lagotto") {
    return (
      <group>
        <Ball r={1} color={coat} scale={[L * 0.55, R * 0.92, R * 0.85]} />
        <Curls count={46} radius={1} size={0.034} color={coat} dark="#6f4529" seed={3} scale={[L * 0.56, R * 0.95, R * 0.9]} />
      </group>
    );
  }
  if (breed === "puudeli") {
    return (
      <group>
        {/* Clipped body: slim behind, a fluffy mane on the chest */}
        <Ball r={1} color={coat} scale={[L * 0.55, R * 0.8, R * 0.75]} />
        <Curls count={22} radius={1} size={0.032} color="#8a5534" seed={9} scale={[0.1, 0.095, 0.085]} />
      </group>
    );
  }
  // Aussie: black with a white chest and ruff
  return (
    <group>
      <Ball r={1} color={coat} scale={[L * 0.55, R, R * 0.88]} />
      <Ball r={1} color={coat} position={[-L * 0.05, R * 0.25, 0]} scale={[L * 0.4, R * 0.85, R * 0.95]} />
      <Ball r={1} color={WHITE} position={[L * 0.4, -R * 0.15, 0]} scale={[R * 0.55, R * 0.8, R * 0.7]} />
    </group>
  );
};

const Head = ({ breed, rig }: { breed: DogBreedId; rig: Rig }) => {
  const { headR: H, snoutLen: S, snoutR: SR, coat } = rig;
  const eyes = (z: number, y = H * 0.3, x = H * 0.8) => (
    <>
      {[1, -1].map((s) => (
        <mesh key={s} position={[x, y, s * z]}>
          <sphereGeometry args={[H * 0.13, 6, 5]} />
          <meshStandardMaterial color="#0d0a08" roughness={0.3} />
        </mesh>
      ))}
    </>
  );

  if (breed === "puudeli") {
    return (
      <group>
        <Ball r={H} color={coat} scale={[1, 0.95, 0.9]} />
        {/* Long thin muzzle */}
        <mesh position={[H * 0.7 + S * 0.35, -H * 0.3, 0]} rotation={[0, 0, -Math.PI / 2 - 0.2]}>
          <cylinderGeometry args={[SR * 0.7, SR * 1.3, S + H * 0.3, 7]} />
          <Mat color={coat} />
        </mesh>
        <Ball r={SR * 0.7} color={NOSE} position={[H * 0.7 + S * 0.85, -H * 0.42, 0]} />
        {eyes(H * 0.5)}
        {/* Topknot and ear pom-poms */}
        <group position={[-H * 0.05, H * 0.75, 0]}>
          <Curls count={12} radius={H * 0.6} size={0.03} color="#8a5534" seed={5} />
        </group>
        {[1, -1].map((s) => (
          <group key={s} position={[-H * 0.1, -H * 0.55, s * H * 0.95]}>
            <Curls count={9} radius={H * 0.45} size={0.026} color="#8a5534" seed={6 + s} scale={[0.8, 1.5, 0.7]} />
          </group>
        ))}
      </group>
    );
  }

  if (breed === "aussi") {
    const dots: Vec3[] = [
      [H * 0.75 + S * 0.35, -H * 0.18, SR * 1.25],
      [H * 0.75 + S * 0.05, -H * 0.12, SR * 1.3],
      [H * 0.75 + S * 0.65, -H * 0.25, SR * 1.0],
      [H * 0.75 + S * 0.35, -H * 0.18, -SR * 1.25],
      [H * 0.75 + S * 0.05, -H * 0.12, -SR * 1.3],
      [H * 0.75 + S * 0.65, -H * 0.25, -SR * 1.0],
      [H * 0.92, -H * 0.05, H * 0.42],
      [H * 0.92, -H * 0.05, -H * 0.42],
      [H * 0.7, H * 0.05, H * 0.7],
      [H * 0.7, H * 0.05, -H * 0.7],
      [H * 0.62, H * 0.62, H * 0.45],
      [H * 0.62, H * 0.62, -H * 0.45],
      [H * 0.8, -H * 0.3, H * 0.52],
      [H * 0.8, -H * 0.3, -H * 0.52],
    ];
    return (
      <group>
        <Ball r={H} color={coat} />
        {/* White muzzle with freckles, blaze up the forehead */}
        <Ball r={1} color={WHITE} position={[H * 0.75 + S * 0.3, -H * 0.3, 0]} scale={[S * 0.75 + H * 0.2, SR * 1.1, SR * 1.35]} />
        {[
          [H * 0.86, H * 0.12, -1.25],
          [H * 0.72, H * 0.55, -0.85],
          [H * 0.4, H * 0.86, -0.4],
        ].map(([x, y, rz], i) => (
          <mesh key={`b${i}`} position={[x, y, 0]} rotation={[0, 0, rz]}>
            <boxGeometry args={[H * 0.42, H * 0.12, H * 0.26]} />
            <Mat color={WHITE} />
          </mesh>
        ))}
        {dots.map((p, i) => (
          <mesh key={i} position={p}>
            <sphereGeometry args={[i < 6 ? H * 0.06 : H * 0.085, 5, 4]} />
            <Mat color={i < 6 ? "#2a2626" : WHITE} />
          </mesh>
        ))}
        <Ball r={SR * 0.5} color={NOSE} position={[H * 0.75 + S * 1.05, -H * 0.22, 0]} />
        {eyes(H * 0.5, H * 0.3, H * 0.8)}
        {/* Copper brows */}
        {[1, -1].map((s) => (
          <mesh key={s} position={[H * 0.72, H * 0.45, s * H * 0.38]}>
            <sphereGeometry args={[H * 0.1, 5, 4]} />
            <Mat color="#b5652b" />
          </mesh>
        ))}
        {/* Semi-prick ears folding forward */}
        {[1, -1].map((s) => (
          <mesh key={s} position={[-H * 0.15, H * 0.95, s * H * 0.55]} rotation={[s * 0.3, 0, -0.75]}>
            <coneGeometry args={[H * 0.38, H * 0.75, 4]} />
            <Mat color={coat} />
          </mesh>
        ))}
      </group>
    );
  }

  // Lagotto: round teddy head, beard and curly drop ears
  return (
    <group>
      <Ball r={H} color={coat} />
      <Curls count={30} radius={H} size={0.032} color={coat} dark="#6f4529" seed={11} openFace />
      <Ball r={1} color="#9a6847" position={[H * 0.8 + S * 0.3, -H * 0.25, 0]} scale={[S * 0.8 + H * 0.15, SR * 1.0, SR * 1.15]} />
      <group position={[H * 0.8 + S * 0.25, -H * 0.62, 0]}>
        <Curls count={10} radius={H * 0.4} size={0.03} color="#9a6847" seed={12} scale={[1, 0.9, 1.2]} />
      </group>
      <Ball r={SR * 0.5} color={NOSE} position={[H * 0.8 + S * 1.05, -H * 0.15, 0]} />
      {eyes(H * 0.5, H * 0.3, H * 0.82)}
      {[1, -1].map((s) => (
        <group key={s} position={[-H * 0.05, -H * 0.2, s * H * 1.0]}>
          <Curls count={10} radius={H * 0.42} size={0.03} color={coat} dark="#6f4529" seed={13 + s} scale={[0.8, 1.5, 0.6]} />
        </group>
      ))}
    </group>
  );
};

const Tail = ({ breed, rig }: { breed: DogBreedId; rig: Rig }) => {
  if (breed === "aussi") return <Ball r={rig.bodyR * 0.32} color={rig.coat} position={[-0.01, 0.01, 0]} />;
  if (breed === "puudeli") {
    return (
      <group rotation={[0, 0, 0.35]}>
        <mesh position={[0, 0.06, 0]}>
          <cylinderGeometry args={[0.009, 0.012, 0.12, 5]} />
          <Mat color={rig.coat} />
        </mesh>
        <group position={[0, 0.13, 0]}>
          <Curls count={10} radius={0.032} size={0.022} color="#8a5534" seed={21} />
        </group>
      </group>
    );
  }
  return (
    <group rotation={[0, 0, 0.45]}>
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i} position={[Math.sin(i * 0.6) * 0.04, 0.03 + Math.cos(i * 0.5) * i * 0.03, 0]}>
          <icosahedronGeometry args={[0.032 - i * 0.004, 0]} />
          <Mat color={i % 2 ? "#6f4529" : rig.coat} roughness={1} />
        </mesh>
      ))}
    </group>
  );
};

const Leg = ({ breed, rig, legRef }: { breed: DogBreedId; rig: Rig; legRef: (el: THREE.Group | null) => void }) => {
  const { legLen: L, legR: R, coat } = rig;
  return (
    <group ref={legRef}>
      <mesh position={[0, -L / 2, 0]}>
        <cylinderGeometry args={[R, R * 0.85, L, 6]} />
        <Mat color={coat} />
      </mesh>
      {breed === "aussi" && (
        <mesh position={[0, -L + 0.03, 0]}>
          <cylinderGeometry args={[R * 0.9, R * 0.9, 0.06, 6]} />
          <Mat color={WHITE} />
        </mesh>
      )}
      {breed === "puudeli" && (
        <group position={[0, -L + 0.035, 0]}>
          <Curls count={8} radius={0.025} size={0.02} color="#8a5534" seed={31} />
        </group>
      )}
      {breed === "lagotto" && (
        <group position={[0, -L * 0.45, 0]}>
          <Curls count={8} radius={R * 1.1} size={0.025} color={coat} dark="#6f4529" seed={33} scale={[1, 1.8, 1]} />
        </group>
      )}
    </group>
  );
};

// ---------------------------------------------------------------------------
// The dog, walking about
// ---------------------------------------------------------------------------

type Mode = "walk" | "pause" | "sit";

const PORCH_SPOT: Vec3 = [-0.32, PORCH_TOP_Y, 0.55];
// Facing the camera (+x +z)
const CAMERA_HEADING = -Math.PI / 4;

const angleDiff = (a: number, b: number) => Math.atan2(Math.sin(a - b), Math.cos(a - b));

export const Dog = ({
  breed,
  name,
  night,
  showLabels,
  onClick,
}: {
  breed: DogBreedId;
  name: string;
  /** At night the dog sits on the porch. */
  night: boolean;
  /** Name label on hover/tap and the "Hau!" bubble (full view only). */
  showLabels: boolean;
  onClick?: () => void;
}) => {
  const rig = RIGS[breed];
  const root = useRef<THREE.Group>(null);
  const body = useRef<THREE.Group>(null);
  const head = useRef<THREE.Group>(null);
  const tail = useRef<THREE.Group>(null);
  const legs = useRef<(THREE.Group | null)[]>([]);
  const [hovered, setHovered] = useState(false);
  const [barkKey, setBarkKey] = useState(0);
  const [barking, setBarking] = useState(false);
  useEffect(() => {
    if (barkKey === 0) return;
    setBarking(true);
    const id = setTimeout(() => setBarking(false), 2200);
    return () => clearTimeout(id);
  }, [barkKey]);
  const happyUntil = useRef(0);
  const clockTime = useRef(0);
  const sim = useRef({
    x: DOG_PATH[0][0],
    z: DOG_PATH[0][1],
    heading: CAMERA_HEADING,
    idx: 1,
    dir: 1,
    mode: "pause" as Mode,
    until: 2,
    phase: 0,
  });

  const hips = useMemo(() => {
    const y = rig.legLen;
    const x = rig.bodyLen * 0.3;
    const z = rig.bodyR * 0.5;
    return [
      [x, y, z],
      [x, y, -z],
      [-x, y, z],
      [-x, y, -z],
    ] as Vec3[];
  }, [rig]);

  useFrame(({ clock }, delta) => {
    const s = sim.current;
    const t = clock.getElapsedTime();
    clockTime.current = t;
    const dt = Math.min(delta, 0.05);
    const happy = t < happyUntil.current;
    let moving = false;

    if (night) {
      s.x = PORCH_SPOT[0];
      s.z = PORCH_SPOT[2];
      s.heading = CAMERA_HEADING;
      s.mode = "sit";
    } else if (s.mode === "walk") {
      const [tx, tz] = DOG_PATH[s.idx];
      const dx = tx - s.x;
      const dz = tz - s.z;
      const dist = Math.hypot(dx, dz);
      const want = Math.atan2(-dz, dx);
      s.heading += angleDiff(want, s.heading) * Math.min(1, dt * 6);
      if (dist < 0.05) {
        // Arrived: sniff around or sit for a bit, then carry on along the path
        const r = Math.random();
        s.mode = r < 0.35 ? "sit" : r < 0.75 ? "pause" : "walk";
        s.until = t + 1.5 + Math.random() * 3.5;
        if (s.idx === DOG_PATH.length - 1 || s.idx === 0) s.dir = -s.dir;
        s.idx += s.dir;
      } else {
        const step = Math.min(dist, rig.speed * dt);
        s.x += (dx / dist) * step;
        s.z += (dz / dist) * step;
        s.phase += step * (breed === "puudeli" ? 26 : 18);
        moving = true;
      }
    } else if (t > s.until) {
      s.mode = "walk";
    }

    if (root.current) {
      root.current.position.set(s.x, night ? PORCH_SPOT[1] : GROUND_Y, s.z);
      // Face the camera when sitting so the face shows
      const target = s.mode === "walk" ? s.heading : s.mode === "sit" ? CAMERA_HEADING : s.heading;
      root.current.rotation.y += angleDiff(target, root.current.rotation.y) * Math.min(1, dt * 4);
    }

    const sitting = s.mode === "sit";
    const swing = moving ? Math.sin(s.phase) * rig.stride : 0;
    legs.current.forEach((leg, i) => {
      if (!leg) return;
      const front = i < 2;
      const diagonal = i === 0 || i === 3 ? 1 : -1;
      const target = sitting ? (front ? 0 : 1.2) : swing * diagonal;
      leg.rotation.z += (target - leg.rotation.z) * Math.min(1, dt * 12);
    });
    if (body.current) {
      const bob = moving ? Math.abs(Math.sin(s.phase)) * rig.bounce : 0;
      const hop = happy ? Math.max(0, Math.sin((happyUntil.current - t) * 9)) * 0.06 : 0;
      const tilt = sitting ? 0.5 : 0;
      body.current.rotation.z += (tilt - body.current.rotation.z) * Math.min(1, dt * 6);
      body.current.position.y = (sitting ? -rig.legLen * 0.35 : 0) + bob + hop;
    }
    if (head.current) {
      // Sniff the grass while pausing, look up when sitting
      const nod = s.mode === "pause" ? -0.45 + Math.sin(t * 3) * 0.08 : sitting ? -0.45 : 0;
      head.current.rotation.z += (nod - head.current.rotation.z) * Math.min(1, dt * 5);
      head.current.rotation.y = s.mode === "pause" ? Math.sin(t * 0.9) * 0.4 : 0;
    }
    if (tail.current) tail.current.rotation.x = Math.sin(t * (happy ? 22 : moving ? 9 : 5)) * (happy ? 0.7 : 0.35);
  });

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    if (!onClick) return;
    e.stopPropagation();
    happyUntil.current = clockTime.current + 1.4;
    setBarkKey((k) => k + 1);
    onClick();
  };

  const { bodyLen: L, bodyR: R, legLen, headR, neck } = rig;
  const bodyY = legLen + R * 0.55;
  const label: ReactNode = showLabels && (hovered || barking) && (
    <Html position={[0, bodyY + R + headR + neck + 0.25, 0]} center zIndexRange={[5, 0]}>
      <div className="pointer-events-none flex flex-col items-center gap-0.5">
        {barking && <Bark key={barkKey} />}
        <div className="whitespace-nowrap rounded-full bg-white/95 px-2 py-0.5 text-[11px] font-semibold text-slate-800 shadow">🐾 {name}</div>
      </div>
    </Html>
  );

  return (
    <group
      ref={root}
      onClick={onClick ? handleClick : undefined}
      onPointerOver={(e) => {
        if (!onClick) return;
        e.stopPropagation();
        setHovered(true);
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        setHovered(false);
        document.body.style.cursor = "";
      }}
    >
      {/* Generous invisible hit area so the small dog is easy to tap */}
      {onClick && (
        <mesh position={[0, bodyY, 0]} userData={{ noShadow: true }}>
          <boxGeometry args={[L + 0.35, bodyY * 2 + 0.25, R * 2 + 0.3]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
      )}
      <group ref={body}>
        <group position={[0, bodyY, 0]}>
          <Body breed={breed} rig={rig} />
          <group ref={head} position={[L * 0.5, R * 0.6 + neck, 0]}>
            <group position={[headR * 0.4, headR * 0.3, 0]}>
              <Head breed={breed} rig={rig} />
            </group>
          </group>
          {neck > 0.05 && (
            <mesh position={[L * 0.42, R * 0.45 + neck * 0.4, 0]} rotation={[0, 0, -0.5]}>
              <cylinderGeometry args={[R * 0.4, R * 0.55, neck + R * 0.4, 6]} />
              <Mat color={rig.coat} />
            </mesh>
          )}
          <group ref={tail} position={[-L * 0.5, R * 0.45, 0]}>
            <Tail breed={breed} rig={rig} />
          </group>
        </group>
        {hips.map((p, i) => (
          <group key={i} position={p}>
            <Leg breed={breed} rig={rig} legRef={(el) => (legs.current[i] = el)} />
          </group>
        ))}
      </group>
      {label}
    </group>
  );
};

/** "Hau!" speech bubble that pops and fades. */
const Bark = () => {
  const [gone, setGone] = useState(false);
  useEffect(() => {
    const id = setTimeout(() => setGone(true), 1300);
    return () => clearTimeout(id);
  }, []);
  if (gone) return null;
  return <div className="animate-bounce rounded-xl bg-amber-100 px-2 py-0.5 text-sm font-bold text-amber-900 shadow">Hau!</div>;
};
