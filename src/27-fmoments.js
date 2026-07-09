
/* ============================================================
   FRANCHISE MOMENTS — v9.9
   Custom SVG icons · campaign map · memos · season ticker ·
   camp reports · breaking news · clubhouse decisions
   ============================================================ */

/* ---- icon set: hand-drawn 24x24 line icons, currentColor ---- */
const ICO_P={
  scope:'<circle cx="12" cy="12" r="7"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/><circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none"/>',
  radio:'<rect x="3" y="9" width="18" height="11" rx="1.5"/><path d="M7 9l9-6"/><circle cx="8" cy="14.5" r="2.4"/><path d="M14 12.5h4M14 16.5h4"/>',
  pen:'<path d="M4 20l1.2-4.2L16.4 4.6a2 2 0 012.8 0l.2.2a2 2 0 010 2.8L8.2 18.8z"/><path d="M13.5 7.5l3 3"/>',
  swap:'<path d="M4 8h13l-3-3M20 16H7l3 3"/>',
  clip:'<rect x="5" y="4" width="14" height="17" rx="1.5"/><path d="M9 4a3 3 0 016 0"/><path d="M8 10h8M8 14h8M8 18h5"/>',
  ball:'<circle cx="12" cy="12" r="9"/><path d="M5.5 5.5c2.5 1.8 4 4 4 6.5s-1.5 4.7-4 6.5M18.5 5.5c-2.5 1.8-4 4-4 6.5s1.5 4.7 4 6.5"/>',
  bat:'<path d="M4 20l2.5-2.5M6.5 17.5L18 4.5a1.8 1.8 0 012.6 2.4L8.5 19.5z"/><circle cx="5" cy="19" r="1.6"/>',
  star:'<path d="M12 3l2.7 5.7 6.3.8-4.6 4.3 1.2 6.2-5.6-3.1-5.6 3.1 1.2-6.2L3 9.5l6.3-.8z"/>',
  rank:'<path d="M5 8l7 4 7-4M5 13l7 4 7-4"/>',
  memo:'<rect x="3" y="5" width="18" height="14" rx="1.5"/><path d="M3 6.5l9 6 9-6"/>',
  siren:'<path d="M6 18v-5a6 6 0 0112 0v5"/><path d="M3.5 20.5h17"/><path d="M12 3v2M5 6l1.4 1.4M19 6l-1.4 1.4"/>',
  wrench:'<path d="M14.5 6.5a4.5 4.5 0 00-6 5.7L4 16.7a2 2 0 002.8 2.8l4.5-4.5a4.5 4.5 0 005.7-6L14 12l-2-2z"/>',
  binoc:'<circle cx="6.5" cy="15.5" r="3.5"/><circle cx="17.5" cy="15.5" r="3.5"/><path d="M10 15V7a2 2 0 00-4 0M14 15V7a2 2 0 014 0M10 12h4"/>',
  trophy:'<path d="M7 4h10v5a5 5 0 01-10 0z"/><path d="M7 5H4a3 3 0 003 4M17 5h3a3 3 0 01-3 4M12 14v3M8.5 20.5h7M10 17.5h4"/>',
  flag:'<path d="M5 21V4"/><path d="M5 4h13l-2.5 3.5L18 11H5"/>',
  helmet:'<path d="M4 13a8 8 0 0116 0v3h-5"/><circle cx="15" cy="16" r="2.5"/><path d="M4 13v3h6"/>',
  chart:'<path d="M4 20V4"/><path d="M4 20h16"/><path d="M8 16l3-4 3 2 5-7"/>',
  cash:'<rect x="3" y="7" width="18" height="11" rx="1.5"/><circle cx="12" cy="12.5" r="2.6"/><path d="M6.5 10v.01M17.5 15v.01"/>',
};
function ico(n,sz,st){const p=ICO_P[n];if(!p)return '';
  return `<svg class="ico" viewBox="0 0 24 24" width="${sz||16}" height="${sz||16}" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" ${st?`style="${st}"`:''} aria-hidden="true">${p}</svg>`;}

/* ---- breaking-news banner (replaces trade toasts) ---- */
function showBreaking(title,sub){
  const old=document.getElementById('brknews');if(old)old.remove();
  const d=document.createElement('div');d.id='brknews';d.className='brknews';
  d.innerHTML=`<span class="tag">${ico('siren',11)} BREAKING · THE WIRE</span><b>${title}</b>${sub?`<span>${sub}</span>`:''}`;
  document.body.appendChild(d);sfx('coin');hap(15);
  setTimeout(()=>{try{d.classList.add('out');setTimeout(()=>d.remove(),400);}catch(e){}},3600);
}

/* ---- generated memos: the spreadsheet, narrated ---- */
function fmMemoWinter(){
  const lines=[];
  const pay=payroll(G.roster),proj=warToWins(teamWAR(G.roster));
  const exp=G.roster.filter(p=>p.loc==="mlb"&&p.years<=1&&p.ovr>=76);
  const prospect=G.farm.slice().sort((a,b)=>(b.pot||0)-(a.pot||0))[0];
  if(G.mode!=='survivor'&&G.year<=2)lines.push(`Year ${G.year} of 6. Nobody expects wins yet — they expect <b>a plan</b>.`);
  else if(G.mode!=='survivor'&&G.year>=4)lines.push(`Year ${G.year} of 6. The rebuild is over when you say it is — but the grade is coming.`);
  if(exp.length)lines.push(`${exp.length===1?`<b>${exp[0].name}</b> is`:`<b>${exp.length} veterans</b> are`} on expiring deals — trade value that expires with ${exp.length===1?'it':'them'}.`);
  if(prospect&&prospect.pot>=84)lines.push(`Scouting on <b>${prospect.name}</b> (${prospect.pos}, farm): "ceiling ${prospect.pot} — it looks real."`);
  if(pay>170)lines.push(`Payroll sits at <b>$${pay}M</b> — the luxury tax will cost you wins.`);
  else if(pay<95&&proj<75)lines.push(`Payroll is light ($${pay}M). Losing cheap is a strategy — losing accidentally isn't.`);
  if(G.faSigns!=null&&G.year>=3)lines.push(`Free agency: <b>${Math.max(0,4-(G.faSigns||0))} of 4</b> winter signings left.`);
  return lines.slice(0,3).join('<br>');
}
function fmMemoHTML(from,html){
  if(!html)return '';
  return `<div class="fmemo"><div class="from">${ico('memo',10)} ${from}</div>${html}</div>`;
}

/* ---- solo-open behavior for desk panels ---- */
function fmSolo(el){if(!el.open)return;document.querySelectorAll('details.deskp[open]').forEach(d=>{if(d!==el)d.open=false;});}

/* ============================================================
   SEASON TICKER — narrates the sim result month by month
   ============================================================ */
function fmTickerData(prevWins,madePO){
  const me=(G.standings||[]).find(e=>e.me)||{wins:81,losses:81};
  const W=me.wins,L=me.losses,months=['APRIL','MAY','JUNE','JULY','AUGUST','SEPTEMBER'];
  let rem=W,splits=[];
  for(let i=0;i<6;i++){
    const g=27,left=(5-i)*27;
    let w=i===5?rem:clamp(Math.round(W/162*g+gauss(0,2.4)),Math.max(0,rem-left),Math.min(g,rem));
    splits.push({m:months[i],g,w,l:g-w});rem-=w;
  }
  const hl=[];
  const best=splits.reduce((a,b)=>b.w>a.w?b:a),worst=splits.reduce((a,b)=>b.w<a.w?b:a);
  if(best.w>=17)hl.push([best.m,`A ${ri(7,9)}-game win streak has the town buzzing`]);
  else if(best.w>=15)hl.push([best.m,`${G.teamName} rip off a ${best.w}-win month`]);
  if(worst.w<=9)hl.push([worst.m,`A ${worst.l}-loss month tests the clubhouse`]);
  const rook=G.roster.filter(p=>p.loc==="mlb"&&p.age<=25&&(p.mlbYears||0)<=1).sort((a,b)=>b.ovr-a.ovr)[0];
  if(rook&&rook.ovr>=74&&hl.length<3)hl.push([pick(['MAY','JUNE','JULY']),`Rookie ${rook.name} is turning heads every night`]);
  const ace=G.roster.filter(p=>p.loc==="mlb"&&p.pos==="SP").sort((a,b)=>b.ovr-a.ovr)[0];
  if(ace&&ace.ovr>=88&&hl.length<3)hl.push([pick(['JUNE','AUGUST']),`${ace.name} flirts with a no-hitter into the 8th`]);
  const diff=prevWins!=null?W-prevWins:null;
  let stamp,stampCls;
  if(madePO){stamp='OCTOBER · CLINCHED';stampCls='ok';}
  else if(W>=84){stamp='MISSED BY A HAIR';stampCls='bad';}
  else if(W<=64){stamp='TOP PICK SECURED';stampCls='plan';}
  else{stamp='NO OCTOBER';stampCls='bad';}
  return {W,L,splits,hl,diff,stamp,stampCls};
}
function showSeasonTicker(prevWins,madePO,next){
  let T;try{T=fmTickerData(prevWins,madePO);}catch(e){next();return;}
  const old=document.getElementById('fmtick');if(old)old.remove();
  const ov=document.createElement('div');ov.id='fmtick';ov.className='fmtick';
  ov.innerHTML=`<span class="skip" onclick="fmTickSkip()">SKIP ▸▸</span>
    <div class="tk-club">${esc(G.teamName)} · SEASON ${G.year}</div>
    <div class="tk-mon" id="tkmon">APRIL</div>
    <div class="tk-rec" id="tkrec">0–0</div>
    <div class="tk-pace" id="tkpace">GAME 1 OF 162</div>
    <div class="tk-bars" id="tkbars">${T.splits.map(()=>'<i></i>').join('')}</div>
    <div class="tk-hl" id="tkhl"><small></small><span></span></div>
    <div class="tk-fin" id="tkfin">
      <div class="rec">${T.W}–${T.L}</div>
      ${T.diff!=null?`<div class="tk-pace">${T.diff>=0?'+':''}${T.diff} vs LAST SEASON</div>`:''}
      <div class="tk-stamp ${T.stampCls}">${T.stamp}</div>
      <button class="btn primary" style="margin-top:14px" onclick="fmTickDone()">Continue ▸</button>
    </div>`;
  document.body.appendChild(ov);
  window._fmT={timers:[],next,T,done:false};
  let w=0,l=0;const bars=ov.querySelectorAll('#tkbars i');
  T.splits.forEach((s,i)=>{
    window._fmT.timers.push(setTimeout(()=>{
      const mo=document.getElementById('tkmon');if(!mo)return;
      mo.textContent=s.m;sfx('tap');
      let g=0;const iv=setInterval(()=>{if(g>=s.g){clearInterval(iv);return;}
        if(g<s.w)w++;else l++;g++;
        const r=document.getElementById('tkrec');if(r)r.textContent=w+'–'+l;
        const p=document.getElementById('tkpace');if(p)p.textContent='ON PACE: '+Math.round((w/Math.max(1,w+l))*162)+' WINS';
      },24);
      window._fmT.timers.push(iv);
      bars[i].style.height=Math.max(6,Math.round(s.w/27*52))+'px';
      bars[i].classList.add('show');if(s.l>s.w)bars[i].classList.add('bad');
      const h=T.hl.find(x=>x[0]===s.m);
      if(h){const el=document.getElementById('tkhl');if(el){el.querySelector('small').textContent='THE WIRE · '+s.m;el.querySelector('span').textContent=h[1];el.classList.remove('pop');void el.offsetWidth;el.classList.add('pop');sfx('coin');}}
    },i*1200));
  });
  window._fmT.timers.push(setTimeout(fmTickFinale,6*1200+500));
}
function fmTickFinale(){
  const t=window._fmT;if(!t||t.done)return;t.done=true;
  t.timers.forEach(x=>{clearTimeout(x);clearInterval(x);});
  ['tkmon','tkrec','tkpace','tkbars','tkhl'].forEach(id=>{const e=document.getElementById(id);if(e)e.style.display='none';});
  const f=document.getElementById('tkfin');if(f)f.style.display='flex';
  const T=t.T;sfx(T.stampCls==='ok'?'win':T.stampCls==='plan'?'coin':'lose');hap(T.stampCls==='ok'?[40,60,90]:25);
}
function fmTickSkip(){fmTickFinale();}
function fmTickDone(){const t=window._fmT;const ov=document.getElementById('fmtick');if(ov)ov.remove();window._fmT=null;if(t&&t.next)t.next();}


/* ============================================================
   SEGMENTED SEASON — the season sims in chunks between the real
   break screens; your record at each stop reflects the roster
   you actually had, and mid-season moves change the stretch run.
   ============================================================ */
function fmSeasonInit(){G._season={g:0,w:0,l:0,mw:[0,0,0,0,0,0],mg:[0,0,0,0,0,0],finW:null};}
function fmSegSim(n){
  const pct=clamp(warToWins(teamWAR(G.roster))/162,0.22,0.78);
  return clamp(Math.round(pct*n+gauss(0,Math.sqrt(n)*.42)),Math.round(n*.1),Math.round(n*.9));
}
const FM_MON=['APRIL','MAY','JUNE','JULY','AUGUST','SEPTEMBER'];
function fmMonthOf(g){return Math.min(5,Math.floor(Math.max(0,g-1)/27));}
function fmLiveStandings(){   // my division, approximated current records
  const S=G._season;if(!S||!S.g)return [];
  const rows=[{name:G.teamName,me:true,w:S.w,l:S.l}];
  (G.ai||[]).forEach(t=>{
    if(t.league===G.league&&t.div===G.div){
      const seed=String(t.id||t.name).split('').reduce((a,c)=>a+c.charCodeAt(0),0)+G.year*131;
      const r=bwM32(seed)();
      const pct=clamp(warToWins(t.war)/162+(r-0.5)*0.07,0.2,0.8);
      const w=clamp(Math.round(pct*S.g),0,S.g);
      rows.push({name:t.name,w,l:S.g-w});
    }});
  rows.sort((a,b)=>b.w-a.w);return rows;
}
function fmStandStrip(){
  const rows=fmLiveStandings();if(!rows.length)return '';
  return `<div class="fmstrip" onclick="fmStandFull()" title="Tap for the full picture">${ico('flag',11)} <b>${esc(G.div||'DIVISION')}</b> ${rows.map((r,i)=>`<span class="${r.me?'me':''}">${i+1}. ${esc(String(r.name).split(' ').slice(-1)[0])} <i>${r.w}–${r.l}</i></span>`).join('')}</div>`;
}
function fmStandFull(){
  const old=document.getElementById('fmstand');if(old){old.remove();return;}
  const d=document.createElement('div');d.id='fmstand';d.className='fmtick';
  let inner='';try{inner=`<div class="scroll" style="max-height:60vh">${dlStandings()}</div>`;}catch(e){inner='<p class="muted">Standings unavailable.</p>';}
  d.innerHTML=`<div class="tk-club">LEAGUE PICTURE · PROJECTED</div>
    <div class="panel" style="max-width:560px;width:94%;text-align:left">${inner}</div>
    <button class="btn primary" onclick="document.getElementById('fmstand').remove()">Close ▸</button>`;
  document.body.appendChild(d);
}
function fmSegHeadline(segW,n){
  if(Math.random()<0.45){
    const hot=segW/n>=0.62,cold=segW/n<=0.36;
    if(hot)return `A ${ri(6,9)}-game win streak has the town buzzing`;
    if(cold)return `A ${ri(5,8)}-game skid tests the clubhouse`;
    const rook=G.roster.filter(p=>p.loc==="mlb"&&p.age<=25&&(p.mlbYears||0)<=1).sort((a,b)=>b.ovr-a.ovr)[0];
    if(rook&&rook.ovr>=72&&Math.random()<0.5)return `Rookie ${rook.name} is turning heads every night`;
    const ace=G.roster.filter(p=>p.loc==="mlb"&&p.pos==="SP").sort((a,b)=>b.ovr-a.ovr)[0];
    if(ace&&ace.ovr>=86)return `${ace.name} takes a no-hitter into the 8th`;
  }
  return null;
}
function fmTickShell(){
  let ov=document.getElementById('fmtick');
  if(ov)return ov;
  ov=document.createElement('div');ov.id='fmtick';ov.className='fmtick';
  document.body.appendChild(ov);return ov;
}
function fmSeasonTick(toGame,stop){
  if(!G._season)fmSeasonInit();
  const S=G._season,from=S.g,n=toGame-from;
  if(n<=0)return fmTickStop(toGame,stop);
  const segW=(stop==null&&S.finW!=null)?clamp(S.finW-S.w,0,n):fmSegSim(n);
  // shuffled win/loss sequence for a lifelike count-up
  const seq=[];for(let i=0;i<n;i++)seq.push(i<segW?1:0);
  for(let i=seq.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[seq[i],seq[j]]=[seq[j],seq[i]];}
  const ov=fmTickShell();
  ov.innerHTML=`${fmStandStrip()}
    <div class="tk-club">${esc(G.teamName)} · SEASON ${G.year}</div>
    <div class="tk-mon" id="tkmon">${FM_MON[fmMonthOf(from+1)]}</div>
    <div class="tk-rec" id="tkrec">${S.w}–${S.l}</div>
    <div class="tk-pace" id="tkpace">GAME ${from} OF 162</div>
    <div class="tk-bars" id="tkbars">${S.mw.map((w,i)=>`<i class="${S.mg[i]?'show':''} ${S.mg[i]&&S.mw[i]*2<S.mg[i]?'bad':''}" style="height:${Math.max(6,Math.round(w/27*52))}px"></i>`).join('')}</div>
    <div class="tk-hl" id="tkhl"><small></small><span></span></div>
    <div id="tkstop"></div>`;
  const hl=fmSegHeadline(segW,n);
  const hlAt=from+Math.floor(n*0.55);
  let k=0,g=from,w=S.w,l=S.l;
  if(window._fmTk)clearInterval(window._fmTk);
  window._fmTk=setInterval(()=>{
    if(k>=n){clearInterval(window._fmTk);window._fmTk=null;
      S.g=toGame;S.w=w;S.l=l;try{saveGame();}catch(e){}
      fmTickStop(toGame,stop);return;}
    g++;const mi=fmMonthOf(g);
    if(seq[k])w++;else l++;
    S.mg[mi]++;if(seq[k])S.mw[mi]++;
    k++;
    const r=document.getElementById('tkrec'),p=document.getElementById('tkpace'),mo=document.getElementById('tkmon');
    if(!r){clearInterval(window._fmTk);window._fmTk=null;S.g=toGame;S.w=w;S.l=l;fmTickStop(toGame,stop);return;}
    r.textContent=w+'–'+l;
    p.textContent='GAME '+g+' · ON PACE: '+Math.round(w/Math.max(1,g)*162)+' W';
    if(mo)mo.textContent=FM_MON[mi];
    const bars=document.querySelectorAll('#tkbars i');
    if(bars[mi]){bars[mi].classList.add('show');bars[mi].style.height=Math.max(6,Math.round(S.mw[mi]/27*52))+'px';if(S.mw[mi]*2<S.mg[mi]&&S.mg[mi]>8)bars[mi].classList.add('bad');else bars[mi].classList.remove('bad');}
    if(hl&&g===hlAt){const el=document.getElementById('tkhl');if(el){el.querySelector('small').textContent='THE WIRE · '+FM_MON[mi];el.querySelector('span').textContent=hl;el.classList.remove('pop');void el.offsetWidth;el.classList.add('pop');sfx('coin');}}
  },34);
}
function fmTickStop(atGame,stop){
  const box=document.getElementById('tkstop');
  if(stop==null){return;}   // finale handled by fmSeasonFinale
  window._fmStop=stop;sfx('tap');
  const strip=document.querySelector('#fmtick .fmstrip');if(strip)strip.outerHTML=fmStandStrip();
  if(box)box.innerHTML=`<div class="tk-stopcard">
      <div class="sc-g">GAME ${atGame} OF 162</div>
      <div class="sc-n">${stop.name}</div>
      ${stop.sub?`<div class="sc-s">${stop.sub}</div>`:''}
      <div style="display:flex;gap:8px;justify-content:center;margin-top:14px;flex-wrap:wrap">
        <button class="btn primary" onclick="fmTickEnter()">⏸ ${stop.enterLab||'Make moves'} ▸</button>
        <button class="btn" onclick="fmTickSkipStop()">▶ Keep simming</button>
      </div></div>`;
}
function fmTickEnter(){const s=window._fmStop;fmTickClose();window._fmStop=null;if(s&&s.enter)s.enter();}
function fmTickSkipStop(){const s=window._fmStop;window._fmStop=null;const box=document.getElementById('tkstop');if(box)box.innerHTML='';if(s&&s.skip)s.skip();}
function fmTickClose(){if(window._fmTk){clearInterval(window._fmTk);window._fmTk=null;}const ov=document.getElementById('fmtick');if(ov)ov.remove();}
function fmAllStarDev(){if(G._allStarYear!==G.year){try{computeAllStars();G._asDevNotes=developInSeason(0.45);}catch(e){}G._allStarYear=G.year;saveGame();}}
function fmToAllStar(){fmSeasonTick(81,{name:'ALL-STAR BREAK',sub:'Call-ups, lineup changes — and the half-season development report.',enterLab:'Take the break',
  enter:()=>{G.seasonStage=1.7;saveGame();screenAllStar();},
  skip:()=>{fmAllStarDev();G.seasonStage=1.7;saveGame();afterAllStar();}})}
function fmToDeadline(){fmSeasonTick(110,{name:'TRADE DEADLINE',sub:'Buyers overpay for now; sellers get youth. Last chance to shape this season.',enterLab:'Work the phones',
  enter:()=>{G.seasonStage=1;saveGame();screenDeadline();},
  skip:()=>{_dlMode=false;doSeason();}})}
function fmSeasonFinale(prevWins,madePO,next){
  const S=G._season;
  const doneUI=()=>{
    const ov=fmTickShell();
    const W=S?S.w:(G.standings.find(e=>e.me)||{}).wins,L=162-W;
    const diff=prevWins!=null?W-prevWins:null;
    let stamp,cls;
    if(madePO){stamp='OCTOBER · CLINCHED';cls='ok';}
    else if(W>=84){stamp='MISSED BY A HAIR';cls='bad';}
    else if(W<=64){stamp='TOP PICK SECURED';cls='plan';}
    else{stamp='NO OCTOBER';cls='bad';}
    ov.innerHTML=`${fmStandStrip()}
      <div class="tk-club">${esc(G.teamName)} · FINAL</div>
      <div class="tk-fin" style="display:flex">
        <div class="rec">${W}–${L}</div>
        ${diff!=null?`<div class="tk-pace">${diff>=0?'+':''}${diff} vs LAST SEASON</div>`:''}
        <div class="tk-stamp ${cls}">${stamp}</div>
        <button class="btn primary" style="margin-top:14px" onclick="fmTickClose();(window._fmNext||function(){})()">Continue ▸</button>
      </div>`;
    window._fmNext=next;
    sfx(cls==='ok'?'win':cls==='plan'?'coin':'lose');hap(cls==='ok'?[40,60,90]:25);
  };
  if(S&&S.g<162){
    fmSeasonTick(162,null);
    // watch for the segment to finish, then show the card
    const watch=setInterval(()=>{if(!window._fmTk){clearInterval(watch);doneUI();}},120);
  } else doneUI();
}

/* ============================================================
   CAMP REPORTS — top movers deal out as cards before the table
   ============================================================ */
function showCampReports(devList,next){
  const prog=(devList||[]).filter(e=>e.prog);
  const rest=(devList||[]).filter(e=>!e.prog&&e.d!==0).sort((a,b)=>Math.abs(b.d)-Math.abs(a.d));
  const movers=prog.concat(rest).slice(0,Math.max(5,Math.min(6,prog.length+3)));
  if(movers.length<2){next();return;}
  const old=document.getElementById('fmcamp');if(old)old.remove();
  const ov=document.createElement('div');ov.id='fmcamp';ov.className='fmtick';
  ov.innerHTML=`<div class="tk-club">SPRING CAMP · REPORTS COMING IN</div>
    <div id="fmcampcard" style="min-height:240px;display:flex;align-items:center;justify-content:center"></div>
    <div class="camp-dots" id="fmcampdots"></div>
    <button class="btn primary" id="fmcampbtn" onclick="fmCampNext()">Open the first report ▸</button>
    <button class="btn ghost sm" style="margin-top:8px" onclick="fmCampDone()">Skip to full report</button>`;
  document.body.appendChild(ov);
  window._fmC={list:movers,i:-1,next};
}
function fmCampNext(){
  const c=window._fmC;if(!c)return;c.i++;
  if(c.i>=c.list.length){fmCampDone();return;}
  const e=c.list[c.i],up=e.d>0;
  const stamp=e.prog?(e.progOK===false?'BACKFIRED':e.progOK===true?'PAID OFF':'PROGRAM'):(e.broke||e.d>=5?'BREAKOUT':e.bust?'BUST':e.d<=-5?'DECLINE':null);
  const verdict=e.progNote?e.progNote:e.broke?'The tools clicked. Scouts are done doubting him.':e.bust?'The ceiling was a mirage. It happens.':up?(e.farm?'Turning heads on the back fields.':'Came to camp in the best shape of his life.'):(e.age>=33?'Father Time is undefeated.':'A step back. The staff isn’t worried yet.');
  document.getElementById('fmcampbtn').textContent=c.i===c.list.length-1?'Close camp ▸':'Next report ▸';
  document.getElementById('fmcampdots').innerHTML=c.list.map((_,j)=>`<i class="${j<=c.i?'on':''}"></i>`).join('');
  document.getElementById('fmcampcard').innerHTML=`<div class="ccard">
    ${stamp?`<div class="bstamp ${(stamp==='BREAKOUT'||stamp==='PAID OFF')?'':stamp==='BACKFIRED'||stamp==='BUST'?'gray':'gray'}">${stamp}</div>`:''}
    <div class="ch"><span>${e.prog?esc(e.prog):'CAMP REPORT'}</span><span>${esc(e.pos)}${e.farm?' · FARM':''}</span></div>
    <div class="nm">${esc(e.name)}</div><div class="role">AGE ${e.age}</div>
    <div class="jump"><span class="o">${e.b}</span><span class="a">→</span><span class="n" id="fmcnum">${e.b}</span></div>
    <div class="verdict">${verdict}</div></div>`;
  sfx('flip');if(stamp==='BREAKOUT'){setTimeout(()=>{sfx('rare');hap([20,40,20]);},700);}
  const el=document.getElementById('fmcnum');let v=e.b;
  const iv=setInterval(()=>{if(!document.getElementById('fmcnum')){clearInterval(iv);return;}
    v+=up?1:-1;el.textContent=v;el.style.color=up?'var(--phos)':'var(--red)';if(v===e.a)clearInterval(iv);},110);
}
function fmCampDone(){const c=window._fmC;const ov=document.getElementById('fmcamp');if(ov)ov.remove();window._fmC=null;if(c&&c.next)c.next();}

/* ============================================================
   CLUBHOUSE DECISIONS — 1 per season at the All-Star break
   ============================================================ */
function fmBumpHappy(p,d){if(!p)return;p.happy=clamp((p.happy==null?70:p.happy)+d,5,100);}
function fmChemAll(d,only){const mlb=G.roster.filter(p=>p.loc==='mlb');mlb.forEach(p=>{if(!only||only(p))fmBumpHappy(p,d);});}
function fmFan(d){if(G.mode==='survivor'&&typeof fanChange==='function'){try{fanChange(d,'GM decision');return true;}catch(e){}}return false;}
function fmOctEdge(v){G._octEdge=(G._octEdgeYear===G.year?(G._octEdge||0):0)+v;G._octEdgeYear=G.year;}
/* effect chips: [label, delta|null(text-only), kind] — kind colors the chip */
function fmPickDecision(){
  const mlb=G.roster.filter(p=>p.loc==='mlb');
  const ace=mlb.filter(p=>p.pos==='SP').sort((a,b)=>b.ovr-a.ovr)[0];
  const closer=mlb.filter(p=>p.pos==='RP').sort((a,b)=>b.ovr-a.ovr)[0];
  const vet=mlb.filter(p=>p.age>=33&&p.ovr>=74).sort((a,b)=>b.age-a.age)[0];
  const star=mlb.slice().sort((a,b)=>b.ovr-a.ovr)[0];
  const kid=G.farm.slice().sort((a,b)=>(b.pot||0)-(a.pot||0))[0];
  const young=mlb.filter(p=>p.age<=25);
  const surv=G.mode==='survivor';
  const E=[];
  const ev=(id,t,aLab,aSub,aFx,bLab,bSub,bFx)=>E.push({id,t,a:{lab:aLab,sub:aSub,fx:aFx},b:{lab:bLab,sub:bSub,fx:bFx}});
  if(ace)ev('ace',`<b>${esc(ace.name)} is furious</b> after an early hook in a blowout. The beat writers are circling. Back your manager publicly, or smooth it over with your ace behind closed doors?`,
    'Back the manager','clubhouse discipline',()=>{fmBumpHappy(ace,-9);fmChemAll(2,p=>p!==ace);return {msg:`The room respects it. ${ace.name} stews.`,eff:[['Team chemistry',2],[esc(ace.name)+' morale',-9]]};},
    'Protect the ace','keep him happy',()=>{fmBumpHappy(ace,8);fmChemAll(-1,p=>p!==ace);return {msg:`${ace.name} cools off. A few vets grumble about a double standard.`,eff:[[esc(ace.name)+' morale',8],['Team chemistry',-1]]};});
  if(kid&&kid.pot>=80)ev('kid',`<b>${esc(kid.name)}</b> (your top prospect) is tearing up the minors and his agent wants a September promise. Promise the call-up, or preach patience?`,
    'Promise September','he plays with house money',()=>{kid.pot=clamp((kid.pot||70)+1,40,99);fmBumpHappy(kid,10);return {msg:`${kid.name} relaxes and rakes.`,eff:[[esc(kid.name)+' ceiling',1],[esc(kid.name)+' morale',10]]};},
    'Preach patience','no promises',()=>{fmBumpHappy(kid,-8);return {msg:`${kid.name} presses for a week, then settles.`,eff:[[esc(kid.name)+' morale',-8]]};});
  if(vet)ev('vet',`<b>${esc(vet.name)}</b> (age ${vet.age}) asks to mentor the young guys instead of chasing at-bats. Give him the role?`,
    'Give him the role','team-first move',()=>{fmChemAll(4,p=>p.age<=25);fmBumpHappy(vet,6);return {msg:'The kids gravitate to him.',eff:[['Young players morale',4],[esc(vet.name)+' morale',6]]};},
    'He plays to earn it','no free roles',()=>{fmBumpHappy(vet,-6);return {msg:`${vet.name} nods and grinds.`,eff:[[esc(vet.name)+' morale',-6]]};});
  ev('little',`The club can host a <b>Little League day</b> — kids on the field, autographs, the works. The vets would rather have the off-day.`,
    'Host it','the town remembers',()=>{const f=fmFan(6);fmChemAll(1);return {msg:'The photos run for a week.',eff:f?[['Fan favor',6],['Team chemistry',1]]:[['Team chemistry',1],['The town remembers',null]]};},
    'Rest the vets','162 is long',()=>{fmChemAll(3,p=>p.age>=30);const f=fmFan(-2);return {msg:'Fresh legs in August. Talk radio grumbles.',eff:f?[['Veteran morale',3],['Fan favor',-2]]:[['Veteran morale',3]]};});
  if(closer)ev('closer',`<b>${esc(closer.name)}</b> has thrown 4 days straight and says he's fine. The trainers disagree. Ride your closer, or shut him down for a week?`,
    'Shut him down','trust the trainers',()=>{fmBumpHappy(closer,-4);fmOctEdge(0.02);return {msg:'He sulks — but his arm is live in September.',eff:[['October edge','+2%'],[esc(closer.name)+' morale',-4]]};},
    'Ride him','saves win jobs',()=>{fmBumpHappy(closer,6);fmChemAll(-1,p=>p.pos==='RP'&&p!==closer);return {msg:'He keeps slamming doors. The rest of the pen carries the load.',eff:[[esc(closer.name)+' morale',6],['Bullpen morale',-1]]};});
  ev('analytics',`The analytics department wants to fund a <b>biometric sleep program</b>. The old-school coaches call it "pillow science."`,
    'Fund it','the future is rest',()=>{fmChemAll(2,p=>p.age<=27);fmOctEdge(0.02);return {msg:'The young guys buy in. Fewer dead legs in October.',eff:[['October edge','+2%'],['Young players morale',2]]};},
    'Pass','spend it on fungoes',()=>{fmChemAll(2,p=>p.age>=32);return {msg:'The vets appreciate the old ways.',eff:[['Veteran morale',2]]};});
  if(star)ev('doc',`A streaming crew wants <b>all-access clubhouse footage</b> for a documentary. Great for the brand — annoying for the players.`,
    'Let them in','free marketing',()=>{const f=fmFan(5);fmChemAll(-2,p=>p.age>=30);return {msg:'The trailer alone trends for a day.',eff:f?[['Fan favor',5],['Veteran morale',-2]]:[['The brand grows',null],['Veteran morale',-2]]};},
    'Close the doors','sanctuary first',()=>{fmChemAll(2);return {msg:'The room stays a room.',eff:[['Team chemistry',2]]};});
  if(star)ev('rumor',`A trade rumor about <b>${esc(star.name)}</b> is everywhere. He hasn't said anything. Yet.`,
    'Kill it publicly','"he\'s not going anywhere"',()=>{fmBumpHappy(star,7);return {msg:`${star.name} posts a flexed-arm emoji. Crisis over.`,eff:[[esc(star.name)+' morale',7]]};},
    'Stay quiet','never negotiate with rumors',()=>{fmBumpHappy(star,-6);return {msg:'The silence gets read as a yes. He hears it.',eff:[[esc(star.name)+' morale',-6]]};});
  ev('prank',`A rookie hazing prank (mascot costume, karaoke, the whole thing) has gone <b>viral</b>. HR is asking questions; the fans think it's hilarious.`,
    'Laugh it off','boys will be boys',()=>{const f=fmFan(4);fmChemAll(2,p=>p.age<=25);return {msg:'The karaoke clip hits a million views.',eff:f?[['Fan favor',4],['Young players morale',2]]:[['Young players morale',2]]};},
    'Shut it down','professionalism',()=>{fmChemAll(-2,p=>p.age<=25);fmOctEdge(0.01);return {msg:'The room tightens up. Slightly too much.',eff:[['October edge','+1%'],['Young players morale',-2]]};});
  if(young.length>=2)ev('swing',`Your new swing coach and the old hitting coach are <b>openly feuding</b> about launch angles. Pick a lane.`,
    'Back the new school','data wins',()=>{const yp=pick(young);if(yp){yp.pot=clamp((yp.pot||70)+1,40,99);fmBumpHappy(yp,5);}fmChemAll(-2,p=>p.age>=33);return {msg:`${yp?yp.name:'A young hitter'}'s exit velo jumps within weeks.`,eff:[[yp?esc(yp.name)+' ceiling':'A young ceiling',1],['Veteran morale',-2]]};},
    'Back the old school','feel beats data',()=>{fmChemAll(3,p=>p.age>=33);return {msg:'The cage goes back to feel and film.',eff:[['Veteran morale',3]]};});
  ev('travel',`The players' committee asks for a <b>charter upgrade</b> — better sleep on the road, worse for the budget.`,
    'Approve it','rest is a weapon',()=>{fmChemAll(3);fmOctEdge(0.01);return {msg:'Nobody naps in the clubhouse anymore.',eff:[['Team chemistry',3],['October edge','+1%']]};},
    'Deny it','fly commercial, kids',()=>{fmChemAll(-2);return {msg:'Someone leaks the email. Not a great look.',eff:[['Team chemistry',-2]]};});
  ev('charity',`Your equipment manager suggests auctioning <b>game-worn jerseys</b> for the children's hospital. The club usually keeps memorabilia revenue.`,
    'Auction everything','it all goes',()=>{const f=fmFan(5);fmChemAll(2);return {msg:'The auction triples its goal.',eff:f?[['Fan favor',5],['Team chemistry',2]]:[['Team chemistry',2],['The town notices',null]]};},
    'Keep the revenue','business is business',()=>{return {msg:'The books look better. The story writes itself anyway.',eff:[['Nothing changes',null]]};});
  // avoid repeats until the pool is exhausted
  G._decSeen=G._decSeen||[];
  let pool=E.filter(e=>G._decSeen.indexOf(e.id)<0);
  if(!pool.length){G._decSeen=[];pool=E;}
  const chosen=pick(pool);
  G._decSeen.push(chosen.id);
  return chosen;
}
function showDecision(next){
  let ev;try{ev=fmPickDecision();}catch(e){next();return;}
  if(!ev){next();return;}
  const old=document.getElementById('fmdec');if(old)old.remove();
  const ov=document.createElement('div');ov.id='fmdec';ov.className='fmtick';
  window._fmD={ev,next};
  ov.innerHTML=`<div class="tk-club">${ico('siren',12)} CLUBHOUSE · MID-SEASON DECISION</div>
    <div class="decbox">
      <p>${ev.t}</p>
      <div class="opts">
        <button class="btn" onclick="fmDecide('a')">${ev.a.lab}<small>${ev.a.sub}</small></button>
        <button class="btn" onclick="fmDecide('b')">${ev.b.lab}<small>${ev.b.sub}</small></button>
      </div>
      <div class="decout" id="fmdecout"></div>
    </div>`;
  document.body.appendChild(ov);
}
function fmDecide(k){
  const d=window._fmD;if(!d)return;
  let r={msg:'',eff:[]};try{r=d.ev[k].fx()||r;saveGame();}catch(e){}
  const chips=(r.eff||[]).map(([lab,v])=>{
    if(v==null)return `<span class="pill" style="margin:2px">${lab}</span>`;
    const num=typeof v==='number';
    const good=num?v>=0:String(v).indexOf('-')!==0;
    return `<span class="pill ${good?'green':'red'}" style="margin:2px">${lab} ${num?(v>=0?'+':'')+v:v}</span>`;
  }).join('');
  const out=document.getElementById('fmdecout');
  if(out){out.innerHTML=`<div class="small" style="margin-top:12px;color:var(--dim)">${r.msg||''}</div>
    <div style="margin-top:10px;display:flex;flex-wrap:wrap;justify-content:center;gap:2px">${chips}</div>
    <button class="btn primary" style="margin-top:12px" onclick="fmDecideDone()">Back to the season ▸</button>`;}
  document.querySelectorAll('#fmdec .opts .btn').forEach(b=>b.disabled=true);
  sfx('coin');
}
function fmDecideDone(){const d=window._fmD;const ov=document.getElementById('fmdec');if(ov)ov.remove();window._fmD=null;if(d&&d.next)d.next();}

/* ============================================================
   OCTOBER WAR ROOM — interactive playoffs. Coaching allocation
   = advance-scouting intel on each opponent + dugout tokens.
   The bracket result is scripted here, then the official engine
   replays it verbatim (G._octScript) so records/rewards flow
   through the exact same code as always.
   ============================================================ */
function coachPct(){const r=G.resources||{};return Math.round(((r.coaching!=null?r.coaching:0.333))*100);}
function coachTier(){const c=coachPct();return c<10?0:c<30?1:c<50?2:c<75?3:4;}
const OCT_TENDS=[
 {k:'power',lab:'a power-heavy lineup',counter:'pitch'},
 {k:'speed',lab:'a contact-and-speed offense',counter:'defense'},
 {k:'arms',lab:'an elite pitching staff',counter:'grind'},
 {k:'pen',lab:'a shutdown bullpen',counter:'early'},
 {k:'patient',lab:'a grinding, patient lineup',counter:'zone'},
 {k:'launch',lab:'a homer-or-bust launch-angle crew',counter:'low'}];
const OCT_PLANS=[
 {k:'pitch',lab:'Pitch backwards',sub:'soft stuff away — starve the power'},
 {k:'defense',lab:'Lock down the run game',sub:'infield tight, quick slide steps'},
 {k:'grind',lab:'Grind every at-bat',sub:'run the pitch counts, get into their pen'},
 {k:'early',lab:'Ambush the starters',sub:'jump early counts before the pen slams the door'},
 {k:'zone',lab:'Pound the zone',sub:'strike one, quick outs — no free passes to grinders'},
 {k:'low',lab:'Keep the ball down',sub:'sinkers at the knees — kill the launch angle'}];
const OCT_ROUNDS={wc:{name:'WILD CARD',need:2},ds:{name:'DIVISION SERIES',need:3},cs:{name:'CHAMPIONSHIP SERIES',need:4},ws:{name:'WORLD SERIES',need:4}};
function fmOctoberRun(next){
  const po=G._po||{};const entries=po.entries||G.standings;
  const me=entries.find(e=>e.me);
  if(!me||!me.playoff){next();return;}
  me.war=teamWAR(G.roster);   // same refresh the engine will do
  const field=mlbPlayoffField(entries);
  const cb=1+(((G.resources?G.resources.coaching:0.333)-0.333)*0.32);
  const dm=1+(teamDawg()-50)/50*0.10;
  const chem=1+(teamChem()-60)/40*0.08;
  const edge=(G._octEdgeYear===G.year)?(G._octEdge||0):0;
  const paOf=(a,b)=>{const sa=(a.war+22)*(a.me?cb*dm*chem:1),sb=(b.war+22)*(b.me?cb*dm*chem:1);
    let pa=clamp(sa/(sa+sb),0.30,0.68);
    if(a.me)pa=clamp(pa+edge,0.25,0.75);else if(b.me)pa=clamp(pa-edge,0.25,0.75);
    return pa;};
  const t=coachTier();
  const O={next,script:[],queue:[],tokens:[0,1,1,2,3][t],tier:t,alive:true,paOf,
    auto(a,b){if(!a)return b;if(!b)return a;const w=Math.random()<paOf(a,b)?a:b;O.script.push(w===a);return w;}};
  // build the series schedule in EXACTLY the engine's order; user series become interactive stops
  field.forEach(({league,teams})=>{
    const s={};teams.forEach(x=>s[x.lgSeed]=x);
    O.queue.push({lg:league,st:'wcA',get:()=>[s[3],s[6]],rk:'wc'});
    O.queue.push({lg:league,st:'wcB',get:()=>[s[4],s[5]],rk:'wc'});
  });
  window._fmO=O;O.field=field;O.stage=0;
  fmOctNext();
}
function fmOctNext(){
  const O=window._fmO;if(!O)return;
  // stage 0: wild cards per league; stage 1: DS; stage 2: LCS; stage 3: WS; then done
  if(!O._built){O._built={};O._winners={};}
  const F=O.field;
  const stages=[
    ()=>{ // wild cards
      F.forEach(f=>{const s={};f.teams.forEach(x=>s[x.lgSeed]=x);O._built[f.league]={s};});
      O._pend=[];
      F.forEach(f=>{const s=O._built[f.league].s;
        O._pend.push({a:s[3],b:s[6],rk:'wc',lg:f.league,key:'wcA'});
        O._pend.push({a:s[4],b:s[5],rk:'wc',lg:f.league,key:'wcB'});});
    },
    ()=>{ // division series
      O._pend=[];
      F.forEach(f=>{const B=O._built[f.league];const s=B.s;
        const wcW=[B.wcA,B.wcB].sort((a,b)=>a.lgSeed-b.lgSeed);
        O._pend.push({a:s[1],b:wcW[wcW.length-1],rk:'ds',lg:f.league,key:'dsA'});
        O._pend.push({a:s[2],b:wcW[0],rk:'ds',lg:f.league,key:'dsB'});});
    },
    ()=>{ // league championships
      O._pend=[];
      F.forEach(f=>{const B=O._built[f.league];
        O._pend.push({a:B.dsA,b:B.dsB,rk:'cs',lg:f.league,key:'cs'});});
    },
    ()=>{ // world series
      const al=O._built[F[0].league].cs,nl=O._built[F[1]?F[1].league:F[0].league].cs;
      O._pend=[{a:al,b:nl,rk:'ws',lg:'WS',key:'ws'}];
    }];
  while(true){
    if(!O._pend||!O._pend.length){
      if(O.stage>=stages.length){ // bracket complete
        window._fmO=null;G._octScript=O.script;const n=O.next;fmOctClose();n();return;}
      stages[O.stage]();O.stage++;
    }
    const m=O._pend.shift();
    const a=m.a,b=m.b;
    if(!a||!b){const w=a||b;O._built[m.lg]=O._built[m.lg]||{};O._built[m.lg][m.key]=w;continue;}
    const userIn=(a.me||b.me);
    if(!userIn){const w=Math.random()<O.paOf(a,b)?a:b;O.script.push(w===a);O._built[m.lg]=O._built[m.lg]||{};O._built[m.lg][m.key]=w;continue;}
    // interactive series
    O._cur=m;fmOctSeries(m);return;
  }
}
function fmOctSeries(m){
  const O=window._fmO,me=(m.a.me?m.a:m.b),opp=(m.a.me?m.b:m.a);
  const R=OCT_ROUNDS[m.rk];
  const tend=pick(OCT_TENDS);
  // 3 plans on the table: the true counter + 2 decoys, shuffled
  const decoys=shuffle(OCT_PLANS.filter(p=>p.k!==tend.counter)).slice(0,2);
  const shown=shuffle([OCT_PLANS.find(p=>p.k===tend.counter)].concat(decoys));
  const shownTends=shown.map(p=>OCT_TENDS.find(x=>x.counter===p.k));
  O._series={m,me,opp,R,tend,shown,plan:null,delta:0,gw:0,gl:0,boost:0,over:false};
  const t=O.tier;
  let intel;
  if(t>=4)intel=`Advance scouts are certain: they're <b>${tend.lab}</b>.`;
  else if(t===3){const truthy=Math.random()<0.8;const st=truthy?tend:pick(shownTends.filter(x=>x.k!==tend.k));intel=`Scouts are fairly confident (not certain): they look like <b>${st.lab}</b>.`;}
  else if(t===2){const ruled=pick(shownTends.filter(x=>x.k!==tend.k));intel=`Scouts rule one thing out: they are <b>not</b> ${ruled.lab}.`;O._series.ruled=ruled.counter;}
  else if(t===1){const truthy=Math.random()<0.55;const st=truthy?tend:pick(shownTends.filter(x=>x.k!==tend.k));intel=`A thin report — one scout <i>thinks</i> they're ${st.lab}.`;}
  else intel='No advance scouting budget. You are flying blind.';
  const ov=fmTickShell();
  ov.innerHTML=`<div class="tk-club">${ico('trophy',12)} OCTOBER · ${R.name}</div>
    <div class="oct-vs"><span class="you">${esc(G.teamName)}</span><i>VS</i><span>${esc(opp.name)} · ${opp.wins}W</span></div>
    <div class="fmemo" style="max-width:440px;text-align:left"><div class="from">${ico('binoc',10)} ADVANCE SCOUTING · COACHING AT ${coachPct()}%</div>${intel}</div>
    <div class="tk-pace" style="margin-top:2px">PICK THE SERIES GAME PLAN</div>
    <div class="oct-plans">${shown.map(p=>`<button class="btn oct-plan ${O._series.ruled===p.k?'ruled':''}" onclick="fmOctPlan('${p.k}')"><b>${p.lab}</b><small>${p.sub}</small></button>`).join('')}</div>
    <div id="octgames"></div>`;
  sfx('tap');
}
function fmOctPlan(k){
  const O=window._fmO,S=O._series;if(!S||S.plan)return;
  S.plan=k;
  S.delta=(k===S.tend.counter)?0.08:-0.03;
  document.querySelectorAll('.oct-plan').forEach(b=>b.disabled=true);
  const right=k===S.tend.counter;
  const pa=clamp(O.paOf(S.m.a,S.m.b)+((S.m.a.me?1:-1)*S.delta),0.25,0.75);
  S.pa=pa;
  const box=document.getElementById('octgames');
  if(box)box.innerHTML=`<div class="small" style="color:${right?'var(--green)':'var(--red)'};margin:8px 0">${right?'✔ The plan fits — they were '+S.tend.lab+'.':'✘ Bad read — they were '+S.tend.lab+'.'}</div>
    <div class="oct-score"><span id="octw">0</span><i>–</i><span id="octl">0</span></div>
    <div class="tk-pace">FIRST TO ${S.R.need}</div>
    <div class="oct-chips" id="octchips"></div>
    <div id="octact" style="margin-top:10px"></div>`;
  sfx(right?'coin':'lose');
  setTimeout(fmOctGame,900);
}
function fmOctGame(){
  const O=window._fmO,S=O&&O._series;if(!S||S.over)return;
  const meIsA=S.m.a.me;
  let pg=clamp(0.5+(S.pa-0.5)*0.85,0.22,0.8);
  if(!meIsA)pg=1-pg;   // pg = MY per-game win chance
  if(S.boost){pg=clamp(pg+0.15,0.05,0.92);S.boost=0;}
  const win=Math.random()<pg;
  if(win)S.gw++;else S.gl++;
  const chips=document.getElementById('octchips');
  if(chips)chips.innerHTML+=`<span class="oc ${win?'w':'l'}">${win?'W':'L'}</span>`;
  const w=document.getElementById('octw'),l=document.getElementById('octl');
  if(w)w.textContent=S.gw;if(l)l.textContent=S.gl;
  sfx(win?'single':'out');hap(win?12:8);
  const act=document.getElementById('octact');
  if(S.gw>=S.R.need||S.gl>=S.R.need){S.over=true;const won=S.gw>=S.R.need;
    if(act)act.innerHTML=`<div class="tk-stamp ${won?'ok':'bad'}" style="margin:8px auto 0;display:inline-block">${won?(S.m.rk==='ws'?'WORLD CHAMPIONS':'SERIES WON')+' '+S.gw+'–'+S.gl:'ELIMINATED '+S.gl+'–'+S.gw}</div>
      <div style="margin-top:14px"><button class="btn primary" onclick="fmOctSeriesDone(${won?'true':'false'})">${won?(S.m.rk==='ws'?'Raise the trophy ▸':'Next round ▸'):'Face the winter ▸'}</button></div>`;
    sfx(won?(S.m.rk==='ws'?'win':'levelup'):'lose');hap(won?[40,60,90]:30);
    return;
  }
  if(act){
    const behind=S.gl>S.gw;
    act.innerHTML=`${behind&&O.tokens>0?`<button class="btn" onclick="fmOctToken()">${ico('rank',13)} Fire up the dugout <small style="color:var(--dim)">+15% next game · ${O.tokens} left</small></button> `:''}
      <button class="btn primary sm" onclick="fmOctGame()">Play Game ${S.gw+S.gl+1} ▸</button>`;
  }
}
function fmOctToken(){
  const O=window._fmO,S=O&&O._series;if(!S||!O.tokens)return;
  O.tokens--;S.boost=1;sfx('coin');hap(20);
  toast('The dugout is on its feet — momentum next game.');
  fmOctGame();
}
function fmOctSeriesDone(won){
  const O=window._fmO,S=O._series;
  const aWon=S.m.a.me?won:!won;
  O.script.push(aWon);
  O._built[S.m.lg]=O._built[S.m.lg]||{};O._built[S.m.lg][S.m.key]=aWon?S.m.a:S.m.b;
  O._series=null;
  fmOctNext();
}
function fmOctClose(){const ov=document.getElementById('fmtick');if(ov)ov.remove();}

/* ============================================================
   WINTER PROGRAM — development allocation buys focus slots.
   Safe reps or a risky overhaul; results land in camp reports.
   ============================================================ */
function devPct(){const r=G.resources||{};return Math.round(((r.development!=null?r.development:0.333))*100);}
function devTier(){const d=devPct();return d<10?0:d<30?1:d<50?2:d<75?3:4;}
function wpSlots(){return [1,2,2,3,4][devTier()];}
function wpCandidates(){
  const pool=G.roster.filter(p=>p.loc==='mlb'&&p.age<=27).concat(G.farm||[]);
  return pool.filter(p=>(p.realCeil||p.pot||p.ovr)>p.ovr).sort((a,b)=>(b.pot||0)-(a.pot||0)).slice(0,8);
}
function wpProgName(p,mode){
  const pit=isPit(p);
  return mode==='over'?(pit?'PITCH LAB OVERHAUL':'SWING REBUILD'):(pit?'VELO CAMP':'POWER LAB');
}
let _wp=null;
function showWinterProgram(next){
  const cands=wpCandidates();
  if(!cands.length){next();return;}
  _wp={next,picks:{},slots:wpSlots()};
  const ov=fmTickShell();
  const row=p=>`<div class="wp-row" id="wp_${p.id}">
      <div class="wp-info"><b>${esc(p.name)}</b><span class="small muted"> ${esc(p.pos)} · ${p.age} · ${p.ovr} OVR · ceil ${p.pot}${p.loc==='farm'?' · farm':''}</span></div>
      <div class="wp-btns">
        <button class="btn sm" onclick="wpSet('${p.id}','reps')">Reps</button>
        <button class="btn sm" onclick="wpSet('${p.id}','over')">Overhaul</button>
      </div></div>`;
  ov.innerHTML=`<div class="tk-club">${ico('wrench',12)} WINTER PROGRAM · DEVELOPMENT AT ${devPct()}%</div>
    <div class="fmemo" style="max-width:470px;text-align:left"><div class="from">PLAYER DEVELOPMENT DEPT</div>
      You can fund <b>${_wp.slots} focus slot${_wp.slots>1?'s':''}</b> this winter.
      <b>Reps</b> = a safe, guaranteed step forward. <b>Overhaul</b> = swing-for-the-fences: a real chance at a leap, a real chance it backfires.</div>
    <div class="wp-list" style="max-width:470px;width:94%">${cands.map(row).join('')}</div>
    <div class="tk-pace" style="margin-top:8px"><span id="wpleft">${_wp.slots}</span> SLOT(S) LEFT</div>
    <div style="margin-top:10px"><button class="btn primary" onclick="wpRun()">Run the winter program ▸</button>
    <button class="btn ghost sm" onclick="wpRun()">Skip</button></div>`;
}
function wpSet(pid,mode){
  if(!_wp)return;
  const cur=_wp.picks[pid];
  const used=Object.keys(_wp.picks).length;
  if(cur===mode){delete _wp.picks[pid];}
  else if(cur){_wp.picks[pid]=mode;}
  else{if(used>=_wp.slots){toast('No slots left — tap a selected player to free one.');return;}_wp.picks[pid]=mode;}
  const rowEl=document.getElementById('wp_'+pid);
  if(rowEl){rowEl.querySelectorAll('.btn').forEach(b=>b.classList.remove('primary'));
    if(_wp.picks[pid])rowEl.querySelector(_wp.picks[pid]==='reps'?'.btn:first-child':'.btn:last-child').classList.add('primary');}
  const lf=document.getElementById('wpleft');if(lf)lf.textContent=_wp.slots-Object.keys(_wp.picks).length;
  sfx('tap');
}
function wpRun(){
  const w=_wp;_wp=null;
  G._winterFocus=w?w.picks:{};saveGame();
  const ov=document.getElementById('fmtick');if(ov)ov.remove();
  if(w&&w.next)w.next();
}
function wpApply(res){   // post-process development with the funded programs
  const picks=G._winterFocus||{};G._winterFocus=null;
  const t=devTier();
  Object.keys(picks).forEach(pid=>{
    const p=G.roster.find(x=>x.id===pid)||(G.farm||[]).find(x=>x.id===pid);
    if(!p)return;
    const mode=picks[pid],before=p.ovr;
    const cap=Math.max(p.ovr,p.realCeil||p.pot||p.ovr);
    let note='';
    let ok=null;
    if(mode==='reps'){const g=ri(1,2);p.ovr=clamp(p.ovr+g,20,cap);ok=p.ovr>before?true:null;note=p.ovr>before?'Winter reps paid off — a clean step forward.':'Worked all winter — already at his ceiling.';}
    else{
      const odds=0.40+t*0.06;
      if(Math.random()<odds){const g=ri(3,5);p.ovr=clamp(p.ovr+g,20,cap);ok=true;
        if(Math.random()<0.25&&p.pot<99){p.pot=clamp(p.pot+1,40,99);}
        note=p.ovr>before?'THE OVERHAUL WORKED. He looks like a different player.':'Rebuilt everything — the ceiling was the limit.';}
      else{const g=ri(1,2);p.ovr=clamp(p.ovr-g,20,99);ok=false;note='The overhaul backfired — he lost his feel and has to find it again.';}
    }
    const d=p.ovr-before;
    const dl=(res.devList=res.devList||[]);
    const ex=dl.find(e=>e.name===p.name);
    const prog=wpProgName(p,mode);
    if(ex){ex.a=p.ovr;ex.d=(ex.d||0)+d;ex.prog=prog;ex.progNote=note;ex.progOK=ok;}
    else dl.push({name:p.name,pos:p.pos,b:before,a:p.ovr,d,age:p.age,farm:p.loc==='farm',prog,progNote:note,progOK:ok});
  });
  saveProfile&&0;saveGame();
  return res;
}
