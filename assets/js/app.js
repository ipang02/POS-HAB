// ============================================================
// HAB Barbershop POS — Core Application
// AppData | StorageManager | Router | Utilities | Init
// ============================================================

// ── Default Data (empty — configure via Settings) ────────────
const DEFAULT_DATA = {
  services:     [],
  barbers:      [],
  appointments: [],
  transactions: [],
  inventory:    [],
  queue:        [],
  customers:    [],

  branches: [
    { id:1, name:'My Branch', shortName:'BR', address:'' },
  ],

  settings: {
    branchSettings: [],
    shopName:      'HAB Barbershop',
    address:       '',
    phone:         '',
    email:         '',
    instagram:     '',
    taxRate:       6,
    bookingFee:    10,
    currency:      'RM',
    lowStockThreshold: 5,
    receiptFooter: 'Terima kasih kerana memilih HAB Barbershop!',
    receiptShowQr:  true,
    receiptShowTax: true,
    theme:         'dark',
    notifications: { booking:true, stock:true, payment:true, daily:false },
    pins: {
      owner: '1234',
      staff: '0000'
    },
    staffAccess: {
      analytics:  false,
      services:   false,
      barbers:    false,
      inventory:  false,
      settings:   false,
      customers:  true
    }
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
const DATA_VERSION = '6'; // v6 = MySQL backend, empty defaults
(function() {
  if (localStorage.getItem('hab_data_version') !== DATA_VERSION) {
    Object.keys(localStorage).filter(k => k.startsWith('hab_')).forEach(k => localStorage.removeItem(k));
    localStorage.setItem('hab_data_version', DATA_VERSION);
  }
})();

// ── API Client ───────────────────────────────────────────────
const API = {
  _token: window.HAB_API_TOKEN || '',

  _h() {
    return { 'Content-Type': 'application/json', 'X-API-Token': this._token };
  },

  async fetchAll() {
    const res = await fetch('api/data.php', { headers: this._h() });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return res.json();
  },

  async fetchPoll() {
    const res = await fetch('api/data.php?mode=poll', { headers: this._h() });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return res.json();
  },

  saveBlob(key, data) {
    fetch('api/data.php', {
      method: 'POST',
      headers: this._h(),
      body: JSON.stringify({ key, value: JSON.stringify(data) })
    }).catch(() => {});
  },

  async saveTransaction(trx) {
    try {
      const res = await fetch('api/transactions.php', {
        method: 'POST',
        headers: this._h(),
        body: JSON.stringify(trx)
      });
      if (!res.ok) return { ok: false };
      return res.json();
    } catch (e) {
      return { ok: false };
    }
  },

  clearTransactions() {
    fetch('api/transactions.php', { method: 'DELETE', headers: this._h() }).catch(() => {});
  }
};

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

  save(key) {
    StorageManager.save(key, this[key]);
    if (key !== 'transactions') API.saveBlob(key, this[key]);
  },
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

function resolvePrice(svc, barber) {
  if (svc?.tierPrices && barber?.tier && svc.tierPrices[barber.tier] != null) {
    return svc.tierPrices[barber.tier];
  }
  return svc?.price ?? 0;
}


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
function branchServices(bid)     { const b = bid ?? App.currentBranch; return b === 0 ? AppData.services     : AppData.services.filter(x => x.branchId === b); }

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
    if (typeof Auth !== 'undefined' && !Auth.canAccess(view)) {
      showToast('Access restricted', 'error');
      return;
    }
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
  currentBranch: 1,
  lastSyncAt: null,

  setBranch(id) {
    this.currentBranch = id;
    StorageManager.save('currentBranch', id);
    _updateBranchLabel();
    _renderBranchDropdown();
    document.getElementById('branch-dropdown')?.classList.add('hidden');
    showToast(`Switched to ${currentBranchName()}`, 'info', 2000);
    Router.go(Router.current);
  },

  async init() {
    this._showLoader(true);
    try {
      const data = await API.fetchAll();
      if (!data.seeded) {
        await this._seedMySQL();
        const fresh = await API.fetchAll();
        this._hydrateFromAPI(fresh);
      } else {
        this._hydrateFromAPI(data);
      }
      this._showOfflineBanner(false);
    } catch (e) {
      // API unreachable — fall back to localStorage (AppData already hydrated at parse time)
      this._showOfflineBanner(true);
    }
    this._showLoader(false);
    Auth.init();
    this.currentBranch = StorageManager.load('currentBranch', 1);
    if (AppData.services.some(s => s.branchId == null)) {
      AppData.services.forEach(s => { if (s.branchId == null) s.branchId = 1; });
      AppData.save('services');
    }
    startClock();
    _updateBranchLabel();
    _renderBranchDropdown();
    Dashboard.init();
    Inventory.checkLowStock();
    document.getElementById('page-sub').textContent = Router.pages.dashboard.sub();
    this._startPolling();
  },

  _hydrateFromAPI(data) {
    const BLOB_KEYS = ['services','barbers','appointments','inventory','queue','customers','settings','branches'];
    BLOB_KEYS.forEach(k => {
      if (data[k] !== undefined) {
        AppData[k] = data[k];
        StorageManager.save(k, data[k]);
      }
    });
    if (data.transactions !== undefined) {
      AppData.transactions = data.transactions;
      StorageManager.save('transactions', data.transactions);
    }
    this.lastSyncAt = new Date().toISOString();
  },

  async _seedMySQL() {
    const BLOB_KEYS = ['services','barbers','appointments','inventory','queue','customers','settings','branches'];
    let failed = false;
    for (const k of BLOB_KEYS) {
      try {
        const res = await fetch('api/data.php', {
          method: 'POST',
          headers: API._h(),
          body: JSON.stringify({ key: k, value: JSON.stringify(AppData[k]) })
        });
        if (!res.ok) failed = true;
      } catch { failed = true; }
    }
    // Only seed real transactions — skip demo data
    const isDemo = AppData.transactions.length > 0 && AppData.transactions[0].id === 'TRX-001';
    if (!isDemo) {
      for (const trx of AppData.transactions) {
        const r = await API.saveTransaction(trx);
        if (!r.ok) failed = true;
      }
    }
    if (failed) throw new Error('Seed incomplete');
  },

  _startPolling() {
    setInterval(async () => {
      try {
        const data = await API.fetchPoll();
        const BLOB_KEYS = ['services','barbers','appointments','inventory','queue','customers','settings','branches'];
        let changed = false;

        BLOB_KEYS.forEach(k => {
          if (data.updated_at?.[k] && this.lastSyncAt &&
              new Date(data.updated_at[k]) > new Date(this.lastSyncAt)) {
            AppData[k] = data[k];
            StorageManager.save(k, data[k]);
            changed = true;
          }
        });

        // Merge today's fresh transactions — keep historical, replace today's
        if (data.transactions !== undefined) {
          const todayStr = today();
          const historical = AppData.transactions.filter(t => t.date !== todayStr);
          const todayFromAPI = (data.transactions || []).filter(t => t.date === todayStr);
          AppData.transactions = [...todayFromAPI, ...historical];
          StorageManager.save('transactions', AppData.transactions);
          changed = true;
        }

        this.lastSyncAt = new Date().toISOString();
        this._showOfflineBanner(false);
        if (changed) this._triggerRerender();
      } catch (e) {
        this._showOfflineBanner(true);
      }
    }, 30000);
  },

  _triggerRerender() {
    const view = Router.current;
    if (view === 'pos') {
      if ((POS?.cart?.length ?? 0) === 0) {
        POS.renderServiceGrid?.();
        POS.renderProductGrid?.();
      }
      return;
    }
    Router.go(view);
  },

  _showLoader(show) {
    let el = document.getElementById('api-loader');
    if (!el && show) {
      el = document.createElement('div');
      el.id = 'api-loader';
      el.style.cssText = 'position:fixed;inset:0;z-index:10000;display:flex;align-items:center;justify-content:center;background:rgba(9,11,17,.92)';
      el.innerHTML = '<div style="color:#fff;font-size:14px;font-family:Inter,sans-serif;display:flex;align-items:center;gap:10px"><i class="fa-solid fa-circle-notch fa-spin" style="color:#C9A84C"></i>Connecting...</div>';
      document.body.appendChild(el);
    }
    if (el) el.style.display = show ? 'flex' : 'none';
  },

  _showOfflineBanner(show) {
    let el = document.getElementById('offline-banner');
    if (!el && show) {
      el = document.createElement('div');
      el.id = 'offline-banner';
      el.style.cssText = 'position:fixed;bottom:16px;left:50%;transform:translateX(-50%);z-index:9000;background:#b45309;color:#fff;padding:6px 16px;border-radius:8px;font-size:12px;font-family:Inter,sans-serif;white-space:nowrap';
      el.textContent = 'Offline — using local data';
      document.body.appendChild(el);
    }
    if (el) el.style.display = show ? 'block' : 'none';
  }
};

document.addEventListener('DOMContentLoaded', () => App.init());
