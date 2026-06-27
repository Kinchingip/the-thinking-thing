// headtracking.js — dynamic loader for the face-mesh sketch used in Ending B
//
// Load order matters for p5 global mode:
//   1. headtracking-sketch.js  (defines window.setup / window.draw before p5 looks for them)
//   2. face_mesh.js            (defines window.FaceMesh before setup() calls it — optional)
//   3. p5.js                   (finds the globals and starts the sketch)

let _started = false;

function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
    const s = document.createElement('script');
    s.src = src;
    s.onload = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

export async function startHeadTracking() {
  if (_started) return;
  _started = true;

  // MediaPipe's WASM runtime calls window.alert() for certain WebGL errors.
  // Intercept and suppress only that specific message before loading any MediaPipe code.
  const _nativeAlert = window.alert.bind(window);
  window.alert = (msg) => {
    if (typeof msg === 'string' && msg.includes('WebGL')) return;
    _nativeAlert(msg);
  };

  // Sketch must load first — it defines window.setup / window.draw for p5 global mode.
  try {
    await loadScript('./js/headtracking-sketch.js');
  } catch {
    return; // nothing else can run without the sketch
  }

  // MediaPipe is optional — failure here degrades to particle-effects-only mode.
  try {
    await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh.js');
  } catch { /* face detection unavailable, sketch continues */ }

  // p5 starts the sketch. Loaded last so window.setup / window.draw are already defined.
  try {
    await loadScript('https://cdn.jsdelivr.net/npm/p5@1/lib/p5.min.js');
  } catch { /* p5 unavailable — canvas will not appear */ }
}

// Called after the 30-second silence to reveal the visualization.
// Polls until the canvas is in the DOM in case scripts are still loading.
export function revealHeadTracking() {
  let attempts = 0;
  function tryReveal() {
    const cnv = document.getElementById('face-riot-canvas');
    if (cnv) {
      cnv.style.transition = 'opacity 10s ease';
      cnv.style.opacity = '1';
      return;
    }
    if (attempts++ < 30) setTimeout(tryReveal, 500);
  }
  tryReveal();
}

export function hideHeadTracking() {
  const cnv = document.getElementById('face-riot-canvas');
  if (cnv) {
    cnv.style.transition = 'opacity 4s ease';
    cnv.style.opacity = '0';
  }
}
