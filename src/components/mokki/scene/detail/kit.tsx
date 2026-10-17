import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

type Vec3 = [number, number, number];

const color = new THREE.Color();
const ZERO: Vec3 = [0, 0, 0];
const ONE: Vec3 = [1, 1, 1];

function matrix(position: Vec3 = ZERO, rotation: Vec3 = ZERO, scale: Vec3 = ONE) {
  return new THREE.Matrix4().compose(new THREE.Vector3(...position), new THREE.Quaternion().setFromEuler(new THREE.Euler(...rotation)), new THREE.Vector3(...scale));
}

/**
 * Builds lots of small coloured parts into ONE vertex-coloured geometry, so a furnished room is a single
 * draw call instead of hundreds of meshes. Nested transforms work like groups: push() ... pop().
 */
export class Kit {
  private parts: THREE.BufferGeometry[] = [];
  private stack: THREE.Matrix4[] = [new THREE.Matrix4()];

  private get top() {
    return this.stack[this.stack.length - 1];
  }

  push(position?: Vec3, rotation?: Vec3, scale?: Vec3) {
    this.stack.push(this.top.clone().multiply(matrix(position, rotation, scale)));
    return this;
  }

  pop() {
    if (this.stack.length > 1) this.stack.pop();
    return this;
  }

  /** Runs `draw` inside a transformed group. */
  at(position: Vec3, rotation: Vec3 | undefined, draw: () => void) {
    this.push(position, rotation);
    draw();
    this.pop();
  }

  add(geometry: THREE.BufferGeometry, hex: string, position?: Vec3, rotation?: Vec3, scale?: Vec3) {
    const g = geometry.index ? geometry.toNonIndexed() : geometry;
    if (g !== geometry) geometry.dispose();
    g.deleteAttribute("uv");
    g.applyMatrix4(this.top.clone().multiply(matrix(position, rotation, scale)));
    color.set(hex);
    const n = g.attributes.position.count;
    const colors = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }
    g.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    this.parts.push(g);
    return this;
  }

  box(size: Vec3, position: Vec3, hex: string, rotation?: Vec3) {
    return this.add(new THREE.BoxGeometry(...size), hex, position, rotation);
  }

  cyl(radiusTop: number, radiusBottom: number, height: number, segments: number, position: Vec3, hex: string, rotation?: Vec3) {
    return this.add(new THREE.CylinderGeometry(radiusTop, radiusBottom, height, segments), hex, position, rotation);
  }

  /** Low-poly lump (stones, pillows, bushes): a squashed dodecahedron. */
  lump(scale: Vec3, position: Vec3, hex: string, rotation?: Vec3) {
    return this.add(new THREE.DodecahedronGeometry(1, 0), hex, position, rotation, scale);
  }

  /** Axis-aligned box from min/max corners: handy for walls around openings. */
  span(min: Vec3, max: Vec3, hex: string) {
    const size: Vec3 = [max[0] - min[0], max[1] - min[1], max[2] - min[2]];
    if (size[0] <= 1e-4 || size[1] <= 1e-4 || size[2] <= 1e-4) return this;
    return this.box(size, [(min[0] + max[0]) / 2, (min[1] + max[1]) / 2, (min[2] + max[2]) / 2], hex);
  }

  build() {
    const merged = this.parts.length ? mergeGeometries(this.parts, false) : new THREE.BufferGeometry();
    this.parts.forEach((p) => p.dispose());
    this.parts = [];
    merged.computeBoundingSphere();
    return merged;
  }
}

/** A wall along local x (centred on x = 0, from y = 0 up), with rectangular openings cut out. */
export function wallWithOpenings(
  kit: Kit,
  length: number,
  height: number,
  thickness: number,
  openings: { x: number; width: number; bottom: number; top: number }[],
  hex: string,
) {
  const holes = [...openings].sort((a, b) => a.x - b.x);
  const t = thickness / 2;
  let cursor = -length / 2;
  for (const h of holes) {
    const x0 = h.x - h.width / 2;
    const x1 = h.x + h.width / 2;
    kit.span([cursor, 0, -t], [x0, height, t], hex);
    kit.span([x0, 0, -t], [x1, h.bottom, t], hex);
    kit.span([x0, h.top, -t], [x1, height, t], hex);
    cursor = x1;
  }
  kit.span([cursor, 0, -t], [length / 2, height, t], hex);
}

/** Renders a Kit as one flat-shaded, vertex-coloured mesh (built once, disposed on unmount). */
export const KitMesh = ({ build, deps = [], position }: { build: (kit: Kit) => void; deps?: unknown[]; position?: Vec3 }) => {
  const geometry = useMemo(() => {
    const kit = new Kit();
    build(kit);
    return kit.build();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return (
    <mesh geometry={geometry} position={position}>
      <meshStandardMaterial vertexColors flatShading roughness={0.85} />
    </mesh>
  );
};
