import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import type { DogBreedId, FlagId, MokkiPieceId } from "@/lib/mokki";
import type { MokkiEnvironment } from "../environment";
import { SEASON_PALETTES } from "../palette";
import { SkyBackdrop } from "../SkyBackdrop";
import { Cabin, CABIN_CHIMNEY_TOP } from "./Cabin";
import { Birch, DioramaBase, FarShore, GROUND_Y, Island, Islet, Mushrooms, Pine, ShoreRocks, Water } from "./Nature";
import { Interactive, Kiulu, Mailbox, NoticeBoard, PORCH_POSITIONS, PorchTable } from "./Porch";
import {
  Grillikota,
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
import { BIRCHES, birchScale, PINES } from "./layout";
import { Koirankoppi, Nuotiopaikka, Onkipaikka, Riukuaita } from "./Pihapiiri";
import { Dog } from "./Dog";
import { Marjavarkaus, Vessapaperi } from "./Effects";
import { createFirstPersonInput, FirstPersonOverlay, FirstPersonRig, Horizon, useWalkTouchLock, WALK_SCALE } from "./FirstPerson";
import type { CabinVisit, DetailKit, PorchDailyGame, RunWalkActivity, WalkActivity } from "./detail/types";

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
  /** "crop" zooms into the island (card hero); "island" frames the whole floating island (home backdrop). */
  framing?: "crop" | "island";
  /** Draw the sky behind the canvas (off when a parent paints a full-width sky). */
  sky?: boolean;
  porch?: PorchHandlers;
  /** Called when the island is tapped (and, unless islandOnly, when empty space is tapped). */
  onBackgroundClick?: () => void;
  islandOnly?: boolean;
  onPieceLanded?: (id: MokkiPieceId) => void;
  className?: string;
  /** The island's dog, once the Koira is finished. */
  dog?: SceneDog | null;
  /** Flag on the Lipputanko (default siniristi). A Swedish-flag prank overrides it. */
  flag?: FlagId;
  /** Prank marks showing on the island. */
  effects?: SceneEffect[];
  /** Today's palju guests: their heads bob in the tub. */
  paljuGuests?: string[];
  /** Tapping the dog (own island: opens the dog sheet). */
  onDogClick?: () => void;
  /** Tapping a prank mark (own island: clean it up). */
  onEffectClick?: (effectId: string) => void;
  /** Full mode: walk around the island at eye level instead of the overview camera. */
  firstPerson?: boolean;
  /** Esc pressed while walking. */
  onExitFirstPerson?: () => void;
  /** Visiting someone else's mökki: walk mode shows their door shut, with a notepad. */
  visit?: CabinVisit;
  /** Walk mode: today's game can be played on the porch table (own island, not played yet). */
  porchGame?: PorchDailyGame;
  /** Walk mode: chores / löyly / visits / pranks, as markers over their spots. */
  walkActivities?: { activities: WalkActivity[]; onRun: RunWalkActivity };
  /** Dev preview only: look at a point, zoomed in (full mode). */
  debugFocus?: { target: Vec3; zoom: number };
}

export interface SceneDog {
  breed: DogBreedId;
  name: string;
}

export interface SceneEffect {
  id: string;
  /** MOKKI_ACTIONS id: vessapaperi, ruotsin_lippu, marjavarkaus. */
  actionId: string;
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
const CameraRig = ({
  mode,
  framing,
  onFit,
  zoomFactor = 1,
}: {
  mode: "hero" | "full";
  framing: "crop" | "island";
  onFit: (zoom: number) => void;
  zoomFactor?: number;
}) => {
  const { camera, size } = useThree();
  useEffect(() => {
    // Hero crops into the island; the backdrop shows the whole floating island; full view shows
    // the whole lake (portrait screens crop the lake sides)
    const portrait = size.height > size.width;
    const fit =
      mode === "hero"
        ? framing === "island"
          ? Math.min(size.width / 23, size.height / 13.5)
          : Math.min(size.width / 15.5, size.height / 10.5)
        : Math.min(size.width / (portrait ? 13.5 : 19.5), size.height / (portrait ? 13 : 15));
    camera.zoom = fit * zoomFactor;
    camera.updateProjectionMatrix();
    onFit(fit);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size.width, size.height, mode, framing, camera, zoomFactor]);

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

// Walk mode's high-detail models live in their own chunk: fetched the first time someone starts walking
let detailKitPromise: Promise<DetailKit> | null = null;
const loadDetailKit = () => (detailKitPromise ??= import("./detail").then((m) => m.default));

function useDetailKit(enabled: boolean) {
  const [kit, setKit] = useState<DetailKit | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    if (!enabled || kit) return;
    let live = true;
    loadDetailKit().then(
      (k) => live && setKit(k),
      () => {
        detailKitPromise = null;
        if (live) setFailed(true);
      },
    );
    return () => {
      live = false;
    };
  }, [enabled, kit]);
  return { kit: enabled ? kit : null, failed: enabled && failed };
}

/** Compiles every shader in the scene (in parallel where supported), then waits a couple of frames. */
const CompileGate = ({ onReady }: { onReady: () => void }) => {
  const { gl, scene, camera } = useThree();
  useEffect(() => {
    let live = true;
    const done = () => {
      let frames = 0;
      const tick = () => {
        if (!live) return;
        if (++frames < 3) requestAnimationFrame(tick);
        else onReady();
      };
      requestAnimationFrame(tick);
    };
    const compile = gl.compileAsync ? gl.compileAsync(scene, camera) : Promise.resolve(gl.compile(scene, camera));
    compile.then(done, done);
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
};

const WalkLoading = ({ env, ready, failed }: { env: MokkiEnvironment; ready: boolean; failed: boolean }) => (
  <div
    className={`absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 text-white transition-opacity duration-500 ${ready ? "pointer-events-none opacity-0" : "opacity-100"}`}
    style={{ background: `linear-gradient(to bottom, ${env.skyTop}, ${env.skyBottom})` }}
    role="status"
    aria-hidden={ready}
  >
    <style>{`@keyframes mokki-walk { 0%, 100% { transform: translateY(0) rotate(-4deg) } 50% { transform: translateY(-6px) rotate(4deg) } }`}</style>
    <div className="text-5xl drop-shadow" style={{ animation: "mokki-walk 0.7s ease-in-out infinite" }} aria-hidden="true">
      🚶
    </div>
    <p className="rounded-full bg-black/40 px-4 py-1.5 text-sm font-semibold backdrop-blur-sm">
      {failed ? "Couldn't load the detailed mökki, walking anyway…" : "Walking over to the mökki…"}
    </p>
  </div>
);

const Diorama = (props: MokkiSceneProps & { detail?: DetailKit | null }) => {
  const { env, pieces, showSmoke, loylyKey = 0, mushrooms, skin, mode, porch, onPieceLanded } = props;
  const { dog, flag, effects = [], paljuGuests = [], onDogClick, onEffectClick, firstPerson, detail } = props;
  const full = mode === "full";
  const effectOf = (actionId: string) => effects.find((e) => e.actionId === actionId);
  const cleanUp = (actionId: string) => {
    const effect = effectOf(actionId);
    return effect && onEffectClick ? () => onEffectClick(effect.id) : undefined;
  };
  const swedishFlag = effectOf("ruotsin_lippu");
  const raided = !!effectOf("marjavarkaus");
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

      {firstPerson ? <Horizon env={env} palette={palette} /> : <DioramaBase palette={palette} />}
      <Water palette={palette} animate />
      <FarShore palette={palette} />
      <Island palette={palette} />
      <ShoreRocks snow={snow} />
      <Islet snow={snow}>{env.juhannus && <Kokko />}</Islet>

      {BIRCHES.map((p, i) => (
        <Birch key={`b${i}`} position={p} palette={palette} seed={i} scale={birchScale(i)} />
      ))}
      {PINES.map((p, i) => (
        <Pine key={`p${i}`} position={p} palette={palette} scale={0.9 + (i % 2) * 0.2} />
      ))}
      {mushrooms && env.season === "autumn" && <Mushrooms />}

      {detail ? <detail.Cabin lightsOn={lightsOn} snow={snow} fire={showSmoke} visit={props.visit} /> : <Cabin lightsOn={lightsOn} snow={snow} />}
      {detail && <detail.Ground palette={palette} season={env.season} pieces={pieces} />}
      {detail && <detail.Wildlife frozen={palette.frozen} pieces={pieces} />}
      {detail && props.walkActivities && <detail.Activities activities={props.walkActivities.activities} onRun={props.walkActivities.onRun} pieces={pieces} />}
      {showSmoke && <Smoke position={CABIN_CHIMNEY_TOP} />}
      {!isComplete("sauna") && <Burst position={CABIN_CHIMNEY_TOP} trigger={loylyKey} color="#ffffff" count={22} radius={1.3} rise={1.8} duration={2.6} size={0.5} />}

      {/* Porch objects */}
      <group position={PORCH_POSITIONS.table}>
        {detail ? <detail.PorchDice skin={skin} daily={props.porchGame} /> : <PorchTable skin={skin} />}
      </group>
      <Interactive position={PORCH_POSITIONS.mailbox} onClick={porch?.onMailboxClick} label="mailbox" hint={mode === "hero" && !!porch?.hasMail} ringRadius={0.4}>
        <group scale={firstPerson ? WALK_SCALE.mailbox : 1.3}>
          <Mailbox hasMail={!!porch?.hasMail} snow={snow} />
        </group>
      </Interactive>
      {porch && porch.potTotal !== null && (
        <group position={PORCH_POSITIONS.kiulu} scale={firstPerson ? WALK_SCALE.kiulu : 1}>
          <Kiulu potTotal={porch.potTotal} />
        </group>
      )}
      <group position={PORCH_POSITIONS.noticeBoard} scale={firstPerson ? WALK_SCALE.noticeBoard : 1}>
        <NoticeBoard snow={snow} />
      </group>

      {/* Buildable pieces */}
      {slot(
        "sauna",
        detail ? (
          <detail.Sauna lightsOn={lightsOn} snow={snow} smoke={showSmoke} loylyKey={loylyKey} />
        ) : (
          <Sauna lightsOn={lightsOn} snow={snow} smoke={showSmoke} loylyKey={loylyKey} />
        ),
      )}
      {slot("laituri", <Laituri snow={snow} />)}
      {slot("soutuvene", <Soutuvene frozen={palette.frozen} />)}
      {slot("palju", <Palju frozen={palette.frozen} snow={snow} guests={paljuGuests} showLabels={full} scale={firstPerson ? WALK_SCALE.palju : 1} />)}
      {slot("huussi", <Huussi snow={snow} />)}
      {slot("puuvaja", <Puuvaja snow={snow} />)}
      {slot("grillikota", <Grillikota snow={snow} smoke={showSmoke} lightsOn={lightsOn} />)}
      {slot("lipputanko", <Lipputanko juhannus={env.juhannus} flag={swedishFlag ? "ruotsi" : flag} onFlagClick={cleanUp("ruotsin_lippu")} />)}
      {slot("riippumatto", <Riippumatto />)}
      {slot("marjapensaat", <Marjapensaat palette={palette} raided={raided} />)}
      {slot("nuotiopaikka", <Nuotiopaikka fire={showSmoke} snow={snow} lightsOn={lightsOn} />)}
      {slot("onkipaikka", <Onkipaikka frozen={palette.frozen} snow={snow} />)}
      {slot("riukuaita", <Riukuaita snow={snow} />)}
      {slot("koira", <Koirankoppi snow={snow} scale={firstPerson ? WALK_SCALE.koppi : 1} />)}

      {/* The dog moves in once the doghouse is finished */}
      {isComplete("koira") && !byId.get("koira")?.justCompleted && dog && <Dog breed={dog.breed} name={dog.name} night={env.timeOfDay === "night"} showLabels={full} onClick={onDogClick} />}

      {/* Pranks from the neighbors */}
      {effectOf("vessapaperi") && <Vessapaperi onClick={cleanUp("vessapaperi")} />}
      {raided && isComplete("marjapensaat") && <Marjavarkaus onClick={cleanUp("marjavarkaus")} />}

      {snow && <Snowfall />}

      <ShadowSetup
        deps={[pieces, !!detail, env.season, env.juhannus, porch?.potTotal, porch?.hasMail, mushrooms, dog?.breed, flag, effects.map((e) => e.actionId).join(), paljuGuests.join()]}
      />
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
  const { env, mode, onBackgroundClick, className, framing = "crop", sky = true, islandOnly = false } = props;
  const container = useRef<HTMLDivElement>(null);
  const visible = useVisible(container);
  const [fitZoom, setFitZoom] = useState(30);
  const { debugFocus, onExitFirstPerson } = props;
  const firstPerson = mode === "full" && !!props.firstPerson;
  const fpInput = useRef(createFirstPersonInput());
  const detail = useDetailKit(firstPerson);
  useWalkTouchLock(container, firstPerson);
  const [walkReady, setWalkReady] = useState(false);
  useEffect(() => {
    if (!firstPerson) setWalkReady(false);
    else if (detail.failed) setWalkReady(true);
  }, [firstPerson, detail.failed]);
  const target = useMemo(
    () => (debugFocus ? new THREE.Vector3(...debugFocus.target) : mode === "full" ? TARGET_FULL : TARGET),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [mode, debugFocus?.target.join()],
  );
  const initialPosition = useMemo(() => cameraPosition(ISO_AZIMUTH, ISO_POLAR, target), [target]);

  return (
    <div
      ref={container}
      className={`relative h-full w-full overflow-hidden ${firstPerson ? "touch-none select-none [-webkit-touch-callout:none]" : ""} ${className ?? ""}`}
    >
      {sky && <SkyBackdrop env={env} />}
      <Canvas
        orthographic
        shadows
        dpr={[1, 1.75]}
        frameloop={visible ? "always" : "never"}
        gl={{ antialias: true, alpha: true }}
        camera={{ position: initialPosition, zoom: 30, near: 1, far: 200 }}
        onCreated={({ camera }) => camera.lookAt(target)}
        onPointerMissed={() => !islandOnly && onBackgroundClick?.()}
        style={{ position: "absolute", inset: 0, touchAction: mode === "full" ? "none" : "pan-y" }}
      >
        {firstPerson ? (
          <FirstPersonRig
            pieces={props.pieces}
            frozen={SEASON_PALETTES[env.season].frozen}
            input={fpInput}
            extras={detail.kit?.walk}
            doorClosed={!!props.visit}
            onExit={onExitFirstPerson}
          />
        ) : (
          <CameraRig mode={mode} framing={framing} onFit={setFitZoom} zoomFactor={debugFocus?.zoom} />
        )}
        <group
          onClick={(e) => {
            // One tap hits several meshes; open the mökki once
            e.stopPropagation();
            onBackgroundClick?.();
          }}
        >
          <Diorama {...props} firstPerson={firstPerson} detail={detail.kit} />
        </group>
        {mode === "full" && !firstPerson && (
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
            maxZoom={fitZoom * Math.max(2.6, debugFocus?.zoom ?? 0)}
            rotateSpeed={0.6}
          />
        )}
        {firstPerson && detail.kit && !walkReady && <CompileGate onReady={() => setWalkReady(true)} />}
      </Canvas>
      {firstPerson && <WalkLoading env={env} ready={walkReady} failed={detail.failed} />}
      {firstPerson && walkReady && <FirstPersonOverlay input={fpInput} />}
    </div>
  );
};

export default MokkiScene;
