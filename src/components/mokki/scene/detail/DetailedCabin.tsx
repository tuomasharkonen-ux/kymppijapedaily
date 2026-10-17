import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { C } from "../../palette";
import { CABIN } from "../Cabin";
import { Block, GableRoof } from "../primitives";
import { CoffeePot, CuckooClock, DoorNotepad, LampSwitch, LostDie, OvenDoor, Radio, RockingChair } from "./CabinToys";
import type { CabinVisit } from "./types";
import { Kit, wallWithOpenings } from "./kit";

type Vec3 = [number, number, number];

// Same footprint and silhouette as the overview Cabin, but hollow: walls with real openings, an open door
// and a furnished tupa inside. Everything static is merged into two meshes (solid + window glass).
const { width: W, depth: D, foundation: F, wallHeight: WH, roofRise: RISE, porchDepth: PD } = CABIN;
const FRONT = D / 2;
const T = 0.08; // wall thickness
export const CABIN_FLOOR = F + 0.06; // local floor top (= porch deck top)
const FL = CABIN_FLOOR;
const TOP = F + WH;
const WIN_Y = WH * 0.58; // window centre above the wall base

const PANEL = "#d2a96f";
const PANEL_DARK = "#b98d55";
const FLOOR = "#c39762";
const CURTAIN = "#efe3c6";

/** Doorway in the front wall (cabin-local x). */
export const CABIN_DOOR = { x: 0.55, width: 0.56 };

interface WindowSpec {
  x: number;
  w: number;
  h: number;
}

/** Window frame, mullions, sills and curtains, drawn in a wall's local frame (outward = +z). */
function windowParts(kit: Kit, glass: Kit, { x, w, h }: WindowSpec, y: number) {
  const o = T / 2;
  const x0 = x - w / 2;
  const x1 = x + w / 2;
  const y0 = y - h / 2;
  const y1 = y + h / 2;
  // Outer trim
  kit.span([x0 - 0.05, y0 - 0.05, o - 0.005], [x1 + 0.05, y0, o + 0.03], C.trim);
  kit.span([x0 - 0.05, y1, o - 0.005], [x1 + 0.05, y1 + 0.05, o + 0.03], C.trim);
  kit.span([x0 - 0.05, y0, o - 0.005], [x0, y1, o + 0.03], C.trim);
  kit.span([x1, y0, o - 0.005], [x1 + 0.05, y1, o + 0.03], C.trim);
  // Cross mullions
  kit.span([x - 0.014, y0, -0.014], [x + 0.014, y1, 0.014], C.trim);
  kit.span([x0, y - 0.014, -0.014], [x1, y + 0.014, 0.014], C.trim);
  // Sills, outside and in
  kit.span([x0 - 0.08, y0 - 0.09, o], [x1 + 0.08, y0 - 0.05, o + 0.09], C.trim);
  kit.span([x0 - 0.03, y0 - 0.03, -o - 0.07], [x1 + 0.03, y0, -o + 0.001], PANEL_DARK);
  // Curtains on a rod
  kit.span([x0 - 0.07, y0 + 0.03, -o - 0.035], [x0 + 0.05, y1 + 0.06, -o - 0.02], CURTAIN);
  kit.span([x1 - 0.05, y0 + 0.03, -o - 0.035], [x1 + 0.07, y1 + 0.06, -o - 0.02], CURTAIN);
  kit.span([x0 - 0.1, y1 + 0.06, -o - 0.045], [x1 + 0.1, y1 + 0.075, -o - 0.015], C.post);
  glass.span([x0, y0, -0.004], [x1, y1, 0.004], "#9fc4dc");
}

/**
 * One wall in its own frame: centred on x = 0, from the wall base (y = 0) up, outward = +z.
 * Red board-and-batten outside, wood panelling inside.
 */
function wall(
  kit: Kit,
  glass: Kit,
  at: Vec3,
  rotY: number,
  length: number,
  windows: WindowSpec[],
  door?: { x: number; width: number; bottom: number; top: number },
) {
  const openings = [
    ...windows.map((w) => ({ x: w.x, width: w.w, bottom: WIN_Y - w.h / 2, top: WIN_Y + w.h / 2 })),
    ...(door ? [door] : []),
  ];
  kit.push(at, [0, rotY, 0]);
  glass.push(at, [0, rotY, 0]);
  kit.push([0, 0, T / 2 - 0.025]);
  wallWithOpenings(kit, length, WH, 0.05, openings, C.punamulta);
  kit.pop();
  kit.push([0, 0, -T / 2 + 0.015]);
  wallWithOpenings(kit, length - 0.1, WH, 0.03, openings, PANEL);
  kit.pop();
  // Battens outside, skipping the openings
  const count = Math.round((length - 0.2) / 0.215);
  for (let i = 0; i <= count; i++) {
    const bx = -length / 2 + 0.1 + (i * (length - 0.2)) / count;
    if (openings.some((op) => Math.abs(bx - op.x) < op.width / 2 + 0.07)) continue;
    kit.box([0.035, WH, 0.02], [bx, WH / 2, T / 2 + 0.01], C.punamultaDark);
  }
  // Skirting board inside
  const skirtSegs: [number, number][] = [];
  let cursor = -length / 2 + 0.05;
  if (door) {
    skirtSegs.push([cursor, door.x - door.width / 2]);
    cursor = door.x + door.width / 2;
  }
  skirtSegs.push([cursor, length / 2 - 0.05]);
  for (const [a, b] of skirtSegs) kit.span([a, FL - F, -T / 2 - 0.012], [b, FL - F + 0.05, -T / 2 + 0.001], PANEL_DARK);
  windows.forEach((w) => windowParts(kit, glass, w, WIN_Y));
  kit.pop();
  glass.pop();
}

function buildShell(kit: Kit, glass: Kit, snow: boolean, doorClosed: boolean) {
  // Stone foundation and floor
  kit.box([W + 0.08, F, D + 0.08], [0, F / 2, 0], C.rockDark);
  kit.span([-W / 2 + 0.05, F, -FRONT + 0.05], [W / 2 - 0.05, FL, FRONT - 0.05], FLOOR);
  for (let z = -FRONT + 0.14; z < FRONT - 0.08; z += 0.13) kit.span([-W / 2 + 0.06, FL, z - 0.005], [W / 2 - 0.06, FL + 0.003, z + 0.005], C.plankDark);

  const door = { x: CABIN_DOOR.x, width: CABIN_DOOR.width, bottom: FL - F, top: 0.94 };
  wall(kit, glass, [0, F, FRONT - T / 2], 0, W, [{ x: -0.85, w: 0.52, h: 0.46 }, { x: 1.15, w: 0.36, h: 0.46 }], door);
  wall(kit, glass, [W / 2 - T / 2, F, 0], Math.PI / 2, D, [{ x: 0.2, w: 0.52, h: 0.46 }]);
  wall(kit, glass, [0, F, -FRONT + T / 2], Math.PI, W, []);
  wall(kit, glass, [-W / 2 + T / 2, F, 0], -Math.PI / 2, D, []);

  // Corner boards
  for (const [x, z] of [
    [W / 2, FRONT],
    [-W / 2, FRONT],
    [W / 2, -FRONT],
    [-W / 2, -FRONT],
  ])
    kit.box([0.1, WH, 0.1], [x, F + WH / 2, z], C.trim);

  // Door frame, outside and in
  const dx0 = CABIN_DOOR.x - CABIN_DOOR.width / 2;
  const dx1 = CABIN_DOOR.x + CABIN_DOOR.width / 2;
  kit.span([dx0 - 0.05, FL, FRONT - 0.005], [dx0, F + 0.94, FRONT + 0.03], C.trim);
  kit.span([dx1, FL, FRONT - 0.005], [dx1 + 0.05, F + 0.94, FRONT + 0.03], C.trim);
  kit.span([dx0 - 0.05, F + 0.94, FRONT - 0.005], [dx1 + 0.05, F + 0.99, FRONT + 0.03], C.trim);
  kit.span([dx0 - 0.04, FL, FRONT - T - 0.015], [dx0, F + 0.94, FRONT - T + 0.001], PANEL_DARK);
  kit.span([dx1, FL, FRONT - T - 0.015], [dx1 + 0.04, F + 0.94, FRONT - T + 0.001], PANEL_DARK);
  kit.span([dx0 - 0.04, F + 0.94, FRONT - T - 0.015], [dx1 + 0.04, F + 0.98, FRONT - T + 0.001], PANEL_DARK);
  if (doorClosed) {
    // Visitors find the door shut (with a notepad on it, see DoorNotepad)
    kit.at([CABIN_DOOR.x, FL, FRONT - T / 2], undefined, () => {
      kit.box([CABIN_DOOR.width - 0.01, 0.86, 0.05], [0, 0.43, 0], "#3d5a45");
      for (const y of [0.18, 0.62]) kit.box([CABIN_DOOR.width - 0.12, 0.22, 0.06], [0, y, 0], "#2f4636");
      kit.box([0.28, 0.16, 0.065], [0, 0.62, 0], C.glass);
      kit.box([0.025, 0.08, 0.03], [-0.2, 0.44, 0.04], C.coin);
      kit.box([0.06, 0.02, 0.02], [-0.2, 0.47, 0.055], C.coin);
    });
  } else {
    // The door itself, swung open against the inside wall
    kit.at([dx1 - 0.03, FL, FRONT - T - 0.27], undefined, () => {
      kit.box([0.04, 0.86, 0.5], [0, 0.44, 0], "#3d5a45");
      kit.box([0.05, 0.2, 0.28], [0, 0.62, 0], "#2f4636");
      kit.box([0.055, 0.14, 0.2], [0, 0.62, 0], C.glass);
      kit.box([0.08, 0.025, 0.025], [0, 0.44, -0.2], C.coin);
    });
  }

  // Ceiling and beams
  kit.span([-W / 2 + 0.05, TOP - 0.03, -FRONT + 0.05], [W / 2 - 0.05, TOP, FRONT - 0.05], "#dcbb86");
  for (const x of [-0.95, -0.2, 0.45, 1.1]) kit.span([x - 0.035, TOP - 0.1, -FRONT + 0.05], [x + 0.035, TOP - 0.03, FRONT - 0.05], PANEL_DARK);

  // Gables, fascia and rake boards (the roof slabs are drawn separately for the snow layer)
  const shape = new THREE.Shape();
  shape.moveTo(-D / 2, 0);
  shape.lineTo(D / 2, 0);
  shape.lineTo(0, RISE);
  shape.closePath();
  const gable = new THREE.ExtrudeGeometry(shape, { depth: W, bevelEnabled: false });
  gable.translate(0, 0, -W / 2);
  gable.rotateY(Math.PI / 2);
  kit.add(gable, C.punamulta, [0, TOP, 0]);
  kit.box([W + 0.3, 0.07, 0.06], [0, TOP - 0.02, FRONT + 0.02], C.trim);
  kit.box([W + 0.3, 0.07, 0.06], [0, TOP - 0.02, -FRONT - 0.02], C.trim);
  const angle = Math.atan2(RISE, D / 2);
  const rake = Math.sqrt(RISE * RISE + (D / 2) * (D / 2)) + 0.2;
  for (const side of [1, -1])
    for (const slope of [1, -1]) kit.box([0.05, 0.08, rake], [side * (W / 2 + 0.03), TOP + RISE / 2, (slope * D) / 4], C.trim, [slope * angle, 0, 0]);
  // Attic window on the east gable
  kit.box([0.04, 0.34, 0.38], [W / 2 + 0.02, TOP + RISE * 0.38, 0], C.trim);
  kit.box([0.05, 0.24, 0.28], [W / 2 + 0.025, TOP + RISE * 0.38, 0], C.glass);

  // Brick chimney (same spot as the overview model, so the smoke lines up)
  kit.at([0.75, TOP + RISE * 0.55, -0.3], undefined, () => {
    kit.box([0.3, 0.95, 0.3], [0, 0.25, 0], C.brick);
    for (let i = 0; i < 4; i++) kit.box([0.31, 0.012, 0.31], [0, -0.1 + i * 0.2, 0], "#7d3a28");
    kit.box([0.38, 0.07, 0.38], [0, 0.74, 0], C.metal);
    if (snow) kit.box([0.32, 0.05, 0.32], [0, 0.8, 0], C.snow);
  });
}

function buildPorch(kit: Kit, snow: boolean) {
  kit.at([0, 0, FRONT], undefined, () => {
    kit.box([W + 0.1, 0.08, PD], [0, F + 0.02, PD / 2], C.plank);
    for (let i = 0; i < 8; i++) kit.box([W + 0.1, 0.02, 0.012], [0, F + 0.065, 0.06 + i * 0.12], C.plankDark);
    for (const x of [-1.4, -0.85, -0.3, 1.4]) kit.box([0.06, 0.42, 0.06], [x, F + 0.27, PD - 0.03], C.trim);
    kit.box([1.16, 0.05, 0.06], [-0.85, F + 0.47, PD - 0.03], C.trim);
    kit.box([0.06, 0.05, PD], [-1.42, F + 0.47, PD / 2], C.trim);
    kit.box([0.06, 0.05, PD], [1.42, F + 0.47, PD / 2], C.trim);
    kit.box([0.06, 0.42, 0.06], [1.42, F + 0.27, 0.05], C.trim);
    // Balusters under the rails
    for (let x = -1.32; x < -0.32; x += 0.11) kit.box([0.025, 0.36, 0.025], [x, F + 0.26, PD - 0.03], C.trim);
    for (const sx of [-1.42, 1.42]) for (let z = 0.12; z < PD - 0.08; z += 0.11) kit.box([0.025, 0.36, 0.025], [sx, F + 0.26, z], C.trim);
    // Steps
    kit.box([0.7, 0.08, 0.22], [0.55, F - 0.05, PD + 0.1], C.plank);
    kit.box([0.7, 0.08, 0.22], [0.55, F - 0.13, PD + 0.3], C.plankDark);
    // Bench along the wall
    kit.box([0.8, 0.05, 0.22], [-0.9, F + 0.3, 0.16], C.plankDark);
    kit.box([0.05, 0.25, 0.2], [-1.25, F + 0.16, 0.16], C.plankDark);
    kit.box([0.05, 0.25, 0.2], [-0.55, F + 0.16, 0.16], C.plankDark);
    kit.box([0.22, 0.03, 0.16], [-1.08, F + 0.34, 0.16], "#c75b4a");
    // Door mat, firewood basket, boots
    kit.box([0.5, 0.012, 0.32], [0.55, F + 0.071, 0.3], "#b5503a");
    kit.cyl(0.1, 0.09, 0.16, 8, [1.25, F + 0.14, 0.2], C.logDark);
    for (let i = 0; i < 4; i++) kit.cyl(0.025, 0.025, 0.2, 5, [1.21 + (i % 2) * 0.07, F + 0.24 + Math.floor(i / 2) * 0.04, 0.2], C.logEnd, [Math.PI / 2, 0, 0]);
    kit.box([0.06, 0.08, 0.13], [0.02, F + 0.1, 0.22], "#2d3a2e");
    kit.box([0.06, 0.08, 0.13], [0.1, F + 0.1, 0.24], "#2d3a2e");
    if (snow) kit.box([W + 0.1, 0.04, 0.3], [0, F + 0.08, PD - 0.15], C.snow);
  });
  // Flower box under the small front window
  if (!snow) {
    kit.box([0.44, 0.09, 0.12], [1.15, F + WIN_Y - 0.36, FRONT + 0.07], C.trim);
    for (let i = 0; i < 7; i++) kit.lump([0.035, 0.035, 0.035], [0.98 + i * 0.058, F + WIN_Y - 0.29, FRONT + 0.07 + (i % 2) * 0.03 - 0.015], i % 3 === 0 ? C.white : i % 3 === 1 ? "#d94a5a" : "#5e9a48");
  }
}

function buildInterior(kit: Kit) {
  // --- Leivinuuni: white masonry oven in the back-right corner, flue into the chimney
  kit.span([0.44, FL, -0.95], [1.06, FL + 0.06, -0.29], "#9a9488");
  kit.span([0.46, FL + 0.06, -0.94], [1.04, FL + 0.82, -0.31], "#eee8dc");
  kit.span([0.43, FL + 0.82, -0.95], [1.07, FL + 0.87, -0.28], "#d9d2c4");
  kit.span([0.6, FL + 0.87, -0.7], [0.9, TOP - 0.03, -0.38], "#eee8dc");
  kit.span([0.62, FL + 0.42, -0.312], [0.88, FL + 0.6, -0.295], "#2b2b2e");
  kit.span([0.66, FL + 0.12, -0.312], [0.84, FL + 0.3, -0.295], "#2b2b2e");
  kit.box([0.05, 0.02, 0.02], [0.75, FL + 0.66, -0.29], C.coin);
  kit.box([0.2, 0.02, 0.04], [0.75, FL + 0.38, -0.28], "#3a3a3d");
  // Copper kettle and a pot on top
  kit.cyl(0.05, 0.065, 0.1, 10, [0.55, FL + 0.92, -0.42], "#c27a45");
  kit.box([0.07, 0.015, 0.015], [0.55, FL + 1.0, -0.42], "#8f5530");
  kit.cyl(0.06, 0.06, 0.07, 10, [0.98, FL + 0.905, -0.4], "#3a3c40");

  // --- Firewood stacked between the oven and the east wall
  for (let row = 0; row < 3; row++)
    for (let col = 0; col < 3; col++)
      kit.cyl(0.038, 0.038, 0.46, 6, [1.12 + col * 0.08, FL + 0.04 + row * 0.072, -0.65], (row + col) % 2 ? C.log : C.logDark, [Math.PI / 2, 0, 0]);

  // --- Kitchen corner along the east wall
  kit.span([1.05, FL, -0.3], [1.32, FL + 0.34, 0.6], "#6f8f74");
  for (const z of [0.0, 0.3]) kit.span([1.044, FL + 0.03, z - 0.004], [1.05, FL + 0.31, z + 0.004], "#4f6a54");
  for (const z of [-0.08, 0.22, 0.52]) kit.box([0.015, 0.05, 0.015], [1.04, FL + 0.27, z], C.metal);
  kit.span([1.02, FL + 0.34, -0.32], [1.33, FL + 0.38, 0.62], "#a87a4a");
  kit.span([1.09, FL + 0.375, 0.08], [1.29, FL + 0.385, 0.34], "#b9bec4");
  kit.span([1.11, FL + 0.38, 0.1], [1.27, FL + 0.39, 0.32], "#6e757c");
  kit.cyl(0.008, 0.008, 0.12, 5, [1.29, FL + 0.44, 0.21], C.metal);
  kit.box([0.08, 0.008, 0.008], [1.25, FL + 0.5, 0.21], C.metal);
  // Coffee pot (pannu), cups, bread
  kit.cyl(0.035, 0.05, 0.1, 10, [1.17, FL + 0.43, -0.16], "#c9ccd1");
  kit.cyl(0.012, 0.012, 0.02, 6, [1.17, FL + 0.49, -0.16], "#2b2b2e");
  kit.box([0.012, 0.06, 0.012], [1.21, FL + 0.43, -0.16], "#2b2b2e");
  kit.cyl(0.022, 0.018, 0.035, 8, [1.12, FL + 0.398, -0.04], "#d94a5a");
  kit.cyl(0.022, 0.018, 0.035, 8, [1.2, FL + 0.398, -0.02], C.white);
  kit.box([0.16, 0.015, 0.1], [1.18, FL + 0.388, 0.48], "#c49a64");
  kit.lump([0.07, 0.035, 0.04], [1.18, FL + 0.41, 0.48], "#c98b4a");
  // Open shelf with plates and jam jars
  kit.span([1.2, FL + 0.78, 0.1], [1.33, FL + 0.8, 0.62], "#a87a4a");
  for (let i = 0; i < 3; i++) kit.cyl(0.05, 0.05, 0.01, 12, [1.3, FL + 0.85, 0.16 + i * 0.07], i === 1 ? "#4a6fa5" : C.white, [Math.PI / 2, 0, Math.PI / 2]);
  for (const [z, jam] of [
    [0.4, "#a3202b"],
    [0.48, "#3b3f8f"],
    [0.56, "#d68a2e"],
  ] as [number, string][]) {
    kit.cyl(0.03, 0.03, 0.07, 8, [1.26, FL + 0.835, z], jam);
    kit.cyl(0.032, 0.032, 0.015, 8, [1.26, FL + 0.875, z], "#e8dcc2");
  }
  // Water bucket and a little stool by the door
  kit.cyl(0.07, 0.06, 0.12, 10, [1.17, FL + 0.06, 0.8], "#b9bec4");
  kit.cyl(0.062, 0.062, 0.005, 10, [1.17, FL + 0.115, 0.8], "#5b8fb3");
  kit.box([0.012, 0.012, 0.18], [1.17, FL + 0.13, 0.75], "#8a5a2e", [0.5, 0, 0]);

  // --- Dining table under the front-left window
  kit.span([-1.22, FL + 0.32, 0.36], [-0.48, FL + 0.35, 0.74], C.plank);
  for (const x of [-1.17, -0.53]) for (const z of [0.41, 0.69]) kit.span([x - 0.022, FL, z - 0.022], [x + 0.022, FL + 0.32, z + 0.022], C.plankDark);
  kit.span([-1.0, FL + 0.35, 0.36], [-0.7, FL + 0.354, 0.74], "#d6564a");
  for (let i = 0; i < 6; i++) kit.span([-1.0, FL + 0.354, 0.38 + i * 0.065], [-0.7, FL + 0.356, 0.39 + i * 0.065], C.white);
  // Benches both sides
  for (const z of [0.85, 0.24]) {
    kit.span([-1.25, FL + 0.2, z - 0.06], [-0.45, FL + 0.23, z + 0.06], C.plankDark);
    for (const x of [-1.18, -0.52]) kit.span([x - 0.02, FL, z - 0.05], [x + 0.02, FL + 0.2, z + 0.05], C.post);
  }
  // Coffee, pulla, candle and the day's dice
  for (const [x, z] of [
    [-0.66, 0.46],
    [-1.06, 0.63],
  ]) {
    kit.cyl(0.04, 0.04, 0.006, 10, [x, FL + 0.353, z], C.white);
    kit.cyl(0.024, 0.02, 0.035, 8, [x, FL + 0.373, z], C.white);
    kit.cyl(0.02, 0.02, 0.003, 8, [x, FL + 0.39, z], "#4a2c1a");
  }
  kit.cyl(0.07, 0.07, 0.008, 12, [-0.85, FL + 0.355, 0.5], "#4a6fa5");
  for (let i = 0; i < 4; i++) kit.lump([0.022, 0.016, 0.02], [-0.87 + (i % 2) * 0.04, FL + 0.37, 0.48 + Math.floor(i / 2) * 0.04], "#d8a04a");
  kit.cyl(0.025, 0.03, 0.02, 8, [-0.85, FL + 0.36, 0.66], C.coin);
  kit.cyl(0.01, 0.01, 0.07, 6, [-0.85, FL + 0.405, 0.66], C.white);
  const dice: [number, number, number, string][] = [
    [-0.6, 0.62, 0.3, C.white],
    [-0.56, 0.66, 1.1, C.white],
    [-0.63, 0.68, 0.7, C.white],
    [-0.52, 0.6, 0.2, C.white],
    [-0.58, 0.56, 1.4, "#c0392b"],
  ];
  for (const [x, z, r, col] of dice) {
    kit.box([0.032, 0.032, 0.032], [x, FL + 0.366, z], col, [0, r, 0]);
    kit.box([0.008, 0.002, 0.008], [x, FL + 0.383, z], "#222222", [0, r, 0]);
  }
  kit.box([0.06, 0.012, 0.085], [-0.75, FL + 0.356, 0.42], "#f4efe3", [0, 0.3, 0]);
  // Pendant lamp over the table
  kit.cyl(0.004, 0.004, TOP - (FL + 0.8), 4, [-0.85, (TOP + FL + 0.8) / 2, 0.55], "#222222");
  kit.cyl(0.03, 0.12, 0.09, 12, [-0.85, FL + 0.77, 0.55], "#d9a441");

  // --- Bunk bed along the west wall
  const BX0 = -1.33;
  const BX1 = -0.73;
  const BZ0 = -0.93;
  const BZ1 = -0.05;
  for (const x of [BX0 + 0.03, BX1 - 0.03]) for (const z of [BZ0 + 0.03, BZ1 - 0.03]) kit.span([x - 0.025, FL, z - 0.025], [x + 0.025, FL + 0.84, z + 0.025], C.logDark);
  const bunk = (y: number, quilt: string, stripe: string) => {
    kit.span([BX0, y, BZ0], [BX1, y + 0.05, BZ1], C.logDark);
    kit.span([BX0 + 0.02, y + 0.05, BZ0 + 0.02], [BX1 - 0.02, y + 0.11, BZ1 - 0.02], "#efe8d8");
    kit.span([BX0 + 0.02, y + 0.11, BZ0 + 0.3], [BX1 - 0.01, y + 0.135, BZ1 - 0.01], quilt);
    for (const dz of [0.15, 0.4]) kit.span([BX0 + 0.02, y + 0.135, BZ0 + 0.3 + dz], [BX1 - 0.01, y + 0.137, BZ0 + 0.34 + dz], stripe);
    kit.lump([0.18, 0.035, 0.085], [(BX0 + BX1) / 2, y + 0.14, BZ0 + 0.13], C.white);
  };
  bunk(FL + 0.08, "#b5503a", C.white);
  bunk(FL + 0.5, "#4a6fa5", "#e8dcc2");
  kit.span([BX1 - 0.03, FL + 0.66, BZ0 + 0.05], [BX1, FL + 0.69, BZ0 + 0.55], C.logDark);
  // Ladder at the foot end
  for (const z of [-0.29, -0.12]) kit.span([-0.72, FL, z - 0.015], [-0.69, FL + 0.66, z + 0.015], C.logEnd);
  for (let y = FL + 0.12; y < FL + 0.66; y += 0.13) kit.span([-0.715, y, -0.29], [-0.695, y + 0.02, -0.12], C.logEnd);
  // Shelf with books over the bed
  kit.span([-1.33, FL + 0.95, -0.8], [-1.2, FL + 0.97, -0.2], PANEL_DARK);
  const books = ["#8e2a1e", "#3b5468", "#5e9a48", "#d9a441", "#4a6fa5", "#6b4a2c", "#c75b4a"];
  books.forEach((col, i) => kit.box([0.08, 0.09 + (i % 3) * 0.012, 0.03], [-1.27, FL + 1.02 + (i % 3) * 0.006, -0.75 + i * 0.045], col));

  // --- Radio table and rugs (the rocking chair and the radio's dial are interactive, see CabinToys)
  kit.cyl(0.09, 0.09, 0.02, 10, [0.3, FL + 0.3, -0.75], C.plank);
  kit.cyl(0.015, 0.03, 0.29, 6, [0.3, FL + 0.145, -0.75], C.plankDark);
  kit.box([0.12, 0.08, 0.06], [0.3, FL + 0.35, -0.75], "#6b4a2c");
  kit.box([0.08, 0.035, 0.005], [0.3, FL + 0.36, -0.718], "#e8dcc2");
  kit.box([0.004, 0.08, 0.004], [0.34, FL + 0.43, -0.76], C.metal, [0, 0, -0.3]);
  // Räsymatot: striped rag rugs
  const stripes = ["#c75b4a", "#e8dcc2", "#5b7fa6", "#e8dcc2", "#d9a441", "#e8dcc2"];
  for (let i = 0, z = -0.38; z < 0.22; i++, z += 0.06) kit.span([-0.42, FL, z], [0.36, FL + 0.006, z + 0.06], stripes[i % stripes.length]);
  for (let i = 0, z = 0.12; z < 0.86; i++, z += 0.06) kit.span([0.38, FL, z], [0.74, FL + 0.006, z + 0.06], stripes[(i + 2) % stripes.length]);

  // --- Walls: ryijy rug, clock, paintings, coat hooks
  const BACK = -FRONT + T;
  kit.span([-0.38, FL + 0.42, BACK], [0.24, FL + 0.86, BACK + 0.015], "#7a3b2e");
  for (const [y, h, col] of [
    [0.5, 0.05, "#d9a441"],
    [0.6, 0.08, "#2f6e6a"],
    [0.72, 0.04, "#d9a441"],
    [0.79, 0.04, "#e8dcc2"],
  ] as [number, number, string][])
    kit.span([-0.34, FL + y, BACK + 0.01], [0.2, FL + y + h, BACK + 0.02], col);
  for (let x = -0.36; x < 0.24; x += 0.04) kit.span([x, FL + 0.37, BACK], [x + 0.015, FL + 0.42, BACK + 0.012], "#7a3b2e");
  // Lake painting and a family photo on the west wall
  const WEST = -W / 2 + T;
  kit.span([WEST, FL + 0.55, 0.36], [WEST + 0.02, FL + 0.8, 0.72], "#8a5a2e");
  kit.span([WEST + 0.01, FL + 0.58, 0.39], [WEST + 0.025, FL + 0.66, 0.69], "#4b9dc0");
  kit.span([WEST + 0.01, FL + 0.66, 0.39], [WEST + 0.025, FL + 0.7, 0.69], "#2f5f3c");
  kit.span([WEST + 0.01, FL + 0.7, 0.39], [WEST + 0.025, FL + 0.77, 0.69], "#bfe0f2");
  kit.span([WEST, FL + 0.62, 0.0], [WEST + 0.02, FL + 0.76, 0.12], C.coin);
  kit.span([WEST + 0.01, FL + 0.64, 0.02], [WEST + 0.025, FL + 0.74, 0.1], "#8f8a80");
  // Coat hooks by the door
  const INNER_FRONT = FRONT - T;
  kit.span([-0.32, FL + 0.76, INNER_FRONT - 0.02], [0.2, FL + 0.8, INNER_FRONT], PANEL_DARK);
  kit.box([0.13, 0.32, 0.05], [-0.2, FL + 0.6, INNER_FRONT - 0.04], "#a3202b");
  kit.box([0.12, 0.28, 0.05], [0.05, FL + 0.62, INNER_FRONT - 0.04], "#3b5468");
  kit.lump([0.05, 0.035, 0.05], [0.13, FL + 0.83, INNER_FRONT - 0.04], "#5e9a48");
  kit.box([0.06, 0.09, 0.13], [-0.12, FL + 0.045, INNER_FRONT - 0.09], "#2d2d2d");
  kit.box([0.06, 0.09, 0.13], [-0.04, FL + 0.045, INNER_FRONT - 0.09], "#2d2d2d");
  // Pelargonium on the left window sill, a fern on the right one
  kit.cyl(0.035, 0.025, 0.05, 8, [-0.85, F + WIN_Y - 0.2, INNER_FRONT - 0.035], "#b5653d");
  for (let i = 0; i < 5; i++) kit.lump([0.022, 0.022, 0.022], [-0.88 + (i % 3) * 0.03, F + WIN_Y - 0.15 + (i % 2) * 0.03, INNER_FRONT - 0.035], i % 2 ? "#d94a5a" : "#4f8a3a");
  kit.cyl(0.03, 0.022, 0.045, 8, [1.15, F + WIN_Y - 0.2, INNER_FRONT - 0.035], "#b5653d");
  kit.lump([0.06, 0.05, 0.04], [1.15, F + WIN_Y - 0.13, INNER_FRONT - 0.035], "#4f8a3a");
}

/** Fire glow through the oven door, flickering. */
const OvenFire = ({ on, flare }: { on: boolean; flare: number }) => {
  const light = useRef<THREE.PointLight>(null);
  const flareAt = useRef<{ key: number; t: number }>({ key: 0, t: -100 });
  useFrame(({ clock }) => {
    if (!light.current) return;
    const t = clock.getElapsedTime();
    if (flareAt.current.key !== flare) flareAt.current = { key: flare, t };
    const boost = Math.max(0, 1 - (t - flareAt.current.t) / 2.5) * 2.2;
    light.current.intensity = on ? 0.9 + boost + Math.sin(t * 9) * 0.15 + Math.sin(t * 23) * 0.1 : 0;
  });
  return (
    <>
      {on && <Block size={[0.14, 0.13, 0.01]} position={[0.75, FL + 0.21, -0.29]} color="#ff9a3c" emissive="#ff7a1c" emissiveIntensity={1.6} />}
      <pointLight ref={light} position={[0.75, FL + 0.3, -0.05]} color="#ff8a3c" distance={1.8} decay={2} intensity={0} />
    </>
  );
};

export const DetailedCabin = ({ lightsOn, snow, fire, visit }: { lightsOn: boolean; snow: boolean; fire: boolean; visit?: CabinVisit }) => {
  const [lampOn, setLampOn] = useState(true);
  const [flare, setFlare] = useState(0);
  const { solid, glass } = useMemo(() => {
    const kit = new Kit();
    const glassKit = new Kit();
    buildShell(kit, glassKit, snow, !!visit);
    buildPorch(kit, snow);
    buildInterior(kit);
    return { solid: kit.build(), glass: glassKit.build() };
  }, [snow, !!visit]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(
    () => () => {
      solid.dispose();
      glass.dispose();
    },
    [solid, glass],
  );

  return (
    <group position={CABIN.position}>
      <mesh geometry={solid}>
        <meshStandardMaterial vertexColors flatShading roughness={0.85} />
      </mesh>
      {/* Glass lets the sun in (no shadow) and glows a little in the evening */}
      <mesh geometry={glass} userData={{ noCast: true }}>
        <meshStandardMaterial
          vertexColors
          transparent
          opacity={lightsOn ? 0.5 : 0.28}
          roughness={0.1}
          metalness={0.2}
          emissive={lightsOn ? C.glow : "#000000"}
          emissiveIntensity={lightsOn ? 0.35 : 0}
          depthWrite={false}
        />
      </mesh>
      <group position={[0, F + WH, 0]}>
        <GableRoof width={W} depth={D} rise={RISE + 0.06} overhang={0.28} snow={snow} />
      </group>

      {/* Lamp bulb, candle flame and the lights that make the room cosy */}
      <mesh position={[-0.85, FL + 0.71, 0.55]} userData={{ noShadow: true }}>
        <sphereGeometry args={[0.03, 8, 6]} />
        <meshStandardMaterial color="#fff4d6" emissive="#ffd27a" emissiveIntensity={lampOn ? (lightsOn ? 2.2 : 0.6) : 0} />
      </mesh>
      <pointLight position={[-0.85, FL + 0.62, 0.55]} color="#ffd59a" intensity={lampOn ? (lightsOn ? 2.4 : 0.8) : 0} distance={3.4} decay={2} />
      {lightsOn && (
        <mesh position={[-0.85, FL + 0.455, 0.66]} userData={{ noShadow: true }}>
          <coneGeometry args={[0.012, 0.035, 6]} />
          <meshStandardMaterial color="#ffd27a" emissive="#ffb347" emissiveIntensity={2.5} />
        </mesh>
      )}
      <OvenFire on={fire} flare={flare} />

      {/* Things to poke at */}
      <LampSwitch fl={FL} on={lampOn} onToggle={() => setLampOn((on) => !on)} />
      <OvenDoor fl={FL} fire={fire} onFlare={() => setFlare((f) => f + 1)} />
      <RockingChair fl={FL} />
      <CuckooClock fl={FL} back={-FRONT + T} />
      <Radio fl={FL} />
      <CoffeePot fl={FL} />
      <LostDie fl={FL} />
      {visit && <DoorNotepad fl={FL} front={FRONT} visit={visit} />}

      {/* Porch lantern */}
      <group position={[0.0, F + 0.95, FRONT + 0.08]}>
        <Block size={[0.1, 0.16, 0.1]} color={C.metal} />
        <Block size={[0.07, 0.11, 0.11]} color={lightsOn ? C.glow : "#d8d2c0"} emissive={lightsOn ? C.glow : undefined} emissiveIntensity={lightsOn ? 2 : 0} />
        {lightsOn && <pointLight color="#ffb85c" intensity={2.2} distance={3.2} decay={2} position={[0, -0.05, 0.25]} />}
      </group>
      {lightsOn && <pointLight color="#ffc070" intensity={1.4} distance={2.6} decay={2} position={[-0.85, F + 0.7, FRONT + 0.6]} />}
    </group>
  );
};
