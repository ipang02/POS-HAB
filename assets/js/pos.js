// ============================================================
// HAB Barbershop POS — POS / Cashier Module
// ============================================================

const POS = {
  cart: [],           // [{ key, type:'service'|'product', id, name, price, qty }]
  currentCat: 'all',
  currentPCat: 'all',
  searchQuery: '',
  activePanel: 'services',   // 'services' | 'products'
  payMethod: 'cash',

  init() {
    this.renderBarberSelect();
    this.renderServiceGrid();
    this.renderProductGrid();
    this.renderCart();
    this.updateTaxDisplay();
    // reset to services tab on init
    this.switchPanel('services', document.getElementById('pos-tab-services'));
  },

  // ── Panel Switch (Services / Products) ─────────────────────
  switchPanel(panel, btn) {
    this.activePanel = panel;
    this.searchQuery = '';
    const searchEl = document.getElementById('svc-search');
    if (searchEl) searchEl.value = '';

    document.getElementById('pos-panel-services').classList.toggle('hidden', panel !== 'services');
    document.getElementById('pos-panel-products').classList.toggle('hidden', panel !== 'products');

    document.querySelectorAll('#pos-tab-services, #pos-tab-products').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');

    if (panel === 'services') this.renderServiceGrid();
    else this.renderProductGrid();
  },

  handleSearch() {
    this.searchQuery = document.getElementById('svc-search')?.value || '';
    if (this.activePanel === 'services') this.renderServiceGrid();
    else this.renderProductGrid();
  },

  // ── Barber Select ───────────────────────────────────────────
  renderBarberSelect() {
    const sel = document.getElementById('pos-barber');
    if (!sel) return;
    const available = branchBarbers().filter(b => b.status !== 'off');
    sel.innerHTML = '<option value="">Select Barber</option>' +
      available.map(b => `<option value="${b.id}">${b.name}${b.status === 'busy' ? ' (Busy)' : ''}</option>`).join('');
  },

  // ── Service Grid ────────────────────────────────────────────
  renderServiceGrid() {
    const grid = document.getElementById('service-grid');
    if (!grid) return;
    const q = this.searchQuery.toLowerCase();
    const filtered = AppData.services.filter(s =>
      s.is_active !== false &&
      (this.currentCat === 'all' || s.cat === this.currentCat) &&
      (!q || s.name.toLowerCase().includes(q) || (s.desc || '').toLowerCase().includes(q))
    );

    if (!filtered.length) {
      grid.innerHTML = `<div class="col-span-3 text-center py-16">
        <i class="fa-solid fa-magnifying-glass text-3xl text-white/14 mb-2 block"></i>
        <p class="text-sm text-white/30">No services found</p></div>`;
      return;
    }

    grid.innerHTML = filtered.map(s => {
      const inCart = this.cart.find(c => c.key === 'svc_' + s.id);
      return `<div class="service-card ${inCart ? 'in-cart' : ''}" onclick="POS.addToCart('service',${s.id})">
        <div class="w-12 h-12 rounded-xl mx-auto mb-3 flex items-center justify-center ${inCart ? 'btn-gold' : 'glass-gold'}">
          <i class="fa-solid ${s.icon || 'fa-scissors'} ${inCart ? 'text-ink-900' : 'text-gold'} text-lg"></i>
        </div>
        <p class="text-sm font-semibold text-white mb-0.5 leading-tight">${s.name}</p>
        <p class="text-[10px] text-white/35 mb-2 leading-snug">${s.desc || ''}</p>
        <p class="text-sm font-bold gold-text">${formatRp(s.price)}</p>
        <p class="text-[10px] text-white/30 mt-0.5">${s.duration} min</p>
        ${inCart ? `<div class="mt-2 text-[10px] font-bold text-gold bg-gold/10 rounded-lg py-0.5">✓ In Cart (${inCart.qty})</div>` : ''}
      </div>`;
    }).join('');
  },

  filterByCategory(btn) {
    document.querySelectorAll('#pos-panel-services .tab-btn[data-cat]').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    this.currentCat = btn.dataset.cat;
    this.renderServiceGrid();
  },

  // ── Product Grid ────────────────────────────────────────────
  renderProductGrid() {
    const grid = document.getElementById('product-grid');
    if (!grid) return;
    const q = this.searchQuery.toLowerCase();
    const filtered = AppData.inventory.filter(i =>
      (this.currentPCat === 'all' || i.cat === this.currentPCat) &&
      (!q || i.name.toLowerCase().includes(q))
    );

    if (!filtered.length) {
      grid.innerHTML = `<div class="col-span-3 text-center py-16">
        <i class="fa-solid fa-box-open text-3xl text-white/14 mb-2 block"></i>
        <p class="text-sm text-white/30">No products found</p></div>`;
      return;
    }

    grid.innerHTML = filtered.map(item => {
      const inCart = this.cart.find(c => c.key === 'prd_' + item.id);
      const isOut  = item.stock === 0;
      const isLow  = item.stock > 0 && item.stock <= item.minStock;
      return `<div class="service-card ${inCart ? 'in-cart' : ''} ${isOut ? 'opacity-50 cursor-not-allowed' : ''}"
          onclick="${isOut ? `showToast('${item.name} is out of stock','warning')` : `POS.addToCart('product',${item.id})`}">
        <div class="w-12 h-12 rounded-xl mx-auto mb-3 flex items-center justify-center ${inCart ? 'btn-gold' : 'glass'}">
          <i class="fa-solid fa-box ${inCart ? 'text-ink-900' : 'text-white/50'} text-lg"></i>
        </div>
        <p class="text-sm font-semibold text-white mb-0.5 leading-tight">${item.name}</p>
        <p class="text-[10px] text-white/35 mb-2 capitalize">${item.cat} · ${item.unit}</p>
        <p class="text-sm font-bold gold-text">${formatRp(item.price)}</p>
        <div class="mt-1.5 flex items-center justify-center gap-1.5">
          <span class="text-[10px] font-semibold ${isOut ? 'text-red-400' : isLow ? 'text-amber-400' : 'text-green-400'}">
            ${isOut ? 'Out of stock' : `Stock: ${item.stock}`}
          </span>
          ${isLow && !isOut ? '<span class="text-[9px] text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded-full">Low</span>' : ''}
        </div>
        ${inCart ? `<div class="mt-1.5 text-[10px] font-bold text-gold bg-gold/10 rounded-lg py-0.5">✓ In Cart (${inCart.qty})</div>` : ''}
      </div>`;
    }).join('');
  },

  filterProductCat(btn) {
    document.querySelectorAll('#pos-panel-products .tab-btn[data-pcat]').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    this.currentPCat = btn.dataset.pcat;
    this.renderProductGrid();
  },

  // ── Cart ────────────────────────────────────────────────────
  addToCart(type, id) {
    if (type === 'service') {
      const svc = getServiceById(id);
      if (!svc || svc.is_active === false) return;
      const key = 'svc_' + id;
      const existing = this.cart.find(c => c.key === key);
      if (existing) { existing.qty++; }
      else { this.cart.push({ key, type:'service', id, name: svc.name, price: svc.price, qty: 1 }); }
      showToast(`${svc.name} added`, 'success', 1400);
    } else {
      const item = AppData.inventory.find(i => i.id === id);
      if (!item || item.stock === 0) { showToast('Out of stock!', 'warning'); return; }
      const key = 'prd_' + id;
      const existing = this.cart.find(c => c.key === key);
      const maxQty = item.stock;
      if (existing) {
        if (existing.qty >= maxQty) { showToast(`Only ${maxQty} ${item.unit} in stock`, 'warning'); return; }
        existing.qty++;
      } else {
        this.cart.push({ key, type:'product', id, name: item.name, price: item.price, qty: 1, stock: item.stock });
      }
      showToast(`${item.name} added`, 'success', 1400);
    }
    this._refreshGrids();
    this.renderCart();
    this.recalc();
  },

  removeFromCart(key) {
    this.cart = this.cart.filter(c => c.key !== key);
    this._refreshGrids();
    this.renderCart();
    this.recalc();
  },

  updateQty(key, delta) {
    const item = this.cart.find(c => c.key === key);
    if (!item) return;
    const newQty = item.qty + delta;
    if (newQty < 1) { this.removeFromCart(key); return; }
    // cap at stock for products
    if (item.type === 'product') {
      const inv = AppData.inventory.find(i => i.id === item.id);
      if (inv && newQty > inv.stock) { showToast(`Only ${inv.stock} in stock`, 'warning'); return; }
    }
    item.qty = newQty;
    this._refreshGrids();
    this.renderCart();
    this.recalc();
  },

  clearCart() {
    if (!this.cart.length) return;
    this.cart = [];
    document.getElementById('pos-discount').value = '0';
    this._refreshGrids();
    this.renderCart();
    this.recalc();
  },

  _refreshGrids() {
    this.renderServiceGrid();
    this.renderProductGrid();
  },

  renderCart() {
    const itemsEl = document.getElementById('cart-items');
    const emptyEl = document.getElementById('cart-empty');
    const countEl = document.getElementById('cart-count-lbl');
    const isEmpty  = this.cart.length === 0;

    itemsEl.classList.toggle('hidden', isEmpty);
    emptyEl.classList.toggle('hidden', !isEmpty);

    const totalItems = this.cart.reduce((s, c) => s + c.qty, 0);
    if (countEl) countEl.textContent = `${totalItems} item${totalItems !== 1 ? 's' : ''} selected`;

    itemsEl.innerHTML = this.cart.map(item => `
      <div class="glass rounded-xl p-3">
        <div class="flex items-start justify-between gap-2 mb-2">
          <div class="flex items-center gap-2 flex-1 min-w-0">
            <div class="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
              style="background:${item.type==='product' ? 'rgba(255,255,255,.08)' : 'rgba(201,168,76,.12)'}">
              <i class="fa-solid ${item.type==='product' ? 'fa-box text-white/40' : 'fa-scissors text-gold'} text-[10px]"></i>
            </div>
            <p class="text-sm font-semibold text-white leading-tight truncate">${item.name}</p>
          </div>
          <button onclick="POS.removeFromCart('${item.key}')"
            class="text-white/22 hover:text-red-400 transition-colors flex-shrink-0 mt-0.5">
            <i class="fa-solid fa-xmark text-xs"></i>
          </button>
        </div>
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-1.5">
            <button onclick="POS.updateQty('${item.key}',-1)"
              class="w-6 h-6 rounded-lg glass flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-colors">
              <i class="fa-solid fa-minus text-[9px]"></i>
            </button>
            <span class="text-sm font-bold text-white w-6 text-center">${item.qty}</span>
            <button onclick="POS.updateQty('${item.key}',1)"
              class="w-6 h-6 rounded-lg glass flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-colors">
              <i class="fa-solid fa-plus text-[9px]"></i>
            </button>
          </div>
          <span class="text-sm font-bold text-white">${formatRp(item.price * item.qty)}</span>
        </div>
      </div>`).join('');
  },

  recalc() {
    const subtotal  = this.cart.reduce((s, c) => s + c.price * c.qty, 0);
    const discPct   = parseFloat(document.getElementById('pos-discount')?.value || 0);
    const discAmt   = Math.round(subtotal * discPct / 100);
    const afterDisc = subtotal - discAmt;
    const taxRate   = AppData.settings.taxRate || 6;
    const taxAmt    = Math.round(afterDisc * taxRate / 100);
    const total     = afterDisc + taxAmt;

    document.getElementById('pos-subtotal').textContent = formatRp(subtotal);
    document.getElementById('pos-disc-amt').textContent = formatRp(discAmt);
    document.getElementById('pos-tax-pct').textContent  = taxRate;
    document.getElementById('pos-tax-amt').textContent  = formatRp(taxAmt);
    document.getElementById('pos-total').textContent    = formatRp(total);

    const payBtn = document.getElementById('btn-pay');
    if (payBtn) payBtn.disabled = this.cart.length === 0;
  },

  updateTaxDisplay() {
    const el = document.getElementById('pos-tax-pct');
    if (el) el.textContent = AppData.settings.taxRate || 6;
  },

  filterServices() { this.handleSearch(); },

  // ── Payment ─────────────────────────────────────────────────
  openPayment() {
    if (!this.cart.length) return;
    const subtotal  = this.cart.reduce((s, c) => s + c.price * c.qty, 0);
    const discPct   = parseFloat(document.getElementById('pos-discount')?.value || 0);
    const discAmt   = Math.round(subtotal * discPct / 100);
    const afterDisc = subtotal - discAmt;
    const taxAmt    = Math.round(afterDisc * (AppData.settings.taxRate || 6) / 100);
    const total     = afterDisc + taxAmt;

    document.getElementById('pay-subtotal').textContent  = formatRp(subtotal);
    document.getElementById('pay-discount').textContent  = '−' + formatRp(discAmt);
    document.getElementById('pay-tax').textContent       = formatRp(taxAmt);
    document.getElementById('pay-total').textContent     = formatRp(total);
    document.getElementById('cash-tendered').value       = '';
    document.getElementById('cash-change').textContent   = formatRp(0);
    document.getElementById('pay-customer-name').value  = '';
    document.getElementById('pay-customer-phone').value = '';
    document.getElementById('card-last4').value          = '';

    this.selectPayMethodByName('cash');
    this._generatePayQR();
    openModal('modal-payment');
  },

  selectPayMethod(btn) {
    document.querySelectorAll('#modal-payment .tab-btn[data-method]').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    this.payMethod = btn.dataset.method;
    document.getElementById('pay-panel-cash').classList.toggle('hidden', this.payMethod !== 'cash');
    document.getElementById('pay-panel-card').classList.toggle('hidden', this.payMethod !== 'card');
    document.getElementById('pay-panel-qr').classList.toggle('hidden',   this.payMethod !== 'qr');
  },

  selectPayMethodByName(method) {
    const btn = document.querySelector(`#modal-payment .tab-btn[data-method="${method}"]`);
    if (btn) this.selectPayMethod(btn);
  },

  _generatePayQR() {
    const qrEl = document.getElementById('qr-pay-code');
    if (!qrEl) return;
    qrEl.innerHTML = '';
    try {
      new QRCode(qrEl, { text:'HAB-BARBERSHOP-QRIS-' + Date.now(), width:160, height:160, colorDark:'#000', colorLight:'#FFF', correctLevel: QRCode.CorrectLevel.M });
    } catch(e) { qrEl.innerHTML = '<p class="text-xs text-gray-400 p-4">QR unavailable</p>'; }
  },

  calcChange() {
    const tendered = parseFloat(document.getElementById('cash-tendered')?.value || 0);
    const totalStr = document.getElementById('pay-total')?.textContent || '0';
    const total    = parseInt(totalStr.replace(/[^0-9]/g, '')) || 0;
    const change   = tendered - total;
    const el = document.getElementById('cash-change');
    if (el) { el.textContent = formatRp(Math.max(0, change)); el.style.color = change < 0 ? '#f87171' : '#4ade80'; }
  },

  quickCash(amount) {
    document.getElementById('cash-tendered').value = amount;
    this.calcChange();
  },

  confirmPayment() {
    const totalStr = document.getElementById('pay-total')?.textContent || '0';
    const total    = parseInt(totalStr.replace(/[^0-9]/g, '')) || 0;

    if (this.payMethod === 'cash') {
      const tendered = parseFloat(document.getElementById('cash-tendered')?.value || 0);
      if (tendered < total) { showToast('Amount tendered is less than total!', 'error'); return; }
    }

    const customer = (document.getElementById('pay-customer-name')?.value || '').trim() || 'Walk-in';
    const barberId = parseInt(document.getElementById('pos-barber')?.value) || 0;
    const barber   = getBarberById(barberId);
    const discPct  = parseFloat(document.getElementById('pos-discount')?.value || 0);
    const subtotal = this.cart.reduce((s, c) => s + c.price * c.qty, 0);
    const discAmt  = Math.round(subtotal * discPct / 100);
    const afterDisc = subtotal - discAmt;
    const taxAmt   = Math.round(afterDisc * (AppData.settings.taxRate || 6) / 100);
    const tendered = this.payMethod === 'cash' ? parseFloat(document.getElementById('cash-tendered')?.value || 0) : 0;

    const trx = {
      id:       genId('TRX'),
      customer,
      barberId,
      branchId: App.currentBranch || 1,
      services: this.cart.map(c => ({ name: c.name, qty: c.qty, price: c.price, type: c.type })),
      discount: discPct,
      tax:      AppData.settings.taxRate || 6,
      total,
      method:   this.payMethod,
      tendered,
      date:     today(),
      time:     new Date().toTimeString().slice(0, 5)
    };

    AppData.transactions.unshift(trx);
    AppData.save('transactions');

    // Auto-deduct stock for product items
    this.cart.filter(c => c.type === 'product').forEach(c => {
      const inv = AppData.inventory.find(i => i.id === c.id);
      if (inv) {
        inv.stock = Math.max(0, inv.stock - c.qty);
      }
    });
    AppData.save('inventory');

    // Mark barber busy
    if (barber && barber.status === 'available') { barber.status = 'busy'; AppData.save('barbers'); }

    closeModal('modal-payment');
    this._showReceipt(trx, barber, discAmt, afterDisc, taxAmt, tendered);
    showToast('Payment successful! ' + formatRp(total), 'success');
    Inventory.checkLowStock?.();
  },

  _showReceipt(trx, barber, discAmt, afterDisc, taxAmt, tendered) {
    const s  = AppData.settings;
    const bs = getBranchSettings();
    document.getElementById('rcpt-shop-name').textContent = bs.shopName || s.shopName;
    document.getElementById('rcpt-address').textContent   = bs.address  || s.address;
    document.getElementById('rcpt-phone').textContent     = bs.phone    || s.phone;
    document.getElementById('rcpt-id').textContent        = trx.id;
    document.getElementById('rcpt-datetime').textContent  = `${formatDate(trx.date)} ${trx.time}`;
    document.getElementById('rcpt-customer').textContent  = trx.customer;
    document.getElementById('rcpt-barber').textContent    = barber ? barber.name : 'Not specified';

    const subtotal = this.cart.reduce((s, c) => s + c.price * c.qty, 0);
    document.getElementById('rcpt-subtotal').textContent = formatRp(subtotal);
    document.getElementById('rcpt-discount').textContent = '−' + formatRp(discAmt);
    document.getElementById('rcpt-tax').textContent      = formatRp(taxAmt);
    document.getElementById('rcpt-total').textContent    = formatRp(trx.total);
    document.getElementById('rcpt-method').textContent   = methodLabel(trx.method);
    document.getElementById('rcpt-footer').textContent   = s.receiptFooter;

    const discRow = document.getElementById('rcpt-disc-row');
    if (discRow) discRow.style.display = discAmt > 0 ? '' : 'none';

    const changeEl  = document.getElementById('rcpt-change');
    const changeRow = document.getElementById('rcpt-change-row');
    if (changeRow) changeRow.style.display = trx.method === 'cash' ? '' : 'none';
    if (changeEl)  changeEl.textContent = formatRp(Math.max(0, tendered - trx.total));

    document.getElementById('rcpt-items').innerHTML = trx.services.map(s =>
      `<div class="flex justify-between text-xs">
        <span class="text-white/55 flex items-center gap-1">
          <i class="fa-solid ${s.type === 'product' ? 'fa-box' : 'fa-scissors'} text-[9px] text-white/30"></i>
          ${s.name} x${s.qty}
        </span>
        <span class="text-white font-medium">${formatRp(s.price * s.qty)}</span>
      </div>`).join('');

    const qrEl   = document.getElementById('rcpt-qr');
    const qrWrap = document.getElementById('rcpt-qr-wrap');
    if (qrEl && s.receiptShowQr !== false) {
      qrEl.innerHTML = '';
      try { new QRCode(qrEl, { text:'https://habbarbershop.com.my/feedback?trx=' + trx.id, width:112, height:112, colorDark:'#000', colorLight:'#FFF', correctLevel: QRCode.CorrectLevel.L }); } catch(e) {}
      if (qrWrap) qrWrap.style.display = '';
    } else if (qrWrap) { qrWrap.style.display = 'none'; }

    openModal('modal-receipt-overlay');
  },

  printReceipt() {
    const content = document.getElementById('receipt-content')?.innerHTML || '';
    document.getElementById('print-receipt').innerHTML =
      `<div style="max-width:300px;margin:0 auto;font-family:Inter,sans-serif;color:#000">${content}</div>`;
    window.print();
  },

  newOrder() {
    this.clearCart();
    document.getElementById('pos-barber').value = '';
    showToast('Ready for new order', 'info', 2000);
  }
};
