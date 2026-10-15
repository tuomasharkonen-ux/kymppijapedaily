import {
  canDoAction,
  findOwned,
  getDogBreed,
  helsinkiParts,
  isFlagId,
  isPieceBuilt,
  type ActionCheck,
  type ActionContext,
  type FlagId,
  type MokkiActionDef,
} from "@/lib/mokki";
import type { MokkiData, MokkiOwnedPiece } from "@/hooks/useMokki";
import type { SceneDog } from "./scene/MokkiScene";

export const helsinkiMonth = () => helsinkiParts(new Date()).month;

/** Client-side preview of a chore on your own island (the server re-checks everything). */
export function choreCheck(def: MokkiActionDef, data: MokkiData, month = helsinkiMonth()): ActionCheck {
  const ctx: ActionContext = {
    actor: data.viewer,
    month,
    doneToday: data.doneToday.includes(def.id) ? 1 : 0,
    doneOnTargetToday: false,
    guestsToday: 0,
    effectActiveOnTarget: false,
  };
  return canDoAction(def, ctx);
}

/** Client-side preview of a prank or visit on the island on screen. */
export function neighborCheck(def: MokkiActionDef, data: MokkiData, month = helsinkiMonth()): ActionCheck {
  const ctx: ActionContext = {
    actor: data.viewer,
    target: { pieces: data.pieces, gamesPlayed: data.gamesPlayed, peaceful: data.peaceful, isTestUser: false },
    month,
    doneToday: data.doneCountToday[def.id] ?? 0,
    doneOnTargetToday: data.doneToday.includes(def.id),
    guestsToday: guestCount(def, data),
    effectActiveOnTarget: data.effects.some((e) => e.actionId === def.id),
  };
  return canDoAction(def, ctx);
}

export function guestCount(def: MokkiActionDef, data: MokkiData): number {
  return data.guests.filter((g) => g.actionId === def.id).length;
}

/** The island's dog once the Koira is finished. */
export function sceneDog(pieces: MokkiOwnedPiece[], gamesPlayed: number): SceneDog | null {
  const record = findOwned(pieces, "koira");
  const breed = getDogBreed(record?.variant);
  if (!record || !breed || !isPieceBuilt(pieces, "koira", gamesPlayed)) return null;
  return { breed: breed.id, name: record.nickname || "Koira" };
}

export function sceneFlag(pieces: MokkiOwnedPiece[]): FlagId | undefined {
  const variant = findOwned(pieces, "lipputanko")?.variant;
  return isFlagId(variant) ? variant : undefined;
}

export function paljuGuestNames(data: MokkiData): string[] {
  return data.guests.filter((g) => g.actionId === "paljubileet").map((g) => g.username);
}
