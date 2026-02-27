const envs = [...document.querySelectorAll(".env")];
const again = document.getElementById("again");
const audio = document.getElementById("audio");

const canvas = document.getElementById("fx");
const ctx = canvas.getContext("2d");

let W, H, dpr;
let particles = [];
let raf = null;
let locked = false;

function resize(){
  dpr = window.devicePixelRatio || 1;
  W = canvas.width = Math.floor(window.innerWidth * dpr);
  H = canvas.height = Math.floor(window.innerHeight * dpr);
}
window.addEventListener("resize", resize);
resize();

function rand(a,b){ return a + Math.random()*(b-a); }

function color(){
  const palette = [
    [255, 80, 80],
    [255, 210, 90],
    [90, 220, 255],
    [170, 120, 255],
    [120, 255, 170],
    [255, 140, 220]
  ];
  return palette[Math.floor(Math.random()*palette.length)];
}

function spawnRibbonBurst(x,y){
  const n = 220;
  for(let i=0;i<n;i++){
    const ang = rand(0, Math.PI*2);
    const sp = rand(2.2, 8.8) * dpr;
    const [r,g,b] = color();
    particles.push({
      x,y,
      vx: Math.cos(ang)*sp,
      vy: Math.sin(ang)*sp,
      g: 0.06*dpr,
      life: rand(55, 105),
      w: rand(2.0, 4.5)*dpr,     // ribbon width
      h: rand(6.0, 14.0)*dpr,    // ribbon length
      rot: rand(0, Math.PI),
      vr: rand(-0.2, 0.2),
      a: 1,
      r,g,b
    });
  }
}

function tick(){
  // fade to create trails
  ctx.fillStyle = "rgba(0,0,0,0.20)";
  ctx.fillRect(0,0,W,H);

  for(const p of particles){
    p.vy += p.g;
    p.x += p.vx;
    p.y += p.vy;
    p.rot += p.vr;
    p.life -= 1;
    p.a *= 0.986;

    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);
    ctx.globalAlpha = Math.max(0, p.a);
    ctx.fillStyle = `rgb(${p.r},${p.g},${p.b})`;
    ctx.fillRect(-p.w/2, -p.h/2, p.w, p.h);
    ctx.restore();
  }

  particles = particles.filter(p => p.life>0 && p.a>0.06 && p.y < H+120);

  if(particles.length){
    raf = requestAnimationFrame(tick);
  }else{
    raf = null;
    ctx.clearRect(0,0,W,H);
  }
}

function fireworksAt(el){
  const r = el.getBoundingClientRect();
  const x = (r.left + r.width/2) * dpr;
  const y = (r.top + r.height*0.30) * dpr;

  spawnRibbonBurst(x,y);
  setTimeout(()=>spawnRibbonBurst(rand(W*0.2,W*0.8), rand(H*0.10,H*0.45)), 180);
  setTimeout(()=>spawnRibbonBurst(rand(W*0.2,W*0.8), rand(H*0.10,H*0.45)), 360);
  setTimeout(()=>spawnRibbonBurst(rand(W*0.2,W*0.8), rand(H*0.10,H*0.45)), 540);

  if(!raf) tick();
}

async function tryPlay(){
  try{
    audio.currentTime = 0;
    await audio.play(); // click envelope = user gesture => thường OK
  }catch(e){
    // iOS đôi khi vẫn chặn -> user click again button or tap anywhere
  }
}

function reset(){
  locked = false;
  envs.forEach(e=>{
    e.classList.remove("open","vanish");
    e.disabled = false;
  });
  audio.pause();
  audio.currentTime = 0;

  particles = [];
  if(raf) cancelAnimationFrame(raf);
  raf = null;
  ctx.clearRect(0,0,W,H);
}

envs.forEach(chosen=>{
  chosen.addEventListener("click", async ()=>{
    if(locked) return;
    locked = true;

    // 5 cái còn lại biến mất đồng thời
    envs.forEach(e=>{
      if(e !== chosen) e.classList.add("vanish");
      e.disabled = true;
    });

    // mở phong bao + meme chui ra (CSS animation)
    chosen.classList.add("open");

    // pháo hoa nhiều màu
    fireworksAt(chosen);

    // nhạc tự bật (không hiện player)
    await tryPlay();
  });
});

again.addEventListener("click", reset);

// fallback: nếu autoplay bị chặn, user chạm màn hình để bật
document.addEventListener("pointerdown", ()=>{
  if(!locked) return;
  if(audio.paused) audio.play().catch(()=>{});
}, {passive:true});
