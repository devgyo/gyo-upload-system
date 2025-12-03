let audioCtx;

const getAudioContext = () => {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    audioCtx = new AudioContext();
  }
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
};

const playTone = (type, frequency, duration, offset = 0) => {
  const ctx = getAudioContext();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  gain.gain.value = 0.1;
  osc.type = type;

  const startTime = ctx.currentTime + offset;
  osc.frequency.setValueAtTime(frequency, startTime);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(startTime);
  osc.stop(startTime + duration);
};

const playSweep = (type, startFreq, endFreq, duration) => {
  const ctx = getAudioContext();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  gain.gain.value = 0.1;
  osc.type = type;

  const startTime = ctx.currentTime;
  osc.frequency.setValueAtTime(startFreq, startTime);
  osc.frequency.linearRampToValueAtTime(endFreq, startTime + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(startTime);
  osc.stop(startTime + duration);
};

export const type = () => {
  const freq = 800 + Math.random() * 200;
  playTone('square', freq, 0.03);
};

export const success = () => {
  playTone('sine', 880, 0.1);
  playTone('sine', 1760, 0.2, 0.1);
};

export const close = () => {
  playSweep('triangle', 400, 100, 0.1);
};

export const alarm = () => {
  playTone('square', 100, 0.2);
  playTone('square', 100, 0.2, 0.3);
};

export const open = () => {
  playSweep('sawtooth', 200, 600, 0.15);
};

export default {
  type,
  success,
  close,
  alarm,
  open,
};
