import { useCallback, useEffect, useRef, useState } from "react";
import { AudioRecorder } from "@/services/audio/AudioRecorder";
import type {
  PronunciationMetrics,
  RecordingError,
  RecordingResult,
  RecordingState,
  ScoreBreakdown,
} from "@/services/audio/types";
import { computePronunciationMetrics } from "@/services/audio/PronunciationScorer";
import { RECORDING, RECOGNITION_LANG } from "@/config/constants";
import { createLogger } from "@/services/logger";

const log = createLogger("useRecorder");

const mapDomError = (err: unknown): RecordingError => {
  if (typeof err === "object" && err !== null && "name" in err) {
    const name = String((err as { name: string }).name);
    if (name === "NotAllowedError" || name === "SecurityError") {
      return {
        kind: "permission-denied",
        message: "Microphone permission was denied. Enable it in your browser settings and try again.",
      };
    }
    if (name === "NotFoundError" || name === "OverconstrainedError") {
      return { kind: "no-microphone", message: "No microphone was detected on this device." };
    }
    if (name === "AbortError") {
      return { kind: "aborted", message: "Recording was interrupted." };
    }
  }
  const msg = err instanceof Error ? err.message : String(err);
  return { kind: "unknown", message: msg };
};

export interface UseRecorderOptions {
  expectedText: string;
  language?: string;
  onScored?: (result: RecordingResult, score: ScoreBreakdown) => void;
}

export interface UseRecorderReturn {
  state: RecordingState;
  /** Kept for API compat — the server-side pipeline has no interim text. */
  interim: string;
  result: RecordingResult | null;
  score: ScoreBreakdown | null;
  error: RecordingError | null;
  isSupported: boolean;
  start: () => Promise<void>;
  stop: () => void;
  reset: () => void;
}

interface ApiResponse extends PronunciationMetrics {
  transcript: string;
  bucket: ScoreBreakdown["bucket"];
  message: string;
}

interface ApiError {
  error?: string;
  message?: string;
}

/**
 * PCM audio recorder → WAV → server pronunciation scoring.
 *
 * State machine: idle → requesting → recording → processing → scored | error.
 * Never throws to the caller; all failure modes surface via `error`.
 */
export const useRecorder = ({
  expectedText,
  language = RECOGNITION_LANG,
  onScored,
}: UseRecorderOptions): UseRecorderReturn => {
  const [state, setState] = useState<RecordingState>("idle");
  const [result, setResult] = useState<RecordingResult | null>(null);
  const [score, setScore] = useState<ScoreBreakdown | null>(null);
  const [error, setError] = useState<RecordingError | null>(null);

  const recorderRef = useRef<AudioRecorder | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const expectedRef = useRef(expectedText);
  const languageRef = useRef(language);
  const onScoredRef = useRef(onScored);

  useEffect(() => { expectedRef.current = expectedText; }, [expectedText]);
  useEffect(() => { languageRef.current = language; }, [language]);
  useEffect(() => { onScoredRef.current = onScored; }, [onScored]);

  const isSupported = typeof window !== "undefined" && AudioRecorder.isSupported();

  const cleanup = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    abortRef.current?.abort();
    abortRef.current = null;
    recorderRef.current?.cancel();
    recorderRef.current = null;
  }, []);

  useEffect(() => () => cleanup(), [cleanup]);

  const reset = useCallback(() => {
    cleanup();
    setState("idle");
    setResult(null);
    setScore(null);
    setError(null);
  }, [cleanup]);

  const scoreOnServer = useCallback(
    async (blob: Blob, durationMs: number): Promise<ScoreBreakdown> => {
      const form = new FormData();
      form.append("file", blob, "recording.wav");
      form.append("expected_text", expectedRef.current);
      form.append("language", languageRef.current);
      form.append("duration_ms", String(durationMs));

      const controller = new AbortController();
      abortRef.current = controller;

      const response = await fetch("/api/pronunciation", {
        method: "POST",
        body: form,
        signal: controller.signal,
      });

      if (!response.ok) {
        let detail: ApiError = {};
        try { detail = (await response.json()) as ApiError; } catch { /* ignore */ }
        const err = new Error(detail.message ?? `Scoring failed (${response.status}).`);
        (err as Error & { code?: string; status?: number }).code = detail.error;
        (err as Error & { code?: string; status?: number }).status = response.status;
        throw err;
      }

      const payload = (await response.json()) as ApiResponse;
      return {
        score: payload.overall,
        overall: payload.overall,
        accuracy: payload.accuracy,
        fluency: payload.fluency,
        completeness: payload.completeness,
        bucket: payload.bucket,
        message: payload.message,
        // Diff is a UI concern — rebuild it locally from the transcript.
        diff: computePronunciationMetrics({
          expected: expectedRef.current,
          heard: payload.transcript,
          durationMs,
        }).diff,
      };
    },
    [],
  );

  const finalize = useCallback(async () => {
    const recorder = recorderRef.current;
    if (!recorder) return;
    try {
      setState("processing");
      const { blob, durationMs } = await recorder.stop();
      recorderRef.current = null;

      if (!blob || blob.size < 2048) {
        setError({
          kind: "empty-audio",
          message: "That recording was too short or silent — please try again.",
        });
        setState("error");
        return;
      }

      const rec: RecordingResult = { transcript: "", audioBlob: blob, durationMs };
      const breakdown = await scoreOnServer(blob, durationMs);
      // Backfill transcript for UI callbacks. Recompute here so the diff is
      // aligned with what the server actually heard.
      const local = computePronunciationMetrics({
        expected: expectedRef.current,
        heard: (breakdown.diff.filter((c) => c.kind !== "missing").map((c) => c.text).join(" ")),
        durationMs,
      });
      rec.transcript = local.diff
        .filter((c) => c.kind !== "missing")
        .map((c) => c.text)
        .join(" ");
      setResult(rec);
      setScore(breakdown);
      setState("scored");
      log.info("scored attempt", {
        overall: breakdown.overall,
        accuracy: breakdown.accuracy,
        fluency: breakdown.fluency,
        completeness: breakdown.completeness,
      });
      onScoredRef.current?.(rec, breakdown);
    } catch (err) {
      log.error("finalize failed", err);
      if (err instanceof DOMException && err.name === "AbortError") {
        setError({ kind: "aborted", message: "Recording was cancelled." });
      } else if (err instanceof TypeError) {
        setError({
          kind: "network",
          message: "Couldn't reach the scoring service — check your connection.",
        });
      } else {
        setError({
          kind: "recognition-failed",
          message: err instanceof Error ? err.message : "Scoring failed. Please try again.",
        });
      }
      setState("error");
    } finally {
      abortRef.current = null;
    }
  }, [scoreOnServer]);

  const start = useCallback(async () => {
    if (!isSupported) {
      setError({
        kind: "unsupported",
        message:
          "Voice practice needs a modern browser with Web Audio. Try the latest Chrome, Edge, or Safari.",
      });
      setState("error");
      return;
    }
    reset();
    setState("requesting");
    try {
      const recorder = new AudioRecorder();
      await recorder.start();
      recorderRef.current = recorder;
      setState("recording");

      timeoutRef.current = setTimeout(() => {
        log.warn("max duration reached — stopping");
        void finalize();
      }, RECORDING.MAX_DURATION_MS);
    } catch (err) {
      log.error("start failed", err);
      setError(mapDomError(err));
      setState("error");
      cleanup();
    }
  }, [cleanup, finalize, isSupported, reset]);

  const stop = useCallback(() => {
    if (state !== "recording") return;
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    void finalize();
  }, [finalize, state]);

  return { state, interim: "", result, score, error, isSupported, start, stop, reset };
};
