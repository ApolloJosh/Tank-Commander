#!/usr/bin/env node
// Build: concatenates src/ modules into the single-file game.
// Usage: node build.js [--ship]   (--ship also copies to index.html)
const fs=require('fs'),path=require('path');
const SRC=path.join(__dirname,'src');
const head=fs.readFileSync(path.join(SRC,'_shell_head.html'),'utf8');
const tail=fs.readFileSync(path.join(SRC,'_shell_tail.html'),'utf8');
const mods=fs.readdirSync(SRC).filter(f=>f.endsWith('.js')).sort();
const js=mods.map(f=>fs.readFileSync(path.join(SRC,f),'utf8')).join('');
fs.writeFileSync(path.join(__dirname,'tank-commander.html'),head+js+tail);
console.log('built tank-commander.html from',mods.length,'modules');
if(process.argv.includes('--ship')){
  fs.copyFileSync(path.join(__dirname,'tank-commander.html'),path.join(__dirname,'index.html'));
  console.log('shipped -> index.html');
}
