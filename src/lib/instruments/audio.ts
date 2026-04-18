// Shared AudioContext + small synth helpers used by all voices.

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

export function envGain(ctx: AudioContext, attack: number, decay: number, peak = 1): GainNode {
  const g = ctx.createGain();
  const t = ctx.currentTime;
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(peak, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
  return g;
}

export function noiseBuffer(ctx: AudioContext, dur = 0.5): AudioBuffer {
  const buf = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return buf;
}

export type Voice = (ctx: AudioContext, out: AudioNode, freq?: number) => void;
