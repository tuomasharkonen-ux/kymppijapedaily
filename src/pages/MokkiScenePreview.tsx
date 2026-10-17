import { lazy, Suspense, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { MOKKI_PIECES, type DogBreedId, type FlagId, type MokkiPieceId, type MokkiSeason } from "@/lib/mokki";
import { computeEnvironment } from "@/components/mokki/environment";
import { MokkiHeroView } from "@/components/mokki/MokkiHeroView";
import { MokkiPreview } from "@/components/mokki/MokkiPreview";
import type { MokkiSceneProps, ScenePiece } from "@/components/mokki/scene/MokkiScene";
import { BuildPanel } from "@/components/mokki/BuildPanel";
import { ChoresTray } from "@/components/mokki/ChoresTray";
import { DoorNoteSheet } from "@/components/mokki/DoorNoteSheet";
import { WalkButton } from "@/components/mokki/WalkButton";
import type { MokkiData, MokkiNote } from "@/hooks/useMokki";

const MokkiScene = lazy(() => import("@/components/mokki/scene/MokkiScene"));

const FOCUS: Record<string, [number, number, number]> = {
  dog: [1.0, 0.6, 3.0],
  porch: [-0.32, 0.8, 0.55],
  nuotio: [-0.15, 0.6, 3.35],
  onki: [3.8, 0.5, 4.1],
  fence: [-2.9, 0.7, 3.1],
  palju: [2.4, 0.9, -0.05],
};

/**
 * Dev-only playground for the mökki visuals, no backend needed.
 * /mokki-preview?season=winter&elev=-20&pieces=all&building=palju&drop=sauna&view=hero
 * Tech tree extras: &dog=puudeli|aussi|lagotto&dogname=Musti&flag=saame
 * &effects=vessapaperi,ruotsin_lippu,marjavarkaus&guests=Aino,Juha
 * Close-ups (full view): &focus=dog|porch|nuotio|onki|fence|palju|x,y,z&zoom=3
 * First-person walk (full view): &walk=1, as a visitor (closed door + notepad): &visit=1,
 * with today's game on the porch table (nothing is saved to the server): &daily=1,
 * sample chore markers: &acts=1
 * Fullscreen frame (scene only, optional chores tray): &view=frame&chores=1
 */
const MokkiScenePreview = () => {
  const [params] = useSearchParams();
  const [log, setLog] = useState<string[]>([]);
  const [walking, setWalking] = useState(() => params.get("walk") === "1");
  const [noteOpen, setNoteOpen] = useState(params.get("note") === "1");
  const [notes, setNotes] = useState<MokkiNote[]>([]);
  const visiting = params.get("visit") === "1";

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
      spec === "all" ? MOKKI_PIECES.filter((p) => !p.comingSoon).map((p) => p.id) : spec === "none" ? [] : (spec.split(",") as MokkiPieceId[]);
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
  const breed = params.get("dog") as DogBreedId | null;
  const focusParam = params.get("focus");
  const focusTarget = focusParam ? FOCUS[focusParam] ?? (focusParam.split(",").map(Number) as [number, number, number]) : null;
  const common = {
    env,
    pieces,
    showSmoke: params.get("smoke") !== "0",
    mushrooms: params.get("sieni") === "1",
    skin: params.get("skin") ?? "golden_dice",
    dog: breed ? { breed, name: params.get("dogname") ?? "Musti" } : null,
    flag: (params.get("flag") as FlagId | null) ?? undefined,
    effects: (params.get("effects") ?? "")
      .split(",")
      .filter(Boolean)
      .map((actionId) => ({ id: `fx-${actionId}`, actionId })),
    paljuGuests: (params.get("guests") ?? "").split(",").filter(Boolean),
  } satisfies Partial<MokkiSceneProps>;
  const debugFocus = focusTarget ? { target: focusTarget, zoom: Number(params.get("zoom") ?? 3) } : undefined;
  const note = (msg: string) => setLog((l) => [...l.slice(-4), msg]);

  if (view === "build") {
    const owned = pieces.map((p) => ({
      piece_id: p.id,
      build_days: 3,
      played_days_at_purchase: p.status === "building" ? 40 : 10,
      purchased_at: new Date().toISOString(),
      variant: p.id === "koira" ? breed : null,
      nickname: p.id === "koira" ? params.get("dogname") : null,
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

  if (view === "frame") {
    const owned = pieces.map((p) => ({
      piece_id: p.id,
      build_days: 1,
      played_days_at_purchase: 0,
      purchased_at: "2026-06-01T10:00:00Z",
      variant: p.id === "koira" ? breed : p.id === "lipputanko" ? (params.get("flag") ?? "siniristi") : null,
      nickname: p.id === "koira" ? (params.get("dogname") ?? "Pörrö") : null,
    }));
    const played = params.get("played") !== "0";
    const choreData: MokkiData = {
      ownerName: "Pelaaja",
      ownsPlot: true,
      gamesPlayed: 80,
      playedToday: played,
      pieces: owned,
      loylyFrom: [],
      loylySentToday: false,
      peaceful: false,
      effects: [],
      guests: [],
      inbox: [],
      myNotes: [],
      doorNotes: [],
      doneToday: ["saunavuoro"],
      doneCountToday: { saunavuoro: 1 },
      viewer: { pieces: owned, gamesPlayed: 80, playedToday: played, peaceful: false },
    };
    return (
      <div className="relative h-[100dvh] w-full overflow-hidden">
        <Suspense fallback={null}>
          <MokkiScene
            {...common}
            loylyKey={0}
            mode="full"
            debugFocus={debugFocus}
            firstPerson={walking}
            onExitFirstPerson={() => setWalking(false)}
            walkActivities={
              params.get("acts") === "1"
                ? {
                    activities: [
                      { id: "onki", emoji: "🎣", name: "Onki", spot: "onkipaikka", state: "ready" },
                      { id: "makkara", emoji: "🌭", name: "Makkaranpaisto", spot: "nuotiopaikka", state: "ready" },
                      { id: "saunavuoro", emoji: "♨️", name: "Saunavuoro", spot: "sauna", state: "ready" },
                      { id: "marjastus", emoji: "🫐", name: "Marjastus", spot: "marjapensaat", state: "done" },
                    ],
                    onRun: async () => "Nice.",
                  }
                : undefined
            }
          />
        </Suspense>
        {!walking && params.get("walkbtn") !== "0" && (
          <div className="pointer-events-none absolute inset-x-0 top-6 z-20 flex justify-center px-4">
            <WalkButton onClick={() => setWalking(true)} />
          </div>
        )}
        {params.get("chores") === "1" && !walking && (
          <ChoresTray data={choreData} onDo={async () => ({ success: true })} className="absolute inset-x-0 bottom-4 z-10" />
        )}
      </div>
    );
  }

  if (view === "home") {
    const dark = env.timeOfDay === "night" || env.timeOfDay === "twilight";
    return (
      <div className="min-h-screen overflow-x-hidden bg-background">
        <MokkiHeroView
          {...common}
          variant="backdrop"
          streak={Number(params.get("streak") ?? 12)}
          loylyKey={0}
          hasMail={params.get("mail") === "1"}
          potTotal={potTotal}
          onMailboxClick={() => note("mailbox")}
          onOpen={() => note("open /mokki")}
          header={
            <div className="container mx-auto max-w-lg px-4">
              <header className={`pt-6 text-center ${dark ? "text-white [text-shadow:0_1px_3px_rgba(0,0,0,0.45)]" : ""}`}>
                <h1 className={`mb-1 text-3xl font-bold ${dark ? "text-white" : "text-foreground"}`}>🎲 Kymppijape Daily</h1>
                <p className={dark ? "text-white/85" : "text-foreground/75"}>Tuesday, October 6, 2026</p>
                <p className={`mt-2 text-sm ${dark ? "text-white/85" : "text-foreground/75"}`}>player@example.com ☰</p>
              </header>
            </div>
          }
        />
        <div className="container relative mx-auto -mt-24 max-w-lg px-4 pb-6">
          <div className="rounded-xl border bg-card p-6 text-center shadow-sm">
            <p className="mb-6 text-muted-foreground">Ready for today's challenge?</p>
            <div className="rounded-md bg-primary py-3 font-semibold text-primary-foreground">🎲 Roll Dice</div>
          </div>
          {log.length > 0 && <p className="mt-2 text-xs text-muted-foreground">Clicked: {log.join(", ")}</p>}
        </div>
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
            onOpen={() => note("open /mokki")}
            notice={params.get("notice")}
          />
        )}
        {view === "shop" && <MokkiPreview />}
        {log.length > 0 && <p className="text-xs text-muted-foreground">Clicked: {log.join(", ")}</p>}
      </div>
      {visiting && (
        <DoorNoteSheet
          open={noteOpen}
          onOpenChange={setNoteOpen}
          ownerName="Aino"
          myNotes={notes}
          doorNotes={[
            { id: "d1", fromName: "Pekka", body: "Kävin kylässä, sauna näytti lämpimältä ♨️", createdAt: new Date().toISOString() },
            { id: "d2", fromName: "Liisa", body: "Moi! 👋", createdAt: new Date().toISOString() },
          ]}
          onLeave={async (body) => {
            setNotes((n) => [...n, { id: String(n.length), body, createdAt: new Date().toISOString() }]);
            return { success: true };
          }}
        />
      )}
      {(view === "full" || view === "both") && (
        <div className="relative mx-auto mt-4 h-[80vh] max-w-5xl overflow-hidden rounded-2xl">
          {walking ? (
            <button
              type="button"
              className="absolute right-3 top-3 z-20 rounded-md bg-white px-3 py-1.5 text-sm font-medium text-slate-900 shadow-md"
              onClick={() => setWalking(false)}
            >
              Stop walking
            </button>
          ) : (
            <div className="pointer-events-none absolute inset-x-0 top-[7.5rem] z-20 flex justify-center px-4">
              <WalkButton onClick={() => setWalking(true)} />
            </div>
          )}
          <Suspense fallback={null}>
            <MokkiScene
              {...common}
              loylyKey={0}
              mode="full"
              porch={{ hasMail: params.get("mail") === "1", potTotal }}
              debugFocus={debugFocus}
              onDogClick={() => note("dog")}
              onEffectClick={(id) => note(`clean ${id}`)}
              firstPerson={walking}
              onExitFirstPerson={() => setWalking(false)}
              visit={visiting ? { onNotepad: () => setNoteOpen(true), notes: notes.length } : undefined}
              walkActivities={
                params.get("acts") === "1"
                  ? {
                      activities: [
                        { id: "onki", emoji: "🎣", name: "Onki", spot: "onkipaikka", state: "ready" },
                        { id: "makkara", emoji: "🌭", name: "Makkaranpaisto", spot: "nuotiopaikka", state: "done" },
                        { id: "saunavuoro", emoji: "♨️", name: "Saunavuoro", spot: "sauna", state: "locked", reason: "Play today's game first" },
                        { id: "marjastus", emoji: "🫐", name: "Marjastus", spot: "marjapensaat", state: "ready" },
                      ],
                      onRun: async (id) => {
                        await new Promise((r) => setTimeout(r, 500));
                        note(`activity ${id}`);
                        return id === "onki" ? "+6 cr · Caught a perch!" : "+4 cr · A bowl of blueberries";
                      },
                    }
                  : undefined
              }
              porchGame={
                params.get("daily") === "1"
                  ? {
                      userId: "preview-player",
                      onComplete: async (throws, winningNumber, extras) => {
                        note(`daily done: ${throws} throws, ${winningNumber}s, log ${extras.throwLog.length}`);
                      },
                    }
                  : undefined
              }
            />
          </Suspense>
        </div>
      )}
    </div>
  );
};

export default MokkiScenePreview;
