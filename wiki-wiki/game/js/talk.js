// talk.js — the "hinge" dialogue system rendered in talk-page tabs

import { getTalkStep, advanceTalk, setFlag } from './state.js';
import { navigate } from './router.js';

// Dialogue scripts live here.
// Each hinge is an array of steps; each step has lines and an optional trigger.
// TODO: fill in actual dialogue as story is written.
const SCRIPTS = {
  'hinge-1': [
    // { lines: ['...', '...'], trigger: null }
  ],
  'hinge-2': [
    // { lines: ['...'], trigger: { flag: 'hinge2_link_given' } }
  ],
  'hinge-3': [],
  'hinge-4': [],
};

// Which page visit unlocks each hinge tab.
const HINGE_UNLOCK = {
  'hinge-1': { pageId: 'peculiar-mississippi', afterVisit: 1 },
  // TODO: fill in unlock conditions for other hinges
};

export function maybeShowTalkTab(pageId, visitCount) {
  for (const [hingeId, unlock] of Object.entries(HINGE_UNLOCK)) {
    if (unlock.pageId === pageId && visitCount >= unlock.afterVisit) {
      showTalkTab(hingeId);
    }
  }
}

function showTalkTab(hingeId) {
  const tab = document.getElementById('tab-talk');
  if (!tab) return;
  tab.style.display = '';
  tab.dataset.hinge = hingeId;
  tab.querySelector('a').onclick = (e) => {
    e.preventDefault();
    navigate(`talk:${hingeId}`);
  };
}

// Called when a talk page is loaded.
export function renderDialogue(hingeId) {
  const script = SCRIPTS[hingeId];
  if (!script) return;

  const step = getTalkStep(hingeId);
  const container = document.getElementById('talk-dialogue');
  if (!container) return;

  if (step >= script.length) {
    container.innerHTML = '<p class="talk-end">[No further messages.]</p>';
    return;
  }

  const current = script[step];
  container.innerHTML = current.lines.map((l) => `<p class="talk-line">${l}</p>`).join('');

  const next = document.getElementById('talk-next');
  if (next) {
    next.style.display = step < script.length - 1 ? 'inline' : 'none';
    next.onclick = () => {
      const newStep = advanceTalk(hingeId);
      if (current.trigger?.flag) setFlag(current.trigger.flag);
      renderDialogue(hingeId);
    };
  }
}
