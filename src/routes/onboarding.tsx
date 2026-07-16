import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
import { Volume2, Check, ChevronRight, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  useProfile,
  type Goal,
  type PainPoint,
  type FrenchLevel,
} from "@/hooks/useProfile";
import { APP_NAME } from "@/config/constants";
import { cn } from "@/lib/utils";
import { setOnboardingCompleted } from "@/lib/onboarding";
import { writeLocalAnswers, type OnboardingAnswers } from "@/lib/personalization";

export const Route = createFileRoute("/onboarding")({
  head: () => ({ meta: [{ title: `Get started — ${APP_NAME}` }] }),
  component: OnboardingPage,
});

/** 0=Goal · 1=Level · 2=Pain Point · 3=Audio · 4=Commitment */
type StepId = 0 | 1 | 2 | 3 | 4;
const TOTAL_STEPS = 5;

interface Option<T extends string> {
  value: T;
  label: string;
  hint?: string;
  emoji?: string;
}

const GOALS: Option<Goal>[] = [
  { value: "overcome_barrier", label: "Overcome language barrier", emoji: "🧱" },
  { value: "professional", label: "Sound professional at work", emoji: "💼" },
  { value: "travel", label: "Travel & understand locals", emoji: "✈️" },
  { value: "accent", label: "Perfect my accent", emoji: "🎯" },
];

const LEVELS: Option<FrenchLevel>[] = [
  { value: "A1", label: "A1 — Beginner", hint: "Just starting out", emoji: "🌱" },
  { value: "A2", label: "A2 — Elementary", hint: "Basic phrases", emoji: "🌿" },
  { value: "B1", label: "B1 — Intermediate", hint: "Everyday conversations", emoji: "🌳" },
  { value: "B2", label: "B2 — Upper-Intermediate", hint: "Fluent-ish, need polish", emoji: "🏆" },
];

const PAIN_POINTS: Option<PainPoint>[] = [
  { value: "french_r", label: "The French 'R' sound", emoji: "🗣️" },
  { value: "nasal_vowels", label: "Nasal vowels (an, in, on)", emoji: "👃" },
  { value: "liaison", label: "Word linking (Liaisons)", emoji: "🔗" },
  { value: "fast_speech", label: "Fast native speech", emoji: "💨" },
];

const AUDIO_OPTIONS: Option<"dessus" | "dessous">[] = [
  { value: "dessus", label: "Dessus", hint: "Above" },
  { value: "dessous", label: "Dessous", hint: "Below" },
];

const TARGETS: Option<"3" | "10" | "20">[] = [
  { value: "3", label: "3 min/day", hint: "Light", emoji: "🌱" },
  { value: "10", label: "10 min/day", hint: "Regular", emoji: "🔥" },
  { value: "20", label: "20 min/day", hint: "Serious", emoji: "🚀" },
];

function OnboardingPage() {
  const router = useRouter();
  const { profile, session, loading, refetch } = useProfile();
  const [step, setStep] = useState<StepId>(0);
  const [goal, setGoal] = useState<Goal | null>(null);
  const [level, setLevel] = useState<FrenchLevel | null>(null);
  const [painPoint, setPainPoint] = useState<PainPoint | null>(null);
  const [audioAnswer, setAudioAnswer] = useState<"dessus" | "dessous" | null>(null);
  const [target, setTarget] = useState<"3" | "10" | "20" | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Guest-first: never redirect to /auth. If the DB flag is already true, skip ahead.
  useEffect(() => {
    if (loading) return;
    if (profile?.onboarding_completed) {
      setOnboardingCompleted(true);
      router.navigate({ to: "/daily-focus" });
    }
  }, [loading, profile, router]);

  const progress = ((step + 1) / TOTAL_STEPS) * 100;

  const canProceed = useMemo(() => {
    switch (step) {
      case 0: return goal !== null;
      case 1: return level !== null;
      case 2: return painPoint !== null;
      case 3: return audioAnswer !== null;
      case 4: return target !== null;
      default: return false;
    }
  }, [step, goal, level, painPoint, audioAnswer, target]);

  const playAudio = () => {
    try {
      const u = new SpeechSynthesisUtterance("dessous");
      u.lang = "fr-FR";
      u.rate = 0.9;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
    } catch {
      /* noop */
    }
  };

  const buildAnswers = (): OnboardingAnswers => ({
    goal,
    french_level: level ?? "A1",
    pain_point: painPoint,
    audio_challenge_answer: audioAnswer,
    daily_goal_minutes: Number(target ?? "10"),
  });

  // Persist the consolidated answers on every change so a refresh mid-quiz
  // doesn't lose progress.
  useEffect(() => {
    writeLocalAnswers(buildAnswers());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [goal, level, painPoint, audioAnswer, target]);

  // Auto-advance 400ms after selecting an option (except on the final step).
  // Explicit trigger (not derived from state) so pressing Back doesn't re-fire.
  const scheduleAdvance = (nextStep: StepId) => {
    if (nextStep > 4) return;
    window.setTimeout(() => {
      setStep((s) => (s === nextStep - 1 ? nextStep : s));
    }, 400);
  };
  const pickAndAdvance = <T,>(setter: (v: T) => void, from: StepId) => (v: T) => {
    setter(v);
    if (from < 4) scheduleAdvance((from + 1) as StepId);
  };

  const handleNext = async () => {
    if (!canProceed) return;
    if (step < 4) {
      setStep((s) => (s + 1) as StepId);
      return;
    }
    setSubmitting(true);
    setError(null);

    writeLocalAnswers(buildAnswers());

    if (session?.user) {
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          goal,
          french_level: level ?? "A1",
          pain_point: painPoint,
          audio_challenge_answer: audioAnswer,
          daily_goal_minutes: Number(target),
          onboarding_completed: true,
        })
        .eq("id", session.user.id);
      if (updateError) {
        setError(updateError.message);
        setSubmitting(false);
        return;
      }
      await refetch();
    }

    setOnboardingCompleted(true);
    router.navigate({ to: "/daily-focus" });
  };

  const handleBack = () => {
    if (step > 0) setStep((s) => (s - 1) as StepId);
  };

  // Render immediately for guests; only briefly gate while an active session hydrates.
  if (loading && session) {
    return (
      <main className="flex-1 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </main>
    );
  }

  return (
    <main className="flex-1 px-5 pt-8 pb-24 space-y-8">
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
          <span>Step {step + 1} of {TOTAL_STEPS}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
          <div
            className="h-full rounded-full bg-gradient-neon transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {step === 0 && (
        <StepScreen eyebrow="Your goal" title="What's your main goal?">
          <CardGrid>
            {GOALS.map((o) => (
              <ChoiceCard
                key={o.value}
                selected={goal === o.value}
                onClick={() => setGoal(o.value)}
                label={o.label}
                emoji={o.emoji}
              />
            ))}
          </CardGrid>
        </StepScreen>
      )}

      {step === 1 && (
        <StepScreen eyebrow="Your level" title="What's your current French level?">
          <div className="space-y-3">
            {LEVELS.map((o) => (
              <ChoiceCard
                key={o.value}
                selected={level === o.value}
                onClick={() => setLevel(o.value)}
                label={o.label}
                hint={o.hint}
                emoji={o.emoji}
                wide
              />
            ))}
          </div>
        </StepScreen>
      )}

      {step === 2 && (
        <StepScreen eyebrow="Pain point" title="What trips you up the most in French?">
          <CardGrid>
            {PAIN_POINTS.map((o) => (
              <ChoiceCard
                key={o.value}
                selected={painPoint === o.value}
                onClick={() => setPainPoint(o.value)}
                label={o.label}
                emoji={o.emoji}
              />
            ))}
          </CardGrid>
        </StepScreen>
      )}

      {step === 3 && (
        <StepScreen eyebrow="Ear training" title="Listen closely. Which word do you hear?">
          <button
            type="button"
            onClick={playAudio}
            className="mx-auto mt-2 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-neon text-background shadow-neon transition-transform active:scale-95"
            aria-label="Play audio"
          >
            <Volume2 className="h-10 w-10" />
          </button>
          <p className="text-center text-xs text-muted-foreground">Tap to hear the word</p>
          <div className="mt-2 grid grid-cols-2 gap-3">
            {AUDIO_OPTIONS.map((o) => (
              <button
                key={o.value}
                type="button"
                onClick={() => setAudioAnswer(o.value)}
                className={cn(
                  "rounded-2xl border p-4 text-left transition-all duration-300",
                  audioAnswer === o.value
                    ? "border-primary bg-primary/10 shadow-neon"
                    : "border-border bg-surface hover:bg-surface-2",
                )}
              >
                <p className="text-lg font-semibold">{o.label}</p>
                <p className="text-xs text-muted-foreground">{o.hint}</p>
              </button>
            ))}
          </div>
        </StepScreen>
      )}

      {step === 4 && (
        <StepScreen eyebrow="Commitment" title="Choose your daily target">
          <div className="space-y-3">
            {TARGETS.map((o) => (
              <ChoiceCard
                key={o.value}
                selected={target === o.value}
                onClick={() => setTarget(o.value)}
                label={o.label}
                emoji={o.emoji}
                hint={o.hint}
                wide
              />
            ))}
          </div>
        </StepScreen>
      )}

      {error && (
        <p className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border/70 bg-background/90 backdrop-blur-lg">
        <div className="mx-auto flex max-w-md items-center gap-3 px-4 py-3 pb-[max(env(safe-area-inset-bottom),0.75rem)]">
          {step > 0 && (
            <button
              type="button"
              onClick={handleBack}
              className="rounded-full border border-border bg-surface px-4 py-2.5 text-sm font-medium hover:bg-surface-2"
            >
              Back
            </button>
          )}
          <button
            type="button"
            onClick={handleNext}
            disabled={!canProceed || submitting}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition-all duration-300",
              canProceed && !submitting
                ? "bg-gradient-neon text-background shadow-neon"
                : "cursor-not-allowed bg-surface-2 text-muted-foreground",
            )}
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                {step === 4 ? "Finish" : "Next"}
                <ChevronRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </main>
  );
}

function StepScreen({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-6">
      <header className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {eyebrow}
        </p>
        <h1 className="text-2xl font-bold leading-tight">
          <span className="text-gradient-neon">{title}</span>
        </h1>
      </header>
      {children}
    </section>
  );
}

function CardGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{children}</div>;
}

function ChoiceCard({
  selected,
  onClick,
  label,
  emoji,
  hint,
  wide,
}: {
  selected: boolean;
  onClick: () => void;
  label: string;
  emoji?: string;
  hint?: string;
  wide?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group relative flex items-center gap-3 rounded-2xl border p-4 text-left transition-all duration-300",
        selected
          ? "border-primary bg-primary/10 shadow-neon"
          : "border-border bg-surface hover:bg-surface-2",
        wide && "min-h-[68px]",
      )}
    >
      {emoji && (
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-background text-xl">
          {emoji}
        </span>
      )}
      <span className="flex-1">
        <span className="block font-semibold leading-tight">{label}</span>
        {hint && <span className="mt-0.5 block text-xs text-muted-foreground">{hint}</span>}
      </span>
      {selected && (
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-background">
          <Check className="h-3.5 w-3.5" />
        </span>
      )}
    </button>
  );
}
