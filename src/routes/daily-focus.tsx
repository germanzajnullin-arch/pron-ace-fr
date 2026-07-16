import { createFileRoute, useNavigate, type LinkOptions } from "@tanstack/react-router";
import { useRef, useState, type ReactNode } from "react";
import { Ear, Mic2, MessageCircle, Check, ChevronRight, Lightbulb, Target, Mic, Square, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { APP_NAME } from "@/config/constants";
import { DAILY_FOCUS } from "@/config/dailyFocus";
import { ThemeSwitcher } from "@/components/theme/ThemeSwitcher";
import { MOCK_RECENT_ATTEMPTS } from "@/config/mockData";
import { usePersonalization, LEVEL_PHRASE, GOAL_LABEL } from "@/lib/personalization";
import { useRecorder } from "@/hooks/useRecorder";
import { useAuthSession } from "@/hooks/useAuthSession";
import { saveAttempt } from "@/lib/attempts.functions";
import { pushGuestAttempt } from "@/lib/guest-attempts";
import { MicPermissionAlert } from "@/components/feedback/MicPermissionAlert";
import { createLogger } from "@/services/logger";
import { cn } from "@/lib/utils";

const log = createLogger("DailyFocus");

export const Route = createFileRoute("/daily-focus")({
  head: () => ({
    meta: [
      { title: `Daily Focus — ${APP_NAME}` },
      {
        name: "description",
        content:
          "Your daily action plan: ear training, mouth mechanics, and a real-life conversation.",
      },
    ],
  }),
  component: DailyFocusPage,
});

interface DailyAction {
  readonly id: "ear" | "mouth" | "chat";
  readonly icon: typeof Ear;
  readonly eyebrow: string;
  readonly title: string;
  readonly description: string;
  readonly cta: string;
  readonly to: LinkOptions;
}

const ACTIONS: readonly DailyAction[] = [
  {
    id: "ear",
    icon: Ear,
    eyebrow: "Phonetic ear training",
    title: "un vs une",
    description: "Quick auditory quiz — spot the masculine vs feminine article.",
    cta: "Start quiz",
    to: { to: "/mini-quiz/un-une" },
  },
  {
    id: "mouth",
    icon: Mic2,
    eyebrow: "Mouth mechanics",
    title: "bon · bain · banc",
    description: "Drill the three nasal vowels with live pronunciation scoring.",
    cta: "Open lesson",
    to: {
      to: "/lesson/$lessonId",
      params: { lessonId: DAILY_FOCUS.nasalClusterLessonId },
    },
  },
  {
    id: "chat",
    icon: MessageCircle,
    eyebrow: "Situational chat",
    title: "Introduce yourself",
    description: "Kick off a French conversation with an intro prompt.",
    cta: "Start chat",
    to: {
      to: "/ai-chat",
      search: { prompt: DAILY_FOCUS.aiIntroPromptKey },
    },
  },
];

function DailyFocusPage() {
  const { goal, french_level } = usePersonalization();
  const [done, setDone] = useState<Record<DailyAction["id"], boolean>>({
    ear: false,
    mouth: false,
    chat: false,
  });
  const completedCount = Object.values(done).filter(Boolean).length;

  const smartTip = buildSmartTip();
  const phrase = LEVEL_PHRASE[french_level];

  return (
    <main className="flex-1 px-4 pt-8 pb-6 space-y-6">
      <header className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Daily Focus
          </p>
          <h1 className="text-3xl font-bold">
            Bonne journée <span className="text-gradient-neon">✨</span>
          </h1>
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="inline-flex items-center rounded-full border border-primary/40 bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
              Level {french_level}
            </span>
            {goal && (
              <span className="inline-flex items-center gap-1 rounded-full border border-accent/40 bg-accent/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-accent">
                <Target className="h-3 w-3" aria-hidden />
                {GOAL_LABEL[goal]}
              </span>
            )}
          </div>
        </div>
        <ThemeSwitcher className="mt-1 shrink-0" />
      </header>

      <section
        aria-label="Today's target phrase"
        className="rounded-2xl border border-border/60 bg-surface p-4"
      >
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          Today's phrase · {french_level}
        </p>
        <p className="mt-1 text-xl font-bold leading-snug">{phrase.french}</p>
        <p className="mt-1 text-sm text-muted-foreground">{phrase.translation}</p>
      </section>

      <section aria-labelledby="daily-tasks-heading" className="space-y-3">
        <div className="flex items-baseline justify-between px-1">
          <h2
            id="daily-tasks-heading"
            className="text-sm font-semibold uppercase tracking-widest text-muted-foreground"
          >
            Today's plan
          </h2>
          <span className="text-xs font-medium tabular-nums text-muted-foreground">
            {completedCount} / {ACTIONS.length}
          </span>
        </div>

        <ul className="space-y-3">
          {ACTIONS.map((action) => (
            <li key={action.id}>
              <DailyActionCard
                action={action}
                complete={done[action.id]}
                onToggle={() =>
                  setDone((prev) => ({ ...prev, [action.id]: !prev[action.id] }))
                }
              />
            </li>
          ))}
        </ul>
      </section>

      <SmartRecommendation tip={smartTip} />
    </main>
  );
}

function DailyActionCard({
  action,
  complete,
  onToggle,
}: {
  action: DailyAction;
  complete: boolean;
  onToggle: () => void;
}) {
  const navigate = useNavigate();
  const Icon = action.icon;

  const launch = () => {
    void navigate(action.to);
  };

  return (
    <article
      className={cn(
        "group relative overflow-hidden rounded-3xl border p-4 shadow-elevated transition-all duration-300",
        complete
          ? "border-primary/50 bg-primary/5"
          : "border-border/60 bg-surface hover:bg-surface-2",
      )}
    >
      <div className="flex items-start gap-3">
        <span
          aria-hidden
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl transition-all duration-300",
            complete
              ? "bg-primary/20 text-primary"
              : "bg-background text-primary",
          )}
        >
          <Icon className="h-5 w-5" />
        </span>

        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            {action.eyebrow}
          </p>
          <h3
            className={cn(
              "mt-0.5 text-lg font-bold leading-tight transition-all duration-300",
              complete && "text-muted-foreground line-through decoration-primary/70",
            )}
          >
            {action.title}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">{action.description}</p>
        </div>

        <CompletionToggle complete={complete} onToggle={onToggle} label={action.title} />
      </div>

      <button
        type="button"
        onClick={launch}
        className={cn(
          "mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition-all duration-300 active:scale-[0.98]",
          complete
            ? "border border-primary/40 bg-transparent text-primary hover:bg-primary/10"
            : "bg-gradient-neon text-background shadow-neon",
        )}
      >
        {complete ? "Practice again" : action.cta}
        <ChevronRight className="h-4 w-4" aria-hidden />
      </button>
    </article>
  );
}

function CompletionToggle({
  complete,
  onToggle,
  label,
}: {
  complete: boolean;
  onToggle: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={complete}
      aria-label={complete ? `Mark ${label} as not done` : `Mark ${label} as done`}
      className={cn(
        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-all duration-300",
        complete
          ? "scale-110 border-primary bg-primary text-background shadow-neon"
          : "border-border bg-surface-2 text-transparent hover:border-primary/60",
      )}
    >
      <Check
        className={cn(
          "h-4 w-4 transition-transform duration-300",
          complete ? "scale-100" : "scale-0",
        )}
        aria-hidden
      />
    </button>
  );
}

function SmartRecommendation({ tip }: { tip: string }): ReactNode {
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
 * Lightweight recommendation derived from the most recent recorded attempt.
 * Swappable for a real `user_attempts` read once analytics land.
 */
function buildSmartTip(): string {
  const last = MOCK_RECENT_ATTEMPTS[0];
  if (!last) {
    return "Start with a 3-minute ear-training warm-up — it primes the rest of your session.";
  }
  const pct = Math.round(last.score * 100);
  if (pct >= 90) {
    return `Yesterday you nailed "${truncate(last.expectedText)}" at ${pct}%. Push into the nasal cluster today.`;
  }
  if (pct >= 70) {
    return `Solid ${pct}% on "${truncate(last.expectedText)}" — replay it once, then tackle the mouth mechanics drill.`;
  }
  return `"${truncate(last.expectedText)}" scored ${pct}% yesterday. Slow down and start with the ear-training quiz.`;
}

function truncate(s: string, n = 32): string {
  return s.length <= n ? s : `${s.slice(0, n - 1)}…`;
}
