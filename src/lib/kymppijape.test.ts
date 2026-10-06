import { describe, expect, it } from "vitest";
import {
  betPayout,
  betWins,
  computePersonalLines,
  computeTierLines,
  countFaces,
  getOpeningDice,
  helsinkiDate,
  isBettingDisabled,
  isThrowLogConsistent,
  MAX_PAYOUT_PER_BET,
  priceBet,
  priceSlip,
  probFinishWithin,
  shiftDate,
} from "./kymppijape";

const OPENING = [3, 3, 3, 5, 1, 6, 2, 3, 5, 4]; // four 3s, two 5s
const NO_PERSONAL = { keskiarvo: null, ennatys: null };

describe("game day", () => {
  it("uses Helsinki time", () => {
    // 22:30 UTC on Oct 5 is already Oct 6 in Helsinki (UTC+3 in summer time)
    expect(helsinkiDate(new Date("2026-10-05T22:30:00Z"))).toBe("2026-10-06");
    expect(helsinkiDate(new Date("2026-10-05T20:30:00Z"))).toBe("2026-10-05");
    // Winter time (UTC+2)
    expect(helsinkiDate(new Date("2026-12-31T22:30:00Z"))).toBe("2027-01-01");
  });

  it("shifts dates across month boundaries", () => {
    expect(shiftDate("2026-03-01", -1)).toBe("2026-02-28");
    expect(shiftDate("2026-12-31", 1)).toBe("2027-01-01");
  });
});

describe("opening", () => {
  it("is the same for everyone on a day and changes between days", () => {
    expect(getOpeningDice("2026-10-06")).toEqual(getOpeningDice("2026-10-06"));
    expect(getOpeningDice("2026-10-06")).not.toEqual(getOpeningDice("2026-10-07"));
    expect(getOpeningDice("2026-10-06")).toHaveLength(10);
  });
});

describe("pricing", () => {
  it("matches a Monte Carlo simulation of greedy play", () => {
    const k = countFaces(OPENING)[3];
    const games = 40000;
    let within9 = 0;
    for (let g = 0; g < games; g++) {
      let locked = k;
      let throws = 1;
      while (locked < 10) {
        let hits = 0;
        for (let i = 0; i < 10 - locked; i++) if (Math.random() < 1 / 6) hits++;
        locked += hits;
        throws++;
      }
      if (throws <= 9) within9++;
    }
    expect(within9 / games).toBeCloseTo(probFinishWithin(9, k), 1);
  });

  it("picks decreasing tier lines near their targets", () => {
    const lines = computeTierLines(OPENING);
    expect(lines).toEqual({ varma: 13, rohkea: 9, hullu: 6 });
    for (let day = 0; day < 200; day++) {
      const opening = getOpeningDice(shiftDate("2026-01-01", day));
      if (isBettingDisabled(opening)) continue;
      const l = computeTierLines(opening);
      expect(l.varma).toBeGreaterThan(l.rohkea);
      expect(l.rohkea).toBeGreaterThan(l.hullu);
      expect(l.hullu).toBeGreaterThanOrEqual(2);
    }
  });

  it("prices the Bold tier off the most common number in the opening", () => {
    const res = priceBet({ type: "nopea", tier: "rohkea", stake: 10 }, OPENING, NO_PERSONAL);
    if (!res.ok) throw new Error("expected ok");
    expect(res.bet.maxThrows).toBe(9);
    expect(res.bet.odds).toBeCloseTo(4.3, 1);
  });

  it("applies the Lukitut nopat multiplier", () => {
    const plain = priceBet({ type: "nopea", tier: "varma", stake: 10 }, OPENING, NO_PERSONAL);
    const locked = priceBet({ type: "nopea", tier: "varma", lukitut: true, stake: 10 }, OPENING, NO_PERSONAL);
    if (!plain.ok || !locked.ok) throw new Error("expected ok");
    expect(locked.bet.odds).toBeCloseTo(plain.bet.odds * 1.1, 1);
  });

  it("pays less back on the Crazy tier", () => {
    const res = priceBet({ type: "nopea", tier: "hullu", stake: 10 }, OPENING, NO_PERSONAL);
    if (!res.ok) throw new Error("expected ok");
    expect(res.bet.odds * res.bet.probability).toBeCloseTo(0.75, 2);
  });

  it("requires history for personal bets", () => {
    expect(computePersonalLines([10, 12, 14])).toEqual(NO_PERSONAL);
    const lines = computePersonalLines([14, 16, 15, 7, 23]); // avg 15
    expect(lines).toEqual({ keskiarvo: 14, ennatys: 7 });
    expect(priceBet({ type: "keskiarvo", stake: 10 }, OPENING, NO_PERSONAL).ok).toBe(false);
    const res = priceBet({ type: "ennatys", stake: 10 }, OPENING, lines);
    expect(res.ok && res.bet.odds).toBeCloseTo(10.1, 0);
  });

  it("enforces slip limits", () => {
    const bet = { type: "nopea" as const, tier: "varma" as const, stake: 60 };
    expect(priceSlip([bet, bet, { ...bet, stake: 80 }], OPENING, NO_PERSONAL).ok).toBe(true);
    expect(priceSlip([bet, bet, bet, bet], OPENING, NO_PERSONAL).ok).toBe(false);
    expect(priceSlip([bet, bet, { ...bet, stake: 81 }], OPENING, NO_PERSONAL).ok).toBe(false);
    expect(priceSlip([{ ...bet, stake: 5 }], OPENING, NO_PERSONAL).ok).toBe(false);
    expect(priceSlip([bet], [2, 2, 2, 2, 2, 2, 2, 2, 2, 2], NO_PERSONAL).ok).toBe(false);
    expect(priceSlip([{ ...bet, lukitut: true }, { ...bet, lukitut: true }], OPENING, NO_PERSONAL).ok).toBe(true);
    expect(priceSlip([{ ...bet, lukitut: true }, bet], OPENING, NO_PERSONAL).ok).toBe(false);
  });
});

describe("settlement", () => {
  const bet = { maxThrows: 9, lukitut: false };

  it("only rewards finishing fast enough", () => {
    expect(betWins(bet, { throws: 9, winningNumber: 3, unlockedAny: false })).toBe(true);
    expect(betWins(bet, { throws: 10, winningNumber: 3, unlockedAny: false })).toBe(false);
  });

  it("checks Lukitut nopat", () => {
    expect(betWins({ ...bet, lukitut: true }, { throws: 5, winningNumber: 6, unlockedAny: false })).toBe(true);
    expect(betWins({ ...bet, lukitut: true }, { throws: 5, winningNumber: 6, unlockedAny: true })).toBe(false);
  });

  it("caps payouts", () => {
    expect(betPayout(25, 4.3)).toBe(107);
    expect(betPayout(300, 100)).toBe(MAX_PAYOUT_PER_BET);
  });

  it("sanity-checks the throw log", () => {
    const last = Array(10).fill(3);
    expect(isThrowLogConsistent([OPENING, last], OPENING, 2, 3)).toBe(true);
    expect(isThrowLogConsistent([OPENING, last], OPENING, 3, 3)).toBe(false);
    expect(isThrowLogConsistent([last, last], OPENING, 2, 3)).toBe(false);
    expect(isThrowLogConsistent([OPENING, last], OPENING, 2, 4)).toBe(false);
    expect(isThrowLogConsistent("nope", OPENING, 2, 3)).toBe(false);
  });
});
