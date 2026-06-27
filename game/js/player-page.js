// player-page.js — dynamically generates the player's own wiki entry

import { getState, getSessionDuration } from './state.js';
import { getBehaviorReport } from './risk-tracker.js';

// Called when player-page is loaded. Replaces {{variables}} in the static HTML
// with data collected about the player's actual session.
export function buildPlayerPage() {
  const state = getState();
  const variables = deriveVariables(state);

  const content = document.getElementById('wiki-content');
  if (!content) return;

  let html = content.innerHTML;
  for (const [key, value] of Object.entries(variables)) {
    html = html.replaceAll(`{{${key}}}`, value);
  }
  content.innerHTML = html;
}

function deriveVariables(state) {
  const duration = getSessionDuration();
  const minutes = Math.floor(duration / 60000);
  const pagesVisited = Object.keys(state.visits);
  const totalClicks = Object.values(state.visits).reduce((a, b) => a + b, 0);

  const mostVisited = [...pagesVisited].sort(
    (a, b) => (state.visits[b] ?? 0) - (state.visits[a] ?? 0)
  )[0] ?? 'none';

  const behavior = getBehaviorReport();

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
  };
}
