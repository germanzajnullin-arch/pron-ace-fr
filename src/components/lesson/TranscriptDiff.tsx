import type { DiffChunk } from "@/services/audio/types";
import { cn } from "@/lib/utils";

export function TranscriptDiff({ diff }: { diff: readonly DiffChunk[] }) {
  if (!diff.length) return null;
  return (
    <p className="flex flex-wrap gap-1.5 text-sm leading-relaxed">
      {diff.map((chunk, i) => (
        <span
          key={`${chunk.text}-${i}`}
          className={cn(
            "rounded-md px-1.5 py-0.5",
            chunk.kind === "match" && "bg-primary/15 text-primary",
            chunk.kind === "missing" && "bg-destructive/15 text-destructive line-through",
            chunk.kind === "extra" && "bg-accent/15 text-accent italic",
          )}
        >
          {chunk.text}
        </span>
      ))}
    </p>
  );
}
