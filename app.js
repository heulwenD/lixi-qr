const openBtn = document.getElementById("openBtn");
const reveal = document.getElementById("reveal");
const audio = document.getElementById("audio");

const canvas = document.getElementById("fw");
const ctx = canvas.getContext("2d");

let W, H, dpr;
let particles = [];
let running = false;

function resize(){
  dpr = window.devicePixelRatio || 1;
  W = canvas.width = Math.floor(window.innerWidth * dpr);
  H = canvas.height = Math.floor(window.innerHeight * dpr);
}
window.addEventListener("resize", resize);
resize();

function rand(a,b){ return a + Math.random()*(b-a); }

function spawnFirework(x,y){
  const count = 140;
  for(let i=0;i<count;i++){
    const ang = rand(0, Math.PI*2);
    const sp = rand(2.5, 7.5) * dpr;
    particles.push({
      x, y,
      vx: Math.cos(ang)*sp,
      vy: Math.sin(ang)*sp,
      g: 0.06*dpr,
      life: rand(45, 85),
      maxLife: 0,
      size: rand(1.2, 2.6)*dpr
    });
  }
}

function tick(){
  if(!running) return;
  ctx.clearRect(0,0,W,H);

  // fade nhẹ để tạo vệt
  ctx.fillStyle = "rgba(246,239,228,0.18)";
  ctx.fillRect(0,0,W,H);

  // update particles
  for(const p of particles){
    p.vy += p.g;
    p.x += p.vx;
    p.y += p.vy;
    p.life -= 1;

    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI*2);
    ctx.fillStyle = "rgba(0,0,0,0.95)";
    ctx.fill();
  }

  particles = particles.filter(p => p.life > 0 && p.x>-50 && p.x<W+50 && p.y>-50 && p.y<H+50);

  requestAnimationFrame(tick);
}

async function openLixi(){
  // hiện meme + audio
  reveal.classList.remove("hidden");

  // bắt đầu fireworks loop
  running = true;
  ctx.clearRect(0,0,W,H);
  tick();

  // bắn vài phát đầu
  const cx = W*0.5, cy = H*0.32;
  spawnFirework(cx, cy);
  setTimeout(() => spawnFirework(cx*0.7, cy*0.9), 200);
  setTimeout(() => spawnFirework(cx*1.25, cy*1.05), 380);

  // bắn liên tục 1 thời gian
  let t = 0;
  const timer = setInterval(() => {
    t += 1;
    spawnFirework(rand(W*0.2, W*0.8), rand(H*0.15, H*0.55));
    if(t >= 14){
      clearInterval(timer);
      // vẫn để loop chạy thêm chút rồi tự dừng
      setTimeout(() => { running = false; ctx.clearRect(0,0,W,H); }, 1800);
    }
  }, 260);

  // play nhạc (sẽ OK vì là user click)
  try{
    audio.currentTime = 0;
    await audio.play();
  }catch(e){
    // nếu bị chặn, user bấm play
  }
}

openBtn.addEventListener("click", openLixi);
