/* ============================================================
   PHASE 1 — ROSTER (9 / 4 / 3)
   ============================================================ */
let _rosterMode='pre';
function slotRole(slot){return ROT_SLOTS.includes(slot)?'SP':PEN_SLOTS.includes(slot)?'RP':slot;}
function rCard(p,ctx){
  const decl=declineTag(p);
  const roleBtn = ctx==='slot' ? ` <button class="btn sm" title="Send to the bench" onclick="benchPlayer('${p.id}')">🪑 Bench</button>`
    : ctx==='bench' ? (openSlotFor(p)?` <button class="btn sm primary" title="Put him in the lineup" onclick="startPlayer('${p.id}')">▶ Start</button>`:'')
    : '';
  return `<span class="pcard" draggable="true" ondragstart="dragStart(event,'${p.id}')">${happyRing(p)}${(p.pot>p.ovr&&!decl)?' '+ceilMini(p.pot):''} <b>${p.name}</b>${customEmoji(p)}${fanFavEmoji(p)}${dawgEmoji(p)} <span class="small muted">${p.pos} ${p.age}y</span>${flexTag(p)}${tradeReqTag(p)}${decl}${dawgTag(p)}${duraTag(p)}${injTag(p)} <span class="small">${contractCell(p)}</span> ${statCardBtn(p)}${roleBtn}${p.years<=4?' '+extendSelect(p.id):''}${(p.age<=26&&p.pot>p.ovr+1)?` <button class="btn sm" title="Send to the minors to develop faster" onclick="sendDown('${p.id}')">↓ Farm</button>`:''}</span>`;
}
function rSlot(slot,p){
  return `<div class="slot" ondragover="allowDrop(event,'${slot}')" ondragleave="dropLeave(event)" ondrop="dropOn(event,'${slot}')">
    <span class="slotlbl">${slotRole(slot)}</span>${p?rCard(p,'slot'):'<span class="empty">— empty (replacement level) —</span>'}</div>`;
}
function screenRoster(){
  const a=buildActive(G.roster);
  const proj=warToWins(teamWAR(G.roster));
  const bench=G.roster.filter(p=>p.loc==="mlb"&&!p._il&&!a.used.has(p.id)).sort((x,y)=>y.ovr-x.ovr);
  const deadline=_rosterMode==='deadline';
  const hardbreak=_rosterMode==='hardbreak';
  const earlybreak=_rosterMode==='earlybreak';
  const playoff=_rosterMode==='playoff';
  const allstar=_rosterMode==='allstar'||hardbreak||earlybreak;
  render(`${header()}${(deadline||allstar||playoff)?'':stepbar(1)}
   ${deadline?'<div class="panel center" style="border-color:var(--gold)"><div class="pill gold">⏳ POST-DEADLINE ROSTER</div><p class="sub" style="margin-top:6px">Slot in anyone you just acquired and set your lineup.'+infoDot('Traded-for players land on your MLB roster or in the minors depending on readiness — promote or send them down below as you like.')+'</p></div>':''}
   ${playoff?'<div class="panel center" style="border-color:var(--gold)"><div class="pill gold">🏆 PLAYOFFS — SET YOUR OCTOBER ROSTER</div><p class="sub" style="margin-top:6px">You\'re in! Set the lineup and rotation to ride into the bracket.'+infoDot('Promote a hot prospect, bench anyone banged up, and stack your DAWG and chemistry edge. Injured-list players stay out until next spring.')+'</p></div>':''}
   ${allstar?'<div class="panel center" style="border-color:var(--gold)"><div class="pill gold">⭐ ALL-STAR BREAK ROSTER</div><p class="sub" style="margin-top:6px">Halfway home — promote anyone ready from the farm and reset your lineup before the stretch run.</p></div>':''}
   <div class="grid4">
     <div class="kpi"><div class="big">${proj}</div><div class="lbl">Projected Wins</div></div>
     <div class="kpi"><div class="big">${G.farm.length}</div><div class="lbl">Farm Prospects</div></div>
     <div class="kpi"><div class="big">$${payroll(G.roster)}M</div><div class="lbl">Payroll</div></div>
     <div class="kpi"><div class="big" style="font-size:18px"><span style="color:${teamDawg()>=62?'var(--gold)':'var(--ink)'}">🐶 ${Math.round(teamDawg())}</span> <span style="color:${happyColor(teamChem())}">🤝 ${Math.round(teamChem())}</span></div><div class="lbl">DAWG / Chemistry (Oct. edge)</div></div>
   </div>
   <div class="panel">
     <div class="row" style="align-items:center;justify-content:space-between;gap:10px">
       <p class="sub" style="margin:0;flex:1"><b>Drag a player onto an eligible slot</b> to set your lineup — a <span class="pill blue" style="padding:0 5px">↔</span> tag means he can flex elsewhere. A filled slot won't take a drop: drag its player to the <b>Bench</b> first to free it. ${G.manualLineup?'<span style="color:var(--gold)">Manual mode on — empty slots play at replacement level.</span>':'Slots are on <b>auto</b> until you move someone.'}</p>
       ${G.manualLineup?`<button class="btn sm ghost" onclick="resetLineup()">⟳ Back to auto-fill</button>`:''}
     </div>
     <div class="sectlbl">Lineup (9)</div>
     <div class="slots">${LINEUP.map(s=>rSlot(s,a.lineup[s])).join("")}</div>
     <div class="sectlbl">Rotation (5 SP)</div>
     <div class="slots">${ROT_SLOTS.map((s,i)=>rSlot(s,a.rotation[i])).join("")}</div>
     <div class="sectlbl">Bullpen (3 RP)</div>
     <div class="slots">${PEN_SLOTS.map((s,i)=>rSlot(s,a.pen[i])).join("")}</div>
     <div class="sectlbl">Bench / depth <span class="small muted">(tap <b>▶ Start</b> to slot a player in, or <b>🪑 Bench</b> a starter — drag works too)</span></div>
     <div class="benchzone" ondragover="allowDropBench(event)" ondragleave="dropLeave(event)" ondrop="dropBench(event)">
       ${bench.length?bench.map(p=>rCard(p,'bench')).join(""):'<span class="empty">No bench bodies — every MLB player is in your lineup.</span>'}</div>
   </div>
   ${ilSection()}
   <div class="panel">
     <h3>⬆️ Farm system</h3>
     <p class="sub">Promote prospects when ready (≈62+ OVR contributes). <b style="color:var(--gold)">They develop fastest in the minors.</b>${infoDot('Ceiling is a scouted projection — not every prospect reaches it. Calling players up early slows their growth, so leave them to cook in the minors when you can.')}</p>
     <div class="scroll">${farmTable()}</div>
   </div>
   <div class="center" style="margin-top:14px"><button class="btn primary" onclick="${playoff?'startPlayoffs()':deadline?'doSeason()':hardbreak?'screenHardBreak()':earlybreak?'screenEarlyBreak()':_rosterMode==='allstar'?'screenAllStar()':'goPhase(2)'}">${playoff?'Start the playoffs 🏆':deadline?'Play out the season ▶':allstar?'← Back to the break':'Lock roster → Play ⚾'}</button></div>`);
}
function contractCell(p){return `<span class="yrs ${p.years<=1?'exp':'muted'}">$${p.salary}M • ${p.years}yr${p.years<=1?' ⚠':''}</span>`;}
function duraTag(p){if(p.dura==null)return '';
  if(p.dura<50)return ` <span class="pill red" style="padding:0 6px">🩹 Fragile ${p.dura}</span>`;
  if(p.dura>85)return ` <span class="pill green" style="padding:0 6px">💪 Iron ${p.dura}</span>`;return '';}
function injTag(p){return p.inj?` <span class="pill ${p.injType==='long'?'red':''}" style="padding:0 6px">🩹 ${p.injType==='long'?'long':'short'} ~${p.inj}g</span>`:'';}
function strengthWeakTags(p){
  if(!p.attr)return '';
  const keys=isPit(p)?PIT_ATTRS:HIT_ATTRS;const out=[];
  keys.forEach(k=>{const v=attrVal(p,k);
    if(v>=85)out.push(`<span class="pill green" style="padding:0 5px;font-size:10px">${ATTR_LABEL[k]} ${v}</span>`);
    else if(v<=50)out.push(`<span class="pill red" style="padding:0 5px;font-size:10px">${ATTR_LABEL[k]} ${v}</span>`);});
  return out.length?' '+out.join(''):'';
}
function attrTags(p){return strengthWeakTags(p);}
function flexTag(p){const x=[...flexPositions(p)].filter(s=>s!==p.pos);
  return x.length?` <span class="pill blue" style="padding:0 5px;font-size:10px">↔ ${x.join('/')}</span>`:'';}
let _dragId=null;
function dragStart(ev,id){_dragId=id;try{ev.dataTransfer.setData('text/plain',id);ev.dataTransfer.effectAllowed='move';}catch(e){}}
function dropLeave(ev){ev.currentTarget.classList.remove('drop-ok');}
function allowDrop(ev,slot){const p=G.roster.find(x=>x.id===_dragId);if(p&&eligibleForSlot(p,slot)){ev.preventDefault();ev.currentTarget.classList.add('drop-ok');}}
function allowDropBench(ev){if(_dragId){ev.preventDefault();ev.currentTarget.classList.add('drop-ok');}}
function ensureManual(){if(G.manualLineup)return;const a=buildActive(G.roster);G.lineupSet={};
  LINEUP.forEach(s=>{if(a.lineup[s])G.lineupSet[s]=a.lineup[s].id;});
  ROT_SLOTS.forEach((s,i)=>{if(a.rotation[i])G.lineupSet[s]=a.rotation[i].id;});
  PEN_SLOTS.forEach((s,i)=>{if(a.pen[i])G.lineupSet[s]=a.pen[i].id;});
  G.manualLineup=true;}
// shared move logic used by BOTH drag-and-drop (mouse) and tap-to-move (touch)
function moveToSlot(id,slot){const p=G.roster.find(x=>x.id===id);if(!p)return false;
  if(!eligibleForSlot(p,slot)){toast(`${p.name} can't play ${slotRole(slot)}`);return false;}
  ensureManual();
  const occ=G.lineupSet[slot];
  // only a VALID, still-rostered occupant counts — clear stale ids (traded/sent-down players) so the slot is usable
  const occValid=occ&&occ!==id&&G.roster.some(x=>x.loc==="mlb"&&x.id===occ);
  if(occ&&!occValid&&occ!==id)delete G.lineupSet[slot];
  if(occValid){toast("That slot's taken — bench its player first");return false;}
  Object.keys(G.lineupSet).forEach(s=>{if(G.lineupSet[s]===id)delete G.lineupSet[s];});
  G.lineupSet[slot]=id;saveGame();return true;}
function moveToBench(id){if(!id)return;ensureManual();Object.keys(G.lineupSet).forEach(s=>{if(G.lineupSet[s]===id)delete G.lineupSet[s];});saveGame();}
function dropOn(ev,slot){ev.preventDefault();const id=_dragId;_dragId=null;moveToSlot(id,slot);screenRoster();}
function dropBench(ev){ev.preventDefault();const id=_dragId;_dragId=null;moveToBench(id);screenRoster();}
// the most fitting OPEN slot a bench player could step into (his own position first, then a flex spot) — null if none
function openSlotFor(p){
  if(!p||p.loc!=="mlb")return null;
  const a=buildActive(G.roster);
  const isEmpty=s=>ROT_SLOTS.includes(s)?!a.rotation[ROT_SLOTS.indexOf(s)]:PEN_SLOTS.includes(s)?!a.pen[PEN_SLOTS.indexOf(s)]:!a.lineup[s];
  const open=[...LINEUP,...ROT_SLOTS,...PEN_SLOTS].filter(s=>eligibleForSlot(p,s)&&isEmpty(s));
  if(!open.length)return null;
  return open.find(s=>s===p.pos||slotRole(s)===p.pos)||open[0];
}
function benchPlayer(id){moveToBench(id);screenRoster();}
function startPlayer(id){const p=G.roster.find(x=>x.id===id);if(!p)return;const slot=openSlotFor(p);
  if(!slot){toast(`No open spot for ${p.name} — bench someone first`);return;}
  moveToSlot(id,slot);screenRoster();}
function resetLineup(){G.lineupSet={};G.manualLineup=false;saveGame();screenRoster();}
function depthRow(p){return `<tr><td><span class="pos">${p.pos}</span> ${p.name} <span class="small muted">age ${p.age}</span>${flexTag(p)}${duraTag(p)}${attrTags(p)}</td>
  <td class="num">${ovrHTML(p.ovr)}${p.pot>p.ovr?' '+ceilMini(p.pot):''}</td><td class="num">${contractCell(p)}</td>
  <td class="num"><button class="btn sm" onclick="sendDown('${p.id}')">↓Farm</button></td></tr>`;}
function farmTable(){
  if(!G.farm.length)return `<p class="muted">Empty. Trade for prospects and draft to fill it.</p>`;
  return `<p class="small muted" style="margin:0 0 6px">💡 You can <b>lock up</b> a prospect now (any term) — it's priced between his current ability and ceiling, so it's a bargain if he hits and dead money if he busts. ${G.farm.some(p=>p.locked)?'<span style="color:var(--gold)">🔒 = signed long-term.</span>':''}</p>
   <table><thead><tr><th>Prospect</th><th class="num">Age</th><th class="num">OVR</th><th class="num">Ceil</th><th></th><th></th></tr></thead><tbody>${
    G.farm.sort((a,b)=>b.pot-a.pot).map(p=>`<tr>
      <td><span class="pos">${p.pos}</span> ${p.name}${p.locked?' 🔒':''}${p.college?` <span class="small muted">(${p.college})</span>`:''}${p.locked?` <span class="small muted">$${p.salary}M·${p.years}yr</span>`:''}</td>
      <td class="num">${p.age}</td><td class="num">${ovrHTML(p.ovr)}</td>
      <td class="num"><span class="pill ${ceilClass(p.pot)}">${p.pot}</span></td>
      <td class="num">${statCardBtn(p)} ${extendSelect(p.id)}</td>
      <td class="num"><button class="btn sm ${p.ovr>=62?'primary':''}" onclick="promote('${p.id}')">Promote ↑</button> <button class="btn sm" style="border-color:#5a2d2d;color:#d98a8a" title="Release this prospect" onclick="releaseFarm('${p.id}')">✕ Release</button></td></tr>`).join("")}</tbody></table>`;
}
function releaseFarm(pid){const p=G.farm.find(x=>x.id===pid);if(!p)return;
  if(!confirm(`Release ${p.name} (${p.pos}, ${p.ovr} OVR)? He leaves your organization for good.`))return;
  G.farm=G.farm.filter(x=>x.id!==pid);toast(`${p.name} released.`);try{saveGame();}catch(e){}screenRoster();
}
function promoteCore(pid){const p=G.farm.find(x=>x.id===pid);if(!p)return;G.farm=G.farm.filter(x=>x.id!==pid);
  p.loc="mlb";p.prospect=false;if(p.years<2)p.years=6;p.mlbYears=p.mlbYears||1;if(!p.locked)p.salary=salaryFor(p.ovr,p.mlbYears,p.pos);p.happy=clamp(happyVal(p)+10,0,95);G.roster.push(p);toast(`${p.name} called up!`);}
function promote(pid){promoteCore(pid);screenRoster();}
function sendDown(pid){const p=G.roster.find(x=>x.id===pid);if(!p)return;G.roster=G.roster.filter(x=>x.id!==pid);
  p.loc="farm";if(p.ovr>=70)p.happy=clamp(happyVal(p)-12,0,100);G.farm.push(p);toast(`${p.name} sent down`);screenRoster();}

