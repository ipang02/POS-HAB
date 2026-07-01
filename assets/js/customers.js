// ============================================================
// HAB Barbershop POS — Customers Module
// ============================================================

const CUSTOMER_COLORS = [
  '#6366f1','#f59e0b','#22c55e','#ec4899',
  '#3b82f6','#14b8a6','#f97316','#8b5cf6',
  '#06b6d4','#84cc16','#ef4444','#a78bfa'
];

function escHtml(s) {
  return String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

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
    if (duplicate) { showToast(`Phone already registered to "${escHtml(duplicate.name)}"`, 'error'); return; }

    if (editId) {
      const idx = AppData.customers.findIndex(c => c.id === editId);
      if (idx === -1) { showToast('Customer not found', 'error'); return; }
      AppData.customers[idx] = { ...AppData.customers[idx], name, phone, notes };
      showToast(`"${escHtml(name)}" updated`, 'success');
    } else {
      AppData.customers.push({
        id: nextNumId(AppData.customers), name, phone, notes, points: 0, createdAt: today()
      });
      showToast(`"${escHtml(name)}" added!`, 'success');
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
        showToast(`"${escHtml(c.name)}" removed`, 'warning');
      },
      'Remove'
    );
  },

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
            ${escHtml(initials)}
          </div>
          <span class="text-[11px] font-semibold px-2.5 py-1 rounded-full ${tierCls}">${tierLabel}</span>
        </div>
        <h3 class="text-sm font-bold text-white mb-0.5">${escHtml(c.name)}</h3>
        <p class="text-xs text-white/40 mb-4">${escHtml(c.phone)}</p>
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
          <span class="text-xs font-semibold text-gold">${escHtml(c.points)} pts</span>
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
                  <p class="text-xs font-semibold text-white truncate">${escHtml(names) || 'Transaction'}</p>
                  <p class="text-[10px] text-white/35">${escHtml(formatDate(h.date))} · ${escHtml(methodLabel(h.method))}</p>
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
                <p class="text-xs font-semibold text-white truncate">${escHtml(svc?.name) || 'Appointment'}</p>
                <p class="text-[10px] text-white/35">${escHtml(formatDate(h.date))} ${escHtml(h.time)}</p>
              </div>
            </div>
            <span class="text-[10px] font-semibold px-2 py-0.5 rounded-full
              ${h.status==='completed'?'text-green-400 bg-green-400/10':h.status==='confirmed'?'text-blue-400 bg-blue-400/10':'text-amber-400 bg-amber-400/10'}">
              ${escHtml(statusLabel(h.status))}
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
