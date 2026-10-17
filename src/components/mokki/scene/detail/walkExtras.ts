import { CABIN } from "../Cabin";
import { PIECE_LAYOUT } from "../Pieces";
import { box, circle, seg, type Collider, type WalkExtras } from "../walk";
import { CABIN_DOOR, CABIN_FLOOR } from "./DetailedCabin";
import { SAUNA_DIMS, SAUNA_DOOR, SAUNA_OUTSIDE } from "./DetailedSauna";

// Walls, doorways and furniture of the detailed models, in world x/z.
const [CX, CY, CZ] = CABIN.position;
const HW = CABIN.width / 2;
const HD = CABIN.depth / 2;
const DOOR0 = CABIN_DOOR.x - CABIN_DOOR.width / 2;
const DOOR1 = CABIN_DOOR.x + CABIN_DOOR.width / 2;

/** Cabin-local helpers → world. */
const cSeg = (ax: number, az: number, bx: number, bz: number, r: number) => seg(CX + ax, CZ + az, CX + bx, CZ + bz, r);
const cBox = (x: number, z: number, w: number, d: number) => box(CX + x, CZ + z, w, d);
const cCircle = (x: number, z: number, r: number) => circle(CX + x, CZ + z, r);

const CABIN_COLLIDERS: Collider[] = [
  // Walls, with the doorway left open
  cSeg(-HW, HD - 0.04, DOOR0, HD - 0.04, 0.045),
  cSeg(DOOR1, HD - 0.04, HW, HD - 0.04, 0.045),
  cSeg(-HW, -HD + 0.04, HW, -HD + 0.04, 0.045),
  cSeg(-HW + 0.04, -HD, -HW + 0.04, HD, 0.045),
  cSeg(HW - 0.04, -HD, HW - 0.04, HD, 0.045),
  // The open door leaf
  cSeg(DOOR1 - 0.03, HD - 0.1, DOOR1 - 0.03, HD - 0.58, 0.025),
  // Oven, firewood, kitchen counter, bucket
  cBox(0.75, -0.62, 0.64, 0.68),
  cBox(1.2, -0.65, 0.26, 0.52),
  cBox(1.18, 0.15, 0.3, 0.94),
  cCircle(1.17, 0.8, 0.08),
  // Table with its benches, bunk bed, rocking chair, radio table
  cBox(-0.85, 0.54, 0.82, 0.76),
  cBox(-1.03, -0.49, 0.62, 0.9),
  cCircle(-0.05, -0.6, 0.2),
  cCircle(0.3, -0.75, 0.09),
];

const [SX, , SZ] = PIECE_LAYOUT.sauna.center;
const { w: SW, d: SD, base: SB, log: SR } = SAUNA_DIMS;
const sSeg = (ax: number, az: number, bx: number, bz: number, r: number) => seg(SX + ax, SZ + az, SX + bx, SZ + bz, r);

const SAUNA_COLLIDERS: Collider[] = [
  sSeg(-SW / 2 - 0.05, -SD / 2, SW / 2 + 0.05, -SD / 2, SR + 0.01),
  sSeg(-SW / 2 - 0.05, SD / 2, SW / 2 + 0.05, SD / 2, SR + 0.01),
  sSeg(-SW / 2, -SD / 2 - 0.05, -SW / 2, SD / 2 + 0.05, SR + 0.01),
  sSeg(SW / 2, -SD / 2 - 0.05, SW / 2, SAUNA_DOOR.z0 - 0.02, SR),
  sSeg(SW / 2, SAUNA_DOOR.z1 + 0.02, SW / 2, SD / 2 + 0.05, SR),
  // Door leaf (open flat against the wall), lauteet, kiuas, outside bench and barrel
  sSeg(SW / 2 + SR + 0.035, SAUNA_DOOR.z1 + 0.05, SW / 2 + SR + 0.035, SAUNA_DOOR.z1 + 0.55, 0.03),
  box(SX - 0.35, SZ + 0.19, 0.62, 0.84),
  box(SX - 0.45, SZ - 0.45, 0.4, 0.4),
  sSeg(SAUNA_OUTSIDE.benchX, -0.68, SAUNA_OUTSIDE.benchX, -0.02, 0.06),
  circle(SX + SAUNA_OUTSIDE.barrel[0], SZ + SAUNA_OUTSIDE.barrel[1], 0.13),
];

export const WALK_EXTRAS: WalkExtras = {
  cabin: CABIN_COLLIDERS,
  cabinDoor: [cSeg(DOOR0, HD - 0.04, DOOR1, HD - 0.04, 0.045)],
  sauna: SAUNA_COLLIDERS,
  floor: (x, z, sauna) => {
    if (Math.abs(x - CX) < HW && Math.abs(z - CZ) < HD) return CY + CABIN_FLOOR;
    if (sauna && Math.abs(x - SX) < SW / 2 && Math.abs(z - SZ) < SD / 2) return PIECE_LAYOUT.sauna.center[1] + SB + 0.03;
    return null;
  },
};
