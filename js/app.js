// ═══════════════════════════════════════════════════════════════
// CashPotJA — Main Application
// ═══════════════════════════════════════════════════════════════

// ── Helpers ───────────────────────────────────────────────────
function getJANow() {
  return new Date(new Date().toLocaleString("en-US", { timeZone: "America/Jamaica" }));
}
function getJAToday() {
  const ja = getJANow();
  return `${ja.getFullYear()}-${String(ja.getMonth()+1).padStart(2,"0")}-${String(ja.getDate()).padStart(2,"0")}`;
}
function getYesterday() {
  const ja = getJANow();
  ja.setDate(ja.getDate() - 1);
  return `${ja.getFullYear()}-${String(ja.getMonth()+1).padStart(2,"0")}-${String(ja.getDate()).padStart(2,"0")}`;
}
function fmtDateLong(ds) {
  const [y,m,d] = ds.split("-").map(Number);
  const dt = new Date(y, m-1, d);
  return dt.toLocaleDateString("en-JM", { weekday:"long", day:"numeric", month:"long", year:"numeric" });
}
function fmtDateShort(ds) {
  const [y,m,d] = ds.split("-").map(Number);
  const dt = new Date(y, m-1, d);
  return dt.toLocaleDateString("en-JM", { weekday:"short", day:"numeric", month:"short" });
}
function getDOW(ds) {
  const [y,m,d] = ds.split("-").map(Number);
  return new Date(y, m-1, d).getDay();
}

// ── Data access ───────────────────────────────────────────────
function getDataForDate(date) {
  return ALL_DATA.find(d => d.date === date);
}

// ── Navigation ────────────────────────────────────────────────
const navLinks = document.querySelectorAll('.site-nav a');
const sections = document.querySelectorAll('.section');

function showSection(id) {
  sections.forEach(s => s.classList.remove('active'));
  navLinks.forEach(a => a.classList.remove('active'));
  const sec = document.getElementById(id);
  if (sec) sec.classList.add('active');
  const link = document.querySelector(`.site-nav a[data-section="${id}"]`);
  if (link) link.classList.add('active');
}

navLinks.forEach(a => {
  a.addEventListener('click', e => {
    e.preventDefault();
    showSection(a.dataset.section);
    history.pushState(null, '', `#${a.dataset.section}`);
  });
});

// Handle hash on load
if (window.location.hash) {
  const h = window.location.hash.slice(1);
  if (document.getElementById(h)) showSection(h);
}

// ── Render Today ──────────────────────────────────────────────
function renderToday() {
  const today = getJAToday();
  const ja = getJANow();
  const entry = getDataForDate(today);
  const draws = entry ? entry.draws : [null,null,null,null,null,null];

  document.getElementById('todayTitle').textContent = `Cash Pot Results — Today`;
  document.getElementById('todayDate').textContent = fmtDateLong(today);

  // Next draw countdown
  const nowHour = ja.getHours() + ja.getMinutes()/60;
  let nextSlot = SLOT_HOURS.findIndex(h => h > nowHour);
  if (nextSlot === -1) {
    document.getElementById('nextDraw').innerHTML = '✓ All draws complete for today';
  } else {
    updateCountdown(nextSlot);
  }

  let html = '';
  for (let i = 0; i < 6; i++) {
    const n = draws[i];
    const done = n !== null;
    const isPending = !done && SLOT_HOURS[i] > nowHour;
    const isPast = !done && SLOT_HOURS[i] <= nowHour;
    html += `<div class="draw-row ${done ? '' : 'pending'}">
      <div class="draw-slot">
        <div class="draw-slot-name">${SLOT_NAMES[i]}</div>
        <div class="draw-slot-time">${SLOT_TIMES[i]}</div>
      </div>
      ${done
        ? `<div class="draw-number">${n}</div>
           <div class="draw-meaning">${MEANINGS[n]}<small>Draw #${37301 + i}</small></div>`
        : `<div class="draw-number pending-num">${isPending ? '⏳' : '—'}</div>
           <div class="draw-meaning" style="color:var(--text-dim)">${isPending ? 'Upcoming' : 'Awaiting result'}</div>`
      }
    </div>`;
  }
  document.getElementById('todayDraws').innerHTML = html;
}

function updateCountdown(slotIdx) {
  const ja = getJANow();
  const targetH = Math.floor(SLOT_HOURS[slotIdx]);
  const targetM = Math.round((SLOT_HOURS[slotIdx] - targetH) * 60);
  const target = new Date(ja);
  target.setHours(targetH, targetM, 0, 0);

  const diff = target - ja;
  if (diff <= 0) {
    document.getElementById('nextDraw').innerHTML = `🎯 ${SLOT_NAMES[slotIdx]} draw happening now!`;
    return;
  }
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  document.getElementById('nextDraw').innerHTML =
    `⏱ Next: <strong>${SLOT_NAMES[slotIdx]}</strong> in ${h > 0 ? h+'h ' : ''}${m}m ${s}s`;
}

// ── Render Yesterday ──────────────────────────────────────────
function renderYesterday() {
  const yest = getYesterday();
  const entry = getDataForDate(yest);
  if (!entry) {
    document.getElementById('yesterdayDraws').innerHTML = '<div style="color:var(--text-dim);font-size:0.82rem">No data for yesterday</div>';
    return;
  }
  let html = '';
  entry.draws.forEach((n, i) => {
    if (n === null) return;
    html += `<div class="draw-row">
      <div class="draw-slot">
        <div class="draw-slot-name">${SLOT_NAMES[i]}</div>
        <div class="draw-slot-time">${SLOT_TIMES[i]}</div>
      </div>
      <div class="draw-number">${n}</div>
      <div class="draw-meaning">${MEANINGS[n]}</div>
    </div>`;
  });
  document.getElementById('yesterdayDraws').innerHTML = html;
}

// ── Render History ────────────────────────────────────────────
let historyPage = 0;
const HISTORY_PER_PAGE = 14;

function renderHistory() {
  const fromDate = document.getElementById('historyFrom').value;
  const searchNum = parseInt(document.getElementById('historyNum').value);
  const slotFilter = document.getElementById('historySlot').value;

  let filtered = [...ALL_DATA].reverse();

  if (fromDate) filtered = filtered.filter(d => d.date >= fromDate);
  if (!isNaN(searchNum) && searchNum >= 1 && searchNum <= 36) {
    filtered = filtered.filter(d => {
      if (slotFilter !== '') return d.draws[+slotFilter] === searchNum;
      return d.draws.some(n => n === searchNum);
    });
  } else if (slotFilter !== '') {
    filtered = filtered.filter(d => d.draws[+slotFilter] !== null);
  }

  const showing = filtered.slice(0, (historyPage + 1) * HISTORY_PER_PAGE);
  let html = '';
  for (const day of showing) {
    const dow = DOW_SHORT[getDOW(day.date)];
    html += `<div class="history-day">
      <div class="history-date">
        <span>${dow}, ${fmtDateShort(day.date)}</span>
        <span style="font-size:0.68rem;color:var(--text-dim)">${day.date}</span>
      </div>
      <div class="history-draws">
        ${day.draws.map((n, i) => n !== null
          ? `<div class="history-chip">
              <span class="history-chip-slot">${SLOT_NAMES[i].substring(0,3)}</span>
              <span class="history-chip-num">${n}</span>
            </div>`
          : ''
        ).join('')}
      </div>
    </div>`;
  }
  document.getElementById('historyList').innerHTML = html;
  document.getElementById('loadMoreBtn').style.display = showing.length < filtered.length ? 'block' : 'none';
}

function loadMoreHistory() {
  historyPage++;
  renderHistory();
}

// Listen for filter changes
['historyFrom','historyNum','historySlot'].forEach(id => {
  document.getElementById(id).addEventListener('change', () => { historyPage = 0; renderHistory(); });
  document.getElementById(id).addEventListener('input', () => { historyPage = 0; renderHistory(); });
});

// ── Render Meanings Grid ──────────────────────────────────────
function renderMeanings() {
  // Compute gaps for color coding
  const seq = [];
  for (const d of ALL_DATA) d.draws.forEach(n => { if (n !== null) seq.push(n); });
  const lastSeen = {};
  for (let i = 1; i <= 36; i++) lastSeen[i] = -1;
  for (let i = 0; i < seq.length; i++) lastSeen[seq[i]] = i;
  const gap = {};
  for (let i = 1; i <= 36; i++) gap[i] = lastSeen[i] === -1 ? 999 : (seq.length - 1 - lastSeen[i]);

  let html = '';
  for (let n = 1; n <= 36; n++) {
    const keywords = CHART[n] ? CHART[n].slice(0, 3).join(', ') : '';
    html += `<div class="num-cell" title="${MEANINGS[n]}: ${keywords}" onclick="alert('${n} — ${MEANINGS[n]}\\n\\nKeywords: ${(CHART[n]||[]).join(", ")}\\nGap: ${gap[n]} draws since last')">
      <div class="num-cell-num">${n}</div>
      <div class="num-cell-name">${MEANINGS[n]}</div>
    </div>`;
  }
  document.getElementById('meaningsGrid').innerHTML = html;
}

// ── Render Stats ──────────────────────────────────────────────
function renderStats() {
  const seq = [];
  for (const d of ALL_DATA) d.draws.forEach(n => { if (n !== null) seq.push(n); });
  const N = seq.length;

  // Frequency
  const freq = {};
  for (let i = 1; i <= 36; i++) freq[i] = 0;
  for (const n of seq) freq[n]++;

  // Gap
  const lastSeen = {};
  for (let i = 1; i <= 36; i++) lastSeen[i] = -1;
  for (let i = 0; i < N; i++) lastSeen[seq[i]] = i;
  const gap = {};
  for (let i = 1; i <= 36; i++) gap[i] = lastSeen[i] === -1 ? 999 : (N - 1 - lastSeen[i]);

  // Last 30 days frequency
  const recent = seq.slice(-180); // ~30 days * 6 draws
  const recentFreq = {};
  for (let i = 1; i <= 36; i++) recentFreq[i] = 0;
  for (const n of recent) recentFreq[n]++;

  // Most/least frequent
  const sorted = Array.from({length: 36}, (_, i) => i + 1).sort((a, b) => freq[b] - freq[a]);
  const overdue = Array.from({length: 36}, (_, i) => i + 1).sort((a, b) => gap[b] - gap[a]);
  const recentHot = Array.from({length: 36}, (_, i) => i + 1).sort((a, b) => recentFreq[b] - recentFreq[a]);

  document.getElementById('totalDrawsStat').textContent = N.toLocaleString();

  // Summary stats
  document.getElementById('statsGrid').innerHTML = `
    <div class="stat-box"><div class="stat-label">Total Draws</div><div class="stat-value">${N.toLocaleString()}</div></div>
    <div class="stat-box"><div class="stat-label">Total Days</div><div class="stat-value">${ALL_DATA.length}</div></div>
    <div class="stat-box"><div class="stat-label">Most Drawn</div><div class="stat-value" style="color:var(--amber)">${sorted[0]}</div><div class="stat-sub">${MEANINGS[sorted[0]]} · ${freq[sorted[0]]}×</div></div>
    <div class="stat-box"><div class="stat-label">Least Drawn</div><div class="stat-value" style="color:var(--blue)">${sorted[35]}</div><div class="stat-sub">${MEANINGS[sorted[35]]} · ${freq[sorted[35]]}×</div></div>
    <div class="stat-box"><div class="stat-label">Most Overdue</div><div class="stat-value" style="color:var(--red)">${overdue[0]}</div><div class="stat-sub">${MEANINGS[overdue[0]]} · gap ${gap[overdue[0]]}</div></div>
    <div class="stat-box"><div class="stat-label">Hot Right Now</div><div class="stat-value" style="color:var(--gold)">${recentHot[0]}</div><div class="stat-sub">${MEANINGS[recentHot[0]]} · ${recentFreq[recentHot[0]]}× in 30d</div></div>
  `;

  // Hot numbers
  let hotHtml = '<div style="display:flex;gap:0.4rem;flex-wrap:wrap">';
  for (let i = 0; i < 10; i++) {
    const n = recentHot[i];
    hotHtml += `<div class="history-chip" style="background:#fff3e0;border-color:var(--amber)">
      <span class="history-chip-num" style="color:var(--amber)">${n}</span>
      <span class="history-chip-slot">${recentFreq[n]}×</span>
    </div>`;
  }
  hotHtml += '</div>';
  document.getElementById('hotNumbers').innerHTML = hotHtml;

  // Cold numbers
  let coldHtml = '<div style="display:flex;gap:0.4rem;flex-wrap:wrap">';
  for (let i = 0; i < 10; i++) {
    const n = overdue[i];
    coldHtml += `<div class="history-chip" style="background:#e8f0ff;border-color:var(--blue)">
      <span class="history-chip-num" style="color:var(--blue)">${n}</span>
      <span class="history-chip-slot">g${gap[n]}</span>
    </div>`;
  }
  coldHtml += '</div>';
  document.getElementById('coldNumbers').innerHTML = coldHtml;

  // Frequency grid
  const maxF = Math.max(...Object.values(freq));
  let fgHtml = '';
  for (let n = 1; n <= 36; n++) {
    const heat = freq[n] / maxF;
    const cls = heat > 0.85 ? 'hot' : gap[n] > 40 ? 'cold' : '';
    fgHtml += `<div class="num-cell ${cls}">
      <div class="num-cell-num">${n}</div>
      <div class="num-cell-name">${freq[n]}× · g${gap[n]}</div>
    </div>`;
  }
  document.getElementById('freqGrid').innerHTML = fgHtml;
}

// ── FAQ Accordion ─────────────────────────────────────────────
document.addEventListener('click', e => {
  const q = e.target.closest('.faq-q');
  if (q) q.parentElement.classList.toggle('open');
});

// ── Notifications ─────────────────────────────────────────────
function requestNotify() {
  if (!('Notification' in window)) {
    alert('Push notifications are not supported in this browser. Try Chrome or Safari.');
    return;
  }
  if (Notification.permission === 'granted') {
    document.getElementById('notifyBtn').classList.add('active');
    document.getElementById('notifyBtn').textContent = '🔔 ON';
    localStorage.setItem('cpja_notify', '1');
    alert('Notifications are enabled! You\'ll be alerted when new results are posted.');
    return;
  }
  if (Notification.permission === 'denied') {
    alert('Notifications are blocked. Please enable them in your browser settings.');
    return;
  }
  Notification.requestPermission().then(p => {
    if (p === 'granted') {
      document.getElementById('notifyBtn').classList.add('active');
      document.getElementById('notifyBtn').textContent = '🔔 ON';
      localStorage.setItem('cpja_notify', '1');
      new Notification('CashPotJA Alerts Enabled', {
        body: 'You\'ll get notified when new Cash Pot results drop!',
        icon: '/img/icon-192.png'
      });
    }
  });
}

// Check notification state on load
if (localStorage.getItem('cpja_notify') === '1' && Notification.permission === 'granted') {
  document.getElementById('notifyBtn').classList.add('active');
  document.getElementById('notifyBtn').textContent = '🔔 ON';
}

// ── Auto-refresh ──────────────────────────────────────────────
// Check for new results every 2 minutes during draw hours
setInterval(() => {
  const ja = getJANow();
  const h = ja.getHours();
  if (h >= 8 && h <= 21) {
    renderToday();
  }
  // Update countdown
  const nowHour = h + ja.getMinutes()/60;
  const nextSlot = SLOT_HOURS.findIndex(sh => sh > nowHour);
  if (nextSlot >= 0) updateCountdown(nextSlot);
}, 60000); // every 60 seconds

// ── Service Worker Registration ───────────────────────────────
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').catch(() => {});
}

// ── Initialize ────────────────────────────────────────────────
renderToday();
renderYesterday();
renderHistory();
renderMeanings();
renderStats();

// Countdown ticker
setInterval(() => {
  const ja = getJANow();
  const nowHour = ja.getHours() + ja.getMinutes()/60;
  const nextSlot = SLOT_HOURS.findIndex(sh => sh > nowHour);
  if (nextSlot >= 0) updateCountdown(nextSlot);
}, 1000);
