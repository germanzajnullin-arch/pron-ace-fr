import { useCallback, useEffect, useRef, useState } from "react";
import { AudioRecorder } from "@/services/audio/AudioRecorder";
import { SpeechRecognizer } from "@/services/audio/SpeechRecognizer";
import { scorePronunciation } from "@/services/audio/PronunciationScorer";
import type {
  RecordingError,
  RecordingResult,
  RecordingState,
  ScoreBreakdown,
} from "@/services/audio/types";
import { RECORDING } from "@/config/constants";
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
  onScored?: (result: RecordingResult, score: ScoreBreakdown) => void;
}

export interface UseRecorderReturn {
  state: RecordingState;
  interim: string;
  result: RecordingResult | null;
  score: ScoreBreakdown | null;
  error: RecordingError | null;
  isSupported: boolean;
  start: () => Promise<void>;
  stop: () => void;
  reset: () => void;
}

/**
 * Orchestrates AudioRecorder + SpeechRecognizer + scoring.
 * State machine: idle → requesting → recording → processing → scored | error.
 */
export const useRecorder = ({
  expectedText,
  onScored,
}: UseRecorderOptions): UseRecorderReturn => {
  const [state, setState] = useState<RecordingState>("idle");
  const [interim, setInterim] = useState("");
  const [result, setResult] = useState<RecordingResult | null>(null);
  const [score, setScore] = useState<ScoreBreakdown | null>(null);
  const [error, setError] = useState<RecordingError | null>(null);

  const recorderRef = useRef<AudioRecorder | null>(null);
  const recognizerRef = useRef<SpeechRecognizer | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const expectedRef = useRef(expectedText);
  const onScoredRef = useRef(onScored);

  useEffect(() => {
    expectedRef.current = expectedText;
  }, [expectedText]);
  useEffect(() => {
    onScoredRef.current = onScored;
  }, [onScored]);

  const isSupported =
    typeof window !== "undefined" &&
    AudioRecorder.isSupported() &&
    SpeechRecognizer.isSupported();

  const cleanup = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    recognizerRef.current?.abort();
    recognizerRef.current = null;
    recorderRef.current?.cancel();
    recorderRef.current = null;
  }, []);

  useEffect(() => () => cleanup(), [cleanup]);

  const reset = useCallback(() => {
    cleanup();
    setState("idle");
    setInterim("");
    setResult(null);
    setScore(null);
    setError(null);
  }, [cleanup]);

  const finalize = useCallback(
    async (transcript: string) => {
      const recorder = recorderRef.current;
      if (!recorder) return;
      try {
        setState("processing");
        const { blob, durationMs } = await recorder.stop();
        const rec: RecordingResult = {
          transcript: transcript.trim(),
          audioBlob: blob,
          durationMs,
        };
        setResult(rec);
        const breakdown = scorePronunciation(expectedRef.current, rec.transcript);
        setScore(breakdown);
        setState("scored");
        log.info("scored attempt", { score: breakdown.score, bucket: breakdown.bucket });
        onScoredRef.current?.(rec, breakdown);
      } catch (err) {
        log.error("finalize failed", err);
        setError(mapDomError(err));
        setState("error");
      } finally {
        recorderRef.current = null;
        recognizerRef.current = null;
      }
    },
    [],
  );

  const start = useCallback(async () => {
    if (!isSupported) {
      setError({
        kind: "unsupported",
        message:
          "Voice practice needs a browser with the Web Speech API. Try the latest Chrome, Edge, or Safari.",
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

      const recognizer = new SpeechRecognizer();
      recognizerRef.current = recognizer;
      recognizer.start({
        onInterim: (text) => setInterim(text),
        onFinal: (text) => {
          void finalize(text);
        },
        onError: (code) => {
          log.warn("recognition error code", code);
          if (code === "not-allowed" || code === "service-not-allowed") {
            setError({
              kind: "permission-denied",
              message: "Microphone permission is required for pronunciation feedback.",
            });
          } else if (code === "no-speech") {
            setError({
              kind: "recognition-failed",
              message: "We didn't catch any speech — try again a bit louder.",
            });
          } else if (code === "aborted") {
            // Ignored — abort() is a normal teardown signal.
          } else {
            setError({ kind: "recognition-failed", message: `Recognition failed (${code}).` });
          }
          if (code !== "aborted") setState("error");
        },
      });
      setState("recording");

      timeoutRef.current = setTimeout(() => {
        log.warn("max duration reached — stopping");
        recognizer.stop();
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
    log.info("user stop");
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    recognizerRef.current?.stop();
  }, [state]);

  return { state, interim, result, score, error, isSupported, start, stop, reset };
};
