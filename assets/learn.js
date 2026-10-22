/* Courses page: dashboard, catalog, and the class player (#course-id/class-number). */
(function(){
'use strict';
const M=window.MBE,C=window.MBE_COURSES,esc=M.esc,DB=M.DB;
const $=id=>document.getElementById(id);
const key=(c,i)=>c.id+'/'+(i+1);
const total=C.COURSES.reduce((n,c)=>n+c.classes.length,0);
let active=null;

function lettersKnown(){
  const set=new Set();
  C.COURSES.forEach(c=>c.classes.forEach((k,i)=>{if(DB.done[key(c,i)]&&k.fresh&&(c.id==='first-letters'||c.id==='ear-speed'))k.fresh.split('').forEach(ch=>set.add(ch))}));
  return set;
}
function nextClass(){
  for(const c of C.COURSES){const i=c.classes.findIndex((_,j)=>!DB.done[key(c,j)]);if(i>-1)return {c,i}}
  return null;
}
function dash(){
  const passed=Object.keys(DB.done).filter(k=>DB.done[k]).length;
  $('stats').innerHTML=[
    [lettersKnown().size,'letters and numbers you know of 46'],
    [passed,'classes passed of '+total],
    [DB.days.length,'days practiced'],
    [M.streak(),'day streak']
  ].map(s=>'<div><b class="num">'+s[0]+'</b><span>'+s[1]+'</span></div>').join('');
  const n=nextClass(),btn=$('continue');
  if(!n){btn.textContent='Practice games';btn.href='practice.html'}
  else{btn.href='#'+n.c.id+'/'+(n.i+1);btn.textContent=passed?'Continue: '+n.c.name+', class '+(n.i+1):'Start the first class'}
}
function catalog(){
  $('cat').innerHTML=C.COURSES.map(c=>{
    const d=c.classes.map((_,i)=>!!DB.done[key(c,i)]),n=d.filter(Boolean).length;
    return '<li><a href="#'+c.id+'"><div><h2>'+esc(c.name)+'</h2><div class="meta num">'+c.classes.length+' classes. '+c.time+'.</div></div><p>'+esc(c.blurb)+'</p>'+
      '<div class="prog"><div class="bar" aria-hidden="true">'+d.map(x=>'<i'+(x?' class="d"':'')+'></i>').join('')+'</div><span class="num">'+(n===c.classes.length?'Finished':n?n+' of '+c.classes.length+' passed':'Not started')+'</span></div></a></li>';
  }).join('');
}
function classList(c,cur){
  $('classList').innerHTML=c.classes.map((k,i)=>{
    const done=DB.done[key(c,i)],best=DB.best[key(c,i)];
    return '<li><button type="button" data-i="'+i+'" aria-current="'+(i===cur)+'"><span class="n num">'+(i+1)+'</span><span class="t">'+esc(k.t)+'</span><span class="s'+(done?' ok':'')+'">'+(done?'Passed':best!=null?'Best '+best+'%':(k.type==='read'?'Read':' '))+'</span></button></li>';
  }).join('');
}

function pass(c,i,pct){
  const k=key(c,i);DB.done[k]=true;if(pct!=null)DB.best[k]=Math.max(DB.best[k]||0,pct);M.practiced();M.save();
  classList(c,i);dash();
  const bar=$('player').querySelector('[data-next]');if(!bar)return;
  const nx=i+1<c.classes.length?'#'+c.id+'/'+(i+2):(()=>{const ci=C.COURSES.indexOf(c);return ci+1<C.COURSES.length?'#'+C.COURSES[ci+1].id+'/1':'practice.html'})();
  const label=i+1<c.classes.length?'Next class: '+c.classes[i+1].t:(C.COURSES.indexOf(c)+1<C.COURSES.length?'Start '+C.COURSES[C.COURSES.indexOf(c)+1].name:'Go to practice games');
  bar.hidden=false;bar.innerHTML='<span class="score pass">Class passed.</span><a class="btn" href="'+nx+'">'+esc(label)+'</a>';
}
function score(c,i,pct){const k=key(c,i);DB.best[k]=Math.max(DB.best[k]||0,pct);M.save();classList(c,i);dash()}

/* class player */
function player(c,i){
  if(active&&active.destroy)active.destroy();active=null;M.stop();
  const k=c.classes[i],p=$('player');
  p.innerHTML='<div><div class="sub num">'+esc(c.name)+', class '+(i+1)+' of '+c.classes.length+'</div><h3 class="ct" style="margin-top:8px">'+esc(k.t)+'</h3></div><p>'+esc(k.note||'')+'</p><div id="body" class="work"></div><div class="nextbar" data-next hidden></div>';
  const body=$('body');
  if(DB.done[key(c,i)]){const b=p.querySelector('[data-next]');b.hidden=false;pass(c,i)}
  const T={learn,copy,send,read,qso,sim}[k.type];if(T)T(c,i,k,body);
}
function pool(c,i,k){
  if(k.pool)return k.pool.split('');
  const set=[];c.classes.slice(0,i+1).forEach(x=>{if(!x.pool&&x.fresh)x.fresh.split('').forEach(ch=>{if(set.indexOf(ch)<0)set.push(ch)})});
  return set;
}
function learn(c,i,k,body){
  const fresh=k.fresh.split('');
  body.innerHTML=(fresh.length<=10?'<div class="part" style="border:0;padding:0"><h4>Listen</h4><p class="small">Tap each one a few times and say it out loud. "Di-dah" for A, not "dot dash".</p><div class="pad">'+fresh.map(ch=>M.tile(ch)).join('')+'</div></div>':'')+
    '<div class="part"'+(fresh.length>10?' style="border:0;padding:0"':'')+'><h4>Quiz</h4><div id="qz"></div></div>';
  active=M.Quiz($('qz'),{fresh,pool:pool(c,i,k),count:k.count||10,pass:k.pass||8,passText:'Class passed.',onDone:(pct,ok)=>{ok?pass(c,i,pct):score(c,i,pct)}});
}
function copy(c,i,k,body){
  let gen,unit;
  if(k.koch!=null){
    const fresh=k.fresh.split(''),all=C.KOCH.slice(0,k.koch+1).join('').split('');
    gen=()=>Array.from({length:5},()=>{let w='';for(let n=0;n<5;n++)w+=Math.random()<0.4?M.pick(fresh):M.pick(all);return w});unit=' groups';
    body.innerHTML='<div class="part" style="border:0;padding:0"><h4>New characters</h4><p class="small">Tap to hear each one. The drill also mixes in every character from earlier classes.</p><div class="pad">'+fresh.map(ch=>M.tile(ch,{noGlyph:true})).join('')+'</div></div><div class="part"><h4>Copy drill</h4><div id="dr"></div></div>';
  }else{
    gen=C.SETS[k.set].gen;unit=' words';
    body.innerHTML='<div class="part" style="border:0;padding:0"><h4>Copy drill</h4><div id="dr"></div></div>';
  }
  M.Drill($('dr'),gen,{pass:k.pass||90,unit,passText:'Class passed.',onScore:(pct,ok)=>{ok?pass(c,i,pct):score(c,i,pct)}});
}
function send(c,i,k,body){
  const need=Math.min(5,k.targets.length);
  body.innerHTML='<p class="small">Hold the key to make a tone. Send each word, then pause. Get '+need+' clean to pass. On a computer, click the key once and use the space bar.</p><div id="ky"></div>';
  M.Keyer($('ky'),{targets:k.targets,need,onDone:()=>pass(c,i,100)});
}
const QSO=[
  ['CQ CQ DE K1ABC K','K1ABC calls anyone listening. DE means "from". K means "go ahead".'],
  ['K1ABC DE W7XYZ K','W7XYZ answers: "K1ABC, this is W7XYZ, go ahead."'],
  ['W7XYZ DE K1ABC GM UR RST 579 NAME JOHN QTH OHIO HW? BK','Good morning. Your signal report is 579. My name is John, I\'m in Ohio. How do you copy? Back to you.'],
  ['K1ABC DE W7XYZ R TNX UR RST 599 NAME SUE QTH UTAH BK','Received, thanks. Your report is 599. I\'m Sue in Utah. Back to you.'],
  ['TNX FER QSO SUE 73 <SK>','Thanks for the contact, Sue. Best regards. End of contact.'],
  ['TNX JOHN 73 <SK>','Sue signs off the same way.']
];
function read(c,i,k,body){
  body.innerHTML='<ol class="qso">'+QSO.map((l,n)=>'<li><button class="btn sm plain" type="button" data-play="'+esc(l[0])+'" aria-label="Play line '+(n+1)+'"><span class="tri"></span></button><span class="line">'+esc(l[0].replace(/[<>]/g,''))+'</span><span class="mean">'+esc(l[1])+'</span></li>').join('')+'</ol>'+
    '<p class="small">RST is a signal report: readability 1 to 5, strength 1 to 9, tone 1 to 9. 599 means perfect.</p><div class="row"><button class="btn" type="button" id="readAll"><span class="tri"></span>Play the whole contact</button><button class="btn ink" type="button" id="readDone">I\'ve read it</button></div>';
  $('readAll').addEventListener('click',e=>M.playFrom(e.currentTarget,QSO.map(l=>l[0]).join(' ')));
  $('readDone').addEventListener('click',()=>pass(c,i));
}
function makeQso(){
  return {their:C.call(),name:M.pick(C.NAMES),qth:M.pick(C.QTHS),rst:M.pick(C.RSTS)};
}
function fieldsHtml(id){
  return '<div class="fields">'+[['call','Their callsign'],['name','Their name'],['qth','Their location'],['rst','Report they gave you']].map(f=>'<div><label class="f" for="'+id+f[0]+'">'+f[1]+'</label><input type="text" class="caps" id="'+id+f[0]+'" autocomplete="off" autocorrect="off" autocapitalize="characters" spellcheck="false"></div>').join('')+'</div>';
}
function checkFields(id,q){
  const want={call:q.their,name:q.name,qth:q.qth,rst:q.rst};let ok=0;
  Object.keys(want).forEach(f=>{const el=$(id+f);const good=el.value.trim().toUpperCase()===want[f];el.style.borderColor=good?'var(--ok)':'var(--bad)';if(good)ok++});
  return ok;
}
function qso(c,i,k,body){
  const me=DB.mycall||'K1ABC';let q=makeQso();
  const txt=()=>me+' DE '+q.their+' GM UR RST '+q.rst+' '+q.rst+' NAME '+q.name+' '+q.name+' QTH '+q.qth+' '+q.qth+' HW? '+me+' DE '+q.their+' K';
  body.innerHTML='<p class="small">Your callsign in this class is '+esc(me)+'. Each detail is sent twice, the way operators do.</p><div class="row"><button class="btn" type="button" id="qPlay"><span class="tri"></span>Play the call</button><button class="btn plain" type="button" id="qNew">New station</button></div>'+fieldsHtml('q')+
    '<div class="row"><button class="btn ink" type="button" id="qCheck">Check</button></div><div id="qRes" class="work" aria-live="polite"></div>';
  $('qPlay').addEventListener('click',e=>M.playFrom(e.currentTarget,txt()));
  $('qNew').addEventListener('click',()=>{M.stop();q=makeQso();['call','name','qth','rst'].forEach(f=>{const el=$('q'+f);el.value='';el.style.borderColor=''});$('qRes').innerHTML=''});
  $('qCheck').addEventListener('click',()=>{
    const ok=checkFields('q',q);M.practiced();
    $('qRes').innerHTML='<div class="score '+(ok===4?'pass':'fail')+'">'+ok+' of 4 right.</div><div class="small">They sent: '+esc(txt())+'</div>';
    ok===4?pass(c,i,100):score(c,i,ok*25);
  });
}
function sim(c,i,k,body){
  let me=DB.mycall||'K1ABC',my=DB.myname||'ALEX',q=makeQso(),step=0;
  body.innerHTML='<div class="fields"><div><label class="f" for="mycall">Your callsign, or make one up</label><input type="text" class="caps" id="mycall" value="'+esc(me)+'" maxlength="10" autocomplete="off"></div><div><label class="f" for="myname">Your first name</label><input type="text" class="caps" id="myname" value="'+esc(my)+'" maxlength="12" autocomplete="off"></div></div>'+
    '<div class="part"><h4>Contact log</h4><div class="log" id="log"><div class="small">Nothing sent yet.</div></div></div><div class="part" id="stage"></div>';
  $('mycall').addEventListener('change',e=>{me=e.target.value.trim().toUpperCase()||'K1ABC';DB.mycall=me;M.save();if(step===0)stage()});
  $('myname').addEventListener('change',e=>{my=e.target.value.trim().toUpperCase()||'ALEX';DB.myname=my;M.save();if(step===2)stage()});
  const playThen=(t,cb)=>{let fired=false;const f=()=>{if(!fired){fired=true;cb()}};const d=M.play(t,f);setTimeout(f,d*1000+400)};
  const log=(who,t)=>{const l=$('log');if(l.querySelector('.small'))l.innerHTML='';l.insertAdjacentHTML('beforeend','<div><b>'+esc(who)+'</b><span>'+esc(t.replace(/[<>]/g,''))+'</span></div>')};
  const theirLine=()=>me+' DE '+q.their+' GM UR RST '+q.rst+' '+q.rst+' NAME '+q.name+' QTH '+q.qth+' HW? '+me+' DE '+q.their+' K';
  const sendBox=(title,hint)=>'<h4>'+title+'</h4><p class="small">For example: '+esc(hint)+'</p><div class="entry"><label class="sr" for="tx">What you send</label><input type="text" class="caps" id="tx" autocomplete="off" autocorrect="off" autocapitalize="characters" spellcheck="false"><button class="btn" type="button" id="txGo">Send</button></div><div class="fb" id="txFb" aria-live="polite"></div>';
  function onSend(check,bad,after){
    const go=()=>{const v=$('tx').value.trim().toUpperCase();if(!check(v)){$('txFb').className='fb no';$('txFb').textContent=bad;return}
      $('txGo').disabled=true;$('txFb').className='fb';$('txFb').textContent='Sent.';log('You',v);
      setTimeout(after,700);M.practiced();};
    $('txGo').addEventListener('click',go);$('tx').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();go()}});
  }
  function stage(){
    const s=$('stage');
    if(step===0){
      s.innerHTML=sendBox('Call CQ','CQ CQ DE '+me+' K');
      onSend(v=>v.indexOf('CQ')>-1&&v.indexOf(me)>-1,'Include CQ and your callsign, '+me+'.',()=>{step=1;stage()});
    }else if(step===1){
      s.innerHTML='<h4>A station answers. Copy it.</h4><div class="row"><button class="btn" type="button" id="hear"><span class="tri"></span>Hear it again</button></div>'+fieldsHtml('s')+'<div class="row"><button class="btn ink" type="button" id="sChk">Check</button></div><div class="fb" id="sFb" aria-live="polite"></div>';
      M.play(theirLine());
      $('hear').addEventListener('click',e=>M.playFrom(e.currentTarget,theirLine()));
      $('sChk').addEventListener('click',()=>{const ok=checkFields('s',q);if(ok===4){log(q.their,theirLine());step=2;stage()}else{$('sFb').className='fb no';$('sFb').textContent=ok+' of 4 right. Listen again and fix the red ones.'}});
    }else if(step===2){
      s.innerHTML=sendBox('Send your report and name',q.their+' DE '+me+' TNX UR RST 599 NAME '+my+' BK');
      onSend(v=>v.indexOf('RST')>-1&&v.indexOf('NAME')>-1,'Include RST with a report and NAME with your name.',()=>{
        const t='R TNX '+my+' FER QSO 73 '+me+' DE '+q.their+' <SK>';log(q.their,t);
        playThen(t,()=>{step=3;stage()});$('stage').innerHTML='<h4>'+esc(q.their)+' is sending...</h4>';
      });
    }else if(step===3){
      s.innerHTML=sendBox('Close the contact','TNX '+q.name+' 73 <SK>'.replace(/[<>]/g,''));
      onSend(v=>v.indexOf('73')>-1,'Send 73 to say best regards.',()=>{step=4;stage()});
    }else{
      s.innerHTML='<h4>Contact complete</h4><p>You called CQ, copied '+esc(q.name)+' in '+esc(q.qth)+', traded reports and signed off. That is a full basic contact.</p><div class="row"><button class="btn plain" type="button" id="again">Make another contact</button></div>';
      $('again').addEventListener('click',()=>{q=makeQso();step=0;$('log').innerHTML='<div class="small">Nothing sent yet.</div>';stage()});
      pass(c,i,100);
    }
  }
  stage();
}

/* routing */
function route(){
  const h=decodeURIComponent(location.hash.slice(1));const [cid,n]=h.split('/');
  const c=C.COURSES.find(x=>x.id===cid);
  dash();
  document.querySelector('.dash').hidden=!!c;
  if(!c){if(active&&active.destroy)active.destroy();M.stop();$('course').hidden=true;$('catalog').hidden=false;catalog();return}
  let i=n?Math.max(0,Math.min(c.classes.length-1,parseInt(n,10)-1||0)):c.classes.findIndex((_,j)=>!DB.done[key(c,j)]);
  if(i<0)i=0;
  $('catalog').hidden=true;$('course').hidden=false;
  $('cTitle').textContent=c.name;$('cBlurb').textContent=c.blurb;
  classList(c,i);player(c,i);
  window.scrollTo(0,0);
}
$('classList').addEventListener('click',e=>{const b=e.target.closest('[data-i]');if(!b)return;const h=location.hash.slice(1).split('/')[0];location.hash=h+'/'+(+b.dataset.i+1)});
window.addEventListener('hashchange',route);
route();

const reset=$('reset');let armed=false;
reset.addEventListener('click',()=>{
  if(!armed){armed=true;reset.textContent='Click again to erase all progress';setTimeout(()=>{armed=false;reset.textContent='Reset my progress'},4000);return}
  DB.done={};DB.best={};DB.days=[];DB.sprint={};M.save();armed=false;reset.textContent='Progress erased';route();
});
})();
