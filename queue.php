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
      el.style.transition    = 'opacity .3s, max-height .35s ease, margin .3s, padding .3s';
      el.style.overflow      = 'hidden';
      el.style.maxHeight     = el.offsetHeight + 'px';
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
