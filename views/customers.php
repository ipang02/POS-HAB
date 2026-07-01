<!-- ══ VIEW: CUSTOMERS ═══════════════════════════════════════ -->
<section id="view-customers" class="view">

  <!-- Header -->
  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
    <div>
      <h2 class="text-lg font-bold text-white">Customers</h2>
      <p class="text-xs text-white/35 mt-0.5" id="cust-summary">Loading…</p>
    </div>
    <div class="flex gap-2 flex-wrap">
      <div class="relative">
        <i class="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-white/22 text-xs"></i>
        <input type="text" id="cust-search" placeholder="Search name or phone…"
          oninput="Customers.filter()" class="inp pl-9 py-2.5 text-sm" style="width:210px">
      </div>
      <button onclick="Customers.openAddModal()"
        class="btn-gold px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2">
        <i class="fa-solid fa-plus text-[11px]"></i> Add Customer
      </button>
    </div>
  </div>

  <!-- Tier Filter Tabs -->
  <div class="flex gap-2 mb-5 flex-wrap">
    <button class="tab-btn active" data-cust-tier="all" onclick="Customers.filterTier(this)">All</button>
    <button class="tab-btn" data-cust-tier="new" onclick="Customers.filterTier(this)">
      <i class="fa-solid fa-seedling mr-1.5 text-[10px]"></i>New (1 visit)
    </button>
    <button class="tab-btn" data-cust-tier="regular" onclick="Customers.filterTier(this)">
      <i class="fa-solid fa-user mr-1.5 text-[10px]"></i>Regular (2–9)
    </button>
    <button class="tab-btn" data-cust-tier="vip" onclick="Customers.filterTier(this)">
      <i class="fa-solid fa-crown mr-1.5 text-[10px]"></i>VIP (10+)
    </button>
  </div>

  <!-- Customer Cards Grid -->
  <div id="cust-grid" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6"></div>

  <!-- Empty State -->
  <div id="cust-empty" class="hidden text-center py-16">
    <i class="fa-solid fa-users text-4xl text-white/14 mb-3 block"></i>
    <p class="text-sm text-white/30">No customers found</p>
    <p class="text-xs text-white/20 mt-1">Add a customer manually or process a POS payment with a phone number</p>
  </div>

</section>
