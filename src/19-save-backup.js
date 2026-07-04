/* ============================================================
   SAVE / BACKUP
   ============================================================ */
function showSavePanel(){
  if(!(typeof G!=="undefined"&&G)){toast("Start a game first");return;}
  saveGame();
  let code="";try{code=btoa(unescape(encodeURIComponent(localStorage.getItem(SAVE)||"")));}catch(e){code="";}
  const old=document.getElementById('saveov');if(old)old.remove();
  const ov=document.createElement('div');ov.id='saveov';ov.className='saveov';
  ov.innerHTML=`<div class="savebox">
    <div class="row" style="align-items:center"><h3 style="flex:1;margin:0">💾 Save & Backup</h3><button class="btn ghost sm" onclick="document.getElementById('saveov').remove()">✕</button></div>
    <p class="sub">Your game <b>saves automatically on this device</b> after every move — just close and come back, then hit <b>Continue</b>.</p>
    <p class="sub" style="margin-top:6px">To <b>back it up</b> or move to another phone/computer, use a backup below:</p>
    <div class="center" style="margin:8px 0">
      <button class="btn primary" onclick="copyBackup()">📋 Copy backup code</button>
      <button class="btn" onclick="downloadBackup()">⬇️ Download file</button>
    </div>
    <textarea id="savecode" readonly class="savecode">${code}</textarea>
    <div class="sectlbl">Restore a backup</div>
    <p class="small muted">Paste a backup code below (or use the file you downloaded) and restore. <b style="color:var(--red)">This overwrites your current game.</b></p>
    <textarea id="restorecode" class="savecode" placeholder="Paste a backup code here…"></textarea>
    <div class="center" style="margin-top:8px"><button class="btn primary" onclick="restoreBackup()">↩ Restore from code</button>
      <label class="btn" style="cursor:pointer">📂 Restore from file<input type="file" accept=".tankcmd,.txt,application/json" style="display:none" onchange="restoreFromFile(event)"></label></div>
  </div>`;
  document.body.appendChild(ov);
}
function copyBackup(){const t=document.getElementById('savecode');if(!t)return;t.select();
  try{navigator.clipboard.writeText(t.value);}catch(e){try{document.execCommand('copy');}catch(_){}}
  toast("Backup code copied — paste it somewhere safe");}
function downloadBackup(){const t=document.getElementById('savecode');if(!t)return;
  const blob=new Blob([t.value],{type:"text/plain"});const url=URL.createObjectURL(blob);
  const a=document.createElement('a');a.href=url;a.download=`tank-commander-${(G&&G.teamName||'save').replace(/[^a-z0-9]/gi,'-').toLowerCase()}.tankcmd`;
  document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2000);
  toast("Backup file downloaded");}
function applyBackupCode(code){
  try{const json=decodeURIComponent(escape(atob((code||"").trim())));const obj=JSON.parse(json);
    if(!obj||!obj.roster)throw 0;
    G=obj;migrateSave();localStorage.setItem(SAVE,json);saveGame();
    const ov=document.getElementById('saveov');if(ov)ov.remove();
    toast("Game restored!");
    if(G.mode==="survivor"&&G.survStage===0&&!G.fired)startSurvivorYear();else goPhase(G.phase||0);
    return true;
  }catch(e){toast("That backup code didn't work");return false;}
}
function restoreBackup(){const t=document.getElementById('restorecode');if(!t||!t.value.trim()){toast("Paste a code first");return;}applyBackupCode(t.value);}
function restoreFromFile(ev){const f=ev.target.files&&ev.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>applyBackupCode(String(r.result||""));r.readAsText(f);}
function showRestoreOnTitle(){
  const old=document.getElementById('saveov');if(old)old.remove();
  const ov=document.createElement('div');ov.id='saveov';ov.className='saveov';
  ov.innerHTML=`<div class="savebox">
    <div class="row" style="align-items:center"><h3 style="flex:1;margin:0">📂 Restore a backup</h3><button class="btn ghost sm" onclick="document.getElementById('saveov').remove()">✕</button></div>
    <p class="sub">Paste a backup code (or load a downloaded file) to restore a saved game.</p>
    <textarea id="restorecode" class="savecode" placeholder="Paste a backup code here…"></textarea>
    <div class="center" style="margin-top:8px"><button class="btn primary" onclick="restoreBackup()">↩ Restore from code</button>
      <label class="btn" style="cursor:pointer">📂 From file<input type="file" accept=".tankcmd,.txt,application/json" style="display:none" onchange="restoreFromFile(event)"></label></div>
  </div>`;
  document.body.appendChild(ov);
}

