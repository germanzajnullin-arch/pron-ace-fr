export type RecordingState =
  | "idle"
  | "requesting"
  | "recording"
  | "processing"
  | "scored"
  | "error";

export interface RecordingResult {
  transcript: string;
  audioBlob: Blob | null;
  durationMs: number;
}

/**
 * Detailed pronunciation metrics.
 * Every score is normalized to 0..1 so the UI can render a progress bar.
 */
export interface PronunciationMetrics {
  /** Weighted overall score. */
  overall: number;
  /** Phoneme/word precision vs. the target phrase. */
  accuracy: number;
  /** Rhythm and tempo (words per second vs. expected). */
  fluency: number;
  /** How much of the expected phrase was actually spoken. */
  completeness: number;
}

export interface ScoreBreakdown extends PronunciationMetrics {
  /** Alias for `overall` — kept for compatibility with existing callers. */
  score: number;
  bucket: "excellent" | "good" | "fair" | "retry";
  message: string;
  diff: readonly DiffChunk[];
}

export interface DiffChunk {
  text: string;
  kind: "match" | "extra" | "missing";
}

export type RecordingError =
  | { kind: "permission-denied"; message: string }
  | { kind: "no-microphone"; message: string }
  | { kind: "unsupported"; message: string }
  | { kind: "recognition-failed"; message: string }
  | { kind: "empty-audio"; message: string }
  | { kind: "network"; message: string }
  | { kind: "aborted"; message: string }
  | { kind: "unknown"; message: string };
