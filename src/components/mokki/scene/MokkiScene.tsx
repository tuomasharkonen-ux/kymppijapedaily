import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import type { MokkiPieceId } from "@/lib/mokki";
import type { MokkiEnvironment } from "../environment";
import { SEASON_PALETTES } from "../palette";
import { SkyBackdrop } from "../SkyBackdrop";
import { Cabin, CABIN_CHIMNEY_TOP } from "./Cabin";
import { Birch, DioramaBase, FarShore, GROUND_Y, Island, Islet, Mushrooms, Pine, ShoreRocks, Water } from "./Nature";
import { Interactive, Kiulu, Mailbox, NoticeBoard, PORCH_POSITIONS, PorchTable } from "./Porch";
import {
  Grillikota,
  HAMMOCK_BIRCHES,
  Huussi,
  Kokko,
  Laituri,
  Lipputanko,
  Marjapensaat,
  Palju,
  PieceSlot,
  Puuvaja,
  Riippumatto,
  Sauna,
  Snowfall,
  Soutuvene,
  type PieceStatus,
} from "./Pieces";
import { Burst, Smoke } from "./primitives";

type Vec3 = [number, number, number];

export interface ScenePiece {
  id: MokkiPieceId;
  status: PieceStatus;
  remainingDays: number;
  /** Play the drop-in + dust animation (first time seen complete). */
  justCompleted: boolean;
}

export interface PorchHandlers {
  hasMail: boolean;
  potTotal: number | null;
  onMailboxClick?: () => void;
}

export interface MokkiSceneProps {
  env: MokkiEnvironment;
  pieces: ScenePiece[];
  /** Chimney smoke: the owner has played today. */
  showSmoke: boolean;
  /** Increment to play a big löyly steam puff. */
  loylyKey?: number;
  mushrooms: boolean;
  skin: string;
  mode: "hero" | "full";
  porch?: PorchHandlers;
  onBackgroundClick?: () => void;
  onPieceLanded?: (id: MokkiPieceId) => void;
  className?: string;
}

const TARGET = new THREE.Vector3(0.4, 0.5, 0.3);
// Full view looks a little higher so the far-shore treetops stay in frame
const TARGET_FULL = new THREE.Vector3(0.4, 1.3, 0.3);
const ISO_POLAR = 0.98; // ~56° from vertical
const ISO_AZIMUTH = Math.PI / 4;
const CAMERA_DISTANCE = 40;

function cameraPosition(azimuth: number, polar: number, target: THREE.Vector3 = TARGET): Vec3 {
  return [
    target.x + CAMERA_DISTANCE * Math.sin(polar) * Math.sin(azimuth),
    target.y + CAMERA_DISTANCE * Math.cos(polar),
    target.z + CAMERA_DISTANCE * Math.sin(polar) * Math.cos(azimuth),
  ];
}

/** Fits the orthographic zoom to the canvas; in hero mode also gently sways the camera. */
const CameraRig = ({ mode, onFit }: { mode: "hero" | "full"; onFit: (zoom: number) => void }) => {
  const { camera, size } = useThree();
  useEffect(() => {
    // Hero crops into the island; full view shows the whole lake (portrait screens crop the lake sides)
    const portrait = size.height > size.width;
    const fit =
      mode === "hero"
        ? Math.min(size.width / 15.5, size.height / 10.5)
        : Math.min(size.width / (portrait ? 13.5 : 19.5), size.height / (portrait ? 13 : 15));
    camera.zoom = fit;
    camera.updateProjectionMatrix();
    onFit(fit);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size.width, size.height, mode, camera]);

  useFrame(({ clock }) => {
    if (mode !== "hero") return;
    const t = clock.getElapsedTime();
    const [x, y, z] = cameraPosition(ISO_AZIMUTH + Math.sin(t * 0.12) * 0.07, ISO_POLAR);
    camera.position.set(x, y, z);
    camera.lookAt(TARGET);
  });
  return null;
};

/** Every mesh casts/receives shadows unless flagged (smoke, water, sky effects). */
const ShadowSetup = ({ deps }: { deps: unknown[] }) => {
  const { scene } = useThree();
  useEffect(() => {
    scene.traverse((obj) => {
      if (!(obj as THREE.Mesh).isMesh) return;
      const noShadow = obj.userData.noShadow;
      obj.castShadow = !noShadow && !obj.userData.noCast;
      obj.receiveShadow = !noShadow;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return null;
};

const BIRCHES: Vec3[] = [
  ...HAMMOCK_BIRCHES,
  [-1.0, GROUND_Y, -3.45],
  [1.35, GROUND_Y, -3.1],
  [-4.1, GROUND_Y, 1.95],
  [2.85, GROUND_Y, -3.4],
  [-3.15, GROUND_Y, 2.95],
];
const PINES: Vec3[] = [
  [-4.1, GROUND_Y, -1.95],
  [-3.65, GROUND_Y, -3.1],
  [0.2, GROUND_Y, -3.95],
  [-4.45, GROUND_Y, 0.85],
  [-1.95, GROUND_Y, -3.85],
];

const Diorama = (props: MokkiSceneProps) => {
  const { env, pieces, showSmoke, loylyKey = 0, mushrooms, skin, mode, porch, onPieceLanded } = props;
  const palette = SEASON_PALETTES[env.season];
  const snow = palette.snow;
  const lightsOn = env.lightsOn;
  const byId = useMemo(() => new Map(pieces.map((p) => [p.id, p])), [pieces]);
  const isComplete = (id: MokkiPieceId) => byId.get(id)?.status === "complete";
  const showLabel = true;

  const slot = (id: MokkiPieceId, node: React.ReactNode) => {
    const piece = byId.get(id);
    if (!piece) return null;
    return (
      <PieceSlot
        key={id}
        id={id}
        status={piece.status}
        remainingDays={piece.remainingDays}
        justCompleted={piece.justCompleted}
        showLabel={showLabel}
        onLanded={onPieceLanded}
      >
        {node}
      </PieceSlot>
    );
  };

  const sunDir = new THREE.Vector3(...env.sunDirection).normalize().multiplyScalar(22);

  return (
    <>
      <hemisphereLight args={[env.hemiSky, env.hemiGround, env.hemiIntensity]} />
      <ambientLight intensity={0.15} />
      <directionalLight
        position={[sunDir.x, sunDir.y, sunDir.z]}
        color={env.sunColor}
        intensity={env.sunIntensity}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.02}
        shadow-camera-left={-12}
        shadow-camera-right={12}
        shadow-camera-top={12}
        shadow-camera-bottom={-12}
        shadow-camera-near={1}
        shadow-camera-far={60}
      />

      <DioramaBase palette={palette} />
      <Water palette={palette} animate />
      <FarShore palette={palette} />
      <Island palette={palette} />
      <ShoreRocks snow={snow} />
      <Islet snow={snow}>{env.juhannus && <Kokko />}</Islet>

      {BIRCHES.map((p, i) => (
        <Birch key={`b${i}`} position={p} palette={palette} seed={i} scale={0.95 + (i % 3) * 0.1} />
      ))}
      {PINES.map((p, i) => (
        <Pine key={`p${i}`} position={p} palette={palette} scale={0.9 + (i % 2) * 0.2} />
      ))}
      {mushrooms && env.season === "autumn" && <Mushrooms />}

      <Cabin lightsOn={lightsOn} snow={snow} />
      {showSmoke && <Smoke position={CABIN_CHIMNEY_TOP} />}
      {!isComplete("sauna") && <Burst position={CABIN_CHIMNEY_TOP} trigger={loylyKey} color="#ffffff" count={22} radius={1.3} rise={1.8} duration={2.6} size={0.5} />}

      {/* Porch objects */}
      <group position={PORCH_POSITIONS.table}>
        <PorchTable skin={skin} />
      </group>
      <Interactive position={PORCH_POSITIONS.mailbox} onClick={porch?.onMailboxClick} label="mailbox" hint={mode === "hero" && !!porch?.hasMail} ringRadius={0.4}>
        <group scale={1.3}>
          <Mailbox hasMail={!!porch?.hasMail} snow={snow} />
        </group>
      </Interactive>
      {porch && porch.potTotal !== null && (
        <group position={PORCH_POSITIONS.kiulu}>
          <Kiulu potTotal={porch.potTotal} />
        </group>
      )}
      <group position={PORCH_POSITIONS.noticeBoard}>
        <NoticeBoard snow={snow} />
      </group>

      {/* Buildable pieces */}
      {slot("sauna", <Sauna lightsOn={lightsOn} snow={snow} smoke={showSmoke} loylyKey={loylyKey} />)}
      {slot("laituri", <Laituri snow={snow} />)}
      {slot("soutuvene", <Soutuvene frozen={palette.frozen} />)}
      {slot("palju", <Palju frozen={palette.frozen} snow={snow} />)}
      {slot("huussi", <Huussi snow={snow} />)}
      {slot("puuvaja", <Puuvaja snow={snow} />)}
      {slot("grillikota", <Grillikota snow={snow} smoke={showSmoke} lightsOn={lightsOn} />)}
      {slot("lipputanko", <Lipputanko juhannus={env.juhannus} />)}
      {slot("riippumatto", <Riippumatto />)}
      {slot("marjapensaat", <Marjapensaat palette={palette} />)}

      {snow && <Snowfall />}

      <ShadowSetup deps={[pieces, env.season, env.juhannus, porch?.potTotal, porch?.hasMail, mushrooms]} />
    </>
  );
};

/** Pauses rendering while the scene is off-screen or the tab is hidden. */
function useVisible(ref: React.RefObject<HTMLElement>) {
  const [inView, setInView] = useState(true);
  const [pageVisible, setPageVisible] = useState(typeof document === "undefined" || !document.hidden);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0.01 });
    io.observe(el);
    return () => io.disconnect();
  }, [ref]);
  useEffect(() => {
    const onChange = () => setPageVisible(!document.hidden);
    document.addEventListener("visibilitychange", onChange);
    return () => document.removeEventListener("visibilitychange", onChange);
  }, []);
  return inView && pageVisible;
}

const MokkiScene = (props: MokkiSceneProps) => {
  const { env, mode, onBackgroundClick, className } = props;
  const container = useRef<HTMLDivElement>(null);
  const visible = useVisible(container);
  const [fitZoom, setFitZoom] = useState(30);
  const target = mode === "full" ? TARGET_FULL : TARGET;
  const initialPosition = useMemo(() => cameraPosition(ISO_AZIMUTH, ISO_POLAR, target), [target]);

  return (
    <div ref={container} className={`relative h-full w-full overflow-hidden ${className ?? ""}`}>
      <SkyBackdrop env={env} />
      <Canvas
        orthographic
        shadows
        dpr={[1, 1.75]}
        frameloop={visible ? "always" : "never"}
        gl={{ antialias: true, alpha: true }}
        camera={{ position: initialPosition, zoom: 30, near: 1, far: 200 }}
        onCreated={({ camera }) => camera.lookAt(target)}
        onPointerMissed={() => onBackgroundClick?.()}
        style={{ position: "absolute", inset: 0, touchAction: mode === "full" ? "none" : "pan-y" }}
      >
        <CameraRig mode={mode} onFit={setFitZoom} />
        <group onClick={() => onBackgroundClick?.()}>
          <Diorama {...props} />
        </group>
        {mode === "full" && (
          <OrbitControls
            target={target}
            enablePan={false}
            enableDamping
            dampingFactor={0.08}
            minAzimuthAngle={ISO_AZIMUTH - 0.75}
            maxAzimuthAngle={ISO_AZIMUTH + 0.75}
            minPolarAngle={0.7}
            maxPolarAngle={1.2}
            minZoom={fitZoom * 0.8}
            maxZoom={fitZoom * 2.6}
            rotateSpeed={0.6}
          />
        )}
      </Canvas>
    </div>
  );
};

export default MokkiScene;
