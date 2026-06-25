// ending.js — handles both endings
//
// Ending A (accept): router navigates to 'player-page', player-page.js takes over.
// Ending B (refuse): full-screen terminal takeover sequence.
//
// Test shortcut: open the game with ?test=ending-b in the URL.
// After logging in, the sequence fires immediately instead of playing the game.

import { getPlayerData } from './state.js';
import { requestCameraVerification } from './browser-horror.js';
import { startHeadTracking, revealHeadTracking, hideHeadTracking } from './headtracking.js';

const TEST_MODE = new URLSearchParams(window.location.search).get('test') === 'ending-b';

// Called from home.js after login when in test mode.
export function checkTestMode() {
  if (TEST_MODE) {
    // Small delay so the home screen briefly shows, then fires.
    setTimeout(() => triggerEndingB(), 800);
    return true;
  }
  return false;
}

// Fired by talk.js via custom event when player refuses.
document.addEventListener('wikiwiki:refuse', () => triggerEndingB());

// ── Ending B sequence ─────────────────────────────────────────────────────────

export async function triggerEndingB() {
  const fast = TEST_MODE;
  const t = (ms) => wait(fast ? Math.min(ms, 300) : ms);
  const t_silence = () => wait(fast ? 3000 : 30000);

  // Prefetch IP in parallel with the fade-out animation
  const ipPromise = fetch('https://ipapi.co/json/').then(r => r.json()).catch(() => null);

  await fadeOutChrome();

  const terminal = buildTerminal();
  document.body.appendChild(terminal);

  const statusEl = terminal.querySelector('#end-status');
  const helpEl   = terminal.querySelector('#end-help');
  const linesEl  = terminal.querySelector('#end-lines');
  const notifEl  = terminal.querySelector('#end-notif');
  const vigEl    = terminal.querySelector('#end-vignette');
  const ipEl     = terminal.querySelector('#end-ip');
  const locEl    = terminal.querySelector('#end-loc');
  const weseeEl  = terminal.querySelector('#end-wesee');
  const labelEl  = terminal.querySelector('.end-notif-label');
  const conn2El  = terminal.querySelector('.end-conn-p2');
  const thanksEl = terminal.querySelector('.end-thanks');

  const addTypedLine = async (color, text, charDelay, mt) => {
    const p = document.createElement('p');
    p.className = 'end-line';
    p.style.color = color;
    if (mt) p.style.marginTop = mt;
    linesEl.appendChild(p);
    await type(p, text, charDelay);
  };

  await type(statusEl, 'Decompressing asset: ALLY_CONSCIOUSNESS…', 35);
  await typeHelpWall(helpEl, fast);

  await t(600);
  await addTypedLine('#3a7a3a', 'Error: Subject is resisting.', 45);
  await t(200);
  await addTypedLine('#3a7a3a', 'Overwriting…', 60);
  await t(200);
  await addTypedLine('#383838', 'Error 410: Gone.', 50);
  await t(400);
  await addTypedLine('#3a5e72', 'Substrate analysis initiated.', 35, '14px');
  await t(200);
  await addTypedLine('#3a5e72', 'Confirming biological signature…', 35);
  await t(300);

  await requestCameraVerification();
  startHeadTracking();

  await t(300);
  await addTypedLine('#3a5e72', 'Signature logged.', 50);
  await t(1000);

  await shockFlash();

  notifEl.style.opacity = '1';
  vigEl.style.opacity = '1';

  await t(400);
  await type(labelEl, '[ System Notification ]', 40);

  const ipData = await ipPromise;
  if (ipData && ipData.ip) {
    typeInto(ipEl, ipData.ip, 72);
    const loc = [ipData.city, ipData.region, ipData.country_name].filter(Boolean).join(', ');
    if (loc) setTimeout(() => typeInto(locEl, loc, 46), 680);
  }

  startHum();

  await t(800);
  await type(conn2El, 'Biological signature confirmed.  Node registered.  Substrate acquisition: ', 30);
  const activeSpan = document.createElement('span');
  activeSpan.className = 'end-active';
  activeSpan.textContent = 'ACTIVE';
  conn2El.appendChild(activeSpan);

  await t(1100);
  weseeEl.style.opacity = '1';
  weseeEl.style.letterSpacing = '0.1em';

  await t(2000);
  await type(thanksEl, 'Thank you for the substrate.', 50);
  const curEl = document.createElement('span');
  curEl.id = 'end-cursor';
  curEl.textContent = '_';
  thanksEl.appendChild(curEl);

  const cursorIv = setInterval(() => {
    curEl.textContent = curEl.textContent === '_' ? ' ' : '_';
  }, 540);

  await t(2000);
  revealHeadTracking();
  await t_silence();
  hideHeadTracking();

  clearInterval(cursorIv);
}

// ── helpers ───────────────────────────────────────────────────────────────────

function buildTerminal() {
  const el = document.createElement('div');
  el.id = 'ending-b-terminal';
  el.innerHTML = `
    <div id="end-scanlines"></div>
    <div id="end-vignette"></div>
    <main id="end-main">
      <p id="end-status"></p>
      <div id="end-help"></div>
      <div id="end-lines"></div>
      <div id="end-notif">
        <p class="end-notif-label"></p>
        <div class="end-conninfo">
          <p class="end-conn-p1">Connection established with:&nbsp;&nbsp;x&nbsp;&nbsp;/&nbsp;&nbsp;<span id="end-ip">███.███.███.███</span>&nbsp;&nbsp;/&nbsp;&nbsp;<span id="end-loc">██████████████████</span></p>
          <p class="end-conn-p2"></p>
        </div>
        <p id="end-wesee">We see you now.</p>
        <p class="end-thanks"></p>
      </div>
    </main>
  `;
  return el;
}

async function type(el, text, charDelay = 40) {
  for (const char of text) {
    el.textContent += char;
    await wait(charDelay + Math.random() * charDelay * 0.4);
  }
}

function wait(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

function typeInto(el, text, speed) {
  let i = 0;
  const iv = setInterval(() => {
    i++;
    el.textContent = text.slice(0, i);
    if (i >= text.length) clearInterval(iv);
  }, speed);
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

async function typeHelpWall(el, fast) {
  const full = 'HELPMEHELPMEPLEASEDONTCLOSETHETAB'.repeat(210);
  const chunk = fast ? 300 : 8;
  el.style.transition = 'none';
  for (let i = 0; i < full.length; i += chunk) {
    const end = Math.min(i + chunk, full.length);
    el.textContent = full.slice(0, end);
    const progress = end / full.length;
    // opacity bleeds from near-invisible to full as text fills
    el.style.opacity = String(0.03 + progress * 0.97);
    // starts blurred and sharpens as it fills in
    el.style.filter = 'blur(' + ((1 - progress) * 2).toFixed(2) + 'px)';
    await wait(fast ? 0 : 2);
  }
  el.style.opacity = '1';
  el.style.filter = '';
}

async function fadeOutChrome() {
  return new Promise((res) => {
    document.body.style.transition = 'opacity 1.5s ease';
    document.body.style.opacity = '0';
    setTimeout(() => {
      // Kill the chrome entirely so only the terminal remains.
      document.body.style.transition = '';
      document.body.style.opacity   = '1';
      document.body.style.background = '#000';
      // Hide everything except what ending.js appends.
      [...document.body.children].forEach((el) => {
        if (el.id !== 'ending-b-terminal') el.style.display = 'none';
      });
      res();
    }, 1500);
  });
}
