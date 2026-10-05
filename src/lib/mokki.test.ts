import { describe, expect, it } from "vitest";
import {
  canBuyPiece,
  getPieceDef,
  isJuhannus,
  MOKKI_CATALOG_TOTAL,
  MOKKI_PIECES,
  pieceProgress,
  seasonFor,
  sunPosition,
} from "./mokki";

describe("catalog", () => {
  it("is a long-term sink of roughly 4000–5000 credits", () => {
    expect(MOKKI_CATALOG_TOTAL).toBeGreaterThanOrEqual(4000);
    expect(MOKKI_CATALOG_TOTAL).toBeLessThanOrEqual(5000);
  });

  it("has unique ids and valid requirements", () => {
    const ids = MOKKI_PIECES.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const piece of MOKKI_PIECES) {
      for (const req of piece.requires) expect(getPieceDef(req)).toBeDefined();
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

  it("checks ownership, requirements and days played", () => {
    expect(canBuyPiece("huussi", [], 0)).toEqual({ ok: true });
    expect(canBuyPiece("huussi", ["huussi"], 0).ok).toBe(false);
    expect(canBuyPiece("soutuvene", [], 50)).toEqual({ ok: false, reason: "Requires Laituri" });
    expect(canBuyPiece("laituri", [], 9).ok).toBe(false);
    expect(canBuyPiece("laituri", [], 10)).toEqual({ ok: true });
    expect(canBuyPiece("nope", [], 10).ok).toBe(false);
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
