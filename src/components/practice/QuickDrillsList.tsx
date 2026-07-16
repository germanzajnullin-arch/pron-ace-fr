import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { QUICK_DRILL_MODULES } from "@/config/modules";

export function QuickDrillsList() {
  return (
    <section aria-labelledby="quick-drills-heading" className="space-y-3">
      <h3
        id="quick-drills-heading"
        className="px-1 text-sm font-semibold uppercase tracking-widest text-muted-foreground"
      >
        Quick Drills
      </h3>
      <ul className="divide-y divide-border/60 overflow-hidden rounded-2xl border border-border/60 bg-surface">
        {QUICK_DRILL_MODULES.map((mod) => (
          <li key={mod.id}>
            <Link
              to="/module/$moduleId"
              params={{ moduleId: mod.id }}
              className="group flex items-center gap-4 p-4 transition-colors hover:bg-surface-2 focus-visible:bg-surface-2 focus-visible:outline-none"
            >
              <span
                aria-hidden
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-lg"
              >
                {mod.emoji}
              </span>
              <div className="flex-1 text-left">
                <p className="font-medium leading-tight">{mod.title}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{mod.subtitle}</p>
              </div>
              <ChevronRight
                className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-0.5"
                aria-hidden
              />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
