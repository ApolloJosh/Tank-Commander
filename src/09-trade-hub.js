/* ============================================================
   PHASE 0 — UNIFIED TRADE HUB
   ============================================================ */
let _offers=null,_custom=null,_sugg=null;
function screenTrade(){
  if(G.phase!==0){G.phase=0;}
  _dlMode=false;
  if(_offers===null)_offers=genOffers();
  if(!_custom)_custom={giveIds:new Set(),getIds:new Set(),partner:null,seg:"league",search:"",posF:"all",sort:"val"};
  if(G.draftOrderYear!==G.year)computeDraftOrder();
  if(G.year>=3&&G.faYear!==G.year){G.faMarket=genFAMarket();G.faYear=G.year;G.faSigns=0;}
  const proj=warToWins(teamWAR(G.roster));
  const expiring=G.roster.filter(p=>p.loc==="mlb"&&p.years<=1).sort((a,b)=>b.ovr-a.ovr);
  const tutFr=(!(PROFILE.gamesPlayed||0)&&!PROFILE._tutFr)?`<div class="small" style="display:flex;gap:8px;align-items:center;background:var(--panel2);border:1px solid var(--line2);border-left:3px solid var(--gold);border-radius:4px;padding:8px 10px;margin:10px 0"><span style="flex:1;min-width:0">🎓 <b>Your first rebuild.</b> This club is old and expensive. A classic year 1: trade veterans on expiring deals for <b>prospects and draft picks</b>, eat some losses, then build through the draft. The steps above are one season — you have six.</span><button class="btn ghost sm" style="flex-shrink:0" onclick="PROFILE._tutFr=1;saveProfile();screenTrade()">Got it</button></div>`:'';
  const ns=needsSurplus();
  const faLeft=Math.max(0,4-(G.faSigns||0));
  render(`${header()}${stepbar(0)}${tutFr}
   <div class="grid4">
     <div class="kpi"><div class="big">${proj}</div><div class="lbl">Proj Wins</div></div>
     <div class="kpi"><div class="big">${G.farm.length}</div><div class="lbl">Farm</div></div>
     <div class="kpi"><div class="big">${G.ownedPicks.length}</div><div class="lbl">Draft Picks</div></div>
     <div class="kpi"><div class="big">$${payroll(G.roster)}M</div><div class="lbl">Payroll</div></div>
   </div>
   ${fmMemoHTML('FRONT OFFICE MEMO · WINTER, YEAR '+G.year,fmMemoWinter())}
   ${luxuryTax()>0?`<div class="small" style="color:var(--red);margin:0 0 10px">⚠ Payroll over $300M — luxury tax will cost ~${luxuryTax()} win${luxuryTax()>1?'s':''} this season.</div>`:''}
   <details class="deskp pri" ontoggle="fmSolo(this)">
     <summary><span class="dic">${ico('binoc',20)}</span><div class="dtx"><b>Scout's suggested trade</b><span>built around both clubs' needs — respin freely</span></div><span class="dgo">▸</span></summary>
     <div class="dbody"><div id="suggbox">${renderSuggestion()}</div></div>
   </details>
   ${expiring.length?`<details class="deskp" ontoggle="fmSolo(this)">
     <summary><span class="dic">${ico('siren',20)}</span><div class="dtx"><b>Expiring contracts <span style="color:var(--red)">· ${expiring.length}</span></b><span>${esc(expiring[0].name)}${expiring.length>1?` and ${expiring.length-1} more`:''} — extend or trade before they walk</span></div><span class="dgo">▸</span></summary>
     <div class="dbody"><table><tbody>${expiring.map(p=>`<tr>
       <td><span class="pos">${p.pos}</span> ${p.name} <span class="small muted">age ${p.age} • ${p.ovr} OVR • ${p.years} yr left</span></td>
       <td class="num">${extendSelect(p.id)}</td>
     </tr>`).join("")}</tbody></table></div>
   </details>`:''}
   <details class="deskp" ontoggle="fmSolo(this)">
     <summary><span class="dic">${ico('swap',20)}</span><div class="dtx"><b>Trade desk</b><span>build any deal — players and picks, every club</span></div><span class="dgo">▸</span></summary>
     <div class="dbody"><p class="sub">Click ＋ to add your assets and a partner's assets. Draft picks are tradeable. Ceiling colors: <span class="pill gold" style="padding:0 6px">elite</span> <span class="pill green" style="padding:0 6px">high</span> <span class="pill blue" style="padding:0 6px">solid</span>.</p>
     <div id="builder">${renderBuilder()}</div></div>
   </details>
   ${G.year>=3?`<details class="deskp" ontoggle="fmSolo(this)">
     <summary><span class="dic">${ico('pen',20)}</span><div class="dtx"><b>Free agency <span style="color:var(--gold)">· ${faLeft} of 4 left</span></b><span>veterans on the open market — cash, not prospects</span></div><span class="dgo">▸</span></summary>
     <div class="dbody"><p class="sub">Salaries push toward the $300M luxury-tax line, and leaning on free agency hurts your homegrown grade.</p>
     <div id="falist" class="scroll">${renderFA()}</div></div>
   </details>`:''}
   <details class="deskp" ontoggle="fmSolo(this)">
     <summary><span class="dic">${ico('rank',20)}</span><div class="dtx"><b>Front office resources</b><span>scouting / development / coaching for the year ahead</span></div><span class="dgo">▸</span></summary>
     <div class="dbody"><div id="resbox">${renderResources()}</div></div>
   </details>
   <details class="deskp" ontoggle="fmSolo(this)">
     <summary><span class="dic">${ico('clip',20)}</span><div class="dtx"><b>Clipboard — roster, needs & surplus</b><span><b style="color:var(--red)">Needs:</b> ${ns.needs.length?ns.needs.join(", "):'none'} · <b style="color:var(--green)">Surplus:</b> ${ns.surplus.length?ns.surplus.join(", "):'none'}</span></div><span class="dgo">▸</span></summary>
     <div class="dbody">${rosterMini()}</div>
   </details>
   <div class="deskcta"><button class="btn primary" style="font-size:15px;padding:13px 28px" onclick="${G._ownerTakeover?'ownerDoneTakeover()':'goPhase(1)'}">${G._ownerTakeover?"✅ Done — back to the owner's box":'Break camp → Set roster ▸'}</button></div>`);
}
// Owner Mode: step in and run the front office yourself for the offseason — the GM stands down (he'll still get the trade deadline)
function ownerTakeover(){const o=G.owner;G._ownerTakeover=true;G.phase=0;_offers=null;_custom=null;_sugg=null;
  if(G.year>=2&&G.faYear!==G.year){G.faMarket=genFAMarket();G.faYear=G.year;G.faSigns=0;}
  o._ownerActed=G.year;o._gmYear=G.year;o._gmVetoed=null;_vetoQ=[];
  o._gmDigest={applied:[`🎮 You ran the front office yourself this winter — GM ${o.gmName} stood down on offseason moves.`],pendingDesc:[]};
  saveGame();screenTrade();}
function ownerDoneTakeover(){G._ownerTakeover=false;_offers=null;_custom=null;_sugg=null;saveGame();ownerOffice();}
function assetLabel(a){
  if(a.kind==="pick"){return `<span class="pos" style="color:var(--gold)">PICK</span> ${pickLabel(a.pick)} <span class="small muted">(val ${a.val})</span>`;}
  const p=a.player;
  const ceil=p.pot>p.ovr?` <span class="pill ${ceilClass(p.pot)}" style="padding:1px 6px">ceil ${p.pot}</span>`:'';
  const tag=(p.prospect||p.college)?' <span class="small" style="color:var(--blue)">prospect</span>':(p.fic?' <span class="small muted">depth</span>':'');
  return `<span class="pos">${p.pos}</span> ${p.name}${duraEmoji(p)} <span class="small muted">age ${p.age} • ${ovrHTML(p.ovr)} OVR • ${p.years}yr • $${p.salary}M</span>${ceil}${tag}`;
}
/* ---- free agency ---- */
function ficVeteran(elite){
  const pos=pick(POSPOOL);const age=ri(27,39);
  const ovr=elite?clamp(round(gauss(87,3)),83,93):clamp(round(gauss(70,8)),56,86);
  return {id:uid(),name:ficName(),pos,age,ovr,pot:ovr,realCeil:ovr,dura:rollDura(age),attr:genAttrs(pos),mlbYears:6,salary:0,years:0,loc:"pool",inj:0,fic:true};
}
function faAsk(p){
  const aav=salaryFor(p.ovr,6,p.pos);     // veterans command full freight for their ability
  const years=p.age<=30?ri(3,5):p.age<=34?ri(2,3):1+ri(0,1);
  return {aav,years:Math.max(1,years)};
}
function genFAMarket(){
  const list=[];const seen=new Set();
  const realPool=G.pool.filter(p=>!p.prospect&&!p.fic&&p.age>=27&&p.age<=40&&p.ovr>=66);
  const realTop=realPool.filter(p=>p.ovr>=84).sort(()=>Math.random()-0.5).slice(0,ri(1,3));
  const realRest=realPool.filter(p=>p.ovr<84).sort(()=>Math.random()-0.5).slice(0,ri(3,5));
  [...realTop,...realRest].forEach(p=>{if(seen.has(p.id))return;seen.add(p.id);p._fromPool=true;const a=faAsk(p);list.push({id:uid(),player:p,aav:a.aav,years:a.years});});
  for(let i=0;i<ri(2,3);i++){const v=ficVeteran(true);const a=faAsk(v);list.push({id:uid(),player:v,aav:a.aav,years:a.years});}  // elite
  for(let i=0;i<ri(7,9);i++){const v=ficVeteran(false);const a=faAsk(v);list.push({id:uid(),player:v,aav:a.aav,years:a.years});}
  return list.sort((a,b)=>b.player.ovr-a.player.ovr);
}
const FA_CAP=4;
function renderFA(){
  if(!G.faMarket||!G.faMarket.length)return `<p class="muted">No free agents left this winter.</p>`;
  const left=Math.max(0,FA_CAP-(G.faSigns||0));
  return `<p class="small muted" style="margin:0 0 8px">You can sign up to <b>${FA_CAP}</b> free agents per winter — <b style="color:${left>0?'var(--gold)':'var(--red)'}">${left} left</b>.</p>`+G.faMarket.map(fa=>{const p=fa.player;
    return `<div class="offer"><div class="row" style="align-items:center">
     <div style="flex:2"><span class="pos">${p.pos}</span> ${p.name} <span class="small muted">age ${p.age} • ${ovrHTML(p.ovr)} OVR</span>${p.fic?'':' <span class="small" style="color:var(--blue)">real FA</span>'} ${statCardBtn(p)}</div>
     <div style="flex:1;text-align:right"><span class="small muted">asks ~$${fa.aav}M/yr</span>
       <select onchange="signFA('${fa.id}',this.value)" style="font-size:11px;background:var(--panel2);color:var(--ink);border:1px solid var(--line);border-radius:6px;padding:2px 4px"><option value="">Sign…</option><option value="1">1 yr · $${termAAV(fa.aav,1)}M/yr</option><option value="3">3 yr · $${termAAV(fa.aav,3)}M/yr</option><option value="5">5 yr · $${termAAV(fa.aav,5)}M/yr</option></select></div></div></div>`;}).join("");
}
function signFA(fid,years){
  const fa=(G.faMarket||[]).find(x=>x.id===fid);if(!fa)return;const p=fa.player;
  if((G.faSigns||0)>=FA_CAP){toast(`You've used all ${FA_CAP} free-agent signings this winter.`);screenTrade();return;}
  years=parseInt(years)||fa.years||3;
  if(p._fromPool){if(!G.pool.some(x=>x.id===p.id)){G.faMarket=G.faMarket.filter(x=>x.id!==fid);toast('No longer available');screenTrade();return;}
    G.pool=G.pool.filter(x=>x.id!==p.id);delete p._fromPool;}
  const aav=termAAV(fa.aav,years);
  p.salary=aav;p.years=years;p.loc="mlb";p.src="fa";p.inj=0;p.mlbYears=6;p.happy=clamp(happyVal(p)+12,60,90);
  G.roster.push(p);G.faMarket=G.faMarket.filter(x=>x.id!==fid);_custom=null;
  G.faSigns=(G.faSigns||0)+1;
  _sugg=null;toast(`Signed ${p.name} — ${years}yr / $${aav}M/yr (${Math.max(0,FA_CAP-(G.faSigns||0))} signing${(FA_CAP-(G.faSigns||0))===1?'':'s'} left)`);screenTrade();
}
function needsSurplus(){
  const mlb=G.roster.filter(p=>p.loc==="mlb");const a=buildActive(G.roster);
  // positions already covered by a high-ceiling prospect in your minors
  const farmCover=G.farm.filter(p=>p.pot>=80).map(p=>p.pos);
  const covered=s=>farmCover.some(fp=>posCoversSlot(fp,s));
  const needs=[],surplus=[];
  LINEUP.forEach(s=>{const p=a.lineup[s];if((!p||p.ovr<66)&&!covered(s))needs.push(s);});
  if(mlb.filter(p=>p.pos==="SP"&&p.ovr>=66).length<5&&!farmCover.includes("SP"))needs.push("SP");
  if(mlb.filter(p=>p.pos==="RP"&&p.ovr>=66).length<3&&!farmCover.includes("RP"))needs.push("RP");
  // surplus counts MLB-quality bodies plus high-ceiling prospects at a position
  const cnt={};mlb.forEach(p=>{if(p.ovr>=74)cnt[p.pos]=(cnt[p.pos]||0)+1;});
  G.farm.filter(p=>p.pot>=82).forEach(p=>{cnt[p.pos]=(cnt[p.pos]||0)+1;});
  Object.keys(cnt).forEach(pos=>{const need=pos==="SP"?4:pos==="RP"?3:1;if(cnt[pos]>need)surplus.push(cnt[pos]>need+1?`${pos} (${cnt[pos]})`:pos);});
  return {needs:[...new Set(needs)],surplus};
}
function duraEmoji(p){if(!p||p.dura==null)return '';if(p.dura<50)return ' 🩹';if(p.dura>85)return ' 💪';return '';}
function svcTag(p){ // a not-yet-on-the-clock minor-leaguer vs an established big-leaguer (uses roster location so call-ups read correctly)
  const minors = p.loc==="farm" || (p.loc==="pool" && (p.prospect||(p.mlbYears||0)===0));
  return minors?` <span class="pill blue" style="padding:0 5px;font-size:10px">🌱 minors</span>`:'';
}
function declineTag(p){ // an aging player past his peak whose ceiling is now out of reach
  if(!p||isNaN(p.ovr))return '';
  const peak=p._peak||p.ovr;
  if(p.age>=32&&peak-p.ovr>=2)return ` <span class="pill red" style="padding:0 5px;font-size:10px">📉 declining</span>`;
  return '';
}
function fanFavTag(p){return p&&p.fanFav?` <span class="pill gold" style="padding:0 5px;font-size:10px">⭐ fan favorite</span>`:'';}
function fanFavEmoji(p){return p&&p.fanFav?' ⭐':'';}
function customEmoji(p){return p&&p.custom?' 🌟':'';}
function rosterMini(){
  const a=buildActive(G.roster);
  const chip=(lbl,p)=>`<span class="pill" style="margin:2px;background:var(--panel2)">${lbl} ${p?`${p.name.split(' ').slice(-1)[0]} ${ovrHTML(p.ovr)}${p.inj?' 🩹':''}${duraEmoji(p)}`:'<span class="empty">—</span>'}</span>`;
  const bench=G.roster.filter(p=>p.loc==="mlb"&&!a.used.has(p.id)&&!a.rotation.includes(p)&&!a.pen.includes(p)).sort((x,y)=>y.ovr-x.ovr);
  const farmSorted=G.farm.slice().sort((x,y)=>y.pot-x.pot);
  const depthChip=p=>`<span class="pill" style="margin:2px;background:var(--panel2)"><span class="pos">${p.pos}</span> ${p.name.split(' ').slice(-1)[0]} ${ovrHTML(p.ovr)}<span class="small muted">/${p.pot}</span>${duraEmoji(p)}</span>`;
  return `<div style="margin:4px 0"><div class="small muted">Lineup</div>${LINEUP.map(s=>chip(s,a.lineup[s])).join("")}</div>
   <div style="margin:4px 0"><div class="small muted">Rotation</div>${ROT_SLOTS.map((_,i)=>chip('SP',a.rotation[i])).join("")}</div>
   <div style="margin:4px 0"><div class="small muted">Bullpen</div>${[0,1,2].map(i=>chip('RP',a.pen[i])).join("")}</div>
   <div style="margin:4px 0"><div class="small muted">Depth — bench & minors (OVR/ceiling)</div>${(bench.concat(farmSorted)).length?bench.concat(farmSorted).map(depthChip).join(""):'<span class="small empty">none</span>'}</div>
   <div class="small muted" style="margin-top:6px">Projected wins <b style="color:var(--ink)">${warToWins(teamWAR(G.roster))}</b> • payroll $${payroll(G.roster)}M${luxuryTax()>0?` • <span style="color:var(--red)">luxury tax −${luxuryTax()} W</span>`:''}</div>`;
}
/* ---- resources triangle (scouting / development / coaching) ---- */
const RES_A=[120,20],RES_B=[26,184],RES_C=[214,184];   // scouting / development / coaching vertices
function bary(px,py,A,B,C){
  const v0=[B[0]-A[0],B[1]-A[1]],v1=[C[0]-A[0],C[1]-A[1]],v2=[px-A[0],py-A[1]];
  const d00=v0[0]*v0[0]+v0[1]*v0[1],d01=v0[0]*v1[0]+v0[1]*v1[1],d11=v1[0]*v1[0]+v1[1]*v1[1],d20=v2[0]*v0[0]+v2[1]*v0[1],d21=v2[0]*v1[0]+v2[1]*v1[1];
  const den=d00*d11-d01*d01||1;
  const wB=(d11*d20-d01*d21)/den,wC=(d00*d21-d01*d20)/den,wA=1-wB-wC;
  return [wA,wB,wC];
}
function renderResources(){
  const r=G.resources||{scouting:1/3,development:1/3,coaching:1/3};
  const px=r.scouting*RES_A[0]+r.development*RES_B[0]+r.coaching*RES_C[0];
  const py=r.scouting*RES_A[1]+r.development*RES_B[1]+r.coaching*RES_C[1];
  const pc=x=>Math.round(x*100);
  return `<div class="row" style="align-items:center">
    <div style="flex:0 0 235px;text-align:center">
      <svg viewBox="0 0 240 210" width="230" height="200" style="cursor:crosshair" onclick="setResourcesFromClick(event)">
        <polygon points="${RES_A} ${RES_B} ${RES_C}" fill="rgba(120,200,40,.06)" stroke="var(--line)" stroke-width="1.5"/>
        <line x1="${RES_A[0]}" y1="${RES_A[1]}" x2="${(RES_B[0]+RES_C[0])/2}" y2="${(RES_B[1]+RES_C[1])/2}" stroke="var(--line)" stroke-dasharray="3 3"/>
        <line x1="${RES_B[0]}" y1="${RES_B[1]}" x2="${(RES_A[0]+RES_C[0])/2}" y2="${(RES_A[1]+RES_C[1])/2}" stroke="var(--line)" stroke-dasharray="3 3"/>
        <line x1="${RES_C[0]}" y1="${RES_C[1]}" x2="${(RES_A[0]+RES_B[0])/2}" y2="${(RES_A[1]+RES_B[1])/2}" stroke="var(--line)" stroke-dasharray="3 3"/>
        <circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="9" fill="var(--gold)" stroke="#0c1a00" stroke-width="2"/>
        <text x="${RES_A[0]}" y="${RES_A[1]-6}" fill="var(--gold)" font-size="11" text-anchor="middle">Scouting</text>
        <text x="${RES_B[0]+6}" y="${RES_B[1]+15}" fill="var(--gold)" font-size="11" text-anchor="middle">Development</text>
        <text x="${RES_C[0]-6}" y="${RES_C[1]+15}" fill="var(--gold)" font-size="11" text-anchor="middle">Coaching</text>
      </svg>
      <div class="small muted">Click inside to allocate</div></div>
    <div style="flex:1;min-width:210px">
      <div class="small"><b style="color:var(--gold)">Scouting ${pc(r.scouting)}%</b> — your read on draft ceilings; more = prospects hit their ceiling more often, less = you get fooled by busts.</div>
      <div class="small" style="margin-top:7px"><b style="color:var(--gold)">Development ${pc(r.development)}%</b> — speeds up player growth and can raise ceilings. The effect is biggest for prospects <i>in your minors</i>, and continues at a <i>smaller scale</i> for young players in the majors.</div>
      <div class="small" style="margin-top:7px"><b style="color:var(--gold)">Coaching ${pc(r.coaching)}%</b> — raises your roster's floor, boosts defense & control, and improves your odds in a playoff series.</div>
      <div style="margin-top:8px">${[['Balanced',34,33,33],['Scout',60,25,15],['Develop',20,60,20],['Win-now',18,22,60]].map(a=>`<button class="btn sm" onclick="setResources(${a[1]},${a[2]},${a[3]})">${a[0]}</button>`).join(' ')}</div>
    </div></div>`;
}
function setResources(s,d,c){const t=s+d+c||1;G.resources={scouting:s/t,development:d/t,coaching:c/t};saveGame();const el=document.getElementById('resbox');if(el)el.innerHTML=renderResources();}
function setResourcesFromClick(ev){
  const svg=ev.currentTarget,rect=svg.getBoundingClientRect();
  const sx=(ev.clientX-rect.left)*(240/rect.width),sy=(ev.clientY-rect.top)*(210/rect.height);
  let w=bary(sx,sy,RES_A,RES_B,RES_C).map(x=>Math.max(0,x));const sum=w[0]+w[1]+w[2]||1;
  G.resources={scouting:w[0]/sum,development:w[1]/sum,coaching:w[2]/sum};saveGame();
  const el=document.getElementById('resbox');if(el)el.innerHTML=renderResources();
}
function myTradeableAssets(){
  const a=[];
  G.roster.filter(p=>p.loc==="mlb").forEach(p=>a.push({kind:"player",aid:p.id,player:p,val:tradeValue(p)}));
  G.farm.forEach(p=>a.push({kind:"player",aid:p.id,player:p,val:tradeValue(p)}));
  G.ownedPicks.forEach(pk=>a.push({kind:"pick",aid:pk.id,pick:pk,val:pickVal(pk)}));
  return a;
}
/* ---- asset transfer helpers ---- */
function isFanFav(p){return !!(p&&p.fanFav);}
function detectFanFavorites(){   // homegrown, tenured, and a real performer becomes a beloved face of the franchise
  G._newFanFavs=[];
  G.roster.filter(p=>p.loc==="mlb"&&!p.fanFav&&p.src==="draft"&&(p.mlbYears||0)>=4&&p.ovr>=83).forEach(p=>{p.fanFav=true;G._newFanFavs.push(p);});
}
function giveAsset(a){
  if(a.kind==="player"){
    if(G.mode==="survivor"&&isFanFav(a.player)){favorChange(-2,`Traded away fan favorite ${a.player.name}`);fanChange(-9,`Fans are furious you dealt ${a.player.name}`);toast(`📣 Fans are crushed you traded ${a.player.name}`);}
    induct(a.player,'traded away');
    G.roster=G.roster.filter(p=>p.id!==a.player.id);G.farm=G.farm.filter(p=>p.id!==a.player.id);a.player.loc="pool";G.pool.push(a.player);}
  else{G.ownedPicks=G.ownedPicks.filter(pk=>pk.id!==a.pick.id);}
}
function getAsset(a){
  if(a.kind==="player"){G.pool=G.pool.filter(p=>p.id!==a.player.id);placeAcquired(a.player);}
  else{const src=a.pick;if(src.fromTeam){const t=G.ai.find(x=>x.id===src.fromTeam);if(t)t._pickTraded=true;}G.ownedPicks.push({...src,id:uid()});}
}
function placeAcquired(p){
  p._acqYear=G.year;   // when you got them (Survivor: awards from same-year pickups pay less favor)
  p.loc=(p.ovr>=68&&p.age>22&&!p.prospect)?"mlb":"farm";
  if(p.years<2&&p.loc==="mlb")p.years=6;
  if(p.src!=="draft")p.src="trade";
  if(p.loc==="mlb"){p.mlbYears=p.mlbYears||initService(p.age);p.salary=salaryFor(p.ovr,p.mlbYears,p.pos);}
  if(p.loc==="mlb")G.roster.push(p);else G.farm.push(p);
}
/* ---- generated offers ---- */
function genOffers(){const offers=[];let guard=0;
  while(offers.length<5&&guard++<70){const o=genOneOffer();if(o)offers.push(o);}
  // never show the same draft pick (slot) in two different offers
  const seen=new Set();
  offers.forEach(o=>{o.get=o.get.filter(a=>{if(a.kind!=="pick")return true;if(seen.has(a.pick.slot))return false;seen.add(a.pick.slot);return true;});});
  return offers;}
function poolStars(min){return G.pool.filter(p=>!p.prospect&&p.ovr>=(min||80)&&p.age<=33);}
function poolYoung(){return G.pool.filter(p=>p.prospect||(p.age<=25&&p.pot>=80));}
function PA(p){return {kind:"player",aid:p.id,player:p,val:tradeValue(p)};}
function synthPick(slot){const pk={id:uid(),slot,future:false,fromMe:false};return {kind:"pick",aid:pk.id,pick:pk,val:pickVal(pk)};}
function genOneOffer(){
  const team=pick(G.ai),yr=G.year;
  let mode=yr<=2?(Math.random()<0.85?"sell":"swap"):yr===3?pick(["sell","buy","swap"]):(Math.random()<0.8?"buy":"swap");
  if(mode==="sell"){
    const vets=G.roster.filter(p=>p.loc==="mlb"&&(p.ovr>=76||p.age>=31)).sort((a,b)=>tradeValue(b)-tradeValue(a));
    if(!vets.length)return null;
    const give=[vets[0]];if(vets[1]&&Math.random()<0.3)give.push(vets[1]);
    const target=give.reduce((s,p)=>s+tradeValue(p),0)*rnd(0.85,1.04);
    const get=assembleFromPool(target,"young",team);if(!get.length)return null;
    return mkOffer(team,give.map(PA),get);
  }
  if(mode==="buy"){
    const stars=poolStars(80);if(!stars.length)return null;
    const star=pick(stars);const target=tradeValue(star)*rnd(0.95,1.15);
    const give=assembleFromMine(target);if(!give.length)return null;
    return mkOffer(team,give,[PA(star)]);
  }
  const mine=G.roster.filter(p=>p.loc==="mlb").sort(()=>Math.random()-0.5)[0];if(!mine)return null;
  const want=tradeValue(mine)*rnd(0.9,1.1);
  const cand=G.pool.filter(p=>Math.abs(tradeValue(p)-want)<=7&&p.id!==mine.id);if(!cand.length)return null;
  return mkOffer(team,[PA(mine)],[PA(pick(cand))]);
}
function assembleFromPool(target,kind,team){
  let cands=(kind==="young"?poolYoung():G.pool).slice();if(!cands.length)cands=G.pool.slice();
  cands.sort(()=>Math.random()-0.5);
  const get=[];let v=0,guard=0;
  while(v<target*0.9&&get.length<3&&guard++<30&&cands.length){
    const p=cands.shift();const pv=tradeValue(p);
    if(v+pv<=target+8){get.push(PA(p));v+=pv;}}
  if(v<target*0.85&&G.year<=3&&team&&team.pickSlot&&!team._pickTraded){
    const pk={id:uid(),slot:team.pickSlot,round:1,future:false,fromMe:false,fromTeam:team.id};
    const pv=pickVal(pk);
    if(pv<=(target-v)+12){get.push({kind:"pick",aid:pk.id,pick:pk,val:pv});}   // only add a pick that fits the value
  }
  return get;
}
function assembleFromMine(target){
  let assets=[];
  G.farm.forEach(p=>assets.push(PA(p)));
  G.ownedPicks.forEach(pk=>assets.push({kind:"pick",aid:pk.id,pick:pk,val:pickVal(pk)}));
  G.roster.filter(p=>p.loc==="mlb"&&p.age<=27&&p.pot>=84).forEach(p=>assets.push(PA(p)));
  assets.sort((a,b)=>b.val-a.val);
  const give=[];let v=0,gu=0;
  for(const a of assets){if(v>=target)break;give.push(a);v+=a.val;if(++gu>4)break;}
  return v>=target*0.9?give:[];
}
function mkOffer(team,give,get){const gv=give.reduce((s,a)=>s+a.val,0),gt=get.reduce((s,a)=>s+a.val,0);
  return {id:uid(),team,give,get,fair:gt/Math.max(1,gv)};}
function renderOffers(){
  if(!_offers.length)return `<p class="muted">No deals on the table — try refreshing.</p>`;
  return _offers.map(o=>`<div class="offer">
     <div class="row" style="align-items:center">
       <div style="flex:2"><b>${o.team.name}</b> <span class="small muted">proj ${warToWins(o.team.war)}W</span>
         <span class="pill ${o.fair>=1?'green':o.fair>=0.88?'gold':'red'}">${o.fair>=1?'You win':o.fair>=0.88?'Fair':'Lean against you'}</span></div>
       <div style="flex:1;text-align:right"><button class="btn primary sm" onclick="acceptOffer('${o.id}')">Accept</button></div></div>
     <div class="grid2" style="margin-top:8px">
       <div><div class="small give">▼ You send</div>${o.give.map(a=>`<div class="small">${assetLabel(a)}</div>`).join("")}</div>
       <div><div class="small get">▲ You get</div>${o.get.map(a=>`<div class="small">${assetLabel(a)}</div>`).join("")}</div>
     </div></div>`).join("");
}
function refreshOffers(){if(G.tradeTries<=0)return;G.tradeTries--;_offers=genOffers();screenTrade();}
function acceptOffer(oid){const o=_offers.find(x=>x.id===oid);if(!o)return;
  o.give.forEach(giveAsset);o.get.forEach(getAsset);
  _offers=_offers.filter(x=>x.id!==oid);_custom=null;
  showBreaking(`${G.teamName} strike a deal with ${o.team.name}`,'The clubhouse takes notice.');screenTrade();}

/* ---- custom builder: Option 2 segmented + Option D rows ---- */
const ATTR_EMO={contact:"🎯",power:"💥",speed:"🏃",eye:"👁️",defense:"🧤",velocity:"🔥",control:"🎛️",spin:"🌀",whiff:"💨"};
function tbAttrEmojis(p){if(!p.attr)return '';const keys=isPit(p)?PIT_ATTRS:HIT_ATTRS;const st=[],wk=[];
  keys.forEach(k=>{const v=attrVal(p,k);if(v>=85)st.push(`<span class="aemo s">${ATTR_EMO[k]} ${v}</span>`);else if(v<=50)wk.push(`<span class="aemo w">${ATTR_EMO[k]} ${v}</span>`);});
  return st.slice(0,3).join("")+wk.slice(0,2).join("");}
function tbBadge(a){if(a.kind==="pick")return `<div class="tbadge"><span class="o" style="color:var(--gold)">PK</span></div>`;
  const p=a.player;const up=p.pot>p.ovr?ceilBadge(p.pot):"";
  return `<div class="tbadge">${ovrSpan(p.ovr,18)}${up}</div>`;}
const teamNameOf=id=>id==="me"?G.teamName:((G.ai.find(t=>t.id===id)||{}).name||id);
const teamShortOf=id=>teamNameOf(id).split(" ").slice(-1)[0];
function leagueAssets(){
  if(G.draftOrderYear!==G.year)computeDraftOrder();
  const arr=[];
  G.ai.forEach(t=>{
    (t.block||[]).forEach(id=>{const p=G.pool.find(x=>x.id===id);if(p)arr.push({kind:"player",aid:p.id,player:p,val:tradeValue(p),team:t.id});});
    if(t.pickSlot&&!t._pickTraded){const pk={id:"pk_"+t.id,slot:t.pickSlot,round:1,future:false,fromMe:false,fromTeam:t.id};arr.push({kind:"pick",aid:pk.id,pick:pk,val:pickVal(pk),team:t.id});}
  });
  return arr;
}
function tbMine(){return myTradeableAssets().map(a=>(a.team="me",a));}
function tbFind(aid){return tbMine().concat(leagueAssets()).find(a=>a.aid===aid);}
function tbSort(arr){const a=arr.slice();const k=_custom.sort||"val";a.sort((x,y)=>{
  if(x.kind==="pick"||y.kind==="pick"){if(x.kind==="pick"&&y.kind==="pick")return y.val-x.val;return x.kind==="pick"?1:-1;}
  switch(k){case "ovr":return y.player.ovr-x.player.ovr;case "pot":return y.player.pot-x.player.pot;case "sal":return (y.player.salary||0)-(x.player.salary||0);case "age":return x.player.age-y.player.age;case "years":return x.player.years-y.player.years;default:return y.val-x.val;}});return a;}
function tbMatch(a){const f=_custom.posF||"all";
  if(f!=="all"){if(a.kind==="pick")return f==="PK";if(a.player.pos!==f)return false;}
  if(_custom.search){const q=_custom.search.toLowerCase();const nm=a.kind==="pick"?("r"+a.pick.round+" pick "+a.pick.slot):a.player.name;if(!(nm.toLowerCase().includes(q)||(a.kind==="player"&&a.player.pos.toLowerCase()===q)))return false;}
  return true;}
function tbSource(){const s=_custom.seg||"league";
  if(s==="me")return tbMine();
  if(s==="partner")return _custom.partner?leagueAssets().filter(a=>a.team===_custom.partner):[];
  return leagueAssets();}
function tbRow(a){const getSide=(_custom.seg||"league")!=="me";
  const sel=(getSide?_custom.getIds:_custom.giveIds).has(a.aid);
  const fn=getSide?`tbToggle('get','${a.aid}')`:`tbToggle('give','${a.aid}')`;
  let title,meta;
  if(a.kind==="pick"){title=pickLabel(a.pick);meta=`round ${a.pick.round} · slot ${a.pick.slot}`+(getSide?` · ${teamShortOf(a.team)}`:'');}
  else{const p=a.player;title=`<span class="pos">${p.pos}</span> ${p.name} ${statCardBtn(p)}`;
    meta=`${p.age}y · <b>${p.years}yr left</b> · $${p.salary}M${getSide?' · '+teamShortOf(a.team):''}${fanFavEmoji(p)}${dawgEmoji(p)}${svcTag(p)}${(declineTag(p)?' 📉':'')}${duraEmoji(p)} ${tbAttrEmojis(p)}${flexTag(p)}`;}
  return `<div class="tbrow">${tbBadge(a)}<div style="flex:1;min-width:0"><div>${title}</div><div class="small muted" style="margin-top:2px">${meta}</div></div><span class="tbval">${a.val}</span><button class="add ${sel?'in':''}" onclick="${fn}">${sel?'✓':'＋'}</button></div>`;}
function tbCard(a){   // read-only Option D card (used by the suggestion panel)
  let title,meta;
  if(a.kind==="pick"){title=pickLabel(a.pick);meta=`round ${a.pick.round} · slot ${a.pick.slot}`;}
  else{const p=a.player;title=`<span class="pos">${p.pos}</span> ${p.name}`;
    meta=`${p.age}y · <b>${p.years}yr left</b> · $${p.salary}M${fanFavEmoji(p)}${dawgEmoji(p)}${svcTag(p)}${(declineTag(p)?' 📉':'')}${duraEmoji(p)} ${tbAttrEmojis(p)}${flexTag(p)}`;}
  return `<div class="tbrow">${tbBadge(a)}<div style="flex:1;min-width:0"><div>${title}</div><div class="small muted" style="margin-top:2px">${meta}</div></div><span class="tbval">${a.val}</span></div>`;}
function tbList(){
  if((_custom.seg||"league")==="partner"&&!_custom.partner)return `<p class="muted small" style="padding:8px">Pick a player from the league to set your trade partner.</p>`;
  const list=tbSort(tbSource().filter(tbMatch));
  if(!list.length)return `<p class="muted small" style="padding:8px">No players match — try another position or search.</p>`;
  return list.map(tbRow).join("");}
function tbSortSel(){return `<select onchange="tbSetSort(this.value)" style="font-size:12px">${[["val","Trade value"],["ovr","Overall"],["pot","Ceiling"],["sal","Contract $"],["age","Age (young)"],["years","Yrs control"]].map(([k,l])=>`<option value="${k}" ${(_custom.sort||'val')===k?'selected':''}>Sort: ${l}</option>`).join("")}</select>`;}
function tbPosChips(){return ["all","C","1B","2B","3B","SS","LF","CF","RF","DH","SP","RP","PK"].map(p=>`<span class="tbchip ${(_custom.posF||'all')===p?'on':''}" onclick="tbSetPos('${p}')">${p}</span>`).join("");}
function tbKey(){const a=k=>`<span style="display:inline-block;margin:1px 10px 1px 0"><span class="aemo s" style="margin:0">${ATTR_EMO[k]}</span> ${ATTR_LABEL[k]}${k==="eye"?" (walks)":k==="whiff"?" (Ks)":""}</span>`;
  return `<div style="margin-top:10px;border-top:1px solid var(--line);padding-top:8px">
    <div class="small muted" style="font-weight:700;margin-bottom:4px">KEY</div>
    <div class="small">${HIT_ATTRS.map(a).join("")}${PIT_ATTRS.map(a).join("")}<span style="display:inline-block;margin:1px 10px 1px 0">💪 Durable</span><span style="display:inline-block;margin:1px 10px 1px 0">🩹 Injury-prone</span><span style="display:inline-block;margin:1px 10px 1px 0">🐶 DAWG (clutch — boosts October)</span><span style="display:inline-block;margin:1px 10px 1px 0">↔ Position flex</span></div>
    <div class="small muted" style="margin-top:5px">Shown only for a true <span style="color:var(--gold)">strength (85+)</span> or <span style="color:#ffb4b4">weakness (&lt;50)</span>. Overall badge color ramps muted → yellow → laser-green (diamond 96+, iridescent 99); ↑ is a prospect's ceiling.</div></div>`;}
function tbScale(){
  const give=[..._custom.giveIds].map(tbFind).filter(Boolean),get=[..._custom.getIds].map(tbFind).filter(Boolean);
  const gv=give.reduce((s,a)=>s+a.val,0),gt=get.reduce((s,a)=>s+a.val,0);
  const ok=(_dlMode&&_custom.partner&&_custom.partner!=="me")?dlAccept(_custom.partner,give,get):(gt>0&&gv>=gt*0.95);
  const tilt=clamp(50+(gv-gt)*2.2,8,92);
  const chips=(arr,side)=>arr.map(a=>{const t=a.kind==="pick"?pickLabel(a.pick):a.player.pos+" "+a.player.name.split(' ').slice(-1)[0]+" "+a.player.ovr;return `<span class="pkg">${t} <span style="color:var(--gold)">${a.val}</span> <span style="cursor:pointer;color:var(--red)" onclick="tbToggle('${side}','${a.aid}')">✕</span></span>`;}).join("")||'<span class="muted small">— nothing yet —</span>';
  const pInfo=_custom.partner?`trading with ${teamNameOf(_custom.partner)}${_custom.partner!=="me"?` · proj ${warToWins((G.ai.find(t=>t.id===_custom.partner)||{war:30}).war)}W`:''}`:'pick a player to set a partner';
  return `<div class="panel2" style="border:1px solid var(--line);border-radius:5px;padding:10px;margin-bottom:10px">
    <div style="display:flex;justify-content:space-between;align-items:center;font-size:13px;margin-bottom:6px"><span class="give">You send <b>${gv}</b></span><span class="muted small" style="text-align:center;flex:1">${pInfo}</span><span class="get">You get <b>${gt}</b></span></div>
    <div style="position:relative;height:9px;background:#1c2213;border-radius:5px;border:0.5px solid var(--line)"><div style="position:absolute;left:0;top:0;bottom:0;width:${tilt}%;background:var(--line2);border-radius:5px"></div><div style="position:absolute;left:calc(${tilt}% - 2px);top:-3px;bottom:-3px;width:4px;background:var(--gold);border-radius:3px"></div></div>
    <div class="grid2" style="margin-top:9px"><div><div class="small give" style="font-weight:700">▼ YOU SEND</div>${chips(give,'give')}</div><div><div class="small get" style="font-weight:700">▲ YOU RECEIVE</div>${chips(get,'get')}</div></div>
    <div style="text-align:center;margin-top:8px"><span class="pill ${ok?'green':'red'}">${ok?'✓ they accept this':(gt>0?'✗ too light':'add players')}</span> <button class="btn primary" ${ok?'':'disabled'} onclick="proposeCustom()">Propose trade</button> <button class="btn ghost" onclick="clearTrade()">Clear</button></div></div>`;}
function renderBuilder(){
  if(G.draftOrderYear!==G.year)computeDraftOrder();
  const segBtn=(k,l)=>`<button class="btn sm ${(_custom.seg||'league')===k?'primary':'ghost'}" style="flex:1" onclick="tbSeg('${k}')">${l}</button>`;
  return `${tbScale()}
   <div style="display:flex;gap:6px;margin-bottom:9px">${segBtn('me','Your team — send')}${segBtn('partner','Partner'+(_custom.partner&&_custom.partner!=="me"?' · '+teamShortOf(_custom.partner):'')+' — get')}${segBtn('league','Whole league — get')}</div>
   <div style="display:flex;gap:7px;margin-bottom:8px"><input id="tbsearch" placeholder="Search a name…" value="${(_custom.search||'').replace(/"/g,'&quot;')}" oninput="tbSearch(this.value)" style="flex:1"> ${tbSortSel()}</div>
   <div style="margin-bottom:6px">${tbPosChips()}</div>
   <div class="scroll" id="tblist">${tbList()}</div>
   ${tbKey()}`;}
function rerenderBuilder(){const el=document.getElementById('builder');if(!el)return;
  const old=document.getElementById('tblist');const st=old?old.scrollTop:0;const wy=window.scrollY;   // keep your place
  el.innerHTML=renderBuilder();
  const neu=document.getElementById('tblist');if(neu)neu.scrollTop=st;
  window.scrollTo(0,wy);}
function tbSeg(k){_custom.seg=k;rerenderBuilder();}
function tbSetSort(v){_custom.sort=v;rerenderBuilder();}
function tbSetPos(p){_custom.posF=p;rerenderBuilder();}
function tbSearch(v){_custom.search=v;const el=document.getElementById('tblist');if(el)el.innerHTML=tbList();}
function tbToggle(side,aid){
  if(side==='give'){if(_custom.giveIds.has(aid))_custom.giveIds.delete(aid);else _custom.giveIds.add(aid);rerenderBuilder();return;}
  const a=tbFind(aid);if(!a)return;
  if(_custom.getIds.has(aid)){_custom.getIds.delete(aid);if(_custom.getIds.size===0)_custom.partner=null;rerenderBuilder();return;}
  if(_custom.partner&&a.team!==_custom.partner){_custom.getIds=new Set([..._custom.getIds].filter(g=>{const ga=tbFind(g);return ga&&ga.team===a.team;}));toast("Partner → "+teamShortOf(a.team));}
  _custom.partner=a.team;_custom.getIds.add(aid);rerenderBuilder();}
function clearTrade(){_custom.giveIds=new Set();_custom.getIds=new Set();_custom.partner=null;rerenderBuilder();}
function proposeCustom(){
  const give=[..._custom.giveIds].map(tbFind).filter(Boolean),get=[..._custom.getIds].map(tbFind).filter(Boolean);
  const gv=give.reduce((s,a)=>s+a.val,0),gt=get.reduce((s,a)=>s+a.val,0);
  const accept=(_dlMode&&_custom.partner&&_custom.partner!=="me")?dlAccept(_custom.partner,give,get):(gt>0&&gv>=gt*0.95);
  if(!accept){toast("They reject that package");return;}
  give.forEach(giveAsset);get.forEach(getAsset);
  const nm=teamNameOf(_custom.partner);
  const dl=_dlMode;
  _custom={giveIds:new Set(),getIds:new Set(),partner:null,seg:_custom.seg,search:'',posF:'all',sort:_custom.sort};
  _sugg=null;showBreaking(`${G.teamName} strike a deal with ${nm}`,'The scout who pitched it takes a bow.');
  if(dl)screenDeadline();else screenTrade();}

/* ---- need-based trade suggestion (one at a time, respin freely, auto-respins after accept) ---- */
function genSuggestion(){
  if(G.draftOrderYear!==G.year)computeDraftOrder();
  const ns=needsSurplus();
  const needs=ns.needs.slice();
  const surplusPos=new Set(ns.surplus.map(s=>s.split(' ')[0]));
  const mine=tbMine().filter(a=>a.val>=4);
  if(!mine.length)return null;
  const league=leagueAssets();
  const scoreGet=a=>{if(a.kind!=="player")return 0;let s=0;
    if(needs.some(np=>a.player.pos===np||canPlaySlot(a.player,np)))s+=3;
    if(a.player.ovr>=78||a.player.pot>=86)s+=1; return s;};
  const teams=[...G.ai].filter(t=>t.block&&t.block.length).sort(()=>Math.random()-0.5);
  for(const team of teams){
    let theirs=league.filter(a=>a.team===team.id);
    const cnt={};theirs.forEach(a=>{if(a.kind==="player")cnt[a.player.pos]=(cnt[a.player.pos]||0)+1;});
    const theirSurplus=new Set(Object.keys(cnt).filter(p=>cnt[p]>=2));
    let cands=theirs.filter(a=>a.kind==="player"&&a.val>=15&&scoreGet(a)>0);
    cands.sort((a,b)=>(scoreGet(b)+(theirSurplus.has(b.player.pos)?0.5:0))-(scoreGet(a)+(theirSurplus.has(a.player.pos)?0.5:0))||b.val-a.val);
    if(!cands.length)continue;
    const get=[cands[ri(0,Math.min(2,cands.length-1))]];
    let factor=1.0;
    if(Math.random()<0.25){const fillsNeed=needs.some(np=>get[0].player.pos===np||canPlaySlot(get[0].player,np));factor=fillsNeed?rnd(0.86,0.98):rnd(1.03,1.15);}
    const need=Math.max(1,get[0].val*factor);
    // assemble a give package that matches `need` closely (slight surplus-position preference)
    const surplusBonus=a=>(a.kind==="player"&&surplusPos.has(a.player.pos))?6:0;
    const giveable=mine.filter(a=>a.aid!==get[0].aid);
    const give=[];let v=0,cand=giveable.slice(),guard=0;
    while(v<need*0.95&&give.length<3&&cand.length&&guard++<8){
      let best=null,bg=1e9;
      for(const a of cand){const nv=v+a.val;const gap=(nv>=need?(nv-need)*0.55:(need-nv))-surplusBonus(a);if(gap<bg){bg=gap;best=a;}}
      if(!best)break;give.push(best);v+=best.val;cand.splice(cand.indexOf(best),1);}
    if(!give.length||v<need*0.8)continue;
    const fills=needs.find(np=>get[0].player.pos===np||canPlaySlot(get[0].player,np));
    const reason=`${teamShortOf(team.id)} offers ${get[0].player.pos} ${get[0].player.name}${fills?` — fills your need at ${fills}`:''}${surplusPos.size?`; they'll take from your surplus (${[...surplusPos].slice(0,2).join("/")})`:''}.`;
    return {team:team.id,get,give,reason};
  }
  return null;
}
function renderSuggestion(){
  if(!_sugg)_sugg=genSuggestion();
  if(!_sugg)return `<p class="muted small">No clean fit right now. <button class="btn sm" onclick="respinSuggestion()">↻ Respin</button></p>`;
  const s=_sugg,gv=s.give.reduce((n,a)=>n+a.val,0),gt=s.get.reduce((n,a)=>n+a.val,0);
  const tag=gv<=gt*0.93?'<span class="pill green">you win</span>':gv>=gt*1.07?'<span class="pill red">they win</span>':'<span class="pill gold">fair</span>';
  return `<p class="sub" style="margin-bottom:8px">${s.reason}</p>
    <div class="grid2">
      <div><div class="small give" style="font-weight:700;margin-bottom:4px">▼ YOU SEND &nbsp;${gv}</div>${s.give.map(tbCard).join("")}</div>
      <div><div class="small get" style="font-weight:700;margin-bottom:4px">▲ YOU GET &nbsp;${gt}</div>${s.get.map(tbCard).join("")}</div>
    </div>
    <div style="text-align:center;margin-top:9px">${tag} <button class="btn primary" onclick="acceptSuggestion()">Accept</button> <button class="btn" onclick="respinSuggestion()">↻ Respin</button></div>`;
}
function respinSuggestion(){_sugg=genSuggestion();const el=document.getElementById('suggbox');if(el)el.innerHTML=renderSuggestion();}
function acceptSuggestion(){
  if(!_sugg)return;const s=_sugg;
  const give=s.give.map(a=>tbFind(a.aid)).filter(Boolean),get=s.get.map(a=>tbFind(a.aid)).filter(Boolean);
  if(give.length!==s.give.length||get.length!==s.get.length){toast("Offer expired — respinning");respinSuggestion();return;}
  give.forEach(giveAsset);get.forEach(getAsset);
  const sh=teamShortOf(s.team);_sugg=null;
  showBreaking(`${G.teamName} strike a deal with ${sh}`,_dlMode?'A deadline move — the town holds its breath.':'The clubhouse takes notice.');if(_dlMode)screenDeadline();else screenTrade();}
