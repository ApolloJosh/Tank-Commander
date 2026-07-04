/* ============================================================
   DEVELOP / AGE / CONTRACTS
   ============================================================ */
const DEV_BAD=["spent too much of the offseason at the strip club","showed up to camp out of shape","got too comfortable after the big payday","lost his swing tinkering with his mechanics","battled nagging injuries all winter","let the pressure get in his head","fell in with the wrong crowd","never adjusted once the league figured him out","skipped his offseason program entirely","couldn't recapture last year's form","tweaked something lifting and never got right","partied through the winter and reported heavy","lost his confidence after a rough September","changed agents, changed his swing — for the worse","feuded with the coaching staff all spring","opened camp looking a half-step slow","pressed trying to live up to the hype","couldn't shake a dead arm all winter"];
const DEV_GOOD=["spent all offseason in the gym and came in locked in","reworked his swing and it finally clicked","added a nasty new pitch over the winter","credits a new mental-skills coach","showed up in the best shape of his life","put it all together — the light came on","hired a private hitting guru and it paid off","is finally healthy, and it shows","dropped fifteen pounds and looks a step quicker","spent the winter in the Dominican grinding with a private coach","finally bought into the analytics and retooled his approach","added a leg kick and his bat woke up","had a nagging issue cleaned up in surgery and feels new","studied film all winter and came in with a plan","found a velocity jump in a new throwing program","grew up over the winter and looks the part now","unlocked more power in a new lifting block","simplified his approach and stopped chasing"];
// smaller, terser moves — kept varied so the report doesn't read like a copy-paste
const DEV_MINOR_UP=["ticked forward","made quiet progress","took a small step","kept grinding and it shows","added a little polish","trending up","sharpened a few rough edges","incremental gains","a steady step up","building good habits"];
const DEV_MINOR_DOWN=["slipped a touch","took a small step back","lost a hair off his game","didn't build on last year","a step slower than before","leveled off","a minor regression"];
const DEV_FLAT=["held steady","right where he was","no real change","stayed the course","status quo"];
// busted ceiling but didn't lose ground — the upside cooled rather than the player declining
const DEV_UNDER=["didn't develop as much as hoped","stalled short of expectations","his progress flattened out","couldn't take the next step","the breakout never came","scouts cooled on his ceiling"];
/* ---- Team Hall of Fame: long-tenured players with hardware, rings, and peak greatness get enshrined ---- */
function hofScore(p){const years=p._teamYears||0,awards=(p._awards||[]).length,rings=p._rings||0,peak=p._peak||p.ovr;
  let s=years*3+awards*12+rings*10+Math.max(0,peak-80)*1.5;if(p.fanFav)s+=8;if(p.src==="draft")s+=6;return Math.round(s);}
function hofEligible(p){return (p._teamYears||0)>=4 && hofScore(p)>=42;}
function induct(p,reason){if(!p||p._hof||!hofEligible(p))return;p._hof=true;G.hof=G.hof||[];
  G.hof.push({name:p.name,pos:p.pos,join:p._joinYear||1,leave:G.year,years:p._teamYears||0,
    peak:p._peak||p.ovr,rings:p._rings||0,awards:(p._awards||[]).slice(),allStars:p._allStar||0,fanFav:!!p.fanFav,
    homegrown:p.src==="draft",reason:reason||'retired',score:hofScore(p),leagueHof:!!p._leagueHof,leagueVote:p._leagueHofVote||0});}
function inductActiveLegends(){(G.roster||[]).forEach(p=>{evalLeagueHof(p);induct(p,'franchise icon');});}
/* ---- League Hall of Fame: the pinnacle, voted in at retirement — a far higher, career-wide bar than the team HOF ---- */
function leagueHofScore(p){const peak=p._peak||p.ovr;
  const years=Math.max(p._teamYears||0,(p.age||30)-21);   // career-length proxy
  return Math.round(Math.max(0,peak-82)*5 + years*1.6 + (p._rings||0)*8 + ((p._awards||[]).length)*14 + (p._allStar||0)*4);}
const LEAGUE_HOF_BAR=100;
function leagueTie(p){const t=[];
  if((p._teamYears||0)>=7)t.push(`${p._teamYears} seasons with your club`);
  if(p.src==="draft")t.push("you drafted him");
  if((p._rings||0)>=2)t.push(`${p._rings} rings with you`);
  return t;}
function evalLeagueHof(p){
  if(!p||p._leagueHofChecked)return; p._leagueHofChecked=true;
  const hb=(G.owner&&G.owner.hofBoost)?G.owner.hofBoost*7:0;   // team museum strengthens your legends' cases
  if(leagueHofScore(p)+hb<LEAGUE_HOF_BAR)return;
  const vote=Math.round(clamp(75+(leagueHofScore(p)+hb-LEAGUE_HOF_BAR)*0.5,75,99.8)*10)/10;
  p._leagueHof=true; p._leagueHofVote=vote;
  const tie=leagueTie(p), mine=tie.length>0;
  if(mine){const pts=20+(p._rings||0)*5+((p._awards||[]).length)*6;
    G.cumScore=(G.cumScore||0)+pts; p._leagueHofPts=pts;
    if(G.mode==="survivor"){favorChange(4,`${p.name} was elected to the Hall of Fame`);fanChange(6,`Franchise legend ${p.name} is a Hall of Famer`);}}
  (G.leagueHof=G.leagueHof||[]).push({name:p.name,pos:p.pos,peak:p._peak||p.ovr,
    years:Math.max(p._teamYears||0,(p.age||30)-21),rings:p._rings||0,awards:(p._awards||[]).length,
    allStars:p._allStar||0,vote,inYear:G.year,mine,tie,homegrown:p.src==="draft",pts:p._leagueHofPts||0});}
// a trickle of rival-team legends each year so the League HOF feels league-wide
function maybeAddLeagueLegend(){
  if(G.mode!=="survivor"&&(G.year||0)<6)return;
  if(Math.random()>0.5)return;
  (G.leagueHof=G.leagueHof||[]).push({name:ficName(),pos:pick(POSPOOL),peak:clamp(Math.round(gauss(91,3)),86,99),
    years:ri(13,21),rings:Math.random()<0.5?ri(0,4):0,awards:Math.random()<0.4?ri(1,3):0,allStars:ri(3,10),
    vote:Math.round(clamp(75+gauss(8,6),75,99.6)*10)/10,inYear:G.year,mine:false,tie:[],homegrown:false,pts:0});}
// the age a player's body tends to give out — fragile ~32, average ~38, iron ~42
function retireAge(p){const df=clamp(p.dura==null?70:p.dura,20,99);return Math.round(36+(df-55)/7);}
function willRetire(p){const ra=retireAge(p);
  if(p.age>ra+3)return true;                                  // nobody plays more than ~3 years past their number
  if(p.ovr<=30&&p.age>=33)return true;                        // washed out
  if(p.age>=ra)return Math.random()<(p.ovr>=72?0.35:0.8);     // at the cliff: useful vets often get another year, fringe guys hang it up
  return false;}
function developAll(){
  const notes=[];
  const devList=[];                                              // structured per-player offseason report (your org only)
  const mine=new Set(G.roster.concat(G.farm).map(p=>p.id));      // only players in YOUR organization get a report line
  // franchise tenure: count each season a player spends in your organization (for the Hall of Fame)
  G.roster.concat(G.farm).forEach(p=>{if(!p._joinYear)p._joinYear=G.year;p._teamYears=(p._teamYears||0)+1;});
  const dev=(G.resources?G.resources.development:0.333);
  G.roster.forEach(p=>{p.inj=0;p.injType=null;p._il=false;});   // injuries heal over the offseason; IL clears
  G._injRolled=null;G._seasonInjured=null;
  const all=G.roster.concat(G.farm).concat(G.pool);
  all.forEach(p=>{
    const b=p.ovr;
    let bust=false,broke=false;                                  // did a ceiling-slip or breakout fire this winter?
    if(p.realCeil==null)p.realCeil=Math.max(p.ovr,p.pot);
    const tgt=Math.min(p.realCeil,p.pot);   // they grow toward realized ceiling, not the dream
    const pdev=clamp(dev+gmDevBonus(p),0,1);   // a specialist GM accelerates the players in his wheelhouse
    // durability shapes the aging curve: fragile bodies break down faster (steeper decline), iron men age gracefully
    const ageMult=clamp(1+(70-(p.dura==null?70:p.dura))/55,0.55,1.7);
    if(p.age<=25){
      const onFarm=p.loc==="farm";
      // Development helps everywhere — a big lift in the minors, a smaller (but real) one in the majors
      const devMult=onFarm?(0.55+pdev*1.7):(0.6+pdev*0.6);
      const pushChance=onFarm?pdev*0.26:pdev*0.10;   // dev can push a player past their scouted ceiling (rarer up top)
      if(Math.random()<pushChance){p.pot=clamp(p.pot+ri(1,onFarm?5:3),p.pot,99);p.realCeil=clamp(p.realCeil+ri(1,onFarm?4:3),p.ovr,p.pot);}
      if(Math.random()<0.04){p.pot=clamp(p.pot-ri(1,5),p.ovr,99);}                       // scouts sour
      else if(Math.random()<0.05){p.pot=clamp(p.pot+ri(2,6),p.pot,99);p.realCeil=clamp(p.realCeil+ri(2,5),p.ovr,p.pot);} // rare late breakout
      const t=Math.min(p.realCeil,p.pot);
      const g=Math.max(0,(t-p.ovr))*rnd(0.30,0.55)*devMult;
      p.ovr=clamp(round(p.ovr+(t>p.ovr?Math.max(1,g):0)),28,99);}
    else if(p.age<=27){const dm=p.loc==="farm"?(0.7+pdev*1.0):(0.78+pdev*0.45);p.ovr=clamp(round(p.ovr+(tgt>p.ovr?rnd(1,3.5)*dm:rnd(-1,1)*ageMult)),28,99);}
    else if(p.age<=30){let d=(tgt>p.ovr?rnd(-0.5,1.5):rnd(-1.5,.5));if(d<0)d*=ageMult;p.ovr=clamp(round(p.ovr+d),28,99);}
    else if(p.age<=32){p.ovr=clamp(round(p.ovr+rnd(-2.5,0)*ageMult),28,99);}
    else{p.ovr=clamp(round(p.ovr-rnd(1.5,4.5)*ageMult),22,99);}
    // offseason developmental storylines — volatility that can sink a "sure thing" or lift a long shot.
    // The bigger the hype, the further there is to fall; lower-ceiling guys occasionally pop.
    if((p.loc==="mlb"||p.loc==="farm")&&p.age<=27&&p.pot>p.ovr-1){
      const bustCh=0.05+Math.max(0,(p.pot-88))*0.014;      // a 99-ceiling has ~20%/yr to take a step back
      const breakCh=0.06+Math.max(0,(82-p.pot))*0.004;
      if(Math.random()<bustCh){
        p.realCeil=clamp((p.realCeil||p.pot)-ri(4,12),Math.max(28,p.ovr-2),99);
        p.pot=clamp(p.pot-ri(0,6),Math.max(p.ovr,p.realCeil),99);
        if(p.ovr>40&&Math.random()<0.5)p.ovr=clamp(p.ovr-ri(1,3),28,99);
        bust=true;
      } else if(Math.random()<breakCh){
        p.pot=clamp(p.pot+ri(4,11),p.pot,99);
        p.realCeil=clamp((p.realCeil||p.pot)+ri(5,13),p.ovr,99);
        p.ovr=clamp(p.ovr+ri(1,3),28,99);
        broke=true;
      }
    }
    p._peak=Math.max(p._peak||p.ovr,p.ovr);   // remember a player's best so we can flag decline
    p.age++;
    // record a single condensed line for each of YOUR players whose stock moved (or who has a story)
    if(mine.has(p.id)&&(p.loc==="mlb"||p.loc==="farm")){
      const d=p.ovr-b;
      if(d!==0||bust||broke)devList.push({name:p.name,pos:p.pos,b,a:p.ovr,d,bust,broke,age:p.age,farm:p.loc==="farm"});
    }
  });
  assignDevStories(devList);   // attach a non-repeating narrative that matches each player's actual move
  // ----- player happiness (morale): winning, playing time, fair pay and security lift it; losing and the bench sink it -----
  {
    const act=buildActive(G.roster);
    const starters=new Set([...LINEUP.map(s=>act.lineup[s]),...act.rotation,...act.pen].filter(Boolean).map(x=>x.id));
    const lastH=(G.history&&G.history.length)?G.history[G.history.length-1]:null;
    G.roster.concat(G.farm).forEach(p=>{
      let h=happyVal(p);
      if(lastH){if(lastH.champ)h+=9;else if(lastH.playoffs)h+=4;else if(lastH.wins<70)h-=4;else h-=1;}
      if(p.loc==="farm"){if(p.ovr>=72)h-=4;}              // MLB-ready but buried in the minors
      else{h+=starters.has(p.id)?2:-3;}                   // playing every day vs riding the bench
      const mkt=salaryFor(p.ovr,6,p.pos);
      if((p.mlbYears||0)>=4){if(p.salary<mkt*0.5)h-=4;else if(p.salary>=mkt*0.9)h+=2;}   // underpaid vs paid his worth
      if(p.loc==="mlb"&&(p.years||0)<=1&&!p.locked)h-=3;  // wants security in a contract year
      h+=(60-h)*0.10;                                     // moods drift back toward content
      p.happy=clamp(Math.round(h),0,100);
      if(p.happy<15&&!p._tradeReq&&p.loc==="mlb"){p._tradeReq=true;notes.push(`🔁 ${p.name} is unhappy and has requested a trade.`);}
      else if(p.happy>=42)p._tradeReq=false;
    });
  }
  // MLB service accrues; salary re-scales to ability + service (payroll grows over time).
  // A service-time hold (mid-season call-up) skips one offseason of service/contract burn.
  G.roster.forEach(p=>{if(p.loc==="mlb"){
    if(p._svcHold){p._svcHold=false;p._skipYr=true;}
    else if(p.locked){p.mlbYears=Math.max(p.mlbYears||6,6);}   // locked deal: salary stays fixed (good value or dead money)
    else{p.mlbYears=(p.mlbYears||initService(p.age))+1;p.salary=salaryFor(p.ovr,p.mlbYears,p.pos);}
  }});
  // contracts tick (mlb only); expirations walk as FA
  G.leftAsFA=[];
  G.roster=G.roster.filter(p=>{
    if(p.loc==="mlb"){if(p._skipYr){p._skipYr=false;}else{p.years--;}if(p.years<=0){
      if(G.mode==="survivor"&&(isFanFav(p)||(p.src==="draft"&&p.ovr>=82))){favorChange(-5,`Let homegrown star ${p.name} walk for nothing`);fanChange(isFanFav(p)?-8:-4,`Fans watched ${p.name} leave for nothing`);}
      induct(p,'left in free agency');G.leftAsFA.push(p);return false;}}
    return true;
  });
  // retirements — durability sets when a body gives out: fragile players walk away years earlier, iron men hang on
  const ret=[];
  G.roster=G.roster.filter(p=>{if(willRetire(p)){evalLeagueHof(p);induct(p,'retired');ret.push(p);return false;}return true;});
  maybeAddLeagueLegend();
  G.farm=G.farm.filter(p=>p.ovr>24 && p.age<retireAge(p)+2);
  G.pool=G.pool.filter(p=>p.age<retireAge(p)+2 && p.ovr>28 && !(p.age>=34&&p.ovr<=32));
  // rival farm systems: a fresh draft/international class enters the league each year,
  // so new high-ceiling prospects keep appearing around the league to scout and trade for
  const classN=ri(13,19);
  for(let i=0;i<classN;i++)G.pool.push(ficProspect());
  // Survivor mode runs for decades — keep the pool from bloating by cutting the league's least-useful, non-prospect fringe
  if(G.mode==="survivor"&&G.pool.length>300){
    const keep=p=>p.prospect||(p.pot>=80)||p.ovr>=72;
    const core=G.pool.filter(keep), fringe=G.pool.filter(p=>!keep(p)).sort((a,b)=>tradeValue(b)-tradeValue(a));
    G.pool=core.concat(fringe.slice(0,Math.max(0,300-core.length)));
  }
  const cuts=enforceRosterCaps();   // keep long runs from bloating: 20-man MLB, 50-man org
  return {notes,devList,retired:ret,fa:G.leftAsFA,cuts};
}
// ---- roster caps: 20 in the majors, 50 in the whole org ----
// clears positional logjams by moving on from 2+ year players buried on the depth chart (3-deep for hitters,
// 5-deep for pitchers), ranked by ceiling — packaging a couple for an upgrade when it can, releasing the rest.
const MLB_ROSTER_CAP=20, ORG_ROSTER_CAP=50;
function enforceRosterCaps(){
  const log=[];
  const ceilOf=p=>Math.max(p.ovr||0,(p.realCeil||p.pot||p.ovr||0));
  const isPitPos=pos=>pos==="SP"||pos==="RP";
  const mlbN=()=>G.roster.length;                 // G.roster IS the big-league roster
  const orgN=()=>G.roster.length+G.farm.length;
  const drop=p=>{let i=G.roster.indexOf(p);if(i>=0){G.roster.splice(i,1);}else{i=G.farm.indexOf(p);if(i>=0)G.farm.splice(i,1);else return null;}
    p._teamYears=0;p.years=p.years||1;(G.pool=G.pool||[]).push(p);return true;};   // released players re-enter the league pool
  // who's surplus: per position keep the top (3 hitters / 5 pitchers) by ceiling; the rest, if 2+ yrs with the club, are cuttable
  const surplus=()=>{
    const byPos={};G.roster.concat(G.farm).forEach(p=>{(byPos[p.pos]=byPos[p.pos]||[]).push(p);});
    const out=[];
    Object.keys(byPos).forEach(pos=>{const keep=isPitPos(pos)?5:3;
      byPos[pos].slice().sort((a,b)=>ceilOf(b)-ceilOf(a)).slice(keep).forEach(p=>{if((p._teamYears||0)>=2)out.push(p);});});
    return out.sort((a,b)=>ceilOf(a)-ceilOf(b));    // worst ceiling moves first
  };
  let cands=surplus(),cons=0;
  // 1) trim the ORG down to 50 using the surplus rule — consolidate two into an upgrade now and then, otherwise release
  while(orgN()>ORG_ROSTER_CAP && cands.length){
    if(cands.length>=2 && cons<2 && Math.random()<0.45){
      const a=cands.shift(),b=cands.shift();drop(a);drop(b);
      const need=(needsSurplus().needs[0])||a.pos;
      const star=ficVeteran(true);
      star.ovr=clamp(Math.max(ceilOf(a),ceilOf(b))+ri(2,6),62,92);
      star.pot=Math.max(star.pot||star.ovr,star.ovr);
      star.pos=(isPitPos(need)||LINEUP.includes(need))?need:a.pos;
      star.age=ri(25,30);star.salary=salaryFor(star.ovr,4,star.pos);star.years=ri(2,4);star.src="trade";star.mlbYears=4;star._teamYears=0;star.inj=0;star.prospect=false;
      const toMlb=(star.ovr>=70&&mlbN()<MLB_ROSTER_CAP);star.loc=toMlb?"mlb":"farm";(toMlb?G.roster:G.farm).push(star);
      log.push(`🔁 Packaged ${a.name} + ${b.name} for ${star.pos} ${star.name} (${star.ovr} OVR)`);cons++;
    } else {
      const p=cands.shift();drop(p);log.push(`🔻 Released ${p.pos} ${p.name} (${ceilOf(p)} ceiling) — surplus depth at ${p.pos}`);
    }
  }
  // 2) hard org cap — if surplus ran out, let the lowest-ceiling fringe go (farm first)
  while(orgN()>ORG_ROSTER_CAP){
    const arr=G.farm.length?G.farm:G.roster;let low=arr[0];arr.forEach(p=>{if(ceilOf(p)<ceilOf(low))low=p;});
    drop(low);log.push(`🔻 Released ${low.name} — 50-man org limit`);
  }
  // 3) 20-man MLB cap — option the lowest-ceiling big-leaguers to the minors (release only if the farm is full)
  while(mlbN()>MLB_ROSTER_CAP){
    let low=G.roster[0];G.roster.forEach(p=>{if(ceilOf(p)<ceilOf(low))low=p;});
    if(orgN()<ORG_ROSTER_CAP){const i=G.roster.indexOf(low);G.roster.splice(i,1);low.loc="farm";G.farm.push(low);log.push(`⬇️ Optioned ${low.name} to the minors — 20-man limit`);}
    else{drop(low);log.push(`🔻 Released ${low.name} — 20-man limit`);}
  }
  return log;
}
// attach a story to each entry that MATCHES the direction of the move, with no repeats inside one report
function assignDevStories(list){
  const shuf=a=>{const x=a.slice();for(let i=x.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[x[i],x[j]]=[x[j],x[i]];}return x;};
  const q={good:shuf(DEV_GOOD),up:shuf(DEV_MINOR_UP),down:shuf(DEV_MINOR_DOWN),flat:shuf(DEV_FLAT),bad:shuf(DEV_BAD),under:shuf(DEV_UNDER)};
  const used=new Set();
  const take=(...pools)=>{for(const key of pools){const arr=q[key];for(let i=0;i<arr.length;i++){if(!used.has(arr[i])){used.add(arr[i]);return arr[i];}}}return null;};
  // biggest movers first so they get the marquee storylines
  list.slice().sort((a,b)=>Math.abs(b.d)-Math.abs(a.d)).forEach(e=>{
    if(e.d>=5||(e.broke&&e.d>0))      e.story=take('good','up')||'broke out';
    else if(e.d>0)                    e.story=take('up','good')||'ticked forward';
    else if(e.d===0&&e.bust)          e.story=take('under','flat')||'his upside cooled';
    else if(e.d===0)                  e.story=take('flat')||'held steady';
    else if(e.d<=-4)                  e.story=take('bad','down')||'fell off';
    else /* -1..-3 */                 e.story=(e.bust?take('under','down'):take('down'))||'slipped a bit';
  });
}
// continuous color scale — the bigger the move, the more vivid (subtle for small swings)
function devColor(d){
  const lerp=(a,b,t)=>Math.round(a+(b-a)*t),mix=(c1,c2,t)=>`rgb(${lerp(c1[0],c2[0],t)},${lerp(c1[1],c2[1],t)},${lerp(c1[2],c2[2],t)})`;
  if(d>0)return mix([124,140,70],[170,232,72],clamp(d/16,0.10,1));   // muted olive → bright lime
  if(d<0)return mix([138,104,90],[255,106,85],clamp(-d/12,0.14,1));  // muted clay → bright red
  return 'rgb(120,126,100)';
}
// one condensed, color-scaled line per player — sorted biggest gain → biggest decline
function devLineHTML(e){
  const col=devColor(e.d),mag=Math.abs(e.d);
  const bw=mag>=12?5:mag>=6?4:3;                                     // fatter accent for the big movers
  const glow=mag>=12?`;text-shadow:0 0 10px ${col}66`:'';
  const tint=mag>=8?`background:linear-gradient(90deg, ${devColor(e.d).replace('rgb','rgba').replace(')',',0.10)')}, var(--panel2) 60%)`:'background:var(--panel2)';
  const arrow=e.d>0?'▲':e.d<0?'▼':'▬',sign=e.d>0?'+'+e.d:(e.d===0?'0':''+e.d);
  const story=e.story||(e.d>0?'ticked forward':e.d<0?'slipped a bit':'held steady');
  return `<div style="display:flex;align-items:center;gap:9px;padding:6px 9px;border-left:${bw}px solid ${col};${tint};border-radius:3px;margin-bottom:5px">
    <span class="pos" style="flex-shrink:0">${e.pos}</span>
    <span style="flex:1;min-width:0"><b>${e.name}</b>${e.farm?' <span class="small muted">· farm</span>':''} <span class="small muted">— ${story}</span></span>
    <span class="disp" style="flex-shrink:0;color:${col};font-weight:700;font-size:13px;white-space:nowrap${glow}">${e.b}→${e.a} <span style="font-size:11px">${arrow}${sign}</span></span>
  </div>`;
}
// pick-your-term extension control (1/3/5/10 yrs)
// the base AAV (1-yr-equivalent) for an extension — a farm/prospect deal is priced on a discounted blend of
// current ability and ceiling (you pay for unguaranteed upside); an established player pays full freight.
function extendBaseAAV(p){
  const onFarm=(p.loc==="farm")||p.prospect;
  if(onFarm){const ceil=Math.min(p.realCeil||p.pot,p.pot);const effOvr=Math.round(p.ovr+(ceil-p.ovr)*0.55);
    // a prospect comes with all six pre-FA control years — locking him up is cheap
    return Math.max(0.75,Math.round(fullSalary(effOvr)*0.58*10)/10);}
  // an established player still under team control (first 6 MLB years) gets a discount on the controlled years,
  // with the deal priced toward full market only for the would-be free-agent years
  const ctrlLeft=clamp(6-(p.mlbYears||6),0,5);            // cheap rookie-deal years remaining
  const full=fullSalary(p.ovr);
  const w=ctrlLeft/5;                                     // share of the extension still under control
  return Math.max(0.75,Math.round((full*(1-w)+full*0.55*w)*10)/10);
}
function extendSelect(pid){const p=G.roster.find(x=>x.id===pid)||G.farm.find(x=>x.id===pid);if(!p)return '';
  const b=extendBaseAAV(p)*(p._extPremium||1);   // each rejection raises the price he'll consider
  const lbl=(p._extPremium>1)?`Re-offer (wants ~$${theirAsk(p)}M)…`:'Extend…';
  const o=y=>`<option value="${y}">+${y} yr · $${termAAV(b,y)}M/yr</option>`;
  return `<select class="exsel" onchange="extendDo('${pid}',this.value)" style="font-size:11px;background:var(--panel2);color:var(--ink);border:1px solid var(--line);border-radius:6px;padding:1px 3px">
  <option value="">${lbl}</option>${o(1)}${o(3)}${o(5)}${o(10)}</select>`;}
function extendDo(pid,years){years=parseInt(years);if(!years)return;
  const p=G.roster.find(x=>x.id===pid)||G.farm.find(x=>x.id===pid);if(!p)return;
  const offered=termAAV(extendBaseAAV(p)*(p._extPremium||1),years);
  const ask=theirAsk(p);
  if(offered+0.05 < ask){   // he turns it down — and the price to keep him climbs
    p._extPremium=(p._extPremium||1)*1.12;
    toast(`😤 ${p.name} turned it down — he's looking for about $${ask}M/yr. Offer again (the price has risen).`);
    if(G.phase===0)screenTrade();else screenRoster();return;
  }
  p.salary=offered;                       // he signs at the offer
  p.years=Math.min(p.years+years,14);     // megadeals top out around 14 years
  p.mlbYears=Math.max(p.mlbYears||6,6);
  p.locked=true;                          // an extension LOCKS the AAV for the term
  p._extPremium=1;p._askJitter=null;
  p.happy=clamp(happyVal(p)+18,0,97);p._tradeReq=false;   // getting paid and locked in lifts the mood
  if(G.mode==="survivor"){const ff=isFanFav(p);favorChange(ff?4:(p.src==="draft"?2:0.5),`Extended ${p.name}${ff?' (fan favorite)':''}`);fanChange(ff?5:(p.src==="draft"?2:1),`Fans cheered keeping ${p.name}`);}
  toast(`✅ ${p.name} signed — ${years} yr at $${offered}M/yr (now ${p.years}yr)`);saveGame();
  if(G.phase===0)screenTrade();else screenRoster();
}
function extend(pid){extendDo(pid,5);}   // legacy default

