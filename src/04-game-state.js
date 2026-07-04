/* ============================================================
   GAME STATE / SETUP
   ============================================================ */
let G=null;
const SAVE="tankCommander_v3";   // bumped for v5.1 — retires pre-rename ("River City Rovers") saves so everyone starts fresh on the new build
const SAVE_AT="tankCommander_saveAt";
function saveGame(){try{localStorage.setItem(SAVE,JSON.stringify(G));localStorage.setItem(SAVE_AT,String(Date.now()));archiveActive();}catch(e){}if(typeof cloudSync==="function")cloudSync();}
function loadGame(){try{const s=localStorage.getItem(SAVE);if(s){G=JSON.parse(s);migrateSave();return true;}}catch(e){}return false;}
/* ---- Runs library: every franchise is archived under its own key, so starting a new game (or a stray back-tap) can never overwrite another run ---- */
const RUNS_KEY="tankCommander_runs", RUN_PREFIX="tankCommander_run_", MAX_RUNS=12;
function loadRuns(){try{return JSON.parse(localStorage.getItem(RUNS_KEY)||"[]");}catch(e){return [];}}
function saveRuns(a){try{localStorage.setItem(RUNS_KEY,JSON.stringify(a));}catch(e){}}
function archiveActive(){
  if(typeof G==="undefined"||!G)return;
  if(!G._runId)G._runId=uid();
  try{localStorage.setItem(RUN_PREFIX+G._runId,JSON.stringify(G));}catch(e){return;}
  const runs=loadRuns();
  const meta={id:G._runId,name:G.teamName,mode:G.mode,owner:!!G.owner,clubValue:G.owner?G.owner.clubValue:0,year:G.year,league:G.league||'',div:G.div||'',
    score:G.mode==="survivor"?Math.round(G.cumScore||0):(G.champions||0),champions:G.champions||0,
    fired:!!G.fired,updated:Date.now()};
  const i=runs.findIndex(r=>r.id===meta.id);if(i>=0)runs[i]=meta;else runs.push(meta);
  runs.sort((a,b)=>b.updated-a.updated);
  runs.slice(MAX_RUNS).forEach(r=>{try{localStorage.removeItem(RUN_PREFIX+r.id);}catch(e){}});
  saveRuns(runs.slice(0,MAX_RUNS));
}
function resumeRun(id){
  try{const raw=localStorage.getItem(RUN_PREFIX+id);if(!raw){toast("That run's data is missing");return;}
    G=JSON.parse(raw);G._runId=id;migrateSave();localStorage.setItem(SAVE,JSON.stringify(G));localStorage.setItem(SAVE_AT,String(Date.now()));
    if(typeof cloudSync==="function")cloudSync();
    if(G.mode==="survivor"&&G.survStage===0&&!G.fired)startSurvivorYear();else goPhase(G.phase||0);
  }catch(e){toast("Couldn't load that run");}
}
function deleteRun(id){
  saveRuns(loadRuns().filter(r=>r.id!==id));
  try{localStorage.removeItem(RUN_PREFIX+id);}catch(e){}
  try{const s=localStorage.getItem(SAVE);if(s&&JSON.parse(s)._runId===id)localStorage.removeItem(SAVE);}catch(e){}
  screenTitle();
}
// bring an older save up to the 30-team, divisional structure
function migrateSave(){
  if(typeof G==="undefined"||!G||!G.ai)return;
  while(G.ai.length<29){G.ai.push({id:uid(),name:aiTeamName(G.ai.length),
    war:(G.mode==="survivor"?clamp(Math.round(gauss(33,12)),14,55):gauss(30,7)),
    mode:Math.random()<0.3?"rebuild":Math.random()<0.5?"contend":"steady",catProfile:genCatProfile(),block:[]});}
  if(!G.league||!G.div||G.ai.some(t=>!t.league))assignDivisions();
}

function newGame(teamName,mode,hard){
  const poolAll=DATA.map(clonePlayer);
  // add fictional prospects + replacement-level players to the league
  for(let i=0;i<46;i++)poolAll.push(ficProspect());
  for(let i=0;i<30;i++)poolAll.push(ficReplacement());
  // FICTIONAL_NAMES build (app-store version): swap every real player name for a unique generated one
  if(FICTIONAL_NAMES){const used=new Set(poolAll.filter(p=>p.fic).map(p=>p.name));
    poolAll.forEach(p=>{if(!p.fic){let nm,g=0;do{nm=ficName();}while(used.has(nm)&&g++<40);used.add(nm);p.name=nm;}});}
  for(let i=poolAll.length-1;i>0;i--){const j=ri(0,i);[poolAll[i],poolAll[j]]=[poolAll[j],poolAll[i]];}
  const take=(fn)=>{const i=poolAll.findIndex(fn);return i>=0?poolAll.splice(i,1)[0]:null;};
  const roster=[],farm=[];
  const add=(p,keep)=>{if(p){p.loc="mlb";if(keep)p._keeper=true;roster.push(p);}return p;};
  // --- a crossroads team: won it ~4 years ago, stars now aging & declining ---
  // 2 aging stars with real trade value (older, will fade) — wide bands so the inherited core varies a lot game-to-game
  add(take(p=>p.age>=31&&p.ovr>=81&&p.ovr<=91&&isHit(p))||take(p=>p.age>=30&&p.ovr>=80&&isHit(p)),true);
  add(take(p=>p.age>=31&&p.ovr>=82&&p.ovr<=91&&p.pos==="SP")||take(p=>p.age>=30&&p.ovr>=81&&p.pos==="SP"),true);
  // 1 useful mid-career vet (decent, tradeable)
  add(take(p=>p.age>=27&&p.age<=34&&p.ovr>=73&&p.ovr<=83&&isHit(p))||take(p=>p.ovr>=73&&p.ovr<=83&&isHit(p)),true);
  // 1 younger building block (not a star yet)
  add(take(p=>p.age<=28&&p.ovr>=72&&p.ovr<=80&&p.pot>=82&&isHit(p))||take(p=>p.age<=29&&p.ovr>=72&&p.ovr<=80),true);
  // an aging back-end closer (trade value)
  add(take(p=>p.pos==="RP"&&p.ovr>=78&&p.age>=29)||take(p=>p.pos==="RP"&&p.ovr>=76),true);
  // fill the rest with fictional replacement-level players (this is a mediocre team)
  const haveNat=s=>roster.some(p=>p.loc==="mlb"&&p.pos===s);
  const ofCount=()=>roster.filter(p=>p.loc==="mlb"&&["LF","CF","RF"].includes(p.pos)).length;
  if(!haveNat("C"))add(take(x=>x.pos==="C"&&x.fic)||take(x=>x.pos==="C"));
  ["1B","2B","3B","SS"].forEach(s=>{if(!haveNat(s))add(take(x=>x.pos===s&&x.fic&&x.ovr<=66)||take(x=>x.pos===s&&x.fic)||take(x=>x.pos===s&&x.ovr<=72)||take(x=>x.pos===s));});
  while(ofCount()<3){const p=take(x=>["LF","CF","RF"].includes(x.pos)&&x.fic)||take(x=>["LF","CF","RF"].includes(x.pos)&&x.ovr<=72)||take(x=>["LF","CF","RF"].includes(x.pos));if(!p)break;add(p);}
  while(roster.filter(p=>p.pos==="SP").length<5){const p=take(x=>x.pos==="SP"&&x.fic)||take(x=>x.pos==="SP"&&x.ovr<=70)||take(x=>x.pos==="SP");if(!p)break;add(p);}
  while(roster.filter(p=>p.pos==="RP").length<3){const p=take(x=>x.pos==="RP"&&x.fic)||take(x=>x.pos==="RP"&&x.ovr<=70)||take(x=>x.pos==="RP");if(!p)break;add(p);}
  // a couple bench bodies
  add(take(x=>isHit(x)&&x.fic)); add(take(x=>isHit(x)&&x.fic));
  // patch any empty lineup slot
  for(let g=0;g<14;g++){const a=buildActive(roster);const e=LINEUP.find(s=>!a.lineup[s]);if(!e)break;
    let p=(e==="DH")?take(x=>isHit(x)):(take(x=>x.pos===e)||take(x=>isHit(x)&&canPlaySlot(x,e)));if(!p)break;add(p);}
  // cap projected wins at 83 — swap strongest non-keeper starters for weak fictional fill
  let guard=0;
  while(warToWins(teamWAR(roster))>83&&guard++<14){
    const a=buildActive(roster);
    const starters=[...LINEUP.map(s=>a.lineup[s]).filter(Boolean),...a.rotation,...a.pen];
    const cut=starters.filter(p=>!p._keeper).sort((x,y)=>eff(y)-eff(x))[0];
    if(!cut)break;
    roster.splice(roster.indexOf(cut),1);
    const r=ficReplacement();r.pos=cut.pos;r.ovr=clamp(cut.pos==="RP"?ri(57,62):ri(59,64),52,66);r.pot=r.ovr+ri(0,3);r.loc="mlb";roster.push(r);
  }
  // thin farm: 2 modest fictional prospects
  for(let i=0;i<2;i++){const p=take(x=>x.prospect&&x.pot>=78&&x.pot<=90&&x.ovr<=58);if(p){p.loc="farm";farm.push(p);}}

  // your Created Player joins the farm as a homegrown cornerstone
  if(typeof makeCreatedProspect==="function"){const cp=makeCreatedProspect();if(cp)farm.push(cp);}
  roster.forEach(p=>p.src=p.src||"original");farm.forEach(p=>p.src=p.src||"original");
  G={year:1,phase:0,teamName:teamName||warPun(),mode:mode||"career",hard:!!hard,
    roster,farm,pool:poolAll,
    ai:Array.from({length:29},(_,i)=>({id:uid(),name:aiTeamName(i),war:(mode==="survivor"?clamp(Math.round(gauss(33,12)),14,55):gauss(hard?33.5:30,7)),
      mode:Math.random()<0.3?"rebuild":Math.random()<0.5?"contend":"steady",catProfile:genCatProfile()})),
    ownedPicks:freshDraftPicks(), standings:[], lastWins:null, history:[],
    champions:0, playoffApps:0, bestWins:0, worstWins:200,
    tradeTries:3, leftAsFA:[], faMarket:[], faYear:0, maxPayroll:0, taxYears:0, taxWinsLost:0,
    lineupSet:{}, seasonStage:0, pendingComp:[], awardPoints:0, awardsLog:[], awardsYear:0,
    weakSpotsTotal:0, weakSpotsYear:0,
    resources:{scouting:1/3,development:1/3,coaching:1/3},
    // --- Career Mode state ---
    favor:62, fanFavor:58, reputation:88, survStage:0, survTitles:0,
    lastTitleYear:null, lastWSYear:null, lastPlayoffYear:null,
    missStreak:0, taxNoRunStreak:0, cumScore:0, fired:false,
    stance:null, ownerBar:null, agreedBar:null, favorLog:[], fanLog:[]};
  G.ownedPicks=freshDraftPicks();   // re-roll now that G.mode is set (survivor = 5 rounds, career = 3)
  assignDivisions();
  saveGame();
}
// place the player + 29 AI clubs into 6 divisions (5 each) across the two leagues
function assignDivisions(){
  G.league=pick(LEAGUES).key; G.div=pick(DIV_KEYS);
  const slots=[];LEAGUES.forEach(l=>DIV_KEYS.forEach(d=>{for(let k=0;k<5;k++)slots.push({league:l.key,div:d});}));
  const mi=slots.findIndex(s=>s.league===G.league&&s.div===G.div);slots.splice(mi,1);   // the player takes one slot
  for(let i=slots.length-1;i>0;i--){const j=ri(0,i);[slots[i],slots[j]]=[slots[j],slots[i]];}   // shuffle
  G.ai.forEach((t,i)=>{t.league=slots[i].league;t.div=slots[i].div;});
}
let _aiNames=null;
// --- league structure: 2 leagues × 3 divisions × 5 teams = 30 ---
const LEAGUES=[{key:"AL",name:"Allied League"},{key:"NL",name:"Nexus League"}];
const DIV_KEYS=["Echo","Delta","Bravo"];
const leagueNameOf=k=>(LEAGUES.find(l=>l.key===k)||{}).name||k;
function aiTeamName(i){
  if(!_aiNames){
    const cities=["River City","Granite Bay","Harbor","Summit","Crown","Lakeside","Iron City","Cedar Falls","Bayou","Capitol","Gold Coast","Northgate","Sienna","Verde Valley","Old Port","Twin Pines","Silver Lake","Red Mesa","Fort Union","Black Rock","Maple Ridge","Coral Bay","High Plains","Sterling","Briar Hollow","Cobalt","Marble Hill","Sandstone","Frost Peak","Willowbrook","Ember City","Dust Bowl","Pine Bluff","Glass Harbor"];
    const nicks=["Rovers","Stags","Anchors","Quakes","Monarchs","Pioneers","Ironworks","Foxes","Pelicans","Senators","Surfers","Sentinels","Coyotes","Condors","Otters","Timber","Wolves","Comets","Mariners","Bison","Ravens","Drakes","Mustangs","Outlaws","Privateers","Vipers","Aviators","Cardinals","Badgers","Knights","Reapers","Hammers","Gladiators","Tridents"];
    _aiNames=[];const uc=[...cities],un=[...nicks];
    for(let k=0;k<30;k++){_aiNames.push((uc.splice(ri(0,uc.length-1),1)[0])+" "+(un.splice(ri(0,un.length-1),1)[0]));}
  }
  return _aiNames[i+1];
}

