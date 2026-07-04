
/* ============================================================
   AUDIO + HAPTICS — synthesized Web Audio SFX, no asset files.
   sfx(name) is safe to call anywhere (no-ops when muted/unsupported).
   hap(pattern) fires vibration on supporting devices. Added v9.6.
   ============================================================ */
const SND_KEY='tankCommander_sound';
let _ac=null,_master=null;
function sndOn(){return localStorage.getItem(SND_KEY)!=='0';}
function sndToggle(){localStorage.setItem(SND_KEY,sndOn()?'0':'1');sndBtnPaint();try{musMuteSync();}catch(e){}if(sndOn())sfx('tap');}
function sndBtnPaint(){const b=document.getElementById('sndbtn');if(b)b.textContent=sndOn()?'🔊':'🔇';}
function _ctx(){
  if(_ac)return _ac;
  const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return null;
  _ac=new AC();_master=_ac.createGain();_master.gain.value=.5;_master.connect(_ac.destination);
  return _ac;
}
function _tone(f0,f1,dur,type,vol,at){ // small swept oscillator
  const c=_ctx();if(!c)return;const t=c.currentTime+(at||0);
  const o=c.createOscillator(),g=c.createGain();
  o.type=type||'sine';o.frequency.setValueAtTime(f0,t);
  if(f1&&f1!==f0)o.frequency.exponentialRampToValueAtTime(Math.max(1,f1),t+dur);
  g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vol||.25,t+.008);
  g.gain.exponentialRampToValueAtTime(.0001,t+dur);
  o.connect(g);g.connect(_master);o.start(t);o.stop(t+dur+.02);
}
function _noise(dur,fc,q,vol,at,type){ // filtered noise burst
  const c=_ctx();if(!c)return;const t=c.currentTime+(at||0);
  const n=Math.floor(c.sampleRate*dur),buf=c.createBuffer(1,n,c.sampleRate),d=buf.getChannelData(0);
  for(let i=0;i<n;i++)d[i]=(Math.random()*2-1)*(1-i/n);
  const s=c.createBufferSource();s.buffer=buf;
  const f=c.createBiquadFilter();f.type=type||'bandpass';f.frequency.value=fc;f.Q.value=q||1;
  const g=c.createGain();g.gain.setValueAtTime(vol||.3,t);g.gain.exponentialRampToValueAtTime(.0001,t+dur);
  s.connect(f);f.connect(g);g.connect(_master);s.start(t);
}
const _SFX={
  tap(){_tone(1400,900,.05,'square',.06);},
  dice(){if(playSmp('dice'))return;for(let i=0;i<5;i++)_tone(700+Math.random()*500,0,.03,'square',.05,i*.09);},
  crack(){if(playSmp('crack'))return;_noise(.09,2100,1.2,.5);_tone(180,60,.09,'triangle',.3);},
  hit(){if(playSmp('crackhit'))return;_SFX.crack();},   // non-HR contact
  single(){_SFX.hit();_tone(660,880,.12,'sine',.14,.08);},
  double(){_SFX.hit();_tone(660,1100,.16,'sine',.16,.08);},
  triple(){_SFX.hit();_tone(660,1320,.2,'sine',.18,.08);},
  hr(){_SFX.crack();_tone(520,1560,.5,'sawtooth',.12,.06);_noise(1.1,1000,.4,.16,.18,'lowpass');},
  out(){_tone(140,70,.14,'sine',.3);_noise(.06,500,1,.12);},
  walk(){_tone(520,520,.07,'sine',.12);_tone(650,650,.07,'sine',.12,.1);},
  meatball(){_noise(.35,3200,2,.12);_tone(300,180,.3,'sawtooth',.06);},
  pack(){if(playSmp('pack'))return;_noise(.28,2600,.8,.35,0,'highpass');_tone(300,900,.2,'sawtooth',.07,.05);},
  flip(){_noise(.12,1600,1,.14,0,'highpass');},
  rare(){[880,1108,1318,1760,2217].forEach((f,i)=>_tone(f,f,.24,'sine',.14,i*.07));},
  coin(){_tone(880,880,.07,'sine',.15);_tone(1320,1320,.12,'sine',.15,.07);},
  levelup(){[523,659,784,1046].forEach((f,i)=>_tone(f,f,.16,'triangle',.16,i*.08));},
  win(){[392,523,659,784].forEach((f,i)=>_tone(f,f,.3,'sawtooth',.1,i*.11));_noise(1.2,900,.4,.14,.3,'lowpass');},
  lose(){_tone(330,262,.3,'triangle',.16);_tone(262,196,.42,'triangle',.16,.24);},
  strikeout(){if(playSmp('strikeout'))return;_SFX.out();},
  yourout(){if(playSmp('yourout'))return;_SFX.out();},
  playball(){if(playSmp('playball'))return;[392,523,659].forEach((f,i)=>_tone(f,f,.18,'triangle',.14,i*.09));},
};
function sfx(n){try{if(!sndOn())return;const f=_SFX[n];if(f)f();}catch(e){}}
function hap(p){try{if(sndOn()&&navigator.vibrate)navigator.vibrate(p);}catch(e){}}
// unlock audio on first gesture + soft tick on any button press
if(typeof document!=='undefined'&&document.addEventListener){
  document.addEventListener('pointerdown',e=>{
    _ctx();if(_ac&&_ac.state==='suspended')_ac.resume();
    try{musAutoStart();}catch(e2){}
    const el=e.target&&e.target.closest&&e.target.closest('.btn,.tmi,.bwb-ped');
    if(el&&!el.disabled)sfx('tap');
  },{passive:true});
}
// floating mute toggle (sits above the save button, bottom-right)
function ensureSndBtn(){
  if(document.getElementById('sndbtn'))return;
  const b=document.createElement('button');b.id='sndbtn';b.className='sndbtn';
  b.onclick=sndToggle;document.body.appendChild(b);sndBtnPaint();
}
if(typeof document!=='undefined'&&document.addEventListener)
  setTimeout(()=>{try{ensureSndBtn();}catch(e){}},0);

/* ---- micro-interactions: animated number count-up ---- */
function countUp(id,to,prefix,dur){
  const el=document.getElementById(id);if(!el)return;to=Number(to)||0;dur=dur||700;
  const t0=performance.now();prefix=prefix||'';
  (function step(t){const k=Math.min(1,(t-t0)/dur),e=1-Math.pow(1-k,3);
    el.textContent=prefix+Math.round(to*e);
    if(k<1)requestAnimationFrame(step);})(t0);
}
