export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      lessons: {
        Row: {
          audio_example_url: string | null
          category: Database["public"]["Enums"]["lesson_category"]
          created_at: string
          french_text: string
          hints: string[]
          id: string
          order_index: number
          title: string
          translation: string | null
        }
        Insert: {
          audio_example_url?: string | null
          category: Database["public"]["Enums"]["lesson_category"]
          created_at?: string
          french_text: string
          hints?: string[]
          id?: string
          order_index?: number
          title: string
          translation?: string | null
        }
        Update: {
          audio_example_url?: string | null
          category?: Database["public"]["Enums"]["lesson_category"]
          created_at?: string
          french_text?: string
          hints?: string[]
          id?: string
          order_index?: number
          title?: string
          translation?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          audio_challenge_answer: string | null
          created_at: string
          daily_goal_minutes: number
          display_name: string | null
          french_level: string
          goal: string | null
          id: string
          onboarding_completed: boolean
          pain_point: string | null
          theme: string
          updated_at: string
        }
        Insert: {
          audio_challenge_answer?: string | null
          created_at?: string
          daily_goal_minutes?: number
          display_name?: string | null
          french_level?: string
          goal?: string | null
          id: string
          onboarding_completed?: boolean
          pain_point?: string | null
          theme?: string
          updated_at?: string
        }
        Update: {
          audio_challenge_answer?: string | null
          created_at?: string
          daily_goal_minutes?: number
          display_name?: string | null
          french_level?: string
          goal?: string | null
          id?: string
          onboarding_completed?: boolean
          pain_point?: string | null
          theme?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_attempts: {
        Row: {
          accuracy_score: number | null
          completeness_score: number | null
          created_at: string
          duration_ms: number | null
          expected_text: string
          fluency_score: number | null
          id: string
          lesson_id: string | null
          score: number
          transcript: string
          user_id: string
        }
        Insert: {
          accuracy_score?: number | null
          completeness_score?: number | null
          created_at?: string
          duration_ms?: number | null
          expected_text: string
          fluency_score?: number | null
          id?: string
          lesson_id?: string | null
          score: number
          transcript: string
          user_id: string
        }
        Update: {
          accuracy_score?: number | null
          completeness_score?: number | null
          created_at?: string
          duration_ms?: number | null
          expected_text?: string
          fluency_score?: number | null
          id?: string
          lesson_id?: string | null
          score?: number
          transcript?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_attempts_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      lesson_category:
        | "phonetics_basics"
        | "nasal_vowels"
        | "french_r_silent"
        | "liaison"
        | "minimal_pairs"
        | "custom"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      lesson_category: [
        "phonetics_basics",
        "nasal_vowels",
        "french_r_silent",
        "liaison",
        "minimal_pairs",
        "custom",
      ],
    },
  },
} as const
