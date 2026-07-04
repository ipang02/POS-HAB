// ============================================================
// HAB Barbershop POS — Setup Wizard
// ============================================================

const SetupWizard = {
  _step: 1,
  _data: {},

  _blankData() {
    return {
      branchName: '', address: '', phone: '',
      ownerPin: '', staffPin: '',
      barberName: '', barberInitials: '',
      services: []
    };
  },

  open() {
    this._step = 1;
    this._data = this._blankData();
    this._renderStep(1);
    const initEl = document.getElementById('wiz-barber-initials');
    if (initEl) initEl.removeAttribute('data-manually-edited');
    document.getElementById('setup-wizard').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  },

  _close() {
    document.getElementById('setup-wizard').classList.add('hidden');
    document.body.style.overflow = '';
  },

  next() {
    if (!this._validate(this._step)) return;
    this._collect(this._step);
    this._step++;
    if (this._step === 7) this._commit();
    this._renderStep(this._step);
  },

  done() {
    this._close();
    Auth.lock();
  },

  // ── Validation ──────────────────────────────────────────────

  _validate(step) {
    if (step === 1) return true;

    if (step === 2) {
      const name = document.getElementById('wiz-branch-name').value.trim();
      if (!name) { showToast('Branch name is required', 'error'); return false; }
      return true;
    }

    if (step === 3) {
      const pin  = document.getElementById('wiz-owner-pin').value;
      const conf = document.getElementById('wiz-owner-pin-confirm').value;
      if (!/^\d{4}$/.test(pin))  { showToast('Owner PIN must be exactly 4 digits', 'error'); return false; }
      if (pin !== conf)           { showToast('Owner PINs do not match', 'error'); return false; }
      return true;
    }

    if (step === 4) {
      const pin  = document.getElementById('wiz-staff-pin').value;
      const conf = document.getElementById('wiz-staff-pin-confirm').value;
      if (!/^\d{4}$/.test(pin))  { showToast('Staff PIN must be exactly 4 digits', 'error'); return false; }
      if (pin !== conf)           { showToast('Staff PINs do not match', 'error'); return false; }
      if (pin === this._data.ownerPin) { showToast('Staff PIN must be different from Owner PIN', 'error'); return false; }
      return true;
    }

    if (step === 5) {
      const name = document.getElementById('wiz-barber-name').value.trim();
      if (!name) { showToast('Barber name is required', 'error'); return false; }
      return true;
    }

    if (step === 6) {
      const rows = document.querySelectorAll('#wiz-svc-tbody tr');
      const hasValid = Array.from(rows).some(row => {
        const name  = row.querySelector('.wiz-svc-name').value.trim();
        const price = row.querySelector('.wiz-svc-price').value;
        return name && price !== '' && !isNaN(parseFloat(price)) && parseFloat(price) >= 0;
      });
      if (!hasValid) { showToast('Add at least one service with a name and price', 'error'); return false; }
      return true;
    }

    return true;
  },

  // ── Data Collection ─────────────────────────────────────────

  _collect(step) {
    if (step === 2) {
      this._data.branchName = document.getElementById('wiz-branch-name').value.trim();
      this._data.address    = document.getElementById('wiz-address').value.trim();
      this._data.phone      = document.getElementById('wiz-phone').value.trim();
    }
    if (step === 3) {
      this._data.ownerPin = document.getElementById('wiz-owner-pin').value;
    }
    if (step === 4) {
      this._data.staffPin = document.getElementById('wiz-staff-pin').value;
    }
    if (step === 5) {
      this._data.barberName     = document.getElementById('wiz-barber-name').value.trim();
      this._data.barberInitials = document.getElementById('wiz-barber-initials').value.trim().toUpperCase() ||
                                  this._autoInitials(this._data.barberName);
    }
    if (step === 6) {
      const rows = document.querySelectorAll('#wiz-svc-tbody tr');
      this._data.services = [];
      rows.forEach(row => {
        const name  = row.querySelector('.wiz-svc-name').value.trim();
        const price = row.querySelector('.wiz-svc-price').value;
        if (name && price !== '' && !isNaN(parseFloat(price)) && parseFloat(price) >= 0) {
          this._data.services.push({ name, price: parseFloat(price) });
        }
      });
    }
  },

  // ── Commit to AppData ────────────────────────────────────────

  _commit() {
    const d = this._data;

    // Clear demo data
    AppData.barbers      = [];
    AppData.services     = [];
    AppData.appointments = [];
    AppData.transactions = [];
    if (typeof API !== 'undefined') API.clearTransactions();
    AppData.inventory    = [];
    AppData.queue        = [];
    AppData.customers    = [];

    // Update PINs
    AppData.settings.pins.owner = d.ownerPin;
    AppData.settings.pins.staff = d.staffPin;

    // Replace branches with a single configured branch
    AppData.branches = [{
      id: 1,
      name: d.branchName,
      shortName: d.branchName.trim().slice(0, 3).toUpperCase(),
      address: d.address || ''
    }];

    // Rebuild branchSettings with a single entry
    AppData.settings.branchSettings = [{
      branchId: 1,
      shopName: d.branchName,
      address: d.address || '',
      phone: d.phone || '',
      email: '',
      instagram: '',
      hours: {
        Mon:{open:'09:00',close:'21:00',active:true},
        Tue:{open:'09:00',close:'21:00',active:true},
        Wed:{open:'09:00',close:'21:00',active:true},
        Thu:{open:'09:00',close:'21:00',active:true},
        Fri:{open:'09:00',close:'22:00',active:true},
        Sat:{open:'08:00',close:'22:00',active:true},
        Sun:{open:'10:00',close:'20:00',active:true}
      }
    }];

    // Update global settings fields (backward compat)
    AppData.settings.shopName = d.branchName;
    if (d.address) AppData.settings.address = d.address;
    if (d.phone)   AppData.settings.phone   = d.phone;

    // Add first barber
    AppData.barbers.push({
      id: 1,
      name: d.barberName,
      initials: d.barberInitials,
      color: '#6366f1',
      status: 'available',
      skills: [],
      commission: 0,
      phone: '',
      tier: null,
      branchId: 1
    });

    // Add services
    d.services.forEach((s, i) => {
      AppData.services.push({
        id: i + 1,
        name: s.name,
        price: s.price,
        duration: 30,
        cat: 'hair',
        icon: 'fa-scissors',
        desc: '',
        is_active: true,
        tierPrices: null,
        bookingPrice: null,
        branchId: 1
      });
    });

    // Reset active branch to 1 (wizard only configures branch 1)
    App.currentBranch = 1;
    StorageManager.save('currentBranch', 1);

    // Save all changed keys
    ['barbers','services','appointments','transactions','inventory','queue','customers','settings','branches']
      .forEach(k => AppData.save(k));

    // Populate summary screen
    const sumBranch = document.getElementById('wiz-sum-branch');
    const sumBarber = document.getElementById('wiz-sum-barber');
    const sumCount  = document.getElementById('wiz-sum-svc-count');
    if (sumBranch) sumBranch.textContent = d.branchName;
    if (sumBarber) sumBarber.textContent = d.barberName;
    if (sumCount)  sumCount.textContent  = d.services.length + (d.services.length === 1 ? ' service' : ' services');
  },

  // ── Step Rendering ───────────────────────────────────────────

  _renderStep(step) {
    document.querySelectorAll('.wiz-step').forEach(el => el.classList.add('hidden'));
    const active = document.querySelector(`.wiz-step[data-step="${step}"]`);
    if (active) active.classList.remove('hidden');

    document.querySelectorAll('.wiz-dot').forEach(dot => {
      const n = parseInt(dot.dataset.dot);
      dot.style.background = n <= step ? '#C9A84C' : 'rgba(255,255,255,0.18)';
      dot.style.transform  = n === step ? 'scale(1.3)' : 'scale(1)';
    });

    if (step === 6) this._ensureServiceRows();
  },

  _ensureServiceRows() {
    const tbody = document.getElementById('wiz-svc-tbody');
    if (!tbody) return;
    if (tbody.querySelectorAll('tr').length === 0) this.addServiceRow();
  },

  // ── Services Table ───────────────────────────────────────────

  addServiceRow() {
    const tbody = document.getElementById('wiz-svc-tbody');
    if (!tbody) return;
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="pb-2 pr-2">
        <input type="text" class="wiz-svc-name inp py-2 text-sm" placeholder="Service name">
      </td>
      <td class="pb-2 pl-1 pr-2">
        <input type="number" class="wiz-svc-price inp py-2 text-sm" placeholder="0" min="0" step="0.01">
      </td>
      <td class="pb-2 text-center">
        <button type="button" onclick="SetupWizard.removeServiceRow(this)"
          class="text-white/25 hover:text-red-400 transition-colors text-xs p-1">
          <i class="fa-solid fa-trash-can"></i>
        </button>
      </td>`;
    tbody.appendChild(tr);
  },

  removeServiceRow(btn) {
    const tr = btn.closest('tr');
    const tbody = document.getElementById('wiz-svc-tbody');
    if (tbody && tbody.querySelectorAll('tr').length > 1) {
      tr.remove();
    } else {
      showToast('At least one service is required', 'error');
    }
  },

  // ── Helpers ──────────────────────────────────────────────────

  _autoInitials(name) {
    return name.trim().split(/\s+/).map(w => w[0] || '').join('').toUpperCase().slice(0, 2);
  },

  _onBarberNameInput(val) {
    const initEl = document.getElementById('wiz-barber-initials');
    if (initEl && !initEl.dataset.manuallyEdited) {
      initEl.value = this._autoInitials(val);
    }
  },

  _autoNextReady() {}
};

// Mark initials as manually edited if user touches the field
document.addEventListener('DOMContentLoaded', () => {
  const initEl = document.getElementById('wiz-barber-initials');
  if (initEl) {
    initEl.addEventListener('input', () => { initEl.dataset.manuallyEdited = '1'; });
  }
});
