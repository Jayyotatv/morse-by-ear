/* Practice page: 60 second sprint, free copy, practice key, translator. */
(function(){
'use strict';
const M=window.MBE,C=window.MBE_COURSES,esc=M.esc,DB=M.DB;
const $=id=>document.getElementById(id);
const LETTERS='ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''),NUMS='1234567890'.split('');

function known(){
  const set=[];
  C.COURSES.forEach(c=>{if(c.id!=='first-letters'&&c.id!=='ear-speed')return;c.classes.forEach((k,i)=>{if(DB.done[c.id+'/'+(i+1)]&&k.fresh)k.fresh.split('').forEach(ch=>{if(set.indexOf(ch)<0)set.push(ch)})})});
  return set;
}

/* sprint */
const MODES={known:'Letters I know',letters:'All letters',numbers:'Numbers'};
let mode=known().length>=4?'known':'letters';
const root=$('sprintRoot');
let running=false,score=0,ans=null,prev=null,endAt=0,tick=null,poolNow=[];
function poolFor(m){if(m==='numbers')return NUMS;if(m==='letters')return LETTERS;const k=known();return k.length>=4?k:'ETIANM'.split('')}
function best(){return (DB.sprint&&DB.sprint[mode])||0}
function idle(msg){
  running=false;clearInterval(tick);
  const kn=known().length;
  root.innerHTML='<div class="seg" role="group" aria-label="Letter set">'+Object.keys(MODES).map(m=>'<button class="btn sm plain" type="button" data-m="'+m+'" aria-pressed="'+(m===mode)+'">'+MODES[m]+'</button>').join('')+'</div>'+
    (mode==='known'&&kn<4?'<p class="small">You haven\'t passed a letter class yet, so this uses E T I A N M.</p>':'')+
    '<div class="clock"><div><b class="num">60</b><span>seconds</span></div><div><b class="num">'+(msg?score:0)+'</b><span>'+(msg?'this round':'score')+'</span></div><div><b class="num">'+best()+'</b><span>your best</span></div></div>'+
    (msg?'<p class="fb ok" style="color:#7AD39E">'+esc(msg)+'</p>':'')+
    '<div class="row"><button class="btn" type="button" data-s="go">'+(msg?'Play again':'Start the sprint')+'</button></div><p class="small">On a computer you can type the letter instead of tapping it.</p>';
}
function choices(){
  const set=poolNow.length<=12?poolNow:[ans].concat(M.shuffle(poolNow.filter(c=>c!==ans)).slice(0,7));
  return poolNow.filter(c=>set.indexOf(c)>-1);
}
function ask(){
  let c,g=0;do{c=M.pick(poolNow);g++}while(c===prev&&g<10);prev=c;ans=c;
  root.querySelector('[data-s="pad"]').innerHTML=choices().map(ch=>'<button class="tile slim" type="button" data-c="'+esc(ch)+'"><b>'+esc(ch)+'</b></button>').join('');
  M.play(c);
}
function start(){
  poolNow=poolFor(mode);score=0;running=true;prev=null;
  root.innerHTML='<div class="clock"><div><b class="num" data-s="t">60</b><span>seconds left</span></div><div><b class="num" data-s="sc">0</b><span>score</span></div><div><b class="num">'+best()+'</b><span>your best</span></div></div>'+
    '<div class="pad" data-s="pad" aria-label="Choices"></div><div class="row"><button class="btn sm plain" type="button" data-s="again"><span class="tri"></span>Hear it again</button><button class="btn sm plain" type="button" data-s="stop">Stop</button></div>';
  endAt=performance.now()+60000;
  tick=setInterval(()=>{const left=Math.max(0,Math.ceil((endAt-performance.now())/1000));const t=root.querySelector('[data-s="t"]');if(t)t.textContent=left;if(left<=0)finish()},200);
  ask();M.practiced();
}
function finish(){
  M.stop();clearInterval(tick);
  const old=best();DB.sprint=DB.sprint||{};if(score>old){DB.sprint[mode]=score}M.save();
  idle(score>old&&score>0?'New best: '+score+'.':score+' right. Your best is '+old+'.');
}
function answer(c){
  if(!running||!ans)return;
  const b=root.querySelector('[data-c="'+(window.CSS&&CSS.escape?CSS.escape(c):c)+'"]');
  if(c===ans){score++;root.querySelector('[data-s="sc"]').textContent=score;if(b)b.classList.add('right');ans=null;setTimeout(()=>{if(running)ask()},220)}
  else{if(b){b.classList.add('wrong');setTimeout(()=>b.classList.remove('wrong'),400)}M.play(ans)}
}
root.addEventListener('click',e=>{
  const m=e.target.closest('[data-m]');if(m){mode=m.dataset.m;idle();return}
  const s=e.target.closest('[data-s]');
  if(s&&s.dataset.s==='go'){start();return}
  if(s&&s.dataset.s==='again'){if(ans)M.play(ans);return}
  if(s&&s.dataset.s==='stop'){M.stop();clearInterval(tick);running=false;idle();return}
  const b=e.target.closest('[data-c]');if(b)answer(b.dataset.c);
});
document.addEventListener('keydown',e=>{
  if(!running||e.metaKey||e.ctrlKey||e.altKey||/input|textarea|select/i.test(document.activeElement.tagName))return;
  const k=e.key.toUpperCase();if(poolNow.indexOf(k)>-1){e.preventDefault();answer(k)}
});
idle();

/* free copy */
const SRC={known:'Letters I know',letters:'All letters',words:'Common words',abbr:'Abbreviations',calls:'Callsigns',q:'Q codes'};
let src=known().length>=4?'known':'letters';
function groups(pool){return ()=>Array.from({length:5},()=>{let w='';for(let n=0;n<5;n++)w+=M.pick(pool);return w})}
function copyRender(){
  $('copySeg').innerHTML=Object.keys(SRC).map(k=>'<button class="btn sm plain" type="button" data-src="'+k+'" aria-pressed="'+(k===src)+'">'+SRC[k]+'</button>').join('');
  let gen,unit=' groups';
  if(src==='known')gen=groups(poolFor('known'));
  else if(src==='letters')gen=groups(LETTERS);
  else{gen=C.SETS[src==='words'?'common':src].gen;unit=' words'}
  M.Drill($('copyRoot'),gen,{pass:90,unit,passText:'Clean copy. Try a faster overall speed under Sound.'});
}
$('copySeg').addEventListener('click',e=>{const b=e.target.closest('[data-src]');if(!b)return;M.stop();src=b.dataset.src;copyRender()});
copyRender();

M.Keyer($('keyRoot'));
M.Translator($('txRoot'),'CQ CQ DE K1ABC K');
})();
