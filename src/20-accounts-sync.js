/* ============================================================
   ACCOUNTS & CLOUD SYNC  (username + password; profile + franchise save)
   Backend: AUTH_API (Cloudflare Worker + D1). Empty AUTH_API = feature hidden.
   ============================================================ */
const AUTH_KEY="tankCommander_auth";
function authEnabled(){return !!AUTH_API;}
function authState(){try{return JSON.parse(localStorage.getItem(AUTH_KEY)||"null");}catch(e){return null;}}
function setAuth(a){try{a?localStorage.setItem(AUTH_KEY,JSON.stringify(a)):localStorage.removeItem(AUTH_KEY);}catch(e){}}
async function authCall(path,body){
  const r=await fetch(AUTH_API+path,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
  let j={};try{j=await r.json();}catch(e){}
  if(!r.ok)throw new Error((j&&j.error)||("Server error "+r.status));
  return j;
}
function mergeProfileFromCloud(cloudStr){
  let c=null;try{c=cloudStr?JSON.parse(cloudStr):null;}catch(e){}
  if(!c)return;
  const lx=PROFILE.xp||0,cx=c.xp||0;
  PROFILE.xp=Math.max(lx,cx);
  PROFILE.gamesPlayed=Math.max(PROFILE.gamesPlayed||0,c.gamesPlayed||0);
  PROFILE.createdPlayer=(cx>lx? (c.createdPlayer||PROFILE.createdPlayer) : (PROFILE.createdPlayer||c.createdPlayer))||null;
  bwMergeFromCloud(c.bw);   // bWARfare collection / deck / coins / gauntlet follow the account
  saveProfile();
}
// merge bWARfare state from the cloud so cards + gauntlet progress persist across devices
function bwMergeFromCloud(cbw){
  if(!cbw)return;const bw=bwState();
  const col=Object.assign({},bw.collection||{});
  Object.keys(cbw.collection||{}).forEach(id=>{col[id]=Math.max(col[id]||0,cbw.collection[id]||0);});   // union, keep max owned
  bw.collection=col;
  bw.coins=Math.max(bw.coins||0,cbw.coins||0);
  if((cbw.packs||[]).length>(bw.packs||[]).length)bw.packs=cbw.packs.slice();   // keep the bigger unopened queue
  const valid=d=>d&&d.h&&d.h.length===30&&d.p&&d.p.length===10&&d.e&&d.e.length===12;
  if(valid(cbw.deck)&&!valid(bw.deck))bw.deck=cbw.deck;   // take a built deck if you don't have one here
  const gp=g=>g?((g.rings||[]).filter(Boolean).length*1000+(g.tier||0)*9+(g.step||0)):0;
  if(cbw.gaunt&&gp(cbw.gaunt)>gp(bw.gaunt))bw.gaunt=cbw.gaunt;   // furthest gauntlet progress wins
  bw._retroDone=bw._retroDone||cbw._retroDone;   // don't re-run the level catch-up
}
function bwFreshProfile(){return {xp:0,gamesPlayed:0,createdPlayer:null};}
function bwWipeLocalData(){   // remove device-local franchise data so accounts never bleed together
  try{localStorage.removeItem(SAVE);localStorage.removeItem(SAVE_AT);}catch(e){}
  try{(loadRuns()||[]).forEach(r=>{try{localStorage.removeItem(RUN_PREFIX+r.id);}catch(e){}});localStorage.removeItem(RUNS_KEY);}catch(e){}
}
function replaceProfileFromCloud(cloudStr){   // the signed-in account is authoritative — load ITS profile, no merging
  let c=null;try{c=cloudStr?JSON.parse(cloudStr):null;}catch(e){}
  PROFILE=Object.assign(bwFreshProfile(), c||{});
  try{localStorage.setItem(PROFILE_KEY,JSON.stringify(PROFILE));}catch(e){}
  try{bwState();}catch(e){}
}
async function reconcileAfterLogin(d){
  bwWipeLocalData();                       // clear the previous account's device data first
  replaceProfileFromCloud(d.profile);      // load this account's collection / coins / level (replace, not merge)
  let loadedCloud=false;
  if(d.save){try{localStorage.setItem(SAVE,d.save);localStorage.setItem(SAVE_AT,String(d.updated||Date.now()));loadedCloud=true;}catch(e){}}
  await cloudSyncNow();
  return loadedCloud;
}
let _syncT=null,_syncing=false;
function cloudSync(){if(!authEnabled()||!authState())return;clearTimeout(_syncT);_syncT=setTimeout(cloudSyncNow,1500);}
async function cloudSyncNow(){
  const a=authState();if(!authEnabled()||!a||_syncing)return;
  _syncing=true;
  try{
    const now=Date.now();
    await authCall("/sync",{token:a.token,profile:JSON.stringify(PROFILE),save:localStorage.getItem(SAVE)||null,updated:now});
    localStorage.setItem(SAVE_AT,String(now));
    bwPublishGhost();   // keep your rivals ghost deck fresh
  }catch(e){ if(/signed in|401/i.test(e.message)){setAuth(null);} }
  finally{_syncing=false;}
}
const _v=id=>{const el=document.getElementById(id);return el?el.value.trim():"";};
let _authMode="login";
function screenAccount(){
  if(!authEnabled()){render(`<div class="row" style="align-items:center;margin-bottom:6px"><h2 style="flex:1">Account</h2><button class="btn ghost" onclick="screenTitle()">← Home</button></div>
     <div class="panel"><p class="sub">Online accounts aren't switched on for this build yet. Your progress is still saved on this device, and you can move it with the 💾 Save backup code.</p></div>${bwCheatPanel()}`);return;}
  const a=authState();
  if(a){
    render(`<div class="row" style="align-items:center;margin-bottom:6px"><h2 style="flex:1">Account</h2><button class="btn ghost" onclick="screenTitle()">← Home</button></div>
      ${xpPanel()}
      <div class="panel center">
        <div class="pill gold">SIGNED IN</div>
        <h3 style="margin:8px 0 2px">${(a.username||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}</h3>
        <p class="small muted">GM Level ${plLevel()} · your level, created player, current game, and bWARfare cards &amp; gauntlet sync automatically across devices.</p>
        <div style="margin-top:10px"><button class="btn" onclick="cloudSyncNow().then(()=>toast('Synced'))">⟲ Sync now</button>
          <button class="btn ghost" onclick="doLogout()">Log out</button></div>
      </div>${bwCheatPanel()}`);return;
  }
  const tab=(k,l)=>`<button class="btn sm ${_authMode===k?'primary':'ghost'}" onclick="_authMode='${k}';screenAccount()">${l}</button>`;
  let form;
  if(_authMode==="signup"){
    form=`<p class="sub">Create an account so your GM level and games follow you to any device.</p>
      <div style="margin:8px 0"><input id="au_user" placeholder="username (3–20 letters/numbers)" maxlength="20" autocapitalize="off" autocorrect="off"></div>
      <div style="margin:8px 0"><input id="au_pass" type="password" placeholder="password (min 8 characters)"></div>
      <button class="btn primary" onclick="doSignup()">Create account →</button>
      <p class="small muted" style="margin-top:8px">No email needed. You'll get a one-time recovery code — it's the only way to reset a forgotten password, so save it.</p>`;
  } else if(_authMode==="reset"){
    form=`<p class="sub">Forgot your password? Enter your recovery code to set a new one.</p>
      <div style="margin:8px 0"><input id="au_user" placeholder="username" maxlength="20" autocapitalize="off" autocorrect="off"></div>
      <div style="margin:8px 0"><input id="au_rec" placeholder="recovery code (TANK-XXXX-XXXX-XXXX)" autocapitalize="characters" autocorrect="off"></div>
      <div style="margin:8px 0"><input id="au_pass" type="password" placeholder="new password (min 8 characters)"></div>
      <button class="btn primary" onclick="doReset()">Reset password →</button>`;
  } else {
    form=`<p class="sub">Sign in to sync your GM level and current game across devices.</p>
      <div style="margin:8px 0"><input id="au_user" placeholder="username" maxlength="20" autocapitalize="off" autocorrect="off"></div>
      <div style="margin:8px 0"><input id="au_pass" type="password" placeholder="password"></div>
      <button class="btn primary" onclick="doLogin()">Log in →</button>`;
  }
  render(`<div class="row" style="align-items:center;margin-bottom:6px"><h2 style="flex:1">Account</h2><button class="btn ghost" onclick="screenTitle()">← Home</button></div>
    <div style="margin-bottom:8px">${tab('login','Log in')} ${tab('signup','Create account')} ${tab('reset','Reset')}</div>
    <div class="panel">${form}</div>${bwCheatPanel()}`);
}
function bwCheatPanel(){
  return `<div class="panel"><div class="sectlbl" style="margin-bottom:6px">🎮 Cheat Code</div>
    <div style="display:flex;gap:8px;flex-wrap:wrap"><input id="cheatcode" placeholder="Enter code" autocapitalize="characters" autocorrect="off" style="flex:1;min-width:150px;text-transform:uppercase"><button class="btn primary sm" onclick="bwRedeemCheat()">Redeem</button></div>
    <p class="small muted" style="margin:6px 0 0">For testing the live build.</p></div>`;
}
function bwRedeemCheat(){
  const el=document.getElementById('cheatcode'),code=((el&&el.value)||'').trim().toUpperCase().replace(/\s+/g,'');
  if(!code){toast('Enter a code.');return;}
  if(code==='GODSQWAD'){const bw=bwState();bw.coins=999999;saveProfile();toast('🪙 GOD SQUAD — max Diamond Coins granted!');screenAccount();return;}
  if(code==='CANTHIDEMONEY'){const bw=bwState();if(bw._cheat5k){toast('That code was already redeemed on this account.');return;}bw._cheat5k=true;bw.coins=(bw.coins||0)+5000;saveProfile();toast('💰 +5,000 Diamond Coins!');screenAccount();return;}
  toast('Invalid code.');
}
async function doSignup(){
  const u=_v('au_user'),p=_v('au_pass');
  if(!u||!p){toast("Fill in a username and password");return;}
  try{const d=await authCall("/signup",{username:u,password:p});
    setAuth({token:d.token,username:d.username});
    await cloudSyncNow();   // push whatever local progress they already have
    showRecovery(d.recovery);
  }catch(e){toast(e.message);}
}
async function doLogin(){
  const u=_v('au_user'),p=_v('au_pass');
  if(!u||!p){toast("Enter your username and password");return;}
  try{const d=await authCall("/login",{username:u,password:p});
    setAuth({token:d.token,username:d.username});
    const loaded=await reconcileAfterLogin(d);
    toast("Signed in as "+d.username);
    if(loaded){screenTitle();toast("Your saved game was loaded from the cloud");}else screenTitle();
  }catch(e){toast(e.message);}
}
async function doReset(){
  const u=_v('au_user'),rec=_v('au_rec'),p=_v('au_pass');
  if(!u||!rec||!p){toast("Fill in every field");return;}
  try{const d=await authCall("/reset",{username:u,recovery:rec,password:p});
    setAuth({token:d.token,username:d.username});
    await reconcileAfterLogin(d);
    toast("Password reset — you're signed in");_authMode="login";screenTitle();
  }catch(e){toast(e.message);}
}
async function doLogout(){
  const a=authState();
  try{await cloudSyncNow();}catch(e){}   // make sure this account's latest state is safe in the cloud first
  try{if(a)await authCall("/logout",{token:a.token});}catch(e){}
  setAuth(null);
  bwWipeLocalData();                      // wipe device data so the next account/guest starts clean
  PROFILE=bwFreshProfile();
  try{localStorage.setItem(PROFILE_KEY,JSON.stringify(PROFILE));}catch(e){}
  try{bwState();}catch(e){}
  toast("Logged out");screenTitle();
}
function showRecovery(code){
  const old=document.getElementById('saveov');if(old)old.remove();
  const ov=document.createElement('div');ov.id='saveov';ov.className='saveov';
  ov.innerHTML=`<div class="savebox">
    <h3 style="margin:0 0 6px">🔑 Save your recovery code</h3>
    <p class="sub">There's no email on file, so this code is the <b>only</b> way to reset your password if you forget it. Write it down or store it somewhere safe.</p>
    <div style="font-family:monospace;font-size:20px;letter-spacing:2px;text-align:center;background:var(--panel2);border:1px solid var(--gold);border-radius:8px;padding:14px;margin:10px 0;color:var(--gold)">${code}</div>
    <div class="center"><button class="btn" onclick="(function(){try{navigator.clipboard.writeText('${code}');}catch(e){};toast('Recovery code copied');})()">📋 Copy code</button></div>
    <label style="display:flex;align-items:center;gap:8px;margin:12px 0;font-size:13px;cursor:pointer"><input type="checkbox" id="recack" onchange="document.getElementById('recdone').disabled=!this.checked" style="width:auto"> I've saved my recovery code somewhere safe.</label>
    <div class="center"><button id="recdone" class="btn primary" disabled onclick="(function(){document.getElementById('saveov').remove();toast('Account ready — you\\'re signed in');screenTitle();})()">Continue</button></div>
  </div>`;
  document.body.appendChild(ov);
}
// push progress up when the app is backgrounded / closed
if(typeof document!=="undefined"&&document.addEventListener){
  document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="hidden")cloudSyncNow();});
}

