// ============================================================
// HAB Barbershop POS — Core Application
// AppData | StorageManager | Router | Utilities | Init
// ============================================================

// ── Default Mock Data ────────────────────────────────────────
const DEFAULT_DATA = {

  services: [
    { id:1,  name:'Haircut',           price:20,  duration:45,  cat:'hair',      icon:'fa-scissors',           desc:'Classic & modern cuts',      is_active:true },
    { id:2,  name:'Beard Trim',        price:12,  duration:30,  cat:'beard',     icon:'fa-face-grin-beam',     desc:'Shape & clean your beard',   is_active:true },
    { id:3,  name:'Hair Wash',         price:8,   duration:20,  cat:'hair',      icon:'fa-shower',             desc:'Shampoo & conditioning',     is_active:true },
    { id:4,  name:'Hair Coloring',     price:80,  duration:90,  cat:'treatment', icon:'fa-palette',            desc:'Full color treatment',        is_active:true },
    { id:5,  name:'Kids Haircut',      price:15,  duration:30,  cat:'hair',      icon:'fa-child',              desc:'For kids under 12 yrs',      is_active:true },
    { id:6,  name:'Hot Towel Shave',   price:18,  duration:40,  cat:'beard',     icon:'fa-fire-flame-curved',  desc:'Traditional wet shave',      is_active:true },
    { id:7,  name:'Hair Treatment',    price:45,  duration:60,  cat:'treatment', icon:'fa-spa',                desc:'Keratin & deep repair',       is_active:true },
    { id:8,  name:'Full Package',      price:88,  duration:120, cat:'package',   icon:'fa-crown',              desc:'Haircut + Beard + Wash',     is_active:true },
    { id:9,  name:'Eyebrow Trim',      price:8,   duration:15,  cat:'beard',     icon:'fa-eye',                desc:'Define & shape brows',       is_active:true },
    { id:10, name:'Hair Styling',      price:15,  duration:30,  cat:'hair',      icon:'fa-wind',               desc:'Pomade finish & styling',    is_active:true },
  ],

  barbers: [
    { id:1, name:'Razif Hakim',       initials:'RH', color:'#6366f1', status:'available', skills:['Fade','Pompadour','Beard Styling'],      commission:30, phone:'019-3456789',  branchId:1 },
    { id:2, name:'Hafizuddin Azmi',   initials:'HA', color:'#f59e0b', status:'busy',      skills:['Classic Cut','Hair Coloring','Keratin'],  commission:30, phone:'011-23456789', branchId:1 },
    { id:3, name:'Amran bin Yusof',   initials:'AY', color:'#22c55e', status:'available', skills:['Modern Style','Undercut','Kids Cut'],     commission:25, phone:'017-8901234',  branchId:2 },
    { id:4, name:'Shahrul Nizam',     initials:'SN', color:'#ec4899', status:'off',       skills:['Traditional Shave','Eyebrow Trim'],       commission:25, phone:'013-4567890',  branchId:2 },
  ],

  appointments: [
    { id:1,  customer:'Ahmad bin Abdullah', phone:'012-3456789',  barberId:1, serviceId:1, date: _today(),        time:'09:00', status:'confirmed', notes:'',              branchId:1 },
    { id:2,  customer:'Muhammad Hafiz',     phone:'019-8765432',  barberId:2, serviceId:8, date: _today(),        time:'10:30', status:'pending',   notes:'First visit',   branchId:1 },
    { id:3,  customer:'Zulkifli Hassan',    phone:'011-12345678', barberId:3, serviceId:2, date: _today(),        time:'11:00', status:'confirmed', notes:'',              branchId:2 },
    { id:4,  customer:'Farid Ibrahim',      phone:'016-9876543',  barberId:3, serviceId:7, date: _today(),        time:'13:00', status:'pending',   notes:'Sensitive scalp', branchId:2 },
    { id:5,  customer:'Azrul Mohd',         phone:'013-2345678',  barberId:4, serviceId:5, date: _today(),        time:'14:00', status:'completed', notes:'',              branchId:2 },
    { id:6,  customer:'Khairul Anuar',      phone:'017-3456789',  barberId:2, serviceId:4, date: _dateOffset(1),  time:'10:00', status:'confirmed', notes:'Colour: Dark brown', branchId:1 },
    { id:7,  customer:'Syafiq Razali',      phone:'012-8901234',  barberId:1, serviceId:1, date: _dateOffset(1),  time:'14:30', status:'pending',   notes:'',              branchId:1 },
    { id:8,  customer:'Izzat Firdaus',      phone:'011-45678901', barberId:3, serviceId:6, date: _dateOffset(-1), time:'16:00', status:'completed', notes:'',              branchId:2 },
    { id:9,  customer:'Ridhwan Ismail',     phone:'019-5678901',  barberId:2, serviceId:3, date: _dateOffset(2),  time:'09:30', status:'pending',   notes:'',              branchId:1 },
    { id:10, customer:'Amirul Zakaria',     phone:'016-4321098',  barberId:1, serviceId:8, date: _dateOffset(-2), time:'11:00', status:'completed', notes:'VIP customer',  branchId:1 },
  ],

  transactions: [
    { id:'TRX-001', customer:'Ahmad A.',    barberId:1, services:[{name:'Haircut',qty:1,price:20}],                             discount:0, tax:6, total:21,  method:'cash', tendered:25,  date:_today(),        time:'09:45', branchId:1 },
    { id:'TRX-002', customer:'Muhammad H.', barberId:2, services:[{name:'Full Package',qty:1,price:88}],                        discount:0, tax:6, total:93,  method:'qr',   tendered:0,   date:_today(),        time:'11:30', branchId:1 },
    { id:'TRX-003', customer:'Zulkifli H.', barberId:3, services:[{name:'Beard Trim',qty:1,price:12}],                          discount:0, tax:6, total:13,  method:'cash', tendered:15,  date:_today(),        time:'12:00', branchId:2 },
    { id:'TRX-004', customer:'Walk-in',     barberId:1, services:[{name:'Haircut',qty:1,price:20},{name:'Hair Wash',qty:1,price:8}], discount:0, tax:6, total:30, method:'card', tendered:0, date:_today(),    time:'13:30', branchId:1 },
    { id:'TRX-005', customer:'Azrul M.',    barberId:4, services:[{name:'Kids Haircut',qty:1,price:15}],                        discount:0, tax:6, total:16,  method:'cash', tendered:20,  date:_today(),        time:'14:15', branchId:2 },
    { id:'TRX-006', customer:'Izzat F.',    barberId:3, services:[{name:'Hot Towel Shave',qty:1,price:18}],                     discount:5, tax:6, total:18,  method:'cash', tendered:20,  date:_dateOffset(-1), time:'16:15', branchId:2 },
    { id:'TRX-007', customer:'Amirul Z.',   barberId:1, services:[{name:'Full Package',qty:1,price:88}],                        discount:0, tax:6, total:93,  method:'qr',   tendered:0,   date:_dateOffset(-1), time:'11:30', branchId:1 },
    { id:'TRX-008', customer:'Walk-in',     barberId:2, services:[{name:'Hair Treatment',qty:1,price:45}],                      discount:0, tax:6, total:48,  method:'card', tendered:0,   date:_dateOffset(-1), time:'15:00', branchId:1 },
    { id:'TRX-009', customer:'Walk-in',     barberId:3, services:[{name:'Haircut',qty:1,price:20}],                             discount:0, tax:6, total:21,  method:'cash', tendered:25,  date:_dateOffset(-2), time:'10:00', branchId:2 },
    { id:'TRX-010', customer:'Walk-in',     barberId:2, services:[{name:'Hair Coloring',qty:1,price:80}],                       discount:0, tax:6, total:85,  method:'cash', tendered:100, date:_dateOffset(-2), time:'13:00', branchId:1 },
    { id:'TRX-011', customer:'Walk-in',     barberId:4, services:[{name:'Beard Trim',qty:1,price:12}],                          discount:0, tax:6, total:13,  method:'cash', tendered:15,  date:_dateOffset(-3), time:'09:30', branchId:2 },
    { id:'TRX-012', customer:'Walk-in',     barberId:1, services:[{name:'Haircut',qty:1,price:20},{name:'Beard Trim',qty:1,price:12}], discount:0, tax:6, total:34, method:'qr', tendered:0, date:_dateOffset(-3), time:'14:00', branchId:1 },
  ],

  inventory: [
    { id:1,  name:'Pomade Strong Hold',   cat:'styling',  stock:12, minStock:5,  price:25,  unit:'pcs',  branchId:1 },
    { id:2,  name:'Barber Scissors Pro',  cat:'tools',    stock:3,  minStock:5,  price:85,  unit:'pcs',  branchId:1 },
    { id:3,  name:'Shaving Foam',         cat:'shaving',  stock:8,  minStock:3,  price:15,  unit:'pcs',  branchId:1 },
    { id:4,  name:'Hair Clipper Wahl',    cat:'tools',    stock:2,  minStock:3,  price:150, unit:'unit', branchId:1 },
    { id:5,  name:'Conditioner L\'Oreal', cat:'haircare', stock:15, minStock:5,  price:22,  unit:'btl',  branchId:1 },
    { id:6,  name:'Shampoo Kerastase',    cat:'haircare', stock:10, minStock:5,  price:28,  unit:'btl',  branchId:1 },
    { id:7,  name:'Hair Wax Matt',        cat:'styling',  stock:20, minStock:8,  price:18,  unit:'pcs',  branchId:2 },
    { id:8,  name:'Razor Blades 100pcs',  cat:'shaving',  stock:4,  minStock:10, price:12,  unit:'box',  branchId:2 },
    { id:9,  name:'Barber Cape',          cat:'tools',    stock:6,  minStock:3,  price:40,  unit:'pcs',  branchId:2 },
    { id:10, name:'Hair Spray',           cat:'styling',  stock:7,  minStock:5,  price:16,  unit:'pcs',  branchId:2 },
    { id:11, name:'Neck Strip Roll',      cat:'tools',    stock:2,  minStock:5,  price:8,   unit:'roll', branchId:2 },
    { id:12, name:'Beard Oil Premium',    cat:'beard',    stock:9,  minStock:4,  price:35,  unit:'btl',  branchId:2 },
  ],

  queue: [],

  customers: [],

  branches: [
    { id:1, name:'Kota Bharu',  shortName:'KB', address:'No. 12, Jalan Sultan Yahya Petra, 15000 Kota Bharu' },
    { id:2, name:'Kedai Lalat', shortName:'KL', address:'No. 3, Pekan Kedai Lalat, Kelantan' },
  ],

  settings: {
    // Per-branch profile (name, address, phone, hours)
    branchSettings: [
      {
        branchId: 1, shopName: 'HAB Barbershop — Kota Bharu',
        address: 'No. 12, Jalan Sultan Yahya Petra, 15000 Kota Bharu, Kelantan',
        phone: '09-748 1234', email: 'kotabharu@habbarbershop.com.my', instagram: '@habbarbershop.kb',
        hours: { Mon:{open:'09:00',close:'21:00',active:true}, Tue:{open:'09:00',close:'21:00',active:true}, Wed:{open:'09:00',close:'21:00',active:true}, Thu:{open:'09:00',close:'21:00',active:true}, Fri:{open:'09:00',close:'22:00',active:true}, Sat:{open:'08:00',close:'22:00',active:true}, Sun:{open:'10:00',close:'20:00',active:true} }
      },
      {
        branchId: 2, shopName: 'HAB Barbershop — Kedai Lalat',
        address: 'No. 3, Pekan Kedai Lalat, Kelantan',
        phone: '09-912 3456', email: 'kedailalat@habbarbershop.com.my', instagram: '@habbarbershop.kl',
        hours: { Mon:{open:'09:00',close:'21:00',active:true}, Tue:{open:'09:00',close:'21:00',active:true}, Wed:{open:'09:00',close:'21:00',active:true}, Thu:{open:'09:00',close:'21:00',active:true}, Fri:{open:'09:00',close:'22:00',active:true}, Sat:{open:'08:00',close:'22:00',active:true}, Sun:{open:'10:00',close:'20:00',active:true} }
      }
    ],
    // Global fields (kept for backward compat — receipt uses branchSettings)
    shopName:      'HAB Barbershop',
    address:       'No. 12, Jalan Sultan Yahya Petra, 15000 Kota Bharu, Kelantan',
    phone:         '09-748 1234',
    email:         'info@habbarbershop.com.my',
    instagram:     '@habbarbershop',
    taxRate:       6,
    currency:      'RM',
    lowStockThreshold: 5,
    receiptFooter: 'Terima kasih kerana memilih HAB Barbershop! Jumpa lagi.',
    receiptShowQr:  true,
    receiptShowTax: true,
    theme:         'dark',
    notifications: { booking:true, stock:true, payment:true, daily:false }
  }
};

// ── Date Helpers (used at boot, before module load) ──────────
function _today() {
  return new Date().toISOString().split('T')[0];
}
function _dateOffset(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

// ── Data Version (bump to reset cached localStorage) ─────────
const DATA_VERSION = '5'; // v5 = Kedai Lalat + branch CRUD
(function() {
  if (localStorage.getItem('hab_data_version') !== DATA_VERSION) {
    Object.keys(localStorage).filter(k => k.startsWith('hab_')).forEach(k => localStorage.removeItem(k));
    localStorage.setItem('hab_data_version', DATA_VERSION);
  }
})();

// ── StorageManager ───────────────────────────────────────────
const StorageManager = {
  KEY_PREFIX: 'hab_',
  save(key, data) {
    try { localStorage.setItem(this.KEY_PREFIX + key, JSON.stringify(data)); } catch(e) {}
  },
  load(key, fallback) {
    try {
      const raw = localStorage.getItem(this.KEY_PREFIX + key);
      return raw !== null ? JSON.parse(raw) : fallback;
    } catch(e) { return fallback; }
  },
  remove(key) { localStorage.removeItem(this.KEY_PREFIX + key); },
  clearAll() {
    Object.keys(localStorage)
      .filter(k => k.startsWith(this.KEY_PREFIX))
      .forEach(k => localStorage.removeItem(k));
  }
};

// ── AppData (live, loaded from localStorage with defaults) ───
const AppData = {
  services:     StorageManager.load('services',     DEFAULT_DATA.services),
  barbers:      StorageManager.load('barbers',      DEFAULT_DATA.barbers),
  appointments: StorageManager.load('appointments', DEFAULT_DATA.appointments),
  transactions: StorageManager.load('transactions', DEFAULT_DATA.transactions),
  inventory:    StorageManager.load('inventory',    DEFAULT_DATA.inventory),
  queue:        StorageManager.load('queue',        DEFAULT_DATA.queue),
  customers:    StorageManager.load('customers',    DEFAULT_DATA.customers),
  branches:     StorageManager.load('branches',     DEFAULT_DATA.branches),
  settings:     StorageManager.load('settings',     DEFAULT_DATA.settings),

  save(key) { StorageManager.save(key, this[key]); },
  saveAll() {
    ['services','barbers','appointments','transactions','inventory','queue','branches','settings','customers']
      .forEach(k => StorageManager.save(k, this[k]));
  }
};

// ── Utility Functions ────────────────────────────────────────
function formatRp(amount) {
  const n = Math.round(amount);
  return (AppData.settings.currency || 'RM') + ' ' + n.toLocaleString('en-MY');
}

function today() { return _today(); }

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('id-ID', { weekday:'short', day:'numeric', month:'short', year:'numeric' });
}

function formatDateTime(dateStr, timeStr) {
  return formatDate(dateStr) + ' ' + (timeStr || '');
}

function formatTime12(time24) {
  const [h, m] = time24.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return h12 + ':' + String(m).padStart(2,'0') + ' ' + suffix;
}

function genId(prefix) {
  return prefix + '-' + Date.now().toString(36).toUpperCase();
}

function nextNumId(arr) {
  return arr.length ? Math.max(...arr.map(x => x.id)) + 1 : 1;
}

function getBarberById(id) {
  return AppData.barbers.find(b => b.id == id) || null;
}
function getServiceById(id) {
  return AppData.services.find(s => s.id == id) || null;
}

// ── Branch Helpers ───────────────────────────────────────────
function branchBarbers(bid)      { const b = bid ?? App.currentBranch; return b === 0 ? AppData.barbers      : AppData.barbers.filter(x => x.branchId === b); }
function branchTransactions(bid) { const b = bid ?? App.currentBranch; return b === 0 ? AppData.transactions  : AppData.transactions.filter(x => x.branchId === b); }
function branchAppointments(bid) { const b = bid ?? App.currentBranch; return b === 0 ? AppData.appointments  : AppData.appointments.filter(x => x.branchId === b); }
function branchInventory(bid)    { const b = bid ?? App.currentBranch; return b === 0 ? AppData.inventory     : AppData.inventory.filter(x => x.branchId === b); }

function getBranchSettings(bid) {
  const b = bid ?? App.currentBranch;
  return AppData.settings.branchSettings?.find(s => s.branchId === b) || AppData.settings.branchSettings?.[0] || AppData.settings;
}

function currentBranchName() {
  if (App.currentBranch === 0) return 'All Branches';
  return AppData.branches?.find(b => b.id === App.currentBranch)?.name || 'Branch';
}

function todayTransactions() {
  return branchTransactions().filter(x => x.date === today());
}

function statusLabel(status) {
  const map = { pending:'Pending', confirmed:'Confirmed', completed:'Completed', cancelled:'Cancelled', available:'Available', busy:'Busy', off:'Off Duty' };
  return map[status] || status;
}

function methodLabel(method) {
  const map = { cash:'Cash', card:'Card / EDC', qr:'QR Pay' };
  return map[method] || method;
}

function methodIcon(method) {
  const map = { cash:'fa-money-bill-wave', card:'fa-credit-card', qr:'fa-qrcode' };
  return map[method] || 'fa-circle-question';
}

// ── Toast System ─────────────────────────────────────────────
function showToast(message, type = 'success', duration = 3500) {
  const icons = { success:'fa-circle-check text-green-400', error:'fa-circle-xmark text-red-400', warning:'fa-triangle-exclamation text-amber-400', info:'fa-circle-info text-blue-400' };
  const wrap = document.getElementById('toast-wrap');
  const el = document.createElement('div');
  el.className = `toast toast-${type}`;
  el.innerHTML = `<i class="fa-solid ${icons[type] || icons.info} text-base flex-shrink-0"></i><span class="text-sm text-white font-medium flex-1">${message}</span><button onclick="this.parentElement.remove()" class="text-white/30 hover:text-white ml-2 text-xs"><i class="fa-solid fa-xmark"></i></button>`;
  wrap.appendChild(el);
  setTimeout(() => {
    el.classList.add('removing');
    setTimeout(() => el.remove(), 300);
  }, duration);
}

// ── Modal Utilities ──────────────────────────────────────────
function openModal(id) {
  const el = document.getElementById(id);
  if (el) { el.classList.remove('hidden'); document.body.style.overflow = 'hidden'; }
}
function closeModal(id) {
  const el = document.getElementById(id);
  if (el) { el.classList.add('hidden'); document.body.style.overflow = ''; }
}

function showConfirm(title, msg, onYes, yesLabel = 'Delete') {
  document.getElementById('confirm-title').textContent = title;
  document.getElementById('confirm-msg').textContent   = msg;
  const btn = document.getElementById('confirm-yes-btn');
  btn.innerHTML = `<i class="fa-solid fa-trash mr-1"></i>${yesLabel}`;
  btn.onclick = () => { closeModal('modal-confirm'); onYes(); };
  openModal('modal-confirm');
}

// ── Router ───────────────────────────────────────────────────
const Router = {
  current: 'dashboard',

  pages: {
    dashboard:    { title:'Dashboard',          sub: () => `${currentBranchName()} · ${formatDate(today())}` },
    pos:          { title:'POS Cashier',        sub: () => `${currentBranchName()} — process orders and payments` },
    services:     { title:'Service Management', sub: () => 'Global service menu — shared across all branches' },
    appointments: { title:'Appointments',       sub: () => `${currentBranchName()} — booking schedule` },
    barbers:      { title:'Barbers',            sub: () => `${currentBranchName()} — team management` },
    analytics:    { title:'Analytics',          sub: () => `${currentBranchName()} — revenue insights` },
    inventory:    { title:'Inventory',          sub: () => `${currentBranchName()} — stock management` },
    settings:     { title:'Settings',           sub: () => `${currentBranchName()} — system configuration` },
    customers:    { title:'Customers',          sub: () => 'Global customer profiles — all branches' },
  },

  go(view) {
    if (!this.pages[view]) return;
    // update views
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    const target = document.getElementById('view-' + view);
    if (target) target.classList.add('active');
    // update nav
    document.querySelectorAll('.nav-item[data-view]').forEach(n => n.classList.remove('active'));
    const navEl = document.querySelector(`.nav-item[data-view="${view}"]`);
    if (navEl) navEl.classList.add('active');
    // update header
    const p = this.pages[view];
    document.getElementById('page-title').textContent = p.title;
    document.getElementById('page-sub').textContent   = p.sub();
    this.current = view;
    // call module init
    const inits = { dashboard: () => Dashboard.init(), pos: () => POS.init(), services: () => ServicesMgmt.init(), appointments: () => Appointments.init(), barbers: () => Barbers.init(), analytics: () => Analytics.init(), inventory: () => Inventory.init(), settings: () => Settings.load(), customers: () => Customers.init() };
    if (inits[view]) inits[view]();
    // scroll to top
    document.querySelector('main').scrollTop = 0;
    // close mobile sidebar
    closeMobileSidebar();
  }
};

function navigate(view) { Router.go(view); }

// ── Live Clock ───────────────────────────────────────────────
function startClock() {
  function tick() {
    const now = new Date();
    const t = now.toTimeString().split(' ')[0];
    const el = document.getElementById('live-clock');
    if (el) el.textContent = t;
  }
  tick();
  setInterval(tick, 1000);
}

// ── Sidebar Controls ─────────────────────────────────────────
function toggleSidebar() {
  const sb = document.getElementById('sidebar');
  const wrap = document.getElementById('main-wrap');
  const icon = document.getElementById('sb-icon');
  sb.classList.toggle('collapsed');
  const collapsed = sb.classList.contains('collapsed');
  wrap.style.marginLeft = collapsed ? '72px' : '260px';
  icon.style.transform  = collapsed ? 'rotate(180deg)' : '';
}

function toggleMobileSidebar() {
  document.getElementById('sidebar').classList.toggle('mob-open');
  document.getElementById('mob-overlay').classList.toggle('show');
}
function closeMobileSidebar() {
  document.getElementById('sidebar').classList.remove('mob-open');
  document.getElementById('mob-overlay').classList.remove('show');
}

// ── Notification Dropdown ────────────────────────────────────
function toggleNotifDropdown() {
  document.getElementById('notif-dropdown')?.classList.toggle('hidden');
}

// ── Branch Switcher ──────────────────────────────────────────
function toggleBranchDropdown() {
  document.getElementById('branch-dropdown')?.classList.toggle('hidden');
}

function _renderBranchDropdown() {
  const wrap = document.getElementById('branch-dropdown-items');
  if (!wrap) return;
  const allOption = { id:0, name:'All Branches', shortName:'ALL', address:'Combined view' };
  const items = [allOption, ...(AppData.branches || [])];
  wrap.innerHTML = items.map(b => `
    <button onclick="App.setBranch(${b.id})"
      class="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/4 transition-colors text-left ${App.currentBranch === b.id ? 'bg-white/5' : ''}">
      <span class="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
        style="background:${b.id === 0 ? 'rgba(107,114,128,.4)' : 'rgba(55,65,81,.35)'}">
        ${(b.shortName || b.name.slice(0,2)).toUpperCase()}
      </span>
      <div class="min-w-0 flex-1">
        <p class="text-sm font-semibold text-white leading-tight">${b.name}</p>
        <p class="text-[10px] text-white/35 truncate">${b.address || ''}</p>
      </div>
      ${App.currentBranch === b.id ? '<i class="fa-solid fa-check text-xs text-green-400 flex-shrink-0"></i>' : ''}
    </button>`).join('');
}

function _updateBranchLabel() {
  const el = document.getElementById('branch-label');
  if (el) el.textContent = currentBranchName();
}

// ── Click Outside — close both dropdowns ─────────────────────
document.addEventListener('click', e => {
  const dd = document.getElementById('notif-dropdown');
  if (dd && !dd.classList.contains('hidden') &&
      !dd.contains(e.target) && !e.target.closest('[onclick*="toggleNotifDropdown"]')) {
    dd.classList.add('hidden');
  }
  const bd = document.getElementById('branch-dropdown');
  if (bd && !bd.classList.contains('hidden') &&
      !bd.contains(e.target) && !e.target.closest('[onclick*="toggleBranchDropdown"]') &&
      !e.target.closest('[onclick*="App.setBranch"]')) {
    bd.classList.add('hidden');
  }
});

// ── Keyboard Shortcuts ───────────────────────────────────────
document.addEventListener('keydown', e => {
  // / → focus POS search
  if (e.key === '/' && Router.current === 'pos' && document.activeElement.tagName !== 'INPUT') {
    e.preventDefault();
    document.getElementById('svc-search')?.focus();
  }
  // Esc → close any open modal
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal-overlay:not(.hidden)').forEach(m => {
      if (m.id !== 'modal-confirm') m.classList.add('hidden');
    });
    document.body.style.overflow = '';
  }
  // Enter → confirm payment when payment modal open
  if (e.key === 'Enter' && !document.getElementById('modal-payment').classList.contains('hidden')) {
    e.preventDefault();
    POS.confirmPayment();
  }
});

// ── Application Init ─────────────────────────────────────────
const App = {
  currentBranch: 1, // set in init() from storage

  setBranch(id) {
    this.currentBranch = id;
    StorageManager.save('currentBranch', id);
    _updateBranchLabel();
    _renderBranchDropdown();
    document.getElementById('branch-dropdown')?.classList.add('hidden');
    showToast(`Switched to ${currentBranchName()}`, 'info', 2000);
    Router.go(Router.current); // refresh current view with new branch
  },

  init() {
    this.currentBranch = StorageManager.load('currentBranch', 1);
    startClock();
    _updateBranchLabel();
    _renderBranchDropdown();
    Dashboard.init();
    Inventory.checkLowStock();
    document.getElementById('page-sub').textContent = Router.pages.dashboard.sub();
  }
};

document.addEventListener('DOMContentLoaded', () => App.init());
