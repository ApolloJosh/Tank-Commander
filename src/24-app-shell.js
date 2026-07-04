
/* ============================================================
   APP SHELL — service worker (offline + install), added v9.6
   ============================================================ */
if(typeof navigator!=='undefined'&&'serviceWorker' in navigator&&typeof location!=='undefined'&&location.protocol==='https:'){
  window.addEventListener('load',()=>{navigator.serviceWorker.register('./sw.js').catch(()=>{});});
}
