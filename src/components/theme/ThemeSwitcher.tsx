import { useEffect, useRef, useState } from "react";
import { Palette, Check } from "lucide-react";
import { useTheme, type ThemeMeta } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";

/**
 * Compact, inline theme switcher — icon button that opens a small dropdown.
 * Mount inside any header. Selection updates the global theme instantly and
 * persists via ThemeContext (localStorage + profile sync).
 */
export function ThemeSwitcher({ className }: { className?: string }) {
  const { theme, setTheme, themes } = useTheme();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("mousedown", onClick);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onClick);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const activeMeta = themes.find((t) => t.id === theme);

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Change theme (current: ${activeMeta?.label ?? theme})`}
        className="flex h-11 w-11 items-center justify-center rounded-full border border-border/60 bg-surface text-foreground shadow-sm transition-all hover:bg-surface-2 active:scale-95"
      >
        <Palette className="h-5 w-5" aria-hidden />
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Theme options"
          className="absolute right-0 top-full z-40 mt-2 w-64 origin-top-right animate-in fade-in slide-in-from-top-2 rounded-2xl border border-border/70 bg-surface p-2 shadow-elevated"
        >
          <p className="px-2 pt-1 pb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Theme
          </p>
          <ul className="space-y-1">
            {themes.map((t) => (
              <li key={t.id}>
                <ThemeMenuItem
                  meta={t}
                  active={t.id === theme}
                  onSelect={() => {
                    setTheme(t.id);
                    setOpen(false);
                  }}
                />
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function ThemeMenuItem({
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
      role="menuitemradio"
      aria-checked={active}
      onClick={onSelect}
      className={cn(
        "flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition-colors",
        active ? "bg-primary/10" : "hover:bg-surface-2",
      )}
    >
      <span aria-hidden className="flex shrink-0 -space-x-1.5">
        {meta.swatches.map((c, i) => (
          <span
            key={i}
            style={{ backgroundColor: c }}
            className="h-5 w-5 rounded-full border-2 border-surface shadow-sm ring-1 ring-black/10"
          />
        ))}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold leading-tight">
          {meta.label}
        </span>
      </span>
      {active && (
        <span
          aria-hidden
          className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground"
        >
          <Check className="h-3 w-3" />
        </span>
      )}
    </button>
  );
}
