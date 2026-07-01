<!-- ══ Sidebar ══════════════════════════════════════════════ -->
<aside id="sidebar" class="flex flex-col bg-ink-800 border-r border-white/5 h-screen fixed top-0 left-0 z-40">

  <!-- Logo -->
  <div class="flex items-center gap-3 px-4 py-[18px] border-b border-white/5 min-w-0 flex-shrink-0">
    <div class="w-9 h-9 rounded-xl btn-gold flex items-center justify-center flex-shrink-0 font-bold text-xs tracking-tight select-none">HAB</div>
    <div class="logo-txt lbl min-w-0">
      <div class="font-display font-bold text-white text-[15px] leading-tight tracking-wide">HAB</div>
      <div class="text-[10px] text-gold/65 font-semibold tracking-[.18em] uppercase">Barbershop</div>
    </div>
  </div>

  <!-- Navigation -->
  <nav class="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">

    <p class="nav-section-label px-3 pb-2 text-[10px] font-bold tracking-[.14em] uppercase text-white/20">Main</p>

    <a class="nav-item active" data-view="dashboard" data-tip="Dashboard" onclick="navigate('dashboard')">
      <i class="fa-solid fa-gauge nav-icon"></i>
      <span class="lbl">Dashboard</span>
    </a>

    <a class="nav-item" data-view="pos" data-tip="POS Cashier" onclick="navigate('pos')">
      <i class="fa-solid fa-cash-register nav-icon"></i>
      <span class="lbl">POS Cashier</span>
    </a>

    <a class="nav-item" data-view="services" data-tip="Services" onclick="navigate('services')">
      <i class="fa-solid fa-list-check nav-icon"></i>
      <span class="lbl">Services</span>
    </a>

    <a class="nav-item" data-view="appointments" data-tip="Appointments" onclick="navigate('appointments')">
      <i class="fa-solid fa-calendar-days nav-icon"></i>
      <span class="lbl">Appointments</span>
      <span class="badge-lbl lbl ml-auto bg-gold/15 text-gold text-[10px] px-2 py-0.5 rounded-full font-semibold" id="nav-appt-badge">3</span>
    </a>

    <a class="nav-item" data-view="customers" data-tip="Customers" onclick="navigate('customers')">
      <i class="fa-solid fa-users nav-icon"></i>
      <span class="lbl">Customers</span>
    </a>

    <p class="nav-section-label px-3 pt-3 pb-2 text-[10px] font-bold tracking-[.14em] uppercase text-white/20">Management</p>

    <a class="nav-item" data-view="barbers" data-tip="Barbers" onclick="navigate('barbers')">
      <i class="fa-solid fa-scissors nav-icon"></i>
      <span class="lbl">Barbers</span>
    </a>

    <a class="nav-item" data-view="analytics" data-tip="Analytics" onclick="navigate('analytics')">
      <i class="fa-solid fa-chart-line nav-icon"></i>
      <span class="lbl">Analytics</span>
    </a>

    <a class="nav-item" data-view="inventory" data-tip="Inventory" onclick="navigate('inventory')">
      <i class="fa-solid fa-boxes-stacked nav-icon"></i>
      <span class="lbl">Inventory</span>
      <span class="badge-lbl lbl ml-auto bg-red-500/18 text-red-400 text-[10px] px-2 py-0.5 rounded-full font-semibold hidden" id="nav-inv-badge">!</span>
    </a>

    <p class="nav-section-label px-3 pt-3 pb-2 text-[10px] font-bold tracking-[.14em] uppercase text-white/20">System</p>

    <a class="nav-item" data-view="settings" data-tip="Settings" onclick="navigate('settings')">
      <i class="fa-solid fa-gear nav-icon"></i>
      <span class="lbl">Settings</span>
    </a>

  </nav>

  <!-- Footer -->
  <div class="p-3 border-t border-white/5 flex-shrink-0">
    <div class="flex items-center gap-3 px-2 py-2">
      <div class="w-8 h-8 rounded-lg btn-gold flex items-center justify-center flex-shrink-0 text-[11px] font-bold select-none">A</div>
      <div class="lbl min-w-0">
        <div class="text-[13px] font-semibold text-white truncate">Admin</div>
        <div class="text-[11px] text-white/35 truncate">HAB Barbershop</div>
      </div>
    </div>
    <button onclick="toggleSidebar()"
      class="mt-1 w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-white/30 hover:text-white hover:bg-white/5 text-xs transition-all">
      <i class="fa-solid fa-chevron-left text-[10px] transition-transform duration-300" id="sb-icon"></i>
      <span class="lbl text-[11px]">Collapse</span>
    </button>
    <button id="sidebar-lock-btn" onclick="Auth.lock()"
      class="hidden mt-1 w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-white/30 hover:text-white hover:bg-white/5 text-xs transition-all">
      <i class="fa-solid fa-lock text-[10px]"></i>
      <span class="lbl text-[11px]">Lock Screen</span>
    </button>
  </div>

</aside>
