const {load}=require('./harness');const path=require('path');
const ctx=load(path.join(__dirname,'..','tank-commander.html'));
let captured='';
// capture rendered HTML
ctx.render=h=>{captured=String(h);};
const checks=[];
function t(name,fn){try{fn();checks.push('✅ '+name);}catch(e){checks.push('❌ '+name+' — '+e.message);}}
t('esc() escapes',()=>{const r=ctx.__G.esc('<img src=x onerror=1>"\'&');if(r.includes('<')||r.includes('"'))throw new Error(r);});
t('sfx/hap safe headless',()=>{ctx.sfx('hr');ctx.hap(30);ctx.sndOn();});
t('countUp exists',()=>{if(typeof ctx.countUp!=='function')throw new Error('missing');});
t('screenTitle renders hero pitch',()=>{ctx.bwState();ctx.screenTitle();if(!captured.includes('Rebuild a broken franchise'))throw new Error('no pitch');if(!captured.includes('note from the creator'))throw new Error('letter gone');});
t('newGame + screenTrade shows first-run tip',()=>{ctx.newGame('Test Club','career',false);ctx.__G.PROFILE.gamesPlayed=0;ctx.__G.PROFILE._tutFr=0;ctx.screenTrade();if(!captured.includes('Your first rebuild'))throw new Error('no tip');});
t('trade tip hidden after dismiss',()=>{ctx.__G.PROFILE._tutFr=1;ctx.screenTrade();if(captured.includes('Your first rebuild'))throw new Error('tip still there');});
t('bwOpenPack yields 8 cards',()=>{const out=ctx.bwOpenPack('gold');if(out.length!==8)throw new Error('got '+out.length);});
t('leaderboard row escapes hostile ghost',()=>{ctx.__X=null;
  const html=(()=>{ // simulate bwLbRender path via direct string check
    const e={logo:'<script>x</script>',name:'<b>evil</b>',gm:'h4x',level:'<i>9</i>',deckRating:80,rating:100,wins:1,losses:0};
    return ctx.__G.esc(e.logo)+ctx.__G.esc(e.level);})();
  if(html.includes('<script'))throw new Error('logo unescaped');});
t('bwbTutTip constant across phases',()=>{ctx.__G.BW={phase:'pitch',over:false};const a=!!ctx.bwbTutTip(false);ctx.__G.BW.phase='swing';const b=!!ctx.bwbTutTip(true);ctx.__G.BW.phase='result';const c=!!ctx.bwbTutTip(true);if(!(a&&b&&c))throw new Error(a+','+b+','+c);ctx.__G.PROFILE.bw._tut=1;if(ctx.bwbTutTip(true)!=='')throw new Error('not dismissed');});
t('pack overlay has rip stage',()=>{
  const body=ctx.document.body;const n0=body.children.length;
  ctx.bwShowPack(ctx.bwOpenPack('gold'),'gold');
  const ov=body.children[body.children.length-1];
  if(body.children.length<=n0)throw new Error('no overlay');
  if(!/ripwrap/.test(ov._h||''))throw new Error('no ripwrap');
  if(!/packrev/.test(ov._h||''))throw new Error('no hidden reveal');
});
t('draftReveal r5 is instant toast',()=>{
  let went=false;ctx.draftReveal({name:'X',pos:'SS',age:20,ovr:60,pot:80,college:'St U'},5,3,()=>{went=true;});
  if(!went)throw new Error('next not called');
});
t('draftReveal r1 builds ceremony overlay',()=>{
  const body=ctx.document.body;const n0=body.children.length;
  ctx.draftReveal({name:'Y',pos:'CF',age:19,ovr:55,pot:92,college:'Tech'},1,4,()=>{});
  const ov=body.children[body.children.length-1];
  if(!/commissioner/.test(ov._h||''))throw new Error('no podium line');
  if(!/dfcard/.test(ov._h||''))throw new Error('no card');
});
t('music state defaults + controls safe headless',()=>{
  const m=ctx.musState();
  if(!(m&&m.vol>0&&m.i>=0))throw new Error('bad state');
  ctx.musToggle();ctx.musSkip(1);ctx.musVol(0.1);ctx.musMin(1);ctx.musMin(0);ctx.musMuteSync();ctx.musAutoStart();
});
t('sampled sfx fall back safely headless',()=>{
  ctx.sfx('playball');ctx.sfx('strikeout');ctx.sfx('yourout');ctx.sfx('crack');ctx.sfx('pack');ctx.sfx('hit');ctx.sfx('dice');ctx.sfx('single');ctx.sfx('hr');ctx.musTryAutoplay();
});
t('yourout pool + strikeout distinct + 19 tracks',()=>{
  for(let i=0;i<5;i++)ctx.sfx('yourout');
  ctx.sfx('strikeout');
  if(ctx.playSmp('yourout')!==false)throw new Error('array pool should fail headless');
  if(ctx.__G.MUSIC.length!==19)throw new Error('tracks: '+ctx.__G.MUSIC.length);
  if(ctx.playSmp('crack')!==false)throw new Error('expected false without Audio');
});
console.log(checks.join('\n'));
if(checks.some(c=>c.startsWith('❌')))process.exit(1);
