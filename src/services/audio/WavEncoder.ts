/**
 * WAV encoder — takes Float32 PCM chunks captured at the AudioContext sample
 * rate and produces a standard 16-bit mono WAV at a target sample rate
 * (default 16 kHz, the sweet spot for speech-to-text APIs).
 *
 * Pure and browser-agnostic (only touches `DataView`/`ArrayBuffer`), so it
 * can be reused for streaming windows or one-shot encodes.
 */

const TARGET_SAMPLE_RATE = 16_000;

const concatFloat32 = (chunks: readonly Float32Array[]): Float32Array => {
  const total = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const out = new Float32Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.length;
  }
  return out;
};

/**
 * Linear-interpolation downsample. Enough fidelity for STT while keeping the
 * encoder tiny — a proper anti-aliasing filter would need a DSP dependency
 * and STT models handle a small amount of aliasing gracefully.
 */
const resample = (
  input: Float32Array,
  inputRate: number,
  outputRate: number,
): Float32Array => {
  if (inputRate === outputRate) return input;
  const ratio = inputRate / outputRate;
  const outLength = Math.floor(input.length / ratio);
  const output = new Float32Array(outLength);
  for (let i = 0; i < outLength; i += 1) {
    const src = i * ratio;
    const idx = Math.floor(src);
    const frac = src - idx;
    const a = input[idx] ?? 0;
    const b = input[idx + 1] ?? a;
    output[i] = a + (b - a) * frac;
  }
  return output;
};

const floatToPcm16 = (samples: Float32Array): Int16Array => {
  const out = new Int16Array(samples.length);
  for (let i = 0; i < samples.length; i += 1) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    out[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return out;
};

const writeString = (view: DataView, offset: number, value: string): void => {
  for (let i = 0; i < value.length; i += 1) {
    view.setUint8(offset + i, value.charCodeAt(i));
  }
};

/**
 * Encode Float32 PCM chunks into a fully-formed 16-bit mono WAV Blob.
 * Returns null if the recording is silent / empty.
 */
export const encodeWav = (
  chunks: readonly Float32Array[],
  inputSampleRate: number,
  targetSampleRate: number = TARGET_SAMPLE_RATE,
): Blob | null => {
  const merged = concatFloat32(chunks);
  if (merged.length < inputSampleRate * 0.15) return null; // < 150ms → treat as empty

  const resampled = resample(merged, inputSampleRate, targetSampleRate);
  const pcm = floatToPcm16(resampled);

  const byteRate = targetSampleRate * 2; // mono, 16-bit
  const dataSize = pcm.byteLength;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  writeString(view, 0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeString(view, 8, "WAVE");
  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true); // fmt chunk size
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // channels: mono
  view.setUint32(24, targetSampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, 2, true); // block align
  view.setUint16(34, 16, true); // bits per sample
  writeString(view, 36, "data");
  view.setUint32(40, dataSize, true);

  new Int16Array(buffer, 44).set(pcm);
  return new Blob([buffer], { type: "audio/wav" });
};

export const WAV_TARGET_SAMPLE_RATE = TARGET_SAMPLE_RATE;
