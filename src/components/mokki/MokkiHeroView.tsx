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
  onOpen: () => void;
  onPieceLanded?: (id: MokkiPieceId) => void;
  /** Toast-style line, e.g. "Matti sent you löyly 💨". */
  notice?: string | null;
  /** "card": boxed hero. "backdrop": full-width sky behind the page header with the island floating below. */
  variant?: "card" | "backdrop";
  /** Page header rendered on the sky (backdrop variant). */
  header?: React.ReactNode;
}

// The backdrop fades into whatever page background is active (plain or premium)
const BACKDROP_FADE = "linear-gradient(to bottom, black calc(100% - 10rem), transparent)";

const Chip = ({ onClick, children, highlight, label }: { onClick: () => void; children: React.ReactNode; highlight?: boolean; label: string }) => (
  <button
    type="button"
    onClick={(e) => {
      e.stopPropagation();
      onClick();
    }}
    aria-label={label}
    className={`flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1.5 text-xs font-semibold shadow-md sm:px-3 backdrop-blur transition hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-white ${
      highlight ? "bg-amber-300 text-amber-950 animate-pulse" : "bg-black/55 text-white"
    }`}
  >
    {children}
  </button>
);

export const MokkiHeroView = (props: MokkiHeroViewProps) => {
  const { env, pieces, showSmoke, hasMail, potTotal, onOpen, notice } = props;
  const webgl = useMemo(() => hasWebGL(), []);
  const building = pieces.filter((p) => p.status === "building").length;

  if (props.variant === "backdrop") {
    return (
      <div
        className="relative w-full select-none"
        style={{ maskImage: BACKDROP_FADE, WebkitMaskImage: BACKDROP_FADE }}
      >
        <SkyBackdrop env={env} />
        <div className="relative">{props.header}</div>

        {/* The floating island, always centred above the game */}
        <div className="relative h-[clamp(230px,60vw,380px)] w-full" role="region" aria-label="Your mökki">
          {webgl ? (
            <Suspense fallback={<div className="absolute inset-0 flex items-center justify-center text-4xl animate-pulse" aria-hidden="true">🏡</div>}>
              <MokkiScene
                env={env}
                pieces={pieces}
                showSmoke={showSmoke}
                loylyKey={props.loylyKey}
                mushrooms={props.mushrooms}
                skin={props.skin}
                mode="hero"
                framing="island"
                sky={false}
                islandOnly
                porch={{ hasMail, potTotal, onMailboxClick: props.onMailboxClick }}
                onBackgroundClick={onOpen}
                onPieceLanded={props.onPieceLanded}
                className="cursor-pointer"
              />
            </Suspense>
          ) : (
            <button type="button" onClick={onOpen} className="absolute inset-0" aria-label="Open your mökki">
              <MokkiIllustration className="mx-auto h-full" />
            </button>
          )}
        </div>

        <div className="relative flex flex-col items-center gap-2 px-4">
          {notice && <div className="rounded-xl bg-white/90 px-3 py-1.5 text-xs font-semibold text-slate-800 shadow-md">{notice}</div>}
          <div className="flex items-center justify-center gap-2">
            <Chip onClick={props.onMailboxClick} highlight={hasMail} label={hasMail ? "Open mailbox: you have mail" : "Open mailbox"}>
              📬 {hasMail ? "Mail!" : "Mailbox"}
            </Chip>
            <Chip onClick={onOpen} label="Open your mökki">
              🔨 Build
            </Chip>
          </div>
          <span className="rounded-full bg-black/55 px-2.5 py-0.5 text-[11px] text-white backdrop-blur">
            {showSmoke ? "♨️ Sauna is warm" : "🪵 Play today to light the stove"}
            {building > 0 ? ` · 🔨 ${building} under construction` : ""}
          </span>
        </div>
        {/* Fade-out zone into the page background */}
        <div className="h-36" aria-hidden="true" />
      </div>
    );
  }

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
        <span className="rounded-full bg-black/55 px-3 py-1 text-sm font-bold text-white backdrop-blur">🏡 Mökki</span>
        {showSmoke ? (
          <span className="rounded-full bg-black/55 px-2 py-0.5 text-[11px] text-white backdrop-blur">♨️ Sauna is warm</span>
        ) : (
          <span className="rounded-full bg-black/55 px-2 py-0.5 text-[11px] text-white backdrop-blur">🪵 Play today to light the stove</span>
        )}
        {building > 0 && (
          <span className="rounded-full bg-black/55 px-2 py-0.5 text-[11px] text-white backdrop-blur">🔨 {building} under construction</span>
        )}
      </div>

      {notice && (
        <div className="pointer-events-none absolute right-3 top-3 max-w-[60%] rounded-xl bg-white/90 px-3 py-1.5 text-xs font-semibold text-slate-800 shadow-md">
          {notice}
        </div>
      )}

      {/* Accessible porch actions (also mirrored as tappable 3D objects) */}
      <div className="absolute inset-x-0 bottom-3 flex flex-wrap items-center justify-center gap-1.5 px-2 sm:gap-2 sm:px-3">
        <Chip onClick={props.onMailboxClick} highlight={hasMail} label={hasMail ? "Open mailbox: you have mail" : "Open mailbox"}>
          📬 {hasMail ? "Mail!" : "Mailbox"}
        </Chip>
        <Chip onClick={onOpen} label="Open your mökki">
          🔨 Build
        </Chip>
      </div>
    </div>
  );
};
