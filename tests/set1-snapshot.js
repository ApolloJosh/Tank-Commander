// SET1 determinism gate. Run:  node tests/set1-snapshot.js [--write]
const {load}=require('./harness');const crypto=require('crypto');const fs=require('fs');const path=require('path');
const ctx=load(path.join(__dirname,'..','tank-commander.html'));
const S=ctx.__X.SET1;
if(!S||!S.cards||S.cards.length!==500)throw new Error('SET1 malformed: '+(S&&S.cards&&S.cards.length));
const sig=[...S.cards.map(c=>[c.id,c.name,c.pos,c.ov,c.rar,c.vf,c.vo,JSON.stringify(c.ab||{})].join('|')),
  ...S.edges.map(e=>[e.id,e.name,e.d].join('|')),
  ...S.coaches.map(c=>[c.id,c.name,c.rar,c.ab&&c.ab.k].join('|'))].join('\n');
const hash=crypto.createHash('sha256').update(sig).digest('hex');
const base=path.join(__dirname,'set1.baseline');
if(process.argv.includes('--write')){fs.writeFileSync(base,hash+'\n');console.log('baseline written:',hash);}
else{const want=fs.readFileSync(base,'utf8').trim();
  if(hash!==want){console.error('❌ SET1 CHANGED! every player\'s collection would reshuffle.\n want',want,'\n got ',hash);process.exit(1);}
  console.log('✅ SET1 deterministic-set check passed:',hash.slice(0,16));}
