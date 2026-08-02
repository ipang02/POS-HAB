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
    const isServing  = entry.status === 'serving';
    const phone      = '****' + String(entry.phone).slice(-4);
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
