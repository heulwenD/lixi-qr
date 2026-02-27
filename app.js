(() => {
  const envs = [...document.querySelectorAll(".env")];
  const again = document.getElementById("again");
  const audio = document.getElementById("audio");
  const canvas = document.getElementById("fx");
  const ctx = canvas.getContext("2d");

  let W, H, dpr;
  let locked = false;
  let rafFx = null, rafMeme = null;
  let particles = [];

  const palette = [
    [255, 80, 80], [255, 210, 90], [90, 220, 255],
    [170, 120, 255], [120, 255, 170], [255, 140, 220], [255,255,255]
  ];

  const rand = (a,b) => a + Math.random() * (b-a);
  const pick = (arr) => arr[Math.floor(Math.random()*arr.length)];

  function resize(){
    dpr = window.devicePixelRatio || 1;
    W = canvas.width = Math.floor(window.innerWidth * dpr);
    H = canvas.height = Math.floor(window.innerHeight * dpr);
  }
  window.addEventListener("resize", resize);
  resize();

  // --- fireworks ---
  function burst(x,y){
    for(let i=0;i<140;i++){
      const ang = rand(0, Math.PI*2);
      const sp = rand(2.0, 8.0) * dpr;
      const [r,g,b] = pick(palette);
      particles.push({
        x,y, r,g,b,
        vx: Math.cos(ang)*sp,
        vy: Math.sin(ang)*sp,
        g: 0.055*dpr,
        a: 1,
        life: rand(60,120),
        w: rand(2.0,4.5)*dpr,
        h: rand(7.0,16.0)*dpr,
        rot: rand(0,Math.PI),
        vr: rand(-0.22,0.22),
      });
    }
  }

  function fxLoop(){
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
      ctx.translate(p.x,p.y);
      ctx.rotate(p.rot);
      ctx.globalAlpha = Math.max(0,p.a);
      ctx.fillStyle = `rgb(${p.r},${p.g},${p.b})`;
      ctx.fillRect(-p.w/2, -p.h/2, p.w, p.h);
      ctx.restore();
    }

    particles = particles.filter(p => p.life>0 && p.a>0.06 && p.y < H+150);

    if(locked && Math.random() < 0.35){
      burst(rand(W*0.15,W*0.85), rand(H*0.10,H*0.45));
    }

    rafFx = requestAnimationFrame(fxLoop);
  }

  function startFxAt(el){
    const r = el.getBoundingClientRect();
    burst((r.left + r.width/2)*dpr, (r.top + r.height*0.28)*dpr);
    if(!rafFx){ ctx.clearRect(0,0,W,H); fxLoop(); }
  }

  async function tryPlay(){
    try{ audio.currentTime = 0; await audio.play(); } catch(e){}
  }

  // --- meme orbit movement on wrapper (.memeWrap) ---
  function startMemeMove(wrap){
    wrap.style.position="fixed";
    wrap.style.left="0px";
    wrap.style.top="0px";
    wrap.style.zIndex="10";
    wrap.style.pointerEvents="none";
    wrap.style.width = Math.min(window.innerWidth*0.55, 520) + "px";

    const pad=8;
    let t=0;
    let cx=rand(pad, window.innerWidth-pad), cy=rand(pad, window.innerHeight-pad);
    let dcx=rand(0.6,1.6)*(Math.random()<0.5?-1:1);
    let dcy=rand(0.6,1.6)*(Math.random()<0.5?-1:1);
    let radius=rand(60,160), omega=rand(0.018,0.045), wobble=rand(0.12,0.35);

    const step = () => {
      if(!locked) return;

      const rect = wrap.getBoundingClientRect();
      const maxX = window.innerWidth - rect.width - pad;
      const maxY = window.innerHeight - rect.height - pad;

      cx += dcx; cy += dcy;
      if(cx<pad){cx=pad; dcx*=-1;}
      if(cy<pad){cy=pad; dcy*=-1;}
      if(cx>window.innerWidth-pad){cx=window.innerWidth-pad; dcx*=-1;}
      if(cy>window.innerHeight-pad){cy=window.innerHeight-pad; dcy*=-1;}

      t += 1;
      const r = radius*(1 + Math.sin(t*wobble)*0.25);
      const x = cx + Math.cos(t*omega)*r;
      const y = cy + Math.sin(t*omega)*r*0.72;

      const fx = Math.max(pad, Math.min(maxX, x));
      const fy = Math.max(pad, Math.min(maxY, y));
      wrap.style.transform = `translate(${fx}px, ${fy}px)`;

      if(Math.random()<0.01){
        radius=rand(60,180); omega=rand(0.016,0.05); wobble=rand(0.10,0.40);
        dcx = Math.max(-2.2, Math.min(2.2, dcx + rand(-0.3,0.3)));
        dcy = Math.max(-2.2, Math.min(2.2, dcy + rand(-0.3,0.3)));
      }

      rafMeme = requestAnimationFrame(step);
    };
    step();
  }

  function reset(){
    locked = false;

    envs.forEach(e=>{
      e.style.display="";
      e.classList.remove("open","vanish");
      e.disabled=false;

      const wrap = e.querySelector(".memeIn .memeWrap");
      const img = e.querySelector(".memeIn img");
      if(wrap){
        wrap.style.position=""; wrap.style.left=""; wrap.style.top="";
        wrap.style.zIndex=""; wrap.style.pointerEvents="";
        wrap.style.width=""; wrap.style.transform="";
      }
      if(img) img.classList.remove("memeBlink");
    });

    audio.pause();
    audio.currentTime = 0;

    particles = [];
    if(rafFx){ cancelAnimationFrame(rafFx); rafFx=null; }
    if(rafMeme){ cancelAnimationFrame(rafMeme); rafMeme=null; }
    ctx.clearRect(0,0,W,H);
// remove any flying meme containers
document.querySelectorAll(".memeFly").forEach(el => el.remove());
    
  }

  envs.forEach(chosen=>{
    chosen.addEventListener("click", async ()=>{
      if(locked) return;
      locked = true;

      envs.forEach(e=>{
        if(e!==chosen) e.classList.add("vanish");
        e.disabled = true;
      });

      chosen.classList.add("open");
      startFxAt(chosen);
      await tryPlay();

      setTimeout(() => {
  const img = chosen.querySelector(".memeIn img");
  if (!img) return;

  // 1) Tạo container bay độc lập (tách khỏi envelope)
  const fly = document.createElement("div");
  fly.className = "memeFly";          // chỉ để debug, không bắt buộc
  document.body.appendChild(fly);

  // 2) Move IMG từ envelope sang body
  fly.appendChild(img);

  // 3) Cho img blink
  img.classList.add("memeBlink");

  // 4) Bắt đầu bay lượn vòng trên fly (wrapper nằm ở body)
  startMemeMove(fly);

  // 5) Xóa phần memeIn trống (optional)
  const memeIn = chosen.querySelector(".memeIn");
  if (memeIn) memeIn.innerHTML = "";

  // 6) Giờ mới ẩn envelope đã chọn (meme vẫn bay vì nó đã tách ra body)
  setTimeout(() => {
    chosen.style.display = "none";
  }, 120);

}, 900);

  again?.addEventListener("click", reset);

  document.addEventListener("pointerdown", ()=>{
    if(!locked) return;
    if(audio.paused) audio.play().catch(()=>{});
  }, {passive:true});
})();
