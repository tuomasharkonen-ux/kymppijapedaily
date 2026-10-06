import { lazy, Suspense, useMemo } from "react";
import type { MokkiPieceId } from "@/lib/mokki";
import type { MokkiEnvironment } from "./environment";
import type { ScenePiece } from "./scene/MokkiScene";
import { SkyBackdrop } from "./SkyBackdrop";
import { MokkiIllustration } from "./MokkiIllustration";

// All three.js code lives behind this lazy import
const MokkiScene = lazy(() => import("./scene/MokkiScene"));

export function hasWebGL(): boolean {
  if (typeof document === "undefined") return false;
  try {
    const canvas = document.createElement("canvas");
    return !!(canvas.getContext("webgl2") || canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

export interface MokkiHeroViewProps {
  env: MokkiEnvironment;
  pieces: ScenePiece[];
  showSmoke: boolean;
  loylyKey: number;
  mushrooms: boolean;
  skin: string;
  hasMail: boolean;
  potTotal: number | null;
  onMailboxClick: () => void;
  onKiuluClick: () => void;
  onNoticeBoardClick: () => void;
  onOpen: () => void;
  onPieceLanded?: (id: MokkiPieceId) => void;
  /** Toast-style line, e.g. "Matti sent you löyly 💨". */
  notice?: string | null;
}

const Chip = ({ onClick, children, highlight, label }: { onClick: () => void; children: React.ReactNode; highlight?: boolean; label: string }) => (
  <button
    type="button"
    onClick={(e) => {
      e.stopPropagation();
      onClick();
    }}
    aria-label={label}
    className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold shadow-md backdrop-blur transition hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-white ${
      highlight ? "bg-amber-300/95 text-amber-950 animate-pulse" : "bg-black/35 text-white"
    }`}
  >
    {children}
  </button>
);

export const MokkiHeroView = (props: MokkiHeroViewProps) => {
  const { env, pieces, showSmoke, hasMail, potTotal, onOpen, notice } = props;
  const webgl = useMemo(() => hasWebGL(), []);
  const building = pieces.filter((p) => p.status === "building").length;

  return (
    <div
      className="relative h-[45vh] min-h-[260px] max-h-[520px] w-full overflow-hidden rounded-2xl shadow-lg ring-1 ring-black/10 cursor-pointer select-none"
      onClick={webgl ? undefined : onOpen}
      role="region"
      aria-label="Your mökki"
    >
      {webgl ? (
        <Suspense
          fallback={
            <div className="absolute inset-0">
              <SkyBackdrop env={env} />
              <div className="absolute inset-0 flex items-center justify-center text-4xl animate-pulse" aria-hidden="true">
                🏡
              </div>
            </div>
          }
        >
          <MokkiScene
            env={env}
            pieces={pieces}
            showSmoke={showSmoke}
            loylyKey={props.loylyKey}
            mushrooms={props.mushrooms}
            skin={props.skin}
            mode="hero"
            porch={{
              hasMail,
              potTotal,
              onMailboxClick: props.onMailboxClick,
              onKiuluClick: props.onKiuluClick,
              onNoticeBoardClick: props.onNoticeBoardClick,
            }}
            onBackgroundClick={onOpen}
            onPieceLanded={props.onPieceLanded}
          />
        </Suspense>
      ) : (
        <div className="absolute inset-0">
          <SkyBackdrop env={env} />
          <MokkiIllustration className="absolute inset-x-0 bottom-0 mx-auto h-[85%]" />
        </div>
      )}

      {/* Title + status */}
      <div className="pointer-events-none absolute left-3 top-3 flex flex-col gap-1">
        <span className="rounded-full bg-black/35 px-3 py-1 text-sm font-bold text-white backdrop-blur">🏡 Mökki</span>
        {showSmoke ? (
          <span className="rounded-full bg-black/25 px-2 py-0.5 text-[11px] text-white/90 backdrop-blur">♨️ Sauna is warm</span>
        ) : (
          <span className="rounded-full bg-black/25 px-2 py-0.5 text-[11px] text-white/90 backdrop-blur">🪵 Play today to light the stove</span>
        )}
        {building > 0 && (
          <span className="rounded-full bg-black/25 px-2 py-0.5 text-[11px] text-white/90 backdrop-blur">🔨 {building} under construction</span>
        )}
      </div>

      {notice && (
        <div className="pointer-events-none absolute right-3 top-3 max-w-[60%] rounded-xl bg-white/90 px-3 py-1.5 text-xs font-semibold text-slate-800 shadow-md">
          {notice}
        </div>
      )}

      {/* Accessible porch actions (also mirrored as tappable 3D objects) */}
      <div className="absolute inset-x-0 bottom-3 flex flex-wrap items-center justify-center gap-2 px-3">
        <Chip onClick={props.onMailboxClick} highlight={hasMail} label={hasMail ? "Open mailbox: you have mail" : "Open mailbox"}>
          📬 {hasMail ? "Mail!" : "Mailbox"}
        </Chip>
        {potTotal !== null && (
          <Chip onClick={props.onKiuluClick} label={`Pot of the Day: ${potTotal} credits`}>
            ♨️ Pot {potTotal}
          </Chip>
        )}
        <Chip onClick={props.onNoticeBoardClick} label="Badges notice board">
          📋 Badges
        </Chip>
        <Chip onClick={onOpen} label="Open your mökki">
          🔨 Build
        </Chip>
      </div>
    </div>
  );
};
