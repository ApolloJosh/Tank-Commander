/* ===========================================================
   OWNER MODE — buy a club, build the ballpark, hire the front office,
   then win, grow the franchise's value, and sell for the biggest profit.
   (Phase 1: the full buy-in flow + handoff into the endless season engine.
    Finances, GM-veto, and the sell screen layer in next.)
   ============================================================ */
const OWNER_BUDGET=4000;   // $4.0 Billion, tracked in $M
const fmtB=m=>{m=Math.round((m||0)*100)/100;
  if(Math.abs(m)>=1000)return '$'+(Math.round((m/1000)*100)/100)+'B';
  return '$'+(Math.round(m*100)/100)+'M';};   // always ≤2 decimals so the box never overflows
// 5 clubs across the spectrum — cheap & run-down (tier 0) to premier (tier 4)
const OWNER_TEAMS=[
  {name:"Riverside Rustbelters",price:1500,tier:0,market:"Small",mult:0.78,fan:30,farm:-1,rosterAdj:-7,
   desc:"A fire-sale price on a gutted club. The farm's been stripped for parts, attendance is dead, and talk radio wants blood. Cheap to buy — brutal to fix. The biggest upside if you can turn it around."},
  {name:"Harbor City Tide",price:1850,tier:1,market:"Mid",mult:0.95,fan:44,farm:0,rosterAdj:-3,
   desc:"A middling franchise drifting in mediocrity. A thin-but-not-barren system and a fan base that's gone quiet. Affordable, with room to grow."},
  {name:"Midland Aviators",price:2150,tier:2,market:"Mid",mult:1.12,fan:57,farm:1,rosterAdj:0,
   desc:"A balanced, well-run club in a solid market. Decent roster, respectable farm, fans who'll show up if you give them a reason. The safe buy."},
  {name:"Capital Sentinels",price:2400,tier:3,market:"Large",mult:1.28,fan:69,farm:2,rosterAdj:3,
   desc:"A proud big-market club with a strong roster and a loaded-ish system. Fans are engaged and expectations are high. Pricey, but you're buying a head start."},
  {name:"Empire Monarchs",price:2600,tier:4,market:"Huge",mult:1.5,fan:82,farm:3,rosterAdj:6,
   desc:"The crown jewel. Huge market, stacked roster, elite farm, adoring sellout crowds. Leaves little for the ballpark and staff — and the fans expect titles now."}];
// 5 base-stadium blueprints — pricier parks seat more and draw better
const STADIUM_BASES=[
  {id:"refit",name:"Sandlot Refit",cost:400,cap:34000,fan:0,rev:0.8,desc:"Renovate the existing yard. Cheapest path — modest capacity and amenities, but it keeps your powder dry for the roster."},
  {id:"heritage",name:"Heritage Field",cost:620,cap:38000,fan:3,rev:0.95,desc:"A classic brick-and-steel ballpark with old-school charm. Solid capacity, fan-friendly bones."},
  {id:"skyline",name:"Skyline Park",cost:820,cap:42000,fan:6,rev:1.1,desc:"A modern downtown park with skyline views and strong revenue potential."},
  {id:"cathedral",name:"Grand Cathedral",cost:1040,cap:46000,fan:9,rev:1.28,desc:"A showcase ballpark built to host All-Star Games. Big capacity, premium feel."},
  {id:"colosseum",name:"The Colosseum",cost:1240,cap:52000,fan:12,rev:1.5,desc:"A jaw-dropping mega-park. Top capacity and revenue ceiling in the league — if you can afford it after the team."}];
// optional ballpark upgrades — fan = happiness pts, rev = revenue weight, cap = added seats
const STADIUM_UPGRADES=[
  {id:"restrooms",name:"Modern restrooms",cost:35,fan:4,rev:0.2,desc:"No more 6th-inning lines. A small thing fans notice every game."},
  {id:"comfortSeats",name:"Wider, padded general seating",cost:80,fan:6,rev:0.4,cap:-1000,desc:"More comfortable seats (slightly fewer of them) — the bread-and-butter fan experience."},
  {id:"fanZones",name:"Fan activation zones",cost:95,fan:8,rev:0.6,desc:"Interactive plazas, games, photo spots. Families linger and spend."},
  {id:"kidsZone",name:"Kids zone & playground",cost:50,fan:5,rev:0.3,desc:"Turns the ballpark into a family day out and grows the next generation of fans."},
  {id:"clubLevel",name:"Luxury club level",cost:170,fan:4,rev:1.4,cap:1500,desc:"Climate-controlled club seating and suites — a major premium revenue driver."},
  {id:"eliteSeats",name:"Elite Club seats (behind the plate)",cost:130,fan:3,rev:1.2,desc:"The best seats in the house, sold at the highest margins in baseball."},
  {id:"premConcessions",name:"Premium concessions & local food hall",cost:65,fan:5,rev:0.9,desc:"Craft beer, local vendors, shorter lines — fans eat it up, literally."},
  {id:"scoreboardBig",name:"Big HD scoreboard",cost:110,fan:6,rev:0.5,desc:"A crisp, large videoboard that makes the in-park experience pop."},
  {id:"roof",name:"Retractable roof",cost:210,fan:5,rev:0.7,desc:"Never lose a date to weather. Protects your gate and your schedule."}];
// team-side facilities — dev = player development, heal = injury reduction, happy = clubhouse morale, farm = prospect growth, coach = staff effectiveness
const FACILITY_OPTS=[
  {id:"clubhouse",name:"Players' clubhouse",cost:90,happy:1,dev:0.5,desc:"A first-class clubhouse keeps your stars happy and signing here."},
  {id:"medical",name:"Sports medicine & recovery center",cost:110,heal:1,dev:0.3,desc:"State-of-the-art training and recovery — fewer and shorter injuries."},
  {id:"batLab",name:"Hitting lab",cost:70,dev:0.7,desc:"Biomechanics and swing analytics that accelerate hitter development."},
  {id:"pitchLab",name:"Pitching lab",cost:70,dev:0.7,desc:"Pitch-design and velocity programs that develop arms faster."},
  {id:"academy",name:"Player development academy",cost:120,farm:1.2,desc:"A pipeline that turns raw prospects into big-leaguers. Supercharges the farm."},
  {id:"travel",name:"Team travel luxuries",cost:60,happy:0.8,desc:"Charter upgrades and road comfort — happier, fresher players."},
  {id:"coachOffices",name:"Coaches' offices & video suite",cost:50,coach:0.8,desc:"Gives your staff the tools to get the most out of the roster."}];
const GM_TIERS=[
  {tier:0,name:"Up-and-comer GM",cost:5,desc:"Cheap and hungry, but green. More misses, needs your oversight."},
  {tier:1,name:"Solid operator",cost:12,desc:"A steady, competent baseball mind. Few disasters."},
  {tier:2,name:"Proven executive",cost:22,desc:"A respected GM with a track record of smart moves."},
  {tier:3,name:"Star architect",cost:38,desc:"A league-best executive. Finds value, nails the draft, fleeces rivals."}];
// GM specializations — each adds a real edge to the sim, and a salary premium on top of the tier cost
const GM_ARCHES={
  generalist:{key:"generalist",name:"Generalist",icon:"🧠",premium:0,blurb:"No glaring weakness — a small edge across the board."},
  scout:{key:"scout",name:"Scouting savant",icon:"🔭",premium:5,blurb:"Sees ceilings others miss — your prospects develop faster in the minors."},
  dev:{key:"dev",name:"Player developer",icon:"📈",premium:7,blurb:"Gets the most out of everyone — your whole roster grows faster."},
  pitch:{key:"pitch",name:"Pitching guru",icon:"⚾",premium:6,blurb:"Builds arms — your pitchers develop noticeably faster."},
  trade:{key:"trade",name:"Trade shark",icon:"🦈",premium:9,blurb:"Fleeces rivals — bigger, better returns on every deal."},
  fa:{key:"fa",name:"Bargain hunter",icon:"💸",premium:6,blurb:"Works the market — signs free agents about 15% under value."}};
const GM_ARCHE_KEYS=Object.keys(GM_ARCHES);
function gmArche(){return (G.owner&&G.owner.gmArche)||"generalist";}
function gmArcheInfo(){return GM_ARCHES[gmArche()]||GM_ARCHES.generalist;}
function gmArchePremium(){const a=GM_ARCHES[gmArche()];return a?a.premium:0;}
function gmFaDiscount(){return gmArche()==="fa"?0.85:1;}                       // bargain hunter signs cheaper
function gmHasTradeEdge(){return gmArche()==="trade"||(G.owner&&G.owner.tradeEdge);}
function gmTradeHaulBonus(){return gmArche()==="trade"?1:0;}                   // an extra prospect on sell-offs
function gmDevBonus(p){                                                        // extra development from a specialist GM
  if(!G.owner)return 0;const a=gmArche();
  if(a==="dev")return 0.16;
  if(a==="scout"&&p&&p.loc==="farm")return 0.16;
  if(a==="pitch"&&p&&(p.pos==="SP"||p.pos==="RP"))return 0.18;
  if(a==="generalist")return 0.05;
  return 0;}
const ANALYTICS_TIERS=[
  {tier:0,name:"No analytics dept.",cost:0,desc:"Gut feel only. You're flying blind on value and projections."},
  {tier:1,name:"Basic analytics",cost:8,desc:"A small group covering the essentials."},
  {tier:2,name:"Advanced analytics",cost:22,desc:"A real R&D group — sharper draft and trade intel."},
  {tier:3,name:"Elite analytics",cost:46,desc:"Industry-leading quants. The best edge money can buy."}];
const SCOUT_TIERS=[
  {tier:0,name:"Shoestring scouting",cost:0,desc:"A skeleton crew. You'll miss hidden gems."},
  {tier:1,name:"Standard scouting",cost:7,desc:"League-average coverage of amateurs and pros."},
  {tier:2,name:"Aggressive scouting",cost:16,desc:"Boots on the ground everywhere — better draft and trade targets."},
  {tier:3,name:"Best-in-class scouting",cost:30,desc:"The deepest scouting network in baseball."}];
const COACH_TIERS=[
  {tier:0,name:"Journeyman skipper",cost:4,desc:"Fills the chair. Gets little extra out of the roster."},
  {tier:1,name:"Respected manager",cost:11,desc:"A good clubhouse presence who wins close games."},
  {tier:2,name:"Top-tier manager",cost:22,desc:"A proven winner who maximizes talent and October edge."},
  {tier:3,name:"Hall-of-Fame manager",cost:36,desc:"A legend in the dugout — the best in-game and player-dev boost available."}];

let _own=null;   // in-progress buy-in selections
function ownInit(){_own={teamIdx:null,baseIdx:null,upgrades:[],facilities:[],gm:null,analytics:null,scout:null,coach:null,parkFactor:0,dims:DEFAULT_DIMS.slice()};}
function ownSpent(){if(!_own)return 0;let s=0;
  if(_own.teamIdx!=null)s+=OWNER_TEAMS[_own.teamIdx].price;
  if(_own.baseIdx!=null)s+=STADIUM_BASES[_own.baseIdx].cost;
  _own.upgrades.forEach(id=>{const u=STADIUM_UPGRADES.find(x=>x.id===id);if(u)s+=u.cost;});
  _own.facilities.forEach(id=>{const f=FACILITY_OPTS.find(x=>x.id===id);if(f)s+=f.cost;});
  if(_own.gm!=null)s+=GM_TIERS[_own.gm].cost;
  if(_own.analytics!=null)s+=ANALYTICS_TIERS[_own.analytics].cost;
  if(_own.scout!=null)s+=SCOUT_TIERS[_own.scout].cost;
  if(_own.coach!=null)s+=COACH_TIERS[_own.coach].cost;
  return s;}
function ownLeft(){return OWNER_BUDGET-ownSpent();}
function ownBudgetBar(){const left=ownLeft(),pct=clamp(Math.round(left/OWNER_BUDGET*100),0,100);
  const col=left<200?'var(--red)':left<700?'var(--gold)':'var(--green)';
  return `<div class="panel" style="position:sticky;top:0;z-index:5;padding:10px 12px;border-color:${col}">
    <div class="row" style="align-items:center;justify-content:space-between"><span style="font-weight:800">💰 Budget remaining</span>
      <span style="font-weight:800;color:${col};font-size:18px">${fmtB(left)}</span></div>
    <div class="favtrack" style="height:8px;margin-top:6px"><div class="favbar" style="width:${pct}%;background:${col}"></div></div>
    <div class="small muted" style="margin-top:4px">Spent ${fmtB(ownSpent())} of ${fmtB(OWNER_BUDGET)} · whatever's left becomes your franchise's starting <b>cash reserve</b>.</div>
  </div>`;}
function ownStepBar(step){const steps=["Team","Ballpark","Upgrades","Facilities","Front office","Review"];
  return `<div class="row" style="gap:5px;margin:8px 0;flex-wrap:wrap">${steps.map((s,i)=>`<span class="pill ${i===step?'gold':''}" style="${i===step?'':'opacity:.5'};padding:2px 9px">${i+1}. ${s}</span>`).join("")}</div>`;}

function ownerStartSetup(){ownInit();
  render(`<div class="hero">
    <div class="pill gold" style="margin-bottom:10px">💼 OWNER MODE</div>
    <h1>BUY THE BALLCLUB</h1>
    <p class="sub" style="max-width:640px;margin:6px auto 0">You've got <b>${fmtB(OWNER_BUDGET)}</b> and a dream. Buy a Major League franchise, build and outfit the ballpark, staff your front office, then hand the baseball to your GM. Your job: <b>win titles, pack the house, grow the club's value</b>, and one day sell for the biggest profit you can — or pass a dynasty down to your heirs.</p></div>
   <div class="panel center">
     <p class="sub">The buy-in. Every dollar builds franchise value — but keep a cash reserve to operate.${infoDot('Spend too freely now and you will have nothing left to run the club once the season starts.')}</p>
     <button class="btn primary" style="font-size:16px;padding:13px 26px" onclick="ownerBuyTeam()">Start building → </button>
     <div style="margin-top:8px"><button class="btn ghost sm" onclick="goHome()">← Back</button></div>
   </div>`);}

function ownerBuyTeam(){
  const card=(t,i)=>{const sel=_own.teamIdx===i;const afford=t.price<=OWNER_BUDGET;
    const dots=n=>'●'.repeat(Math.max(0,n))+'○'.repeat(Math.max(0,5-Math.max(0,n)));
    return `<div class="panel2" style="border:2px solid ${sel?'var(--gold)':'var(--line)'};border-radius:11px;padding:13px;margin-bottom:10px;${afford?'':'opacity:.5'}">
      <div class="row" style="align-items:flex-start;justify-content:space-between;gap:10px">
        <div style="flex:1"><div style="font-weight:800;font-size:17px;color:var(--gold)">${t.name}</div>
          <div class="small muted">${t.market} market · Tier ${t.tier+1}/5</div></div>
        <div style="text-align:right"><div style="font-weight:800;font-size:19px">${fmtB(t.price)}</div><div class="small muted">purchase price</div></div>
      </div>
      <p class="small" style="margin:8px 0">${t.desc}</p>
      <div class="grid2" style="gap:6px">
        <div class="small">🧢 Roster: <b style="color:${t.rosterAdj>=3?'var(--green)':t.rosterAdj<=-3?'var(--red)':'var(--ink)'}">${t.rosterAdj>0?'+':''}${t.rosterAdj} OVR feel</b></div>
        <div class="small">🌱 Farm: <b>${dots(t.farm+2)}</b></div>
        <div class="small">📣 Fans: <b style="color:${fanColor(t.fan)}">${t.fan}/100</b></div>
        <div class="small">🎟️ Market: <b>${dots(Math.round((t.mult-0.7)/0.2))}</b></div>
      </div>
      <button class="btn ${sel?'primary':''} sm" style="margin-top:9px;width:100%" onclick="(function(){_own.teamIdx=${i};ownerBuyTeam();})()">${sel?'✓ Selected — change?':'Buy this club'}</button>
    </div>`;};
  render(`${ownBudgetBar()}${ownStepBar(0)}
    <div class="panel"><h3>🏟️ Pick a franchise to take over</h3>
      <p class="sub">Five clubs are on the market.${infoDot('Pay up for a winner with a happy fan base and a stocked system, or grab a fixer-upper cheap and pocket the savings for the ballpark and roster.')}</p></div>
    ${OWNER_TEAMS.map(card).join("")}
    <div class="row" style="justify-content:space-between;margin-top:6px">
      <button class="btn ghost" onclick="ownerStartSetup()">← Back</button>
      <button class="btn primary" ${_own.teamIdx==null?'disabled style="opacity:.5"':''} onclick="${_own.teamIdx==null?'':'ownerStadiumBase()'}">Next: build the ballpark →</button>
    </div>`);}

function ownerStadiumBase(){
  const card=(b,i)=>{const sel=_own.baseIdx===i;const afford=b.cost<=ownLeft()+( _own.baseIdx===i?b.cost:0);
    return `<div class="panel2" style="border:2px solid ${sel?'var(--gold)':'var(--line)'};border-radius:11px;padding:13px;margin-bottom:10px;${afford?'':'opacity:.5'}">
      <div class="row" style="align-items:flex-start;justify-content:space-between;gap:10px">
        <div style="flex:1"><div style="font-weight:800;font-size:17px;color:var(--gold)">${b.name}</div>
          <div class="small muted">Capacity ~${b.cap.toLocaleString()} · revenue ${'★'.repeat(Math.round(b.rev*3))}</div></div>
        <div style="text-align:right"><div style="font-weight:800;font-size:19px">${fmtB(b.cost)}</div></div>
      </div>
      <p class="small" style="margin:8px 0">${b.desc}</p>
      <button class="btn ${sel?'primary':''} sm" style="width:100%" ${afford?'':'disabled'} onclick="(function(){_own.baseIdx=${i};ownerStadiumBase();})()">${sel?'✓ Selected':'Build this ballpark'}</button>
    </div>`;};
  render(`${ownBudgetBar()}${ownStepBar(1)}
    <div class="panel"><h3>🏗️ Choose your base ballpark</h3>
      <p class="sub">Bigger parks seat more fans and earn more revenue.${infoDot('Every dollar here is one you cannot spend on the team. You will add premium upgrades next.')}</p></div>
    ${STADIUM_BASES.map(card).join("")}
    <div class="row" style="justify-content:space-between;margin-top:6px">
      <button class="btn ghost" onclick="ownerBuyTeam()">← Back</button>
      <button class="btn primary" ${_own.baseIdx==null?'disabled style="opacity:.5"':''} onclick="${_own.baseIdx==null?'':'ownerUpgrades()'}">Next: stadium upgrades →</button>
    </div>`);}

function ownerToggle(listKey,id,catalog,reRender){
  const list=_own[listKey];const at=list.indexOf(id);
  if(at>=0){list.splice(at,1);}
  else{const item=catalog.find(x=>x.id===id);if(item.cost>ownLeft()){toast("Not enough budget for that.");return;}list.push(id);}
  reRender();}
function ownChecklist(catalog,listKey,reRenderName){
  return catalog.map(it=>{const on=_own[listKey].includes(it.id);const afford=on||it.cost<=ownLeft();
    const tags=[];if(it.fan)tags.push(`📣 +${it.fan}`);if(it.rev)tags.push(`💵 ${'★'.repeat(Math.round(it.rev*2))||'·'}`);
    if(it.cap)tags.push(`🎟️ ${it.cap>0?'+':''}${it.cap}`);if(it.dev)tags.push(`📈 dev`);if(it.heal)tags.push(`🏥 health`);
    if(it.farm)tags.push(`🌱 farm`);if(it.happy)tags.push(`😊 morale`);if(it.coach)tags.push(`🎓 staff`);
    return `<div class="panel2" style="border:1.5px solid ${on?'var(--gold)':'var(--line)'};border-radius:10px;padding:11px;margin-bottom:8px;${afford?'':'opacity:.5'}">
      <div class="row" style="align-items:flex-start;justify-content:space-between;gap:10px">
        <div style="flex:1"><div style="font-weight:700">${on?'✓ ':''}${it.name}</div>
          <p class="small muted" style="margin:3px 0 5px">${it.desc}</p>
          <div class="small">${tags.join(' &nbsp; ')}</div></div>
        <div style="text-align:right;min-width:78px"><div style="font-weight:800">${fmtB(it.cost)}</div>
          <button class="btn ${on?'':'primary'} sm" style="margin-top:6px" ${afford?'':'disabled'} onclick="ownerToggle('${listKey}','${it.id}',${reRenderName==='ownerUpgrades'?'STADIUM_UPGRADES':'FACILITY_OPTS'},${reRenderName})">${on?'Remove':'Add'}</button></div>
      </div></div>`;}).join("");}

function ownerUpgrades(){
  render(`${ownBudgetBar()}${ownStepBar(2)}
    <div class="panel"><h3>✨ Premium ballpark upgrades</h3>
      <p class="sub">Add as many as you can afford. Upgrades drive <b>fan happiness</b> (attendance & loyalty) and <b>revenue</b> (your future profit). Skip them to save for the roster — your call.</p></div>
    ${ownChecklist(STADIUM_UPGRADES,'upgrades','ownerUpgrades')}
    <div class="row" style="justify-content:space-between;margin-top:6px">
      <button class="btn ghost" onclick="ownerStadiumBase()">← Back</button>
      <button class="btn primary" onclick="ownerFacilities()">Next: team facilities →</button>
    </div>`);}

function ownerFacilities(){
  render(`${ownBudgetBar()}${ownStepBar(3)}
    <div class="panel"><h3>🏋️ Team facilities</h3>
      <p class="sub">Invest in the baseball side: facilities that <b>develop players faster</b>, keep them <b>healthy and happy</b>, and grow your <b>farm system</b>. These compound over the years.</p></div>
    ${ownChecklist(FACILITY_OPTS,'facilities','ownerFacilities')}
    <div class="row" style="justify-content:space-between;margin-top:6px">
      <button class="btn ghost" onclick="ownerUpgrades()">← Back</button>
      <button class="btn primary" onclick="ownerFrontOffice()">Next: hire the front office →</button>
    </div>`);}

function ownTierPicker(label,tiers,key){
  return `<div class="panel"><h3>${label}</h3>
    ${tiers.map((t,i)=>{const sel=_own[key]===i;const afford=sel||t.cost<=ownLeft();
      return `<div class="panel2" style="border:1.5px solid ${sel?'var(--gold)':'var(--line)'};border-radius:10px;padding:10px;margin-bottom:7px;${afford?'':'opacity:.5'}">
        <div class="row" style="align-items:center;justify-content:space-between;gap:10px">
          <div style="flex:1"><div style="font-weight:700">${sel?'✓ ':''}${t.name} <span class="small muted">${t.cost?fmtB(t.cost):'free'}</span></div>
            <p class="small muted" style="margin:3px 0 0">${t.desc}</p></div>
          <button class="btn ${sel?'':'primary'} sm" ${afford?'':'disabled'} onclick="(function(){_own.${key}=${i};ownerFrontOffice();})()">${sel?'Chosen':'Hire'}</button>
        </div></div>`;}).join("")}</div>`;}
function ownerFrontOffice(){
  const ready=_own.gm!=null&&_own.analytics!=null&&_own.scout!=null&&_own.coach!=null;
  render(`${ownBudgetBar()}${ownStepBar(4)}
    <div class="panel center"><h3>🧠 Build your front office</h3>
      <p class="sub">Hire the people who run your baseball operation.${infoDot('A sharper GM and analytics group make smarter moves you can trust — and rarely need to veto.')}</p></div>
    ${ownTierPicker('General Manager',GM_TIERS,'gm')}
    ${ownTierPicker('Analytics department',ANALYTICS_TIERS,'analytics')}
    ${ownTierPicker('Scouting budget',SCOUT_TIERS,'scout')}
    ${ownTierPicker('Head coach',COACH_TIERS,'coach')}
    <div class="row" style="justify-content:space-between;margin-top:6px">
      <button class="btn ghost" onclick="ownerFacilities()">← Back</button>
      <button class="btn primary" ${ready?'':'disabled style="opacity:.5"'} onclick="${ready?'ownerReview()':''}">Review &amp; confirm →</button>
    </div>`);}

function ownerReview(){
  const t=OWNER_TEAMS[_own.teamIdx],b=STADIUM_BASES[_own.baseIdx];
  const ups=_own.upgrades.map(id=>STADIUM_UPGRADES.find(x=>x.id===id));
  const facs=_own.facilities.map(id=>FACILITY_OPTS.find(x=>x.id===id));
  const gm=GM_TIERS[_own.gm],an=ANALYTICS_TIERS[_own.analytics],sc=SCOUT_TIERS[_own.scout],co=COACH_TIERS[_own.coach];
  const line=(k,v)=>`<div class="row" style="justify-content:space-between;padding:3px 0"><span class="small">${k}</span><span class="small" style="font-weight:700">${v}</span></div>`;
  const der=ownerDerive();
  render(`${ownBudgetBar()}${ownStepBar(5)}
    <div class="panel"><h3>🏟️ Set your outfield dimensions</h3>
      ${fieldEditorHTML('setup')}
      <p class="small muted" style="text-align:center;margin:6px 0 0">Drag the 7 wall points to shape the park. Shallow walls favor hitters and offense; deep walls favor pitching. You can re-grade later in the Owner's Suite.</p></div>
    <div class="panel"><h3>📋 Your franchise</h3>
      ${line('🏟️ Club',`${t.name} — ${fmtB(t.price)}`)}
      ${line('🏗️ Ballpark',`${b.name} (~${b.cap.toLocaleString()}) — ${fmtB(b.cost)}`)}
      ${line('✨ Upgrades',ups.length?ups.map(u=>u.name).join(', '):'—')}
      ${line('🏋️ Facilities',facs.length?facs.map(f=>f.name).join(', '):'—')}
      ${line('🧠 GM',`${gm.name} — ${fmtB(gm.cost)}`)}
      ${line('📊 Analytics',`${an.name} — ${fmtB(an.cost)}`)}
      ${line('🔭 Scouting',`${sc.name} — ${fmtB(sc.cost)}`)}
      ${line('🎓 Head coach',`${co.name} — ${fmtB(co.cost)}`)}
    </div>
    <div class="panel"><h3>📈 Opening day outlook</h3>
      <div class="grid4">
        <div class="kpi"><div class="big" style="color:${fanColor(der.fan)}">${der.fan}</div><div class="lbl">Fan happiness</div></div>
        <div class="kpi"><div class="big">${fmtB(der.clubValue)}</div><div class="lbl">Est. club value</div></div>
        <div class="kpi"><div class="big" style="color:${ownLeft()<150?'var(--red)':'var(--ink)'}">${fmtB(ownLeft())}</div><div class="lbl">Cash reserve</div></div>
        <div class="kpi"><div class="big">${der.gmStars}</div><div class="lbl">Front office</div></div>
      </div>
      <p class="small muted" style="margin-top:8px">Your cash reserve carries into the franchise to cover payroll and operations (the money game arrives in the next update). Spend it all now and you'll start cash-strapped.</p>
    </div>
    <div class="center" style="margin-top:6px">
      <button class="btn primary" style="font-size:16px;padding:13px 28px" onclick="ownerConfirm()">✍️ Sign the papers &amp; take over →</button>
      <div style="margin-top:8px"><button class="btn ghost sm" onclick="ownerFrontOffice()">← Back</button></div>
    </div>`);}

// derive the franchise modifiers from the buy-in choices
function ownerDerive(){
  const t=OWNER_TEAMS[_own.teamIdx],b=STADIUM_BASES[_own.baseIdx];
  const ups=_own.upgrades.map(id=>STADIUM_UPGRADES.find(x=>x.id===id));
  const facs=_own.facilities.map(id=>FACILITY_OPTS.find(x=>x.id===id));
  const gm=GM_TIERS[_own.gm],an=ANALYTICS_TIERS[_own.analytics],sc=SCOUT_TIERS[_own.scout],co=COACH_TIERS[_own.coach];
  let fan=t.fan+b.fan+ups.reduce((s,u)=>s+(u.fan||0),0)+facs.reduce((s,f)=>s+(f.happy||0)*2,0);
  fan=clamp(Math.round(fan),5,100);
  const capacity=b.cap+ups.reduce((s,u)=>s+(u.cap||0),0);
  const revWeight=b.rev+ups.reduce((s,u)=>s+(u.rev||0),0);
  const revPerGame=Math.round(capacity/1000*(0.9+revWeight*0.18)*t.mult*10)/10;   // $M/game potential (next-pass finances)
  const devBonus=facs.reduce((s,f)=>s+(f.dev||0),0)+co.tier*0.4;
  const farmBonus=facs.reduce((s,f)=>s+(f.farm||0),0)+sc.tier*0.5;
  const coachBonus=co.tier+facs.reduce((s,f)=>s+(f.coach||0),0);
  const healBonus=facs.reduce((s,f)=>s+(f.heal||0),0);
  const spend=ownSpent();
  // initial valuation: what you paid + goodwill from a nice park, happy fans, and a sharp front office
  const clubValue=Math.round(t.price + b.cost*0.7 + ups.reduce((s,u)=>s+u.cost*0.6,0) + facs.reduce((s,f)=>s+f.cost*0.5,0) + fan*4 + (gm.tier+an.tier+co.tier)*25);
  const gmStars='★'.repeat(1+gm.tier)+'☆'.repeat(3-gm.tier);
  return {fan,capacity,revWeight,revPerGame,devBonus,farmBonus,coachBonus,healBonus,clubValue,spend,
    gmTier:gm.tier,analyticsTier:an.tier,scoutTier:sc.tier,coachTier:co.tier,gmStars,
    market:t.market,marketMult:t.mult,rosterAdj:t.rosterAdj,farmTier:t.farm};
}

function ownerConfirm(){
  const t=OWNER_TEAMS[_own.teamIdx];const der=ownerDerive();const cashReserve=ownLeft();
  newGame(t.name,'survivor');           // build a baseline endless franchise (reuses the full season engine)
  applyOwnerSetup(der,cashReserve);
  startOwnerYear();
}
// scale the inherited club to the tier you bought, then attach the owner layer
function applyOwnerSetup(der,cashReserve){
  // roster feel: nudge the starters' OVR toward the tier you paid for
  const adj=der.rosterAdj;
  if(adj!==0){G.roster.filter(p=>p.loc==="mlb").forEach(p=>{p.ovr=clamp(p.ovr+ri(Math.min(0,adj),Math.max(0,adj)),40,99);p.pot=Math.max(p.pot,p.ovr);});}
  // farm depth scales with the tier and your scouting/academy investment
  const extraFarm=Math.max(0,der.farmTier)+Math.round(der.farmBonus);
  for(let i=0;i<extraFarm;i++){const p=ficProspect();p.loc="farm";p.src="original";G.farm.push(p);}
  if(der.farmTier<0&&G.farm.length>1)G.farm.splice(0,1);   // run-down club: a thinner system
  G.fanFavor=der.fan;
  // steer the existing development engine with the owner's investments (scouting / development / coaching)
  const sPts=1+der.scoutTier+der.farmBonus, dPts=1+der.devBonus, cPts=1+der.coachBonus, tot=sPts+dPts+cPts;
  G.resources={scouting:sPts/tot,development:dPts/tot,coaching:cPts/tot};
  G.owner={team:G.teamName,market:der.market,marketMult:der.marketMult,
    capacity:der.capacity,revPerGame:der.revPerGame,revWeight:der.revWeight,
    fanStart:der.fan,gmTier:der.gmTier,analyticsTier:der.analyticsTier,scoutTier:der.scoutTier,coachTier:der.coachTier,
    devBonus:der.devBonus,farmBonus:der.farmBonus,coachBonus:der.coachBonus,healBonus:der.healBonus,
    clubValue:der.clubValue,startValue:der.clubValue,cashReserve:cashReserve,totalSpent:der.spend+0,
    boughtFor:OWNER_TEAMS[_own.teamIdx].price,founded:1,lifespanYears:50,
    // --- Phase 2: finances + the GM you steer ---
    baseCapacity:STADIUM_BASES[_own.baseIdx].cap,baseRev:STADIUM_BASES[_own.baseIdx].rev,
    ownedUpgrades:_own.upgrades.slice(),ownedFacilities:_own.facilities.slice(),ownedAmenities:[],
    dims:(_own.dims?_own.dims.slice():DEFAULT_DIMS.slice()),parkFactor:dimsToParkFactor(_own.dims||DEFAULT_DIMS),
    prices:{tickets:{},conc:{},merch:{}},sponsors:[],
    gmName:gmFirstName()+' '+gmLastName(),gmArche:'generalist',gmMorale:72,gmGradeLog:[],
    mandate:'contend',payrollBudget:null,directives:{protectProspects:false,splurge:false,getYounger:false,pitchingFirst:false},
    history:[]};
  // opening valuation from a real revenue estimate (keeps the number honest vs the season-end books)
  const rev0=ownerRevenue();G.owner.clubValue=ownerValuation(rev0);G.owner.startValue=G.owner.clubValue;
  G.survStage=1;G.stance='compete';G.agreedBar=null;
  saveGame();
}
function startOwnerYear(){
  if(G.draftOrderYear!==G.year)computeDraftOrder();
  G.survStage=1;G.stance='compete';G.agreedBar=null;
  G._ownerMsg=ownerSeasonMsg();
  saveGame();
  // a brief owner preseason note, then hand the baseball to the GM (build phase)
  render(`${ownerHeader()}
    <div class="panel center" style="border-color:var(--gold)">
      <div class="pill gold">💼 OWNER · SEASON ${G.year}</div>
      <h2 style="margin:6px 0">${G.year>=G.owner.lifespanYears?'Your final season at the helm':'A new season begins'}</h2>
      <p class="sub">${G._ownerMsg}</p>
      ${G.year>=G.owner.lifespanYears?`<p class="small" style="color:var(--gold)">You're 50 years in. After this season the club passes to your heirs — make it count, or sell now for the legacy profit.</p>`:''}
    </div>
    <div class="center"><button class="btn primary" style="font-size:16px;padding:12px 26px" onclick="ownerOffice()">Into the owner's office →</button></div>`);}
function ownerSeasonMsg(){
  const v=G.owner.clubValue,paid=G.owner.totalSpent+G.owner.boughtFor;
  const f=fanVal();
  if(G.year===1)return `You own a ballclub. The fans (${Math.round(f)}/100 happy) are watching your first moves closely. Win, fill the seats, and grow what you built.`;
  if(f<35)return `The fan base is restless — empty seats hurt the bottom line. A winner would change the mood fast.`;
  if(v>paid*1.3)return `The franchise has appreciated nicely since you bought in. Keep winning and the valuation keeps climbing.`;
  return `Another season to chase a title and build the brand. Your GM has a plan — keep an eye on it.`;
}
function ownerHeader(){const o=G.owner||{};const v=o.clubValue||0;
  return `${topBar(`<button class="btn ghost sm" onclick="openFranchise()">📜 Franchise</button>`)}
    <div style="margin-bottom:10px"><div class="fid">${G.teamName} <span class="pill gold" style="vertical-align:4px">💼 Owner</span></div>
      <span class="fmeta">${G.league||''} ${G.div||''} · Season ${G.year}${o.lifespanYears?' / '+o.lifespanYears:''} · Payroll $${payroll(G.roster)}M</span></div>
    <div class="grid4" style="margin-top:4px">
      <div class="kpi" style="padding:9px 8px"><div class="big" style="font-size:17px">${fmtB(v)}</div><div class="lbl">Club Value</div></div>
      <div class="kpi" style="padding:9px 8px"><div class="big" style="font-size:17px;color:${fanColor(fanVal())}">${Math.round(fanVal())}</div><div class="lbl">Fan Happiness</div></div>
      <div class="kpi" style="padding:9px 8px"><div class="big" style="font-size:17px">${fmtB(o.cashReserve||0)}</div><div class="lbl">Cash Reserve</div></div>
      <div class="kpi" style="padding:9px 8px"><div class="big" style="font-size:17px">${G.champions||0}🏆</div><div class="lbl">Titles</div></div>
    </div>`;}

/* ---------- TITLE ---------- */
const WAR_PUNS=["Saving Private Ryans","Apocalypse Mounders","Full Metal Jackets","The Hurt Lockers","Band of Batters","Inglourious Bashers","Enemy at the Plates","We Were Sluggers","Black Hawk Grounders","A Pitch Too Far","The Longest Inning","Hacksaw Swingers","Lone Sluggers","Midway Mashers","Fury Fastballs","Dunkirk Dingers","Platoon Splitters","Where Eagles Bunt","Glory Gloves","Pearl Harbor Hurlers","The Thin Red Line Drives","Das Bunt","Casualties of Curveball","Kelly's Closers","Tora Tora Tag-ups","Bridge Over the River Strikeout"];
const warPun=()=>pick(WAR_PUNS);
let _titleMode='career', _titleName=null;
function selectTitleMode(k){const el=document.getElementById('tname');if(el)_titleName=el.value;_titleMode=k;screenTitle();}
function rerollTitleName(){_titleName=warPun();const el=document.getElementById('tname');if(el)el.value=_titleName;}
const TITLE_MODES={
    career:{label:'6-Year Sprint',tag:'',hot:false,needName:true,cta:'Take the job ▸',
      blurb:'The classic run. You inherit a club that won it all four years ago — but the stars have aged and the farm’s gone bare. Tank for picks, develop talent, swing trades, and build a 100-win contender. Graded after six seasons.',
      go:"(function(){newGame(document.getElementById('tname').value.trim(),'career',false);goPhase(0);})()"},
    hard:{label:'Hard Mode',tag:'6-YR',hot:true,needName:true,cta:'Take the job ▸',
      blurb:'The 6-Year Sprint with the gloves off: a tougher league, real injuries to manage at extra in-season breaks, and stricter grading. It keeps its own leaderboard for the GMs who survive it.',
      go:"(function(){newGame(document.getElementById('tname').value.trim(),'career',true);goPhase(0);})()"},
    survivor:{label:'Career Mode',tag:'BETA',hot:false,needName:true,cta:'Take the job ▸',
      blurb:'Endless. Stay in the owner’s favor as long as you can — contend, manage the money, and ride the cycle of windows and rebuilds. Your score keeps climbing until the day you’re fired.',
      go:"(function(){newGame(document.getElementById('tname').value.trim(),'survivor');startSurvivorYear();})()"},
    owner:{label:'Owner Mode',tag:'ALPHA',hot:false,needName:false,cta:'Buy a team ▸',
      blurb:'Sit in the owner’s box. Spend $4B to buy a club and build a ballpark, hire your front office, then steer your GM, keep the fans happy, and grow the franchise’s value. Endless — sell for profit or build a 50-year dynasty.',
      go:"ownerStartSetup()"}
  };
function screenNewFranchise(k){
  _titleMode=k;
  const m=TITLE_MODES[k]||TITLE_MODES.career;
  if(_titleName==null)_titleName=warPun();
  render(`${topBar('')}
    <div class="panel center" style="border-color:var(--gold);max-width:600px;margin:18px auto">
      <div class="pill gold">${m.tag?m.label+' · '+m.tag:m.label}</div>
      <h2 class="disp" style="margin:12px 0 4px;font-size:22px">${m.label}</h2>
      <p class="sub" style="max-width:520px;margin:6px auto 0">${m.blurb}</p>
      ${m.needName?`<div class="tname-row" style="justify-content:center;margin:16px auto 0"><input id="tname" value="${_titleName.replace(/"/g,'&quot;')}" oninput="_titleName=this.value"/><button class="btn ghost sm" title="Random name" onclick="rerollTitleName()">🎲</button></div><div class="small muted" style="margin-top:5px">Name your franchise (or roll the dice).</div>`:''}
      <div class="center" style="margin-top:18px;display:flex;gap:8px;justify-content:center;flex-wrap:wrap"><button class="cta" onclick="${m.go}">${m.cta}</button>
        <button class="btn ghost" onclick="screenTitle()">← Back</button></div>
    </div>`);
  _atTitle=true;ensureNavBtns();
}
function screenTitle(){
  if(_titleName==null)_titleName=warPun();
  const MODES=TITLE_MODES;
  const m=MODES[_titleMode]||MODES.career;
  const navMi=k=>{const mm=MODES[k];return `<div class="tmi ${_titleMode===k?'on':''}" onclick="selectTitleMode('${k}')">${mm.label}${mm.tag?` <span class="tag ${mm.hot?'hot':''}">${mm.tag}</span>`:''}</div>`;};
  const cap=capUnlocked();
  const createMi=cap
    ?`<div class="tmi" onclick="screenCreatePlayer()">Create-A-Player${PROFILE.createdPlayer?'':' <span class="tag">NEW</span>'}</div>`
    :`<div class="tmi lk" onclick="toast('Finish one franchise to unlock Create-A-Player')">Create-A-Player 🔒</div>`;
  const accountMi=authEnabled()?`<div class="tmi" onclick="screenAccount()">${authState()?(authState().username||'Account'):'Log in / Sign up'}</div>`:'';
  const hasSave=!!localStorage.getItem(SAVE);
  const continueMi=hasSave?`<div class="tmi" onclick="(function(){if(loadGame()){if(G.mode==='survivor'&&G.survStage===0){startSurvivorYear();}else goPhase(G.phase||0);}else toast('No save');})()">↻ Continue last</div>`:'';
  // ---- Current Runs sidebar ----
  const runs=loadRuns();
  let activeId=null;try{activeId=JSON.parse(localStorage.getItem(SAVE)||'{}')._runId;}catch(e){}
  const runCard=r=>`<div class="trun ${r.id===activeId?'cur':''}">
      <div class="n">${(r.name||'Untitled').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}</div>
      <div class="s">${r.owner?'Owner Mode':r.mode==='survivor'?'Career Mode':'6-Year Sprint'} · ${r.mode==='survivor'||r.owner?'Season '+r.year:'Year '+r.year+'/6'}${r.fired?' · Fired':''}</div>
      <div class="row"><span class="v">${r.owner?fmtB(r.clubValue||0)+' value':r.mode==='survivor'?'Score '+(r.score||0):(r.champions||0)+'× 🏆'}</span><button class="rbtn" onclick="resumeRun('${r.id}')">Resume</button></div>
    </div>`;
  const runsHtml=runs.length?runs.slice(0,5).map(runCard).join(''):'<p class="small muted" style="margin:0">No franchises yet — start one from the left.</p>';
  const topR=`${authEnabled()?`<a onclick="screenAccount()">${authState()?(authState().username||'Account'):'Account'}</a>`:''}<a onclick="screenWelcome()">Guide</a><a onclick="showGameRules()">Rules</a><span class="ver">v9.8.2</span>`;
  render(`
   <div class="tdash">
     <div class="tdash-top"><img class="brandlogo" src="${LOGO_WIDE}" alt="Tank Commander"><div class="tdash-top-r">${topR}</div></div>
     <div class="tdash-grid">
       <nav class="tnav">
         <div class="tnav-lab">New Franchise</div>
         <div class="tmi" onclick="screenNewFranchise('career')">6-Year Sprint</div>
         <div class="tmi tsub" onclick="screenNewFranchise('hard')">↳ Hard Mode <span class="tag hot">6-YR</span></div>
         <div class="tmi" onclick="screenNewFranchise('survivor')">Career Mode <span class="tag">Beta</span></div>
         <div class="tmi" onclick="screenNewFranchise('owner')">Owner Mode <span class="tag">Alpha</span></div>
         <div class="tnav-lab">bWARfare</div>
         <div class="tmi" onclick="screenGauntlet()">Gauntlet <span class="tag">Campaign</span></div>
         <div class="tmi" onclick="screenRivals()">Rivals <span class="tag hot">PvP</span></div>
         <div class="tnav-lab">Profile</div>
         <div class="tmi" onclick="screenPlatoon()">Platoon <span class="tag hot">bWARfare</span></div>
         ${createMi}
         <div class="tmi" onclick="screenLeaderboard()">Leaderboard</div>
         ${accountMi}
         <div class="tnav-foot">
           ${continueMi}
           <div class="tmi" onclick="screenWelcome()">Guide &amp; What's New</div>
           <div class="tmi" onclick="showRestoreOnTitle()">Restore Backup</div>
         </div>
       </nav>
       <section class="thero">
         <img src="${LOGO_SQ}" alt="Baseball Tank Commander">
         <div class="tagrule"><span class="ln"></span><span class="tx">Baseball Simulator</span><span class="ln"></span></div>
         <span class="stamp" style="margin:0 0 10px">Field Issue · Spec TC-98</span>
         <div class="tpitch" style="max-width:470px;margin:0 auto;text-align:left">
           <div class="tpitch-row"><span class="ic">🏗️</span><div><b>Rebuild a broken franchise.</b><span class="small muted"> Tank for picks, draft stars, work the trade market, win it all in 6 seasons.</span></div></div>
           <div class="tpitch-row"><span class="ic">🃏</span><div><b>Collect the 500-card set.</b><span class="small muted"> Rip packs, chase HOF rainbows, and build your bWARfare deck.</span></div></div>
           <div class="tpitch-row"><span class="ic">⚔️</span><div><b>Battle real players' decks.</b><span class="small muted"> Climb the Gauntlet, then take your club into Rivals PvP.</span></div></div>
         </div>
         <div class="center" style="margin-top:14px">
           <button class="btn primary" style="font-size:15px;padding:12px 26px" onclick="screenNewFranchise('career')">▶ Play — 6-Year Sprint</button>
           <button class="btn ghost" onclick="screenGauntlet()">⚔️ Quick Battle</button>
         </div>
         <details class="tnote" style="max-width:470px;margin:16px auto 0;text-align:left">
           <summary class="small" style="cursor:pointer;color:var(--dim)">✉️ A note from the creator</summary>
           <div class="tblurb" style="margin-top:8px">
             <p style="margin:0 0 8px">Hi, welcome to my game! I built this game because I'm a baseball nerd that, like most of us baseball nerds, thinks I could do a better job running my favorite team than the current GM (mostly kidding here.. mostly). This is all a work in development. I'm testing, updating, and learning things every day. If you have any questions or feedback, please feel free to DM me on Twitter or IG, or leave a note here in game. I really want to make this the most fun little baseball simulation game I can make it.</p>
             <p style="margin:0 0 6px">Thanks for playing!</p>
             <p style="margin:0;color:var(--gold);font-weight:600">- @ApolloJosh1</p>
           </div>
         </details>
       </section>
       <aside class="tside">
         <div class="tside-lab"><span><span class="lk"></span>Current Runs</span><span class="num">${runs.length}</span></div>
         ${runsHtml}
         <div class="tside-lab">GM Profile</div>
         <div style="display:flex;align-items:center;gap:12px;background:var(--panel2);border:1px solid var(--line);border-radius:4px;padding:10px">
           <div style="flex-shrink:0">${gmLevelDial(104)}</div>
           <div style="min-width:0">
             <div class="disp" style="font-size:12px;color:var(--gold)">GM Level ${plLevel()}</div>
             <div class="small muted">${PROFILE.gamesPlayed||0} franchise${(PROFILE.gamesPlayed||0)===1?'':'s'} · ${PROFILE.xp||0} XP</div>
             <div class="small" style="color:var(--gold)">${plLevel()>=MAX_LEVEL?'★ MAX LEVEL':Math.max(0,xpForLevel(plLevel()+1)-(PROFILE.xp||0))+' XP to Lv '+(plLevel()+1)}</div>
             <div class="small" style="margin-top:3px"><span class="muted">Deck OVR</span> <b style="color:var(--gold)">${bwDeckRatingIds(PROFILE.bw.deck)||'—'}</b></div>
             <div class="small" style="margin-top:6px;line-height:1.6"><span style="color:var(--amber)">💎 ${bwState().coins}</span>${PROFILE.bw.packs.length?`<br><span title="Open packs" style="cursor:pointer;color:var(--gold)" onclick="screenPlatoon('packs')">🎁 ${PROFILE.bw.packs.length}</span>`:''}</div>
             <div id="bwDefBox"></div>
           </div>
         </div>
       </aside>
     </div>
     <div class="tdash-foot"><span>Profile: GM Level ${plLevel()} · ${PROFILE.gamesPlayed||0} franchises played</span><span>Build 9.8.2</span></div>
   </div>

   <p class="disclaimer">⚠️ <b>Disclaimer:</b> ${FICTIONAL_NAMES?'All players, teams, names, ratings, salaries, and outcomes in this game are entirely fictional and computer-generated. Any resemblance to real persons is coincidental. Not affiliated with or endorsed by MLB, the MLBPA, or any club.':'Unofficial fan-made game, not affiliated with or endorsed by MLB, the MLBPA, or any club. Player names are used for identification only; all teams are fictional and every rating, salary, and outcome is a game-generated estimate, not real data.'}</p>`);
  _atTitle=true;ensureNavBtns();
  try{bwLoadDefenses();}catch(e){}
}
function runsPanel(){
  if(!(authEnabled()&&authState()))return '';
  const runs=loadRuns();if(!runs.length)return '';
  const ago=t=>{const d=Date.now()-t,m=Math.floor(d/60000);if(m<1)return'just now';if(m<60)return m+'m ago';const h=Math.floor(m/60);if(h<24)return h+'h ago';return Math.floor(h/24)+'d ago';};
  let activeId=null;try{activeId=JSON.parse(localStorage.getItem(SAVE)||'{}')._runId;}catch(e){}
  const row=r=>`<div class="panel2" style="border:1px solid ${r.id===activeId?'var(--gold)':'var(--line)'};border-radius:4px;padding:10px;margin-bottom:7px;display:flex;align-items:center;gap:8px">
     <div style="flex:1;min-width:0">
       <div style="font-weight:700">${(r.name||'Untitled').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))} ${r.id===activeId?'<span class="pill gold" style="padding:0 5px;font-size:9px">CURRENT</span>':''}${r.fired?' <span class="pill red" style="padding:0 5px;font-size:9px">FIRED</span>':''}</div>
       <div class="small muted">${r.owner?'💼 Owner Mode':r.mode==='survivor'?'Career Mode':'6-Year Sprint'} · ${r.league||''} ${r.div||''} · ${r.mode==='survivor'?'Season '+r.year:'Year '+r.year+'/6'} · ${r.owner?(fmtB(r.clubValue||0)+' value'):r.mode==='survivor'?('score '+(r.score||0)):((r.champions||0)+'× 🏆')} · ${ago(r.updated)}</div>
     </div>
     <button class="btn sm primary" onclick="resumeRun('${r.id}')">Resume</button>
     <button class="btn sm ghost" title="Delete this run" onclick="(function(){if(confirm('Delete this run permanently? This cannot be undone.'))deleteRun('${r.id}');})()">✕</button>
   </div>`;
  return `<div class="panel"><h3>📁 Your Current Runs <span class="small muted">(${runs.length})</span></h3>
    <p class="sub" style="margin:2px 0 8px">Every franchise is saved separately — pick up any of them right where you left off.</p>
    ${runs.map(row).join("")}</div>`;
}

