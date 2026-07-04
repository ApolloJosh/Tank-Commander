/* ============================================================
   LEADERBOARD — local by default; set LEADERBOARD_API for a shared board
   ============================================================ */
const LEADERBOARD_API="https://tank-leaderboard.josh-c2f.workers.dev"; // shared leaderboard backend
const AUTH_API="https://tank-auth.josh-c2f.workers.dev"; // account worker (logins on)
const LB_KEY="tankCommander_lb_v2";
const LB_BANNED_TEAMS=["river city rovers"];   // old-build team names kept off the board
const lbBanned=t=>LB_BANNED_TEAMS.includes(String(t||"").trim().toLowerCase());
function deviceId(){try{let d=localStorage.getItem("tankCommander_did");if(!d){d="d_"+Math.random().toString(36).slice(2,12)+Date.now().toString(36);localStorage.setItem("tankCommander_did",d);}return d;}catch(e){return "anon";}}
function lbLoadLocal(){try{return JSON.parse(localStorage.getItem(LB_KEY)||"[]");}catch(e){return [];}}
function lbSaveLocal(a){try{localStorage.setItem(LB_KEY,JSON.stringify(a.slice(0,600)));}catch(e){}}
function lbRank(arr){return arr.slice().sort((a,b)=>(b.score-a.score)||((b.champs||0)-(a.champs||0))||((b.peak||0)-(a.peak||0)));}
function todayStr(d){d=d||new Date();return d.toISOString().slice(0,10);}
async function lbSubmit(entry){
  const local=lbLoadLocal();local.push(entry);lbSaveLocal(lbRank(local));
  if(LEADERBOARD_API){try{await fetch(LEADERBOARD_API,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(entry)});}catch(e){}}
}
async function lbFetch(){
  let a=null;
  if(LEADERBOARD_API){try{const r=await fetch(LEADERBOARD_API,{cache:"no-store"});if(r.ok){const j=await r.json();if(Array.isArray(j))a=j;}}catch(e){}}
  if(!a)a=lbLoadLocal();
  return a.filter(x=>!lbBanned(x&&x.team));
}
function lbRankSurv(arr){return arr.slice().sort((a,b)=>(b.score-a.score)||((b.titles||0)-(a.titles||0))||((b.years||0)-(a.years||0)));}
function lbRankOwner(arr){return arr.slice().sort((a,b)=>(b.score-a.score)||((b.titles||0)-(a.titles||0))||((b.years||0)-(a.years||0)));}
function lbRowsOwner(arr){
  if(!arr.length)return `<tr><td colspan="5" class="muted" style="text-align:center;padding:14px">No moguls yet — buy a club and build an empire.</td></tr>`;
  const fb=m=>m>=1000?('$'+(m/1000).toFixed(m>=10000?1:2)+'B'):('$'+Math.round(m)+'M');
  return arr.map((e,i)=>`<tr>
    <td class="num">${i+1}</td>
    <td><b>${(e.name||'---').slice(0,12)}</b><br><span class="small muted">${e.team?e.team.slice(0,18):''}${e.heirs?' · 👑 heirs':' · sold'}</span></td>
    <td class="num"><b style="color:var(--gold)">${fb(e.score||0)}</b></td>
    <td class="num">${e.years||0}</td>
    <td class="num">${e.titles||0}🏆</td></tr>`).join("");
}
function lbRows(arr){
  if(!arr.length)return `<tr><td colspan="5" class="muted" style="text-align:center;padding:14px">No entries yet — be the first.</td></tr>`;
  return arr.map((e,i)=>`<tr>
    <td class="num">${i+1}</td>
    <td><b>${(e.name||'---').slice(0,12)}</b><br><span class="small muted">${e.team?e.team.slice(0,18):''}</span></td>
    <td class="num"><b style="color:var(--gold)">${e.score}</b> <span class="small">${e.grade||''}</span></td>
    <td class="num">${e.peak||''}W</td>
    <td class="num">${e.champs||0}🏆</td></tr>`).join("");
}
function lbRowsSurv(arr){
  if(!arr.length)return `<tr><td colspan="5" class="muted" style="text-align:center;padding:14px">No survivors yet — be the first to take the chair.</td></tr>`;
  return arr.map((e,i)=>`<tr>
    <td class="num">${i+1}</td>
    <td><b>${(e.name||'---').slice(0,12)}</b><br><span class="small muted">${e.team?e.team.slice(0,18):''}</span></td>
    <td class="num"><b style="color:var(--gold)">${e.score}</b></td>
    <td class="num">${e.years||0}</td>
    <td class="num">${e.titles||0}🏆</td></tr>`).join("");
}
async function screenLeaderboard(fromEnd,board){
  board=board||((typeof G!=="undefined"&&G&&G.owner)?'owner':(typeof G!=="undefined"&&G&&G.mode==="survivor")?'survivor':(typeof G!=="undefined"&&G&&G.hard?'hard':'career'));
  const tab=(k,l)=>`<button class="btn sm ${board===k?'primary':'ghost'}" onclick="screenLeaderboard(${fromEnd?'true':'false'},'${k}')">${l}</button>`;
  render(`<div class="row" style="align-items:center;margin-bottom:6px"><h2 style="flex:1">🏆 Leaderboard</h2>
     <button class="btn ghost" onclick="screenTitle()">← Home</button></div>
   <div style="margin-bottom:8px">${tab('career','⚡ 6-Year')} ${tab('hard','🔥 Hard 6-Year')} ${tab('survivor','🪑 Career')} ${tab('owner','💼 Owner')}</div>
   <p class="sub">${LEADERBOARD_API?'Global rankings across all players.':'Saved on this device only. To make it shared, see the README — it takes one free backend URL.'}</p>
   <div id="lbbody"><p class="muted">Loading…</p></div>`);
  const all=await lbFetch();
  const el=document.getElementById('lbbody'); if(!el)return;
  if(board==='owner'){
    const ranked=lbRankOwner(all.filter(e=>e.mode==='owner'));
    const today=ranked.filter(e=>(e.date||todayStr(new Date(e.ts||Date.now())))===todayStr());
    const head=`<thead><tr><th class="num">#</th><th>Owner / Club</th><th class="num">Final value</th><th class="num">Yrs</th><th class="num">WS</th></tr></thead>`;
    el.innerHTML=`<p class="small" style="margin:0 0 8px">💼 Owner Mode — ranked by the franchise's <b>final value</b> when sold or passed to your heirs.</p><div class="lbgrid">
       <div class="panel"><h3>👑 Richest Empires</h3><div class="scroll"><table>${head}<tbody>${lbRowsOwner(ranked.slice(0,10))}</tbody></table></div></div>
       <div class="panel"><h3>🔆 Top 10 Today</h3><div class="scroll"><table>${head}<tbody>${lbRowsOwner(today.slice(0,10))}</tbody></table></div></div>
     </div>`;
  } else if(board==='survivor'){
    const ranked=lbRankSurv(all.filter(e=>e.mode==='survivor'));
    const today=ranked.filter(e=>(e.date||todayStr(new Date(e.ts||Date.now())))===todayStr());
    const head=`<thead><tr><th class="num">#</th><th>GM / Club</th><th class="num">Score</th><th class="num">Yrs</th><th class="num">WS</th></tr></thead>`;
    el.innerHTML=`<div class="lbgrid">
       <div class="panel"><h3>👑 Top 10 All-Time</h3><div class="scroll"><table>${head}<tbody>${lbRowsSurv(ranked.slice(0,10))}</tbody></table></div></div>
       <div class="panel"><h3>🔆 Top 10 Today</h3><div class="scroll"><table>${head}<tbody>${lbRowsSurv(today.slice(0,10))}</tbody></table></div></div>
     </div><p class="small muted" style="margin-top:6px">Career score = your running total + bonuses for seasons survived and World Series titles.</p>`;
  } else {
    const hardBoard=board==='hard';
    const ranked=lbRank(all.filter(e=>e.mode!=='survivor'&&e.mode!=='owner'&&(hardBoard?e.hard:!e.hard)));   // 6-Year board excludes Owner & Career entries
    const today=ranked.filter(e=>(e.date||todayStr(new Date(e.ts||Date.now())))===todayStr());
    const head=`<thead><tr><th class="num">#</th><th>GM / Club</th><th class="num">Score</th><th class="num">Peak</th><th class="num">WS</th></tr></thead>`;
    el.innerHTML=`${hardBoard?'<p class="small" style="color:#ff8a6b;margin:0 0 8px">🔥 Hard Mode — a tougher league, real injuries, and stricter grading. The truest test.</p>':''}<div class="lbgrid">
       <div class="panel"><h3>👑 Top 10 All-Time</h3><div class="scroll"><table>${head}<tbody>${lbRows(ranked.slice(0,10))}</tbody></table></div></div>
       <div class="panel"><h3>🔆 Top 10 Today</h3><div class="scroll"><table>${head}<tbody>${lbRows(today.slice(0,10))}</tbody></table></div></div>
     </div>`;
  }
}
function submitScore(){
  const inp=document.getElementById('lbname');const name=((inp&&inp.value.trim())||'Anon').slice(0,12);
  const R=computeGrade();
  const entry={name,team:G.teamName,score:R.score,grade:R.grade,mode:"career",hard:!!G.hard,peak:G.bestWins,champs:G.champions,window:R.windowYears,ts:Date.now(),date:todayStr(),did:deviceId()};
  lbSubmit(entry);toast(`Submitted: ${name} — ${R.score} (${R.grade})`);
  screenLeaderboard(true,G.hard?'hard':'career');
}
function submitSurvivor(){
  const inp=document.getElementById('lbname');const name=((inp&&inp.value.trim())||'Anon').slice(0,12);
  const sc=survFinalScore();
  const entry={name,team:G.teamName,score:sc,mode:"survivor",years:G.yearsServed||0,titles:G.survTitles||0,peak:G.bestWins,ts:Date.now(),date:todayStr(),did:deviceId()};
  lbSubmit(entry);toast(`Submitted: ${name} — ${sc}`);
  screenLeaderboard(true,'survivor');
}
function submitOwner(heirs){
  const inp=document.getElementById('lbname');const name=((inp&&inp.value.trim())||'Anon').slice(0,12);
  const o=G.owner,worth=ownerNetWorth();
  const entry={name,team:G.teamName,score:worth,mode:"owner",value:o.clubValue||0,cash:Math.round(o.cashReserve||0),
    titles:G.champions||0,champs:G.champions||0,years:G.year||0,heirs:!!heirs,ts:Date.now(),date:todayStr(),did:deviceId()};
  lbSubmit(entry);toast(`Submitted: ${name} — ${worth>=1000?('$'+(worth/1000).toFixed(2)+'B'):('$'+worth+'M')}`);
  screenLeaderboard(true,'owner');
}

