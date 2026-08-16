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
    _updateQueueNavBadge(waiting);
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
        <p class="text-xs text-white/60">${this._esc(phone)}</p>
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

// ── Shared nav badge helper ───────────────────────────────────
function _updateQueueNavBadge(waiting) {
  const badge = document.getElementById('nav-queue-badge');
  if (!badge) return;
  if (waiting > 0) {
    badge.textContent = waiting;
    badge.classList.remove('hidden');
  } else {
    badge.classList.add('hidden');
  }
}

// ── QueuePage: full-page walk-in queue management ─────────────
const QueuePage = {
  _pollTimer: null,

  init() {
    clearTimeout(this._pollTimer);
    this._fetch();
  },

  stop() { clearTimeout(this._pollTimer); },

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
    const waiting = entries.filter(e => e.status === 'waiting');
    const serving = entries.filter(e => e.status === 'serving');

    document.getElementById('qp-waiting-lbl').textContent = `${waiting.length} waiting`;
    document.getElementById('qp-serving-lbl').textContent = `${serving.length} serving`;
    _updateQueueNavBadge(waiting.length);

    const empty = document.getElementById('qp-empty');
    if (empty) empty.classList.toggle('hidden', entries.length > 0);

    const servingSection = document.getElementById('qp-serving-section');
    const servingList    = document.getElementById('qp-serving-list');
    if (servingSection) servingSection.classList.toggle('hidden', serving.length === 0);
    if (servingList)    servingList.innerHTML = serving.map(e => this._buildCard(e, null, true)).join('');

    const waitingList = document.getElementById('qp-waiting-list');
    if (waitingList) waitingList.innerHTML = waiting.map((e, i) => this._buildCard(e, i + 1, false)).join('');
  },

  _buildCard(entry, pos, isServing) {
    const phone    = '****' + String(entry.phone).slice(-4);
    const joinTime = entry.joined_at ? String(entry.joined_at).split(' ')[1]?.slice(0, 5) : '';
    const party    = entry.party_size > 1
      ? `<span class="text-xs font-semibold" style="color:rgba(201,168,76,.8)">+${entry.party_size - 1} pax</span>` : '';

    const posBadge = pos != null
      ? `<div class="w-11 h-11 rounded-xl flex items-center justify-center text-sm font-black flex-shrink-0" style="background:rgba(201,168,76,.15);color:rgba(255,255,255,.75)">#${pos}</div>`
      : `<div class="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style="background:rgba(201,168,76,.2)"><i class="fa-solid fa-scissors text-gold"></i></div>`;

    const serveBtn = !isServing
      ? `<button onclick="QueuePage.serve(${entry.id})" class="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold" style="background:rgba(201,168,76,.18);color:#C9A84C">
           <i class="fa-solid fa-scissors"></i> Serve
         </button>` : '';

    const doneBtn = isServing
      ? `<button onclick="QueuePage.done(${entry.id})" class="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold" style="background:rgba(74,222,128,.14);color:#4ade80">
           <i class="fa-solid fa-circle-check"></i> Done
         </button>` : '';

    const removeBtn = `<button onclick="QueuePage.remove(${entry.id}, '${this._esc(entry.name)}')" class="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0" style="background:rgba(248,113,113,.1);color:#f87171" title="Remove from queue">
         <i class="fa-solid fa-xmark"></i>
       </button>`;

    const borderStyle = isServing
      ? 'border:1px solid rgba(201,168,76,.4);background:rgba(201,168,76,.05)'
      : 'border:1px solid rgba(255,255,255,.06)';

    return `
      <div class="glass rounded-2xl px-5 py-4 flex items-center gap-4" style="${borderStyle}">
        ${posBadge}
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 flex-wrap mb-0.5">
            <span class="text-base font-bold text-white">${this._esc(entry.name)}</span>
            ${party}
            ${isServing ? '<span class="text-[10px] font-bold px-2 py-0.5 rounded-full" style="background:rgba(201,168,76,.2);color:#C9A84C">Serving</span>' : ''}
          </div>
          <div class="flex items-center gap-3 text-xs" style="color:rgba(255,255,255,.5)">
            <span><i class="fa-solid fa-phone mr-1" style="font-size:.6rem"></i>${this._esc(phone)}</span>
            ${joinTime ? `<span><i class="fa-regular fa-clock mr-1" style="font-size:.6rem"></i>Joined ${joinTime}</span>` : ''}
          </div>
        </div>
        <div class="flex items-center gap-2 flex-shrink-0">
          ${serveBtn}${doneBtn}${removeBtn}
        </div>
      </div>`;
  },

  async serve(id) {
    try {
      await fetch('api/queue.php', {
        method: 'PATCH',
        headers: API._h(),
        body: JSON.stringify({ id, status: 'serving' })
      });
      clearTimeout(this._pollTimer);
      this._fetch();
    } catch { showToast('Network error', 'error'); }
  },

  async done(id) {
    try {
      await fetch('api/queue.php', {
        method: 'PATCH',
        headers: API._h(),
        body: JSON.stringify({ id, status: 'done' })
      });
      clearTimeout(this._pollTimer);
      this._fetch();
    } catch { showToast('Network error', 'error'); }
  },

  remove(id, name) {
    showConfirm(
      'Remove from Queue',
      `Remove ${name} from the queue?`,
      () => this._doRemove(id),
      'Remove'
    );
  },

  async _doRemove(id) {
    try {
      const res  = await fetch(`api/queue.php?id=${id}`, {
        method: 'DELETE',
        headers: API._h()
      });
      const data = await res.json();
      if (data.ok) {
        showToast('Entry removed from queue', 'info');
        clearTimeout(this._pollTimer);
        this._fetch();
      } else {
        showToast('Failed to remove entry', 'error');
      }
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
    return String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }
};
