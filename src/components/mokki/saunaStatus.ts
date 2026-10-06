/** The sauna line under the island: today's play and the daily streak. */
export function saunaStatus(playedToday: boolean, streak: number): string {
  if (playedToday) {
    return streak >= 2 ? `♨️ Sauna warm ${streak} days in a row` : "♨️ Sauna is warm · streak started";
  }
  // The streak is still alive until midnight if yesterday was played
  return streak >= 1 ? `🪵 Light the stove to keep your ${streak}-day streak` : "🪵 Play today to light the stove";
}
