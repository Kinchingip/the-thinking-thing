// audio.js — ambient tracks and one-shot sound moments tied to page/state events

const AUDIO_DIR = '../assets/audio/';

let ambientTrack = null;
let ambientGain = null;
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
