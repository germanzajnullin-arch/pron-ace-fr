import { SCORING } from "@/config/constants";
import { createLogger } from "@/services/logger";
import type { DiffChunk, PronunciationMetrics, ScoreBreakdown } from "./types";

const log = createLogger("PronunciationScorer");

const normalize = (input: string): string =>
  input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}\s']/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

const levenshtein = (a: string, b: string): number => {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  let curr = new Array<number>(b.length + 1);

  for (let i = 1; i <= a.length; i += 1) {
    curr[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(
        curr[j - 1] + 1,
        prev[j] + 1,
        prev[j - 1] + cost,
      );
    }
    [prev, curr] = [curr, prev];
  }
  return prev[b.length];
};

const wordDiff = (expectedWords: string[], heardWords: string[]): DiffChunk[] => {
  const chunks: DiffChunk[] = [];
  const heardSet = new Set(heardWords);
  const expectedSet = new Set(expectedWords);
  for (const word of expectedWords) {
    chunks.push({ text: word, kind: heardSet.has(word) ? "match" : "missing" });
  }
  for (const word of heardWords) {
    if (!expectedSet.has(word)) chunks.push({ text: word, kind: "extra" });
  }
  return chunks;
};

const bucketFor = (score: number): ScoreBreakdown["bucket"] => {
  if (score >= SCORING.EXCELLENT) return "excellent";
  if (score >= SCORING.GOOD) return "good";
  if (score >= SCORING.FAIR) return "fair";
  return "retry";
};

const messageFor = (
  bucket: ScoreBreakdown["bucket"],
  metrics: PronunciationMetrics,
): string => {
  const weakest = weakestMetric(metrics);
  const weakLabel: Record<keyof PronunciationMetrics, string> = {
    overall: "overall pronunciation",
    accuracy: "phoneme accuracy",
    fluency: "rhythm & liaisons",
    completeness: "reading the full phrase",
  };
  switch (bucket) {
    case "excellent":
      return "Excellent ! Native-level clarity.";
    case "good":
      return `Bien joué — polish the ${weakLabel[weakest]}.`;
    case "fair":
      return `Not bad. Focus on ${weakLabel[weakest]}.`;
    case "retry":
      return "Let's try again — slow down and listen to the example first.";
  }
};

const weakestMetric = (m: PronunciationMetrics): keyof PronunciationMetrics => {
  const entries: [keyof PronunciationMetrics, number][] = [
    ["accuracy", m.accuracy],
    ["fluency", m.fluency],
    ["completeness", m.completeness],
  ];
  entries.sort((a, b) => a[1] - b[1]);
  return entries[0][0];
};

const clamp01 = (n: number): number => Math.max(0, Math.min(1, Number(n.toFixed(3))));

export interface ComputeMetricsInput {
  expected: string;
  heard: string;
  /** Recording duration in ms. Used for the fluency proxy. */
  durationMs: number;
}

/**
 * Compute all four metrics from the transcript + timing.
 * Deterministic — no I/O — so it runs identically on server and client.
 *
 * - Accuracy: 1 − charLevenshtein/maxLen on normalized strings.
 * - Completeness: matched expected words / expected words.
 * - Fluency: penalty as heard-tempo diverges from expected French tempo
 *   (~2.5 words/sec at natural speed), floored by accuracy so a wrong
 *   utterance can't score "fluent".
 */
export const computePronunciationMetrics = ({
  expected,
  heard,
  durationMs,
}: ComputeMetricsInput): ScoreBreakdown => {
  const normExpected = normalize(expected);
  const normHeard = normalize(heard);

  if (!normExpected) {
    return {
      score: 0,
      overall: 0,
      accuracy: 0,
      fluency: 0,
      completeness: 0,
      bucket: "retry",
      message: "Nothing to compare against.",
      diff: [],
    };
  }

  const expectedWords = normExpected.split(" ").filter(Boolean);
  const heardWords = normHeard.split(" ").filter(Boolean);
  const heardSet = new Set(heardWords);

  // Accuracy — character-level distance
  const distance = levenshtein(normExpected, normHeard);
  const maxLen = Math.max(normExpected.length, normHeard.length, 1);
  const accuracy = clamp01(1 - distance / maxLen);

  // Completeness — expected words present in the transcript
  const matched = expectedWords.filter((w) => heardSet.has(w)).length;
  const completeness = clamp01(expectedWords.length === 0 ? 0 : matched / expectedWords.length);

  // Fluency — closeness of tempo to natural French cadence (2.5 wps)
  const seconds = Math.max(durationMs, 500) / 1000;
  const wps = heardWords.length / seconds;
  const target = 2.5;
  const tempoFit = Math.max(0, 1 - Math.abs(wps - target) / target);
  // Prevent nonsense words from scoring fluent
  const fluency = clamp01(tempoFit * (0.35 + 0.65 * accuracy));

  const overall = clamp01(0.55 * accuracy + 0.25 * fluency + 0.2 * completeness);
  const bucket = bucketFor(overall);
  const diff = wordDiff(expectedWords, heardWords);
  const metrics: PronunciationMetrics = { overall, accuracy, fluency, completeness };

  log.info("scored", { expected: normExpected, heard: normHeard, ...metrics, bucket });

  return {
    score: overall,
    ...metrics,
    bucket,
    message: messageFor(bucket, metrics),
    diff,
  };
};

/** Back-compat alias used by older call sites. */
export const scorePronunciation = (expected: string, heard: string): ScoreBreakdown =>
  computePronunciationMetrics({ expected, heard, durationMs: 2000 });
