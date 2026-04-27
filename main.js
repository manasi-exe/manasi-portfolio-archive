// ============================================================
//  Manasi.exe — main.js
// ============================================================

// ---- roundRect polyfill (Chrome <99, Firefox <112, older Safari) ----
if (!CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, r) {
    const radius = Math.min(typeof r === 'number' ? r : (Array.isArray(r) ? r[0] : 0), w/2, h/2);
    this.moveTo(x + radius, y);
    this.lineTo(x + w - radius, y);
    this.arcTo(x + w, y, x + w, y + radius, radius);
    this.lineTo(x + w, y + h - radius);
    this.arcTo(x + w, y + h, x + w - radius, y + h, radius);
    this.lineTo(x + radius, y + h);
    this.arcTo(x, y + h, x, y + h - radius, radius);
    this.lineTo(x, y + radius);
    this.arcTo(x, y, x + radius, y, radius);
    return this;
  };
}

// ---- MAGNIFYING GLASS CURSOR ----
const starCursor = document.getElementById("star-cursor");
document.addEventListener("mousemove", (e) => {
  starCursor.style.left = e.clientX + "px";
  starCursor.style.top  = e.clientY + "px";
});

// ============================================================
//  AUDIO
// ============================================================
let audioCtx = null, masterGain = null, musicStarted = false, muted = false;

function initAudio() {
  if (audioCtx) return;
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  masterGain = audioCtx.createGain();
  masterGain.gain.value = 0.07;
  masterGain.connect(audioCtx.destination);
}
function playTone(freq, dur, when, type = "square", vol = 1) {
  if (!audioCtx || muted) return;
  const osc = audioCtx.createOscillator(), gain = audioCtx.createGain();
  osc.type = type; osc.frequency.value = freq;
  gain.gain.setValueAtTime(vol * 0.3, when);
  gain.gain.exponentialRampToValueAtTime(0.001, when + dur);
  osc.connect(gain); gain.connect(masterGain);
  osc.start(when); osc.stop(when + dur + 0.01);
}
function playBlip()  { initAudio(); playTone(880, 0.07, audioCtx.currentTime, "square", 0.5); }
function playCoin()  { initAudio(); const t=audioCtx.currentTime; playTone(660,0.05,t,"square",0.4); playTone(880,0.08,t+0.05,"square",0.4); }
function playDing()  { initAudio(); const t=audioCtx.currentTime; playTone(523.25,0.12,t,"sine",0.8); playTone(659.25,0.12,t+0.06,"sine",0.8); playTone(783.99,0.20,t+0.12,"sine",0.9); }

const BPM=138, BEAT=60/BPM;
const MELODY=[[523.25,0.5],[659.25,0.25],[783.99,0.25],[1046.5,0.5],[783.99,0.25],[659.25,0.25],[523.25,0.5],[392.00,0.5],[440.00,0.5],[523.25,0.25],[659.25,0.25],[783.99,0.5],[659.25,0.5],[523.25,0.25],[392.00,0.25],[329.63,0.25],[261.63,0.75],[659.25,0.5],[783.99,0.5],[880.00,0.5],[783.99,0.25],[659.25,0.25],[523.25,0.5],[587.33,0.25],[659.25,0.25],[523.25,0.5],[392.00,0.5],[440.00,0.5],[587.33,0.5],[659.25,0.5],[587.33,0.5],[523.25,0.5],[440.00,0.25],[392.00,0.25],[329.63,1.0]];
const BASS=[[130.81,1],[196.00,1],[174.61,1],[130.81,1],[130.81,1],[196.00,1],[174.61,1],[130.81,1]];

function startChiptune() {
  if (musicStarted || !audioCtx) return;
  musicStarted = true; scheduleLoop();
}
function scheduleLoop() {
  if (!audioCtx) return;
  if (muted) { const ld=MELODY.reduce((s,[,b])=>s+b,0)*BEAT; setTimeout(scheduleLoop,(ld-0.2)*1000); return; }
  let t=audioCtx.currentTime+0.1, tb=audioCtx.currentTime+0.1;
  MELODY.forEach(([f,b])=>{ playTone(f,b*BEAT*0.85,t,"square",1); t+=b*BEAT; });
  BASS.forEach(([f,b])  =>{ playTone(f,b*BEAT*0.7,tb,"triangle",0.6); tb+=b*BEAT; });
  const ld=MELODY.reduce((s,[,b])=>s+b,0)*BEAT;
  setTimeout(scheduleLoop,(ld-0.2)*1000);
}

document.getElementById("mute-btn").addEventListener("click", () => {
  muted = !muted;
  document.getElementById("mute-btn").textContent = muted ? "🔇" : "🔊";
  if (masterGain) masterGain.gain.value = muted ? 0 : 0.07;
});

// ============================================================
//  SMOOTH ILLUSTRATED AVATAR  (draws in 18×33 unit space, scaled)
//  Outfit: white tshirt, dark pink cardigan, dark blue bell bottoms, white sneakers
// ============================================================
function drawAvatar(ctx, ox, oy, scale, frame) {
  const s = scale || 4;
  ctx.save();
  ctx.translate(ox, oy);
  ctx.scale(s, s);

  // ---- Colour palette ----
  const H0='#1A0700', H1='#2C1006', H2='#4A2010', H3='#6A3818', H4='#8C5628';
  const SK='#F5C87A', SKD='#D8A050';
  const EB='#2A1000';
  const GF='#223355', GL='#CCE8FF', GLD='#90C4EE', PU='#001133';
  const WT='#F0F0FF', WTD='#C8C8E0', WTL='#FFFFFF';
  const CD='#C0185A', CDL='#E03878', CDD='#881040';
  const JN='#18224A', JNL='#2C3A78', JND='#0E1630', JNH='#3858C0';
  const SN='#F2F2F4', SND='#BEBEC8', SNT='#181828';

  // Pure pixel helpers — no smooth curves anywhere
  const p = (c, r, clr) => { ctx.fillStyle = clr; ctx.fillRect(c, r, 1, 1); };
  const f = (x, y, w, h, clr) => { ctx.fillStyle = clr; ctx.fillRect(x, y, w, h); };

  // ===== HAIR — short, voluminous, curly =====
  // Outer volume columns (wider than head for poof)
  f(0,3,2,16,H0);   f(16,3,2,16,H0);
  // Main side columns
  f(1,0,2,19,H0);   f(15,0,2,19,H0);
  // Fill hair-face gap at row 3 (between side columns and face)
  p(3,3,H0); p(14,3,H0);
  // Top band
  f(1,0,16,3,H1);
  f(3,0,12,1,H2);   f(5,0,8,1,H3);
  p(6,0,H4); p(9,0,H4); p(11,0,H4);
  // Center part
  f(8,0,2,5,H0);
  // Volume bumps — irregular outline = curly texture
  p(0,5,H1);  p(17,5,H1);
  p(0,7,H0);  p(17,7,H0);
  p(0,9,H1);  p(17,9,H1);
  p(0,11,H0); p(17,11,H0);
  p(0,13,H1); p(17,13,H1);
  p(0,15,H0); p(17,15,H0);
  // Curly ends at shoulder level (y=16-20)
  f(0,16,3,1,H0);   f(15,16,3,1,H0);   // curl top
  p(0,17,H1);  f(1,17,2,1,H0);         // left curl loop
  p(17,17,H1); f(15,17,2,1,H0);        // right curl loop
  f(0,18,2,1,H2);  p(2,18,H0);         // left curl body
  p(15,18,H0); f(16,18,2,1,H2);        // right curl body
  p(1,19,H1);  p(0,19,H0);             // left curl tail
  p(16,19,H1); p(17,19,H0);            // right curl tail
  // Inner curl peeking behind face
  f(2,17,1,3,H1);   f(14,17,1,3,H1);
  p(3,19,H2);       p(13,19,H2);
  // Curtain bangs
  f(5,3,4,1,H2); f(3,4,5,1,H1); f(2,5,5,2,H2); f(1,7,5,2,H1); f(1,9,4,2,H0); f(3,6,3,1,H3);
  f(9,3,4,1,H2); f(10,4,5,1,H1); f(11,5,5,2,H2); f(12,7,5,2,H1); f(13,9,4,2,H0); f(12,6,3,1,H3);

  // ===== FACE (pixel blocks, no gradients or ellipses) =====
  f(5,2,8,1,SK);
  f(4,3,10,2,SK);
  f(3,5,12,7,SK);
  f(4,12,10,1,SK);
  f(5,13,8,1,SK);
  // Side shading
  f(3,5,1,7,SKD); f(14,5,1,7,SKD);
  f(4,3,1,2,SKD); f(13,3,1,2,SKD);
  // Cheeks
  f(3,9,2,2,'#F2BABB');
  f(13,9,2,2,'#F2BABB');

  // ===== EYEBROWS (pixel rows) =====
  f(5,4,3,1,EB);
  f(10,4,3,1,EB);

  // ===== GLASSES (pixel rect frames, no ellipses) =====
  // Left lens frame
  f(4,5,5,1,GF); f(4,9,5,1,GF); f(4,5,1,5,GF); f(8,5,1,5,GF);
  f(5,6,3,3,GL);
  // Right lens frame
  f(9,5,5,1,GF); f(9,9,5,1,GF); f(9,5,1,5,GF); f(13,5,1,5,GF);
  f(10,6,3,3,GL);
  // Bridge
  p(8,7,GF); p(9,7,GF);
  // Iris + pupils
  f(5,7,2,2,GLD); f(10,7,2,2,GLD);
  p(6,8,PU); p(11,8,PU);
  p(5,6,'#EEFAFF'); p(10,6,'#EEFAFF');

  // ===== NOSE (2 pixels) =====
  p(8,10,SKD); p(9,10,SKD);

  // ===== MOUTH (curved smile, no teeth) =====
  // corner lift dots at y=11 give the upward arc of a smile
  p(6,11,'#CC2850'); p(11,11,'#CC2850');
  f(7,12,4,1,'#CC2850');

  // ===== NECK =====
  f(7,13,4,2,SK);

  // ===== ARMS / SLEEVES =====
  f(0,15,2,8,CD);
  f(16,15,2,8,CD);
  f(0,15,1,6,CDL); f(17,15,1,6,CDL);

  // ===== WHITE T-SHIRT (pixel rects) =====
  f(5,15,8,8,WT);
  f(5,15,1,8,WTD); f(12,15,1,8,WTD);
  f(6,15,1,6,WTL);
  // Collar V
  p(8,15,WTD); p(9,15,WTD);
  p(7,16,WTD); p(10,16,WTD);

  // ===== CARDIGAN (pixel rects, no path beziers) =====
  f(1,15,4,8,CD);   f(4,15,1,8,CDL);
  f(13,15,4,8,CD);  f(13,15,1,8,CDL);
  f(1,22,16,1,CDD);
  // Buttons
  p(8,17,CDL); p(8,19,CDL); p(8,21,CDL);

  // ===== HANDS (pixel blobs) =====
  f(0,22,2,2,SK);
  f(16,22,2,2,SK);

  // ===== WAISTBAND (flat color, no gradient) =====
  f(4,22,10,2,JNH);
  f(4,23,10,1,JN);

  // ===== THIGHS =====
  f(4,24,4,4,JN);  f(5,24,1,4,JNL);
  f(10,24,4,4,JN); f(11,24,1,4,JNL);
  f(8,24,2,4,JND);

  // ===== BELL BOTTOMS (pixel rects, no bezier) =====
  const fr = frame||0;
  if(fr===0){
    f(3,28,6,4,JN);  f(4,28,1,4,JNL);
    f(9,28,6,4,JN);  f(10,28,1,4,JNL);
    f(2,31,7,1,JN);  f(9,31,7,1,JN);
    f(3,32,5,1,JNH); f(9,32,5,1,JNH);
  } else {
    f(2,28,6,4,JN);  f(3,28,1,4,JNL);
    f(10,28,6,4,JN); f(11,28,1,4,JNL);
    f(1,31,7,1,JN);  f(10,31,7,1,JN);
    f(2,32,5,1,JNH); f(10,32,5,1,JNH);
  }

  // ===== SNEAKERS (pixel rects, no roundRect) =====
  if(fr===0){
    f(2,32,7,2,SN); f(2,32,1,2,SND); f(7,32,2,1,SNT);
    f(9,32,7,2,SN); f(15,32,1,2,SND); f(9,32,2,1,SNT);
  } else {
    f(1,32,7,2,SN); f(1,32,1,2,SND); f(6,32,2,1,SNT);
    f(10,32,7,2,SN); f(16,32,1,2,SND); f(10,32,2,1,SNT);
  }

  ctx.restore();
}

// ============================================================
//  BOOT SCREEN
// ============================================================
const bootCanvas=document.getElementById("boot-canvas"), bootCtx=bootCanvas.getContext("2d");
const bootCharCv=document.getElementById("boot-char-canvas"), bootCharCtx=bootCharCv.getContext("2d");
const startBtn=document.getElementById("start-btn"), bootHint=document.getElementById("boot-hint");
const bootLabel=document.getElementById("boot-progress-label"), bootStarsRow=document.getElementById("boot-stars-row");
const TOTAL_STARS=8;
let bootDone=false, bootCharFrame=0, bootCharTick=0, bootCharX=0;
let bootPhase="loading", starIdx=0;
let bootRunning=true;

function resizeBoot(){ bootCanvas.width=window.innerWidth; bootCanvas.height=window.innerHeight; }
resizeBoot(); window.addEventListener("resize",resizeBoot);

const loadingPhrases=["collecting mushrooms…","watering pixel plants…","loading sunshine…","charging star power…","brewing potions…","feeding pixel birds…","polishing trophies…","almost there…"];
const bootClouds=Array.from({length:9},(_,i)=>({x:(i*170+Math.random()*80)%1400,y:18+Math.random()*110,w:90+Math.random()*110,speed:0.28+Math.random()*0.35,tier:i<5?'far':'near'}));
const bootPlatforms=[{x:120,y:0.60,tiles:4},{x:300,y:0.50,tiles:3},{x:480,y:0.65,tiles:5},{x:680,y:0.55,tiles:3},{x:860,y:0.60,tiles:4},{x:1050,y:0.50,tiles:3}];
const coinBlocks=[{x:160,yR:0.48},{x:340,yR:0.40},{x:560,yR:0.52},{x:740,yR:0.44},{x:920,yR:0.48}];
const bootTrees=[{x:60,size:1.0},{x:240,size:1.3},{x:420,size:0.9},{x:600,size:1.2},{x:780,size:1.0},{x:960,size:1.1},{x:1100,size:0.9}];

function drawBootPlatform(ctx,x,y,tiles){const ts=16;for(let i=0;i<tiles;i++){ctx.fillStyle='#A05020';ctx.fillRect(x+i*ts,y,ts,ts);ctx.fillStyle='#C87040';ctx.fillRect(x+i*ts,y,ts,3);ctx.fillStyle='#6A3010';ctx.fillRect(x+i*ts,y+ts-3,ts,3);}}
function drawCoinBlock(ctx,x,y){ctx.fillStyle='#FFB800';ctx.fillRect(x,y,22,22);ctx.fillStyle='#FFF060';ctx.fillRect(x+2,y+2,18,5);ctx.fillStyle='#FF8800';ctx.fillRect(x,y+18,22,4);ctx.fillStyle='#FFCC00';ctx.fillRect(x+7,y+6,8,10);}
function drawPixelTree(ctx,x,y,h,type){const trunk=Math.max(6,Math.floor(h*0.25));const pals=[['#2A8820','#3AA830','#50C840'],['#206830','#2A8840','#3AAA50'],['#305828','#409838','#50C048']];const pal=pals[type%3];ctx.fillStyle='#6A3510';ctx.fillRect(x-trunk/2,y,trunk,h);for(let i=0;i<3;i++){ctx.fillStyle=pal[i];const fw=(3-i)*h*0.55,fh=h*0.65,fy=y-(i+1)*h*0.55;ctx.fillRect(x-fw/2,fy,fw,fh);}}

function drawBootBg(){
  const W=bootCanvas.width,H=bootCanvas.height;
  const sky=bootCtx.createLinearGradient(0,0,0,H);
  sky.addColorStop(0,"#0D0628");sky.addColorStop(0.45,"#1E1050");sky.addColorStop(0.8,"#122818");
  bootCtx.fillStyle=sky; bootCtx.fillRect(0,0,W,H);
  // Stars
  for(let i=0;i<80;i++){const sx=(i*137+50)%W,sy=(i*93+30)%(H*0.55);const sz=(Math.sin(Date.now()/600+i)+1)*1.8+0.5;const br=0.5+(Math.sin(Date.now()/700+i*2)+1)*0.25;bootCtx.fillStyle=`rgba(255,255,200,${br})`;bootCtx.fillRect(sx,sy,sz,sz);}
  // New moon (crescent)
  {const mx=W*0.86+10,my=H*0.13+10,mr=19;
  const mg=bootCtx.createRadialGradient(mx,my,0,mx,my,mr*2.8);
  mg.addColorStop(0,'rgba(255,248,180,0.18)');mg.addColorStop(1,'transparent');
  bootCtx.fillStyle=mg;bootCtx.beginPath();bootCtx.arc(mx,my,mr*2.8,0,Math.PI*2);bootCtx.fill();
  bootCtx.fillStyle='#FFF8C0';bootCtx.beginPath();bootCtx.arc(mx,my,mr,0,Math.PI*2);bootCtx.fill();
  const skyC=bootCtx.createLinearGradient(0,0,0,my+mr);
  skyC.addColorStop(0,'#0D0628');skyC.addColorStop(0.45,'#1E1050');skyC.addColorStop(0.8,'#122818');
  bootCtx.fillStyle=skyC;bootCtx.beginPath();bootCtx.arc(mx+mr*0.58,my,mr*0.88,0,Math.PI*2);bootCtx.fill();}
  // Clouds — same puffy ellipse style as main background
  bootCtx.fillStyle="rgba(200,210,255,0.18)";
  bootClouds.filter(c=>c.tier==='far').forEach(c=>{drawBgCloud(bootCtx,c.x,c.y,c.w);c.x-=c.speed*0.5;if(c.x+c.w<0)c.x=W+20;});
  bootCtx.fillStyle="rgba(220,225,255,0.28)";
  bootClouds.filter(c=>c.tier==='near').forEach(c=>{drawBgCloud(bootCtx,c.x,c.y,c.w);c.x-=c.speed;if(c.x+c.w<0)c.x=W+20;});
  // Platforms
  bootPlatforms.forEach(pl=>drawBootPlatform(bootCtx,pl.x%W,H*pl.y,pl.tiles));
  // Coin blocks
  coinBlocks.forEach(cb=>drawCoinBlock(bootCtx,cb.x%W,H*cb.yR));
  // Ground
  bootCtx.fillStyle='#1A3A10';bootCtx.fillRect(0,H-56,W,56);
  bootCtx.fillStyle='#2E6020';bootCtx.fillRect(0,H-56,W,10);
  bootCtx.fillStyle='#3A8828';bootCtx.fillRect(0,H-48,W,4);
  // Trees
  bootTrees.forEach(t=>drawPixelTree(bootCtx,t.x%W,H-56-Math.round(t.size*48),Math.round(t.size*48),0));
  // Flowers
  const fCols=['#FFD040','#FF80A0','#FF6060','#C0A0FF','#80E0FF'];
  for(let i=0;i<W;i+=48){const fx=(i+16)%W,fy=H-62;bootCtx.fillStyle=fCols[(Math.floor(i/48))%5];bootCtx.fillRect(fx,fy,6,6);bootCtx.fillStyle='#FFFFFF';[[fx-6,fy],[fx+6,fy],[fx,fy-6],[fx,fy+6]].forEach(([x,y])=>bootCtx.fillRect(x,y,6,6));bootCtx.fillStyle='#60B830';bootCtx.fillRect(fx+2,fy+6,2,8);}
  // Bushes
  for(let i=0;i<W;i+=90){const bx=(i+30)%W,by=H-64;bootCtx.fillStyle='#2A7010';bootCtx.fillRect(bx,by,32,16);bootCtx.fillStyle='#40A020';bootCtx.fillRect(bx+4,by-8,24,14);bootCtx.fillStyle='#58CC2A';bootCtx.fillRect(bx+8,by-12,16,8);}
}

function bootLoop(){
  if(!bootRunning) return;
  bootCtx.clearRect(0,0,bootCanvas.width,bootCanvas.height);
  drawBootBg();
  bootCharTick++;
  if(bootCharTick%14===0) bootCharFrame=1-bootCharFrame;
  bootCharX=(bootCharX+1.0)%(bootCanvas.width+80);
  const groundY=bootCanvas.height-56-132;
  bootCtx.save(); bootCtx.imageSmoothingEnabled=false;
  drawAvatar(bootCtx,bootCharX-40,groundY,4,bootCharFrame);
  bootCtx.restore();
  bootCharCtx.clearRect(0,0,bootCharCv.width,bootCharCv.height);
  bootCharCtx.imageSmoothingEnabled=false;
  drawAvatar(bootCharCtx,0,0,8,bootCharFrame);
  requestAnimationFrame(bootLoop);
}

function addNextStar(){
  if(bootDone) return;
  if(starIdx>=TOTAL_STARS){
    bootPhase="ready";
    startBtn.style.display="block";
    bootHint.style.display="block";
    bootLabel.textContent="world loaded!";
    document.addEventListener("keydown",triggerStart,{once:true});
    return;
  }
  const star=document.createElement("span");
  star.className="boot-star";
  star.textContent="⭐";
  bootStarsRow.appendChild(star);
  starIdx++;
  bootLabel.textContent=loadingPhrases[Math.min(starIdx,loadingPhrases.length-1)];
  setTimeout(addNextStar,550);
}

function triggerStart(){
  if(bootDone)return;bootDone=true;
  bootRunning=false;
  try { initAudio(); playDing(); setTimeout(startChiptune,400); } catch(e) {}
  document.getElementById("boot-screen").style.display="none";
  document.getElementById("main-site").style.display="block";
  document.getElementById("mute-btn").style.display="block";
  document.getElementById("breather-btn").style.display="block";
  initMainSite();
}
startBtn.addEventListener("click",triggerStart);
document.getElementById("boot-screen").addEventListener("click",()=>{ if(bootPhase==="ready") triggerStart(); });
bootLoop();
setTimeout(addNextStar,800);

// ============================================================
//  MAIN SITE INIT
// ============================================================
// ============================================================
//  MARKDOWN → HTML (lightweight, safe — only applied to CMS content)
// ============================================================
function mdToHtml(text){
  if(!text) return '';
  return text
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>')
    .replace(/\*(.+?)\*/g,'<em>$1</em>')
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g,'<a href="$2" target="_blank" rel="noopener">$1</a>')
    .replace(/\n\n/g,'</p><p>')
    .replace(/\n/g,'<br>');
}

// ============================================================
//  CMS CONTENT LOADER
//  Fetches /content/*.json (written by Decap CMS via git-gateway).
//  Falls back gracefully when files are missing (local dev).
// ============================================================
async function loadCMSContent(){
  try {
    const [profileRes, skillsRes, projectsRes, siteTextRes, uiTextRes] = await Promise.all([
      fetch('/content/profile.json'),
      fetch('/content/skills.json'),
      fetch('/content/projects.json'),
      fetch('/content/site-text.json'),
      fetch('/content/ui-text.json'),
    ]);

    // ── Profile ────────────────────────────────────────────────
    if(profileRes.ok){
      const p=await profileRes.json();
      ['name','email','education','status','summary'].forEach(f=>{
        const el=document.querySelector(`[data-cms-field="${f}"]`);
        if(el&&p[f]) el.textContent=p[f];
      });
      const bioEl=document.getElementById('cms-bio');
      if(bioEl&&p.bio){
        bioEl.innerHTML='<p>'+mdToHtml(p.bio)+'</p>';
      }
      // Resume PDF link
      const resumeLink=document.getElementById('resume-link');
      const resumeTitle=document.getElementById('cms-resume-title');
      const resumeSub=document.getElementById('cms-resume-sub');
      if(p.resumeUrl){
        if(resumeLink){ resumeLink.href=p.resumeUrl; resumeLink.style.display='inline-block'; }
        if(resumeTitle) resumeTitle.textContent='Resume ready — click below to open!';
        if(resumeSub) resumeSub.textContent='';
      } else {
        if(resumeLink) resumeLink.style.display='none';
      }
    }

    // ── Skills ─────────────────────────────────────────────────
    if(skillsRes.ok){
      const s=await skillsRes.json();
      if(Array.isArray(s.skills)&&s.skills.length){
        SKILLS.length=0;
        s.skills.forEach(sk=>SKILLS.push({name:sk.name,level:Number(sk.level)}));
        renderSkills();
        setTimeout(animateSkillBars,400);
      }
    }

    // ── Projects ───────────────────────────────────────────────
    if(projectsRes.ok){
      const proj=await projectsRes.json();
      ['research','multimedia','blog','resources','features'].forEach(tab=>{
        if(Array.isArray(proj[tab])&&proj[tab].length) PROJECTS_DATA[tab]=proj[tab];
      });
      renderQuestMap(activeTab);
    }

    // ── Site Text ──────────────────────────────────────────────
    if(siteTextRes.ok){
      const t=await siteTextRes.json();
      if(t.pageTitle) document.title=t.pageTitle;
      if(t.bootSubtitle){
        const el=document.querySelector('.boot-sub');
        if(el) el.textContent=t.bootSubtitle;
      }
      if(t.ticker){
        const el=document.querySelector('.ticker');
        if(el) el.innerHTML=t.ticker+' &nbsp;&nbsp;&nbsp; '+t.ticker+' &nbsp;&nbsp;&nbsp;';
      }
    }

    // ── UI Text ────────────────────────────────────────────────
    if(uiTextRes.ok){
      const u=await uiTextRes.json();

      // Navigation buttons
      if(u.nav){
        document.querySelectorAll('[data-cms-nav]').forEach(el=>{
          const key=el.dataset.cmsNav;
          if(u.nav[key]) el.textContent=u.nav[key];
        });
      }

      // Section headers (h2 inside each section)
      if(u.sections){
        [['about','#about h2'],['skills','#skills h2'],['quests','#projects h2'],
         ['minigame','#minigame h2'],['guestbook','#contact h2']].forEach(([k,sel])=>{
          if(u.sections[k]){
            const el=document.querySelector(sel);
            if(el) el.textContent=u.sections[k];
          }
        });
      }

      // Footer
      if(u.footer){
        const ft=document.getElementById('cms-footer-top');
        const fb=document.getElementById('cms-footer-bottom');
        if(ft&&u.footer.copyright) ft.textContent=u.footer.copyright;
        if(fb&&u.footer.tagline)   fb.textContent=u.footer.tagline;
      }

      // Buttons
      if(u.buttons){
        const btnMap=[
          ['resumePreview','.resume-preview-btn'],
          ['resumeOpen','#resume-link'],
          ['breather','#breather-btn'],
        ];
        btnMap.forEach(([k,sel])=>{
          if(u.buttons[k]){
            const el=document.querySelector(sel);
            if(el) el.textContent=u.buttons[k];
          }
        });
        if(u.buttons.guestbookSend){
          const el=document.querySelector('.pc-send-btn');
          if(el) el.textContent=u.buttons.guestbookSend;
        }
        if(u.buttons.startBtn){
          const el=document.getElementById('start-btn');
          if(el) el.textContent=u.buttons.startBtn;
        }
      }

      // About card titles
      if(u.about){
        const t1=document.getElementById('cms-about-card1-title');
        const t2=document.getElementById('cms-about-card2-title');
        if(t1&&u.about.card1Title) t1.textContent=u.about.card1Title;
        if(t2&&u.about.card2Title) t2.textContent=u.about.card2Title;
      }

      // Guestbook labels
      if(u.guestbook){
        const gbPlaceholder=document.getElementById('gb-msg');
        if(gbPlaceholder&&u.guestbook.placeholder) gbPlaceholder.placeholder=u.guestbook.placeholder;
        const gbTitle=document.getElementById('cms-gb-card-title');
        const gbSub=document.getElementById('cms-gb-card-sub');
        if(gbTitle&&u.guestbook.cardTitle) gbTitle.textContent=u.guestbook.cardTitle;
        if(gbSub&&u.guestbook.cardSub)     gbSub.textContent=u.guestbook.cardSub;
      }
    }
  } catch(e){
    // Silently fall back to hardcoded defaults when running locally
  }
}

function initMainSite(){
  resizeBgCanvas(); window.addEventListener("resize",resizeBgCanvas);
  drawSimCharacter(); startBgAnimation();
  renderSkills();
  // Defer so layout is complete after display:block
  initQuestFilters();
  requestAnimationFrame(()=>requestAnimationFrame(()=>{
    renderQuestMap("research");
    window.addEventListener("resize",()=>renderQuestMap(activeTab));
  }));
  initBasketGame(); loadGuestbook(); initXPListeners();
  setTimeout(animateSkillBars,400);
  initLadder(); initBreather();
  loadCMSContent();
}

// ============================================================
//  HEADER AVATAR
// ============================================================
function drawSimCharacter(){
  const cv=document.getElementById("sim-canvas"), ctx=cv.getContext("2d");
  ctx.imageSmoothingEnabled=false; drawAvatar(ctx,0,0,8,0);
  let frame=0,tick=0;
  function bobAvatar(){ tick++; if(tick%30===0){frame=1-frame;ctx.clearRect(0,0,cv.width,cv.height);drawAvatar(ctx,0,0,8,frame);} requestAnimationFrame(bobAvatar); }
  bobAvatar();
}

// ============================================================
//  SCROLLING PIXEL WORLD BACKGROUND
// ============================================================
const bgCanvas=document.getElementById("bg-canvas"), bgCtx=bgCanvas.getContext("2d");
let bgOffset=0, bgTime=0;

function resizeBgCanvas(){ bgCanvas.width=window.innerWidth; bgCanvas.height=window.innerHeight; }

const STRIP=1200;
const bgTrees=Array.from({length:16},(_,i)=>({x:i*78+20,h:36+Math.random()*52,type:i%3}));
const bgCloudsA=Array.from({length:8},(_,i)=>({x:i*155+30,y:0.06+Math.random()*0.08,w:64+Math.random()*90}));
const bgCloudsB=Array.from({length:6},(_,i)=>({x:i*200+80,y:0.13+Math.random()*0.06,w:40+Math.random()*64}));
const bgPlatforms=[{x:80,yR:0.50,tiles:4},{x:260,yR:0.42,tiles:3},{x:440,yR:0.55,tiles:5},{x:620,yR:0.48,tiles:3},{x:820,yR:0.52,tiles:4},{x:1010,yR:0.44,tiles:3}];
const bgFlowers=Array.from({length:26},(_,i)=>({x:i*46+8,type:i%5}));
// Meadow tall grass positions
const bgGrass=Array.from({length:30},(_,i)=>({x:i*40+15,h:12+Math.random()*16}));
// Mushroom positions
const bgMushrooms=[{x:180,col:'#FF6060'},{x:420,col:'#FF80C0'},{x:660,col:'#FFD040'},{x:900,col:'#A0FF80'},{x:1080,col:'#FF6060'}];

// Woodland animals
let bgAnimalTime=0;
const bgRabbits=[{x:200,phase:0},{x:750,phase:Math.PI}];
const bgButterflies=[{x:350,py:0.40,phase:0},{x:850,py:0.38,phase:Math.PI*0.6}];
const bgBirds=[{x:500,py:0.18,phase:0},{x:900,py:0.22,phase:1.2}];
const bgDeer=[{x:600},{x:1100}];
const bgFish=[{x:180,phase:0},{x:480,phase:Math.PI},{x:820,phase:Math.PI*0.7}];

function drawBgCloud(ctx,x,y,w){
  const h=w*0.42,bx=x,by=y+h*0.3;
  // multiple overlapping ellipses = puffy cloud
  const puffs=[[0.5,0.6,0.48,0.55],[0.24,0.72,0.26,0.42],[0.76,0.72,0.26,0.42],[0.36,0.3,0.22,0.38],[0.64,0.3,0.22,0.38],[0.5,0.12,0.17,0.28]];
  puffs.forEach(([fx,fy,rx,ry])=>{ctx.beginPath();ctx.ellipse(bx+w*fx,by+h*fy,w*rx,h*ry,0,0,Math.PI*2);ctx.fill();});
}

function drawBgTree(ctx,x,y,h,type){
  const trunk=Math.max(6,Math.floor(h*0.25));
  const pals=[['#2A8020','#3AA830','#50C840'],['#206830','#2A8840','#3AAA50'],['#305828','#409838','#50C048']];
  const pal=pals[type%3];
  ctx.fillStyle='#6A3510'; ctx.fillRect(x-trunk/2,y,trunk,h);
  for(let i=0;i<3;i++){ctx.fillStyle=pal[i];const fw=(3-i)*h*0.58,fh=h*0.6,fy=y-(i+1)*h*0.55;ctx.fillRect(x-fw/2,fy,fw,fh);}
  ctx.fillStyle=pals[type%3][2];ctx.fillRect(x-4,y-h*1.6,8,6); // treetop
}

function drawBgPlatform(ctx,x,y,tiles){const ts=16;for(let i=0;i<tiles;i++){ctx.fillStyle='#8B5020';ctx.fillRect(x+i*ts,y,ts,ts);ctx.fillStyle='#B87040';ctx.fillRect(x+i*ts,y,ts,4);ctx.fillStyle='#5A3010';ctx.fillRect(x+i*ts,y+ts-3,ts,3);}}

function drawStream(ctx,W,H){
  const sy=H*0.84,sh=16;
  ctx.fillStyle='#4888B8'; ctx.fillRect(0,sy,W,sh);
  ctx.fillStyle='#60A8D8';
  for(let x=0;x<W;x+=18){const oy2=Math.sin((x+bgTime*2.5)/36)*3;ctx.fillRect(x,sy+oy2+4,10,4);}
  ctx.fillStyle='rgba(255,255,255,0.35)';
  for(let x=0;x<W;x+=30){const oy2=Math.sin((x+bgTime*3)/25)*2;ctx.fillRect(x+5,sy+oy2+2,8,2);}
  // Lily pads
  ctx.fillStyle='#40A820';
  for(let x=60;x<W;x+=150){const px=(x-bgOffset*0.6+STRIP)%STRIP;ctx.fillRect(px,sy+2,14,10);ctx.fillRect(px+3,sy,8,4);}
  // Fish jumping in and out
  bgFish.forEach(f=>{
    const fx=((f.x-bgOffset*0.6)%STRIP+STRIP)%STRIP;
    const jumpCycle=bgAnimalTime*0.06+f.phase;
    const jumpH=Math.max(0,Math.sin(jumpCycle)*22);
    if(jumpH>1){
      const fy=sy-jumpH;
      const flip=(Math.sin(jumpCycle+0.5)<0);
      drawFish(ctx,fx,fy,flip);
      if(fx<W)drawFish(ctx,fx+STRIP,fy,flip);
    }
  });
  // Banks
  ctx.fillStyle='#50881A'; ctx.fillRect(0,sy-5,W,6);
  ctx.fillStyle='#389010'; ctx.fillRect(0,sy-5,W,2);
  ctx.fillStyle='#305010'; ctx.fillRect(0,sy+sh,W,2);
  // Pebbles
  ctx.fillStyle='#A09080';
  for(let x=20;x<W;x+=50){ctx.fillRect(x,sy-3,5,2);ctx.fillRect(x+24,sy+sh+1,4,2);}
}

function drawRabbit(ctx,x,y,hopAmt){
  const by=y-hopAmt;
  // Body
  ctx.fillStyle='#E0D8C8'; ctx.fillRect(x+2,by+5,12,9);
  // Tail
  ctx.fillStyle='#F8F4F0'; ctx.fillRect(x,by+8,4,4);
  // Head
  ctx.fillStyle='#E0D8C8'; ctx.fillRect(x+8,by,9,7);
  // Ears
  ctx.fillStyle='#D0C8B8'; ctx.fillRect(x+9,by-9,3,9); ctx.fillRect(x+13,by-7,3,7);
  ctx.fillStyle='#FFBBAA'; ctx.fillRect(x+10,by-7,1,6); ctx.fillRect(x+14,by-5,1,5);
  // Eye
  ctx.fillStyle='#222'; ctx.fillRect(x+14,by+1,2,2);
  // Nose
  ctx.fillStyle='#FF9999'; ctx.fillRect(x+16,by+3,2,1);
  // Legs
  ctx.fillStyle='#D0C8B8';
  if(hopAmt>4){ctx.fillRect(x+3,by+13,4,3);ctx.fillRect(x+10,by+13,4,3);}
  else{ctx.fillRect(x+3,by+11,4,5);ctx.fillRect(x+10,by+11,4,5);}
}

function drawButterfly(ctx,x,y,frame){
  const wingOpen=Math.sin(bgAnimalTime*0.25)>0;
  ctx.fillStyle='#FF80C0';
  if(wingOpen){
    ctx.fillRect(x-12,y,9,7); ctx.fillRect(x+3,y,9,7);
    ctx.fillRect(x-10,y+6,8,5); ctx.fillRect(x+2,y+6,8,5);
    ctx.fillStyle='#FFAADD';
    ctx.fillRect(x-8,y+1,4,3); ctx.fillRect(x+4,y+1,4,3);
  } else {
    ctx.fillRect(x-6,y+1,5,8); ctx.fillRect(x+1,y+1,5,8);
    ctx.fillStyle='#FFAADD';
    ctx.fillRect(x-4,y+2,2,4); ctx.fillRect(x+2,y+2,2,4);
  }
  ctx.fillStyle='#444'; ctx.fillRect(x-1,y-1,2,12);
  // Antennae
  ctx.fillStyle='#666'; ctx.fillRect(x-2,y-4,1,4); ctx.fillRect(x+1,y-4,1,4);
  ctx.fillStyle='#FF80C0'; ctx.fillRect(x-3,y-5,2,2); ctx.fillRect(x+1,y-5,2,2);
}

function drawBird(ctx,x,y){
  ctx.fillStyle='#667788';
  ctx.fillRect(x-1,y,4,3);   // body
  if(Math.sin(bgAnimalTime*0.2)>0){
    ctx.fillRect(x-8,y-2,8,2); ctx.fillRect(x+3,y-2,8,2); // wings up
  } else {
    ctx.fillRect(x-8,y+2,8,2); ctx.fillRect(x+3,y+2,8,2); // wings down
  }
  ctx.fillStyle='#FFD050'; ctx.fillRect(x+2,y+1,3,2); // beak
  ctx.fillStyle='#111';    ctx.fillRect(x+1,y,2,2);  // eye
}

function drawBalloon(ctx,x,y,col,quote){
  const rx=28,ry=35;
  ctx.save();
  // shadow
  ctx.fillStyle='rgba(0,0,0,0.12)';ctx.beginPath();ctx.ellipse(x+4,y+5,rx,ry,0,0,Math.PI*2);ctx.fill();
  // balloon body
  const bg=ctx.createRadialGradient(x-rx*0.3,y-ry*0.3,3,x,y,rx*1.1);
  bg.addColorStop(0,'rgba(255,255,255,0.85)');bg.addColorStop(0.35,col);bg.addColorStop(1,col);
  ctx.fillStyle=bg;ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fill();
  // sheen
  ctx.fillStyle='rgba(255,255,255,0.5)';ctx.beginPath();ctx.ellipse(x-rx*0.28,y-ry*0.32,rx*0.22,ry*0.22,Math.PI/5,0,Math.PI*2);ctx.fill();
  // knot
  ctx.fillStyle=col;ctx.beginPath();ctx.ellipse(x,y+ry+3,5,6,0,0,Math.PI*2);ctx.fill();
  // string
  ctx.strokeStyle='rgba(80,50,20,0.45)';ctx.lineWidth=1.5;
  ctx.beginPath();ctx.moveTo(x,y+ry+9);ctx.bezierCurveTo(x+10,y+ry+30,x-10,y+ry+55,x,y+ry+80);ctx.stroke();
  // quote label — positioned BELOW the balloon
  const labelY=y+ry+100;
  ctx.save();
  ctx.fillStyle='rgba(255,255,255,0.88)';
  ctx.beginPath();ctx.roundRect(x-52,labelY-14,104,42,6);ctx.fill();
  ctx.strokeStyle=col;ctx.lineWidth=2;
  ctx.beginPath();ctx.roundRect(x-52,labelY-14,104,42,6);ctx.stroke();
  ctx.fillStyle='rgba(50,20,80,0.92)';ctx.font='7px "Press Start 2P",monospace';ctx.textAlign='center';
  const words=quote.split(' ');let line='',lines=[];
  for(const w of words){const t=line?line+' '+w:w;if(ctx.measureText(t).width<90){line=t;}else{if(line)lines.push(line);line=w;}}
  if(line)lines.push(line);
  lines.slice(0,3).forEach((l,i)=>ctx.fillText(l,x,labelY+i*11));
  ctx.restore();
  ctx.restore();
}

function drawDeer(ctx,x,y){
  ctx.fillStyle='#C87828';
  ctx.fillRect(x+4,y+12,18,10); // body
  ctx.fillRect(x+18,y+2,8,10);  // head
  ctx.fillRect(x+16,y+8,6,8);   // neck
  ctx.fillRect(x+5,y+22,4,10);  ctx.fillRect(x+10,y+22,4,10);
  ctx.fillRect(x+14,y+22,4,10); ctx.fillRect(x+19,y+22,4,10);
  // Antlers
  ctx.fillStyle='#8B5A0A';
  ctx.fillRect(x+20,y-4,2,8); ctx.fillRect(x+18,y-2,4,2); ctx.fillRect(x+22,y-2,4,2);
  ctx.fillRect(x+25,y-4,2,8); ctx.fillRect(x+23,y-2,4,2); ctx.fillRect(x+27,y-2,4,2);
  // Belly spot
  ctx.fillStyle='#E8C080'; ctx.fillRect(x+8,y+14,10,5);
  // Eye
  ctx.fillStyle='#111'; ctx.fillRect(x+23,y+4,2,2);
  // Ear
  ctx.fillStyle='#E8A060'; ctx.fillRect(x+25,y+2,5,6);
  ctx.fillStyle='#FFD0A0'; ctx.fillRect(x+26,y+3,3,4);
}

function drawFish(ctx,x,y,flip){
  ctx.save();
  if(flip){ctx.scale(-1,1);x=-x;}
  const bg=ctx.createLinearGradient(x,y-2,x,y+14);
  bg.addColorStop(0,'#FFA060');bg.addColorStop(0.5,'#FF6030');bg.addColorStop(1,'#E03010');
  ctx.fillStyle=bg;
  ctx.beginPath();ctx.ellipse(x+10,y+6,10,6,0,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle='rgba(255,130,60,0.4)';ctx.lineWidth=1;
  for(let i=0;i<3;i++){ctx.beginPath();ctx.arc(x+4+i*5,y+5,3,0,Math.PI);ctx.stroke();}
  ctx.fillStyle='#FF7040';
  ctx.beginPath();ctx.moveTo(x+6,y+1);ctx.lineTo(x+13,y-7);ctx.lineTo(x+17,y+1);ctx.closePath();ctx.fill();
  ctx.fillStyle='#FF5828';
  ctx.beginPath();ctx.moveTo(x+19,y+3);ctx.lineTo(x+26,y-4);ctx.lineTo(x+26,y+13);ctx.closePath();ctx.fill();
  ctx.fillStyle='#FF7848';
  ctx.beginPath();ctx.moveTo(x+19,y+6);ctx.lineTo(x+24,y+2);ctx.lineTo(x+24,y+10);ctx.closePath();ctx.fill();
  ctx.fillStyle='rgba(255,160,80,0.7)';
  ctx.beginPath();ctx.moveTo(x+9,y+7);ctx.lineTo(x+14,y+13);ctx.lineTo(x+8,y+12);ctx.closePath();ctx.fill();
  ctx.fillStyle='#180800';ctx.beginPath();ctx.arc(x+4,y+5,2.5,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='rgba(255,255,255,0.65)';ctx.beginPath();ctx.arc(x+3.2,y+4,1,0,Math.PI*2);ctx.fill();
  ctx.restore();
}

function drawMeadowGrass(ctx,x,y,h){
  ctx.fillStyle='#50A820';
  ctx.fillRect(x,y-h,2,h);
  ctx.fillRect(x-2,y-h*0.8,2,h*0.8);
  ctx.fillRect(x+2,y-h*0.9,2,h*0.9);
  ctx.fillStyle='#68CC30';
  ctx.fillRect(x,y-h-2,4,3);
}

function drawMushroom(ctx,x,y,col){
  ctx.fillStyle='#F0D0A0'; ctx.fillRect(x+4,y+12,6,8);
  ctx.fillStyle=col; ctx.fillRect(x,y,14,14); ctx.fillRect(x+2,y-4,10,6);
  ctx.fillStyle='rgba(255,255,255,0.6)'; ctx.fillRect(x+2,y+2,4,4); ctx.fillRect(x+8,y+4,3,3);
}

function drawBg(){
  const W=bgCanvas.width, H=bgCanvas.height;
  bgCtx.clearRect(0,0,W,H);
  bgAnimalTime++;

  // Sky gradient — more vivid/saturated
  const sky=bgCtx.createLinearGradient(0,0,0,H);
  sky.addColorStop(0,'#7EC8F0');
  sky.addColorStop(0.5,'#A8DCF8');
  sky.addColorStop(0.72,'#B0E8CC');
  sky.addColorStop(1,'#68C440');
  bgCtx.fillStyle=sky; bgCtx.fillRect(0,0,W,H);

  // Sun with rotating pulsing rays
  const sx=W-80,sy=44,sunR=18;
  const sunCx=sx+sunR,sunCy=sy+sunR;
  const pulse=1+Math.sin(bgAnimalTime*0.08)*0.15;
  const rayAngle=bgAnimalTime*0.025;
  // Glow
  const sg=bgCtx.createRadialGradient(sunCx,sunCy,sunR*0.5,sunCx,sunCy,sunR*4);
  sg.addColorStop(0,'rgba(255,220,60,0.35)');sg.addColorStop(1,'transparent');
  bgCtx.fillStyle=sg;bgCtx.fillRect(sunCx-sunR*4,sunCy-sunR*4,sunR*8,sunR*8);
  // Rays (8 rotating)
  bgCtx.save();bgCtx.translate(sunCx,sunCy);bgCtx.rotate(rayAngle);
  for(let i=0;i<8;i++){
    bgCtx.save();bgCtx.rotate(i*Math.PI/4);
    const rLen=(sunR*2.2+Math.sin(bgAnimalTime*0.12+i)*sunR*0.5)*pulse;
    bgCtx.fillStyle='rgba(255,215,40,0.7)';
    bgCtx.fillRect(-3,sunR+2,6,rLen);
    bgCtx.restore();
  }
  bgCtx.restore();
  // Sun body (pixel circle)
  bgCtx.fillStyle='rgba(255,215,40,0.9)';
  for(let r=0;r<5;r++)for(let c=0;c<5;c++){if((r===0||r===4)&&(c===0||c===4))continue;bgCtx.fillRect(sx+c*8,sy+r*8,8,8);}
  bgCtx.fillStyle='rgba(255,240,120,0.95)';
  bgCtx.fillRect(sx+8,sy+4,16,4);bgCtx.fillRect(sx+4,sy+8,4,16);

  // Far clouds
  bgCtx.fillStyle='rgba(255,255,255,0.50)';
  bgCloudsA.forEach(c=>{const ox2=((c.x-bgOffset*0.1)%STRIP+STRIP)%STRIP;const cy=H*c.y;drawBgCloud(bgCtx,ox2,cy,c.w);if(ox2<W)drawBgCloud(bgCtx,ox2+STRIP,cy,c.w);});
  // Near clouds
  bgCtx.fillStyle='rgba(255,255,255,0.65)';
  bgCloudsB.forEach(c=>{const ox2=((c.x-bgOffset*0.18)%STRIP+STRIP)%STRIP;const cy=H*c.y;drawBgCloud(bgCtx,ox2,cy,c.w);if(ox2<W)drawBgCloud(bgCtx,ox2+STRIP,cy,c.w);});


  // Hill height functions — wide, tall, well-separated bumps
  const farHt=hx=>H*(0.28+0.16*Math.max(0,Math.sin(hx/160))+0.14*Math.max(0,Math.sin(hx/180+2.1))+0.12*Math.max(0,Math.sin(hx/140+4.3))+0.09*Math.max(0,Math.sin(hx/210+1.0)));
  const nearHt=hx=>H*(0.14+0.12*Math.max(0,Math.sin(hx/140+0.8))+0.10*Math.max(0,Math.sin(hx/120+2.5))+0.08*Math.max(0,Math.sin(hx/165+4.2)));

  // ── FAR HILLS ─────────────────────────────────────────────
  const farMtnGrad=bgCtx.createLinearGradient(0,H*0.3,0,H);
  farMtnGrad.addColorStop(0,'#7EB88A');farMtnGrad.addColorStop(0.5,'#5CA06A');farMtnGrad.addColorStop(1,'#489050');
  bgCtx.fillStyle=farMtnGrad;
  for(let x=-STRIP;x<W+STRIP;x+=8){const hx=x-(bgOffset*0.12)%STRIP;const ht=farHt(hx);bgCtx.fillRect(x,H-ht,8,ht);}
  // Snow caps
  bgCtx.fillStyle='#DFF0FF';
  for(let x=-STRIP;x<W+STRIP;x+=8){const hx=x-(bgOffset*0.12)%STRIP;const ht=farHt(hx);if(ht>H*0.42)bgCtx.fillRect(x,H-ht,8,Math.min(ht*0.06,14));}
  // Trees — only on hill peaks; height recomputed at drawn position to prevent floating
  {const d=(bgOffset*0.12)%STRIP;for(let x=0;x<W+STRIP;x+=130){const tx2=((x-bgOffset*0.12)%STRIP+STRIP)%STRIP;const ht=farHt(tx2-d);if(ht<H*0.38||tx2>=W+60)continue;const th=22;drawBgTree(bgCtx,tx2,H-ht-th,th,0);}}

  // ── NEAR HILLS ────────────────────────────────────────────
  const nearMtnGrad=bgCtx.createLinearGradient(0,H*0.5,0,H);
  nearMtnGrad.addColorStop(0,'#68C858');nearMtnGrad.addColorStop(0.5,'#52A840');nearMtnGrad.addColorStop(1,'#3E8830');
  bgCtx.fillStyle=nearMtnGrad;
  for(let x=-STRIP;x<W+STRIP;x+=8){const hx=x-(bgOffset*0.22)%STRIP;const ht=nearHt(hx);bgCtx.fillRect(x,H-ht,8,ht);}
  // Trees — only on hill peaks; height recomputed at drawn position
  {const d=(bgOffset*0.22)%STRIP;for(let x=0;x<W+STRIP;x+=110){const tx2=((x-bgOffset*0.22)%STRIP+STRIP)%STRIP;const ht=nearHt(tx2-d);if(ht<H*0.22||tx2>=W+60)continue;const th=28;drawBgTree(bgCtx,tx2,H-ht-th,th,1+Math.floor(x/110)%2);}}

  // Deer on far hills (at hill surface)
  bgDeer.forEach(d=>{
    const dx=((d.x-bgOffset*0.12)%STRIP+STRIP)%STRIP;
    const hx=dx-(bgOffset*0.12)%STRIP;const ht=farHt(hx);
    drawDeer(bgCtx,dx,H-ht-32);
    if(dx<W){const hx2=(dx+STRIP)-(bgOffset*0.12)%STRIP;drawDeer(bgCtx,dx+STRIP,H-farHt(hx2)-32);}
  });

  // ── MEADOW STRIP ────────────────────────────────────────────
  const meadowTop=H*0.76;
  bgCtx.fillStyle='#5CC840';bgCtx.fillRect(0,meadowTop,W,H*0.82-meadowTop+4);
  bgCtx.fillStyle='#70DD50';bgCtx.fillRect(0,meadowTop,W,5);
  bgGrass.filter((_,i)=>i%3===0).forEach(g=>{const gx=((g.x-bgOffset*0.5)%STRIP+STRIP)%STRIP;const gy=meadowTop+12;drawMeadowGrass(bgCtx,gx,gy,g.h);if(gx<W)drawMeadowGrass(bgCtx,gx+STRIP,gy,g.h);});
  bgMushrooms.filter((_,i)=>i%2===0).forEach(m=>{const mx=((m.x-bgOffset*0.5)%STRIP+STRIP)%STRIP;const my=meadowTop+4;drawMushroom(bgCtx,mx,my,m.col);if(mx<W)drawMushroom(bgCtx,mx+STRIP,my,m.col);});
  // Rabbits on meadow
  bgRabbits.forEach(rb=>{
    const rx=((rb.x-bgOffset*0.52)%STRIP+STRIP)%STRIP;
    const hop=Math.abs(Math.sin(bgAnimalTime*0.12+rb.phase))*14;
    drawRabbit(bgCtx,rx,meadowTop+14,hop);
    if(rx<W)drawRabbit(bgCtx,rx+STRIP,meadowTop+14,hop);
  });
  // Butterflies in sky (higher up)
  bgButterflies.forEach(bt=>{
    const bx=((bt.x-bgOffset*0.25)%STRIP+STRIP)%STRIP;
    const by=H*0.26+Math.sin(bgAnimalTime*0.05+bt.phase)*28;
    drawButterfly(bgCtx,bx,by,0);
    if(bx<W)drawButterfly(bgCtx,bx+STRIP,by,0);
  });
  bgBirds.filter((_,i)=>i===0).forEach(bd=>{
    const bx=((-bgOffset*0.15+bd.x)%STRIP+STRIP+STRIP)%STRIP;
    const by=H*0.28+Math.sin(bgAnimalTime*0.04+bd.phase)*22;
    drawBird(bgCtx,bx,by);
    if(bx<W)drawBird(bgCtx,bx+STRIP,by);
  });

  // ── STREAM (near bottom, above ground) ───────────────────
  drawStream(bgCtx,W,H);

  // ── GRASS GROUND with wildflowers ─────────────────────────
  const groundTop=H-52;
  bgCtx.fillStyle='#4AAA28';bgCtx.fillRect(0,groundTop,W,52);
  bgCtx.fillStyle='#5CC840';bgCtx.fillRect(0,groundTop,W,10);
  bgCtx.fillStyle='#70DD50';bgCtx.fillRect(0,groundTop,W,4);
  bgCtx.fillStyle='#3A8018';bgCtx.fillRect(0,H-5,W,5);
  const wfCols=['#FFD040','#FF80A0','#FF5070','#C0A0FF','#FFFFFF','#FF9930','#80EEFF','#FFB8E0','#A0FF80','#FFDD00'];
  // Continuous flower row — index-based, no modulo gaps
  {
    const step=36, bgOffF=bgOffset*0.6;
    const firstIdx=Math.floor((bgOffF-40)/step)-1;
    for(let idx=firstIdx;;idx++){
      const fx=idx*step+8-bgOffF;
      if(fx>W+30) break;
      const ai=Math.abs(idx);
      const ci=((idx%wfCols.length)+wfCols.length)%wfCols.length;
      const fy=groundTop+3+((ai*7)%8);
      const psz=8+(ai*3)%6;
      const pw=psz-1;
      bgCtx.fillStyle='#3A9010';
      bgCtx.fillRect(fx+psz/2-1,fy+psz,3,8+((ai*5)%6));
      bgCtx.fillStyle=wfCols[ci];
      bgCtx.fillRect(fx,fy,psz,psz);
      bgCtx.fillStyle='rgba(255,255,255,0.75)';
      bgCtx.fillRect(fx-pw,fy+(psz-pw)/2,pw,pw);
      bgCtx.fillRect(fx+psz,fy+(psz-pw)/2,pw,pw);
      bgCtx.fillRect(fx+(psz-pw)/2,fy-pw,pw,pw);
      bgCtx.fillRect(fx+(psz-pw)/2,fy+psz,pw,pw);
      bgCtx.fillStyle='rgba(255,255,255,0.9)';
      bgCtx.fillRect(fx+1,fy+1,2,2);
    }
  }

  bgOffset+=0.4;
}

function startBgAnimation(){ function bgLoop(){drawBg();requestAnimationFrame(bgLoop);} bgLoop(); }

// ============================================================
//  XP / COINS
// ============================================================
let xp=parseInt(localStorage.getItem("xp")||"0");
let coins=parseInt(localStorage.getItem("coins")||"0");
const MAX_XP=100;

function updateHUD(){
  const xpV=document.getElementById("xp-val"),xpF=document.getElementById("xp-fill"),cC=document.getElementById("coin-count");
  if(xpV) xpV.textContent=xp;
  if(xpF) xpF.style.width=(xp/MAX_XP*100)+"%";
  if(cC)  cC.textContent=coins;
}
updateHUD();

function showEffect(id,x,y){
  const el=document.getElementById(id); if(!el)return;
  el.style.left=x+"px"; el.style.top=y+"px"; el.style.display="block"; el.style.animation="none";
  requestAnimationFrame(()=>{el.style.animation="star-float 1s ease-out forwards";});
  setTimeout(()=>{el.style.display="none";},1100);
}

function addStar(x,y){ showEffect("star-effect",x,y); playCoin(); }
function addXP(amount,x,y){ xp=Math.min(MAX_XP,xp+amount); localStorage.setItem("xp",xp); updateHUD(); if(x&&y)showEffect("xp-effect",x,y); }
function addCoins(amount,x,y){
  coins+=amount; localStorage.setItem("coins",coins);
  const gc=document.getElementById("garden-coins"); if(gc)gc.textContent=coins;
  updateHUD(); showEffect("coin-effect",x,y); playCoin();
}
function addCoin(x,y){ addCoins(1,x,y); }

function initXPListeners(){
  document.querySelectorAll(".internal-link").forEach(btn=>{
    btn.addEventListener("click",(e)=>{addXP(10,e.clientX,e.clientY);addStar(e.clientX,e.clientY);playBlip();});
  });
}

// ============================================================
//  SKILLS
// ============================================================
const SKILLS=[{name:"RESEARCH",level:9},{name:"DATA ANALYSIS",level:8},{name:"POLICY WRITING",level:9},{name:"STORYTELLING",level:8},{name:"DESIGN",level:8},{name:"VIDEO EDITING",level:7},{name:"STRATEGY",level:8},{name:"PHOTOGRAPHY",level:7}];

function renderSkills(){
  const grid=document.getElementById("skills-grid"); if(!grid)return; grid.innerHTML="";
  SKILLS.forEach(sk=>{const card=document.createElement("div");card.className="skill-card";card.innerHTML=`<div class="skill-name">${sk.name}</div><div class="skill-bar-bg"><div class="skill-bar-fill" data-level="${sk.level}" style="width:0%"></div></div><div class="skill-level">LV.${sk.level}/10</div>`;grid.appendChild(card);});
}
function animateSkillBars(){document.querySelectorAll(".skill-bar-fill").forEach(bar=>{setTimeout(()=>{bar.style.width=(parseInt(bar.dataset.level)/10*100)+"%";},200);});}

// ============================================================
//  QUEST LOG
// ============================================================
const PROJECTS_DATA={
  research:[
    {title:"ECONOMIC DEVELOPMENT RESEARCH",tags:["RESEARCH","POLICY"],desc:"Quantitative research on economic development interventions and long-term outcomes.",status:"ONGOING",date:"2023-09"},
    {title:"DATA ANALYSIS PRACTICUM",tags:["DATA","COLUMBIA"],desc:"Applied data analysis for international development policy.",status:"COMPLETE",date:"2023-05"},
    {title:"POLICY BRIEF SERIES",tags:["POLICY","WRITING"],desc:"Series of policy briefs on global development challenges.",status:"ONGOING",date:"2024-02"},
    {title:"FIELDWORK & SURVEYS",tags:["RESEARCH","FIELDWORK"],desc:"Primary data collection and analysis in emerging markets.",status:"COMPLETE",date:"2022-08"},
  ],
  multimedia:[
    {title:"VIDEO DOCUMENTARY",tags:["VIDEO","STORYTELLING"],desc:"Short-form documentary exploring communities and structural change.",status:"ONGOING",date:"2024-03"},
    {title:"VISUAL EXPERIMENTS",tags:["ART","VIDEO"],desc:"Experimental visual work blending documentary and artistic practice.",status:"ONGOING",date:"2023-11"},
    {title:"AUDIO STORIES",tags:["AUDIO","PODCAST"],desc:"Audio-first storytelling and podcast features.",status:"ONGOING",date:"2024-01"},
    {title:"PHOTO SERIES",tags:["PHOTOGRAPHY","DOCUMENTARY"],desc:"Long-form documentary photography from the field.",status:"ONGOING",date:"2022-06"},
  ],
  blog:[
    {title:"FIELD NOTES",tags:["WRITING","BLOG"],desc:"Personal essays and dispatches from research and fieldwork.",status:"ONGOING",date:"2023-07"},
    {title:"POLICY PERSPECTIVES",tags:["WRITING","POLICY"],desc:"Reflections and commentary on development policy.",status:"ONGOING",date:"2024-01"},
    {title:"SIDE QUEST DIARIES",tags:["PERSONAL","BLOG"],desc:"Musings on creativity, curiosity, and life between quests.",status:"PLANNED",date:"2025-06"},
    {title:"READING NOTES",tags:["BOOKS","WRITING"],desc:"Notes and reactions from the reading list.",status:"ONGOING",date:"2023-04"},
  ],
  resources:[
    {title:"READING LIST",tags:["BOOKS","RESOURCES"],desc:"Curated reading on development economics, data, and design.",status:"ONGOING",date:"2022-12"},
    {title:"RESEARCH TOOLS",tags:["TOOLS","DATA"],desc:"Guides and tools for researchers and consultants.",status:"PLANNED",date:"2025-03"},
    {title:"OPEN DATASETS",tags:["DATA","OPEN"],desc:"Publicly available datasets and analysis scripts.",status:"ONGOING",date:"2023-10"},
    {title:"LINKS & REFERENCES",tags:["RESOURCES","ARCHIVE"],desc:"Collected links, papers, and references worth keeping.",status:"ONGOING",date:"2022-10"},
  ],
  features:[
    {title:"FEATURED IN",tags:["PRESS","MEDIA"],desc:"Media coverage, mentions, and features from publications and organizations.",status:"ONGOING",date:"2024-06"},
    {title:"CONFERENCE TALKS",tags:["SPEAKING","EVENTS"],desc:"Panels, presentations, and invited talks at conferences and forums.",status:"ONGOING",date:"2023-11"},
    {title:"COLLABORATIONS",tags:["COLLAB","PARTNERSHIP"],desc:"Cross-disciplinary projects and partnerships with researchers and creators.",status:"ONGOING",date:"2024-01"},
    {title:"AWARDS & GRANTS",tags:["RECOGNITION","FUNDING"],desc:"Scholarships, grants, and recognition received for research and creative work.",status:"COMPLETE",date:"2023-05"},
  ],
};
const STATUS_COLORS={"COMPLETE":"#5CC840","ONGOING":"#7ECCE8","PLANNED":"#FFB060","PAUSED":"#FF8870"};
let activeTab="research";
let activeStatusFilter="ALL";
let activeSortOrder="newest";

// ── MAP TREASURE CHEST ────────────────────────────────────────
function drawMapChest(ctx,x,y,sc){
  const s=sc||1,w=26*s,h=22*s,bx=x-w/2,by=y-h/2;
  ctx.save();ctx.globalAlpha=0.72;
  ctx.fillStyle='rgba(90,55,10,0.22)';ctx.fillRect(bx+3,by+h+1,w-2,4*s);
  // body
  ctx.fillStyle='rgba(155,95,28,0.85)';ctx.fillRect(bx,by+h*0.40,w,h*0.60);
  // lid
  ctx.fillStyle='rgba(185,115,38,0.85)';ctx.fillRect(bx,by,w,h*0.44);
  ctx.fillStyle='rgba(220,165,75,0.6)';ctx.fillRect(bx+2,by+2,w-4,4);
  // horizontal strap
  ctx.fillStyle='rgba(70,40,8,0.7)';ctx.fillRect(bx,by+h*0.36,w,3*s);
  // vertical strap
  ctx.fillRect(bx+w*0.44,by,w*0.12,h);
  // lock
  ctx.fillStyle='rgba(225,185,45,0.9)';ctx.fillRect(bx+w*0.41,by+h*0.30,w*0.18,h*0.18);
  ctx.fillStyle='rgba(170,120,15,0.9)';ctx.fillRect(bx+w*0.44,by+h*0.37,w*0.12,h*0.12);
  // sparkle
  ctx.fillStyle='rgba(255,235,120,0.85)';ctx.fillRect(bx+w-5,by+2,3,3);ctx.fillRect(bx+3,by+h-5,2,2);
  ctx.restore();
}

// ── FOOTSTEP ANIMATION OVER QUEST MAP ─────────────────────────
let mapWalkerTick=0, mapFootsteps=[];
let questAnimCanvas=null, questAnimCtx=null, questAnimRunning=false;

function startQuestMapAnim(){
  const cv=document.getElementById('quest-map-canvas'); if(!cv)return;
  const wrap=cv.parentElement;
  let overlay=document.getElementById('quest-map-anim-overlay');
  if(!overlay){
    overlay=document.createElement('canvas');
    overlay.id='quest-map-anim-overlay';
    overlay.style.cssText='position:absolute;top:0;left:0;width:100%;pointer-events:none;z-index:1;';
    wrap.insertBefore(overlay,wrap.firstChild);
  }
  overlay.width=cv.width; overlay.height=cv.height;
  questAnimCanvas=overlay; questAnimCtx=overlay.getContext('2d');
  if(!questAnimRunning){questAnimRunning=true;questAnimLoop();}
}

function questAnimLoop(){
  if(!questAnimCanvas||!questAnimCtx){requestAnimationFrame(questAnimLoop);return;}
  // Keep overlay in sync with map canvas size
  const mapCv=document.getElementById('quest-map-canvas');
  if(mapCv&&(questAnimCanvas.width!==mapCv.width||questAnimCanvas.height!==mapCv.height)){
    questAnimCanvas.width=mapCv.width;questAnimCanvas.height=mapCv.height;
  }
  const W=questAnimCanvas.width,H=questAnimCanvas.height;
  mapWalkerTick++;
  if(mapWalkerTick%22===0){
    const t=mapWalkerTick;
    const wx=(0.5+0.38*Math.sin(t*0.022)*Math.cos(t*0.008))*W;
    const wy=(0.5+0.38*Math.cos(t*0.015)*Math.sin(t*0.011))*H;
    const fx=Math.max(50,Math.min(W-50,wx));
    const fy=Math.max(50,Math.min(H-50,wy));
    mapFootsteps.push({x:fx,y:fy,side:mapFootsteps.length%2,age:0});
    if(mapFootsteps.length>26) mapFootsteps.shift();
  }
  mapFootsteps.forEach(s=>s.age++);
  questAnimCtx.clearRect(0,0,W,H);
  mapFootsteps.forEach(step=>{
    const alpha=Math.max(0,0.50*(1-step.age/170));
    if(alpha<=0.01)return;
    questAnimCtx.save();
    questAnimCtx.globalAlpha=alpha;
    questAnimCtx.fillStyle='rgba(105,65,22,0.9)';
    questAnimCtx.translate(step.x,step.y);
    const off=step.side?6:-6;
    questAnimCtx.beginPath();
    questAnimCtx.ellipse(off,0,4,7,step.side?0.25:-0.25,0,Math.PI*2);
    questAnimCtx.fill();
    for(let t=0;t<3;t++){questAnimCtx.beginPath();questAnimCtx.arc(off-3+t*3,-8,2,0,Math.PI*2);questAnimCtx.fill();}
    questAnimCtx.restore();
  });
  requestAnimationFrame(questAnimLoop);
}

function drawMapMountain(ctx,x,y,w,h){
  ctx.fillStyle='rgba(120,90,50,0.22)';
  ctx.beginPath();ctx.moveTo(x,y+h);ctx.lineTo(x+w/2,y);ctx.lineTo(x+w,y+h);ctx.closePath();ctx.fill();
  ctx.strokeStyle='rgba(100,70,30,0.35)';ctx.lineWidth=1;
  ctx.beginPath();ctx.moveTo(x,y+h);ctx.lineTo(x+w/2,y);ctx.lineTo(x+w,y+h);ctx.closePath();ctx.stroke();
  ctx.fillStyle='rgba(230,215,175,0.6)';
  ctx.beginPath();ctx.moveTo(x+w/2,y);ctx.lineTo(x+w*0.38,y+h*0.28);ctx.lineTo(x+w*0.62,y+h*0.28);ctx.closePath();ctx.fill();
  for(let i=1;i<5;i++){ctx.strokeStyle='rgba(100,70,30,0.12)';ctx.lineWidth=0.7;ctx.beginPath();ctx.moveTo(x+w/2,y+h*0.05*i);ctx.lineTo(x+w/2-i*4,y+h*0.25+i*5);ctx.stroke();}
}
function drawMapTree(ctx,x,y,s){
  ctx.fillStyle='rgba(60,100,50,0.3)';
  ctx.beginPath();ctx.moveTo(x,y-s);ctx.lineTo(x+s*0.7,y);ctx.lineTo(x-s*0.7,y);ctx.closePath();ctx.fill();
  ctx.beginPath();ctx.moveTo(x,y-s*1.4);ctx.lineTo(x+s*0.5,y-s*0.6);ctx.lineTo(x-s*0.5,y-s*0.6);ctx.closePath();ctx.fill();
  ctx.strokeStyle='rgba(60,90,40,0.25)';ctx.lineWidth=0.8;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x,y+s*0.5);ctx.stroke();
}

// ── QUEST CARD MEDIA PREVIEW ──────────────────────────────────
function mediaPreviewHtml(item){
  let h='';
  if(item.image){
    h+='<img class="lc-image" src="'+item.image+'" alt="'+item.title+'" loading="lazy">';
  }
  if(item.videoUrl){
    const ytId=(item.videoUrl.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)||[])[1];
    if(ytId){
      h+='<div class="lc-video-wrap"><a href="'+item.videoUrl+'" target="_blank" rel="noopener">'
       +'<img class="lc-video-thumb" src="https://img.youtube.com/vi/'+ytId+'/mqdefault.jpg" alt="Video preview">'
       +'<span class="lc-play-btn">▶</span></a></div>';
    } else {
      h+='<a class="lc-media-btn" href="'+item.videoUrl+'" target="_blank" rel="noopener">🎬 WATCH ▶</a>';
    }
  }
  if(item.audioUrl){
    h+='<div class="lc-audio-wrap"><span class="lc-audio-icon">🎵</span>'
     +'<audio class="lc-audio" controls preload="none"><source src="'+item.audioUrl+'"></audio></div>';
  }
  if(item.documentUrl){
    h+='<a class="lc-media-btn" href="'+item.documentUrl+'" target="_blank" rel="noopener">📄 VIEW DOC ▶</a>';
  }
  return h;
}

function renderQuestMap(tab){
  if(tab) activeTab=tab;
  const cv=document.getElementById("quest-map-canvas"); if(!cv)return;
  const pinsLayer=document.getElementById("quest-pins-layer"); if(!pinsLayer)return;
  pinsLayer.innerHTML="";
  const wrap=cv.parentElement;
  const W=Math.max(wrap.offsetWidth,600);

  // Apply filter + sort
  let items=(PROJECTS_DATA[activeTab]||[]).slice();
  if(activeStatusFilter!=="ALL") items=items.filter(it=>it.status===activeStatusFilter);
  items.sort((a,b)=>a.date>b.date?-1:1);
  const n=items.length;

  // Dynamic height: each item needs ~185px of vertical space
  const ITEM_SPACING=185;
  const TOP_PAD=72;
  const H=Math.max(580,TOP_PAD+(n>0?n-1:0)*ITEM_SPACING+280);

  cv.width=W; cv.height=H;
  wrap.style.minHeight=H+'px';
  pinsLayer.style.minHeight=H+'px';
  const ctx=cv.getContext("2d");

  // ── PARCHMENT BASE ────────────────────────────────────────────
  const bg=ctx.createLinearGradient(0,0,W,H);
  bg.addColorStop(0,'#F4E8C0');bg.addColorStop(0.35,'#EDD898');bg.addColorStop(0.65,'#F2E2B0');bg.addColorStop(1,'#E8D49A');
  ctx.fillStyle=bg;ctx.fillRect(0,0,W,H);

  // Subtle aged staining — a few warm blobs only
  [[W*0.1,H*0.18,50,0.04],[W*0.88,H*0.5,44,0.04],[W*0.5,H*0.8,38,0.05]].forEach(([sx,sy,sr,sa])=>{
    const sg=ctx.createRadialGradient(sx,sy,0,sx,sy,sr);
    sg.addColorStop(0,'rgba(140,95,30,'+sa+')');sg.addColorStop(1,'rgba(140,95,30,0)');
    ctx.fillStyle=sg;ctx.beginPath();ctx.arc(sx,sy,sr,0,Math.PI*2);ctx.fill();
  });

  // Diagonal paper texture lines
  ctx.strokeStyle='rgba(160,120,50,0.05)';ctx.lineWidth=0.8;
  for(let d=0;d<W+H;d+=22){ctx.beginPath();ctx.moveTo(d,0);ctx.lineTo(0,d);ctx.stroke();}

  // Thin coordinate grid (only inside border)
  ctx.strokeStyle='rgba(160,120,50,0.07)';ctx.lineWidth=0.6;
  for(let gy=60;gy<H-24;gy+=H/7){ctx.beginPath();ctx.moveTo(26,gy);ctx.lineTo(W-26,gy);ctx.stroke();}
  for(let gx=60;gx<W-24;gx+=W/8){ctx.beginPath();ctx.moveTo(gx,26);ctx.lineTo(gx,H-26);ctx.stroke();}



  // ── TREASURE CHESTS ───────────────────────────────────────────
  [[W*0.07,H*0.14,0.9],[W*0.93,H*0.20,0.8],[W*0.12,H*0.68,1.0],[W*0.88,H*0.72,0.85],[W*0.50,H*0.10,0.75]].forEach(([cx,cy,sc])=>drawMapChest(ctx,cx,cy,sc));

  // ── ORNATE BORDER ─────────────────────────────────────────────
  // Outer heavy line
  ctx.strokeStyle='#9A7025';ctx.lineWidth=6;ctx.strokeRect(7,7,W-14,H-14);
  // Second line
  ctx.strokeStyle='#C8A050';ctx.lineWidth=2.5;ctx.strokeRect(14,14,W-28,H-28);
  // Inner hairline
  ctx.strokeStyle='rgba(200,165,80,0.45)';ctx.lineWidth=1;ctx.strokeRect(20,20,W-40,H-40);
  // Corner rosettes
  [[22,22],[W-22,22],[22,H-22],[W-22,H-22]].forEach(([cx,cy])=>{
    ctx.fillStyle='rgba(155,105,35,0.60)';ctx.beginPath();ctx.arc(cx,cy,7,0,Math.PI*2);ctx.fill();
    for(let p=0;p<8;p++){
      const pa=p*Math.PI/4;
      ctx.fillStyle='rgba(200,160,60,0.55)';
      ctx.beginPath();ctx.arc(cx+Math.cos(pa)*11,cy+Math.sin(pa)*11,3,0,Math.PI*2);ctx.fill();
    }
    ctx.strokeStyle='rgba(155,105,35,0.45)';ctx.lineWidth=1;
    ctx.beginPath();ctx.arc(cx,cy,15,0,Math.PI*2);ctx.stroke();
    ctx.beginPath();ctx.arc(cx,cy,19,0,Math.PI*2);ctx.stroke();
  });
  // Side midpoint ornaments
  [[W/2,8],[W/2,H-8],[8,H/2],[W-8,H/2]].forEach(([cx,cy])=>{
    ctx.fillStyle='rgba(168,120,46,0.58)';ctx.beginPath();ctx.arc(cx,cy,5,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle='rgba(155,105,35,0.38)';ctx.lineWidth=1;
    ctx.beginPath();ctx.arc(cx,cy,9,0,Math.PI*2);ctx.stroke();
  });
  // Tick marks along border edges
  ctx.strokeStyle='rgba(148,108,42,0.30)';ctx.lineWidth=1;
  for(let bx=40;bx<W-40;bx+=W/12){ctx.beginPath();ctx.moveTo(bx,7);ctx.lineTo(bx,14);ctx.stroke();ctx.beginPath();ctx.moveTo(bx,H-14);ctx.lineTo(bx,H-7);ctx.stroke();}
  for(let by=40;by<H-40;by+=H/10){ctx.beginPath();ctx.moveTo(7,by);ctx.lineTo(14,by);ctx.stroke();ctx.beginPath();ctx.moveTo(W-14,by);ctx.lineTo(W-7,by);ctx.stroke();}

  // ── COMPASS ROSE (enlarged, ornate) ──────────────────────────
  const crx=W-78,cry=H-78;
  // Outer decorative ring
  ctx.strokeStyle='rgba(148,108,42,0.55)';ctx.lineWidth=2;
  ctx.beginPath();ctx.arc(crx,cry,52,0,Math.PI*2);ctx.stroke();
  ctx.strokeStyle='rgba(148,108,42,0.28)';ctx.lineWidth=1;
  ctx.beginPath();ctx.arc(crx,cry,44,0,Math.PI*2);ctx.stroke();
  ctx.beginPath();ctx.arc(crx,cry,36,0,Math.PI*2);ctx.stroke();
  // Intercardinal rays (thinner)
  for(let a=1;a<8;a+=2){
    const ang=a*Math.PI/4-Math.PI/2;
    ctx.strokeStyle='rgba(148,108,42,0.30)';ctx.lineWidth=1;
    ctx.beginPath();ctx.moveTo(crx,cry);ctx.lineTo(crx+Math.cos(ang)*42,cry+Math.sin(ang)*42);ctx.stroke();
    // small diamond tip
    ctx.fillStyle='rgba(148,108,42,0.38)';
    ctx.beginPath();ctx.moveTo(crx+Math.cos(ang)*36,cry+Math.sin(ang)*36);
    ctx.lineTo(crx+Math.cos(ang+0.12)*40,cry+Math.sin(ang+0.12)*40);
    ctx.lineTo(crx+Math.cos(ang)*44,cry+Math.sin(ang)*44);
    ctx.lineTo(crx+Math.cos(ang-0.12)*40,cry+Math.sin(ang-0.12)*40);
    ctx.closePath();ctx.fill();
  }
  // Cardinal arms — large filled diamonds
  [[0,-1,'N'],[0,1,'S'],[1,0,'E'],[-1,0,'W']].forEach(([dx,dy,lbl])=>{
    const tlen=48,blen=16;
    ctx.fillStyle='rgba(140,95,28,0.80)';
    ctx.beginPath();
    ctx.moveTo(crx,cry);
    ctx.lineTo(crx-dy*blen,cry+dx*blen);
    ctx.lineTo(crx+dx*tlen,cry+dy*tlen);
    ctx.lineTo(crx+dy*blen,cry-dx*blen);
    ctx.closePath();ctx.fill();
    // lighter half
    ctx.fillStyle='rgba(225,195,125,0.85)';
    ctx.beginPath();
    ctx.moveTo(crx,cry);
    ctx.lineTo(crx-dy*blen,cry+dx*blen);
    ctx.lineTo(crx+dx*tlen,cry+dy*tlen);
    ctx.closePath();ctx.fill();
    // label
    ctx.fillStyle='rgba(100,62,14,0.95)';ctx.font='bold 9px "Press Start 2P",monospace';ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillText(lbl,crx+dx*55,cry+dy*58);
  });
  ctx.textBaseline='alphabetic';
  // Centre dot
  ctx.fillStyle='rgba(90,58,14,0.88)';ctx.beginPath();ctx.arc(crx,cry,5,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='rgba(225,195,125,0.80)';ctx.beginPath();ctx.arc(crx,cry,3,0,Math.PI*2);ctx.fill();

  // ── LEGEND BOX (enlarged) ─────────────────────────────────────
  const lgX=26,lgY=H-178,lgW=148,lgH=162;
  ctx.fillStyle='rgba(245,232,195,0.92)';ctx.fillRect(lgX,lgY,lgW,lgH);
  ctx.strokeStyle='#A87830';ctx.lineWidth=2;ctx.strokeRect(lgX,lgY,lgW,lgH);
  ctx.strokeStyle='rgba(168,120,48,0.35)';ctx.lineWidth=1;ctx.strokeRect(lgX+4,lgY+4,lgW-8,lgH-8);
  ctx.fillStyle='#5A3010';ctx.font='bold 7px "Press Start 2P",monospace';ctx.textAlign='center';
  ctx.fillText('LEGEND',lgX+lgW/2,lgY+18);
  ctx.strokeStyle='rgba(168,120,48,0.5)';ctx.lineWidth=1;
  ctx.beginPath();ctx.moveTo(lgX+8,lgY+24);ctx.lineTo(lgX+lgW-8,lgY+24);ctx.stroke();
  Object.entries(STATUS_COLORS).forEach(([status,color],si)=>{
    const ey=lgY+38+si*28;
    // filled square swatch
    ctx.fillStyle=color;ctx.fillRect(lgX+14,ey-8,16,16);
    ctx.strokeStyle='rgba(90,50,10,0.4)';ctx.lineWidth=1;ctx.strokeRect(lgX+14,ey-8,16,16);
    ctx.fillStyle='#4A2C08';ctx.font='6px "Press Start 2P",monospace';ctx.textAlign='left';
    ctx.fillText(status,lgX+36,ey+3);
  });

  // ── SCALE BAR (bottom-centre) ────────────────────────────────
  const sbX=W/2-50,sbY=H-18;
  for(let si=0;si<5;si++){ctx.fillStyle=si%2===0?'rgba(80,50,15,0.65)':'rgba(210,185,140,0.65)';ctx.fillRect(sbX+si*20,sbY-6,20,6);}
  ctx.strokeStyle='rgba(80,50,15,0.60)';ctx.lineWidth=1;ctx.strokeRect(sbX,sbY-6,100,6);
  ctx.fillStyle='rgba(80,50,15,0.60)';ctx.font='5px "Press Start 2P",monospace';ctx.textAlign='center';
  ctx.fillText('SCALE',sbX+50,sbY+7);

  // ── VIGNETTE ─────────────────────────────────────────────────
  const vig=ctx.createRadialGradient(W/2,H/2,H*0.25,W/2,H/2,H*0.88);
  vig.addColorStop(0,'rgba(0,0,0,0)');vig.addColorStop(1,'rgba(80,50,10,0.25)');
  ctx.fillStyle=vig;ctx.fillRect(0,0,W,H);

  // ── TITLE BANNER ─────────────────────────────────────────────
  const tabNames={research:"RESEARCH QUESTS",multimedia:"MULTIMEDIA VAULT",blog:"BLOG CHRONICLES",resources:"RESOURCE VAULT",features:"FEATURES & PRESS"};
  const titleW=260,titleX=(W-titleW)/2,titleY=22;
  ctx.fillStyle='rgba(200,165,90,0.40)';ctx.fillRect(titleX-8,titleY-2,titleW+16,26);
  ctx.strokeStyle='rgba(160,120,50,0.55)';ctx.lineWidth=1.5;ctx.strokeRect(titleX-8,titleY-2,titleW+16,26);
  ctx.fillStyle='#5A3010';ctx.font='7px "Press Start 2P",monospace';ctx.textAlign='center';
  ctx.fillText(tabNames[activeTab]||'QUEST LOG',W/2,titleY+15);

  // ── WAYPOINTS ────────────────────────────────────────────────
  const waypoints=[];
  for(let i=0;i<n;i++){
    const xFrac=(i%2===0)?0.15:0.78;
    const y=TOP_PAD+i*ITEM_SPACING+40;
    waypoints.push({x:W*xFrac, y});
  }

  if(n===0){
    ctx.fillStyle='rgba(90,60,20,0.5)';ctx.font='7px "Press Start 2P",monospace';ctx.textAlign='center';
    ctx.fillText('NO QUESTS MATCH FILTER',W/2,H/2);
  }

  // Winding quest road
  if(waypoints.length>1){
    ctx.save();
    ctx.strokeStyle='rgba(160,120,50,0.28)';ctx.lineWidth=8;ctx.setLineDash([]);
    ctx.beginPath();ctx.moveTo(waypoints[0].x,waypoints[0].y);
    for(let i=1;i<waypoints.length;i++){const pp=waypoints[i-1],cc=waypoints[i],mx=(pp.x+cc.x)/2;ctx.bezierCurveTo(mx,pp.y,mx,cc.y,cc.x,cc.y);}
    ctx.stroke();
    ctx.strokeStyle='#C09A58';ctx.lineWidth=3.5;ctx.setLineDash([10,7]);
    ctx.beginPath();ctx.moveTo(waypoints[0].x,waypoints[0].y);
    for(let i=1;i<waypoints.length;i++){const pp=waypoints[i-1],cc=waypoints[i],mx=(pp.x+cc.x)/2;ctx.bezierCurveTo(mx,pp.y,mx,cc.y,cc.x,cc.y);}
    ctx.stroke();
    ctx.setLineDash([]);ctx.restore();
  }

  // Pin markers
  waypoints.forEach((wp,i)=>{
    const item=items[i];
    const pinCol=STATUS_COLORS[item.status]||'#C8AA70';
    ctx.fillStyle='rgba(0,0,0,0.16)';ctx.beginPath();ctx.arc(wp.x+2,wp.y+2,12,0,Math.PI*2);ctx.fill();
    ctx.fillStyle=pinCol;ctx.beginPath();ctx.arc(wp.x,wp.y,12,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle='rgba(255,255,255,0.55)';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(wp.x,wp.y,12,0,Math.PI*2);ctx.stroke();
    ctx.fillStyle='#FFF8E0';ctx.beginPath();ctx.arc(wp.x,wp.y,5,0,Math.PI*2);ctx.fill();
    ctx.fillStyle=pinCol;ctx.beginPath();ctx.arc(wp.x,wp.y,2.5,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle=pinCol;ctx.lineWidth=3;
    ctx.beginPath();ctx.moveTo(wp.x,wp.y+12);ctx.lineTo(wp.x,wp.y+22);ctx.stroke();
    ctx.fillStyle='#5A3010';ctx.font='5px "Press Start 2P",monospace';ctx.textAlign='center';
    ctx.fillText(String(i+1),wp.x,wp.y+3);
  });

  // DOM landmark cards
  waypoints.forEach((wp,i)=>{
    const item=items[i];
    const card=document.createElement("div");
    card.className="landmark-card pixel-box";
    const leftSide=(i%2===0);
    const offX=leftSide?'0%':'-100%';
    const dateStr=item.date?'<div class="lc-date">'+item.date+'</div>':'';
    card.style.cssText='position:absolute;left:'+(wp.x+(leftSide?18:-18))+'px;top:'+(wp.y+24)+'px;transform:translateX('+offX+');width:220px;--lc-tx:'+offX+';';
    card.innerHTML='<div class="lc-num">#'+(i+1)+'</div>'
      +mediaPreviewHtml(item)
      +'<div class="lc-title">'+item.title+'</div>'
      +'<div class="lc-tags">'+((item.tags||[]).map(t=>'<span class="tag">'+t+'</span>')).join('')+'</div>'
      +'<p class="lc-desc">'+mdToHtml(item.desc)+'</p>'
      +dateStr
      +'<div class="lc-status" style="color:'+(STATUS_COLORS[item.status]||'#604090')+'">● '+item.status+'</div>'
      +(item.link?'<a class="lc-media-btn lc-link" href="'+item.link+'" target="_blank" rel="noopener">🔗 VISIT ▶</a>':'');
    card.addEventListener('click',e=>{addStar(e.clientX,e.clientY);addXP(3,e.clientX,e.clientY);});
    pinsLayer.appendChild(card);
  });
  // Start footstep animation overlay
  startQuestMapAnim();
}

function initQuestFilters(){
  const section=document.getElementById("projects");if(!section)return;
  const tabsDiv=section.querySelector(".quest-tabs");if(!tabsDiv)return;
  const bar=document.createElement("div");
  bar.className="quest-filter-bar";
  bar.innerHTML=
    '<div class="qf-group"><span class="qf-label">STATUS:</span>'
    +'<button class="qf-btn active" data-status="ALL">ALL</button>'
    +'<button class="qf-btn" data-status="ONGOING">ONGOING</button>'
    +'<button class="qf-btn" data-status="PLANNED">PLANNED</button>'
    +'<button class="qf-btn" data-status="COMPLETE">COMPLETE</button>'
    +'<button class="qf-btn" data-status="PAUSED">PAUSED</button>'
    +'</div>';
  tabsDiv.insertAdjacentElement('afterend',bar);
  bar.querySelectorAll('.qf-btn').forEach(b=>{
    b.addEventListener('click',()=>{
      bar.querySelectorAll('.qf-btn').forEach(x=>x.classList.remove('active'));
      b.classList.add('active');
      activeStatusFilter=b.dataset.status;
      renderQuestMap();
      playBlip();
    });
  });
}

document.querySelectorAll(".quest-tab").forEach(btn=>{btn.addEventListener("click",()=>{document.querySelectorAll(".quest-tab").forEach(b=>b.classList.remove("active"));btn.classList.add("active");renderQuestMap(btn.dataset.tab);playBlip();});});

// ============================================================
//  MULTIMEDIA PAGE
// ============================================================
const MM_DATA={
  videos:[{title:"VIDEO ESSAY #1",icon:"🎬",desc:"A visual exploration — coming soon.",link:"#"},{title:"SHORT DOCUMENTARY",icon:"📽️",desc:"Field documentation from the ground.",link:"#"},{title:"EXPLAINER SERIES",icon:"🎥",desc:"Breaking down complex ideas visually.",link:"#"},{title:"VISUAL POEM",icon:"✨",desc:"Experimental short-form visual work.",link:"#"}],
  podcasts:[{title:"PODCAST FEATURE",icon:"🎙️",desc:"Guest appearance — topic TBC.",link:"#"},{title:"RECORDED TALK",icon:"🎤",desc:"Conference presentation on development.",link:"#"},{title:"INTERVIEW SERIES",icon:"📻",desc:"In conversation with researchers & makers.",link:"#"}],
  art:[{title:"DIGITAL ILLUSTRATIONS",icon:"🎨",desc:"Pixel art and digital explorations.",link:"#"},{title:"PHOTO SERIES",icon:"📷",desc:"Documentary photography from the field.",link:"#"},{title:"MIXED MEDIA",icon:"🖼️",desc:"Experimental mixed-media projects.",link:"#"},{title:"ARCHIVE VISUALS",icon:"💾",desc:"Visual archive and collected artefacts.",link:"#"}],
};

function renderMultimedia(tab){
  const grid=document.getElementById("multimedia-grid"); if(!grid)return; grid.innerHTML="";
  (MM_DATA[tab||"videos"]||[]).forEach(item=>{
    const card=document.createElement("div"); card.className="mm-card";
    card.innerHTML=`<div class="mm-card-thumb">${item.icon}</div><div class="mm-card-body"><div class="mm-card-title">${item.title}</div><p class="mm-card-desc">${item.desc}</p><a href="${item.link}" class="mm-card-link" target="_blank">VIEW ▶</a></div>`;
    card.addEventListener("click",(e)=>{addXP(4,e.clientX,e.clientY);playBlip();});
    grid.appendChild(card);
  });
}
document.querySelectorAll(".mm-tab").forEach(btn=>{btn.addEventListener("click",()=>{document.querySelectorAll(".mm-tab").forEach(b=>b.classList.remove("active"));btn.classList.add("active");renderMultimedia(btn.dataset.mm);playBlip();});});
function showMultimedia(){document.getElementById("multimedia-page").style.display="block";renderMultimedia("videos");addXP(5);}
function hideMultimedia(){document.getElementById("multimedia-page").style.display="none";}

// ============================================================
//  TRY SOMETHING NEW — WELLBEING PICNIC BASKET GAME
// ============================================================
const SUGGESTIONS = [
  "Light a candle, make your favourite warm drink, and sit in silence for 10 minutes",
  "Take a slow bath or shower with no music — just be present with the warmth",
  "Write down 3 things your body did for you today and silently thank it",
  "Step outside barefoot for 5 minutes and feel the ground beneath you",
  "Do a 10-minute gentle full-body stretch in a sunny spot",
  "Write a letter to your present self from your wisest future self",
  "Make a playlist of songs that feel like a warm hug and listen all the way through",
  "Spend 20 minutes lying down with eyes closed, doing nothing at all",
  "Brew something new — herbal tea, golden milk, or a spiced drink — and savour it",
  "Put on your favourite outfit for no reason other than it makes you feel good",
  "Watch the sky change for 10 minutes — clouds, light shifting, colour",
  "Read a few pages of a book purely for pleasure, not to finish it",
  "Write down every worry you have right now, fold the paper, and set it aside",
  "Dance alone to one song you love — full volume, full movement",
  "Cook something comforting from scratch and eat it slowly and mindfully",
  "Give yourself a slow face or scalp massage for 5 minutes",
  "Go for a walk with no destination, no podcast — just your thoughts and the world",
  "Sit by a window and watch the world outside without interacting with it",
  "Write 5 things you genuinely like about yourself right now",
  "Make your bed beautifully and then take a short rest in it",
  "Visit a park, garden, or green space and stay for at least 30 minutes",
  "Arrange fresh flowers or foliage in your space, even a single stem",
  "Call or message someone who always makes you feel seen and heard",
  "Do a small digital declutter — clear one inbox section or photo folder",
  "Put your phone in another room for 1 hour and notice how it feels",
  "Draw or doodle freely for 10 minutes with absolutely no goal in mind",
  "Watch a sunrise or sunset all the way through without recording it",
  "Write out your ideal slow morning in full sensory detail",
  "Create a small beautiful corner in your space with objects that mean something",
  "Take a guilt-free nap — set a gentle timer and fully surrender to rest",
  "Prepare a nourishing snack plate just for yourself, as if for a cherished guest",
  "Sit with a journal and write honestly about what you need most right now",
  "Find a poem you love and read it aloud slowly, then once more",
  "Go outside at night and look at the stars for 5 minutes, letting yourself feel small",
  "Try a new gentle movement — yoga, tai chi, or stretching to music you love",
  "Write down 3 boundaries you want to honour for yourself this week",
  "Spend 15 minutes in complete quiet — no screens, no sound, nothing to do",
  "Take a different route on your next walk or errand and notice what is new",
  "Write a list of every small joy from this past week, however tiny",
  "Light incense or use a scent you love and simply sit in that atmosphere",
  "Watch a short nature documentary and let yourself be fully absorbed",
  "Make a warm drink and sit outside to enjoy it slowly, phone-free",
  "Tidy one small area of your space — one drawer or shelf — then enjoy it",
  "Write about a memory that makes you feel warm, safe, and happy",
  "Spend 10 minutes listening to birdsong, rainfall, or another natural sound",
  "Do something creative today that has no audience — purely for yourself",
  "Give yourself full permission to do absolutely nothing for 20 minutes",
  "Write a list of everything you are looking forward to, big and small",
  "Make a warm compress for your eyes and rest quietly for 5 minutes",
  "End your day by writing one thing that went well, however small it seems",
];

const BASKETS_POOL = [
  { name:"ROSE QUARTZ",  gemColor:"#FFB8D0", gemShine:"#FFE0EE", gemDark:"#D06090", icon:"💎", label:"SELF LOVE",    ribbonCol:"#E05090" },
  { name:"JADE",         gemColor:"#60C890", gemShine:"#A8F0C8", gemDark:"#208850", icon:"💚", label:"NOURISHMENT",  ribbonCol:"#30A060" },
  { name:"AMETHYST",     gemColor:"#B080F0", gemShine:"#D8B8FF", gemDark:"#7040C0", icon:"🔮", label:"CALM",         ribbonCol:"#8050D0" },
  { name:"SAPPHIRE",     gemColor:"#4878E0", gemShine:"#90B8FF", gemDark:"#1840A0", icon:"💙", label:"CLARITY",      ribbonCol:"#2858C0" },
  { name:"RUBY",         gemColor:"#E83040", gemShine:"#FF8090", gemDark:"#A01020", icon:"❤️", label:"COURAGE",      ribbonCol:"#C02030" },
  { name:"CITRINE",      gemColor:"#FFD840", gemShine:"#FFF0A0", gemDark:"#C09010", icon:"⭐", label:"JOY",          ribbonCol:"#D8A010" },
  { name:"AQUAMARINE",   gemColor:"#60D8D0", gemShine:"#A8F8F0", gemDark:"#209890", icon:"💠", label:"FLOW",         ribbonCol:"#30B0A8" },
  { name:"TOPAZ",        gemColor:"#FF9840", gemShine:"#FFD090", gemDark:"#C06010", icon:"🔶", label:"STRENGTH",     ribbonCol:"#E07020" },
  { name:"MOONSTONE",    gemColor:"#D8E8FF", gemShine:"#F0F8FF", gemDark:"#8090C0", icon:"🌙", label:"INTUITION",    ribbonCol:"#9098D0" },
  { name:"EMERALD",      gemColor:"#30C060", gemShine:"#80EFA0", gemDark:"#108040", icon:"💚", label:"GROWTH",       ribbonCol:"#189040" },
  { name:"OPAL",         gemColor:"#F0C8E8", gemShine:"#FFE8F8", gemDark:"#B070A0", icon:"✨", label:"WONDER",       ribbonCol:"#C060A0" },
  { name:"LAPIS LAZULI", gemColor:"#3050C0", gemShine:"#7090E8", gemDark:"#102080", icon:"🌀", label:"WISDOM",       ribbonCol:"#2040A8" },
];
let basketRoundOffset = 0;
function getCurrentBaskets(){
  const pool = BASKETS_POOL;
  return [0,1,2].map(i => pool[(basketRoundOffset*3+i) % pool.length]);
}

let sessionUsed = new Set();
let openedBaskets = new Set();
let basketGameCanvas = null, basketCtx = null;
let basketBgTime = 0;
let gardenCoins = parseInt(localStorage.getItem("garden_coins") || "0");
let basketsOpened = 0;
let basketAnim = { active: false, basket: -1, tick: 0 };

function getRandomSuggestion(){
  if(sessionUsed.size >= SUGGESTIONS.length) sessionUsed.clear();
  const available = SUGGESTIONS.map((_,i)=>i).filter(i=>!sessionUsed.has(i));
  const idx = available[Math.floor(Math.random() * available.length)];
  sessionUsed.add(idx);
  return SUGGESTIONS[idx];
}

function initBasketGame(){
  basketGameCanvas = document.getElementById("garden-canvas");
  if(!basketGameCanvas) return;
  basketCtx = basketGameCanvas.getContext("2d");
  basketCtx.imageSmoothingEnabled = false;
  // Restore display
  const gcEl = document.getElementById("garden-coins");
  if(gcEl) gcEl.textContent = coins;
  basketGameCanvas.addEventListener("click", onBasketClick);
  basketLoop();
}

function onBasketClick(e){
  const rect = basketGameCanvas.getBoundingClientRect();
  const scaleX = basketGameCanvas.width / rect.width;
  const scaleY = basketGameCanvas.height / rect.height;
  const mx = (e.clientX - rect.left) * scaleX;
  const my = (e.clientY - rect.top)  * scaleY;
  const W2=basketGameCanvas.width, H2=basketGameCanvas.height;
  // Check puppy click
  const puppyX=W2*0.5, puppyY=H2*0.73;
  if(Math.abs(mx-puppyX)<80 && Math.abs(my-puppyY)<50){
    puppyBark=60; puppyHeart=true; puppyHeartTick=0; playWoof(); return;
  }
  const centers = [Math.round(W2*0.2), W2/2|0, Math.round(W2*0.8)];
  for(let i = 0; i < 3; i++){
    if(Math.abs(mx - centers[i]) < 60 && my > 20 && my < 260){
      if(openedBaskets.has(i)) return;
      basketAnim = { active: true, basket: i, tick: 0 };
      return;
    }
  }
}

let puppyBark=0, puppyHeart=false, puppyHeartTick=0;

function playWoof(){
  try{
    const ac=audioCtx||new (window.AudioContext||window.webkitAudioContext)();
    // Low thump body
    const buf=ac.createBuffer(1,ac.sampleRate*0.18,ac.sampleRate);
    const d=buf.getChannelData(0);
    for(let i=0;i<d.length;i++){d[i]=(Math.random()*2-1)*Math.pow(1-i/d.length,1.8)*0.9;}
    const src=ac.createBufferSource();src.buffer=buf;
    const bpf=ac.createBiquadFilter();bpf.type='bandpass';bpf.frequency.setValueAtTime(280,ac.currentTime);bpf.frequency.linearRampToValueAtTime(120,ac.currentTime+0.15);bpf.Q.value=1.2;
    const gain=ac.createGain();gain.gain.setValueAtTime(0.7,ac.currentTime);gain.gain.linearRampToValueAtTime(0,ac.currentTime+0.18);
    src.connect(bpf);bpf.connect(gain);gain.connect(ac.destination);
    src.start();src.stop(ac.currentTime+0.18);
    // Sharp attack click at start
    const osc=ac.createOscillator();osc.type='sawtooth';osc.frequency.setValueAtTime(340,ac.currentTime);osc.frequency.linearRampToValueAtTime(90,ac.currentTime+0.06);
    const g2=ac.createGain();g2.gain.setValueAtTime(0.4,ac.currentTime);g2.gain.linearRampToValueAtTime(0,ac.currentTime+0.07);
    osc.connect(g2);g2.connect(ac.destination);osc.start();osc.stop(ac.currentTime+0.07);
  }catch(e){}
}

function drawNappingDog(ctx,x,y,tick){
  const s=2.4;
  const u=v=>v*(s/1.8);
  const breathY=Math.sin(tick*0.03)*3;

  // ── TAIL CURL (drawn first so body overlaps it) ────
  ctx.strokeStyle='#B89058';ctx.lineWidth=u(11);
  ctx.beginPath();ctx.arc(x-u(36),y+u(9),u(28),Math.PI*0.2,Math.PI*1.5);ctx.stroke();
  ctx.strokeStyle='#D4B070';ctx.lineWidth=u(5);
  ctx.beginPath();ctx.arc(x-u(36),y+u(9),u(28),Math.PI*0.2,Math.PI*1.5);ctx.stroke();

  // ── BODY ────
  ctx.fillStyle='#C8A878';
  ctx.beginPath();ctx.ellipse(x,y+breathY,u(58),u(32),0.3,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#D4B280';
  ctx.beginPath();ctx.ellipse(x-u(6),y-u(5)+breathY,u(42),u(23),0.2,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#E8D0A0';
  ctx.beginPath();ctx.ellipse(x-u(2),y+u(10)+breathY,u(28),u(14),0.3,0,Math.PI*2);ctx.fill();

  // ── PAWS ────
  ctx.fillStyle='#C8A878';
  ctx.beginPath();ctx.ellipse(x+u(22),y+u(26)+breathY,u(22),u(12),0.1,0,Math.PI*2);ctx.fill();
  ctx.beginPath();ctx.ellipse(x-u(18),y+u(28)+breathY,u(18),u(11),-0.1,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle='rgba(100,70,30,0.45)';ctx.lineWidth=1.5;
  [-u(6),0,u(6)].forEach(dx=>{ctx.beginPath();ctx.moveTo(x+u(22)+dx,y+u(20)+breathY);ctx.lineTo(x+u(22)+dx,y+u(29)+breathY);ctx.stroke();});
  [-u(5),0,u(5)].forEach(dx=>{ctx.beginPath();ctx.moveTo(x-u(18)+dx,y+u(22)+breathY);ctx.lineTo(x-u(18)+dx,y+u(30)+breathY);ctx.stroke();});

  // ── HEAD ────
  ctx.fillStyle='#C8A878';ctx.beginPath();ctx.arc(x+u(50),y-u(14)+breathY,u(26),0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#D4B280';ctx.beginPath();ctx.arc(x+u(48),y-u(16)+breathY,u(20),0,Math.PI*2);ctx.fill();

  // ── SNOUT ────
  ctx.fillStyle='#D8B888';ctx.beginPath();ctx.ellipse(x+u(72),y-u(9)+breathY,u(18),u(13),0,0,Math.PI*2);ctx.fill();

  // ── NOSE ────
  ctx.fillStyle='#3A2010';ctx.beginPath();ctx.ellipse(x+u(86),y-u(11)+breathY,u(7),u(5),0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='rgba(255,255,255,0.4)';ctx.beginPath();ctx.arc(x+u(84),y-u(13)+breathY,u(2),0,Math.PI*2);ctx.fill();

  // ── EYES (closed sleeping arcs) ────
  ctx.strokeStyle='#3A2010';ctx.lineWidth=2.5;
  ctx.beginPath();ctx.arc(x+u(59),y-u(20)+breathY,u(6),Math.PI+0.4,Math.PI*2-0.4);ctx.stroke();
  ctx.lineWidth=1.2;
  for(let li=0;li<4;li++){const la=Math.PI+0.5+li*0.28;ctx.beginPath();ctx.moveTo(x+u(59)+Math.cos(la)*u(6),y-u(20)+breathY+Math.sin(la)*u(6));ctx.lineTo(x+u(59)+Math.cos(la)*u(8),y-u(20)+breathY+Math.sin(la)*u(8));ctx.stroke();}

  // ── FLOPPY EAR ────
  ctx.fillStyle='#A07848';
  ctx.beginPath();ctx.moveTo(x+u(40),y-u(32)+breathY);ctx.bezierCurveTo(x+u(28),y-u(56)+breathY,x+u(56),y-u(60)+breathY,x+u(64),y-u(40)+breathY);ctx.bezierCurveTo(x+u(56),y-u(30)+breathY,x+u(46),y-u(28)+breathY,x+u(40),y-u(32)+breathY);ctx.fill();
  ctx.fillStyle='#B88850';
  ctx.beginPath();ctx.moveTo(x+u(42),y-u(34)+breathY);ctx.bezierCurveTo(x+u(32),y-u(52)+breathY,x+u(54),y-u(56)+breathY,x+u(62),y-u(42)+breathY);ctx.bezierCurveTo(x+u(54),y-u(34)+breathY,x+u(47),y-u(30)+breathY,x+u(42),y-u(34)+breathY);ctx.fill();

  // ── ZZZ BUBBLES ────
  if(puppyBark<=0){
    const zA=0.7+Math.sin(tick*0.04)*0.3;
    [[x+u(90),y-u(55),10,zA],[x+u(104),y-u(75),8,zA*0.7],[x+u(116),y-u(92),6,zA*0.4]].forEach(([zx,zy,fs,a])=>{
      ctx.fillStyle='rgba(80,80,80,'+a+')';ctx.font='bold '+fs+'px "Press Start 2P",monospace';ctx.textAlign='center';ctx.fillText('z',zx,zy);
    });
  }
  // ── BARK ────
  if(puppyBark>0){
    ctx.fillStyle='rgba(50,20,100,0.92)';ctx.font='bold 10px "Press Start 2P",monospace';ctx.textAlign='center';
    ctx.fillText('WOOF!',x+u(55),y-u(62));puppyBark--;
  }
  // ── HEART FLOAT ────
  if(puppyHeart){
    const alpha=Math.min(1,puppyHeartTick/10);
    ctx.font='24px serif';ctx.globalAlpha=alpha;
    ctx.fillText('❤️',x+u(55),y-u(80)-puppyHeartTick*1.5);
    ctx.globalAlpha=1;puppyHeartTick++;
    if(puppyHeartTick>30){puppyHeart=false;puppyHeartTick=0;}
  }
}

function drawBasketBg(ctx, W, H){
  // Full canvas picnic blanket
  const checkSize=32;
  for(let row=0;row<Math.ceil(H/checkSize)+1;row++){
    for(let col=0;col<Math.ceil(W/checkSize)+1;col++){
      ctx.fillStyle=(row+col)%2===0?'#F0D8D8':'#FAFAFA';
      ctx.fillRect(col*checkSize,row*checkSize,checkSize,checkSize);
    }
  }
  // Grid overlay
  ctx.strokeStyle='rgba(190,120,110,0.18)';ctx.lineWidth=1;
  for(let row=0;row<=Math.ceil(H/checkSize);row++){ctx.beginPath();ctx.moveTo(0,row*checkSize);ctx.lineTo(W,row*checkSize);ctx.stroke();}
  for(let col=0;col<=Math.ceil(W/checkSize);col++){ctx.beginPath();ctx.moveTo(col*checkSize,0);ctx.lineTo(col*checkSize,H);ctx.stroke();}
  // Decorative top border stripe
  ctx.fillStyle='#D8A898';ctx.fillRect(0,0,W,8);
  for(let x=0;x<W;x+=18){ctx.fillStyle=(x/18)%2===0?'#C89080':'#E8B8A8';ctx.fillRect(x,0,9,8);}

  // Napping dog — lower center of blanket
  drawNappingDog(ctx, W*0.5, H*0.73, basketBgTime);

  // Bottom hint bar
  ctx.fillStyle='rgba(240,215,215,0.94)';ctx.fillRect(0,H-36,W,36);
  ctx.fillStyle='rgba(140,45,65,0.9)';ctx.font='7px "Press Start 2P",monospace';ctx.textAlign='center';
  if(openedBaskets.size<3){
    ctx.fillText('CLICK A BASKET TO UNCOVER A PRECIOUS GEM & EARN 500 COINS!',W/2,H-13);
  } else {
    ctx.fillStyle='rgba(40,120,70,0.9)';
    ctx.fillText('ALL GEMS FOUND!  NEW ROUND COMING WITH NEW GEMS...',W/2,H-13);
  }
}

function drawGem(ctx, cx, cy, basket, size){
  // Faceted gem shape
  const s=size||32;
  const gc=basket.gemColor, gs=basket.gemShine, gd=basket.gemDark;
  // Shadow
  ctx.fillStyle='rgba(0,0,0,0.3)';ctx.fillRect(cx-s/2+4,cy+s*0.6,s-4,6);
  // Main body (diamond shape)
  ctx.fillStyle=gc;
  ctx.beginPath();ctx.moveTo(cx,cy-s*0.55);ctx.lineTo(cx+s*0.5,cy);ctx.lineTo(cx,cy+s*0.6);ctx.lineTo(cx-s*0.5,cy);ctx.closePath();ctx.fill();
  // Top facet
  ctx.fillStyle=gs;
  ctx.beginPath();ctx.moveTo(cx,cy-s*0.55);ctx.lineTo(cx+s*0.5,cy);ctx.lineTo(cx+s*0.25,cy-s*0.2);ctx.closePath();ctx.fill();
  ctx.beginPath();ctx.moveTo(cx,cy-s*0.55);ctx.lineTo(cx-s*0.5,cy);ctx.lineTo(cx-s*0.25,cy-s*0.2);ctx.closePath();ctx.fill();
  // Centre shine
  ctx.fillStyle='rgba(255,255,255,0.75)';
  ctx.beginPath();ctx.moveTo(cx-s*0.12,cy-s*0.3);ctx.lineTo(cx+s*0.08,cy-s*0.15);ctx.lineTo(cx-s*0.05,cy-s*0.05);ctx.closePath();ctx.fill();
  // Dark bottom facet
  ctx.fillStyle=gd;
  ctx.beginPath();ctx.moveTo(cx-s*0.5,cy);ctx.lineTo(cx,cy+s*0.6);ctx.lineTo(cx+s*0.5,cy);ctx.lineTo(cx,cy+s*0.15);ctx.closePath();ctx.fill();
  // Sparkle pixels
  ctx.fillStyle='rgba(255,255,255,0.9)';
  const sp=Math.sin(basketBgTime*0.15)*3;
  ctx.fillRect(cx-s*0.4+sp,cy-s*0.4,4,4);ctx.fillRect(cx+s*0.3-sp,cy-s*0.3,3,3);
}

function drawPicnicBasket(ctx, cx, topY, basket, opened, shake){
  const bw=104, bh=122;
  const bx=cx-bw/2;
  const sx=shake?(Math.sin(basketAnim.tick*0.9)*5):0;
  ctx.save();ctx.translate(sx,0);

  // Drop shadow
  ctx.fillStyle='rgba(0,0,0,0.18)';
  ctx.beginPath();ctx.ellipse(cx,topY+bh+2,bw/2-4,7,0,0,Math.PI*2);ctx.fill();

  // ---- Arch handle ----
  if(!opened){
    // Handle shadow
    ctx.strokeStyle='rgba(0,0,0,0.15)';ctx.lineWidth=10;
    ctx.beginPath();ctx.arc(cx+2,topY+16,33,Math.PI,0);ctx.stroke();
    // Handle body
    const hg=ctx.createLinearGradient(bx+8,topY,bx+bw-8,topY);
    hg.addColorStop(0,'#7A4A10');hg.addColorStop(0.5,'#C07820');hg.addColorStop(1,'#7A4A10');
    ctx.strokeStyle=hg;ctx.lineWidth=8;
    ctx.beginPath();ctx.arc(cx,topY+14,33,Math.PI,0);ctx.stroke();
    ctx.strokeStyle='rgba(255,200,80,0.4)';ctx.lineWidth=3;
    ctx.beginPath();ctx.arc(cx,topY+14,32,Math.PI+0.2,Math.PI*2-0.2);ctx.stroke();
    // Handle base bands
    const hbg=ctx.createLinearGradient(bx+6,0,bx+14,0);
    hbg.addColorStop(0,'#6A3808');hbg.addColorStop(0.5,'#AA6020');hbg.addColorStop(1,'#6A3808');
    ctx.fillStyle=hbg;ctx.fillRect(bx+6,topY+10,10,10);ctx.fillRect(bx+bw-16,topY+10,10,10);
  }

  // ---- Lid ----
  if(opened){
    ctx.save();ctx.translate(cx,topY+18);ctx.rotate(-0.88);
    const lg=ctx.createLinearGradient(-bw/2,-16,bw/2,-16);
    lg.addColorStop(0,'#A86010');lg.addColorStop(0.5,'#D89028');lg.addColorStop(1,'#A86010');
    ctx.fillStyle=lg;
    ctx.beginPath();ctx.roundRect(-bw/2+3,-18,bw-6,19,3);ctx.fill();
    ctx.fillStyle='rgba(255,210,100,0.3)';ctx.fillRect(-bw/2+5,-16,bw-10,6);
    ctx.fillStyle='rgba(100,50,0,0.25)';
    for(let i=1;i<5;i++)ctx.fillRect(-bw/2+3,-18+i*4,bw-6,1.5);
    for(let i=1;i<8;i++)ctx.fillRect(-bw/2+3+i*(bw-6)/8,-18,1.5,19);
    ctx.restore();
    drawGem(ctx,cx,topY+28,basket,40);
  } else {
    // Closed lid gradient
    const lg=ctx.createLinearGradient(bx,topY+5,bx,topY+26);
    lg.addColorStop(0,'#E0A030');lg.addColorStop(0.5,'#C87818');lg.addColorStop(1,'#A06010');
    ctx.fillStyle=lg;
    ctx.beginPath();ctx.roundRect(bx+2,topY+5,bw-4,20,4);ctx.fill();
    // Lid weave
    ctx.fillStyle='rgba(100,50,0,0.2)';
    for(let i=1;i<5;i++)ctx.fillRect(bx+2,topY+5+i*4,bw-4,1.5);
    for(let i=1;i<9;i++)ctx.fillRect(bx+2+i*(bw-4)/9,topY+5,1.5,20);
    ctx.fillStyle='rgba(255,210,100,0.35)';ctx.fillRect(bx+4,topY+7,bw-8,5);
    // Ribbon bow
    const rc=basket.ribbonCol;
    ctx.fillStyle=rc;
    // Vertical sash
    ctx.beginPath();ctx.roundRect(cx-5,topY+5,10,20,2);ctx.fill();
    // Horizontal sash
    ctx.beginPath();ctx.roundRect(bx+2,topY+13,bw-4,6,2);ctx.fill();
    // Bow loops
    ctx.fillStyle=rc;
    ctx.beginPath();ctx.ellipse(cx-14,topY+11,12,6,Math.PI/6,0,Math.PI*2);ctx.fill();
    ctx.beginPath();ctx.ellipse(cx+14,topY+11,12,6,-Math.PI/6,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='rgba(255,255,255,0.35)';
    ctx.beginPath();ctx.ellipse(cx-14,topY+9,5,3,Math.PI/6,0,Math.PI*2);ctx.fill();
    ctx.beginPath();ctx.ellipse(cx+14,topY+9,5,3,-Math.PI/6,0,Math.PI*2);ctx.fill();
    // Bow knot
    ctx.fillStyle=rc;ctx.beginPath();ctx.arc(cx,topY+14,5,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='rgba(255,255,255,0.4)';ctx.beginPath();ctx.arc(cx-1,topY+13,2,0,Math.PI*2);ctx.fill();
  }

  // ---- Body ----
  const bodyY=topY+25; const bBodyH=bh-32;
  // Body gradient (wicker look)
  const wg=ctx.createLinearGradient(bx,bodyY,bx+bw,bodyY);
  wg.addColorStop(0,'#A86010');wg.addColorStop(0.15,'#D89030');wg.addColorStop(0.5,'#E8A040');wg.addColorStop(0.85,'#D89030');wg.addColorStop(1,'#A86010');
  ctx.fillStyle=wg;
  ctx.beginPath();ctx.roundRect(bx+2,bodyY,bw-4,bBodyH,4);ctx.fill();

  // Wicker horizontal weave bands
  ctx.save();ctx.beginPath();ctx.roundRect(bx+2,bodyY,bw-4,bBodyH,4);ctx.clip();
  const numH=7;
  for(let i=0;i<numH;i++){
    const wy=bodyY+i*(bBodyH/numH);
    const wbg=ctx.createLinearGradient(bx,wy,bx,wy+bBodyH/numH);
    wbg.addColorStop(0,'rgba(120,60,0,0.2)');wbg.addColorStop(0.5,'rgba(255,200,80,0.08)');wbg.addColorStop(1,'rgba(120,60,0,0.2)');
    ctx.fillStyle=wbg;ctx.fillRect(bx+2,wy,bw-4,bBodyH/numH);
    ctx.fillStyle='rgba(80,35,0,0.22)';ctx.fillRect(bx+2,wy,bw-4,2);
  }
  // Wicker vertical strips
  const numV=11;
  for(let i=0;i<=numV;i++){
    const vx=bx+2+i*(bw-4)/numV;
    const vg2=ctx.createLinearGradient(vx,bodyY,vx+2,bodyY);
    vg2.addColorStop(0,'rgba(80,35,0,0.22)');vg2.addColorStop(1,'rgba(200,140,40,0.1)');
    ctx.fillStyle=vg2;ctx.fillRect(vx,bodyY,2,bBodyH);
  }
  ctx.restore();

  // Rim highlight
  const rg=ctx.createLinearGradient(bx,bodyY,bx,bodyY+8);
  rg.addColorStop(0,'#FFD060');rg.addColorStop(1,'#C88020');
  ctx.fillStyle=rg;ctx.beginPath();ctx.roundRect(bx+2,bodyY,bw-4,8,4);ctx.fill();

  // Base
  const bg2=ctx.createLinearGradient(bx,topY+bh-12,bx,topY+bh);
  bg2.addColorStop(0,'#7A4A08');bg2.addColorStop(1,'#5A3005');
  ctx.fillStyle=bg2;ctx.beginPath();ctx.roundRect(bx+4,topY+bh-10,bw-8,10,3);ctx.fill();

  // Label area
  if(!opened){
    ctx.fillStyle='rgba(255,252,240,0.9)';
    ctx.beginPath();ctx.roundRect(bx+14,bodyY+22,bw-28,30,5);ctx.fill();
    ctx.strokeStyle='rgba(200,150,60,0.4)';ctx.lineWidth=1.5;
    ctx.beginPath();ctx.roundRect(bx+14,bodyY+22,bw-28,30,5);ctx.stroke();
    ctx.fillStyle=basket.ribbonCol;ctx.font='6px "Press Start 2P",monospace';ctx.textAlign='center';
    ctx.fillText(basket.label,cx,bodyY+35);
    ctx.font='16px serif';ctx.fillText(basket.icon,cx,bodyY+48);
  } else {
    ctx.fillStyle='rgba(220,255,234,0.85)';
    ctx.beginPath();ctx.roundRect(bx+14,bodyY+48,bw-28,22,5);ctx.fill();
    ctx.fillStyle='#30A060';ctx.font='6px "Press Start 2P",monospace';ctx.textAlign='center';
    ctx.fillText('REVEALED!',cx,bodyY+63);
  }
  ctx.restore();
}

function showBasketSuggestion(basketIdx){
  openedBaskets.add(basketIdx);
  basketsOpened++;
  const boEl=document.getElementById("baskets-opened"); if(boEl)boEl.textContent=basketsOpened;

  const suggestion=getRandomSuggestion();
  const basket=getCurrentBaskets()[basketIdx];

  document.getElementById("suggestion-basket-name").textContent=basket.name+" FOUND!";
  const gemCv=document.getElementById("gem-canvas");if(gemCv){const gemCtx=gemCv.getContext("2d");gemCtx.clearRect(0,0,100,100);drawGem(gemCtx,50,40,basket,40);}
  document.getElementById("suggestion-text").textContent=suggestion;
  document.getElementById("suggestion-coins-earned") && (document.getElementById("suggestion-coins-earned").textContent="+500 🪙 coins earned!");
  document.getElementById("basket-suggestion-overlay").style.display="flex";

  addCoins(500, window.innerWidth/2, window.innerHeight/2);
  addXP(15);
  playDing();
}

function closeBasketSuggestion(){
  document.getElementById("basket-suggestion-overlay").style.display="none";
  // If all 3 opened, advance to next gem round after a pause
  if(openedBaskets.size>=3){
    setTimeout(()=>{ basketRoundOffset++; openedBaskets.clear(); },3500);
  }
}

function basketLoop(){
  if(!basketCtx||!basketGameCanvas) return;
  basketBgTime++;
  const W=basketGameCanvas.width, H=basketGameCanvas.height;
  basketCtx.clearRect(0,0,W,H);
  drawBasketBg(basketCtx,W,H);

  if(basketAnim.active){
    basketAnim.tick++;
    if(basketAnim.tick>24){basketAnim.active=false;showBasketSuggestion(basketAnim.basket);}
  }

  const centerXs=[Math.round(W*0.2),W/2|0,Math.round(W*0.8)];
  const currentBaskets=getCurrentBaskets();
  centerXs.forEach((cx,i)=>{
    const isOpen=openedBaskets.has(i);
    const shake=basketAnim.active&&basketAnim.basket===i;
    drawPicnicBasket(basketCtx,cx,30,currentBaskets[i],isOpen,shake);
  });
  requestAnimationFrame(basketLoop);
}

// ============================================================
//  SIDE LADDER SCROLL ANIMATION
// ============================================================
const SECTION_IDS=['about','skills','projects','minigame','contact'];
let ladderAvatarY=0,ladderTargetY=0,ladderFrame=0,ladderTick=0;

function initLadder(){
  const wrap=document.getElementById("ladder-wrap");
  const cv=document.getElementById("ladder-canvas");
  if(!wrap||!cv)return;
  wrap.style.display="block";
  cv.width=80;
  function resizeLadder(){
    // Canvas = viewport height (wrap is fixed+overflow:hidden, only viewport is visible)
    const dh=window.innerHeight;
    cv.height=dh; cv.style.height=dh+"px";
    drawLadderFull(cv,dh);
  }
  resizeLadder();
  window.addEventListener("resize",resizeLadder);
  window.addEventListener("scroll",()=>{
    const cv2=document.getElementById("ladder-canvas");
    if(!cv2)return;
    const scroll=window.scrollY;
    const docH=document.body.scrollHeight-window.innerHeight;
    const frac=docH>0?Math.min(1,scroll/docH):0;
    ladderTargetY=frac*(cv2.height-40);
  });
  (function ladderLoop(){
    ladderAvatarY+=(ladderTargetY-ladderAvatarY)*0.015;
    ladderTick++;
    if(ladderTick%18===0)ladderFrame=1-ladderFrame;
    const cv2=document.getElementById("ladder-canvas");
    if(!cv2)return;
    drawLadderFull(cv2,cv2.height);
    requestAnimationFrame(ladderLoop);
  })();
}

function drawLadderFull(cv,totalH){
  const ctx=cv.getContext("2d");
  ctx.clearRect(0,0,cv.width,totalH);
  const lx=16,rx=64;
  // Rope shadows
  ctx.strokeStyle='rgba(60,30,0,0.2)';ctx.lineWidth=7;
  ctx.beginPath();ctx.moveTo(lx+3,0);ctx.lineTo(lx+3,totalH);ctx.stroke();
  ctx.beginPath();ctx.moveTo(rx+3,0);ctx.lineTo(rx+3,totalH);ctx.stroke();
  // Main ropes
  ctx.strokeStyle='#8B5A1A';ctx.lineWidth=5;
  ctx.beginPath();ctx.moveTo(lx,0);ctx.lineTo(lx,totalH);ctx.stroke();
  ctx.beginPath();ctx.moveTo(rx,0);ctx.lineTo(rx,totalH);ctx.stroke();
  // Rope highlight
  ctx.strokeStyle='rgba(220,175,80,0.45)';ctx.lineWidth=2;
  ctx.beginPath();ctx.moveTo(lx-1,0);ctx.lineTo(lx-1,totalH);ctx.stroke();
  ctx.beginPath();ctx.moveTo(rx-1,0);ctx.lineTo(rx-1,totalH);ctx.stroke();
  // Rope texture
  ctx.fillStyle='rgba(50,20,0,0.12)';
  for(let y=6;y<totalH;y+=10){ctx.fillRect(lx-2,y,4,2);ctx.fillRect(rx-2,y,4,2);}
  // Rungs + knots
  for(let y=22;y<totalH;y+=44){
    ctx.strokeStyle='rgba(60,30,0,0.15)';ctx.lineWidth=5;
    ctx.beginPath();ctx.moveTo(lx,y+2);ctx.lineTo(rx,y+2);ctx.stroke();
    ctx.strokeStyle='#7A4E12';ctx.lineWidth=4;
    ctx.beginPath();ctx.moveTo(lx,y);ctx.lineTo(rx,y);ctx.stroke();
    ctx.strokeStyle='rgba(210,165,60,0.35)';ctx.lineWidth=2;
    ctx.beginPath();ctx.moveTo(lx,y-1);ctx.lineTo(rx,y-1);ctx.stroke();
    ctx.fillStyle='#5A3008';ctx.fillRect(lx-5,y-5,10,10);
    ctx.fillStyle='#A86820';ctx.fillRect(lx-4,y-4,8,8);
    ctx.fillStyle='rgba(220,175,70,0.4)';ctx.fillRect(lx-2,y-2,3,3);
    ctx.fillStyle='#5A3008';ctx.fillRect(rx-5,y-5,10,10);
    ctx.fillStyle='#A86820';ctx.fillRect(rx-4,y-4,8,8);
    ctx.fillStyle='rgba(220,175,70,0.4)';ctx.fillRect(rx-2,y-2,3,3);
  }
  // Avatar
  const ay=Math.max(0,Math.min(totalH-40,ladderAvatarY));
  ctx.save();ctx.scale(0.28,0.28);
  ctx.translate(4/0.28,ay/0.28);
  ctx.imageSmoothingEnabled=false;
  drawAvatar(ctx,0,0,4,ladderFrame);
  ctx.restore();
}

// ============================================================
//  BREATHING TIMER
// ============================================================
let breatheActive=false, breathePhase='idle', breatheTick=0, breatheCycle=0;
const BREATHE_DURATION=5; // seconds per phase
const BREATHE_CYCLES=5;
let breatheRAF=null,breatheLastTime=0,breathePhaseElapsed=0;

function initBreather(){
  const cv=document.getElementById("breather-canvas");
  if(cv){const ctx=cv.getContext("2d");drawBreatherIdle(ctx,cv.width,cv.height);}
  // Wire close button via JS (backup for onclick attr)
  const modal=document.getElementById("breather-modal");
  const closeBtn=modal&&modal.querySelector(".breather-close");
  if(closeBtn) closeBtn.addEventListener("click",closeBreather);
  // Click backdrop to close
  if(modal) modal.addEventListener("click",e=>{if(e.target===modal)closeBreather();});
}

function openBreather(){
  document.getElementById("breather-modal").style.display="flex";
  breatheActive=false;breathePhase='idle';breatheCycle=0;breathePhaseElapsed=0;
  document.getElementById("breather-phase-text").textContent="ready?";
  document.getElementById("breather-cycle-text").textContent="cycle 0 / "+BREATHE_CYCLES;
  document.getElementById("breather-start-btn").style.display="block";
  const cv=document.getElementById("breather-canvas");
  if(cv){const ctx=cv.getContext("2d");drawBreatherIdle(ctx,cv.width,cv.height);}
}
function closeBreather(){
  document.getElementById("breather-modal").style.display="none";
  breatheActive=false;
  if(breatheRAF){cancelAnimationFrame(breatheRAF);breatheRAF=null;}
}
function startBreather(){
  document.getElementById("breather-start-btn").style.display="none";
  breatheActive=true;breathePhase='inhale';breatheCycle=1;breathePhaseElapsed=0;breatheLastTime=performance.now();
  playDing();
  (function breatheLoop(now){
    if(!breatheActive)return;
    const dt=(now-breatheLastTime)/1000;breatheLastTime=now;
    breathePhaseElapsed+=dt;
    const pct=Math.min(breathePhaseElapsed/BREATHE_DURATION,1);
    const cv=document.getElementById("breather-canvas");
    if(!cv){breatheActive=false;return;}
    const ctx=cv.getContext("2d");
    drawBreatherAnim(ctx,cv.width,cv.height,breathePhase,pct,breatheCycle);
    document.getElementById("breather-phase-text").textContent=breathePhase==='inhale'?'breathe in...':'breathe out...';
    document.getElementById("breather-cycle-text").textContent="cycle "+breatheCycle+" / "+BREATHE_CYCLES;
    if(breathePhaseElapsed>=BREATHE_DURATION){
      breathePhaseElapsed=0;playBlip();
      if(breathePhase==='inhale'){breathePhase='exhale';}
      else{breatheCycle++;breathePhase='inhale';if(breatheCycle>BREATHE_CYCLES){breatheActive=false;drawBreatherDone(ctx,cv.width,cv.height);document.getElementById("breather-phase-text").textContent="✨ all done!";document.getElementById("breather-cycle-text").textContent="";document.getElementById("breather-start-btn").style.display="block";document.getElementById("breather-start-btn").textContent="▶ AGAIN";addXP(5);return;}}
    }
    breatheRAF=requestAnimationFrame(breatheLoop);
  })(breatheLastTime);
}

function drawBreatherIdle(ctx,W,H){
  ctx.clearRect(0,0,W,H);
  const cx=W/2,cy=H/2;
  const g=ctx.createRadialGradient(cx,cy,10,cx,cy,60);
  g.addColorStop(0,'rgba(144,236,192,0.5)');g.addColorStop(1,'rgba(144,236,192,0.05)');
  ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
  ctx.strokeStyle='rgba(144,236,192,0.4)';ctx.lineWidth=3;ctx.beginPath();ctx.arc(cx,cy,45,0,Math.PI*2);ctx.stroke();
  ctx.fillStyle='rgba(144,236,192,0.15)';ctx.beginPath();ctx.arc(cx,cy,45,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='rgba(60,120,70,0.9)';ctx.font='9px "Press Start 2P",monospace';ctx.textAlign='center';ctx.fillText('click',cx,cy-4);ctx.fillText('begin',cx,cy+10);
}
function drawBreatherAnim(ctx,W,H,phase,pct,cycle){
  ctx.clearRect(0,0,W,H);
  const cx=W/2,cy=H/2;
  const minR=22,maxR=72;
  const r=phase==='inhale'?minR+(maxR-minR)*pct:maxR-(maxR-minR)*pct;
  // Outer glow
  const g=ctx.createRadialGradient(cx,cy,r*0.4,cx,cy,r*2);
  const col=phase==='inhale'?'144,236,192':'176,144,255';
  g.addColorStop(0,`rgba(${col},0.35)`);g.addColorStop(1,`rgba(${col},0.0)`);
  ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
  // Petals (8 surrounding circles)
  for(let i=0;i<8;i++){
    const a=i*Math.PI/4;const pr=r*0.38;const px=cx+Math.cos(a)*(r*0.85);const py=cy+Math.sin(a)*(r*0.85);
    ctx.fillStyle=`rgba(${col},0.22)`;ctx.beginPath();ctx.arc(px,py,pr,0,Math.PI*2);ctx.fill();
  }
  // Main circle
  ctx.fillStyle=`rgba(${col},0.30)`;ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle=`rgba(${col},0.85)`;ctx.lineWidth=3;ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.stroke();
  // Inner core
  ctx.fillStyle=`rgba(${col},0.6)`;ctx.beginPath();ctx.arc(cx,cy,r*0.4,0,Math.PI*2);ctx.fill();
  // Progress arc
  ctx.strokeStyle=`rgba(255,255,255,0.5)`;ctx.lineWidth=4;ctx.beginPath();ctx.arc(cx,cy,r+8,-Math.PI/2,-Math.PI/2+pct*Math.PI*2);ctx.stroke();
}
function drawBreatherDone(ctx,W,H){
  ctx.clearRect(0,0,W,H);
  const cx=W/2,cy=H/2;
  const g=ctx.createRadialGradient(cx,cy,10,cx,cy,70);
  g.addColorStop(0,'rgba(255,220,80,0.5)');g.addColorStop(1,'rgba(255,220,80,0.0)');
  ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
  ctx.fillStyle='rgba(255,220,80,0.8)';ctx.font='28px serif';ctx.textAlign='center';ctx.fillText('✨',cx,cy+8);
}

// Resume modal
function openResume(){ document.getElementById("resume-modal").style.display="flex"; }
function closeResume(){ document.getElementById("resume-modal").style.display="none"; }

// ============================================================
//  GUESTBOOK
// ============================================================
function loadGuestbook(){ drawGuestbookAvatar(); drawPostbox(false); }

function drawGuestbookAvatar(){
  const cv=document.getElementById("guestbook-avatar"); if(!cv)return;
  const ctx=cv.getContext("2d"); ctx.imageSmoothingEnabled=false;
  drawAvatar(ctx,0,0,8,0);
}

function drawPostbox(open){
  const cv=document.getElementById("postbox-canvas"); if(!cv)return;
  const ctx=cv.getContext("2d"); ctx.clearRect(0,0,cv.width,cv.height);
  const bx=20,by=20,bw=80,bh=80;
  // Post
  ctx.fillStyle='#888'; ctx.fillRect(55,by+bh,10,42);
  ctx.fillStyle='#666'; ctx.fillRect(56,by+bh,5,42);
  // Body
  ctx.fillStyle='#DD3030'; ctx.fillRect(bx,by+18,bw,bh-18);
  ctx.fillStyle='#FF5050'; ctx.fillRect(bx+2,by+20,bw-4,8);
  ctx.fillStyle='#AA1A1A'; ctx.fillRect(bx,by+bh-6,bw,6);
  // Lid
  if(open){
    ctx.save(); ctx.translate(bx+bw/2,by+18); ctx.rotate(-0.52);
    ctx.fillStyle='#EE2020'; ctx.fillRect(-bw/2,-20,bw,20);
    ctx.fillStyle='#FF6060'; ctx.fillRect(-bw/2+3,-18,bw-6,7);
    ctx.restore();
    ctx.fillStyle='#FFF8E0'; ctx.fillRect(bx+18,by+22,44,32);
    ctx.fillStyle='#FFCC00'; ctx.fillRect(bx+38,by+22,4,10);
    ctx.fillStyle='#CC9900'; ctx.fillRect(bx+18,by+36,44,3); ctx.fillRect(bx+18,by+42,30,3);
  } else {
    ctx.fillStyle='#CC2020'; ctx.fillRect(bx,by,bw,20);
    ctx.fillStyle='#FF5050'; ctx.fillRect(bx+3,by+3,bw-6,6);
    ctx.fillStyle='#AA1A1A'; ctx.fillRect(bx+14,by+12,52,5); ctx.fillRect(bx+14,by+13,52,2);
  }
  // Flag
  ctx.fillStyle=open?'#FFCC00':'#999';
  ctx.fillRect(bx+bw,by+20,6,26);
  ctx.fillStyle=open?'#FFE040':'#BBB';
  ctx.fillRect(bx+bw+6,by+20,16,16);
}

const gbMsg=document.getElementById("gb-msg"), wlDisplay=document.getElementById("word-limit-display");
if(gbMsg&&wlDisplay){
  gbMsg.addEventListener("input",()=>{
    const words=gbMsg.value.trim()===""?0:gbMsg.value.trim().split(/\s+/).length;
    wlDisplay.textContent=`(${words} / 150 words)`;
    if(words>150){ gbMsg.value=gbMsg.value.trim().split(/\s+/).slice(0,150).join(" "); wlDisplay.textContent="(150 / 150 words)"; }
  });
}

function submitGuestbook(){
  const nameVal=document.getElementById("gb-name").value.trim();
  const email=document.getElementById("gb-email").value.trim();
  const msg=document.getElementById("gb-msg").value.trim();
  if(!email){alert("Please enter your email so I know who to thank! ✉️");return;}
  if(!msg){alert("Write me a little note first! 📝");return;}
  if(msg.split(/\s+/).length>150){alert("Please keep your letter under 150 words!");return;}

  // Disable button to prevent double-submit
  const sendBtn=document.querySelector('.pc-send-btn');
  if(sendBtn){ sendBtn.disabled=true; sendBtn.textContent='SENDING…'; }

  const body=new URLSearchParams({
    "form-name":"guestbook",
    "bot-field":"",
    "visitor-name":nameVal,
    "visitor-email":email,
    "message":msg
  });

  fetch("/",{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},body:body.toString()})
    .then(r=>{
      if(!r.ok) console.warn("Guestbook: server returned",r.status);
    })
    .catch(()=>{}) // silent in local dev
    .finally(()=>{
      if(sendBtn){ sendBtn.disabled=false; sendBtn.textContent='SEND ▶'; }
    });

  // Clear + animate immediately for instant feedback
  document.getElementById("gb-name").value="";
  document.getElementById("gb-email").value="";
  document.getElementById("gb-msg").value="";
  if(wlDisplay) wlDisplay.textContent="(0 / 150 words)";
  animateLetterDelivery(); playDing(); addXP(10); addStar(window.innerWidth/2,window.innerHeight/2);
}

let gbJumpAnim=null;
function animateLetterDelivery(){
  const letterEl=document.getElementById("letter-anim"); if(!letterEl)return;
  letterEl.style.display="block"; letterEl.style.animation="none";
  requestAnimationFrame(()=>{letterEl.style.animation="letterFly 1.2s ease-out forwards";});
  setTimeout(()=>{
    letterEl.style.display="none"; drawPostbox(true);
    startAvatarJoy();
    setTimeout(()=>drawPostbox(false),2500);
  },1200);
}

function startAvatarJoy(){
  const cv=document.getElementById("guestbook-avatar"); if(!cv)return;
  const ctx=cv.getContext("2d"); ctx.imageSmoothingEnabled=false;
  if(gbJumpAnim) cancelAnimationFrame(gbJumpAnim);
  const startT=performance.now();
  const DURATION=2200; // ms
  // sparkle positions (relative to canvas)
  const sparks=Array.from({length:10},(_,i)=>({
    angle:(i/10)*Math.PI*2, dist:30+Math.random()*40,
    col:['#FFD040','#FF80A0','#80EEFF','#C0A0FF','#FF9930'][i%5],
    size:4+Math.random()*5
  }));

  function frame(now){
    const t=(now-startT)/DURATION;
    if(t>=1){ ctx.clearRect(0,0,cv.width,cv.height); drawAvatar(ctx,0,0,8,0); return; }

    // jump arc: 3 bounces, each half as high
    const freq=3, damping=0.35;
    const phase=t*freq*Math.PI;
    const jumpY=Math.abs(Math.sin(phase))*Math.pow(1-damping,t*freq)*44;
    // arms raised when jumping (use frame=1 at peak of each jump)
    const fr=(Math.sin(phase)>0.5)?1:0;

    ctx.clearRect(0,0,cv.width,cv.height);
    ctx.save();
    ctx.translate(0,-jumpY);
    drawAvatar(ctx,0,0,8,fr);
    ctx.restore();

    // sparkles radiating out
    if(t<0.6){
      const sparkT=t/0.6;
      sparks.forEach(sp=>{
        const sx=cv.width/2+Math.cos(sp.angle)*sp.dist*sparkT*2.5;
        const sy=cv.height*0.38+Math.sin(sp.angle)*sp.dist*sparkT*1.5;
        const a=1-sparkT*0.9;
        ctx.save();ctx.globalAlpha=a;ctx.fillStyle=sp.col;
        ctx.fillRect(sx-sp.size/2,sy-sp.size/2,sp.size,sp.size);
        // star arms
        ctx.strokeStyle=sp.col;ctx.lineWidth=1.5;
        [[1,0],[-1,0],[0,1],[0,-1]].forEach(([dx,dy])=>{
          ctx.beginPath();ctx.moveTo(sx,sy);ctx.lineTo(sx+dx*(sp.size+3),sy+dy*(sp.size+3));ctx.stroke();
        });
        ctx.restore();
      });
    }

    gbJumpAnim=requestAnimationFrame(frame);
  }
  gbJumpAnim=requestAnimationFrame(frame);
}

// ============================================================
//  LIGHTBOX
// ============================================================
function openLightbox(type,url,name){
  const lb=document.getElementById("lightbox"),content=document.getElementById("lb-content");
  if(type==="image") content.innerHTML=`<img src="${url}" alt="${name}"/>`;
  else if(type==="video") content.innerHTML=`<video src="${url}" controls autoplay style="max-width:80vw;max-height:80vh"></video>`;
  lb.style.display="flex"; document.body.style.overflow="hidden";
}
function closeLightbox(){
  document.getElementById("lightbox").style.display="none";
  document.getElementById("lb-content").innerHTML="";
  document.body.style.overflow="";
}
document.getElementById("lightbox").addEventListener("click",e=>{if(e.target===e.currentTarget)closeLightbox();});
document.addEventListener("keydown",e=>{if(e.key==="Escape")closeLightbox();});
