// Synth voices for every instrument. All voices use only Web Audio primitives.

import type { InstrumentId } from "./types";
import { envGain, noiseBuffer, type Voice } from "./audio";

// Helper: pluck-like body using filtered noise burst → resonant filter.
function pluck(ctx: AudioContext, out: AudioNode, freq: number, decay = 0.5, q = 12) {
  const noise = ctx.createBufferSource();
  noise.buffer = noiseBuffer(ctx, 0.05);
  const bp = ctx.createBiquadFilter();
  bp.type = "bandpass"; bp.frequency.value = freq; bp.Q.value = q;
  const g = envGain(ctx, 0.001, decay, 0.4);
  noise.connect(bp).connect(g).connect(out);
  const t = ctx.currentTime;
  noise.start(); noise.stop(t + 0.05);

  // Add a resonating sine for the pitched body
  const osc = ctx.createOscillator();
  osc.type = "triangle"; osc.frequency.value = freq;
  const og = envGain(ctx, 0.005, decay * 0.9, 0.3);
  osc.connect(og).connect(out);
  osc.start(); osc.stop(t + decay + 0.05);
}

// Helper: tonal drum body (sine that pitches down).
function drumBody(ctx: AudioContext, out: AudioNode, startHz: number, endHz: number, decay = 0.3, peak = 0.8) {
  const osc = ctx.createOscillator();
  osc.type = "sine";
  const t = ctx.currentTime;
  osc.frequency.setValueAtTime(startHz, t);
  osc.frequency.exponentialRampToValueAtTime(Math.max(20, endHz), t + decay * 0.6);
  const g = envGain(ctx, 0.001, decay, peak);
  osc.connect(g).connect(out);
  osc.start(); osc.stop(t + decay + 0.05);
}

// Helper: noise burst with band/highpass.
function noiseHit(
  ctx: AudioContext,
  out: AudioNode,
  opts: { dur?: number; type?: BiquadFilterType; freq?: number; q?: number; peak?: number; decay?: number },
) {
  const noise = ctx.createBufferSource();
  noise.buffer = noiseBuffer(ctx, opts.dur ?? 0.2);
  const f = ctx.createBiquadFilter();
  f.type = opts.type ?? "bandpass";
  f.frequency.value = opts.freq ?? 4000;
  if (opts.q) f.Q.value = opts.q;
  const g = envGain(ctx, 0.001, opts.decay ?? 0.15, opts.peak ?? 0.5);
  noise.connect(f).connect(g).connect(out);
  noise.start(); noise.stop(ctx.currentTime + (opts.dur ?? 0.2));
}

export const VOICES: Record<InstrumentId, Voice> = {
  // ─── Brazil ──────────────────────────────────────────────────────────────
  surdo: (ctx, out) => drumBody(ctx, out, 110, 45, 0.45, 1.0),
  repinique: (ctx, out) => {
    drumBody(ctx, out, 420, 180, 0.18, 0.7);
    noiseHit(ctx, out, { dur: 0.1, type: "highpass", freq: 2000, peak: 0.4, decay: 0.08 });
  },
  caixa: (ctx, out) => noiseHit(ctx, out, { type: "highpass", freq: 1500, peak: 0.6, decay: 0.12 }),
  tamborim: (ctx, out, freq) => {
    const f = freq ?? 900;
    const osc = ctx.createOscillator();
    osc.type = "square";
    const t = ctx.currentTime;
    osc.frequency.setValueAtTime(f, t);
    osc.frequency.exponentialRampToValueAtTime(f * 0.55, t + 0.04);
    const g = envGain(ctx, 0.001, 0.06, 0.5);
    osc.connect(g).connect(out);
    osc.start(); osc.stop(t + 0.1);
  },
  agogo: (ctx, out, freq) => {
    const f = freq ?? (Math.random() > 0.5 ? 880 : 660);
    const o1 = ctx.createOscillator(); o1.type = "sine"; o1.frequency.value = f;
    const o2 = ctx.createOscillator(); o2.type = "sine"; o2.frequency.value = f * 2.01;
    const g1 = envGain(ctx, 0.001, 0.35, 0.45);
    const g2 = envGain(ctx, 0.001, 0.2, 0.2);
    o1.connect(g1).connect(out); o2.connect(g2).connect(out);
    const t = ctx.currentTime;
    o1.start(); o2.start(); o1.stop(t + 0.4); o2.stop(t + 0.3);
  },
  pandeiro: (ctx, out) => {
    noiseHit(ctx, out, { type: "bandpass", freq: 6000, q: 0.5, decay: 0.18, peak: 0.5 });
    drumBody(ctx, out, 200, 120, 0.15, 0.3);
  },
  cuica: (ctx, out, freq) => {
    const base = freq ?? 300;
    const osc = ctx.createOscillator(); osc.type = "sawtooth";
    const t = ctx.currentTime;
    osc.frequency.setValueAtTime(base, t);
    osc.frequency.linearRampToValueAtTime(base * 3, t + 0.12);
    osc.frequency.linearRampToValueAtTime(base * 1.33, t + 0.25);
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass"; bp.frequency.value = base * 4; bp.Q.value = 6;
    const g = envGain(ctx, 0.005, 0.28, 0.4);
    osc.connect(bp).connect(g).connect(out);
    osc.start(); osc.stop(t + 0.35);
  },
  berimbau: (ctx, out, freq) => {
    const f = (freq ?? 220) + Math.random() * 6;
    const t = ctx.currentTime;
    const o1 = ctx.createOscillator(); o1.type = "triangle";
    o1.frequency.setValueAtTime(f, t);
    o1.frequency.exponentialRampToValueAtTime(f * 0.9, t + 0.4);
    const g1 = envGain(ctx, 0.002, 0.5, 0.55);
    const o2 = ctx.createOscillator(); o2.type = "square"; o2.frequency.value = f * 3;
    const g2 = envGain(ctx, 0.001, 0.15, 0.1);
    o1.connect(g1).connect(out); o2.connect(g2).connect(out);
    o1.start(); o2.start(); o1.stop(t + 0.55); o2.stop(t + 0.2);
  },

  // ─── Caribbean ───────────────────────────────────────────────────────────
  conga: (ctx, out, freq) => drumBody(ctx, out, freq ?? 220, (freq ?? 220) * 0.64, 0.25, 0.8),
  bongo: (ctx, out, freq) => drumBody(ctx, out, freq ?? 380, (freq ?? 380) * 0.68, 0.18, 0.7),
  timbales: (ctx, out, freq) => {
    drumBody(ctx, out, freq ?? 330, (freq ?? 330) * 0.55, 0.2, 0.6);
    noiseHit(ctx, out, { dur: 0.08, type: "highpass", freq: 3000, peak: 0.4, decay: 0.06 });
  },
  steelpan: (ctx, out, freq) => {
    const defaults = [523.25, 587.33, 659.25, 783.99, 880, 1046.5];
    const f = freq ?? defaults[Math.floor(Math.random() * defaults.length)];
    const t = ctx.currentTime;
    [1, 2.76, 5.4].forEach((mult, i) => {
      const osc = ctx.createOscillator(); osc.type = "sine";
      osc.frequency.value = f * mult;
      const g = envGain(ctx, 0.002, 0.7 - i * 0.15, 0.4 / (i + 1));
      osc.connect(g).connect(out);
      osc.start(); osc.stop(t + 0.8);
    });
  },

  // ─── Latin ───────────────────────────────────────────────────────────────
  clave: (ctx, out) => {
    const osc = ctx.createOscillator(); osc.type = "sine"; osc.frequency.value = 2500;
    const g = envGain(ctx, 0.001, 0.05, 0.6);
    osc.connect(g).connect(out);
    const t = ctx.currentTime; osc.start(); osc.stop(t + 0.08);
  },
  cowbell: (ctx, out) => {
    const t = ctx.currentTime;
    [800, 540].forEach((f) => {
      const osc = ctx.createOscillator(); osc.type = "square"; osc.frequency.value = f;
      const g = envGain(ctx, 0.001, 0.18, 0.25);
      const bp = ctx.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = f; bp.Q.value = 4;
      osc.connect(bp).connect(g).connect(out);
      osc.start(); osc.stop(t + 0.22);
    });
  },
  guiro: (ctx, out) => {
    const t = ctx.currentTime;
    for (let i = 0; i < 6; i++) {
      const noise = ctx.createBufferSource();
      noise.buffer = noiseBuffer(ctx, 0.03);
      const hp = ctx.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 2500;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, t + i * 0.04);
      g.gain.linearRampToValueAtTime(0.3, t + i * 0.04 + 0.005);
      g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.04 + 0.03);
      noise.connect(hp).connect(g).connect(out);
      noise.start(t + i * 0.04); noise.stop(t + i * 0.04 + 0.04);
    }
  },
  maracas: (ctx, out) => noiseHit(ctx, out, { dur: 0.1, type: "highpass", freq: 5000, peak: 0.45, decay: 0.08 }),
  cajon: (ctx, out) => {
    drumBody(ctx, out, 90, 55, 0.25, 0.9);
    noiseHit(ctx, out, { dur: 0.05, type: "highpass", freq: 4000, peak: 0.3, decay: 0.04 });
  },
  charango: (ctx, out, freq) => pluck(ctx, out, freq ?? 392, 0.6, 14),

  // ─── Africa ──────────────────────────────────────────────────────────────
  djembe: (ctx, out) => {
    drumBody(ctx, out, 180, 80, 0.3, 0.85);
    noiseHit(ctx, out, { dur: 0.06, type: "highpass", freq: 2500, peak: 0.3, decay: 0.05 });
  },
  talkingdrum: (ctx, out, freq) => {
    const f = freq ?? 200;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator(); osc.type = "sine";
    osc.frequency.setValueAtTime(f * 1.6, t);
    osc.frequency.exponentialRampToValueAtTime(f * 0.7, t + 0.25);
    const g = envGain(ctx, 0.002, 0.3, 0.7);
    osc.connect(g).connect(out);
    osc.start(); osc.stop(t + 0.35);
  },
  kalimba: (ctx, out, freq) => {
    const f = freq ?? 523;
    const t = ctx.currentTime;
    [1, 2.7, 5.1].forEach((m, i) => {
      const o = ctx.createOscillator(); o.type = "sine"; o.frequency.value = f * m;
      const g = envGain(ctx, 0.001, 0.6 - i * 0.15, 0.35 / (i + 1));
      o.connect(g).connect(out);
      o.start(); o.stop(t + 0.7);
    });
  },
  udu: (ctx, out) => {
    drumBody(ctx, out, 160, 80, 0.5, 0.7);
  },
  shekere: (ctx, out) => {
    noiseHit(ctx, out, { dur: 0.18, type: "bandpass", freq: 3500, q: 1.5, peak: 0.4, decay: 0.16 });
  },
  balafon: (ctx, out, freq) => {
    const f = freq ?? 523;
    const t = ctx.currentTime;
    [1, 4.0].forEach((m, i) => {
      const o = ctx.createOscillator(); o.type = "sine"; o.frequency.value = f * m;
      const g = envGain(ctx, 0.001, 0.4 - i * 0.15, 0.4 / (i + 1));
      o.connect(g).connect(out);
      o.start(); o.stop(t + 0.5);
    });
  },
  mbira: (ctx, out, freq) => {
    const f = freq ?? 440;
    const t = ctx.currentTime;
    const o = ctx.createOscillator(); o.type = "triangle"; o.frequency.value = f;
    const g = envGain(ctx, 0.001, 0.45, 0.4);
    // buzz partial
    const buzz = ctx.createOscillator(); buzz.type = "square"; buzz.frequency.value = f * 5.3;
    const bg = envGain(ctx, 0.001, 0.2, 0.08);
    o.connect(g).connect(out);
    buzz.connect(bg).connect(out);
    o.start(); buzz.start();
    o.stop(t + 0.5); buzz.stop(t + 0.25);
  },
  dundun: (ctx, out) => drumBody(ctx, out, 95, 40, 0.5, 1.0),

  // ─── Middle East ─────────────────────────────────────────────────────────
  darbuka: (ctx, out) => {
    drumBody(ctx, out, 220, 110, 0.18, 0.75);
    noiseHit(ctx, out, { dur: 0.04, type: "highpass", freq: 3500, peak: 0.35, decay: 0.04 });
  },
  riq: (ctx, out) => {
    drumBody(ctx, out, 260, 140, 0.12, 0.55);
    noiseHit(ctx, out, { dur: 0.18, type: "bandpass", freq: 7000, q: 2, peak: 0.3, decay: 0.16 });
  },
  frame_drum: (ctx, out) => drumBody(ctx, out, 130, 60, 0.4, 0.85),
  oud: (ctx, out, freq) => pluck(ctx, out, freq ?? 220, 0.7, 10),
  qanun: (ctx, out, freq) => pluck(ctx, out, freq ?? 392, 0.55, 18),

  // ─── India ───────────────────────────────────────────────────────────────
  tabla_dha: (ctx, out) => drumBody(ctx, out, 150, 70, 0.35, 0.9),
  tabla_na: (ctx, out) => {
    const t = ctx.currentTime;
    const o = ctx.createOscillator(); o.type = "sine"; o.frequency.value = 880;
    const g = envGain(ctx, 0.001, 0.18, 0.55);
    o.connect(g).connect(out);
    o.start(); o.stop(t + 0.22);
    noiseHit(ctx, out, { dur: 0.05, type: "highpass", freq: 4000, peak: 0.3, decay: 0.04 });
  },
  mridangam: (ctx, out) => drumBody(ctx, out, 200, 90, 0.3, 0.85),
  sitar: (ctx, out, freq) => {
    const f = freq ?? 220;
    const t = ctx.currentTime;
    const o = ctx.createOscillator(); o.type = "sawtooth"; o.frequency.value = f;
    const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 2000; lp.Q.value = 8;
    const g = envGain(ctx, 0.005, 0.9, 0.35);
    // sympathetic drone
    const drone = ctx.createOscillator(); drone.type = "sine"; drone.frequency.value = f * 2;
    const dg = envGain(ctx, 0.005, 0.6, 0.1);
    o.connect(lp).connect(g).connect(out);
    drone.connect(dg).connect(out);
    o.start(); drone.start(); o.stop(t + 1.0); drone.stop(t + 0.7);
  },
  tanpura: (ctx, out, freq) => {
    const f = freq ?? 130;
    const t = ctx.currentTime;
    [1, 2, 3].forEach((m, i) => {
      const o = ctx.createOscillator(); o.type = "sine"; o.frequency.value = f * m;
      const g = envGain(ctx, 0.05, 1.4 - i * 0.2, 0.25 / (i + 1));
      o.connect(g).connect(out);
      o.start(); o.stop(t + 1.6);
    });
  },
  ghatam: (ctx, out) => drumBody(ctx, out, 280, 120, 0.22, 0.7),

  // ─── East Asia ───────────────────────────────────────────────────────────
  taiko: (ctx, out) => drumBody(ctx, out, 80, 35, 0.6, 1.0),
  koto: (ctx, out, freq) => pluck(ctx, out, freq ?? 392, 0.8, 16),
  shamisen: (ctx, out, freq) => {
    pluck(ctx, out, freq ?? 220, 0.5, 14);
    noiseHit(ctx, out, { dur: 0.04, type: "highpass", freq: 4000, peak: 0.3, decay: 0.04 });
  },
  guzheng: (ctx, out, freq) => pluck(ctx, out, freq ?? 392, 0.9, 20),
  wood_block_china: (ctx, out) => {
    const o = ctx.createOscillator(); o.type = "square"; o.frequency.value = 1200;
    const g = envGain(ctx, 0.001, 0.06, 0.5);
    o.connect(g).connect(out);
    const t = ctx.currentTime; o.start(); o.stop(t + 0.08);
  },

  // ─── Southeast Asia ──────────────────────────────────────────────────────
  gamelan_gong: (ctx, out, freq) => {
    const f = freq ?? 130;
    const t = ctx.currentTime;
    [1, 1.5, 2.7, 4.1].forEach((m, i) => {
      const o = ctx.createOscillator(); o.type = "sine"; o.frequency.value = f * m;
      const g = envGain(ctx, 0.005, 1.4 - i * 0.2, 0.4 / (i + 1));
      o.connect(g).connect(out);
      o.start(); o.stop(t + 1.6);
    });
  },
  gamelan_bonang: (ctx, out, freq) => {
    const f = freq ?? 523;
    const t = ctx.currentTime;
    [1, 2.4, 3.9].forEach((m, i) => {
      const o = ctx.createOscillator(); o.type = "sine"; o.frequency.value = f * m;
      const g = envGain(ctx, 0.002, 0.6 - i * 0.15, 0.4 / (i + 1));
      o.connect(g).connect(out);
      o.start(); o.stop(t + 0.7);
    });
  },
  angklung: (ctx, out, freq) => {
    const f = freq ?? 523;
    const t = ctx.currentTime;
    // Two slightly detuned oscillators + light noise = bamboo shake
    [1, 1.005].forEach((m) => {
      const o = ctx.createOscillator(); o.type = "triangle"; o.frequency.value = f * m;
      const g = envGain(ctx, 0.005, 0.35, 0.25);
      o.connect(g).connect(out);
      o.start(); o.stop(t + 0.45);
    });
    noiseHit(ctx, out, { dur: 0.18, type: "bandpass", freq: f * 2, q: 6, peak: 0.15, decay: 0.16 });
  },

  // ─── Europe ──────────────────────────────────────────────────────────────
  bodhran: (ctx, out) => drumBody(ctx, out, 140, 70, 0.35, 0.85),
  tin_whistle: (ctx, out, freq) => {
    const f = freq ?? 587;
    const t = ctx.currentTime;
    const o = ctx.createOscillator(); o.type = "triangle"; o.frequency.value = f;
    const g = envGain(ctx, 0.02, 0.55, 0.4);
    // breath noise
    const noise = ctx.createBufferSource(); noise.buffer = noiseBuffer(ctx, 0.5);
    const hp = ctx.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 4000;
    const ng = envGain(ctx, 0.02, 0.5, 0.05);
    o.connect(g).connect(out);
    noise.connect(hp).connect(ng).connect(out);
    o.start(); noise.start();
    o.stop(t + 0.6); noise.stop(t + 0.55);
  },
  accordion: (ctx, out, freq) => {
    const f = freq ?? 261;
    const t = ctx.currentTime;
    [1, 1.005, 2, 3].forEach((m, i) => {
      const o = ctx.createOscillator(); o.type = "sawtooth"; o.frequency.value = f * m;
      const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 1800;
      const g = envGain(ctx, 0.03, 0.5 - i * 0.05, 0.18 / (i + 1));
      o.connect(lp).connect(g).connect(out);
      o.start(); o.stop(t + 0.6);
    });
  },
  hang_drum: (ctx, out, freq) => {
    const f = freq ?? 392;
    const t = ctx.currentTime;
    [1, 2, 3].forEach((m, i) => {
      const o = ctx.createOscillator(); o.type = "sine"; o.frequency.value = f * m;
      const g = envGain(ctx, 0.003, 1.0 - i * 0.25, 0.4 / (i + 1));
      o.connect(g).connect(out);
      o.start(); o.stop(t + 1.1);
    });
  },

  // ─── Andes ───────────────────────────────────────────────────────────────
  quena: (ctx, out, freq) => {
    const f = freq ?? 523;
    const t = ctx.currentTime;
    const o = ctx.createOscillator(); o.type = "sine"; o.frequency.value = f;
    const g = envGain(ctx, 0.04, 0.55, 0.35);
    const noise = ctx.createBufferSource(); noise.buffer = noiseBuffer(ctx, 0.5);
    const hp = ctx.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 5000;
    const ng = envGain(ctx, 0.03, 0.5, 0.06);
    o.connect(g).connect(out);
    noise.connect(hp).connect(ng).connect(out);
    o.start(); noise.start();
    o.stop(t + 0.6); noise.stop(t + 0.55);
  },
  zampona: (ctx, out, freq) => {
    const f = freq ?? 587;
    const t = ctx.currentTime;
    const o = ctx.createOscillator(); o.type = "triangle"; o.frequency.value = f;
    const g = envGain(ctx, 0.02, 0.4, 0.35);
    const noise = ctx.createBufferSource(); noise.buffer = noiseBuffer(ctx, 0.4);
    const bp = ctx.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = f * 2; bp.Q.value = 1;
    const ng = envGain(ctx, 0.015, 0.35, 0.12);
    o.connect(g).connect(out);
    noise.connect(bp).connect(ng).connect(out);
    o.start(); noise.start();
    o.stop(t + 0.45); noise.stop(t + 0.4);
  },
  bombo: (ctx, out) => drumBody(ctx, out, 75, 35, 0.55, 1.0),

  // ─── North America ───────────────────────────────────────────────────────
  powwow_drum: (ctx, out) => drumBody(ctx, out, 95, 45, 0.55, 1.0),
  rattle: (ctx, out) => noiseHit(ctx, out, { dur: 0.15, type: "bandpass", freq: 4500, q: 1.2, peak: 0.4, decay: 0.13 }),

  // ─── Oceania ─────────────────────────────────────────────────────────────
  didgeridoo: (ctx, out) => {
    const t = ctx.currentTime;
    const o = ctx.createOscillator(); o.type = "sawtooth"; o.frequency.value = 70;
    const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 600;
    // wobble via LFO on filter
    const lfo = ctx.createOscillator(); lfo.frequency.value = 6;
    const lfoGain = ctx.createGain(); lfoGain.gain.value = 200;
    lfo.connect(lfoGain).connect(lp.frequency);
    const g = envGain(ctx, 0.05, 0.9, 0.55);
    o.connect(lp).connect(g).connect(out);
    o.start(); lfo.start();
    o.stop(t + 1.0); lfo.stop(t + 1.0);
  },
  log_drum: (ctx, out) => {
    const o = ctx.createOscillator(); o.type = "square"; o.frequency.value = 320;
    const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 800;
    const g = envGain(ctx, 0.001, 0.18, 0.5);
    o.connect(lp).connect(g).connect(out);
    const t = ctx.currentTime; o.start(); o.stop(t + 0.22);
  },

  // ─── Universal ───────────────────────────────────────────────────────────
  shaker: (ctx, out) => noiseHit(ctx, out, { dur: 0.12, type: "highpass", freq: 6000, peak: 0.35, decay: 0.1 }),
  triangle: (ctx, out) => {
    const t = ctx.currentTime;
    [3200, 4800, 6300].forEach((f, i) => {
      const o = ctx.createOscillator(); o.type = "sine"; o.frequency.value = f;
      const g = envGain(ctx, 0.001, 1.2 - i * 0.3, 0.18 / (i + 1));
      o.connect(g).connect(out);
      o.start(); o.stop(t + 1.3);
    });
  },
  wood_block: (ctx, out) => {
    const o = ctx.createOscillator(); o.type = "square"; o.frequency.value = 900;
    const g = envGain(ctx, 0.001, 0.07, 0.5);
    o.connect(g).connect(out);
    const t = ctx.currentTime; o.start(); o.stop(t + 0.09);
  },
  tambourine: (ctx, out) => {
    noiseHit(ctx, out, { dur: 0.2, type: "bandpass", freq: 8000, q: 1.5, peak: 0.4, decay: 0.18 });
  },
  rim_shot: (ctx, out) => {
    const o = ctx.createOscillator(); o.type = "square"; o.frequency.value = 1500;
    const g = envGain(ctx, 0.001, 0.05, 0.55);
    o.connect(g).connect(out);
    const t = ctx.currentTime; o.start(); o.stop(t + 0.07);
    noiseHit(ctx, out, { dur: 0.04, type: "highpass", freq: 5000, peak: 0.3, decay: 0.04 });
  },
};
