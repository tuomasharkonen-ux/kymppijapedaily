import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { mokkiPromoSeen, readMokkiPromoLocal, readMokkiPromoSynced, writeMokkiPromoLocal, writeMokkiPromoSynced } from "@/lib/mokkiPromo";

async function saveMokkiPromoSeen(userId: string): Promise<boolean> {
  const { error } = await supabase
    .from("user_settings")
    .upsert({ user_id: userId, mokki_promo_seen_at: new Date().toISOString() }, { onConflict: "user_id" });
  if (error) {
    console.warn("Couldn't save mökki promo flag:", error.message);
    return false;
  }
  writeMokkiPromoSynced(userId);
  return true;
}

/**
 * Whether to show the one-time Mökki promo for this logged-in player.
 * `enabled` should be false until auth and the profile are ready, so it doesn't
 * stack on the username prompt.
 */
export function useMokkiPromo(userId: string | null, enabled: boolean) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!enabled || !userId) {
      setOpen(false);
      return;
    }
    let cancelled = false;

    const decide = async () => {
      const localSeen = readMokkiPromoLocal(userId);
      if (localSeen && !readMokkiPromoSynced(userId)) {
        // This device already dismissed it, but the row may never have been written
        // (migration not applied yet, or the request failed). Try once per device.
        const ok = await saveMokkiPromoSeen(userId);
        if (!ok) writeMokkiPromoLocal(userId);
      }
      if (localSeen) {
        if (!cancelled) setOpen(false);
        return;
      }

      const { data, error } = await supabase
        .from("user_settings")
        .select("mokki_promo_seen_at")
        .eq("user_id", userId)
        .maybeSingle();
      if (cancelled) return;
      // Dismiss may have landed while this request was in flight
      const localSeen = readMokkiPromoLocal(userId);
      if (error) {
        console.warn("Mökki promo flag unavailable:", error.message);
        setOpen(!localSeen);
        return;
      }
      const seen = mokkiPromoSeen(data?.mokki_promo_seen_at, localSeen);
      if (seen) writeMokkiPromoLocal(userId);
      setOpen(!seen);
    };

    void decide();
    return () => {
      cancelled = true;
    };
  }, [userId, enabled]);

  const dismiss = useCallback(() => {
    setOpen(false);
    if (!userId) return;
    writeMokkiPromoLocal(userId);
    void saveMokkiPromoSeen(userId);
  }, [userId]);

  return { open, dismiss };
}
