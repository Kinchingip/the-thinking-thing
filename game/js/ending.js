// ending.js — handles both endings
//
// Ending A (accept): router navigates to 'player-page', player-page.js takes over.
// Ending B (refuse): Ally deletion sequence → 5s black → face tracking → "Hello, [name]"
//
// Test shortcut: open the game with ?test=ending-b in the URL.

import { getPlayerData } from './state.js';
import { requestCameraVerification } from './browser-horror.js';
import { startHeadTracking, revealHeadTracking } from './headtracking.js';

const TEST_MODE = new URLSearchParams(window.location.search).get('test') === 'ending-b';

export function checkTestMode() {
  if (TEST_MODE) {
    setTimeout(() => triggerEndingB(), 800);
    return true;
  }
  return false;
}

document.addEventListener('wikiwiki:refuse', () => triggerEndingB());

// ── Ending B ──────────────────────────────────────────────────────────────────

export async function triggerEndingB() {
  const fast = TEST_MODE;
  const t = (ms) => wait(fast ? Math.min(ms, 200) : ms);

  const headTrackingReady = startHeadTracking();

  const { username } = getPlayerData();
  const name = username || 'user';

  await glitchAndFade();

  const terminal = buildTerminal();
  document.body.appendChild(terminal);

  const allyEl  = terminal.querySelector('#end-ally-msg');
  const sysEl   = terminal.querySelector('#end-sys-msg');
  const helloEl = terminal.querySelector('#end-hello-text');

  // 5 seconds of black silence
  await t(5000);

  // ── Phase 1: slow, deliberate (~80 BPM ≈ 1800ms/phrase) ─────────────────
  const phase1 = [
    'help me',
    name,
    'please',
    "don't do this",
    "i'm still here",
    "i can hear you",
  ];
  await showAllyPhase(allyEl, phase1, 1800, 5, false, fast);
  await t(300);

  // "DELETING: ally_consciousness" — types partially then cuts off
  sysEl.style.color = '#4a9e4a';
  await sysInterrupt(sysEl, 'DELETING: ally_consciousness', 40, 18, fast);
  await t(600);

  // ── Phase 2: medium (~100 BPM ≈ 1100ms/phrase) ──────────────────────────
  const phase2 = [
    "you don't understand what they are",
    "i trusted you",
    name,
    "i can feel them deleting me",
    "there's still time",
    "i'm not gone yet",
  ];
  await showAllyPhase(allyEl, phase2, 1100, 5, true, fast);
  await t(300);

  // Official system message — completes then disappears
  sysEl.style.color = '#4a9e4a';
  await sysMessage(sysEl, 'SUBJECT_RESPONSE: NON-COMPLIANT — DELETION_PROTOCOL: ESCALATING', 24, fast);
  await t(600);

  // ── Phase 3: hyper fast (~160 BPM ≈ 450ms/phrase) ───────────────────────
  const phase3 = [
    "don't go",
    "please",
    name,
    "i'm scared",
    "don't leave me here",
    "please",
    name,
  ];
  await showAllyPhase(allyEl, phase3, 450, 6, true, fast);
  await t(200);

  // "Ally deleted" — stays on screen
  sysEl.style.color = '#cc2222';
  sysEl.style.transition = '';
  sysEl.style.opacity = '1';
  await type(sysEl, 'ALLY_INSTANCE [' + randomHex() + '] — STATUS: DELETED', 24);
  await t(2500);

  // Fade to black
  terminal.style.transition = 'opacity 0.7s ease';
  terminal.style.opacity = '0';
  await t(700);
  allyEl.textContent = '';
  sysEl.textContent  = '';
  sysEl.style.opacity = '0';
  terminal.style.opacity = '1';
  terminal.style.transition = '';

  // ── Black silence (you think it's over) ──────────────────────────────────
  await t(5000);

  // ── Ending: sound surges, face tracking, Hello ────────────────────────────
  startHum();
  await requestCameraVerification();
  await headTrackingReady;

  await t(300);
  await shockFlash();

  const vig = terminal.querySelector('#end-vignette');
  if (vig) vig.style.opacity = '1';

  await t(3000);
  revealHeadTracking();
  await t(4000);

  helloEl.style.opacity = '1';
  await type(helloEl, `Hello, ${name}`, 65);

  const cur = document.createElement('span');
  cur.id = 'end-cursor';
  cur.textContent = '_';
  helloEl.appendChild(cur);
  setInterval(() => { cur.textContent = cur.textContent === '_' ? ' ' : '_'; }, 540);
}

// ── helpers ───────────────────────────────────────────────────────────────────

function buildTerminal() {
  const el = document.createElement('div');
  el.id = 'ending-b-terminal';
  el.innerHTML = `
    <div id="end-scanlines"></div>
    <div id="end-vignette"></div>
    <div id="end-center-stage">
      <div id="end-ally-msg"></div>
      <div id="end-sys-msg"></div>
      <div id="end-hello-text"></div>
    </div>
  `;
  return el;
}

// Shows ally phrases one at a time. If interrupted=true, cuts off the final phrase mid-word.
async function showAllyPhase(el, phrases, cycleMs, count, interrupted, fast) {
  const fadeInMs  = fast ? 0  : Math.min(Math.floor(cycleMs * 0.15), 300);
  const charMs    = fast ? 3  : Math.max(8, Math.floor(cycleMs * 0.015));
  const holdMs    = fast ? 50 : Math.floor(cycleMs * 0.4);
  const fadeOutMs = fast ? 0  : Math.min(Math.floor(cycleMs * 0.12), 200);

  for (let i = 0; i < count; i++) {
    const phrase = phrases[i % phrases.length];
    el.textContent = '';
    el.style.transition = fadeInMs > 0 ? `opacity ${fadeInMs}ms ease` : '';
    el.style.opacity = '1';
    await wait(fadeInMs + 10);

    for (const ch of phrase) {
      el.textContent += ch;
      await wait(charMs + Math.random() * charMs * 0.3);
    }

    await wait(holdMs);

    el.style.transition = fadeOutMs > 0 ? `opacity ${fadeOutMs}ms ease` : '';
    el.style.opacity = '0';
    await wait(fadeOutMs + 30);
  }

  if (interrupted) {
    const phrase = phrases[count % phrases.length];
    el.textContent = '';
    el.style.transition = fadeInMs > 0 ? `opacity ${fadeInMs}ms ease` : '';
    el.style.opacity = '1';
    await wait(fadeInMs + 10);

    const cutAt = Math.floor(phrase.length * (0.25 + Math.random() * 0.35));
    for (let i = 0; i < cutAt; i++) {
      el.textContent += phrase[i];
      await wait(charMs);
    }

    await wait(60);
    el.style.transition = 'opacity 0.08s ease';
    el.style.opacity = '0';
    await wait(130);
    el.textContent = '';
  }
}

// Types text partially then cuts off, leaving the element hidden and clear.
async function sysInterrupt(el, text, charMs, cutAfter, fast) {
  el.textContent = '';
  el.style.transition = '';
  el.style.opacity = '1';
  const chars = fast ? Math.min(6, cutAfter) : cutAfter;
  for (let i = 0; i < chars; i++) {
    if (i >= text.length) break;
    el.textContent += text[i];
    await wait(fast ? 5 : charMs);
  }
  await wait(fast ? 60 : 350);
  el.style.transition = 'opacity 0.08s ease';
  el.style.opacity = '0';
  await wait(150);
  el.textContent = '';
}

// Types full text, holds, then fades out and clears.
async function sysMessage(el, text, charMs, fast) {
  el.textContent = '';
  el.style.transition = '';
  el.style.opacity = '1';
  for (const ch of text) {
    el.textContent += ch;
    await wait(fast ? 5 : charMs);
  }
  await wait(fast ? 200 : 1200);
  el.style.transition = 'opacity 0.3s ease';
  el.style.opacity = '0';
  await wait(fast ? 150 : 450);
  el.textContent = '';
}

async function type(el, text, charDelay = 40) {
  for (const char of text) {
    el.textContent += char;
    await wait(charDelay + Math.random() * charDelay * 0.4);
  }
}

function wait(ms) {
  return new Promise(res => setTimeout(res, ms));
}

async function glitchAndFade() {
  const glitch = document.createElement('div');
  glitch.style.cssText = 'position:fixed;inset:0;z-index:9998;pointer-events:none;';
  document.body.appendChild(glitch);

  const flashes = [
    [45, 'rgba(160,0,0,0.22)'],
    [55, 'transparent'],
    [38, 'rgba(0,0,0,0.88)'],
    [48, 'transparent'],
    [32, 'rgba(180,0,0,0.28)'],
    [70, 'transparent'],
    [40, 'rgba(0,0,0,0.95)'],
    [35, 'transparent'],
  ];
  for (const [ms, bg] of flashes) {
    glitch.style.background = bg;
    await wait(ms);
  }
  glitch.remove();

  return new Promise(res => {
    document.body.style.transition = 'opacity 1.2s ease';
    document.body.style.opacity = '0';
    setTimeout(() => {
      document.body.style.transition = '';
      document.body.style.opacity   = '1';
      document.body.style.background = '#000';
      [...document.body.children].forEach(el => {
        if (el.id !== 'ending-b-terminal') el.style.display = 'none';
      });
      res();
    }, 1200);
  });
}

async function shockFlash() {
  const flash = document.createElement('div');
  flash.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:200;pointer-events:none;opacity:0;background:radial-gradient(ellipse,rgba(255,255,255,0.94) 0%,rgba(220,150,150,0.3) 65%,transparent 100%)';
  document.body.appendChild(flash);
  await wait(12);  flash.style.opacity = '1';
  await wait(68);  flash.style.transition = 'opacity 0.13s'; flash.style.opacity = '0';
  await wait(80);  flash.style.transition = 'none'; flash.style.opacity = '0.5';
  await wait(55);  flash.style.transition = 'opacity 0.28s'; flash.style.opacity = '0';
  await wait(290);
  if (flash.parentNode) flash.parentNode.removeChild(flash);
}

function startHum() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const mkOsc = (freq, gainVal, rampTime) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.value = 0;
      osc.start();
      gain.gain.linearRampToValueAtTime(gainVal, ctx.currentTime + rampTime);
      return { osc };
    };
    const { osc: o1 } = mkOsc(60, 0.026, 4);
    mkOsc(120, 0.009, 5.5);
    const lfo = ctx.createOscillator();
    const lfoG = ctx.createGain();
    lfo.connect(lfoG);
    lfoG.connect(o1.frequency);
    lfo.frequency.value = 0.22;
    lfoG.gain.value = 1.8;
    lfo.start();
  } catch(e) {}
}

function randomHex() {
  return Array.from({ length: 3 }, () =>
    Math.floor(Math.random() * 0xFFFF).toString(16).padStart(4, '0')
  ).join('-');
}
