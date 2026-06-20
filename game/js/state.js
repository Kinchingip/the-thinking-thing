// state.js — all persistence goes through here, nothing else touches localStorage directly

const STATE_KEY = 'wikiwiki_state';

const defaults = {
  username: null,
  consumedPages: [],    // pages left behind — one-way, cannot return
  currentPage: null,    // last page the player was on
  playerChoice: null,   // 'accept' | 'refuse' — set in chapter 3
  ip: null,
  geo: null,            // { city, region, country, lat, lon }
  visits: {},           // { pageId: count }
  choices: [],          // [{ pageId, choiceId, timestamp }]
  startTime: null,
  flags: {},
  talkProgress: {},
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

// ── public API ──

export function getState() {
  return load();
}

export function getUsername() {
  return load().username;
}

export function setUsername(name) {
  const state = load();
  state.username = name;
  if (!state.startTime) state.startTime = Date.now();
  save(state);
}

// Silently collects IP and approximate location via ipapi.co.
// Called once at login. Fails silently if blocked.
export async function collectPlayerData() {
  try {
    const res = await fetch('https://ipapi.co/json/');
    const data = await res.json();
    const state = load();
    state.ip = data.ip ?? null;
    state.geo = {
      city: data.city ?? null,
      region: data.region ?? null,
      country: data.country_name ?? null,
      lat: data.latitude ?? null,
      lon: data.longitude ?? null,
    };
    save(state);
  } catch {
    // Non-critical — endings degrade gracefully if missing
  }
}

export function getPlayerData() {
  const { username, ip, geo } = load();
  return { username, ip, geo };
}

// ── one-way navigation ──

export function consumePage(pageId) {
  const state = load();
  if (!state.consumedPages.includes(pageId)) {
    state.consumedPages.push(pageId);
  }
  save(state);
}

export function isConsumed(pageId) {
  return load().consumedPages.includes(pageId);
}

export function setCurrentPage(pageId) {
  const state = load();
  state.currentPage = pageId;
  save(state);
}

export function getCurrentPage() {
  return load().currentPage;
}

// ── visits ──

export function recordVisit(pageId) {
  const state = load();
  state.visits[pageId] = (state.visits[pageId] ?? 0) + 1;
  save(state);
  return state.visits[pageId];
}

export function getVisitCount(pageId) {
  return load().visits[pageId] ?? 0;
}

// ── choices / flags ──

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

export function setPlayerChoice(choice) {
  const state = load();
  state.playerChoice = choice;
  save(state);
}

export function getPlayerChoice() {
  return load().playerChoice;
}

// ── talk / CAPTCHA progress ──

export function advanceTalk(hingeId) {
  const state = load();
  state.talkProgress[hingeId] = (state.talkProgress[hingeId] ?? 0) + 1;
  save(state);
  return state.talkProgress[hingeId];
}

export function getTalkStep(hingeId) {
  return load().talkProgress[hingeId] ?? 0;
}

// ── session ──

export function getSessionDuration() {
  const state = load();
  return state.startTime ? Date.now() - state.startTime : 0;
}

export function reset() {
  localStorage.removeItem(STATE_KEY);
}
