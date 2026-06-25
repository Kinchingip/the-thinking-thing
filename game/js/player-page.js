// player-page.js — dynamically generates the player's own wiki entry

import { getState, getSessionDuration } from './state.js';

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

  // The page that was visited most obsessively
  const mostVisited = pagesVisited.sort(
    (a, b) => (state.visits[b] ?? 0) - (state.visits[a] ?? 0)
  )[0] ?? 'none';

  return {
    username: state.username ?? 'Anonymous',
    visit_count: totalClicks,
    pages_visited: pagesVisited.length,
    time_spent: minutes === 0 ? 'less than a minute' : `${minutes} minute${minutes !== 1 ? 's' : ''}`,
    most_visited_page: mostVisited.replace(/-/g, ' '),
    first_page: pagesVisited[0] ?? 'unknown',
    choices_made: state.choices.length,
  };
}
