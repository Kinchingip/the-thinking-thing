// corruption.js — maps visit counts to page variants and applies DOM mutations

import { getVisitCount } from './state.js';

// Each page defines its own corruption thresholds.
// States: 'clean' | 'touched' | 'degraded' | 'corrupted'
// Add entries here as pages are written.
const PAGE_STATES = {
  'peculiar-mississippi': [
    { visits: 0, state: 'clean' },
    { visits: 2, state: 'touched' },
    { visits: 5, state: 'degraded' },
    { visits: 10, state: 'corrupted' },
  ],
  // TODO: fill in thresholds for other pages
};

export function getPageState(pageId) {
  const count = getVisitCount(pageId);
  const thresholds = PAGE_STATES[pageId];
  if (!thresholds) return 'clean';

  let current = 'clean';
  for (const { visits, state } of thresholds) {
    if (count >= visits) current = state;
  }
  return current;
}

// Called after a page's HTML is injected into the DOM.
// Applies visual corruption based on visit count.
export function applyCorruption(pageId) {
  const state = getPageState(pageId);
  const root = document.getElementById('wiki-content');
  if (!root) return;

  // Remove any previous state first so CSS transitions re-trigger
  delete root.dataset.corruptionState;
  requestAnimationFrame(() => { root.dataset.corruptionState = state; });

  switch (state) {
    case 'touched':
      applyTouched(root);
      break;
    case 'degraded':
      applyDegraded(root);
      break;
    case 'corrupted':
      applyCorrupted(root);
      break;
    default:
      break;
  }
}

// --- corruption levels ---

function applyTouched(root) {
  // Subtle: a word replaced, a sentence that wasn't there before
  // TODO: implement per-page touched mutations
}

function applyDegraded(root) {
  // Moderate: garbled text, broken links, timestamps that don't add up
  // TODO: implement per-page degraded mutations
}

function applyCorrupted(root) {
  // Severe: the page knows you're there
  // TODO: implement per-page corrupted mutations
  document.body.classList.add('corrupted');
}
