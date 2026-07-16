import { useEffect, useRef, useState } from "react";
import { Palette, Check, X } from "lucide-react";
import { useTheme, type ThemeMeta } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";

/**
 * Floating theme-picker button. Opens a bottom sheet with color-swatch previews.
 * Renders on top of the app; safe-area padded to sit above the bottom tab bar.
 */
export function ThemePicker() {
  const { theme, setTheme, themes } = useTheme();
  const [open, setOpen] = useState(false);
  const closeRef = useRef<HTMLButtonElement | null>(null);

  // Close on Escape.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    closeRef.current?.focus();
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Change theme"
        className="fixed right-4 bottom-24 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-hero text-primary-foreground shadow-elevated transition-transform hover:scale-105 active:scale-95"
      >
        <Palette className="h-5 w-5" aria-hidden />
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Theme settings"
          className="fixed inset-0 z-50 flex items-end justify-center"
        >
          <button
            type="button"
            aria-label="Close theme settings"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-background/70 backdrop-blur-sm"
          />
          <div className="relative mx-auto w-full max-w-md rounded-t-3xl border border-border/70 bg-surface p-5 pb-[max(env(safe-area-inset-bottom),1.25rem)] shadow-elevated">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold">Theme</h2>
                <p className="text-sm text-muted-foreground">
                  Pick a vibe. Your choice syncs across devices.
                </p>
              </div>
              <button
                ref={closeRef}
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-surface-2 hover:bg-secondary"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>

            <ul className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {themes.map((t) => (
                <li key={t.id}>
                  <ThemeCard
                    meta={t}
                    active={t.id === theme}
                    onSelect={() => setTheme(t.id)}
                  />
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}

function ThemeCard({
  meta,
  active,
  onSelect,
}: {
  meta: ThemeMeta;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={active}
      className={cn(
        "group flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition-all",
        active
          ? "border-primary bg-primary/10 shadow-neon"
          : "border-border bg-surface-2 hover:bg-secondary",
      )}
    >
      <SwatchStack colors={meta.swatches} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate font-semibold leading-tight">{meta.label}</p>
          {active && (
            <span
              aria-hidden
              className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground"
            >
              <Check className="h-3 w-3" />
            </span>
          )}
        </div>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">
          {meta.description}
        </p>
      </div>
    </button>
  );
}

function SwatchStack({ colors }: { colors: readonly [string, string, string] }) {
  return (
    <span aria-hidden className="flex shrink-0 -space-x-2">
      {colors.map((c, i) => (
        <span
          key={i}
          style={{ backgroundColor: c }}
          className="h-8 w-8 rounded-full border-2 border-surface shadow-sm ring-1 ring-black/10"
        />
      ))}
    </span>
  );
}
