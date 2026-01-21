import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Profile {
  user_id: string;
  username: string;
  created_at: string;
  updated_at: string;
}

export const useProfile = (userId: string | null) => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    if (!userId) {
      setProfile(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (fetchError) {
        setError(fetchError.message);
      } else {
        setProfile(data);
      }
    } catch (err) {
      setError("Failed to fetch profile");
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const updateUsername = async (username: string): Promise<{ success: boolean; error?: string }> => {
    if (!userId) {
      return { success: false, error: "Not logged in" };
    }

    // Validate username format
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    if (!usernameRegex.test(username)) {
      return { 
        success: false, 
        error: "Username must be 3-20 characters and contain only letters, numbers, and underscores" 
      };
    }

    try {
      if (profile) {
        // Update existing profile
        const { error: updateError } = await supabase
          .from("profiles")
          .update({ username })
          .eq("user_id", userId);

        if (updateError) {
          if (updateError.message.includes("profiles_username_unique")) {
            return { success: false, error: "This username is already taken" };
          }
          return { success: false, error: updateError.message };
        }
      } else {
        // Create new profile
        const { error: insertError } = await supabase
          .from("profiles")
          .insert({ user_id: userId, username });

        if (insertError) {
          if (insertError.message.includes("profiles_username_unique")) {
            return { success: false, error: "This username is already taken" };
          }
          return { success: false, error: insertError.message };
        }
      }

      await fetchProfile();
      return { success: true };
    } catch (err) {
      return { success: false, error: "Failed to update username" };
    }
  };

  const deleteProfile = async (): Promise<{ success: boolean; error?: string }> => {
    if (!userId) {
      return { success: false, error: "Not logged in" };
    }

    try {
      const { error: deleteError } = await supabase
        .from("profiles")
        .delete()
        .eq("user_id", userId);

      if (deleteError) {
        return { success: false, error: deleteError.message };
      }

      setProfile(null);
      return { success: true };
    } catch (err) {
      return { success: false, error: "Failed to delete profile" };
    }
  };

  return {
    profile,
    isLoading,
    error,
    updateUsername,
    deleteProfile,
    refetch: fetchProfile,
  };
};
