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

export interface ScoreBreakdown {
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
  | { kind: "aborted"; message: string }
  | { kind: "unknown"; message: string };
