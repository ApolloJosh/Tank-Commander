
/* ============================================================
   MUSIC + SAMPLED SFX — v9.8
   Ships as an /audio folder NEXT TO index.html (not inlined):
     audio/music/*.mp3   audio/sfx/*.mp3
   Degrades gracefully when the folder isn't deployed (player
   hides itself, SFX fall back to the v9.6 synth engine).
   ============================================================ */
const AUDIO_BASE='audio/';
const MUSIC=[
 ['music/Green_Onions.mp3','Green Onions'],
 ['music/Get_Lucky.mp3','Get Lucky'],
 ['music/Viva_la_Vida.mp3','Viva la Vida'],
 ['music/Seven_Nation_Army.mp3','Seven Nation Army'],
 ['music/Sweet_Caroline.mp3','Sweet Caroline'],
 ['music/Free_Bird.mp3','Free Bird'],
 ['music/Africa.mp3','Africa'],
 ['music/We_Are_Young.mp3','We Are Young'],
 ['music/We_Didnt_Start_the_Fire.mp3',"We Didn't Start the Fire"],
 ['music/Yellow_Submarine.mp3','Yellow Submarine'],
 ['music/Baseball_Medley_Lowrey_Stardust.mp3','Baseball Medley'],
 ['music/America_My_Country_Tis_of_Thee.mp3',"My Country, 'Tis of Thee"],
 ['music/America_the_Beautiful.mp3','America the Beautiful'],
 ['music/It_s_Gonna_Be_Me.mp3',"It's Gonna Be Me"],
 ['music/God_Only_Knows.mp3','God Only Knows'],
 ['music/Your_Love.mp3','Your Love'],
 ['music/Ob-La-Di_Ob-La-Da.mp3','Ob-La-Di, Ob-La-Da'],
 ['music/Born_This_Way_Organ_Version.mp3','Born This Way (Organ)'],
 ['music/California_Girls.mp3','California Girls'],
];
const MUS_KEY='tankCommander_music';
let _mus=null,_musEl=null,_musStarted=false,_musErr=0,_musDead=false;
function musState(){
  if(!_mus){try{_mus=JSON.parse(localStorage.getItem(MUS_KEY)||'null');}catch(e){_mus=null;}
    if(!_mus||typeof _mus.vol!=='number')_mus={on:1,vol:.35,i:Math.floor(Math.random()*MUSIC.length),min:0};}
  return _mus;
}
function musSave(){try{localStorage.setItem(MUS_KEY,JSON.stringify(musState()));}catch(e){}}
function musEl(){
  if(_musEl)return _musEl;
  if(typeof Audio==='undefined')return null;
  _musEl=new Audio();_musEl.preload='none';
  _musEl.addEventListener('ended',()=>{musSkip(1);});
  _musEl.addEventListener('error',()=>{
    if(++_musErr>=MUSIC.length){_musDead=true;musPaint();return;}   // whole folder missing
    musSkip(1);   // single bad file — try the next
  });
  _musEl.addEventListener('playing',()=>{_musErr=0;musPaint();});
  _musEl.addEventListener('pause',()=>musPaint());
  return _musEl;
}
function musLoad(play){
  const m=musState(),el=musEl();if(!el||_musDead)return;
  el.src=AUDIO_BASE+MUSIC[m.i][0];el.volume=m.vol;
  if(play&&sndOn()){const p=el.play();if(p&&p.catch)p.catch(()=>{});}
  musPaint();
}
function musToggle(){
  const m=musState(),el=musEl();if(!el||_musDead)return;
  if(el.paused){m.on=1;if(!el.src)musLoad(true);else if(sndOn()){const p=el.play();if(p&&p.catch)p.catch(()=>{});}}
  else{m.on=0;el.pause();}
  musSave();musPaint();
}
function musSkip(d){
  const m=musState();if(_musDead)return;
  m.i=((m.i+(d||1))%MUSIC.length+MUSIC.length)%MUSIC.length;musSave();
  musLoad(m.on);
}
function musVol(d){
  const m=musState();m.vol=Math.max(0,Math.min(1,Math.round((m.vol+d)*10)/10));
  const el=musEl();if(el)el.volume=m.vol;
  musSave();musPaint();sfx('tap');
}
function musMin(v){const m=musState();m.min=v?1:0;musSave();musPaint();}
function musMuteSync(){   // master 🔊 toggle gates music too
  const el=_musEl;if(!el)return;
  if(!sndOn())el.pause();
  else if(musState().on&&_musStarted){const p=el.play();if(p&&p.catch)p.catch(()=>{});}
  musPaint();
}
function musAutoStart(){   // called from the first user gesture (autoplay-safe)
  if(_musStarted||_musDead)return;_musStarted=true;
  if(musState().on&&sndOn())musLoad(true);
}
function musTryAutoplay(){   // best-effort autoplay at page load; browsers may veto until first tap
  if(_musStarted||_musDead)return;
  const m=musState();if(!(m.on&&sndOn()))return;
  const el=musEl();if(!el)return;
  el.src=AUDIO_BASE+MUSIC[m.i][0];el.volume=m.vol;
  const p=el.play();
  if(p&&p.then)p.then(()=>{_musStarted=true;musPaint();}).catch(()=>{});   // vetoed → first tap starts it
  else{_musStarted=true;musPaint();}
}
function ensureMusBar(){
  if(document.getElementById('musbar')||typeof Audio==='undefined')return;
  const d=document.createElement('div');d.id='musbar';document.body.appendChild(d);musPaint();
}
function musPaint(){
  const d=document.getElementById('musbar');if(!d)return;
  if(_musDead){d.style.display='none';return;}
  const m=musState(),el=_musEl,playing=el&&!el.paused;
  if(m.min){d.className='musbar min';d.innerHTML=`<button class="mb" title="Music" onclick="musMin(0)">♫</button>`;return;}
  d.className='musbar';
  d.innerHTML=`<span class="mnote">♫</span><span class="mtitle">${MUSIC[m.i][1]}</span>
    <button class="mb" title="${playing?'Pause':'Play'}" onclick="musToggle()">${playing?'⏸':'▶'}</button>
    <button class="mb" title="Next track" onclick="musSkip(1)">⏭</button>
    <button class="mb" title="Quieter" onclick="musVol(-0.1)">−</button>
    <span class="mvol">${'▮'.repeat(Math.round(m.vol*5))||'▯'}${'▯'.repeat(5-Math.round(m.vol*5))}</span>
    <button class="mb" title="Louder" onclick="musVol(0.1)">＋</button>
    <button class="mb dim" title="Collapse" onclick="musMin(1)">×</button>`;
}
if(typeof document!=='undefined'&&document.addEventListener)
  setTimeout(()=>{try{ensureMusBar();musTryAutoplay();}catch(e){}},0);

/* ---- sampled SFX (with synth fallback) ---- */
const SFX_FILES={crack:'sfx/bat-impact.mp3',crackhit:'sfx/bat-impact-hit.mp3',dice:'sfx/dice-roll.mp3',pack:'sfx/pack-rip.mp3',playball:'sfx/play-ball.mp3',strikeout:['sfx/strikeout.mp3','sfx/strikeout-2.mp3'],yourout:['sfx/youre-out-1.mp3','sfx/youre-out-2.mp3','sfx/out.mp3']};
const _smp={};
function _smpOne(path,vol){   // one sample file, cached; false once known-bad
  let a=_smp[path];
  if(a===false)return false;
  if(!a){a=new Audio(AUDIO_BASE+path);a.preload='auto';a.addEventListener('error',()=>{_smp[path]=false;});_smp[path]=a;}
  if(_smp[path]===false||a.error)return false;
  try{a.currentTime=0;a.volume=vol==null?.9:vol;const p=a.play();if(p&&p.catch)p.catch(()=>{});return true;}
  catch(e){return false;}
}
function playSmp(n,vol){
  if(typeof Audio==='undefined'||!SFX_FILES[n])return false;
  const f=SFX_FILES[n];
  if(!Array.isArray(f))return _smpOne(f,vol);
  // variant pool: pick at random, fall through to the others if that file is missing
  const order=f.slice();for(let i=order.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[order[i],order[j]]=[order[j],order[i]];}
  for(const path of order)if(_smpOne(path,vol))return true;
  return false;
}
