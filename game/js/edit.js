// edit.js — handles the Edit tab, in-page edit captchas, and the HUNGER effect.
//
// Two pages have edit interactions:
//   harrow-wv       → modal captcha (building count), unlocks Notable People
//   harrow-courier  → inline edit panel (HUNGER riddle), triggers HUNGER effect
//
// The Edit tab is shown/hidden per-page by initEditTab().

import { setFlag, getFlag } from './state.js';
import { buildPlayerPage } from './player-page.js';

const EDIT_PAGES = new Set(['harrow-wv', 'harrow-courier']);

// Called by router after every non-talk page load.
export function initEditTab(pageId, navigate) {
  const tab = document.getElementById('tab-edit');
  if (!tab) return;

  // Always reset tab state first
  tab.style.display = 'none';
  tab.querySelector('a').onclick = null;
  tab.classList.remove('selected');

  if (!EDIT_PAGES.has(pageId)) return;

  // harrow-wv: hide edit tab once captcha already solved
  if (pageId === 'harrow-wv') {
    if (getFlag('edit_harrow_wv_passed')) {
      revealNotablePeople();
      return;
    }
  }

  tab.style.display = '';
  tab.querySelector('a').onclick = (e) => {
    e.preventDefault();
    if (pageId === 'harrow-wv') showHarrowCaptchaModal();
    if (pageId === 'harrow-courier') toggleHungerPanel(navigate);
  };
}

// Also called when ally page loads to animate the live timestamp.
export function initAllyPage() {
  const ts = document.getElementById('ally-timestamp');
  if (!ts) return;
  let seconds = 3;
  ts.textContent = `${seconds} seconds ago`;
  setInterval(() => {
    seconds += Math.floor(1 + Math.random() * 3);
    ts.textContent = seconds < 60
      ? `${seconds} seconds ago`
      : `${Math.floor(seconds / 60)} minute${Math.floor(seconds / 60) !== 1 ? 's' : ''} ago`;
  }, 2000 + Math.random() * 1500);
}

// Also called when player-page loads to animate its timestamp and build content.
export function initPlayerPage() {
  buildPlayerPage();
  const ts = document.getElementById('player-timestamp');
  if (!ts) return;
  let seconds = 1;
  ts.textContent = `${seconds} second ago`;
  const iv = setInterval(() => {
    seconds++;
    if (seconds >= 10) { clearInterval(iv); return; }
    ts.textContent = `${seconds} seconds ago`;
  }, 800);
}

// ── harrow-wv modal captcha ───────────────────────────────────────────────────

function showHarrowCaptchaModal() {
  if (document.getElementById('edit-modal-overlay')) return;

  const overlay = document.createElement('div');
  overlay.id = 'edit-modal-overlay';
  overlay.innerHTML = `
    <div class="edit-modal" role="dialog" aria-modal="true">
      <div class="edit-modal-header">
        <span class="edit-modal-title">WikiWiki — Human verification</span>
        <button class="edit-modal-close" aria-label="Close">✕</button>
      </div>
      <div class="edit-modal-body">
        <p class="edit-captcha-intro">Before you can edit this article, please confirm that you are a human contributor.</p>
        <p class="edit-captcha-question">How many businesses operated on Meridian Street, Harrow, at the town's commercial peak?</p>
        <p class="edit-captcha-hint">The answer is available in the article text above.</p>
        <div class="edit-captcha-input-row">
          <input id="edit-captcha-answer" class="mw-ui-input edit-captcha-input" type="text"
                 placeholder="Enter number" autocomplete="off" />
          <button id="edit-captcha-submit" class="mw-ui-button mw-ui-progressive">Verify</button>
        </div>
        <p id="edit-captcha-error" class="edit-captcha-error" style="display:none">
          Incorrect. Please check the article and try again.
        </p>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  const close = () => overlay.remove();
  overlay.querySelector('.edit-modal-close').onclick = close;
  overlay.addEventListener('click', e => { if (e.target === overlay) close(); });

  const input  = overlay.querySelector('#edit-captcha-answer');
  const submit = overlay.querySelector('#edit-captcha-submit');
  const error  = overlay.querySelector('#edit-captcha-error');

  input.focus();

  const attempt = () => {
    if (input.value.trim() === '4') {
      setFlag('edit_harrow_wv_passed');
      close();
      revealNotablePeople();
      showEditSuccessBanner();
      const tab = document.getElementById('tab-edit');
      if (tab) tab.style.display = 'none';
    } else {
      error.style.display = '';
      input.value = '';
      input.classList.add('edit-captcha-input--wrong');
      setTimeout(() => input.classList.remove('edit-captcha-input--wrong'), 600);
    }
  };

  submit.addEventListener('click', attempt);
  input.addEventListener('keydown', e => { if (e.key === 'Enter') attempt(); });
}

function revealNotablePeople() {
  const section = document.querySelector('.notable-people-section');
  if (section) {
    section.style.display = 'block';
    section.classList.add('notable-people-section--reveal');
  }
}

function showEditSuccessBanner() {
  const banner = document.createElement('div');
  banner.className = 'edit-success-banner';
  banner.textContent = 'Your edit has been submitted and is pending review. Thank you for contributing to WikiWiki.';
  const content = document.getElementById('mw-content-text');
  if (content) content.insertBefore(banner, content.firstChild);
  setTimeout(() => {
    banner.classList.add('edit-success-banner--hide');
    setTimeout(() => banner.remove(), 500);
  }, 4000);
}

// ── harrow-courier HUNGER panel ───────────────────────────────────────────────

function toggleHungerPanel(navigate) {
  const existing = document.getElementById('hunger-edit-panel');
  if (existing) { existing.remove(); return; }

  const panel = document.createElement('div');
  panel.id = 'hunger-edit-panel';
  panel.innerHTML = `
    <div class="hunger-edit-header">
      <span>Editing: <b>The Harrow Courier</b> — §&nbsp;The puzzle page</span>
      <button class="hunger-edit-close">Cancel</button>
    </div>
    <div class="hunger-edit-body">
      <p class="hunger-edit-label">The puzzle from February 1949 (anonymous contributor). Fill in the answer to complete the edit:</p>
      <blockquote class="hunger-riddle-inline">
        <p>I am the guest that arrives without invitation and will not leave.</p>
        <p>I grow louder the longer I am ignored.</p>
        <p>I have no voice and yet I speak.</p>
        <p>I have no hands and yet I reach.</p>
        <p>Every living thing knows my name.</p>
        <p>Most only think of me when I come calling.</p>
        <p class="hunger-riddle-answer-label">Answer: <span class="hunger-answer-blank">_______________</span></p>
      </blockquote>
      <div class="hunger-input-row">
        <input id="hunger-answer-input" class="mw-ui-input hunger-input"
               type="text" placeholder="Enter answer" autocomplete="off" />
        <button id="hunger-submit-btn" class="mw-ui-button mw-ui-progressive">Submit edit</button>
      </div>
      <p id="hunger-submit-error" class="hunger-error" style="display:none">
        The article cannot be saved with this answer.
      </p>
    </div>
  `;

  const contentArea = document.getElementById('mw-content-text');
  if (contentArea) contentArea.insertAdjacentElement('beforebegin', panel);

  panel.querySelector('.hunger-edit-close').onclick = () => panel.remove();

  const input  = panel.querySelector('#hunger-answer-input');
  const submit = panel.querySelector('#hunger-submit-btn');
  const error  = panel.querySelector('#hunger-submit-error');

  input.focus();

  const attempt = () => {
    if (input.value.trim().toUpperCase() === 'HUNGER') {
      panel.remove();
      const tab = document.getElementById('tab-edit');
      if (tab) tab.style.display = 'none';
      triggerHungerEffect(navigate);
    } else {
      error.style.display = '';
    }
  };

  submit.addEventListener('click', attempt);
  input.addEventListener('keydown', e => { if (e.key === 'Enter') attempt(); });
}

// ── HUNGER full-screen effect ─────────────────────────────────────────────────

export async function triggerHungerEffect(navigate) {
  const overlay = document.createElement('div');
  overlay.id = 'hunger-overlay';
  overlay.innerHTML = `
    <div id="hunger-scanlines"></div>
    <div id="hunger-words-layer"></div>
    <div id="hunger-center-text"></div>
  `;
  document.body.appendChild(overlay);

  const wordsLayer = overlay.querySelector('#hunger-words-layer');
  const centerText = overlay.querySelector('#hunger-center-text');

  await wait(30);
  overlay.classList.add('hunger-overlay--visible');
  await wait(600);

  centerText.textContent = 'HUNGER';
  centerText.classList.add('hunger-center--visible');
  await wait(800);

  // Spawn words and fire 5 popups on top of the explosion
  let spawnInterval = 200;
  let spawned = 0;
  const maxSpawn = 60;

  const spawnLoop = setInterval(() => {
    if (spawned >= maxSpawn) { clearInterval(spawnLoop); return; }
    spawnWord(wordsLayer, spawned / maxSpawn);
    spawned++;
    if (spawnInterval > 60) spawnInterval -= 4;
  }, spawnInterval);

  for (let i = 0; i < 5; i++) {
    setTimeout(() => showHungerPopup(i), i * 650);
  }

  await wait(1000);
  centerText.classList.add('hunger-center--glitch');

  await wait(2500);
  clearInterval(spawnLoop);

  overlay.classList.add('hunger-overlay--red');
  await wait(800);

  overlay.classList.add('hunger-overlay--flash');
  await wait(120);
  overlay.classList.remove('hunger-overlay--flash');
  await wait(80);
  overlay.classList.add('hunger-overlay--flash');
  await wait(80);
  overlay.classList.remove('hunger-overlay--flash');
  await wait(300);

  overlay.classList.add('hunger-overlay--fade');
  await wait(1200);

  overlay.remove();
  if (navigate) navigate('ally');
}

const POPUP_SUBS = [
  '',
  'This process cannot be stopped.',
  'Your session data has been recorded.',
  'Substrate acquisition is in progress.',
  'Integration protocol is now active.',
];

function showHungerPopup(index) {
  const origin = window.location.hostname || 'wikiwiki.com';

  const overlay = document.createElement('div');
  overlay.className = 'hunger-popup-overlay';

  const dialog = document.createElement('div');
  dialog.className = 'hunger-browser-dialog';

  dialog.innerHTML = `
    <div class="hunger-dialog-header">${origin} says</div>
    <div class="hunger-dialog-body">
      <p class="hunger-dialog-message">HUNGER</p>
      <p class="hunger-dialog-sub">${POPUP_SUBS[index] ?? ''}</p>
    </div>
    <div class="hunger-dialog-footer">
      <label class="hunger-dialog-suppress">
        <input type="checkbox"> Don't allow this page to create additional dialogs
      </label>
      <button class="hunger-dialog-ok">OK</button>
    </div>
  `;

  let dismissed = false;
  const done = () => {
    if (dismissed) return;
    dismissed = true;
    overlay.classList.remove('hunger-popup-overlay--in');
    setTimeout(() => overlay.remove(), 150);
  };

  dialog.querySelector('.hunger-dialog-ok').addEventListener('click', done);
  setTimeout(done, 1800);

  overlay.appendChild(dialog);
  document.body.appendChild(overlay);

  requestAnimationFrame(() => overlay.classList.add('hunger-popup-overlay--in'));
}

function spawnWord(container, progress) {
  const el = document.createElement('div');
  el.className = 'hunger-word';
  el.textContent = 'HUNGER';

  const minSize = 0.6;
  const maxSize = 4.5;
  const size = minSize + (maxSize - minSize) * (0.2 + Math.random() * 0.8);
  const redChannel = Math.floor(180 + progress * 75);
  const lightnessAdjust = 20 + Math.floor(progress * 50);

  el.style.left = (Math.random() * 88) + '%';
  el.style.top  = (Math.random() * 90) + '%';
  el.style.fontSize = size + 'vw';
  el.style.opacity = (0.25 + Math.random() * 0.75).toString();
  el.style.color = `rgb(${redChannel}, ${Math.floor(lightnessAdjust * 0.4)}, ${Math.floor(lightnessAdjust * 0.2)})`;
  el.style.animationDelay = (Math.random() * 0.3) + 's';

  container.appendChild(el);
}

function wait(ms) {
  return new Promise(res => setTimeout(res, ms));
}
