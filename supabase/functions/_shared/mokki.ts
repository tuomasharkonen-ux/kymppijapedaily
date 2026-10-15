// Shared Mökki rules: the build tree (Rakennuspuu), build progress, daily chores and
// neighbor actions, hammock naps, seasons and sun position.
// Imported by edge functions (Deno, with .ts extension) and by the web client
// (via src/lib/mokki.ts). Must stay dependency-free.

export type MokkiPieceId =
  // Era I
  | "puuvaja"
  | "nuotiopaikka"
  | "onkipaikka"
  | "marjapensaat"
  | "huussi"
  | "riukuaita"
  | "lipputanko"
  | "riippumatto"
  // Era II
  | "sauna"
  | "laituri"
  | "soutuvene"
  | "koira"
  | "mehilaispesat"
  | "aurinkopaneeli"
  // Era III
  | "grillikota"
  | "palju"
  | "avanto"
  | "silta"
  | "aitta"
  | "mokkiradio"
  | "peramoottori"
  // Era IV
  | "savusauna"
  | "saunalautta"
  | "lasikuisti";

export type MokkiLaneId = "tuli" | "jarvi" | "piha" | "pihapiiri" | "elama";

export interface MokkiLane {
  id: MokkiLaneId;
  name: string;
  emoji: string;
  color: string;
  /** Rows the lane takes in the tree layout. */
  rows: number;
}

export const MOKKI_LANES: MokkiLane[] = [
  { id: "tuli", name: "Tuli & löyly", emoji: "🔥", color: "#e8693c", rows: 2 },
  { id: "jarvi", name: "Järvi", emoji: "🌊", color: "#3fa7e0", rows: 3 },
  { id: "piha", name: "Piha", emoji: "🌿", color: "#6cc04a", rows: 1 },
  { id: "pihapiiri", name: "Pihapiiri", emoji: "🐕", color: "#c48a52", rows: 2 },
  { id: "elama", name: "Mökkielämä", emoji: "☀️", color: "#b98be0", rows: 3 },
];

export interface MokkiEra {
  index: number;
  roman: string;
  name: string;
  minDaysPlayed: number;
  /** Layout columns the era spans in the tree. */
  cols: number[];
}

export const MOKKI_ERAS: MokkiEra[] = [
  { index: 0, roman: "I", name: "Kesämökki", minDaysPlayed: 0, cols: [0] },
  { index: 1, roman: "II", name: "Vapaa-ajan asunto", minDaysPlayed: 10, cols: [1, 2] },
  { index: 2, roman: "III", name: "Huvila", minDaysPlayed: 30, cols: [3] },
  { index: 3, roman: "IV", name: "Legenda", minDaysPlayed: 60, cols: [4] },
];

export type MokkiBenefitKind = "chore" | "social" | "prank" | "perk" | "cosmetic";

export interface MokkiBenefit {
  kind: MokkiBenefitKind;
  emoji: string;
  title: string;
  text: string;
}

export interface MokkiPieceDef {
  id: MokkiPieceId;
  name: string;
  emoji: string;
  description: string;
  price: number;
  /** Played days needed after purchase before the piece is finished. */
  buildDays: number;
  /** Index into MOKKI_ERAS; the era sets the days-played gate. */
  era: number;
  lane: MokkiLaneId;
  /** Tree layout: column (0–4) and row inside the lane. */
  col: number;
  row: number;
  /** Pieces that must be owned and finished first. */
  requires: MokkiPieceId[];
  gives: MokkiBenefit[];
  /** Shown in the tree as a silhouette, not buyable yet. */
  comingSoon?: boolean;
  /** Era IV capstone. */
  wonder?: boolean;
}

// ---------------------------------------------------------------------------
// Rewards (credits). Every number the economy depends on lives here.
// ---------------------------------------------------------------------------

export const REWARDS = {
  makkara: 2,
  makkaraKota: 4,
  saunavuoro: 4,
  marjastus: 3,
  rapsuta: 2,
  /** Lagotto daily dig: 1–4, doubled in autumn, small chance of a truffle. */
  tryffeliMin: 1,
  tryffeliMax: 4,
  tryffeliJackpot: 30,
  tryffeliJackpotChance: 0.03,
  makkaravaras: 4,
  marjavarkaus: 1,
  /** Paid to the owner when their dog foils a prank. */
  foiled: 3,
  /** Paid to the owner for cleaning up a prank. */
  cleanup: 2,
  kalalahjaSender: 1,
  kalalahjaReceiver: 3,
  paljuGuest: 3,
  paljuHost: 2,
  grilliGuest: 2,
  grilliHost: 1,
} as const;

export const PRANK_EFFECT_HOURS = 24;
export const GUARD_CHANCE_DEFAULT = 0.2;
export const GUARD_CHANCE_AUSSI = 0.5;

export const MOKKI_PIECES: MokkiPieceDef[] = [
  // ----- Era I · Kesämökki -----
  {
    id: "puuvaja",
    name: "Puuvaja",
    emoji: "🪵",
    description: "A woodshed stacked full of birch logs for the sauna stove.",
    price: 300,
    buildDays: 2,
    era: 0,
    lane: "tuli",
    col: 0,
    row: 0,
    requires: [],
    gives: [{ kind: "perk", emoji: "🔥", title: "Firewood", text: "Fuel for the sauna and the grill hut." }],
  },
  {
    id: "nuotiopaikka",
    name: "Nuotiopaikka",
    emoji: "🌭",
    description: "A stone fire ring with log benches. Where every mökki evening starts.",
    price: 100,
    buildDays: 1,
    era: 0,
    lane: "tuli",
    col: 0,
    row: 1,
    requires: [],
    gives: [{ kind: "chore", emoji: "🌭", title: "Makkaranpaisto", text: `Grill a sausage after your game: +${REWARDS.makkara} cr a day.` }],
  },
  {
    id: "onkipaikka",
    name: "Onkipaikka",
    emoji: "🎣",
    description: "A flat shore rock, a bamboo rod and a bucket.",
    price: 100,
    buildDays: 1,
    era: 0,
    lane: "jarvi",
    col: 0,
    row: 0,
    requires: [],
    gives: [{ kind: "chore", emoji: "🎣", title: "Onki", text: "Cast a line once a day: 0–4 cr. Watch out for rubber boots." }],
  },
  {
    id: "marjapensaat",
    name: "Marjapensaat",
    emoji: "🫐",
    description: "Berry bushes and a little flower bed by the cabin. Mustikka, puolukka, herukka.",
    price: 250,
    buildDays: 1,
    era: 0,
    lane: "piha",
    col: 0,
    row: 0,
    requires: [],
    gives: [
      { kind: "chore", emoji: "🫐", title: "Marjastus", text: `Pick berries in June–September: +${REWARDS.marjastus} cr a day.` },
      { kind: "prank", emoji: "🫐", title: "Marjavarkaus", text: "Raid a neighbor's berry bushes." },
    ],
  },
  {
    id: "huussi",
    name: "Huussi",
    emoji: "🚽",
    description: "The classic outhouse, heart cut into the door. Every mökki needs one.",
    price: 150,
    buildDays: 1,
    era: 0,
    lane: "pihapiiri",
    col: 0,
    row: 1,
    requires: [],
    gives: [{ kind: "prank", emoji: "🧻", title: "Vessapaperi-isku", text: "Toilet-paper a neighbor's birches." }],
  },
  {
    id: "riukuaita",
    name: "Riukuaita",
    emoji: "🪵",
    description: "A traditional roundpole fence along the back of the island.",
    price: 150,
    buildDays: 1,
    era: 0,
    lane: "pihapiiri",
    col: 0,
    row: 0,
    requires: [],
    gives: [{ kind: "cosmetic", emoji: "🌾", title: "Pihapiiri", text: "Looks great. Keeps a dog in." }],
  },
  {
    id: "lipputanko",
    name: "Lipputanko",
    emoji: "🇫🇮",
    description: "A tall white flagpole for your island.",
    price: 200,
    buildDays: 1,
    era: 0,
    lane: "elama",
    col: 0,
    row: 1,
    requires: [],
    gives: [
      { kind: "perk", emoji: "🏳️", title: "Flag picker", text: "Fly the siniristi, Åland, Sámi, rainbow or pirate flag." },
      { kind: "prank", emoji: "🇸🇪", title: "Ruotsin lippu", text: "Hoist a Swedish flag on a neighbor's pole." },
    ],
  },
  {
    id: "riippumatto",
    name: "Riippumatto",
    emoji: "🌿",
    description: "A striped hammock strung between two birches. Peak mökki relaxation.",
    price: 250,
    buildDays: 1,
    era: 0,
    lane: "elama",
    col: 0,
    row: 2,
    requires: [],
    gives: [{ kind: "perk", emoji: "😴", title: "Päiväunet", text: "Once a week, one missed day doesn't break your streak." }],
  },

  // ----- Era II · Vapaa-ajan asunto -----
  {
    id: "sauna",
    name: "Rantasauna",
    emoji: "🧖",
    description: "A log sauna on the shore with a wood-burning kiuas. The heart of every mökki.",
    price: 700,
    buildDays: 3,
    era: 1,
    lane: "tuli",
    col: 1,
    row: 0,
    requires: ["puuvaja"],
    gives: [
      { kind: "chore", emoji: "♨️", title: "Saunavuoro", text: `Take your sauna turn: +${REWARDS.saunavuoro} cr a day.` },
      { kind: "social", emoji: "💨", title: "Kunnon löyly", text: "Löyly you send makes a bigger puff." },
    ],
  },
  {
    id: "laituri",
    name: "Laituri",
    emoji: "🛶",
    description: "A wooden dock reaching out into the lake. Perfect for jumping in after löyly.",
    price: 500,
    buildDays: 2,
    era: 1,
    lane: "jarvi",
    col: 1,
    row: 0,
    requires: ["onkipaikka"],
    gives: [{ kind: "chore", emoji: "🎣", title: "Better fishing", text: "Fish off the end of the dock: 0–5 cr, lahna on the line." }],
  },
  {
    id: "soutuvene",
    name: "Soutuvene",
    emoji: "🚣",
    description: "A white wooden rowing boat tied to your laituri, oars ready.",
    price: 450,
    buildDays: 2,
    era: 1,
    lane: "jarvi",
    col: 2,
    row: 0,
    requires: ["laituri"],
    gives: [
      { kind: "chore", emoji: "🎣", title: "Open-water fishing", text: "Row out: 0–10 cr, with kuha and hauki." },
      { kind: "social", emoji: "🐟", title: "Kalalahja", text: `Row a fish over to a neighbor: +${REWARDS.kalalahjaReceiver} cr for them, +${REWARDS.kalalahjaSender} for you.` },
    ],
  },
  {
    id: "koira",
    name: "Koira",
    emoji: "🐕",
    description: "A dog and a doghouse. Pick a mini poodle, an Aussie or a Lagotto and give it a name.",
    price: 700,
    buildDays: 2,
    era: 1,
    lane: "pihapiiri",
    col: 1,
    row: 0,
    requires: ["riukuaita"],
    gives: [
      { kind: "chore", emoji: "🐾", title: "Rapsuta", text: `Give your dog a scratch: +${REWARDS.rapsuta} cr a day.` },
      { kind: "perk", emoji: "🛡️", title: "Guard dog", text: "Sometimes catches pranksters red-handed." },
      { kind: "perk", emoji: "✨", title: "Breed trick", text: "Makkaravaras, Vahtikoira or Tryffelikoira." },
    ],
  },
  {
    id: "mehilaispesat",
    name: "Mehiläispesät",
    emoji: "🐝",
    description: "Two painted beehives behind the berry bushes.",
    price: 500,
    buildDays: 2,
    era: 1,
    lane: "piha",
    col: 1,
    row: 0,
    requires: ["marjapensaat"],
    comingSoon: true,
    gives: [
      { kind: "chore", emoji: "🍯", title: "Hunaja", text: "A jar of honey every week." },
      { kind: "perk", emoji: "🌸", title: "Pollination", text: "Berry picking pays double." },
      { kind: "prank", emoji: "🐝", title: "Mehiläisparvi", text: "Send a swarm to a neighbor's hammock." },
    ],
  },
  {
    id: "aurinkopaneeli",
    name: "Aurinkopaneeli",
    emoji: "☀️",
    description: "A solar panel on the huussi roof. Finland's first solar-powered huussi.",
    price: 500,
    buildDays: 2,
    era: 1,
    lane: "elama",
    col: 1,
    row: 0,
    requires: ["huussi"],
    comingSoon: true,
    gives: [
      { kind: "cosmetic", emoji: "✨", title: "Valosarjat", text: "String lights on the porch at night." },
      { kind: "perk", emoji: "⚡", title: "Sähköt", text: "Starts the tech branch." },
    ],
  },

  // ----- Era III · Huvila -----
  {
    id: "grillikota",
    name: "Grillikota",
    emoji: "🔥",
    description: "An eight-sided Lappish grill hut with a fire pit in the middle. Makkaraa!",
    price: 800,
    buildDays: 4,
    era: 2,
    lane: "tuli",
    col: 3,
    row: 1,
    requires: ["nuotiopaikka", "puuvaja"],
    gives: [
      { kind: "chore", emoji: "🌭", title: "Makkaranpaisto+", text: `Grilling pays +${REWARDS.makkaraKota} cr a day.` },
      { kind: "social", emoji: "🎉", title: "Grillibileet", text: `Visitors grab a makkara: +${REWARDS.grilliGuest} cr for them, +${REWARDS.grilliHost} for you (5 a day).` },
    ],
  },
  {
    id: "palju",
    name: "Palju",
    emoji: "♨️",
    description: "A wood-fired hot tub next to the sauna. Steaming even in the dead of winter.",
    price: 900,
    buildDays: 4,
    era: 2,
    lane: "tuli",
    col: 3,
    row: 0,
    requires: ["sauna"],
    gives: [{ kind: "social", emoji: "🛁", title: "Paljubileet", text: `Visitors hop in: +${REWARDS.paljuGuest} cr for them, +${REWARDS.paljuHost} for you (5 a day). Their heads stay in the tub all day.` }],
  },
  {
    id: "avanto",
    name: "Avanto",
    emoji: "🧊",
    description: "An ice hole at the end of the laituri. A diving ladder in summer.",
    price: 600,
    buildDays: 2,
    era: 2,
    lane: "jarvi",
    col: 3,
    row: 2,
    requires: ["laituri", "sauna"],
    comingSoon: true,
    gives: [{ kind: "chore", emoji: "🥶", title: "Avantouinti", text: "A winter dip every day from December to March." }],
  },
  {
    id: "silta",
    name: "Silta",
    emoji: "🌉",
    description: "A wooden bridge out to the little islet.",
    price: 800,
    buildDays: 3,
    era: 2,
    lane: "jarvi",
    col: 3,
    row: 1,
    requires: ["laituri"],
    comingSoon: true,
    gives: [{ kind: "perk", emoji: "🏝️", title: "Luoto", text: "The islet becomes buildable land." }],
  },
  {
    id: "aitta",
    name: "Aitta",
    emoji: "📖",
    description: "An old red storehouse, now the guest room.",
    price: 900,
    buildDays: 3,
    era: 2,
    lane: "pihapiiri",
    col: 3,
    row: 1,
    requires: ["puuvaja", "huussi"],
    comingSoon: true,
    gives: [{ kind: "social", emoji: "📖", title: "Vieraskirja", text: "Visitors sign your guestbook." }],
  },
  {
    id: "mokkiradio",
    name: "Mökkiradio",
    emoji: "📻",
    description: "A transistor radio on the porch table.",
    price: 600,
    buildDays: 2,
    era: 2,
    lane: "elama",
    col: 3,
    row: 0,
    requires: ["aurinkopaneeli"],
    comingSoon: true,
    gives: [{ kind: "prank", emoji: "🎺", title: "Humppapommi", text: "Blast humppa at a neighbor's mökki." }],
  },
  {
    id: "peramoottori",
    name: "Perämoottori",
    emoji: "🚤",
    description: "An outboard motor bolted to the rowing boat. Vroom.",
    price: 1200,
    buildDays: 3,
    era: 2,
    lane: "jarvi",
    col: 3,
    row: 0,
    requires: ["soutuvene"],
    comingSoon: true,
    gives: [{ kind: "prank", emoji: "🌊", title: "Peräaalto", text: "Roar past a neighbor and swamp their boat." }],
  },

  // ----- Era IV · Legenda -----
  {
    id: "savusauna",
    name: "Savusauna",
    emoji: "💨",
    description: "A smoke sauna out on the luoto. The real thing.",
    price: 1800,
    buildDays: 5,
    era: 3,
    lane: "tuli",
    col: 4,
    row: 0,
    requires: ["palju", "silta"],
    comingSoon: true,
    wonder: true,
    gives: [{ kind: "social", emoji: "🌫️", title: "Savusaunan löyly", text: "Once a week, steam over every mökki on the lake." }],
  },
  {
    id: "saunalautta",
    name: "Saunalautta",
    emoji: "🛟",
    description: "A floating sauna raft with a little deck and string lights.",
    price: 2500,
    buildDays: 5,
    era: 3,
    lane: "jarvi",
    col: 4,
    row: 0,
    requires: ["peramoottori", "sauna"],
    comingSoon: true,
    wonder: true,
    gives: [{ kind: "social", emoji: "⚓", title: "Lautta kylässä", text: "Moor your raft at a neighbor's island for a day." }],
  },
  {
    id: "lasikuisti",
    name: "Lasikuisti",
    emoji: "🪟",
    description: "The cabin gets a glazed veranda. Peak mökki.",
    price: 2000,
    buildDays: 5,
    era: 3,
    lane: "pihapiiri",
    col: 4,
    row: 1,
    requires: ["aitta", "aurinkopaneeli"],
    comingSoon: true,
    wonder: true,
    gives: [{ kind: "perk", emoji: "🏆", title: "Pokaalihylly", text: "Your rarest badges on display to visitors." }],
  },
];

export function getPieceDef(id: string): MokkiPieceDef | undefined {
  return MOKKI_PIECES.find((p) => p.id === id);
}

export function pieceMinDays(def: MokkiPieceDef): number {
  return MOKKI_ERAS[def.era].minDaysPlayed;
}

export const MOKKI_CATALOG_TOTAL = MOKKI_PIECES.reduce((sum, p) => sum + p.price, 0);

/** Pieces that unlock straight after this one. */
export function pieceChildren(id: string): MokkiPieceDef[] {
  return MOKKI_PIECES.filter((p) => p.requires.includes(id as MokkiPieceId));
}

// ---------------------------------------------------------------------------
// Owned pieces & build progress
// ---------------------------------------------------------------------------

export interface OwnedPieceRecord {
  piece_id: string;
  build_days: number;
  played_days_at_purchase: number;
  /** Dog breed (koira) or flag (lipputanko). */
  variant?: string | null;
  /** Dog name. */
  nickname?: string | null;
}

export interface PieceProgress {
  complete: boolean;
  /** Played days still needed; 0 when complete. */
  remainingDays: number;
}

export function pieceProgress(owned: OwnedPieceRecord, totalGamesPlayed: number): PieceProgress {
  const played = Math.max(0, totalGamesPlayed - owned.played_days_at_purchase);
  const remainingDays = Math.max(0, owned.build_days - played);
  return { complete: remainingDays === 0, remainingDays };
}

export function findOwned(owned: OwnedPieceRecord[], id: string): OwnedPieceRecord | undefined {
  return owned.find((p) => p.piece_id === id);
}

/** Owned and finished building. */
export function isPieceBuilt(owned: OwnedPieceRecord[], id: string, totalGamesPlayed: number): boolean {
  const record = findOwned(owned, id);
  return !!record && pieceProgress(record, totalGamesPlayed).complete;
}

/** Owned from before the tree, without all of its prerequisites. Still counts as unlocked. */
export function isGrandfathered(owned: OwnedPieceRecord[], id: string): boolean {
  const def = getPieceDef(id);
  if (!def || !findOwned(owned, id)) return false;
  return def.requires.some((r) => !findOwned(owned, r));
}

export type BuyCheck = { ok: true } | { ok: false; reason: string };

const names = (ids: string[]) => ids.map((m) => getPieceDef(m)?.name ?? m).join(", ");

export function canBuyPiece(id: string, owned: OwnedPieceRecord[], totalGamesPlayed: number): BuyCheck {
  const def = getPieceDef(id);
  if (!def) return { ok: false, reason: "Unknown piece" };
  if (def.comingSoon) return { ok: false, reason: "Coming soon" };
  if (findOwned(owned, id)) return { ok: false, reason: "You already own this" };
  const missing = def.requires.filter((r) => !findOwned(owned, r));
  if (missing.length > 0) return { ok: false, reason: `Requires ${names(missing)}` };
  const unfinished = def.requires.filter((r) => !isPieceBuilt(owned, r, totalGamesPlayed));
  if (unfinished.length > 0) return { ok: false, reason: `Wait for ${names(unfinished)} to finish` };
  const era = MOKKI_ERAS[def.era];
  if (totalGamesPlayed < era.minDaysPlayed) {
    return { ok: false, reason: `Era ${era.roman} opens after ${era.minDaysPlayed} days played` };
  }
  return { ok: true };
}

/** Unbuilt pieces on the way to `id` (including itself), cheapest-first order not guaranteed. */
export function pathToPiece(id: string, owned: OwnedPieceRecord[]): MokkiPieceDef[] {
  const out = new Map<string, MokkiPieceDef>();
  const visit = (pid: string) => {
    const def = getPieceDef(pid);
    if (!def || findOwned(owned, pid) || out.has(pid)) return;
    def.requires.forEach(visit);
    out.set(pid, def);
  };
  visit(id);
  return [...out.values()];
}

// ---------------------------------------------------------------------------
// Dog & flag
// ---------------------------------------------------------------------------

export type DogBreedId = "puudeli" | "aussi" | "lagotto";

export interface DogBreed {
  id: DogBreedId;
  name: string;
  english: string;
  look: string;
  trick: string;
  trickText: string;
  guardChance: number;
}

export const DOG_BREEDS: DogBreed[] = [
  {
    id: "puudeli",
    name: "Ruskea pikkupuudeli",
    english: "Brown mini poodle",
    look: "Small and chocolate brown, with pom-poms. Prances everywhere.",
    trick: "Makkaravaras",
    trickText: `Sneaks over to a neighbor's grill hut and steals a makkara: +${REWARDS.makkaravaras} cr.`,
    guardChance: GUARD_CHANCE_DEFAULT,
  },
  {
    id: "aussi",
    name: "Musta aussi",
    english: "Black Australian shepherd",
    look: "Black coat, white blaze and chest, little white dots across the face.",
    trick: "Vahtikoira",
    trickText: `Catches half of all pranksters. Every catch pays you +${REWARDS.foiled} cr.`,
    guardChance: GUARD_CHANCE_AUSSI,
  },
  {
    id: "lagotto",
    name: "Ruskea lagotto romagnolo",
    english: "Brown Lagotto Romagnolo",
    look: "A curly, woolly brown coat, a beard and a round teddy head.",
    trick: "Tryffelikoira",
    trickText: `Digs for mushrooms every day: ${REWARDS.tryffeliMin}–${REWARDS.tryffeliMax} cr, double in autumn, and the odd truffle (+${REWARDS.tryffeliJackpot}).`,
    guardChance: GUARD_CHANCE_DEFAULT,
  },
];

export function getDogBreed(id: string | null | undefined): DogBreed | undefined {
  return DOG_BREEDS.find((b) => b.id === id);
}

export const DOG_NAME_MAX = 16;

export type NameCheck = { ok: true; name: string } | { ok: false; reason: string };

export function validateDogName(raw: unknown): NameCheck {
  if (typeof raw !== "string") return { ok: false, reason: "Give your dog a name" };
  const name = raw.trim().replace(/\s+/g, " ");
  if (name.length === 0) return { ok: false, reason: "Give your dog a name" };
  if (name.length > DOG_NAME_MAX) return { ok: false, reason: `Max ${DOG_NAME_MAX} characters` };
  if (!/^[\p{L}\p{N} .'-]+$/u.test(name)) return { ok: false, reason: "Letters, numbers and spaces only" };
  return { ok: true, name };
}

export type FlagId = "siniristi" | "ahvenanmaa" | "saame" | "sateenkaari" | "piraatti";

export const FLAGS: { id: FlagId; name: string; emoji: string }[] = [
  { id: "siniristi", name: "Siniristilippu", emoji: "🇫🇮" },
  { id: "ahvenanmaa", name: "Ahvenanmaa", emoji: "🇦🇽" },
  { id: "saame", name: "Saamen lippu", emoji: "🟥" },
  { id: "sateenkaari", name: "Sateenkaari", emoji: "🏳️‍🌈" },
  { id: "piraatti", name: "Piraattilippu", emoji: "🏴‍☠️" },
];

export function isFlagId(id: unknown): id is FlagId {
  return FLAGS.some((f) => f.id === id);
}

// ---------------------------------------------------------------------------
// Actions: daily chores, cheeky pranks and friendly visits
// ---------------------------------------------------------------------------

export type MokkiActionId =
  | "makkara"
  | "onki"
  | "marjastus"
  | "saunavuoro"
  | "rapsuta"
  | "tryffeli"
  | "vessapaperi"
  | "ruotsin_lippu"
  | "marjavarkaus"
  | "makkaravaras"
  | "kalalahja"
  | "paljubileet"
  | "grillibileet";

export type MokkiActionKind = "chore" | "prank" | "social";

export interface MokkiActionDef {
  id: MokkiActionId;
  kind: MokkiActionKind;
  name: string;
  emoji: string;
  /** Short button label. */
  verb: string;
  description: string;
  /** Own piece needed (social visits only need a mökki). */
  requiresPiece?: MokkiPieceId;
  requiresBreed?: DogBreedId;
  /** The target island must have this piece built. */
  targetRequiresPiece?: MokkiPieceId;
  /** Helsinki months (1–12) when the action is available. */
  months?: number[];
  /** Chores open once you've played today. */
  needsPlayedToday?: boolean;
  /** Per actor per Helsinki day, across all targets. */
  maxPerDay?: number;
  /** Per target island per Helsinki day, across all visitors. */
  maxGuestsPerDay?: number;
  /** Leaves a visible mark on the target island until cleaned or expired. */
  visibleEffect?: boolean;
  /** Inbox line for the target. {from} = actor, {dog} = target's dog. */
  inbox?: string;
  inboxFoiled?: string;
}

export const MOKKI_ACTIONS: MokkiActionDef[] = [
  // Chores (own island)
  { id: "makkara", kind: "chore", name: "Makkaranpaisto", emoji: "🌭", verb: "Grill", description: "Grill a sausage over the fire.", requiresPiece: "nuotiopaikka", needsPlayedToday: true },
  { id: "onki", kind: "chore", name: "Onki", emoji: "🎣", verb: "Fish", description: "Cast a line and see what bites.", requiresPiece: "onkipaikka", needsPlayedToday: true },
  { id: "marjastus", kind: "chore", name: "Marjastus", emoji: "🫐", verb: "Pick", description: "Pick a bowl of berries.", requiresPiece: "marjapensaat", months: [6, 7, 8, 9], needsPlayedToday: true },
  { id: "saunavuoro", kind: "chore", name: "Saunavuoro", emoji: "♨️", verb: "Sauna", description: "Your daily sauna turn.", requiresPiece: "sauna", needsPlayedToday: true },
  { id: "rapsuta", kind: "chore", name: "Rapsuta", emoji: "🐾", verb: "Scratch", description: "Give your dog a good scratch.", requiresPiece: "koira", needsPlayedToday: true },
  { id: "tryffeli", kind: "chore", name: "Tryffelikoira", emoji: "🍄", verb: "Dig", description: "Your lagotto digs for mushrooms.", requiresPiece: "koira", requiresBreed: "lagotto", needsPlayedToday: true },

  // Cheeky pranks (neighbor's island)
  {
    id: "vessapaperi",
    kind: "prank",
    name: "Vessapaperi-isku",
    emoji: "🧻",
    verb: "TP the birches",
    description: "Drape toilet paper all over their birches.",
    requiresPiece: "huussi",
    maxPerDay: 3,
    visibleEffect: true,
    inbox: "{from} toilet-papered your birches 🧻",
    inboxFoiled: "{dog} chased {from} away before they could TP your birches!",
  },
  {
    id: "ruotsin_lippu",
    kind: "prank",
    name: "Ruotsin lippu",
    emoji: "🇸🇪",
    verb: "Hoist a Swedish flag",
    description: "Swap their flag for a Swedish one. Heja Sverige!",
    requiresPiece: "lipputanko",
    targetRequiresPiece: "lipputanko",
    maxPerDay: 3,
    visibleEffect: true,
    inbox: "{from} hoisted a Swedish flag on your pole 🇸🇪",
    inboxFoiled: "{dog} barked {from} off your flagpole!",
  },
  {
    id: "marjavarkaus",
    kind: "prank",
    name: "Marjavarkaus",
    emoji: "🫐",
    verb: "Raid the berries",
    description: "Pick their bushes bare.",
    requiresPiece: "marjapensaat",
    targetRequiresPiece: "marjapensaat",
    maxPerDay: 3,
    visibleEffect: true,
    inbox: "{from} picked your berry bushes bare 🫐",
    inboxFoiled: "{dog} caught {from} with their hands in your berry bushes!",
  },
  {
    id: "makkaravaras",
    kind: "prank",
    name: "Makkaravaras",
    emoji: "🐩",
    verb: "Send the poodle",
    description: "Your poodle sneaks over and steals a makkara from their grill hut.",
    requiresPiece: "koira",
    requiresBreed: "puudeli",
    targetRequiresPiece: "grillikota",
    maxPerDay: 1,
    inbox: "{from}'s poodle stole a makkara from your grill hut 🌭",
    inboxFoiled: "{dog} chased off {from}'s sausage-thieving poodle!",
  },

  // Friendly visits
  {
    id: "kalalahja",
    kind: "social",
    name: "Kalalahja",
    emoji: "🐟",
    verb: "Row over a fish",
    description: "Row over to their laituri with a fresh fish.",
    requiresPiece: "soutuvene",
    maxPerDay: 3,
    inbox: "{from} rowed over with a fresh fish 🐟",
  },
  {
    id: "paljubileet",
    kind: "social",
    name: "Paljubileet",
    emoji: "🛁",
    verb: "Hop in the palju",
    description: "Join the party in their hot tub.",
    targetRequiresPiece: "palju",
    maxGuestsPerDay: 5,
    inbox: "{from} hopped into your palju ♨️",
  },
  {
    id: "grillibileet",
    kind: "social",
    name: "Grillibileet",
    emoji: "🎉",
    verb: "Grab a makkara",
    description: "Grab a sausage at their grill hut.",
    targetRequiresPiece: "grillikota",
    maxGuestsPerDay: 5,
    inbox: "{from} came by for a makkara 🌭",
  },
];

export function getActionDef(id: string): MokkiActionDef | undefined {
  return MOKKI_ACTIONS.find((a) => a.id === id);
}

export interface ActorState {
  pieces: OwnedPieceRecord[];
  gamesPlayed: number;
  playedToday: boolean;
  peaceful: boolean;
}

export interface TargetState {
  pieces: OwnedPieceRecord[];
  gamesPlayed: number;
  peaceful: boolean;
  isTestUser: boolean;
}

export interface ActionContext {
  actor: ActorState;
  /** Set for pranks and social actions. */
  target?: TargetState;
  /** Helsinki month 1–12. */
  month: number;
  /** Times the actor already did this action today (all targets). */
  doneToday: number;
  /** The actor already did this action on this target today. */
  doneOnTargetToday: boolean;
  /** Visitors who already did this action on the target today. */
  guestsToday: number;
  /** A prank of this kind is still showing on the target. */
  effectActiveOnTarget: boolean;
}

export type ActionCheck = { ok: true } | { ok: false; reason: string };

export function canDoAction(def: MokkiActionDef, ctx: ActionContext): ActionCheck {
  const { actor, target } = ctx;
  if (def.requiresPiece && !isPieceBuilt(actor.pieces, def.requiresPiece, actor.gamesPlayed)) {
    return { ok: false, reason: `Needs a finished ${getPieceDef(def.requiresPiece)?.name ?? def.requiresPiece}` };
  }
  if (def.requiresBreed && findOwned(actor.pieces, "koira")?.variant !== def.requiresBreed) {
    return { ok: false, reason: `Only a ${getDogBreed(def.requiresBreed)?.english.toLowerCase()} can do this` };
  }
  if (def.months && !def.months.includes(ctx.month)) return { ok: false, reason: "Out of season" };
  if (def.needsPlayedToday && !actor.playedToday) return { ok: false, reason: "Play today's game first" };

  if (def.kind === "chore") {
    if (ctx.doneToday > 0) return { ok: false, reason: "Done for today" };
    return { ok: true };
  }

  if (!target) return { ok: false, reason: "Pick a neighbor" };
  if (target.isTestUser) return { ok: false, reason: "Not on this island" };
  if (def.targetRequiresPiece && !isPieceBuilt(target.pieces, def.targetRequiresPiece, target.gamesPlayed)) {
    return { ok: false, reason: `They have no ${getPieceDef(def.targetRequiresPiece)?.name ?? def.targetRequiresPiece}` };
  }
  if (def.kind === "prank") {
    if (actor.peaceful) return { ok: false, reason: "Your mökki is in peaceful mode" };
    if (target.peaceful) return { ok: false, reason: "This is a peaceful mökki" };
    if (def.visibleEffect && ctx.effectActiveOnTarget) return { ok: false, reason: "Someone already got them. Look!" };
  }
  if (ctx.doneOnTargetToday) return { ok: false, reason: "Already done here today" };
  if (def.maxPerDay !== undefined && ctx.doneToday >= def.maxPerDay) return { ok: false, reason: "That's enough for today" };
  if (def.maxGuestsPerDay !== undefined && ctx.guestsToday >= def.maxGuestsPerDay) return { ok: false, reason: "Full for today" };
  return { ok: true };
}

export interface FishCatch {
  id: string;
  name: string;
  emoji: string;
  reward: number;
  weight: number;
}

/** Catch tables: 1 = Onkipaikka, 2 = Laituri, 3 = Soutuvene. */
export const CATCHES: Record<1 | 2 | 3, FishCatch[]> = {
  1: [
    { id: "saapas", name: "Kumisaapas", emoji: "🥾", reward: 0, weight: 3 },
    { id: "sarki", name: "Särki", emoji: "🐟", reward: 1, weight: 4 },
    { id: "ahven", name: "Ahven", emoji: "🐟", reward: 2, weight: 4 },
    { id: "nokia", name: "Nokia 3310", emoji: "📱", reward: 4, weight: 1 },
  ],
  2: [
    { id: "saapas", name: "Kumisaapas", emoji: "🥾", reward: 0, weight: 2 },
    { id: "sarki", name: "Särki", emoji: "🐟", reward: 2, weight: 3 },
    { id: "ahven", name: "Ahven", emoji: "🐟", reward: 3, weight: 4 },
    { id: "lahna", name: "Lahna", emoji: "🐟", reward: 5, weight: 2 },
    { id: "nokia", name: "Nokia 3310", emoji: "📱", reward: 5, weight: 1 },
  ],
  3: [
    { id: "saapas", name: "Kumisaapas", emoji: "🥾", reward: 0, weight: 1 },
    { id: "ahven", name: "Ahven", emoji: "🐟", reward: 3, weight: 3 },
    { id: "lahna", name: "Lahna", emoji: "🐟", reward: 5, weight: 3 },
    { id: "kuha", name: "Kuha", emoji: "🐟", reward: 7, weight: 2 },
    { id: "hauki", name: "Hauki", emoji: "🐊", reward: 10, weight: 2 },
    { id: "nokia", name: "Nokia 3310", emoji: "📱", reward: 6, weight: 1 },
  ],
};

export function fishingTier(pieces: OwnedPieceRecord[], gamesPlayed: number): 1 | 2 | 3 {
  if (isPieceBuilt(pieces, "soutuvene", gamesPlayed)) return 3;
  if (isPieceBuilt(pieces, "laituri", gamesPlayed)) return 2;
  return 1;
}

function pickWeighted<T extends { weight: number }>(items: T[], r: number): T {
  const total = items.reduce((s, i) => s + i.weight, 0);
  let x = r * total;
  for (const item of items) {
    x -= item.weight;
    if (x < 0) return item;
  }
  return items[items.length - 1];
}

export interface ActionOutcome {
  /** Credits for the actor. */
  reward: number;
  /** Credits for the target island's owner. */
  targetReward: number;
  /** The target's dog stopped the prank. */
  foiled: boolean;
  /** What happened, e.g. "🐟 Ahven". */
  label: string;
}

/** Rolls the result of an allowed action. `rng` returns [0, 1); the server passes Math.random. */
export function rollAction(def: MokkiActionDef, ctx: ActionContext, rng: () => number): ActionOutcome {
  const { actor, target } = ctx;
  const none = { reward: 0, targetReward: 0, foiled: false };
  switch (def.id) {
    case "makkara": {
      const kota = isPieceBuilt(actor.pieces, "grillikota", actor.gamesPlayed);
      return { ...none, reward: kota ? REWARDS.makkaraKota : REWARDS.makkara, label: kota ? "🌭 Kota-grilled makkara" : "🌭 Makkara" };
    }
    case "onki": {
      const fish = pickWeighted(CATCHES[fishingTier(actor.pieces, actor.gamesPlayed)], rng());
      return { ...none, reward: fish.reward, label: `${fish.emoji} ${fish.name}` };
    }
    case "marjastus":
      return { ...none, reward: REWARDS.marjastus, label: "🫐 A bowl of berries" };
    case "saunavuoro":
      return { ...none, reward: REWARDS.saunavuoro, label: "♨️ Hyvät löylyt" };
    case "rapsuta":
      return { ...none, reward: REWARDS.rapsuta, label: "🐾 Happy dog" };
    case "tryffeli": {
      if (rng() < REWARDS.tryffeliJackpotChance) return { ...none, reward: REWARDS.tryffeliJackpot, label: "✨ A real tryffeli!" };
      const base = REWARDS.tryffeliMin + Math.floor(rng() * (REWARDS.tryffeliMax - REWARDS.tryffeliMin + 1));
      const autumn = ctx.month >= 9 && ctx.month <= 11;
      return { ...none, reward: autumn ? base * 2 : base, label: autumn ? "🍄 A basket of mushrooms" : "🍄 A few mushrooms" };
    }
  }

  if (def.kind === "prank") {
    const dog = target ? findOwned(target.pieces, "koira") : undefined;
    const dogBuilt = !!target && !!dog && isPieceBuilt(target.pieces, "koira", target.gamesPlayed);
    const guard = dogBuilt ? getDogBreed(dog?.variant)?.guardChance ?? GUARD_CHANCE_DEFAULT : 0;
    if (guard > 0 && rng() < guard) {
      return { reward: 0, targetReward: REWARDS.foiled, foiled: true, label: "🐕 Caught by the dog!" };
    }
    const reward = def.id === "makkaravaras" ? REWARDS.makkaravaras : def.id === "marjavarkaus" ? REWARDS.marjavarkaus : 0;
    return { ...none, reward, label: `${def.emoji} ${def.name}` };
  }

  switch (def.id) {
    case "kalalahja":
      return { ...none, reward: REWARDS.kalalahjaSender, targetReward: REWARDS.kalalahjaReceiver, label: "🐟 Fish delivered" };
    case "paljubileet":
      return { ...none, reward: REWARDS.paljuGuest, targetReward: REWARDS.paljuHost, label: "🛁 Into the palju!" };
    case "grillibileet":
      return { ...none, reward: REWARDS.grilliGuest, targetReward: REWARDS.grilliHost, label: "🌭 Makkara grabbed" };
  }
  return { ...none, label: def.name };
}

export function inboxLine(def: MokkiActionDef, from: string, foiled: boolean, dogName?: string | null): string {
  const template = (foiled ? def.inboxFoiled : def.inbox) ?? `${def.emoji} ${def.name} from {from}`;
  return template.replace("{from}", from).replace("{dog}", dogName || "Your dog");
}

// ---------------------------------------------------------------------------
// Streak with hammock naps
// ---------------------------------------------------------------------------

export const NAP_COOLDOWN_DAYS = 7;

const dayNumber = (date: string) => Date.parse(`${date}T00:00:00Z`) / 86400000;
const addDays = (date: string, days: number) => new Date((dayNumber(date) + days) * 86400000).toISOString().slice(0, 10);

export interface StreakResult {
  streak: number;
  /** Missed days the hammock forgave (most recent first). */
  napDays: string[];
}

/**
 * Daily streak of played days (YYYY-MM-DD, Helsinki). With a finished Riippumatto,
 * a single missed day on or after `napsFrom` is forgiven, at most once per 7 days.
 * Forgiven days keep the streak alive but don't add to it.
 */
export function streakWithNaps(playedDates: string[], today: string, napsFrom: string | null): StreakResult {
  const dates = [...new Set(playedDates)].filter((d) => d <= today).sort().reverse();
  const napDays: string[] = [];
  if (dates.length === 0) return { streak: 0, napDays };

  const canNap = (missed: string) =>
    !!napsFrom &&
    missed >= napsFrom &&
    (napDays.length === 0 || dayNumber(napDays[napDays.length - 1]) - dayNumber(missed) >= NAP_COOLDOWN_DAYS);

  const sinceLast = dayNumber(today) - dayNumber(dates[0]);
  if (sinceLast === 2 && canNap(addDays(today, -1))) napDays.push(addDays(today, -1));
  else if (sinceLast > 1) return { streak: 0, napDays };

  let streak = 1;
  for (let i = 0; i < dates.length - 1; i++) {
    const gap = dayNumber(dates[i]) - dayNumber(dates[i + 1]);
    if (gap === 1) {
      streak++;
    } else if (gap === 2 && canNap(addDays(dates[i], -1))) {
      napDays.push(addDays(dates[i], -1));
      streak++;
    } else {
      break;
    }
  }
  return { streak, napDays };
}

/** Helsinki date the hammock started forgiving days, or null without a finished hammock. */
export function napsFromDate(
  pieces: (OwnedPieceRecord & { purchased_at?: string })[],
  gamesPlayed: number,
): string | null {
  const hammock = findOwned(pieces, "riippumatto") as (OwnedPieceRecord & { purchased_at?: string }) | undefined;
  if (!hammock || !hammock.purchased_at || !pieceProgress(hammock, gamesPlayed).complete) return null;
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Helsinki" }).format(new Date(hammock.purchased_at));
}

// ---------------------------------------------------------------------------
// Seasons & sun (Helsinki)
// ---------------------------------------------------------------------------

export type MokkiSeason = "spring" | "summer" | "autumn" | "winter";

interface HelsinkiParts {
  year: number;
  month: number; // 1-12
  day: number;
  weekday: number; // 0 = Sunday
}

export function helsinkiParts(at: Date): HelsinkiParts {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Europe/Helsinki",
    year: "numeric",
    month: "numeric",
    day: "numeric",
    weekday: "short",
  }).formatToParts(at);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return {
    year: Number(get("year")),
    month: Number(get("month")),
    day: Number(get("day")),
    weekday: weekdays.indexOf(get("weekday")),
  };
}

export function seasonFor(at: Date): MokkiSeason {
  const { month } = helsinkiParts(at);
  if (month === 12 || month <= 3) return "winter";
  if (month <= 5) return "spring";
  if (month <= 8) return "summer";
  return "autumn";
}

/** Juhannusaatto (Friday between June 19–25) and juhannuspäivä (the Saturday after). */
export function isJuhannus(at: Date): boolean {
  const { month, day, weekday } = helsinkiParts(at);
  if (month !== 6) return false;
  if (weekday === 5) return day >= 19 && day <= 25;
  if (weekday === 6) return day >= 20 && day <= 26;
  return false;
}

const HELSINKI_LAT = 60.17;
const HELSINKI_LON = 24.94;

/**
 * Approximate sun position over Helsinki.
 * elevation: degrees above the horizon. azimuth: radians, 0 = south, positive = west.
 */
export function sunPosition(at: Date): { elevation: number; azimuth: number } {
  const rad = Math.PI / 180;
  const start = Date.UTC(at.getUTCFullYear(), 0, 0);
  const dayOfYear = (at.getTime() - start) / 86400000;
  const declination = -23.44 * Math.cos(((2 * Math.PI) / 365) * (dayOfYear + 10)) * rad;
  const utcHours = at.getUTCHours() + at.getUTCMinutes() / 60;
  const solarTime = utcHours + HELSINKI_LON / 15;
  const hourAngle = (solarTime - 12) * 15 * rad;
  const lat = HELSINKI_LAT * rad;
  const sinEl = Math.sin(lat) * Math.sin(declination) + Math.cos(lat) * Math.cos(declination) * Math.cos(hourAngle);
  const elevation = Math.asin(sinEl) / rad;
  const azimuth = Math.atan2(
    Math.sin(hourAngle),
    Math.cos(hourAngle) * Math.sin(lat) - Math.tan(declination) * Math.cos(lat),
  );
  return { elevation, azimuth };
}

/** Northern lights season: dark months, shown on clear-enough nights. */
export function isAuroraSeason(at: Date): boolean {
  const { month } = helsinkiParts(at);
  return month >= 10 || month <= 3;
}
