import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import type { MokkiPieceId } from "@/lib/mokki";
import { C, type SeasonPalette } from "../palette";
import { GROUND_Y } from "./Nature";
import { Block, Burst, Cyl, GableFill, GableRoof, LogWalls, Mat, Smoke, rand } from "./primitives";

type Vec3 = [number, number, number];
const G = GROUND_Y;

// Where each piece sits on the island, and the scaffolding footprint while it's being built
export const PIECE_LAYOUT: Record<MokkiPieceId, { center: Vec3; footprint: Vec3 }> = {
  sauna: { center: [3.0, G, -1.8], footprint: [1.8, 1.9, 1.7] },
  laituri: { center: [5.9, 0.3, -1.7], footprint: [3.0, 0.5, 0.9] },
  soutuvene: { center: [6.0, 0.05, -0.75], footprint: [1.7, 0.5, 0.7] },
  palju: { center: [2.4, G, -0.05], footprint: [1.2, 1.0, 1.2] },
  huussi: { center: [-2.6, G, -3.0], footprint: [0.8, 1.5, 0.8] },
  puuvaja: { center: [-3.6, G, -0.6], footprint: [1.0, 1.2, 1.5] },
  grillikota: { center: [-1.9, G, 2.65], footprint: [1.8, 1.8, 1.8] },
  lipputanko: { center: [4.15, G, 0.35], footprint: [0.5, 2.4, 0.5] },
  riippumatto: { center: [3.25, G, 1.85], footprint: [1.2, 0.8, 0.5] },
  marjapensaat: { center: [1.25, G, -1.1], footprint: [0.8, 0.7, 2.0] },
};

/** Birch pair that the hammock hangs between (always on the island). */
export const HAMMOCK_BIRCHES: Vec3[] = [
  [2.55, G, 2.4],
  [3.95, G, 1.3],
];

export const SAUNA_CHIMNEY_TOP: Vec3 = [2.55, G + 2.35, -2.25];
export const GRILLIKOTA_TOP: Vec3 = [-1.9, G + 2.2, 2.65];

// ---------------------------------------------------------------------------
// Build state wrapper
// ---------------------------------------------------------------------------

export type PieceStatus = "complete" | "building";

function easeOutBounce(x: number): number {
  const n1 = 7.5625;
  const d1 = 2.75;
  if (x < 1 / d1) return n1 * x * x;
  if (x < 2 / d1) return n1 * (x -= 1.5 / d1) * x + 0.75;
  if (x < 2.5 / d1) return n1 * (x -= 2.25 / d1) * x + 0.9375;
  return n1 * (x -= 2.625 / d1) * x + 0.984375;
}

const Scaffolding = ({ footprint, remainingDays, showLabel }: { footprint: Vec3; remainingDays: number; showLabel: boolean }) => {
  const [w, h, d] = footprint;
  const corners: [number, number][] = [
    [-w / 2, -d / 2],
    [w / 2, -d / 2],
    [-w / 2, d / 2],
    [w / 2, d / 2],
  ];
  return (
    <group>
      {corners.map(([x, z], i) => (
        <Cyl key={i} radiusTop={0.03} height={h} segments={5} position={[x, h / 2, z]} color={C.logEnd} />
      ))}
      {[h * 0.45, h * 0.9].map((y) => (
        <group key={y}>
          <Block size={[w, 0.04, 0.04]} position={[0, y, d / 2]} color={C.logEnd} />
          <Block size={[w, 0.04, 0.04]} position={[0, y, -d / 2]} color={C.logEnd} />
          <Block size={[0.04, 0.04, d]} position={[w / 2, y, 0]} color={C.logEnd} />
          <Block size={[0.04, 0.04, d]} position={[-w / 2, y, 0]} color={C.logEnd} />
        </group>
      ))}
      {/* Diagonal braces */}
      <Block size={[Math.hypot(w, h * 0.9), 0.03, 0.03]} position={[0, h * 0.45, d / 2 + 0.03]} rotation={[0, 0, Math.atan2(h * 0.9, w)]} color={C.plankDark} />
      <Block size={[0.03, Math.hypot(d, h * 0.9), 0.03]} position={[w / 2 + 0.03, h * 0.45, 0]} rotation={[Math.atan2(d, h * 0.9), 0, 0]} color={C.plankDark} />
      {/* Foundation that's been started + a pile of planks */}
      <Block size={[w * 0.85, 0.12, d * 0.85]} position={[0, 0.06, 0]} color={C.rockDark} />
      {[0, 1, 2, 3].map((i) => (
        <Block key={i} size={[w * 0.6, 0.04, 0.12]} position={[0, 0.15 + i * 0.045, (i % 2 ? 0.05 : -0.05)]} rotation={[0, i * 0.12, 0]} color={i % 2 ? C.plank : C.plankDark} />
      ))}
      {showLabel && (
        <Html position={[0, h + 0.35, 0]} center zIndexRange={[4, 0]}>
          <div className="pointer-events-none whitespace-nowrap rounded-full bg-amber-100/95 px-2 py-0.5 text-[11px] font-semibold text-amber-900 shadow">
            🔨 {remainingDays} {remainingDays === 1 ? "day" : "days"}
          </div>
        </Html>
      )}
    </group>
  );
};

export const PieceSlot = ({
  id,
  status,
  remainingDays,
  justCompleted,
  showLabel,
  onLanded,
  children,
}: {
  id: MokkiPieceId;
  status: PieceStatus;
  remainingDays: number;
  justCompleted: boolean;
  showLabel: boolean;
  onLanded?: (id: MokkiPieceId) => void;
  children: ReactNode;
}) => {
  const { center, footprint } = PIECE_LAYOUT[id];
  const group = useRef<THREE.Group>(null);
  const start = useRef<number | null>(null);
  const landed = useRef(!justCompleted);
  const [dust, setDust] = useState(0);

  useEffect(() => {
    if (justCompleted) {
      landed.current = false;
      start.current = null;
    }
  }, [justCompleted]);

  useFrame(({ clock }) => {
    if (!group.current || landed.current) return;
    if (start.current === null) start.current = clock.getElapsedTime() + 0.4;
    const t = Math.max(0, (clock.getElapsedTime() - start.current) / 1.1);
    group.current.position.y = 4 * (1 - easeOutBounce(Math.min(1, t)));
    group.current.visible = clock.getElapsedTime() >= start.current;
    if (t >= 1) {
      landed.current = true;
      group.current.position.y = 0;
      setDust((d) => d + 1);
      onLanded?.(id);
    }
  });

  if (status === "building") {
    return (
      <group position={center}>
        <Scaffolding footprint={footprint} remainingDays={remainingDays} showLabel={showLabel} />
      </group>
    );
  }

  return (
    <>
      <group ref={group} visible={!justCompleted}>
        {children}
      </group>
      <Burst position={[center[0], center[1] + 0.05, center[2]]} trigger={dust} radius={Math.max(footprint[0], footprint[2]) * 0.8} />
    </>
  );
};

// ---------------------------------------------------------------------------
// Pieces (world coordinates)
// ---------------------------------------------------------------------------

export const Sauna = ({ lightsOn, snow, smoke, loylyKey }: { lightsOn: boolean; snow: boolean; smoke: boolean; loylyKey: number }) => {
  const w = 1.45;
  const d = 1.35;
  const h = 1.05;
  return (
    <group>
      <group position={PIECE_LAYOUT.sauna.center}>
        <Block size={[w + 0.2, 0.12, d + 0.2]} position={[0, 0.06, 0]} color={C.rockDark} />
        <group position={[0, 0.12, 0]}>
          <LogWalls width={w} depth={d} height={h} />
          {/* Roof ridge along z, gables face the lake (east) */}
          <group position={[0, h, 0]} rotation={[0, Math.PI / 2, 0]}>
            <GableFill width={d} depth={w} rise={0.62} color={C.logDark} />
            <GableRoof width={d} depth={w} rise={0.66} overhang={0.22} snow={snow} color="#57504a" />
          </group>
          {/* Door towards the lake */}
          <Block size={[0.04, 0.82, 0.46]} position={[w / 2 + 0.08, 0.42, 0.2]} color="#6e4826" />
          <Block size={[0.05, 0.05, 0.04]} position={[w / 2 + 0.11, 0.45, 0.02]} color={C.metal} />
          {/* Small window with warm glow */}
          <Block
            size={[0.36, 0.22, 0.04]}
            position={[0.1, 0.72, d / 2 + 0.09]}
            color={lightsOn || smoke ? C.glow : C.glass}
            emissive={lightsOn || smoke ? "#ff9a3c" : undefined}
            emissiveIntensity={lightsOn ? 1.6 : smoke ? 0.5 : 0}
          />
          <Block size={[0.44, 0.04, 0.06]} position={[0.1, 0.59, d / 2 + 0.1]} color={C.logEnd} />
          {/* Stove pipe */}
          <Cyl radiusTop={0.07} height={0.75} segments={8} position={[-0.45, h + 0.75, -0.45]} color={C.metal} />
          <Cyl radiusTop={0.11} height={0.05} segments={8} position={[-0.45, h + 1.12, -0.45]} color={C.metal} />
          {/* Lauteet-style bench outside + towel */}
          <Block size={[0.12, 0.05, 0.7]} position={[w / 2 + 0.3, 0.3, -0.35]} color={C.logEnd} />
          <Block size={[0.05, 0.28, 0.05]} position={[w / 2 + 0.3, 0.15, -0.65]} color={C.logDark} />
          <Block size={[0.05, 0.28, 0.05]} position={[w / 2 + 0.3, 0.15, -0.05]} color={C.logDark} />
          <Block size={[0.13, 0.015, 0.26]} position={[w / 2 + 0.3, 0.335, -0.45]} color="#5b8fd1" />
          {lightsOn && <pointLight color="#ff9a3c" intensity={1.5} distance={2.5} decay={2} position={[0.1, 0.7, d / 2 + 0.5]} />}
        </group>
      </group>
      {smoke && <Smoke position={SAUNA_CHIMNEY_TOP} count={11} rise={2.2} />}
      <Burst position={SAUNA_CHIMNEY_TOP} trigger={loylyKey} color="#ffffff" count={22} radius={1.3} rise={1.8} duration={2.6} size={0.5} />
    </group>
  );
};

export const Laituri = ({ snow }: { snow: boolean }) => {
  const [cx, , cz] = PIECE_LAYOUT.laituri.center;
  const len = 3.0;
  const width = 0.85;
  const planks = 15;
  return (
    <group position={[cx, 0, cz]}>
      {Array.from({ length: planks }, (_, i) => (
        <Block
          key={i}
          size={[len / planks - 0.03, 0.05, width]}
          position={[-len / 2 + (i + 0.5) * (len / planks), 0.5, 0]}
          color={i % 3 === 0 ? C.plankDark : C.plank}
        />
      ))}
      <Block size={[len, 0.07, 0.07]} position={[0, 0.44, width / 2 - 0.05]} color={C.post} />
      <Block size={[len, 0.07, 0.07]} position={[0, 0.44, -width / 2 + 0.05]} color={C.post} />
      {[-1.0, 0.0, 0.8, 1.45].map((x) =>
        [1, -1].map((s) => <Cyl key={`${x}${s}`} radiusTop={0.05} height={1.0} segments={6} position={[x, 0.0, s * (width / 2 - 0.05)]} color={C.post} />),
      )}
      {/* Swimming ladder */}
      <group position={[len / 2 + 0.06, 0.2, 0]}>
        {[0.16, -0.16].map((z) => (
          <Block key={z} size={[0.04, 0.6, 0.04]} position={[0, 0.05, z]} rotation={[0, 0, -0.15]} color={C.metal} />
        ))}
        {[0.2, 0, -0.18].map((y) => (
          <Block key={y} size={[0.04, 0.03, 0.32]} position={[-y * 0.15, y, 0]} color={C.metal} />
        ))}
      </group>
      {snow && <Block size={[len, 0.04, width * 0.9]} position={[0, 0.545, 0]} color={C.snow} />}
    </group>
  );
};

export const Soutuvene = ({ frozen }: { frozen: boolean }) => {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!ref.current || frozen) return;
    const t = clock.getElapsedTime();
    ref.current.position.y = 0.06 + Math.sin(t * 1.4) * 0.03;
    ref.current.rotation.z = Math.sin(t * 1.1) * 0.04;
    ref.current.rotation.x = Math.sin(t * 0.9) * 0.03;
  });
  const [cx, , cz] = PIECE_LAYOUT.soutuvene.center;
  return (
    <group position={[cx, 0, cz]}>
      <group ref={ref} position={[0, 0.06, 0]} rotation={[0, 0.06, 0]}>
        {/* Hull: lower half of a stretched sphere */}
        <mesh scale={[0.85, 0.3, 0.32]}>
          <sphereGeometry args={[1, 14, 6, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]} />
          <Mat color={C.white} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, 0.005, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[0.85, 0.32, 1]}>
          <torusGeometry args={[1, 0.04, 4, 24]} />
          <Mat color="#2e6b4f" />
        </mesh>
        {/* Seats */}
        {[-0.35, 0.05, 0.42].map((x) => (
          <Block key={x} size={[0.12, 0.03, 0.5]} position={[x, -0.06, 0]} color={C.plank} />
        ))}
        {/* Oars */}
        {[1, -1].map((s) => (
          <group key={s} position={[0.05, 0.02, s * 0.3]} rotation={[s * 0.25, s * 0.35, 0]}>
            <Cyl radiusTop={0.015} height={1.1} segments={5} rotation={[Math.PI / 2, 0, 0]} position={[0, 0, s * 0.45]} color={C.logEnd} />
            <Block size={[0.1, 0.015, 0.26]} position={[0, 0, s * 0.95]} color={C.logEnd} />
          </group>
        ))}
      </group>
      {/* Mooring rope to the dock */}
      <Block size={[0.02, 0.02, 0.6]} position={[-0.6, 0.3, -0.5]} rotation={[0.55, 0, 0]} color="#d9c9a3" />
    </group>
  );
};

export const Palju = ({ frozen, snow }: { frozen: boolean; snow: boolean }) => {
  const [cx, , cz] = PIECE_LAYOUT.palju.center;
  return (
    <group position={[cx, G, cz]}>
      {/* Wooden deck */}
      <Block size={[1.2, 0.08, 1.2]} position={[0, 0.04, 0]} color={C.plankDark} />
      {/* Tub of vertical staves */}
      <mesh position={[0, 0.38, 0]}>
        <cylinderGeometry args={[0.5, 0.47, 0.6, 16, 1, true]} />
        <Mat color={C.log} side={THREE.DoubleSide} />
      </mesh>
      {Array.from({ length: 16 }, (_, i) => {
        const a = (i / 16) * Math.PI * 2;
        return <Block key={i} size={[0.015, 0.6, 0.04]} position={[Math.cos(a) * 0.5, 0.38, Math.sin(a) * 0.5]} rotation={[0, -a, 0]} color={C.logDark} />;
      })}
      {[0.2, 0.55].map((y) => (
        <mesh key={y} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.505, 0.015, 4, 24]} />
          <Mat color={C.metal} metalness={0.5} />
        </mesh>
      ))}
      {/* Hot water */}
      <mesh position={[0, 0.6, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.47, 20]} />
        <Mat color="#4d9ec0" roughness={0.15} />
      </mesh>
      {/* Wood stove pipe on the side */}
      <Cyl radiusTop={0.12} height={0.45} segments={8} position={[0.55, 0.3, -0.25]} color={C.metal} />
      <Cyl radiusTop={0.05} height={0.7} segments={6} position={[0.55, 0.85, -0.25]} color={C.metal} />
      {/* Steps */}
      <Block size={[0.4, 0.2, 0.25]} position={[-0.3, 0.12, 0.6]} color={C.plank} />
      {snow && <Block size={[1.0, 0.04, 0.3]} position={[0, 0.1, -0.5]} color={C.snow} />}
      <Smoke position={[0, 0.65, 0]} count={7} rise={frozen ? 1.6 : 1.1} spread={0.3} size={0.32} speed={0.12} color="#ffffff" opacity={frozen ? 0.6 : 0.4} />
    </group>
  );
};

export const Huussi = ({ snow }: { snow: boolean }) => {
  const heart = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(0, -0.05);
    s.bezierCurveTo(0.07, 0.01, 0.06, 0.07, 0, 0.04);
    s.bezierCurveTo(-0.06, 0.07, -0.07, 0.01, 0, -0.05);
    return new THREE.ShapeGeometry(s);
  }, []);
  return (
    <group position={PIECE_LAYOUT.huussi.center} rotation={[0, 0.35, 0]}>
      <Block size={[0.7, 1.15, 0.7]} position={[0, 0.58, 0]} color="#8d7a63" />
      {Array.from({ length: 5 }, (_, i) => (
        <Block key={i} size={[0.02, 1.15, 0.72]} position={[-0.35 + 0.17 * (i + 0.6), 0.58, 0]} color="#76654f" />
      ))}
      {/* Slanted roof */}
      <Block size={[0.9, 0.06, 0.9]} position={[0, 1.24, 0]} rotation={[0.18, 0, 0]} color={C.roof} />
      {snow && <Block size={[0.86, 0.06, 0.86]} position={[0, 1.3, 0]} rotation={[0.18, 0, 0]} color={C.snow} />}
      {/* Door with heart */}
      <Block size={[0.46, 0.92, 0.03]} position={[0, 0.5, 0.36]} color="#9a8569" />
      <mesh geometry={heart} position={[0, 0.82, 0.38]} scale={1.3}>
        <meshBasicMaterial color="#1d140c" />
      </mesh>
      <Block size={[0.04, 0.04, 0.05]} position={[0.17, 0.5, 0.39]} color={C.metal} />
    </group>
  );
};

export const Puuvaja = ({ snow }: { snow: boolean }) => {
  const logs = useMemo(() => {
    const list: Vec3[] = [];
    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 6; col++) {
        list.push([0, 0.13 + row * 0.15 + (col % 2) * 0.02, -0.55 + col * 0.21 + (row % 2) * 0.05]);
      }
    }
    return list;
  }, []);
  return (
    <group position={PIECE_LAYOUT.puuvaja.center}>
      {/* Back + sides, open towards the east */}
      <Block size={[0.06, 1.0, 1.45]} position={[-0.42, 0.5, 0]} color={C.punamulta} />
      <Block size={[0.85, 1.0, 0.06]} position={[0, 0.5, 0.72]} color={C.punamulta} />
      <Block size={[0.85, 1.0, 0.06]} position={[0, 0.5, -0.72]} color={C.punamulta} />
      <Block size={[0.06, 1.0, 0.08]} position={[0.42, 0.5, 0.72]} color={C.trim} />
      <Block size={[0.06, 1.0, 0.08]} position={[0.42, 0.5, -0.72]} color={C.trim} />
      <Block size={[1.15, 0.06, 1.75]} position={[0.05, 1.08, 0]} rotation={[0, 0, -0.2]} color={C.roof} />
      {snow && <Block size={[1.1, 0.06, 1.7]} position={[0.05, 1.14, 0]} rotation={[0, 0, -0.2]} color={C.snow} />}
      {/* Stacked birch logs, ends facing out */}
      {logs.map((p, i) => (
        <group key={i} position={p}>
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.075, 0.075, 0.7, 7]} />
            <Mat color={rand(i) > 0.5 ? C.birchBark : "#e4ddd0"} />
          </mesh>
          <mesh position={[0.351, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
            <circleGeometry args={[0.07, 7]} />
            <Mat color={C.logEnd} />
          </mesh>
        </group>
      ))}
      {/* Chopping block with an axe */}
      <Cyl radiusTop={0.16} height={0.3} segments={8} position={[0.85, 0.15, 0.2]} color={C.logDark} />
      <group position={[0.85, 0.36, 0.2]} rotation={[0, 0.4, -0.5]}>
        <Cyl radiusTop={0.02} height={0.45} segments={5} position={[0, 0.15, 0]} color={C.logEnd} />
        <Block size={[0.12, 0.09, 0.02]} position={[0.05, 0.36, 0]} color={C.metal} />
      </group>
    </group>
  );
};

export const Grillikota = ({ snow, smoke, lightsOn }: { snow: boolean; smoke: boolean; lightsOn: boolean }) => (
  <group>
    <group position={PIECE_LAYOUT.grillikota.center} rotation={[0, Math.PI / 8, 0]}>
      <Cyl radiusTop={0.85} height={0.1} segments={8} position={[0, 0.05, 0]} color={C.rockDark} />
      <mesh position={[0, 0.48, 0]}>
        <cylinderGeometry args={[0.8, 0.8, 0.76, 8]} />
        <Mat color={C.log} />
      </mesh>
      {Array.from({ length: 4 }, (_, i) => (
        <mesh key={i} position={[0, 0.17 + i * 0.19, 0]}>
          <cylinderGeometry args={[0.815, 0.815, 0.025, 8]} />
          <Mat color={C.logDark} />
        </mesh>
      ))}
      {/* Shingle roof */}
      <mesh position={[0, 1.35, 0]}>
        <coneGeometry args={[1.08, 1.05, 8]} />
        <Mat color="#4a3f38" />
      </mesh>
      {snow && (
        <mesh position={[0, 1.42, 0]}>
          <coneGeometry args={[0.98, 0.88, 8]} />
          <Mat color={C.snow} />
        </mesh>
      )}
      <Cyl radiusTop={0.07} height={0.45} segments={6} position={[0, 2.0, 0]} color={C.metal} />
      {/* Door + windows */}
      <group rotation={[0, Math.PI / 8, 0]}>
        <Block size={[0.42, 0.66, 0.05]} position={[0, 0.43, 0.76]} color="#6e4826" />
      </group>
      {[(3 * Math.PI) / 8, -Math.PI / 8].map((a) => (
        <group key={a} rotation={[0, a, 0]}>
          <Block
            size={[0.3, 0.2, 0.05]}
            position={[0, 0.62, 0.77]}
            color={lightsOn || smoke ? C.glow : C.glass}
            emissive={lightsOn || smoke ? "#ff8a2a" : undefined}
            emissiveIntensity={lightsOn ? 1.6 : smoke ? 0.6 : 0}
          />
        </group>
      ))}
    </group>
    {smoke && <Smoke position={GRILLIKOTA_TOP} count={9} rise={1.9} size={0.35} color="#d9d4cc" />}
  </group>
);

export const Lipputanko = ({ juhannus }: { juhannus: boolean }) => {
  const flag = useRef<THREE.Mesh>(null);
  const { geometry, texture } = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 180;
    canvas.height = 110;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, 180, 110);
    ctx.fillStyle = C.flagBlue;
    ctx.fillRect(50, 0, 30, 110);
    ctx.fillRect(0, 40, 180, 30);
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    const g = new THREE.PlaneGeometry(0.9, 0.55, 14, 1);
    g.translate(0.45, 0, 0);
    return { geometry: g, texture: tex };
  }, []);
  const base = useMemo(() => Float32Array.from(geometry.attributes.position.array), [geometry]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const pos = geometry.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
      const x = base[i * 3];
      pos.setZ(i, Math.sin(x * 6 - t * 4) * 0.06 * x);
      pos.setY(i, base[i * 3 + 1] - x * 0.08);
    }
    pos.needsUpdate = true;
    geometry.computeVertexNormals();
  });

  const [cx, , cz] = PIECE_LAYOUT.lipputanko.center;
  const h = 3.0;
  return (
    <group position={[cx, G, cz]}>
      <Cyl radiusTop={0.12} height={0.1} segments={8} position={[0, 0.05, 0]} color={C.rockDark} />
      <Cyl radiusTop={0.025} radiusBottom={0.04} height={h} segments={6} position={[0, h / 2, 0]} color={C.white} />
      <mesh position={[0, h + 0.04, 0]}>
        <sphereGeometry args={[0.05, 8, 6]} />
        <Mat color={C.coin} metalness={0.7} roughness={0.3} />
      </mesh>
      {/* Flag at full mast (juhannus is a flag day too) */}
      <mesh ref={flag} geometry={geometry} position={[0.03, h - 0.32, 0]} rotation={[0, 0.55, 0]}>
        <meshStandardMaterial map={texture} side={THREE.DoubleSide} roughness={0.8} />
      </mesh>
    </group>
  );
};

export const Riippumatto = () => {
  const ref = useRef<THREE.Group>(null);
  const { geometry, texture, ropes } = useMemo(() => {
    const [a, b] = HAMMOCK_BIRCHES;
    const start = new THREE.Vector3(a[0], G + 0.95, a[2]);
    const end = new THREE.Vector3(b[0], G + 0.95, b[2]);
    const along = end.clone().sub(start);
    const length = along.length();
    const dir = along.clone().normalize();
    const side = new THREE.Vector3(-dir.z, 0, dir.x);
    // Fabric strip: wide and sagging in the middle, gathered at the ends
    const segs = 20;
    const across = 6;
    const positions: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];
    for (let i = 0; i <= segs; i++) {
      const u = i / segs;
      const along01 = 0.15 + u * 0.7; // ropes take the first and last 15%
      const sag = Math.sin(u * Math.PI) * 0.45;
      const width = 0.08 + Math.sin(u * Math.PI) * 0.26;
      for (let j = 0; j <= across; j++) {
        const v = j / across - 0.5;
        const p = start
          .clone()
          .addScaledVector(dir, along01 * length)
          .addScaledVector(side, v * width * 2);
        p.y -= sag + (0.25 - v * v) * 0.18 * Math.sin(u * Math.PI);
        positions.push(p.x, p.y, p.z);
        uvs.push(j / across, u);
      }
    }
    for (let i = 0; i < segs; i++) {
      for (let j = 0; j < across; j++) {
        const k = i * (across + 1) + j;
        indices.push(k, k + across + 1, k + 1, k + 1, k + across + 1, k + across + 2);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    g.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
    g.setIndex(indices);
    g.computeVertexNormals();

    const canvas = document.createElement("canvas");
    canvas.width = 64;
    canvas.height = 8;
    const ctx = canvas.getContext("2d")!;
    const stripes = ["#d9473a", "#f3e7c9", "#2f6fa8", "#f3e7c9", "#e3a02a", "#f3e7c9", "#d9473a"];
    stripes.forEach((c, i) => {
      ctx.fillStyle = c;
      ctx.fillRect((i * 64) / stripes.length, 0, 64 / stripes.length + 1, 8);
    });
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;

    const ropeEnds = [
      [start, start.clone().addScaledVector(dir, 0.15 * length).setY(start.y - 0.05)],
      [end, start.clone().addScaledVector(dir, 0.85 * length).setY(start.y - 0.05)],
    ].map(([from, to]) => {
      const mid = from.clone().add(to).multiplyScalar(0.5);
      const len = from.distanceTo(to);
      const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), to.clone().sub(from).normalize());
      return { mid, len, q };
    });
    return { geometry: g, texture: tex, ropes: ropeEnds };
  }, []);

  useFrame(({ clock }) => {
    if (ref.current) ref.current.position.y = Math.sin(clock.getElapsedTime() * 1.1) * 0.015;
  });

  return (
    <group>
      <group ref={ref}>
        <mesh geometry={geometry}>
          <meshStandardMaterial map={texture} side={THREE.DoubleSide} roughness={0.9} />
        </mesh>
      </group>
      {ropes.map((r, i) => (
        <mesh key={i} position={r.mid} quaternion={r.q}>
          <cylinderGeometry args={[0.012, 0.012, r.len, 4]} />
          <Mat color="#e8dcc0" />
        </mesh>
      ))}
    </group>
  );
};

export const Marjapensaat = ({ palette }: { palette: SeasonPalette }) => {
  const bushes: { pos: Vec3; r: number; berry: string }[] = [
    { pos: [1.3, G + 0.2, -0.35], r: 0.3, berry: "#2b3f8f" },
    { pos: [1.35, G + 0.22, -1.15], r: 0.34, berry: "#c3172c" },
    { pos: [1.22, G + 0.18, -1.9], r: 0.28, berry: "#7a1030" },
  ];
  const flowers = ["#f2d14b", "#e85d75", "#ffffff", "#9b6bd6", "#f08a3c"];
  const blooming = !palette.snow;
  return (
    <group>
      {bushes.map((b, i) => (
        <group key={i} position={b.pos}>
          <mesh scale={[1, 0.8, 1]}>
            <icosahedronGeometry args={[b.r, 0]} />
            <Mat color={palette.snow ? "#6b6358" : palette.bush} />
          </mesh>
          {palette.snow && (
            <mesh position={[0, b.r * 0.45, 0]} scale={[1, 0.4, 1]}>
              <icosahedronGeometry args={[b.r * 0.85, 0]} />
              <Mat color={C.snow} />
            </mesh>
          )}
          {blooming &&
            Array.from({ length: 7 }, (_, j) => {
              const a = j * 0.9 + i;
              return (
                <mesh key={j} position={[Math.cos(a) * b.r * 0.85, (rand(j + i * 7) - 0.3) * b.r, Math.sin(a) * b.r * 0.85]}>
                  <sphereGeometry args={[0.035, 5, 4]} />
                  <Mat color={b.berry} roughness={0.4} />
                </mesh>
              );
            })}
        </group>
      ))}
      {/* Flower bed in front of the porch */}
      <group position={[-1.45, G, 1.5]}>
        <Block size={[0.95, 0.1, 0.32]} position={[0, 0.05, 0]} color={C.soil} />
        <Block size={[1.0, 0.12, 0.04]} position={[0, 0.06, 0.17]} color={C.plankDark} />
        {blooming
          ? Array.from({ length: 11 }, (_, i) => (
              <group key={i} position={[-0.4 + i * 0.08, 0.1, (rand(i) - 0.5) * 0.18]}>
                <Cyl radiusTop={0.008} height={0.14} segments={4} position={[0, 0.07, 0]} color="#4f8a3a" />
                <mesh position={[0, 0.15, 0]}>
                  <icosahedronGeometry args={[0.035, 0]} />
                  <Mat color={flowers[i % 5]} />
                </mesh>
              </group>
            ))
          : <Block size={[0.9, 0.05, 0.3]} position={[0, 0.12, 0]} color={C.snow} />}
      </group>
    </group>
  );
};

// ---------------------------------------------------------------------------
// Juhannuskokko and weather
// ---------------------------------------------------------------------------

export const Kokko = () => {
  const flames = useRef<(THREE.Mesh | null)[]>([]);
  const light = useRef<THREE.PointLight>(null);
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    flames.current.forEach((f, i) => {
      if (!f) return;
      const s = 1 + Math.sin(t * (7 + i * 2.3) + i) * 0.15 + Math.sin(t * 13 + i) * 0.08;
      f.scale.set(s, s * (1.1 + Math.sin(t * 5 + i) * 0.15), s);
      f.rotation.y = t * (0.5 + i * 0.3);
    });
    if (light.current) light.current.intensity = 2.5 + Math.sin(t * 11) * 0.8 + Math.sin(t * 17) * 0.5;
  });
  return (
    <group position={[0, 0.3, 0]}>
      {Array.from({ length: 9 }, (_, i) => {
        const a = (i / 9) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(a) * 0.22, 0.45, Math.sin(a) * 0.22]} rotation={[Math.sin(a) * 0.35, 0, -Math.cos(a) * 0.35]}>
            <cylinderGeometry args={[0.035, 0.05, 1.0, 5]} />
            <Mat color={i % 2 ? C.logDark : C.log} />
          </mesh>
        );
      })}
      {[
        ["#ff5a1f", 0.42, 1.0, 0.55],
        ["#ff9a2e", 0.3, 0.8, 0.65],
        ["#ffd25a", 0.17, 0.55, 0.7],
      ].map(([color, r, h, y], i) => (
        <mesh key={i} ref={(el) => (flames.current[i] = el)} position={[0, y as number, 0]} userData={{ noShadow: true }}>
          <coneGeometry args={[r as number, h as number, 6]} />
          <meshBasicMaterial color={color as string} transparent opacity={0.92} />
        </mesh>
      ))}
      <pointLight ref={light} color="#ff8a3a" intensity={2.5} distance={5} decay={1.8} position={[0, 1.0, 0]} />
      <Smoke position={[0, 1.3, 0]} count={8} rise={2.6} size={0.5} color="#8c8580" opacity={0.4} />
    </group>
  );
};

export const Snowfall = ({ count = 500 }: { count?: number }) => {
  const ref = useRef<THREE.Points>(null);
  const { geometry, speeds } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const sp = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const a = rand(i) * Math.PI * 2;
      const r = Math.sqrt(rand(i + 1000)) * 9;
      positions[i * 3] = Math.cos(a) * r;
      positions[i * 3 + 1] = rand(i + 2000) * 7;
      positions[i * 3 + 2] = Math.sin(a) * r;
      sp[i] = 0.25 + rand(i + 3000) * 0.35;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return { geometry: g, speeds: sp };
  }, [count]);

  useFrame(({ clock }, delta) => {
    const pos = geometry.attributes.position as THREE.BufferAttribute;
    const t = clock.getElapsedTime();
    for (let i = 0; i < count; i++) {
      let y = pos.getY(i) - speeds[i] * delta;
      if (y < 0) y = 7;
      pos.setY(i, y);
      pos.setX(i, pos.getX(i) + Math.sin(t + i) * 0.002);
    }
    pos.needsUpdate = true;
  });

  return (
    <points ref={ref} geometry={geometry} userData={{ noShadow: true }}>
      <pointsMaterial color="#ffffff" size={2.2} sizeAttenuation={false} transparent opacity={0.85} depthWrite={false} />
    </points>
  );
};
