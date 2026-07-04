// Headless loader: stubs the DOM, loads the built game script, exposes globals.
const fs=require('fs'),path=require('path'),vm=require('vm');
function mockEl(){const el={style:{},children:[],classList:{add(){},remove(){},animate(){return{cancel(){},finished:Promise.resolve()}},toggle(){},contains(){return false}},
  setAttribute(){},getAttribute(){return null},addEventListener(){},removeEventListener(){},remove(){},animate(){return{cancel(){},finished:Promise.resolve()}},
  appendChild(c){el.children.push(c);return c},insertBefore(c){el.children.push(c);return c},querySelector(){return null},
  querySelectorAll(){return[]},getContext(){return null},focus(){},blur(){},click(){},
  getBoundingClientRect(){return{top:0,left:0,width:0,height:0}}};
  Object.defineProperty(el,'innerHTML',{get(){return el._h||''},set(v){el._h=v}});
  Object.defineProperty(el,'firstChild',{get(){return mockEl()}});
  Object.defineProperty(el,'textContent',{get(){return el._t||''},set(v){el._t=v}});
  return el;}
function load(file){
  const src=fs.readFileSync(file,'utf8');
  const a=src.indexOf('<script>')+8,b=src.lastIndexOf('</script>');
  const js=src.slice(a,b);
  const store={};
  const ctx={console,setTimeout,clearTimeout,setInterval,clearInterval,
    localStorage:{getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=String(v)},removeItem:k=>{delete store[k]},key:i=>Object.keys(store)[i]??null,get length(){return Object.keys(store).length}},
    navigator:{userAgent:'headless',vibrate(){}},
    location:{protocol:'file:',href:'file:///game',hostname:''},
    fetch:()=>Promise.resolve({ok:false,json:()=>Promise.resolve({})}),
    requestAnimationFrame:f=>setTimeout(f,0),
    confirm:()=>true,alert(){},prompt:()=>null,
    AudioContext:undefined,webkitAudioContext:undefined,
    document:{getElementById:()=>mockEl(),createElement:()=>mockEl(),body:mockEl(),head:mockEl(),
      addEventListener(){},removeEventListener(){},querySelector:()=>null,querySelectorAll:()=>[],
      visibilityState:'visible',documentElement:mockEl()},
  };
  ctx.window=ctx;ctx.globalThis=ctx;
  vm.createContext(ctx);
  vm.runInContext(js+';globalThis.__X={SET1:typeof SET1!=="undefined"?SET1:null};'+'globalThis.__G={get esc(){return typeof esc!=="undefined"?esc:null},get PROFILE(){return PROFILE},set PROFILE(v){PROFILE=v},get BW(){return typeof BW!=="undefined"?BW:null},set BW(v){BW=v},get G(){return typeof G!=="undefined"?G:null}};',ctx,{filename:'game.js'});
  return ctx;
}
module.exports={load};
