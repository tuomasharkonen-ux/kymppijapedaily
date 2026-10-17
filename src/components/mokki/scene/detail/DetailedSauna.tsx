import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { C } from "../../palette";
import { PIECE_LAYOUT, SAUNA_CHIMNEY_TOP } from "../Pieces";
import { Block, Burst, GableFill, GableRoof, Smoke } from "../primitives";
import { Kit } from "./kit";

type Vec3 = [number, number, number];

// Same log sauna as the overview model, with a doorway on the lake side and a proper löylyhuone inside.
export const SAUNA_DIMS = { w: 1.45, d: 1.35, h: 1.05, base: 0.12, log: 0.075 };
const { w: SW, d: SD, h: SH, base: B, log: R } = SAUNA_DIMS;
/** Doorway in the east wall, along z (sauna-local). */
export const SAUNA_DOOR = { z0: -0.08, z1: 0.48 };
const DOOR_TOP = B + 0.975;
const FLOOR = B + 0.03;
const BENCH = "#e0c08f";
const BENCH_DARK = "#c49a64";
const PANEL = "#d9b27a";
const KIUAS: Vec3 = [-0.45, 0, -0.45];

function buildSauna(kit: Kit, snow: boolean) {
  kit.box([SW + 0.2, B, SD + 0.2], [0, B / 2, 0], C.rockDark);

  // Log courses with crossed corners; the east wall is split around the doorway
  const courses = Math.round(SH / (R * 2));
  for (let i = 0; i < courses; i++) {
    const y = B + R + i * R * 2;
    const col = i % 2 === 0 ? C.log : C.logDark;
    const lx = SW + R * 4;
    const lz = SD + R * 4;
    for (const z of [SD / 2, -SD / 2]) kit.cyl(R, R, lx, 7, [0, y, z], col, [0, 0, Math.PI / 2]);
    kit.cyl(R, R, lz, 7, [-SW / 2, y + R, 0], col, [Math.PI / 2, 0, 0]);
    if (y < DOOR_TOP - R) {
      const a0 = -lz / 2;
      const b1 = lz / 2;
      kit.cyl(R, R, SAUNA_DOOR.z0 - a0, 7, [SW / 2, y + R, (a0 + SAUNA_DOOR.z0) / 2], col, [Math.PI / 2, 0, 0]);
      kit.cyl(R, R, b1 - SAUNA_DOOR.z1, 7, [SW / 2, y + R, (SAUNA_DOOR.z1 + b1) / 2], col, [Math.PI / 2, 0, 0]);
    } else {
      kit.cyl(R, R, lz, 7, [SW / 2, y + R, 0], col, [Math.PI / 2, 0, 0]);
    }
  }
  // Door frame and the door, swung open towards the lake
  const ox = SW / 2 + R + 0.01;
  kit.span([SW / 2 - R, B, SAUNA_DOOR.z0 - 0.04], [ox, DOOR_TOP, SAUNA_DOOR.z0], C.logEnd);
  kit.span([SW / 2 - R, B, SAUNA_DOOR.z1], [ox, DOOR_TOP, SAUNA_DOOR.z1 + 0.04], C.logEnd);
  kit.span([SW / 2 - R, DOOR_TOP - 0.04, SAUNA_DOOR.z0 - 0.04], [ox, DOOR_TOP, SAUNA_DOOR.z1 + 0.04], C.logEnd);
  kit.at([ox + 0.26, B, SAUNA_DOOR.z1 + 0.04], undefined, () => {
    kit.box([0.5, 0.86, 0.04], [0, 0.45, 0], "#6e4826");
    for (const y of [0.2, 0.7]) kit.box([0.46, 0.06, 0.05], [0, y, 0], "#5a3a1e");
    kit.box([0.05, 0.04, 0.06], [-0.2, 0.47, 0.03], C.metal);
  });

  // Gable roof (ridge along z), with a board ceiling under it
  kit.span([-SW / 2 + R, B + SH - 0.06, -SD / 2 + R], [SW / 2 - R, B + SH - 0.03, SD / 2 - R], "#c9a87a");

  // Stove pipe through the roof
  kit.cyl(0.07, 0.07, 0.75, 8, [KIUAS[0], B + SH + 0.75, KIUAS[2]], C.metal);
  kit.cyl(0.11, 0.11, 0.05, 8, [KIUAS[0], B + SH + 1.12, KIUAS[2]], C.metal);
  kit.cyl(0.05, 0.05, SH - 0.5, 8, [KIUAS[0], B + 0.48 + (SH - 0.5) / 2, KIUAS[2]], "#2b2b2e");

  // Small window on the south wall (glows when the sauna is warm)
  kit.box([0.44, 0.04, 0.06], [0.1, B + 0.59, SD / 2 + 0.1], C.logEnd);

  // Panelling inside (hides the gaps between the round logs)
  const IN = SW / 2 - R;
  const IZ = SD / 2 - R;
  const CEIL = B + SH - 0.06;
  kit.span([-IN, FLOOR, -IZ], [-IN + 0.015, CEIL, IZ], PANEL);
  kit.span([-IN, FLOOR, -IZ], [IN, CEIL, -IZ + 0.015], PANEL);
  kit.span([-IN, FLOOR, IZ - 0.015], [IN, CEIL, IZ], PANEL);
  kit.span([IN - 0.015, FLOOR, -IZ], [IN, CEIL, SAUNA_DOOR.z0], PANEL);
  kit.span([IN - 0.015, FLOOR, SAUNA_DOOR.z1], [IN, CEIL, IZ], PANEL);
  kit.span([IN - 0.015, DOOR_TOP, SAUNA_DOOR.z0], [IN, CEIL, SAUNA_DOOR.z1], PANEL);
  for (const z of [-0.3, 0.0, 0.3]) kit.span([-IN + 0.015, FLOOR, z - 0.004], [-IN + 0.018, CEIL, z + 0.004], BENCH_DARK);
  for (const x of [-0.3, 0.0, 0.3]) kit.span([x - 0.004, FLOOR, -IZ + 0.015], [x + 0.004, CEIL, -IZ + 0.018], BENCH_DARK);

  // Floor: duckboards
  kit.span([-SW / 2 + R, B, -SD / 2 + R], [SW / 2 - R, FLOOR - 0.01, SD / 2 - R], "#7b6248");
  for (let x = -SW / 2 + R + 0.04; x < SW / 2 - R; x += 0.09) kit.span([x - 0.03, FLOOR - 0.01, -SD / 2 + R], [x + 0.03, FLOOR, SD / 2 - R], "#a8865c");

  // Lauteet along the west wall: high bench, step, backrest boards
  const zA = -0.22;
  const zB = 0.6;
  kit.span([-0.65, B + 0.42, zA], [-0.25, B + 0.46, zB], BENCH);
  for (let x = -0.62; x < -0.26; x += 0.08) kit.span([x, B + 0.46, zA], [x + 0.05, B + 0.462, zB], BENCH_DARK);
  kit.span([-0.27, FLOOR, zA], [-0.25, B + 0.42, zB], BENCH_DARK);
  kit.span([-0.25, B + 0.22, zA], [-0.05, B + 0.25, zB], BENCH);
  kit.span([-0.07, FLOOR, zA], [-0.05, B + 0.22, zB], BENCH_DARK);
  for (const z of [zA + 0.02, zB - 0.02]) kit.span([-0.65, FLOOR, z - 0.02], [-0.05, B + 0.42, z + 0.02], BENCH_DARK);
  for (let y = B + 0.56; y < B + 0.82; y += 0.08) kit.span([-0.635, y, zA], [-0.615, y + 0.05, zB], BENCH);
  // Towel, kiulu and kauha, vihta on the wall, thermometer
  kit.span([-0.6, B + 0.46, 0.25], [-0.3, B + 0.47, 0.45], "#5b8fd1");
  kit.cyl(0.06, 0.05, 0.08, 10, [-0.15, B + 0.29, 0.38], C.kiulu);
  for (const y of [0.27, 0.31]) kit.cyl(0.062, 0.062, 0.008, 10, [-0.15, B + y, 0.38], C.metal);
  kit.box([0.015, 0.015, 0.22], [-0.15, B + 0.36, 0.3], C.logEnd, [0.6, 0, 0]);
  kit.cyl(0.02, 0.02, 0.02, 6, [-0.15, B + 0.3, 0.2], C.logEnd);
  kit.box([0.012, 0.18, 0.012], [0.3, B + 0.78, -SD / 2 + R + 0.02], C.logDark);
  kit.lump([0.08, 0.13, 0.05], [0.3, B + 0.62, -SD / 2 + R + 0.04], "#5f8c43");
  kit.box([0.012, 0.12, 0.04], [-0.628, B + 0.9, 0.0], C.white);
  kit.box([0.014, 0.08, 0.01], [-0.628, B + 0.89, 0.0], "#c0392b");

  // Kiuas: iron stove with a basket of stones, a little guard rail
  kit.at(KIUAS, undefined, () => {
    kit.span([-0.15, FLOOR, -0.15], [0.15, B + 0.38, 0.15], "#3a3c40");
    kit.span([-0.17, B + 0.38, -0.17], [0.17, B + 0.42, 0.17], "#2b2b2e");
    for (let i = 0; i < 14; i++) {
      const a = i * 2.39;
      const r = 0.05 + (i % 3) * 0.04;
      kit.lump([0.045, 0.035, 0.04], [Math.cos(a) * r, B + 0.45 + (i % 4) * 0.025, Math.sin(a) * r], i % 3 ? "#6f6a66" : "#8a847e", [i, i * 0.7, 0]);
    }
    kit.span([0.148, B + 0.1, -0.08], [0.155, B + 0.24, 0.08], "#1f2023");
    kit.box([0.02, 0.02, 0.06], [0.16, B + 0.27, 0], C.logEnd);
  });
  kit.span([-0.25, B + 0.3, -0.62], [-0.23, B + 0.34, -0.25], BENCH_DARK);
  kit.span([-0.65, B + 0.3, -0.27], [-0.23, B + 0.34, -0.25], BENCH_DARK);

  // Wall lamp with a wooden shade by the door
  kit.span([SW / 2 - R - 0.045, B + 0.74, -0.42], [SW / 2 - R - 0.015, B + 0.86, -0.26], BENCH_DARK);

  // Outside: the bench with a towel, a water barrel
  kit.box([0.12, 0.05, 0.7], [SW / 2 + 0.3, B + 0.3, -0.35], C.logEnd);
  kit.box([0.05, 0.28, 0.05], [SW / 2 + 0.3, B + 0.15, -0.65], C.logDark);
  kit.box([0.05, 0.28, 0.05], [SW / 2 + 0.3, B + 0.15, -0.05], C.logDark);
  kit.box([0.13, 0.015, 0.26], [SW / 2 + 0.3, B + 0.335, -0.45], "#5b8fd1");
  kit.cyl(0.13, 0.12, 0.3, 10, [SW / 2 + 0.25, 0.15, -SD / 2 - 0.05], C.logDark);
  kit.cyl(0.132, 0.132, 0.02, 10, [SW / 2 + 0.25, 0.09, -SD / 2 - 0.05], C.metal);
  kit.cyl(0.132, 0.132, 0.02, 10, [SW / 2 + 0.25, 0.24, -SD / 2 - 0.05], C.metal);
  if (snow) kit.box([0.12, 0.03, 0.66], [SW / 2 + 0.3, B + 0.34, -0.35], C.snow);
}

const KiuasFire = ({ on, lightsOn }: { on: boolean; lightsOn: boolean }) => {
  const light = useRef<THREE.PointLight>(null);
  useFrame(({ clock }) => {
    if (!light.current) return;
    const t = clock.getElapsedTime();
    light.current.intensity = (lightsOn ? 1.3 : 0.7) + (on ? 0.35 + Math.sin(t * 8) * 0.12 + Math.sin(t * 19) * 0.08 : 0);
  });
  return (
    <>
      {on && <Block size={[0.01, 0.12, 0.14]} position={[KIUAS[0] + 0.16, B + 0.17, KIUAS[2]]} color="#ff9a3c" emissive="#ff7a1c" emissiveIntensity={1.8} />}
      <pointLight ref={light} position={[0.15, B + 0.75, -0.1]} color="#ffb06a" distance={2.2} decay={2} intensity={0.7} />
    </>
  );
};

export const DetailedSauna = ({ lightsOn, snow, smoke, loylyKey }: { lightsOn: boolean; snow: boolean; smoke: boolean; loylyKey: number }) => {
  const geometry = useMemo(() => {
    const kit = new Kit();
    buildSauna(kit, snow);
    return kit.build();
  }, [snow]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  const warm = lightsOn || smoke;
  const [cx, cy, cz] = PIECE_LAYOUT.sauna.center;

  return (
    <group>
      <group position={[cx, cy, cz]}>
        <mesh geometry={geometry}>
          <meshStandardMaterial vertexColors flatShading roughness={0.85} />
        </mesh>
        <group position={[0, B + SH, 0]} rotation={[0, Math.PI / 2, 0]}>
          <GableFill width={SD} depth={SW} rise={0.62} color={C.logDark} />
          <GableRoof width={SD} depth={SW} rise={0.66} overhang={0.22} snow={snow} color="#57504a" />
        </group>
        {/* Window, outside and in */}
        {[SD / 2 + 0.09, SD / 2 - R - 0.025].map((z) => (
          <Block
            key={z}
            size={[0.36, 0.22, 0.02]}
            position={[0.1, B + 0.72, z]}
            color={warm ? C.glow : C.glass}
            emissive={warm ? "#ff9a3c" : undefined}
            emissiveIntensity={lightsOn ? 1.6 : smoke ? 0.5 : 0}
          />
        ))}
        <Block size={[0.025, 0.08, 0.12]} position={[SW / 2 - R - 0.06, B + 0.78, -0.34]} color="#fff1d0" emissive="#ffc070" emissiveIntensity={warm ? 1.4 : 0.5} />
        <KiuasFire on={smoke} lightsOn={lightsOn} />
        {/* Löyly thrown on the stones */}
        <Burst position={[KIUAS[0], B + 0.5, KIUAS[2]]} trigger={loylyKey} color="#ffffff" count={14} radius={0.35} rise={0.5} duration={2.2} size={0.25} />
        {lightsOn && <pointLight color="#ff9a3c" intensity={1.5} distance={2.5} decay={2} position={[0.1, B + 0.7, SD / 2 + 0.5]} />}
      </group>
      {smoke && <Smoke position={SAUNA_CHIMNEY_TOP} count={11} rise={2.2} />}
      <Burst position={SAUNA_CHIMNEY_TOP} trigger={loylyKey} color="#ffffff" count={22} radius={1.3} rise={1.8} duration={2.6} size={0.5} />
    </group>
  );
};
