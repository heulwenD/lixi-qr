const openBtn = document.getElementById("openBtn");
const againBtn = document.getElementById("againBtn");
const reveal = document.getElementById("reveal");
const audio = document.getElementById("audio");
const canvas = document.getElementById("fx");
const ctx = canvas.getContext("2d");

let W, H, particles = [], animId = null;

function resize(){
  W = canvas.width = window.innerWidth * devicePixelRatio;
  H = canvas.height = window.innerHeight * devicePixelRatio;
}
window.addEventListener("resize", resize);
resize();

function burst(){
  particles = [];
  const n = 160;
  for(let i=0;i<n;i++){
    particles.push({
      x: W/2,
      y: H*0.28,
      vx: (Math.random()*2-1) * 9 * devicePixelRatio,
      vy: (Math.random()*-1) * 12 * devicePixelRatio - 2,
      g: 0.45 * devicePixelRatio,
      s: (Math.random()*4 + 2) * devicePixelRatio,
      a: 1,
      rot: Math.random()*Math.PI,
      vr: (Math.random()*2-1)*0.15
    });
  }
  if(animId) cancelAnimationFrame(animId);
  tick();
}

function tick(){
  ctx.clearRect(0,0,W,H);
  for(const p of particles){
    p.vy += p.g;
    p.x += p.vx;
    p.y += p.vy;
    p.rot += p.vr;
    p.a *= 0.985;

    // confetti rectangle
    ctx.save();
    ctx.globalAlpha = p.a;
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);
    ctx.fillRect(-p.s, -p.s/2, p.s*2, p.s);
    ctx.restore();
  }
  particles = particles.filter(p => p.a > 0.05 && p.y < H + 60);
  if(particles.length > 0){
    animId = requestAnimationFrame(tick);
  } else {
    ctx.clearRect(0,0,W,H);
  }
}

async function openLixi(){
  reveal.classList.remove("hidden");
  reveal.setAttribute("aria-hidden", "false");
  burst();

  // Try autoplay (will succeed after user click on most browsers)
  try{
    audio.currentTime = 0;
    await audio.play();
  }catch(e){
    // If blocked, user can press play on controls
  }
}

openBtn.addEventListener("click", openLixi);
againBtn?.addEventListener("click", () => {
  burst();
  audio.currentTime = 0;
  audio.play().catch(()=>{});
});
