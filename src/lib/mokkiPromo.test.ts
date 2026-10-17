import { describe, expect, it } from "vitest";
import { mokkiPromoSeen } from "./mokkiPromo";

describe("mokki promo seen flag", () => {
  it("stays hidden once the database has a timestamp", () => {
    expect(mokkiPromoSeen("2026-10-17T12:00:00Z", false)).toBe(true);
  });

  it("stays hidden from the local fallback when the database write never landed", () => {
    expect(mokkiPromoSeen(null, true)).toBe(true);
    expect(mokkiPromoSeen(undefined, true)).toBe(true);
  });

  it("shows when neither store has a dismiss", () => {
    expect(mokkiPromoSeen(null, false)).toBe(false);
    expect(mokkiPromoSeen(undefined, false)).toBe(false);
  });
});
