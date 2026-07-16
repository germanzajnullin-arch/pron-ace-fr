import { Link, useRouterState } from "@tanstack/react-router";
import { Calendar, Mic, TrendingUp } from "lucide-react";
import type { ComponentType, SVGProps } from "react";
import { TABS } from "@/config/constants";
import { cn } from "@/lib/utils";

type IconCmp = ComponentType<SVGProps<SVGSVGElement>>;

const ICONS: Record<(typeof TABS)[number]["id"], IconCmp> = {
  today: Calendar,
  practice: Mic,
  progress: TrendingUp,
};

export function BottomTabBar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border/70 bg-background/85 backdrop-blur-lg"
    >
      <ul className="mx-auto flex max-w-md items-stretch justify-around px-2 pb-[env(safe-area-inset-bottom)] pt-1.5">
        {TABS.map((tab) => {
          const Icon = ICONS[tab.id];
          const active = pathname === tab.to || pathname.startsWith(`${tab.to}/`);
          return (
            <li key={tab.id} className="flex-1">
              <Link
                to={tab.to}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "group relative flex flex-col items-center gap-1 rounded-xl px-2 py-2 text-xs font-medium transition-all",
                  active
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <span
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-full transition-all",
                    active
                      ? "bg-primary/15 shadow-neon"
                      : "bg-transparent group-hover:bg-surface-2/70",
                  )}
                >
                  <Icon
                    className={cn(
                      "h-5 w-5 transition-transform",
                      active ? "scale-110" : "scale-100",
                    )}
                    aria-hidden
                  />
                </span>
                <span>{tab.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
