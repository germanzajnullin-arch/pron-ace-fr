import { Mic, Square, Loader2, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RecordingState } from "@/services/audio/types";

interface RecordButtonProps {
  state: RecordingState;
  onStart: () => void;
  onStop: () => void;
  onReset: () => void;
  disabled?: boolean;
}

const LABELS: Record<RecordingState, string> = {
  idle: "Tap to record",
  requesting: "Requesting mic…",
  recording: "Recording — tap to stop",
  processing: "Scoring…",
  scored: "Try again",
  error: "Try again",
};

export function RecordButton({ state, onStart, onStop, onReset, disabled }: RecordButtonProps) {
  const isRecording = state === "recording";
  const isBusy = state === "requesting" || state === "processing";
  const canReset = state === "scored" || state === "error";

  const handleClick = () => {
    if (disabled) return;
    if (isRecording) return onStop();
    if (canReset) return onReset();
    if (state === "idle") return void onStart();
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled || isBusy}
        aria-label={LABELS[state]}
        className={cn(
          "relative flex h-20 w-20 items-center justify-center rounded-full text-primary-foreground transition-all",
          "disabled:cursor-not-allowed disabled:opacity-60",
          isRecording
            ? "bg-destructive shadow-neon animate-pulse-neon"
            : "bg-gradient-hero shadow-neon hover:-translate-y-0.5 active:translate-y-0",
        )}
      >
        {isBusy ? (
          <Loader2 className="h-8 w-8 animate-spin" aria-hidden />
        ) : isRecording ? (
          <Square className="h-8 w-8" aria-hidden fill="currentColor" />
        ) : canReset ? (
          <RotateCcw className="h-8 w-8" aria-hidden />
        ) : (
          <Mic className="h-8 w-8" aria-hidden />
        )}
      </button>
      <p className="text-xs font-medium text-muted-foreground">{LABELS[state]}</p>
    </div>
  );
}
