/* ============================================================
   END GAME
   ============================================================ */
function computeGrade(){
  const h=G.history;
  const early=h.filter(x=>x.year<=2),late=h.filter(x=>x.year>=4);
  const earlyAvg=early.length?early.reduce((s,x)=>s+x.wins,0)/early.length:81;
  const peakLate=Math.max(0,...late.map(x=>x.wins));
  const mlb=G.roster.filter(p=>p.loc==="mlb");
  const coreYoung=mlb.filter(p=>p.age<=27&&p.ovr>=80).length;
  const farmQ=G.farm.filter(p=>Math.min(p.realCeil||p.pot,p.pot)>=84).length;
  const windowYears=clamp(round(coreYoung*0.9+farmQ*0.6),0,8);
  const contrib=mlb.filter(p=>p.ovr>=74);
  const hg=contrib.filter(p=>p.src==="draft").length;
  const acq=contrib.filter(p=>p.src==="fa"||p.src==="trade").length;
  const faCount=contrib.filter(p=>p.src==="fa").length;
  const hgRatio=(hg+acq)>0?hg/(hg+acq):0;
  const maxPay=Math.round(G.maxPayroll||payroll(G.roster));
  const taxYears=G.taxYears||0;
  const weakSpots=G.weakSpotsTotal||0;
  const hit100By3=h.some(x=>x.year===3&&x.wins>=100);
  const hit100Late=h.some(x=>x.year>=4&&x.wins>=100);
  const items=[];let score=0;
  const add=(label,pts)=>{items.push({label,pts});score+=pts;};
  let pk=peakLate>=111?30:peakLate>=105?25:peakLate>=100?20:peakLate>=95?15:peakLate>=90?10:peakLate>=85?5:-5;
  add(`Peak of ${peakLate} wins in your contention window`,pk);
  if(G.champions>0)add(`${G.champions} World Series title${G.champions>1?'s':''}`,15+(G.champions-1)*10);
  else items.push({label:"Never won the World Series",pts:0});
  if(hit100By3)add("Contended early — hit 100 wins by Year 3",8);
  else if(hit100Late)add("Hit 100 wins in your contention window (Yrs 4–6)",5);
  if(G.playoffApps>0)add(`${G.playoffApps} playoff appearance${G.playoffApps>1?'s':''}`,Math.min(16,G.playoffApps*4));
  else items.push({label:"Never reached the postseason",pts:0});
  let tk=earlyAvg<=66?15:earlyAvg<=70?10:earlyAvg<=75?5:0;
  if(tk)add(`Committed to the tank early (avg ${Math.round(earlyAvg)} wins, yrs 1-2)`,tk);
  else items.push({label:`Didn't truly bottom out for premium picks (avg ${Math.round(earlyAvg)} wins early)`,pts:0});
  let hgPts=(hg>=3&&hgRatio>=0.6)?15:(hg>=2&&hgRatio>=0.5)?10:hgRatio>=0.4?6:hgRatio>=0.25?3:0;
  if(hgPts)add(`Homegrown core — ${hg} drafted contributor${hg>1?'s':''} (${Math.round(hgRatio*100)}% of acquired talent)`,hgPts);
  else items.push({label:`Built mostly through trades/free agency, not the draft (${hg} homegrown)`,pts:0});
  let wPts=windowYears>=5?15:windowYears>=3?9:windowYears>=1?4:-12;
  add(`${windowYears>=5?'Wide-open':windowYears>=3?'Healthy':windowYears>=1?'Closing':'Shut'} future window (~${windowYears} yr${windowYears===1?'':'s'} ahead)`,wPts);
  if(G.awardPoints>0){const log=G.awardsLog||[];const cnts={};log.forEach(x=>cnts[x.award]=(cnts[x.award]||0)+1);
    const summ=Object.keys(cnts).map(k=>`${cnts[k]}× ${k}`).join(", ");
    add(`Individual hardware — ${summ}`,G.awardPoints);}
  let payPen=G.hard?(maxPay>300?-18:maxPay>260?-12:maxPay>220?-6:0):(maxPay>320?-12:maxPay>280?-7:maxPay>240?-3:0);
  if(payPen)add(`Bloated payroll (peaked at $${maxPay}M)${G.hard?' — the Hard Mode owner runs lean':''}`,payPen);
  if(taxYears>0)add(`Paid the luxury tax in ${taxYears} season${taxYears>1?'s':''}`,(G.hard?-8:-5)*taxYears);
  if(faCount>=3)add(`Leaned on free-agent signings (${faCount} regulars)`,-(faCount-2)*3);
  if(weakSpots>0)add(`Fielded ${weakSpots} replacement-level/sub-70 OVR starting spot${weakSpots>1?'s':''} across Yrs 4–6`,(G.hard?-8:-5)*weakSpots);
  score=Math.max(0,round(score));        // uncapped — truly great runs can exceed 100 so the leaderboard can separate them
  const lg=clamp(score,0,100);           // the letter grade is still scored out of 100
  const grade=lg>=96?'A+':lg>=93?'A':lg>=90?'A-':lg>=86?'B+':lg>=83?'B':lg>=80?'B-':lg>=76?'C+':lg>=73?'C':lg>=69?'C-':lg>=66?'D+':lg>=63?'D':lg>=60?'D-':'F';
  let blurb;
  if(G.champions>=1&&peakLate>=100&&hgRatio>=0.5)blurb="The blueprint, executed to perfection — you tanked, drafted a homegrown core, and raised a banner. Front-office legend.";
  else if(G.champions>=1)blurb="You brought home a title. However you got there, the ring is the ring.";
  else if(peakLate>=95)blurb="You built a contender and knocked on the door — just couldn't break through in October.";
  else if(earlyAvg<=72&&peakLate<88)blurb="You tore it down but the rise never fully arrived. Too many picks missed, or you sold the future too cheap.";
  else blurb="A middling six years — never bad enough to stock elite picks, never good enough to truly contend.";
  const winTxt=windowYears>=5?"wide open":windowYears>=3?"open":windowYears>=1?"closing":"shut";
  return {score,grade,blurb,items,windowYears,winTxt,hg,maxPay};
}
function scoringRubric(){return (typeof G!=="undefined"&&G&&G.mode==="survivor")?survivorRubric():gradeRubric();}
function survivorRubric(){
  const P=[
    ["🏆 World Series","First ring +50; each one after +7.5 per year since your last, up to +75. Always rescues you to at least green.","spike"],
    ["🥈 Reach the World Series","+2.5 per year since your last Series appearance, up to +25.","spike"],
    ["🎟️ Make the playoffs","+8 — your bread-and-butter. Ending a long playoff drought adds +5.","+8"],
    ["📈 Big seasons","100 wins +4 · 105 +6 · 110 +8 · best record in baseball +3.","bonus"],
    ["🎯 Beat your win target","Up to +6 for clearing the bar you agreed with the owner.","+6"],
    ["🏅 Player awards","+6 homegrown · +3 acquired · +1.5 if you got them that same year.","ledger"],
    ["⭐ Loyalty","Extend a homegrown player +2 (a fan favorite +4).","ledger"],
  ];
  const N=[
    ["📉 Miss your win target","Scales with the miss, worse if you declared \"Go for it.\" (Forgiven during the first two rebuild years.)","ledger"],
    ["🪑 Miss the playoffs repeatedly","Nothing for 1–2 years, then −2, −4, −7… escalating to unsurvivable by ~8 in a row.","escalates"],
    ["💸 Spend without winning","Big payroll and no October run drains favor, more so year after year.","ledger"],
    ["🕳️ Replacement-level holes","−1.2 for each sub-70 OVR starting spot you field.","ledger"],
    ["💔 Lose your stars","Trade a fan favorite −2; let a homegrown star walk in free agency for nothing −5.","ledger"],
    ["⌛ Time itself","The bar always bleeds — and bleeds faster the higher you sit, so the top is hard to hold.","decay"],
  ];
  const rP=r=>`<tr><td>${r[0]}<div class="small muted">${r[1]}</div></td><td class="num" style="color:var(--green);font-weight:700;white-space:nowrap;vertical-align:top">${r[2]==='spike'?'big':r[2]==='bonus'?'+':r[2]==='ledger'?'+':r[2]}</td></tr>`;
  const rN=r=>`<tr><td>${r[0]}<div class="small muted">${r[1]}</div></td><td class="num" style="color:var(--red);font-weight:700;white-space:nowrap;vertical-align:top">−</td></tr>`;
  return `<p class="sub">Career Mode isn't graded out of 100 — you're managing the <b>Owner Happiness</b> bar. Keep it above zero and your run continues; hit zero and you're fired. Meanwhile a <b>running score</b> climbs each year from wins, playoff runs, titles, awards, and your homegrown core. Final score also rewards seasons survived and rings.</p>
    <p class="small" style="color:var(--gold)"><b>The first two seasons are rebuild years</b> — you were hired to tear it down, so losing is expected and the owner stays patient. Normal expectations kick in from Year 3.</p>
    <p class="sub" style="margin-top:6px">📣 <b>Fan Favor</b> is a second meter beside the owner's. It can't fire you on its own — but let it sink too low and the unrest bleeds into the owner's office. Fans don't care about money; in fact they <i>like</i> a big payroll and resent penny-pinching — unless you're stocking real prospects and a plan for the future, which buys their patience. They live and die with winning, beloved homegrown players, and being spoken to honestly. A few times a year the <b>media</b> will put you on the spot mid-season; what you say there moves both meters, and a bold promise raises the bar you'll have to clear.</p>
    <div class="sectlbl" style="margin-top:6px">Gain favor</div>
    <table><tbody>${P.map(rP).join("")}</tbody></table>
    <div class="sectlbl">Lose favor</div>
    <table><tbody>${N.map(rN).join("")}</tbody></table>`;
}
function gradeRubric(){
  const P=[
    ["🏆 World Series titles","15 for your first ring, +10 for each one after","15, +10 ea"],
    ["📈 Peak wins (yrs 4–6)","best season once contending — 110+→30, 105→25, 100→20, 95→15, 90→10, 85→5","up to 30"],
    ["⚡ 100-win bonus","hit 100 wins by Year 3 →8; first reached in Yrs 4–6 →5","up to 8"],
    ["🎟️ Playoff appearances","4 pts for each October you reach","up to 16"],
    ["🏅 Player awards","+2 per award won, +1 more if the winner is homegrown","2–3 ea"],
    ["📉 Tanking early (yrs 1–2)","bottom out for premium picks — avg ≤66 W→15, ≤70→10, ≤75→5","up to 15"],
    ["🌱 Homegrown core","drafted regulars (74+ OVR) as a share of your real talent — 3+ & 60%→15, 2+ & 50%→10, 40%→6, 25%→3","up to 15"],
    ["🔭 Future window left","young, controllable core + farm at the finish — 5+ yrs→15, 3+→9, 1+→4","up to 15"],
  ];
  const N=[
    ["🕳️ Weak starting spots","−5 for every empty or sub-70 OVR starting spot, tallied at the end of each year in Yrs 4–6","−5 ea"],
    ["🔭 No future window","empty cupboard, nothing controllable left","−12"],
    ["💰 Bloated peak payroll","$320M+→−12, $280M+→−7, $240M+→−3","−12"],
    ["💸 Luxury tax","−5 for each season over the $300M line","−5 ea"],
    ["✍️ Free-agent reliance","−3 per FA regular beyond two","−3 ea"],
  ];
  const rP=r=>`<tr><td>${r[0]}<div class="small muted">${r[1]}</div></td><td class="num" style="color:var(--green);font-weight:700;white-space:nowrap;vertical-align:top">${r[2]}</td></tr>`;
  const rN=r=>`<tr><td>${r[0]}<div class="small muted">${r[1]}</div></td><td class="num" style="color:var(--red);font-weight:700;white-space:nowrap;vertical-align:top">${r[2]}</td></tr>`;
  return `<p class="sub">Six years, scored out of 100. The positives add up to far more than 100, so you can't — and don't need to — max them all. Chase the big tickets (a ring, a high peak, a homegrown core) and keep the books clean.</p>
    <div class="sectlbl" style="margin-top:6px">Earn points</div>
    <table><tbody>${P.map(rP).join("")}</tbody></table>
    <div class="sectlbl">Lose points</div>
    <table><tbody>${N.map(rN).join("")}</tbody></table>
    <div class="sectlbl">Letter grade</div>
    <div class="small">A+ 96+ &nbsp;·&nbsp; A 93–95 &nbsp;·&nbsp; A− 90–92 &nbsp;·&nbsp; B+ 86–89 &nbsp;·&nbsp; B 83–85 &nbsp;·&nbsp; B− 80–82 &nbsp;·&nbsp; C+ 76–79 &nbsp;·&nbsp; C 73–75 &nbsp;·&nbsp; C− 69–72 &nbsp;·&nbsp; D+ 66–68 &nbsp;·&nbsp; D 63–65 &nbsp;·&nbsp; D− 60–62 &nbsp;·&nbsp; F under 60</div>`;
}
function endGame(){
  inductActiveLegends();
  const h=G.history;
  const {score,grade,blurb,items,windowYears,winTxt,hg,maxPay}=computeGrade();
  render(`<div class="hero"><div class="pill gold">FRONT-OFFICE REVIEW${G.hard?' · <span style="color:#ff8a6b">🔥 HARD MODE</span>':''}</div>
     <h1 style="font-size:60px;margin:6px 0;color:var(--gold)">${score}${score<=100?'<span style="font-size:26px;color:var(--dim)">/100</span>':'<span style="font-size:22px;color:var(--gold)"> 🔥</span>'} &nbsp;${grade}</h1>
     ${score>100?'<p class="small" style="color:var(--gold);margin:0 0 4px">An all-time run — you blew past the 100-point ceiling.</p>':''}
     <p class="sub" style="max-width:600px;margin:0 auto">${blurb}</p></div>
   ${xpEndNotice()}
   <div class="panel"><h3>Why you scored ${score}</h3>
     <table><tbody>${items.map(it=>`<tr><td>${it.label}</td>
       <td class="num" style="color:${it.pts>0?'var(--green)':it.pts<0?'var(--red)':'var(--dim)'};font-weight:700">${it.pts>0?'+':''}${it.pts}</td></tr>`).join("")}</tbody></table>
     <p class="sub" style="margin-top:8px">Your window heading forward is <b style="color:var(--ink)">${winTxt}</b> — about ${windowYears} more competitive year${windowYears===1?'':'s'} of young, controllable talent.</p></div>
   <details class="panel" style="padding:14px"><summary style="cursor:pointer;font-weight:700">📐 How the grade is scored</summary><div style="margin-top:10px">${gradeRubric()}</div></details>
   <div class="grid4" style="margin-top:4px">
     <div class="kpi"><div class="big">${G.champions}</div><div class="lbl">World Series</div></div>
     <div class="kpi"><div class="big">${G.bestWins}</div><div class="lbl">Peak Wins</div></div>
     <div class="kpi"><div class="big">${hg}</div><div class="lbl">Homegrown Core</div></div>
     <div class="kpi"><div class="big">$${maxPay}M</div><div class="lbl">Peak Payroll</div></div></div>
   <div class="panel"><h3>Your 6-Year Timeline</h3>
     <table><thead><tr><th>Season</th><th class="num">Record</th><th class="num">Rank</th><th>Result</th></tr></thead><tbody>${
       h.map(x=>`<tr><td>Year ${x.year}</td><td class="num">${x.wins}-${x.losses}</td><td class="num">#${x.seed}</td>
         <td>${x.champ?'<span class="pill gold">🏆 WS</span>':x.playoffs?'<span class="pill green">Playoffs</span>':'<span class="muted">—</span>'}</td></tr>`).join("")}</tbody></table></div>
   <div class="panel center" id="lbsubmit">
     <h3>🏆 Post to the leaderboard</h3>
     <div style="margin:8px 0"><input id="lbname" maxlength="12" placeholder="Name or initials" style="width:200px"/></div>
     <button class="btn primary" onclick="submitScore()">Submit score ${score}</button>
     <button class="btn ghost" onclick="screenLeaderboard(true)">View leaderboard</button>
     ${feedbackEnabled()?'<div style="margin-top:8px"><button class="btn ghost" onclick="openFeedback()">📝 Leave a note for the creator</button></div>':''}
   </div>
   <div class="center" style="margin-top:8px"><button class="btn" onclick="(function(){localStorage.removeItem(SAVE);screenTitle();})()">New Franchise</button></div>
   <p class="disclaimer">Unofficial fan-made prototype • not affiliated with MLB/MLBPA • all data fictional.</p>`);
}

