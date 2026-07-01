// ============================================================
// HAB Barbershop POS — Inventory Module
// ============================================================

const Inventory = {
  currentCat: 'all',
  searchQ: '',

  init() {
    this.filter();
    this.checkLowStock();
    this._renderSummary();
  },

  filter() {
    this.searchQ = (document.getElementById('inv-search')?.value || '').toLowerCase();
    this.render();
  },

  filterCat(btn) {
    document.querySelectorAll('[data-inv-cat]').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    this.currentCat = btn.dataset.invCat;
    this.render();
  },

  render() {
    const grid    = document.getElementById('inv-grid');
    const emptyEl = document.getElementById('inv-empty');
    if (!grid) return;

    const items = branchInventory().filter(i =>
      (this.currentCat === 'all' || i.cat === this.currentCat) &&
      (!this.searchQ || i.name.toLowerCase().includes(this.searchQ))
    );

    grid.classList.toggle('hidden', items.length === 0);
    emptyEl.classList.toggle('hidden', items.length > 0);

    grid.innerHTML = items.map(i => this._card(i)).join('');
  },

  _card(item) {
    const pct = Math.min(100, Math.round(item.stock / (item.minStock * 3) * 100));
    const isLow = item.stock <= item.minStock;
    const isOut = item.stock === 0;
    const barColor = isOut ? '#ef4444' : isLow ? '#f59e0b' : '#22c55e';

    return `
      <div class="glass rounded-2xl p-5 hover:border-white/14 transition-all">
        <!-- Header -->
        <div class="flex items-start justify-between mb-3">
          <div class="flex-1 min-w-0">
            <h4 class="text-sm font-bold text-white truncate">${item.name}</h4>
            <p class="text-xs text-white/35 capitalize mt-0.5">${item.cat} · ${item.unit}</p>
          </div>
          ${isLow ? `<span class="badge ${isOut ? 'badge-cancelled' : 'badge-pending'} text-[10px] ml-2 flex-shrink-0">${isOut ? 'Out' : 'Low'}</span>` : ''}
        </div>
        <!-- Price -->
        <p class="text-base font-bold gold-text mb-4">${formatRp(item.price)}</p>
        <!-- Stock Bar -->
        <div class="mb-1.5">
          <div class="flex justify-between text-xs text-white/40 mb-1">
            <span>Stock</span>
            <span class="${isLow ? 'text-amber-400' : 'text-white'} font-semibold">${item.stock} <span class="text-white/30">/ min ${item.minStock}</span></span>
          </div>
          <div class="stock-bar">
            <div class="stock-fill" style="width:${pct}%;background:${barColor}"></div>
          </div>
        </div>
        ${item.commissionRM ? `<p class="text-[10px] text-green-400 mt-2">
          <i class="fa-solid fa-hand-holding-dollar mr-1"></i>RM ${item.commissionRM} commission/unit
        </p>` : ''}
        <!-- Actions -->
        <div class="flex gap-2 mt-4">
          <button onclick="Inventory.restock(${item.id})" class="btn-gold flex-1 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1">
            <i class="fa-solid fa-plus text-[10px]"></i> Restock
          </button>
          <button onclick="Inventory.openEditModal(${item.id})" class="btn-outline w-8 h-7 rounded-lg flex items-center justify-center text-xs">
            <i class="fa-solid fa-pen"></i>
          </button>
          <button onclick="Inventory.deleteItem(${item.id})" class="btn-danger w-8 h-7 rounded-lg flex items-center justify-center text-xs">
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
      </div>`;
  },

  _renderSummary() {
    const summaryEl = document.getElementById('inv-summary');
    if (!summaryEl) return;
    const bInv = branchInventory();
    const low  = bInv.filter(i => i.stock <= i.minStock).length;
    const out  = bInv.filter(i => i.stock === 0).length;
    summaryEl.textContent = `${bInv.length} products · ${low} low · ${out} out · ${currentBranchName()}`;
  },

  checkLowStock() {
    const low = branchInventory().filter(i => i.stock <= i.minStock);
    const badge = document.getElementById('nav-inv-badge');
    if (badge) {
      badge.textContent = low.length;
      badge.classList.toggle('hidden', low.length === 0);
    }
    const banner  = document.getElementById('low-stock-banner');
    const bannerMsg = document.getElementById('low-stock-msg');
    if (banner && bannerMsg) {
      banner.classList.toggle('hidden', low.length === 0);
      if (low.length > 0) {
        bannerMsg.textContent = `${low.length} product${low.length>1?'s':''} need restocking: ${low.map(i=>i.name).join(', ')}`;
        if (low.length > 0 && Router.current === 'dashboard') {
          showToast(`${low.length} inventory item${low.length>1?'s':''} low on stock!`, 'warning');
        }
      }
    }
  },

  restock(id) {
    const item = AppData.inventory.find(i => i.id === id);
    if (!item) return;
    const qty = parseInt(prompt(`Add stock for "${item.name}"\nCurrent stock: ${item.stock}\n\nQuantity to add:`));
    if (!qty || qty <= 0) return;
    item.stock += qty;
    AppData.save('inventory');
    this.render();
    this._renderSummary();
    this.checkLowStock();
    showToast(`+${qty} added to ${item.name} (now ${item.stock} ${item.unit})`, 'success');
  },

  openAddModal() {
    document.getElementById('inv-edit-id').value = '';
    document.getElementById('inv-modal-title').textContent = 'Add Product';
    document.getElementById('inv-name').value   = '';
    document.getElementById('inv-cat').value    = 'styling';
    document.getElementById('inv-unit').value   = 'pcs';
    document.getElementById('inv-stock').value  = '0';
    document.getElementById('inv-min-stock').value = '5';
    document.getElementById('inv-price').value  = '';
    document.getElementById('inv-commission').value = '';
    openModal('modal-inv');
  },

  openEditModal(id) {
    const item = AppData.inventory.find(i => i.id === id);
    if (!item) return;
    document.getElementById('inv-edit-id').value = id;
    document.getElementById('inv-modal-title').textContent = 'Edit Product';
    document.getElementById('inv-name').value      = item.name;
    document.getElementById('inv-cat').value       = item.cat;
    document.getElementById('inv-unit').value      = item.unit;
    document.getElementById('inv-stock').value     = item.stock;
    document.getElementById('inv-min-stock').value = item.minStock;
    document.getElementById('inv-price').value     = item.price;
    document.getElementById('inv-commission').value = item.commissionRM ?? '';
    openModal('modal-inv');
  },

  save() {
    const name     = document.getElementById('inv-name').value.trim();
    const cat      = document.getElementById('inv-cat').value;
    const unit     = document.getElementById('inv-unit').value;
    const stock    = parseInt(document.getElementById('inv-stock').value) || 0;
    const minStock = parseInt(document.getElementById('inv-min-stock').value) || 5;
    const price    = parseInt(document.getElementById('inv-price').value) || 0;
    const commissionRM = parseFloat(document.getElementById('inv-commission').value) || null;

    if (!name) { showToast('Product name is required', 'error'); return; }

    const editId = parseInt(document.getElementById('inv-edit-id').value);
    if (editId) {
      const idx = AppData.inventory.findIndex(i => i.id === editId);
      if (idx > -1) Object.assign(AppData.inventory[idx], { name, cat, unit, stock, minStock, price, commissionRM });
      showToast('Product updated', 'success');
    } else {
      AppData.inventory.push({ id: nextNumId(AppData.inventory), name, cat, unit, stock, minStock, price, commissionRM, branchId: App.currentBranch || 1 });
      showToast('Product added!', 'success');
    }

    AppData.save('inventory');
    closeModal('modal-inv');
    this.render();
    this._renderSummary();
    this.checkLowStock();
  },

  deleteItem(id) {
    const item = AppData.inventory.find(i => i.id === id);
    if (!item) return;
    showConfirm('Delete Product', `"${item.name}" will be permanently removed.`, () => {
      AppData.inventory = AppData.inventory.filter(i => i.id !== id);
      AppData.save('inventory');
      this.render();
      this._renderSummary();
      this.checkLowStock();
      showToast('Product deleted', 'warning');
    });
  }
};
