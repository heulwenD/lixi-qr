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

// meme mover state
let mover = null;

function resize(){
  dpr = window.devicePixelRatio || 1;
  W = canvas.width = Math.floor(window.innerWidth * dpr);
  H = canvas.height = Math.floor(window.innerHeight * dpr);
}
window.addEventListener("resize", resize);
resize();

function rand(a,b){ return a + Math.random()*(b-a); }
function pick(arr){ return arr[Math.floor(Math.random()*arr.length)]; }

const palette = [
  [255, 80, 80],
  [255, 210, 90],
  [90, 220, 255],
  [170, 120, 255],
  [120, 255, 170],
  [255, 140, 220],
  [255, 255, 255]
];

function spawnRibbonBurst(x,y){
  const n = 140;
  for(let i=0;i<n;i++){
    const ang = rand(0, Math.PI*2);
    const sp = rand(2.0, 8.0) * dpr;
    const [r,g,b] = pick(palette);
    particles.push({
      x,y,
      vx: Math.cos(ang)*sp,
      vy: Math.sin(ang)*sp,
      g: 0.055*dpr,
      life: rand(60, 120),
      w: rand(2.0, 4.5)*dpr,
      h: rand(7.0, 16.0)*dpr,
      rot: rand(0, Math.PI),
      vr: rand(-0.22, 0.22),
      a: 1,
      r,g,b
    });
  }
}

function tickFx(){
  // trail
  ctx.fillStyle = "rgba(0,0,0,0.16)";
  ctx.fillRect(0,0,W,H);

  for(const p of particles){
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
    ctx.fillRect(-p.w/2, -p.h/2, p.w, p.h);
    ctx.restore();
  }

  particles = particles.filter(p => p.life>0 && p.a>0.06 && p.y < H+150);

  // continuous fireworks: always spawn if locked
  if(locked){
    if(Math.random() < 0.35){
      spawnRibbonBurst(rand(W*0.15,W*0.85), rand(H*0.10,H*0.45));
    }
  }

  rafFx = requestAnimationFrame(tickFx);
}

function fireworksStartAt(el){
  const r = el.getBoundingClientRect();
  const x = (r.left + r.width/2) * dpr;
  const y = (r.top + r.height*0.28) * dpr;
  spawnRibbonBurst(x,y);

  if(!rafFx){
    ctx.clearRect(0,0,W,H);
    tickFx();
  }
}

async function tryPlay(){
  try{
    audio.currentTime = 0;
    await audio.play(); // click envelope = user gesture
  }catch(e){
    // iOS có thể vẫn chặn, fallback pointerdown bên dưới
  }
}

/**
 * Meme chạy loạn nhưng luôn nằm trong viewport.
 * (Dùng position:fixed inline style, không cần HTML thêm)
 */
function startMemeMove(imgEl){
  // move the IMG itself (fixed)
  imgEl.style.position = "fixed";
  imgEl.style.left = "0px";
  imgEl.style.top = "0px";
  imgEl.style.zIndex = "10";
  imgEl.style.pointerEvents = "none";

  // scale theo viewport để khỏi bắt zoom
  const maxW = Math.min(window.innerWidth * 0.55, 520);
  imgEl.style.width = maxW + "px";
  imgEl.style.maxHeight = (window.innerHeight * 0.55) + "px";
  imgEl.style.objectFit = "contain";

  // orbit parameters
  const pad = 8;
  let t = 0;

  // center point moves slowly (like drifting), meme orbits around it
  let cx = rand(pad, window.innerWidth - pad);
  let cy = rand(pad, window.innerHeight - pad);

  let dcx = rand(0.6, 1.6) * (Math.random()<0.5?-1:1);
  let dcy = rand(0.6, 1.6) * (Math.random()<0.5?-1:1);

  let radius = rand(60, 160);
  let omega = rand(0.018, 0.045); // angular speed
  let wobble = rand(0.12, 0.35);  // radius wobble

  function step(){
    if(!locked) return;

    const w = imgEl.getBoundingClientRect().width;
    const h = imgEl.getBoundingClientRect().height;
    const maxX = window.innerWidth - w - pad;
    const maxY = window.innerHeight - h - pad;

    // drift center (cx, cy)
    cx += dcx;
    cy += dcy;

    // bounce center inside viewport
    if(cx < pad){ cx = pad; dcx *= -1; }
    if(cy < pad){ cy = pad; dcy *= -1; }
    if(cx > window.innerWidth - pad){ cx = window.innerWidth - pad; dcx *= -1; }
    if(cy > window.innerHeight - pad){ cy = window.innerHeight - pad; dcy *= -1; }

    // orbit around drifting center
    t += 1;
    const r = radius * (1 + Math.sin(t * wobble) * 0.25);
    const x = cx + Math.cos(t * omega) * r;
    const y = cy + Math.sin(t * omega) * r * 0.72;

    // clamp final position so meme never goes off-screen
    const fx = Math.max(pad, Math.min(maxX, x));
    const fy = Math.max(pad, Math.min(maxY, y));

    imgEl.style.transform = `translate(${fx}px, ${fy}px)`;

    // occasional randomize to look "random lượn"
    if(Math.random() < 0.01){
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

function stopMemeMove(){
  if(rafMeme) cancelAnimationFrame(rafMeme);
  rafMeme = null;
  mover = null;
}

function reset(){
  locked = false;

  envs.forEach(e=>{
    e.style.display = "";
    e.classList.remove("open","vanish");
    e.disabled = false;
    // reset meme image styles (in case moved)
    const img = e.querySelector(".memeIn img");
    img.style.position = "";
    img.style.left = "";
    img.style.top = "";
    img.style.zIndex = "";
    img.style.pointerEvents = "";
    img.style.width = "";
    img.style.maxHeight = "";
    img.style.objectFit = "";
    img.style.transform = "";
  });

  stopMemeMove();

  audio.pause();
  audio.currentTime = 0;

  // keep fireworks loop but clear canvas
  particles = [];
  if(rafFx){
    cancelAnimationFrame(rafFx);
    rafFx = null;
  }
  ctx.clearRect(0,0,W,H);
}

envs.forEach(chosen=>{
  chosen.addEventListener("click", async ()=>{
    if(locked) return;
    locked = true;

    // 5 cái còn lại biến mất cùng lúc
    envs.forEach(e=>{
      if(e !== chosen) e.classList.add("vanish");
      e.disabled = true;
    });

    // mở bao + meme chui ra (CSS)
    chosen.classList.add("open");

    // fireworks continuous
    fireworksStartAt(chosen);

    // bật nhạc (không hiện player)
    await tryPlay();

    // sau khi meme pop ra, bắt đầu chạy loạn
    setTimeout(() => {
  const img = chosen.querySelector(".memeIn img");

  // đưa meme ra khỏi envelope trước khi ẩn envelope
  startMemeMove(img);
  img.classList.add("memeFlying");
  // ẩn envelope đã chọn (sau 1 nhịp nhỏ để không giật)
  setTimeout(() => {
    chosen.style.display = "none";
  }, 120);

}, 900);

again.addEventListener("click", reset);

// fallback: nếu iPhone chặn autoplay, chạm màn hình để bật
document.addEventListener("pointerdown", ()=>{
  if(!locked) return;
  if(audio.paused) audio.play().catch(()=>{});
}, {passive:true});
