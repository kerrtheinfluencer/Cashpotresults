// CashPotJA — Main Application v2
// Live results + iOS notifications

function getJANow(){return new Date(new Date().toLocaleString(“en-US”,{timeZone:“America/Jamaica”}))}
function getJAToday(){const j=getJANow();return `${j.getFullYear()}-${String(j.getMonth()+1).padStart(2,"0")}-${String(j.getDate()).padStart(2,"0")}`}
function getYesterday(){const j=getJANow();j.setDate(j.getDate()-1);return `${j.getFullYear()}-${String(j.getMonth()+1).padStart(2,"0")}-${String(j.getDate()).padStart(2,"0")}`}
function fmtDateLong(ds){const[y,m,d]=ds.split(”-”).map(Number);return new Date(y,m-1,d).toLocaleDateString(“en-JM”,{weekday:“long”,day:“numeric”,month:“long”,year:“numeric”})}
function fmtDateShort(ds){const[y,m,d]=ds.split(”-”).map(Number);return new Date(y,m-1,d).toLocaleDateString(“en-JM”,{weekday:“short”,day:“numeric”,month:“short”})}
function getDOW(ds){const[y,m,d]=ds.split(”-”).map(Number);return new Date(y,m-1,d).getDay()}
function getDataForDate(date){return ALL_DATA.find(d=>d.date===date)}

// Live results store
let liveResults={};
function getMergedDraws(date){
const hc=getDataForDate(date);
const lv=liveResults[date];
if(!hc&&!lv) return[null,null,null,null,null,null];
const base=hc?[…hc.draws]:[null,null,null,null,null,null];
if(lv){for(let i=0;i<6;i++){if(lv[i]!==null&&lv[i]!==undefined) base[i]=lv[i];}}
return base;
}

// Fetch live results via CORS proxy
async function fetchLiveResults(){
const url=‘https://www.jamaicaindex.com/lottery/jamaica-lotto-results-for-today’;
const proxies=[‘https://api.allorigins.win/raw?url=’,‘https://corsproxy.io/?’];
for(const proxy of proxies){
try{
const resp=await fetch(proxy+encodeURIComponent(url),{signal:AbortSignal.timeout(10000)});
if(!resp.ok) continue;
const html=await resp.text();
// Parse: find Cash Pot section, extract slot numbers
const cpEnd=html.search(/Pick\s*2\s*Result/i);
const cpSection=cpEnd>0?html.substring(0,cpEnd):html;
const draws=[null,null,null,null,null,null];
const slots=[‘EARLYBIRD’,‘MORNING’,‘MIDDAY’,‘MIDAFTERNOON’,‘DRIVETIME’,‘EVENING’];
for(let i=0;i<slots.length;i++){
// Pattern: SLOTNAME…#drawnum\n\nNUMBER\n\nMeaning
const re=new RegExp(slots[i]+’[\s\S]*?#\d+\s*\n\s*(\d{1,2})\s*\n’,‘i’);
const m=cpSection.match(re);
if(m){const v=parseInt(m[1]);if(v>=1&&v<=36) draws[i]=v;}
}
if(draws.some(d=>d!==null)){
// Get date from page
const dm=html.match(/(\d{1,2})\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})/i);
let date=getJAToday();
if(dm){const mo={january:1,february:2,march:3,april:4,may:5,june:6,july:7,august:8,september:9,october:10,november:11,december:12};date=`${dm[3]}-${String(mo[dm[2].toLowerCase()]).padStart(2,"0")}-${String(dm[1]).padStart(2,"0")}`;}
liveResults[date]=draws;
console.log(‘Live results for ‘+date+’:’,draws);
return true;
}
}catch(e){console.log(‘Fetch error:’,e.message)}
}
return false;
}

// Navigation
const navLinks=document.querySelectorAll(’.site-nav a’);
const sections=document.querySelectorAll(’.section’);
function showSection(id){
sections.forEach(s=>s.classList.remove(‘active’));
navLinks.forEach(a=>a.classList.remove(‘active’));
const sec=document.getElementById(id);if(sec) sec.classList.add(‘active’);
const link=document.querySelector(`.site-nav a[data-section="${id}"]`);if(link) link.classList.add(‘active’);
}
navLinks.forEach(a=>{a.addEventListener(‘click’,e=>{e.preventDefault();showSection(a.dataset.section);history.pushState(null,’’,’#’+a.dataset.section)})});
if(window.location.hash){const h=window.location.hash.slice(1);if(document.getElementById(h)) showSection(h)}

// Render Today
function renderToday(){
const today=getJAToday();const ja=getJANow();const draws=getMergedDraws(today);
document.getElementById(‘todayTitle’).textContent=‘Cash Pot Results — Today’;
document.getElementById(‘todayDate’).textContent=fmtDateLong(today);
const nowHour=ja.getHours()+ja.getMinutes()/60;
let nextSlot=SLOT_HOURS.findIndex(h=>h>nowHour);
if(nextSlot===-1&&draws.every(d=>d!==null)) document.getElementById(‘nextDraw’).innerHTML=‘✓ All draws complete for today’;
else if(nextSlot===-1) document.getElementById(‘nextDraw’).innerHTML=‘⏳ Awaiting final results…’;
else updateCountdown(nextSlot);
let html=’’;
for(let i=0;i<6;i++){
const n=draws[i];const done=n!==null;const isPending=!done&&SLOT_HOURS[i]>nowHour;
html+=`<div class="draw-row ${done?'':'pending'}"><div class="draw-slot"><div class="draw-slot-name">${SLOT_NAMES[i]}</div><div class="draw-slot-time">${SLOT_TIMES[i]}</div></div>${done?`<div class="draw-number">${n}</div><div class="draw-meaning">${MEANINGS[n]}</div>`:`<div class="draw-number pending-num">${isPending?‘⏳’:’—’}</div><div class="draw-meaning" style="color:var(--text-dim)">${isPending?‘Upcoming’:‘Awaiting result’}</div>`}</div>`;
}
document.getElementById(‘todayDraws’).innerHTML=html;
}

function updateCountdown(slotIdx){
const ja=getJANow();const tH=Math.floor(SLOT_HOURS[slotIdx]);const tM=Math.round((SLOT_HOURS[slotIdx]-tH)*60);
const target=new Date(ja);target.setHours(tH,tM,0,0);const diff=target-ja;
if(diff<=0){document.getElementById(‘nextDraw’).innerHTML=`🎯 ${SLOT_NAMES[slotIdx]} draw happening now!`;return}
const h=Math.floor(diff/3600000);const m=Math.floor((diff%3600000)/60000);const s=Math.floor((diff%60000)/1000);
document.getElementById(‘nextDraw’).innerHTML=`⏱ Next: <strong>${SLOT_NAMES[slotIdx]}</strong> in ${h>0?h+'h ':''}${m}m ${s}s`;
}

function renderYesterday(){
const yest=getYesterday();const draws=getMergedDraws(yest);
if(draws.every(d=>d===null)){document.getElementById(‘yesterdayDraws’).innerHTML=’<div style="color:var(--text-dim);font-size:0.82rem">No data for yesterday</div>’;return}
let html=’’;draws.forEach((n,i)=>{if(n===null)return;html+=`<div class="draw-row"><div class="draw-slot"><div class="draw-slot-name">${SLOT_NAMES[i]}</div><div class="draw-slot-time">${SLOT_TIMES[i]}</div></div><div class="draw-number">${n}</div><div class="draw-meaning">${MEANINGS[n]}</div></div>`});
document.getElementById(‘yesterdayDraws’).innerHTML=html;
}

// History
let historyPage=0;
function renderHistory(){
const fromDate=document.getElementById(‘historyFrom’).value;const searchNum=parseInt(document.getElementById(‘historyNum’).value);const slotFilter=document.getElementById(‘historySlot’).value;
let filtered=[…ALL_DATA].reverse();
if(fromDate) filtered=filtered.filter(d=>d.date>=fromDate);
if(!isNaN(searchNum)&&searchNum>=1&&searchNum<=36){filtered=filtered.filter(d=>{if(slotFilter!==’’)return d.draws[+slotFilter]===searchNum;return d.draws.some(n=>n===searchNum)})}
else if(slotFilter!==’’) filtered=filtered.filter(d=>d.draws[+slotFilter]!==null);
const showing=filtered.slice(0,(historyPage+1)*14);
let html=’’;
for(const day of showing){const dow=DOW_SHORT[getDOW(day.date)];html+=`<div class="history-day"><div class="history-date"><span>${dow}, ${fmtDateShort(day.date)}</span><span style="font-size:0.68rem;color:var(--text-dim)">${day.date}</span></div><div class="history-draws">${day.draws.map((n,i)=>n!==null?`<div class="history-chip"><span class="history-chip-slot">${SLOT_NAMES[i].substring(0,3)}</span><span class="history-chip-num">${n}</span></div>`:'').join('')}</div></div>`}
document.getElementById(‘historyList’).innerHTML=html;
document.getElementById(‘loadMoreBtn’).style.display=showing.length<filtered.length?‘block’:‘none’;
}
function loadMoreHistory(){historyPage++;renderHistory()}
[‘historyFrom’,‘historyNum’,‘historySlot’].forEach(id=>{document.getElementById(id).addEventListener(‘change’,()=>{historyPage=0;renderHistory()});document.getElementById(id).addEventListener(‘input’,()=>{historyPage=0;renderHistory()})});

// Meanings
function renderMeanings(){
const seq=[];for(const d of ALL_DATA) d.draws.forEach(n=>{if(n!==null)seq.push(n)});
const lastSeen={};for(let i=1;i<=36;i++) lastSeen[i]=-1;for(let i=0;i<seq.length;i++) lastSeen[seq[i]]=i;
const gap={};for(let i=1;i<=36;i++) gap[i]=lastSeen[i]===-1?999:(seq.length-1-lastSeen[i]);
let html=’’;for(let n=1;n<=36;n++){html+=`<div class="num-cell" onclick="alert('${n} — ${MEANINGS[n]}\\n\\nKeywords: ${(CHART[n]||[]).join(", ")}\\nGap: ${gap[n]} draws since last')"><div class="num-cell-num">${n}</div><div class="num-cell-name">${MEANINGS[n]}</div></div>`}
document.getElementById(‘meaningsGrid’).innerHTML=html;
}

// Stats
function renderStats(){
const seq=[];for(const d of ALL_DATA) d.draws.forEach(n=>{if(n!==null)seq.push(n)});const N=seq.length;
const freq={};for(let i=1;i<=36;i++) freq[i]=0;for(const n of seq) freq[n]++;
const lastSeen={};for(let i=1;i<=36;i++) lastSeen[i]=-1;for(let i=0;i<N;i++) lastSeen[seq[i]]=i;
const gap={};for(let i=1;i<=36;i++) gap[i]=lastSeen[i]===-1?999:(N-1-lastSeen[i]);
const recent=seq.slice(-180);const recentFreq={};for(let i=1;i<=36;i++) recentFreq[i]=0;for(const n of recent) recentFreq[n]++;
const sorted=Array.from({length:36},(*,i)=>i+1).sort((a,b)=>freq[b]-freq[a]);
const overdue=Array.from({length:36},(*,i)=>i+1).sort((a,b)=>gap[b]-gap[a]);
const recentHot=Array.from({length:36},(_,i)=>i+1).sort((a,b)=>recentFreq[b]-recentFreq[a]);
document.getElementById(‘totalDrawsStat’).textContent=N.toLocaleString();
document.getElementById(‘statsGrid’).innerHTML=`<div class="stat-box"><div class="stat-label">Total Draws</div><div class="stat-value">${N.toLocaleString()}</div></div><div class="stat-box"><div class="stat-label">Days</div><div class="stat-value">${ALL_DATA.length}</div></div><div class="stat-box"><div class="stat-label">Most Drawn</div><div class="stat-value" style="color:var(--amber)">${sorted[0]}</div><div class="stat-sub">${MEANINGS[sorted[0]]} · ${freq[sorted[0]]}×</div></div><div class="stat-box"><div class="stat-label">Least Drawn</div><div class="stat-value" style="color:var(--blue)">${sorted[35]}</div><div class="stat-sub">${MEANINGS[sorted[35]]} · ${freq[sorted[35]]}×</div></div><div class="stat-box"><div class="stat-label">Most Overdue</div><div class="stat-value" style="color:var(--red)">${overdue[0]}</div><div class="stat-sub">${MEANINGS[overdue[0]]} · gap ${gap[overdue[0]]}</div></div><div class="stat-box"><div class="stat-label">Hot Now</div><div class="stat-value" style="color:var(--gold)">${recentHot[0]}</div><div class="stat-sub">${MEANINGS[recentHot[0]]} · ${recentFreq[recentHot[0]]}× 30d</div></div>`;
let hotH=’<div style="display:flex;gap:0.4rem;flex-wrap:wrap">’;for(let i=0;i<10;i++){const n=recentHot[i];hotH+=`<div class="history-chip" style="background:#fff3e0;border-color:var(--amber)"><span class="history-chip-num" style="color:var(--amber)">${n}</span><span class="history-chip-slot">${recentFreq[n]}×</span></div>`}document.getElementById(‘hotNumbers’).innerHTML=hotH+’</div>’;
let coldH=’<div style="display:flex;gap:0.4rem;flex-wrap:wrap">’;for(let i=0;i<10;i++){const n=overdue[i];coldH+=`<div class="history-chip" style="background:#e8f0ff;border-color:var(--blue)"><span class="history-chip-num" style="color:var(--blue)">${n}</span><span class="history-chip-slot">g${gap[n]}</span></div>`}document.getElementById(‘coldNumbers’).innerHTML=coldH+’</div>’;
const maxF=Math.max(…Object.values(freq));let fg=’’;for(let n=1;n<=36;n++){const heat=freq[n]/maxF;const cls=heat>0.85?‘hot’:gap[n]>40?‘cold’:’’;fg+=`<div class="num-cell ${cls}"><div class="num-cell-num">${n}</div><div class="num-cell-name">${freq[n]}× · g${gap[n]}</div></div>`}document.getElementById(‘freqGrid’).innerHTML=fg;
}

// FAQ
document.addEventListener(‘click’,e=>{const q=e.target.closest(’.faq-q’);if(q) q.parentElement.classList.toggle(‘open’)});

// Notifications — iOS aware
function requestNotify(){
const isIOS=/iPad|iPhone|iPod/.test(navigator.userAgent);
const isStandalone=window.matchMedia(’(display-mode: standalone)’).matches||window.navigator.standalone;
if(!(‘Notification’ in window)){
if(isIOS&&!isStandalone){alert(‘📱 To get Cash Pot alerts on iPhone:\n\n1. Open this site in Safari\n2. Tap the Share button (↑)\n3. Tap “Add to Home Screen”\n4. Open from your home screen\n5. Tap 🔔 Alerts again\n\nPush notifications require the home screen app on iOS.’)}
else{alert(‘Push notifications are not supported in this browser. Open in Safari and add to Home Screen.’)}
return;
}
if(Notification.permission===‘granted’){document.getElementById(‘notifyBtn’).classList.add(‘active’);document.getElementById(‘notifyBtn’).textContent=‘🔔 ON’;localStorage.setItem(‘cpja_notify’,‘1’);new Notification(‘CashPotJA Alerts Active’,{body:‘You'll be notified when new numbers drop!’});return}
if(Notification.permission===‘denied’){alert(‘Notifications are blocked. Enable them in Settings for this site.’);return}
Notification.requestPermission().then(p=>{if(p===‘granted’){document.getElementById(‘notifyBtn’).classList.add(‘active’);document.getElementById(‘notifyBtn’).textContent=‘🔔 ON’;localStorage.setItem(‘cpja_notify’,‘1’);new Notification(‘CashPotJA Alerts Enabled!’,{body:‘You'll get notified when new Cash Pot numbers drop!’})}});
}
if(localStorage.getItem(‘cpja_notify’)===‘1’&&‘Notification’ in window&&Notification.permission===‘granted’){document.getElementById(‘notifyBtn’).classList.add(‘active’);document.getElementById(‘notifyBtn’).textContent=‘🔔 ON’}

// Auto-poll during draw hours
let lastResultCount=0;
async function pollResults(){
const before=JSON.stringify(liveResults);await fetchLiveResults();const after=JSON.stringify(liveResults);
if(before!==after){renderToday();renderYesterday();
if(localStorage.getItem(‘cpja_notify’)===‘1’&&‘Notification’ in window&&Notification.permission===‘granted’){
const draws=getMergedDraws(getJAToday());const latest=draws.filter(d=>d!==null);
if(latest.length>lastResultCount&&latest.length>0){const n=latest[latest.length-1];new Notification(`Cash Pot: ${n} — ${MEANINGS[n]}`,{body:`${SLOT_NAMES[latest.length-1]} draw just played!`})}
lastResultCount=latest.length;
}
}
}
setInterval(()=>{const h=getJANow().getHours();if(h>=8&&h<=21) pollResults()},120000);

// Service Worker
if(‘serviceWorker’ in navigator) navigator.serviceWorker.register(’/sw.js’).catch(()=>{});

// Init
renderToday();renderYesterday();renderHistory();renderMeanings();renderStats();
pollResults();
setInterval(()=>{const ja=getJANow();const nh=ja.getHours()+ja.getMinutes()/60;const ns=SLOT_HOURS.findIndex(sh=>sh>nh);if(ns>=0) updateCountdown(ns)},1000);
