// router.js — handles all navigation. Pages are one-way: leaving a page consumes it.

import { recordVisit, setCurrentPage, getCurrentPage } from './state.js';
import { maybeShowTalkTab, renderCaptcha } from './talk.js';
import { initEditTab, initAllyPage, initPlayerPage } from './edit.js';
import { initPasswordGates } from './password.js';
import { initTurtleSoup } from './turtle-soup.js';
import { applyDisintegration } from './disintegrate.js';
import { initRiskTracker, recordNavigation } from './risk-tracker.js';

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
  // Chapter 3 — Ally
  'ally',
  // Endings
  'player-page',
  // Utility
  'list-of-residents',
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
  initPasswordGates();
  initEditTab(pageId, navigate);
  maybeShowTalkTab(pageId, visitCount, navigate);
  applyDisintegration(pageId, visitCount);

  if (pageId === 'ally') initAllyPage();
  if (pageId === 'player-page') initPlayerPage();
  if (pageId === 'the-signal-remains') initTurtleSoup();
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
