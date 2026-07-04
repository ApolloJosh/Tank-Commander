/* ============================================================
   bWARfare — GAUNTLET + BATTLE ENGINE
   ============================================================ */
const BW_TIERS=[{k:'bronze',name:'Bronze',col:'#c08552',ring:'🥉'},{k:'silver',name:'Silver',col:'#cdd6bf',ring:'🥈'},{k:'gold',name:'Gold',col:'#e6b24a',ring:'🥇'},{k:'diamond',name:'Diamond',col:'#7fd0ff',ring:'💎'}];
// CPU rarity weights [common,good,allstar,mvp,hof] — [base @ opp1, boss @ step8], interpolated across the 8 opponents
const CPU_W={bronze:[[80,18,2,0,0],[45,40,13,2,0]],silver:[[45,42,11,2,0],[22,43,28,7,0]],gold:[[18,40,31,10,1],[6,26,42,23,3]],diamond:[[5,26,40,24,5],[0,6,30,44,20]]};
const BW_OPP={bronze:['Sandlot Scrappers','Backlot Bunters','Rookie Leaguers','Dusty Diamond Crew','Cornfield Nine','Pickup Gamers','Beer League Bashers','Weekend Warriors'],
 silver:['Double-A Drillers','County Champs','Semi-Pro Sluggers','River Rats','Iron City Nine','Steel Town Sox','Prairie Mashers','Coastliners'],
 gold:['Big League Bruisers','Metropolis Monarchs','Capital Crushers','All-Star Alliance','Empire Niners','Dynasty Squad','Titan Ballers','Apex Athletics'],
 diamond:['Cooperstown Club','Legends United','The Immortals','Mt. Rushmore Nine','Galaxy All-Pros','The Untouchables','Mythic Mashers','Pantheon Nine']};
const BW_BOSS=['The Bronze Baron','The Silver Specter','The Golden Goliath','The Diamond Dynasty'];
function bwGaunt(){const bw=bwState();if(!bw.gaunt)bw.gaunt={tier:0,step:0,rings:[false,false,false,false]};return bw.gaunt;}
function bwCpuWeights(tier,step){const w=CPU_W[BW_TIERS[tier].k],b=w[0],bo=w[1],t=step/8;return b.map((v,i)=>v+(bo[i]-v)*t);}
function bwCpuDeck(tier,step){
  const w=bwCpuWeights(tier,step);
  const pT=type=>{let rar=bwRollRar(w),pool=SET1.cards.filter(c=>c.t===type&&c.rar===rar),g=0;while(!pool.length&&g++<6){rar=Math.max(0,rar-1);pool=SET1.cards.filter(c=>c.t===type&&c.rar===rar);}return pick(pool);};
  const h=[],p=[],e=[];for(let i=0;i<30;i++)h.push(pT('H'));for(let i=0;i<10;i++)p.push(pT('P'));
  for(let i=0;i<12;i++){let rar=Math.min(3,bwRollRar(w)),pool=SET1.edges.filter(c=>c.rar===rar);while(!pool.length&&rar>0)pool=SET1.edges.filter(c=>c.rar===--rar);e.push(pick(pool.length?pool:SET1.edges));}
  return {h,p,e};
}
// ---- battle styles ----
function bwbEnsureStyles(){if(document.getElementById('bwbcss'))return;const s=document.createElement('style');s.id='bwbcss';s.textContent=`
 .bwb-score{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:8px}
 .bwb-sb{flex:1;min-width:130px;background:var(--panel2);border:1px solid var(--line);border-radius:4px;padding:8px 11px;display:flex;align-items:center;justify-content:space-between}
 .bwb-sb.bat{border-color:var(--gold);box-shadow:inset 0 0 0 1px rgba(217,130,43,.25)}
 .bwb-sb .w{font-family:var(--disp);text-transform:uppercase;font-weight:700;font-size:12px;letter-spacing:.04em}
 .bwb-sb .w small{display:block;font-size:8px;color:var(--dim);letter-spacing:.12em}
 .bwb-sb .r{font-family:var(--mono);font-weight:600;font-size:24px;color:var(--phos)}
 .bwb-state{display:flex;align-items:center;gap:14px;justify-content:center;flex-wrap:wrap;font-family:var(--disp);text-transform:uppercase;font-size:11px;letter-spacing:.08em;color:var(--dim);margin-bottom:8px}
 .bwb-dia{position:relative;width:42px;height:42px}
 .bwb-bs{position:absolute;width:12px;height:12px;background:var(--panel2);border:1px solid var(--line2);transform:rotate(45deg)}
 .bwb-bs.on{background:var(--phos);border-color:var(--phos);box-shadow:0 0 7px rgba(158,240,26,.55)}
 .bwb-o{display:inline-flex;gap:4px}.bwb-od{width:10px;height:10px;border-radius:50%;border:1px solid var(--line2)}.bwb-od.on{background:var(--red);border-color:var(--red)}
 .bwb-field{background:linear-gradient(180deg,#10160a,#0b0f07);border:1px solid var(--line);border-radius:8px;padding:14px;min-height:330px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:9px;text-align:center;margin-bottom:6px}
 .bwb-hand{display:flex;gap:7px;overflow-x:auto;padding:6px 2px;width:100%;justify-content:flex-start}
 .bwb-pick{cursor:pointer;flex-shrink:0;transition:transform .1s;border-radius:7px}
 .bwb-pick:hover{transform:translateY(-5px)}
 .bwb-pick.sel{outline:2px solid var(--gold);transform:translateY(-5px)}
 .bwb-dice{display:flex;gap:10px;justify-content:center}
 .bwb-die{width:46px;height:46px;border-radius:8px;background:linear-gradient(180deg,#f2ede0,#cfc8b4);border:1px solid #8a8468;display:flex;align-items:center;justify-content:center;font-family:var(--disp);font-weight:700;font-size:24px;color:#1c1508;box-shadow:0 3px 8px rgba(0,0,0,.45)}
 .bwb-die.roll{animation:bwbshake .12s linear infinite;color:#8a8468}
 @keyframes bwbshake{0%{transform:translate(0,0)}25%{transform:translate(-2px,1px) rotate(-5deg)}50%{transform:translate(2px,-1px) rotate(5deg)}100%{transform:translate(1px,1px)}}
 .bwb-pop{font-family:var(--disp);text-transform:uppercase;letter-spacing:.1em;font-weight:700;display:flex;align-items:center;gap:10px;font-size:20px;animation:bwbpop .5s cubic-bezier(.2,1.4,.4,1)}
 .bwb-pop .ic{font-size:32px}
 @keyframes bwbpop{0%{transform:scale(.4);opacity:0}100%{transform:scale(1);opacity:1}}
 .bwb-math{font-family:var(--disp);font-size:14px;opacity:0;transition:opacity .3s}.bwb-math .tot{color:var(--phos);font-family:var(--mono);font-size:17px}
 .bwb-outc{font-family:var(--disp);text-transform:uppercase;font-weight:700;font-size:26px;opacity:0;transition:opacity .25s}
 .bwb-peds{display:flex;flex-wrap:wrap;gap:6px;justify-content:center}
 .bwb-ped{font-family:var(--disp);font-size:10.5px;text-transform:uppercase;border:1px solid var(--line2);border-left:3px solid var(--amber);border-radius:3px;padding:5px 8px;background:var(--panel2);cursor:pointer}
 .bwb-ped.pit{border-left-color:var(--red)} .bwb-ped.sel{outline:2px solid var(--gold)} .bwb-ped.dim{opacity:.4;cursor:not-allowed}
 .gnode{display:flex;align-items:center;gap:10px;padding:9px 11px;border:1px solid var(--line2);border-radius:5px;background:var(--panel2);margin-bottom:6px}
 .gnode.done{opacity:.5;border-color:var(--line)} .gnode.cur{border-color:var(--gold);box-shadow:0 0 10px rgba(217,130,43,.25)} .gnode.boss{border-left:4px solid var(--red)}
 .gnode .gn{font-family:var(--disp);font-weight:700;text-transform:uppercase;font-size:13px;flex:1}
 .gnode .gs{font-family:var(--disp);font-size:10px;color:var(--dim);letter-spacing:.06em}
 .bwb-fan{display:flex;justify-content:center;align-items:flex-end;min-height:158px;position:relative;padding-top:2px;margin-bottom:12px}
 .bwb-slot{transform-origin:bottom center;transition:transform .16s,filter .16s;margin:0 -5px}
 .bwb-fan.you .bwb-slot{cursor:pointer}
 .bwb-fan.you .bwb-slot:hover{transform:translateY(-20px) scale(1.05)!important;z-index:20;filter:brightness(1.12)}
 .bwb-slot.sel{transform:translateY(-24px) scale(1.06)!important;z-index:21}
 .bwb-slot.sel .bwc{outline:2px solid var(--gold);box-shadow:0 0 14px rgba(217,130,43,.4)}
 .bwb-fan.opp{min-height:96px;padding-top:4px;margin-bottom:10px;transform:scaleY(-1)}
 .bwb-fan.opp .bwb-back{transform:scaleY(-1)}
 .bwb-fan.opp .bwb-slot{margin:0 -20px}
 .bwb-back{width:108px;height:144px;border-radius:7px;border:1px solid var(--line2);background:radial-gradient(circle at 50% 38%,rgba(217,130,43,.08),transparent 60%),repeating-linear-gradient(135deg,#161c0e,#161c0e 6px,#1c2413 6px,#1c2413 12px);display:flex;align-items:center;justify-content:center}
 .bwb-fan.opp .bwb-back{width:62px;height:84px}
 .bwb-back span{font-family:var(--disp);font-weight:700;font-size:13px;color:var(--gold);opacity:.55;letter-spacing:.04em}.bwb-back b{color:var(--ink)}
 .bwb-fan.opp .bwb-back span{font-size:9px}
 .bwb-decks{display:flex;gap:11px;justify-content:center;margin-bottom:16px}
 .bwb-stack{position:relative;width:32px;height:46px;border-radius:5px;background:repeating-linear-gradient(135deg,#1c2413,#1c2413 5px,#222d16 5px,#222d16 10px);border:1px solid var(--line2);box-shadow:2px 2px 0 #0d1108,3px 3px 0 var(--line)}
 .bwb-stack .c{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-family:var(--disp);font-weight:700;font-size:13px;color:var(--gold)}
 .bwb-stack.ped .c{color:var(--amber)}
 .bwb-stack .l{position:absolute;bottom:-13px;left:50%;transform:translateX(-50%);font-family:var(--disp);font-size:8px;color:var(--dim);letter-spacing:.04em}
 .bwb-zlbl{font-family:var(--disp);text-transform:uppercase;letter-spacing:.1em;font-size:10px;color:var(--dim);text-align:center;margin-bottom:4px}
 .bwbc{width:100px;height:152px;box-sizing:border-box;padding:8px;display:flex;flex-direction:column;cursor:default;position:relative}
 .bwbc:hover{transform:none;border-color:var(--line2)}
 .bwbc .bwc-r{font-size:8.5px;padding-right:30px}
 .bwbc .bwc-n{font-size:9.5px;margin-top:3px;padding-right:22px;line-height:1.06;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;word-break:break-word}
 .bwbc .bwc-p{font-size:8.5px;margin-top:1px;opacity:.8}
 .bwbc .bwc-s{font-size:12.5px;font-weight:600;margin-top:4px}
 .bwbc-rt{font-size:15px;font-weight:700;letter-spacing:.01em;text-align:center;margin-top:6px;color:var(--ink)}
 .bwbc-blurb{font-size:9px;color:var(--dim);font-style:italic;text-align:center;margin-top:4px;line-height:1.25;padding:0 2px}
 .bwbc-blurb.hofab{color:var(--gold);font-style:normal;font-weight:700;font-size:9.5px}
 .bwbc-ov{position:absolute;top:6px;right:7px;font-family:var(--disp);font-weight:800;font-size:21px;line-height:1}
 .bwbc-abs{margin-top:auto;display:flex;gap:4px;min-height:18px;align-items:flex-end;justify-content:center}
 .bwbc-abs .bwc-ab{margin-left:0;font-size:9px;padding:2px 6px}
 .bwb-fan.dim{opacity:.42}
 .bwb-fan.dim .bwb-slot{cursor:default}
 .bwb-bug{position:sticky;top:0;z-index:30;display:flex;align-items:center;justify-content:space-between;gap:8px;background:rgba(16,20,10,.96);border:1px solid var(--line2);border-radius:6px;padding:6px 10px;margin-bottom:6px;-webkit-backdrop-filter:blur(3px);backdrop-filter:blur(3px)}
 .bwb-bteam{display:flex;align-items:center;gap:8px;flex:1;min-width:0}
 .bwb-bteam.r{justify-content:flex-end;text-align:right}
 .bwb-bteam .rn{font-family:var(--mono);font-weight:600;font-size:24px;color:var(--phos);line-height:1;flex-shrink:0}
 .bwb-bteam .rn.pulse{animation:runpop .55s cubic-bezier(.2,1.5,.4,1)}
 @keyframes runpop{0%{transform:scale(1)}30%{transform:scale(1.45);text-shadow:0 0 16px rgba(158,240,26,.75)}100%{transform:scale(1)}}
 .bwb-bteam .nm{font-family:var(--disp);font-weight:700;font-size:12px;text-transform:uppercase;letter-spacing:.03em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:flex;flex-direction:column;min-width:0}
 .bwb-bteam .nm small{font-size:8px;color:var(--dim);letter-spacing:.1em}
 .bwb-bteam.bat .nm{color:var(--gold)}
 .bwb-bmid{display:flex;align-items:center;gap:8px;flex-shrink:0}
 .bwb-binn{font-family:var(--disp);text-transform:uppercase;font-size:10px;letter-spacing:.05em;color:var(--dim);display:flex;flex-direction:column;align-items:center;gap:3px;white-space:nowrap}
 .bwb-actions{display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-top:14px}
 .bwb-act{font-family:var(--disp);text-transform:uppercase;letter-spacing:.04em;font-size:12px;font-weight:700;padding:9px 16px;border-radius:5px;background:var(--panel2);border:1px solid var(--line2);cursor:pointer;display:flex;flex-direction:column;align-items:center;line-height:1.25}
 .bwb-act small{font-size:8px;color:var(--dim);letter-spacing:.1em;font-weight:600}
 .bwb-act.arm{border:2px solid var(--blue);color:var(--blue)}
 .bwb-act.edge{border:2px solid var(--amber);color:var(--amber)}
 .bwb-act.coach{border:2px solid var(--gold);color:var(--gold)}
 .bwb-act.used,.bwb-act:disabled{opacity:.4;cursor:not-allowed;border:1px solid var(--line2);color:var(--dim)}
 .bwb-pitchrow{display:flex;gap:8px;justify-content:center;flex-wrap:nowrap;width:100%;max-width:360px}
 .bwb-pitchbtn{background:var(--panel2);border:1px solid var(--line2);border-radius:6px;padding:8px 6px;cursor:pointer;flex:1 1 0;min-width:0;font-family:var(--disp);text-align:center;color:var(--ink)}
 .bwb-pitchbtn:hover{border-color:var(--gold)}
 .bwb-pitchbtn .pb-h{font-size:12px;text-transform:uppercase;letter-spacing:.03em}
 .bwb-pitchbtn .pb-h b{color:var(--gold);font-size:14px}
 .bwb-pitchbtn .pb-bar{height:5px;border-radius:3px;background:var(--line);margin:5px 0 3px;overflow:hidden}
 .bwb-pitchbtn .pb-bar>div{height:100%;border-radius:3px;transition:width .3s}
 .bwb-pitchbtn .pb-mb{font-size:8.5px;letter-spacing:.04em;text-transform:uppercase}
 .bwb-pitchbtn .pb-kind{font-size:8px;color:var(--dim);letter-spacing:.02em}
 .bwb-tend{font-family:var(--disp);font-size:10px;letter-spacing:.05em;text-transform:uppercase;color:var(--dim);margin-top:8px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%}
 .bwb-legend{font-size:10.5px;color:var(--dim);text-align:center;line-height:1.8;margin:14px auto 0;max-width:580px}
 .bwb-legend b{font-family:var(--disp)}
 @media(max-width:560px){
  .bwb-fan{min-height:136px;margin-bottom:10px}
  .bwbc{width:80px;height:128px;padding:6px}
  .bwbc .bwc-n{font-size:8.5px;padding-right:18px}
  .bwbc-ov{font-size:18px;top:5px;right:6px}
  .bwbc .bwc-r{padding-right:26px}
  .bwbc-rt{font-size:13px;margin-top:6px}
  .bwbc-blurb{font-size:8px;margin-top:4px}
  .bwb-slot{margin:0 -10px}
  .bwb-fan.you .bwb-slot:hover{transform:translateY(-14px) scale(1.04)!important}
  .bwb-slot.sel{transform:translateY(-16px) scale(1.05)!important}
  .bwb-back{width:80px;height:128px}
  .bwb-fan.opp{min-height:80px}
  .bwb-fan.opp .bwb-slot{margin:0 -26px}
  .bwb-fan.opp .bwb-back{width:54px;height:74px}
  .bwb-bteam .rn{font-size:22px}
  .bwb-bteam .nm{font-size:11px}
  .bwb-die{width:40px;height:40px;font-size:20px}
  .bwb-outc{font-size:22px}
  .bwb-field{padding:10px;min-height:336px}
 }
 `;document.head.appendChild(s);}
// ---- normalize a Set 1 card for the engine ----
function bwbCard(c){
  if(c.t==='H')return {id:c.id,t:'H',name:c.name,pos:c.pos,ov:c.ov,rar:c.rar,vsFB:c.vf,vsOFF:c.vo,vsBR:bwDeriveBR(c.id,c.ov),con:!!(c.ab&&c.ab.con),pwr:!!(c.ab&&c.ab.pwr),hof:c.rar===4?bwHofAbility(c.id,'H'):null};
  if(c.t==='P')return {id:c.id,t:'P',name:c.name,pos:c.pos,ov:c.ov,rar:c.rar,fb:c.vf,off:c.vo,br:bwDeriveBR(c.id,c.ov),whiff:!!(c.ab&&c.ab.whiff),soft:!!(c.ab&&c.ab.soft),hof:c.rar===4?bwHofAbility(c.id,'P'):null};
  return {id:c.id,t:'E',name:c.name,side:c.side,fb:c.fb||0,off:c.off||0,any:c.any||0,pwrBump:!!c.pwrBump,risky:!!c.risky,rar:c.rar,d:c.d};
}
function bwbCardHTML(c){
  const cc=bwColor(c),rm=BW_RAR[c.rar];
  const gc=cc.kind==='irid'?'bwirid':cc.kind==='diamond'?'bwdiamond':'';
  const top=cc.kind==='irid'?'<div class="bwc-top irid"></div>':cc.kind==='diamond'?'<div class="bwc-top bdiamond"></div>':`<div class="bwc-top" style="background:${cc.col}"></div>`;
  const rlab=gc?`<span class="${gc}">${rm.name}</span>`:`<span style="color:${rm.col}">${rm.name}</span>`;
  const ovHTML=gc?`<div class="bwbc-ov ${gc}">${c.ov}</div>`:`<div class="bwbc-ov" style="color:${cc.col}">${c.ov}</div>`;
  const f=c.t==='H'?c.vsFB:c.fb,o=c.t==='H'?c.vsOFF:c.off,br=c.t==='H'?(c.vsBR||0):(c.br||0);
  const isHof=c.rar===4&&c.hof;
  const blurb=isHof?('★ '+c.hof.n):bwCardBlurb(f,o,br,c.t==='H');
  const ab=c.t==='H'?((c.con?'<span class="bwc-ab" style="background:#1d3a1a;color:var(--green)">CON</span>':'')+(c.pwr?'<span class="bwc-ab" style="background:#3a1d16;color:var(--red)">PWR</span>':'')):((c.whiff?'<span class="bwc-ab" style="background:#1a2a3a;color:var(--blue)">WHIFF</span>':'')+(c.soft?'<span class="bwc-ab" style="background:#2a2a14;color:var(--amber)">GB</span>':''));
  return `<div class="bwc bwbc ${c.rar===4?'hof':''}">${top}${ovHTML}<div class="bwc-r">${rlab}</div><div class="bwc-n">${c.name}</div><div class="bwc-p">${c.pos}</div><div class="bwbc-rt">🔥${f} 💨${o} 🌀${br}</div><div class="bwbc-blurb ${isHof?'hofab':''}" title="${isHof?c.hof.d:''}">${blurb}</div><div class="bwbc-abs">${ab}</div></div>`;
}
// ---- battle state ----
let BW=null;
if(typeof window!=="undefined"&&!window._bwTimers)window._bwTimers=[];
function clearTimers(){if(typeof window==="undefined")return;(window._bwTimers||[]).forEach(t=>{clearTimeout(t);clearInterval(t);});window._bwTimers=[];}
function shuffle(a){a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));const x=a[i];a[i]=a[j];a[j]=x;}return a;}
function rint(a,b){return a+Math.floor(Math.random()*(b-a+1));}
function bwbMkSide(name,deck){return {name,allH:deck.h.slice(),allP:deck.p.slice(),hitters:shuffle(deck.h.slice()),pitchers:shuffle(deck.p.slice()),peds:shuffle(deck.e.slice()),hand:[],phand:[],pitcher:null,runs:0};}
function bwbRefill(s){
  // never reshuffle a card that's already sitting in the hand back into the draw pile
  if(!s.hitters.length)s.hitters=shuffle(s.allH.filter(c=>!s.hand.some(x=>x.id===c.id)));
  while(s.hand.length<5&&s.hitters.length){const c=s.hitters.shift();if(s.hand.some(x=>x.id===c.id))continue;s.hand.push(c);}
  if(s.hand.length<5){s.hitters=shuffle(s.allH.filter(c=>!s.hand.some(x=>x.id===c.id)));while(s.hand.length<5&&s.hitters.length)s.hand.push(s.hitters.shift());}
  while(s.phand.length<(s._edgeHand||3)&&s.peds.length)s.phand.push(s.peds.shift());   // edges finite per battle (Deep Bench coach grows the hand)
}
function bwbStart(youDeck,cpuDeck,meta){
  setTimeout(()=>{try{sfx('playball');}catch(e){}},250);
  clearTimers();
  BW={you:bwbMkSide(bwTeam().name,youDeck),cpu:bwbMkSide(meta.oppName||'Rivals',cpuDeck),inning:1,half:'top',outs:0,bases:[null,null,null],phase:'pitch',committedPitch:null,pdEdge:null,selHitter:null,selEdge:null,last:null,pending:null,over:false,winner:null,meta,_rewarded:false,_pitchLog:{FB:0,OFF:0,BR:0},_cpuPitchLog:{FB:0,OFF:0,BR:0}};
  BW.you.coach=youDeck.coach||null;BW.cpu.coach=cpuDeck.coach||null;bwbInitCoach(BW.you);bwbInitCoach(BW.cpu);
  BW._signStolen=false;BW._scouted=null;BW._cpuSitForce=false;
  bwbRefill(BW.you);bwbRefill(BW.cpu);bwbStartHalf();screenBwBattle();
}
const bwbOff=()=>BW.half==='top'?BW.you:BW.cpu;
const bwbDef=()=>BW.half==='top'?BW.cpu:BW.you;
const bwbYouBat=()=>BW.half==='top';
function bwbStartHalf(){
  BW.outs=0;BW._ab=0;BW.bases=[null,null,null];const d=bwbDef();
  if(!d.pitcher||d.pitcher._inn!==BW.inning){if(!d.pitchers.length)d.pitchers=shuffle(d.allP.filter(p=>!d.pitcher||p.id!==d.pitcher.id));if(!d.pitchers.length)d.pitchers=shuffle(d.allP.slice());d.pitcher=d.pitchers.shift();d.pitcher._inn=BW.inning;d.pitcher._runsInn=0;d.pitcher._eff={FB:100,OFF:100,BR:100};d.pitcher._coachWear=(d._closer?(1-d._closer*0.1):1);}
  BW.selHitter=null;BW.selEdge=null;BW.pdEdge=null;BW._signStolen=false;BW._scouted=null;if(typeof bwbCpuCoach==='function')bwbCpuCoach();
  if(bwbYouBat()){BW.committedPitch=bwbCpuPitch(d.pitcher);BW.pdEdge=bwbCpuPitEdge(d);BW.phase='swing';}else BW.phase='pitch';
}
const BW_HOF_H=[{k:'pure',n:'Pure Hitter',d:'Brutally hard to retire'},{k:'holes',n:'No Holes',d:'Hits any pitch at his best'},{k:'launch',n:'Launcher',d:'Every hit is 2+ bases'},{k:'clutch',n:'Clutch',d:'+3 with runners on'}];
const BW_HOF_P=[{k:'untouch',n:'Untouchable',d:'Almost never hangs one'},{k:'kartist',n:'Strikeout Artist',d:'Piles up whiffs'},{k:'ace',n:'Ace',d:'+2 to every pitch'},{k:'bulldog',n:'Bulldog',d:'Tireless — wears slow'}];
function bwHofAbility(id,t){const pool=t==='H'?BW_HOF_H:BW_HOF_P;return pool[bwHash(id+'hof')%pool.length];}
function bwHash(str){let h=2166136261;for(let i=0;i<str.length;i++){h=Math.imul(h^str.charCodeAt(i),16777619);}return (h>>>0);}
function bwDeriveBR(id,ov){const base=clamp(Math.round((ov-49)/5),1,10);const off=(bwHash(id+'br')%7)-3;return clamp(base+off,1,10);}
// the CPU's pre-pitch read of the human pitcher's go-to pitch (this game only)
function bwbPredictedPitch(){
  const L=BW._pitchLog||{FB:0,OFF:0,BR:0},tot=L.FB+L.OFF+L.BR;
  if(tot<3)return null;
  const a=[['FB',L.FB],['OFF',L.OFF],['BR',L.BR]].sort((x,y)=>y[1]-x[1]);
  return (a[0][1]/tot>=0.45)?a[0][0]:null;   // only sit when there's a clear lean
}
function bwbCpuPitch(p){
  if(!p._eff)p._eff={FB:100,OFF:100,BR:100};
  const scored=[['FB',p.fb],['OFF',p.off],['BR',p.br]].map(([k,v])=>[k,v*(0.5+0.5*p._eff[k]/100)]).sort((a,b)=>b[1]-a[1]);
  if(Math.random()<0.58)return scored[0][0];
  return Math.random()<0.6?scored[1][0]:scored[2][0];
}
function bwbCpuPitEdge(t){const u=t.phand.filter(e=>e.side==='P');if(u.length&&Math.random()<0.3){t.phand=t.phand.filter(x=>x.id!==u[0].id);return u[0];}return null;}
function bwbCpuHitter(t){
  const pred=bwbPredictedPitch();
  const sc=h=>{const all=h.vsFB+h.vsOFF+(h.vsBR||0)+(h.pwr?2:0)+(h.con?2:0);
    const pv=pred?(pred==='FB'?h.vsFB:pred==='BR'?(h.vsBR||0):h.vsOFF):0;
    return all+(pred?pv*1.4:0);};
  return t.hand.slice().sort((a,b)=>sc(b)-sc(a))[0];
}
function bwbCpuHitEdge(t){const u=t.phand.filter(e=>e.side==='H');return (u.length&&Math.random()<0.32)?u[0]:null;}
function bwbLadder(total,h,p,hE,pitch){
  const hofH=h.hof?h.hof.k:null,hofP=p.hof?p.hof.k:null;
  // pitch personality: 🌀 Breaking misses bats (more Ks); 💨 Offspeed suppresses extra-base hits; 🔥 Fastball lets the ball carry
  let xb=(p.soft?1:0)+(pitch==='OFF'?1:0)+(pitch==='FB'?-1:0)+(hofP==='painter'?1:0);
  const outMax=7-(h.con?1:0)+(p.whiff?1:0)+(pitch==='BR'?1:0)+(hofP==='kartist'?2:0)-(hofH==='pure'?2:0);
  let b=total<=outMax?0:total<=9+xb?1:total<=11+xb?2:total<=13+xb?3:4;
  if(b>=1&&b<4&&(h.pwr||(hE&&hE.pwrBump)))b++;
  if(b>=1&&hofH==='launch')b=Math.max(b,2);   // every hit at least a double
  return b;
}
function bwbMeatballPct(p,pitch){
  if(!p._eff)return 0;
  const eff=p._eff[pitch]==null?100:p._eff[pitch];
  const cap=Math.max(8,42-Math.max(0,p.ov-72)*0.9);   // OVR 72 caps ~42%, OVR 99 caps ~18%
  return Math.min(cap,(100-eff)*0.42);
}
function bwbResolve(h,pitch,hE,pE,p,sit){
  if(!p._eff)p._eff={FB:100,OFF:100,BR:100};
  const hofH=h.hof?h.hof.k:null,hofP=p.hof?p.hof.k:null;
  const d1=rint(1,6),d2=rint(1,6),roll=d1+d2;
  let hv=pitch==='FB'?h.vsFB:pitch==='BR'?(h.vsBR||0):h.vsOFF;
  if(hofH==='holes')hv=Math.max(h.vsFB,h.vsOFF,h.vsBR||0);     // No Holes: best rating vs any pitch
  let pr=pitch==='FB'?p.fb:pitch==='BR'?(p.br||0):p.off;
  if(hofP==='ace')pr+=2;                                        // Ace: +2 to every pitch
  let hb=hE?hE.any+(pitch==='FB'?hE.fb:pitch==='BR'?(hE.br||0):hE.off):0,
      pb=pE?pE.any+(pitch==='FB'?pE.fb:pitch==='BR'?(pE.br||0):pE.off):0;
  const runnersOn=(typeof BW!=='undefined'&&BW&&BW.bases&&(BW.bases[0]||BW.bases[1]||BW.bases[2]));
  const clutch=(hofH==='clutch'&&runnersOn)?3:0;
  // a hung pitch ("meatball") — odds climb as this pitch wears down; aces protected; a hung 🌀 hurts most
  const eff=p._eff[pitch];
  let mbPct=bwbMeatballPct(p,pitch);if(hofP==='untouch')mbPct*=0.5;
  const meatball=Math.random()<(mbPct/100);
  const mbPen=meatball?(pitch==='BR'?6:4):0;
  let total=roll+hv-pr+hb-pb+mbPen+(sit||0)+clutch;
  let bases=bwbLadder(total,h,p,hE,pitch);
  // wear this pitch down; the others freshen back up (Bulldog wears slowly)
  let drop=clamp(28-Math.round(p.ov/4),6,22);if(hofP==='bulldog')drop=Math.round(drop*0.5);
  drop=Math.max(3,Math.round(drop*({FB:0.8,OFF:1.0,BR:1.3}[pitch]||1)));   // 🌀 wears fastest, 💨 medium, 🔥 slowest
  if(p._coachWear)drop=Math.max(2,Math.round(drop*p._coachWear));   // Closer Whisperer coach
  p._eff[pitch]=clamp(eff-drop,0,100);
  ['FB','OFF','BR'].forEach(k=>{if(k!==pitch)p._eff[k]=clamp(p._eff[k]+9,0,100);});
  const ejected=hE&&hE.risky&&Math.random()<0.18;
  const walk=(!ejected&&!meatball&&roll===4);
  const tags=[];if(meatball)tags.push('MEATBALL');if(clutch)tags.push('CLUTCH');if(sit)tags.push('SAT');if(hofH)tags.push(h.hof.n.toUpperCase());if(hofP)tags.push(p.hof.n.toUpperCase());if(h.con)tags.push('CON');if(p.whiff)tags.push('WHIFF');if(p.soft)tags.push('GB');if(h.pwr||(hE&&hE.pwrBump))tags.push('PWR');
  return {d1,d2,roll,hv,pr,hb,pb,total,pitch,bases,walk,meatball,sit:!!sit,label:walk?'WALK':ejected?'EJECTED':['OUT','SINGLE','DOUBLE','TRIPLE','HOME RUN'][bases],ejected,tags,h,p};
}
function bwbRunCalc(bases,st,bat){const[r1,r2,r3]=st;let nb=[null,null,null],sc=[];
  if(bases===1){if(r2)sc.push(r2);if(r3)sc.push(r3);nb[0]=bat;nb[1]=r1;}
  else if(bases===2){if(r2)sc.push(r2);if(r3)sc.push(r3);nb[1]=bat;nb[2]=r1;}
  else if(bases===3){if(r1)sc.push(r1);if(r2)sc.push(r2);if(r3)sc.push(r3);nb[2]=bat;}
  else{if(r1)sc.push(r1);if(r2)sc.push(r2);if(r3)sc.push(r3);sc.push(bat);}   // HR: all runners + batter score
  return {runs:sc.length,nb,scorers:sc};
}
function bwbWalkCalc(st,bat){const[r1,r2,r3]=st;let nb=[null,null,null],sc=[];
  nb[0]=bat;                                   // batter takes first
  if(r1){ nb[1]=r1;                            // runner on first is forced to second
    if(r2){ nb[2]=r2; if(r3)sc.push(r3); }     // second forced to third; if loaded, third forced home
    else { nb[2]=r3; }                         // second open: third holds
  } else { nb[1]=r2; nb[2]=r3; }               // first open: nobody forced
  return {runs:sc.length,nb,scorers:sc};
}
function bwbCommitPitch(pitch){
  let pE=null;if(BW.selEdge&&BW.selEdge.side==='P'){pE=BW.selEdge;BW.you.phand=BW.you.phand.filter(x=>x.id!==pE.id);}
  BW._sitPred=bwbPredictedPitch();                                   // CPU's read BEFORE this pitch
  BW.committedPitch=pitch;BW.pdEdge=pE;BW.selEdge=null;BW.phase='swing';
  BW._pitchLog=BW._pitchLog||{FB:0,OFF:0,BR:0};BW._pitchLog[pitch]++; // log your throw for future reads
  if(BW.cpu.coachK==='signsteal'&&(BW.cpu._coachUses||0)>0&&Math.random()<0.7){BW._cpuSitForce=true;BW.cpu._coachUses--;}   // CPU sign-steal
  const off=bwbOff();bwbDoAB(bwbCpuHitter(off),bwbCpuHitEdge(off));
}
function bwbSwing(){if(!BW.selHitter)return;bwbDoAB(BW.selHitter,BW.selEdge&&BW.selEdge.side==='H'?BW.selEdge:null);}
function bwbDoAB(h,hE){
  const off=bwbOff(),def=bwbDef();
  const sit=(off===BW.cpu)?(BW._cpuSitForce?3:((BW._sitPred&&BW._sitPred===BW.committedPitch)?2:0)):0;   // CPU read / sign-steal
  if(BW._cpuSitForce)BW._cpuSitForce=false;
  const r=bwbResolve(h,BW.committedPitch,hE,BW.pdEdge,def.pitcher,sit);
  let pend={outs:0,runs:0,nb:BW.bases.slice(),scorers:[],batter:h,bases:r.bases,ejected:!!r.ejected,isK:false,walk:!!r.walk,pitcher:def.pitcher};
  if(r.walk){const wc=bwbWalkCalc(BW.bases,h);pend.runs=wc.runs;pend.nb=wc.nb;pend.scorers=wc.scorers;pend.bases=0;}
  else if(r.ejected||r.bases===0){pend.outs=1;pend.isK=(!r.ejected&&r.total<=4);}
  else{const rc=bwbRunCalc(r.bases,BW.bases,h);pend.runs=rc.runs;pend.nb=rc.nb;pend.scorers=rc.scorers;}
  off.hand=off.hand.filter(x=>x.id!==h.id);if(hE)off.phand=off.phand.filter(e=>e.id!==hE.id);bwbRefill(off);
  BW.last=r;BW.pending=pend;BW.phase='result';
  if(off===BW.you){BW._cpuPitchLog=BW._cpuPitchLog||{FB:0,OFF:0,BR:0};BW._cpuPitchLog[BW.committedPitch]++;}   // book on the opposing pitcher
  const who=off===BW.you?'You':BW.cpu.name;
  BW.lastMsg=(r.meatball&&r.bases>=1?'\ud83c\udf56 Hung pitch! ':'')+(r.walk?`${who}: ${h.name} walks${pend.runs?` — ${pend.runs} run${pend.runs>1?'s':''} forced in`:''}.`:r.ejected?`${h.name} ejected for a corked bat — out.`:r.bases===0?`${h.name} ${r.total<=4?'strikes out':'is retired'}.`:`${who}: ${h.name} ${r.label.toLowerCase()}${pend.runs?` — ${pend.runs} run${pend.runs>1?'s':''} in`:''}!`);
  screenBwBattle();
}
function bwbApply(){const off=bwbOff(),p=BW.pending;if(!p)return;BW.outs+=p.outs;off.runs+=p.runs;if(p.runs>0)BW._runPulse=(off===BW.you)?'you':'cpu';const def=bwbDef();if(def.pitcher)def.pitcher._runsInn=(def.pitcher._runsInn||0)+p.runs;BW.bases=p.nb;BW._ab=(BW._ab||0)+1;bwbRecordStats(p,off,def);if(p.runs>0&&!BW.over&&bwbWalkoffCheck()){BW.over=true;BW.winner=BW.cpu;}BW.pending=null;}
function bwCardStat(id,mode){
  const bw=bwState();if(!bw.cardStats)bw.cardStats={};
  if(!bw.cardStats[id])bw.cardStats[id]={};
  if(!bw.cardStats[id][mode])bw.cardStats[id][mode]={ab:0,h:0,b2:0,b3:0,hr:0,r:0,rbi:0,bb:0,outs:0,ha:0,ra:0,k:0,bba:0};
  return bw.cardStats[id][mode];
}
// accumulate per-card stats for the PLAYER's cards only (gauntlet + rivals tracked separately)
function bwbRecordStats(p,off,def){
  if(!BW.meta||!p)return;
  const mode=BW.meta.rivals?'rivals':'gaunt';
  if(off===BW.you){
    if(p.batter&&p.batter.id){
      const s=bwCardStat(p.batter.id,mode);
      if(p.walk){s.bb=(s.bb||0)+1;}
      else{s.ab++;if(p.bases>=1&&!p.ejected){s.h++;if(p.bases===2)s.b2++;else if(p.bases===3)s.b3++;else if(p.bases===4)s.hr++;}}
      s.rbi+=p.runs;
    }
    (p.scorers||[]).forEach(c=>{if(c&&c.id){bwCardStat(c.id,mode).r++;}});
  }
  if(def===BW.you&&p.pitcher&&p.pitcher.id){
    const s=bwCardStat(p.pitcher.id,mode);
    if(p.walk){s.bba=(s.bba||0)+1;}
    else{s.outs+=p.outs;if(p.bases>=1&&!p.ejected)s.ha++;if(p.isK)s.k++;}
    s.ra+=p.runs;
  }
}
function bwbWalkoffCheck(){
  // the home team (CPU) bats in the bottom half — they can end it the instant they go ahead
  if(BW.half!=='bottom'||BW.cpu.runs<=BW.you.runs)return false;
  const lead=BW.cpu.runs-BW.you.runs;
  if(BW.inning>=9)return true;                 // bottom of the 9th (or extras): any lead is a walk-off
  if(BW.inning>=7&&lead>=8)return true;         // or they cross the mercy margin mid-inning
  if(BW.inning>=5&&lead>=10)return true;
  if(BW.inning>=3&&lead>=15)return true;
  return false;
}
function bwbMercy(){
  // win conditions evaluated at the end of a completed inning (BW.inning = innings completed)
  if(BW.you.runs===BW.cpu.runs)return false;
  const inn=BW.inning,lead=Math.abs(BW.you.runs-BW.cpu.runs);
  if(inn>=7&&lead>=8)return true;
  if(inn>=5&&lead>=10)return true;
  if(inn>=3&&lead>=15)return true;
  if(inn>=9)return true; // regulation: 9 complete innings, someone ahead
  return false;
}
function bwbInitCoach(side){
  side._pcLeft=1;side._edLeft=1;side._edgeHand=3;side._coachUses=0;side.coachK=null;side._closer=0;
  const co=side.coach;if(!co||!co.ab)return;
  const k=co.ab.k,v=co.ab.val;side.coachK=k;side.coachName=co.name;side.coachVal=v;
  if(k==='bullpen')side._pcLeft=1+v;
  else if(k==='edgeguru')side._edLeft=1+v;
  else if(k==='deepbench')side._edgeHand=3+v;
  else if(k==='closer')side._closer=v;
  else if(k==='hitcoach'){let sf=0,so=0,sb=0;side.allH.forEach(h=>{sf+=h.vsFB;so+=h.vsOFF;sb+=(h.vsBR||0);});
    const ax=(sf<=so&&sf<=sb)?'vsFB':(so<=sb?'vsOFF':'vsBR');side.allH.forEach(h=>{h[ax]=Math.min(10,(h[ax]||0)+v);});}
  if(['signsteal','scout','moundvisit','basecoach','pinchhit'].includes(k))side._coachUses=v;
}
function bwbStealBase(side){
  const b=BW.bases;let scored=false;
  if(b[2]){side.runs++;b[2]=null;scored=true;}
  else if(b[1]){b[2]=b[1];b[1]=null;}
  else if(b[0]){b[1]=b[0];b[0]=null;}
  if(scored&&side===BW.cpu&&!BW.over&&bwbWalkoffCheck()){BW.over=true;BW.winner=BW.cpu;}
  return scored;
}
function bwbCoachAbility(){
  const s=BW.you,k=s.coachK;if(!k||(s._coachUses||0)<=0)return;
  if(k==='signsteal')BW._signStolen=true;
  else if(k==='scout')BW._scouted=bwbCpuHitter(BW.cpu);
  else if(k==='moundvisit'){if(s.pitcher)s.pitcher._eff={FB:100,OFF:100,BR:100};toast('Mound visit — your pitches are fresh again.');}
  else if(k==='basecoach'){bwbStealBase(BW.you);toast('Stolen base!');}
  else if(k==='pinchhit'){s.hand=[];s.hitters=shuffle(s.allH.filter(c=>true));bwbRefill(s);BW.selHitter=null;toast('Fresh batters at the plate.');}
  s._coachUses--;screenBwBattle();
}
function bwbCpuCoach(){
  const c=BW.cpu;if(!c.coachK||(c._coachUses||0)<=0)return;
  if(c.coachK==='moundvisit'&&BW.half==='top'&&c.pitcher){
    const lo=Math.min(c.pitcher._eff.FB,c.pitcher._eff.OFF,c.pitcher._eff.BR);
    if(lo<35){c.pitcher._eff={FB:100,OFF:100,BR:100};c._coachUses--;toast(`${c.name}: a mound visit settles ${c.pitcher.name}.`);}
  }
  if(c.coachK==='basecoach'&&BW.half==='bottom'&&(BW.bases[0]||BW.bases[1]||BW.bases[2])&&Math.random()<0.5){
    bwbStealBase(c);c._coachUses--;toast(`${c.name} sends the runner — stolen base!`);
  }
}
function bwbCpuMaybeSwap(){
  // CPU defends in the top half (you bat). It burns its one bullpen call the moment its pitcher
  // has been tagged for 6+ runs in this inning.
  if(BW.half!=='top')return false;
  const s=BW.cpu;
  if((s._pcLeft==null?1:s._pcLeft)<=0||!s.pitcher||(s.pitcher._runsInn||0)<6)return false;
  if(!s.pitchers.length)s.pitchers=shuffle(s.allP.slice());
  let np=s.pitchers.shift();
  if(np&&s.pitcher&&np.id===s.pitcher.id&&s.pitchers.length){s.pitchers.push(np);np=s.pitchers.shift();}
  if(np){np._inn=BW.inning;np._runsInn=0;np._eff={FB:100,OFF:100,BR:100};np._coachWear=(s._closer?(1-s._closer*0.1):1);s.pitcher=np;}
  s._pcLeft=(s._pcLeft==null?1:s._pcLeft)-1;
  toast(`${BW.cpu.name} goes to the bullpen — ${np?np.name:'a reliever'} takes over.`);
  return true;
}
function bwbNext(){
  if(BW.over)return;
  if(BW.outs>=3||(BW._ab||0)>=14){   // 3 outs — or a mercy cap so a blowout half can't run forever
    if(BW.half==='top'){BW.half='bottom';bwbStartHalf();}   // top done → home bats
    else{   // a full inning is complete — check the mercy / regulation win conditions
      if(bwbMercy()){BW.over=true;BW.winner=BW.you.runs>BW.cpu.runs?BW.you:BW.cpu;screenBwBattle();return;}
      BW.half='top';BW.inning++;bwbStartHalf();
    }
  }
  else{BW.selHitter=null;BW.selEdge=null;BW._signStolen=false;BW._scouted=null;if(typeof bwbCpuCoach==='function')bwbCpuCoach();if(bwbYouBat()){bwbCpuMaybeSwap();const d=bwbDef();BW.committedPitch=bwbCpuPitch(d.pitcher);BW.pdEdge=bwbCpuPitEdge(d);BW.phase='swing';}else BW.phase='pitch';}
  screenBwBattle();
}
function bwbSelHit(i){if(!(bwbYouBat()&&BW.phase==='swing'))return;BW.selHitter=BW.you.hand[i];screenBwBattle();}
function bwbSelEdge(id){const e=BW.you.phand.find(x=>x.id===id);BW.selEdge=(BW.selEdge&&BW.selEdge.id===id)?null:e;screenBwBattle();}
function bwbChangePitcher(){
  if(bwbYouBat())return;const s=BW.you;
  if((s._pcLeft==null?1:s._pcLeft)<=0){toast('No pitching changes left.');return;}
  if(!s.pitchers.length)s.pitchers=shuffle(s.allP.slice());
  let np=s.pitchers.shift();if(np&&s.pitcher&&np.id===s.pitcher.id&&s.pitchers.length){s.pitchers.push(np);np=s.pitchers.shift();}
  if(np){np._inn=BW.inning;np._runsInn=0;np._eff={FB:100,OFF:100,BR:100};np._coachWear=(s._closer?(1-s._closer*0.1):1);s.pitcher=np;}
  s._pcLeft=(s._pcLeft==null?1:s._pcLeft)-1;BW.selEdge=null;toast(`New arm: ${np?np.name:'reliever'} — a random draw.`);screenBwBattle();
}
function bwbRedrawEdges(){
  const s=BW.you;
  if((s._edLeft==null?1:s._edLeft)<=0){toast('No Edge redraws left.');return;}
  s.peds=shuffle(s.peds.concat(s.phand));s.phand=[];
  while(s.phand.length<(s._edgeHand||3)&&s.peds.length)s.phand.push(s.peds.shift());
  s._edLeft=(s._edLeft==null?1:s._edLeft)-1;BW.selEdge=null;toast('Edge hand redrawn.');screenBwBattle();
}
function bwbDia(){const b=BW.bases;return `<div class="bwb-dia"><div class="bwb-bs" style="top:0;left:15px;${b[1]?'':''}${b[1]?'background:var(--gold);border-color:var(--gold)':''}"></div><div class="bwb-bs" style="top:15px;left:30px;${b[0]?'background:var(--gold);border-color:var(--gold)':''}"></div><div class="bwb-bs" style="top:15px;left:0;${b[2]?'background:var(--gold);border-color:var(--gold)':''}"></div><div class="bwb-bs" style="top:30px;left:15px;background:var(--line)"></div></div>`;}
function bwbStacks(s){const st=(c,l,cls)=>`<div class="bwb-stack ${cls||''}"><span class="c">${c}</span><span class="l">${l}</span></div>`;return `<div class="bwb-decks">${st(s.hitters.length,'Bats')}${st(s.pitchers.length,'Arms')}${st(s.peds.length,'Edges','ped')}</div>`;}
function bwbPitchBtn(p,k,ic,lbl){
  const kind={FB:'ball carries',OFF:'weak contact',BR:'whiffs · risky'}[k];
  const rate=k==='FB'?p.fb:k==='BR'?(p.br||0):p.off;
  const eff=p._eff?(p._eff[k]==null?100:p._eff[k]):100;
  const mb=Math.round(bwbMeatballPct(p,k));
  const col=eff>60?'var(--green)':eff>32?'var(--amber)':'var(--red)';
  return `<button class="bwb-pitchbtn" onclick="bwbCommitPitch('${k}')"><div class="pb-h">${ic} ${lbl} <b>${rate}</b></div><div class="pb-kind">${kind}</div><div class="pb-bar"><div style="width:${eff}%;background:${col}"></div></div><div class="pb-mb" style="color:${mb>=15?'var(--red)':'var(--dim)'}">${mb>0?'\u26a0 '+mb+'% meatball':'fresh'}</div></button>`;
}
function bwbTendency(){
  const L=BW._pitchLog||{FB:0,OFF:0,BR:0},ic={FB:'🔥',OFF:'💨',BR:'🌀'},pred=bwbPredictedPitch();
  return `<div class="bwb-tend">Your mix \u2014 ${['FB','OFF','BR'].map(k=>`${ic[k]} ${L[k]}`).join(' · ')}${pred?` <span style="color:var(--red)">\u00b7 they're sitting ${ic[pred]}</span>`:''}</div>`;
}
function bwbOppTendency(){
  const L=BW._cpuPitchLog||{FB:0,OFF:0,BR:0},ic={FB:'🔥',OFF:'💨',BR:'🌀'},tot=L.FB+L.OFF+L.BR;
  if(!tot)return `<div class="bwb-tend">No book on him yet \u2014 first pitch of the game.</div>`;
  const a=[['FB',L.FB],['OFF',L.OFF],['BR',L.BR]].sort((x,y)=>y[1]-x[1]),lean=(a[0][1]/tot>=0.45)?a[0][0]:null;
  return `<div class="bwb-tend">He has thrown \u2014 ${['FB','OFF','BR'].map(k=>`${ic[k]} ${L[k]}`).join(' · ')}${lean?` <span style="color:var(--gold)">\u00b7 loves the ${ic[lean]}</span>`:''}</div>`;
}
function bwbBug(yb){
  const outs=[0,1,2].map(i=>`<span class="bwb-od ${i<BW.outs?'on':''}"></span>`).join('');
  return `<div class="bwb-bug">
    <div class="bwb-bteam ${!yb?'bat':''}"><span class="rn${BW._runPulse==='cpu'?' pulse':''}" style="color:var(--blue)">${BW.cpu.runs}</span><span class="nm">${(BW.cpu.name||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}<small>${!yb?'AT BAT':'PITCHING'}</small></span></div>
    <div class="bwb-bmid">${bwbDia()}<div class="bwb-binn">${yb?'\u25b2 Top':'\u25bc Bot'} ${BW.inning}<span class="bwb-o">${outs}</span></div></div>
    <div class="bwb-bteam r ${yb?'bat':''}"><span class="nm">${bwTeam().logo} ${(BW.you.name||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}<small>${yb?'AT BAT':'PITCHING'}</small></span><span class="rn${BW._runPulse==='you'?' pulse':''}">${BW.you.runs}</span></div>
  </div>`;
}
function bwbActions(yb){
  const pcL=BW.you._pcLeft==null?1:BW.you._pcLeft,edL=BW.you._edLeft==null?1:BW.you._edLeft,canEdge=BW.you.phand.length&&!BW.over&&BW.phase!=='result';
  const arm=pcL<=0?`<button class="bwb-act used" disabled>\ud83d\udd01 No arms left</button>`
    :`<button class="bwb-act arm" ${yb?'disabled title="Only while you are pitching"':''} onclick="if(confirm('Bring in a new arm? Random reliever.'))bwbChangePitcher()">\ud83d\udd01 New Arm <small>${pcL} left</small></button>`;
  const edge=edL<=0?`<button class="bwb-act used" disabled>\ud83d\udd04 No redraws left</button>`
    :`<button class="bwb-act edge" ${canEdge?'':'disabled'} onclick="if(confirm('Redraw your Edge hand?'))bwbRedrawEdges()">\ud83d\udd04 Redraw Edges <small>${edL} left</small></button>`;
  return `<div class="bwb-actions">${arm}${edge}${bwbCoachBtn(yb)}</div>`;
}
function bwbCoachBtn(yb){
  const s=BW.you,k=s.coachK;if(!k)return '';
  if(['bullpen','edgeguru','deepbench','hitcoach','closer'].includes(k))
    return `<button class="bwb-act coach" disabled>\ud83e\udde2 ${s.coachName}<small>passive</small></button>`;
  const uses=s._coachUses||0;let lbl='',on=false;
  if(k==='signsteal'){lbl='\ud83d\udd0d Steal Sign';on=yb&&BW.phase==='swing'&&!BW._signStolen&&uses>0;}
  else if(k==='scout'){lbl='\ud83d\udd2d Scout Hitter';on=!yb&&BW.phase==='pitch'&&!BW._scouted&&uses>0;}
  else if(k==='moundvisit'){lbl='\u23f1\ufe0f Mound Visit';on=!yb&&BW.phase==='pitch'&&uses>0;}
  else if(k==='basecoach'){lbl='\ud83c\udfc3 Steal Base';on=yb&&BW.phase==='swing'&&uses>0&&!!(BW.bases[0]||BW.bases[1]||BW.bases[2]);}
  else if(k==='pinchhit'){lbl='\ud83d\udd04 Pinch Hitters';on=yb&&BW.phase==='swing'&&uses>0;}
  return `<button class="bwb-act coach" ${on?'onclick="bwbCoachAbility()"':'disabled'}>\ud83e\udde2 ${lbl} <small>${uses} left</small></button>`;
}
function bwbFan(cards,faceUp,selId,clickable){
  const n=cards.length,dim=faceUp&&!clickable,opp=!faceUp;
  return `<div class="bwb-fan ${clickable?'you':''} ${faceUp?'':'opp'} ${dim?'dim':''}">${cards.map((c,i)=>{
    let ang=(i-(n-1)/2)*5,lift=Math.abs(i-(n-1)/2)*6;   // the opponent holds from the top — mirror the fan toward them
    const inner=faceUp?bwbCardHTML(c):'<div class="bwb-back"><span>b<b>WAR</b></span></div>';
    return `<div class="bwb-slot ${selId&&c.id===selId?'sel':''}" style="transform:rotate(${ang}deg) translateY(${lift}px)" ${clickable?`onclick="bwbSelHit(${i})"`:''}>${inner}</div>`;
  }).join('')}</div>`;
}
function screenBwBattle(){
  clearTimers();bwEnsureStyles();bwbEnsureStyles();
  if(BW&&BW._begun)_fxSkip=true;BW._begun=1;
  const yb=bwbYouBat(),def=bwbDef(),off=bwbOff();
  let field='';
  if(BW.over){
    const won=BW.winner===BW.you,riv=BW.meta&&BW.meta.rivals;
    if(!BW._sfxEnd){BW._sfxEnd=1;sfx(won?'win':'lose');hap(won?[40,60,90]:30);}
    if(BW.meta&&!BW._rewarded){BW._rewarded=true;bwLogAdd(won);if(riv)bwReportDefense(won);if(won)BW._reward=riv?bwRivalsWin():bwGauntWin();else if(riv)BW._reward=bwRivalsLoss();}
    field=`<div class="bwb-pop" style="color:${won?'var(--gold)':'var(--red)'};font-size:26px">${won?'🏆 VICTORY':'DEFEAT'}</div>
      <div class="muted">Final — ${esc(bwTeam().logo)} ${esc(BW.you.name)} ${BW.you.runs}, ${esc(BW.cpu.name)} ${BW.cpu.runs}</div>
      ${won&&BW._reward?`<div style="margin-top:6px;color:var(--gold)" class="disp">🎁 Earned ${BW._reward.granted.length} ${BW._reward.boss?BW._reward.tierName+' ':''}pack${BW._reward.granted.length>1?'s':''}!</div>
      <div style="margin-top:3px;color:var(--gold)" class="disp">${BW._reward.coins?`💎 +<span id="bwrc">${BW._reward.coins}</span> · `:''}🎖️ +${BW._reward.xp.xp} GM XP${BW._reward.xp.leveled?` · LEVEL UP → ${BW._reward.xp.to}!`:''}</div>`:''}
      ${!won&&riv&&BW._reward?`<div style="margin-top:6px;color:var(--amber)" class="disp">💎 +<span id="bwrc">${BW._reward.coins}</span> · 🎖️ +${BW._reward.xp.xp} GM XP${BW._reward.xp.leveled?` · LEVEL UP → ${BW._reward.xp.to}!`:''}</div><div class="small muted">Tough loss — still some coin and XP for showing up.</div>`:''}
      <div style="display:flex;gap:8px;margin-top:10px">${won?`<button class="btn primary" onclick="${riv?'screenRivals()':'screenGauntlet()'}">Continue ▸</button>`:`<button class="btn primary" onclick="${riv?'screenRivals()':'bwGauntFight()'}">${riv?'↻ Find another':'↻ Retry'}</button><button class="btn ghost" onclick="${riv?'screenRivals()':'screenGauntlet()'}">Back</button>`}</div>`;
  } else if(BW.phase==='result'){
    const r=BW.last,pi=r.pitch==='FB'?{ic:'🔥',l:'FASTBALL',c:'var(--amber)'}:r.pitch==='BR'?{ic:'🌀',l:'BREAKING',c:'var(--gold)'}:{ic:'💨',l:'OFFSPEED',c:'var(--blue)'};
    field=`<div class="bwb-pop" style="color:${pi.c}"><span class="ic">${pi.ic}</span>${pi.l}</div>
      <div class="bwb-dice"><div class="bwb-die roll" id="bwbd1">?</div><div class="bwb-die roll" id="bwbd2">?</div></div>
      <div class="bwb-math" id="bwbmath">${r.walk?`Natural roll <b>${r.roll}</b> — pitcher misses the zone · <span class="tot">ball four</span>`:`Roll: <b>${r.roll}</b> + vs${r.pitch==='FB'?'🔥':r.pitch==='BR'?'🌀':'💨'} <b>${r.hv}</b> − ${r.pitch==='FB'?'🔥':r.pitch==='BR'?'🌀':'💨'} <b>${r.pr}</b>${r.hb?` + <b style="color:var(--gold)">${r.hb}</b>`:''}${r.pb?` − <b style="color:var(--red)">${r.pb}</b>`:''} = <span class="tot">${r.total}</span>${r.tags.length?` <span class="muted" style="font-size:11px">[${r.tags.join(' · ')}]</span>`:''}`}</div>
      <div class="bwb-outc" id="bwboutc" style="color:${r.walk?'var(--amber)':r.bases>=3||r.ejected?'var(--gold)':r.bases?'var(--green)':'var(--red)'}">${r.label}</div>
      <div class="muted" id="bwbsub" style="min-height:16px"></div>
      <button class="btn primary" id="bwbnext" style="opacity:0" onclick="bwbNext()">Next ▸</button>`;
  } else if(yb){
    field=`<div class="sectlbl">On the mound · ${def.name}</div>${bwbCardHTML(def.pitcher)}
      ${bwbOppTendency()}
      ${BW._signStolen?`<div class="disp" style="color:var(--gold);font-size:13px">🔍 Sign stolen — it's a ${BW.committedPitch==='FB'?'🔥 Fastball':BW.committedPitch==='BR'?'🌀 Breaking ball':'💨 Offspeed'}!</div>`:''}
      <div class="muted" style="font-size:12px">Pitch is <b>hidden</b> — pick a bat${BW.you.phand.some(e=>e.side==='H')?' (or spend an Edge)':''}.</div>
      <button class="btn primary" ${BW.selHitter?'':'disabled'} onclick="bwbSwing()">${BW.selHitter?`Send ${BW.selHitter.name} ▸`:'Pick a hitter…'}</button>`;
  } else {
    field=`<div class="sectlbl">You're pitching · ${def.pitcher.name}</div>${bwbCardHTML(def.pitcher)}
      <div class="muted" style="font-size:12px">Hitter is blind — pick your pitch${BW.you.phand.some(e=>e.side==='P')?' (Edge below)':''}. Overusing one risks a meatball.</div>
      <div class="bwb-pitchrow">${bwbPitchBtn(def.pitcher,'FB','🔥','Fastball')}${bwbPitchBtn(def.pitcher,'OFF','💨','Offspeed')}${bwbPitchBtn(def.pitcher,'BR','🌀','Breaking')}</div>
      ${BW._scouted?`<div class="disp" style="color:var(--gold);font-size:12px">🔭 Scouted: ${String(BW._scouted.name).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))} (${BW._scouted.pos}) steps in</div>`:''}
      ${bwbTendency()}`;
  }
  // your Edge hand (only the relevant side is actionable this turn)
  const pedSide=yb?'H':'P';const canPed=(yb&&BW.phase==='swing')||(!yb&&BW.phase==='pitch');
  const pedsHTML=BW.you.phand.length?`<div class="bwb-peds" style="margin-top:8px">${BW.you.phand.map(e=>{const usable=canPed&&e.side===pedSide;return `<span class="bwb-ped ${e.side==='P'?'pit':''} ${usable?'':'dim'} ${BW.selEdge&&BW.selEdge.id===e.id?'sel':''}" ${usable?`onclick="bwbSelEdge('${e.id}')"`:''}>${e.name} · ${e.d}</span>`;}).join('')}</div>`:'';
  const oppMeta=BW.meta?(BW.meta.rivals?`🌐 Rivals · GM Lv ${BW.meta.oppLevel||'?'}`:`${BW.meta.boss?'👑 BOSS · ':''}${BW_TIERS[BW.meta.tier].name} ${BW.meta.boss?'':'#'+(BW.meta.step+1)}`):'';
  if(BW.over&&BW._reward&&BW._reward.coins)setTimeout(()=>countUp('bwrc',BW._reward.coins,''),50);
  render(`<div class="topbar"><img class="brandlogo" src="${LOGO_WIDE}" alt="Tank Commander"><div class="topbar-r"><button class="btn ghost sm" onclick="showBwRules()">📖 Rules</button> <button class="btn ghost sm" onclick="if(confirm('Forfeit this battle?'))screenGauntlet()">✕ Forfeit</button></div></div>
    ${bwbBug(yb)}
    <div class="center small muted" style="margin:0 0 8px;font-family:var(--disp);letter-spacing:.06em;text-transform:uppercase;font-size:10px">${oppMeta} · mercy-rule innings</div>
    ${bwbTutTip(yb)}
    <div class="bwb-zlbl">${esc(BW.cpu.name)} · ${BW.cpu.hand.length} in hand</div>
    ${bwbStacks(BW.cpu)}
    ${bwbFan(BW.cpu.hand,false,null,false)}
    <div class="bwb-field">${field}</div>
    ${bwbFan(BW.you.hand,true,BW.selHitter&&BW.selHitter.id,yb&&BW.phase==='swing')}
    ${pedsHTML}
    ${bwbActions(yb)}
    <div class="bwb-zlbl" style="margin-top:12px">Your decks</div>
    ${bwbStacks(BW.you)}
    <div class="bwb-legend">🔥 Fastball · 💨 Offspeed · 🌀 Breaking · <b style="color:var(--green)">CON</b> contact (easier hits) · <b style="color:var(--red)">PWR</b> +1 base on hits · <b style="color:var(--blue)">WHIFF</b> strikeout stuff · <b style="color:var(--amber)">GB</b> kills extra-base hits</div>`);
  _atTitle=true;ensureNavBtns();
  setTimeout(()=>{BW._runPulse=null;},600);
  if(BW.phase==='result'&&!BW.over)bwbAnimate();
}

/* ---- first-battle coach tips (one line, dismissible, flag-guarded) ---- */
function bwbTutTip(yb){
  const bw=bwState();if(bw._tut||BW.over)return '';
  const msg=BW.phase==='result'
    ?'🎓 The math: 2d6 + hitter vs that pitch − pitcher\'s rating. 8+ is a hit, 14+ leaves the yard.'
    :yb
    ?'🎓 The pitch is <b>hidden</b> — tap a hitter below, check their vs🔥/vs💨/vs🌀 ratings, then send them up.'
    :'🎓 You pick the pitch — but <b>mix it up</b>. Leaning on one wears it down and risks a 🍖 meatball.';
  return `<div class="small" style="display:flex;gap:8px;align-items:center;background:var(--panel2);border:1px solid var(--line2);border-left:3px solid var(--gold);border-radius:4px;padding:7px 10px;margin:0 0 8px"><span style="flex:1;min-width:0">${msg}</span><button class="btn ghost sm" style="flex-shrink:0" onclick="PROFILE.bw._tut=1;saveProfile();screenBwBattle()">Got it</button></div>`;
}
function bwbAnimate(){
  const r=BW.last;
  sfx('dice');
  const t0=setTimeout(()=>{let tick=setInterval(()=>{const a=document.getElementById('bwbd1'),b=document.getElementById('bwbd2');if(a)a.textContent=rint(1,6);if(b)b.textContent=rint(1,6);},80);window._bwTimers.push(tick);
    const settle=setTimeout(()=>{clearInterval(tick);const a=document.getElementById('bwbd1'),b=document.getElementById('bwbd2');if(a){a.textContent=r.d1;a.classList.remove('roll');}if(b){b.textContent=r.d2;b.classList.remove('roll');}},850);window._bwTimers.push(settle);},650);
  const tM=setTimeout(()=>{const m=document.getElementById('bwbmath');if(m)m.style.opacity=1;},1650);
  const tO=setTimeout(()=>{const _s=r.walk?'walk':(r.ejected||r.bases===0)?((BW.pending&&BW.pending.isK)?'strikeout':'yourout'):r.bases>=4?'hr':['out','single','double','triple'][Math.min(3,r.bases)];sfx(_s);if(_s==='hr')hap(35);if(r.meatball&&r.bases>=1)sfx('meatball');bwbApply();const o=document.getElementById('bwboutc');if(o)o.style.opacity=1;const sub=document.getElementById('bwbsub');if(sub)sub.textContent=BW.lastMsg;const nb=document.getElementById('bwbnext');if(nb){nb.style.opacity=1;nb.textContent=BW.over?'See result ▸':BW.outs>=3?'Change sides ▸':'Next batter ▸';}if(BW.over)screenBwBattle();},2050);
  window._bwTimers.push(t0,tM,tO);
}
// ---- gauntlet flow ----
function bwGauntFight(){
  const g=bwGaunt(),d=PROFILE.bw.deck;
  if(d.h.length!==30||d.p.length!==10||d.e.length!==12){toast('Finish your 30/10/12 deck first.');screenPlatoon('deck');return;}
  if(g.tier>3){screenGauntlet();return;}
  const boss=g.step>=8,cpu=bwCpuDeck(g.tier,g.step);
  const oppName=boss?BW_BOSS[g.tier]:BW_OPP[BW_TIERS[g.tier].k][g.step];
  const youCards={h:d.h.map(bwCardById).filter(Boolean).map(bwbCard),p:d.p.map(bwCardById).filter(Boolean).map(bwbCard),e:d.e.map(bwCardById).filter(Boolean).map(bwbCard),coach:(d.coach&&bwOwned(d.coach))?bwCardById(d.coach):null};
  const oppCards={h:cpu.h.map(bwbCard),p:cpu.p.map(bwbCard),e:cpu.e.map(bwbCard),coach:bwCoachOfRar(Math.max(0,Math.min(4,g.tier)))};
  bwPreMatch(youCards,oppCards,{tier:g.tier,step:g.step,boss,oppName,oppLogo:boss?'\ud83d\udc51':BW_TIERS[g.tier].ring},{teamName:oppName,teamLogo:boss?'\ud83d\udc51':BW_TIERS[g.tier].ring});
}
function bwGauntWin(){
  const g=bwGaunt(),bw=bwState(),boss=BW.meta.boss,tier=BW.meta.tier,step=BW.meta.step||0;let granted=[];
  // Diamond Coins: regular opponents pay 2→10 (scaling across the whole gauntlet); bosses pay a big bonus.
  let coins;
  if(boss){g.rings[tier]=true;const nt=PACK_TIERS[Math.min(3,tier+1)];for(let i=0;i<5;i++)granted.push(nt);g.tier=tier+1;g.step=0;coins=50+tier*25;}
  else{granted.push(PACK_TIERS[tier]);g.step=g.step+1;coins=Math.min(10,2+tier*2+Math.round(step/7*2));}
  bw.coins=(bw.coins||0)+coins;
  bw.packs=bw.packs.concat(granted);saveProfile();
  const xpRes=bwAddBattleXP(boss?(120+tier*20):(30+tier*5));   // winning earns GM XP — generous, and scales with battlefield tier
  return {granted,boss,tier,coins,tierName:BW_TIERS[Math.min(3,tier+(boss?1:0))].name,xp:xpRes};
}
function bwAgo(t){const d=Date.now()-t,m=Math.floor(d/60000);if(m<1)return'just now';if(m<60)return m+'m ago';const h=Math.floor(m/60);if(h<24)return h+'h ago';return Math.floor(h/24)+'d ago';}
function bwLogAdd(won){
  const m=BW.meta||{},bw=bwState();
  if(!bw.log)bw.log=[];
  bw.log.unshift({opp:BW.cpu.name,logo:m.oppLogo||'\ud83c\udfaf',mode:m.rivals?'rivals':(m.boss?'boss':'gauntlet'),you:BW.you.runs,them:BW.cpu.runs,won:!!won,inn:BW.inning,ts:Date.now()});
  bw.log=bw.log.slice(0,15);saveProfile();
}
let _bwStatMode='gaunt';
function bwFmtAvg(n){if(!isFinite(n))return '.000';let str=n.toFixed(3);return n<1?str.replace(/^0/,''):str;}
function bwFmtIP(outs){return Math.floor(outs/3)+'.'+(outs%3);}
function bwFmtERA(ra,outs){if(!outs)return ra>0?'∞':'0.00';return (ra*27/outs).toFixed(2);}
function bwStatMode(m){_bwStatMode=m;screenPlatoon('stats');}
function screenBwStats(){screenPlatoon('stats');}   // back-compat alias → opens the Stats tab
function bwStatsTab(){
  bwEnsureStyles();
  const mode=_bwStatMode,all=PROFILE.bw.cardStats||{};
  const hit=[],pit=[];
  Object.keys(all).forEach(id=>{
    const st=all[id]&&all[id][mode];if(!st)return;
    const card=bwCardById(id);if(!card)return;
    if(card.t==='H'){if(st.ab>0)hit.push({card,st});}
    else if(card.t==='P'){if(st.outs>0||st.ha>0||st.ra>0)pit.push({card,st});}
  });
  hit.sort((a,b)=>b.st.h-a.st.h||b.st.hr-a.st.hr);
  pit.sort((a,b)=>b.st.outs-a.st.outs);
  const tag=(m,l)=>`<button class="btn ${mode===m?'primary':'ghost'} sm" onclick="bwStatMode('${m}')">${l}</button>`;
  const nm=c=>`<span style="white-space:nowrap">${String(c.name).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}</span>`;
  let hitTbl;
  if(hit.length){
    const rows=hit.map(({card,st})=>{
      const bb=st.bb||0,singles=st.h-st.b2-st.b3-st.hr,tb=singles+st.b2*2+st.b3*3+st.hr*4,pa=st.ab+bb;
      const avg=st.ab?st.h/st.ab:0,obp=pa?(st.h+bb)/pa:0,slg=st.ab?tb/st.ab:0,ops=obp+slg;
      return `<tr><td style="text-align:left">${nm(card)}</td><td>${st.ab}</td><td>${st.h}</td><td>${st.b2}</td><td>${st.b3}</td><td>${st.hr}</td><td>${st.r}</td><td>${st.rbi}</td><td>${bb}</td><td>${bwFmtAvg(avg)}</td><td>${bwFmtAvg(obp)}</td><td>${bwFmtAvg(slg)}</td><td>${bwFmtAvg(ops)}</td></tr>`;
    }).join('');
    hitTbl=`<div style="overflow-x:auto;-webkit-overflow-scrolling:touch"><table class="bwstat"><thead><tr><th style="text-align:left">Hitter</th><th>AB</th><th>H</th><th>2B</th><th>3B</th><th>HR</th><th>R</th><th>RBI</th><th>BB</th><th>AVG</th><th>OBP</th><th>SLG</th><th>OPS</th></tr></thead><tbody>${rows}</tbody></table></div>`;
  } else hitTbl='<p class="muted" style="padding:10px">No hitter at-bats logged in this mode yet.</p>';
  let pitTbl;
  if(pit.length){
    const rows=pit.map(({card,st})=>{const bba=st.bba||0,whip=st.outs?((st.ha+bba)*3/st.outs):0;
      return `<tr><td style="text-align:left">${nm(card)}</td><td>${bwFmtIP(st.outs)}</td><td>${st.ha}</td><td>${st.ra}</td><td>${bba}</td><td>${st.k}</td><td>${bwFmtERA(st.ra,st.outs)}</td><td>${st.outs?whip.toFixed(2):'—'}</td></tr>`;}).join('');
    pitTbl=`<div style="overflow-x:auto;-webkit-overflow-scrolling:touch"><table class="bwstat"><thead><tr><th style="text-align:left">Pitcher</th><th>IP</th><th>H</th><th>R</th><th>BB</th><th>K</th><th>ERA</th><th>WHIP</th></tr></thead><tbody>${rows}</tbody></table></div>`;
  } else pitTbl='<p class="muted" style="padding:10px">No pitcher innings logged in this mode yet.</p>';
  return `<div class="center" style="margin-bottom:10px"><p class="small muted" style="margin:0 0 6px">Lifetime stat lines for every card you've played, split by battle mode.</p>
      <div style="display:flex;gap:6px;justify-content:center">${tag('gaunt','⚔️ Gauntlet')}${tag('rivals','🌐 Rivals')}</div></div>
    <div class="panel"><div class="sectlbl" style="margin-bottom:6px">⚾ Hitters</div>${hitTbl}</div>
    <div class="panel"><div class="sectlbl" style="margin-bottom:6px">🔥 Pitchers</div>${pitTbl}</div>`;
}
function screenBwLog(){
  bwState();bwEnsureStyles();
  const log=PROFILE.bw.log||[];
  const wins=log.filter(e=>e.won).length;
  const rows=log.length?log.map(e=>{
    const mlab=e.mode==='rivals'?'\ud83c\udf10 Rivals':e.mode==='boss'?'\ud83d\udc51 Boss':'\u2694\ufe0f Gauntlet';
    return `<div style="display:flex;align-items:center;gap:8px;padding:9px 10px;border-bottom:1px solid var(--line)">
      <span style="font-size:20px">${esc(e.logo)}</span>
      <span style="flex:1;min-width:0"><b style="word-break:break-word">${String(e.opp).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}</b><br><span class="small muted">${mlab} \u00b7 ${bwAgo(e.ts)}</span></span>
      <span class="disp" style="font-size:15px;color:${e.won?'var(--green)':'var(--red)'};text-align:right">${e.won?'W':'L'}<br><span style="color:var(--ink);font-size:13px">${e.you}\u2013${e.them}</span></span>
    </div>`;}).join(''):'<p class="muted center" style="padding:18px">No games yet — head to the Gauntlet or Rivals to start your record.</p>';
  render(`${topBar(`<button class="btn ghost sm" onclick="screenGauntlet()">\u2694\ufe0f Gauntlet</button> <button class="btn ghost sm" onclick="screenRivals()">\ud83c\udf10 Rivals</button>`)}
    <div class="panel center" style="border-color:var(--gold)"><div class="pill gold">\ud83d\udcdc GAME LOG</div>
      <p class="sub" style="margin-top:6px">Your last ${Math.min(15,log.length||0)||15} battles${log.length?` \u00b7 <b style="color:var(--gold)">${wins}\u2013${log.length-wins}</b> in this stretch`:''}.</p></div>
    <div class="panel" style="padding:0;overflow:hidden">${rows}</div>`);
  _atTitle=true;ensureNavBtns();
}
function screenGauntlet(){
  bwState();bwEnsureStyles();bwbEnsureStyles();const g=bwGaunt();
  const d=PROFILE.bw.deck,valid=d.h.length===30&&d.p.length===10&&d.e.length===12;
  const champion=g.tier>3;
  const ringRow=BW_TIERS.map((t,i)=>`<span style="font-size:22px;${g.rings[i]?'':'filter:grayscale(1);opacity:.35'}">${t.ring}</span>`).join(' ');
  let ladder='';
  if(!champion){
    const T=BW_TIERS[g.tier];
    for(let s=0;s<=8;s++){
      const done=s<g.step,cur=s===g.step,boss=s===8;
      const name=boss?BW_BOSS[g.tier]:BW_OPP[T.k][s];
      ladder+=`<div class="gnode ${done?'done':''} ${cur?'cur':''} ${boss?'boss':''}"><span class="gn" style="${boss?'color:var(--red)':''}">${boss?'👑 ':''}${name}</span><span class="gs">${done?'✓ beaten':cur?'▶ next':boss?'BOSS':'opp #'+(s+1)}</span></div>`;
    }
  }
  render(`${topBar(`<button class="btn ghost sm" onclick="screenRivals()">🌐 Rivals</button> <button class="btn ghost sm" onclick="screenBwLog()">📜 Log</button> <button class="btn ghost sm" onclick="screenPlatoon('deck')">🃏 Deck</button>`)}
    <div class="panel center" style="border-color:var(--gold)"><div class="pill gold">⚔️ bWARfare GAUNTLET</div>
      <p class="sub" style="margin-top:6px">Climb four battlefields — beat 8 opponents, then the boss, to win each ring. Every win earns packs; bosses pay out big.</p>
      <div style="margin-top:8px">${ringRow}</div></div>
    ${champion?`<div class="panel center"><div class="disp" style="font-size:22px;color:var(--gold)">🏆 GRAND CHAMPION</div><p class="sub">You've claimed all four rings and toppled the Diamond Dynasty. Legendary.</p></div>`:
      `<div class="panel"><div class="row" style="align-items:center;justify-content:space-between"><h3 style="margin:0">${BW_TIERS[g.tier].ring} ${BW_TIERS[g.tier].name} Battlefield</h3>
        <span class="small muted">Reward: ${g.step>=8?'beat the boss → 5 '+(PACK_TIERS[Math.min(3,g.tier+1)])+' packs':'win → 1 '+PACK_TIERS[g.tier]+' pack'}</span></div>
        <div style="margin-top:10px">${ladder}</div>
        <div class="center" style="margin-top:12px">${valid?`<button class="btn primary" onclick="bwGauntFight()">⚔️ Battle ${g.step>=8?BW_BOSS[g.tier]:BW_OPP[BW_TIERS[g.tier].k][g.step]} ▸</button>`:`<button class="btn" disabled>Build a full deck first</button> <button class="btn ghost" onclick="screenPlatoon('deck')">Go to Deck</button>`}</div></div>`}`);
  _atTitle=true;ensureNavBtns();
}

// ---- GM level dial (270deg gauge, like the owner fan dial) ----
function gmLevelDial(size){
  size=size||104;const L=plLevel(),xp=PROFILE.xp||0,cur=xpForLevel(L),next=xpForLevel(L+1);
  const pct=L>=MAX_LEVEL?100:clamp(Math.round((xp-cur)/(next-cur)*100),0,100);
  const cx=size/2,cy=size/2,r=size*0.38,sw=size*0.075,a0=Math.PI*0.75,a1=Math.PI*2.25,span=a1-a0;
  const pol=(a,rr)=>[cx+rr*Math.cos(a),cy+rr*Math.sin(a)];
  const arcP=(s2,e,rr)=>{const[x0,y0]=pol(s2,rr),[x1,y1]=pol(e,rr);const lg=Math.abs(e-s2)>Math.PI?1:0;return `M${x0.toFixed(1)} ${y0.toFixed(1)} A${rr.toFixed(1)} ${rr.toFixed(1)} 0 ${lg} 1 ${x1.toFixed(1)} ${y1.toFixed(1)}`;};
  let ticks='';for(let i=0;i<=10;i++){const a=a0+span*(i/10),r2=r-(i%5===0?sw:sw*0.6),[x1,y1]=pol(a,r),[x2,y2]=pol(a,r2);ticks+=`<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${i%5===0?'#7d8a44':'#4a5330'}" stroke-width="${i%5===0?2:1}"/>`;}
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <path d="${arcP(a0,a1,r)}" stroke="#333b22" stroke-width="${sw.toFixed(1)}" fill="none"/>
    <path d="${arcP(a0,a0+span*(pct/100),r)}" stroke="var(--gold)" stroke-width="${sw.toFixed(1)}" fill="none" stroke-linecap="round"/>
    ${ticks}
    <text x="${cx}" y="${(cy+size*0.05).toFixed(1)}" text-anchor="middle" font-family="'Chakra Petch',sans-serif" font-weight="700" font-size="${(size*0.30).toFixed(0)}" fill="var(--gold)">${L}</text>
    <text x="${cx}" y="${(cy+size*0.20).toFixed(1)}" text-anchor="middle" font-family="'Chakra Petch',sans-serif" font-size="${(size*0.085).toFixed(0)}" fill="var(--dim)" letter-spacing="1">GM LEVEL</text>
  </svg>`;
}
// ---- rules overlays ----
function _rulesOverlay(title,html,wide){
  const old=document.getElementById('saveov');if(old)old.remove();
  const ov=document.createElement('div');ov.id='saveov';ov.className='saveov';
  ov.innerHTML=`<div class="savebox" style="max-width:${wide||620}px">
    <div class="row" style="align-items:center"><h3 style="flex:1;margin:0">${title}</h3><button class="btn ghost sm" onclick="document.getElementById('saveov').remove()">✕</button></div>
    <div style="margin-top:10px;font-size:13px;line-height:1.52">${html}</div></div>`;
  document.body.appendChild(ov);
}
function showBwRules(){
  _rulesOverlay('📖 bWARfare — How to play',`
    <p><b>Goal.</b> Outscore your opponent. A game ends by <b>mercy rule</b> at the end of a completed inning when you lead by <b>15 after 3+ innings</b>, <b>10 after 5+</b>, or <b>8 after 7+</b>. Otherwise it's a standard <b>9-inning</b> game; a tie after 9 goes to extra innings until someone leads after a full inning.</p>
    <p><b>Your deck.</b> 30 hitters, 10 pitchers, and a 12-card Player Edge Deck.</p>
    <p><b>The at-bat.</b> The pitcher commits 🔥 Fastball, 💨 Offspeed, or 🌀 Breaking (hidden). You send a hitter and may spend one Edge. Then:<br><b>Roll 2 dice + your hitter\'s vs-(pitch thrown) − the pitcher\'s rating in that pitch + Edge bonuses.</b></p>
    <p><b>The ladder.</b> ≤7 out · 8–9 single · 10–11 double · 12–13 triple · 14+ home run.</p>
    <p><b>Pitch types.</b> 🔥 <b>Fastball</b> — the ball carries, so contact does more damage. 💨 <b>Offspeed</b> — weak contact that suppresses extra-base hits. 🌀 <b>Breaking</b> — the most swing-and-miss, but a hung breaking ball is the biggest meatball.</p>
    <p><b>Pitch effectiveness &amp; meatballs.</b> Each pitch has an effectiveness gauge that <b>drops the more you throw it</b> (and recovers when you throw something else). The lower it gets, the higher the chance of a <b>🍖 meatball</b> — a hung pitch the hitter crushes (+4). High-OVR arms are protected and wear slower; a fresh arm takes over each inning.</p>
    <p><b>The read.</b> Your opponent watches your pitch tendencies <i>during the game</i> and starts <b>sitting on your go-to pitch</b> — so mix it up, or you will get predicted and tagged. (This holds in Rivals too; the ghost is piloted live.)</p>
    <p><b>Walks.</b> When the two dice come up low — a natural <b>2 or 3</b> — the pitcher misses the zone and the batter takes a <b>walk</b> (a disciplined <b style="color:var(--green)">CON</b> hitter also walks on a 4; a <b style="color:var(--blue)">WHIFF</b> arm erases the 3). Walks force in runs only with the bases loaded, and count toward OBP but not batting average.</p>
    <p><b>Abilities shift the ladder.</b><br>Hitter <b style="color:var(--green)">CON</b>: the out line drops by 1 (7–9 is a single). <b style="color:var(--red)">PWR</b>: +1 base on any hit.<br>Pitcher <b style="color:var(--blue)">WHIFF</b>: the out line rises by 1 (only a 9 singles). <b style="color:var(--amber)">GB</b>: every extra-base hit drops a base and homers need 15+.</p>
    <p><b>HOF abilities.</b> Every Hall of Fame card carries a signature passive shown on the card — <b>Ace</b>, <b>Untouchable</b>, <b>Strikeout Artist</b>, <b>Bulldog</b> (pitchers) and <b>Pure Hitter</b>, <b>No Holes</b>, <b>Launcher</b>, <b>Clutch</b> (hitters). Worth chasing.</p>
    <p><b>Coaches.</b> Equip one Coach (a 30-card sub-set, Common to HOF) for a game-changing edge — extra pitcher swaps or Edge redraws, a bigger Edge hand, stealing bases, sign-stealing the pitch, mound visits that reset pitch wear, and more. The ability gets stronger with the coach rarity, and your Rivals opponents bring their own coach too.</p>
    <p><b>Base running.</b> A single scores runners from 2nd and 3rd; a double clears the corners; triples and homers clear the bases.</p>
    <p><b>Once per game</b> you may make <b>one pitching change</b> (a random new arm) and <b>one Edge redraw</b> (a fresh hand of Edges).</p>
    <p><b>Flow.</b> Three outs flip sides; a fresh pitcher takes the mound each inning. The home team bats last, so if they take the lead in the <b>bottom of the 9th (or extras)</b> — or cross the mercy margin — it's a <b>walk-off</b> and the game ends on the spot. The CPU will burn its one bullpen call the instant its pitcher gives up <b>6+ runs in an inning</b>.</p>
    <p><b>The Gauntlet &amp; rewards.</b> Climb four battlefields (Bronze → Diamond), each 8 opponents + a boss. Beating an opponent earns a pack; beating a boss earns <b>5 next-tier packs + a ring</b>. <b>Every win grants GM XP</b> (bosses give more).</p>`);
}
function showGameRules(){
  _rulesOverlay('📖 Rules &amp; Modes',`
    <div class="sectlbl" style="margin:6px 0 4px">⚡ 6-Year Sprint</div>
    <p class="small muted" style="margin:0">Inherit a washed-up club and get six seasons to build a 100-win contender — graded out of 100 at the end.</p>
    <details style="margin:5px 0"><summary class="small" style="cursor:pointer;color:var(--gold)">How you\'re graded</summary><div style="margin-top:6px">${gradeRubric()}</div></details>
    <div class="sectlbl" style="margin:12px 0 4px">🔥 Hard Mode</div>
    <p class="small muted" style="margin:0">The 6-Year Sprint with a tougher league, real injuries to manage at extra in-season breaks, a deeper draft, and stricter grading — its own leaderboard.</p>
    <div class="sectlbl" style="margin:12px 0 4px">🪑 Career Mode</div>
    <p class="small muted" style="margin:0">Endless. Stay in the owner\'s favor — contend, manage the money, and ride the cycle of windows and rebuilds. Your score climbs until you\'re fired.</p>
    <details style="margin:5px 0"><summary class="small" style="cursor:pointer;color:var(--gold)">How the owner judges you</summary><div style="margin-top:6px">${survivorRubric()}</div></details>
    <div class="sectlbl" style="margin:12px 0 4px">💼 Owner Mode</div>
    <p class="small muted" style="margin:0">Spend $4B to buy a club and build a ballpark, hire your front office, steer your GM, set ticket/concession/merch prices, and grow the franchise\'s value. Endless — sell for profit or build a 50-year dynasty.</p>
    <div class="sectlbl" style="margin:12px 0 4px">⚔️ bWARfare</div>
    <p class="small muted" style="margin:0">A collectible card battle — collect Set 1, build a deck, and climb the gauntlet. <a onclick="showBwRules()" style="color:var(--gold);cursor:pointer;text-decoration:underline">Full battle rules ▸</a></p>`);
}
// ---- battle XP: winning grants GM XP (and any level-up rewards) ----
function bwAddBattleXP(amt){
  const before=plLevel();addXP(amt);const after=plLevel();
  const bw=bwState();let packs=[],coins=0;
  for(let L=before+1;L<=after;L++){packs.push(bwLevelTier(L));coins+=bwLevelCoins(L);}
  if(packs.length){bw.coins=(bw.coins||0)+coins;bw.packs=bw.packs.concat(packs);saveProfile();}
  if(after>before)setTimeout(()=>sfx('levelup'),700);
  return {xp:amt,leveled:after>before,to:after,packs:packs.length,coins};
}
// ---- team identity + deck rating ----
function bwTeam(){const bw=bwState();if(!bw.team)bw.team={name:((typeof authState==='function'&&authState()&&authState().username))||'My Club',logo:'\u26be'};if(!bw.team.name)bw.team.name='My Club';if(!bw.team.logo)bw.team.logo='\u26be';return bw.team;}
function bwDeckRatingCards(d){if(!d)return 0;const ps=(d.h||[]).concat(d.p||[]).filter(c=>c&&typeof c.ov==='number');if(!ps.length)return 0;return Math.round(ps.reduce((s,c)=>s+c.ov,0)/ps.length);}
function bwDeckRatingIds(deck){if(!deck)return 0;const h=(deck.h||[]).map(bwCardById).filter(Boolean),p=(deck.p||[]).map(bwCardById).filter(Boolean);return bwDeckRatingCards({h,p});}
// ---- pre-match marquee (gauntlet or rivals) ----
let _pendingMatch=null;
function bwPreMatch(youCards,oppCards,meta,oppInfo){
  _pendingMatch={you:youCards,opp:oppCards,meta};
  bwEnsureStyles();bwbEnsureStyles();
  const t=bwTeam(),rv=PROFILE.bw.rivals||{rating:0,wins:0,losses:0},rivals=!!meta.rivals;
  const yR=bwDeckRatingCards(youCards),oR=bwDeckRatingCards(oppCards);
  const oName=oppInfo.teamName||oppInfo.name||'Rival',oLogo=oppInfo.teamLogo||'\ud83c\udfaf';
  const side=(logo,name,deckR,extra)=>`<div style="flex:1;min-width:130px;text-align:center">
    <div style="font-size:46px;line-height:1">${esc(logo)}</div>
    <div class="disp" style="font-weight:700;font-size:15px;margin-top:4px;word-break:break-word">${String(name).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}</div>
    <div class="small" style="margin-top:5px">Deck OVR <b style="color:var(--gold)">${deckR}</b></div>${extra||''}</div>`;
  const youExtra=`<div class="small muted">Rivals ${rv.rating} \u00b7 ${rv.wins}W\u2013${rv.losses}L</div>`;
  const oppExtra=rivals?`<div class="small muted">Rivals ${esc(oppInfo.rating||0)} \u00b7 ${esc(oppInfo.wins||0)}W\u2013${esc(oppInfo.losses||0)}L</div>`:`<div class="small muted">${meta.boss?'\ud83d\udc51 Boss':BW_TIERS[meta.tier].name+' #'+(meta.step+1)}</div>`;
  render(`${topBar('')}
    <div class="panel center" style="border-color:var(--gold)"><div class="pill gold">${rivals?'\ud83c\udf10 RIVALS MATCH':'\u2694\ufe0f GAUNTLET MATCH'}</div>
      <div style="display:flex;align-items:flex-start;gap:8px;margin-top:16px;flex-wrap:wrap;justify-content:center">
        ${side(t.logo,t.name,yR,youExtra)}
        <div class="disp" style="font-size:24px;color:var(--gold);align-self:center">VS</div>
        ${side(oLogo,oName,oR,oppExtra)}
      </div>
      <div class="center" style="margin-top:20px"><button class="btn primary" style="font-size:16px;padding:12px 28px" onclick="bwStartPending()">Play Ball \u25b8</button>
        <button class="btn ghost" onclick="${rivals?'screenRivals()':'screenGauntlet()'}">Back</button></div></div>`);
  _atTitle=true;ensureNavBtns();
}
function bwStartPending(){const m=_pendingMatch;if(!m)return;bwbStart(m.you,m.opp,m.meta);}
// ---- bWARfare RIVALS (async ghost PvP) ----
function bwGhostDeck(){
  const d=PROFILE.bw&&PROFILE.bw.deck;
  if(!(d&&d.h&&d.h.length===30&&d.p&&d.p.length===10&&d.e&&d.e.length===12))return null;
  const r=ids=>ids.map(bwCardById).filter(Boolean);
  const h=r(d.h),p=r(d.p),e=r(d.e);
  if(h.length!==30||p.length!==10||e.length!==12)return null;
  const out={h,p,e};
  if(d.coach&&bwOwned(d.coach)){const co=bwCardById(d.coach);if(co)out.coach=co;}
  return out;
}
let _ghostPubAt=0;
async function bwReportDefense(won){
  const m=BW.meta||{};
  if(!m.rivals||!m.oppUser||!authEnabled()||!authState())return;
  try{await authCall('/bw/report',{token:authState().token,defender:m.oppUser,attackerName:bwTeam().name,attackerLogo:bwTeam().logo,defenderWon:!won,defScore:BW.cpu.runs,attScore:BW.you.runs});}catch(e){}
}
let _lbSort='rating';
async function screenBwLeaderboard(){
  bwState();bwEnsureStyles();
  render(`${topBar(`<button class="btn ghost sm" onclick="screenRivals()">🌐 Rivals</button> <button class="btn ghost sm" onclick="screenGauntlet()">⚔️ Gauntlet</button>`)}
    <div class="panel center" style="border-color:var(--gold)"><div class="pill gold">🏆 RIVALS LEADERBOARD</div>
      <p class="sub" style="margin-top:6px">Every player who's published a deck. Sort by rating, deck OVR, or record.</p></div>
    <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px">
      <button class="btn lbsortbtn ${_lbSort==='rating'?'primary':'ghost'} sm" data-k="rating" onclick="bwLbSort('rating')">⭐ Rivals Rating</button>
      <button class="btn lbsortbtn ${_lbSort==='deck'?'primary':'ghost'} sm" data-k="deck" onclick="bwLbSort('deck')">🏅 Deck OVR</button>
      <button class="btn lbsortbtn ${_lbSort==='record'?'primary':'ghost'} sm" data-k="record" onclick="bwLbSort('record')">📊 Best Record</button></div>
    <div class="panel" id="lbbody" style="padding:0;overflow:hidden"><p class="muted center" style="padding:18px">Loading leaderboard…</p></div>`);
  _atTitle=true;ensureNavBtns();
  if(!authEnabled()){document.getElementById('lbbody').innerHTML='<p class="muted center" style="padding:18px">Online play isn\'t switched on for this build yet.</p>';return;}
  let board=[];
  try{const resp=await fetch(AUTH_API+'/bw/leaderboard');if(!resp.ok)throw new Error('Server error '+resp.status);const r=await resp.json();board=(r&&r.board)||[];}catch(e){const b=document.getElementById('lbbody');if(b)b.innerHTML=`<p class="muted center" style="padding:18px">Couldn't load the leaderboard${/not found|404|Server error 404/i.test(e&&e.message||'')?" — the latest backend needs to be deployed.":'.'}</p>`;return;}
  _lbBoard=board;bwLbRender();
}
let _lbBoard=[];
function bwLbSort(k){
  _lbSort=k;
  // update the active state on the three sort buttons in place
  document.querySelectorAll('#app .lbsortbtn').forEach(b=>{
    const on=b.getAttribute('data-k')===k;b.classList.toggle('primary',on);b.classList.toggle('ghost',!on);
  });
  bwLbRender();
}
function bwLbRender(){
  const body=document.getElementById('lbbody');if(!body)return;
  let arr=_lbBoard.slice();
  if(_lbSort==='deck')arr.sort((a,b)=>b.deckRating-a.deckRating||b.rating-a.rating);
  else if(_lbSort==='record')arr.sort((a,b)=>(b.wins-b.losses)-(a.wins-a.losses)||b.wins-a.wins||b.rating-a.rating);
  else arr.sort((a,b)=>b.rating-a.rating||b.deckRating-a.deckRating);
  const me=(authState()&&authState().username||'').toLowerCase();
  if(!arr.length){body.innerHTML='<p class="muted center" style="padding:18px">No published decks yet — be the first to publish from the Rivals screen.</p>';return;}
  body.innerHTML=arr.slice(0,100).map((e,i)=>{
    const mine=(e.gm||'').toLowerCase()===me;
    return `<div style="display:flex;align-items:center;gap:8px;padding:8px 10px;border-bottom:1px solid var(--line);${mine?'background:var(--panel2)':''}">
      <span class="disp" style="width:24px;text-align:right;color:${i<3?'var(--gold)':'var(--dim)'}">${i+1}</span>
      <span style="font-size:18px">${esc(e.logo)}</span>
      <span style="flex:1;min-width:0"><b style="word-break:break-word">${String(e.name).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}</b>${mine?' <span class="small" style="color:var(--gold)">· you</span>':''}<br><span class="small muted">Lv ${esc(e.level)} · 🏅 ${esc(e.deckRating)} OVR${(e.gm&&String(e.gm).toLowerCase()!==String(e.name).toLowerCase())?` · @${String(e.gm).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}`:''}</span></span>
      <span style="text-align:right"><b class="disp" style="color:var(--gold)">${esc(e.rating)}</b><br><span class="small muted">${esc(e.wins)}–${esc(e.losses)}</span></span>
    </div>`;}).join('');
}
let _bwDef=null,_bwDefAt=0;
async function bwLoadDefenses(force){
  if(!authEnabled()||!authState())return;
  if(_bwDef)bwRenderDefBox();
  const now=Date.now();if(!force&&now-_bwDefAt<30000)return;_bwDefAt=now;
  try{const r=await authCall('/bw/defenses',{token:authState().token});_bwDef=r;bwRenderDefBox();}catch(e){}
}
function bwRenderDefBox(){
  const box=document.getElementById('bwDefBox');if(!box||!_bwDef)return;
  const list=_bwDef.defenses||[];
  if(!list.length){box.innerHTML='';return;}
  const held=list.filter(d=>d.held).length;
  const rows=list.slice(0,4).map(d=>`<div style="display:flex;align-items:center;gap:5px;font-size:11px;padding:2px 0">
    <span>${esc(d.logo)}</span><span style="flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${String(d.attacker).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}</span>
    <span style="color:${d.held?'var(--green)':'var(--red)'}">${d.held?'held':'lost'} ${esc(d.defScore)}–${esc(d.attScore)}</span></div>`).join('');
  box.innerHTML=`<div style="margin-top:8px;background:var(--panel2);border:1px solid var(--line);border-radius:4px;padding:8px">
    <div class="small" style="color:var(--gold);font-weight:600;margin-bottom:3px">🛡️ While you were away${_bwDef.fresh?` <span style="color:var(--amber)">· ${esc(_bwDef.fresh)} new</span>`:''}</div>
    ${rows}
    <div class="small muted" style="margin-top:3px">Your deck held ${held}–${list.length-held} on defense.</div></div>`;
}
async function bwPublishGhost(force){
  if(!authEnabled()||!authState())return;
  const deck=bwGhostDeck();if(!deck)return;
  const now=Date.now();if(!force&&now-_ghostPubAt<60000)return;_ghostPubAt=now;
  const t=bwTeam(),rv=PROFILE.bw.rivals||{rating:0,wins:0,losses:0};
  try{await authCall('/bw/publish',{token:authState().token,deck,level:plLevel(),teamName:t.name,teamLogo:t.logo,rating:rv.rating,wins:rv.wins,losses:rv.losses,deckRating:bwDeckRatingIds(PROFILE.bw.deck)});}catch(e){}
}
async function bwFetchOpponent(){
  if(!authEnabled()||!authState())return {error:'login'};
  try{const r=await authCall('/bw/opponent',{token:authState().token,level:plLevel()});return {opponent:r.opponent||null};}
  catch(e){return {error:(e&&e.message)||'network'};}
}
let _rivalOpp=null;
async function screenRivals(){
  bwState();bwEnsureStyles();bwbEnsureStyles();
  const d=PROFILE.bw.deck,valid=d.h.length===30&&d.p.length===10&&d.e.length===12;
  const rv=PROFILE.bw.rivals||(PROFILE.bw.rivals={wins:0,losses:0,rating:0,milestone:0});
  if(!authEnabled()||!authState()){
    render(`${topBar(`<button class="btn ghost sm" onclick="screenGauntlet()">⚔️ Gauntlet</button> <button class="btn ghost sm" onclick="screenBwLeaderboard()">🏆 Leaders</button> <button class="btn ghost sm" onclick="screenBwLog()">📜 Log</button>`)}
      <div class="panel center" style="border-color:var(--gold)"><div class="pill gold">🌐 RIVALS · GHOST PvP</div>
        <p class="sub" style="margin-top:6px">Battle other players' <b>real decks</b> (we pilot them for you). <b>Log in</b> to publish your deck and face rivals near your level.</p>
        <button class="btn primary" style="margin-top:8px" onclick="screenAccount()">Log in / Sign up</button></div>`);
    _atTitle=true;ensureNavBtns();return;
  }
  render(`${topBar(`<button class="btn ghost sm" onclick="screenGauntlet()">⚔️ Gauntlet</button> <button class="btn ghost sm" onclick="screenBwLeaderboard()">🏆 Leaders</button> <button class="btn ghost sm" onclick="screenBwLog()">📜 Log</button>`)}
    <div class="panel center" style="border-color:var(--gold)"><div class="pill gold">🌐 RIVALS · GHOST PvP</div>
      <p class="sub" style="margin-top:6px">Face another player's real deck — we pilot it. Win for rating, GM XP, and Diamond Coins.</p>
      <div class="disp" style="margin-top:8px">Rating <b style="color:var(--gold)">${rv.rating}</b> · ${rv.wins}W–${rv.losses}L</div></div>
    <div class="panel center" id="rivbody"><p class="muted">Finding an opponent…</p></div>`);
  _atTitle=true;ensureNavBtns();
  await bwPublishGhost(true);
  const res=await bwFetchOpponent();
  const el=document.getElementById('rivbody');if(!el)return;
  if(res.error){const notDeployed=/not found|404/i.test(res.error);el.innerHTML=`<p class="muted">${notDeployed?"Rivals isn't live on the server yet — the latest backend needs to be deployed.":'Couldn\'t reach the rivals server: '+res.error}</p><button class="btn" onclick="screenRivals()">↻ Retry</button>`;return;}
  if(!res.opponent){el.innerHTML=`<p class="muted">No rivals available yet — once more players publish a deck, they'll appear here.${valid?'':' (Build a full deck to join the pool.)'}</p><button class="btn" onclick="screenRivals()">↻ Refresh</button>`;return;}
  _rivalOpp=res.opponent;
  el.innerHTML=`<div class="disp" style="font-size:16px;color:var(--blue)">${(res.opponent.name||'Rival').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}</div><div class="small muted">GM Level ${esc(res.opponent.level)} · their built deck</div>
    <div class="center" style="margin-top:12px">${valid?`<button class="btn primary" onclick="bwRivalsFight()">⚔️ Battle ▸</button>`:`<button class="btn" disabled>Build a full deck</button> <button class="btn ghost" onclick="screenPlatoon('deck')">Go to Deck</button>`}
      <button class="btn ghost" onclick="screenRivals()">↻ New rival</button></div>`;
}
function bwRivalsFight(){
  const o=_rivalOpp,d=PROFILE.bw.deck;if(!o)return;
  if(d.h.length!==30||d.p.length!==10||d.e.length!==12){toast('Finish your deck first.');return;}
  const youCards={h:d.h.map(bwCardById).filter(Boolean).map(bwbCard),p:d.p.map(bwCardById).filter(Boolean).map(bwbCard),e:d.e.map(bwCardById).filter(Boolean).map(bwbCard),coach:(d.coach&&bwOwned(d.coach))?bwCardById(d.coach):null};
  const oppCards={h:o.deck.h.map(bwbCard),p:o.deck.p.map(bwbCard),e:o.deck.e.map(bwbCard),coach:(o.deck.coach&&o.deck.coach.ab)?o.deck.coach:null};
  bwPreMatch(youCards,oppCards,{rivals:true,oppName:(o.teamName||o.name),oppLevel:o.level,oppLogo:o.teamLogo||'\ud83c\udfaf',oppUser:o.username},{teamName:(o.teamName||o.name),teamLogo:o.teamLogo||'\ud83c\udfaf',rating:o.rating,wins:o.wins,losses:o.losses});
}
function bwRivalsWin(){
  const bw=bwState(),rv=bw.rivals||(bw.rivals={wins:0,losses:0,rating:0,milestone:0});
  rv.wins++;rv.rating+=25;const xpRes=bwAddBattleXP(25);bw.coins=(bw.coins||0)+15;
  let packs=[];
  while(rv.rating>=(rv.milestone+1)*200){rv.milestone++;packs.push(rv.rating>=600?'diamond':rv.rating>=400?'gold':rv.rating>=200?'silver':'bronze');}
  if(packs.length)bw.packs=bw.packs.concat(packs);
  saveProfile();
  return {rivals:true,granted:packs,coins:15,xp:xpRes,rating:rv.rating};
}
function bwRivalsLoss(){const bw=bwState(),rv=bw.rivals||(bw.rivals={wins:0,losses:0,rating:0,milestone:0});rv.losses++;rv.rating=Math.max(0,rv.rating-12);const xpRes=bwAddBattleXP(8);bw.coins=(bw.coins||0)+5;saveProfile();return {rivals:true,granted:[],coins:5,xp:xpRes,rating:rv.rating,loss:true};}

const BW_LOGOS=['\u26be','\u26a1','\ud83d\udd25','\ud83d\udca5','\u2694\ufe0f','\ud83d\udee1\ufe0f','\ud83c\udfaf','\ud83d\ude80','\ud83d\udc09','\ud83e\udd85','\ud83d\udc3a','\ud83e\udd8a','\ud83d\udc3b','\ud83d\udc2f','\ud83e\udd81','\ud83d\udc18','\ud83e\udd2c','\ud83d\udc7d','\ud83e\udd16','\ud83d\udc80','\ud83d\udc51','\u2b50','\ud83c\udf1f','\u2604\ufe0f','\ud83c\udf0a','\ud83c\udf2a\ufe0f','\u2744\ufe0f','\ud83c\udf0b','\ud83c\udfdf\ufe0f','\u269e'];
function bwSaveTeamName(v){const t=bwTeam();t.name=String(v||'').replace(/[<>&"']/g,'').slice(0,24)||'My Club';saveProfile();}
function bwSetTeamLogo(e){const t=bwTeam();t.logo=e;saveProfile();screenPlatoon('team');}
function bwTeamTab(){
  const t=bwTeam(),rv=PROFILE.bw.rivals||{rating:0,wins:0,losses:0};
  const dr=bwDeckRatingIds(PROFILE.bw.deck)||'—',gp=(rv.wins+rv.losses);
  const wl=gp?Math.round(rv.wins/gp*100):0;
  const logos=BW_LOGOS.map(e=>`<span onclick="bwSetTeamLogo('${e}')" style="font-size:26px;cursor:pointer;padding:6px;border-radius:6px;border:1px solid ${e===t.logo?'var(--gold)':'var(--line)'};background:${e===t.logo?'var(--panel2)':'transparent'};line-height:1;display:inline-flex;align-items:center;justify-content:center;width:44px;height:44px">${e}</span>`).join('');
  return `<div class="panel" style="border-color:var(--gold)">
    <div style="display:flex;align-items:center;gap:14px;flex-wrap:wrap">
      <div style="font-size:54px;line-height:1">${t.logo}</div>
      <div style="min-width:0;flex:1">
        <div class="disp" style="font-size:20px;color:var(--gold);word-break:break-word">${t.name.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}</div>
        <div class="small muted">Your bWARfare club identity — shown to rivals and before every match.</div>
      </div>
    </div>
    <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:14px">
      <div style="flex:1;min-width:90px;background:var(--panel2);border:1px solid var(--line);border-radius:6px;padding:8px 10px;text-align:center"><div class="small muted">Deck OVR</div><div class="disp" style="font-size:22px;color:var(--gold)">${dr}</div></div>
      <div style="flex:1;min-width:90px;background:var(--panel2);border:1px solid var(--line);border-radius:6px;padding:8px 10px;text-align:center"><div class="small muted">Rivals Rating</div><div class="disp" style="font-size:22px;color:var(--amber)">${rv.rating}</div></div>
      <div style="flex:1;min-width:90px;background:var(--panel2);border:1px solid var(--line);border-radius:6px;padding:8px 10px;text-align:center"><div class="small muted">Rivals Record</div><div class="disp" style="font-size:22px">${rv.wins}\u2013${rv.losses}</div><div class="small muted">${gp?wl+'% win':'no games'}</div></div>
    </div>
    <div class="sectlbl" style="margin:16px 0 6px">Team Name</div>
    <input maxlength="24" value="${t.name.replace(/"/g,'&quot;')}" oninput="bwSaveTeamName(this.value)" style="width:100%;max-width:320px" placeholder="My Club">
    <div class="sectlbl" style="margin:16px 0 6px">Team Logo</div>
    <div style="display:flex;flex-wrap:wrap;gap:6px">${logos}</div>
  </div>`;
}
function screenPlatoon(tab){
  bwState();bwEnsureStyles();_bwTab=tab||_bwTab||'deck';
  const bw=PROFILE.bw;
  const tb=(k,l)=>`<span class="bwtab ${_bwTab===k?'on':''}" onclick="screenPlatoon('${k}')">${l}</span>`;
  const body=_bwTab==='collection'?bwCollTab():_bwTab==='packs'?bwPacksTab():_bwTab==='store'?bwStoreTab():_bwTab==='team'?bwTeamTab():_bwTab==='stats'?bwStatsTab():bwDeckTab();
  render(`${topBar(`<span class="pill gold">💎 ${bw.coins}</span>`)}
    <div class="panel center" style="border-color:var(--gold)"><div class="pill gold">⚔️ THE PLATOON · bWARfare</div>
      <p class="sub" style="margin-top:6px">Collect Set 1, build your <b>30 hitters · 10 pitchers · 12 Edges</b> deck, then take it to battle. Earn packs by leveling up and finishing franchises.</p></div>
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px">${tb('deck','🃏 Deck')}${tb('collection','📚 Collection')}${tb('packs','🎁 Packs'+(bw.packs.length?` (${bw.packs.length})`:''))}${tb('store','🏪 Store')}${tb('stats','📊 Stats')}${tb('team','🏟️ Team')}</div>
    ${body}`);
  _atTitle=true;ensureNavBtns();
  bwShowGifts();
}
function bwCoachGift(){
  const bw=bwState();if(bw._coachGift)return;
  const old=document.getElementById('saveov');if(old)old.remove();
  const ov=document.createElement('div');ov.id='saveov';ov.className='saveov';
  ov.innerHTML=`<div class="savebox" style="max-width:520px">
    <div class="center"><div class="pill gold">🎉 bWARfare just got a big update</div></div>
    <div style="font-size:13px;line-height:1.55;margin:12px 0">
      <p style="margin:7px 0">🌀 <b>Breaking ball</b> — a third pitch on every card, each with its own feel (fastballs carry, offspeed is weak contact, breaking whiffs but can hang).</p>
      <p style="margin:7px 0">🍖 <b>Pitch effectiveness &amp; meatballs</b> — lean on one pitch and it wears down and hangs; mix it up. The opponent reads your tendencies, and now you read theirs.</p>
      <p style="margin:7px 0">★ <b>HOF abilities</b> — every Hall of Famer has a signature passive.</p>
      <p style="margin:7px 0">🧢 <b>Coaches</b> — a new 30-card set. Equip one for a powerful game-changing ability (steal bases, sign-steal the pitch, reset your pitcher, and more).</p>
    </div>
    <p class="small muted" style="margin:0 0 12px;text-align:center">Here's a free <b style="color:var(--amber)">Gold pack</b> to get you a Coach and some new cards. Thanks for playing! — @ApolloJosh1</p>
    <div class="center"><button class="btn primary" style="font-size:15px;padding:11px 22px" onclick="bwRedeemCoachGift()">🎁 Redeem free Gold pack</button>
      <button class="btn ghost sm" onclick="document.getElementById('saveov').remove()">Maybe later</button></div>
  </div>`;
  document.body.appendChild(ov);
}
function bwShowGifts(){
  const bw=bwState();
  if(!bw._coachGift){bwCoachGift();return;}
  if(!bw._giftBonus2){bwBonusGift();return;}
}
function bwBonusGift(){
  const bw=bwState();if(bw._giftBonus2)return;
  const old=document.getElementById('saveov');if(old)old.remove();
  const ov=document.createElement('div');ov.id='saveov';ov.className='saveov';
  ov.innerHTML=`<div class="savebox" style="max-width:480px">
    <div class="center"><div class="pill gold">🎁 A gift for everyone</div></div>
    <h3 style="margin:12px 0 6px;text-align:center">2 free Gold packs</h3>
    <p class="small muted" style="margin:0 0 14px;text-align:center">Thanks for playing the update — grab two more Gold packs to deepen your collection and find more Coaches. Good luck out there!</p>
    <div class="center"><button class="btn primary" style="font-size:15px;padding:11px 22px" onclick="bwRedeemBonus2()">🎁 Redeem 2 Gold packs</button>
      <button class="btn ghost sm" onclick="document.getElementById('saveov').remove()">Maybe later</button></div>
  </div>`;
  document.body.appendChild(ov);
}
function bwRedeemBonus2(){
  const bw=bwState();const o=document.getElementById('saveov');if(o)o.remove();
  if(bw._giftBonus2)return;
  bw._giftBonus2=true;bw.packs.push('gold','gold');saveProfile();
  toast('🎁 2 Gold packs added — opening them now!');
  screenPlatoon('packs');
}
function bwRedeemCoachGift(){
  const bw=bwState();const o=document.getElementById('saveov');if(o)o.remove();
  if(bw._coachGift)return;
  bw._coachGift=true;bw.packs.push('gold');saveProfile();
  toast('🎁 Gold pack added — opening it now!');
  screenPlatoon('packs');
}

