import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface UserSettings {
  activeSkin: string | null;
  activeActions: string[];
  activeThrowAnimation: string | null;
}

export const useUserSettings = (userId: string | null) => {
  const [settings, setSettings] = useState<UserSettings>({
    activeSkin: null,
    activeActions: [],
    activeThrowAnimation: null,
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    if (!userId) {
      setSettings({ activeSkin: null, activeActions: [], activeThrowAnimation: null });
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("user_settings")
        .select("active_skin, active_action, active_throw_animation")
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
          activeThrowAnimation: data.active_throw_animation,
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

  // Activate an action (add to active list if not already present)
  const activateAction = useCallback(
    async (actionId: string) => {
      if (!userId) return;

      // Skip if already active
      if (settings.activeActions.includes(actionId)) return;

      const newActions = [...settings.activeActions, actionId];

      try {
        const { error } = await supabase
          .from("user_settings")
          .upsert(
            { user_id: userId, active_action: newActions },
            { onConflict: "user_id" }
          );

        if (error) {
          console.error("Error activating action:", error);
          return;
        }

        setSettings((prev) => ({ ...prev, activeActions: newActions }));
      } catch (error) {
        console.error("Error activating action:", error);
      }
    },
    [userId, settings.activeActions]
  );

  const updateThrowAnimation = useCallback(
    async (animationId: string | null) => {
      if (!userId) return;

      try {
        const { error } = await supabase
          .from("user_settings")
          .upsert(
            { user_id: userId, active_throw_animation: animationId },
            { onConflict: "user_id" }
          );

        if (error) {
          console.error("Error updating throw animation:", error);
          return;
        }

        setSettings((prev) => ({ ...prev, activeThrowAnimation: animationId }));
      } catch (error) {
        console.error("Error updating throw animation:", error);
      }
    },
    [userId]
  );

  return {
    settings,
    isLoading,
    updateSkin,
    toggleAction,
    activateAction,
    updateThrowAnimation,
    refetchSettings: fetchSettings,
  };
};
