/* ============================================================
   bWARfare — card collection (Set 1) + Platoon deck-builder
   ============================================================ */
function bwM32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return ((t^t>>>14)>>>0)/4294967296;};}
const BW_FN=["Cannonball","Coyote","Dasher","Cinders","Schoolboy","Oyster","Ducky","Hal","Pete","Rube","Dizzy","Mordecai","Boomer","Slats","Chief","Spider","Gabby","Lefty","Hammer","Tank","Bullet","Goose","Catfish","Sandy","Whitey","Smoky","Ace","Cool","Sliding","Pee Wee","Three Finger","Big Train","Yogi","Duke","Country","Stretch"];
const BW_LN=["Liebgott","Galvin","Webster","Wagner","Stiglitz","Reiben","Zimmer","Waddell","Childs","Beckley","Mathews","Stengel","Koufax","Gibson","Paige","Ryan","Maddux","Rivera","Bonds","Sosa","Griffey","Aaron","Mays","Banks","Carew","Brett","Ripken","Jeter","Trout","Pujols","Glavine","Carlton","Seaver","Spahn","Feller","Marichal","Drysdale","Bench","Berra","Fisk"];
const BW_HPOS=["C","1B","2B","3B","SS","LF","CF","RF","DH"];
// rarity: 0 Common · 1 Good · 2 All-Star · 3 MVP · 4 HOF
const BW_RAR=[{k:'common',name:'Common',col:'#9aa17f'},{k:'good',name:'Good',col:'#e6c84e'},{k:'allstar',name:'All-Star',col:'#9bd84a'},{k:'mvp',name:'MVP',col:'#7fcaff'},{k:'hof',name:'HOF',col:'#ffe14e'}];
// reuse the game's EXACT elite gradients for consistency across modes
const BW_IRID='linear-gradient(90deg,#ff7ab8,#ffd36b,#7bf0a0,#6bd5ff,#c79bff,#ff7ab8)';   // 99 — flowing iridescent (matches .ovr.irid)
const BW_DIAMOND='linear-gradient(135deg,#dff6ff,#7fd0ff,#bfe9ff,#eaffff)';                // 95-98 — blue diamond (matches .pill.bdiamond)
function bwMix(c1,c2,t){const L=(a,b)=>Math.round(a+(b-a)*clamp(t,0,1));return `rgb(${L(c1[0],c2[0])},${L(c1[1],c2[1])},${L(c1[2],c2[2])})`;}
// muted commons → yellow goods → bright green @94, then the game's diamond (95-98) & irid (99) treatments
function bwColor(c){
  const rar=c.rar,ov=c.t==='E'?[74,85,92,96,99][rar]:c.ov;
  if(rar===4||ov>=99)return {kind:'irid'};
  if(rar===3||ov>=96)return {kind:'diamond'};
  if(ov>=90){const col=bwMix([176,224,90],[150,255,60],(ov-90)/4);return {kind:'solid',col};}
  if(ov>=80){const col=bwMix([232,200,80],[200,228,86],(ov-80)/9);return {kind:'solid',col};}
  const col=bwMix([130,136,108],[196,206,175],(ov-69)/10);return {kind:'solid',col};
}
const COACH_AB=[
  {k:'bullpen',n:'Bullpen Coach'},{k:'edgeguru',n:'Edge Guru'},{k:'deepbench',n:'Deep Bench'},
  {k:'signsteal',n:'Sign Stealer'},{k:'basecoach',n:'Base Coach'},{k:'moundvisit',n:'Pitching Coach'},
  {k:'scout',n:'Advance Scout'},{k:'pinchhit',n:'Pinch Hitter'},{k:'hitcoach',n:'Hitting Coach'},{k:'closer',n:'Closer Whisperer'}];
function bwCoachVal(rar){return [1,1,2,2,3][rar]||1;}
function bwCoachDesc(k,v){switch(k){
  case 'bullpen':return `+${v} pitcher swap${v>1?'s':''} per game`;
  case 'edgeguru':return `+${v} Edge redraw${v>1?'s':''} per game`;
  case 'deepbench':return `Carry +${v} extra Edge${v>1?'s':''}`;
  case 'signsteal':return `Reveal the pitch · ${v}×/game`;
  case 'basecoach':return `Steal a base · ${v}×/game`;
  case 'moundvisit':return `Mound visit — reset pitch wear · ${v}×/game`;
  case 'scout':return `Reveal the hitter · ${v}×/game`;
  case 'pinchhit':return `Redo an at-bat · ${v}×/game`;
  case 'hitcoach':return `+${v} vs your weakest pitch`;
  case 'closer':return `Pitchers wear ${v*10}% slower`;
}return '';}
function bwGenSet(){
  const rng=bwM32(20260622);          // fixed seed → Set 1 is identical for everyone, forever
  const cards=[],edges=[],coaches=[],byId={};
  const pad=(n)=>String(n).padStart(3,'0');
  const nm=()=>BW_FN[Math.floor(rng()*BW_FN.length)]+" "+BW_LN[Math.floor(rng()*BW_LN.length)];
  const tiers=[
    {rar:4,lo:99,hi:99,nH:7,nP:3},
    {rar:3,lo:96,hi:98,nH:18,nP:7},
    {rar:2,lo:90,hi:95,nH:36,nP:14},
    {rar:1,lo:80,hi:89,nH:125,nP:45},
    {rar:0,lo:69,hi:79,nH:180,nP:65}];
  const abCh=[0.10,0.25,0.45,0.70,1.0];
  let hN=1,pN=1;
  const mk=(type,t)=>{
    const ov=t.lo+Math.floor(rng()*(t.hi-t.lo+1));
    const base=clamp(Math.round((ov-49)/5),1,10);
    // FB/OFF specialization — wider spread so more cards lean hard one way (e.g. 10 vs FB / 4 vs OFF).
    // vf+vo always equals 2*base, so a specialist and a balanced card of the same OVR are equal in total.
    // (Same number of rng() draws as before, so every card's name / OVR / position / ability is unchanged.)
    let spread = t.rar>=3 ? 1
               : t.rar===0 ? (function(){const r=rng();return r<0.30?0:r<0.52?1:r<0.78?2:r<0.93?3:4;})()
               : (function(){const r=rng();return r<0.34?0:r<0.62?1:r<0.86?2:3;})();
    const strongFB=rng()<0.5;
    spread=Math.min(spread, base-1, 10-base);   // keep both ratings within 1..10 with the sum intact
    const dir=strongFB?1:-1;
    const vf=clamp(base+dir*spread,1,10),vo=clamp(base-dir*spread,1,10);
    let ab;
    if(t.rar===4)ab=type==='H'?{con:true,pwr:true}:{whiff:true,soft:true};
    else ab=type==='H'?{con:rng()<abCh[t.rar],pwr:rng()<abCh[t.rar]}:{whiff:rng()<abCh[t.rar],soft:rng()<abCh[t.rar]};
    const id='S1'+type+pad(type==='H'?hN++:pN++);
    return {id,t:type,name:nm(),pos:type==='H'?BW_HPOS[Math.floor(rng()*9)]:(rng()<0.7?'SP':'RP'),ov,rar:t.rar,vf,vo,ab};
  };
  tiers.forEach(t=>{for(let i=0;i<t.nH;i++)cards.push(mk('H',t));for(let i=0;i<t.nP;i++)cards.push(mk('P',t));});
  // ---- 100 Edges (Player Edge Deck), rarity-scaled power ----
  const ET=[
    {n:"Sit Dead-Red",side:'H',ax:'fb',b:3,w:3},{n:"Guess Offspeed",side:'H',ax:'off',b:3,w:3},{n:"Sit Breaking",side:'H',ax:'br',b:3,w:3},
    {n:"Locked In",side:'H',ax:'any',b:2,w:3},{n:"Tunnel Vision",side:'H',ax:'any',b:3,w:2},{n:"Frozen Rope",side:'H',ax:'any',b:2,w:2},
    {n:"Patient Eye",side:'H',ax:'any',b:2,w:2},{n:"Juiced",side:'H',ax:'any',b:1,pwr:true,w:2},{n:"Corked Bat",side:'H',ax:'any',b:4,risky:true,w:1},
    {n:"Paint the Black",side:'P',ax:'any',b:3,w:3},{n:"Hit the Spot",side:'P',ax:'any',b:2,w:3},{n:"Extra Gas",side:'P',ax:'fb',b:4,w:2},
    {n:"Spitball",side:'P',ax:'off',b:4,w:2},{n:"Backfoot Slider",side:'P',ax:'off',b:3,w:2},{n:"Hook",side:'P',ax:'br',b:4,w:2},
    {n:"Buckle 'Em",side:'P',ax:'br',b:3,w:2},{n:"Quick Pitch",side:'P',ax:'any',b:3,w:2},{n:"Knuckle Curve",side:'P',ax:'br',b:3,w:1}];
  const eTotW=ET.reduce((a,t)=>a+(t.w||1),0);
  const pickET=()=>{let r=rng()*eTotW;for(const t of ET){r-=(t.w||1);if(r<0)return t;}return ET[0];};
  const eMult=[1,1.3,1.6,2,2.4],eCounts=[55,25,12,6,2];let eN=1;
  for(let rar=0;rar<5;rar++){for(let i=0;i<eCounts[rar];i++){
    const tm=pickET(),val=Math.max(1,Math.round(tm.b*eMult[rar]));
    const e={id:'S1E'+pad(eN++),t:'E',name:tm.n,side:tm.side,rar,fb:tm.ax==='fb'?val:0,off:tm.ax==='off'?val:0,br:tm.ax==='br'?val:0,any:tm.ax==='any'?val:0,pwrBump:!!tm.pwr,risky:!!tm.risky};
    e.d=(tm.ax==='fb'?`+${val} vs Fastball`:tm.ax==='off'?`+${val} vs Offspeed`:tm.ax==='br'?`+${val} vs Breaking`:`+${val} any`)+(tm.pwr?' · +1 base':'')+(tm.risky?' · 18% eject':'');
    edges.push(e);
  }}
  // ---- 30 Coaches (Common → HOF, ability scales with rarity) ----
  const cCounts=[8,9,7,4,2];let coN=1,abi=0;
  for(let rar=0;rar<5;rar++){for(let i=0;i<cCounts[rar];i++){
    const a=COACH_AB[abi++%COACH_AB.length],val=[1,1,2,2,3][rar];
    coaches.push({id:'S1C'+pad(coN++),t:'C',name:nm(),pos:'Coach',rar,ov:[72,84,91,96,99][rar],ab:{k:a.k,n:a.n,val,d:bwCoachDesc(a.k,val)}});
  }}
  cards.concat(edges).concat(coaches).forEach(c=>byId[c.id]=c);
  return {cards,edges,coaches,byId};
}
const SET1=bwGenSet();
// non-HOF rarity weights [common,good,allstar,mvp]; HOF is a separate per-pack roll
const PACK_W={bronze:[75,22,2.7,0.3],silver:[55,35,8,2],gold:[34,40,20,6],diamond:[15,35,35,15]};
const HOF_ODDS={bronze:1/10000,silver:1/500,gold:1/100,diamond:1/15};
const PACK_PRICE={bronze:100,silver:250,gold:600,diamond:1500};
const PACK_COL={bronze:'#c08552',silver:'#cdd6bf',gold:'var(--amber)',diamond:'#7fd0ff'};
const PACK_TIERS=['bronze','silver','gold','diamond'];
// ---- collection state (in PROFILE) ----
function bwState(){
  if(!PROFILE.bw){PROFILE.bw={coins:300,collection:{},deck:{h:[],p:[],e:[]},packs:['silver','silver']};bwGrantStarter();saveProfile();}
  const bw=PROFILE.bw;bw.deck=bw.deck||{h:[],p:[],e:[]};if(bw.deck.coach===undefined)bw.deck.coach=null;bw.collection=bw.collection||{};bw.packs=bw.packs||[];if(bw.coins==null)bw.coins=300;
  bwRetroGrant();
  return bw;
}
function bwGrantStarter(){
  const bw=PROFILE.bw;
  const cH=SET1.cards.filter(c=>c.t==='H'&&c.rar===0).slice(0,34);
  const cP=SET1.cards.filter(c=>c.t==='P'&&c.rar===0).slice(0,12);
  const cE=SET1.edges.filter(c=>c.rar===0).slice(0,14);
  [...cH,...cP,...cE].forEach(c=>bw.collection[c.id]=(bw.collection[c.id]||0)+1);
  bw.deck.h=cH.slice(0,30).map(c=>c.id);bw.deck.p=cP.slice(0,10).map(c=>c.id);bw.deck.e=cE.slice(0,12).map(c=>c.id);
}
const bwOwned=id=>id==='CAP'?(PROFILE.createdPlayer?1:0):((PROFILE.bw&&PROFILE.bw.collection[id])||0);
// your Create-A-Player as a live bWARfare card — stats track the player as you upgrade him
function bwCapCard(name,pos,pot){
  pot=clamp(Math.round(pot||70),60,99);const base=clamp(Math.round((pot-49)/5),1,10);
  const isP=(pos==='SP'||pos==='RP'),rar=pot>=99?4:pot>=96?3:pot>=90?2:pot>=80?1:0;
  const ab=isP?{whiff:pot>=82,soft:pot>=90}:{con:pot>=80,pwr:pot>=88};
  return {id:'CAP',t:isP?'P':'H',name:(name||'My Player'),pos:pos||'DH',ov:pot,rar,vf:base,vo:base,ab,cap:true};
}
function bwCapGet(){const c=PROFILE.createdPlayer;if(!c)return null;return bwCapCard(c.name,c.pos,c.pot||c.ovr);}
function bwCardById(id){return SET1.byId[id]||(id==='CAP'?bwCapGet():null);}
const bwDistinct=()=>Object.keys((PROFILE.bw&&PROFILE.bw.collection)||{}).length;
function bwRollRar(w){const tot=w.reduce((s,x)=>s+x,0);let r=Math.random()*tot;for(let i=0;i<w.length;i++){if((r-=w[i])<0)return i;}return 0;}
function bwPlayerOfRar(rar){return pick(SET1.cards.filter(c=>c.rar===rar));}
function bwCoachOfRar(rar){let p=SET1.coaches.filter(c=>c.rar===rar);while(!p.length&&rar>0)p=SET1.coaches.filter(c=>c.rar===--rar);return pick(p.length?p:SET1.coaches);}
function bwOpenPack(tier){
  const w=PACK_W[tier]||PACK_W.bronze,out=[];
  const hofHit=Math.random()<(HOF_ODDS[tier]||0);   // per-pack HOF chance (bronze 1:10000 … diamond 1:15)
  for(let s=0;s<6;s++){
    if(hofHit&&s===0){out.push(bwPlayerOfRar(4));continue;}   // guaranteed HOF when it lands
    out.push(bwPlayerOfRar(bwRollRar(w)));
  }
  let er=bwRollRar(w),ep=SET1.edges.filter(c=>c.rar===er);while(!ep.length&&er>0)ep=SET1.edges.filter(c=>c.rar===--er);
  out.push(pick(ep.length?ep:SET1.edges));   // edge slot, capped at MVP
  out.push(bwCoachOfRar(bwRollRar(w)));   // every pack also yields a coach
  const bw=bwState();out.forEach(c=>{bw.collection[c.id]=(bwOwned(c.id))+1;});
  saveProfile();return out;
}
// ---- franchise / level-up rewards ----
function bwLevelTier(L){return L>=20?'diamond':L>=15?'gold':L>=10?'silver':'bronze';}
function bwLevelCoins(L){return L>=20?500:L>=15?300:L>=10?200:100;}
function bwReward(fromL,toL,qual){
  const bw=bwState();qual=clamp(qual||0,0,100);
  let coins=120+Math.round(qual*2.2),packs=[qual>=80?'gold':qual>=50?'silver':'bronze'];   // franchise-completion pack by performance
  for(let L=(fromL||0)+1;L<=(toL||0);L++){packs.push(bwLevelTier(L));coins+=bwLevelCoins(L);}   // per-level reward, scaling by band
  bw.coins=(bw.coins||0)+coins;bw.packs=bw.packs.concat(packs);saveProfile();
  return {coins,packs:packs.length};
}
function bwRetroGrant(){   // one-time catch-up: existing GM levels earn their level rewards
  const bw=PROFILE.bw;if(bw._retroDone)return;bw._retroDone=true;
  const L=plLevel();let coins=0,packs=[];
  for(let l=1;l<=L;l++){packs.push(bwLevelTier(l));coins+=bwLevelCoins(l);}
  if(packs.length){bw.coins=(bw.coins||0)+coins;bw.packs=bw.packs.concat(packs);saveProfile();}
}
// ---- styles (injected once) ----
function bwEnsureStyles(){if(document.getElementById('bwcss'))return;const s=document.createElement('style');s.id='bwcss';s.textContent=`
 table.bwstat{border-collapse:collapse;width:100%;font-size:12px;min-width:480px}
 table.bwstat th{font-family:var(--disp);font-size:10px;letter-spacing:.04em;text-transform:uppercase;color:var(--dim);text-align:right;padding:5px 7px;border-bottom:1px solid var(--line2);white-space:nowrap}
 table.bwstat td{text-align:right;padding:5px 7px;border-bottom:1px solid var(--line);white-space:nowrap}
 table.bwstat tbody tr:hover{background:var(--panel2)}
 .bwgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(118px,1fr));gap:8px}
 .bwc{background:linear-gradient(180deg,var(--panel2),#11140b);border:1px solid var(--line2);border-top:3px solid var(--line2);border-radius:6px;padding:8px;cursor:pointer;position:relative;transition:transform .1s}
 .bwc:hover{transform:translateY(-2px);border-color:var(--gold)}
 .bwc.indeck{outline:2px solid var(--gold)}
 .bwc.hof{box-shadow:0 0 11px rgba(230,200,78,.45);background:linear-gradient(180deg,#2a2410,#11140b)}
 .bwc-r{font-family:var(--disp);font-size:8px;letter-spacing:.1em;text-transform:uppercase;font-weight:700}
 .bwc-n{font-family:var(--disp);font-size:11px;font-weight:700;text-transform:uppercase;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:2px}
 .bwc-p{font-family:var(--disp);font-size:10px;color:var(--dim)}
 .bwc-s{font-size:10px;color:var(--ink);margin-top:3px}
 .bwc-ab{display:inline-block;font-family:var(--disp);font-size:8px;font-weight:700;padding:1px 4px;border-radius:2px;margin-left:3px}
 .bwc-x{position:absolute;top:5px;right:6px;font-family:var(--disp);font-size:9px;color:var(--gold)}
 .bwc-chk{font-family:var(--disp);font-size:8px;color:var(--gold);letter-spacing:.08em;margin-top:3px}
 .bwc-mblurb{font-size:8.5px;color:var(--dim);font-style:italic;margin-top:3px;line-height:1.2}
 .bwc-mblurb.hofab{color:var(--gold);font-style:normal;font-weight:700}
 .bwc.unowned{opacity:.72}
 .bwc.unowned .bwc-n{color:var(--dim)}
 .bwc-lock{position:absolute;top:5px;right:6px;font-size:12px}
 .bwtab{font-family:var(--disp);text-transform:uppercase;letter-spacing:.05em;font-size:12px;padding:8px 14px;border:1px solid var(--line2);border-radius:3px;cursor:pointer}
 .bwtab.on{background:var(--gold);color:#10130b;border-color:var(--gold)}
 .deckbar{position:sticky;top:0;z-index:5;background:var(--panel);border:1px solid var(--line2);border-radius:4px;padding:8px 12px;display:flex;gap:14px;flex-wrap:wrap;font-family:var(--disp);font-size:12px;text-transform:uppercase;letter-spacing:.05em;margin-bottom:10px}
 .deckbar b{color:var(--gold)}
 .chip{font-family:var(--disp);font-size:11px;text-transform:uppercase;letter-spacing:.04em;border:1px solid var(--line2);border-radius:3px;padding:4px 9px;cursor:pointer;color:var(--dim)}
 .chip.on{background:var(--gold);color:#10130b;border-color:var(--gold)}
 .packov{position:fixed;inset:0;z-index:80;background:rgba(4,5,1,.94);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;padding:20px;overflow:auto}
 .packrow{display:flex;gap:9px;flex-wrap:wrap;justify-content:center;max-width:780px}
 .preveal{animation:bwflip .55s cubic-bezier(.2,1.2,.4,1) both}
 @keyframes bwflip{0%{transform:rotateY(90deg) scale(.85);opacity:0}100%{opacity:1}}
 .bwc{border-top:1px solid var(--line2)}
 .bwc-top{height:4px;border-radius:5px 5px 0 0;margin:-8px -8px 7px}
 .bwc-top.irid{background:${BW_IRID};background-size:300% 100%;animation:irid 4s linear infinite}
 .bwc-top.bdiamond{background:${BW_DIAMOND};background-size:200% 200%;animation:shimmer 3s linear infinite}
 .bwirid{background:${BW_IRID};background-size:300% 100%;-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;color:transparent;font-weight:800;animation:irid 4s linear infinite}
 .bwdiamond{background:${BW_DIAMOND};background-size:200% 200%;-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;color:transparent;font-weight:800;animation:shimmer 3s linear infinite}
 .hofback{width:118px;height:150px;border-radius:7px;cursor:pointer;background:${BW_IRID};background-size:300% 100%;animation:irid 4s linear infinite;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:5px;box-shadow:0 0 22px rgba(255,255,255,.4);text-align:center}
 .hofback.mvpback{background:${BW_DIAMOND};background-size:200% 200%;animation:shimmer 3s linear infinite}
 .hofback b{font-family:var(--disp);font-weight:700;color:#10130b;font-size:14px;letter-spacing:.08em;text-shadow:0 1px 2px rgba(255,255,255,.6)}
 .hofback small{font-family:var(--disp);font-size:9px;letter-spacing:.1em;color:#10130b;opacity:.8}
 .hofpull{animation:hofpop .6s cubic-bezier(.2,1.5,.4,1)}
 @keyframes hofpop{0%{transform:scale(.4) rotate(-8deg);opacity:0}100%{transform:scale(1)}}
 .hofglow{position:absolute;left:50%;top:50%;width:10px;height:10px;pointer-events:none;border-radius:50%;transform:translate(-50%,-50%);background:radial-gradient(circle,rgba(230,200,78,.9),rgba(230,200,78,0) 70%);animation:hofglow .9s ease-out forwards;z-index:3}
 .hofglow.irid{background:radial-gradient(circle,rgba(189,238,60,.95),rgba(159,176,200,.5) 40%,rgba(189,238,60,0) 70%)}
 @keyframes hofglow{0%{width:10px;height:10px;opacity:1}100%{width:340px;height:340px;opacity:0}}`;document.head.appendChild(s);}
// ---- card mini ----
function bwCardBlurb(f,o,b,isHit){
  const idx=[f,o,b],mx=Math.max(f,o,b),mn=Math.min(f,o,b),spread=mx-mn;
  const top=idx.indexOf(mx),bot=idx.indexOf(mn),srt=idx.slice().sort((a,c)=>c-a);
  const topV=srt[0],secV=srt[1],botV=srt[2];
  if(isHit){
    if(spread<=2)return 'Balanced bat';
    if(topV-secV>=3)return ['Crushes fastballs','Crushes offspeed','Crushes breaking balls'][top];
    if(secV-botV>=3)return ['Good vs all but fastballs','Good vs all but offspeed','Good vs all but breaking'][bot];
    return ['Fastball hitter','Offspeed hitter','Breaking-ball hitter'][top];
  }
  if(spread<=2)return 'Balanced arsenal';
  if(topV-secV>=3)return ['Fastball specialist','Offspeed specialist','Breaking specialist'][top];
  if(secV-botV>=3)return ['Weak fastball','Weak offspeed','Weak breaking ball'][bot];
  return ['Leans fastball','Leans offspeed','Leans breaking'][top];
}
function bwAbHTML(c){
  if(c.t==='H')return (c.ab.con?'<span class="bwc-ab" style="background:#1d3a1a;color:var(--green)">CON</span>':'')+(c.ab.pwr?'<span class="bwc-ab" style="background:#3a1d16;color:var(--red)">PWR</span>':'');
  if(c.t==='P')return (c.ab.whiff?'<span class="bwc-ab" style="background:#1a2a3a;color:var(--blue)">WHIFF</span>':'')+(c.ab.soft?'<span class="bwc-ab" style="background:#2a2a14;color:var(--amber)">GB</span>':'');
  return '';
}
function bwCardMini(c,inDeck){
  if(!c)return '';
  const owned=bwOwned(c.id),rm=BW_RAR[c.rar],cc=bwColor(c),unowned=owned===0;
  const gradCls=cc.kind==='irid'?'bwirid':cc.kind==='diamond'?'bwdiamond':'';
  const top=cc.kind==='irid'?'<div class="bwc-top irid"></div>':cc.kind==='diamond'?'<div class="bwc-top bdiamond"></div>':`<div class="bwc-top" style="background:${cc.col}"></div>`;
  const rlab=gradCls?`<span class="${gradCls}">${rm.name}${c.t==='E'?' · Edge':''}</span>`:`<span style="color:${rm.col}">${rm.name}${c.t==='E'?' · Edge':''}</span>`;
  const tail=`${owned>1?`<div class="bwc-x">×${owned}</div>`:''}${unowned?'<div class="bwc-lock">🔒</div>':''}${inDeck?'<div class="bwc-chk">✓ IN DECK</div>':''}`;
  if(c.t==='C')return `<div class="bwc ${inDeck?'indeck':''} ${unowned?'unowned':''} ${c.rar===4?'hof':''}" onclick="bwToggle('${c.id}')">${top}
    <div class="bwc-r">${rlab}</div><div class="bwc-n">${c.name}</div>
    <div class="bwc-p">🧢 Coach</div>
    <div class="bwc-mblurb hofab">★ ${c.ab.n}</div>
    <div class="bwc-s">${c.ab.d}</div>${inDeck?'<div class="bwc-chk">✓ EQUIPPED</div>':''}${unowned?'<div class="bwc-lock">🔒</div>':''}${(c.rar!==4&&owned>1)?`<div class="bwc-x">×${owned}</div>`:''}</div>`;
  if(c.t==='E')return `<div class="bwc ${inDeck?'indeck':''} ${unowned?'unowned':''} ${c.rar===4?'hof':''}" onclick="bwToggle('${c.id}')">${top}
    <div class="bwc-r">${rlab}</div><div class="bwc-n">${c.name}</div>
    <div class="bwc-s">${c.d}</div><div class="bwc-p">${c.side==='H'?'Hitter':'Pitcher'} edge</div>${tail}</div>`;
  const numHTML=gradCls?`<b class="${gradCls}">${c.ov}</b>`:`<b style="color:${cc.col}">${c.ov}</b>`;
  return `<div class="bwc ${inDeck?'indeck':''} ${unowned?'unowned':''} ${c.rar===4?'hof':''}" onclick="bwToggle('${c.id}')">${top}
    <div class="bwc-r">${rlab}</div><div class="bwc-n">${c.name}</div>
    <div class="bwc-p">${c.pos} · ${numHTML}</div>
    <div class="bwc-s">🔥${c.vf} 💨${c.vo} 🌀${bwDeriveBR(c.id,c.ov)}${bwAbHTML(c)}</div>
    <div class="bwc-mblurb ${c.rar===4?'hofab':''}" title="${c.rar===4?bwHofAbility(c.id,c.t).d:''}">${c.rar===4?('★ '+bwHofAbility(c.id,c.t).n):bwCardBlurb(c.vf,c.vo,bwDeriveBR(c.id,c.ov),c.t==='H')}</div>${tail}</div>`;
}
// ---- deck toggle ----
function bwToggle(id){
  const c=bwCardById(id),bw=bwState();if(!c)return;
  if(id!=='CAP'&&!bwOwned(id)){toast("You don't own that card yet.");return;}
  if(c.t==='C'){bw.deck.coach=(bw.deck.coach===id?null:id);saveProfile();toast(bw.deck.coach?`${c.name} hired as coach.`:'Coach removed.');screenPlatoon(_bwTab);return;}
  const list=c.t==='E'?bw.deck.e:(c.t==='H'?bw.deck.h:bw.deck.p);
  const cap=c.t==='E'?12:(c.t==='H'?30:10),i=list.indexOf(id);
  if(i>=0)list.splice(i,1);
  else{if(list.length>=cap){toast(`${c.t==='E'?'Edges':c.t==='H'?'Hitters':'Pitchers'} full (${cap}/${cap}).`);return;}list.push(id);}
  saveProfile();screenPlatoon(_bwTab);
}
// ---- auto-build / clear ----
function bwAutoBuild(){
  const bw=bwState();
  const pow=c=>(c.ov||0)+(c.t==='H'?((c.ab.con?2:0)+(c.ab.pwr?2:0)):((c.ab.whiff?2:0)+(c.ab.soft?2:0)));
  const own=id=>bwOwned(id)>0;
  const _cap=bwCapGet();
  bw.deck.h=(_cap&&_cap.t==='H'?[_cap]:[]).concat(SET1.cards.filter(c=>c.t==='H'&&own(c.id))).sort((a,b)=>pow(b)-pow(a)).slice(0,30).map(c=>c.id);
  bw.deck.p=(_cap&&_cap.t==='P'?[_cap]:[]).concat(SET1.cards.filter(c=>c.t==='P'&&own(c.id))).sort((a,b)=>pow(b)-pow(a)).slice(0,10).map(c=>c.id);
  const ep=e=>(e.fb+e.off+(e.br||0)+e.any)+(e.rar*2)+(e.pwrBump?2:0);
  bw.deck.e=SET1.edges.filter(c=>own(c.id)).sort((a,b)=>ep(b)-ep(a)).slice(0,12).map(c=>c.id);
  saveProfile();toast('Auto-built your strongest deck.');screenPlatoon('deck');
}
function bwClearDeck(){const bw=bwState();bw.deck={h:[],p:[],e:[],coach:(bw.deck&&bw.deck.coach)||null};saveProfile();toast('Deck cleared.');screenPlatoon('deck');}
// ---- tabs ----
let _bwTab='deck',_bwFilt={rar:'all',type:'all',own:'owned'};
function bwDeckTab(){
  const d=PROFILE.bw.deck;
  const sec=(ids,label,cap)=>`<div class="sectlbl" style="margin:12px 0 6px">${label} <b style="color:${ids.length===cap?'var(--green)':'var(--gold)'}">${ids.length}/${cap}</b></div>
    <div class="bwgrid">${ids.map(id=>bwCardMini(bwCardById(id),true)).join('')||'<span class="muted">None — add from the Collection tab.</span>'}</div>`;
  const valid=d.h.length===30&&d.p.length===10&&d.e.length===12;
  return `<div class="deckbar">⚾ Hitters <b>${d.h.length}/30</b> · 🔥 Pitchers <b>${d.p.length}/10</b> · 💉 Edges <b>${d.e.length}/12</b> · 🏅 Deck OVR <b style="color:var(--gold)">${bwDeckRatingIds(d)||'—'}</b></div>
    <div style="display:flex;gap:8px;margin-bottom:6px;flex-wrap:wrap"><button class="btn primary sm" onclick="bwAutoBuild()">⚙️ Auto-build best</button><button class="btn ghost sm" onclick="bwClearDeck()">🗑️ Clear deck</button><button class="btn ghost sm" onclick="screenPlatoon('stats')">📊 Card Stats</button></div>
    ${(function(){const co=d.coach?bwCardById(d.coach):null;return `<div class="sectlbl" style="margin:12px 0 6px">🧢 Coach <b style="color:${co?'var(--gold)':'var(--dim)'}">${co?'1/1':'0/1'}</b></div>`+(co?`<div class="bwgrid">${bwCardMini(co,true)}</div>`:`<div class="small muted" style="margin-bottom:4px">No coach equipped — pick one from the <b>Collection</b> (filter to Coaches). A coach adds a powerful once-per-game ability.</div>`);})()}
    ${sec(d.h,'⚾ Hitters',30)}${sec(d.p,'🔥 Pitchers',10)}${sec(d.e,'💉 Player Edge Deck',12)}
    <div class="center" style="margin-top:16px"><button class="btn primary" ${valid?'':'disabled'} onclick="${valid?'screenGauntlet()':''}">${valid?'⚔️ To the Gauntlet':'Complete your deck to battle'}</button></div>`;
}
function bwCollTab(){
  const bw=PROFILE.bw;
  const rChip=(v,l)=>`<span class="chip ${_bwFilt.rar==v?'on':''}" onclick="bwFilt('rar','${v}')">${l}</span>`;
  const tChip=(v,l)=>`<span class="chip ${_bwFilt.type==v?'on':''}" onclick="bwFilt('type','${v}')">${l}</span>`;
  const oChip=(v,l)=>`<span class="chip ${(_bwFilt.own||'owned')==v?'on':''}" onclick="bwFilt('own','${v}')">${l}</span>`;
  const own=_bwFilt.own||'owned';
  const _cap=bwCapGet();let list=(_cap?[_cap]:[]).concat(SET1.cards,SET1.edges,SET1.coaches);
  if(own==='owned')list=list.filter(c=>bwOwned(c.id)>0);
  else if(own==='unowned')list=list.filter(c=>bwOwned(c.id)===0);
  if(_bwFilt.rar!=='all')list=list.filter(c=>c.rar===+_bwFilt.rar);
  if(_bwFilt.type!=='all')list=list.filter(c=>c.t===_bwFilt.type);
  list.sort((a,b)=>b.rar-a.rar||(b.ov||0)-(a.ov||0));
  const totalPlayers=SET1.cards.length,ownedPlayers=SET1.cards.filter(c=>bwOwned(c.id)>0).length;
  return `<p class="small muted" style="margin:0 0 8px">Set 1 — you've collected <b style="color:var(--gold)">${ownedPlayers}</b> of ${totalPlayers} players and <b style="color:var(--gold)">${SET1.edges.filter(c=>bwOwned(c.id)>0).length}</b> of ${SET1.edges.length} Edges. Browse <b>Unowned</b> to see what you're chasing.</p>
    <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:6px">${oChip('owned','Owned')}${oChip('unowned','Unowned')}${oChip('all','Full Set')}</div>
    <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:6px">${rChip('all','All')}${rChip('4','HOF')}${rChip('3','MVP')}${rChip('2','All-Star')}${rChip('1','Good')}${rChip('0','Common')}</div>
    <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px">${tChip('all','Everything')}${tChip('H','Hitters')}${tChip('P','Pitchers')}${tChip('E','Edges')}${tChip('C','Coaches')}</div>
    <div class="bwgrid">${list.map(c=>{const inDeck=(PROFILE.bw.deck.h.includes(c.id)||PROFILE.bw.deck.p.includes(c.id)||PROFILE.bw.deck.e.includes(c.id)||PROFILE.bw.deck.coach===c.id);return bwCardMini(c,inDeck);}).join('')||'<span class="muted">No cards match — open a pack!</span>'}</div>`;
}
function bwFilt(k,v){_bwFilt[k]=v;screenPlatoon('collection');}
function bwPacksTab(){
  const bw=PROFILE.bw;
  if(!bw.packs.length)return '<p class="muted">No packs waiting. Earn them in the Gauntlet, by leveling up your GM, finishing a franchise, or buying them in the Store.</p>';
  return `<div class="bwgrid" style="grid-template-columns:repeat(auto-fill,minmax(150px,1fr))">${bw.packs.map((t,i)=>`<div style="background:var(--panel2);border:1px solid var(--line2);border-radius:6px;padding:14px;text-align:center">
    <div class="disp" style="font-weight:700;font-size:14px;color:${PACK_COL[t]||'#c08552'}">${t.toUpperCase()} PACK</div>
    <div class="small muted">7 cards · 1 guaranteed Edge</div>
    <button class="btn primary sm" style="margin-top:9px" onclick="bwOpen(${i})">Open ▸</button></div>`).join('')}</div>`;
}
function bwStoreTab(){
  const item=(t,desc)=>`<div style="background:var(--panel2);border:1px solid var(--line2);border-radius:6px;padding:14px;text-align:center">
    <div class="disp" style="font-weight:700;font-size:14px;color:${PACK_COL[t]}">${t.toUpperCase()} PACK</div>
    <p class="small muted" style="margin:4px 0 8px">${desc}</p>
    <button class="btn ${PROFILE.bw.coins>=PACK_PRICE[t]?'primary':''} sm" ${PROFILE.bw.coins>=PACK_PRICE[t]?'':'disabled'} onclick="bwBuy('${t}')">💎 ${PACK_PRICE[t]}</button></div>`;
  const ex=bwDuplicateValue();const RV=[5,15,40,100,300],RN=['Common','Good','All-Star','MVP','HOF'];
  const breakdown=ex.byRar.map((n,r)=>n>0?`<span class="chip" style="cursor:default">${RN[r]} ×${n} → 💎${n*RV[r]}</span>`:'').join('');
  return `<p class="small muted" style="margin:0 0 10px">You have <b style="color:var(--gold)">💎 ${PROFILE.bw.coins} Diamond Coins</b>. Earn more in the Gauntlet, leveling up, and finishing franchises.</p>
    <div class="bwgrid" style="grid-template-columns:repeat(auto-fill,minmax(150px,1fr))">${item('bronze','Mostly Commons, a shot at better. HOF 1:10,000.')}${item('silver','All-Stars show up. HOF 1:500.')}${item('gold','Top MVP odds. HOF 1:100.')}${item('diamond','Elite — stacked with All-Stars & MVPs. HOF 1:15.')}</div>
    <div class="panel" style="margin-top:14px;border-color:var(--line2)">
      <div class="sectlbl" style="margin-bottom:4px">🔁 Exchange Duplicates</div>
      <p class="small muted" style="margin:0 0 8px">Turn extra copies into Diamond Coins — you always keep one of each. Common 💎5 · Good 💎15 · All-Star 💎40 · MVP 💎100 · HOF 💎300.</p>
      ${ex.count>0?`<div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px">${breakdown}</div>
        <div class="center"><button class="btn primary" onclick="bwExchangeDupes()">Exchange ${ex.count} duplicate${ex.count>1?'s':''} → 💎 ${ex.coins}</button></div>`
        :'<p class="muted" style="margin:0">No duplicates right now — open more packs!</p>'}
    </div>`;
}
function bwDuplicateValue(){
  const bw=bwState(),RV=[5,15,40,100,300],byRar=[0,0,0,0,0];let count=0,coins=0;
  Object.keys(bw.collection||{}).forEach(id=>{
    const n=bw.collection[id];if(!(n>1))return;
    const c=bwCardById(id);if(!c)return;const r=c.rar||0,dupes=n-1;
    byRar[r]+=dupes;count+=dupes;coins+=dupes*RV[r];
  });
  return {count,coins,byRar};
}
function bwExchangeDupes(){
  const bw=bwState(),v=bwDuplicateValue();
  if(v.count<=0){toast('No duplicates to exchange.');return;}
  if(!confirm(`Exchange ${v.count} duplicate card${v.count>1?'s':''} for 💎 ${v.coins} Diamond Coins? You'll keep one copy of each.`))return;
  Object.keys(bw.collection).forEach(id=>{if(bw.collection[id]>1)bw.collection[id]=1;});
  bw.coins=(bw.coins||0)+v.coins;saveProfile();sfx('coin');toast(`🔁 Exchanged ${v.count} duplicates for 💎 ${v.coins} Diamond Coins!`);screenPlatoon('store');
}
function bwBuy(t){const bw=bwState();if(bw.coins<PACK_PRICE[t]){toast('Not enough Diamond Coins.');return;}bw.coins-=PACK_PRICE[t];bw.packs.push(t);saveProfile();sfx('coin');toast(`Bought a ${t} pack — open it in Packs.`);screenPlatoon('packs');}
function bwOpen(i){const bw=bwState();const tier=bw.packs[i];if(!tier)return;bw.packs.splice(i,1);saveProfile();const cards=bwOpenPack(tier);bwShowPack(cards,tier);}
function bwShowPack(cards,tier){
  bwEnsureStyles();
  const old=document.getElementById('packov');if(old)old.remove();
  // reveal order: Edge first, then players Common → HOF (best last, for the suspense)
  const order=cards.slice().sort((a,b)=>{const ae=a.t==='E'?0:1,be=b.t==='E'?0:1;return ae!==be?ae-be:a.rar-b.rar;});
  window._bwPack=order;
  const step={bronze:0.40,silver:0.55,gold:0.72,diamond:0.88}[tier]||0.45;   // s between flips — slower for better packs
  const slot=(c,i)=>c.rar>=3
    ? `<div class="preveal" id="bwslot${i}" style="animation-delay:${(i*step).toFixed(2)}s"><div class="hofback ${c.rar===3?'mvpback':''}" onclick="bwFlipHof(${i})"><b>${c.rar===4?'★ HOF ★':'◆ MVP ◆'}</b><small>TAP TO REVEAL</small></div></div>`
    : `<div class="preveal" style="animation-delay:${(i*step).toFixed(2)}s">${bwCardMini(c,false)}</div>`;
  sfx('pack');hap(20);
  const ov=document.createElement('div');ov.id='packov';ov.className='packov';
  ov.innerHTML=`<div class="disp" style="font-weight:700;letter-spacing:.08em;color:${tier==='gold'?'var(--amber)':tier==='silver'?'#cdd6bf':'#c08552'};font-size:20px">${tier.toUpperCase()} PACK</div>
    <div class="packrow">${order.map(slot).join('')}</div>
    <button class="btn primary" onclick="document.getElementById('packov').remove();screenPlatoon('collection')">Add to collection ▸</button>`;
  document.body.appendChild(ov);
}
function bwFlipHof(i){
  const c=(window._bwPack||[])[i],el=document.getElementById('bwslot'+i);if(!el||!c)return;
  const back=el.firstElementChild;if(!back){el.innerHTML=bwCardMini(c,false);return;}
  sfx('flip');
  el.style.perspective='800px';
  back.style.transformOrigin='center';back.style.transition='transform .32s ease-in';
  back.style.transform='rotateY(90deg)';
  setTimeout(()=>{
    if(c.rar>=3){sfx('rare');hap([20,40,20]);const gl=document.createElement('i');gl.className='hofglow'+(c.rar===4?' irid':'');(el.parentNode||el).appendChild(gl);setTimeout(()=>gl.remove(),950);}
    el.innerHTML=bwCardMini(c,false);
    const front=el.firstElementChild;if(!front)return;
    front.style.transformOrigin='center';front.style.transform='rotateY(-90deg)';
    front.style.transition='transform .34s cubic-bezier(.2,1.25,.4,1)';
    requestAnimationFrame(()=>requestAnimationFrame(()=>{front.style.transform='rotateY(0deg)';}));
  },330);
}
