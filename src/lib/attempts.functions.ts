import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const AttemptInput = z.object({
  lessonId: z.string().uuid().nullable(),
  expectedText: z.string().trim().min(1).max(1000),
  transcript: z.string().trim().max(1000),
  score: z.number().min(0).max(1),
  durationMs: z.number().int().min(0).max(300_000).nullable(),
});

export const saveAttempt = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => AttemptInput.parse(input))
  .handler(async ({ data, context }) => {
    const { error, data: row } = await context.supabase
      .from("user_attempts")
      .insert({
        user_id: context.userId,
        lesson_id: data.lessonId,
        expected_text: data.expectedText,
        transcript: data.transcript,
        score: data.score,
        duration_ms: data.durationMs,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const listAttempts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("user_attempts")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw new Error(error.message);
    return data ?? [];
  });
