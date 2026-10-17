/**
 * One-time Mökki promo.
 *
 * Source of truth is `user_settings.mokki_promo_seen_at` so a dismiss follows the
 * player across devices. localStorage is only a fallback: the column is added by
 * a migration that has to be pasted into the live Supabase SQL editor, and a
 * failed write should still keep the popup from returning on this device.
 */

const seenKey = (userId: string) => `kymppijape_mokki_promo_seen_${userId}`;
const syncedKey = (userId: string) => `kymppijape_mokki_promo_synced_${userId}`;

export function readMokkiPromoLocal(userId: string): boolean {
  try {
    return localStorage.getItem(seenKey(userId)) === "1";
  } catch {
    return false;
  }
}

export function writeMokkiPromoLocal(userId: string): void {
  try {
    localStorage.setItem(seenKey(userId), "1");
  } catch {
    // Private mode or a blocked storage API. The database write still stands.
  }
}

export function readMokkiPromoSynced(userId: string): boolean {
  try {
    return localStorage.getItem(syncedKey(userId)) === "1";
  } catch {
    return false;
  }
}

export function writeMokkiPromoSynced(userId: string): void {
  try {
    localStorage.setItem(syncedKey(userId), "1");
  } catch {
    // Same as above: a missing local flag only means we'll try the upsert again.
  }
}

/**
 * Hide the promo once either store says it was dismissed.
 * A local flag covers a database write that failed (missing column, offline).
 */
export function mokkiPromoSeen(dbSeenAt: string | null | undefined, localSeen: boolean): boolean {
  return !!dbSeenAt || localSeen;
}
