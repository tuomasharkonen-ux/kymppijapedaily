// Walk-mode collision shapes on the ground plane (world x/z). Shared by the first-person rig and the
// lazily loaded detail models, which bring their own walls, doorways and furniture.

export type Collider =
  | { kind: "seg"; ax: number; az: number; bx: number; bz: number; r: number }
  | { kind: "box"; cx: number; cz: number; hx: number; hz: number };

/** A post or a round thing. */
export const circle = (x: number, z: number, r: number): Collider => ({ kind: "seg", ax: x, az: z, bx: x, bz: z, r });
/** A wall or a rail: a segment with thickness. */
export const seg = (ax: number, az: number, bx: number, bz: number, r: number): Collider => ({ kind: "seg", ax, az, bx, bz, r });
/** An axis-aligned block, by centre and size. */
export const box = (cx: number, cz: number, w: number, d: number): Collider => ({ kind: "box", cx, cz, hx: w / 2, hz: d / 2 });

/** Walls and floors the detailed (walk-mode) models add. */
export interface WalkExtras {
  /** Replaces the solid cabin block: walls with a doorway, plus the furniture inside. */
  cabin: Collider[];
  /** Replaces the solid sauna block once the sauna is built. */
  sauna: Collider[];
  /** Floor height inside the interiors, or null when (x, z) isn't inside one. */
  floor: (x: number, z: number, sauna: boolean) => number | null;
}
