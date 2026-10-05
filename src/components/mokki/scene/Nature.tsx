import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { C, type SeasonPalette } from "../palette";
import { Mat, rand } from "./primitives";

type Vec3 = [number, number, number];

export const LAKE_RADIUS = 9.5;
export const GROUND_Y = 0.45;

// ---------------------------------------------------------------------------
// Diorama base + lake
// ---------------------------------------------------------------------------

export const DioramaBase = ({ palette }: { palette: SeasonPalette }) => (
  <group>
    {/* Water/ice band visible on the cut-away side */}
    <mesh position={[0, -0.28, 0]} userData={{ noShadow: true }}>
      <cylinderGeometry args={[LAKE_RADIUS, LAKE_RADIUS, 0.56, 64, 1, true]} />
      <meshStandardMaterial color={palette.waterDeep} transparent opacity={0.92} roughness={0.3} flatShading />
    </mesh>
    {/* Lake bed: soil and bedrock layers */}
    <mesh position={[0, -0.86, 0]}>
      <cylinderGeometry args={[LAKE_RADIUS, LAKE_RADIUS * 0.985, 0.6, 64]} />
      <Mat color={C.soil} />
    </mesh>
    <mesh position={[0, -1.42, 0]}>
      <cylinderGeometry args={[LAKE_RADIUS * 0.985, LAKE_RADIUS * 0.94, 0.55, 64]} />
      <Mat color={C.soilDark} />
    </mesh>
  </group>
);

export const Water = ({ palette, animate }: { palette: SeasonPalette; animate: boolean }) => {
  const ref = useRef<THREE.Mesh>(null);
  const geometry = useMemo(() => {
    const g = new THREE.RingGeometry(0.01, LAKE_RADIUS, 56, 18);
    return g;
  }, []);
  const base = useMemo(() => Float32Array.from(geometry.attributes.position.array), [geometry]);

  useFrame(({ clock }) => {
    if (!animate || palette.frozen || !ref.current) return;
    const t = clock.getElapsedTime();
    const pos = geometry.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
      const x = base[i * 3];
      const y = base[i * 3 + 1];
      const r = Math.sqrt(x * x + y * y);
      const edge = Math.max(0, Math.min(1, (LAKE_RADIUS - r) / 1.2));
      const z = (Math.sin(x * 1.3 + t * 1.1) * 0.035 + Math.sin(y * 1.7 - t * 0.9) * 0.03 + Math.sin((x + y) * 2.3 + t * 1.7) * 0.015) * edge;
      pos.setZ(i, z);
    }
    pos.needsUpdate = true;
    geometry.computeVertexNormals();
  });

  return (
    <mesh ref={ref} geometry={geometry} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} userData={{ noCast: true }}>
      {palette.frozen ? (
        <meshPhongMaterial color={palette.water} specular="#ffffff" shininess={40} flatShading />
      ) : (
        <meshPhongMaterial color={palette.water} specular="#cfe9f5" shininess={70} flatShading transparent opacity={0.95} />
      )}
    </mesh>
  );
};

// ---------------------------------------------------------------------------
// Island and shores
// ---------------------------------------------------------------------------

function islandShape(baseRadius: number, wobble: number, points: number, seed: number, scaleZ = 1) {
  const shape = new THREE.Shape();
  for (let i = 0; i <= points; i++) {
    const a = (i / points) * Math.PI * 2;
    const r = baseRadius + (rand(seed + (i % points)) - 0.5) * 2 * wobble;
    const x = Math.cos(a) * r;
    const y = Math.sin(a) * r * scaleZ;
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  return shape;
}

export const Island = ({ palette }: { palette: SeasonPalette }) => {
  const { rock, grass } = useMemo(() => {
    const rockGeo = new THREE.ExtrudeGeometry(islandShape(5.15, 0.3, 22, 3), {
      depth: 0.75,
      bevelEnabled: true,
      bevelThickness: 0.12,
      bevelSize: 0.25,
      bevelSegments: 1,
    });
    rockGeo.rotateX(-Math.PI / 2);
    rockGeo.translate(0, GROUND_Y - 0.75 - 0.12 - 0.05, 0);
    const grassGeo = new THREE.ExtrudeGeometry(islandShape(4.85, 0.28, 22, 3), {
      depth: 0.06,
      bevelEnabled: true,
      bevelThickness: 0.04,
      bevelSize: 0.12,
      bevelSegments: 1,
    });
    grassGeo.rotateX(-Math.PI / 2);
    grassGeo.translate(0, GROUND_Y - 0.08, 0);
    return { rock: rockGeo, grass: grassGeo };
  }, []);

  return (
    <group>
      <mesh geometry={rock}>
        <Mat color={C.granite} />
      </mesh>
      <mesh geometry={grass}>
        <Mat color={palette.grass} roughness={0.95} />
      </mesh>
    </group>
  );
};

/** Smooth granite boulders (kalliot) along the shore. */
export const ShoreRocks = ({ snow }: { snow: boolean }) => {
  const rocks = useMemo(
    () =>
      Array.from({ length: 16 }, (_, i) => {
        const a = (i / 16) * Math.PI * 2 + rand(i + 40) * 0.3;
        // Leave room for the dock on the east shore
        const r = 5.05 + rand(i + 50) * 0.45;
        const s = 0.22 + rand(i + 60) * 0.35;
        return { pos: [Math.cos(a) * r, 0.05, Math.sin(a) * r] as Vec3, s, rot: rand(i + 70) * 3 };
      }).filter((r) => !(r.pos[0] > 3.5 && r.pos[2] > -2.4 && r.pos[2] < -0.9)),
    [],
  );
  return (
    <group>
      {rocks.map((r, i) => (
        <group key={i} position={r.pos} rotation={[0, r.rot, 0]}>
          <mesh scale={[r.s * 1.5, r.s * 0.75, r.s]}>
            <dodecahedronGeometry args={[1, 0]} />
            <Mat color={i % 3 === 0 ? C.rockDark : C.granite} />
          </mesh>
          {snow && (
            <mesh position={[0, r.s * 0.45, 0]} scale={[r.s * 1.2, r.s * 0.35, r.s * 0.8]}>
              <dodecahedronGeometry args={[1, 0]} />
              <Mat color={C.snow} />
            </mesh>
          )}
        </group>
      ))}
    </group>
  );
};

/** Far shore forest along the back of the lake. */
export const FarShore = ({ palette }: { palette: SeasonPalette }) => {
  const geometry = useMemo(() => {
    const start = Math.PI * 0.92;
    const end = Math.PI * 1.62;
    const shape = new THREE.Shape();
    const steps = 26;
    for (let i = 0; i <= steps; i++) {
      const a = start + ((end - start) * i) / steps;
      const x = Math.cos(a) * (LAKE_RADIUS - 0.02);
      const y = -Math.sin(a) * (LAKE_RADIUS - 0.02);
      if (i === 0) shape.moveTo(x, y);
      else shape.lineTo(x, y);
    }
    for (let i = steps; i >= 0; i--) {
      const a = start + ((end - start) * i) / steps;
      const taper = Math.sin((i / steps) * Math.PI);
      const r = LAKE_RADIUS - 0.4 - taper * (1.3 + rand(i + 200) * 0.5);
      shape.lineTo(Math.cos(a) * r, -Math.sin(a) * r);
    }
    const g = new THREE.ExtrudeGeometry(shape, { depth: 0.5, bevelEnabled: true, bevelThickness: 0.08, bevelSize: 0.12, bevelSegments: 1 });
    g.rotateX(-Math.PI / 2);
    g.translate(0, -0.2, 0);
    return g;
  }, []);

  const trees = useMemo(() => {
    const list: { pos: Vec3; s: number; birch: boolean }[] = [];
    for (let i = 0; i < 24; i++) {
      const a = Math.PI * 0.97 + (Math.PI * 0.6 * i) / 23;
      const taper = Math.sin(((a - Math.PI * 0.92) / (Math.PI * 0.7)) * Math.PI);
      const r = LAKE_RADIUS - 0.6 - rand(i + 300) * (0.4 + taper * 1.0);
      list.push({ pos: [Math.cos(a) * r, 0.35, Math.sin(a) * r], s: 0.75 + rand(i + 310) * 0.45, birch: rand(i + 320) > 0.72 });
    }
    return list;
  }, []);

  return (
    <group>
      <mesh geometry={geometry}>
        <Mat color={palette.grass} />
      </mesh>
      {trees.map((t, i) =>
        t.birch ? (
          <Birch key={i} position={t.pos} scale={t.s} palette={palette} seed={i + 400} />
        ) : (
          <Pine key={i} position={t.pos} scale={t.s} palette={palette} />
        ),
      )}
    </group>
  );
};

/** Little rocky islet in the bay — kokko site on juhannus. */
export const Islet = ({ snow, children }: { snow: boolean; children?: React.ReactNode }) => (
  <group position={[-1.7, 0, 6.5]}>
    <mesh position={[0, 0.02, 0]} scale={[1.0, 0.32, 0.8]}>
      <dodecahedronGeometry args={[1, 0]} />
      <Mat color={C.granite} />
    </mesh>
    <mesh position={[0.75, 0, 0.35]} scale={[0.45, 0.2, 0.4]}>
      <dodecahedronGeometry args={[1, 0]} />
      <Mat color={C.rockDark} />
    </mesh>
    {snow && (
      <mesh position={[0, 0.22, 0]} scale={[0.8, 0.12, 0.6]}>
        <dodecahedronGeometry args={[1, 0]} />
        <Mat color={C.snow} />
      </mesh>
    )}
    {children}
  </group>
);

// ---------------------------------------------------------------------------
// Trees
// ---------------------------------------------------------------------------

const BARE_BRANCHES = [
  { y: 0.62, angle: 0, tilt: 0.75, length: 0.55 },
  { y: 0.7, angle: 2.1, tilt: 0.7, length: 0.6 },
  { y: 0.78, angle: 4.2, tilt: 0.65, length: 0.55 },
  { y: 0.86, angle: 1.0, tilt: 0.5, length: 0.5 },
  { y: 0.92, angle: 3.2, tilt: 0.45, length: 0.45 },
  { y: 0.98, angle: 5.2, tilt: 0.35, length: 0.4 },
  { y: 1.0, angle: 0.2, tilt: 0.1, length: 0.35 },
];

const UP = new THREE.Vector3(0, 1, 0);

const Branch = ({ from, angle, tilt, length }: { from: Vec3; angle: number; tilt: number; length: number }) => {
  const dir = new THREE.Vector3(Math.sin(tilt) * Math.cos(angle), Math.cos(tilt), Math.sin(tilt) * Math.sin(angle));
  const mid = new THREE.Vector3(...from).addScaledVector(dir, length / 2);
  const q = new THREE.Quaternion().setFromUnitVectors(UP, dir);
  return (
    <mesh position={mid} quaternion={q}>
      <cylinderGeometry args={[0.008, 0.022, length, 4]} />
      <Mat color="#7d6660" />
    </mesh>
  );
};

export const Birch = ({
  position,
  scale = 1,
  palette,
  seed = 0,
}: {
  position: Vec3;
  scale?: number;
  palette: SeasonPalette;
  seed?: number;
}) => {
  const h = 1.9;
  const leaves = palette.leaves;
  const lean = (rand(seed) - 0.5) * 0.12;
  return (
    <group position={position} scale={scale} rotation={[lean, rand(seed + 1) * 6, lean * 0.6]}>
      <mesh position={[0, h / 2, 0]}>
        <cylinderGeometry args={[0.045, 0.085, h, 6]} />
        <Mat color={C.birchBark} />
      </mesh>
      {/* Black bark marks */}
      {[0.35, 0.7, 1.05, 1.4].map((y, i) => (
        <mesh key={i} position={[0.05 * (i % 2 ? 1 : -1), y, 0.045]} rotation={[0, 0, (i % 2 ? 1 : -1) * 0.2]}>
          <boxGeometry args={[0.06, 0.03, 0.04]} />
          <Mat color={C.birchMark} />
        </mesh>
      ))}
      {palette.bareBirch ? (
        // Winter: sparse purple-brown twigs reaching upwards
        BARE_BRANCHES.map((b, i) => <Branch key={i} from={[0, h * b.y, 0]} angle={b.angle + rand(seed + i) * 0.6} tilt={b.tilt} length={b.length} />)
      ) : (
        <group position={[0, h * 0.95, 0]}>
          {[
            [0, 0.15, 0, 0.62],
            [0.32, -0.12, 0.12, 0.48],
            [-0.28, -0.08, -0.15, 0.5],
            [0.05, 0.55, -0.05, 0.42],
          ].map(([x, y, z, r], i) => (
            <mesh key={i} position={[x, y, z]} scale={[1, 1.15, 1]}>
              <icosahedronGeometry args={[r, 0]} />
              <Mat color={leaves[(i + seed) % leaves.length]} />
            </mesh>
          ))}
        </group>
      )}
    </group>
  );
};

export const Pine = ({ position, scale = 1, palette }: { position: Vec3; scale?: number; palette: SeasonPalette }) => (
  <group position={position} scale={scale}>
    <mesh position={[0, 0.3, 0]}>
      <cylinderGeometry args={[0.06, 0.1, 0.6, 6]} />
      <Mat color={C.pineTrunk} />
    </mesh>
    {[
      [0.62, 0.95, 0.55],
      [0.5, 0.8, 1.05],
      [0.36, 0.65, 1.5],
      [0.2, 0.45, 1.88],
    ].map(([r, h, y], i) => (
      <group key={i}>
        <mesh position={[0, y, 0]}>
          <coneGeometry args={[r, h, 7]} />
          <Mat color={i % 2 ? palette.pine : "#335f40"} />
        </mesh>
        {palette.snow && (
          <mesh position={[0, y + h * 0.18, 0]}>
            <coneGeometry args={[r * 0.72, h * 0.55, 7]} />
            <Mat color={C.snow} />
          </mesh>
        )}
      </group>
    ))}
  </group>
);

// ---------------------------------------------------------------------------
// Autumn mushrooms (for Suomen Sienet owners)
// ---------------------------------------------------------------------------

const Karpassieni = ({ position, s = 1 }: { position: Vec3; s?: number }) => (
  <group position={position} scale={s}>
    <mesh position={[0, 0.06, 0]}>
      <cylinderGeometry args={[0.02, 0.028, 0.12, 6]} />
      <Mat color="#f5efe2" />
    </mesh>
    <mesh position={[0, 0.12, 0]} scale={[1, 0.6, 1]}>
      <sphereGeometry args={[0.08, 8, 4, 0, Math.PI * 2, 0, Math.PI / 2]} />
      <Mat color="#d22b1f" />
    </mesh>
    {[0, 1, 2, 3, 4].map((i) => (
      <mesh key={i} position={[Math.cos(i * 1.3) * 0.045, 0.155, Math.sin(i * 1.3) * 0.045]}>
        <sphereGeometry args={[0.012, 4, 3]} />
        <Mat color="#ffffff" />
      </mesh>
    ))}
  </group>
);

const Kantarelli = ({ position, s = 1 }: { position: Vec3; s?: number }) => (
  <group position={position} scale={s}>
    <mesh position={[0, 0.05, 0]} rotation={[Math.PI, 0, 0]}>
      <coneGeometry args={[0.06, 0.1, 7]} />
      <Mat color="#f0a422" />
    </mesh>
  </group>
);

export const Mushrooms = () => {
  const spots: { pos: Vec3; red: boolean }[] = [
    { pos: [-1.2, GROUND_Y, -3.0], red: true },
    { pos: [-0.85, GROUND_Y, -3.15], red: false },
    { pos: [1.0, GROUND_Y, -2.75], red: false },
    { pos: [1.15, GROUND_Y, -2.6], red: false },
    { pos: [-3.8, GROUND_Y, 1.5], red: true },
    { pos: [-3.95, GROUND_Y, 1.65], red: true },
    { pos: [0.4, GROUND_Y, -3.55], red: false },
    { pos: [2.75, GROUND_Y, -3.05], red: true },
  ];
  return (
    <group>
      {spots.map((m, i) =>
        m.red ? <Karpassieni key={i} position={m.pos} s={1 + rand(i) * 0.5} /> : <Kantarelli key={i} position={m.pos} s={1 + rand(i) * 0.4} />,
      )}
    </group>
  );
};
