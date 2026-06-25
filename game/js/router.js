// router.js — handles all navigation. Pages are one-way: leaving a page consumes it.

import { recordVisit, consumePage, isConsumed, setCurrentPage, getCurrentPage } from './state.js';
import { maybeShowTalkTab, renderCaptcha } from './talk.js';

const PAGES_DIR = './pages/';

const KNOWN_PAGES = [
  // Chapter 1 — The Town
  'peculiar-mississippi',
  'first-baptist-church',
  'list-of-residents',
  'the-cartographers',
  'substrate-transcription',
  // Chapter 2 — The Residents
  'henry-liang',
  'muscipulavirus',
  'the-signal-remains',
  'survivor-name',
  // Chapter 3 — Ally
  'ally',             // TODO: rename md file when written
  // Endings
  'player-page',
  // Talk pages (CAPTCHAs)
  'talk:ch1',
  'talk:ch2',
  'talk:ch3',
];

let currentPageId = null;

export function init() {
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[data-page]');
    if (!link) return;
    e.preventDefault();
    navigate(link.dataset.page);
  });
}

// Called by home.js after login — resumes at last known page or starts fresh.
export function startGame() {
  const last = getCurrentPage();
  navigate(last && KNOWN_PAGES.includes(last) ? last : 'peculiar-mississippi');
}

export function navigate(pageId) {
  // Consumed pages show a tombstone — no going back.
  if (isConsumed(pageId)) {
    showTombstone(pageId);
    return;
  }

  if (!KNOWN_PAGES.includes(pageId)) {
    showNotFound(pageId);
    return;
  }

  // Consume the page we're leaving before loading the new one.
  if (currentPageId && currentPageId !== pageId) {
    consumePage(currentPageId);
  }

  currentPageId = pageId;
  setCurrentPage(pageId);
  const visitCount = recordVisit(pageId);

  const isTalk = pageId.startsWith('talk:');

  if (isTalk) {
    // CAPTCHAs are generated in JS, not fetched from disk.
    updateChrome(pageId);
    renderCaptcha(pageId, navigate);
    hideTalkTab();
  } else {
    fetchPage(pageId)
      .then((html) => {
        injectContent(html);
        maybeShowTalkTab(pageId, visitCount, navigate);
        updateChrome(pageId);
      })
      .catch(() => showNotFound(pageId));
  }
}

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

function updateChrome(pageId) {
  const isTalk = pageId.startsWith('talk:');
  const bare = isTalk ? pageId.replace('talk:', '') : pageId;
  const title = bare.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  const display = isTalk ? `Talk:${title}` : title;

  document.title = `${display} — WikiWiki`;
  const heading = document.getElementById('page-title');
  if (heading) heading.textContent = display;

  // Mark the article vs talk tab as active
  document.getElementById('tab-article')?.classList.toggle('selected', !isTalk);

  history.pushState({ pageId }, '', `#${pageId}`);
}

function hideTalkTab() {
  const tab = document.getElementById('tab-talk');
  if (tab) tab.style.display = 'none';
}

// ── special states ──

function showTombstone(pageId) {
  const title = pageId.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  const content = document.getElementById('wiki-content');
  if (content) {
    content.innerHTML = `
      <div class="mw-message-box mw-message-box-error tombstone">
        <p><b>This page has been deleted.</b></p>
        <p>The page "<i>${title}</i>" has been removed from WikiWiki.
           The deletion log for this page provides a record of recent deletions.</p>
        <p class="tombstone-log">Deletion log · <a data-page="list-of-residents">Contents</a></p>
      </div>
    `;
  }
  document.title = `${title} — WikiWiki`;
  const heading = document.getElementById('page-title');
  if (heading) heading.textContent = title;
}

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
