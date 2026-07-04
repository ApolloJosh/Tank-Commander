/* ============================================================
   WELCOME / ONBOARDING + FEEDBACK ("leave a note for the creator")
   ============================================================ */
const WELCOME_KEY="tankCommander_welcomed_v9";   // bumped for v9 so returning players see the Owner Mode + Hard Mode news once
const NEWPILL='<span class="pill gold" style="font-size:9px;padding:0 5px;vertical-align:middle;margin-left:3px">NEW</span>';
function bwExCard(c){
  if(!c)return '';
  const rm=BW_RAR[c.rar],cc=bwColor(c),gradCls=cc.kind==='irid'?'bwirid':cc.kind==='diamond'?'bwdiamond':'';
  const top=cc.kind==='irid'?'<div class="bwc-top irid"></div>':cc.kind==='diamond'?'<div class="bwc-top bdiamond"></div>':`<div class="bwc-top" style="background:${cc.col}"></div>`;
  const rlab=gradCls?`<span class="${gradCls}">${rm.name}</span>`:`<span style="color:${rm.col}">${rm.name}</span>`;
  const numHTML=gradCls?`<b class="${gradCls}">${c.ov}</b>`:`<b style="color:${cc.col}">${c.ov}</b>`;
  return `<div class="bwc ${c.rar===4?'hof':''}" style="cursor:default;width:84px;flex:0 0 auto">${top}
    <div class="bwc-r">${rlab}</div><div class="bwc-n">${c.name}</div>
    <div class="bwc-p">${c.pos} · ${numHTML}</div>
    <div class="bwc-s">🔥${c.vf} 💨${c.vo} 🌀${bwDeriveBR(c.id,c.ov)}${bwAbHTML(c)}</div></div>`;
}
function bwWelcomeCardRow(){
  const ex=[0,1,2,3,4].map(R=>SET1.cards.filter(c=>c.t==='H'&&c.rar===R).sort((a,b)=>b.ov-a.ov)[0]).filter(Boolean);
  return `<div style="display:flex;gap:6px;align-items:stretch;justify-content:center;overflow-x:auto;-webkit-overflow-scrolling:touch;padding:4px 2px;margin:8px 0">${ex.map(bwExCard).join('')}</div>`;
}
function bwWelcomeGo(where){try{localStorage.setItem(WELCOME_KEY,'1');}catch(e){}if(where==='platoon')screenPlatoon();else screenTitle();}
function screenWelcome(){
  bwEnsureStyles();
  render(`<div class="hero" style="padding-top:8px">
      <div class="pill" style="background:#1f3a1c;color:#9fe1cb">⚾ BETA</div>
      <h1 style="font-size:30px;margin:8px 0 4px">Baseball Tank Simulator</h1>
      <p class="sub" style="max-width:540px;margin:0 auto">Take over a washed-up ballclub as <b>General Manager</b> — tank for picks, develop talent, swing trades, and build a champion across a living 30-team league.</p>
    </div>
    <div class="panel" style="border-color:var(--gold);background:linear-gradient(180deg,rgba(201,162,39,0.10),transparent)">
      <div class="center"><div class="pill gold">⚔️ bWARfare · NEW</div>
        <h2 class="disp" style="margin:8px 0 2px;font-size:21px">Collect the set. Build a deck. Duel rivals.</h2>
        <p class="sub" style="max-width:500px;margin:4px auto 0">Every player is a collectible card — <b>Common all the way up to HOF</b>. Pull packs, build your squad, and battle. <b>Collect them all and duel rivals in PvP!</b></p></div>
      ${bwWelcomeCardRow()}
      <div class="center" style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center;font-size:12px;color:var(--dim)">
        <span>🎴 500-card set</span><span>·</span><span>🃏 30 / 10 / 12 deck</span><span>·</span><span>⚔️ Gauntlet</span><span>·</span><span>🌐 Rivals PvP</span></div>
      <div class="center" style="margin-top:10px"><button class="btn" onclick="bwWelcomeGo('platoon')">Open Platoon ▸</button></div>
    </div>
    <div class="center" style="margin:8px 0 14px"><button class="btn primary" style="font-size:17px;padding:14px 28px" onclick="bwWelcomeGo('home')">I'm ready for the job →</button>
      <p class="small muted" style="margin:8px auto 0;max-width:460px">This is a beta — when you finish a run you can leave a note for the creator with anything to fix, balance, or add.</p></div>
    <div class="panel" style="border-color:var(--gold);background:linear-gradient(180deg,rgba(201,162,39,0.06),transparent)">
      <h3 style="margin-top:0">🆕 New in v9</h3>
      <div class="panel2" style="border:1px solid var(--gold);border-radius:10px;padding:11px;margin-bottom:8px">
        <div class="disp" style="font-weight:700;font-size:15px;color:var(--gold)">💼 Owner Mode <span class="pill" style="padding:0 6px;background:#24351c;color:var(--gold);border:1px solid var(--line2);font-size:9px">ALPHA</span></div>
        <p class="small muted" style="margin:4px 0 0">A whole new way to play. Spend <b>$4 billion</b> to <b>buy a ballclub and build the stadium</b>, fund facilities, and hire your front office — then sit in the owner's box. <b>Steer your GM</b> with mandates and budgets, <b>veto his big trades</b>, and run the money: set <b>ticket, concession &amp; merch prices</b>, land <b>sponsorships</b>, and grow the franchise's value. Win titles, then <b>sell for the biggest profit</b> — or build a dynasty.</p></div>
      <div class="panel2" style="border:1px solid #c0392b;border-radius:10px;padding:11px">
        <div style="font-weight:800;color:#ff8a6b">🔥 Hard Mode — 6-Year Sprint</div>
        <p class="small muted" style="margin:4px 0 0">For veterans: a <b>tougher league</b>, <b>realistic injuries</b> with a real <b>Injured List</b>, a <b>deeper 5-round draft</b>, and <b>stricter grading</b> — with its own separate leaderboard. Pick it right under the 6-Year Sprint.</p></div>
    </div>`);
}
/* ---- feedback ---- */
function feedbackEnabled(){return !!AUTH_API;}
function openFeedback(){
  if(!feedbackEnabled()){toast("Feedback isn't switched on for this build yet");return;}
  const old=document.getElementById('saveov');if(old)old.remove();
  const ov=document.createElement('div');ov.id='saveov';ov.className='saveov';
  ov.innerHTML=`<div class="savebox">
    <div class="row" style="align-items:center"><h3 style="flex:1;margin:0">📝 Leave a note for the creator</h3><button class="btn ghost sm" onclick="document.getElementById('saveov').remove()">✕</button></div>
    <p class="sub">This is a beta — tell me what you loved, what felt off, and anything you'd add. It comes straight to me.</p>
    <textarea id="fbnote" class="savecode" style="height:120px;font-family:inherit;font-size:14px" placeholder="What worked, what didn't, ideas, bugs…"></textarea>
    <div class="center" style="margin-top:8px"><button class="btn primary" onclick="submitFeedback()">Send note ▶</button></div>
  </div>`;
  document.body.appendChild(ov);
}
async function submitFeedback(){
  const t=((document.getElementById('fbnote')||{}).value||"").trim();
  if(!t){toast("Write a note first");return;}
  let score=0,detail="";
  try{if(typeof G!=="undefined"&&G){
    if(G.mode==="survivor"){score=survFinalScore();detail=`${G.yearsServed||0} yrs · ${G.survTitles||0} titles · score ${Math.round(G.cumScore||0)}`;}
    else{const gr=computeGrade();score=gr.score;detail=`${gr.grade} (${gr.score}/100)`;}}}catch(e){}
  const a=(typeof authState==="function")?authState():null;
  try{
    await fetch(AUTH_API+"/feedback",{method:"POST",headers:{"Content-Type":"application/json"},
      body:JSON.stringify({note:t,mode:(typeof G!=="undefined"&&G&&G.mode)||"",score,detail,username:(a&&a.username)||"anon"})});
    const ov=document.getElementById('saveov');if(ov)ov.remove();
    toast("Thank you — note sent! 🙏");
  }catch(e){toast("Couldn't send — check your connection and try again");}
}

