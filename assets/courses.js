/* Course catalog and practice word sets, shared by the home, courses and practice pages. */
(function(){
'use strict';
const pick=a=>a[Math.floor(Math.random()*a.length)];
const W=s=>s.split(' ');

const NAMES=W('JOHN MARY BOB ANN TOM SUE JIM KIM DAVE LISA MIKE JOE');
const QTHS=W('OHIO TEXAS DENVER BOSTON IOWA MAINE UTAH OREGON MIAMI SEATTLE');
const RSTS=W('599 579 559 589 449 569');
function call(){
  const pre=pick(W('K W N AA KD KB KC VE G M DL F JA VK EA ON PA I'));
  const n=Math.floor(Math.random()*10);
  let s='';const len=1+Math.floor(Math.random()*3);for(let i=0;i<len;i++)s+=pick('ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''));
  return pre+n+s;
}

const SETS={
  common:{name:'Common words',gen:()=>Array.from({length:6},()=>pick(W('THE AND YOU NAME HERE IS UR RIG ANT WX SUN RAIN COLD HOT GOOD WORK CALL TIME DAY NOW FROM WITH')))},
  abbr:{name:'Abbreviations',gen:()=>Array.from({length:6},()=>pick(W('CQ DE TNX FB OM UR ES HR WX RST PSE AGN GM GA GE 73 88 BK HW FER CUL')))},
  q:{name:'Q codes',gen:()=>Array.from({length:6},()=>pick(W('QTH QRZ QRS QRQ QSL QRM QRN QSB QRP QRT QSY QRL')))},
  nums:{name:'Numbers and reports',gen:()=>Array.from({length:6},()=>pick(RSTS.concat(W('73 88 5W 100W 40M 20M 14025 7030 1 2 3 4 5 6 7 8 9 0'))))},
  calls:{name:'Callsigns',gen:()=>Array.from({length:4},call)},
  names:{name:'Names and places',gen:()=>Array.from({length:4},()=>pick(Math.random()<0.5?NAMES:QTHS))}
};

const KOCH=['KMUR','ESNA','PTLW','I.JZ','=FOY',',VG5','/Q92','H38B','?47C','1D60X'];
const KOCH_TIPS=[
 'Start here even if it feels fast. Hear K as one rhythm, dah di dah, not as three parts.',
 'E is the shortest sound in the code. Listen for it between longer letters.',
 'P and W start the same way. The difference is at the end.',
 'The period has six parts. Let it roll by as one shape. Don\'t count.',
 '= is also called BT. On the air it separates one thought from the next.',
 '5 is five dits. Hear it as a quick buzz rather than counting.',
 '/ shows up in callsigns like W1ABC/P, which means portable.',
 'H, S and 5 differ only in length. If they blur, lower overall speed, never letter speed.',
 'You\'ll hear ? whenever someone asks for a repeat.',
 'Finish this and you can copy every character in common use on the air.'
];

const COURSES=[
 {id:'first-letters',name:'First Letters',blurb:'Hear every letter and number, shortest sounds first. You pick each one by ear and see its pattern.',time:'About 2 weeks',classes:[
  {t:'E and T',type:'learn',fresh:'ET',note:'The two shortest letters. E is one dit. T is one dah.'},
  {t:'I A N M',type:'learn',fresh:'IANM',note:'Two sounds each, every mix of dit and dah.'},
  {t:'S U R W',type:'learn',fresh:'SURW',note:'Three sounds each, all starting with a dit.'},
  {t:'D K G O',type:'learn',fresh:'DKGO',note:'Three sounds each, all starting with a dah. O is three dahs.'},
  {t:'H V F L',type:'learn',fresh:'HVFL',note:'Four sounds each, starting with a dit.'},
  {t:'P J B X',type:'learn',fresh:'PJBX',note:'Four sounds each. Listen to how they end.'},
  {t:'C Y Z Q',type:'learn',fresh:'CYZQ',note:'Four sounds each, all starting with a dah.'},
  {t:'Numbers 1 to 5',type:'learn',fresh:'12345',pool:'12345',note:'Numbers always have five sounds. 1 to 5 start with dits.'},
  {t:'Numbers 6 to 0',type:'learn',fresh:'67890',pool:'1234567890',note:'6 to 0 start with dahs. Count the dahs to get the number past 5.'},
  {t:'All 26 letters',type:'learn',fresh:'ETIANMSURWDKGOHVFLPJBXCYZQ',note:'A mixed review. You choose from eight letters at a time.',count:15,pass:12}
 ]},
 {id:'ear-speed',name:'Ear Speed',blurb:'Copy letters at real speed with the Koch method. Four new characters per class, typed as you hear them.',time:'About 6 weeks',classes:KOCH.map((k,i)=>({t:k.split('').join(' '),type:'copy',fresh:k,koch:i,note:KOCH_TIPS[i],pass:90}))},
 {id:'words',name:'Words on the Air',blurb:'The short words, codes and callsigns that fill every contact. Learn them as whole sounds.',time:'About 2 weeks',classes:[
  {t:'Common words',type:'copy',set:'common',note:'The words you\'ll hear most. Try to hear each one as a single shape.',pass:85},
  {t:'Abbreviations',type:'copy',set:'abbr',note:'Operators shorten everything. TNX is thanks, FB is fine business, 73 is best regards.',pass:85},
  {t:'Q codes',type:'copy',set:'q',note:'Three-letter codes that start with Q. QTH is your location, QRS asks to slow down.',pass:85},
  {t:'Numbers and reports',type:'copy',set:'nums',note:'Signal reports like 599, power like 5W, and bands like 40M.',pass:85},
  {t:'Callsigns',type:'copy',set:'calls',note:'Callsigns mix letters and numbers with no pattern to guess from. Most people find these the hardest.',pass:85},
  {t:'Names and places',type:'copy',set:'names',note:'First names and places, the way they show up in a contact.',pass:85}
 ]},
 {id:'sending',name:'Sending',blurb:'Use the practice key to send letters and words with timing clean enough for the decoder to read.',time:'About 2 weeks',classes:[
  {t:'Single letters',type:'send',targets:W('E T I M A N'),note:'Short taps for dits, holds three times as long for dahs.'},
  {t:'Short words',type:'send',targets:W('TEN MEN SET EAT TEA SEA AIM'),note:'Leave a clear pause between letters, or they run together.'},
  {t:'Calls and signals',type:'send',targets:W('CQ SOS DE 73 TNX'),note:'The signals you\'ll send on every contact.'},
  {t:'Common words',type:'send',targets:W('THE AND NAME HERE GOOD RIG'),note:'Keep your rhythm even from the first letter to the last.'},
  {t:'Callsigns',type:'send',targets:W('K1ABC W7XYZ N4QR VE3XX G4ABC'),note:'Numbers have five parts. Take your time.'}
 ]},
 {id:'first-contact',name:'First Contact',blurb:'Read a real exchange, copy one by ear, then run a whole contact with a simulated station.',time:'About 1 week',classes:[
  {t:'How a contact works',type:'read',note:'A basic contact, called a QSO, follows a script. Play each line and read what it means.'},
  {t:'Copy a contact',type:'qso',note:'A station calls you. Listen and fill in what they sent.'},
  {t:'Make a contact',type:'sim',note:'You call CQ, a station answers, and you trade reports. Type what you would send.'}
 ]}
];

window.MBE_COURSES={COURSES,SETS,KOCH,NAMES,QTHS,RSTS,call,pick};
})();
