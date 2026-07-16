import { createFileRoute } from "@tanstack/react-router";
import { computePronunciationMetrics } from "@/services/audio/PronunciationScorer";

const MAX_AUDIO_BYTES = 5 * 1024 * 1024; // 5 MiB — plenty for a 20 s WAV @16 kHz
const ALLOWED_MIMES = new Set([
  "audio/wav",
  "audio/wave",
  "audio/x-wav",
  "audio/mpeg",
  "audio/mp3",
  "audio/webm",
  "audio/ogg",
]);

interface ScoreResponse {
  transcript: string;
  overall: number;
  accuracy: number;
  fluency: number;
  completeness: number;
  bucket: "excellent" | "good" | "fair" | "retry";
  message: string;
}

const jsonError = (status: number, code: string, message: string) =>
  new Response(JSON.stringify({ error: code, message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });

const transcribe = async (
  file: File,
  language: string,
  apiKey: string,
): Promise<string> => {
  const upstream = new FormData();
  upstream.append("model", "openai/gpt-4o-mini-transcribe");
  // Bare ISO-639-1 only — locale strings like "fr-FR" are rejected.
  upstream.append("language", language.slice(0, 2));
  upstream.append("file", file, file.name || "recording.wav");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25_000);

  try {
    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/audio/transcriptions",
      {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}` },
        body: upstream,
        signal: controller.signal,
      },
    );

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      throw new Error(`Transcription upstream ${response.status}: ${detail}`);
    }

    const payload = (await response.json()) as { text?: string };
    return (payload.text ?? "").trim();
  } finally {
    clearTimeout(timeout);
  }
};

/**
 * POST /api/pronunciation
 *
 * multipart/form-data:
 *   file            – WAV/WebM audio blob
 *   expected_text   – target phrase the user was asked to read
 *   language        – BCP-47 tag, defaults to "fr-FR"
 *
 * Returns the full metrics payload (accuracy, fluency, completeness, overall).
 * Persistence is a separate concern — call `saveAttempt` from the client with
 * this response once you know the user is signed in.
 */
export const Route = createFileRoute("/api/pronunciation")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const contentType = request.headers.get("content-type") ?? "";
        if (!contentType.includes("multipart/form-data")) {
          return jsonError(400, "bad_request", "Expected multipart/form-data.");
        }

        let form: FormData;
        try {
          form = await request.formData();
        } catch (err) {
          return jsonError(400, "bad_request", `Malformed form: ${(err as Error).message}`);
        }

        const file = form.get("file");
        const expectedText = String(form.get("expected_text") ?? "").trim();
        const language = String(form.get("language") ?? "fr-FR");
        const durationMs = Number(form.get("duration_ms") ?? "0") || 0;

        if (!(file instanceof File)) {
          return jsonError(400, "no_audio", "Audio file is required.");
        }
        if (!expectedText) {
          return jsonError(400, "no_target", "expected_text is required.");
        }
        if (file.size === 0) {
          return jsonError(400, "empty_audio", "The recording was empty.");
        }
        if (file.size > MAX_AUDIO_BYTES) {
          return jsonError(413, "too_large", "Recording is too long — keep it under 20 seconds.");
        }
        if (file.type && !ALLOWED_MIMES.has(file.type)) {
          return jsonError(415, "unsupported_type", `Audio type ${file.type} is not supported.`);
        }

        const apiKey = process.env.LOVABLE_API_KEY;
        if (!apiKey) {
          return jsonError(500, "missing_key", "Pronunciation scoring is not configured.");
        }

        try {
          const transcript = await transcribe(file, language, apiKey);
          const metrics = computePronunciationMetrics({
            expected: expectedText,
            heard: transcript,
            durationMs,
          });

          const body: ScoreResponse = {
            transcript,
            overall: metrics.overall,
            accuracy: metrics.accuracy,
            fluency: metrics.fluency,
            completeness: metrics.completeness,
            bucket: metrics.bucket,
            message: metrics.message,
          };
          return Response.json(body);
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          if (message.includes("aborted")) {
            return jsonError(504, "timeout", "Scoring took too long. Try again.");
          }
          if (message.includes("429")) {
            return jsonError(429, "rate_limited", "Too many requests. Wait a moment and retry.");
          }
          if (message.includes("402")) {
            return jsonError(402, "billing", "Speech credits are exhausted.");
          }
          console.error("[pronunciation] score failed", err);
          return jsonError(502, "upstream", "The scoring service is temporarily unavailable.");
        }
      },
    },
  },
});
