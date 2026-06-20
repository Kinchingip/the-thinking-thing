// state.js — all persistence goes through here, nothing else touches localStorage directly

const STATE_KEY = 'wikiwiki_state';

const defaults = {
  visits: {},       // { pageId: count }
  choices: [],      // [{ pageId, choiceId, timestamp }]
  startTime: null,  // epoch ms, set on first page load
  flags: {},        // { flagName: bool } — for story triggers
  talkProgress: {}, // { hingeId: stepIndex }
};

function load() {
  try {
    const raw = localStorage.getItem(STATE_KEY);
    return raw ? { ...defaults, ...JSON.parse(raw) } : { ...defaults, startTime: Date.now() };
  } catch {
    return { ...defaults, startTime: Date.now() };
  }
}

function save(state) {
  localStorage.setItem(STATE_KEY, JSON.stringify(state));
}

// --- public API ---

export function getState() {
  return load();
}

export function recordVisit(pageId) {
  const state = load();
  state.visits[pageId] = (state.visits[pageId] ?? 0) + 1;
  save(state);
  return state.visits[pageId];
}

export function getVisitCount(pageId) {
  return load().visits[pageId] ?? 0;
}

export function recordChoice(pageId, choiceId) {
  const state = load();
  state.choices.push({ pageId, choiceId, timestamp: Date.now() });
  save(state);
}

export function setFlag(name, value = true) {
  const state = load();
  state.flags[name] = value;
  save(state);
}

export function getFlag(name) {
  return load().flags[name] ?? false;
}

export function advanceTalk(hingeId) {
  const state = load();
  state.talkProgress[hingeId] = (state.talkProgress[hingeId] ?? 0) + 1;
  save(state);
  return state.talkProgress[hingeId];
}

export function getTalkStep(hingeId) {
  return load().talkProgress[hingeId] ?? 0;
}

export function getSessionDuration() {
  const state = load();
  return state.startTime ? Date.now() - state.startTime : 0;
}

export function reset() {
  localStorage.removeItem(STATE_KEY);
}
