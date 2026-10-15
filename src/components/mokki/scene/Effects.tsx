import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { BIRCH_CROWN_Y, BIRCHES, birchScale } from "./layout";
import { GROUND_Y } from "./Nature";
import { Interactive } from "./Porch";
import { Mat, rand } from "./primitives";

type Vec3 = [number, number, number];
const G = GROUND_Y;
const PAPER = "#fbfaf4";

/** Flat paper strip along a curve; `side` is the direction the strip's width lies in. */
const Ribbon = ({ points, width = 0.06, side }: { points: THREE.Vector3[]; width?: number; side: THREE.Vector3 }) => {
  const geometry = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3(points);
    const steps = 24;
    const positions: number[] = [];
    const indices: number[] = [];
    for (let i = 0; i <= steps; i++) {
      const p = curve.getPoint(i / steps);
      const tangent = curve.getTangent(i / steps);
      // Keep the strip flat: remove the part of `side` along the curve
      const w = side.clone().addScaledVector(tangent, -side.dot(tangent)).normalize().multiplyScalar(width / 2);
      positions.push(p.x - w.x, p.y - w.y, p.z - w.z, p.x + w.x, p.y + w.y, p.z + w.z);
      if (i < steps) indices.push(i * 2, i * 2 + 1, i * 2 + 2, i * 2 + 1, i * 2 + 3, i * 2 + 2);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    g.setIndex(indices);
    g.computeVertexNormals();
    return g;
  }, [points, width, side]);
  return (
    <mesh geometry={geometry} userData={{ noCast: true }}>
      <meshStandardMaterial color={PAPER} side={THREE.DoubleSide} roughness={0.95} />
    </mesh>
  );
};

/** Toilet paper draped over one birch: swags across the crown and tails hanging down. */
const PaperedBirch = ({ seed, scale }: { seed: number; scale: number }) => {
  const tails = useRef<THREE.Group>(null);
  const { swags, hangs } = useMemo(() => {
    const crown = BIRCH_CROWN_Y * scale;
    const r = 0.72 * scale;
    // Swags drape around the outside of the crown
    const swags = [0, 1, 2, 3].map((k) => {
      const a = seed + k * 1.6;
      const b = a + 1.5 + rand(seed + k) * 0.5;
      const from = new THREE.Vector3(Math.cos(a) * r * 0.8, crown + 0.35 - k * 0.15, Math.sin(a) * r * 0.8);
      const to = new THREE.Vector3(Math.cos(b) * r * 0.8, crown + 0.25 - k * 0.12, Math.sin(b) * r * 0.8);
      const mid = from.clone().add(to).multiplyScalar(0.5);
      mid.setY(0).setLength(r * 1.15).setY(crown - 0.2 - k * 0.1);
      return { points: [from, mid, to], side: new THREE.Vector3(0, 1, 0) };
    });
    // Tails hang from the lower edge of the crown, flat to the trunk
    const hangs = [0, 1, 2, 3, 4, 5].map((k) => {
      const a = seed + k * 1.05 + 0.3;
      const top = new THREE.Vector3(Math.cos(a) * r, crown - 0.25, Math.sin(a) * r);
      const len = 0.6 + rand(seed * 3 + k) * 0.6;
      const points = [0, 1, 2, 3, 4].map((j) => {
        const f = j / 4;
        return new THREE.Vector3(top.x + Math.sin(f * 5 + k) * 0.06, top.y - f * len, top.z + Math.cos(f * 4 + k) * 0.06);
      });
      return { points, side: new THREE.Vector3(-Math.sin(a), 0, Math.cos(a)) };
    });
    return { swags, hangs };
  }, [seed, scale]);

  useFrame(({ clock }) => {
    if (tails.current) tails.current.rotation.y = Math.sin(clock.getElapsedTime() * 0.9 + seed) * 0.04;
  });

  return (
    <group>
      {swags.map((r, i) => (
        <Ribbon key={`s${i}`} points={r.points} side={r.side} width={0.07} />
      ))}
      <group ref={tails}>
        {hangs.map((r, i) => (
          <Ribbon key={`h${i}`} points={r.points} side={r.side} />
        ))}
      </group>
    </group>
  );
};

/** Rolls of toilet paper dropped on the grass, one unrolled. */
const Rolls = ({ position }: { position: Vec3 }) => {
  const trail = useMemo(
    () => [0, 1, 2, 3].map((j) => new THREE.Vector3(0.08 + j * 0.13, 0.012, Math.sin(j * 1.3) * 0.05)),
    [],
  );
  const flat = useMemo(() => new THREE.Vector3(0, 0, 1), []);
  return (
    <group position={position}>
      <mesh position={[0, 0.06, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.06, 0.06, 0.1, 10]} />
        <Mat color={PAPER} />
      </mesh>
      <mesh position={[-0.18, 0.05, 0.12]}>
        <cylinderGeometry args={[0.05, 0.05, 0.1, 10]} />
        <Mat color={PAPER} />
      </mesh>
      <Ribbon points={trail} side={flat} width={0.06} />
    </group>
  );
};

/** Hammock birches and the south-west birch: the ones you can see from the porch. */
const PAPERED = [0, 1, 6];

export const Vessapaperi = ({ onClick }: { onClick?: () => void }) => (
  <group>
    {PAPERED.map((i) => {
      const [x, y, z] = BIRCHES[i];
      return (
        <Interactive key={i} position={[x, y, z]} onClick={onClick} label="toilet paper" ringRadius={0.5}>
          <PaperedBirch seed={i * 1.7} scale={birchScale(i)} />
        </Interactive>
      );
    })}
    <Rolls position={[3.0, G, 2.55]} />
  </group>
);

/** Berry bushes picked bare: a tipped bucket and berries spilled by the flower bed in front of the porch. */
export const Marjavarkaus = ({ onClick }: { onClick?: () => void }) => {
  const spilled = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => ({
        pos: [0.12 + rand(i + 1) * 0.3, 0.02, -0.15 + rand(i + 20) * 0.3] as Vec3,
        color: ["#2b3f8f", "#c3172c", "#7a1030"][i % 3],
      })),
    [],
  );
  return (
    <Interactive position={[-0.72, G, 1.95]} onClick={onClick} label="raided berries" ringRadius={0.45}>
      <group rotation={[0, -0.4, 0]}>
        {/* Bucket on its side */}
        <group rotation={[0, 0, Math.PI / 2 - 0.15]} position={[0, 0.09, 0]}>
          <mesh>
            <cylinderGeometry args={[0.09, 0.07, 0.17, 10, 1, true]} />
            <Mat color="#d9483b" side={THREE.DoubleSide} />
          </mesh>
          <mesh position={[0, -0.085, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.07, 10]} />
            <Mat color="#b83a2f" side={THREE.DoubleSide} />
          </mesh>
        </group>
        {spilled.map((b, i) => (
          <mesh key={i} position={b.pos}>
            <sphereGeometry args={[0.03, 5, 4]} />
            <Mat color={b.color} roughness={0.4} />
          </mesh>
        ))}
        {/* Leaves torn off in the raid */}
        {[0, 1, 2].map((i) => (
          <mesh key={`l${i}`} position={[-0.15 + i * 0.1, 0.012, 0.18 - i * 0.12]} rotation={[-Math.PI / 2, 0, i]}>
            <circleGeometry args={[0.04, 5]} />
            <Mat color="#5c9a45" side={THREE.DoubleSide} />
          </mesh>
        ))}
      </group>
    </Interactive>
  );
};
