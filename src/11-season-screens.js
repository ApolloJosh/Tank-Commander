/* ============================================================
   PHASE 2 — SEASON
   ============================================================ */
let _res=null;
function screenSeason(){
  if(G.seasonStage===1.5)return screenMedia();   // resume at the press conference after a reload
  if(G.seasonStage===1.7)return screenAllStar();   // resume at the All-Star break after a reload
  if(G.seasonStage===0.7)return screenEarlyBreak();   // resume at the early Hard Mode roster check
  if(G.seasonStage===1.3)return screenHardBreak();   // resume at the late Hard Mode roster check
  if(G.seasonStage===1)return screenDeadline();   // resume at the deadline after a reload
  if(G.seasonStage===2){_rosterMode='deadline';return screenRoster();}   // resume at post-deadline roster
  if(G.seasonStage===2.8){_rosterMode='playoff';return screenRoster();}   // resume at the set-your-playoff-roster break
  render(`${header()}${stepbar(2)}
   <div class="panel center"><h3>Season ${G.year}</h3>
     <p class="sub">Roster locked. Two in-season decision points are coming up — a <b>service-time call-up window</b> (game 20) and the <b>trade deadline</b> (game 110) — before the season plays out.</p>
     <button class="btn primary" style="font-size:16px;padding:14px 26px" onclick="beginSeason()">▶ Start the season</button></div>`);
}
function beginSeason(){if(G.hard&&G._injRolled!==G.year)rollSeasonInjuries();G.seasonStage=0;G._prevWins=G.lastWins;fmSeasonInit();saveGame();
  fmSeasonTick(20,{name:'SERVICE-TIME WINDOW',sub:'Call up a prospect now and his clock starts — wait, and you keep the extra year of control.',enterLab:'Review call-ups',
    enter:()=>screenServiceTime(),skip:()=>afterServiceTime()});}
// Injured List — long-term injuries that take a player off the active roster
function ilSection(){
  const il=G.roster.filter(p=>p.loc==="mlb"&&p._il);
  if(!il.length)return '';
  return `<div class="panel2" style="border:1px solid var(--red);border-radius:10px;padding:9px;margin-bottom:8px">
    <div class="small" style="font-weight:700;color:var(--red)">🏥 Injured List — ${il.length}</div>
    <div class="small muted" style="margin-top:3px">Out long-term — they're off the active lineup (and free up the spot). Call up replacements; they return healthy next season.</div>
    <div style="margin-top:4px">${il.map(p=>`<div class="small">${p.pos} <b>${p.name}</b> ${ovrHTML(p.ovr)} · ~${p.inj}g out 🩹</div>`).join("")}</div></div>`;
}
// Hard Mode injury report — shown at every break so you can call up cover
function injuryReport(){
  if(!G.hard)return '';
  const dtd=G.roster.filter(p=>p.loc==="mlb"&&(p.inj||0)>0&&!p._il).sort((a,b)=>b.inj-a.inj);
  let out='';
  if(dtd.length)out+=`<div class="panel2" style="border:1px solid var(--gold);border-radius:10px;padding:9px;margin-bottom:8px">
    <div class="small" style="font-weight:700;color:var(--gold)">🤕 Day-to-day — ${dtd.length}</div>
    <div class="small muted" style="margin-top:3px">${dtd.map(p=>`${p.pos} ${p.name} (~${p.inj}g, plays through it)`).join(' · ')}</div></div>`;
  out+=ilSection();
  if(!out)out=`<div class="panel2" style="border:1px solid var(--green);border-radius:10px;padding:9px;margin-bottom:8px"><div class="small">🏥 <b>Injury report:</b> a clean bill of health right now.</div></div>`;
  return out;
}
/* ---- mid-season stop 1: service time (game 20) ---- */
function screenServiceTime(){
  const farm=G.farm.slice().sort((a,b)=>b.pot-a.pot);
  render(`${header()}
   <div class="panel center" style="border-color:var(--blue)">
     <div class="pill blue">📈 Game 20 of 162</div>
     <h2 style="margin:6px 0">Service Time Manipulation</h2>
     <p class="sub">Call up your player at this point of the season and it won't count as a contract year!</p></div>
   ${injuryReport()}
   <div class="panel"><h3>⬆️ Your farm</h3>
     ${farm.length?`<div class="scroll"><table><thead><tr><th>Prospect</th><th class="num">Age</th><th class="num">OVR</th><th class="num">Ceil</th><th></th></tr></thead><tbody>${
       farm.map(p=>`<tr><td><span class="pos">${p.pos}</span> ${p.name}</td><td class="num">${p.age}</td><td class="num">${ovrHTML(p.ovr)}</td><td class="num"><span class="pill ${ceilClass(p.pot)}">${p.pot}</span></td>
       <td class="num"><button class="btn sm ${p.ovr>=62?'primary':''}" onclick="promoteService('${p.id}')">Call up ⚑ no service hit</button></td></tr>`).join("")}</tbody></table></div>`:'<p class="muted">Your farm is empty — nothing to call up.</p>'}
   </div>
   <details class="panel" style="padding:12px"><summary style="cursor:pointer;font-weight:700">📋 Current roster</summary><div style="margin-top:8px">${rosterMini()}</div></details>
   <div class="center" style="margin-top:14px"><button class="btn primary" onclick="afterServiceTime()">Continue ▶</button></div>`);
}
function promoteService(pid){const p=G.farm.find(x=>x.id===pid);if(!p)return;G.farm=G.farm.filter(x=>x.id!==pid);
  p.loc="mlb";if(p.years<2)p.years=6;p.mlbYears=p.mlbYears||1;p._svcHold=true;p.salary=salaryFor(p.ovr,p.mlbYears,p.pos);G.roster.push(p);
  toast(`${p.name} called up — service-time hold (no year burned)`);screenServiceTime();}
function afterServiceTime(){
  if(G.mode==="survivor"&&!G.owner&&G.year>=2&&!G._mediaAnswered&&Math.random()<0.6){
    G._mediaQ=pickMediaQuestion();saveGame();
    return fmSeasonTick(45,{name:'PRESS CONFERENCE',sub:'The beat writers want a word. Skipping reads as “no comment” — fans notice.',enterLab:'Take the podium',
      enter:()=>{G.seasonStage=1.5;G._mediaAnswered=false;saveGame();screenMedia();},
      skip:()=>{try{const fd=fanChange(-3,"Press conference"),od=favorChange(-2,"Press conference");}catch(e){}G._mediaAnswered=true;saveGame();fmToAllStar();}});
  }
  if(G.hard)return fmSeasonTick(50,{name:'ROSTER CHECK',sub:'Hard Mode wears a roster down — injuries and cover need managing.',enterLab:'Check the trainer’s room',
    enter:()=>{G.seasonStage=0.7;saveGame();screenEarlyBreak();},skip:()=>fmToAllStar()});
  fmToAllStar();}
/* ---- mid-season stop ~1.7: All-Star Break (game 81) + in-season development ---- */
function developInSeason(mult){   // a half-season of reps: young players grow toward their ceiling mid-year too
  const dev=(G.resources?G.resources.development:0.333);const notes=[];
  G.roster.concat(G.farm).forEach(p=>{
    if(p.age>26)return;
    if(p.realCeil==null)p.realCeil=Math.max(p.ovr,p.pot);
    const t=Math.min(p.realCeil,p.pot);if(t<=p.ovr)return;
    const onFarm=p.loc==="farm";
    const devMult=(onFarm?(0.55+dev*1.7):(0.6+dev*0.6))*mult;
    const before=p.ovr;
    const g=Math.max(0,(t-p.ovr))*rnd(0.30,0.55)*devMult;
    if(g>=0.5){p.ovr=clamp(round(p.ovr+g),28,99);
      if(p.ovr>before)notes.push({name:p.name,pos:p.pos,from:before,to:p.ovr,ready:onFarm&&p.ovr>=66&&before<66});}
  });
  return notes;
}
function computeAllStars(){
  G.roster.forEach(p=>p._allStarThisYear=false);
  const mlb=G.roster.filter(p=>p.loc==="mlb").sort((a,b)=>warOfC(b)-warOfC(a));
  let n=0;
  mlb.forEach(p=>{const o=p.ovr;
    let ch=o>=90?0.96:o>=86?0.8:o>=82?0.55:o>=78?0.25:o>=74?0.08:0.01;
    if(n>=6)ch*=0.3;   // a single club can't send its whole roster
    if(Math.random()<ch){p._allStarThisYear=true;p._allStar=(p._allStar||0)+1;n++;p.happy=clamp(happyVal(p)+5,0,98);}
  });
}
function screenAllStar(){
  if(G._allStarYear!==G.year){computeAllStars();G._asDevNotes=developInSeason(0.45);G._allStarYear=G.year;saveGame();}
  const stars=G.roster.filter(p=>p._allStarThisYear).sort((a,b)=>b.ovr-a.ovr);
  const dev=(G._asDevNotes||[]);
  const farm=G.farm.slice().sort((a,b)=>b.ovr-a.ovr);
  render(`${header()}
    <div class="panel center" style="border-color:var(--gold)">
      <div class="pill gold">⭐ ALL-STAR BREAK · Game 81 of 162</div>
      <h2 style="margin:6px 0">The Midsummer Classic</h2>
      ${stars.length?`<p class="sub">Voted in for ${G.teamName}:</p>
        <div style="margin-top:6px">${stars.map(p=>`<span class="pill gold" style="margin:3px;padding:3px 9px">⭐ ${p.pos} ${p.name} <span class="small">${p.ovr}</span></span>`).join("")}</div>`
        :`<p class="sub">No ${G.teamName} players were voted in this year — something to play for in the second half.</p>`}
    </div>
    ${injuryReport()}
    ${dev.length?`<div class="panel"><h3>📈 Midseason risers</h3>
      <p class="small muted">A half-season of development pays off — these young players took a step forward:</p>
      <div>${dev.slice().sort((a,b)=>(b.to-b.from)-(a.to-a.from)).slice(0,10).map(d=>`<div class="small" style="margin:2px 0">${d.pos} <b>${d.name}</b> ${d.from} → <b style="color:var(--green)">${d.to}</b>${d.ready?' <span class="pill green" style="padding:0 5px">now MLB-ready</span>':''}</div>`).join("")}</div></div>`:''}
    <div class="panel"><h3>⬆️ Call up from the farm</h3>
      ${farm.length?`<div class="scroll"><table><thead><tr><th>Prospect</th><th class="num">Age</th><th class="num">OVR</th><th class="num">Ceil</th><th></th></tr></thead><tbody>${
        farm.map(p=>`<tr><td><span class="pos">${p.pos}</span> ${p.name}</td><td class="num">${p.age}</td><td class="num">${ovrHTML(p.ovr)}</td><td class="num"><span class="pill ${ceilClass(p.pot)}">${p.pot}</span></td>
        <td class="num"><button class="btn sm ${p.ovr>=66?'primary':''}" onclick="asCallUp('${p.id}')">Call up</button></td></tr>`).join("")}</tbody></table></div>`:'<p class="muted">Your farm is empty — nothing to call up.</p>'}
    </div>
    <details class="panel" style="padding:12px"><summary style="cursor:pointer;font-weight:700">📋 Current roster</summary><div style="margin-top:8px">${rosterMini()}</div></details>
    <div class="center" style="margin-top:12px">
      <button class="btn" onclick="(function(){_rosterMode='allstar';screenRoster();})()">✏️ Adjust lineup &amp; roster</button>
      <button class="btn primary" onclick="afterAllStar()">Continue to the trade deadline ▶</button></div>`);
}
function asCallUp(pid){promoteCore(pid);screenAllStar();}
function afterAllStar(){_rosterMode='';
  const go=()=>{
    if(G.hard)return fmSeasonTick(95,{name:'ROSTER CHECK',sub:'Down the stretch — patch holes and reset the lineup before the deadline.',enterLab:'Check the trainer’s room',
      enter:()=>{G.seasonStage=1.3;saveGame();screenHardBreak();},skip:()=>fmToDeadline()});
    fmToDeadline();};
  if(G._decideYear!==G.year){G._decideYear=G.year;saveGame();try{return showDecision(go);}catch(e){}}
  go();}
// shared Hard Mode roster-check break (injury report + IL + call-ups + adjust roster)
function rosterCheckBreak(o){
  const farm=G.farm.slice().sort((a,b)=>b.ovr-a.ovr);
  render(`${header()}
    <div class="panel center" style="border-color:#c0392b">
      <div class="pill" style="background:#3a1414;color:#ff8a6b">${o.pill}</div>
      <h2 style="margin:6px 0">${o.title}</h2>
      <p class="sub">${o.sub}</p></div>
    ${injuryReport()}
    <div class="panel"><h3>⬆️ Call up from the farm</h3>
      ${farm.length?`<div class="scroll"><table><thead><tr><th>Prospect</th><th class="num">Age</th><th class="num">OVR</th><th class="num">Ceil</th><th></th></tr></thead><tbody>${
        farm.map(p=>`<tr><td><span class="pos">${p.pos}</span> ${p.name}</td><td class="num">${p.age}</td><td class="num">${ovrHTML(p.ovr)}</td><td class="num"><span class="pill ${ceilClass(p.pot)}">${p.pot}</span></td>
        <td class="num"><button class="btn sm ${p.ovr>=66?'primary':''}" onclick="(function(){promoteCore('${p.id}');${o.reRender}();})()">Call up</button></td></tr>`).join("")}</tbody></table></div>`:'<p class="muted">Your farm is empty.</p>'}
    </div>
    <details class="panel" style="padding:12px"><summary style="cursor:pointer;font-weight:700">📋 Current roster</summary><div style="margin-top:8px">${rosterMini()}</div></details>
    <div class="center" style="margin-top:12px">
      <button class="btn" onclick="(function(){_rosterMode='${o.backMode}';screenRoster();})()">✏️ Adjust lineup &amp; roster</button>
      <button class="btn primary" onclick="${o.onContinue}">${o.continueLabel}</button></div>`);
}
function screenEarlyBreak(){rosterCheckBreak({pill:'🔥 ROSTER CHECK · Game 50 of 162',title:'The grind sets in',
  sub:'Hard Mode wears a roster down. Check the injury report, call up cover, and set your lineup before the All-Star break.',
  backMode:'earlybreak',reRender:'screenEarlyBreak',continueLabel:'On to the All-Star Break ▶',
  onContinue:"(function(){_rosterMode='';fmToAllStar();})()"});}
function screenHardBreak(){rosterCheckBreak({pill:'🔥 ROSTER CHECK · Game 95 of 162',title:'Down the stretch',
  sub:'Patch the holes, call up reinforcements, and reset your lineup before the trade deadline.',
  backMode:'hardbreak',reRender:'screenHardBreak',continueLabel:'On to the trade deadline ▶',
  onContinue:"(function(){_rosterMode='';fmToDeadline();})()"});}
/* ---- mid-season stop 1.5 (Survivor): media press conference ---- */
function mediaSituation(){const proj=projWinsNow(),pay=payroll(G.roster);
  if(proj>=90||G.lastPlayoffYear===G.year-1)return 'contend';
  if(pay>=220)return 'spend';
  if(pay<120)return 'cheap';
  if(proj<=74)return 'rebuild';
  return 'direction';}
const MEDIA_Q={
  contend:{text:"Your club is built to win right now and the city can feel it. What's your message to a fan base dreaming of a deep October run?",ph:"e.g. We owe this city our best. Our guys are ready, and we won't hold anything back…"},
  rebuild:{text:"Another long season looks likely. How do you sell this rebuild to fans who are running out of patience?",ph:"e.g. I get the frustration — but the young core is close, and the future here is bright…"},
  spend:{text:"Ownership has opened the checkbook like never before. Is this a real win-now push, or pressure you can't afford to fumble?",ph:"e.g. We're spending because this city deserves a winner, and we intend to deliver one…"},
  cheap:{text:"Fans are grumbling that the payroll is among the league's lowest. What do you say to them?",ph:"e.g. Every dollar is going into a plan — watch the farm system, the wins are coming…"},
  direction:{text:"Six weeks in — where is this franchise actually headed?",ph:"e.g. We're building something that lasts. Here's what fans should watch for…"}};
function pickMediaQuestion(){const s=mediaSituation();return Object.assign({id:s},MEDIA_Q[s]);}
// preset answers — one per "direction." Each: {label, line, fan, owner, expect?, claimsPlan?, note?}
const MEDIA_OPTS={
  contend:[
    {label:"🔥 Promise a deep run",line:"This is our year. I promise this city a deep October run — anything less is a failure.",fan:7,owner:5,expect:true,note:"A bold promise — fans roar, but the bar just went up."},
    {label:"⚖️ Stay humble",line:"We're good, but we'll let our play do the talking. One game at a time.",fan:3,owner:3,note:"Measured and professional."},
    {label:"❤️ Do it for the city",line:"Our fans have waited long enough. We are going all-out for them this year.",fan:6,owner:2,note:"You put the fans first."}],
  rebuild:[
    {label:"🌱 Sell the plan",line:"I know it's hard. But our young core is close, and the future here is bright.",fan:5,owner:1,claimsPlan:true,note:"You asked the fans for patience."},
    {label:"🗣️ Be brutally honest",line:"We're not there yet. This year is about development, not wins. I won't lie to you.",fan:2,owner:-1,note:"Fans respect the honesty; the owner less so."},
    {label:"😤 Defy the doubters",line:"Everyone's counting us out. I think we shock some people and make a push.",fan:5,owner:4,expect:true,note:"A gutsy promise from a rebuilding club."}],
  spend:[
    {label:"🔥 All-in to win",line:"We spent to win, and we intend to deliver. No excuses this year.",fan:5,owner:4,expect:true,note:"You staked the season on it."},
    {label:"📈 A real investment",line:"This is a long-term investment in a winner, not a one-year gamble.",fan:3,owner:2,note:"Steady and reassuring."},
    {label:"❤️ For the fans",line:"Ownership opened the checkbook because this city deserves a winner.",fan:6,owner:1,note:"Fans love the spending talk."}],
  cheap:[
    {label:"🌱 Point to the farm",line:"Every dollar is going into a plan — watch our farm system, the wins are coming.",fan:4,owner:1,claimsPlan:true,note:"You pointed fans toward the future."},
    {label:"😤 Promise value anyway",line:"Low payroll or not, I promise you we'll be in the race this year.",fan:4,owner:3,expect:true,note:"A bold claim on a tight budget."},
    {label:"🤷 It's ownership's call",line:"Payroll is an ownership decision. I focus on the players I've got.",fan:-5,owner:-2,note:"Fans hate the deflection."}],
  direction:[
    {label:"🏗️ Build to last",line:"We're building something sustainable — a real contender, not a one-year wonder.",fan:3,owner:1,note:"A patient, long-view answer."},
    {label:"🔥 Win now",line:"The window is open and I promise we'll chase it — playoffs or bust.",fan:5,owner:4,expect:true,note:"You set the bar high."},
    {label:"❤️ Listen to the fans",line:"We hear the fans. Everything we do is to bring this city a winner.",fan:5,owner:1,note:"You spoke to the fanbase."}]};
function applyMediaChoice(i){
  const q=G._mediaQ||pickMediaQuestion();const o=(MEDIA_OPTS[q.id]||[])[i];if(!o)return;
  let fan=o.fan,owner=o.owner||0;const notes=[];
  if(o.claimsPlan&&youngCorePlan()<2){fan=Math.min(fan,-2);owner=Math.min(owner,0);notes.push("You pointed to a plan — but the farm is bare, and fans aren't buying it.");}
  else if(o.note)notes.push(o.note);
  const fd=fanChange(fan,"Press conference"),od=favorChange(owner,"Press conference");
  if(o.expect){G._mediaPromise=true;G._mediaPromiseYear=G.year;}
  G._mediaResult={fan:fd,owner:od,notes:notes.length?notes:["The room takes down your words."],answer:o.line,expect:o.expect};
  G._mediaAnswered=true;saveGame();screenMediaResult();}
function gradeMediaAnswer(text){
  const t=(text||"").toLowerCase();const has=(...ws)=>ws.some(w=>t.includes(w));
  const words=t.trim().split(/\s+/).filter(Boolean).length;
  if(words<3)return {fan:-3,owner:-3,expect:false,notes:["A non-answer — the room groans and moves on."]};
  let fan=0,owner=0,expect=false;const notes=[];
  if(has("don't care","dont care","whatever","not my fault","blame","excuse","no comment","shut up","stupid","idiot","relax","calm down")){fan-=8;owner-=5;notes.push("Dismissive and combative — that won't go over well.");}
  if(has("fan","city","supporters","loyal","faithful","stadium","ballpark","community","this town","you all","fanbase")){fan+=5;notes.push("You spoke directly to the fans.");}
  if(has("win","champion","ring","compete","contend","proud","believe","trust","fight","best","relentless")){fan+=4;owner+=3;notes.push("Confident, ambitious tone.");}
  if(has("future","young","develop","prospect","build","plan","patient","core","long-term","foundation","sustainable")){fan+=3;owner+=1;notes.push("You laid out a clear plan.");}
  if(has("spend","invest","sign","go get","aggressive","reinforcements")){fan+=3;notes.push("Fans liked the aggressive talk.");}
  if(has("rebuild","retool","tear down","step back","not this year","take our time")){owner-=1;fan+=youngCorePlan()>=3?3:-1;notes.push("Honest about a step back.");}
  if(has("guarantee","promise","we will win","world series","championship this","make the playoffs","going to win","book it","october this year")){fan+=5;owner+=4;expect=true;notes.push("A bold promise — the bar just went up.");}
  fan=clamp(Math.round(fan),-10,12);owner=clamp(Math.round(owner),-8,8);
  if(!notes.length)notes.push("A measured, middle-of-the-road answer.");
  return {fan,owner,expect,notes};}
function screenMedia(){
  if(G._mediaAnswered)return screenMediaResult();
  const q=G._mediaQ||pickMediaQuestion();
  const opts=MEDIA_OPTS[q.id]||[];
  const optBtns=opts.map((o,i)=>`<button class="btn" style="display:block;width:100%;text-align:left;margin:6px 0;padding:10px 12px;white-space:normal" onclick="applyMediaChoice(${i})">
      <b>${o.label}</b><div class="small muted" style="margin-top:2px;font-style:italic">"${o.line}"</div></button>`).join("");
  render(`${survivorHeader()}
    <div class="panel center" style="border-color:#6f4fa0">
      <div class="pill" style="background:#3a2a55;color:#d9b3ff">🎙️ MID-SEASON PRESS CONFERENCE</div>
      <h2 style="margin:6px 0">The media wants a word</h2>
      <p class="sub" style="max-width:580px;margin:0 auto">"${q.text}"</p></div>
    <div class="panel">
      <div class="sectlbl">Pick a response</div>
      ${optBtns}
      <p class="small muted" style="margin:6px 0 0">A 🔥/😤 promise raises the bar — reach the playoffs this year or it backfires.</p>
    </div>
    <div class="panel">
      <div class="sectlbl">— or say it in your own words —</div>
      <textarea id="mediaans" style="width:100%;height:90px;background:var(--panel2);color:var(--ink);border:1px solid var(--line);border-radius:8px;padding:10px;font-family:inherit;font-size:14px;-webkit-user-select:text;user-select:text" placeholder="${q.ph}"></textarea>
      <div class="center" style="margin-top:8px"><button class="btn primary" onclick="submitMedia()">Address the media ▶</button>
        <button class="btn ghost" onclick="skipMedia()">"No comment"</button></div>
    </div>`);}
function submitMedia(){
  const t=(document.getElementById('mediaans')||{}).value||"";
  const res=gradeMediaAnswer(t);
  const fd=fanChange(res.fan,"Press conference"),od=favorChange(res.owner,"Press conference");
  if(res.expect){G._mediaPromise=true;G._mediaPromiseYear=G.year;}
  G._mediaResult={fan:fd,owner:od,notes:res.notes,answer:t.trim(),expect:res.expect};
  G._mediaAnswered=true;saveGame();screenMediaResult();}
function skipMedia(){
  const fd=fanChange(-3,"Press conference"),od=favorChange(-2,"Press conference");
  G._mediaResult={fan:fd,owner:od,notes:["You brushed off the media — fans noticed the silence."],answer:"(No comment.)",expect:false};
  G._mediaAnswered=true;saveGame();screenMediaResult();}
function screenMediaResult(){
  const r=G._mediaResult||{fan:0,owner:0,notes:[]};
  const chip=d=>`<b style="color:${d>=0?'var(--green)':'var(--red)'}">${d>=0?'+':''}${d}</b>`;
  render(`${survivorHeader()}
    <div class="panel">
      <div class="pill" style="background:#3a2a55;color:#d9b3ff">🎙️ ON THE RECORD</div>
      <p class="sub" style="margin:10px 0;font-style:italic">"${(r.answer||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))||'(silence)'}"</p>
      <div style="margin:8px 0">${r.notes.map(n=>`<div class="small" style="margin:2px 0">• ${n}</div>`).join("")}</div>
      <div class="row" style="gap:18px;margin-top:10px;font-size:15px"><span>📣 Fans ${chip(r.fan)}</span><span>🪑 Owner ${chip(r.owner)}</span></div>
      ${r.expect?'<div class="pill gold" style="margin-top:10px;display:inline-block">📈 You raised the stakes — reach the playoffs this year or pay for the promise</div>':''}
    </div>
    <div class="center"><button class="btn primary" onclick="fmToAllStar()">Back to the season ▶</button></div>`);}
/* ---- mid-season stop 2: trade deadline (game 110) ---- */
function computeDeadlineStances(){
  const arr=G.ai.map(t=>({t,w:warToWins(t.war)}));
  arr.sort((a,b)=>b.w-a.w);
  const N=arr.length, buyN=Math.round(N*0.40), sellStart=Math.round(N*0.60);   // top ~40% buy, bottom ~40% sell
  arr.forEach((e,i)=>{ e.t._stance = i<buyN?'buyer':(i>=sellStart?'seller':'neutral'); });
  const meW=warToWins(teamWAR(G.roster));
  const ws=arr.map(e=>e.w).concat(meW).sort((a,b)=>b-a);
  const NT=ws.length, bi=Math.round(NT*0.40)-1, si=Math.round(NT*0.60);
  G._myStance = meW>=ws[clamp(bi,0,NT-1)]?'buyer':(meW<=ws[clamp(si,0,NT-1)]?'seller':'neutral');
}
function dlThreshold(partnerId,give,get){
  // returns the minimum (you send)/(you get) value ratio the partner will accept.
  // Baseline 1.0 means EXACT value is always accepted; stances only ever LOWER it
  // (a desperate team accepts a deal that tilts further against them) — never above 1.0.
  const team=G.ai.find(t=>t.id===partnerId); if(!team)return 1.0;
  const stance=team._stance||'neutral';
  const isWinNow=a=>a.kind==="player"&&a.player.ovr>=72&&!a.player.prospect;
  const isYouth=a=>a.kind==="pick"||(a.kind==="player"&&(a.player.prospect||a.player.age<=24));
  const isExpiring=a=>a.kind==="player"&&(a.player.years||0)<=1&&a.player.ovr>=66;
  const frac=(arr,fn)=>{const t=arr.reduce((s,a)=>s+a.val,0)||1;return arr.filter(fn).reduce((s,a)=>s+a.val,0)/t;};
  let thr=1.0;
  if(stance==="buyer"){ thr-=0.22*frac(give,isWinNow); }           // overpays to land your big-league talent
  else if(stance==="seller"){ thr-=0.20*frac(give,isYouth); thr-=0.10*frac(get,isExpiring); }  // dumps rentals for youth
  return clamp(thr,0.68,1.0);
}
// A win-now buyer will eat an absolute overpay (in trade-value points) to land current MLB talent,
// scaled by how much better the player they GET is than the prospect they GIVE UP (current OVR gap).
// e.g. they receive an 80 OVR bigleaguer for a 65 OVR prospect (gap 15) -> tolerate ~7 of overpay;
//      75 for 70 (gap 5) -> ~3;  90 for 55 (gap 35) -> capped at 12.
function dlBuyerTolerance(team,give,get){
  if(!team||team._stance!=='buyer')return 0;
  const mlbIn=give.filter(a=>a.kind==="player"&&!a.player.prospect&&(a.player.mlbYears||0)>0)
                  .reduce((m,a)=>Math.max(m,a.player.ovr),0);
  const proOut=get.filter(a=>a.kind==="player"&&(a.player.prospect||(a.player.mlbYears||0)===0))
                  .reduce((m,a)=>Math.max(m,a.player.ovr),0);
  if(!mlbIn||!proOut)return 0;
  const gap=mlbIn-proOut; if(gap<=0)return 0;
  return Math.min(12,Math.round(gap*0.4)+1);
}
function dlAccept(partnerId,give,get){
  const gv=give.reduce((s,a)=>s+a.val,0),gt=get.reduce((s,a)=>s+a.val,0);
  if(gt<=0)return false;
  if(gv>=gt*dlThreshold(partnerId,give,get))return true;       // ratio rule (exact value always passes)
  const tol=dlBuyerTolerance(G.ai.find(t=>t.id===partnerId),give,get);
  return gv>=gt-tol;                                            // desperate buyer eats an absolute overpay
}
function stanceEmoji(s){return s==='buyer'?'🟢':s==='seller'?'🔴':'⚪';}
function dlStandings(){
  const meW=warToWins(teamWAR(G.roster));
  const rows=[{name:G.teamName,w:meW,me:true,stance:G._myStance}].concat(G.ai.map(t=>({name:t.name,w:warToWins(t.war),stance:t._stance})));
  rows.sort((a,b)=>b.w-a.w);
  return `<table><thead><tr><th class="num">#</th><th>Team</th><th class="num">Proj W</th><th></th></tr></thead><tbody>${
    rows.map((e,i)=>`<tr style="${e.me?'background:rgba(245,196,81,.10)':''}">
      <td class="num">${i+1}</td><td>${stanceEmoji(e.stance)} ${e.me?'<b>'+e.name+'</b> ⬅':e.name}</td>
      <td class="num">${e.w}</td><td>${i<8?'<span class="pill green" style="padding:0 6px">PO</span>':''}</td></tr>`).join("")}</tbody></table>
   <div class="small muted" style="margin-top:6px">🟢 <b>Buyer</b> — contending, overpays for win-now help &nbsp;•&nbsp; 🔴 <b>Seller</b> — out of it, deals rentals for youth/picks &nbsp;•&nbsp; ⚪ on the bubble. Top 8 make the playoffs.</div>`;
}
function dlStancePanel(){
  const grp=s=>G.ai.filter(t=>t._stance===s).sort((a,b)=>warToWins(b.war)-warToWins(a.war));
  const chip=t=>`<span class="pill" style="margin:2px;background:var(--panel2)">${teamShortOf(t.id)} <span class="small muted">${warToWins(t.war)}W</span></span>`;
  return `<div class="panel2" style="border:1px solid var(--line);border-radius:10px;padding:10px;margin:10px 0">
    <div class="small">🟢 <b style="color:var(--green)">Buyers</b> — chasing October, will overpay for win-now talent: ${grp('buyer').map(chip).join('')||'<span class="muted">none</span>'}</div>
    <div class="small" style="margin-top:6px">🔴 <b style="color:var(--gold)">Sellers</b> — out of it, dumping rentals for youth & picks: ${grp('seller').map(chip).join('')||'<span class="muted">none</span>'}</div></div>`;
}
function screenDeadline(){
  _dlMode=true;
  if(G.draftOrderYear!==G.year)computeDraftOrder();
  computeDeadlineStances();
  if(!_custom)_custom={giveIds:new Set(),getIds:new Set(),partner:null,seg:"league",search:"",posF:"all",sort:"val"};
  _sugg=null;
  const proj=warToWins(teamWAR(G.roster)),ms=G._myStance;
  const head=ms==='buyer'?'You\'re in the hunt — be a BUYER':ms==='seller'?'Out of the race — time to SELL':'On the bubble — buy, sell, or stand pat';
  const stanceMemo=ms==='buyer'
    ?`The math says you're <b>in the hunt</b> (proj ${proj} W). Contenders overpay in July — including you, if you're not careful. Rentals cost prospects; cost-controlled stars cost a fortune.`
    :ms==='seller'
    ?`The math says the race is gone (proj ${proj} W). Good news: <b>your veterans are worth more today than they'll ever be again.</b> Sell the expiring deals, stack youth and picks.`
    :`Proj ${proj} W — right on the bubble. Buy, sell, or stand pat; just don't half-do all three.`;
  render(`${header()}
   ${G._season?`<div style="display:flex;justify-content:center;margin:4px 0 10px"><div class="fmstrip" style="position:static;transform:none" onclick="fmStandFull()">${ico('flag',11)} <b>${esc(G.div||'DIVISION')}</b> ${fmLiveStandings().map((r,i)=>`<span class="${r.me?'me':''}">${i+1}. ${esc(String(r.name).split(' ').slice(-1)[0])} <i>${r.w}–${r.l}</i></span>`).join('')}</div></div>`:''}
   <div class="panel center" style="border-color:var(--gold);padding:12px">
     <div class="pill gold">${ico('siren',11)} TRADE DEADLINE · GAME 110 OF 162</div>
     <h2 style="margin:6px 0 0">${head}</h2></div>
   ${fmMemoHTML('DEADLINE DESK · THE SITUATION',stanceMemo)}

   <details class="deskp pri" ontoggle="fmSolo(this)">
     <summary><span class="dic">${ico('binoc',20)}</span><div class="dtx"><b>Suggested deadline deal</b><span>built for a ${ms||'bubble'} club — respin freely</span></div><span class="dgo">▸</span></summary>
     <div class="dbody"><div id="suggbox">${renderSuggestion()}</div></div>
   </details>
   <details class="deskp" ontoggle="fmSolo(this)">
     <summary><span class="dic">${ico('swap',20)}</span><div class="dtx"><b>Make a deadline deal</b><span>buyers overpay for now-help; sellers hand you rentals cheap</span></div><span class="dgo">▸</span></summary>
     <div class="dbody"><p class="sub">The accept/reject bar already reflects who you're dealing with — an even-value swap is always accepted. Deadline values shift: <b>current production is king</b>, ceilings cool off, contract control matters more.</p>
     <div id="builder">${renderBuilder()}</div></div>
   </details>
   <details class="deskp" ontoggle="fmSolo(this)">
     <summary><span class="dic">${ico('chart',20)}</span><div class="dtx"><b>The market</b><span>who's buying, who's selling — full standings</span></div><span class="dgo">▸</span></summary>
     <div class="dbody">${dlStancePanel()}<div class="scroll" style="margin-top:8px">${dlStandings()}</div></div>
   </details>
   <details class="deskp" ontoggle="fmSolo(this)">
     <summary><span class="dic">${ico('rank',20)}</span><div class="dtx"><b>Resources</b><span>adjust the strategy for the stretch run</span></div><span class="dgo">▸</span></summary>
     <div class="dbody"><div id="resbox">${renderResources()}</div></div>
   </details>
   <details class="deskp" ontoggle="fmSolo(this)">
     <summary><span class="dic">${ico('clip',20)}</span><div class="dtx"><b>Clipboard — current roster</b><span>updates after each deal</span></div><span class="dgo">▸</span></summary>
     <div class="dbody">${rosterMini()}</div>
   </details>
   <div class="deskcta"><button class="btn primary" style="font-size:15px;padding:13px 28px" onclick="afterDeadline()">Set roster & play out the season ▸</button></div>`);
}
function afterDeadline(){_dlMode=false;G.seasonStage=2;_rosterMode='deadline';saveGame();screenRoster();}
function weakStartSpots(){   // count starting spots that are empty or filled by a sub-70 OVR player
  const a=buildActive(G.roster);let n=0;
  LINEUP.forEach(s=>{const p=a.lineup[s];if(!p||p.ovr<70)n++;});
  for(let i=0;i<ROT_SLOTS.length;i++){const p=a.rotation[i];if(!p||p.ovr<70)n++;}
  for(let i=0;i<PEN_SLOTS.length;i++){const p=a.pen[i];if(!p||p.ovr<70)n++;}
  return n;
}
function doSeason(){
  _dlMode=false;
  const prevWins=G._prevWins!=null?G._prevWins:G.lastWins;
  const reg=simulateRegularSeason();
  const after=()=>{
    G._season=null;G._prevWins=null;
    if(reg.madePO&&!G.owner){G.seasonStage=2.8;saveGame();return screenPlayoffRoster();}
    finishSeason();
  };
  try{
    if(!G.owner&&G._season&&G._season.g>0)fmSeasonFinale(prevWins,!!reg.madePO,after);
    else showSeasonTicker(prevWins,!!reg.madePO,after);
  }catch(e){after();}
}
// the player reached the postseason — let them set their playoff roster before the bracket runs
function screenPlayoffRoster(){_rosterMode='playoff';G.phase=1;screenRoster();}
function startPlayoffs(){try{fmOctoberRun(()=>finishSeason());}catch(e){finishSeason();}}
function finishSeason(){
  _res=runPlayoffsAndFinish();
  _res.awards=computeAwards();
  if(G.awardsYear!==G.year){applyAwards(_res.awards);G.awardsYear=G.year;}
  // years 4-6: tally weak starting spots at season's end (counts toward the final grade)
  if(G.mode!=="survivor"&&G.year>=4&&G.weakSpotsYear!==G.year){G.weakSpotsTotal=(G.weakSpotsTotal||0)+weakStartSpots();G.weakSpotsYear=G.year;}
  if(G.mode==="survivor"&&G.weakSpotsYear!==G.year){applySurvivorSeason();G.weakSpotsYear=G.year;}
  G.seasonStage=0;saveGame();showResult();
}
/* ---- awards (ROY / Cy Young / MVP) ---- */
function seasonRating(p){return warOfC(p)*injFactor(p)+gauss(0,0.55);}
function isRookieNow(p){return p.loc==="mlb"&&p.age<=25&&(p.mlbYears||0)<=1;}
const AWARD_PTS={MVP:6,"Cy Young":5,ROY:4};
function computeAwards(){
  const mlb=G.roster.filter(p=>p.loc==="mlb");
  const best=arr=>arr.length?arr.map(p=>({p,r:seasonRating(p)})).sort((a,b)=>b.r-a.r)[0]:null;
  const mk=(name,cand,bar)=>{const won=!!(cand&&cand.r>=bar);
    return {name,won,player:won?cand.p:null,leagueName:won?null:ficName(),leagueTeam:won?null:(pick(G.ai)||{}).name||"a rival club"};};
  return {
    roy:mk("ROY", best(mlb.filter(isRookieNow)), gauss(2.7,0.6)),
    cy :mk("Cy Young", best(mlb.filter(p=>p.pos==="SP")), gauss(4.2,0.6)),
    mvp:mk("MVP", best(mlb.filter(isHit)), gauss(4.2,0.6))
  };
}
function applyAwards(aw){
  const give=(key,needHomegrown)=>{const a=aw[key];if(!a||!a.won)return;
    const hg=a.player.src==="draft";const comp=needHomegrown?hg:true;const pts=2+(hg?1:0);
    a._comp=comp;a._hg=hg;a._pts=pts;
    G.awardPoints=(G.awardPoints||0)+pts;
    G.totalAwards=(G.totalAwards||0)+1;
    (a.player._awards=a.player._awards||[]).push({year:G.year,name:a.name});   // for the Hall of Fame résumé
    (G.awardsLog=G.awardsLog||[]).push({year:G.year,award:a.name,player:a.player.name,homegrown:hg,comp});
    if(comp)(G.pendingComp=G.pendingComp||[]).push({id:uid(),round:1.5,slot:12,comp:true,future:false,fromMe:true});
  };
  give('roy',false); give('cy',true); give('mvp',true);
}
function awardsPanel(aw){
  if(!aw)return '';
  const row=a=>{if(!a)return '';
    if(a.won){const p=a.player,hg=(p.src==="draft");const pts=a._pts||AWARD_PTS[a.name]||4;const comp=a._comp!==undefined?a._comp:(a.name==="ROY"?true:hg);
      const reward=comp?`🎟️ comp pick in next year's draft (between R1 & R2) &nbsp;+${pts} grade pts`:`+${pts} grade pts <span class="small muted">(no comp pick — not homegrown)</span>`;
      return `<div style="margin:5px 0"><span class="pill gold">${a.name}</span> <b>${p.name}</b> <span class="small muted">${p.pos} ${p.ovr} • ${G.teamName}${hg?' • homegrown':''}</span><div class="small" style="color:var(--green);margin-top:2px">${reward}</div></div>`;}
    return `<div style="margin:5px 0;color:var(--dim)"><span class="pill" style="background:var(--panel2)">${a.name}</span> ${a.leagueName} <span class="small">— ${a.leagueTeam}</span></div>`;};
  const anyWin=aw.roy.won||aw.cy.won||aw.mvp.won;
  return `<div class="panel"><h3>🏆 League Awards</h3>${anyWin?'':'<p class="sub">No hardware this year — your players were edged out across the league.</p>'}${row(aw.roy)}${row(aw.cy)}${row(aw.mvp)}</div>`;
}
function teamReportCard(){
  const mlb=G.roster.filter(p=>p.loc==="mlb");
  const hitters=mlb.filter(isHit).sort((a,b)=>b.ovr-a.ovr).slice(0,9);
  const arms=mlb.filter(p=>p.pos==="SP").sort((a,b)=>b.ovr-a.ovr).slice(0,4)
    .concat(mlb.filter(p=>p.pos==="RP").sort((a,b)=>b.ovr-a.ovr).slice(0,3));
  const coach=(G.resources?G.resources.coaching:0.333);
  const avg=(arr,f)=>arr.length?arr.reduce((s,p)=>s+f(p),0)/arr.length:50;
  const cats={};
  HIT_ATTRS.forEach(k=>{let v=avg(hitters,p=>attrVal(p,k));if(k==="defense")v+=coach*8;cats[k]=v;});
  PIT_ATTRS.forEach(k=>{let v=avg(arms,p=>attrVal(p,k));if(k==="control")v+=coach*8;cats[k]=v;});
  const ranks={};
  Object.keys(cats).forEach(k=>{const my=cats[k];let better=0;G.ai.forEach(t=>{if(aiCatScore(t,k)>my)better++;});ranks[k]={score:Math.round(my),rank:better+1};});
  return ranks;
}
function ordinal(n){const s=["th","st","nd","rd"],v=n%100;return n+(s[(v-20)%10]||s[v]||s[0]);}
function rankColor(rank){return rank<=8?'var(--green)':rank<=15?'var(--gold)':rank<=22?'var(--ink)':'var(--red)';}
function reportCardPanel(){
  const rc=teamReportCard();const NT=(G.ai?G.ai.length:29)+1;
  const row=k=>{const r=rc[k];const w=(NT+1-r.rank)/NT*100;
    return `<div style="display:flex;align-items:center;gap:8px;margin:3px 0">
      <span style="flex:0 0 64px" class="small">${ATTR_LABEL[k]}</span>
      <div class="bar" style="flex:1;margin:0"><i style="width:${w}%;background:${rankColor(r.rank)}"></i></div>
      <span class="small" style="flex:0 0 84px;text-align:right;color:${rankColor(r.rank)}">${ordinal(r.rank)} of ${NT}</span></div>`;};
  return `<div class="panel"><h3>📋 Season Report Card</h3>
    <p class="sub">Where your club ranked across the league this year. Green = top tier, red = bottom tier.</p>
    <div class="grid2">
      <div><div class="sectlbl" style="margin-top:0">Hitting</div>${HIT_ATTRS.map(row).join("")}</div>
      <div><div class="sectlbl" style="margin-top:0">Pitching</div>${PIT_ATTRS.map(row).join("")}</div>
    </div></div>`;
}
