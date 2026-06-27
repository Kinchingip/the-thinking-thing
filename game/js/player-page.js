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

  // Post-build async effects
  fetchAndRevealIP();
  startCountdown(variables._countdown_days);
  scheduleHorrorEffects(state.username ?? 'Anonymous');
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

    if (ipEl && data.ip) {
      // type IP character by character
      ipEl.textContent = '';
      for (const ch of data.ip) {
        ipEl.textContent += ch;
        await wait(55);
      }
    }
    if (locEl) {
      const loc = [data.city, data.region, data.country_name].filter(Boolean).join(', ');
      if (loc) {
        await wait(300);
        locEl.textContent = '';
        for (const ch of loc) {
          locEl.textContent += ch;
          await wait(28);
        }
      }
    }

    box.style.transition = 'opacity 0.8s ease';
    box.style.opacity = '1';
  } catch (_) { /* fail silently */ }
}

function startCountdown(days) {
  const el = document.getElementById('player-countdown');
  if (!el) return;

  // random offset within a year so it's never exactly round
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
    const years = Math.floor(remaining / (365 * 86400));
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

async function scheduleHorrorEffects(username) {
  // 8s: live notice becomes more sinister
  await wait(8000);
  const notice = document.querySelector('.ally-live-notice');
  if (notice) {
    notice.innerHTML = '<span class="ally-live-dot"></span> Monitoring active. This session is being observed in real time.';
  }

  // 20s: a note fades in after the intro paragraph
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
}

function wait(ms) {
  return new Promise(r => setTimeout(r, ms));
}
