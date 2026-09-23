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
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    .hidden { display: none !important; }

    :root {
      --gold:       #C9A84C;
      --gold-dim:   rgba(201,168,76,.14);
      --gold-ring:  rgba(201,168,76,.3);
      --bg:         #0A0A0A;
      --surface:    rgba(255,255,255,.045);
      --border:     rgba(255,255,255,.08);
      --text-muted: rgba(255,255,255,.4);
      --text-faint: rgba(255,255,255,.22);
    }

    html, body {
      min-height: 100%;
      background: var(--bg);
      color: #fff;
      font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
      -webkit-font-smoothing: antialiased;
    }

    /* ── Header ──────────────────────────────────────────────── */
    .page-header {
      text-align: center;
      padding: 2.5rem 1.5rem 1.75rem;
    }
    .page-logo {
      height: 70px;
      width: auto;
      display: block;
      margin: 0 auto 1rem;
      object-fit: contain;
    }
    .page-subtitle {
      display: inline-flex;
      align-items: center;
      gap: .45rem;
      font-size: .78rem;
      font-weight: 600;
      letter-spacing: .14em;
      text-transform: uppercase;
      color: var(--gold);
      background: var(--gold-dim);
      border-radius: 2rem;
      padding: .3rem .85rem;
    }

    /* ── Content wrapper ─────────────────────────────────────── */
    .page-body {
      max-width: 420px;
      margin: 0 auto;
      padding: 0 1.25rem 4rem;
    }

    /* ── Cards ───────────────────────────────────────────────── */
    .card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 1.25rem;
      padding: 1.5rem;
    }
    .card + .card { margin-top: 1rem; }

    /* ── Form inputs ─────────────────────────────────────────── */
    .field { margin-bottom: 1rem; }
    .field:last-of-type { margin-bottom: 0; }
    .field-label {
      font-size: .75rem;
      font-weight: 600;
      color: var(--text-muted);
      margin-bottom: .5rem;
      display: flex;
      align-items: center;
      gap: .4rem;
    }
    .inp-wrap { position: relative; }
    .inp-icon {
      position: absolute;
      left: .85rem;
      top: 50%;
      transform: translateY(-50%);
      font-size: .8rem;
      color: var(--text-faint);
      pointer-events: none;
    }
    .inp {
      width: 100%;
      background: rgba(255,255,255,.05);
      border: 1px solid var(--border);
      border-radius: .85rem;
      padding: .75rem .9rem .75rem 2.4rem;
      color: #fff;
      font-size: .9rem;
      outline: none;
      transition: border-color .18s, background .18s;
    }
    .inp:focus {
      border-color: var(--gold);
      background: rgba(201,168,76,.05);
    }
    .inp::placeholder { color: var(--text-faint); }

    /* ── Join button ─────────────────────────────────────────── */
    .btn-join {
      width: 100%;
      margin-top: 1.25rem;
      background: linear-gradient(135deg, #C9A84C, #A8893A);
      color: #000;
      font-weight: 700;
      border-radius: .85rem;
      padding: .9rem 1.5rem;
      font-size: .95rem;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: .6rem;
      transition: opacity .18s, transform .1s;
    }
    .btn-join:hover   { opacity: .88; }
    .btn-join:active  { transform: scale(.98); }
    .btn-join:disabled { opacity: .45; cursor: not-allowed; }

    .err-msg {
      display: none;
      font-size: .78rem;
      color: #f87171;
      text-align: center;
      margin-top: .75rem;
    }
    .err-msg.show { display: block; }

    /* ── Floating + button ───────────────────────────────────── */
    .fab {
      position: fixed;
      bottom: 1.75rem;
      right: 1.5rem;
      width: 3.25rem;
      height: 3.25rem;
      border-radius: 50%;
      background: linear-gradient(135deg, #C9A84C, #A8893A);
      color: #000;
      font-size: 1.4rem;
      font-weight: 700;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 20px rgba(201,168,76,.35);
      transition: transform .15s, box-shadow .15s;
      z-index: 100;
    }
    .fab:hover  { transform: scale(1.08); box-shadow: 0 6px 28px rgba(201,168,76,.45); }
    .fab:active { transform: scale(.96); }

    /* ── Join overlay ────────────────────────────────────────── */
    .join-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,.72);
      z-index: 200;
      display: flex;
      align-items: flex-end;
      justify-content: center;
      animation: fadeIn .18s ease;
    }
    .join-overlay.hidden { display: none !important; }
    .join-sheet {
      background: #141414;
      border: 1px solid var(--border);
      border-radius: 1.5rem 1.5rem 0 0;
      width: 100%;
      max-width: 480px;
      padding: 1.5rem 1.5rem 2.5rem;
      animation: slideUp .22s ease;
    }
    .sheet-handle {
      width: 2.5rem; height: .3rem;
      background: rgba(255,255,255,.15);
      border-radius: 2rem;
      margin: 0 auto 1.25rem;
    }
    .sheet-title {
      font-size: 1.05rem;
      font-weight: 800;
      color: #fff;
      margin-bottom: .25rem;
    }
    .sheet-sub {
      font-size: .78rem;
      color: var(--text-muted);
      margin-bottom: 1.25rem;
    }
    .pax-row {
      display: flex;
      align-items: center;
      gap: .5rem;
      margin-bottom: .5rem;
    }
    .pax-row .inp { flex: 1; font-size: .85rem; padding: .65rem .85rem; }
    .pax-remove {
      width: 2rem; height: 2rem;
      border-radius: .5rem;
      border: none;
      background: rgba(248,113,113,.12);
      color: #f87171;
      cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      font-size: .8rem;
      flex-shrink: 0;
    }
    .btn-add-pax {
      background: rgba(201,168,76,.1);
      border: 1px dashed rgba(201,168,76,.35);
      border-radius: .75rem;
      color: var(--gold);
      font-size: .8rem;
      font-weight: 600;
      padding: .5rem .9rem;
      cursor: pointer;
      width: 100%;
      text-align: center;
      margin-top: .4rem;
      transition: background .15s;
    }
    .btn-add-pax:hover { background: rgba(201,168,76,.18); }

    @keyframes fadeIn  { from{opacity:0} to{opacity:1} }
    @keyframes slideUp { from{transform:translateY(20px);opacity:0} to{transform:translateY(0);opacity:1} }

    /* ── My position card ────────────────────────────────────── */
    .pos-card {
      border-radius: 1.25rem;
      padding: 1.75rem 1.5rem;
      text-align: center;
      margin-bottom: 1rem;
      border: 1px solid var(--border);
      background: var(--surface);
    }
    .pos-card.is-serving {
      border-color: var(--gold);
      background: rgba(201,168,76,.07);
      animation: servingGlow 2.4s ease infinite;
    }
    .pos-card-eyebrow {
      font-size: .72rem;
      font-weight: 700;
      letter-spacing: .16em;
      text-transform: uppercase;
      color: var(--text-muted);
      margin-bottom: .75rem;
    }
    .pos-card.is-serving .pos-card-eyebrow { color: var(--gold); }
    .pos-num {
      font-size: 4.5rem;
      font-weight: 900;
      line-height: 1;
      color: #fff;
      letter-spacing: -.04em;
    }
    .pos-card.is-serving .pos-num { color: var(--gold); }
    .pos-unit {
      font-size: .9rem;
      color: var(--text-muted);
      margin-top: .3rem;
    }
    .pos-serving-icon {
      font-size: 3rem;
      color: var(--gold);
      margin-bottom: .75rem;
      display: block;
    }
    .pos-serving-title {
      font-size: 1.4rem;
      font-weight: 800;
      margin-bottom: .35rem;
    }
    .pos-serving-sub {
      font-size: .85rem;
      color: var(--text-muted);
    }

    /* ── Queue list header ───────────────────────────────────── */
    .queue-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: .75rem;
    }
    .queue-title {
      font-size: .8rem;
      font-weight: 700;
      color: var(--text-muted);
      letter-spacing: .1em;
      text-transform: uppercase;
    }
    .live-badge {
      display: flex;
      align-items: center;
      gap: .4rem;
      font-size: .7rem;
      font-weight: 600;
      color: var(--text-faint);
      letter-spacing: .08em;
    }
    .live-dot {
      width: .5rem; height: .5rem;
      border-radius: 50%;
      background: #4ade80;
      animation: livePulse 2s ease infinite;
    }

    /* ── Queue rows ──────────────────────────────────────────── */
    .q-list { display: flex; flex-direction: column; gap: .5rem; }
    .q-row {
      display: flex;
      align-items: center;
      gap: .85rem;
      padding: .85rem 1rem;
      border-radius: 1rem;
      border: 1px solid var(--border);
      background: var(--surface);
      animation: qSlideIn .28s ease both;
    }
    .q-row.is-mine {
      border-color: rgba(201,168,76,.35);
      background: rgba(201,168,76,.06);
    }
    .q-row.is-serving {
      border-color: var(--gold);
      background: rgba(201,168,76,.08);
      animation: qSlideIn .28s ease both, goldRing 1.6s ease 4;
    }
    .q-pos-badge {
      width: 2.25rem; height: 2.25rem;
      border-radius: .6rem;
      background: rgba(201,168,76,.16);
      display: flex; align-items: center; justify-content: center;
      font-size: .78rem;
      font-weight: 800;
      color: rgba(255,255,255,.65);
      flex-shrink: 0;
    }
    .q-info { flex: 1; min-width: 0; }
    .q-name-row {
      display: flex;
      align-items: center;
      gap: .4rem;
      flex-wrap: wrap;
    }
    .q-name {
      font-size: .88rem;
      font-weight: 600;
      color: #fff;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .q-party-lbl {
      font-size: .72rem;
      color: var(--text-faint);
    }
    .q-you-badge {
      font-size: .65rem;
      font-weight: 700;
      padding: .15rem .5rem;
      border-radius: 2rem;
      background: var(--gold-dim);
      color: var(--gold);
      white-space: nowrap;
    }
    .q-phone {
      font-size: .72rem;
      color: var(--text-faint);
      margin-top: .15rem;
      display: flex;
      align-items: center;
      gap: .3rem;
    }
    .q-status-badge {
      font-size: .7rem;
      font-weight: 700;
      padding: .25rem .65rem;
      border-radius: 2rem;
      flex-shrink: 0;
      white-space: nowrap;
    }
    .q-status-badge.waiting {
      background: rgba(255,255,255,.07);
      color: var(--text-faint);
    }
    .q-status-badge.serving {
      background: var(--gold-dim);
      color: var(--gold);
    }

    /* ── Empty state ─────────────────────────────────────────── */
    .queue-empty {
      text-align: center;
      padding: 2.5rem 1rem;
    }
    .queue-empty-icon {
      font-size: 2.5rem;
      color: var(--text-faint);
      margin-bottom: .85rem;
      display: block;
    }
    .queue-empty p {
      font-size: .88rem;
      color: var(--text-faint);
    }

    /* ── Animations ──────────────────────────────────────────── */
    @keyframes qSlideIn {
      from { opacity: 0; transform: translateY(12px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes goldRing {
      0%, 100% { box-shadow: 0 0 0 0 rgba(201,168,76,.4); }
      50%       { box-shadow: 0 0 0 8px rgba(201,168,76,0); }
    }
    @keyframes servingGlow {
      0%, 100% { box-shadow: 0 0 0 0 rgba(201,168,76,.2); }
      50%       { box-shadow: 0 0 0 14px rgba(201,168,76,0); }
    }
    @keyframes livePulse {
      0%, 100% { opacity: 1; }
      50%       { opacity: .3; }
    }
    @keyframes popIn {
      from { opacity: 0; transform: scale(.9); }
      to   { opacity: 1; transform: scale(1); }
    }
  </style>
</head>
<body>

  <!-- ── Header ───────────────────────────────────────────────── -->
  <header class="page-header">
    <img src="logo-hab.png" alt="<?= htmlspecialchars($branchName) ?>" class="page-logo">
    <span class="page-subtitle">
      <i class="fa-solid fa-list-ol" style="font-size:.7rem"></i>
      Walk-in Queue
    </span>
  </header>

  <div class="page-body">

    <!-- My position card (hidden until joined) -->
    <div id="pos-card" class="pos-card hidden">
      <div class="pos-card-eyebrow">Your Position</div>
      <div class="pos-num" id="pos-num">—</div>
      <div class="pos-unit" id="pos-unit">in line</div>
    </div>

    <!-- Queue list (always visible) -->
    <div class="queue-header">
      <span class="queue-title">
        <i class="fa-solid fa-users" style="margin-right:.35rem;opacity:.6"></i>
        Current Queue
      </span>
      <div class="live-badge">
        <span class="live-dot"></span>
        Live
      </div>
    </div>

    <div id="q-list" class="q-list"></div>

    <div id="q-empty" class="queue-empty">
      <i class="fa-solid fa-chair queue-empty-icon"></i>
      <p>Queue is empty — tap + to join!</p>
    </div>

  </div>

  <!-- Floating + button -->
  <button class="fab" id="fab-join" title="Join queue" onclick="openJoinSheet()">
    <i class="fa-solid fa-plus"></i>
  </button>

  <!-- Join overlay sheet -->
  <div id="join-overlay" class="join-overlay hidden" onclick="if(event.target===this)closeJoinSheet()">
    <div class="join-sheet">
      <div class="sheet-handle"></div>
      <p class="sheet-title">Join the Queue</p>
      <p class="sheet-sub">Enter your details to get in line</p>

      <div class="field">
        <div class="inp-wrap">
          <i class="fa-solid fa-user inp-icon"></i>
          <input id="inp-name" type="text" class="inp" placeholder="Your name" autocomplete="name">
        </div>
      </div>

      <div class="field">
        <div class="inp-wrap">
          <i class="fa-solid fa-phone inp-icon"></i>
          <input id="inp-phone" type="tel" class="inp" placeholder="Phone number" autocomplete="tel">
        </div>
      </div>

      <div class="field" style="margin-bottom:.25rem">
        <div class="field-label">
          <i class="fa-solid fa-users" style="opacity:.6"></i>
          Additional group members <span style="font-weight:400;opacity:.6">(optional)</span>
        </div>
        <div id="pax-rows"></div>
        <button type="button" class="btn-add-pax" onclick="addPaxRow()">
          <i class="fa-solid fa-plus" style="font-size:.7rem;margin-right:.3rem"></i> Add person
        </button>
      </div>

      <button id="btn-join" class="btn-join">
        <i class="fa-solid fa-arrow-right-to-bracket"></i>
        Join Queue
      </button>
      <p id="join-err" class="err-msg"></p>
    </div>
  </div>

<script>
  const BRANCH_ID = <?= intval($branchId) ?>;
  let myId        = localStorage.getItem('hab_q_id') ? parseInt(localStorage.getItem('hab_q_id'), 10) : null;
  let myNotified  = localStorage.getItem('hab_q_notified') === '1';

  // ── Join sheet ────────────────────────────────────────────
  function openJoinSheet() {
    // If already in queue, hide FAB and show pos card instead
    if (myId) return;
    document.getElementById('pax-rows').innerHTML = '';
    document.getElementById('inp-name').value  = '';
    document.getElementById('inp-phone').value = '';
    document.getElementById('join-err').classList.remove('show');
    document.getElementById('join-overlay').classList.remove('hidden');
    setTimeout(() => document.getElementById('inp-name')?.focus(), 100);
  }

  function closeJoinSheet() {
    document.getElementById('join-overlay').classList.add('hidden');
  }

  function addPaxRow() {
    const container = document.getElementById('pax-rows');
    const idx = container.children.length + 2;
    const row = document.createElement('div');
    row.className = 'pax-row';
    row.innerHTML = `
      <input type="text" class="inp" placeholder="Person ${idx} name" autocomplete="off">
      <button type="button" class="pax-remove" onclick="this.parentElement.remove()">
        <i class="fa-solid fa-xmark"></i>
      </button>`;
    container.appendChild(row);
    row.querySelector('input')?.focus();
  }

  // ── Join ──────────────────────────────────────────────────
  document.getElementById('btn-join').addEventListener('click', async () => {
    const name  = document.getElementById('inp-name').value.trim();
    const phone = document.getElementById('inp-phone').value.trim();
    document.getElementById('join-err').classList.remove('show');

    if (!name)  { showErr('Please enter your name.');         return; }
    if (!phone) { showErr('Please enter your phone number.'); return; }

    const paxInputs = [...document.querySelectorAll('#pax-rows input')];
    const paxNames  = paxInputs.map(el => el.value.trim()).filter(Boolean);

    const btn = document.getElementById('btn-join');
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Joining…';

    try {
      const res  = await fetch('api/queue.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ branch_id: BRANCH_ID, name, phone, pax_names: paxNames })
      });
      const data = await res.json();
      if (data.ok) {
        myId = parseInt(data.entry.id, 10);
        localStorage.setItem('hab_q_id', myId);
        localStorage.removeItem('hab_q_notified');
        myNotified = false;
        closeJoinSheet();
        hideFab();
      } else {
        showErr('Failed to join. Please try again.');
      }
    } catch {
      showErr('Network error. Please try again.');
    } finally {
      btn.disabled = false;
      btn.innerHTML = '<i class="fa-solid fa-arrow-right-to-bracket"></i> Join Queue';
    }
  });

  function showErr(msg) {
    const el = document.getElementById('join-err');
    el.textContent = msg;
    el.classList.add('show');
  }

  function hideFab() { document.getElementById('fab-join').style.display = 'none'; }
  function showFab() { document.getElementById('fab-join').style.display = ''; }

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

  // ── Render ────────────────────────────────────────────────
  function render(entries) {
    const list  = document.getElementById('q-list');
    const empty = document.getElementById('q-empty');
    const waiting = entries.filter(e => e.status === 'waiting');

    empty.classList.toggle('hidden', entries.length > 0);
    list.classList.toggle('hidden', entries.length === 0);

    // Update my position card
    const posCard = document.getElementById('pos-card');
    const myEntry = entries.find(e => parseInt(e.id, 10) === myId);

    if (myId && myEntry) {
      posCard.classList.remove('hidden');
      hideFab();
      if (myEntry.status === 'serving') {
        posCard.className = 'pos-card is-serving';
        posCard.innerHTML = `
          <i class="fa-solid fa-scissors pos-serving-icon"></i>
          <div class="pos-serving-title">It's Your Turn!</div>
          <div class="pos-serving-sub">Please proceed to the barber</div>`;
        if (!myNotified) {
          myNotified = true;
          localStorage.setItem('hab_q_notified', '1');
          if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
        }
      } else {
        const myPos = waiting.findIndex(e => parseInt(e.id, 10) === myId) + 1;
        posCard.className = 'pos-card';
        posCard.innerHTML = `
          <div class="pos-card-eyebrow">Your Position</div>
          <div class="pos-num">#${myPos}</div>
          <div class="pos-unit">${myPos === 1 ? "You're next!" : `${myPos - 1} ${myPos === 2 ? 'person' : 'people'} ahead`}</div>`;
      }
    } else if (myId && !myEntry) {
      // Done or cleared — show completion, reset
      posCard.classList.remove('hidden');
      posCard.className = 'pos-card';
      posCard.innerHTML = `
        <i class="fa-solid fa-circle-check" style="font-size:2.5rem;color:var(--gold);display:block;margin-bottom:.75rem"></i>
        <div class="pos-serving-title" style="font-size:1.1rem">All done!</div>
        <div class="pos-serving-sub" style="margin-bottom:1.25rem">Thanks for visiting!</div>
        <button onclick="resetJoin()" style="background:linear-gradient(135deg,#C9A84C,#A8893A);color:#000;font-weight:700;border-radius:.75rem;padding:.65rem 1.5rem;font-size:.85rem;border:none;cursor:pointer;display:inline-flex;align-items:center;gap:.5rem">
          <i class="fa-solid fa-arrow-right-to-bracket"></i> Join Again
        </button>`;
      localStorage.removeItem('hab_q_id');
      localStorage.removeItem('hab_q_notified');
      myId = null; myNotified = false;
      showFab();
    } else {
      posCard.classList.add('hidden');
      showFab();
    }

    // Remove gone entries from DOM
    const incoming = new Set(entries.map(e => String(e.id)));
    [...list.querySelectorAll('.q-row')].forEach(el => {
      if (!incoming.has(el.dataset.id)) collapse(el);
    });

    // Add or update rows
    entries.forEach((entry, i) => {
      const existing = list.querySelector(`.q-row[data-id="${entry.id}"]`);
      if (existing) {
        existing.querySelector('.q-pos-badge').textContent = `#${i + 1}`;
        if (!existing.classList.contains('is-serving') && entry.status === 'serving') {
          existing.classList.add('is-serving');
          existing.classList.remove('is-mine');
          const badge = existing.querySelector('.q-status-badge');
          if (badge) { badge.textContent = 'In Chair'; badge.className = 'q-status-badge serving'; }
        }
      } else {
        list.appendChild(buildRow(entry, i));
      }
    });
  }

  function buildRow(entry, pos) {
    const isMine    = myId && parseInt(entry.id, 10) === myId;
    const isServing = entry.status === 'serving';
    const extraPax  = entry.pax_names?.length || (entry.party_size > 1 ? entry.party_size - 1 : 0);
    const partyTxt  = extraPax > 0 ? `+${extraPax}` : '';
    const phoneMask = '****' + String(entry.phone || '').slice(-4);

    const div = document.createElement('div');
    div.dataset.id = String(entry.id);
    div.className  = 'q-row' + (isServing ? ' is-serving' : isMine ? ' is-mine' : '');

    div.innerHTML = `
      <div class="q-pos-badge">#${pos + 1}</div>
      <div class="q-info">
        <div class="q-name-row">
          <span class="q-name">${esc(entry.name)}</span>
          ${partyTxt ? `<span class="q-party-lbl"><i class="fa-solid fa-users" style="font-size:.65rem;margin-right:.2rem"></i>${esc(partyTxt)}</span>` : ''}
          ${isMine ? `<span class="q-you-badge"><i class="fa-solid fa-circle-dot" style="font-size:.6rem;margin-right:.2rem"></i>You</span>` : ''}
        </div>
        <div class="q-phone">
          <i class="fa-solid fa-phone" style="font-size:.65rem;opacity:.5"></i>
          ${esc(phoneMask)}
        </div>
      </div>
      <span class="q-status-badge ${isServing ? 'serving' : 'waiting'}">
        ${isServing ? 'In Chair' : 'Waiting'}
      </span>`;
    return div;
  }

  function resetJoin() {
    document.getElementById('pos-card').classList.add('hidden');
    showFab();
  }

  function collapse(el) {
    el.style.transition     = 'opacity .3s, max-height .35s ease, margin .3s, padding .3s';
    el.style.overflow       = 'hidden';
    el.style.maxHeight      = el.offsetHeight + 'px';
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
    return String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  // ── Init ──────────────────────────────────────────────────
  if (myId) hideFab();
  poll();
</script>
</body>
</html>
