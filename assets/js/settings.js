// ============================================================
// HAB Barbershop POS — Settings Module
// Global settings + BranchConfig CRUD
// ============================================================

const Settings = {
  load() {
    const s = AppData.settings;

    // Global fields
    this._set('set-tax',            s.taxRate);
    this._set('set-currency',       s.currency);
    this._set('set-low-stock',      s.lowStockThreshold);
    this._set('set-receipt-footer', s.receiptFooter);

    this._setCheck('set-receipt-qr',  s.receiptShowQr  !== false);
    this._setCheck('set-receipt-tax', s.receiptShowTax !== false);
    this._setCheck('set-dark-mode',   s.theme !== 'light');
    this._setCheck('notif-booking',   s.notifications?.booking !== false);
    this._setCheck('notif-stock',     s.notifications?.stock   !== false);
    this._setCheck('notif-payment',   s.notifications?.payment !== false);
    this._setCheck('notif-daily',     s.notifications?.daily   === true);

    // Render branch cards
    BranchConfig.renderCards();
  },

  _set(id, val)      { const el = document.getElementById(id); if (el) el.value = val ?? ''; },
  _setCheck(id, val) { const el = document.getElementById(id); if (el) el.checked = !!val; },

  save() {
    const taxRate = parseFloat(document.getElementById('set-tax')?.value) || 6;

    Object.assign(AppData.settings, {
      taxRate,
      currency:          document.getElementById('set-currency')?.value?.trim()       || 'RM',
      lowStockThreshold: parseInt(document.getElementById('set-low-stock')?.value)    || 5,
      receiptFooter:     document.getElementById('set-receipt-footer')?.value?.trim() || '',
      receiptShowQr:     document.getElementById('set-receipt-qr')?.checked,
      receiptShowTax:    document.getElementById('set-receipt-tax')?.checked,
      notifications: {
        booking: document.getElementById('notif-booking')?.checked,
        stock:   document.getElementById('notif-stock')?.checked,
        payment: document.getElementById('notif-payment')?.checked,
        daily:   document.getElementById('notif-daily')?.checked,
      }
    });

    AppData.save('settings');

    const taxEl = document.getElementById('pos-tax-pct');
    if (taxEl) taxEl.textContent = taxRate;

    showToast('Global settings saved!', 'success');
  },

  toggleTheme(checkbox) {
    AppData.settings.theme = checkbox.checked ? 'dark' : 'light';
    AppData.save('settings');
    showToast(checkbox.checked ? 'Dark mode active' : 'Light mode (reload to fully apply)', 'info');
  }
};

// ============================================================
// BranchConfig — Full CRUD for branches
// ============================================================
const BranchConfig = {
  _days: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
  _dayLabels: { Mon:'Monday', Tue:'Tuesday', Wed:'Wednesday', Thu:'Thursday', Fri:'Friday', Sat:'Saturday', Sun:'Sunday' },

  // ── Render branch cards in settings ─────────────────────────
  renderCards() {
    const grid = document.getElementById('branch-cards-grid');
    const lbl  = document.getElementById('branch-count-lbl');
    if (!grid) return;

    const branches = AppData.branches || [];
    if (lbl) lbl.textContent = `${branches.length} branch${branches.length !== 1 ? 'es' : ''} configured`;

    grid.innerHTML = branches.map(b => {
      const bs       = AppData.settings.branchSettings?.find(s => s.branchId === b.id) || {};
      const barbers  = AppData.barbers.filter(x => x.branchId === b.id).length;
      const isCurrent = App.currentBranch === b.id;
      return `
        <div class="glass rounded-2xl p-5 transition-all ${isCurrent ? 'border-gold/30' : ''}">
          <div class="flex items-start justify-between mb-4">
            <div class="flex items-center gap-3">
              <div class="w-11 h-11 rounded-xl flex items-center justify-center font-bold text-white text-sm select-none"
                style="background:#374151">${(b.shortName || b.name.slice(0,2)).toUpperCase()}</div>
              <div>
                <div class="flex items-center gap-2">
                  <p class="text-sm font-bold text-white">${b.name}</p>
                  ${isCurrent ? '<span class="badge badge-gold text-[10px]">Active</span>' : ''}
                </div>
                <p class="text-xs text-white/35 mt-0.5 truncate" style="max-width:160px">${b.address || 'No address set'}</p>
              </div>
            </div>
            <div class="flex gap-1.5 flex-shrink-0">
              <button onclick="BranchConfig.openEditModal(${b.id})"
                class="btn-outline w-8 h-8 flex items-center justify-center rounded-lg" title="Edit branch">
                <i class="fa-solid fa-pen text-xs"></i>
              </button>
              <button onclick="BranchConfig.deleteBranch(${b.id})"
                class="btn-danger w-8 h-8 flex items-center justify-center rounded-lg ${branches.length <= 1 ? 'opacity-30 cursor-not-allowed' : ''}"
                title="${branches.length <= 1 ? 'Cannot delete last branch' : 'Delete branch'}"
                ${branches.length <= 1 ? 'disabled' : ''}>
                <i class="fa-solid fa-trash text-xs"></i>
              </button>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-2 text-xs border-t border-white/6 pt-3">
            <div><span class="text-white/35">Phone</span><p class="text-white font-medium mt-0.5">${bs.phone || b.phone || '—'}</p></div>
            <div><span class="text-white/35">Barbers</span><p class="text-white font-medium mt-0.5">${barbers} assigned</p></div>
          </div>
          <button onclick="App.setBranch(${b.id}); navigate('dashboard');"
            class="mt-3 w-full btn-outline text-xs py-2 rounded-xl font-semibold">
            Switch to this branch
          </button>
        </div>`;
    }).join('');
  },

  // ── Add Modal ────────────────────────────────────────────────
  openAddModal() {
    document.getElementById('branch-edit-id').value   = '';
    document.getElementById('branch-modal-title').textContent = 'Add Branch';
    document.getElementById('branch-modal-sub').textContent   = 'New branch appears in the switcher immediately';
    document.getElementById('branch-name').value      = '';
    document.getElementById('branch-short').value     = '';
    document.getElementById('branch-phone').value     = '';
    document.getElementById('branch-email').value     = '';
    document.getElementById('branch-address').value   = '';
    document.getElementById('branch-instagram').value = '';
    this._updatePreviewEl('', '', '');
    this._renderHoursGrid(null);
    openModal('modal-branch');
  },

  // ── Edit Modal ───────────────────────────────────────────────
  openEditModal(id) {
    const b  = AppData.branches.find(x => x.id === id);
    const bs = AppData.settings.branchSettings?.find(s => s.branchId === id) || {};
    if (!b) return;

    document.getElementById('branch-edit-id').value   = id;
    document.getElementById('branch-modal-title').textContent = `Edit — ${b.name}`;
    document.getElementById('branch-modal-sub').textContent   = 'Changes apply across the whole system';
    document.getElementById('branch-name').value      = b.name      || '';
    document.getElementById('branch-short').value     = b.shortName || '';
    document.getElementById('branch-phone').value     = bs.phone    || b.phone    || '';
    document.getElementById('branch-email').value     = bs.email    || b.email    || '';
    document.getElementById('branch-address').value   = b.address   || bs.address || '';
    document.getElementById('branch-instagram').value = bs.instagram || '';
    this._updatePreviewEl(b.name, b.shortName, b.address);
    this._renderHoursGrid(bs.hours || null);
    openModal('modal-branch');
  },

  // ── Live preview ─────────────────────────────────────────────
  updatePreview() {
    const name  = document.getElementById('branch-name')?.value    || '';
    const short = document.getElementById('branch-short')?.value   || '';
    const addr  = document.getElementById('branch-address')?.value || '';
    this._updatePreviewEl(name, short, addr);
  },

  _updatePreviewEl(name, short, addr) {
    const avatar = document.getElementById('branch-avatar-preview');
    const namEl  = document.getElementById('branch-name-preview');
    const adrEl  = document.getElementById('branch-addr-preview');
    const initials = short ? short.toUpperCase() : (name.trim() ? name.trim().slice(0,2).toUpperCase() : '??');
    if (avatar) avatar.textContent = initials;
    if (namEl)  namEl.textContent  = name  || 'Branch Name';
    if (adrEl)  adrEl.textContent  = addr  || 'Address will appear here';
  },

  // ── Hours grid in modal ───────────────────────────────────────
  _renderHoursGrid(hours) {
    const grid = document.getElementById('branch-hours-grid');
    if (!grid) return;
    const defaultH = { open:'09:00', close:'21:00', active:true };
    grid.innerHTML = this._days.map(d => {
      const h = hours?.[d] || defaultH;
      return `
        <div class="flex items-center gap-2.5">
          <label class="tog flex-shrink-0">
            <input type="checkbox" id="bh-${d}-active" ${h.active ? 'checked' : ''}>
            <span class="tog-slider"></span>
          </label>
          <span class="text-xs text-white font-medium w-14 flex-shrink-0">${this._dayLabels[d].slice(0,3)}</span>
          <input type="time" id="bh-${d}-open"  value="${h.open}"  class="inp py-1.5 text-xs" style="width:90px">
          <span class="text-white/25 text-xs">—</span>
          <input type="time" id="bh-${d}-close" value="${h.close}" class="inp py-1.5 text-xs" style="width:90px">
        </div>`;
    }).join('');
  },

  _readHours() {
    const hours = {};
    this._days.forEach(d => {
      hours[d] = {
        active: document.getElementById(`bh-${d}-active`)?.checked || false,
        open:   document.getElementById(`bh-${d}-open`)?.value    || '09:00',
        close:  document.getElementById(`bh-${d}-close`)?.value   || '21:00',
      };
    });
    return hours;
  },

  // ── Save (add or edit) ───────────────────────────────────────
  save() {
    const name  = document.getElementById('branch-name')?.value.trim();
    const short = document.getElementById('branch-short')?.value.trim().toUpperCase() || name?.slice(0,2).toUpperCase();
    const phone = document.getElementById('branch-phone')?.value.trim();
    const email = document.getElementById('branch-email')?.value.trim();
    const address   = document.getElementById('branch-address')?.value.trim();
    const instagram = document.getElementById('branch-instagram')?.value.trim();
    const hours = this._readHours();

    if (!name) { showToast('Branch name is required', 'error'); return; }

    const editId = parseInt(document.getElementById('branch-edit-id').value);

    if (editId) {
      // Update branch list
      const bIdx = AppData.branches.findIndex(b => b.id === editId);
      if (bIdx > -1) AppData.branches[bIdx] = { ...AppData.branches[bIdx], name, shortName: short, address };
      AppData.save('branches');

      // Update branchSettings
      const bsArr = AppData.settings.branchSettings || [];
      const sIdx  = bsArr.findIndex(s => s.branchId === editId);
      const patch = { branchId: editId, shopName: `HAB Barbershop — ${name}`, phone, email, address, instagram, hours };
      if (sIdx > -1) { bsArr[sIdx] = { ...bsArr[sIdx], ...patch }; }
      else           { bsArr.push(patch); }
      AppData.settings.branchSettings = bsArr;
      AppData.save('settings');

      showToast(`"${name}" updated`, 'success');
    } else {
      // Add new branch
      const newId = nextNumId(AppData.branches);
      AppData.branches.push({ id: newId, name, shortName: short, address });
      AppData.save('branches');

      const bsArr = AppData.settings.branchSettings || [];
      bsArr.push({ branchId: newId, shopName: `HAB Barbershop — ${name}`, phone, email, address, instagram, hours });
      AppData.settings.branchSettings = bsArr;
      AppData.save('settings');

      showToast(`"${name}" branch added!`, 'success');
    }

    // Refresh UI
    closeModal('modal-branch');
    this.renderCards();
    _renderBranchDropdown();
    _updateBranchLabel();
  },

  // ── Delete ───────────────────────────────────────────────────
  deleteBranch(id) {
    if ((AppData.branches || []).length <= 1) {
      showToast('Cannot delete the last branch', 'error');
      return;
    }
    const b = AppData.branches.find(x => x.id === id);
    if (!b) return;
    showConfirm(
      'Delete Branch',
      `"${b.name}" will be removed. Barbers, appointments, and inventory linked to this branch will still exist but won't be assigned to any branch.`,
      () => {
        AppData.branches = AppData.branches.filter(x => x.id !== id);
        AppData.save('branches');

        if (AppData.settings.branchSettings) {
          AppData.settings.branchSettings = AppData.settings.branchSettings.filter(s => s.branchId !== id);
          AppData.save('settings');
        }

        // Switch away if deleted branch was current
        if (App.currentBranch === id) {
          App.setBranch(AppData.branches[0]?.id || 1);
        }

        this.renderCards();
        _renderBranchDropdown();
        showToast(`"${b.name}" deleted`, 'warning');
      },
      'Delete Branch'
    );
  }
};
