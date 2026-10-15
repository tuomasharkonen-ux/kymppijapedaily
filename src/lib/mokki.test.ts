import { describe, expect, it } from "vitest";
import {
  canBuyPiece,
  canDoAction,
  DOG_BREEDS,
  getActionDef,
  getDogBreed,
  getPieceDef,
  inboxLine,
  isGrandfathered,
  isJuhannus,
  isPieceBuilt,
  MOKKI_ACTIONS,
  MOKKI_ERAS,
  MOKKI_LANES,
  MOKKI_PIECES,
  pathToPiece,
  pieceMinDays,
  pieceProgress,
  rollAction,
  seasonFor,
  streakWithNaps,
  sunPosition,
  validateDogName,
  type ActionContext,
} from "./mokki";

const rec = (piece_id: string, played_days_at_purchase = 0, build_days = 1, variant: string | null = null) => ({
  piece_id,
  build_days,
  played_days_at_purchase,
  variant,
});

describe("tree catalog", () => {
  it("has unique ids, valid requirements and no cycles", () => {
    const ids = MOKKI_PIECES.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const piece of MOKKI_PIECES) {
      for (const req of piece.requires) {
        const parent = getPieceDef(req);
        expect(parent).toBeDefined();
        // Parents sit to the left of their children, so the graph can't loop
        expect(parent!.col).toBeLessThan(piece.col);
        expect(parent!.era).toBeLessThanOrEqual(piece.era);
      }
    }
  });

  it("puts every node in its own layout cell inside its era and lane", () => {
    const cells = MOKKI_PIECES.map((p) => `${p.lane}:${p.row}:${p.col}`);
    expect(new Set(cells).size).toBe(cells.length);
    for (const p of MOKKI_PIECES) {
      expect(MOKKI_ERAS[p.era].cols).toContain(p.col);
      expect(p.row).toBeLessThan(MOKKI_LANES.find((l) => l.id === p.lane)!.rows);
    }
  });

  it("keeps the existing day gates", () => {
    expect(pieceMinDays(getPieceDef("laituri")!)).toBe(10);
    expect(pieceMinDays(getPieceDef("soutuvene")!)).toBe(10);
    expect(pieceMinDays(getPieceDef("grillikota")!)).toBe(30);
    expect(pieceMinDays(getPieceDef("palju")!)).toBe(30);
  });

  it("every action points at real pieces", () => {
    for (const a of MOKKI_ACTIONS) {
      if (a.requiresPiece) expect(getPieceDef(a.requiresPiece)).toBeDefined();
      if (a.targetRequiresPiece) expect(getPieceDef(a.targetRequiresPiece)).toBeDefined();
      if (a.requiresBreed) expect(getDogBreed(a.requiresBreed)).toBeDefined();
    }
  });
});

describe("building", () => {
  it("finishes after enough played days", () => {
    const owned = { piece_id: "sauna", build_days: 3, played_days_at_purchase: 40 };
    expect(pieceProgress(owned, 40)).toEqual({ complete: false, remainingDays: 3 });
    expect(pieceProgress(owned, 42)).toEqual({ complete: false, remainingDays: 1 });
    expect(pieceProgress(owned, 43)).toEqual({ complete: true, remainingDays: 0 });
    expect(pieceProgress(owned, 50)).toEqual({ complete: true, remainingDays: 0 });
  });

  it("checks ownership, requirements and era gates", () => {
    expect(canBuyPiece("huussi", [], 0)).toEqual({ ok: true });
    expect(canBuyPiece("huussi", [rec("huussi")], 0).ok).toBe(false);
    expect(canBuyPiece("soutuvene", [], 50)).toEqual({ ok: false, reason: "Requires Laituri" });
    expect(canBuyPiece("laituri", [rec("onkipaikka")], 9)).toEqual({ ok: false, reason: "Era II opens after 10 days played" });
    expect(canBuyPiece("laituri", [rec("onkipaikka")], 10)).toEqual({ ok: true });
    expect(canBuyPiece("grillikota", [rec("puuvaja")], 40)).toEqual({ ok: false, reason: "Requires Nuotiopaikka" });
    expect(canBuyPiece("nope", [], 10).ok).toBe(false);
  });

  it("needs parents finished, not just bought", () => {
    const owned = [rec("puuvaja", 20, 2)];
    expect(canBuyPiece("sauna", owned, 21)).toEqual({ ok: false, reason: "Wait for Puuvaja to finish" });
    expect(canBuyPiece("sauna", owned, 22)).toEqual({ ok: true });
  });

  it("refuses coming-soon pieces", () => {
    expect(canBuyPiece("mehilaispesat", [rec("marjapensaat")], 99)).toEqual({ ok: false, reason: "Coming soon" });
  });

  it("grandfathers pieces bought before the tree", () => {
    // Bought Grillikota back when it needed nothing
    const owned = [rec("grillikota", 30, 4), rec("puuvaja")];
    expect(isGrandfathered(owned, "grillikota")).toBe(true);
    expect(isPieceBuilt(owned, "grillikota", 40)).toBe(true);
    // The missing parent can still be bought to fill the gap
    expect(canBuyPiece("nuotiopaikka", owned, 40)).toEqual({ ok: true });
    // And a grandfathered parent unlocks its children (Palju needs only the sauna)
    expect(canBuyPiece("palju", [rec("sauna", 0, 3)], 40)).toEqual({ ok: true });
    expect(isGrandfathered([rec("sauna", 0, 3)], "sauna")).toBe(true);
  });

  it("lists the unbuilt path to a piece", () => {
    const path = pathToPiece("palju", [rec("puuvaja")]).map((p) => p.id);
    expect(path).toEqual(["sauna", "palju"]);
  });
});

describe("dog and flags", () => {
  it("validates dog names", () => {
    expect(validateDogName("  Pörrö  ")).toEqual({ ok: true, name: "Pörrö" });
    expect(validateDogName("").ok).toBe(false);
    expect(validateDogName("x".repeat(17)).ok).toBe(false);
    expect(validateDogName("<script>").ok).toBe(false);
    expect(DOG_BREEDS.map((b) => b.id)).toEqual(["puudeli", "aussi", "lagotto"]);
  });
});

describe("actions", () => {
  const base = (over: Partial<ActionContext> = {}): ActionContext => ({
    actor: { pieces: [rec("nuotiopaikka"), rec("huussi"), rec("lipputanko")], gamesPlayed: 50, playedToday: true, peaceful: false },
    month: 10,
    doneToday: 0,
    doneOnTargetToday: false,
    guestsToday: 0,
    effectActiveOnTarget: false,
    ...over,
  });
  const target = (pieces = [rec("lipputanko")], over = {}) => ({ pieces, gamesPlayed: 50, peaceful: false, isTestUser: false, ...over });
  const act = (id: string) => getActionDef(id)!;

  it("opens chores after today's game, once a day", () => {
    expect(canDoAction(act("makkara"), base())).toEqual({ ok: true });
    expect(canDoAction(act("makkara"), base({ actor: { ...base().actor, playedToday: false } })).ok).toBe(false);
    expect(canDoAction(act("makkara"), base({ doneToday: 1 }))).toEqual({ ok: false, reason: "Done for today" });
    expect(canDoAction(act("onki"), base())).toEqual({ ok: false, reason: "Needs a finished Onkipaikka" });
  });

  it("keeps berries seasonal", () => {
    const ctx = base({ actor: { ...base().actor, pieces: [rec("marjapensaat")] } });
    expect(canDoAction(act("marjastus"), ctx)).toEqual({ ok: false, reason: "Out of season" });
    expect(canDoAction(act("marjastus"), { ...ctx, month: 7 })).toEqual({ ok: true });
  });

  it("gates pranks on target pieces, peace and active marks", () => {
    expect(canDoAction(act("ruotsin_lippu"), base({ target: target([]) }))).toEqual({ ok: false, reason: "They have no Lipputanko" });
    expect(canDoAction(act("ruotsin_lippu"), base({ target: target() }))).toEqual({ ok: true });
    expect(canDoAction(act("vessapaperi"), base({ target: target([], { peaceful: true }) })).ok).toBe(false);
    expect(canDoAction(act("vessapaperi"), base({ target: target(), actor: { ...base().actor, peaceful: true } })).ok).toBe(false);
    expect(canDoAction(act("vessapaperi"), base({ target: target(), effectActiveOnTarget: true })).ok).toBe(false);
    expect(canDoAction(act("vessapaperi"), base({ target: target(), doneToday: 3 })).ok).toBe(false);
  });

  it("caps guests per island", () => {
    const t = target([rec("palju", 0, 4)]);
    expect(canDoAction(act("paljubileet"), base({ target: t }))).toEqual({ ok: true });
    expect(canDoAction(act("paljubileet"), base({ target: t, guestsToday: 5 }))).toEqual({ ok: false, reason: "Full for today" });
  });

  it("needs the right breed for breed tricks", () => {
    const withDog = (breed: string) => base({ actor: { ...base().actor, pieces: [rec("koira", 0, 2, breed)] } });
    expect(canDoAction(act("tryffeli"), withDog("lagotto"))).toEqual({ ok: true });
    expect(canDoAction(act("tryffeli"), withDog("aussi")).ok).toBe(false);
  });

  it("rolls fish by tier and upgrades makkara with a grill hut", () => {
    const ctx = base({ actor: { ...base().actor, pieces: [rec("onkipaikka"), rec("laituri"), rec("soutuvene")] } });
    expect(rollAction(act("onki"), ctx, () => 0.999).label).toContain("Nokia");
    expect(rollAction(act("onki"), ctx, () => 0).reward).toBe(0);
    expect(rollAction(act("makkara"), base(), () => 0).reward).toBe(2);
    const kota = base({ actor: { ...base().actor, pieces: [rec("nuotiopaikka"), rec("grillikota")] } });
    expect(rollAction(act("makkara"), kota, () => 0).reward).toBe(4);
  });

  it("lets a dog foil pranks, the aussie most often", () => {
    const aussi = target([rec("lipputanko"), rec("koira", 0, 2, "aussi")]);
    const poodle = target([rec("lipputanko"), rec("koira", 0, 2, "puudeli")]);
    expect(rollAction(act("ruotsin_lippu"), base({ target: aussi }), () => 0.4).foiled).toBe(true);
    expect(rollAction(act("ruotsin_lippu"), base({ target: poodle }), () => 0.4).foiled).toBe(false);
    expect(rollAction(act("ruotsin_lippu"), base({ target: target() }), () => 0).foiled).toBe(false);
  });

  it("writes inbox lines", () => {
    expect(inboxLine(act("vessapaperi"), "Aino", false)).toBe("Aino toilet-papered your birches 🧻");
    expect(inboxLine(act("vessapaperi"), "Aino", true, "Musti")).toContain("Musti chased Aino");
  });
});

describe("hammock naps", () => {
  const today = "2026-10-15";
  it("counts a plain streak", () => {
    expect(streakWithNaps(["2026-10-15", "2026-10-14", "2026-10-13"], today, null).streak).toBe(3);
    expect(streakWithNaps(["2026-10-14", "2026-10-13"], today, null).streak).toBe(2);
    expect(streakWithNaps(["2026-10-13"], today, null).streak).toBe(0);
  });

  it("forgives one missed day per week after the hammock was built", () => {
    const dates = ["2026-10-15", "2026-10-13", "2026-10-12"];
    expect(streakWithNaps(dates, today, null).streak).toBe(1);
    expect(streakWithNaps(dates, today, "2026-10-01")).toEqual({ streak: 3, napDays: ["2026-10-14"] });
    // Before the hammock existed: no nap
    expect(streakWithNaps(dates, today, "2026-10-15").streak).toBe(1);
  });

  it("keeps a streak alive when only yesterday was missed", () => {
    expect(streakWithNaps(["2026-10-13", "2026-10-12"], today, "2026-10-01").streak).toBe(2);
  });

  it("allows only one nap per 7 days", () => {
    const dates = ["2026-10-15", "2026-10-13", "2026-10-11", "2026-10-10"];
    expect(streakWithNaps(dates, today, "2026-10-01").streak).toBe(2);
    const spaced = ["2026-10-15", "2026-10-13", "2026-10-12", "2026-10-11", "2026-10-10", "2026-10-09", "2026-10-08", "2026-10-06"];
    expect(streakWithNaps(spaced, today, "2026-10-01")).toEqual({ streak: 8, napDays: ["2026-10-14", "2026-10-07"] });
  });
});

describe("seasons and sun", () => {
  it("maps Finnish months to seasons", () => {
    expect(seasonFor(new Date("2026-10-06T12:00:00Z"))).toBe("autumn");
    expect(seasonFor(new Date("2026-01-15T12:00:00Z"))).toBe("winter");
    expect(seasonFor(new Date("2026-07-01T12:00:00Z"))).toBe("summer");
    expect(seasonFor(new Date("2026-05-01T12:00:00Z"))).toBe("spring");
  });

  it("knows juhannus", () => {
    expect(isJuhannus(new Date("2026-06-19T15:00:00Z"))).toBe(true); // Friday
    expect(isJuhannus(new Date("2026-06-20T15:00:00Z"))).toBe(true); // Saturday
    expect(isJuhannus(new Date("2026-06-17T15:00:00Z"))).toBe(false);
  });

  it("has midnight sun twilight in June and kaamos in December", () => {
    const juneMidnight = sunPosition(new Date("2026-06-21T22:20:00Z")); // ~01:20 local
    expect(juneMidnight.elevation).toBeGreaterThan(-8);
    expect(juneMidnight.elevation).toBeLessThan(0);
    const juneNoon = sunPosition(new Date("2026-06-21T10:20:00Z"));
    expect(juneNoon.elevation).toBeGreaterThan(50);
    const decNoon = sunPosition(new Date("2026-12-21T10:20:00Z"));
    expect(decNoon.elevation).toBeGreaterThan(4);
    expect(decNoon.elevation).toBeLessThan(8);
  });
});
