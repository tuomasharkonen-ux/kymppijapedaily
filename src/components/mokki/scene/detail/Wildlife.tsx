import { useMemo, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { MokkiPieceId } from "@/lib/mokki";
import { WALK_SCALE } from "../FirstPerson";
import { GROUND_Y, LAKE_RADIUS } from "../Nature";
import { PIECE_LAYOUT } from "../Pieces";
import { Burst } from "../primitives";
import { Bubble, HitBox, Tappable, useSay } from "./interact";
import { KitMesh, type Kit } from "./kit";
import { playMoose, playSplash, playSqueak } from "./sounds";

type Vec3 = [number, number, number];

// ---------------------------------------------------------------------------
// Hirvi: a moose wandering the far shore. Tap it and it trots off into the forest.
// ---------------------------------------------------------------------------

const MOOSE_ARC: [number, number] = [Math.PI * 1.15, Math.PI * 1.45];
const MOOSE_R = 8.4;
const MOOSE_Y = 0.36;
const FUR = "#4a3524";
const LEG = "#7a6650";
const ANTLER = "#cdbb95";

function buildMooseBody(kit: Kit) {
  kit.box([0.5, 0.24, 0.2], [0, 0.56, 0], FUR);
  kit.box([0.2, 0.12, 0.19], [0.13, 0.7, 0], FUR);
  kit.box([0.16, 0.12, 0.12], [0.3, 0.66, 0], FUR, [0, 0, -0.5]);
  kit.box([0.05, 0.06, 0.04], [-0.26, 0.6, 0], FUR);
}

function buildMooseHead(kit: Kit) {
  kit.box([0.2, 0.1, 0.09], [0.1, -0.03, 0], FUR, [0, 0, -0.45]);
  kit.lump([0.06, 0.05, 0.05], [0.19, -0.09, 0], "#3a2a1c");
  kit.box([0.02, 0.07, 0.02], [0.08, -0.1, 0], FUR);
  for (const s of [1, -1]) {
    kit.box([0.05, 0.02, 0.025], [0.0, 0.04, s * 0.06], FUR, [s * 0.5, 0, 0]);
    // Palmate antlers
    kit.box([0.03, 0.03, 0.1], [0.02, 0.07, s * 0.08], ANTLER, [s * -0.3, 0, 0]);
    kit.box([0.1, 0.015, 0.12], [0.0, 0.1, s * 0.16], ANTLER, [s * -0.35, 0, 0.1]);
    for (let i = 0; i < 3; i++) kit.box([0.012, 0.05, 0.012], [-0.03 + i * 0.035, 0.13, s * (0.17 + i * 0.015)], ANTLER, [s * -0.3, 0, 0]);
  }
}

export const Moose = () => {
  const root = useRef<THREE.Group>(null);
  const head = useRef<THREE.Group>(null);
  const legs = useRef<(THREE.Group | null)[]>([]);
  const st = useRef({ s: 0.35, dir: 1, speed: 0.012, grazeUntil: 0, nextGraze: 6, fleeing: false, hiddenUntil: 0, phase: 0, opacity: 1 });
  const pendingFlee = useRef(false);
  const [msg, say] = useSay();
  const [bubbleAt, setBubbleAt] = useState<Vec3>([0, 0, 0]);

  useFrame(({ clock }, rawDelta) => {
    const g = root.current;
    if (!g) return;
    const dt = Math.min(rawDelta, 0.05);
    const t = clock.getElapsedTime();
    const m = st.current;
    if (pendingFlee.current) {
      pendingFlee.current = false;
      m.fleeing = true;
      m.grazeUntil = 0;
      m.dir = m.s < 0.5 ? -1 : 1;
    }
    if (t < m.hiddenUntil) {
      g.visible = false;
      return;
    }
    if (!g.visible) {
      // Wander back in from one end
      g.visible = true;
      m.s = Math.random() < 0.5 ? 0 : 1;
      m.dir = m.s === 0 ? 1 : -1;
      m.fleeing = false;
      m.nextGraze = t + 4;
    }
    const grazing = t < m.grazeUntil;
    if (!grazing && !m.fleeing && t > m.nextGraze) {
      m.grazeUntil = t + 4 + Math.random() * 4;
      m.nextGraze = m.grazeUntil + 6 + Math.random() * 8;
    }
    const speed = m.fleeing ? 0.07 : grazing ? 0 : m.speed;
    m.s += m.dir * speed * dt;
    if (m.s > 1 || m.s < 0) {
      if (m.fleeing) {
        m.hiddenUntil = t + 25;
        g.visible = false;
      }
      m.s = THREE.MathUtils.clamp(m.s, 0, 1);
      m.dir *= -1;
    }
    const a = MOOSE_ARC[0] + (MOOSE_ARC[1] - MOOSE_ARC[0]) * m.s;
    g.position.set(Math.cos(a) * MOOSE_R, MOOSE_Y, Math.sin(a) * MOOSE_R);
    // Face along the shore (tangent), the model looks along +x
    const tx = -Math.sin(a) * m.dir;
    const tz = Math.cos(a) * m.dir;
    g.rotation.y = Math.atan2(-tz, tx);
    m.phase += speed * dt * 900;
    legs.current.forEach((l, i) => {
      if (l) l.rotation.z = speed > 0 ? Math.sin(m.phase + (i % 2 ? Math.PI : 0) + (i > 1 ? Math.PI / 2 : 0)) * (m.fleeing ? 0.5 : 0.3) : 0;
    });
    if (head.current) head.current.rotation.z = THREE.MathUtils.damp(head.current.rotation.z, grazing ? -1.0 : 0, 3, dt);
  });

  return (
    <>
      <group ref={root}>
        <Tappable
          onTap={() => {
            const g = root.current;
            if (g) setBubbleAt([g.position.x, g.position.y + 1.2, g.position.z]);
            pendingFlee.current = true;
            playMoose();
            say("🫎 Hirvi!");
          }}
        >
          <KitMesh build={buildMooseBody} />
          <group ref={head} position={[0.36, 0.7, 0]}>
            <KitMesh build={buildMooseHead} />
          </group>
          {[
            [0.18, 0.07],
            [0.18, -0.07],
            [-0.18, 0.07],
            [-0.18, -0.07],
          ].map(([x, z], i) => (
            <group key={i} ref={(el) => (legs.current[i] = el)} position={[x, 0.46, z]}>
              <mesh position={[0, -0.23, 0]}>
                <boxGeometry args={[0.045, 0.46, 0.045]} />
                <meshStandardMaterial color={LEG} flatShading />
              </mesh>
            </group>
          ))}
          {/* It's far away: a generous tap target */}
          <HitBox size={[1.0, 1.1, 0.6]} position={[0.05, 0.55, 0]} />
        </Tappable>
      </group>
      <Bubble position={bubbleAt} msg={msg} />
    </>
  );
};

// ---------------------------------------------------------------------------
// A fish that jumps now and then (open water only)
// ---------------------------------------------------------------------------

export const JumpingFish = () => {
  const fish = useRef<THREE.Group>(null);
  const ripple = useRef<THREE.Mesh>(null);
  const jump = useRef({ next: 6 + Math.random() * 6, start: -10, from: new THREE.Vector3(), dir: new THREE.Vector3() });
  const [splash, setSplash] = useState<{ key: number; at: Vec3 }>({ key: 0, at: [0, 0, 0] });
  const { camera } = useThree();
  const DUR = 0.75;

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const j = jump.current;
    if (t > j.next) {
      const a = Math.random() * Math.PI * 2;
      const r = 5.7 + Math.random() * (LAKE_RADIUS - 7);
      j.from.set(Math.cos(a) * r, 0, Math.sin(a) * r);
      const d = Math.random() * Math.PI * 2;
      j.dir.set(Math.cos(d), 0, Math.sin(d));
      j.start = t;
      j.next = t + 9 + Math.random() * 12;
      setSplash((s) => ({ key: s.key + 1, at: [j.from.x, 0.02, j.from.z] }));
      if (camera.position.distanceTo(j.from) < 6) playSplash();
    }
    const p = (t - j.start) / DUR;
    if (fish.current) {
      fish.current.visible = p >= 0 && p <= 1;
      if (fish.current.visible) {
        fish.current.position.copy(j.from).addScaledVector(j.dir, p * 0.5);
        fish.current.position.y = Math.sin(Math.PI * p) * 0.32 - 0.03;
        fish.current.rotation.set(0, Math.atan2(-j.dir.z, j.dir.x), -Math.cos(Math.PI * p) * 1.1);
      }
    }
    if (ripple.current) {
      const rp = (t - j.start) / 2.2;
      ripple.current.visible = rp >= 0 && rp <= 1;
      ripple.current.position.set(j.from.x + j.dir.x * 0.5, 0.025, j.from.z + j.dir.z * 0.5);
      ripple.current.scale.setScalar(0.1 + rp * 0.6);
      (ripple.current.material as THREE.MeshBasicMaterial).opacity = (1 - rp) * 0.5;
    }
  });

  return (
    <>
      <group ref={fish} visible={false}>
        <mesh scale={[1, 0.38, 0.3]}>
          <sphereGeometry args={[0.07, 8, 6]} />
          <meshStandardMaterial color="#a9b6bf" metalness={0.5} roughness={0.35} flatShading />
        </mesh>
        <mesh position={[-0.08, 0, 0]} rotation={[0, 0, Math.PI / 2]} scale={[1, 1, 0.3]}>
          <coneGeometry args={[0.035, 0.05, 4]} />
          <meshStandardMaterial color="#8a98a2" flatShading />
        </mesh>
      </group>
      <mesh ref={ripple} rotation={[-Math.PI / 2, 0, 0]} visible={false} userData={{ noShadow: true }} raycast={() => null}>
        <ringGeometry args={[0.8, 1, 24]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.4} depthWrite={false} />
      </mesh>
      <Burst position={splash.at} trigger={splash.key} color="#e8f4fa" count={8} radius={0.12} rise={0.2} duration={0.8} size={0.04} />
    </>
  );
};

// ---------------------------------------------------------------------------
// Kumiankka: a rubber duck bobbing in the palju
// ---------------------------------------------------------------------------

export const PaljuDuck = () => {
  const duck = useRef<THREE.Group>(null);
  const hopAt = useRef(-100);
  const pending = useRef(false);
  const [msg, say] = useSay();
  const [cx, , cz] = PIECE_LAYOUT.palju.center;
  const water = GROUND_Y + 0.6 * WALK_SCALE.palju;
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (pending.current) {
      hopAt.current = t;
      pending.current = false;
    }
    if (!duck.current) return;
    const a = t * 0.25;
    const h = t - hopAt.current;
    duck.current.position.set(Math.cos(a) * 0.17, Math.sin(t * 2.1) * 0.006 + (h < 0.6 ? Math.sin((Math.PI * h) / 0.6) * 0.08 : 0), Math.sin(a) * 0.17);
    duck.current.rotation.y = -a - Math.PI / 2 + (h < 0.6 ? (h / 0.6) * Math.PI * 2 : 0);
  });
  return (
    <group position={[cx, water, cz]}>
      <Tappable
        onTap={() => {
          pending.current = true;
          playSqueak();
          say("🦆 Kvaak!");
        }}
      >
        <group ref={duck}>
          <mesh position={[0, 0.012, 0]} scale={[1, 0.7, 0.8]}>
            <sphereGeometry args={[0.035, 10, 8]} />
            <meshStandardMaterial color="#f5cf1d" roughness={0.4} />
          </mesh>
          <mesh position={[0.025, 0.045, 0]}>
            <sphereGeometry args={[0.021, 10, 8]} />
            <meshStandardMaterial color="#f5cf1d" roughness={0.4} />
          </mesh>
          <mesh position={[0.05, 0.042, 0]} rotation={[0, 0, -Math.PI / 2]} scale={[1, 1, 0.6]}>
            <coneGeometry args={[0.01, 0.022, 6]} />
            <meshStandardMaterial color="#e2711d" />
          </mesh>
          {[0.01, -0.01].map((z) => (
            <mesh key={z} position={[0.04, 0.052, z]}>
              <sphereGeometry args={[0.0035, 6, 4]} />
              <meshBasicMaterial color="#111111" />
            </mesh>
          ))}
          <HitBox size={[0.12, 0.1, 0.12]} position={[0.01, 0.03, 0]} />
        </group>
      </Tappable>
      <Bubble position={[0, 0.4, 0]} msg={msg} />
    </group>
  );
};

/** All the critters, depending on the season and what's been built. */
export const Wildlife = ({ frozen, pieces }: { frozen: boolean; pieces: { id: MokkiPieceId; status: string }[] }) => {
  const hasPalju = useMemo(() => pieces.some((p) => p.id === "palju" && p.status === "complete"), [pieces]);
  return (
    <>
      <Moose />
      {!frozen && <JumpingFish />}
      {hasPalju && <PaljuDuck />}
    </>
  );
};
