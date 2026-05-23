// ── CONFIG ── paste your Airtable credentials here ──────────────────────────
const AIRTABLE_API_KEY  = 'pat3b9jrp15AlPFWz.b7d51d6c388d9f6ebe5a0495085dbb1c9d64e577ca560a011a1fbf1a3026aba7';   // pat...
const AIRTABLE_BASE_ID  = 'app3VirHr5wWXuJMB';
const AIRTABLE_TABLE    = 'tblNKTn0e7oamV2Cr';
// ─────────────────────────────────────────────────────────────────────────────

const SCHOOLS = [
  'Etham Blessed Kids Centre',
  "Peace Children's Centre",
  'Janjewa Education Centre',
  'Dachi Education Centre',
  'Madoma Korando Faith Centre',
  'Damakims Community School',
];

const CLOTHING_SIZES = ['Small', 'Medium', 'Large', 'Not receiving'];
const SHOE_SIZES = ['27/9','28/10','29/11','31/12','32/13','33/1','35/2','36/3','37/4','38/5','40/6','41/7','42/8','Not receiving'];

// ── LOCAL STORAGE ─────────────────────────────────────────────────────────────
function getPending() { try { return JSON.parse(localStorage.getItem('pending') || '[]'); } catch(e){ return []; } }
function savePending(q) { localStorage.setItem('pending', JSON.stringify(q)); }
function addPending(entry) { const q = getPending(); q.push(entry); savePending(q); }

// ── AIRTABLE SYNC ─────────────────────────────────────────────────────────────
async function syncToAirtable(entry) {
  const res = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE}`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${AIRTABLE_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ records: [{ fields: entry }] })
  });
  if (!res.ok) throw new Error(await res.text());
}

async function syncPending() {
  const q = getPending();
  if (!q.length) return;
  const failed = [];
  for (const entry of q) {
    try { await syncToAirtable(entry); }
    catch(e) { failed.push(entry); }
  }
  savePending(failed);
  renderPendingBadge();
}

function renderPendingBadge() {
  const count = getPending().length;
  const badge = document.getElementById('pending-badge');
  if (badge) { badge.textContent = count; badge.style.display = count > 0 ? 'flex' : 'none'; }
  const syncBtn = document.getElementById('sync-btn');
  if (syncBtn) syncBtn.disabled = count === 0;
}

// ── APP STATE ─────────────────────────────────────────────────────────────────
let form = {};
let screen = 'home';

function goTo(s) { screen = s; render(); }

// ── RENDER ────────────────────────────────────────────────────────────────────
function render() {
  const app = document.getElementById('app');
  switch(screen) {
    case 'home':       app.innerHTML = homeHTML(); break;
    case 'school':     app.innerHTML = schoolHTML(); break;
    case 'child':      app.innerHTML = childHTML(); break;
    case 'gender':     app.innerHTML = genderHTML(); break;
    case 'age':        app.innerHTML = ageHTML(); break;
    case 'bottom':     app.innerHTML = bottomHTML(); break;
    case 'girl_top':   app.innerHTML = girlTopHTML(); break;
    case 'items':      app.innerHTML = itemsHTML(); break;
    case 'review':     app.innerHTML = reviewHTML(); break;
    case 'saved':      app.innerHTML = savedHTML(); break;
    case 'pending':    app.innerHTML = pendingHTML(); break;
  }
  renderPendingBadge();
}

// ── SCREENS ───────────────────────────────────────────────────────────────────
function homeHTML() {
  const count = getPending().length;
  return `
  <div class="screen home-screen">
    <div class="home-top">
      <div class="app-icon">👕</div>
      <h1>Uniform<br>Tracker</h1>
      <p class="subtitle">Log uniform dispatches — works offline</p>
    </div>
    <div class="home-actions">
      <button class="btn-primary" onclick="startForm()">+ Log new uniform</button>
      <button class="btn-secondary" onclick="goTo('pending')">
        Pending sync
        <span id="pending-badge" class="badge" style="display:${count>0?'flex':'none'}">${count}</span>
      </button>
    </div>
    <div class="online-status" id="online-status"></div>
  </div>`;
}

function schoolHTML() {
  return `
  <div class="screen">
    <div class="screen-header"><button class="back-btn" onclick="goTo('home')">←</button><h2>Select school</h2></div>
    <div class="list">
      ${SCHOOLS.map((s,i) => `<button class="list-item" onclick="selectSchool('${s}')">${s}</button>`).join('')}
    </div>
  </div>`;
}

function childHTML() {
  return `
  <div class="screen">
    <div class="screen-header"><button class="back-btn" onclick="goTo('school')">←</button><h2>Child's name</h2></div>
    <div class="form-body">
      <input type="text" id="child-name" class="text-input" placeholder="Full name" value="${form.childName||''}" autofocus />
      <button class="btn-primary" onclick="setChildName()">Continue</button>
    </div>
  </div>`;
}

function genderHTML() {
  return `
  <div class="screen">
    <div class="screen-header"><button class="back-btn" onclick="goTo('child')">←</button><h2>Gender</h2></div>
    <div class="list">
      <button class="list-item ${form.gender==='Boy'?'selected':''}" onclick="selectGender('Boy')">👦 Boy</button>
      <button class="list-item ${form.gender==='Girl'?'selected':''}" onclick="selectGender('Girl')">👧 Girl</button>
    </div>
  </div>`;
}

function ageHTML() {
  const ages = ['Small (Age 3–6)', 'Medium (Age 7–12)', 'Large (Age 13+)'];
  return `
  <div class="screen">
    <div class="screen-header"><button class="back-btn" onclick="goTo('gender')">←</button><h2>Age group</h2></div>
    <div class="list">
      ${ages.map(a => `<button class="list-item ${form.ageGroup===a?'selected':''}" onclick="selectAge('${a}')">${a}</button>`).join('')}
    </div>
  </div>`;
}

function bottomHTML() {
  const opts = ['Shorts only','Trousers only','Both shorts and trousers','Not receiving'];
  return `
  <div class="screen">
    <div class="screen-header"><button class="back-btn" onclick="goTo('age')">←</button><h2>Bottom wear</h2></div>
    <div class="list">
      ${opts.map(o => `<button class="list-item ${form.bottomWear===o?'selected':''}" onclick="selectBottom('${o}')">${o}</button>`).join('')}
    </div>
  </div>`;
}

function girlTopHTML() {
  const opts = ['Dress only','Skirt and blouse','Both dress and skirt/blouse','Not receiving'];
  return `
  <div class="screen">
    <div class="screen-header"><button class="back-btn" onclick="goTo('age')">←</button><h2>Top wear</h2></div>
    <div class="list">
      ${opts.map(o => `<button class="list-item ${form.girlTop===o?'selected':''}" onclick="selectGirlTop('${o}')">${o}</button>`).join('')}
    </div>
  </div>`;
}

function itemsHTML() {
  const isBoy = form.gender === 'Boy';
  const isOlderGirl = form.gender === 'Girl' && form.ageGroup && form.ageGroup.includes('13');

  const boyItems = [
    { key:'shirtSize', label:'Shirt' },
    { key:'sweaterSize', label:'Sweater' },
    { key:'tieSize', label:'Tie' },
    { key:'socksSize', label:'Socks' },
    { key:'boxersSize', label:'Boxers' },
  ];

  const girlItems = [
    { key:'sweaterSize', label:'Sweater' },
    { key:'socksSize', label:'Socks' },
    { key:'pantiesSize', label:'Panties' },
  ];

  if (isOlderGirl) girlItems.push({ key:'boobTopSize', label:'Boob top' });

  const sharedBottom = { key:'shoeSize', label:'Shoe size', sizes: SHOE_SIZES };
  const bag = { key:'bagSize', label:'Bag', sizes: ['Receiving','Not receiving'] };

  const items = isBoy ? boyItems : girlItems;

  // Add conditional bottom items
  let extraItems = [];
  if (isBoy) {
    if (form.bottomWear && form.bottomWear.includes('Shorts')) extraItems.push({ key:'shortsSize', label:'Shorts' });
    if (form.bottomWear && form.bottomWear.includes('Trousers')) extraItems.push({ key:'trousersSize', label:'Trousers' });
  } else {
    if (form.girlTop && form.girlTop.includes('Dress')) extraItems.push({ key:'dressSize', label:'Dress' });
    if (form.girlTop && (form.girlTop.includes('Skirt') || form.girlTop.includes('skirt'))) {
      extraItems.push({ key:'skirtSize', label:'Skirt' });
      extraItems.push({ key:'blouseSize', label:'Blouse' });
    }
  }

  const allItems = [...extraItems, ...items];

  function sizeSelect(key, sizes) {
    sizes = sizes || CLOTHING_SIZES;
    return `<div class="size-select">
      ${sizes.map(s => `<button class="size-btn ${form[key]===s?'active':''}" onclick="setSize('${key}','${s}')">${s}</button>`).join('')}
    </div>`;
  }

  const allReady = [...allItems, sharedBottom, bag].every(i => form[i.key]);

  return `
  <div class="screen items-screen">
    <div class="screen-header"><button class="back-btn" onclick="goTo(${isBoy?'\'bottom\'':'\'girl_top\''})">←</button><h2>${form.childName}</h2><span class="sub">${form.school}</span></div>
    <div class="items-list">
      ${allItems.map(item => `
        <div class="item-row">
          <div class="item-label">${item.label}</div>
          ${sizeSelect(item.key, item.sizes)}
        </div>`).join('')}
      <div class="item-row">
        <div class="item-label">${sharedBottom.label}</div>
        ${sizeSelect(sharedBottom.key, sharedBottom.sizes)}
      </div>
      <div class="item-row">
        <div class="item-label">${bag.label}</div>
        ${sizeSelect(bag.key, bag.sizes)}
      </div>
      <div class="item-row notes-row">
        <div class="item-label">Notes</div>
        <textarea id="notes-input" class="notes-input" placeholder="Optional...">${form.notes||''}</textarea>
      </div>
      <div class="item-row">
        <div class="item-label">Logged by</div>
        <input type="text" id="logged-by" class="text-input small" placeholder="Your name" value="${form.loggedBy||''}" />
      </div>
    </div>
    <div class="items-footer">
      <button class="btn-primary" ${allReady?'':'disabled'} onclick="goToReview()">Review & save</button>
    </div>
  </div>`;
}

function reviewHTML() {
  const isBoy = form.gender === 'Boy';
  const fields = buildAirtableFields();
  const rows = Object.entries(fields)
    .filter(([k]) => !['Logged By','Timestamp','Notes','School','Child Name','Gender','Age Group'].includes(k))
    .map(([k,v]) => `<div class="review-row"><span class="review-key">${k}</span><span class="review-val">${v}</span></div>`)
    .join('');

  return `
  <div class="screen">
    <div class="screen-header"><button class="back-btn" onclick="goTo('items')">←</button><h2>Review</h2></div>
    <div class="review-body">
      <div class="review-hero">
        <div class="review-name">${form.childName}</div>
        <div class="review-meta">${form.school}</div>
        <div class="review-meta">${form.gender} · ${form.ageGroup}</div>
      </div>
      <div class="review-items">${rows}</div>
      ${form.notes ? `<div class="review-notes">📝 ${form.notes}</div>` : ''}
      <div class="review-by">Logged by: ${form.loggedBy}</div>
    </div>
    <div class="items-footer two-btn">
      <button class="btn-secondary" onclick="goTo('items')">Edit</button>
      <button class="btn-primary" onclick="saveEntry()">Save entry</button>
    </div>
  </div>`;
}

function savedHTML() {
  const count = getPending().length;
  return `
  <div class="screen saved-screen">
    <div class="saved-icon">✅</div>
    <h2>Saved!</h2>
    <p>${form.childName}'s uniform has been saved.</p>
    ${count > 0 ? `<p class="pending-note">${count} entr${count===1?'y':'ies'} waiting to sync when online.</p>` : '<p class="synced-note">Synced to Airtable ✓</p>'}
    <div class="saved-actions">
      <button class="btn-primary" onclick="startForm()">Log another child</button>
      <button class="btn-secondary" onclick="goTo('home')">Home</button>
    </div>
  </div>`;
}

function pendingHTML() {
  const q = getPending();
  const isOnline = navigator.onLine;
  return `
  <div class="screen">
    <div class="screen-header"><button class="back-btn" onclick="goTo('home')">←</button><h2>Pending sync</h2></div>
    <div class="pending-body">
      ${q.length === 0 ? '<p class="empty">Nothing pending — all synced!</p>' :
        q.map((e,i) => `<div class="pending-item">
          <div class="pending-name">${e['Child Name']}</div>
          <div class="pending-meta">${e['School']} · ${e['Gender']}</div>
        </div>`).join('')}
    </div>
    ${q.length > 0 ? `
    <div class="items-footer">
      <button id="sync-btn" class="btn-primary" onclick="doSync()" ${isOnline?'':'disabled'}>
        ${isOnline ? `Sync ${q.length} entr${q.length===1?'y':'ies'} now` : 'No internet — sync when online'}
      </button>
    </div>` : ''}
  </div>`;
}

// ── ACTIONS ───────────────────────────────────────────────────────────────────
function startForm() { form = {}; goTo('school'); }

function selectSchool(s) { form.school = s; goTo('child'); }

function setChildName() {
  const v = document.getElementById('child-name').value.trim();
  if (!v) return;
  form.childName = v; goTo('gender');
}

function selectGender(g) { form.gender = g; goTo('age'); }

function selectAge(a) {
  form.ageGroup = a;
  form.isOlderGirl = form.gender === 'Girl' && a.includes('13');
  goTo(form.gender === 'Boy' ? 'bottom' : 'girl_top');
}

function selectBottom(b) {
  form.bottomWear = b;
  if (b === 'Not receiving') { form.shortsSize = 'Not receiving'; form.trousersSize = 'Not receiving'; }
  else {
    if (!b.includes('Shorts')) form.shortsSize = 'Not receiving';
    if (!b.includes('Trousers')) form.trousersSize = 'Not receiving';
  }
  goTo('items');
}

function selectGirlTop(t) {
  form.girlTop = t;
  if (t === 'Not receiving') { form.dressSize='Not receiving'; form.skirtSize='Not receiving'; form.blouseSize='Not receiving'; }
  else {
    if (!t.includes('Dress')) form.dressSize = 'Not receiving';
    if (!t.includes('Skirt') && !t.includes('skirt')) { form.skirtSize='Not receiving'; form.blouseSize='Not receiving'; }
  }
  goTo('items');
}

function setSize(key, val) { form[key] = val; render(); }

function goToReview() {
  form.notes = document.getElementById('notes-input')?.value || '';
  form.loggedBy = document.getElementById('logged-by')?.value || 'Unknown';
  goTo('review');
}

function buildAirtableFields() {
  const fields = {
    'School': form.school,
    'Child Name': form.childName,
    'Gender': form.gender,
    'Age Group': form.ageGroup,
    'Sweater Size': form.sweaterSize || 'Not receiving',
    'Socks Size': form.socksSize || 'Not receiving',
    'Shoe Size': form.shoeSize || 'Not receiving',
    'Bag': form.bagSize || 'Not receiving',
    'Notes': form.notes || '',
    'Logged By': form.loggedBy,
    'Timestamp': new Date().toISOString(),
  };
  if (form.gender === 'Boy') {
    fields['Shorts Size'] = form.shortsSize || 'Not receiving';
    fields['Trousers Size'] = form.trousersSize || 'Not receiving';
    fields['Shirt Size'] = form.shirtSize || 'Not receiving';
    fields['Tie Size'] = form.tieSize || 'Not receiving';
    fields['Boxers Size'] = form.boxersSize || 'Not receiving';
  } else {
    fields['Dress Size'] = form.dressSize || 'Not receiving';
    fields['Skirt Size'] = form.skirtSize || 'Not receiving';
    fields['Blouse Size'] = form.blouseSize || 'Not receiving';
    fields['Panties Size'] = form.pantiesSize || 'Not receiving';
    fields['Boob Top Size'] = form.boobTopSize || 'Not receiving';
  }
  return fields;
}

async function saveEntry() {
  const fields = buildAirtableFields();
  if (navigator.onLine) {
    try {
      await syncToAirtable(fields);
    } catch(e) {
      addPending(fields);
    }
  } else {
    addPending(fields);
  }
  goTo('saved');
}

async function doSync() {
  const btn = document.getElementById('sync-btn');
  if (btn) { btn.textContent = 'Syncing…'; btn.disabled = true; }
  await syncPending();
  render();
}

// ── ONLINE/OFFLINE ─────────────────────────────────────────────────────────────
function updateOnlineStatus() {
  const el = document.getElementById('online-status');
  if (el) el.innerHTML = navigator.onLine
    ? '<span class="online">● Online</span>'
    : '<span class="offline">● Offline — entries saved locally</span>';
  if (navigator.onLine) syncPending();
}

window.addEventListener('online', () => { updateOnlineStatus(); syncPending(); render(); });
window.addEventListener('offline', updateOnlineStatus);

// ── SERVICE WORKER ────────────────────────────────────────────────────────────
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js');
}

// ── INIT ──────────────────────────────────────────────────────────────────────
render();
updateOnlineStatus();
stevekariithi@Steves-MacBook-Air uniform-pwa % curl -X POST "https://api.airtable.com/v0/app3VirHr5wWXuJMB/tblNKTn0e7oamV2Cr" \
  -H "Authorization: Bearer pat3b9jrp15AlPFWz.b7d51d6c388d9f6ebe5a0495085dbb1c9d64e577ca560a011a1fbf1a3026aba7" \
  -H "Content-Type: application/json" \
  -d '{"records":[{"fields":{"Name":"Test"}}]}'
{"records":[{"id":"recdgZjZkwRRHP7cz","createdTime":"2026-05-23T13:01:36.000Z","fields":{"Name":"Test"}}]}%                                                                                               stevekariithi@Steves-MacBook-Air uniform-pwa % sed -i '' 's/tblQksefHAIq1exBB/tblNKTn0e7oamV2Cr/' "/Users/stevekariithi/Desktop/US trip receipts/uniform-pwa/app.js"
stevekariithi@Steves-MacBook-Air uniform-pwa % grep "AIRTABLE_TABLE" "/Users/stevekariithi/Desktop/US trip receipts/uniform-pwa/app.js"
const AIRTABLE_TABLE    = 'tblNKTn0e7oamV2Cr';
  const res = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE}`, {
stevekariithi@Steves-MacBook-Air uniform-pwa % curl -X POST "https://api.airtable.com/v0/app3VirHr5wWXuJMB/tblNKTn0e7oamV2Cr" \
  -H "Authorization: Bearer pat3b9jrp15AlPFWz.b7d51d6c388d9f6ebe5a0495085dbb1c9d64e577ca560a011a1fbf1a3026aba7" \
  -H "Content-Type: application/json" \
  -d '{"records":[{"fields":{"School":"Test","Child Name":"Test Child","Gender":"Boy","Age Group":"Small (Age 3-6)","Sweater Size":"Small","Socks Size":"Small","Shoe Size":"27/9","Bag":"Receiving","Logged By":"Test","Shorts Size":"Small","Trousers Size":"Not receiving","Shirt Size":"Small","Tie Size":"Small","Boxers Size":"Small"}}]}'
{"records":[{"id":"recpthsaPfVIpq7gJ","createdTime":"2026-05-23T13:20:42.000Z","fields":{"Age Group":"Small (Age 3-6)","Sweater Size":"Small","School":"Test","Bag":"Receiving","Logged By":"Test","Shorts Size":"Small","Child Name":"Test Child","Gender":"Boy","Shoe Size":"27/9","Trousers Size":"Not receiving","Tie Size":"Small","Boxers Size":"Small","Shirt Size":"Small","Socks Size":"Small"}}]}%        stevekariithi@Steves-MacBook-Air uniform-pwa % cat "/Users/stevekariithi/Desktop/US trip receipts/uniform-pwa/app.js"
// ── CONFIG ── paste your Airtable credentials here ──────────────────────────
const AIRTABLE_API_KEY  = 'pat3b9jrp15AlPFWz.b7d51d6c388d9f6ebe5a0495085dbb1c9d64e577ca560a011a1fbf1a3026aba7';   // pat...
const AIRTABLE_BASE_ID  = 'app3VirHr5wWXuJMB';
const AIRTABLE_TABLE    = 'tblNKTn0e7oamV2Cr';
// ─────────────────────────────────────────────────────────────────────────────

const SCHOOLS = [
  'Etham Blessed Kids Centre',
  "Peace Children's Centre",
  'Janjewa Education Centre',
  'Dachi Education Centre',
  'Madoma Korando Faith Centre',
  'Damakims Community School',
];

const CLOTHING_SIZES = ['Small', 'Medium', 'Large', 'Not receiving'];
const SHOE_SIZES = ['27/9','28/10','29/11','31/12','32/13','33/1','35/2','36/3','37/4','38/5','40/6','41/7','42/8','Not receiving'];

// ── LOCAL STORAGE ─────────────────────────────────────────────────────────────
function getPending() { try { return JSON.parse(localStorage.getItem('pending') || '[]'); } catch(e){ return []; } }
function savePending(q) { localStorage.setItem('pending', JSON.stringify(q)); }
function addPending(entry) { const q = getPending(); q.push(entry); savePending(q); }

// ── AIRTABLE SYNC ─────────────────────────────────────────────────────────────
async function syncToAirtable(entry) {
  const res = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE}`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${AIRTABLE_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ records: [{ fields: entry }] })
  });
  if (!res.ok) throw new Error(await res.text());
}

async function syncPending() {
  const q = getPending();
  if (!q.length) return;
  const failed = [];
  for (const entry of q) {
    try { await syncToAirtable(entry); }
    catch(e) { failed.push(entry); }
  }
  savePending(failed);
  renderPendingBadge();
}

function renderPendingBadge() {
  const count = getPending().length;
  const badge = document.getElementById('pending-badge');
  if (badge) { badge.textContent = count; badge.style.display = count > 0 ? 'flex' : 'none'; }
  const syncBtn = document.getElementById('sync-btn');
  if (syncBtn) syncBtn.disabled = count === 0;
}

// ── APP STATE ─────────────────────────────────────────────────────────────────
let form = {};
let screen = 'home';

function goTo(s) { screen = s; render(); }

// ── RENDER ────────────────────────────────────────────────────────────────────
function render() {
  const app = document.getElementById('app');
  switch(screen) {
    case 'home':       app.innerHTML = homeHTML(); break;
    case 'school':     app.innerHTML = schoolHTML(); break;
    case 'child':      app.innerHTML = childHTML(); break;
    case 'gender':     app.innerHTML = genderHTML(); break;
    case 'age':        app.innerHTML = ageHTML(); break;
    case 'bottom':     app.innerHTML = bottomHTML(); break;
    case 'girl_top':   app.innerHTML = girlTopHTML(); break;
    case 'items':      app.innerHTML = itemsHTML(); break;
    case 'review':     app.innerHTML = reviewHTML(); break;
    case 'saved':      app.innerHTML = savedHTML(); break;
    case 'pending':    app.innerHTML = pendingHTML(); break;
  }
  renderPendingBadge();
}

// ── SCREENS ───────────────────────────────────────────────────────────────────
function homeHTML() {
  const count = getPending().length;
  return `
  <div class="screen home-screen">
    <div class="home-top">
      <div class="app-icon">👕</div>
      <h1>Uniform<br>Tracker</h1>
      <p class="subtitle">Log uniform dispatches — works offline</p>
    </div>
    <div class="home-actions">
      <button class="btn-primary" onclick="startForm()">+ Log new uniform</button>
      <button class="btn-secondary" onclick="goTo('pending')">
        Pending sync
        <span id="pending-badge" class="badge" style="display:${count>0?'flex':'none'}">${count}</span>
      </button>
    </div>
    <div class="online-status" id="online-status"></div>
  </div>`;
}

function schoolHTML() {
  return `
  <div class="screen">
    <div class="screen-header"><button class="back-btn" onclick="goTo('home')">←</button><h2>Select school</h2></div>
    <div class="list">
      ${SCHOOLS.map((s,i) => `<button class="list-item" onclick="selectSchool('${s}')">${s}</button>`).join('')}
    </div>
  </div>`;
}

function childHTML() {
  return `
  <div class="screen">
    <div class="screen-header"><button class="back-btn" onclick="goTo('school')">←</button><h2>Child's name</h2></div>
    <div class="form-body">
      <input type="text" id="child-name" class="text-input" placeholder="Full name" value="${form.childName||''}" autofocus />
      <button class="btn-primary" onclick="setChildName()">Continue</button>
    </div>
  </div>`;
}

function genderHTML() {
  return `
  <div class="screen">
    <div class="screen-header"><button class="back-btn" onclick="goTo('child')">←</button><h2>Gender</h2></div>
    <div class="list">
      <button class="list-item ${form.gender==='Boy'?'selected':''}" onclick="selectGender('Boy')">👦 Boy</button>
      <button class="list-item ${form.gender==='Girl'?'selected':''}" onclick="selectGender('Girl')">👧 Girl</button>
    </div>
  </div>`;
}

function ageHTML() {
  const ages = ['Small (Age 3–6)', 'Medium (Age 7–12)', 'Large (Age 13+)'];
  return `
  <div class="screen">
    <div class="screen-header"><button class="back-btn" onclick="goTo('gender')">←</button><h2>Age group</h2></div>
    <div class="list">
      ${ages.map(a => `<button class="list-item ${form.ageGroup===a?'selected':''}" onclick="selectAge('${a}')">${a}</button>`).join('')}
    </div>
  </div>`;
}

function bottomHTML() {
  const opts = ['Shorts only','Trousers only','Both shorts and trousers','Not receiving'];
  return `
  <div class="screen">
    <div class="screen-header"><button class="back-btn" onclick="goTo('age')">←</button><h2>Bottom wear</h2></div>
    <div class="list">
      ${opts.map(o => `<button class="list-item ${form.bottomWear===o?'selected':''}" onclick="selectBottom('${o}')">${o}</button>`).join('')}
    </div>
  </div>`;
}

function girlTopHTML() {
  const opts = ['Dress only','Skirt and blouse','Both dress and skirt/blouse','Not receiving'];
  return `
  <div class="screen">
    <div class="screen-header"><button class="back-btn" onclick="goTo('age')">←</button><h2>Top wear</h2></div>
    <div class="list">
      ${opts.map(o => `<button class="list-item ${form.girlTop===o?'selected':''}" onclick="selectGirlTop('${o}')">${o}</button>`).join('')}
    </div>
  </div>`;
}

function itemsHTML() {
  const isBoy = form.gender === 'Boy';
  const isOlderGirl = form.gender === 'Girl' && form.ageGroup && form.ageGroup.includes('13');

  const boyItems = [
    { key:'shirtSize', label:'Shirt' },
    { key:'sweaterSize', label:'Sweater' },
    { key:'tieSize', label:'Tie' },
    { key:'socksSize', label:'Socks' },
    { key:'boxersSize', label:'Boxers' },
  ];

  const girlItems = [
    { key:'sweaterSize', label:'Sweater' },
    { key:'socksSize', label:'Socks' },
    { key:'pantiesSize', label:'Panties' },
  ];

  if (isOlderGirl) girlItems.push({ key:'boobTopSize', label:'Boob top' });

  const sharedBottom = { key:'shoeSize', label:'Shoe size', sizes: SHOE_SIZES };
  const bag = { key:'bagSize', label:'Bag', sizes: ['Receiving','Not receiving'] };

  const items = isBoy ? boyItems : girlItems;

  // Add conditional bottom items
  let extraItems = [];
  if (isBoy) {
    if (form.bottomWear && form.bottomWear.includes('Shorts')) extraItems.push({ key:'shortsSize', label:'Shorts' });
    if (form.bottomWear && form.bottomWear.includes('Trousers')) extraItems.push({ key:'trousersSize', label:'Trousers' });
  } else {
    if (form.girlTop && form.girlTop.includes('Dress')) extraItems.push({ key:'dressSize', label:'Dress' });
    if (form.girlTop && (form.girlTop.includes('Skirt') || form.girlTop.includes('skirt'))) {
      extraItems.push({ key:'skirtSize', label:'Skirt' });
      extraItems.push({ key:'blouseSize', label:'Blouse' });
    }
  }

  const allItems = [...extraItems, ...items];

  function sizeSelect(key, sizes) {
    sizes = sizes || CLOTHING_SIZES;
    return `<div class="size-select">
      ${sizes.map(s => `<button class="size-btn ${form[key]===s?'active':''}" onclick="setSize('${key}','${s}')">${s}</button>`).join('')}
    </div>`;
  }

  const allReady = [...allItems, sharedBottom, bag].every(i => form[i.key]);

  return `
  <div class="screen items-screen">
    <div class="screen-header"><button class="back-btn" onclick="goTo(${isBoy?'\'bottom\'':'\'girl_top\''})">←</button><h2>${form.childName}</h2><span class="sub">${form.school}</span></div>
    <div class="items-list">
      ${allItems.map(item => `
        <div class="item-row">
          <div class="item-label">${item.label}</div>
          ${sizeSelect(item.key, item.sizes)}
        </div>`).join('')}
      <div class="item-row">
        <div class="item-label">${sharedBottom.label}</div>
        ${sizeSelect(sharedBottom.key, sharedBottom.sizes)}
      </div>
      <div class="item-row">
        <div class="item-label">${bag.label}</div>
        ${sizeSelect(bag.key, bag.sizes)}
      </div>
      <div class="item-row notes-row">
        <div class="item-label">Notes</div>
        <textarea id="notes-input" class="notes-input" placeholder="Optional...">${form.notes||''}</textarea>
      </div>
      <div class="item-row">
        <div class="item-label">Logged by</div>
        <input type="text" id="logged-by" class="text-input small" placeholder="Your name" value="${form.loggedBy||''}" />
      </div>
    </div>
    <div class="items-footer">
      <button class="btn-primary" ${allReady?'':'disabled'} onclick="goToReview()">Review & save</button>
    </div>
  </div>`;
}

function reviewHTML() {
  const isBoy = form.gender === 'Boy';
  const fields = buildAirtableFields();
  const rows = Object.entries(fields)
    .filter(([k]) => !['Logged By','Timestamp','Notes','School','Child Name','Gender','Age Group'].includes(k))
    .map(([k,v]) => `<div class="review-row"><span class="review-key">${k}</span><span class="review-val">${v}</span></div>`)
    .join('');

  return `
  <div class="screen">
    <div class="screen-header"><button class="back-btn" onclick="goTo('items')">←</button><h2>Review</h2></div>
    <div class="review-body">
      <div class="review-hero">
        <div class="review-name">${form.childName}</div>
        <div class="review-meta">${form.school}</div>
        <div class="review-meta">${form.gender} · ${form.ageGroup}</div>
      </div>
      <div class="review-items">${rows}</div>
      ${form.notes ? `<div class="review-notes">📝 ${form.notes}</div>` : ''}
      <div class="review-by">Logged by: ${form.loggedBy}</div>
    </div>
    <div class="items-footer two-btn">
      <button class="btn-secondary" onclick="goTo('items')">Edit</button>
      <button class="btn-primary" onclick="saveEntry()">Save entry</button>
    </div>
  </div>`;
}

function savedHTML() {
  const count = getPending().length;
  return `
  <div class="screen saved-screen">
    <div class="saved-icon">✅</div>
    <h2>Saved!</h2>
    <p>${form.childName}'s uniform has been saved.</p>
    ${count > 0 ? `<p class="pending-note">${count} entr${count===1?'y':'ies'} waiting to sync when online.</p>` : '<p class="synced-note">Synced to Airtable ✓</p>'}
    <div class="saved-actions">
      <button class="btn-primary" onclick="startForm()">Log another child</button>
      <button class="btn-secondary" onclick="goTo('home')">Home</button>
    </div>
  </div>`;
}

function pendingHTML() {
  const q = getPending();
  const isOnline = navigator.onLine;
  return `
  <div class="screen">
    <div class="screen-header"><button class="back-btn" onclick="goTo('home')">←</button><h2>Pending sync</h2></div>
    <div class="pending-body">
      ${q.length === 0 ? '<p class="empty">Nothing pending — all synced!</p>' :
        q.map((e,i) => `<div class="pending-item">
          <div class="pending-name">${e['Child Name']}</div>
          <div class="pending-meta">${e['School']} · ${e['Gender']}</div>
        </div>`).join('')}
    </div>
    ${q.length > 0 ? `
    <div class="items-footer">
      <button id="sync-btn" class="btn-primary" onclick="doSync()" ${isOnline?'':'disabled'}>
        ${isOnline ? `Sync ${q.length} entr${q.length===1?'y':'ies'} now` : 'No internet — sync when online'}
      </button>
    </div>` : ''}
  </div>`;
}

// ── ACTIONS ───────────────────────────────────────────────────────────────────
function startForm() { form = {}; goTo('school'); }

function selectSchool(s) { form.school = s; goTo('child'); }

function setChildName() {
  const v = document.getElementById('child-name').value.trim();
  if (!v) return;
  form.childName = v; goTo('gender');
}

function selectGender(g) { form.gender = g; goTo('age'); }

function selectAge(a) {
  form.ageGroup = a;
  form.isOlderGirl = form.gender === 'Girl' && a.includes('13');
  goTo(form.gender === 'Boy' ? 'bottom' : 'girl_top');
}

function selectBottom(b) {
  form.bottomWear = b;
  if (b === 'Not receiving') { form.shortsSize = 'Not receiving'; form.trousersSize = 'Not receiving'; }
  else {
    if (!b.includes('Shorts')) form.shortsSize = 'Not receiving';
    if (!b.includes('Trousers')) form.trousersSize = 'Not receiving';
  }
  goTo('items');
}

function selectGirlTop(t) {
  form.girlTop = t;
  if (t === 'Not receiving') { form.dressSize='Not receiving'; form.skirtSize='Not receiving'; form.blouseSize='Not receiving'; }
  else {
    if (!t.includes('Dress')) form.dressSize = 'Not receiving';
    if (!t.includes('Skirt') && !t.includes('skirt')) { form.skirtSize='Not receiving'; form.blouseSize='Not receiving'; }
  }
  goTo('items');
}

function setSize(key, val) { form[key] = val; render(); }

function goToReview() {
  form.notes = document.getElementById('notes-input')?.value || '';
  form.loggedBy = document.getElementById('logged-by')?.value || 'Unknown';
  goTo('review');
}

function buildAirtableFields() {
  const fields = {
    'School': form.school,
    'Child Name': form.childName,
    'Gender': form.gender,
    'Age Group': form.ageGroup,
    'Sweater Size': form.sweaterSize || 'Not receiving',
    'Socks Size': form.socksSize || 'Not receiving',
    'Shoe Size': form.shoeSize || 'Not receiving',
    'Bag': form.bagSize || 'Not receiving',
    'Notes': form.notes || '',
    'Logged By': form.loggedBy,
    'Timestamp': new Date().toISOString(),
  };
  if (form.gender === 'Boy') {
    fields['Shorts Size'] = form.shortsSize || 'Not receiving';
    fields['Trousers Size'] = form.trousersSize || 'Not receiving';
    fields['Shirt Size'] = form.shirtSize || 'Not receiving';
    fields['Tie Size'] = form.tieSize || 'Not receiving';
    fields['Boxers Size'] = form.boxersSize || 'Not receiving';
  } else {
    fields['Dress Size'] = form.dressSize || 'Not receiving';
    fields['Skirt Size'] = form.skirtSize || 'Not receiving';
    fields['Blouse Size'] = form.blouseSize || 'Not receiving';
    fields['Panties Size'] = form.pantiesSize || 'Not receiving';
    fields['Boob Top Size'] = form.boobTopSize || 'Not receiving';
  }
  return fields;
}

async function saveEntry() {
  const fields = buildAirtableFields();
  if (navigator.onLine) {
    try {
      await syncToAirtable(fields);
    } catch(e) {
      addPending(fields);
    }
  } else {
    addPending(fields);
  }
  goTo('saved');
}

async function doSync() {
  const btn = document.getElementById('sync-btn');
  if (btn) { btn.textContent = 'Syncing…'; btn.disabled = true; }
  await syncPending();
  render();
}

// ── ONLINE/OFFLINE ─────────────────────────────────────────────────────────────
function updateOnlineStatus() {
  const el = document.getElementById('online-status');
  if (el) el.innerHTML = navigator.onLine
    ? '<span class="online">● Online</span>'
    : '<span class="offline">● Offline — entries saved locally</span>';
  if (navigator.onLine) syncPending();
}

window.addEventListener('online', () => { updateOnlineStatus(); syncPending(); render(); });
window.addEventListener('offline', updateOnlineStatus);

// ── SERVICE WORKER ────────────────────────────────────────────────────────────
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js');
}

// ── INIT ──────────────────────────────────────────────────────────────────────
render();
updateOnlineStatus();
