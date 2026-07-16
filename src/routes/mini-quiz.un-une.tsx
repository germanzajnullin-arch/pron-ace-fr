import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { X, Volume2, Check, RotateCcw, Trophy } from "lucide-react";
import { APP_NAME } from "@/config/constants";
import { useFrenchTTS } from "@/hooks/useFrenchTTS";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/mini-quiz/un-une")({
  head: () => ({
    meta: [
      { title: `Ear Training: un vs une — ${APP_NAME}` },
      {
        name: "description",
        content: "Quick auditory drill: distinguish the masculine 'un' from the feminine 'une'.",
      },
    ],
  }),
  component: UnUneQuizPage,
});

type Article = "un" | "une";

interface QuizItem {
  readonly id: number;
  readonly answer: Article;
  /** Practice phrase spoken through the browser's French voice. */
  readonly phrase: string;
}

const ITEMS: readonly QuizItem[] = [
  { id: 1, answer: "un", phrase: "un chat" },
  { id: 2, answer: "une", phrase: "une pomme" },
  { id: 3, answer: "un", phrase: "un livre" },
  { id: 4, answer: "une", phrase: "une amie" },
  { id: 5, answer: "un", phrase: "un ami" },
];

function UnUneQuizPage() {
  const navigate = useNavigate();
  const tts = useFrenchTTS();
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<Article | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [finished, setFinished] = useState(false);

  const current = ITEMS[index];
  const total = ITEMS.length;
  const progress = ((index + (picked ? 1 : 0)) / total) * 100;

  // Auto-play each new prompt (best-effort — silent if the voice isn't ready).
  useEffect(() => {
    if (!current || finished) return;
    tts.speak(current.phrase);
    return () => tts.cancel();
  }, [current, finished, tts]);

  const exit = () => {
    tts.cancel();
    void navigate({ to: "/daily-focus" });
  };

  const choose = (choice: Article) => {
    if (picked) return;
    setPicked(choice);
    if (choice === current.answer) setCorrectCount((n) => n + 1);
  };

  const next = () => {
    if (index + 1 >= total) {
      setFinished(true);
      return;
    }
    setIndex((i) => i + 1);
    setPicked(null);
  };

  const restart = () => {
    setIndex(0);
    setPicked(null);
    setCorrectCount(0);
    setFinished(false);
  };

  return (
    <main className="flex-1 px-4 pt-4 pb-6 space-y-5">
      <div className="relative flex h-11 items-center">
        <button
          type="button"
          onClick={exit}
          aria-label="Close quiz and return to Daily Focus"
          className="flex h-11 w-11 items-center justify-center rounded-full border border-border/60 bg-surface text-foreground shadow-sm transition-all duration-300 hover:bg-surface-2 active:scale-95"
        >
          <X className="h-5 w-5" aria-hidden />
        </button>
        <p className="pointer-events-none absolute left-1/2 -translate-x-1/2 text-xs font-medium uppercase tracking-widest text-muted-foreground">
          Ear training
        </p>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
          <span>
            {finished ? `${total} / ${total}` : `${index + 1} / ${total}`}
          </span>
          <span>
            Score {correctCount} / {total}
          </span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
          <div
            className="h-full rounded-full bg-gradient-neon transition-all duration-500"
            style={{ width: `${finished ? 100 : progress}%` }}
          />
        </div>
      </div>

      {finished ? (
        <ResultCard score={correctCount} total={total} onRestart={restart} onExit={exit} />
      ) : (
        <QuizCard
          item={current}
          picked={picked}
          onPlay={() => tts.speak(current.phrase)}
          onChoose={choose}
          onNext={next}
          ttsReady={tts.supported}
        />
      )}
    </main>
  );
}

function QuizCard({
  item,
  picked,
  onPlay,
  onChoose,
  onNext,
  ttsReady,
}: {
  item: QuizItem;
  picked: Article | null;
  onPlay: () => void;
  onChoose: (a: Article) => void;
  onNext: () => void;
  ttsReady: boolean;
}) {
  const showFeedback = picked !== null;
  const isCorrect = picked === item.answer;

  return (
    <section className="space-y-6">
      <div className="rounded-3xl border border-primary/25 bg-gradient-surface p-6 text-center shadow-elevated">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Which article did you hear?
        </p>
        <button
          type="button"
          onClick={onPlay}
          disabled={!ttsReady}
          aria-label="Play audio"
          className="mx-auto mt-4 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-neon text-background shadow-neon transition-transform duration-300 active:scale-95 disabled:opacity-50"
        >
          <Volume2 className="h-10 w-10" aria-hidden />
        </button>
        <p className="mt-3 text-xs text-muted-foreground">Tap to replay</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {(["un", "une"] as const).map((choice) => {
          const isPicked = picked === choice;
          const isAnswer = item.answer === choice;
          return (
            <button
              key={choice}
              type="button"
              onClick={() => onChoose(choice)}
              disabled={showFeedback}
              className={cn(
                "rounded-2xl border p-6 text-center text-2xl font-bold transition-all duration-300",
                !showFeedback && "border-border bg-surface hover:bg-surface-2",
                showFeedback && isAnswer && "border-primary bg-primary/15 text-primary shadow-neon",
                showFeedback && isPicked && !isAnswer && "border-destructive/60 bg-destructive/10 text-destructive",
                showFeedback && !isAnswer && !isPicked && "opacity-50",
              )}
            >
              {choice}
            </button>
          );
        })}
      </div>

      {showFeedback && (
        <div
          className={cn(
            "rounded-2xl border p-4 text-sm transition-all duration-300",
            isCorrect
              ? "border-primary/40 bg-primary/10 text-foreground"
              : "border-destructive/40 bg-destructive/10 text-foreground",
          )}
          aria-live="polite"
        >
          <p className="font-semibold">
            {isCorrect ? "Correct !" : `Not quite — it's "${item.answer}".`}
          </p>
          <p className="mt-1 text-muted-foreground">
            Phrase: <span className="font-medium text-foreground">{item.phrase}</span>
          </p>
        </div>
      )}

      <button
        type="button"
        onClick={onNext}
        disabled={!showFeedback}
        className={cn(
          "flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition-all duration-300",
          showFeedback
            ? "bg-gradient-neon text-background shadow-neon active:scale-[0.98]"
            : "cursor-not-allowed bg-surface-2 text-muted-foreground",
        )}
      >
        Next
      </button>
    </section>
  );
}

function ResultCard({
  score,
  total,
  onRestart,
  onExit,
}: {
  score: number;
  total: number;
  onRestart: () => void;
  onExit: () => void;
}) {
  const pct = useMemo(() => Math.round((score / total) * 100), [score, total]);
  return (
    <section className="space-y-5 rounded-3xl border border-primary/25 bg-gradient-surface p-6 text-center shadow-elevated">
      <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/15 text-primary">
        <Trophy className="h-7 w-7" aria-hidden />
      </span>
      <div>
        <h2 className="text-2xl font-bold">
          {score} / {total}
        </h2>
        <p className="text-sm text-muted-foreground">
          {pct >= 80
            ? "Great ear — your un/une is on point."
            : pct >= 50
              ? "Solid start. A few more reps and you'll nail it."
              : "The un/une contrast is tricky — try again."}
        </p>
      </div>
      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={onRestart}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-neon px-5 py-3 text-sm font-semibold text-background shadow-neon transition-transform duration-300 active:scale-[0.98]"
        >
          <RotateCcw className="h-4 w-4" aria-hidden />
          Try again
        </button>
        <button
          type="button"
          onClick={onExit}
          className="inline-flex items-center justify-center gap-2 rounded-full border border-border bg-surface px-5 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-surface-2"
        >
          <Check className="h-4 w-4" aria-hidden />
          Done
        </button>
      </div>
    </section>
  );
}
