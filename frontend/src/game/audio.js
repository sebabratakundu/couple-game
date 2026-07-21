/**
 * Procedural ambient audio using Web Audio API — no external assets, no CORS.
 * - Park: soft wind noise + gentle bird chirps + subtle acoustic pad
 * - Summit: warm sine-based piano pad in C major
 */

let ctx = null;
let masterGain = null;
let currentMode = null;
let activeNodes = [];

function ensureCtx() {
  if (ctx) return ctx;
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    ctx = new AudioCtx();
    masterGain = ctx.createGain();
    masterGain.gain.value = 0.32;
    masterGain.connect(ctx.destination);
  } catch (e) {
    ctx = null;
  }
  return ctx;
}

export function unlockAudio() {
  const c = ensureCtx();
  if (c && c.state === 'suspended') c.resume();
}

export function stopAll() {
  activeNodes.forEach((n) => {
    try { n.stop && n.stop(); } catch (e) {}
    try { n.disconnect && n.disconnect(); } catch (e) {}
  });
  activeNodes = [];
  currentMode = null;
}

export function playPark() {
  if (currentMode === 'park') return;
  const c = ensureCtx();
  if (!c) return;
  stopAll();
  currentMode = 'park';

  // Wind: filtered white noise
  const bufSize = 2 * c.sampleRate;
  const noiseBuf = c.createBuffer(1, bufSize, c.sampleRate);
  const data = noiseBuf.getChannelData(0);
  for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1) * 0.5;
  const noise = c.createBufferSource();
  noise.buffer = noiseBuf;
  noise.loop = true;
  const lp = c.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 400;
  lp.Q.value = 0.7;
  const noiseGain = c.createGain();
  noiseGain.gain.value = 0.15;
  noise.connect(lp);
  lp.connect(noiseGain);
  noiseGain.connect(masterGain);
  noise.start();
  activeNodes.push(noise, lp, noiseGain);

  // Warm pad (Cmaj chord — 3 detuned sines)
  const chord = [261.63, 329.63, 392.0]; // C E G
  chord.forEach((f, i) => {
    const o = c.createOscillator();
    o.type = 'sine';
    o.frequency.value = f;
    const g = c.createGain();
    g.gain.value = 0.045;
    // Slow LFO on gain for shimmer
    const lfo = c.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.15 + i * 0.05;
    const lfoGain = c.createGain();
    lfoGain.gain.value = 0.02;
    lfo.connect(lfoGain).connect(g.gain);
    o.connect(g);
    g.connect(masterGain);
    o.start();
    lfo.start();
    activeNodes.push(o, g, lfo, lfoGain);
  });

  // Bird chirps - random intervals
  scheduleBirds(c);
}

function scheduleBirds(c) {
  if (currentMode !== 'park') return;
  const bird = () => {
    if (currentMode !== 'park' || !c) return;
    const now = c.currentTime;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = 'sine';
    const baseFreq = 1600 + Math.random() * 1400;
    o.frequency.setValueAtTime(baseFreq, now);
    o.frequency.exponentialRampToValueAtTime(baseFreq * 1.4, now + 0.08);
    o.frequency.exponentialRampToValueAtTime(baseFreq * 0.9, now + 0.16);
    g.gain.setValueAtTime(0, now);
    g.gain.linearRampToValueAtTime(0.12, now + 0.02);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
    o.connect(g);
    g.connect(masterGain);
    o.start(now);
    o.stop(now + 0.25);
  };
  const trigger = () => {
    if (currentMode !== 'park') return;
    // 2-3 quick chirps
    bird();
    setTimeout(bird, 80 + Math.random() * 90);
    if (Math.random() < 0.5) setTimeout(bird, 200 + Math.random() * 200);
    // Schedule next batch
    setTimeout(trigger, 3000 + Math.random() * 5000);
  };
  setTimeout(trigger, 800);
}

export function playSummit() {
  if (currentMode === 'summit') return;
  const c = ensureCtx();
  if (!c) return;
  stopAll();
  currentMode = 'summit';

  // Piano pad using harmonic sines - warm and cinematic
  // Progression: Cmaj7 → Fmaj7 → Am → G, each held ~6s
  const chords = [
    [261.63, 329.63, 392.00, 493.88], // Cmaj7
    [174.61, 220.00, 261.63, 349.23], // Fmaj7
    [220.00, 261.63, 329.63, 415.30], // Am (add G# for color)
    [196.00, 246.94, 293.66, 392.00], // G
  ];
  let step = 0;
  const loop = () => {
    if (currentMode !== 'summit' || !c) return;
    const now = c.currentTime;
    const chord = chords[step % chords.length];
    chord.forEach((f, i) => {
      const o = c.createOscillator();
      const o2 = c.createOscillator(); // detune for richness
      const g = c.createGain();
      o.type = 'sine';
      o2.type = 'sine';
      o.frequency.value = f;
      o2.frequency.value = f * 1.005;
      // ADSR envelope for pad
      g.gain.setValueAtTime(0, now);
      g.gain.linearRampToValueAtTime(0.05, now + 0.9);
      g.gain.linearRampToValueAtTime(0.04, now + 5.2);
      g.gain.linearRampToValueAtTime(0, now + 6.4);
      o.connect(g);
      o2.connect(g);
      g.connect(masterGain);
      o.start(now);
      o2.start(now);
      o.stop(now + 6.5);
      o2.stop(now + 6.5);
    });
    step++;
    setTimeout(loop, 5800);
  };
  loop();

  // Distant wind at low volume
  const bufSize = 2 * c.sampleRate;
  const noiseBuf = c.createBuffer(1, bufSize, c.sampleRate);
  const data = noiseBuf.getChannelData(0);
  for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1) * 0.3;
  const noise = c.createBufferSource();
  noise.buffer = noiseBuf;
  noise.loop = true;
  const lp = c.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 300;
  const g = c.createGain();
  g.gain.value = 0.08;
  noise.connect(lp);
  lp.connect(g);
  g.connect(masterGain);
  noise.start();
  activeNodes.push(noise, lp, g);
}

export function playChime() {
  const c = ensureCtx();
  if (!c) return;
  const now = c.currentTime;
  [880, 1108, 1318].forEach((f, i) => {
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = 'sine';
    o.frequency.value = f;
    g.gain.setValueAtTime(0, now + i * 0.06);
    g.gain.linearRampToValueAtTime(0.18, now + i * 0.06 + 0.02);
    g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.06 + 0.7);
    o.connect(g);
    g.connect(masterGain);
    o.start(now + i * 0.06);
    o.stop(now + i * 0.06 + 0.75);
  });
}

export function playClick() {
  const c = ensureCtx();
  if (!c) return;
  const now = c.currentTime;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = 'square';
  o.frequency.value = 660;
  g.gain.setValueAtTime(0.12, now);
  g.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
  o.connect(g);
  g.connect(masterGain);
  o.start(now);
  o.stop(now + 0.1);
}

export function setMuted(muted) {
  if (!masterGain) return;
  masterGain.gain.value = muted ? 0 : 0.32;
}

export function isSupported() {
  return !!(window.AudioContext || window.webkitAudioContext);
}
