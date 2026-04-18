// Public surface for the instrument system.
// Re-exports types, catalog, audio helpers, and provides playInstrument().

export type { InstrumentId, InstrumentMeta, Origin } from "./types";
export { NOTE_FREQS } from "./types";
export { INSTRUMENTS, PITCHED, GENRES, type Genre } from "./catalog";
export { getAudio, getRecorderStream } from "./audio";

import { NOTE_FREQS, type InstrumentId } from "./types";
import { getAudio } from "./audio";
import { VOICES } from "./voices";

export function playInstrument(id: InstrumentId, note?: string) {
  const { ctx, master } = getAudio();
  const voice = VOICES[id];
  if (!voice) return;
  const freq = note ? NOTE_FREQS[note] : undefined;
  voice(ctx, master, freq);
}
