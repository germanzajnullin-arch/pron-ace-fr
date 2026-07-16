import { createLogger } from "@/services/logger";
import { encodeWav, WAV_TARGET_SAMPLE_RATE } from "./WavEncoder";

const log = createLogger("AudioRecorder");

interface WebkitWindow extends Window {
  webkitAudioContext?: typeof AudioContext;
}

/**
 * PCM-based audio recorder built on the Web Audio API.
 *
 * We deliberately do NOT use `MediaRecorder`: WebM/Opus fragments from
 * `MediaRecorder` are inconsistently decoded by third-party pronunciation
 * engines (Azure, Whisper) and iOS Safari emits fragmented MP4 with a
 * different container header. Capturing raw Float32 PCM and writing a
 * standard 16-bit mono WAV @ 16 kHz gives a decodable, portable file every
 * time and matches the sample rate/format most STT services expect.
 */
export class AudioRecorder {
  private ctx: AudioContext | null = null;
  private stream: MediaStream | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private processor: ScriptProcessorNode | null = null;
  private chunks: Float32Array[] = [];
  private startedAt = 0;
  private inputSampleRate = 48_000;

  static isSupported(): boolean {
    if (typeof window === "undefined") return false;
    const w = window as WebkitWindow;
    return (
      !!navigator.mediaDevices?.getUserMedia &&
      (typeof window.AudioContext !== "undefined" || typeof w.webkitAudioContext !== "undefined")
    );
  }

  async start(): Promise<void> {
    if (!AudioRecorder.isSupported()) {
      throw new Error("Web Audio recording is not supported in this browser.");
    }
    log.debug("requesting mic permission…");
    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        channelCount: 1,
        echoCancellation: true,
        noiseSuppression: true,
      },
    });

    const w = window as WebkitWindow;
    const AudioContextCtor = window.AudioContext ?? w.webkitAudioContext!;
    this.ctx = new AudioContextCtor();
    if (this.ctx.state === "suspended") await this.ctx.resume();
    this.inputSampleRate = this.ctx.sampleRate;

    this.source = this.ctx.createMediaStreamSource(this.stream);
    // ScriptProcessorNode is deprecated but universally supported and does
    // not require a separate AudioWorklet bundle, which keeps SSR/bundling
    // simple. 4096-sample buffer ≈ 85 ms @ 48 kHz — fine for speech.
    this.processor = this.ctx.createScriptProcessor(4096, 1, 1);
    this.chunks = [];
    this.processor.onaudioprocess = (event) => {
      const input = event.inputBuffer.getChannelData(0);
      // Clone: the underlying buffer is reused between callbacks.
      this.chunks.push(new Float32Array(input));
    };
    this.source.connect(this.processor);
    this.processor.connect(this.ctx.destination);

    this.startedAt = performance.now();
    log.info("recording started", { inputSampleRate: this.inputSampleRate });
  }

  async stop(): Promise<{ blob: Blob | null; durationMs: number }> {
    const durationMs = Math.round(performance.now() - this.startedAt);
    const chunks = this.chunks;
    const inputRate = this.inputSampleRate;

    try {
      this.processor?.disconnect();
      this.source?.disconnect();
      if (this.ctx && this.ctx.state !== "closed") await this.ctx.close();
    } catch (err) {
      log.warn("teardown warning", err);
    }
    this.stream?.getTracks().forEach((track) => track.stop());
    this.stream = null;
    this.ctx = null;
    this.source = null;
    this.processor = null;
    this.chunks = [];

    const blob = encodeWav(chunks, inputRate, WAV_TARGET_SAMPLE_RATE);
    log.info("recording stopped", { durationMs, bytes: blob?.size ?? 0 });
    return { blob, durationMs };
  }

  cancel(): void {
    try {
      this.processor?.disconnect();
      this.source?.disconnect();
      if (this.ctx && this.ctx.state !== "closed") void this.ctx.close();
    } catch (err) {
      log.debug("cancel teardown noop", err);
    }
    this.stream?.getTracks().forEach((track) => track.stop());
    this.stream = null;
    this.ctx = null;
    this.source = null;
    this.processor = null;
    this.chunks = [];
  }
}
