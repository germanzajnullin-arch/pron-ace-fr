import { RECORDING } from "@/config/constants";
import { createLogger } from "@/services/logger";

const log = createLogger("AudioRecorder");

/**
 * Thin, testable wrapper around MediaRecorder.
 * Single responsibility: capture microphone audio to a Blob.
 */
export class AudioRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private stream: MediaStream | null = null;
  private chunks: Blob[] = [];
  private startedAt = 0;

  static isSupported(): boolean {
    return (
      typeof window !== "undefined" &&
      typeof navigator !== "undefined" &&
      !!navigator.mediaDevices?.getUserMedia &&
      typeof window.MediaRecorder !== "undefined"
    );
  }

  private pickMimeType(): string | undefined {
    for (const type of RECORDING.MIME_PREFERENCES) {
      if (MediaRecorder.isTypeSupported(type)) return type;
    }
    return undefined;
  }

  async start(): Promise<void> {
    if (!AudioRecorder.isSupported()) {
      throw new Error("MediaRecorder is not supported in this browser.");
    }
    log.debug("requesting mic permission…");
    this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mimeType = this.pickMimeType();
    log.debug("mic granted, mime:", mimeType ?? "(default)");
    this.mediaRecorder = new MediaRecorder(
      this.stream,
      mimeType ? { mimeType } : undefined,
    );
    this.chunks = [];
    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) this.chunks.push(event.data);
    };
    this.mediaRecorder.start();
    this.startedAt = performance.now();
    log.info("recording started");
  }

  async stop(): Promise<{ blob: Blob | null; durationMs: number }> {
    const recorder = this.mediaRecorder;
    if (!recorder) return { blob: null, durationMs: 0 };
    const durationMs = Math.round(performance.now() - this.startedAt);

    const stopped = new Promise<Blob>((resolve) => {
      recorder.onstop = () => {
        const type = recorder.mimeType || "audio/webm";
        const blob = new Blob(this.chunks, { type });
        log.debug("finalized blob", { bytes: blob.size, type });
        resolve(blob);
      };
    });

    if (recorder.state !== "inactive") recorder.stop();
    const blob = await stopped;
    this.cleanup();
    log.info("recording stopped", { durationMs });
    return { blob, durationMs };
  }

  cancel(): void {
    if (this.mediaRecorder && this.mediaRecorder.state !== "inactive") {
      log.debug("cancelling recording");
      this.mediaRecorder.stop();
    }
    this.cleanup();
  }

  private cleanup(): void {
    this.stream?.getTracks().forEach((track) => track.stop());
    this.stream = null;
    this.mediaRecorder = null;
    this.chunks = [];
  }
}
