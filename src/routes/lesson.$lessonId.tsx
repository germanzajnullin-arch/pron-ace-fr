import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getLessonById, listLessonsByCategory } from "@/lib/lessons.functions";
import { saveAttempt } from "@/lib/attempts.functions";
import { useServerFn } from "@tanstack/react-start";
import { toLesson } from "@/types/lesson";
import { useRecorder } from "@/hooks/useRecorder";
import { useAuthSession } from "@/hooks/useAuthSession";
import { PhraseDisplay } from "@/components/lesson/PhraseDisplay";
import { RecordButton } from "@/components/lesson/RecordButton";
import { ScoreCard } from "@/components/lesson/ScoreCard";
import { MicPermissionAlert } from "@/components/feedback/MicPermissionAlert";
import { SkeletonBlock } from "@/components/feedback/SkeletonBlock";
import { APP_NAME } from "@/config/constants";
import { createLogger } from "@/services/logger";

const log = createLogger("LessonRoute");

export const Route = createFileRoute("/lesson/$lessonId")({
  head: () => ({
    meta: [{ title: `Lesson — ${APP_NAME}` }],
  }),
  component: LessonPage,
});

function LessonPage() {
  const { lessonId } = Route.useParams();
  const router = useRouter();
  const { session } = useAuthSession();
  const save = useServerFn(saveAttempt);
  const [savedNote, setSavedNote] = useState<string | null>(null);

  const { data: lessonRow, isLoading } = useQuery({
    queryKey: ["lesson", lessonId],
    queryFn: () => getLessonById({ data: { id: lessonId } }),
  });

  const lesson = useMemo(
    () => (lessonRow ? toLesson(lessonRow) : null),
    [lessonRow],
  );

  const { data: siblings } = useQuery({
    queryKey: ["lessons", lesson?.category ?? "none"],
    queryFn: () =>
      lesson
        ? listLessonsByCategory({ data: { category: lesson.category } })
        : Promise.resolve([]),
    enabled: !!lesson,
  });

  const nextLesson = useMemo(() => {
    if (!lesson || !siblings) return null;
    const idx = siblings.findIndex((s) => s.id === lesson.id);
    return idx >= 0 && idx + 1 < siblings.length ? siblings[idx + 1] : null;
  }, [lesson, siblings]);

  const recorder = useRecorder({
    expectedText: lesson?.frenchText ?? "",
    onScored: async (result, score) => {
      if (!session || !lesson) {
        log.info("skipping save (no session or lesson)");
        setSavedNote(session ? null : "Sign in to save attempts to your history.");
        return;
      }
      try {
        await save({
          data: {
            lessonId: lesson.id,
            expectedText: lesson.frenchText,
            transcript: result.transcript,
            score: score.score,
            durationMs: result.durationMs,
          },
        });
        setSavedNote("Attempt saved to your progress.");
      } catch (err) {
        log.error("save failed", err);
        setSavedNote("Couldn't save this attempt — try again in a moment.");
      }
    },
  });

  return (
    <main className="flex-1 px-4 pt-6 pb-6 space-y-5">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => router.history.back()}
          className="flex items-center gap-1 rounded-full px-3 py-1.5 text-sm text-muted-foreground hover:bg-surface hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden />
          Back
        </button>
        {nextLesson ? (
          <Link
            to="/lesson/$lessonId"
            params={{ lessonId: nextLesson.id }}
            className="flex items-center gap-1 rounded-full px-3 py-1.5 text-sm text-muted-foreground hover:bg-surface hover:text-foreground"
          >
            Next
            <ChevronRight className="h-4 w-4" aria-hidden />
          </Link>
        ) : null}
      </div>

      {isLoading || !lesson ? (
        <SkeletonBlock className="h-48 w-full" />
      ) : (
        <PhraseDisplay
          title={lesson.title}
          frenchText={lesson.frenchText}
          translation={lesson.translation}
          hints={lesson.hints}
          audioAvailable={!!lesson.audioExampleUrl}
          onPlayAudio={() => {
            if (!lesson.audioExampleUrl) return;
            new Audio(lesson.audioExampleUrl).play().catch((e) => log.warn("audio play failed", e));
          }}
        />
      )}

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

      {savedNote ? (
        <p className="text-center text-xs text-muted-foreground">{savedNote}</p>
      ) : null}

      <div className="pt-2">
        <RecordButton
          state={recorder.state}
          onStart={recorder.start}
          onStop={recorder.stop}
          onReset={recorder.reset}
          disabled={!lesson}
        />
      </div>

      {!session ? (
        <p className="text-center text-xs text-muted-foreground">
          <Link to="/auth" className="text-primary underline-offset-2 hover:underline">
            Sign in
          </Link>{" "}
          to save your attempts.
        </p>
      ) : null}
    </main>
  );
}
