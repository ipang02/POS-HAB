const Auth = {
  _role: null,
  _entered: '',
  _submitting: false,

  init() {
    this._role = sessionStorage.getItem('hab_role');
    if (this._role) {
      this._hidePinScreen();
      this.applyRole();
    } else {
      this._showPinScreen();
    }
  },

  _showPinScreen() {
    const el = document.getElementById('pin-screen');
    if (el) el.classList.remove('hidden');
    this._entered = '';
    this._updateDots();
    const err = document.getElementById('pin-error');
    if (err) err.classList.add('hidden');
  },

  _hidePinScreen() {
    const el = document.getElementById('pin-screen');
    if (el) el.classList.add('hidden');
  },

  digit(d) {
    if (this._submitting) return;
    if (this._entered.length >= 4) return;
    this._entered += String(d);
    this._updateDots();
    if (this._entered.length === 4) {
      this._submitting = true;
      setTimeout(() => this._submit(), 120);
    }
  },

  backspace() {
    this._entered = this._entered.slice(0, -1);
    this._updateDots();
  },

  _updateDots() {
    const dots = document.querySelectorAll('#pin-dots .pin-dot');
    dots.forEach((dot, i) => {
      dot.classList.toggle('filled', i < this._entered.length);
    });
  },

  _submit() {
    this._submitting = false;
    const pins = AppData?.settings?.pins || { owner: '1234', staff: '0000' };
    if (this._entered === pins.owner) {
      this._setRole('owner');
    } else if (this._entered === pins.staff) {
      this._setRole('staff');
    } else {
      this._shake();
    }
  },

  _setRole(role) {
    sessionStorage.setItem('hab_role', role);
    this._role = role;
    const statusEl = document.getElementById('pin-status');
    if (statusEl) {
      statusEl.textContent = role === 'owner' ? 'Owner' : 'Staff';
      statusEl.classList.remove('hidden');
    }
    this._entered = '';
    this._updateDots();
    setTimeout(() => {
      this._hidePinScreen();
      this.applyRole();
    }, 300);
  },

  _shake() {
    const screen = document.getElementById('pin-screen');
    const card = screen?.querySelector('.pin-card');
    if (!card) { console.warn('Auth: .pin-card not found in #pin-screen'); this._reset(); return; }
    card.classList.add('pin-shake');
    const err = document.getElementById('pin-error');
    if (err) err.classList.remove('hidden');
    setTimeout(() => {
      card.classList.remove('pin-shake');
      this._reset();
    }, 600);
  },

  _reset() {
    this._entered = '';
    this._updateDots();
    const err = document.getElementById('pin-error');
    if (err) err.classList.add('hidden');
  },

  lock() {
    sessionStorage.removeItem('hab_role');
    this._role = null;
    this._showPinScreen();
  },

  applyRole() {
    const role = this._role;
    const access = AppData?.settings?.staffAccess || {};
    const restricted = ['analytics', 'services', 'barbers', 'inventory', 'settings'];

    restricted.forEach(mod => {
      const navEl = document.querySelector(`.nav-item[data-view="${mod}"]`);
      if (!navEl) return;
      const allowed = role === 'owner' || access[mod] === true;
      navEl.classList.toggle('nav-hidden', !allowed);
    });

    const lockBtn = document.getElementById('sidebar-lock-btn');
    if (lockBtn) lockBtn.classList.remove('hidden');
  },

  canAccess(view) {
    if (!this._role) return false;
    if (this._role === 'owner') return true;
    const restricted = ['analytics', 'services', 'barbers', 'inventory', 'settings'];
    if (!restricted.includes(view)) return true;
    return (AppData?.settings?.staffAccess || {})[view] === true;
  }
};

document.addEventListener('keydown', e => {
  const screen = document.getElementById('pin-screen');
  if (!screen || screen.classList.contains('hidden')) return;
  if (e.key >= '0' && e.key <= '9') Auth.digit(parseInt(e.key));
  if (e.key === 'Backspace') Auth.backspace();
});
