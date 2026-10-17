import { DetailedCabin } from "./DetailedCabin";
import { DetailedSauna } from "./DetailedSauna";
import { GroundDetail } from "./GroundDetail";
import { PorchDice } from "./PorchDice";
import { Wildlife } from "./Wildlife";
import type { DetailKit } from "./types";
import { WALK_EXTRAS } from "./walkExtras";

const detailKit: DetailKit = {
  Cabin: DetailedCabin,
  Sauna: DetailedSauna,
  Ground: GroundDetail,
  PorchDice,
  Wildlife,
  walk: WALK_EXTRAS,
};

export default detailKit;
