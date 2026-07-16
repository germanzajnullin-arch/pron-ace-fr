import { createFileRoute, useRouter } from "@tanstack/react-router";
import { formatDistanceToNow } from "date-fns";
import { Flame, Target, Clock, RotateCcw } from "lucide-react";
import { APP_NAME } from "@/config/constants";
import { MOCK_RECENT_ATTEMPTS } from "@/config/mockData";
import { ProgressBar } from "@/components/progress/ProgressBar";
import { useProfile } from "@/hooks/useProfile";
import { resetOnboarding } from "@/lib/onboarding";

export const Route = createFileRoute("/progress")({
  head: () => ({
    meta: [
      { title: `Progress — ${APP_NAME}` },
      {
        name: "description",
        content:
          "Track your daily goal, streak, weekly practice minutes, and full attempt history.",
      },
    ],
  }),
  component: ProgressPage,
});

// MVP placeholders — will be replaced by real reads from user_attempts once wired.
const MINUTES_DONE_TODAY = 4;
const STREAK_DAYS = 3;
const WEEK_MINUTES = 42;

function ProgressPage() {
  const { profile } = useProfile();
  const router = useRouter();
  const dailyGoal = profile?.daily_goal_minutes ?? 10;
  const dailyProgress = Math.min(1, MINUTES_DONE_TODAY / dailyGoal);

  const attempts = MOCK_RECENT_ATTEMPTS;
  const avg =
    attempts.length === 0
      ? 0
      : attempts.reduce((sum, a) => sum + a.score, 0) / attempts.length;

  return (
    <main className="flex-1 px-4 pt-8 pb-6 space-y-6">
      <header className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Progress
        </p>
        <h1 className="text-3xl font-bold">
          Your <span className="text-gradient-neon">journey</span>
        </h1>
      </header>

      {/* Daily goal */}
      <section className="rounded-3xl border border-white/10 bg-gradient-surface p-5 shadow-elevated">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <Target className="h-5 w-5" aria-hidden />
          </span>
          <div>
            <p className="text-sm text-muted-foreground">Daily goal</p>
            <p className="text-lg font-semibold">
              {MINUTES_DONE_TODAY} / {dailyGoal} minutes
            </p>
          </div>
        </div>
        <div className="mt-4">
          <ProgressBar value={dailyProgress} />
        </div>
      </section>

      {/* Streak + weekly */}
      <div className="grid grid-cols-2 gap-3">
        <MetricCard
          icon={<Flame className="h-4 w-4 text-accent" aria-hidden />}
          label="Streak"
          value={STREAK_DAYS}
          suffix=""
          hint="days in a row"
        />
        <MetricCard
          icon={<Clock className="h-4 w-4 text-primary" aria-hidden />}
          label="This week"
          value={WEEK_MINUTES}
          suffix="m"
          hint="of focused practice"
        />
      </div>

      {/* Average score */}
      <section className="rounded-3xl border border-white/10 bg-surface p-5">
        <p className="text-sm text-muted-foreground">Average pronunciation score</p>
        <p className="mt-1 text-4xl font-bold tabular-nums">
          {Math.round(avg * 100)}%
        </p>
        <div className="mt-4">
          <ProgressBar value={avg} />
        </div>
      </section>

      {/* Recent attempts */}
      <section className="space-y-3">
        <h2 className="px-1 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
          Recent attempts
        </h2>
        <ul className="space-y-2">
          {attempts.map((a) => (
            <li
              key={a.id}
              className="rounded-2xl border border-border/60 bg-surface p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-medium">{a.expectedText}</p>
                <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-bold tabular-nums text-primary">
                  {Math.round(a.score * 100)}%
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(a.createdAt), { addSuffix: true })}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <p className="text-center text-xs text-muted-foreground">
        Sign in on the Practice tab to sync real attempts across devices.
      </p>
    </main>
  );
}

function MetricCard({
  icon,
  label,
  value,
  suffix,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  suffix: string;
  hint: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-surface p-4">
      <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
        {icon}
        {label}
      </div>
      <p className="mt-2 text-3xl font-bold tabular-nums">
        {value}
        {suffix && <span className="text-lg text-muted-foreground">{suffix}</span>}
      </p>
      <p className="text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}
