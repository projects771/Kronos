/* ══════════════════════════════════════════════════════════════
   KRONOS — script.js  (All Buttons Working Edition)
══════════════════════════════════════════════════════════════ */

// ── Timezone Data ──────────────────────────────────────────────
const ZONES = [
  { id:'lon', city:'London',      region:'Europe',     off:1,    color:'#4f8ef7', pill:'wp-lon' },
  { id:'nyc', city:'New York',    region:'Americas',   off:-4,   color:'#f5a623', pill:'wp-nyc' },
  { id:'tok', city:'Tokyo',       region:'Asia',       off:9,    color:'#a78bfa', pill:'wp-tok' },
  { id:'syd', city:'Sydney',      region:'Pacific',    off:10,   color:'#34d399', pill:'wp-syd' },
  { id:'mum', city:'Mumbai',      region:'Asia',       off:5.5,  color:'#fb7185', pill:null     },
  { id:'dxb', city:'Dubai',       region:'Middle East',off:4,    color:'#fbbf24', pill:null     },
  { id:'ber', city:'Berlin',      region:'Europe',     off:2,    color:'#60a5fa', pill:null     },
  { id:'lax', city:'Los Angeles', region:'Americas',   off:-7,   color:'#f97316', pill:null     },
  { id:'sin', city:'Singapore',   region:'Asia',       off:8,    color:'#34d399', pill:null     },
  { id:'par', city:'Paris',       region:'Europe',     off:2,    color:'#f472b6', pill:null     },
];

let ACT_OFF   = 5.5;
let use24h    = false;
let windLevel = 2; // 1–5

// ── CRT Terminal Snippets (longer, more authentic) ─────────────
const CODE_SNIPPETS = [
  'C:\\KRONOS> dir',
  'Volume in drive C is KRONOS',
  'Directory of C:\\KRONOS',
  '',
  'CLOCK    C   2,048 bytes',
  'TIME     H     512 bytes',
  '',
  'C:\\KRONOS> gcc clock.c -o clock.exe',
  'Compiling... OK',
  '',
  'C:\\KRONOS> clock.exe',
  '',
  '#include <stdio.h>',
  '#include <time.h>',
  '',
  'int main() {',
  '  time_t now = time(NULL);',
  '  struct tm *t = localtime(&now);',
  '  /* print current time */',
  '  printf("Time: %02d:%02d:%02d\\n",',
  '    t->tm_hour,',
  '    t->tm_min,',
  '    t->tm_sec);',
  '  return 0;',
  '}',
  '',
  'System Temporal Sync: [OK]',
  'Clock drift: +0.002ms',
  '',
  'C:\\KRONOS> _',
];

// ── Time Utilities ─────────────────────────────────────────────
function getT(off) {
  const n = new Date();
  return new Date(n.getTime() + n.getTimezoneOffset() * 60000 + off * 3600000);
}
function pad(n) { return String(n).padStart(2,'0'); }

function fmt12(d) {
  let h = d.getHours(), m = d.getMinutes(), s = d.getSeconds();
  const a = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${pad(h)}:${pad(m)}:${pad(s)} ${a}`;
}
function fmt24(d) {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}
function fmt12s(d) {
  let h = d.getHours(), m = d.getMinutes();
  const a = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${pad(h)}:${pad(m)} ${a}`;
}
function fmt24s(d) { return `${pad(d.getHours())}:${pad(d.getMinutes())}`; }

function fmtTime(d)  { return use24h ? fmt24(d)  : fmt12(d);  }
function fmtTimes(d) { return use24h ? fmt24s(d) : fmt12s(d); }

function tod(h) {
  if (h >= 5  && h < 12) return { l:'Morning',   c:'tp-morn',  i:'🌅' };
  if (h >= 12 && h < 17) return { l:'Afternoon', c:'tp-day',   i:'☀️' };
  if (h >= 17 && h < 21) return { l:'Evening',   c:'tp-eve',   i:'🌆' };
  return                         { l:'Night',     c:'tp-night', i:'🌙' };
}
function fmtDate(d) {
  return d.toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long'});
}

// ── Sky & Sun ─────────────────────────────────────────────────
function skyPhase(h) {
  if (h >= 0  && h < 5)  return 'night';
  if (h >= 5  && h < 7)  return 'dawn';
  if (h >= 7  && h < 11) return 'morning';
  if (h >= 11 && h < 14) return 'noon';
  if (h >= 14 && h < 18) return 'afternoon';
  if (h >= 18 && h < 21) return 'evening';
  return 'night';
}
function sunPosition(h) {
  if (h < 5 || h >= 20) return { top:200, left:-50, opacity:0 };
  const t = (h-5)/15;
  const top = 120 - 100 * Math.sin(Math.PI*t);
  const left = 20 + t*420;
  let opacity = 1;
  if (h < 6)  opacity = (h-5);
  if (h >= 19) opacity = (20-h);
  return { top:Math.round(top), left:Math.round(left), opacity:Math.max(0,Math.min(1,opacity)) };
}

function updateSky() {
  const active = getT(ACT_OFF);
  const h = active.getHours();
  const phase = skyPhase(h);

  const sky      = document.getElementById('sky');
  const skyGrad  = document.getElementById('sky-grad');
  const stars    = document.getElementById('stars');
  const moonWrap = document.getElementById('moon-wrap');
  const moonlight= document.getElementById('moonlight');
  const sunWrap  = document.getElementById('sun-wrap');
  const clouds   = ['cloud1','cloud2','cloud3','cloud4','cloud5'].map(id=>document.getElementById(id));
  const locIcon  = document.getElementById('loc-icon');
  const winFrame = document.querySelector('.win-frame');
  const panes    = document.querySelectorAll('.pane');
  const wall     = document.querySelector('.wall');

  if (sky)     sky.className = `sky sky-${phase}`;
  if (skyGrad) skyGrad.className = `sky-grad sky-${phase}-grad`;

  const showNight = (phase === 'night' || phase === 'dawn');
  if (stars)     stars.classList.toggle('hidden', !showNight);
  if (moonWrap)  moonWrap.classList.toggle('hidden', !showNight);
  if (moonlight) moonlight.classList.toggle('hidden', !showNight);

  const moonShadow = document.querySelector('.moon-shadow');
  if (moonShadow) moonShadow.style.background = (phase === 'night') ? '#04060c' : '#130920';

  if (sunWrap) {
    const pos = sunPosition(h);
    sunWrap.style.top     = pos.top  + 'px';
    sunWrap.style.left    = pos.left + 'px';
    sunWrap.style.opacity = pos.opacity;
    sunWrap.classList.toggle('visible', pos.opacity > 0);
  }

  const cloudClass = { night:'night-cloud', dawn:'dawn-cloud', morning:'day-cloud', noon:'day-cloud', afternoon:'day-cloud', evening:'eve-cloud' }[phase] || 'night-cloud';
  const farIds = ['cloud1','cloud2','cloud4'];
  clouds.forEach((c,i) => {
    if (!c) return;
    const id = ['cloud1','cloud2','cloud3','cloud4','cloud5'][i];
    const isFar = farIds.includes(id);
    c.className = `cloud${isFar?' cloud-far':''} ${cloudClass}`;
  });

  const paneClass = { night:'', dawn:'dawn-pane', morning:'morn-pane', noon:'day-pane', afternoon:'day-pane', evening:'eve-pane' }[phase] || '';
  panes.forEach(p => {
    p.classList.remove('day-pane','morn-pane','eve-pane','dawn-pane');
    if (paneClass) p.classList.add(paneClass);
    p.querySelectorAll('.pane-star').forEach(s => { s.style.opacity = showNight ? '' : '0'; });
  });

  if (winFrame) winFrame.classList.toggle('day-window', phase !== 'night');
  if (wall)     wall.classList.toggle('day-wall', phase !== 'night');
  if (locIcon)  locIcon.textContent = { night:'🌙', dawn:'🌅', morning:'🌤', noon:'☀️', afternoon:'⛅', evening:'🌆' }[phase] || '🌙';
}

// ── Stars ──────────────────────────────────────────────────────
function buildStars() {
  const container = document.getElementById('stars');
  if (!container) return;
  container.innerHTML = '';
  for (let i = 0; i < 70; i++) {
    const s = document.createElement('div');
    s.className = 'star';
    s.style.width = s.style.height = (Math.random()*1.8+0.5).toFixed(1)+'px';
    s.style.top  = (Math.random()*65).toFixed(2)+'%';
    s.style.left = (Math.random()*100).toFixed(2)+'%';
    s.style.setProperty('--d',  (Math.random()*3+2).toFixed(1)+'s');
    s.style.setProperty('--dl', -(Math.random()*4).toFixed(1)+'s');
    s.style.setProperty('--o',  (Math.random()*0.6+0.3).toFixed(2));
    container.appendChild(s);
  }
}

function buildShootingStars() {
  const container = document.getElementById('shooting-stars');
  if (!container) return;
  container.innerHTML = '';
  for (let i = 0; i < 4; i++) {
    const s = document.createElement('div');
    s.className = 'shooting-star';
    s.style.top  = (Math.random()*40).toFixed(2)+'%';
    s.style.left = (Math.random()*60).toFixed(2)+'%';
    s.style.setProperty('--ss-d',  (Math.random()*4+3).toFixed(1)+'s');
    s.style.setProperty('--ss-dl', -(Math.random()*8).toFixed(1)+'s');
    container.appendChild(s);
  }
}

// ── Dust particles ─────────────────────────────────────────────
function buildDust() {
  const container = document.getElementById('dust-layer');
  if (!container) return;
  container.innerHTML = '';
  for (let i = 0; i < 18; i++) {
    const d = document.createElement('div');
    d.className = 'dust';
    d.style.top  = (30 + Math.random()*55).toFixed(2)+'%';
    d.style.left = (Math.random()*100).toFixed(2)+'%';
    d.style.setProperty('--dd',  (Math.random()*6+5).toFixed(1)+'s');
    d.style.setProperty('--ddl', -(Math.random()*8).toFixed(1)+'s');
    d.style.setProperty('--dx',  (Math.random()*30-5).toFixed(1)+'px');
    d.style.setProperty('--dy',  -(Math.random()*20+10).toFixed(1)+'px');
    d.style.setProperty('--dx2', (Math.random()*50-10).toFixed(1)+'px');
    d.style.setProperty('--dy2', -(Math.random()*40+20).toFixed(1)+'px');
    container.appendChild(d);
  }
}

// ── Sidebar clock list ─────────────────────────────────────────
function buildSidebarClocks() {
  const container = document.getElementById('clocks');
  if (!container) return;
  container.innerHTML = '';
  ZONES.forEach(z => {
    const card = document.createElement('div');
    card.className = 'cc';
    card.style.setProperty('--ac', z.color);
    const d = getT(z.off);
    const t = tod(d.getHours());
    card.innerHTML = `
      <div class="cc-top">
        <div class="cc-city">${z.city}</div>
        <div class="cc-time" id="ct-${z.id}">${fmtTimes(d)}</div>
      </div>
      <div class="cc-bot">
        <span class="cc-per" style="color:${z.color}">${t.l}</span>
        <div class="cc-dot" style="background:${z.color}"></div>
      </div>
    `;
    card.addEventListener('click', () => transformActiveZone(z));
    container.appendChild(card);
  });
}

// ── Timezone drawer ────────────────────────────────────────────
function buildDrawer(filterText='') {
  const list = document.getElementById('tz-list');
  if (!list) return;
  list.innerHTML = '';
  const query = filterText.toLowerCase().trim();
  ZONES.forEach(z => {
    if (query && !z.city.toLowerCase().includes(query) && !z.region.toLowerCase().includes(query)) return;
    const d = getT(z.off);
    const t = tod(d.getHours());
    const card = document.createElement('div');
    card.className = 'tz-card';
    card.style.setProperty('--ac', z.color);
    card.innerHTML = `
      <div class="tz-card-main">
        <div>
          <div class="tz-city">${z.city}</div>
          <div class="tz-reg">${z.region}</div>
        </div>
        <div style="text-align:right">
          <div style="font-family:'Space Mono',monospace;font-size:13px;font-weight:700;color:${z.color}">${fmtTimes(d)}</div>
          <div style="font-size:9px;color:#4a6080;margin-top:2px">UTC${z.off>=0?'+':''}${z.off}</div>
        </div>
      </div>
    `;
    card.addEventListener('click', () => {
      transformActiveZone(z);
      document.getElementById('tz-drawer').classList.remove('open');
      document.getElementById('overlay').classList.remove('show');
    });
    list.appendChild(card);
  });
}

// ── Zone switcher ──────────────────────────────────────────────
function transformActiveZone(zone) {
  ACT_OFF = zone.off;
  const azCity = document.getElementById('az-city');
  if (azCity) azCity.textContent = `${zone.city}, ${zone.region}`;
  const locTxt = document.querySelector('.loc-txt');
  if (locTxt) locTxt.textContent = zone.city;
  const locSub = document.querySelector('.loc-sub');
  if (locSub) {
    const hrs  = Math.floor(Math.abs(zone.off));
    const mins = Math.round((Math.abs(zone.off)-hrs)*60);
    locSub.textContent = `UTC ${zone.off>=0?'+':'-'}${hrs}:${pad(mins)}`;
  }
  tick();
}

// ── Clock tick ─────────────────────────────────────────────────
function tick() {
  const active = getT(ACT_OFF);
  const t = tod(active.getHours());
  const heroT = document.getElementById('hero-t');
  const heroD = document.getElementById('hero-d');
  const pill  = document.getElementById('az-pill');
  if (heroT) heroT.textContent = fmtTime(active);
  if (heroD) heroD.textContent = fmtDate(active);
  if (pill)  { pill.textContent = t.l; pill.className = 'tod-pill '+t.c; }
  ZONES.forEach(z => {
    const d = getT(z.off);
    if (z.pill) { const el = document.getElementById(z.pill); if (el) el.textContent = fmtTimes(d); }
    const ct = document.getElementById('ct-'+z.id);
    if (ct) ct.textContent = fmtTimes(d);
  });
  updateSky();
  // Live tab title (HH:MM • City)
  try {
    const short = use24h ? fmt24s(active) : fmt12s(active);
    const az = document.getElementById('az-city');
    document.title = `${short} · ${az ? az.textContent.split(',')[0] : 'KRONOS'} — KRONOS`;
  } catch(e) {}
}

// ── Rain ───────────────────────────────────────────────────────
let rainActive  = false;
let rainAnimId  = null;

function initRain() {
  const canvas = document.getElementById('rain-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  canvas.width  = canvas.parentElement.clientWidth;
  canvas.height = canvas.parentElement.clientHeight;
  const drops = Array.from({length:120}, () => ({
    x: Math.random()*canvas.width,
    y: Math.random()*-canvas.height,
    l: Math.random()*14+6,
    v: Math.random()*7+10,
    w: Math.random()*0.8+0.3,
  }));
  function draw() {
    if (!rainActive) return;
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.strokeStyle = 'rgba(140,185,245,0.3)';
    ctx.lineCap = 'round';
    drops.forEach(d => {
      ctx.lineWidth = d.w;
      ctx.beginPath();
      ctx.moveTo(d.x, d.y);
      ctx.lineTo(d.x+d.v*0.06, d.y+d.l);
      ctx.stroke();
      d.y += d.v; d.x += d.v*0.06;
      if (d.y > canvas.height) { d.y=-20; d.x=Math.random()*canvas.width; }
    });
    rainAnimId = requestAnimationFrame(draw);
  }
  draw();
  // Show window rain streaks
  document.querySelectorAll('.pane-rain-streak').forEach(el => el.style.opacity='1');
}

function stopRain() {
  rainActive = false;
  if (rainAnimId) { cancelAnimationFrame(rainAnimId); rainAnimId=null; }
  document.querySelectorAll('.pane-rain-streak').forEach(el => el.style.opacity='0');
}

// ── Audio ──────────────────────────────────────────────────────
let audioCtx = null;
let musicActive = false;
const audioNodes = [];
let rainSoundNode = null;

function startRainSound() {
  if (!audioCtx) audioCtx = new (window.AudioContext||window.webkitAudioContext)();
  if (audioCtx.state === 'suspended') audioCtx.resume();
  const sz = 2 * audioCtx.sampleRate;
  const buf = audioCtx.createBuffer(1, sz, audioCtx.sampleRate);
  const out = buf.getChannelData(0);
  for (let i=0;i<sz;i++) out[i]=Math.random()*2-1;
  const src = audioCtx.createBufferSource();
  src.buffer = buf; src.loop = true;
  const flt = audioCtx.createBiquadFilter();
  flt.type='lowpass'; flt.frequency.value=420;
  const gain = audioCtx.createGain(); gain.gain.value=0.1;
  src.connect(flt); flt.connect(gain); gain.connect(audioCtx.destination);
  src.start();
  rainSoundNode = { source:src, gain };
}

function stopRainSound() {
  if (rainSoundNode) { try{rainSoundNode.source.stop();rainSoundNode.source.disconnect();}catch(e){} rainSoundNode=null; }
}

function createAmbientAudio() {
  if (audioCtx) { try{audioCtx.close();}catch(e){} }
  audioCtx = new (window.AudioContext||window.webkitAudioContext)();
  const master = audioCtx.createGain();
  master.gain.setValueAtTime(0,audioCtx.currentTime);
  master.gain.linearRampToValueAtTime(0.18, audioCtx.currentTime+2.5);
  master.connect(audioCtx.destination);
  audioNodes.push(master);
  [73.42,110.00,146.83].forEach((f,i) => {
    const osc=audioCtx.createOscillator(); osc.type='sine'; osc.frequency.value=f;
    const g=audioCtx.createGain(); g.gain.value=0.03/3;
    const lfo=audioCtx.createOscillator(); lfo.type='sine'; lfo.frequency.value=0.04+i*0.01;
    const lg=audioCtx.createGain(); lg.gain.value=0.005;
    lfo.connect(lg); lg.connect(g.gain); lfo.start();
    osc.connect(g); g.connect(master); osc.start();
    audioNodes.push(osc,g,lfo,lg);
  });
}

function stopAmbientAudio() {
  audioNodes.forEach(n => { try{n.stop();}catch(e){ try{n.disconnect();}catch(err){} } });
  audioNodes.length = 0;
}

// ── Wind control (fixed: no longer compounds leaf speeds) ─────
const _leafBaseSpeed = new WeakMap();
function applyWindLevel(level) {
  windLevel = level;
  const speeds = [12,9,7,5,3.5]; // period in seconds: higher=slower=less wind
  const skews  = [1.5,2.5,4,5.5,7]; // deg
  const spd = speeds[level-1];
  const sk  = skews[level-1];
  const cLeft  = document.querySelector('.c-left');
  const cRight = document.querySelector('.c-right');
  if (cLeft)  { cLeft.style.setProperty('--sw', spd+'s');   cLeft.style.setProperty('--sk', sk+'deg'); }
  if (cRight) { cRight.style.setProperty('--sw', (spd+2)+'s'); cRight.style.setProperty('--sk', '-'+sk+'deg'); }
  const stem = document.querySelector('.stem');
  if (stem) stem.style.animationDuration = (9-level)+'s';
  // Leaves: cache each leaf's ORIGINAL --lw on first call, then derive from it
  document.querySelectorAll('.leaf,.tiny-leaf').forEach(l => {
    let base = _leafBaseSpeed.get(l);
    if (base == null) {
      base = parseFloat(l.style.getPropertyValue('--lw')) || 4.5;
      _leafBaseSpeed.set(l, base);
    }
    l.style.setProperty('--lw', Math.max(1.5, base * (6 - level) / 4) + 's');
  });
}

// ── CRT Typewriter ────────────────────────────────────────────
let codeIdx = 0;
let hddBlinkTimer = null;

function escHtml(s) { return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

function colorCodeLine(txt) {
  if (txt==='') return '&nbsp;';
  if (txt==='C:\\KRONOS> _') return `<span class="prompt-col">C:\\KRONOS&gt; </span><span class="crt-cursor"></span>`;
  if (txt.startsWith('C:\\')) return `<span class="prompt-col">${escHtml(txt)}</span>`;
  if (txt.startsWith('/*')||txt.startsWith('//')||txt.includes('/*')) return `<span class="crt-cmt">${escHtml(txt)}</span>`;

  const KEYWORDS = ['int','struct','return','time_t','printf','localtime','main','include','NULL','void','char','long'];
  let html = escHtml(txt);
  html = html.replace(/"([^"]*)"/g, '<span class="crt-str">"$1"</span>');
  html = html.replace(/\b(\d+)\b/g, '<span class="crt-num">$1</span>');
  KEYWORDS.forEach(kw => {
    html = html.replace(new RegExp(`\\b${kw}\\b`,'g'), `<span class="crt-kw">${kw}</span>`);
  });
  return html;
}

function flashHdd() {
  const led1 = document.getElementById('hdd-led');
  const led2 = document.getElementById('tower-hdd-led');
  if (led1) led1.classList.add('active');
  if (led2) led2.classList.add('active');
  setTimeout(() => {
    if (led1) led1.classList.remove('active');
    if (led2) led2.classList.remove('active');
  }, 180);
}

function typeNextLine() {
  const area = document.getElementById('code-area');
  if (!area) return;
  while (area.children.length >= 12) area.removeChild(area.firstChild);
  const txt = CODE_SNIPPETS[codeIdx % CODE_SNIPPETS.length];
  codeIdx++;
  const line = document.createElement('span');
  line.className = 'crt-line';
  line.innerHTML = colorCodeLine(txt);
  area.appendChild(line);

  // Flash HDD LED on file/compile lines
  if (txt.startsWith('C:\\') || txt.includes('gcc') || txt.includes('#include')) flashHdd();

  const delay = txt==='' ? 350 : txt.startsWith('C:\\') ? 1200 : txt.includes('/*') ? 300 : 220;
  setTimeout(typeNextLine, delay);
}

// ── Sync rain/music toggles with settings modal ──────────────
function syncSettingsUI() {
  const soundBtn  = document.getElementById('sound-toggle');
  const rainSBtn  = document.getElementById('rain-settings-toggle');
  const fmtBtn    = document.getElementById('fmt-toggle');
  if (soundBtn)  { soundBtn.textContent = musicActive ? 'ON' : 'OFF'; soundBtn.classList.toggle('on',musicActive); }
  if (rainSBtn)  { rainSBtn.textContent = rainActive  ? 'ON' : 'OFF'; rainSBtn.classList.toggle('on',rainActive);  }
  if (fmtBtn)    { fmtBtn.textContent   = use24h      ? '24h' : '12h'; fmtBtn.classList.toggle('on',use24h);        }
}

// ── Controls Init ──────────────────────────────────────────────
function initControls() {
  // ── Timezone drawer
  const drawer  = document.getElementById('tz-drawer');
  const overlay = document.getElementById('overlay');
  const tzBtn   = document.getElementById('tz-toggle-btn');
  const tzClose = document.getElementById('tz-close');
  const searchInput = document.getElementById('tz-search');

  if (tzBtn) tzBtn.addEventListener('click', () => {
    drawer.classList.add('open');
    overlay.classList.add('show');
    if (searchInput) { searchInput.value=''; buildDrawer(); searchInput.focus(); }
  });
  if (tzClose) tzClose.addEventListener('click', () => { drawer.classList.remove('open'); overlay.classList.remove('show'); });
  if (searchInput) searchInput.addEventListener('input', e => buildDrawer(e.target.value));

  // ── Settings modal
  const settingsModal = document.getElementById('settings-modal');
  const settingsBtn   = document.getElementById('settings-toggle-btn');
  const settingsClose = document.getElementById('settings-close');
  if (settingsBtn)   settingsBtn.addEventListener('click',  () => { settingsModal.classList.add('show');    overlay.classList.add('show'); syncSettingsUI(); });
  if (settingsClose) settingsClose.addEventListener('click', () => { settingsModal.classList.remove('show'); overlay.classList.remove('show'); });

  // ── Overlay click closes everything
  if (overlay) overlay.addEventListener('click', () => {
    drawer.classList.remove('open');
    if (settingsModal) settingsModal.classList.remove('show');
    overlay.classList.remove('show');
  });

  // ── Rain toggle (toolbar)
  const rainBtn = document.getElementById('rain-toggle-btn');
  if (rainBtn) rainBtn.addEventListener('click', () => {
    rainActive = !rainActive;
    rainBtn.classList.toggle('active', rainActive);
    rainBtn.title = rainActive ? 'Stop Rain' : 'Toggle Rain';
    const canvas = document.getElementById('rain-canvas');
    const cloudEls = ['cloud1','cloud2','cloud3','cloud4','cloud5'].map(id=>document.getElementById(id));
    if (rainActive) {
      if (canvas) canvas.classList.add('raining');
      initRain();
      startRainSound();
      cloudEls.forEach(c => { if(c){ c.style.background='rgba(55,70,90,0.55)'; c.style.filter='blur(12px)'; } });
    } else {
      if (canvas) canvas.classList.remove('raining');
      stopRain();
      stopRainSound();
      cloudEls.forEach(c => { if(c){ c.style.background=''; c.style.filter=''; } });
    }
    syncSettingsUI();
  });

  // ── Music toggle (toolbar)
  const musicBtn = document.getElementById('music-btn');
  if (musicBtn) musicBtn.addEventListener('click', () => {
    musicActive = !musicActive;
    musicBtn.classList.toggle('active', musicActive);
    musicBtn.textContent = musicActive ? '🔊' : '🔇';
    musicActive ? createAmbientAudio() : stopAmbientAudio();
    syncSettingsUI();
  });

  // ── Settings panel toggles
  const soundToggle = document.getElementById('sound-toggle');
  if (soundToggle) soundToggle.addEventListener('click', () => {
    musicActive = !musicActive;
    musicActive ? createAmbientAudio() : stopAmbientAudio();
    const musicBtn2 = document.getElementById('music-btn');
    if (musicBtn2) { musicBtn2.textContent = musicActive ? '🔊' : '🔇'; musicBtn2.classList.toggle('active',musicActive); }
    syncSettingsUI();
  });

  const rainSToggle = document.getElementById('rain-settings-toggle');
  if (rainSToggle) rainSToggle.addEventListener('click', () => {
    document.getElementById('rain-toggle-btn')?.click();
  });

  const fmtToggle = document.getElementById('fmt-toggle');
  if (fmtToggle) fmtToggle.addEventListener('click', () => {
    use24h = !use24h;
    syncSettingsUI();
    tick();
    buildSidebarClocks();
    buildDrawer(document.getElementById('tz-search')?.value||'');
  });

  const windSlider = document.getElementById('wind-slider');
  if (windSlider) windSlider.addEventListener('input', e => {
    applyWindLevel(parseInt(e.target.value));
  });
}

// ── Init ───────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  buildStars();
  buildShootingStars();
  buildDust();
  buildSidebarClocks();
  buildDrawer();
  initControls();
  typeNextLine();
  applyWindLevel(2); // default medium wind
  setInterval(tick, 1000);
  tick();
});

/* ══════════════════════════════════════════════════════════════
   ENHANCEMENTS — persistence, shortcuts, Pomodoro focus timer
══════════════════════════════════════════════════════════════ */

// ── Persistence ────────────────────────────────────────────────
const PREF_KEY = 'kronos.prefs.v1';
function loadPrefs() {
  try { return JSON.parse(localStorage.getItem(PREF_KEY) || '{}'); }
  catch (e) { return {}; }
}
function savePrefs(patch) {
  try {
    const cur = loadPrefs();
    localStorage.setItem(PREF_KEY, JSON.stringify({ ...cur, ...patch }));
  } catch (e) {}
}

function applyStoredPrefs() {
  const p = loadPrefs();
  if (typeof p.use24h === 'boolean') use24h = p.use24h;
  if (typeof p.windLevel === 'number') {
    const slider = document.getElementById('wind-slider');
    if (slider) slider.value = String(p.windLevel);
    applyWindLevel(p.windLevel);
  }
  if (typeof p.zoneId === 'string') {
    const z = ZONES.find(z => z.id === p.zoneId);
    if (z) transformActiveZone(z);
  }
  if (p.rain) document.getElementById('rain-toggle-btn')?.click();
  if (p.music) document.getElementById('music-btn')?.click();
}

// Hook persistence into existing handlers via wrappers
const _origTransform = transformActiveZone;
transformActiveZone = function(zone) {
  _origTransform(zone);
  savePrefs({ zoneId: zone.id });
};
const _origApplyWind = applyWindLevel;
applyWindLevel = function(level) {
  _origApplyWind(level);
  savePrefs({ windLevel: level });
};

// ── Keyboard shortcuts ─────────────────────────────────────────
function initShortcuts() {
  document.addEventListener('keydown', (e) => {
    const tag = (e.target && e.target.tagName) || '';
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;

    const k = e.key.toLowerCase();
    if (k === 'r') { document.getElementById('rain-toggle-btn')?.click(); e.preventDefault(); }
    else if (k === 'm') { document.getElementById('music-btn')?.click(); e.preventDefault(); }
    else if (k === 't') { document.getElementById('tz-toggle-btn')?.click(); e.preventDefault(); }
    else if (k === 's') { document.getElementById('settings-toggle-btn')?.click(); e.preventDefault(); }
    else if (k === 'f') { document.getElementById('fmt-toggle')?.click(); e.preventDefault(); }
    else if (k === 'escape') {
      document.getElementById('tz-drawer')?.classList.remove('open');
      document.getElementById('settings-modal')?.classList.remove('show');
      document.getElementById('overlay')?.classList.remove('show');
    }
  });
}

// Persist toggle-state via observing the toolbar buttons after clicks
function wirePersistToggles() {
  const rainBtn  = document.getElementById('rain-toggle-btn');
  const musicBtn = document.getElementById('music-btn');
  const fmtBtn   = document.getElementById('fmt-toggle');
  rainBtn?.addEventListener('click',  () => savePrefs({ rain: rainActive }));
  musicBtn?.addEventListener('click', () => savePrefs({ music: musicActive }));
  fmtBtn?.addEventListener('click',   () => savePrefs({ use24h }));
}

// ── Pomodoro focus timer ───────────────────────────────────────
const TIMER = {
  mode: 'work',         // 'work' | 'break'
  remaining: 25 * 60,   // seconds
  running: false,
  intervalId: null,
};
const WORK_SECS  = 25 * 60;
const BREAK_SECS =  5 * 60;

function fmtMMSS(s) {
  s = Math.max(0, Math.floor(s));
  return `${pad(Math.floor(s/60))}:${pad(s%60)}`;
}
function refreshTimerUI() {
  const disp = document.getElementById('timer-display');
  const mode = document.getElementById('timer-mode');
  const start = document.getElementById('timer-start');
  const fr = document.getElementById('focus-readout');
  const frLbl = document.getElementById('fr-label');
  const frTime = document.getElementById('fr-time');
  const t = fmtMMSS(TIMER.remaining);
  if (disp)  disp.textContent = t;
  if (mode)  { mode.textContent = TIMER.mode === 'work' ? 'Work' : 'Break'; mode.classList.toggle('on', true); }
  if (start) { start.textContent = TIMER.running ? 'PAUSE' : 'START'; start.classList.toggle('on', TIMER.running); }
  if (fr) {
    fr.hidden = !TIMER.running && TIMER.remaining === (TIMER.mode === 'work' ? WORK_SECS : BREAK_SECS);
    fr.classList.toggle('break', TIMER.mode === 'break');
  }
  if (frLbl)  frLbl.textContent = TIMER.mode === 'work' ? 'Focus' : 'Break';
  if (frTime) frTime.textContent = t;
}
function tickTimer() {
  if (!TIMER.running) return;
  TIMER.remaining--;
  if (TIMER.remaining <= 0) {
    TIMER.running = false;
    clearInterval(TIMER.intervalId);
    TIMER.intervalId = null;
    // Auto-flip mode
    TIMER.mode = TIMER.mode === 'work' ? 'break' : 'work';
    TIMER.remaining = TIMER.mode === 'work' ? WORK_SECS : BREAK_SECS;
    notifyTimerEnd();
  }
  refreshTimerUI();
}
function notifyTimerEnd() {
  // Soft chime via WebAudio (independent of ambient music)
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const o = ctx.createOscillator(); const g = ctx.createGain();
    o.type = 'sine'; o.frequency.value = TIMER.mode === 'work' ? 660 : 880;
    g.gain.setValueAtTime(0.0001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + 0.05);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.4);
    o.connect(g); g.connect(ctx.destination);
    o.start(); o.stop(ctx.currentTime + 1.5);
    setTimeout(() => { try { ctx.close(); } catch(e){} }, 1700);
  } catch (e) {}
}
function initTimer() {
  const start = document.getElementById('timer-start');
  const reset = document.getElementById('timer-reset');
  const mode  = document.getElementById('timer-mode');
  if (!start || !reset || !mode) return;

  start.addEventListener('click', () => {
    TIMER.running = !TIMER.running;
    if (TIMER.running) {
      if (TIMER.intervalId) clearInterval(TIMER.intervalId);
      TIMER.intervalId = setInterval(tickTimer, 1000);
    } else if (TIMER.intervalId) {
      clearInterval(TIMER.intervalId); TIMER.intervalId = null;
    }
    refreshTimerUI();
  });
  reset.addEventListener('click', () => {
    TIMER.running = false;
    if (TIMER.intervalId) { clearInterval(TIMER.intervalId); TIMER.intervalId = null; }
    TIMER.remaining = TIMER.mode === 'work' ? WORK_SECS : BREAK_SECS;
    refreshTimerUI();
  });
  mode.addEventListener('click', () => {
    if (TIMER.running) return; // don't switch mid-run
    TIMER.mode = TIMER.mode === 'work' ? 'break' : 'work';
    TIMER.remaining = TIMER.mode === 'work' ? WORK_SECS : BREAK_SECS;
    refreshTimerUI();
  });
  refreshTimerUI();
}

// ── Boot the enhancements after the original DOMContentLoaded ──
window.addEventListener('load', () => {
  initShortcuts();
  wirePersistToggles();
  initTimer();
  applyStoredPrefs();
});
