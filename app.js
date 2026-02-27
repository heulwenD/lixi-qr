const grid = document.getElementById("grid");
const envButtons = [...document.querySelectorAll(".env")];
const result = document.getElementById("result");
const audio = document.getElementById("audio");
const again = document.getElementById("again");

const canvas = document.getElementById("fx");
const ctx = canvas.getContext("2d");
let W, H, dpr;
let particles = [];
let raf = null;

function resize(){
  dpr = window.devicePixelRatio || 1;
  W = canvas.width = Math.floor(window.innerWidth * dpr);
  H = canvas.height = Math.floor(window.innerHeight * dpr);
}
window.addEventListener("resize", resize);
resize();

// Add flap element into each envelope (pure JS so HTML stays clean)
envButtons.forEach(b => {
  const flap = document.createElement("div");
  flap.className = "flap";
  b.appendChild(flap);
});

function rand(a,b){ return a + Math.random()*(b-a); }

function spawnBurst(x,y){
  const n = 160;
  for(let i=0;i<n;i++){
    const ang = rand(0, Math.PI*2);
    const sp = rand(2.2, 7.6) * dpr;
    particles.push({
      x, y,
      vx: Math.cos(ang)*sp,
      vy: Math.sin(ang)*sp,
      g: 0.07*dpr,
      life: rand(40, 85),
      size: rand(1.2, 2.6)*dpr,
      a: 1
    });
  }
}

function tick(){
  ctx.fillStyle = "rgba(0,0,0,0.18)";
  ctx.fillRect(0,0,W,H);

  for(const p of particles){
    p.vy += p.g;
    p.x += p.vx;
    p.y += p.vy;
    p.life -= 1;
    p.a *= 0.985;

    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI*2);
    ctx.fillStyle = `rgba(247,201,91,${Math.max(0,p.a)})`;
    ctx.fill();
  }
  particles = particles.filter(p => p.life>0 && p.a>0.05 && p.y < H+80);

  if(particles.length > 0){
    raf = requestAnimationFrame(tick);
  } else {
    ctx.clearRect(0,0,W,H);
    raf = null;
  }
}

function fireworksAtElement(el){
  const r = el.getBoundingClientRect();
  const x = (r.left + r.width/2) * dpr;
  const y = (r.top + r.height*0.15) * dpr;
  spawnBurst(x,y);
  if(!raf) tick();

  // thêm vài phát
  setTimeout(() => { spawnBurst(rand(W*0.2,W*0.8), rand(H*0.12,H*0.45)); if(!raf) tick(); }, 220);
  setTimeout(() => { spawnBurst(rand(W*0.2,W*0.8), rand(H*0.12,H*0.45)); if(!raf) tick(); }, 420);
}

let locked = false;

async function playSound(){
  try{
    audio.currentTime = 0;
    await audio.play(); // cố autoplay sau click (thường OK)
  }catch(e){
    // bị chặn thì user bấm Play trong controls
  }
}

function disableOthers(chosen){
  envButtons.forEach(b => {
    if(b !== chosen) b.classList.add("disabled");
    b.disabled = true;
  });
}

function resetAll(){
  locked = false;
  result.classList.add("hidden");
  envButtons.forEach(b => {
    b.classList.remove("open", "disabled");
    b.disabled = false;
  });
  // stop sound
  audio.pause();
  audio.currentTime = 0;

  // clear fireworks
  particles = [];
  if(raf) cancelAnimationFrame(raf);
  raf = null;
  ctx.clearRect(0,0,W,H);
}

envButtons.forEach(btn => {
  btn.addEventListener("click", async () => {
    if(locked) return;
    locked = true;

    btn.classList.add("open");
    disableOthers(btn);

    // chờ flap mở rồi show meme
    setTimeout(() => {
      result.classList.remove("hidden");
      fireworksAtElement(btn);
    }, 450);

    // bật nhạc sau click (ổn nhất)
    await playSound();
  });
});

again.addEventListener("click", resetAll);
