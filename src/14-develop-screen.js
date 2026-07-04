/* ============================================================
   PHASE 4 — DEVELOP / AGE
   ============================================================ */
let _devRes=null;
function screenDevelop(){
  if(G._devDoneYear===G.year){_devRes=_devRes||{fa:G.leftAsFA||[],notes:[],devList:[],cuts:[],retired:[]};return renderDevelopSummary();}   // reload-safe: don't age twice
  const res=developAll();G._devDoneYear=G.year;saveGame();_devRes=res;
  if((res.retired||[]).length)return screenRetirements();
  renderDevelopSummary();
}
function screenRetirements(){
  const ret=(_devRes&&_devRes.retired||[]).slice().sort((a,b)=>(b._teamYears||0)-(a._teamYears||0));
  const card=p=>{const hof=p._hof,lhof=p._leagueHof,yrs=p._teamYears||0,aw=(p._awards||[]).length;
    return `<div class="panel2 ${lhof?'hofgold':''}" style="${lhof?'':'border:1px solid '+(hof?'var(--gold)':'var(--line)')+';'}border-radius:10px;padding:11px;margin-bottom:8px">
      <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap"><span class="pos">${p.pos}</span><b>${p.name}</b>
        <span class="small muted">retired at ${p.age} · ${ovrHTML(p.ovr)} now · peak ${p._peak||p.ovr}</span>${lhof?' <span class="pill gold">👑 LEAGUE HALL OF FAME</span>':hof?' <span class="pill gold">🏛️ TEAM HALL OF FAME</span>':''}</div>
      <div class="small muted" style="margin-top:4px">${yrs} season${yrs===1?'':'s'} with the club${(p._rings||0)?` · ${p._rings}× champion 🏆`:''}${aw?` · ${aw} award${aw>1?'s':''} 🏅`:''}${(p.dura||70)>=85?' · an iron man to the end 💪':(p.dura||70)<=45&&p.age<37?' · his body gave out early 🩹':''}</div>
      ${lhof?`<div class="small" style="color:var(--gold);margin-top:5px">👑 Elected to the League Hall of Fame with ${p._leagueHofVote}% of the vote${p._leagueHofPts?` — <b>+${p._leagueHofPts} franchise points</b> for a franchise legend`:''}.</div>`:''}
    </div>`;};
  render(`${header()}
    <div class="panel center" style="border-color:var(--gold)">
      <div class="pill gold">🎗️ RETIREMENTS · After Season ${G.year}</div>
      <h2 style="margin:6px 0">${ret.length} player${ret.length>1?'s hang':' hangs'} 'em up</h2>
      <p class="sub">Take a moment for the careers that ended this winter.</p></div>
    ${ret.map(card).join("")}
    <div class="center"><button class="btn primary" onclick="renderDevelopSummary()">Continue to the offseason →</button></div>`);
}
function renderDevelopSummary(){
  const res=_devRes||{fa:[],notes:[],devList:[],cuts:[],retired:[]};
  const cuts=(res.cuts||[]).filter(Boolean);
  const dl=(res.devList||[]).slice().sort((a,b)=>b.d-a.d);
  const risers=dl.filter(e=>e.d>0).length,fallers=dl.filter(e=>e.d<0).length;
  const clubhouse=(res.notes||[]).filter(Boolean);   // trade requests & morale beats live here now
  render(`${header()}${stepbar(4)}
   <div class="panel"><h3>📋 Offseason Development${infoDot('How your players changed over the winter — prospects develop, vets age, and a few have a story behind the move. Sorted from biggest gain to biggest decline.')}</h3>
     <p class="small muted" style="margin:2px 0 10px">${dl.length?`<span style="color:var(--green)">▲ ${risers} improved</span> · <span style="color:var(--red)">▼ ${fallers} declined</span>`:'A quiet winter across the org.'}</p>
     ${dl.length?dl.map(devLineHTML).join(""):'<p class="muted">No notable changes this offseason.</p>'}
     ${cuts.length?`<div class="sectlbl" style="margin-top:12px">🧹 Roster moves <span class="small muted">— trimming to the 20-man / 50-man limits</span></div>${cuts.slice(0,10).map(n=>`<div class="small" style="margin:3px 0">${n}</div>`).join("")}`:''}
     ${clubhouse.length?`<div class="sectlbl" style="margin-top:12px">🗣️ Clubhouse</div>${clubhouse.slice(0,8).map(n=>`<div class="small" style="margin:3px 0">• ${n}</div>`).join("")}`:''}
     ${res.fa.length?`<div class="sectlbl" style="margin-top:12px">🚶 Walked in free agency</div><p class="small" style="color:var(--dim);margin:3px 0 0">${res.fa.map(p=>p.name).join(", ")}</p>`:''}
     ${res.retired.length?`<p class="small muted" style="margin-top:10px">🎗️ ${res.retired.length} retired this winter — see the ceremony above${G.hof&&G.hof.length?'; check 📜 Franchise for the Hall of Fame':''}.</p>`:''}</div>
   <div class="center"><button class="btn primary" onclick="nextYear()">Begin Year ${G.year+1} →</button></div>`);
}
function doRenameTeam(){
  const inp=document.getElementById('rnm');if(!inp)return;
  const nm=(inp.value||'').trim().slice(0,24);if(!nm){toast('Enter a team name');return;}
  G.teamName=nm;if(G.owner)G.owner.team=nm;
  saveGame();toast(`Renamed to ${nm}`);
  // refresh the screen behind the overlay so the header updates, then reopen the franchise panel
  const ov=document.getElementById('saveov');if(ov)ov.remove();
  if(G.owner&&G.ownerStage==='office')ownerOffice();
  else if(typeof screenSeason==="function"&&G.phase===2&&_res)showResult();
  openFranchise();
}
function openFranchise(){
  const h=G.history||[];const seasons=h.length;
  const totalWins=h.reduce((s,x)=>s+(x.wins||0),0);
  const stat=(lbl,val)=>`<div style="background:var(--panel2);border-radius:8px;padding:9px 6px;text-align:center"><div style="font-size:19px;font-weight:800;color:var(--gold)">${val}</div><div class="small muted" style="font-size:10px">${lbl}</div></div>`;
  const hof=(G.hof||[]).slice().sort((a,b)=>(b.leagueHof?1:0)-(a.leagueHof?1:0)||b.score-a.score);
  const hofCard=e=>{const aw=(e.awards||[]),lg=e.leagueHof;
    return `<div class="panel2 ${lg?'hofgold':''}" style="${lg?'':'border:1px solid var(--green);'}border-radius:10px;padding:10px;margin-bottom:7px">
      <div style="display:flex;align-items:center;gap:7px;flex-wrap:wrap"><span class="pos">${e.pos}</span><b>${e.name}</b>${lg?' <span class="pill gold" style="padding:0 5px;font-size:9px">👑 LEAGUE HOF</span>':''}${e.homegrown?' <span class="pill gold" style="padding:0 5px;font-size:9px">HOMEGROWN</span>':''}${e.fanFav?' ⭐':''}</div>
      <div class="small muted" style="margin-top:3px">Years ${e.join}–${e.leave} · ${e.years} seasons · peak ${e.peak} OVR${e.rings?` · ${e.rings}× 🏆`:''}${e.allStars?` · ${e.allStars}× ⭐ All-Star`:''}${lg&&e.leagueVote?` · 👑 ${e.leagueVote}% vote`:''}</div>
      ${aw.length?`<div class="small" style="color:var(--gold);margin-top:2px">🏅 ${aw.map(a=>a.name+" ('"+String(a.year).padStart(2,'0')+")").join(", ")}</div>`:''}</div>`;};
  const lhof=(G.leagueHof||[]).slice().sort((a,b)=>b.inYear-a.inYear);
  const lCard=e=>`<div class="panel2 ${e.mine?'hofgold':''}" style="${e.mine?'':'border:1px solid var(--line);'}border-radius:10px;padding:9px;margin-bottom:6px">
      <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap"><span class="pos">${e.pos}</span><b>${e.name}</b>${e.mine?' <span class="pill gold" style="padding:0 5px;font-size:9px">YOUR LEGEND</span>':' <span class="small muted">rival club</span>'}</div>
      <div class="small muted" style="margin-top:2px">Class of '${String(e.inYear).padStart(2,'0')} · ${e.vote}% vote · peak ${e.peak} · ~${e.years} yr${e.rings?` · ${e.rings}× 🏆`:''}${e.awards?` · ${e.awards} award${e.awards>1?'s':''}`:''}${e.allStars?` · ${e.allStars}× ⭐`:''}</div>
      ${e.tie&&e.tie.length?`<div class="small" style="color:var(--gold);margin-top:2px">${e.tie.join(' · ')}</div>`:''}</div>`;
  const old=document.getElementById('saveov');if(old)old.remove();
  const ov=document.createElement('div');ov.id='saveov';ov.className='saveov';
  ov.innerHTML=`<div class="savebox">
    <div class="row" style="align-items:center"><h3 style="flex:1;margin:0">📜 Franchise History</h3><button class="btn ghost sm" onclick="document.getElementById('saveov').remove()">✕</button></div>
    <p class="sub" style="margin:2px 0 8px">${G.teamName} · ${G.league||''} ${G.div||''} · ${seasons} season${seasons===1?'':'s'} in the books</p>
    ${G.mode==='survivor'?`<div class="row" style="gap:6px;align-items:center;margin:0 0 10px"><input id="rnm" maxlength="24" value="${(G.teamName||'').replace(/"/g,'&quot;')}" style="flex:1;font-size:13px"/><button class="btn sm primary" onclick="doRenameTeam()">✏️ Rename club</button></div>`:''}
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:7px">
      ${stat('Total Wins',totalWins)}${stat('Playoff Apps',G.playoffApps||0)}${stat('WS Trips',G.wsApps||0)}
      ${stat('WS Titles',G.champions||0)}${stat('Player Awards',G.totalAwards||0)}${stat(G.mode==="survivor"?'Career Pts':'Award Pts',G.mode==="survivor"?Math.round(G.cumScore||0):(G.awardPoints||0))}
    </div>
    <div class="sectlbl" style="margin-top:12px">🏛️ Team Hall of Fame ${hof.length?`<span class="small muted">(${hof.length})</span>`:''}</div>
    ${hof.length?hof.map(hofCard).join(""):'<p class="small muted">No inductees yet. Keep a homegrown star around for years, pile up awards and rings, and he\'ll earn his place here.</p>'}
    <div class="sectlbl" style="margin-top:14px">👑 League Hall of Fame ${lhof.length?`<span class="small muted">(${lhof.length})</span>`:''}</div>
    <p class="small muted" style="margin:0 0 6px">The pinnacle — voted in at retirement against a career-wide bar. Your franchise legends shine in <span style="color:var(--gold)">gold</span>.</p>
    ${lhof.length?lhof.map(lCard).join(""):'<p class="small muted">No one from this era has reached the League Hall yet — build an all-time great and earn franchise points when he\'s enshrined.</p>'}
  </div>`;
  document.body.appendChild(ov);
}
function nextYear(){G.year++;G.phase=0;G.tradeTries=3;G.seasonStage=0;_dlMode=false;_offers=null;_custom=null;_sugg=null;
  G._mediaAnswered=false;G._mediaQ=null;G._mediaResult=null;G._mediaPromise=false;G._allStarYear=null;G._asDevNotes=null;saveGame();
  if(G.mode==="survivor")startSurvivorYear();else goPhase(0);}

