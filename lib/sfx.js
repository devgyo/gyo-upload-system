'use client';

let audioCtx;

const getAudioContext = () => {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    audioCtx = new AudioContext();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
};

const playTone = (ctx, { type = 'sine', startFreq = 440, endFreq = startFreq, duration = 0.1, offset = 0 }) => {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(startFreq, ctx.currentTime + offset);
  if (endFreq !== startFreq) {
    osc.frequency.linearRampToValueAtTime(endFreq, ctx.currentTime + offset + duration);
  }
  gain.gain.value = 0.1;
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(ctx.currentTime + offset);
  osc.stop(ctx.currentTime + offset + duration);
};

export function playSuccess() {
  const ctx = getAudioContext();
  if (!ctx) return;
  playTone(ctx, { type: 'sine', startFreq: 880, duration: 0.08, offset: 0 });
  playTone(ctx, { type: 'sine', startFreq: 1320, duration: 0.12, offset: 0.06 });
}

export function playError() {
  const ctx = getAudioContext();
  if (!ctx) return;
  playTone(ctx, { type: 'sawtooth', startFreq: 220, endFreq: 180, duration: 0.25, offset: 0 });
}
