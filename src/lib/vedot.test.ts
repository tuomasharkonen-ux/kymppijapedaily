import { describe, expect, it } from "vitest";
import { betShareLine, type BetRow } from "./vedot";

const bet = (over: Partial<BetRow>): BetRow => ({
  id: "b",
  bet_type: "nopea",
  tier: "rohkea",
  lukitut: false,
  max_throws: 9,
  stake: 50,
  odds: 4.3,
  status: "won",
  payout: 215,
  ...over,
});

describe("betShareLine", () => {
  it("summarises won bets with net winnings", () => {
    const bets = [bet({}), bet({ status: "lost", stake: 25, payout: 0 }), bet({ stake: 20, payout: 202, lukitut: true })];
    expect(betShareLine(bets, true)).toBe("🎰 2/3 bets won 🔒 · +322 cr ♨️");
  });

  it("hides the amount on a net loss", () => {
    expect(betShareLine([bet({ status: "lost", payout: 0 })], false)).toBe("🎰 0/1 bet won");
  });

  it("skips refunds and open bets", () => {
    expect(betShareLine([bet({ status: "void" }), bet({ status: "open" })], false)).toBeNull();
    expect(betShareLine([bet({ status: "void" })], true)).toBe("♨️ In the Pot of the Day");
  });
});
