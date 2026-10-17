// What you can do in walk mode, and where: chores on your own island, löyly, visits and pranks on a
// neighbor's. Same rules as the ChoresTray / NeighborActions bars (the server re-checks everything).
import { findOwned, isPieceBuilt, MOKKI_ACTIONS } from "@/lib/mokki";
import type { MokkiData } from "@/hooks/useMokki";
import type { WalkActivity, WalkSpot } from "./scene/detail/types";
import { choreCheck, neighborCheck } from "./mokkiActions";

const SPOTS: Record<string, WalkSpot> = {
  makkara: "nuotiopaikka",
  onki: "onkipaikka",
  marjastus: "marjapensaat",
  saunavuoro: "sauna",
  rapsuta: "koira",
  tryffeli: "koira",
  paljubileet: "palju",
  grillibileet: "grillikota",
  makkaravaras: "grillikota",
  kalalahja: "dock",
  vessapaperi: "birch",
  ruotsin_lippu: "lipputanko",
  marjavarkaus: "marjapensaat",
};

export function walkActivities(data: MokkiData, isOwn: boolean): WalkActivity[] {
  const list: WalkActivity[] = [];
  if (isOwn) {
    const pieces = data.viewer.pieces;
    const dog = findOwned(pieces, "koira");
    for (const def of MOKKI_ACTIONS) {
      if (def.kind !== "chore" || !def.requiresPiece || !findOwned(pieces, def.requiresPiece)) continue;
      if (def.requiresBreed && dog?.variant !== def.requiresBreed) continue;
      const done = data.doneToday.includes(def.id);
      const check = choreCheck(def, data);
      list.push({
        id: def.id,
        emoji: def.emoji,
        name: def.name,
        spot: SPOTS[def.id] ?? def.requiresPiece,
        state: done ? "done" : check.ok ? "ready" : "locked",
        reason: check.ok === false ? check.reason : undefined,
      });
    }
    return list;
  }

  const builtHere = (id: string) => isPieceBuilt(data.pieces, id, data.gamesPlayed);
  list.push({
    id: "loyly",
    emoji: "💨",
    name: "Löyly",
    spot: builtHere("sauna") ? "sauna" : "cabin",
    state: data.loylySentToday ? "done" : "ready",
  });
  const peaceful = data.peaceful || data.viewer.peaceful;
  for (const def of MOKKI_ACTIONS) {
    if (def.kind === "chore" || (def.kind === "prank" && peaceful)) continue;
    if (def.targetRequiresPiece && !builtHere(def.targetRequiresPiece)) continue;
    if (def.requiresPiece && !findOwned(data.viewer.pieces, def.requiresPiece)) continue;
    const done = data.doneToday.includes(def.id) || data.effects.some((e) => e.actionId === def.id);
    const check = neighborCheck(def, data);
    list.push({
      id: def.id,
      emoji: def.emoji,
      name: def.name,
      spot: SPOTS[def.id] ?? "cabin",
      state: done ? "done" : check.ok ? "ready" : "locked",
      reason: check.ok === false ? check.reason : undefined,
    });
  }
  return list;
}
