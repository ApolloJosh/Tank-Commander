/* ============================================================
   PHASE 3 — DRAFT
   ============================================================ */
const POSALL=["C","1B","2B","3B","SS","LF","CF","RF","DH","SP","SP","RP"];
let _dq=null,_dpicks=null,_board=null;
function screenDraft(){
  if(!_dq){_dq=[...G.ownedPicks].sort((a,b)=>(a.round-b.round)||(pickResolvedSlot(a)-pickResolvedSlot(b)));_dpicks=[];}
  if(!_dq.length)return draftDone();
  const pk=_dq[0],slot=pickResolvedSlot(pk),rd=pk.round||1;
  // Survivor: fixed per-round odds, identical every year (no "draft MLB-ready late in a short rebuild" scaling).
  // 6-Year mode keeps the year-aware curve (you draft for readiness as the clock runs out).
  const advChance = G.mode==="survivor"
    ? ({1:0.08,2:0.15,3:0.22,4:0.30,5:0.38}[rd]||0.2)
    : (rd>=3?(G.year>=4?0.75:0.5):rd===2?(G.year>=4?0.6:0.3):(G.year>=4?0.5:G.year===3?0.25:0.08));
  const ps=[...POSALL];for(let i=ps.length-1;i>0;i--){const j=ri(0,i);[ps[i],ps[j]]=[ps[j],ps[i]];}
  _board=[];for(let i=0;i<10;i++)_board.push(draftee(slot,rd,Math.random()<advChance,ps[i%ps.length]));
  // Owner Mode: the GM recommends a pick (best ceiling, weighted toward roster needs + his scouting tier)
  if(G.owner){G.ownerStage='draft';
    const ns=needsSurplus();const want=new Set(ns.needs);const tier=G.owner.gmTier||0;
    let best=0,bestScore=-1;_board.forEach((p,i)=>{const s=p.pot+(want.has(p.pos)?7:0)+(p.advanced?2:0)+tier*0.5+Math.random()*1.5;if(s>bestScore){bestScore=s;best=i;}});
    G._gmRec=best;
    if(G._gmAutoDraft)return draftPick(best);
  }
  const rec=G.owner?G._gmRec:-1;
  render(`${header()}${stepbar(3)}
   ${(function(){const ns=needsSurplus();return `<div class="panel2" style="border:1px solid var(--line);border-radius:10px;padding:10px;margin:12px 0">
     <span class="small"><b style="color:var(--red)">Needs:</b> ${ns.needs.length?ns.needs.join(", "):'<span class="muted">none — roster is balanced</span>'} &nbsp;•&nbsp; <b style="color:var(--green)">Surplus:</b> ${ns.surplus.length?ns.surplus.join(", "):'<span class="muted">none</span>'}</span></div>`;})()}
   ${G.owner?`<div class="panel2" style="border:1px solid var(--gold);border-radius:10px;padding:10px;margin-bottom:10px">
     <span class="small">🎯 <b>GM ${G.owner.gmName}</b> recommends <b style="color:var(--gold)">${_board[rec].name}</b> (${_board[rec].pos}, ceiling ${_board[rec].pot}). Take his pick, override below, or let him run the rest.</span>
     <div class="row" style="gap:8px;margin-top:8px"><button class="btn primary sm" onclick="draftPick(${rec})">✅ Take GM's pick</button>
       <button class="btn sm" onclick="(function(){G._gmAutoDraft=true;screenDraft();})()">⏩ Let the GM finish the draft</button></div></div>`:''}
   <details class="panel" style="padding:12px"><summary style="cursor:pointer;font-weight:700">📋 Current roster <span class="small muted">(draft to fill your needs)</span></summary>
     <div style="margin-top:8px">${rosterMini()}</div></details>
   <div class="panel"><h3>Draft — <span class="pill gold">${pk.comp?'🎟️ Comp Pick':'Round '+rd+' pick #'+slot}</span> <span class="small muted">(${_dq.length} selection${_dq.length>1?'s':''} left)</span></h3>
     <p class="sub">Ceiling is a <b>scouted projection, not a promise</b> — most prospects fall short of it. ${rd===1?'Round-1 talents have the highest ceilings but take years.':'Later-round picks are longer shots; "MLB-ready" types contribute sooner.'}</p>
     <div class="scroll">${_board.map((p,i)=>`<div class="offer" style="padding:9px 12px;${i===rec?'border:1px solid var(--gold);border-radius:8px':''}"><div class="row" style="align-items:center">
        <div style="flex:2"><b>${p.name}</b> ${i===rec?'<span class="pill gold" style="padding:0 5px;font-size:9px">GM PICK</span>':''} <span class="small muted">${p.college}</span>
          <span class="small"><span class="pos">${p.pos}</span> age ${p.age} • ${p.ovr} OVR ${p.advanced?'<span class="pill green" style="padding:0 6px">MLB-ready</span>':'<span class="pill blue" style="padding:0 6px">project</span>'}</span></div>
        <div style="flex:1;text-align:right"><span class="pill ${ceilClass(p.pot)}">Ceiling ${p.pot}</span>
          <button class="btn primary sm" onclick="draftPick(${i})">Draft</button></div></div></div>`).join("")}</div></div>`);
}
function draftPick(i){const p=_board[i];p.loc="farm";p.src="draft";G.farm.push(p);_dpicks.push(p);_dq.shift();
  if(!G._gmAutoDraft)toast(`Drafted ${p.name}`);screenDraft();}
function draftDone(){
  G._gmAutoDraft=false;G._gmRec=null;
  const got=_dpicks||[];G.ownedPicks=freshDraftPicks().concat(G.pendingComp||[]);G.pendingComp=[];_dq=null;_dpicks=null;saveGame();
  render(`${header()}${stepbar(3)}
   <div class="panel center"><h3>Draft complete</h3>
     ${got.length?`<p>Added to your farm:</p><ul style="display:inline-block;text-align:left">${got.map(p=>`<li>${p.name} — ${p.advanced?'MLB-ready':'ceiling '+p.pot}</li>`).join("")}</ul>`:`<p class="muted">No picks (traded away).</p>`}</div>
   <div class="center"><button class="btn primary" onclick="goPhase(4)">Offseason development →</button></div>`);
}

