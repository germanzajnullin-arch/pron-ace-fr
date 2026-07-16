import { Lightbulb } from "lucide-react";
import { PlayAudioButton } from "./PlayAudioButton";

interface PhraseDisplayProps {
  title?: string;
  frenchText: string;
  translation?: string | null;
  hints?: readonly string[];
}

/**
 * Presents a French phrase with a prominent TTS "Play Audio" button.
 * Audio is generated on-device via the Web Speech API in fr-FR, so every
 * lesson has playback whether or not it ships with a recorded example.
 */
export function PhraseDisplay({
  title,
  frenchText,
  translation,
  hints,
}: PhraseDisplayProps) {
  return (
    <div className="rounded-3xl bg-gradient-surface p-6 shadow-elevated">
      {title ? (
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {title}
        </p>
      ) : null}

      <div className="mt-3 flex justify-center">
        <PlayAudioButton text={frenchText} variant="prominent" />
      </div>

      <p className="mt-5 text-center text-2xl font-semibold leading-snug text-foreground">
        {frenchText}
      </p>

      {translation ? (
        <p className="mt-2 text-center text-sm italic text-muted-foreground">
          {translation}
        </p>
      ) : null}

      {hints && hints.length > 0 ? (
        <ul className="mt-5 space-y-2 border-t border-white/5 pt-4">
          {hints.map((hint) => (
            <li key={hint} className="flex items-start gap-2 text-xs text-muted-foreground">
              <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" aria-hidden />
              <span>{hint}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
