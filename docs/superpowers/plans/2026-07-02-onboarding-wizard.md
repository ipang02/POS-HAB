# Onboarding Wizard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a 7-step guided setup wizard that lets the owner clear demo data and configure the POS before handing it to the client.

**Architecture:** A full-screen overlay (`id="setup-wizard"`, `z-index:9998`) with 7 static HTML step panels shown/hidden by a `SetupWizard` JS object. The object collects data into `_data` across steps, then on step 6→7 transition writes it all to `AppData` and saves. Triggered from Settings → Security via a new "Initial Setup" button. Closes by calling `Auth.lock()` on the Done screen.

**Tech Stack:** Vanilla JS, PHP includes, Tailwind CSS utility classes, `AppData.save(key)` pattern (existing). No build step. No automated test suite — verify in browser.

---

## File Map

| File | Change |
|------|--------|
| `views/setup-wizard.php` | New — overlay HTML: 7 step panels, progress dots, form fields |
| `assets/js/setup-wizard.js` | New — `SetupWizard` object: step nav, validation, data commit |
| `assets/css/style.css` | Append — wizard step show/hide, progress dot fill |
| `index.php` | Add `<?php include 'views/setup-wizard.php'; ?>` after line 14; add script tag after line 68 |
| `views/settings.php` | Add "Initial Setup" card inside `#settings-security-section` (inside the `p-5 space-y-6` div, after the Staff Module Access block) |

---

### Task 1: `views/setup-wizard.php` — overlay HTML

**Files:**
- Create: `views/setup-wizard.php`

Context: This is a new file modelled after `views/pin-screen.php`. The overlay is dark (`rgba(0,0,0,0.85)` background), below the PIN screen (`z-index:9998` vs `9999`). It starts hidden. Seven `<div class="wiz-step">` panels are shown/hidden by JS. The wizard uses the existing `glass` CSS class, `inp` input class, `btn-gold` and `btn-outline` button classes that are already defined in `assets/css/style.css`.

The services table (step 6) has a `<tbody id="wiz-svc-tbody">` that JS populates dynamically.

- [ ] **Step 1: Create the file with the full overlay HTML**

Create `views/setup-wizard.php` with this exact content:

```php
<!-- ══ SETUP WIZARD OVERLAY ══════════════════════════════════ -->
<div id="setup-wizard" class="hidden fixed inset-0 z-[9998] flex items-center justify-center overflow-y-auto py-8" style="background:rgba(0,0,0,0.88)">
  <div class="w-full max-w-lg mx-4">

    <!-- Progress dots -->
    <div class="flex items-center justify-center gap-2 mb-6">
      <?php for($i=1;$i<=7;$i++): ?>
      <div class="wiz-dot w-2.5 h-2.5 rounded-full transition-all duration-300" data-dot="<?= $i ?>"
        style="background:rgba(255,255,255,0.18)"></div>
      <?php endfor; ?>
    </div>

    <!-- Card -->
    <div class="glass rounded-2xl overflow-hidden">

      <!-- ── Step 1: Welcome ── -->
      <div class="wiz-step" data-step="1">
        <div class="px-8 py-10 text-center">
          <div class="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
            style="background:rgba(201,168,76,0.12);border:1px solid rgba(201,168,76,0.30)">
            <i class="fa-solid fa-wand-magic-sparkles text-2xl" style="color:#C9A84C"></i>
          </div>
          <h2 class="text-xl font-bold text-white mb-2">Initial Setup</h2>
          <p class="text-sm text-white/50 mb-8">This wizard will clear all demo data and set up the system for your shop.<br>It takes about 2 minutes.</p>
          <p class="text-xs text-white/30 mb-8">You can run this wizard again at any time from Settings → Security.</p>
          <button onclick="SetupWizard.next()" class="btn-gold w-full py-3 rounded-xl text-sm font-bold">
            Start Setup <i class="fa-solid fa-arrow-right ml-2"></i>
          </button>
        </div>
      </div>

      <!-- ── Step 2: Branch Details ── -->
      <div class="wiz-step hidden" data-step="2">
        <div class="px-6 py-6 border-b border-white/6">
          <h3 class="text-sm font-bold text-white">Branch Details</h3>
          <p class="text-xs text-white/40 mt-0.5">Name, address and phone for your first branch</p>
        </div>
        <div class="p-6 space-y-4">
          <div>
            <label class="text-xs text-white/45 mb-1.5 block font-medium">Branch / Shop Name <span class="text-red-400">*</span></label>
            <input type="text" id="wiz-branch-name" placeholder="e.g. HAB Barbershop — Kota Bharu" class="inp"
              oninput="SetupWizard._autoNextReady()">
          </div>
          <div>
            <label class="text-xs text-white/45 mb-1.5 block font-medium">Address <span class="text-white/25">(optional)</span></label>
            <input type="text" id="wiz-address" placeholder="e.g. No. 12, Jalan Sultan Yahya Petra" class="inp">
          </div>
          <div>
            <label class="text-xs text-white/45 mb-1.5 block font-medium">Phone <span class="text-white/25">(optional)</span></label>
            <input type="text" id="wiz-phone" placeholder="e.g. 09-748 1234" class="inp">
          </div>
        </div>
        <div class="px-6 pb-6">
          <button onclick="SetupWizard.next()" class="btn-gold w-full py-3 rounded-xl text-sm font-bold">
            Next <i class="fa-solid fa-arrow-right ml-2"></i>
          </button>
        </div>
      </div>

      <!-- ── Step 3: Owner PIN ── -->
      <div class="wiz-step hidden" data-step="3">
        <div class="px-6 py-6 border-b border-white/6">
          <h3 class="text-sm font-bold text-white">Owner PIN</h3>
          <p class="text-xs text-white/40 mt-0.5">4-digit PIN for owner access (full permissions)</p>
        </div>
        <div class="p-6 space-y-4">
          <div>
            <label class="text-xs text-white/45 mb-1.5 block font-medium">New PIN <span class="text-red-400">*</span></label>
            <input type="password" id="wiz-owner-pin" maxlength="4" inputmode="numeric" pattern="[0-9]*" placeholder="••••" class="inp">
          </div>
          <div>
            <label class="text-xs text-white/45 mb-1.5 block font-medium">Confirm PIN <span class="text-red-400">*</span></label>
            <input type="password" id="wiz-owner-pin-confirm" maxlength="4" inputmode="numeric" pattern="[0-9]*" placeholder="••••" class="inp">
          </div>
        </div>
        <div class="px-6 pb-6">
          <button onclick="SetupWizard.next()" class="btn-gold w-full py-3 rounded-xl text-sm font-bold">
            Next <i class="fa-solid fa-arrow-right ml-2"></i>
          </button>
        </div>
      </div>

      <!-- ── Step 4: Staff PIN ── -->
      <div class="wiz-step hidden" data-step="4">
        <div class="px-6 py-6 border-b border-white/6">
          <h3 class="text-sm font-bold text-white">Staff PIN</h3>
          <p class="text-xs text-white/40 mt-0.5">4-digit PIN for barber / cashier access (limited permissions)</p>
        </div>
        <div class="p-6 space-y-4">
          <div>
            <label class="text-xs text-white/45 mb-1.5 block font-medium">Staff PIN <span class="text-red-400">*</span></label>
            <input type="password" id="wiz-staff-pin" maxlength="4" inputmode="numeric" pattern="[0-9]*" placeholder="••••" class="inp">
          </div>
          <div>
            <label class="text-xs text-white/45 mb-1.5 block font-medium">Confirm Staff PIN <span class="text-red-400">*</span></label>
            <input type="password" id="wiz-staff-pin-confirm" maxlength="4" inputmode="numeric" pattern="[0-9]*" placeholder="••••" class="inp">
          </div>
        </div>
        <div class="px-6 pb-6">
          <button onclick="SetupWizard.next()" class="btn-gold w-full py-3 rounded-xl text-sm font-bold">
            Next <i class="fa-solid fa-arrow-right ml-2"></i>
          </button>
        </div>
      </div>

      <!-- ── Step 5: First Barber ── -->
      <div class="wiz-step hidden" data-step="5">
        <div class="px-6 py-6 border-b border-white/6">
          <h3 class="text-sm font-bold text-white">First Barber</h3>
          <p class="text-xs text-white/40 mt-0.5">Add the first barber for this branch (you can add more later)</p>
        </div>
        <div class="p-6 space-y-4">
          <div>
            <label class="text-xs text-white/45 mb-1.5 block font-medium">Full Name <span class="text-red-400">*</span></label>
            <input type="text" id="wiz-barber-name" placeholder="e.g. Ahmad Razif" class="inp"
              oninput="SetupWizard._onBarberNameInput(this.value)">
          </div>
          <div>
            <label class="text-xs text-white/45 mb-1.5 block font-medium">Initials (max 2 chars)</label>
            <input type="text" id="wiz-barber-initials" maxlength="2" placeholder="AR" class="inp"
              style="text-transform:uppercase">
          </div>
        </div>
        <div class="px-6 pb-6">
          <button onclick="SetupWizard.next()" class="btn-gold w-full py-3 rounded-xl text-sm font-bold">
            Next <i class="fa-solid fa-arrow-right ml-2"></i>
          </button>
        </div>
      </div>

      <!-- ── Step 6: Services ── -->
      <div class="wiz-step hidden" data-step="6">
        <div class="px-6 py-6 border-b border-white/6">
          <h3 class="text-sm font-bold text-white">Services</h3>
          <p class="text-xs text-white/40 mt-0.5">Add your service menu (name &amp; price). At least one required.</p>
        </div>
        <div class="p-6">
          <table class="w-full text-sm mb-3">
            <thead>
              <tr class="text-white/35 text-xs">
                <th class="text-left pb-2 font-medium">Service Name</th>
                <th class="text-left pb-2 font-medium pl-3">Price (RM)</th>
                <th class="w-8"></th>
              </tr>
            </thead>
            <tbody id="wiz-svc-tbody"></tbody>
          </table>
          <button onclick="SetupWizard.addServiceRow()" class="text-xs font-semibold flex items-center gap-1.5 mt-1 transition-opacity hover:opacity-70" style="color:#C9A84C">
            <i class="fa-solid fa-plus text-[10px]"></i> Add service
          </button>
        </div>
        <div class="px-6 pb-6">
          <button onclick="SetupWizard.next()" class="btn-gold w-full py-3 rounded-xl text-sm font-bold">
            Next <i class="fa-solid fa-arrow-right ml-2"></i>
          </button>
        </div>
      </div>

      <!-- ── Step 7: Done ── -->
      <div class="wiz-step hidden" data-step="7">
        <div class="px-8 py-10 text-center">
          <div class="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
            style="background:rgba(34,197,94,0.12);border:1px solid rgba(34,197,94,0.30)">
            <i class="fa-solid fa-circle-check text-2xl text-green-400"></i>
          </div>
          <h2 class="text-xl font-bold text-white mb-2">All Done!</h2>
          <p class="text-sm text-white/50 mb-6">Your POS has been set up. Here's a summary:</p>
          <div class="text-left glass rounded-xl p-4 mb-6 space-y-2">
            <p class="text-xs text-white/45">Branch: <span id="wiz-sum-branch" class="text-white font-semibold">—</span></p>
            <p class="text-xs text-white/45">PINs: <span class="text-white font-semibold">Owner &amp; Staff set</span></p>
            <p class="text-xs text-white/45">Barber: <span id="wiz-sum-barber" class="text-white font-semibold">—</span></p>
            <p class="text-xs text-white/45">Services: <span id="wiz-sum-svc-count" class="text-white font-semibold">—</span></p>
          </div>
          <button onclick="SetupWizard.done()" class="btn-gold w-full py-3 rounded-xl text-sm font-bold">
            Finish Setup
          </button>
        </div>
      </div>

    </div><!-- /card -->
  </div><!-- /max-w-lg -->
</div><!-- /setup-wizard -->
```

- [ ] **Step 2: Verify**

Read `views/setup-wizard.php` and confirm:
- `id="setup-wizard"` with `class="hidden"` and `z-[9998]`
- 7 `<div class="wiz-step">` panels with `data-step="1"` through `data-step="7"`
- Steps 2–7 have `class="wiz-step hidden"` (only step 1 is initially visible — JS shows/hides them)
- `id="wiz-svc-tbody"` table body in step 6
- `id="wiz-sum-branch"`, `id="wiz-sum-barber"`, `id="wiz-sum-svc-count"` in step 7

- [ ] **Step 3: Commit**

```bash
git add views/setup-wizard.php
git commit -m "feat: add setup wizard HTML overlay (7 steps)"
```

---

### Task 2: `assets/js/setup-wizard.js` — wizard logic

**Files:**
- Create: `assets/js/setup-wizard.js`

Context: This file defines a single `SetupWizard` object. It manages `_step` (1–7) and `_data` (the collected form values). Key methods:
- `open()` — show overlay, reset to step 1
- `next()` — validate current step, collect its values, advance
- `_validate(step)` — returns false + shows toast if invalid
- `_collect(step)` — reads form DOM into `this._data`
- `_renderStep(step)` — hides all panels, shows the active one, updates progress dots
- `_commit()` — writes `this._data` to AppData and saves (called when advancing to step 7)
- `addServiceRow()` / `removeServiceRow(btn)` — manage service table rows in step 6
- `done()` — hides overlay, calls `Auth.lock()`

Important patterns from the codebase:
- `AppData.save('key')` saves `AppData['key']` to localStorage (NOT `StorageManager.save()`)
- `showToast(message, 'error')` for validation errors
- `BARBER_COLORS[0]` = `'#6366f1'` for the auto-assigned barber color
- `nextNumId(arr)` = `arr.length ? Math.max(...arr.map(x => x.id)) + 1 : 1`
- `AppData.settings.branchSettings` is an array of `{branchId, shopName, address, phone, ...}`
- `AppData.branches[0]` has shape `{id:1, name:'...', shortName:'KB', address:'...'}`

- [ ] **Step 1: Create `assets/js/setup-wizard.js`**

```js
// ============================================================
// HAB Barbershop POS — Setup Wizard
// ============================================================

const SetupWizard = {
  _step: 1,
  _data: {},

  _blankData() {
    return {
      branchName: '', address: '', phone: '',
      ownerPin: '', staffPin: '',
      barberName: '', barberInitials: '',
      services: []
    };
  },

  open() {
    this._step = 1;
    this._data = this._blankData();
    this._renderStep(1);
    document.getElementById('setup-wizard').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  },

  _close() {
    document.getElementById('setup-wizard').classList.add('hidden');
    document.body.style.overflow = '';
  },

  next() {
    if (!this._validate(this._step)) return;
    this._collect(this._step);
    this._step++;
    if (this._step === 7) this._commit();
    this._renderStep(this._step);
  },

  done() {
    this._close();
    Auth.lock();
  },

  // ── Validation ──────────────────────────────────────────────

  _validate(step) {
    if (step === 1) return true;

    if (step === 2) {
      const name = document.getElementById('wiz-branch-name').value.trim();
      if (!name) { showToast('Branch name is required', 'error'); return false; }
      return true;
    }

    if (step === 3) {
      const pin  = document.getElementById('wiz-owner-pin').value;
      const conf = document.getElementById('wiz-owner-pin-confirm').value;
      if (!/^\d{4}$/.test(pin))  { showToast('Owner PIN must be exactly 4 digits', 'error'); return false; }
      if (pin !== conf)           { showToast('Owner PINs do not match', 'error'); return false; }
      return true;
    }

    if (step === 4) {
      const pin  = document.getElementById('wiz-staff-pin').value;
      const conf = document.getElementById('wiz-staff-pin-confirm').value;
      if (!/^\d{4}$/.test(pin))  { showToast('Staff PIN must be exactly 4 digits', 'error'); return false; }
      if (pin !== conf)           { showToast('Staff PINs do not match', 'error'); return false; }
      return true;
    }

    if (step === 5) {
      const name = document.getElementById('wiz-barber-name').value.trim();
      if (!name) { showToast('Barber name is required', 'error'); return false; }
      return true;
    }

    if (step === 6) {
      const rows = document.querySelectorAll('#wiz-svc-tbody tr');
      const hasValid = Array.from(rows).some(row => {
        const name  = row.querySelector('.wiz-svc-name').value.trim();
        const price = row.querySelector('.wiz-svc-price').value;
        return name && price !== '' && !isNaN(parseFloat(price));
      });
      if (!hasValid) { showToast('Add at least one service with a name and price', 'error'); return false; }
      return true;
    }

    return true;
  },

  // ── Data Collection ─────────────────────────────────────────

  _collect(step) {
    if (step === 2) {
      this._data.branchName = document.getElementById('wiz-branch-name').value.trim();
      this._data.address    = document.getElementById('wiz-address').value.trim();
      this._data.phone      = document.getElementById('wiz-phone').value.trim();
    }
    if (step === 3) {
      this._data.ownerPin = document.getElementById('wiz-owner-pin').value;
    }
    if (step === 4) {
      this._data.staffPin = document.getElementById('wiz-staff-pin').value;
    }
    if (step === 5) {
      this._data.barberName     = document.getElementById('wiz-barber-name').value.trim();
      this._data.barberInitials = document.getElementById('wiz-barber-initials').value.trim().toUpperCase() ||
                                  this._autoInitials(this._data.barberName);
    }
    if (step === 6) {
      const rows = document.querySelectorAll('#wiz-svc-tbody tr');
      this._data.services = [];
      rows.forEach(row => {
        const name  = row.querySelector('.wiz-svc-name').value.trim();
        const price = row.querySelector('.wiz-svc-price').value;
        if (name && price !== '' && !isNaN(parseFloat(price))) {
          this._data.services.push({ name, price: parseFloat(price) });
        }
      });
    }
  },

  // ── Commit to AppData ────────────────────────────────────────

  _commit() {
    const d = this._data;

    // Clear demo data
    AppData.barbers      = [];
    AppData.services     = [];
    AppData.appointments = [];
    AppData.transactions = [];
    AppData.inventory    = [];
    AppData.queue        = [];
    AppData.customers    = [];

    // Update PINs
    AppData.settings.pins.owner = d.ownerPin;
    AppData.settings.pins.staff = d.staffPin;

    // Update branch name in branches array
    if (AppData.branches[0]) {
      AppData.branches[0].name = d.branchName;
      if (d.address) AppData.branches[0].address = d.address;
    }

    // Update branch settings (used by receipts)
    if (AppData.settings.branchSettings && AppData.settings.branchSettings[0]) {
      AppData.settings.branchSettings[0].shopName = d.branchName;
      if (d.address) AppData.settings.branchSettings[0].address = d.address;
      if (d.phone)   AppData.settings.branchSettings[0].phone   = d.phone;
    }

    // Update global settings fields (backward compat)
    AppData.settings.shopName = d.branchName;
    if (d.address) AppData.settings.address = d.address;
    if (d.phone)   AppData.settings.phone   = d.phone;

    // Add first barber
    AppData.barbers.push({
      id: 1,
      name: d.barberName,
      initials: d.barberInitials,
      color: '#6366f1',
      status: 'available',
      skills: [],
      commission: 0,
      phone: '',
      tier: null,
      branchId: 1
    });

    // Add services
    d.services.forEach((s, i) => {
      AppData.services.push({
        id: i + 1,
        name: s.name,
        price: s.price,
        duration: 30,
        cat: 'hair',
        icon: 'fa-scissors',
        desc: '',
        is_active: true,
        tierPrices: null,
        bookingPrice: null,
        branchId: 1
      });
    });

    // Save all changed keys
    ['barbers','services','appointments','transactions','inventory','queue','customers','settings','branches']
      .forEach(k => AppData.save(k));

    // Populate summary screen
    const sumBranch = document.getElementById('wiz-sum-branch');
    const sumBarber = document.getElementById('wiz-sum-barber');
    const sumCount  = document.getElementById('wiz-sum-svc-count');
    if (sumBranch) sumBranch.textContent = d.branchName;
    if (sumBarber) sumBarber.textContent = d.barberName;
    if (sumCount)  sumCount.textContent  = d.services.length + (d.services.length === 1 ? ' service' : ' services');
  },

  // ── Step Rendering ───────────────────────────────────────────

  _renderStep(step) {
    document.querySelectorAll('.wiz-step').forEach(el => el.classList.add('hidden'));
    const active = document.querySelector(`.wiz-step[data-step="${step}"]`);
    if (active) active.classList.remove('hidden');

    document.querySelectorAll('.wiz-dot').forEach(dot => {
      const n = parseInt(dot.dataset.dot);
      dot.style.background = n <= step ? '#C9A84C' : 'rgba(255,255,255,0.18)';
      dot.style.transform  = n === step ? 'scale(1.3)' : 'scale(1)';
    });

    if (step === 6) this._ensureServiceRows();
  },

  _ensureServiceRows() {
    const tbody = document.getElementById('wiz-svc-tbody');
    if (!tbody) return;
    if (tbody.querySelectorAll('tr').length === 0) this.addServiceRow();
  },

  // ── Services Table ───────────────────────────────────────────

  addServiceRow() {
    const tbody = document.getElementById('wiz-svc-tbody');
    if (!tbody) return;
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="pb-2 pr-2">
        <input type="text" class="wiz-svc-name inp py-2 text-sm" placeholder="Service name">
      </td>
      <td class="pb-2 pl-1 pr-2">
        <input type="number" class="wiz-svc-price inp py-2 text-sm" placeholder="0" min="0" step="0.01">
      </td>
      <td class="pb-2 text-center">
        <button onclick="SetupWizard.removeServiceRow(this)"
          class="text-white/25 hover:text-red-400 transition-colors text-xs p-1">
          <i class="fa-solid fa-trash-can"></i>
        </button>
      </td>`;
    tbody.appendChild(tr);
  },

  removeServiceRow(btn) {
    const tr = btn.closest('tr');
    const tbody = document.getElementById('wiz-svc-tbody');
    if (tbody && tbody.querySelectorAll('tr').length > 1) {
      tr.remove();
    } else {
      showToast('At least one service is required', 'error');
    }
  },

  // ── Helpers ──────────────────────────────────────────────────

  _autoInitials(name) {
    return name.trim().split(/\s+/).map(w => w[0] || '').join('').toUpperCase().slice(0, 2);
  },

  _onBarberNameInput(val) {
    const initEl = document.getElementById('wiz-barber-initials');
    if (initEl && !initEl.dataset.manuallyEdited) {
      initEl.value = this._autoInitials(val);
    }
  },

  _autoNextReady() {}
};

// Mark initials as manually edited if user touches the field
document.addEventListener('DOMContentLoaded', () => {
  const initEl = document.getElementById('wiz-barber-initials');
  if (initEl) {
    initEl.addEventListener('input', () => { initEl.dataset.manuallyEdited = '1'; });
    initEl.addEventListener('focus', () => { initEl.removeAttribute('data-manually-edited'); });
  }
});
```

- [ ] **Step 2: Verify**

Read `assets/js/setup-wizard.js` and confirm:
- `SetupWizard.open()` resets `_step` and `_data`, calls `_renderStep(1)`
- `SetupWizard.next()` calls `_validate()` → `_collect()` → increments `_step` → calls `_commit()` only when `_step === 7` → calls `_renderStep()`
- `_commit()` clears 7 AppData arrays, updates pins, branches, branchSettings, global settings, pushes barber and services, calls `AppData.save(k)` for all 9 keys
- `removeServiceRow()` prevents removing the last row
- `_onBarberNameInput()` auto-fills initials only when user hasn't manually edited them
- `done()` calls `this._close()` then `Auth.lock()`

- [ ] **Step 3: Commit**

```bash
git add assets/js/setup-wizard.js
git commit -m "feat: add SetupWizard JS object with 7-step flow, validation, and data commit"
```

---

### Task 3: `assets/css/style.css` — wizard styles

**Files:**
- Modify: `assets/css/style.css`

Context: Append to the end of the existing file. The `.wiz-step` show/hide is handled by JS (adding/removing `hidden` class). The Tailwind `hidden` class sets `display:none`. The only custom CSS needed is for the progress dot animation smoothness (already handled by inline style in JS) and the service table input spacing. The `inp` class already styles inputs — no extra input styles needed.

The only CSS needed is a rule to prevent the wizard from being closed by the existing ESC key handler. That handler targets `.modal-overlay` class, which the wizard doesn't have — so no CSS change is needed for that.

We do need a `[data-manually-edited]` style to give a visual cue on the initials field. But actually the existing `inp` class styling is sufficient.

The only genuinely needed CSS addition is a min-width on the service price input so it doesn't collapse too narrow.

- [ ] **Step 1: Append wizard CSS to `assets/css/style.css`**

Read the last 5 lines of `assets/css/style.css` to find the end of the file, then append:

```css

/* ── Setup Wizard ─────────────────────────────────────────── */
.wiz-svc-price { min-width: 80px; }
```

- [ ] **Step 2: Verify**

Read the last 10 lines of `assets/css/style.css` to confirm the rule was appended.

- [ ] **Step 3: Commit**

```bash
git add assets/css/style.css
git commit -m "feat: add setup wizard CSS"
```

---

### Task 4: `index.php` — wire include and script tag

**Files:**
- Modify: `index.php`

Context: `index.php` currently has `<?php include 'views/pin-screen.php'; ?>` at line 14. The wizard include goes on line 15 (immediately after). The script tag goes after `settings.js` at line 68 — add it as line 69. The `filemtime()` cache-busting pattern is used for all other scripts.

- [ ] **Step 1: Add PHP include after pin-screen**

Read `index.php` lines 13–16 to confirm current content, then change:

```php
<?php include 'views/pin-screen.php'; ?>
```

to:

```php
<?php include 'views/pin-screen.php'; ?>
<?php include 'views/setup-wizard.php'; ?>
```

- [ ] **Step 2: Add script tag after settings.js**

Read `index.php` lines 67–70 to confirm current content, then change:

```php
<script src="assets/js/settings.js?v=<?= filemtime('assets/js/settings.js') ?>"></script>
```

to:

```php
<script src="assets/js/settings.js?v=<?= filemtime('assets/js/settings.js') ?>"></script>
<script src="assets/js/setup-wizard.js?v=<?= filemtime('assets/js/setup-wizard.js') ?>"></script>
```

- [ ] **Step 3: Verify**

Read `index.php` and confirm:
- `setup-wizard.php` is included on the line immediately after `pin-screen.php`
- `setup-wizard.js` script tag is the last script before `</body>`

- [ ] **Step 4: Commit**

```bash
git add index.php
git commit -m "feat: wire setup wizard include and script into index.php"
```

---

### Task 5: `views/settings.php` — Initial Setup trigger button

**Files:**
- Modify: `views/settings.php`

Context: The security section is at lines 159–199 in `views/settings.php`. The `<div class="p-5 space-y-6">` div contains two blocks: PIN Change (grid, lines 171–186) and Staff Module Access (lines 189–195). The button goes inside this `space-y-6` div, after the Staff Module Access `<div>`. It should be visually distinct (danger/warning zone) to signal it's destructive.

The security section is revealed for owners only by `Settings._renderSecurity()` in `settings.js`. Any HTML inside `#settings-security-section` is therefore owner-only automatically.

- [ ] **Step 1: Add the Initial Setup section inside the security section**

Read `views/settings.php` lines 188–199 to confirm the end of the Staff Module Access block and the closing divs.

Then add the following block immediately before the closing `</div>` of `<div class="p-5 space-y-6">` (which closes after the `id="sec-access-toggles"` div). The current structure ends at:

```html
          <!-- Staff Module Access -->
          <div>
            <p class="text-xs font-semibold text-white/70 mb-3">Staff Module Access</p>
            <p class="text-xs text-white/35 mb-4">Choose which modules staff can access. POS, Appointments, and Customers are always accessible.</p>
            <div class="space-y-3" id="sec-access-toggles">
              <!-- Rendered by settings.js -->
            </div>
          </div>

        </div>
      </div>
    </div>
```

Change to:

```html
          <!-- Staff Module Access -->
          <div>
            <p class="text-xs font-semibold text-white/70 mb-3">Staff Module Access</p>
            <p class="text-xs text-white/35 mb-4">Choose which modules staff can access. POS, Appointments, and Customers are always accessible.</p>
            <div class="space-y-3" id="sec-access-toggles">
              <!-- Rendered by settings.js -->
            </div>
          </div>

          <!-- Initial Setup -->
          <div class="pt-2 border-t border-white/6">
            <p class="text-xs font-semibold text-white/70 mb-1">Initial Setup Wizard</p>
            <p class="text-xs text-white/35 mb-3">Clear all demo data and configure the system from scratch. This action cannot be undone.</p>
            <button onclick="SetupWizard.open()"
              class="text-xs px-4 py-2 rounded-lg font-semibold border transition-colors hover:bg-red-500/10"
              style="border-color:rgba(239,68,68,0.4);color:#ef4444">
              <i class="fa-solid fa-wand-magic-sparkles mr-1.5"></i> Run Setup Wizard
            </button>
          </div>

        </div>
      </div>
    </div>
```

- [ ] **Step 2: Verify**

Read `views/settings.php` lines 188–230 and confirm:
- The "Initial Setup Wizard" block appears inside `<div class="p-5 space-y-6">`, after `#sec-access-toggles`
- The button calls `SetupWizard.open()`
- The button has red border styling to signal destructive action
- The closing `</div></div></div>` structure of the security section is preserved

- [ ] **Step 3: Commit**

```bash
git add views/settings.php
git commit -m "feat: add Initial Setup Wizard button to Settings Security section"
```

---

### Task 6: Smoke test and deploy

**Files:** None

- [ ] **Step 1: Browser smoke test (local)**

Open the app in a browser. Enter owner PIN (default `1234`).

**Test the trigger:**
1. Go to **Settings** → scroll to Security section — it should be visible (owner).
2. Confirm "Run Setup Wizard" button is visible with red border.
3. Click the button — the wizard overlay should appear (dark background, step 1 Welcome screen).
4. Confirm clicking outside the overlay does nothing (no dismiss on outside click).
5. Confirm pressing ESC does nothing (wizard stays open).

**Test step navigation:**
6. Click "Start Setup" — advances to step 2 (Branch Details). Progress dot 2 lights up gold.
7. Click "Next" without filling branch name — red toast "Branch name is required". Stays on step 2.
8. Fill in branch name, click "Next" — advances to step 3 (Owner PIN).
9. Enter mismatched PINs → toast error "Owner PINs do not match". Enter matching 4-digit PINs → advances to step 4.
10. Step 4 (Staff PIN): same validation. Advance to step 5.
11. Step 5 (Barber): type a name — initials auto-fill. Click initials field, edit it — auto-fill stops. Advance to step 6.
12. Step 6 (Services): one blank row appears. Try "Next" without filling — toast error. Fill in name + price. Click "+ Add service" → second row appears. Remove it → only 1 row left. Try removing last row → toast error "At least one service is required".
13. Click "Next" on step 6 → step 7 (Done) appears with summary showing branch name, barber name, number of services.

**Test commit:**
14. All 7 progress dots lit gold on step 7.
15. Click "Finish Setup" → wizard closes → PIN screen appears (Auth.lock() called).
16. Enter the NEW owner PIN just set → logs in → go to Services → only the services entered in wizard appear.
17. Go to Barbers → only the barber entered in wizard appears.
18. Go to Settings → branch name updated.

- [ ] **Step 2: Push to GitHub**

```bash
git push origin main
```

- [ ] **Step 3: Deploy to Hostinger**

```bash
ssh -i ~/.ssh/hostinger_deploy -p 65002 u929568672@145.79.28.63 "cd ~/domains/nextapmy.com/public_html/__HAB && bash deploy.sh"
```

---

## Key Implementation Notes

- **`AppData.save(key)`** is the correct save pattern (not `StorageManager.save(key, data)`). It saves `AppData[key]` to `hab_<key>` in localStorage.
- **`_commit()` clears arrays before pushing** — always assign `AppData.barbers = []` first, then push. Do not splice or filter.
- **Initials auto-fill logic**: `data-manually-edited` attribute on the initials input tracks user intent. Cleared on focus, set on input.
- **ESC key**: the existing ESC handler in `app.js` only closes `.modal-overlay` elements. The wizard uses `#setup-wizard` (not that class), so ESC doesn't close it — no extra code needed.
- **z-index ordering**: PIN screen = `z-[9999]`, wizard = `z-[9998]`. The wizard cannot appear over the PIN screen.
- **`branchSettings[0].phone`** is the field used by receipt printing. Update both `branchSettings[0].phone` and `settings.phone` (global compat).
- **Branch 2**: all demo data is wiped including branch 2 barbers/services. The owner sets up branch 2 via Settings → Branches after the wizard.
