# Auth & Roles Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add PIN-based session authentication with owner/staff roles and module-level access control.

**Architecture:** A full-screen PIN overlay (`views/pin-screen.php`) renders on top of the app. `auth.js` (loaded first after `app.js`) manages role state in `sessionStorage` — cleared on tab close, no persistent login. Owner PIN grants full access; staff PIN hides restricted nav items and blocks direct navigation. A Lock button clears session and shows the PIN screen again. Settings gains a Security section for PIN change and staffAccess toggles.

**Tech Stack:** Vanilla JS, PHP includes, sessionStorage. No framework, no build step. Test by opening the browser — no automated test suite exists.

**Dependency:** Plan A (Pricing & Commission) must be complete before this plan. Plan B reads module names that Plan A adds.

**Load order constraint:** `auth.js` MUST be loaded immediately after `app.js` and before all other module scripts. This is critical — modules like `pos.js`, `barbers.js`, etc. should not run their `init()` paths before auth is established.

---

## File Map

| File | Change |
|------|--------|
| `assets/js/auth.js` | Create — Auth object: init, lock, canAccess, applyRole, PIN entry logic |
| `views/pin-screen.php` | Create — full-screen PIN overlay HTML (included in index.php before main content) |
| `assets/js/app.js` | Add `pins` + `staffAccess` to DEFAULT_DATA.settings; add `Auth.canAccess()` guard in `Router.go()` |
| `index.php` | Include `views/pin-screen.php` before `<body>` content; load `auth.js` immediately after `app.js` |
| `partials/sidebar.php` | Add Lock button in sidebar footer |
| `assets/js/settings.js` | Add Security section: PIN change form + staffAccess toggles (owner-only) |

---

### Task 1: Create `auth.js`

**Files:**
- Create: `assets/js/auth.js`

Context: This file defines the global `Auth` object. It is loaded immediately after `app.js`, so it has access to `AppData` and `showToast`. It is loaded BEFORE other modules, so it must NOT call module-specific functions. It MUST work even before `AppData` is loaded — use `AppData?.settings?.pins` defensively.

The PIN screen HTML (from Task 2) has:
- `id="pin-screen"` — the outer overlay
- `id="pin-dots"` — container of 4 dot spans (`.pin-dot`)
- `id="pin-error"` — error message div
- `id="pin-status"` — role status text ("Owner" / "Staff")

- [ ] **Step 1: Create `assets/js/auth.js` with full Auth object**

```js
const Auth = {
  _role: null,
  _entered: '',

  init() {
    this._role = sessionStorage.getItem('hab_role');
    if (this._role) {
      this._hidePinScreen();
      this.applyRole();
    } else {
      this._showPinScreen();
    }
  },

  _showPinScreen() {
    const el = document.getElementById('pin-screen');
    if (el) el.classList.remove('hidden');
    this._entered = '';
    this._updateDots();
    const err = document.getElementById('pin-error');
    if (err) err.classList.add('hidden');
  },

  _hidePinScreen() {
    const el = document.getElementById('pin-screen');
    if (el) el.classList.add('hidden');
  },

  digit(d) {
    if (this._entered.length >= 4) return;
    this._entered += String(d);
    this._updateDots();
    if (this._entered.length === 4) {
      setTimeout(() => this._submit(), 120);
    }
  },

  backspace() {
    this._entered = this._entered.slice(0, -1);
    this._updateDots();
  },

  _updateDots() {
    const dots = document.querySelectorAll('#pin-dots .pin-dot');
    dots.forEach((dot, i) => {
      dot.classList.toggle('filled', i < this._entered.length);
    });
  },

  _submit() {
    const pins = AppData?.settings?.pins || { owner: '1234', staff: '0000' };
    if (this._entered === pins.owner) {
      this._setRole('owner');
    } else if (this._entered === pins.staff) {
      this._setRole('staff');
    } else {
      this._shake();
    }
  },

  _setRole(role) {
    sessionStorage.setItem('hab_role', role);
    this._role = role;
    const statusEl = document.getElementById('pin-status');
    if (statusEl) {
      statusEl.textContent = role === 'owner' ? 'Owner' : 'Staff';
      statusEl.classList.remove('hidden');
    }
    setTimeout(() => {
      this._hidePinScreen();
      this.applyRole();
    }, 300);
  },

  _shake() {
    const screen = document.getElementById('pin-screen');
    const card = screen?.querySelector('.pin-card');
    if (!card) { this._reset(); return; }
    card.classList.add('pin-shake');
    const err = document.getElementById('pin-error');
    if (err) err.classList.remove('hidden');
    setTimeout(() => {
      card.classList.remove('pin-shake');
      this._reset();
    }, 600);
  },

  _reset() {
    this._entered = '';
    this._updateDots();
    const err = document.getElementById('pin-error');
    if (err) err.classList.add('hidden');
  },

  lock() {
    sessionStorage.removeItem('hab_role');
    this._role = null;
    this._showPinScreen();
  },

  applyRole() {
    const role = this._role;
    const access = AppData?.settings?.staffAccess || {};
    const restricted = ['analytics', 'services', 'barbers', 'inventory', 'settings'];

    restricted.forEach(mod => {
      const navEl = document.querySelector(`.nav-item[data-view="${mod}"]`);
      if (!navEl) return;
      const allowed = role === 'owner' || access[mod] === true;
      navEl.classList.toggle('nav-hidden', !allowed);
    });

    const lockBtn = document.getElementById('sidebar-lock-btn');
    if (lockBtn) lockBtn.classList.remove('hidden');
  },

  canAccess(view) {
    if (!this._role) return false;
    if (this._role === 'owner') return true;
    const restricted = ['analytics', 'services', 'barbers', 'inventory', 'settings'];
    if (!restricted.includes(view)) return true;
    return (AppData?.settings?.staffAccess || {})[view] === true;
  }
};

document.addEventListener('keydown', e => {
  const screen = document.getElementById('pin-screen');
  if (!screen || screen.classList.contains('hidden')) return;
  if (e.key >= '0' && e.key <= '9') Auth.digit(parseInt(e.key));
  if (e.key === 'Backspace') Auth.backspace();
});
```

- [ ] **Step 2: Verify the file saves correctly**

Read back `assets/js/auth.js` to confirm it was written without corruption. Check that the `Auth` object, `_submit`, `_shake`, and `canAccess` methods are all present.

---

### Task 2: Create `views/pin-screen.php`

**Files:**
- Create: `views/pin-screen.php`

Context: This is a full-screen overlay. It renders on top of everything with `position:fixed, z-index:9999`. It starts visible (no `hidden` class) — `Auth.init()` hides it after verifying the session. The design uses the same dark glass aesthetic as the rest of the app.

CSS for the `pin-shake` animation and `filled` dot state will be added to `assets/css/style.css`.

- [ ] **Step 1: Create `views/pin-screen.php`**

```html
<div id="pin-screen" class="fixed inset-0 z-[9999] flex items-center justify-center" style="background:rgba(15,15,20,0.97);backdrop-filter:blur(20px)">
  <div class="pin-card w-full max-w-sm mx-4 text-center">

    <!-- Logo / shop name -->
    <div class="mb-8">
      <div class="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style="background:rgba(201,168,76,0.12);border:1px solid rgba(201,168,76,0.25)">
        <i class="fa-solid fa-scissors text-2xl" style="color:#C9A84C"></i>
      </div>
      <h1 class="text-xl font-bold text-white font-display">HAB Barbershop</h1>
      <p class="text-xs text-white/35 mt-1">Enter PIN to continue</p>
    </div>

    <!-- PIN dots -->
    <div id="pin-dots" class="flex items-center justify-center gap-4 mb-6">
      <span class="pin-dot w-4 h-4 rounded-full border-2 transition-all duration-150" style="border-color:rgba(255,255,255,0.2)"></span>
      <span class="pin-dot w-4 h-4 rounded-full border-2 transition-all duration-150" style="border-color:rgba(255,255,255,0.2)"></span>
      <span class="pin-dot w-4 h-4 rounded-full border-2 transition-all duration-150" style="border-color:rgba(255,255,255,0.2)"></span>
      <span class="pin-dot w-4 h-4 rounded-full border-2 transition-all duration-150" style="border-color:rgba(255,255,255,0.2)"></span>
    </div>

    <!-- Error message -->
    <p id="pin-error" class="hidden text-xs font-medium mb-4" style="color:#f87171">Incorrect PIN. Please try again.</p>

    <!-- Role confirmation (shown briefly on success) -->
    <p id="pin-status" class="hidden text-xs font-semibold mb-4" style="color:#C9A84C"></p>

    <!-- Number pad -->
    <div class="grid grid-cols-3 gap-3 mb-3">
      <?php foreach([1,2,3,4,5,6,7,8,9] as $n): ?>
      <button onclick="Auth.digit(<?= $n ?>)"
        class="pin-btn h-14 rounded-xl text-xl font-semibold text-white transition-all duration-100 active:scale-95"
        style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.08)">
        <?= $n ?>
      </button>
      <?php endforeach; ?>
    </div>
    <div class="grid grid-cols-3 gap-3">
      <div></div><!-- empty left cell -->
      <button onclick="Auth.digit(0)"
        class="pin-btn h-14 rounded-xl text-xl font-semibold text-white transition-all duration-100 active:scale-95"
        style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.08)">
        0
      </button>
      <button onclick="Auth.backspace()"
        class="pin-btn h-14 rounded-xl text-lg text-white/50 transition-all duration-100 active:scale-95"
        style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.06)">
        <i class="fa-solid fa-delete-left"></i>
      </button>
    </div>

  </div>
</div>
```

- [ ] **Step 2: Add PIN screen CSS to `assets/css/style.css`**

Read the end of `assets/css/style.css` and append these rules:

```css
/* PIN screen */
.pin-dot.filled {
  background: #C9A84C !important;
  border-color: #C9A84C !important;
  transform: scale(1.2);
}
@keyframes pin-shake {
  0%, 100% { transform: translateX(0); }
  20%       { transform: translateX(-10px); }
  40%       { transform: translateX(10px); }
  60%       { transform: translateX(-8px); }
  80%       { transform: translateX(8px); }
}
.pin-shake {
  animation: pin-shake 0.5s ease;
}
.pin-btn:hover {
  background: rgba(255,255,255,0.10) !important;
  border-color: rgba(255,255,255,0.14) !important;
}

/* Nav hidden by auth */
.nav-hidden {
  display: none !important;
}
```

- [ ] **Step 3: Verify in browser (static test)**

Open `index.php` in the browser before wiring anything up. The PIN screen should be visible (full-screen dark overlay) even before auth.js is wired in. Buttons should be visible. Styling should look correct.

---

### Task 3: Wire auth into `app.js` and `index.php`

**Files:**
- Modify: `assets/js/app.js`
- Modify: `index.php`

Context: `app.js` line 125 has `DATA_VERSION = '5'`. The DEFAULT_DATA.settings object is around line 75. The `Router.go()` function is around line 195. `App.init()` is called at line 451 via `document.addEventListener('DOMContentLoaded', () => App.init())`.

- [ ] **Step 1: Add `pins` and `staffAccess` to DEFAULT_DATA.settings in `app.js`**

Read `app.js` lines 75–100 to find the current `settings` object in `DEFAULT_DATA`. It likely has `taxRate`, `branch`, or similar fields. Add the two new fields:

```js
// Inside DEFAULT_DATA.settings:
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
```

Add these two fields to the existing settings object. Do NOT replace existing settings fields.

- [ ] **Step 2: Add `Auth.canAccess()` guard to `Router.go()` in `app.js`**

Find `Router.go()` (around line 195). It starts with:
```js
go(view) {
  if (!this.pages[view]) return;
```

Add the auth check immediately after the existing pages guard:
```js
go(view) {
  if (!this.pages[view]) return;
  if (typeof Auth !== 'undefined' && !Auth.canAccess(view)) {
    showToast('Access restricted', 'error');
    return;
  }
  // ... rest of function
```

- [ ] **Step 3: Call `Auth.init()` at the top of `App.init()` in `app.js`**

Find `App.init()` (around line 430). The first statement is probably something like `this.currentBranch = StorageManager.load(...)`. Add `Auth.init()` as the FIRST line:

```js
init() {
  Auth.init();
  this.currentBranch = StorageManager.load('currentBranch', 1);
  // ... rest of init
```

- [ ] **Step 4: Include `views/pin-screen.php` in `index.php`**

In `index.php`, add the include BEFORE the `<body>` opening or immediately after `<body>` before the mobile overlay div. The pin screen uses `position:fixed` so placement in the DOM doesn't matter visually, but it must be before the main layout div.

Change:
```html
<body>

<!-- Mobile sidebar backdrop -->
<div id="mob-overlay" onclick="closeMobileSidebar()"></div>
```

To:
```html
<body>

<?php include 'views/pin-screen.php'; ?>

<!-- Mobile sidebar backdrop -->
<div id="mob-overlay" onclick="closeMobileSidebar()"></div>
```

- [ ] **Step 5: Load `auth.js` immediately after `app.js` in `index.php`**

Find the script block (starting line 56). Change:
```html
<script src="assets/js/app.js?v=<?= filemtime('assets/js/app.js') ?>"></script>
<script src="assets/js/customers.js?v=<?= filemtime('assets/js/customers.js') ?>"></script>
```

To:
```html
<script src="assets/js/app.js?v=<?= filemtime('assets/js/app.js') ?>"></script>
<script src="assets/js/auth.js?v=<?= filemtime('assets/js/auth.js') ?>"></script>
<script src="assets/js/customers.js?v=<?= filemtime('assets/js/customers.js') ?>"></script>
```

- [ ] **Step 6: Verify in browser**

1. Open the app. PIN screen appears.
2. Type `1234` on keyboard → screen hides, owner access granted.
3. Close and reopen the browser TAB (not window) → PIN screen appears again (sessionStorage cleared).
4. Type `0000` → staff access. Try clicking "Barbers" in sidebar → toast "Access restricted".
5. Open DevTools Console → type `Router.go('barbers')` → same toast, no navigation.
6. Type `Auth.lock()` in console → PIN screen appears again.

- [ ] **Step 7: Commit**

```bash
git add assets/js/app.js index.php
git commit -m "feat: wire Auth into app boot, Router guard, and index.php includes"
```

---

### Task 4: Sidebar Lock button

**Files:**
- Modify: `partials/sidebar.php`

Context: The sidebar has a footer area with user info or settings links. Read `partials/sidebar.php` to identify the footer section — it likely has a collapse toggle or settings link at the bottom. The Lock button calls `Auth.lock()`.

- [ ] **Step 1: Read `partials/sidebar.php`**

Read the full file to identify the footer section (bottom of the sidebar) and the existing button/link structure.

- [ ] **Step 2: Add Lock button to sidebar footer**

In the sidebar footer area (at the bottom, after existing footer content), add:

```html
<button id="sidebar-lock-btn" onclick="Auth.lock()"
  class="hidden w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-white/45 hover:text-white/70 hover:bg-white/5 transition-all duration-200 mt-1">
  <i class="fa-solid fa-lock-open w-5 text-center text-sm"></i>
  <span class="sidebar-label">Lock Screen</span>
</button>
```

Note: `sidebar-label` is the class used for text labels that hide when the sidebar is collapsed (verify this class name matches what `partials/sidebar.php` actually uses — adjust if different).

The button starts `hidden` and is shown by `Auth.applyRole()` after successful login (so it's never visible on the PIN screen).

Also update the lock icon to `fa-lock` when locked (optional — the button hides when locked anyway since the PIN screen takes over, so this is cosmetic).

- [ ] **Step 3: Verify in browser**

1. Log in with owner PIN.
2. Confirm "Lock Screen" button appears in sidebar footer.
3. Click it → PIN screen appears.
4. Log in as staff → button still appears.
5. Log in as owner → button appears in sidebar.

- [ ] **Step 4: Commit**

```bash
git add partials/sidebar.php
git commit -m "feat: add Lock button to sidebar footer"
```

---

### Task 5: Settings Security section

**Files:**
- Modify: `assets/js/settings.js`
- Modify: `views/settings.php`

Context: The settings view has collapsible sections. `settings.js` has a `render()` or `build()` method that populates each section. Read both files fully to understand the existing section pattern before implementing.

The Security section is owner-only — it should only show when `Auth._role === 'owner'`. Staff who somehow land on Settings will see no Security section.

- [ ] **Step 1: Read `views/settings.php` and `assets/js/settings.js`**

Read both files completely. Map out:
- How existing settings sections are structured in HTML (`views/settings.php`)
- How `settings.js` reads and saves section data
- Where to add the Security section HTML

- [ ] **Step 2: Add Security section HTML to `views/settings.php`**

At the bottom of the settings form (after the last existing section, before the closing `</section>`), add:

```html
<!-- Security Section (rendered dynamically by settings.js) -->
<div id="settings-security-section" class="hidden">
  <div class="glass rounded-2xl overflow-hidden mb-4">
    <div class="px-5 py-4 border-b border-white/6">
      <h3 class="text-sm font-bold text-white flex items-center gap-2">
        <i class="fa-solid fa-shield-halved text-sm" style="color:#C9A84C"></i>
        Security
      </h3>
      <p class="text-xs text-white/35 mt-0.5">PIN management and staff access control</p>
    </div>
    <div class="p-5 space-y-6">

      <!-- PIN Change -->
      <div class="grid grid-cols-2 gap-4">
        <div>
          <p class="text-xs font-semibold text-white/70 mb-1">Owner PIN</p>
          <p class="text-xs text-white/35 mb-3">Current PIN: <span id="sec-owner-pin-display">••••</span></p>
          <button onclick="Settings.changePIN('owner')" class="btn-secondary text-xs px-3 py-2 rounded-lg">
            <i class="fa-solid fa-pen mr-1.5 text-[10px]"></i>Change Owner PIN
          </button>
        </div>
        <div>
          <p class="text-xs font-semibold text-white/70 mb-1">Staff PIN</p>
          <p class="text-xs text-white/35 mb-3">Current PIN: <span id="sec-staff-pin-display">••••</span></p>
          <button onclick="Settings.changePIN('staff')" class="btn-secondary text-xs px-3 py-2 rounded-lg">
            <i class="fa-solid fa-pen mr-1.5 text-[10px]"></i>Change Staff PIN
          </button>
        </div>
      </div>

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

<!-- PIN Change Mini-Modal -->
<div id="modal-pin-change" class="modal-backdrop hidden" onclick="if(event.target===this)closeModal('modal-pin-change')">
  <div class="modal-card max-w-xs mx-auto">
    <div class="modal-header">
      <h3 id="pin-change-title" class="modal-title">Change PIN</h3>
      <button onclick="closeModal('modal-pin-change')" class="modal-close"><i class="fa-solid fa-xmark"></i></button>
    </div>
    <div class="p-5 space-y-4">
      <div>
        <label class="text-xs text-white/45 mb-1.5 block font-medium">New PIN (4 digits)</label>
        <input type="password" id="pin-change-new" maxlength="4" pattern="[0-9]{4}" inputmode="numeric" placeholder="••••" class="inp">
      </div>
      <div>
        <label class="text-xs text-white/45 mb-1.5 block font-medium">Confirm PIN</label>
        <input type="password" id="pin-change-confirm" maxlength="4" pattern="[0-9]{4}" inputmode="numeric" placeholder="••••" class="inp">
      </div>
    </div>
    <div class="modal-footer">
      <button onclick="closeModal('modal-pin-change')" class="btn-secondary flex-1">Cancel</button>
      <button onclick="Settings.savePIN()" class="btn-primary flex-1">Save PIN</button>
    </div>
  </div>
</div>
```

- [ ] **Step 3: Add Security methods to `settings.js`**

Read `settings.js` to understand its structure. Add the following methods to the Settings object. Also, call `Settings._renderSecurity()` from within the existing `render()` or `build()` method at the end.

```js
_renderSecurity() {
  const section = document.getElementById('settings-security-section');
  if (!section) return;

  if (Auth._role !== 'owner') {
    section.classList.add('hidden');
    return;
  }
  section.classList.remove('hidden');

  const pins = AppData.settings.pins || { owner: '1234', staff: '0000' };
  const ownerDisplay = document.getElementById('sec-owner-pin-display');
  const staffDisplay = document.getElementById('sec-staff-pin-display');
  if (ownerDisplay) ownerDisplay.textContent = pins.owner ? '••••' : 'Not set';
  if (staffDisplay) staffDisplay.textContent = pins.staff ? '••••' : 'Not set';

  const access = AppData.settings.staffAccess || {};
  const modules = [
    { key: 'analytics',  label: 'Analytics',  icon: 'fa-chart-bar' },
    { key: 'services',   label: 'Services',   icon: 'fa-scissors' },
    { key: 'barbers',    label: 'Barbers',    icon: 'fa-user-tie' },
    { key: 'inventory',  label: 'Inventory',  icon: 'fa-boxes-stacking' },
    { key: 'settings',   label: 'Settings',   icon: 'fa-gear' },
  ];
  const container = document.getElementById('sec-access-toggles');
  if (!container) return;
  container.innerHTML = modules.map(m => `
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2">
        <i class="fa-solid ${m.icon} text-xs text-white/35 w-4 text-center"></i>
        <span class="text-sm text-white">${m.label}</span>
      </div>
      <label class="tog">
        <input type="checkbox" onchange="Settings._saveStaffAccess('${m.key}', this.checked)"
          ${access[m.key] ? 'checked' : ''}>
        <span class="tog-slider"></span>
      </label>
    </div>
  `).join('');
},

_saveStaffAccess(module, allowed) {
  if (!AppData.settings.staffAccess) AppData.settings.staffAccess = {};
  AppData.settings.staffAccess[module] = allowed;
  StorageManager.save('settings', AppData.settings);
  Auth.applyRole();
  showToast(`${module.charAt(0).toUpperCase() + module.slice(1)} access ${allowed ? 'granted' : 'revoked'} for staff`, 'info');
},

_pinChangeTarget: null,

changePIN(role) {
  this._pinChangeTarget = role;
  document.getElementById('pin-change-title').textContent = role === 'owner' ? 'Change Owner PIN' : 'Change Staff PIN';
  document.getElementById('pin-change-new').value = '';
  document.getElementById('pin-change-confirm').value = '';
  openModal('modal-pin-change');
},

savePIN() {
  const newPin     = document.getElementById('pin-change-new').value.trim();
  const confirmPin = document.getElementById('pin-change-confirm').value.trim();

  if (!/^\d{4}$/.test(newPin)) {
    showToast('PIN must be exactly 4 digits', 'error'); return;
  }
  if (newPin !== confirmPin) {
    showToast('PINs do not match', 'error'); return;
  }
  if (!AppData.settings.pins) AppData.settings.pins = { owner: '1234', staff: '0000' };
  AppData.settings.pins[this._pinChangeTarget] = newPin;
  StorageManager.save('settings', AppData.settings);
  closeModal('modal-pin-change');
  showToast(`${this._pinChangeTarget === 'owner' ? 'Owner' : 'Staff'} PIN updated`, 'success');
  this._renderSecurity();
},
```

- [ ] **Step 4: Call `_renderSecurity()` from the Settings build/render method**

Find where settings sections are rendered (the main `render()`, `build()`, or `init()` call in `settings.js`). At the end of that method, add:
```js
this._renderSecurity();
```

- [ ] **Step 5: Verify in browser**

1. Log in as owner → navigate to Settings.
2. Scroll to bottom → Security section appears.
3. Staff module access toggles are visible. Toggle "Analytics" ON → `Auth.applyRole()` fires → Analytics nav item appears immediately.
4. Toggle it back OFF → Analytics nav item disappears.
5. Click "Change Owner PIN" → mini-modal opens.
6. Enter `4321` twice → Save → toast "Owner PIN updated".
7. Click Lock → enter `4321` on PIN screen → logs in as owner. Old PIN `1234` no longer works.
8. Log in as staff (using staff PIN `0000`) → navigate to Settings → Security section is HIDDEN.

- [ ] **Step 6: Commit**

```bash
git add views/settings.php assets/js/settings.js
git commit -m "feat: add Security section to Settings with PIN management and staff access toggles"
```

---

### Task 6: Include `modal-pin-change` and final integration check

**Context:** The `modal-pin-change` mini-modal is defined inside `views/settings.php` (added in Task 5). Since it uses `openModal()` / `closeModal()`, it must be inside the page DOM. Verify it is accessible and styled correctly.

This task is a final integration check — no new code, just verification across all auth flows.

- [ ] **Step 1: Full auth flow test as owner**

1. Hard-refresh the page (Ctrl+Shift+R) to clear sessionStorage.
2. PIN screen appears.
3. Click digit buttons 1-2-3-4 → success, app loads.
4. All nav items visible (Analytics, Services, Barbers, Inventory, Settings, Customers, POS, Appointments, Dashboard).
5. Navigate to each view — all accessible.
6. Click Lock → PIN screen appears.

- [ ] **Step 2: Full auth flow test as staff**

1. Enter staff PIN `0000`.
2. Barbers, Analytics, Services, Inventory, Settings nav items are HIDDEN.
3. POS, Appointments, Customers, Dashboard nav items are VISIBLE.
4. Type `Router.go('barbers')` in DevTools Console → toast "Access restricted", no navigation.
5. Click Lock → PIN screen.

- [ ] **Step 3: Test staffAccess toggle effect**

1. Log in as owner.
2. Go to Settings → Security → Toggle "Analytics" ON.
3. Lock → log in as staff.
4. Analytics nav item is now VISIBLE.
5. Click Analytics → view loads.
6. Lock → log in as owner → Settings → Security → Toggle "Analytics" OFF.
7. Lock → log in as staff → Analytics nav HIDDEN again.

- [ ] **Step 4: Test PIN change and verify login**

1. Log in as owner → Settings → Security → Change Staff PIN to `1111` → Save.
2. Lock → try old staff PIN `0000` → shake animation.
3. Enter new staff PIN `1111` → success.

- [ ] **Step 5: Commit final wiring**

```bash
git add assets/js/auth.js views/pin-screen.php
git commit -m "feat: complete auth system — PIN screen, roles, and staff access control"
```

---

### Final: Push and Deploy

- [ ] **Push to GitHub**

```bash
git push origin main
```

- [ ] **Deploy to server**

```bash
ssh -i ~/.ssh/hostinger_deploy -p 65002 u929568672@145.79.28.63 "cd ~/domains/nextapmy.com/public_html/__HAB && bash deploy.sh"
```

- [ ] **Smoke-test on live site**

1. Open `hab.nextapmy.com` — PIN screen appears.
2. Owner PIN works → full access.
3. Staff PIN works → restricted nav.
4. Lock button works in sidebar.
5. Settings → Security section visible for owner only.
6. PIN change works and persists on next login.
7. staffAccess toggles immediately update nav visibility.
8. Hard-refresh → PIN screen (sessionStorage cleared).

---

## Key Implementation Notes

- **`Auth.init()` is the first call in `App.init()`** — the PIN screen shows before any module initialises, so no module data or UI is accessible before auth.
- **`sessionStorage` not `localStorage`** — role clears on tab close. Intentional. Owner must re-enter PIN each session.
- **No lockout on wrong PIN** — intentional, this is a POS not a bank vault. False entries don't lock out the device.
- **`staffAccess` changes take effect immediately** — `Auth.applyRole()` re-hides/shows nav without requiring re-login.
- **Router guard is defence-in-depth** — even if a staff user manually calls `Router.go('settings')` via DevTools, they get "Access restricted" toast and no navigation.
- **`auth.js` must load AFTER `app.js`** (needs `AppData`, `StorageManager`, `showToast`) but BEFORE all other modules (they must not run before auth).
