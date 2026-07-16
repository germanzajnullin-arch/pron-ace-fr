import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Speaks arbitrary text with the browser's native SpeechSynthesis in fr-FR.
 *
 * Chooses the best available French voice once voices load, falls back to
 * whatever the platform provides if no fr-FR voice is installed, and stays
 * silent (rather than throwing) when the API is missing entirely.
 */
export interface UseFrenchTTS {
  /** True when a `speak()` call is actively producing audio. */
  speaking: boolean;
  /** True when `window.speechSynthesis` is available in this environment. */
  supported: boolean;
  /** True while the voice list is being fetched by the platform. */
  voicesLoading: boolean;
  /** Speak the given text. Cancels any in-flight utterance first. */
  speak: (text: string) => void;
  /** Cancel any active or queued speech. */
  stop: () => void;
}

const FR_LANG = "fr-FR" as const;
const NATURAL_RATE = 0.95 as const;
const NATURAL_PITCH = 1 as const;

const pickFrenchVoice = (
  voices: readonly SpeechSynthesisVoice[],
): SpeechSynthesisVoice | null => {
  if (voices.length === 0) return null;
  const exact = voices.find((v) => v.lang === FR_LANG);
  if (exact) return exact;
  const anyFr = voices.find((v) => v.lang.toLowerCase().startsWith("fr"));
  return anyFr ?? null;
};

export const useFrenchTTS = (): UseFrenchTTS => {
  const supported =
    typeof window !== "undefined" && "speechSynthesis" in window;
  const [speaking, setSpeaking] = useState(false);
  const [voice, setVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [voicesLoading, setVoicesLoading] = useState(supported);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    if (!supported) return;
    const synth = window.speechSynthesis;
    const refresh = () => {
      const list = synth.getVoices();
      const picked = pickFrenchVoice(list);
      setVoice(picked);
      // Some engines return [] briefly on first call — keep the loading flag on
      // until at least one voice is present.
      if (list.length > 0) setVoicesLoading(false);
    };
    refresh();
    synth.addEventListener("voiceschanged", refresh);
    // Safety timeout: if `voiceschanged` never fires (some engines), stop the spinner.
    const timer = window.setTimeout(() => setVoicesLoading(false), 1500);
    return () => {
      synth.removeEventListener("voiceschanged", refresh);
      window.clearTimeout(timer);
    };
  }, [supported]);

  // Cancel any lingering utterance on unmount.
  useEffect(() => {
    return () => {
      if (!supported) return;
      window.speechSynthesis.cancel();
    };
  }, [supported]);

  const stop = useCallback(() => {
    if (!supported) return;
    window.speechSynthesis.cancel();
    setSpeaking(false);
  }, [supported]);

  const speak = useCallback(
    (text: string) => {
      if (!supported || !text.trim()) return;
      const synth = window.speechSynthesis;
      synth.cancel(); // never queue on top of a previous request
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = FR_LANG;
      utter.rate = NATURAL_RATE;
      utter.pitch = NATURAL_PITCH;
      if (voice) utter.voice = voice;
      utter.onstart = () => setSpeaking(true);
      utter.onend = () => setSpeaking(false);
      utter.onerror = () => setSpeaking(false);
      utteranceRef.current = utter;
      synth.speak(utter);
    },
    [supported, voice],
  );

  return { speaking, supported, voicesLoading, speak, stop };
};
