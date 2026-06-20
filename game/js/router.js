// router.js — intercepts internal wiki links, loads pages without a real navigation

import { recordVisit } from './state.js';
import { applyCorruption } from './corruption.js';
import { maybeShowTalkTab } from './talk.js';

const PAGES_DIR = './pages/';

// Page IDs that exist. Build script keeps this in sync.
const KNOWN_PAGES = [
  'peculiar-mississippi',
  'muscipulavirus',
  'henry-liang',
  'the-signal-remains',
  'first-baptist-church',
  'list-of-residents',
  'the-cartographers',
  'substrate-transcription',
  'player-page',
  // talk pages
  'talk:hinge-1',
  'talk:hinge-2',
  'talk:hinge-3',
  'talk:hinge-4',
];

let currentPageId = null;

export function init() {
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[data-page]');
    if (!link) return;
    e.preventDefault();
    navigate(link.dataset.page);
  });

  // Load entry page on startup
  navigate('peculiar-mississippi');
}

export function navigate(pageId) {
  if (!KNOWN_PAGES.includes(pageId)) {
    showNotFound(pageId);
    return;
  }

  currentPageId = pageId;
  const visitCount = recordVisit(pageId);

  fetchPage(pageId)
    .then((html) => {
      injectContent(html);
      applyCorruption(pageId);
      maybeShowTalkTab(pageId, visitCount);
      updateBrowserBar(pageId);
    })
    .catch(() => showNotFound(pageId));
}

async function fetchPage(pageId) {
  const isTalk = pageId.startsWith('talk:');
  const file = isTalk
    ? `${PAGES_DIR}talk-${pageId.slice(5)}.html`
    : `${PAGES_DIR}${pageId}.html`;
  const res = await fetch(file);
  if (!res.ok) throw new Error(`${res.status}`);
  return res.text();
}

function injectContent(html) {
  const content = document.getElementById('wiki-content');
  if (content) content.innerHTML = html;
  window.scrollTo(0, 0);
}

function updateBrowserBar(pageId) {
  const isTalk = pageId.startsWith('talk:');
  const bare = isTalk ? pageId.slice(5) : pageId;
  const title = bare.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  const display = isTalk ? `Talk:${title}` : title;

  document.title = `${display} — WikiWiki`;
  const heading = document.getElementById('page-title');
  if (heading) heading.textContent = display;

  history.pushState({ pageId }, '', `#${pageId}`);
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
