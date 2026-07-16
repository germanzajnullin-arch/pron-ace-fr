import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Sparkles, Play, Check, Lightbulb } from "lucide-react";
import { APP_NAME } from "@/config/constants";
import {
  DAILY_TOPICS,
  DEFAULT_DAILY_TOPIC,
  type DailyTask,
  type DailyTopic,
} from "@/config/dailyTopics";
import { getModuleById } from "@/config/modules";
import { MOCK_RECENT_ATTEMPTS } from "@/config/mockData";
import { listLessonsByCategory } from "@/lib/lessons.functions";
import { useProfile, type PainPoint } from "@/hooks/useProfile";
import { PlayAudioButton } from "@/components/lesson/PlayAudioButton";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/daily-focus")({
  head: () => ({
    meta: [
      { title: `Daily Focus — ${APP_NAME}` },
      {
        name: "description",
        content:
          "Your topic of the day, a 3-step checklist, and a smart tip tailored to yesterday's performance.",
      },
    ],
  }),
  component: DailyFocusPage,
});

function DailyFocusPage() {
  const { profile } = useProfile();
  const topic = useMemo(() => {
    const key = profile?.pain_point as PainPoint | null | undefined;
    return key && key in DAILY_TOPICS ? DAILY_TOPICS[key] : DEFAULT_DAILY_TOPIC;
  }, [profile?.pain_point]);

  const smartTip = useMemo(() => buildSmartTip(topic.title), [topic.title]);

  return (
    <main className="flex-1 px-4 pt-8 pb-6 space-y-6">
      <header className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Daily Focus
        </p>
        <h1 className="text-3xl font-bold">
          Bonne journée <span className="text-gradient-neon">✨</span>
        </h1>
      </header>

      <DailyChallengeCard topic={topic} />

      <DailyChecklist tasks={topic.tasks} />

      <SmartRecommendation tip={smartTip} />
    </main>
  );
}

function DailyChallengeCard({ topic }: { topic: DailyTopic }) {
  const mod = getModuleById(topic.moduleId);
  const { data: lessons } = useQuery({
    queryKey: ["lessons", mod?.category ?? "none"],
    queryFn: () =>
      mod
        ? listLessonsByCategory({ data: { category: mod.category } })
        : Promise.resolve([]),
    enabled: !!mod,
    staleTime: 60_000,
  });
  const firstLesson = lessons?.[0];

  return (
    <section
      aria-labelledby="daily-challenge-heading"
      className="relative overflow-hidden rounded-3xl border border-primary/25 bg-gradient-surface p-5 shadow-elevated"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-primary/20 blur-3xl"
      />
      <div className="relative space-y-4">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest text-primary">
            <Sparkles className="h-3 w-3" />
            Topic of the day
          </span>
        </div>
        <div className="space-y-1.5">
          <h2 id="daily-challenge-heading" className="text-xl font-bold leading-tight">
            Today's Focus:{" "}
            <span className="text-gradient-neon">{topic.title}</span>
          </h2>
          <p className="text-sm text-muted-foreground">{topic.description}</p>
        </div>

        {firstLesson ? (
          <div className="rounded-2xl border border-white/10 bg-background/40 p-3">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Sample phrase
            </p>
            <p className="mt-1 text-base font-semibold leading-snug">
              {firstLesson.french_text}
            </p>
            <div className="mt-2">
              <PlayAudioButton text={firstLesson.french_text} variant="compact" />
            </div>
          </div>
        ) : null}

        {firstLesson ? (
          <Link
            to="/lesson/$lessonId"
            params={{ lessonId: firstLesson.id }}
            className="inline-flex items-center gap-2 rounded-full bg-gradient-neon px-5 py-2.5 text-sm font-semibold text-background shadow-neon transition-transform active:scale-95"
          >
            <Play className="h-4 w-4 fill-current" />
            Start Daily Drill
          </Link>
        ) : mod ? (
          <Link
            to="/module/$moduleId"
            params={{ moduleId: mod.id }}
            className="inline-flex items-center gap-2 rounded-full bg-gradient-neon px-5 py-2.5 text-sm font-semibold text-background shadow-neon transition-transform active:scale-95"
          >
            <Play className="h-4 w-4 fill-current" />
            Start Daily Drill
          </Link>
        ) : null}
      </div>
    </section>
  );
}

function DailyChecklist({ tasks }: { tasks: readonly DailyTask[] }) {
  const [progress, setProgress] = useState<Record<string, number>>({});

  const bump = (task: DailyTask) => {
    setProgress((prev) => {
      const current = prev[task.id] ?? 0;
      const next = current >= task.target ? 0 : current + 1;
      return { ...prev, [task.id]: next };
    });
  };

  const completedCount = tasks.reduce(
    (n, t) => n + ((progress[t.id] ?? 0) >= t.target ? 1 : 0),
    0,
  );

  return (
    <section aria-labelledby="daily-tasks-heading" className="space-y-3">
      <div className="flex items-baseline justify-between px-1">
        <h3
          id="daily-tasks-heading"
          className="text-sm font-semibold uppercase tracking-widest text-muted-foreground"
        >
          Daily Tasks
        </h3>
        <span className="text-xs font-medium tabular-nums text-muted-foreground">
          {completedCount} / {tasks.length}
        </span>
      </div>
      <ul className="space-y-2">
        {tasks.map((task) => {
          const done = progress[task.id] ?? 0;
          const isComplete = done >= task.target;
          return (
            <li key={task.id}>
              <button
                type="button"
                onClick={() => bump(task)}
                aria-pressed={isComplete}
                className={cn(
                  "group flex w-full items-center gap-3 rounded-2xl border p-4 text-left transition-all duration-300",
                  isComplete
                    ? "border-primary/50 bg-primary/10 shadow-neon"
                    : "border-border/60 bg-surface hover:bg-surface-2",
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl transition-all duration-300",
                    isComplete
                      ? "scale-95 bg-primary/25 opacity-70"
                      : "bg-background",
                  )}
                >
                  {task.emoji}
                </span>
                <div className="flex-1 space-y-0.5">
                  <p
                    className={cn(
                      "font-medium leading-tight transition-all duration-300",
                      isComplete && "text-muted-foreground line-through decoration-primary/70",
                    )}
                  >
                    {task.title}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {task.detail}
                    <span className="ml-1 tabular-nums text-foreground/70">
                      ({done}/{task.target})
                    </span>
                  </p>
                </div>
                <span
                  aria-hidden
                  className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition-all duration-300",
                    isComplete
                      ? "scale-110 border-primary bg-primary text-background"
                      : "border-border bg-surface-2 text-transparent",
                  )}
                >
                  <Check
                    className={cn(
                      "h-4 w-4 transition-transform duration-300",
                      isComplete ? "scale-100" : "scale-0",
                    )}
                  />
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function SmartRecommendation({ tip }: { tip: string }) {
  return (
    <section className="rounded-2xl border border-accent/25 bg-surface p-4">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent/15 text-accent">
          <Lightbulb className="h-4 w-4" aria-hidden />
        </span>
        <div className="space-y-1">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Smart tip
          </h2>
          <p className="text-sm font-medium leading-snug">{tip}</p>
        </div>
      </div>
    </section>
  );
}

/**
 * Builds a lightweight recommendation from the last attempt.
 * Real engine will read `user_attempts` once auth is wired; this shape
 * keeps the UI truthful with the mocked history until then.
 */
function buildSmartTip(topicTitle: string): string {
  const last = MOCK_RECENT_ATTEMPTS[0];
  if (!last) {
    return `Start with ${topicTitle.toLowerCase()} — a 3-minute warm-up unlocks the rest.`;
  }
  const pct = Math.round(last.score * 100);
  if (pct >= 90) {
    return `Yesterday you nailed "${truncate(last.expectedText)}" at ${pct}%. Push into ${topicTitle.toLowerCase()} today.`;
  }
  if (pct >= 70) {
    return `Solid ${pct}% on "${truncate(last.expectedText)}". Focus on ${topicTitle.toLowerCase()} to convert good into great.`;
  }
  return `"${truncate(last.expectedText)}" scored ${pct}% yesterday — replay it once, then tackle ${topicTitle.toLowerCase()}.`;
}

function truncate(s: string, n = 32): string {
  return s.length <= n ? s : `${s.slice(0, n - 1)}…`;
}
