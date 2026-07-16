import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
import { Volume2, Check, ChevronRight, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useProfile, type Goal, type PainPoint } from "@/hooks/useProfile";
import { APP_NAME } from "@/config/constants";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/onboarding")({
  head: () => ({ meta: [{ title: `Get started — ${APP_NAME}` }] }),
  component: OnboardingPage,
});

type StepId = 0 | 1 | 2 | 3;

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
  const [painPoint, setPainPoint] = useState<PainPoint | null>(null);
  const [audioAnswer, setAudioAnswer] = useState<"dessus" | "dessous" | null>(null);
  const [target, setTarget] = useState<"3" | "10" | "20" | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If not signed in, bounce to auth. If already onboarded, bounce to practice.
  useEffect(() => {
    if (loading) return;
    if (!session) {
      router.navigate({ to: "/auth" });
    } else if (profile?.onboarding_completed) {
      router.navigate({ to: "/practice" });
    }
  }, [loading, session, profile, router]);

  const totalSteps = 4;
  const progress = ((step + 1) / totalSteps) * 100;

  const canProceed = useMemo(() => {
    if (step === 0) return goal !== null;
    if (step === 1) return painPoint !== null;
    if (step === 2) return audioAnswer !== null;
    if (step === 3) return target !== null;
    return false;
  }, [step, goal, painPoint, audioAnswer, target]);

  const playAudio = () => {
    // MVP mock: use Web Speech synthesis to say "dessous"
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

  const handleNext = async () => {
    if (!canProceed) return;
    if (step < 3) {
      setStep((s) => (s + 1) as StepId);
      return;
    }
    if (!session?.user) return;
    setSubmitting(true);
    setError(null);
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        goal,
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
    router.navigate({ to: "/practice" });
  };

  const handleBack = () => {
    if (step > 0) setStep((s) => (s - 1) as StepId);
  };

  if (loading || !session) {
    return (
      <main className="flex-1 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </main>
    );
  }

  return (
    <main className="flex-1 px-5 pt-8 pb-24 space-y-8">
      {/* Progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
          <span>Step {step + 1} of {totalSteps}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
          <div
            className="h-full rounded-full bg-gradient-neon transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Step content */}
      {step === 0 && (
        <StepScreen
          eyebrow="Your goal"
          title="What's your main goal?"
        >
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
        <StepScreen
          eyebrow="Pain point"
          title="What trips you up the most in French?"
        >
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

      {step === 2 && (
        <StepScreen
          eyebrow="Ear training"
          title="Listen closely. Which word do you hear?"
        >
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
                  "rounded-2xl border p-4 text-left transition-all",
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

      {step === 3 && (
        <StepScreen
          eyebrow="Commitment"
          title="Choose your daily target"
        >
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

      {/* Actions */}
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
              "flex flex-1 items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition-all",
              canProceed && !submitting
                ? "bg-gradient-neon text-background shadow-neon"
                : "cursor-not-allowed bg-surface-2 text-muted-foreground",
            )}
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                {step === 3 ? "Finish" : "Next"}
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
        "group relative flex items-center gap-3 rounded-2xl border p-4 text-left transition-all",
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
