import { RECOGNITION_LANG } from "@/config/constants";
import { createLogger } from "@/services/logger";

const log = createLogger("SpeechRecognizer");

/* Web Speech API typing — the DOM lib does not yet include these. */
type SRResultList = ArrayLike<{
  readonly isFinal: boolean;
  readonly length: number;
  readonly 0: { readonly transcript: string; readonly confidence: number };
}>;

interface SREvent extends Event {
  readonly resultIndex: number;
  readonly results: SRResultList;
}

interface SRErrorEvent extends Event {
  readonly error: string;
  readonly message?: string;
}

interface SRInstance {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  maxAlternatives: number;
  onresult: ((ev: SREvent) => void) | null;
  onerror: ((ev: SRErrorEvent) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

type SRConstructor = new () => SRInstance;

interface SpeechRecognitionWindow extends Window {
  SpeechRecognition?: SRConstructor;
  webkitSpeechRecognition?: SRConstructor;
}

const getConstructor = (): SRConstructor | undefined => {
  if (typeof window === "undefined") return undefined;
  const w = window as SpeechRecognitionWindow;
  return w.SpeechRecognition ?? w.webkitSpeechRecognition;
};

export interface RecognizerCallbacks {
  onInterim?: (text: string) => void;
  onFinal: (text: string) => void;
  onError: (error: string) => void;
  onEnd?: () => void;
}

/**
 * Web Speech API wrapper, pre-configured for French (fr-FR).
 * Emits interim + final transcripts. Consumers drive lifecycle via start()/stop().
 */
export class SpeechRecognizer {
  private instance: SRInstance | null = null;
  private finalText = "";

  static isSupported(): boolean {
    return getConstructor() !== undefined;
  }

  start(cb: RecognizerCallbacks): void {
    const Ctor = getConstructor();
    if (!Ctor) {
      cb.onError("Speech recognition is not supported in this browser.");
      return;
    }
    this.finalText = "";
    const rec = new Ctor();
    rec.lang = RECOGNITION_LANG;
    rec.interimResults = true;
    rec.continuous = false;
    rec.maxAlternatives = 1;

    rec.onstart = () => log.info("recognition started", { lang: rec.lang });

    rec.onresult = (ev) => {
      let interim = "";
      for (let i = ev.resultIndex; i < ev.results.length; i += 1) {
        const result = ev.results[i];
        const chunk = result[0].transcript;
        if (result.isFinal) {
          this.finalText = `${this.finalText} ${chunk}`.trim();
          log.debug("final chunk", chunk);
        } else {
          interim += chunk;
        }
      }
      if (interim && cb.onInterim) cb.onInterim(interim.trim());
    };

    rec.onerror = (ev) => {
      log.error("recognition error", ev.error, ev.message);
      cb.onError(ev.error || "recognition-error");
    };

    rec.onend = () => {
      log.info("recognition ended", { finalText: this.finalText });
      cb.onFinal(this.finalText);
      cb.onEnd?.();
    };

    try {
      rec.start();
      this.instance = rec;
    } catch (err) {
      log.error("failed to start recognizer", err);
      cb.onError(err instanceof Error ? err.message : "start-failed");
    }
  }

  stop(): void {
    try {
      this.instance?.stop();
    } catch (err) {
      log.warn("stop threw (ignored)", err);
    }
  }

  abort(): void {
    try {
      this.instance?.abort();
    } catch (err) {
      log.warn("abort threw (ignored)", err);
    }
  }
}
