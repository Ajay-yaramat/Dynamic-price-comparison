/* ══ PriceScout v3 ══════════════════════════════════════════════ */
const API = '';
let user    = null;
let results = [];
let query   = '';
let bc      = {};        // buy context
let pendingUrl = '';

/* ── Boot ───────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  loadCats();
  const s = sessionStorage.getItem('psU');
  if (s) setUser(JSON.parse(s), false);
});

/* ── Pages ───────────────────────────────────────────────────── */
function goHome() {
  ['pgHome','pgResults','pgAccount'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
  });
  document.getElementById('pgHome').style.display = '';
  document.getElementById('navSearch').style.display = 'none';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function goPage(p) {
  ['pgHome','pgResults','pgAccount'].forEach(id => {
    document.getElementById(id).style.display = 'none';
  });
  document.getElementById('pg' + p.charAt(0).toUpperCase() + p.slice(1)).style.display = '';
  const showNavSearch = (p !== 'home');
  document.getElementById('navSearch').style.display = showNavSearch ? '' : 'none';
  if (p === 'account') {
    if (!user) { showModal('loginModal'); goHome(); return; }
    loadAccountPage();
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ── Categories ─────────────────────────────────────────────── */
async function loadCats() {
  try {
    const r = await fetch(`${API}/api/categories`);
    const d = await r.json();
    document.getElementById('catsGrid').innerHTML = d.categories.map((c, i) => `
      <div class="cat-card" style="animation-delay:${i * .08}s" onclick="search('${c.key}')">
        <div class="cat-ico">${c.icon}</div>
        <div class="cat-label">${c.label}</div>
        <div class="cat-desc">${c.desc}</div>
        <span class="cat-count">${c.count} products</span>
      </div>`).join('');
  } catch(e) { console.warn(e); }
}

/* ── Search ─────────────────────────────────────────────────── */
async function search(q) {
  if (!q || !q.trim()) return;
  query = q.trim();
  showLoader(true, 'Fetching prices…');
  try {
    const r = await fetch(`${API}/api/search?q=${encodeURIComponent(query)}`);
    const d = await r.json();
    results = d.results || [];
    showLoader(false);
    renderResults(d);
    goPage('results');
  } catch(e) {
    showLoader(false);
    toast('❌ Server not running. Start Node.js: npm start');
  }
}

/* ── Render ─────────────────────────────────────────────────── */
function renderResults(d) {
  const cat = (d.category || query);
  document.getElementById('resHeading').textContent =
    cat.charAt(0).toUpperCase() + cat.slice(1) + 's';
  document.getElementById('resSub').textContent =
    results.length ? `${results.length} products found · Click Amazon or Flipkart to buy` : '';

  renderCards(results);
}

function renderCards(list) {
  const g = document.getElementById('prodGrid');
  if (!list.length) {
    g.innerHTML = `<div class="no-res"><div class="no-res-ico">🔍</div>
      <h3>No products found</h3>
      <p>Try: laptop, smartphone, headphones, television, refrigerator</p></div>`;
    return;
  }

  g.innerHTML = list.map((p, i) => {
    const stars = '★'.repeat(Math.floor(p.rating)) + '☆'.repeat(5 - Math.floor(p.rating));
    return `
    <div class="pcard" style="animation-delay:${i * .05}s">
      <div class="pc-img-wrap">
        <img src="${p.img}" alt="${p.name}" onerror="this.src='https://via.placeholder.com/200x200/1a1a2e/f5c518?text=No+Image'"/>
        <span class="pc-disc">${p.discount}% OFF</span>
      </div>
      <div class="pc-body">
        <div class="pc-name">${p.name}</div>
        <div class="pc-price-row">
          <div class="pc-price">₹${fmt(p.price)}</div>
          <div class="pc-mrp">₹${fmt(p.mrp)}</div>
        </div>
        <div class="pc-rating">
          <span class="stars">${stars.slice(0,5)}</span>
          ${p.rating} (${p.reviews.toLocaleString()} reviews)
        </div>
        <div class="pc-btns">
          <button class="btn-amz" onclick="openStore('${encodeURIComponent(p.amazonUrl)}','Amazon')">
            🛒 Amazon
          </button>
          <button class="btn-fk" onclick="openStore('${encodeURIComponent(p.flipkartUrl)}','Flipkart')">
            🏪 Flipkart
          </button>
          <button class="btn-buy" onclick="startBuy(${JSON.stringify(p).split('"').join('&quot;')})">
            💳 Buy Now — ₹${fmt(p.price)}
          </button>
        </div>
      </div>
    </div>`;
  }).join('');
}

/* ── Sort ───────────────────────────────────────────────────── */
function sort(key) {
  document.querySelectorAll('.sort-btn').forEach(b => b.classList.remove('on'));
  document.getElementById('sb-' + key).classList.add('on');
  const sorted = [...results];
  if (key === 'price')    sorted.sort((a,b) => a.price - b.price);
  if (key === 'rating')   sorted.sort((a,b) => b.rating - a.rating);
  if (key === 'discount') sorted.sort((a,b) => b.discount - a.discount);
  renderCards(sorted);
}

/* ── Direct store opener ─────────────────────────────────────── */
function openStore(encodedUrl, storeName) {
  const url = decodeURIComponent(encodedUrl);
  toast(`🔗 Opening ${storeName}…`);
  setTimeout(() => window.open(url, '_blank'), 300);
}

/* ══ BUY FLOW ════════════════════════════════════════════════════ */
function startBuy(p) {
  bc = {
    id: p.id,
    name: p.name,
    img: p.img,
    price: p.price,
    mrp: p.mrp,
    discount: p.discount,
    amazonUrl: p.amazonUrl,
    flipkartUrl: p.flipkartUrl,
    payMethod: null,
    upiId: null,
    cardLast4: null,
    bank: null,
    chosenStore: 'Amazon',
    chosenUrl: p.amazonUrl,
  };

  // Populate step 1
  document.getElementById('bImg').src = p.img;
  document.getElementById('bImg').onerror = function(){ this.src='https://via.placeholder.com/80x80/1a1a2e/f5c518?text=IMG'; };
  document.getElementById('bName').textContent = p.name;
  document.getElementById('bStoreLine').textContent = 'Amazon & Flipkart';
  document.getElementById('bPrice').textContent = '₹' + fmt(p.price);
  document.getElementById('bStore').textContent = 'Amazon / Flipkart';
  document.getElementById('bMRP').textContent = '₹' + fmt(p.mrp);
  document.getElementById('bDisc').textContent = `Save ₹${fmt(p.mrp - p.price)} (${p.discount}% off)`;
  document.getElementById('bTotal').textContent = '₹' + fmt(p.price);
  document.getElementById('bStoreNote').textContent = 'Amazon or Flipkart';
  document.getElementById('codAmt').textContent = '₹' + fmt(p.price + 40);

  bStep(1);
  showModal('buyModal');
}

function bStep(n) {
  [1,2,3].forEach(s => {
    document.getElementById('bs' + s).style.display = s === n ? '' : 'none';
    const si = document.getElementById('si' + s);
    si.classList.remove('on','done');
    if (s < n) si.classList.add('done');
    if (s === n) si.classList.add('on');
  });
  if (n === 3) fillConfirm();
}

function payTab(m, btn) {
  document.querySelectorAll('.ptab').forEach(b => b.classList.remove('on'));
  btn.classList.add('on');
  ['UPI','Card','NB','COD'].forEach(t => {
    document.getElementById('pp' + t).style.display = 'none';
  });
  const map = { upi:'UPI', card:'Card', nb:'NB', cod:'COD' };
  document.getElementById('pp' + map[m]).style.display = '';
  bc.payMethod = m;
}

function pickUPI(el, app) {
  document.querySelectorAll('.uapp').forEach(a => a.classList.remove('sel'));
  el.classList.add('sel');
  bc.upiId = app;
}

function pickBank(el, b) {
  document.querySelectorAll('.bk').forEach(x => x.classList.remove('sel'));
  el.classList.add('sel');
  bc.bank = b;
  document.getElementById('bkTxt').textContent = `✓ ${b} selected`;
}

function fmtC(input) {
  let v = input.value.replace(/\D/g,'').substring(0,16);
  input.value = v.replace(/(.{4})/g,'$1 ').trim();
  document.getElementById('cNumD').textContent =
    (v.padEnd(16,'•')).replace(/(.{4})/g,'$1 ').trim();
  if (v.length >= 4) bc.cardLast4 = v.slice(-4);
}

function fmtE(input) {
  let v = input.value.replace(/\D/g,'');
  if (v.length >= 3) v = v.substring(0,2) + '/' + v.substring(2,4);
  input.value = v;
  document.getElementById('cExpD').textContent = v || 'MM/YY';
}

function fillConfirm() {
  const isCOD = bc.payMethod === 'cod';
  const total = isCOD ? bc.price + 40 : bc.price;

  document.getElementById('cf1').textContent = bc.name.substring(0, 50) + (bc.name.length > 50 ? '…' : '');
  document.getElementById('cf2').textContent = 'Amazon & Flipkart';
  document.getElementById('cf3').textContent = '₹' + fmt(total) + (isCOD ? ' (+ ₹40 COD)' : '');
  document.getElementById('cf5').textContent = new Date(Date.now() + 5 * 86400000).toDateString();

  let pm = 'Not selected';
  if (bc.payMethod === 'upi')  pm = `📱 UPI${bc.upiId ? ' — ' + bc.upiId : ''}`;
  if (bc.payMethod === 'card') pm = `💳 Card${bc.cardLast4 ? ' ···· ' + bc.cardLast4 : ''}`;
  if (bc.payMethod === 'nb')   pm = `🏦 Net Banking${bc.bank ? ' — ' + bc.bank : ''}`;
  if (bc.payMethod === 'cod')  pm = '💵 Cash on Delivery';
  document.getElementById('cf4').textContent = pm;
}

async function placeOrder() {
  // Validation
  if (!bc.payMethod) { toast('⚠️ Please select a payment method'); bStep(2); return; }
  if (bc.payMethod === 'upi') {
    const v = document.getElementById('upiId').value.trim();
    if (v) bc.upiId = v;
    if (!bc.upiId) { toast('⚠️ Select a UPI app or enter UPI ID'); return; }
  }
  if (bc.payMethod === 'card') {
    const n = document.getElementById('cNum').value.replace(/\s/g,'');
    if (n.length < 16) { toast('⚠️ Enter a valid 16-digit card number'); return; }
    if (!document.getElementById('cHol').value) { toast('⚠️ Enter card holder name'); return; }
    if (document.getElementById('cExp').value.length < 5) { toast('⚠️ Enter expiry MM/YY'); return; }
    if (document.getElementById('cCVV').value.length < 3) { toast('⚠️ Enter 3-digit CVV'); return; }
    bc.cardLast4 = n.slice(-4);
  }
  if (bc.payMethod === 'nb' && !bc.bank) { toast('⚠️ Please select a bank'); return; }

  showLoader(true, 'Confirming order…');

  // Choose store: prefer Amazon
  bc.chosenStore = 'Amazon';
  bc.chosenUrl   = bc.amazonUrl;
  pendingUrl     = bc.chosenUrl;

  try {
    const res = await fetch(`${API}/api/order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: user?.email || '',
        productId: bc.id,
        productName: bc.name,
        store: bc.chosenStore,
        price: bc.price,
        paymentMethod: bc.payMethod,
        cardLast4: bc.cardLast4 || null,
        upiId: bc.upiId || null,
        bankName: bc.bank || null,
      })
    });
    const d = await res.json();
    showLoader(false);
    hideModal('buyModal');
    showSuccess(d.order || { orderId: 'PS' + Date.now(), productName: bc.name, store: bc.chosenStore, price: bc.price, paymentMethod: bc.payMethod, status: 'Confirmed', deliveryDate: new Date(Date.now()+5*86400000).toISOString().split('T')[0] });
  } catch(e) {
    showLoader(false);
    hideModal('buyModal');
    // Still show success + open store even if server is offline
    showSuccess({ orderId:'PS'+Date.now(), productName:bc.name, store:bc.chosenStore, price:bc.price, paymentMethod:bc.payMethod, status:'Confirmed', deliveryDate:new Date(Date.now()+5*86400000).toISOString().split('T')[0] });
  }
}

function showSuccess(o) {
  const isCOD = o.paymentMethod === 'cod';
  document.getElementById('succBox').innerHTML = `
    <strong>Order ID:</strong> ${o.orderId}<br>
    <strong>Product:</strong> ${(o.productName||'').substring(0,55)}<br>
    <strong>Amount:</strong> ₹${fmt(isCOD ? o.price+40 : o.price)}<br>
    <strong>Payment:</strong> ${(o.paymentMethod||'').toUpperCase()}<br>
    <strong>Est. Delivery:</strong> ${o.deliveryDate}
  `;
  showModal('successModal');
}

function openStore() {
  hideModal('successModal');
  if (pendingUrl) {
    toast('🔗 Opening store…');
    setTimeout(() => window.open(pendingUrl, '_blank'), 300);
  }
}

/* ══ AUTH ════════════════════════════════════════════════════════ */
async function register() {
  const name = document.getElementById('rgName').value.trim();
  const email = document.getElementById('rgEmail').value.trim();
  const pass  = document.getElementById('rgPass').value;
  const fb    = document.getElementById('rgFb');
  if (!name||!email||!pass) { setFb(fb,'All fields required','err'); return; }
  if (pass.length < 6) { setFb(fb,'Password must be 6+ characters','err'); return; }
  try {
    const r = await fetch(`${API}/api/register`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({name,email,password:pass}) });
    const d = await r.json();
    if (d.success) {
      setFb(fb,'✓ Account created!','ok');
      setTimeout(() => { hideModal('registerModal'); setUser(d.user); }, 700);
    } else setFb(fb, d.error,'err');
  } catch(e) { setFb(fb,'Server error','err'); }
}

async function login() {
  const email = document.getElementById('liEmail').value.trim();
  const pass  = document.getElementById('liPass').value;
  const fb    = document.getElementById('liFb');
  if (!email||!pass) { setFb(fb,'Enter email and password','err'); return; }
  try {
    const r = await fetch(`${API}/api/login`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({email,password:pass}) });
    const d = await r.json();
    if (d.success) {
      setFb(fb,'✓ Welcome back!','ok');
      setTimeout(() => { hideModal('loginModal'); setUser(d.user); }, 600);
    } else setFb(fb, d.error,'err');
  } catch(e) { setFb(fb,'Server error','err'); }
}

function setUser(u, notify=true) {
  user = u;
  sessionStorage.setItem('psU', JSON.stringify(u));
  document.getElementById('authBtns').style.display = 'none';
  document.getElementById('userChip').style.display = 'flex';
  document.getElementById('chipAv').textContent = u.name.charAt(0).toUpperCase();
  document.getElementById('chipName').textContent = u.name.split(' ')[0];
  if (notify) toast(`👋 Hi, ${u.name.split(' ')[0]}!`);
}

function logout() {
  user = null;
  sessionStorage.removeItem('psU');
  document.getElementById('authBtns').style.display = '';
  document.getElementById('userChip').style.display = 'none';
  goHome();
  toast('Signed out');
}

/* ── Account Page ────────────────────────────────────────────── */
function loadAccountPage() {
  document.getElementById('accAv').textContent = user.name.charAt(0).toUpperCase();
  document.getElementById('accName').textContent = user.name;
  document.getElementById('accEmail').textContent = user.email;
  loadOrders();
}

function accTab(tab, btn) {
  document.querySelectorAll('.anb').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('accTabOrders').style.display = tab === 'orders' ? '' : 'none';
  document.getElementById('accTabSaved').style.display  = tab === 'saved'  ? '' : 'none';
  if (tab === 'orders') loadOrders();
}

async function loadOrders() {
  const c = document.getElementById('ordersList');
  if (!user) { c.innerHTML = '<div class="ord-empty">Please log in to see orders.</div>'; return; }
  try {
    const r = await fetch(`${API}/api/orders/${user.email}`);
    const d = await r.json();
    const list = d.orders || [];
    if (!list.length) {
      c.innerHTML = '<div class="ord-empty" style="padding:2rem;color:var(--mu);text-align:center">No orders yet. Start comparing!</div>';
      return;
    }
    c.innerHTML = list.map(o => `
      <div class="ord-item">
        <div class="ord-id">${o.orderId}</div>
        <div class="ord-info">
          <div class="ord-prod">${(o.productName||'').substring(0,50)}</div>
          <div class="ord-meta">from ${o.store} · ${(o.paymentMethod||'').toUpperCase()} · ${o.deliveryDate}</div>
        </div>
        <div class="ord-price">₹${fmt(o.price)}</div>
        <span class="ord-status">${o.status}</span>
      </div>`).join('');
  } catch(e) {
    c.innerHTML = '<div style="padding:2rem;color:var(--mu);text-align:center">Could not load orders.</div>';
  }
}

/* ── Modal helpers ───────────────────────────────────────────── */
function showModal(id) { document.getElementById(id).style.display = 'flex'; }
function hideModal(id) { document.getElementById(id).style.display = 'none'; }
function overlayClick(e, id) { if (e.target === document.getElementById(id)) hideModal(id); }
function switchModal(a, b) { hideModal(a); showModal(b); }
function setFb(el, msg, cls) { el.textContent = msg; el.className = 'mfb ' + cls; }

/* ── Utilities ───────────────────────────────────────────────── */
function fmt(n) { return Number(n).toLocaleString('en-IN'); }

function showLoader(s, t = 'Loading…') {
  document.getElementById('loader').style.display = s ? 'flex' : 'none';
  document.getElementById('loaderTxt').textContent = t;
}

let _tt;
function toast(msg) {
  let el = document.getElementById('_toast');
  if (!el) {
    el = document.createElement('div');
    el.id = '_toast';
    el.style.cssText = 'position:fixed;bottom:1.8rem;left:50%;transform:translateX(-50%);background:#1a1a2e;border:1px solid rgba(245,197,24,.3);color:#e2e2f0;padding:.65rem 1.3rem;border-radius:999px;font-size:.85rem;z-index:999;pointer-events:none;white-space:nowrap';
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.style.display = 'block';
  clearTimeout(_tt);
  _tt = setTimeout(() => el.style.display = 'none', 2500);
}