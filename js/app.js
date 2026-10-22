'use strict';
const KEY = 'yupu-data-v1';
const ALLERGENS = ['Egg','Peanut',"Cow's milk",'Wheat','Soy','Fish','Tree nuts','Sesame','Shellfish'];
const LABEL = {nurse:'Nursing',bottle:'Bottle',sleep:'Sleep',diaper:'Diaper',solids:'Solids',growth:'Measurement',other:'Other'};
const COLOR = {nurse:'feed',bottle:'feed',sleep:'sleep',diaper:'diaper',solids:'solids',growth:'growth',other:'other'};
const REACT = {loved:'Loved it',ok:'OK',refused:'Refused'};
const DKIND = {wet:'Wet',dirty:'Dirty',both:'Wet and dirty',dry:'Dry'};

/* ---------- icons ---------- */
const ic = p => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
const I = {
  checks: ic('<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4V3h6v1M9 13l2 2 4-4"/>'),
  pill: ic('<rect x="2.5" y="8.5" width="19" height="7" rx="3.5" transform="rotate(-45 12 12)"/><path d="M9.5 9.5l5 5"/>'),
  note: ic('<path d="M6 3h9l4 4v14H6z"/><path d="M14 3v5h5M9 13h7M9 17h5"/>'),
  drop: ic('<path d="M12 3c3 4 6 7.5 6 11a6 6 0 0 1-12 0c0-3.5 3-7 6-11z"/>'),
  bottle: ic('<path d="M9.5 2h5M10.5 2v3L8 8.5V20a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V8.5L13.5 5V2M8 12h8M8 16h8"/>'),
  moon: ic('<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/>'),
  sun: ic('<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>'),
  diaper: ic('<path d="M3 6h18v3a9 9 0 0 1-18 0V6z"/><path d="M3 9.5c3 0 5 2 5 5M21 9.5c-3 0-5 2-5 5"/>'),
  spoon: ic('<ellipse cx="12" cy="7" rx="4" ry="5"/><path d="M12 12v10"/>'),
  growth: ic('<path d="M3 20h18M5 16l4-5 4 3 6-8"/><path d="M15 6h4v4"/>'),
  today: ic('<circle cx="12" cy="12" r="8"/><path d="M12 4a8 8 0 0 1 8 8"/><path d="M12 12l3-2"/>'),
  list: ic('<path d="M9 6h12M9 12h12M9 18h12M4 6h.01M4 12h.01M4 18h.01"/>'),
  bars: ic('<path d="M5 20V11M11 20V5M17 20v-6M3 20h18"/>'),
  gear: ic('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>')
};

/* ---------- state ---------- */
function blank(){return {settings:{name:'',dob:'',sex:'',device:'',theme:'auto',textSize:'m',night:false,nightAuto:false,nightFrom:'21:00',nightTo:'07:00',nightSkipUntil:0,lang:'en',syncFolder:'',remind:false,updatedAt:0},events:[],active:{nurse:null,sleep:null},prefs:{ml:120,kind:'breastmilk',unit:'tsp'},lastBackup:0,lastImport:0,activeUpd:{nurse:0,sleep:0},sync:{repo:'',token:'',on:false,shas:{},dirty:{},last:0,err:''}};}
function hydrate(d){const b=blank();return {...b,...d,settings:{...b.settings,...d.settings},active:{...b.active,...d.active},prefs:{...b.prefs,...d.prefs},sync:{...b.sync,...(d.sync||{})},activeUpd:{...b.activeUpd,...(d.activeUpd||{})},events:Array.isArray(d.events)?d.events:[]};}
function loadLS(key=KEY){try{const raw=localStorage.getItem(key);if(raw)return hydrate(JSON.parse(raw));}catch(e){}return null;}
/* Storage: IndexedDB database "yupu", store "kv", key "state", on this phone only.
   Versions before 3.1 kept everything in localStorage. On the first start of 3.1 that copy
   is moved into IndexedDB, read back to check it arrived complete, and only then renamed to
   KEY+'-pre31' (kept, never touched again) as a fallback. If IndexedDB can't be opened the
   app keeps working on localStorage exactly as before. */
let S=blank(),IDB=null,storeMode='idb',saving=false,saveAgain=false;
function idbOpen(){return new Promise((res,rej)=>{try{if(!window.indexedDB)return rej(new Error('none'));const r=indexedDB.open('yupu',1);
  r.onupgradeneeded=()=>{if(!r.result.objectStoreNames.contains('kv'))r.result.createObjectStore('kv');};
  r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error);r.onblocked=()=>rej(new Error('blocked'));}catch(e){rej(e);}});}
function idbGet(k){return new Promise((res,rej)=>{const q=IDB.transaction('kv','readonly').objectStore('kv').get(k);q.onsuccess=()=>res(q.result);q.onerror=()=>rej(q.error);});}
function idbPut(k,v){return new Promise((res,rej)=>{const tx=IDB.transaction('kv','readwrite');tx.objectStore('kv').put(v,k);tx.oncomplete=()=>res();tx.onerror=()=>rej(tx.error);tx.onabort=()=>rej(tx.error);});}
async function loadState(){
  try{
    IDB=await idbOpen();
    const d=await idbGet('state');
    if(d)return hydrate(d);
    const old=loadLS();
    if(old){
      await idbPut('state',old);
      const chk=await idbGet('state');
      if(chk&&Array.isArray(chk.events)&&chk.events.length===old.events.length){try{localStorage.setItem(KEY+'-pre31',localStorage.getItem(KEY));localStorage.removeItem(KEY);}catch(e){}}
      return old;
    }
    return blank();
  }catch(e){storeMode='ls';IDB=null;return loadLS()||blank();}
}
function saveLS(){try{localStorage.setItem(KEY,JSON.stringify(S));}catch(e){toast('This phone refused to save. Back up now.');}}
function save(){
  if(storeMode!=='idb'||!IDB)return saveLS();
  if(saving){saveAgain=true;return;}
  saving=true;
  let p;try{p=idbPut('state',S);}catch(e){p=Promise.reject(e);}
  p.then(()=>{saving=false;if(saveAgain){saveAgain=false;save();}})
   .catch(()=>{saving=false;storeMode='ls';saveLS();});
}

/* ---------- helpers ---------- */
const $ = (s,r=document)=>r.querySelector(s);
const esc = s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const uid = ()=>Date.now().toString(36)+Math.random().toString(36).slice(2,8);
const pad = n=>String(n).padStart(2,'0');
const hm = ts=>{const d=new Date(ts);return pad(d.getHours())+':'+pad(d.getMinutes());};
const fmtNum = x=>String(Math.round(x*100)/100);
function dur(ms,withSec){
  ms=Math.max(0,ms||0);const t=Math.floor(ms/1000),h=Math.floor(t/3600),m=Math.floor(t%3600/60),s=t%60;
  if(withSec) return h?`${h}:${pad(m)}:${pad(s)}`:`${pad(m)}:${pad(s)}`;
  return h?`${h}h ${pad(m)}m`:`${m}m`;
}
const dayStart = ts=>{const d=new Date(ts);d.setHours(0,0,0,0);return d.getTime();};
const addDays = (ts,n)=>{const d=new Date(ts);d.setDate(d.getDate()+n);return d.getTime();};
const daysBetween = (a,b)=>Math.round((dayStart(b)-dayStart(a))/864e5);
function dayLabel(ts){
  const t=dayStart(Date.now()),s=dayStart(ts);
  if(s===t) return 'Today'; if(s===addDays(t,-1)) return 'Yesterday';
  return new Date(ts).toLocaleDateString(LOC(),{weekday:'short',day:'numeric',month:'short'});
}
/* ---------- German interface ----------
   The app is written in English. With Settings → Language → Deutsch, everything drawn on
   screen passes through tr(): exact phrases first, then patterns for sentences with numbers,
   then common UI phrases inside longer text. Stored data stays in English, so both phones and
   the Checks detection keep working whatever language each phone shows. */
let PH_RX=null,PH_MAP=null;
function tr(s){
  if(!s||!S||!S.settings||S.settings.lang!=='de')return s;
  const k=String(s).trim();if(!k)return s;
  let out;
  if(Object.prototype.hasOwnProperty.call(DE,k))out=DE[k];
  else{for(const [re,rep] of DE_RX){if(re.test(k)){out=k.replace(re,rep);break;}}}
  if(out==null){
    if(!PH_RX){const ph=DE_PH.slice().sort((a,b)=>b[0].length-a[0].length);PH_MAP=Object.fromEntries(ph);
      PH_RX=new RegExp('(^|[^\\p{L}\\d])('+ph.map(([a])=>a.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('|')+')(?=$|[^\\p{L}])','gu');}
    out=k.replace(PH_RX,(m,p,w)=>p+PH_MAP[w]);
  }
  out=out.replace(/(^|[^\w.])(\d+)\.(\d+)(?![\d.])/g,'$1$2,$3');
  return String(s).replace(k,out);
}
function translateDom(root){
  if(!root||!S||!S.settings||S.settings.lang!=='de')return;
  const tw=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let nd;const list=[];
  while(nd=tw.nextNode()){const p=nd.parentNode;if(p&&(p.nodeName==='TEXTAREA'||p.closest&&p.closest('.notr')))continue;if(nd.nodeValue.trim())list.push(nd);}
  list.forEach(n=>{const v=tr(n.nodeValue);if(v!==n.nodeValue)n.nodeValue=v;});
  root.querySelectorAll&&root.querySelectorAll('[placeholder],[aria-label]').forEach(el=>{['placeholder','aria-label'].forEach(a=>{const v=el.getAttribute(a);if(v){const t=tr(v);if(t!==v)el.setAttribute(a,t);}});});
}
const LOC = ()=>S&&S.settings&&S.settings.lang==='de'?'de-DE':'en-GB';
const dateStr = ts=>new Date(ts).toLocaleDateString(LOC(),{day:'numeric',month:'short',year:'numeric'});
const toInput = ts=>{const d=new Date(ts);return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;};
const toDate = ts=>toInput(ts).slice(0,10);
const stamp = (ts=Date.now())=>toInput(ts).replace('T','_').replace(':','');
function fromInput(v){const m=/^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?/.exec(v||'');if(!m)return NaN;return new Date(+m[1],m[2]-1,+m[3],m[4]!=null?+m[4]:12,m[5]!=null?+m[5]:0).getTime();}
const num = v=>{const x=parseFloat(String(v??'').replace(',','.'));return isFinite(x)?x:NaN;};
const live = ()=>S.events.filter(e=>!e.deleted).sort((a,b)=>b.start-a.start);
const isFeed = e=>e.type==='nurse'||e.type==='bottle';
const dobTs = ()=>fromInput(S.settings.dob);

function ageText(ts=Date.now()){
  if(!S.settings.dob) return '';
  const b=new Date(dobTs());b.setHours(0,0,0,0);const d=new Date(ts);d.setHours(0,0,0,0);
  const days=Math.round((d-b)/864e5);
  if(days<0) return '';
  const de=S.settings.lang==='de';
  if(days<7) return de?`${days} ${days===1?'Tag':'Tage'} alt`:`${days} day${days===1?'':'s'} old`;
  if(days<91){const w=Math.floor(days/7),r=days%7;return de?`${w} Wo.${r?` ${r} T.`:''}`:`${w} wk${r?` ${r} d`:''}`;}
  let m=(d.getFullYear()-b.getFullYear())*12+d.getMonth()-b.getMonth();
  if(d.getDate()<b.getDate()) m--;
  const anchor=new Date(b);anchor.setMonth(b.getMonth()+m);
  const w=Math.floor(Math.round((d-anchor)/864e5)/7);
  return de?`${m} Mon.${w?` ${w} Wo.`:''}`:`${m} mo${w?` ${w} wk`:''}`;
}

/* ---------- events ---------- */
// Change history: an edit keeps the previous version in e.hist (last 5, with who and when).
// A deletion keeps the whole entry in the tombstone's "prev" so it can be restored. Both
// travel with the entry through sync, so either phone can undo the other's change.
function upsert(e){
  const now=Date.now(),me=S.settings.device||'';
  const i=S.events.findIndex(x=>x.id===e.id);
  if(i>=0){
    const old=S.events[i];
    if(!old.deleted&&(old.start!==e.start||old.end!==e.end||JSON.stringify(old.data)!==JSON.stringify(e.data))){
      e.hist=[...(old.hist||[]),{at:old.updatedAt||now,by:old.editBy||old.by||'',start:old.start,end:old.end,data:old.data}].slice(-5);
      e.editBy=me;
    }
    e.created=old.created||e.created||old.updatedAt||now;
    markDirty(monthKey(old.start));S.events[i]=e;
  } else {e.created=e.created||now;S.events.push(e);}
  e.updatedAt=now;
  if(e.by==null) e.by=me;
  markDirty(monthKey(e.start));save();
}
function removeEv(id){
  const i=S.events.findIndex(x=>x.id===id);if(i<0) return null;
  const old=S.events[i];if(old.deleted)return null;
  S.events[i]={id,type:old.type,start:old.start,deleted:true,updatedAt:Date.now(),delBy:S.settings.device||'',prev:old};
  markDirty(monthKey(old.start));save();return old;
}
function describe(e){
  const d=e.data||{};
  switch(e.type){
    case 'nurse':{const p=[];if(d.l)p.push(`left ${Math.round(d.l/60)}m`);if(d.r)p.push(`right ${Math.round(d.r/60)}m`);
      let t=p.join(', ');t=t.charAt(0).toUpperCase()+t.slice(1);
      return {title:'Nursing',detail:[t+(d.last?`${t?', ':''}ended ${d.last==='l'?'left':'right'}`:''),d.note].filter(Boolean).join(', '),right:dur(((d.l||0)+(d.r||0))*1000)};}
    case 'bottle': return {title:'Bottle',detail:[d.kind==='formula'?'Formula':'Breast milk',d.note].filter(Boolean).join(', '),right:`${d.ml} ml`};
    case 'sleep': return {title:'Sleep',detail:[`${hm(e.start)} to ${hm(e.end)}`,d.note].filter(Boolean).join(', '),right:dur(e.end-e.start)};
    case 'diaper':{const p=[];if(DKIND[d.kind])p.push(DKIND[d.kind]);if(d.temp)p.push(`${fmtNum(d.temp)}°C`);if(d.note)p.push(d.note);
      return {title:'Diaper',detail:p.join(', '),right:'',flag:d.temp>=38};}
    case 'other':{const p=[];if(d.temp)p.push(`${fmtNum(d.temp)}°C`);if(d.note)p.push(d.note);
      return {title:d.label||'Other',detail:p.join(', '),right:'',flag:d.temp>=38};}
    case 'solids':{const p=[];if(d.amount)p.push(`${fmtNum(d.amount)} ${d.unit}`);if(d.reaction)p.push(REACT[d.reaction]);if(d.allergens&&d.allergens.length)p.push(d.allergens.join(', '));if(d.symptoms)p.push('reaction noted');if(d.note)p.push(d.note);
      return {title:d.food||'Solids',detail:p.join(', '),right:'',flag:!!d.symptoms};}
    case 'growth':{const p=[];if(d.kg)p.push(`${fmtNum(d.kg)} kg`);if(d.cm)p.push(`${fmtNum(d.cm)} cm`);if(d.head)p.push(`head ${fmtNum(d.head)} cm`);if(d.note)p.push(d.note);
      return {title:'Measurement',detail:p.join(', '),right:''};}
  }
  return {title:e.type,detail:'',right:''};
}
function dayStats(ds,de,ev,now){
  const r={feeds:0,nurseMin:0,ml:0,sleep:0,wet:0,dirty:0,solids:0};
  for(const e of ev){
    if(e.type==='sleep'){const ov=Math.min(e.end,de)-Math.max(e.start,ds);if(ov>0)r.sleep+=ov;continue;}
    if(e.start<ds||e.start>=de) continue;
    const d=e.data||{};
    if(e.type==='nurse'){r.feeds++;r.nurseMin+=((d.l||0)+(d.r||0))/60;}
    else if(e.type==='bottle'){r.feeds++;r.ml+=+d.ml||0;}
    else if(e.type==='diaper'){if(d.kind==='wet'||d.kind==='both')r.wet++;if(d.kind==='dirty'||d.kind==='both')r.dirty++;}
    else if(e.type==='solids') r.solids++;
  }
  if(S.active.sleep){const ov=Math.min(now,de)-Math.max(S.active.sleep.start,ds);if(ov>0)r.sleep+=ov;}
  return r;
}

/* ---------- nursing timer ---------- */
function sideMs(a,side,t=Date.now()){return a.segs.filter(s=>s.side===side).reduce((x,s)=>x+((s.to??t)-s.from),0);}
function curSide(a){const l=a.segs[a.segs.length-1];return l&&l.to==null?l.side:null;}
function lastSide(a){const l=a.segs[a.segs.length-1];return l?l.side:'l';}
function closeOpen(a,t){const l=a.segs[a.segs.length-1];if(l&&l.to==null)l.to=t;}
// Running timers are shared through yupu/active.json when sync is on. Each slot carries
// the time it last changed; the newer change wins. A stopped timer becomes an entry whose
// id is the timer's id, so stopping it on both phones still produces a single entry.
function touchActive(kind){
  S.activeUpd=S.activeUpd||{nurse:0,sleep:0};S.activeUpd[kind]=Date.now();
  if(S.sync&&S.sync.on){S.sync.dirty=S.sync.dirty||{};S.sync.dirty.active=1;scheduleSync(1500);}
}
function nurseStart(side){
  const n=Date.now(),a=S.active.nurse;
  if(!a){S.active.nurse={id:uid(),start:n,by:S.settings.device||'',segs:[{side,from:n,to:null}]};}
  else if(curSide(a)!==side){closeOpen(a,n);a.segs.push({side,from:n,to:null});}
  touchActive('nurse');save();render();
}
function nurseDone(){
  const a=S.active.nurse;if(!a)return;const n=Date.now();closeOpen(a,n);
  const l=Math.round(sideMs(a,'l',n)/1000),r=Math.round(sideMs(a,'r',n)/1000);
  S.active.nurse=null;touchActive('nurse');
  if(l+r<10){save();render();toast('Under 10 seconds, not saved');return;}
  const e={id:a.id||uid(),type:'nurse',start:a.start,end:n,data:{l,r,last:lastSide(a)}};
  upsert(e);render();toast(`Nursing saved, ${dur((l+r)*1000)}`,()=>removeEv(e.id));
}

/* ---------- views ---------- */
let tab='today',histDays=7,histFilter='all',trendRange=7,growthMetric='w';
const TABS=[['today','Today',I.today],['history','History',I.list],['trends','Trends',I.bars],['growth','Growth',I.growth],['checks','Checks',I.checks],['foods','Foods',I.spoon]];

// Only touches the DOM when the markup changed, so scroll, focus and running
// animations survive the minute refresh and actions that change nothing on screen.
const painted={tabs:'',main:''};
function paint(el,key,html){const k=S.settings.lang+'|'+html;if(painted[key]===k)return;painted[key]=k;el.innerHTML=html;translateDom(el);}
function render(){
  paint($('#tabs'),'tabs',TABS.map(([k,l,svg])=>`<button class="tab ${k===tab?'on':''}" data-act="tab" data-tab="${k}" aria-label="${l}"${k===tab?' aria-current="page"':''}>${svg}<span>${l}</span></button>`).join(''));
  $('#hdrName').textContent=S.settings.name||'Yupu baby';
  $('#hdrSub').textContent=ageText()||'Baby log';
  paint($('#main'),'main',({today:vToday,history:vHistory,trends:vTrends,growth:vGrowth,checks:vChecks,foods:vFoods})[tab]());
  document.documentElement.lang=S.settings.lang==='de'?'de':'en';
  translateDom(document.querySelector('header.top'));
  tick();
}
function tick(){
  const n=Date.now();
  document.querySelectorAll('[data-since]').forEach(el=>{el.textContent=dur(n-(+el.dataset.since),el.dataset.fmt==='s');});
  const a=S.active.nurse;
  if(a){
    const l=sideMs(a,'l',n),r=sideMs(a,'r',n);
    document.querySelectorAll('[data-tick="nt"]').forEach(el=>el.textContent=dur(l+r,true));
    document.querySelectorAll('[data-tick="nl"]').forEach(el=>el.textContent=dur(l,true));
    document.querySelectorAll('[data-tick="nr"]').forEach(el=>el.textContent=dur(r,true));
  }
}
function row(e){
  const d=describe(e),me=S.settings.device||'';
  const by=e.by&&e.by!==me?`<span class="by">${esc(e.by)}</span>`:'';
  return `<li><button class="row c-${COLOR[e.type]}" data-act="edit" data-id="${e.id}"><time>${e.type==='growth'?'':hm(e.start)}</time><i class="dot"></i><span class="rt"><b>${esc(d.title)}${by}</b><small class="${d.flag?'flag':''}">${esc(d.detail)}</small></span><span class="rd">${esc(d.right)}</span></button></li>`;
}

/* Forgotten-timer guard: a sleep over 14 h or a feed over 90 min asks whether it is still going. */
function guard(kind,x,n){
  const lim=kind==='sleep'?14*36e5:90*6e4;
  if(!x||n-x.start<lim||(x.ack||0)>n)return '';
  return `<div class="guard"><b>${kind==='sleep'?'Still asleep?':'Still feeding?'}</b><span>This timer has been running for ${dur(n-x.start)}.</span><div class="row-btns"><button class="btn small" data-act="guard-yes" data-k="${kind}">Yes, still going</button><button class="btn small primary" data-act="guard-end" data-k="${kind}">${kind==='sleep'?'Set wake-up time':'Set end time'}</button></div></div>`;
}
function openEndAt(kind){
  const a=S.active[kind];if(!a)return;
  openSheet(`<h2>${kind==='sleep'?'Woke up at':'Feed ended at'}</h2><p class="muted" style="margin:-4px 2px 12px">Started ${whenStr(a.start)}.</p>${fld('End time',`<input id="end-at" type="datetime-local" value="${toInput(Date.now())}">`)}
    <div class="foot"><button class="btn" data-act="close">Cancel</button><button class="btn primary" data-act="end-save" data-k="${kind}">Save</button></div>`);
}
function endTimerAt(kind,end){
  const a=S.active[kind],n=Date.now();if(!a)return false;
  if(isNaN(end)||end<=a.start)return toast('The end has to be after the start.'),false;
  if(end>n+6e4)return toast('The end cannot be in the future.'),false;
  S.active[kind]=null;touchActive(kind);
  if(kind==='sleep'){const e={id:a.id||uid(),type:'sleep',start:a.start,end,data:{}};upsert(e);render();toast(`Sleep saved, ${dur(end-a.start)}`,()=>removeEv(e.id));return true;}
  a.segs=a.segs.filter(s=>s.from<end).map(s=>({...s,to:Math.min(s.to??end,end)}));
  const l=Math.round(sideMs(a,'l',end)/1000),r=Math.round(sideMs(a,'r',end)/1000);
  const e={id:a.id||uid(),type:'nurse',start:a.start,end,data:{l,r,last:lastSide(a)}};upsert(e);render();toast(`Nursing saved, ${dur((l+r)*1000)}`,()=>removeEv(e.id));return true;
}
/* Time since the last dose of each medication logged in the last 48 h. Times only, no advice. */
function medName(e){
  if(e.type!=='other')return null;const l=labelOf(e),m=/^(medication|medikament|medicine)\s*:?\s*(.*)$/i.exec(l);
  if(m)return (m[2]||'').trim()||'Medication';
  return /paracetamol|ibuprofen|nurofen|ben-u-ron|fiebersaft|zäpfchen|antibiotic|antibiotika|amoxi/i.test(l)?l:null;
}
function medsCard(ev,n){
  const m=new Map();
  ev.forEach(e=>{if(n-e.start>48*36e5||e.start>n+6e4)return;const name=medName(e);if(!name)return;const k=name.toLowerCase();if(!m.has(k))m.set(k,{name,e});});
  if(!m.size)return '';
  return `<div class="meds">${[...m.values()].map(({name,e})=>`<div class="med"><button data-act="edit" data-id="${e.id}"><b>${esc(name)}</b><span>at ${hm(e.start)}, <span data-since="${e.start}"></span> ago</span></button><button class="btn small" data-act="med-again" data-id="${e.id}">Log again</button></div>`).join('')}</div>`;
}
/* Insights from her own log: patterns only, no advice. */
const atHour=(day,h)=>{const d=new Date(day);d.setHours(h,0,0,0);return d.getTime();};
function nightStretch(morningDay,ev,n){
  const ws=atHour(addDays(morningDay,-1),18),we=atHour(morningDay,6);
  const sl=ev.filter(e=>e.type==='sleep'&&e.start>=ws&&e.start<we).map(e=>({start:e.start,end:e.end,ongoing:false}));
  const act=S.active.sleep;if(act&&act.start>=ws&&act.start<we&&n)sl.push({start:act.start,end:n,ongoing:true});
  if(!sl.length)return null;
  sl.sort((a,b)=>a.start-b.start);const blocks=[];
  for(const s of sl){const b=blocks[blocks.length-1];if(b&&s.start-b.end<=5*6e4){b.end=Math.max(b.end,s.end);b.ongoing=b.ongoing||s.ongoing;}else blocks.push({...s});}
  const best=blocks.reduce((x,y)=>(y.end-y.start)>(x.end-x.start)?y:x);
  return {...best,dur:best.end-best.start};
}
function napHint(ev,n){
  const sl=ev.filter(e=>e.type==='sleep'&&e.start>n-7*864e5).sort((a,b)=>a.start-b.start),ww=[];
  for(let i=1;i<sl.length;i++){const h=new Date(sl[i].start).getHours();if(h<7||h>=19)continue;const g=sl[i].start-sl[i-1].end;if(g>=30*6e4&&g<=6*36e5)ww.push(g);}
  if(ww.length<5)return null;ww.sort((a,b)=>a-b);return {median:ww[Math.floor(ww.length/2)],count:ww.length};
}
function weekCompare(ev,n){
  const t0=dayStart(n),agg=from=>{const s={sleep:0,feeds:0,wet:0,dirty:0,night:0,nn:0,days:0};
    for(let i=from;i<from+7;i++){const d=addDays(t0,-i),st=dayStats(d,addDays(d,1),ev,n),any=ev.some(e=>e.start>=d&&e.start<addDays(d,1));if(any)s.days++;
      s.sleep+=st.sleep;s.feeds+=st.feeds;s.wet+=st.wet;s.dirty+=st.dirty;const ns=nightStretch(d,ev,0);if(ns){s.night+=ns.dur;s.nn++;}}
    return {sleep:s.sleep/7,feeds:s.feeds/7,wet:s.wet/7,dirty:s.dirty/7,night:s.nn?s.night/s.nn:0,days:s.days};};
  const A=agg(1),B=agg(8);
  const seen=new Set(),fresh=[];ev.slice().sort((a,b)=>a.start-b.start).forEach(e=>{if(e.type!=='solids'||!e.data.food)return;const k=e.data.food.trim().toLowerCase();if(!seen.has(k)){seen.add(k);if(e.start>=addDays(t0,-7)&&e.start<t0)fresh.push(e.data.food.trim());}});
  return {A,B,fresh,ok:A.days>=4};
}
const sgnDur=ms=>`${ms>=0?'+':'−'}${dur(Math.abs(ms))}`,sgnNum=x=>`${x>=0?'+':'−'}${Math.abs(x).toFixed(1)}`;
function weekCard(ev,n){
  const w=weekCompare(ev,n);if(!w.ok)return '';
  const cmp=w.B.days>=4;
  return `<button class="vit week" data-act="tab" data-tab="trends">${I.bars}<span><b>Your week</b><small>Sleep ${dur(w.A.sleep)} a day${cmp?` (${sgnDur(w.A.sleep-w.B.sleep)})`:''}${w.A.night?`, longest night stretch ${dur(w.A.night)} on average`:''}</small></span><i>Trends</i></button>`;
}
function otherPhone(x){return x&&x.by&&x.by!==(S.settings.device||'')?`<span class="by">${esc(x.by)}</span>`:'';}
function vToday(){
  const n=Date.now(),ev=live(),a=S.active;let h='';
  if(!S.settings.dob) h+=`<div class="nudge"><span>Add your baby's name and birthday to see age and growth curves.</span><button class="btn small primary" data-act="settings">Set up</button></div>`;
  else if(S.sync.on&&S.sync.err) h+=`<div class="nudge" style="border-color:var(--danger)"><span>Sync paused. ${esc(S.sync.err)}</span><button class="btn small" data-act="settings">Settings</button></div>`;
  else if(!S.sync.on&&S.events.length>20 && n-(S.lastBackup||0)>7*864e5) h+=`<div class="nudge"><span>${S.lastBackup?`Last backup ${daysBetween(S.lastBackup,n)} days ago.`:'No backup yet.'} iPhone can clear web app data, so keep a copy.</span><button class="btn small" data-act="backup">Back up</button></div>`;
  if(a.nurse){
    const cur=curSide(a.nurse),last=lastSide(a.nurse),other=last==='l'?'r':'l';
    h+=`<section class="timer c-feed ${cur?'running':''}"><div class="timer-top"><b>${cur?'Nursing':'Nursing, paused'}${otherPhone(a.nurse)}</b><button data-act="adj-open" data-k="nurse">started ${hm(a.nurse.start)}</button></div>
      <div class="timer-big" role="timer" data-tick="nt">00:00</div>
      <div class="sides"><div class="side ${cur==='l'?'on':''}"><b>Left</b><span data-tick="nl">00:00</span></div><div class="side ${cur==='r'?'on':''}"><b>Right</b><span data-tick="nr">00:00</span></div></div>
      ${guard('nurse',a.nurse,n)}<div class="row-btns"><button class="btn" data-act="nurse-side" data-side="${other}">Switch to ${other==='l'?'left':'right'}</button><button class="btn" data-act="nurse-pause">${cur?'Pause':'Resume'}</button><button class="btn primary" data-act="nurse-done">Done</button></div>
      <div class="adj"><span>Started earlier?</span><button data-act="adj" data-k="nurse" data-m="5">−5 min</button><button data-act="adj" data-k="nurse" data-m="10">−10</button><button data-act="adj" data-k="nurse" data-m="15">−15</button><button data-act="adj-open" data-k="nurse">Set time</button></div>
      <button class="link" data-act="nurse-discard">Discard this feed</button></section>`;
  }
  if(a.sleep){
    h+=`<section class="timer c-sleep running"><div class="timer-top"><b>Asleep${otherPhone(a.sleep)}</b><button data-act="adj-open" data-k="sleep">since ${hm(a.sleep.start)}</button></div>
      <div class="timer-big" role="timer" data-since="${a.sleep.start}" data-fmt="s"></div>
      ${guard('sleep',a.sleep,n)}<div class="row-btns"><button class="btn primary" data-act="sleep-stop">Woke up</button></div>
      <div class="adj"><span>Started earlier?</span><button data-act="adj" data-k="sleep" data-m="5">−5 min</button><button data-act="adj" data-k="sleep" data-m="10">−10</button><button data-act="adj" data-k="sleep" data-m="15">−15</button><button data-act="adj-open" data-k="sleep">Set time</button></div>
      <button class="link" data-act="sleep-discard">Discard this sleep</button></section>`;
  }
  const night=nightActive(),lastN=ev.find(e=>e.type==='nurse'),ls2=lastN&&lastN.data.last;
  const liveSide=a.nurse&&curSide(a.nurse);
  const sideBtn=(s,label)=>`<button class="act c-feed ${liveSide===s?'live':''}" data-act="nurse-side" data-side="${s}">${I.drop}<span>${label}</span>${!a.nurse&&ls2===s?'<small>last</small>':''}</button>`;
  const acts=`<div class="acts">${sideBtn('l','Left')}${sideBtn('r','Right')}
    <button class="act c-feed" data-act="new" data-type="bottle">${I.bottle}<span>Bottle</span></button>
    ${a.sleep?`<button class="act c-sleep live" data-act="sleep-stop">${I.sun}<span>Woke up</span></button>`:`<button class="act c-sleep" data-act="sleep-start">${I.moon}<span>Sleep</span></button>`}
    <button class="act c-diaper" data-act="new" data-type="diaper">${I.diaper}<span>Diaper</span></button>
    <button class="act c-solids" data-act="new" data-type="solids">${I.spoon}<span>Solids</span></button></div>${S.prefs.held||a.nurse||a.sleep?'':'<p class="tip">Started a moment ago? Hold Left, Right or Sleep to set when.</p>'}`;
  if(night) h+=acts;
  h+=`<div class="ring-wrap">${ring(ev,n)}</div>`;
  h+=`<div class="legend"><span class="c-sleep"><i></i>Sleep</span><span class="c-feed"><i></i>Feeds</span><span class="c-diaper"><i></i>Diapers</span><span class="c-solids"><i></i>Solids</span></div>`;
  const ls=ev.find(e=>e.type==='sleep'),ld=ev.find(e=>e.type==='diaper');
  const nh=!a.sleep&&ls?napHint(ev,n):null,nhH=nh&&new Date(n).getHours()>=7&&new Date(n).getHours()<19?`<small class="hint">usually naps after about ${dur(nh.median)}, around ${hm(ls.end+nh.median)}</small>`:'';
  const sleepBox=a.sleep?`<b data-since="${a.sleep.start}"></b><span>asleep since ${hm(a.sleep.start)}</span>`:ls?`<b data-since="${ls.end}"></b><span>awake since ${hm(ls.end)}</span>${nhH}`:`<b>–</b><span>no sleep logged</span>`;
  const dBox=ld?`<b data-since="${ld.start}"></b><span>since diaper, ${hm(ld.start)}</span>`:`<b>–</b><span>no diaper logged</span>`;
  h+=`<div class="since"><div class="c-sleep">${sleepBox}</div><div class="c-diaper">${dBox}</div></div>`;
  if(!night) h+=acts;
  const vit=ev.find(e=>isVit(e)&&e.start>=dayStart(n));
  h+=vit?`<button class="vit done" data-act="edit" data-id="${vit.id}">${I.pill}<span><b>Vitamin D</b><small>Given today at ${hm(vit.start)}</small></span><i>Done ✓</i></button>`
       :`<button class="vit" data-act="vit">${I.pill}<span><b>Vitamin D</b><small>Not given yet today</small></span><i>Give</i></button>`;
  h+=medsCard(ev,n);
  h+=checksNudge();
  if(new Date(n).getDay()===0)h+=weekCard(ev,n);
  const ds=dayStart(n),st=dayStats(ds,addDays(ds,1),ev,n),ns=nightStretch(ds,ev,n);
  const fx=[];if(st.nurseMin)fx.push(`${Math.round(st.nurseMin)} min nursing`);if(st.ml)fx.push(`${st.ml} ml bottle`);
  h+=`<h2 class="sec">Today so far</h2><div class="totals">
    <div><b>${st.feeds}</b><span>${st.feeds===1?'feed':'feeds'}${fx.length?', '+fx.join(', '):''}</span></div>
    <div><b>${dur(st.sleep)}</b><span>sleep</span></div>
    <div><b>${st.wet}</b><span>wet diapers</span></div>
    <div><b>${st.dirty}</b><span>dirty diapers${st.solids?`, ${st.solids} solids`:''}</span></div>
    ${ns?`<div class="wide"><b>${dur(ns.dur)}</b><span>longest stretch last night, ${hm(ns.start)}–${ns.ongoing?'now':hm(ns.end)}</span></div>`:''}</div>`;
  const recent=ev.slice(0,5);
  if(recent.length) h+=`<h2 class="sec">Latest</h2><ul class="list">${recent.map(row).join('')}</ul>`;
  return h;
}

function ring(ev,n){
  const C=160,ds=dayStart(n),de=addDays(ds,1),span=de-ds;
  const ang=t=>((t-ds)/span)*360-90;
  const pt=(r,a)=>[C+r*Math.cos(a*Math.PI/180),C+r*Math.sin(a*Math.PI/180)];
  const f=x=>x.toFixed(1);
  const arc=(r,t0,t1,min=1.2)=>{
    let a0=ang(Math.max(t0,ds)),a1=ang(Math.min(t1,de));
    if(a1-a0<min)a1=a0+min; if(a1-a0>359.8)a1=a0+359.8;
    const [x0,y0]=pt(r,a0),[x1,y1]=pt(r,a1);
    return `M${f(x0)} ${f(y0)}A${r} ${r} 0 ${a1-a0>180?1:0} 1 ${f(x1)} ${f(y1)}`;
  };
  const inDay=e=>(e.end||e.start)>=ds&&e.start<de;
  const td=ev.filter(inDay),lf0=ev.find(isFeed);
  let s=`<svg class="ring" viewBox="0 0 320 320" role="img" aria-label="Today on a 24 hour clock: ${td.filter(e=>e.type==='sleep').length} sleeps, ${td.filter(isFeed).length} feeds, ${td.filter(e=>e.type==='diaper').length} diapers.${lf0?` Last feed at ${hm(lf0.start)}.`:''}">`;
  s+=`<defs><filter id="rglow" filterUnits="userSpaceOnUse" x="-20" y="-20" width="360" height="360"><feGaussianBlur stdDeviation="3" result="b"/><feComponentTransfer in="b" result="g"><feFuncA type="linear" slope=".55"/></feComponentTransfer><feMerge><feMergeNode in="g"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>`;
  s+=`<circle class="trk" cx="${C}" cy="${C}" r="128"/>`;
  if(n>ds) s+=`<path class="past" d="${arc(128,ds,n,0.1)}"/>`;
  for(let h=0;h<24;h++){if(h%6===0)continue;const a=h*15-90,[x0,y0]=pt(92,a),[x1,y1]=pt(96,a);s+=`<line class="tk" x1="${f(x0)}" y1="${f(y0)}" x2="${f(x1)}" y2="${f(y1)}"/>`;}
  [['00',-90],['06',0],['12',90],['18',180]].forEach(([l,a])=>{const [x,y]=pt(80,a);s+=`<text class="hl" x="${f(x)}" y="${f(y)}">${l}</text>`;});
  for(const e of ev){
    if(!inDay(e)) continue;
    if(e.type==='sleep') s+=`<path class="sl" d="${arc(128,e.start,e.end,2.5)}"/>`;
  }
  if(S.active.sleep&&n>ds) s+=`<path class="sl" d="${arc(128,S.active.sleep.start,n,2.5)}"/>`;
  // Point markers sit on two fixed lanes: feeds inside the ring, diapers and solids outside.
  // Markers closer than their own width are fanned out around the cluster's middle so they never merge.
  const lane=(r,gap,list)=>{
    const m=list.map(([t,draw])=>({a:ang(Math.max(t,ds)),draw})).sort((x,y)=>x.a-y.a),min=gap/r*180/Math.PI;
    for(let i=0;i<m.length;){
      let j=i+1;while(j<m.length&&m[j].a-m[j-1].a<min)j++;
      const mid=(m[i].a+m[j-1].a)/2;
      for(let k=i;k<j;k++){if(j-i>1)m[k].a=mid+(k-i-(j-i-1)/2)*min;const [x,y]=pt(r,m[k].a);s+=m[k].draw(x,y);}
      i=j;
    }
  };
  const feeds=td.filter(isFeed).map(e=>[e.start,(x,y)=>`<circle class="fdot" cx="${f(x)}" cy="${f(y)}" r="5"/>`]);
  if(S.active.nurse&&n>ds) feeds.push([S.active.nurse.start,(x,y)=>`<circle class="fdot" cx="${f(x)}" cy="${f(y)}" r="5"/>`]);
  lane(108,12,feeds);
  lane(151,12,td.filter(e=>e.type==='diaper'||e.type==='solids').map(e=>[e.start,(x,y)=>{
    if(e.type==='solids') return `<path class="so" d="M${f(x)} ${f(y-6)}L${f(x+6)} ${f(y)}L${f(x)} ${f(y+6)}L${f(x-6)} ${f(y)}Z"/>`;
    const k=e.data.kind;
    return (k==='wet'||k==='dry')?`<circle class="dpw" cx="${f(x)}" cy="${f(y)}" r="4"/>`:`<circle class="dp" cx="${f(x)}" cy="${f(y)}" r="5"/>`;
  }]));
  const an=ang(n),[hx0,hy0]=pt(112,an),[hx1,hy1]=pt(144,an);
  s+=`<line class="hand" x1="${f(hx0)}" y1="${f(hy0)}" x2="${f(hx1)}" y2="${f(hy1)}"/><circle class="handc" cx="${f(hx1)}" cy="${f(hy1)}" r="3.5"/>`;
  const lf=ev.find(isFeed);
  let top='',big='',bot='',bigAttr='';
  if(S.active.nurse){top='Nursing now';bigAttr='data-tick="nt"';big='00:00';bot=curSide(S.active.nurse)?(curSide(S.active.nurse)==='l'?'on the left':'on the right'):'paused';}
  else if(lf){top='since last feed';bigAttr=`data-since="${lf.start}"`;
    bot=lf.type==='nurse'?`${hm(lf.start)}, ended ${lf.data.last==='r'?'right':'left'}`:`${hm(lf.start)}, ${lf.data.ml} ml bottle`;}
  else {top='';big='Hello';bot='Log a feed below';}
  s+=`<text class="sm" x="${C}" y="${C-28}">${esc(top)}</text><text class="big" x="${C}" y="${C+12}" ${bigAttr}>${esc(big)}</text><text class="sm" x="${C}" y="${C+36}">${esc(bot)}</text>`;
  return s+'</svg>';
}

let histQ='';
// Small line drawings for empty screens, in the accent colour.
const ART={
  list:'<rect x="22" y="14" width="56" height="70" rx="10"/><path d="M34 34h32M34 48h32M34 62h20"/><circle cx="74" cy="76" r="12" class="fill"/><path d="M74 70v12M68 76h12" class="on"/>',
  chart:'<path d="M16 82h68"/><rect x="24" y="52" width="10" height="30" rx="3" class="fill"/><rect x="42" y="36" width="10" height="46" rx="3" class="fill"/><rect x="60" y="22" width="10" height="60" rx="3" class="fill"/><path d="M22 40l20-14 18 8 22-18"/>',
  growth:'<path d="M16 82h68M16 82V18"/><path d="M22 74c18-4 30-20 40-34s16-18 20-20" class="dash"/><circle cx="34" cy="68" r="4" class="fill"/><circle cx="52" cy="52" r="4" class="fill"/><circle cx="66" cy="36" r="4" class="fill"/>',
  spoon:'<ellipse cx="50" cy="30" rx="13" ry="16" class="fill"/><path d="M50 46v38"/><circle cx="26" cy="64" r="6"/><circle cx="76" cy="58" r="5"/><circle cx="70" cy="76" r="4"/>',
  checks:'<rect x="24" y="16" width="52" height="68" rx="9"/><path d="M40 16v-4h20v4"/><path d="M36 48l9 9 19-19" class="on"/><circle cx="50" cy="48" r="20" class="fill"/>'
};
const empty=(art,msg,btn='')=>`<div class="empty"><svg class="art" viewBox="0 0 100 100" aria-hidden="true">${ART[art]}</svg><p>${msg}</p>${btn}</div>`;
function vHistory(){
  const F=[['all','All'],['feeds','Feeds'],['sleep','Sleep'],['diaper','Diapers'],['solids','Solids'],['growth','Growth'],['other','Other']];
  let h=`<div class="bar"><div class="chips">${F.map(([k,l])=>`<button class="chip ${histFilter===k?'on':''}" data-act="hist-filter" data-v="${k}">${l}</button>`).join('')}</div><button class="btn small primary" data-act="add-any">Add</button></div>`;
  h+=`<div class="search"><input id="hist-q" type="search" value="${esc(histQ)}" placeholder="Search notes, foods, medication…" autocomplete="off" enterkeyhint="search"></div>`;
  return h+`<div id="hist-list">${histList()}</div>`;
}
// Search covers every entry, not just the days on screen: titles, details, labels, notes and who logged it.
function histList(){
  const grp=t=>isFeed({type:t})?'feeds':t,q=histQ.trim().toLowerCase();
  const all=live(),ev=all.filter(e=>histFilter==='all'||grp(e.type)===histFilter);
  if(!all.length) return empty('list','Nothing logged yet. Use Add to enter something from earlier, or start from Today.');
  let shown,h='';
  if(q){
    const hay=e=>{const d=describe(e);return [d.title,d.detail,d.right,e.data&&e.data.label,e.data&&e.data.note,e.data&&e.data.food,e.by,LABEL[e.type]].filter(Boolean).join(' ').toLowerCase();};
    const hits=ev.filter(e=>hay(e).includes(q));shown=hits.slice(0,200);
    h+=`<p class="muted" style="margin:8px 2px 0">${hits.length?`${hits.length} ${hits.length===1?'match':'matches'}${hits.length>200?', showing the latest 200':''}`:'No matches'}</p>`;
  } else {
    const cutoff=addDays(dayStart(Date.now()),-(histDays-1));shown=ev.filter(e=>e.start>=cutoff);
    if(!shown.length) h+=empty('list',`No entries in the last ${histDays} days for this filter.`);
  }
  const groups=new Map();
  for(const e of shown){const k=dayStart(e.start);if(!groups.has(k))groups.set(k,[]);groups.get(k).push(e);}
  for(const [k,list] of groups){
    const st=dayStats(k,addDays(k,1),all,Date.now());
    h+=`<h3 class="day"><span>${dayLabel(k)}</span><small>${q?'':`${st.feeds} feeds, ${dur(st.sleep)} sleep, ${st.wet} wet, ${st.dirty} dirty`}</small></h3><ul class="list">${list.map(row).join('')}</ul>`;
  }
  if(!q&&ev.some(e=>e.start<addDays(dayStart(Date.now()),-(histDays-1)))) h+=`<div style="text-align:center;margin-top:16px"><button class="btn small" data-act="hist-more">Show 7 more days</button></div>`;
  return h;
}
document.addEventListener('input',ev=>{if(ev.target&&ev.target.id==='hist-q'){histQ=ev.target.value;const l=$('#hist-list');if(l){l.innerHTML=histList();translateDom(l);}}});

// tips: one label per day; tapping a day shows its values (series[k].tip formats each).
function bars(series,labels,fmtTop,tips){
  const W=340,H=130,L=4,R=4,T=16,B=18,n=labels.length;
  const max=Math.max(1e-9,...series.flatMap(s=>s.vals))*1.08,cw=(W-L-R)/n,bw=Math.min(30,cw*0.72)/series.length;
  let s=`<svg viewBox="0 0 ${W} ${H}"><line class="gl" x1="${L}" x2="${W-R}" y1="${H-B}" y2="${H-B}"/>`;
  series.forEach((se,k)=>se.vals.forEach((v,i)=>{
    const h=(v/max)*(H-T-B),x=L+i*cw+(cw-bw*series.length)/2+k*bw,y=H-B-h;
    if(v>0) s+=`<rect class="${se.cls}" x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${Math.max(1,bw-1.5).toFixed(1)}" height="${h.toFixed(1)}" rx="3"/>`;
    if(fmtTop&&n<=7&&v>0&&series.length===1) s+=`<text class="ax" x="${(x+bw/2).toFixed(1)}" y="${(y-4).toFixed(1)}" text-anchor="middle">${fmtTop(v)}</text>`;
  }));
  labels.forEach((lb,i)=>{if(lb)s+=`<text class="ax" x="${(L+i*cw+cw/2).toFixed(1)}" y="${H-4}" text-anchor="middle">${lb}</text>`;});
  if(tips) labels.forEach((lb,i)=>{s+=`<rect class="hit" x="${(L+i*cw).toFixed(1)}" y="0" width="${cw.toFixed(1)}" height="${H}" data-act="bar" data-tip="${esc(`${tips[i]}: ${series.map(se=>se.tip?se.tip(se.vals[i]):String(se.vals[i])).join(', ')}`)}"/>`;});
  return s+'</svg>';
}
function pattern(days,ev,now){
  const W=340,L=38,Rr=4,n=days.length,rh=n<=7?20:n<=14?13:7,g=n<=14?4:2,T=16,H=T+n*(rh+g);
  let s=`<svg viewBox="0 0 ${W} ${H}">`;
  [0,6,12,18,24].forEach(h=>{const x=L+h/24*(W-L-Rr);s+=`<line class="gl" x1="${x}" x2="${x}" y1="${T-3}" y2="${H}"/><text class="ax" x="${x}" y="10" text-anchor="middle">${pad(h)}</text>`;});
  days.slice().reverse().forEach((d,i)=>{
    const y=T+i*(rh+g),X=t=>L+(t-d.ds)/(d.de-d.ds)*(W-L-Rr);
    s+=`<rect class="f-row" x="${L}" y="${y}" width="${W-L-Rr}" height="${rh}" rx="3" opacity=".6"/>`;
    const blocks=ev.filter(e=>e.type==='sleep'&&e.end>d.ds&&e.start<d.de).map(e=>[e.start,e.end]);
    if(S.active.sleep&&now>d.ds&&S.active.sleep.start<d.de) blocks.push([S.active.sleep.start,now]);
    for(const [a,b] of blocks){const x0=X(Math.max(a,d.ds)),x1=X(Math.min(b,d.de));s+=`<rect class="f-sleep" x="${x0.toFixed(1)}" y="${y}" width="${Math.max(1,x1-x0).toFixed(1)}" height="${rh}" rx="2"/>`;}
    for(const e of ev){if(isFeed(e)&&e.start>=d.ds&&e.start<d.de){s+=`<rect class="f-feed" x="${(X(e.start)-1).toFixed(1)}" y="${y}" width="2.5" height="${rh}"/>`;}}
    const showLbl=n<=14||i%7===0;
    if(showLbl) s+=`<text class="ax" x="${L-6}" y="${y+rh/2+3.5}" text-anchor="end">${i===0?'Today':new Date(d.ds).toLocaleDateString(LOC(),n<=7?{weekday:'short'}:{day:'numeric',month:'numeric'})}</text>`;
  });
  return s+'</svg>';
}
function tempChart(days,pts){
  const W=340,H=150,l=30,r=8,t=10,b=20,t0=days[0].ds,t1=days[days.length-1].de;
  let y0=Math.min(36,...pts.map(p=>p.v))-.3,y1=Math.max(38.4,...pts.map(p=>p.v))+.3;
  const X=x=>l+(x-t0)/(t1-t0)*(W-l-r),Y=v=>t+(1-(v-y0)/(y1-y0))*(H-t-b),f=x=>x.toFixed(1);
  let s=`<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Body temperature readings">`;
  const step=(y1-y0)>4?1:0.5;
  for(let v=Math.ceil(y0/step)*step;v<=y1;v+=step) s+=`<line class="gl" x1="${l}" x2="${W-r}" y1="${f(Y(v))}" y2="${f(Y(v))}"/><text class="ax" x="${l-4}" y="${f(Y(v)+3.5)}" text-anchor="end">${v.toFixed(1)}</text>`;
  if(38>=y0&&38<=y1) s+=`<line class="tref" x1="${l}" x2="${W-r}" y1="${f(Y(38))}" y2="${f(Y(38))}"/>`;
  const step2=Math.max(1,Math.ceil(days.length/6));
  days.forEach((d,i)=>{if(i%step2===0||i===days.length-1) s+=`<text class="ax" x="${f(X(d.ds))}" y="${H-4}" text-anchor="middle">${i===days.length-1?'Today':new Date(d.ds).toLocaleDateString(LOC(),{day:'numeric',month:'numeric'})}</text>`;});
  if(pts.length>1) s+=`<path class="tline" d="${pts.map((p,i)=>`${i?'L':'M'}${f(X(p.t))} ${f(Y(p.v))}`).join('')}"/>`;
  pts.forEach(p=>{s+=`<circle class="tpt" cx="${f(X(p.t))}" cy="${f(Y(p.v))}" r="4"/>`;});
  return s+'</svg>';
}
function vTrends(){
  const now=Date.now(),ev=live(),R=trendRange,t0=dayStart(now);
  let h=`<div class="seg" style="margin:4px 0 14px">${[7,14,30].map(r=>`<button class="${R===r?'on':''}" data-act="trend-range" data-v="${r}">${r} days</button>`).join('')}</div>`;
  if(!ev.length) return h+empty('chart','Trends appear after a day or two of logging.');
  const days=[];for(let i=R-1;i>=0;i--){const ds=addDays(t0,-i),de=addDays(ds,1);days.push({ds,de,st:dayStats(ds,de,ev,now)});}
  const full=days.slice(0,-1);
  const avg=fn=>full.length?full.reduce((x,d)=>x+fn(d.st),0)/full.length:0;
  const labels=days.map((d,i)=>R===7?new Date(d.ds).toLocaleDateString(LOC(),{weekday:'narrow'}):(i%(R===14?2:5)===(R-1)%(R===14?2:5)?String(new Date(d.ds).getDate()):''));
  const box=(title,sub,svg)=>`<section class="chart"><h3><span>${title}</span><small>${sub}</small></h3>${svg.replace('<svg ',`<svg role="img" aria-label="${esc(title)}, ${esc(sub)}" `)}</section>`;
  const tips=days.map(d=>new Date(d.ds).toLocaleDateString(LOC(),{weekday:'short',day:'numeric',month:'short'})),hrs=v=>dur(v*36e5);
  const col=fn=>days.map(d=>fn(d.st));
  h+=box('Sleep pattern','sleep blocks and feeds',pattern(days,ev,now));
  const w=weekCompare(ev,now);
  if(w.ok){const cmp=w.B.days>=4,row=(k,a,b)=>`<div><span>${k}</span><b>${a}</b><small>${cmp?b:''}</small></div>`;
    h=h.replace('<section class="chart">',`<section class="wk"><h3>Last 7 days${cmp?' vs the 7 before':''}</h3><div class="wkg">${row('Sleep a day',dur(w.A.sleep),sgnDur(w.A.sleep-w.B.sleep))}${row('Longest night stretch',w.A.night?dur(w.A.night):'–',w.A.night&&w.B.night?sgnDur(w.A.night-w.B.night):'')}${row('Feeds a day',w.A.feeds.toFixed(1),sgnNum(w.A.feeds-w.B.feeds))}${row('Wet / dirty a day',`${w.A.wet.toFixed(1)} / ${w.A.dirty.toFixed(1)}`,'')}</div>${w.fresh.length?`<p class="muted">New foods: ${esc(w.fresh.join(', '))}</p>`:''}</section><section class="chart">`);}
  h+=box('Sleep per day',`avg ${dur(avg(s=>s.sleep))}`,bars([{vals:col(s=>s.sleep/36e5),cls:'f-sleep',tip:v=>`${hrs(v)} sleep`}],labels,v=>v.toFixed(1),tips));
  const nights=days.map(d=>{const x=nightStretch(d.ds,ev,now);return x?x.dur/36e5:0;}),nn=nights.filter(v=>v>0);
  if(nn.length) h+=box('Longest stretch each night',`avg ${dur(nn.reduce((a,b)=>a+b,0)/nn.length*36e5)}`,bars([{vals:nights,cls:'f-sleep',tip:v=>v?`longest ${hrs(v)}`:'no night logged'}],labels,v=>v.toFixed(1),tips));
  h+=box('Feeds per day',`avg ${avg(s=>s.feeds).toFixed(1)}`,bars([{vals:col(s=>s.feeds),cls:'f-feed',tip:v=>`${v} feeds`}],labels,v=>String(v),tips));
  if(days.some(d=>d.st.nurseMin)) h+=box('Nursing minutes',`avg ${Math.round(avg(s=>s.nurseMin))} min`,bars([{vals:col(s=>Math.round(s.nurseMin)),cls:'f-feed',tip:v=>`${v} min nursing`}],labels,v=>String(v),tips));
  if(days.some(d=>d.st.ml)) h+=box('Bottle volume',`avg ${Math.round(avg(s=>s.ml))} ml`,bars([{vals:col(s=>s.ml),cls:'f-feed',tip:v=>`${v} ml`}],labels,v=>String(v),tips));
  h+=box('Diapers',`avg ${avg(s=>s.wet).toFixed(1)} wet, ${avg(s=>s.dirty).toFixed(1)} dirty`,bars([{vals:col(s=>s.wet),cls:'f-diaper2',tip:v=>`${v} wet`},{vals:col(s=>s.dirty),cls:'f-diaper',tip:v=>`${v} dirty`}],labels,null,tips));
  if(days.some(d=>d.st.solids)) h+=box('Solids per day',`avg ${avg(s=>s.solids).toFixed(1)}`,bars([{vals:col(s=>s.solids),cls:'f-solids',tip:v=>`${v} solids`}],labels,v=>String(v),tips));
  const tempPts=ev.filter(e=>e.data&&e.data.temp!=null&&e.start>=days[0].ds&&e.start<days[days.length-1].de).map(e=>({t:e.start,v:e.data.temp})).sort((a,b)=>a.t-b.t);
  if(tempPts.length) h+=box('Temperature readings',`${tempPts.length} reading${tempPts.length===1?'':'s'}, highest ${fmtNum(Math.max(...tempPts.map(p=>p.v)))}°C`,tempChart(days,tempPts));
  h+=`<p class="muted" style="margin:4px 2px 8px">Tap a day in a bar chart to see its numbers.</p>`;
  h+=`<p class="muted" style="margin:4px 2px">Averages leave out today because it is still in progress. Light bars are wet diapers, dark bars dirty.${tempPts.length?' Dashed line marks 38.0°C.':''}</p>`;
  return h;
}

/* ---------- WHO growth ---------- */
function lms(key,sex,day){
  const t=WHO[key][sex];if(day<=t[0][0])return t[0];
  for(let i=1;i<t.length;i++){if(day<=t[i][0]){const a=t[i-1],b=t[i],f=(day-a[0])/(b[0]-a[0]);return [day,a[1]+(b[1]-a[1])*f,a[2]+(b[2]-a[2])*f,a[3]+(b[3]-a[3])*f];}}
  return t[t.length-1];
}
const atZ=([,L,M,Sg],z)=>Math.abs(L)>1e-9?M*Math.pow(1+L*Sg*z,1/L):M*Math.exp(Sg*z);
const zOf=([,L,M,Sg],x)=>Math.abs(L)>1e-9?(Math.pow(x/M,L)-1)/(L*Sg):Math.log(x/M)/Sg;
function ncdf(z){const t=1/(1+0.2316419*Math.abs(z)),d=0.3989423*Math.exp(-z*z/2),p=d*t*(0.3193815+t*(-0.3565638+t*(1.781478+t*(-1.821256+t*1.330274))));return z>0?1-p:p;}
function pctl(key,day,x){
  if(!S.settings.sex||day<0||day>731||!(x>0)) return '';
  const p=ncdf(zOf(lms(key,S.settings.sex,day),x))*100;
  return p<1?'below P1':p>99?'above P99':'P'+Math.round(p);
}
const GM={w:['kg','Weight','kg'],l:['cm','Length','cm'],h:['head','Head','cm']};
function vGrowth(){
  const st=S.settings;
  let h=`<div class="bar"><div class="seg" style="flex:1">${Object.entries(GM).map(([k,v])=>`<button class="${growthMetric===k?'on':''}" data-act="growth-metric" data-v="${k}">${v[1]}</button>`).join('')}</div><button class="btn small primary" data-act="new" data-type="growth">Add</button></div>`;
  if(!st.dob||!st.sex) return h+empty('growth','Add date of birth and sex in settings to see the WHO growth curves.','<button class="btn primary" data-act="settings">Open settings</button>');
  const [fld,title,unit]=GM[growthMetric],dob=dobTs();
  const g=live().filter(e=>e.type==='growth').sort((a,b)=>a.start-b.start);
  const pts=g.filter(e=>e.data[fld]>0).map(e=>({d:daysBetween(dob,e.start),v:e.data[fld]})).filter(p=>p.d>=0&&p.d<=731);
  const ageNow=daysBetween(dob,Date.now());
  const maxD=Math.min(731,Math.max(91,ageNow+45,...pts.map(p=>p.d+30)));
  const Z=[-1.881,-1.036,0,1.036,1.881],xs=[];for(let d=0;d<maxD;d+=7)xs.push(d);xs.push(maxD);
  const cur=Z.map(z=>xs.map(d=>atZ(lms(growthMetric,st.sex,d),z)));
  let y0=Math.min(...cur[0],...pts.map(p=>p.v)),y1=Math.max(...cur[4],...pts.map(p=>p.v));const pd=(y1-y0)*.04;y0-=pd;y1+=pd;
  const W=340,H=250,l=30,r=24,t=8,b=22,X=d=>l+d/maxD*(W-l-r),Y=v=>t+(1-(v-y0)/(y1-y0))*(H-t-b),f=x=>x.toFixed(1);
  let s=`<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${title} on WHO percentile curves">`;
  const step=[0.5,1,2,5,10].find(k=>(y1-y0)/k<=7)||10;
  for(let v=Math.ceil(y0/step)*step;v<=y1;v+=step){s+=`<line class="gl" x1="${l}" x2="${W-r}" y1="${f(Y(v))}" y2="${f(Y(v))}"/><text class="ax" x="${l-4}" y="${f(Y(v)+3.5)}" text-anchor="end">${fmtNum(v)}</text>`;}
  const ms=maxD<=200?1:maxD<=400?2:3;
  for(let m=0;m*30.4375<=maxD;m+=ms){const x=X(m*30.4375);s+=`<text class="ax" x="${f(x)}" y="${H-6}" text-anchor="middle">${m}${m===0?' mo':''}</text>`;}
  const line=arr=>arr.map((v,i)=>`${i?'L':'M'}${f(X(xs[i]))} ${f(Y(v))}`).join('');
  s+=`<path class="band" d="${line(cur[1])}${cur[3].map((v,i)=>i).reverse().map(i=>`L${f(X(xs[i]))} ${f(Y(cur[3][i]))}`).join('')}Z"/>`;
  s+=`<path class="p3" d="${line(cur[0])}"/><path class="p3" d="${line(cur[4])}"/><path class="p15" d="${line(cur[1])}"/><path class="p15" d="${line(cur[3])}"/><path class="p50" d="${line(cur[2])}"/>`;
  ['3','15','50','85','97'].forEach((lb,i)=>{s+=`<text class="ax" x="${W-r+3}" y="${f(Y(cur[i][cur[i].length-1])+3.5)}">${lb}</text>`;});
  if(ageNow>=0&&ageNow<=maxD) s+=`<line class="nowl" x1="${f(X(ageNow))}" x2="${f(X(ageNow))}" y1="${t}" y2="${H-b}"/>`;
  if(pts.length>1) s+=`<path class="gline" pathLength="1" d="${pts.map((p,i)=>`${i?'L':'M'}${f(X(p.d))} ${f(Y(p.v))}`).join('')}"/>`;
  pts.forEach(p=>{s+=`<circle class="gpt" cx="${f(X(p.d))}" cy="${f(Y(p.v))}" r="4.5"/>`;});
  s+='</svg>';
  const last=pts[pts.length-1];
  h+=`<section class="chart"><h3><span>${title} (${unit})</span><small>${last?`latest ${fmtNum(last.v)} ${unit}, ${pctl(growthMetric,last.d,last.v)}`:'no measurements yet'}</small></h3>${s}</section>`;
  h+=`<p class="muted" style="margin:0 2px 8px">WHO Child Growth Standards for ${st.sex==='f'?'girls':'boys'}. Shaded band is P15 to P85, dashed lines P3 and P97. Following a curve matters more than the exact percentile.</p>`;
  if(g.length){
    h+=`<ul class="list">${g.slice().reverse().map(e=>{const d=daysBetween(dob,e.start),x=e.data,p=[];
      if(x.kg)p.push(`${fmtNum(x.kg)} kg (${pctl('w',d,x.kg)})`);if(x.cm)p.push(`${fmtNum(x.cm)} cm (${pctl('l',d,x.cm)})`);if(x.head)p.push(`head ${fmtNum(x.head)} cm (${pctl('h',d,x.head)})`);
      return `<li><button class="row c-growth" data-act="edit" data-id="${e.id}"><i class="dot"></i><span class="rt"><b>${dateStr(e.start)}<span class="by" style="border:0">${esc(ageText(e.start))}</span></b><small style="white-space:normal">${esc(p.join(', '))}</small></span></button></li>`;}).join('')}</ul>`;
  }
  return h;
}

/* ---------- foods ---------- */
function vFoods(){
  const sol=live().filter(e=>e.type==='solids').sort((a,b)=>a.start-b.start);
  const firstA={},foods=new Map();
  for(const e of sol){
    const d=e.data;(d.allergens||[]).forEach(a=>{if(!firstA[a])firstA[a]=e.start;});
    const k=(d.food||'').trim().toLowerCase();if(!k)continue;
    const f=foods.get(k)||{name:d.food.trim(),first:e.start,count:0,react:'',sym:false};
    f.count++;f.last=e.start;if(d.reaction)f.react=d.reaction;if(d.symptoms)f.sym=true;foods.set(k,f);
  }
  let h=`<div class="bar"><h2 class="sec" style="margin:0;flex:1">${foods.size} ${foods.size===1?'food':'foods'} tried</h2><button class="btn small primary" data-act="new" data-type="solids">Log solids</button></div>`;
  if(!sol.length) return h+empty('spoon','Log each new food as you introduce it. First tries, reactions and allergens collect here.');
  h+=`<h2 class="sec">Common allergens</h2><div class="alg">${ALLERGENS.map(a=>`<div class="${firstA[a]?'on':''}"><b>${esc(a)}</b><span>${firstA[a]?new Date(firstA[a]).toLocaleDateString(LOC(),{day:'numeric',month:'short'}):'Not yet'}</span></div>`).join('')}</div>`;
  const list=[...foods.values()].sort((a,b)=>b.first-a.first);
  h+=`<h2 class="sec">Foods</h2><ul class="list">${list.map(f=>`<li><button class="row c-solids" data-act="new-food" data-food="${esc(f.name)}"><i class="dot"></i><span class="rt"><b>${esc(f.name)}</b><small class="${f.sym?'flag':''}">first ${new Date(f.first).toLocaleDateString(LOC(),{day:'numeric',month:'short'})}, ${f.count}×${f.react?', '+REACT[f.react].toLowerCase():''}${f.sym?', reaction noted':''}</small></span><span class="rd" style="color:var(--muted);font-weight:400">Log</span></button></li>`).join('')}</ul>`;
  h+=`<h2 class="sec">Recent</h2><ul class="list">${sol.slice(-8).reverse().map(row).join('')}</ul>`;
  return h;
}

/* ---------- checks: U-Heft and vaccinations ----------
   U-check windows follow the G-BA Kinder-Richtlinie: a regular window and a wider tolerance
   window, counted in days, weeks or months of life (the 1st month of life is age 0–1 month).
   Vaccinations follow the STIKO Impfkalender 2026 standard schedule for infants; a later dose
   is never shown earlier than the usual minimum gap after the previous one. A check or dose
   counts as done when an entry mentions it: "U4" in any note, or an Other entry labelled
   "Vaccine: …" naming the vaccine. "Not planned: <vaccine>" hides a series from reminders. */
const UCHECKS=[
  {k:'U1',u:'d',reg:[1,1]},
  {k:'U2',u:'d',reg:[3,10],tol:[3,14]},
  {k:'U3',u:'w',reg:[4,5],tol:[3,8]},
  {k:'U4',u:'m',reg:[3,4],tol:[2,4.5]},
  {k:'U5',u:'m',reg:[6,7],tol:[5,8]},
  {k:'U6',u:'m',reg:[10,12],tol:[9,14]},
  {k:'U7',u:'m',reg:[21,24],tol:[20,27]},
  {k:'U7a',u:'m',reg:[34,36],tol:[33,38]},
  {k:'U8',u:'m',reg:[46,48],tol:[43,50]},
  {k:'U9',u:'m',reg:[60,64],tol:[58,66]}
];
const VACCINES=[
  {k:'rsv',name:'RSV antibody',full:'Nirsevimab, one dose for the first RSV season',re:/\bRSV\b|nirsevimab|beyfortus/i,doses:[{rsv:1}],closeAfterM:12},
  {k:'rv',name:'Rotavirus',full:'Oral drops. 2 doses (Rotarix) or 3 (RotaTeq), finished by week 24 or 32',re:/\bRV\b|rota/i,doses:[{w:6},{w:10,gap:28}],closeAfterW:32},
  {k:'six',name:'6-in-1',full:'Diphtheria, tetanus, whooping cough, Hib, polio, hepatitis B',re:/6-?fach|sechsfach|6-in-1|hexa|dtap|\bdtp\b|infanrix|hexyon|vaxelis/i,doses:[{m:2},{m:4,gap:56},{m:11,gap:182}]},
  {k:'pcv',name:'Pneumococcal',full:'',re:/pcv|pneumo|prevenar|vaxneuvance/i,doses:[{m:2},{m:4,gap:56},{m:11,gap:182}]},
  {k:'menb',name:'Meningococcal B',full:'',re:/men\s?b\b|meningococcal\s?b|meningokokken\s?b|bexsero/i,doses:[{m:2},{m:4,gap:56},{m:12,gap:182}]},
  {k:'mmr',name:'MMR',full:'Measles, mumps, rubella',re:/mmr|masern|priorix|m-m-rvaxpro|proquad/i,doses:[{m:11},{m:15,gap:28}]},
  {k:'vzv',name:'Chickenpox',full:'Varicella, often given together with MMR',re:/chickenpox|vzv|varizell|varicella|varivax|mmrv|proquad|priorix-tetra/i,doses:[{m:11},{m:15,gap:28}]}
];
function addMonthsTs(ts,m){const d=new Date(ts),day=d.getDate();d.setDate(1);d.setMonth(d.getMonth()+Math.floor(m));const last=new Date(d.getFullYear(),d.getMonth()+1,0).getDate();d.setDate(Math.min(day,last));return addDays(d.getTime(),Math.round((m%1)*30));}
function lifeStart(dob,u,n){return u==='d'?addDays(dob,n-1):u==='w'?addDays(dob,7*(n-1)):addMonthsTs(dob,n-1);}
function lifeEnd(dob,u,n){return u==='d'?addDays(dob,n-1):u==='w'?addDays(dob,7*n-1):addDays(addMonthsTs(dob,n),-1);}
function rsvDue(dob){const d=new Date(dob),m=d.getMonth();return m>=3&&m<=8?new Date(d.getFullYear(),8,15,12).getTime():dob;}
const evText=e=>(((e.data&&e.data.label)||'')+' '+((e.data&&e.data.note)||''));
const labelOf=e=>((e.data&&e.data.label)||'').trim();
function computeChecks(){
  const dob=dobTs(),n=Date.now(),today=dayStart(n),ev=live().slice().sort((a,b)=>a.start-b.start);
  const u=UCHECKS.map(c=>{
    const regS=lifeStart(dob,c.u,c.reg[0]),regE=lifeEnd(dob,c.u,c.reg[1]);
    const tolS=c.tol?lifeStart(dob,c.u,c.tol[0]):regS,tolE=c.tol?lifeEnd(dob,c.u,c.tol[1]):regE;
    const re=new RegExp('\\bU\\s?'+c.k.slice(1)+'\\b','i');
    const done=ev.find(e=>re.test(evText(e)))||null;
    const s=dayStart(regS),e=dayStart(regE),te=dayStart(tolE),ts=dayStart(tolS);
    const state=done?'done':today>te?'missed':today>=s&&today<=e?'now':today>e?'late':today>=ts?'early':'upcoming';
    return {...c,regS,regE,tolS,tolE,done,state};
  });
  const vacc=ev.filter(e=>e.type==='other'&&/^(vaccin|impf|immuni)/i.test(labelOf(e)));
  const skips=ev.filter(e=>e.type==='other'&&/^(not planned|skipped)/i.test(labelOf(e)));
  const v=VACCINES.map(x=>{
    const given=vacc.filter(e=>x.re.test(evText(e))),skip=skips.find(e=>x.re.test(evText(e)))||null;
    let prev=null;
    const doses=x.doses.map((d,i)=>{
      let due=d.rsv?rsvDue(dob):d.w?addDays(dob,7*d.w):addMonthsTs(dob,d.m);
      if(prev!=null&&d.gap)due=Math.max(due,addDays(prev,d.gap));
      const done=given[i]||null;prev=done?done.start:due;
      const closed=!done&&((x.closeAfterW&&n>addDays(dob,7*x.closeAfterW))||(x.closeAfterM&&n>addMonthsTs(dob,x.closeAfterM)));
      return {i,due,done,state:done?'done':skip?'skip':closed?'closed':today>=dayStart(due)?'due':'upcoming'};
    });
    return {...x,doses,skip};
  });
  return {u,v};
}
function fmtD(ts){const d=new Date(ts);return d.toLocaleDateString(LOC(),d.getFullYear()===new Date().getFullYear()?{day:'numeric',month:'short'}:{day:'numeric',month:'short',year:'numeric'});}
// Items worth acting on now, most urgent first: U-check windows that are open, then due doses.
function checksDue(C){
  const out=[];
  C.u.forEach(c=>{if(c.state==='late')out.push({rank:0,text:`${c.k} window has passed, tolerance until ${fmtD(c.tolE)}`,go:['u',c.k]});
    else if(c.state==='now')out.push({rank:1,text:`${c.k} check window open until ${fmtD(c.regE)}`,go:['u',c.k]});});
  C.v.forEach(x=>{const d=x.doses.find(d=>d.state!=='done');if(d&&d.state==='due')out.push({rank:2,due:d.due,text:`${x.name}${x.doses.length>1?` dose ${d.i+1}`:''} due since ${fmtD(d.due)}`,go:['v',x.k,d.i]});});
  return out.sort((a,b)=>a.rank-b.rank||(a.due||0)-(b.due||0));
}
function checksNudge(){
  if(!S.settings.dob)return '';
  const due=checksDue(computeChecks());if(!due.length)return '';
  return `<button class="vit care" data-act="tab" data-tab="checks">${I.checks}<span><b>${esc(due[0].text)}</b><small>${due.length>1?`${due.length-1} more in Checks`:'Log it in Checks once done'}</small></span><i>Checks</i></button>`;
}
function vChecks(){
  const st=S.settings;
  if(!st.dob) return empty('checks','Add the date of birth in settings to see U-checks and vaccinations.','<button class="btn primary" data-act="settings">Open settings</button>');
  const C=computeChecks(),who=esc(st.name||'your baby');
  let h=`<div class="bar"><p class="muted" style="flex:1;margin:0">From ${who}'s birth date. Tap to log.</p><button class="btn small" data-act="ics">Add to calendar</button></div>`;
  h+=`<button class="vit care" data-act="report">${I.checks}<span><b>Visit summary</b><small>One page for the paediatrician: averages, growth, vaccines, temperatures</small></span><i>Open</i></button>`;
  const due=checksDue(C);
  if(due.length) h+=`<div class="ck-now">${due.slice(0,3).map(d=>`<button data-act="ck-open" data-kind="${d.go[0]}" data-key="${d.go[1]}" data-i="${d.go[2]??''}">${esc(d.text)}</button>`).join('')}${due.length>3?`<p class="muted" style="margin:2px 4px 0">${due.length-3} more marked below. Already done? Tap to log the date.</p>`:''}</div>`;
  h+=`<h2 class="sec">U-Heft</h2><ul class="ck">${C.u.map(c=>{
    const sub=c.done?`Done ${fmtD(c.done.start)}`
      :c.state==='now'?`Window open until ${fmtD(c.regE)}`
      :c.state==='late'?`Regular window ended, tolerance until ${fmtD(c.tolE)}`
      :c.state==='early'?`Window opens ${fmtD(c.regS)}, can be done now`
      :c.state==='missed'?'Not logged, tap to add the date'
      :c.k==='U1'?'Right after birth':`${fmtD(c.regS)} – ${fmtD(c.regE)}`;
    const act=c.done?`data-act="edit" data-id="${c.done.id}"`:`data-act="ck-open" data-kind="u" data-key="${c.k}"`;
    return `<li class="${c.state}"><button ${act}><span class="mk">${c.k}</span><span class="rt"><b>${c.k==='U1'?'Newborn check':c.k+' check'}</b><small class="${c.state==='now'||c.state==='late'?'hot':''}">${esc(sub)}</small></span></button></li>`;}).join('')}</ul>`;
  h+=`<h2 class="sec">Vaccinations</h2><ul class="ck vac">${C.v.map(x=>{
    const chips=x.doses.map(d=>{
      const lbl=x.doses.length>1?`${d.i+1}: `:'';
      const txt=d.state==='done'?`${lbl}✓ ${fmtD(d.done.start)}`:d.state==='skip'?`${lbl}not planned`:d.state==='closed'?`${lbl}window closed`:d.state==='due'?`${lbl}due ${fmtD(d.due)}`:`${lbl}${fmtD(d.due)}`;
      const act=d.done?`data-act="edit" data-id="${d.done.id}"`:d.state==='skip'?`data-act="edit" data-id="${x.skip.id}"`:`data-act="ck-open" data-kind="v" data-key="${x.k}" data-i="${d.i}"`;
      return `<button class="dose ${d.state}" ${act}>${esc(txt)}</button>`;}).join('');
    return `<li><div class="vrow"><b>${esc(x.name)}</b>${x.full?`<small>${esc(x.full)}</small>`:''}<div class="doses">${chips}</div></div></li>`;}).join('')}</ul>`;
  h+=`<p class="muted" style="margin:12px 2px 0">Based on the G-BA Kinder-Richtlinie and the STIKO Impfkalender 2026. The yellow U-Heft and your paediatrician's plan take precedence. MenC is no longer a standard infant vaccination.</p>`;
  return h;
}
function openCheck(kind,key,i){
  const C=computeChecks();let title,info,defTs=Date.now();
  if(kind==='u'){const c=C.u.find(x=>x.k===key);if(!c)return;
    title=`${c.k} check done`;
    info=c.k==='U1'?'Right after birth.':`Regular window ${fmtD(c.regS)} – ${fmtD(c.regE)}, tolerance ${fmtD(c.tolS)} – ${fmtD(c.tolE)}.`;
    if(c.state==='missed')defTs=Math.min(Date.now(),c.regS);
  } else {const x=C.v.find(v=>v.k===key);if(!x)return;const d=x.doses[+i];
    title=`${x.name}${x.doses.length>1?`, dose ${d.i+1}`:''} given`;
    info=`${x.full?x.full+'. ':''}Recommended from ${fmtD(d.due)}.`;
  }
  openSheet(`<h2>${esc(title)}</h2><p class="muted" style="margin:-4px 2px 12px">${esc(info)}</p>
    ${fld('Date',`<input id="ck-date" type="date" value="${toDate(defTs)}">`)}
    ${fld('Note',`<input id="ck-note" type="text" placeholder="optional, e.g. vaccine brand or doctor" autocomplete="off">`)}
    <div class="foot">${kind==='v'?`<button class="btn" data-act="ck-skip" data-key="${key}">Not planned</button>`:''}<button class="btn" data-act="close">Cancel</button><button class="btn primary" data-act="ck-save" data-kind="${kind}" data-key="${key}" data-i="${i??''}">Save</button></div>`);
}
function saveCheck(kind,key,i){
  const ts=fromInput($('#ck-date').value);
  if(isNaN(ts))return toast('Enter a valid date.');
  if(ts>Date.now()+5*6e4)return toast('That date is in the future. Log it once it has happened.');
  const x=kind==='v'?VACCINES.find(v=>v.k===key):null;
  const label=kind==='u'?`U-check: ${key}`:`Vaccine: ${x.name}${x.doses.length>1?` (dose ${+i+1})`:''}`;
  const note=$('#ck-note').value.trim(),e={id:uid(),type:'other',start:ts,data:{label,...(note?{note}:{})}};
  upsert(e);closeSheet();render();
  if(kind==='u')toast(`${key} logged`,()=>{openEditor('growth');setTimeout(()=>{const f=$('#f-date');if(f)f.value=toDate(ts);},0);},'Add measurements',true);
  else toast(`${x.name} logged`,()=>removeEv(e.id));
}
function skipVaccine(key){
  const x=VACCINES.find(v=>v.k===key);if(!x)return;
  if(!confirm(tr(`Mark ${x.name} as not planned? It stops showing as due. You can undo this by tapping it in Checks.`)))return;
  const e={id:uid(),type:'other',start:Date.now(),data:{label:`Not planned: ${x.name}`}};
  upsert(e);closeSheet();render();toast(`${x.name} marked not planned`,()=>removeEv(e.id));
}
function icsText(){
  const C=computeChecks(),n=Date.now(),today=dayStart(n),who=S.settings.name||'Baby',dobKey=(S.settings.dob||'').replace(/-/g,'');
  const esc2=s=>String(s).replace(/\\/g,'\\\\').replace(/;/g,'\;').replace(/,/g,'\\,').replace(/\n/g,'\\n');
  const enc=new TextEncoder();
  const fold=line=>{const out=[];let s=line;while(enc.encode(s).length>73){let k=73;while(enc.encode(s.slice(0,k)).length>73)k--;out.push(s.slice(0,k));s=' '+s.slice(k);}out.push(s);return out.join('\r\n');};
  const ymd=ts=>toDate(ts).replace(/-/g,'');
  const utc=new Date(n).toISOString().replace(/[-:]/g,'').replace(/\.\d+Z$/,'Z');
  const L=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Yupu baby//Checks//EN','CALSCALE:GREGORIAN','METHOD:PUBLISH'];
  const add=(uidKey,day,title,desc)=>{const d=Math.max(dayStart(day),today);
    L.push('BEGIN:VEVENT',`UID:yupu-${dobKey}-${uidKey}@yupu.baby`,`DTSTAMP:${utc}`,`DTSTART;VALUE=DATE:${ymd(d)}`,`DTEND;VALUE=DATE:${ymd(addDays(d,1))}`,
      fold(`SUMMARY:${esc2(title)}`),fold(`DESCRIPTION:${esc2(desc)}`),'TRANSP:TRANSPARENT',
      'BEGIN:VALARM','ACTION:DISPLAY',fold(`DESCRIPTION:${esc2(title)}`),'TRIGGER;RELATED=START:PT9H','END:VALARM','END:VEVENT');};
  let count=0;
  C.u.forEach(c=>{if(c.done||c.state==='missed'||c.k==='U1')return;count++;
    add(c.k.toLowerCase(),c.regS,`${who}: ${c.k} check window`,`Regular window ${fmtD(c.regS)} – ${fmtD(c.regE)}. Tolerance ${fmtD(c.tolS)} – ${fmtD(c.tolE)}. Book with the paediatrician and bring the yellow U-Heft.`);});
  C.v.forEach(x=>x.doses.forEach(d=>{if(d.state!=='due'&&d.state!=='upcoming')return;count++;
    add(`${x.k}-${d.i+1}`,d.due,`${who}: ${x.name}${x.doses.length>1?` dose ${d.i+1}`:''} due`,`${x.full?x.full+'. ':''}Recommended from ${fmtD(d.due)} (STIKO standard schedule). Bring the vaccination record.`);}));
  L.push('END:VCALENDAR');
  return {text:L.join('\r\n')+'\r\n',count};
}
async function exportIcs(){
  const r=icsText();
  if(!r.count)return toast('Nothing upcoming to add.');
  if(await shareFile(`yupu-checks-${stamp()}.ics`,r.text,'text/calendar'))toast(`${r.count} dates ready. Open the file to add them to Calendar.`);
}

/* ---------- paediatrician visit summary ----------
   One page built from the log: averages over the last full days (today excluded), plus
   growth, vaccinations, U-checks, temperatures and medications. Printed through the
   hidden #print block, or shared as a self-contained HTML file or as plain text. */
let reportRange=14;
function reportData(R){
  const n=Date.now(),t0=dayStart(n),from=addDays(t0,-R),ev=live(),inR=e=>e.start>=from&&e.start<t0,dob=dobTs(),st=S.settings;
  let sleep=0,feeds=0,nm=0,ml=0,wet=0,dirty=0,naps=0,nightSum=0,nightN=0,solidDays=0,days=0,bottles=0;
  for(let i=1;i<=R;i++){const d=addDays(t0,-i);if(!ev.some(e=>e.start>=d&&e.start<addDays(d,1)))continue;days++;
    const s=dayStats(d,addDays(d,1),ev,n);bottles+=ev.filter(e=>e.type==='bottle'&&e.start>=d&&e.start<addDays(d,1)).length;sleep+=s.sleep;feeds+=s.feeds;nm+=s.nurseMin;ml+=s.ml;wet+=s.wet;dirty+=s.dirty;if(s.solids)solidDays++;
    naps+=ev.filter(e=>e.type==='sleep'&&e.start>=atHour(d,7)&&e.start<atHour(d,19)).length;
    const ns=nightStretch(d,ev,0);if(ns){nightSum+=ns.dur;nightN++;}}
  const seen=new Set();ev.slice().sort((a,b)=>a.start-b.start).forEach(e=>{if(e.type==='solids'&&e.data.food&&e.start<from)seen.add(e.data.food.trim().toLowerCase());});
  const foods=[];const fs=new Set();ev.filter(e=>e.type==='solids'&&inR(e)).sort((a,b)=>a.start-b.start).forEach(e=>{const k=(e.data.food||'').trim();if(!k||fs.has(k.toLowerCase()))return;fs.add(k.toLowerCase());foods.push({name:k,fresh:!seen.has(k.toLowerCase())});});
  const reactions=ev.filter(e=>e.type==='solids'&&inR(e)&&e.data.symptoms).map(e=>({when:e.start,food:e.data.food,note:e.data.note||''}));
  const temps=ev.filter(e=>inR(e)&&e.data&&e.data.temp!=null).sort((a,b)=>a.start-b.start);
  const meds=ev.filter(e=>inR(e)&&medName(e)).sort((a,b)=>a.start-b.start).map(e=>({when:e.start,name:medName(e),note:e.data.note||'',temp:e.data.temp}));
  const rash=new Set(ev.filter(e=>e.type==='diaper'&&inR(e)&&/rash|wund|ausschlag/i.test(e.data.note||'')).map(e=>dayStart(e.start))).size;
  const g=ev.filter(e=>e.type==='growth').sort((a,b)=>b.start-a.start);
  const lastOf=k=>g.find(e=>e.data[k]>0),prevOf=(k,x)=>x&&g.find(e=>e.data[k]>0&&e.start<x.start);
  const growth=[['kg','w','Weight','kg'],['cm','l','Length','cm'],['head','h','Head','cm']].map(([k,key,label,unit])=>{const a=lastOf(k);if(!a)return null;const b=prevOf(k,a);
    return {label,unit,v:a.data[k],when:a.start,p:st.sex?pctl(key,daysBetween(dob,a.start),a.data[k]):'',prev:b?{v:b.data[k],when:b.start}:null};}).filter(Boolean);
  const C=st.dob?computeChecks():null;
  return {R,from,to:addDays(t0,-1),n,name:st.name||'Baby',dob:st.dob,age:ageText(),
    days,avg:{sleep:sleep/(days||1),feeds:feeds/(days||1),nm:nm/(days||1),ml:ml/(days||1),mlTotal:ml,bottles,wet:wet/(days||1),dirty:dirty/(days||1),naps:naps/(days||1),night:nightN?nightSum/nightN:0,solidDays},
    foods,reactions,temps,meds,rash,growth,C};
}
function reportHtml(d,q){
  const rows=x=>x.map(([k,v])=>`<tr><th>${esc(k)}</th><td>${v}</td></tr>`).join('');
  const a=d.avg,feedBits=[`${a.feeds.toFixed(1)} feeds a day`];if(a.nm)feedBits.push(`${Math.round(a.nm)} min nursing`);
  if(a.bottles)feedBits.push(a.bottles>=d.days/2?`${Math.round(a.ml)} ml from bottles`:`${a.bottles} ${a.bottles===1?'bottle':'bottles'} in total (${Math.round(a.mlTotal)} ml)`);
  let h=`<div class="rp"><header><h1>${esc(d.name)}</h1><p>Born ${esc(dateStr(fromInput(d.dob)))}${d.age?`, ${esc(d.age)}`:''}${/\.$/.test(d.age||'')?'':'.'} Summary of the last ${d.R} days, ${esc(dateStr(d.from))} – ${esc(dateStr(d.to))}${d.days<d.R?`; averages use the ${d.days} days with entries`:''}. Created ${esc(whenStr(d.n))}.</p></header>`;
  h+=`<h2>Daily averages</h2><table>${rows([['Feeding',feedBits.join(', ')],['Sleep',`${dur(a.sleep)} a day, ${a.naps.toFixed(1)} daytime naps${a.night?`, longest night stretch ${dur(a.night)} on average`:''}`],['Diapers',`${a.wet.toFixed(1)} wet, ${a.dirty.toFixed(1)} dirty a day${d.rash?`; rash noted on ${d.rash} day${d.rash>1?'s':''}`:''}`],['Solids',a.solidDays?`on ${a.solidDays} of ${d.days} days`:'none logged']])}</table>`;
  if(d.foods.length)h+=`<h2>Foods in this period</h2><p>${d.foods.map(f=>esc(f.name)+(f.fresh?' <em>(new)</em>':'')).join(', ')}</p>`;
  if(d.reactions.length)h+=`<h2>Reactions noted after food</h2><table>${rows(d.reactions.map(r=>[whenStr(r.when),esc(r.food||'')+(r.note?` – ${esc(r.note)}`:'')]))}</table>`;
  const hi=d.temps.filter(e=>e.data.temp>=37.5);
  h+=`<h2>Temperatures</h2>${d.temps.length?(hi.length?`<table>${rows(hi.map(e=>[whenStr(e.start),`${fmtNum(e.data.temp)} °C`]))}</table><p>${d.temps.length} readings logged, highest ${fmtNum(Math.max(...d.temps.map(e=>e.data.temp)))} °C.</p>`:`<p>${d.temps.length} readings logged, none at 37.5 °C or above (highest ${fmtNum(Math.max(...d.temps.map(e=>e.data.temp)))} °C).</p>`):'<p>No readings logged.</p>'}`;
  h+=`<h2>Medication</h2>${d.meds.length?`<table>${rows(d.meds.map(m=>[whenStr(m.when),esc(m.name)+(m.note?` – ${esc(m.note)}`:'')]))}</table>`:'<p>None logged.</p>'}`;
  if(d.growth.length)h+=`<h2>Growth</h2><table>${rows(d.growth.map(x=>[x.label,`${fmtNum(x.v)} ${x.unit}${x.p?` (${x.p})`:''} on ${esc(dateStr(x.when))}${x.prev?`; before: ${fmtNum(x.prev.v)} ${x.unit} on ${esc(dateStr(x.prev.when))}`:''}`]))}</table><p class="fine">Percentiles: WHO Child Growth Standards.</p>`;
  if(d.C){
    const given=d.C.v.flatMap(x=>x.doses.filter(z=>z.done).map(z=>[`${x.name}${x.doses.length>1?` dose ${z.i+1}`:''}`,esc(dateStr(z.done.start))]));
    const open=d.C.v.flatMap(x=>{const z=x.doses.find(z=>z.state!=='done');return z&&z.state==='due'?[[`${x.name}${x.doses.length>1?` dose ${z.i+1}`:''}`,`not logged yet, recommended from ${esc(dateStr(z.due))}`]]:[];});
    h+=`<h2>Vaccinations (from the log)</h2>${given.length?`<table>${rows(given)}</table>`:'<p>None logged.</p>'}${open.length?`<table class="open">${rows(open)}</table>`:''}`;
    const uDone=d.C.u.filter(c=>c.done).map(c=>`${c.k} ${dateStr(c.done.start)}`),uNext=d.C.u.find(c=>!c.done&&c.state!=='missed');
    h+=`<h2>U-checks</h2><p>${uDone.length?`Logged: ${esc(uDone.join(', '))}.`:'None logged.'}${uNext?` Next: ${uNext.k}, window ${esc(dateStr(uNext.regS))} – ${esc(dateStr(uNext.regE))}.`:''}</p>`;
  }
  if(q&&q.trim())h+=`<h2>Questions for the doctor</h2><p class="q">${esc(q.trim()).replace(/\n/g,'<br>')}</p>`;
  h+=`<p class="fine">Logged by the parents in the Yupu baby app. Not a medical record.</p></div>`;
  return h;
}
const REPORT_CSS=`.rp{font:14px/1.45 -apple-system,system-ui,"Segoe UI",Roboto,sans-serif;color:#1B2233;background:#fff}
.rp header{border-bottom:2px solid #1B2233;padding-bottom:8px;margin-bottom:6px}.rp h1{font-size:22px;margin:0 0 2px}.rp header p{margin:0;color:#475067}
.rp h2{font-size:13px;margin:14px 0 4px;color:#A5467D;font-weight:700}
.rp table{width:100%;border-collapse:collapse}.rp th,.rp td{text-align:left;vertical-align:top;padding:4px 6px 4px 0;border-bottom:1px solid #E3E7EF;font-size:13.5px}
.rp th{width:34%;font-weight:600;color:#475067}.rp table.open td{color:#A5467D}.rp p{margin:4px 0}.rp .fine{font-size:11.5px;color:#667085;margin-top:10px}.rp .q{white-space:normal}`;
function reportText(d,q){
  const box=document.createElement('div');box.innerHTML=reportHtml(d,q);translateDom(box);
  const out=[];box.querySelectorAll('h1,header p,h2,tr,p:not(header p)').forEach(el=>{
    if(el.tagName==='H1')out.push(el.textContent.toUpperCase());
    else if(el.tagName==='H2')out.push('\n'+el.textContent);
    else if(el.tagName==='TR')out.push(`• ${el.children[0].textContent}: ${el.children[1].textContent}`);
    else out.push(el.textContent);});
  return out.join('\n');
}
function openReport(){
  if(!S.settings.dob)return toast('Add the date of birth in Settings first.');
  const q=$('#rp-q')?$('#rp-q').value:(S.prefs.reportQ||'');
  openSheet(`<h2>Visit summary</h2>
    <div class="seg" style="margin-bottom:10px">${[7,14,30].map(r=>`<button type="button" class="${reportRange===r?'on':''}" data-act="rp-range" data-v="${r}">${r} days</button>`).join('')}</div>
    ${fld('Questions for the doctor (optional)',`<textarea id="rp-q" rows="3" placeholder="e.g. rash on the cheeks since Monday">${esc(q)}</textarea>`)}
    <div class="rp-prev" id="rp-prev">${reportHtml(reportData(reportRange),q)}</div>
    <div class="stack" style="margin-top:12px"><button class="btn primary" data-act="rp-print">Print or save as PDF</button><button class="btn small" data-act="rp-file">Share as file</button><button class="btn small" data-act="rp-text">Share as text</button></div>
    <div class="foot"><button class="btn" data-act="close">Close</button></div>`);
  const ta=$('#rp-q');ta.addEventListener('input',()=>{S.prefs.reportQ=ta.value;$('#rp-prev').innerHTML=reportHtml(reportData(reportRange),ta.value);translateDom($('#rp-prev'));});
  ta.addEventListener('change',()=>save());
}
function reportPrint(){
  const p=$('#print');p.innerHTML=$('#rp-prev').innerHTML;
  try{window.print();}catch(e){toast('Printing is not available here. Use Share as file.');}
}
async function reportFile(){
  const html=`<!doctype html><html lang="${S.settings.lang==='de'?'de':'en'}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(S.settings.name||'Baby')} – visit summary</title><style>body{margin:0;padding:18px;background:#fff}${REPORT_CSS}</style></head><body>${$('#rp-prev').innerHTML}</body></html>`;
  await shareFile(`yupu-visit-${stamp()}.html`,html,'text/html');
}
async function reportShareText(){
  const txt=reportText(reportData(reportRange),$('#rp-q').value);
  try{if(navigator.share){await navigator.share({text:txt});return;}}catch(e){if(e&&e.name==='AbortError')return;}
  try{await navigator.clipboard.writeText(txt);toast('Summary copied');}catch(e){toast('Sharing is not available here.');}
}

/* ---------- change history, recently deleted, data health ---------- */
const whenStr=ts=>`${dateStr(ts)} ${hm(ts)}`;
function metaLine(e){
  const bits=[];
  if(e.by||e.created)bits.push(`Logged${e.by?` by ${esc(e.by)}`:''}${e.created?`, ${whenStr(e.created)}`:''}`);
  if(e.hist&&e.hist.length)bits.push(`edited${e.editBy?` by ${esc(e.editBy)}`:''}, ${whenStr(e.updatedAt)}`);
  if(!bits.length)return '';
  return `<p class="meta">${bits.join(' · ')}${e.hist&&e.hist.length?` <button class="link inline" data-act="hist" data-id="${e.id}">Earlier versions (${e.hist.length})</button>`:''}</p>`;
}
function vline(type,v){const d=describe({type,start:v.start,end:v.end,data:v.data||{}});return {title:`${d.title}${d.right?' · '+d.right:''}`,sub:`${type==='growth'?dateStr(v.start):whenStr(v.start)}${d.detail?' · '+d.detail:''}`};}
function openHistory(id){
  const e=S.events.find(x=>x.id===id);if(!e||!e.hist||!e.hist.length)return;
  const cur=vline(e.type,e);
  const rows=e.hist.map((v,i)=>({v,i})).reverse().map(({v,i})=>{const l=vline(e.type,v);
    return `<li class="hrow"><span class="rt"><b>${esc(l.title)}</b><small>${esc(l.sub)}</small><small>Version from ${whenStr(v.at)}${v.by?` by ${esc(v.by)}`:''}</small></span><button class="btn small" data-act="hist-restore" data-id="${id}" data-i="${i}">Restore</button></li>`;}).join('');
  openSheet(`<h2>Earlier versions</h2><p class="muted" style="margin-bottom:10px">Now: ${esc(cur.title)}, ${esc(cur.sub)}</p><ul class="list">${rows}</ul><div class="foot"><button class="btn" data-act="close">Close</button></div>`);
}
function openDeleted(){
  const now=Date.now(),list=S.events.filter(e=>e.deleted&&e.prev&&now-e.updatedAt<30*864e5).sort((a,b)=>b.updatedAt-a.updatedAt).slice(0,50);
  const rows=list.map(e=>{const l=vline(e.prev.type,e.prev);
    return `<li class="hrow"><span class="rt"><b>${esc(l.title)}</b><small>${esc(l.sub)}</small><small>Deleted ${whenStr(e.updatedAt)}${e.delBy?` by ${esc(e.delBy)}`:''}</small></span><button class="btn small" data-act="del-restore" data-id="${e.id}">Restore</button></li>`;}).join('');
  openSheet(`<h2>Recently deleted</h2><p class="muted" style="margin-bottom:10px">Entries deleted on either phone in the last 30 days.</p>${rows?`<ul class="list">${rows}</ul>`:'<p class="muted">Nothing deleted in the last 30 days.</p>'}<div class="foot"><button class="btn" data-act="close">Close</button></div>`);
}
function healthScan(){
  const ev=live().slice().sort((a,b)=>a.start-b.start),out=[],now=Date.now(),sig=e=>JSON.stringify([e.type,describe(e)]);
  for(let i=0;i<ev.length;i++)for(let j=i+1;j<ev.length&&ev[j].start-ev[i].start<=120000;j++)
    if(sig(ev[i])===sig(ev[j]))out.push({kind:'dup',ids:[ev[i].id,ev[j].id],fix:ev[j].id});
  const sl=ev.filter(e=>e.type==='sleep');
  for(let i=0;i<sl.length;i++)for(let j=i+1;j<sl.length&&sl[j].start<sl[i].end;j++){
    const a=sl[i],b=sl[j],ov=Math.min(a.end,b.end)-b.start;
    if(ov>5*6e4&&sig(a)!==sig(b))out.push({kind:b.end<=a.end?'inside':'overlap',ids:[a.id,b.id],fix:b.end<=a.end?b.id:null,ov});}
  ev.forEach(e=>{
    if(e.type==='sleep'){const d=e.end-e.start;if(d>16*36e5)out.push({kind:'long',ids:[e.id]});else if(d<2*6e4)out.push({kind:'short',ids:[e.id],fix:e.id});}
    if(e.type==='nurse'&&((e.data.l||0)+(e.data.r||0))>2*3600)out.push({kind:'long',ids:[e.id]});
    if(e.start>now+5*6e4)out.push({kind:'future',ids:[e.id]});
  });
  return out;
}
function healthText(x){
  const e=S.events.find(v=>v.id===x.ids[0]),b=x.ids[1]&&S.events.find(v=>v.id===x.ids[1]);
  const l=vline(e.type,e);
  switch(x.kind){
    case 'dup':return [`Logged twice: ${l.title}`,`${l.sub}, and again at ${hm(b.start)}`];
    case 'inside':return ['A sleep inside another sleep',`${hm(b.start)}–${hm(b.end)} lies within ${hm(e.start)}–${hm(e.end)}, ${dateStr(e.start)}`];
    case 'overlap':return [`Two sleeps overlap by ${dur(x.ov)}`,`${hm(e.start)}–${hm(e.end)} and ${hm(b.start)}–${hm(b.end)}, ${dateStr(e.start)}`];
    case 'long':return [`Unusually long: ${l.title}`,l.sub];
    case 'short':return ['Sleep under 2 minutes',l.sub];
    case 'future':return ['Entry in the future',l.sub];
  }
}
function openHealth(){
  const list=healthScan(),fixable=list.filter(x=>x.fix);
  const rows=list.slice(0,60).map((x,k)=>{const [a,b]=healthText(x);
    const btns=(x.fix?`<button class="btn small" data-act="health-fix" data-id="${x.fix}">${x.kind==='short'?'Delete':x.kind==='inside'?'Delete inner':'Delete second'}</button>`:'')+x.ids.map((id,n)=>`<button class="btn small" data-act="edit" data-id="${id}">Edit${x.ids.length>1?' '+(n+1):''}</button>`).join('');
    return `<li class="hrow"><span class="rt"><b>${esc(a)}</b><small style="white-space:normal">${esc(b)}</small></span><span class="hbtns">${btns}</span></li>`;}).join('');
  openSheet(`<h2>Check data</h2>${list.length?`<p class="muted" style="margin-bottom:10px">${list.length} ${list.length===1?'thing':'things'} to look at${fixable.length?`, ${fixable.length} with a suggested fix`:''}. Deleted entries can be restored from Recently deleted.</p>${fixable.length?`<button class="btn primary" style="width:100%;margin-bottom:10px" data-act="health-fixall">Apply ${fixable.length} suggested ${fixable.length===1?'fix':'fixes'}</button>`:''}<ul class="list">${rows}</ul>`:'<p class="muted">No duplicates, overlaps or odd durations found.</p>'}<div class="foot"><button class="btn" data-act="close">Close</button></div>`);
}
/* ---------- sheets ---------- */
function openSheet(html){$('#sheet').style.transform='';$('#sheet').innerHTML='<div class="grab"></div>'+html;translateDom($('#sheet'));$('#sheetWrap').classList.add('open');document.body.style.overflow='hidden';$('#sheet').scrollTop=0;}
function closeSheet(){$('#sheetWrap').classList.remove('open');document.body.style.overflow='';ed=null;}
// Swipe down to close: the drag starts on the handle, or anywhere once the sheet is scrolled
// to the top. Typing in fields and sideways chip rows are left alone.
(function(){
  const sh=$('#sheet');let y0=0,dy=0,t0=0,drag=false,armed=false;
  sh.addEventListener('touchstart',e=>{
    if(e.touches.length!==1){armed=false;return;}
    const tg=e.target,onGrab=!!tg.closest('.grab');
    if(!onGrab&&tg.closest('input,textarea,select,.chips'))return;
    armed=onGrab||sh.scrollTop<=0;drag=false;y0=e.touches[0].clientY;dy=0;t0=Date.now();
  },{passive:true});
  sh.addEventListener('touchmove',e=>{
    if(!armed)return;dy=e.touches[0].clientY-y0;
    if(!drag){if(dy>8&&sh.scrollTop<=0)drag=true;else{if(dy<-4)armed=false;return;}}
    e.preventDefault();sh.style.transition='none';sh.style.transform=`translateY(${Math.max(0,dy)}px)`;
  },{passive:false});
  function end(){
    if(!armed)return;armed=false;if(!drag)return;drag=false;
    sh.style.transition='';const v=dy/Math.max(1,Date.now()-t0);
    if(dy>110||(dy>40&&v>0.5)){sh.style.transform='translateY(100%)';setTimeout(()=>{closeSheet();sh.style.transform='';},170);}
    else sh.style.transform='';
  }
  sh.addEventListener('touchend',end);sh.addEventListener('touchcancel',end);
})();
const sheetOpen=()=>$('#sheetWrap').classList.contains('open');
const fld=(label,inner)=>`<label class="fld"><span>${label}</span>${inner}</label>`;
const fldD=(label,inner)=>`<div class="fld"><span>${label}</span>${inner}</div>`;
const txt=(id,val,mode='decimal',ph='')=>`<input id="${id}" type="text" inputmode="${mode}" value="${esc(val??'')}" placeholder="${esc(ph)}" autocomplete="off">`;
function seg(id,opts,val){return `<input type="hidden" id="${id}" value="${esc(val)}"><div class="seg">${opts.map(([v,l])=>`<button type="button" data-act="seg" data-group="${id}" data-val="${esc(v)}" class="${v===val?'on':''}">${l}</button>`).join('')}</div>`;}

let ed=null;
function openEditor(type,e,prefill){
  const isNew=!e,n=Date.now();
  e=e?JSON.parse(JSON.stringify(e)):{type,start:n,data:{}};
  if(isNew&&type==='sleep'){e.start=n-36e5;e.end=n;}
  ed=e;ed._new=isNew;
  const d=e.data;let f=`<h2>${isNew?'New':'Edit'} ${LABEL[type].toLowerCase()}</h2>`;
  const ago=(id,list=[0,5,10,15,30])=>`<div class="presets ago">${list.map(m=>`<button type="button" class="chip" data-act="ago" data-t="${id}" data-m="${m}">${m?m+' min ago':'Now'}</button>`).join('')}</div>`;
  const time=(label='Time')=>fld(label,`<input id="f-start" type="datetime-local" value="${toInput(e.start)}">`)+ago('f-start');
  const note=()=>fld('Note',`<textarea id="f-note" rows="2" placeholder="optional">${esc(d.note||'')}</textarea>`);
  switch(type){
    case 'nurse':
      f+=time('Started');
      f+=`<div class="two">${fld('Left (min)',txt('f-l',d.l!=null?Math.round(d.l/60):'','numeric'))}${fld('Right (min)',txt('f-r',d.r!=null?Math.round(d.r/60):'','numeric'))}</div>`;
      f+=fldD('Ended on',seg('f-last',[['l','Left'],['r','Right']],d.last||'l'));f+=note();break;
    case 'bottle':{
      const ml=d.ml??S.prefs.ml;
      f+=time();
      f+=fldD('Amount (ml)',`<div class="stepper"><button type="button" data-act="step" data-t="f-ml" data-d="-10" aria-label="Less">−</button>${txt('f-ml',ml,'numeric')}<button type="button" data-act="step" data-t="f-ml" data-d="10" aria-label="More">+</button></div><div class="presets">${[60,90,120,150,180,210].map(v=>`<button type="button" class="chip" data-act="setv" data-t="f-ml" data-v="${v}">${v}</button>`).join('')}</div>`);
      f+=fldD('Milk',seg('f-kind',[['breastmilk','Breast milk'],['formula','Formula']],d.kind||S.prefs.kind));f+=note();break;}
    case 'sleep':
      f+=fld('Fell asleep',`<input id="f-start" type="datetime-local" value="${toInput(e.start)}">`)+ago('f-start',[15,30,60,90,120]);
      f+=fld('Woke up',`<input id="f-end" type="datetime-local" value="${toInput(e.end)}">`)+ago('f-end');f+=note();break;
    case 'diaper':
      f+=time();
      f+=`<div class="two">${fld('Temperature (°C)',txt('f-temp',d.temp??'','decimal','optional'))}${fld('Note',`<input id="f-note" type="text" value="${esc(d.note||'')}" placeholder="optional" autocomplete="off">`)}</div>`;
      if(isNew){f+=`<input type="hidden" id="f-kind" value="wet"><div class="big3"><button data-act="diaper-save" data-kind="wet">Wet</button><button data-act="diaper-save" data-kind="dirty">Dirty</button><button data-act="diaper-save" data-kind="both">Both</button></div>`;}
      else f+=fldD('Kind',seg('f-kind',[['wet','Wet'],['dirty','Dirty'],['both','Both'],['dry','Dry']],d.kind||'wet'));
      break;
    case 'solids':{
      const names=[...new Set(live().filter(x=>x.type==='solids').map(x=>x.data.food))];
      f+=time();
      f+=fld('Food',`<input id="f-food" list="foodlist" autocomplete="off" value="${esc(d.food||prefill||'')}" placeholder="What did the baby eat?"><datalist id="foodlist">${names.map(x=>`<option value="${esc(x)}">`).join('')}</datalist>`);
      f+=`<div class="two">${fld('Amount',txt('f-amt',d.amount??'','decimal','optional'))}${fldD('Unit',seg('f-unit',[['tsp','tsp'],['tbsp','tbsp'],['g','g']],d.unit||S.prefs.unit))}</div>`;
      f+=fldD('How it went',seg('f-react',[['loved','Loved it'],['ok','OK'],['refused','Refused']],d.reaction||'ok'));
      f+=fldD('Contains allergens',`<div class="chips wrap" id="f-alg">${ALLERGENS.map(a=>`<button type="button" class="chip ${(d.allergens||[]).includes(a)?'on':''}" data-act="tog" data-v="${esc(a)}">${esc(a)}</button>`).join('')}</div>`);
      f+=`<label class="check"><input type="checkbox" id="f-sym" ${d.symptoms?'checked':''}> Reaction such as rash, swelling or vomiting</label>`;
      f+=note();break;}
    case 'growth':
      f+=fld('Date',`<input id="f-date" type="date" value="${toDate(e.start)}">`);
      f+=`<div class="two">${fld('Weight (kg)',txt('f-kg',d.kg??'','decimal','e.g. 6.8'))}${fld('Length (cm)',txt('f-cm',d.cm??'','decimal','e.g. 64'))}</div>`;
      f+=fld('Head circumference (cm)',txt('f-head',d.head??'','decimal','optional'));f+=note();break;
    case 'other':{
      const labels=[...new Set(['Bath','Vitamin D','Medication: Paracetamol','Medication: Ibuprofen','Temperature','Tummy time',...live().filter(x=>x.type==='other').map(x=>x.data.label).filter(Boolean)])];
      f+=time();
      f+=fld('What',`<input id="f-label" list="otherlist" autocomplete="off" value="${esc(d.label||'')}" placeholder="e.g. Bath, Vitamin D, Paracetamol"><datalist id="otherlist">${labels.map(x=>`<option value="${esc(x)}">`).join('')}</datalist>`);
      f+=fld('Temperature (°C)',txt('f-temp',d.temp??'','decimal','optional'));
      f+=note();break;}
  }
  const saveBtn=(type==='diaper'&&isNew)?'':`<button class="btn primary" data-act="ed-save">Save</button>`;
  if(!isNew)f+=metaLine(e);
  f+=`<div class="foot">${isNew?'':'<button class="btn danger" data-act="ed-del">Delete</button>'}<button class="btn" data-act="close">Cancel</button>${saveBtn}</div>`;
  openSheet(f);
  const food=$('#f-food');
  if(food) food.addEventListener('change',()=>{
    const prev=live().find(x=>x.type==='solids'&&x.data.food&&x.data.food.toLowerCase()===food.value.trim().toLowerCase());
    if(prev&&!document.querySelector('#f-alg .on')) document.querySelectorAll('#f-alg .chip').forEach(c=>c.classList.toggle('on',(prev.data.allergens||[]).includes(c.dataset.v)));
  });
}
function readEditor(){
  const v=id=>{const el=$('#'+id);return el?el.value:'';};
  const e=ed,d={};let start=fromInput(v('f-start')),end;
  switch(e.type){
    case 'nurse':{
      const keep=(k,input)=>{const x=num(input);if(!(x>=0))return 0;const o=e.data&&e.data[k];return o!=null&&Math.round(o/60)===Math.round(x)?o:Math.round(x*60);};
      d.l=keep('l',v('f-l'));d.r=keep('r',v('f-r'));d.last=v('f-last')||'l';
      if(!d.l&&!d.r) throw 'Enter minutes for at least one side.';
      end=start+(d.l+d.r)*1000;break;}
    case 'bottle': d.ml=Math.round(num(v('f-ml')));if(!(d.ml>0)) throw 'Enter an amount in ml.';d.kind=v('f-kind');S.prefs.ml=d.ml;S.prefs.kind=d.kind;break;
    case 'sleep': end=fromInput(v('f-end'));if(!(end>start)) throw 'Wake-up time must be after the start.';if(end-start>24*36e5) throw 'That sleep is over 24 hours. Check the dates.';
      if(end>Date.now()+5*6e4) throw 'Wake-up time is in the future.';break;
    case 'diaper': d.kind=v('f-kind')||'wet';readTemp(v,d);break;
    case 'other': d.label=v('f-label').trim();if(!d.label) throw 'Enter what happened, for example Bath.';readTemp(v,d);break;
    case 'solids':{
      d.food=v('f-food').trim();if(!d.food) throw 'Enter the food.';
      const a=num(v('f-amt'));if(a>0)d.amount=a;d.unit=v('f-unit');d.reaction=v('f-react');
      d.allergens=[...document.querySelectorAll('#f-alg .on')].map(b=>b.dataset.v);
      d.symptoms=$('#f-sym').checked;S.prefs.unit=d.unit;break;}
    case 'growth':{
      start=fromInput(v('f-date'));
      const kg=num(v('f-kg')),cm=num(v('f-cm')),hd=num(v('f-head'));
      if(kg>0){if(kg<1||kg>30) throw 'Weight should be in kg, for example 6.8.';d.kg=kg;}
      if(cm>0){if(cm<35||cm>120) throw 'Length should be in cm, for example 64.';d.cm=cm;}
      if(hd>0){if(hd<25||hd>60) throw 'Head circumference should be in cm, for example 41.';d.head=hd;}
      if(!Object.keys(d).length) throw 'Enter at least one measurement.';break;}
  }
  const nt=v('f-note').trim();if(nt)d.note=nt;
  if(isNaN(start)) throw 'Enter a valid date and time.';
  if(start>Date.now()+5*6e4) throw 'That time is in the future.';
  return {start,end,data:d};
}
function readTemp(v,d){const raw=v('f-temp').trim();if(raw==='')return;const x=num(raw);if(!(x>=34&&x<=42)) throw 'Temperature should be in °C, between 34 and 42.';d.temp=x;}
function saveEditor(){
  try{
    const r=readEditor(),wasNew=ed._new,e={...ed,start:r.start,data:r.data};
    delete e._new;if(r.end!=null)e.end=r.end;else delete e.end;if(!e.id)e.id=uid();
    upsert(e);closeSheet();render();
    toast(wasNew?`${LABEL[e.type]} saved`:'Changes saved',wasNew?()=>removeEv(e.id):null);
  }catch(err){toast(typeof err==='string'?err:'Could not save this entry.');}
}

function openChooser(){
  const T=[['nurse','Nursing',I.drop,'feed'],['bottle','Bottle',I.bottle,'feed'],['sleep','Sleep',I.moon,'sleep'],['diaper','Diaper',I.diaper,'diaper'],['solids','Solids',I.spoon,'solids'],['growth','Measurement',I.growth,'growth'],['other','Other',I.note,'other']];
  openSheet(`<h2>Add an earlier entry</h2><div class="chooser">${T.map(([t,l,svg,c])=>`<button class="act c-${c}" data-act="new" data-type="${t}">${svg}<span>${l}</span></button>`).join('')}</div><div class="foot"><button class="btn" data-act="close">Cancel</button></div>`);
}

function openSettings(welcome){
  const st=S.settings,n=S.events.filter(e=>!e.deleted).length;
  let kb=0;try{kb=Math.round(JSON.stringify(S).length/1024);}catch(e){}
  let f=`<h2>${welcome?'Welcome to Yupu baby':'Settings'}</h2>`;
  if(welcome) f+=`<p class="muted" style="margin-bottom:14px">Everything you log stays on this phone. You can change these details later.</p>`;
  f+=`<div class="set-sec">Baby</div>${fld('Name',`<input id="s-name" value="${esc(st.name)}" autocomplete="off">`)}${fld('Date of birth',`<input id="s-dob" type="date" value="${esc(st.dob)}">`)}${fldD('Sex, for the WHO growth curves',seg('s-sex',[['f','Girl'],['m','Boy']],st.sex))}`;
  if(welcome) f+=`<div class="two">${fld('Birth weight (kg)',txt('s-bkg','','decimal','optional'))}${fld('Birth length (cm)',txt('s-bcm','','decimal','optional'))}</div>${fld('Birth head circumference (cm)',txt('s-bhead','','decimal','optional'))}`;
  f+=`<div class="set-sec">This phone</div>${fld('Your name on this phone',`<input id="s-dev" value="${esc(st.device)}" placeholder="e.g. Dad" autocomplete="off">`)}<p class="muted" style="margin:-6px 2px 12px">Shown on entries after you merge with your partner's phone.</p>${fldD('Language',seg('s-lang',[['en','English'],['de','Deutsch']],st.lang||'en'))}${fldD('Appearance',seg('s-theme',[['auto','Auto'],['light','Light'],['dark','Dark']],st.theme||'auto'))}${fldD('Text size',seg('s-text',[['m','Standard'],['l','Large'],['xl','Larger']],st.textSize||'m'))}${fldD('Night light (red, bigger buttons)',seg('s-nauto',[['off','Moon button only'],['on','On a schedule']],st.nightAuto?'on':'off'))}<div class="two">${fld('From',`<input id="s-nfrom" type="time" value="${esc(st.nightFrom||'21:00')}">`)}${fld('Until',`<input id="s-nto" type="time" value="${esc(st.nightTo||'07:00')}">`)}</div>`;
  f+=`<button class="btn primary" style="width:100%" data-act="set-save">${welcome?'Start':'Save'}</button>`;
  if(!welcome){
    const sy=S.sync;
    f+=`<div class="set-sec">Automatic sync</div>`;
    if(sy.on){
      f+=`<div class="syncbox ${sy.err?'err':''}"><span id="syncStatus">${esc(syncStatus())}</span><button class="btn small" data-act="sync-auto">Sync now</button></div>
        <p class="muted" style="margin-bottom:10px">Repository ${esc(sy.repo)}, token ending …${esc(sy.token.slice(-4))}. Syncs when the app opens, after each entry and every 30 seconds while open. Running sleep and feed timers show on both phones, and either phone can stop them.</p>
        <div class="stack"><button class="btn small" data-act="restore-points">Restore points</button><button class="btn small" data-act="sync-off">Turn off or change token</button></div>`;
    } else {
      f+=`<p class="muted" style="margin-bottom:10px">Keeps both phones in step through your private GitHub repository. Logging still works offline.</p>
        ${fld('Repository',`<input id="s-repo" value="${esc(sy.repo)}" placeholder="username/my-app-data" autocomplete="off" autocapitalize="off" spellcheck="false">`)}
        ${fld('Access token for this phone',`<input id="s-token" type="password" placeholder="github_pat_…" autocomplete="off" autocapitalize="off" spellcheck="false">`)}
        <button class="btn primary" style="width:100%" data-act="sync-on">Test and turn on</button>
        <p class="muted" style="margin:10px 2px 0">The token is kept only on this phone, in the app's own storage, and is sent only to GitHub. Give it access to the one data repository and nothing else. Turning sync off removes it from the phone.</p>`;
    }
    if(nativeOn()){
      f+=`<div class="set-sec">Reminders</div>${fldD('Vitamin D, if not logged by 9pm',seg('s-remind',[['off','Off'],['on','On']],st.remind?'on':'off'))}
        <p class="muted" style="margin:-6px 2px 12px">A notification from this phone only, once a day, cleared automatically once it's logged.</p>`;
    }
    f+=`<div class="set-sec">Data</div><div class="stack"><button class="btn small" data-act="health">Check data</button><button class="btn small" data-act="deleted">Recently deleted</button></div>`;
    f+=`<div class="set-sec">Backup files</div>
      <p class="muted" style="margin-bottom:10px">${S.lastBackup?`Last backup ${dateStr(S.lastBackup)}.`:'No backup yet.'} Import also reads Nara Baby CSV exports.</p>
      <div class="stack"><button class="btn small" data-act="backup">Back up to Files</button><button class="btn small" data-act="import">Import backup or Nara CSV</button><button class="btn small" data-act="csv">Export as spreadsheet (CSV)</button></div>
      <div class="set-sec">Storage</div><p class="muted">${n} entries, about ${kb} KB on this phone, ${storeMode==='idb'?'saved in IndexedDB':'saved in browser storage (IndexedDB unavailable)'}.</p>
      <button class="link" style="margin:14px 0 0;color:var(--danger)" data-act="wipe">Delete all data on this phone</button>
      <p class="muted" style="text-align:center;margin-top:22px;font-size:12px">Yupu baby v${APP_VERSION}, ${dateStr(fromInput(APP_DATE))}</p>`;
  }

  openSheet(f);
}
// First run: three short steps in one sheet. All fields stay in the DOM, so saveSettings reads them as usual.
function openWelcome(){
  const st=S.settings,dots=n=>`<div class="ob-dots" aria-hidden="true">${[1,2,3].map(i=>`<i class="${i===n?'on':''}"></i>`).join('')}</div>`;
  openSheet(`<div class="ob" data-step="1">
    <section class="ob-s" data-s="1">${dots(1)}<h2>Welcome to Yupu baby</h2><p class="muted" style="margin-bottom:14px">A calm, private log for feeds, sleep and diapers. First, who are you tracking?</p>
      ${fld('Baby\'s name',`<input id="s-name" value="${esc(st.name)}" autocomplete="off">`)}${fld('Date of birth',`<input id="s-dob" type="date" value="${esc(st.dob)}">`)}${fldD('Sex, for the WHO growth curves',seg('s-sex',[['f','Girl'],['m','Boy']],st.sex))}
      <details class="ob-more"><summary>Birth measurements (optional)</summary><div class="two">${fld('Birth weight (kg)',txt('s-bkg','','decimal','optional'))}${fld('Birth length (cm)',txt('s-bcm','','decimal','optional'))}</div>${fld('Birth head circumference (cm)',txt('s-bhead','','decimal','optional'))}</details>
      <div class="foot"><button class="btn primary" data-act="ob-step" data-n="2">Next</button></div></section>
    <section class="ob-s" data-s="2">${dots(2)}<h2>This phone</h2><p class="muted" style="margin-bottom:14px">If you and a partner both log, each phone gets a name so you can see who logged what.</p>
      ${fld('Your name on this phone',`<input id="s-dev" value="${esc(st.device)}" placeholder="e.g. Dad" autocomplete="off">`)}${fldD('Language',seg('s-lang',[['en','English'],['de','Deutsch']],st.lang||'en'))}${fldD('Text size',seg('s-text',[['m','Standard'],['l','Large'],['xl','Larger']],st.textSize||'m'))}
      <div class="foot"><button class="btn" data-act="ob-step" data-n="1">Back</button><button class="btn primary" data-act="ob-step" data-n="3">Next</button></div></section>
    <section class="ob-s" data-s="3">${dots(3)}<h2>Your data stays yours</h2>
      <ul class="ob-list"><li>${I.moon}<span><b>Works offline</b>Everything is saved on this phone. Nothing is sent anywhere unless you turn on sync.</span></li>
      <li>${I.list}<span><b>Two phones, one log</b>Automatic sync keeps both parents in step through your own private repository.</span></li>
      <li>${I.checks}<span><b>Keep a copy</b>iPhone can clear web app data in rare cases. Back up to Files now and then, or turn on sync.</span></li></ul>
      <div class="foot"><button class="btn" data-act="ob-step" data-n="2">Back</button><button class="btn primary" data-act="set-save">Start logging</button></div>
      <button class="link" data-act="ob-sync">Start and set up sync</button></section></div>`);
}
function saveSettings(){
  const st=S.settings,v=id=>{const el=$('#'+id);return el?el.value.trim():'';};
  const name=v('s-name'),dob=v('s-dob'),sex=v('s-sex');
  if(dob&&fromInput(dob)>Date.now()) return toast('Date of birth is in the future.');
  if(name!==st.name||dob!==st.dob||sex!==st.sex){st.name=name;st.dob=dob;st.sex=sex;st.updatedAt=Date.now();markDirty('profile');}
  st.device=v('s-dev');st.theme=v('s-theme')||'auto';st.textSize=v('s-text')||st.textSize||'m';st.lang=v('s-lang')||st.lang||'en';const sf=$('#s-syncfolder');if(sf)st.syncFolder=sf.value.trim();
  const rm=$('#s-remind');if(rm)st.remind=rm.value==='on';
  const na=$('#s-nauto');if(na){st.nightAuto=na.value==='on';st.nightFrom=v('s-nfrom')||'21:00';st.nightTo=v('s-nto')||'07:00';st.nightSkipUntil=0;}
  if($('#s-bkg')&&dob){const kg=num(v('s-bkg')),cm=num(v('s-bcm')),hd=num(v('s-bhead')),d={};
    if(kg>0.5&&kg<7)d.kg=kg;if(cm>30&&cm<65)d.cm=cm;if(hd>20&&hd<45)d.head=hd;
    if(Object.keys(d).length) upsert({id:uid(),type:'growth',start:fromInput(dob),data:d});}
  save();applyTheme();closeSheet();render();toast('Settings saved');refreshVitReminder();
}

/* ---------- backup ---------- */
async function shareFile(name,text,mime){
  const file=new File([text],name,{type:mime});
  try{if(navigator.canShare&&navigator.canShare({files:[file]})){await navigator.share({files:[file],title:name});return true;}}
  catch(e){if(e&&e.name==='AbortError')return false;}
  const url=URL.createObjectURL(file),a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),5000);return true;
}
async function doBackup(silent){
  const st=S.settings,obj={app:'yupu',version:1,exportedAt:Date.now(),device:st.device,settings:{name:st.name,dob:st.dob,sex:st.sex,updatedAt:st.updatedAt},events:S.events};
  const nm=`yupu-backup-${stamp()}${st.device?'-'+st.device.replace(/[^\w-]+/g,''):''}.json`;
  const ok=await shareFile(nm,JSON.stringify(obj),'application/json');
  if(ok){S.lastBackup=Date.now();save();if(tab==='today'&&!sheetOpen())render();if(!silent)toast('Backup ready');}
  return ok;
}
async function syncNow(){
  const ok=await doBackup(true);
  const folder=S.settings.syncFolder?` in ${S.settings.syncFolder}`:'';
  if(ok) toast(`Backup saved${folder}. Tap Import to pick up your partner's file.`,()=>{$('#importFile').click();},'Import',true);
  else toast('Tap Import to pick up your partner\'s file whenever you\'re ready.',()=>{$('#importFile').click();},'Import',true);
}
function mergeIn(obj){
  if(!obj||(obj.app!=='yupu'&&obj.app!=='nest')||!Array.isArray(obj.events)) throw new Error('This file is not a Yupu baby backup.');
  const map=new Map(S.events.map(e=>[e.id,e]));let added=0,updated=0,dupes=0;
  // Entries imported from Nara get checked against what was already logged here, so days logged in both apps don't double up.
  const near={};S.events.forEach(e=>{if(!e.deleted&&!String(e.id).startsWith('nara-'))(near[e.type]=near[e.type]||[]).push(e.start);});
  const isDupe=e=>String(e.id).startsWith('nara-')&&(near[e.type]||[]).some(s=>Math.abs(s-e.start)<=5*6e4);
  for(const e of obj.events){
    if(!e||!e.id||!e.type) continue;const cur=map.get(e.id);
    if(!cur){if(!e.deleted&&isDupe(e)){dupes++;continue;}map.set(e.id,e);markDirty(monthKey(e.start));if(!e.deleted)added++;}
    else if((e.updatedAt||0)>(cur.updatedAt||0)){map.set(e.id,e);markDirty(monthKey(e.start),monthKey(cur.start));updated++;}
  }
  S.events=[...map.values()];
  if(obj.settings&&(obj.settings.updatedAt||0)>(S.settings.updatedAt||0)){const s=obj.settings;Object.assign(S.settings,{name:s.name||'',dob:s.dob||'',sex:s.sex||'',updatedAt:s.updatedAt});markDirty('profile');}
  S.lastImport=Date.now();save();return {added,updated,dupes};
}
/* ---------- Nara Baby CSV import ---------- */
function parseCSV(text){
  const rows=[];let row=[],f='',q=false;
  for(let i=0;i<text.length;i++){const c=text[i];
    if(q){if(c==='"'){if(text[i+1]==='"'){f+='"';i++;}else q=false;}else f+=c;}
    else if(c==='"')q=true;else if(c===','){row.push(f);f='';}
    else if(c==='\n'||c==='\r'){if(c==='\r'&&text[i+1]==='\n')i++;row.push(f);rows.push(row);row=[];f='';}
    else f+=c;}
  if(f||row.length){row.push(f);rows.push(row);}
  return rows;
}
function naraToBackup(text){
  const rows=parseCSV(text.replace(/^\ufeff/,'')),H=rows.shift()||[];
  if(!H.includes('_activityKey')||!H.includes('[Breastfeed] Begin Side')) throw new Error('Not a Nara export');
  const ix={};H.forEach((h,i)=>ix[h]=i);
  const TEMP=/(^|[^\d.,])(3[4-9]|4[0-2])(?:[.,](\d{1,2}))?(?![\d%.,]|\s*(?:ml|g|min|%))/i;
  const vol=(v,u)=>{const x=+v||0;return Math.round(/oz/i.test(u||'')?x*29.57:x);};
  const events=[];let profile=null;
  for(const r of rows){
    const g=k=>(r[ix[k]]??'').trim(),type=g('Type');
    if(g('[Profile] Birth Date')) profile={name:g('Profile Name'),dob:g('[Profile] Birth Date'),sex:g('[Profile] Sex')==='FEMALE'?'f':g('[Profile] Sex')==='MALE'?'m':''};
    const key=g('_activityKey'),start=+g('Start Date/time (Epoch)');
    if(!type||!key||!start) continue;
    const d={},e={id:'nara-'+key,start,data:d,by:'',updatedAt:1};let note=g('Note');
    const takeTemp=()=>{const m=TEMP.exec(note);if(m){d.temp=+(m[2]+'.'+(m[3]||'0'));note=note.replace(m[0],m[1]).replace(/\s+/g,' ').trim();}};
    switch(type){
      case 'Breastfeed':{e.type='nurse';d.l=+g('[Breastfeed] Left Duration (Seconds)')||0;d.r=+g('[Breastfeed] Right Duration (Seconds)')||0;
        const s=(g('[Breastfeed] End Side')||g('[Breastfeed] Begin Side')).split('.')[0];d.last=s==='RIGHT'?'r':'l';e.end=start+(d.l+d.r)*1000;break;}
      case 'Bottle Feed':{e.type='bottle';d.kind=g('[Bottle Feed] Type')==='Formula'?'formula':'breastmilk';
        d.ml=vol(g('[Bottle Feed] Breast Milk Volume'),g('[Bottle Feed] Breast Milk Volume Unit'))+vol(g('[Bottle Feed] Formula Volume'),g('[Bottle Feed] Formula Volume Unit'))||vol(g('[Bottle Feed] Volume'),g('[Bottle Feed] Volume Unit'));break;}
      case 'Sleep':{e.type='sleep';e.end=+g('[Sleep] End Date/time (Epoch)')||start+(+g('[Sleep] Duration (Seconds)')||0)*1000;if(!(e.end>start))continue;break;}
      case 'Diaper':{e.type='diaper';const k=g('[Diaper] Type');d.kind=k==='Dirty Wet'?'both':k==='Dirty'?'dirty':k==='Dry'?'dry':'wet';takeTemp();
        const TX={RUN:'runny',MUCOUS:'mucousy',MUSH:'mushy',PEBBLE:'pebbly'},x=[];
        if(g('[Diaper] Detail'))x.push(g('[Diaper] Detail').toLowerCase().split(/\s+/).join(', '));
        if(g('[Diaper] Dirty Color'))x.push('stool '+g('[Diaper] Dirty Color').toLowerCase());
        if(g('[Diaper] Dirty Texture'))x.push(g('[Diaper] Dirty Texture').split(/\s+/).map(w=>TX[w]||w.toLowerCase()).join(' and '));
        if(note)x.push(note);note=x.join(', ');break;}
      case 'Growth':{e.type='growth';const dt=new Date(start);dt.setHours(12,0,0,0);e.start=dt.getTime();
        const w=+g('[Growth] Weight'),h=+g('[Growth] Height'),hd=+g('[Growth] Head Size');
        if(w)d.kg=/lb/i.test(g('[Growth] Weight Unit'))?Math.round(w*453.6)/1000:w;
        if(h)d.cm=/in/i.test(g('[Growth] Height Unit'))?Math.round(h*25.4)/10:h;
        if(hd)d.head=/in/i.test(g('[Growth] Head Size Unit'))?Math.round(hd*25.4)/10:hd;
        if(!d.kg&&!d.cm&&!d.head)continue;break;}
      case 'Medical':{e.type='other';const med=g('[Medical] Medication');d.label=med?'Medication: '+med:'Medical';
        const t=+g('[Medical] Temperature');if(t)d.temp=/f/i.test(g('[Medical] Temperature Unit'))?Math.round((t-32)/1.8*10)/10:t;else takeTemp();break;}
      case 'Vaccine':{e.type='other';const v=g('[Vaccine] Vaccine').split(/\n+/).map(s=>s.trim()).filter(Boolean).join(', ');d.label=v?'Vaccine: '+v:'Vaccine';break;}
      case 'Routine':{e.type='other';d.label=g('[Routine] Routine')||'Routine';break;}
      case 'Pump':{e.type='other';d.label='Pumping';const x=[],l=g('[Pump] Left Volume'),rr=g('[Pump] Right Volume'),tv=g('[Pump] Total Volume'),s=+g('[Pump] Duration (Seconds)');
        if(l)x.push(`left ${vol(l,g('[Pump] Left Volume Unit'))} ml`);if(rr)x.push(`right ${vol(rr,g('[Pump] Right Volume Unit'))} ml`);if(tv&&!l&&!rr)x.push(`${vol(tv,g('[Pump] Total Volume Unit'))} ml`);if(s)x.push(`${Math.round(s/60)} min`);
        if(note)x.push(note);note=x.join(', ');break;}
      default:{e.type='other';d.label=type;}
    }
    if(note)d.note=note;
    events.push(e);
  }
  if(!S.settings.dob&&profile) Object.assign(S.settings,{name:S.settings.name||profile.name,dob:profile.dob,sex:S.settings.sex||profile.sex});
  return {app:'yupu',version:1,exportedAt:Date.now(),events};
}
function toCSV(){
  const rows=[['type','start','end','minutes','details','logged_by']];
  for(const e of live().reverse()){const d=describe(e);rows.push([LABEL[e.type],toInput(e.start).replace('T',' '),e.end?toInput(e.end).replace('T',' '):'',e.end?Math.round((e.end-e.start)/6e4):'',d.title+(d.detail?': '+d.detail:'')+(d.right&&!e.end?' '+d.right:''),e.by||'']);}
  return '\ufeff'+rows.map(r=>r.map(c=>`"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
}

/* ---------- automatic sync via a private GitHub repository ---------- */
// Each month of entries is one file (yupu/2026-09.json) plus yupu/profile.json.
// Pull: list the folder, fetch only files whose version changed, merge by id + updatedAt.
// Push: rewrite only months changed on this phone, with the file's version as a lock; on a clash, re-pull and retry.
const APP_VERSION='3.2.1',APP_DATE='2026-10-22',SYNC_DIR='yupu';
const monthKey=ts=>{const d=new Date(ts);return d.getFullYear()+'-'+pad(d.getMonth()+1);};
let syncing=false,syncTimer=null,syncAgain=false;
function markDirty(...keys){if(!S.sync)return;S.sync.dirty=S.sync.dirty||{};keys.forEach(k=>{if(k)S.sync.dirty[k]=1;});scheduleSync();}
function scheduleSync(ms=15000){if(!S.sync||!S.sync.on)return;clearTimeout(syncTimer);syncTimer=setTimeout(()=>autoSync(),ms);}
function normRepo(v){return String(v||'').trim().replace(/^https?:\/\/github\.com\//i,'').replace(/\.git$/,'').replace(/^\/+|\/+$/g,'');}
async function gh(path,{method='GET',body,accept,repo,token}={}){
  const s=S.sync;
  return fetch('https://api.github.com/repos/'+(repo||s.repo)+path,{method,cache:'no-store',body,
    headers:{'Authorization':'Bearer '+(token||s.token),'Accept':accept||'application/vnd.github+json',...(body?{'Content-Type':'application/json'}:{})}});
}
function b64enc(str){const b=new TextEncoder().encode(str);let s='';for(let i=0;i<b.length;i+=0x8000)s+=String.fromCharCode.apply(null,b.subarray(i,i+0x8000));return btoa(s);}
function syncErrText(st){
  if(st===401) return 'GitHub rejected the token. It may have expired: turn sync off and on with a new token.';
  if(st===403) return 'The token is missing write access (Contents: Read and write), or GitHub is limiting requests.';
  if(st===404) return 'Repository not found, or this token has no access to it.';
  if(st==='conflict') return 'Both phones were syncing at once. Will retry shortly.';
  if(st==='net') return 'Could not reach GitHub. Will retry when online.';
  return 'GitHub error '+st+'. Will retry.';
}
function agoText(ts){const m=Math.round((Date.now()-ts)/6e4);return m<1?'just now':m<60?`${m} min ago`:dur(Date.now()-ts)+' ago';}
function syncStatus(){const s=S.sync;if(!s.on)return 'Off';if(syncing)return 'Syncing…';if(s.err)return s.err;if(!navigator.onLine)return 'Offline. Will sync when online.';return s.last?`Synced ${agoText(s.last)}`:'Waiting for first sync';}
function setSyncUI(){const el=$('#syncStatus');if(el){el.textContent=tr(syncStatus());el.closest('.syncbox')?.classList.toggle('err',!!S.sync.err);}$('#gearBtn').classList.toggle('alert',!!(S.sync.on&&S.sync.err));}
function monthFile(k){return JSON.stringify({app:'yupu',kind:'month',month:k,events:S.events.filter(e=>monthKey(e.start)===k).sort((a,b)=>a.start-b.start||(a.id<b.id?-1:1))});}
function activeFile(){const u=S.activeUpd||{};return JSON.stringify({app:'yupu',kind:'active',nurse:{v:S.active.nurse,upd:u.nurse||0},sleep:{v:S.active.sleep,upd:u.sleep||0}});}
function profileFile(){const st=S.settings;return JSON.stringify({app:'yupu',kind:'profile',settings:{name:st.name,dob:st.dob,sex:st.sex,updatedAt:st.updatedAt}});}
function mergeRemote(obj){
  if(!obj||obj.app!=='yupu')return false;let ch=false;
  if(obj.kind==='active'){
    S.activeUpd=S.activeUpd||{nurse:0,sleep:0};
    for(const k of ['nurse','sleep']){const r=obj[k];if(r&&(r.upd||0)>(S.activeUpd[k]||0)){S.active[k]=r.v||null;S.activeUpd[k]=r.upd;ch=true;}}
    return ch;
  }
  if(obj.kind==='profile'){const r=obj.settings||{};if((r.updatedAt||0)>(S.settings.updatedAt||0)){Object.assign(S.settings,{name:r.name||'',dob:r.dob||'',sex:r.sex||'',updatedAt:r.updatedAt});ch=true;}return ch;}
  const idx=new Map(S.events.map((e,i)=>[e.id,i]));
  for(const e of obj.events||[]){
    if(!e||!e.id||!e.type)continue;const i=idx.get(e.id);
    if(i==null){S.events.push(e);idx.set(e.id,S.events.length-1);ch=true;}
    else if((e.updatedAt||0)>(S.events[i].updatedAt||0)){const old=S.events[i];S.events[i]=e;ch=true;if(monthKey(old.start)!==monthKey(e.start))S.sync.dirty[monthKey(old.start)]=1;}
  }
  return ch;
}
async function autoSync(){
  const s=S.sync;if(!s.on||!s.repo||!s.token)return;
  if(syncing){syncAgain=true;return;}
  if(!navigator.onLine){setSyncUI();return;}
  syncing=true;setSyncUI();let changed=false;
  try{
    for(let attempt=0;;attempt++){
      const lr=await gh('/contents/'+SYNC_DIR);let list=[];
      if(lr.status===404){const rr=await gh('');if(!rr.ok)throw rr.status;}
      else if(!lr.ok) throw lr.status;
      else list=(await lr.json()).filter(f=>f.type==='file'&&/\.json$/.test(f.name));
      const remote={};list.forEach(f=>remote[f.name]=f.sha);
      for(const f of list){
        if(s.shas[f.name]===f.sha)continue;
        const fr=await gh('/contents/'+SYNC_DIR+'/'+f.name,{accept:'application/vnd.github.raw+json'});
        if(!fr.ok)throw fr.status;
        try{if(mergeRemote(JSON.parse(await fr.text())))changed=true;}catch(e){}
        s.shas[f.name]=f.sha;
      }
      save();
      let clash=false;
      for(const k of Object.keys(s.dirty||{})){
        const name=k+'.json';
        if(k!=='profile'&&k!=='active'&&!remote[name]&&!S.events.some(e=>monthKey(e.start)===k)){delete s.dirty[k];continue;}
        const pr=await gh('/contents/'+SYNC_DIR+'/'+name,{method:'PUT',body:JSON.stringify({message:`${S.settings.device||'Yupu baby'}: ${k}`,content:b64enc(k==='profile'?profileFile():k==='active'?activeFile():monthFile(k)),...(remote[name]?{sha:remote[name]}:{})})});
        if(pr.status===409||pr.status===422){clash=true;break;}
        if(!pr.ok)throw pr.status;
        const j=await pr.json();s.shas[name]=remote[name]=j.content.sha;delete s.dirty[k];save();
      }
      if(!clash)break;
      if(attempt>=3)throw 'conflict';
      await new Promise(r=>setTimeout(r,800+Math.random()*1200));
    }
    s.last=Date.now();s.err='';
    await maybeSnapshot();
  }catch(e){s.err=syncErrText(e instanceof TypeError?'net':e);}
  finally{
    syncing=false;save();
    if(changed&&!sheetOpen())render();
    setSyncUI();
    if(syncAgain){syncAgain=false;scheduleSync(2000);}
  }
}
/* Monthly restore point: the first successful sync of each month writes the full log to
   yupu/snapshots/YYYY-MM.json. If the other phone already wrote it, GitHub refuses the
   second copy and that counts as done. Restoring brings back entries that are missing or
   were deleted on this phone; entries edited since then are left as they are. */
async function maybeSnapshot(){
  const s=S.sync,mk=monthKey(Date.now());
  if(!s.on||s.lastSnap===mk||!S.events.length)return;
  try{
    const st=S.settings,body={app:'yupu',kind:'snapshot',month:mk,takenAt:Date.now(),by:st.device||'',settings:{name:st.name,dob:st.dob,sex:st.sex,updatedAt:st.updatedAt},events:S.events};
    const r=await gh(`/contents/${SYNC_DIR}/snapshots/${mk}.json`,{method:'PUT',body:JSON.stringify({message:`Restore point ${mk}`,content:b64enc(JSON.stringify(body))})});
    if(r.ok||r.status===422||r.status===409){s.lastSnap=mk;save();}
  }catch(e){}
}
async function openRestorePoints(){
  openSheet(`<h2>Restore points</h2><p class="muted" id="rp-msg">Loading from your sync repository…</p><div class="stack" id="rp-list"></div><div class="foot"><button class="btn" data-act="close">Close</button></div>`);
  let list=[];
  try{const r=await gh(`/contents/${SYNC_DIR}/snapshots`);if(r.ok)list=(await r.json()).filter(f=>/^\d{4}-\d{2}\.json$/.test(f.name)).map(f=>f.name.slice(0,7)).sort().reverse();
    else if(r.status!==404)throw r.status;}
  catch(e){const m=$('#rp-msg');if(m)m.textContent=tr('Could not reach GitHub. Try again when online.');return;}
  const m=$('#rp-msg'),box=$('#rp-list');if(!m||!box)return;
  if(!list.length){m.textContent=tr('No restore point yet. The first one is saved automatically with the next sync.');return;}
  m.textContent=tr('Saved at the start of each month. Restoring brings back entries that are missing or were deleted since then. Entries edited since then stay as they are.');
  translateDom($('#sheet'));box.innerHTML=list.map(k=>`<button class="btn small" data-act="rp-pick" data-k="${k}">${new Date(+k.slice(0,4),+k.slice(5)-1,1).toLocaleDateString(LOC(),{month:'long',year:'numeric'})}</button>`).join('');
}
async function restoreFrom(k){
  let snap;
  try{const r=await gh(`/contents/${SYNC_DIR}/snapshots/${k}.json`,{accept:'application/vnd.github.raw+json'});if(!r.ok)throw r.status;snap=JSON.parse(await r.text());}
  catch(e){return toast('Could not load that restore point.');}
  const map=new Map(S.events.map((e,i)=>[e.id,i])),bring=[];
  for(const e of snap.events||[]){if(!e||!e.id||e.deleted)continue;const i=map.get(e.id);if(i==null||S.events[i].deleted)bring.push(e);}
  if(!bring.length)return toast('Nothing to bring back. Every entry from then is still here.');
  if(!confirm(tr(`Bring back ${bring.length} ${bring.length===1?'entry':'entries'} from this restore point?`)))return;
  const now=Date.now();
  for(const e of bring){const ne={...e,updatedAt:now};const i=map.get(e.id);if(i==null)S.events.push(ne);else S.events[i]=ne;markDirty(monthKey(e.start));}
  save();closeSheet();render();toast(`${bring.length} ${bring.length===1?'entry':'entries'} restored`);
}
async function syncTurnOn(){
  const repo=normRepo($('#s-repo').value),token=$('#s-token').value.trim();
  if(!/^[\w.-]+\/[\w.-]+$/.test(repo))return toast('Enter the repository as username/repository-name.');
  if(!token)return toast('Paste the access token.');
  toast('Checking connection…');
  let r;try{r=await gh('',{repo,token});}catch(e){return toast('Could not reach GitHub. Check the internet connection.');}
  if(r.status===401)return toast('GitHub rejected this token. Check it was copied completely.');
  if(!r.ok)return toast('Repository not found, or the token has no access to it.');
  const info=await r.json();
  if(!info.private)return toast('That repository is public. Use a private one for your baby\'s data.');
  Object.assign(S.sync,{repo,token,on:true,err:'',shas:{},dirty:{}});
  const months=new Set(S.events.map(e=>monthKey(e.start)));months.forEach(k=>S.sync.dirty[k]=1);
  if(S.settings.dob)S.sync.dirty.profile=1;
  S.sync.dirty.active=1;
  save();openSettings(false);toast('Sync is on. First sync running…');autoSync();
}
function syncTurnOff(){
  if(!confirm(tr('Turn off automatic sync on this phone? Your entries stay on the phone, and the token is removed from it.')))return;
  Object.assign(S.sync,{on:false,token:'',err:'',shas:{},dirty:{}});save();setSyncUI();openSettings(false);toast('Sync turned off');
}

/* ---------- timer start adjustments ---------- */
// Long-press on Left, Right or Sleep: start the timer a few minutes back.
function openStartEarlier(kind,side){
  const what=kind==='sleep'?'Fell asleep':side==='l'?'Started on the left':'Started on the right';
  openSheet(`<h2>${what}</h2><div class="presets ago">${[2,5,10,15,20,30,45].map(m=>`<button class="chip" data-act="start-ago" data-k="${kind}" data-side="${side||''}" data-m="${m}">${m} min ago</button>`).join('')}</div>
    ${fld('Or at',`<input id="start-at" type="datetime-local" value="${toInput(Date.now())}">`)}
    <div class="foot"><button class="btn" data-act="close">Cancel</button><button class="btn primary" data-act="start-at" data-k="${kind}" data-side="${side||''}">Start</button></div>`);
}
function startAt(kind,side,ts){
  const n=Date.now();
  if(isNaN(ts))return toast('Enter a valid time.'),false;
  if(ts>n+6e4)return toast('The start cannot be in the future.'),false;
  if(n-ts>24*36e5)return toast('That is more than 24 hours ago.'),false;
  if(S.active[kind])return toast(kind==='sleep'?'A sleep is already running.':'A feed is already running.'),false;
  const by=S.settings.device||'';
  S.active[kind]=kind==='sleep'?{id:uid(),start:ts,by}:{id:uid(),start:ts,by,segs:[{side,from:ts,to:null}]};
  S.prefs.held=1;touchActive(kind);save();closeSheet();render();haptic('Medium');
  toast(`${kind==='sleep'?'Sleep':'Feed'} started at ${hm(ts)}`,()=>{S.active[kind]=null;touchActive(kind);save();});
  return true;
}
(function(){
  let t=null,held=false,x0=0,y0=0;
  const cancel=()=>{clearTimeout(t);t=null;};
  document.addEventListener('pointerdown',e=>{
    const b=e.target.closest('#main .act[data-act="sleep-start"],#main .act[data-act="nurse-side"]');held=false;if(!b||(b.dataset.act==='nurse-side'&&S.active.nurse))return;
    x0=e.clientX;y0=e.clientY;cancel();
    t=setTimeout(()=>{t=null;held=true;haptic('Medium');openStartEarlier(b.dataset.act==='sleep-start'?'sleep':'nurse',b.dataset.side);},480);
  });
  document.addEventListener('pointermove',e=>{if(t&&Math.hypot(e.clientX-x0,e.clientY-y0)>10)cancel();});
  ['pointerup','pointercancel'].forEach(k=>document.addEventListener(k,cancel));
  document.addEventListener('click',e=>{if(held){held=false;e.stopPropagation();e.preventDefault();}},true);
  document.addEventListener('contextmenu',e=>{if(e.target.closest('.act'))e.preventDefault();});
})();
// Swipe a row left to delete it (with Undo). Rows in sheets are left alone.
(function(){
  let li=null,btn=null,x0=0,y0=0,dx=0,mode='';
  const main=$('#main');
  main.addEventListener('touchstart',e=>{const b=e.target.closest('.list .row[data-act="edit"]');li=b&&b.parentElement;btn=b;mode='';dx=0;if(!b||e.touches.length!==1){li=null;return;}x0=e.touches[0].clientX;y0=e.touches[0].clientY;},{passive:true});
  main.addEventListener('touchmove',e=>{
    if(!li)return;const x=e.touches[0].clientX-x0,y=e.touches[0].clientY-y0;
    if(!mode){if(Math.abs(x)<8&&Math.abs(y)<8)return;mode=Math.abs(x)>Math.abs(y)*1.3&&x<0?'swipe':'scroll';if(mode==='swipe'){li.dataset.del=tr('Delete');li.classList.add('swiping');}}
    if(mode!=='swipe')return;e.preventDefault();dx=Math.min(0,x);btn.style.transform=`translateX(${dx}px)`;li.classList.toggle('armed',dx<-110);
  },{passive:false});
  const end=()=>{
    if(!li)return;const l=li,b=btn;li=null;
    if(mode!=='swipe')return;
    l.classList.remove('armed');
    if(dx<-110){b.style.transform='translateX(-100%)';haptic('Medium');const id=b.dataset.id;
      setTimeout(()=>{const old=removeEv(id);render();toast('Entry deleted',()=>{if(old)upsert({...old});});},180);}
    else{b.style.transform='';setTimeout(()=>l.classList.remove('swiping'),250);}
    const stop=ev=>{ev.stopPropagation();ev.preventDefault();};document.addEventListener('click',stop,{capture:true,once:true});setTimeout(()=>document.removeEventListener('click',stop,true),400);
  };
  main.addEventListener('touchend',end);main.addEventListener('touchcancel',end);
})();
function setTimerStart(kind,ns){
  const n=Date.now(),a=S.active[kind];if(!a)return false;
  if(!(ns<=n))return toast('The start cannot be in the future.'),false;
  if(n-ns>24*36e5)return toast('That is more than 24 hours ago.'),false;
  if(kind==='nurse'){const s0=a.segs[0];const nf=s0.from+(ns-a.start);if(nf>=(s0.to??n))return toast('That is after the first side ended.'),false;s0.from=nf;}
  const prev=a.start;a.start=ns;touchActive(kind);save();render();
  toast(`Start moved to ${hm(ns)}`,()=>{setTimerStart(kind,prev);});
  return true;
}
function openAdjust(kind){
  const a=S.active[kind];if(!a)return;
  openSheet(`<h2>${kind==='sleep'?'Fell asleep at':'Feed started at'}</h2>${fld('Start time',`<input id="adj-start" type="datetime-local" value="${toInput(a.start)}">`)}
    <div class="presets ago">${[5,10,15,20,30,45].map(m=>`<button type="button" class="chip" data-act="ago" data-t="adj-start" data-m="${m}">${m} min ago</button>`).join('')}</div>
    <div class="foot"><button class="btn" data-act="close">Cancel</button><button class="btn primary" data-act="adj-save" data-k="${kind}">Save</button></div>`);
}
const isVit=e=>e.type==='other'&&/vitamin/i.test((e.data.label||'')+' '+(e.data.note||''));

/* ---------- native bridge ----------
   Runs only inside the iOS app shell (Capacitor). On the web PWA, window.Capacitor
   is absent, nativeOn() is false, and every function below is a silent no-op —
   the same index.html serves both without a separate build. */
const CAP=()=>window.Capacitor;
const nativeOn=()=>{try{return !!(CAP()&&CAP().isNativePlatform&&CAP().isNativePlatform());}catch(e){return false;}};
function haptic(style){if(!nativeOn())return;const H=CAP().Plugins&&CAP().Plugins.Haptics;if(!H)return;try{H.impact({style:style||'Light'}).catch(()=>{});}catch(e){}}
const VIT_NOTIF_ID=4001;
async function remindersPermission(){
  const LN=CAP()?.Plugins?.LocalNotifications;if(!LN)return false;
  try{const p=await LN.checkPermissions();if(p.display==='granted')return true;const r=await LN.requestPermissions();return r.display==='granted';}catch(e){return false;}
}
async function scheduleVitReminder(){
  if(!nativeOn()||!S.settings.remind)return;
  const LN=CAP()?.Plugins?.LocalNotifications;if(!LN)return;
  const ok=await remindersPermission();
  if(!ok){S.settings.remind=false;save();if(!sheetOpen())render();return;}
  const at=new Date();at.setHours(21,0,0,0);if(at.getTime()<=Date.now())at.setDate(at.getDate()+1);
  try{await LN.schedule({notifications:[{id:VIT_NOTIF_ID,title:'Yupu baby',body:"Vitamin D hasn't been logged today.",schedule:{at,allowWhileIdle:true}}]});}catch(e){}
}
async function cancelVitReminder(){const LN=CAP()?.Plugins?.LocalNotifications;if(!LN)return;try{await LN.cancel({notifications:[{id:VIT_NOTIF_ID}]});}catch(e){}}
async function refreshVitReminder(){
  if(!nativeOn()||!S.settings.remind){await cancelVitReminder();return;}
  const given=live().find(e=>isVit(e)&&e.start>=dayStart(Date.now()));
  if(given)await cancelVitReminder();else await scheduleVitReminder();
}

/* ---------- theme, toast ---------- */
const mq=matchMedia('(prefers-color-scheme: dark)');
function minsOf(s){const [h,m]=String(s||'0:0').split(':').map(Number);return (h||0)*60+(m||0);}
function nightWindowActive(ts=Date.now()){const st=S.settings;if(!st.nightAuto)return false;const d=new Date(ts),m=d.getHours()*60+d.getMinutes(),a=minsOf(st.nightFrom),b=minsOf(st.nightTo);return a<=b?(m>=a&&m<b):(m>=a||m<b);}
function nightWindowEnd(ts=Date.now()){const b=minsOf(S.settings.nightTo),d=new Date(ts);d.setHours(Math.floor(b/60),b%60,0,0);if(d.getTime()<=ts)d.setDate(d.getDate()+1);return d.getTime();}
function nightActive(){const st=S.settings;return !!st.night||(nightWindowActive()&&!((st.nightSkipUntil||0)>Date.now()));}
function applyTheme(){
  const st=S.settings,nightOn=nightActive(),th=nightOn?'red':st.theme==='auto'?(mq.matches?'dark':'light'):st.theme;
  document.documentElement.dataset.theme=th;document.documentElement.dataset.text=st.textSize||'m';
  const bg=getComputedStyle(document.documentElement).getPropertyValue('--bg').trim();
  $('meta[name="theme-color"]').setAttribute('content',bg||'#F3F5F9');
  const b=$('#nightBtn');b.classList.toggle('on',nightOn);b.setAttribute('aria-pressed',nightOn?'true':'false');
}
if(mq.addEventListener) mq.addEventListener('change',applyTheme);
let toastT;
function toast(msg,action,label,skipRender){
  const el=$('#toast');el.innerHTML=`<span>${esc(tr(msg))}</span>${action?`<button type="button" id="toastAction">${esc(tr(label||'Undo'))}</button>`:''}`;
  el.classList.add('show');clearTimeout(toastT);toastT=setTimeout(()=>el.classList.remove('show'),action?6000:2600);
  if(action) $('#toastAction').onclick=()=>{action();el.classList.remove('show');if(!skipRender)render();};
}

/* ---------- actions ---------- */
document.addEventListener('click',ev=>{
  const t=ev.target.closest('[data-act]');if(!t)return;
  const act=t.dataset.act,n=Date.now();
  switch(act){
    case 'close-bg': if(ev.target===t) closeSheet(); break;
    case 'close': closeSheet(); break;
    case 'tab':{const same=tab===t.dataset.tab;tab=t.dataset.tab;window.scrollTo(0,0);render();if(!same){const m=$('#main');m.classList.remove('enter');void m.offsetWidth;m.classList.add('enter');haptic('Light');}break;}
    case 'night':{const st=S.settings;if(nightActive()){st.night=false;if(nightWindowActive())st.nightSkipUntil=nightWindowEnd();}else{st.night=true;st.nightSkipUntil=0;}save();applyTheme();render();break;}
    case 'settings': openSettings(false);break;
    case 'nurse-side': haptic('Light');nurseStart(t.dataset.side);break;
    case 'nurse-pause':{const a=S.active.nurse;if(!a)break;haptic('Light');if(curSide(a))closeOpen(a,n);else a.segs.push({side:lastSide(a),from:n,to:null});touchActive('nurse');save();render();break;}
    case 'nurse-done': haptic('Medium');nurseDone();break;
    case 'nurse-discard': if(confirm(tr('Discard this feed?'))){S.active.nurse=null;touchActive('nurse');save();render();}break;
    case 'sleep-start': haptic('Light');S.active.sleep={id:uid(),start:n,by:S.settings.device||''};touchActive('sleep');save();render();toast('Sleep started');break;
    case 'sleep-stop':{const a=S.active.sleep;if(!a)break;haptic('Medium');S.active.sleep=null;touchActive('sleep');
      if(n-a.start<60e3){save();render();toast('Under a minute, not saved');break;}
      const e={id:a.id||uid(),type:'sleep',start:a.start,end:n,data:{}};upsert(e);render();toast(`Sleep saved, ${dur(n-a.start)}`,()=>removeEv(e.id));break;}
    case 'sleep-discard': if(confirm(tr('Discard this sleep?'))){S.active.sleep=null;touchActive('sleep');save();render();}break;
    case 'new': closeSheet();openEditor(t.dataset.type);break;
    case 'new-food': openEditor('solids',null,t.dataset.food);break;
    case 'edit':{const e=S.events.find(x=>x.id===t.dataset.id);if(e)openEditor(e.type,e);break;}
    case 'add-any': openChooser();break;
    case 'seg':{t.parentElement.querySelectorAll('button').forEach(b=>b.classList.toggle('on',b===t));$('#'+t.dataset.group).value=t.dataset.val;break;}
    case 'step':{const el=$('#'+t.dataset.t);el.value=Math.max(0,(Math.round(num(el.value))||0)+(+t.dataset.d));break;}
    case 'setv': $('#'+t.dataset.t).value=t.dataset.v;break;
    case 'tog': t.classList.toggle('on');break;
    case 'ago': $('#'+t.dataset.t).value=toInput(n-(+t.dataset.m)*6e4);break;
    case 'adj': setTimerStart(t.dataset.k,S.active[t.dataset.k].start-(+t.dataset.m)*6e4);break;
    case 'adj-open': openAdjust(t.dataset.k);break;
    case 'start-ago': startAt(t.dataset.k,t.dataset.side,n-(+t.dataset.m)*6e4);break;
    case 'start-at': startAt(t.dataset.k,t.dataset.side,fromInput($('#start-at').value));break;
    case 'bar': toast(t.dataset.tip);break;
    case 'ob-step':{const ob=t.closest('.ob');if(ob){ob.dataset.step=t.dataset.n;$('#sheet').scrollTop=0;}break;}
    case 'ob-sync': saveSettings();openSettings(false);setTimeout(()=>{const r=$('#s-repo');if(r)r.scrollIntoView({block:'center'});},350);break;
    case 'reload': location.reload();break;
    case 'adj-save':{const ns=fromInput($('#adj-start').value);if(isNaN(ns)){toast('Enter a valid time.');break;}if(setTimerStart(t.dataset.k,ns))closeSheet();break;}
    case 'vit':{haptic('Medium');const e={id:uid(),type:'other',start:n,data:{label:'Vitamin D'}};upsert(e);render();refreshVitReminder();toast('Vitamin D logged',()=>{removeEv(e.id);refreshVitReminder();});break;}
    case 'sync-on': syncTurnOn();break;
    case 'sync-off': syncTurnOff();break;
    case 'sync-auto': autoSync();break;
    case 'restore-points': openRestorePoints();break;
    case 'hist': openHistory(t.dataset.id);break;
    case 'guard-yes':{const x=S.active[t.dataset.k];if(x){x.ack=n+(t.dataset.k==='sleep'?2*36e5:30*6e4);touchActive(t.dataset.k);save();render();}break;}
    case 'guard-end': openEndAt(t.dataset.k);break;
    case 'end-save': if(endTimerAt(t.dataset.k,fromInput($('#end-at').value)))closeSheet();break;
    case 'med-again':{const o=S.events.find(x=>x.id===t.dataset.id);if(o){const e={id:uid(),type:'other',start:n,data:{label:o.data.label}};upsert(e);render();toast(`${medName(o)} logged at ${hm(n)}`,()=>removeEv(e.id));}break;}
    case 'hist-restore':{const e=S.events.find(x=>x.id===t.dataset.id),v=e&&e.hist&&e.hist[+t.dataset.i];if(v){upsert({...e,start:v.start,end:v.end,data:v.data});closeSheet();render();toast('Earlier version restored');}break;}
    case 'deleted': openDeleted();break;
    case 'del-restore':{const e=S.events.find(x=>x.id===t.dataset.id);if(e&&e.deleted&&e.prev){const p={...e.prev};delete p.deleted;upsert(p);render();openDeleted();toast('Entry restored');}break;}
    case 'health': openHealth();break;
    case 'health-fix': removeEv(t.dataset.id);render();openHealth();toast('Fixed. Restore it from Recently deleted if needed.');break;
    case 'health-fixall':{const ids=[...new Set(healthScan().filter(x=>x.fix).map(x=>x.fix))];ids.forEach(id=>removeEv(id));render();openHealth();toast(`${ids.length} ${ids.length===1?'entry':'entries'} removed. Restore from Recently deleted if needed.`);break;}
    case 'rp-pick': restoreFrom(t.dataset.k);break;
    case 'ed-save': saveEditor();break;
    case 'diaper-save': haptic('Light');$('#f-kind').value=t.dataset.kind;saveEditor();break;
    case 'ed-del':{if(!ed||!confirm(tr('Delete this entry?')))break;const old=removeEv(ed.id);closeSheet();render();toast('Entry deleted',()=>{if(old)upsert({...old});});break;}
    case 'hist-filter': histFilter=t.dataset.v;render();break;
    case 'hist-more': histDays+=7;render();break;
    case 'trend-range': trendRange=+t.dataset.v;render();break;
    case 'growth-metric': growthMetric=t.dataset.v;render();break;
    case 'ck-open': openCheck(t.dataset.kind,t.dataset.key,t.dataset.i===''?undefined:+t.dataset.i);break;
    case 'ck-save': saveCheck(t.dataset.kind,t.dataset.key,t.dataset.i===''?undefined:+t.dataset.i);break;
    case 'ck-skip': skipVaccine(t.dataset.key);break;
    case 'ics': exportIcs();break;
    case 'report': openReport();break;
    case 'rp-range': reportRange=+t.dataset.v;openReport();break;
    case 'rp-print': reportPrint();break;
    case 'rp-file': reportFile();break;
    case 'rp-text': reportShareText();break;
    case 'set-save': saveSettings();break;
    case 'sync-now': syncNow();break;
    case 'backup': doBackup();break;
    case 'import': $('#importFile').click();break;
    case 'csv': shareFile(`yupu-export-${stamp(n)}.csv`,toCSV(),'text/csv');break;
    case 'wipe':
      if(confirm(tr('Delete every entry and setting on this phone? Share a backup first if you want to keep anything.'))&&confirm(tr('This cannot be undone. Delete everything?'))){
        try{localStorage.removeItem(KEY);localStorage.removeItem(KEY+'-pre31');}catch(e){}S=blank();save();closeSheet();applyTheme();render();toast('All data deleted');}
      break;
  }
});
$('#importFile').addEventListener('change',async ev=>{
  const files=[...ev.target.files];ev.target.value='';if(!files.length)return;
  let added=0,updated=0,dupes=0,bad=0;
  for(const file of files){
    try{const text=await file.text();
      const r=mergeIn(/^\ufeff?"?Type"?,/.test(text)?naraToBackup(text):JSON.parse(text));added+=r.added;updated+=r.updated;dupes+=r.dupes||0;}
    catch(e){bad++;}
  }
  closeSheet();applyTheme();render();
  if(bad&&!added&&!updated) toast(files.length>1?'None of the selected files were readable backups.':'That file is not a readable backup.');
  else toast(`Imported ${added} new, ${updated} updated${dupes?`, ${dupes} already logged here`:''}${bad?`, ${bad} file${bad>1?'s':''} skipped`:''}`);
});

/* ---------- boot ---------- */
$('#nightBtn').innerHTML=I.moon;$('#gearBtn').innerHTML=I.gear;
(async()=>{
S=await loadState();
applyTheme();render();
if(!S.settings.dob&&!S.events.length) openWelcome();
refreshVitReminder();
setInterval(tick,1000);
setInterval(()=>{const was=document.documentElement.dataset.theme;applyTheme();if(!sheetOpen()&&(tab==='today'||tab==='trends'||was!==document.documentElement.dataset.theme))render();},60000);
document.addEventListener('visibilitychange',()=>{if(!document.hidden){if(!sheetOpen())render();scheduleSync(300);refreshVitReminder();}});
window.addEventListener('online',()=>scheduleSync(300));
setInterval(()=>{if(!document.hidden)autoSync();},30000);
setSyncUI();scheduleSync(1200);
try{if(navigator.storage&&navigator.storage.persist)navigator.storage.persist();}catch(e){}
// When a new release has been cached, offer a reload instead of waiting for the next launch.
try{if('serviceWorker' in navigator&&location.protocol==='https:'){
  const had=!!navigator.serviceWorker.controller;
  navigator.serviceWorker.register('sw.js').then(reg=>{
    reg.addEventListener('updatefound',()=>{const w=reg.installing;if(w)w.addEventListener('statechange',()=>{if(w.state==='activated'&&had){const u=$('#upd');translateDom(u);u.classList.add('show');}});});
    document.addEventListener('visibilitychange',()=>{if(!document.hidden)reg.update().catch(()=>{});});
  }).catch(()=>{});
}}catch(e){}
})();
