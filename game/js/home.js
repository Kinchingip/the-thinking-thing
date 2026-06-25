// home.js — login / welcome screen
//
// The home screen IS a wiki page — it renders inside #wiki-content
// so the player never leaves the Wikipedia aesthetic.
// ESC from anywhere in the game returns here (acts as a pause / save point).
// State is always auto-saved to localStorage; "saving" is just showing this screen.

import { getUsername, setUsername, collectPlayerData, reset } from './state.js';
import { startGame, init as initRouter } from './router.js';
import { checkTestMode } from './ending.js';
import { checkDeferredNotification } from './browser-horror.js';

export function init() {
  // Replace the initial browser history entry with the home marker so that
  // pressing back from inside the game lands here instead of leaving the app.
  history.replaceState({ isHome: true }, '', location.pathname + location.search);

  initRouter(showHome);
  checkDeferredNotification(); // fires stored notification if 24h have passed since last visit

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') showHome();
  });

  showHome();
}

export function showHome() {
  const username = getUsername();
  username ? showWelcomeBack(username) : showLogin();
}

// ── login screen ─────────────────────────────────────────────────────────────

function showLogin() {
  setChrome('Log in');

  const content = document.getElementById('wiki-content');
  content.innerHTML = `
    <div class="home-login">
      <div class="home-login-info">
        <p>You must be logged in to contribute to WikiWiki.</p>
      </div>
      <form id="home-form" autocomplete="off" novalidate>
        <div class="home-field">
          <label for="home-username">Username</label>
          <input id="home-username" class="mw-ui-input" type="text" spellcheck="false" />
        </div>
        <div class="home-field">
          <label for="home-password">Password</label>
          <input id="home-password" class="mw-ui-input" type="password" />
        </div>
        <div class="home-field home-field--inline">
          <input id="home-remember" type="checkbox" checked />
          <label for="home-remember">Keep me logged in</label>
        </div>
        <div id="home-error" class="home-error" style="display:none">
          Please enter a username.
        </div>
        <button type="submit" class="mw-ui-button mw-ui-progressive home-submit">
          Log in
        </button>
      </form>
      <div class="home-divider"></div>
      <p class="home-secondary">
        Don't have an account?
        <a id="home-create" href="#">Create account</a>
      </p>
    </div>
  `;

  const form = document.getElementById('home-form');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const val = document.getElementById('home-username').value.trim();
    if (!val) {
      document.getElementById('home-error').style.display = '';
      return;
    }
    handleLogin(val);
  });

  // Create account is a dead end — classic horror detail.
  document.getElementById('home-create').addEventListener('click', (e) => {
    e.preventDefault();
    showCreateAccountDead();
  });

  document.getElementById('home-username').focus();
}

// ── welcome back screen ───────────────────────────────────────────────────────

function showWelcomeBack(username) {
  setChrome('Log in');

  const content = document.getElementById('wiki-content');
  content.innerHTML = `
    <div class="home-login">
      <p>Welcome back, <b>${esc(username)}</b>.</p>
      <p class="home-secondary-text">Your progress has been saved.</p>
      <div class="home-actions">
        <button id="home-continue" class="mw-ui-button mw-ui-progressive">Continue</button>
        <button id="home-newgame" class="mw-ui-button">Start over</button>
      </div>
    </div>
  `;

  document.getElementById('home-continue').onclick = () => {
    document.body.dataset.username = username;
    startGame();
  };
  document.getElementById('home-newgame').onclick = () => {
    reset();
    showLogin();
  };
}

// ── dead-end create account ───────────────────────────────────────────────────

function showCreateAccountDead() {
  setChrome('Create account');

  const content = document.getElementById('wiki-content');
  content.innerHTML = `
    <div class="home-login">
      <p>Account creation is currently disabled.</p>
      <p class="home-secondary-text">
        <a id="home-back-login" href="#">← Return to log in</a>
      </p>
    </div>
  `;

  document.getElementById('home-back-login').onclick = (e) => {
    e.preventDefault();
    showLogin();
  };
}

// ── helpers ───────────────────────────────────────────────────────────────────

async function handleLogin(username) {
  setUsername(username);
  document.body.dataset.username = username;
  collectPlayerData(); // fire-and-forget — non-blocking
  if (checkTestMode()) return; // ?test=ending-b skips the game
  startGame();
}

function setChrome(title) {
  document.title = `${title} — WikiWiki`;
  const heading = document.getElementById('page-title');
  if (heading) heading.textContent = title;
  // Hide the talk tab on the home screen
  const talkTab = document.getElementById('tab-talk');
  if (talkTab) talkTab.style.display = 'none';
}

function esc(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
