import type { ScoreBreakdown } from "@/services/audio/types";
import { TranscriptDiff } from "./TranscriptDiff";
import { CheckCircle2, ThumbsUp, AlertCircle, RefreshCw } from "lucide-react";
import type { ReactNode } from "react";

const BUCKET_META: Record<
  ScoreBreakdown["bucket"],
  { label: string; icon: ReactNode; ring: string; text: string }
> = {
  excellent: {
    label: "Excellent",
    icon: <CheckCircle2 className="h-5 w-5" aria-hidden />,
    ring: "border-primary/60 bg-primary/10",
    text: "text-primary",
  },
  good: {
    label: "Good",
    icon: <ThumbsUp className="h-5 w-5" aria-hidden />,
    ring: "border-primary/40 bg-primary/5",
    text: "text-primary",
  },
  fair: {
    label: "Fair",
    icon: <AlertCircle className="h-5 w-5" aria-hidden />,
    ring: "border-warning/40 bg-warning/5",
    text: "text-warning",
  },
  retry: {
    label: "Retry",
    icon: <RefreshCw className="h-5 w-5" aria-hidden />,
    ring: "border-destructive/40 bg-destructive/5",
    text: "text-destructive",
  },
};

interface ScoreCardProps {
  score: ScoreBreakdown;
  transcript: string;
}

export function ScoreCard({ score, transcript }: ScoreCardProps) {
  const meta = BUCKET_META[score.bucket];
  const pct = Math.round(score.score * 100);
  return (
    <div className={`space-y-4 rounded-3xl border p-5 ${meta.ring}`}>
      <div className="flex items-center justify-between">
        <div className={`flex items-center gap-2 font-semibold ${meta.text}`}>
          {meta.icon}
          <span>{meta.label}</span>
        </div>
        <div className="text-3xl font-bold tabular-nums">{pct}%</div>
      </div>
      <p className="text-sm text-muted-foreground">{score.message}</p>

      {transcript ? (
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            We heard
          </p>
          <p className="rounded-xl bg-background/40 p-3 text-sm">{transcript || "—"}</p>
        </div>
      ) : null}

      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Word breakdown
        </p>
        <TranscriptDiff diff={score.diff} />
      </div>
    </div>
  );
}
