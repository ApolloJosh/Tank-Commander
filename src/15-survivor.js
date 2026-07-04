/* ============================================================
   SURVIVOR MODE — endless owner-favor run
   ============================================================ */
const SURV_CAP=50;
function favorChange(amt,label){const before=G.favor;G.favor=clamp(Math.round((G.favor+amt)*10)/10,0,100);
  const d=Math.round((G.favor-before)*10)/10; if(label&&Math.abs(d)>=0.05)(G.favorLog=G.favorLog||[]).push({year:G.year,amt:d,label}); return d;}
function favorTier(f){return f<=10?'red':f<46?'muted':f<=60?'yellow':f<90?'green':f<96?'diamond':'irid';}
function favorColor(f){
  if(f<=10)return '#ef4444';
  if(f<46){const t=clamp((f-11)/35,0,1);return `rgb(${Math.round(138+(245-138)*t)},${Math.round(154+(196-154)*t)},${Math.round(106+(81-106)*t)})`;}
  if(f<=60)return '#f5c451';
  if(f<90){const t=clamp((f-61)/29,0,1);return `rgb(${Math.round(220+(118-220)*t)},${Math.round(214+(232-214)*t)},${Math.round(81+(63-81)*t)})`;}
  return '#76e83f';
}
const OWNER_MSGS={
  red:["One more season like that and we're cleaning out your office.","You're on the hot seat. Win — now.","The owner can barely look at you."],
  muted:["Ownership needs this trending up, fast.","Patience is wearing thin around here.","Show me a plan that actually works."],
  yellow:["The owner wants real progress this year.","We're not where we need to be. Push.","Prove this is going somewhere."],
  green:["The owner likes where this is headed.","You've built real trust — keep it rolling.","Good work. Now don't let up."],
  diamond:["You've earned a blank check and the benefit of the doubt.","The owner trusts your vision completely.","Whatever you need — within reason."],
  irid:["Whatever you want. They'd build you a statue.","You can do no wrong in this building.","A living legend in the front office."]
};
function ownerMsg(){return pick(OWNER_MSGS[favorTier(G.favor)]);}
function favorBar(){const f=G.favor,t=favorTier(f);
  const cls=t==='irid'?'favbar irid':t==='diamond'?'favbar bdiamond':'favbar';
  const style=(t==='irid'||t==='diamond')?'':`background:${favorColor(f)}`;
  return `<div class="favtrack"><div class="${cls}" style="width:${Math.max(2,f)}%;${style}"></div></div>`;}
/* ---- Fan Favor: a second meter the fans control. Doesn't fire you, but very low fan favor bleeds owner favor. Fans don't care about money — they care about winning, a real plan, and being spoken to. ---- */
function fanVal(){return clamp(G.fanFavor==null?58:G.fanFavor,0,100);}
function fanTier(f){return f<20?'cold':f<40?'cool':f<60?'mid':f<80?'warm':'hot';}
function fanColor(f){return f<20?'#c0392b':f<40?'#d8742f':f<60?'#c9a227':f<80?'#4a9e3f':'#37c24a';}
function fanMood(f){return f>=85?'The city is electric — the ballpark is rocking.':f>=68?'The fan base is happy and showing up.':f>=50?'A content, steady crowd.':f>=32?'Restless — the fans want to see more.':'The fan base is fed up. Win them back.';}
// WW2 cockpit-style 270° gauge (the picked "Variant B") — used for Fan Happiness
function fanDial(v,size){
  size=size||124;const cx=size/2,cy=size/2,r=size*0.38,sw=(size*0.075);
  const a0=Math.PI*0.75,a1=Math.PI*2.25,span=a1-a0,col=fanColor(v);
  const pol=(a,rr)=>[cx+rr*Math.cos(a),cy+rr*Math.sin(a)];
  const arcP=(s,e,rr)=>{const[x0,y0]=pol(s,rr),[x1,y1]=pol(e,rr);const lg=Math.abs(e-s)>Math.PI?1:0;return `M${x0.toFixed(1)} ${y0.toFixed(1)} A${rr.toFixed(1)} ${rr.toFixed(1)} 0 ${lg} 1 ${x1.toFixed(1)} ${y1.toFixed(1)}`;};
  const z=(f0,f1,c)=>`<path d="${arcP(a0+span*f0,a0+span*f1,r)}" stroke="${c}" stroke-width="${sw.toFixed(1)}" fill="none"/>`;
  let ticks='';for(let i=0;i<=10;i++){const a=a0+span*(i/10),r2=r-(i%5===0?sw:sw*0.6),[x1,y1]=pol(a,r),[x2,y2]=pol(a,r2);ticks+=`<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${i%5===0?'#7d8a44':'#4a5330'}" stroke-width="${i%5===0?2:1}"/>`;}
  const deg=((a0+span*(v/100))*180/Math.PI)+90;
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    ${z(0,.4,'rgba(255,106,85,.45)')}${z(.4,.66,'rgba(230,178,74,.45)')}${z(.66,1,'rgba(155,216,74,.45)')}
    <path d="${arcP(a0,a0+span*(v/100),r)}" stroke="${col}" stroke-width="${sw.toFixed(1)}" fill="none" stroke-linecap="round"/>
    ${ticks}
    <g style="transform:rotate(${deg.toFixed(1)}deg);transform-origin:${cx}px ${cy}px">
      <line x1="${cx}" y1="${cy}" x2="${cx}" y2="${(cy-r+size*0.1).toFixed(1)}" stroke="${col}" stroke-width="3"/></g>
    <circle cx="${cx}" cy="${cy}" r="${(size*0.055).toFixed(1)}" fill="#1f2616" stroke="#7d8a44" stroke-width="2"/>
    <text x="${cx}" y="${(cy+size*0.31).toFixed(1)}" text-anchor="middle" font-family="'Chakra Petch',sans-serif" font-weight="700" font-size="${(size*0.2).toFixed(0)}" fill="${col}">${v}</text>
  </svg>`;
}
function fanChange(amt,label){const before=fanVal();G.fanFavor=clamp(Math.round((before+amt)*10)/10,0,100);
  const d=Math.round((G.fanFavor-before)*10)/10;if(label&&Math.abs(d)>=0.05)(G.fanLog=G.fanLog||[]).push({year:G.year,amt:d,label});return d;}
function fanBar(){const f=fanVal();return `<div class="favtrack" style="height:9px"><div class="favbar" style="width:${Math.max(2,f)}%;background:${fanColor(f)}"></div></div>`;}
const FAN_MOODS={cold:["The fan base is furious — talk radio is on fire.","Boos rain down and seats sit empty.","The faithful have checked out."],
  cool:["Fans are restless and skeptical.","Patience is wearing thin in the stands."],
  mid:["The fan base is cautiously along for the ride.","A wait-and-see mood around town."],
  warm:["Fans are buying in — the building has energy again.","The city believes in the direction."],
  hot:["The fan base is electric. Tickets are gold.","This town is in love with the team."]};
function fanMsg(){return pick(FAN_MOODS[fanTier(fanVal())]);}
function dualBars(){return `<div style="display:flex;gap:7px;align-items:center;margin-bottom:3px"><span class="small" style="flex:0 0 50px;color:var(--dim)">🪑 Owner</span><div style="flex:1">${favorBar()}</div></div>
  <div style="display:flex;gap:7px;align-items:center"><span class="small" style="flex:0 0 50px;color:var(--dim)">📣 Fans</span><div style="flex:1">${fanBar()}</div></div>`;}
// fans reward a visible future: stocked farm + a young, productive MLB core
function youngCorePlan(){const farmQ=G.farm.filter(p=>Math.min(p.realCeil||p.pot,p.pot)>=82).length;
  const youngMLB=G.roster.filter(p=>p.loc==="mlb"&&p.age<=25&&p.ovr>=74).length;return farmQ+youngMLB;}
function survivorHeader(){
  return `${topBar(`${G.agreedBar?`<span class="pill ${G.stance==='go'?'gold':G.stance==='retool'?'blue':'green'}">Target ${G.agreedBar} W</span>`:''}${rubricBtn()}<button class="btn ghost sm" onclick="openFranchise()">📜 Franchise</button>`)}
    <div style="margin-bottom:8px"><div class="fid">${G.teamName} <span class="pill" style="background:#24351c;color:var(--gold);border:1px solid var(--line2);vertical-align:4px">Career</span></div>
      <span class="fmeta">${G.league||''} ${G.div||''} · Season ${G.year} · Payroll $${payroll(G.roster)}M · Score ${Math.round(G.cumScore||0)}</span></div>
    <div class="small" style="color:var(--dim);margin-bottom:3px"><i>"${G._ownerMsg||ownerMsg()}"</i></div>
    ${dualBars()}`;
}
/* ---- expectations + negotiation ---- */
function projWinsNow(){return warToWins(teamWAR(G.roster));}
function payExpWins(){const p=payroll(G.roster);return clamp(Math.round(58+(p-110)/190*44),56,104);}
function survGrace(){return G.mode==="survivor"&&G.year<=2;}   // first 2 seasons: hired to tear it down, the owner is patient
function ownerBaseBar(){
  if(survGrace())return clamp(Math.round(Math.min(projWinsNow(),72)),60,74);   // rebuild years — a modest "show progress" bar
  return clamp(Math.round(Math.max(projWinsNow(),payExpWins()-4,Math.round(G.reputation)-7)),58,108);}
function stancePreview(stance){const ob=G.ownerBar;
  if(stance==='go')return ob+5;
  if(stance==='compete')return ob;
  const f=G.favor;let cut=f>=75?14:f>=61?9:f>=46?5:0;
  if((ob-projWinsNow())<6)cut=Math.round(cut*0.4);   // only a genuinely weak roster earns the full rebuild discount
  return Math.max(projWinsNow()-2,ob-cut);}
function startSurvivorYear(){
  if(G.owner)return startOwnerYear();   // owners skip the employee owner-meeting
  G.survStage=0;G.stance=null;G.agreedBar=null;
  if(G.draftOrderYear!==G.year)computeDraftOrder();
  G.ownerBar=ownerBaseBar();G._ownerMsg=ownerMsg();saveGame();screenMandate();}
function screenMandate(){
  const ob=G.ownerBar,proj=projWinsNow();
  const opt=(key,label,desc,cls)=>{const bar=stancePreview(key);
    return `<div class="panel2" style="border:1px solid var(--line);border-radius:10px;padding:11px;flex:1;display:flex;flex-direction:column">
      <div style="font-weight:800;color:var(--${cls})">${label}</div>
      <p class="small muted" style="margin:4px 0 8px;flex:1">${desc}</p>
      <div class="small">Agreed target: <b>${bar} wins</b></div>
      <button class="btn primary sm" style="margin-top:7px" onclick="chooseStance('${key}')">Choose</button></div>`;};
  const grace=survGrace();
  const intro = G.year===1
    ? `<p class="sub">You were hired to <b>tear this thing down and rebuild it</b>. Ownership knows the next year or two won't be pretty — they want to see a plan, prospects, and a direction, not wins. Tank freely; the leash is long while you retool.</p>`
    : grace
    ? `<p class="sub">Still in the rebuild window — the owner is patient with the losing as long as the future's stocking up. Wins aren't the point yet.</p>`
    : `<p class="sub">Your roster projects to ${proj}. Beating the target builds favor; missing it costs you.${infoDot('A rebuild is only granted if you have earned the standing — and the owner only buys it if the roster genuinely needs one.')}</p>`;
  render(`${survivorHeader()}
    <div class="panel center" style="border-color:var(--gold)">
      <div class="pill gold">🪑 OWNER MEETING · ${grace?'rebuild years':'preseason'}</div>
      <h2 style="margin:6px 0">${grace?`The mandate: <b>retool</b> — target ~${ob} wins`:`Ownership is thinking <b>~${ob} wins</b>`}</h2>
      ${intro}</div>
    <div class="row" style="gap:10px;align-items:stretch">
      ${opt('go','🔥 Go for it','Raise the bar and commit to contend. Beating it pays big; a face-plant is brutal.','gold')}
      ${opt('compete','⚖️ Compete','Accept the owner&apos;s number. Straightforward.','green')}
      ${opt('retool','🌱 Retool','Ask to lower the bar for a rebuild year. Costs a little favor up front, granted only if you have the standing.','blue')}
    </div>
    ${(G.yearsServed||0)>=10?`<div class="center" style="margin-top:12px"><button class="btn ghost" onclick="(function(){G.yearsServed=G.year-1;screenRetire();})()">🏖️ Retire as a legend (end the run here)</button></div>`:''}`);}
function chooseStance(s){G.stance=s;G.agreedBar=stancePreview(s);
  if(s==='retool')favorChange(-2,"Asked ownership for a rebuild year");
  G.survStage=1;saveGame();goPhase(0);}
/* ---- end-of-season owner review (the favor ledger) ---- */
function weakStartSpotsSafe(){try{return weakStartSpots();}catch(e){return 0;}}
function applySurvivorSeason(){
  const r=_res,me=r.me,w=me.wins,madePO=!!me.playoff,grace=survGrace();
  G._favorThisYear=[];
  const fc=(amt,label)=>{const d=favorChange(amt,label);if(Math.abs(d)>=0.05)G._favorThisYear.push({amt:d,label});};
  // favor-scaled decay — the higher you are, the harder it is to hold (gentle during the rebuild grace years)
  fc(-((grace?3:6)*clamp(G.favor/60,0.4,1.7)),grace?"A rebuild season passes":"A season passes — expectations never rest");
  // vs the agreed target — during the grace years, missing a low rebuild bar is forgiven, beating it still rewards
  const bar=G.agreedBar||me.seed,margin=w-bar;
  if(margin>=1)fc(Math.min(6,margin*0.5),`Beat the ${bar}-win target (${w} W)`);
  else if(margin<=-1&&!grace)fc(Math.max(-12,margin*(G.stance==="go"?1.0:0.6)),`Missed the ${bar}-win target (${w} W)`);
  if(G.stance==="go"&&w<81&&!grace)fc(-8,"Promised contention, finished under .500");
  if(grace&&!madePO)fc(2,"Ownership sees the rebuild taking shape");
  // October
  if(madePO){fc(8,"Made the playoffs");
    if(G.lastPlayoffYear!=null&&(G.year-G.lastPlayoffYear)>=4)fc(5,"Ended a long playoff drought");
    G.lastPlayoffYear=G.year;G.missStreak=0;}
  else{G.missStreak=grace?0:(G.missStreak||0)+1;   // the miss-the-playoffs clock doesn't start ticking until the grace years are over
    if(G.missStreak>=3)fc(({3:-2,4:-4,5:-7,6:-11,7:-16,8:-22}[Math.min(8,G.missStreak)]),`Missed October ${G.missStreak} years running`);}
  if(w>=110)fc(8,"110-win juggernaut");else if(w>=105)fc(6,"105-win season");else if(w>=100)fc(4,"100-win season");
  if(me.seed===1)fc(3,"Best record in baseball");
  // WS appearance / title
  if(r.wonWS){G.survTitles=(G.survTitles||0)+1;
    const boost=G.survTitles===1?50:Math.min(75,7.5*(G.year-(G.lastTitleYear||G.year)));
    fc(boost,`World Series CHAMPIONS! (ring #${G.survTitles})`);
    if(G.favor<61){favorChange(61-G.favor);G._favorThisYear.push({amt:'→ green',label:"A ring buys back the owner's faith"});}
    G.lastTitleYear=G.year;G.lastWSYear=G.year;}
  else if(r.reachedWS){fc(Math.min(25,2.5*(G.lastWSYear!=null?(G.year-G.lastWSYear):8)),"Reached the World Series (lost)");G.lastWSYear=G.year;}
  // awards
  if(_res.awards)['roy','cy','mvp'].forEach(k=>{const a=_res.awards[k];if(a&&a.won){const p=a.player,hg=p.src==="draft",acq=p._acqYear===G.year;
    fc(hg?6:(acq?1.5:3),`${p.name} won ${a.name}${hg?' (homegrown)':''}`);}});
  // money without a run
  if(payroll(G.roster)>300&&!r.reachedWS){fc(Math.max(-10,-1.5*luxuryTax()),"Big payroll, no October run");
    G.taxNoRunStreak=(G.taxNoRunStreak||0)+1;if(G.taxNoRunStreak>=2)fc(Math.max(-8,-2*(G.taxNoRunStreak-1)),"Paying the tax for a non-contender, again");}
  else G.taxNoRunStreak=0;
  const weak=weakStartSpotsSafe();if(weak>0)fc(Math.max(-8,-1.2*weak),`${weak} replacement-level starting spot${weak>1?'s':''}`);
  // cumulative achievement score
  let s=0;if(w>=110)s+=12;else if(w>=105)s+=9;else if(w>=100)s+=7;else if(w>=95)s+=5;else if(w>=90)s+=3;else if(w>=85)s+=1;
  if(madePO)s+=6;if(r.reachedWS&&!r.wonWS)s+=10;if(r.wonWS)s+=20;
  if(_res.awards)['roy','cy','mvp'].forEach(k=>{const a=_res.awards[k];if(a&&a.won)s+=a.player.src==="draft"?3:2;});
  s+=G.roster.filter(p=>p.loc==="mlb"&&p.src==="draft"&&p.ovr>=74).length;
  G.cumScore=(G.cumScore||0)+s;G._scoreThisYear=s;
  // new fan favorites
  detectFanFavorites();
  // ----- FAN FAVOR ledger (fans ignore money; they want winning, a visible plan, and to be heard) -----
  G._fanThisYear=[];
  const fanFc=(amt,label)=>{const d=fanChange(amt,label);if(Math.abs(d)>=0.05)G._fanThisYear.push({amt:d,label});};
  fanChange((55-fanVal())*0.06);   // fans have short memories — drift back toward neutral (unlogged)
  const plan=youngCorePlan(),pay=payroll(G.roster);
  if(madePO)fanFc(7,"The team reached October");
  else fanFc(plan>=3?-2:-6, plan>=3?"Missed the playoffs — but fans see the young core coming":"Out of the race again, with no plan in sight");
  if(w>=110)fanFc(4,"A historic 110-win season");else if(w>=100)fanFc(3,"A 100-win season thrilled the city");
  else if(w<68&&!grace)fanFc(plan>=3?-1:-4,"A dismal record tested the fans' patience");
  if(r.wonWS)fanFc(18,"WORLD SERIES CHAMPIONS — the city erupts");
  else if(r.reachedWS)fanFc(8,"A pennant and a World Series trip");
  if(pay>=260)fanFc(7,"Ownership spent big to win — fans love it");
  else if(pay>=200)fanFc(4,"A top-tier payroll signals you're going for it");
  else if(pay<120&&!madePO)fanFc(plan>=3?2:-7, plan>=3?"A lean budget, but fans trust the youth movement":"A bottom-five payroll with no plan — fans feel shortchanged");
  (G._newFanFavs||[]).forEach(p=>fanFc(4,`${p.name} has become a fan favorite`));
  if(_res.awards)['roy','cy','mvp'].forEach(k=>{const a=_res.awards[k];if(a&&a.won)fanFc(3,`${a.player.name} won ${a.name}`);});
  // media promise comes due this season
  if(G._mediaPromise&&G._mediaPromiseYear===G.year){
    if(madePO){fc(4,"Delivered on your promise to the media");fanFc(6,"You promised October — and delivered");}
    else{fc(-6,"Broke the promise you made to the media");fanFc(-9,"All talk: fans remember the promise you broke");}
    G._mediaPromise=false;}
  // fan favor's pull on the owner: very low fans bleed owner favor; a beloved front office helps a touch
  const fnow=fanVal();
  if(fnow<20)fc(-Math.min(6,(20-fnow)*0.25),"Fan unrest is reaching the owner's office");
  else if(fnow>=85)fc(2,"A beloved front office and a packed ballpark");
  // reputation, mood, firing
  G.reputation=clamp(G.reputation*0.7+w*0.3+(r.wonWS?4:0),50,108);
  G.yearsServed=G.year;
  if(G.favor<=0&&!G.owner){G.fired=true;G.firedYear=G.year;}   // you can't fire yourself — owners are never fired
  G._ownerMsg=G.fired?"That's it. We're going in a different direction.":ownerMsg();
}
function survivorResultPanel(){
  const items=G._favorThisYear||[];
  const rows=items.map(it=>{const num=typeof it.amt==='number';const pos=num?it.amt>=0:true;
    return `<div style="display:flex;justify-content:space-between;font-size:13px;margin:2px 0"><span>${it.label}</span><span style="font-weight:700;color:${pos?'var(--green)':'var(--red)'}">${num?(it.amt>=0?'+':'')+it.amt:it.amt}</span></div>`;}).join("");
  const ff=(G._newFanFavs||[]);
  const ffPanel=ff.length?`<div class="panel2" style="border:1px solid var(--gold);border-radius:10px;padding:10px;margin-top:10px">
    <div style="font-weight:800;color:var(--gold)">⭐ New Fan Favorite${ff.length>1?'s':''}!</div>
    <p class="small muted" style="margin:3px 0 0">Homegrown, tenured, and beloved by the fanbase: ${ff.map(p=>`<b>${p.name}</b>`).join(", ")}. Keep them around (and extend them) for owner goodwill — dealing them away stings.</p></div>`:'';
  const fitems=G._fanThisYear||[];
  const frows=fitems.map(it=>`<div style="display:flex;justify-content:space-between;font-size:13px;margin:2px 0"><span>${it.label}</span><span style="font-weight:700;color:${it.amt>=0?'var(--green)':'var(--red)'}">${it.amt>=0?'+':''}${it.amt}</span></div>`).join("");
  return `<div class="panel"><h3>🪑 Owner Review</h3>
    <div class="small" style="color:var(--dim);margin-bottom:6px"><i>"${G._ownerMsg||ownerMsg()}"</i></div>
    ${dualBars()}
    <div style="margin-top:10px">${rows||'<span class="muted small">No change.</span>'}</div>
    <div class="small muted" style="margin-top:8px">Season score +${G._scoreThisYear||0} &nbsp;·&nbsp; running total <b style="color:var(--ink)">${Math.round(G.cumScore||0)}</b></div>
    <div style="border-top:1px solid var(--line);margin:12px 0 8px"></div>
    <h3 style="margin-bottom:2px">📣 The Fan Base</h3>
    <div class="small" style="color:var(--dim);margin-bottom:6px"><i>"${fanMsg()}"</i></div>
    <div>${frows||'<span class="muted small">Fans are unmoved this year.</span>'}</div>
    ${fanVal()<20?'<div class="pill red" style="margin-top:8px;display:inline-block">⚠ Fan unrest is dragging the owner down</div>':''}
    ${ffPanel}
    ${G.fired?'<div class="pill red" style="margin-top:8px;display:inline-block">⚠ Owner Happiness hit zero — you are out.</div>':''}</div>`;
}
function survFinalScore(){return Math.round((G.cumScore||0)+(G.survTitles||0)*25+(G.yearsServed||0)*2);}
function survEndStats(){const h=G.history;
  return `<div class="grid4" style="margin-top:4px">
     <div class="kpi"><div class="big">${survFinalScore()}</div><div class="lbl">Career Score</div></div>
     <div class="kpi"><div class="big">${G.yearsServed||0}</div><div class="lbl">Seasons</div></div>
     <div class="kpi"><div class="big">${G.survTitles||0}</div><div class="lbl">World Series</div></div>
     <div class="kpi"><div class="big">${G.bestWins}</div><div class="lbl">Peak Wins</div></div></div>
   <div class="panel"><h3>Your tenure</h3>
     <div class="scroll"><table><thead><tr><th>Yr</th><th class="num">Record</th><th class="num">Rank</th><th>Result</th></tr></thead><tbody>${
       h.map(x=>`<tr><td>${x.year}</td><td class="num">${x.wins}-${x.losses}</td><td class="num">#${x.seed}</td>
         <td>${x.champ?'<span class="pill gold">🏆 WS</span>':x.playoffs?'<span class="pill green">Playoffs</span>':'<span class="muted">—</span>'}</td></tr>`).join("")}</tbody></table></div></div>`;}
function survSubmitPanel(){return `<div class="panel center" id="lbsubmit">
   <h3>🏆 Post to the Career leaderboard</h3>
   <div style="margin:8px 0"><input id="lbname" maxlength="12" placeholder="Name or initials" style="width:200px"/></div>
   <button class="btn primary" onclick="submitSurvivor()">Submit score ${survFinalScore()}</button>
   <button class="btn ghost" onclick="screenLeaderboard(true,'survivor')">View leaderboard</button>
   ${feedbackEnabled()?'<div style="margin-top:8px"><button class="btn ghost" onclick="openFeedback()">📝 Leave a note for the creator</button></div>':''}</div>`;}
function screenFired(){inductActiveLegends();render(`<div class="hero"><div class="pill red">DISMISSED</div>
     <h1 style="font-size:46px;margin:6px 0;color:var(--red)">Fired after ${G.yearsServed} season${G.yearsServed===1?'':'s'}</h1>
     <p class="sub" style="max-width:600px;margin:0 auto">Ownership ran out of patience. The run is over — but they'll remember it.</p></div>
   ${xpEndNotice()}
   ${survEndStats()}
   ${survSubmitPanel()}
   <div class="center" style="margin-top:8px"><button class="btn" onclick="(function(){localStorage.removeItem(SAVE);screenTitle();})()">New Franchise</button></div>`);}
function screenRetire(){inductActiveLegends();render(`<div class="hero"><div class="pill gold">A LEGEND STEPS AWAY</div>
     <h1 style="font-size:44px;margin:6px 0;color:var(--gold)">${G.yearsServed} seasons · ${G.survTitles||0} title${G.survTitles===1?'':'s'}</h1>
     <p class="sub">You walked away on your own terms — a front-office immortal.</p></div>
   ${xpEndNotice()}
   ${survEndStats()}
   ${survSubmitPanel()}
   <div class="center" style="margin-top:8px"><button class="btn" onclick="(function(){localStorage.removeItem(SAVE);screenTitle();})()">New Franchise</button></div>`);}

