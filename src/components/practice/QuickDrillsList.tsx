import { Link } from "@tanstack/react-router";
import { ChevronRight, Sparkles } from "lucide-react";
import { QUICK_DRILL_MODULES } from "@/config/modules";
import { PAIN_POINT_TO_MODULE } from "@/config/painPointMap";
import { useProfile, type PainPoint } from "@/hooks/useProfile";
import { cn } from "@/lib/utils";

export function QuickDrillsList() {
  const { profile } = useProfile();
  const recommendedModuleId = profile?.pain_point
    ? PAIN_POINT_TO_MODULE[profile.pain_point as PainPoint]
    : null;

  return (
    <section aria-labelledby="quick-drills-heading" className="space-y-3">
      <h3
        id="quick-drills-heading"
        className="px-1 text-sm font-semibold uppercase tracking-widest text-muted-foreground"
      >
        Quick Drills
      </h3>
      <ul className="divide-y divide-border/60 overflow-hidden rounded-2xl border border-border/60 bg-surface">
        {QUICK_DRILL_MODULES.map((mod) => {
          const isRecommended = mod.id === recommendedModuleId;
          return (
            <li key={mod.id}>
              <Link
                to="/module/$moduleId"
                params={{ moduleId: mod.id }}
                className={cn(
                  "group flex items-center gap-4 p-4 transition-colors hover:bg-surface-2 focus-visible:bg-surface-2 focus-visible:outline-none",
                  isRecommended && "bg-primary/5",
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg",
                    isRecommended
                      ? "bg-primary/20 ring-1 ring-primary/40"
                      : "bg-primary/10",
                  )}
                >
                  {mod.emoji}
                </span>
                <div className="flex-1 text-left">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium leading-tight">{mod.title}</p>
                    {isRecommended && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-gradient-neon px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-background">
                        <Sparkles className="h-3 w-3" />
                        Recommended for you
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">{mod.subtitle}</p>
                </div>
                <ChevronRight
                  className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-0.5"
                  aria-hidden
                />
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
