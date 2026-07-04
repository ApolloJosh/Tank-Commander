/* ============================================================
   SEASON
   ============================================================ */
function rollSeasonInjuries(){
  const mlb=G.roster.filter(p=>p.loc==="mlb");
  mlb.forEach(p=>{p.inj=0;p.injType=null;p._il=false;});
  const injured=[];const hm=G.hard?1.5:1;   // Hard Mode: more realistic (higher) injury frequency
  const healF=(G.owner&&G.owner.healBonus)?clamp(1-G.owner.healBonus*0.15,0.5,1):1;   // medical investments cut injuries
  mlb.forEach(p=>{
    const dura=p.dura==null?70:p.dura;
    const chance=Math.min(clamp((100-dura)/205+Math.max(0,(p.age-30))*0.005,0.03,0.55)*hm*healF,0.7);
    if(Math.random()<chance){
      const longChance=clamp(0.18+Math.max(0,(p.age-30))*0.012+(100-dura)/420,0.1,0.55);
      let games,type;
      if(Math.random()<longChance){games=ri(60,150);type="long";if(Math.random()<0.12)games=162;}
      else{games=ri(12,52);type="short";}
      p.inj=games;p.injType=type;injured.push(p);
      if(G.hard&&type==="long")p._il=true;   // out more than one break → onto the Injured List
    }
  });
  G._seasonInjured=injured;G._injRolled=G.year;
  return injured;
}
function simulateRegularSeason(){
  const mlb=G.roster.filter(p=>p.loc==="mlb");
  if(G._injRolled!==G.year)rollSeasonInjuries();   // Hard Mode pre-rolls injuries at a break; otherwise roll now
  const injured=(G._seasonInjured||[]).filter(p=>p.loc==="mlb"&&G.roster.indexOf(p)>=0);
  const _sv=mlb.map(p=>p.inj),_svil=mlb.map(p=>p._il);mlb.forEach(p=>{p.inj=0;p._il=false;});const healthyWAR=teamWAR(G.roster);mlb.forEach((p,i)=>{p.inj=_sv[i];p._il=_svil[i];});
  if(G.mode==="survivor"){
    // endless mode: every club chases its OWN goal — some go all-in (contenders), some tear it down (tankers),
    // and they re-roll their aim over time. That keeps a wide, living spread (true contenders AND tankers), not a middling blob.
    G.ai.forEach(t=>{
      if(t.tgt==null||Math.random()<0.11)t.tgt=clamp(Math.round(gauss(33,14)),14,56);   // commit to a multi-year plan, re-roll occasionally
      t.war=clamp(t.war+(t.tgt-t.war)*0.45+gauss(0,2.2),12,58);                          // push toward it harder so contenders/tankers reach the extremes
    });
  } else {
    // 6-year arc: rival clubs improve over time as their own farms develop — the league bar rises each year (faster on Hard)
    G.ai.forEach(t=>{let d=((t.mode==="rebuild"?gauss(1.6,2):t.mode==="contend"?gauss(0.5,2):gauss(0.2,1.7))+gauss(0.7,0.5))*(G.hard?1.4:1);
      t.war=clamp(t.war+d,10,60);});
  }
  const myWAR=teamWAR(G.roster);
  const injWinsLost=clamp(round((healthyWAR-myWAR)*1.4),0,99);
  const entries=[{name:G.teamName,war:myWAR,me:true,league:G.league,div:G.div},...G.ai.map(t=>({name:t.name,war:t.war,league:t.league,div:t.div,id:t.id}))];
  entries.forEach(e=>{e.wins=clamp(round(warToWins(e.war)+gauss(0,4.6)),47,116);e.losses=162-e.wins;});
  if(G.hard){const me0=entries.find(e=>e.me);me0.wins=clamp(me0.wins-ri(3,6),40,116);me0.losses=162-me0.wins;}   // Hard: a tougher schedule shaves a few wins
  // luxury tax: every $10M of payroll over $300M costs the user 1 win
  const tax=luxuryTax();
  G.maxPayroll=Math.max(G.maxPayroll||0,payroll(G.roster));
  if(tax>0){const m=entries.find(e=>e.me);m.wins=clamp(m.wins-tax,40,116);m.losses=162-m.wins;
    G.taxYears=(G.taxYears||0)+1;G.taxWinsLost=(G.taxWinsLost||0)+tax;}
  if(G.owner&&G.owner.homeEdge){const m=entries.find(e=>e.me);m.wins=clamp(m.wins+Math.round(G.owner.homeEdge),40,118);m.losses=162-m.wins;}   // a rowdy die-hard home crowd
  if(G.owner&&G.owner.parkFactor){const {bal,pf}=ownerParkSynergy();const m=entries.find(e=>e.me);   // outfield dimensions: park that suits your roster wins you games at home
    m.wins=clamp(m.wins+Math.round(clamp(pf*clamp(bal/8,-0.5,0.5)*6,-3,3)),40,118);m.losses=162-m.wins;}
  entries.sort((a,b)=>b.wins-a.wins);entries.forEach((e,i)=>e.seed=i+1);   // overall seed = draft order (worst drafts #1)
  const field=mlbPlayoffField(entries);          // 12 playoff teams, seeded 1–6 within each league
  const me=entries.find(e=>e.me);
  // stash regular-season results; the bracket runs after the player sets their playoff roster
  G._po={entries,injured,tax,injWinsLost,healthyWAR};
  return {me,madePO:!!me.playoff,entries,field};
}
// Run October on the roster the player set at the playoff break, then finalize the season.
function runPlayoffsAndFinish(){
  const po=G._po||{};const entries=po.entries||G.standings;
  const me=entries.find(e=>e.me);
  const field=mlbPlayoffField(entries);          // re-seed (records unchanged) so the bracket is consistent
  me.war=teamWAR(G.roster);                       // playoff strength reflects the lineup/rotation the player just set
  const champ=runMLBPlayoffs(field);
  const madePO=!!me.playoff;
  G.standings=entries;G.lastWins=me.wins;
  G.bestWins=Math.max(G.bestWins,me.wins);G.worstWins=Math.min(G.worstWins,me.wins);
  if(madePO)G.playoffApps++;
  if(_poInfo.reachedWS)G.wsApps=(G.wsApps||0)+1;
  const wonWS=champ&&champ.me;if(wonWS){G.champions++;G.roster.filter(p=>p.loc==="mlb").forEach(p=>p._rings=(p._rings||0)+1);}
  const NT=G.ai.length+1;const mySlot=NT+1-me.seed;   // worst overall record drafts #1
  G.ownedPicks.forEach(pk=>{if(pk.future&&pk.fromMe){pk.slot=mySlot;pk.future=false;}});
  generateSeasonStats();   // each big-leaguer gets this year's stat line
  G.history.push({year:G.year,wins:me.wins,losses:me.losses,seed:me.seed,playoffs:madePO,champ:wonWS,division:`${me.league} ${me.div}`,divRank:me.divRank});
  G._po=null;
  return {me,entries,injured:po.injured,champ,wonWS,madePO,reachedWS:_poInfo.reachedWS,poRounds:_poInfo.rounds,mySlot,tax:po.tax,injWinsLost:po.injWinsLost,healthyProj:warToWins(po.healthyWAR)};
}
// non-interactive callers (bots/tests) run the whole season in one shot
function simulateSeason(){simulateRegularSeason();return runPlayoffsAndFinish();}
let _poInfo={reachedWS:false,rounds:0};   // how far the user advanced in October (for Survivor favor)
// Build the 12-team field: per league, 3 division winners (seeds 1–3 by record) + 3 wild cards (seeds 4–6).
function mlbPlayoffField(entries){
  const field=[];
  entries.forEach(e=>{e.playoff=false;e.divRank=null;});
  LEAGUES.forEach(L=>{
    const lg=entries.filter(e=>e.league===L.key);
    const winners=[];
    DIV_KEYS.forEach(d=>{const dv=lg.filter(e=>e.div===d).sort((a,b)=>b.wins-a.wins);
      dv.forEach((e,i)=>e.divRank=i+1);
      if(dv[0])winners.push(dv[0]);});
    winners.sort((a,b)=>b.wins-a.wins);                                  // div winners seeded 1–3
    const wc=lg.filter(e=>!winners.includes(e)).sort((a,b)=>b.wins-a.wins).slice(0,3);  // wild cards 4–6
    const six=[...winners,...wc];six.forEach((e,i)=>{e.lgSeed=i+1;e.playoff=true;});
    field.push({league:L.key,teams:six});
  });
  return field;
}
// Run the current MLB bracket (WC: 3v6 & 4v5; 1–2 bye; DS; LCS; WS) and return the champion.
function runMLBPlayoffs(field){
  const cb=1+(((G.resources?G.resources.coaching:0.333)-0.333)*0.32);
  const dm=1+(teamDawg()-50)/50*0.10;
  const chem=1+(teamChem()-60)/40*0.08;   // a happy clubhouse: chemistry is a small October edge
  _poInfo={reachedWS:false,rounds:0};
  const series=(a,b)=>{ if(!a)return b; if(!b)return a;
    const sa=(a.war+22)*(a.me?cb*dm*chem:1), sb=(b.war+22)*(b.me?cb*dm*chem:1);
    const pa=clamp(sa/(sa+sb),0.30,0.68); const w=Math.random()<pa?a:b;
    if((a.me||b.me)&&w.me)_poInfo.rounds++;
    return w; };
  const champ={};
  field.forEach(({league,teams})=>{
    const s={};teams.forEach(t=>s[t.lgSeed]=t);
    const wcA=series(s[3],s[6]), wcB=series(s[4],s[5]);   // wild card round (1 & 2 rest)
    const wcW=[wcA,wcB].sort((a,b)=>a.lgSeed-b.lgSeed);
    const dsA=series(s[1], wcW[wcW.length-1]);            // 1 seed vs lowest remaining
    const dsB=series(s[2], wcW[0]);
    champ[league]=series(dsA,dsB);                        // league championship
  });
  if((champ.AL&&champ.AL.me)||(champ.NL&&champ.NL.me))_poInfo.reachedWS=true;
  return series(champ.AL,champ.NL);                       // World Series
}

