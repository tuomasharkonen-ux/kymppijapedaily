import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ChoresTray } from "@/components/mokki/ChoresTray";
import { NeighborActions } from "@/components/mokki/NeighborActions";
import { InboxSheet } from "@/components/mokki/InboxSheet";
import { DogSheet } from "@/components/mokki/DogSheet";
import type { MokkiActionResult, MokkiData, MokkiOwnedPiece } from "@/hooks/useMokki";

const piece = (piece_id: string, variant: string | null = null, nickname: string | null = null, building = false): MokkiOwnedPiece => ({
  piece_id,
  build_days: 2,
  played_days_at_purchase: building ? 40 : 1,
  purchased_at: "2026-09-01T10:00:00Z",
  variant,
  nickname,
});

const minutesAgo = (m: number) => new Date(Date.now() - m * 60000).toISOString();

/**
 * Dev-only playground for the mökki chores, neighbor actions, mailbox and dog sheet. No backend.
 * /mokki-ui-preview?view=chores|neighbor|pranks|inbox|dog|newbie&breed=lagotto&played=0
 */
const MokkiUiPreview = () => {
  const [params] = useSearchParams();
  const view = params.get("view") ?? "chores";
  const breed = params.get("breed") ?? "lagotto";
  const played = params.get("played") !== "0";
  const [doneToday, setDoneToday] = useState<string[]>(["saunavuoro"]);
  const [open, setOpen] = useState(true);

  const own: MokkiOwnedPiece[] =
    view === "newbie"
      ? [piece("huussi")]
      : [
          piece("nuotiopaikka"),
          piece("onkipaikka"),
          piece("laituri"),
          piece("marjapensaat"),
          piece("sauna"),
          piece("lipputanko", "piraatti"),
          piece("riukuaita"),
          piece("koira", breed, "Pörrö"),
          piece("huussi"),
          piece("soutuvene", null, null, true),
        ];
  const viewer = { pieces: own, gamesPlayed: 41, playedToday: played, peaceful: false };

  const neighbor: MokkiData = {
    ownerName: "Aino",
    ownsPlot: true,
    gamesPlayed: 80,
    playedToday: true,
    pieces: [piece("palju"), piece("grillikota"), piece("lipputanko"), piece("koira", "aussi", "Musti"), piece("marjapensaat")],
    loylyFrom: [],
    loylySentToday: false,
    peaceful: params.get("peaceful") === "1",
    effects: [{ id: "e1", actionId: "vessapaperi", fromName: "Juha", visibleUntil: minutesAgo(-600) }],
    guests: [
      { actionId: "paljubileet", userId: "u1", username: "Juha" },
      { actionId: "paljubileet", userId: "u2", username: "Kaisa" },
      { actionId: "paljubileet", userId: "u3", username: "Matti" },
    ],
    myNotes: [],
    doorNotes: [],
    inbox: [],
    doneToday: ["grillibileet"],
    doneCountToday: { grillibileet: 1 },
    viewer,
  };

  const ownData: MokkiData = {
    ...neighbor,
    ownerName: "Pelaaja",
    pieces: own,
    peaceful: false,
    effects: [],
    guests: [],
    doneToday,
    doneCountToday: Object.fromEntries(doneToday.map((d) => [d, 1])),
    inbox: [
      { id: "i1", actionId: "vessapaperi", text: "Juha toilet-papered your birches 🧻", reward: 0, createdAt: minutesAgo(35) },
      { id: "i2", actionId: "ruotsin_lippu", text: "Pörrö barked Kaisa off your flagpole!", reward: 3, createdAt: minutesAgo(190) },
      { id: "i3", actionId: "paljubileet", text: "Matti hopped into your palju ♨️", reward: 2, createdAt: minutesAgo(60 * 26) },
      { id: "i4", actionId: "kalalahja", text: "Aino rowed over with a fresh fish 🐟", reward: 3, createdAt: minutesAgo(60 * 50) },
    ],
  };

  const mockDo = async (actionId: string): Promise<MokkiActionResult> => {
    await new Promise((r) => setTimeout(r, 300));
    setDoneToday((d) => [...d, actionId]);
    const outcomes: Record<string, MokkiActionResult["outcome"]> = {
      onki: { reward: 5, targetReward: 0, foiled: false, label: "🐟 Lahna" },
      makkara: { reward: 2, targetReward: 0, foiled: false, label: "🌭 Makkara" },
      ruotsin_lippu: { reward: 0, targetReward: 3, foiled: true, label: "🐕 Caught by the dog!" },
    };
    return { success: true, outcome: outcomes[actionId] ?? { reward: 2, targetReward: 0, foiled: false, label: "✨ Done" } };
  };

  const sky = <div className="absolute inset-0 bg-gradient-to-b from-sky-300 via-sky-200 to-emerald-300" aria-hidden="true" />;

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden">
      {sky}
      {(view === "chores" || view === "newbie") && (
        <>
          <ChoresTray data={ownData} onDo={mockDo} className="absolute inset-x-0 bottom-[5.25rem] z-10" />
          <div className="absolute inset-x-0 bottom-0 z-10 mx-auto max-w-lg px-3 pb-3">
            <div className="h-14 rounded-2xl bg-background/95 shadow-2xl ring-1 ring-black/10" />
          </div>
        </>
      )}
      {(view === "neighbor" || view === "pranks") && (
        <NeighborActions data={neighbor} onDo={mockDo} onSendLoyly={() => undefined} prankOpen={view === "pranks" ? open : undefined} onPrankOpenChange={setOpen} />
      )}
      {view === "inbox" && <InboxSheet open={open} onOpenChange={setOpen} items={ownData.inbox} onMarkRead={() => setOpen(false)} />}
      {view === "dog" && <DogSheet open={open} onOpenChange={setOpen} data={ownData} onDo={mockDo} />}
    </div>
  );
};

export default MokkiUiPreview;
