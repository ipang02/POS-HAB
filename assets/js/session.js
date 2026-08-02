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

    const methods = { cash: 0, card: 0, qr: 0 };
    trx.forEach(t => { if (methods[t.method] != null) methods[t.method] += t.total; });

    const barberMap = {};
    trx.forEach(t => {
      const key = t.barberId || 0;
      if (!barberMap[key]) {
        barberMap[key] = { name: getBarberById(key)?.name || 'Unknown / Walk-in', total: 0, count: 0 };
      }
      barberMap[key].total += t.total;
      barberMap[key].count++;
    });

    const cashSales    = methods.cash;
    const expectedCash = App.session.openFloat + cashSales;
    const variance     = closeFloat - expectedCash;
    const varColor     = variance >= 0 ? '#4ade80' : '#f87171';
    const varSign      = variance >= 0 ? '+' : '';

    const methodRows = Object.entries({ cash:'Cash', card:'Card / EDC', qr:'QR Pay' })
      .map(([k, lbl]) => `
        <div class="flex justify-between text-xs py-1">
          <span class="text-white/45">${lbl}</span>
          <span class="font-semibold text-white">${formatRp(methods[k])}</span>
        </div>`).join('');

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
        <div class="glass rounded-xl p-4 mb-3">
          <h4 class="text-[10px] font-semibold text-white/40 uppercase tracking-wide mb-2">Payment Breakdown</h4>
          ${methodRows}
        </div>
        <div class="glass rounded-xl p-4 mb-3">
          <h4 class="text-[10px] font-semibold text-white/40 uppercase tracking-wide mb-2">Barber Performance</h4>
          ${barberRows}
        </div>
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
