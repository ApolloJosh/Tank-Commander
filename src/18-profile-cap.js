/* ============================================================
   PLAYER PROFILE — XP, levels, unlocks, Create-A-Player
   (lives in its own localStorage key, so it persists across franchises)
   ============================================================ */
const PROFILE_KEY="tankCommander_profile_v1";
function loadProfile(){try{return Object.assign({xp:0,gamesPlayed:0,createdPlayer:null},JSON.parse(localStorage.getItem(PROFILE_KEY)||"{}"));}catch(e){return {xp:0,gamesPlayed:0,createdPlayer:null};}}
function saveProfile(){PROFILE.updated=Date.now();try{localStorage.setItem(PROFILE_KEY,JSON.stringify(PROFILE));}catch(e){}if(typeof cloudSync==="function")cloudSync();}
let PROFILE=loadProfile();
const MAX_LEVEL=30;
function levelOf(xp){return Math.min(MAX_LEVEL,1+Math.floor(Math.sqrt(Math.max(0,xp||0)/40)));}
function xpForLevel(L){return Math.pow(L-1,2)*40;}
function plLevel(){return levelOf(PROFILE.xp);}
function addXP(amt){PROFILE.xp=(PROFILE.xp||0)+Math.max(0,Math.round(amt));saveProfile();}
// unlocks by level
const POS_UNLOCK=[[2,"RF"],[3,"LF"],[4,"CF"],[5,"1B"],[6,"3B"],[7,"DH"],[8,"2B"],[9,"SS"],[10,"C"],[12,"SP"],[14,"RP"]];
function unlockedPositions(){const L=plLevel();return POS_UNLOCK.filter(u=>L>=u[0]).map(u=>u[1]);}
function attrPointsForLevel(){const L=plLevel();return L<2?0:clamp(Math.round(6+(L-2)*1.6),6,52);}
function allocMaxForLevel(){return clamp(Math.round(5+plLevel()*0.4),5,16);}
function ceilCapForLevel(){return clamp(Math.round(82+(plLevel()-2)*0.65),82,99);}
function capUnlocked(){return (PROFILE.gamesPlayed||0)>=1;}
function awardFranchiseXP(seasons,titles,bonus){
  const before=plLevel();
  addXP((seasons||0)*6+(titles||0)*15+(bonus||0));
  PROFILE.gamesPlayed=(PROFILE.gamesPlayed||0)+1;saveProfile();
  return {leveledUp:plLevel()>before,from:before,to:plLevel()};
}
function unlockNoteFor(r){if(!r||!r.leveledUp)return '';
  const np=POS_UNLOCK.filter(u=>u[0]>r.from&&u[0]<=r.to).map(u=>u[1]);
  return (np.length?`Unlocked ${np.join("/")} for your Created Player, plus `:`Earned `)+`more attribute points.`;}
function xpEndNotice(){
  if(!G._xpAwarded){let seasons,titles,bonus;
    if(G.owner){seasons=G.year||0;titles=G.champions||0;bonus=Math.round(Math.max(0,ownerNetProfit())/100);}   // Owner Mode XP: years owned, titles, profit
    else if(G.mode==="survivor"){seasons=G.yearsServed||0;titles=G.survTitles||0;bonus=Math.round((G.cumScore||0)/10);}
    else{seasons=(G.history?G.history.length:6);titles=G.champions||0;bonus=Math.round((computeGrade().score||0)/5);}
    G._xpRes=awardFranchiseXP(seasons,titles,bonus);
    // bWARfare card rewards: a franchise pack (tier by how you did) + a pack per level gained + Diamond Coins
    let qual;
    if(G.owner)qual=clamp(Math.round((G.champions||0)*16+Math.max(0,ownerNetProfit())/40),0,100);
    else if(G.mode==="survivor")qual=clamp(Math.round((G.cumScore||0)/12+(G.survTitles||0)*14),0,100);
    else qual=clamp(Math.round(computeGrade().score||0),0,100);
    G._bwRes=bwReward(G._xpRes.from,G._xpRes.to,qual);
    G._xpAwarded=true;try{saveGame();}catch(e){}}
  const r=G._xpRes||{},bwr=G._bwRes||{};
  return `<div class="panel center" style="border-color:var(--gold)">
    <div class="pill gold">🎖️ GM PROFILE</div>
    <p class="sub" style="margin:6px 0 0">${r.leveledUp?`<b style="color:var(--gold)">LEVEL UP → GM Level ${r.to}!</b> ${unlockNoteFor(r)}`:`You're GM Level ${plLevel()}.`}</p>
    ${PROFILE.gamesPlayed===1?'<div class="pill gold" style="margin-top:6px;display:inline-block">⭐ Create-A-Player unlocked on the main menu!</div>':''}
    ${bwr.packs?`<p class="small" style="margin:8px 0 0;color:var(--gold)">🎁 bWARfare: earned <b>${bwr.packs} pack${bwr.packs>1?'s':''}</b> + <b>💎 ${bwr.coins} Diamond Coins</b> — open them in <b>Platoon</b>.</p>`:''}
    <div style="max-width:380px;margin:8px auto 0">${xpPanel()}</div></div>`;
}
function xpPanel(){
  const L=plLevel(),xp=PROFILE.xp||0,cur=xpForLevel(L),next=xpForLevel(L+1);
  const pct=L>=MAX_LEVEL?100:clamp(Math.round((xp-cur)/(next-cur)*100),0,100);
  return `<div class="panel2" style="border:1px solid var(--line);border-radius:10px;padding:10px;margin:10px 0">
    <div style="display:flex;justify-content:space-between;align-items:center"><b>🎖️ GM Level ${L}</b><span class="small muted">${L>=MAX_LEVEL?'MAX':xp+' / '+next+' XP'}</span></div>
    <div class="favtrack" style="height:10px;margin-top:6px"><div class="favbar" style="width:${pct}%;background:var(--gold)"></div></div>
    <div class="small muted" style="margin-top:5px">Play franchises to earn XP and level up — unlocking more positions and attribute points for your Created Player.</div></div>`;
}

/* ---------- Create-A-Player ---------- */
const ATTR_BASE=64;   // every attribute starts here (peak value), points raise it
let _cap=null;   // working draft {name,pos,alloc,dawg}
function capDefaults(){return {name:"My Player",pos:"RF",alloc:{},dawg:0};}
function capAttrsFor(pos){return (pos==="SP"||pos==="RP")?PIT_ATTRS:HIT_ATTRS;}
function capSpent(){let s=0;const a=_cap.alloc||{};Object.keys(a).forEach(k=>s+=a[k]);return s+(_cap.dawg||0);}
function capPeak(d,k){return clamp(ATTR_BASE+((d.alloc||{})[k]||0)*5,ATTR_BASE,99);}   // attribute value at full development
function capBuild(d){   // turn a draft into a finished prospect template
  const keys=capAttrsFor(d.pos);
  const peakMean=keys.reduce((s,k)=>s+capPeak(d,k),0)/keys.length;
  const pot=clamp(Math.round(peakMean),64,ceilCapForLevel());   // ceiling = avg of your attribute peaks, capped by level
  const ovr=clamp(pot-22,30,74);
  const attr={};keys.forEach(k=>attr[k]=capPeak(d,k)-pot);   // store as offset so attribute hits its peak when fully developed
  const dawg=clamp(50+(d.dawg||0)*5,5,99);
  return {name:(d.name||"My Player").slice(0,20),pos:d.pos,age:20,ovr,pot,realCeil:pot,attr,dawg,
    createdLevel:plLevel(),custom:true};
}
function screenCreatePlayer(){
  if(!capUnlocked()){screenTitle();return;}
  bwEnsureStyles();bwbEnsureStyles();
  if(!_cap){const cp=PROFILE.createdPlayer;_cap=cp?{name:cp.name,pos:cp.pos,alloc:cp._alloc||{},dawg:cp._dawg||0}:capDefaults();}
  const positions=unlockedPositions();
  if(!positions.includes(_cap.pos))_cap.pos=positions[0]||"RF";
  const total=attrPointsForLevel(),spent=capSpent(),left=total-spent;
  const built=capBuild(_cap);
  const isPit=(_cap.pos==="SP"||_cap.pos==="RP");
  const keys=capAttrsFor(_cap.pos);
  const allKnownPos=["RF","LF","CF","1B","3B","DH","2B","SS","C","SP","RP"];
  const posChip=p=>{const open=positions.includes(p);const lk=POS_UNLOCK.find(u=>u[1]===p);
    return `<span class="tbchip ${_cap.pos===p?'on':''}" ${open?`onclick="capSetPos('${p}')"`:'style="opacity:.4"'}>${p}${open?'':` 🔒L${lk?lk[0]:'?'}`}</span>`;};
  const amax=allocMaxForLevel();
  const attrRow=k=>{const v=(_cap.alloc[k]||0);const peak=capPeak(_cap,k);
    return `<div style="display:flex;align-items:center;gap:8px;margin:3px 0"><span class="small" style="flex:0 0 70px">${ATTR_LABEL[k]}</span>
      <button class="btn sm" onclick="capAdj('${k}',-1)">−</button><b style="width:24px;text-align:center">${v}</b><button class="btn sm" onclick="capAdj('${k}',1)">＋</button>
      <span class="small muted">→ <b style="color:${peak>=85?'var(--gold)':'var(--dim)'}">${peak}</b> at peak${v>=amax?' <span style="color:var(--dim)">(max)</span>':''}</span></div>`;};
  render(`<div class="row" style="align-items:center;margin-bottom:6px"><h2 style="flex:1">⭐ Create-A-Player</h2><button class="btn ghost" onclick="(function(){_cap=null;screenTitle();})()">← Home</button></div>
    ${xpPanel()}
    <div class="panel">
      <p class="sub">Build your franchise cornerstone. He joins your farm in <b>every new game you start</b>. Level up to unlock more positions and points.</p>
      <div style="margin:8px 0"><input id="capname" value="${(_cap.name||'').replace(/"/g,'&quot;')}" oninput="_cap.name=this.value" maxlength="20" style="width:60%;max-width:280px"></div>
      <div class="sectlbl">Position ${unlockedPositions().length<allKnownPos.length?'<span class="small muted">(more unlock as you level)</span>':''}</div>
      <div>${allKnownPos.map(posChip).join("")}</div>
      <div class="sectlbl">Attribute points <span class="small" style="color:${left>0?'var(--gold)':'var(--dim)'}">${left} of ${total} left</span></div>
      ${total<=0?'<p class="small muted">Reach Level 2 to earn attribute points.</p>':keys.map(attrRow).join("")}
      <div style="display:flex;align-items:center;gap:8px;margin:6px 0 3px"><span class="small" style="flex:0 0 70px">🐶 DAWG</span>
        <button class="btn sm" onclick="capAdj('dawg',-1)">−</button><b style="width:24px;text-align:center">${_cap.dawg||0}</b><button class="btn sm" onclick="capAdj('dawg',1)">＋</button>
        <span class="small muted">→ ${built.dawg} clutch</span></div>
    </div>
    <div class="panel">
      <h3>Preview</h3>
      <div class="pcard" style="cursor:default">${ovrHTML(built.ovr)} ${built.pot>built.ovr?ceilMini(built.pot):''} <b>${built.name||'My Player'}</b>${built.dawg>=78?' 🐶':''} <span class="small muted">${built.pos} ${built.age}y</span></div>
      <p class="small muted" style="margin-top:8px">Starts at ${built.ovr} OVR with a ${built.pot} ceiling${isPit?' (pitcher)':''}. He's a prospect — develop him in your minors like any other.</p>
    </div>
    <div class="panel">
      <h3>⚔️ Your bWARfare Card</h3>
      <p class="small muted" style="margin:2px 0 6px">Your created player is also a live bWARfare card — his 🔥/💨/🌀 ratings and abilities grow as you raise his ceiling. Save him, then add him to your deck from <b>Platoon → Collection</b>.</p>
      <div style="display:flex;justify-content:center;padding:34px 0 24px"><div style="transform:scale(1.55);transform-origin:center">${bwbCardHTML(bwbCard(bwCapCard(built.name,built.pos,built.pot)))}</div></div>
    </div>
    <div class="center"><button class="btn primary" onclick="saveCreatedPlayer()">Save Player</button>
      ${PROFILE.createdPlayer?'<button class="btn ghost" onclick="(function(){if(confirm){};PROFILE.createdPlayer=null;saveProfile();_cap=capDefaults();toast(\'Player cleared\');screenCreatePlayer();})()">Delete</button>':''}</div>`);
}
function capSetPos(p){const wasPit=(_cap.pos==='SP'||_cap.pos==='RP'),nowPit=(p==='SP'||p==='RP');_cap.pos=p;if(wasPit!==nowPit)_cap.alloc={};screenCreatePlayer();}   // only reset attrs when switching between hitter and pitcher (different attribute pools)
function capAdj(k,d){const total=attrPointsForLevel(),amax=allocMaxForLevel();
  if(k==='dawg'){let v=(_cap.dawg||0)+d;if(v<0)v=0;if(v>amax)v=amax;const test=capSpent()-(_cap.dawg||0)+v;if(test>total&&d>0)return;_cap.dawg=v;}
  else{let v=(_cap.alloc[k]||0)+d;if(v<0)v=0;if(v>amax)v=amax;const test=capSpent()-(_cap.alloc[k]||0)+v;if(test>total&&d>0)return;_cap.alloc[k]=v;}
  screenCreatePlayer();}
function saveCreatedPlayer(){const nm=(document.getElementById('capname')||{}).value;if(nm)_cap.name=nm;
  const built=capBuild(_cap);built._alloc=Object.assign({},_cap.alloc);built._dawg=_cap.dawg||0;
  PROFILE.createdPlayer=built;
  const bw=bwState();let edgeMsg='';
  if(!bw._capEdgeBonus){bw._capEdgeBonus=true;const pool=SET1.edges.filter(c=>c.rar<=1);for(let i=0;i<3;i++){const e=pick(pool);bw.collection[e.id]=(bwOwned(e.id))+1;}edgeMsg=' +3 starter Edges added to your collection!';}
  saveProfile();toast(`${built.name} saved — he's in your next game and ready as a bWARfare card.${edgeMsg}`);screenTitle();}
function makeCreatedProspect(){const c=PROFILE.createdPlayer;if(!c)return null;
  return {id:uid(),name:c.name,pos:c.pos,age:c.age||20,ovr:c.ovr,pot:c.pot,realCeil:c.pot,
    dura:rollDura(c.age||20),attr:Object.assign({},c.attr),dawg:c.dawg,mlbYears:0,salary:0.75,years:6,
    loc:"farm",inj:0,src:"draft",fic:true,prospect:true,custom:true};}

