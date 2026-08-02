# POS Shift Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add session-based opening/closing to the POS — cash float, hard gate, cross-device sync, and a full closing report with cash variance.

**Architecture:** New `shifts` MySQL table + `api/shifts.php` endpoint; `App.session` object hydrated at boot and every 30s poll; new `SessionManager` JS object handles lock/unlock logic; POS `init()` checks session before rendering.

**Tech Stack:** PHP/MySQLi (existing pattern), vanilla JS, Tailwind CSS, existing `openModal`/`closeModal`/`showToast` utilities.

**Spec:** `docs/superpowers/specs/2026-07-05-pos-shift-management-design.md`

---

## File Map

| File | Action |
|------|--------|
| `database.sql` | Append `CREATE TABLE shifts` |
| `assets/js/auth.js` | Add `Auth.verifyPin(role, pin)` helper |
| `api/shifts.php` | New — GET / POST / PATCH |
| `assets/js/app.js` | Add `API.fetchShift/openShift/closeShift`; add `App.session`; update `init()` and `_startPolling()` |
| `assets/js/session.js` | New — `SessionManager` object |
| `modals/modal-shift.php` | Replace with open-session + close-session + PIN-verify modals |
| `views/pos.php` | Add `id="pos-layout"`, session bar placeholder, locked-screen div |
| `assets/js/pos.js` | Add session gate at top of `init()` |
| `index.php` | Add `session.js` script tag before `pos.js` |

---

### Task 1: Add `shifts` table to `database.sql`

**Files:**
- Modify: `database.sql` (append after the last `ALTER TABLE` line at the end of the file)

- [ ] **Step 1: Append the CREATE TABLE statement**

Open `database.sql` and add this block at the very end of the file:

```sql
-- ── Table: shifts (POS session / shift management) ───────────
CREATE TABLE IF NOT EXISTS `shifts` (
  `id`          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `branch_id`   TINYINT UNSIGNED NOT NULL DEFAULT 1,
  `date`        DATE NOT NULL,
  `open_time`   TIME NOT NULL,
  `open_by`     VARCHAR(20) NOT NULL DEFAULT 'staff',
  `open_float`  DECIMAL(10,2) NOT NULL DEFAULT 0,
  `close_time`  TIME DEFAULT NULL,
  `close_float` DECIMAL(10,2) DEFAULT NULL,
  `close_note`  VARCHAR(255) DEFAULT NULL,
  `status`      ENUM('open','closed') NOT NULL DEFAULT 'open',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_branch_date` (`branch_id`,`date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

- [ ] **Step 2: Run the CREATE TABLE on the live server**

SSH into the server and run the SQL directly in MySQL:

```bash
ssh -i ~/.ssh/hostinger_deploy -p 65002 u929568672@145.79.28.63 \
  "mysql -u u929568672_hab -pNextap@2025 u929568672_hab -e \"
    CREATE TABLE IF NOT EXISTS shifts (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT,
      branch_id TINYINT UNSIGNED NOT NULL DEFAULT 1,
      date DATE NOT NULL,
      open_time TIME NOT NULL,
      open_by VARCHAR(20) NOT NULL DEFAULT 'staff',
      open_float DECIMAL(10,2) NOT NULL DEFAULT 0,
      close_time TIME DEFAULT NULL,
      close_float DECIMAL(10,2) DEFAULT NULL,
      close_note VARCHAR(255) DEFAULT NULL,
      status ENUM('open','closed') NOT NULL DEFAULT 'open',
      PRIMARY KEY (id),
      UNIQUE KEY uq_branch_date (branch_id,date)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  \""
```

Expected: no error output.

- [ ] **Step 3: Commit**

```bash
git add database.sql
git commit -m "feat: add shifts table for POS session management"
```

---

### Task 2: Add `Auth.verifyPin()` to `auth.js`

**Files:**
- Modify: `assets/js/auth.js` (add one method to the `Auth` object, before the closing `};`)

- [ ] **Step 1: Add the method**

In `assets/js/auth.js`, find the closing `};` of the `Auth` object (after the `canAccess` method, around line 129) and add `verifyPin` before it:

```js
  verifyPin(role, pin) {
    const pins = AppData?.settings?.pins || { owner: '1234', staff: '0000' };
    return pin === pins[role];
  }
```

Result — the end of `Auth` should look like:

```js
  canAccess(view) {
    if (!this._role) return false;
    if (this._role === 'owner') return true;
    const restricted = ['analytics', 'services', 'barbers', 'inventory', 'settings'];
    if (!restricted.includes(view)) return true;
    return (AppData?.settings?.staffAccess || {})[view] === true;
  },

  verifyPin(role, pin) {
    const pins = AppData?.settings?.pins || { owner: '1234', staff: '0000' };
    return pin === pins[role];
  }
};
```

- [ ] **Step 2: Commit**

```bash
git add assets/js/auth.js
git commit -m "feat: add Auth.verifyPin helper for session PIN check"
```

---

### Task 3: Create `api/shifts.php`

**Files:**
- Create: `api/shifts.php`

- [ ] **Step 1: Create the file**

```php
<?php
// ============================================================
// HAB Barbershop POS — Shifts API
// GET   /api/shifts.php?branch_id=1&date=2026-07-05
// POST  /api/shifts.php   { branch_id, open_by, open_float }
// PATCH /api/shifts.php   { id, close_float, close_note }
// ============================================================
require '../config.php';

header('Content-Type: application/json; charset=utf-8');

$token = $_SERVER['HTTP_X_API_TOKEN'] ?? '';
if (!defined('API_TOKEN') || $token !== API_TOKEN) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];

// ── GET: fetch today's shift ──────────────────────────────────
if ($method === 'GET') {
    $branchId = (int)($_GET['branch_id'] ?? 1);
    $date     = preg_replace('/[^0-9\-]/', '', $_GET['date'] ?? date('Y-m-d'));

    $stmt = $conn->prepare(
        "SELECT id, branch_id,
                DATE_FORMAT(date,'%Y-%m-%d')   AS date,
                TIME_FORMAT(open_time,'%H:%i') AS open_time,
                open_by, open_float,
                TIME_FORMAT(close_time,'%H:%i') AS close_time,
                close_float, close_note, status
         FROM shifts WHERE branch_id = ? AND date = ?"
    );
    $stmt->bind_param('is', $branchId, $date);
    $stmt->execute();
    $shift = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    // Auto-close stale open shift from a past date
    if ($shift && $shift['date'] < $date && $shift['status'] === 'open') {
        $staleId = (int)$shift['id'];
        $upd = $conn->prepare(
            "UPDATE shifts SET status='closed', close_time=NOW(), close_note='Auto-closed'
             WHERE id = ?"
        );
        $upd->bind_param('i', $staleId);
        $upd->execute();
        $upd->close();
        $shift = null;
    }

    echo json_encode(['shift' => $shift]);
    exit;
}

// ── POST: open a new shift ────────────────────────────────────
if ($method === 'POST') {
    $body      = json_decode(file_get_contents('php://input'), true) ?? [];
    $branchId  = (int)($body['branch_id']  ?? 1);
    $openBy    = substr($body['open_by']   ?? 'staff', 0, 20);
    $openFloat = (float)($body['open_float'] ?? 0);

    $stmt = $conn->prepare(
        "INSERT INTO shifts (branch_id, date, open_time, open_by, open_float)
         VALUES (?, CURDATE(), NOW(), ?, ?)"
    );
    $stmt->bind_param('isd', $branchId, $openBy, $openFloat);
    $ok = $stmt->execute();
    $stmt->close();

    if (!$ok) {
        if ($conn->errno === 1062) {
            // Shift already exists — return it so client can hydrate
            $sel = $conn->prepare(
                "SELECT id, branch_id,
                        DATE_FORMAT(date,'%Y-%m-%d')   AS date,
                        TIME_FORMAT(open_time,'%H:%i') AS open_time,
                        open_by, open_float,
                        TIME_FORMAT(close_time,'%H:%i') AS close_time,
                        close_float, close_note, status
                 FROM shifts WHERE branch_id = ? AND date = CURDATE()"
            );
            $sel->bind_param('i', $branchId);
            $sel->execute();
            $existing = $sel->get_result()->fetch_assoc();
            $sel->close();
            echo json_encode(['ok' => false, 'error' => 'shift_exists', 'shift' => $existing]);
        } else {
            echo json_encode(['ok' => false, 'error' => $conn->error]);
        }
        exit;
    }

    $newId = $conn->insert_id;
    $sel = $conn->prepare(
        "SELECT id, branch_id,
                DATE_FORMAT(date,'%Y-%m-%d')   AS date,
                TIME_FORMAT(open_time,'%H:%i') AS open_time,
                open_by, open_float,
                TIME_FORMAT(close_time,'%H:%i') AS close_time,
                close_float, close_note, status
         FROM shifts WHERE id = ?"
    );
    $sel->bind_param('i', $newId);
    $sel->execute();
    $newShift = $sel->get_result()->fetch_assoc();
    $sel->close();

    echo json_encode(['ok' => true, 'shift' => $newShift]);
    exit;
}

// ── PATCH: close a shift ──────────────────────────────────────
if ($method === 'PATCH') {
    $body       = json_decode(file_get_contents('php://input'), true) ?? [];
    $id         = (int)($body['id'] ?? 0);
    $closeFloat = isset($body['close_float']) ? (float)$body['close_float'] : null;
    $closeNote  = substr($body['close_note'] ?? '', 0, 255);

    if (!$id) {
        http_response_code(400);
        echo json_encode(['ok' => false, 'error' => 'Missing id']);
        exit;
    }

    $stmt = $conn->prepare(
        "UPDATE shifts SET status='closed', close_time=NOW(),
         close_float=?, close_note=? WHERE id=?"
    );
    $stmt->bind_param('dsi', $closeFloat, $closeNote, $id);
    $ok       = $stmt->execute();
    $affected = $stmt->affected_rows;
    $stmt->close();

    echo json_encode(['ok' => $ok && $affected > 0]);
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Method not allowed']);
```

- [ ] **Step 2: Commit**

```bash
git add api/shifts.php
git commit -m "feat: add api/shifts.php for POS shift open/close"
```

---

### Task 4: Update `assets/js/app.js` — API methods, `App.session`, boot & poll

**Files:**
- Modify: `assets/js/app.js` (four separate edits)

- [ ] **Step 1: Add three methods to the `API` object**

In `assets/js/app.js`, find the `clearTransactions()` method (the last method in the `API` object). Add these three methods after it, before the closing `};` of the `API` object:

```js
  async fetchShift(branchId, date) {
    try {
      const res = await fetch(`api/shifts.php?branch_id=${branchId}&date=${date}`, { headers: this._h() });
      if (!res.ok) return null;
      return res.json();
    } catch { return null; }
  },

  async openShift(payload) {
    try {
      const res = await fetch('api/shifts.php', {
        method: 'POST',
        headers: this._h(),
        body: JSON.stringify(payload)
      });
      if (!res.ok) return { ok: false };
      return res.json();
    } catch { return { ok: false }; }
  },

  async closeShift(payload) {
    try {
      const res = await fetch('api/shifts.php', {
        method: 'PATCH',
        headers: this._h(),
        body: JSON.stringify(payload)
      });
      if (!res.ok) return { ok: false };
      return res.json();
    } catch { return { ok: false }; }
  }
```

- [ ] **Step 2: Add `session` property to the `App` object**

Find `const App = {` and its opening properties (`currentBranch: 1`, `lastSyncAt: null`). Add `session` alongside them:

```js
const App = {
  currentBranch: 1,
  lastSyncAt: null,
  session: {
    isOpen:    false,
    id:        null,
    date:      null,
    openTime:  null,
    openBy:    null,
    openFloat: 0
  },
```

- [ ] **Step 3: Update `App.init()` to fetch the shift after boot**

In `App.init()`, find the line `this._startPolling();` (the last line of the `init()` method). Insert the shift fetch immediately before it:

```js
    // Fetch today's shift after currentBranch is set
    try {
      const shiftData = await API.fetchShift(this.currentBranch || 1, today());
      if (typeof SessionManager !== 'undefined') SessionManager.load(shiftData?.shift ?? null);
    } catch {}
    this._startPolling();
```

- [ ] **Step 4: Update `App._startPolling()` to refresh shift state every 30s**

In the `_startPolling()` method, find the end of the `try` block (just before `this.lastSyncAt = new Date().toISOString();`). Add the shift refresh:

```js
        // Refresh shift state
        const shiftData = await API.fetchShift(App.currentBranch || 1, today());
        const newIsOpen = !!(shiftData?.shift?.status === 'open');
        if (newIsOpen !== App.session.isOpen) {
          if (typeof SessionManager !== 'undefined') SessionManager.load(shiftData?.shift ?? null);
        }

        this.lastSyncAt = new Date().toISOString();
```

- [ ] **Step 5: Commit**

```bash
git add assets/js/app.js
git commit -m "feat: add shift API methods and App.session to app.js"
```

---

### Task 5: Create `assets/js/session.js`

**Files:**
- Create: `assets/js/session.js`

- [ ] **Step 1: Create the file**

```js
// ============================================================
// HAB Barbershop POS — Session Manager
// Handles POS shift open/close, locked screen, and close report
// ============================================================

const SessionManager = {
  _pinCallback: null,

  // ── Load shift state from API response ──────────────────────
  load(shiftRow) {
    if (shiftRow && shiftRow.status === 'open') {
      App.session = {
        isOpen:    true,
        id:        parseInt(shiftRow.id),
        date:      shiftRow.date,
        openTime:  shiftRow.open_time,
        openBy:    shiftRow.open_by,
        openFloat: parseFloat(shiftRow.open_float) || 0
      };
    } else {
      App.session = { isOpen:false, id:null, date:null, openTime:null, openBy:null, openFloat:0 };
    }
    if (Router.current === 'pos') POS.init();
  },

  // ── Open a new shift ────────────────────────────────────────
  async open() {
    const floatInput = document.getElementById('open-session-float');
    const openFloat  = parseFloat(floatInput?.value || 0) || 0;
    const openedBy   = Auth._role || 'staff';

    const btn = document.getElementById('btn-open-session');
    if (btn) { btn.disabled = true; btn.textContent = 'Opening…'; }

    const res = await API.openShift({
      branch_id:  App.currentBranch || 1,
      open_by:    openedBy,
      open_float: openFloat
    });

    if (btn) { btn.disabled = false; btn.textContent = 'Open Session'; }

    if (res.ok || res.error === 'shift_exists') {
      this.load(res.shift);
      closeModal('modal-open-session');
      showToast('Session opened — have a great day!', 'success');
    } else {
      showToast('Failed to open session. Please try again.', 'error');
    }
  },

  // ── Close the current shift ─────────────────────────────────
  async close() {
    const closeFloat = parseFloat(document.getElementById('close-actual-cash')?.value || 0) || 0;
    const closeNote  = (document.getElementById('close-note')?.value || '').trim();

    const btn = document.getElementById('btn-close-session');
    if (btn) { btn.disabled = true; btn.textContent = 'Closing…'; }

    const res = await API.closeShift({
      id:          App.session.id,
      close_float: closeFloat,
      close_note:  closeNote
    });

    if (btn) { btn.disabled = false; btn.textContent = 'Close Session'; }

    if (res.ok) {
      App.session = { isOpen:false, id:null, date:null, openTime:null, openBy:null, openFloat:0 };
      closeModal('modal-close-session');
      if (Router.current === 'pos') POS.init();
      showToast('Session closed. See you tomorrow!', 'info');
    } else {
      showToast('Failed to close session. Please retry.', 'error');
    }
  },

  // ── Render locked screen inside POS view ────────────────────
  renderLockedScreen() {
    const overlay = document.getElementById('pos-locked-screen');
    const layout  = document.getElementById('pos-layout');
    const bar     = document.getElementById('pos-session-bar');
    if (overlay) {
      overlay.innerHTML = `
        <div class="w-20 h-20 rounded-3xl glass-gold flex items-center justify-center mb-6 mx-auto">
          <i class="fa-solid fa-lock text-gold text-3xl"></i>
        </div>
        <h2 class="text-2xl font-bold text-white mb-2">POS Closed</h2>
        <p class="text-sm text-white/40 mb-8">${formatDate(today())}</p>
        <button onclick="SessionManager._openSessionModal()"
          class="btn-gold px-10 py-3 rounded-xl text-sm font-bold flex items-center gap-2 mx-auto">
          <i class="fa-solid fa-lock-open"></i> Open Session
        </button>`;
      overlay.classList.remove('hidden');
    }
    if (layout) layout.classList.add('hidden');
    if (bar)    bar.classList.add('hidden');
  },

  // ── Render session status bar when shift is open ────────────
  renderStatusBar() {
    const bar = document.getElementById('pos-session-bar');
    if (!bar) return;
    bar.innerHTML = `
      <div class="flex items-center gap-3 text-white/50 text-xs">
        <i class="fa-solid fa-circle text-green-400 text-[8px]"></i>
        <span>Session opened at <strong class="text-white">${App.session.openTime || '—'}</strong></span>
        <span class="text-white/20">·</span>
        <span>Float: <strong class="text-white">${formatRp(App.session.openFloat)}</strong></span>
      </div>
      <button onclick="SessionManager.requireOwnerPin(() => SessionManager._openCloseModal())"
        class="text-xs px-3 py-1.5 rounded-lg border font-semibold transition-colors flex items-center gap-1.5"
        style="border-color:rgba(201,168,76,.4);color:rgba(201,168,76,.8)">
        <i class="fa-solid fa-door-open"></i> Close Session
      </button>`;
    bar.classList.remove('hidden');

    const overlay = document.getElementById('pos-locked-screen');
    const layout  = document.getElementById('pos-layout');
    if (overlay) overlay.classList.add('hidden');
    if (layout)  layout.classList.remove('hidden');
  },

  // ── Owner PIN gate ──────────────────────────────────────────
  requireOwnerPin(callback) {
    this._pinCallback = callback;
    const el = document.getElementById('pin-close-input');
    if (el) el.value = '';
    openModal('modal-pin-close');
    setTimeout(() => el?.focus(), 150);
  },

  _verifyOwnerPin() {
    const pin = document.getElementById('pin-close-input')?.value || '';
    if (!Auth.verifyPin('owner', pin)) {
      showToast('Incorrect PIN', 'error');
      const el = document.getElementById('pin-close-input');
      if (el) { el.value = ''; el.focus(); }
      return;
    }
    closeModal('modal-pin-close');
    if (this._pinCallback) { this._pinCallback(); this._pinCallback = null; }
  },

  // ── Open session modal ──────────────────────────────────────
  _openSessionModal() {
    const el = document.getElementById('open-session-float');
    if (el) el.value = '';
    openModal('modal-open-session');
    setTimeout(() => el?.focus(), 150);
  },

  // ── Open close session modal with Step 1 visible ───────────
  _openCloseModal() {
    document.getElementById('close-step-1')?.classList.remove('hidden');
    document.getElementById('close-step-2')?.classList.add('hidden');
    const el = document.getElementById('close-actual-cash');
    if (el) el.value = '';
    const noteEl = document.getElementById('close-note');
    if (noteEl) noteEl.value = '';
    openModal('modal-close-session');
    setTimeout(() => el?.focus(), 150);
  },

  // ── Build and show shift report (Step 2) ────────────────────
  generateReport() {
    const closeFloat = parseFloat(document.getElementById('close-actual-cash')?.value || 0) || 0;
    const shiftDate  = App.session.date || today();
    const branchId   = App.currentBranch || 1;

    const trx = AppData.transactions.filter(t =>
      t.date === shiftDate && (t.branchId === branchId || branchId === 0)
    );

    const totalRevenue = trx.reduce((s, t) => s + (t.total || 0), 0);
    const trxCount     = trx.length;

    // Payment method breakdown
    const methods = { cash: 0, card: 0, qr: 0 };
    trx.forEach(t => { if (methods[t.method] != null) methods[t.method] += t.total; });

    // Per-barber breakdown
    const barberMap = {};
    trx.forEach(t => {
      const key = t.barberId || 0;
      if (!barberMap[key]) {
        barberMap[key] = { name: getBarberById(key)?.name || 'Unknown / Walk-in', total: 0, count: 0 };
      }
      barberMap[key].total += t.total;
      barberMap[key].count++;
    });

    // Cash reconciliation
    const cashSales   = methods.cash;
    const expectedCash = App.session.openFloat + cashSales;
    const variance     = closeFloat - expectedCash;
    const varColor     = variance >= 0 ? '#4ade80' : '#f87171';
    const varSign      = variance >= 0 ? '+' : '';

    // Method rows
    const methodRows = Object.entries({ cash:'Cash', card:'Card / EDC', qr:'QR Pay' })
      .map(([k, lbl]) => `
        <div class="flex justify-between text-xs py-1">
          <span class="text-white/45">${lbl}</span>
          <span class="font-semibold text-white">${formatRp(methods[k])}</span>
        </div>`).join('');

    // Barber rows
    const barberRows = Object.values(barberMap).length
      ? Object.values(barberMap).map(b => `
          <div class="flex justify-between text-xs py-1">
            <span class="text-white/45">${b.name} <span class="text-white/25">(${b.count} trx)</span></span>
            <span class="font-semibold text-white">${formatRp(b.total)}</span>
          </div>`).join('')
      : '<p class="text-xs text-white/25 py-1">No transactions this shift</p>';

    const dateLbl = document.getElementById('close-shift-date-lbl');
    if (dateLbl) dateLbl.textContent = formatDate(shiftDate);

    const reportEl = document.getElementById('shift-report-content');
    if (reportEl) {
      reportEl.innerHTML = `
        <!-- Summary -->
        <div class="grid grid-cols-2 gap-3 mb-4">
          <div class="glass-gold rounded-xl p-3 text-center">
            <p class="text-[10px] text-white/40 uppercase tracking-widest mb-1">Total Revenue</p>
            <div class="text-lg font-bold gold-text">${formatRp(totalRevenue)}</div>
          </div>
          <div class="glass rounded-xl p-3 text-center">
            <p class="text-[10px] text-white/40 uppercase tracking-widest mb-1">Transactions</p>
            <div class="text-lg font-bold text-white">${trxCount}</div>
          </div>
        </div>

        <!-- Payment breakdown -->
        <div class="glass rounded-xl p-4 mb-3">
          <h4 class="text-[10px] font-semibold text-white/40 uppercase tracking-wide mb-2">Payment Breakdown</h4>
          ${methodRows}
        </div>

        <!-- Per-barber -->
        <div class="glass rounded-xl p-4 mb-3">
          <h4 class="text-[10px] font-semibold text-white/40 uppercase tracking-wide mb-2">Barber Performance</h4>
          ${barberRows}
        </div>

        <!-- Cash reconciliation -->
        <div class="glass-gold rounded-xl p-4 mb-1">
          <h4 class="text-[10px] font-semibold text-gold/60 uppercase tracking-wide mb-2">Cash Drawer</h4>
          <div class="flex justify-between text-xs py-1">
            <span class="text-white/45">Opening Float</span>
            <span class="text-white font-semibold">${formatRp(App.session.openFloat)}</span>
          </div>
          <div class="flex justify-between text-xs py-1">
            <span class="text-white/45">Cash Sales</span>
            <span class="text-green-400 font-semibold">${formatRp(cashSales)}</span>
          </div>
          <div class="flex justify-between text-xs py-1 border-t border-white/8 pt-2 mt-1">
            <span class="text-white/70 font-semibold">Expected in Drawer</span>
            <span class="gold-text font-bold">${formatRp(expectedCash)}</span>
          </div>
          <div class="flex justify-between text-xs py-1">
            <span class="text-white/45">Actual Counted</span>
            <span class="text-white font-semibold">${formatRp(closeFloat)}</span>
          </div>
          <div class="flex justify-between text-sm py-2 border-t border-white/8 mt-1">
            <span class="text-white font-bold">Variance</span>
            <span class="font-bold" style="color:${varColor}">${varSign}${formatRp(variance)}</span>
          </div>
        </div>`;
    }

    document.getElementById('close-step-1')?.classList.add('hidden');
    document.getElementById('close-step-2')?.classList.remove('hidden');
  }
};
```

- [ ] **Step 2: Commit**

```bash
git add assets/js/session.js
git commit -m "feat: add SessionManager for POS shift open/close/report"
```

---

### Task 6: Replace `modals/modal-shift.php`

**Files:**
- Modify: `modals/modal-shift.php` (full replacement — existing content is removed)

- [ ] **Step 1: Replace the entire file**

```php
<!-- ══ MODAL: OPEN SESSION ══════════════════════════════════ -->
<div id="modal-open-session" class="modal-overlay hidden" onclick="if(event.target===this)closeModal('modal-open-session')">
  <div class="modal-card max-w-sm mx-auto">
    <div class="modal-header">
      <div>
        <h3 class="modal-title">Open POS Session</h3>
        <p class="text-xs text-white/35 mt-0.5">Enter today's opening cash float to begin</p>
      </div>
      <button onclick="closeModal('modal-open-session')" class="modal-close"><i class="fa-solid fa-xmark"></i></button>
    </div>
    <div class="p-5">
      <label class="text-xs text-white/45 mb-1.5 block font-medium">Opening Cash Float (RM)</label>
      <input type="number" id="open-session-float" min="0" step="0.50" placeholder="0.00"
        class="inp text-center text-xl" onkeydown="if(event.key==='Enter')SessionManager.open()">
      <p class="text-[10px] text-white/30 mt-2 text-center">This is the amount of cash physically in the drawer right now.</p>
    </div>
    <div class="modal-footer">
      <button onclick="closeModal('modal-open-session')" class="btn-outline flex-1">Cancel</button>
      <button id="btn-open-session" onclick="SessionManager.open()" class="btn-gold flex-1 flex items-center justify-center gap-2">
        <i class="fa-solid fa-lock-open text-sm"></i> Open Session
      </button>
    </div>
  </div>
</div>

<!-- ══ MODAL: CLOSE SESSION ═════════════════════════════════ -->
<div id="modal-close-session" class="modal-overlay hidden" onclick="if(event.target===this)closeModal('modal-close-session')">
  <div class="modal-card max-w-lg mx-auto">

    <!-- Step 1: Cash count input -->
    <div id="close-step-1">
      <div class="modal-header">
        <div>
          <h3 class="modal-title">Close Session</h3>
          <p class="text-xs text-white/35 mt-0.5">Count the cash in your drawer and enter the total</p>
        </div>
        <button onclick="closeModal('modal-close-session')" class="modal-close"><i class="fa-solid fa-xmark"></i></button>
      </div>
      <div class="p-5 space-y-4">
        <div>
          <label class="text-xs text-white/45 mb-1.5 block font-medium">Actual Cash in Drawer (RM)</label>
          <input type="number" id="close-actual-cash" min="0" step="0.50" placeholder="0.00"
            class="inp text-center text-xl">
        </div>
        <div>
          <label class="text-xs text-white/45 mb-1.5 block font-medium">Note (optional)</label>
          <input type="text" id="close-note" placeholder="e.g. Short by RM 5 — checked with staff"
            class="inp text-sm">
        </div>
      </div>
      <div class="modal-footer">
        <button onclick="closeModal('modal-close-session')" class="btn-outline flex-1">Cancel</button>
        <button onclick="SessionManager.generateReport()" class="btn-gold flex-1 flex items-center justify-center gap-2">
          <i class="fa-solid fa-chart-bar text-sm"></i> Generate Report
        </button>
      </div>
    </div>

    <!-- Step 2: Shift report -->
    <div id="close-step-2" class="hidden">
      <div class="modal-header">
        <div>
          <h3 class="modal-title">Shift Report</h3>
          <p class="text-xs text-white/35 mt-0.5" id="close-shift-date-lbl">—</p>
        </div>
        <button onclick="closeModal('modal-close-session')" class="modal-close"><i class="fa-solid fa-xmark"></i></button>
      </div>
      <div class="p-5 overflow-y-auto" style="max-height:65vh">
        <div id="shift-report-print">
          <div id="shift-report-content"></div>
        </div>
      </div>
      <div class="modal-footer">
        <button onclick="window.print()" class="btn-outline flex-1 flex items-center justify-center gap-2">
          <i class="fa-solid fa-print text-sm"></i> Print
        </button>
        <button id="btn-close-session" onclick="SessionManager.close()" class="btn-gold flex-1 flex items-center justify-center gap-2">
          <i class="fa-solid fa-door-closed text-sm"></i> Close Session
        </button>
      </div>
    </div>

  </div>
</div>

<!-- ══ MODAL: OWNER PIN VERIFY (for close session) ══════════ -->
<div id="modal-pin-close" class="modal-overlay hidden" onclick="if(event.target===this)closeModal('modal-pin-close')">
  <div class="modal-card max-w-xs mx-auto">
    <div class="modal-header">
      <h3 class="modal-title">Owner PIN Required</h3>
      <button onclick="closeModal('modal-pin-close')" class="modal-close"><i class="fa-solid fa-xmark"></i></button>
    </div>
    <div class="p-5">
      <label class="text-xs text-white/45 mb-1.5 block font-medium">Enter Owner PIN (4 digits)</label>
      <input type="password" id="pin-close-input" maxlength="4" inputmode="numeric"
        placeholder="••••" class="inp text-center text-2xl tracking-widest"
        onkeydown="if(event.key==='Enter')SessionManager._verifyOwnerPin()">
    </div>
    <div class="modal-footer">
      <button onclick="closeModal('modal-pin-close')" class="btn-outline flex-1">Cancel</button>
      <button onclick="SessionManager._verifyOwnerPin()" class="btn-gold flex-1">Confirm</button>
    </div>
  </div>
</div>

<!-- Print-only: hide everything except shift report -->
<style>
  @media print {
    body > *:not(#print-receipt) { display: none !important; }
    #shift-report-print { display: block !important; padding: 24px; color: #000; background: #fff; }
  }
</style>
```

- [ ] **Step 2: Commit**

```bash
git add modals/modal-shift.php
git commit -m "feat: replace modal-shift with open/close session and PIN verify modals"
```

---

### Task 7: Update `views/pos.php` — session placeholders

**Files:**
- Modify: `views/pos.php`

- [ ] **Step 1: Add `id="pos-layout"` to the flex container**

Find the line:
```html
    <div class="flex gap-5 pos-layout" style="min-height:calc(100vh - 148px)">
```

Replace with:
```html
    <div id="pos-layout" class="flex gap-5 pos-layout" style="min-height:calc(100vh - 148px)">
```

- [ ] **Step 2: Add session bar and locked screen divs**

Find the opening `<section id="view-pos" class="view">` tag. Add two divs immediately after it (before the `pos-layout` div):

```html
<!-- ── Session Status Bar (visible when shift is open) ────── -->
<div id="pos-session-bar" class="hidden flex items-center justify-between glass rounded-xl px-4 py-2.5 mb-4"></div>

<!-- ── Locked Screen (visible when no shift is open) ─────── -->
<div id="pos-locked-screen" class="hidden flex flex-col items-center justify-center text-center"
  style="min-height:calc(100vh - 220px)"></div>
```

Result — the top of `#view-pos` should look like:

```html
<section id="view-pos" class="view">

  <!-- ── Session Status Bar (visible when shift is open) ────── -->
  <div id="pos-session-bar" class="hidden flex items-center justify-between glass rounded-xl px-4 py-2.5 mb-4"></div>

  <!-- ── Locked Screen (visible when no shift is open) ─────── -->
  <div id="pos-locked-screen" class="hidden flex flex-col items-center justify-center text-center"
    style="min-height:calc(100vh - 220px)"></div>

  <div id="pos-layout" class="flex gap-5 pos-layout" style="min-height:calc(100vh - 148px)">
    ...
```

- [ ] **Step 3: Commit**

```bash
git add views/pos.php
git commit -m "feat: add session bar and locked screen placeholders to pos.php"
```

---

### Task 8: Update `assets/js/pos.js` — session gate in `init()`

**Files:**
- Modify: `assets/js/pos.js` (add two lines at the very top of `init()`)

- [ ] **Step 1: Add the gate and status bar render**

In `assets/js/pos.js`, find the `init()` method. Its current first line is `this.renderBarberSelect();`. Add the gate check before it:

```js
  init() {
    if (!App.session.isOpen) {
      SessionManager.renderLockedScreen();
      return;
    }
    SessionManager.renderStatusBar();
    this.renderBarberSelect();
    // ... rest of existing init() unchanged
```

- [ ] **Step 2: Commit**

```bash
git add assets/js/pos.js
git commit -m "feat: gate POS init() behind session check"
```

---

### Task 9: Update `index.php` — add `session.js` script

**Files:**
- Modify: `index.php`

- [ ] **Step 1: Add the script tag**

In `index.php`, find this line (around line 64):
```html
<script src="assets/js/pos.js?v=<?= filemtime('assets/js/pos.js') ?>"></script>
```

Add the `session.js` script tag immediately **before** the `pos.js` line:

```html
<script src="assets/js/session.js?v=<?= filemtime('assets/js/session.js') ?>"></script>
<script src="assets/js/pos.js?v=<?= filemtime('assets/js/pos.js') ?>"></script>
```

- [ ] **Step 2: Commit**

```bash
git add index.php
git commit -m "feat: load session.js before pos.js in index.php"
```

---

### Task 10: Deploy and verify

- [ ] **Step 1: Deploy to server**

```bash
ssh -i ~/.ssh/hostinger_deploy -p 65002 u929568672@145.79.28.63 "cd ~/domains/nextapmy.com/public_html/__HAB && bash deploy.sh"
```

- [ ] **Step 2: Verify locked screen**

1. Open the app in the browser and navigate to POS Cashier
2. Expected: the POS shows the locked screen with a lock icon, "POS Closed", today's date, and an "Open Session" button
3. Verify that clicking any service or the Pay button is not possible (locked screen is shown instead of the service grid)

- [ ] **Step 3: Verify open session**

1. Click "Open Session" → modal appears with "Opening Cash Float (RM)" input
2. Enter `150` and click "Open Session"
3. Expected: modal closes, status bar appears at top of POS showing "Session opened at HH:MM · Float: RM 150", service grid and cart are visible

- [ ] **Step 4: Verify close session flow**

1. Click "Close Session" in the status bar
2. Expected: PIN modal appears
3. Enter owner PIN (default: `1234`)
4. Expected: close session modal Step 1 appears with cash count input
5. Enter `160` in "Actual Cash in Drawer" and click "Generate Report"
6. Expected: Step 1 hides, Step 2 shows report with summary, payment breakdown, barber performance, and cash variance (should show `+RM 10` green if no cash sales, or calculated variance)
7. Click "Close Session" — expected: modal closes, POS shows locked screen again

- [ ] **Step 5: Verify cross-device sync**

1. Open the app in two browser tabs
2. Open a session in Tab A
3. Wait up to 30 seconds in Tab B
4. Expected: Tab B's POS gate unlocks automatically (or on next POS navigation)
