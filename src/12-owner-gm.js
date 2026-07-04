/* ===========================================================
   OWNER MODE — Phase 2: the GM you steer (office, mandate, auto-moves, veto)
   ============================================================ */
const GM_FIRST=["Marcus","Eli","Dean","Sol","Ramon","Bryce","Cole","Nate","Vance","Gideon","Royce","Hank","Lou","Desmond","Ari","Knox"];
const GM_LAST=["Calloway","Renner","Okafor","Brandt","Vesely","Mancini","Holloway","Sato","Delgado","Ferraro","Quill","Underwood","Boone","Marsh","Ellison","Pryce"];
function gmFirstName(){return pick(GM_FIRST);}
function gmLastName(){return pick(GM_LAST);}
const MANDATES={
  winNow:{name:"🏆 Win Now",desc:"Go all-in. The GM trades prospects and spends for established talent — flags get expected.",bar:96},
  contend:{name:"⚖️ Contend",desc:"Compete every year. Balanced moves, sustainable payroll, no fire sales.",bar:86},
  retool:{name:"🌱 Retool",desc:"Reload on the fly — sell short-term vets, keep the young core, stay flexible.",bar:75},
  rebuild:{name:"🧨 Rebuild",desc:"Tear it down. Trade veterans for prospects and picks; payroll comes way down.",bar:62}};
const SPONSOR_CATALOG=[
  {type:'naming',name:'Stadium naming rights',rev:38,fanCost:7,desc:"Sell the ballpark's name. Huge money — but purists grumble."},
  {type:'patch',name:'Jersey patch sponsor',rev:20,fanCost:4,desc:"A corporate patch on the uniform. Easy revenue, a mild eye-roll."},
  {type:'outfield',name:'Outfield LED ad ring',rev:13,fanCost:2,desc:"Rotating digital ads ringing the field."},
  {type:'concourse',name:'Concourse brand activations',rev:11,fanCost:1,desc:"Sponsored fan zones along the concourse."},
  {type:'radio',name:'Flagship radio network',rev:9,fanCost:0,desc:"A multi-year local broadcast deal. Fans don't mind this one."}];

// ---------- the Owner's Office (set the plan, prices, and deals) ----------
// payroll budgets are capped in absolute terms — the luxury tax bites past $300M, so even "blank check" tops out near $425M
function ownerBudgetPresets(){const rev=ownerRevenue().total;return [
  {key:'frugal',name:'Frugal',cap:clamp(Math.round(rev*0.40),70,170),desc:'Run lean, bank the profit.'},
  {key:'balanced',name:'Balanced',cap:clamp(Math.round(rev*0.55),110,250),desc:'Spend in line with revenue.'},
  {key:'aggressive',name:'Aggressive',cap:clamp(Math.round(rev*0.74),170,345),desc:'Push payroll to chase wins.'},
  {key:'blank',name:'Blank check',cap:clamp(Math.round(rev*0.80),300,425),desc:'Whatever it takes — but the tax bites hard past $300M.'}];}
const SPONSOR_BRANDS=["MegaBank","Vertex","Apex","Northwind","Cobalt Energy","Summit Air","Ironclad","Bluewave","Stellar Foods","Granite Mutual","Pinnacle","Helios","RedOak","Quantum","Cascade","Titan Wireless"];
// prune expired sponsorship contracts (a deal signed in year Y for T years runs through year Y+T-1)
function ownerPruneSponsors(){
  const live=[],dropped=[];
  (G.owner.sponsors||[]).forEach(s=>{if(G.year < (s.signedYear||1)+(s.term||3))live.push(s);else dropped.push(s);});
  G.owner.sponsors=live;G.owner._expiredTypes=dropped.map(d=>d.type);
  return dropped;
}
// each year, every OPEN inventory slot (no active contract) gets a fresh offer to sign or renew
function genSponsorOffers(){
  if(G.owner._sponsorYear===G.year)return;
  G.owner._sponsorYear=G.year;
  ownerPruneSponsors();
  const activeT=new Set((G.owner.sponsors||[]).map(s=>s.type));
  const renew=new Set(G.owner._expiredTypes||[]);
  G.owner._sponsorOffers=SPONSOR_CATALOG.filter(s=>!activeT.has(s.type)).map(s=>{
    const wobble=0.85+Math.random()*0.4;                          // each negotiation lands a bit differently
    const rev=Math.max(4,Math.round(s.rev*(G.owner.marketMult||1)*wobble));
    return {type:s.type,slot:s.name,desc:s.desc,fanCost:s.fanCost,rev,term:ri(3,5),
      brand:pick(SPONSOR_BRANDS),renew:renew.has(s.type)};
  });
}
function acceptSponsor(type){
  const off=(G.owner._sponsorOffers||[]).find(s=>s.type===type);if(!off)return;
  (G.owner.sponsors=G.owner.sponsors||[]).push({type:off.type,slot:off.slot,name:off.brand,rev:off.rev,term:off.term,signedYear:G.year});
  if(off.fanCost)fanChange(-off.fanCost,`Signed ${off.brand} (${off.slot.toLowerCase()}) — some fans grumbled`);
  G.owner._sponsorOffers=G.owner._sponsorOffers.filter(s=>s.type!==type);
  saveGame();ownerSuite();
}
// recompute the franchise's derived modifiers from what it currently owns (called after any Suite purchase)
// ---- Tier-2 Suite: showpiece attractions, fan experiences, and team programs (unlock once the ballpark & facilities are built out) ----
const SUITE_PREMIUM=[
  {id:'pool',name:'Outfield Swimming Pool',cost:140,cat:'Attraction',fx:{fan:6,rev:0.5},desc:"A signature pool deck beyond the wall — an iconic, sellable draw."},
  {id:'hrSculpture',name:'Home Run Sculpture',cost:70,cat:'Attraction',fx:{fan:5},desc:"A giant kinetic sculpture that erupts on every home run. Instant landmark."},
  {id:'partyDeck',name:'Party Deck',cost:95,cat:'Attraction',fx:{fan:4,rev:0.7},desc:"A premium group/party space — strong group-sales revenue."},
  {id:'gamingDeck',name:'Gaming Deck',cost:60,cat:'Fan experience',fx:{fan:5},desc:"Play baseball video games on big screens while the real game goes on."},
  {id:'climbWall',name:'Rock Climbing Wall',cost:50,cat:'Fan experience',fx:{fan:4},desc:"A towering concourse climbing wall for the thrill-seekers."},
  {id:'spaceSim',name:'Space Launch Simulator',cost:120,cat:'Fan experience',fx:{fan:8,rev:0.3},desc:"A full-motion launch simulator — the wildest attraction in baseball."},
  {id:'diehard',name:'Die-Hard Supporters Section',cost:85,cat:'Atmosphere',fx:{fan:6,home:1},desc:"Half-price seats for fans who prove their devotion — a rowdy, intimidating home crowd worth a win or two a year."},
  {id:'medical',name:'World-Class Medical Staff',cost:115,cat:'Team program',fx:{heal:1.6},desc:"The best trainers and surgeons in the game — fewer and shorter injuries."},
  {id:'sportsPsych',name:'Sports Psychologist',cost:70,cat:'Team program',fx:{dev:0.5},desc:"Steadies heads through slumps — faster, more consistent player development."},
  {id:'altUnis',name:'New Alternate Uniforms',cost:45,cat:'Team program',fx:{fan:3,merch:0.18},desc:"Fresh alternates the fans love — a nice bump to merchandise sales."},
  {id:'corpSpies',name:'Corporate Intelligence Unit',cost:90,cat:'Team program',fx:{trade:1},desc:"Discreet insight on rival front offices — your GM lands better trade and signing outcomes."},
  {id:'megaboard',name:'Megaboard & Ribbon Displays',cost:200,cat:'Attraction',fx:{fan:10,rev:0.8},desc:"A league-leading videoboard wrapped with ribbon screens. The ultimate wow factor."},
  {id:'hofMuseum',name:'Hall of Fame & Team Museum',cost:110,cat:'Attraction',fx:{fan:4,hof:1},desc:"Honor the franchise's legends — fans love it, and your stars get a real boost toward the League Hall of Fame."},
  {id:'youthAcademy',name:'Youth Academy & Community Program',cost:120,cat:'Team program',fx:{farm:1.0,fan:2},desc:"A development pipeline and community goodwill — supercharges the farm system."},
  {id:'statcastLab',name:'Statcast & Pitch-Design Lab',cost:100,cat:'Team program',fx:{scout:1,dev:0.2},desc:"Cutting-edge tracking sharpens your scouting — far more accurate reads on prospect ceilings."},
  {id:'charterJet',name:'Charter Jet & Sleep Program',cost:90,cat:'Team program',fx:{home:1,heal:0.3},desc:"Top-flight travel and recovery keep the team fresh — worth a win a year and a few fewer injuries."},
  {id:'mascot',name:'Mascot & Entertainment Crew',cost:30,cat:'Fan experience',fx:{fan:5},desc:"A beloved mascot and in-game crew — cheap, pure fan joy."},
  {id:'dynPricing',name:'Dynamic Ticket Pricing',cost:75,cat:'Team program',fx:{gate:0.08},desc:"Demand-based pricing squeezes more out of every game — extra gate revenue without souring the fans."},
  {id:'nutrition',name:'Nutrition & Performance Kitchen',cost:60,cat:'Team program',fx:{heal:0.7},desc:"Elite fueling and conditioning — durability that compounds with your medical staff."},
  {id:'solar',name:'Ballpark Solar & Sustainability Retrofit',cost:95,cat:'Team program',fx:{ops:0.35},desc:"Slashes stadium operating costs every single year — green and profitable."},
  {id:'teamStore',name:'Flagship Team Store & E-Commerce',cost:80,cat:'Team program',fx:{merch:0.28},desc:"A destination retail flagship plus online store — a major, lasting merch boost."},
  {id:'cantina',name:'Craft Bar & Cantina',cost:80,cat:'Attraction',fx:{fan:3,rev:0.3},desc:"A craft cocktail bar and cantina — adds a high-margin Craft Cocktail line you can price on the menu."}];
function ownerTier2Unlocked(){const o=G.owner;return STADIUM_UPGRADES.every(u=>(o.ownedUpgrades||[]).includes(u.id))&&FACILITY_OPTS.every(f=>(o.ownedFacilities||[]).includes(f.id));}
function suiteBuyAmenity(id){const o=G.owner,a=SUITE_PREMIUM.find(x=>x.id===id);if(!a)return;
  if((o.ownedAmenities||[]).includes(id))return;
  if(a.cost>(o.cashReserve||0)){toast('Not enough cash on hand.');return;}
  o.cashReserve=Math.round((o.cashReserve-a.cost)*10)/10;(o.ownedAmenities=o.ownedAmenities||[]).push(id);
  if(a.fx.fan)fanChange(a.fx.fan,`Fans are buzzing about the ${a.name.toLowerCase()}`);
  o.totalSpent=(o.totalSpent||0)+a.cost;ownerRecalc();saveGame();toast(`Added: ${a.name}`);ownerSuite();}
function ownerRecalc(){
  const o=G.owner;
  const ups=(o.ownedUpgrades||[]).map(id=>STADIUM_UPGRADES.find(x=>x.id===id)).filter(Boolean);
  const facs=(o.ownedFacilities||[]).map(id=>FACILITY_OPTS.find(x=>x.id===id)).filter(Boolean);
  const ams=(o.ownedAmenities||[]).map(id=>SUITE_PREMIUM.find(x=>x.id===id)).filter(Boolean);
  const amf=k=>ams.reduce((s,a)=>s+(a.fx[k]||0),0);
  o.capacity=(o.baseCapacity||40000)+ups.reduce((s,u)=>s+(u.cap||0),0);
  o.revWeight=(o.baseRev||1)+ups.reduce((s,u)=>s+(u.rev||0),0)+amf('rev');
  o.devBonus=facs.reduce((s,f)=>s+(f.dev||0),0)+(o.coachTier||0)*0.4+amf('dev');
  o.farmBonus=facs.reduce((s,f)=>s+(f.farm||0),0)+(o.scoutTier||0)*0.5+amf('farm');
  o.coachBonus=(o.coachTier||0)+facs.reduce((s,f)=>s+(f.coach||0),0);
  o.healBonus=facs.reduce((s,f)=>s+(f.heal||0),0)+amf('heal');
  o.homeEdge=amf('home');                 // die-hard crowd / charter travel → a win or two
  o.merchMult=1+amf('merch');             // alternate uniforms, flagship store → more merch sales
  o.tradeEdge=amf('trade');               // corporate intel → better GM deal outcomes
  o.gateMult=1+amf('gate');               // dynamic pricing → extra gate revenue
  o.opsCut=clamp(amf('ops'),0,0.6);       // solar/sustainability → lower stadium operating costs
  o.hofBoost=amf('hof');                  // team museum → stronger League HOF cases
  o.scoutEdge=amf('scout');               // statcast lab → sharper prospect-ceiling reads
  const sPts=1+(o.scoutTier||0)+o.farmBonus,dPts=1+o.devBonus,cPts=1+o.coachBonus,tot=sPts+dPts+cPts;
  G.resources={scouting:sPts/tot,development:dPts/tot,coaching:cPts/tot};
}
// each year, your GM's read on what the roster should be doing — refreshes with the team's state
function recommendedMandate(){
  const proj=warToWins(teamWAR(G.roster));
  if(proj>=92)return 'winNow';
  if(proj>=84)return 'contend';
  if(proj>=75)return 'retool';
  return 'rebuild';
}
function mandateContext(){
  const proj=warToWins(teamWAR(G.roster)),rec=recommendedMandate();
  const msg={winNow:`This roster projects to <b>${proj} wins</b> — a real contender. Your GM says go for it now.`,
    contend:`At a projected <b>${proj} wins</b> you're squarely in the mix — stay aggressive but sustainable.`,
    retool:`A projected <b>${proj} wins</b> puts you on the bubble — your GM suggests retooling around the young core.`,
    rebuild:`At a projected <b>${proj} wins</b>, your GM recommends a teardown and building for the future.`};
  return {rec,proj,msg:msg[rec]};
}

// ---------- the ballpark: your field art + a draggable 7-point outfield wall ----------
const DIM_HOME=[440,680],DIM_A=-61.25,DIM_B=1.4375;     // home plate + feet→pixel scale (the wall is fully drawn from the points)
const DIM_ANG=[-42,-28,-14,0,14,28,42].map(d=>d*Math.PI/180);
const DIM_MIN=300,DIM_MAX=460,DEFAULT_DIMS=[330,352,378,400,378,352,330];
// the fixed infield (home plate doesn't move; only the outfield wall does)
const INFIELD_ART=`<polygon points="440,703 568,575 440,447 312,575" fill="#e4a360"/><polygon points="440,675 540,575 440,475 340,575" fill="#a1c449"/><circle cx="440" cy="675" r="26" fill="#e4a360"/><circle cx="440" cy="575" r="12" fill="#d99a55"/><rect x="534" y="569" width="12" height="12" fill="#fff" transform="rotate(45 540 575)"/><rect x="434" y="469" width="12" height="12" fill="#fff" transform="rotate(45 440 475)"/><rect x="334" y="569" width="12" height="12" fill="#fff" transform="rotate(45 340 575)"/><polygon points="432,668 448,668 448,676 440,684 432,676" fill="#fff"/>`;
function dimRadius(ft){return DIM_A+clamp(ft,DIM_MIN,DIM_MAX)*DIM_B;}
function dimPoint(i,ft){const a=DIM_ANG[i],r=dimRadius(ft);return [Math.round(DIM_HOME[0]+r*Math.sin(a)),Math.round(DIM_HOME[1]-r*Math.cos(a))];}
function dimsAvg(d){return Math.round(d.reduce((a,b)=>a+b,0)/d.length);}
function dimsToParkFactor(d){return Math.round(clamp((360-dimsAvg(d))/45,-1,1)*100)/100;}
function parkClass(pf){
  if(pf>=0.55)return {name:'Launch Pad',note:"a hitter's paradise",col:'#ff7a5c'};
  if(pf>=0.2)return {name:'Hitter-friendly',note:'tilts toward offense',col:'#ffb24d'};
  if(pf>-0.2)return {name:'Neutral',note:'balanced dimensions',col:'#e6c84e'};
  if(pf>-0.55)return {name:'Pitcher-friendly',note:'suppresses runs',col:'#7fd7ff'};
  return {name:'Cavernous',note:"a pitcher's dream",col:'#8ab4ff'};}
function ownerDims(target){if(target==='setup'){_own.dims=_own.dims||DEFAULT_DIMS.slice();return _own.dims;}G.owner.dims=G.owner.dims||DEFAULT_DIMS.slice();return G.owner.dims;}
let _dimTarget=null,_dimVals=null,_dimI=-1;
function fieldEditorHTML(target){
  _dimTarget=target;_dimVals=ownerDims(target).slice();
  const pts=_dimVals.map((ft,i)=>dimPoint(i,ft));
  const H=DIM_HOME,line=pts.map(p=>p.join(',')).join(' L');
  const fan=`M${H[0]},${H[1]} L${line} Z`,wall=`M${line}`;
  const foul=`<line id="dimfoulL" x1="${H[0]}" y1="${H[1]}" x2="${pts[0][0]}" y2="${pts[0][1]}" stroke="#fff" stroke-width="3" opacity="0.85"/><line id="dimfoulR" x1="${H[0]}" y1="${H[1]}" x2="${pts[6][0]}" y2="${pts[6][1]}" stroke="#fff" stroke-width="3" opacity="0.85"/>`;
  const poles=`<rect id="dimpole0" x="${pts[0][0]-3}" y="${pts[0][1]-30}" width="6" height="34" fill="#f2c14a"/><rect id="dimpole6" x="${pts[6][0]-3}" y="${pts[6][1]-30}" width="6" height="34" fill="#f2c14a"/>`;
  const circles=pts.map((p,i)=>`<circle id="dimpt${i}" cx="${p[0]}" cy="${p[1]}" r="22" fill="#f2c14a" stroke="#0b0f08" stroke-width="4" style="cursor:grab" onpointerdown="dimDown(event,${i})"/>`).join("");
  const labels=pts.map((p,i)=>`<text id="dimlbl${i}" x="${p[0]}" y="${p[1]-30}" font-size="27" fill="#fff" stroke="#0b0f08" stroke-width="5" paint-order="stroke" text-anchor="middle" style="pointer-events:none;font-weight:800">${_dimVals[i]}'</text>`).join("");
  const avg=dimsAvg(_dimVals),pc=parkClass(dimsToParkFactor(_dimVals));
  return `<svg id="dimsvg" viewBox="0 0 880 740" width="100%" style="max-width:460px;display:block;margin:0 auto;touch-action:none;border-radius:12px;background:#0b0f08;border:1px solid #2a3320">
    <path id="dimgrass" d="${fan}" fill="#7b9b48"/>
    <path id="dimtrack" d="${wall}" fill="none" stroke="#c4473c" stroke-width="20" stroke-linejoin="round" stroke-linecap="round"/>
    <path id="dimwall" d="${wall}" fill="none" stroke="#226378" stroke-width="9" stroke-linejoin="round" stroke-linecap="round"/>
    ${INFIELD_ART}
    ${foul}${poles}${circles}${labels}
  </svg>
  <div class="row" style="justify-content:center;gap:22px;margin-top:8px;align-items:center">
    <div style="text-align:center"><div style="font-size:22px;font-weight:800" id="dimavg">${avg}'</div><div class="lbl">avg depth</div></div>
    <div style="text-align:center"><div style="font-size:18px;font-weight:800;color:${pc.col}" id="dimclass">${pc.name}</div><div class="lbl" id="dimnote">${pc.note}</div></div>
  </div>
  <p class="small muted" style="text-align:center;margin:5px 0 0">↔ Drag the 7 points to reshape the outfield wall.</p>`;
}
function dimSvgPoint(evt){const svg=document.getElementById('dimsvg');if(!svg)return null;const pt=svg.createSVGPoint();const t=(evt.touches&&evt.touches[0])||evt;pt.x=t.clientX;pt.y=t.clientY;const m=svg.getScreenCTM();return m?pt.matrixTransform(m.inverse()):null;}
function dimDown(evt,i){evt.preventDefault();_dimI=i;window.addEventListener('pointermove',dimMove);window.addEventListener('pointerup',dimUp);}
function dimMove(evt){if(_dimI<0||!_dimVals)return;evt.preventDefault();const loc=dimSvgPoint(evt);if(!loc)return;
  const a=DIM_ANG[_dimI],r=(loc.x-DIM_HOME[0])*Math.sin(a)+(loc.y-DIM_HOME[1])*(-Math.cos(a));
  _dimVals[_dimI]=clamp(Math.round((r-DIM_A)/DIM_B),DIM_MIN,DIM_MAX);dimRedraw(false);}
function dimUp(){window.removeEventListener('pointermove',dimMove);window.removeEventListener('pointerup',dimUp);_dimI=-1;
  if(_dimTarget==='setup'){_own.dims=_dimVals.slice();_own.parkFactor=dimsToParkFactor(_dimVals);}
  else if(G.owner){G.owner.dims=_dimVals.slice();G.owner.parkFactor=dimsToParkFactor(_dimVals);saveGame();}
  dimRedraw(true);}
function dimRedraw(full){
  const pts=_dimVals.map((ft,i)=>dimPoint(i,ft));
  const set=(id,a,v)=>{const e=document.getElementById(id);if(e)e.setAttribute(a,v);};
  const line=pts.map(p=>p.join(',')).join(' L'),wall='M'+line;
  set('dimgrass','d','M'+DIM_HOME[0]+','+DIM_HOME[1]+' L'+line+' Z');   // green outfield reshapes
  set('dimtrack','d',wall);set('dimwall','d',wall);                    // warning track + blue wall follow the points
  set('dimfoulL','x2',pts[0][0]);set('dimfoulL','y2',pts[0][1]);set('dimfoulR','x2',pts[6][0]);set('dimfoulR','y2',pts[6][1]);
  set('dimpole0','x',pts[0][0]-3);set('dimpole0','y',pts[0][1]-30);set('dimpole6','x',pts[6][0]-3);set('dimpole6','y',pts[6][1]-30);
  pts.forEach((p,i)=>{set('dimpt'+i,'cx',p[0]);set('dimpt'+i,'cy',p[1]);const l=document.getElementById('dimlbl'+i);if(l){l.setAttribute('x',p[0]);l.setAttribute('y',p[1]-30);l.textContent=_dimVals[i]+"'";}});
  const avg=dimsAvg(_dimVals),pc=parkClass(dimsToParkFactor(_dimVals));
  const av=document.getElementById('dimavg');if(av)av.textContent=avg+"'";
  const cl=document.getElementById('dimclass');if(cl){cl.textContent=pc.name;cl.style.color=pc.col;}
  const nt=document.getElementById('dimnote');if(nt)nt.textContent=pc.note;
  if(full){const h=document.getElementById('dimhint');if(h&&_dimTarget==='owner')h.textContent=ownerParkHint();}
}
// home-field synergy: a hitter's park rewards a hitting roster, a pitcher's park rewards arms; mismatch hurts
function ownerParkSynergy(src){src=src||G.owner;const a=buildActive(G.roster);let hw=0,pw=0;
  LINEUP.forEach(s=>{if(a.lineup[s])hw+=eff(a.lineup[s]);});a.rotation.concat(a.pen).forEach(p=>{if(p)pw+=eff(p);});
  return {bal:hw-pw,pf:(src.parkFactor||0)};}
function ownerParkHint(){const {bal,pf}=ownerParkSynergy();
  if(!pf)return 'Neutral dimensions — no home-field tilt.';
  const lean=pf>0?"hitter's":"pitcher's";
  if(Math.abs(bal)<2)return `A ${lean} park, but your roster is balanced — modest effect.`;
  return (pf*bal>0?`✅ Your ${bal>0?'bats':'arms'} thrive in this ${lean} park.`:`⚠️ This ${lean} park fights your ${bal>0?'hitting':'pitching'}-heavy roster.`);}
// the user's hand-drawn field art (used as the backdrop for the dimension editor)
const FIELD_ART=`<defs><style>.bf1{fill:#a1c449}.bf2{fill:#7b9b46}.bf3{fill:#e4a360}.bf4{fill:#7b9b48}.bf5{fill:#7b9a46}.bf6{fill:#f2c14a}.bf7{fill:#e6a360}.bf8{fill:#f8f8f6}.bf9{fill:#f8f6f8}.bf10{fill:#fdfdfc}.bf11{fill:#226378}.bf12{fill:#a1c44c}.bf13{fill:#e5a360}.bf14{fill:#ebba44}.bf15{fill:#e29d58}.bf16{fill:#1b636b}.bf17{fill:#c4473c}.bf18{fill:#fcf8fb}.bf19{fill:#c2473b}.bf20{fill:#fafbfb}.bf21{fill:#e39d5a}.bf22{fill:#feffff}.bf23{fill:#fafbfa}</style></defs>
<g><path class="bf17" d="M204.82,670c31,60.37,51.37,122.46,63.41,189.08,7.59,42.01,14.46,82.13,25.49,123.24,32.24,120.14,102.75,213.22,196.54,295.47,62.08,54.44,125.86,103.9,194.08,150.58,31.09,21.28,60.8,38.68,94.68,54.37,94.77,43.87,199.23,49.9,298.05,15.76,42.95-14.83,80.64-35.08,119.08-60.36,74.93-49.26,143.98-103.99,211.5-162.68,99.65-86.62,175.6-196.53,201.57-325.33l22.87-113.45c11.82-58.61,31.96-113.33,57.88-166.03l177.67-162.31,26.81,14.42c3.31,13.85,1.24,28.52-11.22,38.5l-77.34,76.63c-43.23,42.84-74.42,93.3-91.99,151.61l-22.17,96.93c-8.2,46.86-16.77,91.44-31.37,137.51-26.72,84.35-70.47,159.29-129.24,225.54l-75.68,76.03c-71.1,62.85-145.2,119.9-224.58,172.04-37.19,24.43-73.51,43.51-114.52,59.49-118.96,46.35-249.22,41.95-364.98-11.44-30.89-14.25-57.92-29.19-86.83-48.04-82.53-53.83-159.2-113.27-232.12-179.32l-62.26-62.22c-73.09-79.09-123.55-173.88-148.48-278.53l-22.42-111.87c-18.61-92.85-38.42-156.21-107.22-225.21L5.24,553.38c-7.4-7.42-4.26-22.52-4.36-31.19,9.66-2.13,18.71-7.76,26.15-15.25l177.8,163.05Z"/><path class="bf14" d="M1896.14,460.06c-1.82-.93-4.76,0-4.8,1.51l-.22,8.4c-.23,8.75,2.05,15.37-3.75,20.6-2.13-1.09-2.76-2.06-3.31-3.32-.79-1.8-.76-2.98-.72-4.87l.75-32.23c.04-1.6-.29-18.84-.15-19.82.42-3-.62-4.82-2.62-6.38-2.04-1.59-5.02-.35-7.87-.77-5.78-.85-3.74-12.64-4.42-15.26l.38-158.97c4.94.03,11.83,1.78,16.13-.59.48-2.12,1.22-5.27,4.58-4.53,2.54.56,4.27,1.09,4.25,5.33l-.71,184.76c4.71,8.74,2.68,18.06,2.46,26.14ZM1885.02,302.93l-.04-48.53c-4.17-2.88-11.12-.87-11.1,1.51l.32,49.96c1.45,2.37,10.83,1.63,10.82-2.94ZM1884.9,355.58l-.39-42.58c-1.06-2.83-10.13-2.38-10.2.48l-.98,42.51c4.05,2.63,8.86,2.66,11.58-.42ZM1884.25,414.71l.09-51.34c-4.22-.97-6.69-1.09-11.08-.11l.84,52.39c.06,3.69,10.15,4.24,10.16-.94Z"/><path class="bf6" d="M26.36,415.39s-.35,6.45-.88,7.68c-2.94,6.8-12.06,6-13.93,11.19,1.56,17.71,1.83,32.43.27,47.8l-.02,2.73c-.79,2.57-2.92,3.17-6.59,2.63l-1.49-53.9c-.49-.49-1.59-.63-1.59-.48l-.53-187.29c2.83-1.78,7.34-2.34,7.93-1.05l1.99,4.3,14.47.34.34,166.05ZM22.37,253.65c-4.48-1.13-7.15-.89-11.61.53l.73,51.45c17.82,6.83,7.16-17.91,10.88-51.98ZM22.44,311.18c-4.67-.71-7.13-.63-11.49.14l.59,45.92c18.06,5.67,7.18-13.82,10.9-46.05ZM22.42,411.7l-.36-48.69c-4.08-1.23-6.85-1.02-10.71.8l1.19,55.79c2.01,2.79,9.94-.91,9.89-7.9Z"/><path class="bf11" d="M5.22,487.43l21.8,19.52c-7.43,7.49-16.49,13.12-26.15,15.25L0,448.86c-.06-5.13,2.16-11.04,2.15-15.81,0-.16,1.09,0,1.59.48l1.49,53.9Z"/><path class="bf16" d="M1896.14,460.06l-1.69,62.72-26.81-14.42,19.74-17.79c5.8-5.23,3.52-11.85,3.75-20.6l.22-8.4c.04-1.51,2.98-2.43,4.8-1.51Z"/><path class="bf5" d="M361.16,811.71l-20.36,47.85,172.24,156.54,67.42,62.64,16.19-12.5,63.19,57.03,199.51,182.63c-18.7,33.55-16.4,70.6,3.43,101.09,18.15,27.91,49.18,44.63,84.96,44.64,36.03.01,68.19-17.51,85.91-46.1,18.8-30.34,20.23-66.7,2.84-99.66l151.7-138.2c12.42-11,24.02-19.9,33.17-31.48l51.56-47.73,24.56-23.28c6.65,2.41,10.72,6.86,16.9,14.26l240.4-219.61-18.48-49.82,110.47-100.25,25.9-23.72,17.29-15.39c-25.92,52.69-46.06,107.42-57.88,166.03l-22.87,113.45c-25.97,128.8-101.91,238.71-201.57,325.33-67.51,58.68-136.57,113.42-211.5,162.68-38.44,25.27-76.13,45.52-119.08,60.36-98.83,34.14-203.29,28.11-298.05-15.76-33.88-15.68-63.58-33.09-94.68-54.37-68.21-46.68-132-96.13-194.08-150.58-93.78-82.25-164.3-175.33-196.54-295.47-11.03-41.12-17.9-81.23-25.49-123.24-12.03-66.62-32.41-128.71-63.41-189.08l156.34,141.71ZM531.18,1113.39l-22.87,22.41,1.76,3.6,30.25-25.86-100.18-92.17-29.35,27.73,2.4,3.33c10.38-5.75,17.56-15.52,26.8-23.15l91.2,84.1ZM1364.89,1113.36l91.05-84.1c10.3,9.39,16.22,18.18,26.32,22.94l2.17-3.13-29.05-28-98.96,92.36,29.03,26.16,2.86-3.24-23.42-22.99Z"/><path class="bf20" d="M33.72,504.82l153.2,140.09,124.72,113.73,51.57,47.2,164.55,150.97c1.98,1.81,9.34-4.28,9.8-6.05l17.83,15.05-8.46,8.54,93.57,86.08,168.16,154.37,112.85,103.71c2.19,1.24,7.68-.36,12.38.61l.31,84.87,28.22-.12-.72-84.39c4.15-1.45,8.08-.6,11.3-.14l125.48-115.22,205.53-188.9,44.86-40.74-8.67-9.45,17.87-14.62c.72,2.16,7.18,8.19,9.19,6.58l165.02-150.92,51.45-47.03,121.45-110.05,156.78-143.67c7.08-6.49,13.35-14.17,22.1-18.09.55,1.25,1.18,2.22,3.31,3.32l-19.74,17.79-177.67,162.31-17.29,15.39-25.9,23.72-110.47,100.25-164.48,150.36c-.27,9.88-11.04,12.89-17.23,17.14l-149.43,137.26-173.64,158.84-47.37,44.87,11.75,2.38-.58,53.04-26.86.96-.44,35-39.13.22-.74-36.28-27.14-.74.18-52.78c3.46-.35,5.93.21,10.17-2.08l-49.75-47.24-214.91-196.77-104.67-95.48c-8.37-3.09-18.32-10.47-19.91-18.69l-160.95-148.3-156.34-141.71L27.02,506.94l-21.8-19.52c3.67.53,5.8-.06,6.59-2.63l21.91,20.03ZM928.57,1366.49l-1.36-41.02-20.27.14-.3,41.98c7.64-.17,14.1,1.14,21.93-1.09ZM988.81,1368.01v-41.55s-20.24-.45-20.24-.45l.11,41.87,20.12.14Z"/><path class="bf19" d="M1861.96,505.33l-156.78,143.67c19.76-41.2,47.68-77.56,79.26-113.66l-191.51-121.91-135.99-87.87c-56.92-36.78-113.45-68.84-173.61-99.55-103.6-52.88-213.58-80.09-330.66-81-120.28-.93-234.04,26.8-340.59,80.9-62.04,31.5-119.82,64.81-178.32,102.68l-147.6,95.56-175.36,111.02c30.77,33.59,57.59,69.39,76.14,109.74L33.72,504.82l191.93-122.16,185.33-119.38c81.23-51.88,182.49-110.35,272.21-141.62,167.9-58.53,351.02-60.22,519.91-3.47,36.85,12.38,69.35,28.06,104.52,44.7,61.42,29.06,554.34,342.45,554.34,342.45Z"/><path class="bf13" d="M1205.16,1114.78c2.13,9.96,11.65,13.19,16.2,21.42-9.15,11.58-20.75,20.47-33.17,31.48l-151.7,138.2c17.39,32.96,15.96,69.33-2.84,99.66-17.72,28.59-49.87,46.11-85.91,46.1-35.77-.01-66.8-16.73-84.96-44.64-19.83-30.49-22.13-67.54-3.43-101.09l-199.51-182.63-63.19-57.03-16.19,12.5-67.42-62.64-172.24-156.54,20.36-47.85,160.95,148.3c1.6,8.22,11.54,15.6,19.91,18.69l104.67,95.48,214.91,196.77,49.75,47.24c-4.24,2.29-6.71,1.73-10.17,2.08l-.18,52.78,27.14.74.74,36.28,39.13-.22.44-35,26.86-.96.58-53.04-11.75-2.38,47.37-44.87,173.64-158.84Z"/><path class="bf7" d="M1297.48,1065.18l109.6-101.84-2.64-3.66-77.59,70.76-103.39,96.19c-6.23-5.77-11.23-11.15-18.3-11.85l149.43-137.26c6.2-4.25,16.96-7.26,17.23-17.14l164.48-150.36,18.48,49.82-240.4,219.61c-6.18-7.39-10.26-11.85-16.9-14.26Z"/><path class="bf23" d="M1297.48,1065.18l-24.56,23.28-51.56,47.73c-4.54-8.23-14.07-11.46-16.2-21.42,7.07.7,12.07,6.08,18.3,11.85l103.39-96.19,77.59-70.76,2.64,3.66-109.6,101.84Z"/><path class="bf18" d="M1364.89,1113.36l23.42,22.99-2.86,3.24-29.03-26.16,98.96-92.36,29.05,28-2.17,3.13c-10.1-4.77-16.02-13.55-26.32-22.94l-91.05,84.1Z"/><path class="bf9" d="M531.18,1113.39l-91.2-84.1c-9.24,7.63-16.42,17.4-26.8,23.15l-2.4-3.33,29.35-27.73,100.18,92.17-30.25,25.86-1.76-3.6,22.87-22.41Z"/><path class="bf12" d="M1705.17,649l-121.45,110.05c-28.36-56.61-62.07-110.03-105.73-156.39-166.61-176.93-408.19-252.62-649.69-215.05-145.12,22.58-277.41,86.83-383.83,187.72-55.49,52.61-98.14,115.51-132.84,183.31l-124.72-113.73c-18.55-40.35-45.37-76.15-76.14-109.74l175.36-111.02,147.6-95.56c58.5-37.87,116.29-71.18,178.32-102.68,106.56-54.1,220.31-81.83,340.59-80.9,117.08.91,227.06,28.12,330.66,81,60.16,30.71,116.69,62.77,173.61,99.55l135.99,87.87,191.51,121.91c-31.58,36.1-59.5,72.46-79.26,113.66Z"/><path class="bf13" d="M1532.27,806.09l-165.02,150.92c-2,1.62-8.46-4.41-9.19-6.58l-17.87,14.62,8.67,9.45-44.86,40.74-205.53,188.9-125.48,115.22c-3.23-.46-7.15-1.31-11.3.14l.72,84.39-28.22.12-.31-84.87c-4.7-.97-10.19.63-12.38-.61l-112.85-103.71-168.16-154.37-93.57-86.08,8.46-8.54-17.83-15.05c-.46,1.77-7.82,7.86-9.8,6.05l-164.55-150.97c52.91-122.29,146.85-220.62,264.2-283.27,208.9-111.53,462.41-106.17,666.3,14.09,106.21,62.65,189.11,156.41,238.57,269.42ZM957.48,614.88l.46-17.06-21.52.15c-1.77,4.35-2.6,13.99.74,16.57,6.64,1.7,14.62.57,20.31.35ZM1140.16,1142.98l140.49-125.31c-19.91-28.68-16.85-63.22,3.63-91.22l-290.78-258.74c-28.55,19.93-63.17,19.75-91.49-.49l-289.39,259.39c21.06,27.4,22.25,61.52,2.96,89.72l189.88,171.78,94.3,86.54c30.73-17.28,65.53-16.98,96.46-.39l143.94-131.28Z"/><path class="bf2" d="M1583.72,759.05l-51.45,47.03c-49.46-113.01-132.36-206.77-238.57-269.42-203.88-120.26-457.4-125.62-666.3-14.09-117.35,62.65-211.29,160.98-264.2,283.27l-51.57-47.2c34.7-67.79,77.35-130.7,132.84-183.31,106.41-100.89,238.7-165.15,383.83-187.72,241.5-37.57,483.08,38.12,649.69,215.05,43.66,46.36,77.38,99.78,105.73,156.39Z"/><polygon class="bf21" points="988.81 1368.01 968.68 1367.87 968.57 1326.01 988.81 1326.46 988.81 1368.01"/><path class="bf15" d="M928.57,1366.49c-7.83,2.24-14.29.92-21.93,1.09l.3-41.98,20.27-.14,1.36,41.02Z"/><path class="bf4" d="M1140.16,1142.98l-143.94,131.28c-30.92-16.59-65.72-16.89-96.46.39l-94.3-86.54-189.88-171.78c19.29-28.2,18.1-62.31-2.96-89.72l289.39-259.39c28.32,20.23,62.94,20.41,91.49.49l290.78,258.74c-20.48,28.01-23.55,62.54-3.63,91.22l-140.49,125.31ZM1037.31,1183.74l196.53-178.48c-7.12-24.14-5.97-46.18,2.31-69.21l-251.12-225.03c-25.21,7.15-48.96,6.44-74.51-.14l-250.56,225.73c9.68,22.82,9.18,46.19,2.13,69.22l247.53,224.46c25.9-7.31,50.19-6.72,75.99.17l51.7-46.73Z"/><path class="bf10" d="M958.94,616.24l-23.32-.4s-2.88-14.03-.85-19.02l24.71-.17-.53,19.59Z"/><polygon class="bf8" points="957.69 1340.41 957.7 1347.8 947.8 1358.7 937.2 1348.5 937.19 1340.41 957.69 1340.41"/><path class="bf1" d="M1037.31,1183.74l-51.7,46.73c-25.79-6.89-50.09-7.48-75.99-.17l-247.53-224.46c7.05-23.03,7.54-46.4-2.13-69.22l250.56-225.73c25.55,6.58,49.3,7.28,74.51.14l251.12,225.03c-8.28,23.03-9.44,45.07-2.31,69.21l-196.53,178.48ZM999.9,1000.64c18.6-29.25,6.82-64.18-23.06-78.34-19.47-9.23-42.83-9.41-61.79,1.66-29.01,16.93-36.9,55.54-16.11,81.41,13.06,16.25,31.8,23.7,52.29,22.76,17.69-.82,37.41-9.78,48.68-27.49Z"/><path class="bf3" d="M999.9,1000.64c-11.26,17.71-30.98,26.67-48.68,27.49-20.49.94-39.23-6.5-52.29-22.76-20.79-25.87-12.9-64.48,16.11-81.41,18.97-11.07,42.32-10.9,61.79-1.66,29.87,14.17,41.66,49.09,23.06,78.34Z"/><polygon class="bf22" points="957.56 963.97 939.35 964.05 939.13 957.54 957.01 957.19 957.56 963.97"/></g>
<path class="bf11" d="M25.48,423.07s271.42-169.14,363.74-222.4c103.1-59.49,196.05-105.39,276.4-141.44,158.42-71.07,345.25-79.26,544.84-18.75,42.08,12.76,121.69,54,160.54,74.61,138.69,73.57,522.36,343.31,522.36,343.31l-2.16,30.47-23.56,19.47-5.68-3.01s-487.68-310.5-554.34-342.45c-38.59-18.49-69.13-32.33-104.52-44.7-122.7-42.89-397.39-39.93-519.91,3.47-84.23,29.84-207.19,100.92-272.21,141.62-46.71,29.24-138.98,89.56-185.33,119.38-47.83,30.77-191.93,122.16-191.93,122.16l-21.91-20.03-2.72-22.06-.16-28.57,16.55-11.09Z"/>`;
// ---------- the Owner's Suite: spend your cash to upgrade the club whenever you can afford it ----------
function ownerSuite(){
  G.ownerStage='suite';G.phase=0;
  genSponsorOffers();saveGame();
  const o=G.owner,cash=o.cashReserve||0;
  const owUp=new Set(o.ownedUpgrades||[]),owFac=new Set(o.ownedFacilities||[]);
  const item=(it,can,onclick,tags)=>`<div class="panel2" style="border:1.5px solid ${can?'var(--line)':'#333'};border-radius:10px;padding:10px;margin-bottom:7px;${can?'':'opacity:.5'}">
      <div class="row" style="align-items:flex-start;justify-content:space-between;gap:10px">
        <div style="flex:1"><div style="font-weight:700">${it.name}</div><p class="small muted" style="margin:2px 0 4px">${it.desc}</p>${tags?`<div class="small">${tags}</div>`:''}</div>
        <div style="text-align:right;min-width:84px"><div style="font-weight:800">${fmtB(it.cost)}</div>
          <button class="btn primary sm" style="margin-top:5px" ${can?'':'disabled'} onclick="${onclick}">Buy</button></div></div></div>`;
  const upTags=u=>[u.fan?`📣 +${u.fan}`:'',u.rev?`💵 ${'★'.repeat(Math.round(u.rev*2))||'·'}`:'',u.cap?`🎟️ ${u.cap>0?'+':''}${u.cap}`:''].filter(Boolean).join(' &nbsp; ');
  const facTags=f=>[f.dev?'📈 dev':'',f.heal?'🏥 health':'',f.farm?'🌱 farm':'',f.happy?'😊 morale':'',f.coach?'🎓 staff':''].filter(Boolean).join(' &nbsp; ');
  const upH=STADIUM_UPGRADES.filter(u=>!owUp.has(u.id)).map(u=>item(u,u.cost<=cash,`suiteBuyUpgrade('${u.id}')`,upTags(u))).join("")||'<p class="small muted">Every ballpark upgrade is built. 🏟️</p>';
  const facH=FACILITY_OPTS.filter(f=>!owFac.has(f.id)).map(f=>item(f,f.cost<=cash,`suiteBuyFacility('${f.id}')`,facTags(f))).join("")||'<p class="small muted">Every facility is funded. 🏋️</p>';
  // staff tier-ups (pay the one-time difference; annual salary rises with the tier)
  const staffRow=(kind,label,tiers,cur)=>{const next=cur+1;if(next>=tiers.length)return `<div class="small muted" style="margin:4px 0">${label}: <b>${tiers[cur].name}</b> — maxed ★★★★</div>`;
    const diff=Math.max(1,tiers[next].cost-tiers[cur].cost),can=diff<=cash;
    return `<div class="panel2" style="border:1px solid ${can?'var(--line)':'#333'};border-radius:9px;padding:9px;margin-bottom:6px;${can?'':'opacity:.5'}">
      <div class="row" style="align-items:center;justify-content:space-between;gap:8px">
        <div style="flex:1"><div class="small"><b>${label}</b>: ${tiers[cur].name} → <b style="color:var(--gold)">${tiers[next].name}</b></div>
          <div class="small muted">${tiers[next].desc}</div></div>
        <div style="text-align:right"><div style="font-weight:700">${fmtB(diff)}</div><button class="btn primary sm" ${can?'':'disabled'} onclick="suiteUpgradeStaff('${kind}',${next})">Upgrade</button></div></div></div>`;};
  // sponsorships: active contracts + this year's offers
  const active=(o.sponsors||[]).map(s=>{const left=(s.signedYear||1)+(s.term||3)-G.year;
    return `<div class="small" style="padding:3px 0;display:flex;justify-content:space-between"><span>🤝 ${s.slot} — <b>${s.name}</b> <span style="color:var(--green)">+$${s.rev}M</span></span><span class="muted">${left} yr${left===1?'':'s'} left</span></div>`;}).join("")||'<p class="small muted">No active sponsorship deals.</p>';
  const offers=(o._sponsorOffers||[]);
  const offH=offers.length?offers.map(s=>`<div class="panel2" style="border:1px solid var(--line);border-radius:9px;padding:10px;margin-bottom:7px">
      <div class="row" style="align-items:center;justify-content:space-between;gap:8px">
        <div style="flex:1"><div style="font-weight:700">${s.renew?'♻️ ':''}${s.slot} — ${s.brand} <span class="small" style="color:var(--green)">+$${s.rev}M/yr</span> <span class="small muted">· ${s.term}-yr deal</span>${s.fanCost?` <span class="small" style="color:var(--red)">−${s.fanCost} fans</span>`:''}</div>
          <p class="small muted" style="margin:2px 0 0">${s.renew?'This slot just opened up — re-sign or take the new offer. ':''}${s.desc}</p></div>
        <button class="btn primary sm" onclick="acceptSponsor('${s.type}')">Sign</button></div></div>`).join(""):'<p class="small muted">No open sponsorship slots — all your inventory is under contract.</p>';
  // Tier-2 premium attractions & programs (unlock once the ballpark + facilities are fully built out)
  const owAm=new Set(o.ownedAmenities||[]);
  const amTags=a=>[a.fx.fan?`📣 +${a.fx.fan}`:'',a.fx.rev?'💵 rev':'',a.fx.dev?'📈 dev':'',a.fx.farm?'🌱 farm':'',a.fx.heal?'🏥 health':'',a.fx.home?'🏟️ win edge':'',a.fx.merch?'🧢 merch':'',a.fx.trade?'🕵️ trade intel':'',a.fx.gate?'🎟️ gate':'',a.fx.ops?'💡 lower costs':'',a.fx.hof?'🏛️ HOF':'',a.fx.scout?'🔭 scouting':''].filter(Boolean).join(' &nbsp; ');
  let premH;
  if(!ownerTier2Unlocked()){
    const upLeft=STADIUM_UPGRADES.filter(u=>!owUp.has(u.id)).length,facLeft=FACILITY_OPTS.filter(f=>!owFac.has(f.id)).length;
    premH=`<p class="small muted">🔒 Finish building out the ballpark and facilities to unlock showpiece attractions and team programs — <b>${upLeft} upgrade${upLeft===1?'':'s'}</b> and <b>${facLeft} facilit${facLeft===1?'y':'ies'}</b> to go.</p>`;
  } else {
    const list=SUITE_PREMIUM.filter(a=>!owAm.has(a.id));
    premH=list.length?list.map(a=>item(a,a.cost<=cash,`suiteBuyAmenity('${a.id}')`,`<span class="pill" style="padding:0 5px;font-size:9px">${a.cat}</span> &nbsp; ${amTags(a)}`)).join(""):'<p class="small muted">You\'ve built every attraction and program — a true showplace. 🌟</p>';
  }
  render(`${ownerHeader()}
    <div class="panel center" style="border-color:var(--gold)"><div class="pill gold">🏛️ THE OWNER'S SUITE</div>
      <p class="sub" style="margin-top:6px">Reinvest your profits. Anything you couldn't afford on day one, you can build now out of your <b>cash reserve</b> of <b style="color:${cash>=150?'var(--ink)':'var(--red)'}">${fmtB(cash)}</b>.</p></div>
    <div class="panel"><h3>🏟️ Your ballpark — outfield dimensions</h3>
      ${fieldEditorHTML('owner')}
      <p class="small muted" id="dimhint" style="text-align:center;margin:6px 0 0">${ownerParkHint()}</p></div>
    <div class="panel"><h3>✨ Ballpark upgrades</h3>${upH}</div>
    <div class="panel"><h3>🏋️ Team facilities</h3>${facH}</div>
    <div class="panel"><h3>👔 Front-office upgrades</h3>
      ${staffRow('analytics','Analytics',ANALYTICS_TIERS,o.analyticsTier)}
      ${staffRow('scout','Scouting',SCOUT_TIERS,o.scoutTier)}
      ${staffRow('coach','Head coach',COACH_TIERS,o.coachTier)}
      <div class="small muted" style="margin-top:4px">Your GM (${o.gmName}) is hired separately — <a href="#" onclick="ownerReplaceGM();return false;" style="color:var(--gold)">replace him here</a>.</div></div>
    <div class="panel" style="border-color:var(--gold)"><h3>🌟 Premium attractions &amp; programs <span class="small muted">— Tier 2</span></h3>${premH}</div>
    <div class="panel"><h3>🤝 Sponsorships <span class="small muted">— multi-year contracts that expire and reopen</span></h3>
      <div class="sectlbl">Active deals</div>${active}
      <div class="sectlbl" style="margin-top:8px">Open slots / offers</div>${offH}</div>
    <div class="center" style="margin:8px 0"><button class="btn primary" onclick="ownerOffice()">← Back to the office</button></div>`);
}
function suiteBuyUpgrade(id){const o=G.owner,u=STADIUM_UPGRADES.find(x=>x.id===id);if(!u)return;
  if(u.cost>(o.cashReserve||0)){toast('Not enough cash on hand.');return;}
  o.cashReserve=Math.round((o.cashReserve-u.cost)*10)/10;(o.ownedUpgrades=o.ownedUpgrades||[]).push(id);
  if(u.fan)fanChange(u.fan,`Fans love the new ${u.name.toLowerCase()}`);
  o.totalSpent=(o.totalSpent||0)+u.cost;ownerRecalc();saveGame();toast(`Built: ${u.name}`);ownerSuite();}
function suiteBuyFacility(id){const o=G.owner,f=FACILITY_OPTS.find(x=>x.id===id);if(!f)return;
  if(f.cost>(o.cashReserve||0)){toast('Not enough cash on hand.');return;}
  o.cashReserve=Math.round((o.cashReserve-f.cost)*10)/10;(o.ownedFacilities=o.ownedFacilities||[]).push(id);
  if(f.happy)fanChange(Math.round(f.happy*2),`A first-class ${f.name.toLowerCase()} lifts the club`);
  o.totalSpent=(o.totalSpent||0)+f.cost;ownerRecalc();saveGame();toast(`Funded: ${f.name}`);ownerSuite();}
function suiteUpgradeStaff(kind,tier){
  const o=G.owner,tiers={analytics:ANALYTICS_TIERS,scout:SCOUT_TIERS,coach:COACH_TIERS}[kind];
  const cur={analytics:o.analyticsTier,scout:o.scoutTier,coach:o.coachTier}[kind];if(!tiers||tier<=cur)return;
  const cost=Math.max(1,tiers[tier].cost-tiers[cur].cost);
  if(cost>(o.cashReserve||0)){toast('Not enough cash on hand.');return;}
  o.cashReserve=Math.round((o.cashReserve-cost)*10)/10;
  if(kind==='analytics')o.analyticsTier=tier;else if(kind==='scout')o.scoutTier=tier;else o.coachTier=tier;
  o.totalSpent=(o.totalSpent||0)+cost;ownerRecalc();saveGame();toast(`Upgraded ${kind}`);ownerSuite();}

function setMandate(m){G.owner.mandate=m;const presets=ownerBudgetPresets();
  // nudge the default budget toward the mandate when the owner hasn't overridden it
  const map={winNow:'aggressive',contend:'balanced',retool:'balanced',rebuild:'frugal'};
  G.owner.payrollBudget=(presets.find(p=>p.key===map[m])||presets[1]).cap;ownerOffice();}
function setBudget(cap){G.owner.payrollBudget=cap;ownerOffice();}
function toggleDirective(k){G.owner.directives[k]=!G.owner.directives[k];ownerOffice();}
function ownerOffice(){
  G.ownerStage='office';G.phase=0;G._ownerTakeover=false;
  if(G.owner.payrollBudget==null){const pp=ownerBudgetPresets();G.owner.payrollBudget=pp[1].cap;}
  genSponsorOffers();saveGame();
  const o=G.owner,rev=ownerRevenue(),exp=ownerExpenses(),pay=payroll(G.roster),proj=warToWins(teamWAR(G.roster));
  const acted=o._ownerActed===G.year;   // did the owner already run the front office this winter?
  const mc=mandateContext();
  const mandOpt=Object.keys(MANDATES).map(k=>{const m=MANDATES[k],sel=o.mandate===k,rec=mc.rec===k;
    return `<div class="panel2" style="border:1.5px solid ${sel?'var(--gold)':rec?'#6f8f5a':'var(--line)'};border-radius:4px;padding:10px;flex:1;min-width:150px;cursor:pointer" onclick="setMandate('${k}')">
      <div class="disp" style="font-weight:700;font-size:14px;${sel?'color:var(--gold)':''}">${sel?'✓ ':''}${m.name}${rec?' <span class="pill" style="padding:0 5px;font-size:8px;background:#24351c;color:#9fe1cb">GM PICK</span>':''}</div>
      <p class="small muted" style="margin:3px 0 0">${m.desc}</p></div>`;}).join("");
  const presets=ownerBudgetPresets();
  const budOpt=presets.map(p=>{const sel=Math.abs((o.payrollBudget||0)-p.cap)<1;
    return `<button class="btn ${sel?'primary':''} sm" onclick="setBudget(${p.cap})" title="${p.desc}">${p.name} · $${p.cap}M</button>`;}).join(" ");
  const dir=[['protectProspects','🛡️ Protect top prospects','GM won\'t trade your best farm talent.'],
    ['splurge','💰 Splurge on free agents','Prioritize signing the best available bats/arms.'],
    ['getYounger','🌱 Get younger','Favor youth; move aging veterans.'],
    ['pitchingFirst','⚾ Pitching first','Address the rotation/bullpen before hitting.']];
  const dirHtml=dir.map(([k,lbl,d])=>{const on=o.directives[k];
    return `<div class="panel2" style="border:1.5px solid ${on?'var(--gold)':'var(--line)'};border-radius:4px;padding:8px;cursor:pointer" onclick="toggleDirective('${k}')">
      <div style="font-weight:700">${on?'✓ ':''}${lbl}</div><p class="small muted" style="margin:2px 0 0">${d}</p></div>`;}).join("");
  const priceRow=(cat,it)=>{
    if(!ownerUnlocked(it.unlock)){const up=STADIUM_UPGRADES.find(u=>u.id===it.unlock)||SUITE_PREMIUM.find(u=>u.id===it.unlock);
      return `<div class="row" style="opacity:.45;align-items:center;justify-content:space-between;padding:2px 0"><span class="small">🔒 ${it.name}</span><span class="small muted">build the ${up?up.name:it.unlock} in the Suite</span></div>`;}
    const idx=priceIdx(cat,it.key);
    return `<div class="row" style="align-items:center;justify-content:space-between;gap:6px;padding:2px 0">
      <span class="small" style="flex:0 0 92px">${it.name}</span>
      <span style="display:flex;gap:4px">${it.p.map((pr,i)=>`<button class="btn ${idx===i?'primary':''} sm" style="padding:2px 7px" title="${PRICE_LABELS[i]}" onclick="setPrice('${cat}','${it.key}',${i})">$${pr}</button>`).join("")}</span></div>`;};
  const pricingHtml=`
    <div class="sectlbl">🎟️ Tickets <span class="small muted">(by section)</span></div>${TICKET_SECTIONS.map(s=>priceRow('tickets',s)).join("")}
    <div class="sectlbl" style="margin-top:8px">🍔 Concessions</div>${CONCESSION_ITEMS.map(it=>priceRow('conc',it)).join("")}
    <div class="sectlbl" style="margin-top:8px">🧢 Merchandise</div>${MERCH_ITEMS.map(it=>priceRow('merch',it)).join("")}`;
  const offers=(o._sponsorOffers||[]);
  const sponsorHtml=offers.length?offers.map(s=>`<div class="panel2" style="border:1px solid var(--line);border-radius:4px;padding:10px;margin-bottom:7px">
      <div class="row" style="align-items:center;justify-content:space-between;gap:8px">
        <div style="flex:1"><div style="font-weight:700">${s.name} <span class="small" style="color:var(--green)">+$${s.rev}M/yr</span>${s.fanCost?` <span class="small" style="color:var(--red)">−${s.fanCost} fans</span>`:''}</div>
          <p class="small muted" style="margin:2px 0 0">${s.desc}</p></div>
        <button class="btn primary sm" onclick="acceptSponsor('${s.type}')">Accept</button></div></div>`).join(""):'<p class="small muted">No new sponsorship offers this year.</p>';
  render(`${ownerHeader()}
    <div class="panel center" style="border-color:var(--gold)"><div class="pill gold">💼 OWNER'S OFFICE · SEASON ${G.year}</div>
      <p class="sub" style="margin-top:6px">Set the plan and the prices, then hand the baseball to <b>GM ${o.gmName}</b>. Your roster currently projects to <b>${proj} wins</b> on a <b>$${pay}M</b> payroll.</p></div>
    <div class="panel"><h3>📈 The books <span class="small muted">— projected this season</span></h3>
      <div style="display:flex;align-items:center;gap:18px;flex-wrap:wrap;margin-top:4px">
        <div style="display:flex;flex-direction:column;align-items:center;flex-shrink:0;width:128px">
          ${fanDial(Math.round(fanVal()),120)}
          <div class="sectlbl" style="margin-top:0;text-align:center">📣 Fan Happiness</div>
          <div class="small muted" style="text-align:center;line-height:1.3;margin-top:3px">${fanMood(fanVal())}</div></div>
        <div class="grid2" style="flex:1;min-width:230px;gap:8px">
          <div class="kpi"><div class="big" style="font-size:16px;color:var(--green)">$${rev.total}M</div><div class="lbl">Revenue</div></div>
          <div class="kpi"><div class="big" style="font-size:16px;color:var(--red)">$${exp.total}M</div><div class="lbl">Expenses</div></div>
          <div class="kpi"><div class="big" style="font-size:16px;color:${(rev.total-exp.total)>=0?'var(--green)':'var(--red)'}">${(rev.total-exp.total)>=0?'+':''}$${Math.round((rev.total-exp.total)*10)/10}M</div><div class="lbl">Net income</div></div>
          <div class="kpi"><div class="big" style="font-size:16px">${rev.att.toLocaleString()}</div><div class="lbl">Fans/game</div></div>
        </div>
      </div></div>
    <div class="panel"><div class="row" style="align-items:center;justify-content:space-between"><h3 style="margin:0">${gmArcheInfo().icon} GM ${o.gmName} <span class="small muted">${'★'.repeat(o.gmTier+1)}${'☆'.repeat(3-o.gmTier)}</span></h3>
        <button class="btn ghost sm" onclick="ownerReplaceGM()">🔄 Replace GM</button></div>
      <div class="small" style="color:var(--gold);margin-top:2px">${gmArcheInfo().name}${infoDot(gmArcheInfo().blurb)}</div>
      <div class="row" style="align-items:center;gap:10px;margin-top:6px"><span class="small muted" style="flex:0 0 54px">Morale</span><div style="flex:1">${(function(){const m=o.gmMorale||72;return `<div class="favtrack" style="height:8px"><div class="favbar" style="width:${m}%;background:${m>=66?'var(--green)':m>=40?'var(--gold)':'var(--red)'}"></div></div>`;})()}</div><span class="small">${o.gmMorale||72}</span></div>
      ${o._gmGrade?`<p class="small muted" style="margin:6px 0 0">Last season he earned a <b style="color:${o._gmGrade[0]==='A'?'var(--green)':o._gmGrade==='D'?'var(--red)':'var(--gold)'}">${o._gmGrade}</b> against your ${MANDATES[o.mandate].name} mandate.</p>`:''}
      ${o._feedbackYear===G.year?'<p class="small muted" style="margin:5px 0 0">You\'ve spoken with him this winter.</p>':`<div class="row" style="gap:8px;margin-top:7px"><button class="btn sm" onclick="gmFeedback('praise')">👍 Praise him</button><button class="btn sm" onclick="gmFeedback('pressure')">📣 Apply pressure</button></div>`}</div>
    <div class="panel"><h3>🎯 GM mandate</h3><p class="sub" style="margin:2px 0 8px">${mc.msg} Pick a direction for the winter.</p>
      <div class="row" style="gap:8px;flex-wrap:wrap;align-items:stretch">${mandOpt}</div></div>
    <div class="panel"><h3>💵 Authorized payroll budget${infoDot('The GM will not exceed this. Set it below your current payroll to make him shed salary; set it above to let him spend on trades and free agents.')}</h3>
      <div style="margin:6px 0">${budOpt}</div>
      <p class="small muted">Set to <b>$${o.payrollBudget}M</b> · current payroll <b>$${pay}M</b>.</p></div>
    <div class="panel"><h3>📋 Directives</h3><div class="grid2" style="gap:8px">${dirHtml}</div></div>
    <div class="panel"><h3>🎟️ Pricing menu <span class="small muted">— Value / Standard / Premium</span>${infoDot('Premium prices earn more per fan but thin the crowd and cool the fan base. Value pricing fills seats and wins goodwill. Locked items unlock when you build the matching upgrade in the Suite.')}</h3>
      ${pricingHtml}
      <p class="small muted" style="margin-top:8px">~<b>${ownerAttendance().toLocaleString()}</b> fans/game · gate <b>$${rev.gate}M</b> · concessions <b>$${rev.conc}M</b> · merch <b>$${rev.merch}M</b>.</p></div>
    <div class="panel" style="border-color:var(--gold)"><div class="row" style="align-items:center;justify-content:space-between;gap:8px"><h3 style="margin:0">🏛️ Owner's Suite${infoDot('Reinvest your cash reserve into ballpark upgrades, team facilities, front-office tiers, and multi-year sponsorship deals.')}</h3>
        <button class="btn primary sm" onclick="ownerSuite()">Open the Suite →</button></div>
      <p class="small muted" style="margin:6px 0 0"><b>${fmtB(o.cashReserve||0)}</b> cash on hand · ${(o._sponsorOffers||[]).length} sponsor offer${(o._sponsorOffers||[]).length===1?'':'s'} open.</p></div>
    <div class="center" style="margin-top:8px">
      <button class="btn" style="margin-right:6px" onclick="ownerTakeover()">🎮 ${acted?'Make more moves yourself':'Take over &amp; make moves yourself'}</button>
      <button class="btn primary" style="font-size:16px;padding:12px 26px" onclick="gmOffseason()">${acted?'▶ On to the season ⚾':'Hand it to GM '+o.gmName+' → ⚾'}</button>
      <p class="small muted" style="margin:7px 0 0">${acted?`You ran the front office yourself — ${o.gmName} stands down until the deadline.`:`Run it yourself, or hand the offseason to ${o.gmName}. Whoever runs it, the other stands down for the winter.`}</p></div>`);
}

function gmFeedback(kind){const o=G.owner;if(o._feedbackYear===G.year)return;o._feedbackYear=G.year;
  if(kind==='praise'){o.gmMorale=clamp((o.gmMorale||72)+6,0,100);toast(`GM ${o.gmName} appreciates the vote of confidence.`);}
  else{o.gmMorale=clamp((o.gmMorale||72)-3,0,100);toast(`You put GM ${o.gmName} on notice.`);}
  saveGame();ownerOffice();}
let _gmMarket=null;
function genGmMarket(){
  const tierPlan=[0,1,1,2,2,3];                                 // a spread from budget to elite
  const specials=GM_ARCHE_KEYS.filter(k=>k!=="generalist").slice();
  for(let i=specials.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[specials[i],specials[j]]=[specials[j],specials[i]];}
  let si=0;
  const list=tierPlan.map((tier,idx)=>{
    const arche=idx===0?"generalist":specials[si++%specials.length];
    return {tier,arche,name:gmFirstName()+' '+gmLastName(),cost:GM_TIERS[tier].cost+GM_ARCHES[arche].premium};
  });
  list.sort((a,b)=>a.cost-b.cost);
  return list;
}
function ownerReplaceGM(){
  const o=G.owner;
  _gmMarket=genGmMarket();
  const card=(c,i)=>{const cur=o.gmTier===c.tier&&gmArche()===c.arche,ar=GM_ARCHES[c.arche];
    return `<div class="panel2" style="border:1.5px solid ${cur?'var(--gold)':'var(--line)'};border-radius:4px;padding:11px;margin-bottom:8px">
      <div class="row" style="align-items:center;justify-content:space-between;gap:10px">
        <div style="flex:1">
          <div style="font-weight:700">${ar.icon} ${ar.name} <span class="small muted">· $${c.cost}M/yr</span>${cur?' <span class="pill gold" style="padding:0 5px;font-size:9px">CURRENT</span>':''}</div>
          <div class="disp small" style="color:var(--gold);letter-spacing:.04em;margin:3px 0 2px">${'★'.repeat(c.tier+1)}${'☆'.repeat(3-c.tier)} ${GM_TIERS[c.tier].name}</div>
          <p class="small muted" style="margin:0">${ar.blurb}</p></div>
        ${cur?'':`<button class="btn primary sm" onclick="doReplaceGM(${i})">Hire</button>`}</div></div>`;};
  render(`${ownerHeader()}
    <div class="panel center" style="border-color:var(--gold)"><div class="pill gold">🔄 HIRE A NEW GM</div>
      <p class="sub" style="margin-top:6px">Buy out ${o.gmName} and hire your own. Salary comes from your cash reserve (${fmtB(o.cashReserve||0)} on hand).${infoDot('Higher tiers make smarter moves and need fewer vetoes. Each GM also has a specialty that adds a real edge — pay more for a better, more specialized executive.')}</p></div>
    <div class="sectlbl">This winter's candidates <span class="small muted">— cheapest to priciest</span></div>
    ${_gmMarket.map(card).join("")}
    <div class="center"><button class="btn ghost" onclick="ownerOffice()">← Back to the office</button></div>`);
}
function doReplaceGM(i){const o=G.owner,c=(_gmMarket||[])[i];if(!c)return;
  o.gmTier=c.tier;o.gmArche=c.arche;o.gmName=c.name;o.gmMorale=74;o._gmGrade=null;
  toast(`Hired ${o.gmName} — ${GM_ARCHES[c.arche].icon} ${GM_ARCHES[c.arche].name}.`);saveGame();ownerOffice();}

// ---------- the GM makes his moves (auto), big ones go to you for a veto ----------
let _vetoQ=[];   // pending big moves awaiting owner approval (transient)
function gmTalent(){return G.owner?G.owner.gmTier:1;}   // 0..3
function gmProjPayroll(){return payroll(G.roster);}
function gmOffseason(){
  if(G.owner._gmYear===G.year)return gmReport();   // already ran this winter — show the digest
  if(G.year>=2&&G.faYear!==G.year){G.faMarket=genFAMarket();G.faYear=G.year;G.faSigns=0;}
  const o=G.owner,tier=o.gmTier,mand=o.mandate,dir=o.directives,budget=o.payrollBudget||200;
  const applied=[],pending=[];_vetoQ=[];
  const ns=needsSurplus();let needs=ns.needs.slice();
  if(dir.pitchingFirst)needs.sort((a,b)=>((b==='SP'||b==='RP')?1:0)-((a==='SP'||a==='RP')?1:0));
  const logA=(d)=>applied.push(d);const logP=(d,fn,undo)=>{pending.push(d);_vetoQ.push({desc:d,fn,undo});};
  const big=(p)=>p&&p.ovr>=84;
  // 0) MEET THE BUDGET: if payroll is over the authorized cap, shed salary until it's close (the owner's directive)
  //    big-salary stars are surfaced for your veto; the rest the GM dumps for prospects/picks on his own.
  {let shed=0;
   const protectYoung=p=>dir.protectProspects&&p.age<=25&&p.ovr>=80;   // don't dump your young cornerstones if protecting prospects
   while(payroll(G.roster)>budget+20 && shed<16){
     const cand=G.roster.filter(p=>p.loc==='mlb'&&p.salary>=4&&!protectYoung(p)).sort((a,b)=>b.salary-a.salary)[0];
     if(!cand)break;
     const idx=G.roster.indexOf(cand);G.roster.splice(idx,1);            // reserve out so payroll reflects the intent
     const haul=()=>{const n=1+(cand.ovr>=84?1:0)+gmTradeHaulBonus();for(let k=0;k<n;k++){const pr=ficProspect();pr.pot=clamp(pr.pot+(cand.ovr-72),60,99);pr.loc='farm';pr.src='trade';G.farm.push(pr);}if(cand.ovr>=82)(G.pendingComp=G.pendingComp||[]).push(mkFuturePick(2));};
     const desc=`Shed ${cand.pos} ${cand.name} ($${cand.salary}M, ${cand.ovr} OVR) — salary relief to hit your $${budget}M budget`;
     if(cand.ovr>=84||isFanFav(cand)){logP('🔻 '+desc,()=>haul(),()=>{G.roster.push(cand);});}   // big: your call (veto returns him)
     else{haul();logA('🔻 '+desc);}                                       // routine dump: done
     shed++;
   }}
  // 1) REBUILD / RETOOL / GET-YOUNGER: sell veterans for youth
  if(mand==='rebuild'||mand==='retool'||dir.getYounger){
    const vets=G.roster.filter(p=>p.loc==='mlb'&&p.age>=31&&p.ovr>=72&&!p._keeperYoung).sort((a,b)=>b.ovr-a.ovr);
    const sellN=mand==='rebuild'?Math.min(3,vets.length):Math.min(1,vets.length);
    vets.slice(0,sellN).forEach(p=>{
      const desc=`Trade ${p.age}-yo ${p.pos} ${p.name} (${p.ovr} OVR${p.years<=1?', expiring':''}) for a prospect package`;
      const fn=()=>{const idx=G.roster.indexOf(p);if(idx<0)return;G.roster.splice(idx,1);
        const haul=1+(tier>=2?1:0)+(p.ovr>=86?1:0)+gmTradeHaulBonus();for(let i=0;i<haul;i++){const pr=ficProspect();pr.pot=clamp(pr.pot+(tier*2)+(p.ovr-72),60,99);pr.loc='farm';pr.src='trade';G.farm.push(pr);}
        if(p.ovr>=84&&(G.pendingComp=G.pendingComp||[])){G.pendingComp.push(mkFuturePick(2));}};
      if(big(p)||isFanFav(p))logP('🔻 '+desc,fn);else{fn();logA('🔻 '+desc);}
    });
  }
  // 2) WIN-NOW / CONTEND: chase an impact bat or arm via trade (costs prospects)
  if((mand==='winNow'||mand==='contend')&&!dir.protectProspects){
    const topFarm=G.farm.slice().sort((a,b)=>b.pot-a.pot);
    if(topFarm.length>=2&&(mand==='winNow'||Math.random()<0.5)){
      const starOvr=clamp(ri(83,90)+ (tier>=3?2:0)+(gmHasTradeEdge()?ri(1,3):0),80,95);   // a trade-shark GM lands sharper targets
      const pos=needs[0]||pick(["SP","SS","CF","3B","RF"]);
      const star=ficVeteran(true);star.ovr=starOvr;star.pot=Math.max(star.pot,starOvr);star.pos=(pos==='RP'||pos==='SP')?pos:star.pos;star.age=ri(27,31);star.salary=salaryFor(starOvr,4,star.pos);star.years=ri(3,5);star.loc='mlb';star.src='trade';star.mlbYears=6;
      // only propose it if your authorized budget can absorb the salary — so an approval always goes through
      if(gmProjPayroll()+star.salary<=budget+25){
        const cost=topFarm.slice(0,star.ovr>=88?2:1);
        const desc=`Trade ${cost.map(c=>c.name+' ('+c.pot+' ceil)').join(' + ')} for star ${star.pos} ${star.name} (${star.ovr} OVR, $${star.salary}M)`;
        cost.forEach(c=>{const i=G.farm.indexOf(c);if(i>=0)G.farm.splice(i,1);});   // reserve the prospects now so the backfill can't promote them out from under the deal
        const fn=()=>{G.roster.push(star);};                 // approve: the star arrives (prospects already shipped out)
        const undo=()=>{cost.forEach(c=>G.farm.push(c));};   // veto: the prospects come home
        logP('🔺 '+desc,fn,undo);   // acquiring a star is always a big move → your call
      }
    }
  }
  // 3) FREE AGENCY: fill needs within budget (the bread and butter)
  const fas=(G.faMarket||[]).slice().sort((a,b)=>b.player.ovr-a.player.ovr);
  const wantPos=new Set(needs);
  const splurge=dir.splurge||mand==='winNow';
  let signs=0,maxSigns=splurge?4:mand==='rebuild'?1:3;
  for(const fa of fas){
    if(signs>=maxSigns)break;
    const p=fa.player;const fits=wantPos.size===0||wantPos.has(p.pos)||(splurge&&p.ovr>=82);
    if(!fits)continue;
    const years=p.ovr>=84?ri(3,5):ri(1,3);const aav=Math.round(termAAV(fa.aav,years)*gmFaDiscount()*10)/10;
    if(gmProjPayroll()+aav>budget)continue;                 // stay under the authorized budget
    if(mand==='rebuild'&&p.ovr>=80)continue;                // don't block youth in a teardown
    const desc=`Sign ${p.pos} ${p.name} (${p.ovr} OVR, age ${p.age}) — ${years}yr/$${aav}M per`;
    const fn=()=>{const cur=(G.faMarket||[]).find(x=>x.id===fa.id);if(!cur)return;
      if(p._fromPool){if(!G.pool.some(x=>x.id===p.id)){G.faMarket=G.faMarket.filter(x=>x.id!==fa.id);return;}G.pool=G.pool.filter(x=>x.id!==p.id);delete p._fromPool;}
      p.salary=aav;p.years=years;p.loc='mlb';p.src='fa';p.inj=0;p.mlbYears=6;p.happy=clamp(happyVal(p)+12,60,90);
      G.roster.push(p);G.faMarket=G.faMarket.filter(x=>x.id!==fa.id);};
    if(aav>=18||p.ovr>=85){logP('✍️ '+desc+' <span class="small muted">(major signing)</span>',fn);}
    else{fn();logA('✍️ '+desc);}
    wantPos.delete(p.pos);signs++;
  }
  // 4) backfill to a viable roster: promote the farm's best, then fill any gap with org depth
  const mlbCount=()=>G.roster.filter(p=>p.loc==='mlb').length;
  let promoted=0;
  while(mlbCount()<26){
    const ready=G.farm.slice().sort((a,b)=>b.ovr-a.ovr)[0];
    if(ready&&(ready.ovr>=66||mlbCount()<24)){const i=G.farm.indexOf(ready);G.farm.splice(i,1);ready.loc='mlb';ready.src=ready.src||'draft';G.roster.push(ready);promoted++;}
    else{const r=ficReplacement();r.loc='mlb';r.src='org';G.roster.push(r);}
    if(mlbCount()>40)break;   // safety
  }
  if(promoted)logA(`⬆️ Promoted ${promoted} player${promoted>1?'s':''} from the farm to round out the roster`);
  if(!applied.length&&!pending.length)applied.push('🤝 A quiet winter — GM '+o.gmName+' stood pat, happy with the group.');
  o._gmYear=G.year;o._gmDigest={applied,pendingDesc:pending.slice()};
  saveGame();
  if(_vetoQ.length)return ownerVetoStep();
  gmReport();
}
function ownerVetoStep(){
  G.ownerStage='veto';
  if(!_vetoQ.length)return gmReport();
  const m=_vetoQ[0],o=G.owner;
  render(`${ownerHeader()}
    <div class="panel center" style="border-color:var(--gold)"><div class="pill gold">🛑 GM PROPOSES A BIG MOVE</div>
      <h2 style="margin:8px 0;font-size:20px">${m.desc.replace(/^[^ ]+ /,'')}</h2>
      <p class="sub">GM ${o.gmName} wants to pull the trigger. As the owner, you can approve it or kill it. ${_vetoQ.length>1?`(${_vetoQ.length} decisions pending)`:''}</p>
      <div class="row" style="gap:10px;justify-content:center;margin-top:10px">
        <button class="btn" style="border-color:#c0392b;color:#ff8a6b" onclick="vetoResolve(false)">🚫 Veto it</button>
        <button class="btn primary" onclick="vetoResolve(true)">✅ Approve the move</button></div>
    </div>`);
}
function vetoResolve(approve){
  const m=_vetoQ.shift();if(!m)return ownerVetoStep();
  if(approve){try{m.fn();}catch(e){}toast('Approved');}
  else{try{if(m.undo)m.undo();}catch(e){}(G.owner._gmVetoed=G.owner._gmVetoed||[]).push(m.desc);G.owner.gmMorale=clamp((G.owner.gmMorale||72)-4,0,100);toast('Vetoed');}
  saveGame();
  if(_vetoQ.length)return ownerVetoStep();
  gmReport();
}
function gmReport(){
  G.ownerStage='gm';saveGame();
  const o=G.owner,dig=o._gmDigest||{applied:[],pendingDesc:[]};
  const vetoed=o._gmVetoed||[];
  render(`${ownerHeader()}
    <div class="panel center" style="border-color:var(--gold)"><div class="pill gold">📝 GM'S OFFSEASON REPORT</div>
      <h2 style="margin:6px 0">${MANDATES[o.mandate].name} · $${o.payrollBudget}M budget</h2>
      <p class="sub">Here's what GM ${o.gmName} did with the winter. Payroll now sits at <b>$${payroll(G.roster)}M</b>; the club projects to <b>${warToWins(teamWAR(G.roster))} wins</b>.</p></div>
    <div class="panel"><h3>✅ Moves made</h3>
      <ul style="margin:4px 0">${(dig.applied.length?dig.applied:['No moves.']).map(d=>`<li class="small" style="margin:3px 0">${d}</li>`).join("")}</ul>
      ${vetoed.length?`<h3 style="margin-top:10px">🚫 You vetoed</h3><ul style="margin:4px 0">${vetoed.map(d=>`<li class="small muted" style="margin:3px 0">${d}</li>`).join("")}</ul>`:''}
    </div>
    <div class="center"><button class="btn primary" style="font-size:16px;padding:12px 26px" onclick="ownerToDeadline()">Play the season ⚾ →</button></div>`);
}
// ---------- the in-season trade deadline: your GM pitches one big move, you approve or veto ----------
let _dlMove=null;
function genDeadlineMove(){
  const o=G.owner,mand=o.mandate,tier=o.gmTier,proj=warToWins(teamWAR(G.roster)),bar=MANDATES[mand].bar,budget=o.payrollBudget||200;
  // are we buyers or sellers at the deadline?
  let stance=null;
  if(mand==='rebuild')stance='sell';
  else if(proj>=bar-4)stance='buy';
  else if(proj<=bar-12&&mand!=='winNow')stance='sell';
  else if(Math.random()<0.5)stance=proj>=bar-8?'buy':'sell';
  if(!stance)return null;
  if(stance==='buy'){
    if(o.directives.protectProspects&&Math.random()<0.7)return null;
    const top=G.farm.slice().sort((a,b)=>b.pot-a.pot)[0];if(!top)return null;
    const ovr=clamp(ri(80,86)+(tier>=3?1:0)+(gmHasTradeEdge()?ri(1,2):0),78,92),pos=needsSurplus().needs[0]||pick(["SP","RP","SS","CF","3B"]);
    const rent=ficVeteran(true);rent.ovr=ovr;rent.pot=Math.max(rent.pot,ovr);rent.pos=(pos==='SP'||pos==='RP')?pos:rent.pos;rent.age=ri(28,33);rent.salary=Math.round(salaryFor(ovr,1,rent.pos)*0.5*10)/10;rent.years=1;rent.loc='mlb';rent.src='trade';rent.mlbYears=6;
    if(gmProjPayroll()+rent.salary>budget+30)return null;
    const i=G.farm.indexOf(top);if(i>=0)G.farm.splice(i,1);   // reserve the prospect
    return {stance,desc:`acquire rental ${rent.pos} ${rent.name} (${rent.ovr} OVR, expiring) for prospect ${top.name} (${top.pot} ceil)`,
      player:rent,proj,
      fn:()=>{G.roster.push(rent);},undo:()=>{G.farm.push(top);}};
  }else{
    const vet=G.roster.filter(p=>p.loc==='mlb'&&p.age>=30&&p.ovr>=74&&p.years<=2).sort((a,b)=>b.ovr-a.ovr)[0];if(!vet)return null;
    return {stance,desc:`sell veteran ${vet.pos} ${vet.name} (${vet.ovr} OVR) to a contender for a prospect haul`,
      player:vet,proj,
      fn:()=>{const i=G.roster.indexOf(vet);if(i<0)return;G.roster.splice(i,1);const haul=1+(tier>=2?1:0)+(vet.ovr>=84?1:0)+gmTradeHaulBonus();for(let k=0;k<haul;k++){const pr=ficProspect();pr.pot=clamp(pr.pot+tier*2+(vet.ovr-74),60,99);pr.loc='farm';pr.src='trade';G.farm.push(pr);}(G.pendingComp=G.pendingComp||[]).push(mkFuturePick(3));},
      undo:null};
  }
}
function ownerToDeadline(){
  if((G.history||[]).some(h=>h.year===G.year))return goPhase(3);   // already played this year
  _dlMove=genDeadlineMove();
  if(!_dlMove)return ownerPlaySeason();
  G.ownerStage='deadline';saveGame();ownerDeadlineScreen();
}
function ownerDeadlineScreen(){
  const o=G.owner,m=_dlMove;if(!m)return ownerPlaySeason();
  const buying=m.stance==='buy';
  render(`${ownerHeader()}
    <div class="panel center" style="border-color:var(--gold)"><div class="pill gold">📟 TRADE DEADLINE · SEASON ${G.year}</div>
      <h2 style="margin:8px 0;font-size:20px">GM ${o.gmName} wants to ${buying?'<span style="color:var(--green)">BUY</span>':'<span style="color:#ff8a6b">SELL</span>'}</h2>
      <p class="sub">The club projects to about <b>${m.proj} wins</b>. ${buying?'You\'re in the hunt — your GM wants to go for it:':'The season\'s slipping away — your GM wants to cash in:'}</p>
      <p style="font-size:16px;font-weight:700;margin:10px 0">${m.desc.charAt(0).toUpperCase()+m.desc.slice(1)}.</p>
      <div class="row" style="gap:10px;justify-content:center;margin-top:8px">
        <button class="btn" style="border-color:#c0392b;color:#ff8a6b" onclick="resolveDeadline(false)">🚫 Veto — stand pat</button>
        <button class="btn primary" onclick="resolveDeadline(true)">✅ Approve the deal</button></div>
    </div>`);
}
function resolveDeadline(approve){
  const m=_dlMove;_dlMove=null;
  if(m){if(approve){try{m.fn();}catch(e){}toast('Deal approved');}else{try{if(m.undo)m.undo();}catch(e){}G.owner.gmMorale=clamp((G.owner.gmMorale||72)-2,0,100);toast('Stood pat');}}
  saveGame();ownerPlaySeason();
}
function ownerPlaySeason(){
  // reload-safety: if this season already simulated, jump ahead to the draft instead of re-simming
  if((G.history||[]).some(h=>h.year===G.year))return goPhase(3);
  G.ownerStage='season';G._gmVetoed=null;_dlMove=null;_dlMode=false;G.seasonStage=0;saveGame();
  doSeason();
}

// ---- granular pricing: every line item has 3 price points; some unlock when you build the matching upgrade ----
const PRICE_LABELS=['Value','Standard','Premium'];
const DEMAND_MULT=[1.15,1.0,0.85];      // value sells more, premium sells fewer (and cools fans)
const FILL_ADJ=[0.06,0,-0.08];          // ticket-price elasticity per section
const TICKET_SECTIONS=[
  {key:'general', name:'General', unlock:null,         share:0,    bias:0,    p:[24,34,48]},   // general fills the remaining seats
  {key:'outfield',name:'Outfield',unlock:null,         share:0.30, bias:0.04, p:[16,24,34]},
  {key:'club',    name:'Club',    unlock:'clubLevel',  share:0.07, bias:-0.10,p:[70,95,130]},
  {key:'elite',   name:'Elite',   unlock:'eliteSeats', share:0.03, bias:-0.16,p:[120,175,250]}];
const CONCESSION_ITEMS=[
  {key:'hotdog',   name:'Hot Dog',  unlock:null,             cap:0.40,p:[5,7,9]},
  {key:'pretzel',  name:'Pretzel',  unlock:null,             cap:0.18,p:[5,7,9]},
  {key:'soda',     name:'Soda',     unlock:null,             cap:0.46,p:[4,6,8]},
  {key:'beer',     name:'Beer',     unlock:null,             cap:0.34,p:[9,12,15]},
  {key:'burger',   name:'Burger',   unlock:'premConcessions',cap:0.22,p:[10,13,16]},
  {key:'pizza',    name:'Pizza',    unlock:'premConcessions',cap:0.20,p:[8,11,14]},
  {key:'margarita',name:'Margarita',unlock:'premConcessions',cap:0.14,p:[11,14,18]},
  {key:'cocktail', name:'Craft Cocktail',unlock:'cantina',     cap:0.12,p:[13,17,22]}];
const MERCH_ITEMS=[
  {key:'jersey',    name:'Jersey',    unlock:null,      cap:0.030,p:[90,120,160]},
  {key:'hat',       name:'Hat',       unlock:null,      cap:0.060,p:[24,32,42]},
  {key:'shirt',     name:'Shirt',     unlock:null,      cap:0.070,p:[26,35,46]},
  {key:'bobblehead',name:'Bobblehead',unlock:'fanZones',cap:0.030,p:[18,25,34]},
  {key:'hoodie',    name:'Hoodie',    unlock:'fanZones',cap:0.025,p:[50,65,85]}];
function ownerUnlocked(u){if(!u||!G.owner)return !u;return (G.owner.ownedUpgrades||[]).includes(u)||(G.owner.ownedAmenities||[]).includes(u);}
function ownerPrices(){const o=G.owner;o.prices=o.prices||{tickets:{},conc:{},merch:{}};o.prices.tickets=o.prices.tickets||{};o.prices.conc=o.prices.conc||{};o.prices.merch=o.prices.merch||{};return o.prices;}
function priceIdx(cat,key){const v=ownerPrices()[cat][key];return v==null?1:clamp(v,0,2);}   // default Standard
function setPrice(cat,key,idx){ownerPrices()[cat][key]=clamp(idx,0,2);saveGame();ownerOffice();}
function ownerSeatCounts(){const cap=G.owner.capacity||40000;
  const outfield=Math.round(cap*0.30);
  const club=ownerUnlocked('clubLevel')?Math.round(cap*0.07):0;
  const elite=ownerUnlocked('eliteSeats')?Math.round(cap*0.03):0;
  return {general:Math.max(0,cap-outfield-club-elite),outfield,club,elite};}
// how "premium" your overall pricing is, −1 (all value) .. +1 (all premium) — drives the fan-happiness drift
function ownerPriceAggression(){let sum=0,n=0;
  const add=(cat,arr)=>arr.forEach(it=>{if(ownerUnlocked(it.unlock)){sum+=priceIdx(cat,it.key)-1;n++;}});
  add('tickets',TICKET_SECTIONS);add('conc',CONCESSION_ITEMS);add('merch',MERCH_ITEMS);
  return n?sum/n:0;}
function ownerTickets(){
  const o=G.owner,seats=ownerSeatCounts(),f=fanVal();
  const draw=0.40+f/100*0.42+clamp((G.lastWins||75)-74,-26,42)*0.0055;
  let rev=0,att=0;
  TICKET_SECTIONS.forEach(s=>{if(!ownerUnlocked(s.unlock))return;
    const n=seats[s.key];if(!n)return;
    const idx=priceIdx('tickets',s.key);
    const fill=clamp(draw+FILL_ADJ[idx]+s.bias,0.12,0.99);
    const sold=n*fill;att+=sold;rev+=sold*s.p[idx]*81/1e6;});
  rev*=(o.gateMult||1);   // dynamic pricing lifts gate revenue without thinning the crowd
  return {rev:Math.round(rev*10)/10,att:Math.round(att)};
}
function ownerAttendance(){return ownerTickets().att;}
function ownerPerFan(cat,items){let s=0;items.forEach(it=>{if(!ownerUnlocked(it.unlock))return;const idx=priceIdx(cat,it.key);s+=it.cap*it.p[idx]*DEMAND_MULT[idx];});return s;}
function ownerRevenue(){
  const o=G.owner;const tk=ownerTickets(),att=tk.att,games=81;
  const gate=tk.rev;
  const conc=Math.round(att*ownerPerFan('conc',CONCESSION_ITEMS)*games/1e6*10)/10;
  const merch=Math.round((att*ownerPerFan('merch',MERCH_ITEMS)*games/1e6*(0.55+fanVal()/180)+(G.champions||0)*2.5)*(o.marketMult||1)*(o.merchMult||1)*10)/10;
  const premium=Math.round((o.revWeight||1)*22*(o.marketMult||1)*(0.6+(att/(o.capacity||40000))*0.6)*10)/10;
  const media=Math.round((55+(G.champions||0)*6)*(o.marketMult||1)*10)/10;
  const sponsor=Math.round(((o.sponsors||[]).reduce((s,d)=>s+d.rev,0))*10)/10;
  const total=Math.round((gate+conc+merch+premium+media+sponsor)*10)/10;
  return {gate,conc,merch,premium,media,sponsor,total,att};
}
function ownerStaffSalary(){const o=G.owner;return (GM_TIERS[o.gmTier]?GM_TIERS[o.gmTier].cost:0)+gmArchePremium()+(ANALYTICS_TIERS[o.analyticsTier]?ANALYTICS_TIERS[o.analyticsTier].cost:0)+(SCOUT_TIERS[o.scoutTier]?SCOUT_TIERS[o.scoutTier].cost:0)+(COACH_TIERS[o.coachTier]?COACH_TIERS[o.coachTier].cost:0);}
function ownerExpenses(){
  const o=G.owner;
  const payrollExp=payroll(G.roster);
  const staff=ownerStaffSalary();
  const ops=Math.round((o.capacity||40000)/1000*0.7*(1-(o.opsCut||0))*10)/10;   // stadium operations (solar retrofit lowers it)
  const lux=Math.round(Math.max(0,payrollExp-300)*0.6*10)/10;          // a financial luxury-tax bite on big payrolls
  const total=Math.round((payrollExp+staff+ops+lux)*10)/10;
  return {payroll:payrollExp,staff,ops,lux,total};
}
function ownerValuation(rev){
  const o=G.owner;const f=fanVal();
  const mult=clamp(7+(G.champions||0)*0.4+(f-50)/30+((o.marketMult||1)-1)*1.6,6,11);
  return Math.max(300,Math.round(rev.total*mult));
}
function ownerNetWorth(){return (G.owner.clubValue||0)+(G.owner.cashReserve||0);}
function ownerNetProfit(){return ownerNetWorth()-OWNER_BUDGET;}   // you committed the full $4B
// settle the books for the season: revenue − expenses → cash, then re-value the franchise
function ownerSeasonFinance(){
  if(!G.owner||G._ownValYear===G.year)return;
  G._ownValYear=G.year;
  const o=G.owner;const f=fanVal();
  // fan happiness drifts toward how the team played and how fair the prices feel
  const winPull=clamp(((G.lastWins||75)-78)*0.5,-10,12);
  fanChange(clamp(Math.round(winPull-ownerPriceAggression()*6+((_res&&_res.wonWS)?8:(_res&&_res.madePO)?4:0)),-14,16),"Season's results & ballpark experience");
  const rev=ownerRevenue(),exp=ownerExpenses();
  const net=Math.round((rev.total-exp.total)*10)/10;
  o.cashReserve=Math.round(((o.cashReserve||0)+net)*10)/10;
  const newVal=ownerValuation(rev);
  o._lastDelta=newVal-(o.clubValue||newVal);
  o.clubValue=newVal;
  o._lastPL={rev,exp,net};
  // grade the GM against the mandate he was given
  const bar=MANDATES[o.mandate||'contend'].bar,wins=G.lastWins||75;
  let g;
  if((o.mandate||'contend')==='rebuild'){const farmQ=G.farm.filter(p=>p.pot>=85).length;g=farmQ>=3?'A':farmQ>=1?'B':'C';}
  else{g=(_res&&_res.wonWS)?'A+':wins>=bar?'A':wins>=bar-6?'B':wins>=bar-14?'C':'D';}
  o._gmGrade=g;o.gmMorale=clamp((o.gmMorale||72)+(g[0]==='A'?5:g==='B'?2:g==='D'?-8:-2),0,100);
  (o.gmGradeLog=o.gmGradeLog||[]).push({year:G.year,grade:g,wins});
  o.history=(o.history||[]);o.history.push({year:G.year,value:newVal,cash:o.cashReserve,net,wins:G.lastWins||0,att:rev.att});
  o._feedbackYear=null;   // you can praise/pressure the GM again next winter
  saveGame();
}
function ownerResultPanel(){
  const o=G.owner,pl=o._lastPL||{rev:ownerRevenue(),exp:ownerExpenses(),net:0},profit=ownerNetProfit(),d=o._lastDelta||0;
  const row=(k,v,c)=>`<div class="row" style="justify-content:space-between;padding:2px 0"><span class="small muted">${k}</span><span class="small" style="font-weight:700;color:${c||'var(--ink)'}">${v}</span></div>`;
  return `<div class="panel" style="border-color:var(--gold)">
    <div class="row" style="align-items:center;justify-content:space-between;gap:8px"><h3 style="margin:0">💼 Front-office report</h3>
      <button class="btn sm" onclick="ownerSellPrompt()">💰 Sell the club</button></div>
    <div class="grid4" style="margin-top:8px">
      <div class="kpi"><div class="big" style="font-size:17px">${fmtB(o.clubValue)}</div><div class="lbl">Club value ${d>=0?'<span style="color:var(--green)">▲'+fmtB(Math.abs(d))+'</span>':'<span style="color:var(--red)">▼'+fmtB(Math.abs(d))+'</span>'}</div></div>
      <div class="kpi"><div class="big" style="font-size:17px;color:${(pl.net||0)>=0?'var(--green)':'var(--red)'}">${(pl.net||0)>=0?'+':''}$${Math.abs(pl.net||0)}M</div><div class="lbl">Net income</div></div>
      <div class="kpi"><div class="big" style="font-size:17px;color:${(o.cashReserve||0)>=0?'var(--ink)':'var(--red)'}">${fmtB(o.cashReserve||0)}</div><div class="lbl">Cash reserve</div></div>
      <div class="kpi"><div class="big" style="font-size:17px;color:${profit>=0?'var(--green)':'var(--red)'}">${profit>=0?'+':''}${fmtB(Math.abs(profit))}</div><div class="lbl">Total profit</div></div>
    </div>
    <details style="margin-top:8px"><summary class="small" style="cursor:pointer;font-weight:700">📊 Profit &amp; loss · ${(pl.rev.att||0).toLocaleString()} fans/game</summary>
      <div class="grid2" style="gap:14px;margin-top:6px">
        <div>${row('🎟️ Gate','$'+pl.rev.gate+'M')}${row('🍔 Concessions','$'+pl.rev.conc+'M')}${row('🧢 Merchandise','$'+(pl.rev.merch||0)+'M')}${row('💎 Premium seating','$'+pl.rev.premium+'M')}${row('📺 Media','$'+pl.rev.media+'M')}${row('🤝 Sponsorships','$'+pl.rev.sponsor+'M')}${row('Revenue','$'+pl.rev.total+'M','var(--green)')}</div>
        <div>${row('🧢 Player payroll','$'+pl.exp.payroll+'M')}${row('👔 Front-office staff','$'+pl.exp.staff+'M')}${row('🏟️ Stadium ops','$'+pl.exp.ops+'M')}${row('💸 Luxury tax','$'+pl.exp.lux+'M')}${row('Expenses','$'+pl.exp.total+'M','var(--red)')}</div>
      </div></details>
    ${o._gmGrade?`<p class="small" style="margin-top:8px">🧠 GM ${o.gmName} graded <b style="color:${o._gmGrade[0]==='A'?'var(--green)':o._gmGrade==='D'?'var(--red)':'var(--gold)'}">${o._gmGrade}</b> on your ${MANDATES[o.mandate].name} mandate.</p>`:''}
    <p class="small muted" style="margin-top:4px">${G.year>=o.lifespanYears?'This is your 50th and final season — sell now or pass the club to your heirs.':'Sell whenever you like to bank the profit, or keep building the dynasty.'}</p>
  </div>`;
}
function ownerSellPrompt(){
  const o=G.owner,profit=ownerNetProfit();
  if(typeof confirm==="function"&&!confirm(`Sell ${G.teamName}?\n\nFranchise value: ${fmtB(o.clubValue)}\nCash on hand: ${fmtB(o.cashReserve||0)}\nYou take home: ${fmtB(ownerNetWorth())}\n\nYou committed ${fmtB(OWNER_BUDGET)} to start.\nTotal profit: ${profit>=0?'+':''}${fmtB(profit)}\n\nThis ends the run.`))return;
  G.owner.sold=true;G.yearsServed=G.year;saveGame();screenOwnerEnd(false);
}
function screenOwnerEnd(heirs){
  const o=G.owner,profit=ownerNetProfit();
  render(`<div class="hero"><div class="pill gold" style="margin-bottom:10px">💼 ${heirs?'A LEGACY PASSED ON':'CLUB SOLD'}</div>
    <h1>${profit>=0?'You built a fortune':'A costly love affair'}</h1></div>
    <div class="panel center">
      <div class="grid4" style="margin-top:4px">
        <div class="kpi"><div class="big" style="font-size:17px">${fmtB(o.clubValue)}</div><div class="lbl">Franchise value</div></div>
        <div class="kpi"><div class="big" style="font-size:17px">${fmtB(o.cashReserve||0)}</div><div class="lbl">Cash on hand</div></div>
        <div class="kpi"><div class="big" style="font-size:17px;color:${profit>=0?'var(--green)':'var(--red)'}">${profit>=0?'+':''}${fmtB(Math.abs(profit))}</div><div class="lbl">${heirs?'Legacy profit':'Net profit'}</div></div>
        <div class="kpi"><div class="big" style="font-size:17px">${G.champions||0}🏆</div><div class="lbl">Titles · ${G.year} yrs</div></div>
      </div>
      <p class="sub" style="margin-top:10px">${heirs?`After 50 years, you pass ${G.teamName} — worth ${fmtB(ownerNetWorth())} all-in — to your heirs. The dynasty lives on.`:`You sold ${G.teamName} for ${fmtB(ownerNetWorth())} all-in, having committed ${fmtB(OWNER_BUDGET)} to build it.`}</p>
    </div>
    ${xpEndNotice()}
    <div class="panel center">
      <h3 style="margin-top:0">🏆 Post to the Owner leaderboard</h3>
      <p class="sub" style="margin:2px 0 8px">Stake your claim — the board ranks empires by <b>final franchise value</b>, with championships alongside.</p>
      <input id="lbname" maxlength="12" placeholder="Your name" value="${(PROFILE&&PROFILE.lbName)||''}" style="text-align:center;max-width:220px"/>
      <div class="center" style="margin-top:8px"><button class="btn primary" onclick="submitOwner(${heirs?'true':'false'})">Submit ${fmtB(ownerNetWorth())} ▶</button></div>
    </div>
    <div class="center" style="margin:10px 0"><button class="btn ghost" onclick="screenLeaderboard(true,'owner')">🏆 View leaderboard</button> <button class="btn ghost" onclick="goHome()">🏠 Home</button></div>`);
}
function celebrateWS(){
  sfx('win');hap([40,60,120]);
  const old=document.getElementById('wscele');if(old)old.remove();
  const ov=document.createElement('div');ov.id='wscele';
  const cols=['#bdee3c','#e6c84e','#9bd84a','#ffffff','#e6b24a','#9fb0c8'];
  let conf='';
  for(let i=0;i<96;i++){const l=Math.random()*100,d=2.4+Math.random()*2.8,delay=-Math.random()*4.5,c=cols[i%cols.length],w=6+Math.random()*7;
    conf+=`<i class="burst" style="left:${l}vw;width:${w.toFixed(1)}px;height:${(w*1.5).toFixed(1)}px;background:${c};animation:confFall ${d.toFixed(2)}s linear ${delay.toFixed(2)}s infinite"></i>`;}
  const rings=(G&&G.champions)?G.champions:1;
  ov.innerHTML=`${conf}<div class="wcard"><div class="ring"></div><div class="wstrophy">🏆</div>
    <div class="wstitle">World Series Champions</div>
    <div class="wssub">${((G&&G.teamName)||'Your club').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))} · Season ${(G&&G.year)||''}</div>
    ${rings>1?`<div class="wsrings">${'🏆'.repeat(Math.min(rings,8))} ${rings} TITLES</div>`:''}
    <button class="btn primary wsclose" style="margin-top:18px" onclick="document.getElementById('wscele').remove()">Raise the banner ▸</button></div>`;
  document.body.appendChild(ov);
}
function showResult(){
  if(G.owner)ownerSeasonFinance();
  const r=_res,me=r.me,last=G.year>=6;
  if(r.wonWS&&G._wsCelebYear!==G.year){G._wsCelebYear=G.year;if(typeof setTimeout==="function")setTimeout(celebrateWS,260);}   // confetti drop once per title
  const verdict=r.wonWS?'🏆 WORLD SERIES CHAMPIONS!!!':r.madePO?'🎉 Made the playoffs!':
    me.wins<=70?'📉 Rough year — but hello, top pick.':'Season complete.';
  const myDiv=G.standings.filter(e=>e.league===me.league&&e.div===me.div).sort((a,b)=>b.wins-a.wins);
  const stand=myDiv.map(e=>`<tr style="${e.me?'background:rgba(245,196,81,.10)':''}">
     <td class="num">${e.divRank}</td><td>${e.me?'<b>'+e.name+'</b> ⬅':e.name}</td>
     <td class="num">${e.wins}</td><td class="num">${e.losses}</td>
     <td>${e.playoff?`<span class="pill green">${e.divRank===1?'DIV':'WC'}</span>`:''}${r.champ&&r.champ.name===e.name?' <span class="pill gold">WS</span>':''}</td></tr>`).join("");
  const lgSeeds=G.standings.filter(e=>e.league===me.league&&e.playoff).sort((a,b)=>a.lgSeed-b.lgSeed)
     .map(e=>`<span class="small">${e.lgSeed}. ${e.me?'<b style="color:var(--gold)">'+e.name+'</b>':e.name}</span>`).join(" &nbsp;·&nbsp; ");
  render(`${header()}${stepbar(2)}
   <div class="panel center"><h2 style="${r.wonWS?'color:var(--gold)':''}">${verdict}</h2>
     <div class="grid3" style="margin-top:8px">
       <div class="kpi"><div class="big">${me.wins}-${me.losses}</div><div class="lbl">Record</div></div>
       <div class="kpi"><div class="big">#${me.divRank}</div><div class="lbl">${me.div} Div /5</div></div>
       <div class="kpi"><div class="big">#${r.mySlot}</div><div class="lbl">Next Draft Pick /30</div></div></div>
     ${r.tax>0?`<p class="small" style="color:var(--red);margin-top:8px">💸 Luxury tax: payroll over $300M cost you ${r.tax} win${r.tax>1?'s':''} this season.</p>`:''}
     ${r.injured.length?`<div class="small" style="margin-top:8px;text-align:left;max-width:560px;margin-left:auto;margin-right:auto">
        🩹 <b>Injuries</b>${r.injWinsLost>0?` — cost you about <b style="color:var(--red)">${r.injWinsLost} win${r.injWinsLost>1?'s':''}</b> (healthy projection was ${r.healthyProj})`:' (your depth absorbed them)'}:
        <div style="margin-top:3px">${r.injured.sort((a,b)=>b.inj-a.inj).map(p=>`<span class="pill ${p.injType==='long'?'red':''}" style="margin:2px">${p.pos} ${p.name} — ${p.injType==='long'?'long-term':'short-term'} (~${p.inj} g)</span>`).join("")}</div></div>`:''}</div>
   ${G.owner?ownerResultPanel():G.mode==="survivor"?survivorResultPanel():""}
   ${awardsPanel(_res.awards)}
   ${reportCardPanel()}
   <div class="panel"><h3>${leagueNameOf(me.league)} — ${me.div} Division</h3>
     <div class="scroll"><table><thead><tr><th class="num">#</th><th>Team</th><th class="num">W</th><th class="num">L</th><th></th></tr></thead><tbody>${stand}</tbody></table></div>
     <div style="margin-top:8px"><span class="small muted">${leagueNameOf(me.league)} playoff seeds:</span><br>${lgSeeds}</div></div>
   <div class="center">${
     G.owner
       ? (G.year>=G.owner.lifespanYears?`<button class="btn primary" onclick="(function(){G.yearsServed=G.year;screenOwnerEnd(true);})()">Pass the club to your heirs →</button>`
          : `<button class="btn primary" onclick="goPhase(3)">To the Draft →</button>`)
       : G.mode==="survivor"
       ? (G.fired?`<button class="btn primary" onclick="screenFired()">Clean out your office →</button>`
          : G.year>=SURV_CAP?`<button class="btn primary" onclick="screenRetire()">Ride off into the sunset →</button>`
          : `<button class="btn primary" onclick="goPhase(3)">To the Draft →</button>`)
       : (last?`<button class="btn primary" onclick="endGame()">See your 6-year legacy →</button>`
          : `<button class="btn primary" onclick="goPhase(3)">To the Draft →</button>`)
   }</div>`);
}

