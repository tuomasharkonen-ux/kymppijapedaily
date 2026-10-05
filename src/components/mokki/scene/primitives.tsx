import { useMemo, useRef, type ReactNode } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { C } from "../palette";

type Vec3 = [number, number, number];

/** Deterministic pseudo-random in [0, 1) for stable procedural layouts. */
export function rand(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

export const Mat = ({
  color,
  emissive,
  emissiveIntensity = 0,
  roughness = 0.85,
  metalness = 0,
  transparent,
  opacity,
  side,
}: {
  color: string;
  emissive?: string;
  emissiveIntensity?: number;
  roughness?: number;
  metalness?: number;
  transparent?: boolean;
  opacity?: number;
  side?: THREE.Side;
}) => (
  <meshStandardMaterial
    color={color}
    emissive={emissive ?? "#000000"}
    emissiveIntensity={emissiveIntensity}
    roughness={roughness}
    metalness={metalness}
    flatShading
    transparent={transparent}
    opacity={opacity}
    side={side}
  />
);

export const Block = ({
  size,
  position,
  rotation,
  color,
  emissive,
  emissiveIntensity,
  roughness,
}: {
  size: Vec3;
  position?: Vec3;
  rotation?: Vec3;
  color: string;
  emissive?: string;
  emissiveIntensity?: number;
  roughness?: number;
}) => (
  <mesh position={position} rotation={rotation}>
    <boxGeometry args={size} />
    <Mat color={color} emissive={emissive} emissiveIntensity={emissiveIntensity} roughness={roughness} />
  </mesh>
);

export const Cyl = ({
  radiusTop,
  radiusBottom,
  height,
  segments = 8,
  position,
  rotation,
  color,
  emissive,
  emissiveIntensity,
}: {
  radiusTop: number;
  radiusBottom?: number;
  height: number;
  segments?: number;
  position?: Vec3;
  rotation?: Vec3;
  color: string;
  emissive?: string;
  emissiveIntensity?: number;
}) => (
  <mesh position={position} rotation={rotation}>
    <cylinderGeometry args={[radiusTop, radiusBottom ?? radiusTop, height, segments]} />
    <Mat color={color} emissive={emissive} emissiveIntensity={emissiveIntensity} />
  </mesh>
);

/**
 * Gable roof with the ridge along x, eaves at y = 0.
 * Optional snow layer for winter.
 */
export const GableRoof = ({
  width,
  depth,
  rise,
  overhang = 0.2,
  thickness = 0.08,
  color = C.roof,
  snow = false,
}: {
  width: number;
  depth: number;
  rise: number;
  overhang?: number;
  thickness?: number;
  color?: string;
  snow?: boolean;
}) => {
  const halfRun = depth / 2;
  const angle = Math.atan2(rise, halfRun);
  const slopeLen = (halfRun + overhang) / Math.cos(angle);
  const len = width + overhang * 2;
  const slab = (sign: 1 | -1) => {
    const cz = (sign * Math.cos(angle) * slopeLen) / 2;
    const cy = rise - (Math.sin(angle) * slopeLen) / 2;
    const normal: Vec3 = [0, Math.cos(angle), sign * Math.sin(angle)];
    return (
      <group key={sign}>
        <mesh position={[0, cy, cz]} rotation={[sign * angle, 0, 0]}>
          <boxGeometry args={[len, thickness, slopeLen]} />
          <Mat color={color} roughness={0.7} />
        </mesh>
        {snow && (
          <mesh
            position={[0, cy + normal[1] * thickness * 0.9, cz + normal[2] * thickness * 0.9]}
            rotation={[sign * angle, 0, 0]}
          >
            <boxGeometry args={[len * 0.98, thickness * 1.1, slopeLen * 0.96]} />
            <Mat color={C.snow} roughness={0.95} />
          </mesh>
        )}
      </group>
    );
  };
  return (
    <group>
      {slab(1)}
      {slab(-1)}
    </group>
  );
};

/** Triangular gable wall filling under a GableRoof (ridge along x). */
export const GableFill = ({ width, depth, rise, color }: { width: number; depth: number; rise: number; color: string }) => {
  const geometry = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(-depth / 2, 0);
    shape.lineTo(depth / 2, 0);
    shape.lineTo(0, rise);
    shape.closePath();
    const g = new THREE.ExtrudeGeometry(shape, { depth: width, bevelEnabled: false });
    g.translate(0, 0, -width / 2);
    g.rotateY(Math.PI / 2);
    return g;
  }, [width, depth, rise]);
  return (
    <mesh geometry={geometry}>
      <Mat color={color} />
    </mesh>
  );
};

/** Log-built walls (hirsi) with crossed corner ends, origin at floor centre. */
export const LogWalls = ({
  width,
  depth,
  height,
  radius = 0.075,
  color = C.log,
  darkColor = C.logDark,
}: {
  width: number;
  depth: number;
  height: number;
  radius?: number;
  color?: string;
  darkColor?: string;
}) => {
  const courses = Math.max(2, Math.floor(height / (radius * 2)));
  const logs: ReactNode[] = [];
  for (let i = 0; i < courses; i++) {
    const y = radius + i * radius * 2;
    const c = i % 2 === 0 ? color : darkColor;
    const lx = width + radius * 4;
    const lz = depth + radius * 4;
    if (i % 2 === 0) {
      logs.push(
        <Cyl key={`a${i}`} radiusTop={radius} height={lx} segments={7} position={[0, y, depth / 2]} rotation={[0, 0, Math.PI / 2]} color={c} />,
        <Cyl key={`b${i}`} radiusTop={radius} height={lx} segments={7} position={[0, y, -depth / 2]} rotation={[0, 0, Math.PI / 2]} color={c} />,
      );
      logs.push(
        <Cyl key={`c${i}`} radiusTop={radius} height={lz} segments={7} position={[width / 2, y + radius, 0]} rotation={[Math.PI / 2, 0, 0]} color={c} />,
        <Cyl key={`d${i}`} radiusTop={radius} height={lz} segments={7} position={[-width / 2, y + radius, 0]} rotation={[Math.PI / 2, 0, 0]} color={c} />,
      );
    }
  }
  return (
    <group>
      {/* Solid core so there are no gaps between rounded logs */}
      <Block size={[width - radius, height, depth - radius]} position={[0, height / 2, 0]} color={darkColor} />
      {logs}
    </group>
  );
};

/** Rising chimney smoke made of soft low-poly puffs. */
export const Smoke = ({
  position,
  count = 10,
  rise = 2.4,
  spread = 0.6,
  size = 0.42,
  speed = 0.16,
  color = "#e9e6e1",
  opacity = 0.55,
}: {
  position: Vec3;
  count?: number;
  rise?: number;
  spread?: number;
  size?: number;
  speed?: number;
  color?: string;
  opacity?: number;
}) => {
  const refs = useRef<(THREE.Mesh | null)[]>([]);
  useFrame(({ clock }) => {
    const time = clock.getElapsedTime();
    refs.current.forEach((m, i) => {
      if (!m) return;
      const t = (time * speed + i / count) % 1;
      m.position.set(t * spread + Math.sin(time * 0.8 + i) * 0.06, t * rise, -t * spread * 0.4);
      const s = 0.08 + t * size;
      m.scale.setScalar(s);
      (m.material as THREE.MeshStandardMaterial).opacity = Math.sin(Math.PI * Math.min(1, t * 1.4)) * opacity * (1 - t * 0.6);
    });
  });
  return (
    <group position={position}>
      {Array.from({ length: count }, (_, i) => (
        <mesh key={i} ref={(el) => (refs.current[i] = el)} userData={{ noShadow: true }}>
          <icosahedronGeometry args={[1, 0]} />
          <meshStandardMaterial color={color} transparent opacity={0} depthWrite={false} flatShading roughness={1} />
        </mesh>
      ))}
    </group>
  );
};

/** One-shot burst of puffs (dust when building, steam for löyly). Re-fires when `trigger` changes. */
export const Burst = ({
  position,
  trigger,
  color = "#d8c9a8",
  count = 16,
  radius = 1.4,
  rise = 0.6,
  duration = 1.6,
  size = 0.35,
}: {
  position: Vec3;
  trigger: number;
  color?: string;
  count?: number;
  radius?: number;
  rise?: number;
  duration?: number;
  size?: number;
}) => {
  const refs = useRef<(THREE.Mesh | null)[]>([]);
  const start = useRef<number | null>(null);
  const lastTrigger = useRef(trigger);
  useFrame(({ clock }) => {
    if (lastTrigger.current !== trigger) {
      lastTrigger.current = trigger;
      start.current = null;
    }
    if (trigger <= 0) return;
    if (start.current === null) start.current = clock.getElapsedTime();
    const t = (clock.getElapsedTime() - start.current) / duration;
    refs.current.forEach((m, i) => {
      if (!m) return;
      const a = (i / count) * Math.PI * 2 + rand(i) * 0.5;
      const e = 1 - Math.pow(1 - Math.min(1, t), 3);
      m.position.set(Math.cos(a) * radius * e, rise * e * (0.6 + rand(i + 9)), Math.sin(a) * radius * e);
      m.scale.setScalar(size * (0.4 + e) * (0.7 + rand(i + 3) * 0.6));
      (m.material as THREE.MeshStandardMaterial).opacity = t >= 1 ? 0 : (1 - t) * 0.75;
    });
  });
  return (
    <group position={position}>
      {Array.from({ length: count }, (_, i) => (
        <mesh key={i} ref={(el) => (refs.current[i] = el)} userData={{ noShadow: true }}>
          <icosahedronGeometry args={[1, 0]} />
          <meshStandardMaterial color={color} transparent opacity={0} depthWrite={false} flatShading roughness={1} />
        </mesh>
      ))}
    </group>
  );
};
