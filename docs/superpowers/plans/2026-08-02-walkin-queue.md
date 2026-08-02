# Walk-in Queue Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let customers scan a QR code, join a MySQL-backed walk-in queue from their phone, and see the live queue with interactive animations; staff manage the queue from the Dashboard with Serve/Done buttons.

**Architecture:** Standalone `queue.php` (public, no login) for customers; `api/queue.php` (GET/POST public, PATCH authenticated); `QueueManager` JS object drives both the customer page (5s self-poll) and the Dashboard widget (5s poll replacing old blob queue). Animations are CSS-transition-based with JS DOM diffing — no full re-renders.

**Tech Stack:** PHP 8, MySQL (InnoDB), vanilla JS, Tailwind CDN (queue.php only), existing Tailwind build (dashboard), qrserver.com QR API

---

## File Map

| File | Action |
|------|--------|
| `database.sql` | Append `queue` table |
| `api/queue.php` | New — public GET/POST, authenticated PATCH |
| `queue.php` | New — public customer page |
| `assets/js/queue.js` | New — `QueueManager` object |
| `modals/modal-queue.php` | New — staff add-to-queue modal |
| `views/dashboard.php` | Modify — update queue widget button and IDs |
| `assets/js/dashboard.js` | Modify — remove old queue code, call QueueManager |
| `views/settings.php` | Modify — add QR section |
| `assets/js/settings.js` | Modify — add `renderQRCode()` + `copyQueueUrl()` |
| `index.php` | Modify — add queue.js script, include modal-queue.php |

---

### Task 1: MySQL table — `queue`

**Files:**
- Modify: `database.sql`
- Run on server via SSH

- [ ] **Step 1: Append table definition to `database.sql`**

Read `database.sql` first. Append this block after the `shifts` table at the end of the file:

```sql
-- ── Table: queue ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `queue` (
  `id`           INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `branch_id`    TINYINT UNSIGNED NOT NULL DEFAULT 1,
  `session_date` DATE NOT NULL,
  `name`         VARCHAR(100) NOT NULL,
  `phone`        VARCHAR(20) NOT NULL,
  `party_size`   TINYINT UNSIGNED NOT NULL DEFAULT 1,
  `status`       ENUM('waiting','serving','done') NOT NULL DEFAULT 'waiting',
  `joined_at`    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `served_at`    DATETIME DEFAULT NULL,
  `done_at`      DATETIME DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_queue_branch_date` (`branch_id`, `session_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

- [ ] **Step 2: Create table on live server**

```bash
ssh -i ~/.ssh/hostinger_deploy -p 65002 u929568672@145.79.28.63 "mysql -u u929568672_hab -pNextap@2025 u929568672_hab -e \"CREATE TABLE IF NOT EXISTS \\\`queue\\\` (\\\`id\\\` INT UNSIGNED NOT NULL AUTO_INCREMENT, \\\`branch_id\\\` TINYINT UNSIGNED NOT NULL DEFAULT 1, \\\`session_date\\\` DATE NOT NULL, \\\`name\\\` VARCHAR(100) NOT NULL, \\\`phone\\\` VARCHAR(20) NOT NULL, \\\`party_size\\\` TINYINT UNSIGNED NOT NULL DEFAULT 1, \\\`status\\\` ENUM('waiting','serving','done') NOT NULL DEFAULT 'waiting', \\\`joined_at\\\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, \\\`served_at\\\` DATETIME DEFAULT NULL, \\\`done_at\\\` DATETIME DEFAULT NULL, PRIMARY KEY (\\\`id\\\`), KEY \\\`idx_queue_branch_date\\\` (\\\`branch_id\\\`, \\\`session_date\\\`)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;\""
```

Verify:
```bash
ssh -i ~/.ssh/hostinger_deploy -p 65002 u929568672@145.79.28.63 "mysql -u u929568672_hab -pNextap@2025 u929568672_hab -e 'DESCRIBE \`queue\`;' 2>/dev/null"
```

Expected: table columns shown.

- [ ] **Step 3: Commit**

```bash
git add database.sql
git commit -m "feat: add queue table for walk-in queue feature

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

### Task 2: `api/queue.php`

**Files:**
- Create: `api/queue.php`

- [ ] **Step 1: Create `api/queue.php`**

```php
<?php
require '../config.php';
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PATCH, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-API-Token');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

$conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'db_connect']);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];

// ── GET: public queue fetch ──────────────────────────────────
if ($method === 'GET') {
    $branchId = intval($_GET['branch_id'] ?? 1);
    $date     = $_GET['date'] ?? date('Y-m-d');

    $stmt = $conn->prepare(
        "SELECT id, name, phone, party_size, status, joined_at
         FROM `queue`
         WHERE branch_id = ? AND session_date = ? AND status != 'done'
         ORDER BY joined_at ASC"
    );
    if (!$stmt) { http_response_code(500); echo json_encode(['ok' => false, 'error' => 'db_error']); exit; }
    $stmt->bind_param('is', $branchId, $date);
    $stmt->execute();
    $result  = $stmt->get_result();
    $entries = [];
    while ($row = $result->fetch_assoc()) {
        $entries[] = $row;
    }
    echo json_encode(['ok' => true, 'entries' => $entries]);
    exit;
}

// ── POST: public join queue ──────────────────────────────────
if ($method === 'POST') {
    $body      = json_decode(file_get_contents('php://input'), true) ?? [];
    $branchId  = intval($body['branch_id'] ?? 1);
    $name      = trim($body['name'] ?? '');
    $phone     = trim($body['phone'] ?? '');
    $partySize = max(1, intval($body['party_size'] ?? 1));
    $date      = date('Y-m-d');

    if (!$name || !$phone) {
        http_response_code(400);
        echo json_encode(['ok' => false, 'error' => 'missing_fields']);
        exit;
    }

    $stmt = $conn->prepare(
        "INSERT INTO `queue` (branch_id, session_date, name, phone, party_size) VALUES (?, ?, ?, ?, ?)"
    );
    if (!$stmt) { http_response_code(500); echo json_encode(['ok' => false, 'error' => 'db_error']); exit; }
    $stmt->bind_param('isssi', $branchId, $date, $name, $phone, $partySize);
    if (!$stmt->execute()) {
        http_response_code(500);
        echo json_encode(['ok' => false, 'error' => 'insert_failed']);
        exit;
    }
    $newId = $stmt->insert_id;

    $stmt2 = $conn->prepare(
        "SELECT id, name, phone, party_size, status, joined_at FROM `queue` WHERE id = ?"
    );
    if (!$stmt2) { http_response_code(500); echo json_encode(['ok' => false, 'error' => 'db_error']); exit; }
    $stmt2->bind_param('i', $newId);
    $stmt2->execute();
    $entry = $stmt2->get_result()->fetch_assoc();

    echo json_encode(['ok' => true, 'entry' => $entry]);
    exit;
}

// ── PATCH: authenticated status update ──────────────────────
if ($method === 'PATCH') {
    $token = $_SERVER['HTTP_X_API_TOKEN'] ?? '';
    if ($token !== API_TOKEN) {
        http_response_code(401);
        echo json_encode(['ok' => false, 'error' => 'unauthorized']);
        exit;
    }

    $body   = json_decode(file_get_contents('php://input'), true) ?? [];
    $id     = intval($body['id'] ?? 0);
    $status = $body['status'] ?? '';

    if (!$id || !in_array($status, ['serving', 'done'], true)) {
        http_response_code(400);
        echo json_encode(['ok' => false, 'error' => 'invalid']);
        exit;
    }

    $tsField = $status === 'serving' ? 'served_at' : 'done_at';
    $stmt = $conn->prepare("UPDATE `queue` SET status = ?, `{$tsField}` = NOW() WHERE id = ?");
    if (!$stmt) { http_response_code(500); echo json_encode(['ok' => false, 'error' => 'db_error']); exit; }
    $stmt->bind_param('si', $status, $id);
    $stmt->execute();

    echo json_encode(['ok' => true]);
    exit;
}

http_response_code(405);
echo json_encode(['ok' => false, 'error' => 'method_not_allowed']);
```

- [ ] **Step 2: Commit**

```bash
git add api/queue.php
git commit -m "feat: add public queue API (GET/POST/PATCH)

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

### Task 3: `queue.php` — public customer page

**Files:**
- Create: `queue.php` (in project root, same level as `index.php`)

Context: This is a standalone public page — no POS auth, no sidebar. Customers open it on their phone after scanning the QR. It has two JS-driven views: Join form and Queue list. Uses Tailwind CDN for styling.

- [ ] **Step 1: Create `queue.php`**

```php
<?php
require 'config.php';
$branchId = max(1, intval($_GET['branch'] ?? 1));

$branchName = 'HAB Barbershop';
$conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
if (!$conn->connect_error) {
    $stmt = $conn->prepare("SELECT name FROM branches WHERE id = ? LIMIT 1");
    if ($stmt) {
        $stmt->bind_param('i', $branchId);
        $stmt->execute();
        $row = $stmt->get_result()->fetch_assoc();
        if ($row) $branchName = $row['name'];
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Walk-in Queue — <?= htmlspecialchars($branchName) ?></title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    :root { --gold: #C9A84C; --gold-bg: rgba(201,168,76,.15); }
    body { background: #0D0D0D; font-family: system-ui, -apple-system, sans-serif; }

    @keyframes qSlideIn {
      from { opacity: 0; transform: translateY(14px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes goldRing {
      0%, 100% { box-shadow: 0 0 0 0 rgba(201,168,76,.45); }
      50%       { box-shadow: 0 0 0 10px rgba(201,168,76,0); }
    }
    @keyframes bannerIn {
      from { opacity: 0; transform: scale(.93); }
      to   { opacity: 1; transform: scale(1); }
    }

    .q-enter   { animation: qSlideIn .28s ease both; }
    .q-serving { border-color: var(--gold) !important; background: rgba(201,168,76,.08) !important; animation: goldRing 1.4s ease 4; }
    .your-turn { animation: bannerIn .4s cubic-bezier(.34,1.56,.64,1) both; }

    .inp {
      width: 100%;
      background: rgba(255,255,255,.06);
      border: 1px solid rgba(255,255,255,.12);
      border-radius: .75rem;
      padding: .75rem 1rem;
      color: #fff;
      font-size: .9rem;
      outline: none;
      transition: border-color .18s;
    }
    .inp:focus { border-color: var(--gold); }
    .inp::placeholder { color: rgba(255,255,255,.28); }

    .btn-join {
      width: 100%;
      background: linear-gradient(135deg, #C9A84C, #A8893A);
      color: #000;
      font-weight: 700;
      border-radius: .75rem;
      padding: .9rem 1.5rem;
      font-size: .9rem;
      border: none;
      cursor: pointer;
      transition: opacity .18s;
    }
    .btn-join:hover   { opacity: .88; }
    .btn-join:disabled { opacity: .48; cursor: not-allowed; }
  </style>
</head>
<body class="min-h-screen text-white">

  <!-- Header -->
  <header class="text-center pt-10 pb-6 px-5">
    <div class="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center" style="background:var(--gold-bg)">
      <span class="text-2xl">💈</span>
    </div>
    <h1 class="text-xl font-bold text-white"><?= htmlspecialchars($branchName) ?></h1>
    <p class="text-sm mt-1" style="color:rgba(255,255,255,.4)">Walk-in Queue</p>
  </header>

  <div class="max-w-md mx-auto px-5 pb-14">

    <!-- ── JOIN VIEW ──────────────────────────────────────────── -->
    <div id="view-join">
      <div class="rounded-2xl p-6" style="background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08)">
        <h2 class="text-sm font-bold text-white mb-1">Join the Queue</h2>
        <p class="text-xs mb-5" style="color:rgba(255,255,255,.38)">Enter your details to take a spot</p>

        <div class="space-y-3">
          <div>
            <label class="text-xs font-medium block mb-1.5" style="color:rgba(255,255,255,.45)">Your Name</label>
            <input id="inp-name" type="text" class="inp" placeholder="e.g. Ali Hassan" autocomplete="name">
          </div>
          <div>
            <label class="text-xs font-medium block mb-1.5" style="color:rgba(255,255,255,.45)">Phone Number</label>
            <input id="inp-phone" type="tel" class="inp" placeholder="e.g. 0123456789" autocomplete="tel">
          </div>
          <div>
            <label class="text-xs font-medium block mb-2" style="color:rgba(255,255,255,.45)">Total in Group</label>
            <div class="flex items-center gap-3">
              <button id="btn-minus" type="button"
                class="w-11 h-11 rounded-xl text-xl font-bold transition-colors flex items-center justify-center"
                style="background:rgba(255,255,255,.08);color:rgba(255,255,255,.6)">−</button>
              <div class="flex-1 text-center">
                <span id="party-num" class="text-2xl font-bold text-white">1</span>
                <p id="party-lbl" class="text-[10px] mt-0.5" style="color:rgba(255,255,255,.32)">just me</p>
              </div>
              <button id="btn-plus" type="button"
                class="w-11 h-11 rounded-xl text-xl font-bold transition-colors flex items-center justify-center"
                style="background:rgba(255,255,255,.08);color:rgba(255,255,255,.6)">+</button>
            </div>
          </div>
        </div>

        <button id="btn-join" class="btn-join mt-5">Join Queue</button>
        <p id="join-err" class="hidden text-xs text-red-400 text-center mt-3"></p>
      </div>
    </div>

    <!-- ── QUEUE VIEW ─────────────────────────────────────────── -->
    <div id="view-queue" class="hidden">

      <!-- Your Turn Banner -->
      <div id="your-turn" class="hidden your-turn rounded-2xl p-5 mb-4 text-center"
        style="background:linear-gradient(135deg,rgba(201,168,76,.18),rgba(201,168,76,.04));border:1.5px solid var(--gold)">
        <div class="text-3xl mb-2">💈</div>
        <h2 class="text-base font-bold text-white">It's Your Turn!</h2>
        <p class="text-xs mt-1" style="color:rgba(255,255,255,.5)">Please proceed to the barber</p>
      </div>

      <!-- Queue header -->
      <div class="flex items-center justify-between mb-3">
        <div>
          <h2 class="text-sm font-bold text-white">Current Queue</h2>
          <p id="q-count-lbl" class="text-xs mt-0.5" style="color:rgba(255,255,255,.38)">loading…</p>
        </div>
        <div class="flex items-center gap-1.5 text-[10px]" style="color:rgba(255,255,255,.28)">
          <span class="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" style="animation:goldRing 2s infinite"></span>
          Live
        </div>
      </div>

      <!-- Queue items -->
      <div id="q-list" class="space-y-2"></div>

      <!-- Empty state -->
      <div id="q-empty" class="hidden text-center py-10">
        <p class="text-3xl mb-2">🪑</p>
        <p class="text-sm" style="color:rgba(255,255,255,.3)">You're first in line!</p>
      </div>
    </div>

  </div>

  <script>
    const BRANCH_ID = <?= intval($branchId) ?>;
    let partySize = 1;
    let myId = sessionStorage.getItem('hab_q_id') ? parseInt(sessionStorage.getItem('hab_q_id'), 10) : null;
    let myNotified = sessionStorage.getItem('hab_q_notified') === '1';

    // ── Party counter ─────────────────────────────────────────
    document.getElementById('btn-minus').addEventListener('click', () => {
      if (partySize > 1) { partySize--; syncParty(); }
    });
    document.getElementById('btn-plus').addEventListener('click', () => {
      if (partySize < 10) { partySize++; syncParty(); }
    });
    function syncParty() {
      document.getElementById('party-num').textContent = partySize;
      const txt = partySize === 1 ? 'just me'
        : `me + ${partySize - 1} ${partySize === 2 ? 'person' : 'people'}`;
      document.getElementById('party-lbl').textContent = txt;
    }

    // ── Join ──────────────────────────────────────────────────
    document.getElementById('btn-join').addEventListener('click', async () => {
      const name  = document.getElementById('inp-name').value.trim();
      const phone = document.getElementById('inp-phone').value.trim();
      const errEl = document.getElementById('join-err');
      errEl.classList.add('hidden');

      if (!name)  { showErr('Please enter your name.');         return; }
      if (!phone) { showErr('Please enter your phone number.'); return; }

      const btn = document.getElementById('btn-join');
      btn.disabled = true; btn.textContent = 'Joining…';

      try {
        const res  = await fetch('api/queue.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ branch_id: BRANCH_ID, name, phone, party_size: partySize })
        });
        const data = await res.json();
        if (data.ok) {
          myId = parseInt(data.entry.id, 10);
          sessionStorage.setItem('hab_q_id', myId);
          sessionStorage.removeItem('hab_q_notified');
          myNotified = false;
          switchView('queue');
          poll();
        } else {
          showErr('Failed to join. Please try again.');
          btn.disabled = false; btn.textContent = 'Join Queue';
        }
      } catch {
        showErr('Network error. Please try again.');
        btn.disabled = false; btn.textContent = 'Join Queue';
      }
    });

    function showErr(msg) {
      const el = document.getElementById('join-err');
      el.textContent = msg; el.classList.remove('hidden');
    }

    // ── Views ─────────────────────────────────────────────────
    function switchView(v) {
      document.getElementById('view-join').classList.toggle('hidden', v !== 'join');
      document.getElementById('view-queue').classList.toggle('hidden', v !== 'queue');
    }

    // ── Poll ──────────────────────────────────────────────────
    function today() { return new Date().toISOString().split('T')[0]; }

    async function poll() {
      try {
        const res  = await fetch(`api/queue.php?branch_id=${BRANCH_ID}&date=${today()}`);
        const data = await res.json();
        if (data.ok) render(data.entries);
      } catch {}
      setTimeout(poll, 5000);
    }

    // ── DOM diff render ───────────────────────────────────────
    function render(entries) {
      const list  = document.getElementById('q-list');
      const empty = document.getElementById('q-empty');
      const lbl   = document.getElementById('q-count-lbl');

      const waiting = entries.filter(e => e.status === 'waiting').length;
      lbl.textContent = `${waiting} waiting`;
      empty.classList.toggle('hidden', entries.length > 0);

      // Check my entry — show "Your Turn" banner
      if (myId && !myNotified) {
        const mine = entries.find(e => parseInt(e.id, 10) === myId);
        if (mine && mine.status === 'serving') {
          myNotified = true;
          sessionStorage.setItem('hab_q_notified', '1');
          const banner = document.getElementById('your-turn');
          banner.classList.remove('hidden');
        }
      }

      // Remove items no longer present (marked done)
      const incoming = new Set(entries.map(e => String(e.id)));
      [...list.querySelectorAll('.q-row')].forEach(el => {
        if (!incoming.has(el.dataset.id)) collapse(el);
      });

      // Add or update
      entries.forEach((entry, i) => {
        const existing = list.querySelector(`.q-row[data-id="${entry.id}"]`);
        if (existing) {
          existing.querySelector('.q-pos').textContent = `#${i + 1}`;
          if (!existing.classList.contains('q-serving') && entry.status === 'serving') {
            existing.classList.add('q-serving');
            existing.querySelector('.q-badge').textContent = 'Serving';
            existing.querySelector('.q-badge').style.color = 'var(--gold)';
          }
        } else {
          list.appendChild(buildRow(entry, i));
        }
      });
    }

    function buildRow(entry, pos) {
      const isMine    = myId && parseInt(entry.id, 10) === myId;
      const partyTxt  = entry.party_size > 1 ? ` +${entry.party_size - 1}` : '';
      const phoneMask = '****' + String(entry.phone).slice(-4);
      const isServing = entry.status === 'serving';

      const div = document.createElement('div');
      div.dataset.id = String(entry.id);
      div.className  = 'q-row q-enter rounded-xl px-4 py-3 flex items-center gap-3' + (isServing ? ' q-serving' : '');
      div.style.cssText = 'border:1px solid rgba(255,255,255,.08);background:rgba(255,255,255,.04)';

      div.innerHTML = `
        <div class="q-pos w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
          style="background:rgba(201,168,76,.16);color:rgba(255,255,255,.7)">#${pos + 1}</div>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-1 flex-wrap">
            <span class="text-sm font-semibold text-white truncate">${esc(entry.name)}</span>
            ${partyTxt ? `<span class="text-[10px]" style="color:rgba(255,255,255,.38)">${esc(partyTxt)}</span>` : ''}
            ${isMine ? `<span class="text-[10px] font-semibold px-1.5 py-0.5 rounded-full" style="background:var(--gold-bg);color:var(--gold)">You</span>` : ''}
          </div>
          <p class="text-xs mt-0.5" style="color:rgba(255,255,255,.32)">${esc(phoneMask)}</p>
        </div>
        <span class="q-badge text-[10px] font-semibold flex-shrink-0" style="color:${isServing ? 'var(--gold)' : 'rgba(255,255,255,.28)'}">
          ${isServing ? 'Serving' : 'Waiting'}
        </span>`;
      return div;
    }

    function collapse(el) {
      el.style.transition = 'opacity .3s, max-height .35s ease, margin .3s, padding .3s';
      el.style.overflow   = 'hidden';
      el.style.maxHeight  = el.offsetHeight + 'px';
      requestAnimationFrame(() => {
        el.style.opacity       = '0';
        el.style.maxHeight     = '0';
        el.style.marginBottom  = '0';
        el.style.paddingTop    = '0';
        el.style.paddingBottom = '0';
      });
      setTimeout(() => el.remove(), 370);
    }

    function esc(s) {
      return String(s)
        .replace(/&/g,'&amp;').replace(/</g,'&lt;')
        .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    }

    // ── Init: returning visitor ───────────────────────────────
    if (myId) { switchView('queue'); poll(); }
  </script>
</body>
</html>
```

- [ ] **Step 2: Commit**

```bash
git add queue.php
git commit -m "feat: add public walk-in queue page for customers

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

### Task 4: `assets/js/queue.js` — QueueManager

**Files:**
- Create: `assets/js/queue.js`

Context: `QueueManager` is used in the POS dashboard. It uses `API._h()` (from `app.js`) for authenticated PATCH calls, `showToast()` (from `app.js`), `today()` (from `app.js`), and `App.currentBranch`. It renders into `#queue-list`, `#queue-empty`, `#queue-count-lbl` — these existing IDs are kept in the dashboard widget.

- [ ] **Step 1: Create `assets/js/queue.js`**

```js
// ============================================================
// HAB Barbershop POS — Walk-in Queue Manager (Dashboard)
// ============================================================

const QueueManager = {
  _pollTimer: null,

  init() {
    if (!document.getElementById('queue-styles')) {
      const s = document.createElement('style');
      s.id = 'queue-styles';
      s.textContent = `
        @keyframes qIn { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        .q-item  { animation: qIn .25s ease both; }
        .q-item.q-serving { border-color: rgba(201,168,76,.5) !important; background: rgba(201,168,76,.08) !important; }
      `;
      document.head.appendChild(s);
    }
    clearTimeout(this._pollTimer);
    this._fetch();
  },

  async _fetch() {
    try {
      const res  = await fetch(`api/queue.php?branch_id=${App.currentBranch || 1}&date=${today()}`);
      if (!res.ok) return;
      const data = await res.json();
      if (data.ok) this._render(data.entries);
    } catch {}
    this._pollTimer = setTimeout(() => this._fetch(), 5000);
  },

  _render(entries) {
    const list  = document.getElementById('queue-list');
    const empty = document.getElementById('queue-empty');
    const lbl   = document.getElementById('queue-count-lbl');
    if (!list) return;

    const waiting = entries.filter(e => e.status === 'waiting').length;
    if (lbl)   lbl.textContent = `${waiting} waiting`;
    if (empty) empty.classList.toggle('hidden', entries.length > 0);
    list.classList.toggle('hidden', entries.length === 0);

    // Remove gone entries
    const ids = new Set(entries.map(e => String(e.id)));
    [...list.querySelectorAll('.q-item')].forEach(el => {
      if (!ids.has(el.dataset.id)) this._collapse(el);
    });

    // Add or update
    entries.forEach((entry, i) => {
      const existing = list.querySelector(`.q-item[data-id="${entry.id}"]`);
      if (existing) {
        const posEl = existing.querySelector('.q-pos');
        if (posEl) posEl.textContent = `#${i + 1}`;
        if (!existing.classList.contains('q-serving') && entry.status === 'serving') {
          existing.classList.add('q-serving');
          const statusEl = existing.querySelector('.q-status');
          if (statusEl) statusEl.innerHTML = this._servingBadge();
          existing.querySelector('.q-serve')?.remove();
          existing.querySelector('.q-done')?.classList.remove('hidden');
        }
      } else {
        list.appendChild(this._buildItem(entry, i));
      }
    });
  },

  _buildItem(entry, pos) {
    const isServing = entry.status === 'serving';
    const phone     = '****' + String(entry.phone).slice(-4);
    const partyBadge = entry.party_size > 1
      ? `<span class="text-[10px] text-gold ml-0.5">+${entry.party_size - 1}</span>` : '';

    const div = document.createElement('div');
    div.dataset.id  = String(entry.id);
    div.className   = 'q-item flex items-center gap-3 glass rounded-xl px-3 py-2.5' + (isServing ? ' q-serving' : '');

    div.innerHTML = `
      <div class="q-pos w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-bold flex-shrink-0"
        style="background:rgba(201,168,76,.18);color:rgba(255,255,255,.8)">#${pos + 1}</div>
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-1">
          <p class="text-sm font-medium text-white truncate">${this._esc(entry.name)}</p>${partyBadge}
        </div>
        <p class="text-xs text-white/35">${this._esc(phone)}</p>
      </div>
      <div class="q-status flex items-center gap-1.5 flex-shrink-0">
        ${isServing ? this._servingBadge() : ''}
        ${!isServing ? `<button class="q-serve text-[10px] font-semibold px-2 py-1 rounded-lg transition-colors" style="background:rgba(201,168,76,.15);color:#C9A84C" onclick="QueueManager.serve(${entry.id})">Serve</button>` : ''}
        <button class="q-done ${!isServing ? 'hidden' : ''} text-[10px] font-semibold px-2 py-1 rounded-lg" style="background:rgba(74,222,128,.12);color:#4ade80" onclick="QueueManager.done(${entry.id})">Done</button>
      </div>`;
    return div;
  },

  _servingBadge() {
    return `<span class="text-[10px] font-semibold px-1.5 py-0.5 rounded-full" style="background:rgba(201,168,76,.2);color:#C9A84C">Serving</span>`;
  },

  _collapse(el) {
    el.style.transition    = 'opacity .28s, max-height .32s ease, margin .28s, padding .28s';
    el.style.overflow      = 'hidden';
    el.style.maxHeight     = el.offsetHeight + 'px';
    requestAnimationFrame(() => {
      el.style.opacity       = '0';
      el.style.maxHeight     = '0';
      el.style.marginBottom  = '0';
      el.style.paddingTop    = '0';
      el.style.paddingBottom = '0';
    });
    setTimeout(() => el.remove(), 340);
  },

  async serve(id) {
    const el = document.querySelector(`.q-item[data-id="${id}"]`);
    if (el) {
      el.classList.add('q-serving');
      el.querySelector('.q-status').innerHTML = this._servingBadge() +
        `<button class="q-done text-[10px] font-semibold px-2 py-1 rounded-lg" style="background:rgba(74,222,128,.12);color:#4ade80" onclick="QueueManager.done(${id})">Done</button>`;
      el.querySelector('.q-serve')?.remove();
    }
    try {
      await fetch('api/queue.php', {
        method: 'PATCH',
        headers: API._h(),
        body: JSON.stringify({ id, status: 'serving' })
      });
    } catch { showToast('Network error', 'error'); }
  },

  async done(id) {
    const el = document.querySelector(`.q-item[data-id="${id}"]`);
    if (el) this._collapse(el);
    try {
      await fetch('api/queue.php', {
        method: 'PATCH',
        headers: API._h(),
        body: JSON.stringify({ id, status: 'done' })
      });
    } catch { showToast('Network error', 'error'); }
  },

  openAddModal() {
    document.getElementById('qadd-name').value  = '';
    document.getElementById('qadd-phone').value = '';
    document.getElementById('qadd-party').value = '1';
    openModal('modal-queue-add');
  },

  async add() {
    const name      = document.getElementById('qadd-name').value.trim();
    const phone     = document.getElementById('qadd-phone').value.trim();
    const partySize = Math.max(1, parseInt(document.getElementById('qadd-party').value, 10) || 1);
    if (!name || !phone) { showToast('Name and phone required', 'error'); return; }

    try {
      const res  = await fetch('api/queue.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ branch_id: App.currentBranch || 1, name, phone, party_size: partySize })
      });
      const data = await res.json();
      if (data.ok) {
        closeModal('modal-queue-add');
        showToast(`${name} added to queue`, 'success');
        clearTimeout(this._pollTimer);
        this._fetch();
      } else {
        showToast('Failed to add', 'error');
      }
    } catch { showToast('Network error', 'error'); }
  },

  _esc(s) {
    return String(s)
      .replace(/&/g,'&amp;').replace(/</g,'&lt;')
      .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }
};
```

- [ ] **Step 2: Commit**

```bash
git add assets/js/queue.js
git commit -m "feat: add QueueManager for dashboard walk-in queue

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

### Task 5: `modals/modal-queue.php` — staff add modal

**Files:**
- Create: `modals/modal-queue.php`

Context: Uses the existing `openModal` / `closeModal` / `modal-overlay` / `modal-box` / `inp` / `inp-label` / `btn-gold` / `btn-outline` CSS classes — same pattern as all other modals in the app.

- [ ] **Step 1: Create `modals/modal-queue.php`**

```php
<!-- ══ Modal: Add to Queue (Staff) ══════════════════════════ -->
<div id="modal-queue-add" class="modal-overlay hidden"
     onclick="if(event.target===this)closeModal('modal-queue-add')">
  <div class="modal-box max-w-sm w-full">

    <div class="modal-header">
      <h3 class="modal-title">Add Walk-in</h3>
      <button class="modal-close" onclick="closeModal('modal-queue-add')">
        <i class="fa-solid fa-xmark"></i>
      </button>
    </div>

    <div class="p-5 space-y-4">
      <div>
        <label class="inp-label">Customer Name</label>
        <input id="qadd-name" type="text" class="inp" placeholder="e.g. Ali Hassan">
      </div>
      <div>
        <label class="inp-label">Phone Number</label>
        <input id="qadd-phone" type="tel" class="inp" placeholder="e.g. 0123456789">
      </div>
      <div>
        <label class="inp-label">Total in Group</label>
        <input id="qadd-party" type="number" class="inp" min="1" max="10" value="1">
      </div>
    </div>

    <div class="modal-footer">
      <button onclick="closeModal('modal-queue-add')" class="btn-outline px-5 py-2.5 rounded-xl text-sm">
        Cancel
      </button>
      <button onclick="QueueManager.add()" class="btn-gold px-5 py-2.5 rounded-xl text-sm font-semibold">
        Add to Queue
      </button>
    </div>

  </div>
</div>
```

- [ ] **Step 2: Commit**

```bash
git add modals/modal-queue.php
git commit -m "feat: add staff walk-in queue modal

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

### Task 6: Dashboard widget rebuild

**Files:**
- Modify: `views/dashboard.php`
- Modify: `assets/js/dashboard.js`

Context: The existing queue widget uses `id="queue-list"`, `id="queue-empty"`, `id="queue-count-lbl"` — keep these. Change only the Add button onclick and remove old JS queue functions. `QueueManager.init()` is called from `Dashboard.init()`.

- [ ] **Step 1: Update queue widget button in `views/dashboard.php`**

Read `views/dashboard.php`. Find:

```html
        <button onclick="addToQueue()" class="btn-gold text-xs px-3 py-1.5 rounded-lg flex items-center gap-1">
          <i class="fa-solid fa-plus text-[10px]"></i> Add
        </button>
```

Replace with:

```html
        <button onclick="QueueManager.openAddModal()" class="btn-gold text-xs px-3 py-1.5 rounded-lg flex items-center gap-1">
          <i class="fa-solid fa-plus text-[10px]"></i> Add
        </button>
```

- [ ] **Step 2: Remove old queue code from `assets/js/dashboard.js`**

Read `assets/js/dashboard.js`. Make these changes:

**A — Remove `this.renderQueue()` call from `Dashboard.init()`** and add `QueueManager.init()`:

Find:
```js
  init() {
    this.renderKPIs();
    this.renderRecentTrx();
    this.renderQueue();
    this.initCharts();
  },
```

Replace with:
```js
  init() {
    this.renderKPIs();
    this.renderRecentTrx();
    this.initCharts();
    QueueManager.init();
  },
```

**B — Remove the entire `renderQueue()` method** from the `Dashboard` object. It starts with:
```js
  renderQueue() {
    const list  = document.getElementById('queue-list');
```
and ends before the next method. Delete the whole method (including the trailing comma if present).

**C — Remove the `addToQueue()` standalone function** at the bottom of the file:
```js
function addToQueue() {
  const name = prompt('Customer name:');
  if (!name || !name.trim()) return;
  const service = prompt('Service (optional):') || '';
  const now = new Date().toTimeString().slice(0,5);
  AppData.queue.push({ name: name.trim(), service: service.trim(), time: now });
  AppData.save('queue');
  Dashboard.renderQueue();
  showToast(`${name.trim()} added to queue`, 'success');
}
```

**D — Remove `Dashboard.removeFromQueue`** assignment:
```js
Dashboard.removeFromQueue = function(i) {
  AppData.queue.splice(i, 1);
  AppData.save('queue');
  Dashboard.renderQueue();
};
```

- [ ] **Step 3: Commit**

```bash
git add views/dashboard.php assets/js/dashboard.js
git commit -m "feat: replace blob queue widget with MySQL-backed QueueManager

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

### Task 7: Settings QR code section

**Files:**
- Modify: `views/settings.php`
- Modify: `assets/js/settings.js`

Context: `Settings.load()` is called when the settings view is opened. `renderQRCode()` derives the queue URL from `location.href` (works on any domain/path). QR image is from `https://api.qrserver.com/v1/create-qr-code/`.

- [ ] **Step 1: Add QR section to `views/settings.php`**

Read `views/settings.php`. Find the closing `</div>` of the `max-w-3xl` wrapper (the very last `</div>` before `</section>`). Insert this new card-section block immediately before that closing `</div>`:

```html
    <!-- Section: Walk-in Queue QR ─────────────────────── -->
    <div class="card-section mb-5">
      <div class="flex items-center gap-3 mb-5">
        <div class="w-9 h-9 rounded-xl bg-blue-500/14 flex items-center justify-center">
          <i class="fa-solid fa-qrcode text-blue-400 text-sm"></i>
        </div>
        <div>
          <h3 class="text-sm font-bold text-white">Walk-in Queue QR</h3>
          <p class="text-xs text-white/35">Customers scan this to join the queue from their phone</p>
        </div>
      </div>

      <div class="flex flex-col sm:flex-row gap-5 items-start">
        <div id="qr-code-wrap" class="rounded-xl overflow-hidden flex-shrink-0 bg-white p-2"></div>
        <div class="flex-1 min-w-0">
          <label class="text-xs text-white/45 mb-1.5 block font-medium">Queue URL</label>
          <div class="flex gap-2 mb-3">
            <input id="queue-url-display" type="text" class="inp flex-1 text-xs" readonly>
            <button onclick="Settings.copyQueueUrl()" class="btn-outline px-3 py-2 rounded-xl text-xs whitespace-nowrap">
              <i class="fa-solid fa-copy mr-1"></i>Copy
            </button>
          </div>
          <p class="text-xs text-white/30 mb-3">Display this QR at your shop entrance. Customers scan it to join the queue from their phone.</p>
          <a id="qr-download-link" target="_blank"
            class="inline-flex items-center gap-1.5 text-xs text-gold hover:opacity-75 transition-opacity">
            <i class="fa-solid fa-arrow-up-right-from-square text-[10px]"></i> Open QR Image
          </a>
        </div>
      </div>
    </div>
```

- [ ] **Step 2: Add `renderQRCode()` and `copyQueueUrl()` to `assets/js/settings.js`**

Read `assets/js/settings.js`. Find the `load()` method. At the very end of `load()` (before its closing `},`), add:

```js
    this.renderQRCode();
```

Then find the last method in the `Settings` object (before the closing `};`). Add these two methods as the final methods (with a leading comma after the previous method if needed):

```js
  renderQRCode() {
    const base  = location.href.replace(/[^/]*$/, '');
    const branch = App.currentBranch || 1;
    const url   = `${base}queue.php?branch=${branch}`;
    const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(url)}&bgcolor=ffffff&color=000000&margin=8`;

    const wrap = document.getElementById('qr-code-wrap');
    if (wrap) wrap.innerHTML = `<img src="${qrSrc}" width="160" height="160" alt="Queue QR Code">`;

    const inp = document.getElementById('queue-url-display');
    if (inp) inp.value = url;

    const dl = document.getElementById('qr-download-link');
    if (dl) dl.href = qrSrc;
  },

  copyQueueUrl() {
    const url = document.getElementById('queue-url-display')?.value;
    if (!url) return;
    navigator.clipboard.writeText(url)
      .then(() => showToast('Queue URL copied!', 'success'))
      .catch(() => showToast('Copy failed', 'error'));
  },
```

- [ ] **Step 3: Commit**

```bash
git add views/settings.php assets/js/settings.js
git commit -m "feat: add walk-in queue QR code section to settings

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

### Task 8: Wire up in `index.php`

**Files:**
- Modify: `index.php`

- [ ] **Step 1: Add `queue.js` script tag**

Read `index.php`. Find:

```html
<script src="assets/js/dashboard.js?v=<?= filemtime('assets/js/dashboard.js') ?>"></script>
```

Add the `queue.js` line immediately after it:

```html
<script src="assets/js/dashboard.js?v=<?= filemtime('assets/js/dashboard.js') ?>"></script>
<script src="assets/js/queue.js?v=<?= filemtime('assets/js/queue.js') ?>"></script>
```

- [ ] **Step 2: Include `modal-queue.php`**

Find:

```html
<?php include 'modals/modal-confirm.php'; ?>
```

Add the modal-queue include after it:

```html
<?php include 'modals/modal-confirm.php'; ?>
<?php include 'modals/modal-queue.php'; ?>
```

- [ ] **Step 3: Commit**

```bash
git add index.php
git commit -m "feat: wire queue.js and modal-queue.php into index.php

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

### Task 9: Deploy and verify

- [ ] **Step 1: Push to GitHub**

```bash
git push origin main
```

- [ ] **Step 2: Deploy to server**

```bash
ssh -i ~/.ssh/hostinger_deploy -p 65002 u929568672@145.79.28.63 "cd ~/domains/nextapmy.com/public_html/__HAB && bash deploy.sh"
```

- [ ] **Step 3: Verify files on server**

```bash
ssh -i ~/.ssh/hostinger_deploy -p 65002 u929568672@145.79.28.63 "ls -la ~/domains/nextapmy.com/public_html/__HAB/queue.php ~/domains/nextapmy.com/public_html/__HAB/api/queue.php ~/domains/nextapmy.com/public_html/__HAB/assets/js/queue.js && mysql -u u929568672_hab -pNextap@2025 u929568672_hab -e 'DESCRIBE \`queue\`;' 2>/dev/null"
```

Expected: all three files listed, table columns shown.

- [ ] **Step 4: Manual verification checklist**

1. Open `https://nextapmy.com/__HAB/queue.php?branch=1` on mobile → join form shows
2. Enter name + phone + group size → submit → queue view shows with your entry
3. Close and reopen the page → skips form, shows queue directly (sessionStorage)
4. Open POS dashboard → Walk-in Queue widget shows the entry
5. Click **Serve** on the entry → turns gold, "Serving" badge appears
6. On the `queue.php` page → Your Turn banner appears within 5s
7. Click **Done** on the entry → entry collapses with animation
8. Open Settings → QR Code section shows QR image and URL
9. Click **Copy** → queue URL in clipboard
