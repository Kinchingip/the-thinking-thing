// router.js — handles all navigation. Pages are one-way: leaving a page consumes it.

import { recordVisit, setCurrentPage, getCurrentPage, setFlag, getFlag } from './state.js';
import { maybeShowTalkTab, renderCaptcha } from './talk.js';
import { initEditTab, initAllyPage, initPlayerPage } from './edit.js';
import { initPasswordGates } from './password.js';
import { initTurtleSoup } from './turtle-soup.js';
import { applyDisintegration } from './disintegrate.js';
import { initRiskTracker, recordNavigation } from './risk-tracker.js';
import { unlockDarkMode, initDarkModeToggle } from './dark-mode.js';
import { playCantopop, glitchAndStopCantopop, playEmilyVoice } from './audio.js';
import { initHangman } from './hangman.js';

const PAGES_DIR = './pages/';

const KNOWN_PAGES = [
  // Chapter 1 — The Town
  'peculiar-mississippi',
  'first-baptist-church',
  'list-of-residents',
  'the-cartographers',
  'substrate-transcription',
  'harrow-wv',
  'voss-harland-instrumentation',
  'internal-research-wiki',
  // Chapter 2 — The Residents
  'mayor-of-harrow',
  'mayor-journal',
  'newspaper-owner',
  'harrow-courier',
  'newspaper-owner-journal',
  'henry-liang',
  'muscipulavirus',
  'the-signal-remains',
  'survivor-name',
  // Chapter 2 — Victims (Harrow Digital Labs, 1983)
  'andy-chan',
  'emily-martin',
  'lisa-man',
  // Chapter 3 — Ally
  'ally',
  // Endings
  'player-page',
  // Talk pages (CAPTCHAs)
  'talk:ch1',
  'talk:ch2',
  'talk:ch3',
];

// Deduplicate (list-of-residents appeared twice in draft)
const KNOWN_PAGES_SET = [...new Set(KNOWN_PAGES)];

let currentPageId = null;

export function init(onHome = () => {}) {
  initRiskTracker();

  // Global dark-mode-on listener: Andy's puzzle gate becomes visible when dark mode activates
  document.addEventListener('wikiwiki:dark-mode-on', () => {
    if (document.body.dataset.page !== 'andy-chan') return;
    const puzzle = document.getElementById('andy-dark-puzzle');
    if (!puzzle) return;
    puzzle.style.display = '';
    initPasswordGates();
    glitchAndStopCantopop();
  });

  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[data-page]');
    if (!link) return;
    e.preventDefault();
    navigate(link.dataset.page);
  });

  window.addEventListener('popstate', () => {
    const pageId = location.hash.slice(1);
    if (!pageId || !KNOWN_PAGES_SET.includes(pageId)) { onHome(); return; }
    navigate(pageId, false);
  });
}

// Called by home.js after login — resumes at last known page or starts fresh.
export function startGame() {
  const last = getCurrentPage();
  navigate(last && KNOWN_PAGES_SET.includes(last) ? last : 'harrow-wv');
}

export function navigate(pageId, pushHistory = true) {
  if (!KNOWN_PAGES_SET.includes(pageId)) {
    showNotFound(pageId);
    return;
  }

  recordNavigation();
  currentPageId = pageId;
  setCurrentPage(pageId);
  const visitCount = recordVisit(pageId);

  const isTalk = pageId.startsWith('talk:');

  if (isTalk) {
    updateChrome(pageId, pushHistory);
    renderCaptcha(pageId, navigate);
    hideTalkTab();
    hideEditTab();
  } else {
    fetchPage(pageId)
      .then((html) => {
        injectContent(html);
        afterPageLoad(pageId, visitCount);
        updateChrome(pageId, pushHistory);
      })
      .catch(() => showNotFound(pageId));
  }
}

// ── post-load initialisation ──────────────────────────────────────────────────

function afterPageLoad(pageId, visitCount) {
  // Tag body so page-scoped CSS (e.g. dark mode erasure) can target it
  document.body.dataset.page = pageId;

  initPasswordGates();
  initEditTab(pageId, navigate);
  maybeShowTalkTab(pageId, visitCount, navigate);
  applyDisintegration(pageId, visitCount);
  initDarkModeToggle();

  if (pageId === 'ally')             initAllyPage();
  if (pageId === 'player-page')      initPlayerPage();
  if (pageId === 'the-signal-remains') initTurtleSoup();
  if (pageId === 'andy-chan')        initAndyPage();
  if (pageId === 'emily-martin')     initEmilyPage();
  if (pageId === 'lisa-man')         initLisaPage();
  if (pageId === 'mayor-of-harrow')  initMayorGate();
}

// ── victim page initialisers ──────────────────────────────────────────────────

function initAndyPage() {
  unlockDarkMode();
  initDarkModeToggle(); // re-run to show sidebar panel now that flag is set

  // If dark mode is already active when arriving at Andy's page, show puzzle immediately
  if (document.body.classList.contains('dark-mode')) {
    const puzzle = document.getElementById('andy-dark-puzzle');
    if (puzzle) { puzzle.style.display = ''; initPasswordGates(); }
  }

  const cassette = document.getElementById('andy-cassette');
  if (cassette) {
    cassette.addEventListener('click', () => {
      if (cassette.classList.contains('andy-cassette--playing')) return;
      cassette.classList.add('andy-cassette--playing');
      playCantopop();
    });
  }
}

function initEmilyPage() {
  const playBtn    = document.getElementById('emily-play-btn');
  const audioEl    = document.getElementById('emily-audio');
  const transcript = document.getElementById('emily-audio-transcript');

  if (!playBtn || !audioEl) return;

  playBtn.addEventListener('click', () => {
    playBtn.disabled = true;
    playBtn.textContent = '▶ Playing…';
    playEmilyVoice(audioEl, () => {
      playBtn.textContent = '▶ Play recording';
      playBtn.disabled = false;
      if (transcript) transcript.style.display = '';
    });
    // Show transcript immediately in case audio fails
    if (transcript) setTimeout(() => { transcript.style.display = ''; }, 800);
  });
}

function initLisaPage() {
  const container = document.getElementById('lisa-hangman');
  if (!container) return;

  initHangman(container, 'my body', () => {
    setFlag('lisa_puzzle_solved');
    const reveal = document.getElementById('lisa-fragment-reveal');
    if (reveal) reveal.style.display = '';
  });
}

function initMayorGate() {
  const row = document.getElementById('mayor-fragment-row');
  if (!row) return;

  const andy  = getFlag('andy_puzzle_solved');
  const emily = getFlag('emily_puzzle_solved');
  const lisa  = getFlag('lisa_puzzle_solved');

  row.innerHTML = `
    <span class="mayor-fragment-chip${andy  ? '' : ' mayor-fragment-chip--empty'}">${andy  ? 'WHERE IS' : '??? ???'}</span>
    <span class="mayor-fragment-chip${emily ? '' : ' mayor-fragment-chip--empty'}">${emily ? 'MY'       : '???'    }</span>
    <span class="mayor-fragment-chip${lisa  ? '' : ' mayor-fragment-chip--empty'}">${lisa  ? 'BODY'     : '????'   }</span>
  `;
}

// ── fetch / inject ────────────────────────────────────────────────────────────

async function fetchPage(pageId) {
  const res = await fetch(`${PAGES_DIR}${pageId}.html`);
  if (!res.ok) throw new Error(`${res.status}`);
  return res.text();
}

function injectContent(html) {
  const content = document.getElementById('wiki-content');
  if (content) content.innerHTML = html;
  window.scrollTo(0, 0);
}

// ── chrome ────────────────────────────────────────────────────────────────────

function updateChrome(pageId, pushHistory = true) {
  const isTalk = pageId.startsWith('talk:');
  const bare = isTalk ? pageId.replace('talk:', '') : pageId;
  const fallback = bare.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  const articleH1 = !isTalk && document.querySelector('#wiki-content h1');
  const title = articleH1 ? articleH1.textContent.trim() : fallback;
  if (articleH1) articleH1.remove();
  const display = isTalk ? `Talk:${title}` : title;

  document.title = `${display} — WikiWiki`;
  const heading = document.getElementById('page-title');
  if (heading) heading.textContent = display;

  document.getElementById('tab-article')?.classList.toggle('selected', !isTalk);

  if (pushHistory) {
    history.pushState({ pageId }, '', `#${pageId}`);
  }
}

function hideTalkTab() {
  const tab = document.getElementById('tab-talk');
  if (tab) tab.style.display = 'none';
}

function hideEditTab() {
  const tab = document.getElementById('tab-edit');
  if (tab) tab.style.display = 'none';
}

// ── special states ────────────────────────────────────────────────────────────

function showNotFound(pageId) {
  const content = document.getElementById('wiki-content');
  if (content) {
    content.innerHTML = `
      <p>WikiWiki does not have an article with this exact name.</p>
      <p>The page <i>${pageId}</i> does not exist.</p>
    `;
  }
  const heading = document.getElementById('page-title');
  if (heading) heading.textContent = pageId;
}

export function getCurrentPageId() {
  return currentPageId;
}
