import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { C } from "../palette";
import { FENCE_POSTS, KOPPI_POSITION } from "./layout";
import { PIECE_LAYOUT } from "./Pieces";
import { Block, Cyl, GableFill, GableRoof, Mat, Smoke, rand } from "./primitives";

type Vec3 = [number, number, number];

const UP = new THREE.Vector3(0, 1, 0);

/** A stick between two points (cylinders point along y by default). */
const Stick = ({ from, to, radius, color }: { from: Vec3; to: Vec3; radius: number; color: string }) => {
  const { mid, length, quaternion } = useMemo(() => {
    const a = new THREE.Vector3(...from);
    const b = new THREE.Vector3(...to);
    const dir = b.clone().sub(a);
    return {
      mid: a.clone().add(b).multiplyScalar(0.5),
      length: dir.length(),
      quaternion: new THREE.Quaternion().setFromUnitVectors(UP, dir.normalize()),
    };
  }, [from, to]);
  return (
    <mesh position={mid} quaternion={quaternion}>
      <cylinderGeometry args={[radius, radius, length, 5]} />
      <Mat color={color} />
    </mesh>
  );
};

// ---------------------------------------------------------------------------
// Nuotiopaikka: stone fire ring with log benches
// ---------------------------------------------------------------------------

export const Nuotiopaikka = ({ fire, snow, lightsOn }: { fire: boolean; snow: boolean; lightsOn: boolean }) => {
  const flames = useRef<(THREE.Mesh | null)[]>([]);
  const light = useRef<THREE.PointLight>(null);
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    flames.current.forEach((f, i) => {
      if (!f) return;
      const s = 1 + Math.sin(t * (8 + i * 2.1) + i) * 0.16 + Math.sin(t * 13 + i) * 0.08;
      f.scale.set(s, s * (1.1 + Math.sin(t * 5 + i) * 0.18), s);
      f.rotation.y = t * (0.6 + i * 0.3);
    });
    if (light.current) light.current.intensity = 1.3 + Math.sin(t * 11) * 0.35 + Math.sin(t * 17) * 0.2;
  });

  // Benches face the fire from the back and sides, leaving the camera side open
  const benches = [Math.PI * 0.95, Math.PI * 1.25, Math.PI * 1.55];
  return (
    <group position={PIECE_LAYOUT.nuotiopaikka.center}>
      {/* Ash bed and ring of stones */}
      <mesh position={[0, 0.015, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.24, 12]} />
        <Mat color={snow && !fire ? C.snow : "#3a3330"} />
      </mesh>
      {Array.from({ length: 10 }, (_, i) => {
        const a = (i / 10) * Math.PI * 2;
        const s = 0.06 + rand(i + 80) * 0.025;
        return (
          <mesh key={i} position={[Math.cos(a) * 0.28, s * 0.5, Math.sin(a) * 0.28]} rotation={[0, rand(i) * 3, 0]} scale={[s * 1.3, s, s]}>
            <dodecahedronGeometry args={[1, 0]} />
            <Mat color={i % 3 === 0 ? C.rockDark : C.granite} />
          </mesh>
        );
      })}
      {/* Teepee of firewood */}
      {[0, 1, 2, 3].map((i) => {
        const a = (i / 4) * Math.PI * 2 + 0.4;
        return <Stick key={i} from={[Math.cos(a) * 0.15, 0.02, Math.sin(a) * 0.15]} to={[0, 0.22, 0]} radius={0.022} color={i % 2 ? C.logDark : C.log} />;
      })}
      {fire && (
        <>
          {[
            ["#ff5a1f", 0.13, 0.3, 0.16],
            ["#ff9a2e", 0.09, 0.24, 0.18],
            ["#ffd25a", 0.05, 0.16, 0.18],
          ].map(([color, r, h, y], i) => (
            <mesh key={i} ref={(el) => (flames.current[i] = el)} position={[0, y as number, 0]} userData={{ noShadow: true }}>
              <coneGeometry args={[r as number, h as number, 6]} />
              <meshBasicMaterial color={color as string} transparent opacity={0.9} />
            </mesh>
          ))}
          <pointLight ref={light} color="#ff8a3a" intensity={1.3} distance={lightsOn ? 3 : 1.6} decay={1.8} position={[0, 0.35, 0]} />
          <Smoke position={[0, 0.35, 0]} count={6} rise={1.3} size={0.22} spread={0.25} color="#a8a19a" opacity={0.35} />
          {/* Makkara on a stick, leaning over the fire */}
          <Stick from={[-0.62, 0.22, -0.3]} to={[-0.05, 0.42, -0.02]} radius={0.008} color={C.logEnd} />
          <mesh position={[-0.08, 0.41, -0.035]} rotation={[0, 0.46, Math.PI / 2 - 0.33]}>
            <capsuleGeometry args={[0.022, 0.07, 3, 6]} />
            <Mat color="#9c3b23" />
          </mesh>
        </>
      )}
      {/* Log benches on two stumps */}
      {benches.map((a, i) => (
        <group key={i} position={[Math.cos(a) * 0.62, 0, Math.sin(a) * 0.62]} rotation={[0, -a + Math.PI / 2, 0]}>
          <Cyl radiusTop={0.05} height={0.12} segments={6} position={[-0.17, 0.06, 0]} color={C.logDark} />
          <Cyl radiusTop={0.05} height={0.12} segments={6} position={[0.17, 0.06, 0]} color={C.logDark} />
          <Cyl radiusTop={0.065} height={0.55} segments={7} position={[0, 0.17, 0]} rotation={[0, 0, Math.PI / 2]} color={C.log} />
          {snow && <Block size={[0.5, 0.03, 0.09]} position={[0, 0.24, 0]} color={C.snow} />}
        </group>
      ))}
    </group>
  );
};

// ---------------------------------------------------------------------------
// Onkipaikka: shore rock, bamboo rod and a bobber on the water
// ---------------------------------------------------------------------------

export const Onkipaikka = ({ frozen, snow }: { frozen: boolean; snow: boolean }) => {
  const bobber = useRef<THREE.Group>(null);
  const [cx, cy, cz] = PIECE_LAYOUT.onkipaikka.center;
  // Local +x points straight out from the island centre
  const heading = -Math.atan2(cz, cx);
  const waterY = -cy;
  const tip: Vec3 = [1.45, 0.75, 0.08];
  const bob: Vec3 = [1.85, waterY + 0.03, 0.18];

  useFrame(({ clock }) => {
    if (!bobber.current) return;
    const t = clock.getElapsedTime();
    bobber.current.position.y = frozen ? bob[1] : bob[1] + Math.sin(t * 2.2) * 0.012 + (Math.sin(t * 0.37) > 0.96 ? -0.03 : 0);
  });

  return (
    <group position={[cx, cy, cz]} rotation={[0, heading, 0]}>
      {/* Flat granite slab reaching into the lake */}
      <mesh position={[0.55, -0.2, 0]} scale={[0.68, 0.26, 0.48]} rotation={[0, 0.3, 0]}>
        <dodecahedronGeometry args={[1, 0]} />
        <Mat color={C.granite} />
      </mesh>
      <mesh position={[1.05, -0.33, 0.3]} scale={[0.32, 0.18, 0.28]}>
        <dodecahedronGeometry args={[1, 0]} />
        <Mat color={C.rockDark} />
      </mesh>
      {snow && (
        <mesh position={[0.5, -0.03, 0]} scale={[0.5, 0.08, 0.36]} rotation={[0, 0.3, 0]}>
          <dodecahedronGeometry args={[1, 0]} />
          <Mat color={C.snow} />
        </mesh>
      )}
      <group position={[0.45, 0, 0]} rotation={[0, 1.15, 0]}>
        {/* Forked stick holding the rod */}
        <Stick from={[0.62, 0.0, 0.0]} to={[0.62, 0.24, 0.02]} radius={0.015} color={C.logDark} />
        {/* Bamboo rod, butt resting on the rock */}
        <Stick from={[0.2, 0.06, -0.06]} to={tip} radius={0.016} color="#d8c48a" />
        {[0.35, 0.6, 0.85].map((f) => (
          <mesh
            key={f}
            position={[0.2 + (tip[0] - 0.2) * f, 0.06 + (tip[1] - 0.06) * f, -0.06 + (tip[2] + 0.06) * f]}
            rotation={[0, 0, Math.atan2(tip[1] - 0.06, tip[0] - 0.2) - Math.PI / 2]}
          >
            <cylinderGeometry args={[0.02, 0.02, 0.02, 5]} />
            <Mat color="#b29d62" />
          </mesh>
        ))}
        {/* Line down to the bobber */}
        <Stick from={tip} to={[bob[0], bob[1] + 0.03, bob[2]]} radius={0.003} color="#e8e4da" />
        <group ref={bobber} position={bob}>
          <mesh position={[0, 0.02, 0]} userData={{ noCast: true }}>
            <sphereGeometry args={[0.035, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <Mat color="#e0312b" />
          </mesh>
          <mesh position={[0, 0.02, 0]} rotation={[Math.PI, 0, 0]} userData={{ noCast: true }}>
            <sphereGeometry args={[0.035, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <Mat color={C.white} />
          </mesh>
        </group>
      </group>
      {/* Bucket with the day's catch */}
      <group position={[0.32, 0.06, -0.28]}>
        <Cyl radiusTop={0.08} radiusBottom={0.065} height={0.15} segments={10} position={[0, 0.075, 0]} color="#8d969c" />
        <mesh position={[0, 0.15, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.08, 0.008, 4, 14]} />
          <Mat color={C.metal} />
        </mesh>
        <mesh position={[0.02, 0.19, 0]} rotation={[0, 0, 0.5]} scale={[0.6, 1, 0.25]}>
          <coneGeometry args={[0.04, 0.07, 4]} />
          <Mat color="#9fb0a6" />
        </mesh>
      </group>
      {/* Tin of worms */}
      <Cyl radiusTop={0.035} height={0.05} segments={8} position={[0.55, 0.06, 0.25]} color="#c79a3f" />
    </group>
  );
};

// ---------------------------------------------------------------------------
// Riukuaita: traditional roundpole fence, diagonal poles between twin stakes
// ---------------------------------------------------------------------------

const FENCE_GREYS = ["#9a958c", "#86817a", "#a8a297", "#918b81"];

export const Riukuaita = ({ snow }: { snow: boolean }) => {
  const parts = useMemo(() => {
    const stakes: { pos: Vec3; offset: Vec3 }[] = [];
    const poles: { from: Vec3; to: Vec3 }[] = [];
    FENCE_POSTS.forEach((p, i) => {
      const next = FENCE_POSTS[i + 1];
      const prev = FENCE_POSTS[i - 1];
      const along = new THREE.Vector3(...(next ?? p))
        .sub(new THREE.Vector3(...(prev ?? p)))
        .setY(0)
        .normalize();
      const side = new THREE.Vector3(-along.z, 0, along.x).multiplyScalar(0.045);
      stakes.push({ pos: p, offset: [side.x, 0, side.z] });
      if (!next) return;
      const a = new THREE.Vector3(...p);
      const dir = new THREE.Vector3(...next).sub(a);
      const len = dir.length();
      dir.normalize();
      // Poles lean ~35° along the fence line, overlapping like shingles
      const count = Math.round(len / 0.12);
      for (let k = 0; k < count; k++) {
        const start = a
          .clone()
          .addScaledVector(dir, (k / count) * len - 0.05)
          .setY(p[1] + 0.03);
        const end = start
          .clone()
          .addScaledVector(dir, 0.5)
          .setY(p[1] + 0.42 + rand(i * 10 + k) * 0.04);
        poles.push({
          from: [start.x, start.y, start.z],
          to: [end.x, end.y, end.z],
        });
      }
    });
    return { stakes, poles };
  }, []);

  return (
    <group>
      {parts.stakes.map(({ pos, offset }, i) => (
        <group key={i} position={pos}>
          {[1, -1].map((s) => (
            <group key={s}>
              <Cyl
                radiusTop={0.018}
                radiusBottom={0.022}
                height={0.56}
                segments={5}
                position={[offset[0] * s, 0.28, offset[2] * s]}
                color={FENCE_GREYS[(i + (s > 0 ? 0 : 1)) % 4]}
              />
              {snow && <Cyl radiusTop={0.02} height={0.03} segments={5} position={[offset[0] * s, 0.575, offset[2] * s]} color={C.snow} />}
            </group>
          ))}
          {/* Withy binding */}
          <mesh position={[0, 0.44, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.06, 0.008, 3, 10]} />
            <Mat color="#6b5a45" />
          </mesh>
        </group>
      ))}
      {parts.poles.map((pole, i) => (
        <Stick key={i} from={pole.from} to={pole.to} radius={0.014} color={FENCE_GREYS[i % 4]} />
      ))}
    </group>
  );
};

// ---------------------------------------------------------------------------
// Koirankoppi: red doghouse with white trim
// ---------------------------------------------------------------------------

export const Koirankoppi = ({ snow, scale = 1 }: { snow: boolean; scale?: number }) => {
  const w = 0.42;
  const d = 0.5;
  const h = 0.3;
  return (
    // Door faces the camera side of the island
    <group position={KOPPI_POSITION} rotation={[0, Math.PI / 4, 0]} scale={scale}>
      <Block size={[w + 0.06, 0.04, d + 0.06]} position={[0, 0.02, 0]} color={C.plankDark} />
      <Block size={[w, h, d]} position={[0, 0.04 + h / 2, 0]} color={C.punamulta} />
      {[
        [w / 2, d / 2],
        [-w / 2, d / 2],
        [w / 2, -d / 2],
        [-w / 2, -d / 2],
      ].map(([x, z], i) => (
        <Block key={i} size={[0.035, h, 0.035]} position={[x, 0.04 + h / 2, z]} color={C.trim} />
      ))}
      {/* Gable towards the front */}
      <group position={[0, 0.04 + h, 0]} rotation={[0, Math.PI / 2, 0]}>
        <GableFill width={d} depth={w} rise={0.2} color={C.punamulta} />
        <GableRoof width={d} depth={w} rise={0.22} overhang={0.07} thickness={0.035} snow={snow} />
      </group>
      {/* Arched doorway */}
      <Block size={[0.18, 0.17, 0.02]} position={[0, 0.125, d / 2 + 0.002]} color="#24160f" />
      <mesh position={[0, 0.21, d / 2 + 0.002]}>
        <circleGeometry args={[0.09, 10, 0, Math.PI]} />
        <meshStandardMaterial color="#24160f" flatShading />
      </mesh>
      {/* Name plate */}
      <Block size={[0.16, 0.05, 0.015]} position={[0, 0.33, d / 2 + 0.01]} color={C.trim} />
      {/* Water bowl */}
      <group position={[0.24, 0, d / 2 + 0.12]}>
        <Cyl radiusTop={0.06} radiusBottom={0.045} height={0.035} segments={10} position={[0, 0.018, 0]} color="#c0392b" />
        <mesh position={[0, 0.037, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.05, 10]} />
          <Mat color={snow ? C.ice : "#5aa6cf"} roughness={0.2} />
        </mesh>
      </group>
    </group>
  );
};
