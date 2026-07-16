import type { Database } from "@/integrations/supabase/types";

export type LessonCategory = Database["public"]["Enums"]["lesson_category"];

export type LessonRow = Database["public"]["Tables"]["lessons"]["Row"];

export interface Lesson {
  id: string;
  category: LessonCategory;
  orderIndex: number;
  title: string;
  frenchText: string;
  translation: string | null;
  audioExampleUrl: string | null;
  hints: readonly string[];
}

export const toLesson = (row: LessonRow): Lesson => ({
  id: row.id,
  category: row.category,
  orderIndex: row.order_index,
  title: row.title,
  frenchText: row.french_text,
  translation: row.translation,
  audioExampleUrl: row.audio_example_url,
  hints: row.hints ?? [],
});
