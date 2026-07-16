import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const CategoryEnum = z.enum([
  "phonetics_basics",
  "nasal_vowels",
  "french_r_silent",
  "liaison",
  "minimal_pairs",
  "custom",
]);

const buildPublicClient = () => {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error("Missing Supabase server env vars.");
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, storage: undefined },
  });
};

export const listLessonsByCategory = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => z.object({ category: CategoryEnum }).parse(input))
  .handler(async ({ data }) => {
    const supabase = buildPublicClient();
    const { data: rows, error } = await supabase
      .from("lessons")
      .select("*")
      .eq("category", data.category)
      .order("order_index", { ascending: true });
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const getLessonById = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data }) => {
    const supabase = buildPublicClient();
    const { data: row, error } = await supabase
      .from("lessons")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return row;
  });

export const getUserProgress = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: rows, error } = await context.supabase
      .from("user_attempts")
      .select("lesson_id, score, created_at")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    return rows ?? [];
  });
