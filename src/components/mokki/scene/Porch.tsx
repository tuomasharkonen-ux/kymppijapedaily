import { useRef, useState, type ReactNode } from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import { C } from "../palette";
import { GROUND_Y } from "./Nature";
import { PORCH_TOP_Y } from "./Cabin";
import { Block, Cyl, Mat } from "./primitives";

type Vec3 = [number, number, number];

export const PORCH_POSITIONS = {
  table: [-1.5, PORCH_TOP_Y, 0.66] as Vec3,
  kiulu: [-0.75, PORCH_TOP_Y, 0.78] as Vec3,
  noticeBoard: [-2.45, GROUND_Y, 1.2] as Vec3,
  mailbox: [0.4, GROUND_Y, 2.4] as Vec3,
};

/** Hover/tap affordance for clickable 3D objects: grows on hover, pulsing ring hints it's tappable. */
export const Interactive = ({
  position,
  onClick,
  children,
  hint = true,
  ringRadius = 0.35,
  label,
}: {
  position: Vec3;
  onClick?: () => void;
  children: ReactNode;
  hint?: boolean;
  ringRadius?: number;
  label: string;
}) => {
  const group = useRef<THREE.Group>(null);
  const ring = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const enabled = !!onClick;

  useFrame(({ clock }, delta) => {
    if (group.current) {
      const target = hovered ? 1.14 : 1;
      const s = THREE.MathUtils.damp(group.current.scale.x, target, 10, delta);
      group.current.scale.setScalar(s);
    }
    if (ring.current) {
      const t = (clock.getElapsedTime() * 0.7) % 1;
      ring.current.scale.setScalar(0.7 + t * 0.6);
      (ring.current.material as THREE.MeshBasicMaterial).opacity = (1 - t) * (hovered ? 0.9 : 0.55);
    }
  });

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    if (!enabled) return;
    e.stopPropagation();
    onClick?.();
  };

  return (
    <group position={position} name={label}>
      <group
        ref={group}
        onClick={handleClick}
        onPointerOver={(e) => {
          if (!enabled) return;
          e.stopPropagation();
          setHovered(true);
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          setHovered(false);
          document.body.style.cursor = "";
        }}
      >
        {children}
      </group>
      {enabled && hint && (
        <mesh ref={ring} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} userData={{ noShadow: true }}>
          <ringGeometry args={[ringRadius * 0.85, ringRadius, 32]} />
          <meshBasicMaterial color="#ffe08a" transparent opacity={0.5} depthWrite={false} />
        </mesh>
      )}
    </group>
  );
};

// ---------------------------------------------------------------------------
// Mailbox (postilaatikko): raised flag = Eilisen Potti result waiting
// ---------------------------------------------------------------------------

export const Mailbox = ({ hasMail, snow }: { hasMail: boolean; snow: boolean }) => {
  const envelope = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!envelope.current) return;
    const t = clock.getElapsedTime();
    envelope.current.position.y = 1.8 + Math.sin(t * 2.4) * 0.1;
    // Face the isometric camera (mailbox itself is turned -0.5 rad), with a gentle wobble
    envelope.current.rotation.y = 0.5 + Math.PI / 4 + Math.sin(t * 1.3) * 0.35;
  });
  return (
    <group rotation={[0, -0.5, 0]}>
      <Block size={[0.08, 0.95, 0.08]} position={[0, 0.47, 0]} color={C.post} />
      <Block size={[0.3, 0.05, 0.36]} position={[0, 0.96, 0]} color={C.post} />
      {/* Box body with a rounded top */}
      <Block size={[0.26, 0.2, 0.4]} position={[0, 1.08, 0]} color="#2f5d8a" />
      <mesh position={[0, 1.18, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.13, 0.13, 0.4, 10, 1, false, 0, Math.PI]} />
        <Mat color="#2f5d8a" />
      </mesh>
      <Block size={[0.24, 0.3, 0.02]} position={[0, 1.13, 0.205]} color="#264c72" />
      {snow && <Block size={[0.24, 0.05, 0.38]} position={[0, 1.31, 0]} color={C.snow} />}
      {/* Flag: up when there's mail */}
      <group position={[0.15, 1.1, -0.05]} rotation={[hasMail ? 0 : Math.PI / 2, 0, 0]}>
        <Block size={[0.025, 0.32, 0.025]} position={[0, 0.16, 0]} color={C.metal} />
        <Block size={[0.02, 0.1, 0.14]} position={[0, 0.27, 0.07]} color={C.red} />
      </group>
      {hasMail && (
        <group ref={envelope} position={[0, 1.8, 0]} scale={2}>
          {/* Unlit so it pops against the white porch trims */}
          <mesh userData={{ noShadow: true }}>
            <boxGeometry args={[0.3, 0.2, 0.03]} />
            <meshBasicMaterial color="#fff6d8" />
          </mesh>
          <mesh position={[0, 0.035, 0.017]} rotation={[0, 0, Math.PI / 4]} userData={{ noShadow: true }}>
            <planeGeometry args={[0.15, 0.15]} />
            <meshBasicMaterial color="#e2c88f" />
          </mesh>
          <mesh position={[0, -0.005, 0.019]} userData={{ noShadow: true }}>
            <circleGeometry args={[0.04, 12]} />
            <meshBasicMaterial color={C.red} />
          </mesh>
          <mesh position={[0, 0, -0.02]} userData={{ noShadow: true }}>
            <circleGeometry args={[0.26, 20]} />
            <meshBasicMaterial color="#ffd75e" transparent opacity={0.28} depthWrite={false} />
          </mesh>
        </group>
      )}
    </group>
  );
};

// ---------------------------------------------------------------------------
// Kiulu (sauna bucket) that fills with coins as Päivän Potti grows
// ---------------------------------------------------------------------------

export const Kiulu = ({ potTotal }: { potTotal: number }) => {
  const coins = Math.min(14, Math.ceil(potTotal / 25));
  const sparkle = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (!sparkle.current) return;
    const t = clock.getElapsedTime();
    sparkle.current.rotation.y = t * 1.5;
    sparkle.current.scale.setScalar(0.6 + Math.abs(Math.sin(t * 3)) * 0.6);
  });
  return (
    <group scale={1.6}>
      {/* Staved wooden bucket */}
      <mesh position={[0, 0.13, 0]}>
        <cylinderGeometry args={[0.2, 0.16, 0.26, 12, 1, true]} />
        <Mat color={C.kiulu} side={THREE.DoubleSide} />
      </mesh>
      <Cyl radiusTop={0.16} height={0.02} segments={12} position={[0, 0.01, 0]} color={C.logDark} />
      {[0.05, 0.21].map((y) => (
        <mesh key={y} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[y < 0.1 ? 0.17 : 0.195, 0.012, 4, 16]} />
          <Mat color={C.metal} metalness={0.5} roughness={0.4} />
        </mesh>
      ))}
      {/* Handle */}
      <mesh position={[0, 0.27, 0]} rotation={[0, 0, 0]}>
        <torusGeometry args={[0.17, 0.012, 4, 12, Math.PI]} />
        <Mat color={C.metal} />
      </mesh>
      {/* Löylykauha (ladle) leaning in */}
      <group position={[0.06, 0.25, 0.04]} rotation={[0.3, 0, -0.5]}>
        <Cyl radiusTop={0.012} height={0.42} segments={5} position={[0, 0.12, 0]} color={C.logEnd} />
        <Cyl radiusTop={0.045} radiusBottom={0.035} height={0.05} segments={8} position={[0, -0.1, 0]} color={C.kiulu} />
      </group>
      {/* Coins heaped inside */}
      {Array.from({ length: coins }, (_, i) => {
        const a = i * 2.4;
        const r = (i % 5) * 0.03;
        return (
          <mesh key={i} position={[Math.cos(a) * r, 0.17 + Math.floor(i / 5) * 0.025, Math.sin(a) * r]} rotation={[0.2 * (i % 3), a, 0.15]}>
            <cylinderGeometry args={[0.045, 0.045, 0.014, 10]} />
            <Mat color={C.coin} metalness={0.7} roughness={0.3} emissive="#8a5a00" emissiveIntensity={0.25} />
          </mesh>
        );
      })}
      {potTotal > 0 && (
        <mesh ref={sparkle} position={[0.05, 0.38, 0]} userData={{ noShadow: true }}>
          <octahedronGeometry args={[0.04, 0]} />
          <meshBasicMaterial color="#fff3b0" />
        </mesh>
      )}
    </group>
  );
};

// ---------------------------------------------------------------------------
// Ilmoitustaulu (notice board) for badges
// ---------------------------------------------------------------------------

export const NoticeBoard = ({ snow }: { snow: boolean }) => (
  <group rotation={[0, 0.35, 0]}>
    <Block size={[0.07, 1.3, 0.07]} position={[-0.38, 0.65, 0]} color={C.post} />
    <Block size={[0.07, 1.3, 0.07]} position={[0.38, 0.65, 0]} color={C.post} />
    <Block size={[0.82, 0.58, 0.05]} position={[0, 0.95, 0]} color={C.plankDark} />
    <Block size={[0.72, 0.48, 0.02]} position={[0, 0.95, 0.03]} color="#c79a5f" />
    {/* Little roof */}
    <Block size={[0.95, 0.04, 0.24]} position={[0, 1.3, 0.02]} rotation={[0.35, 0, 0]} color={C.roof} />
    {snow && <Block size={[0.9, 0.04, 0.2]} position={[0, 1.33, 0.03]} rotation={[0.35, 0, 0]} color={C.snow} />}
    {/* Pinned notes and a gold badge */}
    <Block size={[0.18, 0.22, 0.01]} position={[-0.2, 1.0, 0.045]} rotation={[0, 0, 0.08]} color="#fffaf0" />
    <Block size={[0.16, 0.14, 0.01]} position={[0.02, 0.86, 0.045]} rotation={[0, 0, -0.1]} color="#ffe28a" />
    <Block size={[0.14, 0.18, 0.01]} position={[0.22, 1.02, 0.045]} rotation={[0, 0, 0.05]} color="#f7b7a3" />
    <mesh position={[0.2, 0.83, 0.05]} rotation={[Math.PI / 2, 0, 0]}>
      <cylinderGeometry args={[0.06, 0.06, 0.015, 10]} />
      <Mat color={C.coin} metalness={0.6} roughness={0.3} emissive="#8a5a00" emissiveIntensity={0.3} />
    </mesh>
    {[-0.2, 0.02, 0.22].map((x, i) => (
      <mesh key={i} position={[x, i === 1 ? 0.92 : 1.1, 0.055]}>
        <sphereGeometry args={[0.012, 4, 3]} />
        <Mat color={C.red} />
      </mesh>
    ))}
  </group>
);

// ---------------------------------------------------------------------------
// Porch table with today's die (coloured after the active dice skin)
// ---------------------------------------------------------------------------

const SKIN_DIE: Record<string, { body: string; pip: string; metal?: number }> = {
  default: { body: "#fbfaf6", pip: "#1f1f1f" },
  golden_dice: { body: "#e6b422", pip: "#5a3d00", metal: 0.8 },
  diamond_dice: { body: "#bfeaf5", pip: "#2a6f8a", metal: 0.4 },
  sauna_dice: { body: "#d9b27a", pip: "#4a2e14" },
  german_supermarket_dice: { body: "#f5cf1d", pip: "#1d3f9a" },
  helldivers_dice: { body: "#1c1c1e", pip: "#f5c518" },
  sieni_dice: { body: "#c99a62", pip: "#b3261e" },
};

export const PorchTable = ({ skin }: { skin: string }) => {
  const die = SKIN_DIE[skin] ?? SKIN_DIE.default;
  const pips: [number, number][] = [
    [-0.035, -0.035],
    [0.035, 0.035],
    [-0.035, 0.035],
    [0.035, -0.035],
    [0, 0],
  ];
  return (
    <group>
      <Block size={[0.5, 0.04, 0.36]} position={[0, 0.34, 0]} color={C.plank} />
      {[
        [-0.21, -0.14],
        [0.21, -0.14],
        [-0.21, 0.14],
        [0.21, 0.14],
      ].map(([x, z], i) => (
        <Block key={i} size={[0.035, 0.32, 0.035]} position={[x, 0.16, z]} color={C.plankDark} />
      ))}
      {/* Coffee cup */}
      <Cyl radiusTop={0.035} radiusBottom={0.03} height={0.07} segments={8} position={[-0.14, 0.395, 0.06]} color={C.white} />
      {/* The die */}
      <group position={[0.08, 0.42, -0.02]} rotation={[0, 0.5, 0]}>
        <mesh>
          <boxGeometry args={[0.12, 0.12, 0.12]} />
          <Mat color={die.body} metalness={die.metal ?? 0} roughness={die.metal ? 0.3 : 0.6} />
        </mesh>
        {pips.map(([x, z], i) => (
          <mesh key={i} position={[x, 0.061, z]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.012, 8]} />
            <meshBasicMaterial color={die.pip} />
          </mesh>
        ))}
      </group>
    </group>
  );
};
