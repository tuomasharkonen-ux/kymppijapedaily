import { lazy, Suspense, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { MOKKI_PIECES, type MokkiPieceId, type MokkiSeason } from "@/lib/mokki";
import { computeEnvironment } from "@/components/mokki/environment";
import { MokkiHeroView } from "@/components/mokki/MokkiHeroView";
import { MokkiPreview } from "@/components/mokki/MokkiPreview";
import type { ScenePiece } from "@/components/mokki/scene/MokkiScene";
import { BuildPanel } from "@/components/mokki/BuildPanel";

const MokkiScene = lazy(() => import("@/components/mokki/scene/MokkiScene"));

/**
 * Dev-only playground for the mökki visuals, no backend needed.
 * /mokki-preview?season=winter&elev=-20&pieces=all&building=palju&drop=sauna&view=hero
 */
const MokkiScenePreview = () => {
  const [params] = useSearchParams();
  const [log, setLog] = useState<string[]>([]);

  const season = (params.get("season") as MokkiSeason | null) ?? undefined;
  const elev = params.get("elev");
  const env = useMemo(
    () =>
      computeEnvironment(new Date(), {
        season,
        elevation: elev !== null ? Number(elev) : undefined,
        juhannus: params.get("juhannus") === "1" ? true : undefined,
        aurora: params.get("aurora") === "1" ? true : params.get("aurora") === "0" ? false : undefined,
      }),
    [season, elev, params],
  );

  const pieces: ScenePiece[] = useMemo(() => {
    const spec = params.get("pieces") ?? "all";
    const ids: MokkiPieceId[] =
      spec === "all" ? MOKKI_PIECES.map((p) => p.id) : spec === "none" ? [] : (spec.split(",") as MokkiPieceId[]);
    const building = (params.get("building") ?? "").split(",");
    const drop = (params.get("drop") ?? "").split(",");
    const all = new Set([...ids, ...(building.filter(Boolean) as MokkiPieceId[])]);
    return [...all].map((id) => ({
      id,
      status: building.includes(id) ? "building" : "complete",
      remainingDays: 2,
      justCompleted: drop.includes(id),
    }));
  }, [params]);

  const view = params.get("view") ?? "both";
  const potParam = params.get("pot");
  const potTotal = potParam === null ? 150 : potParam === "none" ? null : Number(potParam);
  const common = {
    env,
    pieces,
    showSmoke: params.get("smoke") !== "0",
    mushrooms: params.get("sieni") === "1",
    skin: params.get("skin") ?? "golden_dice",
  };
  const note = (msg: string) => setLog((l) => [...l.slice(-4), msg]);

  if (view === "build") {
    const owned = pieces.map((p) => ({
      piece_id: p.id,
      build_days: 3,
      played_days_at_purchase: p.status === "building" ? 40 : 10,
      purchased_at: new Date().toISOString(),
    }));
    const open = params.get("open") === "1";
    return (
      <div className="relative h-[100dvh] w-full overflow-hidden">
        <div className={`absolute inset-x-0 top-0 ${open ? "h-[42dvh]" : "h-full"}`}>
          <Suspense fallback={null}>
            <MokkiScene {...common} loylyKey={0} mode="full" />
          </Suspense>
        </div>
        <BuildPanel
          owned={owned}
          gamesPlayed={Number(params.get("games") ?? 41)}
          credits={Number(params.get("credits") ?? 1250)}
          onBuy={async (id) => {
            note(`buy ${id}`);
            return true;
          }}
          initialOpen={params.get("open") === "1"}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="mx-auto max-w-lg space-y-4">
        {(view === "hero" || view === "both") && (
          <MokkiHeroView
            {...common}
            loylyKey={params.get("loyly") === "1" ? 1 : 0}
            hasMail={params.get("mail") === "1"}
            potTotal={potTotal}
            onMailboxClick={() => note("mailbox")}
            onKiuluClick={() => note("kiulu")}
            onNoticeBoardClick={() => note("notice board")}
            onOpen={() => note("open /mokki")}
            notice={params.get("notice")}
          />
        )}
        {view === "shop" && <MokkiPreview />}
        {log.length > 0 && <p className="text-xs text-muted-foreground">Clicked: {log.join(", ")}</p>}
      </div>
      {(view === "full" || view === "both") && (
        <div className="mx-auto mt-4 h-[80vh] max-w-5xl overflow-hidden rounded-2xl">
          <Suspense fallback={null}>
            <MokkiScene {...common} loylyKey={0} mode="full" porch={{ hasMail: params.get("mail") === "1", potTotal }} />
          </Suspense>
        </div>
      )}
    </div>
  );
};

export default MokkiScenePreview;
