import { CheckCircle2, Sparkles, TriangleAlert } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { ScoreBreakdown } from "@/services/audio/types";

const CELEBRATE_THRESHOLD = 0.85;
const WARN_THRESHOLD = 0.7;

const METRICS: readonly {
  key: "accuracy" | "fluency" | "completeness";
  label: string;
  hint: string;
}[] = [
  {
    key: "accuracy",
    label: "Accuracy",
    hint: "Phoneme & nasal-vowel articulation",
  },
  {
    key: "fluency",
    label: "Fluency",
    hint: "Rhythm, tempo, and liaison flow",
  },
  {
    key: "completeness",
    label: "Completeness",
    hint: "How much of the phrase you spoke",
  },
];

interface MetricsBreakdownProps {
  score: ScoreBreakdown;
  transcript: string;
}

export function MetricsBreakdown({ score, transcript }: MetricsBreakdownProps) {
  const overall = Math.round(score.overall * 100);
  const celebrate = score.overall >= CELEBRATE_THRESHOLD;

  return (
    <section
      aria-label="Pronunciation breakdown"
      className={cn(
        "space-y-4 rounded-2xl border p-4 transition-all",
        celebrate
          ? "border-primary/60 bg-primary/5 shadow-neon animate-pulse-neon"
          : "border-border/60 bg-surface",
      )}
    >
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Pronunciation score
          </p>
          <div className="mt-1 flex items-baseline gap-2">
            <span
              className={cn(
                "text-4xl font-bold tabular-nums",
                celebrate ? "text-gradient-neon" : "text-foreground",
              )}
            >
              {overall}
            </span>
            <span className="text-sm font-medium text-muted-foreground">/ 100</span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{score.message}</p>
        </div>
        <span
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
            celebrate
              ? "bg-primary/20 text-primary"
              : score.overall < WARN_THRESHOLD
                ? "bg-destructive/15 text-destructive"
                : "bg-surface-2 text-foreground",
          )}
        >
          {celebrate ? (
            <Sparkles className="h-5 w-5" aria-hidden />
          ) : score.overall < WARN_THRESHOLD ? (
            <TriangleAlert className="h-5 w-5" aria-hidden />
          ) : (
            <CheckCircle2 className="h-5 w-5" aria-hidden />
          )}
        </span>
      </header>

      <ul className="space-y-3">
        {METRICS.map((m) => {
          const value = score[m.key];
          const pct = Math.round(value * 100);
          const needsWork = value < WARN_THRESHOLD;
          return (
            <li key={m.key} className="space-y-1.5">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p
                    className={cn(
                      "text-sm font-semibold",
                      needsWork ? "text-destructive" : "text-foreground",
                    )}
                  >
                    {m.label}
                  </p>
                  <p className="text-xs text-muted-foreground">{m.hint}</p>
                </div>
                <span
                  className={cn(
                    "text-sm font-semibold tabular-nums",
                    needsWork
                      ? "text-destructive"
                      : value >= CELEBRATE_THRESHOLD
                        ? "text-primary"
                        : "text-foreground",
                  )}
                >
                  {pct}%
                </span>
              </div>
              <Progress
                value={pct}
                className={cn(
                  "h-2",
                  needsWork && "ring-1 ring-destructive/40",
                )}
              />
            </li>
          );
        })}
      </ul>

      {transcript ? (
        <div className="rounded-xl border border-border/40 bg-surface-2/50 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            What we heard
          </p>
          <p className="mt-1 text-sm text-foreground">{transcript}</p>
        </div>
      ) : null}
    </section>
  );
}
