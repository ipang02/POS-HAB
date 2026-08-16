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
  <meta name="viewport" content="width=1920, initial-scale=1.0">
  <title><?= htmlspecialchars($branchName) ?> — Queue Display</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --gold:      #C9A84C;
      --gold-dim:  rgba(201,168,76,.14);
      --gold-ring: rgba(201,168,76,.25);
      --bg:        #080808;
      --surface:   rgba(255,255,255,.045);
      --border:    rgba(255,255,255,.07);
      --text-dim:  rgba(255,255,255,.38);
    }

    html, body {
      width: 100%; height: 100%;
      overflow: hidden;
      background: var(--bg);
      color: #fff;
      font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
      -webkit-font-smoothing: antialiased;
    }

    /* ── Root layout ────────────────────────────────────────────── */
    .tv-wrap {
      display: flex;
      flex-direction: column;
      width: 100vw;
      height: 100vh;
    }

    /* ── Header ─────────────────────────────────────────────────── */
    .tv-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1.1rem 2.5rem;
      border-bottom: 1px solid var(--border);
      flex-shrink: 0;
      background: rgba(0,0,0,.35);
      backdrop-filter: blur(8px);
    }
    .tv-brand {
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    .tv-brand-icon {
      width: 3rem; height: 3rem;
      border-radius: .85rem;
      background: var(--gold-dim);
      border: 1px solid var(--gold-ring);
      display: flex; align-items: center; justify-content: center;
      font-size: 1.45rem;
    }
    .tv-brand-name {
      font-size: 1.55rem;
      font-weight: 700;
      letter-spacing: -.025em;
    }
    .tv-header-right {
      display: flex;
      align-items: center;
      gap: 1.25rem;
    }
    .tv-live {
      display: flex;
      align-items: center;
      gap: .5rem;
      font-size: .75rem;
      font-weight: 700;
      letter-spacing: .14em;
      color: rgba(255,255,255,.3);
      text-transform: uppercase;
    }
    .live-dot {
      width: .6rem; height: .6rem;
      border-radius: 50%;
      background: #4ade80;
      animation: livePulse 2s ease infinite;
    }
    .tv-clock {
      font-size: 1.55rem;
      font-weight: 300;
      color: rgba(255,255,255,.65);
      font-variant-numeric: tabular-nums;
      letter-spacing: .02em;
    }

    /* ── Body ───────────────────────────────────────────────────── */
    .tv-body {
      display: flex;
      flex: 1;
      min-height: 0;
    }

    /* ── Left: Now Serving ──────────────────────────────────────── */
    .tv-left {
      width: 36%;
      flex-shrink: 0;
      border-right: 1px solid var(--border);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 2.5rem 2rem;
      gap: 1.75rem;
      background: linear-gradient(160deg, rgba(201,168,76,.04) 0%, transparent 60%);
    }
    .tv-section-label {
      font-size: .72rem;
      font-weight: 700;
      letter-spacing: .22em;
      text-transform: uppercase;
      color: var(--gold);
    }
    .tv-serving-card {
      width: 100%;
      max-width: 360px;
      border-radius: 1.75rem;
      border: 1.5px solid var(--gold);
      background: rgba(201,168,76,.07);
      padding: 2.75rem 2rem 2.5rem;
      text-align: center;
      animation: servingGlow 2.8s ease infinite;
    }
    .tv-serving-tag {
      display: inline-flex;
      align-items: center;
      gap: .45rem;
      font-size: .75rem;
      font-weight: 700;
      letter-spacing: .14em;
      text-transform: uppercase;
      color: var(--gold);
      background: var(--gold-dim);
      border-radius: 2rem;
      padding: .35rem .9rem;
      margin-bottom: 1.5rem;
    }
    .tv-serving-name {
      font-size: 2.6rem;
      font-weight: 800;
      line-height: 1.08;
      letter-spacing: -.03em;
    }
    .tv-serving-party {
      font-size: .95rem;
      color: var(--text-dim);
      margin-top: .6rem;
    }

    /* Empty state */
    .tv-serving-empty {
      width: 100%;
      max-width: 360px;
      border-radius: 1.75rem;
      border: 1px dashed rgba(255,255,255,.12);
      padding: 3.5rem 2rem;
      text-align: center;
    }
    .tv-serving-empty .empty-icon { font-size: 2.75rem; margin-bottom: .75rem; }
    .tv-serving-empty p { font-size: 1rem; color: rgba(255,255,255,.2); }

    /* ── Right: Queue list ──────────────────────────────────────── */
    .tv-right {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-width: 0;
    }
    .tv-queue-header {
      padding: 1.1rem 2rem .9rem;
      border-bottom: 1px solid var(--border);
      flex-shrink: 0;
      display: flex;
      align-items: baseline;
      gap: .85rem;
    }
    .tv-queue-count-num {
      font-size: 2rem;
      font-weight: 800;
      line-height: 1;
    }
    .tv-queue-count-lbl {
      font-size: .85rem;
      color: var(--text-dim);
      font-weight: 500;
    }

    /* Scroll container */
    .tv-scroll-wrap {
      flex: 1;
      overflow: hidden;
      position: relative;
    }
    .tv-queue-list {
      padding: .85rem 1.75rem;
    }
    .tv-queue-list.scrolling {
      animation: tvScroll linear infinite;
    }

    /* Queue row */
    .tv-row {
      display: flex;
      align-items: center;
      gap: 1.2rem;
      padding: .9rem 1.25rem;
      border-radius: 1rem;
      margin-bottom: .55rem;
      background: var(--surface);
      border: 1px solid var(--border);
    }
    .tv-row-pos {
      width: 3rem; height: 3rem;
      border-radius: .75rem;
      background: rgba(201,168,76,.14);
      display: flex; align-items: center; justify-content: center;
      font-size: 1.05rem;
      font-weight: 800;
      color: rgba(255,255,255,.65);
      flex-shrink: 0;
    }
    .tv-row-info { flex: 1; min-width: 0; }
    .tv-row-name {
      font-size: 1.35rem;
      font-weight: 700;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .tv-row-sub {
      font-size: .8rem;
      color: var(--text-dim);
      margin-top: .1rem;
    }
    .tv-row-badge {
      font-size: .72rem;
      font-weight: 700;
      padding: .3rem .8rem;
      border-radius: 2rem;
      flex-shrink: 0;
      letter-spacing: .06em;
      background: rgba(255,255,255,.07);
      color: rgba(255,255,255,.3);
    }

    /* Empty queue */
    .tv-queue-empty {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: .85rem;
    }
    .tv-queue-empty .empty-icon { font-size: 3.5rem; }
    .tv-queue-empty p { font-size: 1.05rem; color: rgba(255,255,255,.2); }

    /* ── Animations ─────────────────────────────────────────────── */
    @keyframes livePulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50%       { opacity: .35; transform: scale(.85); }
    }
    @keyframes servingGlow {
      0%, 100% { box-shadow: 0 0 0 0 rgba(201,168,76,.22); }
      50%       { box-shadow: 0 0 0 16px rgba(201,168,76,0); }
    }
    @keyframes tvScroll {
      0%   { transform: translateY(0); }
      100% { transform: translateY(-50%); }
    }
  </style>
</head>
<body>
<div class="tv-wrap">

  <!-- ── Header ──────────────────────────────────────────────── -->
  <header class="tv-header">
    <div class="tv-brand">
      <div class="tv-brand-icon">💈</div>
      <span class="tv-brand-name"><?= htmlspecialchars($branchName) ?></span>
    </div>
    <div class="tv-header-right">
      <div class="tv-live">
        <span class="live-dot"></span>
        Live
      </div>
      <span class="tv-clock" id="tv-clock">--:--:--</span>
    </div>
  </header>

  <!-- ── Body ────────────────────────────────────────────────── -->
  <div class="tv-body">

    <!-- Left: Now Serving -->
    <div class="tv-left">
      <span class="tv-section-label">Now Serving</span>
      <div id="tv-serving-slot">
        <div class="tv-serving-empty">
          <div class="empty-icon">🪑</div>
          <p>No one being served</p>
        </div>
      </div>
    </div>

    <!-- Right: Queue -->
    <div class="tv-right">
      <div class="tv-queue-header">
        <span class="tv-section-label">Queue</span>
        <span class="tv-queue-count-num" id="tv-count">0</span>
        <span class="tv-queue-count-lbl" id="tv-count-lbl">waiting</span>
      </div>

      <div class="tv-scroll-wrap" id="tv-scroll-wrap">
        <div id="tv-queue-list" class="tv-queue-list"></div>
      </div>

      <div id="tv-queue-empty" class="tv-queue-empty hidden">
        <div class="empty-icon">✅</div>
        <p>Queue is clear — walk right in!</p>
      </div>
    </div>

  </div>
</div>

<script>
  const BRANCH_ID = <?= intval($branchId) ?>;
  const SCROLL_AT  = 7; // rows before auto-scroll kicks in
  const SECS_PER_ROW = 3; // scroll speed: ~3 seconds per entry

  // ── Clock ──────────────────────────────────────────────────
  (function clock() {
    document.getElementById('tv-clock').textContent =
      new Date().toLocaleTimeString('en-MY', { hour:'2-digit', minute:'2-digit', second:'2-digit' });
    setTimeout(clock, 1000);
  })();

  // ── Helpers ────────────────────────────────────────────────
  function today() { return new Date().toISOString().split('T')[0]; }
  function esc(s) {
    return String(s ?? '')
      .replace(/&/g,'&amp;').replace(/</g,'&lt;')
      .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  // ── Render ─────────────────────────────────────────────────
  function render(entries) {
    const waiting = entries.filter(e => e.status === 'waiting');
    const serving = entries.filter(e => e.status === 'serving');

    // Count
    document.getElementById('tv-count').textContent = waiting.length;
    document.getElementById('tv-count-lbl').textContent = waiting.length === 1 ? 'waiting' : 'waiting';

    // Now Serving
    const slot = document.getElementById('tv-serving-slot');
    if (serving.length) {
      const s = serving[0];
      slot.innerHTML = `
        <div class="tv-serving-card">
          <div class="tv-serving-tag">
            <span>✂️</span> In Chair
          </div>
          <div class="tv-serving-name">${esc(s.name)}</div>
          ${s.party_size > 1
            ? `<div class="tv-serving-party">Group of ${esc(s.party_size)}</div>`
            : ''}
        </div>`;
    } else {
      slot.innerHTML = `
        <div class="tv-serving-empty">
          <div class="empty-icon">🪑</div>
          <p>No one being served</p>
        </div>`;
    }

    // Queue list
    const listEl  = document.getElementById('tv-queue-list');
    const emptyEl = document.getElementById('tv-queue-empty');

    if (!waiting.length) {
      listEl.innerHTML = '';
      listEl.className = 'tv-queue-list';
      listEl.style.animationDuration = '';
      emptyEl.classList.remove('hidden');
      return;
    }

    emptyEl.classList.add('hidden');

    const rowsHtml = waiting.map((e, i) => `
      <div class="tv-row">
        <div class="tv-row-pos">#${i + 1}</div>
        <div class="tv-row-info">
          <div class="tv-row-name">${esc(e.name)}</div>
          ${e.party_size > 1 ? `<div class="tv-row-sub">Group of ${esc(e.party_size)}</div>` : ''}
        </div>
        <span class="tv-row-badge">Waiting</span>
      </div>`).join('');

    if (waiting.length > SCROLL_AT) {
      // Duplicate for seamless loop
      listEl.innerHTML = rowsHtml + rowsHtml;
      const dur = waiting.length * SECS_PER_ROW;
      listEl.className = 'tv-queue-list scrolling';
      listEl.style.animationDuration = dur + 's';
    } else {
      listEl.innerHTML = rowsHtml;
      listEl.className = 'tv-queue-list';
      listEl.style.animationDuration = '';
    }
  }

  // ── Poll ───────────────────────────────────────────────────
  async function poll() {
    try {
      const res  = await fetch(`api/queue.php?branch_id=${BRANCH_ID}&date=${today()}`);
      const data = await res.json();
      if (data.ok) render(data.entries);
    } catch {}
    setTimeout(poll, 5000);
  }

  poll();
</script>
</body>
</html>
