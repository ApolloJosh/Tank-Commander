/* ============================================================
   WAR / WINS
   ============================================================ */
function warOf(p){
  if(p.pos==="SP")return Math.max(0,(p.ovr-48)/10.5);
  if(p.pos==="RP")return Math.max(0,(p.ovr-53)/13.5);
  return Math.max(0,(p.ovr-49)/10.5);
}
const injFactor=p=>p.inj>0?clamp(1-p.inj/162,0.05,1):1;
// coaching raises the floor: bigger lift for weaker players, little for stars
function coachBonus(p){const c=(typeof G!=="undefined"&&G&&G.resources)?G.resources.coaching:0.333;return c*clamp((68-p.ovr)/4,0,3);}
function warOfC(p){const o=p.ovr+coachBonus(p);
  if(p.pos==="SP")return Math.max(0,(o-48)/10.5);
  if(p.pos==="RP")return Math.max(0,(o-53)/13.5);
  return Math.max(0,(o-49)/10.5);}
const eff=p=>warOfC(p)*injFactor(p);
function warToWins(w){return clamp(round(81+(w-33)*1.25),47,114);}
const REP_BAT=0.86, REP_SP=0.95, REP_RP=0.37;   // replacement-level fill for empty slots
let _dlMode=false;   // true during the in-season trade deadline (shifts valuations)
// how far BELOW market you're paying a player for his ability — 1 = dirt-cheap/cost-controlled, 0 = paid full market or more.
// Trade value is surplus value: a player on a fair-market contract (e.g. a free agent you just signed) has little surplus to flip.
function controlFactor(p){const market=Math.max(8,salaryFor(p.ovr,6,p.pos));return clamp(1-((p.salary||0)/market),0,1);}
// longer deals trade a little annual money for security (shown on the sign/extend dropdowns)
function termAAV(base,years){const mult=clamp(1.08-years*0.03,0.78,1.08);return Math.max(0.75,Math.round(base*mult*10)/10);}
function tradeValueDeadline(p){
  const ovr=p.ovr, pot=Math.max(p.pot||ovr,ovr), age=p.age, yrs=p.years==null?6:p.years;
  // at the deadline, CURRENT ability dominates and the ceiling/youth premium shrinks
  const youthF=clamp((30-age)/10,0,1.3);
  let cur = ovr<=52 ? Math.max(0,(ovr-40))*0.5 : 5+(ovr-52)*1.5;
  const ceilPrem = Math.max(0, pot-78)*(0.25+youthF*0.5);
  let v = cur + ceilPrem;
  if(ovr>=88) v += Math.pow(ovr-88,1.4)*3.0;
  // contract control matters more now: rentals are cheap, cost-controlled long-term assets command a premium
  if(yrs<=1) v*=0.70; else if(yrs>=4) v*=1.14; else if(yrs>=3) v*=1.06;
  {const ef=p.ovr<90?0:clamp(0.05+(p.ovr-90)*0.009,0,0.12);   // elite talent (90+) still commands value even on a big contract
   v *= (0.45 + ef + (0.55-ef)*controlFactor(p));}
  if(pot<70&&ovr<70) v=Math.min(v, 3+Math.max(0,(ovr-55))*0.7);
  return Math.max(1, Math.round(v));
}
function tradeValue(p){
  if(_dlMode)return tradeValueDeadline(p);
  const ovr=p.ovr, pot=Math.max(p.pot||ovr,ovr), age=p.age;
  const youthF=clamp((31-age)/9,0,1.7);
  // current ability
  let cur = ovr<=52 ? Math.max(0,(ovr-40))*0.5 : 4+(ovr-52)*1.1;
  // ceiling premium — only genuinely useful ceilings (>72) carry future value, scaled by youth
  const ceilPrem = Math.max(0, pot-72)*(0.5+youthF*0.95);
  let v = cur + ceilPrem;
  // prime-age desirable regulars (the 75-85 OVR, still-young guys real teams covet)
  if(ovr>=75 && ovr<=88 && age<=33) v += (ovr-73)*(age<=31?1.0:0.7);
  // superstar tax
  if(ovr>=88) v += Math.pow(ovr-88,1.4)*2.4;
  // surplus value: you can only trade the value you're getting ABOVE what you pay. A player on a fair-market deal
  // (a free agent you just signed, a maxed-out vet) has little surplus — cost-controlled talent keeps its value.
  {const ef=p.ovr<82?0:clamp(0.04+(p.ovr-82)*0.006,0,0.18);   // good-to-elite talent (82+) keeps real value even on a market deal
   v *= (0.50 + ef + (0.50-ef)*controlFactor(p));}            // softer surplus haircut — a fairly-paid star still trades for plenty
  if(p.years<=1) v*=0.8;                    // rental discount
  // unplayable ceiling => little trade value
  if(pot<70) v=Math.min(v, 3+Math.max(0,(ovr-55))*0.7);
  return Math.max(1, Math.round(v));
}
// top-heavy pick scale: a #1 is a premium asset you can't assemble from scraps
const PICK_VALUES=[0,90,72,60,50,43,37,32,28,24,21,18,16,14,12,11,10];
function pickValue(slot){return PICK_VALUES[clamp(round(slot),1,16)]||9;}

/* ---------- position flexibility (OVR-gated) ---------- */
const LINEUP=["C","1B","2B","3B","SS","LF","CF","RF","DH"];
function flexPositions(p){
  const o=p.ovr, s=new Set([p.pos]);
  switch(p.pos){
    case "SS": if(o>=85){s.add("2B");s.add("3B");} if(o>=99)s.add("CF"); break;
    case "3B": if(o>=85)s.add("1B"); if(o>=95)s.add("SS"); if(o>=99)s.add("2B"); break;
    case "1B": if(o>=85)s.add("3B"); if(o>=95)s.add("2B"); if(o>=99)s.add("C"); break;
    case "CF": if(o>=85){s.add("LF");s.add("RF");} if(o>=95)s.add("1B"); if(o>=99)s.add("SS"); break;
    case "LF": s.add("RF"); if(o>=85)s.add("1B"); if(o>=95)s.add("CF"); if(o>=99)s.add("3B"); break;
    case "RF": s.add("LF"); if(o>=85)s.add("1B"); if(o>=95)s.add("CF"); if(o>=99)s.add("3B"); break;
    case "SP": if(o>=90)s.add("RP"); break;
    case "RP": if(o>=95)s.add("SP"); break;
    case "C": if(o>=90)s.add("1B"); if(o>=99)s.add("2B"); break;
  }
  return s;
}
function canPlaySlot(p,slot){ if(isPit(p))return false; if(slot==="DH")return true; return flexPositions(p).has(slot); }
function posCoversSlot(pos,slot){ if(pos===slot)return true; if(slot==="DH")return true;
  const OF=["LF","CF","RF"]; return OF.includes(pos)&&OF.includes(slot); }
// slot model: 9 lineup slots + SP1..SP4 + RP1..RP3. Users can manually assign any eligible player.
const ROT_SLOTS=["SP1","SP2","SP3","SP4","SP5"], PEN_SLOTS=["RP1","RP2","RP3"];
function eligibleForSlot(p,slot){
  if(ROT_SLOTS.includes(slot))return isPit(p)&&flexPositions(p).has("SP");
  if(PEN_SLOTS.includes(slot))return isPit(p)&&flexPositions(p).has("RP");
  return canPlaySlot(p,slot);
}
function buildActive(roster){
  const mlb=roster.filter(p=>p.loc==="mlb"&&!p._il);   // Injured-List players are unavailable (don't fill slots)
  const byId=id=>mlb.find(p=>p.id===id);
  const manual=(typeof G!=="undefined"&&G&&G.manualLineup);
  const LS=(typeof G!=="undefined"&&G&&G.lineupSet)||{};
  const used=new Set(),lineup={},rotation=[],pen=[];
  const place=(slot,p)=>{ if(ROT_SLOTS.includes(slot))rotation[ROT_SLOTS.indexOf(slot)]=p;
    else if(PEN_SLOTS.includes(slot))pen[PEN_SLOTS.indexOf(slot)]=p; else lineup[slot]=p; };
  // 1) honor valid user assignments first
  [...LINEUP,...ROT_SLOTS,...PEN_SLOTS].forEach(slot=>{
    const id=LS[slot]; if(!id)return; const p=byId(id);
    if(p&&!used.has(p.id)&&eligibleForSlot(p,slot)){place(slot,p);used.add(p.id);}
  });
  // 2) in AUTO mode, fill the rest with the best available; in MANUAL mode, leave gaps (replacement level)
  if(!manual){
    ["C","SS","2B","3B","1B","CF","LF","RF","DH"].forEach(slot=>{
      if(lineup[slot])return;
      const elig=mlb.filter(p=>!used.has(p.id)&&canPlaySlot(p,slot)).sort((a,b)=>eff(b)-eff(a));
      if(elig[0]){lineup[slot]=elig[0];used.add(elig[0].id);} else lineup[slot]=null;
    });
    for(let i=0;i<ROT_SLOTS.length;i++){ if(rotation[i])continue;
      const p=mlb.filter(x=>isPit(x)&&flexPositions(x).has("SP")&&!used.has(x.id)).sort((a,b)=>eff(b)-eff(a))[0];
      if(p){rotation[i]=p;used.add(p.id);} else rotation[i]=null; }
    for(let i=0;i<PEN_SLOTS.length;i++){ if(pen[i])continue;
      const p=mlb.filter(x=>isPit(x)&&flexPositions(x).has("RP")&&!used.has(x.id)).sort((a,b)=>eff(b)-eff(a))[0];
      if(p){pen[i]=p;used.add(p.id);} else pen[i]=null; }
  } else {
    ["C","SS","2B","3B","1B","CF","LF","RF","DH"].forEach(slot=>{if(!lineup[slot])lineup[slot]=null;});
    for(let i=0;i<ROT_SLOTS.length;i++)if(!rotation[i])rotation[i]=null;
    for(let i=0;i<PEN_SLOTS.length;i++)if(!pen[i])pen[i]=null;
  }
  return {lineup,rotation:rotation.slice(0,ROT_SLOTS.length),pen:pen.slice(0,PEN_SLOTS.length),used};
}
function teamWAR(roster){
  const a=buildActive(roster);let w=0;
  LINEUP.forEach(s=>{w+=a.lineup[s]?eff(a.lineup[s]):REP_BAT;});
  for(let i=0;i<ROT_SLOTS.length;i++)w+=a.rotation[i]?eff(a.rotation[i]):REP_SP;
  for(let i=0;i<PEN_SLOTS.length;i++)w+=a.pen[i]?eff(a.pen[i]):REP_RP;
  return w;
}
function payroll(roster){return round(roster.filter(p=>p.loc==="mlb").reduce((s,p)=>s+p.salary,0)*10)/10;}
function luxuryTax(){return Math.max(0,Math.floor((payroll(G.roster)-300)/10));}

