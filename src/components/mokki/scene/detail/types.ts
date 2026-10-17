import type { ComponentType } from "react";
import type { MokkiPieceId, MokkiSeason } from "@/lib/mokki";
import type { SeasonPalette } from "../../palette";
import type { WalkExtras } from "../walk";

/** Someone else's cabin: the door is shut, with a notepad for hellos. */
export interface CabinVisit {
  onNotepad: () => void;
  /** Notes the visitor already pinned today. */
  notes: number;
}

/** Today's real Kymppijape, playable on the porch table (own island, not played yet today). */
export interface PorchDailyGame {
  userId: string;
  /** Saves the finished game exactly like the main board; rejects with the error to show. */
  onComplete: (throws: number, winningNumber: number, extras: { throwLog: number[][]; unlockedAny: boolean }) => Promise<void>;
}

/** High-detail models for walk mode, loaded as a separate chunk only when someone starts walking. */
export interface DetailKit {
  Cabin: ComponentType<{ lightsOn: boolean; snow: boolean; fire: boolean; visit?: CabinVisit }>;
  Sauna: ComponentType<{ lightsOn: boolean; snow: boolean; smoke: boolean; loylyKey: number }>;
  Ground: ComponentType<{ palette: SeasonPalette; season: MokkiSeason; pieces: { id: MokkiPieceId; status: string }[] }>;
  /** Ten real-size dice on the porch table: tap to play a round of Kymppijape. */
  PorchDice: ComponentType<{ skin: string; daily?: PorchDailyGame }>;
  /** Moose on the far shore, jumping fish, a rubber duck in the palju. */
  Wildlife: ComponentType<{ frozen: boolean; pieces: { id: MokkiPieceId; status: string }[] }>;
  walk: WalkExtras;
}
