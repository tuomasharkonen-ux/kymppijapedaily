import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import type { MokkiPieceId, MokkiSeason } from "@/lib/mokki";
import { C, type SeasonPalette } from "../../palette";
import { CABIN } from "../Cabin";
import { GROUND_Y } from "../Nature";
import { PIECE_LAYOUT } from "../Pieces";
import { rand } from "../primitives";
import { Kit, KitMesh } from "./kit";

type Vec2 = [number, number];

// Grass tufts, flowers, fallen leaves and stepping-stone paths: everything is instanced or merged,
// so the whole lawn is a handful of draw calls.
const LAWN_RADIUS = 4.7;
const GRASS_COUNT = 1700;
const FLOWER_COUNT = 160;
const LEAF_COUNT = 240;

const OPEN_PIECES = new Set<MokkiPieceId>(["laituri", "soutuvene", "riippumatto", "lipputanko", "riukuaita"]);

/** Footprints where nothing grows: the cabin + porch and the built pieces. */
function blockedAreas(pieces: { id: MokkiPieceId }[]) {
  const [cx, , cz] = CABIN.position;
  const rects: [number, number, number, number][] = [[cx - CABIN.width / 2 - 0.1, cz - CABIN.depth / 2 - 0.1, cx + CABIN.width / 2 + 0.1, cz + CABIN.depth / 2 + CABIN.porchDepth + 0.45]];
  for (const p of pieces) {
    if (OPEN_PIECES.has(p.id)) continue;
    const { center, footprint } = PIECE_LAYOUT[p.id];
    rects.push([center[0] - footprint[0] / 2, center[2] - footprint[2] / 2, center[0] + footprint[0] / 2, center[2] + footprint[2] / 2]);
  }
  return (x: number, z: number) => rects.some(([x0, z0, x1, z1]) => x > x0 && x < x1 && z > z0 && z < z1);
}

function scatter(count: number, seed: number, blocked: (x: number, z: number) => boolean) {
  const points: Vec2[] = [];
  for (let i = 0; points.length < count && i < count * 3; i++) {
    const a = rand(seed + i * 2) * Math.PI * 2;
    const r = Math.sqrt(rand(seed + i * 2 + 1)) * LAWN_RADIUS;
    const x = Math.cos(a) * r;
    const z = Math.sin(a) * r;
    if (!blocked(x, z)) points.push([x, z]);
  }
  return points;
}

/** One instanced mesh from a list of transforms + colours. */
const Instances = ({
  geometry,
  items,
  material,
}: {
  geometry: THREE.BufferGeometry;
  items: { x: number; y: number; z: number; rotY: number; scale: [number, number, number]; color: string; tilt?: number }[];
  material: React.ReactNode;
}) => {
  const ref = useRef<THREE.InstancedMesh>(null);
  useEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const e = new THREE.Euler();
    const color = new THREE.Color();
    items.forEach((it, i) => {
      q.setFromEuler(e.set(it.tilt ?? 0, it.rotY, 0));
      m.compose(new THREE.Vector3(it.x, it.y, it.z), q, new THREE.Vector3(...it.scale));
      mesh.setMatrixAt(i, m);
      mesh.setColorAt(i, color.set(it.color));
    });
    mesh.count = items.length;
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [items]);
  return (
    <instancedMesh ref={ref} args={[geometry, undefined, Math.max(1, items.length)]} userData={{ noCast: true }} raycast={() => null}>
      {material}
    </instancedMesh>
  );
};

function tuftGeometry() {
  const kit = new Kit();
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + 0.4;
    kit.add(new THREE.ConeGeometry(0.014, 0.11 + (i % 2) * 0.03, 3), "#ffffff", [Math.cos(a) * 0.018, 0.055, Math.sin(a) * 0.018], [Math.sin(a) * 0.3, 0, Math.cos(a) * 0.3]);
  }
  return kit.build();
}

const STEPPING_PATHS: Vec2[][] = [
  // Porch steps → mailbox → front lawn
  [
    [-0.05, 1.6],
    [0.15, 2.0],
    [0.75, 2.6],
    [1.3, 3.3],
    [1.7, 3.85],
  ],
];
const SAUNA_PATH: Vec2[] = [
  [0.35, 1.55],
  [1.2, 0.98],
  [2.0, 0.82],
  [3.0, 0.78],
  [3.55, -0.4],
  [3.95, -1.6],
  [4.45, -1.72],
];

function buildPaths(kit: Kit, paths: Vec2[][], snow: boolean) {
  let n = 0;
  for (const path of paths) {
    for (let s = 0; s < path.length - 1; s++) {
      const [ax, az] = path[s];
      const [bx, bz] = path[s + 1];
      const len = Math.hypot(bx - ax, bz - az);
      for (let t = s === 0 ? 0 : 0.34; t < len; t += 0.34, n++) {
        const k = t / len;
        const jx = (rand(n + 700) - 0.5) * 0.06;
        const jz = (rand(n + 710) - 0.5) * 0.06;
        const sz = 0.1 + rand(n + 720) * 0.04;
        kit.lump([sz * 1.2, 0.03, sz], [ax + (bx - ax) * k + jx, GROUND_Y - 0.005, az + (bz - az) * k + jz], snow ? "#d9dde0" : n % 3 ? C.granite : C.rock, [0, rand(n + 730) * 3, 0]);
      }
    }
  }
}

export const GroundDetail = ({ palette, season, pieces }: { palette: SeasonPalette; season: MokkiSeason; pieces: { id: MokkiPieceId; status: string }[] }) => {
  const pieceKey = pieces.map((p) => p.id).join();
  const blocked = useMemo(() => blockedAreas(pieces), [pieceKey]); // eslint-disable-line react-hooks/exhaustive-deps
  const hasSauna = pieces.some((p) => p.id === "sauna" && p.status === "complete");
  const tuft = useMemo(tuftGeometry, []);
  const flowerHead = useMemo(() => new THREE.IcosahedronGeometry(0.02, 0), []);
  const stem = useMemo(() => new THREE.CylinderGeometry(0.003, 0.004, 0.08, 3).translate(0, 0.04, 0), []);
  const leaf = useMemo(() => new THREE.BoxGeometry(0.035, 0.004, 0.022), []);
  useEffect(
    () => () => {
      [tuft, flowerHead, stem, leaf].forEach((g) => g.dispose());
    },
    [tuft, flowerHead, stem, leaf],
  );

  const grass = useMemo(() => {
    if (palette.snow) return [];
    const base = new THREE.Color(palette.grass);
    const dry = new THREE.Color(season === "autumn" ? "#b9a456" : "#4f7f36");
    return scatter(GRASS_COUNT, 100, blocked).map(([x, z], i) => {
      const c = base.clone().lerp(dry, rand(i + 300) * 0.55).offsetHSL(0, 0, (rand(i + 310) - 0.5) * 0.08);
      const s = 0.55 + rand(i + 320) * 0.6;
      return { x, y: GROUND_Y - 0.01, z, rotY: rand(i + 330) * 6.28, scale: [s, s * (0.8 + rand(i + 340) * 0.6), s] as [number, number, number], color: `#${c.getHexString()}` };
    });
  }, [palette, season, blocked]);

  const flowers = useMemo(() => {
    if (season !== "spring" && season !== "summer") return [];
    const colors = season === "spring" ? ["#f4f1e8", "#f2d34b", "#b9a3e3", "#f4f1e8"] : ["#f4f1e8", "#f2d34b", "#7b6fd6", "#e86a8a", "#f4f1e8"];
    return scatter(FLOWER_COUNT, 2000, blocked).map(([x, z], i) => ({
      x,
      y: GROUND_Y,
      z,
      rotY: 0,
      scale: [1, 0.7 + rand(i + 2100) * 0.6, 1] as [number, number, number],
      color: colors[i % colors.length],
    }));
  }, [season, blocked]);

  const leaves = useMemo(() => {
    if (season !== "autumn") return [];
    const colors = ["#d9822b", "#e3b23c", "#b8452a", "#c96f2d", ...palette.leaves];
    return scatter(LEAF_COUNT, 4000, blocked).map(([x, z], i) => ({
      x,
      y: GROUND_Y + 0.004,
      z,
      rotY: rand(i + 4100) * 6.28,
      tilt: (rand(i + 4110) - 0.5) * 0.4,
      scale: [1, 1, 1] as [number, number, number],
      color: colors[i % colors.length],
    }));
  }, [season, palette, blocked]);

  const flowerHeads = useMemo(() => flowers.map((f) => ({ ...f, y: f.y + 0.08 * f.scale[1], scale: [1, 1, 1] as [number, number, number] })), [flowers]);
  const stems = useMemo(() => flowers.map((f) => ({ ...f, color: "#4f7f36" })), [flowers]);

  return (
    <group>
      {grass.length > 0 && <Instances geometry={tuft} items={grass} material={<meshLambertMaterial flatShading />} />}
      {flowers.length > 0 && (
        <>
          <Instances geometry={stem} items={stems} material={<meshLambertMaterial />} />
          <Instances geometry={flowerHead} items={flowerHeads} material={<meshLambertMaterial flatShading />} />
        </>
      )}
      {leaves.length > 0 && <Instances geometry={leaf} items={leaves} material={<meshLambertMaterial />} />}
      <KitMesh build={(kit) => buildPaths(kit, hasSauna ? [...STEPPING_PATHS, SAUNA_PATH] : STEPPING_PATHS, palette.snow)} deps={[hasSauna, palette.snow]} />
    </group>
  );
};
