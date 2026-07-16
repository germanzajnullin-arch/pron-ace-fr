import { Volume2, Square, Loader2 } from "lucide-react";
import { useFrenchTTS } from "@/hooks/useFrenchTTS";
import { cn } from "@/lib/utils";

interface PlayAudioButtonProps {
  text: string;
  /** "prominent" = large pill above the phrase, "compact" = inline chip. */
  variant?: "prominent" | "compact";
  className?: string;
}

/**
 * Reusable native-TTS trigger for any French phrase.
 * Uses `useFrenchTTS` under the hood so all playback shares one voice-load lifecycle.
 */
export function PlayAudioButton({
  text,
  variant = "prominent",
  className,
}: PlayAudioButtonProps) {
  const { speak, stop, speaking, supported, voicesLoading } = useFrenchTTS();

  if (!supported) return null;

  const handleClick = () => {
    if (speaking) stop();
    else speak(text);
  };

  const label = speaking ? "Stop audio" : "Play audio";
  const busy = voicesLoading && !speaking;

  if (variant === "compact") {
    return (
      <button
        type="button"
        onClick={handleClick}
        aria-label={label}
        disabled={busy}
        className={cn(
          "inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/20 disabled:opacity-60",
          className,
        )}
      >
        {busy ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
        ) : speaking ? (
          <Square className="h-3.5 w-3.5 fill-current" aria-hidden />
        ) : (
          <Volume2 className="h-3.5 w-3.5" aria-hidden />
        )}
        {speaking ? "Stop" : "Listen"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={label}
      disabled={busy}
      className={cn(
        "group inline-flex items-center gap-3 rounded-full bg-gradient-neon px-5 py-3 text-sm font-semibold text-background shadow-neon transition-transform active:scale-95 disabled:opacity-60",
        className,
      )}
    >
      <span className="relative flex h-6 w-6 items-center justify-center">
        {busy ? (
          <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
        ) : speaking ? (
          <>
            <SoundWave />
          </>
        ) : (
          <Volume2 className="h-5 w-5" aria-hidden />
        )}
      </span>
      {speaking ? "Playing…" : "Play Audio"}
    </button>
  );
}

/** Three animated bars — pure CSS, no framer dep. */
function SoundWave() {
  return (
    <span
      aria-hidden
      className="flex h-5 w-5 items-end justify-center gap-[2px]"
    >
      <span className="h-2 w-[3px] animate-[wave_0.9s_ease-in-out_infinite] rounded-full bg-current" />
      <span className="h-4 w-[3px] animate-[wave_0.9s_ease-in-out_infinite_-0.15s] rounded-full bg-current" />
      <span className="h-3 w-[3px] animate-[wave_0.9s_ease-in-out_infinite_-0.3s] rounded-full bg-current" />
    </span>
  );
}
