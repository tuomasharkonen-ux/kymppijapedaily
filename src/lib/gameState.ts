// Persists the daily game in progress so refreshing the page continues the same
// game instead of starting over. Not cheat-proof by design.

export interface DiceState {
  value: number;
  isLocked: boolean;
}

export interface SavedGame {
  dice: DiceState[];
  throwCount: number;
  throwLog: number[][];
  unlockedAny: boolean;
  usedAction: boolean;
  /** Betting sheet has been closed for the day (locked in or skipped). */
  bettingClosed: boolean;
}

const key = (userId: string, gameDate: string) => `kymppijape_game_${userId}_${gameDate}`;

export function loadGame(userId: string, gameDate: string): SavedGame | null {
  try {
    const raw = localStorage.getItem(key(userId, gameDate));
    if (!raw) return null;
    const saved = JSON.parse(raw) as SavedGame;
    if (!Array.isArray(saved.dice) || saved.dice.length !== 10 || !Array.isArray(saved.throwLog)) return null;
    return saved;
  } catch {
    return null;
  }
}

export function saveGame(userId: string, gameDate: string, game: SavedGame) {
  try {
    localStorage.setItem(key(userId, gameDate), JSON.stringify(game));
    // Drop saves from previous days
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i);
      if (k?.startsWith(`kymppijape_game_${userId}_`) && k !== key(userId, gameDate)) {
        localStorage.removeItem(k);
      }
    }
  } catch {
    // storage full or unavailable; the game still works without persistence
  }
}

export function updateSavedGame(userId: string, gameDate: string, patch: Partial<SavedGame>) {
  const current = loadGame(userId, gameDate);
  if (current) saveGame(userId, gameDate, { ...current, ...patch });
}
