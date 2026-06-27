// risk-tracker.js — passive behavioural risk scoring, 0.0 (calm) → 1.0 (agitated)
// Never surfaces anything to the player. Score is readable by other systems.

let score    = 0.5;
const vels   = [];        // rolling mouse velocity samples
let lastMove = Date.now();
let lastNav  = Date.now();

let navCount         = 0;
let rushCount        = 0;
let longPauseCount   = 0;
let inactivityEvents = 0;

export function initRiskTracker() {
  document.addEventListener('mousemove', onMove);

  // Inactivity: no mouse movement for 25s nudges score up
  setInterval(() => {
    if (Date.now() - lastMove > 25_000) {
      nudge(0.008);
      inactivityEvents++;
    }
  }, 8000);
}

// Call at the start of every navigation — records dwell time on the page left behind
export function recordNavigation() {
  const dwell = Date.now() - lastNav;
  lastNav = Date.now();
  navCount++;

  if (dwell < 2500) {
    nudge(0.04);
    rushCount++;
  } else if (dwell > 90000) {
    nudge(0.025);
    longPauseCount++;
  } else {
    nudge(-0.008);
  }
}

export function getRiskScore() {
  return Math.round(score * 1000) / 1000;
}

export function getBehaviorReport() {
  const s = getRiskScore();
  const tier = s < 0.35 ? 'LOW' : s < 0.55 ? 'MODERATE' : s < 0.72 ? 'ELEVATED' : 'HIGH';

  const mouseProfile = s < 0.35 ? 'deliberate and consistent'
    : s < 0.55 ? 'variable'
    : s < 0.72 ? 'erratic'
    : 'highly erratic';

  const rushRatio = navCount > 0 ? rushCount / navCount : 0;
  const rhythm = rushRatio > 0.5 ? 'rushed'
    : longPauseCount > 2 ? 'hesitant'
    : 'irregular';

  const note = tier === 'LOW'
    ? 'The subject navigated methodically. Movement patterns suggest focused reading. No anomalies were flagged.'
    : tier === 'MODERATE'
    ? "The subject's navigation patterns were within expected parameters. Minor deviations in rhythm were recorded but not flagged."
    : tier === 'ELEVATED'
    ? 'Several anomalous navigation events were detected. Movement patterns suggest heightened awareness consistent with subjects who become conscious of monitoring during the session.'
    : "The subject's behaviour was significantly anomalous. Erratic movement and rushed navigation suggest acute stress or awareness of the monitoring system. This signature has been flagged for secondary review.";

  return { score: s, tier, mouseProfile, rhythm, navCount, rushCount, longPauseCount, inactivityEvents, note };
}

function onMove(e) {
  const now = Date.now();
  const dt  = now - lastMove;
  lastMove  = now;

  if (dt <= 0 || dt > 800) return; // skip event bursts and gaps

  const speed = Math.sqrt(e.movementX ** 2 + e.movementY ** 2) / dt;
  vels.push(speed);
  if (vels.length > 80) vels.shift();

  if (vels.length < 30) return;

  const mean = vels.reduce((a, b) => a + b, 0) / vels.length;
  if (mean === 0) return;

  const stddev = Math.sqrt(vels.reduce((acc, v) => acc + (v - mean) ** 2, 0) / vels.length);
  const cv = stddev / mean; // coefficient of variation: ~0.3 = smooth, ~1.5 = very erratic

  // Map cv to a [0,1] target and nudge score toward it slowly
  const target = Math.min(Math.max((cv - 0.3) / 1.2, 0), 1);
  nudge((target - score) * 0.003);
}

function nudge(delta) {
  score = Math.max(0, Math.min(1, score + delta));
}
