/* Morse by Ear core: code table, sound engine, saved progress, and the shared widgets
   (tape, glyphs, copy drill, letter quiz, practice key, translator, sound settings). */
(function(){
'use strict';

const CODE={A:'.-',B:'-...',C:'-.-.',D:'-..',E:'.',F:'..-.',G:'--.',H:'....',I:'..',J:'.---',K:'-.-',L:'.-..',M:'--',N:'-.',O:'---',P:'.--.',Q:'--.-',R:'.-.',S:'...',T:'-',U:'..-',V:'...-',W:'.--',X:'-..-',Y:'-.--',Z:'--..',
'0':'-----','1':'.----','2':'..---','3':'...--','4':'....-','5':'.....','6':'-....','7':'--...','8':'---..','9':'----.',
'.':'.-.-.-',',':'--..--','?':'..--..','/':'-..-.','=':'-...-','+':'.-.-.','-':'-....-','@':'.--.-.',"'":'.----.','!':'-.-.--',':':'---...'};
const REV={};Object.keys(CODE).forEach(k=>{REV[CODE[k]]=k});

const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const pick=a=>a[Math.floor(Math.random()*a.length)];
const shuffle=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));const t=a[i];a[i]=a[j];a[j]=t}return a};
const codeOf=t=>{if(t.length>1){return t.split('').map(c=>CODE[c]||'').join('')}return CODE[t]||''};
const spoken=code=>code.split('').map(c=>c==='.'?'dit':'dah').join(' ');
const glyph=code=>'<span class="glyph" aria-hidden="true">'+code.split('').map(c=>c==='-'?'<i class="d"></i>':'<i></i>').join('')+'</span>';

/* saved progress, this browser only */
const KEY='mbe2';
const DB={done:{},best:{},days:[],sprint:{},settings:{}};
try{const s=JSON.parse(localStorage.getItem(KEY)||'null');if(s&&typeof s==='object')Object.assign(DB,s)}catch(e){}
function save(){try{localStorage.setItem(KEY,JSON.stringify(DB))}catch(e){}}
const ymd=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
function practiced(){const t=ymd(new Date());if(DB.days[DB.days.length-1]!==t){DB.days.push(t);if(DB.days.length>500)DB.days.shift();save()}}
function streak(){
  const set=new Set(DB.days);const d=new Date();let n=0;
  if(!set.has(ymd(d)))d.setDate(d.getDate()-1);
  while(set.has(ymd(d))){n++;d.setDate(d.getDate()-1)}
  return n;
}

const S=Object.assign({cwpm:20,ewpm:10,freq:600,vol:0.6,swpm:15},DB.settings||{});
function saveS(){DB.settings=S;save()}

/* timing: unit from character speed, Farnsworth gaps from overall speed (ARRL formula) */
function timing(std){
  if(std)return {u:1,cg:3,wg:7};
  const c=S.cwpm,e=Math.min(S.ewpm,c),u=1.2/c;
  let cg=3*u,wg=7*u;
  if(e<c){const ta=(60*c-37.2*e)/(c*e);cg=3*ta/19;wg=7*ta/19}
  return {u,cg,wg};
}
function tokens(text){
  const out=[];const t=String(text).toUpperCase();
  for(let i=0;i<t.length;i++){
    const c=t[i];
    if(/\s/.test(c)){if(out.length&&out[out.length-1]!==' ')out.push(' ');continue}
    if(c==='<'){const j=t.indexOf('>',i);if(j>i){const w=t.slice(i+1,j);const code=codeOf(w);if(code)out.push({ch:w,code});i=j;continue}}
    if(CODE[c])out.push({ch:c,code:CODE[c]});
  }
  while(out.length&&out[out.length-1]===' ')out.pop();
  return out;
}

/* sound */
let ctx=null,cur=null,curBtn=null,curDone=null;
function ac(){if(!ctx){const A=window.AudioContext||window.webkitAudioContext;ctx=new A()}if(ctx.state==='suspended')ctx.resume();return ctx}
function stop(){
  if(cur){try{cur.o.stop()}catch(e){}try{cur.o.disconnect();cur.g.disconnect()}catch(e){}cur=null}
  const d=curDone;curDone=null;if(d)d();
}
function play(text,done,speed){
  stop();const a=ac();
  const saved=speed?{c:S.cwpm,e:S.ewpm}:null;if(speed){S.cwpm=speed;S.ewpm=speed}
  const T=timing();if(saved){S.cwpm=saved.c;S.ewpm=saved.e}
  const u=T.u;const g=a.createGain();g.gain.value=0;const o=a.createOscillator();o.type='sine';o.frequency.value=S.freq;o.connect(g);g.connect(a.destination);
  const t0=a.currentTime+0.08;let t=t0;const v=S.vol*0.6,r=0.005;
  tokens(text).forEach(tok=>{
    if(tok===' '){t+=T.wg-T.cg;return}
    for(let k=0;k<tok.code.length;k++){
      const d=tok.code[k]==='.'?u:3*u;
      g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+r);g.gain.setValueAtTime(v,t+d-r);g.gain.linearRampToValueAtTime(0,t+d);
      t+=d;if(k<tok.code.length-1)t+=u;
    }
    t+=T.cg;
  });
  o.start(t0-0.01);o.stop(t+0.05);
  const me={o,g};cur=me;curDone=done||null;
  o.onended=()=>{if(cur===me){cur=null;const d=curDone;curDone=null;if(d)d()}};
  return t-t0;
}
const isTile=b=>b.classList.contains('tile')||b.classList.contains('chip');
function setBtn(btn,on){
  if(!btn)return;
  if(isTile(btn)){btn.classList.toggle('on',on);return}
  if(btn.dataset.label===undefined)btn.dataset.label=btn.innerHTML;
  btn.innerHTML=on?'<span class="sq"></span>Stop':btn.dataset.label;
}
function playFrom(btn,text,opts){
  opts=opts||{};
  if(curBtn===btn&&cur&&!isTile(btn)){stop();return}
  stop();const b=btn;curBtn=b;setBtn(b,true);
  const tape=opts.tape||null;
  const dur=play(text,()=>{setBtn(b,false);if(curBtn===b)curBtn=null;if(tape)resetHead(tape)},opts.speed);
  if(tape)runHead(tape,dur);
}
document.addEventListener('click',e=>{
  const b=e.target.closest('[data-play]');if(!b)return;
  playFrom(b,b.dataset.play,{tape:b.dataset.tape?document.getElementById(b.dataset.tape):null});
});

/* paper tape drawn to timing units */
function drawTape(el,text,o){
  o=o||{};const px=o.px||8;
  const T=timing(o.std);const cg=o.std?3:T.cg/T.u,wg=o.std?7:T.wg/T.u;
  let x=0,html='';const toks=tokens(text);
  toks.forEach((tok,i)=>{
    if(tok===' '){x+=wg-cg;return}
    html+='<span class="lbl" style="left:'+(x*px)+'px">'+esc(tok.ch)+'</span>';
    for(let k=0;k<tok.code.length;k++){const w=tok.code[k]==='.'?1:3;html+='<span class="m" style="left:'+(x*px)+'px;width:'+(w*px)+'px"></span>';x+=w;if(k<tok.code.length-1)x+=1}
    if(i<toks.length-1)x+=cg;
  });
  if(o.trailing)x+=wg;
  if(o.ruler){for(let n=0;n<=x;n+=5){html+='<span class="tick" style="left:'+(n*px)+'px"></span>';if(n%10===0)html+='<span class="tn num" style="left:'+(n*px)+'px">'+n+'</span>'}}
  html+='<span class="head"></span>';
  el.innerHTML=html;el.style.width=Math.ceil(x*px+(o.ruler?14:2))+'px';el.dataset.w=x*px;
}
function runHead(tape,dur){
  if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  const h=tape.querySelector('.head');if(!h)return;
  h.style.transition='none';h.style.left='0px';tape.classList.add('run');void h.offsetWidth;
  setTimeout(()=>{h.style.transition='left '+dur+'s linear';h.style.left=tape.dataset.w+'px'},80);
}
function resetHead(tape){const h=tape.querySelector('.head');tape.classList.remove('run');if(h){h.style.transition='none';h.style.left='0px'}}

/* letter tile */
function tile(ch,o){
  o=o||{};const code=codeOf(ch);const play=o.play||ch;
  return '<button class="tile'+(o.cls?' '+o.cls:'')+'" type="button" data-play="'+esc(play)+'" aria-label="'+esc(o.name||ch)+', '+spoken(code)+'"><b>'+esc(o.label||ch)+'</b>'+(o.noGlyph?'':glyph(code))+'</button>';
}

/* sound settings dialog, opened from the nav */
function soundDialog(){
  const btn=document.querySelector('.sound-btn');if(!btn)return;
  const d=document.createElement('dialog');d.className='sound';d.setAttribute('aria-labelledby','soundTitle');
  const sl=(id,label,min,max,step)=>'<div class="sl"><div><label for="s-'+id+'">'+label+'</label><output id="s-'+id+'-v"></output></div><input type="range" id="s-'+id+'" min="'+min+'" max="'+max+'" step="'+step+'"></div>';
  d.innerHTML='<form method="dialog"><h2 id="soundTitle">Sound</h2>'+sl('cwpm','Letter speed',12,35,1)+sl('ewpm','Overall speed',5,35,1)+sl('freq','Tone',400,900,10)+sl('vol','Volume',0.05,1,0.05)+
    '<p class="small">Keep letter speed near 20 WPM. If drills feel fast, lower overall speed. That adds space between letters without changing how each letter sounds.</p><div class="row"><button class="btn" value="ok">Done</button><button class="btn plain" type="button" id="s-test"><span class="tri"></span>Test sound</button></div></form>';
  document.body.appendChild(d);
  const fmt={cwpm:v=>v+' WPM',ewpm:v=>Math.min(v,S.cwpm)+' WPM',freq:v=>v+' Hz',vol:v=>Math.round(v*100)+'%'};
  const sync=()=>['cwpm','ewpm','freq','vol'].forEach(k=>{d.querySelector('#s-'+k).value=S[k];d.querySelector('#s-'+k+'-v').textContent=fmt[k](S[k])});
  ['cwpm','ewpm','freq','vol'].forEach(k=>d.querySelector('#s-'+k).addEventListener('input',e=>{
    S[k]=parseFloat(e.target.value);if(S.ewpm>S.cwpm)S.ewpm=S.cwpm;sync();saveS();document.dispatchEvent(new CustomEvent('mbe:sound'));
  }));
  d.querySelector('#s-test').addEventListener('click',e=>playFrom(e.currentTarget,'PARIS'));
  btn.addEventListener('click',()=>{sync();if(d.showModal)d.showModal();else d.setAttribute('open','')});
}

/* typed copy drill */
let uid=0;
function Drill(root,gen,o){
  o=o||{};const id='dr'+(uid++);let items=gen();const need=o.pass||90;
  root.innerHTML='<div class="work"><div class="row"><button class="btn" type="button" data-a="play"><span class="tri"></span>Play</button><button class="btn plain" type="button" data-a="new">New set</button><span class="small num" data-a="meta"></span></div>'+
   '<div><label class="f" for="'+id+'">Type what you hear</label><div class="entry"><input type="text" class="caps" id="'+id+'" autocomplete="off" autocorrect="off" autocapitalize="characters" spellcheck="false"><button class="btn ink" type="button" data-a="check">Check</button></div></div><div class="work" data-a="res" aria-live="polite"></div></div>';
  const q=s=>root.querySelector('[data-a="'+s+'"]'),input=root.querySelector('input'),res=q('res');
  const meta=()=>{q('meta').textContent=items.length+(o.unit||' groups')+', '+items.join('').length+' characters'};meta();
  q('play').addEventListener('click',e=>{playFrom(e.currentTarget,items.join(' '));input.focus({preventScroll:true})});
  q('new').addEventListener('click',()=>{stop();items=gen();input.value='';res.innerHTML='';meta()});
  const check=()=>{
    const typed=input.value.toUpperCase().trim().split(/\s+/).filter(Boolean);
    const total=items.join('').length;let right=0;const marks=[];
    if(typed.length===items.length){items.forEach((w,i)=>{marks.push(w.split('').map((c,j)=>{const ok=typed[i][j]===c;if(ok)right++;return ok}))})}
    else{const flat=typed.join('');let p=0;items.forEach(w=>{marks.push(w.split('').map(c=>{const ok=flat[p++]===c;if(ok)right++;return ok}))})}
    const pct=total?Math.round(right/total*100):0;const pass=pct>=need;
    res.innerHTML='<div class="score '+(pass?'pass':'fail')+'">'+right+' of '+total+' right, '+pct+'%. '+(pass?esc(o.passText||'Passed.'):'Aim for '+need+'%. Play it again, or try a new set.')+'</div>'+
      '<div class="small">What was sent. Misses are underlined.</div><div class="copyline">'+items.map((w,i)=>'<span>'+w.split('').map((c,j)=>'<span class="'+(marks[i][j]?'ok':'no')+'">'+esc(c)+'</span>').join('')+'</span>').join('')+'</div>';
    practiced();if(o.onScore)o.onScore(pct,pass);
  };
  q('check').addEventListener('click',check);
  input.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();check()}});
}

/* letter quiz: hear one, pick it */
function Quiz(root,o){
  const fresh=o.fresh,pool=o.pool||o.fresh,count=o.count||10,need=o.pass||8;
  let n=0,right=0,ans=null,prev=null,missed=false,timer=null,marks=[];
  const choicesFor=a=>{let set=pool.length<=8?pool.slice():[a].concat(shuffle(pool.filter(c=>c!==a)).slice(0,7));return pool.filter(c=>set.indexOf(c)>-1)};
  function frame(){
    root.innerHTML='<div class="work"><div class="row"><button class="btn" type="button" data-q="play"><span class="tri"></span>'+(ans?'Hear it again':'Play a letter')+'</button><span class="small num" data-q="n">Question '+Math.min(n+1,count)+' of '+count+'</span></div>'+
      '<div class="meter" aria-hidden="true">'+Array.from({length:count},(_,i)=>'<i class="'+(marks[i]||'')+'"></i>').join('')+'</div>'+
      '<p>Which one did you hear?</p><div class="pad" data-q="ch"></div><div class="fb" data-q="fb" aria-live="polite">'+(ans?'Listen, then pick one. You can also press the key on your keyboard.':'Press play to hear the first one.')+'</div></div>';
  }
  function choices(){const a=ans||fresh[0];root.querySelector('[data-q="ch"]').innerHTML=choicesFor(a).map(c=>'<button class="tile slim" type="button" data-c="'+esc(c)+'" aria-label="'+esc(c)+'"><b>'+esc(c)+'</b></button>').join('')}
  function ask(){
    const src=Math.random()<0.7?fresh:pool;let c;let guard=0;do{c=pick(src);guard++}while(c===prev&&guard<10&&pool.length>1);
    prev=c;ans=c;missed=false;frame();choices();play(c);
  }
  function answer(c){
    if(!ans){ask();return}
    const b=root.querySelector('[data-c="'+(window.CSS&&CSS.escape?CSS.escape(c):c)+'"]');
    const fb=root.querySelector('[data-q="fb"]');
    if(c===ans){
      if(b)b.classList.add('right');marks[n]=missed?'no':'ok';if(!missed)right++;n++;practiced();
      fb.className='fb ok';fb.innerHTML='Yes, '+esc(ans)+' '+glyph(CODE[ans]);const done=n>=count;ans=null;
      timer=setTimeout(()=>{done?finish():ask()},900);
    }else{
      if(b)b.classList.add('wrong');missed=true;fb.className='fb no';fb.textContent='Not that one. Listen again.';play(ans);
    }
  }
  function finish(){
    const pass=right>=need;
    root.innerHTML='<div class="work"><div class="meter" aria-hidden="true">'+marks.map(m=>'<i class="'+m+'"></i>').join('')+'</div><div class="score '+(pass?'pass':'fail')+'">'+right+' of '+count+' right on the first try. '+(pass?esc(o.passText||'Passed.'):'You need '+need+' to pass. One more round?')+'</div><div class="row"><button class="btn'+(pass?' plain':'')+'" type="button" data-q="again">Go again</button></div></div>';
    root.querySelector('[data-q="again"]').addEventListener('click',reset);
    if(o.onDone)o.onDone(Math.round(right/count*100),pass);
  }
  function reset(){clearTimeout(timer);n=0;right=0;ans=null;marks=[];frame();choices()}
  root.addEventListener('click',e=>{
    if(e.target.closest('[data-q="play"]')){if(ans)play(ans);else ask();return}
    const b=e.target.closest('[data-c]');if(b)answer(b.dataset.c);
  });
  const onKey=e=>{
    if(!root.isConnected){document.removeEventListener('keydown',onKey);return}
    if(e.metaKey||e.ctrlKey||e.altKey||/input|textarea|select/i.test(document.activeElement.tagName))return;
    const k=e.key.toUpperCase();if(ans&&pool.indexOf(k)>-1){e.preventDefault();answer(k)}
  };
  document.addEventListener('keydown',onKey);
  reset();
  return {destroy(){clearTimeout(timer);document.removeEventListener('keydown',onKey)}};
}

/* practice key: hold to send, decoded from your timing */
function Keyer(root,o){
  o=o||{};const targets=o.targets||'CQ TEST 73 PARIS SOS DE TNX NAME QTH FB RST 599 HELLO MORSE'.split(' ');const need=o.need||0;
  let target=targets[0],clean=0,ti=0;
  root.innerHTML='<div class="keyer"><div class="main"><button class="paddle" type="button" aria-label="Morse key. Hold to send. When focused, the space bar also keys."><div><b>Key</b><span>Hold here, or tap once and use the space bar</span></div></button>'+
    '<div class="ktape" aria-hidden="true"></div><div class="kout" aria-live="polite"></div><div class="kstat">Send a dit to see how your timing compares.</div>'+
    '<div class="row"><button class="btn sm plain" type="button" data-k="clear">Clear</button><label class="kstat" for="sw'+uid+'">Speed</label><select id="sw'+(uid++)+'" data-k="speed">'+[8,10,12,15,18,20,25].map(v=>'<option value="'+v+'"'+(v==S.swpm?' selected':'')+'>'+v+' WPM</option>').join('')+'</select></div></div>'+
    '<div class="side"><div class="kstat">Send this</div><div class="ktarget" data-k="target"></div><div data-k="tglyph"></div><div class="fb" data-k="fb" aria-live="polite"></div>'+
    (need?'<div class="kstat num" data-k="count"></div>':'')+
    '<div class="row"><button class="btn sm" type="button" data-k="hear"><span class="tri"></span>Hear it</button><button class="btn sm plain" type="button" data-k="next">Skip</button></div>'+
    '<p class="kstat">Make each dah three times as long as a dit. Leave a clear pause between letters.</p></div></div>';
  const q=s=>root.querySelector('[data-k="'+s+'"]'),paddle=root.querySelector('.paddle'),kout=root.querySelector('.kout'),ktape=root.querySelector('.ktape'),kstat=root.querySelector('.kstat');
  let osc=null,gain=null,down=false,t0=0,lastUp=0,curc='',text='',charT=null,wordT=null;
  const unit=()=>1200/S.swpm;
  const showT=()=>{q('target').textContent=target;q('tglyph').innerHTML='<span style="font-size:18px;display:inline-flex;gap:14px;flex-wrap:wrap">'+tokens(target).map(t=>t===' '?'':glyph(t.code)).join('')+'</span>';if(need)q('count').textContent=clean+' of '+need+' sent clean'};
  const render=()=>{kout.innerHTML=esc(text)+'<span class="cur">'+curc.replace(/\./g,'·').replace(/-/g,'–')+'</span>'};
  const tapeAdd=h=>{ktape.insertAdjacentHTML('beforeend',h);while(ktape.children.length>120)ktape.removeChild(ktape.firstChild)};
  function kd(){
    if(down)return;down=true;stop();const a=ac();
    if(!osc){osc=a.createOscillator();gain=a.createGain();gain.gain.value=0;osc.connect(gain);gain.connect(a.destination);osc.start()}
    osc.frequency.setValueAtTime(S.freq,a.currentTime);gain.gain.cancelScheduledValues(a.currentTime);gain.gain.setTargetAtTime(S.vol*0.6,a.currentTime,0.004);
    clearTimeout(charT);clearTimeout(wordT);const now=performance.now();
    if(lastUp){tapeAdd('<u style="width:'+(Math.min((now-lastUp)/unit(),8)*6)+'px"></u>')}
    t0=now;paddle.classList.add('down');
  }
  function ku(){
    if(!down)return;down=false;paddle.classList.remove('down');
    if(gain){gain.gain.cancelScheduledValues(ctx.currentTime);gain.gain.setTargetAtTime(0,ctx.currentTime,0.004)}
    const now=performance.now(),dur=now-t0,u=unit(),sym=dur<2*u?'.':'-';curc+=sym;
    tapeAdd('<i style="width:'+Math.max(3,Math.min(dur/u,6)*6)+'px"></i>');
    const ideal=sym==='.'?u:3*u,off=Math.round((dur-ideal)/ideal*100);
    kstat.textContent='Last '+(sym==='.'?'dit':'dah')+' '+Math.round(dur)+' ms. Target '+Math.round(ideal)+' ms ('+(off>=0?'+':'')+off+'%).';
    lastUp=now;render();
    charT=setTimeout(()=>{text+=REV[curc]||'*';curc='';render()},2.5*u);
    wordT=setTimeout(()=>{text+=' ';lastUp=0;tapeAdd('<s></s>');render();checkWord()},6*u);
  }
  function checkWord(){
    const w=text.trim().split(/\s+/).pop()||'';if(!w)return;const fb=q('fb');practiced();
    const want=target.replace(/\s+/g,'');
    if(w===want||text.trim().replace(/\s+/g,'').endsWith(want)&&target.indexOf(' ')>-1){
      clean++;fb.className='fb ok';fb.textContent='Clean. You sent '+target+'.';
      if(need&&clean>=need&&o.onDone){showT();o.onDone();return}
      setTimeout(()=>{next();},900);
    }else{fb.className='fb no';fb.textContent='Decoded as '+w+'. '+(w.indexOf('*')>-1?'A * means the pattern is not a letter. Check your dah length.':'Try again and leave more space between letters.')}
  }
  function next(){ti=(ti+1)%targets.length;target=targets[ti];text='';curc='';ktape.innerHTML='';render();showT()}
  paddle.addEventListener('pointerdown',e=>{e.preventDefault();paddle.focus({preventScroll:true});try{paddle.setPointerCapture(e.pointerId)}catch(_){}kd()});
  paddle.addEventListener('pointerup',ku);paddle.addEventListener('pointercancel',ku);
  paddle.addEventListener('keydown',e=>{if(e.code==='Space'||e.key===' '){e.preventDefault();if(!e.repeat)kd()}});
  paddle.addEventListener('keyup',e=>{if(e.code==='Space'||e.key===' '){e.preventDefault();ku()}});
  paddle.addEventListener('blur',ku);
  paddle.addEventListener('contextmenu',e=>e.preventDefault());
  q('clear').addEventListener('click',()=>{clearTimeout(charT);clearTimeout(wordT);text='';curc='';lastUp=0;ktape.innerHTML='';q('fb').textContent='';render()});
  q('speed').addEventListener('change',e=>{S.swpm=+e.target.value;saveS()});
  q('next').addEventListener('click',()=>{q('fb').textContent='';next()});
  q('hear').addEventListener('click',e=>playFrom(e.currentTarget,target,{speed:S.swpm}));
  showT();render();
}

/* text to Morse */
function Translator(root,initial){
  root.innerHTML='<label class="f" for="tx'+uid+'">Type any text</label><textarea id="tx'+(uid++)+'">'+esc(initial||'CQ CQ DE K1ABC K')+'</textarea><div data-t="out" style="display:flex;flex-wrap:wrap;gap:14px 22px;align-items:center;margin-block:18px;font-size:20px"></div><button class="btn" type="button" data-t="play"><span class="tri"></span>Play</button>';
  const tx=root.querySelector('textarea'),out=root.querySelector('[data-t="out"]');
  const r=()=>{const t=tokens(tx.value);out.innerHTML=t.length?t.map(k=>k===' '?'<span class="small" aria-hidden="true">/</span>':'<span style="display:inline-flex;align-items:center;gap:8px"><b>'+esc(k.ch)+'</b>'+glyph(k.code)+'</span>').join(''):'<span class="small">Letters and numbers show up here.</span>'};
  tx.addEventListener('input',r);r();
  root.querySelector('[data-t="play"]').addEventListener('click',e=>playFrom(e.currentTarget,tx.value));
}

/* offline support */
if('serviceWorker' in navigator&&location.protocol==='https:'){window.addEventListener('load',()=>{navigator.serviceWorker.register('sw.js').catch(()=>{})})}

document.addEventListener('DOMContentLoaded',soundDialog);

window.MBE={CODE,REV,S,DB,save,saveS,practiced,streak,esc,pick,shuffle,codeOf,spoken,glyph,tokens,timing,play,stop,playFrom,drawTape,tile,Drill,Quiz,Keyer,Translator};
})();
