import { describe, expect, it } from "vitest";
import { saunaStatus } from "./saunaStatus";

describe("saunaStatus", () => {
  it("celebrates the streak once today's game is played", () => {
    expect(saunaStatus(true, 12)).toBe("♨️ Sauna warm 12 days in a row");
    expect(saunaStatus(true, 1)).toBe("♨️ Sauna is warm · streak started");
  });

  it("nudges to keep a live streak, or to start one", () => {
    expect(saunaStatus(false, 12)).toBe("🪵 Light the stove to keep your 12-day streak");
    expect(saunaStatus(false, 0)).toBe("🪵 Play today to light the stove");
  });
});
