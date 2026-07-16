import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronLeft } from "lucide-react";
import { PhraseDisplay } from "@/components/lesson/PhraseDisplay";
import { RecordButton } from "@/components/lesson/RecordButton";
import { ScoreCard } from "@/components/lesson/ScoreCard";
import { MicPermissionAlert } from "@/components/feedback/MicPermissionAlert";
import { useRecorder } from "@/hooks/useRecorder";
import { APP_NAME } from "@/config/constants";

const DEFAULT_PROMPT = "Je voudrais un croissant, s'il vous plaît.";
const MAX_LEN = 300;

export const Route = createFileRoute("/custom-text")({
  head: () => ({
    meta: [
      { title: `Custom Text — ${APP_NAME}` },
      { name: "description", content: "Type any French sentence and drill your pronunciation." },
    ],
  }),
  component: CustomTextPage,
});

function CustomTextPage() {
  const router = useRouter();
  const [draft, setDraft] = useState(DEFAULT_PROMPT);
  const [phrase, setPhrase] = useState(DEFAULT_PROMPT);

  const recorder = useRecorder({ expectedText: phrase });

  const handleSet = () => {
    const trimmed = draft.trim();
    if (!trimmed) return;
    setPhrase(trimmed);
    recorder.reset();
  };

  return (
    <main className="flex-1 px-4 pt-6 pb-6 space-y-5">
      <button
        type="button"
        onClick={() => router.history.back()}
        className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-sm text-muted-foreground hover:bg-surface hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" aria-hidden />
        Back
      </button>

      <header className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Custom Text
        </p>
        <h1 className="text-2xl font-bold">Type it, then say it.</h1>
      </header>

      <div className="space-y-2 rounded-2xl border border-border/60 bg-surface p-4">
        <label htmlFor="custom-phrase" className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
          Your phrase
        </label>
        <textarea
          id="custom-phrase"
          value={draft}
          onChange={(e) => setDraft(e.target.value.slice(0, MAX_LEN))}
          rows={3}
          maxLength={MAX_LEN}
          className="w-full resize-none rounded-xl border border-border bg-background p-3 text-base focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
          placeholder="Type any French sentence…"
        />
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {draft.length} / {MAX_LEN}
          </span>
          <button
            type="button"
            onClick={handleSet}
            disabled={!draft.trim() || draft.trim() === phrase}
            className="rounded-full bg-primary px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-primary-foreground transition-colors hover:bg-primary-glow disabled:cursor-not-allowed disabled:opacity-50"
          >
            Set phrase
          </button>
        </div>
      </div>

      <PhraseDisplay title="Practice" frenchText={phrase} />

      {recorder.error ? <MicPermissionAlert error={recorder.error} /> : null}

      {recorder.state === "recording" && recorder.interim ? (
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-3 text-sm text-muted-foreground">
          <span className="mr-2 text-xs font-semibold uppercase tracking-widest text-primary">
            Hearing
          </span>
          {recorder.interim}
        </div>
      ) : null}

      {recorder.score && recorder.result ? (
        <ScoreCard score={recorder.score} transcript={recorder.result.transcript} />
      ) : null}

      <div className="pt-2">
        <RecordButton
          state={recorder.state}
          onStart={recorder.start}
          onStop={recorder.stop}
          onReset={recorder.reset}
        />
      </div>

      <p className="text-center text-xs text-muted-foreground">
        Attempts on custom text aren't saved to your history.{" "}
        <Link to="/practice" className="text-primary underline-offset-2 hover:underline">
          Back to Practice
        </Link>
      </p>
    </main>
  );
}
