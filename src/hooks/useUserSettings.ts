import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface UserSettings {
  activeSkin: string | null;
  activeActions: string[];
  activeThrowAnimation: string | null;
  activeBackground: string | null;
  /** Owned features the player has switched off (e.g. betting_license, mokki_plot). */
  hiddenFeatures: string[];
}

export const useUserSettings = (userId: string | null) => {
  const [settings, setSettings] = useState<UserSettings>({
    activeSkin: null,
    activeActions: [],
    activeThrowAnimation: null,
    activeBackground: null,
    hiddenFeatures: [],
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    if (!userId) {
      setSettings({ activeSkin: null, activeActions: [], activeThrowAnimation: null, activeBackground: null, hiddenFeatures: [] });
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("user_settings")
        .select("active_skin, active_action, active_throw_animation, active_background")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) {
        console.error("Error fetching settings:", error);
        return;
      }

      if (data) {
        setSettings((prev) => ({
          ...prev,
          activeSkin: data.active_skin,
          activeActions: data.active_action || [],
          activeThrowAnimation: data.active_throw_animation,
          activeBackground: data.active_background ?? null,
        }));
      }

      // Separate query so the other settings still load if this column doesn't exist yet
      const { data: featureData, error: featureError } = await supabase
        .from("user_settings")
        .select("hidden_features")
        .eq("user_id", userId)
        .maybeSingle();
      if (featureError) {
        console.warn("Feature toggles unavailable:", featureError.message);
      } else if (featureData) {
        setSettings((prev) => ({ ...prev, hiddenFeatures: featureData.hidden_features ?? [] }));
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

  const updateBackground = useCallback(
    async (backgroundId: string | null) => {
      if (!userId) return;

      try {
        const { error } = await supabase
          .from("user_settings")
          .upsert(
            { user_id: userId, active_background: backgroundId },
            { onConflict: "user_id" }
          );

        if (error) {
          console.error("Error updating background:", error);
          return;
        }

        setSettings((prev) => ({ ...prev, activeBackground: backgroundId }));
      } catch (error) {
        console.error("Error updating background:", error);
      }
    },
    [userId]
  );

  const toggleFeature = useCallback(
    async (featureId: string) => {
      if (!userId) return;
      const previous = settings.hiddenFeatures;
      const next = previous.includes(featureId) ? previous.filter((id) => id !== featureId) : [...previous, featureId];
      // Optimistic: the UI hides or shows the feature right away
      setSettings((prev) => ({ ...prev, hiddenFeatures: next }));

      const { error } = await supabase
        .from("user_settings")
        .upsert({ user_id: userId, hidden_features: next }, { onConflict: "user_id" });
      if (error) {
        console.error("Error updating feature toggles:", error);
        setSettings((prev) => ({ ...prev, hiddenFeatures: previous }));
      }
    },
    [userId, settings.hiddenFeatures]
  );

  return {
    settings,
    isLoading,
    toggleFeature,
    updateSkin,
    toggleAction,
    activateAction,
    updateThrowAnimation,
    updateBackground,
    refetchSettings: fetchSettings,
  };
};
