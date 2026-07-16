import { Lightbulb, Volume2 } from "lucide-react";

interface PhraseDisplayProps {
  title?: string;
  frenchText: string;
  translation?: string | null;
  hints?: readonly string[];
  onPlayAudio?: () => void;
  audioAvailable?: boolean;
}

export function PhraseDisplay({
  title,
  frenchText,
  translation,
  hints,
  onPlayAudio,
  audioAvailable,
}: PhraseDisplayProps) {
  return (
    <div className="rounded-3xl bg-gradient-surface p-6 shadow-elevated">
      {title ? (
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {title}
        </p>
      ) : null}
      <p className="mt-2 text-2xl font-semibold leading-snug text-foreground">
        {frenchText}
      </p>
      {translation ? (
        <p className="mt-2 text-sm italic text-muted-foreground">{translation}</p>
      ) : null}

      {audioAvailable && onPlayAudio ? (
        <button
          type="button"
          onClick={onPlayAudio}
          className="mt-4 inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/20"
        >
          <Volume2 className="h-3.5 w-3.5" aria-hidden />
          Listen to example
        </button>
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
