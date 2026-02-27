const envs = [...document.querySelectorAll(".env")];
const again = document.getElementById("again");
const audio = document.getElementById("audio");

const canvas = document.getElementById("fx");
const ctx = canvas.getContext("2d");

let W, H, dpr;
let particles = [];
let rafFx = null;
let rafMeme = null;
let locked = false;

function resize() {
  dpr = window.devicePixelRatio || 1;
  W = canvas.width = Math.floor(window.innerWidth * dpr);
  H = canvas.height = Math.floor(window.innerHeight * dpr);
}
window.addEventListener("resize", resize);
resize();

function rand(a, b) { return a + Math.random() * (b - a); }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

const palette = [
  [255, 80, 80],
  [255, 210, 90],
  [90, 220, 255],
  [170, 120, 255],
  [120, 255, 170],
  [255, 140, 220],
  [255, 255, 255]
];

// --- Fireworks (continuous) ---
function spawnRibbonBurst(x, y) {
  const n = 140;
  for (let i = 0; i < n; i++) {
    const ang = rand(0, Math.PI * 2);
    const sp = rand(2.0, 8.0) * dpr;
    const [r, g, b] = pick(palette);
    particles.push({
      x, y,
      vx: Math.cos(ang) * sp,
      vy: Math.sin(ang) * sp,
      g: 0.055 * dpr,
      life: rand(60, 120),
      w: rand(2.0, 4.5) * dpr,
      h: rand(7.0, 16.0) * dpr,
      rot: rand(0, Math.PI),
      vr: rand(-0.22, 0.22),
      a: 1,
      r, g, b
    });
  }
}

function tickFx() {
  // trail
  ctx.fillStyle = "rgba(0,0,0,0.16)";
  ctx.fillRect(0, 0, W, H);

  for (const p of particles) {
    p.vy += p.g;
    p.x += p.vx;
    p.y += p.vy;
    p.rot += p.vr;
    p.life -= 1;
    p.a *= 0.988;

    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);
    ctx.globalAlpha = Math.max(0, p.a);
    ctx.fillStyle = `rgb(${p.r},${p.g},${p.b})`;
    ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
    ctx.restore();
  }

  particles = particles.filter(p => p.life > 0 && p.a > 0.06 && p.y < H + 150);

  // continuous spawn while locked
  if (locked && Math.random() < 0.35) {
    spawnRibbonBurst(rand(W * 0.15, W * 0.85), rand(H * 0.10, H * 0.45));
  }

  rafFx = requestAnimationFrame(tickFx);
}

function fireworksStartAt(el) {
  const r = el.getBoundingClientRect();
  const x = (r.left + r.width / 2) * dpr;
  const y = (r.top + r.height * 0.28) * dpr;
  spawnRibbonBurst(x, y);
  if (!rafFx) {
    ctx.clearRect(0, 0, W, H);
    tickFx();
  }
}

// --- Audio autoplay ---
async function tryPlay() {
  try {
    audio.currentTime = 0;
    await audio.play(); // envelope click = user gesture => usually OK
  } catch (e) {
    // iOS may still block; pointerdown fallback below
  }
}

// --- Meme movement (orbit + drift) on wrapper to avoid transform conflict ---
function startMemeMove(wrapperEl) {
  wrapperEl.style.position = "fixed";
  wrapperEl.style.left = "0px";
  wrapperEl.style.top = "0px";
  wrapperEl.style.zIndex = "10";
  wrapperEl.style.pointerEvents = "none";

  const maxW = Math.min(window.innerWidth * 0.55, 520);
  wrapperEl.style.width = maxW + "px";

  const pad = 8;
  let t = 0;

  let cx = rand(pad, window.innerWidth - pad);
  let cy = rand(pad, window.innerHeight - pad);

  let dcx = rand(0.6, 1.6) * (Math.random() < 0.5 ? -1 : 1);
  let dcy = rand(0.6, 1.6) * (Math.random() < 0.5 ? -1 : 1);

  let radius = rand(60, 160);
  let omega = rand(0.018, 0.045);
  let wobble = rand(0.12, 0.35);

  function step() {
    if (!locked) return;

    const rect = wrapperEl.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;

    const maxX = window.innerWidth - w - pad;
    const maxY = window.innerHeight - h - pad;

    cx += dcx;
    cy += dcy;

    if (cx < pad) { cx = pad; dcx *= -1; }
    if (cy < pad) { cy = pad; dcy *= -1; }
    if (cx > window.innerWidth - pad) { cx = window.innerWidth - pad; dcx *= -1; }
    if (cy > window.innerHeight - pad) { cy = window.innerHeight - pad; dcy *= -1; }

    t += 1;
    const r = radius * (1 + Math.sin(t * wobble) * 0.25);
    const x = cx + Math.cos(t * omega) * r;
    const y = cy + Math.sin(t * omega) * r * 0.72;

    const fx = Math.max(pad, Math.min(maxX, x));
    const fy = Math.max(pad, Math.min(maxY, y));

    wrapperEl.style.transform = `translate(${fx}px, ${fy}px)`;

    if (Math.random() < 0.01) {
      radius = rand(60, 180);
      omega = rand(0.016, 0.05);
      wobble = rand(0.10, 0.40);
      dcx += rand(-0.3, 0.3);
      dcy += rand(-0.3, 0.3);
      dcx = Math.max(-2.2, Math.min(2.2, dcx));
      dcy = Math.max(-2.2, Math.min(2.2, dcy));
    }

    rafMeme = requestAnimationFrame(step);
  }

  step();
}

function stopMemeMove() {
  if (rafMeme) cancelAnimationFrame(rafMeme);
  rafMeme = null;
}

// --- Reset ---
function reset() {
  locked = false;

  envs.forEach(e => {
    e.style.display = "";
    e.classList.remove("open", "vanish");
    e.disabled = false;

    // reset wrapper/img styles + blink class
    const wrap = e.querySelector(".memeIn .memeWrap");
    const img = e.querySelector(".memeIn img");

    if (wrap) {
      wrap.style.position = "";
      wrap.style.left = "";
      wrap.style.top = "";
      wrap.style.zIndex = "";
      wrap.style.pointerEvents = "";
      wrap.style.width = "";
      wrap.style.transform = "";
    }
    if (img) img.classList.remove("memeBlink");
  });

  stopMemeMove();

  audio.pause();
  audio.currentTime = 0;

  particles = [];
  if (rafFx) {
    cancelAnimationFrame(rafFx);
    rafFx = null;
  }
  ctx.clearRect(0, 0, W, H);
}

// --- Main click handlers ---
envs.forEach(chosen => {
  chosen.addEventListener("click", async () => {
    if (locked) return;
    locked = true;

    // other 5 vanish immediately
    envs.forEach(e => {
      if (e !== chosen) e.classList.add("vanish");
      e.disabled = true;
    });

    // open envelope (CSS)
    chosen.classList.add("open");

    // start fireworks
    fireworksStartAt(chosen);

    // play audio
    await tryPlay();

    // after meme pops out, start flying + hide chosen envelope
    setTimeout(() => {
      const wrap = chosen.querySelector(".memeIn .memeWrap");
      const img = chosen.querySelector(".memeIn img");
      if (!wrap || !img) return;

      startMemeMove(wrap);
      img.classList.add("memeBlink");

      setTimeout(() => { chosen.style.display = "none"; }, 120);
    }, 900);
  });
});

again.addEventListener("click", reset);

// iOS autoplay fallback: tap anywhere to play
document.addEventListener("pointerdown", () => {
  if (!locked) return;
  if (audio.paused) audio.play().catch(() => {});
}, { passive: true });
