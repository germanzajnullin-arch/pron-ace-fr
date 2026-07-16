import { createFileRoute } from "@tanstack/react-router";
import { Flame, Target, Clock } from "lucide-react";
import { APP_NAME } from "@/config/constants";
import { ProgressBar } from "@/components/progress/ProgressBar";

export const Route = createFileRoute("/today")({
  head: () => ({
    meta: [
      { title: `Today — ${APP_NAME}` },
      { name: "description", content: "Your daily French practice goal and streak." },
    ],
  }),
  component: TodayPage,
});

const DAILY_GOAL_MINUTES = 10;
const MINUTES_DONE_TODAY = 4;
const STREAK_DAYS = 3;

function TodayPage() {
  const progress = MINUTES_DONE_TODAY / DAILY_GOAL_MINUTES;

  return (
    <main className="flex-1 px-4 pt-8 pb-6 space-y-6">
      <header className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Today
        </p>
        <h1 className="text-3xl font-bold">
          Bonne journée <span className="text-gradient-neon">✨</span>
        </h1>
      </header>

      <section className="rounded-3xl border border-white/10 bg-gradient-surface p-5 shadow-elevated">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <Target className="h-5 w-5" aria-hidden />
          </span>
          <div>
            <p className="text-sm text-muted-foreground">Daily goal</p>
            <p className="text-lg font-semibold">
              {MINUTES_DONE_TODAY} / {DAILY_GOAL_MINUTES} minutes
            </p>
          </div>
        </div>
        <div className="mt-4">
          <ProgressBar value={progress} />
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-white/10 bg-surface p-4">
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
            <Flame className="h-4 w-4 text-accent" aria-hidden />
            Streak
          </div>
          <p className="mt-2 text-3xl font-bold">{STREAK_DAYS}</p>
          <p className="text-xs text-muted-foreground">days in a row</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-surface p-4">
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
            <Clock className="h-4 w-4 text-primary" aria-hidden />
            This week
          </div>
          <p className="mt-2 text-3xl font-bold">42<span className="text-lg text-muted-foreground">m</span></p>
          <p className="text-xs text-muted-foreground">of focused practice</p>
        </div>
      </div>

      <section className="rounded-2xl border border-border/60 bg-surface p-4">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
          Suggested focus
        </h2>
        <p className="mt-2 text-base font-medium">
          You've been strong on liaison. Try{" "}
          <span className="text-primary">nasal vowels</span> today.
        </p>
      </section>
    </main>
  );
}
