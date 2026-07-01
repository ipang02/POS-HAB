# Customer Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a global Customer Management module with auto-create on POS/appointment, full profile stats derived from existing transactions, and a points-ready data structure.

**Architecture:** Customers stored in `AppData.customers` (localStorage), identified uniquely by normalised phone number. All stats (visits, spent, favourite service, preferred barber, history) derived on render from `AppData.transactions` and `AppData.appointments`. New transactions store `customerPhone` for reverse lookup. No new backend endpoints — consistent with the rest of the app.

**Tech Stack:** Vanilla JS, PHP includes, Tailwind CSS, Font Awesome, localStorage via StorageManager.

---

## File Map

| Action | File |
|--------|------|
| Modify | `database_upgrade.sql` |
| Modify | `assets/js/app.js` |
| Modify | `partials/sidebar.php` |
| Create | `assets/js/customers.js` |
| Create | `views/customers.php` |
| Create | `modals/modal-customer.php` |
| Modify | `modals/modal-payment.php` |
| Modify | `index.php` |
| Modify | `assets/js/pos.js` |
| Modify | `assets/js/appointments.js` |

---

### Task 1: Add customers table to database_upgrade.sql

**Files:**
- Modify: `database_upgrade.sql`

- [ ] **Step 1: Append the customers table**

Open `database_upgrade.sql` and append at the end:

```sql
-- ── v3: Customer Management ───────────────────────────────────
ALTER TABLE `transactions`
  ADD COLUMN IF NOT EXISTS `customer_phone` VARCHAR(20) DEFAULT NULL AFTER `customer`,
  ADD KEY IF NOT EXISTS `idx_trx_customer_phone` (`customer_phone`);

CREATE TABLE IF NOT EXISTS `customers` (
  `id`         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name`       VARCHAR(100) NOT NULL,
  `phone`      VARCHAR(20)  NOT NULL,
  `notes`      TEXT DEFAULT NULL,
  `points`     INT UNSIGNED NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_customer_phone` (`phone`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

- [ ] **Step 2: Commit**

```bash
git add database_upgrade.sql
git commit -m "feat: add customers table and customer_phone to transactions"
```

---

### Task 2: Update app.js — AppData, Router, App.init

**Files:**
- Modify: `assets/js/app.js`

- [ ] **Step 1: Add customers to DEFAULT_DATA**

In `assets/js/app.js`, find the line `queue: [],` inside `DEFAULT_DATA` and add after it:

```js
  customers: [],
```

- [ ] **Step 2: Add customers to AppData**

Find the line `queue: StorageManager.load('queue', DEFAULT_DATA.queue),` and add after it:

```js
  customers:    StorageManager.load('customers',    DEFAULT_DATA.customers),
```

- [ ] **Step 3: Add customers to AppData.saveAll()**

Find `['services','barbers','appointments','transactions','inventory','queue','branches','settings']` and replace with:

```js
['services','barbers','appointments','transactions','inventory','queue','branches','settings','customers']
```

- [ ] **Step 4: Add customers to Router.pages**

Find the `settings:` entry in `Router.pages` and add after it:

```js
    customers:    { title:'Customers',          sub: () => 'Global customer profiles — all branches' },
```

- [ ] **Step 5: Add customers to Router.go() inits map**

Find `settings: () => Settings.load()` in the inits map inside `Router.go()` and add after it:

```js
        customers: () => Customers.init(),
```

- [ ] **Step 6: Commit**

```bash
git add assets/js/app.js
git commit -m "feat: add customers to AppData, Router, and saveAll"
```

---

### Task 3: Enable Customers nav item in sidebar

**Files:**
- Modify: `partials/sidebar.php`

- [ ] **Step 1: Replace the disabled Customers nav item**

Find this block in `partials/sidebar.php`:

```html
    <!-- Customers — COMING SOON -->
    <a class="nav-item disabled" data-tip="Coming Soon" onclick="showToast('Customer Management — Coming Soon! Stay tuned.','info')">
      <i class="fa-solid fa-users nav-icon"></i>
      <span class="lbl">Customers</span>
      <span class="badge-lbl lbl ml-auto text-gold/55 text-[10px] px-2 py-0.5 rounded-full font-semibold glass-gold">Soon</span>
    </a>
```

Replace with:

```html
    <a class="nav-item" data-view="customers" data-tip="Customers" onclick="navigate('customers')">
      <i class="fa-solid fa-users nav-icon"></i>
      <span class="lbl">Customers</span>
    </a>
```

- [ ] **Step 2: Commit**

```bash
git add partials/sidebar.php
git commit -m "feat: enable Customers nav item in sidebar"
```

---

### Task 4: Create customers.js — Part 1: Utilities

**Files:**
- Create: `assets/js/customers.js`

- [ ] **Step 1: Create the file with colour palette and utility functions**

Create `assets/js/customers.js` with this content:

```js
// ============================================================
// HAB Barbershop POS — Customers Module
// ============================================================

const CUSTOMER_COLORS = [
  '#6366f1','#f59e0b','#22c55e','#ec4899',
  '#3b82f6','#14b8a6','#f97316','#8b5cf6',
  '#06b6d4','#84cc16','#ef4444','#a78bfa'
];

const Customers = {
  _activeTier: 'all',

  // ── Phone normalisation ──────────────────────────────────────
  // Strips formatting and normalises +60/60 prefix to leading 0.
  normalisePhone(raw) {
    if (!raw) return '';
    let p = raw.replace(/[\s\-().+]/g, '');
    if (p.startsWith('601')) p = '0' + p.slice(2);
    else if (p.startsWith('60')) p = '0' + p.slice(2);
    return p;
  },

  // ── Find or create customer by phone ────────────────────────
  // Called by POS and Appointments after saving. Returns customer id.
  findOrCreate(name, phone) {
    const norm = this.normalisePhone(phone);
    if (!norm) return null;
    let cust = AppData.customers.find(c => c.phone === norm);
    if (!cust) {
      cust = {
        id:        nextNumId(AppData.customers),
        name:      name || 'Unknown',
        phone:     norm,
        notes:     '',
        points:    0,
        createdAt: today()
      };
      AppData.customers.push(cust);
      AppData.save('customers');
    }
    return cust.id;
  },

  // ── Derive stats from existing transactions + appointments ───
  getStats(phone) {
    const norm  = this.normalisePhone(phone);
    const trxs  = AppData.transactions.filter(t => t.customerPhone === norm);
    const appts = AppData.appointments.filter(a => this.normalisePhone(a.phone) === norm);

    const totalVisits = trxs.length;
    const totalSpent  = trxs.reduce((s, t) => s + (t.total || 0), 0);

    const sorted    = [...trxs].sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));
    const lastVisit = sorted[0]?.date || null;

    const svcCount = {};
    trxs.forEach(t => (t.services || []).forEach(s => {
      svcCount[s.name] = (svcCount[s.name] || 0) + s.qty;
    }));
    const favouriteService = Object.keys(svcCount).sort((a, b) => svcCount[b] - svcCount[a])[0] || null;

    const barberCount = {};
    trxs.forEach(t => {
      if (t.barberId) barberCount[t.barberId] = (barberCount[t.barberId] || 0) + 1;
    });
    const topBarberId     = Object.keys(barberCount).sort((a, b) => barberCount[b] - barberCount[a])[0] || null;
    const preferredBarber = topBarberId ? getBarberById(parseInt(topBarberId)) : null;

    const history = [
      ...trxs.map(t  => ({ ...t, _type: 'transaction' })),
      ...appts.map(a => ({ ...a, _type: 'appointment' }))
    ].sort((a, b) => ((b.date + b.time) || '').localeCompare((a.date + a.time) || '')).slice(0, 10);

    return { totalVisits, totalSpent, lastVisit, favouriteService, preferredBarber, history };
  },
```

- [ ] **Step 2: Verify file exists**

```bash
git status
```
Expected: `assets/js/customers.js` listed as new file (untracked or staged).

---

### Task 5: customers.js — Part 2: CRUD

**Files:**
- Modify: `assets/js/customers.js`

- [ ] **Step 1: Append CRUD functions to customers.js**

Append to `assets/js/customers.js` (after getStats, still inside the `Customers` object — before the closing `};`):

```js
  // ── Add Modal ────────────────────────────────────────────────
  openAddModal() {
    document.getElementById('cust-edit-id').value       = '';
    document.getElementById('cust-modal-title').textContent = 'Add Customer';
    document.getElementById('cust-name').value          = '';
    document.getElementById('cust-phone').value         = '';
    document.getElementById('cust-notes').value         = '';
    openModal('modal-customer');
  },

  // ── Edit Modal ───────────────────────────────────────────────
  openEditModal(id) {
    const c = AppData.customers.find(x => x.id === id);
    if (!c) return;
    document.getElementById('cust-edit-id').value       = id;
    document.getElementById('cust-modal-title').textContent = 'Edit Customer';
    document.getElementById('cust-name').value          = c.name;
    document.getElementById('cust-phone').value         = c.phone;
    document.getElementById('cust-notes').value         = c.notes || '';
    openModal('modal-customer');
  },

  // ── Save (create or update) ──────────────────────────────────
  save() {
    const name  = document.getElementById('cust-name').value.trim();
    const phone = this.normalisePhone(document.getElementById('cust-phone').value.trim());
    const notes = document.getElementById('cust-notes').value.trim();

    if (!name)  { showToast('Customer name is required', 'error'); return; }
    if (!phone) { showToast('Phone number is required',  'error'); return; }

    const editId    = parseInt(document.getElementById('cust-edit-id').value) || 0;
    const duplicate = AppData.customers.find(c => c.phone === phone && c.id !== editId);
    if (duplicate) { showToast(`Phone already registered to "${duplicate.name}"`, 'error'); return; }

    if (editId) {
      const idx = AppData.customers.findIndex(c => c.id === editId);
      if (idx > -1) {
        AppData.customers[idx] = { ...AppData.customers[idx], name, phone, notes };
        showToast(`"${name}" updated`, 'success');
      }
    } else {
      AppData.customers.push({
        id: nextNumId(AppData.customers), name, phone, notes, points: 0, createdAt: today()
      });
      showToast(`"${name}" added!`, 'success');
    }

    AppData.save('customers');
    closeModal('modal-customer');
    this.render();
    this._updateSummary();
  },

  // ── Delete ───────────────────────────────────────────────────
  delete(id) {
    const c = AppData.customers.find(x => x.id === id);
    if (!c) return;
    showConfirm(
      'Remove Customer',
      `"${c.name}" will be removed. Their transaction and appointment history is kept.`,
      () => {
        AppData.customers = AppData.customers.filter(x => x.id !== id);
        AppData.save('customers');
        closeModal('modal-customer-detail');
        this.render();
        this._updateSummary();
        showToast(`"${c.name}" removed`, 'warning');
      },
      'Remove'
    );
  },
```

---

### Task 6: customers.js — Part 3: Rendering

**Files:**
- Modify: `assets/js/customers.js`

- [ ] **Step 1: Append rendering functions and close the object**

Append to `assets/js/customers.js` (after the delete function, replacing the placeholder closing `};`):

```js
  // ── Init ─────────────────────────────────────────────────────
  init() {
    this._activeTier = 'all';
    const search = document.getElementById('cust-search');
    if (search) search.value = '';
    document.querySelectorAll('[data-cust-tier]').forEach(b => b.classList.remove('active'));
    const allTab = document.querySelector('[data-cust-tier="all"]');
    if (allTab) allTab.classList.add('active');
    this.render();
    this._updateSummary();
  },

  _updateSummary() {
    const el = document.getElementById('cust-summary');
    if (el) el.textContent = `${AppData.customers.length} customer${AppData.customers.length !== 1 ? 's' : ''} registered`;
  },

  // ── Tier Filter ──────────────────────────────────────────────
  filterTier(btn) {
    document.querySelectorAll('[data-cust-tier]').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    this._activeTier = btn.dataset.custTier;
    this.render();
  },

  filter() { this.render(); },

  _visitCount(phone) {
    const norm = this.normalisePhone(phone);
    return AppData.transactions.filter(t => t.customerPhone === norm).length;
  },

  // ── Render Cards ─────────────────────────────────────────────
  render() {
    const grid  = document.getElementById('cust-grid');
    const empty = document.getElementById('cust-empty');
    if (!grid) return;

    const q = (document.getElementById('cust-search')?.value || '').toLowerCase();

    const list = AppData.customers.filter(c => {
      if (q && !c.name.toLowerCase().includes(q) && !c.phone.includes(q)) return false;
      const v = this._visitCount(c.phone);
      if (this._activeTier === 'new')     return v === 1;
      if (this._activeTier === 'regular') return v >= 2 && v <= 9;
      if (this._activeTier === 'vip')     return v >= 10;
      return true;
    });

    if (!list.length) {
      grid.innerHTML = '';
      if (empty) empty.classList.remove('hidden');
      return;
    }
    if (empty) empty.classList.add('hidden');
    grid.innerHTML = list.map(c => this._card(c)).join('');
  },

  _card(c) {
    const color    = CUSTOMER_COLORS[c.id % CUSTOMER_COLORS.length];
    const initials = c.name.trim().split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase() || '??';
    const visits   = this._visitCount(c.phone);
    const norm     = this.normalisePhone(c.phone);
    const trxs     = AppData.transactions.filter(t => t.customerPhone === norm);
    const spent    = trxs.reduce((s, t) => s + (t.total || 0), 0);
    const lastDate = [...trxs].sort((a, b) => b.date.localeCompare(a.date))[0]?.date;

    const tierLabel = visits >= 10 ? 'VIP' : visits >= 2 ? 'Regular' : visits === 1 ? 'New' : '—';
    const tierCls   = visits >= 10
      ? 'text-amber-400 bg-amber-400/10'
      : visits >= 2
        ? 'text-blue-400 bg-blue-400/10'
        : 'text-green-400 bg-green-400/10';

    return `
      <div class="glass rounded-2xl p-5 hover:border-white/14 transition-all cursor-pointer"
        onclick="Customers.openDetail(${c.id})">
        <div class="flex items-start justify-between mb-4">
          <div class="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-lg select-none"
            style="background:linear-gradient(135deg,${color}55,${color}33);border:2px solid ${color}55">
            ${initials}
          </div>
          <span class="text-[11px] font-semibold px-2.5 py-1 rounded-full ${tierCls}">${tierLabel}</span>
        </div>
        <h3 class="text-sm font-bold text-white mb-0.5">${c.name}</h3>
        <p class="text-xs text-white/40 mb-4">${c.phone}</p>
        <div class="grid grid-cols-3 gap-2 border-t border-white/6 pt-4">
          <div class="text-center">
            <div class="text-base font-bold text-white">${visits}</div>
            <div class="text-[10px] text-white/35">Visits</div>
          </div>
          <div class="text-center border-x border-white/6">
            <div class="text-sm font-bold gold-text truncate">${formatRp(spent)}</div>
            <div class="text-[10px] text-white/35">Spent</div>
          </div>
          <div class="text-center">
            <div class="text-[11px] font-semibold text-white">${lastDate ? lastDate.slice(5).replace('-','/') : '—'}</div>
            <div class="text-[10px] text-white/35">Last</div>
          </div>
        </div>
        ${c.points > 0 ? `<div class="mt-3 flex items-center gap-1.5 glass-gold rounded-xl px-3 py-1.5">
          <i class="fa-solid fa-star text-gold text-[10px]"></i>
          <span class="text-xs font-semibold text-gold">${c.points} pts</span>
        </div>` : ''}
      </div>`;
  },

  // ── Detail Modal ─────────────────────────────────────────────
  openDetail(id) {
    const c = AppData.customers.find(x => x.id === id);
    if (!c) return;
    const stats    = this.getStats(c.phone);
    const color    = CUSTOMER_COLORS[c.id % CUSTOMER_COLORS.length];
    const initials = c.name.trim().split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase() || '??';

    const avatarEl = document.getElementById('cust-detail-avatar');
    if (avatarEl) {
      avatarEl.textContent      = initials;
      avatarEl.style.background = `linear-gradient(135deg,${color}55,${color}33)`;
      avatarEl.style.border     = `2px solid ${color}55`;
    }

    document.getElementById('cust-detail-name').textContent       = c.name;
    document.getElementById('cust-detail-phone').textContent      = c.phone;
    document.getElementById('cust-detail-points').textContent     = c.points + ' pts';
    document.getElementById('cust-detail-visits').textContent     = stats.totalVisits;
    document.getElementById('cust-detail-spent').textContent      = formatRp(stats.totalSpent);
    document.getElementById('cust-detail-last-visit').textContent = stats.lastVisit ? formatDate(stats.lastVisit) : '—';
    document.getElementById('cust-detail-fav-service').textContent = stats.favouriteService || '—';
    document.getElementById('cust-detail-barber').textContent     = stats.preferredBarber ? stats.preferredBarber.name : '—';
    document.getElementById('cust-detail-notes').textContent      = c.notes || 'No notes';

    const histEl = document.getElementById('cust-detail-history');
    if (histEl) {
      if (!stats.history.length) {
        histEl.innerHTML = '<p class="text-xs text-white/30 text-center py-4">No visit history yet</p>';
      } else {
        histEl.innerHTML = stats.history.map(h => {
          if (h._type === 'transaction') {
            const names = (h.services || []).map(s => s.name).join(', ');
            return `<div class="flex items-start justify-between gap-2 py-2.5 border-b border-white/5 last:border-0">
              <div class="flex items-center gap-2.5 min-w-0">
                <div class="w-7 h-7 rounded-lg glass-gold flex items-center justify-center flex-shrink-0">
                  <i class="fa-solid fa-receipt text-gold text-[10px]"></i>
                </div>
                <div class="min-w-0">
                  <p class="text-xs font-semibold text-white truncate">${names || 'Transaction'}</p>
                  <p class="text-[10px] text-white/35">${formatDate(h.date)} · ${methodLabel(h.method)}</p>
                </div>
              </div>
              <span class="text-xs font-bold text-white flex-shrink-0">${formatRp(h.total)}</span>
            </div>`;
          }
          const svc = getServiceById(h.serviceId);
          return `<div class="flex items-start justify-between gap-2 py-2.5 border-b border-white/5 last:border-0">
            <div class="flex items-center gap-2.5 min-w-0">
              <div class="w-7 h-7 rounded-lg glass flex items-center justify-center flex-shrink-0">
                <i class="fa-solid fa-calendar text-blue-400 text-[10px]"></i>
              </div>
              <div class="min-w-0">
                <p class="text-xs font-semibold text-white truncate">${svc?.name || 'Appointment'}</p>
                <p class="text-[10px] text-white/35">${formatDate(h.date)} ${h.time}</p>
              </div>
            </div>
            <span class="text-[10px] font-semibold px-2 py-0.5 rounded-full
              ${h.status==='completed'?'text-green-400 bg-green-400/10':h.status==='confirmed'?'text-blue-400 bg-blue-400/10':'text-amber-400 bg-amber-400/10'}">
              ${statusLabel(h.status)}
            </span>
          </div>`;
        }).join('');
      }
    }

    document.getElementById('cust-detail-edit-btn').onclick   = () => { closeModal('modal-customer-detail'); Customers.openEditModal(id); };
    document.getElementById('cust-detail-delete-btn').onclick = () => Customers.delete(id);

    openModal('modal-customer-detail');
  }
};
```

- [ ] **Step 2: Commit customers.js**

```bash
git add assets/js/customers.js
git commit -m "feat: add Customers JS module with CRUD, stats, and rendering"
```

---

### Task 7: Create views/customers.php

**Files:**
- Create: `views/customers.php`

- [ ] **Step 1: Create the view file**

Create `views/customers.php`:

```php
<!-- ══ VIEW: CUSTOMERS ═══════════════════════════════════════ -->
<section id="view-customers" class="view">

  <!-- Header -->
  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
    <div>
      <h2 class="text-lg font-bold text-white">Customers</h2>
      <p class="text-xs text-white/35 mt-0.5" id="cust-summary">Loading…</p>
    </div>
    <div class="flex gap-2 flex-wrap">
      <div class="relative">
        <i class="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-white/22 text-xs"></i>
        <input type="text" id="cust-search" placeholder="Search name or phone…"
          oninput="Customers.filter()" class="inp pl-9 py-2.5 text-sm" style="width:210px">
      </div>
      <button onclick="Customers.openAddModal()"
        class="btn-gold px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2">
        <i class="fa-solid fa-plus text-[11px]"></i> Add Customer
      </button>
    </div>
  </div>

  <!-- Tier Filter Tabs -->
  <div class="flex gap-2 mb-5 flex-wrap">
    <button class="tab-btn active" data-cust-tier="all" onclick="Customers.filterTier(this)">All</button>
    <button class="tab-btn" data-cust-tier="new" onclick="Customers.filterTier(this)">
      <i class="fa-solid fa-seedling mr-1.5 text-[10px]"></i>New (1 visit)
    </button>
    <button class="tab-btn" data-cust-tier="regular" onclick="Customers.filterTier(this)">
      <i class="fa-solid fa-user mr-1.5 text-[10px]"></i>Regular (2–9)
    </button>
    <button class="tab-btn" data-cust-tier="vip" onclick="Customers.filterTier(this)">
      <i class="fa-solid fa-crown mr-1.5 text-[10px]"></i>VIP (10+)
    </button>
  </div>

  <!-- Customer Cards Grid -->
  <div id="cust-grid" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6"></div>

  <!-- Empty State -->
  <div id="cust-empty" class="hidden text-center py-16">
    <i class="fa-solid fa-users text-4xl text-white/14 mb-3 block"></i>
    <p class="text-sm text-white/30">No customers found</p>
    <p class="text-xs text-white/20 mt-1">Add a customer manually or process a POS payment with a phone number</p>
  </div>

</section>
```

- [ ] **Step 2: Commit**

```bash
git add views/customers.php
git commit -m "feat: add Customers view HTML"
```

---

### Task 8: Create modals/modal-customer.php

**Files:**
- Create: `modals/modal-customer.php`

- [ ] **Step 1: Create the file with both modals**

Create `modals/modal-customer.php`:

```php
<!-- ══ MODAL: ADD / EDIT CUSTOMER ════════════════════════════ -->
<div id="modal-customer" class="modal-overlay hidden">
  <div class="modal-box w-full max-w-md">
    <div class="p-6">

      <div class="flex items-center justify-between mb-5">
        <div>
          <h3 class="text-base font-bold text-white" id="cust-modal-title">Add Customer</h3>
          <p class="text-xs text-white/40 mt-0.5">Phone number is the unique customer identifier</p>
        </div>
        <button onclick="closeModal('modal-customer')"
          class="w-8 h-8 rounded-lg btn-ghost flex items-center justify-center">
          <i class="fa-solid fa-xmark text-sm"></i>
        </button>
      </div>

      <input type="hidden" id="cust-edit-id">

      <div class="space-y-4">
        <div>
          <label class="text-xs text-white/45 mb-1.5 block font-medium">Full Name <span class="text-red-400">*</span></label>
          <input type="text" id="cust-name" placeholder="e.g. Ahmad bin Abdullah" class="inp">
        </div>
        <div>
          <label class="text-xs text-white/45 mb-1.5 block font-medium">Phone Number <span class="text-red-400">*</span></label>
          <input type="text" id="cust-phone" placeholder="019-3456789" class="inp">
          <p class="text-[10px] text-white/30 mt-1">Used as unique customer ID across all branches</p>
        </div>
        <div>
          <label class="text-xs text-white/45 mb-1.5 block font-medium">Notes <span class="text-white/25">(optional)</span></label>
          <textarea id="cust-notes" rows="3"
            placeholder="Preferences, allergies, special requests…" class="inp resize-none"></textarea>
        </div>
      </div>

      <div class="flex gap-3 mt-6">
        <button onclick="closeModal('modal-customer')"
          class="btn-outline flex-1 py-2.5 rounded-xl text-sm font-semibold">Cancel</button>
        <button onclick="Customers.save()"
          class="btn-gold flex-1 py-2.5 rounded-xl text-sm font-bold">Save Customer</button>
      </div>

    </div>
  </div>
</div>

<!-- ══ MODAL: CUSTOMER DETAIL ════════════════════════════════ -->
<div id="modal-customer-detail" class="modal-overlay hidden">
  <div class="modal-box w-full max-w-sm">
    <div class="p-6">

      <div class="flex items-center justify-between mb-5">
        <h3 class="text-base font-bold text-white">Customer Profile</h3>
        <button onclick="closeModal('modal-customer-detail')"
          class="w-8 h-8 rounded-lg btn-ghost flex items-center justify-center">
          <i class="fa-solid fa-xmark text-sm"></i>
        </button>
      </div>

      <!-- Avatar + Identity -->
      <div class="flex items-center gap-4 mb-5">
        <div id="cust-detail-avatar"
          class="w-16 h-16 rounded-2xl flex items-center justify-center text-white font-bold text-xl flex-shrink-0 select-none"
          style="background:#374151">??</div>
        <div class="min-w-0">
          <h3 class="text-base font-bold text-white" id="cust-detail-name">—</h3>
          <p class="text-xs text-white/40 mt-0.5" id="cust-detail-phone">—</p>
          <span class="inline-flex items-center gap-1 mt-1.5 glass-gold rounded-full px-2.5 py-0.5">
            <i class="fa-solid fa-star text-gold text-[10px]"></i>
            <span class="text-[11px] font-semibold text-gold" id="cust-detail-points">0 pts</span>
          </span>
        </div>
      </div>

      <!-- Stats -->
      <div class="grid grid-cols-2 gap-3 mb-4">
        <div class="glass rounded-xl p-3 text-center">
          <div class="text-xl font-bold text-white" id="cust-detail-visits">0</div>
          <div class="text-[10px] text-white/35 mt-0.5">Total Visits</div>
        </div>
        <div class="glass rounded-xl p-3 text-center">
          <div class="text-base font-bold gold-text" id="cust-detail-spent">RM 0</div>
          <div class="text-[10px] text-white/35 mt-0.5">Total Spent</div>
        </div>
        <div class="glass rounded-xl p-3 text-center">
          <div class="text-xs font-bold text-white leading-tight" id="cust-detail-last-visit">—</div>
          <div class="text-[10px] text-white/35 mt-0.5">Last Visit</div>
        </div>
        <div class="glass rounded-xl p-3 text-center">
          <div class="text-xs font-bold text-white leading-tight truncate" id="cust-detail-fav-service">—</div>
          <div class="text-[10px] text-white/35 mt-0.5">Fav. Service</div>
        </div>
      </div>

      <!-- Preferred Barber -->
      <div class="glass rounded-xl px-4 py-3 mb-4 flex items-center gap-3">
        <i class="fa-solid fa-scissors text-gold text-sm flex-shrink-0"></i>
        <div>
          <p class="text-[10px] text-white/35 uppercase tracking-wide font-semibold">Preferred Barber</p>
          <p class="text-sm font-semibold text-white" id="cust-detail-barber">—</p>
        </div>
      </div>

      <!-- Notes -->
      <div class="glass rounded-xl px-4 py-3 mb-4">
        <p class="text-[10px] text-white/35 uppercase tracking-wide font-semibold mb-1">Notes</p>
        <p class="text-sm text-white/70" id="cust-detail-notes">No notes</p>
      </div>

      <!-- Visit History -->
      <div class="glass rounded-xl p-4 mb-5">
        <p class="text-[10px] text-white/35 uppercase tracking-wide font-semibold mb-3">Visit History</p>
        <div id="cust-detail-history" class="max-h-48 overflow-y-auto"></div>
      </div>

      <!-- Actions -->
      <div class="flex gap-2">
        <button id="cust-detail-edit-btn"
          class="btn-outline flex-1 py-2.5 rounded-xl text-sm font-semibold">
          <i class="fa-solid fa-pen mr-1"></i> Edit
        </button>
        <button id="cust-detail-delete-btn"
          class="btn-danger flex-1 py-2.5 rounded-xl text-sm font-semibold">
          <i class="fa-solid fa-trash mr-1"></i> Delete
        </button>
      </div>

    </div>
  </div>
</div>
```

- [ ] **Step 2: Commit**

```bash
git add modals/modal-customer.php
git commit -m "feat: add Customer add/edit and detail modals"
```

---

### Task 9: Add phone field to modal-payment.php

**Files:**
- Modify: `modals/modal-payment.php`

- [ ] **Step 1: Add phone input after the customer name input**

In `modals/modal-payment.php`, find:

```html
      <!-- Customer Name -->
      <div class="mt-4">
        <label class="text-xs text-white/45 mb-1.5 block font-medium">Customer Name (optional)</label>
        <input type="text" id="pay-customer-name" placeholder="Walk-in customer" class="inp">
      </div>
```

Replace with:

```html
      <!-- Customer Info -->
      <div class="mt-4 space-y-3">
        <div>
          <label class="text-xs text-white/45 mb-1.5 block font-medium">Customer Name (optional)</label>
          <input type="text" id="pay-customer-name" placeholder="Walk-in customer" class="inp">
        </div>
        <div>
          <label class="text-xs text-white/45 mb-1.5 block font-medium">Phone Number (optional)</label>
          <input type="text" id="pay-customer-phone" placeholder="019-3456789" class="inp">
          <p class="text-[10px] text-white/30 mt-1">Auto-creates a customer profile if new</p>
        </div>
      </div>
```

- [ ] **Step 2: Clear phone field when payment modal opens**

In `assets/js/pos.js`, find inside `openPayment()`:

```js
    document.getElementById('pay-customer-name').value  = '';
```

Add the line below it:

```js
    document.getElementById('pay-customer-phone').value = '';
```

- [ ] **Step 3: Commit**

```bash
git add modals/modal-payment.php assets/js/pos.js
git commit -m "feat: add phone field to payment modal"
```

---

### Task 10: Wire everything into index.php

**Files:**
- Modify: `index.php`

- [ ] **Step 1: Add customers view include**

In `index.php`, find:

```php
    <?php include 'views/settings.php'; ?>
```

Add after it:

```php
    <?php include 'views/customers.php'; ?>
```

- [ ] **Step 2: Add customers modal include**

Find:

```php
<?php include 'modals/modal-confirm.php'; ?>
```

Add before it:

```php
<?php include 'modals/modal-customer.php'; ?>
```

- [ ] **Step 3: Add customers.js script include**

Find:

```php
<script src="assets/js/app.js"></script>
```

Add after it:

```php
<script src="assets/js/customers.js"></script>
```

- [ ] **Step 4: Verify the app loads without errors**

Open `index.php` in a browser (or via the local server). Open browser DevTools console. Expected: no JS errors. Navigate to Customers in the sidebar — the view should appear with the empty state message and an Add Customer button.

- [ ] **Step 5: Commit**

```bash
git add index.php
git commit -m "feat: include customers view, modal, and JS in index.php"
```

---

### Task 11: Integrate findOrCreate into POS

**Files:**
- Modify: `assets/js/pos.js`

- [ ] **Step 1: Add customerPhone to the transaction and call findOrCreate**

In `assets/js/pos.js`, find inside `confirmPayment()`:

```js
    AppData.transactions.unshift(trx);
    AppData.save('transactions');
```

Replace with:

```js
    // Link transaction to customer profile by phone
    const payPhone = Customers.normalisePhone(
      document.getElementById('pay-customer-phone')?.value || ''
    );
    if (payPhone) {
      trx.customerPhone = payPhone;
      Customers.findOrCreate(customer, payPhone);
    }

    AppData.transactions.unshift(trx);
    AppData.save('transactions');
```

- [ ] **Step 2: Verify in browser**

Open the POS view. Add a service to the cart, click Process Payment. In the payment modal, enter a name and phone number (e.g. `019-1234567`), then confirm payment. Navigate to Customers — a new card should appear for that phone number with 1 visit and the correct total spent.

- [ ] **Step 3: Commit**

```bash
git add assets/js/pos.js
git commit -m "feat: auto-create customer profile on POS payment with phone"
```

---

### Task 12: Integrate findOrCreate into Appointments

**Files:**
- Modify: `assets/js/appointments.js`

- [ ] **Step 1: Call findOrCreate after appointment is saved**

In `assets/js/appointments.js`, find inside `save()`:

```js
    AppData.save('appointments');
    closeModal('modal-appt');
```

Replace with:

```js
    AppData.save('appointments');

    // Link appointment to customer profile by phone
    const apptPhone = document.getElementById('appt-phone').value.trim();
    if (apptPhone) Customers.findOrCreate(customer, apptPhone);

    closeModal('modal-appt');
```

- [ ] **Step 2: Verify in browser**

Navigate to Appointments. Book a new appointment with a customer name and phone number. Navigate to Customers — the customer should appear (or their existing profile should now show the appointment in visit history when their detail is opened).

- [ ] **Step 3: Final commit and push**

```bash
git add assets/js/appointments.js
git commit -m "feat: auto-create customer profile on appointment booking with phone"
git push origin main
```

---

## Self-Review Checklist

- [x] **Spec coverage:** All spec requirements covered — data structure (Task 1–2), auto-create from POS (Task 11) and Appointments (Task 12), manual CRUD (Tasks 5–8), derived stats (Task 4), phone normalisation (Task 4), phone uniqueness check (Task 5), global scope (no branchId on customers), points field included (Task 2, 5), sidebar enabled (Task 3), payment modal phone field (Task 9), database_upgrade.sql (Task 1).
- [x] **No placeholders:** All steps contain complete, runnable code.
- [x] **Type consistency:** `Customers.normalisePhone()` used consistently in Tasks 4, 9, 11, 12. `nextNumId()`, `today()`, `formatRp()`, `getBarberById()`, `getServiceById()`, `statusLabel()`, `methodLabel()`, `formatDate()`, `showToast()`, `openModal()`, `closeModal()`, `showConfirm()` all defined in `app.js` and available globally.
