# MySQL Backend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace localStorage-only data storage with a MySQL API so every device shares the same data in real time.

**Architecture:** A PHP API layer sits between the browser and MySQL. Most data (services, barbers, settings, etc.) is stored as JSON blobs in a single `app_data` key-value table. Transactions use their own normalized rows so two cashier terminals can POST simultaneously without overwriting each other. The JS boot sequence fetches all data from the API before showing the PIN screen; a 30-second polling loop keeps every device in sync without reloading the page.

**Tech Stack:** PHP 8.x, MySQLi, MySQL 8 (Hostinger), vanilla JS `fetch()`, existing `config.php` DB connection.

---

## File Structure

| File | Type | Responsibility |
|---|---|---|
| `database.sql` | Modify | Add `app_data` table; ALTER TABLE to add missing columns |
| `config.php` | Modify | Add `API_TOKEN` constant (gitignored — edit on server) |
| `config.example.php` | Modify | Add `API_TOKEN` placeholder for reference |
| `api/data.php` | Create | GET: return all blobs + transactions; POST: upsert one blob |
| `api/transactions.php` | Create | POST: INSERT one transaction; GET?all=1: all transactions; DELETE: clear all |
| `assets/js/app.js` | Modify | Add `API` object; modify `AppData.save`; async `App.init` + polling |
| `assets/js/pos.js` | Modify | Make `confirmPayment` async; await `API.saveTransaction` before receipt |
| `assets/js/setup-wizard.js` | Modify | Call `API.clearTransactions()` when wizard clears demo data |
| `index.php` | Modify | Uncomment `require 'config.php'`; inject `HAB_API_TOKEN` JS constant |

---

### Task 1: Update database.sql — app_data table + schema patches

**Files:**
- Modify: `database.sql`

- [ ] **Step 1: Open `database.sql` and append the following block at the end of the file, after the last existing table**

```sql
-- ── Table: app_data (blob store for POS config data) ─────────
CREATE TABLE IF NOT EXISTS `app_data` (
  `data_key`   VARCHAR(50)  NOT NULL,
  `data_value` LONGTEXT     NOT NULL,
  `updated_at` TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
                            ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`data_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Schema patches (run after base schema if upgrading) ───────
ALTER TABLE `transactions`
  ADD COLUMN IF NOT EXISTS `customer_phone` VARCHAR(20) DEFAULT NULL AFTER `customer`;

ALTER TABLE `transaction_items`
  ADD COLUMN IF NOT EXISTS `commission_rm` DECIMAL(8,2) DEFAULT NULL;
```

- [ ] **Step 2: Verify the file ends with the new block**

Open `database.sql` and confirm the three new statements are at the bottom.

- [ ] **Step 3: Commit**

```bash
git add database.sql
git commit -m "feat: add app_data table and schema patches for MySQL backend"
```

---

### Task 2: Config files + inject API token into index.php

**Files:**
- Modify: `config.example.php`
- Modify: `index.php`
- Note: `config.php` is gitignored — you will edit it directly on the Hostinger server in Task 8, not here.

- [ ] **Step 1: Add `API_TOKEN` placeholder to `config.example.php`**

The current file ends at line 18 (`$conn->set_charset('utf8mb4');`). Add after that line:

```php
// ── API Token (shared secret — change this) ──────────────────
define('API_TOKEN', 'change-this-to-a-32-char-random-string');
```

- [ ] **Step 2: Update `index.php` — uncomment `require 'config.php'` and inject JS constant**

Current line 7 in `index.php`:
```php
// require 'config.php'; // Phase 2: uncomment when MySQL is ready
```

Replace it with:
```php
require 'config.php';
```

Then, find this block (around line 58 in `index.php`):
```php
<!-- ══ Scripts (order matters) ════════════════════════════════ -->
<script src="assets/js/app.js?v=<?= filemtime('assets/js/app.js') ?>"></script>
```

Add one line immediately before the `<script src="assets/js/app.js...">` line:
```php
<!-- ══ Scripts (order matters) ════════════════════════════════ -->
<script>window.HAB_API_TOKEN = '<?= htmlspecialchars(defined('API_TOKEN') ? API_TOKEN : '', ENT_QUOTES) ?>';</script>
<script src="assets/js/app.js?v=<?= filemtime('assets/js/app.js') ?>"></script>
```

- [ ] **Step 3: Verify index.php renders without PHP errors**

Open a terminal in the project root and run:
```bash
php -l index.php
```
Expected: `No syntax errors detected in index.php`

- [ ] **Step 4: Commit**

```bash
git add config.example.php index.php
git commit -m "feat: wire API_TOKEN into config and inject as JS constant"
```

---

### Task 3: Create api/data.php — blob CRUD + transactions

**Files:**
- Create: `api/data.php`

- [ ] **Step 1: Create the `api/` directory and `api/data.php`**

Create the file `api/data.php` with this complete content:

```php
<?php
// ============================================================
// HAB Barbershop POS — Blob Data API
// GET  /api/data.php           → all blobs + ALL transactions (boot)
// GET  /api/data.php?mode=poll → all blobs + today's transactions (poll)
// POST /api/data.php           → upsert one blob key
// ============================================================
require '../config.php';

// ── Auth ─────────────────────────────────────────────────────
$token = $_SERVER['HTTP_X_API_TOKEN'] ?? '';
if (!defined('API_TOKEN') || $token !== API_TOKEN) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

header('Content-Type: application/json; charset=utf-8');
$method = $_SERVER['REQUEST_METHOD'];

// ── POST: upsert one blob key ─────────────────────────────────
if ($method === 'POST') {
    $body  = json_decode(file_get_contents('php://input'), true) ?? [];
    $key   = $body['key']   ?? '';
    $value = $body['value'] ?? '';

    $allowed = ['services','barbers','appointments','inventory','queue','customers','settings','branches'];
    if (!in_array($key, $allowed, true)) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid key: ' . $key]);
        exit;
    }

    $stmt = $conn->prepare(
        "INSERT INTO app_data (data_key, data_value)
         VALUES (?, ?)
         ON DUPLICATE KEY UPDATE data_value = VALUES(data_value),
                                 updated_at = CURRENT_TIMESTAMP"
    );
    $stmt->bind_param('ss', $key, $value);
    $ok = $stmt->execute();
    $stmt->close();

    echo json_encode(['ok' => $ok]);
    exit;
}

// ── GET: return all data ──────────────────────────────────────
// Check if app_data is seeded
$res  = $conn->query("SELECT COUNT(*) AS cnt FROM app_data");
$row  = $res->fetch_assoc();
$seeded = (int)$row['cnt'] > 0;

if (!$seeded) {
    echo json_encode(['seeded' => false]);
    exit;
}

// Load all blob rows
$blobKeys = ['services','barbers','appointments','inventory','queue','customers','settings','branches'];
$data = ['seeded' => true, 'updated_at' => []];

$res = $conn->query("SELECT data_key, data_value, updated_at FROM app_data");
while ($row = $res->fetch_assoc()) {
    $parsed = json_decode($row['data_value'], true);
    $data[$row['data_key']] = $parsed;
    $data['updated_at'][$row['data_key']] = $row['updated_at'];
}

// Fill missing keys with empty defaults
foreach ($blobKeys as $k) {
    if (!array_key_exists($k, $data)) {
        $data[$k] = ($k === 'settings') ? new stdClass() : [];
    }
}

// ── Load transactions ─────────────────────────────────────────
$pollMode = (($_GET['mode'] ?? '') === 'poll');

$sql = "
    SELECT
        t.id, t.branch_id, t.customer, t.customer_phone, t.barber_id,
        t.discount, t.tax, t.total, t.method, t.tendered,
        DATE_FORMAT(t.date, '%Y-%m-%d') AS date,
        TIME_FORMAT(t.time, '%H:%i')    AS time,
        ti.item_type, ti.item_name, ti.qty, ti.price, ti.commission_rm
    FROM transactions t
    LEFT JOIN transaction_items ti ON ti.transaction_id = t.id
";
if ($pollMode) {
    $sql .= " WHERE t.date = CURDATE()";
}
$sql .= " ORDER BY t.date DESC, t.time DESC, t.id, ti.id";

$result = $conn->query($sql);
$trxMap = [];
while ($row = $result->fetch_assoc()) {
    $id = $row['id'];
    if (!isset($trxMap[$id])) {
        $trxMap[$id] = [
            'id'            => $id,
            'branchId'      => (int)$row['branch_id'],
            'customer'      => $row['customer'],
            'customerPhone' => $row['customer_phone'] ?? '',
            'barberId'      => $row['barber_id'] !== null ? (int)$row['barber_id'] : 0,
            'discount'      => (int)$row['discount'],
            'tax'           => (int)$row['tax'],
            'total'         => (float)$row['total'],
            'method'        => $row['method'],
            'tendered'      => (float)$row['tendered'],
            'date'          => $row['date'],
            'time'          => $row['time'],
            'services'      => [],
        ];
    }
    if ($row['item_name'] !== null) {
        $item = [
            'name'  => $row['item_name'],
            'qty'   => (int)$row['qty'],
            'price' => (float)$row['price'],
            'type'  => $row['item_type'] ?? 'service',
        ];
        if ($row['commission_rm'] !== null) {
            $item['commissionRM'] = (float)$row['commission_rm'];
        }
        $trxMap[$id]['services'][] = $item;
    }
}
$data['transactions'] = array_values($trxMap);

echo json_encode($data);
```

- [ ] **Step 2: Verify PHP syntax**

```bash
php -l api/data.php
```
Expected: `No syntax errors detected in api/data.php`

- [ ] **Step 3: Commit**

```bash
git add api/data.php
git commit -m "feat: create api/data.php blob CRUD and transactions GET"
```

---

### Task 4: Create api/transactions.php — save, full history, clear

**Files:**
- Create: `api/transactions.php`

- [ ] **Step 1: Create `api/transactions.php`** with this complete content:

```php
<?php
// ============================================================
// HAB Barbershop POS — Transactions API
// POST   /api/transactions.php        → INSERT one transaction
// GET    /api/transactions.php?all=1  → all transactions (analytics)
// DELETE /api/transactions.php        → clear all transactions
// ============================================================
require '../config.php';

// ── Auth ─────────────────────────────────────────────────────
$token = $_SERVER['HTTP_X_API_TOKEN'] ?? '';
if (!defined('API_TOKEN') || $token !== API_TOKEN) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

header('Content-Type: application/json; charset=utf-8');
$method = $_SERVER['REQUEST_METHOD'];

// ── DELETE: clear all transactions ───────────────────────────
if ($method === 'DELETE') {
    $conn->query("SET FOREIGN_KEY_CHECKS = 0");
    $conn->query("DELETE FROM transaction_items");
    $conn->query("DELETE FROM transactions");
    $conn->query("SET FOREIGN_KEY_CHECKS = 1");
    echo json_encode(['ok' => true]);
    exit;
}

// ── GET: return all transactions ──────────────────────────────
if ($method === 'GET') {
    $sql = "
        SELECT
            t.id, t.branch_id, t.customer, t.customer_phone, t.barber_id,
            t.discount, t.tax, t.total, t.method, t.tendered,
            DATE_FORMAT(t.date, '%Y-%m-%d') AS date,
            TIME_FORMAT(t.time, '%H:%i')    AS time,
            ti.item_type, ti.item_name, ti.qty, ti.price, ti.commission_rm
        FROM transactions t
        LEFT JOIN transaction_items ti ON ti.transaction_id = t.id
        ORDER BY t.date DESC, t.time DESC, t.id, ti.id
    ";
    $result = $conn->query($sql);
    $trxMap = [];
    while ($row = $result->fetch_assoc()) {
        $id = $row['id'];
        if (!isset($trxMap[$id])) {
            $trxMap[$id] = [
                'id'            => $id,
                'branchId'      => (int)$row['branch_id'],
                'customer'      => $row['customer'],
                'customerPhone' => $row['customer_phone'] ?? '',
                'barberId'      => $row['barber_id'] !== null ? (int)$row['barber_id'] : 0,
                'discount'      => (int)$row['discount'],
                'tax'           => (int)$row['tax'],
                'total'         => (float)$row['total'],
                'method'        => $row['method'],
                'tendered'      => (float)$row['tendered'],
                'date'          => $row['date'],
                'time'          => $row['time'],
                'services'      => [],
            ];
        }
        if ($row['item_name'] !== null) {
            $item = [
                'name'  => $row['item_name'],
                'qty'   => (int)$row['qty'],
                'price' => (float)$row['price'],
                'type'  => $row['item_type'] ?? 'service',
            ];
            if ($row['commission_rm'] !== null) {
                $item['commissionRM'] = (float)$row['commission_rm'];
            }
            $trxMap[$id]['services'][] = $item;
        }
    }
    echo json_encode(['transactions' => array_values($trxMap)]);
    exit;
}

// ── POST: insert one transaction ──────────────────────────────
if ($method === 'POST') {
    $trx = json_decode(file_get_contents('php://input'), true) ?? [];

    $id           = $trx['id']            ?? '';
    $branchId     = (int)($trx['branchId']  ?? 1);
    $customer     = $trx['customer']       ?? 'Walk-in';
    $customerPhone = $trx['customerPhone'] ?? null;
    $barberId     = ($trx['barberId'] ?? 0) ?: null;  // 0 → NULL (no barber)
    $discount     = (int)($trx['discount']  ?? 0);
    $tax          = (int)($trx['tax']       ?? 6);
    $total        = (float)($trx['total']   ?? 0);
    $method_pay   = $trx['method']          ?? 'cash';
    $tendered     = (float)($trx['tendered'] ?? 0);
    $date         = $trx['date']            ?? date('Y-m-d');
    $time         = $trx['time']            ?? date('H:i');
    $services     = $trx['services']        ?? [];

    if ($id === '') {
        http_response_code(400);
        echo json_encode(['ok' => false, 'error' => 'Missing transaction id']);
        exit;
    }

    // Disable FK checks — branches/barbers are in blob store, not SQL tables
    $conn->query("SET FOREIGN_KEY_CHECKS = 0");

    $stmt = $conn->prepare(
        "INSERT INTO transactions
             (id, branch_id, customer, customer_phone, barber_id,
              discount, tax, total, method, tendered, date, time)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
    );
    $stmt->bind_param(
        'siissiidsdss',
        $id, $branchId, $customer, $customerPhone, $barberId,
        $discount, $tax, $total, $method_pay, $tendered, $date, $time
    );
    $ok = $stmt->execute();
    $stmt->close();

    if (!$ok) {
        $conn->query("SET FOREIGN_KEY_CHECKS = 1");
        echo json_encode(['ok' => false, 'error' => $conn->error]);
        exit;
    }

    // Insert items — two prepared statements: with and without commission_rm
    $stmtC = $conn->prepare(
        "INSERT INTO transaction_items (transaction_id, item_type, item_name, qty, price, commission_rm)
         VALUES (?, ?, ?, ?, ?, ?)"
    );
    $stmtN = $conn->prepare(
        "INSERT INTO transaction_items (transaction_id, item_type, item_name, qty, price)
         VALUES (?, ?, ?, ?, ?)"
    );

    foreach ($services as $svc) {
        $type  = $svc['type']  ?? 'service';
        $name  = $svc['name']  ?? '';
        $qty   = (int)($svc['qty']   ?? 1);
        $price = (float)($svc['price'] ?? 0);

        if (isset($svc['commissionRM'])) {
            $comm = (float)$svc['commissionRM'];
            $stmtC->bind_param('sssidd', $id, $type, $name, $qty, $price, $comm);
            $stmtC->execute();
        } else {
            $stmtN->bind_param('sssid', $id, $type, $name, $qty, $price);
            $stmtN->execute();
        }
    }
    $stmtC->close();
    $stmtN->close();

    $conn->query("SET FOREIGN_KEY_CHECKS = 1");

    echo json_encode(['ok' => true, 'id' => $id]);
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Method not allowed']);
```

- [ ] **Step 2: Verify PHP syntax**

```bash
php -l api/transactions.php
```
Expected: `No syntax errors detected in api/transactions.php`

- [ ] **Step 3: Commit**

```bash
git add api/transactions.php
git commit -m "feat: create api/transactions.php — save, read, and clear transactions"
```

---

### Task 5: Update app.js — API object, async boot, polling

**Files:**
- Modify: `assets/js/app.js`

This task has three separate edits. Apply them in order.

---

**Edit A — Add the `API` object**

Locate this comment in `app.js` (around line 145):
```js
// ── StorageManager ───────────────────────────────────────────
```

Insert the following block **immediately before that comment** (i.e., between the version-check IIFE closing `})();` and the StorageManager comment):

```js
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

```

---

**Edit B — Modify `AppData.save` to call `API.saveBlob`**

Locate this line in `AppData` (around line 177):
```js
  save(key) { StorageManager.save(key, this[key]); },
```

Replace it with:
```js
  save(key) {
    StorageManager.save(key, this[key]);
    if (key !== 'transactions') API.saveBlob(key, this[key]);
  },
```

---

**Edit C — Rewrite the `App` object and `DOMContentLoaded` listener**

Locate the entire `App` object plus the event listener (currently lines 456–485):
```js
const App = {
  currentBranch: 1, // set in init() from storage

  setBranch(id) {
    ...
  },

  init() {
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
  }
};

document.addEventListener('DOMContentLoaded', () => App.init());
```

Replace it entirely with:
```js
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
    for (const k of BLOB_KEYS) {
      await fetch('api/data.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-API-Token': API._token },
        body: JSON.stringify({ key: k, value: JSON.stringify(AppData[k]) })
      }).catch(() => {});
    }
    for (const trx of AppData.transactions) {
      await API.saveTransaction(trx).catch(() => {});
    }
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
          AppData.transactions = [...data.transactions, ...historical];
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
      if (POS.cart.length === 0) {
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
```

- [ ] **Step 1: Apply Edit A** — insert the `API` object before `StorageManager`

- [ ] **Step 2: Apply Edit B** — modify `AppData.save`

- [ ] **Step 3: Apply Edit C** — replace the `App` object and event listener

- [ ] **Step 4: Verify PHP lint passes (JS has no lint tool; just check it opens without console errors after deploy)**

- [ ] **Step 5: Commit**

```bash
git add assets/js/app.js
git commit -m "feat: add API object, async App.init with boot/seed/poll, AppData.save calls API"
```

---

### Task 6: Update pos.js — await transaction save before showing receipt

**Files:**
- Modify: `assets/js/pos.js`

The `confirmPayment` method currently saves the transaction synchronously. It must become async and await the server confirmation before showing the receipt.

- [ ] **Step 1: Locate `confirmPayment()` in `assets/js/pos.js`**

Find this method signature (around line 372):
```js
  confirmPayment() {
```

Change it to:
```js
  async confirmPayment() {
```

- [ ] **Step 2: Find the transaction save block inside `confirmPayment`**

Locate these two lines (around line 418–419):
```js
    AppData.transactions.unshift(trx);
    AppData.save('transactions');
```

Replace them with:
```js
    // Save to server first — receipt only shown on success
    const saved = await API.saveTransaction(trx);
    if (!saved.ok) {
      showToast('Payment failed to save. Please try again.', 'error');
      return;
    }
    AppData.transactions.unshift(trx);
    StorageManager.save('transactions', AppData.transactions);
```

- [ ] **Step 3: Verify the rest of `confirmPayment` is unchanged**

After the save block, the method should continue with:
```js
    // Auto-deduct stock for product items
    this.cart.filter(c => c.type === 'product').forEach(c => { ... });
    AppData.save('inventory');
    // Mark barber busy
    if (barber && barber.status === 'available') { barber.status = 'busy'; AppData.save('barbers'); }
    closeModal('modal-payment');
    this._showReceipt(trx, barber, discAmt, afterDisc, taxAmt, tendered);
    showToast('Payment successful! ' + formatRp(total), 'success');
    Inventory.checkLowStock?.();
```

This is all unchanged — only the save block changes.

- [ ] **Step 4: Commit**

```bash
git add assets/js/pos.js
git commit -m "feat: await API.saveTransaction in confirmPayment before showing receipt"
```

---

### Task 7: Update setup-wizard.js — clear MySQL transactions on wizard commit

**Files:**
- Modify: `assets/js/setup-wizard.js`

When the wizard runs, it clears `AppData.transactions = []`. Without this task, the MySQL transactions table keeps old rows and they would re-appear on the next poll.

- [ ] **Step 1: Locate the `_commit()` method in `assets/js/setup-wizard.js`**

Find the line that clears transactions (around line 133):
```js
    AppData.transactions = [];
```

Add one line immediately after it:
```js
    AppData.transactions = [];
    if (typeof API !== 'undefined') API.clearTransactions();
```

- [ ] **Step 2: Verify the surrounding context is correct**

The block should now look like:
```js
    // Clear demo data
    AppData.barbers      = [];
    AppData.services     = [];
    AppData.appointments = [];
    AppData.transactions = [];
    if (typeof API !== 'undefined') API.clearTransactions();
    AppData.inventory    = [];
    AppData.queue        = [];
    AppData.customers    = [];
```

- [ ] **Step 3: Commit**

```bash
git add assets/js/setup-wizard.js
git commit -m "feat: clear MySQL transactions when setup wizard commits"
```

---

### Task 8: Deploy to Hostinger and run schema

**Files:** None in git — all server-side actions.

- [ ] **Step 1: Push all commits to GitHub**

```bash
git push origin main
```

- [ ] **Step 2: SSH deploy**

```bash
ssh -i ~/.ssh/hostinger_deploy -p 65002 u929568672@145.79.28.63 "cd ~/domains/nextapmy.com/public_html/__HAB && bash deploy.sh"
```

Expected output ends with: `==> Done.`

- [ ] **Step 3: Add `API_TOKEN` to `config.php` on the server**

SSH into the server and edit config.php:
```bash
ssh -i ~/.ssh/hostinger_deploy -p 65002 u929568672@145.79.28.63
nano ~/domains/nextapmy.com/public_html/__HAB/config.php
```

Add this line at the bottom of `config.php` (before the closing `?>`  if there is one, or just at the end):
```php
define('API_TOKEN', 'your-32-char-random-string-here');
```

Generate a good token: `php -r "echo bin2hex(random_bytes(16));"` — use the output as the token value.

Save the file. Exit SSH.

- [ ] **Step 4: Run the schema SQL in phpMyAdmin**

1. Log in to Hostinger → hPanel → Databases → phpMyAdmin
2. Select database `u929568672_hab`
3. Click the **SQL** tab
4. Paste and run only the NEW statements (the ones appended to `database.sql` in Task 1):

```sql
CREATE TABLE IF NOT EXISTS `app_data` (
  `data_key`   VARCHAR(50)  NOT NULL,
  `data_value` LONGTEXT     NOT NULL,
  `updated_at` TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
                            ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`data_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `transactions`
  ADD COLUMN IF NOT EXISTS `customer_phone` VARCHAR(20) DEFAULT NULL AFTER `customer`;

ALTER TABLE `transaction_items`
  ADD COLUMN IF NOT EXISTS `commission_rm` DECIMAL(8,2) DEFAULT NULL;
```

Expected: phpMyAdmin shows "3 queries executed successfully."

- [ ] **Step 5: Verify the API is working**

Open a browser and visit:
```
https://nextapmy.com/__HAB/api/data.php
```
Expected response (without the API token header, from browser): `{"error":"Unauthorized"}`

This confirms the PHP file is reachable and the auth check works.

- [ ] **Step 6: Hard-refresh the POS app and verify boot**

1. Open the app in a browser: `https://nextapmy.com/__HAB/`
2. Press `Ctrl + Shift + R` (hard refresh)
3. Observe: a "Connecting…" spinner appears briefly, then the PIN screen shows
4. Enter the owner PIN → navigate to POS → service grid loads
5. Open browser DevTools → Network tab → filter by `data.php` → confirm a successful GET with status 200
6. The GET response JSON should contain `"seeded": true` and your services, barbers, etc.

- [ ] **Step 7: Test cross-device sync**

1. On the laptop: open the POS and process a test payment (RM 1 amount)
2. On your phone: open the same URL and navigate to Dashboard
3. Wait 30 seconds (one poll cycle)
4. Refresh the phone's dashboard — the new transaction should appear in "Today's Revenue"

- [ ] **Step 8: Verify offline fallback**

1. In DevTools → Network tab → set throttling to "Offline"
2. Refresh the page
3. Expected: "Offline — using local data" amber banner appears at bottom; app works normally with last-known data

- [ ] **Step 9: Final commit marking deploy complete**

```bash
git tag v2.0-mysql-backend
git push origin v2.0-mysql-backend
```
