// Instrument synthesis engine — Web Audio API only, no samples.
// Each instrument is a function that schedules a sound on the shared AudioContext.

export type InstrumentId =
  | "surdo"
  | "repinique"
  | "caixa"
  | "tamborim"
  | "agogo"
  | "pandeiro"
  | "cuica"
  | "berimbau"
  | "conga"
  | "bongo"
  | "timbales"
  | "steelpan"
  | "clave"
  | "cowbell";

export type InstrumentMeta = {
  id: InstrumentId;
  name: string;
  origin: "Brazil" | "Caribbean" | "Latin";
  emoji: string;
  color: string; // css var
  hint: string;
};

// Note name → frequency (Hz). Covers a useful range for our pitched voices.
export const NOTE_FREQS: Record<string, number> = {
  C3: 130.81, D3: 146.83, E3: 164.81, F3: 174.61, G3: 196.0, A3: 220.0, B3: 246.94,
  C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.0, A4: 440.0, B4: 493.88,
  C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99, A5: 880.0, B5: 987.77,
  C6: 1046.5,
};

// Which instruments accept a note, and their available note palettes.
export const PITCHED: Partial<Record<InstrumentId, string[]>> = {
  steelpan: ["C4", "D4", "E4", "G4", "A4", "C5", "D5", "E5", "G5", "C6"],
  agogo:    ["E4", "G4", "A4", "C5", "E5", "G5"], // pairs: low + high (2.01x)
  berimbau: ["A2" in NOTE_FREQS ? "A2" : "A3", "C3" in NOTE_FREQS ? "C3" : "C4", "D3", "E3", "G3", "A3"].filter((n) => n in NOTE_FREQS),
  cuica:    ["C4", "D4", "E4", "G4", "A4", "C5"],
  conga:    ["A2" in NOTE_FREQS ? "A2" : "A3", "C3", "D3", "E3", "G3", "A3"].filter((n) => n in NOTE_FREQS),
  bongo:    ["E3", "G3", "A3", "C4", "E4", "G4"],
  timbales: ["C3", "D3", "E3", "G3", "A3", "C4"],
  tamborim: ["A4", "C5", "D5", "E5", "G5", "A5"],
};

export const INSTRUMENTS: InstrumentMeta[] = [
  { id: "surdo",     name: "Surdo",     origin: "Brazil",    emoji: "🥁", color: "var(--hibiscus)", hint: "Deep boom" },
  { id: "repinique", name: "Repinique", origin: "Brazil",    emoji: "🪘", color: "var(--coral)",    hint: "Sharp call" },
  { id: "caixa",     name: "Caixa",     origin: "Brazil",    emoji: "🪘", color: "var(--mango)",    hint: "Snare roll" },
  { id: "tamborim",  name: "Tamborim",  origin: "Brazil",    emoji: "🎯", color: "var(--coral)",    hint: "Tiny pop" },
  { id: "agogo",     name: "Agogô",     origin: "Brazil",    emoji: "🔔", color: "var(--mango)",    hint: "Two bells" },
  { id: "pandeiro",  name: "Pandeiro",  origin: "Brazil",    emoji: "🪘", color: "var(--palm)",     hint: "Tambourine" },
  { id: "cuica",     name: "Cuíca",     origin: "Brazil",    emoji: "🐒", color: "var(--accent)",   hint: "Squeak" },
  { id: "berimbau",  name: "Berimbau",  origin: "Brazil",    emoji: "🏹", color: "var(--palm)",     hint: "Twang" },
  { id: "conga",     name: "Conga",     origin: "Caribbean", emoji: "🪘", color: "var(--ocean)",    hint: "Hand drum" },
  { id: "bongo",     name: "Bongô",     origin: "Caribbean", emoji: "🪘", color: "var(--coral)",    hint: "High pair" },
  { id: "timbales",  name: "Timbales",  origin: "Caribbean", emoji: "🥁", color: "var(--mango)",    hint: "Metal shell" },
  { id: "steelpan",  name: "Steel Pan", origin: "Caribbean", emoji: "🎵", color: "var(--accent)",   hint: "Tropical pitch" },
  { id: "clave",     name: "Clave",     origin: "Latin",     emoji: "🪵", color: "var(--sand)",     hint: "Wood click" },
  { id: "cowbell",   name: "Cowbell",   origin: "Latin",     emoji: "🔔", color: "var(--mango)",    hint: "More cowbell" },
];

let ctx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let recorderDest: MediaStreamAudioDestinationNode | null = null;

export function getAudio(): { ctx: AudioContext; master: GainNode } {
  if (!ctx) {
    const AC = (window.AudioContext || (window as any).webkitAudioContext) as typeof AudioContext;
    ctx = new AC();
    masterGain = ctx.createGain();
    masterGain.gain.value = 0.8;
    masterGain.connect(ctx.destination);
  }
  if (ctx.state === "suspended") void ctx.resume();
  return { ctx, master: masterGain! };
}

export function getRecorderStream(): MediaStream {
  const { ctx, master } = getAudio();
  if (!recorderDest) {
    recorderDest = ctx.createMediaStreamDestination();
    master.connect(recorderDest);
  }
  return recorderDest.stream;
}

function envGain(ctx: AudioContext, attack: number, decay: number, peak = 1): GainNode {
  const g = ctx.createGain();
  const t = ctx.currentTime;
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(peak, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
  return g;
}

function noiseBuffer(ctx: AudioContext, dur = 0.5): AudioBuffer {
  const buf = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return buf;
}

type Voice = (ctx: AudioContext, out: AudioNode) => void;

const VOICES: Record<InstrumentId, Voice> = {
  surdo: (ctx, out) => {
    const osc = ctx.createOscillator();
    osc.type = "sine";
    const t = ctx.currentTime;
    osc.frequency.setValueAtTime(110, t);
    osc.frequency.exponentialRampToValueAtTime(45, t + 0.18);
    const g = envGain(ctx, 0.002, 0.45, 1.0);
    osc.connect(g).connect(out);
    osc.start();
    osc.stop(t + 0.5);
  },
  repinique: (ctx, out) => {
    const osc = ctx.createOscillator();
    osc.type = "triangle";
    const t = ctx.currentTime;
    osc.frequency.setValueAtTime(420, t);
    osc.frequency.exponentialRampToValueAtTime(180, t + 0.08);
    const g = envGain(ctx, 0.001, 0.15, 0.7);
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer(ctx, 0.1);
    const ng = envGain(ctx, 0.001, 0.08, 0.4);
    osc.connect(g).connect(out);
    noise.connect(ng).connect(out);
    osc.start(); osc.stop(t + 0.2); noise.start(); noise.stop(t + 0.1);
  },
  caixa: (ctx, out) => {
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer(ctx, 0.2);
    const hp = ctx.createBiquadFilter();
    hp.type = "highpass"; hp.frequency.value = 1500;
    const g = envGain(ctx, 0.001, 0.12, 0.6);
    noise.connect(hp).connect(g).connect(out);
    noise.start(); noise.stop(ctx.currentTime + 0.2);
  },
  tamborim: (ctx, out) => {
    const osc = ctx.createOscillator();
    osc.type = "square";
    const t = ctx.currentTime;
    osc.frequency.setValueAtTime(900, t);
    osc.frequency.exponentialRampToValueAtTime(500, t + 0.04);
    const g = envGain(ctx, 0.001, 0.06, 0.5);
    osc.connect(g).connect(out);
    osc.start(); osc.stop(t + 0.1);
  },
  agogo: (ctx, out) => {
    const freq = Math.random() > 0.5 ? 880 : 660;
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = freq;
    const osc2 = ctx.createOscillator();
    osc2.type = "sine";
    osc2.frequency.value = freq * 2.01;
    const g = envGain(ctx, 0.001, 0.35, 0.45);
    const g2 = envGain(ctx, 0.001, 0.2, 0.2);
    osc.connect(g).connect(out);
    osc2.connect(g2).connect(out);
    const t = ctx.currentTime;
    osc.start(); osc2.start();
    osc.stop(t + 0.4); osc2.stop(t + 0.3);
  },
  pandeiro: (ctx, out) => {
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer(ctx, 0.25);
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass"; bp.frequency.value = 6000; bp.Q.value = 0.5;
    const g = envGain(ctx, 0.001, 0.18, 0.5);
    noise.connect(bp).connect(g).connect(out);
    // body thump
    const osc = ctx.createOscillator();
    osc.type = "sine"; osc.frequency.value = 200;
    const og = envGain(ctx, 0.001, 0.1, 0.3);
    osc.connect(og).connect(out);
    const t = ctx.currentTime;
    noise.start(); noise.stop(t + 0.25); osc.start(); osc.stop(t + 0.15);
  },
  cuica: (ctx, out) => {
    const osc = ctx.createOscillator();
    osc.type = "sawtooth";
    const t = ctx.currentTime;
    osc.frequency.setValueAtTime(300, t);
    osc.frequency.linearRampToValueAtTime(900, t + 0.12);
    osc.frequency.linearRampToValueAtTime(400, t + 0.25);
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass"; bp.frequency.value = 1200; bp.Q.value = 6;
    const g = envGain(ctx, 0.005, 0.28, 0.4);
    osc.connect(bp).connect(g).connect(out);
    osc.start(); osc.stop(t + 0.35);
  },
  berimbau: (ctx, out) => {
    const osc = ctx.createOscillator();
    osc.type = "triangle";
    const t = ctx.currentTime;
    const f = 220 + Math.random() * 30;
    osc.frequency.setValueAtTime(f, t);
    osc.frequency.exponentialRampToValueAtTime(f * 0.9, t + 0.4);
    const g = envGain(ctx, 0.002, 0.5, 0.55);
    // metallic shimmer
    const osc2 = ctx.createOscillator();
    osc2.type = "square"; osc2.frequency.value = f * 3;
    const g2 = envGain(ctx, 0.001, 0.15, 0.1);
    osc.connect(g).connect(out);
    osc2.connect(g2).connect(out);
    osc.start(); osc.stop(t + 0.55); osc2.start(); osc2.stop(t + 0.2);
  },
  conga: (ctx, out) => {
    const osc = ctx.createOscillator();
    osc.type = "sine";
    const t = ctx.currentTime;
    osc.frequency.setValueAtTime(220, t);
    osc.frequency.exponentialRampToValueAtTime(140, t + 0.12);
    const g = envGain(ctx, 0.001, 0.25, 0.8);
    osc.connect(g).connect(out);
    osc.start(); osc.stop(t + 0.3);
  },
  bongo: (ctx, out) => {
    const osc = ctx.createOscillator();
    osc.type = "sine";
    const t = ctx.currentTime;
    osc.frequency.setValueAtTime(380, t);
    osc.frequency.exponentialRampToValueAtTime(260, t + 0.08);
    const g = envGain(ctx, 0.001, 0.18, 0.7);
    osc.connect(g).connect(out);
    osc.start(); osc.stop(t + 0.22);
  },
  timbales: (ctx, out) => {
    const osc = ctx.createOscillator();
    osc.type = "sine";
    const t = ctx.currentTime;
    osc.frequency.setValueAtTime(330, t);
    osc.frequency.exponentialRampToValueAtTime(180, t + 0.1);
    const g = envGain(ctx, 0.001, 0.2, 0.6);
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer(ctx, 0.08);
    const hp = ctx.createBiquadFilter();
    hp.type = "highpass"; hp.frequency.value = 3000;
    const ng = envGain(ctx, 0.001, 0.06, 0.4);
    osc.connect(g).connect(out);
    noise.connect(hp).connect(ng).connect(out);
    osc.start(); osc.stop(t + 0.25); noise.start(); noise.stop(t + 0.08);
  },
  steelpan: (ctx, out) => {
    const notes = [523.25, 587.33, 659.25, 783.99, 880, 1046.5];
    const f = notes[Math.floor(Math.random() * notes.length)];
    const t = ctx.currentTime;
    [1, 2.76, 5.4].forEach((mult, i) => {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = f * mult;
      const g = envGain(ctx, 0.002, 0.7 - i * 0.15, 0.4 / (i + 1));
      osc.connect(g).connect(out);
      osc.start(); osc.stop(t + 0.8);
    });
  },
  clave: (ctx, out) => {
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = 2500;
    const g = envGain(ctx, 0.001, 0.05, 0.6);
    osc.connect(g).connect(out);
    const t = ctx.currentTime;
    osc.start(); osc.stop(t + 0.08);
  },
  cowbell: (ctx, out) => {
    const t = ctx.currentTime;
    [800, 540].forEach((f) => {
      const osc = ctx.createOscillator();
      osc.type = "square";
      osc.frequency.value = f;
      const g = envGain(ctx, 0.001, 0.18, 0.25);
      const bp = ctx.createBiquadFilter();
      bp.type = "bandpass"; bp.frequency.value = f; bp.Q.value = 4;
      osc.connect(bp).connect(g).connect(out);
      osc.start(); osc.stop(t + 0.22);
    });
  },
};

export function playInstrument(id: InstrumentId) {
  const { ctx, master } = getAudio();
  const voice = VOICES[id];
  if (!voice) return;
  voice(ctx, master);
}
