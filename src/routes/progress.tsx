import { createFileRoute } from "@tanstack/react-router";
import { formatDistanceToNow } from "date-fns";
import { APP_NAME } from "@/config/constants";
import { MOCK_RECENT_ATTEMPTS } from "@/config/mockData";
import { ProgressBar } from "@/components/progress/ProgressBar";

export const Route = createFileRoute("/progress")({
  head: () => ({
    meta: [
      { title: `Progress — ${APP_NAME}` },
      { name: "description", content: "Your French pronunciation attempts and score history." },
    ],
  }),
  component: ProgressPage,
});

function ProgressPage() {
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
        <h1 className="text-3xl font-bold">Your <span className="text-gradient-neon">journey</span></h1>
      </header>

      <section className="rounded-3xl border border-white/10 bg-gradient-surface p-5">
        <p className="text-sm text-muted-foreground">Average score</p>
        <p className="mt-1 text-4xl font-bold tabular-nums">
          {Math.round(avg * 100)}%
        </p>
        <div className="mt-4">
          <ProgressBar value={avg} />
        </div>
      </section>

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
