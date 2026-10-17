import type { ComponentType } from "react";
import type { MokkiPieceId, MokkiSeason } from "@/lib/mokki";
import type { SeasonPalette } from "../../palette";
import type { WalkExtras } from "../walk";

/** High-detail models for walk mode, loaded as a separate chunk only when someone starts walking. */
export interface DetailKit {
  Cabin: ComponentType<{ lightsOn: boolean; snow: boolean; fire: boolean }>;
  Sauna: ComponentType<{ lightsOn: boolean; snow: boolean; smoke: boolean; loylyKey: number }>;
  Ground: ComponentType<{ palette: SeasonPalette; season: MokkiSeason; pieces: { id: MokkiPieceId; status: string }[] }>;
  walk: WalkExtras;
}
