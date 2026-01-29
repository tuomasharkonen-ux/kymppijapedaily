import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface UserSettings {
  activeSkin: string | null;
  activeAction: string | null;
}

export const useUserSettings = (userId: string | null) => {
  const [settings, setSettings] = useState<UserSettings>({
    activeSkin: null,
    activeAction: null,
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    if (!userId) {
      setSettings({ activeSkin: null, activeAction: null });
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("user_settings")
        .select("active_skin, active_action")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) {
        console.error("Error fetching settings:", error);
        return;
      }

      if (data) {
        setSettings({
          activeSkin: data.active_skin,
          activeAction: data.active_action,
        });
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const updateSkin = useCallback(
    async (skinId: string | null) => {
      if (!userId) return;

      try {
        const { error } = await supabase
          .from("user_settings")
          .upsert(
            { user_id: userId, active_skin: skinId },
            { onConflict: "user_id" }
          );

        if (error) {
          console.error("Error updating skin:", error);
          return;
        }

        setSettings((prev) => ({ ...prev, activeSkin: skinId }));
      } catch (error) {
        console.error("Error updating skin:", error);
      }
    },
    [userId]
  );

  const updateAction = useCallback(
    async (actionId: string | null) => {
      if (!userId) return;

      try {
        const { error } = await supabase
          .from("user_settings")
          .upsert(
            { user_id: userId, active_action: actionId },
            { onConflict: "user_id" }
          );

        if (error) {
          console.error("Error updating action:", error);
          return;
        }

        setSettings((prev) => ({ ...prev, activeAction: actionId }));
      } catch (error) {
        console.error("Error updating action:", error);
      }
    },
    [userId]
  );

  return {
    settings,
    isLoading,
    updateSkin,
    updateAction,
    refetchSettings: fetchSettings,
  };
};
