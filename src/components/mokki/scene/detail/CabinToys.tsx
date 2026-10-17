import { useEffect, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { C } from "../../palette";
import { playHammer, playLoyly } from "../../mokkiSound";
import { Block, Burst } from "../primitives";
import { Bubble, HitBox, Notes, Tappable, useSay } from "./interact";
import { CABIN_DOOR } from "./DetailedCabin";
import { KitMesh, type Kit } from "./kit";
import type { CabinVisit } from "./types";
import { playChime, playClick, playCreak, playCrackle, playCuckoo, RadioPlayer } from "./sounds";

type Vec3 = [number, number, number];

// Walk-mode toys inside the cabin. Positions are cabin-local (the DetailedCabin group), floor at `fl`.

const CHAIR_WOOD = "#7a4e2a";

function buildChair(kit: Kit) {
  for (const x of [-0.14, 0.14]) {
    kit.box([0.025, 0.025, 0.42], [x, 0.02, 0], CHAIR_WOOD, [-0.08, 0, 0]);
    kit.box([0.03, 0.2, 0.03], [x, 0.12, 0.12], CHAIR_WOOD);
    kit.box([0.03, 0.5, 0.03], [x, 0.26, -0.12], CHAIR_WOOD, [-0.15, 0, 0]);
    kit.box([0.03, 0.025, 0.24], [x, 0.29, 0.0], CHAIR_WOOD);
  }
  kit.box([0.3, 0.03, 0.26], [0, 0.2, 0], CHAIR_WOOD);
  for (let i = 0; i < 4; i++) kit.box([0.03, 0.3, 0.015], [-0.09 + i * 0.06, 0.38, -0.155], CHAIR_WOOD, [-0.15, 0, 0]);
  kit.box([0.27, 0.025, 0.22], [0, 0.228, 0.01], "#c75b4a");
  kit.box([0.22, 0.2, 0.02], [0.02, 0.3, -0.12], "#5b7fa6", [-0.15, 0, 0.1]);
}

/** Keinutuoli: tap it and it rocks for a while, creaking. */
export const RockingChair = ({ fl }: { fl: number }) => {
  const rocker = useRef<THREE.Group>(null);
  const pushedAt = useRef(-100);
  const pending = useRef(false);
  const [msg, say] = useSay();
  useFrame(({ clock }) => {
    const now = clock.getElapsedTime();
    if (pending.current) {
      pushedAt.current = now;
      pending.current = false;
    }
    if (!rocker.current) return;
    const t = now - pushedAt.current;
    rocker.current.rotation.x = t < 6 ? Math.sin(t * 3.2) * 0.13 * Math.exp(-t * 0.45) : 0;
  });
  return (
    <group position={[-0.05, fl, -0.6]} rotation={[0, 0.25, 0]}>
      <Tappable
        onTap={() => {
          pending.current = true;
          playCreak();
          say("🪑 nirsk… nirsk…");
        }}
      >
        <group ref={rocker}>
          <KitMesh build={buildChair} />
        </group>
      </Tappable>
      <Bubble position={[0, 0.65, 0]} msg={msg} />
    </group>
  );
};

/** Käkikello: pendulum swings, tap for the cuckoo (and the time). */
export const CuckooClock = ({ fl, back }: { fl: number; back: number }) => {
  const pendulum = useRef<THREE.Group>(null);
  const bird = useRef<THREE.Group>(null);
  const door = useRef<THREE.Mesh>(null);
  const popAt = useRef(-100);
  const pending = useRef(false);
  const [msg, say] = useSay(2600);
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (pending.current) {
      popAt.current = t;
      pending.current = false;
    }
    if (pendulum.current) pendulum.current.rotation.z = Math.sin(t * Math.PI * 1.6) * 0.28;
    const p = t - popAt.current;
    const out = p < 1.5 ? Math.min(1, p * 6) * Math.min(1, (1.5 - p) * 6) : 0;
    if (bird.current) {
      bird.current.position.z = 0.03 + out * 0.05;
      bird.current.rotation.x = out > 0.9 ? Math.sin(p * 18) * 0.25 : 0;
    }
    if (door.current) door.current.rotation.y = -out * 1.6;
  });
  return (
    <group position={[-0.56, fl, back]}>
      <Tappable
        onTap={() => {
          pending.current = true;
          playCuckoo(2);
          const time = new Intl.DateTimeFormat("fi-FI", { timeZone: "Europe/Helsinki", hour: "2-digit", minute: "2-digit" }).format(new Date());
          say(`🐦 Kuku! Kuku! Kello on ${time}`);
        }}
      >
        <Block size={[0.13, 0.17, 0.05]} position={[0, 0.7, 0.025]} color="#6b4a2c" />
        <Block size={[0.1, 0.012, 0.07]} position={[-0.04, 0.805, 0.03]} rotation={[0, 0, 0.6]} color="#4a3220" />
        <Block size={[0.1, 0.012, 0.07]} position={[0.04, 0.805, 0.03]} rotation={[0, 0, -0.6]} color="#4a3220" />
        <mesh position={[0, 0.685, 0.052]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.037, 0.037, 0.006, 16]} />
          <meshStandardMaterial color="#f4efe3" />
        </mesh>
        <Block size={[0.004, 0.028, 0.004]} position={[0, 0.695, 0.057]} color="#222222" />
        <Block size={[0.02, 0.004, 0.004]} position={[0.008, 0.685, 0.058]} color="#222222" />
        {/* Little door and the bird behind it */}
        <group position={[-0.018, 0.765, 0.051]}>
          <mesh ref={door} position={[0.018, 0, 0]}>
            <boxGeometry args={[0.036, 0.034, 0.004]} />
            <meshStandardMaterial color="#3d2a18" />
          </mesh>
        </group>
        <group ref={bird} position={[0, 0.765, 0.03]}>
          <mesh scale={[0.6, 0.6, 1]}>
            <sphereGeometry args={[0.018, 8, 6]} />
            <meshStandardMaterial color="#d9a441" />
          </mesh>
          <mesh position={[0, 0, 0.02]} rotation={[Math.PI / 2, 0, 0]}>
            <coneGeometry args={[0.005, 0.014, 5]} />
            <meshStandardMaterial color="#c0392b" />
          </mesh>
        </group>
        {/* Pendulum and pine-cone weights */}
        <group ref={pendulum} position={[0, 0.615, 0.045]}>
          <Block size={[0.005, 0.12, 0.004]} position={[0, -0.06, 0]} color={C.coin} />
          <mesh position={[0, -0.12, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.016, 0.016, 0.005, 12]} />
            <meshStandardMaterial color={C.coin} metalness={0.6} roughness={0.3} />
          </mesh>
        </group>
        {[-0.035, 0.035].map((x, i) => (
          <group key={x} position={[x, 0, 0.03]}>
            <Block size={[0.003, 0.14 + i * 0.05, 0.003]} position={[0, 0.545 - (0.14 + i * 0.05) / 2, 0]} color="#3a3a3d" />
            <mesh position={[0, 0.47 - i * 0.05, 0]} rotation={[Math.PI, 0, 0]}>
              <coneGeometry args={[0.012, 0.045, 6]} />
              <meshStandardMaterial color="#5a3d22" flatShading />
            </mesh>
          </group>
        ))}
        <HitBox size={[0.16, 0.46, 0.08]} position={[0, 0.62, 0.04]} />
      </Tappable>
      <Bubble position={[0, 0.92, 0.1]} msg={msg} />
    </group>
  );
};

/** Mökkiradio on its little table: tap to play a polka (and again to stop). */
export const Radio = ({ fl }: { fl: number }) => {
  const [on, setOn] = useState(false);
  const player = useRef<RadioPlayer | null>(null);
  const [msg, say] = useSay();
  useEffect(() => () => player.current?.stop(), []);
  return (
    <group position={[0.3, fl + 0.35, -0.75]}>
      <Tappable
        onTap={() => {
          playClick();
          if (on) {
            player.current?.stop();
            setOn(false);
            say("📻 Radio off");
            return;
          }
          player.current ??= new RadioPlayer();
          const playing = player.current.start();
          setOn(true);
          say(playing ? "📻 Mökkiradio: polkka soi!" : "📻 Mökkiradio (sound is muted)");
        }}
      >
        <Block size={[0.08, 0.035, 0.006]} position={[0, 0.01, 0.033]} color={on ? "#ffd27a" : "#e8dcc2"} emissive={on ? "#ffb347" : undefined} emissiveIntensity={on ? 1.2 : 0} />
        <HitBox size={[0.16, 0.12, 0.1]} position={[0, 0, 0]} />
      </Tappable>
      {on && <Notes position={[0.02, 0.14, 0]} />}
      <Bubble position={[0, 0.28, 0]} msg={msg} />
    </group>
  );
};

/** Pannukahvi on the kitchen counter: tap for a puff of steam. */
export const CoffeePot = ({ fl }: { fl: number }) => {
  const [puff, setPuff] = useState(0);
  const [msg, say] = useSay();
  return (
    <group position={[1.17, fl + 0.43, -0.16]}>
      <Tappable
        onTap={() => {
          setPuff((p) => p + 1);
          playLoyly();
          say("☕ Pannukahvit valmiina!");
        }}
      >
        <HitBox size={[0.14, 0.16, 0.14]} />
      </Tappable>
      <Burst position={[0, 0.07, 0]} trigger={puff} color="#ffffff" count={8} radius={0.06} rise={0.3} duration={1.6} size={0.05} />
      <Bubble position={[-0.1, 0.3, 0]} msg={msg} />
    </group>
  );
};

/** The leivinuuni's fire door: flares the fire, or tells you it's cold. */
export const OvenDoor = ({ fl, fire, onFlare }: { fl: number; fire: boolean; onFlare: () => void }) => {
  const [msg, say] = useSay(3200);
  return (
    <group position={[0.75, fl, -0.3]}>
      <Tappable
        onTap={() => {
          if (fire) {
            onFlare();
            playCrackle();
            say("🔥 Puut rätisevät uunissa");
          } else {
            playClick();
            say("🪵 The oven is cold. Play today's game to light it");
          }
        }}
      >
        <HitBox size={[0.36, 0.6, 0.06]} position={[0, 0.32, 0.02]} />
      </Tappable>
      <Bubble position={[0, 0.75, 0.15]} msg={msg} />
    </group>
  );
};

/** Pendant lamp switch (the light itself is in DetailedCabin). */
export const LampSwitch = ({ fl, onToggle, on }: { fl: number; onToggle: () => void; on: boolean }) => {
  const [msg, say] = useSay(1600);
  return (
    <group position={[-0.85, fl + 0.77, 0.55]}>
      <Tappable
        onTap={() => {
          playClick();
          onToggle();
          say(on ? "💡 Click" : "💡 Valot päälle");
        }}
      >
        <HitBox size={[0.28, 0.14, 0.28]} />
      </Tappable>
      <Bubble position={[0, 0.2, 0]} msg={msg} />
    </group>
  );
};

/** Easter egg: a golden die lost under the bunk bed (with a stray sock). */
export const LostDie = ({ fl }: { fl: number }) => {
  const die = useRef<THREE.Group>(null);
  const spinAt = useRef(-100);
  const pending = useRef(false);
  const [msg, say] = useSay(3200);
  const [sparkle, setSparkle] = useState(0);
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (pending.current) {
      spinAt.current = t;
      pending.current = false;
    }
    if (!die.current) return;
    const p = t - spinAt.current;
    const k = p < 1.2 ? p / 1.2 : 1;
    die.current.position.y = 0.016 + (p < 1.2 ? Math.sin(Math.PI * k) * 0.08 : 0);
    die.current.rotation.y = 0.4 + (p < 1.2 ? (1 - Math.pow(1 - k, 3)) * Math.PI * 4 : 0);
  });
  const pip: Vec3[] = [
    [-0.008, 0.016, -0.008],
    [0, 0.016, 0],
    [0.008, 0.016, 0.008],
  ];
  return (
    // Peeking out from under the bunk bed
    <group position={[-0.7, fl, -0.52]}>
      <Tappable
        onTap={() => {
          pending.current = true;
          setSparkle((s) => s + 1);
          playChime();
          say("✨ You found the lost golden die! Lucky throws tomorrow");
        }}
      >
        <group ref={die}>
          <mesh>
            <boxGeometry args={[0.032, 0.032, 0.032]} />
            <meshStandardMaterial color="#e6b422" metalness={0.8} roughness={0.25} emissive="#5a3d00" emissiveIntensity={0.3} />
          </mesh>
          {pip.map((p, i) => (
            <mesh key={i} position={p} rotation={[-Math.PI / 2, 0, 0]}>
              <circleGeometry args={[0.0035, 8]} />
              <meshBasicMaterial color="#5a3d00" />
            </mesh>
          ))}
        </group>
        <HitBox size={[0.09, 0.07, 0.09]} position={[0, 0.03, 0]} />
      </Tappable>
      {/* The sock */}
      <Block size={[0.09, 0.012, 0.035]} position={[-0.13, 0.006, -0.06]} rotation={[0, 0.7, 0]} color="#c0392b" />
      <Block size={[0.02, 0.013, 0.036]} position={[-0.105, 0.007, -0.04]} rotation={[0, 0.7, 0]} color={C.white} />
      <Burst position={[0, 0.04, 0]} trigger={sparkle} color={C.coin} count={12} radius={0.15} rise={0.25} duration={1.2} size={0.02} />
      <Bubble position={[0.1, 0.45, 0.2]} msg={msg} />
    </group>
  );
};

/** Visiting: a notepad hangs on the closed door. Tap it to leave a note; tap the door to knock. */
export const DoorNotepad = ({ fl, front, visit }: { fl: number; front: number; visit: CabinVisit }) => {
  const [msg, say] = useSay(3000);
  const x = CABIN_DOOR.x;
  const z = front - 0.012;
  return (
    <group position={[x, fl, z]}>
      <Tappable
        onTap={() => {
          playHammer();
          say("🚪 Knock knock… nobody answers. Leave a note!");
        }}
      >
        <HitBox size={[CABIN_DOOR.width - 0.02, 0.84, 0.02]} position={[0, 0.43, 0.01]} />
      </Tappable>
      <Tappable onTap={visit.onNotepad}>
        <group position={[0.1, 0.36, 0.01]}>
          <Block size={[0.11, 0.14, 0.008]} color="#f7f1dc" />
          <Block size={[0.11, 0.02, 0.01]} position={[0, 0.06, 0.001]} color="#c0392b" />
          {[0.02, -0.005, -0.03, -0.055].map((y) => (
            <Block key={y} size={[0.085, 0.003, 0.009]} position={[0, y, 0.001]} color="#9fb7cf" />
          ))}
          <Block size={[0.008, 0.11, 0.008]} position={[0.07, -0.02, 0.006]} rotation={[0, 0, 0.15]} color={C.coin} />
          {/* Sticky notes you've already left today */}
          {Array.from({ length: Math.min(visit.notes, 3) }, (_, i) => (
            <Block key={i} size={[0.06, 0.06, 0.004]} position={[-0.115 - (i % 2) * 0.02, 0.06 - i * 0.07, 0.002]} rotation={[0, 0, (i % 2 ? -1 : 1) * 0.12]} color={["#ffe28a", "#f7b7a3", "#bfe3b4"][i]} />
          ))}
          <HitBox size={[0.2, 0.24, 0.04]} position={[-0.03, 0, 0.01]} />
        </group>
      </Tappable>
      <Bubble position={[0, 1.05, 0.1]} msg={msg} />
    </group>
  );
};
