/* ============================================================
   UI ROUTER
   ============================================================ */
const app=()=>document.getElementById('app');
let _atTitle=false;
let _fxSkip=false;
function render(h){_atTitle=false;app().innerHTML="";app().appendChild($(`<div class="${_fxSkip?'':'scr-in'}">${h}</div>`));_fxSkip=false;ensureNavBtns();}
function ensureNavBtns(){
  const inGame=(typeof G!=="undefined"&&G&&!_atTitle);
  let s=document.getElementById('savebtn');
  if(!s){s=document.createElement('button');s.id='savebtn';s.className='savebtn';s.innerHTML='💾 Save';s.onclick=showSavePanel;document.body.appendChild(s);}
  s.style.display=inGame?'flex':'none';
  let f=document.getElementById('hudframe');   // reusable HUD corner frame — drawn once, framing every screen
  if(!f){f=document.createElement('div');f.id='hudframe';f.innerHTML='<i class="hc tl"></i><i class="hc tr"></i><i class="hc bl"></i><i class="hc br"></i>';document.body.appendChild(f);}
}
function ensureSaveBtn(){ensureNavBtns();}
function goHome(){try{saveGame();}catch(e){}screenTitle();}
function homeBtn(){return `<button class="btn ghost sm" onclick="goHome()" title="Back to the home menu (your game is saved)">🏠</button> `;}
const PHASES=["Winter","Camp","Season","Draft","Develop"];
function stepbar(a){const ph=(G.mode!=="survivor"&&G.year>=6)?PHASES.slice(0,3):PHASES;
  return `<div class="cmap">${ph.map((s,i)=>`<div class="leg ${i<a?'done':''} ${i===a?'on':''}"><span class="dot"></span><span class="lb">${s}</span></div>`).join("")}</div>`;}
function mandate(){if(G.year<=2)return{cls:'blue',txt:'Mandate: Rebuild — losing is OK'};
  if(G.year===3)return{cls:'gold',txt:'Mandate: Turn the corner'};return{cls:'green',txt:'Mandate: CONTEND now'};}
// shared branded top bar: wide logo (left) + home/right controls
function topBar(rightHtml){return `<div class="topbar"><img class="brandlogo" src="${LOGO_WIDE}" alt="Tank Commander"><div class="topbar-r">${homeBtn()}${rightHtml||''}</div></div>`;}
// tap-to-reveal info dot — keeps dense explanation off-screen until asked for
function infoDot(text){return `<span class="idot" onclick="toggleInfo(event,this)" data-info="${String(text).replace(/"/g,'&quot;')}">i</span>`;}
function toggleInfo(ev,el){
  ev.stopPropagation();
  let pop=document.getElementById('infopop');
  if(!pop){pop=document.createElement('div');pop.id='infopop';document.body.appendChild(pop);}
  if(pop._anchor===el&&pop.classList.contains('on')){pop.classList.remove('on');pop._anchor=null;el.classList.remove('on');return;}
  document.querySelectorAll('.idot.on').forEach(d=>d.classList.remove('on'));
  pop.innerHTML=el.getAttribute('data-info');pop._anchor=el;pop.classList.add('on');el.classList.add('on');
  const r=el.getBoundingClientRect(),sx=window.scrollX||window.pageXOffset||0,sy=window.scrollY||window.pageYOffset||0;
  pop.style.left='0px';pop.style.top='0px';
  const pw=pop.offsetWidth||240,vw=document.documentElement.clientWidth||360;
  let left=r.left+sx,top=r.bottom+sy+6;
  if(left+pw>vw-8)left=vw-pw-8;if(left<8)left=8;
  pop.style.left=left+'px';pop.style.top=top+'px';
}
if(typeof document!=="undefined"&&document.addEventListener)document.addEventListener('click',function(){const pop=document.getElementById('infopop');if(pop&&pop.classList.contains('on')){pop.classList.remove('on');pop._anchor=null;document.querySelectorAll('.idot.on').forEach(d=>d.classList.remove('on'));}});
function rubricBtn(){return `<button class="qbtn" title="How you're judged" onclick="showScoringRubric()">?</button>`;}
function showScoringRubric(){
  const old=document.getElementById('saveov');if(old)old.remove();
  const ov=document.createElement('div');ov.id='saveov';ov.className='saveov';
  const title=(typeof G!=="undefined"&&G&&G.mode==="survivor")?"How the owner judges you":"How you'll be graded";
  ov.innerHTML=`<div class="savebox"><div class="row" style="align-items:center"><h3 style="flex:1;margin:0">📐 ${title}</h3><button class="btn ghost sm" onclick="document.getElementById('saveov').remove()">✕</button></div><div style="margin-top:10px">${scoringRubric()}</div></div>`;
  document.body.appendChild(ov);
}
function header(){if(G.owner)return ownerHeader();if(G.mode==="survivor")return survivorHeader();const m=mandate();
  return `${topBar(`<span class="pill ${m.cls}">${m.txt}</span>${rubricBtn()}<button class="btn ghost sm" onclick="openFranchise()">📜 Franchise</button>`)}
   <div style="margin-bottom:8px"><div class="fid">${G.teamName}${G.hard?' <span class="pill" style="background:#3a1414;color:#ff8a6b;border-color:#c0392b;vertical-align:3px">🔥 Hard</span>':''}</div>
     <span class="fmeta">Year ${G.year} of 6 · ${G.league||''} ${G.div||''} · Payroll $${payroll(G.roster)}M</span></div>`;}
function goPhase(p){G.phase=p;saveGame();
  if(G.owner&&p===0)return ownerOffice();   // owners run the offseason from the owner's office, not the trade hub
  if(p===0)screenTrade();else if(p===1){_rosterMode='pre';screenRoster();}else if(p===2)screenSeason();
  else if(p===3)screenDraft();else if(p===4)screenDevelop();}

