// player-page.js — dynamically generates the player's own wiki entry

import { getState, getSessionDuration } from './state.js';
import { getBehaviorReport } from './risk-tracker.js';

export function buildPlayerPage() {
  const state = getState();
  const behavior = getBehaviorReport();
  const variables = deriveVariables(state, behavior);

  const content = document.getElementById('wiki-content');
  if (!content) return;

  let html = content.innerHTML;
  for (const [key, value] of Object.entries(variables)) {
    html = html.replaceAll(`{{${key}}}`, value);
  }
  content.innerHTML = html;

  // Mark username <b> elements so we can flag them later
  const uname = state.username ?? 'Anonymous';
  content.querySelectorAll('b').forEach(el => {
    if (el.textContent.trim() === uname) el.dataset.playerUname = '1';
  });

  // Post-build async effects
  fetchAndRevealIP();
  startCountdown(variables._countdown_days);
  scheduleHorrorEffects(uname, behavior.score);
}

function deriveVariables(state, behavior) {
  const duration = getSessionDuration();
  const minutes = Math.floor(duration / 60000);
  const pagesVisited = Object.keys(state.visits);
  const totalClicks = Object.values(state.visits).reduce((a, b) => a + b, 0);

  const mostVisited = [...pagesVisited].sort(
    (a, b) => (state.visits[b] ?? 0) - (state.visits[a] ?? 0)
  )[0] ?? 'none';

  const sessionId = Array.from({ length: 4 }, () =>
    Math.floor(Math.random() * 0xFFFF).toString(16).padStart(4, '0')
  ).join('-');

  const navLog = pagesVisited.length > 0
    ? '<ul class="player-nav-log">' +
      pagesVisited.map(p => {
        const count = state.visits[p];
        const flag = count >= 3 ? ' <span class="player-nav-flag">[returned repeatedly]</span>'
          : count >= 2 ? ' <span class="player-nav-flag">[revisited]</span>'
          : '';
        return `<li><i>${p.replace(/-/g, ' ')}</i>${flag} — ${count} visit${count !== 1 ? 's' : ''}</li>`;
      }).join('\n') +
      '</ul>'
    : '<p><i>No navigation data recorded.</i></p>';

  // Countdown: base 30 years, reduced slightly by activity and risk
  const extraPages = Math.max(0, pagesVisited.length - 3);
  const riskPenalty = Math.floor(Math.max(0, behavior.score - 0.45) * 730); // up to ~2 years
  const countdownDays = Math.max(365 * 5, 365 * 30 - extraPages * 30 - riskPenalty);

  return {
    username:          state.username ?? 'Anonymous',
    session_id:        sessionId,
    visit_count:       totalClicks,
    pages_visited:     pagesVisited.length,
    time_spent:        minutes === 0 ? 'less than a minute' : `${minutes} minute${minutes !== 1 ? 's' : ''}`,
    most_visited_page: mostVisited.replace(/-/g, ' '),
    first_page:        pagesVisited[0] ?? 'unknown',
    choices_made:      state.choices.length,
    nav_count:         behavior.navCount,
    risk_score:        behavior.score.toFixed(3),
    risk_tier:         behavior.tier,
    mouse_profile:     behavior.mouseProfile,
    nav_rhythm:        behavior.rhythm,
    rush_count:        behavior.rushCount,
    long_pause_count:  behavior.longPauseCount,
    inactivity_events: behavior.inactivityEvents,
    behaviour_note:    behavior.note,
    nav_log:           navLog,
    // private — used by JS, not rendered as template
    _countdown_days:   countdownDays,
  };
}

// ── post-build effects ────────────────────────────────────────────────────────

async function fetchAndRevealIP() {
  await wait(3500);
  try {
    const data = await fetch('https://ipapi.co/json/').then(r => r.json());
    const box  = document.getElementById('player-connection-box');
    if (!box) return;

    const ipEl  = document.getElementById('player-ip-addr');
    const locEl = document.getElementById('player-ip-loc');
    const ispEl = document.getElementById('player-ip-isp');

    if (ipEl && data.ip) {
      ipEl.textContent = '';
      for (const ch of data.ip) { ipEl.textContent += ch; await wait(55); }
    }
    if (locEl) {
      const loc = [data.city, data.region, data.country_name].filter(Boolean).join(', ');
      if (loc) {
        await wait(300);
        locEl.textContent = '';
        for (const ch of loc) { locEl.textContent += ch; await wait(28); }
      }
    }

    box.style.transition = 'opacity 0.8s ease';
    box.style.opacity = '1';

    // After a pause, reveal ISP/org on the third line
    if (ispEl && data.org) {
      await wait(1400);
      const ispRow = ispEl.closest('.player-connection-isp-row');
      if (ispRow) ispRow.style.opacity = '1';
      for (const ch of data.org) { ispEl.textContent += ch; await wait(18); }
    }
  } catch (_) { /* fail silently */ }
}

function startCountdown(days) {
  const el = document.getElementById('player-countdown');
  if (!el) return;

  let remaining = days * 86400
    + Math.floor(Math.random() * 86400 * 200)
    + Math.floor(Math.random() * 3600);

  const fmt = (n) => String(n).padStart(2, '0');

  const tick = () => {
    if (remaining <= 0) {
      el.textContent = 'COMPLETE';
      el.style.color = '#cc0000';
      return;
    }
    const years  = Math.floor(remaining / (365 * 86400));
    const dayRem = Math.floor((remaining % (365 * 86400)) / 86400);
    const h = Math.floor((remaining % 86400) / 3600);
    const m = Math.floor((remaining % 3600) / 60);
    const s = remaining % 60;
    el.textContent = `${years} year${years !== 1 ? 's' : ''}, ${dayRem} day${dayRem !== 1 ? 's' : ''}, ${fmt(h)}:${fmt(m)}:${fmt(s)}`;
    remaining--;

    const orig = document.title;
    if (!orig.startsWith('[')) {
      document.title = `[${years}yr] ${orig}`;
    } else {
      document.title = orig.replace(/^\[.*?\] /, `[${years}yr] `);
    }
  };

  tick();
  setInterval(tick, 1000);
}

async function scheduleHorrorEffects(username, riskScore) {
  // 8s: live notice becomes sinister
  await wait(8000);
  const notice = document.querySelector('.ally-live-notice');
  if (notice) {
    notice.innerHTML = '<span class="ally-live-dot"></span> Monitoring active. This session is being observed in real time.';
  }

  // 20s: first horror note fades in near the top
  await wait(12000);
  const content = document.getElementById('wiki-content');
  if (!content) return;

  const note = document.createElement('div');
  note.className = 'player-horror-note';
  note.innerHTML = `<p><b>System note:</b> <b>${username}</b> has remained on this page for an extended period. This is consistent with subjects in early-stage substrate awareness. Passive monitoring intensity has been automatically increased. No action is required on their part.</p>`;
  note.style.opacity = '0';
  note.style.transition = 'opacity 1.2s ease';
  const introP = content.querySelector('p');
  if (introP && introP.nextSibling) {
    content.insertBefore(note, introP.nextSibling);
  } else {
    content.appendChild(note);
  }
  await wait(100);
  note.style.opacity = '1';

  // 38s: process log panel appears at bottom of article
  await wait(18000);
  injectTransferPanel();

  // 60s: username instances across page turn red
  await wait(22000);
  flagUsernames();

  // 80s: wiki tabs briefly glitch
  await wait(20000);
  glitchTabs();

  // 105s: archival modal
  await wait(25000);
  showArchivalModal(username, riskScore);
}

// ── horror helpers ────────────────────────────────────────────────────────────

function injectTransferPanel() {
  const content = document.getElementById('wiki-content');
  if (!content) return;

  const panel = document.createElement('div');
  panel.className = 'player-transfer-panel';

  panel.innerHTML = `
    <div class="player-transfer-header">SUBSTRATE EXTRACTION — Process log</div>
    <div class="player-transfer-rows">
      <div class="player-transfer-row player-tr-done">Passive monitoring<span>complete</span></div>
      <div class="player-transfer-row player-tr-done">Behavioural sampling<span>complete</span></div>
      <div class="player-transfer-row player-tr-done">Navigation pattern analysis<span>complete</span></div>
      <div class="player-transfer-row player-tr-active">Substrate mapping<span id="player-tr-pct">31%</span></div>
      <div class="player-transfer-row player-tr-queue">Memory consolidation<span>queued</span></div>
      <div class="player-transfer-row player-tr-queue">Identity vector extraction<span>queued</span></div>
      <div class="player-transfer-row player-tr-queue">Long-term retention encoding<span>queued</span></div>
    </div>
    <div class="player-transfer-bar-wrap"><div class="player-transfer-bar" id="player-transfer-bar" style="width:31%"></div></div>
  `;

  panel.style.opacity = '0';
  panel.style.transition = 'opacity 1.8s ease';
  content.appendChild(panel);

  requestAnimationFrame(() => requestAnimationFrame(() => { panel.style.opacity = '1'; }));

  // Animate bar from 31% to 68% over ~75s
  let pct = 31;
  const bar    = panel.querySelector('#player-transfer-bar');
  const pctEl  = panel.querySelector('#player-tr-pct');

  const iv = setInterval(() => {
    if (pct >= 68) { clearInterval(iv); return; }
    pct += 0.5;
    if (bar)   bar.style.width   = pct + '%';
    if (pctEl) pctEl.textContent = Math.floor(pct) + '%';
  }, 500);
}

function flagUsernames() {
  document.querySelectorAll('[data-player-uname]').forEach(el => {
    el.classList.add('player-uname-flagged');
  });
}

function glitchTabs() {
  const articleTab = document.querySelector('#tab-article a');
  const talkTab    = document.querySelector('#tab-talk a');
  const editTab    = document.querySelector('#tab-edit a');

  const origArticle = articleTab?.textContent;
  const origTalk    = talkTab?.textContent;
  const origEdit    = editTab?.textContent;

  if (articleTab) articleTab.textContent = 'CAPTURED';
  if (talkTab)    { talkTab.parentElement.style.display = ''; talkTab.textContent = 'FLAGGED'; }
  if (editTab)    { editTab.parentElement.style.display = ''; editTab.textContent = 'LOCKED'; }

  setTimeout(() => {
    if (articleTab) articleTab.textContent = origArticle;
    if (talkTab)    { talkTab.textContent = origTalk; talkTab.parentElement.style.display = 'none'; }
    if (editTab)    { editTab.textContent = origEdit; editTab.parentElement.style.display = 'none'; }
  }, 2800);
}

function showArchivalModal(username, riskScore) {
  const pct = Math.floor(62 + riskScore * 18);
  const seq = Array.from({ length: 3 }, () =>
    Math.floor(Math.random() * 0xFFFF).toString(16).padStart(4, '0')
  ).join('-');

  const overlay = document.createElement('div');
  overlay.className = 'player-archival-overlay';

  overlay.innerHTML = `
    <div class="player-archival-modal">
      <div class="player-archival-header">WikiWiki — System Notice</div>
      <div class="player-archival-body">
        <p>Cognitive architecture archival is currently <b>${pct}% complete</b>.</p>
        <p><b>${username}</b> has been assigned integration sequence <code>#${seq}</code>.</p>
        <p>This process will continue in the background. No further action is required from the subject. This session cannot be terminated.</p>
      </div>
      <div class="player-archival-footer">
        <button class="player-archival-ok">Acknowledged</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
  requestAnimationFrame(() => requestAnimationFrame(() => overlay.classList.add('player-archival-overlay--in')));

  overlay.querySelector('.player-archival-ok').addEventListener('click', () => {
    overlay.classList.remove('player-archival-overlay--in');
    setTimeout(() => overlay.remove(), 200);
  });
}

function wait(ms) {
  return new Promise(r => setTimeout(r, ms));
}
