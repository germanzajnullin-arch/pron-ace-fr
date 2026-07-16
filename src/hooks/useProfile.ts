import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuthSession } from "./useAuthSession";
import type { Database } from "@/integrations/supabase/types";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export type PainPoint = "french_r" | "nasal_vowels" | "liaison" | "fast_speech";
export type Goal = "overcome_barrier" | "professional" | "travel" | "accent";

/**
 * Reads and subscribes to the current user's profile.
 * Also creates a profile row on first read if the handle_new_user trigger
 * hasn't fired yet (safety net).
 */
export const useProfile = () => {
  const { session, loading: sessionLoading } = useAuthSession();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!session?.user) {
      setProfile(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .maybeSingle();
    if (!data) {
      // Safety: create if missing
      await supabase
        .from("profiles")
        .insert({ id: session.user.id })
        .select()
        .maybeSingle();
      const { data: retry } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .maybeSingle();
      setProfile(retry ?? null);
    } else {
      setProfile(data);
    }
    setLoading(false);
  }, [session]);

  useEffect(() => {
    if (sessionLoading) return;
    void refetch();
  }, [sessionLoading, refetch]);

  return { profile, loading: loading || sessionLoading, session, refetch };
};
