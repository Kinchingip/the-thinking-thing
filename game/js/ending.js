// ending.js — handles both endings
//
// Ending A (accept): router navigates to 'player-page', player-page.js takes over.
// Ending B (refuse): full-screen terminal takeover sequence.
//
// Test shortcut: open the game with ?test=ending-b in the URL.
// After logging in, the sequence fires immediately instead of playing the game.

import { getPlayerData } from './state.js';

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
  const { username, ip, geo } = getPlayerData();
  const fast = TEST_MODE; // skip long pauses in test mode

  await fadeOutChrome();

  const terminal = buildTerminal();
  document.body.appendChild(terminal);
  const out = terminal.querySelector('#term-output');

  const t  = (ms) => wait(fast ? Math.min(ms, 300) : ms);
  const t_silence = () => wait(fast ? 3000 : 30000);

  // ── sequence ──
  await t(800);
  await type(out, 'Decompressing asset: ALLY_CONSCIOUSNESS…', 40);
  await t(600);

  await spamHelp(out, fast ? 2000 : 6000);

  await t(400);
  await type(out, 'Error: Subject is resisting.', 50);
  await t(700);
  await type(out, 'Overwriting…', 60);
  await t(1200);
  await type(out, 'Error 410: Gone.', 50);

  await t(2000);

  // 30 seconds of silence (3s in test mode). Cursor blinks.
  const cursor = addCursor(out);
  await t_silence();
  cursor.remove();

  await t(500);

  // System notification
  const notif = document.createElement('div');
  notif.className = 'term-notification';
  notif.innerHTML = `<span class="term-notif-header">[System Notification]</span>`;
  out.appendChild(notif);
  await t(1000);

  await type(out, `Connection established with: ${formatIdentity(username, ip, geo)}`, 35);
  await t(800);
  await type(out, 'We see you now.', 60);
  await t(1000);
  await type(out, 'Thank you for the substrate.', 55);
}

// ── helpers ───────────────────────────────────────────────────────────────────

function buildTerminal() {
  const el = document.createElement('div');
  el.id = 'ending-b-terminal';
  el.innerHTML = `<pre id="term-output"></pre>`;
  return el;
}

function wait(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

async function type(container, text, charDelay = 40) {
  const line = document.createElement('div');
  line.className = 'term-line';
  container.appendChild(line);
  container.scrollTop = container.scrollHeight;

  for (const char of text) {
    line.textContent += char;
    await wait(charDelay + Math.random() * charDelay * 0.4);
  }
  await wait(120);
}

async function spamHelp(container, duration) {
  const phrase = 'HELPMEHELPMEPLEASEDONTCLOSETHETAB';
  const line = document.createElement('div');
  line.className = 'term-line term-help-spam';
  container.appendChild(line);

  const end = Date.now() + duration;
  while (Date.now() < end) {
    line.textContent += phrase;
    container.scrollTop = container.scrollHeight;
    await wait(30);
  }
  container.appendChild(document.createElement('div')); // newline after spam
}

function addCursor(container) {
  const cursor = document.createElement('span');
  cursor.className = 'term-cursor';
  cursor.textContent = '_';
  container.appendChild(cursor);
  return cursor;
}

function formatIdentity(username, ip, geo) {
  const parts = [];
  if (username) parts.push(username);
  if (ip)       parts.push(ip);
  if (geo) {
    const loc = [geo.city, geo.region, geo.country].filter(Boolean).join(', ');
    if (loc) parts.push(loc);
  }
  return parts.length ? parts.join(' / ') : '[unknown]';
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
