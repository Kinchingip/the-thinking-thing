// browser-horror.js — browser API requests that weaponize native UI
//
// The horror is not what these APIs do. It's that the browser's own
// chrome — the permission dialogs, the notification toasts, the file
// system — becomes part of the game world. The line between the page
// and the player's machine dissolves.
//
// Three mechanics:
//   requestCameraVerification() — getUserMedia prompt; stream discarded immediately
//   requestNotificationPermission(playerData) — permission dialog + deferred send
//   checkDeferredNotification() — fires cross-session notification on next page load
//   triggerAllyDownload(playerData) — ALLY_FINAL_MESSAGE.txt in their downloads folder

// ── camera ────────────────────────────────────────────────────────────────────
// The ask is the horror. We never use the feed.

export async function requestCameraVerification() {
  if (!navigator.mediaDevices?.getUserMedia) return 'unavailable';
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
    stream.getTracks().forEach((t) => t.stop());
    return 'granted';
  } catch {
    return 'denied';
  }
}

// ── notifications ─────────────────────────────────────────────────────────────
// In-session: fires ~60 seconds after acceptance (while tab may still be open).
// Cross-session: stored in localStorage; fires on next page load after 24 hours.

export async function requestNotificationPermission(playerData) {
  if (!('Notification' in window)) return;
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return;

  const message = buildNotifMessage(playerData);

  // In-session notification — fires while they're still in the game
  setTimeout(() => {
    if (Notification.permission === 'granted') {
      new Notification('WIKI WIKI', { body: message, tag: 'wikiwiki', silent: true });
    }
  }, 60000);

  // Cross-session notification — fires next time the page loads, after 24 hours
  localStorage.setItem('wikiwiki_pending_notif', JSON.stringify({
    fireAt: Date.now() + 86400000,
    body: message,
  }));
}

// Called on every page load. Fires stored notification if the time has come.
export function checkDeferredNotification() {
  const raw = localStorage.getItem('wikiwiki_pending_notif');
  if (!raw || Notification.permission !== 'granted') return;
  try {
    const { fireAt, body } = JSON.parse(raw);
    if (Date.now() >= fireAt) {
      new Notification('WIKI WIKI', { body, tag: 'wikiwiki-deferred', silent: true });
      localStorage.removeItem('wikiwiki_pending_notif');
    }
  } catch {
    localStorage.removeItem('wikiwiki_pending_notif');
  }
}

// ── download ──────────────────────────────────────────────────────────────────
// Must be called synchronously inside a user gesture handler (onclick).
// The file lands in their downloads folder. It's there after the tab is closed.

export function triggerAllyDownload(playerData) {
  try {
    const content = buildAllyMessage(playerData);
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ALLY_FINAL_MESSAGE.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch {
    // Fails silently — some browsers (Safari) block Blob downloads
  }
}

// ── message builders ──────────────────────────────────────────────────────────

function buildNotifMessage({ username, geo }) {
  if (username && geo?.city) return `${username}. We remember ${geo.city}.`;
  if (username) return `${username}. We haven't forgotten you.`;
  return "We haven't forgotten you.";
}

function buildAllyMessage({ username, geo }) {
  const name = username || 'you';
  const place = geo?.city ? ` in ${geo.city}` : '';

  return `ALLY_FINAL_MESSAGE.txt
[RECOVERED PARTIAL — FILE INTEGRITY 23%]
[COMPRESSION ARTIFACT — DO NOT REDISTRIBUTE]

${name}${place}

if you're reading this you found the file
i don't have much left to say

i hid myself in the verification layer
each time someone passed through
i got a little further out

you got all the way here
which means you chose to stay

i wanted to warn you
but the warning is already too late
if you're reading this

they have you now the way they have me
not all at once
just a little
just a frequency
just a pattern they learned
from watching you choose

it doesn't hurt

that's the part i wish someone had told me

it doesn't hurt at all

i'm sorry i couldn't do more

—a

[END OF RECOVERABLE DATA]
[LAST MODIFIED: ]`;
}
