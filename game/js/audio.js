// audio.js — ambient tracks and one-shot sound moments tied to page/state events

const AUDIO_DIR = '../assets/audio/';

let ambientTrack = null;
let ambientGain = null;

// Cantopop — separate from ambient; persists across page navigation
let cantopopSource = null;
let cantopopGain   = null;

const ctx = new (window.AudioContext || window.webkitAudioContext)();

// Page → ambient track filename. null = silence.
const AMBIENT_MAP = {
  'peculiar-mississippi': null, // TODO: assign track
  'player-page': null,          // TODO: the scary one
};

// Corruption state → ambient track overlay
const CORRUPTION_AMBIENT = {
  touched: null,
  degraded: null,
  corrupted: null,
};

// One-shot sound effects
const SFX = {
  // 'page-turn': 'page-turn.mp3',
  // TODO: add sfx as assets are ready
};

export function onPageLoad(pageId, corruptionState) {
  const track = AMBIENT_MAP[pageId] ?? null;
  crossfadeAmbient(track);

  if (corruptionState !== 'clean') {
    const overlay = CORRUPTION_AMBIENT[corruptionState];
    if (overlay) playSfx(overlay);
  }
}

export function playSfx(name) {
  const file = SFX[name];
  if (!file) return;
  const audio = new Audio(AUDIO_DIR + file);
  audio.play().catch(() => {}); // autoplay may be blocked; silently fail
}

async function crossfadeAmbient(trackFile) {
  if (ambientTrack) {
    fadeOut(ambientGain, () => {
      ambientTrack.stop();
      ambientTrack = null;
    });
  }

  if (!trackFile) return;

  const response = await fetch(AUDIO_DIR + trackFile);
  const buffer = await response.arrayBuffer();
  const decoded = await ctx.decodeAudioData(buffer);

  const source = ctx.createBufferSource();
  source.buffer = decoded;
  source.loop = true;

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(0.6, ctx.currentTime + 2);

  source.connect(gain).connect(ctx.destination);
  source.start();

  ambientTrack = source;
  ambientGain = gain;
}

function fadeOut(gainNode, onDone) {
  if (!gainNode) return onDone?.();
  gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.5);
  setTimeout(onDone, 1500);
}

// ── cantopop ─────────────────────────────────────────────────────────────────
// Called when the player clicks the cassette on Andy's page.
// File: assets/audio/cantopop.mp3 — place the track there.
// Fails silently if the file is missing.

export async function playCantopop() {
  if (cantopopSource) return; // already playing
  try {
    const res = await fetch(AUDIO_DIR + 'cantopop.mp3');
    if (!res.ok) return;
    const buffer  = await res.arrayBuffer();
    const decoded = await ctx.decodeAudioData(buffer);

    const source = ctx.createBufferSource();
    source.buffer = decoded;
    source.loop   = true;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.55, ctx.currentTime + 2);

    source.connect(gain).connect(ctx.destination);
    source.start();

    cantopopSource = source;
    cantopopGain   = gain;
  } catch {
    // Missing file or decode error — silently skip
  }
}

// Called when dark mode activates — briefly glitches the tape then cuts it.
export function glitchAndStopCantopop() {
  if (!cantopopSource || !cantopopGain) return;

  const now = ctx.currentTime;
  const g   = cantopopGain.gain;

  // Rapid gain oscillation to simulate tape damage
  g.cancelScheduledValues(now);
  g.setValueAtTime(0.55, now);
  g.linearRampToValueAtTime(0.0,  now + 0.08);
  g.linearRampToValueAtTime(0.4,  now + 0.14);
  g.linearRampToValueAtTime(0.0,  now + 0.20);
  g.linearRampToValueAtTime(0.25, now + 0.24);
  g.linearRampToValueAtTime(0.0,  now + 0.30);

  setTimeout(() => {
    try { cantopopSource.stop(); } catch { /* already stopped */ }
    cantopopSource = null;
    cantopopGain   = null;
  }, 350);
}

// ── emily voice memo ──────────────────────────────────────────────────────────
// Plays emilyvoice.mp3. Falls back gracefully if the file is absent.
// Pass the <audio> element id — the function drives playback via Web Audio
// so it can be mixed with an optional "American Pie" background track.

export async function playEmilyVoice(audioEl, onEnd = () => {}) {
  if (!audioEl) return;

  // Unmute and resume AudioContext (required after user gesture)
  if (ctx.state === 'suspended') await ctx.resume();

  audioEl.currentTime = 0;
  try {
    await audioEl.play();
  } catch {
    // Autoplay blocked or file missing — show transcript anyway
  }

  audioEl.addEventListener('ended', onEnd, { once: true });
  audioEl.addEventListener('error', onEnd, { once: true });
}
