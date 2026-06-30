// dark-mode.js — global dark mode toggle; sidebar portlet appears after Andy's page unlocks it.
// Dispatches 'wikiwiki:dark-mode-on' on the document each time dark mode is activated,
// so page-specific code can respond without coupling to this module.

import { setFlag, getFlag, getPlayerData } from './state.js';

const FLAG_UNLOCKED = 'dark_mode_unlocked';
const FLAG_ACTIVE   = 'dark_mode_active';

export function unlockDarkMode() {
  setFlag(FLAG_UNLOCKED);
}

export function initDarkModeToggle() {
  if (!getFlag(FLAG_UNLOCKED)) return;

  const panel = document.getElementById('sidebar-appearance');
  if (panel) panel.style.display = '';

  // Restore persisted state on page load — no horror on reload
  if (getFlag(FLAG_ACTIVE)) {
    document.body.classList.add('dark-mode');
    syncBtn(true);
  }

  const btn = document.getElementById('dark-mode-btn');
  if (!btn || btn.dataset.bound) return;
  btn.dataset.bound = '1';

  btn.addEventListener('click', () => {
    const activating = !document.body.classList.contains('dark-mode');
    document.body.classList.toggle('dark-mode', activating);
    setFlag(FLAG_ACTIVE, activating);
    syncBtn(activating);

    if (activating) {
      triggerHorror();
      document.dispatchEvent(new CustomEvent('wikiwiki:dark-mode-on'));
    }
  });
}

function syncBtn(isDark) {
  const btn = document.getElementById('dark-mode-btn');
  if (btn) btn.textContent = isDark ? 'Light mode' : 'Dark mode';
}

function triggerHorror() {
  // 1. Multi-phase flicker
  const flash = document.createElement('div');
  flash.className = 'dark-mode-flash';
  document.body.appendChild(flash);
  setTimeout(() => flash.remove(), 950);

  // 2. Body shake
  document.body.classList.add('dark-mode-shake');
  setTimeout(() => document.body.classList.remove('dark-mode-shake'), 600);

  // 3. Title corruption
  const heading = document.getElementById('page-title');
  if (heading) {
    const orig = heading.textContent;
    heading.textContent = 'CONNECTION ESTABLISHED';
    setTimeout(() => { heading.textContent = orig; }, 480);
  }

  // 4. Search box briefly corrupts
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    const origPlaceholder = searchInput.placeholder;
    searchInput.placeholder = 'we see you';
    setTimeout(() => { searchInput.placeholder = origPlaceholder; }, 700);
  }

  // 5. Personalized "WE SEE YOU" full-screen overlay — appears at flash peak
  setTimeout(() => {
    const { username } = getPlayerData();
    const text = username
      ? `WE SEE YOU, ${username.toUpperCase()}`
      : 'WE SEE YOU';

    const overlay = document.createElement('div');
    overlay.className = 'dark-mode-intrusion';
    overlay.innerHTML = `<span class="dark-mode-intrusion-text">${text}</span>`;
    document.body.appendChild(overlay);
    setTimeout(() => overlay.remove(), 1700);
  }, 180);
}
