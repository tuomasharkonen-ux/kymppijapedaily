import type { MokkiSeason } from "@/lib/mokki";

// Fixed materials: punamulta red with white trims, birch, granite, warm wood
export const C = {
  punamulta: "#8e2a1e",
  punamultaDark: "#6f2016",
  trim: "#f4efe3",
  roof: "#4b4d55",
  roofEdge: "#24262b",
  log: "#b07a43",
  logDark: "#8a5a2e",
  logEnd: "#d9b27a",
  plank: "#b98c58",
  plankDark: "#8c6339",
  post: "#6b4a2c",
  rock: "#99928c",
  rockDark: "#7b7570",
  granite: "#a8958c",
  soil: "#5a4330",
  soilDark: "#3e2e21",
  birchBark: "#efece6",
  birchMark: "#2a2826",
  pineTrunk: "#6a4a2e",
  glass: "#3b5468",
  glow: "#ffcc6e",
  brick: "#9b4a33",
  metal: "#4a4d52",
  white: "#fbfaf6",
  flagBlue: "#1d4fa0",
  snow: "#f1f5f8",
  ice: "#cfe4ee",
  kiulu: "#a8723c",
  coin: "#f2c14e",
  red: "#c0392b",
} as const;

export interface SeasonPalette {
  grass: string;
  grassSide: string;
  leaves: string[];
  pine: string;
  bush: string;
  water: string;
  waterDeep: string;
  bareBirch: boolean;
  snow: boolean;
  frozen: boolean;
}

export const SEASON_PALETTES: Record<MokkiSeason, SeasonPalette> = {
  spring: {
    grass: "#86b65a",
    grassSide: "#6f6b4f",
    leaves: ["#a6d672", "#8cc55c", "#b8e08a"],
    pine: "#2f5f3c",
    bush: "#5f9447",
    water: "#4b9dc0",
    waterDeep: "#2b6e8e",
    bareBirch: false,
    snow: false,
    frozen: false,
  },
  summer: {
    grass: "#6ea44f",
    grassSide: "#62603f",
    leaves: ["#6aa84f", "#7fbf5a", "#5c9a45"],
    pine: "#2b573a",
    bush: "#4e8a3c",
    water: "#4a9cc2",
    waterDeep: "#2a6f90",
    bareBirch: false,
    snow: false,
    frozen: false,
  },
  autumn: {
    grass: "#8f9a4c",
    grassSide: "#6b5f3d",
    leaves: ["#e8a317", "#d97a26", "#f2c440", "#c95d2a"],
    pine: "#2c5236",
    bush: "#b8452c",
    water: "#4790b2",
    waterDeep: "#2a6684",
    bareBirch: false,
    snow: false,
    frozen: false,
  },
  winter: {
    grass: "#eef3f7",
    grassSide: "#7d7a74",
    leaves: [],
    pine: "#2a4c38",
    bush: "#5e5a50",
    water: "#c6e0ee",
    waterDeep: "#9fc3d6",
    bareBirch: true,
    snow: true,
    frozen: true,
  },
};
