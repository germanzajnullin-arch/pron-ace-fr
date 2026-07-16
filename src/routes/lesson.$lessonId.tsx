import { createFileRoute, Link, useNavigate, useRouter } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, X } from "lucide-react";
import { toast } from "sonner";
import { getLessonById, listLessonsByCategory } from "@/lib/lessons.functions";
import { saveAttempt } from "@/lib/attempts.functions";
import { pushGuestAttempt } from "@/lib/guest-attempts";
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
import { cn } from "@/lib/utils";

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
  const navigate = useNavigate();
  const { session } = useAuthSession();
  const save = useServerFn(saveAttempt);
  const [savedNote, setSavedNote] = useState<string | null>(null);
  const guestPromptShown = useRef(false);

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

  const { prevLesson, nextLesson, positionLabel } = useMemo(() => {
    if (!lesson || !siblings) {
      return { prevLesson: null, nextLesson: null, positionLabel: null };
    }
    const idx = siblings.findIndex((s) => s.id === lesson.id);
    return {
      prevLesson: idx > 0 ? siblings[idx - 1] : null,
      nextLesson: idx >= 0 && idx + 1 < siblings.length ? siblings[idx + 1] : null,
      positionLabel: idx >= 0 ? `${idx + 1} / ${siblings.length}` : null,
    };
  }, [lesson, siblings]);

  const recorder = useRecorder({
    expectedText: lesson?.frenchText ?? "",
    onScored: async (result, score) => {
      if (!lesson) return;
      if (!session) {
        // Guest: keep the last few attempts locally and nudge sign-in once.
        try {
          pushGuestAttempt({
            lessonId: lesson.id,
            expectedText: lesson.frenchText,
            transcript: result.transcript,
            score: score.score,
            durationMs: result.durationMs,
            createdAt: new Date().toISOString(),
          });
        } catch (err) {
          log.error("guest cache failed", err);
        }
        setSavedNote("Saved locally on this device.");
        if (!guestPromptShown.current) {
          guestPromptShown.current = true;
          toast("Great job!", {
            description:
              "Sign in now to save your progress and unlock advanced analytics.",
            action: {
              label: "Sign in",
              onClick: () => void navigate({ to: "/auth" }),
            },
          });
        }
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

  const exitLesson = useCallback(() => {
    // Safely terminate any active recording/recognition + wipe local state,
    // then return the user to the Daily Focus dashboard.
    recorder.reset();
    setSavedNote(null);
    void navigate({ to: "/daily-focus" });
  }, [navigate, recorder]);

  return (
    <main className="flex-1 px-4 pt-4 pb-6 space-y-5">
      {/* Top bar — close (left) + position indicator (center) */}
      <div className="relative flex h-11 items-center">
        <button
          type="button"
          onClick={exitLesson}
          aria-label="Close lesson and return to Daily Focus"
          className="flex h-11 w-11 items-center justify-center rounded-full border border-border/60 bg-surface text-foreground shadow-sm transition-all hover:bg-surface-2 active:scale-95"
        >
          <X className="h-5 w-5" aria-hidden />
        </button>
        {positionLabel ? (
          <p className="pointer-events-none absolute left-1/2 -translate-x-1/2 text-xs font-medium uppercase tracking-widest text-muted-foreground">
            Lesson {positionLabel}
          </p>
        ) : null}
      </div>

      {isLoading || !lesson ? (
        <SkeletonBlock className="h-56 w-full" />
      ) : (
        <PhraseDisplay
          title={lesson.title}
          frenchText={lesson.frenchText}
          translation={lesson.translation}
          hints={lesson.hints}
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

      {/* Ergonomic bottom nav — thumb-reach zone */}
      <LessonNavBar
        prevHref={prevLesson?.id ?? null}
        nextHref={nextLesson?.id ?? null}
        onBack={() => router.history.back()}
      />

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

interface LessonNavBarProps {
  prevHref: string | null;
  nextHref: string | null;
  onBack: () => void;
}

function LessonNavBar({ prevHref, nextHref, onBack }: LessonNavBarProps) {
  return (
    <nav
      aria-label="Lesson navigation"
      className="flex items-center justify-between gap-3 pt-3"
    >
      {prevHref ? (
        <Link
          to="/lesson/$lessonId"
          params={{ lessonId: prevHref }}
          aria-label="Previous lesson"
          className="flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl border border-border/60 bg-surface text-sm font-semibold text-foreground transition-colors hover:bg-surface-2 active:scale-[0.98]"
        >
          <ArrowLeft className="h-5 w-5" aria-hidden />
          Previous
        </Link>
      ) : (
        <button
          type="button"
          onClick={onBack}
          aria-label="Back"
          className="flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl border border-border/60 bg-surface text-sm font-semibold text-foreground transition-colors hover:bg-surface-2 active:scale-[0.98]"
        >
          <ArrowLeft className="h-5 w-5" aria-hidden />
          Back
        </button>
      )}
      {nextHref ? (
        <Link
          to="/lesson/$lessonId"
          params={{ lessonId: nextHref }}
          aria-label="Next lesson"
          className="flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-neon text-sm font-semibold text-background shadow-neon transition-transform active:scale-[0.98]"
        >
          Next
          <ArrowRight className="h-5 w-5" aria-hidden />
        </Link>
      ) : (
        <button
          type="button"
          disabled
          aria-label="No next lesson"
          className="flex h-12 flex-1 cursor-not-allowed items-center justify-center gap-2 rounded-2xl border border-border/60 bg-surface text-sm font-semibold text-muted-foreground"
        >
          Next
          <ArrowRight className="h-5 w-5" aria-hidden />
        </button>
      )}
    </nav>
  );
}
