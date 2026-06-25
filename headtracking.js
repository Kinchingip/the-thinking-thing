let cam;
let faceMesh;
let faces = [];
let triangles = [];

let baseW = 1280;
let baseH = 720;
let nW = 0;
let nH = 0;
let oX = 0;
let oY = 0;

let camLayer;
let smoothedPoints = null;
let projected = [];
let prevProjected = [];
let faceCenter = { x: 0, y: 0 };
let prevFaceCenter = { x: 0, y: 0 };
let faceBounds = null;
let eyeDistance = 0;
let mouthOpen = 0;
let motionEnergy = 0;
let tracking = 0;

let showCameraTrash = false;
let showMesh = true;
let showType = true;
let showNoise = true;
let showBands = true;
let showTrails = true;
let showPoints = true;
let showAscii = false;
let showPopups = true;

let mode = 0;
let smearBuffer = [];
let punkDust = [];
let manifesto = [];
let tearBands = [];
let glitchPopups = [];

const FACE_OVAL = [
  10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288,
  397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136,
  172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109
];

const LEFT_EYE = [33, 160, 158, 133, 153, 144];
const RIGHT_EYE = [362, 385, 387, 263, 373, 380];
const UPPER_LIP = [61, 185, 40, 39, 37, 0, 267, 269, 270, 409, 291];
const LOWER_LIP = [61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291];
const BROW_L = [70, 63, 105, 66, 107];
const BROW_R = [336, 296, 334, 293, 300];

const ANCHORS = {
  forehead: 10,
  nose: 1,
  mouthTop: 13,
  mouthBottom: 14,
  chin: 152,
  leftEye: 33,
  rightEye: 263,
  leftTemple: 234,
  rightTemple: 454
};

const PUNK_WORDS = [
  'NO PROFILE', 'GLITCH BODY', 'SCAN RIOT', 'FACE ERROR', 'DIRTY SIGNAL',
  'PUNK VISION', 'XEROX SOUL', 'NO GOD MODE', 'BROKEN MIRROR', 'RUPTURE',
  'STATIC KISS', 'NO FILTER', 'RASTER VIOLENCE', 'FLESH DATA', 'NET RIOT',
  'BLACK SCREEN', 'ACID TRACE', 'UNKNOWN USER', 'MESH ATTACK', 'LOST FRAME'
];

const ASCII_SET = '@#W$9876543210?!abc;:+=-,._ '.split('');

function preload() {
  faceMesh = ml5.faceMesh({ maxFaces: 1, refineLandmarks: true });
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  pixelDensity(1);
  textFont('monospace');
  textStyle(BOLD);

  camLayer = createGraphics(windowWidth, windowHeight);

  cam = createCapture({
    video: {
      width: { ideal: baseW },
      height: { ideal: baseH },
      facingMode: 'user'
    },
    audio: false
  });
  cam.size(baseW, baseH);
  cam.hide();

  faceMesh.detectStart(cam, gotFaces);
  triangles = faceMesh.getTriangles ? faceMesh.getTriangles() : [];

  initDust();
  initManifesto();
  initTears();
  initPopups();
}

function gotFaces(results) {
  faces = results || [];
}

function initDust() {
  punkDust = [];
  const total = min(260, max(120, floor(width * height * 0.00014)));
  for (let i = 0; i < total; i++) {
    punkDust.push({
      x: random(width),
      y: random(height),
      vx: random(-0.4, 0.4),
      vy: random(-0.4, 0.4),
      r: random(1, 3.5),
      a: random(12, 80)
    });
  }
}

function initManifesto() {
  manifesto = [];
  const total = max(10, floor(width / 160));
  for (let i = 0; i < total; i++) {
    manifesto.push({
      x: random(width),
      y: random(height),
      word: random(PUNK_WORDS),
      speed: random(0.6, 2.4),
      size: random(10, 22),
      alpha: random(30, 120),
      drift: random(-0.6, 0.6)
    });
  }
}

function initTears() {
  tearBands = [];
  for (let i = 0; i < 14; i++) {
    tearBands.push({
      y: random(height),
      h: random(8, 26),
      speed: random(0.2, 1.4),
      phase: random(TWO_PI)
    });
  }
}

function initPopups() {
  glitchPopups = [];
  for (let i = 0; i < 7; i++) {
    glitchPopups.push(makePopup(true));
  }
}

function makePopup(initial = false) {
  return {
    x: random(width * 0.08, width * 0.78),
    y: random(height * 0.12, height * 0.76),
    w: random(160, 320),
    h: random(72, 170),
    life: initial ? random(0.2, 1) : 0,
    target: initial ? 1 : 0,
    timer: int(random(12, 70)),
    driftX: random(-2.4, 2.4),
    driftY: random(-1.6, 1.6),
    title: random(['SCAN ERROR', 'VOID PANEL', 'UNKNOWN USER', 'PIRATE FEED', 'DATA WOUND', 'SIGNAL LOSS', 'NO PROFILE']),
    lines: [random(PUNK_WORDS), random(PUNK_WORDS), random(PUNK_WORDS)]
  };
}

function draw() {
  const p = getPalette();
  updateVideoCover();
  updateCameraLayer();
  updateTracking();
  updatePopups();

  background(p.bg);

  if (showCameraTrash) drawCameraTrashBackground(p);
  if (showNoise) drawPhotocopyNoise(p);
  drawTornBands(p);
  drawDust(p);

  if (projected.length > 0) {
    if (showTrails) drawFaceSmears(p);
    drawFaceRiotStructure(p);
    drawFaceRippedContours(p);
    if (showPoints) drawPointAggression(p);
    if (showBands) drawScreamBands(p);
    drawEyesCrosshair(p);
    drawMouthScream(p);
    drawOrbitTags(p);
    if (showType) drawStickerTexts(p);
    pushFaceMemory();
  } else {
    drawNoFacePoster(p);
  }

  if (showPopups) drawGlitchPopups(p);
  drawManifestoField(p);
  drawTopStamp(p);
  drawBottomStamp(p);
  drawBorderRiot(p);
  drawGlobalGlitch(p);
}

function updateVideoCover() {
  let vw = cam.width || baseW;
  let vh = cam.height || baseH;

  if (cam.elt && cam.elt.videoWidth > 0) {
    vw = cam.elt.videoWidth;
    vh = cam.elt.videoHeight;
  }

  if (width / height >= vw / vh) {
    nW = width;
    nH = width / (vw / vh);
    oX = 0;
    oY = (height - nH) / 2;
  } else {
    nW = height * (vw / vh);
    nH = height;
    oX = (width - nW) / 2;
    oY = 0;
  }
}

function updateCameraLayer() {
  camLayer.clear();
  camLayer.push();
  camLayer.translate(camLayer.width, 0);
  camLayer.scale(-1, 1);
  camLayer.image(cam, oX, oY, nW, nH);
  camLayer.pop();
}

function updateTracking() {
  prevProjected = projected.map(pt => ({ x: pt.x, y: pt.y, z: pt.z }));
  projected = [];

  if (!faces.length || !faces[0] || !faces[0].keypoints) {
    tracking = max(0, tracking - 0.04);
    mouthOpen = lerp(mouthOpen, 0, 0.1);
    motionEnergy = lerp(motionEnergy, 0, 0.08);
    return;
  }

  const current = faces[0].keypoints;
  if (!smoothedPoints || smoothedPoints.length !== current.length) {
    smoothedPoints = current.map(k => ({ x: k.x, y: k.y, z: k.z || 0 }));
  } else {
    for (let i = 0; i < current.length; i++) {
      smoothedPoints[i].x = lerp(smoothedPoints[i].x, current[i].x, 0.26);
      smoothedPoints[i].y = lerp(smoothedPoints[i].y, current[i].y, 0.26);
      smoothedPoints[i].z = lerp(smoothedPoints[i].z, current[i].z || 0, 0.18);
    }
  }

  const vw = cam.elt.videoWidth || baseW;
  const vh = cam.elt.videoHeight || baseH;

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (let i = 0; i < smoothedPoints.length; i++) {
    const kp = smoothedPoints[i];
    const sx = oX + (kp.x / vw) * nW;
    const sy = oY + (kp.y / vh) * nH;
    const mx = width - sx;
    const z = (kp.z || 0) * (nW / vw);

    projected[i] = { x: mx, y: sy, z };
    minX = min(minX, mx);
    minY = min(minY, sy);
    maxX = max(maxX, mx);
    maxY = max(maxY, sy);
  }

  faceBounds = { x: minX, y: minY, w: maxX - minX, h: maxY - minY };

  prevFaceCenter.x = faceCenter.x;
  prevFaceCenter.y = faceCenter.y;
  faceCenter.x = lerp(faceCenter.x, minX + faceBounds.w * 0.5, 0.25);
  faceCenter.y = lerp(faceCenter.y, minY + faceBounds.h * 0.5, 0.25);

  const le = projected[ANCHORS.leftEye];
  const re = projected[ANCHORS.rightEye];
  if (le && re) eyeDistance = lerp(eyeDistance, dist(le.x, le.y, re.x, re.y), 0.22);

  const mt = projected[ANCHORS.mouthTop];
  const mb = projected[ANCHORS.mouthBottom];
  if (mt && mb) {
    const mo = dist(mt.x, mt.y, mb.x, mb.y) / max(eyeDistance, 1);
    mouthOpen = lerp(mouthOpen, constrain(mo * 4.2, 0, 1.6), 0.16);
  }

  const move = dist(faceCenter.x, faceCenter.y, prevFaceCenter.x, prevFaceCenter.y);
  motionEnergy = lerp(motionEnergy, constrain(move / 8, 0, 1.5), 0.16);
  tracking = min(1, tracking + 0.05);
}

function getPalette() {
  if (mode === 0) return { bg: '#050505', fg: '#f2f2f2', accent: '#ff2b6e', accent2: '#00ff99' };
  if (mode === 1) return { bg: '#000000', fg: '#ffffff', accent: '#ffed00', accent2: '#ff3b30' };
  if (mode === 2) return { bg: '#050505', fg: '#d8ffd0', accent: '#8cff00', accent2: '#ffffff' };
  if (mode === 3) return { bg: '#080808', fg: '#f0d6ff', accent: '#ff4de1', accent2: '#00e5ff' };
  return { bg: '#000000', fg: '#f5f5f5', accent: '#ff3333', accent2: '#ffffff' };
}

function drawCameraTrashBackground(p) {
  push();
  tint(255, 42);
  image(camLayer, random(-4, 4), random(-2, 2), width, height);
  noTint();

  blendMode(ADD);
  noStroke();
  for (let y = 0; y < height; y += 18) {
    const a = 8 + 10 * sin(frameCount * 0.05 + y * 0.03);
    fill(colorAlpha(y % 36 === 0 ? p.accent : p.fg, a));
    rect(0, y + sin(frameCount * 0.03 + y * 0.02) * 4, width, 2);
  }
  blendMode(BLEND);
  pop();
}

function drawPhotocopyNoise(p) {
  push();
  noStroke();
  for (let i = 0; i < 180; i++) {
    const x = random(width);
    const y = random(height);
    const s = random(1, 3);
    fill(random() < 0.92 ? colorAlpha(p.fg, 18) : colorAlpha(p.accent, 30));
    rect(x, y, s, s);
  }

  for (let i = 0; i < 14; i++) {
    fill(colorAlpha(p.fg, random(3, 10)));
    rect(random(width), 0, random(1, 4), height);
  }
  pop();
}

function drawTornBands(p) {
  push();
  noStroke();
  for (let i = 0; i < tearBands.length; i++) {
    const b = tearBands[i];
    b.y += sin(frameCount * 0.01 + b.phase) * 0.4 + b.speed * 0.08;
    if (b.y > height + 20) b.y = -20;

    const alpha = 12 + 12 * sin(frameCount * 0.04 + b.phase);
    fill(colorAlpha(i % 2 === 0 ? p.fg : p.accent, alpha));
    rect(0, b.y, width, b.h);
  }
  pop();
}

function drawDust(p) {
  push();
  noStroke();
  for (let i = 0; i < punkDust.length; i++) {
    const d = punkDust[i];
    d.x += d.vx;
    d.y += d.vy;
    if (d.x < 0) d.x = width;
    if (d.x > width) d.x = 0;
    if (d.y < 0) d.y = height;
    if (d.y > height) d.y = 0;

    fill(colorAlpha(random() < 0.97 ? p.fg : p.accent, d.a));
    circle(d.x, d.y, d.r);
  }
  pop();
}

function drawFaceSmears(p) {
  for (let i = smearBuffer.length - 1; i >= 0; i--) {
    const s = smearBuffer[i];
    s.life *= 0.95;
    if (s.life < 0.05) {
      smearBuffer.splice(i, 1);
      continue;
    }

    push();
    noFill();
    stroke(colorAlpha(s.c, s.life * 90));
    strokeWeight(s.w);
    beginShape();
    for (let j = 0; j < s.points.length; j++) {
      const pt = s.points[j];
      vertex(pt.x + s.dx * (1 - s.life), pt.y + s.dy * (1 - s.life));
    }
    endShape(CLOSE);
    pop();
  }
}

function drawFaceRiotStructure(p) {
  if (!showMesh) return;

  push();
  noFill();
  for (let i = 0; i < triangles.length; i++) {
    const tri = triangles[i];
    const a = projected[tri[0]];
    const b = projected[tri[1]];
    const c = projected[tri[2]];
    if (!a || !b || !c) continue;

    const avgZ = abs((a.z + b.z + c.z) / 3);
    const jitter = motionEnergy * 12 + mouthOpen * 6;
    const ox = sin(frameCount * 0.08 + i) * jitter;
    const oy = cos(frameCount * 0.06 + i * 0.2) * jitter * 0.5;

    stroke(colorAlpha(p.fg, map(avgZ, 0, 100, 190, 30, true)));
    strokeWeight(1.05);
    triangle(a.x, a.y, b.x, b.y, c.x, c.y);

    if (i % 3 === 0) {
      stroke(colorAlpha(p.accent, 100));
      triangle(a.x + ox, a.y, b.x - ox, b.y + oy, c.x + ox * 0.4, c.y - oy);
    }

    if (i % 7 === 0) {
      stroke(colorAlpha(p.accent2, 60));
      triangle(a.x - ox * 0.5, a.y + oy, b.x, b.y - oy, c.x + ox, c.y);
    }
  }
  pop();
}

function drawFaceRippedContours(p) {
  drawOffsetPath(FACE_OVAL, p.fg, 220, 1.8, 0, 0);
  drawOffsetPath(FACE_OVAL, p.accent, 120, 1.2, -8 - motionEnergy * 10, 5);
  drawOffsetPath(FACE_OVAL, p.accent2, 90, 1.2, 8 + motionEnergy * 8, -4);

  drawOffsetPath(LEFT_EYE, p.fg, 180, 1.3, 0, 0);
  drawOffsetPath(RIGHT_EYE, p.fg, 180, 1.3, 0, 0);
  drawOffsetPath(UPPER_LIP, p.accent, 170, 1.1, 0, 0);
  drawOffsetPath(LOWER_LIP, p.accent, 170, 1.1, 0, 0);
  drawOffsetPath(BROW_L, p.accent2, 110, 1.2, -3, 0, false);
  drawOffsetPath(BROW_R, p.accent2, 110, 1.2, 3, 0, false);
}

function drawOffsetPath(indices, hex, alpha, weight, ox, oy, closed = true) {
  push();
  noFill();
  stroke(colorAlpha(hex, alpha));
  strokeWeight(weight);
  beginShape();
  for (let i = 0; i < indices.length; i++) {
    const pt = projected[indices[i]];
    if (pt) vertex(pt.x + ox, pt.y + oy);
  }
  endShape(closed ? CLOSE : undefined);
  pop();
}

function drawPointAggression(p) {
  push();
  noStroke();
  blendMode(ADD);
  for (let i = 0; i < projected.length; i += 2) {
    const pt = projected[i];
    if (!pt) continue;
    fill(colorAlpha(i % 6 === 0 ? p.accent : p.fg, 120));
    circle(pt.x + random(-1, 1), pt.y + random(-1, 1), 1.4 + noise(i, frameCount * 0.03) * 3.2);
  }
  blendMode(BLEND);
  pop();
}

function drawFaceAsciiStorm(p) {
  return;
}

function drawScreamBands(p) {
  if (!faceBounds) return;

  push();
  blendMode(ADD);
  for (let i = 0; i < 16; i++) {
    const y = map(i, 0, 15, faceBounds.y - 30, faceBounds.y + faceBounds.h + 30);
    const wave = sin(frameCount * 0.12 + i * 0.7) * (10 + mouthOpen * 25 + motionEnergy * 18);
    stroke(colorAlpha(i % 2 === 0 ? p.accent : p.fg, 56));
    line(faceBounds.x - 80, y + wave, faceBounds.x + faceBounds.w + 80, y - wave);
  }
  blendMode(BLEND);
  pop();
}

function drawEyesCrosshair(p) {
  const le = projected[ANCHORS.leftEye];
  const re = projected[ANCHORS.rightEye];
  if (le) drawCross(le.x, le.y, eyeDistance * 0.18, p);
  if (re) drawCross(re.x, re.y, eyeDistance * 0.18, p);
}

function drawCross(x, y, s, p) {
  push();
  stroke(colorAlpha(p.accent, 180));
  strokeWeight(1.5);
  line(x - s, y, x + s, y);
  line(x, y - s, x, y + s);
  noFill();
  stroke(colorAlpha(p.fg, 120));
  rectMode(CENTER);
  rect(x, y, s * 1.6, s * 1.6);
  pop();
}

function drawMouthScream(p) {
  const mt = projected[ANCHORS.mouthTop];
  const mb = projected[ANCHORS.mouthBottom];
  if (!mt || !mb) return;

  const cx = (mt.x + mb.x) * 0.5;
  const cy = (mt.y + mb.y) * 0.5;
  const rr = 12 + mouthOpen * eyeDistance * 0.4;

  push();
  noFill();
  stroke(colorAlpha(p.accent, 180));
  strokeWeight(2);
  ellipse(cx, cy, rr * 1.8, rr * 0.9);
  stroke(colorAlpha(p.fg, 90));
  ellipse(cx, cy, rr * 2.6, rr * 1.4);
  line(cx - rr * 1.5, cy, cx + rr * 1.5, cy);
  pop();
}

function drawOrbitTags(p) {
  if (!faceBounds) return;

  push();
  noFill();
  const rr = eyeDistance * (1.2 + motionEnergy * 0.4);
  stroke(colorAlpha(p.fg, 80));
  ellipse(faceCenter.x, faceCenter.y, rr * 3.2, rr * 2.4);
  stroke(colorAlpha(p.accent, 90));
  ellipse(faceCenter.x, faceCenter.y, rr * 4.3, rr * 3.2);
  pop();
}

function updatePopups() {
  for (let i = 0; i < glitchPopups.length; i++) {
    const pop = glitchPopups[i];
    pop.timer--;

    if (pop.timer <= 0) {
      pop.target = pop.target > 0 ? 0 : 1;
      pop.timer = int(random(pop.target > 0 ? 14 : 8, pop.target > 0 ? 70 : 24));
      if (pop.target > 0) {
        pop.x = random(width * 0.06, width * 0.78);
        pop.y = random(height * 0.1, height * 0.78);
        pop.title = random(['SCAN ERROR', 'VOID PANEL', 'UNKNOWN USER', 'PIRATE FEED', 'DATA WOUND', 'SIGNAL LOSS', 'NO PROFILE']);
        pop.lines = [random(PUNK_WORDS), random(PUNK_WORDS), random(PUNK_WORDS)];
      }
    }

    pop.life = lerp(pop.life, pop.target, pop.target > 0 ? 0.18 : 0.26);
    pop.x += pop.driftX * pop.life;
    pop.y += pop.driftY * pop.life;
  }
}

function drawGlitchPopups(p) {
  for (let i = 0; i < glitchPopups.length; i++) {
    const popup = glitchPopups[i];
    if (popup.life < 0.05) continue;

    const jitterX = random(-6, 6) * popup.life * 0.35;
    const jitterY = random(-4, 4) * popup.life * 0.35;
    const alpha = 220 * popup.life;

    push();
    translate(popup.x + jitterX, popup.y + jitterY);

    noStroke();
    fill(colorAlpha(p.bg, alpha));
    rect(0, 0, popup.w, popup.h);

    noFill();
    stroke(colorAlpha(p.fg, 180 * popup.life));
    strokeWeight(1.4);
    rect(0, 0, popup.w, popup.h);

    stroke(colorAlpha(p.accent, 120 * popup.life));
    line(0, 18, popup.w, 18);
    if (random() < 0.18) {
      line(0, 19 + random(-2, 2), popup.w, 19 + random(-2, 2));
    }

    noStroke();
    fill(colorAlpha(p.accent, 230 * popup.life));
    textAlign(LEFT, TOP);
    textSize(11);
    text(popup.title, 8, 5);

    fill(colorAlpha(p.fg, 210 * popup.life));
    textSize(10);
    text(popup.lines[0], 10, 28);
    text(popup.lines[1], 10, 44);
    text(popup.lines[2], 10, 60);

    if (projected.length && random() < 0.55) {
      const sx = constrain(faceBounds ? faceBounds.x : faceCenter.x - 40, 0, width - 1);
      const sy = constrain(faceBounds ? faceBounds.y : faceCenter.y - 40, 0, height - 1);
      const sw = constrain(faceBounds ? faceBounds.w : 80, 20, width - sx);
      const sh = constrain(faceBounds ? faceBounds.h : 80, 20, height - sy);
      tint(255, 80 * popup.life);
      image(camLayer, popup.w - 84, 28, 70, 52, sx, sy, sw, sh);
      noTint();
      noFill();
      stroke(colorAlpha(p.accent2, 120 * popup.life));
      rect(popup.w - 84, 28, 70, 52);
    }

    if (random() < 0.12) {
      noStroke();
      fill(colorAlpha(p.accent, 34 * popup.life));
      rect(0, random(popup.h), popup.w, random(3, 10));
    }
    pop();
  }
}

function drawStickerTexts(p) {
  if (!faceBounds) return;

  const stickers = [
    { text: 'NO PROFILE', x: faceBounds.x - 30, y: faceBounds.y - 24, bg: p.fg, fg: p.bg, a: 255, rot: -0.06 },
    { text: 'SCAN RIOT', x: faceBounds.x + faceBounds.w * 0.72, y: faceBounds.y + faceBounds.h + 18, bg: p.accent, fg: p.bg, a: 240, rot: 0.04 },
    { text: 'DIRTY SIGNAL', x: faceBounds.x + faceBounds.w + 18, y: faceCenter.y, bg: p.bg, fg: p.fg, a: 255, rot: 0.08, stroke: p.fg },
    { text: 'XEROX BODY', x: faceBounds.x - 40, y: faceCenter.y + 42, bg: p.accent2, fg: p.bg, a: 230, rot: -0.1 }
  ];

  for (let i = 0; i < stickers.length; i++) {
    const s = stickers[i];
    push();
    translate(s.x, s.y);
    rotate(s.rot + sin(frameCount * 0.02 + i) * 0.02);
    textSize(12 + i * 1.5);
    const tw = textWidth(s.text) + 16;
    const th = 22;
    if (s.stroke) {
      noFill();
      stroke(colorAlpha(s.stroke, 220));
      rect(0, 0, tw, th);
      noStroke();
      fill(colorAlpha(s.fg, s.a));
    } else {
      noStroke();
      fill(colorAlpha(s.bg, s.a));
      rect(0, 0, tw, th);
      fill(colorAlpha(s.fg, 255));
    }
    textAlign(LEFT, CENTER);
    text(s.text, 8, th / 2 + 0.5);
    pop();
  }
}

function drawNoFacePoster(p) {
  push();
  textAlign(CENTER, CENTER);
  fill(colorAlpha(p.fg, 230));
  textSize(42);
  text('NO FACE / NO SIGNAL', width / 2, height / 2 - 20);
  fill(colorAlpha(p.accent, 180));
  textSize(16);
  text('ALIGN YOUR HEAD TO ENTER THE RIOT', width / 2, height / 2 + 24);
  pop();
}

function drawManifestoField(p) {
  push();
  textAlign(LEFT, TOP);
  for (let i = 0; i < manifesto.length; i++) {
    const m = manifesto[i];
    m.y += m.speed;
    m.x += sin(frameCount * 0.02 + i) * m.drift;
    if (m.y > height + 20) {
      m.y = -30;
      m.x = random(width);
      m.word = random(PUNK_WORDS);
    }

    fill(colorAlpha(i % 4 === 0 ? p.accent : p.fg, m.alpha));
    textSize(m.size);
    text(m.word, m.x, m.y);
  }
  pop();
}

function drawTopStamp(p) {
  push();
  noStroke();
  fill(colorAlpha(p.bg, 220));
  rect(0, 0, width, 54);
  fill(colorAlpha(p.fg, 255));
  textAlign(LEFT, CENTER);
  textSize(16);
  text('FACE RIOT // NET ART PUNK TRACKING // BODY AS BROKEN INTERFACE', 18, 27);
  fill(colorAlpha(p.accent, 220));
  textAlign(RIGHT, CENTER);
  text('MODE ' + (mode + 1), width - 18, 27);
  pop();
}

function drawBottomStamp(p) {
  push();
  noStroke();
  fill(colorAlpha(p.bg, 220));
  rect(0, height - 62, width, 62);
  fill(colorAlpha(p.fg, 220));
  textAlign(LEFT, CENTER);
  textSize(12);
  text('SPACE palette  /  O popups  /  C bg  /  T text  /  N noise  /  B bands  /  P points  /  S smear  /  M mesh  /  F fullscreen', 18, height - 31);
  pop();
}

function drawBorderRiot(p) {
  push();
  noFill();
  stroke(colorAlpha(p.fg, 170));
  strokeWeight(2);
  rect(8, 8, width - 16, height - 16);
  stroke(colorAlpha(p.accent, 80));
  line(8, 8, 54, 8);
  line(8, 8, 8, 54);
  line(width - 8, 8, width - 54, 8);
  line(width - 8, 8, width - 8, 54);
  line(8, height - 8, 54, height - 8);
  line(8, height - 8, 8, height - 54);
  line(width - 8, height - 8, width - 54, height - 8);
  line(width - 8, height - 8, width - 8, height - 54);
  pop();
}

function drawGlobalGlitch(p) {
  if (random() < 0.1) {
    const bands = int(random(2, 8));
    for (let i = 0; i < bands; i++) {
      const gy = random(height);
      const gh = random(4, 24);
      const shift = random(-60, 60);
      copy(0, gy, width, gh, shift, gy, width, gh);
    }
  }

  if (random() < 0.05) {
    push();
    noStroke();
    fill(colorAlpha(p.accent, 26));
    rect(0, random(height), width, random(6, 18));
    pop();
  }
}

function pushFaceMemory() {
  if (!faceBounds) return;
  if (frameCount % 4 !== 0) return;

  const pts = [];
  for (let i = 0; i < FACE_OVAL.length; i++) {
    const pt = projected[FACE_OVAL[i]];
    if (pt) pts.push({ x: pt.x, y: pt.y });
  }

  smearBuffer.push({
    points: pts,
    life: 1,
    dx: random(-30, 30),
    dy: random(-14, 14),
    w: random(0.8, 2.2),
    c: random() < 0.7 ? '#ffffff' : getPalette().accent
  });

  if (smearBuffer.length > 18) smearBuffer.shift();
}

function colorAlpha(hex, alpha) {
  const c = color(hex);
  return color(red(c), green(c), blue(c), alpha);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  camLayer.resizeCanvas(windowWidth, windowHeight);
  initDust();
  initManifesto();
  initTears();
  initPopups();
}

function mousePressed() {
  fullscreen(!fullscreen());
}

function keyPressed() {
  if (key === ' ' || keyCode === 32) {
    mode = (mode + 1) % 5;
    return false;
  }
  if (key === 'o' || key === 'O') showPopups = !showPopups;
  if (key === 'c' || key === 'C') showCameraTrash = !showCameraTrash;
  if (key === 't' || key === 'T') showType = !showType;
  if (key === 'n' || key === 'N') showNoise = !showNoise;
  if (key === 'b' || key === 'B') showBands = !showBands;
  if (key === 's' || key === 'S') showTrails = !showTrails;
  if (key === 'p' || key === 'P') showPoints = !showPoints;
  if (key === 'a' || key === 'A') showAscii = !showAscii;
  if (key === 'm' || key === 'M') showMesh = !showMesh;
  if (key === 'f' || key === 'F') fullscreen(!fullscreen());
  if (key === 'k' || key === 'K') saveCanvas('face-riot-' + frameCount, 'png');
}
