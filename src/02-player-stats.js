/* ============================================================
   PLAYER STATS — derive realistic season lines + Statcast metrics from attributes.
   Seeded per (player, year) so a line is stable when recomputed.
   ============================================================ */
function _hash(s){let h=2166136261;s=String(s);for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;}
function srng(seed){let s=_hash(seed)||1;return()=>{s^=s<<13;s^=s>>>17;s^=s<<5;s>>>=0;return s/4294967296;};}
// skill-based metrics (no luck) used for the Savant percentile rankings
function hitterMetrics(p){const av=k=>attrVal(p,k);const power=av('power'),contact=av('contact'),eye=av('eye'),speed=av('speed'),defense=av('defense');
  const off=power*0.40+contact*0.35+eye*0.25;
  return {xwoba:clamp(0.250+(off-50)*0.0044,0.230,0.470),xba:clamp(0.232+(contact-50)*0.0028,0.205,0.330),
    xslg:clamp(0.360+(power-50)*0.0053,0.300,0.660),barrel:clamp((power-55)*0.30+(contact-50)*0.05,1,24),
    hardhit:clamp(30+(power-50)*0.46,18,62),exitvelo:clamp(86+(power-50)*0.12,84,95.5),
    kpct:clamp(29.5-(contact-50)*0.35,10,36),bbpct:clamp(4.5+(eye-50)*0.21,2,20),
    whiff:clamp(24-(contact-50)*0.26+(power-50)*0.05,8,40),chase:clamp(30-(eye-50)*0.23,16,42),
    sprint:clamp(26+(speed-50)*0.062,23,30.6),arm:clamp(40+(defense-50)*0.7,28,55),oaa:clamp((defense-50)*0.45,-18,22)};}
function pitcherMetrics(p){const av=k=>attrVal(p,k);const velo=av('velocity'),control=av('control'),spin=av('spin'),whiff=av('whiff');
  return {xera:clamp(4.8-(velo*0.3+control*0.35+whiff*0.35-50)*0.052,1.6,6.2),xwoba:clamp(0.345-(velo*0.3+control*0.3+whiff*0.4-50)*0.0035,0.230,0.420),
    kpct:clamp(15+(whiff-50)*0.42+(velo-50)*0.12,10,42),bbpct:clamp(9.5-(control-50)*0.13,3,15),
    whiffpct:clamp(20+(whiff-50)*0.40,10,40),chase:clamp(24+(control-50)*0.14+(whiff-50)*0.10,16,40),
    velomph:clamp(90.5+(velo-50)*0.165,87,102),spinrpm:clamp(2150+(spin-50)*8,1850,2700),
    hardhit:clamp(40-(whiff-50)*0.30-(control-50)*0.12,24,52),groundpct:clamp(43+(spin-50)*0.18,32,56)};}
// a full season line (counting + rate), seeded with luck
function genHitterLine(p,role,year){
  const R=srng((p.id||p.name)+"|"+year+"|h"),rn=(a,b)=>R()*(b-a)+a,av=k=>attrVal(p,k);
  const contact=av('contact'),power=av('power'),eye=av('eye'),speed=av('speed');
  const health=clamp(1-(p.inj||0)/162,0.18,1);
  let games=role==='bench'?Math.round(rn(40,95)*Math.max(health,0.6)):Math.round((150+rn(-7,5))*health);
  games=clamp(games,1,162);
  const pa=Math.max(1,Math.round(games*(role==='bench'?3.3:4.35)));
  const kRate=clamp(0.295-(contact-50)*0.0035+rn(-0.02,0.02),0.10,0.37);
  const bbRate=clamp(0.045+(eye-50)*0.0021+rn(-0.01,0.01),0.02,0.21);
  const hbp=Math.round(pa*0.008),bb=Math.round(pa*bbRate),so=Math.round(pa*kRate);
  const ab=Math.max(1,pa-bb-hbp);
  const hr=Math.round(pa*clamp((power-50)*0.00108+0.007+rn(-0.006,0.006),0.002,0.082));
  const babip=clamp(0.290+(contact-50)*0.0009+(speed-50)*0.0006+rn(-0.028,0.028),0.230,0.385);
  const bip=Math.max(0,ab-so-hr),bipHits=Math.round(bip*babip);
  const dbl=Math.round(bipHits*clamp(0.175+(power-50)*0.0011,0.10,0.32));
  const trp=Math.round(bipHits*clamp(0.014+(speed-50)*0.0009,0.002,0.05));
  const singles=Math.max(0,bipHits-dbl-trp),h=singles+dbl+trp+hr,tb=singles+2*dbl+3*trp+4*hr;
  const sb=Math.round(clamp((speed-55)*0.5,0,42)*(games/150)*rn(0.7,1.2));
  const rbi=Math.max(0,Math.round(hr*1.75+(h-hr)*0.33+12*health+rn(-6,6)));
  const r=Math.max(0,Math.round((h+bb)*0.30+hr*0.55+sb*0.25+rn(-5,5)));
  const woba=((0.69*bb)+(0.72*hbp)+(0.89*singles)+(1.27*dbl)+(1.62*trp)+(2.10*hr))/pa;
  return {type:'h',year,role,g:games,pa,ab,h,dbl,trp,hr,bb,so,sb,rbi,r,
    avg:+(h/ab).toFixed(3),obp:+((h+bb+hbp)/pa).toFixed(3),slg:+(tb/ab).toFixed(3),ops:+((h+bb+hbp)/pa+tb/ab).toFixed(3),woba:+woba.toFixed(3)};
}
function genPitcherLine(p,role,year){
  const R=srng((p.id||p.name)+"|"+year+"|p"),rn=(a,b)=>R()*(b-a)+a,av=k=>attrVal(p,k);
  const velo=av('velocity'),control=av('control'),spin=av('spin'),whiff=av('whiff');
  const sp=(role!=='RP'&&p.pos==='SP'); const health=clamp(1-(p.inj||0)/162,0.18,1);
  const gs=sp?Math.round((31+rn(-3,2))*health):0;
  const g=sp?gs:Math.round((62+rn(-8,8))*health);
  const ip=Math.max(1,sp?Math.round(gs*clamp(5.7+(control-50)*0.01,4.5,6.6)):Math.round(g*rn(0.9,1.2)));
  const k9=clamp(6.5+(whiff-50)*0.09+(velo-50)*0.04+rn(-0.6,0.6),4,14.5);
  const bb9=clamp(4.3-(control-50)*0.05+rn(-0.4,0.4),1.1,6.2);
  const hr9=clamp(1.3-(whiff-50)*0.006-(control-50)*0.004+rn(-0.2,0.2),0.4,2.3);
  const k=Math.round(ip/9*k9),bb=Math.round(ip/9*bb9),hr=Math.round(ip/9*hr9);
  const hits=Math.round(ip*clamp((9.6-k9*0.42-(control-50)*0.012)/9,0.62,1.18));
  const fip=clamp((13*hr+3*bb-2*k)/ip+3.15+rn(-0.35,0.35),1.6,6.8);
  const whip=+((bb+hits)/ip).toFixed(2);
  let w,l;
  if(sp){w=clamp(Math.round((4.6-fip)*2.4+9+rn(-2,2)),1,24);l=clamp(Math.round(gs*0.42-(w-9)*0.5+rn(-2,2)),1,18);}
  else{w=clamp(Math.round((4.6-fip)*1.0+3+rn(-2,2)),0,12);l=clamp(Math.round(4+rn(-2,3)),0,11);}
  const sv=(!sp&&av('velocity')>=70&&whiff>=70)?Math.round(clamp((whiff-60)*1.2,0,45)*health):0;
  return {type:'p',year,role:sp?'SP':'RP',g,gs,w,l,sv,ip,k,bb,hr,hits,
    era:+fip.toFixed(2),whip,k9:+k9.toFixed(1),bb9:+bb9.toFixed(1)};
}
// what role a player fills this season (drives playing time)
function statRole(p){
  if(isPit(p))return (p.pos==='RP')?'RP':'SP';
  if(p.loc==="mlb"&&typeof G!=="undefined"&&G){try{const a=buildActive(G.roster);
    const starter=[...LINEUP.map(s=>a.lineup[s]),...a.rotation,...a.pen].some(x=>x&&x.id===p.id);
    return starter?'starter':'bench';}catch(e){}}
  return 'starter';
}
function metricsOf(p){return isPit(p)?pitcherMetrics(p):hitterMetrics(p);}
/* ---- league percentile ranking (Savant-style: rank a skill metric vs everyone) ---- */
function leaguePopulation(){let a=[];try{a=[].concat(G.roster||[],G.farm||[],G.pool||[]);}catch(e){}return a;}
let _lgCache={},_lgCacheKey=null;
function leagueMetricArray(key,pit){
  const ck=((typeof G!=="undefined"&&G&&G.year)||0)+"|"+(pit?'p':'h');
  if(_lgCacheKey!==ck){_lgCache={};_lgCacheKey=ck;}
  if(_lgCache[key])return _lgCache[key];
  const pop=leaguePopulation().filter(p=>pit?isPit(p):isHit(p)).filter(p=>(p.ovr||0)>=58);
  const arr=pop.map(p=>(pit?pitcherMetrics(p):hitterMetrics(p))[key]).filter(v=>typeof v==="number");
  _lgCache[key]=arr;return arr;
}
function pctile(v,arr,lowerBetter){if(!arr||!arr.length)return 50;let below=0;for(const x of arr)if(x<v)below++;let pc=Math.round(below/arr.length*100);if(lowerBetter)pc=100-pc;return clamp(pc,1,99);}
function pctColor(p){let r,g,b;if(p<50){const t=p/50;r=Math.round(54+122*t);g=Math.round(97+79*t);b=Math.round(173+3*t);}else{const t=(p-50)/50;r=Math.round(176+34*t);g=Math.round(176-131*t);b=Math.round(176-103*t);}return `rgb(${r},${g},${b})`;}
const HIT_PCTS=[["xwOBA","xwoba",3,0],["xBA","xba",3,0],["xSLG","xslg",3,0],["Barrel %","barrel",1,0],["Hard-Hit %","hardhit",1,0],["Avg Exit Velo","exitvelo",1,0],["Chase %","chase",1,1],["Whiff %","whiff",1,1],["K %","kpct",1,1],["BB %","bbpct",1,0],["Sprint Speed","sprint",1,0]];
const PIT_PCTS=[["xERA","xera",2,1],["xwOBA","xwoba",3,1],["K %","kpct",1,0],["BB %","bbpct",1,1],["Whiff %","whiffpct",1,0],["Chase %","chase",1,0],["Fastball Velo","velomph",1,0],["Fastball Spin","spinrpm",0,0],["Hard-Hit %","hardhit",1,1],["Ground %","groundpct",1,0]];
/* ---- generate + store each season's line for your big-leaguers ---- */
function generateSeasonStats(){
  if(typeof G==="undefined"||!G)return;
  (G.roster||[]).filter(p=>p.loc==="mlb").forEach(p=>{
    p.seasons=p.seasons||[];
    if(p.seasons.some(s=>s.year===G.year))return;
    p.seasons.push(isPit(p)?genPitcherLine(p,statRole(p),G.year):genHitterLine(p,statRole(p),G.year));
    if(p.seasons.length>40)p.seasons=p.seasons.slice(-40);
  });
}
function careerTotals(seasons,pit){
  const t=pit?{g:0,gs:0,w:0,l:0,sv:0,ip:0,k:0,bb:0,hr:0,hits:0,years:0}:{g:0,pa:0,ab:0,h:0,dbl:0,trp:0,hr:0,bb:0,so:0,sb:0,rbi:0,r:0,years:0};
  seasons.forEach(s=>{t.years++;Object.keys(t).forEach(k=>{if(k!=='years'&&typeof s[k]==='number')t[k]+=s[k];});});
  if(pit){t.era=t.ip?+((13*t.hr+3*t.bb-2*t.k)/t.ip+3.15).toFixed(2):0;t.whip=t.ip?+((t.bb+t.hits)/t.ip).toFixed(2):0;}
  else{t.avg=t.ab?+(t.h/t.ab).toFixed(3):0;t.obp=t.pa?+((t.h+t.bb)/t.pa).toFixed(3):0;
    const tb=(t.h-t.dbl-t.trp-t.hr)+2*t.dbl+3*t.trp+4*t.hr;t.slg=t.ab?+(tb/t.ab).toFixed(3):0;t.ops=+(t.obp+t.slg).toFixed(3);}
  return t;
}
/* ---- the Statcast player card overlay ---- */
function findPlayer(id){const pools=[G.roster,G.farm,G.pool,(G.faMarket||[]).map(f=>f&&f.player),G.leftAsFA];
  for(const arr of pools){if(!arr)continue;const f=arr.find(x=>x&&x.id===id);if(f)return f;}return null;}
function statCardBtn(p){return p?`<button class="btn sm ghost" title="Player stats" onclick="event.stopPropagation();openStatCard('${p.id}')">📊</button>`:'';}
function openStatCard(id){
  const p=findPlayer(id);if(!p){toast("Player not found");return;}
  const pit=isPit(p),m=metricsOf(p);
  const pctRow=([label,key,dig,low])=>{const v=m[key];const pc=pctile(v,leagueMetricArray(key,pit),!!low);const c=pctColor(pc);
    const disp=dig===0?Math.round(v):(+v).toFixed(dig);
    return `<div class="pctrow"><span class="pctlbl">${label}</span><span class="pctval">${disp}</span>
      <div class="pcttrack"><div class="pctdot" style="left:${pc}%;background:${c};box-shadow:0 0 0 1px ${c}"></div></div>
      <span class="pctnum" style="color:${c}">${pc}</span></div>`;};
  const pctHTML=(pit?PIT_PCTS:HIT_PCTS).map(pctRow).join("");
  const seasons=(p.seasons||[]).slice();
  const projected=!seasons.length;
  const line=seasons.length?seasons[seasons.length-1]:(pit?genPitcherLine(p,statRole(p),(G&&G.year)||1):genHitterLine(p,statRole(p),(G&&G.year)||1));
  const box=(v,l)=>`<div style="flex:1;background:var(--panel2);border-radius:8px;padding:6px 2px;text-align:center;min-width:0"><div style="font-size:15px;font-weight:700">${v}</div><div style="font-size:9px;color:var(--dim)">${l}</div></div>`;
  const slash = pit
    ? `${box(line.w+'-'+line.l,'W-L')}${box(line.era,'ERA')}${box(line.ip,'IP')}${box(line.k,'K')}${box(line.whip,'WHIP')}${line.role==='RP'?box(line.sv,'SV'):box(line.gs,'GS')}`
    : `${box((line.avg+'').replace(/^0/,''),'AVG')}${box((line.obp+'').replace(/^0/,''),'OBP')}${box((line.slg+'').replace(/^0/,''),'SLG')}${box(line.hr,'HR')}${box(line.rbi,'RBI')}${box(line.sb,'SB')}`;
  const careerTbl=seasons.length>1?(()=>{const t=careerTotals(seasons,pit);
    const head=pit?'<tr><th>Yr</th><th class="num">W-L</th><th class="num">ERA</th><th class="num">IP</th><th class="num">K</th><th class="num">WHIP</th></tr>'
      :'<tr><th>Yr</th><th class="num">G</th><th class="num">HR</th><th class="num">RBI</th><th class="num">AVG</th><th class="num">OPS</th></tr>';
    const rows=seasons.slice().reverse().map(s=>pit
      ?`<tr><td>${s.year}</td><td class="num">${s.w}-${s.l}</td><td class="num">${s.era}</td><td class="num">${s.ip}</td><td class="num">${s.k}</td><td class="num">${s.whip}</td></tr>`
      :`<tr><td>${s.year}</td><td class="num">${s.g}</td><td class="num">${s.hr}</td><td class="num">${s.rbi}</td><td class="num">${(s.avg+'').replace(/^0/,'')}</td><td class="num">${(s.ops+'').replace(/^0/,'')}</td></tr>`).join("");
    const ct=pit?`<tr style="border-top:2px solid var(--line);font-weight:700"><td>Career</td><td class="num">${t.w}-${t.l}</td><td class="num">${t.era}</td><td class="num">${t.ip}</td><td class="num">${t.k}</td><td class="num">${t.whip}</td></tr>`
      :`<tr style="border-top:2px solid var(--line);font-weight:700"><td>Career</td><td class="num">${t.g}</td><td class="num">${t.hr}</td><td class="num">${t.rbi}</td><td class="num">${(t.avg+'').replace(/^0/,'')}</td><td class="num">${(t.ops+'').replace(/^0/,'')}</td></tr>`;
    return `<div class="sectlbl" style="margin-top:12px">Career — ${t.years} season${t.years>1?'s':''}</div>
      <div class="scroll"><table><thead>${head}</thead><tbody>${rows}${ct}</tbody></table></div>`;})():'';
  const old=document.getElementById('saveov');if(old)old.remove();
  const ov=document.createElement('div');ov.id='saveov';ov.className='saveov';
  ov.innerHTML=`<div class="savebox">
    <div class="row" style="align-items:center"><div style="flex:1"><h3 style="margin:0">${p.name}${customEmoji(p)}${fanFavEmoji(p)}</h3>
      <span class="small muted">${p.pos} · age ${p.age} · ${ovrHTML(p.ovr)} OVR${p.pot>p.ovr?' · '+p.pot+' ceiling':''}</span></div>
      <button class="btn ghost sm" onclick="document.getElementById('saveov').remove()">✕</button></div>
    <div style="display:flex;gap:5px;margin:10px 0">${slash}</div>
    ${projected?`<p class="small muted" style="margin:0 0 6px">📅 Projected ${(G&&G.year)||''} line (he hasn't played a season for you yet).</p>`:`<p class="small muted" style="margin:0 0 6px">${line.year} season${line.role?' · '+(line.role==='starter'?'everyday':line.role==='bench'?'bench/depth':line.role):''}.</p>`}
    <div class="sectlbl">📊 Statcast percentile rankings</div>
    <div style="display:flex;justify-content:space-between;font-size:9px;color:var(--dim);margin:2px 2px 6px"><span>◀ poor</span><span>average</span><span>elite ▶</span></div>
    ${pctHTML}
    ${careerTbl}
    <p class="small muted" style="margin-top:8px">Percentiles rank ${p.name.split(' ').slice(-1)[0]}'s underlying skills against every player in the league.</p>
  </div>`;
  document.body.appendChild(ov);
}
// DAWG — championship mindset / clutch. Independent of OVR; most players ~50, a few elite, a few soft.
// The more DAWG across your playoff roster, the slightly better your October odds. (Hitters AND pitchers.)
function dawgOf(p){if(p.dawg==null)p.dawg=clamp(round(gauss(50,18)),5,99);return p.dawg;}
function teamDawg(){const a=buildActive(G.roster);const ps=[...LINEUP.map(s=>a.lineup[s]),...a.rotation,...a.pen].filter(Boolean);
  return ps.length?ps.reduce((s,p)=>s+dawgOf(p),0)/ps.length:50;}
function dawgTag(p){const d=dawgOf(p);if(d>=78)return ` <span class="pill gold" style="padding:0 5px;font-size:10px">🐶 DAWG ${d}</span>`;if(d<=28)return ` <span class="pill red" style="padding:0 5px;font-size:10px">🐑 soft ${d}</span>`;return '';}
function dawgEmoji(p){const d=dawgOf(p);return d>=78?' 🐶':'';}
function genCatProfile(){const o={};[...HIT_ATTRS,...PIT_ATTRS].forEach(k=>o[k]=Math.round(gauss(0,7)));return o;}
function aiCatScore(t,k){return clamp(72+(t.war-30)*0.7+((t.catProfile&&t.catProfile[k])||0),40,96);}
// scouting-aware realized ceiling for DRAFT prospects (more scouting -> more accurate)
function rollRealCeilScouted(pot){
  const sc=(typeof G!=="undefined"&&G&&G.resources)?G.resources.scouting:0.333;
  const se=(typeof G!=="undefined"&&G&&G.owner&&G.owner.scoutEdge)?G.owner.scoutEdge*0.12:0;   // statcast lab sharpens reads
  const exactP=clamp(0.10+sc*0.50+se,0.08,0.78);const r=Math.random();
  if(r<exactP)return Math.round(pot);
  if(r<exactP+0.50)return Math.round(pot-rnd(3,10));
  return Math.round(pot-rnd(11,20));
}
// ---- salary scales with ability + MLB service: ~$8M max at yr3, up to $25M at yr6 for a 99 OVR ----
const SERVICE_MULT=[0,0.10,0.18,0.30,0.52,0.76,1.0];   // index = MLB years (1..6), 6+ = full (cheap pre-arb -> arb -> full freight)
// Realistic open-market value, modeled on recent MLB free-agent AAVs and extensions:
// ~99 OVR ≈ $52M (Ohtani/Soto tier), 95 ≈ $43M, 90 ≈ $34M, 85 ≈ $25M, 80 ≈ $18M, 75 ≈ $12M, 70 ≈ $7M, 65 ≈ $4M.
function fullSalary(ovr){return clamp(0.75+Math.pow(Math.max(0,ovr-54)/45,2.0)*52,0.75,55);}
function salaryFor(ovr,mlbYears,pos){const m=SERVICE_MULT[clamp(mlbYears,1,6)];let s=fullSalary(ovr)*m;if(pos==='RP')s=Math.min(s*0.5,24);return Math.max(0.75,Math.round(s*10)/10);}   // relievers top out ~half an ace, ~$24M
const initService=age=>clamp(age-22,1,9);
function clonePlayer(d){const[n,p,a,o,t,s,y]=d;const pot=Math.max(t,o);const mlb=initService(a);
  return {id:uid(),name:n,pos:p,age:a,ovr:o,pot,realCeil:Math.max(o,rollRealCeil(pot)),dura:rollDura(a),attr:genAttrs(p),mlbYears:mlb,salary:salaryFor(o,mlb,p),years:y,loc:"mlb",inj:0};}
// fictional college draftee
const C_F=["Tyler","Brody","Chase","Aiden","Mason","Cooper","Hudson","Easton","Carson","Brooks","Maddox","Holden","Bennett","Cash","Rhys","Wells","Ledger","Tate","Gunner","Jrue"];
const C_L=["Whitfield","Carrasco","Bautch","Demaris","Holcomb","Pennington","Vasquez","Stallings","Brockman","Yount","Dellinger","Marsh","Ocampo","Steele","Hargrove","Vitelli","Brubaker","Sandoval","Kingery","Marchetti"];
const COLL=["Vanderbilt","LSU","Texas","Wake Forest","Stanford","Florida","Arkansas","Tennessee","Miami","Oregon St","UCLA","TCU","Clemson","Wichita St"];
const POSPOOL=["C","1B","2B","3B","SS","LF","CF","RF","SP","SP","RP"];
function draftee(slot,rd,advanced,pos){
  rd=rd||1; pos=pos||pick(POSPOOL);
  let o,pot;
  if(G.mode==="survivor"){
    // Survivor draft: smooth gaussian around a per-round base, slightly adjusted by your pick slot.
    // Each round is meaningfully better than the next, but 3-5 keep real value and a shot at a good prospect.
    const RB={1:90,2:84,3:81,4:78,5:76};
    const base=(RB[rd]||74)-(slot-1)*0.38;
    if(advanced){o=clamp(Math.round(rnd(63,71)-slot*0.2),52,73);pot=clamp(o+ri(4,11),o,90);}
    else{o=clamp(Math.round(rnd(42,52)-slot*0.3),30,57);pot=clamp(Math.round(gauss(base,5.5)),60,99);}
  } else {
    // 6-year mode: steeper top-pick premium, gentle taper, floored so late rounds aren't worthless
    const cb=slot<=1?91.3:89.2-(slot-2)*0.95;
    const ceilBase=Math.max(72, cb-(rd-1)*6);
    if(advanced){o=clamp(Math.round(rnd(63,71)-slot*0.2-(rd-1)*3),52,73);pot=clamp(o+ri(4,10),o,85);}
    else{o=clamp(Math.round(rnd(42,52)-slot*0.3-(rd-1)*4),30,57);pot=clamp(Math.round(gauss(ceilBase,5)),55,99);}
  }
  pot=Math.max(pot,o);
  return {id:uid(),name:ficName(),pos,age:advanced?ri(23,24):ri(20,22),ovr:o,pot,
    realCeil:Math.max(o,rollRealCeilScouted(pot)),dura:rollDura(advanced?23:21),attr:genAttrs(pos),mlbYears:0,salary:0.7,years:6,loc:"farm",inj:0,college:pick(COLL),advanced:!!advanced,fic:true,prospect:true};
}
// broader fictional name pools for prospects / replacement players
// fictional name pool: war/military-movie character names + colorful old-time (pre-1900s) baseball names & nicknames
const F_FIRST=["Maverick","Iceman","Goose","Viper","Slider","Hollywood","Merlin","Sundown","Hangman","Rooster","Phoenix","Hondo","Payback","Coyote","Wolfman","Jester","John","Jack","Mike","Pete","Tom","Nick","Richard","Daniel","Stanley","Adrian","Chris","Benjamin","Walter","Bill","Lance","Matt","Norm","Danny","Hal","Joe","Ernie","William","Desmond","Don","Norman","Boyd","Grady","Marc","Ryan","Marcus","Michael","Aldo","Hugo","Vassili","Erwin","George","Omar","Wade","Edwin","Frank","Ron","Anthony","Tommy","Robert","Carwood","Donald","Eugene","Ronald","Buck","Floyd","Lewis","Nathan","Forrest","Witt","Trip",
  "Cap","Kid","Wee","Dummy","Pud","Cannonball","Noodles","Boileryard","Klondike","Cozy","Orval","Cinders","Pickles","Pinky","Heinie","Rube","Buttercup","Icebox","Cherokee","Foghorn","Oyster","Egyptian","Cuke","Stuffy","Hippo","Ducky","Dazzy","Schoolboy","Mule","Cracker","Bris","Lave","Pretzels","Crazy","Dasher","Possum","Hardrock","Skeeter","Cuddles","Twinkles"];
const F_LAST=["Mitchell","Kazansky","Bradshaw","Metcalf","Seresin","Miller","Horvath","Reiben","Jackson","Mellish","Caparzo","Upham","Taylor","Barnes","Elias","Willard","Kurtz","Kilgore","Eversmann","Durant","McKnight","Sanderson","Nelson","Steele","Winters","Nixon","Lipton","Malarkey","Guarnere","Speirs","Webster","Compton","Talbert","Liebgott","Moore","Galloway","Plumley","Savage","Geoghegan","Sanborn","Eldridge","Doss","Glover","Collier","Swofford","Garcia","Kyle","Luttrell","Murphy","Dietz","Axelson","Raine","Donowitz","Stiglitz","Zaitsev","Hilts","Hendley","Bartlett","Patton","Bradley","Ramsey","Welsh","Staros","Schofield","Farrier","Shaw","Rawlins","Kaffee","Jessup","Winger","Hulka",
  "Anson","Radbourn","Ewing","Brouthers","Galvin","Clarkson","Keefe","Rusie","Delahanty","Hamilton","Burkett","Duffy","Tenney","Tebeau","Childs","McKean","Zimmer","Stivetts","Cuppy","Criger","Bresnahan","Chesbro","McGinnity","Waddell","Plank","Bender","Wagner","Lajoie","Wallace","Keeler","Jennings","Dahlen","Beckley","Cravath","Konetchy","Merkle","Sheckard","Sockalexis","Tebeau","Childs","Hoy","Bond","Galvin"];
const ficName=()=>pick(F_FIRST)+" "+pick(F_LAST);
function ficProspect(){
  const pos=pick(POSPOOL);
  const pot=clamp(round(gauss(79,11)),60,99);
  const ovr=clamp(round(pot-rnd(12,34)),32,60);const age=ri(18,23);
  return {id:uid(),name:ficName(),pos,age,ovr,pot:Math.max(pot,ovr),realCeil:Math.max(ovr,rollRealCeil(Math.max(pot,ovr))),dura:rollDura(age),attr:genAttrs(pos),mlbYears:0,salary:0.7,years:6,loc:"pool",inj:0,fic:true,prospect:true};
}
function ficReplacement(){
  const pos=pick(POSPOOL);const ovr=ri(56,68);const age=ri(25,33);const mlb=initService(age);
  return {id:uid(),name:ficName(),pos,age,ovr,pot:ovr+ri(0,3),mlbYears:mlb,salary:salaryFor(ovr,mlb,pos),years:ri(1,3),loc:"pool",inj:0,fic:true};
}
// color-code ceilings
function ceilClass(pot){return pot>=99?'irid':pot>=96?'bdiamond':pot>=90?'gold':pot>=82?'green':pot>=74?'blue':'';}
function ovrHTML(o){
  if(o>=99)return `<b class="ovr irid">${o}</b>`;
  if(o>=96)return `<b class="ovr bdiamond">${o}</b>`;
  return `<b class="ovr" style="color:${ovrColor(o)}">${o}</b>`;
}
/* ---- Player happiness: a per-player morale bar that wraps the OVR square. A happy clubhouse has chemistry (an October edge); the miserable ask out. ---- */
function happyVal(p){return (p==null||p.happy==null)?62:clamp(p.happy,0,100);}
function happyColor(h){return h<25?'#c0392b':h<45?'#d8742f':h<65?'#c9a227':h<82?'#4a9e3f':'#37c24a';}
function happyTier(h){return h<25?'miserable':h<45?'unhappy':h<65?'content':h<82?'happy':'thrilled';}
function happyRing(p){const h=happyVal(p),col=happyColor(h),deg=Math.round(h*3.6);
  return `<span class="happyring" title="Morale: ${happyTier(h)} (${h}%)" style="background:conic-gradient(${col} ${deg}deg, rgba(255,255,255,0.12) ${deg}deg)"><span class="happyinner">${ovrHTML(p.ovr)}</span></span>`;}
function tradeReqTag(p){return p&&p._tradeReq?' <span class="pill red" style="padding:0 5px;font-size:10px">🔁 wants out</span>':'';}
function teamChem(){const a=buildActive(G.roster);const ps=[...LINEUP.map(s=>a.lineup[s]),...a.rotation,...a.pen].filter(Boolean);
  return ps.length?ps.reduce((s,p)=>s+happyVal(p),0)/ps.length:62;}
// a player's contract ask scales with morale: unhappy players demand a premium, content/homegrown guys take a hometown discount
function askMult(p){if(p._askJitter==null)p._askJitter=Math.round(gauss(0,6));
  return clamp(1+(62-happyVal(p))/90+(p.age>=33?0.08:0)-(p.src==="draft"?0.05:0)+p._askJitter/100,0.8,1.75);}
function theirAsk(p){return Math.max(0.75,Math.round(extendBaseAAV(p)*askMult(p)*10)/10);}
// number text with the diamond/iridescent treatment for 96+/99 (used in the trade badge, any size)
function ovrSpan(o,px){
  if(o>=99)return `<span class="ovr irid" style="font-size:${px}px;font-weight:800">${o}</span>`;
  if(o>=96)return `<span class="ovr bdiamond" style="font-size:${px}px;font-weight:800">${o}</span>`;
  return `<span style="font-size:${px}px;font-weight:800;color:${ovrColor(o)}">${o}</span>`;
}
// small "↑ceiling" indicator coloured by tier (diamond/iridescent at 96+/99)
function ceilBadge(pot){
  if(pot>=99)return `<span class="ovr irid" style="font-size:9px;font-weight:800">↑${pot}</span>`;
  if(pot>=96)return `<span class="ovr bdiamond" style="font-size:9px;font-weight:800">↑${pot}</span>`;
  const c=pot>=90?'var(--gold)':pot>=82?'var(--green)':'var(--blue)';
  return `<span style="font-size:9px;font-weight:700;color:${c}">↑${pot}</span>`;
}
const ceilMini=pot=>`<span class="pill ${ceilClass(pot)}" style="padding:0 5px;font-size:10px">↑${pot}</span>`;
/* ---------- draft pick objects ---------- */
function projSlotEstimate(){
  const myw=warToWins(teamWAR(G.roster));let ahead=0;
  G.ai.forEach(t=>{if(warToWins(t.war)>myw)ahead++;});
  return clamp(16-ahead,1,16);
}
// assign every team a UNIQUE draft slot from projected wins (worst record = pick #1)
function computeDraftOrder(){
  const teams=[{me:true,w:warToWins(teamWAR(G.roster))},...G.ai.map(t=>({t,w:warToWins(t.war)}))];
  teams.sort((a,b)=>a.w-b.w);
  teams.forEach((e,i)=>{const slot=i+1;if(e.me)G.myDraftSlot=slot;else{e.t.pickSlot=slot;e.t._pickTraded=false;}});
  assignTradeBlocks();
  G.draftOrderYear=G.year;
}
// Give each AI team a STABLE set of tradeable players (so the market doesn't reshuffle
// every time you switch partners). No player appears on two teams. Refreshes yearly.
function assignTradeBlocks(){
  const sh=a=>{for(let i=a.length-1;i>0;i--){const j=ri(0,i);[a[i],a[j]]=[a[j],a[i]];}return a;};
  // Every reasonably-useful pool player is tradeable, dealt out across the league so each club is well-stocked
  // (≥13 player cards) and every position has plenty of options. No player lands on two teams.
  const tradeable=G.pool.filter(p=>!p._fromPool&&(p.ovr>=58||p.prospect||(p.pot||0)>=78));
  G.ai.forEach(t=>t.block=[]);
  // interleave by position so each team gets a varied mix rather than, say, five outfielders
  const byPos={}; tradeable.forEach(p=>{(byPos[p.pos]=byPos[p.pos]||[]).push(p.id);});
  const order=[]; const keys=Object.keys(byPos).map(k=>sh(byPos[k]));
  let any=true; while(any){any=false; keys.forEach(arr=>{if(arr.length){order.push(arr.shift());any=true;}});}
  order.forEach((id,i)=>{G.ai[i%G.ai.length].block.push(id);});
  G.ai.forEach(t=>{if(t.block.length>24)t.block=t.block.slice(0,24);});
}
const ROUND_F={1:1,1.5:0.7,2:0.42,3:0.22,4:0.12,5:0.06};
function pickResolvedSlot(pk){return (pk.future&&pk.fromMe)?projSlotEstimate():pk.slot;}
function pickVal(pk){return Math.max(1,round(pickValue(pickResolvedSlot(pk))*(ROUND_F[pk.round||1]||0.5)));}
function pickLabel(pk){if(pk.comp)return '🎟️ Comp Pick (R1.5)';const s=pickResolvedSlot(pk);return `${pk.future&&pk.fromMe?'~':''}R${pk.round||1} Pick #${s}${pk.future&&pk.fromMe?' (proj)':''}`;}
function mkFuturePick(rd){return {id:uid(),round:rd||1,slot:9,future:true,fromMe:true};}
function freshDraftPicks(){return (typeof G!=="undefined"&&G&&(G.mode==="survivor"||G.hard))
  ?[mkFuturePick(1),mkFuturePick(2),mkFuturePick(3),mkFuturePick(4),mkFuturePick(5)]   // 5 rounds in Career Mode AND Hard 6-Year (deeper farm to cover injuries)
  :[mkFuturePick(1),mkFuturePick(2),mkFuturePick(3),mkFuturePick(4)];}   // 6-Year Sprint: 4 rounds

