<!-- ══ VIEW: SERVICE MANAGEMENT ═════════════════════════════ -->
<section id="view-services" class="view">

  <!-- Header -->
  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
    <div>
      <h2 class="text-lg font-bold text-white">Service Management</h2>
      <p class="text-xs text-white/35 mt-0.5" id="svc-mgmt-summary">Loading…</p>
    </div>
    <div class="flex gap-2 flex-wrap">
      <div class="relative">
        <i class="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-white/22 text-xs"></i>
        <input type="text" id="svc-mgmt-search" placeholder="Search services…"
          oninput="ServicesMgmt.filter()" class="inp pl-9 py-2.5 text-sm" style="width:200px">
      </div>
      <select id="svc-mgmt-cat-filter" class="sel py-2.5 text-sm" style="width:140px" onchange="ServicesMgmt.filter()">
        <option value="all">All Categories</option>
        <option value="hair">Hair</option>
        <option value="beard">Beard</option>
        <option value="treatment">Treatment</option>
        <option value="package">Package</option>
      </select>
      <button onclick="ServicesMgmt.openAddModal()" class="btn-gold px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2">
        <i class="fa-solid fa-plus text-[11px]"></i> Add Service
      </button>
    </div>
  </div>

  <!-- Status filter -->
  <div class="flex gap-2 mb-5">
    <button class="tab-btn active" data-svc-status="all" onclick="ServicesMgmt.filterStatus(this)">All</button>
    <button class="tab-btn" data-svc-status="active" onclick="ServicesMgmt.filterStatus(this)">
      <i class="fa-solid fa-eye mr-1.5 text-[10px]"></i>Active (visible in POS)
    </button>
    <button class="tab-btn" data-svc-status="inactive" onclick="ServicesMgmt.filterStatus(this)">
      <i class="fa-solid fa-eye-slash mr-1.5 text-[10px]"></i>Hidden from POS
    </button>
  </div>

  <!-- Service Cards Grid -->
  <div id="svc-mgmt-grid" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-5"></div>

  <!-- Empty state -->
  <div id="svc-mgmt-empty" class="hidden text-center py-16">
    <i class="fa-solid fa-scissors text-4xl text-white/14 mb-3 block"></i>
    <p class="text-sm text-white/30">No services found</p>
  </div>

  <!-- Pricing Info Banner -->
  <div class="glass-gold rounded-2xl p-4 flex items-start gap-3 mt-2">
    <i class="fa-solid fa-circle-info text-gold text-base flex-shrink-0 mt-0.5"></i>
    <div>
      <p class="text-sm font-semibold text-gold">Price changes apply immediately to POS</p>
      <p class="text-xs text-white/45 mt-0.5">Editing a service here updates it live across the whole system. Hiding a service removes it from the POS cashier screen but keeps its transaction history.</p>
    </div>
  </div>

</section>
