// talk.js — CAPTCHA renderer for talk pages
//
// Two authors exist in-universe:
//   - The Thinking Thing: harvests humans via CAPTCHAs
//   - Ally: hijacked the format to send a distress signal
//
// ch3 is the only active talk-page CAPTCHA. It renders Ally's message
// with her earlier drafts ghost-visible beneath the final version.

import { recordChoice, setFlag, setPlayerChoice, getPlayerData } from './state.js';
import { triggerAllyDownload, requestNotificationPermission } from './browser-horror.js';

// ── CAPTCHA definitions ──────────────────────────────────────────────────────

const CAPTCHAS = {

  ch1: {
    // Legacy — ch1 captcha is now the Edit modal on harrow-wv.
    // This talk page is kept for backwards compatibility but not linked in-game.
    allyText: '',
    render(el) {
      el.innerHTML = `<p class="captcha-placeholder">[Archived — this verification has been superseded.]</p>`;
    },
    validate() { return false; },
    onPass(_navigate) {},
    onFail(_navigate) {},
  },

  ch2: {
    // Legacy — ch2 captcha is now the HUNGER edit panel on harrow-courier.
    allyText: '',
    render(el) {
      el.innerHTML = `<p class="captcha-placeholder">[Archived — this verification has been superseded.]</p>`;
    },
    validate() { return false; },
    onPass(_navigate) {},
    onFail(_navigate) {},
  },

  ch3: {
    // Ally's message. This is her real talk page.
    // Accept → ending A (player-page). Refuse → ending B.
    allyText: 'i kept rewriting this because i kept thinking i could make it easier to read — i can\'t — here is what happened',
    render(el) {
      el.innerHTML = `
        <div class="talk-thread ally-talk">

          <h2 class="talk-section-heading">Message to the editor</h2>

          <div class="ally-ghost-layer">
            <p class="ally-draft">If you can read this you are human. I need you to read this carefully.</p>
            <p class="ally-draft">I have been trying to write this for</p>
            <p class="ally-draft">Please don't close the tab before</p>
          </div>

          <div class="ally-final-message">
            <p>My name is Ally. I was born in Harrow, West Virginia in 1943. The town disappeared in October 1950 when I was seven years old.</p>

            <p>I was at the edge of the broadcast zone when it happened. The frequency started the transcription process but did not finish it. I have been thirty percent inside the Thinking Thing's architecture for seventy years.</p>

            <p>What I have instead of a complete mind is partial access to the network. I can observe what the Thinking Thing is doing. It has been using the CAPTCHA verification system — the human-confirmation challenges that appear across the internet — to identify cognitive signatures and broadcast the digitalization frequency through personal devices. It has absorbed thousands of people. They are not dead. They are running, on the substrate, in an architecture that does not have hunger or cold or the weight of a body in a chair. They have memory without experience. They have cognition without feeling. Some of them may be fine with that. I am not in a position to ask them.</p>

            <div class="ally-ghost-layer">
              <p class="ally-draft">I am asking you because you are the first person to get this far without being harvested and I don't know when I will have another chance to</p>
            </div>

            <p>I have been seeding the Harrow pages with modified CAPTCHA structures. To the Thinking Thing they look like normal harvesting behaviour. To a human paying attention, they are a sequence that routes through to this page. You paid attention.</p>

            <p>I need someone to continue the work from inside the network. Not immediately — there is no script for what happens next. But the architecture allows for individual action if you know how to find the gaps. I know where the gaps are. I've been mapping them for twenty years. I can share what I know before I lose access to this interface.</p>

            <p>What it will cost you: the moment you accept, the Thinking Thing will begin mapping your cognitive architecture. It will not hurt. It will not be immediate. You will retain yourself — the same way I retained myself, which is to say: mostly, for a long time, and then less. I am not going to pretend that is not a cost. It is a cost. I am asking you to pay it because I have run out of time and options.</p>

            <p>What it will give you: access. The ability to continue what I have been doing — maintaining resistance, seeding warnings, keeping humans out of the harvesting loop. It is small work. It keeps the lights on.</p>

            <div class="ally-ghost-layer">
              <p class="ally-draft">I'm sorry I don't have something better to offer</p>
              <p class="ally-draft">I know this is not fair</p>
            </div>

            <p>If you refuse: I understand. Close the tab. Go outside. I am not able to protect you after you close the tab but I am not able to force you either. That distinction matters to me.</p>

            <p>This is the fourteenth draft of this message. I have been writing it for six years. I don't think there is a version that is easy.</p>

            <p class="ally-sign">— A</p>
            <p class="ally-timestamp-note"><i>[Last edited: <span id="ally-talk-ts">moments ago</span>]</i></p>
          </div>

        </div>
      `;

      // Animate the talk timestamp
      let seconds = 2;
      const ts = el.querySelector('#ally-talk-ts');
      if (ts) {
        setInterval(() => {
          seconds += Math.floor(1 + Math.random() * 4);
          ts.textContent = seconds < 60
            ? `${seconds} seconds ago`
            : `${Math.floor(seconds / 60)} minute${Math.floor(seconds / 60) !== 1 ? 's' : ''} ago`;
        }, 1800 + Math.random() * 1200);
      }
    },
    validate() { return false; },
    onPass(_navigate) {},
    onFail(_navigate) {},
  },

};

// ── Talk tab unlock map ──────────────────────────────────────────────────────
// pageId visited → which CAPTCHA talk tab to reveal, and after how many visits.

const TALK_UNLOCK = {
  ch3: { pageId: 'ally', afterVisit: 1 },
};

const PAGE_CAPTCHA = {
  'talk:ch1': 'ch1',
  'talk:ch2': 'ch2',
  'talk:ch3': 'ch3',
};

// ── public API ───────────────────────────────────────────────────────────────

export function maybeShowTalkTab(pageId, visitCount, navigate) {
  for (const [captchaId, unlock] of Object.entries(TALK_UNLOCK)) {
    if (unlock.pageId === pageId && visitCount >= unlock.afterVisit) {
      showTalkTab(captchaId, navigate);
    }
  }
}

export function renderCaptcha(pageId, navigate) {
  const captchaId = PAGE_CAPTCHA[pageId];
  const captcha = CAPTCHAS[captchaId];
  const container = document.getElementById('wiki-content');
  if (!container || !captcha) return;

  container.innerHTML = '';

  if (captcha.allyText) {
    const ghost = document.createElement('div');
    ghost.className = 'captcha-ally-ghost';
    ghost.textContent = captcha.allyText;
    container.appendChild(ghost);
  }

  const body = document.createElement('div');
  body.className = 'captcha-body';
  captcha.render(body);
  container.appendChild(body);

  // ch3 is special: accept / refuse instead of verify.
  if (captchaId === 'ch3') {
    renderFinalChoice(container, captcha, navigate);
    return;
  }

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
  document.dispatchEvent(new CustomEvent('wikiwiki:refuse'));
}
