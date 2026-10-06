import { C } from "../palette";
import { Block, Cyl, GableFill, GableRoof, Mat } from "./primitives";

type Vec3 = [number, number, number];

// Cabin geometry (local coords, origin at ground under the cabin centre)
export const CABIN = {
  position: [-0.6, 0.45, -0.9] as Vec3,
  width: 2.8,
  depth: 2.0,
  foundation: 0.18,
  wallHeight: 1.15,
  roofRise: 0.8,
  porchDepth: 0.95,
};

/** World-space top of the porch deck. */
export const PORCH_TOP_Y = CABIN.position[1] + CABIN.foundation + 0.06;
/** World-space top of the cabin chimney (smoke origin). */
export const CABIN_CHIMNEY_TOP: Vec3 = [
  CABIN.position[0] + 0.75,
  CABIN.position[1] + CABIN.foundation + CABIN.wallHeight + CABIN.roofRise + 0.25,
  CABIN.position[2] - 0.3,
];

const Window = ({
  position,
  rotation,
  lit,
  w = 0.52,
  h = 0.46,
}: {
  position: Vec3;
  rotation?: Vec3;
  lit: boolean;
  w?: number;
  h?: number;
}) => (
  <group position={position} rotation={rotation}>
    <Block size={[w + 0.1, h + 0.1, 0.04]} color={C.trim} />
    <Block
      size={[w, h, 0.05]}
      position={[0, 0, 0.005]}
      color={lit ? C.glow : C.glass}
      emissive={lit ? C.glow : undefined}
      emissiveIntensity={lit ? 1.4 : 0}
      roughness={0.25}
    />
    {/* Cross mullions */}
    <Block size={[0.035, h, 0.06]} position={[0, 0, 0.01]} color={C.trim} />
    <Block size={[w, 0.035, 0.06]} position={[0, 0, 0.01]} color={C.trim} />
    {/* Sill */}
    <Block size={[w + 0.16, 0.04, 0.09]} position={[0, -h / 2 - 0.06, 0.03]} color={C.trim} />
  </group>
);

export const Cabin = ({ lightsOn, snow }: { lightsOn: boolean; snow: boolean }) => {
  const { width: w, depth: d, foundation: f, wallHeight: wh, roofRise: rise, porchDepth: pd } = CABIN;
  const wallY = f + wh / 2;
  const front = d / 2;

  return (
    <group position={CABIN.position}>
      {/* Stone foundation */}
      <Block size={[w + 0.08, f, d + 0.08]} position={[0, f / 2, 0]} color={C.rockDark} />

      {/* Punamulta walls */}
      <Block size={[w, wh, d]} position={[0, wallY, 0]} color={C.punamulta} />
      {/* Board texture: subtle vertical battens */}
      {Array.from({ length: 13 }, (_, i) => (
        <Block key={`bf${i}`} size={[0.035, wh, 0.02]} position={[-w / 2 + 0.11 + i * 0.215, wallY, front + 0.01]} color={C.punamultaDark} />
      ))}
      {Array.from({ length: 9 }, (_, i) => (
        <Block key={`bs${i}`} size={[0.02, wh, 0.035]} position={[w / 2 + 0.01, wallY, -d / 2 + 0.11 + i * 0.22]} color={C.punamultaDark} />
      ))}

      {/* White corner boards */}
      {[
        [w / 2, front],
        [-w / 2, front],
        [w / 2, -front],
        [-w / 2, -front],
      ].map(([x, z], i) => (
        <Block key={i} size={[0.1, wh, 0.1]} position={[x, wallY, z]} color={C.trim} />
      ))}

      {/* Gables + roof */}
      <group position={[0, f + wh, 0]}>
        <GableFill width={w} depth={d} rise={rise} color={C.punamulta} />
        {/* White fascia boards under the eaves */}
        <Block size={[w + 0.3, 0.07, 0.06]} position={[0, -0.02, front + 0.02]} color={C.trim} />
        <Block size={[w + 0.3, 0.07, 0.06]} position={[0, -0.02, -front - 0.02]} color={C.trim} />
        {/* Gable trims (rake boards) */}
        {[1, -1].map((side) =>
          [1, -1].map((slope) => {
            const angle = Math.atan2(rise, d / 2);
            const len = Math.sqrt(rise * rise + (d / 2) * (d / 2)) + 0.2;
            return (
              <Block
                key={`${side}${slope}`}
                size={[0.05, 0.08, len]}
                position={[side * (w / 2 + 0.03), rise / 2, (slope * d) / 4]}
                rotation={[slope * angle, 0, 0]}
                color={C.trim}
              />
            );
          }),
        )}
        {/* Tiny attic window on the east gable */}
        <Window position={[w / 2 + 0.03, rise * 0.38, 0]} rotation={[0, Math.PI / 2, 0]} lit={lightsOn} w={0.28} h={0.24} />
        <GableRoof width={w} depth={d} rise={rise + 0.06} overhang={0.28} snow={snow} />
      </group>

      {/* Brick chimney */}
      <group position={[0.75, f + wh + rise * 0.55, -0.3]}>
        <Block size={[0.3, 0.95, 0.3]} position={[0, 0.25, 0]} color={C.brick} />
        <Block size={[0.38, 0.07, 0.38]} position={[0, 0.74, 0]} color={C.metal} />
        {snow && <Block size={[0.32, 0.05, 0.32]} position={[0, 0.8, 0]} color={C.snow} />}
      </group>

      {/* Front: windows and door */}
      <Window position={[-0.85, f + wh * 0.58, front + 0.02]} lit={lightsOn} />
      <Window position={[1.15, f + wh * 0.58, front + 0.02]} lit={lightsOn} w={0.36} />
      <group position={[0.55, f, front + 0.02]}>
        <Block size={[0.6, 0.98, 0.04]} position={[0, 0.49, 0]} color={C.trim} />
        <Block size={[0.48, 0.9, 0.06]} position={[0, 0.45, 0.005]} color="#3d5a45" />
        <Block size={[0.3, 0.22, 0.07]} position={[0, 0.66, 0.01]} color={lightsOn ? C.glow : C.glass} emissive={lightsOn ? C.glow : undefined} emissiveIntensity={lightsOn ? 1 : 0} />
        <mesh position={[0.17, 0.45, 0.05]}>
          <sphereGeometry args={[0.025, 6, 4]} />
          <Mat color={C.coin} metalness={0.6} roughness={0.3} />
        </mesh>
      </group>
      {/* East side window */}
      <Window position={[w / 2 + 0.02, f + wh * 0.58, -0.2]} rotation={[0, Math.PI / 2, 0]} lit={lightsOn} />

      {/* Porch lantern */}
      <group position={[0.0, f + 0.95, front + 0.08]}>
        <Block size={[0.1, 0.16, 0.1]} color={C.metal} />
        <Block size={[0.07, 0.11, 0.11]} color={lightsOn ? C.glow : "#d8d2c0"} emissive={lightsOn ? C.glow : undefined} emissiveIntensity={lightsOn ? 2 : 0} />
        {lightsOn && <pointLight color="#ffb85c" intensity={2.2} distance={3.2} decay={2} position={[0, -0.05, 0.25]} />}
      </group>
      {lightsOn && <pointLight color="#ffc070" intensity={1.4} distance={2.6} decay={2} position={[-0.85, f + 0.7, front + 0.6]} />}

      {/* Porch deck */}
      <group position={[0, 0, front]}>
        <Block size={[w + 0.1, 0.08, pd]} position={[0, f + 0.02, pd / 2]} color={C.plank} />
        {Array.from({ length: 8 }, (_, i) => (
          <Block key={i} size={[w + 0.1, 0.02, 0.012]} position={[0, f + 0.065, 0.06 + i * 0.12]} color={C.plankDark} />
        ))}
        {/* Railing, with a gap for the steps */}
        {[-1.4, -0.85, -0.3, 1.4].map((x, i) => (
          <Block key={`p${i}`} size={[0.06, 0.42, 0.06]} position={[x, f + 0.27, pd - 0.03]} color={C.trim} />
        ))}
        <Block size={[1.16, 0.05, 0.06]} position={[-0.85, f + 0.47, pd - 0.03]} color={C.trim} />
        <Block size={[0.06, 0.05, pd]} position={[-1.42, f + 0.47, pd / 2]} color={C.trim} />
        <Block size={[0.06, 0.05, pd]} position={[1.42, f + 0.47, pd / 2]} color={C.trim} />
        <Block size={[0.06, 0.42, 0.06]} position={[1.42, f + 0.27, 0.05]} color={C.trim} />
        {/* Steps */}
        <Block size={[0.7, 0.08, 0.22]} position={[0.55, f - 0.05, pd + 0.1]} color={C.plank} />
        <Block size={[0.7, 0.08, 0.22]} position={[0.55, f - 0.13, pd + 0.3]} color={C.plankDark} />
        {/* Bench along the wall */}
        <Block size={[0.8, 0.05, 0.22]} position={[-0.9, f + 0.3, 0.16]} color={C.plankDark} />
        <Block size={[0.05, 0.25, 0.2]} position={[-1.25, f + 0.16, 0.16]} color={C.plankDark} />
        <Block size={[0.05, 0.25, 0.2]} position={[-0.55, f + 0.16, 0.16]} color={C.plankDark} />
        {snow && <Block size={[w + 0.1, 0.04, 0.3]} position={[0, f + 0.08, pd - 0.15]} color={C.snow} />}
      </group>

      {/* Firewood basket by the door + rug */}
      <Cyl radiusTop={0.1} radiusBottom={0.09} height={0.16} segments={8} position={[1.25, f + 0.14, front + 0.2]} color={C.logDark} />
      <Block size={[0.5, 0.012, 0.32]} position={[0.55, f + 0.065, front + 0.3]} color="#b5503a" />
    </group>
  );
};
