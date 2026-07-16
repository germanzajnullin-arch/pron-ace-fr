import { SCORING } from "@/config/constants";
import { createLogger } from "@/services/logger";
import type { DiffChunk, ScoreBreakdown } from "./types";

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

const messageFor = (bucket: ScoreBreakdown["bucket"]): string => {
  switch (bucket) {
    case "excellent":
      return "Excellent ! Native-level clarity.";
    case "good":
      return "Bien joué — a couple of small tweaks and it's perfect.";
    case "fair":
      return "Not bad. Focus on the highlighted words.";
    case "retry":
      return "Let's try again — listen to the example first.";
  }
};

/**
 * Compute a 0..1 pronunciation score by character-level distance on the
 * normalized transcripts, plus a word-level diff for the UI.
 */
export const scorePronunciation = (
  expected: string,
  heard: string,
): ScoreBreakdown => {
  const normExpected = normalize(expected);
  const normHeard = normalize(heard);

  if (!normExpected) {
    return {
      score: 0,
      bucket: "retry",
      message: "Nothing to compare against.",
      diff: [],
    };
  }

  const distance = levenshtein(normExpected, normHeard);
  const maxLen = Math.max(normExpected.length, normHeard.length, 1);
  const rawScore = 1 - distance / maxLen;
  const score = Math.max(0, Math.min(1, Number(rawScore.toFixed(3))));

  const diff = wordDiff(normExpected.split(" "), normHeard.split(" "));
  const bucket = bucketFor(score);

  log.info("scored", { expected: normExpected, heard: normHeard, score, bucket });

  return { score, bucket, message: messageFor(bucket), diff };
};
