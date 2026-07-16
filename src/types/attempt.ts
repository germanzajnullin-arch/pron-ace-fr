import type { Database } from "@/integrations/supabase/types";

export type AttemptRow = Database["public"]["Tables"]["user_attempts"]["Row"];

export interface Attempt {
  id: string;
  lessonId: string | null;
  expectedText: string;
  transcript: string;
  score: number;
  durationMs: number | null;
  createdAt: string;
}

export interface AttemptDraft {
  lessonId: string | null;
  expectedText: string;
  transcript: string;
  score: number;
  durationMs: number | null;
}

export const toAttempt = (row: AttemptRow): Attempt => ({
  id: row.id,
  lessonId: row.lesson_id,
  expectedText: row.expected_text,
  transcript: row.transcript,
  score: Number(row.score),
  durationMs: row.duration_ms,
  createdAt: row.created_at,
});
