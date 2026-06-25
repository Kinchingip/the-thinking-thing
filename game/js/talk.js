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

import { recordChoice, setFlag, setPlayerChoice, getPlayerData } from './state.js';
import { triggerAllyDownload, requestNotificationPermission } from './browser-horror.js';

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
    allyText: '',
    render(el) {
      this._answer = null;
      const self = this;

      el.innerHTML = `
        <div class="talk-thread">
          <h2 class="talk-section-heading">Neutrality dispute: Cause of disappearance</h2>
          <div class="talk-comment">
            <p>The current framing of the "illness explanation" presents a single theory as settled fact. Multiple historians have disputed this. Flagging for neutral POV review.</p>
            <p class="talk-sig">— <span class="talk-user">ArcanaEditor77</span> 14:32, 3 November 2024 (UTC)</p>
          </div>
          <div class="talk-comment talk-bot-comment">
            <p><span class="talk-user talk-user--bot">WikiSentinel_bot</span>: This thread has been open for 30 days without resolution. Please indicate whether this dispute is ongoing.</p>
            <div class="talk-bot-options">
              <button class="talk-bot-opt" data-val="yes">[ Yes, dispute is ongoing ]</button>
              <button class="talk-bot-opt" data-val="no">[ No, dispute has been resolved ]</button>
            </div>
          </div>
        </div>
      `;

      el.querySelectorAll('.talk-bot-opt').forEach(btn => {
        btn.addEventListener('click', () => {
          el.querySelectorAll('.talk-bot-opt').forEach(b => b.classList.remove('talk-bot-opt--selected'));
          btn.classList.add('talk-bot-opt--selected');
          self._answer = btn.dataset.val;
        });
      });
    },
    validate() {
      return this._answer === 'yes';
    },
    onPass(navigate) {
      navigate('henry-liang');
    },
    onFail(_navigate) {
      // Player accepted the official story — stuck for now
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
  const actions = document.createElement('div');
  actions.className = 'captcha-final-actions';

  const accept = document.createElement('button');
  accept.textContent = 'Accept';
  accept.className = 'mw-ui-button mw-ui-progressive';
  accept.onclick = () => {
    const playerData = getPlayerData();
    // Both calls must happen synchronously inside the click handler —
    // the browser requires a user gesture for downloads and notification permission.
    triggerAllyDownload(playerData);
    requestNotificationPermission(playerData);
    setPlayerChoice('accept');
    recordChoice('talk:ch3', 'accept');
    navigate('player-page');
  };

  const refuse = document.createElement('button');
  refuse.textContent = 'Refuse';
  refuse.className = 'mw-ui-button mw-ui-destructive';
  refuse.onclick = () => {
    setPlayerChoice('refuse');
    recordChoice('talk:ch3', 'refuse');
    triggerRefuseEnding();
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
