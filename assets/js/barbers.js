// ============================================================
// HAB Barbershop POS — Barbers Module (display + CRUD)
// ============================================================

// ── Available avatar colours ─────────────────────────────────
const BARBER_COLORS = [
  '#6366f1','#f59e0b','#22c55e','#ec4899',
  '#3b82f6','#14b8a6','#f97316','#8b5cf6',
  '#06b6d4','#84cc16','#ef4444','#a78bfa'
];

// ── Display Module ───────────────────────────────────────────
const Barbers = {
  init() {
    this.render();
    this.renderAssignments();
    const summary = document.getElementById('barbers-summary');
    if (summary) {
      const bBranchBarbers = branchBarbers();
      const active = bBranchBarbers.filter(b => b.status !== 'off').length;
      summary.textContent = `${bBranchBarbers.length} barbers · ${active} on duty · ${currentBranchName()}`;
    }
  },

  filter() { this.render(); },

  render() {
    const grid = document.getElementById('barbers-grid');
    if (!grid) return;
    const q       = (document.getElementById('barber-search')?.value || '').toLowerCase();
    const statusF = document.getElementById('barber-status-filter')?.value || 'all';

    const barbers = branchBarbers().filter(b =>
      (statusF === 'all' || b.status === statusF) &&
      (!q || b.name.toLowerCase().includes(q))
    );

    if (!barbers.length) {
      grid.innerHTML = `<div class="col-span-4 text-center py-16">
        <i class="fa-solid fa-magnifying-glass text-3xl text-white/14 mb-2 block"></i>
        <p class="text-sm text-white/30">No barbers found</p></div>`;
      return;
    }

    grid.innerHTML = barbers.map(b => this._barberCard(b)).join('');

    // update summary
    const summary = document.getElementById('barbers-summary');
    if (summary) {
      const bBranchBarbers = branchBarbers();
      const active = bBranchBarbers.filter(b => b.status !== 'off').length;
      summary.textContent = `${bBranchBarbers.length} barbers · ${active} on duty · ${currentBranchName()}`;
    }
  },

  _barberCard(b) {
    const todayTrx   = AppData.transactions.filter(t => t.date === today() && t.barberId == b.id);
    const revenue    = todayTrx.reduce((s, t) => s + t.total, 0);
    const commission = Math.round(revenue * b.commission / 100);
    const apptToday  = AppData.appointments.filter(a => a.date === today() && a.barberId == b.id);

    const statusColors = { available:'#22c55e', busy:'#f59e0b', off:'#9ca3af' };
    const statusBg     = { available:'rgba(34,197,94,.1)', busy:'rgba(245,158,11,.1)', off:'rgba(156,163,175,.1)' };
    const statusText   = { available:'Available', busy:'Busy', off:'Off Duty' };

    return `
      <div class="glass rounded-2xl p-5 hover:border-white/14 transition-all">
        <!-- Avatar + Status + Actions -->
        <div class="flex items-start justify-between mb-4">
          <div class="relative">
            <div class="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-lg select-none"
              style="background:linear-gradient(135deg,${b.color}55,${b.color}33);border:2px solid ${b.color}55">
              ${b.initials}
            </div>
            <span class="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white"
              style="background:${statusColors[b.status] || '#9ca3af'}"></span>
          </div>
          <div class="flex items-center gap-1.5">
            <!-- Status quick toggle -->
            <button onclick="Barbers.toggleStatus(${b.id})"
              class="text-xs px-2.5 py-1.5 rounded-xl font-semibold transition-colors"
              style="color:${statusColors[b.status]};background:${statusBg[b.status]}">
              ${statusText[b.status]}
            </button>
            <!-- Edit -->
            <button onclick="BarbersCRUD.openEditModal(${b.id})"
              class="w-7 h-7 rounded-lg btn-ghost flex items-center justify-center" title="Edit barber">
              <i class="fa-solid fa-pen text-[11px]"></i>
            </button>
            <!-- Delete -->
            <button onclick="BarbersCRUD.deleteBarber(${b.id})"
              class="w-7 h-7 rounded-lg btn-danger flex items-center justify-center" title="Delete barber">
              <i class="fa-solid fa-trash text-[11px]"></i>
            </button>
          </div>
        </div>

        <!-- Name & Details -->
        <h3 class="text-sm font-bold text-white mb-0.5">${b.name}</h3>
        <p class="text-xs text-white/35 mb-3">${b.phone || 'No phone set'}</p>
        <div class="flex flex-wrap gap-1 mb-4">
          ${(b.skills || []).map(sk => `<span class="text-[10px] px-2 py-0.5 rounded-full glass text-white/55 border border-white/8">${sk}</span>`).join('')}
          ${!(b.skills || []).length ? '<span class="text-[10px] text-white/25">No skills listed</span>' : ''}
        </div>

        <!-- Stats -->
        <div class="grid grid-cols-3 gap-2 border-t border-white/6 pt-4">
          <div class="text-center">
            <div class="text-base font-bold text-white">${apptToday.length}</div>
            <div class="text-[10px] text-white/35">Appts</div>
          </div>
          <div class="text-center border-x border-white/6">
            <div class="text-sm font-bold gold-text truncate">${formatRp(revenue).replace('RM ','')}</div>
            <div class="text-[10px] text-white/35">Revenue</div>
          </div>
          <div class="text-center">
            <div class="text-sm font-bold text-green-400 truncate">${formatRp(commission).replace('RM ','')}</div>
            <div class="text-[10px] text-white/35">Comm. ${b.commission}%</div>
          </div>
        </div>
      </div>`;
  },

  toggleStatus(id) {
    const b = AppData.barbers.find(x => x.id === id);
    if (!b) return;
    const cycle = { available:'busy', busy:'off', off:'available' };
    b.status = cycle[b.status] || 'available';
    AppData.save('barbers');
    this.render();
    this.renderAssignments();
    showToast(`${b.name} → ${statusLabel(b.status)}`, 'info');
  },

  renderAssignments() {
    const tbody = document.getElementById('barbers-assignments');
    if (!tbody) return;
    tbody.innerHTML = branchBarbers().map(b => {
      const appts = AppData.appointments.filter(a => a.date === today() && a.barberId == b.id);
      const trx   = AppData.transactions.filter(t => t.date === today() && t.barberId == b.id);
      const rev   = trx.reduce((s, t) => s + t.total, 0);
      const comm  = Math.round(rev * b.commission / 100);
      return `
        <tr class="hover:bg-white/2 transition-colors">
          <td class="py-2.5 pr-4">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white"
                style="background:${b.color}33;border:1px solid ${b.color}44">${b.initials}</div>
              <span class="text-sm font-semibold text-white">${b.name}</span>
            </div>
          </td>
          <td class="py-2.5 pr-4 hidden sm:table-cell">
            <span class="badge badge-${b.status}">${statusLabel(b.status)}</span>
          </td>
          <td class="py-2.5 pr-4 text-sm text-white">${appts.length} <span class="text-white/35">appts</span></td>
          <td class="py-2.5 pr-4 hidden md:table-cell text-sm text-white/60">${b.commission}%</td>
          <td class="py-2.5 text-right">
            <div class="text-sm font-semibold text-white">${formatRp(rev)}</div>
            <div class="text-xs text-gold">${formatRp(comm)} earned</div>
          </td>
        </tr>`;
    }).join('');
  }
};

// ── CRUD Module ──────────────────────────────────────────────
const BarbersCRUD = {
  _skills: [],   // temp skills array while modal is open
  _color:  BARBER_COLORS[0],

  // ── Add Modal ──────────────────────────────────────────────
  openAddModal() {
    this._skills = [];
    this._color  = BARBER_COLORS[0];
    document.getElementById('barber-edit-id').value    = '';
    document.getElementById('barber-modal-title').textContent = 'Add Barber';
    document.getElementById('barber-modal-sub').textContent   = 'New barber will appear across the system immediately';
    document.getElementById('barber-name').value       = '';
    document.getElementById('barber-phone').value      = '';
    document.getElementById('barber-commission').value = '30';
    document.getElementById('barber-status').value     = 'available';
    document.getElementById('barber-skill-input').value = '';
    this._renderSkillTags();
    this._renderColorSwatches();
    this._setAvatarPreview('', this._color);
    document.getElementById('barber-name-preview').textContent = 'Barber Name';
    openModal('modal-barber');
  },

  // ── Edit Modal ─────────────────────────────────────────────
  openEditModal(id) {
    const b = AppData.barbers.find(x => x.id === id);
    if (!b) return;
    this._skills = [...(b.skills || [])];
    this._color  = b.color || BARBER_COLORS[0];
    document.getElementById('barber-edit-id').value    = id;
    document.getElementById('barber-modal-title').textContent = 'Edit Barber';
    document.getElementById('barber-modal-sub').textContent   = 'Changes apply immediately across the system';
    document.getElementById('barber-name').value       = b.name;
    document.getElementById('barber-phone').value      = b.phone || '';
    document.getElementById('barber-commission').value = b.commission;
    document.getElementById('barber-status').value     = b.status;
    document.getElementById('barber-skill-input').value = '';
    this._renderSkillTags();
    this._renderColorSwatches();
    this._setAvatarPreview(b.name, this._color);
    document.getElementById('barber-name-preview').textContent = b.name;
    openModal('modal-barber');
  },

  // ── Live preview while typing name ─────────────────────────
  updatePreview() {
    const name = document.getElementById('barber-name').value.trim();
    const initials = this._generateInitials(name);
    this._setAvatarPreview(name, this._color);
    const nameEl = document.getElementById('barber-name-preview');
    if (nameEl) nameEl.textContent = name || 'Barber Name';
  },

  _generateInitials(name) {
    if (!name) return '??';
    const parts = name.trim().split(/\s+/);
    return parts.length >= 2
      ? (parts[0][0] + parts[1][0]).toUpperCase()
      : name.slice(0, 2).toUpperCase();
  },

  _setAvatarPreview(name, color) {
    const el = document.getElementById('barber-avatar-preview');
    if (!el) return;
    el.textContent   = this._generateInitials(name);
    el.style.background = `linear-gradient(135deg,${color}88,${color}55)`;
    el.style.border  = `2px solid ${color}77`;
  },

  // ── Color Swatches ─────────────────────────────────────────
  _renderColorSwatches() {
    const wrap = document.getElementById('barber-color-swatches');
    if (!wrap) return;
    wrap.innerHTML = BARBER_COLORS.map(c => `
      <button type="button" onclick="BarbersCRUD._selectColor('${c}')"
        class="w-5 h-5 rounded-full transition-all border-2 ${c === this._color ? 'border-white scale-125' : 'border-transparent hover:scale-110'}"
        style="background:${c}" title="${c}"></button>`).join('');
  },

  _selectColor(color) {
    this._color = color;
    this._renderColorSwatches();
    this._setAvatarPreview(document.getElementById('barber-name')?.value || '', color);
  },

  // ── Skill Tag Input ─────────────────────────────────────────
  handleSkillKey(e) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const val = e.target.value.replace(',','').trim();
      if (val && !this._skills.includes(val)) {
        this._skills.push(val);
        this._renderSkillTags();
      }
      e.target.value = '';
    } else if (e.key === 'Backspace' && !e.target.value && this._skills.length) {
      this._skills.pop();
      this._renderSkillTags();
    }
  },

  _renderSkillTags() {
    const wrap = document.getElementById('barber-skill-tags');
    if (!wrap) return;
    wrap.innerHTML = this._skills.map((sk, i) => `
      <span class="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full glass text-white/70 border border-white/12">
        ${sk}
        <button type="button" onclick="BarbersCRUD._removeSkill(${i})"
          class="text-white/30 hover:text-red-400 transition-colors ml-0.5 leading-none">&times;</button>
      </span>`).join('');
  },

  _removeSkill(i) {
    this._skills.splice(i, 1);
    this._renderSkillTags();
  },

  // ── Save ────────────────────────────────────────────────────
  save() {
    const name       = document.getElementById('barber-name').value.trim();
    const phone      = document.getElementById('barber-phone').value.trim();
    const commission = parseInt(document.getElementById('barber-commission').value) || 30;
    const status     = document.getElementById('barber-status').value;

    if (!name) { showToast('Barber name is required', 'error'); return; }
    if (commission < 0 || commission > 100) { showToast('Commission must be between 0–100%', 'error'); return; }

    const initials = this._generateInitials(name);
    const editId   = parseInt(document.getElementById('barber-edit-id').value);

    if (editId) {
      const idx = AppData.barbers.findIndex(b => b.id === editId);
      if (idx > -1) {
        AppData.barbers[idx] = {
          ...AppData.barbers[idx],
          name, phone, commission, status,
          initials, color: this._color,
          skills: [...this._skills]
        };
        showToast(`"${name}" updated successfully`, 'success');
      }
    } else {
      AppData.barbers.push({
        id:         nextNumId(AppData.barbers),
        name, phone, commission, status,
        initials,   color: this._color,
        skills:     [...this._skills],
        branchId:   App.currentBranch || 1
      });
      showToast(`"${name}" added to the team!`, 'success');
    }

    AppData.save('barbers');
    closeModal('modal-barber');
    Barbers.render();
    Barbers.renderAssignments();
    // Refresh POS barber selector if open
    if (typeof POS !== 'undefined' && Router.current === 'pos') POS.renderBarberSelect();
  },

  // ── Delete ──────────────────────────────────────────────────
  deleteBarber(id) {
    const b = AppData.barbers.find(x => x.id === id);
    if (!b) return;
    showConfirm(
      'Remove Barber',
      `"${b.name}" will be removed from the system. Past transactions and appointments linked to them are kept.`,
      () => {
        AppData.barbers = AppData.barbers.filter(x => x.id !== id);
        AppData.save('barbers');
        Barbers.render();
        Barbers.renderAssignments();
        if (typeof POS !== 'undefined' && Router.current === 'pos') POS.renderBarberSelect();
        showToast(`"${b.name}" removed from the team`, 'warning');
      },
      'Remove'
    );
  }
};
