import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { formatDistanceToNow } from "date-fns";
import { Flame, Target, Clock, RotateCcw, LogIn } from "lucide-react";
import { useMemo } from "react";
import { APP_NAME } from "@/config/constants";
import { ProgressBar } from "@/components/progress/ProgressBar";
import { SkeletonBlock } from "@/components/feedback/SkeletonBlock";
import { useProfile } from "@/hooks/useProfile";
import { useAuthSession } from "@/hooks/useAuthSession";
import { listAttempts } from "@/lib/attempts.functions";
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

interface AttemptRow {
  id: string;
  expected_text: string;
  score: number;
  duration_ms: number | null;
  created_at: string;
}

interface Stats {
  minutesToday: number;
  weekMinutes: number;
  streakDays: number;
  avgScore: number;
}

const startOfLocalDay = (d: Date): number => {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c.getTime();
};

const computeStats = (attempts: readonly AttemptRow[]): Stats => {
  if (attempts.length === 0) {
    return { minutesToday: 0, weekMinutes: 0, streakDays: 0, avgScore: 0 };
  }

  const now = Date.now();
  const today = startOfLocalDay(new Date(now));
  const weekAgo = today - 6 * 24 * 60 * 60 * 1000;

  let msToday = 0;
  let msWeek = 0;
  let scoreSum = 0;
  const activeDays = new Set<number>();

  for (const a of attempts) {
    const ts = new Date(a.created_at).getTime();
    const dayStart = startOfLocalDay(new Date(ts));
    activeDays.add(dayStart);
    scoreSum += Number(a.score);
    const ms = a.duration_ms ?? 0;
    if (dayStart === today) msToday += ms;
    if (dayStart >= weekAgo) msWeek += ms;
  }

  // Streak: consecutive days ending today (or yesterday if nothing today yet).
  let streak = 0;
  let cursor = activeDays.has(today) ? today : today - 24 * 60 * 60 * 1000;
  while (activeDays.has(cursor)) {
    streak += 1;
    cursor -= 24 * 60 * 60 * 1000;
  }

  return {
    minutesToday: Math.round(msToday / 60000),
    weekMinutes: Math.round(msWeek / 60000),
    streakDays: streak,
    avgScore: scoreSum / attempts.length,
  };
};

function ProgressPage() {
  const router = useRouter();
  const { profile, loading: profileLoading } = useProfile();
  const { session, loading: sessionLoading } = useAuthSession();
  const fetchAttempts = useServerFn(listAttempts);

  const {
    data: attempts,
    isLoading: attemptsLoading,
    isError,
  } = useQuery({
    queryKey: ["user_attempts", session?.user?.id ?? "guest"],
    queryFn: () => fetchAttempts(),
    enabled: !!session,
    staleTime: 30_000,
  });

  const rows = useMemo<readonly AttemptRow[]>(
    () => (attempts as AttemptRow[] | undefined) ?? [],
    [attempts],
  );
  const stats = useMemo(() => computeStats(rows), [rows]);

  const dailyGoal = profile?.daily_goal_minutes ?? 10;
  const dailyProgress = Math.min(1, stats.minutesToday / dailyGoal);
  const isLoading = sessionLoading || (session && (attemptsLoading || profileLoading));

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

      {!session && !sessionLoading ? <SignedOutBanner /> : null}

      {isLoading ? (
        <>
          <SkeletonBlock className="h-32 w-full" />
          <div className="grid grid-cols-2 gap-3">
            <SkeletonBlock className="h-24" />
            <SkeletonBlock className="h-24" />
          </div>
          <SkeletonBlock className="h-28 w-full" />
        </>
      ) : (
        <>
          {/* Daily goal */}
          <section className="rounded-3xl border border-white/10 bg-gradient-surface p-5 shadow-elevated">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <Target className="h-5 w-5" aria-hidden />
              </span>
              <div>
                <p className="text-sm text-muted-foreground">Daily goal</p>
                <p className="text-lg font-semibold">
                  {stats.minutesToday} / {dailyGoal} minutes
                </p>
              </div>
            </div>
            <div className="mt-4">
              <ProgressBar value={dailyProgress} />
            </div>
          </section>

          <div className="grid grid-cols-2 gap-3">
            <MetricCard
              icon={<Flame className="h-4 w-4 text-accent" aria-hidden />}
              label="Streak"
              value={stats.streakDays}
              suffix=""
              hint="days in a row"
            />
            <MetricCard
              icon={<Clock className="h-4 w-4 text-primary" aria-hidden />}
              label="This week"
              value={stats.weekMinutes}
              suffix="m"
              hint="of focused practice"
            />
          </div>

          <section className="rounded-3xl border border-white/10 bg-surface p-5">
            <p className="text-sm text-muted-foreground">Average pronunciation score</p>
            <p className="mt-1 text-4xl font-bold tabular-nums">
              {Math.round(stats.avgScore * 100)}%
            </p>
            <div className="mt-4">
              <ProgressBar value={stats.avgScore} />
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="px-1 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
              Recent attempts
            </h2>
            {isError ? (
              <p className="rounded-2xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
                Couldn't load your history. Pull to refresh in a moment.
              </p>
            ) : rows.length === 0 ? (
              <p className="rounded-2xl border border-border/60 bg-surface p-4 text-sm text-muted-foreground">
                {session
                  ? "No attempts yet — start a lesson and your history will appear here."
                  : "Sign in to see your recorded attempts across devices."}
              </p>
            ) : (
              <ul className="space-y-2">
                {rows.slice(0, 20).map((a) => (
                  <li
                    key={a.id}
                    className="rounded-2xl border border-border/60 bg-surface p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-medium">{a.expected_text}</p>
                      <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-bold tabular-nums text-primary">
                        {Math.round(Number(a.score) * 100)}%
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(a.created_at), { addSuffix: true })}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}

      {/* Dev-only: reset onboarding to re-test the quiz flow */}
      <section className="rounded-3xl border border-dashed border-border/60 bg-surface/60 p-4">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent/15 text-accent">
            <RotateCcw className="h-4 w-4" aria-hidden />
          </span>
          <div className="flex-1">
            <p className="text-sm font-semibold">Reset onboarding quiz</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Dev helper — clears your local onboarding flag and re-opens the quiz.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              resetOnboarding();
              router.navigate({ to: "/onboarding" });
            }}
            className="shrink-0 rounded-full border border-border bg-background px-3 py-2 text-xs font-semibold transition-colors hover:bg-surface-2 active:scale-95"
          >
            Reset
          </button>
        </div>
      </section>
    </main>
  );
}

function SignedOutBanner() {
  return (
    <section className="rounded-2xl border border-primary/30 bg-primary/5 p-4">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
          <LogIn className="h-4 w-4" aria-hidden />
        </span>
        <div className="flex-1">
          <p className="text-sm font-semibold">Sign in to track your progress</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Your attempts, streak, and accuracy will sync across every device.
          </p>
        </div>
      </div>
    </section>
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
