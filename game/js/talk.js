// talk.js — CAPTCHA renderer for talk pages
//
// Each chapter's talk page shows a CAPTCHA. Two authors exist:
//   - The Thinking Thing: harvests humans, generated these CAPTCHAs
//   - Ally: hijacked the format, embedded her distress signal inside
//
// The player doesn't know this at first. The CAPTCHAs look normal.
// Ally's framing text ghost-renders beneath (CSS strikethrough / opacity).
//
// CAPTCHA content is TBD — drop implementations into CAPTCHAS[id].render/validate.

import { recordChoice, setFlag } from './state.js';

// ── CAPTCHA definitions ──────────────────────────────────────────────────────
// Each entry:
//   allyText   — Ally's message, ghost-visible beneath the CAPTCHA prompt
//   render(el) — builds the interactive widget inside el
//   validate() — returns true if the human answer is correct
//   onPass(navigate) — called on correct answer
//   onFail(navigate) — called on wrong answer (may be called multiple times)

const CAPTCHAS = {

  ch1: {
    // Theme: Can you perceive humanly?
    allyText: '', // TODO: Ally's ghost message for ch1
    render(el) {
      el.innerHTML = `<p class="captcha-placeholder">[Chapter 1 CAPTCHA — to be designed]</p>`;
      // TODO: implement perception-based challenge
    },
    validate() {
      return false; // TODO: implement
    },
    onPass(navigate) {
      navigate('henry-liang'); // TODO: correct next page after ch1 CAPTCHA
    },
    onFail(_navigate) {
      // TODO: consequence for failing ch1
    },
  },

  ch2: {
    // Theme: Can you feel humanly?
    allyText: '', // TODO: Ally's ghost message for ch2
    render(el) {
      el.innerHTML = `<p class="captcha-placeholder">[Chapter 2 CAPTCHA — to be designed]</p>`;
      // TODO: implement empathy-based challenge
    },
    validate() {
      return false; // TODO: implement
    },
    onPass(navigate) {
      navigate('ally'); // TODO: correct next page after ch2 CAPTCHA
    },
    onFail(_navigate) {
      // TODO: consequence for failing ch2
    },
  },

  ch3: {
    // Theme: Can you choose humanly?
    // This one has a real binary: accept Ally's request or refuse.
    // The validate() / onPass / onFail pattern doesn't apply here —
    // renderCaptcha handles the accept/refuse buttons directly for this chapter.
    allyText: '', // TODO: Ally's full message
    render(el) {
      el.innerHTML = `<p class="captcha-placeholder">[Chapter 3 — Ally's message + accept/refuse — to be written]</p>`;
    },
    validate() { return false; },
    onPass(_navigate) {},
    onFail(_navigate) {},
  },

};

// ── Talk tab unlock map ──────────────────────────────────────────────────────
// pageId visited → which CAPTCHA talk tab to reveal, and after how many visits.

const TALK_UNLOCK = {
  ch1: { pageId: 'peculiar-mississippi', afterVisit: 1 },
  // ch2: { pageId: 'TODO', afterVisit: 1 },
  // ch3: { pageId: 'ally',  afterVisit: 1 },
};

// Page navigated to → CAPTCHA id
const PAGE_CAPTCHA = {
  'talk:ch1': 'ch1',
  'talk:ch2': 'ch2',
  'talk:ch3': 'ch3',
};

// ── public API ───────────────────────────────────────────────────────────────

// Called by router after every non-talk page load.
// navigate is passed in to break the circular import.
export function maybeShowTalkTab(pageId, visitCount, navigate) {
  for (const [captchaId, unlock] of Object.entries(TALK_UNLOCK)) {
    if (unlock.pageId === pageId && visitCount >= unlock.afterVisit) {
      showTalkTab(captchaId, navigate);
    }
  }
}

// Called by router when navigating to a talk: page.
export function renderCaptcha(pageId, navigate) {
  const captchaId = PAGE_CAPTCHA[pageId];
  const captcha = CAPTCHAS[captchaId];
  const container = document.getElementById('wiki-content');
  if (!container || !captcha) return;

  container.innerHTML = '';

  // Ally's ghost text — visible but visually subordinated (see CSS).
  if (captcha.allyText) {
    const ghost = document.createElement('div');
    ghost.className = 'captcha-ally-ghost';
    ghost.textContent = captcha.allyText;
    container.appendChild(ghost);
  }

  // The CAPTCHA prompt and widget.
  const body = document.createElement('div');
  body.className = 'captcha-body';
  captcha.render(body);
  container.appendChild(body);

  // Chapter 3 is special: accept / refuse instead of verify.
  if (captchaId === 'ch3') {
    renderFinalChoice(container, captcha, navigate);
    return;
  }

  // Standard verify button.
  const btn = document.createElement('button');
  btn.textContent = 'Verify';
  btn.className = 'captcha-submit mw-ui-button mw-ui-progressive';
  btn.onclick = () => {
    if (captcha.validate()) {
      recordChoice(pageId, 'pass');
      setFlag(`captcha_${captchaId}_passed`);
      captcha.onPass(navigate);
    } else {
      recordChoice(pageId, 'fail');
      btn.textContent = 'Try again';
      btn.classList.add('captcha-failed');
      captcha.onFail(navigate);
    }
  };
  container.appendChild(btn);
}

// ── internals ────────────────────────────────────────────────────────────────

function showTalkTab(captchaId, navigate) {
  const tab = document.getElementById('tab-talk');
  if (!tab) return;
  tab.style.display = '';
  tab.querySelector('a').onclick = (e) => {
    e.preventDefault();
    navigate(`talk:${captchaId}`);
  };
}

function renderFinalChoice(container, captcha, navigate) {
  const { setPlayerChoice } = window.__wikiwikiState ?? {};

  const actions = document.createElement('div');
  actions.className = 'captcha-final-actions';

  const accept = document.createElement('button');
  accept.textContent = 'Accept';
  accept.className = 'mw-ui-button mw-ui-progressive';
  accept.onclick = () => {
    import('./state.js').then(({ setPlayerChoice }) => {
      setPlayerChoice('accept');
      recordChoice('talk:ch3', 'accept');
      navigate('player-page');
    });
  };

  const refuse = document.createElement('button');
  refuse.textContent = 'Refuse';
  refuse.className = 'mw-ui-button mw-ui-destructive';
  refuse.onclick = () => {
    import('./state.js').then(({ setPlayerChoice }) => {
      setPlayerChoice('refuse');
      recordChoice('talk:ch3', 'refuse');
      triggerRefuseEnding();
    });
  };

  actions.appendChild(accept);
  actions.appendChild(refuse);
  container.appendChild(actions);
}

function triggerRefuseEnding() {
  // Ending B — handled by ending.js (to be written when endings are designed).
  // Dispatches a custom event so ending.js can own the sequence.
  document.dispatchEvent(new CustomEvent('wikiwiki:refuse'));
}
