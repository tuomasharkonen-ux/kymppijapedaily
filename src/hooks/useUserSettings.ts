import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface UserSettings {
  activeSkin: string | null;
  activeActions: string[];
}

export const useUserSettings = (userId: string | null) => {
  const [settings, setSettings] = useState<UserSettings>({
    activeSkin: null,
    activeActions: [],
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    if (!userId) {
      setSettings({ activeSkin: null, activeActions: [] });
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
          activeActions: data.active_action || [],
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

  const toggleAction = useCallback(
    async (actionId: string) => {
      if (!userId) return;

      const currentActions = settings.activeActions;
      const isActive = currentActions.includes(actionId);
      const newActions = isActive
        ? currentActions.filter((id) => id !== actionId)
        : [...currentActions, actionId];

      try {
        const { error } = await supabase
          .from("user_settings")
          .upsert(
            { user_id: userId, active_action: newActions },
            { onConflict: "user_id" }
          );

        if (error) {
          console.error("Error updating actions:", error);
          return;
        }

        setSettings((prev) => ({ ...prev, activeActions: newActions }));
      } catch (error) {
        console.error("Error updating actions:", error);
      }
    },
    [userId, settings.activeActions]
  );

  return {
    settings,
    isLoading,
    updateSkin,
    toggleAction,
    refetchSettings: fetchSettings,
  };
};
