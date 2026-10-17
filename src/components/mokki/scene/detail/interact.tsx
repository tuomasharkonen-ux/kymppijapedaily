import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { type ThreeEvent } from "@react-three/fiber";
import { Html, useCursor } from "@react-three/drei";

type Vec3 = [number, number, number];

/** Group that reacts to a tap/click, but not to the end of a look-around drag. */
export const Tappable = ({
  onTap,
  children,
  position,
  rotation,
}: {
  onTap: (e: ThreeEvent<MouseEvent>) => void;
  children: ReactNode;
  position?: Vec3;
  rotation?: Vec3;
}) => {
  const [hover, setHover] = useState(false);
  useCursor(hover);
  return (
    <group
      position={position}
      rotation={rotation}
      onClick={(e) => {
        e.stopPropagation();
        if (e.delta > 10) return;
        onTap(e);
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHover(true);
      }}
      onPointerOut={() => setHover(false)}
    >
      {children}
    </group>
  );
};

/** Invisible box that only exists to be tapped (for things merged into a bigger mesh). */
export const HitBox = ({ size, position }: { size: Vec3; position?: Vec3 }) => (
  <mesh position={position} userData={{ noShadow: true }}>
    <boxGeometry args={size} />
    <meshBasicMaterial colorWrite={false} depthWrite={false} transparent opacity={0} />
  </mesh>
);

/** Short-lived speech bubble: `say("Kuku!")` shows it for a moment. */
export function useSay(duration = 2600) {
  const [msg, setMsg] = useState<{ text: string; id: number } | null>(null);
  const timer = useRef<number>();
  const say = useCallback(
    (text: string) => {
      setMsg({ text, id: Date.now() });
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setMsg(null), duration);
    },
    [duration],
  );
  useEffect(() => () => window.clearTimeout(timer.current), []);
  return [msg, say] as const;
}

const BUBBLE_CSS = `
@keyframes mokki-bubble { 0% { opacity: 0; transform: translateY(8px) scale(0.9) } 12% { opacity: 1; transform: translateY(0) scale(1) } 80% { opacity: 1 } 100% { opacity: 0; transform: translateY(-14px) } }
@keyframes mokki-note { 0% { opacity: 0; transform: translate(0, 0) rotate(-10deg) } 20% { opacity: 1 } 100% { opacity: 0; transform: translate(14px, -34px) rotate(12deg) } }
`;

export const Bubble = ({ position, msg }: { position: Vec3; msg: { text: string; id: number } | null }) =>
  msg ? (
    <Html position={position} center zIndexRange={[6, 0]} pointerEvents="none">
      <style>{BUBBLE_CSS}</style>
      <div
        key={msg.id}
        className="whitespace-nowrap rounded-2xl bg-white/95 px-3 py-1 text-xs font-semibold text-slate-900 shadow-md ring-1 ring-black/10"
        style={{ animation: "mokki-bubble 2.6s ease-out forwards" }}
      >
        {msg.text}
      </div>
    </Html>
  ) : null;

/** Music notes drifting up while something plays. */
export const Notes = ({ position }: { position: Vec3 }) => (
  <Html position={position} center zIndexRange={[6, 0]} pointerEvents="none">
    <style>{BUBBLE_CSS}</style>
    <div className="relative h-6 w-6 text-base text-amber-200 drop-shadow">
      {["♪", "♫", "♪"].map((n, i) => (
        <span key={i} className="absolute left-0 top-0" style={{ animation: `mokki-note 1.8s ease-out ${i * 0.6}s infinite` }}>
          {n}
        </span>
      ))}
    </div>
  </Html>
);
