const authReady = import("./auth.js").then(({ requireAuth }) => requireAuth());

/* ============================================================
  single.js  —  GCS Gesture Detection Engine
   Matches deaf02.html element IDs:
     video   → #video-feed
     canvas  → #overlay-canvas
   Camera starts ONLY when Start button is clicked.
   ============================================================ */

/* ── ELEMENT REFERENCES ─────────────────────── */
const video  = document.getElementById("video-feed");
const canvas = document.getElementById("overlay-canvas");
const ctx    = canvas.getContext("2d");

/* ── DIMENSIONS ─────────────────────────────── */
const WIDTH  = 640;
const HEIGHT = 480;

/* ============================================================
   SECTION 1 — GEOMETRY UTILITIES
   ============================================================ */

function dist2D(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function angleDeg(A, B, C) {
  const ab = { x: A.x - B.x, y: A.y - B.y };
  const cb = { x: C.x - B.x, y: C.y - B.y };
  const dot = ab.x * cb.x + ab.y * cb.y;
  const mag = Math.hypot(ab.x, ab.y) * Math.hypot(cb.x, cb.y);
  if (mag === 0) return 0;
  return Math.acos(Math.min(1, Math.max(-1, dot / mag))) * 180 / Math.PI;
}

function palmNormal(lm) {
  const v1 = { x: lm[5].x - lm[0].x,  y: lm[5].y - lm[0].y,  z: (lm[5].z  || 0) - (lm[0].z || 0) };
  const v2 = { x: lm[17].x - lm[0].x, y: lm[17].y - lm[0].y, z: (lm[17].z || 0) - (lm[0].z || 0) };
  return {
    x: v1.y * v2.z - v1.z * v2.y,
    y: v1.z * v2.x - v1.x * v2.z,
    z: v1.x * v2.y - v1.y * v2.x,
  };
}

function palmSize(lm) {
  return dist2D(lm[0], lm[9]) || 0.001;
}

/* ============================================================
   SECTION 2 — FINGER STATE
   ============================================================ */

const FINGER_TIPS  = [8,  12, 16, 20];
const FINGER_DIPS  = [7,  11, 15, 19];
const FINGER_PIPS  = [6,  10, 14, 18];
const FINGER_MCPS  = [5,   9, 13, 17];

function fingerState(lm, f) {
  const tip = FINGER_TIPS[f], pip = FINGER_PIPS[f], mcp = FINGER_MCPS[f];
  const a = angleDeg(lm[mcp], lm[pip], lm[tip]);
  if (a > 160) return 'open';
  if (a > 120) return 'half';
  return 'closed';
}

function thumbState(lm, hand) {
  const extended = (hand === 'Right') ? lm[4].x < lm[3].x : lm[4].x > lm[3].x;
  return extended ? 'open' : 'closed';
}

const isOpen   = s => s === 'open';
const isClosed = s => s === 'closed';
const isHalf   = s => s === 'half';

/* ============================================================
   SECTION 3 — HELPERS
   ============================================================ */

function thumbIndexDist(lm) { return dist2D(lm[4], lm[8]) / palmSize(lm); }
function fingersSpread(lm)  { return dist2D(lm[8], lm[20]) / palmSize(lm); }
function handPointsUp(lm)   { return lm[12].y < lm[0].y - palmSize(lm) * 0.3; }
function wristRollDeg(lm) {
  return Math.atan2(lm[17].y - lm[0].y, lm[17].x - lm[0].x) * 180 / Math.PI;
}

/* ============================================================
   SECTION 4 — GESTURE RULES
   ============================================================ */

const Gestures = [
  {
    emoji:"👍", label:"Thumbs Up",
    test(lm, hand) {
      const th = thumbState(lm, hand);
      const s  = [0,1,2,3].map(f => fingerState(lm, f));
      if (!isOpen(th) || !isClosed(s[0]) || !isClosed(s[1]) || !isClosed(s[2]) || !isClosed(s[3])) return false;
      return lm[4].y < Math.min(lm[5].y, lm[9].y, lm[13].y, lm[17].y);
    }
  },
  {
    emoji:"👎", label:"Thumbs Down",
    test(lm, hand) {
      const th = thumbState(lm, hand);
      const s  = [0,1,2,3].map(f => fingerState(lm, f));
      if (!isOpen(th) || !isClosed(s[0]) || !isClosed(s[1]) || !isClosed(s[2]) || !isClosed(s[3])) return false;
      return lm[4].y > Math.max(lm[5].y, lm[9].y, lm[13].y, lm[17].y);
    }
  },
  {
    emoji:"🤟", label:"Love You",
    test(lm, hand) {
      const th = thumbState(lm, hand);
      const s  = [0,1,2,3].map(f => fingerState(lm, f));
      return isOpen(th) && isOpen(s[0]) && isClosed(s[1]) && isClosed(s[2]) && isOpen(s[3]);
    }
  },
  {
    emoji:"🤘", label:"Rock / Horns",
    test(lm, hand) {
      const th = thumbState(lm, hand);
      const s  = [0,1,2,3].map(f => fingerState(lm, f));
      return isClosed(th) && isOpen(s[0]) && isClosed(s[1]) && isClosed(s[2]) && isOpen(s[3]);
    }
  },
  {
    emoji:"🤙", label:"Call Me",
    test(lm, hand) {
      const th = thumbState(lm, hand);
      const s  = [0,1,2,3].map(f => fingerState(lm, f));
      return isOpen(th) && isClosed(s[0]) && isClosed(s[1]) && isClosed(s[2]) && isOpen(s[3]);
    }
  },
  {
    emoji:"🤞", label:"Crossed Fingers",
    test(lm, hand) {
      const s = [0,1,2,3].map(f => fingerState(lm, f));
      if (!isOpen(s[0]) || !isOpen(s[1]) || !isClosed(s[2]) || !isClosed(s[3])) return false;
      return Math.abs(lm[8].x - lm[12].x) < palmSize(lm) * 0.25;
    }
  },
  {
    emoji:"✌️", label:"Peace",
    test(lm, hand) {
      const s = [0,1,2,3].map(f => fingerState(lm, f));
      if (!isOpen(s[0]) || !isOpen(s[1]) || !isClosed(s[2]) || !isClosed(s[3])) return false;
      return dist2D(lm[8], lm[12]) / palmSize(lm) > 0.6;
    }
  },
  {
    emoji:"👌", label:"OK",
    test(lm, hand) {
      const s = [0,1,2,3].map(f => fingerState(lm, f));
      if (!isOpen(s[1]) || !isOpen(s[2]) || !isOpen(s[3])) return false;
      return thumbIndexDist(lm) < 0.45;
    }
  },
  {
    emoji:"🤌", label:"Pinched Fingers",
    test(lm, hand) {
      const ps = palmSize(lm);
      return [8,12,16,20].every(i => dist2D(lm[4], lm[i]) / ps < 0.5);
    }
  },
  {
    emoji:"🤏", label:"Pinch",
    test(lm, hand) {
      const s = [0,1,2,3].map(f => fingerState(lm, f));
      if (!isClosed(s[1]) || !isClosed(s[2]) || !isClosed(s[3])) return false;
      return thumbIndexDist(lm) < 0.45;
    }
  },
  {
    emoji:"🖖", label:"Vulcan Salute",
    test(lm, hand) {
      const s = [0,1,2,3].map(f => fingerState(lm, f));
      if (!isOpen(s[0]) || !isOpen(s[1]) || !isOpen(s[2]) || !isOpen(s[3])) return false;
      const midRing   = dist2D(lm[12], lm[16]) / palmSize(lm);
      const idxMid    = dist2D(lm[8],  lm[12]) / palmSize(lm);
      const ringPinky = dist2D(lm[16], lm[20]) / palmSize(lm);
      return midRing > idxMid * 1.4 && midRing > ringPinky * 1.4;
    }
  },
  {
    emoji:"👋", label:"Wave",
    test(lm, hand) {
      const s = [0,1,2,3].map(f => fingerState(lm, f));
      if (!isOpen(s[0]) || !isOpen(s[1]) || !isOpen(s[2]) || !isOpen(s[3])) return false;
      const roll = Math.abs(wristRollDeg(lm));
      return roll > 30 && roll < 150;
    }
  },
  {
    emoji:"✋", label:"Stop",
    test(lm, hand) {
      const s = [0,1,2,3].map(f => fingerState(lm, f));
      if (!isOpen(s[0]) || !isOpen(s[1]) || !isOpen(s[2]) || !isOpen(s[3])) return false;
      return fingersSpread(lm) < 1.4 && handPointsUp(lm);
    }
  },
  {
    emoji:"🖐️", label:"Hi Five",
    test(lm, hand) {
      const th = thumbState(lm, hand);
      const s  = [0,1,2,3].map(f => fingerState(lm, f));
      if (!isOpen(th) || !isOpen(s[0]) || !isOpen(s[1]) || !isOpen(s[2]) || !isOpen(s[3])) return false;
      return fingersSpread(lm) > 1.4;
    }
  },
  {
    emoji:"🫵", label:"Pointing at You",
    test(lm, hand) {
      const s = [0,1,2,3].map(f => fingerState(lm, f));
      if (!isOpen(s[0]) || !isClosed(s[1]) || !isClosed(s[2]) || !isClosed(s[3])) return false;
      return ((lm[8].z || 0) - (lm[5].z || 0)) < -0.04;
    }
  },
  {
    emoji:"👆", label:"Pointing Up",
    test(lm, hand) {
      const s = [0,1,2,3].map(f => fingerState(lm, f));
      if (!isOpen(s[0]) || !isClosed(s[1]) || !isClosed(s[2]) || !isClosed(s[3])) return false;
      return lm[8].y < lm[6].y - palmSize(lm) * 0.2 && lm[8].y < lm[0].y;
    }
  },
  {
    emoji:"👇", label:"Pointing Down",
    test(lm, hand) {
      const s = [0,1,2,3].map(f => fingerState(lm, f));
      if (!isOpen(s[0]) || !isClosed(s[1]) || !isClosed(s[2]) || !isClosed(s[3])) return false;
      return lm[8].y > lm[6].y + palmSize(lm) * 0.2 && lm[8].y > lm[0].y;
    }
  },
  {
    emoji:"👈", label:"Pointing Left",
    test(lm, hand) {
      const s = [0,1,2,3].map(f => fingerState(lm, f));
      if (!isOpen(s[0]) || !isClosed(s[1]) || !isClosed(s[2]) || !isClosed(s[3])) return false;
      const dx = lm[7].x - lm[8].x;
      return dx > 0 && dx > Math.abs(lm[7].y - lm[8].y) * 0.7;
    }
  },
  {
    emoji:"👉", label:"Pointing Right",
    test(lm, hand) {
      const s = [0,1,2,3].map(f => fingerState(lm, f));
      if (!isOpen(s[0]) || !isClosed(s[1]) || !isClosed(s[2]) || !isClosed(s[3])) return false;
      const dx = lm[8].x - lm[7].x;
      return dx > 0 && dx > Math.abs(lm[7].y - lm[8].y) * 0.7;
    }
  },
  {
    emoji:"✊", label:"Fist",
    test(lm, hand) {
      const s = [0,1,2,3].map(f => fingerState(lm, f));
      return isClosed(s[0]) && isClosed(s[1]) && isClosed(s[2]) && isClosed(s[3]);
    }
  },
  {
    emoji:"🤲", label:"Palm Up",
    test(lm, hand) {
      const s = [0,1,2,3].map(f => fingerState(lm, f));
      if (!isOpen(s[0]) || !isOpen(s[1]) || !isOpen(s[2]) || !isOpen(s[3])) return false;
      return palmNormal(lm).y < -0.3 && !handPointsUp(lm);
    }
  },
  {
    emoji:"🫳", label:"Palm Down",
    test(lm, hand) {
      const s = [0,1,2,3].map(f => fingerState(lm, f));
      if (!isOpen(s[0]) || !isOpen(s[1]) || !isOpen(s[2]) || !isOpen(s[3])) return false;
      return palmNormal(lm).y > 0.3 && !handPointsUp(lm);
    }
  },
];

const TwoHandGestures = [
  {
    emoji:"👏", label:"Clap",
    test(l, r) { return dist2D(l[9], r[9]) < palmSize(l) * 0.5; }
  },
  {
    emoji:"🙏", label:"Namaste",
    test(l, r) {
      return dist2D(l[9], r[9]) < palmSize(l) * 1.0 && handPointsUp(l) && handPointsUp(r);
    }
  },
  {
    emoji:"🤜🤛", label:"Fist Bump",
    test(l, r) {
      const lc = [0,1,2,3].every(f => isClosed(fingerState(l, f)));
      const rc = [0,1,2,3].every(f => isClosed(fingerState(r, f)));
      return lc && rc && dist2D(l[9], r[9]) < palmSize(l) * 1.5;
    }
  },
  {
    emoji:"🫶", label:"Heart Hands",
    test(l, r) { return dist2D(l[4], r[4]) < palmSize(l) * 0.6; }
  },
];

/* ============================================================
   SECTION 5 — SMOOTHING
   ============================================================ */

const SMOOTH_FRAMES = 4;
let gestureBuffer  = [];
let lastAnnounced  = "";

function smoothedGesture(detected) {
  gestureBuffer.push(detected);
  if (gestureBuffer.length > SMOOTH_FRAMES) gestureBuffer.shift();
  const counts = {};
  for (const g of gestureBuffer) counts[g] = (counts[g] || 0) + 1;
  const [top] = Object.entries(counts).sort((a, b) => b[1] - a[1])[0] || [];
  return (counts[top] >= Math.ceil(SMOOTH_FRAMES / 2)) ? top : lastAnnounced;
}

/* ============================================================
   SECTION 6 — DETECTION
   ============================================================ */

function detectSingleHand(lm, hand) {
  for (const g of Gestures) {
    try { if (g.test(lm, hand)) return `${g.emoji} ${g.label}`; }
    catch (e) {}
  }
  return "❓ Unknown";
}

function detectTwoHandGesture(left, right) {
  for (const g of TwoHandGestures) {
    try { if (g.test(left, right)) return `${g.emoji} ${g.label}`; }
    catch (e) {}
  }
  return null;
}

/* ── showGesture bridges to the UI controller ── */
function showGesture(text) {
  const confirmed = smoothedGesture(text);
  if (confirmed !== lastAnnounced) {
    lastAnnounced = confirmed;
    /* fire the UI controller hook if available */
    if (typeof window.onGestureDetected === 'function') {
      const m = confirmed.match(/^(\S+)\s+(.+)$/);
      window.onGestureDetected(m ? m[1] : confirmed, m ? m[2] : confirmed);
    }
  }
}

/* ============================================================
   SECTION 7 — MEDIAPIPE HANDS SETUP
   ============================================================ */

let hands;
const handsReady = authReady.then(() => {
  hands = new Hands({
    locateFile: file => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
  });

  hands.setOptions({
    maxNumHands: 2,
    modelComplexity: 1,
    minDetectionConfidence: 0.75,
    minTrackingConfidence: 0.75,
  });

  hands.onResults(results => {
  /* size canvas to match live video */
  canvas.width  = video.videoWidth  || WIDTH;
  canvas.height = video.videoHeight || HEIGHT;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) {
    showGesture("🤚 No Hands");
    return;
  }

  let leftHand = null, rightHand = null;

  results.multiHandLandmarks.forEach((lm, i) => {
    const label = results.multiHandedness[i].label;
    if (label === "Left")  leftHand  = lm;
    if (label === "Right") rightHand = lm;
    drawConnectors(ctx, lm, HAND_CONNECTIONS, { color: "#17eb0c" });
    drawLandmarks(ctx, lm, { color: "#b731ec", radius: 4 });
  });

  if (leftHand && rightHand) {
    const two = detectTwoHandGesture(leftHand, rightHand);
    if (two) { showGesture(two); return; }
  }
  if (leftHand)       showGesture(detectSingleHand(leftHand,  "Left"));
  else if (rightHand) showGesture(detectSingleHand(rightHand, "Right"));
  });
});

/* ============================================================
   SECTION 8 — CAMERA CONTROL
   Exposed as startCamera() / stopCamera() so the
   HTML Start/Stop buttons can call them.
   ============================================================ */

let mpCamera = null;

window.startCamera = async function () {
  if (mpCamera) return; /* already running */

  try {
    await handsReady;
    /* Ask for camera permission explicitly first */
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { width: { ideal: WIDTH }, height: { ideal: HEIGHT }, facingMode: "user" }
    });
    video.srcObject = stream;
    await video.play();

    mpCamera = new Camera(video, {
      onFrame: async () => {
        await hands.send({ image: video });
      },
      width: WIDTH,
      height: HEIGHT,
    });
    await mpCamera.start();
  } catch (err) {
    console.error("Camera error:", err);
    /* surface error to UI status bar */
    const sb = document.getElementById('status');
    const st = document.getElementById('status-text');
    if (sb) sb.className = 'status-box error';
    if (st) st.textContent = 'CAMERA ERROR: ' + (err.message || err);
  }
};

window.stopCamera = function () {
  if (mpCamera) {
    mpCamera.stop();
    mpCamera = null;
  }
  /* stop all tracks so the camera LED turns off */
  if (video.srcObject) {
    video.srcObject.getTracks().forEach(t => t.stop());
    video.srcObject = null;
  }
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  lastAnnounced = "";
  gestureBuffer = [];
};