import { GROUND_Y } from "./Nature";

type Vec3 = [number, number, number];
const G = GROUND_Y;

/** Birch pair that the hammock hangs between (always on the island). */
export const HAMMOCK_BIRCHES: Vec3[] = [
  [2.55, G, 2.4],
  [3.95, G, 1.3],
];

export const BIRCHES: Vec3[] = [
  ...HAMMOCK_BIRCHES,
  [-1.0, G, -3.45],
  [1.35, G, -3.1],
  [-4.1, G, 1.95],
  [2.85, G, -3.4],
  [-3.15, G, 2.95],
];

export const birchScale = (i: number) => 0.95 + (i % 3) * 0.1;

/** Height of a birch crown above its base (before scaling). */
export const BIRCH_CROWN_Y = 1.8;

export const PINES: Vec3[] = [
  [-4.1, G, -1.95],
  [-3.65, G, -3.1],
  [0.2, G, -3.95],
  [-4.45, G, 0.85],
  [-1.95, G, -3.85],
];

/** Riukuaita posts along the south-west shore, weaving between the birches. */
export const FENCE_POSTS: Vec3[] = [
  [-1.95, G, 4.05],
  [-2.55, G, 3.72],
  [-3.1, G, 3.27],
  [-3.5, G, 2.75],
  [-3.78, G, 2.15],
  [-3.95, G, 1.45],
];

/** Doghouse just inside the front end of the fence, door towards the camera. */
export const KOPPI_POSITION: Vec3 = [-1.45, G, 4.05];

/** The dog's daytime walk across the front lawn (walked back and forth). */
export const DOG_PATH: [number, number][] = [
  [-1.05, 4.4],
  [0.7, 4.35],
  [2.15, 3.65],
  [1.75, 2.6],
  [1.3, 1.15],
  [0.6, 1.65],
  [-0.55, 2.05],
];
