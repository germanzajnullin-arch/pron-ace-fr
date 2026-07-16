import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuthSession } from "@/hooks/useAuthSession";

export const THEMES = ["neon", "ocean", "light", "cyber"] as const;
export type ThemeId = (typeof THEMES)[number];

export interface ThemeMeta {
  readonly id: ThemeId;
  readonly label: string;
  readonly description: string;
  /** Ordered swatch colors for the picker preview circles. */
  readonly swatches: readonly [string, string, string];
  /** true when the theme uses `color-scheme: light`. */
  readonly light: boolean;
}

export const THEME_META: Record<ThemeId, ThemeMeta> = {
  neon: {
    id: "neon",
    label: "Dark Neon",
    description: "Deep dark with neon green and purple.",
    swatches: ["#1a1832", "#6fe89c", "#b779ff"],
    light: false,
  },
  ocean: {
    id: "ocean",
    label: "Ocean",
    description: "Premium deep blue with cyan and royal blue.",
    swatches: ["#0f1e3d", "#6ac6e6", "#5a5cff"],
    light: false,
  },
  light: {
    id: "light",
    label: "Clean Light",
    description: "Minimal white with deep indigo accents.",
    swatches: ["#f7f8fc", "#3730a3", "#8b5cf6"],
    light: true,
  },
  cyber: {
    id: "cyber",
    label: "Cyber",
    description: "Energetic amber on rich dark.",
    swatches: ["#2b1f14", "#facc15", "#f59e0b"],
    light: false,
  },
};

const STORAGE_KEY = "prononce.theme";
const DEFAULT_THEME: ThemeId = "neon";

const isThemeId = (v: unknown): v is ThemeId =>
  typeof v === "string" && (THEMES as readonly string[]).includes(v);

const readStoredTheme = (): ThemeId => {
  if (typeof window === "undefined") return DEFAULT_THEME;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return isThemeId(raw) ? raw : DEFAULT_THEME;
  } catch {
    return DEFAULT_THEME;
  }
};

interface ThemeContextValue {
  readonly theme: ThemeId;
  readonly setTheme: (id: ThemeId) => void;
  readonly themes: readonly ThemeMeta[];
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

/** Applies a theme id to `document.documentElement` — pure DOM side-effect. */
const applyThemeToDom = (id: ThemeId): void => {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.dataset.theme = id;
  const isLight = THEME_META[id].light;
  root.classList.toggle("dark", !isLight);
};

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeId>(readStoredTheme);
  const { session } = useAuthSession();

  // Apply to DOM on mount + whenever theme changes.
  useEffect(() => {
    applyThemeToDom(theme);
  }, [theme]);

  // Hydrate from the authenticated user's profile once available.
  useEffect(() => {
    if (!session?.user) return;
    let cancelled = false;
    void supabase
      .from("profiles")
      .select("theme")
      .eq("id", session.user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return;
        if (data?.theme && isThemeId(data.theme) && data.theme !== theme) {
          setThemeState(data.theme);
        }
      });
    return () => {
      cancelled = true;
    };
    // Intentionally only depends on session identity — theme changes are pushed the other direction.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id]);

  const setTheme = useCallback(
    (id: ThemeId) => {
      setThemeState(id);
      try {
        window.localStorage.setItem(STORAGE_KEY, id);
      } catch {
        /* storage unavailable — in-memory only */
      }
      // Best-effort sync to profile; ignore errors (offline, RLS, etc.)
      const userId = session?.user?.id;
      if (userId) {
        void supabase.from("profiles").update({ theme: id }).eq("id", userId);
      }
    },
    [session?.user?.id],
  );

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      setTheme,
      themes: THEMES.map((id) => THEME_META[id]),
    }),
    [theme, setTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export const useTheme = (): ThemeContextValue => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside a ThemeProvider");
  return ctx;
};
