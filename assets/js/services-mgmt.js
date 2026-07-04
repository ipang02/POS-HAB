// ============================================================
// HAB Barbershop POS — Service Management Module
// ============================================================

const ServicesMgmt = {
  searchQ:    '',
  catFilter:  'all',
  statusFilter: 'all',

  init() {
    this.filter();
    this._renderSummary();
  },

  filter() {
    this.searchQ    = (document.getElementById('svc-mgmt-search')?.value || '').toLowerCase();
    this.catFilter  = document.getElementById('svc-mgmt-cat-filter')?.value || 'all';
    this.render();
  },

  filterStatus(btn) {
    document.querySelectorAll('[data-svc-status]').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    this.statusFilter = btn.dataset.svcStatus;
    this.render();
  },

  render() {
    const grid  = document.getElementById('svc-mgmt-grid');
    const empty = document.getElementById('svc-mgmt-empty');
    if (!grid) return;

    const services = branchServices().filter(s => {
      const matchQ   = !this.searchQ || s.name.toLowerCase().includes(this.searchQ) || (s.desc || '').toLowerCase().includes(this.searchQ);
      const matchCat = this.catFilter === 'all' || s.cat === this.catFilter;
      const isActive = s.is_active !== false;
      const matchStatus = this.statusFilter === 'all' ||
        (this.statusFilter === 'active' && isActive) ||
        (this.statusFilter === 'inactive' && !isActive);
      return matchQ && matchCat && matchStatus;
    });

    grid.classList.toggle('hidden', services.length === 0);
    empty.classList.toggle('hidden', services.length > 0);

    grid.innerHTML = services.map(s => this._card(s)).join('');
  },

  _card(s) {
    const isActive = s.is_active !== false;
    const catColors = { hair:'text-blue-400 bg-blue-400/10', beard:'text-amber-400 bg-amber-400/10', treatment:'text-purple-400 bg-purple-400/10', package:'text-gold bg-gold/10' };
    const catCls = catColors[s.cat] || catColors.hair;

    return `
      <div class="glass rounded-2xl p-5 hover:border-white/14 transition-all ${!isActive ? 'opacity-60' : ''}">
        <!-- Icon + Status -->
        <div class="flex items-start justify-between mb-3">
          <div class="w-12 h-12 rounded-xl ${isActive ? 'glass-gold' : 'glass'} flex items-center justify-center">
            <i class="fa-solid ${s.icon || 'fa-scissors'} ${isActive ? 'text-gold' : 'text-white/30'} text-lg"></i>
          </div>
          <div class="flex items-center gap-2">
            <!-- Active toggle -->
            <label class="tog" title="${isActive ? 'Click to hide from POS' : 'Click to show in POS'}">
              <input type="checkbox" ${isActive ? 'checked' : ''} onchange="ServicesMgmt.toggleActive(${s.id}, this.checked)">
              <span class="tog-slider"></span>
            </label>
          </div>
        </div>

        <!-- Name & Category -->
        <h4 class="text-sm font-bold text-white mb-0.5 leading-tight">${s.name}</h4>
        <p class="text-[10px] text-white/35 mb-2">${s.desc || '—'}</p>
        <span class="text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${catCls}">${s.cat}</span>

        <!-- Stats -->
        <div class="grid grid-cols-3 gap-2 border-t border-white/6 mt-3 pt-3">
          <div class="text-center">
            <div class="text-sm font-bold gold-text">${s.tierPrices ? 'Tiered' : formatRp(s.price)}</div>
            <div class="text-[9px] text-white/30 uppercase tracking-wide">${s.tierPrices ? 'Junior–Master' : 'Price'}</div>
          </div>
          <div class="text-center border-x border-white/6">
            <div class="text-sm font-bold text-white">${s.duration}</div>
            <div class="text-[9px] text-white/30 uppercase tracking-wide">Min</div>
          </div>
          <div class="text-center">
            <div class="text-sm font-bold ${isActive ? 'text-green-400' : 'text-white/30'}">${isActive ? 'ON' : 'OFF'}</div>
            <div class="text-[9px] text-white/30 uppercase tracking-wide">POS</div>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex gap-2 mt-4">
          <button onclick="ServicesMgmt.openEditModal(${s.id})"
            class="btn-outline flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5">
            <i class="fa-solid fa-pen text-[10px]"></i> Edit
          </button>
          <button onclick="ServicesMgmt.quickEditPrice(${s.id})"
            class="btn-gold py-1.5 px-3 rounded-lg text-xs font-bold flex items-center gap-1" title="Quick price edit">
            <i class="fa-solid fa-tag text-[10px]"></i> Price
          </button>
          <button onclick="ServicesMgmt.deleteService(${s.id})"
            class="btn-danger w-8 py-1.5 rounded-lg flex items-center justify-center text-xs">
            <i class="fa-solid fa-trash text-[10px]"></i>
          </button>
        </div>
      </div>`;
  },

  _renderSummary() {
    const el = document.getElementById('svc-mgmt-summary');
    if (!el) return;
    const bs     = branchServices();
    const total  = bs.length;
    const active = bs.filter(s => s.is_active !== false).length;
    el.textContent = `${total} services · ${active} visible in POS · ${total - active} hidden`;
  },

  // ── Quick Price Edit ─────────────────────────────────────────
  quickEditPrice(id) {
    const s = AppData.services.find(x => x.id === id);
    if (!s) return;
    const newPrice = parseFloat(prompt(`Quick edit price for "${s.name}"\nCurrent price: ${formatRp(s.price)}\n\nNew price (RM):`));
    if (isNaN(newPrice) || newPrice < 0) return;
    s.price = newPrice;
    AppData.save('services');
    this.render();
    this._renderSummary();
    showToast(`${s.name} price updated to ${formatRp(newPrice)}`, 'success');
  },

  // ── Add Modal ────────────────────────────────────────────────
  openAddModal() {
    document.getElementById('svc-edit-id').value  = '';
    document.getElementById('svc-modal-title').textContent = 'Add Service';
    document.getElementById('svc-modal-sub').textContent   = 'New service will appear in POS immediately';
    document.getElementById('svc-name').value     = '';
    document.getElementById('svc-price').value    = '';
    document.getElementById('svc-duration').value = '30';
    document.getElementById('svc-cat').value      = 'hair';
    document.getElementById('svc-icon').value     = 'fa-scissors';
    document.getElementById('svc-desc').value     = '';
    document.getElementById('svc-active').checked = true;
    document.getElementById('svc-booking-price').value = '';
    document.getElementById('svc-tier-enabled').checked = false;
    document.getElementById('svc-tier-prices').classList.add('hidden');
    document.getElementById('svc-tier-junior').value = '';
    document.getElementById('svc-tier-senior').value = '';
    document.getElementById('svc-tier-master').value = '';
    this.previewIcon('fa-scissors');
    this._bindPreview();
    openModal('modal-service');
  },

  // ── Edit Modal ───────────────────────────────────────────────
  openEditModal(id) {
    const s = AppData.services.find(x => x.id === id);
    if (!s) return;
    document.getElementById('svc-edit-id').value  = id;
    document.getElementById('svc-modal-title').textContent = 'Edit Service';
    document.getElementById('svc-modal-sub').textContent   = 'Changes apply instantly across the system';
    document.getElementById('svc-name').value     = s.name;
    document.getElementById('svc-price').value    = s.price;
    document.getElementById('svc-duration').value = s.duration;
    document.getElementById('svc-cat').value      = s.cat;
    document.getElementById('svc-icon').value     = s.icon || 'fa-scissors';
    document.getElementById('svc-desc').value     = s.desc || '';
    document.getElementById('svc-active').checked = s.is_active !== false;
    const hasTier = s.tierPrices != null;
    document.getElementById('svc-tier-enabled').checked = hasTier;
    document.getElementById('svc-tier-prices').classList.toggle('hidden', !hasTier);
    document.getElementById('svc-tier-junior').value = s.tierPrices?.junior ?? '';
    document.getElementById('svc-tier-senior').value = s.tierPrices?.senior ?? '';
    document.getElementById('svc-tier-master').value = s.tierPrices?.master ?? '';
    this.previewIcon(s.icon || 'fa-scissors');
    this._bindPreview();
    openModal('modal-service');
  },

  // Live preview while editing
  _bindPreview() {
    const nameEl  = document.getElementById('svc-name');
    const priceEl = document.getElementById('svc-price');
    if (nameEl)  nameEl.oninput  = () => { const el = document.getElementById('svc-name-preview'); if (el) el.textContent = nameEl.value || 'Service Name'; };
    if (priceEl) priceEl.oninput = () => { const el = document.getElementById('svc-price-preview'); if (el) el.textContent = formatRp(parseFloat(priceEl.value) || 0); };
    // set initial preview values
    const namePreview  = document.getElementById('svc-name-preview');
    const pricePreview = document.getElementById('svc-price-preview');
    if (namePreview)  namePreview.textContent  = nameEl?.value  || 'Service Name';
    if (pricePreview) pricePreview.textContent = formatRp(parseFloat(priceEl?.value) || 0);
  },

  previewIcon(icon) {
    const el = document.getElementById('svc-icon-preview');
    if (!el) return;
    el.className = `fa-solid ${icon} text-gold text-lg`;
  },

  toggleTierPricing(enabled) {
    const wrap = document.getElementById('svc-tier-prices');
    if (wrap) wrap.classList.toggle('hidden', !enabled);
  },

  // ── Save ─────────────────────────────────────────────────────
  save() {
    const name     = document.getElementById('svc-name').value.trim();
    const price    = parseFloat(document.getElementById('svc-price').value);
    const duration = parseInt(document.getElementById('svc-duration').value);
    const cat      = document.getElementById('svc-cat').value;
    const icon     = document.getElementById('svc-icon').value;
    const desc     = document.getElementById('svc-desc').value.trim();
    const isActive = document.getElementById('svc-active').checked;

    const tierEnabled = document.getElementById('svc-tier-enabled').checked;
    let tierPrices = null;
    if (tierEnabled) {
      const j = parseFloat(document.getElementById('svc-tier-junior').value);
      const s = parseFloat(document.getElementById('svc-tier-senior').value);
      const m = parseFloat(document.getElementById('svc-tier-master').value);
      if (isNaN(j) || isNaN(s) || isNaN(m) || j < 0 || s < 0 || m < 0) {
        showToast('Enter all three tier prices (Junior, Senior, Master) — values must be 0 or above', 'error');
        return;
      }
      tierPrices = { junior: j, senior: s, master: m };
    }

    if (!name)           { showToast('Service name is required', 'error'); return; }
    if (isNaN(price) || price < 0) { showToast('Enter a valid price', 'error'); return; }
    if (!duration || duration < 5) { showToast('Duration must be at least 5 minutes', 'error'); return; }

    const editId = parseInt(document.getElementById('svc-edit-id').value);

    if (editId) {
      const idx = AppData.services.findIndex(s => s.id === editId);
      if (idx > -1) {
        AppData.services[idx] = { ...AppData.services[idx], name, price, duration, cat, icon, desc, is_active: isActive, tierPrices };
        showToast(`"${name}" updated successfully`, 'success');
      }
    } else {
      AppData.services.push({ id: nextNumId(AppData.services), name, price, duration, cat, icon, desc, is_active: isActive, tierPrices, branchId: App.currentBranch });
      showToast(`"${name}" added to services`, 'success');
    }

    AppData.save('services');
    closeModal('modal-service');
    this.render();
    this._renderSummary();
    // Refresh POS grid if open
    if (Router.current === 'pos') POS.renderServiceGrid();
  },

  // ── Toggle Active ────────────────────────────────────────────
  toggleActive(id, active) {
    const s = AppData.services.find(x => x.id === id);
    if (!s) return;
    s.is_active = active;
    AppData.save('services');
    this.render();
    this._renderSummary();
    showToast(`"${s.name}" ${active ? 'visible in POS' : 'hidden from POS'}`, active ? 'success' : 'info');
    // Refresh POS grid if currently on POS view
    if (Router.current === 'pos') POS.renderServiceGrid();
  },

  // ── Delete ───────────────────────────────────────────────────
  deleteService(id) {
    const s = AppData.services.find(x => x.id === id);
    if (!s) return;
    showConfirm(
      'Delete Service',
      `"${s.name}" will be permanently deleted. Past transactions using this service are unaffected.`,
      () => {
        AppData.services = AppData.services.filter(x => x.id !== id);
        AppData.save('services');
        this.render();
        this._renderSummary();
        showToast(`"${s.name}" deleted`, 'warning');
        if (Router.current === 'pos') POS.renderServiceGrid();
      }
    );
  }
};
